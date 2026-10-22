"""Funeral homes, derived from Sunrise CMS (MIT), fixed 451ce034863b165.

Source: database/*FuneralHome*.ts, *FuneralDirector*.ts and funeralHomes handlers.
See licenses/Sunrise-LICENSE.md.
"""

from collections import Counter
from datetime import date, datetime
import json
import math

from fastapi import APIRouter, Body, Depends, Request
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from cemaris.auth import current_user, require_admin, require_update_contracts
from cemaris.burial_sites import _validate_values
from cemaris.catalogs import _catalog_error, _flag, _json_value, _number
from cemaris.cemeteries import _differences
from cemaris.db.schema import TABLES
from cemaris.db.semantics import js_number
from cemaris.dependencies import get_engine
from cemaris.places_audit import get_place_audit_log
from cemaris.preferences import get_setting_value, now_millis, transaction

HOMES = TABLES["FuneralHomes"]
CONTRACTS = TABLES["Contracts"]
TEXT_FIELDS = ("funeralHomeName", "funeralHomeAddress1", "funeralHomeAddress2",
               "funeralHomeCity", "funeralHomeProvince", "funeralHomePostalCode", "funeralHomePhoneNumber")
LIST_FIELDS = ("funeralHomeId", "funeralHomeKey", *TEXT_FIELDS)


def funeral_home_matches_search(home, search):
    text = " ".join(str(home.get(key) or "") for key in ("funeralHomeName", "funeralHomeAddress1", "funeralHomeAddress2")).lower()
    return all(piece in text for piece in search.strip().lower().split(" "))


def get_funeral_homes(database, include_upcoming_funeral_count=True, *, today=None):
    columns = [HOMES.c[key] for key in LIST_FIELDS]
    if include_upcoming_funeral_count:
        count = sa.select(sa.func.count()).select_from(CONTRACTS).where(
            CONTRACTS.c.funeralHomeId == HOMES.c.funeralHomeId,
            CONTRACTS.c.recordDelete_timeMillis.is_(None),
            CONTRACTS.c.funeralDate >= (today or int(date.today().strftime("%Y%m%d"))),
        ).correlate(HOMES).scalar_subquery()
        columns.append(count.label("upcomingFuneralCount"))
    with transaction(database) as connection:
        rows = [dict(row) for row in connection.execute(sa.select(*columns).where(
            HOMES.c.recordDelete_timeMillis.is_(None))).mappings()]
        return sorted(rows, key=lambda row: (row["funeralHomeName"], row["funeralHomeId"]))


def get_funeral_home(database, identifier, include_deleted=False):
    query = sa.select(HOMES).where(HOMES.c.funeralHomeId == _number(identifier, integer=True))
    if not include_deleted:
        query = query.where(HOMES.c.recordDelete_timeMillis.is_(None))
    with transaction(database) as connection:
        row = connection.execute(query).mappings().first()
        return dict(row) if row else None


def get_funeral_directors(database, identifier):
    name = CONTRACTS.c.funeralDirectorName
    with transaction(database) as connection:
        names = Counter(connection.scalars(sa.select(name).where(
            CONTRACTS.c.recordDelete_timeMillis.is_(None),
            CONTRACTS.c.funeralHomeId == _number(identifier, integer=True),
            name.is_not(None), sa.func.trim(name) != "",
        )))
        # SQL Server GROUP BY pads strings even under BIN2. The source keeps
        # 'Ada' and 'Ada ' distinct and orders them by SQLite BINARY text.
        return sorted(names, key=lambda value: (-names[value], value))[:20]


def get_adjacent_funeral_home_id(database, identifier, direction):
    with transaction(database) as connection:
        current_name = connection.scalar(sa.select(HOMES.c.funeralHomeName).where(HOMES.c.funeralHomeId == identifier))
        if current_name is None:
            return None
        rows = list(connection.execute(sa.select(HOMES.c.funeralHomeId, HOMES.c.funeralHomeName).where(HOMES.c.recordDelete_timeMillis.is_(None))).all())
        candidates = [row for row in rows if (row.funeralHomeName > current_name if direction == "next" else row.funeralHomeName < current_name)]
        candidates.sort(key=lambda row: row.funeralHomeName, reverse=direction == "previous")
        return candidates[0].funeralHomeId if candidates else None


