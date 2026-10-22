"""Work order workflows against isolated disposable Microsoft SQL Server."""
from datetime import date
from time import perf_counter

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions
from cemaris.db.schema import TABLES
from cemaris.work_orders import (WorkOrderOptions, WorkOrderParentNotFound, add_work_order, update_work_order, close_work_order,
    reopen_work_order, delete_work_order, get_work_order, get_work_orders, get_work_order_comments, get_work_order_milestones,
    get_next_work_order_number, milestone_values, work_order_values, add_work_order_milestone, mutate_work_order_milestone,
    mutate_work_order_comment, mutate_work_order_relation)


def insert(connection, name, **values):
    table = TABLES[name]
    values = {**{column.name: "" for column in table.c if not column.nullable and column.server_default is None
        and isinstance(column.type, sa.String)}, **values}
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def seed(connection):
    type_id = insert(connection, "WorkOrderTypes", workOrderType="Synthetic order")
    status = insert(connection, "WorkOrderStatuses", workOrderStatus="Synthetic status")
    milestone_type = insert(connection, "WorkOrderMilestoneTypes", workOrderMilestoneType="Synthetic milestone")
    site_type = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic site type")
    site_status = insert(connection, "BurialSiteStatuses", burialSiteStatus="Synthetic available")
    cemetery = insert(connection, "Cemeteries", cemeteryName="Synthetic cemetery")
    child = insert(connection, "Cemeteries", cemeteryName="Synthetic child", parentCemeteryId=cemetery)
    site = insert(connection, "BurialSites", burialSiteName="Synthetic 🪦 01", burialSiteTypeId=site_type, cemeteryId=child, burialSiteStatusId=site_status)
    contract_type = insert(connection, "ContractTypes", contractType="Synthetic contract")
    funeral_home = insert(connection, "FuneralHomes", funeralHomeName="Synthetic funeral home")
    contract = insert(connection, "Contracts", contractNumber="SYNTHETIC", contractTypeId=contract_type, burialSiteId=site,
        funeralHomeId=funeral_home, contractStartDate=20260101)
    insert(connection, "ContractInterments", contractId=contract, intermentNumber=1, deceasedName="Synthetic Alpha Beta")
    return dict(type=type_id, status=status, milestone_type=milestone_type, site=site, site_status=site_status, contract=contract,
        cemetery=cemetery, funeral_home=funeral_home)


def order_form(ids, **values):
    return {"workOrderTypeId": ids["type"], "workOrderStatusId": ids["status"], "workOrderDescription": "Synthetic description",
        "workOrderOpenDateString": "2026-10-20", **values}


def milestone_form(identifier, **values):
    return {"workOrderId": identifier, "workOrderMilestoneTypeId": "", "workOrderMilestoneDescription": "Synthetic milestone",
        "workOrderMilestoneDateString": "2026-10-20", "workOrderMilestoneTimeString": "", **values}


@pytest.mark.parametrize("adding,expected", [(True, 20261020), (False, 0)])
def test_milestone_blank_date_source_asymmetry(adding, expected):
    values = milestone_values(milestone_form(1, workOrderMilestoneDateString=""), adding=adding, current_date=date(2026, 10, 20))
    assert values["workOrderMilestoneDate"] == expected
    assert values["workOrderMilestoneTime"] is None and values["workOrderMilestoneTypeId"] is None


@pytest.mark.parametrize("patch", [{"workOrderMilestoneTimeString": "24:00"}, {"workOrderMilestoneDateString": "bad"},
    {"workOrderMilestoneTypeId": "1.5"}, {"workOrderMilestoneTypeId": str(2**63)}, {"workOrderMilestoneDescription": []},
    {"workOrderMilestoneTypeId": True}, {"workOrderMilestoneCompletionDateString": "bad"}, {"workOrderMilestoneCompletionTimeString": "25:00"}])
