"""Administrative catalogs ported from Sunrise CMS (MIT).

Source: database/{add,get,update,delete,move}*.ts, handlers/admin{Get,Post}
at 451ce034863b16502484367044f3e9b65370111a; licenses/Sunrise-LICENSE.md.
Reads normalize order numbers without modifying update/audit fields. Soft
deletion deliberately retains references, including historical field values.
"""

from __future__ import annotations

from datetime import datetime
import json
import math
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import IntegrityError

from cemaris.db.schema import TABLES
from cemaris.db.semantics import js_number
from cemaris.preferences import get_setting_value, now_millis, transaction


class CatalogOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    contract_prints: list[str] = Field(default_factory=lambda: ["screen/contract"])
    custom_pdf_print_titles: dict[str, str] = Field(default_factory=dict)
    fee_tax_percentage_default: float = 0


class CatalogSourceError(ValueError):
    """An explicit, reproducible source limitation; no mutation is performed."""


def _catalog_error(request: Request, status: int, code: str, message: str) -> JSONResponse:
    """Common transport envelope plus the source form-response properties."""
    request_id = request.state.request_id
    return JSONResponse({
        "success": False, "code": code, "errorMessage": message,
        "error": {"code": code, "message": message, "details": [], "request_id": request_id},
    }, status_code=status, headers={"X-Request-ID": request_id})


# Resource -> table, ID, display field. This allowlist is also the SQL boundary.
CATALOGS = {
    "burialSiteTypes": ("BurialSiteTypes", "burialSiteTypeId", "burialSiteType"),
    "burialSiteTypeFields": ("BurialSiteTypeFields", "burialSiteTypeFieldId", "burialSiteTypeField"),
    "burialSiteStatuses": ("BurialSiteStatuses", "burialSiteStatusId", "burialSiteStatus"),
    "contractTypes": ("ContractTypes", "contractTypeId", "contractType"),
    "contractTypeFields": ("ContractTypeFields", "contractTypeFieldId", "contractTypeField"),
    "contractTypePrints": ("ContractTypePrints", "printEJS", "printEJS"),
    "committalTypes": ("CommittalTypes", "committalTypeId", "committalType"),
    "intermentContainerTypes": ("IntermentContainerTypes", "intermentContainerTypeId", "intermentContainerType"),
    "intermentDepths": ("IntermentDepths", "intermentDepthId", "intermentDepth"),
    "serviceTypes": ("ServiceTypes", "serviceTypeId", "serviceType"),
    "feeCategories": ("FeeCategories", "feeCategoryId", "feeCategory"),
    "fees": ("Fees", "feeId", "feeName"),
    "workOrderTypes": ("WorkOrderTypes", "workOrderTypeId", "workOrderType"),
    "workOrderStatuses": ("WorkOrderStatuses", "workOrderStatusId", "workOrderStatus"),
    "workOrderMilestoneTypes": ("WorkOrderMilestoneTypes", "workOrderMilestoneTypeId", "workOrderMilestoneType"),
}
FIELD_RESOURCES = {"burialSiteTypeFields": "burialSiteTypeId", "contractTypeFields": "contractTypeId"}
GENERIC_RESOURCES = {"burialSiteStatuses", "workOrderTypes", "workOrderStatuses", "workOrderMilestoneTypes"}
NO_AUDIT = {"burialSiteTypeFields", "contractTypeFields", "contractTypePrints", "feeCategories"}
BUILTIN_PRINT_TITLES = {
    "screen/contract": "Grabnutzungsvertrag",
    "pdf/workOrder": "Arbeitsauftrag",
    "pdf/workOrder-commentLog": "Arbeitsauftrag – Kommentarprotokoll",
}


def _spec(resource: str):
    try:
        table_name, id_key, name_key = CATALOGS[resource]
    except KeyError:
        raise ValueError("Unknown catalog") from None
    return TABLES[table_name], id_key, name_key


def _number(value, *, integer=False, empty=None):
    if value is None or value == "":
        return empty
    # SQL Server has stronger column types than SQLite. Reject nonnumeric input
    # explicitly rather than relying on driver-specific conversion or truncation.
    number = float(value)
    if not math.isfinite(number) or (integer and not number.is_integer()):
        raise ValueError("Expected a finite integer" if integer else "Expected a finite number")
    if integer:
        return int(number)
    return number


