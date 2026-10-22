"""SQL Server adapter for the Sunrise standalone import tools (MIT).

Only explicitly disposable SQL databases may be changed. The source legacy
entry point purges its tables; SQL Server uses a transaction and FK order.
"""

from __future__ import annotations

import csv
from datetime import date
import re

import sqlalchemy as sa

from cemaris.burial_sites import BurialSiteOptions, add_burial_site, build_burial_site_name, update_burial_site_status
from cemaris.catalogs import add_catalog_record, get_catalog_records, initialize_catalogs, CATALOGS
from cemaris.cemeteries import add_cemetery, get_cemetery
from cemaris.contract_finance import add_contract_fee, add_contract_transaction
from cemaris.contract_items import add_contract_service_type
from cemaris.contracts import add_contract, get_contracts, mutate_contract_comment, mutate_related_contract
from cemaris.db.schema import TABLES, metadata
from cemaris.funeral_homes import add_funeral_home
from cemaris.preferences import update_setting
from cemaris.work_orders import (add_work_order, add_work_order_milestone, close_work_order,
                                  get_work_order, mutate_work_order_relation, reopen_work_order)

from .legacy import DATA, CREMATION_KEYS, burial_site_type, segments, import_master, import_prepaid, import_work_orders


ACTOR = "import.unix"
PURGE_TABLES = (
    "WorkOrderMilestones", "WorkOrderComments", "WorkOrderBurialSites", "WorkOrderContracts", "WorkOrders",
    "ContractAttachments", "ContractMetadata", "ContractTransactions", "ContractFees", "ContractFields", "ContractComments",
    "ContractInterments", "ContractServiceTypes", "RelatedContracts", "Contracts", "FuneralHomes", "BurialSiteFields",
    "BurialSiteComments", "BurialSites", "AuditLog", "CemeteryDirectionsOfArrival", "Cemeteries", "BurialSiteStatuses",
    "CommittalTypes", "ServiceTypes", "ContractTypeFields", "ContractTypePrints", "ContractTypes", "IntermentContainerTypes",
    "IntermentDepths", "WorkOrderMilestoneTypes", "WorkOrderTypes",
)


def require_disposable_database(connection):
    if connection.dialect.name != "mssql":
        raise ValueError("Imports require Microsoft SQL Server.")
    name = connection.scalar(sa.text("SELECT DB_NAME()"))
    if not re.fullmatch(r"cemaris_test_02_[a-f0-9]{32}", name or ""):
        raise ValueError("Imports require an explicitly disposable cemaris_test_02_<uuid> SQL Server database.")
    return name


def read_csv(path, kind):
    """UTF-8 BOM, quoted commas/newlines, string values, empty-line skipping.

    Unlike Papa's logged-and-continued malformed rows, reject structural errors
    before the destructive transaction; CSV values are never trimmed/coerced.
    """
    expected = DATA["fields"][kind]
    with open(path, encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream, delimiter=",", strict=True)
        if reader.fieldnames is None or set(expected) - set(reader.fieldnames):
            raise ValueError(f"{kind} CSV is missing required columns: {', '.join(sorted(set(expected) - set(reader.fieldnames or [])))}")
        if len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError(f"{kind} CSV has duplicate column names")
        rows = []
        for row in reader:
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f"{kind} CSV row {reader.line_num} has a different field count")
            rows.append(row)
        return rows


