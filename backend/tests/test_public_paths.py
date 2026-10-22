"""Public mount behavior through the same prefix-stripping contract as Nginx."""

from copy import deepcopy
from contextlib import nullcontext
import json
from pathlib import Path
import subprocess

from fastapi import Request
from fastapi.testclient import TestClient
import pytest

from cemaris.auth_config import AuthSettings, RESERVED_PREFIX_SEGMENTS
from cemaris.config import Settings
from cemaris.main import create_app
from cemaris.paths import route_path
from cemaris import paths, places_audit


class StrippingProxy:
    def __init__(self, app, prefix):
        self.app, self.prefix = app, prefix

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and self.prefix:
            scope = {**scope, "path": scope["path"][len(self.prefix):] or "/",
                     "raw_path": scope["raw_path"][len(self.prefix):] or b"/"}
        await self.app(scope, receive, send)


@pytest.fixture
def application(tmp_path):
    def build(prefix):
        app = create_app(Settings(_env_file=None, environment="test"), auth_settings=AuthSettings(
            _env_file=None, url_prefix=prefix, session_directory=tmp_path / "sessions",
            type="plainText", domain="LOCAL", config={"users": {"LOCAL\\reader": "synthetic"}},
        ))
        user = {"username": "reader", "userProperties": {"isAdmin": False,
            "canUpdateCemeteries": True, "canUpdateContracts": False, "canUpdateWorkOrders": False},
            "userSettings": {"apiKey": "synthetic"}}
        app.state.user_resolver = lambda request, username: deepcopy(user)

        @app.get("/api/_public-path/{value:path}")
        def probe(value: str, request: Request):
            return {"value": value, "path": request.url.path, "routePath": route_path(request),
                    "baseUrl": str(request.base_url), "rawPath": request.scope["raw_path"].decode("ascii")}

        return app
    return build


@pytest.mark.parametrize("prefix", ["", "/cemaris", "/department/cemaris.v1"])
@pytest.mark.parametrize("stripping", [False, True])
def test_login_csrf_cookies_redirects_print_errors_and_logout_at_public_mount(application, prefix, stripping):
    app = application(prefix)
    with TestClient(StrippingProxy(app, prefix) if stripping else app,
                    base_url="https://cemaris.example.invalid") as client:
        first = client.get(prefix + "/api/session")
        assert first.status_code == 200
        assert first.json()["user"] is None
        assert all("Path=" + prefix + "/;" in cookie for cookie in first.headers.get_list("set-cookie"))
        assert client.post(prefix + "/api/login", json={}).status_code == 403
        login = client.post(prefix + "/api/login", json={"username": "reader", "password": "synthetic",
            "redirect": prefix + "/contracts/new"}, headers={"X-CSRF-Token": first.json()["csrfToken"]})
        assert login.status_code == 200
        assert login.json()["redirect"] == prefix + "/contracts/new"
        assert client.get(prefix + "/api/session").json()["user"]["username"] == "reader"
        slash = client.get(prefix + "/api/health/", follow_redirects=False)
        assert slash.status_code == 307
        assert slash.headers["location"] == "https://cemaris.example.invalid" + prefix + "/api/health"
        print_error = client.get(prefix + "/print/unknown", follow_redirects=False)
        assert print_error.status_code == 302
        assert print_error.headers["location"] == prefix + "/dashboard/?error=printConfigNotAllowed"
        logout = client.post(prefix + "/api/logout", json={}, headers={"X-CSRF-Token": login.json()["csrfToken"]})
        assert logout.status_code == 200
        assert client.get(prefix + "/api/session").json()["user"] is None


@pytest.mark.parametrize("stripping", [False, True])
def test_decoded_and_raw_paths_keep_one_prefix_and_url_base(application, stripping):
    app = application("/cemaris")
    with TestClient(StrippingProxy(app, "/cemaris") if stripping else app) as client:
        response = client.get("/cemaris/api/_public-path/with%20space/%C3%A4")
        assert response.status_code == 200
        assert response.json() == {"value": "with space/ä", "path": "/cemaris/api/_public-path/with space/ä",
            "routePath": "/api/_public-path/with space/ä", "baseUrl": "http://testserver/cemaris/",
            "rawPath": "/cemaris/api/_public-path/with%20space/%C3%A4"}


@pytest.mark.parametrize("prefix", ["relative", "//host", "/one//two", "/../two", "/one/.", "/with space",
    "/ä", "/one%2ftwo", "/one?query", "/one#hash", "/one\\two", "/one;cookie", "/one\nline"])
def test_invalid_mount_is_rejected(prefix):
    with pytest.raises(ValueError, match="URL prefix"):
        AuthSettings(_env_file=None, url_prefix=prefix)


