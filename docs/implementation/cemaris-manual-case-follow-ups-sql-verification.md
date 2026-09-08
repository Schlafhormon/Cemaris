# SQL-Nachweis: manuelle fallbezogene Wiedervorlagen

Stand: 08.09.2026, nach dem ursprünglichen Implementierungsabschluss

Status: **Der gezielte SQL-Server-Test für Wiedervorlagen ist ausgeführt und
bestanden. Zwei dabei aufgedeckte EF-Fehler sind behoben.** Persistenz über
einen vollständigen Anwendungshostwechsel, echter Schreibkonflikt und atomarer
Rollback sind nachgewiesen. Dies ist kein SQL-Dienstneustart, Browserlauf oder
Gesamtnachweis aller SQL-Tests der Anwendung.

## Auftrag und Bestandsgrenze

Nach dem [Implementierungsabschluss](cemaris-manual-case-follow-ups-completion.md)
hat die Projektverantwortung die zuvor ausdrücklich ausgeschlossenen SQL-Tests
im selben Dialog freigegeben: „Ja du darfst die tests ausführen, tue es jetzt!“
Die Freigabe bezieht sich auf den angekündigten Wiedervorlagen-Nachweis mit
separaten entbehrlichen Testdatenbanken. Sie erlaubt keine Migration oder
Testfixture-Verwaltung bestehender Anwendungsdatenbanken.

Der tatsächliche Git-Ausgangsstand dieses Folgeauftrags war weiterhin `main`,
HEAD `b6a958d604cc0eebc3dd628e8c802161f8456565`, `origin/main` 0/0,
leerer Index und der erhaltene Implementierungsstand mit 51 geänderten/neuen
Dateien. Kein Reset, Staging oder Commit. Die Änderungen dieses Folgeauftrags
betreffen den EF-Wiedervorlagenstore, seinen SQL-Test und die Dokumentation.
UI, bestehende Migrationen, neuer Migrationsinhalt und Modell bleiben unverändert.

Die laufende lokale SQL-Instanz wurde über Windows Integrated Security
angesprochen. Weder User Secrets noch gespeicherte Anmeldedaten wurden gelesen.
Die Testverbindung war ausschließlich im aufrufenden Prozess gesetzt und wurde
im `finally` entfernt. Es wurden keine maschinenweiten Einstellungen geändert.
Builds verwendeten weiterhin ausschließlich das vorgeschriebene SDK und
`-p:UserSecretsId=`; der neue Hosttest prüft das fehlende UserSecrets-Attribut.

## Ausführung und behobene Befunde

Der ausgeführte Filter lautet:

```text
Category=SqlServer&FullyQualifiedName~SqlServerCaseFollowUpTests
```

Es gab zwei fehlgeschlagene diagnostische Läufe und danach einen erfolgreichen
vollständigen Lauf. Die Fehler wurden nicht übersprungen oder zu Erfolgen erklärt:

1. Die erste Ausführung erreichte die Filterparität, fand jedoch keinen erwarteten
   abgeschlossenen Eintrag. Neue Fachrevisionen mit serverseitig gesetzter GUID
   waren bei Änderungen nicht ausdrücklich als neue EF-Entitäten registriert.
   `EfCaseFollowUpStore.AddEvidence` registriert sie jetzt über
   `CaseFollowUpRevisions.Add`. Der Test prüft zudem jeden vorbereitenden
   SQL-Schreibvorgang unmittelbar auf `Success`.
2. Danach erreichte der Test das echte Parallelrennen. Die konkurrierende
   Änderung scheiterte an den eindeutigen Nachweisversionsindizes mit einer
   `DbUpdateException`, statt einen kontrollierten Versionskonflikt zu liefern.
   Änderungen speichern jetzt zuerst den aktuellen Eintrag mit Versionsvergleich
   und anschließend Revision/Audit in derselben äußeren Transaktion. Die erste
   Änderung hält ihre Zeilensperre bis zum Commit. Der zweite Schreiber erhält
   einen Concurrency-Konflikt; Nachweisfehler rollen auch die bereits gespeicherte
   Eintragsänderung zurück. Zwei `SaveChangesAsync` sind hier ein atomarer Vorgang.

Die Korrektur verändert weder Versionsvertrag noch Schema. Der anfängliche Build
überschnitt sich versehentlich mit dem ersten diagnostischen Teststart und meldete
zwei vorübergehende Kopierwarnungen durch gesperrte Assemblies. Nach Testende
wurde vor dem maßgeblichen Lauf vollständig neu gebaut: 0 Warnungen, 0 Fehler.

## Nachgewiesener SQL-Umfang

Die vorhandene Fixture wurde unverändert geprüft und verwendet. Sie erzeugt
pro Lauf acht zufällig benannte Migrationsprüfdatenbanken und eine eigene
Haupttestdatenbank unter `Cemaris_IntegrationTests_…`. In den Hilfsdatenbanken
werden acht historische Vorgängerstände mit synthetischen Altdatensätzen zum
aktuellen Schema migriert. Der neue Migrationsstand wird damit tatsächlich auf
frischen, entbehrlichen SQL-Datenbanken angewendet. Die Migrationsnachweise
prüfen unter anderem unveränderte alte Beisetzungsangaben und fehlende
nachträglich erfundene Änderungszuordnungen.

Der abschließende Test bestätigt:

- Persistierte Anlage und erneutes Lesen in einem neuen DbContext.
- 13 synthetische Wiedervorlagen, alle drei Zustände, inklusive Datumsgrenze,
  letzte/leere Seite und identische SQL-/Synthetic-Reihenfolge einschließlich
  absichtlich unterschiedlicher .NET-GUID- und SQL-GUID-Sortierung.
