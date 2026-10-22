"""Step-06 production UI/API QA with synthetic maps and a disposable MSSQL DB."""

from datetime import date, timedelta
import json
from pathlib import Path
import struct
import zlib

from qa_auth_browser import ROOT, main
from cemaris.db.schema import TABLES


def prepare_database(connection):
    """Only called by the guarded fresh-database harness, after migration."""
    def insert(name, **values):
        table = TABLES[name]
        if "recordCreate_username" in table.c:
            values = {"recordCreate_username": "qa-fixture", "recordCreate_timeMillis": 1,
                      "recordUpdate_username": "qa-fixture", "recordUpdate_timeMillis": 1, **values}
        return connection.execute(table.insert().values(**values)).inserted_primary_key[0]

    identifiers = {}
    identifiers["type"] = insert("BurialSiteTypes", burialSiteType="Synthetic geographic type")
    identifiers["status"] = insert("BurialSiteStatuses", burialSiteStatus="Synthetic available")
    identifiers["cemetery"] = insert("Cemeteries", cemeteryName="Synthetic Map Cemetery", cemeteryKey="MAP",
        cemeteryLatitude=51.625, cemeteryLongitude=13.558, cemeterySvg="synthetic.svg", findagraveCemeteryId=123456)
    identifiers["child"] = insert("Cemeteries", cemeteryName="Synthetic Map Child", cemeteryKey="CHILD",
        parentCemeteryId=identifiers["cemetery"])
    for index, name in enumerate(("Free", "Occupied", "Preneed", "Future", "Missing", "Child")):
        identifiers[name.lower()] = insert("BurialSites", burialSiteTypeId=identifiers["type"],
            burialSiteStatusId=identifiers["status"], burialSiteName="MAP-" + name + "-00",
            burialSiteNameSegment1=name, burialSiteNameSegment2="00", burialSiteNameSegment3="",
            burialSiteNameSegment4="", burialSiteNameSegment5="", cemeterySvgId="sector-A-01" if index == 0 else "",
            cemeteryId=identifiers["child"] if name == "Child" else identifiers["cemetery"],
            burialSiteLatitude=None if name == "Missing" else 51.625 + index * .0001,
            burialSiteLongitude=None if name == "Missing" else 13.558 + index * .0001)
    normal = insert("ContractTypes", contractType="Synthetic standard", isPreneed=False)
    preneed = insert("ContractTypes", contractType="Synthetic preneed", isPreneed=True)
    today = date.today()
    for name, type_id, start in (("occupied", normal, today), ("preneed", preneed, today), ("future", normal, today + timedelta(days=1))):
        contract = insert("Contracts", contractNumber="SYN-" + name.upper(), contractTypeId=type_id,
            burialSiteId=identifiers[name], contractStartDate=int(start.strftime("%Y%m%d")), purchaserName="Synthetic purchaser")
        identifiers[name + "Contract"] = contract
        insert("ContractInterments", contractId=contract, intermentNumber=1, deceasedName="Synthetic " + name + " Person",
            findagraveMemorialId=67890 if name == "occupied" else None,
            deceasedAddress1="", deceasedAddress2="", deceasedCity="", deceasedProvince="", deceasedPostalCode="")
    return {"CEMARIS_QA_GEO_IDS": json.dumps(identifiers)}


def create_images(folder):
    cemetery_images = folder / "public-internal/images/cemeteries"
    site_images = folder / "public-internal/images/burialSites"
    cemetery_images.mkdir(parents=True, exist_ok=True)
    site_images.mkdir(parents=True, exist_ok=True)
    (cemetery_images / "synthetic.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280">
<rect width="600" height="280" fill="#edf3e9"/><path d="M0 140H600" stroke="#c7c2b4" stroke-width="24"/>
<defs><linearGradient id="qa-gradient"><stop stop-color="#abd095"/><stop offset="1" stop-color="#d5e4c4"/></linearGradient>
<clipPath id="qa-clip"><rect x="330" y="30" width="210" height="70"/></clipPath></defs>
<g id="sector-A" fill="#abd095"><path d="M40 30H250V100H40Z"/><path d="M40 180H250V250H40Z"/></g>
<rect id="sector-B" x="330" y="30" width="210" height="70" fill="url('#qa-gradient')" clip-path="url(&quot;#qa-clip&quot;)"/>
<script>window.qaSvgExecuted = true;</script><a id="qa-external" href="https://example.invalid/synthetic"><title>Synthetic external link</title></a>
<text x="60" y="75" font-family="sans-serif" font-size="24">Synthetic sector A</text>
<text x="350" y="75" font-family="sans-serif" font-size="24">Sector B</text></svg>''', encoding="utf-8")
    # A generated solid-color raster fixture, requiring no image dependency.
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    pixels = b"".join(b"\0" + b"\x88\xb8\x92" * 240 for _ in range(120))
    (site_images / "synthetic.png").write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 240, 120, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(pixels)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    customizations = ROOT / ".local/qa-step06/customizations"
    create_images(customizations)
    main("06", "frontend/scripts/geography-browser.mjs", {
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": '["qa-admin"]',
        "CEMARIS_CUSTOMIZATIONS_PATH": str(customizations),
        "CEMARIS_BURIAL_SITE_NAME_SEGMENTS": json.dumps({"includeCemeteryKey": True, "separator": "-", "segments": {
            "1": {"isAvailable": True, "isRequired": True, "label": "Row", "minLength": 1, "maxLength": 20},
            "2": {"isAvailable": True, "isRequired": True, "label": "Number", "minLength": 1, "maxLength": 20},
        }}),
    }, prepare_database=prepare_database)
