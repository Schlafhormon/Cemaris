# Fachliche Kataloge und Zusatzfelder

Schritt 04, 20.10.2026. Referenz unverändert am Commit
`451ce034863b16502484367044f3e9b65370111a`.

## Quellumfang und Ziel

Die vier Admin-Seiten `burialSiteTypes`, `contractTypes`, `tables` und `fees`
werden als React-Seiten mit derselben fachlichen Gliederung übertragen.
Anmeldung, unabhängige Administratorrolle, Sprachkataloge und CSRF stammen aus
Schritt 03. Die Daten bleiben im SQL-Server-Schema der Revision 0001.

| Quelle in Sunrise | Funktion in Cemaris |
| --- | --- |
| `handlers/adminGet/burialSiteTypes.ts`, `database/*BurialSiteType*.ts`, zugehörige Ansicht, Dialoge und Browsercode | Grabstättenarten mit Kapazitäten und konfigurierbaren Zusatzfeldern |
| `handlers/adminGet/contractTypes.ts`, `database/*ContractType*.ts`, zugehörige Ansicht, Dialoge und Browsercode | Vertragsarten mit Vorsorgekennzeichen, gemeinsamen/artbezogenen Feldern und Druckzuordnungen |
| `handlers/adminGet/tables.ts`, `_tables-*.ejs`, jeweiliger Admin-Browsercode | Grabstättenstatus, Beisetzungsarten, Behälterarten, Tiefen, Dienstleistungen, Arbeitsauftragsarten/-status und Meilensteinarten |
| `handlers/adminGet/fees.ts`, `database/*Fee*.ts`, `fees.admin.ts`, Gebühren-Dialoge | Kategorien, Gruppierung, Gebühren, Typfilter, Konto, Betrag/Funktion, Steuer, Menge und Pflichtgebühr |
| `database/{add,update,delete,move}Record.ts`, `updateRecordOrderNumber.ts` | Gemeinsame Anlage, Änderung, Soft-Delete und Reihenfolge einschließlich Verschieben an Anfang/Ende |
| `helpers/cache/*.cache.ts` und `helpers/cache.helpers.ts` | Quellinitialwerte und Leseseiteneffekte; unmittelbare SQL-Lesen ersetzen den Prozesscache |

## Erhaltene Regeln und Quellanomalien

Kataloglisten werden nach den jeweiligen Quellspalten sortiert und beim Lesen
auf fortlaufende `orderNumber`-Werte gebracht. Diese Normalisierung verändert
weder fachliche Änderungszeit noch Benutzer und erzeugt kein Auditereignis.
Feldreihenfolgen gelten je Elternart, gemeinsame Vertragsfelder bilden eine
eigene Gruppe. Gebühren gelten je Kategorie, Druckzuordnungen je Vertragsart.
Behälterarten werden zusätzlich nach `isCremationType` gruppiert.

Die Quelle besitzt keinen allgemeinen serverseitigen Löschschutz gegen
fachliche Verwendungen. Soft-Delete erhält Datensätze und Fremdschlüssel;
vorhandene Feldwerte und Gebühren auf Verträgen werden nicht entfernt.
Das Löschen einer Grabstättenart markiert ihre Zusatzfelder mit als gelöscht;
bei Vertragsarten betrifft dies Felder und Druckzuordnungen. Das Löschen einer
Gebührenkategorie lässt ihre Gebühren aktiv, macht sie in der aktiven
Kategorienliste aber unsichtbar. Die React-Oberfläche bietet wie die Quelle
das Löschen einer Kategorie nur ohne aktive Gebühren an. Bestätigungen und
Feldwertwarnungen bleiben erhalten. Ein zusätzlicher fachlicher Schutz wäre
eine spätere Änderung des Sollverhaltens.

Zusatzfelder behalten Bezeichnung, `text`/`date`/`select`, Auswahlwerte,
Pflichtflag, Muster sowie Längengrenzen. Die Eingabefreigaben folgen der Quelle:
Datum deaktiviert Auswahl/Muster/Längen; Auswahl aktiviert nur Auswahlwerte;
Text aktiviert Muster/Längen. Deaktivierte Formwerte werden grundsätzlich nicht mitgesendet.
Die Verwendung der Felddefinitionen auf Fachformularen folgt in 05 und 07.

