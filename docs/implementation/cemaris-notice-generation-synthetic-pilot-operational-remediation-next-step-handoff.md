# Folgeauftrag: 6c-Betriebsremediation und erneute Pilotneubewertung

Einordnung vom 07.09.2026: Dieser Auftrag und seine Variante A sind historisch.
Für die weitere lokale synthetische Entwicklung gilt die
[neue Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
mit dem [6c-Praxistest als Folgeauftrag](cemaris-notice-generation-prototype-trial-next-step-handoff.md).
Frühere pauschale Freigabevoraussetzungen blockieren diesen neuen Umfang
nicht. Den abgeschlossenen Auftrag und insbesondere Backup/Restore nicht
wiederholen; seine technischen Nachweise bleiben erhalten.

Stand: 02.09.2026

Status: **Am 02.09.2026 vollständig ausgeführt und mit Variante A – Stop
abgeschlossen.** Der
[Betriebsremediations-Abschluss](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
dokumentiert das verifizierte Vollbackup, den ausschließlich auf dem
bestätigten Ziel ausgeführten und inhaltsfrei geprüften Restore, die
Zielbereinigung sowie alle weiterhin offenen Betriebs- und Freigabepunkte.
Die Capability bleibt aus; es besteht keine Aktivierungsübergabe.

Nicht erneut ausführen. Eine spätere Neubewertung benötigt einen neuen,
abgegrenzten Auftrag.

## Ziel und erwartbarer Abschluss

Dieser neue, vom abgeschlossenen Readiness-Auftrag getrennte Schritt schließt
zuerst den konkret autorisierten Vollbackup-/Restore-Nachweis für die lokale
Development- und Pilotdatenbank. Danach prüft er die weiterhin offenen
installationsbezogenen Betriebs-, Sicherheits-, Monitoring-, Audit- und
Freigabepunkte erneut, ohne fehlende Regeln oder Zuständigkeiten zu erfinden.

Der Auftrag ist vollständig abgeschlossen, wenn alle autorisierten Arbeiten,
Prüfungen und Dokumentationen ausgeführt sind und anschließend eine
quellengebundene Variantenentscheidung vorliegt. Ein vollständiger Abschluss
kann erneut **Variante A – Stop** sein. Absolute Fehlerfreiheit oder
Pilotbereitschaft darf nicht aus bestandenen technischen Einzelprüfungen
abgeleitet werden.

Nur wenn wirklich jeder Pflichtpunkt `BESTÄTIGT` ist, darf Variante B gewählt
und die separate Datei
`cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
erstellt werden. Diese Aktivierungsübergabe wird in diesem Auftrag niemals
ausgeführt. Bei jedem offenen, teilweise bestätigten, widersprüchlichen oder
verworfenen Punkt bleibt Variante A bestehen und die Aktivierungsübergabe darf
nicht entstehen.

## Verbindlicher Ausgangsstand

Der
[Readiness-Abschluss](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
hat am 01.09.2026 bereits bestätigt:

- `Cemaris_Dev` ist das tatsächliche Ziel der kombinierten lokalen
  Development- und Pilotumgebung;
- neun Migrationen sind angewandt, die jüngste ist
  `20260828062953_AddNoticeGenerationDraftDocuments`, und es gibt keine
  ausstehende Migration;
- LibreOffice `26.8.0.3`, Schriften, reale rein synthetische DOCX-/PDF- und
  Druck-zu-Datei-Ausgabe sowie Erfolg, Fehler, Timeout, Abbruch,
  Startbereinigung und Rückfall wurden technisch geprüft;
- zwei vor ihrer Änderung reproduzierte 6c-Fehler wurden minimal und mit
  Regressionstests behoben;
- portable Konfigurationen enthalten weiterhin
  `Features:NoticeGenerationEnabled = false`;
- der SQL-Sicherungskatalog enthielt weder ein Vollbackup noch einen Restore;
- Monitoring, installationsbezogene Härtung, Auditbetriebsregeln und
  zuständige Funktionsfreigaben waren offen oder nur teilweise bestätigt.

Diese Befunde werden nicht ohne Anlass neu erfunden oder als ungeprüft
dargestellt. Sie dürfen bei veränderten Dateien, Konfigurationen,
Installationen oder Datenbankmetadaten gezielt erneut geprüft werden.

## Neue autorisierte Quelle und Restore-Grenze

`USR-2026-09-02-6C-RESTORE-01` bestätigt durch den Projektleiter und Betreiber
der benannten lokalen Umgebung:

- exakter entbehrlicher Restore-Zielname:
  `Cemaris_Dev_RestoreCheck_20260902`;
- ein neues datiertes Vollbackup von `Cemaris_Dev` darf im vom SQL Server
  konfigurierten Standard-Sicherungsverzeichnis angelegt werden;
- das Ziel darf ausschließlich für diesen Restore-Nachweis angelegt, nur mit
  inhaltsfreien Struktur-, Integritäts- und Aggregatprüfungen verifiziert und
  anschließend wieder gelöscht werden;
- die erzeugte Vollsicherung bleibt erhalten und wird weder ins Repository
  kopiert noch im Auftrag gelöscht;
- `Cemaris_Dev` selbst darf niemals überschrieben, wiederhergestellt,
  geleert, zurückgesetzt, gelöscht oder von einer Testfixture verwaltet
  werden.

Existiert das bestätigte Ziel zu Beginn bereits, darf es weder übernommen noch
gelöscht werden. Dann ist der Restore blockiert und der tatsächliche Bestand
ist ohne Inhaltsausgabe zu melden. Die Bestätigung macht eine vorgefundene
gleichnamige Datenbank nicht automatisch entbehrlich.

Das Restore-Ziel ist keine autorisierte automatisierte SQL-Testdatenbank.
SQL-kategorisierte Tests dürfen weder gegen `Cemaris_Dev` noch gegen
`Cemaris_Dev_RestoreCheck_20260902` laufen.

## Verbindliche Arbeitsverzeichnisse und Programme

Repository:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Frontend:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`

Unit-Tests:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests`

Integrationstests:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests`

Ausgewählte Pilotvorlage, ausschließlich read-only:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Api\Templates\Cemaris-Beisetzungsgebuehren-Testvorlage.docx`

Autorisierte Vergleichsquelle, ausschließlich read-only:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx`

Einziger zulässiger .NET-SDK-Pfad:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

LibreOffice:

`C:\Program Files\LibreOffice\program\soffice.exe`

`C:\Program Files\LibreOffice\program\soffice.com`

Temporäre Prüfartefakte dürfen nur unter einer auftragsspezifischen Wurzel
innerhalb von `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp`
entstehen und müssen am Ende vollständig entfernt sein.
`tmp/pagination-build` darf weder geöffnet noch aufgelistet werden. Von diesem
Pfad dürfen vor und nach der Arbeit ausschließlich die Metadaten der Wurzel
selbst gelesen und verglichen werden.

## Zuerst vollständig zu lesen

1. diese Übergabe;
2. den
   [Readiness-Abschluss](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
   und die sichtbar als ausgeführt markierte
   [Readiness-Übergabe](cemaris-notice-generation-synthetic-pilot-readiness-next-step-handoff.md);
3. die
   [Pilotfreigabe-Entscheidungsakte](../requirements/notice-generation-pilot-release-decisions.md)
   und den
   [Pilotgate-Abschluss](cemaris-notice-generation-pilot-release-gate-completion.md);
4. den [6c-Abschluss](cemaris-increment-6c-completion.md),
   [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md),
   die [Dokumentarchitektur](../architecture/document-generation.md) und die
   [Sicherheits-/Auditarchitektur](../architecture/authentication-authorization-audit.md);
5. [ADR-0017](../decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md),
   Root-`README.md`, `SECURITY.md` und alle fünf Dokumentationsindizes;
6. die tatsächlichen 6c-Verträge, unmittelbar zugehörigen Tests und
   portablen Konfigurationsdefaults.

Die ausgewählte Pilotvorlage und die Vergleichsquelle werden nicht als
allgemeine Dokumentationsquellen geöffnet, sondern ausschließlich in den
autorisierten hash-, paket-, render- und ausgabebezogenen Prüfungen gelesen.

## Git-, Erhaltungs- und Geheimnisregeln

Vor jeder Änderung sind Repositorywurzel, Branch, `HEAD`, Upstream,
Ahead/Behind, vollständiger Arbeitsbaum, Index, unversionierte Inhalte sowie
gestagter und ungestagter Diff zu prüfen. Der im neuen Chat vorgefundene Stand
ist maßgeblich; frühere Änderungen können inzwischen committed, gepusht oder
weiterhin uncommittiert sein. Sämtliche vorhandene Arbeit bleibt erhalten.

Es gibt keinen Reset, kein Staging und keinen Commit. Geänderte Dateien werden
nicht pauschal ersetzt. Vor jeder Produktcodeänderung muss ein
reproduzierbarer 6c-Bug dokumentiert sein, der den bereits bestätigten Vertrag
verletzt. Zulässig ist dann nur die kleinste Korrektur mit Regressionstest.

Secretwerte, User-Secrets-Dateien, Verbindungszeichenfolgen, Anmeldenamen und
Passwörter dürfen weder geöffnet, ausgegeben, kopiert noch dokumentiert
werden. Die maschinenlokale Verbindung wird ausschließlich über die
vorgesehenen Anwendungs- und EF-Pfade verwendet. Diagnoseausgaben und
Dokumentation enthalten keine Verbindungsdetails, Dokumentinhalte oder
personenbezogenen Daten.

## Verbindliche Arbeitsfolge

### 1. Unveränderten Ausgangsstand bestätigen

- vollständigen tatsächlichen Git-Stand und ausschließlich die
  `tmp/pagination-build`-Wurzelmetadaten aufnehmen;
- Pflichtquellen vollständig lesen und alte, bereits ausgeführte Übergaben
  nicht erneut als aktuellen Auftrag behandeln;
- Capability in allen portablen Konfigurationen als `false` bestätigen und
  während des gesamten Auftrags nicht persistent aktivieren;
- laufende Cemaris-, Diagnose- oder LibreOffice-Prozesse vor mutierenden
  Prüfungen inhaltsfrei erfassen; fremde Prozesse nicht ungefragt beenden;
- Datenbankname und angewandte Migrationen über den vorgesehenen
  Anwendungs-/EF-Pfad zunächst erneut ausschließlich read-only bestätigen.

### 2. Vollbackup sicher erzeugen und verifizieren

- den SQL-Server-Standardpfad für Sicherungen über die bestehende
  Anwendungsverbindung bestimmen, ohne Verbindungs- oder Anmeldedaten
  auszugeben;
- einen kollisionsfreien UTC-datierten Dateinamen verwenden und keine
  vorhandene Sicherungsdatei überschreiben;
- ein vollständiges `COPY_ONLY`-Backup von exakt `Cemaris_Dev` mit Checksum
  erzeugen; Kompression nur verwenden, wenn die tatsächliche SQL-Edition sie
  unterstützt;
- Backupabschluss, Sicherungstyp, Quellname, UTC-Zeit, Checksumstatus und
  sichere Größen-/Metadaten nachweisen, aber keine fachlichen Inhalte
  ausgeben;
- `RESTORE VERIFYONLY` mit Checksum erfolgreich ausführen;
- bei Fehler oder unklarem Ziel sofort abbrechen, Capability aus lassen und
  weder Restore noch Löschung versuchen.

Die Backupdatei ist ein Betriebsartefakt außerhalb des Repositorys. Sie wird
nicht geöffnet, kopiert, gehasht, versioniert oder gelöscht, sofern der
SQL-Server-Nachweis dies nicht ohne Inhaltszugriff selbst bereitstellt.

### 3. Bestätigtes Restore-Ziel kontrolliert verwenden

- vor jeder Restore-Operation read-only bestätigen, dass
  `Cemaris_Dev_RestoreCheck_20260902` nicht existiert;
- logische Daten- und Protokolldateien aus dem Backup nur zur sicheren
  Restore-Planung ermitteln und auf kollisionsfreie Dateien in den vom SQL
  Server vorgesehenen Daten-/Protokollverzeichnissen abbilden;
- ausschließlich nach
  `Cemaris_Dev_RestoreCheck_20260902` mit Checksum und Recovery
  wiederherstellen; niemals `Cemaris_Dev` als Restore-Ziel verwenden;
- auf dem Restore-Ziel ausschließlich read-only beziehungsweise
  integritätsprüfend bestätigen: Onlinezustand, Datenbankname,
  Migrationshistorie, jüngste 6c-Migration, null ausstehende bekannte
  Repositorymigrationen, `DBCC CHECKDB` ohne Fehler sowie inhaltsfreie
  Tabellen-/Aggregatparität zur Sicherungsquelle;
- keine Fachzeilen, Namen, Kontakte, Dokumente, Zugangsdaten oder sonstigen
  Inhalte anzeigen;
- das Ziel nach erfolgreicher oder fehlgeschlagener Prüfung nur dann löschen,
  wenn es nachweislich in diesem Lauf neu erstellt wurde und der exakte Name
  nochmals geprüft ist; nötigenfalls dürfen ausschließlich Verbindungen zu
  diesem Ziel beendet werden;
- danach read-only bestätigen, dass das Restore-Ziel nicht mehr existiert,
  `Cemaris_Dev` weiterhin online ist und dessen Migrations- und
  inhaltsfreie Integritätsmerkmale unverändert sind;
- die verifizierte Vollsicherung nicht löschen.

Automatisierte Testfixtures und SQL-kategorisierte Tests bleiben von beiden
Datenbanken fern. Die Autorisierung des Restore-Ziels ist keine Autorisierung
für Migrationen, Seeds, Schreibtests oder Testframework-Cleanup.

### 4. Verbleibende Betriebs- und Sicherheitsnachweise neu bewerten

- LibreOffice-Version, Signatur, Starter und ausschließlich bekannte
  inhaltsfreie Installationsmetadaten erneut prüfen; Installerherkunft,
  Update- und Wartungsweg nur bei tatsächlich belastbarer lokaler Evidenz als
  bestätigt bewerten;
- kurze kanonische Betriebs- und Temp-Pfade, Reparse-Point-Schutz,
  Vorlagen-read-only-Grenze, tatsächliche Ausführungsidentität,
  Least-Privilege-ACLs, Datenträgerverschlüsselung und Quota read-only prüfen;
- keine Windows-Konten, ACLs, Datenträgerverschlüsselung, Quotas,
  Installationen, Dienste oder systemweiten Einstellungen in diesem
  Repositoryauftrag anlegen oder verändern;
- vorhandene inhaltsfreie Health-, Log-, Fehler- und Ressourcenindikatoren
  sowie tatsächlich konfigurierte externe Überwachung und Alarmierung für
  Verfügbarkeit, Timeout, Konvertierung und Kapazität nachweisen;
- kein Monitoringprodukt, Zielsystem, Alarmempfänger oder Betriebsverfahren
  erfinden und ohne gesonderten Auftrag keine neue Integration implementieren;
- Audit-Whitelist, technischen Schreibzeitpunkt, Betreiberzugriff,
  Integritätsschutz, Aufbewahrung und Löschung quellengebunden bewerten;
- fehlende Fach-, Rechts-/Satzungs-, Finanz-, Vorlagen-, Datenschutz-,
  Betriebs-, Datenbankbetriebs- und Informationssicherheitsfreigaben
  funktionsbezogen offen lassen; Projektzuständigkeit nicht pauschal in diese
  Entscheidungen umdeuten.

Ein Nachweis darf nur `BESTÄTIGT` heißen, wenn die konkrete lokale Umgebung
und die entscheidungsbefugte Funktion belegt sind. Nicht erhöhte Rechte,
fehlende externe Systeme oder allgemeine Absichtserklärungen führen nicht zu
einer positiven Freigabe.

### 5. Gezielte synthetische Rückfall- und Qualitätsprüfung

- nur synthetische Daten verwenden;
- mindestens einen realen DOCX-/LibreOffice-PDF-Lauf an den kurzen
  kontrollierten Prüfpfaden sowie A4, Textselektion, Resttokens und genau eine
  sichtbare Kennzeichnung `RECHTLICH WIRKUNGSLOSER ENTWURF` prüfen;
- Erfolg, stabilen Konvertierungsfehler, Timeout beziehungsweise Abbruch und
  Startbereinigung ohne Restprozess oder `generation-*`-Verzeichnis
  nachweisen;
- die Capability vor und nach den Läufen als persistent ausgeschaltet
  bestätigen;
- temporäre DOCX-, PDF-, Druck- und Bildartefakte vollständig entfernen;
- keine echte Verwaltungs-, Personen-, Kontakt-, Satzungs- oder
  Vorlagendaten verwenden und keinen Papier- oder Netzwerkdruck auslösen.

### 6. Builds und Tests

Mit ausschließlich dem festgelegten .NET-SDK ausführen:

1. Solution-Restore;
2. Formatprüfung ohne automatische Änderung;
3. Release-Solution-Build;
4. vollständige Unit-Tests;
5. Integrationstests ohne Kategorie `SqlServer`;
6. NuGet-Vulnerability-Prüfung.

Im Frontend ausführen:

1. Paketinstallation nur gemäß vorhandenem Lockfile;
2. vollständige Frontendtests;
3. Lint;
4. Produktionsbuild;
5. npm-Audit.

SQL-kategorisierte Tests werden bewusst nicht ausgeführt, solange keine
weitere, ausdrücklich als automatisierte Testdatenbank autorisierte
Verbindung besteht. EDWALT wird nicht ausgeführt; ein Solution-Build darf ein
vorhandenes Projekt lediglich kompilieren.

### 7. Dokumentation und Variantenentscheidung

Erstelle die neue Abschlussakte:

`docs/implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md`

Aktualisiere mindestens:

1. `docs/requirements/notice-generation-pilot-release-decisions.md`;
2. den sichtbaren Status dieser Übergabe;
3. den Readiness-Abschluss um einen klar datierten Folgehinweis, ohne seinen
   historischen Befund umzuschreiben;
4. Root-`README.md`, `SECURITY.md` und alle fünf Dokumentationsindizes;
5. nur tatsächlich betroffene Architektur-, Sicherheits-, Audit- und
   Migrationsgrenzen.

Die Quellen- und Nachweismatrix enthält für jeden Punkt Datum, stabile ID,
Quelle und übermittelnde beziehungsweise prüfende Funktion, Geltungsbereich,
Entscheidung, Status und Restunsicherheit. Sie trennt vorherige Nachweise,
neue technische Evidenz, interaktive Bestätigungen und weiterhin fehlende
Funktionsfreigaben.

Nur bei vollständig bestätigter Gesamtmatrix darf Variante B gewählt und
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
erstellt werden. Die Aktivierung selbst, eine persistente Änderung von
`Features:NoticeGenerationEnabled` und eine Browserabnahme der aktivierten
Capability sind nicht Teil dieses Auftrags. Andernfalls ist Variante A der
vollständige Abschluss und die Aktivierungsdatei bleibt abwesend.

## Weiterhin nicht autorisiert

- persistente Capability-Aktivierung oder Ausführung eines
  Aktivierungsauftrags;
- Restore über `Cemaris_Dev`, Migration, Seed, Testfixture oder Fachmutation
  auf `Cemaris_Dev`;
- automatisierte SQL-Tests gegen Quell- oder Restore-Prüfdatenbank;
- Löschen oder Überschreiben einer vorgefundenen Datenbank oder
  Sicherungsdatei;
- neue Fachlogik, Rechtswirkung, Berechnung, Dokumentart, Empfängeranrede,
  Freigabe, Signatur, Zustellung, Archivierung oder Integration;
- neue Migration außerhalb der vorhandenen additiven 6b-/6c-Migrationen;
- echte Verwaltungsdaten oder Ausgabe von Datenbankinhalten;
- EDWALT-Ausführung oder Zugriff auf externe EDWALT-, Phase-, Satzungs-,
  Vorlagen-, DMS- oder sonstige Arbeitswurzeln;
- systemweite Benutzer-, ACL-, Verschlüsselungs-, Quota-, Dienst-,
  LibreOffice- oder Monitoringänderung;
- Lesen oder Ausgeben von Secrets, User-Secrets-Dateien,
  Verbindungszeichenfolgen, Anmeldenamen oder Passwörtern.

## Abschlussprüfungen

Vor Abschluss sind mindestens nachzuweisen:

1. `git diff --check`;
2. alle Git-sichtbaren Markdown-Dateien auf lokale Links/Anker, Tabellen,
   Codeblöcke, Whitespace und finale LF;
3. Secret-, Verwaltungsdaten- und Fremdbestandsheuristik ausschließlich auf
   Repositoryinhalte und insbesondere hinzugefügte Zeilen;
4. vollständiger finaler Git-Stand einschließlich Index und unversionierter
   Inhalte;
5. Größen- und Hashvergleich beider read-only DOCX-Quellen;
6. unveränderte Wurzelmetadaten von `tmp/pagination-build`, ohne dessen Inhalt
   zu öffnen oder aufzulisten;
7. keine auftragsspezifischen Temp-, Ausgabe- oder Diagnoseartefakte und keine
   zurückgelassenen Hilfs-/LibreOffice-Prozesse;
8. Restore-Prüfziel nachweislich abwesend, verifizierte neue Vollsicherung
   weiterhin vorhanden und `Cemaris_Dev` unverändert online;
9. vollständige Liste aller ausgeführten und bewusst nicht ausgeführten
   Builds, Tests und Betriebsprüfungen;
10. Capability weiterhin persistent `false`, nichts gestagt, kein Commit und
    kein Reset.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe den dort definierten getrennten
6c-Betriebsremediations- und Pilotneubewertungsauftrag für den bereits
implementierten, rechtlich wirkungslosen Beisetzungsgebührenentwurf
vollständig aus. Beginne mit Variante A und ausgeschalteter Capability.

Das vom Projektleiter ausdrücklich bestätigte, entbehrliche Restore-Prüfziel
lautet exakt:

Cemaris_Dev_RestoreCheck_20260902

Erzeuge zuerst ein kollisionsfreies datiertes COPY_ONLY-Vollbackup von
Cemaris_Dev mit Checksum im SQL-Server-Standard-Sicherungsverzeichnis,
verifiziere es, stelle es ausschließlich in dieses zuvor als nicht vorhanden
bestätigte Prüfzieldatenbank wieder her, prüfe dort nur inhaltsfreie Struktur,
Migrationen, Integrität und Aggregate und lösche danach ausschließlich das in
diesem Lauf neu erstellte Prüfziel. Die Sicherung bleibt erhalten.
Cemaris_Dev darf niemals überschrieben, wiederhergestellt, geleert,
zurückgesetzt, gelöscht oder von Testfixtures verwendet werden. Das
Restore-Prüfziel ist nicht für automatisierte SQL-Tests autorisiert.

Verwende für sämtliche .NET-Befehle ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

LibreOffice 26.8.0.3 liegt unter:

C:\Program Files\LibreOffice\program\soffice.exe
C:\Program Files\LibreOffice\program\soffice.com

Frontend:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web

Unit-Tests:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests

Integrationstests:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests

Ausgewählte Pilotvorlage, ausschließlich read-only:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Api\Templates\Cemaris-Beisetzungsgebuehren-Testvorlage.docx

Autorisierte Vergleichsquelle, ausschließlich read-only:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx

Untersuche vor jeder Änderung den vollständigen tatsächlichen Git-Stand und
erhalte sämtliche vorhandene Arbeit. Führe keinen Reset durch, stage nichts
und erstelle keinen Commit. Öffne oder liste keine Inhalte von
tmp/pagination-build; vergleiche dort ausschließlich die Wurzelmetadaten.

Secretwerte, User-Secrets-Dateien, Verbindungszeichenfolgen, Anmeldenamen und
Passwörter dürfen weder gelesen noch ausgegeben werden. Verwende die
maschinenlokale Datenbankverbindung nur über die vorgesehenen Anwendungs- und
EF-Pfade. Automatisierte SQL-Tests dürfen weder gegen Cemaris_Dev noch gegen
das Restore-Prüfziel laufen. Verwende ausschließlich synthetische Daten.

Prüfe nach dem Backup-/Restore-Nachweis die offenen LibreOffice-, Vorlagen-,
Pfad-/ACL-, Schrift-, Temp-, Verschlüsselungs-, Quota-, Monitoring-, Audit-,
Sicherheits-, Ausgabe-, Freigabe- und Rückfallpunkte quellengebunden neu.
Verändere keine systemweiten Konten, ACLs, Verschlüsselung, Quotas, Dienste,
LibreOffice- oder Monitoringinstallationen. Erfinde keine Betriebs-, Fach-,
Rechts-, Vorlagen-, Aufbewahrungs-, Lösch-, Zustellungs-, Integrations- oder
Migrationsregel.

Führe Solution-Restore, Formatprüfung, Release-Build, Unit- und
nicht-SQL-kategorisierte Integrationstests, NuGet-Vulnerability-Prüfung sowie
Frontendinstallation nach Lockfile, Tests, Lint, Produktionsbuild und
npm-Audit aus. Dokumentiere einen reproduzierbaren 6c-Bug vor jeder
Produktcodeänderung und implementiere nur die kleinste passende Korrektur mit
Regressionstest. Implementiere keine neue Fachlogik, Rechtswirkung,
Berechnung, Dokumentart, Integration oder Migration.

Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- und sonstige
Arbeitswurzeln bleiben unberührt. Führe EDWALT nicht aus.

Aktiviere Features:NoticeGenerationEnabled nicht persistent. Wähle Variante B
und erstelle
docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md
nur, wenn wirklich jeder Pflichtnachweis vollständig bestätigt ist. Führe
diese Aktivierungsübergabe nicht im selben Chat aus. Bei jedem offenen,
teilweise bestätigten, widersprüchlichen oder verworfenen Pflichtpunkt bleibt
Variante A bestehen und es entsteht keine Aktivierungsübergabe.

Arbeite bis zum nachgewiesenen Abschluss einschließlich vollständiger
Quellen- und Nachweismatrix, neuer Abschlussdokumentation, Root-README,
SECURITY.md, aller fünf Dokumentationsindizes sowie Markdown-, Secret-,
Fremdbestands-, DOCX-, Temp-, Datenbank- und Git-Prüfungen. Entferne nur das
in diesem Lauf erzeugte Restore-Prüfziel und auftragsspezifische
Temp-Artefakte. Berichte alle ausgeführten und bewusst nicht ausgeführten
Prüfungen sowie sämtliche Restunsicherheiten.
```
