"""Sunrise map, GPS and range tools (MIT), fixed reference 451ce034863b165.

Source: getBurialSitesForMap.ts, getBurialSiteNamesByRange.ts, the geographic
burialSitesPost handlers and images.helpers.ts. See licenses/Sunrise-LICENSE.md.
Block ranges also derive from the packages identified in the function below;
their notices are licenses/fill-block-range-LICENSE.md and fill-range-LICENSE.txt.
"""

from datetime import date
from itertools import product
import math
from pathlib import Path
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import FileResponse
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError

from cemaris.burial_sites import _audit, _raw, build_burial_site_name, get_burial_site_deceased_names, search_burial_sites
from cemaris.catalogs import _catalog_error, _number
from cemaris.db.schema import TABLES
from cemaris.db.semantics import date_to_integer, js_number
from cemaris.preferences import now_millis, transaction


BURIAL_SITE_NAME_RANGE_LIMIT = 1000


def fill_block_range(start, end, *, limit=BURIAL_SITE_NAME_RANGE_LIMIT):
    """Port @cityssm/fill-block-range 0.3.0 / fill-range 7.1.1's used path.

    Maximal ASCII digit runs are blocks; every other character is a separate
    block. Ranges can descend and preserve zero padding, then form a product.
    """
    if isinstance(start, (int, float)) and not isinstance(start, bool) and isinstance(end, (int, float)) and not isinstance(end, bool):
        if not all(math.isfinite(value) and value % 1 == 0 for value in (start, end)):
            return []
        if abs(start - end) > limit:
            raise ValueError("Range exceeds limit")
        step = 1 if end >= start else -1
        return list(range(int(start), int(end) + step, step))
    if not isinstance(start, str) or not isinstance(end, str):
        raise TypeError("Range bounds must have the same type")
    parts_start, parts_end = (re.findall(r"[0-9]+|[^0-9]", value) for value in (start, end))
    if len(parts_start) != len(parts_end):
        raise ValueError("Range bounds must have the same number of parts")
    ranges = []
    length = 1
    for first, last in zip(parts_start, parts_end):
        first_number, last_number = js_number(first), js_number(last)
        first_is_number = math.isfinite(first_number) and first_number % 1 == 0
        last_is_number = math.isfinite(last_number) and last_number % 1 == 0
        if first_is_number and last_is_number:
            a, b = int(first_number), int(last_number)
            if abs(a - b) + 1 > limit:
                raise ValueError("Range exceeds limit")
            step = 1 if b >= a else -1
            padded = (first.startswith("0") and first != "0") or (last.startswith("0") and last != "0")
            width = max(len(first), len(last)) if padded else 0
            values = [str(number).zfill(width) for number in range(a, b + step, step)]
        elif (not first_is_number and len(first.encode("utf-16-le")) > 2) or (not last_is_number and len(last.encode("utf-16-le")) > 2):
            values = []
        else:
            a, b = (int.from_bytes(value.encode("utf-16-le")[:2], "little") for value in (first, last))
            step = 1 if b >= a else -1
            values = [chr(number) for number in range(a, b + step, step)]
        if re.fullmatch(r"[a-zA-Z0-9]*", first) and re.fullmatch(r"[a-zA-Z0-9]*", last):
            values = [value for value in values if re.fullmatch(r"[a-zA-Z0-9]*", value)]
        ranges.append(values)
        length *= max(len(values), 1)
        if length > limit:
            raise ValueError("Range exceeds limit")
    return ["".join(values) for values in product(*ranges)] if ranges else []


def get_burial_site_names_by_range(database, form, options):
    ranges = []
    try:
        length = 1
        for index in range(1, 6):
            first_key, last_key = f"burialSiteNameSegment{index}_from", f"burialSiteNameSegment{index}_to"
            values = [""]
            if first_key in form and last_key in form:
                values = fill_block_range(form[first_key], form[last_key] if form[last_key] != "" else form[first_key]) or [""]
            ranges.append(values)
            length *= len(values)
            if length > BURIAL_SITE_NAME_RANGE_LIMIT:
                return []
    except (ValueError, TypeError, OverflowError):
        return []
    with transaction(database) as connection:
        cemetery = TABLES["Cemeteries"]
        cemetery_key = connection.scalar(sa.select(cemetery.c.cemeteryKey).where(
            cemetery.c.cemeteryId == _number(form.get("cemeteryId"), integer=True),
            cemetery.c.recordDelete_timeMillis.is_(None))) if form.get("cemeteryId", "") != "" else None
        results = []
        for values in product(*ranges):
            segments = {f"burialSiteNameSegment{index}": value for index, value in enumerate(values, 1)}
            name = build_burial_site_name(cemetery_key, {key: str(value) for key, value in segments.items()}, options)
            results.append({"burialSiteName": name, **segments})
        sites = TABLES["BurialSites"]
        # SQL Server ignores trailing spaces in '='. The final dictionary uses
        # exact Python strings to retain SQLite's source equality semantics.
        names = [result["burialSiteName"] for result in results]
        existing = {}
        for row in connection.execute(sa.select(sites.c.burialSiteId, sites.c.burialSiteName).where(
            sites.c.burialSiteName.in_(names), sites.c.recordDelete_timeMillis.is_(None),
        ).order_by(sites.c.burialSiteId)).mappings():
            existing.setdefault(row["burialSiteName"], row["burialSiteId"])
        for result in results:
            if result["burialSiteName"] in existing:
                result["burialSiteId"] = existing[result["burialSiteName"]]
        return results


