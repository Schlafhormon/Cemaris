# Entscheidungen zur Betriebs- und Pilotfreigabe der 6c-Dokumenterzeugung

Stand: 01.09.2026

Status: **Dokumentarisch abgeschlossen mit Variante A – Stop.** Die
Capability `Features:NoticeGenerationEnabled` bleibt deaktiviert. Es entsteht
kein Aktivierungs- oder Abnahmeauftrag.

## Zweck und Geltungsbereich

Dieses Gate bewertet ausschließlich, ob der technisch abgeschlossene,
rechtlich wirkungslose 6c-Beisetzungsgebührenentwurf in genau einer benannten,
isolierten Umgebung mit ausschließlich synthetischen Daten separat aktiviert
und abgenommen werden dürfte. Es ändert weder Produktcode noch Schema,
Migration, Konfiguration, Vorlage, API oder UI.

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
Pflichtnachweise sind dadurch noch nicht belegt.

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
| `USR-2026-08-31-6C-PILOT-05` | 31.08.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | bestätigt das vorgeschlagene messbare Endkriterium: alle verpflichtenden 6c-Abnahmepunkte erfolgreich, keine blockierenden Fehler offen, Deaktivierung und Wiederanlauf erfolgreich; versichert Backup-/Restore-Funktion und nennt SSMS als Bedienweg | `BESTÄTIGT` für das Endkriterium, `TEILWEISE BESTÄTIGT` für Backup/Restore | kein Datum, kein konkreter Sicherungsstand und kein Protokoll eines tatsächlich erfolgreichen Restore-Tests; tatsächlicher 6b-/6c-Migrationsstand weiter ungeprüft |
| `USR-2026-08-31-6C-PILOT-06` | 31.08.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | bestätigt, dass auf dem Pilot-PC nur Microsoft Office und kein LibreOffice installiert ist; wählt die versionierte Fixture `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx` als synthetische Pilotvorlage | `BESTÄTIGT` für Installationsbestand und Vorlagenauswahl; LibreOffice-Punkt `VERWORFEN` | der implementierte PDF-Konverter ist ohne LibreOffice nicht betriebsfähig; keine reale DOCX-/PDF-/Druckabnahme und keine getrennte Fach-/Rechts-/Vorlagenfreigabe |
| `USR-2026-09-01-6C-PILOT-07` | 01.09.2026 | Projektverantwortlicher/Projektleiter und Betreiber der lokalen Pilotumgebung | meldet die nachträgliche LibreOffice-Installation und beauftragt ihre kurzfristige Bestandsprüfung; wünscht danach einen kontextlosen Folgeauftrag für den nächsten Cemaris-Schritt | `BESTÄTIGT` für Auftrag und Geltungsbereich | keine Freigabe einer Capability-Aktivierung in diesem Gate; übrige Nachweise bleiben separat zu bewerten |
| `ENV-2026-09-01-6C-LO-01` | 01.09.2026 | lokale read-only Installations- und Startprüfung, ausgeführt im Auftrag des Projektleiters | `C:\Program Files\LibreOffice\program\soffice.exe` und `soffice.com`; LibreOffice `26.8.0.3`, Publisher The Document Foundation, gültige Authenticode-Signatur; `soffice.com --headless --version` erfolgreich mit Exitcode `0`, keine Prozesse davor oder danach; SHA-256 des Konsolenstarters `95016B59E08DA1E6CBB02FC8F027593C076BF47DF795092578AFDD995306AC85` | `BESTÄTIGT` für Installation, absoluten Pfad, Version, Publisher, Signatur und Startfähigkeit | kein realer Dokumentlauf; Installerherkunft, Wartungsweg, Dienstkonto, Schriften und Ressourcenlimits nicht nachgewiesen |

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

Die ergänzende Repositoryprüfung weist als jüngste erforderliche additive
Migrationen `20260826130629_AddCanonicalManualNoticeDrafts` für 6b und
`20260828062953_AddNoticeGenerationDraftDocuments` für 6c aus. Die jeweiligen
Abschlussdokumente halten ausdrücklich fest, dass die SQL-Kategorie nicht
ausgeführt und `Cemaris_Dev` nicht geöffnet wurde. Der tatsächliche
Anwendungsstand dieser Migrationen in der Datenbank bleibt daher offen.

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

