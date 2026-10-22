"""Migration and data contracts, executed only against fresh real SQL Server DBs."""

import json
from pathlib import Path

from alembic import command
import pytest
from sqlalchemy import Unicode, func, inspect, literal, select, text, union_all
from sqlalchemy.exc import IntegrityError

from cemaris.db.schema import TABLES
from cemaris.db.semantics import burial_site_name_predicates, contains_name_predicates, contract_time_predicates
from conftest import migration_config


REFERENCE = json.loads((Path(__file__).parent / "fixtures/semantics-reference.json").read_text(encoding="utf-8"))

AUDIT = {
    "recordCreate_username": "test-synthetic",
    "recordUpdate_username": "test-synthetic",
    "recordCreate_timeMillis": 1_792_368_000_123,
    "recordUpdate_timeMillis": 1_792_368_000_123,
}


def test_migration_upgrade_downgrade_upgrade(disposable_sql_database):
    with disposable_sql_database() as (engine, _):
        with engine.begin() as connection:
            config = migration_config(connection)
            command.upgrade(config, "head")
            command.upgrade(config, "head")
            assert set(inspect(connection).get_table_names(schema="dbo")) == set(TABLES) | {"alembic_version"}
            command.check(config)
            command.downgrade(config, "base")
            assert set(inspect(connection).get_table_names(schema="dbo")) <= {"alembic_version"}
            command.upgrade(config, "head")
            assert len(inspect(connection).get_table_names(schema="dbo")) == 42


def test_all_schema_contracts_exist_on_sql_server(sql_connection):
    connection, _ = sql_connection
    inspector = inspect(connection)
    assert set(inspector.get_table_names(schema="dbo")) == set(TABLES) | {"alembic_version"}
    for table in TABLES.values():
        columns = inspector.get_columns(table.name, schema="dbo")
        assert [column["name"] for column in columns] == list(table.c.keys())
        for actual in columns:
            expected = table.c[actual["name"]]
            assert actual["nullable"] == expected.nullable
            assert (actual["default"] is not None) == (expected.server_default is not None and expected.identity is None)
            assert ("identity" in actual) == (expected.identity is not None)
        assert inspector.get_pk_constraint(table.name, schema="dbo")["constrained_columns"] == list(table.primary_key.columns.keys())
        assert len(inspector.get_foreign_keys(table.name, schema="dbo")) == len(table.foreign_key_constraints)
        # SQLAlchemy's MSSQL dialect does not implement get_check_constraints.
        check_count = connection.scalar(text(
            "SELECT COUNT(*) FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(:table)"
        ), {"table": "dbo." + table.name})
        assert check_count == sum(type(c).__name__ == "CheckConstraint" for c in table.constraints)
        assert {i["name"] for i in inspector.get_indexes(table.name, schema="dbo")} >= {i.name for i in table.indexes}


def test_all_41_tables_commit_and_reconnect(disposable_sql_database):
    from cemaris.db.fixtures import load_synthetic_fixtures

    with disposable_sql_database() as (engine, name):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), "head")
            fixture = load_synthetic_fixtures(connection, expected_database=name)
        engine.dispose()
        with engine.connect() as connection:
            for table in TABLES.values():
                assert connection.scalar(select(func.count()).select_from(table)) == fixture.row_counts[table.name], table.name
            cemeteries = TABLES["Cemeteries"]
            assert any("Ü" in row for row in connection.scalars(select(cemeteries.c.cemeteryName)))
            contracts = TABLES["Contracts"]
            sites = TABLES["BurialSites"]
            linked_cemetery = connection.scalar(
                select(cemeteries.c.cemeteryId).select_from(
                    contracts.join(sites).join(cemeteries, sites.c.cemeteryId == cemeteries.c.cemeteryId)
                ).where(contracts.c.contractId == fixture.ids["contract"])
            )
            assert linked_cemetery == fixture.ids["child_cemetery"]
            interments = TABLES["ContractInterments"]
            assert connection.execute(select(interments.c.birthDate, interments.c.deathDate, interments.c.deathAge)).one() == (19350000, 20261000, None)
            milestones = TABLES["WorkOrderMilestones"]
            assert connection.scalar(select(milestones.c.workOrderMilestoneDate)) == 0
            audit = TABLES["AuditLog"]
            audit_row = dict(connection.execute(select(audit)).mappings().one())
            connection.execute(audit.insert().values(**audit_row))
            assert connection.scalar(select(func.count()).select_from(audit)) == 2
            fees = TABLES["ContractFees"]
            connection.execute(fees.update().values(quantity=1.25, feeAmount=123.4567, taxAmount=0.125))
            row = connection.execute(select(fees.c.quantity, fees.c.feeAmount, fees.c.taxAmount)).first()
            assert tuple(row) == (1.25, 123.4567, 0.125)
            comments = TABLES["ContractComments"]
            before = connection.scalar(select(func.count()).select_from(comments))
            connection.execute(comments.update().values(recordDelete_username="test-synthetic", recordDelete_timeMillis=AUDIT["recordUpdate_timeMillis"]))
            assert connection.scalar(select(func.count()).select_from(comments)) == before
            assert connection.scalar(select(func.count()).select_from(comments).where(comments.c.recordDelete_timeMillis.is_(None))) == 0


def test_server_defaults_and_binary_keys(sql_connection):
    connection, _ = sql_connection
    users = TABLES["Users"]
    connection.execute(users.insert().values(username="Test", **AUDIT))
    connection.execute(users.insert().values(username="test", **AUDIT))
    row = connection.execute(select(users).where(users.c.username == "Test")).mappings().one()
    assert row["isActive"] is True
    assert row["isAdmin"] is False
    assert row["canUpdateCemeteries"] is False
    assert row["recordDelete_timeMillis"] is None
    assert row["recordCreate_timeMillis"] == AUDIT["recordCreate_timeMillis"]


