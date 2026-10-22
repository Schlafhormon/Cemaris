"""Real SQL Server evidence for admin filters, preservation and cleanup ages."""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.attachments import AttachmentOptions
from cemaris.config import Settings
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.operations import DAY, BackupTask, OperationsOptions, cleanup_database, get_audit_log, purge_audit_log
from cemaris.preferences import PreferenceOptions

NOW = 1_800_000_000_000


@pytest.fixture
def populated(sql_connection):
    connection, name = sql_connection
    fixture = load_synthetic_fixtures(connection, expected_database=name)
    return connection, fixture.ids


def test_cleanup_active_graph_is_preserved(populated, tmp_path):
    connection, _ = populated
    before = {name: connection.scalar(sa.select(sa.func.count()).select_from(table)) for name, table in TABLES.items()}
    result = cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=1_792_411_200_002)
    assert result == {"inactivatedRecordCount": 0, "purgedRecordCount": 0}
    assert before == {name: connection.scalar(sa.select(sa.func.count()).select_from(table)) for name, table in TABLES.items()}


def test_cleanup_deleted_graph_and_unhandled_tables(populated, tmp_path):
    connection, ids = populated
    for table in TABLES.values():
        if "recordDelete_timeMillis" in table.c:
            connection.execute(table.update().values(recordDelete_timeMillis=NOW-61*DAY, recordDelete_username="synthetic"))
    result = cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW)
    assert result["purgedRecordCount"] > 15
    assert result["inactivatedRecordCount"] == 0
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["WorkOrders"])) == 0
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["ContractInterments"])) == 1
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["ContractServiceTypes"])) == 1
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["ContractAttachments"])) == 1  # missing file retained
    for name in ("WorkOrderStatuses", "Users", "FuneralHomes", "CommittalTypes", "ServiceTypes", "IntermentDepths", "IntermentContainerTypes", "OrderForms", "AuditLog"):
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES[name])) > 0


@pytest.mark.parametrize("table,key", [("ContractComments", "contract_comment"), ("WorkOrderComments", "work_order_comment"), ("BurialSiteComments", "burial_site_comment")])
@pytest.mark.parametrize("delta,purged", [(-1, True), (0, True), (1, False)])
def test_cleanup_inclusive_age_boundary(populated, tmp_path, table, key, delta, purged):
    connection, ids = populated
    target = TABLES[table]
    pk = list(target.primary_key)[0]
    connection.execute(target.update().where(pk == ids[key]).values(recordDelete_username="synthetic", recordDelete_timeMillis=NOW-60*DAY+delta))
    cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW)
    assert (connection.scalar(sa.select(pk).where(pk == ids[key])) is None) is purged


def test_newly_inactivated_children_wait_and_financial_data_survives(populated, tmp_path):
    connection, ids = populated
    contracts = TABLES["Contracts"]
    connection.execute(contracts.update().values(recordDelete_username="old", recordDelete_timeMillis=NOW-90*DAY))
    result = cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW)
    assert result["inactivatedRecordCount"] == 4  # attachment, metadata, comment, field
    comment = connection.execute(TABLES["ContractComments"].select().where(TABLES["ContractComments"].c.contractCommentId == ids["contract_comment"])).mappings().one()
    assert comment["recordDelete_timeMillis"] == NOW and comment["recordDelete_username"] == "synthetic"
    for name in ("ContractFees", "ContractTransactions", "ContractInterments", "ContractServiceTypes"):
        assert connection.scalar(sa.select(TABLES[name].c.recordDelete_timeMillis)) is None


def test_deleted_cemetery_inactivates_sites_after_their_children(populated, tmp_path):
    connection, ids = populated
    connection.execute(TABLES["Cemeteries"].update().values(recordDelete_username="old", recordDelete_timeMillis=NOW-90*DAY))
    result = cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW)
    assert result["inactivatedRecordCount"] == 1
    assert connection.scalar(sa.select(TABLES["BurialSiteComments"].c.recordDelete_timeMillis)) is None
    result = cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW+1)
    assert result["inactivatedRecordCount"] == 2


@pytest.mark.parametrize("file_state,expected", [("exists", 1), ("missing", 0), ("outside", 0), ("directory", 0)])
def test_attachment_purge_requires_deletable_contained_file(populated, tmp_path, file_state, expected):
    connection, ids = populated
    root = tmp_path / "attachments"
    root.mkdir()
    folder = root if file_state != "outside" else tmp_path
    file = folder / "synthetic.txt"
    if file_state == "directory":
        file.mkdir()
    elif file_state != "missing":
        file.write_bytes(b"synthetic attachment")
    table = TABLES["ContractAttachments"]
    connection.execute(table.update().values(filePath=str(folder), fileName=file.name, recordDelete_username="old", recordDelete_timeMillis=NOW-60*DAY))
    result = cleanup_database(connection, "synthetic", attachments_path=root, now_millis=NOW)
    assert result["purgedRecordCount"] == 1 + expected  # old deleted fixture comment
    assert connection.scalar(sa.select(sa.func.count()).select_from(table)) == 1-expected
    if file_state == "outside":
        assert file.read_bytes() == b"synthetic attachment"


