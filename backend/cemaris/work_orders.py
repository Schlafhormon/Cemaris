"""Work orders derived from Sunrise CMS (MIT), fixed source 451ce034.

Sources: routes/workOrders.ts, database/*WorkOrder*.ts and related handlers.
See licenses/Sunrise-LICENSE.md. Document rendering belongs to step 11.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
import json
import math
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.exc import DataError, IntegrityError

from cemaris.burial_sites import (_date_string, _date_string_to_integer, _time_string, _time_period_string,
    _time_string_to_integer, _validate_values, search_burial_sites, update_burial_site_status)
from cemaris.catalogs import _catalog_error, _json_value, get_catalog_records
from cemaris.contract_items import _integer as _stored_integer
from cemaris.contracts import _null_first, get_contracts
from cemaris.db.schema import TABLES
from cemaris.db.semantics import (_js_number_string, burial_site_name_predicates, contains_name_predicates,
    date_to_integer, js_number, sanitize_limit, sanitize_offset)
from cemaris.preferences import get_setting_value, now_millis, transaction


class WorkOrderOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    work_order_number_length: int = 6
    work_order_calendar_email_address: str = "no-reply@127.0.0.1"
    work_order_calendar_prints: list[tuple[str, str]] = Field(default_factory=lambda: [
        ("pdf/workOrder", "Arbeitsauftrag"), ("pdf/workOrder-commentLog", "Arbeitsauftrag – Kommentarprotokoll")])


class WorkOrderParentNotFound(ValueError):
    """An active parent must exist before editing its historical child data."""


def _integer(value, *, required=False):
    if isinstance(value, bool):
        raise ValueError("An integer identifier is required")
    return _stored_integer(value, required=required)


def _today(value=None):
    return date_to_integer(date.today() if value is None else value) if value is None or isinstance(value, date) else value


def _raw(connection, table_name, identifier, *, parent=None, active=False):
    table = TABLES[table_name]
    key = {"WorkOrders": "workOrderId", "WorkOrderComments": "workOrderCommentId", "WorkOrderMilestones": "workOrderMilestoneId"}[table_name]
    where = [table.c[key] == _integer(identifier, required=True)]
    if parent is not None:
        where.append(table.c.workOrderId == _integer(parent, required=True))
    if active:
        where.append(table.c.recordDelete_timeMillis.is_(None))
    row = connection.execute(sa.select(table).where(*where)).mappings().first()
    return dict(row) if row is not None else None


def _active_parent(connection, identifier):
    identifier = _integer(identifier, required=True)
    if _raw(connection, "WorkOrders", identifier, active=True) is None:
        raise WorkOrderParentNotFound("Work order not found")
    return identifier


def _audit(connection, identifier, actor, kind, before, after, table_name="WorkOrders", record_index=None):
    from cemaris.cemeteries import _differences
    changes = [("*", kind, before, after)] if kind != "updated" else _differences(before, after)
    now = datetime.now().astimezone()
    for field, update_type, old, new in changes:
        if field in {"recordCreate_username", "recordCreate_timeMillis", "recordUpdate_timeMillis"}:
            continue
        connection.execute(TABLES["AuditLog"].insert().values(logMillis=now_millis(), logDate=date_to_integer(now.date()),
            logTime=now.hour * 100 + now.minute, mainRecordType="workOrder", mainRecordId=str(identifier), updateTable=table_name,
            recordIndex=None if record_index is None else str(record_index), updateField=field, updateType=update_type, updateUsername=actor,
            fromValue=None if old is None else json.dumps(_json_value(old), ensure_ascii=False, separators=(",", ":")),
            toValue=None if new is None else json.dumps(_json_value(new), ensure_ascii=False, separators=(",", ":"))))


def get_next_work_order_number(database, *, options=None, current_date=None):
    options = options or WorkOrderOptions()
    year = str(_today(current_date) // 10000)
    with transaction(database) as connection:
        rows = connection.scalars(sa.select(TABLES["WorkOrders"].c.workOrderNumber).order_by(TABLES["WorkOrders"].c.workOrderId))
        matches = [value for value in rows if re.fullmatch(r"[0-9]{4}-[0-9]+", value) and value.startswith(year + "-")]
        previous = max(matches, key=lambda value: min(int(value.split("-", 1)[1]), 2**63 - 1)) if matches else None
        index = float(previous.split("-", 1)[1]) + 1.0 if previous else 1.0
        return year + "-" + _js_number_string(index).rjust(max(0, options.work_order_number_length), "0")


def _text(value, label, *, nullable=False):
    if nullable and value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(label + " must be text")
    return value


def work_order_values(form, *, adding=False, current_date=None):
    values = {key: _integer(form[key], required=True) for key in ("workOrderTypeId", "workOrderStatusId")}
    values["workOrderDescription"] = _text(form["workOrderDescription"], "Description", nullable=True)
    values["workOrderOpenDate"] = (_today(current_date) if adding and form.get("workOrderOpenDateString") in (None, "")
        else _date_string_to_integer(form["workOrderOpenDateString"]))
    if adding:
        values["workOrderCloseDate"] = None if form.get("workOrderCloseDateString") in (None, "") else _date_string_to_integer(form["workOrderCloseDateString"])
    else:
        values["workOrderNumber"] = _text(form["workOrderNumber"], "Work order number")
    _validate_values(TABLES["WorkOrders"], values)
    return values


def add_work_order(database, form, actor, *, options=None, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        values = work_order_values(form, adding=True, current_date=current_date)
        supplied_number = form.get("workOrderNumber")
        values["workOrderNumber"] = (get_next_work_order_number(connection, options=options, current_date=current_date)
            if supplied_number in (None, "") else _text(supplied_number, "Work order number"))
        _validate_values(TABLES["WorkOrders"], values)
        now = now_millis()
        identifier = connection.execute(TABLES["WorkOrders"].insert().values(**values, recordCreate_username=actor,
            recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now)).inserted_primary_key[0]
        if form.get("contractId") not in (None, ""):
            mutate_work_order_relation(connection, "add", {"workOrderId": identifier, "contractId": form["contractId"]}, actor,
                kind="contract", audit_enabled=audit_enabled)
        for milestone_type in get_catalog_records(connection, "workOrderMilestoneTypes"):
            suffix = str(milestone_type["workOrderMilestoneTypeId"])
            if form.get("workOrderMilestoneId_" + suffix) not in (None, ""):
                add_work_order_milestone(connection, {"workOrderId": identifier,
                    "workOrderMilestoneTypeId": form["workOrderMilestoneId_" + suffix],
                    **{key: form.get(key + "_" + suffix) or "" for key in ("workOrderMilestoneDateString", "workOrderMilestoneTimeString", "workOrderMilestoneDescription")}},
                    actor, audit_enabled=audit_enabled, current_date=current_date)
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _raw(connection, "WorkOrders", identifier))
        return identifier


def update_work_order(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _integer(form["workOrderId"], required=True)
        before = _raw(connection, "WorkOrders", identifier, active=True)
        if before is None:
            return False
        values = work_order_values(form)
        connection.execute(TABLES["WorkOrders"].update().where(TABLES["WorkOrders"].c.workOrderId == identifier).values(
            **values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "WorkOrders", identifier))
        return True


def close_work_order(database, form, actor, *, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        identifier = _integer(form["workOrderId"], required=True)
        before = _raw(connection, "WorkOrders", identifier)
        if before is None:
            return False
        close_date = _date_string_to_integer(form["workOrderCloseDateString"]) if form.get("workOrderCloseDateString") else _today(current_date)
        connection.execute(TABLES["WorkOrders"].update().where(TABLES["WorkOrders"].c.workOrderId == identifier).values(
            workOrderCloseDate=close_date, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "WorkOrders", identifier))
        return True


def reopen_work_order(database, identifier, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _integer(identifier, required=True)
        before = _raw(connection, "WorkOrders", identifier)
        result = connection.execute(TABLES["WorkOrders"].update().where(TABLES["WorkOrders"].c.workOrderId == identifier,
            TABLES["WorkOrders"].c.workOrderCloseDate.is_not(None)).values(workOrderCloseDate=None,
                recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "updated", before, _raw(connection, "WorkOrders", identifier))
        return bool(result.rowcount)


def delete_work_order(database, identifier, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _integer(identifier, required=True)
        before = _raw(connection, "WorkOrders", identifier, active=True)
        now = now_millis()
        table = TABLES["WorkOrders"]
        result = connection.execute(table.update().where(table.c.workOrderId == identifier, table.c.recordDelete_timeMillis.is_(None)).values(
            recordDelete_username=actor, recordDelete_timeMillis=now))
        for name in ("WorkOrderMilestones", "WorkOrderBurialSites", "WorkOrderContracts", "WorkOrderComments"):
            child = TABLES[name]
            connection.execute(child.update().where(child.c.workOrderId == identifier, child.c.recordDelete_timeMillis.is_(None)).values(
                recordDelete_username=actor, recordDelete_timeMillis=now))
        if audit_enabled and result.rowcount:
            _audit(connection, identifier, actor, "deleted", before, None)
        return bool(result.rowcount)


def milestone_values(form, *, adding=False, current_date=None):
    values = {"workOrderMilestoneTypeId": _integer(form["workOrderMilestoneTypeId"]),
        "workOrderMilestoneDescription": _text(form["workOrderMilestoneDescription"], "Milestone description"),
        "workOrderMilestoneDate": (_today(current_date) if adding else 0) if form["workOrderMilestoneDateString"] == "" else _date_string_to_integer(form["workOrderMilestoneDateString"]),
        "workOrderMilestoneTime": None if form.get("workOrderMilestoneTimeString") in (None, "") else _time_string_to_integer(form["workOrderMilestoneTimeString"])}
    if adding:
        values.update(workOrderMilestoneCompletionDate=None if form.get("workOrderMilestoneCompletionDateString") in (None, "") else _date_string_to_integer(form["workOrderMilestoneCompletionDateString"]),
            workOrderMilestoneCompletionTime=None if form.get("workOrderMilestoneCompletionTimeString") in (None, "") else _time_string_to_integer(form["workOrderMilestoneCompletionTimeString"]))
    _validate_values(TABLES["WorkOrderMilestones"], values)
    return values


def add_work_order_milestone(database, form, actor, *, audit_enabled=False, current_date=None):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["workOrderId"])
        now = now_millis()
        item = connection.execute(TABLES["WorkOrderMilestones"].insert().values(workOrderId=identifier,
            **milestone_values(form, adding=True, current_date=current_date), recordCreate_username=actor, recordCreate_timeMillis=now,
            recordUpdate_username=actor, recordUpdate_timeMillis=now)).inserted_primary_key[0]
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _raw(connection, "WorkOrderMilestones", item), "WorkOrderMilestones", item)
        return item


def mutate_work_order_milestone(database, action, form, actor, *, audit_enabled=False, current_date=None, current_time=None):
    with transaction(database) as connection:
        item = _integer(form["workOrderMilestoneId"], required=True)
        before = _raw(connection, "WorkOrderMilestones", item, parent=form.get("workOrderId"))
        if before is None:
            return False
        identifier = _active_parent(connection, before["workOrderId"])
        # Source milestone update/complete/time do not exclude soft-deleted rows.
        if action == "update":
            values = milestone_values(form)
        elif action == "time":
            values = {"workOrderMilestoneDate": _today(current_date) if form["workOrderMilestoneDateString"] == "" else _date_string_to_integer(form["workOrderMilestoneDateString"]),
                "workOrderMilestoneTime": None if form.get("workOrderMilestoneTimeString") in (None, "") else _time_string_to_integer(form["workOrderMilestoneTimeString"])}
        elif action == "complete":
            now = datetime.now()
            if form.get("workOrderMilestoneCompletionTimeString") in (None, ""):
                completion_time = now.hour * 100 + now.minute if current_time is None else current_time
            else:
                try:
                    completion_time = _time_string_to_integer(form["workOrderMilestoneCompletionTimeString"])
                except ValueError:
                    # Source complete helper coalesces invalid time to midnight.
                    completion_time = 0
            values = {"workOrderMilestoneCompletionDate": _today(current_date) if form.get("workOrderMilestoneCompletionDateString") in (None, "") else _date_string_to_integer(form["workOrderMilestoneCompletionDateString"]),
                "workOrderMilestoneCompletionTime": completion_time}
        elif action == "reopen":
            if before["workOrderMilestoneCompletionDate"] is None:
                return False
            values = {"workOrderMilestoneCompletionDate": None, "workOrderMilestoneCompletionTime": None}
        elif action == "delete":
            if before["recordDelete_timeMillis"] is not None:
                return False
            values = {"recordDelete_username": actor, "recordDelete_timeMillis": now_millis()}
        else:
            raise ValueError("Unknown milestone action")
        if action != "delete":
            values.update(recordUpdate_username=actor, recordUpdate_timeMillis=now_millis())
        _validate_values(TABLES["WorkOrderMilestones"], values)
        connection.execute(TABLES["WorkOrderMilestones"].update().where(TABLES["WorkOrderMilestones"].c.workOrderMilestoneId == item).values(**values))
        if audit_enabled:
            _audit(connection, identifier, actor, "deleted" if action == "delete" else "updated", before,
                None if action == "delete" else _raw(connection, "WorkOrderMilestones", item), "WorkOrderMilestones", item)
        return True


def mutate_work_order_comment(database, action, form, actor, *, audit_enabled=False, current_date=None, current_time=None):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["workOrderId"])
        table = TABLES["WorkOrderComments"]
        if action == "add":
            now = datetime.now()
            values = {"workOrderId": identifier, "comment": _text(form["comment"], "Comment"), "commentDate": _today(current_date),
                "commentTime": now.hour * 100 + now.minute if current_time is None else current_time,
                "recordCreate_username": actor, "recordCreate_timeMillis": now_millis(), "recordUpdate_username": actor, "recordUpdate_timeMillis": now_millis()}
            _validate_values(table, values)
            item = connection.execute(table.insert().values(**values)).inserted_primary_key[0]
            before = None
        else:
            item = _integer(form["workOrderCommentId"], required=True)
            before = _raw(connection, "WorkOrderComments", item, parent=identifier, active=True)
            if before is None:
                return False
            values = {"recordDelete_username": actor, "recordDelete_timeMillis": now_millis()} if action == "delete" else {
                "comment": _text(form["comment"], "Comment"), "commentDate": _date_string_to_integer(form["commentDateString"]),
                "commentTime": _time_string_to_integer(form["commentTimeString"]), "recordUpdate_username": actor, "recordUpdate_timeMillis": now_millis()}
            _validate_values(table, values)
            connection.execute(table.update().where(table.c.workOrderCommentId == item).values(**values))
        if audit_enabled:
            _audit(connection, identifier, actor, {"add": "created", "update": "updated", "delete": "deleted"}[action], before,
                None if action == "delete" else _raw(connection, "WorkOrderComments", item), "WorkOrderComments", item)
        return item if action == "add" else True


def mutate_work_order_relation(database, action, form, actor, *, kind, audit_enabled=False):
    with transaction(database) as connection:
        identifier = _active_parent(connection, form["workOrderId"])
        name, key, target = ("WorkOrderContracts", "contractId", "Contracts") if kind == "contract" else ("WorkOrderBurialSites", "burialSiteId", "BurialSites")
        table = TABLES[name]
        item = _integer(form[key], required=True)
        where = (table.c.workOrderId == identifier, table.c[key] == item)
        before = connection.execute(sa.select(table).where(*where)).mappings().first()
        before = dict(before) if before is not None else None
        if action == "add":
            target_table = TABLES[target]
            if connection.scalar(sa.select(target_table.c[key]).where(target_table.c[key] == item, target_table.c.recordDelete_timeMillis.is_(None))) is None:
                raise ValueError("Related record not found")
            now = now_millis()
            values = {"recordCreate_username": actor, "recordCreate_timeMillis": now, "recordUpdate_username": actor, "recordUpdate_timeMillis": now,
                "recordDelete_username": None, "recordDelete_timeMillis": None}
            if before is None:
                connection.execute(table.insert().values(workOrderId=identifier, **{key: item}, **values))
            elif before["recordDelete_timeMillis"] is not None:
                connection.execute(table.update().where(*where).values(**values))
        else:
            result = connection.execute(table.update().where(*where).values(recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
            if not result.rowcount:
                return False
        if audit_enabled:
            after = dict(connection.execute(sa.select(table).where(*where)).mappings().one()) if action == "add" else None
            _audit(connection, identifier, actor, "created" if action == "add" else "deleted",
                before if action != "add" and before is not None and before["recordDelete_timeMillis"] is None else None, after, name, item)
        return True


def get_work_order_comments(database, identifier):
    with transaction(database) as connection:
        table = TABLES["WorkOrderComments"]
        rows = [dict(row) for row in connection.execute(sa.select(*(table.c[key] for key in ("workOrderCommentId", "commentDate", "commentTime", "comment", "recordCreate_username", "recordUpdate_username"))).where(
            table.c.workOrderId == identifier, table.c.recordDelete_timeMillis.is_(None)).order_by(table.c.commentDate.desc(), table.c.commentTime.desc(), table.c.workOrderCommentId.desc())).mappings()]
        for row in rows:
            row.update(commentDateString=_date_string(row["commentDate"]), commentTimeString=_time_string(row["commentTime"]), commentTimePeriodString=_time_period_string(row["commentTime"]))
        return rows


def _active_link_counts(table_name, count_name):
    table = TABLES[table_name]
    return sa.select(table.c.workOrderId, sa.func.count().label(count_name)).where(
        table.c.recordDelete_timeMillis.is_(None)).group_by(table.c.workOrderId).subquery()


def _relation_presence(connection, identifiers):
    """Read link presence together, so empty orders need no relation readers."""
    identifiers = list(dict.fromkeys(identifiers))
    if not identifiers:
        return {}
    w = TABLES["WorkOrders"]
    sites = _active_link_counts("WorkOrderBurialSites", "siteCount")
    contracts = _active_link_counts("WorkOrderContracts", "contractCount")
    query = sa.select(w.c.workOrderId, sa.func.coalesce(sites.c.siteCount, 0), sa.func.coalesce(contracts.c.contractCount, 0)).select_from(
        w.outerjoin(sites, w.c.workOrderId == sites.c.workOrderId).outerjoin(contracts, w.c.workOrderId == contracts.c.workOrderId))
    result = {}
    # SQL Server limits a statement to 2,100 parameters. Calendar exports have
    # no page limit, so also support more than that many distinct orders.
    for offset in range(0, len(identifiers), 2000):
        result.update({identifier: (site_count, contract_count) for identifier, site_count, contract_count in connection.execute(
            query.where(w.c.workOrderId.in_(identifiers[offset:offset + 2000])))})
    return result


def _relations(connection, identifier, *, detail=False, has_burial_sites=None, has_contracts=None):
    if has_burial_sites is None or has_contracts is None:
        site_count, contract_count = _relation_presence(connection, [identifier]).get(identifier, (0, 0))
        has_burial_sites = site_count > 0 if has_burial_sites is None else has_burial_sites
        has_contracts = contract_count > 0 if has_contracts is None else has_contracts
    sites = search_burial_sites(connection, {"workOrderId": identifier}, limit=-1, include_deleted=detail)["burialSites"] if has_burial_sites else []
    sites.sort(key=lambda row: (*(_null_first(row.get("burialSiteNameSegment" + str(index))) for index in range(1, 6)), row["burialSiteId"]))
    contracts = get_contracts(connection, {"workOrderId": identifier}, limit=-1, include_fees=False, include_transactions=False,
        include_service_types=False)["contracts"] if has_contracts else []
    return {"workOrderBurialSites": sites, "workOrderContracts": contracts}


def _work_order_join():
    w, t, s = (TABLES[name] for name in ("WorkOrders", "WorkOrderTypes", "WorkOrderStatuses"))
    return w, w.outerjoin(t, w.c.workOrderTypeId == t.c.workOrderTypeId).outerjoin(s, w.c.workOrderStatusId == s.c.workOrderStatusId), (t.c.workOrderType, s.c.workOrderStatus)


def _format_order(row):
    row.update(workOrderOpenDateString=_date_string(row["workOrderOpenDate"]), workOrderCloseDateString=_date_string(row["workOrderCloseDate"]))
    return row


def get_work_order(database, identifier, *, by_number=False):
    with transaction(database) as connection:
        w, joined, names = _work_order_join()
        query = sa.select(w, *names).select_from(joined).where(w.c.recordDelete_timeMillis.is_(None))
        rows = connection.execute(query.where(w.c.workOrderNumber == identifier) if by_number else query.where(w.c.workOrderId == _integer(identifier, required=True))).mappings()
        row = next((dict(row) for row in rows if not by_number or row["workOrderNumber"] == identifier), None)
        if row is None:
            return None
        for key in ("recordDelete_username", "recordDelete_timeMillis"):
            row.pop(key, None)
        _format_order(row)
        row.update(**_relations(connection, row["workOrderId"], detail=True), workOrderComments=get_work_order_comments(connection, row["workOrderId"]),
            workOrderMilestones=get_work_order_milestones(connection, {"workOrderId": row["workOrderId"]}, order_by="completion"))
        return row


def _work_order_filters(filters):
    w, wc, wb, c, b, cem, ci, m = (TABLES[name] for name in ("WorkOrders", "WorkOrderContracts", "WorkOrderBurialSites", "Contracts", "BurialSites", "Cemeteries", "ContractInterments", "WorkOrderMilestones"))
    where = [w.c.recordDelete_timeMillis.is_(None)]
    if any(filters.get(key) is not None and not isinstance(filters[key], str) for key in ("deceasedName", "burialSiteName")):
        raise ValueError("Name filters must be text")
    if filters.get("workOrderTypeId") not in (None, ""):
        where.append(w.c.workOrderTypeId == _integer(filters["workOrderTypeId"], required=True))
    status = filters.get("workOrderOpenStatus")
    if status == "open":
        where.append(w.c.workOrderCloseDate.is_(None))
    elif status == "closed":
        where.append(w.c.workOrderCloseDate.is_not(None))
    if filters.get("workOrderOpenDateString") not in (None, ""):
        where.append(w.c.workOrderOpenDate == _date_string_to_integer(filters["workOrderOpenDateString"]))
    if filters.get("workOrderMilestoneDateString") not in (None, ""):
        day = _date_string_to_integer(filters["workOrderMilestoneDateString"])
        where.append(sa.or_(w.c.workOrderId.in_(sa.select(m.c.workOrderId).where(m.c.recordDelete_timeMillis.is_(None), m.c.workOrderMilestoneDate == day)),
            sa.and_(w.c.workOrderOpenDate == day, ~sa.exists(sa.select(m.c.workOrderMilestoneId).where(m.c.workOrderId == w.c.workOrderId, m.c.recordDelete_timeMillis.is_(None))))))
    if filters.get("contractId") not in (None, ""):
        where.append(w.c.workOrderId.in_(sa.select(wc.c.workOrderId).where(wc.c.recordDelete_timeMillis.is_(None), wc.c.contractId == _integer(filters["contractId"], required=True))))
    if filters.get("funeralHomeId") not in (None, ""):
        where.append(w.c.workOrderId.in_(sa.select(wc.c.workOrderId).select_from(wc.join(c, wc.c.contractId == c.c.contractId)).where(wc.c.recordDelete_timeMillis.is_(None), c.c.funeralHomeId == _integer(filters["funeralHomeId"], required=True))))
    deceased = contains_name_predicates(ci.c.deceasedName, filters.get("deceasedName") or "")
    if deceased:
        where.append(w.c.workOrderId.in_(sa.select(wc.c.workOrderId).where(wc.c.recordDelete_timeMillis.is_(None), wc.c.contractId.in_(sa.select(ci.c.contractId).where(ci.c.recordDelete_timeMillis.is_(None), *deceased)))))
    site_name = burial_site_name_predicates(b.c.burialSiteName, filters.get("burialSiteName") or "")
    if site_name:
        ids = sa.select(b.c.burialSiteId).where(b.c.recordDelete_timeMillis.is_(None), *site_name)
        where.append(sa.or_(w.c.workOrderId.in_(sa.select(wb.c.workOrderId).where(wb.c.recordDelete_timeMillis.is_(None), wb.c.burialSiteId.in_(ids))),
            w.c.workOrderId.in_(sa.select(wc.c.workOrderId).select_from(wc.join(c, wc.c.contractId == c.c.contractId)).where(wc.c.recordDelete_timeMillis.is_(None), c.c.burialSiteId.in_(ids)))))
    if filters.get("cemeteryId") not in (None, ""):
        cemetery = _integer(filters["cemeteryId"], required=True)
        selected = sa.or_(cem.c.cemeteryId == cemetery, cem.c.parentCemeteryId == cemetery)
        where.append(sa.or_(w.c.workOrderId.in_(sa.select(wb.c.workOrderId).select_from(wb.join(b, wb.c.burialSiteId == b.c.burialSiteId).join(cem, b.c.cemeteryId == cem.c.cemeteryId)).where(wb.c.recordDelete_timeMillis.is_(None), selected)),
            w.c.workOrderId.in_(sa.select(wc.c.workOrderId).select_from(wc.join(c, wc.c.contractId == c.c.contractId).join(b, c.c.burialSiteId == b.c.burialSiteId).join(cem, b.c.cemeteryId == cem.c.cemeteryId)).where(wc.c.recordDelete_timeMillis.is_(None), selected))))
    return where


def get_work_orders(database, filters=None, *, limit=50, offset=0, include_burial_sites=True, include_comments=False, include_milestones=False, current_date=None):
    safe_limit, safe_offset = sanitize_limit(limit), sanitize_offset(offset)
    if not math.isfinite(safe_limit) or not math.isfinite(safe_offset) or max(safe_limit, safe_offset) > 2**63 - 1:
        raise ValueError("Invalid work order pagination")
    with transaction(database) as connection:
        w, joined, names = _work_order_join()
        columns = [column for column in w.c if not column.name.startswith("record")]
        milestones = TABLES["WorkOrderMilestones"]
        milestone_counts = sa.select(milestones.c.workOrderId,
            sa.func.count().label("workOrderMilestoneCount"),
            sa.func.sum(sa.case((milestones.c.workOrderMilestoneCompletionDate.is_not(None), 1), else_=0)).label("workOrderMilestoneCompletionCount"),
            sa.func.sum(sa.case((sa.and_(milestones.c.workOrderMilestoneDate < _today(current_date),
                milestones.c.workOrderMilestoneCompletionDate.is_(None)), 1), else_=0)).label("workOrderMilestoneOverdueCount")).where(
                    milestones.c.recordDelete_timeMillis.is_(None)).group_by(milestones.c.workOrderId).subquery()
        joined = joined.outerjoin(milestone_counts, w.c.workOrderId == milestone_counts.c.workOrderId)
        columns.extend(sa.func.coalesce(milestone_counts.c[key], 0).label(key) for key in (
            "workOrderMilestoneCount", "workOrderMilestoneCompletionCount", "workOrderMilestoneOverdueCount"))
        site_counts = _active_link_counts("WorkOrderBurialSites", "workOrderBurialSiteCount")
        joined = joined.outerjoin(site_counts, w.c.workOrderId == site_counts.c.workOrderId)
        columns.append(sa.func.coalesce(site_counts.c.workOrderBurialSiteCount, 0).label("workOrderBurialSiteCount"))
        if include_burial_sites:
            contract_counts = _active_link_counts("WorkOrderContracts", "_contractCount")
            joined = joined.outerjoin(contract_counts, w.c.workOrderId == contract_counts.c.workOrderId)
            columns.append(sa.func.coalesce(contract_counts.c._contractCount, 0).label("_contractCount"))
        if include_comments:
            comment_counts = _active_link_counts("WorkOrderComments", "_commentCount")
            joined = joined.outerjoin(comment_counts, w.c.workOrderId == comment_counts.c.workOrderId)
            columns.append(sa.func.coalesce(comment_counts.c._commentCount, 0).label("_commentCount"))
        rows = [dict(row) for row in connection.execute(sa.select(*columns, *names).select_from(joined).where(*_work_order_filters(filters or {}))).mappings()]
        rows.sort(key=lambda row: (_null_first(row["workOrderOpenDate"]), row["workOrderNumber"]), reverse=True)
        count = len(rows)
        if limit != -1:
            rows = rows[safe_offset:safe_offset + safe_limit]
        for row in rows:
            _format_order(row)
            if include_milestones:
                row["workOrderMilestones"] = get_work_order_milestones(connection, {"workOrderId": row["workOrderId"]},
                    current_date=current_date) if row["workOrderMilestoneCount"] else []
            if include_burial_sites:
                row.update(_relations(connection, row["workOrderId"], has_burial_sites=row["workOrderBurialSiteCount"] > 0,
                    has_contracts=row.pop("_contractCount") > 0))
            if include_comments:
                row["workOrderComments"] = get_work_order_comments(connection, row["workOrderId"]) if row.pop("_commentCount") else []
        return {"count": count, "workOrders": rows}


def _milestone_filters(connection, filters, current_date=None):
    m, w = TABLES["WorkOrderMilestones"], TABLES["WorkOrders"]
    where = [m.c.recordDelete_timeMillis.is_(None), w.c.recordDelete_timeMillis.is_(None)]
    if filters.get("workOrderId") not in (None, ""):
        where.append(m.c.workOrderId == _integer(filters["workOrderId"], required=True))
    day = date.today() if current_date is None else current_date
    if not isinstance(day, date):
        day = date(day // 10000, day // 100 % 100, day % 100)
    today = date_to_integer(day)
    kind = filters.get("workOrderMilestoneDateFilter")
    if kind == "blank":
        where.append(m.c.workOrderMilestoneDate == 0)
    elif kind == "notBlank":
        where.append(m.c.workOrderMilestoneDate > 0)
    elif kind == "recent":
        before, after = (js_number(get_setting_value(connection, "workOrder.workOrderMilestone.recent" + part + "Days")) for part in ("Before", "After"))
        if not math.isfinite(before) or not math.isfinite(after):
            where.append(sa.false())
        else:
            try:
                first = date_to_integer(day - timedelta(days=math.trunc(before)))
                last = date_to_integer(day + timedelta(days=math.trunc(after)))
            except (ValueError, OverflowError):
                where.append(sa.false())
            else:
                where.append(m.c.workOrderMilestoneDate.between(first, last))
    elif kind == "upcomingMissed":
        where.append(sa.or_(m.c.workOrderMilestoneCompletionDate.is_(None), m.c.workOrderMilestoneDate >= today))
    elif kind == "yearMonth":
        year_input = filters.get("workOrderMilestoneYear")
        month_input = filters.get("workOrderMilestoneMonth")
        year = js_number(day.year if year_input is None else year_input)
        month = js_number(day.month if month_input is None else month_input)
        if not math.isfinite(year) or not math.isfinite(month):
            where.append(sa.false())
        else:
            year = math.trunc(year) if isinstance(year_input, str) else year
            month = math.trunc(month) if isinstance(month_input, str) else month
            ym = year * 10000 + month * 100
            where.append(sa.false() if not math.isfinite(ym) else m.c.workOrderMilestoneDate.between(float(ym), float(ym + 100)))
    if filters.get("workOrderMilestoneDateString") not in (None, ""):
        where.append(m.c.workOrderMilestoneDate == _date_string_to_integer(filters["workOrderMilestoneDateString"]))
    for key, column in (("workOrderTypeIds", w.c.workOrderTypeId), ("workOrderMilestoneTypeIds", m.c.workOrderMilestoneTypeId)):
        value = filters.get(key)
        if isinstance(value, str) and re.fullmatch(r"[0-9]+(?:,[0-9]+)*", value):
            # The source embeds validated numeric literals in SQL. Literals
            # above bigint cannot match a target identity, but do not invalidate
            # other entries in the list.
            identifiers = [int(piece) for piece in value.split(",") if len(piece.lstrip("0")) < 20]
            identifiers = [value for value in identifiers if value <= 2**63 - 1]
            where.append(column.in_(identifiers))
    return where


def get_work_order_milestones(database, filters=None, *, include_work_orders=False, order_by="date", current_date=None):
    filters = filters or {}
    with transaction(database) as connection:
        m, t, w, wt = (TABLES[name] for name in ("WorkOrderMilestones", "WorkOrderMilestoneTypes", "WorkOrders", "WorkOrderTypes"))
        joined = m.outerjoin(t, m.c.workOrderMilestoneTypeId == t.c.workOrderMilestoneTypeId).outerjoin(w, m.c.workOrderId == w.c.workOrderId).outerjoin(wt, w.c.workOrderTypeId == wt.c.workOrderTypeId)
        columns = [column for column in m.c if not column.name.startswith("recordDelete")]
        columns.extend((t.c.workOrderMilestoneType, t.c.orderNumber.label("_orderNumber")))
        if include_work_orders:
            columns.extend((w.c.workOrderNumber, wt.c.workOrderType, w.c.workOrderDescription, w.c.workOrderOpenDate, w.c.workOrderCloseDate,
                w.c.recordUpdate_timeMillis.label("workOrderRecordUpdate_timeMillis")))
        rows = [dict(row) for row in connection.execute(sa.select(*columns).select_from(joined).where(*_milestone_filters(connection, filters, current_date))).mappings()]
        if order_by == "completion":
            rows.sort(key=lambda row: (_null_first(row["workOrderMilestoneCompletionDate"]), _null_first(row["workOrderMilestoneCompletionTime"]),
                row["workOrderMilestoneDate"], row["workOrderMilestoneTime"] if row["workOrderMilestoneTime"] is not None else 9999,
                _null_first(row["_orderNumber"]), row["workOrderMilestoneId"]))
        else:
            rows.sort(key=lambda row: (row["workOrderMilestoneDate"], row["workOrderMilestoneTime"] if row["workOrderMilestoneTime"] is not None else 9999,
                _null_first(row["_orderNumber"]), row["workOrderId"], row["workOrderMilestoneId"]))
        relation_presence = _relation_presence(connection, [row["workOrderId"] for row in rows]) if include_work_orders else {}
        related = {}
        for row in rows:
            row.pop("_orderNumber")
            for prefix in ("workOrderMilestone", "workOrderMilestoneCompletion"):
                row.update({prefix + "DateString": _date_string(row[prefix + "Date"]), prefix + "TimeString": _time_string(row[prefix + "Time"]),
                    prefix + "TimePeriodString": _time_period_string(row[prefix + "Time"] or 0)})
            if include_work_orders:
                _format_order(row)
                identifier = row["workOrderId"]
                if identifier not in related:
                    site_count, contract_count = relation_presence.get(identifier, (0, 0))
                    related[identifier] = _relations(connection, identifier, has_burial_sites=site_count > 0, has_contracts=contract_count > 0)
                row.update(related[identifier])
        return rows


def _options(connection, app, user):
    from cemaris.cemeteries import get_cemeteries
    from cemaris.funeral_homes import get_funeral_homes
    from cemaris.preferences import get_work_order_work_day_ranges
    return {**{key: get_catalog_records(connection, key) for key in ("workOrderTypes", "workOrderStatuses", "workOrderMilestoneTypes", "burialSiteStatuses")},
        "cemeteries": get_cemeteries(connection), "funeralHomes": get_funeral_homes(connection, include_upcoming_funeral_count=False),
        "workOrderWorkDayRanges": _json_value(get_work_order_work_day_ranges(connection)), "workDayRanges": _json_value(get_work_order_work_day_ranges(connection)),
        "aliases": {key: get_setting_value(connection, "aliases." + key) for key in ("workOrderOpenDate", "workOrderCloseDate")},
        "workOrderNumberLength": app.state.work_order_options.work_order_number_length,
        "contractEndDateIsAvailable": app.state.contract_options.contract_end_date_is_available,
        "calendarEmailAddress": app.state.work_order_options.work_order_calendar_email_address,
        "appUrl": app.state.settings.app_url or "",
        "auditLogEnabled": app.state.preference_options.audit_log_enabled, "apiKey": user.get("userSettings", {}).get("apiKey", "")}


def install_work_orders(app, *, options=None):
    from cemaris.auth import current_user, require_update_work_orders
    from cemaris.dependencies import get_engine
    from cemaris.preferences import is_api_key_valid
    from fastapi.responses import Response
    app.state.work_order_options = options or WorkOrderOptions()
    router = APIRouter(prefix="/api/work-orders", tags=["work orders"])

    @router.get("/options")
    @router.get("/meta")
    def meta(request: Request, user=Depends(current_user)):
        with get_engine(request).begin() as connection:
            return {"options": _options(connection, app, user), "canUpdate": user.get("userProperties", {}).get("canUpdateWorkOrders", False)}

    @router.get("/catalogs")
    def catalogs(request: Request, user=Depends(current_user)):
        with get_engine(request).begin() as connection:
            values = _options(connection, app, user)
            return {**values, "options": values, "canUpdate": user.get("userProperties", {}).get("canUpdateWorkOrders", False)}

    @router.get("/new")
    def new(request: Request, user=Depends(require_update_work_orders)):
        with get_engine(request).begin() as connection:
            values = _options(connection, app, user)
            return {"workOrder": {"workOrderOpenDate": _today(), "workOrderOpenDateString": _date_string(_today()),
                "workOrderTypeId": values["workOrderTypes"][0]["workOrderTypeId"] if values["workOrderTypes"] else None,
                "workOrderStatusId": values["workOrderStatuses"][0]["workOrderStatusId"] if values["workOrderStatuses"] else None},
                "options": values, "canUpdate": True}

    def search_result(request, form):
        try:
            result = get_work_orders(get_engine(request), form, limit=form.get("limit", 50), offset=form.get("offset", 0))
            offset = js_number(form.get("offset", 0))
            return {**result, "offset": math.trunc(offset) if math.isfinite(offset) else None}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_work_order_search", str(error))

    @router.get("")
    def search_get(request: Request, user=Depends(current_user)):
        return search_result(request, dict(request.query_params))

    @router.post("/search")
    @router.post("/doSearchWorkOrders")
    def search(request: Request, form: dict = Body(...), user=Depends(current_user)):
        return search_result(request, form)

    def workday_result(connection, form):
        return {"workOrders": get_work_orders(connection, {"workOrderMilestoneDateString": form["workdayDateString"]},
            limit=-1, include_milestones=True)["workOrders"]}

    @router.post("/workday")
    @router.post("/doGetWorkdayReport")
    def workday(request: Request, form: dict = Body(...), user=Depends(current_user)):
        try:
            return workday_result(get_engine(request), form)
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_workday", str(error))

    @router.post("/doGetWorkOrderMilestones")
    def milestones(request: Request, form: dict = Body(...), user=Depends(current_user)):
        try:
            return {"workOrderMilestones": get_work_order_milestones(get_engine(request), form, include_work_orders=True)}
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_milestone_filter", str(error))

    @router.get("/milestones")
    def milestones_get(request: Request, user=Depends(current_user)):
        return milestones(request, dict(request.query_params), user)

    def calendar_response(request):
        from cemaris.work_order_calendar import build_calendar
        try:
            filters = {key: request.query_params.get(key) for key in ("workOrderTypeIds", "workOrderMilestoneTypeIds")}
            identifier = request.query_params.get("workOrderId")
            if identifier:
                filters.update(workOrderId=identifier, workOrderMilestoneDateFilter="notBlank")
            else:
                filters["workOrderMilestoneDateFilter"] = "recent"
            rows = get_work_order_milestones(get_engine(request), filters, include_work_orders=True)
            app_url = app.state.settings.app_url or str(request.base_url).rstrip("/")
            content = build_calendar(rows, app_url, calendar_email=app.state.work_order_options.work_order_calendar_email_address,
                work_order_id=identifier, prints=app.state.work_order_options.work_order_calendar_prints)
            return Response(content, media_type="text/calendar; charset=utf-8", headers={"Content-Disposition": "inline; filename=calendar.ics"})
        except (ValueError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_calendar", str(error))

    @router.get("/ical/")
    @router.get("/ical")
    def calendar(request: Request, user=Depends(current_user)):
        return calendar_response(request)

    @app.get("/api/milestoneICS/", tags=["work order calendar"], include_in_schema=False)
    @app.get("/api/milestoneICS", tags=["work order calendar"])
    def calendar_session(request: Request, user=Depends(current_user)):
        return calendar_response(request)

    @app.get("/api/{api_key}/milestoneICS/", tags=["work order calendar"], include_in_schema=False)
    @app.get("/api/{api_key}/milestoneICS", tags=["work order calendar"])
    def calendar_key(api_key: str, request: Request):
        if not is_api_key_valid(get_engine(request), api_key, app.state.auth_settings):
            raise HTTPException(401, "Invalid API key")
        return calendar_response(request)

    def mutate(action, request, form, user):
        try:
            with get_engine(request).begin() as connection:
                kwargs = {"audit_enabled": app.state.preference_options.audit_writes_enabled}
                actor = user["username"]
                if action == "create":
                    return {"success": True, "workOrderId": add_work_order(connection, form, actor, options=app.state.work_order_options, **kwargs)}
                is_workday = action.startswith("workday-")
                action = action.removeprefix("workday-")
                if action in {"milestone-complete", "milestone-reopen", "milestone-time"} and is_workday:
                    success = mutate_work_order_milestone(connection, action.removeprefix("milestone-"),
                        {key: value for key, value in form.items() if key not in {"workOrderMilestoneCompletionDateString", "workOrderMilestoneCompletionTimeString"}}, actor, **kwargs)
                    if not success:
                        return _catalog_error(request, 400, "work_order_item_not_found", "Failed to update work order milestone")
                    return {"success": True, **workday_result(connection, form)}
                identifier = _active_parent(connection, form.get("workOrderId"))
                if action == "update":
                    success = update_work_order(connection, form, actor, **kwargs)
                elif action == "close":
                    success = close_work_order(connection, form, actor, **kwargs)
                elif action == "reopen":
                    success = reopen_work_order(connection, identifier, actor, **kwargs)
                elif action == "delete":
                    success = delete_work_order(connection, identifier, actor, **kwargs)
                elif action.startswith("comment-"):
                    success = mutate_work_order_comment(connection, action.removeprefix("comment-"), form, actor, **kwargs)
                    if success:
                        return {"success": True, "workOrderComments": get_work_order_comments(connection, identifier)}
                elif action.startswith("milestone-"):
                    operation = action.removeprefix("milestone-")
                    if operation == "add":
                        item = add_work_order_milestone(connection, form, actor, **kwargs)
                        success = True
                    else:
                        # Original completion handler passes only the item identifier.
                        form = {key: value for key, value in form.items() if operation != "complete" or key not in {"workOrderMilestoneCompletionDateString", "workOrderMilestoneCompletionTimeString"}}
                        success = mutate_work_order_milestone(connection, operation, form, actor, **kwargs)
                    if success:
                        return {"success": True, **({"workOrderMilestoneId": item} if operation == "add" else {}),
                            "workOrderMilestones": get_work_order_milestones(connection, {"workOrderId": identifier}, order_by="completion")}
                elif action.startswith("relation-"):
                    _, kind, operation = action.split("-")
                    success = mutate_work_order_relation(connection, operation, form, actor, kind=kind, **kwargs)
                    if success:
                        related = _relations(connection, identifier)
                        return {"success": True, "workOrderContracts" if kind == "contract" else "workOrderBurialSites": related["workOrderContracts" if kind == "contract" else "workOrderBurialSites"]}
                elif action == "burial-status":
                    success = update_burial_site_status(connection, form["burialSiteId"], form["burialSiteStatusId"], actor, **kwargs)
                    if success:
                        return {"success": True, "workOrderBurialSites": _relations(connection, identifier)["workOrderBurialSites"]}
                else:
                    raise ValueError("Unknown work order action")
                if not success:
                    return _catalog_error(request, 400, "work_order_item_not_found", "Failed to update work order")
                return {"success": True, **workday_result(connection, form)} if is_workday else {"success": True, "workOrderId": identifier}
        except WorkOrderParentNotFound as error:
            return _catalog_error(request, 404, "work_order_not_found", str(error))
        except (ValueError, TypeError, KeyError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_work_order", "Missing work order field" if isinstance(error, KeyError) else str(error))
        except (IntegrityError, DataError):
            return _catalog_error(request, 400, "work_order_constraint", "The work order value violates a database reference or constraint")

    def endpoint(action):
        def handler(request: Request, form: dict[str, Any] = Body(...), user=Depends(require_update_work_orders)):
            return mutate(action, request, form, user)
        return handler

    actions = [("doCreateWorkOrder", "create"), ("doUpdateWorkOrder", "update"), ("doCloseWorkOrder", "close"),
        ("doReopenWorkOrder", "reopen"), ("doDeleteWorkOrder", "delete"), ("doUpdateBurialSiteStatus", "burial-status"),
        ("doCloseWorkdayWorkOrder", "workday-close"), ("doCompleteWorkdayWorkOrderMilestone", "workday-milestone-complete"),
        ("doReopenWorkdayWorkOrderMilestone", "workday-milestone-reopen"), ("doUpdateWorkdayWorkOrderMilestoneTime", "workday-milestone-time")]
    for kind, source, operations in (("comment", "Comment", ("add", "update", "delete")), ("milestone", "Milestone", ("add", "update", "delete", "complete", "reopen")),
        ("relation-contract", "Contract", ("add", "delete")), ("relation-burial", "BurialSite", ("add", "delete"))):
        actions.extend(("do" + operation.title() + "WorkOrder" + source, kind + "-" + operation) for operation in operations)
    for path, action in actions:
        router.add_api_route("/" + path, endpoint(action), methods=["POST"], name=path)
    router.add_api_route("", endpoint("create"), methods=["POST"])

    def path_endpoint(action, item_key=None):
        if item_key:
            def handler(work_order_id: int, item_id: int, request: Request, form: dict = Body(default={}), user=Depends(require_update_work_orders)):
                return mutate(action, request, {**form, "workOrderId": work_order_id, item_key: item_id}, user)
        else:
            def handler(work_order_id: int, request: Request, form: dict = Body(default={}), user=Depends(require_update_work_orders)):
                return mutate(action, request, {**form, "workOrderId": work_order_id}, user)
        return handler

    for action in ("update", "delete", "close", "reopen"):
        router.add_api_route("/{work_order_id}/" + action, path_endpoint(action), methods=["POST"])
    router.add_api_route("/{work_order_id}", path_endpoint("update"), methods=["PUT"])
    for resource, kind, item_key in (("milestones", "milestone", "workOrderMilestoneId"), ("comments", "comment", "workOrderCommentId"),
        ("contracts", "relation-contract", "contractId"), ("burial-sites", "relation-burial", "burialSiteId")):
        router.add_api_route("/{work_order_id}/" + resource, path_endpoint(kind + "-add"), methods=["POST"])
        for operation in (("update", "delete", "complete", "reopen", "time") if kind == "milestone" else ("update", "delete") if kind == "comment" else ("delete",)):
            router.add_api_route("/{work_order_id}/" + resource + "/{item_id}" + ("" if operation == "update" else "/" + operation),
                path_endpoint(kind + "-" + operation, item_key), methods=["POST"])

    @router.post("/doGetRecordAuditLog")
    def audit(request: Request, form: dict = Body(...), user=Depends(require_update_work_orders)):
        from cemaris.places_audit import get_place_audit_log
        if not app.state.preference_options.audit_log_enabled:
            raise HTTPException(404, "Audit logging is disabled")
        if form.get("mainRecordType") != "workOrder":
            raise HTTPException(403, "Forbidden")
        try:
            limit, offset = js_number(form.get("limit", 50)), js_number(form.get("offset", 0))
            if not math.isfinite(limit) or not math.isfinite(offset) or max(abs(limit), abs(offset)) > 2**63 - 1:
                raise ValueError("Invalid audit pagination")
            with get_engine(request).connect() as connection:
                return {"success": True, **get_place_audit_log(connection, "workOrder", form.get("mainRecordId", ""), limit=math.trunc(limit), offset=math.trunc(offset)), "offset": math.trunc(offset)}
        except (ValueError, TypeError, OverflowError):
            raise HTTPException(400, "Invalid audit pagination") from None

    def detail_result(request, identifier, user, by_number=False):
        with get_engine(request).begin() as connection:
            record = get_work_order(connection, identifier, by_number=by_number)
            if record is None:
                return _catalog_error(request, 404, "work_order_not_found", "Work order not found")
            return {"workOrder": record, "options": _options(connection, app, user), "canUpdate": user.get("userProperties", {}).get("canUpdateWorkOrders", False)}

    @router.get("/byWorkOrderNumber/{work_order_number}")
    def by_number(work_order_number: str, request: Request, user=Depends(current_user)):
        return detail_result(request, work_order_number, user, True)

    @router.get("/{work_order_id}")
    def detail(work_order_id: int, request: Request, user=Depends(current_user)):
        return detail_result(request, work_order_id, user)

    app.include_router(router)