def test_milestone_sql_storage_bounds(patch):
    with pytest.raises((ValueError, TypeError)):
        milestone_values(milestone_form(1, **patch), adding=True)


@pytest.mark.parametrize("patch", [{"workOrderTypeId": ""}, {"workOrderStatusId": "1.5"}, {"workOrderNumber": "🪦" * 26},
    {"workOrderTypeId": True}, {"workOrderOpenDateString": ""}, {"workOrderOpenDateString": "bad"}, {"workOrderDescription": []}])
def test_order_sql_storage_bounds(patch):
    with pytest.raises((ValueError, TypeError)):
        work_order_values({**order_form({"type": 1, "status": 1}, workOrderNumber="2026-000001"), **patch})


def test_order_lifecycle_numbering_nested_creation_history_and_audit(sql_connection):
    connection, _ = sql_connection
    ids = seed(connection)
    suffix = str(ids["milestone_type"])
    form = order_form(ids, contractId=ids["contract"], **{"workOrderMilestoneId_" + suffix: suffix,
        "workOrderMilestoneDateString_" + suffix: "", "workOrderMilestoneTimeString_" + suffix: "00:00",
        "workOrderMilestoneDescription_" + suffix: "Nested synthetic"})
    identifier = add_work_order(connection, form, "adder", audit_enabled=True, current_date=date(2026, 10, 20))
    record = get_work_order(connection, identifier)
    assert record["workOrderNumber"] == "2026-000001"
    assert record["workOrderContracts"][0]["contractId"] == ids["contract"]
    assert record["workOrderBurialSites"] == []
    assert record["workOrderMilestones"][0]["workOrderMilestoneTime"] == 0
    assert record["workOrderMilestones"][0]["workOrderMilestoneDate"] == 20261020
    assert get_work_order(connection, record["workOrderNumber"], by_number=True)["workOrderId"] == identifier
    assert get_work_order(connection, record["workOrderNumber"] + " ", by_number=True) is None
    assert update_work_order(connection, order_form(ids, workOrderId=identifier, workOrderNumber="2026-999", workOrderDescription="Edited\n<script>"), "editor", audit_enabled=True)
    assert close_work_order(connection, {"workOrderId": identifier, "workOrderCloseDateString": "2026-10-22"}, "closer", audit_enabled=True)
    assert close_work_order(connection, {"workOrderId": identifier}, "closer", current_date=20261023)
    assert get_work_order(connection, identifier)["workOrderCloseDate"] == 20261023
    assert reopen_work_order(connection, identifier, "opener", audit_enabled=True)
    assert not reopen_work_order(connection, identifier, "opener")
    assert delete_work_order(connection, identifier, "deleter", audit_enabled=True)
    assert not delete_work_order(connection, identifier, "repeat")
    assert get_work_order(connection, identifier) is None
    assert get_next_work_order_number(connection, current_date=20261020) == "2026-001000"
    for table_name in ("WorkOrders", "WorkOrderMilestones", "WorkOrderContracts"):
        table = TABLES[table_name]
        assert connection.scalar(sa.select(sa.func.count()).select_from(table).where(table.c.workOrderId == identifier, table.c.recordDelete_timeMillis.is_(None))) == 0
    log = connection.execute(sa.select(TABLES["AuditLog"])).mappings().all()
    assert all(row["mainRecordId"] == str(identifier) and row["mainRecordType"] == "workOrder" for row in log)
    assert any(row["updateType"] == "created" and row["updateTable"] == "WorkOrderContracts" for row in log)
    assert any(row["updateField"] == "workOrderDescription" and row["toValue"] == '"Edited\\n<script>"' for row in log)