def test_extra_fk_guards_preserve_missing_source_relationships(populated, tmp_path):
    connection, ids = populated
    # Retain source parents referenced solely through the omitted relationships.
    connection.execute(TABLES["ContractInterments"].delete())
    for name in ("ContractAttachments", "ContractComments", "ContractFees", "ContractFields", "ContractMetadata", "ContractTransactions", "RelatedContracts", "WorkOrderContracts"):
        connection.execute(TABLES[name].delete())
    connection.execute(TABLES["Contracts"].update().values(recordDelete_username="old", recordDelete_timeMillis=NOW-61*DAY))
    connection.execute(TABLES["BurialSiteTypes"].update().values(recordDelete_username="old", recordDelete_timeMillis=NOW-61*DAY))
    connection.execute(TABLES["Cemeteries"].update().where(TABLES["Cemeteries"].c.cemeteryId == ids["cemetery"]).values(recordDelete_username="old", recordDelete_timeMillis=NOW-61*DAY))
    cleanup_database(connection, "synthetic", attachments_path=tmp_path, now_millis=NOW)
    assert connection.scalar(sa.select(TABLES["Contracts"].c.contractId).where(TABLES["Contracts"].c.contractId == ids["contract"])) == ids["contract"]
    assert connection.scalar(sa.select(TABLES["BurialSiteTypes"].c.burialSiteTypeId)) == ids["burial_site_type"]
    assert connection.scalar(sa.select(TABLES["Cemeteries"].c.cemeteryId).where(TABLES["Cemeteries"].c.cemeteryId == ids["cemetery"])) == ids["cemetery"]


@pytest.mark.parametrize("age,days", [("all", None), ("thirtyDays", 30), ("ninetyDays", 90), ("oneYear", 365)])
def test_purge_strict_millisecond_boundary(sql_connection, age, days):
    connection, _ = sql_connection
    cutoff = NOW+1 if days is None else NOW-days*DAY
    for millis in (cutoff-1, cutoff, cutoff+1):
        connection.execute(TABLES["AuditLog"].insert().values(logMillis=millis, logDate=20261021, logTime=1234, mainRecordType="user", mainRecordId="synthetic", updateTable="Users", updateField="username", updateType="updated", updateUsername="synthetic"))
    assert purge_audit_log(connection, age, now_millis=NOW) == 1
    assert list(connection.scalars(sa.select(TABLES["AuditLog"].c.logMillis).order_by(TABLES["AuditLog"].c.logMillis))) == [cutoff, cutoff+1]


@pytest.mark.parametrize("pattern,expected", [(" SYNTHETIC ", 2), ("%", 3), ("_", 3), ("[", 1), ("🪦", 1), ("ä", 0), ("", 3)])
def test_audit_filters_sqlite_like_and_pagination(sql_connection, pattern, expected):
    connection, _ = sql_connection
    for index, username in enumerate(("Synthetic[ 🪦", "synthetic", "Ä")):
        connection.execute(TABLES["AuditLog"].insert().values(logMillis=NOW+index, logDate=20261021, logTime=1234, mainRecordType="user", mainRecordId="1", updateTable="Users", updateField="username", updateType="updated", updateUsername=username))
    result = get_audit_log(connection, {"updateUsername": pattern, "logDateFrom": "2026-10-21", "logDateTo": "2026-10-21", "mainRecordType": "user"}, limit=1, offset=0)
    assert result["count"] == expected
    assert len(result["auditLogEntries"]) == min(expected, 1)
    assert get_audit_log(connection, {"logDateFrom": "2026-10-22"})["count"] == 0
    assert get_audit_log(connection, {"mainRecordId": "2"})["count"] == 0


def test_backup_task_catchup_and_six_hour_floor(monkeypatch):
    app = SimpleNamespace(state=SimpleNamespace(operations_options=OperationsOptions(_env_file=None)))
    now = datetime(2026, 10, 21, 2, tzinfo=timezone.utc)
    task = BackupTask(app, clock=lambda: now)
    calls = []
    monkeypatch.setattr(task, "backup", lambda **kw: calls.append(kw) or "synthetic.bak")
    assert task.run_once(now=now, startup=True) == "synthetic.bak"
    assert task.run_once(now=now, startup=True) is False
    assert task.run_once(now=now+timedelta(hours=5)) is False
    assert task.run_once(now=now+timedelta(days=1)) == "synthetic.bak"
    task.last_run_millis = int((now-timedelta(days=1)).timestamp()*1000)
    assert task.run_once(now=now, startup=True) is False  # strictly >24h
    assert len(calls) == 2


@pytest.mark.parametrize("value,expected", [(True, True), (False, False), ("true", True), ("TRUE", False), ("1", False), ("false", False)])
def test_disable_audit_logging_keeps_views_enabled(value, expected):
    options = PreferenceOptions(_env_file=None, audit_log_enabled=True, disable_audit_log=value)
    assert options.audit_log_enabled is True
    assert options.audit_writes_enabled is not expected


