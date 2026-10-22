"""Standalone contract child workflows on disposable SQL Server databases."""

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contract_items import (ContractItemParentNotFound, add_contract_interment, update_contract_interment,
    delete_contract_interment, add_contract_service_type, update_contract_service_type, delete_contract_service_type,
    get_contract_service_types, interment_values)
from cemaris.contracts import add_contract, delete_contract, get_contract, get_contract_interments, get_contracts
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


def insert(connection, name, **values):
    table = TABLES[name]
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def contract_form(type_id, **values):
    return {"contractTypeId": type_id, "contractStartDateString": "2026-10-20", "contractEndDateString": "",
        "purchaserName": "Synthetic purchaser", **values}


def interment_form(**values):
    return {"deceasedName": "Synthetic Person", "deceasedAddress1": "1 Synthetic Street", "deceasedAddress2": "",
        "deceasedCity": "Synthetic", "deceasedProvince": "BB", "deceasedPostalCode": "ab1 2cd", "birthPlace": "Synthetic birthplace",
        "birthYear": "1950", "birthMonth": "", "birthDay": "", "deathPlace": "Synthetic deathplace", "deathYear": "2026",
        "deathMonth": "10", "deathDay": "", "deathAge": "76", "deathAgePeriod": "Years", "intermentContainerTypeId": "",
        "intermentDepthId": "", **values}


@pytest.mark.parametrize("year,month,day,expected", [("", "2", "15", None), ("bad", "2", "15", None),
    ("-1", "2", "15", None), ("1950", "", "", 19500000), ("1950", "10", "", 19501000), ("1950", "0", "15", 19500015),
    ("2025", "2", "31", 20250231), ("2025", "99", "99", 20251231), ("2025", "-1", "-1", 20250000),
    ("2025", "bad", "bad", 20250000), ("2000.5", "", "", 20005000), ("2025", "2.5", "", 20250250)])
def test_interment_values_partial_date_result_matches_source(year, month, day, expected):
    for adding in (False, True):
        values = interment_values(interment_form(birthYear=year, birthMonth=month, birthDay=day), adding=adding)
        assert values["birthDate"] == expected
        assert values["deceasedPostalCode"] == "AB1 2CD"


@pytest.mark.parametrize("values", [{"birthDay": "1.5"}, {"deathDay": "1.5"}, {"birthYear": "Infinity"}, {"deathYear": "1e20"},
    {"birthYear": "2000.00005"}, {"deathAge": "1.5"}, {"deathAge": "Infinity"}, {"deathAge": "NaN"},
    {"deathAge": str(2**63)}, {"intermentContainerTypeId": "1.5"},
    {"deceasedProvince": "X" * 101}, {"deceasedCity": "X" * 101}, {"deceasedName": "\U0001faa6" * 101}, {"deceasedCity": []}, {"deathAgePeriod": "12345678901"}])
def test_interment_values_reject_unrepresentable_sql_values(values):
    with pytest.raises((ValueError, TypeError)):
        interment_values(interment_form(**values), adding=False)


def test_interment_values_empty_age_is_explicit_null_on_add_and_update_and_zero_survives():
    for adding in (False, True):
        assert interment_values(interment_form(deathAge=""), adding=adding)["deathAge"] is None
        assert interment_values(interment_form(deathAge="0"), adding=adding)["deathAge"] == 0
        assert interment_values(interment_form(deathAge=str(2**63 - 1)), adding=adding)["deathAge"] == 2**63 - 1
        assert interment_values(interment_form(deathAge=str(-(2**63))), adding=adding)["deathAge"] == -(2**63)
    minimal = interment_values({}, adding=True)
    assert minimal["deceasedName"] == "" and minimal["birthDate"] is None
    with pytest.raises(KeyError):
        interment_values({}, adding=False)


