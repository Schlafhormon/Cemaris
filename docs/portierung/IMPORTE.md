# Vorhandene CSV-Importwerkzeuge

Schritt 12 überträgt ausschließlich die Werkzeuge am festen Sunrise-Commit
`451ce034863b16502484367044f3e9b65370111a`. Zielmodule sind
`backend/cemaris/import_tools/legacy.py`, `sql.py` und `__main__.py`.
Es handelt sich um das historische UNIX-CSV-Layout der Referenz; eine
EDWALT-Übernahme ist damit weder implementiert noch ausgeführt.

## Kommandozeile

Aufruf aus `backend` nach Installation der fixierten Python-Abhängigkeiten:

```text
python -m cemaris.import_tools --help
python -m cemaris.import_tools findagrave 123 ./graveMemorials.csv
python -m cemaris.import_tools legacy-csv ./CMMASTER.csv ./CMPRPAID.csv ./CMWKORDR.csv
```

Die separate Variable `CEMARIS_IMPORT_DATABASE_URL` oder `--database-url`
vor dem Unterbefehl bestimmt das Ziel. Es gibt keinen Rückfall auf die
Anwendungsdatenbank. Die Verbindung muss Microsoft SQL Server verwenden und
der tatsächliche Datenbankname muss `cemaris_test_02_<32 hex UUID-Zeichen>`
entsprechen. Schema/Migration werden vorher regulär eingerichtet. Ein Aufruf
mit `master`, einem Anwendungsdatenbanknamen oder einem ähnlich benannten,
aber nicht passenden Ziel wird vor den Importoperationen abgewiesen.

`--showDebug` schaltet Python-Debuglogging ein. `legacy-csv` unterstützt
`--mapping pfad.json`, `--burial-site-naming pfad.json`, `--fee-category-id 123`
und `--audit`. Die importierenden Aufrufe verwenden den Quellbenutzer
`import.unix`; die Python-CLI hat keinen HTTP-Sitzungs-/CSRF-Kontext.
Die regulären Anwendungsrechte und API-Endpunkte werden dadurch nicht ersetzt.

Die Python-Schnittstelle verwendet bewusst `argparse`, den Unterbefehl
`findagrave` sowie die explizite separate SQL-URL. Die Quelle besitzt einen
eigenen npm-Befehl, zwei Positionsargumente und setzt intern die SQLite-
Testdatenbankoption. Globale Cemaris-Optionen wie `--showDebug` und
`--database-url` stehen vor dem Unterbefehl; der Originalparser `meow` akzeptiert
`--showDebug` auch hinter den Positionsargumenten. Default `false`, explizites
`true`, beide Positionswerte, `--help` mit Exit 0 und falsche Argumentanzahl
mit Exit 2 sind anhand des tatsächlichen gesperrten Quellparsers nachgewiesen.
Hilfetext/Programmnamen nennen im Ziel Cemaris und die Python-Aufrufsyntax.

Das Mapping enthält `city`, `province`, `cemeteries` (Objekt mit externen
Friedhofsschlüsseln und Cemaris-Friedhofsformularen) sowie `funeralHomes`
(Liste der Bestatterformulare einschließlich `funeralHomeKey` und booleschem
`isAvailableOnPortal`). Ohne Mapping sind alle 13 regionalen Friedhofsformulare,
zehn Bestatter und die beiden Einstellungswerte der Originalquelle verfügbar.
Sie liegen nachvollziehbar unter `import_tools/legacy-data.json`. Die Werte
werden nicht beim Anwendungsstart eingespielt. Das Original wird damit nicht
stillschweigend auf eine eigene Kommune umgedeutet; die SQL-Prüfungen verwenden
ein ausdrücklich synthetisches Mapping.

