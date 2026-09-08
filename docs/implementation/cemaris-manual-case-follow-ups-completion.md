# Abschluss: manuelle fallbezogene Wiedervorlagen

Stand: 08.09.2026

**Nachtrag nach ausdrücklicher weiterer Beauftragung:** Der
[SQL-Folgenachweis](cemaris-manual-case-follow-ups-sql-verification.md) ist
inzwischen ausgeführt und bestanden, einschließlich zweier EF-Korrekturen,
atomarem Rollback, Parallelrennen und persistenter Historie nach
Anwendungshostwechsel. Die folgenden Angaben bewahren den Stand des
ursprünglichen Implementierungsauftrags mit damals untersagter SQL-Ausführung.

Status: **Der beauftragte manuelle Kern ist durch alle Schichten implementiert
und synthetisch geprüft.** Die neue Migration wurde ausschließlich offline
erstellt und geprüft. SQL-kategorisierte Tests sind ergänzt und kompiliert,
ausdrücklich nicht ausgeführt. Es gibt keinen neuen Nachweis persistenter
Wiedervorlagen nach SQL-Hostneustart und keine Produktivfreigabe.

Grundlagen sind die [ausgeführte Übergabe](cemaris-manual-case-follow-ups-next-step-handoff.md),
der [Produktvertrag](../requirements/manual-case-follow-ups-decisions.md),
[ADR-0020](../decisions/ADR-0020-manual-case-follow-ups.md) und die
[aktualisierte Roadmap](cemaris-first-operational-version-roadmap.md).

## Ausgangslage und erhaltener Bestand

Die vollständige Git-Prüfung vor Änderungen ergab `main`, HEAD
`b6a958d604cc0eebc3dd628e8c802161f8456565`, Upstream `origin/main`,
Ahead/Behind 0/0, leeren Index und sauberen Arbeitsbaum einschließlich
unversionierter Dateien. Die Vorbereitung und Beisetzungsauswahl waren bereits
committed. Es erfolgte kein Reset, Staging oder Commit.

Arbeitswurzel war ausschließlich das Repository. Die geforderten Ausgangsdokumente
und betroffenen Implementierungen wurden gelesen. Beisetzungsauswahl,
GUID-Zuordnung, Generation-Requests, Formularreset, AbortSignal- und
Generation-Sicherheitsprüfungen bleiben erhalten. Im 6c-Panel wurde allein
der Einleitungstext geändert und ein gezielter Regressionstest ergänzt.

## Umgesetztes Verhalten

- Gemeinsame Navigation und Arbeitsübersicht für Sachbearbeitung und Administration;
  Anlage in genau einer synthetischen Fallakte, ohne persönliche Zuweisung.
- Titel nach Trim 1–200, optionale Beschreibung bis 2.000 Zeichen und manuell
  gewählter Kalendertag. Vergangene Tage, Schaltjahr und der DateOnly-Bereich
  werden unterstützt; die Anzeige zerlegt das ISO-Datum ohne Zeitzonenkonversion.
- Anlegen mit Version 1; begründetes Ändern/Verschieben, Erledigen, Abbrechen
  sowie Wiederöffnung aus beiden abgeschlossenen Zuständen. Pflichtbegründung
  1–1.000 Zeichen. Keine unveränderten Revisionen, unerlaubten Übergänge oder
  physischen Löschungen; Fallbezug bleibt unveränderlich.
- Eigene monotone Version, vollständige Fachrevision je erfolgreicher Operation
  und atomarer inhaltsarmer Audit. Akteur, Zeit und IDs kommen vom Server.
  Kein Audit mit Titel, Beschreibung, Begründung oder Personen-/Grabnamen.
- Fall-, Grab-, Beisetzungs-, Rechte- und Bescheiddaten werden nicht geändert.
  Keine automatische Fristberechnung, E-Mail oder Dokumenterzeugung.
- Listen mit `Open` als Default, `Completed`, `Cancelled` oder `All`, optionalem
  inklusivem `dueUntil`, Seite ab 1 und Seitengröße 10/25/50. Sortierung nach
  Datum, UTC-Erstellzeit und SQL-GUID-Reihenfolge; `SqlGuid` stellt diese im
  Speicher nach. SQL filtert, zählt und projiziert den begrenzten Seitenausschnitt.
- Aktueller kanonischer Fallgrabbezug mit ehrlichen Ersatzanzeigen und Fall-ID;
  keine Beschreibungen oder Revisionen in Listen und keine Detailanfragen pro Zeile.
