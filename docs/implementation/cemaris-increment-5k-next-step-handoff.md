# Ausführbare Folgeübergabe: Inkrement 5k – dauerhafter SQL-Developmentbetrieb und EDWALT-Friedhofsstammdaten

Stand: 25.08.2026

## Auftrag

Führe die Projektentscheidung `USR-2026-08-25-LOCAL-SQL-MASTER-DATA` und
ADR-0017 vollständig Ende zu Ende aus:

1. `CEMARISDEV` wird die dauerhafte lokale Development-Datenbank des
   Projektverantwortlichen;
2. alle derzeit umgesetzten Cemaris-Funktionen müssen im Development mit dem
   EF-Core-/SQL-Server-Provider funktionieren;
3. die lokalen Konten `admin` (`Administration`) und `sach`
   (`Sachbearbeitung`) werden mit sicheren, extern bereitgestellten
   Passwörtern einmalig angelegt und dauerhaft erhalten;
4. ausschließlich nicht personenbezogene Friedhofsstammdaten werden aus der
   freigegebenen EDWALT-Arbeitskopie analysiert, explizit gemappt und nach
   `CEMARISDEV` migriert;
5. Personen-, Adress-, Fall-, Beisetzungs-, Nutzungsrechts-, Gebühren-,
   Notiz-, Dokument- und sonstige Inhaltsdaten aus EDWALT bleiben außerhalb.
   Personen- und Falldaten für lokale Tests bleiben synthetisch, werden aber
   dauerhaft in SQL gespeichert.

Arbeite bis zu einem nachweisbar lauffähigen lokalen Zustand einschließlich
Schema, Konfiguration, Konten, Import, Backend, Frontend, Tests,
Reconciliation und Dokumentation. Unbekannte EDWALT-Semantik darfst du auch
zur Beschleunigung nicht raten. Wenn eine für das Laden zwingende fachliche
Zuordnung nach vollständiger lokaler Evidenzprüfung mehrdeutig bleibt, lege
die konkrete Alternative mit anonymisierter Evidenz der Projektverantwortung
vor und lade diesen Teil erst nach ausdrücklicher Entscheidung.

## Arbeitsbereiche und Werkzeuge

Repository und einziges Verzeichnis für versionierte Änderungen:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Freigegebene EDWALT-Arbeitswurzel:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`

Die vorhandenen Unterverzeichnisse sind ausschließlich read-only zu
verwenden:

- `phase2-20260811` mit Quellkopien, festen RAW-Extrakten, Profiler und
  aggregierten Berichten;
- `phase3-person-rights-status-20260812`;
- `phase4-additional-addresses-20260812`.

Phase 3 und 4 dienen nur als vorhandene Evidenz und werden für diesen Import
nicht erneut ausgewertet. Öffne keine anderen EDWALT-Originale oder früheren
externen Arbeitsbereiche. Führe EDWALT nicht aus. Verändere keine vorhandene
Quell-, RAW-, IDX-, DAT-, Report-, Prototyp- oder Logdatei.

Für Laufartefakte darfst du neu anlegen:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`

Dieser neue Arbeitsbereich enthält ausschließlich lokale Dry-run-, Mapping-
und Reconciliation-Artefakte und wird nicht eingecheckt. Schreibe keine
Personenwerte hinein. Der wiederverwendbare Parser und Importcode sowie alle
synthetischen Fixtures und Tests gehören dagegen versioniert unter `tools`
beziehungsweise `tests` in das Cemaris-Repository.

Verwende für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Zieldatenbank:

`CEMARISDEV`

Verwende die bereits maschinenlokal konfigurierte Cemaris-Verbindung nur,
wenn der tatsächlich durch den Provider aufgelöste Datenbankname exakt
`CEMARISDEV` lautet. Gib Connection Strings, Servernamen, Anmeldenamen oder
Secrets niemals aus. Erfinde, suche oder leite keine Zugangsdaten aus anderen
Dateien oder Prozessen ab.

## Ausgangsstand und Schutz vorhandener Arbeit

Bei Erstellung dieser Übergabe gilt:

- Branch `main`, HEAD
  `797457f7f7868a3dc0a982fa7f823a141b6fd710`, Upstream `origin/main`,
  Ahead/Behind `1/0`;
- der Index ist leer;
- die vorhandenen uncommitteten Produkt-, Test- und Dokumentationsänderungen
  bilden Inkrement 5j und die Dokumentation dieser neuen 5k-Entscheidung;
