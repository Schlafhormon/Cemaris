# Ausführbare Folgeübergabe: Inkrement 6c – Gebührenbescheidentwurf

Stand: 27.08.2026

Status: **Vorbereitet, nicht ausgeführt.** Diese Übergabe wird erst durch
einen ausdrücklichen Auftrag in einem neuen Chat zur technischen
Implementierungsfreigabe. Sie erlaubt keine Produktivsetzung.

## Auftrag und Ergebnisgrenze

Implementiere genau einen Ende-zu-Ende-Kandidaten: Cemaris erzeugt aus genau
einem aktiven kanonischen 6b-Entwurf, genau einer zugehörigen Beisetzung,
aktuellen kanonischen Fall-/Stammdaten, dem Kontaktprofil des erzeugenden
Benutzers, genau einer manuell ausgewählten aktiven Satzungsversion und einer
read-only Servervorlage wahlweise einen rechtlich wirkungslosen DOCX- oder
PDF-Gebührenbescheidentwurf für Beisetzungsgebühren.

Das Ergebnis ist nur ein Vorschlag. Cemaris entscheidet, genehmigt,
finalisiert, signiert, versendet, archiviert oder gibt keinen Bescheid bekannt.
Die Sachbearbeitung prüft die Datei außerhalb der Erzeugungsoperation. Der
Cemaris-Vorgang endet mit dem Download; Druck erfolgt ausschließlich über den
PDF-/Client-Druckdialog. Es gibt keinen Rückkanal und keine serverseitige
Dokumentspeicherung.

Die verbindliche fachliche Quelle ist die
[6c-Entscheidungsakte](../requirements/notice-generation-decisions.md),
insbesondere deren „Verbindlicher Nachtrag zum ersten Gateabschluss“. Bei
einem Widerspruch hat die engere Schutzgrenze Vorrang. ADR-0018 und der
umgesetzte 6b-Vertrag bleiben erhalten.

## Arbeitsumgebung

Arbeite ausschließlich im Repository:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Verbindliche Teilverzeichnisse:

