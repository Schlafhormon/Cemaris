"""Step-10 production UI/API verification on a disposable SQL Server database."""

import json
from datetime import date, timedelta
import sqlalchemy as sa

from qa_auth_browser import main
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.preferences import update_setting


def prepare(connection):
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    audit = {"recordCreate_username": "qa-fixture", "recordCreate_timeMillis": 1,
             "recordUpdate_username": "qa-fixture", "recordUpdate_timeMillis": 1}

    def add(table_name, **values):
        table = TABLES[table_name]
        identity = next(column for column in table.c if column.identity is not None)
        return connection.scalar(table.insert().values(**audit, **values).returning(identity))

    def number(value):
        return int(value.strftime("%Y%m%d"))

    ids["work_order_type_two"] = add("WorkOrderTypes", workOrderType="Synthetic Maintenance", orderNumber=2)
    ids["work_order_status_two"] = add("WorkOrderStatuses", workOrderStatus="Synthetic In Progress", orderNumber=2)
    ids["milestone_type_two"] = add("WorkOrderMilestoneTypes", workOrderMilestoneType="Synthetic Preparation", orderNumber=2)
    ids["milestone_type_three"] = add("WorkOrderMilestoneTypes", workOrderMilestoneType="Synthetic Completion", orderNumber=3)
    ids["burial_site_status_two"] = add("BurialSiteStatuses", burialSiteStatus="Synthetic Prepared", orderNumber=2)
    update_setting(connection, "aliases.workOrderOpenDate", "Synthetic Open Date")
    update_setting(connection, "aliases.workOrderCloseDate", "Synthetic Close Date")
    current = date.today()
    connection.execute(TABLES["WorkOrderMilestones"].update().where(
        TABLES["WorkOrderMilestones"].c.workOrderMilestoneId == ids["work_order_milestone"]
    ).values(workOrderMilestoneDate=number(current), workOrderMilestoneTime=915))
    connection.execute(TABLES["WorkOrders"].update().where(TABLES["WorkOrders"].c.workOrderId == ids["work_order"])
                       .values(workOrderOpenDate=number(current - timedelta(days=3))))
    for index in range(53):
        add("WorkOrders", workOrderTypeId=ids["work_order_type_two"],
            workOrderStatusId=ids["work_order_status"], workOrderNumber=f"SYN-PAGE-{index:02d}",
            workOrderDescription="Synthetic pagination fixture", workOrderOpenDate=number(current))
    for weekday in range(7):
        update_setting(connection, f"workOrder.workDay.{weekday}.startHour", "8")
        update_setting(connection, f"workOrder.workDay.{weekday}.endHour", "16")
    return {"CEMARIS_QA_WORK_ORDER_IDS": json.dumps(ids)}


if __name__ == "__main__":
    main("10", "frontend/scripts/work-orders-browser.mjs", {
        "CEMARIS_APP_URL": "http://127.0.0.1:4173",
        "CEMARIS_AUTH_CAN_UPDATE_WORK_ORDERS": '["qa-admin","qa-writer"]',
        "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": "[]",
        "CEMARIS_AUTH_CAN_LOGIN": '["qa-admin","qa-reader","qa-writer"]',
        "CEMARIS_AUTH_CONFIG": json.dumps({"users": {
            "\\qa-admin": "synthetic-qa-password", "\\qa-reader": "synthetic-reader-password",
            "\\qa-writer": "synthetic-writer-password",
        }}),
    }, prepare_database=prepare)
