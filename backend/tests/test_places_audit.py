"""Verify per-record audit isolation and independent source roles on SQL Server."""

from datetime import datetime

from fastapi.testclient import TestClient
import pytest

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


@pytest.mark.parametrize("module_name", ["accounts", "catalogs"])
def test_shared_audit_writers_follow_source_hhmm(sql_connection, monkeypatch, module_name):
    # The source utils-datetime package encodes 12:34:56 as 1234, not 123456.
    # This shared storage contract is also consumed by the new record dialogs.
    from cemaris import accounts, catalogs

    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(2026, 10, 20, 12, 34, 56).astimezone(tz)

    module = accounts if module_name == "accounts" else catalogs
    monkeypatch.setattr(module, "datetime", FixedDateTime)
    connection, _ = sql_connection
    if module_name == "accounts":
        accounts.add_user(connection, "synthetic-hhmm", {}, "synthetic", audit_enabled=True)
    else:
        catalogs.add_catalog_record(connection, "burialSiteStatuses", {"burialSiteStatus": "Synthetic HHMM"}, "synthetic", audit_enabled=True)
    logs = connection.execute(TABLES["AuditLog"].select()).mappings().all()
    assert logs and all(row["logDate"] == 20261020 and row["logTime"] == 1234 for row in logs)


@pytest.fixture
def audit_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        connection.execute(TABLES["AuditLog"].delete())
        for index, (record_type, record_id) in enumerate([("cemetery", "1"), ("cemetery", "1"), ("cemetery", "2"), ("burialSite", "1")]):
            connection.execute(TABLES["AuditLog"].insert().values(
                logMillis=100 + index, logDate=20261020, logTime=1200,
                mainRecordType=record_type, mainRecordId=record_id,
                updateTable="Synthetic", updateField="name", updateType="updated",
                updateUsername="synthetic", fromValue='"before"', toValue='"after"',
            ))
    names = ["cemetery", "admin", "reader", "contract"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}}, session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update_cemeteries=["cemetery"], can_update_contracts=["contract"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app


def login(client, username):
    csrf = client.get("/api/session").json()["csrfToken"]
    result = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
    assert result.status_code == 200, result.text
    return {"X-CSRF-Token": result.json()["csrfToken"]}


@pytest.mark.parametrize("username,status", [("cemetery", 200), ("admin", 403), ("reader", 403), ("contract", 403)])
def test_audit_dialog_role_and_csrf(audit_app, username, status):
    with TestClient(audit_app) as client:
        headers = login(client, username)
        body = {"mainRecordType": "cemetery", "mainRecordId": "1"}
        path = "/api/cemeteries/doGetRecordAuditLog"
        assert client.post(path, json=body).status_code == 403
        result = client.post(path, json=body, headers=headers)
        assert result.status_code == status, result.text
        if status == 200:
            assert result.json()["count"] == 2


def test_audit_type_guard_pagination_and_disabled_route(audit_app):
    with TestClient(audit_app) as client:
        headers = login(client, "cemetery")
        path = "/api/cemeteries/doGetRecordAuditLog"
        body = {"mainRecordType": "cemetery", "mainRecordId": " 1 ", "limit": "1.9", "offset": "1"}
        result = client.post(path, json=body, headers=headers).json()
        assert result["count"] == 2 and result["offset"] == 1
        assert [row["logMillis"] for row in result["auditLogEntries"]] == [100]
        assert result["auditLogEntries"][0]["logDateString"] == "2026-10-20"
        assert result["auditLogEntries"][0]["logTimePeriodString"] == "12:00 p.m."
        body.update(limit=-1, offset=-1)
        assert len(client.post(path, json=body, headers=headers).json()["auditLogEntries"]) == 2
        body["mainRecordType"] = "burialSite"
        assert client.post(path, json=body, headers=headers).status_code == 403
        assert client.post(path, json={}, headers=headers).status_code == 403
        result = client.post("/api/burialSites/doGetRecordAuditLog", json=body, headers=headers).json()
        assert result["count"] == 1 and result["auditLogEntries"][0]["mainRecordType"] == "burialSite"
        for invalid in ["NaN", "Infinity", 2**64, {}, []]:
            assert client.post(path, json={"mainRecordType": "cemetery", "limit": invalid}, headers=headers).status_code == 400
        audit_app.state.preference_options.audit_log_enabled = False
        assert client.post(path, json=body, headers=headers).status_code == 404
