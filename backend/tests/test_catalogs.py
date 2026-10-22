"""Catalogue parity, committed HTTP flows, and references on disposable SQL Server.

The recorded oracle executes frozen Sunrise modules. No SQLite database is used
by these target tests; sql_connection and migrated_sql_database own fresh MSSQL DBs.
"""

import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.catalogs import (
    CATALOGS, CatalogOptions, CatalogSourceError, add_catalog_record, delete_catalog_record,
    get_catalog_records, get_catalogs, get_contract_type_prints,
    get_effective_contract_type_prints, get_fee_categories, initialize_catalogs,
    move_catalog_record, update_catalog_record,
)
from cemaris.config import Settings
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions


REFERENCE = json.loads((Path(__file__).parent / "fixtures/catalog-reference.json").read_text(encoding="utf-8"))
ACTOR = "synthetic-catalog"


def add(connection, resource, form, **options):
    return add_catalog_record(connection, resource, form, ACTOR, **options)


def row(connection, table_name, id_field, identifier):
    table = TABLES[table_name]
    return dict(connection.execute(sa.select(table).where(table.c[id_field] == identifier)).mappings().one())


@pytest.mark.parametrize("case", REFERENCE["defaults"], ids=lambda c: c["resource"] + ":" + str(next(iter(c["form"].values()))))
def test_original_catalogue_insert_defaults(sql_connection, case):
    connection, _ = sql_connection
    identifier = add(connection, case["resource"], case["form"])
    stored = row(connection, case["table"], case["idField"], identifier)
    assert {key: stored[key] for key in case["expected"]} == case["expected"]
    assert stored["recordCreate_username"] == stored["recordUpdate_username"] == ACTOR
    assert stored["recordCreate_timeMillis"] == stored["recordUpdate_timeMillis"] > 0
    assert stored["recordDelete_timeMillis"] is None


@pytest.mark.parametrize("case", REFERENCE["fields"], ids=lambda c: c["resource"] + ":required=" + str(c["form"].get("isRequired", "omitted")))
def test_original_configurable_field_defaults(sql_connection, case):
    connection, _ = sql_connection
    form = dict(case["form"])
    expected = dict(case["expected"])
    if case["resource"] == "burialSiteTypeFields":
        parent = add(connection, "burialSiteTypes", {"burialSiteType": "Parent", "bodyCapacityMax": "", "crematedCapacityMax": ""})
        form[case["parentField"]] = expected[case["parentField"]] = parent
    identifier = add(connection, case["resource"], form)
    stored = row(connection, case["table"], case["idField"], identifier)
    assert {key: stored[key] for key in expected} == expected


@pytest.mark.parametrize("case", REFERENCE["moves"], ids=lambda c: c["direction"] + str(c["index"]))
def test_original_generic_adjacent_moves_and_boundaries(sql_connection, case):
    connection, _ = sql_connection
    table = TABLES["WorkOrderStatuses"]
    identifiers = [add(connection, "workOrderStatuses", {"workOrderStatus": name, "orderNumber": index}) for index, name in enumerate("ABC")]
    before = row(connection, "WorkOrderStatuses", "workOrderStatusId", identifiers[case["index"]])
    form = {"workOrderStatusId": identifiers[case["index"]]}
    if case["direction"] in ("top", "bottom"):
        form["moveToEnd"] = "1"
    direction = "up" if case["direction"] in ("up", "top") else "down"
    success = move_catalog_record(connection, "workOrderStatuses", form, direction)
    assert success is case["success"]
    actual = [{"name": record.workOrderStatus, "orderNumber": record.orderNumber}
              for record in connection.execute(sa.select(table.c.workOrderStatus, table.c.orderNumber).order_by(table.c.workOrderStatus))]
    assert actual == case["expected"]
    after = row(connection, "WorkOrderStatuses", "workOrderStatusId", identifiers[case["index"]])
    assert after["recordUpdate_timeMillis"] == before["recordUpdate_timeMillis"]
    assert after["recordUpdate_username"] == before["recordUpdate_username"]


