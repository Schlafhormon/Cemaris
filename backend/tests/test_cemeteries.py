"""Cemetery source oracle and committed API checks on disposable SQL Server."""

from datetime import datetime
import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.catalogs import add_catalog_record
from cemaris.cemeteries import (
    add_cemetery, cemetery_matches_search, delete_cemetery, get_adjacent_cemetery_id,
    get_burial_site_status_summary, get_burial_site_type_summary, get_cemeteries,
    get_cemetery, update_cemetery,
)
from cemaris.config import Settings
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


REFERENCE = json.loads((Path(__file__).parent / "fixtures/places-reference.json").read_text(encoding="utf-8"))
ACTOR = "synthetic-cemetery"
FORM = REFERENCE["defaults"][0]["form"]


def add(connection, **overrides):
    return add_cemetery(connection, {**FORM, **overrides}, ACTOR)


def insert_site(connection, cemetery_id, type_id, segment, *, status_id=None):
    values = {f"burialSiteNameSegment{index}": segment if index == 1 else "" for index in range(1, 6)}
    values.update(cemeteryId=cemetery_id, burialSiteTypeId=type_id, burialSiteName=segment,
                  burialSiteStatusId=status_id, recordCreate_username=ACTOR,
                  recordUpdate_username=ACTOR, recordCreate_timeMillis=1, recordUpdate_timeMillis=1)
    table = TABLES["BurialSites"]
    return connection.scalar(table.insert().values(**values).returning(table.c.burialSiteId))


@pytest.mark.parametrize("case", [case for case in REFERENCE["defaults"] if case["resource"] == "cemetery"])
def test_original_cemetery_defaults_coordinates_postalcode_and_directions(sql_connection, case, monkeypatch):
    class AuditClock:
        @staticmethod
        def now():
            return datetime(2026, 10, 20, 12, 34, 56).astimezone()

    monkeypatch.setattr("cemaris.cemeteries.datetime", AuditClock)
    connection, _ = sql_connection
    identifier = add_cemetery(connection, case["form"], ACTOR, audit_enabled=True)
    cemetery = get_cemetery(connection, identifier)
    expected = {key: value for key, value in case["expected"].items() if key not in {"findagraveCemeteryId", "findagraveCemeteryUrl", "isAvailableOnPortal"}}
    assert {key: cemetery[key] for key in expected} == expected
    assert cemetery["directionsOfArrival"] == case["directions"]
    assert cemetery["recordCreate_username"] == cemetery["recordUpdate_username"] == ACTOR
    assert cemetery["recordCreate_timeMillis"] == cemetery["recordUpdate_timeMillis"] > 0
    log = connection.execute(sa.select(TABLES["AuditLog"])).mappings().one()
    assert log["mainRecordType"] == "cemetery" and log["updateType"] == "created"
    assert log["logDate"] == 20261020 and log["logTime"] == 1234
    assert json.loads(log["toValue"])["directionsOfArrival"] == case["directions"]


def test_original_hierarchy_nonrecursive_counts_summary_and_navigation(sql_connection):
    connection, _ = sql_connection
    type_id = add_catalog_record(connection, "burialSiteTypes", {"burialSiteType": "Synthetic Type", "bodyCapacityMax": "", "crematedCapacityMax": ""}, ACTOR)
    status_id = add_catalog_record(connection, "burialSiteStatuses", {"burialSiteStatus": "Available"}, ACTOR)
    main = add(connection)
    child = add(connection, cemeteryName="Synthetic Child", cemeteryKey="CHILD", parentCemeteryId=main)
    grandchild = add(connection, cemeteryName="Synthetic Grandchild", cemeteryKey="GRAND", parentCemeteryId=child)
    for index, cemetery_id in enumerate([main, child, grandchild, main, None, main]):
        site_id = insert_site(connection, cemetery_id, type_id, str(index), status_id=status_id if index % 2 else None)
        if index == 5:
            connection.execute(TABLES["BurialSites"].update().where(TABLES["BurialSites"].c.burialSiteId == site_id).values(recordDelete_timeMillis=1))
    aliases = {main: 1, child: 2, grandchild: 3}
    actual = [{"id": aliases[row["cemeteryId"]], "parent": aliases.get(row["parentCemeteryId"]), "count": row["burialSiteCount"]} for row in get_cemeteries(connection)]
    assert actual == REFERENCE["hierarchy"]["all"]
    assert [aliases[row["cemeteryId"]] for row in get_cemetery(connection, main)["childCemeteries"]] == REFERENCE["hierarchy"]["children"]
    assert len(get_cemetery(connection, child)["childCemeteries"]) == REFERENCE["hierarchy"]["grandchildrenHidden"]
    summary = get_burial_site_type_summary(connection, main)
    assert summary == [{**REFERENCE["hierarchy"]["summary"][0], "burialSiteTypeId": type_id}]
    assert aliases[get_adjacent_cemetery_id(connection, child, "next")] == REFERENCE["hierarchy"]["nextCemetery"]
    assert get_adjacent_cemetery_id(connection, child, "previous") is None
    assert get_adjacent_cemetery_id(connection, 999999, "next") is None
    assert get_burial_site_status_summary(connection, main) == [
        {"burialSiteStatusId": None, "burialSiteStatus": None, "burialSiteCount": 1},
        {"burialSiteStatusId": status_id, "burialSiteStatus": "Available", "burialSiteCount": 1},
    ]
    connection.execute(TABLES["BurialSiteTypes"].update().values(recordDelete_timeMillis=1))
    # Summary deliberately includes names of deleted catalogs still referenced.
    assert get_burial_site_type_summary(connection, main) == summary


