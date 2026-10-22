"""Burial-site source comparisons and committed HTTP flows on disposable MSSQL."""

import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.burial_sites import (
    BurialSiteOptions, BurialSiteSourceError, _date_string, _date_string_to_integer, _time_period_string, _time_string, _time_string_to_integer, add_burial_site, build_burial_site_name,
    delete_burial_site, get_adjacent_burial_site_id, get_burial_site, get_burial_site_deceased_names, get_burial_site_directions_of_arrival,
    get_burial_site_comments, mutate_burial_site_comment, restore_burial_site,
    search_burial_sites, update_burial_site,
)
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions, update_setting


REFERENCE = json.loads((Path(__file__).parent / "fixtures/places-reference.json").read_text(encoding="utf-8"))
DATETIME_REFERENCE = json.loads((Path(__file__).parent / "fixtures/datetime-reference.json").read_text(encoding="utf-8"))
OPTIONS = BurialSiteOptions(_env_file=None)


def insert(connection, name, **values):
    table = TABLES[name]
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def raw(connection, identifier):
    table = TABLES["BurialSites"]
    return dict(connection.execute(sa.select(table).where(table.c.burialSiteId == identifier)).mappings().one())


def form(type_id, name="Synthetic Plot", **values):
    return {"burialSiteNameSegment1": name, "burialSiteTypeId": type_id, "burialSiteStatusId": "", "cemeteryId": "",
        "burialSiteImage": "", "cemeterySvgId": "", "burialSiteLatitude": "", "burialSiteLongitude": "", **values}


@pytest.mark.parametrize("case", REFERENCE["names"])
def test_original_name_configurations(case):
    options = BurialSiteOptions(_env_file=None, burial_site_name_segments=case["config"])
    assert build_burial_site_name(case["cemeteryKey"], case["segments"], options) == case["expected"]


@pytest.mark.parametrize("case", DATETIME_REFERENCE["times"])
def test_lockfile_datetime_package_hhmm_and_period_outputs(case):
    # Executed original @cityssm/utils-datetime 1.4.1, SHA512 verified against
    # Sunrise's package-lock, under .local/datetime-reference (MIT).
    assert _time_string(case["input"]) == case["text"]
    assert _time_period_string(case["input"]) == case["period"]


@pytest.mark.parametrize("case", DATETIME_REFERENCE["calendars"])
def test_lockfile_datetime_package_calendar_rollover(case):
    assert _date_string_to_integer(case["input"]) == case["expectedInteger"]
    assert _date_string(case["expectedInteger"]) == case["expectedString"]


@pytest.mark.parametrize("case", DATETIME_REFERENCE["integerDates"])
def test_lockfile_datetime_package_integer_dates(case):
    assert _date_string(case["input"]) == case["expected"]


@pytest.mark.parametrize("case", DATETIME_REFERENCE["localDates"])
def test_lockfile_datetime_package_stores_minutes_as_hhmm(case):
    year, month, day, hour, minute = case["parts"]
    assert _date_string_to_integer(f"{year:04d}-{month:02d}-{day:02d}") == case["expectedDate"]
    assert _time_string_to_integer(f"{hour:02d}:{minute:02d}") == case["expectedTime"]


@pytest.mark.parametrize("case", DATETIME_REFERENCE["invalidStrings"]["dates"])
def test_lockfile_datetime_invalid_date_strings(case):
    with pytest.raises(ValueError):
        _date_string_to_integer(case["input"])


@pytest.mark.parametrize("case", DATETIME_REFERENCE["invalidStrings"]["times"])
def test_lockfile_datetime_invalid_time_strings(case):
    with pytest.raises(ValueError):
        _time_string_to_integer(case["input"])


@pytest.mark.parametrize("case", [case for case in REFERENCE["defaults"] if case["resource"] == "burialSite"])
def test_original_burial_site_defaults(sql_connection, case):
    connection, _ = sql_connection
    type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic Type")
    posted = {**case["form"], "burialSiteTypeId": type_id}
    expected = {**case["expected"], "burialSiteTypeId": type_id}
    if posted["burialSiteStatusId"] != "":
        status = insert(connection, "BurialSiteStatuses", burialSiteStatus="Synthetic")
        posted["burialSiteStatusId"] = status
        expected["burialSiteStatusId"] = status
    result = add_burial_site(connection, posted, "creator", options=OPTIONS, audit_enabled=True)
    stored = raw(connection, result["burialSiteId"])
    actual = {key: value for key, value in stored.items() if key != "burialSiteId" and not key.startswith("record")}
    assert actual == expected
    assert stored["recordCreate_username"] == "creator" and stored["recordCreate_timeMillis"] > 0