- Backend: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src`;
- Frontend: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`;
- Unit-Tests: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests`;
- Integrationstests: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests`;
- autorisierte synthetische Testquelle:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx`.

Verwende für jeden .NET-Befehl ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Vor jeder Änderung sind Branch, `HEAD`, Upstream, Ahead/Behind, Arbeitsbaum,
Index und sämtliche unversionierten Inhalte vollständig zu prüfen. Erhalte
alle vorhandenen Änderungen; führe keinen Reset durch, stage nichts und
erstelle keinen Commit. `tmp/pagination-build` wird vor und nach der Arbeit
nur über Metadaten verglichen und weder geöffnet noch verändert. Die
synthetische Testquelle unter `tmp/examples` wird nur gelesen und nicht
überschrieben.

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus, lies keine User Secrets und greife nicht auf `Cemaris_Dev`
zu. Starte weder API noch Frontend-Dev-Server, Browser oder Datenbank. Eine
isolierte SQL-Testausführung ist nur mit ausdrücklich autorisierter separater
Testverbindung zulässig; andernfalls bleibt sie begründet ausgesetzt.

## Zuerst vollständig lesen

1. `README.md`, `SECURITY.md`, `CONTRIBUTING.md` und alle fünf
   Dokumentationsindizes;
2. diese Übergabe, die [6c-Akte](../requirements/notice-generation-decisions.md),
   den [Gateabschluss](cemaris-notice-generation-decision-gate-completion.md),
   den [6b-Abschluss](cemaris-increment-6b-completion.md), die
   [6F-Akte](../requirements/manual-notice-financial-facts-decisions.md) und
   [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md);
3. Dokument-, Sicherheits-, Rollen-, Winyard- und Migrationsarchitektur;
4. die tatsächlichen Verträge für `NoticeDraft`, lokale Konten, Fallakte,
   Beteiligte/Adressen, Beisetzungsprozess, Friedhofsstammdaten, Policies,
   Capability-Validierung, EF-Persistenz, API/OpenAPI und React-Oberfläche;
5. sämtliche einschlägigen Unit-, Provider-, Endpoint-, Sicherheits- und
   Frontendtests.

Verlasse dich nicht auf Dateinamen oder diese Übergabe, wenn der aktuelle
Code einen engeren Vertrag besitzt. Ergänze additiv und ändere keine
Altprojektion `ReadNotices` oder `ReadFeeItems`.

## Verbindlicher Datenvertrag

Der Aufruf benennt `noticeDraftId`, `burialId`, `legalBasisVersionId` und das
Format `docx` oder `pdf`. Er verlangt genau einen starken aktuellen
`If-Match`-ETag des Entwurfs.

Vor der Erzeugung muss serverseitig atomar beziehungsweise als konsistenter
Lesestand geprüft werden:

- der Entwurf existiert, ist `Draft` und besitzt exakt die angeforderte
  aktuelle Version;
- die Beisetzung gehört zur Fall-ID des Entwurfs und besitzt eine tatsächliche
  Beisetzung, verstorbene Person und kanonische Grabstelle;
- die zahlungspflichtige Partei des Entwurfs existiert weiterhin und besitzt
  genau eine aktuelle primäre Postanschrift;
- Friedhof, Grabart und Grabstellenbezeichnung sind über die kanonischen
  Referenzen eindeutig lesbar;
- die ausgewählte Satzungsversion ist aktiv;
- das erzeugende aktive Benutzerkonto besitzt alle sechs Kontaktwerte;
- sämtliche 23 unterstützten Platzhalterwerte sind nach Trimmen nicht leer.

Ein Konflikt, fehlender Bezug oder fehlender Pflichtwert führt zu einem
stabilen Problemcode, einer verständlichen feldbezogenen Meldung und keinem
Ergebnis. Keine Altprojektion, kein EDWALT-Feld, kein Gebührenkatalog und kein
Nutzungsrechtszeitraum darf als Ersatzquelle dienen.

Die verbindliche Zuordnung lautet:

| Platzhalter | Quelle |
| --- | --- |
| `AKTENZEICHEN` | aktuelle Fallreferenz |
| `BESCHEIDDATUM` | `NoticeDraft.NoticeDate` |
| `BESCHEIDNUMMER` | `NoticeDraft.NoticeNumber` |
| `EMPFAENGER_NAME` | aktueller Personen-Vollname oder Organisationsname der bestätigten zahlungspflichtigen Partei |
| `EMPFAENGER_STRASSE_HAUSNUMMER`, `EMPFAENGER_PLZ`, `EMPFAENGER_ORT` | aktuelle primäre Postanschrift derselben Partei |
| `FRIEDHOF`, `GRABART`, `GRABBEZUG` | kanonische Stammdaten der zur Beisetzung gehörenden Grabstelle |
| `VERSTORBENE_PERSON`, `BEISETZUNGSDATUM` | verknüpfte verstorbene Person und tatsächliches Beisetzungsdatum |
| `GEBUEHR_BEZEICHNUNG` | `NoticeDraft.FeeReasonOrSource` |
| `GEBUEHR_BETRAG`, `GESAMTBETRAG` | derselbe `NoticeDraft.TotalAmount` in EUR |
| `ZAHLUNGSFRIST` | `NoticeDraft.DueDate` |
| `KONTAKT_NAME` | `FirstName + " " + LastName` des erzeugenden Kontos |
| `KONTAKTSTELLE`, `KONTAKT_ZIMMER`, `KONTAKT_TELEFON`, `KONTAKT_EMAIL` | getrennte Kontaktfelder desselben Kontos |
| `RECHTSGRUNDLAGE`, `RECHTSGRUNDLAGE_FASSUNGSSTAND` | Name und Fassungsstand der ausgewählten aktiven Satzungsversion |

Datumswerte werden konsistent im deutschen Kurzformat, Beträge mit zwei
Nachkommastellen, deutschem Dezimaltrennzeichen und EUR-Kennzeichnung
ausgegeben. Dateiname und HTTP-Header dürfen ausschließlich aus bereinigter
Bescheidnummer und festen ASCII-Bestandteilen entstehen.

Nicht unterstützt werden `EMPFAENGER_ANREDE`,
`GEBUEHR_LEISTUNGSZEITRAUM`, `DOKUMENTTITEL` und
`ZAHLUNGSINFORMATIONEN`. Insbesondere darf keine Anrede aus Namen oder einem
vermuteten Geschlecht abgeleitet werden.

## Benutzerkontaktprofil

Erweitere das vorhandene lokale Konto additiv um nullable Felder für Vorname,
Nachname, Kontaktstelle, Zimmer, Telefon und E-Mail. `Username` und
`DisplayName` behalten ihre bisherigen Bedeutungen, Claims und Auditwirkung.

- Nur `Administration` darf Kontaktwerte über die bestehende
  Benutzerverwaltung anlegen und ändern.
- Der aktuelle Benutzer darf die eigenen Werte über den bestehenden
  Current-Account-Vertrag lesen; andere Sachbearbeitungskonten bleiben ihm
  verborgen.
- Die Felder bleiben für Anmeldung und allgemeine Kontonutzung optional. Vor
  Dokumenterzeugung sind alle sechs Pflicht.
- Validiere Länge, Trimmen, Zeilenumbrüche/Steuerzeichen und E-Mail-Format
  zentral. Übernimm keine HTML- oder Dateipfadsemantik.
- Schütze Anlage/Änderung wie bisher mit Administratorpolicy, Antiforgery und
  Konten-ETag. Ergänze die vorhandenen Accounttests statt einen zweiten
  Benutzerstamm aufzubauen.

## Satzungsstammdaten

Implementiere ein kleines eigenes Stammdatenmodul für benannte
Rechtsgrundlagen, nicht für Satzungsvolltexte:

- immutable fachlicher Inhalt je Version: stabile GUID, Name und
  Fassungsstand;
- interne Version beziehungsweise starker ETag, Aktivstatus, Erstellzeit und
  inhaltsfreier Akteursnachweis;
- Administration darf eine neue Version anlegen und eine Version aktiv oder
  inaktiv schalten; eine fachliche Inhaltsänderung erzeugt eine neue Version,
  kein Überschreiben einer bereits verwendbaren Version;
- Sachbearbeitung und Administration dürfen aktive Versionen für die
  Erzeugung lesen und genau eine manuell wählen;
- keine automatische Auswahl nach Datum, Friedhof, Fall oder Kommune, keine
  Gültigkeitsberechnung und kein Satzungstext-Upload;
- physisches Löschen ist nicht vorgesehen; ältere Versionen bleiben für
  Auditverweise erhalten.

Das Modul erhält eigene Policy/Endpoints, serverseitige Validation,
Antiforgery für Mutationen, starke ETags und eine kleine administrative
React-Oberfläche. Es darf nicht in die Friedhofsstammdaten oder
Nummernkonfiguration hineingedeutet werden.

## Vorlagen- und Renderergrenze

Die Produktivvorlage ist eine je Installation außerhalb der Cemaris-UI
administrierte `.docx`-Datei im Programmverzeichnis der Serverinstallation,
vorzugsweise im festen Unterverzeichnis `Templates`. Der aufgelöste
Vorlagenstamm muss innerhalb des kanonischen `ContentRootPath` liegen; die
konkrete Datei wird konfiguriert, nicht vom Client gewählt. Cemaris erhält nur
Lesezugriff. Es gibt keine Upload-, Bearbeitungs-, Freigabe-, Versions- oder
Vorlagenhistorienfunktion.

Leite für automatisierte Tests eine versionierte synthetische Fixture aus
`tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` mit SHA-256
`71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`
ab. Entferne darin ausschließlich die gesamte Absatzzeile
`{{EMPFAENGER_ANREDE}}`; verändere die lokale Quelldatei nicht. Die Fixture
darf nur synthetische Werte enthalten.

Implementiere DOCX-Manipulation mit dem zentral versionierten
`DocumentFormat.OpenXml` 3.5.1. Die Version ist zum Übergabestand auf der
[offiziellen NuGet-Seite](https://www.nuget.org/packages/DocumentFormat.OpenXml/)
ausgewiesen. Ersetze Tokens auch dann korrekt, wenn Word sie über mehrere
Runs verteilt, ohne übrige Absatz-, Tabellen-, Kopf- oder Fußformatierung zu
zerstören. Werte werden ausschließlich als Text eingesetzt; niemals als XML,
HTML, Feldfunktion, URI oder Code.

Validiere Vorlage und Ergebnis defensiv:

- kanonisch aufgelöster Pfad muss unter dem Vorlagenstamm innerhalb des
  Programm-/Content-Roots liegen; keine Traversal-, UNC- oder frei vom Client
  gelieferte Pfadangabe;
- angemessene feste Obergrenzen für Dateigröße, ZIP-Einträge, entpackte Größe
  und Kompressionsverhältnis;
- ausschließlich `.docx`, keine Makros, ActiveX-/OLE-/Paket-Einbettungen,
  `altChunk`, externen Beziehungen, verknüpften Vorlagen oder unbekannten
  aktiven Inhalten;
- exakt die 23 erlaubten Pflichtplatzhalter jeweils genau einmal, keine
  unbekannten, doppelten, ungeschlossenen oder nach Ersetzung verbliebenen
  `{{...}}`-Tokens;
- Open-XML-Validierung des Ergebnisses und feste Ausgabegrößenobergrenze.

## PDF-Konvertierung

Konvertiere ausschließlich das bereits erzeugte validierte DOCX über eine
separat auf dem Server installierte LibreOffice-Version im Headless-Modus.
Keine Word-COM-Automation, kein Shellaufruf und kein automatischer Download
oder Installer gehören in Cemaris.

Der absolute Pfad zur ausführbaren LibreOffice-Datei ist Konfiguration. Starte
ihn direkt mit `ProcessStartInfo.ArgumentList`, `UseShellExecute = false` und
den von LibreOffice dokumentierten Parametern `--headless`, `--convert-to
pdf:writer_pdf_Export`, `--outdir` sowie einem pro Erzeugung isolierten
`-env:UserInstallation=file:///...`-Profil. Grundlage sind die offiziellen
[Startparameter](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html)
und [Konvertierungsfilter](https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html).

