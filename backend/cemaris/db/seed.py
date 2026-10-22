"""Initial Cemaris catalog values, localized for German municipalities, without application CRUD side effects.

Ported from Sunrise CMS database/initializeDatabase.ts and its add* helpers at
451ce034863b16502484367044f3e9b65370111a. Sunrise is MIT licensed; see
licenses/Sunrise-LICENSE.md. This module inserts catalogs only: application
audit logging, cache invalidation and read-time order normalization belong to
the later catalog/application workflows. The caller owns the transaction.
"""

from __future__ import annotations

from time import time_ns
from typing import Any

from sqlalchemy import Connection, select

from cemaris.db.schema import TABLES


def _ordered(column: str, *names: str) -> tuple[dict[str, Any], ...]:
    return tuple({column: name, "orderNumber": index} for index, name in enumerate(names, 1))


# Preserve the values supplied by initializeData, including its repeated order 2
# and the empty Columbarium capacity which addBurialSiteType converts to NULL.
DEFAULT_CATALOGS: dict[str, tuple[dict[str, Any], ...]] = {
    "BurialSiteTypes": (
        {"burialSiteType": "Erdgrab", "bodyCapacityMax": 2, "crematedCapacityMax": 6, "orderNumber": 1},
        {"burialSiteType": "Kolumbarium", "bodyCapacityMax": 0, "crematedCapacityMax": None, "orderNumber": 2},
        {"burialSiteType": "Mausoleum", "bodyCapacityMax": 2, "crematedCapacityMax": 0, "orderNumber": 2},
        {"burialSiteType": "Urnenwand", "bodyCapacityMax": 0, "crematedCapacityMax": 1, "orderNumber": 2},
        {"burialSiteType": "Urnengarten", "bodyCapacityMax": 0, "crematedCapacityMax": 1, "orderNumber": 2},
        {"burialSiteType": "Krematorium", "bodyCapacityMax": 0, "crematedCapacityMax": 1, "orderNumber": 2},
    ),
    "BurialSiteStatuses": _ordered("burialSiteStatus", "Verfügbar", "Reserviert", "Belegt"),
    "ContractTypes": (
        {"contractType": "Vorsorge", "isPreneed": True, "orderNumber": 1},
        {"contractType": "Bestattungsfall", "isPreneed": False, "orderNumber": 2},
        {"contractType": "Genehmigung", "isPreneed": False, "orderNumber": 3},
    ),
    "ServiceTypes": _ordered("serviceType", "Beisetzung", "Einäscherung", "Gruftbeisetzung", "Urnenbeisetzung", "Ausbettung"),
    "IntermentContainerTypes": (
        {"intermentContainerType": "Ohne Einfassung", "intermentContainerTypeKey": "NS", "orderNumber": 1},
        {"intermentContainerType": "Betonauskleidung", "intermentContainerTypeKey": "CL", "orderNumber": 2},
        {"intermentContainerType": "Unbeschichtete Grabkammer", "intermentContainerTypeKey": "UV", "orderNumber": 3},
        {"intermentContainerType": "Betongrabkammer", "intermentContainerTypeKey": "CV", "orderNumber": 4},
        {"intermentContainerType": "Holzeinfassung", "intermentContainerTypeKey": "WS", "orderNumber": 5},
        {"intermentContainerType": "Stahlgrabkammer", "intermentContainerTypeKey": "SV", "orderNumber": 6},
        {"intermentContainerType": "Leichentuch", "intermentContainerTypeKey": "SH", "orderNumber": 7},
        {"intermentContainerType": "Urne", "intermentContainerTypeKey": "U", "isCremationType": True, "orderNumber": 7},
    ),
    "IntermentDepths": (
        {"intermentDepth": "Einfach", "intermentDepthKey": "S", "orderNumber": 1},
        {"intermentDepth": "Doppelt", "intermentDepthKey": "D", "orderNumber": 2},
    ),
    "CommittalTypes": (
        {"committalType": "Am Grab", "committalTypeKey": "GS", "orderNumber": 1},
        {"committalType": "Kapelle", "committalTypeKey": "CS", "orderNumber": 2},
        {"committalType": "Kirche", "committalTypeKey": "CH", "orderNumber": 3},
    ),
    "FeeCategories": _ordered(
        "feeCategory", "Grabnutzungsrechte", "Einäscherungsleistungen", "Bestattungsgebühren",
        "Ausbettung sterblicher Überreste", "Zusätzliche Leistungen",
    ),
    "WorkOrderTypes": _ordered("workOrderType", "Beisetzung", "Einäscherung"),
    "WorkOrderStatuses": _ordered("workOrderStatus", "Erfasst", "Geplant", "Abgeschlossen", "Nicht erschienen", "Storniert"),
    "WorkOrderMilestoneTypes": _ordered("workOrderMilestoneType", "Trauerfeier", "Ankunft", "Einäscherung", "Beisetzung"),
}


def seed_default_catalogs(
    connection: Connection, *, time_millis: int | None = None
) -> dict[str, int]:
    """Fill each catalog only if it has no active records, retaining deleted rows.

    No existing rows are edited. Repeated calls are idempotent. This deliberately
    exposes the catalog insertion portion of initializeData; Sunrise's get*
    helpers also normalize existing order numbers as a read side effect.
    """
    if connection.dialect.name != "mssql":
        raise ValueError("Catalog initialization requires Microsoft SQL Server.")
    timestamp = time_ns() // 1_000_000 if time_millis is None else time_millis
    if type(timestamp) is not int or timestamp < 0:
        raise ValueError("time_millis must be a nonnegative integer.")
    audit = {
        "recordCreate_username": "databaseInit",
        "recordCreate_timeMillis": timestamp,
        "recordUpdate_username": "databaseInit",
        "recordUpdate_timeMillis": timestamp,
    }
    inserted: dict[str, int] = {}
    for name, rows in DEFAULT_CATALOGS.items():
        table = TABLES[name]
        active = connection.execute(
            select(1).select_from(table).where(table.c.recordDelete_timeMillis.is_(None)).limit(1)
        ).first()
        inserted[name] = 0
        if active is not None:
            continue
        for row in rows:
            connection.execute(table.insert().values(**row, **audit))
            inserted[name] += 1
    return inserted
