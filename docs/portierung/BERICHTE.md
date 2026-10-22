# Berichte und CSV-Verträge

Stand: Schritt 12, 20.10.2026. Quelle ist der unveränderte Sunrise-Commit
`451ce034863b16502484367044f3e9b65370111a`, Lizenzhinweise in
`licenses/Sunrise-LICENSE.md`.

## Umsetzung und API

`backend/cemaris/reports.py` überträgt sämtliche **45** registrierten
Berichte: 36 Einträge aus `helpers/reports.helpers.ts` und neun zusätzliche
Fälle aus `database/getReportData.ts`. Dazu gehören vollständige Tabellen,
formatierte Friedhofs-/Bestatter-/Portalformulardaten, Grabstätten nach
Friedhof/Art/Status, Beisetzungen je Vertrag, das Beisetzungsverzeichnis,
aktuelle Verträge je Friedhof, Transaktionen je Datum, Meilensteine je
Arbeitsauftrag und offene Arbeitsaufträge einschließlich Meilensteinzahlen.
Die Quellregistrierung ist bewusst keine Ausgabe aller 41 Schema-Tabellen.

| Schnittstelle | Verhalten |
| --- | --- |
| `GET /api/reports` beziehungsweise `/api/reports/` | vollständige Berichtsnamen, Rohdaten-/Formatzuordnung, Filterparameter, aktiver Friedhofs-/Art-/Statuskatalog, heutiges Datum und Portal-Sichtbarkeitsflag |
| `GET /api/reports/{reportName}` | CSV mit Filtern aus der Query |
| `POST`/`PUT`/`PATCH`/`DELETE /api/reports/{reportName}` | derselbe Lesevorgang, mit globaler CSRF-Prüfung; wie in Sunrise werden ausschließlich Query-Parameter ausgewertet |
| `HEAD`/`OPTIONS`/`TRACE /api/reports/{reportName}` | ebenfalls lesend; HEAD liefert den tatsächlichen UTF-8-Content-Length ohne Body |
| dieselben Methoden unter `/reports/{reportName}` | kompatibler Downloadpfad mit demselben Ergebnis |

Die normale React-Seite liegt unter `/reports`. Alle Downloads und die
Metadaten benötigen eine angemeldete Sitzung. Die Quelle setzt keine
zusätzliche Berichts-, Administrator- oder Änderungsrolle voraus; dies gilt
auch für Rohdaten einschließlich bereits soft-gelöschter Datensätze.
Unbekannte Namen liefern HTTP 404 mit dem Quellobjekt
`{"success":false,"message":"Report Not Found"}`. Fehlende oder mehrfach
angegebene Pflichtfilter sowie ungültige Datumswerte führen kontrolliert zu
HTTP 400; die Original-SQLite-Bindung wirft bei fehlenden Parametern einen
Fehler. Nichtnumerische ID-Zeichenketten treffen wie in SQLite keine Datensätze
und liefern eine leere CSV. Unbenutzte
Parameter und der POST-Body ändern den Bericht nicht.

`CEMARIS_PORTAL_ENABLED` (Standard `false`) steuert die zusätzliche
Portalformular-Verknüpfung im Berichtsdialog. Direkte OrderForms-Berichte
bleiben entsprechend der Quelle unabhängig davon abrufbar. Die tatsächliche
Portalsynchronisation gehört zu Schritt 14.

## Daten-, Datums- und Formatregeln

- `*-all` verwendet alle Quellspalten in ihrer ursprünglichen Reihenfolge,
  ohne Löschfilter und ohne zusätzlich erfundene Sortierung. Die drei
  formatierten einfachen Berichte filtern `recordDelete_timeMillis IS NULL`.
  Nur die formatierte Friedhofsliste sortiert ausdrücklich nach dem Namen.
- Die Grabstättenberichte filtern ausschließlich die aktive Grabstätte und
  das ausgewählte Feld. Gelöschte Friedhofs-, Art- oder Statuseltern werden
  wie im Original weiterhin über den Join angezeigt. Bei Beisetzungen je
  Vertrag und Transaktionen je Datum wird ausschließlich das jeweilige Kind
  auf aktive Daten gefiltert, nicht zusätzlich sein Vertrag.
- „Aktuelle Verträge je Friedhof“ enthält auch Verträge mit zukünftigem
  Vertragsbeginn und solche mit Ende genau heute. Das Beisetzungsverzeichnis
  verlangt dagegen Beginn spätestens heute, Ende nach heute oder NULL,
  einen nicht vorbesorgten Vertrag (`isPreneed = 0`), aktive Beisetzung und
  aktiven Vertrag sowie eine tatsächlich zugeordnete Grabstätte. Die
  Grabstätte und ihre Katalog-/Friedhofseltern müssen selbst nicht aktiv sein.
  Die Ausgabe sortiert nach Verstorbenenname und Sterbedatum.
- Offene Arbeitsaufträge haben NULL-Enddatum. Nur aktive Meilensteine zählen
  mit; ein beliebiges Nicht-NULL-Abschlussdatum gilt als abgeschlossen.
  Ohne aktive Meilensteine sind beide Zahlen im Bericht **NULL**, wie in der
  Quelle; die normale Arbeitsauftragsansicht hat andere Aggregatdefaults.
- Transaktionsdatum verwendet den gesperrten Quelldatumshelfer. Auch dessen
  Normalisierung formal passender Kalenderüberläufe bleibt erhalten, etwa
  `2026-02-31`. Die bestehenden kompakten Teil-/Datums-/Zeitwerte werden in
  den CSV-Spalten nicht nachträglich in Anzeigezeichenketten umgewandelt.
