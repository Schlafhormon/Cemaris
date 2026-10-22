"""Step-08 browser/API checks against a fresh disposable SQL Server database."""

import json
import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.preferences import update_setting


def prepare(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    update_setting(connection, "defaults.province", "BB")
    services = TABLES["ServiceTypes"]
    for key, caption in (("service_two", "Synthetic Second Service"), ("service_three", "Synthetic Third Service")):
        ids[key] = connection.scalar(services.insert().values(
            serviceType=caption, orderNumber=2, recordCreate_username="qa-fixture",
            recordCreate_timeMillis=1, recordUpdate_username="qa-fixture", recordUpdate_timeMillis=1,
        ).returning(services.c.serviceTypeId))
    connection.execute(TABLES["Cemeteries"].update().values(findagraveCemeteryId=12345))
    return {"CEMARIS_QA_CONTRACT_IDS": json.dumps(ids)}


if __name__ == "__main__":
    main("08", "frontend/scripts/contract-items-browser.mjs", {
        "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": "[]",
        "CEMARIS_CONTRACT_BURIAL_SITE_ID_IS_REQUIRED": "true",
    }, prepare_database=prepare)
