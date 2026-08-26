# Ausführbare Folgeübergabe: Freigabegate für manuelle Bescheid-/Finanzfakten

Stand: 26.08.2026

## Auftrag und Stop-Gate

Das Gebühren-/Bescheid-Entscheidungsgate 6a ist dokumentarisch mit Variante A
„noch keine Implementierung“ abgeschlossen. Anschließend hat der
Projektauftraggeber mit
`USR-2026-08-26-MANUAL-NOTICE-FACTS-PRIORITY` die Empfehlung bestätigt, als
nächsten Kandidaten ausschließlich **manuelle kanonische
Bescheid-/Finanzfakten** fachlich zu prüfen.

Diese Priorisierung wählt nur den zu prüfenden Kandidaten. Sie ist keine
Fach-, Rechts-, Finanz-, Datenschutz-, Sicherheits-, Betriebs- oder
Produktivfreigabe und noch kein technischer 6b-Auftrag.

Führe als nächsten Schritt ein rein dokumentarisches, interaktives
Entscheidungs- und Freigabegate aus. Kläre anhand vorhandener
Repositoryquellen und ausdrücklich dokumentierter Antworten, ob genau ein
kleiner technischer 6b-Ende-zu-Ende-Schnitt für die manuelle Erfassung
kanonischer Fakten vollständig spezifiziert und durch die jeweils zuständigen
Funktionen getragen ist.

Das Gate ist auch dann vollständig abgeschlossen, wenn notwendige
Entscheidungen oder zuständige Freigaben fehlen. In diesem Fall bleiben die
offenen Punkte gebündelt dokumentiert, Variante A gilt weiter und es wird kein
technischer 6b-Auftrag erstellt. Nur bei vollständig bestätigtem Umfang darf
eine separate, kontextlos ausführbare
`docs/implementation/cemaris-increment-6b-next-step-handoff.md` entstehen.

## Arbeitsverzeichnisse und Werkzeuge

Repository und einziges Verzeichnis für versionierte Änderungen:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Verbindliches .NET-SDK für sämtliche .NET-Befehle:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Lege kein externes Arbeitsverzeichnis an. Vollständig außerhalb des
Arbeitsumfangs bleiben insbesondere:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`;
- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`;
- externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige
  Arbeitswurzeln;
- User Secrets, Datenbanken und laufende Cemaris- oder EDWALT-Prozesse.

Führe EDWALT nicht aus. Öffne keine Datenbankverbindung und lies keine User
Secrets. Starte weder API noch Frontend-Dev-Server oder Browser. Verändere den
ignorierten Fremdbestand `tmp/pagination-build` nicht und verwende ihn nicht
als Arbeitsfläche.

## Ausgangsstand und Erhaltung vorhandener Arbeit

Bei Erstellung dieser Übergabe gilt:

- Branch `main`;
- HEAD `b38c17c5b379499a610b80912ddac1067254fa07`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- die 6a-Dokumentation und diese Folgevorbereitung liegen noch uncommittiert
  vor.

Der neue Chat muss den tatsächlichen Git-Stand vor jeder Änderung vollständig
ermitteln. Die 6a-Arbeit und diese Übergabe können dann committed, gepusht oder
noch uncommittiert vorliegen. Erhalte sämtliche vorhandene Arbeit, führe
keinen Reset durch, stage nichts und erstelle keinen Commit.

Prüfe mindestens Repositorywurzel, Branch, HEAD, Upstream, Ahead/Behind,
Arbeitsbaum, Index, alle unversionierten Inhalte und den vollständigen Diff.
Lies unversionierte inhaltliche Dateien vollständig. Behandle vorhandene
Änderungen als fremde, zu erhaltende Arbeit, sofern ihre Herkunft nicht
eindeutig belegt ist.

## Verbindliche Pflichtquellen

Lies zuerst diese Übergabe vollständig. Lies danach mindestens vollständig:

