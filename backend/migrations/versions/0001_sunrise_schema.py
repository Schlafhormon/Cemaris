"""Create the complete Cemaris schema from the fixed Sunrise reference.

Revision ID: 0001
Revises:
Reference: 451ce034863b16502484367044f3e9b65370111a
Source schema adapted under MIT; see licenses/Sunrise-LICENSE.md.

This is a frozen historical schema, intentionally independent of application
metadata. Future revisions must not modify or import a later schema here.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TEXT_COLLATION = "Latin1_General_100_BIN2"

metadata = sa.MetaData(
    schema="dbo",
    naming_convention={"pk": "pk_%(table_name)s"},
)


TABLE_BurialSiteTypes = sa.Table(
    "BurialSiteTypes",
    metadata,
    sa.Column("burialSiteTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("bodyCapacityMax", sa.SmallInteger(), nullable=True, info={'source_declared_type': 'smallint'}),
    sa.Column("crematedCapacityMax", sa.SmallInteger(), nullable=True, info={'source_declared_type': 'smallint'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "BurialSiteTypes"},
)

sa.Index("idx_BurialSiteTypes_orderNumber", TABLE_BurialSiteTypes.c.orderNumber, TABLE_BurialSiteTypes.c.burialSiteType)


TABLE_BurialSiteTypeFields = sa.Table(
    "BurialSiteTypeFields",
    metadata,
    sa.Column("burialSiteTypeFieldId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteTypeField", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("fieldType", mssql.NVARCHAR(15, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N'text'"), info={'source_declared_type': 'VARCHAR(15)'}),
    sa.Column("fieldValues", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("isRequired", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("pattern", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("minLength", sa.SmallInteger(), nullable=False, server_default=sa.text('1'), info={'source_declared_type': 'smallint'}),
    sa.Column("maxLength", sa.SmallInteger(), nullable=False, server_default=sa.text('100'), info={'source_declared_type': 'smallint'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("minLength >= 0", name="ck_BurialSiteTypeFields_minLength"),
    sa.CheckConstraint("maxLength >= 0", name="ck_BurialSiteTypeFields_maxLength"),
    sa.ForeignKeyConstraint(["burialSiteTypeId"], ["dbo.BurialSiteTypes.burialSiteTypeId"], name="fk_BurialSiteTypeFields_burialSiteTypeId_BurialSiteTypes"),
    info={"source_table": "BurialSiteTypeFields"},
)

sa.Index("idx_BurialSiteTypeFields_orderNumber", TABLE_BurialSiteTypeFields.c.burialSiteTypeId, TABLE_BurialSiteTypeFields.c.orderNumber, TABLE_BurialSiteTypeFields.c.burialSiteTypeField)


TABLE_BurialSiteStatuses = sa.Table(
    "BurialSiteStatuses",
    metadata,
    sa.Column("burialSiteStatusId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteStatus", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "BurialSiteStatuses"},
)

sa.Index("idx_BurialSiteStatuses_orderNumber", TABLE_BurialSiteStatuses.c.orderNumber, TABLE_BurialSiteStatuses.c.burialSiteStatus)


TABLE_Cemeteries = sa.Table(
    "Cemeteries",
    metadata,
    sa.Column("cemeteryId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("cemeteryName", mssql.NVARCHAR(200, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(200)'}),
    sa.Column("cemeteryKey", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("cemeteryDescription", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("cemeteryLatitude", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(10, 8)'}),
    sa.Column("cemeteryLongitude", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(11, 8)'}),
    sa.Column("cemeterySvg", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("cemeteryAddress1", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("cemeteryAddress2", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("cemeteryCity", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("cemeteryProvince", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("cemeteryPostalCode", mssql.NVARCHAR(7, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(7)'}),
    sa.Column("cemeteryPhoneNumber", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("parentCemeteryId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("findagraveCemeteryId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("cemeteryLatitude BETWEEN -90 AND 90", name="ck_Cemeteries_cemeteryLatitude"),
    sa.CheckConstraint("cemeteryLongitude BETWEEN -180 AND 180", name="ck_Cemeteries_cemeteryLongitude"),
    sa.ForeignKeyConstraint(["parentCemeteryId"], ["dbo.Cemeteries.cemeteryId"], name="fk_Cemeteries_parentCemeteryId_Cemeteries"),
    info={"source_table": "Cemeteries"},
)



TABLE_CemeteryDirectionsOfArrival = sa.Table(
    "CemeteryDirectionsOfArrival",
    metadata,
    sa.Column("cemeteryId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("directionOfArrival", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("directionOfArrivalDescription", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.PrimaryKeyConstraint("cemeteryId", "directionOfArrival"),
    sa.ForeignKeyConstraint(["cemeteryId"], ["dbo.Cemeteries.cemeteryId"], name="fk_CemeteryDirectionsOfArrival_cemeteryId_Cemeteries"),
    info={"source_table": "CemeteryDirectionsOfArrival"},
)



TABLE_BurialSites = sa.Table(
    "BurialSites",
    metadata,
    sa.Column("burialSiteId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteNameSegment1", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("burialSiteNameSegment2", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("burialSiteNameSegment3", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("burialSiteNameSegment4", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("burialSiteNameSegment5", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("burialSiteName", mssql.NVARCHAR(200, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(200)'}),
    sa.Column("bodyCapacity", sa.SmallInteger(), nullable=True, info={'source_declared_type': 'smallint'}),
    sa.Column("crematedCapacity", sa.SmallInteger(), nullable=True, info={'source_declared_type': 'smallint'}),
    sa.Column("cemeteryId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("cemeterySvgId", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("burialSiteImage", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("burialSiteLatitude", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(10, 8)'}),
    sa.Column("burialSiteLongitude", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(11, 8)'}),
    sa.Column("burialSiteStatusId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("burialSiteLatitude BETWEEN -90 AND 90", name="ck_BurialSites_burialSiteLatitude"),
    sa.CheckConstraint("burialSiteLongitude BETWEEN -180 AND 180", name="ck_BurialSites_burialSiteLongitude"),
    sa.ForeignKeyConstraint(["burialSiteTypeId"], ["dbo.BurialSiteTypes.burialSiteTypeId"], name="fk_BurialSites_burialSiteTypeId_BurialSiteTypes"),
    sa.ForeignKeyConstraint(["cemeteryId"], ["dbo.Cemeteries.cemeteryId"], name="fk_BurialSites_cemeteryId_Cemeteries"),
    sa.ForeignKeyConstraint(["burialSiteStatusId"], ["dbo.BurialSiteStatuses.burialSiteStatusId"], name="fk_BurialSites_burialSiteStatusId_BurialSiteStatuses"),
    info={"source_table": "BurialSites"},
)

sa.Index(
    "uq_BurialSites_cemetery_segments",
    TABLE_BurialSites.c.cemeteryId,
    TABLE_BurialSites.c.burialSiteNameSegment1,
    TABLE_BurialSites.c.burialSiteNameSegment2,
    TABLE_BurialSites.c.burialSiteNameSegment3,
    TABLE_BurialSites.c.burialSiteNameSegment4,
    TABLE_BurialSites.c.burialSiteNameSegment5,
    unique=True,
    mssql_where=sa.text("[cemeteryId] IS NOT NULL"),
)



TABLE_BurialSiteFields = sa.Table(
    "BurialSiteFields",
    metadata,
    sa.Column("burialSiteId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteTypeFieldId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("fieldValue", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("burialSiteId", "burialSiteTypeFieldId"),
    sa.ForeignKeyConstraint(["burialSiteId"], ["dbo.BurialSites.burialSiteId"], name="fk_BurialSiteFields_burialSiteId_BurialSites"),
    sa.ForeignKeyConstraint(["burialSiteTypeFieldId"], ["dbo.BurialSiteTypeFields.burialSiteTypeFieldId"], name="fk_BurialSiteFields_burialSiteTypeFieldId_BurialSiteTypeFields"),
    info={"source_table": "BurialSiteFields"},
)



TABLE_BurialSiteComments = sa.Table(
    "BurialSiteComments",
    metadata,
    sa.Column("burialSiteCommentId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentTime", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("comment", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("commentDate > 0", name="ck_BurialSiteComments_commentDate"),
    sa.CheckConstraint("commentTime >= 0", name="ck_BurialSiteComments_commentTime"),
    sa.ForeignKeyConstraint(["burialSiteId"], ["dbo.BurialSites.burialSiteId"], name="fk_BurialSiteComments_burialSiteId_BurialSites"),
    info={"source_table": "BurialSiteComments"},
)

sa.Index("idx_BurialSiteComments_datetime", TABLE_BurialSiteComments.c.burialSiteId, TABLE_BurialSiteComments.c.commentDate, TABLE_BurialSiteComments.c.commentTime)


TABLE_FuneralHomes = sa.Table(
    "FuneralHomes",
    metadata,
    sa.Column("funeralHomeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("funeralHomeName", mssql.NVARCHAR(200, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(200)'}),
    sa.Column("funeralHomeKey", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("funeralHomeAddress1", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("funeralHomeAddress2", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("funeralHomeCity", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("funeralHomeProvince", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("funeralHomePostalCode", mssql.NVARCHAR(7, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(7)'}),
    sa.Column("funeralHomePhoneNumber", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "FuneralHomes"},
)



TABLE_OrderForms = sa.Table(
    "OrderForms",
    metadata,
    sa.Column("orderFormId", sa.BigInteger(), autoincrement=False, nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("orderFormKey", mssql.NVARCHAR(10, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'CHAR(10)'}),
    sa.Column("orderFormData", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_ipAddress", mssql.NVARCHAR(45, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(45)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordSync_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("isOrderFormProcessed", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.UniqueConstraint("orderFormKey", name="uq_OrderForms_orderFormKey"),
    info={"source_table": "OrderForms"},
)



TABLE_ContractTypes = sa.Table(
    "ContractTypes",
    metadata,
    sa.Column("contractTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("isPreneed", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "ContractTypes"},
)

sa.Index("idx_ContractTypes_orderNumber", TABLE_ContractTypes.c.orderNumber, TABLE_ContractTypes.c.contractType)


TABLE_ContractTypeFields = sa.Table(
    "ContractTypeFields",
    metadata,
    sa.Column("contractTypeFieldId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractTypeField", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("fieldType", mssql.NVARCHAR(15, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N'text'"), info={'source_declared_type': 'VARCHAR(15)'}),
    sa.Column("fieldValues", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("isRequired", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("pattern", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("minLength", sa.SmallInteger(), nullable=False, server_default=sa.text('1'), info={'source_declared_type': 'smallint'}),
    sa.Column("maxLength", sa.SmallInteger(), nullable=False, server_default=sa.text('100'), info={'source_declared_type': 'smallint'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("minLength >= 0", name="ck_ContractTypeFields_minLength"),
    sa.CheckConstraint("maxLength >= 0", name="ck_ContractTypeFields_maxLength"),
    sa.ForeignKeyConstraint(["contractTypeId"], ["dbo.ContractTypes.contractTypeId"], name="fk_ContractTypeFields_contractTypeId_ContractTypes"),
    info={"source_table": "ContractTypeFields"},
)

sa.Index("idx_ContractTypeFields_orderNumber", TABLE_ContractTypeFields.c.contractTypeId, TABLE_ContractTypeFields.c.orderNumber, TABLE_ContractTypeFields.c.contractTypeField)


TABLE_ContractTypePrints = sa.Table(
    "ContractTypePrints",
    metadata,
    sa.Column("contractTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("printEJS", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractTypeId", "printEJS"),
    sa.ForeignKeyConstraint(["contractTypeId"], ["dbo.ContractTypes.contractTypeId"], name="fk_ContractTypePrints_contractTypeId_ContractTypes"),
    info={"source_table": "ContractTypePrints"},
)

sa.Index("idx_ContractTypePrints_orderNumber", TABLE_ContractTypePrints.c.contractTypeId, TABLE_ContractTypePrints.c.orderNumber, TABLE_ContractTypePrints.c.printEJS)


TABLE_CommittalTypes = sa.Table(
    "CommittalTypes",
    metadata,
    sa.Column("committalTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("committalTypeKey", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("committalType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "CommittalTypes"},
)

sa.Index("idx_CommittalType_orderNumber", TABLE_CommittalTypes.c.orderNumber, TABLE_CommittalTypes.c.committalType)


TABLE_Contracts = sa.Table(
    "Contracts",
    metadata,
    sa.Column("contractId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractNumber", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("contractTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractStartDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractEndDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("purchaserName", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("purchaserAddress1", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("purchaserAddress2", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("purchaserCity", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("purchaserProvince", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("purchaserPostalCode", mssql.NVARCHAR(7, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(7)'}),
    sa.Column("purchaserPhoneNumber", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("purchaserEmail", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("purchaserRelationship", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("funeralHomeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("funeralDirectorName", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("funeralDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("funeralTime", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("committalTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("directionOfArrival", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("contractStartDate > 0", name="ck_Contracts_contractStartDate"),
    sa.CheckConstraint("contractEndDate > 0", name="ck_Contracts_contractEndDate"),
    sa.CheckConstraint("funeralDate > 0", name="ck_Contracts_funeralDate"),
    sa.CheckConstraint("funeralTime >= 0", name="ck_Contracts_funeralTime"),
    sa.ForeignKeyConstraint(["burialSiteId"], ["dbo.BurialSites.burialSiteId"], name="fk_Contracts_burialSiteId_BurialSites"),
    sa.ForeignKeyConstraint(["contractTypeId"], ["dbo.ContractTypes.contractTypeId"], name="fk_Contracts_contractTypeId_ContractTypes"),
    sa.ForeignKeyConstraint(["funeralHomeId"], ["dbo.FuneralHomes.funeralHomeId"], name="fk_Contracts_funeralHomeId_FuneralHomes"),
    sa.ForeignKeyConstraint(["committalTypeId"], ["dbo.CommittalTypes.committalTypeId"], name="fk_Contracts_committalTypeId_CommittalTypes"),
    info={"source_table": "Contracts"},
)



TABLE_ContractFields = sa.Table(
    "ContractFields",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractTypeFieldId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("fieldValue", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "contractTypeFieldId"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractFields_contractId_Contracts"),
    sa.ForeignKeyConstraint(["contractTypeFieldId"], ["dbo.ContractTypeFields.contractTypeFieldId"], name="fk_ContractFields_contractTypeFieldId_ContractTypeFields"),
    info={"source_table": "ContractFields"},
)



TABLE_ContractMetadata = sa.Table(
    "ContractMetadata",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("metadataKey", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("metadataValue", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "metadataKey"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractMetadata_contractId_Contracts"),
    info={"source_table": "ContractMetadata"},
)



TABLE_ServiceTypes = sa.Table(
    "ServiceTypes",
    metadata,
    sa.Column("serviceTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("serviceType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "ServiceTypes"},
)

sa.Index("idx_ServiceTypes_orderNumber", TABLE_ServiceTypes.c.orderNumber, TABLE_ServiceTypes.c.serviceType)


TABLE_ContractServiceTypes = sa.Table(
    "ContractServiceTypes",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("serviceTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractServiceDetails", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "serviceTypeId"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractServiceTypes_contractId_Contracts"),
    sa.ForeignKeyConstraint(["serviceTypeId"], ["dbo.ServiceTypes.serviceTypeId"], name="fk_ContractServiceTypes_serviceTypeId_ServiceTypes"),
    info={"source_table": "ContractServiceTypes"},
)



TABLE_ContractAttachments = sa.Table(
    "ContractAttachments",
    metadata,
    sa.Column("contractAttachmentId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("attachmentTitle", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("attachmentDetails", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("fileName", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("filePath", mssql.NVARCHAR(500, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(500)'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractAttachments_contractId_Contracts"),
    info={"source_table": "ContractAttachments"},
)



TABLE_ContractComments = sa.Table(
    "ContractComments",
    metadata,
    sa.Column("contractCommentId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentTime", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("comment", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("commentDate > 0", name="ck_ContractComments_commentDate"),
    sa.CheckConstraint("commentTime >= 0", name="ck_ContractComments_commentTime"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractComments_contractId_Contracts"),
    info={"source_table": "ContractComments"},
)

sa.Index("idx_ContractComments_datetime", TABLE_ContractComments.c.contractId, TABLE_ContractComments.c.commentDate, TABLE_ContractComments.c.commentTime)


TABLE_RelatedContracts = sa.Table(
    "RelatedContracts",
    metadata,
    sa.Column("contractIdA", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractIdB", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractIdA", "contractIdB"),
    sa.CheckConstraint("contractIdA < contractIdB", name="ck_RelatedContracts_contractIdB"),
    sa.ForeignKeyConstraint(["contractIdA"], ["dbo.Contracts.contractId"], name="fk_RelatedContracts_contractIdA_Contracts"),
    sa.ForeignKeyConstraint(["contractIdB"], ["dbo.Contracts.contractId"], name="fk_RelatedContracts_contractIdB_Contracts"),
    info={"source_table": "RelatedContracts"},
)



TABLE_IntermentContainerTypes = sa.Table(
    "IntermentContainerTypes",
    metadata,
    sa.Column("intermentContainerTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("intermentContainerType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("intermentContainerTypeKey", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("isCremationType", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "IntermentContainerTypes"},
)

sa.Index("idx_IntermentContainerTypes_orderNumber", TABLE_IntermentContainerTypes.c.orderNumber, TABLE_IntermentContainerTypes.c.intermentContainerType)


TABLE_IntermentDepths = sa.Table(
    "IntermentDepths",
    metadata,
    sa.Column("intermentDepthId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("intermentDepth", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("intermentDepthKey", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, server_default=sa.text("N''"), info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("isAvailableOnPortal", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "IntermentDepths"},
)

sa.Index("idx_IntermentDepths_orderNumber", TABLE_IntermentDepths.c.orderNumber, TABLE_IntermentDepths.c.intermentDepth)


TABLE_ContractInterments = sa.Table(
    "ContractInterments",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("intermentNumber", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("deceasedName", mssql.NVARCHAR(200, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(200)'}),
    sa.Column("isCremated", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("deceasedAddress1", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("deceasedAddress2", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("deceasedCity", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("deceasedProvince", mssql.NVARCHAR(2, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(2)'}),
    sa.Column("deceasedPostalCode", mssql.NVARCHAR(7, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(7)'}),
    sa.Column("birthDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("birthPlace", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("deathDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("deathPlace", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("deathAge", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("deathAgePeriod", mssql.NVARCHAR(10, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(10)'}),
    sa.Column("intermentContainerTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("intermentDepthId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("findagraveMemorialId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "intermentNumber"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractInterments_contractId_Contracts"),
    sa.ForeignKeyConstraint(["intermentContainerTypeId"], ["dbo.IntermentContainerTypes.intermentContainerTypeId"], name="fk_ContractInterments_intermentContainerTypeId_IntermentContainerTypes"),
    sa.ForeignKeyConstraint(["intermentDepthId"], ["dbo.IntermentDepths.intermentDepthId"], name="fk_ContractInterments_intermentDepthId_IntermentDepths"),
    info={"source_table": "ContractInterments"},
)



TABLE_FeeCategories = sa.Table(
    "FeeCategories",
    metadata,
    sa.Column("feeCategoryId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("feeCategory", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("isGroupedFee", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "FeeCategories"},
)



TABLE_Fees = sa.Table(
    "Fees",
    metadata,
    sa.Column("feeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("feeCategoryId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("feeName", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("feeDescription", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("feeAccount", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("contractTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("includeQuantity", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'boolean'}),
    sa.Column("quantityUnit", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("feeAmount", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(8, 2)'}),
    sa.Column("feeFunction", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("taxAmount", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(6, 2)'}),
    sa.Column("taxPercentage", mssql.FLOAT(53), nullable=True, info={'source_declared_type': 'DECIMAL(5, 2)'}),
    sa.Column("isRequired", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.ForeignKeyConstraint(["feeCategoryId"], ["dbo.FeeCategories.feeCategoryId"], name="fk_Fees_feeCategoryId_FeeCategories"),
    sa.ForeignKeyConstraint(["contractTypeId"], ["dbo.ContractTypes.contractTypeId"], name="fk_Fees_contractTypeId_ContractTypes"),
    sa.ForeignKeyConstraint(["burialSiteTypeId"], ["dbo.BurialSiteTypes.burialSiteTypeId"], name="fk_Fees_burialSiteTypeId_BurialSiteTypes"),
    info={"source_table": "Fees"},
)

sa.Index("idx_Fees_orderNumber", TABLE_Fees.c.orderNumber, TABLE_Fees.c.feeName)


TABLE_ContractFees = sa.Table(
    "ContractFees",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("feeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("quantity", mssql.FLOAT(53), nullable=False, server_default=sa.text('1'), info={'source_declared_type': 'DECIMAL(4, 1)'}),
    sa.Column("feeAmount", mssql.FLOAT(53), nullable=False, info={'source_declared_type': 'DECIMAL(8, 2)'}),
    sa.Column("taxAmount", mssql.FLOAT(53), nullable=False, info={'source_declared_type': 'DECIMAL(8, 2)'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "feeId"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractFees_contractId_Contracts"),
    sa.ForeignKeyConstraint(["feeId"], ["dbo.Fees.feeId"], name="fk_ContractFees_feeId_Fees"),
    info={"source_table": "ContractFees"},
)



TABLE_ContractTransactions = sa.Table(
    "ContractTransactions",
    metadata,
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("transactionIndex", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("transactionDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("transactionTime", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("transactionAmount", mssql.FLOAT(53), nullable=False, info={'source_declared_type': 'DECIMAL(8, 2)'}),
    sa.Column("isInvoiced", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("externalReceiptNumber", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("transactionNote", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("contractId", "transactionIndex"),
    sa.CheckConstraint("transactionDate > 0", name="ck_ContractTransactions_transactionDate"),
    sa.CheckConstraint("transactionTime >= 0", name="ck_ContractTransactions_transactionTime"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_ContractTransactions_contractId_Contracts"),
    info={"source_table": "ContractTransactions"},
)

sa.Index("idx_ContractTransactions_orderNumber", TABLE_ContractTransactions.c.contractId, TABLE_ContractTransactions.c.transactionDate, TABLE_ContractTransactions.c.transactionTime)


TABLE_WorkOrderTypes = sa.Table(
    "WorkOrderTypes",
    metadata,
    sa.Column("workOrderTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "WorkOrderTypes"},
)

sa.Index("idx_WorkOrderTypes_orderNumber", TABLE_WorkOrderTypes.c.orderNumber, TABLE_WorkOrderTypes.c.workOrderType)


TABLE_WorkOrderStatuses = sa.Table(
    "WorkOrderStatuses",
    metadata,
    sa.Column("workOrderStatusId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderStatus", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "WorkOrderStatuses"},
)

sa.Index("idx_WorkOrderStatuses_orderNumber", TABLE_WorkOrderStatuses.c.orderNumber, TABLE_WorkOrderStatuses.c.workOrderStatus)


TABLE_WorkOrders = sa.Table(
    "WorkOrders",
    metadata,
    sa.Column("workOrderId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderTypeId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderNumber", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("workOrderDescription", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("workOrderStatusId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderOpenDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderCloseDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("workOrderOpenDate > 0", name="ck_WorkOrders_workOrderOpenDate"),
    sa.CheckConstraint("workOrderCloseDate > 0", name="ck_WorkOrders_workOrderCloseDate"),
    sa.ForeignKeyConstraint(["workOrderTypeId"], ["dbo.WorkOrderTypes.workOrderTypeId"], name="fk_WorkOrders_workOrderTypeId_WorkOrderTypes"),
    sa.ForeignKeyConstraint(["workOrderStatusId"], ["dbo.WorkOrderStatuses.workOrderStatusId"], name="fk_WorkOrders_workOrderStatusId_WorkOrderStatuses"),
    info={"source_table": "WorkOrders"},
)



TABLE_WorkOrderBurialSites = sa.Table(
    "WorkOrderBurialSites",
    metadata,
    sa.Column("workOrderId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("burialSiteId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("workOrderId", "burialSiteId"),
    sa.ForeignKeyConstraint(["workOrderId"], ["dbo.WorkOrders.workOrderId"], name="fk_WorkOrderBurialSites_workOrderId_WorkOrders"),
    sa.ForeignKeyConstraint(["burialSiteId"], ["dbo.BurialSites.burialSiteId"], name="fk_WorkOrderBurialSites_burialSiteId_BurialSites"),
    info={"source_table": "WorkOrderBurialSites"},
)



TABLE_WorkOrderContracts = sa.Table(
    "WorkOrderContracts",
    metadata,
    sa.Column("workOrderId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("contractId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("workOrderId", "contractId"),
    sa.ForeignKeyConstraint(["workOrderId"], ["dbo.WorkOrders.workOrderId"], name="fk_WorkOrderContracts_workOrderId_WorkOrders"),
    sa.ForeignKeyConstraint(["contractId"], ["dbo.Contracts.contractId"], name="fk_WorkOrderContracts_contractId_Contracts"),
    info={"source_table": "WorkOrderContracts"},
)



TABLE_WorkOrderComments = sa.Table(
    "WorkOrderComments",
    metadata,
    sa.Column("workOrderCommentId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("commentTime", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("comment", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("commentDate > 0", name="ck_WorkOrderComments_commentDate"),
    sa.CheckConstraint("commentTime >= 0", name="ck_WorkOrderComments_commentTime"),
    sa.ForeignKeyConstraint(["workOrderId"], ["dbo.WorkOrders.workOrderId"], name="fk_WorkOrderComments_workOrderId_WorkOrders"),
    info={"source_table": "WorkOrderComments"},
)

sa.Index("idx_WorkOrderComments_datetime", TABLE_WorkOrderComments.c.workOrderId, TABLE_WorkOrderComments.c.commentDate, TABLE_WorkOrderComments.c.commentTime)


TABLE_WorkOrderMilestoneTypes = sa.Table(
    "WorkOrderMilestoneTypes",
    metadata,
    sa.Column("workOrderMilestoneTypeId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneType", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("orderNumber", sa.SmallInteger(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'smallint'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "WorkOrderMilestoneTypes"},
)



TABLE_WorkOrderMilestones = sa.Table(
    "WorkOrderMilestones",
    metadata,
    sa.Column("workOrderMilestoneId", sa.BigInteger(), sa.Identity(start=1, increment=1), nullable=False, primary_key=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderId", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneTypeId", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneTime", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneDescription", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'TEXT'}),
    sa.Column("workOrderMilestoneCompletionDate", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("workOrderMilestoneCompletionTime", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    sa.CheckConstraint("workOrderMilestoneDate >= 0", name="ck_WorkOrderMilestones_workOrderMilestoneDate"),
    sa.CheckConstraint("workOrderMilestoneTime >= 0", name="ck_WorkOrderMilestones_workOrderMilestoneTime"),
    sa.CheckConstraint("workOrderMilestoneCompletionDate > 0", name="ck_WorkOrderMilestones_workOrderMilestoneCompletionDate"),
    sa.CheckConstraint("workOrderMilestoneCompletionTime >= 0", name="ck_WorkOrderMilestones_workOrderMilestoneCompletionTime"),
    sa.ForeignKeyConstraint(["workOrderId"], ["dbo.WorkOrders.workOrderId"], name="fk_WorkOrderMilestones_workOrderId_WorkOrders"),
    sa.ForeignKeyConstraint(["workOrderMilestoneTypeId"], ["dbo.WorkOrderMilestoneTypes.workOrderMilestoneTypeId"], name="fk_WorkOrderMilestones_workOrderMilestoneTypeId_WorkOrderMilestoneTypes"),
    info={"source_table": "WorkOrderMilestones"},
)



TABLE_CemarisSettings = sa.Table(
    "CemarisSettings",
    metadata,
    sa.Column("settingKey", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, primary_key=True, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("settingValue", mssql.NVARCHAR(500, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(500)'}),
    sa.Column("previousSettingValue", mssql.NVARCHAR(500, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(500)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "SunriseSettings"},
)



TABLE_UserSettings = sa.Table(
    "UserSettings",
    metadata,
    sa.Column("username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("settingKey", mssql.NVARCHAR(100, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(100)'}),
    sa.Column("settingValue", mssql.NVARCHAR(500, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(500)'}),
    sa.Column("previousSettingValue", mssql.NVARCHAR(500, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(500)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.PrimaryKeyConstraint("username", "settingKey"),
    info={"source_table": "UserSettings"},
)



TABLE_Users = sa.Table(
    "Users",
    metadata,
    sa.Column("username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, primary_key=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("isActive", mssql.BIT(), nullable=False, server_default=sa.text('1'), info={'source_declared_type': 'bit'}),
    sa.Column("canUpdateCemeteries", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("canUpdateContracts", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("canUpdateWorkOrders", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("isAdmin", mssql.BIT(), nullable=False, server_default=sa.text('0'), info={'source_declared_type': 'bit'}),
    sa.Column("recordCreate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordCreate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordUpdate_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordUpdate_timeMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("recordDelete_username", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("recordDelete_timeMillis", sa.BigInteger(), autoincrement=False, nullable=True, info={'source_declared_type': 'INTEGER'}),
    info={"source_table": "Users"},
)



TABLE_AuditLog = sa.Table(
    "AuditLog",
    metadata,
    sa.Column("logMillis", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("logDate", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("logTime", sa.BigInteger(), autoincrement=False, nullable=False, info={'source_declared_type': 'INTEGER'}),
    sa.Column("mainRecordType", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("mainRecordId", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("updateTable", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("recordIndex", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("updateField", mssql.NVARCHAR(50, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(50)'}),
    sa.Column("updateType", mssql.NVARCHAR(20, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(20)'}),
    sa.Column("updateUsername", mssql.NVARCHAR(30, collation=TEXT_COLLATION), nullable=False, info={'source_declared_type': 'VARCHAR(30)'}),
    sa.Column("fromValue", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    sa.Column("toValue", mssql.NVARCHAR(None, collation=TEXT_COLLATION), nullable=True, info={'source_declared_type': 'TEXT'}),
    info={"source_table": "AuditLog"},
)

sa.Index("idx_AuditLog", TABLE_AuditLog.c.logMillis)
sa.Index("idx_AuditLog_recordTypeId", TABLE_AuditLog.c.mainRecordType, TABLE_AuditLog.c.mainRecordId, TABLE_AuditLog.c.logMillis)


def upgrade() -> None:
    metadata.create_all(bind=op.get_bind(), checkfirst=False)


def downgrade() -> None:
    metadata.drop_all(bind=op.get_bind(), checkfirst=False)
