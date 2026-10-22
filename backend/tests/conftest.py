"""Live tests create and drop only databases invented by this test run.

CEMARIS_SQL_TEST_ADMIN_URL must explicitly target master. It is deliberately
separate from the application URL; no existing application database is a fixture.
"""

from contextlib import contextmanager
import os
from pathlib import Path
import re
from uuid import uuid4

from alembic import command
from alembic.config import Config
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from cemaris.db.engine import create_database_engine

BACKEND = Path(__file__).resolve().parents[1]


def migration_config(connection) -> Config:
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND / "migrations"))
    config.attributes["connection"] = connection
    return config


@pytest.fixture(scope="session")
def disposable_sql_database():
    raw_url = os.environ.get("CEMARIS_SQL_TEST_ADMIN_URL")
    if not raw_url:
        pytest.skip("Live SQL Server: set CEMARIS_SQL_TEST_ADMIN_URL targeting master")
    admin_url = make_url(raw_url)
    if admin_url.drivername != "mssql+pyodbc" or admin_url.database != "master":
        pytest.fail("SQL test administration URL must explicitly target SQL Server master")

    @contextmanager
    def create():
        # No caller-supplied deletion target: this exact fresh name is retained.
        name = "cemaris_test_02_" + uuid4().hex
        assert re.fullmatch(r"cemaris_test_02_[a-f0-9]{32}", name)
        admin = create_engine(
            admin_url, isolation_level="AUTOCOMMIT", poolclass=NullPool,
            hide_parameters=True, connect_args={"timeout": 10},
        )
        engine = None
        created = False
        try:
            with admin.connect() as connection:
                assert connection.scalar(text("SELECT DB_NAME()")) == "master"
                assert connection.scalar(text("SELECT DB_ID(:name)"), {"name": name}) is None
                connection.exec_driver_sql(f"CREATE DATABASE [{name}]")
                created = True
            engine = create_database_engine(admin_url.set(database=name))
            with engine.connect() as connection:
                assert connection.scalar(text("SELECT DB_NAME()")) == name
                version = connection.scalar(text("SELECT SERVERPROPERTY('ProductMajorVersion')"))
                assert int(version) >= 15, "Cemaris requires SQL Server 2019+"
            yield engine, name
        finally:
            if engine is not None:
                engine.dispose()
            if created:
                with admin.connect() as connection:
                    assert connection.scalar(text("SELECT DB_NAME()")) == "master"
                    connection.exec_driver_sql(f"ALTER DATABASE [{name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE")
                    connection.exec_driver_sql(f"DROP DATABASE [{name}]")
                    assert connection.scalar(text("SELECT DB_ID(:name)"), {"name": name}) is None
            admin.dispose()

    return create


@pytest.fixture(scope="module")
def migrated_sql_database(disposable_sql_database):
    with disposable_sql_database() as (engine, name):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), "head")
        yield engine, name


@pytest.fixture
def sql_connection(migrated_sql_database):
    engine, name = migrated_sql_database
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            yield connection, name
        finally:
            if transaction.is_active:
                transaction.rollback()
