"""43 retained source reports, exact CSV and real SQL Server results.

scripts/reference_reports.mjs executes original bodies and locked dependencies;
SQLite is exclusively its source oracle. These target tests require SQL Server.
"""
from datetime import date
from collections import Counter
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy.dialects import mssql
from fastapi.testclient import TestClient

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES, metadata
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions
from cemaris.reports import (FORMATTED_COLUMNS, PARAMETER_REPORTS, REPORT_NAMES, SIMPLE_REPORTS,
    get_report_data, report_csv, report_statement)

REFERENCE = json.loads((Path(__file__).parent / "fixtures/reports-reference.json").read_text(encoding="utf-8"))
TODAY = date(2026, 10, 20)
FIXED_MILLIS = int(REFERENCE["handlerCases"][0]["result"]["headers"]["Content-Disposition"].rsplit("-", 1)[1].removesuffix(".csv"))


def test_reports_reference_provenance_and_complete_registry():
    assert REFERENCE["commit"] == "451ce034863b16502484367044f3e9b65370111a"
    assert len(SIMPLE_REPORTS) == 34
    assert len(PARAMETER_REPORTS) == 9
    assert list(REPORT_NAMES) == [name for name in REFERENCE["reportNames"] if not name.startswith("orderForms-")]
    root = Path(__file__).resolve().parents[2]
    source = root.parent / "Sunrise-Referenz"
    if source.exists():
        for name, expected in REFERENCE["sourceHashes"].items():
            assert hashlib.sha256((source / name).read_bytes()).hexdigest() == expected, name
    assert {row["name"]: row["version"] for row in REFERENCE["packages"]} == {
        "@cityssm/utils-datetime": "1.4.1", "papaparse": "5.7.0"}


@pytest.mark.parametrize("case", REFERENCE["csvCases"])
def test_csv_exact_locked_papa_parse_default(case):
    assert report_csv(case["rows"]) == case["csv"]


@pytest.mark.parametrize("case", [case for case in REFERENCE["reports"] if not case["reportName"].startswith("orderForms-")], ids=lambda case: case["reportName"])
def test_statement_compiles_for_sql_server_with_identical_source_columns(case):
    statement = report_statement(case["reportName"], case["parameters"], current_date=TODAY)
    assert list(statement.selected_columns.keys()) == list(case["rows"][0])
    compiled = statement.compile(dialect=mssql.dialect())
    assert "?" not in str(compiled)
    assert "recordDelete_timeMillis" in str(compiled)


def test_unknown_report_returns_before_database_access_and_untrusted_names_are_not_sql():
    for name in ["missing", "Users-all", "users-all", "auditLog-all", "contracts-all; DROP TABLE Contracts", "../contracts-all"]:
        assert report_statement(name) is None
        assert get_report_data(None, name) is None


def test_all_raw_report_columns_match_table_declaration_order_without_a_filter():
    for name, table_name in SIMPLE_REPORTS.items():
        statement = report_statement(name)
        if name.endswith("-all"):
            assert list(statement.selected_columns.keys()) == list(TABLES[table_name].c.keys())
            assert not tuple(statement._where_criteria)
            assert not tuple(statement._order_by_clauses)
        else:
            assert list(statement.selected_columns.keys()) == list(FORMATTED_COLUMNS[name])


@pytest.mark.parametrize("report_name", ["cemeteries-formatted", "contractInterments-directory"])
def test_explicit_report_sort_uses_source_unicode_null_and_trailing_space_order(report_name):
    case = next(case for case in REFERENCE["reports"] if case["reportName"] == report_name)

    class Database:
        @contextmanager
        def begin(self):
            yield self

        def execute(self, statement):
            return self

        def mappings(self):
            return list(reversed(case["rows"]))

    rows = get_report_data(Database(), report_name, case["parameters"], current_date=TODAY)
    assert rows == case["rows"]
    assert report_csv(rows) == case["csv"]
    column = "cemeteryName" if report_name == "cemeteries-formatted" else "deceasedName"
    assert {"", "\x00", "A", "A ", "A  ", "a", "Á", "ä", "\ue000", "😀", "\U00010000"} <= {row[column] for row in rows}
    assert next(index for index, row in enumerate(rows) if row[column] == "\U00010000") > next(index for index, row in enumerate(rows) if row[column] == "\ue000")
    if report_name == "contractInterments-directory":
        for name in REFERENCE["sortNames"]:
            assert [row["deathDate"] for row in rows if row["deceasedName"] == name] == [None, 20261000]


