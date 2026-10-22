"""Fees and payments: real SQL persistence, permissions, CSRF and atomic writes."""

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contracts import add_contract, delete_contract, get_contract
from cemaris.contract_finance import (add_contract_fee, add_contract_fee_category,
    add_contract_transaction, delete_contract_fee, delete_contract_transaction,
    get_available_contract_fees, get_contract_fees, get_contract_transactions,
    update_contract_fee_quantity, update_contract_transaction)
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


def insert(connection, name, **values):
    table = TABLES[name]
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def setup(connection):
    type_id = insert(connection, "ContractTypes", contractType="Synthetic finance type")
    contract = add_contract(connection, {"contractTypeId": type_id, "contractStartDateString": "2026-10-20",
        "purchaserName": "Synthetic Finance"}, "creator")
    other = add_contract(connection, {"contractTypeId": type_id, "contractStartDateString": "2026-10-20",
        "purchaserName": "Synthetic Other"}, "creator")
    category = insert(connection, "FeeCategories", feeCategory="Synthetic fees")
    fee = insert(connection, "Fees", feeCategoryId=category, feeName="Synthetic charge", feeAmount=10.25,
        taxPercentage=19, includeQuantity=True, quantityUnit="hours")
    return {"contract": contract, "other": other, "category": category, "fee": fee}


def transaction_form(identifier, **values):
    return {"contractId": identifier, "transactionAmount": "12.34", "isInvoiced": "0",
        "transactionDateString": "2026-10-20", "transactionTimeString": "12:34",
        "externalReceiptNumber": "SYNTHETIC-001", "transactionNote": "Synthetic <literal>\nSecond line", **values}


def test_fee_lifecycle_amount_changes_deleted_history_and_audit(sql_connection):
    connection, _ = sql_connection
    ids = setup(connection)
    form = {"contractId": ids["contract"], "feeId": ids["fee"], "quantity": "1.5"}
    parent = get_contract(connection, ids["contract"])
    assert add_contract_fee(connection, form, "adder", audit_enabled=True)
    row = get_contract_fees(connection, ids["contract"])[0]
    assert row["feeAmount"] == 10.25 and row["quantity"] == 1.5
    assert row["taxAmount"] == 10.25 * (19 / 100)
    assert add_contract_fee(connection, form, "merger", audit_enabled=True)
    assert get_contract_fees(connection, ids["contract"])[0]["quantity"] == 3
    assert add_contract_fee(connection, {**form, "feeAmount": "20", "taxAmount": "2", "quantity": "2"}, "merger", audit_enabled=True)
    row = get_contract_fees(connection, ids["contract"])[0]
    assert row["feeAmount"] == 10.25 * 3 + 40 and row["quantity"] == 1
    assert row["taxAmount"] == (10.25 * (19 / 100)) * 3 + 4
    audit_count = connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"]))
    assert update_contract_fee_quantity(connection, {**form, "quantity": "0.5"}, "quantity", audit_enabled=True)
    # Original quantity-only updater deliberately writes no audit entry.
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == audit_count
    assert not update_contract_fee_quantity(connection, {**form, "contractId": ids["other"]}, "wrong")
    assert delete_contract_fee(connection, ids["contract"], ids["fee"], "deleter", audit_enabled=True)
    assert delete_contract_fee(connection, ids["contract"], ids["fee"], "repeat", audit_enabled=True)
    assert get_contract_fees(connection, ids["contract"]) == []
    assert not update_contract_fee_quantity(connection, form, "deleted")
    assert add_contract_fee(connection, form, "recreator", audit_enabled=True)
    table = TABLES["ContractFees"]
    raw = connection.execute(sa.select(table).where(table.c.contractId == ids["contract"])).mappings().one()
    assert raw["recordCreate_username"] == "recreator" and raw["recordDelete_timeMillis"] is None
    after = get_contract(connection, ids["contract"])
    for key in ("purchaserName", "contractStartDate", "recordUpdate_timeMillis", "burialSiteId"):
        assert after[key] == parent[key]


def test_transactions_ordering_index_flags_scope_soft_delete_and_audit(sql_connection):
    connection, _ = sql_connection
    ids = setup(connection)
    base = transaction_form(ids["contract"])
    assert add_contract_transaction(connection, base, "adder", audit_enabled=True) == 0
    assert add_contract_transaction(connection, {**base, "transactionTimeString": "00:00", "isInvoiced": "1",
        "transactionAmount": "-2.005"}, "adder", audit_enabled=True) == 1
    rows = get_contract_transactions(connection, ids["contract"])
    assert [row["transactionIndex"] for row in rows] == [1, 0]
    assert rows[0]["isInvoiced"] and rows[0]["transactionTimeString"] == "00:00"
    assert rows[0]["transactionAmount"] == -2.005
    assert not update_contract_transaction(connection, {**base, "contractId": ids["other"], "transactionIndex": 0}, "wrong")
    assert not delete_contract_transaction(connection, ids["other"], 0, "wrong")
    assert update_contract_transaction(connection, {**base, "transactionIndex": 0, "transactionAmount": "0",
        "isInvoiced": "1", "externalReceiptNumber": "", "transactionNote": ""}, "editor", audit_enabled=True)
    assert delete_contract_transaction(connection, ids["contract"], 1, "deleter", audit_enabled=True)
    assert delete_contract_transaction(connection, ids["contract"], 1, "repeat", audit_enabled=True)
    assert not update_contract_transaction(connection, {**base, "transactionIndex": 1}, "deleted")
    assert add_contract_transaction(connection, base, "adder") == 2
    rows = get_contract_transactions(connection, ids["contract"])
    assert [row["transactionIndex"] for row in rows] == [0, 2]
    assert rows[0]["transactionAmount"] == 0 and rows[0]["externalReceiptNumber"] == ""
    audit = connection.execute(sa.select(TABLES["AuditLog"]).where(TABLES["AuditLog"].c.updateTable == "ContractTransactions")).mappings().all()
    assert any(row["updateField"] == "isInvoiced" for row in audit)
    assert all(row["mainRecordType"] == "contract" and row["mainRecordId"] == str(ids["contract"]) for row in audit)


