# Dashboard und Änderungsübersicht

Schritt 12, Referenz `451ce034863b16502484367044f3e9b65370111a`.
Ziel: `backend/cemaris/dashboard.py`, `frontend/src/dashboard.tsx`.
Keine Schemamigration.

## Quellzuordnung

| Quelle | Übertragene Funktion |
| --- | --- |
| `handlers/dashboardGet/dashboard.ts`, `views/dashboard/dashboard.ejs` | Cemaris-Titel, maskierte Fehlerausgabe, fachliche Einstiegskarten, Rollen für Neuanlage/Karte, Berichtsbibliothek und Änderungsübersicht, Hilfe/GitHub, vollständige Admin-Verweise |
| `app/app.ts`, Katalogleser/-caches | Aktive Kataloganzahlen und rote Nullhinweise; `configTables` ist das Minimum von sieben Kataloganzahlen, keine Summe |
| `handlers/dashboardGet/updateLog.ts`, `views/dashboard/updateLog.ejs`, `public/javascripts/updateLog.ts` | Datensatzart und Anzahl 10/50/100, aktualisiert/erstellt sortieren, weitere Datensätze anhängen, Elternverweise, Benutzer und lokale Zeiten, Erstellungs-/Änderungskennzeichnung |
| `database/getRecordUpdateLog.ts`, `handlers/dashboardPost/doGetRecordUpdateLog.ts` | SQL-Union aller neun Datensatzarten, Zeitraum, Filtergruppen, Beschreibungen, Limit/Offset, erlaubte Sortierspalten/-richtungen |
| `routes/dashboard.ts` | Dashboard und Änderungsübersicht in React/API; Benutzereinstellungen, Sprachwahl und Schlüsselrotation bestehen seit 03 in `preferences.py`/`pages.tsx`; Dienstaufrufe gehören 13 |
| `routes/api.ts`, `handlers/apiGet/milestoneICS.ts` | Der einzige öffentliche Quell-API-Endpunkt ist `/api/milestoneICS`; einschließlich API-Schlüssel und Export bereits seit 10 in `work_orders.py` implementiert und geprüft |
| `public/javascripts/theme.ts`, `public/html/quickSearch.html` | Globale Schnellsuche in `App.tsx`: Vertragsnummer als erstes Auswahlfeld, alternative verstorbene Person, encodierte Query/Arbeitsauftragsnummer, Suchseitenverweise, Fokus und Dialogschließen |
| `public/javascripts/search.ts`, `views/contracts/search.ejs` | Ein-/Ausklappen von Orts-/Kontaktfiltern: React-Zustand, `hidden` und Pfeil sowie `aria-expanded`/`aria-controls` in `contracts.tsx`; Filterwerte bleiben erhalten |

Die Referenz enthält auf dem Dashboard keine fachlichen Statistikabfragen oder
globale Dashboard-Suche. Die allgemeine Schnellsuche gehört zur Navigation.
Die Katalogzahlen sind Konfigurationshinweise.
Die ausführliche historische Auditverwaltung und Datenbankwartung bleiben 15;
ihre Dashboard-Verweise werden wie in der Referenz angeboten.

## Verträge und Quellbesonderheiten

- `GET /api/dashboard`: angemeldet; `{configCounts, auditLogEnabled}`.
  Katalogzahlen werden für Administratoren geliefert. Direkte SQL-Lesen ersetzen
  den bereits in 04 dokumentierten Prozesscache.
- `POST /api/dashboard/doGetRecordUpdateLog`: angemeldet, auch lesende Benutzer;
  CSRF. Der Quellpfad `/dashboard/doGetRecordUpdateLog` ist zusätzlich verfügbar.
  Antwort bleibt `{updateLog: [...]}`. Standardlimit 100, Obergrenze 10.000;
  negative Limits bedeuten unbegrenzt, negative Offsets werden wie SQLite zu 0.
  Die Oberfläche verwendet zunächst 50 und höchstens 100 Datensätze je Abruf.
- Erfasst werden aktive Verträge, Transaktionen, Arbeitsaufträge, Meilensteine,
  Grabstätten, Vertragsgebühren und die drei Kommentararten mit
  `recordUpdate_timeMillis >= jetzt - 30 Tage`. Die Grenze ist eingeschlossen.
  Pro Datensatz erscheint der aktuelle Änderungsstand, keine Änderungshistorie.
- Filter `contract` umfasst Vertrag, Gebühren und Transaktionen, aber keine
  Kommentare. `workOrder` umfasst Auftrag und Meilensteine, keine Kommentare.
  `comments` umfasst alle drei Kommentararten. `burialSite` enthält nur Grabstätten.
- Vertragsgebühren, Transaktionen und Vertragskommentare bleiben sichtbar,
  wenn der Vertrag soft-gelöscht ist. Meilensteine sowie Arbeitsauftrags- und
  Grabstättenkommentare schließen soft-gelöschte Eltern aus. Gelöschte Kataloge
  bleiben bei der Beschreibung historischer Referenzen lesbar.
- Beschreibungen und finanzielle Präfixe bleiben wie im Quell-SQL englisch;
  Kommentare werden nach 100 Unicode-Codepunkten mit `...` gekürzt. Leere und
  ausschließlich aus Leerzeichen bestehende Beschreibungen bleiben verschieden.
  Geldtexte folgen dem binären SQLite-`PRINTF('%.2f')`, etwa `1.005 -> 1.00` und
  `2.675 -> 2.67`, einschließlich der 16 signifikanten Ausgabestellen.
