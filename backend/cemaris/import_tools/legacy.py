"""Record processors from temp/legacyImportFromCsv, fixed 451ce034 (MIT).

Gateway calls retain the original form payloads and order. Persistence reuses
the already compared Cemaris database helpers; the reference probe injects
the identical boundary in the original JavaScript processor bodies.
"""

from __future__ import annotations

from datetime import date
import json
from pathlib import Path

from cemaris.db.semantics import js_number


DATA = json.loads(Path(__file__).with_name("legacy-data.json").read_text(encoding="utf-8"))
CREMATION_KEYS = frozenset(["", "00", "`", "N", "R"])
FEE_SUFFIXES = ("GRAV_SD", "GRAV_DD", "CHAP_SD", "CHAP_DD", "ENTOMBMENT", "CREM", "NICHE", "DISINTERMENT")


def format_date(year, month, day):
    year = ("0000" + year)[-4:]
    year = {"3014": "2014", "2202": "2022"}.get(year, year)
    return year + "-" + ("00" + month)[-2:] + "-" + ("00" + day)[-2:]


def format_time(hour, minute):
    return ("00" + hour)[-2:] + ":" + ("00" + minute)[-2:]


def format_contract_number(value):
    return "UNIX-" + value.strip() if value.strip() else None


def death_age_period(value):
    return {"dys": "Days", "mts": "Months", "yrs": "Years"}.get(value.lower(), value)


def burial_site_type(key):
    return {"": "Crematorium", "00": "Crematorium", "GC": "Columbarium", "HC": "Columbarium",
            "MA": "Mausoleum", "MN": "Niche Wall", "NW": "Niche Wall", "UG": "Urn Garden"}.get(key, "In-Ground Grave")


def segments(row, prefix):
    def part(key):
        value = row[prefix + key]
        return "" if value == "0" else value
    return {"burialSiteNameSegment1": part("BLOCK"), "burialSiteNameSegment2": part("RANGE1") + part("RANGE2"),
            "burialSiteNameSegment3": part("LOT1") + part("LOT2"),
            "burialSiteNameSegment4": part("GRAVE1") + part("GRAVE2") or "1"}


def _date(row, prefix, label):
    return format_date(*(row[prefix + label + key] for key in ("YR", "MON", "DAY")))


def _comments(gateway, row, prefix, identifier, when, label=None, *, midnight=True):
    for number in (1, 2):
        if row[prefix + "REMARK" + str(number)] != "":
            form = dict(contractId=identifier, comment=row[prefix + "REMARK" + str(number)], commentDateString=when)
            if midnight:
                form["commentTimeString"] = "00:00"
            gateway.call("addContractComment", form)
    if label and row[prefix + "WORK_ORDER"].strip():
        gateway.call("addContractComment", dict(contractId=identifier, comment=label + row[prefix + "WORK_ORDER"],
                     commentDateString=when, commentTimeString="00:00"))


def _service(gateway, identifier, name):
    gateway.call("addContractServiceType", dict(contractId=identifier, serviceTypeId=gateway.id("ServiceTypes", name)))


def _interment(gateway, row, prefix, *, cremation, master=False):
    container = row[prefix + "CONTAINER_TYPE"] or ("U" if cremation else "")
    committal = "" if cremation and not master else row[prefix + "COMMITTAL_TYPE"]
    return dict(funeralHomeId=gateway.key("FuneralHomes", row[prefix + "FUNERAL_HOME"]),
                committalTypeId=gateway.key("CommittalTypes", committal),
                intermentContainerTypeId=gateway.key("IntermentContainerTypes", container),
                intermentDepthId=gateway.key("IntermentDepths", row[prefix + "DEPTH"]))


def _empty_purchaser():
    return {key: "" for key in ("purchaserName", "purchaserAddress1", "purchaserAddress2", "purchaserCity",
            "purchaserPostalCode", "purchaserProvince", "purchaserEmail", "purchaserPhoneNumber", "purchaserRelationship")}