@pytest.mark.parametrize("segment", sorted(RESERVED_PREFIX_SEGMENTS))
def test_reserved_internal_first_segments_are_rejected_before_startup(segment):
    for prefix in ("/" + segment, "/" + segment.upper() + "/nested"):
        with pytest.raises(ValueError, match="reserved application"):
            AuthSettings(_env_file=None, url_prefix=prefix)


@pytest.mark.parametrize("prefix", ["", "/", "/cemaris", "/department/cemaris", "/department/api", "/api-v2"])
def test_independent_mount_names_remain_valid(prefix):
    assert AuthSettings(_env_file=None, url_prefix=prefix).url_prefix == prefix.rstrip("/")


def test_backend_vite_and_nginx_reserved_segments_cannot_drift():
    root = Path(__file__).resolve().parents[2]
    result = subprocess.run(["node", "--input-type=module", "-e",
        'import { RESERVED_PREFIX_SEGMENTS as vite } from "./frontend/vite.config.ts"; '
        'import { RESERVED_PREFIX_SEGMENTS as nginx } from "./deploy/render-nginx.mjs"; '
        'process.stdout.write(JSON.stringify({vite:[...vite].sort(),nginx:[...nginx].sort()}))'],
        cwd=root, capture_output=True, text=True, check=True)
    expected = sorted(RESERVED_PREFIX_SEGMENTS)
    assert json.loads(result.stdout) == {"vite": expected, "nginx": expected}


def test_url_prefix_environment_alias_is_compatible_and_new_name_wins(monkeypatch):
    monkeypatch.delenv("CEMARIS_URL_PREFIX", raising=False)
    monkeypatch.setenv("CEMARIS_AUTH_URL_PREFIX", "/legacy/")
    assert AuthSettings(_env_file=None).url_prefix == "/legacy"
    monkeypatch.setenv("CEMARIS_URL_PREFIX", "/cemaris/")
    assert AuthSettings(_env_file=None).url_prefix == "/cemaris"
    assert AuthSettings(_env_file=None, url_prefix="/explicit").url_prefix == "/explicit"


@pytest.mark.parametrize("public_url", ["https://public.example.invalid/cemaris", "https://public.example.invalid:8443/cemaris"])
def test_internal_http_proxy_redirects_use_configured_public_origin(application, public_url):
    app = application("/cemaris")
    # Rebuild the middleware registration with the explicit operator URL.
    app.user_middleware = [entry for entry in app.user_middleware if entry.cls is not paths.PublicPathMiddleware]
    app.add_middleware(paths.PublicPathMiddleware, prefix="/cemaris", public_url=public_url)
    with TestClient(StrippingProxy(app, "/cemaris"), base_url="http://internal-api:8000") as client:
        response = client.get("/cemaris/api/health/", follow_redirects=False,
            headers={"X-Forwarded-Proto": "http", "X-Forwarded-Host": "untrusted.example.invalid"})
        assert response.status_code == 307
        assert response.headers["location"] == public_url + "/api/health"
        probe = client.get("/cemaris/api/_public-path/check").json()
        assert probe["baseUrl"] == public_url + "/"


@pytest.mark.parametrize("kind,segment", [("cemetery", "cemeteries"), ("burialSite", "burialSites")])
def test_record_audit_type_is_resolved_after_prefix_stripping(application, monkeypatch, kind, segment):
    app = application("/cemaris")
    app.state.preference_options.audit_log_enabled = True
    monkeypatch.setattr(places_audit, "get_engine", lambda request: type("SyntheticEngine", (), {"connect": lambda self: nullcontext(None)})())
    monkeypatch.setattr(places_audit, "get_place_audit_log", lambda connection, record_type, *args, **kwargs:
        {"auditLogEntries": [{"mainRecordType": record_type}], "count": 1})
    with TestClient(StrippingProxy(app, "/cemaris")) as client:
        token = client.get("/cemaris/api/session").json()["csrfToken"]
        login = client.post("/cemaris/api/login", json={"username": "reader", "password": "synthetic"},
            headers={"X-CSRF-Token": token})
        headers = {"X-CSRF-Token": login.json()["csrfToken"]}
        response = client.post(f"/cemaris/api/{segment}/doGetRecordAuditLog",
            json={"mainRecordType": kind, "mainRecordId": "1"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["auditLogEntries"] == [{"mainRecordType": kind}]
        denied = client.post(f"/cemaris/api/{segment}/doGetRecordAuditLog",
            json={"mainRecordType": "contract", "mainRecordId": "1"}, headers=headers)
        assert denied.status_code == 403
