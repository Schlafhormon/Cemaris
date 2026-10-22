"""Dashboard and recent record changes, ported from Sunrise CMS (MIT).

Sources: database/getRecordUpdateLog.ts, handlers/dashboard{Get,Post},
views/dashboard and app/app.ts at the frozen reference commit. This is a
30-day record summary, distinct from the historical audit log in step 15.
See licenses/Sunrise-LICENSE.md.
"""

from decimal import Decimal, ROUND_HALF_UP, localcontext
import math

from fastapi import APIRouter, Body, Depends, HTTPException, Request
import sqlalchemy as sa

from cemaris.auth import current_user
from cemaris.catalogs import CATALOGS
from cemaris.db.schema import TABLES
from cemaris.db.semantics import js_number
from cemaris.dependencies import get_engine
from cemaris.preferences import now_millis


RECORD_TYPES = ("", "contract", "contractTransactions", "workOrder", "workOrderMilestone",
                "burialSite", "contractFee", "comments", "contractComment", "workOrderComment", "burialSiteComment")
DEFAULT_RECORD_LIMIT = 100
MAX_RECORD_LIMIT = 10_000
MAX_AGE_MILLIS = 30 * 24 * 60 * 60 * 1000


def _money(value):
    # SQLite PRINTF uses the actual binary64 value, rounds half away from zero,
    # and emits at most 16 significant digits without the alternate-form-2 flag.
    with localcontext() as context:
        context.prec = 340
        number = Decimal.from_float(float(value or 0)).quantize(Decimal(".01"), rounding=ROUND_HALF_UP)
        if number and number.adjusted() > 13:
            number = number.quantize(Decimal(1).scaleb(number.adjusted() - 15), rounding=ROUND_HALF_UP)
    return format(number.copy_abs() if number == 0 else number, ".2f")


def _query(record_type, minimum):
    """Use SQL UNION/pagination; format money and Unicode comments after selection."""
    branches = []

    def add(kind, table_name, identifier, display, description, joined=None, extra=(), amount=None):
        table = TABLES[table_name]
        fields = [sa.literal(kind).label("recordType"),
            sa.case((table.c.recordCreate_timeMillis == table.c.recordUpdate_timeMillis, "create"), else_="update").label("updateType"),
            sa.cast(display, sa.Unicode(None)).label("displayRecordId"), identifier.label("recordId"),
            sa.cast(description, sa.Unicode(None)).label("recordDescription"),
            table.c.recordUpdate_timeMillis, table.c.recordUpdate_username,
            table.c.recordCreate_timeMillis, table.c.recordCreate_username,
            (sa.cast(sa.null(), sa.Float()) if amount is None else amount).label("_amount")]
        branches.append(sa.select(*fields).select_from(joined if joined is not None else table).where(
            table.c.recordDelete_timeMillis.is_(None), table.c.recordUpdate_timeMillis >= minimum, *extra))

    contracts, contract_types = TABLES["Contracts"], TABLES["ContractTypes"]
    work_orders, work_types = TABLES["WorkOrders"], TABLES["WorkOrderTypes"]
    burial_sites, site_types, statuses = TABLES["BurialSites"], TABLES["BurialSiteTypes"], TABLES["BurialSiteStatuses"]
    if record_type in ("", "contract"):
        add("contract", "Contracts", contracts.c.contractId, contracts.c.contractNumber,
            sa.func.coalesce(contract_types.c.contractType, "Contract"),
            contracts.outerjoin(contract_types, contracts.c.contractTypeId == contract_types.c.contractTypeId))
    if record_type in ("", "contract", "contractTransactions"):
        table = TABLES["ContractTransactions"]
        add("contractTransactions", "ContractTransactions", table.c.contractId, contracts.c.contractNumber,
            table.c.transactionNote, table.outerjoin(contracts, table.c.contractId == contracts.c.contractId), amount=table.c.transactionAmount)
    if record_type in ("", "workOrder"):
        description = sa.case((sa.func.datalength(work_orders.c.workOrderDescription) > 0, work_orders.c.workOrderDescription),
            else_=sa.func.coalesce(work_types.c.workOrderType, "Work Order"))
        add("workOrder", "WorkOrders", work_orders.c.workOrderId, work_orders.c.workOrderNumber, description,
            work_orders.outerjoin(work_types, work_orders.c.workOrderTypeId == work_types.c.workOrderTypeId))
    if record_type in ("", "workOrder", "workOrderMilestone"):
        table, types = TABLES["WorkOrderMilestones"], TABLES["WorkOrderMilestoneTypes"]
        description = sa.case((types.c.workOrderMilestoneType.is_(None), ""), else_=types.c.workOrderMilestoneType + " - ") + table.c.workOrderMilestoneDescription
        joined = table.outerjoin(types, table.c.workOrderMilestoneTypeId == types.c.workOrderMilestoneTypeId).outerjoin(work_orders, table.c.workOrderId == work_orders.c.workOrderId)
        add("workOrderMilestone", "WorkOrderMilestones", table.c.workOrderId, work_orders.c.workOrderNumber, description, joined,
            extra=[work_orders.c.recordDelete_timeMillis.is_(None)])
    if record_type in ("", "burialSite"):
        description = sa.func.coalesce(site_types.c.burialSiteType, "Burial Site") + sa.case((statuses.c.burialSiteStatus.is_not(None), " (" + statuses.c.burialSiteStatus + ")"), else_="")
        joined = burial_sites.outerjoin(site_types, burial_sites.c.burialSiteTypeId == site_types.c.burialSiteTypeId).outerjoin(statuses, burial_sites.c.burialSiteStatusId == statuses.c.burialSiteStatusId)
        add("burialSite", "BurialSites", burial_sites.c.burialSiteId, burial_sites.c.burialSiteName, description, joined)
    if record_type in ("", "contract", "contractFee"):
        table, fees = TABLES["ContractFees"], TABLES["Fees"]
        joined = table.outerjoin(fees, table.c.feeId == fees.c.feeId).outerjoin(contracts, table.c.contractId == contracts.c.contractId)
        add("contractFee", "ContractFees", table.c.contractId, contracts.c.contractNumber, sa.func.coalesce(fees.c.feeName, "Unknown Fee"), joined, amount=table.c.feeAmount)
    for kind, table_name, parent, parent_id, name in [
        ("contractComment", "ContractComments", contracts, "contractId", "contractNumber"),
        ("workOrderComment", "WorkOrderComments", work_orders, "workOrderId", "workOrderNumber"),
        ("burialSiteComment", "BurialSiteComments", burial_sites, "burialSiteId", "burialSiteName"),
    ]:
        if record_type not in ("", "comments", kind):
            continue
        table = TABLES[table_name]
        # Source deliberately does not check deleted contract parents, while
        # work-order/burial-site comments and milestones exclude deleted parents.
        extra = [] if kind == "contractComment" else [parent.c.recordDelete_timeMillis.is_(None)]
        add(kind, table_name, table.c[parent_id], parent.c[name], table.c.comment,
            table.outerjoin(parent, table.c[parent_id] == parent.c[parent_id]), extra=extra)
    return sa.union_all(*branches).subquery("recentRecords")


