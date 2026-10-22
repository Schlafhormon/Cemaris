"""Environment-based configuration; no database connections during startup."""

from typing import Literal
from urllib.parse import urlsplit

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    environment: Literal["development", "test", "production"] = "development"
    log_level: Literal["critical", "error", "warning", "info", "debug"] = "info"
    database_url: SecretStr | None = None
    app_url: str | None = None

    @field_validator("app_url")
    @classmethod
    def require_public_http_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError("Expected an absolute public HTTP(S) application URL without credentials, query or fragment")
        return value.rstrip("/")

    @field_validator("database_url")
    @classmethod
    def require_sql_server(cls, value: SecretStr | None) -> SecretStr | None:
        if value is None:
            return None
        try:
            url = make_url(value.get_secret_value())
        except ArgumentError:
            raise ValueError("Expected a SQL Server connection URL") from None
        if url.drivername != "mssql+pyodbc" or not url.database:
            raise ValueError("Expected mssql+pyodbc and an explicit database name")
        return value
