"""Contract fees and transactions derived from Sunrise CMS (MIT), 451ce034.

Source: helpers/functions.fee.ts, database/*ContractFee*.ts,
*ContractTransaction.ts and their contractsPost handlers. See
licenses/Sunrise-LICENSE.md. Amounts deliberately remain binary64 and are not
rounded on write. The source's feeFunction currently always calculates zero;
its catalogue value is preserved without interpreting it as executable code.
"""

from __future__ import annotations

from datetime import datetime
import math
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, Request
import sqlalchemy as sa
from sqlalchemy.exc import DataError, IntegrityError

from cemaris.burial_sites import _date_string_to_integer, _time_string_to_integer, _validate_values
from cemaris.catalogs import _catalog_error, _fee_audit_record, get_fee_categories
from cemaris.contract_items import ContractItemParentNotFound, _active_parent, _integer, _item_row
from cemaris.contracts import _audit, _children, _raw
from cemaris.db.schema import TABLES
from cemaris.db.semantics import date_to_integer, js_number
from cemaris.preferences import now_millis, transaction


def calculate_fee_amount(fee, contract):
    """Keep the fixed reference's dynamic-function result, including NULLs."""
    return 0 if fee.get("feeFunction") else fee.get("feeAmount") if fee.get("feeAmount") is not None else 0


def calculate_tax_amount(fee, fee_amount):
    return fee_amount * (fee["taxPercentage"] / 100) if fee.get("taxPercentage") else fee.get("taxAmount") if fee.get("taxAmount") is not None else 0


def get_fees_by_fee_category(contract, fee_category, is_fee_category_contains_filter=False):
    """Case-insensitive category lookup from helpers/contracts.helpers.ts."""
    needle = fee_category.lower()
    return [fee for fee in contract.get("contractFees") or []
        if (needle in fee["feeCategory"].lower() if is_fee_category_contains_filter else fee["feeCategory"].lower() == needle)]


def get_field_value_by_contract_type_field(contract, contract_type_field):
    needle = contract_type_field.lower()
    return next((field.get("fieldValue") for field in contract.get("contractFields") or []
        if field["contractTypeField"].lower() == needle), None)


def get_transaction_total(contract):
    total = 0
    for row in contract.get("contractTransactions") or []:
        total += row["transactionAmount"]
    return total


def _finite(value):
    if not math.isfinite(value):
        raise ValueError("Amount or quantity must be finite")
    return value


_STORED_DECIMAL = re.compile(r"[ \t\n\r\v\f]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r\v\f]*")


def _stored_number(value):
    # SQLite's NUMERIC affinity accepts ASCII decimal/exponent strings with
    # ASCII whitespace. Python float() also accepts underscores, Unicode
    # digits and Unicode spaces, which SQLite would retain as TEXT instead.
    # Such TEXT cannot be preserved by SQL Server FLOAT. node:sqlite rejects
    # Boolean/container bindings; do not coerce them into amounts or flags.
    if isinstance(value, str):
        if _STORED_DECIMAL.fullmatch(value) is None:
            raise ValueError("An ASCII decimal amount or quantity is required")
    elif isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("An amount or quantity must be a number or decimal text")
    try:
        return _finite(float(value))
    except OverflowError:
        raise ValueError("Amount or quantity must be finite") from None


def _invoice_flag(value):
    # Only absence/NULL receives the source's `isInvoiced ?? 0` default.
    # An explicit empty string is SQLite TEXT, not a representable SQL BIT.
    number = 0 if value is None else _stored_number(value)
    if number not in (0, 1):
        raise ValueError("Invoice flag must be 0 or 1")
    return bool(number)


def get_contract_fees(database, identifier):
    with transaction(database) as connection:
        return _children(connection, _integer(identifier, required=True), "fees")


def get_contract_transactions(database, identifier):
    with transaction(database) as connection:
        rows = _children(connection, _integer(identifier, required=True), "transactions")
    return rows


