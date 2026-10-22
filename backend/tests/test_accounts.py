"""Source user-role cases and administration against disposable SQL Server."""

import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.accounts import (
    AddUserForm, CONFIG_ROLES, add_user, delete_user, get_local_user, get_user,
    get_users, update_user,
)
from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions, update_user_setting


REFERENCE = json.loads((Path(__file__).parent / "fixtures/auth-reference.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", REFERENCE["users"], ids=lambda case: case["username"])
def test_source_user_resolution(sql_connection, case):
    connection, _ = sql_connection
    roles = AuthSettings(_env_file=None, **{
        attr: REFERENCE["configUsers"]["users." + key] for key, attr in CONFIG_ROLES.items()
    })
    username = case["username"]
    if "local" in case:
        add_user(connection, username.lower(), case["local"], "test-synthetic")
        update_user(connection, username.lower(), case["local"], "test-synthetic")
    update_user_setting(connection, username, "apiKey", "synthetic:" + username)
    assert get_user(connection, username, roles) == case["expected"]


def test_soft_delete_restore_and_local_precedence(sql_connection):
    connection, _ = sql_connection
    roles = AuthSettings(_env_file=None, can_login=["synthetic"], is_admin=["synthetic"])
    assert add_user(connection, "synthetic", {"canUpdateContracts": True}, "creator")
    created = get_local_user(connection, "synthetic")
    assert not add_user(connection, "synthetic", {"isAdmin": True}, "other")
    assert get_user(connection, "SYNTHETIC", roles)["userProperties"] == {
        "canUpdateCemeteries": False, "canUpdateContracts": True,
        "canUpdateWorkOrders": False, "isAdmin": False,
    }
    assert update_user(connection, "synthetic", {"isActive": False}, "updater")
    assert get_user(connection, "synthetic", roles) is None
    assert delete_user(connection, "synthetic", "deleter")
    assert not delete_user(connection, "synthetic", "deleter")
    assert get_local_user(connection, "synthetic") is None
    assert get_user(connection, "synthetic", roles)["userProperties"]["isAdmin"] is True
    assert add_user(connection, "synthetic", {"canUpdateWorkOrders": True}, "restorer")
    restored = get_local_user(connection, "synthetic")
    assert restored["recordCreate_username"] == created["recordCreate_username"] == "creator"
    assert restored["recordCreate_timeMillis"] == created["recordCreate_timeMillis"]
    assert restored["recordUpdate_username"] == "restorer"
    assert restored["isActive"] is True and restored["canUpdateContracts"] is False
    assert [row["username"] for row in get_users(connection)] == ["synthetic"]
    assert not update_user(connection, "absent", {}, "updater")


def test_source_username_storage_is_not_lowercased_on_add(sql_connection):
    connection, _ = sql_connection
    assert add_user(connection, "MixedCase", {"isAdmin": True}, "creator")
    assert get_local_user(connection, "MixedCase")["isAdmin"] is True
    assert get_user(connection, "MixedCase", AuthSettings(_env_file=None, can_login=[], is_admin=[])) is None


def test_optional_audit_preserves_source_difference_rules(sql_connection):
    connection, _ = sql_connection
    assert add_user(connection, "audit-synthetic", {"isAdmin": True}, "creator", audit_enabled=True)
    assert update_user(connection, "audit-synthetic", {"isActive": True, "canUpdateContracts": True}, "updater", audit_enabled=True)
    assert delete_user(connection, "audit-synthetic", "deleter", audit_enabled=True)
    logs = [dict(row) for row in connection.execute(sa.select(TABLES["AuditLog"])).mappings()]
    by_field = {(row["updateType"], row["updateField"]): row for row in logs}
    assert len(logs) == 5
    assert json.loads(by_field["created", "*"]["toValue"])["isAdmin"] == 1
    assert by_field["created", "*"]["fromValue"] is None
    assert by_field["updated", "isAdmin"]["fromValue"] == "1"
    assert by_field["updated", "isAdmin"]["toValue"] == "0"
    assert by_field["updated", "canUpdateContracts"]["toValue"] == "1"
    # Deliberate source detail: update_username is logged, update_time is excluded.
    assert json.loads(by_field["updated", "recordUpdate_username"]["toValue"]) == "updater"
    assert by_field["deleted", "*"]["toValue"] is None
    assert all(row["mainRecordType"] == "user" and row["updateTable"] == "Users" for row in logs)
    assert all(row["logDate"] > 0 and row["logTime"] >= 0 for row in logs)


@pytest.mark.parametrize("value,expected", [(True, True), (False, False), ("1", True), ("0", False), ("true", False), ("false", False), (1, False)])
def test_source_form_permission_coercion(value, expected):
    assert AddUserForm(username="synthetic", isAdmin=value).isAdmin is expected


def login(client, username):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"x-csrf-token": csrf})
    assert response.status_code == 200, response.text
    return {"x-csrf-token": response.json()["csrfToken"]}