def test_catalogue_reads_normalize_active_order_without_audit(sql_connection):
    connection, _ = sql_connection
    table = TABLES["BurialSiteTypes"]
    for name, order_number in (("B", 7), ("A", 7), ("Deleted", -9)):
        identifier = add(connection, "burialSiteTypes", {"burialSiteType": name, "bodyCapacityMax": "", "crematedCapacityMax": "", "orderNumber": order_number})
        if name == "Deleted":
            connection.execute(table.update().where(table.c.burialSiteTypeId == identifier).values(recordDelete_timeMillis=5))
    before = {record.burialSiteType: record.recordUpdate_timeMillis for record in connection.execute(sa.select(table))}
    get_catalog_records(connection, "burialSiteTypes", include_deleted=True)
    assert [{"name": record.burialSiteType, "orderNumber": record.orderNumber} for record in connection.execute(sa.select(table).order_by(table.c.burialSiteType))] == REFERENCE["readNormalization"]["afterIncludeDeleted"]
    state = get_catalogs(connection)
    assert [{"name": entry["burialSiteType"], "orderNumber": entry["orderNumber"]} for entry in state["burialSiteTypes"]] == REFERENCE["readNormalization"]["activeTypes"]
    assert [{"name": record.burialSiteType, "orderNumber": record.orderNumber} for record in connection.execute(sa.select(table).order_by(table.c.burialSiteType))] == REFERENCE["readNormalization"]["afterRead"]
    assert {record.burialSiteType: record.recordUpdate_timeMillis for record in connection.execute(sa.select(table))} == before
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 0


@pytest.mark.parametrize("resource,table,id_field,label,key_field", [
    ("committalTypes", "CommittalTypes", "committalTypeId", "committalType", "committalTypeKey"),
    ("intermentContainerTypes", "IntermentContainerTypes", "intermentContainerTypeId", "intermentContainerType", "intermentContainerTypeKey"),
    ("intermentDepths", "IntermentDepths", "intermentDepthId", "intermentDepth", "intermentDepthKey"),
])
def test_source_keys_are_immutable_on_update(sql_connection, resource, table, id_field, label, key_field):
    connection, _ = sql_connection
    identifier = add(connection, resource, {label: "Before", key_field: "original"})
    assert update_catalog_record(connection, resource, {id_field: identifier, label: "After", key_field: "replacement", "isCremationType": "1"}, "updater")
    stored = row(connection, table, id_field, identifier)
    assert stored[label] == "After" and stored[key_field] == "original"
    assert stored["recordUpdate_username"] == "updater"


def test_contract_fields_keep_parent_on_update_and_general_fields_separate(sql_connection):
    connection, _ = sql_connection
    parent = add(connection, "contractTypes", {"contractType": "Parent"})
    other = add(connection, "contractTypes", {"contractType": "Other"})
    common = add(connection, "contractTypeFields", {"contractTypeField": "Common", "contractTypeId": "", "isRequired": ""})
    specific = add(connection, "contractTypeFields", {"contractTypeField": "Specific", "contractTypeId": parent, "isRequired": ""})
    assert update_catalog_record(connection, "contractTypeFields", {"contractTypeFieldId": specific, "contractTypeId": other, "contractTypeField": "Edited", "fieldType": "select", "fieldValues": "A\nB", "isRequired": "1.9", "minLength": 0, "maxLength": 10, "pattern": "[AB]"}, "updater")
    stored = row(connection, "ContractTypeFields", "contractTypeFieldId", specific)
    assert stored["contractTypeId"] == parent
    assert stored["isRequired"] is True and stored["fieldValues"] == "A\nB"
    state = get_catalogs(connection)
    by_id = {entry["contractTypeId"]: entry for entry in state["contractTypes"]}
    assert [entry["contractTypeFieldId"] for entry in by_id[parent]["contractTypeFields"]] == [specific]
    assert by_id[other]["contractTypeFields"] == []
    assert [entry["contractTypeFieldId"] for entry in state["allContractTypeFields"]] == [common]