def _flag(value):
    if isinstance(value, bool):
        return value
    number = _number(value, integer=True, empty=0)
    if number not in (0, 1):
        raise ValueError("Expected 0 or 1")
    return bool(number)


def _form_values(resource: str, form: dict, *, adding: bool) -> dict:
    table, _, name_key = _spec(resource)
    values = {name_key: form[name_key]}
    if resource == "burialSiteTypes":
        for key in ("bodyCapacityMax", "crematedCapacityMax"):
            values[key] = _number(form[key], integer=True)
    if resource == "contractTypes":
        # Source checks presence, including empty/'0', rather than truthiness.
        values["isPreneed"] = "isPreneed" in form
    if resource == "intermentContainerTypes":
        values["isCremationType"] = _flag(form.get("isCremationType", "0"))
    if adding and resource in {"committalTypes", "intermentDepths", "intermentContainerTypes"}:
        key = name_key + "Key"
        values[key] = form.get(key) or ""
    if resource in FIELD_RESOURCES:
        if adding:
            parent = FIELD_RESOURCES[resource]
            values[parent] = _number(form.get(parent), integer=True)
        values.update(
            fieldType=form.get("fieldType") if form.get("fieldType") is not None else "text",
            fieldValues=(form.get("fieldValues") if form.get("fieldValues") is not None else "") if adding else form["fieldValues"],
            pattern=form.get("pattern") if form.get("pattern") is not None else "",
            minLength=_number(form.get("minLength") if form.get("minLength") is not None else 0, integer=True, empty=0),
            maxLength=_number(form.get("maxLength") if form.get("maxLength") is not None else 100, integer=True, empty=0),
            isRequired=(form.get("isRequired") != "") if adding else _flag(math.trunc(js_number(form["isRequired"]))),
        )
    if resource == "feeCategories":
        values["isGroupedFee"] = form.get("isGroupedFee", "") == "1"
    if resource == "fees":
        for key in ("feeCategoryId", "contractTypeId", "burialSiteTypeId"):
            values[key] = _number(form[key], integer=True)
        for key in ("feeDescription", "feeAccount"):
            values[key] = form[key]
        for key in ("feeAmount", "taxAmount", "taxPercentage"):
            values[key] = _number(form.get(key))
        values["feeFunction"] = form.get("feeFunction")
        values["quantityUnit"] = form.get("quantityUnit") if form.get("quantityUnit") is not None else ("" if adding else None)
        for key in ("includeQuantity", "isRequired"):
            # Missing flags default to false on add; update's source requires
            # form values and considers any nonempty supplied string true.
            values[key] = ((form.get(key) if form.get(key) is not None else "") != "") if adding else (form.get(key) != "")
    if adding:
        value = form.get("orderNumber") if form.get("orderNumber") is not None else -1
        values["orderNumber"] = _number(value, integer=True, empty=-1 if resource in GENERIC_RESOURCES else 0)
    for key, value in values.items():
        column = table.c[key]
        if value is None and not column.nullable:
            raise ValueError(f"{key} is required")
        if isinstance(value, str) and getattr(column.type, "length", None) and len(value) > column.type.length:
            raise ValueError(f"{key} exceeds {column.type.length} characters")
        if isinstance(column.type, sa.SmallInteger) and value is not None and not -32768 <= value <= 32767:
            raise ValueError(f"{key} exceeds SQL Server smallint range")
        if key in {"minLength", "maxLength"} and value < 0:
            raise ValueError(f"{key} must be nonnegative")
    return values


def _identity(table, id_key, form):
    predicate = table.c[id_key] == (form[id_key] if id_key == "printEJS" else _number(form[id_key], integer=True))
    if table.name == "ContractTypePrints":
        predicate = sa.and_(predicate, table.c.contractTypeId == _number(form["contractTypeId"], integer=True))
    return predicate


def _record(connection, table, predicate, *, active=True):
    query = sa.select(table).where(predicate)
    if active:
        query = query.where(table.c.recordDelete_timeMillis.is_(None))
    row = connection.execute(query).mappings().first()
    return dict(row) if row is not None else None


