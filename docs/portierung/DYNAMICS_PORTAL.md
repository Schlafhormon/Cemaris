> Historischer Portierungsbeleg. Die hier beschriebenen Anbindungen wurden
> in Schritt18 auf Betreiberauftrag entfernt. Aktueller Produktstand:
> [Bericht18](berichte/18.md) und [TECHNIK.md](../TECHNIK.md).

# Dynamics GP und Portal

Schritt 14, feste Sunrise-Referenz `451ce034863b16502484367044f3e9b65370111a`.
Beide Integrationen sind optional und standardmäßig deaktiviert. Es wurde
kein externer Mandant eingerichtet. Die übrige Anwendung benötigt diese Dienste
nicht. Die tatsächliche Portal-Anwendung ist ein externer Dienst und gehört
nicht zum hier portierten Sunrise-Repository.

## Dynamics GP und Diamond

Quellen: `integrations/dynamicsGp/{helpers,types}.ts`,
`handlers/contractsPost/doGetDynamicsGPDocument.ts`,
`database/getContractTransactions.ts`, Vertragsansichten und
`public/javascripts/contract.editTransactions.ts`. Der SQL-Adapter folgt dem
gesperrten Paket `@cityssm/dynamics-gp` **1.7.1**, einschließlich dessen
tatsächlicher SQL-Anweisungen und Caches. Python-Ziele:
`backend/cemaris/dynamics_gp.py` und `dynamics_gp_sql.py`; React:
`frontend/src/contract-finance.tsx`. Herkunft/Lizenz bleiben erhalten.

| Umgebungsvariable | Quellkonfiguration / Bedeutung |
| --- | --- |
| `CEMARIS_DYNAMICS_GP_ENABLED=false` | `integrations.dynamicsGP.integrationIsEnabled` |
| `CEMARIS_DYNAMICS_GP_DATABASE_URL` | separate `mssql+pyodbc`-Verbindung zur GP-Firmendatenbank; ersetzt `mssqlConfig` |
| `CEMARIS_DYNAMICS_GP_LOOKUP_ORDER='["invoice"]'` | geordnete Liste: `invoice`, `diamond/extendedInvoice`, `diamond/cashReceipt` |
| `CEMARIS_DYNAMICS_GP_ITEM_NUMBERS='[]'` | jeder konfigurierte Artikel muss in den Rechnungspositionen vorkommen |
| `CEMARIS_DYNAMICS_GP_ACCOUNT_CODES='[]'` | bei nichtleerer Liste muss mindestens ein Kassenbelegdetail oder eine Verteilung einen passenden `accountCode` besitzen |
| `CEMARIS_DYNAMICS_GP_TRIAL_BALANCE_CODES='[]'` | zusätzliche Auswahl für die erweiterte Diamond-Rechnung |

Die separate Verbindung verwendet ausschließlich SELECT-Anweisungen. Der
Betreiber stellt dafür einen lesenden SQL-Benutzer bereit; Cemaris erzeugt
oder migriert keine GP-Tabellen. Die Verbindung öffnet erst bei einem Abruf.
Quelle und Ziel probieren die Lookuparten in Reihenfolge, fangen Fehler je
Lookup ab und setzen mit der nächsten Art fort. Der erste gefundene und
zugelassene Beleg gewinnt. Es gibt keinen Schreibabgleich und keinen Import
von GP-Zahlungen in Cemaris. Ein Fehler kann wie in der Quelle als fehlender
Beleg erscheinen; Verbindungsdetails werden nicht öffentlich ausgegeben.

Erhaltene Besonderheiten:

- `diamond/extendedInvoice` liefert bei **leeren** `trialBalanceCodes` keinen
  Beleg, selbst wenn die Rechnung existiert. Alle Artikelbedingungen gelten
  zusätzlich. Unbekannte Lookuparten liefern kein Ergebnis.