def test_configurable_field_moves_are_scoped_and_global_source_error_is_explicit(sql_connection):
    connection, _ = sql_connection
    parents = [add(connection, "contractTypes", {"contractType": name}) for name in ("One", "Two")]
    forms = [(parents[0], "First", 0), (parents[0], "Second", 1), (parents[1], "Other", 0), ("", "Global First", 0), ("", "Global Second", 1)]
    ids = [add(connection, "contractTypeFields", {"contractTypeId": parent, "contractTypeField": name, "isRequired": "", "orderNumber": order}) for parent, name, order in forms]
    assert move_catalog_record(connection, "contractTypeFields", {"contractTypeFieldId": ids[1]}, "up")
    assert [row(connection, "ContractTypeFields", "contractTypeFieldId", identifier)["orderNumber"] for identifier in ids] == [1, 0, 0, 0, 1]
    with pytest.raises(CatalogSourceError):
        move_catalog_record(connection, "contractTypeFields", {"contractTypeFieldId": ids[4]}, "up")
    assert row(connection, "ContractTypeFields", "contractTypeFieldId", ids[4])["orderNumber"] == 1
    assert move_catalog_record(connection, "contractTypeFields", {"contractTypeFieldId": ids[4], "moveToEnd": "1"}, "up")
    general = get_catalog_records(connection, "contractTypeFields")
    assert [record["contractTypeFieldId"] for record in general] == [ids[4], ids[3]]


def test_print_assignments_filter_normalize_expand_wildcard_and_restore(sql_connection):
    connection, _ = sql_connection
    parent = add(connection, "contractTypes", {"contractType": "Print parent"})
    options = CatalogOptions(_env_file=None, contract_prints=["contract.sample", "contract.second"])
    for print_name, order_number in [("contract.sample", 9), ("unconfigured", 4), ("*", 7)]:
        assert add(connection, "contractTypePrints", {"contractTypeId": parent, "printEJS": print_name, "orderNumber": order_number})
    assert get_contract_type_prints(connection, parent, options=options) == REFERENCE["prints"]["visible"]
    table = TABLES["ContractTypePrints"]
    assert [dict(record) for record in connection.execute(sa.select(table.c.printEJS, table.c.orderNumber).order_by(table.c.printEJS)).mappings()] == REFERENCE["prints"]["rows"]
    assert get_effective_contract_type_prints(connection, parent, options=options) == options.contract_prints
    form = {"contractTypeId": parent, "printEJS": "contract.sample"}
    before = connection.execute(sa.select(table).where(table.c.contractTypeId == parent, table.c.printEJS == "contract.sample")).mappings().one()
    assert delete_catalog_record(connection, "contractTypePrints", form, "deleter")
    assert delete_catalog_record(connection, "contractTypePrints", form, "again")
    assert add(connection, "contractTypePrints", {**form, "orderNumber": 99})
    after = connection.execute(sa.select(table).where(table.c.contractTypeId == parent, table.c.printEJS == "contract.sample")).mappings().one()
    assert after["recordDelete_timeMillis"] is None and after["orderNumber"] == before["orderNumber"]
    assert after["recordCreate_timeMillis"] == before["recordCreate_timeMillis"]
    assert connection.scalar(sa.select(sa.func.count()).select_from(table)) == 3