- Vollständiger Rollback bei absichtlich kollidierenden Audit- beziehungsweise
  Revisions-IDs: Eintragsversion, Revisionszahl und Auditzahl bleiben erhalten.
- Zwei unabhängige DbContexts werden unmittelbar vor dem Speichern synchronisiert.
  Genau einer gewinnt, genau einer erhält `VersionConflict`; nur eine neue
  Revision und ein neuer Audit bleiben bestehen.
- Die vollständige referenzierte Fallantwort bleibt nach den Storeoperationen
  unverändert.

Zusätzlich wurde der Test um einen echten Anwendungshostwechsel erweitert:

1. Ein SQL-Host mit isoliertem `TestLocalAccountStore` meldet sich regulär per
   Cookie als synthetische Administration an, legt eine weitere Wiedervorlage
   an und verschiebt sie mit CSRF und ETag auf Version 2. Anschließend Abmeldung
   und vollständiges Dispose von Client, Scope und Anwendungshost.
2. Ein neuer Host mit neuem Serviceprovider und neuen DbContexts verwendet
   dieselbe temporäre SQL-Datenbank. Anonym ist das Detail 401. Nach separater
   Cookie-Anmeldung als synthetische Sachbearbeitung liefert es denselben
   vollständigen JSON-Stand, ETag `"2"` und beide Fachrevisionen samt Begründung.
   Ein alter ETag `"1"` wird mit 412 abgewiesen; anschließend Abmeldung.
3. Ein weiterer Host mit deaktivierter Wiedervorlagen-Capability bestätigt
   Health 200, `caseFollowUpsEnabled=false`, `noticeGenerationEnabled=false`
   und Wiedervorlagenroute 404. Auch dieser Host wird beendet.

Die Hosts liefen als ASP.NET-TestServer innerhalb des Testprozesses, ohne
Loopback-Listener oder Browser. Der SQL-Dienst wurde weder beendet noch neu
gestartet. Konten bleiben synthetisch und im Speicher isoliert; dieser Lauf
belegt keine Anmeldung mit einem persistenten lokalen Benutzerkonto.
NoticeGeneration und alle Maintenance-Schalter blieben deaktiviert.

## Aktuelle Regressionen und Bereinigung

| Prüfung nach Korrektur | Ergebnis |
| --- | --- |
| Release-Solution-Build mit vorgeschriebenem SDK | erfolgreich, 0 Warnungen, 0 Fehler |
| Gezielter SQL-Test einschließlich Migration, Parallelrennen, Rollback und Hostwechsel | 1/1 bestanden, 0 übersprungen, Exitcode 0; Gesamtlauf rund 20 Sekunden |
| Unit-Tests, Release ohne Neubau | 95/95 bestanden |
| Integrationstests mit `Category!=SqlServer` | 79/79 bestanden; einschließlich Offline-Schema/Modelldrift |
| Formatprüfung `--verify-no-changes --no-restore` | erfolgreich |
| Markdown-/Änderungsprüfung und `git diff --check` | ohne offenen Befund |

Frontend, Browser, npm und Paketprüfungen wurden für diese ausschließlich
serverseitige Korrektur nicht wiederholt. Ihre datierten Ergebnisse stehen im
ursprünglichen Abschluss. Andere SQL-Testklassen wurden nicht ausgeführt.
EDWALT wurde nur mitgebaut und nicht ausgeführt.

Vor und nach den Läufen wurde ausschließlich über `master.sys.databases` der
Testnamensraum verglichen. Die bereits vorhandene ältere Datenbank
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3` blieb mit demselben
Erstellzeitpunkt und Status erhalten; sie wurde nicht geöffnet oder verwaltet.
Nach dem Abschluss sind keine neuen Testdatenbanken übrig. Die Fixture hat
ihre eigenen Datenbanken auch nach den diagnostischen Fehlläufen entfernt.
`Cemaris_Dev`, das vorhandene Restore-Prüfziel und Sicherungen wurden weder
geöffnet noch geändert. Alle eigenen Hosts sind beendet; portable Capabilities
stehen weiterhin auf `false`. Kein EDWALT-, Backup- oder Restore-Lauf.

Die Abschlussprüfung erfasste 127 Markdown-Dateien, 738 lokale Links,
30 Ankerverweise, 226 Tabellen und 46 geschlossene Codezäune ohne offenen
Befund. Diffs und neue Dateien wurden auf Whitespace, finale LF sowie
Secret-/Fremdpfadkandidaten geprüft; der bereits bekannte Verweis auf eine
synthetische Testkennwort-Konstante ist kein Secretfund. Beide DOCX-Hashes
und die ausschließlich verglichenen Wurzelmetadaten von `tmp/pagination-build`
stimmen mit dem vorherigen Abschluss überein. Der eigene temporäre
Markdown-Prüfhelfer wurde entfernt. Es bleiben insgesamt 52 unstaged geänderte
beziehungsweise neue Dateien aus Implementierung und Folgeauftrag; HEAD und
leerer Index sind unverändert.

## Nächster Schritt und Grenzen

Der gezielte M1-SQL-Nachweis ist damit geschlossen. Vor Einführung in einer
benannten Installation bleiben deren Betriebs- und gemeinsame Arbeitsabnahme
sowie weitergehende SQL-Regressionen eigenständige Aufgaben. Die
[Roadmap](cemaris-first-operational-version-roadmap.md) führt als nächsten
fachlichen Ausbau M2: Nutzungsrechte und Fristen mit noch zu bestätigenden
Beispielen für Ruhezeit, Nutzungszeit, Rückgabe und Wiedervergabe.
Der Test beweist weder absolute Fehlerfreiheit noch Produktivbereitschaft.