def get_available_contract_fees(database, identifier):
    with transaction(database) as connection:
        identifier = _active_parent(connection, identifier)
        parent = _raw(connection, "Contracts", identifier, active=True)
        sites = TABLES["BurialSites"]
        burial_type_id = connection.scalar(sa.select(sites.c.burialSiteTypeId).where(sites.c.burialSiteId == parent["burialSiteId"]))
        # Presence of both keys prevents the admin reader's order-number
        # normalization even when one value is NULL, exactly as in doGetFees.
        return get_fee_categories(connection, {"contractTypeId": parent["contractTypeId"], "burialSiteTypeId": burial_type_id}, include_fees=True)


def _fee_tax_amounts(connection, form):
    if form.get("feeAmount") in (None, ""):
        fee = _fee_audit_record(connection, _integer(form["feeId"], required=True))
        if fee is None:
            raise ValueError("Fee not found")
        amount = calculate_fee_amount(fee, _raw(connection, "Contracts", form["contractId"], active=True))
        return _finite(amount), _finite(calculate_tax_amount(fee, amount))
    # The source deliberately converts only strings; JSON numeric amounts,
    # including numeric taxAmount, become zero. A missing manual tax is zero.
    return (_finite(js_number(form["feeAmount"])) if isinstance(form["feeAmount"], str) else 0,
        _finite(js_number(form["taxAmount"])) if isinstance(form.get("taxAmount"), str) else 0)