@pytest.fixture
def finance_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        ids = setup(connection)
    names = ["admin", "reader", "updater", "cemetery", "contract", "work"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"],
        can_update_cemeteries=["cemetery"], can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine, app.state.finance_ids = engine, ids
    return app


def login(client, name):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": name, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("name,allowed", [("admin", False), ("reader", False), ("updater", True),
    ("cemetery", False), ("contract", True), ("work", False)])
def test_http_independent_roles_csrf_source_actions(finance_app, name, allowed):
    ids = finance_app.state.finance_ids
    form = {**transaction_form(ids["contract"]), "feeId": ids["fee"], "feeCategoryId": ids["category"], "quantity": "1", "transactionIndex": 0}
    with TestClient(finance_app) as client:
        assert client.get(f'/api/contracts/{ids["contract"]}/fees').status_code == 401
        headers = login(client, name)
        for resource in ("fees", "transactions"):
            assert client.get(f'/api/contracts/{ids["contract"]}/{resource}').status_code == 200
        for action in ("GetFees", "AddContractFee", "AddContractFeeCategory", "UpdateContractFeeQuantity", "DeleteContractFee",
            "AddContractTransaction", "UpdateContractTransaction", "DeleteContractTransaction"):
            url = "/api/contracts/do" + action
            assert client.post(url, json=form).status_code == 403
            response = client.post(url, json=form, headers=headers)
            assert response.status_code == (200 if allowed else 403), response.text


@pytest.mark.parametrize("field,value", [("transactionAmount", "NaN"), ("transactionAmount", "Infinity"),
    ("transactionAmount", []), ("isInvoiced", "2"), ("externalReceiptNumber", "x" * 101),
    ("transactionDateString", "bad")])
def test_http_invalid_transaction_rolls_back(finance_app, field, value):
    ids = finance_app.state.finance_ids
    with TestClient(finance_app) as client:
        headers = login(client, "contract")
        response = client.post("/api/contracts/doAddContractTransaction", json=transaction_form(ids["contract"], **{field: value}), headers=headers)
        assert response.status_code == 400, response.text
        assert client.get(f'/api/contracts/{ids["contract"]}/transactions').json()["contractTransactions"] == []
    with finance_app.state.db_engine.connect() as connection:
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 0


@pytest.mark.parametrize("invalid_time", ["bad", "99:99"])
def test_add_invalid_time_source_fallback_is_midnight_but_update_rejects(finance_app, invalid_time):
    ids = finance_app.state.finance_ids
    with TestClient(finance_app) as client:
        headers = login(client, "contract")
        response = client.post("/api/contracts/doAddContractTransaction", json=transaction_form(ids["contract"], transactionTimeString=invalid_time), headers=headers)
        assert response.status_code == 200, response.text
        row = response.json()["contractTransactions"][0]
        assert row["transactionTime"] == 0 and row["transactionTimeString"] == "00:00"
        response = client.post("/api/contracts/doUpdateContractTransaction", json=transaction_form(ids["contract"], transactionIndex=row["transactionIndex"], transactionTimeString=invalid_time), headers=headers)
        assert response.status_code == 400, response.text


def test_http_scope_deleted_parent_and_group_atomic_rollback(finance_app):
    ids = finance_app.state.finance_ids
    with TestClient(finance_app) as client:
        headers = login(client, "contract")
        base = f'/api/contracts/{ids["contract"]}'
        response = client.post(base + "/fees", json={"contractId": ids["other"], "feeId": ids["fee"], "quantity": "1"}, headers=headers)
        assert response.status_code == 200, response.text
        assert client.get(f'/api/contracts/{ids["other"]}/fees').json()["contractFees"] == []
        before = client.get(base + "/fees").json()["contractFees"]
        with finance_app.state.db_engine.begin() as connection:
            insert(connection, "Fees", feeCategoryId=ids["category"], feeName="Synthetic invalid group member", feeAmount=float("1e308"), taxPercentage=1e308)
        response = client.post("/api/contracts/doAddContractFeeCategory", json={"contractId": ids["contract"], "feeCategoryId": ids["category"]}, headers=headers)
        assert response.status_code == 400, response.text
        assert client.get(base + "/fees").json()["contractFees"] == before
        with finance_app.state.db_engine.begin() as connection:
            delete_contract(connection, ids["other"], "deleter")
        response = client.post(f'/api/contracts/{ids["other"]}/transactions', json=transaction_form(ids["other"]), headers=headers)
        assert response.status_code == 404, response.text
