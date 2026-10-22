"""Deterministic, fictional records for disposable SQL Server tests only.

This is a persistence fixture, not an application initializer, portal contract
fixture, document store or EDWALT migration. No connection, commit, deletion,
external request or file write is performed here. The caller creates an empty
dedicated test database and owns the transaction and its eventual disposal.
Schema/relationships follow Sunrise CMS at
451ce034863b16502484367044f3e9b65370111a (MIT; licenses/Sunrise-LICENSE.md).
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any

from sqlalchemy import Connection, select, text

from cemaris.db.schema import TABLES


FIXTURE_USERNAME = "fixture_admin"
FIXTURE_TIME_MILLIS = 1_792_411_200_000  # 2026-10-19T12:00:00Z; exceeds INT32.


class UnsafeFixtureDatabase(ValueError):
    """The supplied connection does not identify an empty disposable test DB."""


@dataclass(frozen=True)
class FixtureData:
    ids: dict[str, int]
    row_counts: dict[str, int]


def load_synthetic_fixtures(
    connection: Connection, *, expected_database: str
) -> FixtureData:
    """Insert a connected example across all 41 tables into an empty test DB.

    SQL Server must report the exact explicitly supplied database name, which
    must start with ``cemaris_test_``. Every application table must be empty.
    These checks all run before the first INSERT. Identity values come from
    SQL Server; no IDENTITY_INSERT or assumed sequence starting point is used.
    """
    if (
        not isinstance(expected_database, str)
        or not expected_database.startswith("cemaris_test_")
        or re.fullmatch(r"[A-Za-z0-9_]{14,128}", expected_database) is None
    ):
        raise UnsafeFixtureDatabase("Explicit cemaris_test_ database name required.")
    if connection.dialect.name != "mssql":
        raise UnsafeFixtureDatabase("Synthetic fixtures require Microsoft SQL Server.")
    actual_database = connection.execute(text("SELECT DB_NAME()")).scalar_one()
    if actual_database != expected_database:
        raise UnsafeFixtureDatabase("Connection database differs from expected test database.")
    for name, table in TABLES.items():
        if connection.execute(select(1).select_from(table).limit(1)).first() is not None:
            raise UnsafeFixtureDatabase(f"Test application table {name} is not empty.")

    ids: dict[str, int] = {}
    row_counts: dict[str, int] = {}
    audit = {
        "recordCreate_username": FIXTURE_USERNAME,
        "recordCreate_timeMillis": FIXTURE_TIME_MILLIS,
        "recordUpdate_username": FIXTURE_USERNAME,
        "recordUpdate_timeMillis": FIXTURE_TIME_MILLIS,
    }

    def insert(name: str, alias: str | None = None, **values: Any) -> int | None:
        table = TABLES[name]
        if "recordCreate_username" in table.c:
            values = {**audit, **values}
        statement = table.insert().values(**values)
        identity = next((column for column in table.c if column.identity is not None), None)
        if identity is not None:
            identifier = int(connection.execute(statement.returning(identity)).scalar_one())
        else:
            connection.execute(statement)
            identifier = None
        if alias is not None:
            if identifier is None:
                raise ValueError(f"Fixture alias {alias} needs an identity column.")
            ids[alias] = identifier
        row_counts[name] = row_counts.get(name, 0) + 1
        return identifier

    # Fictional users: administrator and a reader exercising server defaults.
    insert("Users", username=FIXTURE_USERNAME, canUpdateCemeteries=True,
           canUpdateContracts=True, canUpdateWorkOrders=True, isAdmin=True)
    insert("Users", username="fixture_reader")

    burial_type = insert("BurialSiteTypes", "burial_site_type",
                         burialSiteType="Synthetisches Urnengrab", bodyCapacityMax=0,
                         crematedCapacityMax=None)
    burial_field = insert("BurialSiteTypeFields", "burial_site_type_field",
                          burialSiteTypeId=burial_type, burialSiteTypeField="Kennzeichnung")
    burial_status = insert("BurialSiteStatuses", "burial_site_status", burialSiteStatus="Available")
    cemetery = insert("Cemeteries", "cemetery", cemeteryName="Musterfriedhof – Übung Süd",
                      cemeteryKey="SYNTHETIC", cemeteryDescription="Ausschließlich synthetische Testdaten.",
                      cemeteryLatitude=51.62512345, cemeteryLongitude=13.55812345,
                      cemeteryAddress1="Beispielweg 1", cemeteryAddress2="",
                      cemeteryCity="Musterstadt", cemeteryProvince="BB", cemeteryPostalCode="00000")
    child_cemetery = insert("Cemeteries", "child_cemetery", cemeteryName="Übungsfeld Nord",
                            cemeteryKey="SYNTH-N", parentCemeteryId=cemetery)
    insert("CemeteryDirectionsOfArrival", cemeteryId=cemetery,
           directionOfArrival="N", directionOfArrivalDescription="Synthetischer Nordeingang")
    burial_site = insert("BurialSites", "burial_site", burialSiteTypeId=burial_type,
                         burialSiteNameSegment1="A", burialSiteNameSegment2="01",
                         burialSiteNameSegment3="002", burialSiteNameSegment4="",
                         burialSiteNameSegment5="", burialSiteName="A-01-002",
                         bodyCapacity=0, crematedCapacity=None, cemeteryId=child_cemetery,
                         burialSiteStatusId=burial_status, cemeterySvgId="test-grave-002")
    insert("BurialSiteFields", burialSiteId=burial_site, burialSiteTypeFieldId=burial_field,
           fieldValue="Übungsfläche")
    insert("BurialSiteComments", "burial_site_comment", burialSiteId=burial_site,
           commentDate=20261019, commentTime=0, comment="Nur für den Datenbanktest.")

    funeral_home = insert("FuneralHomes", "funeral_home", funeralHomeName="Beispielbestattung",
                          funeralHomeAddress1="Testgasse 2", funeralHomeAddress2="",
                          funeralHomeCity="Musterstadt", funeralHomeProvince="BB",
                          funeralHomePostalCode="00000")
    # Reserved documentation IP; JSON storage only, not a claimed portal payload.
    order_form_id = 900001
    insert("OrderForms", orderFormId=order_form_id, orderFormKey="TEST000001",
           orderFormData=json.dumps({"fixture": "synthetic-schema-roundtrip"}),
           recordCreate_ipAddress="192.0.2.1", recordCreate_timeMillis=FIXTURE_TIME_MILLIS,
           recordSync_timeMillis=FIXTURE_TIME_MILLIS)
    ids["order_form"] = order_form_id

    contract_type = insert("ContractTypes", "contract_type", contractType="Synthetischer Vertrag")
    contract_field = insert("ContractTypeFields", "contract_type_field",
                            contractTypeId=contract_type, contractTypeField="Testhinweis")
    insert("ContractTypePrints", contractTypeId=contract_type, printEJS="screen/contract")
    committal_type = insert("CommittalTypes", "committal_type", committalType="Graveside")
    contract = insert("Contracts", "contract", contractNumber="TEST-2026-001",
                      contractTypeId=contract_type, burialSiteId=burial_site,
                      contractStartDate=20261019, contractEndDate=None,
                      purchaserName="Musterperson Alpha (synthetisch)", purchaserAddress1="Testweg 3",
                      purchaserAddress2="", purchaserCity="Musterstadt", purchaserProvince="BB",
                      purchaserPostalCode="00000", purchaserEmail="alpha@example.invalid",
                      funeralHomeId=funeral_home, funeralDate=20261020, funeralTime=0,
                      committalTypeId=committal_type, directionOfArrival="N")
    related_contract = insert("Contracts", "related_contract", contractNumber="TEST-2026-002",
                              contractTypeId=contract_type, contractStartDate=20261019,
                              purchaserName="Musterperson Beta (synthetisch)")
    insert("ContractFields", contractId=contract, contractTypeFieldId=contract_field,
           fieldValue="Synthetische Verknüpfung")
    insert("ContractMetadata", contractId=contract, metadataKey="cemaris.fixtureId",
           metadataValue="synthetic-contract")
    service_type = insert("ServiceTypes", "service_type", serviceType="Interment")
    insert("ContractServiceTypes", contractId=contract, serviceTypeId=service_type,
           contractServiceDetails="Testleistung ohne externen Auftrag")
    insert("ContractAttachments", "contract_attachment", contractId=contract,
           attachmentTitle="Synthetischer Dateiverweis", attachmentDetails="Keine Datei angelegt.",
           fileName="synthetic.txt", filePath="fixtures/synthetic.txt")
    insert("ContractComments", "contract_comment", contractId=contract,
           commentDate=20261019, commentTime=1234, comment="Aktiver synthetischer Kommentar.")
    insert("ContractComments", "deleted_contract_comment", contractId=contract,
           commentDate=20261019, commentTime=1235, comment="Gelöschter synthetischer Kommentar.",
           recordDelete_username=FIXTURE_USERNAME, recordDelete_timeMillis=FIXTURE_TIME_MILLIS + 1)
    insert("RelatedContracts", contractIdA=min(contract, related_contract),
           contractIdB=max(contract, related_contract))

    container_type = insert("IntermentContainerTypes", "interment_container_type",
                            intermentContainerType="Urn", intermentContainerTypeKey="U",
                            isCremationType=True)
    depth = insert("IntermentDepths", "interment_depth", intermentDepth="Single", intermentDepthKey="S")
    # Sunrise stores partial dates as YYYY0000 and YYYYMM00, not SQL DATE values.
    insert("ContractInterments", contractId=contract, intermentNumber=1, isCremated=True,
           deceasedName="Übungsperson Gamma (synthetisch)", deceasedAddress1="",
           deceasedAddress2="", deceasedCity="Musterstadt", deceasedProvince="BB",
           deceasedPostalCode="00000", birthDate=19350000, deathDate=20261000,
           deathAge=None, deathAgePeriod="", intermentContainerTypeId=container_type,
           intermentDepthId=depth)

    fee_category = insert("FeeCategories", "fee_category", feeCategory="Synthetische Gebühren")
    fee = insert("Fees", "fee", feeCategoryId=fee_category, feeName="Testgebühr",
                 feeDescription="Synthetischer Betrag", feeAccount="TEST",
                 contractTypeId=contract_type, burialSiteTypeId=burial_type,
                 includeQuantity=True, quantityUnit="Stück", feeAmount=123.45,
                 taxAmount=None, taxPercentage=19.0)
    insert("ContractFees", contractId=contract, feeId=fee, quantity=1.5,
           feeAmount=185.175, taxAmount=35.18325)
    insert("ContractTransactions", contractId=contract, transactionIndex=1,
           transactionDate=20261019, transactionTime=0, transactionAmount=220.35825,
           transactionNote="Synthetischer Zahlungseingang")

    work_type = insert("WorkOrderTypes", "work_order_type", workOrderType="Interment")
    work_status = insert("WorkOrderStatuses", "work_order_status", workOrderStatus="Entered")
    work_order = insert("WorkOrders", "work_order", workOrderTypeId=work_type,
                        workOrderNumber="TEST-WO-001", workOrderDescription="Synthetischer Arbeitsauftrag",
                        workOrderStatusId=work_status, workOrderOpenDate=20261019,
                        workOrderCloseDate=None)
    insert("WorkOrderBurialSites", workOrderId=work_order, burialSiteId=burial_site)
    insert("WorkOrderContracts", workOrderId=work_order, contractId=contract)
    insert("WorkOrderComments", "work_order_comment", workOrderId=work_order,
           commentDate=20261019, commentTime=0, comment="Synthetische Arbeitsnotiz.")
    milestone_type = insert("WorkOrderMilestoneTypes", "work_order_milestone_type",
                            workOrderMilestoneType="Arrival")
    insert("WorkOrderMilestones", "work_order_milestone", workOrderId=work_order,
           workOrderMilestoneTypeId=milestone_type, workOrderMilestoneDate=0,
           workOrderMilestoneTime=None, workOrderMilestoneDescription="Noch nicht datierter Testtermin")

    insert("CemarisSettings", settingKey="defaults.city", settingValue="Musterstadt",
           previousSettingValue="", recordUpdate_timeMillis=FIXTURE_TIME_MILLIS)
    insert("UserSettings", username=FIXTURE_USERNAME, settingKey="apiKey",
           settingValue="synthetic-no-production-key", previousSettingValue=None,
           recordUpdate_timeMillis=FIXTURE_TIME_MILLIS)
    insert("AuditLog", logMillis=FIXTURE_TIME_MILLIS, logDate=20261019, logTime=1200,
           mainRecordType="contract", mainRecordId=str(contract), updateTable="Contracts",
           recordIndex=None, updateField="*", updateType="created", updateUsername=FIXTURE_USERNAME,
           fromValue=None, toValue=json.dumps({"contractNumber": "TEST-2026-001"}))

    if row_counts.keys() != TABLES.keys():
        raise RuntimeError("Synthetic fixtures must cover every application table.")
    return FixtureData(ids=ids, row_counts=row_counts)