Die Namenskonfiguration entspricht `burialSiteNameSegments` der bestehenden
Anwendung: `includeCemeteryKey`, `separator` und `segments` mit den Schlüsseln
`1` bis `5`. Ohne Datei gilt die aktuelle `BurialSiteOptions`-Konfiguration,
wie die Quelle die vorhandene Anwendungskonfiguration verwendet. Der externe
Friedhofsschlüssel und die vier CSV-Segmente werden an denselben vorhandenen
Namenshelfer übergeben. Nur der vollständige Name dient der historischen
Grabstättensuche, einschließlich gelöschter Grabstätten.

## Find-a-Grave-Befehl: konkrete Quellgrenze

`cli/findAGraveMemorialExtractorImport/{cli,import}.{ts,js}` sowie dessen README
sind vollständig erfasst. Der ursprüngliche CLI setzt `TEST_DATABASES=true`,
prüft Testdatenbank und Friedhof und beendet sich anschließend. `pathToCsvFile`
wird nie geöffnet; es gibt keine CSV-Auswertung, Namenssuche oder Aktualisierung
von Verträgen/Find-a-Grave-IDs. Die README nennt den Stand „Work in progress“.

Cemaris erhält dieses tatsächlich implementierte Verhalten. Erfolg liefert
`csvRead:false`, `recordsChanged:0` und `status:"source-tool-unfinished"`.
Auch ein nicht vorhandener Dateipfad ist wie in der Quelle zulässig, sofern
Testdatenbank und Friedhof stimmen. Das ist ein explizit ausgewiesenes
unfertiges Quellwerkzeug und kein Nachweis einer funktionierenden
Find-a-Grave-Datenübernahme.

## Legacy-Ablauf und Zuordnung

| Quellbereich unter `temp/legacyImportFromCsv/` | Übertragene Wirkung |
| --- | --- |
| `index.ts/js` | Fach-/Konfigurationstabellen zurücksetzen, Grundkataloge initialisieren, Druckzuordnungen/Bestatter initialisieren, `defaults.city`/`defaults.province` setzen, Master → Prepaid → Arbeitsaufträge verarbeiten |
| `recordTypes.ts/js` | Alle 46 Master-, 41 Prepaid- und 47 Arbeitsauftragsspalten werden über das generierte Schema als String-CSV gelesen; die konkret von der Quelle verbrauchten Spalten werden verarbeitet |
| `utilities.ts/js` | `import.unix`, links auffüllen/abschneiden, konkrete Jahreskorrekturen `3014→2014` und `2202→2022`, `UNIX-` vor getrimmter Auftragsnummer |
| `data.ids.ts/js` | Namenbasierte Zuordnung vorhandener Status-/Vertrags-/Dienstleistungs-/Arbeitsauftrags-/Meilensteinkataloge; fehlende Acknowledged-/Death-Meilensteintypen bleiben optional |
| `data.burialSiteTypes.ts/js` | `GC/HC→Columbarium`, `MA→Mausoleum`, `MN/NW→Niche Wall`, `UG→Urn Garden`, leer/`00→Crematorium`, übrige→In-Ground Grave |
| `data.cemeteries.ts/js` | Alle regionalen Formulare/Anfahrtsrichtungen, Wiederverwendung nach Schlüssel, Rückfallformular für unbekannte Schlüssel; leerer Schlüssel, `00`, ein einzelner Backtick, `N` und `R` erzeugen keine Grabstätte |
| `data.funeralHomes.ts/js` | Zehn Originalformulare; unbekannte Schlüssel erzeugen einen schlichten Bestatter, der im Importlauf wiederverwendet wird |
| `data.committalTypes.ts/js`, `data.intermentContainerTypes.ts/js`, `data.intermentDepths.ts/js` | Schlüssel finden, auch historische Katalogeinträge; unbekannte Schlüssel mit identischem Namen/Schlüssel ergänzen |
| `data.deathAgePeriods.ts/js` | Groß-/Kleinschreibung ignorieren bei `dys/mts/yrs→Days/Months/Years`; unbekannten Text erhalten |
| `data.contractPrints.ts/js` | Preneed/At Need: `pdf/ssm.contract`; At Need/Permit Only: `pdf/ssm.contract.burialPermit` |
| `data.fees.ts/js` | Gebühren nach `CMPP_FEE_*`-Beschreibung wiederverwenden/ergänzen, Originalname ab Zeichenposition 9; konkrete FK-Anpassung unten |
| `import.master.ts/js` | Grabstätten, Preneed/At Need, Personen/Adressen/Bestatter, Datumsrückfälle, Selbstbeziehung, Dienstleistungen, Kommentare, verknüpfte Verträge und Reserved-/Occupied-Status |
| `import.prepaid.ts/js` | Leeren Namen überspringen, `.m→HC`, Reserved-Status, passenden Preneed nach Grab/Datum/Namen wiederverwenden, acht Gebühren/Steuern, Dienstleistungen, Zahlung und Kommentare |
| `import.workOrder.ts/js` | Sechsstellige Nummer, vorhandenen Auftrag wieder öffnen, Grabbezug deduplizieren, eigenen At-Need-Vertrag je Zeile, Bestatter/Person/Beisetzung/Dienstleistung, Vertragsbezug, fünf optionale Meilensteine und Abschlussdatum |

