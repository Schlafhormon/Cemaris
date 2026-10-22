"""Step-15 production administration UI/API against disposable SQL Server.

The SQL Server default backup folder is read-only configuration metadata. Only
the new QA database receives backup/cleanup mutations; its exact generated
backup basename is checked and SQL Server confirms file removal afterwards.
"""
from datetime import datetime
import json
import os
from pathlib import Path
import sys
import time
from uuid import uuid4

import sqlalchemy as sa

from qa_auth_browser import main, ROOT
from qa_integrations_browser import graceful_stop
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.sql_backup import _autocommit_connection, _backup_pattern, _execute_backup_command, _TEST_DATABASE

DAY = 86_400_000
QA = ROOT / ".local/qa-step15"
FILES = QA / ("attachments-" + uuid4().hex)
DATABASE_NAME = None
BACKUP_DIRECTORY = None


def remove_generated_backup(database_name, directory, filename):
    """Delete only our random QA database's exact file and verify via SQL.

    SQL Server service ACLs can hide files from Python in the native Backup
    directory. Use its existing exact-file deletion helper without changing
    folder ACLs, enabling a shell, or accepting any wildcard/directory target.
    """
    if not _TEST_DATABASE.fullmatch(database_name) or not _backup_pattern(database_name).fullmatch(filename):
        raise RuntimeError("Only this run's generated disposable-database backup may be removed")
    folder = Path(directory).resolve()
    target = (folder / filename).resolve()
    if target.parent != folder or any(character in filename for character in "*?"):
        raise RuntimeError("Generated backup cleanup must stay in the configured SQL Server folder")
    engine = sa.create_engine(os.environ["CEMARIS_SQL_TEST_ADMIN_URL"], poolclass=sa.pool.NullPool, hide_parameters=True)
    try:
        if engine.url.database != "master":
            raise RuntimeError("QA backup cleanup must explicitly connect to master")
        with _autocommit_connection(engine) as connection:
            if connection.scalar(sa.text("SELECT DB_NAME()")) != "master":
                raise RuntimeError("QA backup cleanup must connect to master")
            current_directory = connection.scalar(sa.text("SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))"))
            if Path(current_directory).resolve() != folder:
                raise RuntimeError("QA backup cleanup directory must match SQL Server metadata")
            metadata = lambda: connection.execute(sa.text("SELECT * FROM sys.dm_os_file_exists(:path)"), {"path": str(target)}).mappings().one()
            before = metadata()
            if before["file_is_a_directory"]:
                raise RuntimeError("QA cleanup must never remove a directory")
            if before["file_exists"]:
                _execute_backup_command(connection, "EXEC master.sys.xp_delete_files ?", (str(target),))
            if metadata()["file_exists"]:
                raise RuntimeError("SQL Server did not confirm generated QA backup removal")
        print("Exact generated QA backup removed; SQL service confirms file_exists=0.")
    finally:
        engine.dispose()


def prepare(connection):
    global DATABASE_NAME, BACKUP_DIRECTORY
    DATABASE_NAME = connection.scalar(sa.text("SELECT DB_NAME()"))
    BACKUP_DIRECTORY = connection.scalar(sa.text("SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))"))
    ids = load_synthetic_fixtures(connection, expected_database=DATABASE_NAME).ids
    now = time.time_ns() // 1_000_000
    audit = TABLES["AuditLog"]
    connection.execute(audit.delete())
    long_value = json.dumps({"label": "Synthetic <literal> & Ä", "details": "Long value " + "x" * 140}, ensure_ascii=False)
    for index in range(58):
        millis = now - ((40, 100, 400)[index - 55] * DAY if index >= 55 else (index + 1) * 1000)
        date = datetime.fromtimestamp(millis / 1000)
        connection.execute(audit.insert().values(logMillis=millis, logDate=int(date.strftime("%Y%m%d")),
            logTime=int(date.strftime("%H%M")), mainRecordType="contract" if index % 2 == 0 or index >= 55 else "burialSite",
            mainRecordId=str(ids["contract"] if index % 2 == 0 or index >= 55 else ids["burial_site"]),
            updateTable="Contracts" if index % 2 == 0 else "BurialSites", recordIndex=str(index) if index % 2 else None,
            updateField=f"syntheticField{index:02d}", updateType=("created", "updated", "deleted")[index % 3],
            updateUsername="NeedleUserÄ" if index == 54 else "qa-audit",
            fromValue=None if index % 2 == 0 else "null", toValue=long_value if index == 0 else f"Synthetic <literal> & Ä {index:02d}"))
    old = now - 100 * DAY
    stamps = {"recordCreate_username": "qa-fixture", "recordUpdate_username": "qa-fixture",
        "recordCreate_timeMillis": old, "recordUpdate_timeMillis": old,
        "recordDelete_username": "qa-fixture", "recordDelete_timeMillis": old}
    connection.execute(TABLES["ContractComments"].insert().values(contractId=ids["contract"], commentDate=20260101,
        commentTime=1200, comment="Synthetic old soft-deleted comment for cleanup", **stamps))
    FILES.mkdir(parents=True, exist_ok=True)
    (FILES / "cleanup-synthetic.txt").write_text("Synthetic deleted attachment bytes", encoding="utf-8")
    connection.execute(TABLES["ContractAttachments"].insert().values(contractId=ids["contract"],
        attachmentTitle="Synthetic old deleted attachment", attachmentDetails="Step 15 QA",
        fileName="cleanup-synthetic.txt", filePath=str(FILES), **stamps))
    return {"CEMARIS_QA_OPERATIONS_IDS": json.dumps(ids), "CEMARIS_QA_AUDIT_LONG_VALUE": long_value,
        "CEMARIS_ATTACHMENTS_PATH": str(FILES), "CEMARIS_QA_OPERATIONS_DATABASE": DATABASE_NAME}


if __name__ == "__main__":
    QA.mkdir(parents=True, exist_ok=True)
    try:
        main("15", "frontend/scripts/operations-browser.mjs", {
            "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
            "CEMARIS_RECORD_DELETE_AGE_DAYS": "60", "CEMARIS_BACKUP_TASK_ENABLED": "false",
            "CEMARIS_BACKUP_DIRECTORY": "", "CEMARIS_BACKUP_DELETE_AGE_DAYS": "0",
        }, prepare_database=prepare, api_command=[sys.executable, "scripts/qa_integrations_server.py"], shutdown_api=graceful_stop)
        assert not (FILES / "cleanup-synthetic.txt").exists(), "Cleanup must remove old attachment bytes"
    finally:
        result_path = QA / "backup-result.json"
        if result_path.exists() and DATABASE_NAME and BACKUP_DIRECTORY:
            result = json.loads(result_path.read_text(encoding="utf-8"))
            name = result.get("fileName", "")
            if result.get("databaseName") == DATABASE_NAME and _backup_pattern(DATABASE_NAME).fullmatch(name):
                remove_generated_backup(DATABASE_NAME, BACKUP_DIRECTORY, name)
