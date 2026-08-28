# Abschluss Inkrement 6c: rechtlich wirkungsloser Gebührenbescheidentwurf

Stand: 28.08.2026

## Ergebnis

Der kleinste freigegebene 6c-Kandidat ist Ende zu Ende umgesetzt. Aus genau
einem aktuellen kanonischen 6b-Entwurf, einer tatsächlichen Beisetzung, den
zugehörigen kanonischen Personen-, Anschrift- und Grabstammdaten, dem eigenen
Benutzerkontaktprofil und einer manuell gewählten aktiven Satzungsversion kann
eine flüchtige DOCX- oder PDF-Datei erzeugt werden. Die Ausgabe ist deutlich
als rechtlich wirkungsloser Entwurf gekennzeichnet und wird nicht in Cemaris
gespeichert.

Es wurden keine Rechtswirkung, Freigabe, Signatur, Zustellung, Archivierung,
Winyard-/DMS- oder FINANZ+-Integration, Empfängeranrede, automatische
Gebühren-, Fälligkeits- oder Rechtsberechnung, Altbestandsmigration und keine
Produktivaktivierung implementiert.

## Ausgangsstand und Arbeitsgrenzen

Vor der ersten Änderung wurden Repository, Branch, Upstream, Ahead/Behind,
Arbeitsbaum, Index und sämtliche unversionierten Inhalte vollständig geprüft:

- Repository
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- `HEAD` und `origin/main`
  `1a7b95f9b3cf064f302296c7d7dac23cd772e696`;
- Ahead/Behind `0/0`;
- sauberer Arbeitsbaum, leerer Index und keine unversionierten Dateien.

Es gab keinen Reset, kein Staging, keinen Commit und kein externes
Arbeitsverzeichnis. Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- und
sonstige Arbeitswurzeln, User Secrets und `Cemaris_Dev` wurden nicht geöffnet.
EDWALT, API-Prozess, Frontend-Dev-Server, Browser und Datenbank wurden nicht
gestartet. `tmp/pagination-build` wurde ausschließlich über seine
Wurzelmetadaten verglichen und weder geöffnet noch verändert.

