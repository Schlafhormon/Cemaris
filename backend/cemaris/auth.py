"""Server-side rolling sessions, CSRF and role dependencies for the React API.

Source: Sunrise helpers/authentication.helpers.ts, helpers/user.helpers.ts,
handlers/permissions.ts and app/app.ts, fixed commit 451ce034863b16502484367044f3e9b65370111a.
Copyright (c) The Corporation of the City of Sault Ste. Marie, MIT.
"""

from collections import defaultdict, deque
from collections.abc import Callable
from copy import deepcopy
import hmac
import inspect
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import threading
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from starlette.concurrency import run_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware

from cemaris.auth_adapters import build_authenticator
from cemaris.auth_config import AuthSettings
from cemaris.errors import error_response
from cemaris.paths import route_path


SAFE_REDIRECTS = frozenset({
    "/admin/burialsitetypes", "/admin/cleanup", "/admin/contracttypes", "/admin/fees",
    "/admin/settings", "/admin/tables", "/burialsites", "/burialsites/new",
    "/cemeteries", "/cemeteries/new", "/contracts", "/contracts/new",
    "/dashboard", "/dashboard/updatelog", "/reports", "/workorders",
    "/workorders/milestonecalendar", "/workorders/new", "/workorders/outlook",
    "/workorders/workday",
})
RECORD_URL = re.compile(r"^/(?:cemeteries|burialsites|contracts|funeralHomes|workorders)/[0-9]+(?:/edit)?$")
PRINT_URL = re.compile(r"^/print/(?:pdf|screen)/[0-9/=?A-Za-z-]+$")


def get_safe_redirect_url(possible_redirect_url: str = "", url_prefix: str = "") -> str:
    if isinstance(possible_redirect_url, str):
        value = possible_redirect_url[len(url_prefix):] if possible_redirect_url.startswith(url_prefix) else possible_redirect_url
        lower = value.lower()
        if lower in SAFE_REDIRECTS or RECORD_URL.fullmatch(lower) or PRINT_URL.fullmatch(value):
            return url_prefix + value
    return url_prefix + "/dashboard/"


def detect_language(request: Request) -> str:
    # Explicit selection and cookie precede the browser's weighted preferences.
    # Regional codes use their supported base language; German is the default.
    weighted = []
    for position, part in enumerate(request.headers.get("accept-language", "").split(",")):
        pieces = part.strip().split(";")
        quality = 1.0
        for parameter in pieces[1:]:
            key, separator, value = parameter.strip().partition("=")
            if key.lower() == "q" and separator:
                try:
                    quality = float(value)
                except ValueError:
                    quality = 0
        if 0 < quality <= 1:
            weighted.append((quality, position, pieces[0].strip()))
    candidates = [request.query_params.get("lng"), request.cookies.get("i18next"),
                  *(value for _, _, value in sorted(weighted, key=lambda item: (-item[0], item[1])))]
    for value in candidates:
        if not isinstance(value, str) or len(value) > 128 or not re.fullmatch(r"[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*", value):
            continue
        language = re.split(r"[-_]", value.casefold(), maxsplit=1)[0]
        if language in {"de", "en"}:
            return language
    return "de"


class FileSessionStore:
    """Opaque bearer cookie; JSON snapshots live exclusively on the server.

    Atomic replacement prevents partial files. As in source session-file-store,
    parallel requests can overwrite snapshots: deploy one worker initially.
    """

    def __init__(self, directory: Path, max_age_millis: int, clock: Callable = time.time):
        self.directory = Path(directory)
        self.max_age_seconds = max_age_millis / 1000
        self.clock = clock
        self.lock = threading.RLock()
        self.last_reap = 0.0

    def _path(self, sid: str) -> Path | None:
        return self.directory / (sid + ".json") if re.fullmatch(r"[a-f0-9]{64}", sid) else None

    def new(self) -> tuple[str, dict]:
        return secrets.token_hex(32), {"csrfToken": secrets.token_urlsafe(32), "user": None}

    def load(self, sid: str) -> dict | None:
        path = self._path(sid)
        if path is None:
            return None
        with self.lock:
            try:
                value = json.loads(path.read_text(encoding="utf-8"))
                if not isinstance(value, dict) or value.get("expiresAt", 0) <= self.clock():
                    path.unlink(missing_ok=True)
                    return None
                if not isinstance(value.get("csrfToken"), str):
                    return None
                # Old integration credentials are discarded when an existing
                # persisted session is next read and saved after an upgrade.
                if value.get("user") is not None:
                    value["user"] = public_user(value["user"])
                return value
            except (OSError, ValueError, TypeError):
                return None

    def save(self, sid: str, session: dict) -> None:
        path = self._path(sid)
        if path is None:
            raise ValueError("Invalid session identifier")
        with self.lock:
            self.directory.mkdir(parents=True, exist_ok=True)
            session["expiresAt"] = self.clock() + self.max_age_seconds
            temporary = self.directory / (sid + "." + secrets.token_hex(8) + ".tmp")
            try:
                with temporary.open("x", encoding="utf-8") as output:
                    os.chmod(temporary, 0o600)
                    json.dump(session, output, ensure_ascii=False)
                # Windows scanners/indexers can briefly hold an otherwise
                # writable destination open. Keep atomic replacement and the
                # existing lock; a persistent access error still propagates.
                for attempt in range(6):
                    try:
                        os.replace(temporary, path)
                        break
                    except PermissionError:
                        if attempt == 5:
                            raise
                        time.sleep(0.02 * (attempt + 1))
            finally:
                temporary.unlink(missing_ok=True)
            if self.clock() - self.last_reap > 3600:
                self.reap()
                self.last_reap = self.clock()

    def delete(self, sid: str) -> None:
        path = self._path(sid)
        if path:
            with self.lock:
                path.unlink(missing_ok=True)

    def reap(self) -> None:
        for path in self.directory.glob("*.json"):
            if re.fullmatch(r"[a-f0-9]{64}\.json", path.name):
                self.load(path.stem)