def add_contract_fee(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        fee_id = _integer(form["feeId"], required=True)
        quantity = _stored_number(form["quantity"])
        amount, tax = _fee_tax_amounts(connection, form)
        table = TABLES["ContractFees"]
        before = _item_row(connection, table, identifier, "feeId", fee_id)
        now = now_millis()
        if before is not None and before["recordDelete_timeMillis"] is not None:
            # Re-adding replaces the old row (including creation metadata),
            # unlike the service reactivation from the previous step.
            connection.execute(table.delete().where(table.c.contractId == identifier, table.c.feeId == fee_id))
            before = None
        if before is None:
            connection.execute(table.insert().values(contractId=identifier, feeId=fee_id, quantity=quantity, feeAmount=amount,
                taxAmount=tax, recordCreate_username=actor, recordCreate_timeMillis=now,
                recordUpdate_username=actor, recordUpdate_timeMillis=now))
        else:
            if before["feeAmount"] == amount and before["taxAmount"] == tax:
                values = {"quantity": _finite(before["quantity"] + quantity)}
            else:
                values = {"feeAmount": _finite(before["feeAmount"] * before["quantity"] + amount * quantity),
                    "taxAmount": _finite(before["taxAmount"] * before["quantity"] + tax * quantity), "quantity": 1}
            connection.execute(table.update().where(table.c.contractId == identifier, table.c.feeId == fee_id).values(
                **values, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        if audit_enabled:
            _audit(connection, identifier, actor, "created" if before is None else "updated", before,
                _item_row(connection, table, identifier, "feeId", fee_id), "ContractFees", fee_id)
        return True


def add_contract_fee_category(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        categories = get_fee_categories(connection, {"feeCategoryId": _integer(form["feeCategoryId"], required=True)}, include_fees=True)
        added = 0
        # Source group addition uses every active fee in the group, without
        # contract/burial type filters or includeQuantity/isRequired guards.
        for fee in categories[0]["fees"] if categories else []:
            if add_contract_fee(connection, {"contractId": identifier, "feeId": fee["feeId"], "quantity": 1}, actor,
                    audit_enabled=audit_enabled):
                added += 1
        return added


def update_contract_fee_quantity(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        fee_id = _integer(form["feeId"], required=True)
        table = TABLES["ContractFees"]
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.feeId == fee_id,
            table.c.recordDelete_timeMillis.is_(None)).values(quantity=_stored_number(form["quantity"]),
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        # The source quantity updater intentionally has no audit writer.
        return bool(result.rowcount)


def delete_contract_fee(database, identifier, fee_id, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, identifier)
        fee_id = _integer(fee_id, required=True)
        table = TABLES["ContractFees"]
        before = _item_row(connection, table, identifier, "feeId", fee_id, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.feeId == fee_id).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        # Repeated deletion succeeds and audits a NULL before value.
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "deleted", before, None, "ContractFees", fee_id)
        return bool(result.rowcount)


def _transaction_values(form, *, adding, current_datetime=None):
    current = current_datetime if current_datetime is not None else datetime.now().astimezone()
    values = {"transactionAmount": _stored_number(form["transactionAmount"]), "isInvoiced": _invoice_flag(form.get("isInvoiced"))}
    for key in ("externalReceiptNumber", "transactionNote"):
        value = form[key]
        if value is not None and not isinstance(value, str):
            raise ValueError("Receipt number and transaction note must be text")
        values[key] = value
    values["transactionDate"] = date_to_integer(current.date()) if adding and form.get("transactionDateString") in (None, "") else _date_string_to_integer(form["transactionDateString"])
    if adding and form.get("transactionTimeString") in (None, ""):
        values["transactionTime"] = current.hour * 100 + current.minute
    else:
        try:
            values["transactionTime"] = _time_string_to_integer(form["transactionTimeString"])
        except ValueError:
            # utils-datetime returns undefined for invalid times. Only the
            # source INSERT supplies `transactionTime ?? 0`; UPDATE does not.
            if not adding:
                raise
            values["transactionTime"] = 0
    _validate_values(TABLES["ContractTransactions"], values)
    return values


def add_contract_transaction(database, form, actor, *, audit_enabled=False, current_datetime=None):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        table = TABLES["ContractTransactions"]
        maximum = connection.scalar(sa.select(sa.func.max(table.c.transactionIndex)).where(table.c.contractId == identifier))
        index = 0 if maximum is None else _integer(maximum + 1, required=True)
        current = current_datetime if current_datetime is not None else datetime.now().astimezone()
        values = _transaction_values(form, adding=True, current_datetime=current)
        now = int(current.timestamp() * 1000)
        connection.execute(table.insert().values(contractId=identifier, transactionIndex=index, **values,
            recordCreate_username=actor, recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _item_row(connection, table, identifier, "transactionIndex", index),
                "ContractTransactions", index)
        return index


def update_contract_transaction(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["contractId"])
        index = _integer(form["transactionIndex"], required=True)
        table = TABLES["ContractTransactions"]
        before = _item_row(connection, table, identifier, "transactionIndex", index, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.transactionIndex == index,
            table.c.recordDelete_timeMillis.is_(None)).values(**_transaction_values(form, adding=False),
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "updated", before, _item_row(connection, table, identifier, "transactionIndex", index),
                "ContractTransactions", index)
        return bool(result.rowcount)


def delete_contract_transaction(database, identifier, index, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, identifier)
        index = _integer(index, required=True)
        table = TABLES["ContractTransactions"]
        before = _item_row(connection, table, identifier, "transactionIndex", index, active=True)
        result = connection.execute(table.update().where(table.c.contractId == identifier, table.c.transactionIndex == index).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "deleted", before, None, "ContractTransactions", index)
        return bool(result.rowcount)


def install_contract_finance(app):
    from cemaris.auth import current_user, require_update_contracts
    from cemaris.dependencies import get_engine
    router = APIRouter(prefix="/api/contracts", tags=["contract finance"])

    def result(request, connection, identifier, kind):
        return {"contractFees": get_contract_fees(connection, identifier)} if kind == "fee" else {"contractTransactions": get_contract_transactions(
            connection, identifier)}

    def mutate(request, form, user, kind, action):
        try:
            with get_engine(request).begin() as connection:
                identifier = _active_parent(connection, form.get("contractId"))
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                if action == "select":
                    return {"success": True, "feeCategories": get_available_contract_fees(connection, identifier)}
                if kind == "fee":
                    if action == "group":
                        add_contract_fee_category(connection, form, user["username"], **kwargs)
                        success = True
                    elif action == "delete":
                        success = delete_contract_fee(connection, identifier, form.get("feeId"), user["username"], **kwargs)
                    else:
                        method = add_contract_fee if action == "add" else update_contract_fee_quantity
                        success = method(connection, form, user["username"], **kwargs)
                elif action == "delete":
                    success = delete_contract_transaction(connection, identifier, form.get("transactionIndex"), user["username"], **kwargs)
                else:
                    method = add_contract_transaction if action == "add" else update_contract_transaction
                    method(connection, form, user["username"], **kwargs)
                    # Source handlers ignore the updater result, including a
                    # missing transaction, and return the unchanged list.
                    success = True
                if not success:
                    message = "Failed to update fee quantity" if action == "update" else "Fee not found" if kind == "fee" else "Transaction not found"
                    return _catalog_error(request, 400, "contract_finance_not_found", message)
                return {"success": True, **result(request, connection, identifier, kind)}
        except ContractItemParentNotFound as error:
            return _catalog_error(request, 404, "contract_not_found", str(error))
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_contract_finance", "Missing finance field" if isinstance(error, KeyError) else str(error))
        except (IntegrityError, DataError):
            return _catalog_error(request, 400, "contract_finance_constraint", "The financial value violates a database reference or constraint")

    def source_endpoint(kind, action):
        def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
            return mutate(request, form, user, kind, action)
        return handler

    for source, kind, action in (("doGetFees", "fee", "select"), ("doAddContractFee", "fee", "add"),
            ("doAddContractFeeCategory", "fee", "group"), ("doUpdateContractFeeQuantity", "fee", "update"),
            ("doDeleteContractFee", "fee", "delete"), ("doAddContractTransaction", "transaction", "add"),
            ("doUpdateContractTransaction", "transaction", "update"), ("doDeleteContractTransaction", "transaction", "delete")):
        router.add_api_route("/" + source, source_endpoint(kind, action), methods=["POST"], name=source)

    def collection_endpoint(kind):
        def handler(contract_id: int, request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_contracts)):
            return mutate(request, {**form, "contractId": contract_id}, user, kind, "add")
        return handler

    def item_endpoint(kind, action):
        def handler(contract_id: int, item_id: int, request: Request, form: dict[str, Any] = Body(default={}), user=Depends(require_update_contracts)):
            return mutate(request, {**form, "contractId": contract_id, "feeId" if kind == "fee" else "transactionIndex": item_id}, user, kind, action)
        return handler

    for kind, resource in (("fee", "fees"), ("transaction", "transactions")):
        router.add_api_route("/{contract_id}/" + resource, collection_endpoint(kind), methods=["POST"])
        router.add_api_route("/{contract_id}/" + resource + "/{item_id}", item_endpoint(kind, "update"), methods=["POST"])
        router.add_api_route("/{contract_id}/" + resource + "/{item_id}/delete", item_endpoint(kind, "delete"), methods=["POST"])

    def read_endpoint(kind):
        def handler(contract_id: int, request: Request, user=Depends(current_user)):
            try:
                with get_engine(request).begin() as connection:
                    _active_parent(connection, contract_id)
                    return result(request, connection, contract_id, kind)
            except ContractItemParentNotFound as error:
                return _catalog_error(request, 404, "contract_not_found", str(error))
            except (ValueError, TypeError, OverflowError) as error:
                return _catalog_error(request, 400, "invalid_contract_finance", str(error))
        return handler

    router.add_api_route("/{contract_id}/fees", read_endpoint("fee"), methods=["GET"])
    router.add_api_route("/{contract_id}/transactions", read_endpoint("transaction"), methods=["GET"])
    app.include_router(router)