1. `README.md` und `SECURITY.md`;
2. `docs/implementation/README.md`;
3. `docs/implementation/cemaris-increment-6a-next-step-handoff.md`;
4. `docs/implementation/cemaris-increment-6a-completion.md`;
5. `docs/requirements/README.md`;
6. `docs/requirements/fee-notice-document-decisions.md`;
7. `docs/requirements/mvp-read-search-decisions.md`;
8. `docs/requirements/case-record-write-decisions.md`;
9. `docs/requirements/identity-authorization-audit-decisions.md`;
10. `docs/requirements/person-usage-rights-deadlines-decisions.md`, besonders
    E-15 bis E-18 und 5C-05;
11. `docs/requirements/edwalt-analysis/interview-record.md`, besonders
    INT-008, INT-011 bis INT-016 und INT-030 bis INT-033;
12. `docs/architecture/README.md`;
13. `docs/architecture/authentication-authorization-audit.md`;
14. `docs/architecture/person-usage-rights-deadlines.md`;
15. `docs/architecture/document-generation.md`;
16. `docs/architecture/winyard-integration.md`;
17. ADR-0005, ADR-0006, ADR-0007, ADR-0009 bis ADR-0013, ADR-0016 und
    ADR-0017;
18. `docs/migration/README.md` und
    `docs/migration/edwalt-fee-master-variants-next-step-handoff.md`;
19. alle fünf Dokumentationsindizes unter `docs/requirements`,
    `docs/architecture`, `docs/implementation`, `docs/migration` und
    `docs/decisions`.

Prüfe zusätzlich den vollständigen unmittelbar betroffenen technischen
Vertrag:

- `CaseReadModels.cs`, `CaseReadService.cs` und `InMemoryCaseSearch.cs`;
- `SyntheticCaseReadStore.cs`, `EfCaseReadStore.cs` und
  `SyntheticReadModelSeeder.cs`;
- `ReadModelEntities.cs`, `CemarisDbContext.cs`, sämtliche EF-Migrationen und
  den Model-Snapshot;
- kanonische Beteiligten-/Nutzungsrechtsmodelle, Services und beide Stores;
- `CaseContracts.cs`, `SearchCasesRequest.cs` und die lesenden Fallendpunkte
  in `Program.cs`;
- `cases.ts`, `CaseDetailsPage.tsx`, `SearchPage.tsx` und die
  Beteiligtenoberfläche;
- die unmittelbar zugehörigen Unit-, regulären Integrations-, vorhandenen
  SQL- und Frontendtests.

Repositoryinterne EDWALT-Unterlagen bleiben Altverfahrensevidenz. Öffne keine
externen Originale oder Arbeitskopien und führe keine neue EDWALT-Analyse aus.

## Bereits bestätigte Grenze des Kandidaten

Der bevorzugte Kandidat darf ausschließlich die manuelle Erfassung
kanonischer, quellengebunden freigegebener Bescheid-/Finanzfakten vorbereiten.
Er umfasst ausdrücklich nicht:

- Gebührenkatalog, Gebührenordnung oder Gebührensatzpflege;
- Mengen-, Steuer-, Ermäßigungs-, Befreiungs-, Rundungs- oder
  Summenberechnung;
- automatische Festsetzung oder automatische Fälligkeit;
- Bescheid- oder Dokumenterzeugung, Vorlage, PDF/DOCX oder Winyard-Ablage;
- Zahlung, Zahlungsstatus, Mahnung, Erstattung oder FINANZ+-Schnittstelle;
- EDWALT-Auswertung, Mapping, Backfill oder Migration;
- Rückinterpretation von `ReadNotices`, `ReadFeeItems` oder synthetischen
  Fixtures als kanonisches Schreibmodell;
- Produktivfreigabe oder echte Verwaltungsdaten.

Der bestätigte heutige Prozess belegt nur, dass für die manuelle Buchung im
führenden Finanzverfahren mindestens Zahlungspflichtiger, Bescheidnummer,
Betrag, Fälligkeit und Kostenstelle benötigt werden. Er entscheidet weder
deren Cemaris-Modell noch Rechtswirkung, Kardinalität, Validierung,
Nummerierung, Korrektur oder Freigabe.

## Interaktive Quellen- und Freigaberegel

