"""CSV reports ported from Sunrise CMS, fixed commit 451ce034 (MIT).

Sources: helpers/reports.helpers.ts, database/getReportData.ts and
handlers/reportsGet/*.ts. Copyright City of Sault Ste. Marie; see
licenses/Sunrise-LICENSE.md. Raw reports deliberately include soft deletions.
"""
from __future__ import annotations

from datetime import date
import math
from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic_settings import BaseSettings, SettingsConfigDict
from starlette.responses import JSONResponse, Response
import sqlalchemy as sa

from cemaris.burial_sites import _date_string_to_integer
from cemaris.db.schema import TABLES
from cemaris.db.semantics import _js_number_string, date_to_integer, js_number
from cemaris.preferences import now_millis, transaction


class ReportOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")


# Order follows the source Map, including its deliberately restricted table set.
SIMPLE_REPORTS = {
    "burialSiteComments-all": "BurialSiteComments", "burialSiteFields-all": "BurialSiteFields",
    "burialSites-all": "BurialSites", "burialSiteStatuses-all": "BurialSiteStatuses",
    "burialSiteTypeFields-all": "BurialSiteTypeFields", "burialSiteTypes-all": "BurialSiteTypes",
    "cemeteries-all": "Cemeteries", "cemeteries-formatted": "Cemeteries",
    "committalTypes-all": "CommittalTypes", "contractAttachments-all": "ContractAttachments",
    "contractComments-all": "ContractComments", "contractFees-all": "ContractFees",
    "contractFields-all": "ContractFields", "contractInterments-all": "ContractInterments",
    "contractMetadata-all": "ContractMetadata", "contracts-all": "Contracts",
    "contractServiceTypes-all": "ContractServiceTypes", "contractTransactions-all": "ContractTransactions",
    "contractTypeFields-all": "ContractTypeFields", "contractTypePrints-all": "ContractTypePrints",
    "contractTypes-all": "ContractTypes", "feeCategories-all": "FeeCategories", "fees-all": "Fees",
    "funeralHomes-all": "FuneralHomes", "funeralHomes-formatted": "FuneralHomes",
    "intermentContainerTypes-all": "IntermentContainerTypes", "intermentDepths-all": "IntermentDepths",
    "serviceTypes-all": "ServiceTypes",
    "workOrderBurialSites-all": "WorkOrderBurialSites", "workOrderComments-all": "WorkOrderComments",
    "workOrderMilestones-all": "WorkOrderMilestones", "workOrderMilestoneTypes-all": "WorkOrderMilestoneTypes",
    "workOrders-all": "WorkOrders", "workOrderTypes-all": "WorkOrderTypes",
}
FORMATTED_COLUMNS = {
    "cemeteries-formatted": ("cemeteryName", "cemeteryDescription", "cemeteryAddress1", "cemeteryAddress2",
        "cemeteryCity", "cemeteryProvince", "cemeteryPostalCode", "cemeteryPhoneNumber"),
    "funeralHomes-formatted": ("funeralHomeName", "funeralHomeAddress1", "funeralHomeAddress2",
        "funeralHomeCity", "funeralHomeProvince", "funeralHomePostalCode", "funeralHomePhoneNumber"),
}
PARAMETER_REPORTS = {
    "burialSites-byBurialSiteStatusId": "burialSiteStatusId",
    "burialSites-byBurialSiteTypeId": "burialSiteTypeId", "burialSites-byCemeteryId": "cemeteryId",
    "contractInterments-byContractId": "contractId", "contractInterments-directory": None,
    "contracts-current-byCemeteryId": "cemeteryId",
    "contractTransactions-byTransactionDateString": "transactionDateString",
    "workOrderMilestones-byWorkOrderId": "workOrderId", "workOrders-open": None,
}
REPORT_NAMES = tuple(SIMPLE_REPORTS) + tuple(PARAMETER_REPORTS)
REPORT_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE"]


