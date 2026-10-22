"""Authentication, source redirects, server sessions, CSRF and source role gates."""

from copy import deepcopy
import json
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.testclient import TestClient
import pytest

from cemaris.auth import (
    FileSessionStore, LoginAbuseTracker, RequestRateLimiter, current_user,
    get_safe_redirect_url, install_auth, require_admin, require_update_cemeteries,
    require_update_contracts, require_update_work_orders, detect_language,
)
from cemaris.auth_config import AuthSettings
from cemaris.errors import install_error_handlers


USER = {
    "username": "alice",
    "userProperties": {"isAdmin": True, "canUpdateCemeteries": False,
                       "canUpdateContracts": True, "canUpdateWorkOrders": False},
    "userSettings": {"apiKey": "synthetic-api-key", "consignoCloud.thirdPartyApplicationPassword": "private-password"},
}


def make_app(directory, user=USER, **overrides):
    settings = AuthSettings(_env_file=None, session_directory=directory,
                            type="plainText", config={"users": {"DOMAIN\\Alice": "sample"}},
                            domain="DOMAIN", **overrides)
    app = FastAPI()
    install_error_handlers(app)
    install_auth(app, settings, user_resolver=lambda request, username: deepcopy(user))

    for path, gate in [
        ("/private", current_user), ("/admin", require_admin),
        ("/cemeteries", require_update_cemeteries), ("/contracts", require_update_contracts),
        ("/work-orders", require_update_work_orders),
    ]:
        def endpoint(user=Depends(gate)):
            return {"username": user["username"]}
        app.add_api_route(path, endpoint, methods=["GET", "POST"])
    return app


def token(client):
    return client.get("/api/session").json()["csrfToken"]


def log_in(client, **body):
    return client.post("/api/login", json={"username": "Alice", "password": "sample", **body},
                       headers={"x-csrf-token": token(client)})


@pytest.mark.parametrize("case", json.loads((Path(__file__).parent / "fixtures/auth-reference.json").read_text())["redirects"])
def test_redirects_match_executed_source(case):
    assert get_safe_redirect_url(case["input"], case["prefix"]) == case["expected"]


def test_login_logout_cookies_csrf_rotation_and_password_redaction(tmp_path):
    app = make_app(tmp_path)
    with TestClient(app) as client:
        initial = client.get("/api/session")
        assert initial.json()["user"] is None
        assert initial.json()["auth"] == {"type": "plainText", "domain": "DOMAIN", "maxAgeMillis": 3600000, "doKeepAlive": False, "useTestDatabases": False}
        cookie = initial.headers["set-cookie"]
        assert "HttpOnly" in cookie and "SameSite=strict" in cookie and "Max-Age=3600" in cookie
        old_sid = client.cookies["cemaris-user-sid"]
        old_csrf = initial.json()["csrfToken"]
        login = client.post("/api/login", json={"username": "Alice", "password": "sample", "redirect": "/contracts/new"}, headers={"x-csrf-token": old_csrf})
        assert login.status_code == 200
        assert login.json()["redirect"] == "/contracts/new"
        assert login.json()["user"]["username"] == "alice"
        assert "private-password" not in login.text
        assert client.cookies["cemaris-user-sid"] != old_sid
        assert login.json()["csrfToken"] != old_csrf
        assert not (tmp_path / (old_sid + ".json")).exists()
        assert client.get("/private").status_code == 200
        assert "private-password" not in client.get("/api/session").text
        assert client.post("/contracts", headers={"x-csrf-token": old_csrf}).status_code == 403
        logout = client.post("/api/logout", headers={"x-csrf-token": login.json()["csrfToken"]})
        assert logout.status_code == 200
        assert client.get("/private").status_code == 401
        assert client.get("/api/session").json()["user"] is None


@pytest.mark.parametrize("method,path", [("POST", "/api/login"), ("POST", "/api/logout"), ("POST", "/contracts"), ("PUT", "/api/login"), ("DELETE", "/api/login")])
def test_mutations_require_csrf_even_login_and_logout(tmp_path, method, path):
    with TestClient(make_app(tmp_path)) as client:
        assert client.request(method, path, json={}).status_code == 403
        token(client)
        response = client.request(method, path, json={}, headers={"x-csrf-token": "wrong"})
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "csrf_failed"


