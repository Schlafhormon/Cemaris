"""Contracts and participants, derived from Sunrise CMS (MIT), fixed 451ce034.

Source routes/contracts.ts, database/*Contract*.ts and contractsGet/Post.
See licenses/Sunrise-LICENSE.md. Interment/service editing is in contract_items;
finance editing is in contract_finance; attachment editing belongs to step 11.
"""

from __future__ import annotations

from datetime import date, datetime
import json
import math
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.exc import DataError, IntegrityError

from cemaris.burial_sites import (_date_string, _date_string_to_integer, _time_string,
    _time_period_string, _time_string_to_integer, _validate_values,
    get_burial_site_directions_of_arrival)
from cemaris.catalogs import (_catalog_error, _json_value, _number, get_catalog_records,
    get_contract_type_fields, get_contract_type_prints)
from cemaris.db.schema import TABLES
from cemaris.db.semantics import (_js_number_string, burial_site_name_predicates, contains_name_predicates,
    contract_time_predicates, date_parts_to_integer, date_to_integer, js_number,
    partial_date_integer_to_string, partial_date_integer_to_year,
    partial_date_integer_to_month, partial_date_integer_to_day, sanitize_limit, sanitize_offset)
from cemaris.preferences import get_setting_value, now_millis, transaction


class ContractOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    contract_number_length: int = 10
    contract_burial_site_id_is_required: bool = True
    contract_end_date_is_available: bool = True
    contract_end_date_is_required: bool = False
    address_labels: str = "de"


def _null_first(value):
    """SQLite ascending NULL order; Python strings preserve its UTF-8 BINARY order."""
    return value is not None, value


def _field_text(value):
    # node:sqlite binds a JavaScript Number as REAL. SQLite TEXT affinity uses
    # 15 significant digits and retains a decimal point for integral REALs.
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("Field value must be finite")
        if number == 0:
            return "0.0"
        mantissa, separator, exponent = format(number, ".15g").partition("e")
        if "." not in mantissa:
            mantissa += ".0"
        return mantissa + (separator + exponent if separator else "")
    if not isinstance(value, str):
        raise ValueError("Field value must be text or a number")
    return value


def _today(value=None):
    return date_to_integer(value if isinstance(value, date) else date.today()) if value is None or isinstance(value, date) else value


def _raw(connection, table_name, identifier, *, active=False):
    table = TABLES[table_name]
    key = "contractCommentId" if table_name == "ContractComments" else "contractId"
    predicates = [table.c[key] == _number(identifier, integer=True)]
    if active:
        predicates.append(table.c.recordDelete_timeMillis.is_(None))
    row = connection.execute(sa.select(table).where(*predicates)).mappings().first()
    return dict(row) if row is not None else None


def _audit(connection, identifier, actor, kind, before, after, table_name="Contracts", record_index=None):
    from cemaris.cemeteries import _differences
    differences = [("*", kind, before, after)] if kind != "updated" else _differences(before, after)
    now = datetime.now().astimezone()
    for field, update_type, old, new in differences:
        if field in {"recordCreate_username", "recordCreate_timeMillis", "recordUpdate_timeMillis"}:
            continue
        connection.execute(TABLES["AuditLog"].insert().values(
            logMillis=now_millis(), logDate=date_to_integer(now.date()), logTime=now.hour * 100 + now.minute,
            mainRecordType="contract", mainRecordId=str(identifier), updateTable=table_name,
            recordIndex=None if record_index is None else str(record_index), updateField=field,
            updateType=update_type, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":"))))