def test_milestone_lifecycle_sorting_filters_counts_parent_scope_and_deleted_rows(sql_connection):
    connection, _ = sql_connection
    ids = seed(connection)
    identifier = add_work_order(connection, order_form(ids), "creator")
    other = add_work_order(connection, order_form(ids), "creator")
    early = add_work_order_milestone(connection, milestone_form(identifier, workOrderMilestoneTimeString="00:00", workOrderMilestoneTypeId=ids["milestone_type"]), "adder", audit_enabled=True)
    all_day = add_work_order_milestone(connection, milestone_form(identifier), "adder")
    assert [row["workOrderMilestoneId"] for row in get_work_order_milestones(connection, {"workOrderId": identifier})] == [early, all_day]
    assert not mutate_work_order_milestone(connection, "update", milestone_form(other, workOrderMilestoneId=early), "wrong")
    assert mutate_work_order_milestone(connection, "update", milestone_form(identifier, workOrderMilestoneId=early, workOrderMilestoneDateString=""), "editor", audit_enabled=True)
    assert get_work_order_milestones(connection, {"workOrderMilestoneDateFilter": "blank"})[0]["workOrderMilestoneId"] == early
    assert mutate_work_order_milestone(connection, "complete", {"workOrderId": identifier, "workOrderMilestoneId": early,
        "workOrderMilestoneCompletionDateString": "2026-10-21", "workOrderMilestoneCompletionTimeString": "00:00"}, "completer", audit_enabled=True)
    completed = get_work_order_milestones(connection, {"workOrderId": identifier}, order_by="completion")
    assert [row["workOrderMilestoneId"] for row in completed] == [all_day, early]
    assert completed[1]["workOrderMilestoneCompletionTime"] == 0
    assert mutate_work_order_milestone(connection, "reopen", {"workOrderMilestoneId": early}, "opener", audit_enabled=True)
    assert not mutate_work_order_milestone(connection, "reopen", {"workOrderMilestoneId": early}, "repeat")
    assert mutate_work_order_milestone(connection, "time", {"workOrderMilestoneId": early, "workOrderMilestoneDateString": "", "workOrderMilestoneTimeString": "13:05"}, "mover", current_date=20261019, audit_enabled=True)
    result = get_work_orders(connection, {"workOrderMilestoneDateString": "2026-10-19"}, limit=-1, current_date=20261020)["workOrders"]
    assert len(result) == 1 and result[0]["workOrderMilestoneOverdueCount"] == 1
    assert result[0]["workOrderMilestoneCompletionCount"] == 0
    assert mutate_work_order_milestone(connection, "delete", {"workOrderMilestoneId": early}, "deleter", audit_enabled=True)
    assert not mutate_work_order_milestone(connection, "delete", {"workOrderMilestoneId": early}, "repeat")
    assert mutate_work_order_milestone(connection, "complete", {"workOrderMilestoneId": early}, "historical", current_date=20261022, current_time=0)
    assert all(row["workOrderMilestoneId"] != early for row in get_work_order_milestones(connection))
    delete_work_order(connection, identifier, "deleter")
    with pytest.raises(WorkOrderParentNotFound):
        mutate_work_order_milestone(connection, "complete", {"workOrderMilestoneId": all_day}, "blocked")


