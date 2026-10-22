# Cemaris

Cemaris ist eine Friedhofsverwaltung für deutsche Kommunen. Die Anwendung
verbindet Friedhöfe und Grabstätten mit Grabnutzungsverträgen, Beteiligten,
Beisetzungen, Leistungen, Gebühren, Zahlungen und Arbeitsaufträgen.

Die Oberfläche verwendet standardmäßig Deutsch, Euro und deutsche
Datumsformate. Englisch ist zusätzlich auswählbar. Vertragsausdrucke und
Arbeitsaufträge werden mit Cemaris-Branding auf DIN A4 ausgegeben.

## Funktionen

- Friedhöfe, Grabstätten, Belegung, Lagepläne, Koordinaten und Grabsuche
- Nutzungsverträge, Nutzungsberechtigte, Bestattungsunternehmen und Beisetzungen
- Konfigurierbare Stammdaten, Zusatzfelder, Leistungen und Gebühren
- Zahlungen, offene Beträge, Berichte und CSV-Exporte
- Arbeitsaufträge, Termine, Meilensteine und Kalenderexport
- Anhänge, Vertragsdruck, PDF-Ausgaben und eigene Druckvorlagen
- Benutzer, Rollen, Sitzungen und optionales Änderungsprotokoll

Gebührensätze, Nutzungsdauern und örtliche Regelungen werden durch die jeweilige
Kommune festgelegt. Cemaris liefert keine verbindliche kommunale Gebührensatzung.
Bestehende Geldbeträge werden durch die Euro-Anzeige nicht umgerechnet.

## Installation und Betrieb

Cemaris verwendet Python/FastAPI, SQLAlchemy, Alembic und pyodbc sowie
React/TypeScript/Vite. Die Anwendungsdaten liegen ausschließlich in einem
externen Microsoft SQL Server ab Version 2019. Docker Compose betreibt einen
Migrationsdienst, genau einen API-Prozess und das Webfrontend mit Nginx.

1. `.env.example` nach `.env` kopieren und SQL-Verbindung, Anmeldung,
   öffentliche URL, Cookie- und Proxyeinstellungen eintragen.
2. `docker compose config --quiet` ausführen.
3. `docker compose build` ausführen.
4. `docker compose run --rm --no-deps migrate` ausführen.
5. Bei einer neuen leeren Installation optional die deutschen Stammdaten mit
   `docker compose run --rm --no-deps --entrypoint /app/.venv/bin/python api manage.py seed-catalogs` anlegen.
6. `docker compose up -d --wait --wait-timeout 180` ausführen.

Es gibt kein eingebautes Standardkennwort. SQL-Daten, Anhänge und eigene
Druckvorlagen gehören gemeinsam in das Sicherungsverfahren. `.env` enthält
Geheimnisse und gehört weder in Git noch in öffentliche Protokolle.

- [Installations- und Betriebshandbuch](docs/DEPLOYMENT.md)
- [Aktuelle Installation auf SRV-UbuntuApp](docs/SERVER_DEPLOYMENT.md)
- [Entwicklung, Konfiguration und Prüfungen](docs/TECHNIK.md)
- [Produktbereinigung und verbleibende Punkte](docs/portierung/berichte/18.md)

## Entwicklung

Die tatsächlich verwendeten Abhängigkeiten sind in `backend/uv.lock`,
`frontend/package-lock.json` und `backend/printing-runtime/package-lock.json`
fixiert. Die kleine Node/EJS/Chromium-Komponente rendert Druckvorlagen;
Fachanwendung und SQL-Zugriff bleiben in Python.

```bash
uv sync --locked --project backend
npm ci --prefix frontend
npm ci --prefix backend/printing-runtime
uv run --locked --project backend pytest backend/tests -q
npm test --prefix frontend
npm run build --prefix frontend
```

Datenbanktests benötigen eine eigens dafür bestimmte entbehrliche
SQL-Server-Instanz. `CEMARIS_SQL_TEST_ADMIN_URL` muss dort ausdrücklich auf
`master` zeigen; die Tests erzeugen und entfernen nur eigene zufällige
`cemaris_test_02_<uuid>`-Datenbanken. Verwaltungs- und Produktivdatenbanken sind
keine Testfixtures. Ohne Testverbindung werden SQL-Nachweise übersprungen.

## Herkunft und Produktstand

Cemaris entstand aus einer abgeschlossenen Portierung von Sunrise CMS
(`1.0.0-beta.21`, Commit `451ce034863b16502484367044f3e9b65370111a`).
Seit Version **0.2.0** wird es als eigenständiges Produkt weiterentwickelt.
Dieser Stand ist auf SRV-UbuntuApp bereitgestellt; die verbleibenden
Betriebs- und Abnahmepunkte stehen in der Serverübergabe.
ConsignO, Dynamics GP/Diamond, das Sunrise-Portal, Find a Grave, ntfy und die
Sunrise-Hilfe gehören nicht mehr zum Produkt. Die EDWALT-Datenübernahme ist ein
separater Auftrag und wurde noch nicht durchgeführt.

Übernommene Bestandteile behalten ihre Lizenz- und Copyright-Hinweise:
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [Lizenzen](licenses/).
Die gelieferten Logos liegen unter `frontend/public/branding/` und sind in den
Docker-Artefakten enthalten. Historische Portierungsbelege bleiben unter
[docs/portierung](docs/portierung/) erhalten; aktuelle Arbeiten beginnen beim
[Status](docs/portierung/STATUS.md) und [AGENTS.md](AGENTS.md).