def _json_value(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            return None  # JSON.stringify's NaN/Infinity representation.
        if value.is_integer():
            return int(value)  # JSON.stringify(1.0) serializes as 1.
    if isinstance(value, dict):
        return {key: _json_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_value(item) for item in value]
    return value


def _audit(connection, resource, record_id, actor, kind, before, after):
    table, _, name_key = _spec(resource)
    differences = [("*", before, after)] if kind != "updated" else [
        (key, before[key], after[key]) for key in before
        if key not in {"recordCreate_timeMillis", "recordCreate_username", "recordUpdate_timeMillis"}
        and before[key] != after[key]
    ]
    for field, old, new in differences:
        now = datetime.now().astimezone()
        connection.execute(TABLES["AuditLog"].insert().values(
            logMillis=now_millis(), logDate=int(now.strftime("%Y%m%d")), logTime=int(now.strftime("%H%M")),
            mainRecordType="fee" if resource == "fees" else name_key,
            mainRecordId=str(record_id), updateTable=table.name, recordIndex=None,
            updateField=field, updateType=kind, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":")),
        ))


def get_catalog_records(database: Engine | Connection, resource: str, *, parent_id=None, include_deleted=False, normalize=True) -> list[dict]:
    """Raw source columns; fields and fee children are scoped to their parent."""
    table, id_key, name_key = _spec(resource)
    columns = [column for column in table.c if not column.name.startswith("record")]
    if resource in FIELD_RESOURCES:
        columns = [column for column in columns if column.name != FIELD_RESOURCES[resource]]
    conditions = [] if include_deleted else [table.c.recordDelete_timeMillis.is_(None)]
    if resource in FIELD_RESOURCES:
        parent = FIELD_RESOURCES[resource]
        conditions.append(table.c[parent].is_(None) if parent_id is None or (resource == "contractTypeFields" and parent_id == -1) else table.c[parent] == parent_id)
    if resource == "fees" and parent_id is not None:
        conditions.append(table.c.feeCategoryId == parent_id)
    order = [table.c.orderNumber, table.c[name_key]]
    if resource == "intermentContainerTypes":
        order.insert(0, table.c.isCremationType)
    if resource in {"contractTypes", "serviceTypes", "committalTypes", "intermentContainerTypes", "intermentDepths"}:
        order.append(table.c[id_key])
    with transaction(database) as connection:
        rows = [dict(row) for row in connection.execute(sa.select(*columns).where(*conditions).order_by(*order)).mappings()]
        should_normalize = normalize and (not include_deleted or resource == "committalTypes")
        for index, row in enumerate(rows):
            if should_normalize and row["orderNumber"] != index:
                connection.execute(table.update().where(table.c[id_key] == row[id_key], table.c.recordDelete_timeMillis.is_(None)).values(orderNumber=index))
                row["orderNumber"] = index
    return rows


def get_contract_type_prints(database, contract_type_id, *, options=None) -> list[str]:
    options = options or CatalogOptions()
    table = TABLES["ContractTypePrints"]
    with transaction(database) as connection:
        rows = connection.execute(sa.select(table.c.printEJS, table.c.orderNumber).where(
            table.c.contractTypeId == contract_type_id, table.c.recordDelete_timeMillis.is_(None),
            table.c.printEJS.in_(["*", *options.contract_prints]),
        ).order_by(table.c.orderNumber, table.c.printEJS)).mappings().all()
        for index, row in enumerate(rows):
            if row["orderNumber"] != index:
                connection.execute(table.update().where(table.c.contractTypeId == contract_type_id, table.c.printEJS == row["printEJS"]).values(orderNumber=index))
        return [row["printEJS"] for row in rows]


def get_effective_contract_type_prints(database, contract_type_id, *, options=None) -> list[str]:
    options = options or CatalogOptions()
    prints = get_contract_type_prints(database, contract_type_id, options=options)
    return list(options.contract_prints) if "*" in prints else prints