Stelle fehlende Fragen gezielt und in kleinen, verständlichen Paketen. Jede
Antwort wird mit Datum, Aussage, erklärter Funktion der antwortenden Stelle,
Geltungsbereich und noch fehlenden Mitfreigaben dokumentiert. Eine
Projektpriorisierung darf nicht als Rechts-, Satzungs-, Finanz-, Datenschutz-
oder Sicherheitsfreigabe umgedeutet werden.

Erfinde keine zuständige Stelle. Wenn die antwortende Person eine benötigte
Funktion nicht ausübt oder ihre Entscheidung nicht für diesen Bereich gelten
kann, bleibt die betreffende Frage `OFFEN` oder `TEILWEISE BESTÄTIGT`.
Technische Empfehlungen dürfen als Vorschlag erläutert werden, schließen aber
keine Fachentscheidung.

Verwende folgende Statuswerte:

- `BESTÄTIGT`: konkrete Aussage, zuständige Funktion und Geltungsbereich
  tragen den gesamten benötigten Punkt;
- `TEILWEISE BESTÄTIGT`: ein Bedarf oder Teilaspekt ist belegt, aber eine
  benötigte Entscheidung oder Mitfreigabe fehlt;
- `OFFEN`: keine belastbare Entscheidung;
- `WIDERSPRUCH`: Aussagen oder Quellen widersprechen sich;
- `VERWORFEN`: der Punkt ist zuständig und nachvollziehbar ausgeschlossen.

## Verbindliche Entscheidungsmatrix 6F-01 bis 6F-10

Erstelle für jede Frage Quelle, Aussage, Funktion, Geltungsbereich, Status,
technische Wirkung und Restfrage:

| ID | Zwingend zu klärende Entscheidung | Benötigte Funktion |
| --- | --- | --- |
| 6F-01 | Bestätigung, dass manuelle kanonische Bescheid-/Finanzfakten der erste gewünschte Nutzerfall sind und welches konkrete Problem sie lösen | Projektverantwortung, fachlich verantwortliche Friedhofsverwaltung und Finanzprozessverantwortung |
| 6F-02 | Rechts- und Fachwirkung des Datensatzes, zulässiger erster Zustand sowie eindeutige Abgrenzung zwischen Erfassung, Prüfung und Festsetzung | fachlich verantwortliche Friedhofsverwaltung und Rechts-/Satzungsfreigabe |
| 6F-03 | kanonische Rolle des Zahlungspflichtigen, Bezug zu Beteiligten, zulässige Kardinalität und ausdrückliches Verbot einer Ableitung aus dem Rechteinhaber | Fachverantwortung, Rechtsprüfung und Datenschutz |
| 6F-04 | Erzeuger, Zeitpunkt, manuelle oder automatische Vergabe, Format, Eindeutigkeitsbereich und Konfliktbehandlung der Bescheidnummer | Fach-, Finanzprozess- und Organisationsverantwortung |
| 6F-05 | exakt zulässige manuelle Zahlen- und Datumsfakten einschließlich Betrag, Währung, Fälligkeit und Kostenstelle; Pflicht/Optionalität, Skala und Validierung ohne Berechnung | Fach-, Rechts-/Satzungs- und Finanz-/Haushaltsverantwortung |
| 6F-06 | zulässige Korrektur, Aufhebung, Storno- oder Neuanlagewirkung und unveränderlich zu erhaltende Fachhistorie | Fach-, Rechts- und Finanzverantwortung |
| 6F-07 | operationsgenaue Rechte für Erfassen, Lesen, Prüfen, Freigeben und Korrigieren sowie erforderliche Funktionstrennung | Fach-, Organisations-, Sicherheits- und gegebenenfalls Rechtsverantwortung |
| 6F-08 | kanonische Aggregatgrenze, Fachrevision, Snapshot, starke ETags, Atomarität und datensparsamer technischer Audit | Fachverantwortung sowie Architektur, Sicherheit und Datenschutz |
| 6F-09 | Systemhoheit gegenüber FINANZ+, zulässige manuelle Übertragungsdaten und Verhalten ohne Zahlungsstatus-/Mahnungsrückkanal | Fach- und Finanzprozessverantwortung sowie Architektur und Datenschutz |
| 6F-10 | additive Kompatibilität zur Leseprojektion, Ausschluss von Backfill/EDWALT-Migration, Pilot-/Testdaten- und Abnahmegrenze | Projekt-, Fach-, Migrations-, Datenschutz-, Sicherheits- und Betriebsverantwortung |