@pytest.fixture(scope="module")
def reports_sql(migrated_sql_database):
    engine, name = migrated_sql_database
    # SQLAlchemy's SQL Server dialect explicitly brackets IDENTITY_INSERT for
    # inserts containing identity values. The DB is newly created and empty.
    with engine.begin() as connection:
        assert connection.scalar(sa.text("SELECT DB_NAME()")) == name
        for table in metadata.sorted_tables:
            for item in REFERENCE["seed"]:
                if item["table"] == table.name:
                    connection.execute(table.insert().values(**item["values"]))
    return engine


def canonical(rows):
    # SQLite may return 1 for the same numeric-affinity cell which SQL Server
    # FLOAT returns as 1.0. Python numeric equality and hashes preserve this
    # equality; JSON spellings would invent a difference absent from CSV/JS.
    return Counter(tuple(row.items()) for row in rows)


def assert_rows(actual, case):
    expected = case["rows"]
    assert len(actual) == len(expected)
    assert [list(row) for row in actual] == [list(row) for row in expected]
    if case.get("explicitlySorted"):
        assert actual == expected
        assert report_csv(actual) == case["csv"]
    else:
        # Without ORDER BY neither database promises row order. Compare all
        # row values and each serialized CSV record, preserving exact columns.
        assert canonical(actual) == canonical(expected)
        assert sorted(report_csv([row]) for row in actual) == sorted(report_csv([row]) for row in expected)


@pytest.mark.parametrize("case", [case for case in REFERENCE["reports"] if not case["reportName"].startswith("orderForms-")], ids=lambda case: case["reportName"])
def test_all_43_nonempty_report_result_sets_and_exact_csv_match_original_sql_server(reports_sql, case):
    actual = get_report_data(reports_sql, case["reportName"], case["parameters"], current_date=TODAY)
    assert_rows(actual, case)


@pytest.mark.parametrize("case", REFERENCE["parameters"], ids=lambda case: case["reportName"] + ":" + str(case["parameters"]))
def test_report_parameter_coercion_dates_deletions_missing_binds_and_injection_match_original(reports_sql, case):
    if "error" in case:
        # Original undefined bindings throw TypeError; HTTP turns this into a
        # controlled 400. Invalid normalized date strings use the same guard.
        with pytest.raises((ValueError, TypeError)):
            get_report_data(reports_sql, case["reportName"], case["parameters"], current_date=TODAY)
    else:
        actual = get_report_data(reports_sql, case["reportName"], case["parameters"], current_date=TODAY)
        assert_rows(actual, case)


def test_all_43_empty_sql_reports_have_no_csv_header(reports_sql):
    with reports_sql.connect() as connection:
        transaction = connection.begin()
        try:
            for table in reversed(metadata.sorted_tables):
                connection.execute(table.delete())
            for case in REFERENCE["emptyCases"]:
                if case["reportName"].startswith("orderForms-"):
                    continue
                rows = get_report_data(connection, case["reportName"], case["parameters"], current_date=TODAY)
                assert rows == []
                assert report_csv(rows) == case["csv"] == ""
        finally:
            transaction.rollback()


