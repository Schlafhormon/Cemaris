# Ausführbare Folgeübergabe: Inkrement 5i – paginierte Beteiligtenübersicht

Stand: 24.08.2026

## Auftrag

Führe als nächsten sicheren Cemaris-Implementierungsschritt Inkrement 5i
vollständig aus: eine deterministische, serverseitig paginierte Übersicht der
bereits vorhandenen kanonischen Beteiligten auf `/parties`.

Implementiere genau diesen technischen Schnitt Ende zu Ende. Ändere keine
Nutzungsrechtslebenszyklus-, Frist-, Status-, Grabstellen-, Beisetzungs-,
Gebühren- oder Migrationssemantik. Die in 5g getroffene Entscheidung
Variante A „keine Implementierung“ für eine mögliche vorzeitige Rückgabe
bleibt verbindlich.

Antworte und dokumentiere auf Deutsch. Führe keinen Commit durch.

## Repository, Arbeitsverzeichnis und Werkzeuge

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Verwende für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Arbeite nicht in externen Phase-Arbeitsbereichen und greife nicht auf
EDWALT-Originale zu. Repository-interne EDWALT-Unterlagen dürfen nur als
ausdrücklich gekennzeichnete `ALTVERFAHRENS-EVIDENZ` gelesen werden; für 5i
sind sie nicht erforderlich. Verwende ausschließlich synthetische Testdaten.
Keine Zugangsdaten, Verbindungswerte oder echte personenbezogene Daten in
Ausgaben oder Dokumentation schreiben.

## Erwarteter Ausgangsstand und Schutz vorhandener Arbeit

Beim Abschluss von 5h war der erwartete erhaltene Stand:

- Branch `main`;
- HEAD `7e93eafb5a2af1ba95df98fe3bf1d5d462ba3a96`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- leerer Index; kein durch 5g oder 5h erstellter Commit;
- geändert ausschließlich `README.md`, alle vier Dokumentationsindizes sowie
  die Anforderungs- und Architekturdokumente zu Beteiligten/Nutzungsrechten;
- neu und unversioniert ausschließlich 5g-Abschluss, 5g-Matrix,
  5h-Auswahlübergabe, 5h-Abschluss und diese 5i-Folgeübergabe;
- keine Produktcode-, Test-, API-, Domain-, Persistenz- oder
  Migrationsänderung aus 5g oder 5h.

Falls Änderungen inzwischen committed oder gepusht wurden oder der Git-Stand
anderweitig abweicht, untersuche die Abweichung vollständig. Setze nicht auf
den genannten Hash zurück. Überschreibe, verwerfe, stage oder committe keine
vorhandene oder fremde Arbeit.

Prüfe vor der ersten und vor jeder logisch getrennten Änderung vollständig:

- Branch, HEAD, Upstream und Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts;
- den ignorierten Fremdbestand `tmp/pagination-build`, ohne ihn zu verändern.

Der geschützte Fremdbestand umfasst 890 Dateien und 120.354.652 Bytes. Sein
Manifest besteht aus repository-relativem Pfad mit `/`, Dateilänge,
UTC-Ticks und Datei-SHA-256, je Feld mit `|` und je Zeile mit LF getrennt. Der
erwartete SHA-256 des Manifests lautet:

`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`

Verändere oder entferne diesen Bestand nicht und gib ihn nicht als eigene
Arbeit aus.

## Pflichtlektüre

Lies vor Änderungen vollständig:

1. `docs/implementation/cemaris-increment-5h-completion.md`;
2. `docs/implementation/cemaris-increment-5g-completion.md`;
3. `docs/implementation/cemaris-increment-5g-evidence-decision-approval-matrix.md`;
4. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
5. `docs/architecture/person-usage-rights-deadlines.md`;
6. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
7. `docs/requirements/identity-authorization-audit-decisions.md`;
8. `docs/architecture/authentication-authorization-audit.md`;
9. Root-README und die README-Indizes unter `docs/requirements`,
   `docs/architecture`, `docs/decisions` und `docs/implementation`;
10. die betroffenen Produkt- und Testdateien, insbesondere:
    - `src/Cemaris.Api/PersonUsageRightEndpoints.cs`;
    - `src/Cemaris.Application/PersonUsageRights/PersonUsageRightModels.cs`;
    - `src/Cemaris.Application/PersonUsageRights/PersonUsageRightService.cs`;
    - `src/Cemaris.Application/PersonUsageRights/IPersonUsageRightStore.cs`;
    - `src/Cemaris.Infrastructure/PersonUsageRights/EfPersonUsageRightStore.cs`;
    - `src/Cemaris.Infrastructure/PersonUsageRights/SyntheticPersonUsageRightStore.cs`;
    - `src/Cemaris.Web/src/api/cemarisApi.ts`;
    - `src/Cemaris.Web/src/types/personUsageRights.ts`;
    - `src/Cemaris.Web/src/components/PartyManagement.tsx`;
    - `src/Cemaris.Web/src/pages/PartiesPage.tsx`;
    - die zugehörigen Unit-, Integrations-, SQL- und Frontendtests;
    - die vorhandene Fallpagination als technisches Referenzmuster.

