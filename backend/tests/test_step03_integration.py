"""HTTP authentication and permissions with committed disposable SQL Server data."""

import pytest
import sqlalchemy as sa
from fastapi import Depends
from fastapi.testclient import TestClient

from cemaris.auth import require_admin, require_update_cemeteries, require_update_contracts, require_update_work_orders
from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLE_Users, TABLE_UserSettings, TABLE_CemarisSettings, TABLE_AuditLog
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


@pytest.fixture
def live_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    # Only this module's newly created database is used. Existing development
    # and administrative databases are never fixtures.
    with engine.begin() as connection:
        for table in (TABLE_UserSettings, TABLE_Users, TABLE_CemarisSettings, TABLE_AuditLog):
            connection.execute(table.delete())
    auth = AuthSettings(
        _env_file=None, type="plainText", session_directory=tmp_path / "sessions",
        config={"users": {"\\" + name: "synthetic-password" for name in ("admin", "reader", "updater", "local", "outsider")}},
        can_login=["admin", "reader", "updater"], can_update=["updater"], is_admin=["admin"],
        do_keep_alive=True,
    )
    settings = Settings(_env_file=None, environment="test", database_url=engine.url.render_as_string(hide_password=False))
    preferences = PreferenceOptions(_env_file=None, audit_log_enabled=True)
    app = create_app(settings, auth_settings=auth, preference_options=preferences)
    app.state.db_engine = engine
    for name, dependency in {"admin": require_admin, "cemeteries": require_update_cemeteries,
                             "contracts": require_update_contracts, "work-orders": require_update_work_orders}.items():
        def protected(user=Depends(dependency)):
            return {"username": user["username"]}
        app.add_api_route("/api/_test/permission/" + name, protected, methods=["GET"])
    with TestClient(app) as client:
        yield app, client, engine, settings, auth, preferences


def login(client, username="admin"):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", headers={"X-CSRF-Token": token},
                           json={"username": username, "password": "synthetic-password", "redirect": "/admin/settings"})
    return response


def post(client, path, body=None):
    token = client.get("/api/session").json()["csrfToken"]
    return client.post(path, headers={"X-CSRF-Token": token}, json=body or {})


def test_sql_login_requires_authentication_and_authorization_and_rotates_session(live_app):
    app, client, engine, *_ = live_app
    first = client.get("/api/session").json()
    old_sid = client.cookies.get("cemaris-user-sid")
    assert client.post("/api/login", json={"username": "admin", "password": "synthetic-password"}).status_code == 403
    # Correct password but absent authorization does not create a logged-in user.
    assert login(client, "outsider").status_code == 401
    response = login(client)
    assert response.status_code == 200 and response.json()["redirect"] == "/admin/settings"
    assert response.json()["user"]["username"] == "admin"
    assert client.cookies.get("cemaris-user-sid") != old_sid
    assert response.json()["csrfToken"] != first["csrfToken"]
    assert "HttpOnly" in response.headers["set-cookie"] and "SameSite=strict" in response.headers["set-cookie"]
    assert client.post("/api/admin/settings", headers={"X-CSRF-Token": first["csrfToken"]},
                       json={"settingKey": "defaults.city", "settingValue": "wrong"}).status_code == 403
    with engine.connect() as connection:
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLE_UserSettings)) == 1


@pytest.mark.parametrize("username,expected", [("admin", [200, 403, 403, 403]),
                                               ("reader", [403, 403, 403, 403]),
                                               ("updater", [403, 200, 200, 200])])
def test_source_roles_remain_independent(live_app, username, expected):
    _, client, *_ = live_app
    assert login(client, username).status_code == 200
    assert [client.get("/api/_test/permission/" + name).status_code
            for name in ("admin", "cemeteries", "contracts", "work-orders")] == expected
    if username != "admin":
        assert client.get("/api/admin/users").status_code == 403
        assert client.get("/api/admin/settings").status_code == 403
        for path, body in [("/api/admin/users/add", {"username": "denied"}),
                           ("/api/admin/users/update", {"username": "reader"}),
                           ("/api/admin/users/toggle", {"username": "reader", "permissionField": "isAdmin"}),
                           ("/api/admin/users/delete", {"username": "reader"}),
                           ("/api/admin/settings", {"settingKey": "defaults.city", "settingValue": "denied"})]:
            assert post(client, path, body).status_code == 403


def test_admin_crud_local_override_setting_history_and_audit_commit(live_app):
    _, client, engine, *_ = live_app
    assert login(client).status_code == 200
    assert post(client, "/api/admin/users/add", {"username": "local", "canUpdateContracts": True}).json()["success"]
    assert post(client, "/api/admin/users/add", {"username": "local"}).status_code == 400
    assert post(client, "/api/admin/users/toggle", {"username": "local", "permissionField": "isAdmin"}).json()["success"]
    assert post(client, "/api/admin/users/update", {"username": "local", "isActive": True, "canUpdateWorkOrders": True}).json()["success"]
    for value in ("Synthetische Stadt", "Änderung", ""):
        assert post(client, "/api/admin/settings", {"settingKey": "defaults.city", "settingValue": value}).json()["success"]
    assert post(client, "/api/logout").json()["success"]
    assert login(client, "local").status_code == 200
    assert client.get("/api/_test/permission/work-orders").status_code == 200
    assert client.get("/api/admin/users").status_code == 403
    key = client.get("/api/user-settings").json()["userSettings"]["apiKey"]
    assert post(client, "/api/user-settings/reset-api-key").json()["apiKey"] != key
    with engine.connect() as connection:
        stored = connection.execute(sa.select(TABLE_CemarisSettings).where(TABLE_CemarisSettings.c.settingKey == "defaults.city")).mappings().one()
        assert stored["settingValue"] == "" and stored["previousSettingValue"] == "Änderung"
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLE_AuditLog)) >= 3
    post(client, "/api/logout")
    login(client)
    assert post(client, "/api/admin/users/delete", {"username": "local"}).json()["success"]
    assert not any(row["username"] == "local" for row in client.get("/api/admin/users").json()["users"])
    post(client, "/api/logout")
    assert login(client, "local").status_code == 401


def test_file_session_survives_restart_and_idle_expiry_invalidates_access(live_app):
    app, client, engine, settings, auth, preferences = live_app
    clock = [1_800_000_000.0]
    app.state.session_store.clock = lambda: clock[0]
    assert login(client, "reader").status_code == 200
    new_app = create_app(settings, auth_settings=auth, preference_options=preferences)
    new_app.state.db_engine = engine
    new_app.state.session_store.clock = lambda: clock[0]
    with TestClient(new_app) as restarted:
        restarted.cookies.update(client.cookies)
        assert restarted.get("/api/session").json()["user"]["username"] == "reader"
        clock[0] += auth.max_age_millis / 1000 + 1
        assert restarted.get("/api/user-settings").status_code == 401
        assert restarted.get("/api/session").json()["user"] is None
        assert post(restarted, "/api/keep-alive").json() == {"activeSession": False}
