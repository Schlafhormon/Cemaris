"""Per-record audit dialogs required by the cemetery and burial site pages.

Derived from Sunrise handlers/commonPost/doGetRecordAuditLog.ts and
database/getAuditLog.ts (MIT). Administration-wide auditing is in operations.py.
"""

import math

from fastapi import APIRouter, Body, Depends, HTTPException, Request
import sqlalchemy as sa

from cemaris.auth import require_update_cemeteries
from cemaris.db.schema import TABLES
from cemaris.db.semantics import js_number
from cemaris.burial_sites import _date_string, _time_string, _time_period_string
from cemaris.dependencies import get_engine
from cemaris.paths import route_path


def get_place_audit_log(connection, record_type, record_id="", *, limit=50, offset=0):
    table = TABLES["AuditLog"]
    predicates = [table.c.mainRecordType == record_type]
    if record_id is not None and str(record_id).strip():
        predicates.append(table.c.mainRecordId == str(record_id).strip())
    count = connection.scalar(sa.select(sa.func.count()).select_from(table).where(*predicates))
    if limit == 0:
        return {"auditLogEntries": [], "count": count}
    query = sa.select(table).where(*predicates).order_by(table.c.logMillis.desc())
    # SQLite interprets any negative LIMIT as unlimited and negative OFFSET as 0.
    if limit >= 0:
        query = query.limit(limit)
    query = query.offset(max(0, offset))
    rows = [dict(row) for row in connection.execute(query).mappings()]
    for row in rows:
        row.update(logDateString=_date_string(row["logDate"]),
                   logTimeString=_time_string(row["logTime"]),
                   logTimePeriodString=_time_period_string(row["logTime"]))
    return {"auditLogEntries": rows, "count": count}


def install_place_audit(app):
    router = APIRouter(prefix="/api", tags=["place audit"])

    @router.post("/cemeteries/doGetRecordAuditLog")
    @router.post("/burialSites/doGetRecordAuditLog")
    def record_audit(request: Request, form: dict = Body(...), user=Depends(require_update_cemeteries)):
        if not request.app.state.preference_options.audit_log_enabled:
            raise HTTPException(404, "Audit logging is disabled")
        expected = "cemetery" if route_path(request).startswith("/api/cemeteries/") else "burialSite"
        if form.get("mainRecordType") != expected:
            raise HTTPException(403, "Forbidden")
        try:
            limit = js_number(form.get("limit", 50))
            offset = js_number(form.get("offset", 0))
            if not math.isfinite(limit) or not math.isfinite(offset):
                raise ValueError
            limit, offset = math.trunc(limit), math.trunc(offset)
            if max(abs(limit), abs(offset)) > 2**63 - 1:
                raise ValueError
        except (ValueError, TypeError, OverflowError):
            raise HTTPException(400, "Invalid audit pagination") from None
        with get_engine(request).connect() as connection:
            return {"success": True, **get_place_audit_log(connection, expected, form.get("mainRecordId", ""), limit=limit, offset=offset), "offset": offset}

    app.include_router(router)
