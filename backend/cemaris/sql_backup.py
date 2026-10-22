"""SQL Server's native replacement for Sunrise's SQLite backup helper.

The backup directory belongs to the SQL Server host, not the API host. Never
copy live MDF/LDF files or enable xp_cmdshell. Restore exercises always invent
a new disposable database and never accept an existing restore target.

Source: Sunrise database/backupDatabase.ts, helpers/database.helpers.ts and
tasks/backupDatabase.task.ts, MIT, City of Sault Ste. Marie.
"""

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import hashlib
import logging
from pathlib import Path, PurePosixPath, PureWindowsPath
import re
import stat
from time import monotonic
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool

logger = logging.getLogger(__name__)
_TEST_DATABASE = re.compile(r"cemaris_test_02_[a-f0-9]{32}\Z")


def _file_token(database_name: str) -> str:
    readable = re.sub(r"[^A-Za-z0-9_-]", "_", database_name)[:40] or "database"
    digest = hashlib.sha256(database_name.encode("utf-8")).hexdigest()[:16]
    return f"{readable}-{digest}"


def _backup_pattern(database_name: str) -> re.Pattern:
    return re.compile(r"cemaris-" + re.escape(_file_token(database_name))
                      + r"-\d{8}T\d{12}Z-[a-f0-9]{32}\.bak\Z")


def _server_path(directory: str, filename: str) -> str:
    if not isinstance(directory, str) or not directory or "\x00" in directory:
        raise ValueError("An absolute SQL Server directory is required")
    cls = PureWindowsPath if "\\" in directory or re.match(r"^[a-zA-Z]:", directory) else PurePosixPath
    folder = cls(directory)
    if not folder.is_absolute() or ".." in folder.parts:
        raise ValueError("An absolute SQL Server directory is required")
    return str(folder / filename)


def _basename(path: str) -> str:
    return (PureWindowsPath(path) if "\\" in path else PurePosixPath(path)).name


def _identifier(value: str) -> str:
    if not isinstance(value, str) or not value or len(value) > 128 or "\x00" in value:
        raise ValueError("Invalid SQL Server database identifier")
    return "[" + value.replace("]", "]]") + "]"


def _require_sql_server(engine: Engine) -> None:
    if engine.dialect.name != "mssql":
        raise ValueError("SQL Server is required")


@contextmanager
def _autocommit_connection(engine: Engine, *, timeout_seconds: int = 300):
    _require_sql_server(engine)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        driver = connection.connection.driver_connection
        previous_timeout = driver.timeout
        driver.timeout = timeout_seconds
        try:
            yield connection
        finally:
            driver.timeout = previous_timeout


def _execute_backup_command(connection, statement: str, parameters=()) -> None:
    # SQL Server can return several informational results during BACKUP/RESTORE.
    # Drain them before closing the cursor so no pending operation is cancelled.
    cursor = connection.connection.driver_connection.cursor()
    try:
        cursor.execute(statement, parameters)
        while cursor.nextset():
            pass
    finally:
        cursor.close()


def _remaining_backup_timeout(connection, deadline: float) -> None:
    # pyodbc accepts whole seconds; rounding down keeps both native commands
    # inside one overall budget rather than granting VERIFYONLY a fresh 300s.
    remaining = int(deadline - monotonic())
    if remaining < 1:
        raise TimeoutError("The SQL Server backup deadline has elapsed")
    connection.connection.driver_connection.timeout = remaining


def backup_database(engine: Engine, backup_directory: str | None, *,
                    verify: bool = True) -> str | bool:
    """Return the server-side backup path, or False without leaking SQL errors.

    None uses the instance's default backup directory. Automatic tasks remain
    opt-in; the operator must ensure the chosen/default storage is suitable.
    COPY_ONLY preserves any independently administered differential/log chain.
    """
    try:
        deadline = monotonic() + 300
        with _autocommit_connection(engine) as connection:
            _remaining_backup_timeout(connection, deadline)
            name = connection.scalar(text("SELECT DB_NAME()"))
            if name.lower() in {"master", "model", "msdb", "tempdb"}:
                raise ValueError("An application database is required")
            folder = backup_directory
            if folder is None:
                _remaining_backup_timeout(connection, deadline)
                folder = connection.scalar(text(
                    "SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))"))
            filename = (f"cemaris-{_file_token(name)}-"
                        f"{datetime.now(timezone.utc):%Y%m%dT%H%M%S%fZ}-{uuid4().hex}.bak")
            path = _server_path(folder, filename)
            _remaining_backup_timeout(connection, deadline)
            _execute_backup_command(connection,
                f"BACKUP DATABASE {_identifier(name)} TO DISK = ? WITH COPY_ONLY, CHECKSUM", (path,))
            if verify:
                _remaining_backup_timeout(connection, deadline)
                _execute_backup_command(connection,
                    "RESTORE VERIFYONLY FROM DISK = ? WITH CHECKSUM", (path,))
            if monotonic() > deadline:
                raise TimeoutError("The SQL Server backup deadline has elapsed")
            return path
    except Exception:
        # ODBC exceptions can contain server paths, SQL values and credentials.
        logger.warning("SQL Server backup or checksum verification failed")
        return False


