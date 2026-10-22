"""Python adapters for @cityssm/authentication-helper 1.0.0.

Sunrise CMS / authentication-helper: Copyright (c) The Corporation of the City
of Sault Ste. Marie. MIT license; see THIRD_PARTY_NOTICES.md.
Provider failures never expose credentials or provider exception text to HTTP.
"""

import asyncio
from collections.abc import Callable
import importlib
import inspect
import json
import ssl
import time
from typing import Any
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen


class PlainTextAuthenticator:
    def __init__(self, config: dict):
        self.users = config.get("users", {})
        alternative = config.get("alternativeAuthenticator")
        self.alternative = build_authenticator(alternative["type"], alternative.get("config", {})) if alternative else None

    async def authenticate(self, username: str, password: str) -> bool:
        if username in self.users:
            return self.users[username] == password
        return await self.alternative.authenticate(username, password) if self.alternative else False


class FunctionAuthenticator:
    def __init__(self, config: dict):
        function = config.get("authenticate")
        if isinstance(function, str):
            module, name = function.split(":", 1)
            function = getattr(importlib.import_module(module), name)
        if not callable(function):
            raise ValueError("Function authenticator needs authenticate='module:callable'")
        self.function = function

    async def authenticate(self, username: str, password: str) -> bool:
        if inspect.iscoroutinefunction(self.function):
            value = await self.function(username, password)
        else:
            value = await asyncio.to_thread(self.function, username, password)
            if inspect.isawaitable(value):
                value = await value
        return bool(value)


def _read_json(request: Request, timeout: float):
    with urlopen(request, timeout=timeout) as response:
        # Authentication replies are small; do not download an unbounded body.
        return json.loads(response.read(65_537))


class ADWebAuthAuthenticator:
    def __init__(self, config: dict, transport: Callable = _read_json):
        self.url = str(config.get("url", ""))
        if not self.url.endswith("/auth"):
            self.url += "/auth"
        if urlparse(self.url).scheme not in {"https", "http"}:
            raise ValueError("AD Web Auth requires an HTTP(S) URL")
        self.method = config.get("method", "post")
        if self.method not in {"get", "headers", "post"}:
            raise ValueError("Invalid AD Web Auth method")
        self.username_field = config.get("userNameField", "userName")
        self.password_field = config.get("passwordField", "password")
        self.timeout = float(config.get("timeout", 10))
        self.transport = transport

    def _authenticate(self, username: str, password: str) -> bool:
        fields = {self.username_field: username, self.password_field: password}
        if self.method == "get":
            request = Request(self.url + "/byGet?" + urlencode(fields, quote_via=quote, safe="~!*'()"))
        elif self.method == "headers":
            request = Request(self.url + "/byHeaders", headers=fields)
        else:
            request = Request(self.url + "/byPost", data=json.dumps(fields).encode(),
                              headers={"Content-Type": "application/json"}, method="POST")
        for _ in range(3):  # The locked connector retries transport/JSON failures 3 times.
            try:
                value = self.transport(request, self.timeout)
                # Normal /auth returns a JSON boolean. An object from the debug API
                # must not authenticate an unsuccessful result just by being truthy.
                return value is True
            except Exception:
                pass
        return False

    async def authenticate(self, username: str, password: str) -> bool:
        return await asyncio.to_thread(self._authenticate, username, password)


def username_part(username: str) -> str:
    if "@" in username:
        return username.split("@", 1)[0]
    parts = username.split("\\", 2)
    return parts[1] if len(parts) == 2 else parts[0]


class ActiveDirectoryAuthenticator:
    """Service bind -> escaped subtree search -> separate user bind, as source.

    The source helper caches DNs for 60 seconds (including failed user binds).
    ldap3 is loaded only when this adapter is configured.
    """

    def __init__(self, config: dict, connection_factory: Callable | None = None,
                 clock: Callable = time.time):
        self.config = config
        self.connection_factory = connection_factory
        self.clock = clock
        self.cache: dict[str, tuple[float, str]] = {}

    def _connection(self, user: str, password: str):
        if self.connection_factory:
            return self.connection_factory(user, password)
        from ldap3 import Connection, NONE, Server, Tls
        config = self.config
        parsed = urlparse(config.get("url", ""))
        if parsed.scheme not in {"ldap", "ldaps"} or not parsed.hostname:
            raise ValueError("Active Directory requires an LDAP(S) URL")
        tls_options = config.get("tlsOptions", {})
        # Node tlsOptions.rejectUnauthorized defaults true. Paths replace Node
        # Buffer-valued CA/client keys; no verification is disabled by default.
        tls = Tls(validate=ssl.CERT_REQUIRED if tls_options.get("rejectUnauthorized", True) else ssl.CERT_NONE,
                  ca_certs_file=tls_options.get("caFile"),
                  local_certificate_file=tls_options.get("certFile"),
                  local_private_key_file=tls_options.get("keyFile"))
        server = Server(parsed.hostname, port=parsed.port or (636 if parsed.scheme == "ldaps" else 389),
                        use_ssl=parsed.scheme == "ldaps", tls=tls, get_info=NONE,
                        connect_timeout=float(config.get("connectTimeout", 10_000)) / 1000)
        return Connection(server, user=user, password=password,
                          receive_timeout=float(config.get("timeout", 10_000)) / 1000,
                          raise_exceptions=False, auto_referrals=False)

    def _authenticate(self, username: str, password: str) -> bool:
        from ldap3 import SUBTREE
        from ldap3.utils.conv import escape_filter_chars

        account = username_part(username)
        cached = self.cache.get(account)
        dn = cached[1] if cached and cached[0] > self.clock() else None
        if not dn:
            service = self._connection(self.config["bindUserDN"], self.config["bindUserPassword"])
            try:
                if not service.bind():
                    return False
                if not service.search(self.config["baseDN"],
                                      f"(&(sAMAccountName={escape_filter_chars(account)})(objectClass=user))",
                                      search_scope=SUBTREE):
                    return False
                if not service.entries:
                    return False
                dn = service.entries[0].entry_dn
                if self.config.get("cacheUserBindDNs", True):
                    self.cache[account] = (self.clock() + 60, dn)
            finally:
                service.unbind()
        user = self._connection(dn, password)
        try:
            return bool(user.bind())
        finally:
            user.unbind()

    async def authenticate(self, username: str, password: str) -> bool:
        try:
            return await asyncio.to_thread(self._authenticate, username, password)
        except Exception:
            return False


def build_authenticator(kind: str | None, config: dict[str, Any]):
    classes = {
        "plainText": PlainTextAuthenticator, "function": FunctionAuthenticator,
        "activeDirectory": ActiveDirectoryAuthenticator, "adWebAuth": ADWebAuthAuthenticator,
    }
    return classes[kind](config) if kind in classes else None