def search_fixture(connection):
    cemetery_ids = []
    for index, name in enumerate(("Main", "Child", "Grandchild")):
        cemetery_ids.append(insert(connection, "Cemeteries", cemeteryName="Synthetic " + name, cemeteryKey=name,
            parentCemeteryId=cemetery_ids[-1] if index else None))
    type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic Type")
    status_id = insert(connection, "BurialSiteStatuses", burialSiteStatus="Synthetic Status")
    contract_type_id = insert(connection, "ContractTypes", contractType="Synthetic Contract")
    site_ids = []
    for index, name in enumerate(("A-01", "A-02", "B-03", "Deleted", "🪦 Unicode", "Plot %_[]! End")):
        site_ids.append(add_burial_site(connection, form(type_id, name, cemeteryId=[*cemetery_ids, cemetery_ids[0], "", cemetery_ids[0]][index],
            burialSiteStatusId=status_id if index % 2 else "", burialSiteLatitude="51" if index % 2 else "",
            burialSiteLongitude="13" if index % 2 else ""), "creator", options=OPTIONS)["burialSiteId"])
    sites = TABLES["BurialSites"]
    connection.execute(sites.update().where(sites.c.burialSiteId == site_ids[3]).values(recordDelete_timeMillis=1))
    today = REFERENCE["today"]
    for index, start, end in ((0, today, None), (1, today + 1, None), (2, today - 10, today - 1)):
        insert(connection, "Contracts", contractTypeId=contract_type_id, purchaserName="Synthetic purchaser", burialSiteId=site_ids[index], contractStartDate=start, contractEndDate=end)
    worktype = insert(connection, "WorkOrderTypes", workOrderType="Synthetic work")
    workstatus = insert(connection, "WorkOrderStatuses", workOrderStatus="Synthetic open")
    work_id = insert(connection, "WorkOrders", workOrderNumber="SYN-WO", workOrderTypeId=worktype, workOrderStatusId=workstatus)
    insert(connection, "WorkOrderBurialSites", workOrderId=work_id, burialSiteId=site_ids[1])
    return cemetery_ids, type_id, status_id, site_ids, work_id


@pytest.mark.parametrize("case", REFERENCE["searches"])
def test_original_searches_filters_paging_occupancy(sql_connection, case):
    connection, _ = sql_connection
    cemeteries, type_id, status_id, sites, work_id = search_fixture(connection)
    filters = dict(case["filters"])
    for key, mapped in (("cemeteryId", cemeteries), ("burialSiteTypeId", [type_id]), ("burialSiteStatusId", [status_id]), ("workOrderId", [work_id])):
        if key in filters:
            filters[key] = mapped[filters[key] - 1]
    result = search_burial_sites(connection, filters, **case["options"], current_date=REFERENCE["today"])
    assert {"ids": [sites.index(record["burialSiteId"]) + 1 for record in result["burialSites"]], "count": result["count"],
        "contractCounts": [record["contractCount"] for record in result["burialSites"]]} == case["expected"]


@pytest.mark.parametrize("case", REFERENCE["deletions"])
def test_original_delete_restore_contract_boundaries(sql_connection, case):
    connection, _ = sql_connection
    type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic Type")
    identifier = add_burial_site(connection, form(type_id), "creator", options=OPTIONS)["burialSiteId"]
    contract_type = insert(connection, "ContractTypes", contractType="Synthetic contract")
    insert(connection, "Contracts", contractTypeId=contract_type, purchaserName="Synthetic purchaser", burialSiteId=identifier,
        contractStartDate=case["start"], contractEndDate=case["end"], recordDelete_timeMillis=1 if case["deleted"] else None)
    assert delete_burial_site(connection, identifier, "deleter", current_date=REFERENCE["today"], audit_enabled=True) == case["expected"]
    assert restore_burial_site(connection, identifier, "restorer", audit_enabled=True) == case["restoreSuccess"]
    assert raw(connection, identifier)["recordDelete_timeMillis"] is None


