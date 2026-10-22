"""Committed HTTP contract workflows and isolated SQL participant persistence."""

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contracts import (ContractOptions, add_contract, copy_contract, delete_contract, get_contract,
    get_contract_comments, get_contract_fields, get_contracts, mutate_contract_comment, mutate_related_contract, update_contract,
    get_contract_metadata, get_contract_metadata_by_contract_id, update_contract_metadata, delete_contract_metadata, get_adjacent_contract_id)
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions

OPTIONS = ContractOptions(_env_file=None)


def insert(connection, name, **values):
    table = TABLES[name]
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def form(type_id, **values):
    return {"contractTypeId": type_id, "burialSiteId": "", "contractStartDateString": "2026-10-20", "contractEndDateString": "",
        "funeralHomeId": "", "funeralDirectorName": "Synthetic Director", "funeralDateString": "", "funeralTimeString": "",
        "purchaserName": "Synthetic Purchaser", "purchaserAddress1": "1 Synthetic Street", "purchaserAddress2": "",
        "purchaserCity": "Synthetic", "purchaserProvince": "BB", "purchaserPostalCode": "ab1 2cd", "purchaserPhoneNumber": "555-0100",
        "purchaserEmail": "synthetic@example.invalid", "purchaserRelationship": "Child", **values}


