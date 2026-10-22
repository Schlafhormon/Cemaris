"""Executed Sunrise geographic cases and real SQL Server/API evidence."""

import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.auth_config import AuthSettings
from cemaris.burial_sites import BurialSiteOptions, get_burial_site
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.geography import (
    fill_block_range, get_burial_site_names_by_range, get_burial_sites_for_map,
    get_media_files, search_burial_sites_for_gps, update_burial_site_coordinates,
)
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions

REFERENCE = json.loads((Path(__file__).parent / "fixtures/geography-reference.json").read_text(encoding="utf-8"))








def insert(connection, name, **values):
    table = TABLES[name]
    if "recordCreate_username" in table.c:
        values = {"recordCreate_username": "fixture", "recordCreate_timeMillis": 1,
            "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1, **values}
    result = connection.execute(table.insert().values(**values))
    return result.inserted_primary_key[0] if any(column.identity is not None for column in table.c) else None


def seed_geo(connection):
    maps = {key: {} for key in ("cemeteryId", "burialSiteId", "contractTypeId", "contractId", "burialSiteTypeId")}
    maps["burialSiteTypeId"][1] = insert(connection, "BurialSiteTypes", burialSiteType="Synthetic type")
    for group, table, key in (("cemeteries", "Cemeteries", "cemeteryId"), ("sites", "BurialSites", "burialSiteId"),
        ("contractTypes", "ContractTypes", "contractTypeId"), ("contracts", "Contracts", "contractId"), ("interments", "ContractInterments", None)):
        for item in REFERENCE["seed"][group]:
            values = {field: value for field, value in item.items() if field != "id"}
            for field in ("cemeteryId", "parentCemeteryId", "burialSiteId", "burialSiteTypeId", "contractTypeId", "contractId"):
                if values.get(field) is not None:
                    values[field] = maps["cemeteryId" if field == "parentCemeteryId" else field][values[field]]
            identifier = insert(connection, table, **values)
            if key:
                maps[key][item["id"]] = identifier
    return maps


def normalize(value, maps):
    if isinstance(value, list):
        return [normalize(item, maps) for item in value]
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key in maps and item is not None:
                result[key] = {actual: source for source, actual in maps[key].items()}.get(item, item)
            else:
                result[key] = normalize(item, maps)
        return result
    return value


def summarize(rows, expected):
    return {"count": len(rows), "rows": rows} if "rows" in expected else {"count": len(rows), "first": rows[:2], "last": rows[-2:]}


@pytest.mark.parametrize("case", REFERENCE["rangeBlocks"])
def test_original_block_range_padding_descending_cartesian_and_limit(case):
    if "error" in case:
        with pytest.raises((ValueError, TypeError)):
            fill_block_range(case["from"], case["to"])
    else:
        assert summarize(fill_block_range(case["from"], case["to"]), case["expected"]) == case["expected"]


@pytest.mark.parametrize("case", REFERENCE["ranges"])
def test_original_sql_range_preview_names_global_conflicts_and_1000_limit(sql_connection, case):
    connection, _ = sql_connection
    maps = seed_geo(connection)
    options = BurialSiteOptions(_env_file=None, burial_site_name_segments=REFERENCE["configs"][case["configName"]])
    form = dict(case["form"])
    if form.get("cemeteryId") not in (None, ""):
        form["cemeteryId"] = maps["cemeteryId"].get(int(form["cemeteryId"]), form["cemeteryId"])
    rows = normalize(get_burial_site_names_by_range(connection, form, options), maps)
    assert summarize(rows, case["expected"]) == case["expected"]
    assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["BurialSites"])) == len(REFERENCE["seed"]["sites"])


@pytest.mark.parametrize("case", REFERENCE["maps"])
def test_original_sql_map_contract_boundaries_deleted_names_child_exclusion_zero_coordinates(sql_connection, case):
    connection, _ = sql_connection
    maps = seed_geo(connection)
    cemetery = maps["cemeteryId"].get(case["cemeteryId"], case["cemeteryId"])
    result = get_burial_sites_for_map(connection, cemetery, current_date=REFERENCE["today"])
    assert normalize(result, maps) == case["expected"]


