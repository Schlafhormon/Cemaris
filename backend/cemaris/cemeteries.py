"""Cemetery records, derived from Sunrise CMS (MIT), fixed 451ce034863b165.

Source: database/*Cemetery*.ts, getBurialSite{Type,Status}Summary.ts and
handlers/cemeteries{Get,Post}; see licenses/Sunrise-LICENSE.md. Direct reads
replace the source process cache. Geographic tools and media live in geography.py.
"""

from __future__ import annotations

from datetime import date, datetime
import json
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy.exc import IntegrityError
import sqlalchemy as sa

from cemaris.catalogs import _catalog_error, _flag, _json_value, _number
from cemaris.db.schema import TABLES
from cemaris.preferences import get_setting_value, now_millis, transaction


CEMETERIES = TABLES["Cemeteries"]
SITES = TABLES["BurialSites"]
DIRECTIONS = TABLES["CemeteryDirectionsOfArrival"]
DIRECTIONS_OF_ARRIVAL = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
TEXT_FIELDS = (
    "cemeteryName", "cemeteryKey", "cemeteryDescription", "cemeterySvg",
    "cemeteryAddress1", "cemeteryAddress2", "cemeteryCity", "cemeteryProvince",
    "cemeteryPostalCode", "cemeteryPhoneNumber",
)
_MISSING = object()


def _rows(connection, *, cemetery_id=None, parent_cemetery_id=None, details=False):
    parent = CEMETERIES.alias("parent")
    columns = [CEMETERIES.c[key] for key in TEXT_FIELDS]
    columns += [CEMETERIES.c[key] for key in ("cemeteryId", "cemeteryLatitude", "cemeteryLongitude")]
    columns += [parent.c.cemeteryId.label("parentCemeteryId"), parent.c.cemeteryName.label("parentCemeteryName")]
    columns.append(sa.select(sa.func.count()).select_from(SITES).where(
        SITES.c.cemeteryId == CEMETERIES.c.cemeteryId, SITES.c.recordDelete_timeMillis.is_(None),
    ).correlate(CEMETERIES).scalar_subquery().label("burialSiteCount"))
    if details:
        columns += [CEMETERIES.c[key] for key in ("recordCreate_username", "recordCreate_timeMillis", "recordUpdate_username", "recordUpdate_timeMillis", "recordDelete_username", "recordDelete_timeMillis")]
        columns += [parent.c[key].label("parent" + key[0].upper() + key[1:]) for key in ("cemeteryLatitude", "cemeteryLongitude", "cemeterySvg")]
    query = sa.select(*columns).select_from(CEMETERIES.outerjoin(parent, sa.and_(
        CEMETERIES.c.parentCemeteryId == parent.c.cemeteryId, parent.c.recordDelete_timeMillis.is_(None),
    ))).where(CEMETERIES.c.recordDelete_timeMillis.is_(None))
    if cemetery_id is not None:
        query = query.where(CEMETERIES.c.cemeteryId == cemetery_id)
    if parent_cemetery_id is not None:
        query = query.where(CEMETERIES.c.parentCemeteryId == parent_cemetery_id)
    rows = [dict(row) for row in connection.execute(query.order_by(CEMETERIES.c.cemeteryName, CEMETERIES.c.cemeteryId)).mappings()]
    return rows


def cemetery_matches_search(cemetery: dict, query: str) -> bool:
    """cemetery.search.ts uses all lowercase space-separated substring pieces."""
    haystack = " ".join(str(cemetery.get(key) or "") for key in (
        "cemeteryName", "cemeteryKey", "cemeteryDescription", "cemeteryAddress1", "cemeteryAddress2",
    )).lower()
    return all(piece in haystack for piece in query.strip().lower().split(" "))


def get_cemeteries(database, parent_cemetery_id=None, *, search="") -> list[dict]:
    with transaction(database) as connection:
        rows = _rows(connection, parent_cemetery_id=parent_cemetery_id)
    return [row for row in rows if cemetery_matches_search(row, search)] if search else rows


def get_cemetery(database, cemetery_id) -> dict | None:
    with transaction(database) as connection:
        rows = _rows(connection, cemetery_id=cemetery_id, details=True)
        if not rows:
            return None
        cemetery = rows[0]
        cemetery["childCemeteries"] = get_cemeteries(connection, cemetery["cemeteryId"]) if cemetery["parentCemeteryId"] is None else []
        cemetery["directionsOfArrival"] = {row.directionOfArrival: row.directionOfArrivalDescription for row in connection.execute(
            sa.select(DIRECTIONS.c.directionOfArrival, DIRECTIONS.c.directionOfArrivalDescription).where(DIRECTIONS.c.cemeteryId == cemetery["cemeteryId"])
        ).all()}
        return cemetery


