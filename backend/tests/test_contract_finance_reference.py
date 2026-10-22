"""Execute Sunrise finance fixtures against the disposable SQL Server target.

scripts/reference_contract_finance.mjs executes the immutable source schema,
functions, audit writer/difference package, handlers and browser render bodies.
SQLite is only the SOURCE oracle. The explicit SQL FLOAT/BIT storage boundary
rejects the source's empty/malformed numeric TEXT and non-Boolean invoice flags.
"""

from datetime import datetime
import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contract_finance import (
    add_contract_fee, add_contract_fee_category, add_contract_transaction,
    calculate_fee_amount, calculate_tax_amount, delete_contract_fee,
    delete_contract_transaction, get_available_contract_fees, get_contract_fees,
    get_contract_transactions, get_fees_by_fee_category,
    get_field_value_by_contract_type_field, get_transaction_total,
    update_contract_fee_quantity, update_contract_transaction,
)
from cemaris.contracts import delete_contract, get_contract
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


REFERENCE = json.loads((Path(__file__).parent / "fixtures/contract-finance-reference.json").read_text(encoding="utf-8"))
ACTOR = "synthetic-finance"
EDITOR = "synthetic-finance-editor"
FIXED_DATETIME = datetime(2026, 10, 20, 9, 5, 42)


def mapped(values, maps):
    result = dict(values)
    for key, value in values.items():
        if key in maps and value not in (None, ""):
            source = int(value) if isinstance(value, str) and value.isdigit() else value
            result[key] = maps[key].get(source, value)
    return result