## Verbindlicher API-Vertrag

Ergänze additiv:

`GET /api/parties/directory?query={optional}&page={int}&pageSize={int}`

- `query` fehlt oder ist leer/Whitespace: alle kanonischen Beteiligten.
- Nicht leerer `query`: trimmen, vorhandene Namensnormalisierung verwenden,
  mindestens 2 und höchstens 200 Zeichen.
- `page`: Standard `1`, mindestens `1`.
- `pageSize`: Standard `10`, Bereich `1..50`.
- Einen Offsetüberlauf vor dem Store-Aufruf sicher als strukturierten
  Validierungsfehler abweisen.
- Antwortfelder: `items`, `totalMatches`, `page`, `pageSize`, `totalPages`.
- `totalPages` ist bei null Treffern `0`, sonst die aufgerundete Seitenzahl.
- Eine Seite außerhalb des vorhandenen Bereichs darf leer antworten und muss
  die korrekten Metadaten behalten; das Frontend normalisiert anschließend.
- Vollständig stabile Sortierung: vorhandener normalisierter Anzeigename,
  danach die kanonische ID als eindeutiger Tie-Breaker.
- Jedes Item enthält ausschließlich den bestehenden `PartySearchItem`-Umfang:
  ID, Beteiligtenart, Anzeigename und optionale aktuelle Hauptanschrift.

Der Endpunkt verwendet dieselbe `PersonUsageRights`-Policy und dieselbe
Capability-Grenze wie die bestehende Beteiligtenlesefunktion. Als GET benötigt
er keinen CSRF-Nachweis, keinen ETag und keinen Audit. Dokumentiere ihn in
OpenAPI einschließlich Validierungsantwort.

Belasse `GET /api/parties?query=...` vollständig kompatibel. Es bleibt die
enge Schnellsuche für den eingebetteten Beteiligten-/Inhaber-Auswahlworkflow.
Ändere weder Pfad noch Array-Antwort noch dessen bestehendes Verhalten.

## Anwendung und Provider

- Ergänze einen klar benannten Page-/Result-Vertrag und eine eigene
  Anwendungsmethode für das Verzeichnis. Vermische die neue Pagination nicht
  mit Mutationen.
- Validiere Filter und Pagination in der Anwendungsschicht, nicht nur im
  Browser oder im Store.
- Der Store-Port soll Gesamtzahl und genau eine angeforderte Seite liefern.
- Im EF-Store müssen Filter, `Count`, stabile Sortierung, `Skip` und `Take`
  vom SQL-Provider ausgeführt werden. Lade keine vollständige Treffermenge,
  keine Revisionen und nicht alle Anschriften. Projiziere nur die Itemfelder
  sowie die Felder der aktuellen Hauptanschrift für die angeforderte Seite.
- Vermeide N+1-Abfragen. Nutze abbrechbare asynchrone EF-Aufrufe und
  `AsNoTracking`.
- Der synthetische Store führt Zählung und stabile Seitenbildung innerhalb
  des vorhandenen gemeinsamen Koordinator-Gates aus.
- Beweise durch Tests stabile Wiederholbarkeit, disjunkte Folgeseiten,
  Gleichstände beim normalisierten Namen, Filterung, leeren Bestand,
  Randseiten und beide Providerverträge.

Es sind keine neue Domainregel, Entität, Tabelle, Spalte, Seed oder Migration
zulässig.

## Frontend

Die Route `/parties` soll den Beteiligtenbestand über den neuen
Verzeichnisendpunkt bedienen:

- initial Seite 1 ohne Namensfilter laden;
- angewendeten `query`, `page` und `pageSize` in den URL-Suchparametern halten;
- einen lokalen Eingabewert erst bei Absenden anwenden; Absenden und
  Filterlöschen setzen auf Seite 1;
- Seitengrößen 10, 25 und 50 anbieten;
- Gesamtzahl und aktuelle Seite verständlich anzeigen;
- barrierearm beschriftete Vor-/Zurück-Schaltflächen mit korrekten
  `disabled`-Zuständen bereitstellen;
- Lade-, Fehler-, leerer Gesamtbestand- und leerer Filterzustand klar
  unterscheiden;
- veraltete Requests mit `AbortController` abbrechen und keine ältere Antwort
  über einen neueren Zustand schreiben lassen;