def get_burial_sites_for_map(database, cemetery_id, *, current_date=None):
    """Map deliberately includes future contracts and logically deleted names."""
    sites, cem, contracts, types, interments = (TABLES[name] for name in (
        "BurialSites", "Cemeteries", "Contracts", "ContractTypes", "ContractInterments"))
    identifier = _number(cemetery_id, integer=True)
    today = current_date if current_date is not None else date_to_integer(date.today())
    with transaction(database) as connection:
        cemetery = connection.execute(sa.select(cem.c.cemeteryLatitude, cem.c.cemeteryLongitude).where(
            cem.c.cemeteryId == identifier, cem.c.recordDelete_timeMillis.is_(None))).mappings().first()
        total = connection.scalar(sa.select(sa.func.count()).select_from(sites).where(
            sites.c.cemeteryId == identifier, sites.c.recordDelete_timeMillis.is_(None))) if cemetery else 0
        rows = [dict(row) for row in connection.execute(sa.select(
            sites.c.burialSiteId, sites.c.burialSiteName, sites.c.burialSiteLatitude,
            sites.c.burialSiteLongitude, sites.c.cemeteryId, cem.c.cemeteryName,
        ).select_from(sites.outerjoin(cem, sites.c.cemeteryId == cem.c.cemeteryId)).where(
            sites.c.recordDelete_timeMillis.is_(None), sites.c.cemeteryId == identifier,
            sites.c.burialSiteLatitude.is_not(None), sites.c.burialSiteLongitude.is_not(None),
        ).order_by(sites.c.burialSiteName)).mappings()]
        contract_filters = (
            contracts.c.recordDelete_timeMillis.is_(None),
            contracts.c.burialSiteId.in_(sa.select(sites.c.burialSiteId).where(sites.c.cemeteryId == identifier)),
            sa.or_(contracts.c.contractEndDate.is_(None), contracts.c.contractEndDate >= today),
        )
        contract_rows = connection.execute(sa.select(
            contracts.c.contractId, contracts.c.contractNumber, contracts.c.burialSiteId,
            contracts.c.contractStartDate, contracts.c.contractEndDate, types.c.contractType, types.c.isPreneed,
        ).select_from(contracts.outerjoin(types, contracts.c.contractTypeId == types.c.contractTypeId)).where(
            *contract_filters,
        ).order_by(contracts.c.contractStartDate, contracts.c.contractId)).mappings().all()
        names = {}
        if contract_rows:
            # The source GROUP_CONCAT has no name ORDER BY. The interment key
            # gives stable insertion order and preserves its comma-space split.
            for item in connection.execute(sa.select(interments.c.contractId, interments.c.deceasedName).where(
                interments.c.contractId.in_(sa.select(contracts.c.contractId).where(*contract_filters)),
            ).order_by(interments.c.contractId, interments.c.intermentNumber)).mappings():
                if item["deceasedName"] is not None:
                    names.setdefault(item["contractId"], []).append(item["deceasedName"])
        by_site = {}
        for row in contract_rows:
            contract = dict(row)
            site_id = contract.pop("burialSiteId")
            combined = ", ".join(names.get(contract["contractId"], []))
            contract["deceasedNames"] = combined.split(", ") if combined else []
            by_site.setdefault(site_id, []).append(contract)
        for row in rows:
            row["contracts"] = by_site.get(row["burialSiteId"], [])
        return {"burialSites": rows, "totalBurialSites": total,
            "cemeteryLatitude": cemetery["cemeteryLatitude"] if cemetery else None,
            "cemeteryLongitude": cemetery["cemeteryLongitude"] if cemetery else None}