def get_next_contract_number(database, *, options=None, current_date=None):
    options = options if options is not None else ContractOptions()
    year = str(_today(current_date) // 10000)
    with transaction(database) as connection:
        table = TABLES["Contracts"]
        # Include deleted contracts; SQLite CAST saturates at signed int64.
        # Its Number increment is Binary64 even after Math.trunc, so large
        # configured numbers can remain unchanged when adding one rounds away.
        numbers = [number for number in connection.scalars(sa.select(table.c.contractNumber).order_by(table.c.contractId))
            if re.fullmatch(r"[0-9]+", number) and number.startswith(year) and len(number) == options.contract_number_length]
        if numbers:
            previous = max(numbers, key=lambda number: min(int(number), 2**63 - 1))
            incremented = float(math.trunc(float(previous))) + 1.0
            return _js_number_string(incremented).rjust(options.contract_number_length, "0")
        return year.ljust(max(0, options.contract_number_length - 1), "0") + "1"


_PARTICIPANT_TEXT = ("purchaserName", "purchaserAddress1", "purchaserAddress2", "purchaserCity", "purchaserProvince",
    "purchaserPostalCode", "purchaserPhoneNumber", "purchaserEmail", "purchaserRelationship", "funeralDirectorName", "directionOfArrival")


def _form_values(form):
    values = {key: form.get(key) or "" for key in _PARTICIPANT_TEXT}
    if any(not isinstance(value, str) for value in values.values()):
        raise ValueError("Participant fields must be text")
    values["purchaserPostalCode"] = values["purchaserPostalCode"].upper()
    for key in ("contractTypeId", "burialSiteId", "funeralHomeId", "committalTypeId"):
        values[key] = _number(form.get(key), integer=True)
    values["contractStartDate"] = _date_string_to_integer(form["contractStartDateString"])
    for key in ("contractEndDate", "funeralDate"):
        values[key] = None if form.get(key + "String") in (None, "") else _date_string_to_integer(form[key + "String"])
    values["funeralTime"] = None if form.get("funeralTimeString") in (None, "") else _time_string_to_integer(form["funeralTimeString"])
    _validate_values(TABLES["Contracts"], values)
    return values


def _field_values(connection, identifier):
    table = TABLES["ContractFields"]
    return [dict(row) for row in connection.execute(sa.select(table).where(table.c.contractId == identifier,
        table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.contractTypeFieldId)).mappings()]


def _update_fields(connection, identifier, form, actor, *, adding=False):
    table = TABLES["ContractFields"]
    for text_id in (form.get("contractTypeFieldIds") or "").split(","):
        field_id = _number(text_id, integer=True, empty=0)
        value = form.get(f"fieldValue_{text_id}")
        value = "" if value is None else value
        value = _field_text(value)
        where = (table.c.contractId == identifier, table.c.contractTypeFieldId == field_id)
        now = now_millis()
        if value == "":
            if not adding:
                connection.execute(table.update().where(*where).values(recordDelete_username=actor, recordDelete_timeMillis=now))
        else:
            result = connection.execute(table.update().where(*where).values(fieldValue=value, recordUpdate_username=actor,
                recordUpdate_timeMillis=now, recordDelete_username=None, recordDelete_timeMillis=None))
            if not result.rowcount:
                connection.execute(table.insert().values(contractId=identifier, contractTypeFieldId=field_id, fieldValue=value,
                    recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))


def _add_initial_interment(connection, identifier, form, actor, *, audit_enabled=False):
    """Create/copy participant only; independent interment CRUD is step 08."""
    table = TABLES["ContractInterments"]
    number = (connection.scalar(sa.select(sa.func.max(table.c.intermentNumber)).where(table.c.contractId == identifier)) or 0) + 1
    values = {key: form.get(key) or "" for key in ("deceasedName", "deceasedAddress1", "deceasedAddress2", "deceasedCity",
        "deceasedProvince", "deceasedPostalCode", "birthPlace", "deathPlace", "deathAgePeriod")}
    if any(not isinstance(value, str) for value in values.values()):
        raise ValueError("Deceased participant fields must be text")
    values["deceasedPostalCode"] = values["deceasedPostalCode"].upper()
    for prefix in ("birth", "death"):
        value = date_parts_to_integer(form.get(prefix + "Year", ""), form.get(prefix + "Month", ""), form.get(prefix + "Day", ""))
        if value is not None and (not math.isfinite(value) or value % 1):
            raise ValueError("Partial date cannot be represented as a SQL Server integer")
        values[prefix + "Date"] = int(value) if value is not None else None
    for key in ("deathAge", "intermentContainerTypeId", "intermentDepthId"):
        values[key] = _number(form.get(key), integer=True)
    _validate_values(table, values)
    now = now_millis()
    connection.execute(table.insert().values(contractId=identifier, intermentNumber=number, **values,
        recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
    if audit_enabled:
        after = dict(connection.execute(sa.select(table).where(table.c.contractId == identifier, table.c.intermentNumber == number)).mappings().one())
        _audit(connection, identifier, actor, "created", None, after, "ContractInterments", number)


def add_contract(database, form, actor, *, options=None, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        form = dict(form)
        if form.get("funeralHomeId") == "new":
            from cemaris.funeral_homes import add_funeral_home
            home = {key: form.get(key) or "" for key in ("funeralHomeName", "funeralHomeAddress1", "funeralHomeAddress2", "funeralHomeCity",
                "funeralHomePostalCode", "funeralHomeProvince", "funeralHomePhoneNumber")}
            form["funeralHomeId"] = add_funeral_home(connection, home, actor, audit_enabled=audit_enabled)
        values = _form_values(form)
        values["contractNumber"] = form.get("contractNumber") or get_next_contract_number(connection, options=options, current_date=current_date)
        _validate_values(TABLES["Contracts"], values)
        now = now_millis()
        identifier = connection.execute(TABLES["Contracts"].insert().values(**values, recordCreate_username=actor,
            recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now)).inserted_primary_key[0]
        _update_fields(connection, identifier, form, actor, adding=True)
        if form.get("deceasedName") not in (None, ""):
            _add_initial_interment(connection, identifier, form, actor, audit_enabled=audit_enabled)
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _raw(connection, "Contracts", identifier))
        return identifier


def update_contract(database, form, actor, *, options=None, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _number(form["contractId"], integer=True)
        before = _raw(connection, "Contracts", identifier, active=True)
        values = _form_values(form)
        result = connection.execute(TABLES["Contracts"].update().where(TABLES["Contracts"].c.contractId == identifier,
            TABLES["Contracts"].c.recordDelete_timeMillis.is_(None)).values(**values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount:
            fields_before = _field_values(connection, identifier)
            _update_fields(connection, identifier, form, actor)
            if audit_enabled:
                _audit(connection, identifier, actor, "updated", fields_before or None, _field_values(connection, identifier) or None, "ContractFields")
                _audit(connection, identifier, actor, "updated", before, _raw(connection, "Contracts", identifier))
        return bool(result.rowcount)


def delete_contract(database, identifier, actor, *, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        identifier = _number(identifier, integer=True)
        orders, links = TABLES["WorkOrders"], TABLES["WorkOrderContracts"]
        if connection.scalar(sa.select(orders.c.workOrderId).where(orders.c.recordDelete_timeMillis.is_(None),
            sa.or_(orders.c.workOrderCloseDate.is_(None), orders.c.workOrderCloseDate >= _today(current_date)),
            orders.c.workOrderId.in_(sa.select(links.c.workOrderId).where(links.c.contractId == identifier,
                links.c.recordDelete_timeMillis.is_(None)))).limit(1)) is not None:
            return False
        before = _raw(connection, "Contracts", identifier, active=True)
        now = now_millis()
        for name in ("Contracts", "ContractFields", "ContractComments"):
            table = TABLES[name]
            connection.execute(table.update().where(table.c.contractId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(
                recordDelete_username=actor, recordDelete_timeMillis=now))
        if audit_enabled:
            _audit(connection, identifier, actor, "deleted", before, None)
        return True


def get_contract_fields(database, identifier, contract_type_id=None):
    links, fields, types = (TABLES[name] for name in ("ContractFields", "ContractTypeFields", "ContractTypes"))
    with transaction(database) as connection:
        if contract_type_id is None:
            contract_type_id = connection.scalar(sa.select(TABLES["Contracts"].c.contractTypeId).where(TABLES["Contracts"].c.contractId == identifier))
        values = {row[0]: row[1] for row in connection.execute(sa.select(links.c.contractTypeFieldId, links.c.fieldValue).where(
            links.c.contractId == identifier, links.c.recordDelete_timeMillis.is_(None)))}
        query = sa.select(*(column for column in fields.c if not column.name.startswith("record") and column.name != "contractTypeId"),
            types.c.orderNumber.label("contractTypeOrderNumber")).select_from(fields.outerjoin(types, fields.c.contractTypeId == types.c.contractTypeId)).where(
            sa.or_(fields.c.contractTypeFieldId.in_(list(values)), sa.and_(fields.c.recordDelete_timeMillis.is_(None),
                sa.or_(fields.c.contractTypeId.is_(None), fields.c.contractTypeId == contract_type_id)))).order_by(
                    types.c.orderNumber, fields.c.orderNumber, fields.c.contractTypeField)
        rows = [{**dict(row), "contractId": identifier, "fieldValue": values.get(row["contractTypeFieldId"], "")} for row in connection.execute(query).mappings()]
        rows.sort(key=lambda row: (_null_first(row["contractTypeOrderNumber"]), row["orderNumber"], row["contractTypeField"]))
        return rows


def get_contract_comments(database, identifier):
    table = TABLES["ContractComments"]
    with transaction(database) as connection:
        rows = [dict(row) for row in connection.execute(sa.select(*(table.c[key] for key in ("contractCommentId", "commentDate", "commentTime",
            "comment", "recordCreate_username", "recordUpdate_username"))).where(table.c.contractId == identifier,
                table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.commentDate.desc(), table.c.commentTime.desc(), table.c.contractCommentId.desc())).mappings()]
        for row in rows:
            row.update(commentDateString=_date_string(row["commentDate"]), commentTimeString=_time_string(row["commentTime"]),
                commentTimePeriodString=_time_period_string(row["commentTime"]))
        return rows


def mutate_contract_comment(database, action, form, actor, *, audit_enabled=False):
    table = TABLES["ContractComments"]
    with transaction(database) as connection:
        now = now_millis()
        if action == "add":
            current = datetime.now().astimezone()
            values = dict(contractId=_number(form["contractId"], integer=True), comment=form["comment"],
                commentDate=date_to_integer(current.date()) if "commentDateString" not in form else _date_string_to_integer(form["commentDateString"]),
                commentTime=current.hour * 100 + current.minute if "commentDateString" not in form else
                    (0 if form.get("commentTimeString") in (None, "") else _time_string_to_integer(form["commentTimeString"])),
                recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now)
            _validate_values(table, values)
            identifier = connection.execute(table.insert().values(**values)).inserted_primary_key[0]
            if audit_enabled:
                _audit(connection, values["contractId"], actor, "created", None, _raw(connection, "ContractComments", identifier), "ContractComments", identifier)
            return identifier
        identifier = _number(form["contractCommentId"], integer=True)
        before = _raw(connection, "ContractComments", identifier, active=True)
        if before is None:
            return False
        if action == "update":
            values = dict(comment=form["comment"], commentDate=_date_string_to_integer(form["commentDateString"]),
                commentTime=_time_string_to_integer(form["commentTimeString"]), recordUpdate_username=actor, recordUpdate_timeMillis=now)
        elif action == "delete":
            values = dict(recordDelete_username=actor, recordDelete_timeMillis=now)
        else:
            raise ValueError("Unknown contract comment action")
        _validate_values(table, values)
        connection.execute(table.update().where(table.c.contractCommentId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(**values))
        if audit_enabled:
            _audit(connection, before["contractId"], actor, "updated" if action == "update" else "deleted", before,
                _raw(connection, "ContractComments", identifier) if action == "update" else None, "ContractComments", identifier)
        return True


def mutate_related_contract(database, action, form):
    table = TABLES["RelatedContracts"]
    if action == "add":
        values = (js_number(form["contractId"]), js_number(form["relatedContractId"]))
        if not all(math.isfinite(value) for value in values):
            raise ValueError("Expected finite contract identifiers")
        identifier, related = sorted(math.trunc(value) for value in values)
    else:
        identifier, related = sorted((_number(form["contractId"]), _number(form["relatedContractId"])))
    with transaction(database) as connection:
        if action == "add":
            connection.execute(table.insert().values(contractIdA=identifier, contractIdB=related))
        elif action == "delete":
            connection.execute(table.delete().where(table.c.contractIdA == identifier, table.c.contractIdB == related))
        else:
            raise ValueError("Unknown related contract action")
        return True


def _join_contracts():
    c, b, cem, types, homes, committals, burial_types = (TABLES[name] for name in ("Contracts", "BurialSites", "Cemeteries",
        "ContractTypes", "FuneralHomes", "CommittalTypes", "BurialSiteTypes"))
    joined = c.outerjoin(b, c.c.burialSiteId == b.c.burialSiteId).outerjoin(cem, b.c.cemeteryId == cem.c.cemeteryId).outerjoin(
        types, c.c.contractTypeId == types.c.contractTypeId).outerjoin(homes, c.c.funeralHomeId == homes.c.funeralHomeId).outerjoin(
        committals, c.c.committalTypeId == committals.c.committalTypeId).outerjoin(burial_types, b.c.burialSiteTypeId == burial_types.c.burialSiteTypeId)
    columns = [*(column for column in c.c if not column.name.startswith("recordDelete")), types.c.contractType, types.c.isPreneed,
        b.c.burialSiteName, b.c.burialSiteTypeId, burial_types.c.burialSiteType, b.c.cemeteryId, cem.c.cemeteryName,
        sa.case((b.c.recordDelete_timeMillis.is_(None), 1), else_=0).label("burialSiteIsActive"), committals.c.committalType,
        *(homes.c[key] for key in ("funeralHomeKey", "funeralHomeName", "funeralHomeAddress1", "funeralHomeAddress2",
            "funeralHomeCity", "funeralHomeProvince", "funeralHomePostalCode")),
        sa.case((homes.c.recordDelete_timeMillis.is_(None), 1), else_=0).label("funeralHomeIsActive")]
    return c, b, cem, joined, columns


def _filters(filters, today):
    c, b, cem = TABLES["Contracts"], TABLES["BurialSites"], TABLES["Cemeteries"]
    where = [c.c.recordDelete_timeMillis.is_(None)]
    if filters.get("contractNumber") not in (None, ""):
        # Source LIKE permits %/_; contains-name helper would treat them literally.
        where.extend(burial_site_name_predicates(c.c.contractNumber, "%" + filters["contractNumber"].strip() + "%", "startsWith"))
    where.extend(burial_site_name_predicates(b.c.burialSiteName, filters.get("burialSiteName") or "", filters.get("burialSiteNameSearchType") or ""))
    where.extend(contains_name_predicates(c.c.purchaserName, filters.get("purchaserName") or ""))
    for key in ("burialSiteId", "contractTypeId", "funeralHomeId"):
        if filters.get(key) not in (None, ""):
            where.append(c.c[key] == _number(filters[key], integer=True))
    if filters.get("burialSiteTypeId") not in (None, ""):
        where.append(b.c.burialSiteTypeId == _number(filters["burialSiteTypeId"], integer=True))
    if filters.get("cemeteryId") not in (None, ""):
        identifier = _number(filters["cemeteryId"], integer=True)
        where.append(sa.or_(cem.c.cemeteryId == identifier, cem.c.parentCemeteryId == identifier))
    where.extend(contract_time_predicates(c.c.contractStartDate, c.c.contractEndDate, filters.get("contractTime"), today))
    if filters.get("contractStartDateString") not in (None, ""):
        where.append(c.c.contractStartDate == _date_string_to_integer(filters["contractStartDateString"]))
    if filters.get("contractEffectiveDateString") not in (None, ""):
        effective = _date_string_to_integer(filters["contractEffectiveDateString"])
        where.append(sa.or_(c.c.contractEndDate.is_(None), sa.and_(c.c.contractStartDate <= effective, c.c.contractEndDate >= effective)))
    if filters.get("funeralTime") == "upcoming":
        where.append(c.c.funeralDate >= today)
    if filters.get("deceasedName") not in (None, ""):
        interments = TABLES["ContractInterments"]
        terms = contains_name_predicates(interments.c.deceasedName, filters["deceasedName"])
        if terms:
            where.append(c.c.contractId.in_(sa.select(interments.c.contractId).where(interments.c.recordDelete_timeMillis.is_(None), *terms)))
    if filters.get("serviceTypeId") not in (None, ""):
        services = TABLES["ContractServiceTypes"]
        where.append(sa.exists(sa.select(1).where(services.c.contractId == c.c.contractId,
            services.c.serviceTypeId == _number(filters["serviceTypeId"], integer=True), services.c.recordDelete_timeMillis.is_(None))))
    for key in ("workOrderId", "notWorkOrderId"):
        if filters.get(key) not in (None, ""):
            links = TABLES["WorkOrderContracts"]
            term = c.c.contractId.in_(sa.select(links.c.contractId).where(links.c.workOrderId == _number(filters[key], integer=True), links.c.recordDelete_timeMillis.is_(None)))
            where.append(~term if key.startswith("not") else term)
    if filters.get("notContractId") not in (None, ""):
        where.append(c.c.contractId != _number(filters["notContractId"], integer=True))
    for key in ("relatedContractId", "notRelatedContractId"):
        if filters.get(key) not in (None, ""):
            links = TABLES["RelatedContracts"]
            identifier = _number(filters[key], integer=True)
            left = c.c.contractId.in_(sa.select(links.c.contractIdA).where(links.c.contractIdB == identifier))
            right = c.c.contractId.in_(sa.select(links.c.contractIdB).where(links.c.contractIdA == identifier))
            where.append(sa.and_(~left, ~right) if key.startswith("not") else sa.or_(left, right))
    return where


def _format_contract(record, today):
    record.update(contractStartDateString=_date_string(record["contractStartDate"]), contractEndDateString=_date_string(record["contractEndDate"]),
        funeralDateString=_date_string(record["funeralDate"]), funeralTimeString=_time_string(record["funeralTime"]),
        funeralTimePeriodString=_time_period_string(record["funeralTime"]),
        contractIsActive=record["contractEndDate"] is None or record["contractEndDate"] > today,
        contractIsFuture=record["contractStartDate"] > today)
    return record


def get_contract_interments(database, identifier):
    i, types, depths, contracts, sites, cem = (TABLES[name] for name in ("ContractInterments", "IntermentContainerTypes",
        "IntermentDepths", "Contracts", "BurialSites", "Cemeteries"))
    joined = i.outerjoin(types, i.c.intermentContainerTypeId == types.c.intermentContainerTypeId).outerjoin(depths, i.c.intermentDepthId == depths.c.intermentDepthId).outerjoin(
        contracts, i.c.contractId == contracts.c.contractId).outerjoin(sites, contracts.c.burialSiteId == sites.c.burialSiteId).outerjoin(cem, sites.c.cemeteryId == cem.c.cemeteryId)
    with transaction(database) as connection:
        rows = [dict(row) for row in connection.execute(sa.select(*(column for column in i.c if not column.name.startswith("record") and column.name != "isCremated"),
            types.c.intermentContainerType, types.c.isCremationType, depths.c.intermentDepth,
            types.c.orderNumber.label("_containerOrder")).select_from(joined).where(
                i.c.contractId == identifier, i.c.recordDelete_timeMillis.is_(None))).mappings()]
        rows.sort(key=lambda row: (_null_first(row["_containerOrder"]), row["deceasedName"], row["intermentNumber"]))
        for row in rows:
            row.pop("_containerOrder")
            row.update(birthDateString=partial_date_integer_to_string(row["birthDate"]), deathDateString=partial_date_integer_to_string(row["deathDate"]))
        return rows


def _children(connection, identifier, kind):
    """Read pre-existing later-step data without exposing later-step mutations."""
    if kind == "services":
        links, types = TABLES["ContractServiceTypes"], TABLES["ServiceTypes"]
        rows = [dict(row) for row in connection.execute(sa.select(types.c.serviceTypeId, types.c.serviceType, links.c.contractServiceDetails,
            types.c.orderNumber.label("_serviceOrder")).select_from(
            links.join(types, links.c.serviceTypeId == types.c.serviceTypeId)).where(links.c.contractId == identifier,
                links.c.recordDelete_timeMillis.is_(None), types.c.recordDelete_timeMillis.is_(None))).mappings()]
        rows.sort(key=lambda row: (row["_serviceOrder"], row["serviceType"]))
        for row in rows:
            row.pop("_serviceOrder")
        return rows
    if kind == "fees":
        links, fees, cats = TABLES["ContractFees"], TABLES["Fees"], TABLES["FeeCategories"]
        return [dict(row) for row in connection.execute(sa.select(links.c.contractId, links.c.feeId, cats.c.feeCategory, fees.c.feeName, fees.c.includeQuantity,
            links.c.feeAmount, links.c.taxAmount, links.c.quantity, fees.c.quantityUnit).select_from(links.outerjoin(fees, links.c.feeId == fees.c.feeId).outerjoin(
                cats, fees.c.feeCategoryId == cats.c.feeCategoryId)).where(links.c.contractId == identifier, links.c.recordDelete_timeMillis.is_(None)).order_by(links.c.recordCreate_timeMillis)).mappings()]
    name, fields, order = {
        "transactions": ("ContractTransactions", ("contractId", "transactionIndex", "transactionDate", "transactionTime", "transactionAmount", "externalReceiptNumber", "isInvoiced", "transactionNote"), ("transactionDate", "transactionTime", "transactionIndex")),
        "attachments": ("ContractAttachments", ("contractAttachmentId", "attachmentTitle", "attachmentDetails", "fileName", "recordCreate_timeMillis"), ("contractAttachmentId",)),
    }[kind]
    table = TABLES[name]
    rows = [dict(row) for row in connection.execute(sa.select(*(table.c[field] for field in fields)).where(table.c.contractId == identifier,
        table.c.recordDelete_timeMillis.is_(None)).order_by(*(table.c[field] for field in order))).mappings()]
    if kind == "transactions":
        for row in rows:
            row.update(transactionDateString=_date_string(row["transactionDate"]), transactionTimeString=_time_string(row["transactionTime"]))
    return rows


def get_contracts(database, filters=None, *, limit=50, offset=0, current_date=None, include_interments=True,
        include_service_types=True, include_fees=True, include_transactions=True, catalog_options=None, order_by=None):
    filters = filters or {}
    today = _today(current_date)
    c, b, cem, joined, columns = _join_contracts()
    where = _filters(filters, today)
    unlimited = limit == -1  # Source treats string '-1' as a limited request.
    normalized_limit, normalized_offset = sanitize_limit(limit), sanitize_offset(offset)
    if not math.isfinite(normalized_limit) or not math.isfinite(normalized_offset) or max(normalized_limit, normalized_offset) > 2**63 - 1:
        raise ValueError("Invalid contract pagination")
    with transaction(database) as connection:
        count = connection.scalar(sa.select(sa.func.count()).select_from(joined).where(*where))
        funeral_order = order_by in {"funeral", "c.funeralDate, c.funeralTime, c.contractId"}
        if funeral_order:
            query = sa.select(*columns).select_from(joined).where(*where).order_by(c.c.funeralDate, c.c.funeralTime, c.c.contractId)
            if not unlimited:
                query = query.limit(normalized_limit).offset(normalized_offset)
            records = [dict(row) for row in connection.execute(query).mappings()]
        else:
            # SQL Server pads text comparisons and its UTF-16 BIN2 ordering
            # differs from SQLite's UTF-8 BINARY ordering. Sort matching raw
            # rows before paging; fetch child inclusions only for the page.
            segments = [f"_segment{index}" for index in range(1, 6)]
            query = sa.select(*columns, *(b.c[f"burialSiteNameSegment{index}"].label(f"_segment{index}") for index in range(1, 6))).select_from(joined).where(*where)
            records = [dict(row) for row in connection.execute(query).mappings()]
            records.sort(key=lambda row: (-row["contractStartDate"], -(row["contractEndDate"] if row["contractEndDate"] is not None else 99999999),
                *(_null_first(row[key]) for key in segments), _null_first(row["burialSiteId"]), -row["contractId"]))
            if not unlimited:
                records = records[normalized_offset:normalized_offset + normalized_limit]
            for record in records:
                for key in segments:
                    record.pop(key)
        records = [_format_contract(record, today) for record in records]
        for record in records:
            identifier = record["contractId"]
            if catalog_options is not None:
                prints = get_contract_type_prints(connection, record["contractTypeId"], options=catalog_options)
                if prints:
                    record["printEJS"] = catalog_options.contract_prints[0] if "*" in prints and catalog_options.contract_prints else prints[0]
            if include_interments:
                record["contractInterments"] = get_contract_interments(connection, identifier)
            for enabled, key, kind in ((include_service_types, "contractServiceTypes", "services"), (include_fees, "contractFees", "fees"),
                (include_transactions, "contractTransactions", "transactions")):
                if enabled:
                    record[key] = _children(connection, identifier, kind)
        return {"contracts": records, "count": len(records) if unlimited else count, "offset": normalized_offset, "limit": -1 if unlimited else normalized_limit}


search_contracts = get_contracts


def get_contract_metadata(database, filters=None):
    """Shared metadata storage; integration consumers are steps 13 and 14."""
    filters = filters or {}
    table = TABLES["ContractMetadata"]
    where = [table.c.recordDelete_timeMillis.is_(None)]
    if "contractId" in filters:
        where.append(table.c.contractId == _number(filters["contractId"], integer=True))
    if filters.get("startsWith") not in (None, ""):
        where.extend(burial_site_name_predicates(table.c.metadataKey, filters["startsWith"], "startsWith"))
    with transaction(database) as connection:
        return [dict(row) for row in connection.execute(sa.select(table.c.contractId, table.c.metadataKey,
            table.c.metadataValue, table.c.recordUpdate_timeMillis).where(*where)).mappings()]


def get_contract_metadata_by_contract_id(database, identifier, starts_with=""):
    rows = get_contract_metadata(database, {"contractId": identifier, "startsWith": starts_with})
    return {row["metadataKey"]: row["metadataValue"] for row in sorted(rows, key=lambda row: row["metadataKey"])}


def update_contract_metadata(database, identifier, metadata, actor):
    table = TABLES["ContractMetadata"]
    now = now_millis()
    values = {"metadataKey": metadata["metadataKey"], "metadataValue": metadata["metadataValue"]}
    _validate_values(table, values)
    with transaction(database) as connection:
        result = connection.execute(table.update().where(table.c.contractId == _number(identifier, integer=True),
            table.c.metadataKey == metadata["metadataKey"]).values(metadataValue=metadata["metadataValue"], recordUpdate_username=actor,
                recordUpdate_timeMillis=now, recordDelete_username=None, recordDelete_timeMillis=None))
        if not result.rowcount:
            connection.execute(table.insert().values(contractId=_number(identifier, integer=True), **values,
                recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        return True


def delete_contract_metadata(database, identifier, metadata_key, actor):
    table = TABLES["ContractMetadata"]
    with transaction(database) as connection:
        connection.execute(table.update().where(table.c.contractId == _number(identifier, integer=True), table.c.metadataKey == metadata_key).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        return True


def get_contract(database, identifier, *, current_date=None, catalog_options=None):
    with transaction(database) as connection:
        c, b, cem, joined, columns = _join_contracts()
        row = connection.execute(sa.select(*columns).select_from(joined).where(c.c.contractId == _number(identifier, integer=True),
            c.c.recordDelete_timeMillis.is_(None))).mappings().first()
        if row is None:
            return None
        record = _format_contract(dict(row), _today(current_date))
        directions = TABLES["CemeteryDirectionsOfArrival"]
        record["directionOfArrivalDescription"] = connection.scalar(sa.select(directions.c.directionOfArrivalDescription).where(
            directions.c.cemeteryId == record["cemeteryId"], directions.c.directionOfArrival == record["directionOfArrival"]))
        record.update(contractFields=get_contract_fields(connection, identifier, record["contractTypeId"]),
            contractInterments=get_contract_interments(connection, identifier), contractComments=get_contract_comments(connection, identifier),
            contractServiceTypes=_children(connection, identifier, "services"), contractFees=_children(connection, identifier, "fees"),
            contractTransactions=_children(connection, identifier, "transactions"), contractAttachments=_children(connection, identifier, "attachments"),
            relatedContracts=get_contracts(connection, {"relatedContractId": identifier}, limit=-1, current_date=current_date,
                include_fees=False, include_transactions=False, include_service_types=False, catalog_options=catalog_options)["contracts"])
        from cemaris.work_orders import get_work_orders
        record["workOrders"] = get_work_orders(connection, {"contractId": identifier}, limit=-1,
            include_burial_sites=False, include_milestones=True, current_date=current_date)["workOrders"]
        return record


def get_adjacent_contract_id(database, identifier, *, previous=False):
    table = TABLES["Contracts"]
    with transaction(database) as connection:
        value = connection.scalar(sa.select(table.c.contractNumber).where(table.c.contractId == _number(identifier, integer=True)))
        if value is None:
            return None
        # SQL Server text comparisons pad trailing spaces, including BIN2.
        # Compare the raw strings to preserve SQLite BINARY ordering, including
        # supplementary Unicode characters and strict duplicate-number skips.
        rows = connection.execute(sa.select(table.c.contractNumber, table.c.contractId).where(
            table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.contractId))
        candidates = [(row.contractNumber, row.contractId) for row in rows
            if (row.contractNumber < value if previous else row.contractNumber > value)]
        if not candidates:
            return None
        adjacent = (max if previous else min)(candidates, key=lambda item: item[0])
        return adjacent[1]


def copy_contract(database, identifier, actor, *, options=None, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        old = get_contract(connection, identifier, current_date=current_date)
        if old is None:
            raise ValueError("Contract not found")
        form = {key: old[key] for key in (*_PARTICIPANT_TEXT, "burialSiteId", "contractTypeId", "funeralHomeId", "funeralDateString", "funeralTimeString")
            if key != "directionOfArrival"}
        form.update(contractStartDateString=_date_string(_today(current_date)), contractEndDateString="")
        new_id = add_contract(connection, form, actor, options=options, audit_enabled=audit_enabled, current_date=current_date)
        fields = TABLES["ContractFields"]
        now = now_millis()
        for field in old["contractFields"]:
            connection.execute(fields.insert().values(contractId=new_id, contractTypeFieldId=field["contractTypeFieldId"], fieldValue=field["fieldValue"] or "",
                recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        for interment in old["contractInterments"]:
            copied = {key: interment[key] for key in ("deceasedName", "deceasedAddress1", "deceasedAddress2", "deceasedCity", "deceasedProvince", "deceasedPostalCode",
                "birthPlace", "deathPlace", "deathAge", "deathAgePeriod", "intermentContainerTypeId")}
            for prefix in ("birth", "death"):
                value = interment[prefix + "Date"]
                copied.update({prefix + "Year": partial_date_integer_to_year(value) or "", prefix + "Month": partial_date_integer_to_month(value) or "",
                    prefix + "Day": partial_date_integer_to_day(value) or ""})
            _add_initial_interment(connection, new_id, copied, actor, audit_enabled=audit_enabled)
        mutate_related_contract(connection, "add", {"contractId": new_id, "relatedContractId": identifier})
        mutate_contract_comment(connection, "add", {"contractId": new_id, "comment": f"Neuer Datensatz aus Vertrag #{identifier} kopiert."}, actor, audit_enabled=audit_enabled)
        return new_id


def _options(connection, app, *, language="de"):
    from cemaris.cemeteries import get_cemeteries
    from cemaris.funeral_homes import get_funeral_homes
    options = app.state.contract_options
    return {**{resource: get_catalog_records(connection, resource) for resource in ("contractTypes", "committalTypes", "intermentContainerTypes",
        "intermentDepths", "burialSiteStatuses", "burialSiteTypes", "serviceTypes")}, "cemeteries": get_cemeteries(connection),
        "funeralHomes": get_funeral_homes(connection, include_upcoming_funeral_count=False), "burialSiteIdIsRequired": options.contract_burial_site_id_is_required,
        "contractNumberLength": options.contract_number_length, "contractEndDateIsAvailable": options.contract_end_date_is_available,
        "contractEndDateIsRequired": options.contract_end_date_is_required, "addressLabels": options.address_labels,
        "externalReceiptNumberAlias": get_setting_value(connection, "aliases.externalReceiptNumber"),
        "workOrderAliases": {name: get_setting_value(connection, "aliases." + name)
            for name in ("workOrderOpenDate", "workOrderCloseDate")},
        "auditLogEnabled": app.state.preference_options.audit_log_enabled, "deathAgePeriods": ["Years", "Months", "Days", "Stillborn"],
        # helpers/dataLists.ts, @cityssm/cemetery-utils 0.3.0 (MIT), fixed lockfile.
        "purchaserRelationships": ["Selbst", "Partner/in", "Lebensgefährte", "Lebensgefährtin", "Ehepartner/in", "Ehemann", "Ehefrau", "Geschwister", "Bruder", "Schwester",
            "Elternteil", "Vater", "Mutter", "Kind", "Sohn", "Tochter", "Großelternteil", "Großvater", "Großmutter", "Enkelkind", "Enkel",
            "Enkelin", "Onkel", "Tante", "Neffe", "Nichte", "Cousin/Cousine", "Freund/in"] if language == "de" else
            ["Self", "Partner", "Boyfriend", "Girlfriend", "Spouse", "Husband", "Wife", "Sibling", "Brother", "Sister",
            "Parent", "Father", "Mother", "Child", "Son", "Daughter", "Grandparent", "Grandfather", "Grandmother", "Grandchild", "Grandson",
            "Granddaughter", "Uncle", "Aunt", "Nephew", "Niece", "Cousin", "Friend"]}


def install_contracts(app, *, options=None):
    from cemaris.auth import current_user, detect_language, require_update_contracts
    from cemaris.dependencies import get_engine
    app.state.contract_options = options if options is not None else ContractOptions()
    router = APIRouter(prefix="/api/contracts", tags=["contracts"])

    @router.get("/meta")
    @router.get("/options")
    def meta(request: Request, user=Depends(current_user)):
        with get_engine(request).begin() as connection:
            return {"options": _options(connection, request.app, language=detect_language(request)), "canUpdate": user.get("userProperties", {}).get("canUpdateContracts", False)}

    @router.get("/new")
    def new(request: Request, burialSiteId: int | None = None, user=Depends(require_update_contracts)):
        with get_engine(request).begin() as connection:
            city, province = (get_setting_value(connection, "defaults." + key) for key in ("city", "province"))
            record = {"isPreneed": False, "contractStartDate": _today(), "contractStartDateString": _date_string(_today()),
                "purchaserCity": city, "purchaserProvince": province, "deceasedCity": city, "deceasedProvince": province}
            if burialSiteId is not None:
                from cemaris.burial_sites import get_burial_site
                site = get_burial_site(connection, burialSiteId)
                if site is not None:
                    record.update({key: site.get(key) for key in ("burialSiteId", "burialSiteName", "cemeteryId", "cemeteryName")})
            return {"contract": record, "options": _options(connection, request.app, language=detect_language(request)), "canUpdate": True,
                "burialSiteDirectionsOfArrival": get_burial_site_directions_of_arrival(connection, record.get("burialSiteId")), "funeralDirectorNames": []}

    def search_result(request, form):
        try:
            result = get_contracts(get_engine(request), form, limit=form.get("limit", 50), offset=form.get("offset", 0), catalog_options=request.app.state.catalog_options)
            offset_number = js_number(form.get("offset", 0))
            return {**result, "offset": math.trunc(offset_number) if math.isfinite(offset_number) else None}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_contract_search", str(error))

    @router.get("")
    def search_get(request: Request, user=Depends(current_user)):
        return search_result(request, dict(request.query_params))

    @router.post("/search")
    @router.post("/doSearchContracts")
    def search(request: Request, form: dict[str, Any] = Body(...), user=Depends(current_user)):
        return search_result(request, form)

    def mutate(action, request, form, user):
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                identifier = _number(form.get("contractId"), integer=True)
                if action == "create":
                    return {"success": True, "contractId": add_contract(connection, form, user["username"], options=request.app.state.contract_options, **kwargs)}
                if action == "copy":
                    return {"success": True, "contractId": copy_contract(connection, identifier, user["username"], options=request.app.state.contract_options, **kwargs)}
                if action == "update":
                    success = update_contract(connection, form, user["username"], **kwargs)
                elif action == "delete":
                    success = delete_contract(connection, identifier, user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "contract_active_work_order", "Note that contracts with active work orders cannot be deleted.")
                elif action in {"add-comment", "update-comment", "delete-comment"}:
                    success = mutate_contract_comment(connection, action.removesuffix("-comment"), form, user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "contract_comment_not_found", "Comment not found")
                    return {"success": True, "contractComments": get_contract_comments(connection, identifier)}
                elif action in {"add-related", "delete-related"}:
                    mutate_related_contract(connection, action.removesuffix("-related"), form)
                    return {"success": True, "relatedContracts": get_contracts(connection, {"relatedContractId": identifier}, limit=-1,
                        include_fees=False, include_transactions=False, include_service_types=False)["contracts"]}
                else:
                    raise ValueError("Unknown contract action")
                if not success:
                    return _catalog_error(request, 400, "contract_not_found", "Failed to update contract")
                return {"success": True, "contractId": identifier}
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_contract_value", "Missing contract field" if isinstance(error, KeyError) else str(error))
        except (IntegrityError, DataError):
            return _catalog_error(request, 400, "contract_constraint", "The contract value violates a database reference or constraint")

    def endpoint(action):
        def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
            return mutate(action, request, form, user)
        return handler

    for path, action in (("doCreateContract", "create"), ("doUpdateContract", "update"), ("doDeleteContract", "delete"), ("doCopyContract", "copy"),
        ("doAddContractComment", "add-comment"), ("doUpdateContractComment", "update-comment"), ("doDeleteContractComment", "delete-comment"),
        ("doAddRelatedContract", "add-related"), ("doDeleteRelatedContract", "delete-related")):
        router.add_api_route("/" + path, endpoint(action), methods=["POST"], name=path)
    router.add_api_route("", endpoint("create"), methods=["POST"], name="createContract")

    @router.post("/doGetContractTypeFields")
    def fields(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        try:
            return {"contractTypeFields": get_contract_type_fields(get_engine(request), _number(form.get("contractTypeId"), integer=True))}
        except ValueError as error:
            return _catalog_error(request, 400, "invalid_contract_type", str(error))

    @router.post("/doGetBurialSiteDirectionsOfArrival")
    def directions(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        value = get_burial_site_directions_of_arrival(get_engine(request), form.get("burialSiteId"))
        return {"burialSiteDirectionsOfArrival": value, "directionsOfArrival": value}

    @router.post("/doGetFuneralDirectors")
    def directors(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        from cemaris.funeral_homes import get_funeral_directors
        if form.get("funeralHomeId") in (None, "", "new"):
            return {"funeralDirectorNames": []}
        try:
            return {"funeralDirectorNames": get_funeral_directors(get_engine(request), form.get("funeralHomeId"))}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_funeral_home", str(error))

    @router.post("/doGetPossibleRelatedContracts")
    def possible_related(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        return search_result(request, form)

    @router.post("/doGetRecordAuditLog")
    def audit(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        from cemaris.places_audit import get_place_audit_log
        if not request.app.state.preference_options.audit_log_enabled:
            raise HTTPException(404, "Audit logging is disabled")
        if form.get("mainRecordType") != "contract":
            raise HTTPException(403, "Forbidden")
        try:
            limit, offset = js_number(form.get("limit", 50)), js_number(form.get("offset", 0))
            if not math.isfinite(limit) or not math.isfinite(offset) or max(abs(limit), abs(offset)) > 2**63 - 1:
                raise ValueError("Invalid audit pagination")
            with get_engine(request).connect() as connection:
                return {"success": True, **get_place_audit_log(connection, "contract", form.get("mainRecordId", ""), limit=math.trunc(limit), offset=math.trunc(offset)), "offset": math.trunc(offset)}
        except (ValueError, TypeError, OverflowError):
            raise HTTPException(400, "Invalid audit pagination") from None

    def path_endpoint(action):
        def handler(contract_id: int, request: Request, form: dict = Body(default={}), user=Depends(require_update_contracts)):
            return mutate(action, request, {**form, "contractId": contract_id}, user)
        return handler
    for action in ("update", "delete", "copy"):
        router.add_api_route("/{contract_id}/" + action, path_endpoint(action), methods=["POST"], name=action + "Contract")

    @router.get("/{contract_id}/next")
    def next_record(contract_id: int, request: Request, user=Depends(current_user)):
        return {"contractId": get_adjacent_contract_id(get_engine(request), contract_id)}

    @router.get("/{contract_id}/previous")
    def previous_record(contract_id: int, request: Request, user=Depends(current_user)):
        return {"contractId": get_adjacent_contract_id(get_engine(request), contract_id, previous=True)}

    @router.get("/{contract_id}")
    def detail(contract_id: int, request: Request, user=Depends(current_user)):
        from cemaris.funeral_homes import get_funeral_directors
        with get_engine(request).begin() as connection:
            record = get_contract(connection, contract_id, catalog_options=request.app.state.catalog_options)
            if record is None:
                return _catalog_error(request, 404, "contract_not_found", "Contract not found")
            return {"contract": record, "options": _options(connection, request.app, language=detect_language(request)), "canUpdate": user.get("userProperties", {}).get("canUpdateContracts", False),
                "burialSiteDirectionsOfArrival": get_burial_site_directions_of_arrival(connection, record["burialSiteId"]),
                "funeralDirectorNames": get_funeral_directors(connection, record["funeralHomeId"]) if record["funeralHomeId"] is not None else [],
                "nextContractId": get_adjacent_contract_id(connection, contract_id), "previousContractId": get_adjacent_contract_id(connection, contract_id, previous=True)}

    app.include_router(router)