def test_relations_duplicate_restore_comments_and_source_search(sql_connection):
    connection, _ = sql_connection
    ids = seed(connection)
    identifier = add_work_order(connection, order_form(ids), "creator")
    other = add_work_order(connection, order_form(ids), "creator")
    for kind, key in (("contract", "contractId"), ("burial", "burialSiteId")):
        item = ids["contract" if kind == "contract" else "site"]
        form = {"workOrderId": identifier, key: item}
        assert mutate_work_order_relation(connection, "add", form, "adder", kind=kind, audit_enabled=True)
        assert mutate_work_order_relation(connection, "add", form, "duplicate", kind=kind, audit_enabled=True)
        table = TABLES["WorkOrderContracts" if kind == "contract" else "WorkOrderBurialSites"]
        assert connection.scalar(sa.select(table.c.recordCreate_username).where(table.c.workOrderId == identifier)) == "adder"
        assert mutate_work_order_relation(connection, "delete", form, "deleter", kind=kind, audit_enabled=True)
        assert mutate_work_order_relation(connection, "delete", form, "repeat", kind=kind, audit_enabled=True)
        assert mutate_work_order_relation(connection, "add", form, "restorer", kind=kind, audit_enabled=True)
        assert connection.scalar(sa.select(table.c.recordCreate_username).where(table.c.workOrderId == identifier)) == "restorer"
    for filters in ({"contractId": ids["contract"]}, {"deceasedName": "beta ALPHA"}, {"burialSiteName": "🪦 SYNTHETIC"},
        {"cemeteryId": ids["cemetery"]}, {"funeralHomeId": ids["funeral_home"]}):
        assert [row["workOrderId"] for row in get_work_orders(connection, filters, limit=-1)["workOrders"]] == [identifier]
    first = mutate_work_order_comment(connection, "add", {"workOrderId": identifier, "comment": "Line1\n<script>🪦"}, "adder", current_date=20261020, current_time=0, audit_enabled=True)
    assert not mutate_work_order_comment(connection, "update", {"workOrderId": other, "workOrderCommentId": first}, "wrong")
    assert mutate_work_order_comment(connection, "update", {"workOrderId": identifier, "workOrderCommentId": first, "comment": "Edited",
        "commentDateString": "2026-10-19", "commentTimeString": "00:00"}, "editor", audit_enabled=True)
    comment = get_work_order_comments(connection, identifier)[0]
    assert comment["commentDate"] == 20261019 and comment["commentTime"] == 0
    assert mutate_work_order_comment(connection, "delete", {"workOrderId": identifier, "workOrderCommentId": first}, "deleter", audit_enabled=True)
    assert not mutate_work_order_comment(connection, "delete", {"workOrderId": identifier, "workOrderCommentId": first}, "repeat")
    assert get_work_order_comments(connection, identifier) == []