@pytest.mark.parametrize("case", [case for case in REFERENCE["gps"] if case["form"].get("cemeteryId") not in (None, "")])
def test_original_sql_gps_filter_names_and_child_cemeteries(sql_connection, case):
    connection, _ = sql_connection
    maps = seed_geo(connection)
    form = {**case["form"], "cemeteryId": maps["cemeteryId"].get(case["form"]["cemeteryId"], case["form"]["cemeteryId"])}
    if "error" in case:
        with pytest.raises(ValueError, match="Contract status"):
            search_burial_sites_for_gps(connection, form, current_date=REFERENCE["today"])
    else:
        rows = search_burial_sites_for_gps(connection, form, current_date=REFERENCE["today"])
        assert {"success": True, "burialSites": normalize(rows, maps)} == case["expected"]


def test_gps_limit_is_500_and_ignores_caller_pagination(sql_connection):
    connection, _ = sql_connection
    maps = seed_geo(connection)
    table = TABLES["BurialSites"]
    values = [{"burialSiteName": f"GPS-{number:04d}", **{f"burialSiteNameSegment{index}": f"GPS-{number:04d}" if index == 1 else "" for index in range(1, 6)},
        "burialSiteTypeId": maps["burialSiteTypeId"][1], "cemeteryId": maps["cemeteryId"][1],
        "recordCreate_username": "fixture", "recordCreate_timeMillis": 1, "recordUpdate_username": "fixture", "recordUpdate_timeMillis": 1} for number in range(510)]
    connection.execute(table.insert(), values)
    rows = search_burial_sites_for_gps(connection, {"cemeteryId": maps["cemeteryId"][1], "limit": 1, "offset": 501})
    assert len(rows) == 500 and rows[0]["burialSiteName"] == "A01"


def test_coordinates_preserve_other_fields_empty_null_deleted_guard_and_audit(sql_connection):
    connection, _ = sql_connection
    maps = seed_geo(connection)
    identifier = maps["burialSiteId"][1]
    table = TABLES["BurialSites"]
    before = dict(connection.execute(sa.select(table).where(table.c.burialSiteId == identifier)).mappings().one())
    assert update_burial_site_coordinates(connection, {"burialSiteId": identifier, "burialSiteLatitude": "51.123456", "burialSiteLongitude": "0"}, "geo", audit_enabled=True)
    after = dict(connection.execute(sa.select(table).where(table.c.burialSiteId == identifier)).mappings().one())
    assert after["burialSiteLatitude"] == 51.123456 and after["burialSiteLongitude"] == 0
    for key in set(before) - {"burialSiteLatitude", "burialSiteLongitude", "recordUpdate_username", "recordUpdate_timeMillis"}:
        assert after[key] == before[key]
    audit = TABLES["AuditLog"]
    rows = connection.execute(sa.select(audit).where(audit.c.mainRecordType == "burialSite", audit.c.mainRecordId == str(identifier))).mappings().all()
    assert any(row["updateField"] == "burialSiteLatitude" and json.loads(row["fromValue"]) == 0 and json.loads(row["toValue"]) == 51.123456 for row in rows)
    assert update_burial_site_coordinates(connection, {"burialSiteId": identifier, "burialSiteLatitude": "", "burialSiteLongitude": ""}, "geo")
    assert get_burial_site(connection, identifier)["burialSiteLatitude"] is None
    for missing in (maps["burialSiteId"][2], 999999):
        assert not update_burial_site_coordinates(connection, {"burialSiteId": missing, "burialSiteLatitude": "1", "burialSiteLongitude": "2"}, "geo", audit_enabled=True)
    with pytest.raises(ValueError, match="finite"):
        update_burial_site_coordinates(connection, {"burialSiteId": identifier, "burialSiteLatitude": "NaN", "burialSiteLongitude": "2"}, "geo")
    assert get_burial_site(connection, identifier)["burialSiteLatitude"] is None