def _summary(database, resource: str, cemetery_id=None):
    table = TABLES["BurialSiteStatuses" if resource == "Status" else "BurialSiteTypes"]
    label, key = "burialSite" + resource, "burialSite" + resource + "Id"
    query = sa.select(table.c[key], table.c[label], sa.func.count(SITES.c.burialSiteId).label("burialSiteCount")).select_from(
        SITES.outerjoin(table, SITES.c[key] == table.c[key])
    ).where(SITES.c.recordDelete_timeMillis.is_(None))
    if cemetery_id is not None and cemetery_id != "":
        query = query.where(SITES.c.cemeteryId == cemetery_id)
    query = query.group_by(table.c[key], table.c[label], table.c.orderNumber).order_by(table.c.orderNumber)
    with transaction(database) as connection:
        return [dict(row) for row in connection.execute(query).mappings()]


def get_burial_site_type_summary(database, cemetery_id=None):
    return _summary(database, "Type", cemetery_id)


def get_burial_site_status_summary(database, cemetery_id=None):
    return _summary(database, "Status", cemetery_id)


def get_adjacent_cemetery_id(database, cemetery_id, direction: str):
    # Equal names are deliberately skipped, as in getNext/PreviousCemeteryId.
    current_name = sa.select(CEMETERIES.c.cemeteryName).where(CEMETERIES.c.cemeteryId == cemetery_id).scalar_subquery()
    query = sa.select(CEMETERIES.c.cemeteryId).where(CEMETERIES.c.recordDelete_timeMillis.is_(None))
    query = query.where(CEMETERIES.c.cemeteryName > current_name if direction == "next" else CEMETERIES.c.cemeteryName < current_name)
    query = query.order_by(CEMETERIES.c.cemeteryName if direction == "next" else CEMETERIES.c.cemeteryName.desc()).limit(1)
    with transaction(database) as connection:
        return connection.scalar(query)


def _values(form):
    values = {key: form.get(key, "") for key in TEXT_FIELDS}
    if "cemeteryName" not in form or "cemeteryKey" not in form:
        raise ValueError("Cemetery name and key fields are required")
    values["cemeteryPostalCode"] = values["cemeteryPostalCode"].upper()
    for key in ("cemeteryLatitude", "cemeteryLongitude"):
        values[key] = _number(form.get(key))
    for key in ("parentCemeteryId",):
        values[key] = _number(form.get(key), integer=True)
    for key, value in values.items():
        column = CEMETERIES.c[key]
        if value is None and not column.nullable:
            raise ValueError(f"{key} is required")
        length = getattr(column.type, "length", None)
        if isinstance(value, str) and length and len(value.encode("utf-16-le")) // 2 > length:
            raise ValueError(f"{key} exceeds {length} characters")
    return values


def _update_directions(connection, cemetery_id, form):
    connection.execute(DIRECTIONS.delete().where(DIRECTIONS.c.cemeteryId == cemetery_id))
    for direction in DIRECTIONS_OF_ARRIVAL:
        key = "directionOfArrivalDescription_" + direction
        if key in form:
            value = form[key] if form[key] is not None else ""
            if not isinstance(value, str) or len(value.encode("utf-16-le")) // 2 > 100:
                raise ValueError("Arrival description exceeds 100 characters")
            connection.execute(DIRECTIONS.insert().values(cemeteryId=cemetery_id, directionOfArrival=direction, directionOfArrivalDescription=value))


def _differences(before, after, path=""):
    """The relevant JSON value behavior of @cityssm/object-difference 0.1.0."""
    if isinstance(before, dict) and isinstance(after, dict):
        for key in dict.fromkeys([*before, *after]):
            if key not in {"__ob__", "__proto__"}:
                yield from _differences(before.get(key, _MISSING), after.get(key, _MISSING), f"{path}.{key}" if path else key)
    elif isinstance(before, list) and isinstance(after, list):
        for index, value in enumerate([value for value in before if value not in after]):
            yield (f"{path}.[{index}]", "deleted", value, None)
        for index, value in enumerate([value for value in after if value not in before]):
            yield (f"{path}.[{index}]", "created", None, value)
    elif before != after:
        kind = "created" if before is _MISSING or before is None or before == "" else "deleted" if after is _MISSING or after is None or after == "" else "updated"
        yield path, kind, None if before is _MISSING else before, None if after is _MISSING else after