def test_large_empty_order_pages_keep_counts_sort_pagination_and_inclusions(sql_connection):
    connection, _ = sql_connection
    ids = seed(connection)
    values = [{"workOrderTypeId": ids["type"], "workOrderStatusId": ids["status"], "workOrderNumber": f"PERF-{index:04d}",
        "workOrderDescription": "Synthetic pagination fixture", "workOrderOpenDate": 20261020,
        "recordCreate_username": "fixture", "recordCreate_timeMillis": 1, "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1}
        for index in range(520)]
    connection.execute(TABLES["WorkOrders"].insert(), values)
    identifier = connection.scalar(sa.select(TABLES["WorkOrders"].c.workOrderId).where(TABLES["WorkOrders"].c.workOrderNumber == "PERF-0519"))
    # Soft-deleted children leave this order empty, just as orders which never
    # had children. They must not leak into grouped counts or inclusions.
    milestone = add_work_order_milestone(connection, milestone_form(identifier), "fixture")
    mutate_work_order_milestone(connection, "delete", {"workOrderMilestoneId": milestone}, "fixture")
    comment = mutate_work_order_comment(connection, "add", {"workOrderId": identifier, "comment": "Deleted fixture"}, "fixture")
    mutate_work_order_comment(connection, "delete", {"workOrderId": identifier, "workOrderCommentId": comment}, "fixture")
    for kind, key, item in (("contract", "contractId", ids["contract"]), ("burial", "burialSiteId", ids["site"])):
        form = {"workOrderId": identifier, key: item}
        mutate_work_order_relation(connection, "add", form, "fixture", kind=kind)
        mutate_work_order_relation(connection, "delete", form, "fixture", kind=kind)
    expected = [f"PERF-{index:04d}" for index in reversed(range(520))]
    for limit in (50, 100, 250, 500):
        started = perf_counter()
        result = get_work_orders(connection, limit=limit, current_date=20261020)
        elapsed = perf_counter() - started
        assert result["count"] == 520 and len(result["workOrders"]) == limit
        assert [row["workOrderNumber"] for row in result["workOrders"]] == expected[:limit]
        assert all(row["workOrderMilestoneCount"] == row["workOrderMilestoneCompletionCount"] == row["workOrderMilestoneOverdueCount"] == row["workOrderBurialSiteCount"] == 0
            and row["workOrderContracts"] == row["workOrderBurialSites"] == [] for row in result["workOrders"])
        print(f"work-order page limit={limit} count={result['count']} returned={len(result['workOrders'])} elapsed={elapsed:.4f}s")
    result = get_work_orders(connection, limit=100, offset=25, include_comments=True, include_milestones=True, current_date=20261020)
    assert [row["workOrderNumber"] for row in result["workOrders"]] == expected[25:125]
    assert all(row["workOrderComments"] == row["workOrderMilestones"] == [] for row in result["workOrders"])


@pytest.fixture
def work_order_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES.values()):
            connection.execute(table.delete())
        ids = seed(connection)
        ids["order"] = add_work_order(connection, order_form(ids), "creator")
        ids["milestone"] = add_work_order_milestone(connection, milestone_form(ids["order"]), "creator")
        ids["comment"] = mutate_work_order_comment(connection, "add", {"workOrderId": ids["order"], "comment": "Initial"}, "creator")
    names = ["admin", "reader", "updater", "cemetery", "contract", "work"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"],
        can_update_cemeteries=["cemetery"], can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine, app.state.test_ids = engine, ids
    return app


def login(client, name="work"):
    token = client.get("/api/session").json()["csrfToken"]
    result = client.post("/api/login", json={"username": name, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert result.status_code == 200, result.text
    return {"X-CSRF-Token": result.json()["csrfToken"]}


@pytest.mark.parametrize("name,allowed", [("admin", False), ("reader", False), ("updater", True), ("cemetery", False), ("contract", False), ("work", True)])
def test_http_read_mutation_independent_roles_csrf(work_order_app, name, allowed):
    ids = work_order_app.state.test_ids
    with TestClient(work_order_app) as client:
        assert client.get("/api/work-orders/catalogs").status_code == 401
        headers = login(client, name)
        options = client.get("/api/work-orders/catalogs").json()
        assert options["canUpdate"] == allowed
        assert "workOrderWorkDayRanges" in options and "aliases" in options
        assert client.get("/api/contracts/options").json()["options"]["workOrderAliases"] == options["aliases"]
        assert client.get(f'/api/work-orders/{ids["order"]}').status_code == 200
        assert client.post("/api/work-orders/doSearchWorkOrders", json={"limit": 50, "offset": 0}, headers=headers).status_code == 200
        form = {"workOrderId": ids["order"], "burialSiteId": ids["site"], "burialSiteStatusId": ids["site_status"]}
        assert client.post("/api/work-orders/doUpdateBurialSiteStatus", json=form).status_code == 403
        assert client.post("/api/work-orders/doUpdateBurialSiteStatus", json=form, headers=headers).status_code == (200 if allowed else 403)
        assert client.get("/api/work-orders/new").status_code == (200 if allowed else 403)


def test_http_source_actions_workday_status_audit_and_delete(work_order_app):
    ids = work_order_app.state.test_ids
    identifier = ids["order"]
    with TestClient(work_order_app) as client:
        headers = login(client)
        def post(action, **patch):
            response = client.post("/api/work-orders/" + action, json={"workOrderId": identifier, **patch}, headers=headers)
            assert response.status_code == 200, response.text
            return response.json()
        assert post("doAddWorkOrderContract", contractId=ids["contract"])["workOrderContracts"]
        assert post("doAddWorkOrderBurialSite", burialSiteId=ids["site"])["workOrderBurialSites"]
        assert post("doAddWorkOrderComment", comment="Synthetic added")["workOrderComments"]
        assert post("doUpdateWorkOrderComment", workOrderCommentId=ids["comment"], comment="Edited", commentDateString="2026-10-20", commentTimeString="00:00")["workOrderComments"]
        assert post("doGetWorkdayReport", workdayDateString="2026-10-20")["workOrders"]
        assert post("doCompleteWorkdayWorkOrderMilestone", workOrderMilestoneId=ids["milestone"], workdayDateString="2026-10-20")["workOrders"]
        assert post("doReopenWorkdayWorkOrderMilestone", workOrderMilestoneId=ids["milestone"], workdayDateString="2026-10-20")["workOrders"]
        assert post("doUpdateWorkdayWorkOrderMilestoneTime", workOrderMilestoneId=ids["milestone"], workdayDateString="2026-10-20",
            workOrderMilestoneDateString="2026-10-20", workOrderMilestoneTimeString="00:00")["workOrders"]
        assert post("doCloseWorkdayWorkOrder", workdayDateString="2026-10-20")["workOrders"]
        post("doReopenWorkOrder")
        audit = post("doGetRecordAuditLog", mainRecordType="workOrder", mainRecordId=identifier)
        assert audit["count"] > 0
        assert client.post("/api/work-orders/doGetRecordAuditLog", json={"mainRecordType": "contract"}, headers=headers).status_code == 403
        post("doDeleteWorkOrder")
        assert client.get(f"/api/work-orders/{identifier}").status_code == 404
        assert client.post("/api/work-orders/doAddWorkOrderComment", json={"workOrderId": identifier, "comment": "blocked"}, headers=headers).status_code == 404


def test_http_reader_cannot_mutate_any_source_or_rest_work_order_path(work_order_app):
    ids = work_order_app.state.test_ids
    actions = ["doCreateWorkOrder", "doUpdateWorkOrder", "doCloseWorkOrder", "doReopenWorkOrder", "doDeleteWorkOrder",
        "doUpdateBurialSiteStatus", "doCloseWorkdayWorkOrder", "doCompleteWorkdayWorkOrderMilestone",
        "doReopenWorkdayWorkOrderMilestone", "doUpdateWorkdayWorkOrderMilestoneTime", "doGetRecordAuditLog"]
    for resource, operations in (("Comment", ("Add", "Update", "Delete")), ("Milestone", ("Add", "Update", "Delete", "Complete", "Reopen")),
        ("Contract", ("Add", "Delete")), ("BurialSite", ("Add", "Delete"))):
        actions.extend("do" + operation + "WorkOrder" + resource for operation in operations)
    with TestClient(work_order_app) as client:
        headers = login(client, "reader")
        for action in actions:
            response = client.post("/api/work-orders/" + action, json={"workOrderId": ids["order"]}, headers=headers)
            assert response.status_code == 403, (action, response.text)
        for resource, item in (("milestones", ids["milestone"]), ("comments", ids["comment"]), ("contracts", ids["contract"]), ("burial-sites", ids["site"])):
            assert client.post(f'/api/work-orders/{ids["order"]}/{resource}', json={}, headers=headers).status_code == 403
            assert client.post(f'/api/work-orders/{ids["order"]}/{resource}/{item}/delete', json={}, headers=headers).status_code == 403
        assert client.put(f'/api/work-orders/{ids["order"]}', json={}, headers=headers).status_code == 403


@pytest.mark.parametrize("patch", [{"workOrderTypeId": 999999}, {"workOrderStatusId": 999999}, {"workOrderDescription": []},
    {"workOrderNumber": "X" * 51}, {"contractId": 999999}, {"workOrderCloseDateString": "bad"}])
def test_http_create_constraints_atomic_rollback(work_order_app, patch):
    ids = work_order_app.state.test_ids
    with TestClient(work_order_app) as client:
        headers = login(client)
        before = client.get("/api/work-orders").json()["count"]
        response = client.post("/api/work-orders/doCreateWorkOrder", json=order_form(ids, **patch), headers=headers)
        assert response.status_code == 400, response.text
        assert client.get("/api/work-orders").json()["count"] == before