@pytest.mark.parametrize("refresh", [False, True])
def test_original_media_extension_filter_missing_folder_cache_and_refresh(tmp_path, refresh):
    assets = REFERENCE["assets"]
    for category, names in (("burialSites", assets["inputImages"]), ("cemeteries", assets["inputSVGs"])):
        folder = tmp_path / "public-internal/images" / category
        folder.mkdir(parents=True)
        for name in names:
            (folder / name).write_text("synthetic", encoding="utf-8")
    # Source incorrectly lists directories ending .jpg. Cemaris excludes them
    # because delivery must return a real file, with the difference documented.
    (tmp_path / "public-internal/images/burialSites/directory.jpg").mkdir()
    options = BurialSiteOptions(_env_file=None, customizations_path=tmp_path,
        burial_site_refresh_image_changes=refresh, cemetery_refresh_image_changes=refresh)
    assert get_media_files(options, "burialSites") == [name for name in assets["initialImages"] if name != "directory.jpg"]
    assert get_media_files(options, "cemeteries") == assets["svgDiscovery"]
    new_image = tmp_path / "public-internal/images/burialSites/new.jpg"
    new_image.write_bytes(b"synthetic")
    assert ("new.jpg" in get_media_files(options, "burialSites")) == refresh
    (tmp_path / "public-internal/images/burialSites/c.png").unlink()
    assert ("c.png" not in get_media_files(options, "burialSites")) == refresh
    missing = BurialSiteOptions(_env_file=None, customizations_path=tmp_path / "missing")
    assert get_media_files(missing, "burialSites") == assets["missingImages"]
    assert get_media_files(missing, "cemeteries") == assets["missingSVGs"]


def login(client, username):
    csrf = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": username, "password": "synthetic-password"}, headers={"X-CSRF-Token": csrf})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.fixture
def geo_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        maps = seed_geo(connection)
    names = ["admin", "reader", "updater", "cemetery", "contract"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"], can_update_cemeteries=["cemetery"], can_update_contracts=["contract"])
    options = BurialSiteOptions(_env_file=None, customizations_path=tmp_path)
    for category, name, body in (("cemeteries", "Synthetic.svg", '<svg xmlns="http://www.w3.org/2000/svg"><path id="A01" d="M0 0h10v10z"/></svg>'),
        ("burialSites", "Synthetic.JPG", "synthetic image")):
        folder = tmp_path / "public-internal/images" / category
        folder.mkdir(parents=True)
        (folder / name).write_text(body, encoding="utf-8")
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True), burial_site_options=options)
    app.state.db_engine = engine
    app.state.test_maps = maps
    return app