def _parameter(parameters, name):
    """SQLite numeric-column equality without SQL Server's conversion errors.

    A missing bind is an error in node:sqlite. Text which is not a finite
    number simply matches no integer rows in SQLite; bind NULL on SQL Server.
    """
    if name not in parameters:
        raise ValueError("Missing report parameter: " + name)
    value = parameters[name]
    if isinstance(value, (list, dict, bool)) or value is None:
        raise ValueError("Invalid report parameter: " + name)
    if isinstance(value, str) and (not value.strip() or value.strip().lower().startswith(("0x", "0b", "0o"))):
        return None
    number = js_number(value)
    if not math.isfinite(number) or number != math.trunc(number) or abs(number) > 2**63 - 1:
        return None
    return int(number)


def report_statement(report_name: str, parameters=None, *, current_date=None):
    parameters = {} if parameters is None else parameters
    today = date_to_integer(date.today()) if current_date is None else (date_to_integer(current_date) if isinstance(current_date, date) else current_date)
    if report_name in SIMPLE_REPORTS:
        table = TABLES[SIMPLE_REPORTS[report_name]]
        if report_name in FORMATTED_COLUMNS:
            query = sa.select(*(table.c[key] for key in FORMATTED_COLUMNS[report_name])).where(table.c.recordDelete_timeMillis.is_(None))
            return query.order_by(table.c.cemeteryName) if report_name == "cemeteries-formatted" else query
        return sa.select(table)
    if report_name not in PARAMETER_REPORTS:
        return None
    key = PARAMETER_REPORTS[report_name]
    value = _parameter(parameters, key) if key and key != "transactionDateString" else None
    bs, bt, status, cem = (TABLES[name] for name in ("BurialSites", "BurialSiteTypes", "BurialSiteStatuses", "Cemeteries"))
    contract, ct, interment = (TABLES[name] for name in ("Contracts", "ContractTypes", "ContractInterments"))
    if report_name.startswith("burialSites-by"):
        joined = bs.outerjoin(bt, bs.c.burialSiteTypeId == bt.c.burialSiteTypeId).outerjoin(status,
            bs.c.burialSiteStatusId == status.c.burialSiteStatusId).outerjoin(cem, bs.c.cemeteryId == cem.c.cemeteryId)
        return sa.select(bs.c.burialSiteId, cem.c.cemeteryName, bs.c.burialSiteName, bt.c.burialSiteType,
            status.c.burialSiteStatus).select_from(joined).where(bs.c.recordDelete_timeMillis.is_(None), bs.c[key] == sa.bindparam("report_filter", value))
    if report_name == "contractInterments-byContractId":
        container, depth = TABLES["IntermentContainerTypes"], TABLES["IntermentDepths"]
        joined = interment.outerjoin(contract, interment.c.contractId == contract.c.contractId).outerjoin(container,
            interment.c.intermentContainerTypeId == container.c.intermentContainerTypeId).outerjoin(depth, interment.c.intermentDepthId == depth.c.intermentDepthId)
        columns = [interment.c.contractId, contract.c.contractNumber] + [interment.c[name] for name in ("intermentNumber", "deceasedName",
            "deceasedAddress1", "deceasedAddress2", "deceasedCity", "deceasedProvince", "deceasedPostalCode", "birthDate", "birthPlace",
            "deathDate", "deathPlace", "deathAge", "deathAgePeriod", "intermentContainerTypeId")]
        columns += [container.c.intermentContainerType, interment.c.intermentDepthId, depth.c.intermentDepth]
        return sa.select(*columns).select_from(joined).where(interment.c.recordDelete_timeMillis.is_(None), interment.c.contractId == sa.bindparam("report_filter", value))
    if report_name == "contractInterments-directory":
        joined = interment.outerjoin(contract, interment.c.contractId == contract.c.contractId).join(bs,
            contract.c.burialSiteId == bs.c.burialSiteId).outerjoin(bt, bs.c.burialSiteTypeId == bt.c.burialSiteTypeId).outerjoin(cem, bs.c.cemeteryId == cem.c.cemeteryId)
        return sa.select(interment.c.deceasedName, interment.c.deathDate, interment.c.deathAge, interment.c.deathAgePeriod,
            cem.c.cemeteryName, bs.c.burialSiteName, bt.c.burialSiteType).select_from(joined).where(
                interment.c.recordDelete_timeMillis.is_(None), contract.c.recordDelete_timeMillis.is_(None), contract.c.contractStartDate <= today,
                sa.or_(contract.c.contractEndDate.is_(None), contract.c.contractEndDate > today),
                contract.c.contractTypeId.in_(sa.select(ct.c.contractTypeId).where(ct.c.isPreneed == False))
            ).order_by(interment.c.deceasedName, interment.c.deathDate)
    if report_name == "contracts-current-byCemeteryId":
        joined = contract.outerjoin(ct, contract.c.contractTypeId == ct.c.contractTypeId).outerjoin(bs,
            contract.c.burialSiteId == bs.c.burialSiteId).outerjoin(cem, bs.c.cemeteryId == cem.c.cemeteryId)
        return sa.select(contract.c.contractId, contract.c.contractNumber, bs.c.burialSiteName, cem.c.cemeteryName,
            ct.c.contractType, contract.c.contractStartDate, contract.c.contractEndDate).select_from(joined).where(
                contract.c.recordDelete_timeMillis.is_(None), sa.or_(contract.c.contractEndDate.is_(None), contract.c.contractEndDate >= today),
                bs.c.cemeteryId == sa.bindparam("report_filter", value))
    if report_name == "contractTransactions-byTransactionDateString":
        if key not in parameters:
            raise ValueError("Missing report parameter: " + key)
        value = _date_string_to_integer(parameters[key])
        trans = TABLES["ContractTransactions"]
        return sa.select(trans.c.contractId, contract.c.contractNumber, *(trans.c[name] for name in ("transactionIndex", "transactionDate",
            "transactionTime", "transactionAmount", "isInvoiced", "externalReceiptNumber", "transactionNote"))).select_from(
                trans.outerjoin(contract, trans.c.contractId == contract.c.contractId)).where(trans.c.recordDelete_timeMillis.is_(None), trans.c.transactionDate == value)
    milestone, mt = TABLES["WorkOrderMilestones"], TABLES["WorkOrderMilestoneTypes"]
    if report_name == "workOrderMilestones-byWorkOrderId":
        return sa.select(mt.c.workOrderMilestoneType, *(milestone.c[name] for name in ("workOrderMilestoneDate", "workOrderMilestoneTime",
            "workOrderMilestoneDescription", "workOrderMilestoneCompletionDate", "workOrderMilestoneCompletionTime"))).select_from(
                milestone.outerjoin(mt, milestone.c.workOrderMilestoneTypeId == mt.c.workOrderMilestoneTypeId)).where(
                    milestone.c.recordDelete_timeMillis.is_(None), milestone.c.workOrderId == sa.bindparam("report_filter", value))
    wo, wt = TABLES["WorkOrders"], TABLES["WorkOrderTypes"]
    counts = sa.select(milestone.c.workOrderId, sa.func.count(milestone.c.workOrderMilestoneId).label("workOrderMilestoneCount"),
        sa.func.sum(sa.case((milestone.c.workOrderMilestoneCompletionDate.is_(None), 0), else_=1)).label("workOrderMilestoneCompletionCount")).where(
            milestone.c.recordDelete_timeMillis.is_(None)).group_by(milestone.c.workOrderId).subquery()
    return sa.select(wo.c.workOrderId, wo.c.workOrderNumber, wt.c.workOrderType, wo.c.workOrderDescription,
        wo.c.workOrderOpenDate, counts.c.workOrderMilestoneCount, counts.c.workOrderMilestoneCompletionCount).select_from(
            wo.outerjoin(wt, wo.c.workOrderTypeId == wt.c.workOrderTypeId).outerjoin(counts, wo.c.workOrderId == counts.c.workOrderId)).where(
                wo.c.recordDelete_timeMillis.is_(None), wo.c.workOrderCloseDate.is_(None))


