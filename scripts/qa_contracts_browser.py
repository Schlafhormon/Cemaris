"""Step-07 production browser/API checks on a fresh disposable SQL Server DB."""

import json
import sys
import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.preferences import update_setting


def prepare(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    connection.execute(TABLES["FuneralHomes"].update().values(isAvailableOnPortal=True))
    update_setting(connection, "defaults.province", "BB")
    sites = TABLES["BurialSites"]
    values = dict(connection.execute(sa.select(sites)).mappings().one())
    values.pop("burialSiteId")
    values.update(burialSiteName="QA-A-02", burialSiteNameSegment1="QA-A-02")
    ids["second_site"] = connection.scalar(sites.insert().values(**values).returning(sites.c.burialSiteId))
    # Exercise full/partial dates and both Find-a-Grave link variants in read view.
    connection.execute(TABLES["Cemeteries"].update().values(findagraveCemeteryId=12345))
    connection.execute(TABLES["ContractInterments"].update().values(findagraveMemorialId=67890))
    return {"CEMARIS_QA_CONTRACT_IDS": json.dumps(ids)}


if __name__ == "__main__":
    extra = "--extra" in sys.argv
    main("07extra" if extra else "07", "frontend/scripts/contracts-extra-browser.mjs" if extra else "frontend/scripts/contracts-browser.mjs", {
        "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": '["qa-admin"]',
        "CEMARIS_PORTAL_ENABLED": "false" if extra else "true",
        "CEMARIS_CONTRACT_BURIAL_SITE_ID_IS_REQUIRED": "true",
    }, prepare_database=prepare)