Die genauen Spaltennamen stehen in `legacy-data.json` unter `fields`; sie
stammen vollständig aus den Originalinterfaces. Schon die Quelle verwendet
z. B. Master-Systemnummern, Namenssequenzen, Bewohnerklasse/letzte Änderung,
Prepaid-System-/Namenssequenzen oder Arbeitsauftragskosten und separate
Completion-Spalten nicht. Diese werden nicht als zusätzlich migriert behauptet.
Die WorkOrder-Abschlusslogik verwendet Bestätigung und die Meilensteindaten.

Das Quellenreset umfasst genau diese 32 Tabellen:

```text
WorkOrderMilestones WorkOrderComments WorkOrderBurialSites WorkOrderContracts
WorkOrders ContractAttachments ContractMetadata ContractTransactions ContractFees
ContractFields ContractComments ContractInterments ContractServiceTypes
RelatedContracts Contracts FuneralHomes BurialSiteFields BurialSiteComments
BurialSites AuditLog CemeteryDirectionsOfArrival Cemeteries BurialSiteStatuses
CommittalTypes ServiceTypes ContractTypeFields ContractTypePrints ContractTypes
IntermentContainerTypes IntermentDepths WorkOrderMilestoneTypes WorkOrderTypes
```

BurialSiteTypes/-TypeFields, FeeCategories/Fees, WorkOrderStatuses,
Benutzer-/Einstellungstabellen und Portalbestände gehören nicht zum Quellreset.
Importe speichern keine fremden EDWALT-Daten. Die ausgeführten Nachweise
verwenden ausschließlich generierte Beispieldateien und entbehrliche SQL-DBs.

## Erhaltene Quellbesonderheiten

- Nicht alle Datumswerte werden als Kalenderdatum validiert. Formatierung und
  die bestehenden gemeinsamen Datumshelfer behalten ihre konkret geprüften
  Regeln. Fehlendes Master-Datum fällt auf andere Ereignisdaten und zuletzt
  `0001-01-01` zurück; Prepaid besitzt diesen Rückfall nicht.
- Ein Master-Datensatz kann zwei miteinander verknüpfte Verträge mit derselben
  importierten Nummer und eigenständigen Personen/Kommentaren erzeugen.
  Cremation ohne Grab erhält beim Master einen Endtag gleich Starttag.
- Prepaid prüft Gebührenwerte als Text auf exakt `0.0`. Andere Nullschreibweisen
  wie `0` oder leere Werte sind deshalb kein identischer Kontrollfluss. Der
  Disinterment-Ausreißer `20202.02` wird einzeln für Gebühr und Steuer aus der
  Zahlungssumme ausgeschlossen. Nicht eingetragene Einzelgebühren und die
  Gesamtsumme können dadurch auseinanderfallen.