def get_report_data(database, report_name, parameters=None, *, current_date=None):
    statement = report_statement(report_name, parameters, current_date=current_date)
    if statement is None:
        return None
    with transaction(database) as connection:
        # node:sqlite exposes bits as numbers, unlike pyodbc's Python bools.
        rows = [{key: int(value) if isinstance(value, bool) else value for key, value in row.items()}
            for row in connection.execute(statement).mappings()]
    # SQLite BINARY sorts UTF-8 scalar sequences, whereas SQL Server BIN2
    # compares UTF-16 units (and ignores trailing spaces in comparisons).
    # Python's scalar ordering preserves the source's explicit report order,
    # including supplementary characters, embedded NUL and trailing spaces.
    if report_name == "cemeteries-formatted":
        rows.sort(key=lambda row: row["cemeteryName"])
    elif report_name == "contractInterments-directory":
        rows.sort(key=lambda row: (row["deceasedName"], row["deathDate"] is not None,
            row["deathDate"] if row["deathDate"] is not None else 0))
    return rows


def report_csv(rows: list[dict[str, Any]]) -> str:
    """Papa Parse 5.7.0 default unparse: first-row keys, CRLF, no final CRLF.

    An empty result has no header. Empty/null cells remain empty; leading or
    trailing ASCII spaces, BOM, quotes, comma, CR and LF trigger quoting.
    Source defaults leave spreadsheet formulas unchanged.
    """
    if not rows:
        return ""

    def cell(value):
        if value is None:
            return ""
        text = ("true" if value else "false") if isinstance(value, bool) else (_js_number_string(value) if isinstance(value, (int, float)) else str(value))
        escaped = text.replace('"', '""')
        return '"' + escaped + '"' if any(char in text for char in '\r\n",\ufeff') or text.startswith(" ") or text.endswith(" ") else escaped

    columns = list(rows[0])
    return "\r\n".join([",".join(cell(key) for key in columns)] + [",".join(cell(row.get(key)) for key in columns) for row in rows])