def _values(form, *, adding=False):
    if not isinstance(form.get("funeralHomeName"), str) or not isinstance(form.get("funeralHomePostalCode"), str):
        raise ValueError("Funeral home name and postal code fields are required")
    values = {key: form.get(key) for key in TEXT_FIELDS}
    values["funeralHomePostalCode"] = values["funeralHomePostalCode"].upper()
    if adding:
        values["funeralHomeKey"] = form.get("funeralHomeKey") or ""
    if any(value is not None and not isinstance(value, str) for key, value in values.items() if key in TEXT_FIELDS or key == "funeralHomeKey"):
        raise ValueError("Funeral home text fields must be strings")
    _validate_values(HOMES, values)
    return values


def _audit(connection, identifier, actor, kind, before, after):
    differences = [("*", kind, before, after)] if kind != "updated" else _differences(before, after)
    for field, update_type, old, new in differences:
        if field in {"recordCreate_timeMillis", "recordCreate_username", "recordUpdate_timeMillis"}:
            continue
        now = datetime.now().astimezone()
        connection.execute(TABLES["AuditLog"].insert().values(
            logMillis=now_millis(), logDate=int(now.strftime("%Y%m%d")), logTime=int(now.strftime("%H%M")),
            mainRecordType="funeralHome", mainRecordId=str(identifier), updateTable="FuneralHomes",
            recordIndex=None, updateField=field, updateType=update_type, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":")),
        ))


def add_funeral_home(database, form, actor, *, audit_enabled=False):
    values = _values(form, adding=True)
    now = now_millis()
    with transaction(database) as connection:
        identifier = connection.scalar(HOMES.insert().values(**values, recordCreate_username=actor,
            recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now).returning(HOMES.c.funeralHomeId))
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, get_funeral_home(connection, identifier))
        return identifier


def update_funeral_home(database, form, actor, *, audit_enabled=False):
    values = _values(form)
    identifier = _number(form["funeralHomeId"], integer=True)
    with transaction(database) as connection:
        before = get_funeral_home(connection, identifier) if audit_enabled else None
        success = connection.execute(HOMES.update().where(HOMES.c.funeralHomeId == identifier,
            HOMES.c.recordDelete_timeMillis.is_(None)).values(**values, recordUpdate_username=actor,
            recordUpdate_timeMillis=now_millis())).rowcount > 0
        if success and audit_enabled:
            _audit(connection, identifier, actor, "updated", before, get_funeral_home(connection, identifier))
        return success


