"""Smoke and contract checks, deliberately without a substitute database."""

import json
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from cemaris.config import Settings
from cemaris.main import create_app


def test_health_and_public_config_do_not_connect_to_database():
    settings = Settings(
        _env_file=None,
        environment="test",
        database_url="mssql+pyodbc://user:secret@unreachable/CemarisPortTest",
    )
    with TestClient(create_app(settings)) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {
            "status": "ok", "application": "Cemaris", "version": "0.2.0"
        }
        assert UUID(response.headers["X-Request-ID"]).version == 4
        config = client.get("/api/config").json()
        assert config == {
            "application": "Cemaris", "version": "0.2.0",
            "supported_languages": ["en", "de"],
        }
        assert "secret" not in json.dumps(config)


@pytest.fixture
def client():
    app = create_app(Settings(_env_file=None, environment="test"))

    @app.get("/api/_test/number")
    def number(value: int):
        return {"value": value}

    @app.get("/api/_test/error")
    def error():
        raise RuntimeError("private exception details")

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.mark.parametrize(
    "method,path,status,code,message",
    [
        ("GET", "/api/missing", 404, "http_404", "Not Found"),
        ("POST", "/api/health", 405, "http_405", "Method Not Allowed"),
        ("GET", "/api/_test/error", 500, "internal_error", "Internal server error"),
    ],
)
def test_uniform_errors(client, method, path, status, code, message):
    # Reach method dispatch with a valid token; CSRF rejects unsafe requests
    # earlier in the middleware chain, as it does for all application routes.
    headers = {}
    if method != "GET":
        headers["X-CSRF-Token"] = client.get("/api/session").json()["csrfToken"]
    response = client.request(method, path, headers=headers)
    assert response.status_code == status
    error = response.json()["error"]
    assert error == {
        "code": code, "message": message, "details": [],
        "request_id": response.headers["X-Request-ID"],
    }
    assert "private exception details" not in response.text
    if status == 405:
        assert response.headers["Allow"] == "GET"


def test_validation_errors_keep_locations_but_omit_input(client):
    response = client.get("/api/_test/number?value=private-input")
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert error["request_id"] == response.headers["X-Request-ID"]
    assert error["details"][0]["location"] == ["query", "value"]
    assert "private-input" not in response.text


def test_production_does_not_publish_api_documentation():
    with TestClient(create_app(Settings(_env_file=None, environment="production"))) as client:
        assert client.get("/api/docs").status_code == 404
        assert client.get("/api/openapi.json").status_code == 404


def test_environment_configuration(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("CEMARIS_ENVIRONMENT", "production")
    monkeypatch.setenv("CEMARIS_LOG_LEVEL", "warning")
    settings = Settings(_env_file=None)
    assert settings.environment == "production"
    assert settings.log_level == "warning"


@pytest.mark.parametrize("url", ["sqlite:///test.db", "mssql+pyodbc://host", "invalid"])
def test_database_configuration_requires_sql_server_and_database(url):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url=url)


def test_invalid_configuration_fails_at_startup():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, environment="typo")
