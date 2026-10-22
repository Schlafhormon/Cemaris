"""Native SQL Server backup contracts and disposable real recovery exercises."""

from contextlib import nullcontext
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import stat
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from alembic import command
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from cemaris import sql_backup as backup
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from conftest import migration_config


NOW = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)


def filename(name="Synthetic database", stamp="20261021T120000000000Z", suffix="a" * 32):
    return f"cemaris-{backup._file_token(name)}-{stamp}-{suffix}.bak"


@pytest.mark.parametrize("directory,expected", [
    ("/var/opt/mssql/backup", "/var/opt/mssql/backup/sample.bak"),
    (r"C:\SQL\Backups", r"C:\SQL\Backups\sample.bak"),
    (r"\\server\backup\cemaris", r"\\server\backup\cemaris\sample.bak"),
    ("C:/SQL/Backups", r"C:\SQL\Backups\sample.bak"),
])
def test_server_paths_keep_sql_host_platform_independent_of_api(directory, expected):
    assert backup._server_path(directory, "sample.bak") == expected


@pytest.mark.parametrize("directory", ["", ".", "backup", "../backup", "/sql/../backup",
                                        "C:backup", "C:\\sql\\..\\backup", "C:\\sql\x00backup", None])
def test_relative_or_ambiguous_server_backup_paths_are_rejected(directory):
    with pytest.raises(ValueError, match="absolute SQL Server"):
        backup._server_path(directory, "sample.bak")


def test_filename_token_is_safe_and_database_specific_including_case_and_unicode():
    names = ["Database", "database", "A/B", "A\\B", "Datenbank ä😀", "a" * 127 + "1", "a" * 127 + "2"]
    tokens = [backup._file_token(name) for name in names]
    assert len(set(tokens)) == len(tokens)
    for name, token in zip(names, tokens):
        assert len(token) <= 57
        assert backup._backup_pattern(name).fullmatch(filename(name))
        assert "/" not in token and "\\" not in token


def test_backup_native_commands_use_checksum_copy_only_autocommit_and_bound_path(monkeypatch):
    connection = Mock()
    connection.scalar.return_value = "Synthetic ]'; db"
    scope = Mock(return_value=nullcontext(connection))
    execute = Mock()
    monkeypatch.setattr(backup, "_autocommit_connection", scope)
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    engine = object()
    result = backup.backup_database(engine, "/sql/operator's backup")
    assert backup._backup_pattern(connection.scalar.return_value).fullmatch(backup._basename(result))
    scope.assert_called_once_with(engine)
    commands = execute.call_args_list
    assert commands[0].args[1] == "BACKUP DATABASE [Synthetic ]]'; db] TO DISK = ? WITH COPY_ONLY, CHECKSUM"
    assert commands[1].args[1] == "RESTORE VERIFYONLY FROM DISK = ? WITH CHECKSUM"
    assert commands[0].args[2] == commands[1].args[2] == (result,)
    assert "operator's backup" not in commands[0].args[1]


def test_manual_unverified_backup_and_instance_default_directory(monkeypatch):
    connection = Mock()
    connection.scalar.side_effect = ["Synthetic", "/server/default"]
    execute = Mock()
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    path = backup.backup_database(object(), None, verify=False)
    assert path.startswith("/server/default/")
    assert execute.call_count == 1
    assert "InstanceDefaultBackupPath" in str(connection.scalar.call_args.args[0])


@pytest.mark.parametrize("verification_time,expected_timeouts", [(1250, [290, 50]), (1300, [290])])
def test_backup_and_verify_share_one_total_monotonic_deadline(monkeypatch, verification_time, expected_timeouts):
    connection = Mock()
    connection.scalar.return_value = "Synthetic"
    clock = iter([1000, 1000, 1010, verification_time, 1299])
    timeouts = []
    monkeypatch.setattr(backup, "monotonic", lambda: next(clock))
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", lambda current, *args:
                        timeouts.append(current.connection.driver_connection.timeout))
    result = backup.backup_database(object(), "/sql/backup")
    assert timeouts == expected_timeouts
    assert isinstance(result, str) if verification_time < 1300 else result is False


@pytest.mark.parametrize("name", ["master", "MODEL", "msdb", "tempdb"])
def test_backup_refuses_system_database(monkeypatch, name):
    connection = Mock()
    connection.scalar.return_value = name
    execute = Mock()
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    assert backup.backup_database(object(), "/sql/backups") is False
    execute.assert_not_called()


