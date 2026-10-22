"""Standalone import persistence on the existing disposable SQL fixture."""

import csv
from datetime import date
import json
from pathlib import Path

import pytest
import sqlalchemy as sa

from cemaris.burial_sites import BurialSiteOptions
from cemaris.catalogs import add_catalog_record
from cemaris.contracts import add_contract, get_contract
from cemaris.db.schema import TABLES
from cemaris.import_tools.legacy import DATA, import_master, import_prepaid, import_work_orders
from cemaris.import_tools.sql import SqlImportGateway, import_legacy_csv, require_disposable_database
from cemaris.preferences import get_setting_value
from cemaris.work_orders import add_work_order, close_work_order


FIXTURE = json.loads((Path(__file__).parent / "fixtures/imports-reference.json").read_text(encoding="utf-8"))
NAMING = BurialSiteOptions(burial_site_name_segments={"includeCemeteryKey": True, "separator": "-",
    "segments": {str(i): {"isAvailable": True, "isRequired": True} for i in range(1, 5)}})
MAPPING = {"cemeteries": {}, "funeralHomes": [], "city": "Synthetic", "province": "BB"}


def count(connection, name):
    return connection.scalar(sa.select(sa.func.count()).select_from(TABLES[name]))


def gateway(connection, state=None):
    state = state or {}
    result = SqlImportGateway(connection, mapping=MAPPING, burial_site_options=NAMING)
    result.initialize()
    if not state.get("noOptional"):
        for name in ("Acknowledged", "Death"):
            add_catalog_record(connection, "workOrderMilestoneTypes", dict(workOrderMilestoneType=name), "fixture")
    return result


@pytest.mark.parametrize("case", [case for case in FIXTURE["scenarios"] if case["kind"] == "master"], ids=lambda case: case["name"])
def test_legacy_master_source_scenarios_persist(sql_connection, case):
    connection, _ = sql_connection
    target = gateway(connection)
    if case["state"].get("site"):
        target.site(case["rows"][0], "CM_", "Occupied")
    import_master(target, case["rows"])
    expected = case["operations"]
    assert count(connection, "Contracts") == sum(operation["operation"] == "addContract" for operation in expected)
    assert count(connection, "ContractInterments") == sum(operation["operation"] == "addContract" and bool(operation["form"].get("deceasedName")) for operation in expected)
    assert count(connection, "ContractComments") == sum(operation["operation"] == "addContractComment" for operation in expected)
    assert count(connection, "RelatedContracts") == sum(operation["operation"] == "addRelatedContract" for operation in expected)
    assert count(connection, "ContractServiceTypes") == sum(operation["operation"] == "addContractServiceType" for operation in expected)
    if count(connection, "Contracts"):
        row = connection.execute(sa.select(TABLES["Contracts"]).order_by(TABLES["Contracts"].c.contractId)).mappings().first()
        assert row["recordCreate_username"] == "import.unix"
        assert row["contractStartDate"] > 0


@pytest.mark.parametrize("case", [case for case in FIXTURE["scenarios"] if case["kind"] == "prepaid"], ids=lambda case: case["name"])
def test_legacy_prepaid_source_scenarios_persist(sql_connection, case):
    connection, _ = sql_connection
    target = gateway(connection)
    if case["state"].get("site"):
        site = target.site(case["rows"][0], "CMPP_", "Available" if case["state"].get("status") == 101 else "Occupied")
        if case["state"].get("preneed"):
            add_contract(connection, dict(contractTypeId=target.id("ContractTypes", "Preneed"), burialSiteId=site["burialSiteId"],
                deceasedName="Synthetic Person", contractStartDateString="2020-02-03"), "fixture")
    before = count(connection, "Contracts")
    import_prepaid(target, case["rows"])
    expected = case["operations"]
    assert count(connection, "Contracts") - before == sum(operation["operation"] == "addContract" for operation in expected)
    assert count(connection, "ContractComments") == sum(operation["operation"] == "addContractComment" for operation in expected)
    assert count(connection, "ContractFees") == sum(operation["operation"] == "addContractFee" for operation in expected)
    assert count(connection, "ContractTransactions") == sum(operation["operation"] == "addContractTransaction" for operation in expected)
    if count(connection, "ContractTransactions"):
        actual = connection.scalar(sa.select(TABLES["ContractTransactions"].c.transactionAmount))
        original = next(operation["form"]["transactionAmount"] for operation in expected if operation["operation"] == "addContractTransaction")
        assert actual == original
    if count(connection, "Fees"):
        assert connection.scalar(sa.select(TABLES["FeeCategories"].c.feeCategory).where(TABLES["FeeCategories"].c.feeCategoryId == target.fee_category_id)) == "Legacy CSV Import"