def test_backup_task_schedule_and_completion_time(monkeypatch):
    now = datetime(2026, 10, 21, 2, tzinfo=timezone.utc)
    finished = now + timedelta(minutes=5)
    app = SimpleNamespace(state=SimpleNamespace(operations_options=OperationsOptions(_env_file=None)))
    task = BackupTask(app, clock=lambda: finished)
    def failure(**kwargs):
        raise RuntimeError("Synthetic failure")
    monkeypatch.setattr(task, "backup", failure)
    with pytest.raises(RuntimeError):
        task.run_once(now=now, startup=True)
    assert task.last_run_millis == int(finished.timestamp()*1000)
    assert task.seconds_until_next_backup(now) == 86400
    assert task.seconds_until_next_backup(now-timedelta(seconds=1)) == 1
    assert task.run_once(now=finished+timedelta(hours=5)) is False


def test_backup_stop_interrupts_wait_and_preserves_inflight_worker():
    from threading import Event, Thread
    release = Event()
    task = BackupTask(SimpleNamespace())
    task.thread = Thread(target=release.wait, daemon=True)
    task.thread.start()
    try:
        assert task.stop(timeout=0.01) is False
        assert task.event.is_set()
        release.set()
        task.wait()
        assert task.stop() is True
    finally:
        release.set()


def test_scheduled_backup_does_not_begin_after_stop():
    task = BackupTask(SimpleNamespace())
    task.event.set()
    assert task.backup(scheduled=True) is False


def test_busy_backup_returns_without_queueing():
    task = BackupTask(SimpleNamespace())
    task.lock.acquire()
    try:
        assert task.backup() is False
    finally:
        task.lock.release()


@pytest.fixture
def operation_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\admin": "synthetic", "\\reader": "synthetic"}}, session_directory=tmp_path/"sessions", can_login=["admin", "reader"], is_admin=["admin"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True), attachment_options=AttachmentOptions(_env_file=None, attachments_path=tmp_path/"attachments"), operations_options=OperationsOptions(_env_file=None))
    app.state.db_engine = engine
    return app


def _login(client, name="admin"):
    csrf = client.get("/api/session").json()["csrfToken"]
    result = client.post("/api/login", json={"username": name, "password": "synthetic"}, headers={"X-CSRF-Token": csrf})
    assert result.status_code == 200
    return {"X-CSRF-Token": result.json()["csrfToken"]}


@pytest.mark.parametrize("path", ["doGetAuditLog", "doPurgeAuditLog", "doBackupDatabase", "doCleanupDatabase"])
def test_admin_role_and_csrf(operation_app, path):
    with TestClient(operation_app) as client:
        csrf = client.get("/api/session").json()["csrfToken"]
        assert client.post("/api/admin/"+path, json={}, headers={"X-CSRF-Token": csrf}).status_code == 401
        headers = _login(client, "reader")
        assert client.post("/api/admin/"+path, json={}, headers=headers).status_code == 403
        headers = _login(client)
        assert client.post("/api/admin/"+path, json={}).status_code == 403


def test_admin_http_filters_validation_gating_and_backup_failure(operation_app, monkeypatch):
    monkeypatch.setattr(operation_app.state.backup_task, "backup", lambda: False)
    with TestClient(operation_app) as client:
        headers = _login(client)
        assert client.get("/api/admin/database").json()["recordDeleteAgeDays"] == 60
        assert client.post("/api/admin/doBackupDatabase", json={}, headers=headers).json() == {"success": False, "errorMessage": "Unable to write backup file."}
        assert client.post("/api/admin/doGetAuditLog", json={}, headers=headers).status_code == 200
        assert client.post("/api/admin/doGetAuditLog", json={"limit": None, "updateUsername": None}, headers=headers).status_code == 200
        for form in ({"limit": "NaN"}, {"offset": []}, {"limit": 1.5}, {"logDateFrom": "bad"}):
            assert client.post("/api/admin/doGetAuditLog", json=form, headers=headers).status_code == 400
        for age in (None, "invalid", 30, [], {}):
            result = client.post("/api/admin/doPurgeAuditLog", json={"age": age}, headers=headers)
            assert result.status_code == 400 and result.json()["success"] is False
        operation_app.state.preference_options.audit_log_enabled = False
        assert client.get("/api/admin/auditLog").status_code == 404
        for path in ("doGetAuditLog", "doPurgeAuditLog"):
            assert client.post("/api/admin/"+path, json={}, headers=headers).status_code == 404


def test_disable_flag_suppresses_real_writer_but_keeps_audit_reader(operation_app):
    operation_app.state.preference_options.disable_audit_log = True
    with TestClient(operation_app) as client:
        headers = _login(client)
        with operation_app.state.db_engine.connect() as connection:
            before = connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"]))
        result = client.post("/api/admin/users/add", json={"username": "synthetic-disabled-audit"}, headers=headers)
        assert result.status_code == 200 and result.json()["success"] is True
        assert client.get("/api/admin/auditLog").status_code == 200
        with operation_app.state.db_engine.connect() as connection:
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == before
            assert connection.scalar(sa.select(TABLES["Users"].c.username).where(TABLES["Users"].c.username == "synthetic-disabled-audit")) == "synthetic-disabled-audit"
