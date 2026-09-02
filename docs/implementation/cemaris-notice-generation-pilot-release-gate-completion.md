# Abschluss des Betriebs- und Pilotfreigabegates der 6c-Dokumenterzeugung

Stand: 01.09.2026

Status: **Vollständig dokumentarisch abgeschlossen mit Variante A – Stop.**
`Features:NoticeGenerationEnabled` bleibt deaktiviert. Es wurde kein
Aktivierungs- oder Pilotabnahmeauftrag erstellt.

Der nachfolgende Readiness-Auftrag ist inzwischen ebenfalls mit Variante A
abgeschlossen. Der aktuelle, noch nicht ausgeführte Folgepfad ist die
[6c-Betriebsremediation und erneute Pilotneubewertung](cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md).

## Ergebnis

Das verbindliche
[Betriebs- und Pilotfreigabegate](cemaris-notice-generation-pilot-release-gate-next-step-handoff.md)
wurde für den technisch implementierten, rechtlich wirkungslosen
6c-Beisetzungsgebührenentwurf ausgeführt. Die vollständige Quellen- und
Nachweismatrix steht in der
[Pilotfreigabe-Entscheidungsakte](../requirements/notice-generation-pilot-release-decisions.md).

Der Projektleiter hat das aktuelle Development-Repository zusammen mit
`Cemaris_Dev` als gewünschte Testpilotumgebung benannt und anschließend
klargestellt, dass die Datenbank eigens für diese kombinierte Development- und
Testpilotumgebung geschaffen wurde. Die vorhandenen 5k-Quellen bestätigen den
isolierten lokalen Development-Testbetrieb. Die frühere Einstufung als
Datenbankwiderspruch ist damit korrigiert. Belastbare installationsbezogene
Nachweise fehlen weiterhin unter anderem für den aktuellen 6c-Migrationsstand,
den datierten Restore-Test, Serverpfade und Rechte, Schriften, die fachlich-
rechtliche Freigabe der ausgewählten Pilotfixture, Ausgabequalität,
Temp-Schutz, Monitoring, Auditaufbewahrung, Sicherheitsfreigabe und
Rückfalltest. LibreOffice ist seit dem 01.09.2026 installiert und startfähig;
Installerherkunft, Wartungsweg, Dienstkonto, Schriften, Ressourcenlimits und
reale Ausgabeabnahme bleiben offen. Variante A ist deshalb weiterhin der
vollständige Gateabschluss.

## Ausgangsstand

Vor der ersten Änderung und erneut nach dem interaktiven Dialog wurde der
vollständige tatsächliche Git-Stand geprüft:

- Repository
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- `HEAD` `90abc743f7bbce06574c45a2b5f3a277be843e1c`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- sauberer Arbeitsbaum, leerer Index und keine unversionierten Inhalte;
- vollständiger gestagter und ungestagter Diff leer.

Es gab keinen Reset, kein Staging und keinen Commit. Vorhandene Arbeit musste
nicht überlagert werden, weil der Ausgangsstand sauber war.

## Ausgeschöpfte Repositoryquellen

Vollständig gelesen wurden die verbindliche Übergabe, Root-README,
`SECURITY.md`, alle fünf Dokumentationsindizes, der 6c-Abschluss, die
technische 6c-Übergabe, die 6c-Entscheidungsakte, der frühere Gateabschluss,
ADR-0018, ADR-0019, Dokumentarchitektur und Sicherheits-/Rollenarchitektur.
Für die Datenbankkorrektur wurden außerdem ADR-0017, der vollständige
5k-Abschluss und die einschlägigen Identitäts-/Development-Entscheidungen
erneut geprüft.

Bestandsgeprüft wurden außerdem die tatsächlichen Verträge für:

- Benutzerkontakte und deren zentrale Validation;
- unveränderliche Satzungsversionen, Aktivstatus, ETag und Audit;
- 23 Pflichtplatzhalter und kanonische Quellen;
- OpenXML-Paket-, Inhalts-, Token- und Ausgabegrenzen;
- direkte LibreOffice-Prozesskapselung, Timeout, Parallelität und
  Prozessbaumabbruch;
- isolierte Temp-Verzeichnisse, `finally`- und Startbereinigung;
- inhaltsfreien Erfolgs-/Fehleraudit vor erfolgreicher Ausgabe;
- Capability-Abhängigkeiten, Development-Sperre, Policies, CSRF, ETag,
  Rate-Limit, API/OpenAPI und HTTP-Header;
- React-Capability-/Rollenanzeige, Auswahlpflichten, Rechtswarnung,
  Download und Blob-Bereinigung;