- es wurde nichts gestagt und kein Commit für 5j/5k erstellt.

Der Stand kann inzwischen committed, gepusht oder durch weitere erhaltene
Arbeit ergänzt worden sein. Prüfe zu Beginn vollständig Branch, HEAD,
Upstream, Ahead/Behind, Status, Arbeits- und Index-Diff sowie sämtliche
unversionierten und ignorierten relevanten Inhalte. Prüfe vorhandene Commits
und Änderungen inhaltlich. Setze nie zurück, verwirf, überschreibe, stage oder
committe keine fremde beziehungsweise vorhandene Arbeit.

Verändere den ignorierten Fremdbestand `tmp/pagination-build` nicht. Bei
Erstellung umfasst er 890 Dateien und 120.354.652 Bytes. Sein Manifest aus
repository-relativem Pfad mit `/`, Dateilänge, UTC-Ticks und Datei-SHA-256,
getrennt mit `|` und LF, besitzt den SHA-256:

`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`

Prüfe vor jeder logisch getrennten Änderung den Git-Stand erneut. Führe
keinen Commit durch und stage keine Datei.

## Pflichtlektüre

Lies vor Änderungen vollständig:

1. `docs/implementation/cemaris-increment-5j-completion.md`;
2. `docs/implementation/cemaris-increment-5j-next-step-handoff.md`;
3. dieses Übergabedokument;
4. `docs/decisions/ADR-0004-microsoft-sql-server.md`;
5. `docs/decisions/ADR-0009-product-development-before-edwalt-import.md`;
6. `docs/decisions/ADR-0012-local-accounts-and-role-boundaries.md`;
7. `docs/decisions/ADR-0014-canonical-cemetery-master-data.md`;
8. `docs/decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md`;
9. `docs/requirements/cemetery-master-data-decisions.md`;
10. `docs/requirements/identity-authorization-audit-decisions.md`;
11. `docs/architecture/cemetery-master-data.md` und
    `docs/architecture/authentication-authorization-audit.md`;
12. `docs/migration/README.md`, `edwalt-source-analysis.md`,
    `edwalt-source-field-catalog.md`, `edwalt-extraction-prototype.md` und die
    vorhandenen Phase-2- bis Phase-4-Übergaben;
13. Root-README und alle README-Indizes unter `docs`;
14. `Program.cs`, `DependencyInjection.cs`, `CemarisDbContext`, sämtliche
    EF-Migrationen, EF- und synthetischen Stores, Wartungsbefehle,
    Identity-/Capability-Konfiguration sowie passende Unit-, Integrations-,
    SQL- und Frontendtests;
15. read-only den Phase-2-Prototyp, seinen README-Text und nur die für
    `W005`, `W005dm` und den strikt abgegrenzten W020-Strukturschlüssel
    erforderlichen statischen EDWALT-Artefakte.

## Verbindlicher Implementierungsumfang

### 1. Vollständiger aktueller Funktionsumfang auf SQL Server

- Erhalte `Synthetic` als portablen Provider für automatisierte Tests und
  andere Entwickler, mache aber `SqlServer` über maschinenlokale User Secrets
  zum dauerhaften Standard dieses Entwicklungsarbeitsplatzes.
- Hebe die pauschalen Synthetic-only-Startabbrüche für Friedhofsstammdaten,
  Beisetzungsprozess sowie Beteiligte/Nutzungsrechte nur soweit auf, wie die
  vorhandenen EF-Stores und neue Ende-zu-Ende-Nachweise die Parität belegen.
- Alle Capabilities bleiben ausschließlich in `Development` aktivierbar und
  standardmäßig `false`. Authentifizierung, Rollenpolicies, CSRF, starke
  ETags, Nebenläufigkeit, atomarer Änderungsnachweis und Fehlerverträge
  bleiben unverändert.
- Ergänze reale SQL-Endpunkttests, nicht nur direkte Storetests, für
  Stammdatenpflege, Fallbearbeitung, Beisetzungsprozess und
  Beteiligte/Nutzungsrechte. Beweise Lesen, Anlegen, Ändern,
  Konfliktverhalten, Rollen und Atomarität mit synthetischen Testwerten.
- Prüfe sämtliche synthetischen Storekopplungen und ersetze keine EF-Logik
  durch In-Memory-Zwischenzustand. Ein Neustart gegen `CEMARISDEV` muss den
  Zustand erhalten.
