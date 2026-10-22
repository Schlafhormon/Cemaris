"""Sunrise print contracts using SQL Server and its original EJS templates.

The Node boundary preserves executable, administrator-installed EJS/index.js
customizations and the source JavaScript helper packages. See Sunrise MIT notice.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from cemaris.burial_sites import get_burial_site
from cemaris.catalogs import CatalogOptions, get_effective_contract_type_prints
from cemaris.contracts import get_contract
from cemaris.db.schema import TABLES
from cemaris.preferences import get_settings, transaction
import sqlalchemy as sa
from cemaris.work_orders import get_work_order

RUNTIME = Path(__file__).resolve().parents[1] / "printing-runtime"
BUILTIN_PRINTS = {
    "screen/contract": {"params": ["contractId"], "title": "Grabnutzungsvertrag"},
    "pdf/workOrder": {"params": ["workOrderId"], "title": "Arbeitsauftrag"},
    "pdf/workOrder-commentLog": {"params": ["workOrderId"], "title": "Arbeitsauftrag – Kommentarprotokoll"},
}


class PrintOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    customizations_path: Path = Path(".")
    print_browser: Literal["chrome", "firefox"] = "chrome"
    print_browser_executable: str | None = None
    print_node_executable: str = "node"
    print_content_disposition: Literal["attachment", "inline"] = "attachment"
    # Public template configuration overrides, using the original dotted keys.
    # Authentication secrets are deliberately not passed into rendering processes.
    print_configuration: dict = Field(default_factory=dict)


class PrintRenderingError(RuntimeError):
    pass


def _renderer_process(command, input):
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", **({"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {"start_new_session": True}))
    try:
        output, error = process.communicate(input, timeout=100)
        return subprocess.CompletedProcess(command, process.returncode, output, error)
    except subprocess.TimeoutExpired:
        # Kill the renderer's browser descendants as well as Node on a hard
        # deadline. Normal Node deadlines close the browser before this fallback.
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW, timeout=10)
        else:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        process.communicate()
        raise


def run_renderer(payload, *, options=None):
    options = options or PrintOptions()
    try:
        result = _renderer_process([options.print_node_executable, str(RUNTIME / "render.mjs")],
            input=json.dumps(payload, ensure_ascii=False, allow_nan=False))
    except (OSError, subprocess.TimeoutExpired) as error:
        raise PrintRenderingError("The EJS printing runtime is unavailable") from error
    if result.returncode:
        logging.getLogger("cemaris.printing").error("EJS renderer failed: %s", result.stderr[-4000:])
        raise PrintRenderingError("Unable to render the selected print template")
    try:
        return json.loads(result.stdout)
    except (ValueError, TypeError) as error:
        raise PrintRenderingError("The EJS printing runtime returned invalid output") from error


def load_print_configs(options=None):
    options = options or PrintOptions()
    configs = {key: {**value, "path": str(RUNTIME / "views/print" / (key + ".ejs"))} for key, value in BUILTIN_PRINTS.items()}
    if options.customizations_path == Path("."):
        return configs
    try:
        custom = run_renderer({"operation": "customizations", "customizationsPath": str(options.customizations_path.resolve())}, options=options)["prints"]
        for name, config in custom.items():
            if not name or name in {".", ".."} or any(char in name for char in '/\\\x00') or not isinstance(config, dict) or not isinstance(config.get("title"), str) or not isinstance(config.get("params"), list) or not all(isinstance(key, str) for key in config["params"]):
                logging.getLogger("cemaris.printing").error("Ignoring invalid customization print configuration %r", name)
                continue
            configs["pdf/" + name] = {**config, "path": str(options.customizations_path.resolve() / "views/print/pdf" / (name + ".ejs"))}
    except (PrintRenderingError, ValueError, KeyError, TypeError, AttributeError):
        # Source logs and ignores an unavailable optional customization module.
        logging.getLogger("cemaris.printing").exception("Unable to load customization print configuration")
    return configs


def get_print_config(configs, name):
    return configs.get("/".join(name.split("/")[:2]))


def browser_executable(options):
    if options.print_browser_executable:
        return options.print_browser_executable
    names = ("firefox",) if options.print_browser == "firefox" else ("chromium", "chromium-browser", "google-chrome", "msedge")
    for name in names:
        executable = shutil.which(name)
        if executable:
            return executable
    windows = [Path(os.environ.get(key, "C:/Program Files")) for key in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA")]
    suffixes = ["Mozilla Firefox/firefox.exe"] if options.print_browser == "firefox" else ["Microsoft/Edge/Application/msedge.exe", "Google/Chrome/Application/chrome.exe"]
    for directory in windows:
        for suffix in suffixes:
            candidate = directory / suffix
            if candidate.is_file():
                return str(candidate)
    raise PrintRenderingError("No configured PDF browser is installed")


def get_report_data(database, config, parameters, *, catalog_options=None):
    data = {"headTitle": config["title"]}
    with transaction(database) as connection:
        if "contractId" in config["params"] and isinstance(parameters.get("contractId"), str):
            contract = get_contract(connection, parameters["contractId"], catalog_options=catalog_options)
            if contract is None:
                raise HTTPException(404, "Contract not found")
            data["contract"] = contract
            if contract.get("burialSiteId", -1) not in (None, -1):
                data["burialSite"] = get_burial_site(connection, contract["burialSiteId"], catalog_options=catalog_options)
        if "workOrderId" in config["params"] and isinstance(parameters.get("workOrderId"), (int, str)):
            work_order = get_work_order(connection, parameters["workOrderId"])
            if work_order is None:
                raise HTTPException(404, "Work order not found")
            # Source getContracts.addPrint always enriches the work-order's
            # nested contracts through the active cached contract type. The
            # shared list reader intentionally avoids this catalog work unless
            # requested, so the print aggregate supplies it here.
            types = TABLES["ContractTypes"]
            for contract in work_order.get("workOrderContracts", []):
                type_id = contract.get("contractTypeId")
                if type_id is None:
                    continue
                contract.pop("printEJS", None)
                if connection.scalar(sa.select(types.c.contractTypeId).where(types.c.contractTypeId == type_id, types.c.recordDelete_timeMillis.is_(None))) is not None:
                    prints = get_effective_contract_type_prints(connection, type_id, options=catalog_options or CatalogOptions())
                    if prints:
                        contract["printEJS"] = prints[0]
            data["workOrder"] = work_order
    return data


def print_configuration(app):
    contract, work, catalog, preferences = app.state.contract_options, app.state.work_order_options, app.state.catalog_options, app.state.preference_options
    auth, burial = app.state.auth_settings, app.state.burial_site_options
    return {
        "application.applicationName": "Cemaris", "application.logoUrl": "/print/branding/logo.png",
        "application.appUrl": app.state.settings.app_url, "reverseProxy.urlPrefix": auth.url_prefix,
        "application.useTestDatabases": auth.use_test_databases,
        "reverseProxy.trafficIsForwarded": auth.traffic_is_forwarded,
        "reverseProxy.disableRateLimit": auth.disable_rate_limit,
        "session.cookieName": auth.cookie_name, "session.doKeepAlive": auth.do_keep_alive, "session.maxAgeMillis": auth.max_age_millis,
        "login.domain": auth.domain,
        "settings.customizationsPath": str(app.state.print_options.customizations_path),
        "settings.addressLabels": contract.address_labels,
        "settings.latitudeMin": burial.latitude_min, "settings.latitudeMax": burial.latitude_max,
        "settings.longitudeMin": burial.longitude_min, "settings.longitudeMax": burial.longitude_max,
        "settings.burialSites.burialSiteNameSegments": burial.burial_site_name_segments,
        "settings.burialSites.burialSiteNameSegments.includeCemeteryKey": burial.burial_site_name_segments.get("includeCemeteryKey", False),
        "settings.burialSites.refreshImageChanges": burial.burial_site_refresh_image_changes,
        "settings.cemeteries.refreshImageChanges": burial.cemetery_refresh_image_changes,
        "settings.contracts.contractEndDateIsAvailable": contract.contract_end_date_is_available,
        "settings.contracts.contractEndDateIsRequired": contract.contract_end_date_is_required,
        "settings.contracts.burialSiteIdIsRequired": contract.contract_burial_site_id_is_required,
        "settings.contracts.contractNumberLength": contract.contract_number_length,
        "settings.contracts.prints": catalog.contract_prints,
        "settings.workOrders.workOrderNumberLength": work.work_order_number_length,
        "settings.workOrders.calendarEmailAddress": work.work_order_calendar_email_address,
        "settings.workOrders.prints": [item[0] for item in work.work_order_calendar_prints],
        "settings.fees.taxPercentageDefault": catalog.fee_tax_percentage_default,
        "settings.auditLog.enabled": preferences.audit_log_enabled,
        "settings.printPdf.browser": app.state.print_options.print_browser,
        "settings.printPdf.contentDisposition": app.state.print_options.print_content_disposition,
        **({"application.attachmentsPath": str(app.state.attachment_options.attachments_path),
            "application.maxAttachmentFileSize": app.state.attachment_options.max_attachment_file_size} if hasattr(app.state, "attachment_options") else {}),
        **app.state.print_options.print_configuration,
        "application.applicationName": "Cemaris",
    }


def render_print(app, database, config, parameters, *, pdf=False, now=None):
    data = get_report_data(database, config, parameters, catalog_options=app.state.catalog_options)
    with transaction(database) as connection:
        settings = {item["settingKey"]: item.get("settingValue") or item["defaultValue"] for item in get_settings(connection)}
    payload = {"operation": "pdf" if pdf else "html", "template": config["path"], "data": data,
        "settings": settings, "configuration": print_configuration(app)}
    if pdf:
        payload["executablePath"] = browser_executable(app.state.print_options)
        payload["browser"] = app.state.print_options.print_browser
    if now is not None:
        payload["now"] = now
    result = run_renderer(payload, options=app.state.print_options)
    return base64.b64decode(result["pdf"]) if pdf else result["html"]


def install_printing(app, *, options=None):
    from cemaris.auth import current_user
    from cemaris.dependencies import get_engine

    app.state.print_options = options or PrintOptions()
    app.state.print_configs = load_print_configs(app.state.print_options)
    custom_titles = {key.removeprefix("pdf/"): config["title"] for key, config in app.state.print_configs.items() if key.startswith("pdf/")}
    app.state.catalog_options.custom_pdf_print_titles.update(custom_titles)
    app.state.work_order_options.work_order_calendar_prints = [(key, (get_print_config(app.state.print_configs, key) or {}).get("title", title))
        for key, title in app.state.work_order_options.work_order_calendar_prints]
    router = APIRouter(tags=["printing"])

    def allowed():
        return [*app.state.catalog_options.contract_prints, *(item[0] for item in app.state.work_order_options.work_order_calendar_prints)]

    @router.get("/api/print/options")
    def choices(request: Request, contractId: int | None = None, workOrderId: int | None = None, type: str | None = None, user=Depends(current_user)):
        if type == "workOrder" and contractId is None and workOrderId is None:
            return {"prints": [{"path": name, "title": config["title"]} for name, _ in app.state.work_order_options.work_order_calendar_prints
                if (config := get_print_config(app.state.print_configs, name)) is not None]}
        if (contractId is None) == (workOrderId is None):
            raise HTTPException(400, "Select one contract or work order")
        with transaction(get_engine(request)) as connection:
            if contractId is not None:
                contract = get_contract(connection, contractId, catalog_options=app.state.catalog_options)
                if contract is None:
                    raise HTTPException(404, "Contract not found")
                names = get_effective_contract_type_prints(connection, contract["contractTypeId"], options=app.state.catalog_options)
            else:
                if get_work_order(connection, workOrderId) is None:
                    raise HTTPException(404, "Work order not found")
                names = [item[0] for item in app.state.work_order_options.work_order_calendar_prints]
        return {"prints": [{"path": name, "title": config["title"]} for name in names if (config := get_print_config(app.state.print_configs, name)) is not None]}

    def redirect(error):
        return RedirectResponse(app.state.auth_settings.url_prefix + "/dashboard/?error=" + error, status_code=302)

    def output(kind, print_name, request):
        name = kind + "/" + print_name
        if name not in allowed():
            return redirect("printConfigNotAllowed")
        config = get_print_config(app.state.print_configs, name)
        if config is None:
            return redirect("printConfigNotFound")
        parameters = dict(request.query_params)
        if any(key in {"contractId", "workOrderId"} and key not in parameters for key in config["params"]):
            raise HTTPException(400, "A required print record identifier is missing")
        try:
            document = render_print(app, get_engine(request), config, parameters, pdf=kind == "pdf")
            if kind == "screen":
                return HTMLResponse(document)
            filename = run_renderer({"operation": "filename", "config": config, "parameters": parameters}, options=app.state.print_options)["filename"]
            # RFC 5987 supports Unicode IDs/titles and prevents header injection.
            from urllib.parse import quote
            filename_ascii = filename.encode("ascii", "ignore").decode().replace('"', "").replace("\r", "").replace("\n", "")
            return Response(document, media_type="application/pdf", headers={"Content-Disposition":
                f'{app.state.print_options.print_content_disposition}; filename="{filename_ascii}"; filename*=UTF-8\'\'{quote(filename)}'})
        except (ValueError, TypeError, OverflowError) as error:
            raise HTTPException(400, "Invalid print record identifier") from error
        except PrintRenderingError as error:
            raise HTTPException(503, str(error)) from error

    @router.get("/print/screen/{print_name}")
    @router.get("/print/screen/{print_name}/", include_in_schema=False)
    @router.get("/api/print/screen/{print_name}", include_in_schema=False)
    @router.get("/api/print/screen/{print_name}/", include_in_schema=False)
    def screen(print_name: str, request: Request, user=Depends(current_user)):
        return output("screen", print_name, request)

    @router.get("/print/pdf/{print_name}")
    @router.get("/print/pdf/{print_name}/", include_in_schema=False)
    @router.get("/api/print/pdf/{print_name}", include_in_schema=False)
    @router.get("/api/print/pdf/{print_name}/", include_in_schema=False)
    def pdf(print_name: str, request: Request, user=Depends(current_user)):
        return output("pdf", print_name, request)

    @router.get("/print/{print_name}")
    def unknown(print_name: str, user=Depends(current_user)):
        return redirect("printConfigNotAllowed")

    @router.get("/print/branding/{asset}", include_in_schema=False)
    @router.get("/api/print/branding/{asset}", include_in_schema=False)
    def branding(asset: str, user=Depends(current_user)):
        if asset not in {"icon.png", "logo.png"}:
            raise HTTPException(404, "Branding asset not found")
        return FileResponse(RUNTIME / "branding" / asset, media_type="image/png")

    @router.get("/public-internal/{filename:path}")
    def internal_asset(filename: str, user=Depends(current_user)):
        if app.state.print_options.customizations_path == Path("."):
            raise HTTPException(404, "Customization asset not found")
        directory = (app.state.print_options.customizations_path / "public-internal").resolve()
        target = (directory / filename).resolve()
        if not target.is_relative_to(directory) or not target.is_file():
            raise HTTPException(404, "Customization asset not found")
        return FileResponse(target)

    app.include_router(router)
