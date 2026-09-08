# Nächster Schritt: manuelle fallbezogene Wiedervorlagen

Stand: 08.09.2026 (Auftrag vom 07.09.2026)

Status: **Ausgeführt.** Implementierung, isolierter Browserlauf und aktuelle
Qualitätsprüfungen sind im [Abschluss](cemaris-manual-case-follow-ups-completion.md)
belegt. Im ursprünglichen Auftrag wurden SQL-Tests nur ergänzt und kompiliert
und die Migration offline geprüft. Nach ausdrücklicher weiterer Beauftragung
ist der [SQL-Folgenachweis](cemaris-manual-case-follow-ups-sql-verification.md)
einschließlich Migration auf entbehrlichen Testdatenbanken bestanden. Der folgende Text
bewahrt den ursprünglichen Auftrag und ist keine erneute Ausführungsaufforderung.
Die damalige Vorbereitung veränderte ausschließlich Dokumentation. Die Produktantworten
zum gemeinsamen Arbeitsvorrat und zusätzlichen Abbruchstatus sind bereits
eingeholt und dürfen nicht erneut als allgemeine Freigabefrage gestellt werden.

## Auftrag und erforderliche Ergebnisse

Implementiere den ersten kanonischen manuellen Wiedervorlagenkern vollständig
über Domain, Application, Synthetic-/EF-Provider, additive Schemaartefakte,
API, React-Oberfläche und Regressionstests. Maßgeblich ist der vollständige
[Produktvertrag](../requirements/manual-case-follow-ups-decisions.md).
Die [Roadmap zur ersten alltagstauglichen Version](cemaris-first-operational-version-roadmap.md)
ist vorbereitet. Prüfe und aktualisiere ihren tatsächlichen Stand, ohne daraus
einen Auftrag zur Implementierung aller späteren Meilensteine zu machen.

Das Endergebnis dieses Inkrements ist ein gemeinsamer Arbeitsvorrat ohne
persönliche Zuweisung. Wiedervorlagen gehören zu genau einer Fallakte und
lassen sich anlegen, ändern/verschieben, erledigen, abbrechen und wieder
öffnen. Offene, erledigte und abgebrochene Einträge bleiben mit eigener
Version und Fachhistorie nachvollziehbar. Keine automatische Fristberechnung,
keine E-Mail, keine fachliche Statuswirkung auf Grab, Beisetzung oder Recht.

