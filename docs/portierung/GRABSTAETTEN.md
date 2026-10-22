# Friedhöfe und Grabstätten – Schritt 05

Referenz: Sunrise `451ce034863b16502484367044f3e9b65370111a`.
Ziel: `backend/cemaris/cemeteries.py`, `burial_sites.py`, `places_audit.py`,
`frontend/src/places.tsx`. Schema unverändert Revision 0001.

## Zuordnung und Bedienung

| Quelle | Cemaris und Nachweis |
| --- | --- |
| `routes/cemeteries.ts`, `handlers/cemeteriesGet/`, `handlers/cemeteriesPost/`, `views/cemeteries/`, `cemetery.{search,edit,view}.ts` | `/cemeteries`, `/new`, `/:id`, `/:id/edit`, vor/zurück; React-Formulare, SQL-API und Browserfälle |
| `database/{add,update,delete,get}Cemetery.ts`, `getCemeteries.ts` | Stammdaten, Portalflag, Elternbezug, aktive direkte Grabzahlen; SQL-Transaktionen |
| `*CemeteryDirectionsOfArrival.ts` | Acht Richtungen mit ausdrücklicher Auswahl und Beschreibung, Ersetzen bei Änderung |
| `getBurialSite{Type,Status}Summary.ts`, `helpers/cache/cemeteries.cache.ts` | Direkte SQL-Lesen und nach Commit aktuelle Übersichten ersetzen den Prozesscache |
| `routes/burialSites.ts`, zugehörige CRUD-/Such-/Kommentarhandler, Ansichten und Browsercode | `/burialSites`, `/new`, `/:id`, `/:id/edit`, vor/zurück; Suche, Bearbeitung, Details, Kommentare und Wiederherstellung |
| `getBurialSites.ts`, `functions.sqlFilters.ts` | Name, Friedhof einschließlich unmittelbarer Kinder, Art, Status, Belegung, Arbeitsauftrag und Koordinatenfilter; Name/ID-Sortierung und Paging |
| `addBurialSite.ts`, `updateBurialSite.ts`, `buildBurialSiteName`, `rebuildBurialSiteNames.ts` | Konfigurierte fünf Namenssegmente und optionaler Friedhofsschlüssel; Neubildung nach Änderung des Friedhofs |
| `*BurialSiteField*.ts`, Felddefinitionen aus 04 | Text-/Datums-/Auswahlwerte, Pflicht/Muster/Längen im Browser, Feldhistorie und Wechsel der Art |
| `*BurialSiteComment*.ts`, `deleteRecord.ts` | Kommentare mit Autor, Datum/Uhrzeit, Anlage/Änderung/Löschung und Audits |
| `deleteBurialSite.ts`, `restoreBurialSite.ts`, `purgeBurialSite.ts` | Quell-Löschschutz, getrenntes Adminrecht für Wiederherstellung, kontrollierte Wiederanlage |
| `getBurialSite.ts`, `getContracts.ts`, `_viewEdit-contracts.ejs` | Bestehende Vertrags-/Beisetzungsbezüge mit Laufzeit, Kapazitäten und Vergangenheitsumschalter; Bearbeitung dieser Beziehungen folgt 07/08 |
| `getBurialSiteDirectionsOfArrival.ts`, `getBurialSiteDeceasedNames.ts` | Wiederverwendbare SQL-Helfer einschließlich Elternfallback/Standardrichtungen und aktueller Belegung; Verbraucher in 06/07/14 bleiben dort offen |
| `commonPost/doGetRecordAuditLog.ts`, `getAuditLog.ts`, Quelldialog | Datensatzbezogene Protokollanzeige und Paging auf beiden Fachseiten; vollständige Auditadministration bleibt 15 |

Karten/SVG-Anzeige und -Auswahl, Koordinatenpicker, GPS, Bereichsanlage sowie
Find-a-Grave-Verknüpfungen gehören weiterhin zu 06. Die bestehenden skalaren
Koordinaten, SVG-IDs, Dateinamen und Find-a-Grave-ID bleiben gespeichert und
editierbar. Vorhandene Grabstättenbilder werden aus dem konfigurierten
Verzeichnis gelesen. Vertragsauswahl-Dialog und Richtungs-API des Vertragsformulars
werden in 07 eingebunden; ihre Zuliefererdaten sind vorhanden. Portalflag und
Beziehungen ersetzen keine Synchronisation (14), Druckkennungen keinen Renderer (11).

## Erhaltene Quellregeln

- Friedhofssuche durchsucht Name, Schlüssel, Beschreibung und beide
  Adresszeilen. Alle kleingeschriebenen, durch Leerzeichen getrennten Teile
  müssen vorkommen; Ort/Provinz sind keine zusätzlichen Suchfelder.
- Eltern-/Kindhierarchie ist in der normalen Oberfläche einstufig. Ein
  Friedhof mit Kindern kann im Formular keinem Elternfriedhof zugeordnet
  werden. Der Server erfindet kein zusätzliches allgemeines Zyklusverbot.
  Nur Datensätze mit sichtbarem Elternbezug NULL liefern `childCemeteries`.