@pytest.mark.parametrize("path,status", [("/private", 200), ("/admin", 200), ("/cemeteries", 403), ("/contracts", 200), ("/work-orders", 403)])
def test_source_permissions_do_not_imply_admin_update_access(tmp_path, path, status):
    with TestClient(make_app(tmp_path)) as client:
        assert client.get(path).status_code == 401
        assert log_in(client).status_code == 200
        assert client.get(path).status_code == status
        assert client.post(path, headers={"x-csrf-token": token(client)}).status_code == status


def test_authenticated_provider_without_authorized_user_cannot_login(tmp_path):
    with TestClient(make_app(tmp_path, user=None)) as client:
        assert log_in(client).status_code == 401
        assert client.get("/private").status_code == 401


@pytest.mark.parametrize("body", [{}, {"username": 123, "password": "sample"}, {"username": "Alice", "password": None}, {"username": "Alice", "password": "wrong"}])
def test_login_failure_does_not_disclose_provider_or_user_information(tmp_path, body):
    with TestClient(make_app(tmp_path)) as client:
        response = client.post("/api/login", json=body, headers={"x-csrf-token": token(client)})
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "Login Failed"


def test_no_authentication_config_fails_closed(tmp_path):
    app = make_app(tmp_path)
    app.state.authenticator = None
    with TestClient(app) as client:
        assert log_in(client).status_code == 401


def test_session_slides_expires_and_survives_application_restart(tmp_path):
    app = make_app(tmp_path, max_age_millis=60_000)
    now = [1000.0]
    app.state.session_store.clock = lambda: now[0]
    with TestClient(app) as client:
        assert log_in(client).status_code == 200
        sid = client.cookies["cemaris-user-sid"]
        now[0] += 59
        assert client.get("/private").status_code == 200
        restarted = make_app(tmp_path, max_age_millis=60_000)
        restarted.state.session_store.clock = lambda: now[0]
        with TestClient(restarted) as next_client:
            next_client.cookies.set("cemaris-user-sid", sid)
            now[0] += 59
            assert next_client.get("/private").status_code == 200
            now[0] += 61
            assert next_client.get("/private").status_code == 401
            assert next_client.get("/api/session").json()["user"] is None


def test_cookie_secure_and_forged_sid_and_foreign_csrf_are_rejected(tmp_path):
    app = make_app(tmp_path, cookie_secure=True)
    with TestClient(app, base_url="https://testserver") as first, TestClient(app, base_url="https://testserver") as second:
        assert "Secure" in first.get("/api/session").headers["set-cookie"]
        foreign_csrf = token(second)
        response = first.post("/api/login", json={"username": "Alice", "password": "sample"}, headers={"x-csrf-token": foreign_csrf})
        assert response.status_code == 403
        second.cookies.set("cemaris-user-sid", "../forged")
        assert second.get("/private").status_code == 401


def test_fifth_failure_blocks_subsequent_attempt_then_each_failure_expires(tmp_path):
    app = make_app(tmp_path)
    now = [1000.0]
    app.state.login_abuse.clock = lambda: now[0]
    with TestClient(app) as client:
        for _ in range(5):
            assert log_in(client, password="wrong").status_code == 401
            now[0] += 10
        assert log_in(client).status_code == 403
        now[0] = 1300  # First point expires; four remain, allowing login.
        assert log_in(client).status_code == 200
        assert not app.state.login_abuse.blocked("testclient")


def test_source_abuse_is_per_ip_and_success_resets_it(tmp_path):
    app = make_app(tmp_path, traffic_is_forwarded=True)
    with TestClient(app) as client:
        csrf = token(client)
        for _ in range(5):
            assert client.post("/api/login", json={}, headers={"x-csrf-token": csrf, "x-forwarded-for": "[2001:db8::1], 10.0.0.1"}).status_code == 401
        assert client.post("/api/login", json={}, headers={"x-csrf-token": csrf, "x-forwarded-for": "2001:db8::1"}).status_code == 403
        response = client.post("/api/login", json={"username": "Alice", "password": "sample"}, headers={"x-csrf-token": csrf, "x-forwarded-for": "10.0.0.2:443, 10.0.0.1"})
        assert response.status_code == 200


