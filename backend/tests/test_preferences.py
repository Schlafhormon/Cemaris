"""Settings defaults, string/history semantics, API keys and SQL persistence."""

import json
import math
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import (
    PreferenceOptions, SETTING_PROPERTIES, get_api_keys, get_csrf_secret,
    get_setting_value, get_settings, get_user_settings,
    get_work_order_work_day_ranges, is_api_key_valid, reset_api_key,
    update_setting, update_user_setting,
)


REFERENCE = json.loads((Path(__file__).parent / "fixtures/auth-reference.json").read_text(encoding="utf-8"))


def test_product_setting_descriptors_retain_storage_keys_and_localize_labels():
    source = {row["settingKey"]: row for row in REFERENCE["settingProperties"]}
    settings = {row["settingKey"]: row for row in SETTING_PROPERTIES}
    assert set(settings) == set(source) - {"integrations.portal.syncError", "pdfPuppeteer.browserInstallAttempted"}
    assert len(SETTING_PROPERTIES) == 24
    assert sum(setting["isUserConfigurable"] for setting in SETTING_PROPERTIES) == 23
    assert settings["aliases.externalReceiptNumber"]["defaultValue"] == "Belegnummer"
    assert settings["aliases.workOrderOpenDate"]["defaultValue"] == "Auftragsdatum"
    for key, descriptor in settings.items():
        assert descriptor["settingName"] and descriptor["description"]
        assert descriptor["settingNameEn"] == source[key]["settingName"]
        assert descriptor["descriptionEn"] == source[key]["description"]
        assert descriptor["type"] == source[key]["type"]
        assert descriptor["isUserConfigurable"] == source[key]["isUserConfigurable"]


def test_setting_string_values_defaults_history_and_unknown_keys(sql_connection):
    connection, _ = sql_connection
    assert get_setting_value(connection, "burialSiteTypes.bodyCapacityMaxDefault") == "2"
    assert get_setting_value(connection, "unknown") == ""
    assert update_setting(connection, "burialSiteTypes.bodyCapacityMaxDefault", " 03.7 ")
    assert get_setting_value(connection, "burialSiteTypes.bodyCapacityMaxDefault") == " 03.7 "
    assert update_setting(connection, "burialSiteTypes.bodyCapacityMaxDefault", "")
    row = next(setting for setting in get_settings(connection) if setting["settingKey"] == "burialSiteTypes.bodyCapacityMaxDefault")
    assert row["settingValue"] == "" and row["previousSettingValue"] == " 03.7 "
    assert get_setting_value(connection, "burialSiteTypes.bodyCapacityMaxDefault") == "2"
    assert update_setting(connection, "internal.unknown", "retained")
    assert not any(setting["settingKey"] == "internal.unknown" for setting in get_settings(connection))
    assert connection.scalar(sa.select(TABLES["CemarisSettings"].c.settingValue).where(TABLES["CemarisSettings"].c.settingKey == "internal.unknown")) == "retained"


def test_work_day_ranges_match_number_truncation_and_blank_defaults(sql_connection):
    connection, _ = sql_connection
    ranges = get_work_order_work_day_ranges(connection)
    assert ranges[0] == {"startHour": -1, "endHour": -1}
    assert ranges[1] == {"startHour": 8, "endHour": 17}
    assert ranges[6] == {"startHour": -1, "endHour": -1}
    update_setting(connection, "workOrder.workDay.0.startHour", "-2.9")
    update_setting(connection, "workOrder.workDay.0.endHour", "nonnumeric")
    update_setting(connection, "workOrder.workDay.1.startHour", "")
    ranges = get_work_order_work_day_ranges(connection)
    assert ranges[0]["startHour"] == -2
    assert math.isnan(ranges[0]["endHour"])
    assert ranges[1]["startHour"] == 8


def test_csrf_secret_is_initialized_once_in_application_settings(sql_connection):
    connection, _ = sql_connection
    first = get_csrf_secret(connection)
    assert len(first) == 128 and int(first, 16) > 0
    assert get_csrf_secret(connection) == first
    update_setting(connection, "application.csrfSecret", "explicit-synthetic-secret")
    assert get_csrf_secret(connection) == "explicit-synthetic-secret"