- Aktuelle und historische Rechnungen/Positionen, Diamond-Erweiterung,
  aktuelle/historische Kassenbelege, Verteilungen und Kontonummersegmente
  verwenden die originalen Abfragen. `TOP`/`UNION` ohne abschließende
  Sortierung erhalten keine erfundene Priorität.
- Aktueller Kassenbeleg: Gesamtbetrag aus Saldo plus Steuer; historischer
  Kassenbeleg: erhaltener Betrag. Nur Beschreibungen 1–5 werden übertragen.
  Rechnungen verwenden Kommentarzeilen 1–4 und den Dokumentbetrag.
- Positive Dokumentfunde sind 60 Sekunden zwischengespeichert; fehlende
  Dokumente werden erneut gesucht. Rückgaben sind Kopien. Abgelaufene Einträge
  werden ohne zusätzlichen Hintergrundthread eingesammelt.
- SQL-Datumswerte werden entsprechend dem ursprünglichen `mssql`-Standard
  als UTC mit Millisekunden serialisiert. SQL-`RTRIM` bleibt Bestandteil der
  Originalabfragen. Das sind GP-Belegzeitpunkte, keine Cemaris-HHMM-Werte.

`POST /api/contracts/doGetDynamicsGPDocument` und der Originalalias
`/contracts/doGetDynamicsGPDocument` erwarten `{externalReceiptNumber}`.
Antwort: `{success:false}` oder `{success:true,dynamicsGPDocument:{documentType,
documentDate,documentNumber,documentDescription,documentTotal}}`. Die Aktion
benötigt Vertragsänderungsrecht und CSRF; deaktiviert ist sie nicht registriert.
Vite und Nginx leiten den Originalalias zur API.

Vertragsansicht/-editor und Transaktionsänderungsantworten reichern vorhandene
Transaktionen an. Suche und Rohdatenberichte führen keine GP-Abfragen aus.
Leser sehen den Abgleich an lesbaren Verträgen, können die eigenständige
Lookupaktion aber nicht ausführen. Beim Hinzufügen prüfen Verlassen der
Belegnummer/des Betrags die aktuelle Eingabe. Exakter Betrag, abweichender
Betrag, fehlender Beleg und leere Nummer besitzen die Quellanzeigen. Der
Bearbeitungsdialog installiert wie die Quelle keine Lookupprüfung. Ein
abweichender Beleg blockiert keine Transaktionsanlage.

Technische Grenzen: vorhandener SQL-Adapter mit 10 Sekunden Verbindungs- und
30 Sekunden Statementtimeout; ein Lookup kann mehrere Statements ausführen.
Der eigene Browserlookup wartet bis 120 Sekunden. Allgemeine Vertragsabrufe
behalten ihre bisherige Browserfrist; viele langsame Belegabfragen benötigen
einen Betriebsnachweis am echten GP-System. Das Ende einer Browserfrist
bricht eine bereits laufende ODBC-Anweisung nicht rückwirkend ab.

## Portalprotokoll und Aufgaben

Quellen: vollständig `integrations/portal/`,
`database/getUnprocessedOrderForms.ts`, Portalaufrufe der Katalog-, Friedhofs-
und Bestattermodule, `index.ts`, Vertrags-/Bestattersuchseiten und
`views/contracts/{_menu,orderForms}.ejs`. Endpunktkonstanten und Payloads folgen
der gesperrten Version von `sunrise-cms-shared`. Ziel:
`backend/cemaris/portal.py`, vorhandene SQL-Server-Tabellen und React
`frontend/src/portal.tsx`. Keine Schemamigration; weiterhin Revision 0001.

| Umgebungsvariable | Bedeutung |
| --- | --- |
| `CEMARIS_PORTAL_ENABLED=false` | Integration und vorhandene Portalformfelder/Links aktivieren |
| `CEMARIS_PORTAL_API_URL` | API-Basisadresse des vorhandenen Portalservers |
| `CEMARIS_PORTAL_API_KEY` | vorhandener API-Schlüssel |
| `CEMARIS_PORTAL_TIMEOUT_SECONDS=30` | technische Frist je HTTP-Anfrage |
| `CEMARIS_PORTAL_POLL_ENABLED=true` | Hintergrundempfang starten; für deterministische Prüfungen abschaltbar |

