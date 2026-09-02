# Entscheidungen zur Betriebs- und Pilotfreigabe der 6c-Dokumenterzeugung

Stand: 02.09.2026

Status: **Nach technischer Readiness und Neubewertung abgeschlossen mit
Variante A – Stop.** Die Capability `Features:NoticeGenerationEnabled` bleibt
deaktiviert. Es entsteht kein Aktivierungs- oder Abnahmeauftrag.

Am 02.09.2026 wurde ausschließlich ein getrenntes technisches
Betriebsremediations-Gate vorbereitet. Die Bestätigung eines entbehrlichen
Restore-Prüfziels ändert die Variante noch nicht und ist keine Aktivierung.

## Zweck und Geltungsbereich

Diese Akte bewertet einschließlich der technischen Readiness vom 01.09.2026,
ob der technisch abgeschlossene,
rechtlich wirkungslose 6c-Beisetzungsgebührenentwurf in genau einer benannten,
isolierten Umgebung mit ausschließlich synthetischen Daten separat aktiviert
und abgenommen werden dürfte. Die Readiness behob zwei vorab reproduzierte
6c-Fehler minimal; sie änderte weder Schema, Migration, Konfiguration,
Vorlagendatei, API-Vertrag noch UI.

Der Projektleiter hat als beabsichtigte Testumgebung das aktuelle
Development-Repository zusammen mit der bestehenden Development-Datenbank
`Cemaris_Dev` benannt. Ein späterer Test auf einem Server mit einer anderen
Microsoft-SQL-Server-Datenbank soll erst nach erfolgreicher lokaler Erprobung
folgen. Ergänzend hat er klargestellt, dass `Cemaris_Dev` eigens für diese
kombinierte Development- und Testpilotumgebung geschaffen wurde. Diese
Klarstellung stimmt mit den vorhandenen Repositoryentscheidungen zum
isolierten lokalen Development-Testbetrieb überein. Die Datenbank ist damit
kein Widerspruch zur Gatevoraussetzung mehr. Ihre aktuelle 6c-Migration,
Backup-/Restore-Fähigkeit und Datenbankbetriebsfreigabe sowie die übrigen
Pflichtnachweise sind dadurch noch nicht belegt. Die Readiness bestätigte das
vollständige 6b-/6c-Schema read-only; Backup/Restore und weitere Betriebs- und
Freigabepunkte bleiben offen.

## Bewertungsregel

Verwendet werden die Statuswerte `BESTÄTIGT`, `TEILWEISE BESTÄTIGT`, `OFFEN`,
`WIDERSPRUCH` und `VERWORFEN`. Repositoryevidenz belegt technische Verträge,
aber keine konkrete Installation, Betriebsfreigabe oder real ausgeführte
Ausgabeabnahme. Sobald ein Pflichtnachweis fehlt, teilweise bestätigt oder
widersprüchlich ist, endet das Gate vollständig mit Variante A.

## Quellen- und Nachweismatrix