- Lokale Browserzeiten verwenden den Quellzyklus `h24`; beispielsweise wird
  00:05 als `24:05` angezeigt. Die beiden Datumssortierungen fallen bei
  unbekannten Werten auf Aktualisierung/absteigend zurück. Die Quelle definiert
  bei identischen Sortierzeitpunkten keine zusätzliche Reihenfolge.
- Technisch explizit: unbekannte Datensatzarten und ungültige/nicht ganzzahlige
  numerische Pagination liefern 400 statt eines internen SQLite-SQLfehlers.
  Stringzahlen werden wie im Quellhandler mit JavaScript-`Number` und `trunc`
  interpretiert. SQL Server erlaubt `FETCH 0` nicht; Limit 0 liefert daher direkt
  die auch in der Quelle leere Liste. Ungültige Sortierwerte bleiben gebunden bzw.
  werden über die feste Positivliste ersetzt.
- Die statischen englischen Beschriftungen der Quell-Änderungsübersicht erhalten
  zusätzlich deutsche Beschriftungen. Sprachkataloge und Sprachfallback bleiben
  erhalten. React maskiert Beschreibung, Anzeigenummer und Benutzername.
- Die Schnellsuche startet mit `contractNumber`; `deceasedName` führt zur
  entsprechenden Vertragsquery. Arbeitsaufträge verwenden den bestehenden
  Nummernauflöser `/workOrders/byWorkOrderNumber/<encodierte Nummer>`.
  Unicode, Leerzeichen, `&`, `/`, `?`, `#`, `%`, `+` und literale HTML-Zeichen
  bleiben durch `encodeURIComponent` Teil des Suchwerts. Ein manipuliertes
  unbekanntes Suchfeld meldet den Quellfehler, statt ein beliebiges Queryfeld
  zu erzeugen. Die Pflichtfelder gelten weiterhin vor der Formularabgabe.
- Die gemeinsamen Filterumschalter ändern die Sichtbarkeit und den Pfeil,
  ohne Werte oder Suchkriterien zurückzusetzen. Kontaktfilter starten geschlossen;
  Ortsfilter werden bei einer übergebenen Friedhofs-ID wie in der Quelle geöffnet.

## Nachweise

`node scripts/reference_dashboard.mjs --check-fixture` führt die tatsächlichen
unveränderten JavaScript-Funktionskörper und das Quell-SQL aus. 25 gehashte
Quellartefakte, 36 synthetische Datensätze, 55 Abfragekombinationen, fünf echte
POST-Handlerfälle, acht GET-Handlerausgaben und 17 Geldformatfälle stehen in
`backend/tests/fixtures/dashboard-reference.json`. SQLite dient ausschließlich
als Originalorakel; Zielpersistenz ist SQL Server.

Das tatsächliche Original-Browserskript wird mit einer ausdrücklich injizierten
DOM-/HTTP-/Formatiergrenze ausgeführt: neun Datensatzarten, maskierte Inhalte,
Elternverweise sowie sieben Abrufe mit Sortierwechsel, Filter, Limit und
Nachladen. Die tatsächlichen React-Helfer für Verweise und Zeitdarstellung
werden daraus vergleichend ausgeführt, einschließlich Mitternacht und DST.
Die eingesetzte Node-API zur TypeScript-Typentfernung meldet einen bekannten
experimentellen Hinweis; sie ändert weder Quellcode noch Abhängigkeiten.

Zusätzlich läuft das unveränderte komplette `theme.js` mit injizierter
DOM-/Navigation-/Modalgrenze: **14 Schnellsuchfälle** mit leerem bzw. gesetztem
URL-Präfix, Nummer-/Namenssuche, Unicode und URL-Sonderzeichen, ungültigem/leeren
Auswahlfeld, Arbeitsauftragsnummer, Dialoglinks, Fokus und Öffnen/Schließen.
`quickSearch.html` belegt dabei das tatsächliche Standardfeld. Das unveränderte
`search.js` prüft beide anfänglichen Sichtbarkeiten, zweimaliges Umschalten,
erhaltene Filterwerte und fehlende Nachbar-/Pfeilelemente. React bildet diese
beiden Filterzustände in den vorhandenen Vertragsfiltern mit `hidden` und
Zustandsumschaltern ab; der Produktionsbrowser des Hauptberichts prüft die
tatsächliche React-Bedienung zusätzlich unabhängig vom injizierten Original-DOM.

`backend/tests/test_dashboard.py` vergleicht alle SQL-/Handlerfälle auf einer
eigens erzeugten entbehrlichen SQL-Server-Datenbank. Weitere Fälle prüfen
Zahlenregeln, Geldformat, SQL-Server-Kompilation, Nullzähler, Leserolle,
Adminhinweise, unangemeldete Zugriffe, CSRF und kontrollierte Fehler.
Der Hauptbericht 12 enthält die finalen serialisierten Test- und Browserergebnisse.
Die komplette Sunrise-App und deren Cypress/Axe-Suite wurden damit nicht als
ausgeführt nachgewiesen. Docker-/Linux-Nachweise bleiben im Gesamtstatus offen.
