# Abschluss der technischen Readiness und Neubewertung des synthetischen 6c-Piloten

Einordnung vom 07.09.2026: Dieser Auftrag und seine Variante A sind historisch.
Für die weitere lokale synthetische Entwicklung gilt die
[neue Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
mit dem [6c-Praxistest als Folgeauftrag](cemaris-notice-generation-prototype-trial-next-step-handoff.md).
Frühere pauschale Freigabevoraussetzungen blockieren diesen neuen Umfang
nicht. Den abgeschlossenen Auftrag und insbesondere Backup/Restore nicht
wiederholen; seine technischen Nachweise bleiben erhalten.

Stand: 01.09.2026

Status: **Abgeschlossen mit Variante A – Stop.** Die Capability
`Features:NoticeGenerationEnabled` ist in den portablen Konfigurationen
weiterhin `false` und wurde nicht persistent aktiviert. Es besteht keine
Aktivierungsübergabe.

## Ergebnis

Der technisch abgegrenzte 6c-Pfad wurde mit ausschließlich synthetischen
Daten in der benannten lokalen Development- und Pilotumgebung geprüft. Zwei
vor ihrer Korrektur reproduzierbar dokumentierte 6c-Fehler sind mit der jeweils
kleinsten Änderung und Regressionstest behoben:

1. Ein Fehler bei der Anlage des PDF-Arbeitsverzeichnisses verlor dauerhaft
   einen Parallelitätsslot.
2. Der erzeugte DOCX-/PDF-Entwurf enthielt entgegen dem bestätigten Vertrag
   keine sichtbare Kennzeichnung seiner rechtlichen Wirkungslosigkeit.

Der korrigierte DOCX-/PDF-Lauf über LibreOffice, die A4- und Textprüfung, ein
kontrollierter Druck-zu-Datei-Lauf sowie Erfolg, Konvertierungsfehler, Timeout,
Abbruch und Startbereinigung waren technisch erfolgreich. `Cemaris_Dev` ist
read-only als tatsächliches Ziel mit vollständig angewandtem 6b-/6c-Schema
bestätigt.

Variante B ist dennoch unzulässig. Im SQL-Server-Sicherungskatalog besteht
weder ein Vollsicherungs- noch Restore-Nachweis. Außerdem fehlen weiterhin
mindestens eine belastbare Installerherkunft mit Wartungsweg, ein getrenntes
Dienstkonto und Least-Privilege-ACLs, Datenträgerverschlüsselungs- und
Quota-Nachweise, installationsbezogenes Monitoring und Alarmierung,
Auditaufbewahrungs- und Löschregeln sowie die zuständigen Fach-, Rechts-,
Vorlagen-, Datenschutz-, Betriebs- und Informationssicherheitsfreigaben. Ein
absichtlich langer LibreOffice-Arbeitspfad führte zusätzlich reproduzierbar
zu einem nativen Prozessabbruch. Nach der verbindlichen Stop-Regel genügt
jeder einzelne dieser offenen oder nur teilweise bestätigten Pflichtpunkte
für den vollständigen Abschluss mit Variante A.

## Geltungsbereich und unveränderte Grenzen

- Umgebung: dieses Repository zusammen mit `Cemaris_Dev`;
- Daten: ausschließlich die unten gebundene synthetische Testzusammenstellung;
- Dokument: genau ein flüchtiger Beisetzungsgebührenentwurf als DOCX/PDF;
- keine Empfängeranrede, Berechnung, Rechtswirkung, Freigabe, Signatur,
  Zustellung, Archivierung, Integration, weitere Dokumentart oder Migration;
- die ausgewählte Pilotvorlage und die Vergleichsquelle wurden nur gelesen;
- `Cemaris_Dev` wurde weder erstellt, geleert, zurückgesetzt, gelöscht,
  migriert noch durch eine Testfixture verwendet;
- EDWALT und externe Arbeitswurzeln wurden nicht ausgeführt oder geöffnet;
- kein Restore wurde ausgeführt, weil kein entbehrliches Ziel bestätigt ist
  und im Sicherungskatalog zudem keine Vollsicherung besteht;
- kein Reset, Staging oder Commit wurde ausgeführt.

## Quellen- und Nachweismatrix

| Quellen-ID | Datum | Quelle und übermittelnde Funktion | Geltungsbereich und Entscheidung | Status | Restunsicherheit |
| --- | --- | --- | --- | --- | --- |
| `USR-2026-09-01-6C-READINESS-01` | 01.09.2026 | Auftrag des Projektleiters | autorisiert den abgegrenzten technischen Readiness-, Remediations- und Neubewertungsauftrag in genau der benannten lokalen Umgebung; Capability bleibt zunächst und bei jedem offenen Punkt aus | `BESTÄTIGT` | keine fachliche, rechtliche, betriebliche oder produktive Freigabe |
| `REP-2026-09-01-6C-READINESS-01` | 01.09.2026 | versioniertes Repository, technische Prüfung | Ausgangsstand `main`, Commit `7fb1716b235063e5aa8375df7d70e4a118f84124`, zunächst sauber und synchron zu `origin/main`; 6c-Vertrag, Konfiguration, Implementierung, Tests und alle Pflichtquellen vollständig gelesen | `BESTÄTIGT` | Repositoryevidenz ersetzt keine Installations- oder Funktionsfreigabe |
| `ENV-2026-09-01-6C-LO-02` | 01.09.2026 | lokale Installation, technische Prüfung | LibreOffice `26.8.0.3`, Build-ID `bce0998afefdbc355585ca324285661a2170ba77`; gültige Signatur der The Document Foundation; `soffice.com --headless --version` mit Exitcode `0`; vor und nach dem Lauf kein Prozess | `TEILWEISE BESTÄTIGT` | Windows-Installerbestand und lokaler Downloadpfad belegen keine vertrauenswürdige ursprüngliche Bezugs- und Updatekette; Wartungsweg und getrenntes Dienstkonto fehlen |
| `ENV-2026-09-01-6C-PATH-01` | 01.09.2026 | lokale Pfade und ACLs, technische Prüfung | Content-Root, Vorlagen-, Temp- und LibreOffice-Pfade sind absolut auflösbar und ohne Reparse Points; aktuelles interaktives Konto besitzt auf Repository, Vorlage und Repository-Temp Vollzugriff, Standardnutzer auf LibreOffice Lesen/Ausführen | `TEILWEISE BESTÄTIGT` | Vorlage ist für die Ausführungsidentität nicht filesystemseitig read-only; keine getrennte Dienstidentität; BitLocker- und Quota-Abfrage mangels erhöhter Rechte nicht bestätigbar |
| `ENV-2026-09-01-6C-TEMPLATE-01` | 01.09.2026 | ausgewählte Fixture und autorisierte Vergleichsquelle, nur lesend | Fixture: 27.321 Byte, SHA-256 `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`, 19 ZIP-Einträge, genau 23 eindeutige Pflichttokens, keine Anrede, aktiven Inhalte oder externen Beziehungen; Vergleichsquelle: 31.642 Byte, SHA-256 `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`, zusätzlich genau eine Anrede | `TEILWEISE BESTÄTIGT` | technische Vertragskonformität ist belegt; getrennte Inhalts-, Aktualitäts-, Rechts-/Satzungs- und Vorlagenfreigaben fehlen |
| `ENV-2026-09-01-6C-FONTS-01` | 01.09.2026 | DOCX-Fontbestand, Windows-Schriften und erzeugte PDF | im Dokument tatsächlich referenzierte lateinische Schriften Arial, Courier, Symbol sowie Calibri/Cambria-Themen sind installiert; die PDF verwendet Arial-Varianten; MS Gothic/MS Mincho stehen nur in der Fonttabelle und werden in der synthetischen deutschen Ausgabe nicht verwendet | `BESTÄTIGT` | gilt nur für genau diese synthetische Pilotvorlage und diesen lokalen Lauf |
| `RUN-2026-09-01-6C-READINESS-BUG-01` | 01.09.2026 | isolierter synthetischer Repro vor Codeänderung | erstes PDF-Arbeitsverzeichnis durch reguläre Datei blockiert: erster Lauf `IOException`; zweiter Lauf bei Parallelität `1` nach Wiederherstellung bis zur Abbruchfrist im verlorenen Slot blockiert | `BESTÄTIGT` | nach minimaler Korrektur und Regressionstest geschlossen |
| `RUN-2026-09-01-6C-READINESS-BUG-02` | 01.09.2026 | reale synthetische DOCX-/LibreOffice-PDF-Ausgabe vor Codeänderung | einseitige A4-Ausgabe war lesbar, enthielt aber weder „wirkungslos“ noch „Entwurf“ und erschien visuell als Bescheid mit Rechtsbehelfsbelehrung | `BESTÄTIGT` | nach minimaler sichtbarer Kennzeichnung und Regressionstest geschlossen |
| `RUN-2026-09-01-6C-OUTPUT-01` | 01.09.2026 | korrigierter realer synthetischer OpenXML-/LibreOffice-Lauf | DOCX 27.307 Byte, SHA-256 `91D796EE707393FC2AC4A96A62AF05DB72D19653D1B079C2F66088699F371C30`; PDF 278.735 Byte, letzter Prüflauf SHA-256 `9555B01A48B9C0FF724ACDBAA93C1EC994F38405180A2B5DF904257602DE7ED4`; genau eine A4-Seite, 1.555 selektierbare Zeichen, 174 Wörter, keine Resttokens und genau eine rote Kennzeichnung `RECHTLICH WIRKUNGSLOSER ENTWURF` | `BESTÄTIGT` | PDF-Dateien sind wegen LibreOffice-Metadaten nicht als byteidentischer Determinismusvertrag bewertet; keine Fach- oder Rechtsfreigabe |
| `RUN-2026-09-01-6C-PRINT-01` | 01.09.2026 | kontrollierter lokaler Druck-zu-Datei-Lauf | LibreOffice druckte das synthetische DOCX über „Microsoft Print to PDF“ mit Exitcode `0`; PDF 260.644 Byte, SHA-256 `36E5543702AA143513547099935F5EB858D645C46FA56907AA475A1A70929FAC`; eine A4-Seite, selektierbarer Text, Kennzeichnung einmal, keine Resttokens, visuell ohne Überlagerung oder Abschneiden | `BESTÄTIGT` | kontrollierter virtueller Druck, kein Papierausdruck und keine fachliche Druckfreigabe |
| `RUN-2026-09-01-6C-TEMP-01` | 01.09.2026 | reale Prozess- und Temp-Szenarien | nach Erfolg, stabilem Konvertierungsfehler, Timeout und Cancellation jeweils null `generation-*`-Verzeichnisse und null Hilfs-/LibreOffice-Prozesse; Startbereinigung entfernte ein 48 Stunden altes Verzeichnis und bewahrte ein junges; nach Prüfung null Restverzeichnisse | `BESTÄTIGT` | ACL-, Verschlüsselungs- und Quota-Grenzen bleiben separat nur teilweise bestätigt |
| `ENV-2026-09-01-6C-PATHLEN-01` | 01.09.2026 | absichtlich langer lokaler Diagnosepfad | LibreOffice brach bei einem Verzeichnis mit 174 Zeichen und einem 212 Zeichen langen Profilargument nativ mit `0xC0000409` ab; derselbe Prozessvertrag war an den kurzen Pilotpfaden erfolgreich | `OFFEN` | für eine Aktivierung fehlen eine verbindliche kurze Pfadkonfiguration und ein installationsbezogenes Pfadlängenlimit; keine zusätzliche Fachlogik implementiert |
| `RUN-2026-09-01-6C-DB-01` | 01.09.2026 | vorgesehener Anwendungs-/EF-Pfad, read-only | aufgelöster Datenbankname exakt `Cemaris_Dev`, Verbindung erfolgreich, neun angewandte Migrationen, jüngste `20260828062953_AddNoticeGenerationDraftDocuments`, null ausstehende Migrationen; Maintenance- und Capability-Schalter explizit aus | `BESTÄTIGT` | keine Mutation und deshalb keine Migrationsvorschau oder -anwendung erforderlich |
| `RUN-2026-09-01-6C-BACKUP-01` | 01.09.2026 | SQL-Server-Sicherungs- und Restorehistorie über den EF-Pfad, read-only | für `Cemaris_Dev` weder Vollsicherung noch Restore aus dieser Quelle vorhanden | `OFFEN` | kein belastbarer Backup-/Restore-Nachweis; ohne Vollsicherung und ausdrücklich bestätigtes entbehrliches Ziel wurde kein Restore versucht |
| `REP-2026-09-01-6C-OPS-01` | 01.09.2026 | Implementierung, lokale Installation und technische Bewertung | Größen-, ZIP-, Zeit-, Prozess-, Parallelitäts-, Paket-, Pfad-, CSRF-, ETag-, Rollen-, Rate-Limit-, No-Store- und Audit-Whitelist-Grenzen sind implementiert und getestet | `TEILWEISE BESTÄTIGT` | kein externes Monitoring oder Alarmierungsziel für Verfügbarkeit, Timeout, Konvertierung und Kapazität; Auditaufbewahrung, Löschung, Betreiberzugriff und Integritätsverfahren nicht entschieden |
| `TEST-2026-09-01-6C-QUALITY-01` | 01.09.2026 | repositoryeigene Qualitätswerkzeuge | Restore erfolgreich; Formatprüfung unverändert; Release-Solution-Build mit 0 Warnungen/0 Fehlern; 81/81 Unit-Tests, 70/70 nicht-SQL-kategorisierte Integrationstests; Frontend 58/58 Tests in 12 Dateien, Lint und Produktionsbuild erfolgreich | `BESTÄTIGT` | SQL-Kategorie bewusst nicht ausgeführt, weil keine separat autorisierte temporäre SQL-Testverbindung besteht |
| `TEST-2026-09-01-6C-SECURITY-01` | 01.09.2026 | NuGet- und npm-Advisoryprüfung | für sieben .NET-Projekte keine bekannten verwundbaren direkten oder transitiven Pakete; npm-Audit für 118 Pakete: null bekannte Schwachstellen | `BESTÄTIGT` | zeitpunktbezogener Advisorybefund, keine installationsbezogene Informationssicherheitsfreigabe |
| `REP-2026-09-01-6C-FINAL-01` | 01.09.2026 | abschließende Repository-, Markdown-, Secret-, Fremdbestands-, DOCX-, Temp- und Git-Prüfung | 115 Git-sichtbare Markdown-Dateien und 579 lokale Links/Anker ohne Befund; keine Secret-/Verwaltungsdatenheuristik in hinzugefügten Texten; keine binären Fremdbestände; beide DOCX-Quellen unverändert; Prüf-Tempwurzeln entfernt; `tmp/pagination-build`-Wurzelmetadaten identisch; Index leer | `BESTÄTIGT` | 14 beabsichtigte Arbeitsbaum-Pfade bleiben ungestagt; kein Commit erstellt |

Die technische Prüfung war ausführend, nicht fachlich, rechtlich, datenschutz-
oder betriebsentscheidungsbefugt. Statuswerte behaupten nur den jeweils
genannten technischen Geltungsbereich.

## Reproduzierbarer 6c-Bug 1 vor der Korrektur

`RUN-2026-09-01-6C-READINESS-BUG-01` wurde vor jeder Produktcodeänderung
dokumentiert und mit dem vorgeschriebenen SDK reproduziert:

1. `PdfParallelism` auf `1` begrenzt und den Tempstamm nach erfolgreicher
   Pfadinitialisierung durch eine reguläre synthetische Datei blockiert.
2. Erster Aufruf: `IOException` vor Eintritt in den bisherigen
   `try/finally`-Block.
3. Tempstamm wieder als Verzeichnis hergestellt.
4. Zweiter Aufruf: bis zum kontrollierten Abbruch nach zwei Sekunden im
   verlorenen Semaphore-Slot blockiert.

Ursache war die Anlage des zufälligen `generation-*`-Verzeichnisses zwischen
`WaitAsync` und dem freigebenden `try/finally`. Die kleinste Korrektur verschob
nur diese Anlage in den vorhandenen geschützten Block, machte den lokalen
Verzeichniswert nullable und gab den Slot in einem verschachtelten `finally`
immer frei. Der Regressionstest
`PdfDirectoryCreationFailureDoesNotLeakParallelismSlot` beweist, dass ein
zweiter Lauf nach demselben Fehler erfolgreich fortgesetzt wird und kein
Arbeitsverzeichnis zurückbleibt.

Ein erster Diagnoseversuch hatte eine falsche temporäre Projektreferenz und
war deshalb kein Produktrepro. Er wurde verworfen und nicht als Fehlernachweis
gezählt.

## Reproduzierbarer 6c-Bug 2 vor der Korrektur

`RUN-2026-09-01-6C-READINESS-BUG-02` verwendete die ausgewählte Fixture, die
synthetische Datenzusammenstellung und den realen LibreOffice-Prozess. Der
erzeugte Text enthielt weder „wirkungslos“ noch „Entwurf“. Die visuelle
Einseitenprüfung zeigte dagegen prominent den Titel
„Beisetzungsgebührenbescheid“, eine Rechtsbehelfsbelehrung und eine Aussage
zur Gültigkeit ohne Unterschrift. Damit war die bestätigte rechtliche
Wirkungslosigkeit nicht sichtbar und der 6c-Vertrag verletzt.

Die kleinste Korrektur ergänzt beim Rendern genau einen zentrierten, fetten,
roten Absatz `RECHTLICH WIRKUNGSLOSER ENTWURF` am Anfang des Hauptdokuments.
Sie ändert weder Token, Vorlage, Datenquelle, Berechnung noch Fachinhalt. Der
bestehende Fixture-Test verlangt die Kennzeichnung exakt einmal. Die reale
Neuausgabe wurde anschließend technisch und visuell erneut geprüft.

## Synthetische Testzusammenstellung

Die reale Ausgabe verwendete ausschließlich folgende erfundene Datenklasse:

- stabile GUIDs aus dem reservierten synthetischen `20000000-...`-Bereich;
- Akten- und Bescheidnummer mit Präfix `SYN`;
- erfundene Personen-, Anschrift-, Friedhofs-, Grab-, Kontakt-, Satzungs- und
  Gebührenwerte;
- E-Mail unter `.invalid`, nicht zustellbare Telefonnummer und synthetischer
  Zahlungsweg;
- genau eine tatsächliche synthetische Beisetzung mit Datum und Grabstelle;
- genau eine als aktiv modellierte synthetische Satzungsversion;
- manuell vorgegebener Betrag und Fälligkeit ohne Berechnung.

Die Zusammenstellung ist technisch versioniert durch den Quellstand dieses
Abschlusses. Sie ist keine Freigabe der zuständigen Fach-, Rechts-, Finanz-,
Datenschutz- oder Vorlagenfunktion.

## LibreOffice-, Vorlagen-, Pfad- und Ausgabenachweis

Beide LibreOffice-Starter besitzen Produktversion `26.8.0.3` und eine gültige
Authenticode-Signatur. SHA-256:

- `soffice.exe`:
  `A2823391857DB1DD8EBBD8234267F9EC58EC7E5B5FC434665C0ECEC4671CB988`;
- `soffice.com`:
  `95016B59E08DA1E6CBB02FC8F027593C076BF47DF795092578AFDD995306AC85`.

Der reale 6c-Konverter war mit dem Konsolenstarter `soffice.com` erfolgreich.
Der Programmstarter `soffice.exe` lieferte im direkten Produktlauf keinen
erfolgreichen Nachweis. Der Konsolenstarter schrieb dabei die inhaltsfreie
Installationswarnung „Could not find platform independent libraries“ auf
Standardfehler, konvertierte aber mit Exitcode `0`. Eine spätere lokale
Konfiguration müsste deshalb den bestätigten Konsolenstarter und kurze Pfade
verwenden; sie wurde in diesem Auftrag bewusst nicht persistent gesetzt.

Die visuelle Prüfung erfolgte gemäß PDF-Arbeitsanweisung durch gerenderte
Seitenbilder. Poppler war lokal nicht verfügbar; deshalb wurde die vorhandene
PyMuPDF-Installation verwendet. DOCX, PDF, Druckdatei und Seitenbilder waren
nur temporäre Prüfartefakte und sind nicht Teil des Repositoryergebnisses.

## Datenbank-, Backup- und Restore-Nachweis

Die read-only Prüfung lief über einen temporären Prüfhost mit der normalen
Anwendungs-DI und dem vorhandenen EF-Kontext. Die maschinenlokale Verbindung
wurde ausschließlich von diesem vorgesehenen Anwendungs-/EF-Pfad aufgelöst;
Verbindungszeichenfolge, Secretdatei, Anmeldung und Kennwort wurden weder
gelesen noch ausgegeben. Alle Maintenance-Schalter und die 6c-Capability waren
aus.

Die beiden erforderlichen Migrationen
`20260826130629_AddCanonicalManualNoticeDrafts` und
`20260828062953_AddNoticeGenerationDraftDocuments` sind angewandt; es gibt
keine ausstehende Migration. Deshalb gab es weder eine Mutationsvorschau noch
eine Migrationsanwendung.

Die read-only Sicherungshistorie enthält keine Vollsicherung und keine
Restorehistorie für diese Quelle. Ein Restore hätte zusätzlich einen vom
Projektleiter exakt benannten und als entbehrlich bestätigten Zielnamen
erfordert. Da schon keine Sicherung vorhanden ist und Variante A feststeht,
wurde kein Ziel erfragt und kein Restore ausgeführt. `Cemaris_Dev` blieb
unverändert.

## Monitoring, Audit, Sicherheit und Rückfall

Technisch bestätigt sind stabile Fehlercodes, maximale Paket-/Eintrags- und
Ausgabegrößen, Kompressionsgrenze, maximal 300 Sekunden konfigurierbarer
Timeout, Parallelitätsgrenze, direkte argumentlistenbasierte Prozessausführung,
isoliertes Profil, Prozessbaumbeendigung, Authentifizierung, Rollen, CSRF,
starke ETags, API-Parallelitätslimit, No-Store/No-Cache/Nosniff und ein
inhaltsfreier Auditdatensatz vor Rückgabe der Bytes.

Nicht bestätigt und nicht als neue Produktlogik erfunden wurden:

- externes Monitoring und Alarmierung für Verfügbarkeit, Timeout,
  Konvertierung und Kapazität;
- installationsbezogene Logweiterleitung und ein vereinbarter inhaltsfreier
  Alarmvertrag;
- Betreiberzugriff, Integritätsschutz, kommunale Aufbewahrung und Löschung der
  Erzeugungsaudits;
- gehärtete Dienstidentität, Least-Privilege-ACLs, Verschlüsselung und Quota;
- Freigaben der zuständigen Betriebs- und Informationssicherheitsfunktionen.

Der Rückfall ist technisch dadurch geschlossen, dass die Capability vor und
nach allen Läufen `false` blieb, alle Hilfs- und LibreOffice-Prozesse endeten,
alle Erzeugungsverzeichnisse bereinigt wurden und der read-only Prüfhost mit
ausgeschalteter Capability wieder anlief. Eine lokale Browserabnahme wurde
wegen der nicht erfüllten Aktivierungsvorbedingungen nicht ausgeführt.

Abbruchkommunikation: Bei Prozess-, Ausgabe-, Temp-, Datenbank-, Monitoring-
oder Sicherheitsfehlern bleibt die Capability aus; synthetische Ausgaben
werden nicht weiterverwendet; Projektleiter und spätere
Sachbearbeitungsfunktion erhalten Quellen-ID, Zeitpunkt, technischen Status
und Rückfallstand, aber keine Dokumentinhalte, Pfade, Anmeldedaten oder
Secrets. Das ist eine technische Stop-Regel, keine erfundene Betriebsfreigabe.

## Pflichtnachweismatrix nach der Neubewertung

| Bereich | Status | Bestätigter Befund | Offener oder begrenzender Punkt |
| --- | --- | --- | --- |
| Pilotziel und Daten | `TEILWEISE BESTÄTIGT` | Umgebung und rein synthetische Testzusammenstellung sind exakt gebunden | keine getrennte Fach-/Datenschutzfreigabe und keine Abnahme durch die spätere Sachbearbeitungsfunktion |
| Datenbank | `TEILWEISE BESTÄTIGT` | Zielname, Verbindung und vollständiger 6b-/6c-Migrationsstand read-only bestätigt | kein Vollbackup, kein Restore und keine Datenbankbetriebsfreigabe |
| Serverpfade | `TEILWEISE BESTÄTIGT` | Auflösung und Reparse-Point-Freiheit bestätigt | Vorlage nicht filesystemseitig read-only; Dienstkonto, Verschlüsselung und Quota offen; langer Pfad bricht LibreOffice ab |
| Vorlage | `TEILWEISE BESTÄTIGT` | 23-Token-Vertrag und Paketgrenzen hashgebunden bestätigt | Inhalts-, Rechts-/Satzungs-, Aktualitäts- und Vorlagenfreigabe fehlen |
| LibreOffice | `TEILWEISE BESTÄTIGT` | Version, Signatur, Starter, Schriften und reale Konvertierung bestätigt | Herkunfts-/Updatekette, Wartungsweg und Dienstkonto offen; Installationswarnung und Pfadlängengrenze |
| Ausgabequalität | `TEILWEISE BESTÄTIGT` | DOCX, PDF, A4, Textselektion, visuelle Prüfung und Druck-zu-Datei erfolgreich | kein Papierausdruck und keine Fach-/Rechts-/Vorlagenabnahme |
| Temp-Schutz | `TEILWEISE BESTÄTIGT` | Erfolg, Fehler, Timeout, Abbruch und Startbereinigung ohne Restartefakt | ACL-, Verschlüsselungs- und Quota-Nachweise offen |
| Überwachung | `OFFEN` | technische Fehlerklassen und Limits vorhanden | kein installationsbezogenes Monitoring oder Alarmierung |
| Audit | `TEILWEISE BESTÄTIGT` | Whitelist, Speicherung vor Byte-Rückgabe und keine öffentliche API technisch bestätigt | Zugriff, Integritätsverfahren, Aufbewahrung und Löschung offen |
| Sicherheit | `TEILWEISE BESTÄTIGT` | Abhängigkeiten und technische Sicherheitsgrenzen erfolgreich geprüft | keine installationsbezogene Sicherheitsfreigabe und keine gehärtete Ausführungsidentität |
| Rückfall | `TEILWEISE BESTÄTIGT` | Capability aus, Prozesse und Temp sauber, Wiederanlauf des Prüfhosts erfolgreich | keine aktivierte Zielumgebung und keine gemeinsame Pilotnutzerabnahme |

## Build-, Test- und bewusst nicht ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `.NET restore` | erfolgreich |
| `.NET format --verify-no-changes` | erfolgreich, keine Änderung |
| Release-Solution-Build | erfolgreich, 0 Warnungen, 0 Fehler |
| Unit-Tests | 81/81 bestanden |
| Integrationstests ohne Kategorie `SqlServer` | 70/70 bestanden |
| Frontend-Tests | 58/58 in 12 Testdateien bestanden |
| Frontend-Lint | erfolgreich |
| Frontend-Produktionsbuild | erfolgreich |
| NuGet-Vulnerability-Prüfung | keine bekannte Schwachstelle in sieben Projekten |
| npm-Audit | 0 bekannte Schwachstellen in 118 Paketen |
| SQL-kategorisierte Integrationstests | bewusst nicht ausgeführt: keine separat autorisierte temporäre SQL-Testverbindung; niemals gegen `Cemaris_Dev` |
| echte lokale API-/Frontend-/Browserabnahme | bewusst nicht ausgeführt: Aktivierungsvorbedingungen sind nicht vollständig erfüllt |
| Restore | bewusst nicht ausgeführt: keine Vollsicherung und kein bestätigtes entbehrliches Restore-Ziel |
| EDWALT | nicht ausgeführt; der Solution-Build kompilierte das Projekt lediglich |

## Variantenentscheidung

**Variante A – Stop bleibt ausgewählt.** Diese technische Neubewertung schließt
mehrere zuvor offene Nachweise und zwei reproduzierbare Produktfehler. Sie
schließt aber nicht jeden Pflichtpunkt. Insbesondere der fehlende
Backup-/Restore-Nachweis, fehlendes Monitoring, fehlende gehärtete
Installationsgrenzen und fehlende zuständige Freigaben tragen jeweils
selbständig die Stop-Entscheidung.

`Features:NoticeGenerationEnabled` bleibt persistent `false`. Die Datei
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
wurde nicht erstellt. Eine spätere Neubewertung ist ein neuer Auftrag und darf
diese Abschlussakte nicht als Aktivierungserlaubnis verwenden.

## Nachgelagerter Auftrag vom 02.09.2026

Der Projektleiter und Betreiber hat nach diesem Abschluss exakt
`Cemaris_Dev_RestoreCheck_20260902` als entbehrliches Restore-Prüfziel
bestätigt. Backup, Verify, Restore und Integritätsprüfung sind dadurch noch
nicht ausgeführt und ändern die Variantenentscheidung dieses Abschlusses
nicht. Der getrennte
[Betriebsremediations-Folgeauftrag](cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md)
bindet die Datenbankoperationen sicher und bewertet danach die übrigen offenen
Pflichtpunkte neu. Er beginnt weiterhin mit Variante A und ausgeschalteter
Capability.

## Abschluss des nachgelagerten Auftrags vom 02.09.2026

Der getrennte
[Betriebsremediations-Auftrag](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
ist inzwischen vollständig ausgeführt. Ein neues `COPY_ONLY`-Vollbackup mit
Checksum wurde verifiziert, ausschließlich nach
`Cemaris_Dev_RestoreCheck_20260902` wiederhergestellt, dort inhaltsfrei auf
Migrationen, Integrität und Aggregate geprüft und anschließend nur dieses neu
erzeugte Ziel wieder entfernt. Die Sicherung bleibt erhalten und
`Cemaris_Dev` ist online sowie migrations- und aggregatgleich bestätigt.

Dieser Folgeabschluss ändert den historischen Readiness-Befund nicht.
Monitoring, Installationshärtung, Auditbetriebsregeln und zuständige
Funktionsfreigaben bleiben offen oder teilweise bestätigt; deshalb endet auch
der Folgeauftrag mit Variante A und ausgeschalteter Capability.

## Abschlussprüfungen

`REP-2026-09-01-6C-FINAL-01` bestätigt:

- `git diff --check` ohne Befund;
- 115 Git-sichtbare Markdown-Dateien, 579 lokale Links und Anker, null
  fehlende Ziele/Anker, unausgeglichene Tabellen/Codeblöcke,
  Whitespacefehler oder fehlende finale LF;
- in 539 hinzugefügten Textzeilen null Kandidaten für private Schlüssel,
  bekannte Cloud-/GitHub-/Slack-Tokens, Bearer-JWTs,
  Connection-String-Secrets, deutsche IBAN, reale E-Mail-Adressen oder echte
  Verwaltungsdaten;
- 14 beabsichtigte Arbeitsbaum-Pfade: zwölf Markdown- und zwei C#-Dateien;
  eine neue unversionierte Markdown-Datei, keine binäre Fremddatei und kein
  Git-sichtbarer `tmp`-Pfad;
- ausgewählte Fixture weiterhin 27.321 Byte und SHA-256
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`;
  Vergleichsquelle weiterhin 31.642 Byte und SHA-256
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`;
- `tmp/pagination-build` nur an der Wurzel gelesen und unverändert:
  `Directory`, keine Verknüpfung, Erstellzeit UTC
  `2026-08-14T10:27:21.4014388Z`, letzte Änderung UTC
  `2026-08-14T10:27:21.4062644Z`, unveränderter Eigentümer und unveränderte
  ACL-Vererbung;
- beide auftragsspezifischen Tempwurzeln sowie bekannte 6c-Testtempstämme
  entfernt; null LibreOffice- oder Diagnosehilfsprozesse;
- Branch `main`, HEAD
  `7fb1716b235063e5aa8375df7d70e4a118f84124`, Ahead/Behind `0/0`; Index leer,
  kein Staging, kein Commit und kein Reset.