class SqlImportGateway:
    def __init__(self, connection, *, mapping=None, burial_site_options=None, audit_enabled=False, fee_category_id=None):
        require_disposable_database(connection)
        self.connection = connection
        self.mapping = mapping if mapping is not None else DATA
        self.options = burial_site_options or BurialSiteOptions()
        self.audit_enabled = audit_enabled
        self.fee_category_id = fee_category_id
        self.funeral_home_ids = {}
        self.operations = 0

    def id(self, table_name, name):
        resource, (_, id_key, name_key) = next((key, spec) for key, spec in CATALOGS.items() if spec[0] == table_name)
        # Source cache name lookups are case insensitive and include deleted
        # records for statuses, types and optional milestone types.
        include_deleted = table_name in {"BurialSiteStatuses", "ContractTypes", "BurialSiteTypes", "WorkOrderMilestoneTypes"}
        localized = {'In-Ground Grave': 'Erdgrab', 'Columbarium': 'Kolumbarium', 'Niche Wall': 'Urnenwand', 'Urn Garden': 'Urnengarten', 'Crematorium': 'Krematorium', 'Available': 'Verfügbar', 'Reserved': 'Reserviert', 'Occupied': 'Belegt', 'Preneed': 'Vorsorge', 'At Need': 'Bestattungsfall', 'Permit Only': 'Genehmigung', 'Interment': 'Beisetzung', 'Cremation': 'Einäscherung', 'Entombment': 'Gruftbeisetzung', 'Niche': 'Urnenbeisetzung', 'Disinterment': 'Ausbettung', 'No Shell': 'Ohne Einfassung', 'Concrete Liner': 'Betonauskleidung', 'Unpainted Vault': 'Unbeschichtete Grabkammer', 'Concrete Vault': 'Betongrabkammer', 'Wooden Shell': 'Holzeinfassung', 'Steel Vault': 'Stahlgrabkammer', 'Shroud': 'Leichentuch', 'Urn': 'Urne', 'Single': 'Einfach', 'Double': 'Doppelt', 'Graveside': 'Am Grab', 'Chapel': 'Kapelle', 'Church': 'Kirche', 'Interment Rights': 'Grabnutzungsrechte', 'Cremation Services': 'Einäscherungsleistungen', 'Burial Charges': 'Bestattungsgebühren', 'Disinterment of Human Remains': 'Ausbettung sterblicher Überreste', 'Additional Services': 'Zusätzliche Leistungen', 'Entered': 'Erfasst', 'Scheduled': 'Geplant', 'Completed': 'Abgeschlossen', 'No Show': 'Nicht erschienen', 'Cancelled': 'Storniert', 'Funeral': 'Trauerfeier', 'Arrival': 'Ankunft'}
        for row in get_catalog_records(self.connection, resource, include_deleted=include_deleted):
            if row[name_key].lower() in {name.lower(), localized.get(name, name).lower()}:
                return row[id_key]
        if table_name == "WorkOrderMilestoneTypes":
            return None
        raise ValueError(f"Required legacy import catalog value is missing: {table_name}.{name}")

    def cemetery(self, key):
        table = TABLES["Cemeteries"]
        identifier = self.connection.scalar(sa.select(table.c.cemeteryId).where(table.c.cemeteryKey == key,
            table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.cemeteryId).limit(1))
        if identifier is not None:
            return identifier
        fallback = dict(cemeteryName=key, cemeteryKey=key, cemeteryCity=self.mapping.get("city", "Sault Ste. Marie"),
                        cemeteryProvince=self.mapping.get("province", ""))
        return add_cemetery(self.connection, self.mapping.get("cemeteries", {}).get(key, fallback), ACTOR,
                            audit_enabled=self.audit_enabled)

    def key(self, table_name, key):
        if key == "":
            return ""
        if table_name == "FuneralHomes":
            if key not in self.funeral_home_ids:
                # Original uses its initialization cache; unknown keys create
                # a bare home without querying pre-existing noninitialized rows.
                self.funeral_home_ids[key] = add_funeral_home(self.connection,
                    dict(funeralHomeKey=key, funeralHomeName=key, funeralHomeAddress1="", funeralHomeAddress2="",
                         funeralHomeCity="", funeralHomePostalCode="", funeralHomeProvince="", funeralHomePhoneNumber="",
                         ), ACTOR,
                    audit_enabled=self.audit_enabled)
            return self.funeral_home_ids[key]
        resource, (_, id_key, name_key) = next((key, spec) for key, spec in CATALOGS.items() if spec[0] == table_name)
        table = TABLES[table_name]
        key_column = name_key + "Key"
        # Original helpers search their ordered get* snapshots with strict
        # JavaScript string equality. SQL equality would also match a trailing
        # space, and ID order can choose the wrong duplicate external key.
        for row in get_catalog_records(self.connection, resource, include_deleted=True):
            if row[key_column] == key:
                return row[id_key]
        return add_catalog_record(self.connection, resource, {name_key: key, key_column: key}, ACTOR, audit_enabled=self.audit_enabled)

    def site(self, row, prefix, status, *, cemetery=None, svg=False, update_existing=False):
        key = row[prefix + "CEMETERY"]
        if key in CREMATION_KEYS:
            return None
        parts = segments(row, prefix)
        name = build_burial_site_name(key, parts, self.options)
        table = TABLES["BurialSites"]
        record = self.connection.execute(sa.select(table).where(table.c.burialSiteName == name).order_by(table.c.burialSiteId).limit(1)).mappings().first()
        if record is not None:
            record = dict(record)
            if update_existing:
                self.status(record["burialSiteId"], status)
            return record
        cemetery = cemetery if cemetery is not None else self.cemetery(key)
        form = dict(parts, cemeteryId=cemetery, cemeterySvgId=name.split(",", 1)[0] if svg else "",
                    burialSiteStatusId=self.id("BurialSiteStatuses", status), burialSiteTypeId=self.id("BurialSiteTypes", burial_site_type(key)),
                    burialSiteImage="", burialSiteLatitude="", burialSiteLongitude="")
        result = add_burial_site(self.connection, form, ACTOR, options=self.options, audit_enabled=self.audit_enabled)
        return dict(self.connection.execute(sa.select(table).where(table.c.burialSiteId == result["burialSiteId"])).mappings().one())

    def status(self, identifier, status):
        return update_burial_site_status(self.connection, identifier, self.id("BurialSiteStatuses", status), ACTOR,
                                        audit_enabled=self.audit_enabled)

    def find_preneed(self, site, start, name):
        result = get_contracts(self.connection, dict(burialSiteId=site["burialSiteId"], contractStartDateString=start,
                  contractTypeId=self.id("ContractTypes", "Preneed"), deceasedName=name), limit=-1,
                  include_fees=False, include_interments=False, include_transactions=False)
        return result["contracts"][0]["contractId"] if result["contracts"] else None

    def work_order(self, value, *, by_id=False):
        return get_work_order(self.connection, value, by_number=not by_id)

    def fee(self, description):
        table = TABLES["Fees"]
        existing = list(self.connection.execute(sa.select(table.c.feeId, table.c.feeCategoryId, table.c.feeDescription).where(
            table.c.feeDescription.like("CMPP_FEE_%")).order_by(table.c.feeId)))
        if existing and self.fee_category_id is None:
            self.fee_category_id = existing[0].feeCategoryId
        # Source Map.set overwrites previous rows with the same description.
        for row in reversed(existing):
            if row.feeDescription == description:
                return row.feeId
        if self.fee_category_id is None:
            # The source's zero category produces an orphan with disabled SQLite
            # FKs. A dedicated real category is necessary on SQL Server.
            self.fee_category_id = add_catalog_record(self.connection, "feeCategories",
                {"feeCategory": "Legacy CSV Import"}, ACTOR)
        return add_catalog_record(self.connection, "fees", dict(feeName=description[9:], feeDescription=description,
            feeAccount="", feeCategoryId=self.fee_category_id, burialSiteTypeId="", contractTypeId=""), ACTOR,
            audit_enabled=self.audit_enabled)

    def call(self, operation, form):
        self.operations += 1
        args = dict(audit_enabled=self.audit_enabled)
        if operation == "addContract":
            return add_contract(self.connection, form, ACTOR, **args)
        if operation == "addContractServiceType":
            return add_contract_service_type(self.connection, form, ACTOR, **args)
        if operation == "addContractComment":
            return mutate_contract_comment(self.connection, "add", form, ACTOR, **args)
        if operation == "addRelatedContract":
            return mutate_related_contract(self.connection, "add", form)
        if operation == "addContractFee":
            return add_contract_fee(self.connection, form, ACTOR, **args)
        if operation == "addContractTransaction":
            return add_contract_transaction(self.connection, form, ACTOR, **args)
        if operation == "addWorkOrder":
            return add_work_order(self.connection, form, ACTOR, **args)
        if operation == "reopenWorkOrder":
            return reopen_work_order(self.connection, form, ACTOR, **args)
        if operation == "closeWorkOrder":
            return close_work_order(self.connection, form, ACTOR, **args)
        if operation == "addWorkOrderMilestone":
            return add_work_order_milestone(self.connection, form, ACTOR, **args)
        if operation in ("addWorkOrderBurialSite", "addWorkOrderContract"):
            return mutate_work_order_relation(self.connection, "add", form, ACTOR,
                       kind="contract" if operation == "addWorkOrderContract" else "burialSite", **args)
        raise ValueError("Unknown import operation")

    def initialize(self, *, reset=False):
        if reset:
            self.purge()
        initialize_catalogs(self.connection)
        for form in self.mapping.get("funeralHomes", []):
            self.funeral_home_ids[form["funeralHomeKey"]] = add_funeral_home(self.connection,
                form, ACTOR,
                audit_enabled=self.audit_enabled)
        for name, prints in (("Preneed", ["pdf/ssm.contract"]), ("At Need", ["pdf/ssm.contract", "pdf/ssm.contract.burialPermit"]),
                             ("Permit Only", ["pdf/ssm.contract.burialPermit"])):
            for print_name in prints:
                add_catalog_record(self.connection, "contractTypePrints", dict(contractTypeId=self.id("ContractTypes", name), printEJS=print_name), ACTOR)
        update_setting(self.connection, "defaults.city", self.mapping.get("city", "Sault Ste. Marie"))
        update_setting(self.connection, "defaults.province", self.mapping.get("province", ""))

    def purge(self):
        require_disposable_database(self.connection)
        # Reject external references before deleting anything; portal records,
        # fee links and nonpurged catalogs are not silently lost.
        for table in metadata.sorted_tables:
            if table.name in PURGE_TABLES:
                continue
            for foreign_key in table.foreign_keys:
                if foreign_key.column.table.name in PURGE_TABLES and self.connection.scalar(sa.select(sa.func.count()).select_from(table).where(foreign_key.parent.is_not(None))):
                    raise ValueError(f"Legacy reset is blocked by nonpurged table {table.name}")
        cemetery = TABLES["Cemeteries"]
        self.connection.execute(cemetery.update().values(parentCemeteryId=None))
        for table in reversed(metadata.sorted_tables):
            if table.name in PURGE_TABLES:
                self.connection.execute(table.delete())
                if any(column.identity is not None for column in table.c):
                    self.connection.exec_driver_sql(f"DBCC CHECKIDENT ('dbo.{table.name}', RESEED, 0) WITH NO_INFOMSGS")


def import_legacy_csv(connection, master_path, prepaid_path, work_order_path, *, mapping=None,
                      burial_site_options=None, audit_enabled=False, fee_category_id=None, current_date=None):
    require_disposable_database(connection)
    rows = [read_csv(path, kind) for path, kind in ((master_path, "master"), (prepaid_path, "prepaid"), (work_order_path, "workOrder"))]
    gateway = SqlImportGateway(connection, mapping=mapping, burial_site_options=burial_site_options,
                               audit_enabled=audit_enabled, fee_category_id=fee_category_id)
    gateway.initialize(reset=True)
    import_master(gateway, rows[0])
    import_prepaid(gateway, rows[1])
    import_work_orders(gateway, rows[2], current_date=current_date)
    return {"masterRows": len(rows[0]), "prepaidRows": len(rows[1]), "workOrderRows": len(rows[2]), "operations": gateway.operations}