@pytest.mark.parametrize("case", [case for case in FIXTURE["scenarios"] if case["kind"] == "workOrder"], ids=lambda case: case["name"])
def test_legacy_work_order_source_scenarios_persist(sql_connection, case):
    connection, _ = sql_connection
    target = gateway(connection, case["state"])
    if case["state"].get("site"):
        site = target.site(case["rows"][0], "WO_", "Occupied")
    if case["state"].get("order"):
        identifier = add_work_order(connection, dict(workOrderNumber="000042", workOrderDescription="previous",
            workOrderOpenDateString="2025-04-01", workOrderTypeId=target.id("WorkOrderTypes", "Interment"),
            workOrderStatusId=target.id("WorkOrderStatuses", "Entered")), "fixture")
        if case["state"].get("closed"):
            close_work_order(connection, dict(workOrderId=identifier, workOrderCloseDateString="2025-04-07"), "fixture")
        if case["state"].get("linked"):
            target.call("addWorkOrderBurialSite", dict(workOrderId=identifier, burialSiteId=site["burialSiteId"]))
    import_work_orders(target, case["rows"], current_date=date(2026, 10, 20))
    expected = case["operations"]
    assert count(connection, "WorkOrders") == 1
    assert count(connection, "Contracts") == len(case["rows"])
    assert count(connection, "WorkOrderContracts") == len(case["rows"])
    assert count(connection, "WorkOrderMilestones") == sum(operation["operation"] == "addWorkOrderMilestone" for operation in expected)
    order = connection.execute(sa.select(TABLES["WorkOrders"])).mappings().one()
    assert order["workOrderNumber"] == "000042"
    assert (order["workOrderCloseDate"] is not None) == any(operation["operation"] == "closeWorkOrder" for operation in expected)


def write_csv(path, kind, rows):
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=DATA["fields"][kind])
        writer.writeheader()
        writer.writerows(rows)
    return path


def test_complete_legacy_entrypoint_reset_and_rerun(sql_connection, tmp_path):
    connection, _ = sql_connection
    master = FIXTURE["scenarios"][0]["rows"]
    prepaid = next(case for case in FIXTURE["scenarios"] if case["name"] == "prepaid-all-fees")["rows"]
    work = next(case for case in FIXTURE["scenarios"] if case["name"] == "workorder-close-all-complete")["rows"]
    paths = [write_csv(tmp_path / filename, kind, rows) for filename, kind, rows in (
        ("CMMASTER.csv", "master", master), ("CMPRPAID.csv", "prepaid", prepaid), ("CMWKORDR.csv", "workOrder", work))]
    for _ in range(2):
        result = import_legacy_csv(connection, *paths, mapping=MAPPING, burial_site_options=NAMING, current_date=date(2026, 10, 20))
        assert result["masterRows"] == result["prepaidRows"] == result["workOrderRows"] == 1
        assert count(connection, "Contracts") == 3
        assert count(connection, "ContractInterments") == 3
        assert count(connection, "BurialSites") == 1
        assert count(connection, "ContractFees") == 8
        assert count(connection, "ContractTransactions") == 1
        assert get_setting_value(connection, "defaults.city") == "Synthetic"
        assert get_setting_value(connection, "defaults.province") == "BB"
        # Fee catalogs intentionally survive source reset. Their newly created
        # category remains a valid SQL FK on the second pass.
        assert count(connection, "Fees") == 8
        assert count(connection, "ContractTypePrints") >= 4