- URL-Filter, Seitennavigation und Rücksprung zur Übersicht; Lade-, Leer- und
  Fehlerzustände, Formularreset und Schutz vor verspäteten Antworten.
  Nach 412 bleiben lokale Eingaben erhalten. Bewusstes Neuladen aktualisiert
  Detail, Liste und ETag; vor erneutem Speichern weist die UI auf die Prüfung hin.

## API und Schutzgrenzen

| Route | Verhalten |
| --- | --- |
| `GET /api/case-follow-ups` | gemeinsamer paginierter Arbeitsvorrat |
| `GET /api/cases/{caseId}/follow-ups` | paginierte Fallliste |
| `POST /api/cases/{caseId}/follow-ups` | Anlage, 201 mit Location und eigenem ETag |
| `GET /api/case-follow-ups/{id}?caseId=…` | geschütztes Detail mit vollständiger Fachhistorie und ETag |
| `PUT /api/case-follow-ups/{id}?caseId=…` | begründete Änderung mit aktuellem If-Match |
| `POST /api/case-follow-ups/{id}/complete`, `/cancel`, `/reopen`, jeweils mit `caseId` | expliziter begründeter Übergang mit aktuellem If-Match |

`Features:CaseFollowUpsEnabled` ist unabhängig von allen anderen Capabilities,
portabel in beiden appsettings-Dateien `false` und außerhalb `Development`
nicht aktivierbar. Systeminfo und UI behandeln fehlende Werte deaktiviert.
Neue Routen fehlen bei deaktivierter Funktion. Testdefaults bleiben ebenfalls
aus; nur die dedizierte neue Testfactory aktiviert den Bereich ausdrücklich.

Alle Routen verwenden die Policy `CaseFollowUps` für beide vorhandenen Rollen;
Mutationen zusätzlich den bestehenden CSRF-Schutz. Anonym ergibt 401,
abgewiesene Identität/Rolle 403, ungültige Angaben 400, fehlender/fremder
Fallbezug 404, unzulässiger Zustand oder nichtsynthetisches Mutationsziel 409.
Starke numerische ETags folgen der vorhandenen Versionskonvention; die explizite
Übergabe konkretisiert fehlende/schwache ETags auf 428 und sonst ungültige auf
400. Veraltete Versionen ergeben 412. Ältere Routen bleiben unverändert.

Ein auf die neuen Endpunktmetadaten begrenzter ExceptionHandler bildet auch
Binderfehler in inhaltsarme HTTP-400-Antworten ab. Diese waren im ersten
Integrationslauf durch den vorhandenen globalen Handler als 500 beantwortet
worden. Unerwartete neue Endpunktfehler liefern eine generische 500-Antwort
ohne Protokollierung der Exception samt möglicher Eingabe-/Datenbankinhalte.
OpenAPI beschreibt die neuen Routen und Fehlermodelle.

## Geänderte Implementierungen

| Bereich | Dateien relativ zur Repositorywurzel |
| --- | --- |
| Domain | `src/Cemaris.Domain/CaseFollowUps/CaseFollowUpRules.cs` |
| Application | `src/Cemaris.Application/CaseFollowUps/CaseFollowUpModels.cs`, `CaseFollowUpChanges.cs`, `CaseFollowUpService.cs` |
| Provider | `src/Cemaris.Infrastructure/CaseFollowUps/SyntheticCaseFollowUpStore.cs`, `EfCaseFollowUpStore.cs`; `DependencyInjection.cs` |
| Persistenz | `Persistence/CaseFollowUps/CaseFollowUpEntities.cs`, `CaseFollowUpMapping.cs`, `Persistence/CemarisDbContext.cs` unter Infrastructure |
| Schema | `Persistence/Migrations/20260908062036_AddManualCaseFollowUps.cs`, zugehöriger Designer und `CemarisDbContextModelSnapshot.cs` unter Infrastructure |
| API | `src/Cemaris.Api/CaseFollowUpEndpoints.cs`, `ErrorHandling/CaseFollowUpExceptionHandler.cs`, `Program.cs`, `Security/CemarisSecurity.cs`, `Contracts/SystemInformationResponse.cs`, beide appsettings-Dateien |
| Frontend | `src/Cemaris.Web/src/components/CaseFollowUpsPanel.tsx` und `.css`, `pages/CaseFollowUpsPage.tsx`, `types/caseFollowUps.ts`, `types/system.ts`, `api/cemarisApi.ts`, `App.tsx`, `layouts/AppLayout.tsx`, `pages/CaseDetailsPage.tsx` |
| Begleitkorrektur | `src/Cemaris.Web/src/components/NoticeDraftPanel.tsx` und `.test.tsx` |
| Neue Tests | `tests/Cemaris.UnitTests/CaseFollowUpRulesTests.cs`; `CaseFollowUpEndpointTests.cs`, `CaseFollowUpSchemaTests.cs`, `CaseFollowUpWebApplicationFactory.cs`, `SyntheticCaseFollowUpStoreTests.cs`, `SqlServerCaseFollowUpTests.cs` unter IntegrationTests; `CaseFollowUpsPanel.test.tsx` im Frontend |
| Testisolation | `tests/Cemaris.IntegrationTests/TestConfiguration.cs` |