@pytest.mark.parametrize("failure_at", [0, 1])
def test_backup_failure_never_exposes_sql_credentials_or_path(monkeypatch, caplog, failure_at):
    connection = Mock()
    connection.scalar.return_value = "Synthetic"
    execute = Mock(side_effect=([RuntimeError("PWD=secret /private/path")]
                               if failure_at == 0 else [None, RuntimeError("PWD=secret /private/path")]))
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    assert backup.backup_database(object(), "/sql/backups") is False
    assert "failed" in caplog.text
    assert "secret" not in caplog.text and "/private/path" not in caplog.text


def test_backup_cursor_drains_result_sets_and_closes_even_on_error():
    connection = Mock()
    cursor = connection.connection.driver_connection.cursor.return_value
    cursor.nextset.side_effect = [True, True, False]
    backup._execute_backup_command(connection, "SQL command", ("bound",))
    cursor.execute.assert_called_once_with("SQL command", ("bound",))
    assert cursor.nextset.call_count == 3
    cursor.close.assert_called_once()
    cursor.reset_mock()
    cursor.execute.side_effect = RuntimeError("Failure")
    with pytest.raises(RuntimeError):
        backup._execute_backup_command(connection, "SQL command")
    cursor.close.assert_called_once()


def test_backup_timeout_and_autocommit_are_scoped_and_restored_on_failure():
    connection = Mock()
    connection.connection.driver_connection.timeout = 30
    connection.__enter__ = Mock(return_value=connection)
    connection.__exit__ = Mock(return_value=False)
    engine = SimpleNamespace(dialect=SimpleNamespace(name="mssql"), connect=Mock())
    engine.connect.return_value.execution_options.return_value = connection
    with pytest.raises(RuntimeError):
        with backup._autocommit_connection(engine) as current:
            assert current is connection
            assert current.connection.driver_connection.timeout == 300
            raise RuntimeError("Failure")
    assert connection.connection.driver_connection.timeout == 30
    engine.connect.return_value.execution_options.assert_called_once_with(isolation_level="AUTOCOMMIT")


@pytest.mark.parametrize("dialect", ["sqlite", "postgresql"])
def test_no_sqlite_or_other_database_is_a_backup_or_restore_substitute(dialect):
    engine = SimpleNamespace(dialect=SimpleNamespace(name=dialect))
    assert backup.backup_database(engine, "/sql/backup") is False
    assert backup.database_backup_info(engine)["available"] is False
    with pytest.raises(ValueError, match="SQL Server"):
        with backup.disposable_backup_restore(engine, "backup.bak"):
            pass


def test_backup_history_uses_own_completed_checksum_full_copy_only_backups(monkeypatch):
    connection = Mock()
    connection.scalar.return_value = "Synthetic database"
    completed = datetime(2026, 10, 20, 12, 30)
    path = "/sql/backup/" + filename()
    connection.execute.return_value = [(NOW, "/backup/other.bak", 0), (completed, path, 1_800_000)]
    connection.__enter__ = Mock(return_value=connection)
    connection.__exit__ = Mock(return_value=False)
    engine = SimpleNamespace(dialect=SimpleNamespace(name="mssql"), connect=lambda: connection)
    assert backup.database_backup_info(engine) == {"lastBackupDate": completed.isoformat(),
        "lastBackupPath": path, "elapsedLastBackupMillis": 1_800_000, "available": True}
    sql = str(connection.execute.call_args.args[0])
    assert "b.type = 'D'" in sql and "b.is_copy_only = 1" in sql
    assert "b.has_backup_checksums = 1" in sql and "b.backup_finish_date IS NOT NULL" in sql
    assert "DATEDIFF_BIG(millisecond, b.backup_finish_date, SYSDATETIME())" in sql
    assert connection.execute.call_args.args[1] == {"name": "Synthetic database"}
    connection.execute.return_value = []
    assert backup.database_backup_info(engine) == {"lastBackupDate": None, "lastBackupPath": None,
                                                   "elapsedLastBackupMillis": None, "available": True}
    connection.execute.side_effect = RuntimeError("No permission")
    assert backup.database_backup_info(engine)["available"] is False


def write_backup(folder, name, *, age=0, content=b"SQL backup"):
    target = folder / name
    target.write_bytes(content)
    stamp = NOW.timestamp() - age * 86400
    os.utime(target, (stamp, stamp))
    return target