| Quellen-ID | Datum | Quelle und übermittelnde Funktion | Geltungsbereich und Entscheidung | Nachweisstatus | Restunsicherheit |
| --- | --- | --- | --- | --- | --- |
| `REP-6CP-001` | 28.08.2026 | [verbindliche Pilotgate-Übergabe](../implementation/cemaris-notice-generation-pilot-release-gate-next-step-handoff.md), Projekt-/Gatevorgabe | Pflichtnachweise, Pilotabnahme, Stop-Regel und Schutzgrenzen | `BESTÄTIGT` | kein Installationsnachweis |
| `REP-6CP-002` | 28.08.2026 | [technischer 6c-Abschluss](../implementation/cemaris-increment-6c-completion.md), Repositoryabschluss | implementierter Development-Vertrag, technische Tests, nicht ausgeführte SQL-/LibreOffice-Abnahmen | `BESTÄTIGT` | keine Betriebs- oder Pilotfreigabe |
| `REP-6CP-003` | 27.–28.08.2026 | [6c-Entscheidungsakte](notice-generation-decisions.md), [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md) und [Dokumentarchitektur](../architecture/document-generation.md) | 23 Tokens, Rechtswirkungslosigkeit, flüchtige Ausgabe, Temp-/Auditgrenze | `BESTÄTIGT` | keine konkrete Pilotinstallation |
| `REP-6CP-004` | geprüft am 31.08.2026 | tatsächliche 6c-Verträge in Application, Infrastructure, API/OpenAPI, UI, Migration und unmittelbar zugehörigen Tests | Capability `false`, Development-Sperre, Quellprüfung, ETag, CSRF, Policies, Rate-Limit, Audit-vor-Ausgabe, Paket-/Prozess-/Temp-Schutz und Synthetic-/EF-Parität | `BESTÄTIGT` | Tests sind keine Pilotabnahme; SQL-Kategorie und reale Konvertierung blieben unausgeführt |
| `REP-6CP-005` | geprüft am 31.08.2026 | autorisierte synthetische Quelle `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` und versionierte Fixture, beide nur read-only | Quelle: 31.642 Byte, SHA-256 `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`, 24 eindeutige Tokens; Fixture: 27.321 Byte, SHA-256 `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`, genau 23 eindeutige Pflichttokens ohne Empfängeranrede; jeweils keine aktiven Einträge oder externen Beziehungen | `BESTÄTIGT` | technische synthetische Vorlagenprüfung, keine fachliche oder rechtliche Inhaltsfreigabe |
| `REP-6CP-006` | 25.08.2026, erneut geprüft am 31.08.2026 | [ADR-0017](../decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md), [5k-Abschluss](../implementation/cemaris-increment-5k-completion.md) und Identitätsentscheidungen | `Cemaris_Dev` ist die dauerhafte lokale Development-Datenbank im bestätigten isolierten Development-Testbetrieb; synthetische Fälle und Konten bleiben persistent, portable Defaults und automatisierte SQL-Testdatenbanken bleiben getrennt | `BESTÄTIGT` für den bis 5k nachgewiesenen Development-Stand | 6b-/6c-Migrationen, Backup/Restore und installationsbezogene 6c-Pilotabnahme sind nicht umfasst |
| `USR-2026-08-31-6C-PILOT-01` | 31.08.2026 | Projektverantwortlicher/Projektleiter; übermittelt zusätzlich die Abstimmung mit allen Datenschutz- und Fachverantwortlichen | gewünschter Testpilot im aktuellen Development-Repository gegen `Cemaris_Dev`; späterer Server-/MS-SQL-Test erst nach lokaler Erprobung; Plan nach Aussage abgestimmt | `TEILWEISE BESTÄTIGT` | keine getrennt benannten Entscheidungen, keine belastbaren Betriebs-, Datenbank-, Sicherheits-, Rechts-/Satzungs-, Finanz- oder Abnahmenachweise; keine Dauer, kein Nutzerkreis und kein getesteter Rückfall |
| `USR-2026-08-31-6C-PILOT-02` | 31.08.2026 | Projektverantwortlicher/Projektleiter | Klarstellung: `Cemaris_Dev` wurde eigens für den Testpiloten geschaffen; Pilot- und Development-Umgebung sind identisch | `BESTÄTIGT` für Benennung, Zweck und kombinierte Nutzung | keine Aussage zu aktuellem 6c-Schema, Backup/Restore, Datenbankbetriebsfreigabe oder ausgeführter Pilotabnahme |
| `USR-2026-08-31-6C-PILOT-03` | 31.08.2026 | Projektverantwortlicher/Projektleiter | aktueller Migrationsstand wird vermutet und eine Prüfung gewünscht; getestetes Backup-/Restore-Verfahren wird bestätigt; zunächst testet nur der Projektleiter, später gemeinsam mit einer Sachbearbeitungsfunktion der Friedhofsverwaltung | `TEILWEISE BESTÄTIGT` | tatsächlicher Datenbankstand ungeprüft; kein Backup-/Restore-Testdatum, Ergebnisprotokoll oder verantwortliche Betriebs-/Datenbankfunktion; Dauer, ausschließlich synthetische Daten, Abbruchkommunikation und Rückfall weiter offen |
| `USR-2026-08-31-6C-PILOT-04` | 31.08.2026 | Projektverantwortlicher/Projektleiter und nach eigener Bestätigung Betreiber seines Projekts | bestätigt die zuvor abgefragte Betriebsverantwortung, das getestete Backup-/Restore-Verfahren und ausschließlich synthetische Pilotdaten; Pilotablauf: zunächst Arbeit durch den Projektleiter, später mit Sachbearbeitungsfunktion, Befunde dokumentieren, getrennt implementieren und erneut testen | `TEILWEISE BESTÄTIGT` | kein Backup-/Restore-Testdatum oder Ergebnisprotokoll; „bis alles reibungslos läuft“ ist kein messbares Endkriterium; keine Abbruchkommunikation, ausgeführte 6c-Abnahme oder pauschale Änderungsfreigabe |
| `USR-2026-08-31-6C-PILOT-05` | 31.08.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | bestätigt das vorgeschlagene messbare Endkriterium: alle verpflichtenden 6c-Abnahmepunkte erfolgreich, keine blockierenden Fehler offen, Deaktivierung und Wiederanlauf erfolgreich; versichert Backup-/Restore-Funktion und nennt SSMS als Bedienweg | `BESTÄTIGT` für das Endkriterium, `TEILWEISE BESTÄTIGT` für Backup/Restore | zum Zeitpunkt dieser Quelle kein Datum, kein konkreter Sicherungsstand, Restore-Protokoll oder geprüfter 6b-/6c-Migrationsstand; letzterer ist durch `RUN-2026-09-01-6C-DB-01` später geschlossen |
| `USR-2026-08-31-6C-PILOT-06` | 31.08.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | bestätigt, dass auf dem Pilot-PC nur Microsoft Office und kein LibreOffice installiert ist; wählt die versionierte Fixture `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx` als synthetische Pilotvorlage | `BESTÄTIGT` für Installationsbestand und Vorlagenauswahl; LibreOffice-Punkt `VERWORFEN` | der implementierte PDF-Konverter ist ohne LibreOffice nicht betriebsfähig; keine reale DOCX-/PDF-/Druckabnahme und keine getrennte Fach-/Rechts-/Vorlagenfreigabe |
| `USR-2026-09-01-6C-PILOT-07` | 01.09.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | meldet die nachträgliche LibreOffice-Installation und beauftragt ihre kurzfristige Bestandsprüfung; wünscht danach einen kontextlosen Folgeauftrag für den nächsten Cemaris-Schritt | `BESTÄTIGT` für Auftrag und Geltungsbereich | keine Freigabe einer Capability-Aktivierung in diesem Gate; übrige Nachweise bleiben separat zu bewerten |
| `ENV-2026-09-01-6C-LO-01` | 01.09.2026 | lokale read-only Installations- und Startprüfung, ausgeführt im Auftrag des Projektleiters | `C:\Program Files\LibreOffice\program\soffice.exe` und `soffice.com`; LibreOffice `26.8.0.3`, Publisher The Document Foundation, gültige Authenticode-Signatur; `soffice.com --headless --version` erfolgreich mit Exitcode `0`, keine Prozesse davor oder danach; SHA-256 des Konsolenstarters `95016B59E08DA1E6CBB02FC8F027593C076BF47DF795092578AFDD995306AC85` | `BESTÄTIGT` für Installation, absoluten Pfad, Version, Publisher, Signatur und Startfähigkeit | kein realer Dokumentlauf; Installerherkunft, Wartungsweg, Dienstkonto, Schriften und Ressourcenlimits nicht nachgewiesen |
| `USR-2026-09-01-6C-READINESS-01` | 01.09.2026 | Projektleiter und Betreiber der benannten lokalen Umgebung | autorisiert technische Readiness, reale ausschließlich synthetische Ausgabe, read-only Datenbankprüfung sowie kleinste Korrekturen erst nach reproduziertem 6c-Bug; Capability bleibt aus | `BESTÄTIGT` | keine Fach-, Rechts-, Datenschutz-, Sicherheits-, Betriebs- oder Produktivfreigabe |
| `USR-2026-09-02-6C-RESTORE-01` | 02.09.2026 | Projektleiter und Betreiber der benannten lokalen Umgebung | bestätigt exakt `Cemaris_Dev_RestoreCheck_20260902` als entbehrliches Restore-Prüfziel; autorisiert ein neues datiertes COPY_ONLY-Vollbackup von `Cemaris_Dev` im SQL-Server-Standard-Sicherungsverzeichnis, Verify, Restore, ausschließlich inhaltsfreie Integritätsprüfung und anschließendes Löschen nur des in diesem Lauf neu erzeugten Prüfziels; die Sicherung bleibt erhalten | `BESTÄTIGT` für Ziel und technischen Backup-/Restore-Prüfumfang | kein ausgeführter Backup-/Restore-Nachweis, keine SQL-Testdatenbank, Capability-, Fach-, Rechts-, Datenschutz-, Sicherheits-, Betriebs- oder Produktivfreigabe |
| `RUN-2026-09-01-6C-READINESS-BUG-01` | 01.09.2026 | technische Readiness-Prüfung im autorisierten Geltungsbereich | vor Codeänderung reproduzierter verlorener PDF-Parallelitätsslot nach Fehler bei der Tempverzeichnisanlage; minimaler `try/finally`-Fix und Regressionstest schließen den Befund | `BESTÄTIGT` | keine neue Fachlogik |
| `RUN-2026-09-01-6C-READINESS-BUG-02` | 01.09.2026 | reale synthetische DOCX-/PDF-Prüfung im autorisierten Geltungsbereich | vor Codeänderung fehlte jede sichtbare Entwurfs-/Wirkungslosigkeitskennzeichnung; minimal genau eine rote Kennzeichnung ergänzt und automatisiert sowie real nachgeprüft | `BESTÄTIGT` | keine Rechtsfreigabe; Kennzeichnung verhindert keine unzulässige Weiterverwendung außerhalb des Systems |
| `RUN-2026-09-01-6C-OUTPUT-01` | 01.09.2026 | reale synthetische OpenXML-/LibreOffice-/Druck-zu-Datei-Prüfung | DOCX/PDF erfolgreich; genau eine A4-Seite, selektierbarer Text, keine Resttokens, Kennzeichnung genau einmal; visueller Vergleich ohne Überlagerung; Erfolg, Fehler, Timeout, Abbruch und Startbereinigung ohne Restprozess oder `generation-*`-Verzeichnis | `BESTÄTIGT` für den technischen Lauf | keine Fach-/Rechts-/Vorlagenfreigabe und kein Papierausdruck |
| `RUN-2026-09-01-6C-DB-01` | 01.09.2026 | vorgesehener Anwendungs-/EF-Pfad, ausschließlich read-only | Ziel exakt `Cemaris_Dev`, neun angewandte Migrationen, jüngste 6c-Migration, null ausstehende Migrationen; keine Maintenance oder Mutation | `BESTÄTIGT` | keine Datenbankbetriebsfreigabe |
| `RUN-2026-09-01-6C-BACKUP-01` | 01.09.2026 | SQL-Server-Sicherungs- und Restorehistorie über den EF-Pfad, ausschließlich read-only | weder Vollsicherung noch Restorehistorie für `Cemaris_Dev` vorhanden; kein Restore ohne Sicherung und bestätigtes entbehrliches Ziel | `OFFEN` | belastbarer Backup-/Restore-Nachweis fehlt vollständig |
| `ENV-2026-09-01-6C-PATH-01` | 01.09.2026 | lokale Pfad-, ACL-, Reparse-Point-, Schrift- und Ressourcenprüfung | Pfade auflösbar, keine Reparse Points, benötigte lateinische Schriften vorhanden | `TEILWEISE BESTÄTIGT` | aktuelles Ausführungskonto hat Vollzugriff auf Vorlage und Temp; getrenntes Dienstkonto, Verschlüsselung, Quota und belastbare kurze Pfadkonfiguration fehlen; absichtlich langer Pfad führte zu nativem LibreOffice-Abbruch |
| `TEST-2026-09-01-6C-QUALITY-01` | 01.09.2026 | Repository- und Advisoryprüfungen | Format, Release-Build, 81 Unit-, 70 nicht-SQL-Integrationstests, 58 Frontendtests, Lint und Produktionsbuild erfolgreich; NuGet und npm melden keine bekannte Schwachstelle | `BESTÄTIGT` | SQL-Kategorie ohne separat autorisierte Testverbindung bewusst nicht ausgeführt; Advisorybefund ist zeitpunktbezogen |
| `REP-2026-09-01-6C-READINESS-COMPLETION` | 01.09.2026 | [technischer Readiness-Abschluss](../implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md) | vollständige technische Nachweis-, Fehler-, Test- und Restunsicherheitsakte; Neubewertung nach Stop-Regel | `BESTÄTIGT` | technische Ausführung ist nicht fachlich, rechtlich oder betrieblich freigabebefugt |