Originalprotokoll: `POST {apiUrl}/{apiKey}/{endpoint}`, immer
`Content-Type: application/json`. Die Zeichenkettenverkettung bleibt erhalten,
auch ein doppelter Slash nach einer Basisadresse mit abschließendem Slash.
Der Schlüssel steht zwingend im Pfad. Fehler/Logs geben keine vollständige
Zieladresse oder Verbindungszeichenkette aus. Redirects werden technisch
abgelehnt; HTTP-Anfragen haben eine endliche Socket-/Lesefrist.

`doDataSync` überträgt genau acht Listen: `burialSiteTypes`, `cemeteries`,
`committalTypes`, `contractTypes`, `funeralHomes`, `intermentContainerTypes`,
`intermentDepths`, `serviceTypes`. Nur aktive, ausdrücklich für das Portal
markierte Datensätze sind enthalten. Spalten und Reihenfolge folgen der
Quelle; Friedhöfe enthalten bei vorhandenen Werten `directionsOfArrival`.
`isPreneed` wird als 0/1 übertragen. Keine Gebühren, Grabstätten, Verträge oder
Personen wurden dem Payload hinzugefügt.

Die Katalog-/Friedhofs-/Bestatteraktionen stoßen den Snapshot **nach dem
SQL-Commit** an. Anlage synchronisiert nur bei gesetzter Portalmarkierung;
Updates/Löschungen der entsprechenden Stammtabellen synchronisieren auch beim
Entfernen einer Markierung. Erhaltene Ausnahmen: neue Dienstleistungsart ohne
Trigger, Reihenfolgeänderung ohne Trigger, Bestatterwiederherstellung ohne
Trigger. Start allein überträgt keinen Katalogsnapshot. Outbound-Trigger
benötigen Aktivierung, Schlüssel und Basisadresse. Jeder ausgelöste Lauf hat
einen Versuch; es gibt keinen erfundenen periodischen Outbound-Retry.

Der Empfang läuft sofort im Hintergrund und anschließend alle **180 Sekunden**:

1. `doGetUnprocessedOrderForms` ohne Requestbody abrufen.
2. Jedes Formular mit fremder ID, dauerhaftem Schlüssel, unverändertem
   `orderFormData`, Erstell-IP und -Zeit lokal in `OrderForms` speichern.
   Der erste Empfang setzt eine lokale Synchronisationszeit.
3. `doMarkOrderFormAsSynced` mit `{orderFormId}` senden.
4. Nach erfolgreicher Bestätigung die gelieferte `recordSync_timeMillis`
   am lokalen Datensatz aktualisieren.

Die lokale Speicherung ist vor der Bestätigung committed. Schlägt die
Bestätigung fehl, bleibt das Formular erhalten und der nächste Lauf bestätigt
es erneut. Ein bekannter Schlüssel überschreibt weder Formulardaten noch
Verarbeitungs-/Löschstatus, selbst wenn neue ID oder andere Daten geliefert
werden. SQL Server schützt die Schlüsselprüfung mit Bereichssperren; ein
fremder ID-Konflikt bleibt ein Fehler. Kein verteilter Provider-/SQL-Commit.

HTTP 403 wird wie in der Quelle als auswertbare JSON-Antwort behandelt.
Andere HTTP-Fehler, unbrauchbares JSON und fehlgeschlagene Empfangs- oder
Bestätigungsantworten schreiben `integrations.portal.syncError`; ein späterer
erfolgreicher Lauf leert diesen gemeinsamen Wert. Der Outboundlauf ignoriert
sogar `{success:false}` und leert bei parsebarem JSON den Fehler. Ein Fehler
beim vorherigen Lesen des Snapshots ersetzt den gespeicherten Fehler nicht.
Diese ungewöhnlichen Quellregeln sind ausdrücklich getestet. Python-Transport-
und Datenvalidierungsfehler haben teilweise andere, dokumentierte Meldungstexte.

