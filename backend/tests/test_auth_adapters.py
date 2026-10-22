"""Realistic provider contract tests without live directory credentials."""

import asyncio
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import threading
from urllib.parse import parse_qs, urlparse

import pytest

from cemaris.auth_adapters import (
    ActiveDirectoryAuthenticator, ADWebAuthAuthenticator, FunctionAuthenticator,
    PlainTextAuthenticator, username_part,
)


def run(adapter, username="DOMAIN\\Alice", password="sample"):
    return asyncio.run(adapter.authenticate(username, password))


def test_plain_text_exact_matching_and_alternative():
    adapter = PlainTextAuthenticator({"users": {"DOMAIN\\Alice": "sample"},
                                      "alternativeAuthenticator": {"type": "plainText", "config": {"users": {"DOMAIN\\Bob": "secret"}}}})
    assert run(adapter)
    assert not run(adapter, "domain\\alice")
    assert not run(adapter, password="wrong")
    assert run(adapter, "DOMAIN\\Bob", "secret")
    assert not run(adapter, "DOMAIN\\Unknown")


def test_function_supports_sync_async_and_module_reference():
    seen = []
    def sync(username, password):
        seen.append((username, password))
        return username == "DOMAIN\\Alice" and password == "sample"
    async def asynchronous(username, password):
        return sync(username, password)
    assert run(FunctionAuthenticator({"authenticate": sync}))
    assert run(FunctionAuthenticator({"authenticate": asynchronous}))
    assert seen == [("DOMAIN\\Alice", "sample")] * 2
    assert run(FunctionAuthenticator({"authenticate": "hmac:compare_digest"}), "same", "same")


@pytest.mark.parametrize("method", ["get", "headers", "post"])
@pytest.mark.parametrize("password,expected", [("sample &+=ü", True), ("wrong", False)])
def test_ad_web_auth_actual_http_contract(method, password, expected):
    requests = []
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/auth/byGet":
                data = {key: value[0] for key, value in parse_qs(parsed.query).items()}
            else:
                assert parsed.path == "/auth/byHeaders"
                data = {"login": self.headers["login"], "secret": self.headers["secret"]}
            self.reply(data)
        def do_POST(self):
            assert self.path == "/auth/byPost"
            assert self.headers["Content-Type"] == "application/json"
            data = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            self.reply(data)
        def reply(self, data):
            requests.append(data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(data == {"login": "DOMAIN\\Alice", "secret": "sample &+=ü"}).encode())
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        adapter = ADWebAuthAuthenticator({"url": f"http://127.0.0.1:{server.server_port}",
                                          "method": method, "userNameField": "login", "passwordField": "secret"})
        assert run(adapter, password=password) is expected
        assert requests == [{"login": "DOMAIN\\Alice", "secret": password}]
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_web_auth_retries_three_transport_errors_and_rejects_debug_object():
    calls = []
    def failing(request, timeout):
        calls.append(request.full_url)
        raise OSError("private transport error")
    adapter = ADWebAuthAuthenticator({"url": "https://auth.example/auth", "method": "post"}, transport=failing)
    assert not run(adapter)
    assert calls == ["https://auth.example/auth/byPost"] * 3
    adapter.transport = lambda *_: {"success": False}
    assert not run(adapter)


@pytest.mark.parametrize("username,expected", [("DOMAIN\\Alice", "Alice"), ("Alice@example.com", "Alice"), ("Alice", "Alice"), ("A\\B\\C", "A"), ("A\\B@C", "A\\B")])
def test_username_part_source_algorithm(username, expected):
    assert username_part(username) == expected


def test_active_directory_service_search_user_bind_real_ldap3_mock_contract():
    from ldap3 import Connection, MOCK_SYNC, NONE, Server
    base = "DC=synthetic,DC=invalid"
    service_dn = "CN=Service," + base
    alice_dn = "CN=Alice," + base
    seen = []
    connections = []
    def factory(username, password):
        seen.append((username, password))
        connection = Connection(Server("synthetic.invalid", get_info=NONE), user=username, password=password,
                                client_strategy=MOCK_SYNC)
        connection.strategy.add_entry(service_dn, {"objectClass": ["person"], "userPassword": "service-secret"})
        connection.strategy.add_entry(alice_dn, {"objectClass": ["person", "user"], "sAMAccountName": "Alice", "userPassword": "sample"})
        connections.append(connection)
        return connection
    now = [1000]
    adapter = ActiveDirectoryAuthenticator({"baseDN": base, "bindUserDN": service_dn,
                                            "bindUserPassword": "service-secret"}, connection_factory=factory,
                                           clock=lambda: now[0])
    assert run(adapter)
    assert seen == [(service_dn, "service-secret"), (alice_dn, "sample")]
    assert all(connection.closed for connection in connections)
    assert not run(adapter, password="wrong")
    assert seen[-1] == (alice_dn, "wrong")
    assert len(seen) == 3  # Cache reuses DN, never successful credentials.
    assert run(adapter)
    now[0] += 61
    assert run(adapter)
    assert len(seen) == 6  # New service search after 60 seconds.
    assert not run(adapter, "DOMAIN\\Unknown")
    assert not run(adapter, "DOMAIN\\Alice*)(objectClass=*)")
    assert all(connection.closed for connection in connections)


def test_active_directory_service_bind_failure_and_transport_fail_closed():
    from ldap3 import Connection, MOCK_SYNC, NONE, Server
    def factory(username, password):
        return Connection(Server("synthetic.invalid", get_info=NONE), user=username,
                          password=password, client_strategy=MOCK_SYNC)
    adapter = ActiveDirectoryAuthenticator({"baseDN": "DC=invalid", "bindUserDN": "CN=Missing", "bindUserPassword": "private"}, connection_factory=factory)
    assert not run(adapter)
    adapter.connection_factory = lambda *_: (_ for _ in ()).throw(OSError("private"))
    assert not run(adapter)
