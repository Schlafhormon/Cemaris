# Abschluss M2a: manueller Nutzungsrechtslebenszyklus

Stand: 08.09.2026

Status: **M2a technisch abgeschlossen, einschließlich nachgewiesener Bereinigung.**
Die fünf [Produktentscheidungen](../requirements/manual-usage-right-termination-decisions.md)
und die [technische Übergabe](cemaris-manual-usage-right-termination-next-step-handoff.md)
sind umgesetzt. [ADR-0021](../decisions/ADR-0021-manual-usage-right-lifecycle.md)
ergänzt die Architektur. Die neue Capability bleibt standardmäßig deaktiviert.
Die zunächst blockierte Prüfwurzel wurde anschließend durch den Benutzer entfernt;
ihre Abwesenheit wurde am 08.09.2026 geprüft. Damit ist auch die letzte offene
Bereinigungsaufgabe erledigt. Die unten beschriebenen Betriebsgrenzen bleiben bestehen.

## Ausgangslage und Schutzgrenzen

Arbeitswurzel war ausschließlich
`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`.
Vor Änderungen wurden Branch, HEAD, Upstream, Ahead/Behind, Index, Arbeitsbaum,
unversionierte Dateien und Diffs geprüft: `main`,
`b2cd44838507eb69e00e748d3f6edcb0d4efb558`, `origin/main` 0/0,
sauberer Arbeitsbaum und leerer Index. Die vorbereitenden M1-/6c-Änderungen waren
bereits committed. Es gab keinen Reset, kein Staging und keinen Commit.

Zuerst wurden Übergabe und Produktentscheidungen vollständig gelesen, danach
die dort genannten Ausgangsdokumente und betroffenen Codeanschlüsse geprüft.
M1 einschließlich EF-Revisionserzeugung und Versionsspeicherung in derselben
Transaktion, Beisetzungsauswahl, 6c-Einleitungstext, Formularreset sowie
AbortSignal- und Generation-Schutz bleiben erhalten. Historische ADRs und
Migrationen wurden nicht umgeschrieben. Bestehende Datenbanken, Secrets,
EDWALT-Ausführung und externe Vorlagen-/DMS-Wurzeln waren kein Arbeitsgegenstand.

## Umgesetztes Verhalten und Dateien

| Schicht | Umsetzung |
| --- | --- |
| Domain | `UsageRightLifecycleRules.cs`: Zustände, Beendigungsarten, UTC-Datum, positive Inhaberintervalle, Pflichtfelder, Trim/Längen, ausdrückliche Prüfung und Nachfolgergrenze |
| Application | additive DTOs und Storeport; `UsageRightLifecycleService.cs` bereitet Übergänge und vollständige Nachweise vor, ermittelt gültige Folgen und vergleicht exakt alle IDs/Versionen |
| Synthetic | `SyntheticUsageRightLifecycle.cs` ergänzt denselben kanonischen Store; Vorbereitung aller Folgestände und Nachweise vor Veröffentlichung unter dem gemeinsamen Coordinator |
| SQL/EF | `EfUsageRightLifecycle.cs`, bestehender Store und Entity/DbContext: serialisierbare Änderung der betroffenen Grabstelle, Versionsschutz aller Mitglieder, atomare Revisionen/Audits und eingefrorene Mutationsantwort |
| Schema | reguläre Migration `20260908114035_AddManualUsageRightLifecycle`, Designer und Snapshot; Default `Open`, nullable neue Fakten, Self-FK und gefilterte eindeutige Indizes |
| API | `UsageRightLifecycleEndpoints.cs`, begrenzter `UsageRightExceptionHandler`, History-/Sequence-Lesepfade, Systeminfo, Startgrenze und deaktivierte Standardkonfiguration |
| Oberfläche | Rechtepanel, `UsageRightLifecycle.tsx`, Inhaberauswahl und Bescheidpanel; vier manuelle Aktionen, Vorschau/Bestätigung aller Folgerechte, paginierte Auswahl und vollständige Revisionsdetails |