## Dokumentation der interaktiven Antwort

Die erste Antwort `USR-2026-08-31-6C-PILOT-01` wurde vom Projektleiter als
Projektverantwortlichem übermittelt. Als entscheidungsbefugte Funktionen
wurden Projektverantwortung sowie pauschal alle beteiligten Fach- und
Datenschutzverantwortlichen genannt. Deren einzelne Entscheidungen,
Geltungsbereiche und Nachweise wurden nicht getrennt benannt.

Mit `USR-2026-08-31-6C-PILOT-02` korrigierte der Projektleiter anschließend
die Datenbankeinordnung: `Cemaris_Dev` sei eigens für den Testpiloten
geschaffen worden; diese Pilotumgebung sei zugleich die Entwicklungsumgebung.
Die Klarstellung wird durch `REP-6CP-006` für den bereits dokumentierten
isolierten Development-Testbetrieb gestützt. Eine Rechts-/Satzungs-,
Finanz-/Haushalts-, Informationssicherheits-, Betriebs- oder aktuelle
Datenbankbetriebsfreigabe wurde dadurch nicht mitgeteilt.

Mit `USR-2026-08-31-6C-PILOT-03` erklärte der Projektleiter, der aktuelle
Migrationsstand sei seines Erachtens vorhanden und könne andernfalls geprüft
werden. Ein getestetes Backup-/Restore-Verfahren bestätigte er mit „Ja“. Als
Nutzerkreis benannte er zunächst nur sich selbst und später zusätzlich eine
Sachbearbeitungsfunktion der Friedhofsverwaltung. Auf die Frage nach der
verantwortlichen Betriebs-/Datenbankfunktion und dem Nachweis bat er um
Erläuterung. Deshalb sind die Aussagen nicht als installationsbezogener
Ausführungsnachweis gewertet.