Setze eine feste kurze Zeitüberschreitung, begrenzte Parallelität und
begrenzte Standardausgabe/-fehlerausgabe. Bei Timeout Prozessbaum beenden,
Dateien bereinigen und ohne Teilergebnis fehlschlagen. Pro Erzeugung dürfen
nur zufällige serverseitige Arbeitsverzeichnisse und feste Dateinamen genutzt
werden. Prüfe Existenz, Größenlimit und `%PDF-`-Signatur des Ergebnisses.

Das synthetische Abnahmedokument muss DIN A4, unverschlüsselt, druckbar, mit
auswählbarem Text und visuell zur Fixture passend sein. PDF/A, PDF/UA,
Signatur und Siegel sind Nicht-Ziele. Falls LibreOffice in der lokalen
Entwicklungsumgebung nicht vorhanden ist, dürfen keine fremden Binärdateien
installiert werden: Fake-Konverter-Tests, Build und alle übrigen Prüfungen
werden vollständig ausgeführt; die echte lokale Konvertierungsabnahme wird
mit exakter Begründung als noch betriebsseitig auszuführen dokumentiert.

## Temporärverarbeitung und Audit

Verwende für jede Erzeugung ein kryptografisch zufälliges, ausschließlich
serverseitig bestimmtes Unterverzeichnis unter einem konfigurierten
Cemaris-Tempstamm. Der kanonische Zielpfad muss darin verbleiben. Lösche das
Verzeichnis in `finally` nach Erfolg, Fehler, Abbruch und Clientabbruch.
Bereinige beim Anwendungsstart verwaiste Cemaris-Erzeugungsverzeichnisse nach
einer konservativen Altersgrenze; folge keinen Links/Reparse Points und
berühre nichts außerhalb des exakten Tempstamms.