Damit ist der historische Nichtinstallationsbefund aus
`USR-2026-08-31-6C-PILOT-06` durch eine datierte tatsächliche
Installationsprüfung überholt. Noch offen sind Installerherkunft und
Wartungsweg, Dienstkontogrenze, Schriften, Ressourcenlimits sowie die reale
synthetische DOCX-/PDF-/Druckabnahme.

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
| Pilotziel | `TEILWEISE BESTÄTIGT` | Repository plus `Cemaris_Dev` sind als kombinierte Development- und Testpilotumgebung exakt benannt; zunächst testet nur der Projektleiter, später zusätzlich eine Sachbearbeitungsfunktion der Friedhofsverwaltung; Befunde werden dokumentiert und nach getrennten Umsetzungsaufträgen erneut getestet; das Pilotende ist an vollständige 6c-Abnahme, null offene Blocker und erfolgreichen Rückfall gebunden (`USR-2026-08-31-6C-PILOT-02` bis `-05`, `REP-6CP-006`) | Abbruchkommunikation und die tatsächliche Ausführung des bestätigten Endkriteriums fehlen; Projekt und Betrieb |
| Daten | `TEILWEISE BESTÄTIGT` | ausschließlich synthetische Pilotdaten werden vom Projektleiter bestätigt; die Abstimmung des Plans mit Fach- und Datenschutzverantwortlichen wurde pauschal übermittelt | keine nach Datenklassen getrennte Entscheidung der zuständigen Fach- und Datenschutzfunktionen und keine versionierte Pilotdatenzusammenstellung für Fall-, Personen-, Kontakt-, Satzungs- und Vorlagendaten |
| Datenbank | `TEILWEISE BESTÄTIGT` | `Cemaris_Dev` ist ausdrücklich als eigens geschaffene kombinierte Development- und Testpilotdatenbank autorisiert; bis 5k sind dauerhafte lokale SQL-Nutzung, synthetische Fälle, Konten und Isolation dokumentiert; der Projektleiter bestätigt seine Betriebsverantwortung und versichert Backup-/Restore-Funktion über SSMS | tatsächlicher Stand der erforderlichen 6b-/6c-Migrationen ist ungeprüft; kein datierter Sicherungsstand oder Protokoll eines erfolgreichen Restore-Tests; die Datenbank wurde in diesem Gate nicht geöffnet |
| Serverpfade | `OFFEN` | der Code erzwingt Content-Root, read-only DOCX-Pfad, kontrollierten Tempstamm und keine Reparse Points (`REP-6CP-004`) | keine konkreten Pilotpfade, ACLs, Dienstkontorechte oder Sicherheitsfreigabe; Betrieb und Informationssicherheit |
| Vorlage | `TEILWEISE BESTÄTIGT` | die versionierte 23-Token-Fixture ohne Empfängeranrede, aktive Inhalte oder externe Beziehungen ist ausdrücklich als synthetische Pilotvorlage ausgewählt (`USR-2026-08-31-6C-PILOT-06`, `REP-6CP-005`) | keine getrennte installationsbezogene Inhalts-, Rechts-/Satzungs-, Aktualitäts- und Vorlagenfreigabe; Fach, Recht/Satzung und Vorlagenverantwortung |
| LibreOffice | `TEILWEISE BESTÄTIGT` | LibreOffice `26.8.0.3` ist unter `C:\Program Files\LibreOffice\program` installiert, gültig signiert und über `soffice.com --headless --version` mit Exitcode `0` startfähig (`ENV-2026-09-01-6C-LO-01`); Microsoft Office bleibt außerhalb des 6c-Vertrags | Installerherkunft und Wartungsweg, Dienstkonto, Schriften, Ressourcenlimits und realer synthetischer Konvertierungslauf fehlen |
| Ausgabequalität | `OFFEN` | technische DOCX- und synthetische PDF-Verträge sind automatisiert geprüft | kein realer Word-/LibreOffice-Lauf, kein DIN-A4-/Textselektions-/Druck- und visueller Vergleichsnachweis mit der Pilotvorlage; Fach und Betrieb |
| Temp-Schutz | `TEILWEISE BESTÄTIGT` | Code und Tests belegen isolierte Verzeichnisse, `finally`-Bereinigung, Startbereinigung und Reparse-Point-Sperre | keine Installations-ACLs, Datenträgerverschlüsselung, Quota oder kontrollierte Prüfung verwaister Verzeichnisse nach Abbruch/Neustart; Betrieb und Datenschutz |
| Überwachung | `OFFEN` | Fehlerklassen und technische Limits sind implementiert | kein Monitoring-/Alarmierungsnachweis für Verfügbarkeit, Timeout, Konvertierung und Kapazität sowie keine Prüfung inhaltsfreier Betriebslogs; Betrieb und Informationssicherheit |
| Audit | `TEILWEISE BESTÄTIGT` | Code und Tests belegen die inhaltsfreie Whitelist und keine öffentliche Audit-API | Zugriff, Integrität, konkrete kommunale Aufbewahrung und Löschung sind installationsbezogen unbelegt; Datenschutz, Fach und Recht |
| Sicherheit | `TEILWEISE BESTÄTIGT` | Repositoryverträge und 6c-Tests belegen Paket-, Prozess-, Rechte-, CSRF-, ETag-, Rate-Limit- und Logginggrenzen | keine aktuelle installationsbezogene Abhängigkeits-, Rechte-, Vorlagen-, Logging- und Informationssicherheitsfreigabe für die benannte Umgebung |
| Rückfall | `TEILWEISE BESTÄTIGT` | Capability ist standardmäßig `false`; Aktivierung außerhalb Development und ohne abhängige Capabilities scheitert | keine in der Zielumgebung getestete Deaktivierung, Temp-Bereinigung, Wiederanlaufprüfung oder Pilotnutzerkommunikation; Betrieb und Projekt |