def test_retention_deletes_only_own_expired_regular_files_after_shared_mount_proof(tmp_path):
    proof = write_backup(tmp_path, filename())
    old = write_backup(tmp_path, filename(stamp="20261001T120000000000Z"), age=20)
    fresh = write_backup(tmp_path, filename(stamp="20261020T120000000000Z"), age=1)
    boundary = write_backup(tmp_path, filename(stamp="20261014T120000000000Z"), age=7)
    foreign = write_backup(tmp_path, filename("Other database"), age=100)
    unrelated = write_backup(tmp_path, "historical.db.123456", age=100)
    directory = tmp_path / filename(stamp="20260101T120000000000Z")
    directory.mkdir()
    assert backup.cleanup_old_backups(tmp_path, "Synthetic database", 7,
        verified_backup_path="/sql/backup/" + proof.name, now=NOW) == 1
    assert not old.exists()
    assert all(target.exists() for target in [proof, fresh, boundary, foreign, unrelated, directory])


@pytest.mark.parametrize("age,content,proof_name,days", [
    (0, b"SQL", None, 7), (0, b"SQL", "unrelated.bak", 7),
    (1, b"SQL", "self", 7), (0, b"", "self", 7),
    (0, b"SQL", "self", 0), (0, b"SQL", "self", -1),
])
def test_retention_requires_enabled_policy_and_fresh_nonempty_matching_backup(tmp_path, age, content, proof_name, days):
    proof = write_backup(tmp_path, filename(), age=age, content=content)
    old = write_backup(tmp_path, filename(stamp="20260101T120000000000Z"), age=100)
    verified = proof.name if proof_name == "self" else proof_name
    assert backup.cleanup_old_backups(tmp_path, "Synthetic database", days,
                                     verified_backup_path=verified, now=NOW) == 0
    assert old.exists()


def test_retention_missing_mount_and_symlink_candidates_are_preserved(tmp_path, monkeypatch):
    proof = write_backup(tmp_path, filename())
    link = write_backup(tmp_path, filename(stamp="20260101T120000000000Z"), age=100)
    original_lstat = Path.lstat
    symlink_names = {link.name}
    def lstat(path, *args, **kwargs):
        info = original_lstat(path, *args, **kwargs)
        if path.name in symlink_names:
            return SimpleNamespace(st_mode=stat.S_IFLNK, st_mtime=info.st_mtime, st_size=info.st_size)
        return info
    monkeypatch.setattr(Path, "lstat", lstat)
    assert backup.cleanup_old_backups(tmp_path, "Synthetic database", 7,
                                     verified_backup_path=proof.name, now=NOW) == 0
    assert link.exists()
    assert backup.cleanup_old_backups(tmp_path / "missing", "Synthetic database", 7,
                                     verified_backup_path=proof.name, now=NOW) == 0
    symlink_names.add(proof.name)
    assert backup.cleanup_old_backups(tmp_path, "Synthetic database", 7,
                                     verified_backup_path=proof.name, now=NOW) == 0


def test_restore_requires_explicit_master_before_any_sql():
    engine = SimpleNamespace(dialect=SimpleNamespace(name="mssql"), url=SimpleNamespace(database="ExistingApplication"))
    with pytest.raises(ValueError, match="explicitly target master"):
        with backup.disposable_backup_restore(engine, "backup.bak"):
            pass


@pytest.mark.parametrize("exists_before", [False, True])
def test_generated_backup_removal_uses_bound_exact_path_and_server_absence_proof(monkeypatch, exists_before):
    source = "cemaris_test_02_" + "a" * 32
    path = "/sql/backup/" + filename(source)
    connection = Mock()
    connection.scalar.side_effect = ["master", "/sql/backup", None]
    connection.execute.return_value.mappings.return_value.one.side_effect = [
        {"file_exists": exists_before, "file_is_a_directory": False},
        {"file_exists": False, "file_is_a_directory": False},
    ]
    engine = SimpleNamespace(dialect=SimpleNamespace(name="mssql"), url=SimpleNamespace(database="master"))
    execute = Mock()
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    assert backup.remove_disposable_backup(engine, path, source, backup_directory="/sql/backup") == {
        "backupPath": path, "sourceDatabase": source, "fileExisted": exists_before, "fileExistsAfter": False}
    if exists_before:
        execute.assert_called_once_with(connection, "EXEC master.sys.xp_delete_files ?", (path,))
    else:
        execute.assert_not_called()
    assert connection.execute.call_count == 2
    assert all(call.args[1] == {"path": path} for call in connection.execute.call_args_list)
    assert "sys.dm_os_file_exists(:path)" in str(connection.execute.call_args.args[0])