Die originale Intervallsperre wird vor Ende des asynchronen Empfangs freigegeben.
Überlappende Ticks bleiben möglich; sie sind keine zugesicherte Einzelverarbeitung.
Ein API-Worker, abbrechbare Wartezeiten und Stopps zwischen Provideraufrufen
übertragen den Prozesslebenszyklus auf Python-Threads. Beim Shutdown werden
keine weiteren Läufe gestartet. Bei länger laufendem I/O bleibt die gemeinsame
Engine bis zum Ende **beider** Integrationsworker erhalten. Ein harter
Prozessabbruch garantiert keine abschließende Bestätigung.

## Formularseite und konkrete Quelllücken

`GET /api/portal/status` liefert Aktivierung/Zähler/Fehler; deaktiviert erfolgt
kein SQL-Zugriff. `GET /api/portal/order-forms` liefert die aktiven unverarbeiteten
Formulare und den gespeicherten Fehler für angemeldete Benutzer; deaktiviert
liefert es 404. Die React-Seite `/contracts/orderForms` und die Menüs zeigen
Quelltitel, Zähler bzw. vorrangige Fehlerwarnung und eine schließbare Fehlermeldung.
Die CSV-Berichte aus Schritt 12 bleiben verfügbar.

**Die feste Quelle ist hier unfertig:** `orderForms.ejs` bindet
`public/javascripts/orderForms.js` ein; weder dieses Skript noch eine TypeScript-
Quelle existiert. Auch Verarbeiten/Löschen eines Formulars oder die Anlage eines
Vertrags aus einem Formular sind nicht implementiert. Deshalb bleibt der
Ergebniscontainer wie im tatsächlichen Original leer. Ein Empfang oder eine
Bestätigung setzt `isOrderFormProcessed` ausdrücklich nicht auf 1. Eine solche
fachliche Verarbeitung wurde nicht erfunden und wird nicht als vorhandene
Sunrise-Funktion behauptet. Die API und SQL-Nachweise belegen die tatsächlich
empfangenen Daten unabhängig von dieser Quelllücke.

Zusätzlich stürzt die Originalansicht ab, wenn der interne Fehlerwert noch gar
nicht angelegt wurde. Cemaris behandelt den fehlenden Wert als leer; diese
konkrete defensive Anpassung erhält die Benutzbarkeit vor dem ersten Lauf.

## Nachweise und offene Liveprüfungen

`scripts/reference_dynamics_gp.mjs --check-fixture` und
`scripts/reference_portal.mjs --check-fixture` führen tatsächliche Quellkörper,
gesperrte Pakete, SQL-Erzeugung, Browserhelfer bzw. EJS aus. Die Fixtures nennen
Quellhashes, Paketintegritäten und injizierte Grenzen. Diese Proben starten
nicht die gesamte Sunrise-Anwendung.

Zieltests verwenden echte lokale HTTP-Gegenstellen und ausschließlich zufällige
`cemaris_test_02_<uuid>` auf SQL Server. GP-/Diamond-Tabellen sind synthetische
Testtabellen mit den tatsächlichen Quellspalten/SELECTs und keine vorhandene
Verwaltungs- oder GP-Datenbank. Die Browserprüfung verwendet Produktionsbuild,
echte API, echte SQL-Abfragen und den lokalen Portalserver. Befehle und
erreichte Ergebnisse stehen in [Bericht 14](berichte/14.md).

Echter GP-/Diamond-Mandant, reale Buchungsbelege und ein echter Portalserver
mit Livezugang bleiben ungeprüft. Ebenso bleiben Docker/Nginx-Ausführung,
Linux-ODBC, Ubuntu-Praxistest und vollständiger Sunrise-/Cypress-/Axe-Lauf offen.
Diese Grenzen sind durch lokale Vertragstests nicht erledigt. Keine neue
Laufzeitabhängigkeit, keine EDWALT-Übernahme, kein Push oder Deployment.
