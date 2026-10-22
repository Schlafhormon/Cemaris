# Cemaris: Produktentwicklung und historischer Portierungsplan

## Nächster Auftrag: Schritt 20 – betriebliche und kommunale Produktionsabnahme

Noch nicht begonnen. HTTPS/SQL-Zertifikate gemäß bisher zurückgestellten
Betreiberentscheidungen, vorhandene Sicherungsabdeckung und Aufbewahrung/Offsite
klären sowie örtliche Gebühren, Nutzungszeiten, Rollen und Kernabläufe abnehmen.
EDWALT bleibt separat. Der konkrete Einstieg und die Betriebsgrenzen stehen
in [STATUS.md](STATUS.md).

## Abgeschlossener Zusatzauftrag: Schritt 19 – initiale main-Historie

Ausdrücklicher Nutzerauftrag vom 21.10.2026: den aktuellen Produktstand als
einzigen ersten Commit auf `main` pushen. Bisherige Historie privat als
Git-Bundle sichern, aktuellen Dateibaum erhalten, Remote gegen konkurrierende
Änderungen mit expliziter Lease absichern und genau einen Rootcommit prüfen.
Am 22.10.2026 nach GitHub-Anmeldung erfolgreich veröffentlicht und geprüft.
Genau ein Rootcommit auf main; alte Historie privat gesichert. Keine Laufzeitänderung. Bericht: [19](berichte/19.md). Der zuvor als 19
geplante Abnahmeschritt erhält deshalb die Nummer20.

## Abgeschlossener Auftrag: Schritt 18 – Produktbereinigung

Nutzerauftrag vom 21.10.2026 nach abgeschlossenem Deployment: Cemaris als
eigenständige deutsche kommunale Friedhofsverwaltung bereinigen, prüfen und
anschließend auf SRV-UbuntuApp aktualisieren. ConsignO, Dynamics GP/Diamond,
Sunrise-Portal, Find a Grave und ntfy vollständig aus aktiver Laufzeit entfernen.
Deutsche Sprache, Euro, Adressen, Standarddrucke und Produktdokumentation
überarbeiten. EDWALT bleibt separat. Die ausdrückliche Produktentscheidung
ersetzt für diese Bereiche die bisherigen 1:1-Vorgaben.

Prüfung: Backendtests gegen entbehrlichen SQL Server, Upgrade einer vorhandenen
0001-Datenbank, Sprach-/Formatprüfungen, Produktionsbuild und echte
Browser-/PDF-Abnahme. Produktivdaten erhalten, alte Lizenzbelege bewahren.
Bericht: [18](berichte/18.md). Aktueller Folgeauftrag: [STATUS.md](STATUS.md).

## Historischer Portierungsauftrag: Ziel und Referenz

Auftrag vom 19.10.2026: Sunrise CMS zunächst funktional 1:1 nach Python,
React und Microsoft SQL Server übertragen und zu Cemaris rebranden.
Jeder Schritt läuft in einer neuen, kontextlosen Session. Die Sessions werden
nacheinander ausgeführt. Der Projektverantwortliche deployt und testet die
fertige Portierung anschließend auf seinem Ubuntu-App-Server.

Referenz: `../../../Sunrise-Referenz` vom Verzeichnis dieses Dokuments aus,
Commit `451ce034863b16502484367044f3e9b65370111a`, Version `1.0.0-beta.21`.
Der Commit bezeichnet das gesamte Repository einschließlich package-lock.json.
Abhängigkeiten der Referenz werden aus diesem Lockfile nachvollzogen.

Die Vorprüfung hat 11 Routendateien, 221 Handler, 176 Datenbankdateien,
64 EJS-Ansichten und 41 Tabellendefinitionen gefunden. Das sind Orientierungspunkte
für die Vollständigkeit; das Verhalten erschließt sich aus dem jeweiligen Code,
den Hilfsfunktionen und den vorhandenen Tests.

## Bedeutung von 1:1

