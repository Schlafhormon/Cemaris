"""German product defaults and addresses; preserve custom catalog data.

Revision ID: 0003. Existing monetary amounts are never converted or rewritten.
Only untouched installation defaults (databaseInit) receive German names.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None
COLLATION = "Latin1_General_100_BIN2"
ADDRESS_COLUMNS = (('Cemeteries', 'cemeteryCity', True, 20), ('Cemeteries', 'cemeteryProvince', True, 2), ('FuneralHomes', 'funeralHomeCity', True, 20), ('FuneralHomes', 'funeralHomeProvince', True, 2), ('Contracts', 'purchaserCity', True, 20), ('Contracts', 'purchaserProvince', True, 2), ('ContractInterments', 'deceasedCity', False, 20), ('ContractInterments', 'deceasedProvince', False, 2))
CATALOG_NAMES = (('BurialSiteTypes', 'burialSiteType', 'In-Ground Grave', 'Erdgrab'), ('BurialSiteTypes', 'burialSiteType', 'Columbarium', 'Kolumbarium'), ('BurialSiteTypes', 'burialSiteType', 'Niche Wall', 'Urnenwand'), ('BurialSiteTypes', 'burialSiteType', 'Urn Garden', 'Urnengarten'), ('BurialSiteTypes', 'burialSiteType', 'Crematorium', 'Krematorium'), ('BurialSiteStatuses', 'burialSiteStatus', 'Available', 'Verfügbar'), ('BurialSiteStatuses', 'burialSiteStatus', 'Reserved', 'Reserviert'), ('BurialSiteStatuses', 'burialSiteStatus', 'Occupied', 'Belegt'), ('ContractTypes', 'contractType', 'Preneed', 'Vorsorge'), ('ContractTypes', 'contractType', 'At Need', 'Bestattungsfall'), ('ContractTypes', 'contractType', 'Permit Only', 'Genehmigung'), ('ServiceTypes', 'serviceType', 'Interment', 'Beisetzung'), ('ServiceTypes', 'serviceType', 'Cremation', 'Einäscherung'), ('ServiceTypes', 'serviceType', 'Entombment', 'Gruftbeisetzung'), ('ServiceTypes', 'serviceType', 'Niche', 'Urnenbeisetzung'), ('ServiceTypes', 'serviceType', 'Disinterment', 'Ausbettung'), ('IntermentContainerTypes', 'intermentContainerType', 'No Shell', 'Ohne Einfassung'), ('IntermentContainerTypes', 'intermentContainerType', 'Concrete Liner', 'Betonauskleidung'), ('IntermentContainerTypes', 'intermentContainerType', 'Unpainted Vault', 'Unbeschichtete Grabkammer'), ('IntermentContainerTypes', 'intermentContainerType', 'Concrete Vault', 'Betongrabkammer'), ('IntermentContainerTypes', 'intermentContainerType', 'Wooden Shell', 'Holzeinfassung'), ('IntermentContainerTypes', 'intermentContainerType', 'Steel Vault', 'Stahlgrabkammer'), ('IntermentContainerTypes', 'intermentContainerType', 'Shroud', 'Leichentuch'), ('IntermentContainerTypes', 'intermentContainerType', 'Urn', 'Urne'), ('IntermentDepths', 'intermentDepth', 'Single', 'Einfach'), ('IntermentDepths', 'intermentDepth', 'Double', 'Doppelt'), ('CommittalTypes', 'committalType', 'Graveside', 'Am Grab'), ('CommittalTypes', 'committalType', 'Chapel', 'Kapelle'), ('CommittalTypes', 'committalType', 'Church', 'Kirche'), ('FeeCategories', 'feeCategory', 'Interment Rights', 'Grabnutzungsrechte'), ('FeeCategories', 'feeCategory', 'Cremation Services', 'Einäscherungsleistungen'), ('FeeCategories', 'feeCategory', 'Burial Charges', 'Bestattungsgebühren'), ('FeeCategories', 'feeCategory', 'Disinterment of Human Remains', 'Ausbettung sterblicher Überreste'), ('FeeCategories', 'feeCategory', 'Additional Services', 'Zusätzliche Leistungen'), ('WorkOrderTypes', 'workOrderType', 'Interment', 'Beisetzung'), ('WorkOrderTypes', 'workOrderType', 'Cremation', 'Einäscherung'), ('WorkOrderStatuses', 'workOrderStatus', 'Entered', 'Erfasst'), ('WorkOrderStatuses', 'workOrderStatus', 'Scheduled', 'Geplant'), ('WorkOrderStatuses', 'workOrderStatus', 'Completed', 'Abgeschlossen'), ('WorkOrderStatuses', 'workOrderStatus', 'No Show', 'Nicht erschienen'), ('WorkOrderStatuses', 'workOrderStatus', 'Cancelled', 'Storniert'), ('WorkOrderMilestoneTypes', 'workOrderMilestoneType', 'Funeral', 'Trauerfeier'), ('WorkOrderMilestoneTypes', 'workOrderMilestoneType', 'Arrival', 'Ankunft'), ('WorkOrderMilestoneTypes', 'workOrderMilestoneType', 'Cremation', 'Einäscherung'), ('WorkOrderMilestoneTypes', 'workOrderMilestoneType', 'Interment', 'Beisetzung'))


def upgrade():
    for table, column, nullable, length in ADDRESS_COLUMNS:
        op.alter_column(table, column, schema="dbo", existing_type=mssql.NVARCHAR(length, collation=COLLATION),
                        type_=mssql.NVARCHAR(100, collation=COLLATION), existing_nullable=nullable)
    connection = op.get_bind()
    for table, field, old, new in CATALOG_NAMES:
        connection.execute(sa.text(f"""UPDATE dbo.[{table}] SET [{field}] = :new
            WHERE [{field}] = :old AND recordCreate_username = 'databaseInit'
            AND recordUpdate_username = 'databaseInit' AND recordDelete_timeMillis IS NULL"""),
            {"old": old, "new": new})


def downgrade():
    connection = op.get_bind()
    # Never silently truncate a user's address on rollback.
    for table, column, _, length in ADDRESS_COLUMNS:
        if connection.scalar(sa.text(f"SELECT COUNT(*) FROM dbo.[{table}] WHERE DATALENGTH([{column}]) > :length"), {"length": length * 2}):
            raise RuntimeError("Address values exceed the previous schema; restore the matching release backup instead")
    for table, field, old, new in CATALOG_NAMES:
        connection.execute(sa.text(f"""UPDATE dbo.[{table}] SET [{field}] = :old
            WHERE [{field}] = :new AND recordCreate_username = 'databaseInit'
            AND recordUpdate_username = 'databaseInit' AND recordDelete_timeMillis IS NULL"""),
            {"old": old, "new": new})
    for table, column, nullable, length in ADDRESS_COLUMNS:
        op.alter_column(table, column, schema="dbo", existing_type=mssql.NVARCHAR(100, collation=COLLATION),
                        type_=mssql.NVARCHAR(length, collation=COLLATION), existing_nullable=nullable)
