"""Print aggregates, access and HTTP output on disposable Microsoft SQL Server."""
import base64
from pathlib import Path

from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris import printing
from cemaris.auth_config import AuthSettings
from cemaris.catalogs import CatalogOptions
from cemaris.config import Settings
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import update_setting
from cemaris.printing import BUILTIN_PRINTS, PrintOptions, get_report_data

CUSTOM = Path(__file__).parent / "fixtures/printing-customizations"


@pytest.fixture
def print_sql_app(sql_connection, tmp_path):
    connection, name = sql_connection
    ids = load_synthetic_fixtures(connection, expected_database=name).ids
    app = create_app(Settings(_env_file=None, environment="test"),
        auth_settings=AuthSettings(_env_file=None, type="plainText", config={"users": {"\\fixture_reader": "synthetic-reader-password"}},
            can_login=["fixture_reader"], is_admin=[], session_directory=tmp_path / "sessions"),
        catalog_options=CatalogOptions(_env_file=None, contract_prints=["screen/contract", "pdf/synthetic"]),
        print_options=PrintOptions(_env_file=None, customizations_path=CUSTOM))
    app.state.db_engine, app.state.print_test_ids = connection, ids
    return app, connection, ids


def login(client):
    token = client.get("/api/session").json()["csrfToken"]
    result = client.post("/api/login", json={"username": "fixture_reader", "password": "synthetic-reader-password"}, headers={"X-CSRF-Token": token})
    assert result.status_code == 200, result.text
    assert result.json()["user"]["userProperties"]["canUpdateContracts"] is False


def test_real_print_aggregate_preserves_all_source_consumers(print_sql_app):
    app, connection, ids = print_sql_app
    data = get_report_data(connection, BUILTIN_PRINTS["screen/contract"], {"contractId": str(ids["contract"])}, catalog_options=app.state.catalog_options)
    contract = data["contract"]
    assert data["burialSite"]["burialSiteId"] == ids["burial_site"]
    assert contract["cemeteryName"] == "Übungsfeld Nord"
    assert contract["contractInterments"][0]["deceasedName"] == "Übungsperson Gamma (synthetisch)"
    assert contract["contractFields"][0]["fieldValue"] == "Synthetische Verknüpfung"
    assert len(contract["contractComments"]) == 1
    assert contract["contractComments"][0]["comment"] == "Aktiver synthetischer Kommentar."
    assert "contractFieldValue" not in contract["contractFields"][0]
    assert "contractComment" not in contract["contractComments"][0]
    assert contract["contractFees"][0]["quantity"] == 1.5
    assert contract["contractTransactions"][0]["transactionAmount"] == 220.35825
    assert contract["contractAttachments"] and contract["contractServiceTypes"] and contract["relatedContracts"]
    work = get_report_data(connection, BUILTIN_PRINTS["pdf/workOrder"], {"workOrderId": str(ids["work_order"])})["workOrder"]
    assert work["workOrderBurialSites"][0]["cemeteryName"] == "Übungsfeld Nord"
    assert work["workOrderContracts"][0]["contractInterments"][0]["deceasedName"].startswith("Übungsperson")
    assert work["workOrderContracts"][0]["printEJS"] == "screen/contract"
    assert work["workOrderComments"][0]["comment"] == "Synthetische Arbeitsnotiz."
    assert work["workOrderMilestones"][0]["workOrderMilestoneTime"] is None


def test_reader_german_screen_preserves_field_and_comment_values(print_sql_app):
    app, connection, ids = print_sql_app
    with TestClient(app) as client:
        assert client.get(f'/print/screen/contract?contractId={ids["contract"]}&apiKey=synthetic-key').status_code == 401
        login(client)
        result = client.get(f'/print/screen/contract?contractId={ids["contract"]}')
        assert result.status_code == 200 and result.headers["content-type"].startswith("text/html")
        assert "Übungsperson Gamma" in result.text and "Übungsfeld Nord" in result.text
        assert "Synthetische Verknüpfung" in result.text
        assert "Aktiver synthetischer Kommentar." in result.text and "Kommentare" in result.text
        assert "fixture_admin" in result.text and "Gesamtbetrag" in result.text
        assert 'lang="de"' in result.text and "220,36\u00a0€" in result.text
        assert "$" not in result.text and "(No Value)" not in result.text
        assert client.get("/print/branding/icon.png").status_code == 200