@pytest.mark.parametrize("username,can_update", [("admin", False), ("reader", False), ("updater", True), ("cemetery", True), ("contract", False)])
def test_geography_http_roles_and_csrf(geo_app, username, can_update):
    maps = geo_app.state.test_maps
    with TestClient(geo_app) as client:
        for path in ("/api/cemeteries/images/Synthetic.svg", "/api/burialSites/images/Synthetic.JPG"):
            assert client.get(path).status_code == 401
        headers = login(client, username)
        assert client.post("/api/burialSites/doGetBurialSitesForMap", json={"cemeteryId": maps["cemeteryId"][1]}).status_code == 403
        response = client.post("/api/burialSites/doGetBurialSitesForMap", json={"cemeteryId": maps["cemeteryId"][1]}, headers=headers)
        assert response.status_code == 200 and response.json()["success"]
        for action, payload in (("doSearchBurialSitesForGPS", {"cemeteryId": maps["cemeteryId"][1]}),
            ("doUpdateBurialSiteLatitudeLongitude", {"burialSiteId": maps["burialSiteId"][1], "burialSiteLatitude": "0", "burialSiteLongitude": "0"}),
            ("doGetBurialSiteNamesByRange", {"cemeteryId": "", "burialSiteNameSegment1_from": "A01", "burialSiteNameSegment1_to": "A04"})):
            response = client.post("/api/burialSites/" + action, json=payload, headers=headers)
            assert response.status_code == (200 if can_update else 403), response.text
        assert client.get("/api/cemeteries/options").json()["cemeterySVGs"] == ["Synthetic.svg"]
        assert client.get("/api/burialSites/options").json()["burialSiteImages"] == ["Synthetic.JPG"]
        assert client.get("/api/burialSites/options").json()["cemeterySVGs"] == ["Synthetic.svg"]
        svg = client.get("/api/cemeteries/images/Synthetic.svg")
        assert svg.status_code == 200 and svg.headers["content-type"].startswith("image/svg+xml") and 'id="A01"' in svg.text
        assert svg.headers["content-security-policy"] == "sandbox"
        assert client.get("/api/burialSites/images/Synthetic.JPG").status_code == 200
        for path in ("/api/cemeteries/images/not-there.svg", "/api/cemeteries/images/..%5CSynthetic.svg", "/api/cemeteries/images/Synthetic.JPG"):
            assert client.get(path).status_code == 404


def test_geography_http_missing_selection_values_and_committed_coordinates(geo_app):
    maps = geo_app.state.test_maps
    identifier = maps["burialSiteId"][1]
    with TestClient(geo_app) as client:
        headers = login(client, "cemetery")
        for route in ("doGetBurialSitesForMap", "doSearchBurialSitesForGPS"):
            response = client.post("/api/burialSites/" + route, json={}, headers=headers)
            assert response.status_code == 200 and response.json() == {"success": False, "errorMessage": "Cemetery selection is required"}
        payload = {"burialSiteId": identifier, "burialSiteLatitude": "52.123456", "burialSiteLongitude": "13.654321"}
        assert client.post("/api/burialSites/doUpdateBurialSiteLatitudeLongitude", json=payload).status_code == 403
        assert client.post("/api/burialSites/doUpdateBurialSiteLatitudeLongitude", json=payload, headers=headers).json() == {"success": True}
        with geo_app.state.db_engine.connect() as connection:
            record = get_burial_site(connection, identifier)
            assert record["burialSiteLatitude"] == 52.123456 and record["burialSiteLongitude"] == 13.654321
            audit = TABLES["AuditLog"]
            audits_before = [dict(row) for row in connection.execute(sa.select(audit).where(
                audit.c.mainRecordType == "burialSite", audit.c.mainRecordId == str(identifier))).mappings()]
        for latitude, longitude in ((91, 13), (-91, 13), (52, 181), (52, -181)):
            response = client.post("/api/burialSites/doUpdateBurialSiteLatitudeLongitude", json={
                "burialSiteId": identifier, "burialSiteLatitude": latitude, "burialSiteLongitude": longitude}, headers=headers)
            assert response.status_code == 400 and response.json()["error"]["code"] == "invalid_coordinate_value"
        with geo_app.state.db_engine.connect() as connection:
            assert get_burial_site(connection, identifier) == record
            assert [dict(row) for row in connection.execute(sa.select(audit).where(
                audit.c.mainRecordType == "burialSite", audit.c.mainRecordId == str(identifier))).mappings()] == audits_before
        for payload in ({"burialSiteId": 999999, "burialSiteLatitude": "", "burialSiteLongitude": ""},
            {"burialSiteId": identifier, "burialSiteLatitude": "nan", "burialSiteLongitude": "1"}, {}):
            assert client.post("/api/burialSites/doUpdateBurialSiteLatitudeLongitude", json=payload, headers=headers).status_code == 400
        response = client.post("/api/burialSites/doSearchBurialSitesForGPS", json={"cemeteryId": maps["cemeteryId"][1], "contractStatus": "occupied"}, headers=headers)
        assert response.status_code == 400 and "Contract status" in response.json()["error"]["message"]