- Synthetic-/EF-Provider, additive Migration und direkt zugehörige Unit-,
  Integrations-, SQL-kategorisierte und Frontendtests;
- portable Defaults in `appsettings.json` und
  `appsettings.Development.json`.

Die Repositoryevidenz bestätigt die technische 6c-Implementierung und den
sicheren Default `false`. Sie wurde nicht als Nachweis einer konkreten
Installation oder als Pilotabnahme umgedeutet.

## Synthetische Testquelle

Die autorisierte Quelle
`tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` wurde nur lesend
als OOXML-Paket geprüft. Sie besitzt unverändert 31.642 Byte und SHA-256
`71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`,
19 Paketeinträge und 24 eindeutige Tokens jeweils genau einmal. Es wurden
keine aktiven Einträge oder externen Beziehungen gefunden.

Die versionierte Test-Fixture besitzt 23 eindeutige Pflicht-Tokens jeweils
genau einmal, keinen `EMPFAENGER_ANREDE`-Token und ebenfalls keine aktiven
Einträge oder externen Beziehungen. Die autorisierte Quelle wurde nicht
überschrieben.

## Interaktiver Dialog

Nach Ausschöpfung der Repositoryquellen wurde genau ein kleines
Nachweispaket zu Pilotumgebung, synthetischer Datenfreigabe und ausdrücklich
autorisierter Pilotdatenbank abgefragt. Zu diesem Paket liegen inzwischen sieben
aufeinander aufbauende Antworten vor.

Die Antwort vom 31.08.2026 erhielt die stabile Quellen-ID
`USR-2026-08-31-6C-PILOT-01`. Übermittelnde Funktion war der
Projektverantwortliche/Projektleiter. Er erklärte, das Development-Repository
und `Cemaris_Dev` sollten für den Testpiloten verwendet werden; ein Servertest
mit einer anderen Microsoft-SQL-Server-Datenbank solle später folgen. Er
übermittelte außerdem, alle Datenschutz- und Fachverantwortlichen hätten den
Plan mit ihm abgestimmt.

Die Aussage wurde mit Funktion, Geltungsbereich, Entscheidung,
Nachweisstatus und Restunsicherheit dokumentiert. Die einzelnen Fach- und
Datenschutzentscheidungen waren nicht getrennt belegt. Rechts-/Satzungs-,
Finanz-, Informationssicherheits-, Betriebs- und Datenbankbetriebsfunktionen
sowie deren Nachweise wurden nicht benannt.

Mit der ergänzenden Antwort `USR-2026-08-31-6C-PILOT-02` stellte der
Projektleiter am 31.08.2026 klar, dass `Cemaris_Dev` eigens für den Testpiloten
geschaffen wurde und Pilot- und Development-Umgebung identisch sind. Diese
Aussage korrigiert den zuvor dokumentierten Datenbankwiderspruch und wird
durch ADR-0017 sowie den 5k-Abschluss für den isolierten lokalen
Development-Testbetrieb gestützt. Aktueller 6c-Migrationsstand,
Backup/Restore, Datenbankbetriebsfreigabe und die übrigen Pflichtnachweise
bleiben offen oder nur teilweise bestätigt. Deshalb greift die Stop-Regel
weiterhin; weitere Nachweispakete waren für die Variantenentscheidung nicht
erforderlich.

Mit `USR-2026-08-31-6C-PILOT-03` bestätigte der Projektleiter ein getestetes
Backup-/Restore-Verfahren und benannte als Nutzerkreis zunächst nur sich
selbst, später zusätzlich eine Sachbearbeitungsfunktion der
Friedhofsverwaltung. Den aktuellen Migrationsstand vermutete er und bat
andernfalls um Prüfung. Die repositorybasierte Prüfung identifizierte
`20260826130629_AddCanonicalManualNoticeDrafts` und
`20260828062953_AddNoticeGenerationDraftDocuments` als erforderliche 6b-/6c-
Migrationen. Ihre tatsächliche Anwendung auf `Cemaris_Dev` bleibt ungeprüft,
weil weder die Datenbank noch User Secrets geöffnet wurden. Für das bestätigte
Backup-/Restore-Verfahren fehlten zu diesem Zeitpunkt Testdatum,
Ergebnisprotokoll und verantwortliche Betriebs-/Datenbankfunktion.