- Arbeitsaufträge werden pro Nummer wiederverwendet, Verträge pro Zeile neu
  erzeugt; wiederholter Import ohne Reset ist keine allgemeine Deduplizierung.
  Stunden `0..6` erhalten zwölf Stunden zusätzlich. Datum gleich heute bleibt
  unvollständig. Bestätigung und Ereignisdaten bestimmen den Abschluss, auch
  wenn einzelne optionale Meilensteintypen fehlen. Cremation verwendet den bis
  dahin höchsten Ereignistag; der spätere Interment-Schritt kann ihn überholen.
- Die vier `pdf/ssm.*`-Zuordnungen sind regionale Vorlagenkennungen aus der
  Quelle. Die eigentlichen Templates sind keine Dateien dieses Importordners.
  Wie bei sonstigen individuellen Drucken aus Schritt 11 ist eine passende
  Customizations-Konfiguration erforderlich. Die Kennungen werden erhalten,
  aber keine erfundene Vorlage als Originaldruck ausgegeben.

## Technisch notwendige Unterschiede

Der CLI läuft vollständig in Python und verwendet die schon übertragenen
Fachhelfer. SQLite-PRAGMAs, `VACUUM`, `optimize` und `sqlite_sequence` entfallen.
SQL Server löscht innerhalb einer Transaktion in FK-Reihenfolge und setzt die
IDENTITY-Zähler der betroffenen Tabellen zurück. Selbstbezüge der Friedhöfe
werden vorher aufgelöst. Referenzen aus nicht zurückgesetzten Tabellen werden
vor dem Löschen kontrolliert abgewiesen, sofern deren FK tatsächlich belegt
ist; Portal- oder Gebührenbezüge werden nicht still entfernt. Der CLI rollt
bei einem Fehler den ganzen Lauf zurück. Direkte Python-Aufrufer verwalten
die Connection-Transaktion selbst.

Der originale Gebührenhelfer beginnt mit `feeCategoryId=0`, liest wegen
`feeCache.keys.length===0` wiederholt vorhandene Importgebühren und erzeugt
ohne Vorbestand ein Anlageformular mit Kategorie 0. Ohne passende Kategorie
scheitert der tatsächliche Original-INSERT mit den aktuellen `node:sqlite`-
FK-Defaults an `FOREIGN KEY constraint failed`; bei abgeschalteter FK-Prüfung
wäre ein verwaister FK möglich. Cemaris verwendet die vorhandene Kategorie einer
passenden Importgebühr oder `--fee-category-id`; ohne beides wird die reale
Kategorie `Legacy CSV Import` angelegt. Beschreibung, Gebührenname,
Einzelbeträge/Steuern und Zahlungssumme bleiben erhalten.

Doppelte externe Katalogschlüssel werden in derselben Katalogreihenfolge wie
die Originalreader aufgelöst: Reihenfolge, Name und gegebenenfalls ID; bei
Behältnissen steht das Kremationsflag davor. Schlüssel werden strikt und damit
einschließlich Groß-/Kleinschreibung und nachgestellter Leerzeichen verglichen.
Die namenbasierten Katalogsuchen sind wie die Originalcaches unabhängig von
Groß-/Kleinschreibung und wählen zuerst nach Katalogreihenfolge/Name.
Committal-Lesen normalisiert wie die Quelle auch beim Einschließen gelöschter
Einträge die aktiven Reihenfolgen. Bei mehrfachen Gebührenbeschreibungen
überschreibt der Quellcache frühere Treffer: Cemaris übernimmt den letzten
Treffer. Die ursprüngliche Gebühren-/Friedhofsabfrage besitzt kein explizites
`ORDER BY`; Cemaris macht hierfür die aufsteigende ID-Reihenfolge explizit.
Die Original-Funktion garantiert für vollständig gleiche Sortierschlüssel
oder ungeordnetes SQL keine weitergehende stabile Auswahl.