def insert(connection, name, values):
    table = TABLES[name]
    values = {"recordCreate_username": ACTOR, "recordCreate_timeMillis": 1,
        "recordUpdate_username": ACTOR, "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    key = next((column.name for column in table.c if column.identity is not None), None)
    return (key, result.inserted_primary_key[0]) if key else (None, None)


def seed(connection):
    maps = {}
    for item in REFERENCE["seed"]:
        key, actual = insert(connection, item["table"], mapped(item["values"], maps))
        if key:
            maps.setdefault(key, {})[item["id"]] = actual
    return maps


def normalize(value, maps):
    if isinstance(value, list):
        return [normalize(item, maps) for item in value]
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key.startswith("record") and key != "recordIndex":
                continue
            if key in maps and not isinstance(item, (dict, list)):
                result[key] = {actual: source for source, actual in maps[key].items()}.get(item, item)
            else:
                result[key] = normalize(item, maps)
        return result
    return value


def raw(connection, name, maps):
    table = TABLES[name]
    rows = connection.execute(sa.select(table).order_by(*table.primary_key.columns)).mappings()
    return normalize([{**dict(row), "deleted": row["recordDelete_timeMillis"] is not None} for row in rows], maps)


def audit_rows(connection, maps):
    rows = []
    for row in connection.execute(sa.select(TABLES["AuditLog"])).mappings():
        value = {key: row[key] for key in ("mainRecordType", "mainRecordId", "updateTable", "recordIndex", "updateField", "updateType", "updateUsername")}
        for key in ("fromValue", "toValue"):
            value[key] = normalize(json.loads(row[key]), maps) if row[key] is not None else None
        field_map = maps.get(value["updateField"])
        if field_map:
            field_reverse = {actual: source for source, actual in field_map.items()}
            for key in ("fromValue", "toValue"):
                if not isinstance(value[key], (dict, list)):
                    value[key] = field_reverse.get(value[key], value[key])
        reverse = {actual: source for source, actual in maps["contractId"].items()}
        value["mainRecordId"] = str(reverse.get(int(value["mainRecordId"]), int(value["mainRecordId"])))
        if value["updateTable"] == "ContractFees":
            reverse_fee = {actual: source for source, actual in maps["feeId"].items()}
            value["recordIndex"] = str(reverse_fee.get(int(value["recordIndex"]), int(value["recordIndex"])))
        rows.append(value)
    return rows


def assert_audit(connection, maps, expected):
    # AuditLog has no public sequence. Compare full normalized source payloads,
    # including duplicate deletion, writer usernames, snapshots and differences.
    key = lambda row: (row["updateTable"], row["recordIndex"], row["updateType"], row["updateField"],
        json.dumps(row["fromValue"], sort_keys=True, ensure_ascii=False), json.dumps(row["toValue"], sort_keys=True, ensure_ascii=False))
    assert sorted(audit_rows(connection, maps), key=key) == sorted(expected, key=key)


@pytest.mark.parametrize("case", REFERENCE["calculations"])
def test_original_fee_function_zero_tax_precedence_and_unrounded_binary64(case):
    assert calculate_fee_amount(case["fee"], case["contract"]) == case["feeAmount"]
    assert calculate_tax_amount(case["fee"], case["feeAmount"]) == case["taxAmount"]


@pytest.mark.parametrize("case", REFERENCE["sharedHelpers"])
def test_original_contract_fee_category_field_lookup_and_transaction_total(case):
    assert get_fees_by_fee_category(case["contract"], case["feeCategory"]) == case["expected"]["exact"]
    assert get_fees_by_fee_category(case["contract"], case["feeCategory"], True) == case["expected"]["contains"]
    assert get_field_value_by_contract_type_field(case["contract"], case["contractTypeField"]) == case["expected"]["field"]
    assert get_transaction_total(case["contract"]) == case["expected"]["transactionTotal"]


@pytest.mark.parametrize("case", REFERENCE["feeDefaults"])
def test_original_fee_defaults_manual_string_vs_numeric_amounts_and_no_server_type_filter(sql_connection, case):
    connection, _ = sql_connection
    maps = seed(connection)
    assert add_contract_fee(connection, mapped(case["form"], maps), ACTOR, audit_enabled=True) == case["result"]
    assert raw(connection, "ContractFees", maps) == case["rows"]
    assert normalize(get_contract_fees(connection, maps["contractId"][1]), maps) == case["retrieved"]
    assert_audit(connection, maps, case["audit"])


def test_original_fee_merge_flatten_quantity_update_no_audit_repeat_delete_and_replacement(sql_connection):
    connection, _ = sql_connection
    maps = seed(connection)
    for case in REFERENCE["feeLifecycle"]:
        form = mapped(case["form"], maps)
        if case["action"] == "add":
            result = add_contract_fee(connection, form, ACTOR, audit_enabled=True)
        elif case["action"] == "quantity":
            result = update_contract_fee_quantity(connection, form, EDITOR, audit_enabled=True)
        else:
            result = delete_contract_fee(connection, form["contractId"], form["feeId"], EDITOR, audit_enabled=True)
        assert result == case["result"], case["action"]
        assert raw(connection, "ContractFees", maps) == case["rows"], case["action"]
        assert normalize(get_contract_fees(connection, maps["contractId"][1]), maps) == case["retrieved"]
        assert_audit(connection, maps, case["audit"])


@pytest.mark.parametrize("case", REFERENCE["categories"])
def test_original_available_fees_filter_by_saved_contract_and_burial_site_types(sql_connection, case):
    connection, _ = sql_connection
    maps = seed(connection)
    assert normalize(get_available_contract_fees(connection, maps["contractId"][case["contractId"]]), maps) == case["expected"]


def test_original_group_add_includes_other_types_repeats_and_missing_group_noop(sql_connection):
    connection, _ = sql_connection
    maps = seed(connection)
    for case in REFERENCE["categoryAdds"]:
        assert add_contract_fee_category(connection, mapped(case["form"], maps), ACTOR, audit_enabled=True) == case["result"]
        assert raw(connection, "ContractFees", maps) == case["rows"]
        assert normalize(get_contract_fees(connection, maps["contractId"][1]), maps) == case["retrieved"]
        assert_audit(connection, maps, case["audit"])


def test_original_catalog_change_leaves_position_amount_then_readd_merges_new_calculation(sql_connection):
    connection, _ = sql_connection
    maps = seed(connection)
    form = mapped({"contractId": 1, "feeId": 1, "quantity": 2}, maps)
    add_contract_fee(connection, form, ACTOR, audit_enabled=True)
    assert raw(connection, "ContractFees", maps) == REFERENCE["catalogChange"]["before"]
    fees = TABLES["Fees"]
    connection.execute(fees.update().where(fees.c.feeId == maps["feeId"][1]).values(feeAmount=20.125, taxPercentage=5))
    assert raw(connection, "ContractFees", maps) == REFERENCE["catalogChange"]["after"]
    add_contract_fee(connection, {**form, "quantity": 1}, EDITOR, audit_enabled=True)
    assert raw(connection, "ContractFees", maps) == REFERENCE["catalogChange"]["readded"]
    assert_audit(connection, maps, REFERENCE["catalogChange"]["audit"])


@pytest.mark.parametrize("case", REFERENCE["transactionDefaults"])
def test_original_transaction_unrounded_amount_default_clock_invoice_receipt_and_date_normalization(sql_connection, case):
    connection, _ = sql_connection
    maps = seed(connection)
    result = add_contract_transaction(connection, mapped(case["form"], maps), ACTOR,
        current_datetime=FIXED_DATETIME, audit_enabled=True)
    assert result == case["result"]
    assert raw(connection, "ContractTransactions", maps) == case["rows"]
    assert normalize(get_contract_transactions(connection, maps["contractId"][1]), maps) == case["retrieved"]
    assert_audit(connection, maps, case["audit"])


@pytest.mark.parametrize("case", REFERENCE["storageBoundaries"])
def test_original_sqlite_numeric_text_and_nonboolean_flags_have_explicit_sql_server_boundary(sql_connection, case):
    connection, _ = sql_connection
    maps = seed(connection)
    operation = add_contract_fee if case["table"] == "ContractFees" else add_contract_transaction
    with pytest.raises(ValueError):
        operation(connection, mapped(case["form"], maps), ACTOR, audit_enabled=True)
    assert raw(connection, case["table"], maps) == []
    assert audit_rows(connection, maps) == []


def test_original_transaction_index_includes_deleted_order_update_repeat_delete_and_cross_contract(sql_connection):
    connection, _ = sql_connection
    maps = seed(connection)
    for case in REFERENCE["transactionLifecycle"]:
        form = mapped(case["form"], maps)
        if case["action"] == "add":
            result = add_contract_transaction(connection, form, ACTOR, current_datetime=FIXED_DATETIME, audit_enabled=True)
        elif case["action"] == "update":
            result = update_contract_transaction(connection, form, EDITOR, audit_enabled=True)
        else:
            result = delete_contract_transaction(connection, form["contractId"], form["transactionIndex"], EDITOR, audit_enabled=True)
        assert result == case["result"], case["action"]
        assert raw(connection, "ContractTransactions", maps) == case["rows"], case["action"]
        assert normalize(get_contract_transactions(connection, maps["contractId"][1]), maps) == case["retrieved"]
        assert_audit(connection, maps, case["audit"])


def test_original_deleted_catalog_retains_fee_labels_and_parent_delete_retains_finance_rows(sql_connection):
    connection, _ = sql_connection
    maps = seed(connection)
    identifier = maps["contractId"][1]
    add_contract_fee(connection, mapped({"contractId": 1, "feeId": 1, "quantity": 1}, maps), ACTOR)
    add_contract_transaction(connection, mapped(REFERENCE["fullTransaction"], maps), ACTOR)
    for name, key in (("Fees", "feeId"), ("FeeCategories", "feeCategoryId")):
        table = TABLES[name]
        connection.execute(table.update().where(table.c[key] == maps[key][1]).values(recordDelete_timeMillis=1))
    expected = REFERENCE["deletionBoundaries"]
    assert normalize(get_contract_fees(connection, identifier), maps) == expected["deletedCatalog"]
    assert delete_contract(connection, identifier, EDITOR) == expected["deletedParentResult"]
    assert raw(connection, "ContractFees", maps) == expected["fees"]
    assert raw(connection, "ContractTransactions", maps) == expected["transactions"]
    assert normalize(get_contract_fees(connection, identifier), maps) == expected["retrievedFees"]
    assert normalize(get_contract_transactions(connection, identifier), maps) == expected["retrievedTransactions"]
    assert (get_contract(connection, identifier) is None) == expected["parentMissing"]


@pytest.fixture
def source_handler_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        maps = seed(connection)
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + EDITOR: "synthetic-password"}},
        session_directory=tmp_path / "sessions", can_login=[EDITOR], can_update_contracts=[EDITOR])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app, maps