def test_burial_fields_preserve_other_type_and_deleted_descriptors_and_restore_values(sql_connection):
    connection, _ = sql_connection
    first = insert(connection, "BurialSiteTypes", burialSiteType="First", bodyCapacityMax=2)
    second = insert(connection, "BurialSiteTypes", burialSiteType="Second")
    field = insert(connection, "BurialSiteTypeFields", burialSiteTypeId=first, burialSiteTypeField="Historic field", fieldType="text")
    required = insert(connection, "BurialSiteTypeFields", burialSiteTypeId=second, burialSiteTypeField="Required", isRequired=True, minLength=2)
    posted = form(first, burialSiteTypeFieldIds=str(field), **{f"fieldValue_{field}": "Original"})
    identifier = add_burial_site(connection, posted, "creator", options=OPTIONS)["burialSiteId"]
    assert update_burial_site(connection, {**posted, "burialSiteId": identifier, "burialSiteTypeId": second, "burialSiteTypeFieldIds": str(required)}, "updater", options=OPTIONS)
    table = TABLES["BurialSiteTypeFields"]
    connection.execute(table.update().where(table.c.burialSiteTypeFieldId == field).values(recordDelete_timeMillis=1))
    record = get_burial_site(connection, identifier)
    fields = {record["burialSiteTypeFieldId"]: record for record in record["burialSiteFields"]}
    assert fields[field]["fieldValue"] == "Original" and fields[required]["fieldValue"] == ""
    # Source HTML performs field validation; persistence keeps old field rows,
    # including fields from the previous type, and only touches submitted IDs.
    cleared = {**posted, "burialSiteId": identifier, f"fieldValue_{field}": ""}
    assert update_burial_site(connection, cleared, "clearer", options=OPTIONS)
    assert not get_burial_site(connection, identifier)["burialSiteFields"]
    assert update_burial_site(connection, {**posted, "burialSiteId": identifier}, "restorer", options=OPTIONS)
    assert get_burial_site(connection, identifier)["burialSiteFields"][0]["fieldValue"] == "Original"
    link = TABLES["BurialSiteFields"]
    stored = connection.execute(sa.select(link).where(link.c.burialSiteId == identifier, link.c.burialSiteTypeFieldId == field)).mappings().one()
    assert stored["recordCreate_username"] == "creator" and stored["recordUpdate_username"] == "restorer" and stored["recordDelete_timeMillis"] is None