Mit `USR-2026-08-31-6C-PILOT-04` bestätigte der Projektleiter seine eigene
Betriebsverantwortung für das Projekt, das getestete Backup-/Restore-Verfahren
und ausschließlich synthetische Pilotdaten. Der Pilot soll zunächst durch ihn
und später gemeinsam mit einer Sachbearbeitungsfunktion der
Friedhofsverwaltung erfolgen. Befunde sollen dokumentiert, in getrennten
Aufträgen implementiert und anschließend erneut getestet werden, bis Cemaris
reibungslos läuft. Die Ablaufentscheidung ist dokumentiert, ersetzt aber
weder messbare Akzeptanz- und Abbruchkriterien noch einen Nachweis des
Backup-/Restore-Tests oder des tatsächlichen 6b-/6c-Migrationsstands. Sie ist
keine pauschale Autorisierung künftiger Produktänderungen.

Mit `USR-2026-08-31-6C-PILOT-05` bestätigte der Projektleiter das vorgeschlagene
bedingungsgebundene Pilotende: alle verpflichtenden 6c-Abnahmepunkte
erfolgreich, keine blockierenden Fehler offen sowie Deaktivierung und
Wiederanlauf erfolgreich getestet. Damit ist das Endkriterium messbar
entschieden. Für Backup/Restore versicherte er die Funktionsfähigkeit über
SSMS, konnte aber kein Datum nennen. Ohne datierten Sicherungsstand und
Protokoll eines erfolgreichen Restore-Tests bleibt dieser Nachweis teilweise
bestätigt.

Mit `USR-2026-08-31-6C-PILOT-06` bestätigte der Projektleiter, dass auf dem
Pilot-PC nur Microsoft Office und kein LibreOffice installiert ist. Damit ist
der vom 6c-Code ausschließlich unterstützte LibreOffice-Headless-PDF-Pfad in
der benannten Umgebung nicht betriebsfähig. Microsoft Office wurde nicht als
nicht implementierter Ersatz gewertet. Zugleich wählte der Projektleiter die
versionierte 23-Token-Fixture
`src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx` als
synthetische Pilotvorlage. Ihr OOXML-Bestand war zuvor nur lesend geprüft
worden; die Datei wurde nicht verändert. Die zu diesem Zeitpunkt fehlende
LibreOffice-Installation trug die Variante A bereits selbständig; eine
Aktivierungsübergabe blieb ausgeschlossen.

Mit `USR-2026-09-01-6C-PILOT-07` meldete der Projektleiter die nachträgliche
LibreOffice-Installation und beauftragte ihre Bestandsprüfung. Die technische
Quelle `ENV-2026-09-01-6C-LO-01` bestätigt LibreOffice `26.8.0.3`, Publisher
The Document Foundation, gültige Authenticode-Signaturen und den absoluten
Programmpfad `C:\Program Files\LibreOffice\program`. Der Konsolenstarter
`soffice.com --headless --version` meldete Version und Build-ID erfolgreich
mit Exitcode `0`; vor und nach dem Lauf bestanden keine LibreOffice-Prozesse.
Es wurde kein Dokument geöffnet oder konvertiert. Der frühere
Nichtinstallationsbefund ist damit überholt, die übrigen LibreOffice- und
Ausgabenachweise bleiben offen.

## Entscheidung und Schutzgrenzen

**Variante A – Stop wurde ausgewählt.** Die Capability bleibt in jeder
vorhandenen Installation aus. Insbesondere wurden nicht ausgeführt oder
eingeführt:

- Capability-Aktivierung oder Konfigurationsänderung;
- Zugriff auf oder Änderung von `Cemaris_Dev`;
- Schema-, Migrations-, Daten- oder Backup-/Restore-Operation;
- Rechtswirkung, Freigabe, Signatur, Zustellung oder Archivierung;
- Winyard-/DMS- oder FINANZ+-Integration;
- Empfängeranrede oder automatische Gebühren-, Fälligkeits-, Satzungs- oder
  Rechtsberechnung;
- Altbestandsmigration oder allgemeine Produktivaktivierung.