def database_backup_info(engine: Engine) -> dict:
    """Report this database's latest completed Cemaris COPY_ONLY full backup.

    msdb is SQL Server metadata, never a test fixture or mutation target. Lack
    of metadata permission is distinguishable from a database with no backup.
    SQL Server stores local server timestamps; ISO strings carry no invented
    UTC offset. The server computes elapsed age independently of the API host's
    timezone; use that age, not a local interpretation of this date, in jobs.
    """
    empty = {"lastBackupDate": None, "lastBackupPath": None,
             "elapsedLastBackupMillis": None, "available": False}
    try:
        _require_sql_server(engine)
        with engine.connect() as connection:
            name = connection.scalar(text("SELECT DB_NAME()"))
            rows = connection.execute(text("""
                SELECT b.backup_finish_date, m.physical_device_name,
                       DATEDIFF_BIG(millisecond, b.backup_finish_date, SYSDATETIME())
                FROM msdb.dbo.backupset AS b
                JOIN msdb.dbo.backupmediafamily AS m ON b.media_set_id = m.media_set_id
                WHERE b.database_name = :name AND b.type = 'D'
                  AND b.is_copy_only = 1 AND b.has_backup_checksums = 1
                  AND b.backup_finish_date IS NOT NULL
                ORDER BY b.backup_finish_date DESC
            """), {"name": name})
            for completed, path, elapsed in rows:
                if _backup_pattern(name).fullmatch(_basename(path)):
                    return {"lastBackupDate": completed.isoformat(), "lastBackupPath": path,
                            "elapsedLastBackupMillis": int(elapsed), "available": True}
        return {**empty, "available": True}
    except Exception:
        logger.warning("SQL Server backup history is unavailable")
        return empty


def cleanup_old_backups(directory: str | Path, database_name: str,
                        delete_age_days: int = 0, *, verified_backup_path: str | None = None,
                        now: datetime | None = None) -> int:
    """Retain source mtime policy, scoped to this DB and a proven local mount.

    Call only after a successful verified SQL backup. Its unguessable generated
    basename must appear as a fresh nonempty regular file on the local mount;
    this establishes that SQL Server and Python see the same backup storage.
    Without a shared mount, retention belongs to the SQL Server operator.
    """
    if delete_age_days <= 0 or not verified_backup_path:
        return 0
    current = now or datetime.now(timezone.utc)
    pattern = _backup_pattern(database_name)
    proof_name = _basename(verified_backup_path)
    if not pattern.fullmatch(proof_name):
        return 0
    deleted = 0
    try:
        folder = Path(directory).resolve(strict=True)
        proof = (folder / proof_name).lstat()
        if (not stat.S_ISREG(proof.st_mode) or proof.st_size <= 0
                or abs(current.timestamp() - proof.st_mtime) > 300):
            return 0
        cutoff = (current - timedelta(days=delete_age_days)).timestamp()
        for candidate in folder.iterdir():
            if candidate.name == proof_name or not pattern.fullmatch(candidate.name):
                continue
            try:
                info = candidate.lstat()
                if stat.S_ISREG(info.st_mode) and info.st_mtime < cutoff:
                    candidate.unlink()
                    deleted += 1
            except OSError:
                logger.warning("A SQL Server backup retention candidate could not be processed")
    except OSError:
        logger.warning("SQL Server backup retention mount is unavailable")
    return deleted