def get_fees(database, fee_category_id, filters: dict | None = None) -> list[dict]:
    filters = filters or {}
    table = TABLES["Fees"]
    contract_types, burial_types, contract_fees = (TABLES[key] for key in ("ContractTypes", "BurialSiteTypes", "ContractFees"))
    counts = sa.select(contract_fees.c.feeId, sa.func.count(contract_fees.c.contractId).label("contractFeeCount")).where(contract_fees.c.recordDelete_timeMillis.is_(None)).group_by(contract_fees.c.feeId).subquery()
    with transaction(database) as connection:
        conditions = [table.c.recordDelete_timeMillis.is_(None), table.c.feeCategoryId == fee_category_id]
        for key in ("contractTypeId", "burialSiteTypeId"):
            if filters.get(key):
                conditions.append(sa.or_(table.c[key].is_(None), table.c[key] == _number(filters[key], integer=True)))
        columns = [column for column in table.c if not column.name.startswith("record")]
        query = sa.select(*columns, contract_types.c.contractType, burial_types.c.burialSiteType,
            sa.func.coalesce(counts.c.contractFeeCount, 0).label("contractFeeCount")).select_from(
                table.outerjoin(contract_types, table.c.contractTypeId == contract_types.c.contractTypeId)
                .outerjoin(burial_types, table.c.burialSiteTypeId == burial_types.c.burialSiteTypeId)
                .outerjoin(counts, table.c.feeId == counts.c.feeId)
            ).where(*conditions).order_by(table.c.orderNumber, table.c.feeName)
        rows = [dict(row) for row in connection.execute(query).mappings()]
        if "contractTypeId" not in filters and "burialSiteTypeId" not in filters:
            for index, row in enumerate(rows):
                if row["orderNumber"] != index:
                    connection.execute(table.update().where(table.c.feeId == row["feeId"], table.c.recordDelete_timeMillis.is_(None)).values(orderNumber=index))
                    row["orderNumber"] = index
        return rows


def get_fee_categories(database, filters: dict | None = None, *, include_fees=True) -> list[dict]:
    filters = filters or {}
    table, fees = TABLES["FeeCategories"], TABLES["Fees"]
    conditions = [table.c.recordDelete_timeMillis.is_(None)]
    for key in ("contractTypeId", "burialSiteTypeId"):
        if key in filters and filters[key] not in (None, ""):
            conditions.append(table.c.feeCategoryId.in_(sa.select(fees.c.feeCategoryId).where(
                fees.c.recordDelete_timeMillis.is_(None), sa.or_(fees.c[key].is_(None), fees.c[key] == _number(filters[key], integer=True)))))
    if filters.get("feeCategoryId") not in (None, ""):
        conditions.append(table.c.feeCategoryId == _number(filters["feeCategoryId"], integer=True))
    with transaction(database) as connection:
        columns = [column for column in table.c if not column.name.startswith("record")]
        rows = [dict(row) for row in connection.execute(sa.select(*columns).where(*conditions).order_by(table.c.orderNumber, table.c.feeCategory)).mappings()]
        if include_fees:
            for index, row in enumerate(rows):
                if "contractTypeId" not in filters and "burialSiteTypeId" not in filters and row["orderNumber"] != index:
                    connection.execute(table.update().where(table.c.feeCategoryId == row["feeCategoryId"], table.c.recordDelete_timeMillis.is_(None)).values(orderNumber=index))
                    row["orderNumber"] = index
                row["fees"] = get_fees(connection, row["feeCategoryId"], filters)
        return rows


def _fee_audit_record(connection, fee_id):
    table, categories, contracts, burials = (TABLES[key] for key in ("Fees", "FeeCategories", "ContractTypes", "BurialSiteTypes"))
    columns = [sa.func.coalesce(table.c.feeAmount, 0).label("feeAmount") if column.name == "feeAmount" else column
        for column in table.c if not column.name.startswith("record")]
    row = connection.execute(sa.select(*columns, categories.c.feeCategory, contracts.c.contractType, burials.c.burialSiteType)
        .select_from(table.outerjoin(categories, table.c.feeCategoryId == categories.c.feeCategoryId)
        .outerjoin(contracts, table.c.contractTypeId == contracts.c.contractTypeId)
        .outerjoin(burials, table.c.burialSiteTypeId == burials.c.burialSiteTypeId))
        .where(table.c.feeId == fee_id, table.c.recordDelete_timeMillis.is_(None))).mappings().first()
    return dict(row) if row is not None else None