def test_navigation_skips_identical_names(sql_connection):
    connection, _ = sql_connection
    first = add(connection, cemeteryName="A")
    add(connection, cemeteryName="A")
    last = add(connection, cemeteryName="B")
    assert get_adjacent_cemetery_id(connection, first, "next") == last
    assert get_adjacent_cemetery_id(connection, last, "next") is None


@pytest.mark.parametrize("query,expected", [
    ("SÜD  a1", True), ("gate SYN", True), ("Übung", False),
    ("Musterstadt", False), ("[x] %_", True), ("", True), ("  syn  süd ", True),
])
def test_cemetery_browser_search_is_unicode_literal_multifield_and_all_tokens(query, expected):
    cemetery = {"cemeteryName": "Süd", "cemeteryKey": "SYN", "cemeteryDescription": "Gate [x] %_", "cemeteryAddress1": "A1", "cemeteryCity": "Musterstadt"}
    assert cemetery_matches_search(cemetery, query) is expected


def test_update_changes_directions_independent_audit_and_rebuilds_site_name(sql_connection):
    from cemaris.burial_sites import BurialSiteOptions

    connection, _ = sql_connection
    identifier = add(connection, directionOfArrivalDescription_N="North", findagraveCemeteryId="123")
    type_id = add_catalog_record(connection, "burialSiteTypes", {"burialSiteType": "Type", "bodyCapacityMax": "", "crematedCapacityMax": ""}, ACTOR)
    site_id = insert_site(connection, identifier, type_id, "01")
    options = BurialSiteOptions(_env_file=None, burial_site_name_segments={"includeCemeteryKey": True, "separator": ":", "segments": {"1": {"isAvailable": True, "isRequired": True}}})
    assert "findagraveCemeteryUrl" not in get_cemetery(connection, identifier)
    assert update_cemetery(connection, {**FORM, "cemeteryId": identifier, "cemeteryKey": "NEW", "directionOfArrivalDescription_S": "South"}, "updater", audit_enabled=True, burial_site_options=options)
    assert get_cemetery(connection, identifier)["directionsOfArrival"] == {"S": "South"}
    site = connection.execute(sa.select(TABLES["BurialSites"]).where(TABLES["BurialSites"].c.burialSiteId == site_id)).mappings().one()
    assert site["burialSiteName"] == "NEW:01" and site["recordUpdate_username"] == "updater"
    logs = list(connection.execute(sa.select(TABLES["AuditLog"])).mappings())
    assert any(row["updateTable"] == "Cemeteries" and row["updateField"] == "cemeteryKey" and row["fromValue"] == '"SYN"' for row in logs)
    directions = [row for row in logs if row["updateTable"] == "CemeteryDirectionsOfArrival"]
    assert {(row["updateField"], row["updateType"]) for row in directions} == {("N", "deleted"), ("S", "created")}
    assert not any(row["updateField"] == "recordUpdate_timeMillis" for row in logs)
    assert update_cemetery(connection, {**FORM, "cemeteryId": 999999}, ACTOR) is False


@pytest.mark.parametrize("case", REFERENCE["deletions"])
def test_original_cemetery_delete_contract_boundaries_and_cascades(sql_connection, case):
    connection, name = sql_connection
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    contracts = TABLES["Contracts"]
    existing_ids = set(connection.scalars(sa.select(contracts.c.contractId)).all())
    connection.execute(contracts.update().where(contracts.c.contractId == ids["contract"]).values(contractStartDate=case["start"], contractEndDate=case["end"], recordDelete_timeMillis=1 if case["deleted"] else None))
    assert delete_cemetery(connection, ids["child_cemetery"], ACTOR, audit_enabled=True, current_date=REFERENCE["today"]) is case["expected"]
    if case["expected"]:
        assert get_cemetery(connection, ids["child_cemetery"]) is None
        for table_name in ("BurialSites", "BurialSiteFields", "BurialSiteComments"):
            table = TABLES[table_name]
            assert all(row["recordDelete_username"] == ACTOR for row in connection.execute(sa.select(table)).mappings())
        assert set(connection.scalars(sa.select(contracts.c.contractId)).all()) == existing_ids
    else:
        assert get_cemetery(connection, ids["child_cemetery"]) is not None
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 1


