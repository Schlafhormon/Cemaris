"""Contract interments and services derived from Sunrise CMS (MIT).

Source database/*ContractInterment.ts, *ContractServiceType.ts and their six
contractsPost handlers at 451ce034. See licenses/Sunrise-LICENSE.md.
SQL Server requires integral dates/ages; an empty age is represented as NULL
on both create and update (the source update stores SQLite TEXT '').
"""

from __future__ import annotations

import math
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
import sqlalchemy as sa
from sqlalchemy.exc import DataError, IntegrityError

from cemaris.burial_sites import _validate_values
from cemaris.catalogs import _catalog_error, _number
from cemaris.contracts import _audit, _children, _raw, get_contract_interments
from cemaris.db.schema import TABLES
from cemaris.db.semantics import date_parts_to_integer
from cemaris.preferences import now_millis, transaction


class ContractItemParentNotFound(ValueError):
    """Historical child rows cannot be edited through a deleted parent."""


def _integer(value, *, required=False):
    # Decimal integer form strings keep SQLite INTEGER affinity's full int64
    # precision; converting these to float first loses the upper boundary.
    number = int(value) if isinstance(value, str) and re.fullmatch(r"[+-]?[0-9]+", value.strip()) else _number(value, integer=True)
    if number is None:
        if required:
            raise ValueError("An integer identifier is required")
        return None
    if not -(2**63) <= number < 2**63:
        raise ValueError("Integer exceeds SQL Server bigint range")
    return number


def _active_parent(connection, identifier):
    identifier = _integer(identifier, required=True)
    if _raw(connection, "Contracts", identifier, active=True) is None:
        raise ContractItemParentNotFound("Contract not found")
    return identifier


_INTERMENT_TEXT = ("deceasedName", "deceasedAddress1", "deceasedAddress2", "deceasedCity", "deceasedProvince",
    "deceasedPostalCode", "birthPlace", "deathPlace", "deathAgePeriod")


def interment_values(form, *, adding):
    """Retain partial-date clamping, validating the resulting value, not parts."""
    values = {key: (form.get(key) if form.get(key) is not None else "") if adding else form[key]
        for key in _INTERMENT_TEXT}
    if any(not isinstance(value, str) for value in values.values()):
        raise ValueError("Interment fields must be text")
    values["deceasedPostalCode"] = values["deceasedPostalCode"].upper()
    for prefix in ("birth", "death"):
        parts = [form.get(prefix + part, "") if adding else form[prefix + part] for part in ("Year", "Month", "Day")]
        value = date_parts_to_integer(*parts)
        if value is not None and (not math.isfinite(value) or value % 1):
            raise ValueError("Partial date cannot be represented as a SQL Server integer")
        if value is not None and not -(2**63) <= value < 2**63:
            raise ValueError("Partial date exceeds SQL Server bigint range")
        values[prefix + "Date"] = int(value) if value is not None else None
    for key in ("deathAge", "intermentContainerTypeId", "intermentDepthId"):
        values[key] = _integer(form.get(key) if adding else form[key])
    _validate_values(TABLES["ContractInterments"], values)
    return values


def _item_row(connection, table, identifier, key, item_id, *, active=False):
    query = sa.select(table).where(table.c.contractId == identifier, table.c[key] == item_id)
    if active:
        query = query.where(table.c.recordDelete_timeMillis.is_(None))
    row = connection.execute(query).mappings().first()
    return dict(row) if row is not None else None