@pytest.mark.parametrize("city,province", [
    ("Bad Homburg vor der Höhe", "Baden-Württemberg"),
    ("Synthetischer Musterort ".ljust(100, "X"), "Synthetisches Bundesland ".ljust(100, "X")),
])
def test_german_interment_city_and_state_round_trip_up_to_100_characters(sql_connection, city, province):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetischer Nutzungsvertrag")
    identifier = add_contract(connection, contract_form(type_id), "creator")
    number = add_contract_interment(connection, interment_form(contractId=identifier, deceasedCity=city,
        deceasedProvince=province, deceasedPostalCode="01234"), "creator")
    row = get_contract_interments(connection, identifier)[0]
    assert row["intermentNumber"] == number
    assert row["deceasedCity"] == city and row["deceasedProvince"] == province
    assert row["deceasedPostalCode"] == "01234"


def test_interment_crud_number_history_dates_audit_and_parent_unchanged(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic type")
    identifier = add_contract(connection, contract_form(type_id), "creator")
    second = add_contract(connection, contract_form(type_id), "creator")
    container = insert(connection, "IntermentContainerTypes", intermentContainerType="Synthetic urn", isCremationType=True)
    depth = insert(connection, "IntermentDepths", intermentDepth="Synthetic depth")
    parent_before = dict(connection.execute(sa.select(TABLES["Contracts"]).where(TABLES["Contracts"].c.contractId == identifier)).mappings().one())
    form = interment_form(contractId=identifier, intermentContainerTypeId=container, intermentDepthId=depth)
    number = add_contract_interment(connection, form, "adder", audit_enabled=True)
    assert number == 1
    row = get_contract_interments(connection, identifier)[0]
    assert row["birthDateString"] == "1950" and row["deathDateString"] == "2026-10"
    assert row["deceasedPostalCode"] == "AB1 2CD" and row["isCremationType"]
    assert row["intermentDepthId"] == depth
    assert not update_contract_interment(connection, {**form, "contractId": second, "intermentNumber": number}, "wrong")
    assert update_contract_interment(connection, {**form, "intermentNumber": number, "deathAge": "", "deceasedName": "Edited Synthetic",
        "intermentContainerTypeId": "", "intermentDepthId": ""}, "editor", audit_enabled=True)
    row = get_contract_interments(connection, identifier)[0]
    assert row["deceasedName"] == "Edited Synthetic" and row["deathAge"] is None
    assert row["intermentContainerTypeId"] is None and row["intermentDepthId"] is None
    assert delete_contract_interment(connection, identifier, number, "deleter", audit_enabled=True)
    assert get_contract_interments(connection, identifier) == []
    assert delete_contract_interment(connection, identifier, number, "repeat", audit_enabled=True)
    assert not update_contract_interment(connection, {**form, "intermentNumber": number}, "editor")
    assert not delete_contract_interment(connection, second, number, "wrong")
    assert not delete_contract_interment(connection, identifier, 999, "missing")
    assert add_contract_interment(connection, {**form, "deathAge": "0"}, "adder") == 2
    assert add_contract_interment(connection, {**form, "contractId": second}, "adder") == 1
    assert dict(connection.execute(sa.select(TABLES["Contracts"]).where(TABLES["Contracts"].c.contractId == identifier)).mappings().one()) == parent_before
    log = list(connection.execute(sa.select(TABLES["AuditLog"]).where(TABLES["AuditLog"].c.updateTable == "ContractInterments")).mappings())
    assert any(row["updateField"] == "deathAge" and row["fromValue"] == "76" and row["toValue"] is None for row in log)
    assert sum(row["updateType"] == "deleted" and row["updateField"] == "*" for row in log) == 2
    assert all(row["mainRecordType"] == "contract" and row["mainRecordId"] == str(identifier) and row["recordIndex"] == "1" for row in log)


def test_service_crud_duplicate_active_overwrite_revival_deleted_catalog_and_audit(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic type")
    identifier = add_contract(connection, contract_form(type_id), "creator")
    other = add_contract(connection, contract_form(type_id), "creator")
    service_id = insert(connection, "ServiceTypes", serviceType="Synthetic service", orderNumber=0)
    later_id = insert(connection, "ServiceTypes", serviceType="Later service", orderNumber=1)
    form = {"contractId": identifier, "serviceTypeId": service_id, "contractServiceDetails": "Synthetic details"}
    assert add_contract_service_type(connection, form, "adder", audit_enabled=True)
    assert add_contract_service_type(connection, {**form, "contractServiceDetails": "Duplicate overwrite"}, "duplicate", audit_enabled=True)
    assert get_contract_service_types(connection, identifier)[0]["contractServiceDetails"] == "Duplicate overwrite"
    assert not update_contract_service_type(connection, {**form, "contractId": other}, "wrong")
    assert update_contract_service_type(connection, {**form, "contractServiceDetails": ""}, "editor", audit_enabled=True)
    assert get_contract_service_types(connection, identifier)[0]["contractServiceDetails"] == ""
    assert delete_contract_service_type(connection, identifier, service_id, "deleter", audit_enabled=True)
    assert not delete_contract_service_type(connection, identifier, service_id, "repeat")
    assert not update_contract_service_type(connection, form, "editor")
    assert add_contract_service_type(connection, form, "restorer", audit_enabled=True)
    table = TABLES["ContractServiceTypes"]
    raw = connection.execute(sa.select(table).where(table.c.contractId == identifier, table.c.serviceTypeId == service_id)).mappings().one()
    assert raw["recordCreate_username"] == "adder" and raw["recordUpdate_username"] == "restorer"
    assert raw["recordDelete_username"] is None and raw["recordDelete_timeMillis"] is None
    add_contract_service_type(connection, {**form, "serviceTypeId": later_id}, "adder")
    assert [row["serviceTypeId"] for row in get_contract_service_types(connection, identifier)] == [service_id, later_id]
    connection.execute(TABLES["ServiceTypes"].update().where(TABLES["ServiceTypes"].c.serviceTypeId == service_id).values(recordDelete_timeMillis=10))
    assert [row["serviceTypeId"] for row in get_contract_service_types(connection, identifier)] == [later_id]
    assert get_contract(connection, identifier)["contractServiceTypes"] == get_contract_service_types(connection, identifier)
    log = list(connection.execute(sa.select(TABLES["AuditLog"]).where(TABLES["AuditLog"].c.updateTable == "ContractServiceTypes")).mappings())
    assert sum(row["updateType"] == "created" for row in log) == 3
    assert any(row["updateField"] == "contractServiceDetails" and row["toValue"] == '""' for row in log)
    assert any(row["updateType"] == "deleted" for row in log)


def test_interment_retrieval_deleted_catalog_binary_sort_and_contract_search(sql_connection):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic type")
    identifier = add_contract(connection, contract_form(type_id), "creator")
    container = insert(connection, "IntermentContainerTypes", intermentContainerType="Synthetic urn", isCremationType=True, orderNumber=2)
    depth = insert(connection, "IntermentDepths", intermentDepth="Synthetic depth")
    names = ["Synthetic", "Synthetic ", "Synthetic  ", "\ue000", "\U0001faa6"]
    for name in reversed(names):
        add_contract_interment(connection, interment_form(contractId=identifier, deceasedName=name, intermentContainerTypeId=container,
            intermentDepthId=depth), "adder")
    no_container = add_contract_interment(connection, interment_form(contractId=identifier, deceasedName="Last name"), "adder")
    connection.execute(TABLES["IntermentContainerTypes"].update().where(TABLES["IntermentContainerTypes"].c.intermentContainerTypeId == container).values(recordDelete_timeMillis=10))
    connection.execute(TABLES["IntermentDepths"].update().where(TABLES["IntermentDepths"].c.intermentDepthId == depth).values(recordDelete_timeMillis=10))
    rows = get_contract_interments(connection, identifier)
    assert rows[0]["intermentNumber"] == no_container
    assert [row["deceasedName"] for row in rows[1:]] == names
    assert rows[1]["intermentContainerType"] == "Synthetic urn" and rows[1]["intermentDepth"] == "Synthetic depth"
    assert get_contracts(connection, {"deceasedName": "synthetic"}, limit=-1)["count"] == 1
    for row in rows[1:4]:
        delete_contract_interment(connection, identifier, row["intermentNumber"], "deleter")
    assert get_contracts(connection, {"deceasedName": "synthetic"}, limit=-1)["count"] == 0


@pytest.mark.parametrize("action", ["add-interment", "update-interment", "delete-interment", "add-service", "update-service", "delete-service"])
def test_child_helpers_reject_deleted_parent_preserve_history(sql_connection, action):
    connection, _ = sql_connection
    type_id = insert(connection, "ContractTypes", contractType="Synthetic type")
    identifier = add_contract(connection, contract_form(type_id), "creator")
    service_id = insert(connection, "ServiceTypes", serviceType="Synthetic service")
    form = interment_form(contractId=identifier)
    number = add_contract_interment(connection, form, "adder")
    service = {"contractId": identifier, "serviceTypeId": service_id}
    add_contract_service_type(connection, service, "adder")
    assert delete_contract(connection, identifier, "deleter")
    with pytest.raises(ContractItemParentNotFound):
        if action == "add-interment":
            add_contract_interment(connection, form, "forbidden")
        elif action == "update-interment":
            update_contract_interment(connection, {**form, "intermentNumber": number}, "forbidden")
        elif action == "delete-interment":
            delete_contract_interment(connection, identifier, number, "forbidden")
        elif action == "add-service":
            add_contract_service_type(connection, service, "forbidden")
        elif action == "update-service":
            update_contract_service_type(connection, service, "forbidden")
        else:
            delete_contract_service_type(connection, identifier, service_id, "forbidden")
    assert len(get_contract_interments(connection, identifier)) == 1
    assert len(get_contract_service_types(connection, identifier)) == 1


@pytest.fixture
def item_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        type_id = insert(connection, "ContractTypes", contractType="Synthetic type")
        identifier = add_contract(connection, contract_form(type_id), "creator")
        other_id = add_contract(connection, contract_form(type_id), "creator")
        service_id = insert(connection, "ServiceTypes", serviceType="Synthetic service")
    names = ["admin", "reader", "updater", "cemetery", "contract", "work"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"],
        can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    app.state.test_contract_id, app.state.test_other_id, app.state.test_service_id = identifier, other_id, service_id
    return app


def login(client, name):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": name, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("name,can_update", [("admin", False), ("reader", False), ("updater", True), ("cemetery", False), ("contract", True), ("work", False)])
def test_child_http_independent_roles_csrf_and_source_aliases(item_app, name, can_update):
    identifier, service_id = item_app.state.test_contract_id, item_app.state.test_service_id
    with TestClient(item_app) as client:
        assert client.get(f"/api/contracts/{identifier}/interments").status_code == 401
        assert client.get(f"/api/contracts/{identifier}/services").status_code == 401
        headers = login(client, name)
        options = client.get("/api/contracts/meta?lng=en").json()["options"]
        assert options["deathAgePeriods"] == ["Years", "Months", "Days", "Stillborn"]
        assert len(options["purchaserRelationships"]) == 28
        assert options["purchaserRelationships"][0] == "Self" and options["purchaserRelationships"][-1] == "Friend"
        assert client.get(f"/api/contracts/{identifier}/interments").status_code == 200
        assert client.get(f"/api/contracts/{identifier}/services").status_code == 200
        form = interment_form(contractId=identifier, intermentNumber=1, serviceTypeId=service_id)
        for source in ("Interment", "ServiceType"):
            for action in ("Add", "Update", "Delete"):
                url = "/api/contracts/do" + action + "Contract" + source
                assert client.post(url, json=form).status_code == 403
                response = client.post(url, json=form, headers=headers)
                assert response.status_code == (200 if can_update else 403), response.text


def test_child_rest_workflow_persistence_parent_scope_and_source_update_missing_success(item_app):
    identifier, other_id, service_id = item_app.state.test_contract_id, item_app.state.test_other_id, item_app.state.test_service_id
    with TestClient(item_app) as client:
        headers = login(client, "contract")
        url = f"/api/contracts/{identifier}"
        response = client.post(url + "/interments", json=interment_form(contractId=other_id), headers=headers)
        assert response.status_code == 200, response.text
        number = response.json()["contractInterments"][0]["intermentNumber"]
        assert client.get(f"/api/contracts/{other_id}/interments").json()["contractInterments"] == []
        response = client.post(url + f"/interments/{number}", json=interment_form(deathAge="", intermentNumber=999, deceasedName="Edited Synthetic"), headers=headers)
        assert response.status_code == 200, response.text
        assert response.json()["contractInterments"][0]["deathAge"] is None
        assert response.json()["contractInterments"][0]["intermentNumber"] == number
        # Parent-scoped row numbers do not cross into a different contract.
        response = client.post(f"/api/contracts/{other_id}/interments/{number}", json=interment_form(), headers=headers)
        assert response.status_code == 200 and response.json()["contractInterments"] == []
        response = client.post(url + "/services", json={"serviceTypeId": service_id, "contractServiceDetails": "Synthetic details"}, headers=headers)
        assert response.status_code == 200, response.text
        response = client.post(url + f"/services/{service_id}", json={"contractServiceDetails": "Edited details"}, headers=headers)
        assert response.status_code == 200 and response.json()["contractServiceTypes"][0]["contractServiceDetails"] == "Edited details"
        assert client.post(f"/api/contracts/{other_id}/services/{service_id}", json={}, headers=headers).status_code == 400
        detail = client.get(url).json()["contract"]
        assert detail["contractInterments"][0]["deceasedName"] == "Edited Synthetic"
        assert detail["contractServiceTypes"][0]["contractServiceDetails"] == "Edited details"
        with item_app.state.db_engine.connect() as connection:
            stored = connection.execute(sa.select(TABLES["ContractInterments"]).where(TABLES["ContractInterments"].c.contractId == identifier)).mappings().one()
            assert stored["deceasedName"] == "Edited Synthetic" and stored["deathAge"] is None
        assert client.post(url + f"/interments/{number}/delete", json={}, headers=headers).json()["contractInterments"] == []
        assert client.post(url + f"/services/{service_id}/delete", json={}, headers=headers).json()["contractServiceTypes"] == []
        assert client.post(url + f"/services/{service_id}/delete", json={}, headers=headers).status_code == 400
        assert client.post(url + "/delete", json={}, headers=headers).status_code == 200
        assert client.get(url + "/interments").status_code == 404
        assert client.get(url + "/services").status_code == 404
        for source in ("Interment", "ServiceType"):
            for action in ("Add", "Update", "Delete"):
                response = client.post("/api/contracts/do" + action + "Contract" + source,
                    json=interment_form(contractId=identifier, intermentNumber=number, serviceTypeId=service_id), headers=headers)
                assert response.status_code == 404, response.text


@pytest.mark.parametrize("patch", [{"birthDay": "1.5"}, {"deathAge": "1.5"}, {"deathYear": "Infinity"},
    {"deceasedCity": "X" * 101}, {"deceasedName": "X" * 201}, {"intermentContainerTypeId": 999999}, {"intermentDepthId": 999999}])
def test_child_http_constraint_failures_roll_back_all_writes(item_app, patch):
    identifier = item_app.state.test_contract_id
    with TestClient(item_app) as client:
        headers = login(client, "contract")
        response = client.post(f"/api/contracts/{identifier}/interments", json=interment_form(**patch), headers=headers)
        assert response.status_code == 400, response.text
        assert client.get(f"/api/contracts/{identifier}/interments").json()["contractInterments"] == []
        with item_app.state.db_engine.connect() as connection:
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 0


def test_child_http_service_reference_and_input_failures_are_controlled(item_app):
    identifier, service_id = item_app.state.test_contract_id, item_app.state.test_service_id
    with TestClient(item_app) as client:
        headers = login(client, "contract")
        for form in ({}, {"serviceTypeId": 999999}, {"serviceTypeId": "1.5"}, {"serviceTypeId": service_id, "contractServiceDetails": []}):
            response = client.post(f"/api/contracts/{identifier}/services", json=form, headers=headers)
            assert response.status_code == 400, response.text
        assert client.get(f"/api/contracts/{identifier}/services").json()["contractServiceTypes"] == []
        assert client.post("/api/contracts/doAddContractInterment", json={}, headers=headers).status_code == 400