def import_master(gateway, rows):
    for row in rows:
        cemetery = gateway.cemetery(row["CM_CEMETERY"])
        site = gateway.site(row, "CM_", "Available", cemetery=cemetery)
        site_id = site["burialSiteId"] if site else ""
        preneed_id = None
        postal = (row["CM_POST1"] + " " + row["CM_POST2"]).strip()
        common = dict(burialSiteId=site_id, contractTypeFieldIds="", funeralDirectorName="",
                      purchaserAddress1=row["CM_ADDRESS"], purchaserAddress2="", purchaserCity=row["CM_CITY"],
                      purchaserPostalCode=postal, purchaserProvince=row["CM_PROV"], purchaserEmail="", purchaserPhoneNumber="",
                      deceasedAddress1=row["CM_ADDRESS"], deceasedAddress2="", deceasedCity=row["CM_CITY"],
                      deceasedPostalCode=postal, deceasedProvince=row["CM_PROV"])
        number = format_contract_number(row["CM_WORK_ORDER"])
        if number is not None:
            common["contractNumber"] = number
        if row["CM_PRENEED_OWNER"] != "" or row["CM_STATUS"] == "P":
            start = _date(row, "CM_", "PURCHASE_")
            end = "" if row["CM_INTERMENT_YR"] in ("", "0") else _date(row, "CM_", "INTERMENT_")
            if start == "0000-00-00" and end != "":
                start = end
            if start == "0000-00-00" and row["CM_DEATH_YR"] not in ("", "0"):
                start = _date(row, "CM_", "DEATH_")
                if end in ("", "0000-00-00"):
                    end = start
            if start == "0000-00-00":
                start = "0001-01-01"
            name = row["CM_DECEASED_NAME"] or row["CM_PRENEED_OWNER"]
            preneed_id = gateway.call("addContract", dict(common, contractStartDateString=start, contractEndDateString=end,
                   contractTypeId=gateway.id("ContractTypes", "Preneed"), purchaserName=row["CM_PRENEED_OWNER"],
                   purchaserRelationship="Self" if row["CM_PRENEED_OWNER"] == name else "", deceasedName=name))
            if site:
                _service(gateway, preneed_id, "Interment" if burial_site_type(row["CM_CEMETERY"]) == "In-Ground Grave" else "Entombment")
            if row["CM_CREMATION"] == "Y":
                _service(gateway, preneed_id, "Cremation")
            _comments(gateway, row, "CM_", preneed_id, start, "Imported Contract #")
            if end == "":
                gateway.status(site_id, "Reserved")
        if row["CM_DECEASED_NAME"] != "":
            start = _date(row, "CM_", "INTERMENT_")
            if start == "0000-00-00" and row["CM_DEATH_YR"] not in ("", "0"):
                start = _date(row, "CM_", "DEATH_")
            if start == "0000-00-00":
                start = "0001-01-01"
            purchaser = row["CM_PRENEED_OWNER"] or row["CM_DECEASED_NAME"]
            form = dict(common, **_interment(gateway, row, "CM_", cremation=row["CM_CREMATION"] == "Y", master=True),
                        contractStartDateString=start, contractEndDateString="" if site_id else start,
                        contractTypeId=gateway.id("ContractTypes", "At Need"), funeralDirectorName=row["CM_FUNERAL_HOME"],
                        purchaserName=purchaser, purchaserRelationship="Self" if purchaser == row["CM_DECEASED_NAME"] else "",
                        deceasedName=row["CM_DECEASED_NAME"], birthYear="", birthMonth="", birthDay="", birthPlace="",
                        deathAge=row["CM_AGE"], deathAgePeriod=death_age_period(row["CM_PERIOD"]),
                        deathYear="" if row["CM_DEATH_YR"] in ("", "0") else row["CM_DEATH_YR"],
                        deathMonth=row["CM_DEATH_MON"], deathDay=row["CM_DEATH_DAY"], deathPlace="",
                        funeralDateString="" if row["CM_FUNERAL_YR"] in ("", "0") else _date(row, "CM_", "FUNERAL_"))
            identifier = gateway.call("addContract", form)
            if preneed_id is not None:
                gateway.call("addRelatedContract", dict(contractId=preneed_id, relatedContractId=identifier))
            if site:
                _service(gateway, identifier, "Interment" if burial_site_type(row["CM_CEMETERY"]) == "In-Ground Grave" else "Entombment")
            if row["CM_CREMATION"] == "Y":
                _service(gateway, identifier, "Cremation")
            _comments(gateway, row, "CM_", identifier, start, "Imported Work Order #")
            gateway.status(site_id, "Occupied")