@pytest.mark.parametrize("case", ["application", "wrong_database", "wildcard", "foreign_folder",
                                  "nonmaster_url", "nonmaster_connection", "wrong_server_default",
                                  "source_still_exists", "directory", "delete_not_confirmed"])
def test_generated_backup_removal_refuses_unsafe_or_unconfirmed_targets(monkeypatch, case):
    source = "cemaris_test_02_" + "b" * 32
    path = "/sql/backup/" + filename(source)
    if case == "application":
        source = "ExistingApplication"
        path = "/sql/backup/" + filename(source)
    if case == "wrong_database":
        path = "/sql/backup/" + filename("cemaris_test_02_" + "c" * 32)
    if case == "wildcard":
        path = "/sql/backup/*"
    if case == "foreign_folder":
        path = "/other/folder/" + filename(source)
    engine = SimpleNamespace(dialect=SimpleNamespace(name="mssql"), url=SimpleNamespace(
        database="other" if case == "nonmaster_url" else "master"))
    connection = Mock()
    connection.scalar.side_effect = ["other" if case == "nonmaster_connection" else "master",
        "/different/default" if case == "wrong_server_default" else "/sql/backup",
        42 if case == "source_still_exists" else None]
    connection.execute.return_value.mappings.return_value.one.side_effect = [
        {"file_exists": True, "file_is_a_directory": case == "directory"},
        {"file_exists": case == "delete_not_confirmed", "file_is_a_directory": False},
    ]
    execute = Mock()
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    with pytest.raises((ValueError, RuntimeError)):
        backup.remove_disposable_backup(engine, path, source, backup_directory="/sql/backup")
    if case != "delete_not_confirmed":
        execute.assert_not_called()


@pytest.mark.parametrize("fail_restore", [False, True])
def test_restore_moves_every_file_to_generated_target_and_cleans_only_that_database(monkeypatch, fail_restore):
    connection = Mock()
    def scalar(statement, params=None):
        sql = str(statement)
        if "DB_NAME()" in sql:
            return "master"
        if "DB_ID" in sql:
            return None if not execute.called else 42
        if "DATABASEPROPERTYEX" in sql:
            return "RESTORING" if fail_restore else "ONLINE"
        return r"C:\SQL\DATA"
    connection.scalar.side_effect = scalar
    connection.exec_driver_sql.return_value.mappings.return_value.all.return_value = [
        {"LogicalName": "Synthetic' Data", "Type": "D"},
        {"LogicalName": "Synthetic Log", "Type": "L"},
    ]
    admin = SimpleNamespace(dialect=SimpleNamespace(name="mssql"),
                            url=make_url("mssql+pyodbc://@localhost/master?driver=test"))
    restored = Mock()
    factory = Mock(return_value=restored)
    execute = Mock(side_effect=RuntimeError("Restore failed") if fail_restore else None)
    monkeypatch.setattr(backup, "_autocommit_connection", lambda engine: nullcontext(connection))
    monkeypatch.setattr(backup, "_execute_backup_command", execute)
    monkeypatch.setattr(backup, "create_engine", factory)
    def run():
        with backup.disposable_backup_restore(admin, "/sql/new.bak") as (engine, name):
            assert engine is restored and backup._TEST_DATABASE.fullmatch(name)
            assert factory.call_args.args[0].database == name
    if fail_restore:
        with pytest.raises(RuntimeError, match="Restore failed"):
            run()
        factory.assert_not_called()
    else:
        run()
        restored.dispose.assert_called_once()
    command = execute.call_args.args[1]
    parameters = execute.call_args.args[2]
    assert command.startswith("RESTORE DATABASE [cemaris_test_02_")
    assert "REPLACE" not in command
    assert command.endswith("MOVE ? TO ?, MOVE ? TO ?, CHECKSUM, RECOVERY")
    assert parameters[0] == "/sql/new.bak" and parameters[1] == "Synthetic' Data"
    assert parameters[2].startswith(r"C:\SQL\DATA\cemaris_test_02_") and parameters[2].endswith("_0.mdf")
    assert parameters[3] == "Synthetic Log" and parameters[4].endswith("_1.ldf")
    generated = command.split("[", 1)[1].split("]", 1)[0]
    cleanup = [call.args[0] for call in connection.exec_driver_sql.call_args_list
               if call.args[0].startswith(("ALTER DATABASE", "DROP DATABASE"))]
    expected = [] if fail_restore else [f"ALTER DATABASE [{generated}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE"]
    assert cleanup == expected + [f"DROP DATABASE [{generated}]"]