def test_burial_name_collision_purge_and_restore_preserve_history(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic")
    posted = form(type_id, "Duplicate")
    identifier = add_burial_site(connection, posted, "creator", options=OPTIONS)["burialSiteId"]
    with pytest.raises(BurialSiteSourceError, match="active burial site"):
        add_burial_site(connection, posted, "duplicate", options=OPTIONS)
    second_id = add_burial_site(connection, form(type_id, "Other"), "creator", options=OPTIONS)["burialSiteId"]
    with pytest.raises(BurialSiteSourceError):
        update_burial_site(connection, {**posted, "burialSiteId": second_id}, "duplicate", options=OPTIONS)
    assert delete_burial_site(connection, identifier, "deleter")
    replacement = add_burial_site(connection, posted, "recreator", options=OPTIONS)["burialSiteId"]
    assert replacement != identifier
    assert get_burial_site(connection, identifier, include_deleted=True) is None
    contract_type = insert(connection, "ContractTypes", contractType="History")
    insert(connection, "Contracts", contractTypeId=contract_type, purchaserName="Synthetic", burialSiteId=replacement, contractStartDate=20200101, contractEndDate=20200102)
    assert delete_burial_site(connection, replacement, "deleter")
    with pytest.raises(BurialSiteSourceError, match="past records"):
        add_burial_site(connection, posted, "recreator", options=OPTIONS)
    assert get_burial_site(connection, replacement, include_deleted=True)["contracts"]


def test_burial_comments_sort_formats_audits_and_missing_ids(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic")
    identifier = add_burial_site(connection, form(type_id), "creator", options=OPTIONS, audit_enabled=True)["burialSiteId"]
    for comment in ("First", "Second"):
        assert mutate_burial_site_comment(connection, "add", {"burialSiteId": identifier, "comment": comment}, "writer", audit_enabled=True)
    comments = get_burial_site_comments(connection, identifier)
    assert [comment["comment"] for comment in comments] == ["Second", "First"]
    comment_id = comments[0]["burialSiteCommentId"]
    assert mutate_burial_site_comment(connection, "update", {"burialSiteCommentId": comment_id, "commentDateString": "2020-04-03", "commentTimeString": "12:34", "comment": "Edited"}, "editor", audit_enabled=True)
    updated = get_burial_site_comments(connection, identifier)[1]
    assert (updated["comment"], updated["commentDate"], updated["commentTime"], updated["commentDateString"], updated["commentTimeString"], updated["commentTimePeriodString"]) == ("Edited", 20200403, 1234, "2020-04-03", "12:34", "12:34 p.m.")
    assert updated["recordCreate_username"] == "writer" and updated["recordUpdate_username"] == "editor"
    assert mutate_burial_site_comment(connection, "delete", {"burialSiteCommentId": comment_id}, "deleter", audit_enabled=True)
    assert not mutate_burial_site_comment(connection, "delete", {"burialSiteCommentId": comment_id}, "deleter")
    assert len(get_burial_site_comments(connection, identifier)) == 1
    audit = TABLES["AuditLog"]
    rows = connection.execute(sa.select(audit).where(audit.c.mainRecordId == str(identifier), audit.c.recordIndex == str(comment_id))).mappings().all()
    assert any(row["updateType"] == "created" and row["updateField"] == "*" for row in rows)
    assert any(row["updateType"] == "deleted" and row["updateField"] == "*" for row in rows)
    assert any(row["updateField"] == "comment" and row["fromValue"] == '"Second"' and row["toValue"] == '"Edited"' for row in rows)


def test_details_link_contract_interments_workorders_capacity_and_navigation(sql_connection):
    connection, _ = sql_connection
    _, _, _, sites, _ = search_fixture(connection)
    update_setting(connection, "burialSiteTypes.bodyCapacityMaxDefault", "7")
    record = get_burial_site(connection, sites[1])
    assert record["effectiveBodyCapacity"] == "7"
    assert len(record["contracts"]) == 1 and len(record["workOrders"]) == 1
    contract_id = record["contracts"][0]["contractId"]
    insert(connection, "ContractInterments", contractId=contract_id, intermentNumber=1, deceasedName="Synthetic person", birthDate=19700000, deathDate=20261000,
        deceasedAddress1="", deceasedAddress2="", deceasedCity="", deceasedProvince="", deceasedPostalCode="")
    interment = get_burial_site(connection, sites[1])["contracts"][0]["contractInterments"][0]
    assert interment["birthDateString"] == "1970" and interment["deathDateString"] == "2026-10"
    assert get_adjacent_burial_site_id(connection, sites[0]) == sites[1]
    assert get_adjacent_burial_site_id(connection, sites[1], previous=True) == sites[0]
    assert get_adjacent_burial_site_id(connection, sites[0], previous=True) is None
    assert get_burial_site(connection, sites[3]) is None
    assert get_burial_site(connection, sites[3], include_deleted=True)["recordDelete_timeMillis"] == 1


def test_directions_one_level_fallback_and_deceased_names_current_contracts(sql_connection):
    connection, _ = sql_connection
    cemeteries, _, _, sites, _ = search_fixture(connection)
    assert get_burial_site_directions_of_arrival(connection, sites[0]) == {"E": "East", "N": "North", "S": "South", "W": "West"}
    insert(connection, "CemeteryDirectionsOfArrival", cemeteryId=cemeteries[0], directionOfArrival="N", directionOfArrivalDescription="Synthetic north")
    assert get_burial_site_directions_of_arrival(connection, sites[1]) == {"N": "Synthetic north"}
    assert get_burial_site_directions_of_arrival(connection, sites[2]) == {"E": "East", "N": "North", "S": "South", "W": "West"}
    insert(connection, "CemeteryDirectionsOfArrival", cemeteryId=cemeteries[1], directionOfArrival="SE", directionOfArrivalDescription="")
    assert get_burial_site_directions_of_arrival(connection, sites[1]) == {"SE": ""}
    contracts = TABLES["Contracts"]
    rows = connection.execute(sa.select(contracts.c.contractId, contracts.c.burialSiteId)).mappings().all()
    for row in rows:
        for number, name in enumerate(("Zed", "Alpha", "Alpha"), 1):
            insert(connection, "ContractInterments", contractId=row["contractId"], intermentNumber=number, deceasedName=name,
                deceasedAddress1="", deceasedAddress2="", deceasedCity="", deceasedProvince="", deceasedPostalCode="")
    assert get_burial_site_deceased_names(connection, [], current_date=REFERENCE["today"]) == []
    assert get_burial_site_deceased_names(connection, sites, current_date=REFERENCE["today"]) == [{"burialSiteId": sites[0], "deceasedNames": ["Alpha", "Alpha", "Zed"]}]


def login(client, username):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.fixture
def burial_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
    names = ["admin", "reader", "updater", "cemetery", "contract"]
    settings = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"], can_update_contracts=["contract"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=settings,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True), burial_site_options=OPTIONS)
    app.state.db_engine = engine
    with engine.begin() as connection:
        app.state.test_type_id = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic")
    return app


@pytest.mark.parametrize("username,can_update,can_restore", [("admin", False, True), ("reader", False, False), ("updater", True, False), ("cemetery", True, False), ("contract", False, False)])
def test_burial_http_independent_source_roles(burial_app, username, can_update, can_restore):
    with TestClient(burial_app) as client:
        assert client.get("/api/burialSites/options").status_code == 401
        headers = login(client, username)
        assert client.get("/api/burialSites/options").status_code == 200
        response = client.post("/api/burialSites/doCreateBurialSite", json=form(burial_app.state.test_type_id), headers=headers)
        assert response.status_code == (200 if can_update else 403), response.text
        response = client.post("/api/burialSites/doRestoreBurialSite", json={"burialSiteId": 999999}, headers=headers)
        assert response.status_code == (200 if can_restore else 403), response.text


def test_burial_http_crud_comments_csrf_commit_deleted_visibility(burial_app):
    with TestClient(burial_app) as client:
        headers = login(client, "cemetery")
        posted = form(burial_app.state.test_type_id)
        assert client.post("/api/burialSites/doCreateBurialSite", json=posted).status_code == 403
        response = client.post("/api/burialSites/doCreateBurialSite", json=posted, headers=headers)
        assert response.status_code == 200, response.text
        identifier = response.json()["burialSiteId"]
        response = client.post("/api/burialSites/doUpdateBurialSite", json={**posted, "burialSiteId": identifier, "burialSiteNameSegment1": "Changed"}, headers=headers)
        assert response.status_code == 200, response.text
        with burial_app.state.db_engine.connect() as connection:
            assert raw(connection, identifier)["burialSiteName"] == "Changed"
        response = client.post("/api/burialSites/doAddBurialSiteComment", json={"burialSiteId": identifier, "comment": "Synthetic"}, headers=headers)
        assert response.status_code == 200, response.text
        comment_id = response.json()["burialSiteComments"][0]["burialSiteCommentId"]
        response = client.post("/api/burialSites/doUpdateBurialSiteComment", json={"burialSiteId": identifier, "burialSiteCommentId": comment_id,
            "commentDateString": "2020-01-02", "commentTimeString": "00:00", "comment": "Edited"}, headers=headers)
        assert response.status_code == 200, response.text
        assert response.json()["burialSiteComments"][0]["comment"] == "Edited"
        response = client.post("/api/burialSites/doDeleteBurialSiteComment", json={"burialSiteId": identifier, "burialSiteCommentId": comment_id}, headers=headers)
        assert response.status_code == 200 and response.json()["burialSiteComments"] == []
        response = client.post("/api/burialSites/doDeleteBurialSite", json={"burialSiteId": identifier}, headers=headers)
        assert response.status_code == 200 and response.json()["success"]
        assert client.get(f"/api/burialSites/{identifier}").status_code == 200
        headers = login(client, "reader")
        assert client.get(f"/api/burialSites/{identifier}").status_code == 404
        headers = login(client, "admin")
        response = client.post("/api/burialSites/doRestoreBurialSite", json={"burialSiteId": identifier}, headers=headers)
        assert response.status_code == 200 and response.json()["success"]
        assert client.get(f"/api/burialSites/{identifier}").json()["burialSite"]["burialSiteComments"] == []
        assert client.get(f"/api/burialSites/{identifier}/next").json() == {"burialSiteId": None}
