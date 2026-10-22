"""Burial sites, ported from Sunrise CMS (MIT), fixed commit 451ce034863b16502484367044f3e9b65370111a.

Source: routes/burialSites.ts, database/*BurialSite*.ts and associated handlers.
See licenses/Sunrise-LICENSE.md. Geographic tools are in geography.py.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
import json
import math
from pathlib import Path
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
from pydantic import Field, PrivateAttr
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from cemaris.catalogs import _catalog_error, _json_value, _number, get_catalog_records, get_contract_type_prints
from cemaris.db.schema import TABLES
from cemaris.db.semantics import burial_site_name_predicates, date_to_integer, js_number, partial_date_integer_to_string, sanitize_limit, sanitize_offset
from cemaris.preferences import get_setting_value, now_millis, transaction


class BurialSiteOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    burial_site_name_segments: dict[str, Any] = Field(default_factory=lambda: {
        "includeCemeteryKey": False, "separator": "-", "segments": {
            "1": {"isAvailable": True, "isRequired": True, "label": "Grabnummer", "minLength": 1, "maxLength": 20},
        },
    })
    customizations_path: Path = Path(".")
    burial_site_refresh_image_changes: bool = False
    cemetery_refresh_image_changes: bool = False
    _image_catalog: dict[str, list[str]] = PrivateAttr(default_factory=dict)
    latitude_min: float = -90
    latitude_max: float = 90
    longitude_min: float = -180
    longitude_max: float = 180
    address_labels: str = "de"
    contract_end_date_is_available: bool = True


class BurialSiteSourceError(ValueError):
    """Source guard or a relational constraint that prevents the source operation."""


def build_burial_site_name(cemetery_key, segments: dict, options=None) -> str:
    config = (options if options is not None else BurialSiteOptions()).burial_site_name_segments
    pieces = []
    if cemetery_key is not None and config.get("includeCemeteryKey", False):
        pieces.append(cemetery_key)
    for index in range(1, 6):
        segment_config = config.get("segments", {}).get(str(index), {})
        value = segments.get(f"burialSiteNameSegment{index}") or ""
        if segment_config.get("isAvailable", False) and (segment_config.get("isRequired", False) or value != ""):
            pieces.append((segment_config.get("prefix") or "") + value + (segment_config.get("suffix") or ""))
    return (config.get("separator") if config.get("separator") is not None else "-").join(pieces)


def _raw(connection, table_name, identifier, *, include_deleted=True):
    table = TABLES[table_name]
    key = {"BurialSites": "burialSiteId", "BurialSiteComments": "burialSiteCommentId"}[table_name]
    query = sa.select(table).where(table.c[key] == _number(identifier, integer=True))
    if not include_deleted:
        query = query.where(table.c.recordDelete_timeMillis.is_(None))
    value = connection.execute(query).mappings().first()
    return dict(value) if value is not None else None


def _audit(connection, record_id, actor, kind, before, after, table_name="BurialSites", record_index=None):
    from cemaris.cemeteries import _differences
    differences = [("*", kind, before, after)] if kind != "updated" else _differences(before, after)
    for field, update_type, old, new in differences:
        if field in {"recordCreate_timeMillis", "recordCreate_username", "recordUpdate_timeMillis"}:
            continue
        now = datetime.now().astimezone()
        connection.execute(TABLES["AuditLog"].insert().values(
            logMillis=now_millis(), logDate=date_to_integer(now.date()), logTime=now.hour * 100 + now.minute,
            mainRecordType="burialSite", mainRecordId=str(record_id), updateTable=table_name,
            recordIndex=None if record_index is None else str(record_index), updateField=field,
            updateType=update_type, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":")),
        ))


def _validate_values(table, values):
    for key, value in values.items():
        column = table.c[key]
        if value is None and not column.nullable:
            raise ValueError(f"{key} is required")
        if isinstance(value, str) and getattr(column.type, "length", None) and len(value.encode("utf-16-le")) // 2 > column.type.length:
            raise ValueError(f"{key} exceeds {column.type.length} UTF-16 units")
        if isinstance(column.type, sa.SmallInteger) and value is not None and not -32768 <= value <= 32767:
            raise ValueError(f"{key} exceeds SQL Server smallint range")


def _form_values(connection, form, options):
    values = {f"burialSiteNameSegment{index}": form.get(f"burialSiteNameSegment{index}") or "" for index in range(1, 6)}
    for key in ("burialSiteTypeId", "burialSiteStatusId", "cemeteryId", "bodyCapacity", "crematedCapacity"):
        values[key] = _number(form.get(key), integer=True)
    for key in ("burialSiteLatitude", "burialSiteLongitude"):
        values[key] = _number(form.get(key))
    values.update(cemeterySvgId=form.get("cemeterySvgId"), burialSiteImage=form.get("burialSiteImage") or "")
    cem = TABLES["Cemeteries"]
    cemetery_key = connection.scalar(sa.select(cem.c.cemeteryKey).where(cem.c.cemeteryId == values["cemeteryId"], cem.c.recordDelete_timeMillis.is_(None)))
    values["burialSiteName"] = build_burial_site_name(cemetery_key, values, options)
    _validate_values(TABLES["BurialSites"], values)
    return values


def _update_fields(connection, identifier, form, actor, *, adding=False):
    table = TABLES["BurialSiteFields"]
    for text_id in (form.get("burialSiteTypeFieldIds") or "").split(","):
        field_id = _number(text_id, integer=True, empty=0)
        value = form.get(f"fieldValue_{text_id}") or ""
        where = (table.c.burialSiteId == identifier, table.c.burialSiteTypeFieldId == field_id)
        now = now_millis()
        if value == "":
            if not adding:
                connection.execute(table.update().where(*where).values(recordDelete_username=actor, recordDelete_timeMillis=now))
        else:
            result = connection.execute(table.update().where(*where).values(fieldValue=value, recordUpdate_username=actor,
                recordUpdate_timeMillis=now, recordDelete_username=None, recordDelete_timeMillis=None))
            if not result.rowcount:
                connection.execute(table.insert().values(burialSiteId=identifier, burialSiteTypeFieldId=field_id, fieldValue=value,
                    recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))


def _purge_deleted_site(connection, identifier):
    contracts, workorders, links = (TABLES[name] for name in ("Contracts", "WorkOrders", "WorkOrderBurialSites"))
    if connection.scalar(sa.select(contracts.c.contractId).where(contracts.c.burialSiteId == identifier, contracts.c.recordDelete_timeMillis.is_(None)).limit(1)) is not None:
        return False
    if connection.scalar(sa.select(workorders.c.workOrderId).where(workorders.c.recordDelete_timeMillis.is_(None),
        workorders.c.workOrderId.in_(sa.select(links.c.workOrderId).where(links.c.burialSiteId == identifier, links.c.recordDelete_timeMillis.is_(None)))).limit(1)) is not None:
        return False
    # SQL Server FKs preserve deleted contract history. The source attempts a
    # physical purge here; expose the constraint rather than orphan that history.
    if connection.scalar(sa.select(contracts.c.contractId).where(contracts.c.burialSiteId == identifier).limit(1)) is not None:
        raise BurialSiteSourceError("The deleted burial site is referenced by historical contracts and cannot be recreated.")
    for table_name in ("BurialSiteComments", "BurialSiteFields", "WorkOrderBurialSites", "BurialSites"):
        table = TABLES[table_name]
        connection.execute(table.delete().where(table.c.burialSiteId == identifier))
    return True


def add_burial_site(database, form, actor, *, options=None, audit_enabled=False):
    options = options if options is not None else BurialSiteOptions()
    with transaction(database) as connection:
        values = _form_values(connection, form, options)
        table = TABLES["BurialSites"]
        existing = connection.execute(sa.select(table).where(table.c.burialSiteName == values["burialSiteName"]).order_by(table.c.burialSiteId)).mappings().first()
        if existing is not None:
            if existing["recordDelete_timeMillis"] is None:
                raise BurialSiteSourceError(f'An active burial site with the name "{values["burialSiteName"]}" already exists.')
            if not _purge_deleted_site(connection, existing["burialSiteId"]):
                raise BurialSiteSourceError("The deleted burial site is associated with past records and cannot be recreated.")
        now = now_millis()
        identifier = connection.execute(table.insert().values(**values, recordCreate_username=actor,
            recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now)).inserted_primary_key[0]
        _update_fields(connection, identifier, form, actor, adding=True)
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _raw(connection, "BurialSites", identifier))
        return {"burialSiteId": identifier, "burialSiteName": values["burialSiteName"]}


def update_burial_site(database, form, actor, *, options=None, audit_enabled=False):
    options = options if options is not None else BurialSiteOptions()
    with transaction(database) as connection:
        identifier = _number(form["burialSiteId"], integer=True)
        table = TABLES["BurialSites"]
        values = _form_values(connection, form, options)
        if connection.scalar(sa.select(table.c.burialSiteId).where(table.c.burialSiteName == values["burialSiteName"],
            table.c.burialSiteId != identifier, table.c.recordDelete_timeMillis.is_(None)).limit(1)) is not None:
            raise BurialSiteSourceError("An active burial site with that name already exists.")
        before = _raw(connection, "BurialSites", identifier, include_deleted=False)
        result = connection.execute(table.update().where(table.c.burialSiteId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(
            **values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount:
            _update_fields(connection, identifier, form, actor)
            if audit_enabled:
                _audit(connection, identifier, actor, "updated", before, _raw(connection, "BurialSites", identifier))
        return bool(result.rowcount)


def delete_burial_site(database, identifier, actor, *, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        identifier = _number(identifier, integer=True)
        contracts, table = TABLES["Contracts"], TABLES["BurialSites"]
        today = current_date if current_date is not None else date_to_integer(date.today())
        if connection.scalar(sa.select(contracts.c.contractId).where(contracts.c.burialSiteId == identifier,
            contracts.c.recordDelete_timeMillis.is_(None), sa.or_(contracts.c.contractEndDate.is_(None), contracts.c.contractEndDate >= today)).limit(1)) is not None:
            return False
        before = _raw(connection, "BurialSites", identifier, include_deleted=False)
        connection.execute(table.update().where(table.c.burialSiteId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled:
            _audit(connection, identifier, actor, "deleted", before, None)
        # Source returns true even for a missing/already deleted ID.
        return True


def restore_burial_site(database, identifier, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _number(identifier, integer=True)
        table = TABLES["BurialSites"]
        before = _raw(connection, "BurialSites", identifier)
        result = connection.execute(table.update().where(table.c.burialSiteId == identifier, table.c.recordDelete_timeMillis.is_not(None)).values(
            recordDelete_username=None, recordDelete_timeMillis=None, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount and audit_enabled:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "BurialSites", identifier))
        return bool(result.rowcount)


def search_burial_sites(database, filters=None, *, limit=50, offset=0, include_deleted=False, current_date=None):
    filters = filters or {}
    table, cem, types, statuses, contracts = (TABLES[name] for name in ("BurialSites", "Cemeteries", "BurialSiteTypes", "BurialSiteStatuses", "Contracts"))
    today = current_date if current_date is not None else date_to_integer(date.today())
    counts = sa.select(contracts.c.burialSiteId, sa.func.count().label("contractCount")).where(
        contracts.c.recordDelete_timeMillis.is_(None), contracts.c.contractStartDate <= today,
        sa.or_(contracts.c.contractEndDate.is_(None), contracts.c.contractEndDate >= today)).group_by(contracts.c.burialSiteId).subquery()
    joined = table.outerjoin(cem, table.c.cemeteryId == cem.c.cemeteryId).outerjoin(types, table.c.burialSiteTypeId == types.c.burialSiteTypeId).outerjoin(
        statuses, table.c.burialSiteStatusId == statuses.c.burialSiteStatusId).outerjoin(counts, table.c.burialSiteId == counts.c.burialSiteId)
    where = [] if include_deleted else [table.c.recordDelete_timeMillis.is_(None)]
    where.extend(burial_site_name_predicates(table.c.burialSiteName, filters.get("burialSiteName") or "", filters.get("burialSiteNameSearchType") or ""))
    if filters.get("cemeteryId") not in (None, ""):
        identifier = _number(filters["cemeteryId"], integer=True)
        where.append(sa.or_(cem.c.cemeteryId == identifier, cem.c.parentCemeteryId == identifier))
    for key in ("burialSiteTypeId", "burialSiteStatusId"):
        if filters.get(key) not in (None, ""):
            where.append(table.c[key] == _number(filters[key], integer=True))
    if filters.get("contractStatus") == "occupied":
        where.append(counts.c.contractCount > 0)
    elif filters.get("contractStatus") == "unoccupied":
        where.append(sa.or_(counts.c.contractCount.is_(None), counts.c.contractCount == 0))
    if filters.get("workOrderId") not in (None, ""):
        links = TABLES["WorkOrderBurialSites"]
        where.append(table.c.burialSiteId.in_(sa.select(links.c.burialSiteId).where(links.c.workOrderId == _number(filters["workOrderId"], integer=True), links.c.recordDelete_timeMillis.is_(None))))
    if filters.get("hasCoordinates") == "yes":
        where.extend((table.c.burialSiteLatitude.is_not(None), table.c.burialSiteLongitude.is_not(None)))
    elif filters.get("hasCoordinates") == "no":
        where.append(sa.or_(table.c.burialSiteLatitude.is_(None), table.c.burialSiteLongitude.is_(None)))
    columns = [table.c.burialSiteId, *(table.c[f"burialSiteNameSegment{index}"] for index in range(1, 6)), table.c.burialSiteName,
        types.c.burialSiteType, table.c.bodyCapacity, table.c.crematedCapacity, table.c.cemeteryId, cem.c.cemeteryName,
        table.c.cemeterySvgId, table.c.burialSiteStatusId, statuses.c.burialSiteStatus, table.c.burialSiteLatitude,
        table.c.burialSiteLongitude, sa.func.coalesce(counts.c.contractCount, 0).label("contractCount")]
    with transaction(database) as connection:
        count = connection.scalar(sa.select(sa.func.count()).select_from(joined).where(*where))
        query = sa.select(*columns).select_from(joined).where(*where).order_by(table.c.burialSiteName, table.c.burialSiteId)
        if limit != -1:
            safe_limit, safe_offset = sanitize_limit(limit), sanitize_offset(offset)
            if not math.isfinite(safe_limit) or not math.isfinite(safe_offset):
                raise ValueError("Pagination must be finite")
            query = query.limit(safe_limit).offset(safe_offset)
        rows = [dict(row) for row in connection.execute(query).mappings()]
        return {"burialSites": rows, "count": count}


def get_burial_site_fields(database, identifier, burial_site_type_id):
    links, fields, types = (TABLES[name] for name in ("BurialSiteFields", "BurialSiteTypeFields", "BurialSiteTypes"))
    with transaction(database) as connection:
        values = {row["burialSiteTypeFieldId"]: row["fieldValue"] for row in connection.execute(sa.select(links.c.burialSiteTypeFieldId, links.c.fieldValue).where(
            links.c.burialSiteId == identifier, links.c.recordDelete_timeMillis.is_(None))).mappings()}
        query = sa.select(*(column for column in fields.c if not column.name.startswith("record") and column.name != "burialSiteTypeId"), types.c.orderNumber.label("burialSiteTypeOrderNumber")).select_from(
            fields.outerjoin(types, fields.c.burialSiteTypeId == types.c.burialSiteTypeId)).where(sa.or_(
                fields.c.burialSiteTypeFieldId.in_(list(values)), sa.and_(fields.c.recordDelete_timeMillis.is_(None),
                    sa.or_(fields.c.burialSiteTypeId.is_(None), fields.c.burialSiteTypeId == burial_site_type_id)))).order_by(
                        types.c.orderNumber, fields.c.orderNumber, fields.c.burialSiteTypeField)
        return [{**dict(row), "burialSiteId": identifier, "fieldValue": values.get(row["burialSiteTypeFieldId"], "")} for row in connection.execute(query).mappings()]


def _normalized_date_parts(year, month, day):
    # JavaScript new Date(year, month-1, day), including year 0..99's 1900
    # offset and month/day rollover. The original datetime package uses this
    # even though its string validator allows month 00..19 and day 00..39.
    year = year + 1900 if 0 <= year <= 99 else year
    year, zero_month = divmod(year * 12 + month - 1, 12)
    return date(year, zero_month + 1, 1) + timedelta(days=day - 1)


def _date_string(value):
    if not isinstance(value, (int, float)) or value < 101 or not math.isfinite(value) or value % 1:
        return ""
    text = str(int(value)).zfill(8)[-8:]
    try:
        return _normalized_date_parts(int(text[:4]), int(text[4:6]), int(text[6:8])).isoformat()
    except (ValueError, OverflowError):
        return ""


def _time_string(value):
    text = str(value or 0).zfill(4)[-4:]
    return f"{text[:2]}:{text[2:4]}"


def _time_period_string(value):
    if value is None or not isinstance(value, (int, float)) or not 0 <= value <= 2359 or value % 1:
        return ""
    hour, minute = divmod((int(value) // 100) * 60 + int(value) % 100, 60)
    hour %= 24
    return f"{hour % 12 or 12}:{minute:02d} {'a.m.' if hour < 12 else 'p.m.'}"


def _date_string_to_integer(value):
    if not isinstance(value, str) or re.fullmatch(r"[0-9]{4}-[01][0-9]-[0-3][0-9]", value) is None:
        raise ValueError("Invalid comment date")
    return date_to_integer(_normalized_date_parts(*(int(piece) for piece in value.split("-"))))


def _time_string_to_integer(value):
    if not isinstance(value, str) or re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value) is None:
        raise ValueError("Invalid comment time")
    return int(value.replace(":", ""))


def get_burial_site_comments(database, identifier):
    table = TABLES["BurialSiteComments"]
    with transaction(database) as connection:
        columns = [table.c[key] for key in ("burialSiteCommentId", "commentDate", "commentTime", "comment", "recordCreate_username", "recordUpdate_username")]
        rows = [dict(row) for row in connection.execute(sa.select(*columns).where(table.c.burialSiteId == identifier,
            table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.commentDate.desc(), table.c.commentTime.desc(), table.c.burialSiteCommentId.desc())).mappings()]
        for row in rows:
            row.update(commentDateString=_date_string(row["commentDate"]), commentTimeString=_time_string(row["commentTime"]), commentTimePeriodString=_time_period_string(row["commentTime"]))
        return rows


def get_burial_site_directions_of_arrival(database, identifier):
    sites, cemeteries, directions = (TABLES[name] for name in ("BurialSites", "Cemeteries", "CemeteryDirectionsOfArrival"))
    with transaction(database) as connection:
        rows = connection.execute(sa.select(cemeteries.c.parentCemeteryId, directions.c.directionOfArrival, directions.c.directionOfArrivalDescription).select_from(
            sites.outerjoin(cemeteries, sites.c.cemeteryId == cemeteries.c.cemeteryId).outerjoin(directions, cemeteries.c.cemeteryId == directions.c.cemeteryId)).where(
                sites.c.burialSiteId == _number(identifier, integer=True))).mappings().all()
        result = {}
        if len(rows) == 1 and rows[0]["directionOfArrival"] is None and rows[0]["parentCemeteryId"] is not None:
            result = {row["directionOfArrival"]: row["directionOfArrivalDescription"] for row in connection.execute(sa.select(directions).where(
                directions.c.cemeteryId == rows[0]["parentCemeteryId"])).mappings()}
        elif rows and rows[0]["directionOfArrival"] is not None:
            result = {row["directionOfArrival"]: row["directionOfArrivalDescription"] or "" for row in rows}
        return result or {"E": "East", "N": "North", "S": "South", "W": "West"}


def get_burial_site_deceased_names(database, identifiers, *, current_date=None):
    if not identifiers:
        return []
    contracts, interments = TABLES["Contracts"], TABLES["ContractInterments"]
    today = current_date if current_date is not None else date_to_integer(date.today())
    with transaction(database) as connection:
        query = sa.select(contracts.c.burialSiteId, interments.c.deceasedName).select_from(contracts.join(interments, contracts.c.contractId == interments.c.contractId)).where(
            contracts.c.recordDelete_timeMillis.is_(None), interments.c.recordDelete_timeMillis.is_(None), contracts.c.burialSiteId.in_(identifiers),
            contracts.c.contractStartDate <= today, sa.or_(contracts.c.contractEndDate.is_(None), contracts.c.contractEndDate >= today)).order_by(contracts.c.burialSiteId, interments.c.deceasedName)
        grouped = {}
        for row in connection.execute(query).mappings():
            grouped.setdefault(row["burialSiteId"], []).append(row["deceasedName"])
        return [{"burialSiteId": identifier, "deceasedNames": names} for identifier, names in grouped.items()]


def update_burial_site_status(database, identifier, status_id, actor, *, audit_enabled=False):
    """Source mutation used by the map status dialog from step 06 onward."""
    with transaction(database) as connection:
        identifier = _number(identifier, integer=True)
        table = TABLES["BurialSites"]
        before = _raw(connection, "BurialSites", identifier, include_deleted=False)
        result = connection.execute(table.update().where(table.c.burialSiteId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(
            burialSiteStatusId=_number(status_id, integer=True), recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount and audit_enabled:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "BurialSites", identifier))
        return bool(result.rowcount)


def mutate_burial_site_comment(database, action, form, actor, *, audit_enabled=False):
    table = TABLES["BurialSiteComments"]
    with transaction(database) as connection:
        now = now_millis()
        if action == "add":
            current = datetime.now().astimezone()
            identifier = connection.execute(table.insert().values(burialSiteId=_number(form["burialSiteId"], integer=True), comment=form["comment"],
                commentDate=date_to_integer(current.date()), commentTime=current.hour * 100 + current.minute,
                recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now)).inserted_primary_key[0]
            if audit_enabled:
                _audit(connection, form["burialSiteId"], actor, "created", None, _raw(connection, "BurialSiteComments", identifier), "BurialSiteComments", identifier)
            return True
        identifier = _number(form["burialSiteCommentId"], integer=True)
        before = _raw(connection, "BurialSiteComments", identifier, include_deleted=False)
        if before is None:
            return False
        if action == "update":
            date_value = _date_string_to_integer(form["commentDateString"])
            time_value = _time_string_to_integer(form["commentTimeString"])
            values = dict(comment=form["comment"], commentDate=date_value, commentTime=time_value, recordUpdate_username=actor, recordUpdate_timeMillis=now)
        elif action == "delete":
            values = dict(recordDelete_username=actor, recordDelete_timeMillis=now)
        else:
            raise ValueError("Unknown comment action")
        result = connection.execute(table.update().where(table.c.burialSiteCommentId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(**values))
        if result.rowcount and audit_enabled:
            _audit(connection, before["burialSiteId"], actor, "updated" if action == "update" else "deleted", before,
                _raw(connection, "BurialSiteComments", identifier) if action == "update" else None, "BurialSiteComments", identifier)
        return bool(result.rowcount)


def _related_contracts(connection, identifier, catalog_options=None):
    contracts, types, funeral, committal = (TABLES[name] for name in ("Contracts", "ContractTypes", "FuneralHomes", "CommittalTypes"))
    joined = contracts.outerjoin(types, contracts.c.contractTypeId == types.c.contractTypeId).outerjoin(funeral, contracts.c.funeralHomeId == funeral.c.funeralHomeId).outerjoin(committal, contracts.c.committalTypeId == committal.c.committalTypeId)
    rows = [dict(row) for row in connection.execute(sa.select(contracts, types.c.contractType, types.c.isPreneed, funeral.c.funeralHomeName, committal.c.committalType).select_from(joined).where(
        contracts.c.burialSiteId == identifier, contracts.c.recordDelete_timeMillis.is_(None)).order_by(contracts.c.contractStartDate.desc(), sa.func.coalesce(contracts.c.contractEndDate, 99999999).desc(), contracts.c.contractId.desc())).mappings()]
    interments, containers, depths = (TABLES[name] for name in ("ContractInterments", "IntermentContainerTypes", "IntermentDepths"))
    today = date_to_integer(date.today())
    for row in rows:
        row.update(contractStartDateString=_date_string(row["contractStartDate"]), contractEndDateString=_date_string(row["contractEndDate"]),
            funeralDateString=_date_string(row["funeralDate"]), funeralTimeString=_time_string(row["funeralTime"]), funeralTimePeriodString=_time_period_string(row["funeralTime"]),
            contractIsActive=row["contractEndDate"] is None or row["contractEndDate"] > today, contractIsFuture=row["contractStartDate"] > today)
        prints = get_contract_type_prints(connection, row["contractTypeId"], options=catalog_options)
        if prints:
            row["printEJS"] = ((catalog_options.contract_prints if catalog_options is not None else ["screen/contract"])[0] if "*" in prints else prints[0])
        query = sa.select(interments, containers.c.intermentContainerType, containers.c.isCremationType, depths.c.intermentDepth).select_from(
            interments.outerjoin(containers, interments.c.intermentContainerTypeId == containers.c.intermentContainerTypeId).outerjoin(depths, interments.c.intermentDepthId == depths.c.intermentDepthId)).where(
                interments.c.contractId == row["contractId"], interments.c.recordDelete_timeMillis.is_(None)).order_by(containers.c.orderNumber, interments.c.deceasedName, interments.c.intermentNumber)
        row["contractInterments"] = [dict(item) for item in connection.execute(query).mappings()]
        for item in row["contractInterments"]:
            item.update(birthDateString=partial_date_integer_to_string(item["birthDate"]), deathDateString=partial_date_integer_to_string(item["deathDate"]))
    return rows


def get_burial_site(database, identifier, *, include_deleted=False, catalog_options=None):
    with transaction(database) as connection:
        table, types, statuses, cem = (TABLES[name] for name in ("BurialSites", "BurialSiteTypes", "BurialSiteStatuses", "Cemeteries"))
        query = sa.select(table, types.c.burialSiteType, types.c.bodyCapacityMax, types.c.crematedCapacityMax, statuses.c.burialSiteStatus,
            *(cem.c[key] for key in ("cemeteryName", "cemeteryKey", "cemeteryLatitude", "cemeteryLongitude", "cemeterySvg"))).select_from(table.outerjoin(
                types, table.c.burialSiteTypeId == types.c.burialSiteTypeId).outerjoin(statuses, table.c.burialSiteStatusId == statuses.c.burialSiteStatusId).outerjoin(cem, table.c.cemeteryId == cem.c.cemeteryId)).where(
                    table.c.burialSiteId == _number(identifier, integer=True))
        if not include_deleted:
            query = query.where(table.c.recordDelete_timeMillis.is_(None))
        record = connection.execute(query).mappings().first()
        if record is None:
            return None
        record = dict(record)
        record["burialSiteFields"] = get_burial_site_fields(connection, record["burialSiteId"], record["burialSiteTypeId"])
        record["burialSiteComments"] = get_burial_site_comments(connection, record["burialSiteId"])
        record["contracts"] = _related_contracts(connection, record["burialSiteId"], catalog_options)
        for contract in record["contracts"]:
            contract.update(burialSiteName=record["burialSiteName"], burialSiteType=record["burialSiteType"], burialSiteIsActive=record["recordDelete_timeMillis"] is None,
                cemeteryId=record["cemeteryId"], cemeteryName=record["cemeteryName"])
        workorders, links, worktypes, workstatuses = (TABLES[name] for name in ("WorkOrders", "WorkOrderBurialSites", "WorkOrderTypes", "WorkOrderStatuses"))
        record["workOrders"] = [dict(row) for row in connection.execute(sa.select(workorders, worktypes.c.workOrderType, workstatuses.c.workOrderStatus).select_from(workorders.outerjoin(
            worktypes, workorders.c.workOrderTypeId == worktypes.c.workOrderTypeId).outerjoin(workstatuses, workorders.c.workOrderStatusId == workstatuses.c.workOrderStatusId)).where(
                workorders.c.recordDelete_timeMillis.is_(None), workorders.c.workOrderId.in_(sa.select(links.c.workOrderId).where(links.c.burialSiteId == record["burialSiteId"], links.c.recordDelete_timeMillis.is_(None)))).order_by(workorders.c.workOrderId.desc())).mappings()]
        for prefix in ("body", "cremated"):
            capacity = record[f"{prefix}Capacity"]
            maximum = record[f"{prefix}CapacityMax"]
            record[f"effective{prefix.capitalize()}Capacity"] = capacity if capacity is not None else maximum if maximum is not None else get_setting_value(connection, f"burialSiteTypes.{prefix}CapacityMaxDefault")
        return record


def get_adjacent_burial_site_id(database, identifier, *, previous=False):
    table = TABLES["BurialSites"]
    with transaction(database) as connection:
        name = connection.scalar(sa.select(table.c.burialSiteName).where(table.c.burialSiteId == _number(identifier, integer=True)))
        query = sa.select(table.c.burialSiteId).where(table.c.recordDelete_timeMillis.is_(None),
            table.c.burialSiteName < name if previous else table.c.burialSiteName > name).order_by(table.c.burialSiteName.desc() if previous else table.c.burialSiteName).limit(1) if name is not None else None
        return connection.scalar(query) if query is not None else None


def get_burial_site_images(options=None):
    from cemaris.geography import get_media_files
    options = options if options is not None else BurialSiteOptions()
    return get_media_files(options, "burialSites")


def install_burial_sites(app, *, options=None):
    from cemaris.auth import current_user, require_admin, require_update_cemeteries
    from cemaris.dependencies import get_engine

    app.state.burial_site_options = options if options is not None else BurialSiteOptions()
    router = APIRouter(prefix="/api/burialSites", tags=["burial sites"])

    @router.get("/options")
    def get_options(request: Request, cemeteryId: int | None = None, user=Depends(current_user)):
        from cemaris.cemeteries import get_cemeteries
        from cemaris.geography import get_media_files
        with get_engine(request).begin() as connection:
            cemeteries = get_cemeteries(connection)
            blank = {"burialSiteId": -1, "burialSiteName": "", **{f"burialSiteNameSegment{index}": "" for index in range(1, 6)}, "burialSiteType": "",
                "burialSiteLatitude": None, "burialSiteLongitude": None, "cemeteryId": None, "cemeteryName": None, "contracts": [], "bodyCapacity": None, "crematedCapacity": None}
            selected = next((cemetery for cemetery in cemeteries if cemetery["cemeteryId"] == cemeteryId), None)
            if selected is not None:
                blank.update({key: selected.get(key) for key in ("cemeteryId", "cemeteryName", "cemeteryKey")})
            return {"cemeteries": cemeteries, "burialSiteTypes": get_catalog_records(connection, "burialSiteTypes"), "burialSiteStatuses": get_catalog_records(connection, "burialSiteStatuses"),
                "burialSiteImages": get_burial_site_images(request.app.state.burial_site_options), "burialSiteNameSegments": request.app.state.burial_site_options.burial_site_name_segments,
                "cemeterySVGs": get_media_files(request.app.state.burial_site_options, "cemeteries"),
                "auditLogEnabled": request.app.state.preference_options.audit_log_enabled, "burialSite": blank,
                "contractEndDateIsAvailable": request.app.state.burial_site_options.contract_end_date_is_available,
                **{key: getattr(request.app.state.burial_site_options, attribute) for key, attribute in (("latitudeMin", "latitude_min"), ("latitudeMax", "latitude_max"), ("longitudeMin", "longitude_min"), ("longitudeMax", "longitude_max"), ("addressLabels", "address_labels"))},
                **{key: get_setting_value(connection, "burialSiteTypes." + key) for key in ("bodyCapacityMaxDefault", "crematedCapacityMaxDefault")}}

    @router.get("/images/{filename}")
    def image(filename: str, request: Request, user=Depends(current_user)):
        from cemaris.geography import media_response
        return media_response(request.app.state.burial_site_options, "burialSites", filename)

    @router.post("/doSearchBurialSites")
    def search(request: Request, form: dict[str, Any] = Body(...), user=Depends(current_user)):
        try:
            result = search_burial_sites(get_engine(request), form, limit=form.get("limit", 50), offset=form.get("offset", 0))
            offset_number = js_number(form.get("offset", 0))
            return {**result, "offset": math.trunc(offset_number) if math.isfinite(offset_number) else None}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_burial_site_search", str(error))

    def mutate(action, request, form, user):
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                identifier = _number(form.get("burialSiteId"), integer=True)
                if action == "create":
                    return {"success": True, **add_burial_site(connection, form, user["username"], options=request.app.state.burial_site_options, **kwargs)}
                if action == "update":
                    success = update_burial_site(connection, form, user["username"], options=request.app.state.burial_site_options, **kwargs)
                elif action == "delete":
                    success = delete_burial_site(connection, identifier, user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "burial_site_active_contract", "Note that burial sites with active contracts cannot be deleted.")
                elif action == "restore":
                    success = restore_burial_site(connection, identifier, user["username"], **kwargs)
                else:
                    success = mutate_burial_site_comment(connection, action.removesuffix("-comment"), form, user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "burial_site_comment_not_found", "Comment not found")
                    return {"success": True, "burialSiteComments": get_burial_site_comments(connection, identifier)}
                if not success and action == "update":
                    return _catalog_error(request, 400, "burial_site_not_found", "Failed to update burial site")
                return {"success": success, **({"burialSiteId": identifier} if action != "delete" else {})}
        except BurialSiteSourceError as error:
            return _catalog_error(request, 400, "burial_site_conflict", str(error))
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_burial_site_value", "Missing burial site field" if isinstance(error, KeyError) else str(error))
        except IntegrityError:
            return _catalog_error(request, 400, "burial_site_constraint", "The burial site value violates a database reference or constraint")

    def endpoint(action):
        def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_admin if action == "restore" else require_update_cemeteries)):
            return mutate(action, request, form, user)
        return handler

    for path, action in (("doCreateBurialSite", "create"), ("doUpdateBurialSite", "update"), ("doDeleteBurialSite", "delete"), ("doRestoreBurialSite", "restore"),
        ("doAddBurialSiteComment", "add"), ("doUpdateBurialSiteComment", "updateComment"), ("doDeleteBurialSiteComment", "deleteComment")):
        # Keep site and comment action names distinct at the route boundary.
        actual = {"updateComment": "update-comment", "deleteComment": "delete-comment"}.get(action, action)
        def make_comment_endpoint(comment_action):
            def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
                return mutate(comment_action, request, form, user)
            return handler
        router.add_api_route("/" + path, make_comment_endpoint(actual) if actual in {"update-comment", "delete-comment"} else endpoint(actual), methods=["POST"], name=path)

    @router.get("/{burial_site_id}/next")
    def next_record(burial_site_id: int, request: Request, user=Depends(current_user)):
        return {"burialSiteId": get_adjacent_burial_site_id(get_engine(request), burial_site_id)}

    @router.get("/{burial_site_id}/previous")
    def previous_record(burial_site_id: int, request: Request, user=Depends(current_user)):
        return {"burialSiteId": get_adjacent_burial_site_id(get_engine(request), burial_site_id, previous=True)}

    @router.get("/{burial_site_id}")
    def detail(burial_site_id: int, request: Request, user=Depends(current_user)):
        record = get_burial_site(get_engine(request), burial_site_id, include_deleted=user.get("userProperties", {}).get("canUpdateCemeteries", False), catalog_options=request.app.state.catalog_options)
        if record is None:
            return _catalog_error(request, 404, "burial_site_not_found", "Burial site not found")
        return {"burialSite": record}

    app.include_router(router)
