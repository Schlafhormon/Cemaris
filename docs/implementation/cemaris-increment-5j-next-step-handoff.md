# Ausführbare Folgeübergabe: Inkrement 5j – datensparsame kompatible Beteiligten-Schnellsuche

Stand: 24.08.2026

## Auftrag

Optimiere ausschließlich die interne EF-Core-Leseprojektion der vorhandenen
Beteiligten-Schnellsuche `GET /api/parties?query=...`. Die Schnellsuche wird in
eingebetteten Inhaberauswahlen verwendet und muss in Request, JSON-Array,
Filtersemantik, sichtbaren Feldern und Frontendverhalten vollständig
kompatibel bleiben.

Ziel ist, beim SQL-Provider nur die für `PartySearchItem` benötigten
Beteiligtenfelder und gegebenenfalls die aktuelle primäre Anschrift zu lesen.
Revisionen und nicht aktuelle Anschriften dürfen nicht mehr materialisiert
werden. Führe keine Pagination, kein Ergebnislimit und keine neue Sortierung
ein; diese wären eigenständige Produktverträge.

## Repository, Arbeitsverzeichnis und Werkzeuge

Arbeite ausschließlich in:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Verwende für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Verwende nur synthetische Testdaten. Öffne keine externen EDWALT-Originale
oder Phase-Arbeitsbereiche. Führe keinen Commit durch und stage keine Datei.

## Erwarteter Ausgangsstand und Schutz vorhandener Arbeit

Bei Erstellung dieser Übergabe gilt:

- Branch `main`, HEAD
  `85593d71af3bc8b90b3a7c88392f2a1e29650b56`, Upstream `origin/main`,
  Ahead/Behind `0/0`;
- der Index ist leer;
- die uncommitteten Produkt-, Test- und Dokumentationsänderungen bilden
  ausschließlich Inkrement 5i einschließlich Abschluss und dieser Übergabe;
- es wurde in 5i kein Commit erstellt und nichts gestagt.

Untersuche bei Beginn vollständig Branch, HEAD, Upstream, Ahead/Behind,
Status, Arbeits- und Index-Diff sowie sämtliche unversionierten Inhalte.
Es ist ausdrücklich zulässig und wahrscheinlich, dass 5i nach Erstellung
dieser Übergabe committed und gegebenenfalls gepusht wurde. Prüfe einen
solchen Commit vollständig und arbeite auf seinem aktuellen Nachfolgerstand
weiter. Ein abweichender HEAD oder ein dadurch sauberer Arbeitsbaum ist kein
Grund für einen Reset. Andere Abweichungen sind ebenfalls zu erklären und zu
erhalten; überschreibe, verwerfe, stage oder committe keine vorhandene Arbeit.

Prüfe vor jeder logisch getrennten Änderung erneut den vollständigen
Git-Stand. Verändere den ignorierten Fremdbestand `tmp/pagination-build`
nicht. Er umfasst 890 Dateien und 120.354.652 Bytes. Sein Manifest besteht aus
repository-relativem Pfad mit `/`, Dateilänge, UTC-Ticks und Datei-SHA-256,
mit `|` je Feld und LF je Zeile. Erwarteter Manifest-Hash:

`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`

## Pflichtlektüre

Lies vor Änderungen vollständig:

1. `docs/implementation/cemaris-increment-5i-completion.md`;
2. `docs/implementation/cemaris-increment-5i-next-step-handoff.md`;
3. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
4. `docs/architecture/person-usage-rights-deadlines.md`;
5. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
6. `docs/requirements/identity-authorization-audit-decisions.md`;
7. `docs/architecture/authentication-authorization-audit.md`;
8. Root-README und alle README-Indizes unter `docs/requirements`,
   `docs/architecture`, `docs/decisions` und `docs/implementation`;
9. `EfPersonUsageRightStore.SearchPartiesAsync`, den zugehörigen Application-
   und API-Vertrag, `cemarisApi.searchParties`, alle Inhaberauswahlen sowie
   deren Unit-, Integrations-, SQL- und Frontendtests.

Prüfe besonders den 5i-SQL-Test in
`tests/Cemaris.IntegrationTests/SqlServerPersonUsageRightTests.cs`: Er wurde in
5i implementiert, konnte dort mangels autorisierter Verbindung aber nicht
real ausgeführt werden. Die 5j-SQL-Suite muss deshalb sowohl den bestehenden
5i-Verzeichnisfall als auch den neuen 5j-Schnellsuchefall abdecken.

## Verbindlicher Umfang

Ändere nur die Implementierungsform von
`EfPersonUsageRightStore.SearchPartiesAsync` und die unmittelbar notwendigen
Tests und Dokumente:

- filtere weiterhin mit der von der Anwendung gelieferten normalisierten
  Query gegen `NormalizedName`;
- behalte die bisherige Ergebnismenge und das fehlende Ergebnislimit bei;
- projiziere serverseitig ausschließlich ID, Beteiligtenart, Namensfelder und
  die aktuelle primäre Anschrift;
- lade keine Revisionen und keine nicht aktuelle Anschrift;
- vermeide N+1-Abfragen und verwende weiterhin abbrechbare asynchrone
  EF-Aufrufe;
