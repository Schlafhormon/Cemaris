"""Funeral home source rules, committed HTTP/roles and SQL Server persistence."""

import json
from datetime import datetime

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.funeral_homes import (
    add_funeral_home, delete_funeral_home, funeral_home_matches_search,
    get_adjacent_funeral_home_id, get_funeral_directors, get_funeral_home,
    get_funeral_homes, restore_funeral_home, update_funeral_home,
)
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions, update_setting

ACTOR = "synthetic-funeral"
FORM = {"funeralHomeName": "Synthetic Süd", "funeralHomeKey": "SYN-KEY", "funeralHomeAddress1": "1 Test Road",
        "funeralHomeAddress2": "[X] %_", "funeralHomeCity": "Synthetic City", "funeralHomeProvince": "BB",
        "funeralHomePostalCode": "a1b 2c3", "funeralHomePhoneNumber": "000-0000"}
HOMES, CONTRACTS = TABLES["FuneralHomes"], TABLES["Contracts"]


@pytest.mark.parametrize("search,expected", [("SÜD TEST", True), ("%_ [x]", True), ("synthetic city", False),
    ("SYN-KEY", False), ("000-0000", False), ("", True), ("  süd  road ", True), ("sud", False)])
def test_literal_browser_filter_only_searches_name_and_address(search, expected):
    assert funeral_home_matches_search(FORM, search) is expected


@pytest.mark.parametrize("city,province", [
    ("Bad Homburg vor der Höhe", "Baden-Württemberg"),
    ("Synthetischer Musterort ".ljust(100, "X"), "Synthetisches Bundesland ".ljust(100, "X")),
])
def test_german_funeral_home_city_and_state_round_trip_up_to_100_characters(sql_connection, city, province):
    connection, _ = sql_connection
    identifier = add_funeral_home(connection, {**FORM, "funeralHomeCity": city,
        "funeralHomeProvince": province, "funeralHomePostalCode": "01234"}, ACTOR)
    row = get_funeral_home(connection, identifier)
    assert row["funeralHomeCity"] == city and row["funeralHomeProvince"] == province
    assert row["funeralHomePostalCode"] == "01234"


def test_sql_funeral_crud_uppercase_immutable_key_and_optional_audit(sql_connection, monkeypatch):
    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(2026, 10, 20, 12, 34, 56).astimezone(tz)

    monkeypatch.setattr("cemaris.funeral_homes.datetime", Clock)
    connection, _ = sql_connection
    identifier = add_funeral_home(connection, FORM, ACTOR, audit_enabled=True)
    row = get_funeral_home(connection, identifier)
    assert row["funeralHomePostalCode"] == "A1B 2C3"
    assert row["recordCreate_username"] == row["recordUpdate_username"] == ACTOR
    assert row["recordCreate_timeMillis"] == row["recordUpdate_timeMillis"] > 0
    assert update_funeral_home(connection, {**FORM, "funeralHomeId": identifier, "funeralHomeName": "Edited", "funeralHomeKey": "IGNORED"}, "editor", audit_enabled=True)
    row = get_funeral_home(connection, identifier)
    assert row["funeralHomeKey"] == "SYN-KEY" and row["funeralHomeName"] == "Edited"
    assert not update_funeral_home(connection, {**FORM, "funeralHomeId": -1}, ACTOR)
    assert delete_funeral_home(connection, identifier, ACTOR, audit_enabled=True)
    assert get_funeral_home(connection, identifier) is None
    assert get_funeral_home(connection, identifier, True)["recordDelete_username"] == ACTOR
    assert not get_funeral_homes(connection)
    assert restore_funeral_home(connection, identifier, "restorer", audit_enabled=True)
    assert not restore_funeral_home(connection, identifier, ACTOR, audit_enabled=True)
    assert get_funeral_home(connection, identifier)["recordUpdate_username"] == "restorer"
    logs = list(connection.execute(sa.select(TABLES["AuditLog"])).mappings())
    assert all(row["logDate"] == 20261020 and row["logTime"] == 1234 for row in logs)
    assert {row["updateType"] for row in logs} >= {"created", "updated", "deleted"}
    assert json.loads(logs[0]["toValue"])["funeralHomePostalCode"] == "A1B 2C3"
    assert not any(row["updateField"] == "recordUpdate_timeMillis" for row in logs)