Zum Umfang gehören vorhandene Seiten, Felder, Abläufe, Suche und Filter,
Berechnungen, Datumsbehandlung, Berechtigungen, Historie, Dateien, Druck,
Berichte, APIs, Im-/Exporte, optionale Funktionen und Integrationen.
Vorhandene Sprachen werden mitgeführt. Branding wird auf Cemaris umgestellt.

Das bereitgestellte Logo und Icon liegen, ausgehend vom Arbeitsverzeichnis
`Cemaris`, unter `../Cemaris-Brand/Cemaris Logo.png` und
`../Cemaris-Brand/Cemaris Icon.png`. Schritt 01 verwendet diese Dateien und
übernimmt die benötigten Assets in das Repository und die gebauten Artefakte.

Durch den Plattformwechsel notwendige Änderungen werden technisch beschrieben.
Die Anwendungsdaten liegen in SQL Server; eine SQLite-Dateisicherung braucht
daher ein passendes SQL-Server-Betriebsverfahren. Der interne Transport zwischen
React und Python kann als API gestaltet werden. Öffentlich verwendete Verträge,
Dateiformate und die Ergebnisse der Fachfunktionen werden nachvollzogen.

Neue Fachregeln, ein neues Oberflächenkonzept, zusätzliche Features und die
EDWALT-Datenübernahme folgen in späteren Aufträgen. Auffällige Referenzfehler
werden konkret festgehalten. Probleme werden nicht unbemerkt als neue Sollregel
übernommen oder eigenmächtig fachlich umgedeutet.

## Technische Grundlage

- Backend: Python/FastAPI, SQLAlchemy, Alembic, pyodbc.
- Frontend: React/TypeScript/Vite, zunächst am Referenzaufbau orientiert.
- Anwendungsdatenbank: Microsoft SQL Server.
- Betrieb: getrennte API-/Web-Container auf Ubuntu; SQL Server extern.
- Prüfungen: Python-Tests, Frontend-Build und passende Browser-/Vergleichsfälle;
  Datenbankverhalten auf SQL Server.

Versionen, Startbefehle und Prüfbefehle werden mit der Implementierung fixiert.
Ein neuer Betriebshandbuchabschnitt muss die reale Implementierung erklären.

## Schritte

