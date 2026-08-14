# Ausführbare Folgeübergabe: Inkrement 5a – Entscheidungsgate für Personen, Rechte und Fristen

Stand: 14.08.2026

> **Ausgeführt:** Das Entscheidungsgate wurde am 14.08.2026 geschlossen.
> Ergebnisse stehen in der
> [5a-Abschlussdokumentation](cemaris-increment-5a-completion.md); der
> bestätigte technische Folgeauftrag ist die
> [5b-Übergabe](cemaris-increment-5b-next-step-handoff.md).

## Auftrag und Stop-Gate

Inkrement 4b ist technisch abgeschlossen. Der fachlich nächste Produktbereich
ist Inkrement 5 mit Personenrollen, Nutzungsrechten, Ruhefristen und
Wiedervorlagen. Der unmittelbar ausführbare nächste Schritt ist jedoch **5a**:
ein fachliches und architektonisches Entscheidungsgate. 5a verändert noch
keinen Produktivcode, kein Schema und kein Laufzeitverhalten.

Die bestehenden lesenden Typen `EntitledPersonDetails`, `AddressDetails` und
`UsageRightDetails` sind ausdrücklich vorläufige MVP-Projektionen. Ihre
Existenz bestätigt weder Identität, Rollen, Kardinalitäten, Historisierung,
Zustände noch Berechnungsregeln für den schreibenden Fachprozess.

5a ist erst abgeschlossen, wenn belastbare Produktentscheidungen einen
kleinen 5b-Ende-zu-Ende-Durchstich erlauben. Solange eine entscheidende Regel
offen ist, werden keine Fristberechnung, automatische Wiedervorlage,
Rollenwirkung, Nutzungsrechtsmutation oder EF-Migration implementiert.

