"""German product print snapshots and Sunrise-compatible custom print contracts."""
from copy import deepcopy
from contextlib import nullcontext
from html import escape
import json
from pathlib import Path
import subprocess

from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest

from cemaris import printing
from cemaris.auth_config import AuthSettings
from cemaris.catalogs import CatalogOptions
from cemaris.config import Settings
from cemaris.main import create_app
from cemaris.printing import (BUILTIN_PRINTS, PrintOptions, PrintRenderingError, RUNTIME,
    browser_executable, get_report_data, get_print_config, load_print_configs, run_renderer)

FIXTURES = Path(__file__).parent / "fixtures"
REFERENCE = json.loads((FIXTURES / "printing-reference.json").read_text(encoding="utf-8"))
PRODUCT = json.loads((FIXTURES / "printing-product.json").read_text(encoding="utf-8"))
CUSTOM = FIXTURES / "printing-customizations"
STANDARD_CASES = [case for case in REFERENCE["renders"] if case["name"] in BUILTIN_PRINTS]
CUSTOM_CASES = [case for case in REFERENCE["renders"] if case["name"] not in BUILTIN_PRINTS]
PRODUCT_OUTPUTS = {(case["name"], case["variant"]): case["html"] for case in PRODUCT["renders"]}


def render_standard_case(case):
    return run_renderer({"template": str(RUNTIME / "views/print" / (case["name"] + ".ejs")),
        "data": {**case["data"], "headTitle": BUILTIN_PRINTS[case["name"]]["title"]},
        "settings": REFERENCE["settings"], "configuration": case["configuration"], "now": REFERENCE["clock"]})["html"]


def test_product_snapshots_cover_all_historical_standard_inputs():
    assert PRODUCT["inputFixture"] == "printing-reference.json"
    assert set(PRODUCT_OUTPUTS) == {(case["name"], case["variant"]) for case in STANDARD_CASES}


@pytest.mark.parametrize("case", STANDARD_CASES, ids=lambda value: value["name"] + ":" + value["variant"])
def test_product_standard_ejs_output(case, monkeypatch):
    monkeypatch.setenv("TZ", "Europe/Berlin")
    html = render_standard_case(case)
    assert 'lang="de"' in html and 'size: A4' in html
    assert BUILTIN_PRINTS[case["name"]]["title"] in html
    if case["name"].startswith("screen/"):
        assert "bulma" in html and "@media print" in html
        assert "Cemaris" in html and "/print/branding/icon.png" in html
        html = html[html.index("<h1"):html.index("</main>")]
    assert html == PRODUCT_OUTPUTS[(case["name"], case["variant"])]


@pytest.mark.parametrize("case", CUSTOM_CASES, ids=lambda value: value["name"] + ":" + value["variant"])
def test_original_custom_ejs_output(case, monkeypatch):
    monkeypatch.setenv("TZ", "Europe/Berlin")
    template = CUSTOM / "views/print/pdf/synthetic.ejs"
    html = run_renderer({"template": str(template), "data": case["data"], "settings": REFERENCE["settings"],
        "configuration": case["configuration"], "now": REFERENCE["clock"]})["html"]
    assert html == case["html"]


def test_product_contract_print_preserves_actual_field_and_comment_values():
    case = deepcopy(next(case for case in STANDARD_CASES if case["name"] == "screen/contract" and case["variant"] == "full"))
    field_value = "Aktenzeichen <Kommunal & 2026>"
    comment_value = "Prüfnotiz <sichtbar & vollständig>"
    case["data"]["contract"]["contractFields"][0].update(fieldValue=field_value, contractFieldValue="Unused legacy field")
    case["data"]["contract"]["contractComments"][0].update(comment=comment_value, contractComment="Unused legacy comment")
    html = render_standard_case(case)
    assert escape(field_value) in html and escape(comment_value) in html
    assert field_value not in html and comment_value not in html
    assert "Unused legacy" not in html
    assert "20.10.2026" in html and "09:05" in html
    assert "10,50\u00a0€" in html
    assert "$" not in html


@pytest.mark.parametrize("case", REFERENCE["filenames"], ids=lambda value: value["title"] + ":" + value["id"])
def test_original_export_filenames(case):
    result = run_renderer({"operation": "filename", "config": {"title": case["title"], "params": ["workOrderId"]}, "parameters": {"workOrderId": case["id"]}})
    assert result["filename"] == case["filename"]