def get_catalogs(database: Engine | Connection, *, options=None) -> dict:
    options = options or CatalogOptions()
    with transaction(database) as connection:
        state = {}
        for resource in CATALOGS:
            if resource in FIELD_RESOURCES or resource in {"contractTypePrints", "fees", "feeCategories"}:
                continue
            state[resource] = get_catalog_records(connection, resource)
        for row in state["burialSiteTypes"]:
            row["burialSiteTypeFields"] = get_catalog_records(connection, "burialSiteTypeFields", parent_id=row["burialSiteTypeId"])
        for row in state["contractTypes"]:
            row["contractTypeFields"] = get_catalog_records(connection, "contractTypeFields", parent_id=row["contractTypeId"])
            row["contractTypePrints"] = get_contract_type_prints(connection, row["contractTypeId"], options=options)
        state["allContractTypeFields"] = get_catalog_records(connection, "contractTypeFields")
        state["feeCategories"] = get_fee_categories(connection)
        titles = {**BUILTIN_PRINT_TITLES, **{"pdf/" + key: title for key, title in options.custom_pdf_print_titles.items()}}
        state["config"] = {
            "bodyCapacityMaxDefault": get_setting_value(connection, "burialSiteTypes.bodyCapacityMaxDefault"),
            "crematedCapacityMaxDefault": get_setting_value(connection, "burialSiteTypes.crematedCapacityMaxDefault"),
            "taxPercentageDefault": options.fee_tax_percentage_default,
            "fieldTypes": ["text", "date", "select"], "feeFunctions": {},
            "availablePrints": list(options.contract_prints),
            # getPrintConfig dispatches on the first two slash segments. Keep
            # the original configured identifier as the returned title's key.
            "contractTypePrintTitles": {
                key: titles["/".join(key.split("/")[:2])]
                for key in options.contract_prints if "/".join(key.split("/")[:2]) in titles
            },
        }
        return state


def initialize_catalogs(database: Engine | Connection, *, audit_enabled=False, options=None) -> dict[str, int]:
    """Explicit initializeData workflow; GET/mutations never reseed a catalog.

    Existing source getters normalize before deciding whether a table is empty.
    Fee categories are the exception: initializeData does not request their fees,
    and consequently does not normalize them. Newly inserted defaults retain the
    source's one-based/tied order until their next application read.
    """
    from cemaris.db.seed import DEFAULT_CATALOGS

    inserted = {}
    with transaction(database) as connection:
        for resource, (table_name, _, _) in CATALOGS.items():
            if table_name not in DEFAULT_CATALOGS:
                continue
            if resource == "feeCategories":
                existing = get_fee_categories(connection, include_fees=False)
            else:
                existing = get_catalog_records(connection, resource)
                if resource == "burialSiteTypes":
                    for record in existing:
                        get_catalog_records(connection, "burialSiteTypeFields", parent_id=record["burialSiteTypeId"])
                elif resource == "contractTypes":
                    for record in existing:
                        get_catalog_records(connection, "contractTypeFields", parent_id=record["contractTypeId"])
                        get_contract_type_prints(connection, record["contractTypeId"], options=options)
            inserted[table_name] = 0
            if existing:
                continue
            for source_values in DEFAULT_CATALOGS[table_name]:
                form = dict(source_values)
                if resource == "contractTypes" and not form.get("isPreneed"):
                    form.pop("isPreneed", None)
                add_catalog_record(connection, resource, form, "databaseInit", audit_enabled=audit_enabled, options=options)
                inserted[table_name] += 1
    return inserted


def get_burial_site_type_fields(database, burial_site_type_id) -> list[dict]:
    """Fields of an active type; source lookup of an unknown type yields []."""
    with transaction(database) as connection:
        table = TABLES["BurialSiteTypes"]
        if _record(connection, table, table.c.burialSiteTypeId == burial_site_type_id) is None:
            return []
        return get_catalog_records(connection, "burialSiteTypeFields", parent_id=burial_site_type_id)


def get_contract_type_fields(database, contract_type_id) -> list[dict]:
    """General fields precede the selected type's fields, preserving each order."""
    with transaction(database) as connection:
        table = TABLES["ContractTypes"]
        if _record(connection, table, table.c.contractTypeId == contract_type_id) is None:
            raise CatalogSourceError("Für eine fehlende oder gelöschte Vertragsart können keine Felder ausgewählt werden.")
        return [*get_catalog_records(connection, "contractTypeFields"),
            *get_catalog_records(connection, "contractTypeFields", parent_id=contract_type_id)]