def remove_disposable_backup(admin_engine: Engine, backup_path: str,
                             source_database: str, *, backup_directory: str) -> dict:
    """Remove one completed disposable test artifact, confirmed by SQL Server.

    SQL service ACLs can make Python's is_file()/exists() falsely suggest that
    a backup is absent. This helper has no wildcard/directory mode and cannot
    target application backups. The source test DB must already be disposed.
    It uses the existing exact-file procedure; no shell, ACL or server option
    is enabled. This is separate from operator-configured production retention.
    """
    _require_sql_server(admin_engine)
    if admin_engine.url.database != "master":
        raise ValueError("Backup artifact removal must explicitly target master")
    if not _TEST_DATABASE.fullmatch(source_database):
        raise ValueError("Only generated disposable test database backups may be removed")
    filename = _basename(backup_path)
    if (not _backup_pattern(source_database).fullmatch(filename)
            or any(character in backup_path for character in "*?")):
        raise ValueError("Only one exact generated backup filename may be removed")
    expected = _server_path(backup_directory, filename)
    if backup_path != expected:
        raise ValueError("Backup artifact must be in the explicit SQL Server backup directory")
    with _autocommit_connection(admin_engine) as connection:
        if connection.scalar(text("SELECT DB_NAME()")) != "master":
            raise ValueError("Backup artifact removal must connect to master")
        actual_directory = connection.scalar(text(
            "SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))"))
        if expected != _server_path(actual_directory, filename):
            raise ValueError("Backup artifact directory must match SQL Server default metadata")
        if connection.scalar(text("SELECT DB_ID(:name)"), {"name": source_database}) is not None:
            raise ValueError("The source disposable test database must already be removed")
        def metadata():
            return connection.execute(text(
                "SELECT file_exists, file_is_a_directory FROM sys.dm_os_file_exists(:path)"),
                {"path": expected}).mappings().one()
        before = metadata()
        if before["file_is_a_directory"]:
            raise ValueError("Backup artifact removal must never target a directory")
        if before["file_exists"]:
            _execute_backup_command(connection, "EXEC master.sys.xp_delete_files ?", (expected,))
        after = metadata()
        if after["file_exists"] or after["file_is_a_directory"]:
            raise RuntimeError("SQL Server did not confirm backup artifact removal")
        return {"backupPath": expected, "sourceDatabase": source_database,
                "fileExisted": bool(before["file_exists"]), "fileExistsAfter": False}


@contextmanager
def disposable_backup_restore(admin_engine: Engine, backup_path: str):
    """Exercise recovery on a fresh random database and remove that DB on exit.

    This is an operator/test helper, never an HTTP endpoint. The engine must
    explicitly target master. All files are moved to fresh instance-default
    paths, every restore is CHECKSUM/RECOVERY and REPLACE is never used.
    """
    _require_sql_server(admin_engine)
    if admin_engine.url.database != "master":
        raise ValueError("Restore administration must explicitly target master")
    name = "cemaris_test_02_" + uuid4().hex
    assert _TEST_DATABASE.fullmatch(name)
    restored_engine = None
    attempted = False
    try:
        with _autocommit_connection(admin_engine) as connection:
            if connection.scalar(text("SELECT DB_NAME()")) != "master":
                raise ValueError("Restore administration must connect to master")
            if connection.scalar(text("SELECT DB_ID(:name)"), {"name": name}) is not None:
                raise ValueError("Restore target must be new")
            files = connection.exec_driver_sql("RESTORE FILELISTONLY FROM DISK = ?", (backup_path,)).mappings().all()
            moves, params = [], [backup_path]
            for index, file in enumerate(files):
                kind = file["Type"]
                if kind not in {"D", "L"}:
                    raise ValueError("Restore exercise supports ordinary data/log files only")
                prop = "InstanceDefaultLogPath" if kind == "L" else "InstanceDefaultDataPath"
                folder = connection.scalar(text(f"SELECT CAST(SERVERPROPERTY('{prop}') AS nvarchar(4000))"))
                extension = ".ldf" if kind == "L" else ".mdf"
                target = _server_path(folder, f"{name}_{index}{extension}")
                moves.append("MOVE ? TO ?")
                params.extend([file["LogicalName"], target])
            if not moves:
                raise ValueError("Backup contains no database files")
            attempted = True
            _execute_backup_command(connection,
                f"RESTORE DATABASE {_identifier(name)} FROM DISK = ? WITH "
                + ", ".join(moves) + ", CHECKSUM, RECOVERY", tuple(params))
        restored_engine = create_engine(admin_engine.url.set(database=name), poolclass=NullPool,
                                       hide_parameters=True, connect_args={"timeout": 10})
        yield restored_engine, name
    finally:
        if restored_engine is not None:
            restored_engine.dispose()
        if attempted:
            with _autocommit_connection(admin_engine) as connection:
                if connection.scalar(text("SELECT DB_ID(:name)"), {"name": name}) is not None:
                    # A failed RESTORE can leave the newly created DB in
                    # RESTORING; ALTER ... SINGLE_USER is invalid in that state.
                    status = connection.scalar(text("SELECT DATABASEPROPERTYEX(:name, 'Status')"), {"name": name})
                    if status == "ONLINE":
                        connection.exec_driver_sql(f"ALTER DATABASE {_identifier(name)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE")
                    connection.exec_driver_sql(f"DROP DATABASE {_identifier(name)}")
