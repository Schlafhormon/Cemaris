"""Target comparisons against actually executed frozen Sunrise operation bodies.

The fixture's SQLite runs are source-only oracles. Every target persistence
comparison below uses the harness's new disposable Microsoft SQL Server DB.
"""

import json
from pathlib import Path

import pytest
import sqlalchemy as sa

from cemaris.cleanup_rules import CLEANUP_RULES
from cemaris.db.schema import TABLES
from cemaris.operations import OperationsOptions, cleanup_database, get_audit_log, purge_audit_log


REFERENCE = json.loads((Path(__file__).parent / "fixtures/operations-reference.json").read_text(encoding="utf-8"))
ADAPTED_PARENT_CASES = {
    "service-relation-missing-from-contract-protection",
    "active-child-cemetery-not-protected-by-source-delete",
    "fee-reference-missing-from-site-type-protection",
}


def test_cleanup_order_and_queries_match_executed_original_body():
    # The original fake boundary reports one change per statement. Attachment
    # deletion is per returned file and absent from the no-attachment trace.
    actual = [sql for kind, table, sql in CLEANUP_RULES if not (kind == "purge" and table == "ContractAttachments")]
    expected = [event[1] for event in REFERENCE["cleanupTrace"]["events"] if event[0] in {"run", "all"}]
    assert actual == expected


@pytest.mark.parametrize("option,source", [
    ("record_delete_age_days", "settings.adminCleanup.recordDeleteAgeDays"),
    ("backup_task_enabled", "settings.databaseBackup.taskIsEnabled"),
    ("backup_hour", "settings.databaseBackup.backupHour"),
    ("backup_delete_age_days", "settings.databaseBackup.deleteAgeDays"),
])
def test_operational_defaults_match_actual_frozen_configuration(option, source):
    assert getattr(OperationsOptions(_env_file=None), option) == REFERENCE["configDefaults"][source]


def insert_with_parents(connection, name, supplied):
    """Satisfy SQL Server FKs with synthetic parents absent from source-only data."""
    table = TABLES[name]
    values = dict(supplied)
    primary_keys = list(table.primary_key.columns)
    for column in table.columns:
        if column.name in values or column.nullable or (column.server_default is not None and column.identity is None):
            continue
        if column.primary_key and len(primary_keys) == 1 and isinstance(column.type, sa.Integer):
            values[column.name] = (connection.scalar(sa.select(sa.func.max(column))) or 0) + 1
        else:
            values[column.name] = 1 if isinstance(column.type, (sa.Integer, sa.Numeric, sa.Float, sa.Boolean)) else "Synthetic"[:getattr(column.type, "length", None)]
    for foreign in table.foreign_key_constraints:
        parent = foreign.referred_table
        parent_values = {element.column.name: values.get(element.parent.name) for element in foreign.elements}
        if any(value is None for value in parent_values.values()):
            continue
        predicate = [parent.c[key] == value for key, value in parent_values.items()]
        if connection.scalar(sa.select(sa.literal(1)).select_from(parent).where(*predicate)) is None:
            insert_with_parents(connection, parent.name, parent_values)
    connection.execute(table.insert().values(**values))


@pytest.mark.parametrize("case", [case for case in REFERENCE["cleanup"] if case["name"] not in ADAPTED_PARENT_CASES], ids=lambda case: case["name"])
def test_cleanup_source_row_lifecycle_on_sql_server(sql_connection, tmp_path, case):
    connection, _ = sql_connection
    for name, supplied in case["seeds"]:
        values = dict(supplied)
        if name == "ContractAttachments":
            values["filePath"] = str(tmp_path)
        insert_with_parents(connection, name, values)
    for filename, state in case.get("files", {}).items():
        if state == "exists":
            (tmp_path / Path(filename).name).write_bytes(b"Synthetic attachment")
    for expected in case["expected"]:
        actual = cleanup_database(connection, "synthetic-admin", record_delete_age_days=case.get("ageDays", 60),
                                  attachments_path=tmp_path, now_millis=expected["now"])
        assert actual == expected["result"]
        for table_name, wanted in expected["rows"].items():
            table = TABLES[table_name]
            keys = [column.name for column in table.columns if column.name.endswith(("Id", "Index", "Number")) or column.name.startswith("recordDelete_")]
            rows = [dict(row) for row in connection.execute(sa.select(*(table.c[key] for key in keys))).mappings()] if keys else [{} for _ in connection.execute(sa.select(sa.literal(1)).select_from(table))]
            assert sorted(rows, key=lambda row: json.dumps(row, sort_keys=True)) == sorted(wanted, key=lambda row: json.dumps(row, sort_keys=True)), table_name


@pytest.mark.parametrize("case", REFERENCE["audit"], ids=lambda case: f'{case["filters"]}-{case["options"]}')
def test_admin_audit_filters_and_pages_match_original_on_sql_server(sql_connection, case):
    connection, _ = sql_connection
    for seed in REFERENCE["auditSeeds"]:
        connection.execute(TABLES["AuditLog"].insert().values(**seed, logTime=1234, updateTable="Synthetic", updateField="Synthetic", updateType="updated"))
    result = get_audit_log(connection, case["filters"], **case["options"])
    assert {"ids": [row["mainRecordId"] for row in result["auditLogEntries"]], "count": result["count"]} == case["expected"]


@pytest.mark.parametrize("case", REFERENCE["auditUnicode"], ids=lambda case: case["pattern"])
def test_admin_audit_unicode_and_wildcards_match_actual_original_on_sql_server(sql_connection, case):
    connection, _ = sql_connection
    for index, username in enumerate(REFERENCE["auditUnicodeNames"]):
        connection.execute(TABLES["AuditLog"].insert().values(logMillis=index + 1, logDate=20261021, logTime=1234,
            mainRecordType="user", mainRecordId=str(index + 1), updateTable="Users", updateField="Synthetic", updateType="updated", updateUsername=username))
    result = get_audit_log(connection, {"updateUsername": case["pattern"]})
    assert {"ids": [row["mainRecordId"] for row in result["auditLogEntries"]], "count": result["count"]} == case["expected"]


@pytest.mark.parametrize("case", REFERENCE["purge"], ids=lambda case: case["age"])
def test_purge_strict_cutoff_and_everything_boundary_match_original_on_sql_server(sql_connection, case):
    connection, _ = sql_connection
    table = TABLES["AuditLog"]
    for log_millis in REFERENCE["purgeSeeds"]:
        connection.execute(table.insert().values(logMillis=log_millis, logDate=20231114, logTime=2213, mainRecordType="contract",
            mainRecordId="1", updateTable="Contracts", updateField="purchaserName", updateType="updated", updateUsername="synthetic-admin"))
    assert purge_audit_log(connection, case["age"], now_millis=REFERENCE["now"]) == case["expected"]
    assert list(connection.scalars(sa.select(table.c.logMillis).order_by(table.c.logMillis))) == case["remaining"]