def test_create_update_preserves_contract_number_and_upserts_and_revives_fields(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    field_id = insert(connection, "ContractTypeFields", contractTypeId=type_id, contractTypeField="Synthetic field")
    posted = form(type_id, contractNumber="MANUAL-1", contractTypeFieldIds=str(field_id), **{f"fieldValue_{field_id}": "Original"})
    identifier = add_contract(connection, posted, "creator", audit_enabled=True)
    assert get_contract(connection, identifier)["purchaserPostalCode"] == "AB1 2CD"
    assert get_contract_fields(connection, identifier)[0]["fieldValue"] == "Original"
    assert update_contract(connection, {**posted, "contractId": identifier, "contractNumber": "FORBIDDEN-CHANGE", f"fieldValue_{field_id}": ""}, "editor", audit_enabled=True)
    assert get_contract_fields(connection, identifier)[0]["fieldValue"] == ""
    stored = connection.execute(sa.select(TABLES["ContractFields"])).mappings().one()
    assert stored["recordDelete_username"] == "editor"
    assert update_contract(connection, {**posted, "contractId": identifier, f"fieldValue_{field_id}": "Revived"}, "editor", audit_enabled=True)
    stored = connection.execute(sa.select(TABLES["ContractFields"])).mappings().one()
    assert stored["recordDelete_timeMillis"] is None and stored["recordCreate_username"] == "creator"
    assert get_contract(connection, identifier)["contractNumber"] == "MANUAL-1"
    audit = list(connection.execute(sa.select(TABLES["AuditLog"])).mappings())
    assert any(row["updateTable"] == "ContractFields" for row in audit)
    assert any(row["updateType"] == "created" and row["updateTable"] == "Contracts" for row in audit)


def test_inline_funeral_home_initial_participant_partial_dates_and_copy_omissions(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    container = insert(connection, "IntermentContainerTypes", intermentContainerType="Synthetic urn", isCremationType=True)
    depth = insert(connection, "IntermentDepths", intermentDepth="Synthetic depth")
    posted = form(type_id, funeralHomeId="new", funeralHomeName="Synthetic funeral", funeralHomePostalCode="ab1 2cd",
        deceasedName="Synthetic Recipient", deceasedCity="Synthetic", deceasedProvince="BB", deceasedPostalCode="cd2 3ef",
        birthYear="1950", birthMonth="", birthDay="", deathYear="2026", deathMonth="10", deathDay="",
        deathAge="76", deathAgePeriod="Years", intermentContainerTypeId=container, intermentDepthId=depth,
        committalTypeId="", directionOfArrival="NW", funeralDateString="2026-10-21", funeralTimeString="00:00")
    identifier = add_contract(connection, posted, "creator", audit_enabled=True)
    original = get_contract(connection, identifier)
    assert original["funeralHomeName"] == "Synthetic funeral" and original["funeralHomePostalCode"] == "AB1 2CD"
    recipient = original["contractInterments"][0]
    assert recipient["birthDateString"] == "1950" and recipient["deathDateString"] == "2026-10"
    assert recipient["deceasedPostalCode"] == "CD2 3EF" and recipient["isCremationType"]
    copied_id = copy_contract(connection, identifier, "copier", current_date=20261022, audit_enabled=True)
    copied = get_contract(connection, copied_id)
    assert copied["contractStartDate"] == 20261022 and copied["contractEndDate"] is None
    assert copied["directionOfArrival"] == "" and copied["committalTypeId"] is None
    assert copied["contractInterments"][0]["intermentDepthId"] is None
    assert copied["contractInterments"][0]["intermentContainerTypeId"] == container
    assert copied["contractComments"][0]["comment"] == f"Neuer Datensatz aus Vertrag #{identifier} kopiert."
    assert copied["relatedContracts"][0]["contractId"] == identifier
    assert get_contract(connection, identifier)["relatedContracts"][0]["contractId"] == copied_id


@pytest.mark.parametrize("city,province", [
    ("Bad Homburg vor der Höhe", "Baden-Württemberg"),
    ("Synthetischer Musterort ".ljust(100, "X"), "Synthetisches Bundesland ".ljust(100, "X")),
])
def test_german_participant_city_and_state_round_trip_up_to_100_characters(sql_connection, city, province):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetischer Nutzungsvertrag")
    identifier = add_contract(connection, form(type_id, purchaserCity=city, purchaserProvince=province,
        purchaserPostalCode="01234", deceasedName="Synthetische verstorbene Person", deceasedCity=city,
        deceasedProvince=province, deceasedPostalCode="01234"), "creator")
    contract = get_contract(connection, identifier)
    assert contract["purchaserCity"] == city and contract["purchaserProvince"] == province
    assert contract["contractInterments"][0]["deceasedCity"] == city
    assert contract["contractInterments"][0]["deceasedProvince"] == province
    assert contract["purchaserPostalCode"] == contract["contractInterments"][0]["deceasedPostalCode"] == "01234"


def test_delete_soft_deletes_only_source_parent_fields_comments_and_keeps_child_history(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    identifier = add_contract(connection, form(type_id, deceasedName="Synthetic Recipient"), "creator")
    comment = mutate_contract_comment(connection, "add", {"contractId": identifier, "comment": "Synthetic"}, "creator")
    second = add_contract(connection, form(type_id), "creator")
    mutate_related_contract(connection, "add", {"contractId": identifier, "relatedContractId": second})
    assert delete_contract(connection, identifier, "deleter", audit_enabled=True)
    assert get_contract(connection, identifier) is None
    assert get_contract_comments(connection, identifier) == []
    assert connection.scalar(sa.select(TABLES["ContractComments"].c.recordDelete_username).where(TABLES["ContractComments"].c.contractCommentId == comment)) == "deleter"
    assert connection.scalar(sa.select(TABLES["ContractInterments"].c.recordDelete_timeMillis).where(TABLES["ContractInterments"].c.contractId == identifier)) is None
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["RelatedContracts"])) == 1
    assert delete_contract(connection, identifier, "deleter")
    assert not update_contract(connection, {**form(type_id), "contractId": identifier}, "editor")


def test_contract_metadata_filter_prefix_upsert_soft_delete_and_revival(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    identifiers = [add_contract(connection, form(type_id), "creator") for _ in range(2)]
    for identifier, key, value in ((identifiers[0], "cemaris.referenceId", "SYN-1"), (identifiers[0], "portal.orderFormId", "SYN-2"),
        (identifiers[1], "cemaris.referenceId", "SYN-3")):
        assert update_contract_metadata(connection, identifier, {"metadataKey": key, "metadataValue": value}, "creator")
    assert len(get_contract_metadata(connection)) == 3
    assert len(get_contract_metadata(connection, {"startsWith": "CEMARIS."})) == 2
    assert get_contract_metadata_by_contract_id(connection, identifiers[0], "cemaris.") == {"cemaris.referenceId": "SYN-1"}
    assert delete_contract_metadata(connection, identifiers[0], "cemaris.referenceId", "deleter")
    assert get_contract_metadata_by_contract_id(connection, identifiers[0], "cemaris.") == {}
    assert delete_contract_metadata(connection, identifiers[0], "missing", "deleter")
    assert update_contract_metadata(connection, identifiers[0], {"metadataKey": "cemaris.referenceId", "metadataValue": "SYN-4"}, "editor")
    assert get_contract_metadata_by_contract_id(connection, identifiers[0], "cemaris.") == {"cemaris.referenceId": "SYN-4"}
    table = TABLES["ContractMetadata"]
    row = connection.execute(sa.select(table).where(table.c.contractId == identifiers[0], table.c.metadataKey == "cemaris.referenceId")).mappings().one()
    assert row["recordCreate_username"] == "creator" and row["recordUpdate_username"] == "editor" and row["recordDelete_timeMillis"] is None


def test_navigation_preserves_trailing_spaces_unicode_binary_order_and_strict_duplicate_skip(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    numbers = ["SYN-N", "SYN-N ", "SYN-N  ", "SYN-\ue000", "SYN-\U0001faa6"]
    identifiers = [add_contract(connection, form(type_id, contractNumber=number), "creator") for number in numbers]
    duplicate = add_contract(connection, form(type_id, contractNumber="SYN-N "), "creator")
    for index, identifier in enumerate(identifiers):
        assert get_adjacent_contract_id(connection, identifier, previous=True) == (identifiers[index - 1] if index else None)
        assert get_adjacent_contract_id(connection, identifier) == (identifiers[index + 1] if index + 1 < len(identifiers) else None)
    assert get_adjacent_contract_id(connection, duplicate, previous=True) == identifiers[0]
    assert get_adjacent_contract_id(connection, duplicate) == identifiers[2]
    assert delete_contract(connection, identifiers[2], "deleter")
    assert get_adjacent_contract_id(connection, identifiers[1]) == identifiers[3]
    assert get_adjacent_contract_id(connection, 9999999) is None


@pytest.fixture
def contract_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        type_id = insert(connection, "ContractTypes", contractType="Synthetic")
    names = ["admin", "reader", "updater", "cemetery", "contract", "work"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"],
        can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, contract_options=OPTIONS,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    app.state.test_type_id = type_id
    return app


def login(client, username):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("username,can_update", [("admin", False), ("reader", False), ("updater", True), ("cemetery", False), ("contract", True), ("work", False)])
def test_contract_independent_source_roles(contract_app, username, can_update):
    with TestClient(contract_app) as client:
        assert client.get("/api/contracts/meta").status_code == 401
        headers = login(client, username)
        meta = client.get("/api/contracts/meta")
        assert meta.status_code == 200 and meta.json()["canUpdate"] == can_update
        assert client.get("/api/contracts/new").status_code == (200 if can_update else 403)
        response = client.post("/api/contracts", json=form(contract_app.state.test_type_id), headers=headers)
        assert response.status_code == (200 if can_update else 403), response.text
        for endpoint, body in (("doGetContractTypeFields", {"contractTypeId": contract_app.state.test_type_id}),
            ("doGetBurialSiteDirectionsOfArrival", {"burialSiteId": ""}), ("doGetFuneralDirectors", {"funeralHomeId": ""}),
            ("doGetPossibleRelatedContracts", {"limit": 5, "offset": 0}),
            ("doGetRecordAuditLog", {"mainRecordType": "contract", "mainRecordId": "", "limit": 5, "offset": 0})):
            response = client.post("/api/contracts/" + endpoint, json=body, headers=headers)
            assert response.status_code == (200 if can_update else 403), response.text


def test_contract_http_workflow_persistence_comments_related_copy_and_csrf(contract_app):
    with TestClient(contract_app) as client:
        headers = login(client, "contract")
        posted = form(contract_app.state.test_type_id)
        assert client.post("/api/contracts", json=posted).status_code == 403
        response = client.post("/api/contracts", json=posted, headers=headers)
        assert response.status_code == 200, response.text
        identifier = response.json()["contractId"]
        record = client.get(f"/api/contracts/{identifier}").json()["contract"]
        assert record["purchaserName"] == posted["purchaserName"]
        response = client.post(f"/api/contracts/{identifier}/update", json={**posted, "purchaserName": "Edited Synthetic"}, headers=headers)
        assert response.status_code == 200, response.text
        response = client.post("/api/contracts/search", json={"purchaserName": "synthetic edited", "limit": 50, "offset": 0}, headers=headers)
        assert response.json()["count"] == 1
        assert response.json()["contracts"][0]["purchaserName"] == "Edited Synthetic"
        response = client.post("/api/contracts/doAddContractComment", json={"contractId": identifier, "comment": "Synthetic comment"}, headers=headers)
        assert response.status_code == 200, response.text
        comment_id = response.json()["contractComments"][0]["contractCommentId"]
        response = client.post("/api/contracts/doUpdateContractComment", json={"contractId": identifier, "contractCommentId": comment_id,
            "comment": "Edited comment", "commentDateString": "2026-01-02", "commentTimeString": "23:59"}, headers=headers)
        assert response.json()["contractComments"][0]["commentTimePeriodString"] == "11:59 p.m."
        response = client.post(f"/api/contracts/{identifier}/copy", json={}, headers=headers)
        assert response.status_code == 200, response.text
        copy_id = response.json()["contractId"]
        assert client.get(f"/api/contracts/{identifier}").json()["contract"]["relatedContracts"][0]["contractId"] == copy_id
        response = client.post("/api/contracts/doDeleteRelatedContract", json={"contractId": identifier, "relatedContractId": copy_id}, headers=headers)
        assert response.status_code == 200 and response.json()["relatedContracts"] == []
        response = client.post("/api/contracts/doDeleteContractComment", json={"contractId": identifier, "contractCommentId": comment_id}, headers=headers)
        assert response.json()["contractComments"] == []
        response = client.post("/api/contracts/doGetRecordAuditLog", json={"mainRecordType": "contract", "mainRecordId": str(identifier)}, headers=headers)
        assert response.status_code == 200 and response.json()["count"] > 2
        assert client.post("/api/contracts/doGetRecordAuditLog", json={"mainRecordType": "cemetery"}, headers=headers).status_code == 403
        response = client.post(f"/api/contracts/{identifier}/delete", json={}, headers=headers)
        assert response.status_code == 200
        assert client.get(f"/api/contracts/{identifier}").status_code == 404
        assert client.get(f"/api/contracts/{copy_id}").status_code == 200


@pytest.mark.parametrize("overrides", [{"contractStartDateString": ""}, {"funeralTimeString": "24:00"}, {"purchaserProvince": "X" * 101},
    {"contractTypeId": 9999999}, {"burialSiteId": 9999999}, {"contractTypeFieldIds": "999999", "fieldValue_999999": "Orphan"},
    {"deceasedName": "Synthetic", "deceasedProvince": "X" * 101}, {"funeralHomeId": "new", "funeralHomeName": "Rollback synthetic", "funeralHomePostalCode": "ABC", "purchaserProvince": "X" * 101}])
def test_invalid_http_creation_is_atomic_without_audit_or_new_home(contract_app, overrides):
    engine = contract_app.state.db_engine
    with engine.connect() as connection:
        before = {name: connection.scalar(sa.select(sa.func.count()).select_from(TABLES[name])) for name in ("Contracts", "ContractFields", "ContractInterments", "FuneralHomes", "AuditLog")}
    with TestClient(contract_app) as client:
        headers = login(client, "contract")
        response = client.post("/api/contracts", json=form(contract_app.state.test_type_id, **overrides), headers=headers)
        assert response.status_code == 400 and response.json()["success"] is False, response.text
    with engine.connect() as connection:
        after = {name: connection.scalar(sa.select(sa.func.count()).select_from(TABLES[name])) for name in before}
    assert after == before


def test_relationship_suggestions_follow_request_language_with_german_default(contract_app):
    with TestClient(contract_app) as client:
        login(client, "contract")
        german = client.get("/api/contracts/meta").json()["options"]["purchaserRelationships"]
        english = client.get("/api/contracts/meta?lng=en").json()["options"]["purchaserRelationships"]
        assert len(german) == len(english) == 28
        assert german[0] == "Selbst" and german[-1] == "Freund/in"
        assert english[0] == "Self" and english[-1] == "Friend"
        assert client.get("/api/contracts/new?lng=de").json()["options"]["purchaserRelationships"] == german
        for cookie in list(client.cookies.jar):
            if cookie.name == "i18next":
                client.cookies.delete(cookie.name, domain=cookie.domain, path=cookie.path)
        assert client.get("/api/contracts/meta", headers={"Accept-Language": "en-GB"}).json()["options"]["purchaserRelationships"] == english
        assert client.get("/api/contracts/meta", headers={"Accept-Language": "de-DE"}).json()["options"]["purchaserRelationships"] == english
        assert client.get("/api/contracts/meta?lng=de").json()["options"]["purchaserRelationships"] == german


def test_related_constraint_errors_are_controlled_and_leave_existing_rows(contract_app):
    with TestClient(contract_app) as client:
        headers = login(client, "contract")
        identifiers = [client.post("/api/contracts", json=form(contract_app.state.test_type_id), headers=headers).json()["contractId"] for _ in range(2)]
        body = {"contractId": identifiers[1], "relatedContractId": identifiers[0]}
        assert client.post("/api/contracts/doAddRelatedContract", json=body, headers=headers).status_code == 200
        for invalid in (body, {"contractId": identifiers[0], "relatedContractId": identifiers[0]}, {"contractId": identifiers[0], "relatedContractId": 9999999}):
            response = client.post("/api/contracts/doAddRelatedContract", json=invalid, headers=headers)
            assert response.status_code == 400 and response.json()["code"] == "contract_constraint", response.text
        assert len(client.get(f"/api/contracts/{identifiers[0]}").json()["contract"]["relatedContracts"]) == 1