Die frühere ergänzende Repositoryprüfung wies als jüngste erforderliche additive
Migrationen `20260826130629_AddCanonicalManualNoticeDrafts` für 6b und
`20260828062953_AddNoticeGenerationDraftDocuments` für 6c aus. Die jeweiligen
Abschlussdokumente hielten ausdrücklich fest, dass die SQL-Kategorie nicht
ausgeführt und `Cemaris_Dev` nicht geöffnet wurde. Dieser historische offene
Punkt ist durch `RUN-2026-09-01-6C-DB-01` über den vorgesehenen
Anwendungs-/EF-Pfad read-only geschlossen: beide Migrationen sind angewandt,
es gibt null ausstehende Migrationen.

Mit `USR-2026-08-31-6C-PILOT-04` bestätigte der Projektleiter, dass er für sein
Projekt auch die abgefragte Betriebsverantwortung übernimmt. Seine Bestätigung
umfasst das getestete Backup-/Restore-Verfahren und ausschließlich
synthetische Pilotdaten. Der Pilot soll zunächst durch ihn, später gemeinsam
mit einer Sachbearbeitungsfunktion der Friedhofsverwaltung erfolgen. Fehler,
Änderungs- und Erweiterungswünsche sollen dokumentiert, anschließend
implementiert und danach erneut in Cemaris geprüft werden, bis die Anwendung
reibungslos läuft.