Persistiere kein erzeugtes DOCX/PDF und keinen Dokumentinhalt. Der sparsame
Erzeugungsaudit enthält ausschließlich:

- eigene Audit-ID, Fall-ID, Entwurfs-ID und erwartete Entwurfsversion;
- Akteurs-ID, UTC-Zeitpunkt und Ausgabeformat;
- Satzungsversion-ID und deren interne Version;
- Erfolg oder stabile, nicht inhaltliche Fehlerklasse.

Keine Namen, Anschriften, Kontakte, Beträge, Gebührenbezeichnungen,
Rechtsgrundlagentexte, Vorlage-/Temp-Pfade, Dateinamen, Datei-Hashes,
Dokumentbytes oder Prozessausgaben persistieren oder loggen. Vor einer
erfolgreichen HTTP-Ausgabe muss der Erfolgsaudit gespeichert sein. Ein
fehlgeschlagener Auditversuch darf nicht dazu führen, dass eine Datei
ausgegeben wird. Audits folgen später der kommunalen Fall-/Auditaufbewahrung;
dieses Inkrement erfindet keinen eigenen Löschkalender und bietet keine
öffentliche Lese-/Such-/Export-API dafür.

## Capability, Policy, API und OpenAPI

Führe `Features:NoticeGenerationEnabled` ein, standardmäßig `false` und
zunächst ausschließlich in `Development` zulässig. Bei Aktivierung müssen
alle abhängigen Development-Capabilities, Vorlagenstamm, konkrete
Vorlagendatei, Tempstamm und für PDF der LibreOffice-Pfad sicher validiert
sein. Außerhalb `Development` muss Aktivierung beim Start fehlschlagen. Dies
ist ausdrücklich noch keine Pilot- oder Produktivfreigabe.

