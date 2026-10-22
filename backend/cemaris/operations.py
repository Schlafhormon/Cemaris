"""Admin operations and backup job, ported from Sunrise CMS (MIT).

Source: admin database/audit handlers, cleanupDatabase.ts and backup task at
451ce034863b16502484367044f3e9b65370111a. See licenses/Sunrise-LICENSE.md.
"""

from datetime import datetime, timedelta
import logging
import math
from pathlib import Path
from threading import Event, Lock, Thread
import time

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa

from cemaris.attachments import _inside
from cemaris.auth import require_admin
from cemaris.burial_sites import _time_period_string
from cemaris.cleanup_rules import CLEANUP_RULES
from cemaris.db.schema import TABLES
from cemaris.db.semantics import burial_site_name_predicates, js_number
from cemaris.dependencies import get_engine
from cemaris.preferences import transaction

DAY = 86_400_000
logger = logging.getLogger("cemaris.operations")


class OperationsOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    record_delete_age_days: int = Field(default=60, ge=0)
    backup_task_enabled: bool = False
    backup_hour: int = Field(default=2, ge=0, le=23)
    backup_delete_age_days: int = Field(default=0, ge=0)
    backup_directory: str | None = None  # SQL Server service filesystem
    backup_local_directory: Path | None = None  # optional mapping for retention