@pytest.mark.parametrize("value", ["pdf/workOrder", "pdf/workOrder/extra", "screen/contract/extra"])
def test_source_registry_uses_first_two_segments(value):
    assert get_print_config(load_print_configs(), value)["title"] == BUILTIN_PRINTS["/".join(value.split("/")[:2])]["title"]


def test_custom_index_module_original_ejs_contract_helpers():
    options = PrintOptions(_env_file=None, customizations_path=CUSTOM)
    config = load_print_configs(options)["pdf/synthetic"]
    assert config["params"] == ["contractId"]
    assert config["title"] == "Synthetic Custom Print"
    assert config["path"] == str(CUSTOM.resolve() / "views/print/pdf/synthetic.ejs")
    assert load_print_configs(PrintOptions(_env_file=None, customizations_path=CUSTOM / "missing")) == load_print_configs()


def test_original_custom_print_names_builtin_overrides_and_logging(tmp_path):
    (tmp_path / "package.json").write_text('{"type":"module"}', encoding="utf-8")
    (tmp_path / "index.js").write_text("console.log('Synthetic module log'); export default {prints:{pdf:{'receipt.v2 Ä':{title:'Synthetic Unicode',params:['contractId']},'workOrder':{title:'Overridden Field Sheet',params:['workOrderId']},'../invalid':{title:'invalid',params:[]}}}}", encoding="utf-8")
    options = PrintOptions(_env_file=None, customizations_path=tmp_path)
    configs = load_print_configs(options)
    assert configs["pdf/receipt.v2 Ä"]["title"] == "Synthetic Unicode"
    assert configs["pdf/workOrder"]["title"] == "Overridden Field Sheet"
    assert "pdf/../invalid" not in configs
    template = tmp_path / "logged.ejs"
    template.write_text("<% console.log('Synthetic EJS log') %>rendered", encoding="utf-8")
    assert run_renderer({"template": str(template)})["html"] == "rendered"


@pytest.mark.parametrize("failure", ["missing", "timeout", "invalid", "nonzero"])
def test_runtime_errors_are_controlled(monkeypatch, failure):
    def invoke(*args, **kwargs):
        if failure == "missing":
            raise FileNotFoundError()
        if failure == "timeout":
            raise subprocess.TimeoutExpired("node", 100)
        return subprocess.CompletedProcess([], 1 if failure == "nonzero" else 0, "invalid", "Synthetic error")
    monkeypatch.setattr(printing, "_renderer_process", invoke)
    with pytest.raises(PrintRenderingError):
        run_renderer({})


@pytest.mark.parametrize("kind,query,expected", [("screen/contract", {"contractId": "7"}, ["contract", "burialSite"]),
    ("screen/contract", {"contractId": 7}, []), ("pdf/workOrder", {"workOrderId": "11"}, ["workOrder"]),
    ("pdf/workOrder", {"workOrderId": 11}, ["workOrder"]), ("pdf/workOrder", {}, [])])
def test_source_report_parameters(monkeypatch, kind, query, expected):
    monkeypatch.setattr(printing, "transaction", lambda database: nullcontext(None))
    monkeypatch.setattr(printing, "get_contract", lambda *args, **kwargs: REFERENCE["contract"])
    monkeypatch.setattr(printing, "get_burial_site", lambda *args, **kwargs: REFERENCE["burialSite"])
    monkeypatch.setattr(printing, "get_work_order", lambda *args, **kwargs: REFERENCE["workOrder"])
    data = get_report_data(None, BUILTIN_PRINTS[kind], query)
    assert sorted(key for key in data if key != "headTitle") == sorted(expected)


def test_source_missing_parent_becomes_controlled_404(monkeypatch):
    monkeypatch.setattr(printing, "transaction", lambda database: nullcontext(None))
    monkeypatch.setattr(printing, "get_contract", lambda *args, **kwargs: None)
    with pytest.raises(HTTPException) as error:
        get_report_data(None, BUILTIN_PRINTS["screen/contract"], {"contractId": "missing"})
    assert error.value.status_code == 404