Ergänze eine eigene Policy `NoticeGeneration` für `Sachbearbeitung` und
`Administration`; prüfe zusätzlich die bestehenden Fallaktenrechte.
Navigation und Featureflag ersetzen keine serverseitige Autorisierung.

Implementiere sinngemäß:

`POST /api/notice-drafts/{noticeDraftId}/generate`

Request: `burialId`, `legalBasisVersionId`, `format`; Header: starker
`If-Match`; Schutz: Authentifizierung, `NoticeGeneration`, Antiforgery,
vorhandene Rate-Limit- und ProblemDetails-Konventionen. Erfolg liefert genau
eine Attachment-Datei mit korrektem MIME-Typ und bereinigtem Dateinamen.
Setze mindestens `Cache-Control: no-store`, `Pragma: no-cache` und
`X-Content-Type-Options: nosniff`. Fehler liefern keine Dateibytes. Dokumentiere
alle Status- und Problemcodes vollständig in OpenAPI.

Es gibt keinen Endpoint für Freigabe, Statuswechsel, Serverdruck, Versand,
Archivierung, Rückimport, Wiederabruf eines alten Exports oder Korrektur eines
ausgegebenen Dokuments.

## React-Oberfläche

Erweitere die bestehende Entwurfsansicht nur bei aktiver Capability:

- Aktion „Bescheidentwurf erzeugen“ nur für aktive Entwürfe;
- Auswahl genau einer zum Fall gehörenden Beisetzung, genau einer aktiven
  Satzungsversion und des Formats DOCX/PDF;
- vorab sichtbarer Hinweis „rechtlich wirkungsloser Entwurf; Prüfung und
  weitere Bearbeitung außerhalb von Cemaris“;
- verständliche Pflichtfeld-, Konflikt-, Vorlagen- und
  Konvertierungsfehlermeldungen ohne interne Pfade oder Inhalte;
- Download über Blob/Attachment; bei PDF eindeutiger Hinweis, dass Drucken
  über den lokalen PDF-/Browserdialog erfolgt;
- keine Dokumentvorschau, kein eingebauter Editor, kein Freigabestatus, kein
  Upload und kein Rückkanal.

Erweitere die Benutzerverwaltung um die sechs Kontaktfelder und ergänze eine
kleine administrative Satzungsstammdatenansicht. Die Current-Account-Antwort
darf dem angemeldeten Benutzer seine eigenen Kontaktwerte zeigen. Beachte
Tastaturbedienbarkeit, Labels, Fokus- und Fehlerzuordnung; eine PDF/UA-Pflicht
wird dadurch nicht eingeführt.

## Persistenz und Migration

Ergänze ausschließlich additive EF-Core-Persistenz:

- nullable Kontaktspalten am lokalen Konto;
- unverlierbare Satzungsversionen mit Aktivstatus, Version/ETag und
  notwendigem inhaltsfreiem Änderungsnachweis;
- separate sparsame Erzeugungsaudits mit referenziellen und längenbegrenzten
  Feldern sowie zweckmäßigen Indizes.