| Nr. | Auftrag | Wichtige Referenzbereiche | Ergebnis und geeigneter Nachweis |
| --- | --- | --- | --- |
| 00 | Ablauf für kontextlose Sessions vorbereiten | Projektauftrag und festgelegter Referenzcommit | Arbeitsanweisung, Plan, Status und Startprompt vorhanden. |
| 01 | Startbares technisches Grundgerüst und Cemaris-Branding | `app/app.ts`, `index.ts`, `package.json`, `views/`, `locales/` | Python-API, React-Anwendung, Fehlerformat, Konfiguration, API-/Web-Dockerfiles und Compose-Grundlage; reproduzierbare Abhängigkeiten, Start-/Prüfbefehle, Health-Endpunkt und sichtbarer Cemaris-Name. Initialer vollständiger Funktionsnachweis als Arbeitsliste. Backend-Smoke-Test und Frontend-Build. |
| 02 | SQL-Server-Schema und gemeinsame Datensemantik | `database/initializeDatabase.ts`, `types/record.types.ts`, `helpers/database.helpers.ts`, `helpers/partialDate.helpers.ts`, `helpers/functions.sqlFilters.ts` | Zuordnung aller 41 Tabellen, Migrationen, Beziehungen, Schlüssel, Defaults, Audit-/Löschfelder und synthetische Fixtures. Zahlen-/Datums-/NULL-/Suchverhalten vergleichen. Migration und Rundlauf in entbehrlichem SQL Server nachweisen. |
| 03 | Anmeldung, Benutzer, Berechtigungen, Einstellungen und Sprachen | `helpers/authentication.helpers.ts`, `helpers/user.helpers.ts`, `routes/login.ts`, `app/app.ts`, Benutzer-/Einstellungs-Handler, `helpers/i18n.helpers.ts` | Anmeldung/Abmeldung, Sitzungen, CSRF, Quell-Berechtigungen, Benutzerverwaltung und Benutzereinstellungen in API und React. Authentifizierungsarten der Referenz erfassen und passende Adapter vorsehen. Tests für erlaubte und verweigerte Aktionen sowie Sprachwahl. |
| 04 | Fachliche Kataloge und konfigurierbare Felder | `handlers/adminGet/`, `handlers/adminPost/`, zugehörige Datenbankmodule und Admin-Ansichten | Grabstätten-/Vertragsarten, Zusatzfelder, Status, Service-/Beisetzungs-/Gebührenkataloge, Druckzuordnungen und Konfiguration mit Quellfunktionen abgleichen. CRUD, Reihenfolgen, Abhängigkeiten und Referenzschutz prüfen. |
| 05 | Friedhöfe und Grabstätten | `routes/cemeteries.ts`, `routes/burialSites.ts`, zugehörige Handler, Datenbankmodule und Ansichten | Listen, Suchen, Details, Anlage, Änderung, Löschung, Hierarchie, Status, Zusatzfelder und Kommentare. Zusammenhängende API-/Browserfälle und SQL-Persistenz. |
| 06 | Karten, Lagefunktionen und Grabstellenwerkzeuge | Karten-/GPS-/Bereichs-Handler, `helpers/burialSites.helpers.ts`, `helpers/findagrave.helpers.ts`, entsprechende Cypress-Fälle | Karten/SVG-Zuordnung, Koordinaten, GPS, Bereichsanlage und Find-a-Grave-Verknüpfung entsprechend der Referenz. Grenzfälle und Browserabläufe nachvollziehen. |
| 07 | Bestatter, Verträge und Beteiligte | `routes/funeralHomes.ts`, `routes/contracts.ts`, Vertrags-CRUD, Zusatzfelder, Kommentare und verknüpfte Verträge | Vertragsanlage, Suche, Details, Bearbeitung, Kopieren, Verknüpfungen und Beteiligten-/Bestatterdaten. Quellrollen und Zustände anhand durchgängiger Fälle prüfen. |
| 08 | Beisetzungen und Dienstleistungen | `database/*ContractInterment*`, `database/*ContractService*`, zugehörige Handler/Ansichten und Datumshelfer | Personen-/Beisetzungsdaten, Arten, Tiefe/Behälter, Termine und Dienstleistungen mit Auswirkungen auf Vertrag und Grabstätte. Unvollständige Datumsangaben, Grenzen und Änderungen vergleichen. |
| 09 | Gebühren, Berechnungen und Transaktionen | `helpers/functions.fee.ts`, zugehörige geteilte Pakete, Gebühren-/Transaktionsmodule und Vertragsansichten | Positionen, Mengen, Steuer/Berechnungsfunktionen, Summen und Transaktionen entsprechend der Quelle. Rundung, NULL/Leerwerte und Änderungen anhand konkreter Eingabe-/Ergebnispaare prüfen. |
| 10 | Arbeitsaufträge, Meilensteine und Kalender | `routes/workOrders.ts`, Arbeitsauftragsmodule, Kalender-/iCal-Handler und Cypress-Fälle | Aufträge, Grab-/Vertragsbezüge, Kommentare, Status, Abschluss, Meilensteine, Tagesansicht, Kalender und iCal. Vollständige Arbeitsabläufe und Exportinhalte prüfen. |
| 11 | Anhänge, Dokumente und Druck | `helpers/attachments.helpers.ts`, `helpers/pdf.helpers.ts`, `helpers/print.helpers.ts`, `helpers/customizations.helpers.ts`, `routes/print.ts`, Druckansichten und Vorlagen | Upload/Download, Druckauswahl, PDF/HTML-Ausgabe und individuelle Druckvorlagen. Inhalt, Dateinamen, Zugriffe und gerenderte Beispielausgaben mit der Referenz vergleichen. Lizenz-/Herkunftshinweise erhalten. |
| 12 | Berichte, Dashboard, APIs und Datenimporte/-exporte | `routes/reports.ts`, `routes/dashboard.ts`, `routes/api.ts`, Berichtsmodule, `cli/`, `temp/legacyImportFromCsv/` | Berichte, Filter, Statistiken, Dashboard, verwendete API-Verträge, CSV-Ausgaben und vorhandene Importwerkzeuge erfassen und übertragen. Referenzdaten, Formate und Berechtigungen prüfen. |
| 13 | ConsignO Cloud und Benachrichtigungen | `integrations/consignoCloud/`, `integrations/ntfy/`, zugehörige Einstellungen und Aufgaben | Konfiguration, Aufrufe, Rückmeldungen und Fehlerzustände in Python. Realistische Vertragstests; ausstehende Live-Prüfung ohne Zugangsdaten ausdrücklich nennen. |
| 14 | Dynamics GP und Portal | `integrations/dynamicsGp/`, `integrations/portal/`, Portal-/OrderForm-Tabellen und geplante Aufgaben | Synchronisation, Zuordnungen, Verarbeitung, Wiederholungen und Fehlerbehandlung portieren. Vertragstests und nachvollziehbare Beispiele; ausstehende Live-Prüfung sichtbar halten. |
| 15 | Betriebsfunktionen und verbleibende Administration | Datenbank-/Audit-Administration, `tasks/`, Backup/Cleanup/Shutdown, `helpers/config.*`, verbliebene Admin-Funktionen | Auditansicht, Datenbereinigung, Jobs, Sicherungs-/Wiederherstellungsverfahren für SQL Server, Einstellungen und geordnetes Beenden. Referenzzuordnung und konkrete Betriebsprüfung. |
| 16 | Gesamtvergleich und Deployment-Paket abschließen | Funktionsnachweis, Quelltests, bisherige Berichte und Docker-Konfiguration | Alle erfassten Funktionen zuordnen, Lücken beheben, zentrale Browserabläufe und SQL-Persistenz prüfen, Branding vervollständigen. Docker-Images/Compose, Konfiguration, Datenbankmigrationen, persistente Dateien und Ubuntu-Anleitung fertigstellen. Benutzer führt danach Deployment und Praxistest aus. |