def _application_database(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    if not name or name.lower() in {"master", "model", "msdb", "tempdb"}:
        raise ValueError("An application database is required")
    return name


def _guarded_delete(table_name, sql):
    # Source cleanup omits several parent-reference checks. Keep parents instead
    # of aborting the SQL Server batch or deleting still-referenced records.
    head, condition = sql.split(" WHERE ", 1)
    guards = []
    for child in TABLES.values():
        for fk in child.foreign_key_constraints:
            if fk.referred_table.name != table_name:
                continue
            comparisons = " AND ".join(f"cleanup_ref.[{element.parent.name}] = [{table_name}].[{element.column.name}]" for element in fk.elements)
            guards.append(f"NOT EXISTS (SELECT 1 FROM [dbo].[{child.name}] AS cleanup_ref WHERE {comparisons})")
    return head + " WHERE (" + condition + ")" + "".join(" AND " + guard for guard in guards)


def cleanup_database(database, actor, *, record_delete_age_days=60, attachments_path, now_millis=None):
    now = time.time_ns() // 1_000_000 if now_millis is None else now_millis
    cutoff = now - record_delete_age_days * DAY
    counts = {"inactivatedRecordCount": 0, "purgedRecordCount": 0}
    with transaction(database) as connection:
        _application_database(connection)
        for kind, table, sql in CLEANUP_RULES:
            if kind == "attachments":
                for row in connection.exec_driver_sql(sql, (cutoff,)).mappings().all():
                    try:
                        path = _inside(attachments_path, Path(row["filePath"]) / row["fileName"])
                        # Missing/unreadable files retain the row, as in source.
                        if path == Path(attachments_path).resolve():
                            continue
                        path.unlink()
                    except (OSError, ValueError):
                        continue
                    result = connection.execute(TABLES[table].delete().where(TABLES[table].c.contractAttachmentId == row["contractAttachmentId"]))
                    counts["purgedRecordCount"] += result.rowcount
            elif table == "ContractAttachments" and kind == "purge":
                continue  # performed once per successfully deleted file above
            else:
                parameters = (actor, now) if kind == "inactivate" else (cutoff,) * sql.count("?")
                query = sql if kind == "inactivate" else _guarded_delete(table, sql)
                result = connection.exec_driver_sql(query, parameters)
                counts["inactivatedRecordCount" if kind == "inactivate" else "purgedRecordCount"] += result.rowcount
    return counts


def get_audit_log(connection, form, *, limit=50, offset=0):
    table = TABLES["AuditLog"]
    predicates = []
    for field, operator in (("logDateFrom", table.c.logDate.__ge__), ("logDateTo", table.c.logDate.__le__)):
        if form.get(field):
            number = js_number(str(form[field]).replace("-", ""))
            if not math.isfinite(number) or not number.is_integer():
                raise ValueError("Invalid audit date")
            predicates.append(operator(int(number)))
    for field in ("mainRecordType", "mainRecordId"):
        value = form.get(field)
        if value is not None and (str(value).strip() if field == "mainRecordId" else str(value)):
            predicates.append(table.c[field] == (str(form[field]).strip() if field == "mainRecordId" else str(form[field])))
    username = form.get("updateUsername", "")
    if not isinstance(username, str):
        raise ValueError("Invalid audit username")
    if username.strip():
        predicates.extend(burial_site_name_predicates(table.c.updateUsername, "%" + username.strip(), "startsWith"))
    count = connection.scalar(sa.select(sa.func.count()).select_from(table).where(*predicates))
    if limit == 0:
        return {"auditLogEntries": [], "count": count, "offset": offset}
    query = sa.select(table).where(*predicates).order_by(table.c.logMillis.desc()).offset(max(0, offset))
    if limit >= 0:
        query = query.limit(limit)
    return {"auditLogEntries": [dict(row) for row in connection.execute(query).mappings()], "count": count, "offset": offset}


def purge_audit_log(connection, age, *, now_millis=None):
    if not isinstance(age, str) or age not in {"all", "thirtyDays", "ninetyDays", "oneYear"}:
        raise ValueError("A valid purge age is required.")
    _application_database(connection)
    now = time.time_ns() // 1_000_000 if now_millis is None else now_millis
    days = {"thirtyDays": 30, "ninetyDays": 90, "oneYear": 365}.get(age)
    cutoff = now + 1 if days is None else now - days * DAY
    return connection.execute(TABLES["AuditLog"].delete().where(TABLES["AuditLog"].c.logMillis < cutoff)).rowcount


class BackupTask:
    """Single-worker daily local-time scheduler with source catch-up/6h floor."""

    def __init__(self, app, *, clock=None):
        self.app = app
        self.thread = None
        self.event = Event()
        self.lock = Lock()
        self.last_run_millis = None
        self.clock = clock or datetime.now

    def _engine(self):
        return get_engine(Request({"type": "http", "app": self.app}))

    def backup(self, *, scheduled=False):
        from cemaris.sql_backup import backup_database, cleanup_old_backups
        if not self.lock.acquire(blocking=False):
            return False
        try:
            if scheduled and self.event.is_set():
                return False
            engine = self._engine()
            options = self.app.state.operations_options
            path = backup_database(engine, options.backup_directory)
            if path and scheduled and options.backup_local_directory is not None:
                cleanup_old_backups(options.backup_local_directory, engine.url.database, options.backup_delete_age_days, verified_backup_path=path)
            return path
        finally:
            self.lock.release()

    def run_once(self, *, now=None, startup=False):
        now = now or self.clock()
        millis = int(now.timestamp() * 1000)
        elapsed = millis - (self.last_run_millis or 0)
        due = elapsed > DAY if startup else now.hour == self.app.state.operations_options.backup_hour and now.minute == 0 and elapsed >= 6 * 3_600_000
        if not due:
            return False
        try:
            return self.backup(scheduled=True)
        finally:
            # ScheduledTask records completion even if the attempted backup fails.
            self.last_run_millis = int(self.clock().timestamp() * 1000)

    def seconds_until_next_backup(self, now=None):
        now = now or self.clock()
        target = now.replace(hour=self.app.state.operations_options.backup_hour, minute=0, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        # Naive local timestamps use the host's DST rules, as JavaScript Date.
        return max(0, target.timestamp() - now.timestamp())

    def _run(self):
        from cemaris.sql_backup import database_backup_info
        try:
            info = database_backup_info(self._engine())
            if info.get("elapsedLastBackupMillis") is not None:
                self.last_run_millis = int(self.clock().timestamp() * 1000) - info["elapsedLastBackupMillis"]
        except Exception:
            logger.error("Database backup history lookup failed")
        if self.event.is_set():
            return
        try:
            self.run_once(startup=True)
        except Exception:
            logger.error("Database startup backup failed")
        while not self.event.wait(self.seconds_until_next_backup()):
            try:
                self.run_once()
            except Exception:
                logger.error("Scheduled database backup failed")

    def start(self):
        if not self.app.state.operations_options.backup_task_enabled or self.thread is not None:
            return
        self.event.clear()
        self.thread = Thread(target=self._run, name="cemaris-database-backup", daemon=True)
        self.thread.start()

    def stop(self, timeout=305):
        self.event.set()
        if self.thread is not None:
            self.thread.join(timeout)
        return self.thread is None or not self.thread.is_alive()

    def wait(self):
        if self.thread is not None:
            self.thread.join()


def install_operations(app, options=None):
    from cemaris.sql_backup import database_backup_info
    app.state.operations_options = options if options is not None else OperationsOptions()
    app.state.backup_task = BackupTask(app)
    app.state.cleanup_lock = Lock()
    router = APIRouter(prefix="/api/admin", tags=["administration"])

    @router.get("/database")
    def database_page(request: Request, user=Depends(require_admin)):
        info = database_backup_info(get_engine(request))
        date = datetime.fromisoformat(info["lastBackupDate"]) if info.get("lastBackupDate") else None
        options = app.state.operations_options
        return {"lastBackupDateString": date.strftime("%Y-%m-%d") if date else "", "lastBackupTimePeriodString": _time_period_string(date.hour * 100 + date.minute) if date else "",
                "backupTaskIsEnabled": options.backup_task_enabled, "backupHour": options.backup_hour,
                "recordDeleteAgeDays": options.record_delete_age_days, "auditLogEnabled": app.state.preference_options.audit_log_enabled}

    @router.post("/doBackupDatabase")
    def backup(request: Request, user=Depends(require_admin)):
        path = app.state.backup_task.backup()
        return {"success": True, "fileName": str(path).replace("\\", "/").split("/")[-1]} if path else {"success": False, "errorMessage": "Unable to write backup file."}

    @router.post("/doCleanupDatabase")
    def cleanup(request: Request, user=Depends(require_admin)):
        with app.state.cleanup_lock:
            return cleanup_database(get_engine(request), user["username"], record_delete_age_days=app.state.operations_options.record_delete_age_days, attachments_path=app.state.attachment_options.attachments_path)

    def enabled():
        if not app.state.preference_options.audit_log_enabled:
            raise HTTPException(404, "Audit logging is disabled")

    @router.get("/auditLog")
    def audit_page(user=Depends(require_admin)):
        enabled()
        return {"enabled": True}

    @router.post("/doGetAuditLog")
    def audit(request: Request, form: dict = Body(...), user=Depends(require_admin)):
        enabled()
        try:
            numbers = [js_number(default if form.get(name) is None else form[name]) for name, default in (("limit", 50), ("offset", 0))]
            if any(not math.isfinite(n) or abs(n) > 2**63 - 1 or (not isinstance(form.get(name, default), str) and not n.is_integer()) for n, (name, default) in zip(numbers, (("limit", 50), ("offset", 0)))):
                raise ValueError("Invalid audit pagination")
            with get_engine(request).connect() as connection:
                filters = {name: form[name] for name in ("logDateFrom", "logDateTo", "mainRecordType", "updateUsername") if form.get(name) is not None}
                return get_audit_log(connection, filters, limit=math.trunc(numbers[0]), offset=math.trunc(numbers[1]))
        except (ValueError, TypeError, OverflowError):
            raise HTTPException(400, "Invalid audit filters or pagination") from None

    @router.post("/doPurgeAuditLog")
    def purge(request: Request, form: dict = Body(...), user=Depends(require_admin)):
        enabled()
        if not isinstance(form.get("age"), str) or form["age"] not in {"all", "thirtyDays", "ninetyDays", "oneYear"}:
            from fastapi.responses import JSONResponse
            return JSONResponse({"success": False, "message": "A valid purge age is required."}, status_code=400)
        with get_engine(request).begin() as connection:
            return {"success": True, "purgedCount": purge_audit_log(connection, form["age"])}

    app.include_router(router)
