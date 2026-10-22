"""Step-12 reports/dashboard browser QA using a disposable SQL Server database."""
import json
import time

import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES


def prepare(connection):
    name = connection.scalar(sa.text('SELECT DB_NAME()'))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    recent = time.time_ns() // 1_000_000
    for table in TABLES.values():
        if 'recordUpdate_timeMillis' in table.c:
            connection.execute(table.update().values(recordUpdate_timeMillis=recent))
    connection.execute(TABLES['Cemeteries'].update().where(TABLES['Cemeteries'].c.cemeteryId == ids['cemetery']).values(cemeteryName='Synthetic, "Cemetery" 🪦'))
    for index in range(23):
        connection.execute(TABLES['ContractComments'].insert().values(contractId=ids['contract'], commentDate=20261020,
            commentTime=1200, comment=f'Synthetic recent comment {index:02d} <literal> 🪦',
            recordCreate_username='qa-fixture', recordUpdate_username='qa-fixture', recordCreate_timeMillis=recent-index*1000,
            recordUpdate_timeMillis=recent-index*1000))
    return {'CEMARIS_QA_REPORT_IDS': json.dumps(ids)}


if __name__ == '__main__':
    main('12', 'frontend/scripts/reports-browser.mjs', {
        'CEMARIS_AUTH_CAN_UPDATE_CONTRACTS': '["qa-admin"]',
        'CEMARIS_AUTH_CAN_UPDATE_WORK_ORDERS': '["qa-admin"]',
        'CEMARIS_AUTH_CAN_UPDATE_CEMETERIES': '["qa-admin"]',
    }, prepare_database=prepare)