UTF-8 einschließlich BOM, CSV-Quotes/Kommas, eingebettete Zeilenumbrüche und
leere Zeilen sind unterstützt. Strukturell fehlerhafte CSVs werden vor dem
Reset abgewiesen; PapaParse protokolliert solche Fehler in der Quelle zunächst
und setzt die Verarbeitung fort. Der ursprüngliche WorkOrder-Importer fängt
Laufzeitfehler ab und beendet den verbleibenden Import ohne erneutes Werfen;
Cemaris meldet den Fehler und lässt den CLI-Lauf zurückrollen. SQL-Typ-/FK-
Grenzen aus DATENSEMANTIK.md gelten weiter.

## Nachweis

`node scripts/reference_imports.mjs --check-fixture` prüft alle 37 Artefakte
aus `cli/` und `temp/legacyImportFromCsv/` sowie das Original-Lockfile und acht
zusätzliche Datenbank-/Cache-Quellen (46 Hashes)
und führt die unveränderten
JavaScript-Funktionskörper der drei Originalprozessoren aus. Es werden
25 synthetische Szenarien mit insgesamt 230 CRUD-Aufrufen, die Original-
Formatierungs-/Typhelfer und drei Find-a-Grave-Guard-Fälle aufgezeichnet.
Die regionalen Konstanten werden direkt aus den Originalmodulen extrahiert
und mit dem eingebetteten Zielmapping verglichen. Die Referenz bleibt unverändert.

Die tatsächlichen Original-Katalogreader und Import-Schlüsselhelfer laufen
zusätzlich auf dem Original-SQLite-Schema mit doppelten Schlüsseln,
unterschiedlichen Reihenfolgen, Kremationsflags, Groß-/Kleinschreibung und
nachgestellten Leerzeichen. Der Original-Vertragsartcache und Gebührenhelfer
belegen Namenssortierung und letztes Überschreiben; der wirkliche Original-
Gebühren-INSERT belegt den fehlenden Kategorie-FK. SQLite dient hier
ausschließlich als Quellorakel. Die vorhandene Live-SQL-Prüfung übernimmt
dieselben Fälle ohne zusätzliche Testfallzählung.

Zusätzlich wird `meow` 14.1.0 aus der exakten `package-lock.json`-Archivadresse
geladen, vor dem Entpacken anhand der SHA-512-Integrität geprüft und unter
`.local/reference-imports` ausgeführt. Das veröffentlichte Paket bündelt seine
Implementierung ohne zusätzliche installierte Laufzeitabhängigkeiten. Die
originale MIT-Lizenz und `build/licenses.md` für die gebündelten Komponenten
bleiben im entpackten Paket erhalten. Sieben synthetische CLI-Fälle führen
die Original-`meow(...)`-Konfiguration und Argument-/Help-/Debug-Zweige aus;
nur Debuglogger und die nachfolgende Datenbankausführung sind abgegrenzt.
Die Python-Tests prüfen dazu den tatsächlichen `argparse`-Einstieg mit einer
injizierten Datenbankgrenze. Cemaris erhält keine zusätzliche Laufzeitabhängigkeit.

Die injizierten Grenzen sind geparste CSV-Zeilen, SQL-/CRUD-Aufrufe,
Namenskonfiguration, Katalog-IDs und Datum `20.10.2026`. Der Nachweis behauptet
keinen vollständigen Originalanwendungsstart. Python-Tests vergleichen alle
aufgezeichneten Formulare und deren Reihenfolge; getrennte Tests prüfen die
echte SQL-Persistenz einschließlich aller drei Prozessoren, regionaler
Initialisierung, Gebühren/Steuern/Zahlungen, Wiederöffnung, Meilensteinen,
Abschluss, Reset/Wiederholung, Audit und der tatsächlichen Find-a-Grave-No-op-
Wirkung. Vollständige Prüfergebnisse stehen im Abschlussbericht 12.

```text
python -m pytest backend/tests/test_import_reference.py backend/tests/test_import_sql.py -q
node scripts/reference_imports.mjs --check-fixture
```

Kein Live-Lauf mit historischen Verwaltungsdaten wurde durchgeführt. Eine
allgemeine, produktive Datenmigration einschließlich EDWALT bleibt ein
separater späterer Auftrag.
