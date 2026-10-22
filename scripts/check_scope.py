"""Check the complete frozen Sunrise source inventory without changing the reference.

Run with Python's standard library only. --refresh rebuilds static inventory fields,
preserves recorded implementation/status fields and renders the Markdown worklist.
Normal verification never writes a file or starts the reference application.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT.parent / "Sunrise-Referenz"
COMMIT = "451ce034863b16502484367044f3e9b65370111a"
INVENTORY = ROOT / "docs/portierung/QUELLINVENTAR.json"
WORKLIST = ROOT / "docs/portierung/UMFANG.md"
SOURCE_CACHE: dict[str, str] = {}


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(REFERENCE), *args], encoding="utf-8"
    ).strip()


def stable_id(prefix: str, key: str) -> str:
    return prefix + "-" + hashlib.sha256(key.encode()).hexdigest()[:12]


def source_text(path: str) -> str:
    if path not in SOURCE_CACHE:
        SOURCE_CACHE[path] = git("show", f"{COMMIT}:{path}")
    return SOURCE_CACHE[path]


def step_for(path: str) -> int:
    """Primary owner; features can list additional contributing steps explicitly."""
    p = path.lower()
    explicit = {
        "app/app.ts": 3, "app/appprocess.ts": 15, "index.ts": 15,
        "helpers/api.helpers.ts": 12, "helpers/app.helpers.ts": 15,
        "helpers/images.helpers.ts": 6, "helpers/cache.helpers.ts": 4,
        "helpers/datalists.ts": 8, "public/html/quicksearch.html": 12,
        "public/javascripts/main.ts": 3, "public/javascripts/theme.ts": 3,
        "public/javascripts/search.ts": 12,
        # This dialog is used only by workOrder.editRelated, never the map.
        "public/html/burialsite-editburialsitestatus.html": 10,
        "views/_header.ejs": 3, "views/_footera.ejs": 3,
        "views/_footerb.ejs": 3,
        # Shared catalog CRUD is implemented with its first real consumers.
        "database/addrecord.ts": 4, "database/deleterecord.ts": 4,
        "database/moverecord.ts": 4, "database/updaterecord.ts": 4,
        "database/updaterecordordernumber.ts": 4,
        "types/app.types.ts": 3, "types/config.types.ts": 3,
        "types/setting.types.ts": 3,
    }
    if p in explicit:
        return explicit[p]
    if "consigno" in p or "integrations/ntfy" in p:
        return 13
    if "dynamics" in p or "portal" in p or "orderform" in p:
        return 14
    if p.startswith(("cli/", "temp/")):
        return 12
    if p.startswith("views/print/") or any(
        x in p for x in ("attachment", "print.helpers", "pdf.helpers", "customizations.helpers", "printget", "routes/print", "puppeteersetup", "contracttypeprint", "contractprints")
    ):
        return 11
    if any(x in p for x in ("backup", "cleanup", "auditlog", "audit.log", "getauditable", "purgeaudit", "windowsservice", "record.audit", "database.admin")):
        return 15
    if p.startswith("handlers/adminget/database") or p.startswith("views/admin/database") or p.endswith("/database.cy.ts"):
        return 15
    if p in ("routes/admin.ts", "routes/admin.js"):
        return 4
    if any(x in p for x in ("partialdate", "sqlfilters", "database/initializedatabase", "helpers/database.helpers", "types/record.types", "test/0.initializedatabase")):
        return 2
    if p.startswith("helpers/cache/"):
        return 3 if "settings" in p or "apikey" in p else 4
    if any(x in p for x in ("user", "authentication", "permission", "login", "keepalive", "locales/", "i18n", "settings.admin", "adminget/settings", "doupdatesetting", "database/getsettings", "database/updatesetting", "views/admin/settings", "settings.cy")):
        return 3
    if any(x in p for x in ("gps", "map.", "/map", "creator", "range", "latitude", "longitude", "findagrave", "forsvg", "coordinat", "helpers/burialsites.helpers", "helpers.burialsites")):
        return 6
    if p.startswith(("handlers/adminget/", "handlers/adminpost/", "views/admin/", "cypress/e2e/01admin/")):
        return 4
    if "contractfeecategor" in p:
        return 9
    if any(x in p for x in ("burialsitetype", "contracttype", "committaltype", "intermentcontainertype", "intermentdepth", "feetypes", "feecategor", "database/getservicetypes", "database/addservicetype", "database/updateservicetype", "database/deleteservicetype")):
        return 4
    if p.startswith("public/html/admin") or ".admin." in p:
        return 4
    if any(x in p for x in ("fee", "transaction", "contracts.helpers")):
        return 9
    if any(x in p for x in ("workorder", "workday", "milestone", "ics", ".ical")):
        return 10
    if any(x in p for x in ("contractinterment", "contractservicetype", "-interments", "-services", "editinterments", "editservicetypes", "contract-addinterment", "contract-editinterment", "contract-addservicetype", "contract-editservicetype")):
        return 8
    if any(x in p for x in ("cemeter", "burialsite", "burialsites")):
        return 5
    if any(x in p for x in ("contract", "funeralhome", "related")):
        return 7
    if any(x in p for x in ("report", "dashboard", "updatelog", "apikey", "apiget", "routes/api", "data.record")):
        return 12
    if p.startswith("database/"):
        return 2
    if p.startswith(("helpers/config", "helpers/settings", "tasks/")) or "partialconfig" in p or p.startswith(".env/"):
        return 15
    if p.startswith(("test/", "cypress/")):
        return 16
    if p.startswith(("data/", "public-internal/")):
        return 15
    if p.startswith("types/"):
        return 2
    return 16


def kind_for(path: str) -> str:
    if path.startswith("routes/") and path.endswith(".ts"):
        return "route"
    if path.startswith("handlers/") and path.endswith(".ts"):
        return "handler"
    if path.startswith("database/") and path.endswith(".ts"):
        return "database_module"
    if path.startswith("public/javascripts/") and path.endswith(".ts"):
        return "browser_ts"
    if path.startswith("public/html/"):
        return "dialog"
    if path.startswith("locales/"):
        return "locale"
    if path.endswith(".ejs"):
        return "view"
    if path.startswith("cypress/e2e/") and path.endswith(".ts"):
        return "cypress_test"
    if path.startswith("test/") and path.endswith(".ts"):
        return "source_test"
    if path.startswith("integrations/") and path.endswith(".ts"):
        return "integration"
    if path.startswith(("cli/", "temp/")) and path.endswith(".ts"):
        return "import_tool"
    if path.startswith("helpers/") and path.endswith(".ts"):
        return "helper"
    if path.startswith("tasks/") and path.endswith(".ts"):
        return "task"
    return "support"


def module_evidence(path: str, text: str) -> dict:
    imports = sorted(set(re.findall(r"(?:from\s+|import\s*\()(['\"])(.*?)\1", text)))
    modules = [item[1] for item in imports]
    return {
        "imports": modules,
        "exported_symbols": sorted(set(re.findall(r"export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+(\w+)", text))),
        "request_fields": sorted(set(re.findall(r"request\.(?:body|query|params)\.(\w+)", text))),
        "http_routes": [
            {"method": method.upper(), "path": route, "line": text.count("\n", 0, match.start()) + 1}
            for match in re.finditer(r"\.(get|post|all|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]", text)
            for method, route in [match.groups()]
        ] if path.startswith(("routes/", "app/")) else [],
        "test_cases": re.findall(r"(?:describe|it|test)\(\s*['\"]([^'\"]+)['\"]", text) if kind_for(path) in ("source_test", "cypress_test") else [],
    }


SPECIAL_EXPECTATIONS = {
    "app/app.ts": "Anwendungsaufbau, Navigation, lokale Assets, Fehlerseiten und Version; Sitzungen, CSRF, Rate-Limit, An-/Abmeldung, geschützte Routen und KeepAlive entsprechend der Quelle übertragen.",
    "app/appProcess.ts": "HTTP-Prozess starten, Prozessmeldungen und geordnetes Beenden entsprechend der Referenz; konkrete Laufzeitumsetzung für Python dokumentieren.",
    "index.ts": "Konfiguration laden, Datenbank und Hintergrundaufgaben initialisieren sowie Prozesse starten/beenden; Fach- und Betriebsinitialisierung bleibt Schritt 02/15.",
    "helpers/functions.fee.ts": "Gebührenfunktion vorhanden: Betrag zunächst 0; sonst feeAmount oder 0. Prozentsteuer feeAmount * taxPercentage / 100, sonst fester taxAmount oder 0. Keine stillschweigende neue Gebührenformel.",
    "helpers/contracts.helpers.ts": "Gebühren nach Kategorie ohne Groß-/Kleinschreibung exakt/enthält filtern; Feldwert anhand Feldbezeichnung suchen; Transaktionsbeträge summieren.",
    "helpers/partialDate.helpers.ts": "YYYYMMDD mit unbekanntem Monat/Tag 00; Jahr <= 0 wird verworfen, Monat auf 0..12 und Tag auf 0..31 begrenzt; Anzeige Jahr/Jahr-Monat/Volldatum und Extraktion übertragen.",
    "helpers/functions.sqlFilters.ts": "Grabname: Anfang/Ende oder alle eindeutigen kleingeschriebenen Wortteile; Verstorbene/Käufer: alle Wortteile; laufend einschließlich Datumsgrenzen und NULL-Ende, künftig Start > heute, vergangen Ende < heute.",
    "helpers/authentication.helpers.ts": "activeDirectory, adWebAuth, function und plainText einschließlich Domain; leere Anmeldedaten verweigern; Testkonten ausschließlich im Testmodus; zugelassene Redirects und Fallback übertragen.",
    "helpers/i18n.helpers.ts": "en/de, Fallback en; Namensräume app/admin/login/errors; Sprachwahl Query lng vor Cookie i18next vor Header und vollständige Übersetzungs-/Fallback-Regeln übertragen.",
    "handlers/permissions.ts": "Quellrechte für Administrator sowie Friedhofs-, Vertrags- und Arbeitsauftragsänderungen und API-Schlüssel; getrennte GET-/POST-Ablehnungen übertragen.",
    "helpers/config.defaults.ts": "Alle Anwendungs-, Proxy-, Sitzungs-, Rechte-, Fach-, Druck-, Audit-, Backup- und Integrationsoptionen erhalten; Umsetzung entsprechend Fachschritt und Betriebszuordnung nachweisen.",
    "helpers/config.helpers.ts": "Konfigurationsquellen, Typen, Defaults und Änderungen nachvollziehen; vollständige kompatible Semantik mit Fachverbrauchern und Betrieb abgleichen.",
    "helpers/print.helpers.ts": "Vertrags-Bildschirmdruck, Arbeitsauftrag-PDF und Kommentarprotokoll, Druckparameter, Konfigurationsauswahl und individuelle PDF-Vorlagen; Barcode- und Fachdaten in Ausgabe erhalten.",
    "helpers/reports.helpers.ts": "Alle registrierten Rohdaten- und formatierten Berichte einschließlich gelöschter Rohdatensätze bzw. Filter der formatierten Berichte mit identischen Spalten und Sortierungen übertragen.",
    "database/initializeDatabase.ts": "Alle 41 Tabellen, Indizes, Fremdschlüssel, Defaults, CHECKs, Audit-/Löschspalten und synthetische Anfangsdaten nach SQL Server abbilden; keine vorhandene Verwaltungsdatenbank verwenden.",
}


def expectation(path: str, evidence: dict, text: str) -> str:
    if path in SPECIAL_EXPECTATIONS:
        return SPECIAL_EXPECTATIONS[path]
    stem = Path(path).stem
    kind = kind_for(path)
    if kind == "route":
        return "Routen, HTTP-Methoden, Weiterleitungen, Rechte und optionale Aktivierung für " + stem + " erhalten; einzelne Handler separat erfasst."
    if kind == "handler":
        calls = sorted(set(re.findall(r"(?:from\s+|import\s*\()['\"][^'\"]*/database/([^'\"/]+)\.js", text)))
        result = "HTTP-Aktion " + stem + " mit Quellvalidierung, Berechtigung und Erfolgs-/Fehlerantwort übertragen."
        if calls:
            result += " Datenoperationen: " + ", ".join(calls) + "."
        return result
    if kind == "database_module":
        return "Datenoperation " + stem + ": Eingaben, WHERE-/JOIN-Regeln, Sortierung, NULL/Leerwerte, Rückgabe und Audit-/Löschverhalten erhalten; SQL-Server-Rundlauf erforderlich."
    if kind == "browser_ts":
        return "Browserablauf " + stem + ": Eingaben, Filter, Ereignisse, Dialoge, Requests und sichtbare Ergebnisse in React übertragen."
    if kind == "dialog":
        fields = sorted(set(re.findall(r'name="([^"]+)"', text)))
        return "Dialog " + stem + ": Felder, Vorgaben, Pflichtfelder und Bestätigung/Abbruch erhalten." + (" Eingaben: " + ", ".join(fields) + "." if fields else "")
    if kind == "view":
        return "Seite/Fragment " + path.removeprefix("views/") + ": Inhalte, Felder, Navigation, bedingte Sichtbarkeit und Bedienablauf in React bzw. Druckrenderer übertragen."
    if kind == "locale":
        values = json.loads(text)
        return "Übersetzungskatalog " + path.removeprefix("locales/") + " mit " + str(len(values)) + " Schlüsseln auf oberster Ebene; Texte, Interpolation und Sprachfallback erhalten, Produktbranding anpassen."
    if kind in ("cypress_test", "source_test"):
        cases = evidence["test_cases"]
        return "Referenzfälle " + stem + " als Vergleichsfälle übertragen und gegen Cemaris ausführen." + (" Gruppen/Fälle: " + "; ".join(cases[:4]) + ("; weitere Fälle im Quellinventar." if len(cases) > 4 else ".") if cases else "")
    if kind == "integration":
        return "Integrationsfunktion " + path.removeprefix("integrations/") + ": Konfiguration, Payloads, Rückmeldungen, Wiederholungen und Fehlerzustände erhalten; Vertragstest und späterer Live-Nachweis offen."
    if kind == "import_tool":
        return "Vorhandenes Importwerkzeug/-mapping " + path + " mit Format, Zuordnungen, Validierungen und Laufreihenfolge übertragen; synthetische Dateien prüfen. Eigenständiger EDWALT-Auftrag bleibt separat."
    if kind == "task":
        return "Betriebsaufgabe " + stem + ": Aktivierung, Zeitplan, Ablauf und Fehlerbehandlung für Python/SQL Server nachvollziehen."
    if kind == "helper":
        return "Gemeinsame Regeln " + stem + " mit aufrufenden Funktionen und Randfällen übertragen. Exporte: " + ", ".join(evidence["exported_symbols"]) + "."
    if path.startswith("types/"):
        return "Daten-/Konfigurationsvertrag " + stem + ": Felder, optionale Werte und zulässige Zustände in Python-/API-/React-Typen erhalten."
    if "config" in path.lower() or path.startswith(".env/"):
        return "Konfiguration " + path + " erfassen; verwendete Laufzeitoptionen und Testszenarien im Ziel zuordnen, technische Abweichungen dokumentieren."
    if path.endswith((".png", ".jpg", ".ico", ".svg", ".css", ".scss")):
        return "Statisches Darstellungs-/Hilfsasset " + path + " zuordnen; notwendige Inhalte erhalten und Sunrise-Produktbranding durch Cemaris ersetzen."
    if path.endswith(".md"):
        return "Dokumentations-/Lizenzquelle " + path + " als Funktions- und Betriebshinweis abgleichen; übernommene Lizenz-/Copyright-Hinweise bewahren."
    return "Quellartefakt " + path + " technisch zuordnen und beim Gesamtvergleich berücksichtigen; seine unveränderte Übernahme ist kein eigener fachlicher Implementierungsauftrag."


def reference_only(path: str) -> bool:
    """Documentation/tooling is covered, without requiring an obsolete tool port."""
    return (
        path.startswith((".github/", ".vscode/", "docs/"))
        or path.endswith(".md")
        or path in {
            ".deepsource.toml", ".editorconfig", ".gitattributes", ".gitignore",
            ".markdownlint.json", ".prettierignore", "_config.yml", "cspell.json",
            "eslint.config.ts", "prettier.config.ts", "nodemon.json", "tsconfig.json",
            "public/javascripts/tsconfig.json", "cypress.config.ts", ".puppeteerrc.cjs",
            "package.json", "package-lock.json", "debug.config.ts",
        }
    )


PACKAGE_STEPS = {
    "sunrise-cms-shared": 14, "sunrise-cms-customizations": 11,
    "@cityssm/cemetery-utils": 6, "@cityssm/fill-block-range": 6,
    "@cityssm/authentication-helper": 3, "@cityssm/express-abuse-points": 3,
    "@cityssm/consigno-cloud-api": 13, "@cityssm/ntfy-publish": 13,
    "@cityssm/dynamics-gp": 14, "@cityssm/scheduled-task": 15,
    "@cityssm/pdf-puppeteer": 11, "@cityssm/jsbarcode-svg": 11,
    "@cityssm/object-difference": 15, "@cityssm/configurator": 15,
    "@cityssm/utils-datetime": 2, "@cityssm/to-millis": 2,
    "ical-generator": 10, "leaflet": 6, "multer": 11,
    "papaparse": 12, "meow": 12, "sanitize-filename": 11,
    "node-windows": 15,
}

FOUNDATION_FEATURES = [
    {
        "id": "BAS-01", "sources": ["app/app.ts", "index.ts"],
        "expected_behavior": "FastAPI-Start und GET /api/health",
        "target": "backend/cemaris/main.py", "step": 1,
        "implementation_status": "Grundgerüst implementiert",
        "verification_status": "Backend-Smoke-Test: konkretes Ergebnis siehe Bericht 01",
    },
    {
        "id": "BAS-02", "sources": ["helpers/config.defaults.ts", "helpers/i18n.helpers.ts", "package.json"],
        "expected_behavior": "GET /api/config mit Cemaris-Name, Version und unterstützten Sprachen en/de",
        "target": "backend/cemaris/config.py, backend/cemaris/main.py", "step": 1,
        "implementation_status": "Basiskonfiguration implementiert",
        "verification_status": "Vollständige Quellkonfiguration/Sprachabläufe offen (03/15); Basisprüfung siehe Bericht 01",
    },
    {
        "id": "BAS-03", "sources": ["app/app.ts", "views/error.ejs"],
        "expected_behavior": "Einheitliches JSON-Fehlerformat für die React-/Python-Schnittstelle",
        "target": "backend/cemaris/errors.py, backend/cemaris/schemas.py", "step": 1,
        "implementation_status": "Grundgerüst implementiert",
        "verification_status": "Fachliche Einzelantworten späterer Handler offen; Basisprüfung siehe Bericht 01",
    },
    {
        "id": "BAS-04", "sources": ["views/_header.ejs", "views/_footerA.ejs", "public/images/", "bereitgestellte Cemaris-Assets"],
        "expected_behavior": "React-Grundseite, sichtbarer Cemaris-Name, bereitgestelltes Logo/Icon und Browser-Icon",
        "target": "frontend/src/App.tsx, frontend/public/branding/", "step": 1,
        "implementation_status": "Branding-Grundlage implementiert",
        "verification_status": "Quellseiten/Navigation bleiben offen; Frontend-Build/Browserprüfung siehe Bericht 01",
    },
    {
        "id": "BAS-05", "sources": ["package.json", "package-lock.json", "app/"],
        "expected_behavior": "Fixierte Python-/React-Abhängigkeiten, API-/Web-Dockerfiles und Compose-Grundlage",
        "target": "backend/, frontend/, compose.yaml", "step": 1,
        "implementation_status": "Technische Grundlage implementiert",
        "verification_status": "Tatsächlich ausgeführte Build-/Docker-Prüfungen und Einschränkungen siehe Bericht 01",
    },
]


def build_inventory(old: dict | None = None) -> dict:
    previous = {f["id"]: f for f in (old or {}).get("features", [])}
    previous_packages = {p["lock_path"]: p for p in (old or {}).get("locked_packages", [])}
    tree = []
    for line in git("ls-tree", "-r", COMMIT).splitlines():
        meta, path = line.split("\t", 1)
        mode, typ, blob = meta.split()
        tree.append((path, blob))
    # One process reads the frozen blobs. This is independent of worktree state,
    # avoids per-file subprocess overhead and never installs or changes anything.
    missing = [(path, blob) for path, blob in tree if path not in SOURCE_CACHE]
    if missing:
        process = subprocess.run(
            ["git", "-C", str(REFERENCE), "cat-file", "--batch"],
            input="".join(blob + "\n" for _, blob in missing).encode(),
            stdout=subprocess.PIPE, check=True,
        )
        offset = 0
        for path, _ in missing:
            header_end = process.stdout.index(b"\n", offset)
            size = int(process.stdout[offset:header_end].split()[-1])
            body = process.stdout[header_end + 1:header_end + 1 + size]
            SOURCE_CACHE[path] = body.decode("utf-8", errors="replace").strip()
            offset = header_end + 1 + size + 1
    paths = {path for path, _ in tree}
    features = {}
    artifacts = []
    texts = {}
    for path, blob in tree:
        canonical = path
        if path.endswith(".js") and path[:-3] + ".ts" in paths:
            canonical = path[:-3] + ".ts"
        if path.endswith(".min.js") and path[:-7] + ".ts" in paths:
            canonical = path[:-7] + ".ts"
        fid = stable_id("F", canonical)
        artifacts.append({
            "id": stable_id("SRC", path), "path": path, "git_blob": blob,
            "kind": "compiled_js" if path != canonical else kind_for(path),
            "canonical_path": canonical, "feature_id": fid, "step": step_for(canonical),
        })
        if fid in features:
            features[fid]["sources"].append(path)
            continue
        text = ""
        if Path(canonical).suffix not in (".png", ".jpg", ".ico"):
            text = source_text(canonical)
        texts[canonical] = text
        evidence = module_evidence(canonical, text)
        item = {
            "id": fid, "name": canonical, "sources": [path],
            "step": step_for(canonical), "expected_behavior": expectation(canonical, evidence, text),
            "target": "geplant/offen: im angegebenen Schritt konkret zuordnen",
            "implementation_status": "offen", "verification_status": "Quellinventar statisch erfasst; Cemaris-Verhaltensvergleich offen",
            "evidence": evidence,
        }
        if reference_only(canonical):
            item["target"] = "technisch zugeordnet: erforderliche Hinweise berücksichtigen; keine unveränderte Portierung dieses Hilfsartefakts"
            item["implementation_status"] = "zugeordnet (Referenz-/Hilfsartefakt)"
            item["verification_status"] = "Inventar vollständig; notwendige Inhalte und Lizenzen im zugeordneten Schritt abgleichen"
        if canonical == "app/app.ts":
            item["contributing_steps"] = [1, 3, 12, 15, 16]
        if canonical == "helpers/config.defaults.ts":
            item["contributing_steps"] = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15]
        features[fid] = item
    for feature in features.values():
        feature["sources"].sort(key=lambda path: (path != feature["name"], path))
    # Separate records make every table and registered report independently trackable.
    for match in re.finditer(r"CREATE TABLE IF NOT EXISTS (\w+)\s*\(", texts["database/initializeDatabase.ts"]):
        table = match.group(1)
        fid = "DB-" + table
        features[fid] = {
            "id": fid, "name": "Tabelle " + table,
            "sources": ["database/initializeDatabase.ts", "types/record.types.ts"],
            "source_line": texts["database/initializeDatabase.ts"].count("\n", 0, match.start()) + 1,
            "step": 2, "expected_behavior": "Tabelle " + table + " einschließlich Spalten, Primär-/Fremdschlüssel, Indizes, Defaults, CHECKs und Änderungs-/Löschsemantik nach SQL Server übertragen.",
            "target": "geplant/offen: SQLAlchemy-Modelle und Alembic-Migration in Schritt 02",
            "implementation_status": "offen", "verification_status": "DDL statisch erfasst; SQL-Server-Nachweis offen",
        }
    # The Map covers 36 exports; the database switch defines nine additional
    # reports. Keep all 45 as stable semantic feature IDs.
    report_names = set(re.findall(r"'([\w-]+-(?:all|formatted))'", texts["helpers/reports.helpers.ts"]))
    report_names.update(re.findall(r"case\s+'([\w-]+)'", texts["database/getReportData.ts"]))
    for report in sorted(report_names):
        fid = "REPORT-" + report
        features[fid] = {
            "id": fid, "name": "Bericht " + report, "sources": ["helpers/reports.helpers.ts", "database/getReportData.ts", "handlers/reportsGet/reportName.ts"],
            "step": 12, "expected_behavior": "Bericht " + report + " mit Quellspalten, Filterbedingungen, Sortierung und CSV-/Ausgabeformat bereitstellen.",
            "target": "geplant/offen: Bericht-API und React-Berichtsauswahl in Schritt 12",
            "implementation_status": "offen", "verification_status": "Berichtsregistrierung statisch erfasst; Inhalts-/Exportvergleich offen",
        }
    package = json.loads(source_text("package.json"))
    lock = json.loads(source_text("package-lock.json"))
    direct = {}
    for group in ("dependencies", "devDependencies", "optionalDependencies"):
        for name in package.get(group, {}):
            direct[name] = group
    locked = []
    for lock_path, metadata in sorted(lock["packages"].items()):
        if not lock_path:
            continue
        name = lock_path.rsplit("node_modules/", 1)[-1]
        is_direct = lock_path == "node_modules/" + name and name in direct
        fid = stable_id("DEP", lock_path)
        step = PACKAGE_STEPS.get(name, 16)
        locked.append({
            "id": fid, "lock_path": lock_path, "name": name,
            "version": metadata.get("version"), "resolved": metadata.get("resolved"),
            "integrity": metadata.get("integrity"), "license": metadata.get("license"),
            "direct": is_direct, "dependency_group": direct.get(name) if is_direct else "transitive",
            "step": step, "feature_id": fid if is_direct else "LOCK-TRANSITIVE",
            "content_verification": previous_packages.get(lock_path, {}).get(
                "content_verification", "offen; Lock-Metadaten sind kein Paketquellcode- oder Verhaltensnachweis"
            ),
        })
        if is_direct:
            consumers = [f["name"] for f in features.values() if any(i == name or i.startswith(name + "/") for i in f.get("evidence", {}).get("imports", []))]
            features[fid] = {
                "id": fid, "name": f"Paket {name}@{metadata.get('version')}",
                "sources": ["package.json", "package-lock.json", *consumers], "step": step,
                "expected_behavior": "Abhängigkeit " + name + ": tatsächlichen Beitrag aus gesperrter Version und aufrufenden Modulen prüfen, erforderliches Verhalten in Python/React übertragen oder technische Ersetzung begründen; Paketinhalt/Exports belegen.",
                "target": "geplant/offen: Paketfunktion oder begründete technische Ersetzung im angegebenen Schritt",
                "implementation_status": "offen", "verification_status": "Version/Integrität und lokale Importstellen erfasst; Paketinhalt/Verhalten ungeprüft",
            }
    features["LOCK-TRANSITIVE"] = {
        "id": "LOCK-TRANSITIVE", "name": "Transitive gesperrte Paketinstanzen",
        "sources": ["package-lock.json"], "step": 16,
        "expected_behavior": "Alle transitiven Paketinstanzen im Quellinventar mit exakter Version/Integrität erhalten; bei Fachbeitrag zuständigem Schritt zuordnen, notwendige Semantik prüfen und technische Ersetzungen dokumentieren.",
        "target": "geplant/offen: Python-/React-Abhängigkeiten und Funktionsvergleich",
        "implementation_status": "offen", "verification_status": "Lock-Metadaten vollständig erfasst; Paketquellcodes und Laufzeitbeiträge ungeprüft",
    }
    for fid, item in features.items():
        unedited_reference_default = (
            reference_only(item["name"])
            and previous.get(fid, {}).get("target") == "geplant/offen: im angegebenen Schritt konkret zuordnen"
            and previous.get(fid, {}).get("implementation_status") == "offen"
        )
        for key in ("target", "implementation_status", "verification_status", "completion", "historical_mapping_16"):
            if key in previous.get(fid, {}) and not unedited_reference_default:
                item[key] = previous[fid][key]
    counts = Counter(a["kind"] for a in artifacts)
    return {
        "schema_version": 1, "reference_commit": COMMIT,
        "progress": (old or {}).get("progress", {"step": 1, "date": "19.10.2026"}),
        "reference_version": package["version"],
        "id_rule": "SRC/F/DEP + first 12 hex characters of SHA-256(path); DB-table and REPORT-name are semantic IDs. IDs do not depend on row order.",
        "counts": {"tracked_files": len(artifacts), **dict(sorted(counts.items())), "tables": sum(f.startswith("DB-") for f in features), "registered_reports": sum(f.startswith("REPORT-") for f in features), "locked_package_instances": len(locked), "direct_packages": len(direct), "features": len(features)},
        "foundation_features": (old or {}).get("foundation_features", FOUNDATION_FEATURES),
        **({"final_audit": old["final_audit"]} if old and "final_audit" in old else {}),
        **({"product_revision": old["product_revision"]} if old and "product_revision" in old else {}),
        "artifacts": artifacts, "features": sorted(features.values(), key=lambda f: (f["step"], f["name"])), "locked_packages": locked,
    }


def render_markdown(data: dict) -> str:
    progress = data.get("progress", {"step": 1, "date": "19.10.2026"})
    lines = [
        "# Funktionsnachweis und Portierungsarbeitsliste", "", f"Stand: Schritt {progress['step']:02d}, {progress['date']}.", "",
        "Referenz: `../Sunrise-Referenz`, Commit `" + COMMIT + "`, Version `1.0.0-beta.21`. Die Referenz bleibt unverändert.", "",
        "Diese vollständige **Arbeitsliste** erfasst die getrackten Quellbereiche, Tabellen, registrierten Berichte und direkten Abhängigkeiten. Eine Inventarzeile ist kein abgeschlossener Verhaltensnachweis. Detaillierte Validierungen, Berechnungsfälle, Berechtigungen, Such-/NULL-/Datumssemantik und Referenzfehler stehen bei den Fachnachweisen des jeweils zuständigen Schritts. Offene Funktionen sind keine implementierten Platzhalter. Dokumentation, CI-, Editor- und Node-Werkzeuge werden als Referenz-/Hilfsartefakte zugeordnet: Ihr Vorhandensein verlangt keine unveränderte Portierung und schafft keinen zusätzlichen Fachumfang.", "",
        "Die maschinenlesbare Datei [QUELLINVENTAR.json](QUELLINVENTAR.json) enthält für **jede** getrackte Datei eine stabile Kennung, Pfad, Git-Blob-ID, zuständigen Schritt und Funktionskennung; ferner alle gesperrten Paketinstanzen einschließlich transitiver und optionaler Pakete mit Version, Auflösung und Integrität. Kompilierte `.js`-/`.min.js`-Dateien mit gleichnamigem TypeScript werden derselben Funktion zugeordnet. Alle sonstigen Dateien bleiben explizit inventarisiert. Es gibt keine nicht erfasste Restkategorie.", "",
        "Alle in den Tabellen genannten Quellpfade beziehen sich auf das Referenzrepository. Für Funktionszeilen mit vielen Quellen zeigt die Tabelle den Hauptpfad; sämtliche Pfade und zusätzlich erkannte Imports, Exportnamen, Request-Felder, Route-Methoden/-Pfade und Testfallnamen stehen unter derselben Kennung im JSON. Aus dynamisch aufgebauten Routen/Typen wird keine Vollständigkeit einer statischen Regex-Analyse behauptet; vollständige Dateien sind anhand ihrer Blob-ID erfasst.", "",
        "## Nachweis des Grundgerüsts in Schritt 01", "",
        "Die folgenden Cemaris-Basisfunktionen sind technische Neuimplementierungen. Die konkreten Fachfunktionen werden anschließend einzeln zugeordnet; das Grundgerüst allein beweist ihre Übertragung nicht. Konkrete Basisprüfresultate stehen im [Schrittbericht 01](berichte/01.md), spätere Fach-/Betriebsnachweise in den Berichten 02–16.", "",
        "| ID | Quelle / Referenzbezug | Erwartetes Verhalten und Ziel | Schritt | Stand / Prüfung |",
        "| --- | --- | --- | --- | --- |",
    ]
    for feature in data["foundation_features"]:
        cols = [feature["id"], ", ".join("`" + p + "`" for p in feature["sources"]), feature["expected_behavior"] + "; Ziel: " + feature["target"], f"{feature['step']:02d}", feature["implementation_status"] + "; " + feature["verification_status"]]
        lines.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in cols) + " |")
    lines += ["",
        "## Inventarvollständigkeit", "",
        "Prüfung ohne Installation/Start oder Änderung der Referenz: `python scripts/check_scope.py`. Sie vergleicht den vollständigen Git-Baum am festen Commit, Blob-IDs, Funktionszuordnungen, Tabellen, Berichte und alle Lock-Paketinstanzen. Sie weist keine fachliche Gleichheit nach.", "",
        "Pflege: Status, Ziel und konkrete Nachweise unter der stabilen Funktionskennung im JSON ergänzen; `python scripts/check_scope.py --refresh` aktualisiert statische Inventarfelder und rendert diese Tabellen neu. Bereits gepflegte Status-/Ziel-/Prüffelder und die separat gespeicherten BAS-Einträge bleiben erhalten. Der eigentliche Schritt-01-Auftrag besteht aus diesen BAS-Einträgen; die Quellparität der nachstehenden Bereiche gehört zu späteren Schritten. Fachliche Detailbefunde in einem eigenen Dokument verlinken; den Quellcommit nicht ändern.", "",
        "| Inventarbereich | Anzahl |", "| --- | --- |",
    ]
    for key, count in data["counts"].items():
        lines.append(f"| {key} | {count} |")
    if "product_revision" in data:
        revision = data["product_revision"]
        lines += ["", "## Eigenständiges Produkt ab Schritt 18", "", revision["summary"], "",
            "Die Quelle und ihre stabilen IDs bleiben vollständig erhalten. Historische Abschlusszuordnungen vor der Produktentscheidung stehen bei betroffenen Zeilen im JSON unter `historical_mapping_16`. `removed_by_product_decision` bezeichnet einen ausdrücklich ausgebauten Bereich und keine aktuelle Implementierung. Gemischte Fachmodule behalten ihre vorhandenen Ziele; entfernte Integrationsanteile werden als Produktänderung ausgewiesen.", "",
            "Auf Servern ohne Sunrise-Checkout: `python scripts/check_scope.py --complete --repository-only` prüft nur gespeicherte IDs, Ziel-/Belegpfade und die JSON-/Markdown-Synchronität. Quellblob- und Git-Baumprüfung werden dabei ausdrücklich nicht ausgeführt. `--refresh` verlangt weiterhin den unveränderten Originalcheckout.", ""]
    if "final_audit" in data:
        audit = data["final_audit"]
        lines += ["", "## Historische Abschlusszuordnung in Schritt 16", "",
            "Die folgenden Erfolge und Prüfgrenzen beschreiben den damaligen Portierungsstand. Schritt 17 ergänzt den Ubuntu-Betrieb; Schritt 18 ändert den Produktumfang. Sie sind keine Behauptung aktueller 1:1-Parität.", "", audit["summary"], "",
            "`python scripts/check_scope.py --complete` prüft zusätzlich jede konkrete Ziel-/Nachweisdatei, die Abschlussklasse, fehlende Implementierungszuordnungen und die exakte Übereinstimmung dieser Tabellen mit dem JSON. Das ist eine Zuordnungs- und Existenzprüfung; fachliche Gleichheit, ausgeführte Tests oder Docker-/Livebetrieb werden daraus nicht abgeleitet.", "",
            "Aktuelle Zuordnungsklassen des gespeicherten Inventars:", "",
            "| Abschlussklasse | Funktionszeilen |", "| --- | --- |"]
        for category, count in sorted(Counter(f["completion"]["classification"] for f in data["features"]).items()):
            lines.append(f"| {category} | {count} |")
        lines += ["", "Verbleibende Prüfgrenzen:", ""] + ["- " + item for item in audit["verification_limits"]]
    lines += ["", "## Quellfunktionen und zugeordnete Hilfsartefakte nach zuständigem Schritt", "", "Fachliche Funktionen bleiben bis zu einem konkreten Ziel und bestandenem Vergleich offen. Referenz-/Hilfsartefakte sind als solche gekennzeichnet. Der Besitzer ist der erste Umsetzungsschritt; gemeinsame Dateien, Gesamttests, Konfiguration und Sprachkataloge werden danach fortlaufend ergänzt. Beispielsweise liegt das komplette Schema in 02, Fach-CRUD in 04–10, optionale Portal-Metadaten in 14 und die endgültige Gesamtabdeckung in 16."]
    for step in sorted({f["step"] for f in data["features"]}):
        lines += ["", f"### Schritt {step:02d}", "", "| Stabile ID | Quelle / kleine Funktionsgruppe | Erwartetes Verhalten | Ziel | Prüfstatus |", "| --- | --- | --- | --- | --- |"]
        for f in data["features"]:
            if f["step"] != step:
                continue
            main = f["sources"][0]
            if "source_line" in f:
                main += ":" + str(f["source_line"])
            label = f["name"] if f["name"] != main else ""
            source = "`" + main + "`" + (" — " + label if label else "")
            cols = [f["id"], source, f["expected_behavior"], f["target"], f["implementation_status"] + "; " + f["verification_status"]]
            lines.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in cols) + " |")
    lines += ["", "## Verbleibende Nachweise", "",
        progress.get("feature_note", "- Alle Fachfunktionen, Quellseiten, Dialoge, sprachabhängigen Bedienabläufe, Datenbankmodule, Importwerkzeuge und Integrationen bleiben offen; die Grundseite stellt dafür keine Umsetzung dar."),
        progress.get("database_note", "- SQL-Server-Schema, Migration, Datensemantik und Persistenz benötigen Schritt 02 mit eigener entbehrlicher Testdatenbank. SQLite liefert keinen Ersatznachweis."),
        progress.get("package_note", "- Lock-Versionen/Integritäten und lokale Importstellen sind erfasst; die internen Implementierungen der gemeinsamen npm-Pakete sind damit noch nicht untersucht. `sunrise-cms-shared` 0.0.11, `sunrise-cms-customizations` 0.0.2 und die verwendeten `@cityssm`-Pakete müssen bei ihren zuständigen Schritten aus den gesperrten Artefakten geprüft werden."),
        progress.get("test_note", "- Referenztests/Cypress sind als Vergleichsquellen erfasst; ihre Ausführung gegen Sunrise und ihre Übertragung nach Cemaris bleiben offen. Gleiches gilt für den vollständigen Quell-/Ziel-Vergleich."),
        "- Die in Schritt 18 ausgebauten Altanbindungen gehören nicht mehr zum Produktumfang. Historische Vertragstests und frühere Livegrenzen sind in den damaligen Berichten dokumentiert; verbliebene externe Authentifizierung und Geografie benötigen weiterhin eigene Nachweise.",
        "- Tatsächlicher Ubuntu-/Docker-Betrieb ist in Bericht 17 belegt; aktueller Produktstand und Prüfungen stehen in Bericht 18. Eine Inventarzuordnung beweist keine kommunale Fachabnahme.", ""]
    return "\n".join(lines)


def validate_completion(data: dict, root: Path = ROOT) -> dict[str, int]:
    """Validate reviewed implementation mappings without claiming test execution."""
    classes = {"implemented", "platform-replacement", "reference-support", "test-mapping", "removed_by_product_decision"}
    counts: Counter[str] = Counter()
    if not data.get("final_audit", {}).get("summary"):
        raise ValueError("Final audit summary is missing")
    feature_ids = {feature["id"] for feature in data["features"]}
    for feature in [*data["features"], *data["foundation_features"]]:
        fid = feature["id"]
        if re.search(r"\b(?:offen|geplant)\b", feature["implementation_status"] + " " + feature["target"], re.IGNORECASE):
            raise ValueError("Unassigned implementation: " + fid)
        completion = feature.get("completion", {})
        if completion.get("classification") not in classes or not completion.get("rationale"):
            raise ValueError("Missing reviewed completion classification/rationale: " + fid)
        retired = completion.get("classification") == "removed_by_product_decision"
        if retired and (not completion.get("decision_report") or completion["decision_report"] not in completion.get("evidence_paths", [])):
            raise ValueError("Removed function requires a decision report: " + fid)
        if retired and completion.get("target_paths") != []:
            raise ValueError("Removed function must have no active targets: " + fid)
        for key in ("target_paths", "evidence_paths"):
            paths = completion.get(key)
            if not isinstance(paths, list) or (not paths and not (retired and key == "target_paths")):
                raise ValueError("Missing " + key + ": " + fid)
            for relative in paths:
                if not isinstance(relative, str) or not relative:
                    raise ValueError("Invalid " + key + ": " + fid)
                path = Path(relative)
                absolute = (root / path).resolve()
                if path.is_absolute() or not absolute.is_relative_to(root.resolve()) or not absolute.exists():
                    raise ValueError("Missing/outside repository " + key + ": " + fid + " -> " + relative)
        if fid in feature_ids:
            counts[completion["classification"]] += 1
    for package in data["locked_packages"]:
        status = package.get("content_verification", "")
        if not status.strip() or re.search(r"^\s*(?:offen|geplant)\b", status, re.IGNORECASE):
            raise ValueError("Unassigned package contribution: " + package["lock_path"])
    return dict(sorted(counts.items()))


def check(data: dict, *, complete: bool = False, repository_only: bool = False) -> None:
    if not repository_only:
        check_reference(data)
    check_repository(data, complete=complete, repository_only=repository_only)


def check_reference(data: dict) -> None:
    if git("rev-parse", "HEAD") != COMMIT:
        raise ValueError("Reference HEAD differs from the frozen commit")
    if git("status", "--porcelain"):
        raise ValueError("Reference working tree is not clean")
    expected = build_inventory(data)
    if data != expected:
        raise ValueError("Inventory differs from frozen source; inspect differences before --refresh")


def check_repository(data: dict, *, complete: bool, repository_only: bool) -> None:
    if data.get("reference_commit") != COMMIT:
        raise ValueError("Inventory reference commit differs from the frozen commit")
    counts = data["counts"]
    for name, actual in (("tracked_files", len(data["artifacts"])), ("features", len(data["features"])),
                         ("locked_package_instances", len(data["locked_packages"]))):
        if counts.get(name) != actual:
            raise ValueError("Stored inventory count differs: " + name)
    for artifact in data["artifacts"]:
        if artifact["id"] != stable_id("SRC", artifact["path"]) or not re.fullmatch(r"[a-f0-9]{40}", artifact["git_blob"]):
            raise ValueError("Invalid stored source identity: " + artifact["path"])
    ids = [a["id"] for a in data["artifacts"]] + [f["id"] for f in data["features"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate stable ID")
    features = {f["id"] for f in data["features"]}
    for item in [*data["artifacts"], *data["locked_packages"]]:
        if item["feature_id"] not in features:
            raise ValueError("Artifact/package has no worklist feature: " + str(item))
    for feature in data["features"]:
        for field in ("sources", "expected_behavior", "target", "step", "implementation_status", "verification_status"):
            if not feature.get(field):
                raise ValueError(f"Missing {field} for {feature['id']}")
    markdown = WORKLIST.read_text(encoding="utf-8")
    for fid in features:
        if fid not in markdown:
            raise ValueError("Feature absent from Markdown worklist: " + fid)
    completion = validate_completion(data) if complete else None
    if complete and markdown != render_markdown(data):
        raise ValueError("Markdown differs from reviewed JSON; inspect before --refresh")
    print(json.dumps({"result": "PASS", "reference_commit": COMMIT,
        "reference_verification": "not-run; stored inventory only" if repository_only else "frozen Git tree verified",
        **data["counts"],
        **({"completion_classes": completion, "boundary": "Mapping and target existence only; no runtime/parity claim"} if complete else {})}, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Update metadata/worklist; retain recorded status/target fields")
    parser.add_argument("--complete", action="store_true", help="Require reviewed mappings and existing repository targets; does not prove runtime parity")
    parser.add_argument("--repository-only", action="store_true", help="Check stored IDs, mappings and Markdown without an original checkout; does not verify source blobs")
    args = parser.parse_args()
    if args.refresh and args.repository_only:
        parser.error("--refresh requires the frozen original checkout")
    old = json.loads(INVENTORY.read_text(encoding="utf-8")) if INVENTORY.exists() else None
    if args.refresh:
        data = build_inventory(old)
        INVENTORY.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        WORKLIST.write_text(render_markdown(data), encoding="utf-8")
    else:
        if old is None:
            raise ValueError("Inventory is missing")
        data = old
    check(data, complete=args.complete, repository_only=args.repository_only)


if __name__ == "__main__":
    main()