def delete_funeral_home(database, identifier, actor, *, audit_enabled=False, today=None):
    identifier = _number(identifier, integer=True)
    current = today or int(date.today().strftime("%Y%m%d"))
    with transaction(database) as connection:
        if connection.scalar(sa.select(CONTRACTS.c.contractId).where(
            CONTRACTS.c.funeralHomeId == identifier, CONTRACTS.c.recordDelete_timeMillis.is_(None),
            sa.or_(CONTRACTS.c.contractEndDate.is_(None), CONTRACTS.c.contractEndDate >= current),
            CONTRACTS.c.funeralDate >= current,
        ).limit(1)) is not None:
            return False
        before = get_funeral_home(connection, identifier) if audit_enabled else None
        connection.execute(HOMES.update().where(HOMES.c.funeralHomeId == identifier,
            HOMES.c.recordDelete_timeMillis.is_(None)).values(recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled:
            _audit(connection, identifier, actor, "deleted", before, None)
        return True


def restore_funeral_home(database, identifier, actor, *, audit_enabled=False):
    identifier = _number(identifier, integer=True)
    with transaction(database) as connection:
        before = get_funeral_home(connection, identifier, True) if audit_enabled else None
        success = connection.execute(HOMES.update().where(HOMES.c.funeralHomeId == identifier,
            HOMES.c.recordDelete_timeMillis.is_not(None)).values(recordDelete_username=None, recordDelete_timeMillis=None,
            recordUpdate_username=actor, recordUpdate_timeMillis=now_millis())).rowcount > 0
        if success and audit_enabled:
            _audit(connection, identifier, actor, "updated", before, get_funeral_home(connection, identifier))
        return success


def install_funeral_homes(app):
    router = APIRouter(prefix="/api/funeral-homes", tags=["funeral homes"])

    def options(request):
        engine = get_engine(request)
        home = {key: "" for key in TEXT_FIELDS}
        home.update(funeralHomeCity=get_setting_value(engine, "defaults.city"),
                    funeralHomeProvince=get_setting_value(engine, "defaults.province"))
        return {"funeralHome": home, "addressLabels": request.app.state.burial_site_options.address_labels,
                "auditLogEnabled": request.app.state.preference_options.audit_log_enabled}

    @router.get("/options")
    def get_options(request: Request, user=Depends(current_user)):
        return options(request)

    @router.get("/new")
    def new_home(request: Request, user=Depends(require_update_contracts)):
        return options(request)

    @router.get("")
    def search(request: Request, user=Depends(current_user)):
        engine = get_engine(request)
        return {"funeralHomes": get_funeral_homes(engine), **options(request)}

    def detail(identifier, request, user, *, editing=False):
        engine = get_engine(request)
        home = get_funeral_home(engine, identifier, user["userProperties"]["canUpdateContracts"] and not editing)
        if home is None:
            return _catalog_error(request, 404, "funeralHomeIdNotFound", "Funeral Home ID not found.")
        from cemaris.contracts import get_contracts
        contracts = get_contracts(engine, {"funeralHomeId": identifier, "funeralTime": "upcoming"},
            limit=-1, offset=0, order_by="funeral", include_interments=True, include_fees=False,
            include_transactions=False, include_service_types=False)
        return {"funeralHome": home, "contracts": contracts["contracts"], **{key: value for key, value in options(request).items() if key != "funeralHome"}}

    @router.get("/{identifier:int}")
    def view(identifier: int, request: Request, user=Depends(current_user)):
        return detail(identifier, request, user)

    @router.get("/{identifier:int}/edit")
    def edit(identifier: int, request: Request, user=Depends(require_update_contracts)):
        return detail(identifier, request, user, editing=True)

    @router.get("/{identifier:int}/{direction}")
    def adjacent(identifier: int, direction: str, request: Request, user=Depends(current_user)):
        if direction not in {"next", "previous"}:
            return _catalog_error(request, 404, "funeral_home_action_not_found", "Unknown funeral home action")
        return {"funeralHomeId": get_adjacent_funeral_home_id(get_engine(request), identifier, direction)}

    def mutate(identifier, action, form, request, user):
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                if action == "create":
                    identifier = add_funeral_home(connection, form, user["username"], **kwargs)
                    success = bool(identifier)
                elif action == "update":
                    success = update_funeral_home(connection, {**form, "funeralHomeId": identifier}, user["username"], **kwargs)
                elif action == "delete":
                    success = delete_funeral_home(connection, identifier, user["username"], **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "funeral_home_upcoming_funerals", "Note that funeral homes with current or upcoming funerals cannot be deleted.")
                elif action == "restore":
                    success = restore_funeral_home(connection, identifier, user["username"], **kwargs)
                else:
                    return _catalog_error(request, 404, "funeral_home_action_not_found", "Unknown funeral home action")
                if not success:
                    result = _catalog_error(request, 400, "funeral_home_" + action + "_failed", "Failed to " + action + " funeral home")
                else:
                    result = {"funeralHomeId": identifier} if action == "create" else {"success": True, "funeralHomeId": identifier}
            # The source has no restore hook. Add sync is opt-in; updates and
            # deletes always publish the resulting available-home snapshot.
            return result
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_funeral_home_value", "Missing funeral home field" if isinstance(error, KeyError) else str(error))
        except IntegrityError:
            return _catalog_error(request, 400, "funeral_home_constraint", "The funeral home value violates a database reference or constraint")

    @router.post("")
    def create(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        return mutate(None, "create", form, request, user)

    @router.post("/{identifier:int}/restore")
    def restore(identifier: int, request: Request, form: dict = Body(default={}), user=Depends(require_admin)):
        return mutate(identifier, "restore", form, request, user)

    @router.post("/{identifier:int}/{action}")
    def change(identifier: int, action: str, request: Request, form: dict = Body(default={}), user=Depends(require_update_contracts)):
        return mutate(identifier, action, form, request, user)

    @app.post("/api/funeralHomes/doGetRecordAuditLog", tags=["funeral homes"])
    def audit(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        if not request.app.state.preference_options.audit_log_enabled:
            return _catalog_error(request, 404, "audit_disabled", "Audit logging is disabled")
        if form.get("mainRecordType") != "funeralHome":
            return _catalog_error(request, 403, "audit_record_type", "Forbidden")
        try:
            limit, offset = (js_number(form.get(key, default)) for key, default in (("limit", 50), ("offset", 0)))
            if not all(math.isfinite(number) and abs(number) <= 2**63 - 1 for number in (limit, offset)):
                raise ValueError("Invalid audit pagination")
            limit, offset = math.trunc(limit), math.trunc(offset)
            with get_engine(request).connect() as connection:
                return {"success": True, **get_place_audit_log(connection, "funeralHome", form.get("mainRecordId", ""), limit=limit, offset=offset), "offset": offset}
        except (TypeError, ValueError, OverflowError):
            return _catalog_error(request, 400, "audit_pagination", "Invalid audit pagination")

    app.include_router(router)