Die unterschiedlichen Quellflagregeln bleiben erhalten: `isPreneed` wird über
die Anwesenheit des Formschlüssels gesetzt (auch `"0"` oder leer bedeutet wahr).
Bei Gebühren bedeutet ein nichtleerer Mengen-/Pflichtstring wahr, also auch
`"0"`; React sendet für falsch den Leerstring. Fehlendes `isRequired` bei der
Zusatzfeldanlage ergibt in der Quelle wahr. Diese Anomalien sind mit
ausgeführten Originalfällen belegt und werden nicht vereinheitlicht.

Eine belegte Ausnahme ist `fieldValues`: Die Originalform lässt den Wert bei
Text/Datum weg, während `update*TypeField` ihn ohne Default an SQLite bindet.
Das tatsächlich ausgeführte Original wirft `ERR_INVALID_ARG_TYPE`.
Die gesperrte `@cityssm/bulma-webapp-js`-Version 2.0.0-beta.2 bestätigt dies mit
ihrem `FormData`-Serializer. React sendet hier den vorhandenen String explizit,
damit Felddefinitionen vollständig gespeichert werden. Das ist eine bewusste
technische Anpassung; die übrigen deaktivierten Werte folgen den Quelldefaults.

Druckzuordnungen enthalten konfigurierte Druckkennungen oder `*`. Nicht mehr
konfigurierte Zuordnungen bleiben gespeichert, sind in der aktiven Liste aber
ausgeblendet. Eine erneute Anlage derselben Kombination stellt den vorhandenen
Datensatz wieder her. Die Erstellung und Ausgabe der Dokumente gehört zu 11.

Gebühren behalten die Quellunterscheidung zwischen offenem Betrag (`NULL`),
festem Betrag und Funktionskennung sowie zwischen Prozent- und Feststeuer.
Mengenbezeichnung wird nur bei aktivierter Menge eingegeben. Berechnung und
Übernahme auf konkrete Verträge folgen in 09; hier werden Katalogwerte
verwaltet und dauerhaft gespeichert.

Der Quell-Gebührenfunktionsselektor besitzt ausschließlich die leere Option
und lädt eine gespeicherte Funktionskennung beim Bearbeiten nicht nach.
Cemaris ergänzt für einen bereits vorhandenen Wert eine Bestandsoption,
damit eine Änderung der Beschreibung diese Kennung nicht unbeabsichtigt löscht.
Es gibt keine erfundene Liste zusätzlicher Funktionen oder neue Berechnung.

Die Quelle scheitert bei bestimmten Verschiebeaktionen gemeinsamer
Vertragsfelder an ihrer NULL-Elternkennung. Cemaris weist diese Aktion
ausdrücklich zurück; es wird kein neuer fachlicher Sortieralgorithmus
eingeführt. Der konkrete HTTP-Vertrag und die ausgeführten Vergleichsfälle
stehen im Abschlussbericht.

## API und Konfiguration

`GET /api/admin/catalogs` liefert alle aktiven Kataloge, untergeordnete Felder,
Druckkennungen und öffentliche Formvorgaben. `POST
/api/admin/catalogs/{resource}/{action}` nutzt die Pluralnamen der Quellobjekte
(beispielsweise `burialSiteTypes`, `contractTypeFields`, `fees`). Aktionen sind
`add`, `update`, `delete`, `moveUp`, `moveDown`; Gebühren unterstützen zusätzlich
`updateAmount`. Druckzuordnungen besitzen keine Updateaktion. IDs und Formwerte
stehen wie in der Quelle im JSON-Body; `moveToEnd: "1"` entspricht Shift+Pfeil.
Die erfolgreiche Antwort enthält `success`, den neuen Katalogzustand und bei
Anlage die neue ID. Fachliche Ablehnungen und technische Eingabefehler bleiben
in der React-Fehleranzeige sichtbar. Alle Admin-Routen verlangen Administrator
und für POST einen gültigen `X-CSRF-Token`.

