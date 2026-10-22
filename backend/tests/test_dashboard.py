"""Recent-record summaries compared with actual frozen Sunrise SQL/handlers."""
import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.dashboard import _money, _pagination, _query, get_configuration_counts, get_record_update_log
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions

REFERENCE = json.loads((Path(__file__).parent / "fixtures/dashboard-reference.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", REFERENCE["money"])
def test_sqlite_printf_money_binary64_rounding(case):
    assert _money(case["value"]) == case["expected"]


@pytest.mark.parametrize("value,expected", [(None, 100), ("2.9", 2), ("-2.9", -2), ("", 0), ("0x10", 16), (-1, -1), (False, 0)])
def test_source_handler_pagination(value, expected):
    assert _pagination(value, 100) == expected


@pytest.mark.parametrize("value", [20000.5, "Infinity", 1e100])
def test_source_caps_large_limits_before_sql_datatype_validation(value):
    assert _pagination(value, 100, maximum=10000) == 10000


@pytest.mark.parametrize("value", [1.5, "NaN", "Infinity", "9000000000000000000000", [], {}])
def test_source_datatype_errors_have_explicit_target_validation(value):
    with pytest.raises((ValueError, TypeError)):
        _pagination(value, 100)


def test_union_compiles_for_sql_server_with_unicode_and_bound_cutoff():
    query = sa.select(_query("", REFERENCE["clock"] - 30 * 24 * 3600 * 1000))
    compiled = str(query.compile(dialect=mssql.dialect()))
    assert compiled.count("UNION ALL") == 8
    assert "NVARCHAR(max)" in compiled
    assert "datalength" in compiled
    assert "[recordDelete_timeMillis] IS NULL" in compiled
    assert "1792487142000" not in compiled


def seed(connection):
    identifiers = {}
    for item in REFERENCE["data"]:
        table, values = TABLES[item["table"]], dict(item["values"])
        identity = next((column.name for column in table.c if column.identity is not None), None)
        source_identity = values.pop(identity, None) if identity else None
        for column in table.c:
            if column.name not in values or values[column.name] is None:
                continue
            for foreign_key in column.foreign_keys:
                values[column.name] = identifiers[(foreign_key.column.table.name, foreign_key.column.name, values[column.name])]
        result = connection.execute(table.insert().values(**values))
        if identity:
            identifiers[(table.name, identity, source_identity)] = result.inserted_primary_key[0]
    return identifiers


def normalize(rows, identifiers):
    result = []
    for value in rows:
        row = dict(value)
        parent = "Contracts" if row["recordType"].startswith("contract") else "WorkOrders" if row["recordType"].startswith("workOrder") else "BurialSites"
        key = {"Contracts": "contractId", "WorkOrders": "workOrderId", "BurialSites": "burialSiteId"}[parent]
        row["recordId"] = next(source for (table, column, source), target in identifiers.items() if table == parent and column == key and target == row["recordId"])
        result.append(row)
    return result


@pytest.mark.parametrize("case", REFERENCE["queries"], ids=lambda case: (case["recordType"] or "all") + ":" + str(case["options"]))
def test_sql_update_log_matches_original_queries(sql_connection, case):
    connection, _ = sql_connection
    identifiers = seed(connection)
    options = { {"sortBy": "sort_by", "sortDirection": "sort_direction"}.get(key, key): value for key, value in case["options"].items() }
    result = get_record_update_log(connection, case["recordType"], current_millis=REFERENCE["clock"], **options)
    assert normalize(result, identifiers) == case["expected"]


def test_sql_zero_counters_soft_deleted_catalogues_and_minimum(sql_connection):
    connection, _ = sql_connection
    # Migration initializes some configuration tables. The source zero counter
    # is the minimum of seven table counts, independent of statuses/workOrders.
    before = get_configuration_counts(connection)
    assert before["configTables"] == min(before[key] for key in before if key not in ("burialSiteTypes", "contractTypes", "configTables"))
    table = TABLES["WorkOrderTypes"]
    connection.execute(table.update().values(recordDelete_timeMillis=1))
    assert get_configuration_counts(connection)["workOrderTypes"] == 0
    assert get_configuration_counts(connection)["configTables"] == 0


@pytest.fixture
def dashboard_app(migrated_sql_database, tmp_path, monkeypatch):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        identifiers = seed(connection)
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in ("reader", "admin")}},
        session_directory=tmp_path / "sessions", can_login=["reader", "admin"], is_admin=["admin"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine, app.state.test_identifiers = engine, identifiers
    monkeypatch.setattr("cemaris.dashboard.now_millis", lambda: REFERENCE["clock"])
    return app


def login(client, name):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", headers={"X-CSRF-Token": csrf}, json={"username": name, "password": "synthetic-password"})
    assert response.status_code == 200
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("case", REFERENCE["handlers"])
def test_http_reader_update_log_source_handler_pairs_and_legacy_path(dashboard_app, case):
    with TestClient(dashboard_app) as client:
        headers = login(client, "reader")
        for path in ("/api/dashboard/doGetRecordUpdateLog", "/dashboard/doGetRecordUpdateLog"):
            response = client.post(path, json=case["body"], headers=headers)
            assert response.status_code == 200, response.text
            assert normalize(response.json()["updateLog"], dashboard_app.state.test_identifiers) == case["expected"]["updateLog"]


def test_http_login_readonly_access_csrf_and_admin_counts(dashboard_app):
    with TestClient(dashboard_app) as client:
        assert client.get("/api/dashboard").status_code == 401
        headers = login(client, "reader")
        assert client.get("/api/dashboard").json() == {"configCounts": {}, "auditLogEnabled": True}
        assert client.post("/api/dashboard/doGetRecordUpdateLog", json={}).status_code == 403
        assert client.post("/api/dashboard/doGetRecordUpdateLog", json={}, headers=headers).status_code == 200
        login(client, "admin")
        result = client.get("/api/dashboard").json()
        assert result["configCounts"]["contractTypes"] == 1
        assert result["configCounts"]["configTables"] == 0


@pytest.mark.parametrize("body", [{"recordType": "unknown"}, {"limit": "bad"}, {"limit": 1.5}, {"offset": "Infinity"}, {"sortBy": "1;DROP TABLE Contracts", "recordType": "invalid"}])
def test_http_invalid_filters_are_controlled_without_sql_injection(dashboard_app, body):
    with TestClient(dashboard_app) as client:
        headers = login(client, "reader")
        assert client.post("/api/dashboard/doGetRecordUpdateLog", json=body, headers=headers).status_code == 400