def test_nullable_unique_and_soft_deleted_names_remain_reserved(sql_connection):
    connection, _ = sql_connection
    types = TABLES["BurialSiteTypes"]
    type_id = connection.scalar(types.insert().values(burialSiteType="Synthetic grave", **AUDIT).returning(types.c.burialSiteTypeId))
    cemeteries = TABLES["Cemeteries"]
    cemetery_id = connection.scalar(cemeteries.insert().values(cemeteryName="Synthetic", cemeteryKey="SYN", **AUDIT).returning(cemeteries.c.cemeteryId))
    sites = TABLES["BurialSites"]
    values = dict(burialSiteTypeId=type_id, burialSiteName="A 1", **AUDIT)
    values.update({f"burialSiteNameSegment{i}": "A" if i == 1 else "" for i in range(1, 6)})
    connection.execute(sites.insert().values(**values))
    connection.execute(sites.insert().values(**values))  # SQLite permits duplicate NULL-cemetery keys.
    connection.execute(sites.insert().values(**values, cemeteryId=cemetery_id, recordDelete_timeMillis=123))
    with pytest.raises(IntegrityError):
        connection.execute(sites.insert().values(**values, cemeteryId=cemetery_id))


@pytest.mark.parametrize("case", ["foreign-key", "coordinates", "negative-min-length", "related-contract-order", "not-null"])
def test_relational_and_check_constraints(sql_connection, case):
    connection, _ = sql_connection
    if case == "foreign-key":
        statement = TABLES["BurialSiteTypeFields"].insert().values(burialSiteTypeId=-999, burialSiteTypeField="Synthetic", **AUDIT)
    elif case == "coordinates":
        statement = TABLES["Cemeteries"].insert().values(cemeteryName="Synthetic", cemeteryKey="SYN", cemeteryLatitude=90.01, **AUDIT)
    elif case == "negative-min-length":
        statement = TABLES["ContractTypeFields"].insert().values(contractTypeField="Synthetic", minLength=-1, **AUDIT)
    elif case == "related-contract-order":
        statement = TABLES["RelatedContracts"].insert().values(contractIdA=2, contractIdB=1)
    else:
        statement = TABLES["Users"].insert().values(username=None, **AUDIT)
    with pytest.raises(IntegrityError):
        connection.execute(statement)


@pytest.mark.parametrize("case", REFERENCE["searches"], ids=lambda case: repr((case["query"], case["searchType"])))
def test_sql_search_matches_reference_cases(sql_connection, case):
    connection, _ = sql_connection
    rows = union_all(*(select(literal(i).label("id"), literal(name, type_=Unicode()).label("name")) for i, name in enumerate(REFERENCE["names"], 1))).subquery()
    for kind in ("site", "purchaser", "deceased"):
        predicates = (burial_site_name_predicates(rows.c.name, case["query"], case["searchType"])
                      if kind == "site" else contains_name_predicates(rows.c.name, case["query"]))
        actual = list(connection.scalars(select(rows.c.id).where(*predicates).order_by(rows.c.id)))
        assert actual == case[kind], kind


@pytest.mark.parametrize("name,query,search_type,expected", [
    ("🪦 ABC", "_ ABC", "startsWith", True),
    ("🪦🪦 ABC", "_ ABC", "startsWith", False),
    ("ABC 🪦", "ABC _", "endsWith", True),
    ("😀🪦", "__", "startsWith", True),
    ("😀🪦", "___", "endsWith", False),
    ("éX", "é_", "startsWith", True),
    ("e\u0301X", "é_", "startsWith", False),
    ("ÉX", "é_", "startsWith", False),
    ("e\u0301X", "e_X", "startsWith", True),
    ("A\u00adBC", "A_BC", "startsWith", True),
    ("AＢC", "A_C", "startsWith", True),
    ("AＢC", "_BC", "startsWith", False),
    ("A🪦 ", "A_ ", "endsWith", True),
    ("A🪦 ", "A_", "endsWith", False),
    ("🪦[!]", "%_[!]", "endsWith", True),
])
def test_scalar_wildcards_preserve_binary_literals_in_stored_columns(sql_connection, name, query, search_type, expected):
    connection, _ = sql_connection
    cemeteries = TABLES["Cemeteries"]
    identifier = connection.scalar(cemeteries.insert().values(
        cemeteryName=name, cemeteryKey="SYN-SCALAR", **AUDIT,
    ).returning(cemeteries.c.cemeteryId))
    matched = connection.scalar(select(cemeteries.c.cemeteryId).where(
        cemeteries.c.cemeteryId == identifier,
        *burial_site_name_predicates(cemeteries.c.cemeteryName, query, search_type),
    ))
    assert (matched is not None) is expected


@pytest.mark.parametrize("case", REFERENCE["contractResults"], ids=lambda case: str(case["contractTime"]))
def test_contract_date_boundaries_and_null_end(sql_connection, case):
    connection, _ = sql_connection
    rows = union_all(*(select(literal(i).label("id"), literal(start).label("start"), literal(end).label("end")) for i, start, end in REFERENCE["contracts"])).subquery()
    result = list(connection.scalars(select(rows.c.id).where(*contract_time_predicates(rows.c.start, rows.c.end, case["contractTime"], REFERENCE["today"])).order_by(rows.c.id)))
    assert result == case["ids"]