class LoginAbuseTracker:
    def __init__(self, clock: Callable = time.time):
        self.clock = clock
        self.failures: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()
        self.last_reap = self.clock()

    def _current(self, key: str):
        if self.clock() - self.last_reap >= 3600:
            for old_key, old_values in list(self.failures.items()):
                while old_values and old_values[0] <= self.clock():
                    old_values.popleft()
                if not old_values:
                    del self.failures[old_key]
            self.last_reap = self.clock()
        values = self.failures[key]
        while values and values[0] <= self.clock():
            values.popleft()
        return values

    def blocked(self, key: str) -> bool:
        with self.lock:
            return len(self._current(key)) >= 5

    def record(self, key: str):
        with self.lock:
            self._current(key).append(self.clock() + 300)

    def clear(self, key: str):
        with self.lock:
            self.failures.pop(key, None)


class RequestRateLimiter:
    """The source express-rate-limit default MemoryStore: 2000 / minute / IP."""

    def __init__(self, limit: int = 2000, clock: Callable = time.time):
        self.limit, self.clock = limit, clock
        self.windows: dict[str, tuple[float, int]] = {}
        self.lock = threading.Lock()
        self.last_reap = self.clock()

    def allowed(self, key: str) -> tuple[bool, int]:
        with self.lock:
            if self.clock() - self.last_reap >= 60:
                self.windows = {old_key: value for old_key, value in self.windows.items() if value[0] > self.clock()}
                self.last_reap = self.clock()
            expires, count = self.windows.get(key, (0, 0))
            if expires <= self.clock():
                expires, count = self.clock() + 60, 0
            count += 1
            self.windows[key] = (expires, count)
            return count <= self.limit, max(1, int(expires - self.clock()))


def tracking_ip(request: Request, forwarded: bool) -> str:
    if not forwarded:
        return request.client.host if request.client else ""
    forwarded_for = request.headers.get("x-forwarded-for", "")
    for piece in re.split(r"[ ,\[\]]", forwarded_for):
        if re.fullmatch(r"(?:[12]?\d{1,2}\.){3}[12]?\d{1,2}(?::\d{1,5})?", piece):
            return piece.split(":", 1)[0]
        try:
            address = ipaddress.ip_address(piece)
            if address.version == 6:
                return piece  # Source preserves the supplied IPv6 spelling.
        except ValueError:
            pass
    return forwarded_for