def import_prepaid(gateway, rows):
    for row in rows:
        if row["CMPP_PREPAID_FOR_NAME"] == "":
            continue
        row = dict(row)
        if row["CMPP_CEMETERY"] == ".m":
            row["CMPP_CEMETERY"] = "HC"
        site = gateway.site(row, "CMPP_", "Reserved", svg=True)
        if site and site["burialSiteStatusId"] == gateway.id("BurialSiteStatuses", "Available"):
            gateway.status(site["burialSiteId"], "Reserved")
        start = _date(row, "CMPP_", "PURCH_")
        identifier = gateway.find_preneed(site, start, row["CMPP_PREPAID_FOR_NAME"]) if site else None
        if not identifier:
            form = dict(_empty_purchaser(), burialSiteId=site["burialSiteId"] if site else "",
                        contractTypeId=gateway.id("ContractTypes", "Preneed"), contractEndDateString="", contractStartDateString=start,
                        funeralDirectorName="", purchaserName=row["CMPP_ARRANGED_BY_NAME"],
                        purchaserRelationship="Self" if row["CMPP_ARRANGED_BY_NAME"] == row["CMPP_PREPAID_FOR_NAME"] else "",
                        deceasedName=row["CMPP_PREPAID_FOR_NAME"], deceasedAddress1=row["CMPP_ADDRESS"], deceasedAddress2="",
                        deceasedCity=row["CMPP_CITY"], deceasedPostalCode=row["CMPP_POSTAL1"] + " " + row["CMPP_POSTAL2"],
                        deceasedProvince=row["CMPP_PROV"][:2])
            number = format_contract_number(row["CMPP_ORDER_NO"])
            if number is not None:
                form["contractNumber"] = number
            identifier = gateway.call("addContract", form)
        if row["CMPP_FEE_GRAV_SD"] != "0.0" or row["CMPP_FEE_GRAV_DD"] != "0.0":
            _service(gateway, identifier, "Interment")
        for suffix, name in (("ENTOMBMENT", "Entombment"), ("CREM", "Cremation"), ("NICHE", "Niche"), ("DISINTERMENT", "Disinterment")):
            value = row["CMPP_FEE_" + suffix]
            if value != "0.0" and not (suffix == "DISINTERMENT" and value == "20202.02"):
                _service(gateway, identifier, name)
        amount = 0.0
        for suffix in FEE_SUFFIXES:
            fee, tax = row["CMPP_FEE_" + suffix], row["CMPP_GST_" + suffix]
            if fee != "0.0" and not (suffix == "DISINTERMENT" and fee == "20202.02"):
                gateway.call("addContractFee", dict(contractId=identifier, feeId=gateway.fee("CMPP_FEE_" + suffix),
                             quantity=1, feeAmount=fee, taxAmount=tax))
            amount += js_number(fee) if not (suffix == "DISINTERMENT" and fee == "20202.02") else 0
            amount += js_number(tax) if not (suffix == "DISINTERMENT" and tax == "20202.02") else 0
        gateway.call("addContractTransaction", dict(contractId=identifier, externalReceiptNumber="", transactionAmount=amount,
                     transactionDateString=start, transactionTimeString="00:00", transactionNote="Order Number: " + row["CMPP_ORDER_NO"]))
        _comments(gateway, row, "CMPP_", identifier, start, midnight=False)