@pytest.mark.parametrize("case", REFERENCE["feeFilters"], ids=lambda c: str(c["filters"]) + ":include=" + str(c["includeFees"]))
def test_original_fee_filters_and_conditional_read_side_effects(sql_connection, case):
    connection, _ = sql_connection
    contracts = []
    plots = []
    for name in ("First", "Second"):
        contracts.append(add(connection, "contractTypes", {"contractType": name}))
        plots.append(add(connection, "burialSiteTypes", {"burialSiteType": name, "bodyCapacityMax": "", "crematedCapacityMax": ""}))
    first = add(connection, "feeCategories", {"feeCategory": "Alpha", "orderNumber": 8})
    second = add(connection, "feeCategories", {"feeCategory": "Beta", "orderNumber": 9})
    base = {"feeDescription": "", "feeAccount": "", "feeAmount": "", "taxAmount": "", "taxPercentage": ""}
    for fee_name, category, contract, plot, order_number in [("Cross A", first, contracts[0], plots[1], 10), ("Cross B", first, contracts[1], plots[0], 12), ("Global", second, "", "", 7)]:
        add(connection, "fees", {**base, "feeName": fee_name, "feeCategoryId": category, "contractTypeId": contract, "burialSiteTypeId": plot, "orderNumber": order_number})
    filters = dict(case["filters"])
    for key, values in [("contractTypeId", contracts), ("burialSiteTypeId", plots), ("feeCategoryId", [first, second])]:
        if filters.get(key) in (1, 2):
            filters[key] = values[filters[key] - 1]
    selected = get_fee_categories(connection, filters, include_fees=case["includeFees"])
    actual = [{"name": record["feeCategory"], "orderNumber": record["orderNumber"], **({"fees": [{"name": fee["feeName"], "orderNumber": fee["orderNumber"]} for fee in record["fees"]]} if case["includeFees"] else {})} for record in selected]
    assert actual == case["selected"]
    for table_name, label, expected_key in [("FeeCategories", "feeCategory", "persistedCategories"), ("Fees", "feeName", "persistedFees")]:
        table = TABLES[table_name]
        persisted = [{"name": record[label], "orderNumber": record["orderNumber"]} for record in connection.execute(sa.select(table).order_by(table.c[label])).mappings()]
        assert persisted == case[expected_key]


@pytest.mark.parametrize("resource,id_field,fixture_key,table,main_table,main_id,main_fixture,children", [
    ("burialSiteTypes", "burialSiteTypeId", "burial_site_type", "BurialSiteTypes", "BurialSites", "burialSiteId", "burial_site", ["BurialSiteTypeFields"]),
    ("contractTypes", "contractTypeId", "contract_type", "ContractTypes", "Contracts", "contractId", "contract", ["ContractTypeFields", "ContractTypePrints"]),
    ("serviceTypes", "serviceTypeId", "service_type", "ServiceTypes", "ContractServiceTypes", "serviceTypeId", "service_type", []),
    ("feeCategories", "feeCategoryId", "fee_category", "FeeCategories", "Fees", "feeId", "fee", []),
    ("fees", "feeId", "fee", "Fees", "ContractFees", "feeId", "fee", []),
])
def test_source_reference_behavior_is_soft_delete_without_usage_guard(sql_connection, resource, id_field, fixture_key, table, main_table, main_id, main_fixture, children):
    connection, name = sql_connection
    fixtures = load_synthetic_fixtures(connection, expected_database=name)
    identifier = fixtures.ids[fixture_key]
    assert delete_catalog_record(connection, resource, {id_field: identifier}, "deleter", audit_enabled=True)
    parent = row(connection, table, id_field, identifier)
    assert parent["recordDelete_username"] == "deleter" and parent["recordDelete_timeMillis"] > 0
    referenced = row(connection, main_table, main_id, fixtures.ids[main_fixture])
    assert referenced["recordDelete_timeMillis"] is None
    for child_name in children:
        child = TABLES[child_name]
        records = connection.execute(sa.select(child).where(child.c[id_field] == identifier)).mappings().all()
        assert records and all(record["recordDelete_timeMillis"] == parent["recordDelete_timeMillis"] for record in records)
    assert not delete_catalog_record(connection, resource, {id_field: identifier}, "again", audit_enabled=True)


def test_generic_audit_and_work_order_status_source_asymmetry(sql_connection):
    connection, _ = sql_connection
    for resource, label, id_field in [("burialSiteStatuses", "burialSiteStatus", "burialSiteStatusId"), ("workOrderStatuses", "workOrderStatus", "workOrderStatusId")]:
        identifier = add(connection, resource, {label: "Before", "orderNumber": ""}, audit_enabled=True)
        assert update_catalog_record(connection, resource, {id_field: identifier, label: "After"}, "updater", audit_enabled=True)
        assert delete_catalog_record(connection, resource, {id_field: identifier}, "deleter", audit_enabled=True)
    logs = [dict(record) for record in connection.execute(sa.select(TABLES["AuditLog"])).mappings()]
    burial = [record for record in logs if record["updateTable"] == "BurialSiteStatuses"]
    work = [record for record in logs if record["updateTable"] == "WorkOrderStatuses"]
    assert [record["updateType"] for record in work] == ["created"]
    assert isinstance(json.loads(work[0]["toValue"]), list)
    assert any(record["updateType"] == "created" for record in burial)
    assert any(record["updateType"] == "updated" and record["updateField"] == "burialSiteStatus" and json.loads(record["fromValue"]) == "Before" and json.loads(record["toValue"]) == "After" for record in burial)
    assert any(record["updateType"] == "deleted" and record["toValue"] is None for record in burial)