def _pagination(value, default, *, maximum=None):
    number = js_number(default if value is None else value)
    if maximum is not None:
        number = min(number, maximum)
    if not math.isfinite(number) or (isinstance(value, (int, float)) and not number.is_integer()):
        raise ValueError("Invalid update log pagination")
    number = math.trunc(number)
    if abs(number) > 2**63 - 1:
        raise ValueError("Invalid update log pagination")
    return number


def get_record_update_log(connection, record_type="", *, limit=DEFAULT_RECORD_LIMIT, offset=0,
                          sort_by="recordUpdate_timeMillis", sort_direction="desc", current_millis=None):
    if record_type not in RECORD_TYPES:
        # Source builds an empty UNION and fails: reject with a useful 400.
        raise ValueError("Unknown update log record type")
    limit, offset = _pagination(limit, DEFAULT_RECORD_LIMIT, maximum=MAX_RECORD_LIMIT), _pagination(offset, 0)
    if limit == 0:
        # SQL Server OFFSET/FETCH rejects FETCH 0, while SQLite LIMIT 0 is empty.
        return []
    sort_by = sort_by if sort_by in ("recordCreate_timeMillis", "recordUpdate_timeMillis") else "recordUpdate_timeMillis"
    sort_direction = sort_direction if sort_direction in ("asc", "desc") else "desc"
    records = _query(record_type, (now_millis() if current_millis is None else current_millis) - MAX_AGE_MILLIS)
    query = sa.select(records).order_by(getattr(records.c[sort_by], sort_direction)()).offset(max(0, offset))
    if limit >= 0:
        query = query.limit(limit)
    result = []
    for row in connection.execute(query).mappings():
        entry = dict(row)
        kind, description, amount = entry["recordType"], entry["recordDescription"], entry.pop("_amount")
        if kind == "contractTransactions":
            entry["recordDescription"] = description if description is not None and description != "" else "Transaction: $" + _money(amount)
        elif kind == "contractFee":
            entry["recordDescription"] = f"Contract Fee: {description} (${_money(amount)})"
        elif kind.endswith("Comment") and description is not None:
            prefix = {"contractComment": "Contract", "workOrderComment": "Work Order", "burialSiteComment": "Burial Site"}[kind]
            # SQLite SUBSTR/LENGTH count Unicode code points, including emoji.
            entry["recordDescription"] = f"{prefix} Comment: {description[:100]}" + ("..." if len(description) > 100 else "")
        result.append(entry)
    return result


def get_configuration_counts(connection):
    counts = {}
    for resource in ("burialSiteTypes", "contractTypes", "burialSiteStatuses", "committalTypes",
                     "intermentContainerTypes", "intermentDepths", "serviceTypes", "workOrderMilestoneTypes", "workOrderTypes"):
        table = TABLES[CATALOGS[resource][0]]
        counts[resource] = connection.scalar(sa.select(sa.func.count()).select_from(table).where(table.c.recordDelete_timeMillis.is_(None)))
    counts["configTables"] = min(counts[key] for key in counts if key not in ("burialSiteTypes", "contractTypes"))
    return counts


def install_dashboard(app):
    router = APIRouter(tags=["dashboard"])

    @router.get("/api/dashboard")
    def dashboard(request: Request, user=Depends(current_user)):
        counts = {}
        if user["userProperties"].get("isAdmin"):
            with get_engine(request).connect() as connection:
                counts = get_configuration_counts(connection)
        return {"configCounts": counts, "auditLogEnabled": request.app.state.preference_options.audit_log_enabled}

    @router.post("/api/dashboard/doGetRecordUpdateLog")
    @router.post("/dashboard/doGetRecordUpdateLog", include_in_schema=False)
    def updates(request: Request, form: dict = Body(...), user=Depends(current_user)):
        try:
            with get_engine(request).connect() as connection:
                return {"updateLog": get_record_update_log(connection, form.get("recordType") or "",
                    limit=form.get("limit"), offset=form.get("offset"), sort_by=form.get("sortBy"), sort_direction=form.get("sortDirection"))}
        except (TypeError, ValueError, OverflowError) as error:
            raise HTTPException(400, str(error)) from None

    app.include_router(router)
