"""Fixture safety and initial catalog contracts; persistence cases use real SQL Server."""

from types import SimpleNamespace

import pytest
from sqlalchemy import func, select

from cemaris.db.fixtures import FIXTURE_TIME_MILLIS, UnsafeFixtureDatabase, load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.db.seed import DEFAULT_CATALOGS, seed_default_catalogs


@pytest.mark.parametrize("name", [
    None, "", "master", "Cemaris", "cemaris_test_", "cemaris_test_a;DROP",
    "cemaris_test_a]", "cemaris_test_../data", "cemaris_test_" + "a" * 128,
])
def test_fixture_rejects_unsafe_database_name_before_connection_use(name):
    # This object cannot query or mutate anything. Rejection must precede I/O.
    with pytest.raises(UnsafeFixtureDatabase):
        load_synthetic_fixtures(object(), expected_database=name)


def test_fixture_rejects_other_database_engines_before_queries():
    connection = SimpleNamespace(dialect=SimpleNamespace(name="sqlite"))
    with pytest.raises(UnsafeFixtureDatabase, match="SQL Server"):
        load_synthetic_fixtures(connection, expected_database="cemaris_test_unit")


def _counts(connection):
    return {name: connection.scalar(select(func.count()).select_from(table)) for name, table in TABLES.items()}


def test_fixture_wrong_database_and_existing_rows_cannot_insert(sql_connection):
    connection, name = sql_connection
    with pytest.raises(UnsafeFixtureDatabase, match="differs"):
        load_synthetic_fixtures(connection, expected_database=name + "_wrong")
    assert not any(_counts(connection).values())

    users = TABLES["Users"]
    connection.execute(users.insert().values(
        username="existing-synthetic", recordCreate_username="test",
        recordCreate_timeMillis=FIXTURE_TIME_MILLIS, recordUpdate_username="test",
        recordUpdate_timeMillis=FIXTURE_TIME_MILLIS,
    ))
    before = _counts(connection)
    with pytest.raises(UnsafeFixtureDatabase, match="not empty"):
        load_synthetic_fixtures(connection, expected_database=name)
    assert _counts(connection) == before


def test_initial_catalog_values_and_repeat_are_stable(sql_connection):
    connection, _ = sql_connection
    inserted = seed_default_catalogs(connection, time_millis=FIXTURE_TIME_MILLIS)
    assert len(inserted) == 11
    assert sum(inserted.values()) == 46
    before = {}
    for name, expected_records in DEFAULT_CATALOGS.items():
        table = TABLES[name]
        records = connection.execute(select(table).order_by(*table.primary_key)).mappings().all()
        before[name] = [dict(row) for row in records]
        assert len(records) == len(expected_records)
        for actual, expected in zip(records, expected_records, strict=True):
            assert {key: actual[key] for key in expected} == expected
            assert actual["recordCreate_username"] == "databaseInit"
            assert actual["recordUpdate_username"] == "databaseInit"
            assert actual["recordCreate_timeMillis"] == FIXTURE_TIME_MILLIS
            assert actual["recordUpdate_timeMillis"] == FIXTURE_TIME_MILLIS
            assert actual["recordDelete_username"] is None
            assert actual["recordDelete_timeMillis"] is None
            if "isAvailableOnPortal" in actual:
                assert actual["isAvailableOnPortal"] is False

    # Concrete source edge cases: blank capacity -> NULL, repeated order 2/7,
    # only Preneed/Urn have their respective flags set.
    burial = before["BurialSiteTypes"]
    assert [row["orderNumber"] for row in burial] == [1, 2, 2, 2, 2, 2]
    assert burial[1]["crematedCapacityMax"] is None
    assert [row["isPreneed"] for row in before["ContractTypes"]] == [True, False, False]
    containers = before["IntermentContainerTypes"]
    assert [row["orderNumber"] for row in containers][-2:] == [7, 7]
    assert [row["intermentContainerTypeKey"] for row in containers] == ["NS", "CL", "UV", "CV", "WS", "SV", "SH", "U"]
    assert [row["isCremationType"] for row in containers] == [False] * 7 + [True]

    assert all(value == 0 for value in seed_default_catalogs(connection, time_millis=FIXTURE_TIME_MILLIS + 1).values())
    for name in DEFAULT_CATALOGS:
        table = TABLES[name]
        assert [dict(row) for row in connection.execute(select(table).order_by(*table.primary_key)).mappings()] == before[name]
    assert connection.scalar(select(func.count()).select_from(TABLES["AuditLog"])) == 0


def test_catalog_seed_preserves_custom_active_rows_and_deleted_history(sql_connection):
    connection, _ = sql_connection
    table = TABLES["BurialSiteTypes"]
    audit = {
        "recordCreate_username": "test", "recordUpdate_username": "test",
        "recordCreate_timeMillis": FIXTURE_TIME_MILLIS, "recordUpdate_timeMillis": FIXTURE_TIME_MILLIS,
    }
    identifier = connection.scalar(table.insert().values(burialSiteType="Custom synthetic", **audit).returning(table.c.burialSiteTypeId))
    assert seed_default_catalogs(connection, time_millis=FIXTURE_TIME_MILLIS)[table.name] == 0
    assert connection.scalar(select(func.count()).select_from(table)) == 1

    connection.execute(table.update().where(table.c.burialSiteTypeId == identifier).values(
        recordDelete_username="test", recordDelete_timeMillis=FIXTURE_TIME_MILLIS + 1,
    ))
    assert seed_default_catalogs(connection, time_millis=FIXTURE_TIME_MILLIS + 2)[table.name] == 6
    deleted = connection.execute(select(table).where(table.c.burialSiteTypeId == identifier)).mappings().one()
    assert deleted["burialSiteType"] == "Custom synthetic"
    assert deleted["recordDelete_timeMillis"] == FIXTURE_TIME_MILLIS + 1
    assert connection.scalar(select(func.count()).select_from(table)) == 7