def test_fee_nulls_function_text_counts_and_category_scoped_moves(sql_connection):
    connection, _ = sql_connection
    categories = [add(connection, "feeCategories", {"feeCategory": value}) for value in ("First", "Second")]
    common = {"feeDescription": "Synthetisch", "feeAccount": "TEST", "contractTypeId": "", "burialSiteTypeId": "", "feeAmount": "", "taxAmount": "", "taxPercentage": "", "feeFunction": "custom.function", "includeQuantity": "1", "quantityUnit": "Stück", "isRequired": ""}
    ids = [add(connection, "fees", {**common, "feeCategoryId": category, "feeName": name, "orderNumber": order}) for category, name, order in [(categories[0], "A", 0), (categories[0], "B", 1), (categories[1], "C", 0)]]
    stored = row(connection, "Fees", "feeId", ids[0])
    assert stored["feeAmount"] is stored["taxAmount"] is stored["taxPercentage"] is None
    assert stored["contractTypeId"] is stored["burialSiteTypeId"] is None
    assert stored["feeFunction"] == "custom.function" and stored["includeQuantity"] is True
    assert move_catalog_record(connection, "fees", {"feeId": ids[0]}, "down")
    assert [row(connection, "Fees", "feeId", identifier)["orderNumber"] for identifier in ids] == [1, 0, 0]
    state = get_catalogs(connection)
    fees = [fee for category in state["feeCategories"] for fee in category["fees"]]
    assert all(fee["contractFeeCount"] == 0 for fee in fees)
    assert next(fee for fee in fees if fee["feeId"] == ids[0])["feeAmount"] is None


def test_german_seed_initialization_and_repeat_read_side_effects(sql_connection):
    connection, _ = sql_connection
    inserted = initialize_catalogs(connection, audit_enabled=True)
    assert sum(inserted.values()) == 46
    for expected_key in ("seeded", "reread"):
        if expected_key == "reread":
            assert sum(initialize_catalogs(connection, audit_enabled=True).values()) == 0
        for table_name, expected in REFERENCE["initialization"][expected_key].items():
            table = TABLES[table_name]
            name_field = next(key for name, _, key in CATALOGS.values() if name == table_name)
            actual = [{"name": record[name_field], "orderNumber": record["orderNumber"]} for record in connection.execute(sa.select(table).order_by(table.c[name_field])).mappings()]
            from cemaris.db.seed import DEFAULT_CATALOGS
            expected_rows = [dict(row) for row in DEFAULT_CATALOGS[table_name]]
            if expected_key == "reread" and table_name != "FeeCategories":
                expected_rows.sort(key=lambda row: (row["orderNumber"], row[name_field]))
                expected_rows = [{**row, "orderNumber": index} for index, row in enumerate(expected_rows)]
            expected = sorted([{"name": row[name_field], "orderNumber": row["orderNumber"]} for row in expected_rows], key=lambda row: row["name"])
            assert actual == expected
    logs = list(connection.execute(sa.select(TABLES["AuditLog"])).mappings())
    assert len(logs) == 41  # All source initial catalogs except five fee categories.
    assert all(record["updateUsername"] == "databaseInit" and record["updateType"] == "created" for record in logs)
    assert get_catalogs(connection)["contractTypes"][0]["contractType"] == "Vorsorge"
    burial_types = TABLES["BurialSiteTypes"]
    # pyodbc permits one active result per connection without MARS. Materialize
    # the fixture IDs before invoking application queries on this connection.
    for identifier in connection.scalars(sa.select(burial_types.c.burialSiteTypeId)).all():
        assert delete_catalog_record(connection, "burialSiteTypes", {"burialSiteTypeId": identifier}, "deleter")
    assert get_catalogs(connection)["burialSiteTypes"] == []
    # Only the explicit initializer restores defaults, never an ordinary GET.
    assert initialize_catalogs(connection)["BurialSiteTypes"] == 6


