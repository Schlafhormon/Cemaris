"""Step-11 production document UI/API QA on a disposable SQL Server database."""

import json
from pathlib import Path
from uuid import uuid4

import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES


def prepare(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    # The schema fixture deliberately carries a nonexistent file reference.
    # Document QA starts empty and writes only its own synthetic byte samples.
    connection.execute(TABLES["ContractAttachments"].delete())
    connection.execute(TABLES["ContractTypePrints"].insert().values(
        contractTypeId=ids["contract_type"], printEJS="pdf/synthetic", orderNumber=1,
        recordCreate_username="qa-fixture", recordUpdate_username="qa-fixture",
        recordCreate_timeMillis=1, recordUpdate_timeMillis=1))
    return {"CEMARIS_QA_DOCUMENT_IDS": json.dumps(ids)}


if __name__ == "__main__":
    qa = Path(__file__).resolve().parents[1] / ".local" / "qa-step11"
    main("11", "frontend/scripts/documents-browser.mjs", {
        "CEMARIS_APP_URL": "http://127.0.0.1:4173",
        "CEMARIS_ATTACHMENTS_PATH": str(qa / ("attachments-" + uuid4().hex)),
        "CEMARIS_MAX_ATTACHMENT_FILE_SIZE": "1",
        "CEMARIS_CUSTOMIZATIONS_PATH": str(qa.parents[1] / "backend/tests/fixtures/printing-customizations"),
        "CEMARIS_CONTRACT_PRINTS": '["screen/contract","pdf/synthetic"]',
        "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_WORK_ORDERS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": "[]",
    }, prepare_database=prepare)
