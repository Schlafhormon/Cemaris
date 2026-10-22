# Cemaris: Entwicklung und technische Konfiguration

Stand: Produktbereinigung 18, Version 0.2.0. Dieses Dokument beschreibt die
aktuelle Anwendung; historische 1:1-Nachweise stehen in den Portierungsberichten.

## Laufzeit und Architektur

Python 3.14.2, FastAPI 0.148.0, SQLAlchemy 2.1.5, Alembic 1.20.0 und pyodbc
5.3.0 bilden das Backend. Node.js 24.19.0, React 19.3.1, TypeScript 7.0.2
und Vite 8.3.4 bilden das Frontend. Die Locks enthalten auch transitive Pakete.
Microsoft ODBC Driver 18 verbindet den externen SQL Server 2019 oder neuer.

Genau ein API-Worker verwaltet serverseitige Sitzungen und die Sicherungsaufgabe.
Eine zusätzliche Node/EJS/Chromium-Laufzeit rendert ausschließlich Druckvorlagen.
Migrationen laufen vor dem API-Start, nicht beim ersten Webzugriff.
`/api/health` prüft die Prozessantwort, `deploy/readiness.py` zusätzlich SQL
und die zum Image passende Alembicrevision. Aktuell: **0003**.

## Lokale Entwicklung

```bash
uv sync --locked --project backend
npm ci --prefix frontend
npm ci --prefix backend/printing-runtime
uv run --locked --project backend uvicorn cemaris.main:app --app-dir backend --host 127.0.0.1 --port 8000
npm run dev --prefix frontend
```

Die vollständige Optionsliste liegt in [.env.example](../.env.example).
Pydantic liest `.env` relativ zum Arbeitsverzeichnis; für diese Befehle das
Repository als Arbeitsverzeichnis verwenden. Niemals `.env` mit `source` laden.

## Anmeldung und Berechtigungen

`CEMARIS_AUTH_TYPE` unterstützt `plainText`, `function`, `activeDirectory` und
`adWebAuth`. Ohne eingerichteten Adapter gibt es keine erfolgreiche Anmeldung.
`CEMARIS_AUTH_CONFIG` enthält private JSON-Konfiguration, beim Plaintextadapter
beispielsweise eine Zuordnung von Benutzern zu Kennwörtern. Beispiele und
Verbindungsoptionen stehen in `.env.example`. Der Adapter besitzt keinen
interaktiven Kennwortwechsel; ein geänderter Konfigurationswert erfordert einen
API-Neustart. Für produktiven Betrieb einen passenden zentralen Anmeldeweg wählen.

Loginfreigabe (`CEMARIS_AUTH_CAN_LOGIN`), Adminrecht und die drei fachlichen
Änderungsrechte sind getrennt. Eine Anmeldung erteilt keine pauschalen
Änderungsrechte. Cookiepfad und öffentliche URLs folgen `CEMARIS_URL_PREFIX`.
Sitzungen liegen im persistenten Sessionvolume, Schreibzugriffe benötigen CSRF.

## Sprache, Adressen und Geld

Deutsch ist der Fallback. Sprachwahl über Parameter und Sprachcookie hat
Vorrang vor unterstützten Browserpräferenzen. Englisch bleibt verfügbar.
Die Sprachkataloge liegen in `frontend/public/locales/{de,en}`; `npm test`
prüft Schlüssel, Platzhalter und statische Verbraucher.

Das Frontend zeigt Euro in der gewählten Sprachkonvention, standardmäßig
`de-DE` (z. B. `1.234,56 €`). Standarddrucke sind Deutsch/DIN A4. Es erfolgt
keine Umrechnung vorhandener Zahlenwerte und keine Änderung örtlicher
Gebührensätze. Die vorhandene Berechnungssemantik bleibt erhalten.

Adressbeschriftungen sind deutsch; Ort und Bundesland besitzen seit Migration
0003 jeweils bis zu 100 UTF-16-Einheiten. PLZ bleiben als Text gespeichert,
einschließlich führender Nullen. Die bisherigen SQL-Spaltennamen `Province`
bleiben aus Bestandskompatibilität erhalten. Es wird kein Ort/Bundesland einer
Kommune geraten. Örtliche Vorgaben werden in der Administration eingestellt.

Neue Kataloge starten mit deutschen Bezeichnungen. Migration 0003 übersetzt
nur unveränderte Installationsvorgaben mit Ersteller und letztem Bearbeiter
`databaseInit`; selbst angelegte oder bearbeitete Stammdaten bleiben erhalten.

## Druck und Dateien

`CEMARIS_CUSTOMIZATIONS_PATH` verweist auf vertrauenswürdige, vom Betreiber
installierte Vorlagen. `CEMARIS_CONTRACT_PRINTS` bestimmt erlaubte Drucke;
Vertragsarten dürfen diese weiter einschränken. Eigene EJS-Vorlagen führen
Servercode aus und gehören in die administrative Bereitstellung. Standarddrucke
enthalten Logo, deutsche Felder, Eurobeträge und A4-Seiten. Der mitgelieferte
Chromium wird verwendet; eine Anfrage lädt keinen Browser nach.

Uploads liegen im Attachmentvolume, Metadaten in SQL Server. Das Dateivolume
ist Teil der Sicherung. Soft gelöschte Dateimetadaten entfernen die Bytes nicht.
Sicherung und Wiederherstellung beschreibt [DEPLOYMENT.md](DEPLOYMENT.md).

## Prüfungen

```bash
uv run --locked --project backend pytest backend/tests -q
npm test --prefix frontend
npm run build --prefix frontend
docker compose config --quiet
```

Für SQL-Tests ausschließlich eine eigene entbehrliche Instanz verwenden und
`CEMARIS_SQL_TEST_ADMIN_URL` auf deren `master` setzen. Der Harness erzeugt und
entfernt seine eigenen zufälligen Datenbanken; niemals die laufende
Anwendungsdatenbank als Fixture verwenden. Ohne Testzugang werden SQL-Fälle
explizit übersprungen. Die optionalen Originalproben benötigen den unveränderten
Sunrise-Referenzcheckout und prüfen historische Quellregeln, keine heutigen
Altintegrationen. Die Produktabweichungen stehen in Bericht 18.

Die ältere CSV-Importhilfe ist nur für Wegwerfdatenbanken freigeschaltet. Sie
ist weder ein produktiver Datenimport noch die EDWALT-Migration.

## Entfernte Anbindungen und Kompatibilität

ConsignO, ntfy, Dynamics GP/Diamond, Sunrise-Portal und Find a Grave sind aus
Laufzeit, Konfiguration, Oberfläche und externen Zugriffen entfernt.
Migration 0002 entfernt gespeicherte ConsignO-Benutzereinstellungen samt
vorherigen Werten und den alten Portalsynchronisationsfehler. Alte
Sessioninhalte werden nicht mehr als Benutzereinstellungen ausgeliefert.

Die historische Schema-Grundlage 0001 wird nicht verändert. Unbenutzte
Portal-/Memorialspalten und die Tabelle `OrderForms` bleiben zur verlustfreien
Bestandsaktualisierung reserviert; sie aktivieren weder Routen noch Jobs noch
externe Übertragungen. Eine spätere physische Schemakonsolidierung benötigt
kein erneutes Einführen der Anbindungen. Herkunfts- und Lizenzbelege bleiben
auch für entfernte historische Komponenten nachvollziehbar.