def _audit(connection, cemetery_id, actor, kind, before, after, *, table_name="Cemeteries"):
    differences = [("*", kind, before, after)] if kind != "updated" else _differences(before, after)
    for field, update_type, old, new in differences:
        if field in {"recordCreate_timeMillis", "recordCreate_username", "recordUpdate_timeMillis"}:
            continue
        now = datetime.now().astimezone()
        connection.execute(TABLES["AuditLog"].insert().values(
            logMillis=now_millis(), logDate=int(now.strftime("%Y%m%d")), logTime=int(now.strftime("%H%M")),
            mainRecordType="cemetery", mainRecordId=str(cemetery_id), updateTable=table_name,
            recordIndex=None, updateField=field, updateType=update_type, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":")),
        ))


def add_cemetery(database, form: dict, actor: str, *, audit_enabled=False) -> int:
    values = _values(form)
    now = now_millis()
    with transaction(database) as connection:
        cemetery_id = connection.scalar(CEMETERIES.insert().values(**values, recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now).returning(CEMETERIES.c.cemeteryId))
        _update_directions(connection, cemetery_id, form)
        if audit_enabled:
            _audit(connection, cemetery_id, actor, "created", None, get_cemetery(connection, cemetery_id))
        return cemetery_id


def update_cemetery(database, form: dict, actor: str, *, audit_enabled=False, burial_site_options=None) -> bool:
    cemetery_id = _number(form["cemeteryId"], integer=True)
    values = _values(form)
    with transaction(database) as connection:
        before = get_cemetery(connection, cemetery_id) if audit_enabled else None
        result = connection.execute(CEMETERIES.update().where(CEMETERIES.c.cemeteryId == cemetery_id, CEMETERIES.c.recordDelete_timeMillis.is_(None)).values(**values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        success = result.rowcount > 0
        after = get_cemetery(connection, cemetery_id) if audit_enabled else None
        if audit_enabled:
            _audit(connection, cemetery_id, actor, "updated", before, after)
        directions_before = after.get("directionsOfArrival") if after else None
        # A missing row cannot own direction records in SQL Server. Return the
        # source's false update result without inventing an orphan relation.
        if success:
            _update_directions(connection, cemetery_id, form)
            if audit_enabled:
                _audit(connection, cemetery_id, actor, "updated", directions_before, get_cemetery(connection, cemetery_id)["directionsOfArrival"], table_name="CemeteryDirectionsOfArrival")
            from cemaris.burial_sites import build_burial_site_name
            rows = connection.execute(sa.select(SITES).where(SITES.c.cemeteryId == cemetery_id, SITES.c.recordDelete_timeMillis.is_(None))).mappings().all()
            now = now_millis()
            for row in rows:
                name = build_burial_site_name(values["cemeteryKey"], row, options=burial_site_options)
                connection.execute(SITES.update().where(SITES.c.burialSiteId == row["burialSiteId"]).values(burialSiteName=name, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        return success


def delete_cemetery(database, cemetery_id, actor: str, *, audit_enabled=False, current_date=None) -> bool:
    cemetery_id = _number(cemetery_id, integer=True)
    contracts = TABLES["Contracts"]
    today = current_date or int(date.today().strftime("%Y%m%d"))
    with transaction(database) as connection:
        active_sites = sa.select(SITES.c.burialSiteId).where(SITES.c.cemeteryId == cemetery_id, SITES.c.recordDelete_timeMillis.is_(None))
        active_contract = connection.scalar(sa.select(contracts.c.contractId).where(contracts.c.burialSiteId.in_(active_sites), contracts.c.recordDelete_timeMillis.is_(None), sa.or_(contracts.c.contractEndDate.is_(None), contracts.c.contractEndDate >= today)).limit(1))
        if active_contract is not None:
            return False
        before = get_cemetery(connection, cemetery_id) if audit_enabled else None
        deleted = {"recordDelete_username": actor, "recordDelete_timeMillis": now_millis()}
        connection.execute(CEMETERIES.update().where(CEMETERIES.c.cemeteryId == cemetery_id, CEMETERIES.c.recordDelete_timeMillis.is_(None)).values(**deleted))
        deleted_sites = connection.execute(SITES.update().where(SITES.c.cemeteryId == cemetery_id, SITES.c.recordDelete_timeMillis.is_(None)).values(**deleted)).rowcount
        all_sites = sa.select(SITES.c.burialSiteId).where(SITES.c.cemeteryId == cemetery_id)
        for name in ("BurialSiteFields", "BurialSiteComments"):
            table = TABLES[name]
            connection.execute(table.update().where(table.c.burialSiteId.in_(all_sites), table.c.recordDelete_timeMillis.is_(None)).values(**deleted))
        if deleted_sites == 0:
            # Source NOT IN deliberately retains its SQL NULL semantics. Keep
            # a soft-deleted parent tombstone when child FKs still reference it;
            # the source SQLite schema permits the physical orphan instead.
            children = connection.scalar(sa.select(CEMETERIES.c.cemeteryId).where(CEMETERIES.c.parentCemeteryId == cemetery_id, CEMETERIES.c.cemeteryId != cemetery_id).limit(1))
            no_sites = ~sa.literal(cemetery_id).in_(sa.select(SITES.c.cemeteryId))
            connection.execute(DIRECTIONS.delete().where(DIRECTIONS.c.cemeteryId == cemetery_id, no_sites))
            if children is None:
                connection.execute(CEMETERIES.delete().where(CEMETERIES.c.cemeteryId == cemetery_id, no_sites))
        if audit_enabled:
            _audit(connection, cemetery_id, actor, "deleted", before, None)
        return True


def install_cemeteries(app, *, options=None) -> None:
    from cemaris.auth import current_user, require_update_cemeteries
    from cemaris.dependencies import get_engine

    router = APIRouter(prefix="/api/cemeteries", tags=["cemeteries"])

    @router.get("")
    def list_cemeteries(request: Request, search: str = "", parentCemeteryId: int | None = None, user=Depends(current_user)):
        return {"cemeteries": get_cemeteries(get_engine(request), parentCemeteryId, search=search)}

    @router.get("/options")
    def cemetery_options(request: Request, user=Depends(current_user)):
        from cemaris.geography import get_media_files
        engine = get_engine(request)
        cemetery = {key: "" for key in TEXT_FIELDS}
        cemetery.update(cemeteryLatitude=None, cemeteryLongitude=None, parentCemeteryId=None, childCemeteries=[], directionsOfArrival={"E": "Osten", "N": "Norden", "S": "Süden", "W": "Westen"})
        cemetery.update(cemeteryCity=get_setting_value(engine, "defaults.city"), cemeteryProvince=get_setting_value(engine, "defaults.province"))
        segment_options = getattr(request.app.state, "burial_site_options", None)
        return {
            "cemeteries": get_cemeteries(engine), "cemetery": cemetery, "cemeterySVGs": get_media_files(segment_options, "cemeteries"),
            "auditLogEnabled": request.app.state.preference_options.audit_log_enabled,
            "includeCemeteryKey": bool(segment_options and segment_options.burial_site_name_segments.get("includeCemeteryKey", False)),
            "latitudeMin": getattr(segment_options, "latitude_min", -90),
            "latitudeMax": getattr(segment_options, "latitude_max", 90),
            "longitudeMin": getattr(segment_options, "longitude_min", -180),
            "longitudeMax": getattr(segment_options, "longitude_max", 180),
            "addressLabels": getattr(segment_options, "address_labels", "de"),
        }

    @router.get("/{cemetery_id:int}")
    def view_cemetery(cemetery_id: int, request: Request, user=Depends(current_user)):
        engine = get_engine(request)
        cemetery = get_cemetery(engine, cemetery_id)
        if cemetery is None:
            return _catalog_error(request, 404, "cemeteryIdNotFound", "Cemetery ID not found.")
        return {"cemetery": cemetery, "burialSiteTypeSummary": get_burial_site_type_summary(engine, cemetery_id), "burialSiteStatusSummary": get_burial_site_status_summary(engine, cemetery_id)}

    @router.get("/{cemetery_id:int}/{direction}")
    def adjacent_cemetery(cemetery_id: int, direction: str, request: Request, user=Depends(current_user)):
        if direction not in {"next", "previous"}:
            return _catalog_error(request, 404, "cemetery_action_not_found", "Unknown cemetery action")
        return {"cemeteryId": get_adjacent_cemetery_id(get_engine(request), cemetery_id, direction)}

    @router.post("/doCreateCemetery")
    @router.post("/doUpdateCemetery")
    @router.post("/doDeleteCemetery")
    def mutate_cemetery(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
        action = request.url.path.rsplit("/", 1)[-1]
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                if action == "doCreateCemetery":
                    result = {"cemeteryId": add_cemetery(connection, form, user["username"], **kwargs)}
                elif action == "doUpdateCemetery":
                    result = {"success": update_cemetery(connection, form, user["username"], burial_site_options=getattr(request.app.state, "burial_site_options", None), **kwargs), "cemeteryId": form["cemeteryId"]}
                elif action == "doDeleteCemetery":
                    success = delete_cemetery(connection, form["cemeteryId"], user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "cemetery_active_contracts", "Note that cemeteries with active contracts cannot be deleted.")
                    result = {"success": True}
            return result
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_cemetery_value", "Missing cemetery field" if isinstance(error, KeyError) else str(error))
        except IntegrityError:
            return _catalog_error(request, 400, "cemetery_constraint", "The cemetery value violates a database reference or constraint")

    app.include_router(router)