def add_catalog_record(database, resource: str, form: dict, actor: str, *, audit_enabled=False, options=None):
    table, id_key, _ = _spec(resource)
    now = now_millis()
    with transaction(database) as connection:
        if resource == "contractTypePrints":
            predicate = _identity(table, id_key, form)
            result = connection.execute(table.update().where(predicate).values(
                recordUpdate_username=actor, recordUpdate_timeMillis=now, recordDelete_username=None, recordDelete_timeMillis=None))
            if not result.rowcount:
                connection.execute(table.insert().values(contractTypeId=_number(form["contractTypeId"], integer=True), printEJS=form["printEJS"],
                    orderNumber=_number(form.get("orderNumber", -1), integer=True, empty=0), recordCreate_username=actor, recordCreate_timeMillis=now,
                    recordUpdate_username=actor, recordUpdate_timeMillis=now))
            return True
        values = _form_values(resource, form, adding=True)
        result = connection.execute(table.insert().values(**values, recordCreate_username=actor, recordCreate_timeMillis=now,
            recordUpdate_username=actor, recordUpdate_timeMillis=now))
        record_id = result.inserted_primary_key[0]
        if audit_enabled and resource not in NO_AUDIT:
            after = _fee_audit_record(connection, record_id) if resource == "fees" else _record(connection, table, table.c[id_key] == record_id)
            _audit(connection, resource, record_id, actor, "created", None, [after] if resource in GENERIC_RESOURCES else after)
        return record_id


