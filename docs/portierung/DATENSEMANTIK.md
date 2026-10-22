# SQL-Server-Zuordnung und gemeinsame Datensemantik

Stand: Schritt 02, 19.10.2026. Quelle ist ausschließlich Sunrise CMS
`451ce034863b16502484367044f3e9b65370111a`. Der vollständige Tabellenbezug
steht unter den 41 `DB-*`-Kennungen in [UMFANG.md](UMFANG.md).
Diese Grundlage überträgt noch keine fachlichen CRUD-/API-/React-Abläufe.

## Schema

`backend/cemaris/db/schema.py` bildet alle 41 Tabellen mit 482 Spalten,
24 Identity-Schlüsseln, 42 Fremdschlüsseln, 27 CHECK-Bedingungen und
19 Quellindizes ab. Ein zusätzlicher gefilterter Unique-Index ersetzt den
SQLite-UNIQUE-Schlüssel von `BurialSites`. `TABLES` liefert SQLAlchemy-Core-
Tabellen unter ihrem Zielnamen, `metadata` verwendet ausdrücklich `dbo`.
Alle Originaltypangaben bleiben in `Column.info['source_declared_type']`.

| Quellkonstrukt | Cemaris / Grund |
| --- | --- |
| `INTEGER` | `BIGINT`: IDs, Fremdschlüssel, YYYYMMDD, HHMM und Unix-Millisekunden; keine Umdeutung zu SQL-Datum, weil Teil-Daten und Null-Uhrzeit erlaubt sind |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT IDENTITY(1,1)`; SQL Server erzeugt IDs, Lücken sind zulässig |
| `OrderForms.orderFormId INTEGER PRIMARY KEY` | externer `BIGINT`-Schlüssel ohne Identity; `integrations/portal/database/recordOrderForm.ts` liefert ausdrücklich die Portal-ID |
| `DECIMAL(p,s)` | `FLOAT(53)`: SQLite NUMERIC-Affinität/Node-Number bewahren binäre Gleitkommawerte, ohne auf die deklarierte Skala zu runden; Mengen `1.25` und Beträge `123.4567` bleiben erhalten |
| `VARCHAR(n)`, `CHAR(n)`, `TEXT` | `NVARCHAR(n)` bzw. `NVARCHAR(MAX)`; Unicode bleibt unabhängig von der Server-Codepage erhalten; CHAR wird nicht aufgefüllt |
| Zeichenfolgen | `Latin1_General_100_BIN2`: Groß-/Kleinbuchstaben und Akzente in Schlüsseln unterscheiden; Suche verwendet gesonderte Ausdrücke |
| `smallint`, `bit`/`boolean` | `SMALLINT`, `BIT`; ursprüngliche Defaults bleiben erhalten |
| `SunriseSettings` | `dbo.CemarisSettings`; reiner interner Markenwechsel, keine externe Protokollkennung |
| `AuditLog` ohne Primärschlüssel | weiterhin ohne Primärschlüssel; Core modelliert auch identische Logzeilen, ohne eine zusätzliche Identität zu erfinden |
| zusammengesetzte Schlüssel, FKs | unverändert; keine neuen Kaskadenlöschungen oder Benutzer-FKs auf Auditnamen |
| `BurialSites` UNIQUE über Friedhof und fünf Namenssegmente | gefilterter Unique-Index `WHERE cemeteryId IS NOT NULL`; mehrere gleiche Namen mit NULL-Friedhof bleiben wie in SQLite zulässig; gelöschte Datensätze reservieren weiter ihren Schlüssel |
| `WITHOUT rowid`, WAL, SQLite busy_timeout | plattformspezifisch ersetzt durch SQL-Server-Transaktionen/Verbindungsverwaltung; kein SQLite-Zieldatenspeicher |

Die Alembic-Revision `0001_sunrise_schema.py` enthält eine eingefrorene
Schemadefinition. Sie importiert keine veränderliche Anwendungsmetadaten.
`upgrade`, wiederholtes `upgrade`, `downgrade` und erneutes `upgrade` werden
auf frischen Testdatenbanken geprüft. Alembic normalisiert für seinen Vergleich
eine Kopie des tatsächlichen Defaultschemas, weil MSSQL `dbo` bei Reflection
als `None` meldet. Echte zusätzliche Spalten und entfernte FKs bleiben erkennbar;
die Anwendungsmetadaten bleiben dabei unverändert.

## Initialwerte und synthetische Daten

`seed_default_catalogs()` überträgt 46 ursprüngliche Katalogwerte in elf
Tabellen aus `initializeData()` und den zugehörigen `add*`-Hilfen. Auditbenutzer
ist `databaseInit`, Millisekunden werden durch den Aufrufer oder die aktuelle
Zeit gesetzt. Beispiele: Columbarium hat unbegrenzte/NULL-Aschenkapazität;
die sechs Grabtypen behalten die gelieferten Reihenfolgen 1/2/2/2/2/2;
nur Preneed bzw. Urn setzen ihre jeweiligen Flags. Aktive eigene Katalogwerte
werden erhalten. Bei ausschließlich gelöschten Werten werden Defaults ergänzt,
die Historie bleibt erhalten. Die Funktion besitzt keine eigene Verbindung
oder Transaktion und schreibt keine fachlichen Testdaten.

Die gesonderte Fixture `load_synthetic_fixtures()` verknüpft 45 erfundene
Datensätze über alle 41 Tabellen. Vor dem ersten INSERT prüft sie SQL Server,
einen ausdrücklich gelieferten `cemaris_test_*`-Datenbanknamen, dessen exakte
Übereinstimmung mit `DB_NAME()` und leere Anwendungstabellen. Sie löscht,
verbindet und committet nicht selbst. Es werden keine Verwaltungs- oder
EDWALT-Daten verwendet. Die Fixture beschreibt weder ein fertiges Portalformat
noch einen echten Dokumentenbestand.

Sunrise-`get*`-Funktionen normalisieren teilweise beim Lesen die Reihenfolgen
auf 0..n. Der Seed bildet die Einfügungen ab; diese Lese-Seiteneffekte,
Auditgenerierung bei aktivierter Konfiguration und Cache-Aktualisierung folgen
mit den Katalog-/Anwendungsabläufen in 03/04/15. Sie gelten hier als offen.

## Zahlen, NULL und Datum

`semantics.py` überträgt `Number()` für skalare Formeingaben einschließlich
Leerstring/Whitespace/NULL → 0, Radixschreibweisen und NaN/Infinity sowie die
ursprünglichen `sanitizeLimit`-/`sanitizeOffset`-Regeln. Infinity bleibt im
Helper erhalten; dies ist keine Zusicherung, dass ein SQL-Pagingaufruf diesen
Wert annimmt. Gebührenberechnung und Rundung gehören zu Schritt 09.

NULL, `''`, `' '` und 0 werden nicht global zusammengefasst. Explizite Helfer
bilden die jeweiligen Quell-Umwandlungen ab. Audit-/Löschfelder bleiben
gespeichert; eine Löschung wird nicht durch automatische Datenbank-Defaults
oder Trigger erfunden. Fachliche Audit-/Soft-Delete-Abläufe folgen ihren
CRUD-Modulen.

Partielle Datumsangaben behalten YYYYMMDD einschließlich unbekanntem Monat
oder Tag 00. Positive Jahre werden übernommen, Monat auf 0..12 und Tag auf
0..31 begrenzt. Anzeige und Extraktion folgen der Quelle. Ein unbekannter
Monat überdeckt bei der Anzeige einen vorhandenen Tag (`19010015` → `1901`).
Die Quelle akzeptiert auch ungültige Kalendertage (`20240231`), Bruchteile
und Infinity; die Helper-Tests bewahren diese Beobachtung ausdrücklich.

## Suche

Wörter werden wie in JavaScript kleingeschrieben, ausschließlich an ASCII-
Leerzeichen getrennt und dedupliziert. Grabname, Käufer und Verstorbene müssen
alle Suchteile enthalten. `%`, `_` und `[` sind in dieser Teilstringsuche
literale Zeichen. SQLite `lower()` faltet die gespeicherten Werte nur für
ASCII. Deshalb findet die Suche `Änne` den gespeicherten Wert `änne`, aber
nicht `Änne`; Cemaris bewahrt auch diese ungewöhnliche Quellregel.

`startsWith`/`endsWith` behalten dagegen die aktiven SQLite-LIKE-Wildcards
`%` und `_`. SQL Servers zusätzliche `[`-Muster werden maskiert. ASCII wird
explizit gefaltet; binäre UTF8-VARCHAR-Suchausdrücke sorgen dafür, dass `_`
auch ein einzelnes Zeichen außerhalb der BMP wie 🪦 trifft. Angefügtes CHAR(1)
auf beiden Seiten erhält Leerzeichen am Ende, die SQL Server bei VARCHAR-LIKE
sonst teilweise ignoriert. NULL bleibt NULL. Die gespeicherten Spalten bleiben
NVARCHAR. Diese Suchausdrücke erfordern **SQL Server 2019 oder neuer**.

Vertragsfilter: laufend Start ≤ heute und Ende NULL oder Ende ≥ heute;
künftig Start > heute; vergangen Ende < heute. Endpunkte sind einschließlich.
Unbekannte Filterwerte schränken nicht ein. Der aufrufende Ablauf kann ein
Anwendungsdatum übergeben; ohne Vorgabe gilt das lokale Serverdatum wie in
der Quelle. Anwendungsterminzone und Benutzerkonfiguration folgen separat.

## Sichtbare technische Unterschiede und spätere Nachweise

- SQL Server erzwingt NVARCHAR-Längen, SMALLINT-/BIT-Typen und BIGINT-Werte;
  SQLite erzwingt diese deklarierten Typgrenzen nicht. Überlange Texte,
  Nicht-Bool-BIT-Werte, Bruchteile in INTEGER-Spalten und heterogene SQLite-
  Speichertypen sind damit noch keine 1:1 nachgewiesenen Zielwerte.
- SQL-Server-Gleichheit und Unique-Schlüssel ignorieren auch unter BIN2
  nachgestellte Leerzeichen (`A`/`A `); SQLite BINARY unterscheidet diese.
  Dieser verbleibende Unterschied gilt für direkte Gleichheits-/Schlüsselregeln,
  nicht für die geprüften Suchhelfer. Die betreffenden Fachabläufe müssen ihre
  tatsächliche Eingabenormalisierung in den Folgeschritten abgleichen.
- Konkrete Quellanomalie: `addContractInterment` wandelt `deathAge=''` in NULL;
  `updateContractInterment` speichert den Leerstring unverändert in SQLite.
  Ein BIGINT-Feld kann diesen TEXT-Zustand nicht bewahren. Seit Schritt 08
  speichern Anlage und Änderung ausdrücklich NULL; die sichtbare leere Angabe
  bleibt leer. Der konkrete Original-/SQL-Vergleich steht in BEISETZUNGEN.md.
- Schritt 08 gleicht Datumsbruchteile konkret ab: `1900/2/1.5` bleibt in der
  Quelle REAL `19000201.5` (Anzeige `0002-01-.5`) und wird vom SQL-Backend
  kontrolliert abgewiesen. Ganzzahlige Resultate bleiben erlaubt, auch wenn
  einzelne Bestandteile Bruchteile haben: `2000.5/0/0` → `20005000`
  (Anzeige `2000-50`). Nicht endliche Resultate und BIGINT-Überläufe werden
  ebenfalls kontrolliert zurückgewiesen. Die Browserformulare verlangen
  ganzzahlige Bestandteile; Backend und Originalprobe prüfen bewusst auch
  direkte Aufrufe außerhalb dieser HTML-Grenzen.
- IDs sind technische Schlüssel. SQLite-Autoincrement und SQL-Identity haben
  unterschiedliche Reservierungs-/Rollbackmechanismen; lückenlose oder nach
  einem fehlgeschlagenen INSERT identische Zähler werden nicht zugesichert.
- Keine Fachoberfläche, vollständige Initialisierungsroutine, Datenmigration,
  Sicherungsroutine, Liveintegration oder fertige Gesamtportierung wird durch
  diese Schema- und Helper-Nachweise behauptet.

## Finanzverbraucher seit Schritt 09

Die tatsächlichen Gebühren-/Transaktionsmodule und Browserrenderer sind mit
Originaleingaben gegen SQL Server und React verglichen. Speicherung bleibt
Binary64 ohne Rundung; erst die Anzeige rundet mit `toFixed(2)`. Die separat
berechnete Zahlungsgrenze bewahrt die Rechenreihenfolge der Quelle.
SQLite-TEXT in Zahlenspalten (leere/fehlerhafte Strings) kann FLOAT nicht
speichern; Rechnungsflags außerhalb 0/1 kann BIT nicht erhalten. Cemaris
weist diese Eingaben kontrolliert ab. Die Zahlenerkennung übernimmt
ASCII-Dezimal-/Exponentschreibweise und ASCII-Randwhitespace; Python-
Unterstriche/Unicodeziffern werden nicht in andere Beträge umgedeutet.
Quellfälle, Datum-/Zeitfallbacks, Auditbesonderheiten und Befehle stehen in
[GEBUEHREN.md](GEBUEHREN.md) und [Bericht 09](berichte/09.md).

## Reproduzierbare Referenzbelege

`node scripts/reference_semantics.mjs --check-fixture` führt kopierte bzw.
extrahierte Original-JavaScript-Funktionen unter `.local/reference-semantics/`
aus. Nur die externe Datumsermittlung wird auf 20261019 gesetzt. Der feste
Commit und Quellhashes werden geprüft; Sunrise wird nicht installiert oder
verändert. SQLite misst hierbei ausschließlich die **Quellseite**.

Die versionierte, synthetische Fixture enthält 20 Zahlen-, 18 Datumseingabe-,
16 Datumsausgabe-, 32 Such- und sechs Vertragszeitfälle sowie fünf numerische
Quellspeicherfälle. Python-Helper und tatsächliche SQL-Server-Suchergebnisse
werden gegen diese Ergebnisse geprüft. Ein separater Strukturvergleich führt
die Original-DDL in einer Quell-Oracle aus und vergleicht alle 41 Tabellen,
Spalten, Defaults, Schlüssel, CHECKs und Indizes mit den Zielmetadaten.
Der Zielnachweis erfolgt ausschließlich auf echtem SQL Server.

Technische Primärquellen: [SQLite-Typaffinität](https://www.sqlite.org/datatype3.html),
[SQLite lower](https://www.sqlite.org/lang_corefunc.html#lower),
[SQLite LIKE](https://www.sqlite.org/lang_expr.html#like),
[SQLAlchemy/MSSQL](https://docs.sqlalchemy.org/en/21/dialects/mssql.html),
[SQL Server FLOAT](https://learn.microsoft.com/en-us/sql/t-sql/data-types/float-and-real-transact-sql),
[SQL Server LIKE](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/like-transact-sql),
[Unicode und UTF8](https://learn.microsoft.com/en-us/sql/relational-databases/collations/collation-and-unicode-support),
[gefilterte Indizes](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/create-filtered-indexes).