Diese Ablaufentscheidung autorisiert den Pilotprozess, aber weder in diesem
Gate noch für die Zukunft pauschal beliebige Produktänderungen. Jeder Fehler,
jede Änderung und jede Erweiterung benötigt einen eigenen abgegrenzten Auftrag
mit Erhaltungs- und Prüfumfang. „Reibungslos“ bleibt ohne messbare
Akzeptanzkriterien, Dauer oder Abbruchregel eine Restunsicherheit.

Mit `USR-2026-08-31-6C-PILOT-05` bestätigte der Projektleiter ausdrücklich das
vorgeschlagene messbare Endkriterium: Sämtliche verpflichtenden
6c-Abnahmepunkte müssen erfolgreich geprüft, alle blockierenden Fehler
geschlossen sowie Deaktivierung und Wiederanlauf erfolgreich getestet sein.
Eine kalendarische Dauer ist damit durch ein bedingungsgebundenes Pilotende
ersetzt. Für Backup/Restore versicherte er die Funktionsfähigkeit und nannte
SSMS als Bedienweg, konnte aber kein Testdatum nennen. Ohne konkreten
Sicherungsstand und erfolgreiches Restore-Protokoll bleibt dies eine
Betreiberbestätigung und kein vollständig belastbarer Wiederherstellungsnachweis.

Mit `USR-2026-08-31-6C-PILOT-06` bestätigte der Projektleiter, dass auf dem
Pilot-PC Microsoft Office, aber kein LibreOffice installiert ist. Microsoft
Office erfüllt den tatsächlichen 6c-Prozessvertrag nicht: Der implementierte
PDF-Pfad startet ausschließlich den direkt konfigurierten
LibreOffice-Headless-Prozess und besitzt keinen Microsoft-Office-Adapter. Die
LibreOffice-Voraussetzung ist damit nicht nur unbelegt, sondern für die
benannte Umgebung ausdrücklich nicht erfüllt.