@pytest.mark.parametrize("wildcard", [False, True])
def test_contract_print_selection_assignments_and_star(print_sql_app, wildcard):
    app, connection, ids = print_sql_app
    prints = TABLES["ContractTypePrints"]
    if wildcard:
        connection.execute(prints.update().where(prints.c.contractTypeId == ids["contract_type"]).values(printEJS="*"))
    with TestClient(app) as client:
        login(client)
        selected = client.get(f'/api/print/options?contractId={ids["contract"]}').json()["prints"]
        assert [item["path"] for item in selected] == (["screen/contract", "pdf/synthetic"] if wildcard else ["screen/contract"])
        assert selected[0]["title"] == "Grabnutzungsvertrag"
        if wildcard:
            assert selected[1]["title"] == "Synthetic Custom Print"
        assert [item["path"] for item in client.get(f'/api/print/options?workOrderId={ids["work_order"]}').json()["prints"]] == ["pdf/workOrder", "pdf/workOrder-commentLog"]


@pytest.mark.parametrize("deleted_type", [False, True])
def test_nested_work_order_print_selection_uses_active_contract_type(print_sql_app, deleted_type):
    app, connection, ids = print_sql_app
    if deleted_type:
        connection.execute(TABLES["ContractTypes"].update().where(TABLES["ContractTypes"].c.contractTypeId == ids["contract_type"])
            .values(recordDelete_username="synthetic-delete", recordDelete_timeMillis=1))
    else:
        connection.execute(TABLES["ContractTypePrints"].update().where(TABLES["ContractTypePrints"].c.contractTypeId == ids["contract_type"])
            .values(printEJS="*"))
        app.state.catalog_options.contract_prints = ["pdf/synthetic", "screen/contract"]
    data = get_report_data(connection, BUILTIN_PRINTS["pdf/workOrder"], {"workOrderId": str(ids["work_order"])}, catalog_options=app.state.catalog_options)
    contract = data["workOrder"]["workOrderContracts"][0]
    if deleted_type:
        assert "printEJS" not in contract
    else:
        assert contract["printEJS"] == "pdf/synthetic"


@pytest.mark.parametrize("disposition", ["inline", "attachment"])
def test_pdf_headers_renderer_payload_reads_sql_settings_relations(print_sql_app, monkeypatch, disposition):
    app, connection, ids = print_sql_app
    app.state.print_options.print_content_disposition = disposition
    app.state.print_options.print_browser_executable = "/synthetic/browser"
    update_setting(connection, "aliases.workOrderOpenDate", "Synthetic SQL Open Date")
    calls = []
    def render(payload, **kwargs):
        calls.append(payload)
        if payload.get("operation") == "filename":
            return {"filename": f'arbeitsauftrag-{ids["work_order"]}.pdf'}
        return {"pdf": base64.b64encode(b"%PDF-SYNTHETIC-RENDERER-BOUNDARY").decode()}
    monkeypatch.setattr(printing, "run_renderer", render)
    with TestClient(app) as client:
        login(client)
        # All source URL spellings must work without redirects to another origin.
        result = client.get(f'/print/pdf/workOrder/?workOrderId={ids["work_order"]}', follow_redirects=False)
        assert result.status_code == 200 and result.content.startswith(b"%PDF-")
        assert result.headers["content-type"] == "application/pdf"
        assert result.headers["content-disposition"].startswith(disposition + ";")
        assert f'arbeitsauftrag-{ids["work_order"]}.pdf' in result.headers["content-disposition"]
    payload = calls[0]
    assert payload["data"]["headTitle"] == "Arbeitsauftrag"
    assert payload["settings"]["aliases.workOrderOpenDate"] == "Synthetic SQL Open Date"
    assert payload["data"]["workOrder"]["workOrderComments"]
    assert payload["data"]["workOrder"]["workOrderContracts"][0]["contractInterments"]
    assert payload["data"]["workOrder"]["workOrderBurialSites"]
    assert payload["data"]["workOrder"]["workOrderMilestones"]
    assert "login.authentication" not in payload["configuration"]
    assert calls[1]["parameters"]["workOrderId"] == str(ids["work_order"])


@pytest.mark.parametrize("kind,table,key", [("screen/contract", "Contracts", "contractId"), ("pdf/workOrder", "WorkOrders", "workOrderId")])
@pytest.mark.parametrize("deleted", [False, True])
def test_missing_deleted_print_parents_are_controlled_404(print_sql_app, kind, table, key, deleted):
    app, connection, ids = print_sql_app
    identifier = ids["contract"] if table == "Contracts" else ids["work_order"]
    if deleted:
        connection.execute(TABLES[table].update().where(TABLES[table].c[key] == identifier).values(recordDelete_timeMillis=1, recordDelete_username="synthetic-delete"))
    else:
        identifier = 999999
    with pytest.raises(HTTPException) as error:
        get_report_data(connection, BUILTIN_PRINTS[kind], {key: str(identifier)}, catalog_options=app.state.catalog_options)
    assert error.value.status_code == 404
    with TestClient(app) as client:
        login(client)
        response = client.get(f'/print/{kind}?{key}={identifier}')
        assert response.status_code == 404