Die Übergabe
`cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
wurde folgerichtig nicht erstellt.

## Technische Bestandsprüfung und nicht ausgeführte Abnahmen

Das Gate blieb ohne Produkt-, Konfigurations- oder Installationsänderung;
Produktcode und 6c-Verträge wurden nicht verändert. Ausschließlich die
LibreOffice-Installation, Signatur, Version und Startfähigkeit wurden am
01.09.2026 read-only geprüft. Die im 6c-Abschluss dokumentierten Builds und
Tests wurden nicht erneut als Pilotabnahme ausgegeben. Nicht ausgeführt wurden
insbesondere:

- .NET-, npm-, Build-, Unit-, Integrations- oder Frontendläufe;
- SQL-Tests, Datenbankzugriff und reale additive Migration;
- reale LibreOffice-Dokumentkonvertierung, Word-, PDF-, visuelle oder lokale
  Druckabnahme;
- API-, Frontend-Dev-Server-, Browser- oder Anwendungsstart.

## Dokumentationsumfang

Geändert oder ergänzt wurden ausschließlich zulässige Repositorydokumente:

- diese Abschlussdokumentation und die Pilotfreigabe-Entscheidungsakte;
- die separate, noch nicht ausgeführte Readiness- und Neubewertungsübergabe;
- sichtbarer Ausführungsstatus der Pilotgate-Übergabe;
- Root-README und alle fünf Dokumentationsindizes;
- unmittelbar betroffene Dokument-, Sicherheits-/Rollen- und
  Migrationsgrenzen.

ADR-0019 wurde nicht rückwirkend geändert. Ein neues ADR war nicht
erforderlich, weil das Gate keine neue Architekturentscheidung freigab.

## Verbindlicher nächster Schritt

Der nächste zulässige Schritt ist ausschließlich die vorbereitete
[technische Pilot-Readiness und Neubewertung](cemaris-notice-generation-synthetic-pilot-readiness-next-step-handoff.md).
Sie darf die ausdrücklich abgegrenzten Datenbank-, LibreOffice-, Ausgabe-,
Build- und Testnachweise ausführen und reproduzierbare 6c-Bugs minimal
korrigieren. Sie beginnt weiterhin mit Variante A und ausgeschalteter
Capability. Die separate Aktivierungsübergabe darf erst bei vollständig
belegter Variante B entstehen und wird nicht im Readiness-Auftrag ausgeführt.

## Abschlussprüfungen

Die Abschlussprüfungen ergaben:

- `git diff --check` war ohne Befund;
- alle 114 Git-sichtbaren Markdown-Dateien einschließlich der drei neuen
  Dokumente enden mit LF und sind ohne nachgestellten Whitespace, offenen
  Codeblock, uneinheitliche Tabellenspalten oder fehlendes lokales
  Link-/Ankerziel; erfasst wurden 585 Markdown-Links, 203 Tabellen und 45
  Codeblöcke;
- unter 373 Git-sichtbaren Pfaden wurden 366 Textpfade heuristisch geprüft.
  Es gab keinen Private-Key-Header, hochkonfidentiellen Anbieter-Token, JWT,
  Bearer-Zugangswert, nicht reservierte E-Mail-Adresse oder deutsche IBAN.
  Die breitere Zugangswertheuristik traf 35 syntaktische Passwort-/Tokenfeld-
  Zuordnungen in zwölf unveränderten Konfigurations-, Produkt- und Testdateien;
  keiner dieser Treffer liegt in einer geänderten oder neuen Datei;
- alle 13 geänderten oder neuen Pfade sind Markdown-Dateien. Es wurde kein
  Office-, PDF-, Archiv-, Datenbank-, Daten-, Log- oder Bildfremdbestand
  geändert oder ergänzt;
- die autorisierte synthetische DOCX-Quelle besitzt weiterhin 31.642 Byte und
  SHA-256
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`;
  das versionierte Fixture besitzt weiterhin 27.321 Byte und SHA-256
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`;
- von `tmp/pagination-build` wurden vor und nach der Arbeit ausschließlich die
  Wurzelmetadaten gelesen. Verzeichnisattribut, Erstellungszeit
  `2026-08-14T10:27:21.4014388Z` und Schreibzeit
  `2026-08-14T10:27:21.4062644Z` blieben gleich; Inhalte wurden weder geöffnet
  noch aufgelistet oder verändert.

## Finaler Git- und Erhaltungsnachweis

Der finale Stand bleibt auf Branch `main` und `HEAD`
`90abc743f7bbce06574c45a2b5f3a277be843e1c`; Upstream ist `origin/main` mit
Ahead/Behind `0/0`. Der Index ist leer. Ungestaged sind ausschließlich zehn
geänderte Dokumentationsdateien; hinzu kommen genau die drei neuen,
unversionierten Markdown-Dokumente dieses Gates. Produktcode, Schema,
Migration, Konfiguration, Vorlage, API und UI weisen keine Änderung auf.

Es gab keinen Reset, kein Staging und keinen Commit. Die separate
Aktivierungsübergabe existiert nicht. Externe Arbeitswurzeln, EDWALT, User
Secrets, `Cemaris_Dev`, API, Frontend-Dev-Server, Browser und Datenbank blieben
während des gesamten Gates unberührt. Außerhalb des Repositories wurden nur
die autorisierten LibreOffice-Programmdateien für Metadaten, Signatur, Hash
und den erfolgreichen `--headless --version`-Lauf gelesen beziehungsweise
gestartet; Installation und Dateien wurden nicht verändert, und es blieb kein
LibreOffice-Prozess aktiv.
