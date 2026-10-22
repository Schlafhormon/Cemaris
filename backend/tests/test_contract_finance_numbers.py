"""SQL FLOAT/BIT boundaries must not silently coerce SQLite TEXT or booleans.

An isolated node:sqlite probe with DECIMAL/bit columns confirms that strings
with underscores, Unicode digits/spaces, or no digits remain TEXT. ASCII
decimal/exponent strings become numeric. Boolean bindings raise
ERR_INVALID_ARG_TYPE. SQL Server rejection is verified separately below.
"""

from datetime import datetime
import math

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contract_finance import _stored_number, _transaction_values
from cemaris.contracts import add_contract
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


@pytest.mark.parametrize("value,expected", [("0", 0), ("-0", 0), ("+1", 1), ("01.00", 1),
    (".5", 0.5), ("-.5", -0.5), ("1.", 1), ("1e2", 100), ("1.E-2", 0.01),
    (" \t\n\r\v\f+12.5E-1\f\v\r\n\t ", 1.25), (0, 0), (-1, -1), (1.005, 1.005),
    (float.fromhex("0x1.fffffffffffffp+1023"), float.fromhex("0x1.fffffffffffffp+1023"))])
def test_sqlite_numeric_ascii_decimal_and_exponent_strings_remain_binary64(value, expected):
    assert _stored_number(value) == expected
    assert isinstance(_stored_number(value), float)


@pytest.mark.parametrize("value", ["1_0", "١٠", "１２", "\u00a01\u00a0", "\u20031\u2003",
    "", " ", "\t\n\r\v\f", "1e", "1e+", ".", "0x10", "1,5", "1\x00", "\x1c1",
    "NaN", "Infinity", "1e999", True, False, None, [], {}, (), b"1", math.nan, math.inf, -math.inf])
def test_sql_float_rejects_sqlite_numeric_text_nonfinite_and_unsupported_bindings(value):
    with pytest.raises(ValueError):
        _stored_number(value)


def transaction_form(**values):
    return {"transactionAmount": "1", "externalReceiptNumber": "SYNTHETIC-NUMBERS", "transactionNote": "Synthetic numeric boundary",
        "transactionDateString": "2026-10-20", "transactionTimeString": "12:34", **values}


@pytest.mark.parametrize("adding", [False, True])
@pytest.mark.parametrize("value", ["", " ", "1_0", "١", "0x0", True, False, [], {}, 2, -1, 0.5])
def test_invoice_flag_rejects_explicit_text_and_boolean_bindings_on_add_and_update(adding, value):
    with pytest.raises(ValueError):
        _transaction_values(transaction_form(isInvoiced=value), adding=adding)


@pytest.mark.parametrize("adding", [False, True])
@pytest.mark.parametrize("values,expected", [({}, False), ({"isInvoiced": None}, False), ({"isInvoiced": 0}, False),
    ({"isInvoiced": 1}, True), ({"isInvoiced": "0"}, False), ({"isInvoiced": "1"}, True),
    ({"isInvoiced": " +1.0e0\t"}, True), ({"isInvoiced": "-0.0"}, False)])
def test_invoice_flag_preserves_nullish_default_and_numeric_zero_one(adding, values, expected):
    assert _transaction_values(transaction_form(**values), adding=adding,
        current_datetime=datetime(2026, 10, 20, 12, 34))["isInvoiced"] is expected


@pytest.fixture
def numeric_finance_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    audit = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
        "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1}
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        type_id = connection.execute(TABLES["ContractTypes"].insert().values(contractType="Synthetic numbers", **audit)).inserted_primary_key[0]
        identifier = add_contract(connection, {"contractTypeId": type_id, "contractStartDateString": "2026-10-20"}, "fixture")
        category = connection.execute(TABLES["FeeCategories"].insert().values(feeCategory="Synthetic numbers", **audit)).inserted_primary_key[0]
        fee = connection.execute(TABLES["Fees"].insert().values(feeCategoryId=category, feeName="Synthetic number fee", feeAmount=1,
            includeQuantity=True, **audit)).inserted_primary_key[0]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\finance": "synthetic-password"}},
        session_directory=tmp_path / "sessions", can_login=["finance"], can_update_contracts=["finance"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app, identifier, fee


def test_http_numeric_text_boolean_and_empty_invoice_rejections_leave_rows_and_audit_unchanged(numeric_finance_app):
    app, identifier, fee = numeric_finance_app
    with TestClient(app) as client:
        csrf = client.get("/api/session").json()["csrfToken"]
        response = client.post("/api/login", json={"username": "finance", "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
        assert response.status_code == 200, response.text
        headers = {"X-CSRF-Token": response.json()["csrfToken"]}
        for value in ("1_0", "١٠", "１２", "\u00a01\u00a0", True, False, [], {}):
            response = client.post("/api/contracts/doAddContractFee", json={"contractId": identifier, "feeId": fee, "quantity": value}, headers=headers)
            assert response.status_code == 400, response.text
            response = client.post("/api/contracts/doAddContractTransaction", json={"contractId": identifier, **transaction_form(transactionAmount=value)}, headers=headers)
            assert response.status_code == 400, response.text
        for value in ("", " ", True, False):
            response = client.post("/api/contracts/doAddContractTransaction", json={"contractId": identifier, **transaction_form(isInvoiced=value)}, headers=headers)
            assert response.status_code == 400, response.text
        assert client.get(f"/api/contracts/{identifier}/fees").json()["contractFees"] == []
        assert client.get(f"/api/contracts/{identifier}/transactions").json()["contractTransactions"] == []
        with app.state.db_engine.connect() as connection:
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 0

        response = client.post("/api/contracts/doAddContractTransaction", json={"contractId": identifier, **transaction_form(transactionAmount="\t1.5e1\r")}, headers=headers)
        assert response.status_code == 200, response.text
        before = response.json()["contractTransactions"]
        assert before[0]["transactionAmount"] == 15 and not before[0]["isInvoiced"]
        with app.state.db_engine.connect() as connection:
            audit_count = connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"]))
        for value in ("", " ", True, False):
            response = client.post("/api/contracts/doUpdateContractTransaction", json={"contractId": identifier,
                "transactionIndex": before[0]["transactionIndex"], **transaction_form(isInvoiced=value)}, headers=headers)
            assert response.status_code == 400, response.text
        assert client.get(f"/api/contracts/{identifier}/transactions").json()["contractTransactions"] == before
        with app.state.db_engine.connect() as connection:
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == audit_count