Abschluss, Übergabestatus, Produktvertrag, Roadmap, Root-README sowie
Implementierungs-, Anforderungs-, Architektur- und ADR-Indizes wurden aktualisiert.
Personen-/Nutzungsrechtsakte und Prototypentscheidung verweisen auf den Abschluss;
historische ADRs und bereits datierte Gateergebnisse wurden nicht umgeschrieben.

## Offline-Schema und nicht ausgeführte SQL-Prüfungen

Das bestehende Rootmanifest `dotnet-tools.json` wurde wiederhergestellt.
EF erzeugte die reguläre Migration
`20260908062036_AddManualCaseFollowUps` über einen temporären
Design-Time-Factory-Helfer mit nicht nutzbarer synthetischer Konfiguration
(`127.0.0.1`, Port 1). Dabei startete kein regulärer Host und es wurde keine
Datenbankverbindung geöffnet. Der Helfer wurde anschließend entfernt und neu gebaut.

Die Migration fügt ausschließlich drei Tabellen und acht Indizes hinzu.
Sie enthält Längen-/Status-/Versionsconstraints, `date`, einen eigenen
Concurrency-Token sowie zusammengesetzte Eintrag-/Fall-Fremdschlüssel und
eindeutige Nachweisversionen. Alte Migrationen bleiben unverändert.
Das SQL-Skript vom Vorgänger `20260828062953_AddNoticeGenerationDraftDocuments`
zur neuen Migration wurde offline erzeugt und geprüft. Es enthält neue Tabellen,
Indizes und den EF-Migrationshistorieneintrag; keine Änderung alter Fachdaten.
`ef migrations has-pending-model-changes` meldete keine Änderungen.
Der neue permanente Schematest bestätigt Additivität und Modelldrift ebenfalls
ohne Verbindungsöffnung.

Der SQL-kategorisierte Test ergänzt Lesen in einem neuen DbContext,
Filter-/Sortierparität, zwei tatsächlich parallel vorgesehene SaveChanges-Aufrufe,
Rollback bei absichtlicher Revisions-/Audit-ID-Kollision und unveränderte
vorhandene Falldaten einschließlich der bestehenden Migrationsfixture-Nachweise.
Er ist nur kompiliert. Weder SQL-Tests noch `database update`, Datenbankmaintenance,
EDWALT, Backup oder Restore wurden ausgeführt. `Cemaris_Dev`,
`Cemaris_Dev_RestoreCheck_20260902` und vorhandene Sicherungen wurden nicht geöffnet
oder von Testfixtures verwaltet. Es wurde kein SQLite-/EF-InMemory-Ersatz als
SQL-Nachweis verwendet.

## Tatsächlich ausgeführte Qualitätsprüfungen

Alle .NET-Aufrufe verwendeten ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.
Für ausgeführte Host-/Testassemblies wurde `-p:UserSecretsId=` beim Build
verwendet. Das entfernt das automatische UserSecrets-Attribut ausschließlich
aus diesem Build; Quelldateien und Maschinenkonfiguration bleiben unverändert.
Das Fehlen des Attributs wurde vor Hoststart geprüft und im Browserhost assertiert.
Secrets wurden nicht gelesen oder verändert.