Erstelle eine normale additive Migration und aktualisiere den Snapshot. Kein
Seed echter Werte, kein Backfill und keine Ableitung aus DisplayName,
Benutzername, `ReadNotices`, `ReadFeeItems` oder EDWALT. Vorhandene Konten
bleiben nutzbar; ihre Dokumenterzeugung schlägt bis zur administrativen
Kontaktpflege verständlich fehl.

Synthetic- und EF-/SQL-Provider müssen denselben Vertrag erfüllen. SQL-Tests
bleiben kategorisiert und dürfen nur mit der autorisierten isolierten
Testverbindung laufen.

## Pflichtnachweise

Mindestens abzudecken sind:

### Unit- und Komponententests

- jede der 23 Feldzuordnungen, Formatierung und Pflichtfeldfehler;
- keine Anrede-, Geschlechts-, Gebühren-, Fälligkeits- oder Rechtsableitung;
- Benutzerkontaktvalidation und `KONTAKT_NAME` ausschließlich aus Vor- plus
  Nachname;
- Satzungsversionierung, Aktivstatus, ETag und Erhalt älterer Versionen;
- Tokenersetzung innerhalb eines Runs und über mehrere Runs, Tabellen, Kopf-
  und Fußteile;
- Ablehnung unbekannter/doppelter/fehlender Tokens, Makros, ActiveX, OLE,
  Einbettungen, `altChunk`, externer Beziehungen, Pfadtraversal und
  Größen-/ZIP-Grenzverletzungen;
- sichere Argumentübergabe, Timeout, Prozessabbruch, Parallelitätsgrenze und
  Temp-Bereinigung des PDF-Konverters;
- Audit-Whitelist ohne fachliche Inhalte.

### API-/Provider-Integrationstests

- Authentifizierung, beide zulässigen Rollen, unzulässige Rolle soweit im
  Modell vorhanden, Antiforgery und deaktivierte Capability;
- 428 ohne `If-Match`, 400 bei schwachem/ungültigem ETag, 409/412 bei
  Versionskonflikt gemäß vorhandener Konvention;
- verworfener/fremder Entwurf, fremde Beisetzung, inaktive Satzung,
  unvollständiger Kontakt, fehlende kanonische Daten;
- DOCX- und PDF-Erfolg mit MIME, Attachmentname, No-Store-Headern und
  vollständiger Bereinigung;
- kein Teilergebnis und stabiler inhaltsfreier Audit bei jedem Fehlerpfad;
- Auditfehler verhindert Dateiausgabe;
- Synthetic-/EF-Parität und additive Migrationsprüfung;
- Startup-Sperre außerhalb Development sowie bei unsicherer Konfiguration.

### Frontendtests

- Capability-/Rollenanzeige, Auswahlpflichten und Entwurfsstatus;
- DOCX-/PDF-Download, PDF-Druckhinweis und URL-/Blob-Bereinigung;
- 428/409-, Kontakt-, Satzungs-, Vorlagen- und Konvertierungsfehler;
- Kontaktpflege nur in Administration, eigene Kontaktanzeige und
  Satzungsverwaltung;
- kein Freigabe-, Versand-, Archiv-, Upload- oder Rückimportpfad.

### Qualitätsläufe

- Restore mit gesperrten Abhängigkeiten, Formatprüfung, Release-Build;
- vollständige Unit-Tests und Integrationstests ohne SQL-Kategorie;
- SQL-Kategorie nur bei separater Autorisierung;
- `npm ci`, Frontendtests, Lint und Produktionsbuild;
- OpenAPI-Prüfung;
- `git diff --check` und vollständige lokale Markdown-Prüfung;
- repositorybasierte Secret-/Verwaltungsdatenprüfung ohne Wertausgabe;
- Nachweis, dass Fixture und erzeugte Testartefakte ausschließlich
  synthetisch sind und keine Laufzeitartefakte in Git verbleiben.

## Nicht-Ziele und Stop-Bedingungen

Nicht implementieren:

- weitere Dokumentarten oder mehrere Gebührenpositionen;
- Empfängeranrede oder irgendeine Geschlechtsableitung;
- Gebührenkatalog, Betrags-, Fälligkeits-, Rechts- oder Satzungsberechnung;
- neuer Entwurfsstatus, fachliche Freigabe, Vier-Augen-Prinzip, Festsetzung,
  Signatur, Siegel oder Rechtswirkung;