Als synthetische Pilotvorlage wählte der Projektleiter die versionierte
Fixture
`src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`.
Diese Auswahl stimmt mit dem technischen Vertrag von genau 23 eindeutigen
Pflichttokens ohne `EMPFAENGER_ANREDE`, aktive Inhalte oder externe Beziehungen
überein. Sie ersetzt noch keine getrennte Fach-, Rechts-/Satzungs- und
Vorlagenfreigabe. Ihr OOXML-Bestand wurde nur lesend geprüft; die Datei wurde
nicht verändert.

Mit `USR-2026-09-01-6C-PILOT-07` meldete der Projektleiter die nachträgliche
LibreOffice-Installation und autorisierte ihre Bestandsprüfung. Die lokale
Prüfung `ENV-2026-09-01-6C-LO-01` bestätigte LibreOffice `26.8.0.3` unter
`C:\Program Files\LibreOffice\program`. Beide Starter besitzen die
Produktversion `26.8.0.3` und eine gültige Authenticode-Signatur. Der
Konsolenstarter meldete mit `--headless --version` erfolgreich Version und
Build-ID, Exitcode `0`; davor und danach bestand kein LibreOffice-Prozess. Es
wurde kein Dokument geöffnet oder konvertiert.

Damit war der historische Nichtinstallationsbefund aus
`USR-2026-08-31-6C-PILOT-06` durch eine datierte tatsächliche
Installationsprüfung überholt. Die nachfolgende technische Readiness bestätigte
Schriften und reale synthetische DOCX-/PDF-/Druck-zu-Datei-Ausgabe. Weiterhin
offen oder teilweise bestätigt sind Installerherkunft und Wartungsweg,
Dienstkontogrenze, ACLs, Verschlüsselung, Quota, kurze Betriebspfade,
Monitoring und zuständige Freigaben.

Die Entscheidung des Projektleiters lautet, das aktuelle Development-
Repository und die dafür geschaffene Datenbank `Cemaris_Dev` gemeinsam als
Development- und Testpilotumgebung zu verwenden und erst später auf einem
Server mit einer anderen Microsoft-SQL-Server-Datenbank zu testen. Der
gewünschte Qualitätsanspruch ist ein vollständig lauffähiges und möglichst
fehlerfreies Programm vor diesem späteren Schritt. Dieser Qualitätsanspruch
ist kein messbarer Abnahme- oder Fehlerfreiheitsnachweis.

## Vollständige Pflichtnachweismatrix

