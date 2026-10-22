"""Actual Sunrise JS processor forms vs the Python processors, no SQL mock claim."""

from copy import deepcopy
from contextlib import nullcontext
from datetime import date
import json
from pathlib import Path

import pytest

from cemaris.import_tools.legacy import (burial_site_type, death_age_period, format_contract_number, format_date,
    format_time, import_master, import_prepaid, import_work_orders, segments, CREMATION_KEYS, DATA)
from cemaris.import_tools.sql import read_csv


FIXTURE = json.loads((Path(__file__).parent / "fixtures/imports-reference.json").read_text(encoding="utf-8"))
CATALOG_IDS = {
    "BurialSiteStatuses": {"Available": 101, "Reserved": 102, "Occupied": 103},
    "ContractTypes": {"Preneed": 201, "At Need": 202, "Permit Only": 203},
    "BurialSiteTypes": {"In-Ground Grave": 301, "Columbarium": 302, "Crematorium": 303, "Mausoleum": 304, "Niche Wall": 305, "Urn Garden": 306},
    "ServiceTypes": {"Interment": 401, "Cremation": 402, "Entombment": 403, "Niche": 404, "Disinterment": 405},
    "WorkOrderMilestoneTypes": {"Acknowledged": 501, "Death": 502, "Funeral": 503, "Cremation": 504, "Interment": 505},
    "WorkOrderTypes": {"Interment": 601}, "WorkOrderStatuses": {"Entered": 701},
}


class ProcessorBoundary:
    """The same injected state and CRUD boundary as reference_imports.mjs."""
    def __init__(self, state):
        self.state = state
        self.operations = []
        self.contract_id = 0
        self.existing_site = dict(burialSiteId=1, burialSiteStatusId=state.get("status", 103)) if state.get("site") else None
        self.order = dict(workOrderId=1, workOrderNumber="000042", workOrderBurialSites=[dict(burialSiteId=1)] if state.get("linked") else []) if state.get("order") else None
        if self.order and state.get("closed"):
            self.order["workOrderCloseDate"] = 20250407

    def id(self, table, name):
        if self.state.get("noOptional") and table == "WorkOrderMilestoneTypes" and name in ("Acknowledged", "Death"):
            return None
        return CATALOG_IDS[table][name]

    def key(self, table, key):
        return table + ":" + key if key else ""

    def cemetery(self, key):
        return "cemetery:" + key

    def site(self, row, prefix, status, *, cemetery=None, svg=False, update_existing=False):
        key = row[prefix + "CEMETERY"]
        if key in CREMATION_KEYS:
            return None
        if self.existing_site:
            if update_existing:
                self.status(self.existing_site["burialSiteId"], status)
            return self.existing_site
        parts = segments(row, prefix)
        name = "-".join([key] + [parts["burialSiteNameSegment" + str(i)] for i in (1, 2, 3, 4)])
        form = dict(parts, burialSiteStatusId=self.id("BurialSiteStatuses", status),
                    burialSiteTypeId=self.id("BurialSiteTypes", burial_site_type(key)), burialSiteImage="",
                    cemeteryId=cemetery if cemetery is not None else self.cemetery(key), cemeterySvgId=name.split(",", 1)[0] if svg else "",
                    burialSiteLatitude="", burialSiteLongitude="")
        self.call("addBurialSite", form)
        self.existing_site = dict(burialSiteId=1, burialSiteStatusId=self.id("BurialSiteStatuses", status))
        return self.existing_site

    def status(self, identifier, status):
        number = self.id("BurialSiteStatuses", status)
        self.operations.append(dict(operation="updateBurialSiteStatus", form=dict(identifier=identifier, status=number)))
        if self.existing_site:
            self.existing_site["burialSiteStatusId"] = number

    def find_preneed(self, site, start, name):
        return 99 if self.state.get("preneed") else None

    def fee(self, description):
        return "fee:" + description

    def work_order(self, value, *, by_id=False):
        return self.order

    def call(self, operation, form):
        self.operations.append(dict(operation=operation, form=deepcopy(form)))
        if operation == "addContract":
            self.contract_id += 1
            return self.contract_id
        if operation == "addWorkOrder":
            self.order = dict(form, workOrderId=1, workOrderBurialSites=[])
            return 1
        if operation == "addWorkOrderBurialSite":
            self.order["workOrderBurialSites"].append(dict(burialSiteId=form["burialSiteId"]))
        if operation == "closeWorkOrder":
            self.order["workOrderCloseDate"] = 20250407
        if operation == "reopenWorkOrder":
            self.order.pop("workOrderCloseDate", None)
        return True


@pytest.mark.parametrize("case", FIXTURE["scenarios"], ids=lambda case: case["name"])
def test_actual_original_import_processor_forms(case):
    gateway = ProcessorBoundary(case["state"])
    if case["kind"] == "master":
        import_master(gateway, case["rows"])
    elif case["kind"] == "prepaid":
        import_prepaid(gateway, case["rows"])
    else:
        import_work_orders(gateway, case["rows"], current_date=date(2026, 10, 20))
    assert gateway.operations == case["operations"]


@pytest.mark.parametrize("case", FIXTURE["utilities"]["dates"])
def test_import_date_corrections_and_padding(case):
    assert format_date(*case["input"]) == case["expected"]


@pytest.mark.parametrize("case", FIXTURE["utilities"]["times"])
def test_import_time_padding(case):
    assert format_time(*case["input"]) == case["expected"]


@pytest.mark.parametrize("case", FIXTURE["utilities"]["contractNumbers"])
def test_import_legacy_number(case):
    assert format_contract_number(case["input"]) == case["expected"]


@pytest.mark.parametrize("case", FIXTURE["utilities"]["periods"])
def test_import_death_age_period(case):
    assert death_age_period(case["input"]) == case["expected"]


@pytest.mark.parametrize("case", FIXTURE["utilities"]["types"])
def test_import_burial_type_mapping(case):
    assert CATALOG_IDS["BurialSiteTypes"][burial_site_type(case["input"]) ] == case["expected"]


def test_source_mapping_all_regional_data_preserved():
    assert len(DATA["cemeteries"]) == 13
    assert len(DATA["funeralHomes"]) == 10
    assert set(DATA["fields"]) == {"master", "prepaid", "workOrder"}
    assert DATA["cemeteries"]["NG"]["cemeteryName"] == "New Greenwood"


def test_csv_utf8_bom_quotes_newline_empty_lines(tmp_path):
    import csv
    path = tmp_path / "CMMASTER.csv"
    case = FIXTURE["scenarios"][0]["rows"][0]
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=DATA["fields"]["master"])
        writer.writeheader()
        writer.writerow(case)
        stream.write("\n")
    assert read_csv(path, "master") == [case]


@pytest.mark.parametrize("content", ["a,b\n1,2\n", "", "CM_SYSREC\n1\n"])
def test_csv_rejects_missing_headers_before_purge(tmp_path, content):
    path = tmp_path / "invalid.csv"
    path.write_text(content, encoding="utf-8")
    with pytest.raises(ValueError, match="missing required columns"):
        read_csv(path, "master")