Die autorisierte synthetische Quelle
`tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` wurde nur gelesen.
Ihr SHA-256 war vor und nach der Fixture-Ableitung exakt
`71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.
`tools/Derive-NoticeGenerationFixture.ps1` prüft diesen Hash, kopiert die
Quelle und entfernt ausschließlich den vollständigen Absatz mit
`{{EMPFAENGER_ANREDE}}`. Die erzeugte versionierte Fixture
`src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`
bleibt synthetisch, wird für Tests in das Build-Ausgabeverzeichnis kopiert und
niemals publiziert.

## Kanonischer Quellen- und Feldvertrag

`NoticeGenerationService` und `INoticeGenerationStore` lesen Synthetic und EF
über denselben Vertrag. Vor jeder Erzeugung werden Entwurfsstatus und starke
Version, Fallzugehörigkeit und tatsächliche Beisetzung, verstorbene Person,
kanonische Grabstelle, Zahlungspflichtiger mit aktueller Primäranschrift,
aktive Satzung sowie das aktive vollständige Kontaktprofil geprüft. Fehlende
Beisetzungs-, Anschrift-, Grabstamm-, Satzungs-, Kontakt- und sonstige
Pflichtwerte besitzen getrennte stabile, nicht inhaltliche Fehlercodes.

Die Zuordnung enthält exakt die bestätigten 23 Tokens. `AKTENZEICHEN` ist in
diesem vorläufigen kanonischen Modell die aktuelle Fall-GUID im Format `D`;
es wurde keine andere Fachreferenz erfunden. Datumswerte verwenden das
deutsche Kurzformat. `GEBUEHR_BETRAG` und `GESAMTBETRAG` geben denselben
manuellen 6b-Gesamtbetrag mit zwei Nachkommastellen und `EUR` aus. Es gibt
keine Anrede-, Geschlechts-, Gebühren-, Fälligkeits- oder Rechtsableitung.

## Benutzerkontakte und Satzungsstammdaten

Das lokale Konto besitzt additiv nullable Felder für Vorname, Nachname,
Kontaktstelle, Zimmer, Telefon und E-Mail. Die zentrale Kontenvalidation
trimmt Werte, begrenzt Längen, verbietet Steuerzeichen und prüft das
E-Mail-Format. Allgemeine Kontonutzung bleibt mit leeren Kontaktfeldern
möglich; nur die Dokumenterzeugung verlangt alle sechs Werte. Ausschließlich
`Administration` pflegt sie über die vorhandene CSRF-/ETag-geschützte
Benutzerverwaltung. Der angemeldete Benutzer sieht nur das eigene Profil im
Current-Account-Vertrag.

Das neue Rechtsgrundlagenmodul speichert stabile GUID, unveränderlichen Namen
und Fassungsstand, Aktivstatus, interne Version, Zeitpunkte und einen
inhaltsfreien Akteursnachweis. Administration legt eine neue zunächst
inaktive Version an und schaltet Versionen mit starkem ETag aktiv oder
inaktiv. Sachbearbeitung und Administration lesen aktive Versionen; eine
automatische Gültigkeits- oder Satzauswahl existiert nicht. Es gibt weder
Überschreiben noch Löschen noch Satzungsvolltext-Upload.

## DOCX, PDF und Temp-Sicherheit

[ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md)
dokumentiert die realisierte Architektur. Open XML SDK 3.5.1 ersetzt Tokens
auch über mehrere Runs sowie in Tabellen, Kopf- und Fußteilen. Vor und nach
der Erzeugung gelten feste Paket-, Einzeldatei-, Entpack-, Kompressions- und
Ausgabegrenzen. OpenXML-Validation und ein abschließender Tokennachweis sind
Pflicht. Makros, ActiveX, OLE, Einbettungen, Binärteile, `altChunk`, externe
Beziehungen, unbekannte, doppelte oder fehlende Tokens und Pfadtraversal
werden verworfen.

Die PDF-Konvertierung startet den konfigurierten absoluten
LibreOffice-Pfad direkt über `ProcessStartInfo.ArgumentList` und niemals über
eine Shell. Jeder Lauf verwendet ein kryptografisch zufälliges Verzeichnis
und isoliertes LibreOffice-Profil. Standardausgabe und Fehlerausgabe sind
begrenzt, Parallelität und Timeout konfiguriert, bei Abbruch wird der gesamte
Prozessbaum beendet. Existenz, Größe und `%PDF-`-Signatur werden geprüft.
`finally` bereinigt den Lauf; die Startbereinigung folgt keinen Reparse Points
und bleibt im exakten Tempstamm.

Die echte lokale LibreOffice-Konvertierung und die visuelle DOCX-/PDF-/Druck-
Abnahme wurden nicht ausgeführt: Es war keine installierte, konfigurierte und
für diesen Auftrag autorisierte LibreOffice-Instanz Teil der Umgebung.
Fremde Binärdateien wurden nicht installiert. Direkte Argumentübergabe,
Timeout, Prozessbaumabbruch, Parallelität, PDF-Prüfung und Bereinigung sind
vollständig mit einem Fake-Prozessadapter getestet.

## Persistenz und Migration

Die normale additive EF-Core-Migration
`20260828062953_AddNoticeGenerationDraftDocuments` ergänzt:

- sechs nullable Kontaktspalten an `LocalAccounts`;
- `LegalBasisVersions` und `LegalBasisVersionAudits` mit eindeutiger
  Name-/Fassungsstandkombination und versioniertem Änderungsnachweis;
- `NoticeGenerationAudits` mit Entwurfs-/Zeitindex und ausschließlich der
  freigegebenen inhaltsfreien Whitelist.

Migration, Designer und ModelSnapshot enthalten keinen Seed und kein
Backfill. `ReadNotices`, `ReadFeeItems`, bestehende Entwürfe, Fälle, Personen,
Rechte und Stammdaten werden weder gelesen noch umgedeutet. Die SQL-Suite
kompiliert den EF-Quellenvertrag und die additive Migration, wurde aber nicht
ausgeführt, weil keine ausdrücklich autorisierte separate temporäre
Testverbindung vorlag. Insbesondere wurde nicht auf `Cemaris_Dev`
zugegriffen.

## Capability, Policy, API und Oberfläche

`Features:NoticeGenerationEnabled` ist repositoryseitig `false`, nur in
`Development` zulässig und verlangt alle abhängigen Development-Capabilities
sowie sichere Vorlagen-, Temp- und LibreOffice-Konfiguration. Die Policies
`NoticeGeneration` und `CaseWork`, Authentifizierung, Antiforgery, starker
6b-Entwurfs-ETag und ein Nebenläufigkeitslimit schützen
`POST /api/notice-drafts/{noticeDraftId}/generate`. Erfolgsantworten sind
Attachments mit bereinigtem ASCII-Dateinamen, korrektem MIME-Typ,
`Cache-Control: no-store`, `Pragma: no-cache` und
`X-Content-Type-Options: nosniff`. OpenAPI dokumentiert Route, Schutzgrenzen,
Status- und Problemcodes.

Der Erfolgsaudit wird vor den Dateibytes gespeichert. Ein Auditfehler sperrt
die Ausgabe. Audits enthalten keine Namen, Anschriften, Kontakte, Beträge,
Gebühren- oder Rechtsgrundlagentexte, Pfade, Dateinamen, Hashes,
Dokumentbytes oder Prozessausgaben und besitzen keine öffentliche API.

Die React-Oberfläche zeigt die Erzeugung nur für aktive Entwürfe bei aktiver
Capability, filtert tatsächliche vollständige Beisetzungen, verlangt die
manuelle Satzungs- und Formatauswahl und warnt sichtbar vor jeder
Rechtswirkung. Downloads verwenden Blob-URLs und widerrufen sie unmittelbar;
PDF verweist ausschließlich auf den lokalen Druckdialog. Administrative
Seiten pflegen Kontakte und Satzungsversionen. Vorschau, Editor, Upload,
Freigabe, Versand, Archivierung und Rückimport existieren nicht.

## Abschlussprüfungen

Alle .NET-Befehle verwenden ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.
Der letzte vollständige Prüflauf weist nach:

| Prüfung | Ergebnis |
| --- | --- |
| Restore mit gesperrten Abhängigkeiten | erfolgreich |
| `dotnet format Cemaris.sln --verify-no-changes --no-restore` | erfolgreich, keine Abweichung |
| Release-Build der Solution | erfolgreich, 0 Warnungen und 0 Fehler |
| Unit-Tests | 80 von 80 bestanden |
| Integrationstests `Category!=SqlServer` | 70 von 70 bestanden |
| SQL-Kategorie | nicht autorisiert, nicht ausgeführt; nur kompiliert |
| Frontend-Installation | `npm ci` erfolgreich, keine gemeldete Schwachstelle |
| Frontendtests | 58 von 58 in 12 Testdateien bestanden |
| Frontend-Lint und Produktionsbuild | erfolgreich, keine Warnung |
| OpenAPI-, DOCX-, PDF-Fake-, Audit- und Temp-Nachweise | erfolgreich |
| echte LibreOffice-/visuelle Druckabnahme | mangels autorisierter Installation nicht ausgeführt |
| Git-, Markdown-, Secret-, Fremdbestands- und `tmp`-Prüfungen | erfolgreich; Details im finalen Git-Nachweis |

Die Unit- und Komponententests decken alle 23 Zuordnungen, Formatierung,
feldbezogene Quellenfehler, Paketabwehr, Split-Runs, Tabellen, Kopf-/Fußteile,
PDF-Prozessgrenzen, Temp-Bereinigung und Audit-Whitelist ab. API-/Provider-
Tests prüfen beide Rollen, Authentifizierung, CSRF, Capability, OpenAPI,
ETags, ungültiges Format, fremde Beisetzung, inaktive Satzung, verworfenen
Entwurf, unvollständigen Kontakt, DOCX/PDF, Header und inhaltsfreie Audits.
Frontendtests prüfen Capability-/Administrationsgrenzen, Kontaktpflege,
eigene Kontaktanzeige, Satzungsversionen, Auswahlpflichten, Downloads,
Blob-Bereinigung, PDF-Druckhinweis und Fehleranzeigen.

Die lokale Markdown-Prüfung umfasst 111 Git-sichtbare Markdown-Dateien und
523 lokale Links beziehungsweise Anker. Es gibt kein fehlendes Ziel, keinen
fehlenden Anker, kein unausgeglichenes Code-Fence, keinen nachgestellten
Leerraum und keinen fehlenden finalen Zeilenumbruch. `git diff --check` ist
erfolgreich.

Die repositorybasierte Secret- und Verwaltungsdatenprüfung liest keine User
Secrets und gibt keine Werte aus. In allen geänderten oder neuen Textanteilen
gibt es 0 Treffer für private Schlüssel, bekannte Cloud-/GitHub-/Slack-Token,
Connection-String-Passwörter, lange Bearer-Tokens, deutsche IBAN oder reale
E-Mail-Adressen; ausschließlich die reservierte synthetische Domain
`example.invalid` wird in Tests verwendet. Keine neue Datenbank-, Archiv-,
PDF-, Tabellen-, Log- oder Fremdbestandsdatei liegt im Git-Umfang. Die einzige
neue Office-Datei ist die autorisierte synthetische DOCX-Fixture. Nach den
Tests bestehen weder `notice-generation-integration-temp` noch
`notice-generation-temp` noch `tmp/notice-generation-unit-tests`.

Der finale Git-Stand bleibt auf `main` bei
`1a7b95f9b3cf064f302296c7d7dac23cd772e696`, identisch zu `origin/main` und
Ahead/Behind `0/0`. Der nachvollziehbare 6c-Umfang besteht aus 46 geänderten
versionierten und 20 neuen unversionierten Pfaden. Der Index ist leer; es
wurde weder gestagt noch ein Commit erstellt. Kein Pfad unter
`tmp/pagination-build` besitzt einen Status- oder Diff-Eintrag.

Der ausschließlich gelesene Metadatenvergleich für `tmp/pagination-build`
zeigt vor und nach der Arbeit unverändert `Directory`, Erstellzeit UTC
`2026-08-14T10:27:21` und letzte Änderung UTC `2026-08-14T10:27:21`. Die
autorisierte DOCX-Quelle besitzt auch abschließend den verbindlichen Hash;
die Fixture enthält exakt alle 23 Tokens je einmal und keinen
`EMPFAENGER_ANREDE`-Token.

## Schutzgrenze und Folgegate

6c ist technisch abgeschlossen, aber weder betrieblich noch fachlich,
rechtlich, datenschutzseitig oder produktiv freigegeben. Das vorbereitete
[Betriebs- und Pilotfreigabegate](cemaris-notice-generation-pilot-release-gate-next-step-handoff.md)
ist der einzige zulässige nächste Schritt. Es muss reale Serverpfade,
LibreOffice-Version, kommunale Vorlage, Berechtigungen, Backup, Monitoring,
synthetische visuelle Abnahme und explizite Aktivierung entscheiden. Das Gate
wurde mit 6c nur vorbereitet und nicht ausgeführt.