@pytest.mark.parametrize("case", REFERENCE["handlers"])
def test_original_finance_handler_success_missing_rows_and_deleted_fee_validation_boundary(source_handler_app, case):
    app, maps = source_handler_app
    if case["existing"]:
        with app.state.db_engine.begin() as connection:
            if "Transaction" in case["handler"]:
                add_contract_transaction(connection, mapped(REFERENCE["fullTransaction"], maps), ACTOR)
            else:
                add_contract_fee(connection, mapped({"contractId": 1, "feeId": 1, "quantity": 1}, maps), ACTOR)
    with TestClient(app) as client:
        csrf = client.get("/api/session").json()["csrfToken"]
        login = client.post("/api/login", json={"username": EDITOR, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
        assert login.status_code == 200, login.text
        response = client.post("/api/contracts/" + case["handler"], json=mapped(case["body"], maps),
            headers={"X-CSRF-Token": login.json()["csrfToken"]})
        if case["expected"]["status"] == 500:
            # The fixed source throws on adding a deleted fee's missing catalog
            # object; the port reports controlled validation with no row inserted.
            assert response.status_code == 400, response.text
            assert response.json()["success"] is False
            with app.state.db_engine.connect() as connection:
                assert raw(connection, "ContractFees", maps) == []
        else:
            assert response.status_code == case["expected"]["status"], response.text
            body = normalize(response.json(), maps)
            if case["expected"]["body"]["success"]:
                assert body == case["expected"]["body"]
            else:
                assert {key: body[key] for key in case["expected"]["body"]} == case["expected"]["body"]