@pytest.mark.parametrize("query,cookie,header,expected", [
    ("de", "en", "en-US", "de"), (None, "de", "en-US", "de"),
    (None, None, "de-DE,de;q=0.9,en;q=0.8", "de"),
    ("fr", None, "en-US", "en"), (None, None, "fr", "de"),
])
def test_language_query_cookie_header_and_fallback(tmp_path, query, cookie, header, expected):
    with TestClient(make_app(tmp_path)) as client:
        if cookie:
            client.cookies.set("i18next", cookie)
        response = client.get("/api/session" + ("?lng=" + query if query else ""), headers={"accept-language": header})
        assert response.json()["language"] == expected


@pytest.mark.parametrize("case", json.loads((Path(__file__).parent / "fixtures/language-reference.json").read_text())["cases"])
def test_language_detection_retains_source_choices_with_german_default(case):
    from urllib.parse import urlencode
    headers = []
    if "cookie" in case:
        headers.append((b"cookie", ("i18next=" + case["cookie"]).encode()))
    if "header" in case:
        headers.append((b"accept-language", case["header"].encode()))
    request = Request({"type": "http", "headers": headers,
                       "query_string": urlencode({"lng": case["query"]}).encode() if "query" in case else b""})
    # Product changes: German fallback, regional codes, case-insensitive
    # language identifiers and browser quality weights replace source quirks.
    product_overrides = {
        (): "de",
        (("query", "en-US"), ("cookie", "de")): "en",
        (("query", "DE"),): "de",
        (("query", "en_GB"), ("cookie", "de")): "en",
        (("header", "de-DE,en;q=0.8"),): "de",
        (("header", "en-US;q=1,de;q=0.1"),): "en",
        (("header", "fr"),): "de",
        (("header", "*"),): "de",
        (("cookie", "en-US"), ("header", "de")): "en",
        (("header", "de;q=invalid,en;q=0.3"),): "en",
        (("header", "en;q=0.1,de-DE;q=1"),): "de",
    }
    selected = tuple((key, case[key]) for key in ("query", "cookie", "header") if key in case)
    assert detect_language(request) == product_overrides.get(selected, case["expected"])


def test_optional_keepalive_and_no_implicit_authorization(tmp_path):
    with TestClient(make_app(tmp_path, do_keep_alive=True)) as client:
        response = client.post("/api/keep-alive", headers={"x-csrf-token": token(client)})
        assert response.json() == {"activeSession": False}
        assert log_in(client).status_code == 200
        assert client.post("/api/keep-alive", headers={"x-csrf-token": token(client)}).json() == {"activeSession": True}
    with TestClient(make_app(tmp_path)) as client:
        assert client.post("/api/keep-alive", headers={"x-csrf-token": token(client)}).status_code == 404


def test_testing_users_only_in_explicit_test_database_mode(tmp_path):
    for enabled, password, expected in [(False, "*test", 401), (True, "*test", 200), (True, "wrong", 401)]:
        with TestClient(make_app(tmp_path, use_test_databases=enabled, testing=["*test"])) as client:
            response = log_in(client, username="*test", password=password)
            assert response.status_code == expected


def test_server_session_file_only_contains_internal_snapshot_and_expiry(tmp_path):
    store = FileSessionStore(tmp_path, 60_000, clock=lambda: 1000)
    sid, session = store.new()
    store.save(sid, session)
    assert store.load(sid)["expiresAt"] == 1060
    assert store.load("../outside") is None
    (tmp_path / (sid + ".json")).write_text("malformed")
    assert store.load(sid) is None


def test_global_source_rate_limit_window():
    now = [1000]
    limiter = RequestRateLimiter(limit=2, clock=lambda: now[0])
    assert limiter.allowed("A")[0]
    assert limiter.allowed("A")[0]
    assert not limiter.allowed("A")[0]
    assert limiter.allowed("B")[0]
    now[0] += 60
    assert limiter.allowed("A")[0]
