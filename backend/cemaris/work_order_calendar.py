"""Sunrise milestoneICS.ts and ical-generator 11.1.2 behaviour in Python.

Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
Calendar serialization derived from ical-generator, (c) 2026 Sebastian Pekarek.
MIT notices: licenses/Sunrise-LICENSE.md and ical-generator-LICENSE.txt.
Source commit: 451ce034863b16502484367044f3e9b65370111a.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import re
from uuid import uuid4

from cemaris.db.semantics import _JS_WHITESPACE


DEFAULT_PRINTS = (
    ("pdf/workOrder", "Work Order Field Sheet"),
    ("pdf/workOrder-commentLog", "Work Order Field Sheet - Comment Log"),
)


def escape_html(value):
    # The original regex has no Unicode flag: non-BMP characters are escaped
    # as their two UTF-16 units, rather than as a single numeric HTML entity.
    raw = str(value).encode("utf-16-le", errors="surrogatepass")
    result = []
    for index in range(0, len(raw), 2):
        code = int.from_bytes(raw[index:index + 2], "little")
        char = chr(code)
        result.append(char if char == " " or "0" <= char <= "9" or "a" <= char <= "z" or "A" <= char <= "Z" else f"&#{code};")
    return "".join(result)


def event_summary(milestone):
    type_id = milestone.get("workOrderMilestoneTypeId")
    title = milestone.get("workOrderMilestoneDescription", "") if type_id is None or type_id == -1 else milestone.get("workOrderMilestoneType") or ""
    summary = ("✔ " if milestone.get("workOrderMilestoneCompletionDate") else "") + title.strip(_JS_WHITESPACE)
    names = [person["deceasedName"] for contract in milestone.get("workOrderContracts") or []
             for person in contract.get("contractInterments") or []]
    if names:
        summary += (": " if summary else "") + names[0]
    if len(names) > 1:
        summary += f" plus {len(names) - 1}"
    return summary


def event_categories(milestone):
    categories = [milestone.get("workOrderMilestoneType") or "", milestone.get("workOrderType") or ""] if milestone.get("workOrderMilestoneTypeId") else []
    if milestone.get("workOrderMilestoneCompletionDate"):
        categories.append("Completed")
    return categories


def event_location(milestone):
    return ", ".join(f"{site.get('cemeteryName') or ''}: {site['burialSiteName']}"
                     for site in milestone.get("workOrderBurialSites") or [])


def _work_order_url(app_url, identifier=None):
    return f"{app_url}/workOrders/{'undefined' if identifier is None else identifier}"


def event_description_html(milestone, app_url, *, prints=DEFAULT_PRINTS):
    identifier = milestone.get("workOrderId")
    url = _work_order_url(app_url, identifier)
    html = f"""
    <h1>Milestone Description</h1>
    <p>{escape_html(milestone.get('workOrderMilestoneDescription', ''))}</p>
    <h2>Work Order #{milestone.get('workOrderNumber') or ''}</h2>
    <p>{escape_html(milestone.get('workOrderDescription') or '')}</p>
    <p>{url}</p>
  """
    contracts = milestone.get("workOrderContracts") or []
    if contracts:
        html += """
      <h2>
        Related Contracts
      </h2>
      <table border="1">
        <thead>
          <tr>
            <th>Contract Type</th>
            <th>Burial Site</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Interments</th>
          </tr>
        </thead>
        <tbody>
    """
        for contract in contracts:
            site = escape_html(contract['burialSiteName']) if contract.get('burialSiteName') else '(Not Set)'
            end = contract.get('contractEndDateString', '') if contract.get('contractEndDate') else '(No End Date)'
            html += f"""
        <tr>
          <td>
            <a href="{app_url}/contracts/{contract['contractId']}">
              {escape_html(contract['contractType'])}
            </a>
          </td>
          <td>
            {site}
          </td>
          <td>
            {contract.get('contractStartDateString', '')}
          </td>
          <td>
            {end}
          </td>
          <td>
      """
            for person in contract.get("contractInterments") or []:
                html += escape_html(person["deceasedName"]) + "<br />"
            html += "</td></tr>"
        html += "</tbody></table>"
    sites = milestone.get("workOrderBurialSites") or []
    if sites:
        html += """
      <h2>
        Related Burial Sites
      </h2>
      <table border="1">
        <thead>
          <tr>
            <th>Burial Site</th>
            <th>Cemetery</th>
            <th>Burial Site Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    """
        for site in sites:
            html += f"""
        <tr>
          <td>
            <a href="{app_url}/burialSites/{site['burialSiteId']}">
              {escape_html(site['burialSiteName'])}
            </a>
          </td>
          <td>{escape_html(site.get('cemeteryName') or '')}</td>
          <td>{escape_html(site.get('burialSiteType') or '')}</td>
          <td>{escape_html(site.get('burialSiteStatus') or '')}</td>
        </tr>
      """
        html += "</tbody></table>"
    if prints:
        html += "<h2>Prints</h2>"
        for path, title in prints:
            html += f"""
          <p>
            {escape_html(title)}<br />
            {app_url}/print/{path}/?workOrderId={identifier}
          </p>
        """
    return html


def _escape(value):
    return re.sub(r"\r\n|\r|\n", r"\\n", re.sub(r"[\\;,]", lambda match: "\\" + match[0], str(value)))


def _parameter(value):
    return re.sub(r"\r\n|\r|\n", "^n", str(value).replace("^", "^^").replace('"', "^'"))


def _fold(line):
    # ical-generator uses 74 UTF-8 bytes of data per chunk; continuation
    # whitespace is additional. This also preserves its observable folding.
    output, chunk, size = [], "", 0
    for char in line:
        length = len(char.encode("utf-8"))
        if size + length > 74:
            output.append(chunk)
            chunk, size = "", 0
        chunk += char
        size += length
    output.append(chunk)
    return "\r\n ".join(output)


def _utc(value):
    value = value.astimezone(timezone.utc)
    return f"{value.year:04d}{value.month:02d}{value.day:02d}T{value.hour:02d}{value.minute:02d}{value.second:02d}Z"


def _from_millis(value):
    return datetime.fromtimestamp((value or 0) / 1000, timezone.utc)


def _event_dates(milestone, local_timezone=None):
    date_string = milestone.get("workOrderMilestoneDateString")
    if not date_string:
        number = int(milestone["workOrderMilestoneDate"])
        date_string = f"{number // 10000:04d}-{number // 100 % 100:02d}-{number % 100:02d}"
    time_string = milestone.get("workOrderMilestoneTimeString")
    if not time_string:
        number = int(milestone.get("workOrderMilestoneTime") or 0)
        time_string = f"{number // 100:02d}:{number % 100:02d}"
    pieces = [int(piece or 0) for piece in re.split(r"[ :\-]", date_string + " " + time_string)]
    year, month, day, hour, minute = pieces[:5]
    if 0 <= year <= 99:
        year += 1900
    year_delta, month = divmod(month - 1, 12)
    naive = datetime(year + year_delta, month + 1, 1) + timedelta(days=day - 1, hours=hour, minutes=minute)

    def localize(value):
        # Local naive conversion uses OS historical DST rules, just as JS Date.
        if local_timezone is None:
            return value.astimezone()
        aware = value.replace(tzinfo=local_timezone)
        return datetime.fromtimestamp(aware.timestamp(), local_timezone)

    start = localize(naive)
    # JS setHours changes the local clock and resolves a DST gap/fold again.
    end = localize(start.replace(tzinfo=None) + timedelta(hours=1))
    return start, end


def build_calendar(milestones, app_url, *, calendar_email="no-reply@127.0.0.1",
                   work_order_id=None, prints=DEFAULT_PRINTS, local_timezone=None):
    """Serialize the actual milestone list; filtering/authorization stay in SQL/API.

    UID is random on every export like the source. The source's UTC-date
    conversion for all-day events and /workOrders/undefined calendar URL are
    deliberately retained and covered by actual Node comparison fixtures.
    """
    app_url = app_url.rstrip("/")
    name, identifier = "Work Order Milestone Calendar", None
    if work_order_id and milestones:
        name = f"Work Order #{milestones[0].get('workOrderNumber') or ''}"
        identifier = milestones[0].get("workOrderId")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//cityssm.github.io//Cemaris//EN",
             "URL:" + _work_order_url(app_url, identifier), "NAME:" + name, "X-WR-CALNAME:" + name]
    for milestone in milestones:
        start, end = _event_dates(milestone, local_timezone)
        created = _from_millis(milestone.get("recordCreate_timeMillis"))
        modified = _from_millis(max(milestone.get("recordUpdate_timeMillis") or 0,
                                    milestone.get("workOrderRecordUpdate_timeMillis") or 0))
        url = _work_order_url(app_url, milestone.get("workOrderId"))
        lines += ["BEGIN:VEVENT", "UID:" + str(uuid4()), "SEQUENCE:0", "DTSTAMP:" + _utc(created)]
        if milestone.get("workOrderMilestoneTime") is None:
            # Original package formats the local-midnight Date as a UTC date.
            lines += ["DTSTART;VALUE=DATE:" + _utc(start)[:8],
                      "X-MICROSOFT-CDO-ALLDAYEVENT:TRUE", "X-MICROSOFT-MSNCALENDAR-ALLDAYEVENT:TRUE"]
        else:
            lines += ["DTSTART:" + _utc(start), "DTEND:" + _utc(end)]
        lines.append("SUMMARY:" + _escape(event_summary(milestone)))
        location = event_location(milestone)
        if location:
            lines.append("LOCATION:" + _escape(location))
        lines += ["DESCRIPTION:" + _escape(url), "X-ALT-DESC;FMTTYPE=text/html:" + _escape(event_description_html(milestone, app_url, prints=prints))]
        contracts = milestone.get("workOrderContracts") or []
        names = [person["deceasedName"] for contract in contracts for person in contract.get("contractInterments") or []]
        if not contracts:
            names = [milestone.get("recordCreate_username") or ""]
        if names and (not names[0] or not calendar_email):
            raise ValueError("Calendar organizer name and email must not be empty")
        if names:
            lines.append(f'ORGANIZER;CN="{_parameter(names[0])}":mailto:{_escape(calendar_email)}')
            for person in names[1:]:
                common_name = f';CN="{_parameter(person)}"' if person else ""
                lines.append(f"ATTENDEE;ROLE=REQ-PARTICIPANT{common_name}:MAILTO:{_escape(calendar_email)}")
        categories = event_categories(milestone)
        if categories:
            lines.append("CATEGORIES:" + ",".join(_escape(category) for category in categories))
        lines.append("URL;VALUE=URI:" + _escape(url))
        if milestone.get("workOrderMilestoneCompletionDate"):
            lines.append("STATUS:CONFIRMED")
        lines += ["CREATED:" + _utc(created), "LAST-MODIFIED:" + _utc(modified), "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(_fold(line) for line in lines)