def search_burial_sites_for_gps(database, filters, *, current_date=None):
    if filters.get("contractStatus") in {"occupied", "unoccupied"}:
        # Source omits the contract-count join for this endpoint. Its UI offers
        # no occupancy filter; make that unsupported request a controlled error.
        raise ValueError("Contract status filtering is unavailable for GPS searches")
    with transaction(database) as connection:
        rows = search_burial_sites(connection, filters, limit=500, offset=0, current_date=current_date)["burialSites"]
        names = {row["burialSiteId"]: row["deceasedNames"] for row in get_burial_site_deceased_names(
            connection, [row["burialSiteId"] for row in rows], current_date=current_date)}
        for row in rows:
            row.pop("contractCount", None)
            row["deceasedNames"] = names.get(row["burialSiteId"], [])
        return rows


def update_burial_site_coordinates(database, form, actor, *, audit_enabled=False):
    identifier = _number(form["burialSiteId"], integer=True)
    values = {key: _number(form[key]) for key in ("burialSiteLatitude", "burialSiteLongitude")}
    with transaction(database) as connection:
        table = TABLES["BurialSites"]
        before = _raw(connection, "BurialSites", identifier, include_deleted=False)
        result = connection.execute(table.update().where(table.c.burialSiteId == identifier,
            table.c.recordDelete_timeMillis.is_(None)).values(**values,
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount and audit_enabled:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "BurialSites", identifier))
        return bool(result.rowcount)


def get_media_files(options, category):
    folder = options.customizations_path / "public-internal" / "images" / category
    refresh = options.burial_site_refresh_image_changes if category == "burialSites" else options.cemetery_refresh_image_changes
    if refresh or category not in options._image_catalog:
        suffixes = {".jpg", ".jpeg", ".png"} if category == "burialSites" else {".svg"}
        try:
            root = folder.resolve()
            files = sorted(path.name for path in folder.iterdir()
                if path.suffix.lower() in suffixes and path.is_file() and path.resolve().parent == root)
        except OSError:
            files = []
        options._image_catalog[category] = files
    return options._image_catalog[category]


def media_response(options, category, filename):
    folder = options.customizations_path / "public-internal" / "images" / category
    path = folder / filename
    if (Path(filename).name != filename or filename not in get_media_files(options, category)
        or path.resolve().parent != folder.resolve() or not path.is_file()):
        raise HTTPException(404, "Image not found")
    return FileResponse(path, headers={"Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff"})


def install_geography(app):
    from cemaris.auth import current_user, require_update_cemeteries
    from cemaris.dependencies import get_engine

    router = APIRouter(prefix="/api/burialSites", tags=["geography"])

    @router.post("/doGetBurialSitesForMap")
    def map_sites(request: Request, form: dict[str, Any] = Body(...), user=Depends(current_user)):
        if form.get("cemeteryId", "") == "":
            return {"success": False, "errorMessage": "Cemetery selection is required"}
        try:
            return {"success": True, **get_burial_sites_for_map(get_engine(request), form.get("cemeteryId"))}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_map_value", str(error))

    @router.post("/doSearchBurialSitesForGPS")
    def gps_search(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
        if form.get("cemeteryId") in (None, ""):
            return {"success": False, "errorMessage": "Cemetery selection is required"}
        try:
            return {"success": True, "burialSites": search_burial_sites_for_gps(get_engine(request), form)}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_gps_search", str(error))

    @router.post("/doUpdateBurialSiteLatitudeLongitude")
    def coordinates(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
        try:
            success = update_burial_site_coordinates(get_engine(request), form, user["username"],
                audit_enabled=request.app.state.preference_options.audit_writes_enabled)
            if not success:
                return _catalog_error(request, 400, "burial_site_coordinates_not_found", "Failed to update burial site latitude and longitude")
            return {"success": True}
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_coordinate_value", "Missing coordinate field" if isinstance(error, KeyError) else str(error))
        except IntegrityError:
            return _catalog_error(request, 400, "invalid_coordinate_value", "The coordinates violate a database constraint")

    @router.post("/doGetBurialSiteNamesByRange")
    def range_names(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_cemeteries)):
        try:
            return {"cemeteryId": form.get("cemeteryId", ""), "burialSiteNameRangeLimit": BURIAL_SITE_NAME_RANGE_LIMIT,
                "burialSiteNames": get_burial_site_names_by_range(get_engine(request), form, request.app.state.burial_site_options)}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_range_value", str(error))

    app.include_router(router)

    @app.get("/api/cemeteries/images/{filename}", tags=["geography"])
    def cemetery_image(filename: str, request: Request, user=Depends(current_user)):
        return media_response(request.app.state.burial_site_options, "cemeteries", filename)