- Erledige die bereits identifizierte Cancellation-Token-Parität der
  synthetischen Beteiligten-Schnellsuche, sofern der Befund weiterhin besteht;
  sie darf keine API- oder Ergebnisänderung verursachen.

### 2. Dauerhafte lokale Konfiguration und Schema

- Verwende User Secrets, nicht `appsettings*.json`, für Verbindung,
  `ReadModel:Provider=SqlServer` und die lokal aktivierten Capabilities.
- Ändere keine Connection-String-Werte, sofern die vorhandene Konfiguration
  bereits sicher auf `CEMARISDEV` zeigt. Zeige bei allen Prüfungen nur
  Ja/Nein, Provider und den erwarteten Datenbanknamen, nie den Wert.
- Prüfe vor EF-Änderungen Migration History, ausstehende Migrationen und das
  generierte SQL auf destruktive Operationen. Erstelle nur additive
  Migrationen, soweit der nachgewiesene Zielzustand sie benötigt.
- Wende Migrationen kontrolliert auf `CEMARISDEV` an. Erstelle, lösche,
  ersetze, leere oder benenne diese Datenbank niemals um. Entferne keine
  bestehenden Tabellen oder Daten.
- Der normale API-Start führt weder Schemaänderungen noch Seed, Import,
  Benutzeranlage oder Passwortänderungen aus.

### 3. Dauerhafte Development-Konten

- Ermittle datensparsam, ob `admin` und `sach` bereits vorhanden sind und
  welche Rollen sie besitzen; lies oder protokolliere keine Passwort-Hashes.
- Reicht der vorhandene Erstadmin-Bootstrap für die wiederholbare Einrichtung
  nicht aus, implementiere einen expliziten Development-only-
  Wartungsbefehl. Er muss `ReadModel:Provider=SqlServer`, den exakten
  erwarteten Datenbanknamen `CEMARISDEV`, ein vollständig migriertes Schema
  und explizite Secretwerte verlangen.
- Lege fehlende Konten mit festen Benutzernamen und den Rollen
  `Administration` beziehungsweise `Sachbearbeitung` an. Bereits passende
  Konten bleiben einschließlich Passwort und Security Stamp unverändert.
  Rollenabweichungen oder Namenskollisionen führen ohne Teilwirkung zu einer
  klaren Fehlermeldung; es gibt keine stillen Passwort- oder Rollenresets.
- Wenn die sicheren Passwörter nicht bereits ausdrücklich als lokale Secrets
  bereitstehen, frage die Projektverantwortung genau einmal gemeinsam nach
  beiden Werten. Erfinde keine Passwörter und schreibe sie nicht in Prompt,
  Shellhistorie, Kommandozeile, Logs, Dokumentation oder Git. Die geltende
  Mindestlänge beträgt zwölf Zeichen.
- Beweise nach einmaliger Einrichtung Anmeldung und Rollenwirkung beider
  Konten sowie ihre Erhaltung nach Prozessneustart und erneutem
  Wartungs-/Importlauf.

### 4. Datensparsamer EDWALT-Parser und explizites Mapping

- Lege einen kleinen versionierten .NET-Parser/Importer unter `tools` mit
  getrennten Schritten `analyze`, `dry-run` und `apply` an. Quellzugriff,
  Dekodierung, Mapping, Zielvalidierung und Laden müssen getrennt testbar sein.
- Verwende ausschließlich feste Positivlisten aus Dateiname, Satzlänge,
  Offset, Länge, Zeichensatz/Format und Zielfeld. Implementiere keine
  heuristische Gesamtsatzdekodierung, keine reguläre Suche über W020-Inhalte
  und keine Ausgabe von Quellwerten.
- Belege die exakten Unterfeldgrenzen in `W005`/`W005dm` für Friedhofscode,
  Friedhofsbezeichnung, Grabartcode und Grabartbezeichnung durch mindestens
  zwei voneinander unabhängige lokale Evidenzen, etwa statische Felddefinition
  plus Satz-/Indexprofil. Kläre die Variantenregel; vereinige aktuelle und
  DM-Sätze nicht pauschal.