Eine globale Kandidatenpriorisierung allein schließt 6F-01 nicht vollständig,
wenn fachliche Friedhofsverwaltung oder Finanzprozessverantwortung den Nutzen
nicht bestätigt haben.

## Varianten- und Stop-Entscheidung

Vergleiche nach der Erhebung genau:

- **Variante A:** keine technische Implementierung; offene Entscheidungen und
  Freigaben gebündelt festhalten;
- **Variante B:** genau ein vollständig freigegebener manueller kanonischer
  Faktenkern;
- **Variante C:** breiterer Katalog-, Berechnungs-, Dokument-, Integrations-
  oder Migrationsumfang; für dieses Gate zwingend verwerfen.

Variante B darf nur gewählt werden, wenn alle für den tatsächlich geplanten
Schnitt benötigten Teile von 6F-01 bis 6F-10 `BESTÄTIGT` sind. Ein kleinerer
Schnitt darf einzelne Themen nur dann ausklammern, wenn diese nachweisbar
nicht benötigt und ohne implizite Fachannahme technisch vollständig
abtrennbar sind.

Bei `OFFEN`, `TEILWEISE BESTÄTIGT` oder `WIDERSPRUCH` in einer notwendigen
Frage ist Variante A der vollständige Gate-Abschluss. Formuliere dann keine
Defaults und keinen scheinbar ausführbaren technischen Auftrag.

## Verbindliche Dokumentationsergebnisse

Erstelle in jedem Fall:

1. `docs/requirements/manual-notice-financial-facts-decisions.md` mit
   Quellenmatrix, vollständiger 6F-Matrix, Variantenvergleich und Entscheidung;
2. `docs/implementation/cemaris-manual-notice-facts-approval-completion.md` mit
   Ausgangsstand, Quellenarbeit, Antworten/Funktionen, Entscheidung,
   Schutzgrenzen, Prüfungen und finalem Git-Nachweis;
3. einen sichtbaren Ausführungsstatus in dieser Übergabe;
4. konsistente Aktualisierungen von Root-README und allen fünf
   Dokumentationsindizes;
5. Aktualisierungen unmittelbar betroffener Anforderungs-, Rollen-, Audit-,
   Architektur- und Migrationsdokumente, ohne historische ADRs umzuschreiben.

Nur bei vollständig freigegebener Variante B zusätzlich:

6. `docs/implementation/cemaris-increment-6b-next-step-handoff.md` als
   separaten, kontextlos ausführbaren technischen Ende-zu-Ende-Auftrag.

Der technische 6b-Auftrag muss alle bestätigten Felder, Zustände,
Operationen, Rollen, ETags, Revisionen, Auditdaten, Providergrenzen,
Migrationen, API-/UI-Verträge, Kompatibilitätsregeln, synthetischen Fixtures,
Tests, Dokumentationsänderungen und Stop-Gates ausdrücklich enthalten. Er
darf keine offene Entscheidung durch einen technischen Default ersetzen.

Erstelle kein neues ADR, sofern das Gate keine tatsächlich neue und
vollständig freigegebene Architekturentscheidung trifft. Bestehende ADRs
werden nicht rückwirkend geändert.

## Datenschutz- und Sicherheitsgrenzen

- Verwende nur Repositoryquellen und ausdrücklich dokumentierte Antworten.
- Übernimm keine realen Gebührenbezeichnungen, Beträge, Personen-, Adress-,
  Bescheid-, Kontierungs- oder sonstigen Verwaltungswerte.
- Beispiele sind nur zulässig, wenn sie eindeutig synthetisch sind und für die
  Entscheidung tatsächlich benötigt werden.
- Gib keine Secrets, Verbindungswerte, lokalen Verwaltungsdaten oder
  repositoryfremden Inhalte aus.