def test_default_regional_initializers(sql_connection, tmp_path):
    connection, _ = sql_connection
    target = SqlImportGateway(connection, burial_site_options=NAMING)
    target.initialize()
    assert count(connection, "FuneralHomes") == 10
    cemetery = target.cemetery("NG")
    assert target.cemetery("NG") == cemetery
    assert target.key("FuneralHomes", "AR") == target.funeral_home_ids["AR"]


def test_legacy_audit_and_unknown_catalog_keys(sql_connection):
    connection, _ = sql_connection
    target = gateway(connection)
    target.audit_enabled = True
    row = FIXTURE["scenarios"][0]["rows"][0]
    import_master(target, [row])
    assert count(connection, "AuditLog") > 0
    assert target.key("IntermentDepths", "Z") == target.key("IntermentDepths", "Z")
    assert target.key("IntermentContainerTypes", "Y") == target.key("IntermentContainerTypes", "Y")
    assert target.key("CommittalTypes", "X") == target.key("CommittalTypes", "X")
    assert target.key("FuneralHomes", "SYN") == target.key("FuneralHomes", "SYN")
    # Actual original get* SQL readers + legacy cache.find operations select
    # by catalog order/name (container cremation flag first), not identity.
    for case in FIXTURE["lookupCases"]:
        resource = case["table"][0].lower() + case["table"][1:]
        identifiers = {}
        for source in case["rows"]:
            form = {key: value for key, value in source.items() if key != case["idKey"]}
            if "isCremationType" in form:
                form["isCremationType"] = bool(form["isCremationType"])
            identifiers[source[case["idKey"]]] = add_catalog_record(connection, resource, form, "fixture")
        for query in case["queries"]:
            assert target.key(case["table"], query["key"]) == identifiers[query["expectedId"]]
    case = FIXTURE["nameLookup"]
    identifiers = {source[case["idKey"]]: add_catalog_record(connection, "contractTypes",
        {key: value for key, value in source.items() if key != case["idKey"]}, "fixture") for source in case["rows"]}
    assert target.id(case["table"], case["name"]) == identifiers[case["expectedId"]]
    categories = {source_id: add_catalog_record(connection, "feeCategories", dict(feeCategory="Synthetic " + str(source_id)), "fixture")
                  for source_id in (10, 20)}
    case = FIXTURE["feeLookup"]
    identifiers = {source["feeId"]: add_catalog_record(connection, "fees", dict(feeCategoryId=categories[source["feeCategoryId"]],
        feeName=source["feeName"], feeDescription=source["feeDescription"], feeAccount="", contractTypeId="", burialSiteTypeId=""), "fixture") for source in case["rows"]}
    assert target.fee("CMPP_FEE_DUP") == identifiers[case["expectedId"]]
    new_fee = target.fee("CMPP_FEE_NEW")
    stored = connection.execute(sa.select(TABLES["Fees"]).where(TABLES["Fees"].c.feeId == new_fee)).mappings().one()
    assert stored["feeCategoryId"] == categories[case["createdForm"]["feeCategoryId"]]


def test_disposable_database_guard_rejects_existing_names_without_mutation(sql_connection):
    connection, name = sql_connection
    assert require_disposable_database(connection) == name


@pytest.mark.parametrize("name", ["master", "cemaris", "cemaris_test_02_existing", "cemaris_test_02_" + "g" * 32])
def test_database_name_guard_before_any_import_reads(name):
    class Connection:
        dialect = type("Dialect", (), {"name": "mssql"})()
        def scalar(self, statement):
            return name
    with pytest.raises(ValueError, match="explicitly disposable"):
        require_disposable_database(Connection())


def test_non_sql_import_rejected():
    class Connection:
        dialect = type("Dialect", (), {"name": "postgresql"})()
    with pytest.raises(ValueError, match="Microsoft SQL Server"):
        require_disposable_database(Connection())