- Ermittle Beisetzungsform, Aktivität und gegebenenfalls Kapazität nur, wenn
  sie feldgenau und fachlich eindeutig belegt sind. Andernfalls fordere eine
  ausdrückliche Mappingentscheidung an. Verwende niemals eine aus Namen
  geratene allgemeine Produktregel.
- Für Grabstellen darf `W020` zunächst nur über Anwendernummer 1–2,
  Friedhofscode 3–6 und den bestätigten Struktur-/Grabnummernschlüssel 7–26
  gelesen werden. Weitere W020-Spannen – einschließlich möglicher
  Grabart-/Kapazitätsfelder – dürfen erst nach feldgenauem Positivlistenbeleg
  ergänzt werden. Der Parser darf Personen-, Suchcode-, Adress-, Rechte-,
  Notiz- oder Zustandsbereiche nicht dekodieren.
- Zerlege den 20-Byte-Struktur-/Grabnummernschlüssel nur anhand belegter
  Regeln in Bereich, Feld, Reihe und Grabnummer. Wenn nur Friedhof plus
  ungeteilte Grabnummer sicher ist, bilde nur diese zulässige Cemaris-Struktur
  ab; erfinde keine Zwischenebenen. Eine Grabstelle darf wegen der
  verpflichtenden Grabart erst geladen werden, wenn deren Zuordnung sicher
  belegt oder ausdrücklich entschieden ist.
- Tests verwenden ausschließlich neu erzeugte synthetische Binärfixtures mit
  Grenzfällen für CP1252, Padding, führende Nullen, Dubletten, unbekannte
  Varianten, gekürzte Sätze und verbotene W020-Bereiche. Kein Originalwert
  darf in Tests oder Snapshots gelangen.

### 5. Dry-run, Import und Reconciliation

- `dry-run` ist zwingend vor `apply`. Er validiert Quellenmetadaten,
  Satzlängen, freigegebene Feldspannen, Mappingvollständigkeit,
  Normalisierung, Eindeutigkeit, Referenzen und bereits vorhandene Ziele.
- Berichte enthalten nur technische Anzahlen, Fehlerklassen und bei Bedarf
  SHA-256-basierte anonyme Quellkennungen. Keine Namen, Codes, Grabnummern,
  Pfade mit Geheimnissen oder sonstigen Quellwerte ausgeben.
- `apply` verlangt `Development`, `SqlServer`,
  `Maintenance:ExpectedDatabase=CEMARISDEV`, einen erfolgreichen aktuellen
  Dry-run und explizite Bestätigung. Nach Öffnen der Verbindung wird der
  tatsächliche Datenbankname erneut geprüft.
- Verwende die vorhandenen Domain-/Application-/Store-Regeln und einen
  eindeutig benannten technischen Migrationsakteur. Umgehe Eindeutigkeit,
  Referenzprüfung und Änderungsnachweis nicht durch unkontrolliertes direktes
  SQL.
- Lade in Eltern-vor-Kind-Reihenfolge innerhalb einer kontrollierten
  Transaktion. Bei einem Fehler erfolgt vollständiger Rollback. Ein
  wiederholter Lauf ist idempotent: identische Quellobjekte werden erkannt,
  abweichende bereits vorhandene Ziele führen zu einem Konfliktbericht und
  nicht zu Überschreiben, Duplikat oder Löschung.
- Erhalte alle bestehenden Konten, synthetischen Personen-/Falldaten und
  manuell angelegten Stammdaten. Der Import darf keinen allgemeinen Reset oder
  `ExecuteDelete` verwenden.
- Weise nach dem Import Anzahlen je Zielart, eindeutige Quellzuordnung,
  referenzielle Integrität, keine verwaisten Hierarchien, gültige
  Friedhof-Grabart-Zuordnungen, keine Dubletten und einen zweiten
  teilwirkungslosen Lauf nach. Quell- und Zielwerte werden dabei nicht
  protokolliert.

## Explizit außerhalb des Umfangs

- EDWALT-Personen, -Adressen, -Suchcodes, -Berechtigte, -Nutzungsrechte,
  -Beisetzungen, -Vorgänge, -Gebühren, -Bescheide, -Buchungen, -Notizen,
  -Dokumente, -Benutzer und -Konfiguration;
- W006, W007, W010, W021, W022, W023, W040, W080 und Buchungsdateien als
  Importquellen;
- produktive Freigabe, Cutover, Parallelbetrieb oder Änderung der
  EDWALT-Originale;
