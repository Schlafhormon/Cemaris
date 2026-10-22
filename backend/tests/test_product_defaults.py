"""Upgrade real 0.1 data to German product defaults without changing business data."""
from alembic import command
import pytest
import sqlalchemy as sa

from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from conftest import migration_config


def test_existing_installation_upgrade_preserves_custom_values_and_amounts(disposable_sql_database):
    with disposable_sql_database() as (engine, name):
        with engine.begin() as connection:
            config = migration_config(connection)
            command.upgrade(config, "0001")
            fixture = load_synthetic_fixtures(connection, expected_database=name)
            table = TABLES["BurialSiteTypes"]
            audit = dict(recordCreate_username="databaseInit", recordUpdate_username="databaseInit",
                         recordCreate_timeMillis=1, recordUpdate_timeMillis=1)
            untouched = connection.scalar(table.insert().values(burialSiteType="In-Ground Grave", **audit).returning(table.c.burialSiteTypeId))
            custom = connection.scalar(table.insert().values(burialSiteType="Columbarium", **{**audit, "recordUpdate_username": "operator"}).returning(table.c.burialSiteTypeId))
            fees = TABLES["ContractFees"]
            amounts = connection.execute(sa.select(fees.c.quantity, fees.c.feeAmount, fees.c.taxAmount)).all()
            command.upgrade(config, "head")
            command.upgrade(config, "head")
            assert connection.scalar(sa.select(table.c.burialSiteType).where(table.c.burialSiteTypeId == untouched)) == "Erdgrab"
            assert connection.scalar(sa.select(table.c.burialSiteType).where(table.c.burialSiteTypeId == custom)) == "Columbarium"
            assert connection.execute(sa.select(fees.c.quantity, fees.c.feeAmount, fees.c.taxAmount)).all() == amounts
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["Contracts"])) == fixture.row_counts["Contracts"]
            cemetery = TABLES["Cemeteries"]
            connection.execute(cemetery.update().values(cemeteryCity="Bad Homburg vor der Höhe", cemeteryProvince="Baden-Württemberg"))
            assert connection.execute(sa.select(cemetery.c.cemeteryCity, cemetery.c.cemeteryProvince)).first() == ("Bad Homburg vor der Höhe", "Baden-Württemberg")
            command.check(config)


def test_downgrade_does_not_truncate_new_german_addresses(disposable_sql_database):
    with disposable_sql_database() as (engine, name):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), "head")
            load_synthetic_fixtures(connection, expected_database=name)
            connection.execute(TABLES["Cemeteries"].update().values(cemeteryProvince="Baden-Württemberg"))
        with pytest.raises(RuntimeError, match="Address values exceed"):
            with engine.begin() as connection:
                command.downgrade(migration_config(connection), "0002")
        with engine.connect() as connection:
            assert connection.scalar(sa.text("SELECT version_num FROM dbo.alembic_version")) == "0003"
            assert connection.scalar(sa.select(TABLES["Cemeteries"].c.cemeteryProvince).limit(1)) == "Baden-Württemberg"