def test_api_key_generation_reset_history_and_exact_config_membership(sql_connection):
    connection, _ = sql_connection
    settings = get_user_settings(connection, "synthetic")
    first = settings["apiKey"]
    assert first.startswith("synthetic-")
    assert get_user_settings(connection, "synthetic")["apiKey"] == first
    replacement = reset_api_key(connection, "synthetic")
    assert replacement != first
    stored = connection.execute(sa.select(TABLES["UserSettings"]).where(TABLES["UserSettings"].c.username == "synthetic")).mappings().one()
    assert stored["previousSettingValue"] == first
    roles = SimpleNamespace(can_login=["synthetic"])
    assert is_api_key_valid(connection, replacement, roles)
    assert not is_api_key_valid(connection, first, roles)
    assert not is_api_key_valid(connection, None, roles)
    assert not is_api_key_valid(connection, replacement, SimpleNamespace(can_login=["SYNTHETIC"]))
    local_key = get_user_settings(connection, "local-only")["apiKey"]
    assert not is_api_key_valid(connection, local_key, roles)
    assert get_api_keys(connection, ["synthetic"]) == {"synthetic": replacement}
    with pytest.raises(ValueError, match="empty user"):
        reset_api_key(connection, "")


def test_settings_commit_survive_connection_and_engine_recreation(migrated_sql_database):
    engine, _ = migrated_sql_database
    update_setting(engine, "defaults.city", "Synthetischer Ort Ü")
    api_key = get_user_settings(engine, "persisted-user")["apiKey"]
    engine.dispose()
    assert get_setting_value(engine, "defaults.city") == "Synthetischer Ort Ü"
    assert get_user_settings(engine, "persisted-user")["apiKey"] == api_key


def test_settings_http_admin_update_user_and_reset(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\admin": "synthetic-password"}},
                        session_directory=tmp_path / "sessions", can_login=["admin"], is_admin=["admin"])
    options = PreferenceOptions(_env_file=None)
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=options)
    app.state.db_engine = engine
    with TestClient(app) as client:
        csrf = client.get("/api/session").json()["csrfToken"]
        response = client.post("/api/login", json={"username": "admin", "password": "synthetic-password"}, headers={"x-csrf-token": csrf})
        assert response.status_code == 200, response.text
        headers = {"x-csrf-token": response.json()["csrfToken"]}
        first_key = response.json()["user"]["userSettings"]["apiKey"]
        settings = client.get("/api/admin/settings").json()["settings"]
        assert len(settings) == 23
        assert all(setting["isUserConfigurable"] for setting in settings)
        assert next(row for row in settings if row["settingKey"] == "defaults.city")["settingName"] == "Vorgaben – Ort"
        english = client.get("/api/admin/settings?lng=en").json()["settings"]
        assert next(row for row in english if row["settingKey"] == "defaults.city")["settingName"] == "Defaults - City"
        assert not any(setting["settingKey"] == "application.csrfSecret" for setting in settings)
        assert client.post("/api/admin/settings", json={"settingKey": "defaults.city", "settingValue": "SQL HTTP Ü"}, headers=headers).json() == {"success": True}
        assert get_setting_value(engine, "defaults.city") == "SQL HTTP Ü"
        assert client.post("/api/admin/settings", json={"settingKey": "defaults.city", "settingValue": "x" * 501}, headers=headers).status_code == 422
        response = client.get("/api/user-settings")
        assert response.json() == {"userSettings": {"apiKey": first_key}}
        response = client.post("/api/user-settings/reset-api-key", json={}, headers=headers)
        new_key = response.json()["apiKey"]
        assert response.json()["success"] is True and new_key != first_key
        assert client.get("/api/session").json()["user"]["userSettings"]["apiKey"] == new_key
        client.post("/api/logout", json={}, headers=headers)
        assert client.get("/api/user-settings").status_code == 401