def test_fee_amount_only_preserves_other_properties_and_source_audit_shape(sql_connection):
    connection, _ = sql_connection
    category = add(connection, "feeCategories", {"feeCategory": "Amounts"})
    identifier = add(connection, "fees", {"feeCategoryId": category, "feeName": "Synthetic", "feeDescription": "Details", "feeAccount": "TEST", "contractTypeId": "", "burialSiteTypeId": "", "feeAmount": "", "taxAmount": "1.5", "taxPercentage": "19", "quantityUnit": "Stück"}, audit_enabled=True)
    before = row(connection, "Fees", "feeId", identifier)
    assert update_catalog_record(connection, "fees", {"feeId": identifier, "feeAmount": "12.345"}, "updater", amount_only=True, audit_enabled=True)
    after = row(connection, "Fees", "feeId", identifier)
    assert after["feeAmount"] == 12.345
    assert after["taxAmount"] == before["taxAmount"] == 1.5
    assert after["feeDescription"] == before["feeDescription"] == "Details"
    logs = list(connection.execute(sa.select(TABLES["AuditLog"])).mappings())
    created = next(record for record in logs if record["updateType"] == "created")
    assert json.loads(created["toValue"])["feeAmount"] == 0
    assert "recordCreate_username" not in json.loads(created["toValue"])
    amount = next(record for record in logs if record["updateField"] == "feeAmount")
    assert amount["fromValue"] == "0" and amount["toValue"] == "12.345"
    assert not any(record["updateField"] == "recordUpdate_username" for record in logs)


def test_configuration_exposes_custom_prints_and_source_empty_fee_function_selector(sql_connection):
    connection, _ = sql_connection
    from cemaris.preferences import update_setting

    assert update_setting(connection, "burialSiteTypes.bodyCapacityMaxDefault", "5")
    options = CatalogOptions(_env_file=None, contract_prints=["screen/contract", "pdf/custom", "unknown"], custom_pdf_print_titles={"custom": "Synthetische Vorlage"}, fee_tax_percentage_default=19)
    config = get_catalogs(connection, options=options)["config"]
    assert "portalEnabled" not in config and config["bodyCapacityMaxDefault"] == "5"
    assert config["taxPercentageDefault"] == 19
    assert config["fieldTypes"] == ["text", "date", "select"] and config["feeFunctions"] == {}
    assert config["availablePrints"] == options.contract_prints
    assert config["contractTypePrintTitles"]["pdf/custom"] == "Synthetische Vorlage"
    assert "unknown" not in config["contractTypePrintTitles"]


def login(client, username="admin"):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.fixture
def catalog_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    # Direct tests roll back. HTTP cases commit, so this fresh module DB is reset
    # in reverse FK order before each HTTP case, never a caller-selected DB.
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
    names = ["admin", "reader", "updater", "cemetery", "contract"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}}, session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"], can_update_contracts=["contract"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth, preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
    app.state.db_engine = engine
    return app


@pytest.mark.parametrize("username,expected", [("admin", 200), ("reader", 403), ("updater", 403)])
def test_catalogue_administration_uses_independent_admin_role(catalog_app, username, expected):
    with TestClient(catalog_app) as client:
        assert client.get("/api/admin/catalogs").status_code == 401
        headers = login(client, username)
        assert client.get("/api/admin/catalogs").status_code == expected
        response = client.post("/api/admin/catalogs/contractTypes/add", json={"contractType": "Role test"}, headers=headers)
        assert response.status_code == expected, response.text
        if expected == 200:
            assert response.json()["success"] is True


