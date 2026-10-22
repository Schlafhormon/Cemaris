"""Step-09 production UI/API verification on a fresh disposable SQL Server DB."""

import json
from pathlib import Path
import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES


def prepare(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    audit = {"recordCreate_username": "qa-fixture", "recordCreate_timeMillis": 1,
             "recordUpdate_username": "qa-fixture", "recordUpdate_timeMillis": 1}

    def add(table_name, **values):
        table = TABLES[table_name]
        identity = next(column for column in table.c if column.identity is not None)
        return connection.scalar(table.insert().values(**audit, **values).returning(identity))

    ids["variable_fee"] = add("Fees", feeCategoryId=ids["fee_category"], feeName="Synthetic variable <literal>",
        feeDescription="Manual amount\nSynthetic second line", feeAmount=None, includeQuantity=True,
        quantityUnit="hours", taxPercentage=19, orderNumber=1)
    ids["dynamic_fee"] = add("Fees", feeCategoryId=ids["fee_category"], feeName="Synthetic function",
        feeFunction="source-placeholder", feeAmount=999, taxAmount=2.5, orderNumber=2)
    ids["excluded_fee"] = add("Fees", feeCategoryId=ids["fee_category"], feeName="Synthetic excluded type",
        contractTypeId=add("ContractTypes", contractType="Other synthetic type"), feeAmount=99, orderNumber=3)
    ids["group_category"] = add("FeeCategories", feeCategory="Synthetic Group", isGroupedFee=True, orderNumber=1)
    ids["group_fee_one"] = add("Fees", feeCategoryId=ids["group_category"], feeName="Synthetic group one", feeAmount=10, taxAmount=1)
    ids["group_fee_two"] = add("Fees", feeCategoryId=ids["group_category"], feeName="Synthetic group two", feeAmount=20, taxPercentage=10, orderNumber=1)

    reference = json.loads((Path(__file__).resolve().parents[1] / "backend/tests/fixtures/contract-finance-reference.json").read_text(encoding="utf-8"))
    browser_cases = []
    for index, case in enumerate(reference["browserCases"]):
        if any(fee.get(key) is None for fee in case["fees"] for key in ("feeAmount", "taxAmount", "quantity")):
            browser_cases.append({"sourceIndex": index, "skipped": "Source renderer NULL case cannot be persisted in SQL Server NOT NULL finance columns"})
            continue
        contract_id = add("Contracts", contractTypeId=ids["contract_type"], contractNumber=f"SYN-ROUND-{index}",
            purchaserName=f"Synthetic original renderer case {index}", contractStartDate=20261020)
        fee_ids = []
        for fee in case["fees"]:
            fee_id = add("Fees", feeCategoryId=ids["fee_category"], feeName=fee["feeName"], includeQuantity=bool(fee["includeQuantity"]))
            fee_ids.append(fee_id)
            connection.execute(TABLES["ContractFees"].insert().values(**audit, contractId=contract_id, feeId=fee_id,
                quantity=fee["quantity"], feeAmount=fee["feeAmount"], taxAmount=fee["taxAmount"]))
        for transaction in case["transactions"]:
            connection.execute(TABLES["ContractTransactions"].insert().values(**audit, contractId=contract_id,
                transactionIndex=transaction["transactionIndex"], transactionDate=20261020, transactionTime=905,
                transactionAmount=transaction["transactionAmount"], isInvoiced=bool(transaction.get("isInvoiced", 0)),
                externalReceiptNumber=transaction["externalReceiptNumber"], transactionNote=""))
        browser_cases.append({"sourceIndex": index, "contractId": contract_id, "feeIds": fee_ids,
            "transactionIndices": [transaction["transactionIndex"] for transaction in case["transactions"]], "expected": case["expected"]})
    return {"CEMARIS_QA_CONTRACT_IDS": json.dumps(ids), "CEMARIS_QA_FINANCE_BROWSER_CASES": json.dumps(browser_cases)}


if __name__ == "__main__":
    main("09", "frontend/scripts/contract-finance-browser.mjs", {
        "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": "[]",
    }, prepare_database=prepare)