def test_report_source_asymmetries_are_preserved_with_real_sql(reports_sql):
    current = get_report_data(reports_sql, "contracts-current-byCemeteryId", {"cemeteryId": "1"}, current_date=TODAY)
    assert {row["contractId"] for row in current} == {1, 3, 4, 6, 10}
    # Deleted cemetery/site/type parents are not filtered by the source.
    directory = get_report_data(reports_sql, "contractInterments-directory", current_date=TODAY)
    assert {row["deceasedName"] for row in directory} == {'Synthetic, "Person" Ü\nName', "Synthetic person 9", *REFERENCE["sortNames"]}
    assert len(directory) == 3 + 2 * len(REFERENCE["sortNames"])
    orders = get_report_data(reports_sql, "workOrders-open", current_date=TODAY)
    empty = next(row for row in orders if row["workOrderNumber"] == "SYN-EMPTY")
    assert empty["workOrderMilestoneCount"] is None
    assert empty["workOrderMilestoneCompletionCount"] is None
    counted = next(row for row in orders if row["workOrderId"] == 1)
    assert (counted["workOrderMilestoneCount"], counted["workOrderMilestoneCompletionCount"]) == (3, 1)
    raw = get_report_data(reports_sql, "contractInterments-all")
    assert any(row["recordDelete_timeMillis"] is not None for row in raw)
    tx = get_report_data(reports_sql, "contractTransactions-byTransactionDateString", {"transactionDateString": "2026-10-19"})
    assert tx[0]["transactionAmount"] == 123.45000000000002
    assert tx[0]["isInvoiced"] == 0
    assert "=SUM(A1:A2)" in report_csv(tx)


@pytest.fixture
def report_app(reports_sql, tmp_path, monkeypatch):
    from cemaris import reports

    class FixedDate(date):
        @classmethod
        def today(cls):
            return cls(2026, 10, 20)

    monkeypatch.setattr(reports, "date", FixedDate)
    monkeypatch.setattr(reports, "now_millis", lambda: FIXED_MILLIS)
    names = ["reader", "admin", "cemetery", "contract", "work", "updater"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"],
        can_update_cemeteries=["cemetery"], can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None))
    app.state.db_engine = reports_sql
    return app