@pytest.mark.parametrize("funeral,end,deleted,blocked,count", [
    (20261020, None, False, True, 1), (20261021, 20261020, False, True, 1),
    (20261020, 20261019, False, False, 1), (20261019, None, False, False, 0),
    (None, None, False, False, 0), (20261021, None, True, False, 0),
    (20261021, 20261019, False, False, 1),
])
def test_list_counts_and_delete_guard_have_different_end_date_rules(sql_connection, funeral, end, deleted, blocked, count):
    connection, name = sql_connection
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    original_count = connection.scalar(sa.select(sa.func.count()).select_from(CONTRACTS))
    connection.execute(CONTRACTS.update().values(funeralDate=funeral, contractEndDate=end, recordDelete_timeMillis=1 if deleted else None))
    home = get_funeral_homes(connection, today=20261020)[0]
    assert home["upcomingFuneralCount"] == count
    assert "upcomingFuneralCount" not in get_funeral_homes(connection, False)[0]
    assert delete_funeral_home(connection, ids["funeral_home"], ACTOR, today=20261020) is not blocked
    assert (get_funeral_home(connection, ids["funeral_home"]) is not None) is blocked
    assert connection.scalar(sa.select(sa.func.count()).select_from(CONTRACTS)) == original_count


def test_funeral_name_navigation_skips_equal_names_and_deleted_rows(sql_connection):
    connection, _ = sql_connection
    first = add_funeral_home(connection, {**FORM, "funeralHomeName": "A"}, ACTOR)
    add_funeral_home(connection, {**FORM, "funeralHomeName": "A"}, ACTOR)
    middle = add_funeral_home(connection, {**FORM, "funeralHomeName": "B"}, ACTOR)
    last = add_funeral_home(connection, {**FORM, "funeralHomeName": "C"}, ACTOR)
    assert get_adjacent_funeral_home_id(connection, first, "next") == middle
    assert get_adjacent_funeral_home_id(connection, last, "previous") == middle
    delete_funeral_home(connection, middle, ACTOR)
    assert get_adjacent_funeral_home_id(connection, first, "next") == last
    assert get_adjacent_funeral_home_id(connection, first, "previous") is None
    assert get_adjacent_funeral_home_id(connection, -1, "next") is None


def test_trailing_spaces_remain_distinct_in_director_groups_and_name_navigation(sql_connection):
    connection, dbname = sql_connection
    ids = load_synthetic_fixtures(connection, expected_database=dbname).ids
    original = dict(connection.execute(sa.select(CONTRACTS).where(CONTRACTS.c.contractId == ids["contract"])).mappings().one())
    original.pop("contractId")
    connection.execute(CONTRACTS.update().values(funeralDirectorName="Ada"))
    connection.execute(CONTRACTS.insert().values(**{**original, "funeralDirectorName": "Ada "}))
    assert get_funeral_directors(connection, ids["funeral_home"]) == ["Ada", "Ada "]
    first = add_funeral_home(connection, {**FORM, "funeralHomeName": "A"}, ACTOR)
    second = add_funeral_home(connection, {**FORM, "funeralHomeName": "A "}, ACTOR)
    assert get_adjacent_funeral_home_id(connection, first, "next") == second
    assert get_adjacent_funeral_home_id(connection, second, "previous") == first


def test_funeral_director_suggestions_use_active_contract_frequency_and_name_limit(sql_connection):
    connection, dbname = sql_connection
    ids = load_synthetic_fixtures(connection, expected_database=dbname).ids
    original = dict(connection.execute(sa.select(CONTRACTS).where(CONTRACTS.c.contractId == ids["contract"])).mappings().one())
    original.pop("contractId")
    connection.execute(CONTRACTS.update().values(funeralDirectorName="A"))
    for name in ["A", "B", "B", "", "   ", None, *[f"Z{i:02}" for i in range(25)]]:
        connection.execute(CONTRACTS.insert().values(**{**original, "funeralDirectorName": name}))
    connection.execute(CONTRACTS.insert().values(**{**original, "funeralDirectorName": "DELETED", "recordDelete_timeMillis": 1}))
    result = get_funeral_directors(connection, ids["funeral_home"])
    assert len(result) == 20 and result[:2] == ["A", "B"]
    assert not any(name in result for name in ("", "   ", None, "DELETED"))