Beendigung erhält Rechte-ID und ursprüngliches Laufzeitende. Der getrennte
Nachweis enthält Art, tatsächliches Datum, Quelle, Begründung und bestätigte
manuelle Prüfung; genau der letzte Inhaberzeitraum endet exklusiv an diesem Tag.
Rücknahme öffnet denselben Zeitraum und entfernt nur den aktuellen
Beendigungsnachweis. Seine früheren Revisionen bleiben unverändert.

Manuelle Neuvergabe erzeugt eine neue Identität mit Vorgänger, gewähltem Inhaber,
manuellen Laufzeitfakten, aktuellem Startregel-Snapshot, eigener Quelle,
Begründung und gespeicherter Neuvergabe-Prüfbestätigung. Der Vorgänger erhält
ebenfalls eine neue Version und einen Nachweis. Beide teilen eine Vorgangskennung.

Bei A → B → C ermittelt der Server den vollständigen gültigen Folgebestand.
Nach ausdrücklicher Bestätigung wird A geöffnet; B/C werden auch dann als
„Irrtümlich angelegt“ historisiert, wenn sie bereits beendet waren. Ihre
erfassten Intervalle und Beendigungsfakten bleiben erhalten. Alle Mitglieder
erhalten je neue Version, vollständige Revision und Audit mit gemeinsamer
Vorgangskennung. Ein späterer Fehler rollt die gesamte Operation zurück.
Nach erneuter Beendigung von A ist D als neuer gültiger Nachfolger möglich;
der irrtümliche Zweig B/C bleibt auswählbar.

Pro Grabstelle ist höchstens ein Recht offen, pro Vorgänger höchstens ein
gültiger Nachfolger zulässig. Fremde, ausgelassene oder hinzugefügte Mitglieder,
veraltete Mitgliedsversionen und inzwischen entstandene Nachfolger verhindern
die Folgekorrektur. Die generische Anlage umgeht vorhandene Rechtefolgen nicht;
verknüpfte Beginn-/Grabstellenfakten können nicht still umgehängt werden.
Transfer, Verlängerung und Faktenkorrektur beendeter/irrtümlicher Rechte liefern
kontrolliert 409. Diese Schutzregeln gelten auch nach Abschalten von M2a.

Der kompatible Einzelabruf liefert das offene, sonst jüngste gültig beendete
Recht. Der zusätzliche Verlauf lädt zehn Einträge pro UI-Seite, stabil nach
Beginn und SQL-kompatibler GUID-Reihenfolge absteigend. Die Auswahl lädt die
vollständigen Revisionen der konkreten Rechte-ID. Fall-/Grabstellenwechsel,
Such- und Auswahlanfragen sind gegen verspätete Antworten abgesichert.
Konflikte erhalten Eingaben und bieten bewusstes Neuladen; Folgekorrekturen
verlangen danach eine neue Vorschau und Bestätigung. Nur `Open` liefert einen
aktuellen Inhabervorschlag im Bescheidpanel. Freie bestätigte Auswahl bleibt möglich.

Die vier POST-Routen heißen `terminations`, `termination-reversals`, `successors`
und `sequence-corrections` unter `/api/usage-rights/{id}`. Beide Fallarbeitsrollen
verwenden die vorhandene Cookie-/CSRF-Policy. Fehlender ETag: 428;
ungültiger/schwacher: 400; veralteter: 412; ungültige Felder: 400;
fehlende Referenz: 404; unzulässiger Zustand: 409; anonym: 401;
abgewiesene Rolle oder Passwortwechselpflicht: 403. Körper und ETag neuer
Mutationen beschreiben denselben gespeicherten Stand, auch wenn danach erneut
geschrieben wird. Fachliche Inhalte werden nicht in den sparsamen Audit kopiert.

## Neue Prüfungen dieses Implementierungsstands