- Friedhofsübersichten und Grabzahlen betreffen unmittelbar zugeordnete,
  aktive Grabstätten. Der Suchfilter umfasst außerdem unmittelbare Kinder,
  aber keine beliebig tiefen Nachkommen. Gelöschte Katalogbezeichnungen
  bleiben für bestehende Beziehungen lesbar.
- Grabstättensuche behält die bereits geprüfte SQLite-Suchsemantik auf SQL
  Server: ASCII-Faltung, Token/Substring bzw. LIKE für Anfang/Ende mit
  Quellwildcards, Unicode und nachgestellten Leerzeichen. Feste Sortierung
  nach Grabstättenname/ID; kein zusätzlicher Benutzersortiervertrag.
- Belegung erfordert einen aktiven Vertrag mit Beginn bis einschließlich
  heute und Ende NULL oder ab heute. Löschschutz prüft ausschließlich Ende
  NULL/ab heute und verhindert deshalb auch bei zukünftigem Beginn das Löschen.
- Friedhofslöschung betrifft seine direkten Grabstätten und deren aktive
  Feldwerte/Kommentare. Verträge werden erhalten. Kindfriedhöfe werden nicht
  rekursiv gelöscht. Quell-`NOT IN` mit einem NULL-Friedhof in einer anderen
  Grabstätte verhindert die physische Bereinigung eines leeren Friedhofs.
- Einzelne Grabstätten werden nur logisch gelöscht; Felder und Kommentare
  bleiben dabei erhalten. Wiederherstellung benötigt `isAdmin`; gelöschte
  Details sind nur für `canUpdateCemeteries` sichtbar. Diese Rechte bleiben
  unabhängig, auch bei einem Benutzer mit ausschließlich Adminrecht.
- Ein aktiver gleicher Name verhindert die Anlage. Ein gelöschter gleicher
  Name wird vor Wiederanlage bereinigt, sofern keine nichtgelöschten
  Vertrags-/Arbeitsauftragsbezüge bestehen. Vor/zurück überspringt gleiche Namen.
- Feldwerte haben eigene Lösch-/Änderungshistorie; leere Werte löschen logisch,
  erneutes Setzen reaktiviert sie. Bereits gespeicherte Felder bleiben auch
  nach Artwechsel oder Löschen ihrer Definition im Detail vorhanden. Definitionen
  der aktuellen Art ergänzen fehlende leere Eingaben. Die Quell-API validiert
  Pflicht/Muster/Auswahl nicht fachlich; diese Regeln liegen im Browser.
- Quellanomalien der Feldformulare bleiben sichtbar: Bei Neuanlage wird ohne
  Auswahlliste ein Textinput auch für Datumsdefinitionen verwendet; bei Änderung
  richtet sich der Eingabetyp nach `fieldType`. Bei einer Auswahl wird das
  Pflichtflag während Änderung wie in der Quelle nicht als HTML-`required` gesetzt.
- Die Vertragsansicht zählt Ende gleich heute als aktiv, blendet die Zeile
  aufgrund des abweichenden `contractIsActive`-Prädikats aber zunächst aus.
  Diese belegte Quellinkonsistenz ist erhalten; fachliche Korrektur folgt separat.
- Kapazitäten verwenden individuellen Wert, dann Artmaximum, dann
  Anwendungseinstellung. Friedhofspostcodes werden in Großbuchstaben gespeichert.
- Kommentare sortieren Datum, Uhrzeit und ID absteigend. Quelle speichert
  Minuten als **HHMM**, ohne Sekunden. Ausgabe folgt dem Quellpaket mit
  `a.m.`/`p.m.`. Dessen lockere Datumsprüfung normalisiert z.B. `2020-02-31`
  zu `2020-03-02`; die normale Datumseingabe des Browsers verhindert diesen Fall.

## Technische Unterschiede

- Interner JSON-Transport statt EJS, gleiche Fachfelder und unabhängige Rollen;
  alle POSTs einschließlich Suche/Protokoll erhalten Synchronizer-CSRF.
- Mutationen sind atomare SQL-Transaktionen. Ein Fehler in einem Zusatzfeld
  oder einer Beziehung rollt die ganze Änderung zurück; die SQLite-Quelle
  kann vor einem Fehler bereits Teiländerungen geschrieben haben.
- SQL Server erzwingt die dokumentierten FKs und festen Zelltypen. Beim
  Löschen eines leeren Elternfriedhofs bleibt ein gelöschter Datensatz als
  Referenz für Kindfriedhöfe erhalten; die Quelle kann den Elternsatz physisch
  entfernen. Die sichtbare Elternauflösung ist identisch (nur aktive Eltern).
- Eine gelöschte Grabstätte mit ausschließlich gelöschten historischen
  Verträgen kann wegen der SQL-FKs nicht physisch entfernt werden. Wiederanlage
  liefert einen konkreten Fehler und erhält die Historie; die Quelle kann bei
  abgeschalteter SQLite-FK-Prüfung verwaiste Verträge erzeugen. Keine Daten
  werden stillschweigend abgetrennt.
