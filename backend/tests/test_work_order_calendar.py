"""Compare the Python ICS serializer with actual locked Sunrise/package outputs."""
from datetime import datetime, timezone
from io import BytesIO
import json
from pathlib import Path
import re
import struct
from zoneinfo import ZoneInfo

import pytest

from cemaris.work_order_calendar import (build_calendar, escape_html, event_categories,
    event_description_html, event_location, event_summary)


REFERENCE = json.loads((Path(__file__).parent / "fixtures/work-orders-reference.json").read_text(encoding="utf-8"))
APP_URL = "https://cemaris.example.invalid"
PRINTS = (("syntheticWorkOrder", "Synthetic Print <&>"),)

# The Node fixture explicitly runs in Europe/Berlin. Supply its two 2026 DST
# transitions through the stdlib TZif reader, so the tests also run on UTC
# Linux and Windows machines without an installed IANA timezone database.
def reference_timezone():
    transitions = [int(datetime(2026, month, day, 1, tzinfo=timezone.utc).timestamp())
                   for month, day in ((3, 29), (10, 25))]
    header = b"TZif\0" + bytes(15) + struct.pack(">6i", 0, 0, 0, 2, 2, 9)
    data = header + struct.pack(">2i", *transitions) + bytes((1, 0))
    data += struct.pack(">iBBiBB", 3600, 0, 0, 7200, 1, 4) + b"CET\0CEST\0"
    return ZoneInfo.from_file(BytesIO(data), key="Reference/Berlin2026")


REFERENCE_TIMEZONE = reference_timezone()


def normalize(value):
    # Source generates random UUIDs on each request; no other property is removed.
    value = re.sub(r"\r\n[ \t]", "", value)
    return re.sub(r"(?m)^UID:[^\r\n]+", "UID:generated", value).replace("//Sunrise CMS//", "//Cemaris//")


@pytest.mark.parametrize("case", REFERENCE["calendarHelpers"])
def test_actual_source_calendar_html_summary_categories_location(case):
    milestone = case["milestone"]
    expected = case["expected"]
    assert event_summary(milestone) == expected["summary"]
    assert event_categories(milestone) == expected["categories"]
    assert event_location(milestone) == expected["location"]
    assert event_description_html(milestone, APP_URL, prints=PRINTS) == expected["html"]


@pytest.mark.parametrize("case", REFERENCE["calendarCases"])
def test_actual_source_feed_calendar_contents(case):
    output = build_calendar(case["milestones"], APP_URL,
        calendar_email="synthetic-calendar@example.invalid", prints=PRINTS,
        work_order_id=case["query"].get("workOrderId"), local_timezone=REFERENCE_TIMEZONE)
    assert normalize(output) == normalize(case["expected"])
    assert all(len(line.encode("utf-8")) <= 75 for line in output.split("\r\n"))


@pytest.mark.parametrize("case", REFERENCE["calendarEventCases"])
def test_actual_source_single_event_dst_unicode_escaping(case):
    output = build_calendar([case["milestone"]], APP_URL,
        calendar_email="synthetic-calendar@example.invalid", prints=PRINTS,
        work_order_id=case["milestone"]["workOrderId"], local_timezone=REFERENCE_TIMEZONE)
    assert normalize(output) == normalize(case["expected"])
    assert all(len(line.encode("utf-8")) <= 75 for line in output.split("\r\n"))


def test_calendar_utc_host_dates_no_prints_and_new_uid_each_request():
    milestone = REFERENCE["calendarEventCases"][0]["milestone"]
    first = build_calendar([milestone], APP_URL, prints=(), local_timezone=timezone.utc)
    second = build_calendar([milestone], APP_URL, prints=(), local_timezone=timezone.utc)
    assert "DTSTART;VALUE=DATE:20261020" in first
    assert "Prints" not in first
    assert "DTEND" not in first
    assert first != second and normalize(first) == normalize(second)


def test_calendar_preserves_utf16_entity_and_parameter_escape_rules():
    assert escape_html("A & 🙂 é\n") == "A &#38; &#55357;&#56898; &#233;&#10;"
    assert escape_html("K ſ") == "&#8490; &#383;"
    milestone = {**REFERENCE["calendarEventCases"][0]["milestone"],
        "recordCreate_username": 'Synthetic ^"\nName', "workOrderContracts": []}
    value = normalize(build_calendar([milestone], APP_URL, prints=()))
    assert 'ORGANIZER;CN="Synthetic ^^^\'^nName"' in value
    assert value.count("BEGIN:VEVENT") == 1


def test_calendar_missing_organizer_fails_like_locked_package():
    milestone = {**REFERENCE["calendarEventCases"][0]["milestone"], "recordCreate_username": ""}
    with pytest.raises(ValueError, match="organizer"):
        build_calendar([milestone], APP_URL)