def test_live_native_backup_verify_restore_round_trip_on_fresh_databases(disposable_sql_database):
    """Neither source DB nor restored DB has any pre-existing application data."""
    admin_url = make_url(os.environ["CEMARIS_SQL_TEST_ADMIN_URL"])
    admin = create_engine(admin_url, isolation_level="AUTOCOMMIT", poolclass=NullPool,
                          hide_parameters=True, connect_args={"timeout": 10})
    backup_path = None
    backup_directory = None
    try:
        with disposable_sql_database() as (engine, source_name):
            with engine.begin() as connection:
                command.upgrade(migration_config(connection), "head")
                fixture = load_synthetic_fixtures(connection, expected_database=source_name)
                comments = TABLES["ContractComments"]
                connection.execute(comments.update().where(
                    comments.c.contractCommentId == fixture.ids["contract_comment"]).values(
                    comment="Synthetischer Nachweis ä😀 – 451ce034"))
            def snapshot(connection):
                result = {}
                for name, table in TABLES.items():
                    serialized = sorted(json.dumps(list(row), ensure_ascii=False, separators=(",", ":"))
                                        for row in connection.execute(select(table)))
                    result[name] = {"count": len(serialized), "sha256": hashlib.sha256(
                        "\n".join(serialized).encode("utf-8")).hexdigest()}
                return result
            with engine.connect() as connection:
                backup_directory = connection.scalar(text(
                    "SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))"))
                original = snapshot(connection)
                assert len(original) == 41
                assert {key: value["count"] for key, value in original.items()} == fixture.row_counts
                version = connection.scalar(text("SELECT version_num FROM alembic_version"))
            backup_path = backup.backup_database(engine, None)
            assert isinstance(backup_path, str), "Native SQL Server backup/checksum verification must succeed"
            history = backup.database_backup_info(engine)
            assert history["available"] and history["lastBackupPath"] == backup_path
            assert history["lastBackupDate"]
            assert 0 <= history["elapsedLastBackupMillis"] < 5 * 60_000
            with engine.begin() as connection:
                connection.execute(comments.update().where(
                    comments.c.contractCommentId == fixture.ids["contract_comment"]).values(
                    comment="Nach Sicherung geänderter Quellbestand"))
            with backup.disposable_backup_restore(admin, backup_path) as (restored, restored_name):
                assert restored_name != source_name
                with restored.connect() as connection:
                    assert connection.scalar(text("SELECT DB_NAME()")) == restored_name
                    assert snapshot(connection) == original
                    assert connection.scalar(text("SELECT version_num FROM alembic_version")) == version
                    inspector = inspect(connection)
                    assert set(inspector.get_table_names(schema="dbo")) == set(TABLES) | {"alembic_version"}
                    assert sum(len(inspector.get_foreign_keys(name, schema="dbo")) for name in TABLES) == 42
                    assert connection.scalar(select(comments.c.comment).where(
                        comments.c.contractCommentId == fixture.ids["contract_comment"])) == "Synthetischer Nachweis ä😀 – 451ce034"
                    backup._execute_backup_command(connection, "DBCC CHECKDB WITH NO_INFOMSGS, ALL_ERRORMSGS")
                with engine.connect() as connection:
                    assert snapshot(connection)["ContractComments"] != original["ContractComments"]
                    assert connection.scalar(select(comments.c.comment).where(
                        comments.c.contractCommentId == fixture.ids["contract_comment"])) == "Nach Sicherung geänderter Quellbestand"
            with admin.connect() as connection:
                assert connection.scalar(text("SELECT DB_ID(:name)"), {"name": restored_name}) is None
    finally:
        try:
            if isinstance(backup_path, str):
                result = backup.remove_disposable_backup(admin, backup_path, source_name,
                                                         backup_directory=backup_directory)
                assert result["fileExistsAfter"] is False
        finally:
            admin.dispose()