| Bereich | Status | Quellengebundener Befund | Fehlender Nachweis, zuständige Funktion und Restunsicherheit |
| --- | --- | --- | --- |
| Pilotziel | `TEILWEISE BESTÄTIGT` | Umgebung, Stop-Regel, technischer Rückfall und Abbruchkommunikation sind gebunden | keine gemeinsame tatsächliche Pilotabnahme durch Projektleiter und spätere Sachbearbeitungsfunktion |
| Daten | `TEILWEISE BESTÄTIGT` | ausschließlich synthetische Fall-, Personen-, Kontakt-, Satzungs-, Vorlagen- und Gebührenwerte wurden versioniert zusammengestellt und verwendet | keine getrennte Entscheidung der zuständigen Fach- und Datenschutzfunktionen |
| Datenbank | `TEILWEISE BESTÄTIGT` | `Cemaris_Dev`, Verbindung, neun angewandte Migrationen, jüngste 6c-Migration und null ausstehende Migrationen read-only bestätigt | Sicherungskatalog enthält weder Vollbackup noch Restore; Restore-Test und Datenbankbetriebsfreigabe fehlen |
| Serverpfade | `TEILWEISE BESTÄTIGT` | konkrete Pfade, Auflösung, ACLs und Reparse-Point-Freiheit geprüft | Vorlage für Ausführungsidentität nicht read-only; Dienstkonto, Verschlüsselung und Quota offen; langer Pfad bricht LibreOffice ab |
| Vorlage | `TEILWEISE BESTÄTIGT` | hashgebundene 23-Token-Fixture unverändert und real erfolgreich verwendet | Inhalts-, Rechts-/Satzungs-, Aktualitäts- und Vorlagenfreigabe fehlen |
| LibreOffice | `TEILWEISE BESTÄTIGT` | Version, Signatur, Starter, benötigte Schriften und reale Konvertierung bestätigt | vertrauenswürdige Installerherkunft/Updatekette, Wartungsweg und getrenntes Dienstkonto fehlen; kurze Pfadgrenze nicht betrieblich festgelegt |
| Ausgabequalität | `TEILWEISE BESTÄTIGT` | DOCX, PDF, A4, Textselektion, visuelle Prüfung und kontrollierter lokaler Druck-zu-Datei erfolgreich; sichtbare Wirkungslosigkeit nach Bugfix | kein Papierausdruck und keine Fach-, Rechts- oder Vorlagenabnahme |
| Temp-Schutz | `TEILWEISE BESTÄTIGT` | Erfolg, Fehler, Timeout, Abbruch und Startbereinigung ohne Restprozess oder Erzeugungsverzeichnis | ACL-, Verschlüsselungs- und Quota-Freigabe fehlt |
| Überwachung | `OFFEN` | technische Fehlerklassen und Ressourcenlimits implementiert | kein installationsbezogenes Monitoring oder Alarmierung für Verfügbarkeit, Timeout, Konvertierung und Kapazität; Betrieb und Informationssicherheit |
| Audit | `TEILWEISE BESTÄTIGT` | inhaltsfreie Whitelist, Schreiben vor Ausgabe und keine öffentliche Audit-API technisch geprüft | Betreiberzugriff, Integritätsverfahren, kommunale Aufbewahrung und Löschung offen; Datenschutz, Fach und Recht |
| Sicherheit | `TEILWEISE BESTÄTIGT` | Abhängigkeiten, Paket-/Prozessgrenzen, Rollen, CSRF, ETag, Rate-Limit, No-Store und inhaltsfreie Fehler geprüft | keine installationsbezogene Informationssicherheitsfreigabe und keine gehärtete Ausführungsidentität |
| Rückfall | `TEILWEISE BESTÄTIGT` | Capability blieb aus; Prozesse und Temp endeten sauber; Prüfhost lief danach mit ausgeschalteter Capability an | keine Aktivierungs-/Deaktivierungsabnahme durch beide Pilotnutzerfunktionen |

## Verbindliche Pilotabnahme

Die Readiness führte die autorisierten technischen Abnahmeteile aus. Sie
ersetzt keine Abnahme oder Freigabe der zuständigen Fach-, Rechts-, Vorlagen-,
Datenschutz-, Betriebs- und Informationssicherheitsfunktionen.

| Abnahmepunkt | Status | Befund und Restunsicherheit |
| --- | --- | --- |
| versionierte synthetische Datenzusammenstellung, vollständiger Kontakt, genau eine tatsächliche Beisetzung, aktive Satzung und Format | `TEILWEISE BESTÄTIGT` | technisch vollständig verwendet; keine fachliche oder datenschutzbezogene Abnahme |
| DOCX-/PDF-Erfolg, Attachmentname, MIME, No-Store und sichtbare Rechtswirkungslosigkeit | `BESTÄTIGT` | reale Ausgabe und automatisierter HTTP-Vertrag technisch erfolgreich; keine Rechts-/Fachfreigabe |
| Word-/LibreOffice-Öffnung, DIN A4, Textselektion und lokaler Ausdruck | `BESTÄTIGT` | reale LibreOffice-Ausgabe und lokaler Druck-zu-Datei technisch erfolgreich; kein Papierausdruck oder Fachabnahme |
| kontrollierte ETag-, Quellen-, Beisetzungs-, Satzungs-, Kontakt-, Vorlagen-, Timeout- und Konvertierungsfehler | `BESTÄTIGT` | automatisierte Quell-/HTTP-Fehler und reale Prozessfehler/Timeouts technisch erfolgreich; keine gemeinsame Pilotnutzerabnahme |
| keine Datei-/Inhaltsablage, vollständige Temp-Bereinigung und Audit-Whitelist | `TEILWEISE BESTÄTIGT` | Erfolg, Fehler, Timeout, Abbruch und Startbereinigung technisch sauber; Audit-Whitelist geprüft; Aufbewahrung, Löschung, Zugriff, Verschlüsselung und Quota offen |
| Deaktivierung und Wiederanlauf mit weiterhin ausgeschalteter Capability | `TEILWEISE BESTÄTIGT` | Capability aus, Prozessende und Temp-Bereinigung bestätigt, Prüfhost wieder angelaufen; keine Abnahme durch beide Pilotnutzerfunktionen |