`POST /api/burialSites/typeFields` und `/api/contracts/typeFields` liefern die
Felddefinitionen für die ausgewählte Art; ursprüngliche `doGet*TypeFields`-
Aktionsnamen sind als API-Aliasse vorhanden. Es gelten die getrennten
Fachänderungsrechte für Friedhöfe bzw. Verträge. Vertragsfelder enthalten
zuerst gemeinsame und dann artspezifische Felder. Eine unbekannte Grabstättenart
liefert eine leere Liste; eine unbekannte Vertragsart führt entsprechend dem
Quellfehler zu einer expliziten 409-Antwort `source_missing_contract_type`.

Die Konfiguration ist über `CatalogOptions` in `create_app(...,
catalog_options=...)` injizierbar oder aus `.env`/Umgebung geladen:

| Variable | Quelloption / Vorgabe |
| --- | --- |
| `CEMARIS_CONTRACT_PRINTS` | `settings.contracts.prints`, JSON-Liste, Default `["screen/contract"]` |
| `CEMARIS_CUSTOM_PDF_PRINT_TITLES` | Titel aus individuellen PDF-Druckkonfigurationen, JSON-Objekt ohne `pdf/`-Präfix, Default `{}`; Renderer folgt 11 |
| `CEMARIS_PORTAL_ENABLED` | Sichtbarkeit von `isAvailableOnPortal`, Default `false`; Synchronisation seit 14, siehe DYNAMICS_PORTAL.md |
| `CEMARIS_FEE_TAX_PERCENTAGE_DEFAULT` | `settings.fees.taxPercentageDefault`, Default `0` |
| `CEMARIS_AUDIT_LOG_ENABLED` | Bereits vorhandener Audit-Schalter; Quell-Audit je Katalogoperation |

Die Kapazitätsvorgaben werden aus den bereits übertragenen
Anwendungseinstellungen `burialSiteTypes.bodyCapacityMaxDefault` und
`burialSiteTypes.crematedCapacityMaxDefault` gelesen. Audit zeichnet fachliche
Änderungen gemäß Quelle auf; Felder, Druckzuordnungen und Gebührenkategorien
haben keine eigenen Quell-Audits, Arbeitsauftragsstatus nur Anlage-Audits.
Die vier generischen Kataloge besitzen beim Anlage-Audit die Quell-Arrayform.

`python backend/manage.py initialize-catalogs` führt die ausdrückliche
`initializeData`-Entsprechung aus: vorhandene Kataloge vor der Leerprüfung lesen
und normalisieren (Gebührenkategorien ausgenommen), leere Kataloge mit den
46 Originalwerten befüllen, `databaseInit` und optionale Audits nutzen.
`seed-catalogs` bleibt der bisherige reine Einfügebefehl. Normale GETs und CRUD
füllen nach dem Löschen des letzten Eintrags keine Katalogwerte neu auf.

## Technische Grenzen und nachfolgende Verbraucher

React und FastAPI verwenden JSON statt EJS und der ursprünglichen Handler-URLs.
Es gibt keinen langlebigen Katalogcache: Nach einem Commit sieht ein neuer
Abruf die aktuellen SQL-Werte. Quellseitige Worker-Cachenachrichten werden
dadurch ersetzt. Mehrprozessbetrieb und Startinitialisierung werden in 15/16
abschließend geprüft.

SQL Server besitzt feste Zelltypen und Längengrenzen. Numerische Katalogwerte
müssen endlich, Ganzzahlfelder ohne Bruch und BIT-Werte 0/1 sein. Nicht
darstellbare Zahlen, zu lange Formstrings und ungültige Referenzen liefern eine
kontrollierte Eingabeablehnung. SQLite kann teilweise Text in Zahlenspalten
speichern; diese technische Grenze wird nicht als Gleichheit ausgegeben.
Leere Kapazitäten, Beträge, Steuerwerte und optionale Typ-IDs behalten ihre
Quell-NULL-Regeln; leere erforderliche Zahlenwerte werden 0, außer generische
leere `orderNumber`-Formwerte mit dem Quellwert -1.

Die Portal-Synchronisation nach Katalogänderungen gehört zur Integration in
14. Konkrete Druckrenderer und individuelle Vorlagen folgen in 11;
Fachformulare, Kapazitätsauswertungen und Gebührenberechnung folgen ihren
Schritten 05–12. Diese Verbraucher gelten durch die Katalogverwaltung noch
nicht als übertragen. Docker-/Ubuntu-Nachweise bleiben wie bisher offen.