Als kleine zusätzliche Korrektur den
[bekannten Einleitungstextbefund](cemaris-notice-generation-burial-selection-completion.md#nächster-konkreter-befund)
im Bescheidpanel beheben: Bei sichtbarer Erzeugung darf der Text nicht zugleich
deren Existenz verneinen. Den konkreten Text vor Änderung reproduzieren,
verständlich auf manuellen Entwurf und flüchtige Ausgabe beziehen und mit
gezielter UI-Prüfung absichern. Keine weiteren 6c-Funktionsänderungen.

Nicht bei einem Plan oder Gerüst aufhören. Implementierung und unabhängige
Prüfungen bis zum nachgewiesenen Abschluss durchführen. Fehlende echte
SQL-Ausführung ausdrücklich getrennt ausweisen; niemals einen Speicherstore
oder bloß kompilierten EF-Code als Persistenznachweis nach Hostneustart ausgeben.
Absolute Fehlerfreiheit und Einsatzreife der Gesamtsoftware nicht behaupten.

## Arbeitswurzel, Werkzeuge und Git-Ausgangslage

Einzige Arbeitswurzel:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Antworten und Dokumentation auf Deutsch. Keine externen EDWALT-, Phase-,
Satzungs-, DMS- oder Vorlagenarbeitswurzeln öffnen. Von `tmp/pagination-build`
ausschließlich Wurzelmetadaten vor/nach der Arbeit vergleichen; keine Inhalte
öffnen, auflisten oder verändern. Eigene neue Prüfdateien nur unter einer
vorher auf Kollisionsfreiheit geprüften neuen Repository-`tmp`-Wurzel.

Vor jeder Änderung den tatsächlichen vollständigen Git-Stand prüfen:
Branch, HEAD, Upstream, Ahead/Behind, Index, Arbeitsbaum, unversionierte Dateien
und vollständige Diffs. Bei Vorbereitung: `main`, HEAD
`e79561b570d56ce18c7f250c59eac7dfb9096c8e`, Upstream `origin/main`, Ahead/Behind
1/0. Beisetzungsauswahl und diese Dokumentation waren noch nicht committed.
Der Benutzer will sie prüfen und committen; der neue Chat muss den dann
tatsächlichen Stand verwenden. Keine alte HEAD-ID erzwingen. Vorhandene
Änderungen vollständig erhalten; kein Reset, Staging oder Commit.

Alle .NET-Befehle ausschließlich mit:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

| Zweck | Arbeitsverzeichnis relativ zur Repositorywurzel |
| --- | --- |
| Solution und .NET-Qualitätsläufe | `.` mit `Cemaris.sln` |
| Domain | `src/Cemaris.Domain` |
| Application | `src/Cemaris.Application` |
| Infrastructure und EF-Modell | `src/Cemaris.Infrastructure` |
| API und regulärer Content-Root | `src/Cemaris.Api` |
| Frontend; alle npm-Befehle | `src/Cemaris.Web` |
| Unit-Tests | `tests/Cemaris.UnitTests` |
| Integrations- und Browsertest-Infrastruktur | `tests/Cemaris.IntegrationTests` |
| Dokumentation | `docs/implementation`, `docs/requirements`, bei Bedarf `docs/decisions` |

Das vorhandene .NET-Werkzeugmanifest heißt `dotnet-tools.json` in der Wurzel,
nicht `.config/dotnet-tools.json`. Pfade vor Verwendung prüfen.

## Zuerst vollständig lesen

1. Diese Übergabe und
   [manual-case-follow-ups-decisions.md](../requirements/manual-case-follow-ups-decisions.md).
2. [Roadmap](cemaris-first-operational-version-roadmap.md), Root-README,
   SECURITY.md und aktueller Schwerpunkt im Implementierungsindex.
3. [Projektentscheidung vom 07.09.2026](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
   Frühere allgemeine Variante-A-Stop-Regeln nicht als erneute Hürde vorziehen.
4. [Personen-/Nutzungsrechtsvertrag](../requirements/person-usage-rights-deadlines-decisions.md),
   insbesondere die neue Ergänzung für manuelle Wiedervorlagen und die weiterhin
   offenen Frist-/Lebenszyklusregeln; ADR-0016, ADR-0018 und ADR-0019.
5. [Beisetzungsauswahl-Abschluss](cemaris-notice-generation-burial-selection-completion.md)
   und danach den tatsächlich betroffenen Code. Der vorherige
   [Praxistest](cemaris-notice-generation-prototype-trial-completion.md) ist
   ergänzende Browser-/Werkzeugevidenz, kein erneut offener Gesamtauftrag.

## Bestehende Arbeitsdateien und Orientierung

Diese Pfade wurden bei Vorbereitung im Repository geprüft. Vor Änderung
jeweiligen Inhalt vollständig lesen; Vorbilder nicht ohne Prüfung kopieren.

| Aufgabe | Vorhandene Dateien/Pfade |
| --- | --- |
| Domainvalidierung und eigener Status | `src/Cemaris.Domain/NoticeDrafts/NoticeDraftRules.cs` |
| Commands, Storevertrag, Akteur/Zeit | `src/Cemaris.Application/NoticeDrafts/NoticeDraftModels.cs`, `INoticeDraftStore.cs`, `NoticeDraftService.cs`; außerdem `src/Cemaris.Application/Identity` |
| Fallreferenz und kanonischer Lesepfad | `src/Cemaris.Application/Cases/ICaseReadStore.cs`, `CaseReadModels.cs`; `src/Cemaris.Infrastructure/ReadModel/SyntheticCaseReadStore.cs`, `EfCaseReadStore.cs` |
| Atomare Speicherprovider als Vorbild | `src/Cemaris.Infrastructure/NoticeDrafts/SyntheticNoticeDraftStore.cs`, `EfNoticeDraftStore.cs`; `src/Cemaris.Infrastructure/SyntheticStoreCoordinator.cs` |
| EF und Registrierung | `src/Cemaris.Infrastructure/Persistence/CemarisDbContext.cs`, `Persistence/NoticeDrafts/NoticeDraftEntities.cs`, `Persistence/Migrations/CemarisDbContextModelSnapshot.cs`, `src/Cemaris.Infrastructure/DependencyInjection.cs` |
| Routen, ETag, CSRF | `src/Cemaris.Api/NoticeDraftEndpoints.cs`, `PersonUsageRightEndpoints.cs`, `Security/CemarisSecurity.cs` und die Antiforgery-Helfer unter `Security` |
| Capability und Systeminfo | `src/Cemaris.Api/Program.cs`, `Contracts/SystemInformationResponse.cs`, `appsettings.json`, `appsettings.Development.json` |
| UI-Routing, Navigation, Systemtypen | `src/Cemaris.Web/src/App.tsx`, `App.test.tsx`, `layouts/AppLayout.tsx`, `types/system.ts`, `api/cemarisApi.ts` |
| Fallpanel, Fehler und Liste | `src/Cemaris.Web/src/pages/CaseDetailsPage.tsx`, `CaseDetailsPage.test.tsx`, `PartiesPage.tsx`; `components/useFormFeedback.tsx`, `FormErrorSummary.tsx`; `src/Cemaris.Web/src/App.css` |
| Bestehende 6c-Regressionsgrenze | `src/Cemaris.Web/src/components/NoticeDraftPanel.tsx`, `NoticeDraftPanel.test.tsx`, `pages/CaseEditPage.tsx`, `pages/NewCasePage.tsx` |
| API-/Provider-Testvorbilder | `tests/Cemaris.IntegrationTests/NoticeDraftEndpointTests.cs`, `SyntheticNoticeDraftStoreTests.cs`, `NoticeDraftWebApplicationFactory.cs` |
| Isolierung und Browserkonten | `tests/Cemaris.IntegrationTests/TestConfiguration.cs`, `TestIdentity.cs`, `TestLocalAccountStore.cs` |
| SQL-Testvorbild, nur lesen/erweitern | `tests/Cemaris.IntegrationTests/SqlServerNoticeDraftTests.cs`, `SqlServerIntegrationFixture.cs`, `SqlServerFactAttribute.cs` |

Bei neuen Dateien empfiehlt sich der konsistente Modulname `CaseFollowUps`:
Domain-/Application-Verträge, Synthetic-/EF-Store und EF-Entitäten in den
entsprechenden Schichten; `CaseFollowUpEndpoints.cs` in der API;
`types/caseFollowUps.ts`, `pages/CaseFollowUpsPage.tsx` und
`components/CaseFollowUpsPanel.tsx` im Frontend samt Tests. Diese Dateien sind
geplant und dürfen nicht als bereits vorhanden vorausgesetzt werden.

## Umsetzungsschnitt

1. Den Produktvertrag einschließlich Übergangsmatrix, Wiederöffnung von
   `Completed` und `Cancelled`, unveränderlichem Fallbezug, eigener Version,
   Pflichtbegründung und Grenzen technisch umsetzen. Keine DateTime-
   Verschiebung eines manuell eingegebenen Kalendertags.
2. Eintrag, vollständige Fachrevision und inhaltsarmen Audit in beiden
   Providern atomar schreiben. Fall-/Grab-/Rechte-/Bescheiddaten und deren
   Versionen bleiben durch Wiedervorlagenoperationen unberührt. Keine
   ungeschützte Freitextprotokollierung, keine Audit-Lese-API.
3. Neue Capability `Features:CaseFollowUpsEnabled` mit portablem Default `false`
   und Startverweigerung außerhalb `Development`. Sie hat keine Abhängigkeit
   von Dokumenterzeugung oder anderen Bearbeitungscapabilities. Eigene Policy
   `CaseFollowUps` mit den bestehenden Fallarbeitsrollen. Alle Mutationen
   verlangen CSRF; Änderungen und Übergänge zusätzlich starken aktuellen ETag.
4. Die Isolationsschlüsselliste in `Program.cs` und die Defaults in
   `TestConfiguration.cs` um die neue Capability ergänzen. Nur der neue
   dedizierte Testhost aktiviert sie ausdrücklich. Systeminfo, API-/UI-Typen
   und deren Fixtures konsistent erweitern; unbekannte/fehlende Capability in
   der UI sicher deaktiviert behandeln. Routen bei deaktivierter Funktion
   nicht registrieren, kein neuer Abruf und keine Bearbeitungsoberfläche.
5. Empfohlene API: paginiertes `GET /api/case-follow-ups`, fallbezogenes
   `GET`/`POST /api/cases/{caseId}/follow-ups`, Detail mit ETag unter
   `GET /api/case-follow-ups/{id}`, Korrektur sowie explizite
   `complete`, `cancel`, `reopen`-Operationen unter dieser ID. Keine ungesicherte
   generische Statuszuweisung. OpenAPI inklusive Fehlermodellen ergänzen.
   HTTP 400 bei ungültigen Angaben, 404 bei fehlender Referenz, 409 bei
   unzulässigem Zustand oder nichtsynthetischem Mutationsziel, 412 bei
   veraltetem und 428 bei fehlendem/schwachem ETag; vorhandene ETag-Konvention
   lesen und abweichende Details begründet dokumentieren.
6. Serverseitige Filterung/Pagination gemäß Produktvertrag, stabile
   providerübergreifende Sortierung, datensparsame Listenantwort und begrenzte
   SQL-Abfragen. Keine N+1-Detailanfragen pro Zeile. Kein Freitext-Suchausbau,
   Kalender oder Dashboard in diesem Schnitt.
7. Navigation „Wiedervorlagen“, Arbeitsübersicht und Fallpanel mit allen
   bestätigten Aktionen. Statusfilter einschließlich abgebrochener Einträge,
   Filter „Fällig bis“, stabile URL-/Seitennavigation und Rücksprung zur Fallakte.
   Lade-/Leer-/Fehlerzustände, Tastaturbedienung und schmale Ansicht beachten.
   Beim ETag-Konflikt Eingaben erhalten, gezieltes Neuladen anbieten. Cleanup,
   AbortSignal und verspätete Antworten bei Filter-/Fallwechsel absichern.
8. Begleitkorrektur des 6c-Einleitungstextes. Bestehende Beisetzungsauswahl,
   GUID-Referenzzuordnung, Generation-Requests, Formularreset und
   AbortSignal-Korrekturen vollständig erhalten.

## Schemaartefakte und Datenbankschutz

Der neue persistente Kern benötigt additive EF-Entitäten, Constraints,
Indizes, Snapshot und eine neue reguläre Migration als Repositoryartefakt.
**Autorisierter Umfang ist die Erstellung und Offline-Prüfung dieser
Schemaartefakte, keine Anwendung auf eine bestehende Datenbank.** Die
frühere migrationsfreie UI-Änderung ist kein Verbot einer neuen Schemadatei
für diesen ausdrücklich vorbereiteten eigenständigen Kern.

Design-Time-Erzeugung muss ohne regulären Hoststart, ohne Secrets und ohne
Datenbankverbindung möglich sein; falls nötig einen eng begrenzten
Design-Time-Helfer mit rein synthetischer nicht nutzbarer Konfiguration
verwenden. Keine Datenbankanmeldung, kein `database update`, kein
`MigrateAsync`, `EnsureCreated`, Seed oder Maintenance-Lauf gegen lokale
Bestände. Temporäre Hilfsdateien entfernen und danach neu bauen.
Bestehende Migrationen nicht umschreiben. Modelldrift offline prüfen.

SQL-kategorisierte Regressionstests für Persistenz, echte konkurrierende
Schreibzugriffe und atomaren Rollback ergänzen, aber im nächsten Auftrag
**nicht ausführen**. Es ist keine gesonderte SQL-Testverbindung autorisiert.
Nicht vorhandene Secrets oder Verbindungen beschaffen. Kein SQLite- oder
EF-InMemory-Test als Nachweis des SQL-Server-Verhaltens ausgeben.

`Cemaris_Dev` niemals öffnen, überschreiben, wiederherstellen, leeren,
zurücksetzen, löschen oder von Testfixtures verwalten lassen.
`Cemaris_Dev_RestoreCheck_20260902` nicht neu erzeugen. Die erhaltene
Sicherung nicht verändern. Keine SQL-Tests, EDWALT-Ausführung,
Altbestandsmigration oder Backup-/Restore-Wiederholung. Fehlender echter
SQL-Nachweis ist im Abschluss ausdrücklich als verbleibende Grenze aufzuführen.

## Geforderte Tests

- Domain/Application: Pflichtfelder, Trim/Leerwerte und Längen, gültige
  Kalendertage einschließlich Schaltjahr, vergangenes Datum, erlaubte und
  verbotene Übergänge, Wiederöffnung beider abgeschlossenen Zustände,
  unveränderte Angaben und fehlende Begründung ohne Teilwirkung.
- Synthetic-/Vertragstests: mindestens zwei Fälle mit mehreren Einträgen,
  alle drei Zustände, Filtergrenze inklusive gewähltem Tag, leere und letzte
  Seite, Gleichstände bei Datum/Erstellzeit und stabile ID-Reihenfolge;
  Audit-/Revisionsatomarität, keine Mutation der referenzierten Fachaggregate.
- HTTP: beide Rollen, anonym 401, abgewiesene Identität/Rolle 403,
  CSRF, fehlende/schwache/veraltete ETags, fremder oder fehlender Fallbezug,
  nichtsynthetisches Ziel, ungültiger Status, ausgeschaltete Capability 404,
  Development-Startgrenze und OpenAPI. Detail/Änderung/Revisionsabruf dürfen
  den Fallbezug nicht umgehen; ID-Manipulation führt nicht zur Fehlzuordnung.
- Frontend: manuelle Anlage, Formularreset, Änderung/Verschiebung,
  Erledigung, Abbruch, Wiederöffnung beider Zustände, verständliche Historie,
  Pflichtbegründung, Konflikt mit Eingabeerhalt, URL-Filter/Pagination,
  Datumsdarstellung ohne Tagesverschiebung, Capability aus, erwarteter Abbruch,
  echter Ladefehler und verspätete Antwort. Vorhandene 6c-Tests bleiben grün.
- SQL-Tests als nicht ausgeführte Kategorie ergänzen: Lesen in neuem
  DbContext, Nebenläufigkeit, Rollback bei Revisions-/Auditfehler,
  Filter-/Sortierparität und Migration ohne Änderung alter Fachbestände.

## Isolierter Browsernachweis

Vorhandene Testkonten über `TestLocalAccountStore` isolieren; `Synthetic` als
Fallprovider allein isoliert die Konten nicht. Dedizierte Factory aus den
vorhandenen Mustern erstellen. Für den Browser reguläre Cookie-Anmeldung im
Loginformular verwenden, keine Produkt-Authumgehung. API nur `Development`
und Kestrel nur `IPAddress.Loopback`; freie Ports vorher prüfen. Vite mit
prozesslokalem `VITE_API_PROXY_TARGET` sowie `--host 127.0.0.1 --strictPort`.
Maintenance `ApplyMigrations`, `EnsureDevelopmentAccounts` und
`EnsureSyntheticDevelopmentData` müssen alle `false` bleiben.

Bewährte Werkzeuge, vor Verwendung auf Existenz prüfen:

- Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Lokale Playwright-Bibliothek:
  `C:\Users\Benke\AppData\Local\npm-cache\_npx\9833c18b2d85bc59\node_modules\playwright`;
  Start über `chromium.launch({ channel: 'msedge' })`.
- Playwright-MCP setzte zuvor nicht vorhandenes Chrome voraus. Keine neue
  Browserinstallation, MCP-Umkonfiguration oder Projektabhängigkeit erzwingen.
- Kontomenü zuerst öffnen, dann „Abmelden“. Auf Fallseiten „Suchen“ auf das
  betreffende Panel begrenzen. Auswahlfelder anhand passender zugänglicher
  Kombinationsfeldnamen finden; explizite Locator-Timeouts verwenden.
- .NET-Builds vor Start der API abschließen; `npm ci` vor Tests/Frontendstart.
  Eigene Hosts nicht während Builds laufen lassen, die ihre DLLs ersetzen.
  Bei blockiertem separatem Hintergrundstart den an die Werkzeugsitzung
  gebundenen Loopback-Start verwenden; keine fremden Prozesse beenden.

Über bestehende Anwendungs-/UI-Verträge zwei synthetische Fälle und mehrere
Wiedervorlagen aufbauen. Im Browser Anlage aus der Fallakte, gemeinsames
Wiederfinden, Datumsfilter, Verschieben, Erledigen, Abbrechen und Wiederöffnen
nachweisen. Eine zweite angemeldete Sitzung für einen veralteten
Änderungsversuch verwenden. Eingabeerhalt, Historie, Neuladen, Desktop- und
schmale Ansicht prüfen. Danach abmelden und anonym HTTP 401 bestätigen.
Eigene Prozesse, Screenshots und Testartefakte bereinigen.

NoticeGeneration bleibt für diesen Browserauftrag deaktiviert. Es ist keine
erneute DOCX-/PDF-Erzeugung nötig, solange nur der genannte Einleitungstext
geändert wird. Der vorhandene echte PDF-Nachweis bleibt ein datierter
Vornachweis. Beide DOCX-Dateien unverändert lassen und SHA-256 vor/nach der
Sitzung vergleichen, ohne ihre Inhalte für den Wiedervorlagenauftrag zu öffnen:

- `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`:
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx`:
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

## Qualitätsläufe und Abschluss

Mit dem festgelegten SDK aus der Wurzel: Solution-Restore `--locked-mode`,
Formatprüfung `--verify-no-changes --no-restore`, Release-Solution-Build,
Unit-Tests und Integrationstests ausdrücklich mit
`--filter "Category!=SqlServer"`. EDWALT darf kompiliert, nicht ausgeführt
werden. Frontend: `npm ci`, `npm run test -- --run --maxWorkers=2`,
`npm run lint`, `npm run build`. NuGet einschließlich transitiver Pakete und
`npm audit` prüfen; ohne Anlass keine Paketupdates oder erhöhten Produktlimits.

Ausgangsnachweis des vorigen Inkrements: 81 Unit-, 70 nicht-SQL-Integrations-
und 70 Frontendtests. Das sind keine bereits bestandenen Tests des neuen Codes.
Neue tatsächliche Zahlen berichten. Entfernten temporären Browser-/
Design-Time-Prüfcode durch abschließenden Neubau auch aus Assemblies entfernen.

Deaktivierten Wiederanlauf prüfen: Health erfolgreich,
`caseFollowUpsEnabled=false`, `noticeGenerationEnabled=false`, neue
Wiedervorlagenroute HTTP 404; auch diesen eigenen Prozess beenden. Keine
portable Aktivierung, User-Secrets- oder maschinenweite Konfigurationsänderung.

Abschluss unter
`docs/implementation/cemaris-manual-case-follow-ups-completion.md` anlegen:
umgesetzter Vertrag, geänderte Dateien, tatsächliche Tests und Browseraktionen,
synthetische Mutationen, Schemaartefakte, nicht ausgeführte SQL-Nachweise,
Bereinigung und nächster konkreter Befund. Diese Übergabe dann als ausgeführt
kennzeichnen, Produktvertrag und Roadmap aktualisieren, README und betroffene
Indizes nachziehen. Architekturentscheidungen konsistent dokumentieren;
historische ADRs nicht rückwirkend umschreiben.

Abschließend lokale Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace,
finale LF, `git diff --check`, Secret-/Fremdbestandsheuristik aller Änderungen,
DOCX-Hashes, ausschließlich Wurzelmetadaten von `tmp/pagination-build`, eigene
Prozess-/Tempreste und vollständigen Git-Endstand prüfen. Nur bei konkreten
nicht aus Vertrag und Repository lösbaren Widersprüchen fragen; unabhängige
Arbeit währenddessen fortsetzen. Kein allgemeines Freigabegate wiederholen.