def install_reports(app, options=None):
    from cemaris.auth import current_user
    from cemaris.catalogs import get_catalog_records
    from cemaris.cemeteries import get_cemeteries
    from cemaris.dependencies import get_engine

    app.state.report_options = options or ReportOptions()
    router = APIRouter(tags=["reports"])

    @router.get("/api/reports")
    @router.get("/api/reports/", include_in_schema=False)
    def metadata(request: Request, user=Depends(current_user)):
        with transaction(get_engine(request)) as connection:
            return {"reportNames": REPORT_NAMES, "simpleReports": [{"reportName": name, "tableName": table, "formatted": name.endswith("-formatted")}
                for name, table in SIMPLE_REPORTS.items()], "parameterReports": PARAMETER_REPORTS,
                "todayDateString": date.today().isoformat(),
                "cemeteries": sorted(get_cemeteries(connection), key=lambda row: (row["cemeteryName"], row["cemeteryId"])),
                "burialSiteTypes": get_catalog_records(connection, "burialSiteTypes"),
                "burialSiteStatuses": get_catalog_records(connection, "burialSiteStatuses")}

    @router.api_route("/api/reports/{report_name}", methods=REPORT_METHODS)
    @router.api_route("/api/reports/{report_name}/", methods=REPORT_METHODS, include_in_schema=False)
    @router.api_route("/reports/{report_name}", methods=REPORT_METHODS, include_in_schema=False)
    @router.api_route("/reports/{report_name}/", methods=REPORT_METHODS, include_in_schema=False)
    def download(report_name: str, request: Request, user=Depends(current_user)):
        # Source uses query parameters even for POST and ignores its body.
        if report_name not in REPORT_NAMES:
            return JSONResponse({"success": False, "message": "Report Not Found"}, status_code=404)
        try:
            parameters = {key: values[0] if len(values := request.query_params.getlist(key)) == 1 else values
                for key in request.query_params}
            rows = get_report_data(get_engine(request), report_name, parameters)
        except (ValueError, TypeError, KeyError, OverflowError) as error:
            from cemaris.catalogs import _catalog_error
            return _catalog_error(request, 400, "invalid_report_parameter", str(error))
        csv = report_csv(rows)
        return Response("" if request.method == "HEAD" else csv, media_type="text/csv", headers={
            "Content-Disposition": f"attachment; filename={report_name}-{now_millis()}.csv",
            "Content-Length": str(len(csv.encode("utf-8")))})

    app.include_router(router)