class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = request.app.state.auth_settings
        store = request.app.state.session_store
        request.state.language = detect_language(request)
        if not hasattr(request.state, "request_id"):
            request.state.request_id = uuid4().hex
        if not settings.disable_rate_limit:
            allowed, retry_after = request.app.state.request_rate_limiter.allowed(tracking_ip(request, False))
            if not allowed:
                return error_response(request, 429, "http_429", "Too many requests, please try again later.",
                                      headers={"Retry-After": str(retry_after)})
        supplied_sid = request.cookies.get(settings.cookie_name, "")
        session = await run_in_threadpool(store.load, supplied_sid) if supplied_sid else None
        had_session = session is not None
        if session is None:
            sid, session = store.new()
        else:
            sid = supplied_sid
        request.state.session = session
        request.state.session_id = sid
        request.state.user = session.get("user")
        request.state.session_changed = False

        if request.method not in {"GET", "HEAD", "OPTIONS", "TRACE"}:
            token = request.headers.get("x-csrf-token", "")
            if not had_session or not hmac.compare_digest(token.encode(), session["csrfToken"].encode()):
                return error_response(request, 403, "csrf_failed", "Invalid CSRF token")
        response = await call_next(request)
        cookie_path = settings.url_prefix + "/"
        create_session = had_session or route_path(request) in {"/api/session", "/api/login", "/api/logout"}
        if create_session:
            await run_in_threadpool(store.save, request.state.session_id, request.state.session)
            response.set_cookie(settings.cookie_name, request.state.session_id,
                                max_age=max(1, settings.max_age_millis // 1000),
                                httponly=True, secure=settings.cookie_secure,
                                samesite="strict", path=cookie_path)
            response.headers["Cache-Control"] = "no-store"
        elif supplied_sid and not had_session:
            response.delete_cookie(settings.cookie_name, path=cookie_path, httponly=True,
                                   samesite="strict", secure=settings.cookie_secure)
        if request.cookies.get("i18next") != request.state.language:
            response.set_cookie("i18next", request.state.language, samesite="strict", path=cookie_path,
                                secure=settings.cookie_secure, max_age=31_536_000)
        return response


def current_user(request: Request) -> dict:
    user = request.state.session.get("user")
    if user is None:
        raise HTTPException(401, "Authentication required")
    return user


def require_permission(permission: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if not user.get("userProperties", {}).get(permission, False):
            raise HTTPException(403, "Forbidden")
        return user
    return dependency


require_admin = require_permission("isAdmin")
require_update_cemeteries = require_permission("canUpdateCemeteries")
require_update_contracts = require_permission("canUpdateContracts")
require_update_work_orders = require_permission("canUpdateWorkOrders")


class LoginBody(BaseModel):
    model_config = ConfigDict(extra="ignore")
    # Source treats nonstring/missing values as empty and returns Login Failed.
    username: object = ""
    password: object = ""
    redirect: object = ""


async def authenticate(request: Request, username: str, password: str) -> bool:
    settings: AuthSettings = request.app.state.auth_settings
    if not username or not password:
        return False
    if username.startswith("*"):
        return settings.use_test_databases and username == password and username in settings.testing
    adapter = request.app.state.authenticator
    if adapter is None:
        return False
    try:
        return await adapter.authenticate(settings.domain + "\\" + username, password)
    except Exception:
        return False


def _default_user_resolver(request: Request, username: str):
    from cemaris.accounts import get_user
    from cemaris.dependencies import get_engine
    return get_user(get_engine(request), username, request.app.state.auth_settings)


def _rotate(request: Request, user: dict | None):
    store = request.app.state.session_store
    store.delete(request.state.session_id)
    sid, session = store.new()
    session["user"] = public_user(user)
    request.state.session_id = sid
    request.state.session = session
    request.state.user = session["user"]


def public_user(user: dict | None) -> dict | None:
    """Expose only supported Cemaris user preferences, including old sessions."""
    if user is None:
        return None
    result = deepcopy(user)
    settings = result.get("userSettings", {})
    result["userSettings"] = {"apiKey": settings["apiKey"]} if "apiKey" in settings else {}
    return result


def install_auth(app: FastAPI, auth_settings: AuthSettings | None = None,
                 user_resolver: Callable | None = None) -> None:
    settings = auth_settings if auth_settings is not None else AuthSettings()
    app.state.auth_settings = settings
    app.state.authenticator = build_authenticator(settings.type, settings.config)
    app.state.session_store = FileSessionStore(settings.session_directory, settings.max_age_millis)
    app.state.login_abuse = LoginAbuseTracker()
    app.state.request_rate_limiter = RequestRateLimiter(1_000_000 if settings.use_test_databases else 2000)
    app.state.user_resolver = user_resolver or _default_user_resolver
    app.add_middleware(SessionMiddleware)
    router = APIRouter(prefix="/api", tags=["authentication"])

    @router.get("/session")
    async def session(request: Request):
        return {"user": public_user(request.state.session.get("user")),
                "csrfToken": request.state.session["csrfToken"],
                "language": request.state.language,
                "auth": {"type": settings.type, "domain": settings.domain,
                         "maxAgeMillis": settings.max_age_millis,
                         "doKeepAlive": settings.do_keep_alive,
                         "useTestDatabases": settings.use_test_databases}}

    @router.post("/login")
    async def login(request: Request, body: LoginBody):
        ip = tracking_ip(request, settings.traffic_is_forwarded)
        abuse = request.app.state.login_abuse
        if abuse.blocked(ip):
            raise HTTPException(403, "Too many login attempts. Please try again later.")
        username = body.username if isinstance(body.username, str) else ""
        password = body.password if isinstance(body.password, str) else ""
        user = None
        if await authenticate(request, username, password):
            resolver = request.app.state.user_resolver
            if inspect.iscoroutinefunction(resolver):
                user = await resolver(request, username)
            else:
                user = await run_in_threadpool(resolver, request, username)
        if user is None:
            abuse.record(ip)
            raise HTTPException(401, "Login Failed")
        abuse.clear(ip)
        await run_in_threadpool(_rotate, request, user)
        return {"success": True, "user": public_user(user),
                "redirect": get_safe_redirect_url(body.redirect, settings.url_prefix),
                "csrfToken": request.state.session["csrfToken"]}

    @router.post("/logout")
    async def logout(request: Request):
        if request.state.session.get("user") is not None:
            request.app.state.login_abuse.clear(tracking_ip(request, settings.traffic_is_forwarded))
        await run_in_threadpool(_rotate, request, None)
        return {"success": True, "csrfToken": request.state.session["csrfToken"]}

    @router.post("/keep-alive")
    async def keep_alive(request: Request):
        if not settings.do_keep_alive:
            raise HTTPException(404, "Not Found")
        return {"activeSession": request.state.session.get("user") is not None}

    app.include_router(router)