def import_work_orders(gateway, rows, *, current_date=None):
    today = (current_date or date.today()).isoformat()
    for row in rows:
        number = ("000000" + row["WO_WORK_ORDER"])[-6:]
        order = gateway.work_order(number)
        raw_start = str(int(float(row["WO_INITIATION_DATE"] or 0))).rjust(8, "0")
        start = raw_start[:-4] + "-" + raw_start[-4:-2] + "-" + raw_start[-2:]
        if order:
            if order.get("workOrderCloseDate"):
                gateway.call("reopenWorkOrder", order["workOrderId"])
                order.pop("workOrderCloseDate", None)
        else:
            identifier = gateway.call("addWorkOrder", dict(workOrderDescription=" ".join(row["WO_REMARK" + str(i)] for i in (1, 2, 3)).strip(),
                         workOrderNumber=number, workOrderOpenDateString=start,
                         workOrderTypeId=gateway.id("WorkOrderTypes", "Interment") or 1,
                         workOrderStatusId=gateway.id("WorkOrderStatuses", "Entered") or 1))
            order = gateway.work_order(identifier, by_id=True)
        order_id = order["workOrderId"]
        site = gateway.site(row, "WO_", "Occupied", svg=True, update_existing=True)
        if site and not any(link["burialSiteId"] == site["burialSiteId"] for link in order.get("workOrderBurialSites", [])):
            gateway.call("addWorkOrderBurialSite", dict(burialSiteId=site["burialSiteId"], workOrderId=order_id))
        contract_start = _date(row, "WO_", "INTERMENT_") if row["WO_INTERMENT_YR"] else start
        hour = int(float(row["WO_FUNERAL_HR"] or 0))
        if hour <= 6:
            hour += 12
        form = dict(_empty_purchaser(), **_interment(gateway, row, "WO_", cremation=site is None),
                    burialSiteId=site["burialSiteId"] if site else "", contractTypeId=gateway.id("ContractTypes", "At Need"),
                    contractEndDateString="", contractStartDateString=contract_start, contractTypeFieldIds="",
                    funeralDirectorName=row["WO_FUNERAL_HOME"],
                    funeralDateString=_date(row, "WO_", "FUNERAL_") if row["WO_FUNERAL_YR"] != "" else "",
                    funeralTimeString=format_time(str(hour), row["WO_FUNERAL_MIN"]) if row["WO_FUNERAL_YR"] != "" else "",
                    deceasedName=row["WO_DECEASED_NAME"], deceasedAddress1=row["WO_ADDRESS"], deceasedAddress2="", deceasedCity=row["WO_CITY"],
                    deceasedPostalCode=row["WO_POST1"] + " " + row["WO_POST2"], deceasedProvince=row["WO_PROV"][:2],
                    deathAge=row["WO_AGE"], deathAgePeriod=death_age_period(row["WO_PERIOD"]), deathYear=row["WO_DEATH_YR"],
                    deathMonth=row["WO_DEATH_MON"], deathDay=row["WO_DEATH_DAY"], deathPlace=row["WO_DEATH_PLACE"])
        number = format_contract_number(row["WO_WORK_ORDER"])
        if number is not None:
            form["contractNumber"] = number
        identifier = gateway.call("addContract", form)
        if row["WO_INTERMENT_YR"] != "":
            _service(gateway, identifier, "Interment" if burial_site_type(row["WO_CEMETERY"]) == "In-Ground Grave" else "Entombment")
        if row["WO_CREMATION"] == "Y":
            _service(gateway, identifier, "Cremation")
        gateway.call("addWorkOrderContract", dict(contractId=identifier, workOrderId=order_id))
        incomplete = not row["WO_CONFIRMATION_IN"]
        maximum = start

        def milestone(name, when, description="", scheduled_time=None, completion_time="00:00", completed=None):
            type_id = gateway.id("WorkOrderMilestoneTypes", name)
            if not type_id:
                return
            completed = when < today if completed is None else completed
            form = dict(workOrderId=order_id, workOrderMilestoneDateString=when, workOrderMilestoneDescription=description,
                        workOrderMilestoneTypeId=type_id)
            if completed:
                form.update(workOrderMilestoneCompletionDateString=when, workOrderMilestoneCompletionTimeString=completion_time)
            if scheduled_time is not None:
                form["workOrderMilestoneTimeString"] = scheduled_time
            gateway.call("addWorkOrderMilestone", form)

        milestone("Acknowledged", start, completed=bool(row["WO_CONFIRMATION_IN"]))
        for label, name, description in (("DEATH_", "Death", "Death Place: " + row["WO_DEATH_PLACE"]),
                                         ("FUNERAL_", "Funeral", "Funeral Home: " + row["WO_FUNERAL_HOME"])):
            if row["WO_" + label + "YR"]:
                when = _date(row, "WO_", label)
                time = format_time(str(hour), row["WO_FUNERAL_MIN"] or "0") if label == "FUNERAL_" else None
                milestone(name, when, description, scheduled_time=time, completion_time=time or "00:00")
                maximum = max(maximum, when)
                incomplete = incomplete or when >= today
        if row["WO_CREMATION"] == "Y":
            milestone("Cremation", maximum)
        if row["WO_INTERMENT_YR"]:
            when = _date(row, "WO_", "INTERMENT_")
            milestone("Interment", when, "Depth: " + row["WO_DEPTH"], completion_time="23:59")
            maximum = max(maximum, when)
            incomplete = incomplete or when >= today
        if not incomplete:
            gateway.call("closeWorkOrder", dict(workOrderId=order_id, workOrderCloseDateString=maximum))