Die folgenden Resultate wurden für M2a tatsächlich neu ausgeführt; frühere
M1-/6c-Abschlusszahlen werden nicht als Beleg übernommen. Sämtliche .NET-Befehle
verwendeten ausschließlich das vorgegebene SDK
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.
Testbuilds mit `-p:UserSecretsId=` waren vor jedem Hoststart abgeschlossen;
Tests und Hosts liefen danach mit `--no-build --no-restore`.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| `.NET restore --locked-mode`, EF-Tool-Restore und `npm ci` | erfolgreich; keine Paketupdates |
| `.NET format Cemaris.sln --verify-no-changes --no-restore` | ohne Formatbefund |
| Release-Build der Solution mit `-p:UserSecretsId=` | erfolgreich, 0 Warnungen / 0 Fehler |
| Unit-Tests | 104/104 bestanden, 0 übersprungen |
| Integration `Category!=SqlServer` | 87/87 bestanden, 0 übersprungen |
| gezielte SQL-Klassen M2a, M1 und 5b | 6/6 bestanden, 0 übersprungen |
| `npm run test -- --run --maxWorkers=2` | abschließend 93/93 bestanden in 14 Dateien |
| `npm run lint`, `npm run build` | erfolgreich, keine Lintwarnung |
| `npm audit` | 0 gemeldete Schwachstellen |
| NuGet einschließlich transitiver Pakete | keine anfälligen Pakete gemäß den abgefragten NuGet-Quellen |
| isolierter Browserablauf | beide Rollen, A/B/C/D, Konflikt, Pagination, Tastatur und Abmeldung bestanden |

Die permanenten neuen Tests liegen in `UsageRightLifecycleRulesTests`,
`UsageRightLifecycleContractTests`, `UsageRightLifecycleEndpointTests`,
`UsageRightLifecycleSchemaTests`, `SqlServerUsageRightLifecycleTests` und
`UsageRightLifecycle.test.tsx`. Sie prüfen unter anderem Schaltjahr, exklusive
Grenzen nach Transfer, Pflichtbestätigung und Längen, UTC-Tageswechsel,
historisches JSON ohne neue Felder, A/B/C/D, manipulierte Mitgliedsmengen und
Versionen, alte Schreibwege, unveränderte Fremdaggregate, Rollen/CSRF/ETags,
Startgrenze/OpenAPI, Konflikteingaben, verspätete Antworten und Inhabervorschlag.
Bestehende M1-/6c-Tests liefen in den vollständigen Regressionen mit.

## Isolierter SQL-Nachweis