def test_catalogue_http_crud_csrf_persistence_and_errors(catalog_app):
    with TestClient(catalog_app) as client:
        headers = login(client)
        endpoint = "/api/admin/catalogs/contractTypes/"
        assert client.post(endpoint + "add", json={"contractType": "Unprotected"}).status_code == 403
        response = client.post(endpoint + "add", json={"contractType": "Before", "isPreneed": "0"}, headers=headers)
        assert response.status_code == 200, response.text
        created = next(record for record in response.json()["contractTypes"] if record["contractType"] == "Before")
        identifier = created["contractTypeId"]
        assert created["isPreneed"] == 1
        response = client.post(endpoint + "update", json={"contractTypeId": identifier, "contractType": "After"}, headers=headers)
        assert response.status_code == 200 and response.json()["success"] is True
        # New connection proves HTTP transaction was committed.
        with catalog_app.state.db_engine.connect() as connection:
            stored = row(connection, "ContractTypes", "contractTypeId", identifier)
            assert stored["contractType"] == "After" and stored["isPreneed"] is False
        reloaded = client.get("/api/admin/catalogs").json()
        assert any(record["contractTypeId"] == identifier and record["contractType"] == "After" for record in reloaded["contractTypes"])
        response = client.post(endpoint + "delete", json={"contractTypeId": identifier}, headers=headers)
        assert response.status_code == 200 and response.json()["success"] is True
        assert all(record["contractTypeId"] != identifier for record in client.get("/api/admin/catalogs").json()["contractTypes"])
        for resource in ("AuditLog", "Users", "unknown"):
            assert client.post(f"/api/admin/catalogs/{resource}/delete", json={"recordId": identifier}, headers=headers).status_code in (400, 404, 422)
        missing = client.post(endpoint + "update", json={"contractTypeId": 999999, "contractType": "Missing"}, headers=headers)
        assert missing.status_code == 200 and missing.json()["success"] is False
        assert client.post(endpoint + "add", json={}, headers=headers).status_code in (400, 422)


@pytest.mark.parametrize("username,expected", [("admin", [403, 403]), ("reader", [403, 403]), ("updater", [200, 200]), ("cemetery", [200, 403]), ("contract", [403, 200])])
def test_source_field_selection_routes_follow_independent_update_roles(catalog_app, username, expected):
    engine = catalog_app.state.db_engine
    contract = add(engine, "contractTypes", {"contractType": "Selected"})
    plot = add(engine, "burialSiteTypes", {"burialSiteType": "Selected", "bodyCapacityMax": "", "crematedCapacityMax": ""})
    global_field = add(engine, "contractTypeFields", {"contractTypeId": "", "contractTypeField": "General", "isRequired": ""})
    own_field = add(engine, "contractTypeFields", {"contractTypeId": contract, "contractTypeField": "Specific", "isRequired": ""})
    plot_field = add(engine, "burialSiteTypeFields", {"burialSiteTypeId": plot, "burialSiteTypeField": "Plot field", "isRequired": ""})
    with TestClient(catalog_app) as client:
        headers = login(client, username)
        for index, (path, field, identifier, response_key, expected_ids, id_key) in enumerate([
            ("/api/burialSites/typeFields", "burialSiteTypeId", plot, "burialSiteTypeFields", [plot_field], "burialSiteTypeFieldId"),
            ("/api/contracts/typeFields", "contractTypeId", contract, "contractTypeFields", [global_field, own_field], "contractTypeFieldId"),
        ]):
            assert client.post(path, json={field: str(identifier)}).status_code == 403
            response = client.post(path, json={field: str(identifier) + ".9"}, headers=headers)
            assert response.status_code == expected[index], response.text
            if response.status_code == 200:
                assert [entry[id_key] for entry in response.json()[response_key]] == expected_ids
        if username == "updater":
            assert client.post("/api/burialSites/typeFields", json={"burialSiteTypeId": "999999"}, headers=headers).json() == {"burialSiteTypeFields": []}
            missing = client.post("/api/contracts/typeFields", json={"contractTypeId": "999999"}, headers=headers)
            assert missing.status_code == 409 and missing.json()["code"] == "source_missing_contract_type"