- wird eine Seite durch Anlage oder Korrektur ungültig, auf die letzte
  vorhandene Seite wechseln; Filter, Auswahl und Detail dürfen dabei nicht
  unkontrolliert verloren gehen;
- Anlage, Dublettenbestätigung, Auswahl, Detail, Namens- und
  Adresskorrekturen, starke ETags und das vorhandene Konflikt-Neuladen
  unverändert funktionsfähig halten;
- nach Anlage und nach sichtbarkeitsrelevanten Korrekturen die Übersicht
  konsistent neu laden.

Du darfst `PartyManagement.tsx` gezielt in kleinere Komponenten refaktorieren,
wenn dadurch Schnellsuche, Verzeichnis und Detailpflege sauber getrennt
werden. Vermeide eine zweite Kopie der Mutationslogik. Der eingebettete
Nutzungsrechtsworkflow muss weiterhin die bisherige Schnellsuche verwenden.
Erhalte responsives Verhalten, Tastaturbedienung, Fokusführung und bestehende
Cemaris-Gestaltung.

## Pflichtprüfungen und Tests

Ergänze mindestens:

- Unit-Tests für Filter-, Seiten- und Überlaufvalidierung sowie Metadaten;
- Store-/Providerparitätstests für Ordnung, Gesamtzahl und Seitenbildung;
- API-Integrationstests für Standardwerte, Filter, Folgeseite,
  Validierungsfehler, Policy/Capability und OpenAPI;
- einen realen SQL-Test, der die EF-Abfrage einschließlich Gleichständen und
  aktueller Hauptanschrift ausführt;
- Frontendtests für Initialbestand, URL-Zustand, Filter, Seitengröße,
  Navigation, leere Zustände, Request-Abbruch, Auswahl und Aktualisierung nach
  Mutation;
- Regressionstests, dass die alte Array-Schnellsuche und die eingebettete
  Inhaberauswahl unverändert bleiben.

Führe zum Abschluss aus:

1. Release-Build von `Cemaris.sln` mit 0 Warnungen und 0 Fehlern;
2. vollständige Unit-Tests;
3. reguläre Integrationstests mit Filter `Category!=SqlServer`;
4. reale SQL-Suite mit Filter `Category=SqlServer`, weil die EF-Abfrage Teil
   des Schnitts ist;
5. `dotnet format --verify-no-changes --no-restore`;
6. im Verzeichnis `src/Cemaris.Web`: `npm ci`;
7. vollständige Frontendtests;
8. Frontend-Lint;
9. Frontend-Produktionsbuild;
10. `git diff --check`;
11. Markdown-Links und -Anker, Tabellen, Whitespace sowie Secretprüfung ohne
    Ausgabe gefundener Werte;
12. vollständige finale Git-Prüfung einschließlich aller unversionierten
    Inhalte.

Für die reale SQL-Suite darf ausschließlich die dafür vorgesehene temporäre
Cemaris-Testdatenbankmechanik verwendet werden. Nutze
`CEMARIS_SQL_TEST_CONNECTION_STRING` nur, wenn die Variable im neuen Prozess
bereits ausdrücklich bereitgestellt wurde oder der Benutzer zuvor den exakten
Testpfad und die Erlaubnis gegeben hat. Lies keine User-Secrets aus und erfinde
keinen Verbindungswert. Fehlt die autorisierte Testverbindung, frage genau
einmal danach und behaupte keinen vollständigen SQL-Abschluss. Prüfe vor und
nach der Suite, dass keine Datenbank mit Präfix
`Cemaris_IntegrationTests_` verblieben ist. Keine bestehende Fach- oder
Entwicklungsdatenbank mutieren.

## Dokumentation und Abschluss

Erstelle mindestens:

- `docs/implementation/cemaris-increment-5i-completion.md` mit
  Rückverfolgbarkeit vom 5h-Befund zu Code und Tests;
- notwendige Aktualisierungen der quellengebundenen Anforderungen und
  Architektur;
- Aktualisierungen von Root-README und allen vier Dokumentationsindizes;
- eine ausführbare kontextlose Folgeübergabe für den danach kleinsten sicheren
  Schritt.

Erstelle kein neues ADR, sofern die Implementierung innerhalb des hier
festgelegten additiven Lesevertrags bleibt. Schreibe ADR-0016 nicht
rückwirkend um.

Weise im Abschluss ausdrücklich nach:

- alte Schnellsuche und Inhaberauswahl kompatibel;
- keine Lebenszyklus-, Fach-, Rollen-, Audit- oder Migrationswirkung ergänzt;
- keine echten Daten oder externen EDWALT-Unterlagen verwendet;
- keine fremde Arbeit und `tmp/pagination-build` nicht verändert;
- SQL-Testdatenbanken vollständig bereinigt;
- kein Commit erstellt und nichts gestagt.