- Leite Zahlungspflicht niemals aus Nutzungsrechtsinhaberschaft ab.
- Behandle den bestehenden Lesevertrag nicht als Schreib- oder
  Migrationsmodell.
- Der EDWALT-Gebühren-/Variantenauftrag bleibt pausiert.

## Abschlussprüfungen

Obwohl das Gate dokumentarisch ist, führe den vollständigen sicheren
Repositorynachweis aus:

1. Release-Build `Cemaris.sln` mit dem verbindlichen SDK, 0 Warnungen und
   0 Fehler;
2. vollständige Unit-Tests;
3. reguläre Integrationstests mit `Category!=SqlServer`;
4. `dotnet format Cemaris.sln --verify-no-changes --no-restore`;
5. `npm ci`, vollständige Frontendtests, Lint und Produktionsbuild;
6. keine SQL-Kategorie und keine Datenbankverbindung;
7. kein API-/Frontend-Dev-Server und kein Browser;
8. `git diff --check`, lokale Markdown-Links und -Anker, Tabellen und
   Whitespace;
9. repositorybasierte Secret- und Verwaltungsdatenprüfung ohne Zugriff auf
   User Secrets und ohne Ausgabe gefundener Werte;
10. vollständige finale Git-Prüfung einschließlich aller unversionierten
    Inhalte;
11. Metadatenvergleich für `tmp/pagination-build`;
12. Bestätigung, dass `Cemaris_Dev`, externe Verzeichnisse und EDWALT-Bestände
    unverändert blieben;
13. Bestätigung, dass nichts gestagt und kein Commit erstellt wurde.

## Direkt kopierbarer Prompt

```text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe anschließend das dort definierte
interaktive Freigabegate für manuelle kanonische Bescheid-/Finanzfakten
vollständig Ende zu Ende aus. Stelle fehlende Entscheidungsfragen gezielt,
dokumentiere Antworten mit Funktion und Geltungsbereich und behandle eine
Projektpriorisierung niemals als Fach-, Rechts-, Finanz-, Datenschutz-,
Sicherheits- oder Betriebsfreigabe.

Untersuche vor Änderungen den vollständigen Git-Stand und erhalte sämtliche
vorhandene Arbeit. Die 6a-Dokumentation und diese Folgeübergabe können
committed, gepusht oder noch uncommittiert vorliegen. Führe keinen Reset durch
und verändere tmp/pagination-build nicht.

Repository und einziges Verzeichnis für versionierte Änderungen:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Verwende für .NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus. Öffne keine Datenbankverbindung und lies keine User Secrets.
Starte weder API noch Frontend-Dev-Server oder Browser. Der
EDWALT-Gebührenauftrag bleibt pausiert.

Vollständig außerhalb des Arbeitsumfangs bleiben insbesondere:

C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration
C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825

Bewerte ReadNotices, ReadFeeItems, nullable Felder und synthetische Fixtures
nicht als freigegebenes Schreibmodell. Erfinde keine Zahlungspflichtigen-,
Nummerierungs-, Betrags-, Währungs-, Fälligkeits-, Kontierungs-, Korrektur-,
Storno-, Rollen-, Historien-, Audit-, Dokument-, Integrations- oder
Migrationsregel.

Schließe das Gate auch bei fehlenden Entscheidungen vollständig ab. Wähle dann
Variante A, dokumentiere die gebündelten fehlenden Entscheidungen und erstelle
keinen technischen 6b-Auftrag. Erstelle
docs/implementation/cemaris-increment-6b-next-step-handoff.md nur, wenn genau
ein manueller kanonischer Faktenkern vollständig durch die jeweils zuständigen
Funktionen freigegeben ist.

Arbeite bis zum vollständigen nachgewiesenen Abschluss einschließlich
Quellenmatrix, 6F-01 bis 6F-10, Variantenvergleich, Entscheidung,
Abschlussdokumentation, Dokumentationsindizes und aller in der Übergabe
geforderten Prüfungen.

Führe keinen Commit durch und stage keine Dateien.
```
