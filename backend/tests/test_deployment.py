"""Deployment gates use real disposable SQL Server, never an application DB."""

import importlib
import json
from pathlib import Path
import re

import pytest
from sqlalchemy import inspect, select, func, text
from sqlalchemy.exc import DBAPIError

from cemaris.db.schema import TABLES
from cemaris.db.seed import seed_default_catalogs
from cemaris.auth_config import AuthSettings


@pytest.fixture
def deployment(monkeypatch):
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[2] / "deploy"))
    return tuple(importlib.import_module(name) for name in ("readiness", "migrate", "start"))


@pytest.mark.parametrize("source", [".env.example", "docs/DEPLOYMENT.md", "docs/portierung/ANMELDUNG.md"])
def test_documented_bootstrap_configuration_loads_through_real_auth_settings(source, tmp_path, monkeypatch):
    root = Path(__file__).resolve().parents[2]
    document = (root / source).read_text(encoding="utf-8")
    match = re.search(r"^(?:# )?(CEMARIS_AUTH_CONFIG=.+)$", document, re.MULTILINE)
    assert match is not None
    line = match[1]
    expected = json.loads(line.split("=", 1)[1])
    sample = tmp_path / ".env"
    sample.write_text("CEMARIS_AUTH_TYPE=plainText\n" + line + "\n", encoding="utf-8")
    monkeypatch.delenv("CEMARIS_AUTH_CONFIG", raising=False)
    monkeypatch.delenv("CEMARIS_AUTH_TYPE", raising=False)
    settings = AuthSettings(_env_file=sample)
    assert settings.type == "plainText"
    assert settings.config == expected
    assert list(settings.config["users"]) == ["\\administrator"]
    assert isinstance(settings.config["users"]["\\administrator"], str)


def test_migration_gate_initializes_empty_sql_database_and_preserves_data(deployment, disposable_sql_database):
    readiness, migrate, _ = deployment
    with disposable_sql_database() as (engine, _):
        with pytest.raises(DBAPIError):
            readiness.check_database(engine)
        migrate.migrate(engine)
        readiness.check_database(engine)
        with engine.begin() as connection:
            assert set(inspect(connection).get_table_names(schema="dbo")) == set(TABLES) | {"alembic_version"}
            seed_default_catalogs(connection)
            before = {name: connection.scalar(select(func.count()).select_from(table)) for name, table in TABLES.items()}
        migrate.migrate(engine)
        readiness.check_database(engine)
        with engine.connect() as connection:
            after = {name: connection.scalar(select(func.count()).select_from(table)) for name, table in TABLES.items()}
            assert after == before
            assert before["BurialSiteTypes"] > 0


def test_readiness_rejects_wrong_schema_revision(deployment, disposable_sql_database):
    readiness, migrate, _ = deployment
    with disposable_sql_database() as (engine, _):
        migrate.migrate(engine)
        with engine.begin() as connection:
            original = connection.scalar(text("SELECT version_num FROM dbo.alembic_version"))
            connection.execute(text("UPDATE dbo.alembic_version SET version_num='unknown-image'"))
        with pytest.raises(RuntimeError, match="does not match"):
            readiness.check_database(engine)
        with engine.begin() as connection:
            connection.execute(text("UPDATE dbo.alembic_version SET version_num=:revision"), {"revision": original})
        readiness.check_database(engine)


@pytest.mark.parametrize("database", ["master", "MODEL", "msdb", "tempdb", "", None])
def test_system_databases_are_rejected_before_migration(deployment, database):
    readiness, _, _ = deployment
    class Connection:
        def scalar(self, _):
            return database
    with pytest.raises(RuntimeError, match="dedicated application database"):
        readiness.application_database(Connection())


def test_failed_readiness_does_not_leak_connection_details(deployment, monkeypatch, capsys):
    readiness, _, _ = deployment
    def unavailable():
        raise RuntimeError("ODBC connection Password=synthetic-private-value")
    monkeypatch.setattr(readiness, "check_database", unavailable)
    assert readiness.main() == 1
    assert "synthetic-private-value" not in capsys.readouterr().err


def test_http_healthcheck_requires_running_api_before_sql_probe(deployment, monkeypatch, capsys):
    readiness, _, _ = deployment
    probes = []
    monkeypatch.setattr(readiness, "check_database", lambda: probes.append("SQL"))
    def disconnected(*args, **kwargs):
        raise ConnectionError("synthetic private connection")
    monkeypatch.setattr(readiness, "urlopen", disconnected)
    assert readiness.main(probe_http=True) == 1
    assert probes == []
    assert "synthetic private" not in capsys.readouterr().err


def test_failed_start_never_launches_application_or_jobs(deployment, monkeypatch):
    _, _, start = deployment
    monkeypatch.setattr(start, "database_ready", lambda: 1)
    monkeypatch.setattr(start.os, "execv", lambda *_: pytest.fail("must not start Uvicorn"))
    assert start.main() == 1


def test_successful_start_uses_one_worker_and_no_untrusted_proxy_headers(deployment, monkeypatch):
    _, _, start = deployment
    monkeypatch.setattr(start, "database_ready", lambda: 0)
    launched = []
    class Executed(Exception):
        pass
    def execute(executable, arguments):
        launched.extend(arguments)
        assert executable == start.sys.executable
        raise Executed()
    monkeypatch.setattr(start.os, "execv", execute)
    with pytest.raises(Executed):
        start.main()
    assert launched[launched.index("--workers") + 1] == "1"
    assert "--no-proxy-headers" in launched
    assert "--no-access-log" in launched  # Calendar URLs contain personal API keys.