def add_contract_interment(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        table = TABLES["ContractInterments"]
        number = (connection.scalar(sa.select(sa.func.max(table.c.intermentNumber)).where(table.c.contractId == identifier)) or 0) + 1
        _integer(number, required=True)
        values = interment_values(form, adding=True)
        now = now_millis()
        connection.execute(table.insert().values(contractId=identifier, intermentNumber=number, **values,
            recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _item_row(connection, table, identifier, "intermentNumber", number),
                "ContractInterments", number)
        return number


def update_contract_interment(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        number = _integer(form["intermentNumber"], required=True)
        table = TABLES["ContractInterments"]
        before = _item_row(connection, table, identifier, "intermentNumber", number, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.intermentNumber == number,
            table.c.recordDelete_timeMillis.is_(None)).values(**interment_values(form, adding=False),
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "updated", before, _item_row(connection, table, identifier, "intermentNumber", number),
                "ContractInterments", number)
        return bool(result.rowcount)


def delete_contract_interment(database, identifier, number, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, identifier)
        number = _integer(number, required=True)
        table = TABLES["ContractInterments"]
        before = _item_row(connection, table, identifier, "intermentNumber", number)
        # Source deliberately has no active-row guard: repeated deletion succeeds.
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.intermentNumber == number).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "deleted", before, None, "ContractInterments", number)
        return bool(result.rowcount)


def get_contract_service_types(database, identifier):
    with transaction(database) as connection:
        return _children(connection, identifier, "services")


def _service_details(form):
    value = form.get("contractServiceDetails")
    value = "" if value is None else value
    if not isinstance(value, str):
        raise ValueError("Service details must be text")
    _validate_values(TABLES["ContractServiceTypes"], {"contractServiceDetails": value})
    return value


def add_contract_service_type(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        service_id = _integer(form["serviceTypeId"], required=True)
        table = TABLES["ContractServiceTypes"]
        existing = _item_row(connection, table, identifier, "serviceTypeId", service_id)
        now = now_millis()
        values = {"contractServiceDetails": _service_details(form), "recordUpdate_username": actor, "recordUpdate_timeMillis": now}
        if existing is None:
            connection.execute(table.insert().values(contractId=identifier, serviceTypeId=service_id, **values,
                recordCreate_username=actor, recordCreate_timeMillis=now))
        else:
            # Source compares its SQL NULL to undefined. Thus an already-active
            # service is overwritten too, with a created audit entry.
            connection.execute(table.update().where(table.c.contractId == identifier, table.c.serviceTypeId == service_id).values(
                **values, recordDelete_username=None, recordDelete_timeMillis=None))
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _item_row(connection, table, identifier, "serviceTypeId", service_id),
                "ContractServiceTypes", service_id)
        return True


def update_contract_service_type(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        service_id = _integer(form["serviceTypeId"], required=True)
        table = TABLES["ContractServiceTypes"]
        before = _item_row(connection, table, identifier, "serviceTypeId", service_id, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.serviceTypeId == service_id,
            table.c.recordDelete_timeMillis.is_(None)).values(contractServiceDetails=_service_details(form),
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "updated", before, _item_row(connection, table, identifier, "serviceTypeId", service_id),
                "ContractServiceTypes", service_id)
        return bool(result.rowcount)


def delete_contract_service_type(database, identifier, service_id, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, identifier)
        service_id = _integer(service_id, required=True)
        table = TABLES["ContractServiceTypes"]
        before = _item_row(connection, table, identifier, "serviceTypeId", service_id, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.serviceTypeId == service_id,
            table.c.recordDelete_timeMillis.is_(None)).values(recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "deleted", before, None, "ContractServiceTypes", service_id)
        return bool(result.rowcount)


def install_contract_items(app):
    from cemaris.auth import current_user, require_update_contracts
    from cemaris.dependencies import get_engine
    router = APIRouter(prefix="/api/contracts", tags=["contract items"])

    def mutate(request, form, user, kind, action, *, source_response=False):
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                identifier = _active_parent(connection, form.get("contractId"))
                if kind == "interment":
                    if action == "add":
                        add_contract_interment(connection, form, user["username"], **kwargs)
                        success = True
                    elif action == "update":
                        update_contract_interment(connection, form, user["username"], **kwargs)
                        # Source handler ignores helper result and returns list.
                        success = True
                    else:
                        success = delete_contract_interment(connection, identifier, form.get("intermentNumber"), user["username"], **kwargs)
                    result = {"contractInterments": get_contract_interments(connection, identifier)}
                else:
                    if action == "delete":
                        success = delete_contract_service_type(connection, identifier, form.get("serviceTypeId"), user["username"], **kwargs)
                    else:
                        method = add_contract_service_type if action == "add" else update_contract_service_type
                        success = method(connection, form, user["username"], **kwargs)
                    result = {"contractServiceTypes": get_contract_service_types(connection, identifier)}
                if not success:
                    if source_response and kind == "service":
                        return {"success": False, **({"errorMessage": "Service Type Not Updated"} if action == "update" else {})}
                    if source_response:
                        return _catalog_error(request, 400, "contract_item_not_found", "Interment not found")
                    return _catalog_error(request, 400, "contract_item_not_found", "Contract item not found")
                return {"success": True, **result}
        except ContractItemParentNotFound as error:
            return _catalog_error(request, 404, "contract_not_found", str(error))
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_contract_item", "Missing contract item field" if isinstance(error, KeyError) else str(error))
        except (IntegrityError, DataError):
            return _catalog_error(request, 400, "contract_item_constraint", "The item value violates a database reference or constraint")

    def source_endpoint(kind, action):
        def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
            return mutate(request, form, user, kind, action, source_response=True)
        return handler

    def collection_endpoint(kind):
        def handler(contract_id: int, request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
            return mutate(request, {**form, "contractId": contract_id}, user, kind, "add")
        return handler

    def item_endpoint(kind, action):
        def handler(contract_id: int, item_id: int, request: Request, form: dict[str, Any] = Body(default={}), user=Depends(require_update_contracts)):
            return mutate(request, {**form, "contractId": contract_id, "intermentNumber" if kind == "interment" else "serviceTypeId": item_id},
                user, kind, action)
        return handler

    for kind, resource, source in (("interment", "interments", "Interment"), ("service", "services", "ServiceType")):
        for action in ("add", "update", "delete"):
            router.add_api_route("/do" + action.title() + "Contract" + source, source_endpoint(kind, action), methods=["POST"])
        router.add_api_route("/{contract_id}/" + resource, collection_endpoint(kind), methods=["POST"])
        router.add_api_route("/{contract_id}/" + resource + "/{item_id}", item_endpoint(kind, "update"), methods=["POST"])
        router.add_api_route("/{contract_id}/" + resource + "/{item_id}/delete", item_endpoint(kind, "delete"), methods=["POST"])

    @router.get("/{contract_id}/interments")
    def interments(contract_id: int, request: Request, user=Depends(current_user)):
        with get_engine(request).begin() as connection:
            if _raw(connection, "Contracts", contract_id, active=True) is None:
                return _catalog_error(request, 404, "contract_not_found", "Contract not found")
            return {"contractInterments": get_contract_interments(connection, contract_id)}

    @router.get("/{contract_id}/services")
    def services(contract_id: int, request: Request, user=Depends(current_user)):
        with get_engine(request).begin() as connection:
            if _raw(connection, "Contracts", contract_id, active=True) is None:
                return _catalog_error(request, 404, "contract_not_found", "Contract not found")
            return {"contractServiceTypes": get_contract_service_types(connection, contract_id)}

    app.include_router(router)