## Arbeitsverzeichnisse und Werkzeuge

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Lokale kommunale Satzungsquelle, ausschließlich lesend:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`

Für .NET ausschließlich verwenden:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Für eine reale SQL-Baseline steht ausschließlich `localhost\CEMARISDEV` zur
Verfügung. Die Verbindung wird nur prozesslokal bereitgestellt und weder in
Logs noch Dokumentation geschrieben. Zulässig sind ausschließlich temporäre,
eindeutig `Cemaris_IntegrationTests_*` benannte Testdatenbanken. Vor jedem
Löschen müssen Präfix und tatsächlich aufgelöster Datenbankname geprüft
werden; vorhandene Benutzer- oder Produktdatenbanken bleiben unverändert.

Keine EDWALT-Originale und keine externen Phase-2-/3-/4-Arbeitsbereiche
öffnen. Keine Phase-5-Wurzel oder andere externe Arbeitsverzeichnisse anlegen.
EDWALT ist kein Sollprozess. Bereits im Repository dokumentierte
EDWALT-Analyseergebnisse dürfen nur als klar gekennzeichnete Altverfahrens-
Evidenz verwendet werden.

## Git-Sicherheit vor jeder Änderung

Vor jeder Änderung vollständig prüfen:

- Branch und HEAD;
- Upstream sowie Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- alle unversionierten Dateien einschließlich ihres Inhalts.

Fremde Arbeit vollständig lesen und erhalten. Nichts überschreiben,
verwerfen, stagen oder committen. In 5a keine Commits ausführen.

## Verbindlich vollständig lesen

Zuerst dieses Dokument vollständig lesen, danach mindestens:

- `README.md`, `SECURITY.md` und `docs/implementation/README.md`;
- `docs/implementation/cemaris-increment-4a-completion.md`;
- `docs/implementation/cemaris-increment-4b-completion.md`;
- `docs/requirements/README.md`;
- `docs/requirements/mvp-read-search-decisions.md`;
- `docs/requirements/case-record-write-decisions.md`;
- `docs/requirements/cemetery-master-data-decisions.md`;
- `docs/requirements/burial-process-decisions.md`;
- `docs/requirements/identity-authorization-audit-decisions.md`;
- `docs/requirements/edwalt-analysis/interview-record.md`;
- `docs/requirements/edwalt-analysis/open-questions-and-interview-guide.md`;
- `docs/requirements/edwalt-analysis/evidence-matrix.md` nur in den für
  Personen, Nutzungsrechte, Ruhefristen und Wiedervorlagen relevanten Teilen;
- `docs/architecture/README.md`;
- `docs/architecture/cemetery-master-data.md`;
- `docs/architecture/burial-process.md`;
- `docs/architecture/authentication-authorization-audit.md`;
- ADR-0007 sowie ADR-0009 bis ADR-0015.

Beide lokalen PDF-Satzungen vollständig und ausschließlich lesend prüfen.
Fundstellen mit Dokument, Paragraph und PDF-Seite dokumentieren. Layout und
Tabellen visuell kontrollieren; reine Textextraktion genügt bei Tabellen nicht.

Vor fachlichen Modellvorschlägen außerdem die vorhandenen lesenden Verträge
und ihre Tests vollständig lesen, insbesondere:

- `src/Cemaris.Application/Cases/CaseReadModels.cs`;
- `src/Cemaris.Application/Cases/CaseReadService.cs`;
- `src/Cemaris.Application/Cases/InMemoryCaseSearch.cs`;
- `src/Cemaris.Infrastructure/ReadModel/SyntheticCaseReadStore.cs`;
- `src/Cemaris.Infrastructure/ReadModel/EfCaseReadStore.cs`;
- `src/Cemaris.Infrastructure/ReadModel/SyntheticReadModelSeeder.cs`;
- `src/Cemaris.Infrastructure/Persistence/ReadModel/ReadModelEntities.cs`;
- `src/Cemaris.Infrastructure/Persistence/CemarisDbContext.cs`;
- Initialmigration, alle Folgemigrationen und Model-Snapshot;
- `src/Cemaris.Api/Contracts/CaseContracts.cs`;
- die betroffenen React-Typen, API-Adapter und Detailseiten;
- die zugehörigen Unit-, API- und realen SQL-Tests.

## Bereits belegte kommunale Evidenz – noch keine allgemeinen Defaults

Die Lesefassung der Doberlug-Kirchhainer Friedhofssatzung von 2023 belegt für
ihren kommunalen Geltungsbereich unter anderem:

- § 10: Ruhezeit von 20 Jahren für Erdbestattungen und 15 Jahren für Aschen;
- § 12: unterschiedliche Nutzungsdauern je Grabstättenart, Entstehung mit
  Nutzungsurkunde, Hinweis drei Monate vor Ablauf sowie Nachfolge- und
  Übertragungsregeln;
- § 14: Nutzungsrecht an Wahlgrabstätten grundsätzlich 30 Jahre,
  Verlängerung nur auf Antrag für die gesamte Grabstätte und Deckung der
  verbleibenden Ruhezeit vor einer weiteren Beisetzung;
- § 26: besondere Behandlung alter Rechte und Begrenzung bestimmter
  unbefristeter Alt-Nutzungsrechte.

Die Gebührensatzung bestätigt Gebührenbezüge zu Erwerb und Verlängerung, ist
aber keine Autorisierung, in 5a oder 5b Gebührenlogik vorzuziehen.

Diese Aussagen sind `SATZUNGSEVIDENZ` für Doberlug-Kirchhain. Vor einer
Produktentscheidung sind insbesondere aktueller Satzungsstand, kommunaler
Geltungsbereich, fachliche Auslegung, tatsächlicher Arbeitsablauf,
Altfallwirkung und Konfigurierbarkeit zu bestätigen. Keine Jahreszahl und
keine lokale Rollen- oder Fristenregel wird als allgemeiner Open-Source-
Standard fest eingebaut.

## In 5a verbindlich zu klärende Entscheidungen

### 1. Personen und fachliche Rollen

- Sind Personen fallgebunden oder fallübergreifend kanonisch, und wie werden
  echte sowie mögliche Dubletten behandelt?
- Welche Personarten und fachlichen Rollen werden benötigt, etwa
  Nutzungsberechtigte, weitere Berechtigte, Ansprechpartner,
  Antragstellende, Rechnungsempfänger oder Rechtsnachfolger?
- Sind Mehrfachrollen zulässig, welche Rolle ist je Vorgang verpflichtend und
  welche Kardinalitäten gelten?
- Welche Namens-, Organisations-, Kontakt- und Adressfelder sind Pflicht;
  wie werden mehrere und historische Anschriften behandelt?
- Welche Rollenänderungen benötigen Gültigkeitszeiträume, Begründung,
  Zustimmung oder ausdrückliche Übertragung?

### 2. Nutzungsrecht

- Besitzt ein Nutzungsrecht eine unveränderliche Identität und genau einen
  kanonischen Grabstellenbezug?
- Welche Nutzungsrechtsarten, Zustände und zulässigen Übergänge existieren?
- Wie entstehen Beginn und Ende bei Erwerb, Beisetzung, Verlängerung,
  Übertragung, Verzicht, Entzug, Schließung und Altfall?
- Gibt es genau einen aktuellen Inhaber oder mehrere gleichzeitige
  Berechtigte; wie wird Rechtsnachfolge historisiert?
- Welche Angaben dürfen korrigiert werden, wann ist statt Korrektur eine neue
  historische Version oder ein eigener Vorgang erforderlich?
- Welche Beziehung besteht zwischen Grabstellenstatus, Beisetzungen,
  Nutzungsrecht und der vorhandenen Soll-Kapazität, ohne unbelegte
  Kapazitätsautomatik einzuführen?

### 3. Satzungsstände und Fristregeln

- Wie werden Kommune, Friedhof, Grabart, Beisetzungsform, Altersgruppe,
  Ereignisart und Gültigkeitszeitraum eines Regelstands modelliert?
- Welches Ereignis startet Ruhe-, Nutzungs- und gegebenenfalls
  Aufbewahrungsfristen?
- Wie werden neue Beisetzungen, Verlängerungen, Übertragungen, Umbettungen,
  Altfälle, unvollständige Daten und spätere Regeländerungen behandelt?
- Werden berechnete Ergebnisse mit angewandtem Regelstand nachvollziehbar
  fixiert oder stets neu berechnet?
- Welche Ergebnisse dürfen manuell korrigiert werden und mit welcher
  Begründung, Rolle, Nebenläufigkeits- und Auditregel?

### 4. Wiedervorlagen

- Welche Ereignisse erzeugen welche Wiedervorlage, zu welchem Zeitpunkt und
  für welche fachliche Rolle?
- Sind Wiedervorlagen zunächst manuell, automatisch oder beides?
- Welche Zustände, Fälligkeit, Erledigung, Wiederöffnung, Zuweisung,
  Sichtbarkeit und Dublettenregeln gelten?
- Erzeugt ein Fristende nur eine Liste/einen Hinweis oder eine Fachmutation?
- Bleiben Gebühren, Schreiben, Versand und Kalenderintegration außerhalb des
  ersten Durchstichs?

### 5. Sicherheit, Datenschutz und Aufbewahrung

- Welche neuen Operationen dürfen `Sachbearbeitung` und `Administration`?
- Welche fachlichen Inhalte dürfen in den sparsamen Änderungsnachweis und
  welche ausdrücklich nicht?
- Welche Lösch-, Sperr-, Anonymisierungs- und Aufbewahrungsgrenzen gelten?
- Welche Lesezugriffe oder besonderen personenbezogenen Felder benötigen
  zusätzliche Beschränkung oder Protokollierung?
- Wer bestätigt Fachmodell, Satzungsauslegung, Datenschutz und späteren
  Betrieb, jeweils mit Geltungsbereich und Stand?

## Arbeitsablauf von 5a

1. Aktuellen Git- und Baseline-Stand reproduzierbar erfassen.
2. Eine Evidenzmatrix erstellen, die `BESTÄTIGT`, `SATZUNGSEVIDENZ`,
   `ALTVERFAHRENS-EVIDENZ`, `ANNAHME`, `OFFEN`, `WIDERSPRUCH` und
   `VERWORFEN` sauber trennt.
3. Vorhandene lesende Placeholder-Felder gegen die Entscheidungsfragen
   abgleichen; nichts allein wegen bestehender Tabellen als fachlich
   bestätigt behandeln.
4. Einen kleinen priorisierten Fragenblock an Projektverantwortung und
   Friedhofsverwaltung formulieren. Wenn Antworten im Chat fehlen, konkret
   nachfragen und den Arbeitslauf dort pausieren; keine Entscheidung raten.
5. Nach bestätigten Antworten ein deutsches Entscheidungsdokument mit
   stabilen REQ-IDs, Quellen, Geltungsbereich, Pflichtfeldern, Kardinalitäten,
   Zuständen, Übergängen, Historien-, Korrektur-, Nebenläufigkeits-,
   Datenschutz- und Akzeptanzregeln erstellen.
6. Mindestens drei vollständig synthetische Durchstichbeispiele beschreiben:
   Normalfall, Alt-/Übertragungsfall und Frist-/Regelstandsgrenzfall.
7. Den kleinsten fachlich nützlichen 5b-Durchstich festlegen. Vorrangig ist
   ein manueller, historisierbarer Personen-/Nutzungsrechtskern zu prüfen;
   automatische Fristberechnung und Wiedervorlagen dürfen nur aufgenommen
   werden, wenn ihre Regeln vollständig geschlossen sind.
8. Architektur-, Migrations-, Test-, OpenAPI-, UI-, Sicherheits- und
   Altkompatibilitätsplan für genau diesen 5b-Zuschnitt erstellen.
9. Eine ausführbare, kontextlose Folgeübergabe für 5b verfassen. Erst sie
   autorisiert einen späteren Implementierungslauf.

`BESTÄTIGT` darf nur eine ausdrücklich belegte Produktentscheidung tragen.
Satzungstext allein bestätigt den lokalen Rechtstext, nicht automatisch seine
Produktabbildung oder allgemeine Nachnutzbarkeit.

## Erwartete Dokumentationsergebnisse

Mindestens erstellen beziehungsweise aktualisieren:

- `docs/requirements/person-usage-rights-deadlines-decisions.md`;
- `docs/architecture/person-usage-rights-deadlines.md`;
- bei tatsächlich getroffener Architekturentscheidung ein neues ADR;
- `docs/implementation/cemaris-increment-5a-completion.md`;
- `docs/implementation/cemaris-increment-5b-next-step-handoff.md`;
- Verzeichnisse und Querverweise in `README.md` sowie den Dokumentations-
  READMEs.

Die 5b-Übergabe muss Arbeitsverzeichnisse, exaktes .NET-Werkzeug,
Pflichtlektüre, betroffene Verträge, Capability und Policies, Atomarität,
Altkompatibilität, Migrationsweg, Tests, reale SQL-Verifikation,
Dokumentation, Nicht-Ziele und Abschlussprüfungen vollständig enthalten.

## Baseline und Abschlussprüfungen für 5a

Vor und nach den Dokumentationsänderungen mindestens:

- Release-Build mit null Warnungen und null Fehlern;
- Unit- und reguläre API-/Integrationstests;
- reale SQL-Suite gegen `CEMARISDEV`, sofern die prozesslokale Verbindung
  verfügbar ist;
- `.NET format`-Prüfung;
- `npm ci`, Frontendtests, Lint und Produktionsbuild;
- Markdown-Link- und Tabellenprüfung;
- Secretprüfung ohne Ausgabe gefundener Werte;
- `git diff --check`;
- vollständige finale Git-Prüfung einschließlich aller unversionierten
  Inhalte;
- Nachweis über `sys.databases`, dass keine temporäre Testdatenbank verblieb.

Da 5a keine Laufzeitänderung autorisiert, ist jede Änderung unter `src/`,
`tests/`, Laufzeitkonfiguration oder Migrationen ein Stop-Signal und muss
unterbleiben.

## Ausdrückliche Nicht-Ziele

- kein Produktivcode, keine EF-Migration und keine neue Capability in 5a;
- keine geratenen Rollen-, Rechtsnachfolge-, Frist- oder Historienregeln;
- keine lokalen Doberlug-Kirchhainer Werte als allgemeine Defaults;
- keine Gebühren, Bescheide, Formulare oder Dokumenterzeugung;
- keine Umbettungs-, Storno-, Entzugs- oder Löschimplementierung;
- keine Winyard-, LDAP-, Kalender- oder Mailintegration;
- kein EDWALT-Importcode oder EDWALT-Zielmapping;
- keine Verarbeitung echter Verwaltungsdaten;
- keine fachliche, datenschutzrechtliche, betriebliche oder produktive
  Freigabebehauptung.

## Abnahmekriterien

5a ist nur abgeschlossen, wenn:

- Quellen, lokale Evidenz, Annahmen und bestätigte Entscheidungen eindeutig
  getrennt sind;
- alle Regeln für den gewählten 5b-Zuschnitt geschlossen und mit stabilen
  REQ-IDs sowie synthetischen Beispielen abnehmbar sind;
- offene Fragen außerhalb von 5b ausdrücklich als Nicht-Ziel erhalten
  bleiben;
- Architektur und Migration die bestehenden nullable Altprojektionen
  weiterhin lesbar halten und keine Historie erfinden;
- die 5b-Übergabe ohne Vorwissen ausführbar ist;
- alle Dokumentations- und Baselineprüfungen grün sind;
- der Arbeitsbaum vollständig geprüft und keine temporäre SQL-Datenbank
  verblieben ist;
- kein Commit ausgeführt wurde.

Wenn die notwendigen fachlichen Antworten nicht vorliegen, ist das kein
Grund, Regeln zu erfinden: Dann endet der Arbeitslauf mit einem präzisen,
priorisierten Entscheidungsblock. Eine Abschlussdokumentation oder 5b-
Implementierungsfreigabe darf in diesem Zustand nicht behauptet werden.