| Prüfung | Neues Ergebnis vom 08.09.2026 |
| --- | --- |
| Solution-Restore `--locked-mode` | erfolgreich |
| `dotnet format Cemaris.sln --verify-no-changes --no-restore` | erfolgreich |
| Release-Solution-Build nach Entfernen temporärer Quellen | erfolgreich, 0 Warnungen, 0 Fehler; SQL-Tests und EDWALT nur kompiliert |
| Unit-Tests Release, `--no-build --no-restore` | 95/95 bestanden |
| Integrationstests Release, `--no-build --no-restore --filter "Category!=SqlServer"` | 79/79 bestanden, keine übersprungenen Tests in dieser Auswahl |
| Frontend `npm ci` | erfolgreich |
| Frontend `npm run test -- --run --maxWorkers=2` | 84/84 in 13 Dateien bestanden |
| Frontend `npm run lint`, `npm run build` | erfolgreich |
| NuGet einschließlich transitiver Pakete; `npm audit` | keine bekannten verwundbaren Pakete gemeldet |

Die neuen Tests decken Validierung, Übergangsmatrix, Datum und No-op-Verhalten,
zwei Fälle, Gleichstände/SqlGuid, alle Statusfilter, inklusive Datumsgrenze,
letzte/leere Seiten, atomare Nachweise und unveränderte Fallaggregate ab.
HTTP prüft beide Cookie-Rollen, alle Routen anonym, abgewiesene Rolle und
Passwortwechselpflicht, CSRF, ETags, Fallzuordnung, nichtsynthetische Ziele,
Capability/Development und OpenAPI. Frontendprüfungen sichern die Aktionen,
Reset, Eingabeerhalt, URL-Zustand, verspätete Antworten und echte Ladefehler.

Vor der 6c-Korrektur wurde der alte Text „keine … Bescheiderzeugung“ im
gezielten neuen Test als Widerspruch zur sichtbaren Erzeugung reproduziert.
Danach bestand der gesamte Paneltest mit 16 Fällen. Der Text beschreibt nun
manuelle Arbeitsstände und eine gegebenenfalls aktivierte flüchtige, rechtlich
wirkungslose Entwurfsausgabe ohne Festsetzung, Bekanntgabe oder Berechnung.
Frühere PDF-Nachweise wurden nicht als neuer Wiedervorlagennachweis übernommen.

Zwischenläufe hatten behebbare Befunde: drei HTTP-Validierungsprüfungen erhielten
zunächst 500 statt 400; die gezielte Handlerkorrektur behebt dies. Ein Schematest
setzte zunächst eine andere Metadaten-Reihenfolge voraus; die Whitelist wird
nun explizit ordinal sortiert verglichen. Die obigen Zahlen stammen aus den
abschließenden vollständigen Läufen nach diesen Korrekturen.

## Isolierter Browserlauf

Ein temporärer Kestrel-Testhost nutzte den regulären API-Content-Root,
`Development`, ausschließlich `127.0.0.1:5059`, `Synthetic` und nachweislich
`TestLocalAccountStore`. Vite lief auf `127.0.0.1:5179 --strictPort` mit
prozesslokalem Proxyziel. Vorher waren die Ports frei. `CaseFollowUps` und nur
für die Anlage der synthetischen Fälle `CaseEditing` waren prozesslokal aktiv.
NoticeGeneration und sämtliche Maintenance-Schalter blieben aus.

Playwright nutzte die vorhandene lokale Bibliothek und vorhandenes Edge,
keine Installation oder neue Projektabhängigkeit. Zwei getrennte Browserkontexte
meldeten sich regulär im Loginformular als synthetische Administration und
Sachbearbeitung an. Der abschließende vollständige Lauf bestätigte:

1. Zwei synthetische Fälle über den bestehenden API-Vertrag; drei Wiedervorlagen
   über das Fallformular einschließlich beobachtetem Reset. Zehn zusätzliche
   synthetische Einträge über die neue API erzeugten insgesamt 13 für Pagination.
2. Gemeinsames Wiederfinden, zweite Seite und Reload, inklusive Datumsfilter;
   Tab vom fokussierten Seitengrößenfeld zum Anwenden und Auslösung mit Enter.
3. Beide Sitzungen öffneten denselben Stand. Nach Verschieben durch Administration
   erhielt der veraltete Schreibversuch der Sachbearbeitung tatsächlich 412.
   Titel, Datum und Begründung blieben beim bewussten Reload erhalten;
   anschließend wurde mit aktueller Version erfolgreich gespeichert.
4. Erledigung, Wiederöffnung, Abbruch und erneute Wiederöffnung des ersten
   Eintrags bis Version 7; Abbruch des zweiten und Erledigung des dritten
   Eintrags bis jeweils Version 2. Insgesamt 13 Einträge und 21 erfolgreiche
   Eintrags-/Revisions-/Auditoperationen im entbehrlichen Speicherhost.