def login(client, name="reader"):
    token = client.get("/api/session").json()["csrfToken"]
    result = client.post("/api/login", json={"username": name, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert result.status_code == 200, result.text
    return {"X-CSRF-Token": result.json()["csrfToken"]}


@pytest.mark.parametrize("name", ["reader", "admin", "cemetery", "contract", "work", "updater"])
def test_http_reports_source_allows_every_authenticated_role_including_full_deleted_raw_rows(report_app, name):
    with TestClient(report_app) as client:
        login(client, name)
        result = client.get("/api/reports/contracts-all")
        assert result.status_code == 200
        assert "SYN-C-7" in result.text  # Soft-deleted contract is exported.
        assert result.headers["content-type"] == "text/csv; charset=utf-8"
        assert result.headers["content-disposition"] == f"attachment; filename=contracts-all-{FIXED_MILLIS}.csv"


@pytest.mark.parametrize("case", [case for case in REFERENCE["reports"] if not case["reportName"].startswith("orderForms-")], ids=lambda case: case["reportName"])
def test_http_all_43_downloads_source_names_columns_utf8_csv_and_legacy_alias(report_app, case):
    with TestClient(report_app) as client:
        login(client)
        for prefix in ("/api/reports/", "/reports/"):
            response = client.get(prefix + case["reportName"], params=case["parameters"])
            assert response.status_code == 200, response.text
            assert response.headers["content-disposition"] == f"attachment; filename={case['reportName']}-{FIXED_MILLIS}.csv"
            assert response.content == response.text.encode("utf-8")
            # Compare exact byte encodings for each complete record when SQL
            # has no source ordering guarantee. Header is always byte exact.
            rows = get_report_data(report_app.state.db_engine, case["reportName"], case["parameters"], current_date=20261020)
            assert response.text == report_csv(rows)
            assert_rows(rows, case)
            trailing = client.get(prefix + case["reportName"] + "/", params=case["parameters"], follow_redirects=False)
            assert trailing.status_code == 200 and trailing.content == response.content


def test_http_metadata_product_options_without_portal_tabs_and_default_today(report_app):
    with TestClient(report_app) as client:
        login(client)
        response = client.get("/api/reports/")
        assert response.status_code == 200
        result = response.json()
        assert result["reportNames"] == [name for name in REFERENCE["reportNames"] if not name.startswith("orderForms-")]
        assert result["simpleReports"] == [{"reportName": name, "tableName": table, "formatted": name.endswith("-formatted")}
            for name, table in SIMPLE_REPORTS.items()]
        assert result["parameterReports"] == PARAMETER_REPORTS
        assert result["todayDateString"] == "2026-10-20"
        assert "portalEnabled" not in result
        assert {row["cemeteryId"] for row in result["cemeteries"]} == {1, 3, 4, *range(5, 5 + len(REFERENCE["sortNames"]))}
        assert [row["cemeteryName"] for row in result["cemeteries"]] == [row["cemeteryName"] for row in REFERENCE["searchCases"][0]["result"]["cemeteries"]]
        assert all(row["burialSiteTypeId"] == 1 for row in result["burialSiteTypes"])
        assert all(row["burialSiteStatusId"] == 1 for row in result["burialSiteStatuses"])
        assert client.get("/api/reports/orderForms-formatted").status_code == 404


def test_http_source_post_reads_query_ignores_body_and_global_csrf_is_enforced(report_app):
    with TestClient(report_app) as client:
        headers = login(client)
        path = "/api/reports/burialSites-byCemeteryId?cemeteryId=1"
        assert client.post(path, json={"cemeteryId": "2"}).status_code == 403
        posted = client.post(path, json={"cemeteryId": "2"}, headers=headers)
        assert posted.status_code == 200
        assert posted.text == client.get(path).text
        assert "Synthetic" in posted.text
        assert client.post("/reports/burialSites-byCemeteryId", json={"cemeteryId": "1"}, headers=headers).status_code == 400


@pytest.mark.parametrize("case", REFERENCE["methodCases"], ids=lambda case: case["method"])
def test_http_router_all_read_only_methods_keep_source_query_csv_and_head_length(report_app, case):
    with TestClient(report_app) as client:
        headers = login(client)
        for prefix in ("/api/reports/", "/reports/"):
            path = prefix + case["reportName"]
            if case["method"] in {"POST", "PUT", "PATCH", "DELETE"}:
                assert client.request(case["method"], path, params=case["query"], json=case["body"]).status_code == 403
            response = client.request(case["method"], path, params=case["query"], json=case["body"], headers=headers)
            assert response.status_code == 200
            expected = case["result"]["csv"].encode("utf-8")
            assert response.headers["content-length"] == str(len(expected))
            assert response.content == (b"" if case["method"] == "HEAD" else expected)
            assert response.headers["content-type"] == "text/csv; charset=utf-8"


def test_http_unknown_report_and_invalid_filters_are_controlled_without_sql_injection(report_app):
    with TestClient(report_app) as client:
        login(client)
        unknown = client.get("/api/reports/no-such-report")
        assert unknown.status_code == 404
        assert unknown.json() == {"success": False, "message": "Report Not Found"}
        for path in ("burialSites-byCemeteryId", "contractTransactions-byTransactionDateString?transactionDateString=no-date"):
            assert client.get("/api/reports/" + path).status_code == 400
        assert client.get("/api/reports/burialSites-byCemeteryId?cemeteryId=1&cemeteryId=2").status_code == 400
        injected = client.get("/api/reports/burialSites-byCemeteryId", params={"cemeteryId": "1 OR 1=1"})
        assert injected.status_code == 200 and injected.content == b""
        assert client.get("/api/reports/contracts-all").status_code == 200


@pytest.mark.parametrize("path", ["/api/reports", "/api/reports/contracts-all", "/reports/contracts-all", "/api/reports/no-such-report"])
def test_http_anonymous_reports_are_denied_before_data_and_unknown_report_disclosure(report_app, path):
    with TestClient(report_app) as client:
        response = client.get(path)
        assert response.status_code == 401
        assert "SYN-C-" not in response.text