@pytest.fixture
def funeral_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        connection.execute(TABLES["AuditLog"].delete())
        connection.execute(HOMES.delete())
    names = ["contract", "admin", "reader", "cemetery", "updater"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"],
        can_update_contracts=["contract"], can_update_cemeteries=["cemetery"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app


def login(client, username="contract"):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("username,status", [("contract", 200), ("updater", 200), ("reader", 403), ("admin", 403), ("cemetery", 403)])
def test_http_independent_roles_csrf_and_create_defaults(funeral_app, username, status):
    with funeral_app.state.db_engine.begin() as connection:
        update_setting(connection, "defaults.city", "Test City")
        update_setting(connection, "defaults.province", "BB")
    with TestClient(funeral_app) as client:
        assert client.get("/api/funeral-homes").status_code == 401
        headers = login(client, username)
        response = client.get("/api/funeral-homes/options")
        assert response.json()["funeralHome"]["funeralHomeCity"] == "Test City"
        assert client.get("/api/funeral-homes/new").status_code == status
        assert client.post("/api/funeral-homes", json=FORM).status_code == 403
        response = client.post("/api/funeral-homes", json=FORM, headers=headers)
        assert response.status_code == status, response.text
        if status == 200:
            identifier = response.json()["funeralHomeId"]
            assert client.get(f"/api/funeral-homes/{identifier}").json()["funeralHome"]["funeralHomePostalCode"] == "A1B 2C3"


def test_http_crud_deleted_visibility_admin_restore_audit_isolation_and_validation(funeral_app):
    with TestClient(funeral_app) as client:
        headers = login(client)
        identifier = client.post("/api/funeral-homes", json=FORM, headers=headers).json()["funeralHomeId"]
        url = f"/api/funeral-homes/{identifier}"
        assert client.post(url + "/update", json={**FORM, "funeralHomeName": "Edited"}, headers=headers).json()["success"]
        assert client.get(url).json()["funeralHome"]["funeralHomeName"] == "Edited"
        for changes in ({"funeralHomeName": "😀" * 101}, {"funeralHomePostalCode": None}, {"funeralHomeProvince": "X" * 101}, {"funeralHomeCity": "X" * 101}, {"funeralHomePhoneNumber": []}):
            assert client.post(url + "/update", json={**FORM, **changes}, headers=headers).status_code == 400
            assert client.get(url).json()["funeralHome"]["funeralHomeName"] == "Edited"
        path = "/api/funeralHomes/doGetRecordAuditLog"
        form = {"mainRecordType": "funeralHome", "mainRecordId": str(identifier), "limit": "1", "offset": 0}
        result = client.post(path, json=form, headers=headers).json()
        assert result["count"] >= 2 and len(result["auditLogEntries"]) == 1
        assert client.post(path, json={**form, "mainRecordType": "contract"}, headers=headers).status_code == 403
        assert client.post(path, json={**form, "limit": "NaN"}, headers=headers).status_code == 400
        assert client.post(url + "/delete", json={}, headers=headers).json()["success"]
        assert client.get(url).status_code == 200
        assert client.get(url + "/edit").status_code == 404
        assert client.post(url + "/restore", json={}, headers=headers).status_code == 403
        headers = login(client, "reader")
        assert client.get(url).status_code == 404
        assert not client.get("/api/funeral-homes").json()["funeralHomes"]
        assert client.post(path, json=form, headers=headers).status_code == 403
        headers = login(client, "admin")
        assert client.post(url + "/restore", json={}, headers=headers).json()["success"]
        assert client.post(url + "/restore", json={}, headers=headers).status_code == 400
        assert client.get(url).status_code == 200
        assert client.get(url + "/next").json() == {"funeralHomeId": None}
        assert client.get(url + "/other").status_code == 404
