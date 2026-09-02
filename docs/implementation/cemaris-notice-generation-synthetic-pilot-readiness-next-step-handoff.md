# Folgeauftrag: Technische Readiness und Neubewertung des synthetischen 6c-Piloten

Stand: 01.09.2026

Status: **Am 01.09.2026 vollständig ausgeführt und mit Variante A – Stop
abgeschlossen. Keine Aktivierungsfreigabe.**

Der [Readiness-Abschluss](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
dokumentiert zwei vorab reproduzierte und minimal behobene 6c-Fehler, reale
synthetische LibreOffice-/Druck-zu-Datei- und Temp-/Rückfallläufe, den
read-only bestätigten vollständigen 6b-/6c-Migrationsstand sowie alle offenen
Restnachweise. Insbesondere fehlen Vollbackup/Restore, Monitoring,
installationsbezogene Härtung und zuständige Freigaben. Die Capability bleibt
aus; eine Aktivierungsübergabe wurde nicht erstellt.

Nicht erneut ausführen. Der am 02.09.2026 vorbereitete nächste Schritt ist die
[6c-Betriebsremediation und erneute Pilotneubewertung](cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md).

## Ziel und verbindliches Ergebnis

Dieser Auftrag schließt die noch offenen technischen, betrieblichen und
interaktiven Nachweise für den bereits implementierten, rechtlich
wirkungslosen 6c-Beisetzungsgebührenentwurf in der exakt benannten lokalen
Pilotumgebung. Er prüft und remediert ausschließlich den vorhandenen
6c-Vertrag und bewertet das Pilotgate anschließend neu.

Ausgangsentscheidung bleibt
[Variante A – Stop](cemaris-notice-generation-pilot-release-gate-completion.md).
`Features:NoticeGenerationEnabled` bleibt zu Beginn ausgeschaltet. Erst wenn
wirklich jeder Pflichtnachweis vollständig belegt ist, darf die
[Entscheidungsakte](../requirements/notice-generation-pilot-release-decisions.md)
auf Variante B fortgeschrieben und die separate Datei
`cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
erstellt werden. Diese Aktivierungsübergabe wird in diesem Readiness-Auftrag
nicht ausgeführt.

Fehlt ein Nachweis, scheitert ein Test oder bleibt eine Funktion unklar, ist
Variante A erneut der vollständige Abschluss. Absolute Fehlerfreiheit darf
nicht behauptet werden; verlangt werden reproduzierbare Nachweise, null
fehlgeschlagene Pflichtprüfungen und keine offenen blockierenden Befunde.

## Bestätigter Ausgangsstand

- Pilotumgebung: lokales Development-Repository zusammen mit der eigens dafür
  vorgesehenen Datenbank `Cemaris_Dev`;
- Nutzerkreis: zunächst der Projektleiter, später zusätzlich eine
  Sachbearbeitungsfunktion der Friedhofsverwaltung;
- Datenklasse: ausschließlich synthetische Fall-, Personen-, Kontakt-,
  Satzungs- und Vorlagendaten;
- Pilotende: alle verpflichtenden 6c-Abnahmepunkte erfolgreich, keine offenen
  Blocker, Deaktivierung und Wiederanlauf erfolgreich getestet;
- Pilotvorlage:
  `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`,
  27.321 Byte, SHA-256
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`,
  genau 23 Pflicht-Tokens und keine Empfängeranrede;
- LibreOffice: `26.8.0.3`, Publisher The Document Foundation, gültige
  Authenticode-Signatur, erfolgreicher Konsolenstart mit Exitcode `0`;
- LibreOffice-Programm:
  `C:\Program Files\LibreOffice\program\soffice.exe`;
- LibreOffice-Konsolenstarter:
  `C:\Program Files\LibreOffice\program\soffice.com`;
- erforderliche jüngste additive Migrationen:
  `20260826130629_AddCanonicalManualNoticeDrafts` und
  `20260828062953_AddNoticeGenerationDraftDocuments`;
- portable Capability bleibt `false`; es besteht weder Pilot- noch
  Produktivfreigabe.

Die LibreOffice-Bestandsprüfung ist kein realer Konvertierungs- oder
Ausgabenachweis. Der tatsächliche Migrationsstand von `Cemaris_Dev` wurde
bislang nicht gelesen.

## Verbindliche Arbeitsverzeichnisse und Programme

Repository:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Frontend:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`

Unit-Tests:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests`

Integrationstests:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests`

Ausgewählte Pilotvorlage, read-only:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Api\Templates\Cemaris-Beisetzungsgebuehren-Testvorlage.docx`

Autorisierte synthetische Vergleichsquelle, read-only und nicht als
Pilotvorlage ausgewählt:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx`

Einziger zulässiger .NET-SDK-Pfad:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

LibreOffice-Programm, nur für die ausdrücklich autorisierten synthetischen
Bestands- und Ausgabetests:

`C:\Program Files\LibreOffice\program\soffice.exe`

Temporäre Prüfartefakte dürfen nur unter einer auftragsspezifischen Wurzel
innerhalb von `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp`
entstehen und müssen am Ende vollständig entfernt sein.
`tmp/pagination-build` darf weder geöffnet, aufgelistet noch verändert werden;
vor und nach der Arbeit sind ausschließlich seine Wurzelmetadaten zu
vergleichen.

## Zuerst vollständig zu lesen

1. diese Übergabe;
2. die
   [Pilotgate-Entscheidungsakte](../requirements/notice-generation-pilot-release-decisions.md),
   den [Pilotgate-Abschluss](cemaris-notice-generation-pilot-release-gate-completion.md)
   und die
   [ausgeführte dokumentarische Übergabe](cemaris-notice-generation-pilot-release-gate-next-step-handoff.md);
3. den [technischen 6c-Abschluss](cemaris-increment-6c-completion.md), die
   [technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md) und die
   [6c-Entscheidungsakte](../requirements/notice-generation-decisions.md);
4. [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md),
   die [Dokumentarchitektur](../architecture/document-generation.md) und die
   [Sicherheits-/Rollenarchitektur](../architecture/authentication-authorization-audit.md);
5. [ADR-0017](../decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md),
   den [5k-Abschluss](cemaris-increment-5k-completion.md), den
   [6b-Abschluss](cemaris-increment-6b-completion.md), Root-`README.md`,
   `SECURITY.md` und alle fünf Dokumentationsindizes;
6. die tatsächlichen 6c-Verträge und unmittelbar zugehörigen Unit-,
   Integrations-, SQL-kategorisierten und Frontendtests sowie die portablen
   Konfigurationsdefaults.

Repositoryevidenz ist nicht automatisch Installations- oder Abnahmeevidenz.

## Git- und Erhaltungsregeln

Vor jeder Änderung sind Repositorywurzel, Branch, `HEAD`, Upstream,
Ahead/Behind, vollständiger Arbeitsbaum, Index, unversionierte Inhalte sowie
gestagter und ungestagter Diff zu prüfen. Vorhandene Arbeit kann committed,
gepusht oder uncommittiert sein und muss vollständig erhalten bleiben.

Es gibt keinen Reset, kein Staging und keinen Commit. Keine Datei wird
zurückgesetzt oder überschrieben, nur weil sie bereits geändert ist. Vor
einer Produktänderung muss ein reproduzierbarer Befund den vorhandenen
6c-Vertrag verletzen. Dann ist ausschließlich die kleinste passende
Fehlerkorrektur samt Regressionstest zulässig. Neue Fachlogik, Rechtswirkung,
Dokumentarten, Berechnung oder Integration bleiben ausgeschlossen.

## Ausdrücklich autorisierte technische Prüfungen

Dieser Folgeauftrag darf – anders als das abgeschlossene dokumentarische Gate
– folgende Prüfungen in der benannten lokalen Umgebung ausführen:

1. read-only Installations-, Datei-, Versions-, Signatur-, Schrift-, Prozess-
   und ACL-Inventar für die 6c-Pfade;
2. reale LibreOffice-Konvertierung ausschließlich mit synthetischen Daten und
   der ausgewählten Pilotvorlage in einer kontrollierten Repository-Tempwurzel;
3. read-only Abgleich von Datenbankname, EF-Migrationshistorie und
   erforderlichem 6b-/6c-Schema in `Cemaris_Dev`;
4. kontrollierte additive Anwendung ausschließlich der bereits vorhandenen
   6b-/6c-Migrationen, jedoch erst nach exakt bestätigtem Zielnamen,
   belastbarem Backup-/Restore-Nachweis und erneuter Mutationsvorschau;
5. Builds, Format-, Unit-, Integrations-, Frontend-, Sicherheits- und
   Ausgabetests mit den repositoryeigenen Werkzeugen;
6. lokale API-, Frontend- und Browserprüfung erst nach erfüllten
   Vorbedingungen und nur mit synthetischen Daten;
7. dokumentierte Diagnose und kleinste Korrektur eines reproduzierbaren Bugs
   innerhalb des bereits entschiedenen 6c-Vertrags.

Die bereits konfigurierte maschinenlokale Verbindung darf von den vorgesehenen
Anwendungs-/EF-Pfaden verwendet werden. Secretwerte, User-Secrets-Dateien,
Verbindungszeichenfolgen, Serveranmeldenamen und Passwörter dürfen weder
geöffnet, abgefragt, ausgegeben, kopiert noch dokumentiert werden. Fehlt ein
sicherer bestehender Ausführungspfad, ist anzuhalten und nur die fehlende
Autorisierung oder Konfiguration zu benennen.

Ein Restore darf niemals `Cemaris_Dev` überschreiben. Vor einem realen
Restore-Test muss der Projektleiter einen exakt benannten, entbehrlichen
Restore-Zielnamen bestätigen. Automatisierte SQL-Tests dürfen niemals gegen
`Cemaris_Dev` laufen, sondern nur gegen eine separat autorisierte temporäre
Testdatenbank.

## Weiterhin nicht autorisiert

- persistente Aktivierung von `Features:NoticeGenerationEnabled` vor Variante B;
- Ausführung der späteren Aktivierungsübergabe im selben Auftrag;
- echte Verwaltungs-, Personen-, Fall-, Kontakt-, Satzungs- oder Vorlagendaten;
- Rechtswirkung, Freigabe, Signatur, Zustellung, Archivierung oder Druckversand;
- Winyard-/DMS-, FINANZ+- oder sonstige Integration;
- Empfängeranrede oder automatische Gebühren-, Fälligkeits-, Satzungs- oder
  Rechtsberechnung;
- EDWALT-Ausführung oder Zugriff auf externe EDWALT-, Phase-, Satzungs-,
  Vorlagen-, DMS- oder sonstige Arbeitswurzeln;
- Anzeige oder Änderung von User Secrets;
- Altbestandsmigration, allgemeine Produktivaktivierung oder Server-Cutover.

## Verbindliche Arbeitsfolge

### 1. Bestandsaufnahme

- vollständigen Git-Stand und stabile `tmp/pagination-build`-Wurzelmetadaten
  erfassen;
- alle Pflichtquellen vollständig lesen;
- tatsächliche 6c-Verträge und aktuelle Konfiguration ohne Secretwerte
  abgleichen;
- die offene Nachweismatrix auf den tatsächlichen Stand fortschreiben.

### 2. LibreOffice-, Vorlagen- und Pfad-Readiness

- installierte Version, Signatur, Publisher und absolute Starterpfade erneut
  bestätigen;
- Installerherkunft/Wartungsweg, Dienstkontogrenze, benötigte Schriften und
  Ressourcenlimits funktionsbezogen klären;
- Content-Root, read-only Vorlagenpfad und separaten Tempstamm auf Auflösung,
  ACLs, Verschlüsselung, Quota und Reparse-Point-Schutz prüfen;
- ausgewählte Fixture erneut hashgebunden und nur lesend prüfen;
- reale synthetische DOCX-/PDF-Konvertierung, Öffnung ohne Reparatur,
  DIN-A4-Layout, Textselektion und kontrollierte Druckprüfung nachweisen;
- erzeugte Prüfartefakte anschließend vollständig entfernen.

### 3. Datenbank-Readiness

- tatsächlichen aufgelösten Datenbanknamen read-only als exakt
  `Cemaris_Dev` bestätigen;
- EF-Migrationshistorie und Schema read-only gegen die beiden erforderlichen
  6b-/6c-Migrationen prüfen;
- datierten Backup-/Restore-Nachweis erbringen; vor einem Restore einen
  separaten entbehrlichen Zielnamen ausdrücklich abfragen und bestätigen;
- nur falls Migrationen fehlen und sämtliche Mutationsvorbedingungen erfüllt
  sind: Vorschau dokumentieren, exakt die bestehenden additiven Migrationen
  anwenden, danach Schema und Datenintegrität read-only nachprüfen;
- keine Testfixture darf `Cemaris_Dev` erstellen, leeren, zurücksetzen oder
  löschen.

### 4. Betriebs-, Sicherheits- und Rückfallnachweise

- Monitoring und Alarmierung für Verfügbarkeit, Timeout, Konvertierung und
  Kapazität ohne Inhalts-, Pfad- oder Prozessausgaben prüfen;
- Audit-Whitelist, Zugriff, Integrität, Aufbewahrung und Löschung abgrenzen;
- Abhängigkeiten, Vorlage, Prozessstart, Rechte, CSRF, ETag, Rate-Limit und
  Logging installationsbezogen prüfen;
- Temp-Bereinigung nach Erfolg, Fehler, Timeout, Abbruch und Neustart testen;
- Deaktivierung, Prozessende, Temp-Bereinigung und Wiederanlauf mit weiterhin
  ausgeschalteter Capability nachweisen;
- Abbruchkommunikation für Projektleiter und Sachbearbeitungsfunktion
  dokumentieren.

### 5. Build-, Test- und Fehlerkorrektur

- ausschließlich das festgelegte .NET-SDK verwenden;
- Solution-Build, Formatprüfung, Unit- und Integrationstests ausführen;
- SQL-kategorisierte Tests nur mit einer separat autorisierten temporären
  Verbindung ausführen, niemals gegen `Cemaris_Dev`;
- Frontendtests, Lint und Produktionsbuild ausführen;
- einen reproduzierbaren 6c-Bug zuerst dokumentieren, dann minimal beheben,
  mit Regressionstest absichern und alle betroffenen Prüfungen wiederholen;
- keine Erweiterung aus einem Wunsch oder Pilotbefund ohne eigenen
  abgegrenzten Folgeauftrag implementieren.

### 6. Neubewertung und Dokumentation

Jeden Nachweis mit Datum, stabiler Quellen-ID, übermittelnder und
entscheidungsbefugter Funktion, Geltungsbereich, Entscheidung, Status und
Restunsicherheit dokumentieren. Keine Freigabe erfinden oder aus einer
allgemeinen Projektzuständigkeit ableiten.

Erstelle oder aktualisiere mindestens:

1. `docs/requirements/notice-generation-pilot-release-decisions.md`;
2. `docs/implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md`;
3. den sichtbaren Status dieser Übergabe;
4. Root-README und alle fünf Dokumentationsindizes sowie nur die unmittelbar
   betroffenen Architektur-, Sicherheits- und Migrationsgrenzen.

Nur wenn sämtliche Pflichtnachweise und Abnahmepunkte vollständig bestätigt
sind, darf Variante B gewählt und
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
erstellt werden. Die Capability bleibt auch dann in diesem Auftrag aus. Bei
jedem offenen, teilweisen, widersprüchlichen oder verworfenen Pflichtpunkt
bleibt Variante A bestehen und die Aktivierungsübergabe darf nicht entstehen.

## Abschlussprüfungen

Vor Abschluss sind mindestens auszuführen und ohne sensible Werte zu
dokumentieren:

1. `git diff --check`;
2. alle Git-sichtbaren Markdown-Dateien auf Links/Anker, Tabellen,
   Codeblöcke, Whitespace und finale LF;
3. repositorybasierte Secret-, Verwaltungsdaten- und Fremdbestandsheuristik;
4. vollständiger finaler Git-Stand einschließlich Index und unversionierter
   Inhalte;
5. Hash- und Größenvergleich beider synthetischen DOCX-Dateien;
6. ausschließlich Wurzelmetadatenvergleich von `tmp/pagination-build`;
7. Nachweis, dass temporäre Prüfartefakte vollständig entfernt wurden;
8. Nachweis aller ausgeführten und bewusst nicht ausgeführten Tests;
9. Bestätigung, dass nichts gestagt und kein Commit erstellt wurde.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-notice-generation-synthetic-pilot-readiness-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe den dort definierten technischen
Readiness-, Remediations- und Neubewertungsauftrag für den bereits
implementierten, rechtlich wirkungslosen 6c-Beisetzungsgebührenentwurf
vollständig aus. Beginne mit Variante A und ausgeschalteter Capability.

Erhalte den vollständigen tatsächlichen Git-Stand. Führe keinen Reset durch,
stage nichts und erstelle keinen Commit. Öffne keine Inhalte von
tmp/pagination-build und vergleiche dort nur die Wurzelmetadaten. Verwende für
.NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Die exakt benannte kombinierte Development- und Pilotumgebung ist das lokale
Repository mit der Datenbank Cemaris_Dev. LibreOffice 26.8.0.3 liegt unter:

C:\Program Files\LibreOffice\program\soffice.exe

Die ausgewählte synthetische Pilotvorlage ist ausschließlich read-only:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Api\Templates\Cemaris-Beisetzungsgebuehren-Testvorlage.docx

Dieser Auftrag autorisiert die in der Übergabe abgegrenzten read-only
Datenbankprüfungen, realen synthetischen LibreOffice-/Ausgabetests, Builds,
Tests und kleinsten Korrekturen reproduzierbarer 6c-Bugs. Secretwerte dürfen
weder gelesen noch ausgegeben werden. Ein Restore darf Cemaris_Dev niemals
überschreiben; frage vor einem Restore nach einem exakt benannten
entbehrlichen Ziel. Automatisierte SQL-Tests dürfen niemals gegen Cemaris_Dev
laufen. Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige
Arbeitswurzeln bleiben unberührt.

Schließe zuerst sämtliche technischen, betrieblichen, Sicherheits-,
Vorlagen-, Datenbank-, Ausgabe- und Rückfallnachweise. Aktiviere die Capability
in diesem Auftrag nicht persistent. Wähle Variante B und erstelle die separate
Aktivierungsübergabe nur, wenn jeder Pflichtpunkt vollständig bestätigt ist;
führe diese Übergabe nicht im selben Chat aus. Andernfalls bleibt Variante A
ein vollständiger Abschluss und es entsteht keine Aktivierungsübergabe.

Arbeite bis zum nachgewiesenen Abschluss einschließlich vollständiger Tests,
Quellen-/Nachweismatrix, Abschlussdokumentation, Root-README, aller fünf
Dokumentationsindizes sowie Markdown-, Secret-, Fremdbestands-, tmp- und
Git-Prüfungen. Erfinde keine Fach-, Rechts-, Vorlagen-, Betriebs-,
Zustellungs-, Aufbewahrungs-, Integrations- oder Migrationsregel.
```