- Namen-/Schlüsselgleichheit mit nachgestellten Leerzeichen und numerische
  SQL-Typgrenzen bleiben die in DATENSEMANTIK.md ausgewiesenen Unterschiede.
- Namensneubildung nach Friedhofsänderung erfolgt innerhalb derselben
  Transaktion, statt nach Beendigung der HTTP-Antwort. Direkte SQL-Lesen
  ersetzen Prozess-/Nachbar-Caches und benötigen keine Cacheinvalidierung.
- Die Originalpaketprobe hat HHMM als gemeinsamen Speichervertrag bestätigt.
  Auch die vorhandenen Benutzer-/Katalog-Auditwriter und synthetischen
  Zeitfixtures wurden entsprechend korrigiert. Es werden keine bestehenden
  Anwendungsdaten automatisch umgeschrieben; früher erzeugte lokale Testdaten
  sind kein Migrationsauftrag.

## Konfiguration und API

`BurialSiteOptions` liest wie die bisherigen Optionen `CEMARIS_*` aus Umgebung
vor `.env`. Die vorhandene lokale `.env` wird nicht verändert.

| Variable | Standard und Quellbezug |
| --- | --- |
| `CEMARIS_BURIAL_SITE_NAME_SEGMENTS` | JSON: `includeCemeteryKey=false`, `separator="-"`, Segment 1 verfügbar/pflichtig, Label `Plot Number`, Länge 1–20; optionale Segmente 2–5, Prefix/Suffix wie Quelle |
| `CEMARIS_LATITUDE_MIN/MAX` | -90 / 90; Formulargrenzen |
| `CEMARIS_LONGITUDE_MIN/MAX` | -180 / 180; Formulargrenzen |
| `CEMARIS_ADDRESS_LABELS` | `ca`; `us` wählt State/ZIP-Beschriftung |
| `CEMARIS_CONTRACT_END_DATE_IS_AVAILABLE` | true; Enddatumsspalte in der verknüpften Vertragsübersicht |
| `CEMARIS_CUSTOMIZATIONS_PATH` | `.`; Grabstättenbilder in `public-internal/images/burialSites/`, `.jpg/.jpeg/.png`; kein implizites Kopieren oder Download |
| `CEMARIS_AUDIT_LOG_ENABLED` | bestehende Option; Auditwrites und geschützte datensatzbezogene Anzeige |
| `CEMARIS_PORTAL_ENABLED` | bestehende Option; Portalflag im Friedhofsformular, Dienstaufrufe erst 14 |

Die Containerumgebung reicht diese Optionen weiter. Eigene Bildverzeichnisse
benötigen einen beim Betrieb ausdrücklich bereitgestellten Mount; neue Assets
sind nicht Bestandteil dieses Schritts. Docker/Ubuntu bleiben ungeprüft.

Ergänzung nach Schritt 06: SVG-Auswahl, Bildauslieferung, Kartenansichten,
GPS und Bereichsanlage sind in [KARTEN.md](KARTEN.md) beschrieben. Compose
besitzt jetzt einen schreibgeschützten Customizations-Mount. Die genannten
Abgrenzungen zu 06 beschreiben den Abschlussstand von Schritt 05 und sind
durch Bericht 06 für diese Bereiche fortgeschrieben. Der zuvor vorgemerkte
„Kartenstatusdialog“ gehört laut tatsächlichem Quellverbraucher zu
Arbeitsaufträgen in Schritt 10.

API unter `/api/cemeteries` bzw. `/api/burialSites`: GET `options`, GET `/:id`,
GET `/:id/next|previous`, POSTs mit den Quellnamen `doCreate*`, `doUpdate*`,
`doDelete*`; außerdem Friedhofsliste per GET auf dem Basispfad,
`doSearchBurialSites`, `doRestoreBurialSite`, drei Kommentaraktionen sowie
`doGetRecordAuditLog`. Feldauswahl aus Schritt 04 wird wiederverwendet.
Die normalen Fachseiten geben fehlende IDs als Quell-Suchfehler aus.

## Reproduzierbare Prüfung

Alle Zielpersistenzfälle verwenden zufällige `cemaris_test_02_<uuid>`-Datenbanken,
nie eine vorhandene Datenbank. Der Browserrunner erzeugt und entfernt dieselbe
Art Datenbank und startet nur eigene Serverprozesse. Befehle in TECHNIK.md;
tatsächliche Ergebnisse und Grenzen in [Bericht 05](berichte/05.md).

Die Originalprobe `scripts/reference_places.mjs` führt unveränderte Originalmodule
isoliert auf ihrem eigenen SQLite-Schema aus. Sie belegt vier Defaults,
zwölf Namenskonfigurationen, 30 Suchfälle, Hierarchie/Übersicht/Navigation und
fünf Lösch-/Wiederherstellungsgrenzen. SQLite dient nur der Quellbeobachtung.
Quellhashes und erwartete Werte stehen in `places-reference.json` und werden
von Zieltests auf SQL Server benutzt. Die Datums-/Zeitprobe verwendet das
Originalpaket aus dem festen Lockfile mit Integritätsprüfung.