## Verbindliche Pilotabnahme

Die später verlangte Abnahme wurde in diesem Gate nicht ausgeführt und nicht
als bereits autorisiert nachgewiesen.

| Abnahmepunkt | Status | Befund und Restunsicherheit |
| --- | --- | --- |
| versionierte synthetische Datenzusammenstellung, vollständiger Kontakt, genau eine tatsächliche Beisetzung, aktive Satzung und Format | `OFFEN` | keine benannte oder abgenommene Pilotdatenzusammenstellung |
| DOCX-/PDF-Erfolg, Attachmentname, MIME, No-Store und sichtbare Rechtswirkungslosigkeit | `OFFEN` | Repositorytests vorhanden, aber keine Abnahme in der gewünschten Umgebung |
| Word-/LibreOffice-Öffnung, DIN A4, Textselektion und lokaler Ausdruck | `OFFEN` | LibreOffice-Installation und Startfähigkeit sind bestätigt; reale Ausgabe-, Layout-, Textselektions- und Druckprüfung wurden nicht ausgeführt |
| kontrollierte ETag-, Quellen-, Beisetzungs-, Satzungs-, Kontakt-, Vorlagen-, Timeout- und Konvertierungsfehler | `OFFEN` | automatisierte Techniktests ersetzen keine kontrollierte Pilotabnahme |
| keine Datei-/Inhaltsablage, vollständige Temp-Bereinigung und Audit-Whitelist | `OFFEN` | keine installationsbezogene Prüfung von Dateisystem, Auditbestand und Logs |
| Deaktivierung und Wiederanlauf mit weiterhin ausgeschalteter Capability | `OFFEN` | kein ausgeführter Rückfalltest |

## Variantenentscheidung

**Variante A – Stop ist ausgewählt.** Der Datenbankpunkt steht nach der
Korrektur nicht mehr im Widerspruch zur verbindlichen Gatevoraussetzung, ist
aber weiterhin nur teilweise bestätigt. Mehrere weitere Pflichtnachweise sind
ebenfalls nur teilweise bestätigt oder offen. Die
pauschal übermittelte Abstimmung mit Fach- und Datenschutzverantwortlichen
ersetzt weder deren abgegrenzte Nachweise noch Rechts-/Satzungs-, Finanz-,
Sicherheits-, Betriebs- und Datenbankbetriebsfreigaben. Nach der Stop-Regel
trägt jeder einzelne dieser Befunde weiterhin den vollständigen Abschluss mit
Variante A.

Die Capability bleibt aus. Es entsteht kein Aktivierungsauftrag und keine
Datei
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`.
Die beabsichtigte Verwendung von `Cemaris_Dev` wird nicht durch eine
Konfigurations-, Datenbank-, Migrations- oder Produktänderung umgesetzt.

## Gebündelte Restnachweise für ein vollständig neues Gate

Ein späteres neues Gate benötigt mindestens:

1. von Projekt und Betrieb: für die benannte kombinierte Development- und
   Testpilotumgebung Abbruchkommunikation und spätere Ausführung des
   bestätigten bedingungsgebundenen Endkriteriums; Nutzerkreis, iterativer
   Ablauf und Akzeptanzkriterien sind benannt;
2. von Fach und Datenschutz: die nach Datenklassen getrennte ausdrückliche
   Freigabe einer versionierten, ausschließlich synthetischen
   Datenzusammenstellung;
3. für den vom Projektleiter verantworteten Datenbankbetrieb: für
   `Cemaris_Dev` Nachweis des tatsächlichen 6b-/6c-Schema- und
   Migrationsstands sowie datierter Sicherungsstand und erfolgreiches
   Restore-Protokoll für das bestätigte SSMS-Verfahren und Freigabe der
   additiven Migration;
4. von Fach, Recht/Satzung, Finanz und Vorlagenverantwortung: die konkrete
   Freigabe der ausgewählten versionierten Pilotvorlage und deren Inhalts-,
   Rechts- und Aktualitätsverantwortung;
5. von Betrieb und Informationssicherheit: Pfade, ACLs, Verschlüsselung,
   Installerherkunft und Wartungsweg für das bestätigte LibreOffice,
   Dienstkonto, Schriften, Ressourcen, Monitoring, Alarmierung und Logging;
6. von Fach, Betrieb, Datenschutz und Informationssicherheit: reale
   synthetische DOCX-/PDF-/Druck-, Fehler-, Temp-, Audit- und Rückfallabnahme.

Eine künftige Neubewertung ist ein neues Gate. Sie darf weder diese
Stop-Entscheidung als Aktivierungserlaubnis umdeuten noch echte
Verwaltungsdaten, Rechtswirkung, Zustellung, Archivierung, Integration oder
Migration einführen.