- ändere den synthetischen Store nur, falls ein Paritätstest dies zwingend
  erfordert; er darf kein abweichendes Verhalten erhalten.

Voraussichtlich betroffen sind ausschließlich:

- `src/Cemaris.Infrastructure/PersonUsageRights/EfPersonUsageRightStore.cs`;
- unmittelbar passende Tests unter `tests/Cemaris.IntegrationTests` und nur
  bei echter Notwendigkeit unter `tests/Cemaris.UnitTests`;
- vorhandene Frontendtests ausschließlich als Kompatibilitätsnachweis, nicht
  zur Verhaltensänderung;
- Abschluss-, Architektur- und Indexdokumentation für 5j sowie die nächste
  kontextlose Folgeübergabe.

Erweitere diesen Dateiumfang nur, wenn ein nachgewiesener technischer Grund
dies zwingend erfordert, und dokumentiere die Abweichung.

Explizit außerhalb des Umfangs liegen:

- Änderungen an `GET /api/parties?query=...`, seinem Array-Schema oder der
  Mindest-/Höchstlänge;
- Pagination, Sortierung, Begrenzung oder Debounce der Schnellsuche;
- Änderungen am 5i-Verzeichnisendpunkt oder an `/parties`;
- neue Domain-, Persistenz-, Migrations-, Rollen-, Policy-, Capability-,
  ETag-, Revisions-, Audit-, Datenschutz- oder Fachsemantik;
- Änderungen an Beteiligtenanlage, Dublettenbestätigung, Inhaberauswahl oder
  Nutzungsrechtsmutationen.

## Sicherheits- und Kompatibilitätsgrenzen

Die bestehende `PersonUsageRights`-Policy, die Development-Capability und der
API-Vertrag bleiben unverändert. Die Optimierung ist ein lesender interner
Implementierungswechsel. Gib in Logs, Tests und Dokumentation keine echten
Namen, Anschriften, Verbindungswerte oder andere Verwaltungsdaten aus.

## Pflichtprüfungen und Tests

Beweise mindestens:

- unveränderte Normalisierung, Ergebnismenge, Array-Antwort und sichtbare
  `PartySearchItem`-Felder;
- korrekte Anzeige für natürliche Person und Organisation;
- ausschließlich die aktuelle primäre Anschrift wird zurückgegeben;
- keine N+1-Abfrage und keine Materialisierung von Revisionen oder übrigen
  Anschriften im realen EF-/SQL-Pfad;
- eingebettete Inhaberauswahlen verwenden weiterhin ausschließlich die alte
  Schnellsuche, nicht `/api/parties/directory`.

Der SQL-Nachweis soll robust die Anzahl der ausgeführten Leseabfragen und die
Abwesenheit der Revisionsprojektion beziehungsweise nicht benötigter
Anschriftsspalten belegen. Binde den Test nicht an vollständig identischen,
provider- oder versionsabhängig formatierten SQL-Text.

Führe danach vollständig aus:

1. Release-Build der Solution mit 0 Warnungen und 0 Fehlern;
2. vollständige Unit-Tests;
3. Integrationstests mit `Category!=SqlServer`;
4. reale SQL-Suite mit `Category=SqlServer`;
5. `dotnet format --verify-no-changes --no-restore`;
6. `npm ci`, vollständige Frontendtests, Lint und Produktionsbuild;
7. `git diff --check`;
8. Markdown-Link-/Anker-, Tabellen-, Whitespace- und Secretprüfung ohne
   Ausgabe gefundener Werte;
9. vollständigen finalen Git- und Fremdbestandsnachweis.

Falls `CEMARIS_SQL_TEST_CONNECTION_STRING` nicht ausdrücklich gesetzt ist,
frage genau einmal nach einer autorisierten temporären Cemaris-Testverbindung.
Suche, errate oder leite keinen Wert ab. Ohne Verbindung führe alle übrigen
Prüfungen aus und dokumentiere die reale SQL-Suite als nicht ausgeführt. Falls
eine Verbindung autorisiert bereitsteht, verwende ausschließlich die
isolierten Testdatenbanken des vorhandenen Fixtures und weise ihre vollständige
Bereinigung nach, ohne den Verbindungswert auszugeben.

## Dokumentation und Abschluss

Erstelle `docs/implementation/cemaris-increment-5j-completion.md`, aktualisiere
die betroffenen quellengebundenen Architekturtexte, Root-README und alle vier
Dokumentationsindizes und grenze den danach kleinsten sicheren Schritt in
einer kontextlosen Folgeübergabe ab. Erstelle kein neues ADR, sofern keine
Architekturentscheidung geändert wird.

Der Abschluss muss ausdrücklich bestätigen:

- alter Endpunkt, Array-Vertrag und eingebettete Inhaberauswahl kompatibel;
- keine Pagination, Sortierung oder neue Fachsemantik ergänzt;
- keine echten Daten oder externen EDWALT-Unterlagen verwendet;
- vorhandene Arbeit und `tmp/pagination-build` unverändert erhalten;
- bei ausgeführter SQL-Suite alle Testdatenbanken bereinigt;
- kein Commit erstellt und nichts gestagt.