- CSV folgt exakt `papaparse@5.7.0` mit Standardoptionen: erste Zeile als
  Spaltennamen, CRLF zwischen Datensätzen, kein abschließender Zeilenumbruch,
  Komma als Trennzeichen, verdoppelte Anführungszeichen und Quoting für
  Komma/Anführungszeichen/CR/LF/BOM sowie führende/abschließende ASCII-Leerzeichen.
  NULL ist eine leere Zelle; eine vollständig leere Ergebnismenge ergibt
  **null Bytes ohne Kopfzeile**. UTF-8 hat keinen zusätzlich vorangestellten
  BOM. Formelförmiger Text bleibt unverändert, entsprechend den Quelloptionen.
- SQL-Server-BIT-Werte werden vor der CSV-Erzeugung zu `0`/`1` zurückgeführt,
  damit pyodbc-Booleans nicht als `false`/`true` erscheinen. Binäre64-Beträge
  verwenden die gemeinsame JavaScript-Zahlendarstellung. Dateinamen lauten
  `{reportName}-{epochMilliseconds}.csv`; Content-Type ist `text/csv` mit UTF-8.

Abfragen ohne `ORDER BY` versprechen auf keiner der beiden Datenbanken eine
bestimmte Datensatzreihenfolge. Der Vergleich prüft dort alle Datensätze,
alle Spalten in exakter Reihenfolge und jede vollständig serialisierte
CSV-Zeile. Bei den beiden ausdrücklich sortierten Berichten wird zusätzlich
die vollständige CSV-Ausgabe direkt verglichen. Die zwei ausdrücklich
sortierten Berichte werden nach dem SQL-Lesen zusätzlich nach Unicode-
Skalarwerten sortiert; das erhält SQLite-BINARY-/UTF-8-Reihenfolge auch bei
Ergänzungszeichen, privatem Unicode-Bereich, NUL und nachgestellten Leerzeichen
gegenüber SQL Servers UTF-16-BIN2-Sortierung. Im Verzeichnis kommt bei
identischem Namen zuerst NULL-Sterbedatum. Die Friedhofs-Filterauswahl
verwendet dieselbe Namenssortierung mit ID als zweitem Schlüssel.
SQL Server behält die bereits
in `DATENSEMANTIK.md` ausgewiesenen Typ-/Längen-/Kollationsgrenzen; es wird
keine vollständige SQLite-Speicheräquivalenz behauptet.

## Reproduzierbarer Originalvergleich

`node scripts/reference_reports.mjs --check-fixture` führt die unveränderten
Originalfunktionskörper, originale SQL-Abfragen und tatsächliche gesperrte
Papa-Parse-/Datums-Pakete aus. Die Integritäten beider npm-Archive und 17
Quellartefakte werden nachgewiesen. Der Test verwendet ausschließlich für
das **Quellorakel** eine SQLite-Datenbank mit 125 verknüpften synthetischen
Datensätzen; die Zieltests laufen gegen eine eigene entbehrliche SQL-Server-
Datenbank. Die Sunrise-Arbeitskopie wird nicht verändert oder installiert.

Die Fixture `backend/tests/fixtures/reports-reference.json` enthält alle 45
Berichte mit nichtleeren Ergebnissen, sämtliche 45 leeren Ergebnismengen,
92 Parameterfälle, 32 direkte CSV-Fälle, fünf tatsächliche Berichtshandler-,
acht HTTP-Methoden- und sieben Suchseitenhandler-Ergebnisse. Datum und Uhrzeit sind auf
20.10.2026, 09:05:42 Europe/Berlin fixiert. Request/Response und Cachezugriffe
sind injizierte Grenzen; es wird keine vollständige Sunrise-App-Ausführung
behauptet. Der Produktionsbrowser ergänzt die tatsächliche React-Bedienung.

`backend/tests/test_reports_reference.py` vergleicht Quellspalten,
SQL-Server-Abfragen, CSV, Datumsgrenzen, Vorbesorgung, Löschzustände,
Milestone-NULL-Aggregate, Parameterkonvertierung und die HTTP-Verträge.
Elf zusätzliche Sortiernamen prüfen leere Namen, NUL, Groß-/Kleinschreibung,
Akzente, nachgestellte Leerzeichen, privates Unicode, Supplementärzeichen
und Emoji. Jeder Name steht im Verzeichnis mit NULL- und nichtleerem
Sterbedatum. Alle 45 Downloads werden über API- und kompatiblen Pfad geprüft. Leser,
Administrator sowie die vier Änderungsrollen, anonyme Zugriffe und CSRF
haben eigene Fälle. Ausgeführte Prüfungen und ihre abschließenden Zahlen
stehen in `berichte/12.md`.

Prüfbefehle aus dem Repository:

```powershell
node scripts/reference_reports.mjs --check-fixture
uv run --locked --project backend pytest backend/tests/test_reports_reference.py -q --tb=short
```

SQL-Tests werden seriell mit `CEMARIS_SQL_TEST_ADMIN_URL` auf `master` und
zufälligem `cemaris_test_02_<uuid>` ausgeführt. Die Testadministration erzeugt
und entfernt ausschließlich die selbst angelegten Datenbanken. Docker,
Linux-ODBC und der spätere Ubuntu-Praxistest bleiben eigene Betriebsnachweise.