def test_empty_cemetery_purge_and_parent_tombstone_retains_sql_relationship(sql_connection):
    connection, _ = sql_connection
    empty = add(connection)
    assert delete_cemetery(connection, empty, ACTOR)
    assert connection.scalar(sa.select(CEM.c.cemeteryId).where(CEM.c.cemeteryId == empty)) is None
    parent = add(connection, cemeteryName="Parent")
    child = add(connection, cemeteryName="Child", parentCemeteryId=parent)
    assert delete_cemetery(connection, parent, ACTOR)
    assert get_cemetery(connection, parent) is None
    assert get_cemetery(connection, child)["parentCemeteryId"] is None
    stored = connection.execute(sa.select(CEM).where(CEM.c.cemeteryId == parent)).mappings().one()
    assert stored["recordDelete_username"] == ACTOR


def test_unassigned_site_retains_source_not_in_null_purge_behavior(sql_connection):
    connection, _ = sql_connection
    type_id = add_catalog_record(connection, "burialSiteTypes", {"burialSiteType": "Type", "bodyCapacityMax": "", "crematedCapacityMax": ""}, ACTOR)
    insert_site(connection, None, type_id, "Unassigned")
    cemetery_id = add(connection, directionOfArrivalDescription_N="North")
    assert delete_cemetery(connection, cemetery_id, ACTOR)
    assert get_cemetery(connection, cemetery_id) is None
    row = connection.execute(sa.select(CEM).where(CEM.c.cemeteryId == cemetery_id)).mappings().one()
    assert row["recordDelete_username"] == ACTOR
    # NOT IN (SELECT cemeteryId FROM BurialSites) includes NULL, so source SQL
    # does not purge either the tombstone or its existing arrival descriptions.
    assert connection.scalar(sa.select(TABLES["CemeteryDirectionsOfArrival"].c.directionOfArrivalDescription)) == "North"


CEM = TABLES["Cemeteries"]


@pytest.fixture
def cemetery_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(CEM.metadata.sorted_tables):
            connection.execute(table.delete())
    names = ["reader", "updater", "admin", "cemetery"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}}, session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app


def login(client, username="cemetery"):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("username,expected", [("reader", 403), ("admin", 403), ("updater", 200), ("cemetery", 200)])
def test_cemetery_api_separates_reader_admin_and_cemetery_update_permissions(cemetery_app, username, expected):
    with TestClient(cemetery_app) as client:
        assert client.get("/api/cemeteries").status_code == 401
        headers = login(client, username)
        assert client.get("/api/cemeteries").status_code == 200
        assert client.get("/api/cemeteries/options").json()["auditLogEnabled"] is True
        assert client.post("/api/cemeteries/doCreateCemetery", json=FORM).status_code == 403
        response = client.post("/api/cemeteries/doCreateCemetery", json=FORM, headers=headers)
        assert response.status_code == expected, response.text
        if expected == 200:
            assert response.json()["cemeteryId"] > 0


def test_cemetery_committed_http_crud_validation_rollback_and_fresh_reads(cemetery_app):
    with TestClient(cemetery_app) as client:
        headers = login(client)
        created = client.post("/api/cemeteries/doCreateCemetery", json=FORM, headers=headers)
        assert created.status_code == 200, created.text
        identifier = created.json()["cemeteryId"]
        detail = client.get(f"/api/cemeteries/{identifier}")
        assert detail.status_code == 200, detail.text
        assert detail.json()["cemetery"]["cemeteryPostalCode"] == "A1B 2C3"
        update = client.post("/api/cemeteries/doUpdateCemetery", json={**FORM, "cemeteryId": identifier, "cemeteryName": "Changed"}, headers=headers)
        assert update.status_code == 200 and update.json()["success"] is True, update.text
        with cemetery_app.state.db_engine.connect() as connection:
            assert get_cemetery(connection, identifier)["cemeteryName"] == "Changed"
        assert client.get("/api/cemeteries?search=changed").json()["cemeteries"][0]["cemeteryId"] == identifier
        for invalid in ({"cemeteryLatitude": "nan"}, {"parentCemeteryId": 999999}, {"directionOfArrivalDescription_N": "x" * 101}):
            response = client.post("/api/cemeteries/doCreateCemetery", json={**FORM, **invalid}, headers=headers)
            assert response.status_code == 400, response.text
            assert len(client.get("/api/cemeteries").json()["cemeteries"]) == 1
        assert client.get(f"/api/cemeteries/{identifier}/next").json() == {"cemeteryId": None}
        response = client.post("/api/cemeteries/doDeleteCemetery", json={"cemeteryId": identifier}, headers=headers)
        assert response.status_code == 200 and response.json()["success"] is True
        assert client.get(f"/api/cemeteries/{identifier}").status_code == 404
        assert client.get("/api/cemeteries").json() == {"cemeteries": []}