- neue Frist-, Gebühren-, Status-, Historien-, Umnummerierungs-,
  Kapazitäts- oder Löschfachregeln;
- echte Personenwerte in Cemaris, Tests, Logs, Berichten oder Git;
- ein Connection String, Passwort, Hash oder lokaler Quellwert im Repository;
- Nutzung von `CEMARISDEV` durch automatisierte Test-Fixtures.

## SQL-Testverbindung

Die dauerhafte Anwendungsverbindung zu `CEMARISDEV` ist nicht die Verbindung
für die reale SQL-Test-Suite. Falls
`CEMARIS_SQL_TEST_CONNECTION_STRING` im neuen Prozess nicht ausdrücklich
bereitgestellt ist, frage genau einmal nach einer autorisierten temporären
Cemaris-Testverbindung. Erfinde, suche, errate oder leite keinen Wert ab und
verwende niemals die `CEMARISDEV`-Anwendungsverbindung als Ersatz.

Die SQL-Tests dürfen ausschließlich eindeutig benannte temporäre Datenbanken
`Cemaris_IntegrationTests_*` des vorhandenen Fixtures anlegen. Prüfe vor dem
Löschen Präfix und aufgelösten Datenbanknamen und weise die vollständige
Bereinigung nach. Ohne autorisierte Testverbindung führe alle übrigen
Prüfungen aus und dokumentiere die Suite als nicht ausgeführt.

## Pflichtprüfungen

Führe mindestens aus:

1. vollständiger Git-, Index-, unversionierter und Fremdbestandsnachweis vor,
   zwischen und nach den Änderungen;
2. Release-Build der Solution mit 0 Warnungen und 0 Fehlern;
3. vollständige Unit-Tests;
4. Integrationstests mit `Category!=SqlServer`;
5. reale SQL-Suite mit `Category=SqlServer`, sofern autorisiert;
6. zusätzliche Parser-/Importer-Tests ausschließlich mit synthetischen
   Binärfixtures;
7. `dotnet format --verify-no-changes --no-restore`;
8. `npm ci`, vollständige Frontendtests, Lint und Produktionsbuild;
9. Startnachweis mit allen aktuellen Capabilities und SQL-Provider in
   `Development` sowie negativer Startnachweis außerhalb von Development;
10. Schema-/Migrationsprüfung und kontrolliertes EF-Update von `CEMARISDEV`;
11. einmalige Konteneinrichtung, Anmeldung/Rollenwirkung und
    Neustartpersistenz von `admin` und `sach` ohne Secret-Ausgabe;
12. EDWALT-Analyse und Dry-run, kontrollierter Import, Reconciliation und
    zweiter idempotenter Lauf gegen `CEMARISDEV`;
13. manueller Browser-Smoke-Test der Stammdatenpflege mit beiden Rollen sowie
    einer vorhandenen synthetischen Fall-/Personenstrecke;
14. `git diff --check`;
15. Markdown-Link-/Anker-, Tabellen-, Whitespace-, Encoding- und
    Secretprüfung ohne Ausgabe gefundener Werte;
16. Nachweis, dass bestehende EDWALT-Phasen, Quellkopien,
    `tmp/pagination-build`, Benutzer, synthetische Falldaten und nicht zum
    Import gehörende SQL-Tabellen unverändert erhalten wurden.

## Dokumentation und Abschluss

Erstelle `docs/implementation/cemaris-increment-5k-completion.md`. Aktualisiere
Root-README, alle Dokumentationsindizes, Architektur, Anforderungen,
Migrationsdokumentation und bei einer echten neuen Architekturentscheidung
ein nachfolgendes ADR. Dokumentiere Befehle und technische Summen, aber keine
Connection Strings, Passwörter, lokalen Stammdatenwerte oder EDWALT-Inhalte.

Der Abschluss muss ausdrücklich unterscheiden:

- allgemeiner sicherer Repository-/Testdefault;
- maschinenlokaler dauerhafter Development-Standard `CEMARISDEV`;
- synthetische Personen-/Falldaten in dauerhaftem SQL;
- tatsächlich migrierte nicht personenbezogene EDWALT-Stammdatenkategorien;
- bewusst nicht gelesene beziehungsweise nicht migrierte Quellbereiche;
- ausgeführte und nicht ausführbare Prüfungen;
- erhaltene vorhandene Arbeit und externe read-only Bestände.

Erstelle kein Commit und stage keine Datei.