@pytest.mark.parametrize("browser", ["chrome", "firefox"])
def test_explicit_browser_configuration(browser):
    options = PrintOptions(_env_file=None, print_browser=browser, print_browser_executable="/synthetic/selected-browser")
    assert browser_executable(options) == "/synthetic/selected-browser"


@pytest.mark.parametrize("browser,wait_until", [("chrome", "networkidle0"), ("firefox", "domcontentloaded")])
def test_pdf_utf8_transport_a4_paper_background_and_browser_lifecycle(browser, wait_until):
    result = subprocess.run(["node", str(Path(__file__).parent / "printing_runtime_probe.mjs"), browser],
        capture_output=True, text=True, encoding="utf-8", timeout=15, check=True)
    calls = json.loads(result.stdout)
    assert calls[0]["launch"]["browser"] == browser
    assert calls[0]["launch"]["executablePath"] == "/synthetic/browser"
    url = calls[1]["url"]
    assert url.startswith("data:text/html;charset=utf-8;base64,")
    import base64
    assert base64.b64decode(url.split(",", 1)[1]).decode("utf-8") == "<html><body>Übung Ä ß</body></html>"
    assert calls[1]["options"]["waitUntil"] == wait_until
    assert calls[2]["pdf"] == {"format": "A4", "printBackground": True}
    assert calls[-1] == {"closed": True}


def test_print_routes_require_session_and_keep_source_allowlist_redirects(tmp_path):
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\reader": "synthetic-password"}},
        can_login=["reader"], is_admin=[], session_directory=tmp_path)
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        catalog_options=CatalogOptions(_env_file=None, contract_prints=["screen/contract", "pdf/missing"]), print_options=PrintOptions(_env_file=None))
    # Authentication itself is exercised by existing SQL suites; this test uses
    # the same current_user dependency to isolate print routes from SQL.
    from cemaris.auth import current_user
    with TestClient(app) as client:
        assert client.get("/print/screen/contract?contractId=7").status_code == 401
        assert client.get("/api/print/options?type=workOrder").status_code == 401
        app.dependency_overrides[current_user] = lambda: {"username": "reader", "userProperties": {}}
        for url, error in [("/print/pdf/disabled", "printConfigNotAllowed"), ("/print/pdf/missing", "printConfigNotFound"), ("/print/unknown", "printConfigNotAllowed")]:
            response = client.get(url, follow_redirects=False)
            assert response.status_code == 302
            assert response.headers["location"] == "/dashboard/?error=" + error
        assert client.get("/print/screen/contract").status_code == 400
        assert len(client.get("/api/print/options?type=workOrder").json()["prints"]) == 2


def test_custom_catalog_titles_calendar_and_internal_assets(tmp_path):
    from cemaris.auth import current_user
    app = create_app(Settings(_env_file=None, environment="test"),
        auth_settings=AuthSettings(_env_file=None, session_directory=tmp_path),
        catalog_options=CatalogOptions(_env_file=None, contract_prints=["pdf/synthetic"]),
        print_options=PrintOptions(_env_file=None, customizations_path=CUSTOM))
    assert app.state.catalog_options.custom_pdf_print_titles["synthetic"] == "Synthetic Custom Print"
    app.dependency_overrides[current_user] = lambda: {"username": "reader"}
    with TestClient(app) as client:
        response = client.get("/public-internal/synthetic.txt")
        assert response.status_code == 200 and response.text.startswith("Synthetic customization")
        assert client.get("/public-internal/%2e%2e/index.js").status_code == 404
        assert client.get("/public-internal/missing.txt").status_code == 404


def test_source_default_configuration_and_null_fallback_are_retained(tmp_path):
    template = tmp_path / "helpers.ejs"
    template.write_text("<%= configFunctions.getConfigProperty('settings.latitudeMax', 1) %>|<%= configFunctions.getConfigProperty('synthetic.null', 2) === null %>|<%= configFunctions.getConfigProperty('synthetic.undefined', 3) %>|<%= configFunctions.keepAliveMillis %>|<%= Object.keys(configFunctions).sort().join(',') %>", encoding="utf-8")
    rendered = run_renderer({"template": str(template), "configuration": {"synthetic.null": None, "session.doKeepAlive": True, "session.maxAgeMillis": 20000}})["html"]
    assert rendered == "90|true|3|10000|default,getConfigProperty,isAuditLoggingEnabled,keepAliveMillis"