5. Verständliche Historie, alle drei Status sowie getrennte Abschlussfilter,
   Rücksprung zur identischen Übersichts-URL, Desktop bei 1440 Pixeln und
   schmale Ansicht bei 390 Pixeln. Screenshots wurden visuell geprüft;
   kein horizontaler Überlauf wurde gemessen.
6. Vollständige Fallantworten beider Fälle vor/nach den Wiedervorlagenoperationen
   waren identisch. Beide Konten wurden über das Kontomenü abgemeldet;
   anschließend lieferte die Wiedervorlagen-API in beiden Kontexten 401.
   Keine JavaScript-Seitenfehler; Browserprüfprozess Exitcode 0.

Ein früher Browserdurchlauf stoppte an einem unpassenden Statusfilter-Locator;
ein ergänzender Tastaturlauf erwartete irrtümlich nur einen Tab-Schritt aus dem
segmentierten nativen Datumsfeld. Nach Korrektur der Prüfskripte wurde jeweils
ein frischer Speicherhost verwendet; der letzte Gesamtlauf bestand einschließlich
Tastatur und beider Abmeldungen. Diese Diagnoseabbrüche sind keine erfolgreichen
Gesamtnachweise. Die übrigen temporären Daten bestanden nur im jeweiligen Host.

Nach dem Browserlauf startete ein frischer Host mit deaktivierten Capabilities:
Health 200, `caseFollowUpsEnabled=false`, `noticeGenerationEnabled=false`,
`caseEditingEnabled=false`, Wiedervorlagenroute 404. Auch dieser Host wurde beendet.
Dieser Wiederanlauf prüft Deaktivierung, ausdrücklich keine Speicherpersistenz.

## Bereinigung und nächster konkreter Nachweis

Temporärer Design-Time-Code und Browserhost-Verknüpfung wurden entfernt und
die Solution anschließend neu gebaut. Eigene Hosts wurden beendet; temporäre
Prüfskripte, Marker, SQL-Skript und Screenshots unter der vorab auf Kollision
geprüften Wurzel `tmp/manual-follow-ups-20260908` wurden bereinigt.
Portable Capabilities bleiben deaktiviert. Es gab keine maschinenweiten
Umgebungsänderungen, keine Browserinstallation und keine neuen Projektabhängigkeiten.

Beide DOCX-SHA-256 stimmen vor/nach der Sitzung überein:

- API-Testvorlage: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- Beispielvorlage: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Von `tmp/pagination-build` wurden ausschließlich unveränderte Wurzelmetadaten
verglichen; weder Inhalt noch Unterverzeichnisse wurden geöffnet oder aufgelistet.
Lokale Markdown-Links/Anker, Tabellen, Codezäune, finale LF, Whitespace,
Änderungsheuristik und `git diff --check` wurden abschließend geprüft.
Die Dokumentationsprüfung erfasste 126 Markdown-Dateien, 722 lokale Links,
30 Ankerverweise, 225 Tabellen und 45 geschlossene Codezäune ohne Befund.
Die Heuristik prüfte Diffs sowie neue Dateien; ein Variablenverweis auf das
vorhandene synthetische Testkennwort wurde manuell als solcher eingeordnet.
Es blieben keine Secret- oder Fremdpfadkandidaten offen. Dies ist eine
begrenzte Änderungsheuristik, kein umfassender Sicherheitsnachweis.
Der Git-Endstand bleibt auf demselben HEAD, `origin/main` 0/0 und mit leerem
Index: 26 geänderte vorhandene und 25 neue Dateien, insgesamt 51. Die Umsetzung
liegt ausschließlich als unstaged Änderungen und neue Dateien zur Prüfung vor.

Der nächste konkrete offene Nachweis ist das tatsächliche SQL-Server-Verhalten
der neuen Migration und Stores einschließlich Persistenz, Parallelrennen und
Rollback auf einer gesondert autorisierten entbehrlichen Testdatenbank.
Dieser Auftrag liefert dafür kompilierte Tests, keine Ausführungserlaubnis.
Die weiteren M2–M5-Fachentscheidungen und die persistente lokale Kontoanmeldung
bleiben offen. Es wird weder absolute Fehlerfreiheit noch die Einsatzreife der
gesamten Friedhofsverwaltung behauptet.