Die Verbindung zu `.\CEMARISDEV` nutzte Windows-Anmeldung und wurde ausschließlich
prozesslokal über `CEMARIS_SQL_TEST_CONNECTION_STRING` gesetzt und wieder entfernt.
Die bestehende Fixture wurde vor Einsatz geprüft: sie erzeugt eigene zufällige
`Cemaris_IntegrationTests_*`-Datenbanken und verwaltet ausschließlich diese.
Vorher/Nachher wurde nur der Namensbestand über `master.sys.databases` gelesen.
Die ältere fremde Datenbank
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3`
blieb mit Erstellzeit `2026-08-14T11:38:03.8870000` und Zustand `ONLINE` erhalten.
`Cemaris_Dev` und RestoreCheck wurden weder geöffnet noch migriert oder geseedet.

Der neue SQL-Test prüft auf eigenen entbehrlichen Datenbanken:

- Vorgängerschema einschließlich bestehender Rechte, echte M2a-Migration,
  byte-identisches altes Revisions-JSON und kompatiblen offenen Bestandszustand.
- Den gemeinsamen Providervertrag mit A/B/C, Konflikten aller Mitgliedsversionen,
  erhaltenem irrtümlichem Zweig und Neuvergabe D; keine fremden Fallversionen ändern sich.
- Fehler bei mehreren ausstehenden Revisions- beziehungsweise Auditnachweisen,
  jeweils vollständigen Vorher/Nachher-Vergleich von Rechten, Inhabern,
  Revisionen und Audits. Auch bereits innerhalb der Transaktion gespeicherte
  Nachfolgerhistorisierung wird vollständig zurückgerollt.
- Echte gleichzeitig laufende Transaktionen mit unabhängigen DbContexts:
  zwei Neuvergaben, Rücknahme gegen Neuvergabe, Folgekorrektur gegen
  Verlängerung eines Nachfolgers, Beendigung gegen Transfer und zwei
  Beendigungen. Je Rennen genau ein Erfolg und ein Versionskonflikt.
- Vollständig beendeten und neu erzeugten Anwendungshost mit identischem
  gespeichertem Rechts-/Revisionsstand, beiden Cookie-Rollen und Abmeldung.

Zusätzlich liefen die ausdrücklich verlangte M1-SQL-Regression und die
vorhandene 5b-SQL-Klasse. Es wurde nicht die gesamte SQL-Kategorie ausgeführt.
Die in der Übergabe genannte abweichende Vorgängermigrationszählung der
anderen Lesemodellklasse wurde nicht pauschal geändert oder als bestanden ausgegeben.

Die Migration entstand mit einem temporären Design-Time-Helfer ohne Secrets,
normalen Hoststart oder Datenbankverbindung. Das SQL-Artefakt wurde offline
geprüft. Der permanente Schematest erzeugt aus der finalen Migration erneut
SQL, prüft Modell/Snapshot-Konsistenz, nullable Bestandsfelder, Default und
Filter sowie das Ausbleiben von Revisions-Updates und Löschungen in `Up`.
Der Helfer wurde entfernt und die Assemblies anschließend neu gebaut.

## Isolierter Browsernachweis

Verwendet wurden vorhandenes Edge und vorhandene lokale Playwright-Bibliothek,
ohne Browserinstallation oder neue Projektabhängigkeit. Der eigene Kestrel-Host
band ausschließlich Loopback-Port 5059 mit regulärem API-Content-Root,
Development, Synthetic-Fallprovider und überprüftem `TestLocalAccountStore`.
Vite lief mit `--host 127.0.0.1 --port 5179 --strictPort` und prozesslokalem
Proxyziel. Beide Ports waren vor Start frei. NoticeGeneration und sämtliche
Maintenance-Schalter blieben aus; das Fehlen des UserSecrets-Assemblyattributs
wurde vor Hoststart geprüft.

Zwei getrennte Browserkontexte meldeten Administration und Sachbearbeitung im
normalen Formular an. Synthetische Friedhofs-/Grabstellen-/Startregel-/Personen-
und Falldaten wurden über bestehende API-Verträge angelegt. Der Browser bediente
Beendigung, Rücknahme, manuelle Neuvergabe B/C, ausdrückliche gemeinsame
Folgekorrektur A/B/C und danach erneute Beendigung mit Neuvergabe D.
Eine zweite Sitzung erhielt bei veraltetem Stand 412, behielt die Begründung,
lud bewusst neu und nahm die Beendigung erfolgreich zurück.

B/C blieben mit ihren Beendigungsfakten auswählbar; eine unzulässige alte
Verlängerung ergab 409. Wiederöffnen/Reload zeigte D als aktuelles Recht.
Desktop mit 1440 Pixeln und schmale Ansicht mit 390 Pixeln wurden per Screenshot
visuell geprüft; kein horizontales Überlaufen. Auswahl per Tastatur/Enter
funktionierte. Eine dritte synthetische Grabstelle mit zwölf Rechten bewies
zehn Einträge auf Seite 1, zwei auf Seite 2 und Detailauswahl des ursprünglichen
Rechts. Zwei bestehende Testfälle, das andere Recht und Friedhofsstammdaten
wurden vor/nach dem M2a-Ablauf identisch verglichen. Keine Browser-JavaScriptfehler.
Beide Sitzungen wurden über das Kontomenü abgemeldet; anonym folgte 401.

Danach startete ein neuer isolierter Host mit allen Capabilities aus:
Health 200, Systeminfo M2a `false`, NoticeGeneration `false`, alle vier neuen
Mutationsrouten 404. Dieser Host und Vite wurden ebenfalls beendet.

## Behobene Befunde

- EF verpackte einen tatsächlichen SQL-Deadlock zusätzlich in eine
  `InvalidOperationException`. Die Klassifikation betrachtet jetzt die
  Basisexception und liefert den getesteten Versionskonflikt statt eines Fehlers.
- Nachweisfehler wurden im alten EF-Pfad pauschal als Dublette behandelt.
  Nur bekannte fachliche Eindeutigkeitsindizes werden noch so klassifiziert;
  Nachweisfehler rollen zurück und werden inhaltsarm behandelt.
- Der gemeinsame 5b-SQL-Test erwartete einen absoluten Auditgesamtzähler.
  Weitere Tests derselben Fixture erhöhten ihn bereits. Der Test vergleicht
  nun seinen eigenen Ausgangsstand plus seine sieben Änderungen.
- Die eigene Neuvergabe-Prüfbestätigung wurde bei der Kontrolle zusätzlich
  im aktuellen Stand und in Revisionen persistent verankert.
- Extrem großer gültiger ETag und ein `null`-Folgemitglied konnten vor dem
  kontrollierten Vergleich scheitern. Sie führen jetzt zu 412 beziehungsweise
  400. Eine fehlende Beendigungsart wird ebenfalls mit 400 abgewiesen.
- Eine neue Frontend-Exportwarnung wurde durch Auslagern der Statusbeschriftung
  behoben. Späte Auswahl-/Mutationsantworten können eine inzwischen gewählte
  andere Rechte-ID nicht zurückblenden.
- Ein Frontendlauf parallel zu Build-/Testlast überschritt in einem bestehenden
  Beteiligtenpflegetest dessen Fünf-Sekunden-Limit. Der isolierte Wiederholungslauf
  und sein Ergebnis sind in der Prüftabelle ausgewiesen; das Testlimit blieb unverändert.
- Browser-Skriptabbrüche wegen einer unzutreffenden URL-Erwartung und zunächst
  unpassender Formular-/Kontomenüselektoren wurden im Prüfskript korrigiert.
  Der danach vollständige Lauf ist der oben beschriebene Nachweis.

## Bereinigung und verbleibende Grenzen

Alle eigenen SQL-Fixtures und Anwendungshosts sind beendet; der abschließende
SQL-Namensbestand entspricht exakt dem Ausgangsbestand. Keine eigene
Testdatenbank bleibt zurück. Beide Browserkonten sind abgemeldet, die eigenen
Ports 5059 und 5179 sind frei. Testverbindungen und Capability-/Proxy-Overrides
wurden ausschließlich in den jeweiligen Prozessen gesetzt. In beiden
API-Konfigurationen sind alle Feature-Capabilities weiterhin `false`;
Maintenance bleibt effektiv vollständig deaktiviert.

Die temporären Design-Time- und Browser-Quellhelfer sind entfernt. Der
anschließende Release-Neubau ist mit 0 Warnungen/0 Fehlern abgeschlossen;
Helfernamen fehlen in den Assemblies und das generierte API-AssemblyInfo
enthält kein UserSecrets-Attribut. Die eigene Prüfwurzel
`tmp/m2a-20260908` mit den 33 selbst erzeugten Prüfdateien wurde anschließend
durch den Benutzer entfernt. Am 08.09.2026 bestätigte `Test-Path` ihre Abwesenheit.
Die automatische Freigabeprüfung hatte zuvor das rekursive Entfernen und
anschließend die engere Variante
mit einzeln inventarisierten regulären Dateien ohne Rekursion abgewiesen.
Als Grund wurde ausschließlich „blocked by policy“ zurückgegeben, keine
weitere Begründung. Beide Befehle wurden vor Ausführung blockiert. Die Sperre
wurde nicht durch einen anderen Löschmechanismus umgangen.

Bei diesem dokumentarischen Nachabschluss wurden die entfernte Prüfwurzel und
Quellhelfer, freie Testports 5059/5179, deaktivierte eingecheckte Capabilities
und Maintenance-Schalter sowie fehlende eigene Prüfvariablen erneut geprüft.
Auch die beiden DOCX-Hashes und ausschließlich die Wurzelmetadaten von
`tmp/pagination-build` wurden erneut mit dem dokumentierten Bestand verglichen.
Geändert wurden nur dieser Abschlussbericht und der Übergabestatus; die 53
übrigen vorhandenen geänderten/neuen Dateien blieben per SHA-256-Vergleich
unverändert. Es wurden keine neuen Prüfwurzeln oder Hosts angelegt und keine
Datenbankverbindungen geöffnet. .NET-, SQL-, Frontend- und Browsertests wurden
für diese reine Dokumentationsänderung nicht wiederholt; die obigen Ergebnisse
bleiben die datierten Nachweise der Implementierungsphase.

Beide ausschließlich per SHA-256 verglichenen DOCX-Dateien sind unverändert:

- API-Testvorlage: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- Beispiel-Testvorlage: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Von `tmp/pagination-build` wurden ausschließlich die Wurzelmetadaten verglichen:
Pfad, Directory-Attribut, CreationTimeUtc `2026-08-14T10:27:21.4014388Z` und
LastWriteTimeUtc `2026-08-14T10:27:21.4062644Z` sind identisch. Es wurden dort
keine Inhalte geöffnet oder aufgelistet.

Lokale Markdown-Links/-Anker, Tabellen und Codezäune, Whitespace/finale LF,
Encoding sowie neue Dateien und Diffs wurden geprüft: 131 Markdown-Dateien,
784 lokale Links, 32 Anker, 233 Tabellen und 47 geschlossene Codezäune ohne
offenen Befund. `git diff --check`
ist ohne Befund. Die begrenzte Secret-/Fremdpfadheuristik ergab keinen offenen
Befund; zwei gemeldete Absolutpfade sind unveränderte historische
EDWALT-Befehlsbeispiele im README und wurden nicht ausgeführt oder geöffnet.
Die Heuristik ist kein umfassender Sicherheitsscan. Endstand: 36 geänderte und
19 neue Dateien, davon insgesamt 12 Markdown-Dateien; leerer Index,
unveränderter HEAD, `main` und `origin/main` weiterhin 0/0. Alle Änderungen
bleiben zur Prüfung im Arbeitsbaum, ohne Staging oder Commit.

Die SQL-Migration ist als Artefakt bereit und wurde ausschließlich auf neuen
entbehrlichen Testdatenbanken angewandt. Eine Anwendung auf einer bestehenden
Installation, Persistenz mit regulären lokalen Konten und eine gemeinsame
fachliche Alltags-/Last-/Betriebsabnahme sind damit nicht nachgewiesen.
Der Browsernachweis verwendet Synthetic und Testkonten; den persistenten
Rechtsstand über Hostwechsel deckt separat der SQL-Test ab. Die Schema-
Rückmigration ist nach entstandenem Mehrrechtebestand kein fachlicher
Rücknahmeweg, weil das alte Schema nur ein Recht je Grabstelle zulässt.

Keine Fristautomatik, E-Mails, automatische Neuvergabe, Grabstatuswirkung,
Beisetzungsänderung, Gebührenänderung oder Wiedervorlagenänderung wurde eingeführt.
Die bestehenden Generation-Sicherheitstests liefen mit; eine neue Dokumentausgabe
gehörte ausdrücklich nicht zum Browserlauf. Die Prüfungen liefern konkrete
Regressionsnachweise und keine Zusage absoluter Fehlerfreiheit.

Als nächster fachlicher Schritt ist gemäß [Roadmap](cemaris-first-operational-version-roadmap.md)
anhand konkreter Alltagsbeispiele ein weiterer begrenzter M2- oder M3-Ablauf
festzulegen. Weitergehende Frist- und Gebührenregeln sind dadurch nicht entschieden.

## Nachtrag: bestätigter nächster Schnitt

Nach dem oben dokumentierten Abschluss und der geprüften Entfernung des
Prüfordners hat die Projektverantwortung am 08.09.2026
[M3a – manuelle Gebührenpositionen](../requirements/manual-notice-line-items-decisions.md)
mit positiven Beträgen, verbindlicher Summe und vollständiger DOCX-/PDF-Ausgabe
bestätigt. Die [neue Übergabe](cemaris-manual-notice-line-items-next-step-handoff.md)
ist vorbereitet. Dieser Nachtrag ändert keine obigen Laufzeitnachweise;
M3a ist noch nicht implementiert. Die historische Auswahlaufgabe ist damit
für diesen nächsten begrenzten Schnitt erledigt.