@pytest.fixture
def account_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    auth = AuthSettings(
        _env_file=None, type="plainText", config={"users": {"\\admin": "synthetic-password", "\\viewer": "synthetic-password"}},
        session_directory=tmp_path / "sessions", can_login=["admin", "viewer"],
        is_admin=["admin"], can_update=[],
    )
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
                     preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app


def test_admin_user_http_workflow_and_session_snapshot(account_app):
    with TestClient(account_app) as client:
        assert client.get("/api/admin/users").status_code == 401
        headers = login(client, "admin")
        response = client.get("/api/admin/users")
        assert response.status_code == 200
        assert response.json()["configUsers"]["canLogin"] == ["admin", "viewer"]
        assert response.json()["hasConfigUsers"] is True
        assert client.post("/api/admin/users/add", json={"username": "http-user"}).status_code == 403
        response = client.post("/api/admin/users/add", json={"username": "http-user", "canUpdateContracts": "1"}, headers=headers)
        assert response.status_code == 200
        assert any(user["username"] == "http-user" and user["canUpdateContracts"] for user in response.json()["users"])
        assert client.post("/api/admin/users/add", json={"username": "http-user"}, headers=headers).status_code == 400
        assert client.post("/api/admin/users/toggle", json={"username": "http-user", "permissionField": "recordDelete_timeMillis"}, headers=headers).status_code == 400
        response = client.post("/api/admin/users/toggle", json={"username": "http-user", "permissionField": "isAdmin"}, headers=headers)
        assert next(user for user in response.json()["users"] if user["username"] == "http-user")["isAdmin"] is True
        assert client.post("/api/admin/users/update", json={"username": "http-user", "isActive": True}, headers=headers).status_code == 200
        assert client.post("/api/admin/users/update", json={"username": "missing"}, headers=headers).status_code == 404
        assert client.post("/api/admin/users/delete", json={"username": " "}, headers=headers).status_code == 400
        assert client.post("/api/admin/users/delete", json={"username": "http-user"}, headers=headers).status_code == 200
        assert client.post("/api/admin/users/delete", json={"username": "http-user"}, headers=headers).status_code == 404

        # Source stores role snapshots: a later local override affects next login.
        assert client.post("/api/admin/users/add", json={"username": "admin"}, headers=headers).status_code == 200
        assert client.get("/api/admin/users").status_code == 200
        assert client.post("/api/logout", json={}, headers=headers).status_code == 200
        headers = login(client, "admin")
        assert client.get("/api/admin/users").status_code == 403
        assert client.post("/api/admin/users/add", json={"username": "denied"}, headers=headers).status_code == 403
    # Keep the shared module fixture clean for independent HTTP cases.
    with account_app.state.db_engine.begin() as connection:
        connection.execute(TABLES["Users"].delete())


def test_read_only_user_cannot_administer(account_app):
    with TestClient(account_app) as client:
        headers = login(client, "viewer")
        for path in ("/api/admin/users", "/api/admin/settings"):
            assert client.get(path).status_code == 403
        for path, payload in (("/api/admin/users/add", {"username": "denied"}), ("/api/admin/settings", {"settingKey": "defaults.city", "settingValue": "denied"})):
            assert client.post(path, json=payload, headers=headers).status_code == 403
        assert client.get("/api/user-settings").status_code == 200