- Serverdruck, Versand, Bekanntgabe, Rückimport oder externe Dateikorrektur;
- Dokumentablage, historischer Wiederabruf, bitgleiche Neuerzeugung,
  Winyard/DMS oder FINANZ+;
- echte kommunale Vorlage oder Verwaltungsdaten im Repository;
- EDWALT-Zugriff, Mapping, Backfill, Altbescheid- oder Dokumentmigration;
- Produktivaktivierung oder Pilot-Cutover.

Stoppe und dokumentiere, statt zu raten, wenn ein Pflichtwert im aktuellen
kanonischen Modell nicht eindeutig auffindbar ist, die synthetische Quelle
nicht exakt zur Prüfsumme passt, eine sichere DOCX-/PDF-Verarbeitung mit den
vorhandenen Abhängigkeiten nicht erreichbar ist oder vorhandene Arbeit mit
dem Auftrag kollidiert. Ein fehlendes lokales LibreOffice blockiert nur die
reale Konvertierungsabnahme, nicht die sichere Implementierung mit Fake und
allen übrigen Nachweisen.

## Abschluss und Folgegrenze

Aktualisiere Implementierungsabschluss, Root-README, alle fünf
Dokumentationsindizes sowie unmittelbar betroffene Architektur-, Sicherheits-,
Anforderungs- und Migrationsdokumente. Dokumentiere tatsächliche Dateien,
Migration, Verträge, Tests, ausgelassene SQL-/LibreOffice-Prüfungen und finalen
Git-Stand.

Der nächste Schritt nach einem erfolgreichen technischen 6c-Abschluss ist
kein stiller Produktivbetrieb, sondern ein eigenes dokumentarisches Betriebs-
und Pilotfreigabegate für Serverpfade, installierte LibreOffice-Version,
kommunale Vorlage, Backup/Berechtigung, Monitoring, synthetische Abnahme und
explizite Aktivierung. Bereite dieses Folgegate vor, implementiere es nicht.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-increment-6c-next-step-handoff.md

Diese Übergabe ist verbindlich. Implementiere ausschließlich den dort
freigegebenen kleinsten 6c-Kandidaten für einen rechtlich wirkungslosen
Gebührenbescheidentwurf für Beisetzungsgebühren vollständig Ende zu Ende.

Untersuche vor jeder Änderung den vollständigen tatsächlichen Git-Stand und
erhalte sämtliche vorhandene Arbeit. Die 6b-/6c-Arbeit kann committed,
gepusht oder noch uncommittiert vorliegen. Führe keinen Reset durch, stage
nichts, erstelle keinen Commit und verändere tmp/pagination-build nicht.

Verbindliche Arbeitsverzeichnisse:

Repository:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Frontend:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web

Unit-Tests:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests

Integrationstests:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests

Autorisierte synthetische Testquelle, nur lesen und nicht überschreiben:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx

Verwende für .NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus, lies keine User Secrets und greife nicht auf Cemaris_Dev zu.
Starte weder API noch Frontend-Dev-Server, Browser oder Datenbank. SQL-Tests
sind nur mit einer ausdrücklich autorisierten separaten temporären
Testverbindung zulässig; andernfalls dokumentiere sie als nicht ausgeführt.

Arbeite bis zum vollständigen nachgewiesenen Abschluss einschließlich
Benutzerkontaktprofil, Satzungsstammdaten, additiver Migration,
OpenXML-DOCX-Erzeugung, sicher gekapselter LibreOffice-PDF-Konvertierung,
Temp-Bereinigung, inhaltsfreiem Audit, Capability, Policy, API/OpenAPI,
React-UI, Synthetic-/EF-Providern, Unit-, Integrations- und Frontendtests,
Dokumentation, Pilot-Folgegate sowie sämtlicher in der Übergabe verlangter
Markdown-, Secret-, Fremdbestands-, tmp- und Git-Prüfungen.

Implementiere keine Rechtswirkung, Freigabe, Signatur, Zustellung,
Archivierung, Winyard-/FINANZ+-Integration, Empfängeranrede, automatische
Gebühren-/Rechtsberechnung, Altbestandsmigration oder Produktivaktivierung.
Erfinde keine fehlende Fachregel.
```