## Fortlaufender Funktionsnachweis

Schritt 01 legt `docs/portierung/UMFANG.md` an. Pro Funktion enthält er eine
stabile Kennung, Quellpfade, erwartetes Verhalten, Zielpfade, zuständigen
Schritt und den Prüfstatus. Betrachtet werden auch Browser-JavaScript,
statische Dialogfragmente, Konfiguration, Testfälle, Importwerkzeuge und
geteilte Pakete der Referenz. Die Tabelle wird mit jeder Umsetzung ergänzt.

Ein noch nicht zugeordneter Quellbereich bleibt ein offener Eintrag.
Ein optionaler Dienst mit Vertragstests und ohne Live-Zugang wird als
implementiert, aber live ungeprüft ausgewiesen. Ein Platzhalter wird als
offen ausgewiesen. Diese Unterscheidung muss im Schlussbericht sichtbar sein.

## Sessionabschluss

Subagents dürfen eingesetzt werden, wenn dies für sinnvoll abgrenzbare
Aufgaben hilft. Die Koordination und Integration bleibt beim Hauptagenten.

Nach jeder Session: passende Prüfungen ausführen, `berichte/NN.md` erstellen,
UMFANG.md und STATUS.md aktualisieren, den nächsten Auftrag eindeutig benennen
und die eigenen Änderungen selbständig lokal mit einer kurzen,
aussagekräftigen englischen Nachricht committen. Zusätzliche Sessions können
eingefügt werden, wenn der tatsächliche Umfang dies verlangt. Die Nummerierung
und der aktuelle Auftrag müssen dann gemeinsam angepasst werden.

Eine automatische Gesamtprüfung während der Umsetzung ergänzt den späteren
Praxistest auf Ubuntu. Es gibt keine zusätzlichen manuellen Freigabegates.

## Technische Quellen

- FastAPI/Docker: <https://fastapi.tiangolo.com/deployment/docker/>
- SQLAlchemy/SQL Server: <https://docs.sqlalchemy.org/en/20/dialects/mssql.html>
- React/Vite: <https://react.dev/learn/build-a-react-app-from-scratch>