## Variantenentscheidung

**Variante A – Stop ist nach der technischen Readiness erneut ausgewählt.**
Der tatsächliche Datenbankname und vollständige 6b-/6c-Migrationsstand sind
jetzt read-only bestätigt. Der Sicherungskatalog enthält jedoch weder ein
Vollbackup noch einen Restore; der Datenbankpunkt bleibt deshalb insgesamt nur
teilweise bestätigt. Monitoring bleibt offen, mehrere weitere Pflichtnachweise
sind ebenfalls nur teilweise bestätigt. Die
pauschal übermittelte Abstimmung mit Fach- und Datenschutzverantwortlichen
ersetzt weder deren abgegrenzte Nachweise noch Rechts-/Satzungs-, Finanz-,
Sicherheits-, Betriebs- und Datenbankbetriebsfreigaben. Nach der Stop-Regel
trägt jeder einzelne dieser Befunde weiterhin den vollständigen Abschluss mit
Variante A.

Die Capability bleibt aus. Es entsteht kein Aktivierungsauftrag und keine
Datei
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`.
Die beabsichtigte Verwendung von `Cemaris_Dev` wird nicht durch eine
Konfigurations-, Datenbank- oder Migrationsänderung umgesetzt. Die zwei
reproduzierten 6c-Produktfehler wurden innerhalb des autorisierten technischen
Readiness-Auftrags minimal und regressionsgesichert korrigiert; daraus folgt
keine Aktivierung.

## Gebündelte Restnachweise für ein vollständig neues Gate

Ein späteres neues Gate benötigt mindestens:

1. von Projekt und Betrieb: gemeinsame tatsächliche Ausführung und Abnahme des
   bestätigten bedingungsgebundenen Endkriteriums durch den Projektleiter und
   die spätere Sachbearbeitungsfunktion; die technische Stop- und
   Abbruchkommunikation ist dokumentiert;
2. von Fach und Datenschutz: die nach Datenklassen getrennte ausdrückliche
   Freigabe einer versionierten, ausschließlich synthetischen
   Datenzusammenstellung;
3. für den vom Projektleiter verantworteten Datenbankbetrieb: datierter
   Vollsicherungsstand und erfolgreiches Restore-Protokoll auf ein vorher
   ausdrücklich bestätigtes entbehrliches Ziel; der tatsächliche
   6b-/6c-Migrationsstand ist bereits read-only bestätigt;
4. von Fach, Recht/Satzung, Finanz und Vorlagenverantwortung: die konkrete
   Freigabe der ausgewählten versionierten Pilotvorlage und deren Inhalts-,
   Rechts- und Aktualitätsverantwortung;
5. von Betrieb und Informationssicherheit: kurze Betriebspfade,
   Least-Privilege-ACLs, Verschlüsselung, Quota, vertrauenswürdige
   Installer-/Updatekette und Wartungsweg für LibreOffice, getrenntes
   Dienstkonto, Ressourcen, Monitoring, Alarmierung und Logging;
6. von Fach, Betrieb, Datenschutz und Informationssicherheit: Abnahme der
   technisch ausgeführten synthetischen DOCX-/PDF-/Druck-, Fehler-, Temp-,
   Audit- und Rückfallnachweise einschließlich Auditaufbewahrung und Löschung.

Eine künftige Neubewertung ist ein neues Gate. Sie darf weder diese
Stop-Entscheidung als Aktivierungserlaubnis umdeuten noch echte
Verwaltungsdaten, Rechtswirkung, Zustellung, Archivierung, Integration oder
Migration einführen.

## Vorbereiteter Betriebsremediations-Folgeauftrag

Die interaktive Quelle `USR-2026-09-02-6C-RESTORE-01` schließt nur die zuvor
fehlende Zielautorisierung. Backup, Verify, Restore, Integritätsprüfung und
Bereinigung sind noch nicht ausgeführt. Der
[getrennte Folgeauftrag](../implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md)
beginnt deshalb weiterhin mit Variante A und ausgeschalteter Capability. Er
darf das neue Vollbackup erzeugen und ausschließlich das bestätigte, zu Beginn
nachweislich nicht vorhandene Restore-Prüfziel temporär anlegen und wieder
entfernen. Jeder andere offene Pflichtpunkt trägt die Stop-Entscheidung
weiterhin selbständig.
