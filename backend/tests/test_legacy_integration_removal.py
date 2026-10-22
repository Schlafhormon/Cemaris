"""Cemaris upgrade removes retired adapters without losing municipal data."""

from copy import deepcopy
import json

from alembic import command
from fastapi.testclient import TestClient
from sqlalchemy import select

from cemaris.auth import FileSessionStore, public_user
from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from conftest import migration_config


LEGACY_USER = {
    "username": "synthetic",
    "userProperties": {"isAdmin": True, "canUpdateContracts": True},
    "userSettings": {
        "apiKey": "synthetic-local-key",
        "consignoCloud.username": "synthetic@example.invalid",
        "consignoCloud.thirdPartyApplicationPassword": "synthetic-retired-secret",
    },
}


def test_retired_routes_and_workers_are_absent_even_with_legacy_environment(monkeypatch):
    for key in ("CONSIGNO_CLOUD", "DYNAMICS_GP", "PORTAL", "NTFY"):
        monkeypatch.setenv("CEMARIS_" + key + "_ENABLED", "true")
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=AuthSettings(_env_file=None))
    paths = {route.path for route in app.routes if hasattr(route, "path")}
    assert not any(any(key in path.lower() for key in ("consigno", "portal", "dynamics")) for path in paths)
    for name in ("consigno_cloud_task", "portal_tasks", "dynamics_gp", "notifications"):
        assert not hasattr(app.state, name)
    # No old environment variable may activate an outbound integration at startup.
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
        for path in ("/api/contracts/1/consigno-cloud", "/api/portal", "/api/user-settings/consigno-cloud"):
            assert client.get(path).status_code == 404


def test_old_session_settings_are_removed_before_api_exposure_and_resaving(tmp_path):
    original = deepcopy(LEGACY_USER)
    assert public_user(original)["userSettings"] == {"apiKey": "synthetic-local-key"}
    assert original == LEGACY_USER
    store = FileSessionStore(tmp_path, 60_000, clock=lambda: 1000)
    sid, session = store.new()
    session["user"] = deepcopy(LEGACY_USER)
    store.save(sid, session)
    loaded = store.load(sid)
    assert loaded["user"]["userSettings"] == {"apiKey": "synthetic-local-key"}
    store.save(sid, loaded)
    saved = json.loads((tmp_path / (sid + ".json")).read_text())
    assert saved["user"]["userSettings"] == {"apiKey": "synthetic-local-key"}
    assert "synthetic-retired-secret" not in json.dumps(saved)


def test_user_settings_api_ignores_retired_session_preferences(tmp_path):
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=AuthSettings(
        _env_file=None, session_directory=tmp_path,
    ))
    store = app.state.session_store
    sid, session = store.new()
    session["user"] = deepcopy(LEGACY_USER)
    store.save(sid, session)
    with TestClient(app) as client:
        client.cookies.set("cemaris-user-sid", sid)
        response = client.get("/api/user-settings")
        assert response.json() == {"userSettings": {"apiKey": "synthetic-local-key"}}
        assert client.get("/api/session").json()["user"]["userSettings"] == {"apiKey": "synthetic-local-key"}


def test_upgrade_erases_only_retired_credentials_and_portal_error(disposable_sql_database):
    with disposable_sql_database() as (engine, _):
        with engine.begin() as connection:
            config = migration_config(connection)
            command.upgrade(config, "0001")
            users = TABLES["UserSettings"]
            for key, value in LEGACY_USER["userSettings"].items():
                connection.execute(users.insert().values(username="synthetic", settingKey=key,
                    settingValue=value, previousSettingValue="synthetic-previous-value", recordUpdate_timeMillis=1))
            connection.execute(users.insert().values(username="synthetic", settingKey="ConsignOCloud.legacy",
                settingValue="synthetic", recordUpdate_timeMillis=1))
            settings = TABLES["CemarisSettings"]
            for key in ("defaults.city", "integrations.portal.syncError"):
                connection.execute(settings.insert().values(settingKey=key, settingValue="synthetic", recordUpdate_timeMillis=1))
            command.upgrade(config, "head")
            command.upgrade(config, "head")
            assert dict(connection.execute(select(users.c.settingKey, users.c.settingValue)).all()) == {"apiKey": "synthetic-local-key"}
            assert dict(connection.execute(select(settings.c.settingKey, settings.c.settingValue)).all()) == {"defaults.city": "synthetic"}
            command.downgrade(config, "0001")
            assert dict(connection.execute(select(users.c.settingKey, users.c.settingValue)).all()) == {"apiKey": "synthetic-local-key"}