def update_catalog_record(database, resource: str, form: dict, actor: str, *, audit_enabled=False, options=None, amount_only=False) -> bool:
    table, id_key, _ = _spec(resource)
    if resource == "contractTypePrints":
        raise ValueError("Print assignments support add, delete and move")
    with transaction(database) as connection:
        predicate = _identity(table, id_key, form)
        before = _fee_audit_record(connection, form[id_key]) if resource == "fees" else _record(connection, table, predicate)
        values = {"feeAmount": _number(form["feeAmount"], empty=0)} if amount_only and resource == "fees" else _form_values(resource, form, adding=False)
        result = connection.execute(table.update().where(predicate, table.c.recordDelete_timeMillis.is_(None)).values(
            **values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount and audit_enabled and resource not in NO_AUDIT and resource != "workOrderStatuses":
            after = _fee_audit_record(connection, form[id_key]) if resource == "fees" else _record(connection, table, predicate)
            _audit(connection, resource, form[id_key], actor, "updated", before, after)
        return bool(result.rowcount)


def delete_catalog_record(database, resource: str, form: dict, actor: str, *, audit_enabled=False, options=None) -> bool:
    table, id_key, _ = _spec(resource)
    with transaction(database) as connection:
        predicate = _identity(table, id_key, form)
        before = _record(connection, table, predicate)
        where = [predicate] if resource == "contractTypePrints" else [predicate, table.c.recordDelete_timeMillis.is_(None)]
        deleted = {"recordDelete_username": actor, "recordDelete_timeMillis": now_millis()}
        result = connection.execute(table.update().where(*where).values(**deleted))
        children = {"burialSiteTypes": ["BurialSiteTypeFields"], "contractTypes": ["ContractTypeFields", "ContractTypePrints"]}.get(resource, [])
        for child_name in children:
            child = TABLES[child_name]
            connection.execute(child.update().where(child.c[id_key] == _number(form[id_key], integer=True), child.c.recordDelete_timeMillis.is_(None)).values(**deleted))
        if result.rowcount and audit_enabled and resource not in NO_AUDIT and resource != "workOrderStatuses":
            _audit(connection, resource, form[id_key], actor, "deleted", before, None)
        return bool(result.rowcount)


def move_catalog_record(database, resource: str, form: dict, direction: str) -> bool:
    if direction not in {"up", "down"}:
        raise ValueError("Unknown move direction")
    table, id_key, _ = _spec(resource)
    with transaction(database) as connection:
        predicate = _identity(table, id_key, form)
        current = _record(connection, table, predicate, active=resource == "fees")
        if current is None:
            return False
        order = current["orderNumber"]
        move_to_end = form.get("moveToEnd") == "1" or form.get("moveToEnd") is True
        if direction == "up" and order <= 0:
            return True
        scope = []
        if resource in FIELD_RESOURCES:
            parent = FIELD_RESOURCES[resource]
            if resource == "contractTypeFields" and current[parent] is None:
                if not (direction == "up" and move_to_end):
                    raise CatalogSourceError("Allgemeine Vertragsfelder können nur an die erste Position verschoben werden.")
            scope = [table.c[parent].is_(None) if current[parent] is None else table.c[parent] == current[parent]]
        elif resource == "fees":
            scope = [table.c.feeCategoryId == current["feeCategoryId"]]
        elif resource == "contractTypePrints":
            scope = [table.c.contractTypeId == current["contractTypeId"]]
        active_scope = [table.c.recordDelete_timeMillis.is_(None), *scope]
        # Print source target writes also affect deleted assignments; other
        # generic target writes use updateRecordOrderNumber's active predicate.
        target = [predicate] if resource == "contractTypePrints" else [predicate, table.c.recordDelete_timeMillis.is_(None)]
        if move_to_end:
            maximum = connection.execute(sa.select(sa.func.max(table.c.orderNumber)).where(*active_scope)).scalar()
            if direction == "up":
                connection.execute(table.update().where(*target).values(orderNumber=-1))
                connection.execute(table.update().where(*active_scope, table.c.orderNumber < order).values(orderNumber=table.c.orderNumber + 1))
            elif order != maximum:
                connection.execute(table.update().where(*target).values(orderNumber=(maximum or 0) + 1))
                connection.execute(table.update().where(*active_scope, table.c.orderNumber > order).values(orderNumber=table.c.orderNumber - 1))
            return True
        delta = -1 if direction == "up" else 1
        connection.execute(table.update().where(*active_scope, table.c.orderNumber == order + delta).values(orderNumber=table.c.orderNumber - delta))
        result = connection.execute(table.update().where(*target).values(orderNumber=order + delta))
        return bool(result.rowcount)


def install_catalogs(app, *, options=None) -> None:
    from cemaris.auth import require_admin, require_update_cemeteries, require_update_contracts
    from cemaris.dependencies import get_engine

    app.state.catalog_options = options if options is not None else CatalogOptions()
    router = APIRouter(prefix="/api/admin/catalogs", tags=["catalogs"])

    @router.get("")
    def list_catalogs(request: Request, user=Depends(require_admin)):
        return get_catalogs(get_engine(request), options=request.app.state.catalog_options)

    @router.post("/{resource}/{action}")
    def mutate_catalog(resource: str, action: str, request: Request, form: dict[str, Any] = Body(...), user=Depends(require_admin)):
        if resource not in CATALOGS or action not in {"add", "update", "delete", "moveUp", "moveDown", "updateAmount"}:
            return _catalog_error(request, 404, "catalog_action_not_found", "Unknown catalog action")
        if action == "updateAmount" and resource != "fees":
            return _catalog_error(request, 400, "invalid_catalog_action", "Only fees support amount updates")
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled, "options": request.app.state.catalog_options}
                record_id = None
                if action == "add":
                    record_id = add_catalog_record(connection, resource, form, user["username"], **kwargs)
                    success = bool(record_id)
                elif action in {"update", "updateAmount"}:
                    success = update_catalog_record(connection, resource, form, user["username"], amount_only=action == "updateAmount", **kwargs)
                elif action == "delete":
                    success = delete_catalog_record(connection, resource, form, user["username"], **kwargs)
                else:
                    success = move_catalog_record(connection, resource, form, "up" if action == "moveUp" else "down")
                result = {"success": success, **get_catalogs(connection, options=request.app.state.catalog_options)}
                if record_id is not None and resource != "contractTypePrints":
                    result[CATALOGS[resource][1]] = record_id
            return result
        except CatalogSourceError as error:
            return _catalog_error(request, 409, "source_global_field_move", str(error))
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            message = "Missing catalog field" if isinstance(error, KeyError) else str(error)
            return _catalog_error(request, 400, "invalid_catalog_value", message)
        except IntegrityError:
            return _catalog_error(request, 400, "catalog_constraint", "The catalog value violates a database reference or constraint")

    app.include_router(router)

    fields_router = APIRouter(prefix="/api", tags=["catalog fields"])

    def selected_type(form, key):
        number = js_number(form.get(key, ""))
        return math.trunc(number) if math.isfinite(number) else None

    @fields_router.post("/burialSites/typeFields")
    @fields_router.post("/burialSites/doGetBurialSiteTypeFields", include_in_schema=False)
    def burial_fields(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
        return {"burialSiteTypeFields": get_burial_site_type_fields(get_engine(request), selected_type(form, "burialSiteTypeId"))}

    @fields_router.post("/contracts/typeFields")
    @fields_router.post("/contracts/doGetContractTypeFields", include_in_schema=False)
    def contract_fields(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
        try:
            return {"contractTypeFields": get_contract_type_fields(get_engine(request), selected_type(form, "contractTypeId"))}
        except CatalogSourceError as error:
            return _catalog_error(request, 409, "source_missing_contract_type", str(error))

    app.include_router(fields_router)
