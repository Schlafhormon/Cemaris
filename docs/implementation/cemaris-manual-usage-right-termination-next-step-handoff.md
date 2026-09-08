# Nächster Schritt M2a: manueller Nutzungsrechtslebenszyklus

Stand: 08.09.2026

Status: **Am 08.09.2026 technisch abgeschlossen: implementiert, geprüft und bereinigt.**
Der [Abschluss](cemaris-manual-usage-right-termination-completion.md) dokumentiert
die SQL-, Browser- und Regressionsnachweise sowie den tatsächlichen Endstand.
Die zunächst blockierte Prüfwurzel wurde durch den Benutzer entfernt und ihre
Abwesenheit anschließend geprüft. Die nachfolgenden
Arbeitsanweisungen und der Vorbereitungsnachweis bleiben als Übergabehistorie erhalten.
Diese Übergabe dient einem neuen kontextlosen Chat. Verbindlich sind alle fünf
Antworten in der [Produktentscheidung](../requirements/manual-usage-right-termination-decisions.md).
Keine erneute Produktfreigabe und kein allgemeines 5f-/5g- oder Betriebsfreigabegate.
Nur konkrete, aus Repository und Vertrag nicht auflösbare Unklarheiten nachfragen.

Der nächste Auftrag ist inzwischen als [M3a-Übergabe](cemaris-manual-notice-line-items-next-step-handoff.md)
vorbereitet. Seine Gebührenpositionen und DOCX-/PDF-Ausgabe sind separat
bestätigt; die folgende M2a-Übergabe ist kein erneut offener Auftrag.

## Ziel und Umfang

Der bestätigte nächste Schnitt umfasst manuelle Rückgabe oder sonstige Beendigung,
begründete Rücknahme, **manuelle Neuvergabe und gemeinsame Korrektur bestehender
Rechtefolgen**. Sachbearbeitung und Administration dürfen diese Vorgänge ausführen.
Beendigung nur heute oder rückwirkend, mit Datum, Begründung, Quellenreferenz und
manueller Prüfbestätigung. Ursprüngliches Laufzeitende bleibt separat erhalten;
der letzte Inhaberzeitraum wird beendet. Neuvergabe erzeugt eine neue Rechte-ID.
Die bestätigte Folgekorrektur öffnet den Vorgänger und kennzeichnet betroffene
Nachfolgerechte atomar als „Irrtümlich angelegt“. Alle Datensätze und Revisionen
bleiben erhalten. Keine Fristautomatik, automatische Neuvergabe, Grabstatuswirkung,
Dokumenterzeugung oder Änderung an Beisetzungen, Gebühren und Wiedervorlagen.

Diesen Schnitt vollständig über Domain,
Application, Synthetic-/SQL-Provider, kompatible Schemaerweiterung, API, UI, Tests und
isolierten Browserlauf umsetzen. Kein bloßes Gerüst und keine Implementierung
der gesamten [Roadmap](cemaris-first-operational-version-roadmap.md).
Absolute Fehlerfreiheit lässt sich nicht zusagen: tatsächliche Prüfungen,
behobene Befunde und verbleibende Grenzen dokumentieren.

## Arbeitswurzel und tatsächlicher Git-Stand

Einzige Arbeitswurzel:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Antworten und Dokumentation auf Deutsch. Vor Änderungen Branch, HEAD, Upstream,
Ahead/Behind, Index, Arbeitsbaum, unversionierte Dateien und vollständige Diffs
prüfen. Bei Vorbereitung: `main`, HEAD
`b6a958d604cc0eebc3dd628e8c802161f8456565`, `origin/main` 0/0, leerer Index,
52 geänderte/neue Dateien aus M1 und dessen SQL-Folgeauftrag. Die vorliegende
Vorbereitung ergänzt Dokumentation. Der Benutzer will den gesamten Stand prüfen
und committen: dessen tatsächlicher neuer HEAD ist maßgeblich, nicht diese ID.
Kein Reset, Staging oder Commit. Alle vorhandenen Änderungen erhalten.

Insbesondere erhalten: M1 samt explizitem EF-`Add` für neue Revisionen und
Versionsspeicherung vor Nachweisen innerhalb derselben Transaktion; 6c-
Beisetzungsauswahl, GUID-Zuordnung, korrigierter Einleitungstext, Formularreset,
AbortSignal- und Generation-Sicherheitsprüfungen. Keine historischen Migrationen
oder ADRs rückwirkend ändern.

Alle .NET-Befehle ausschließlich mit:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

| Zweck | Arbeitsverzeichnis relativ zur Wurzel |
| --- | --- |
| Solution und .NET-Prüfungen | `.` mit `Cemaris.sln` |
| Domain | `src/Cemaris.Domain` |
| Application | `src/Cemaris.Application` |
| Infrastructure/EF | `src/Cemaris.Infrastructure` |
| API und regulärer Content-Root | `src/Cemaris.Api` |
| Frontend, sämtliche npm-Befehle | `src/Cemaris.Web` |
| Unit-Tests | `tests/Cemaris.UnitTests` |
| Integrationstests und isolierte Hostfixtures | `tests/Cemaris.IntegrationTests` |
| Dokumentation | `docs/requirements`, `docs/implementation`, `docs/decisions` |

Das EF-Werkzeugmanifest heißt `dotnet-tools.json` in der Repositorywurzel.
Eigene Prüfdateien nur unter einer neuen, vorher auf Kollision geprüften
Repository-`tmp`-Wurzel. Von `tmp/pagination-build` ausschließlich
Wurzelmetadaten vergleichen, keine Inhalte öffnen, auflisten oder ändern.

## Zuerst vollständig lesen

1. Diese Übergabe und [Produktentscheidungen M2a](../requirements/manual-usage-right-termination-decisions.md).
2. [Personen-/Nutzungsrechtsvertrag](../requirements/person-usage-rights-deadlines-decisions.md),
   [ADR-0016](../decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md)
   und [5b-Abschluss](cemaris-increment-5b-completion.md). Frühere offene
   Lebenszyklusregeln von inzwischen bestätigten M2a-Antworten unterscheiden.
3. [Roadmap](cemaris-first-operational-version-roadmap.md), Root-README,
   `SECURITY.md` und aktuellen Schwerpunkt im Implementierungsindex.
4. [Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
5. [M1-Abschluss](cemaris-manual-case-follow-ups-completion.md) und insbesondere
   [SQL-Folgenachweis](cemaris-manual-case-follow-ups-sql-verification.md).
   Die vorherige SQL-Sperre galt dem ursprünglichen M1-Auftrag und wurde für den
   gezielten entbehrlichen SQL-Test ausdrücklich aufgehoben.

Danach die tatsächlich betroffenen Dateien vollständig lesen. Historische
Satzungsevidenz nicht als aktuelle Rechtsauskunft oder allgemeinen Produktwert
interpretieren; keine externen Satzungs-, EDWALT-, DMS- oder Vorlagenwurzeln öffnen.

## Verifizierte bestehende Arbeitsdateien

| Aufgabe | Vorhandene Dateien relativ zur Wurzel |
| --- | --- |
| Datums-/Inhaberregeln | `src/Cemaris.Domain/UsageRights/UsageRight.cs`; `src/Cemaris.Domain/Parties/Party.cs` |
| DTOs, Storeport, Akteur und Zeit | `src/Cemaris.Application/PersonUsageRights/PersonUsageRightModels.cs`, `IPersonUsageRightStore.cs`, `PersonUsageRightService.cs` |
| Provider | `src/Cemaris.Infrastructure/PersonUsageRights/SyntheticPersonUsageRightStore.cs`, `EfPersonUsageRightStore.cs`; `src/Cemaris.Infrastructure/SyntheticStoreCoordinator.cs` |
| Schema und DI | `src/Cemaris.Infrastructure/Persistence/PersonUsageRights/PersonUsageRightEntities.cs`, `Persistence/CemarisDbContext.cs`, `Persistence/Migrations/CemarisDbContextModelSnapshot.cs`, `DependencyInjection.cs` |
| API, Policy und Konfiguration | `src/Cemaris.Api/PersonUsageRightEndpoints.cs`, `Security/CemarisSecurity.cs`, `Program.cs`, `Contracts/SystemInformationResponse.cs`, `appsettings.json`, `appsettings.Development.json` |
| Oberfläche | `src/Cemaris.Web/src/components/PersonUsageRightsPanel.tsx`, `pages/CaseDetailsPage.tsx`, `App.tsx`, `types/personUsageRights.ts`, `types/system.ts`, `api/cemarisApi.ts` |
| Formularfehler und bestehende Grenzen | `src/Cemaris.Web/src/components/useFormFeedback.tsx`, `FormErrorSummary.tsx`, `NoticeDraftPanel.tsx`, `NoticeDraftPanel.test.tsx` |
| Vorhandene Tests | `tests/Cemaris.UnitTests/PersonUsageRightRulesTests.cs`; `SyntheticPersonUsageRightStoreTests.cs`, `PersonUsageRightsEndpointTests.cs`, `PersonUsageRightsWebApplicationFactory.cs`, `SqlServerPersonUsageRightTests.cs` unter IntegrationTests; `PersonUsageRightsPanel.test.tsx`, `PersonUsageRightsResponsive.test.tsx` unter Frontend/components |
| Isolierung | `tests/Cemaris.IntegrationTests/TestConfiguration.cs`, `TestIdentity.cs`, `TestLocalAccountStore.cs`, `SqlServerIntegrationFixture.cs`, `SqlServerFactAttribute.cs` |
| Aktuelle SQL-Vorbilder | `src/Cemaris.Infrastructure/CaseFollowUps/EfCaseFollowUpStore.cs`, `tests/Cemaris.IntegrationTests/SqlServerCaseFollowUpTests.cs`, `CaseFollowUpSchemaTests.cs` |

Neue Dateien nach konsistentem Modulnamen anlegen, etwa
`UsageRightLifecycleRules.cs`, `UsageRightLifecycleEndpoints.cs`,
`UsageRightLifecycleWebApplicationFactory.cs`, `UsageRightLifecycleEndpointTests.cs`
und `SqlServerUsageRightLifecycleTests.cs`. Dies sind Vorschläge, keine bereits
vorhandenen Dateien. Bestehende Personen-/Rechteverträge additiv erweitern,
keinen konkurrierenden zweiten Nutzungsrechtsspeicher aufbauen.

## Tatsächlich beobachtete Anschlussstellen

- `UsageRightEntity` und `UsageRightView` besitzen noch kein Zustands- oder
  Beendigungsfeld. Das Schema hat einen **ungefilterten eindeutigen** Index auf
  `GraveSiteId`; beide Provider verweigern derzeit jedes zweite Recht. Ein
  gefilterter „nur offen“-Index darf nicht als bereits vorhanden angenommen werden.
- `FindUsageRightByGraveSiteAsync` liefert bislang über `SingleOrDefault` ein
  einzelnes Recht. Künftig kompatibel das offene, sonst jüngste gültige beendete
  Recht liefern; `Voided` ausschließen. Ergänzenden paginierten Rechteverlauf
  einschließlich irrtümlicher Datensätze mit Auswahl und Detailhistorie implementieren.
- Transfer greift mit `Single` auf den offenen Inhaberzeitraum zu. Beendigte
  und irrtümlich angelegte Rechte deshalb vor allen bestehenden Schreibwegen kontrolliert abweisen;
  nicht erst an einer fehlenden Sequenzposition mit 500 scheitern lassen.
- `UsageRightRevisions.StateJson` enthält vollständige historische Views.
  Neue nullable Felder beziehungsweise kompatible Deserialisierung testen.
  Alte Revisionen niemals rückwirkend umschreiben. Die übrigen Angaben und
  Startregel-Snapshots müssen identisch bleiben.
- Der Synthetic-Store arbeitet teils mit veränderbaren Listen in Records.
  Für neue Übergänge sämtliche Folgestände vorbereiten und erst nach vollständiger
  Prüfung atomar veröffentlichen; ein `with` allein kopiert keine enthaltene Liste.
- Der vorhandene EF-Store verwendet `Serializable` und bildet sämtliche
  `DbUpdateException` pauschal als Duplicate ab. Dies ist kein Beweis korrekter
  Klassifikation eines neuen Parallelrennens. Tatsächlich konkurrierende
  Beendigung/Transfer/Rücknahme/Neuvergabe/Folgekorrektur und Nachweisfehler gezielt prüfen und den
  betroffenen Pfad bei Bedarf korrigieren. M1-Erkenntnisse nicht blind kopieren.
- Der bestehende API-Mutationshelfer lädt nach Mutation erneut und setzt den ETag
  aus dem Mutationsergebnis. Neue Antworten müssen Körper und ETag desselben
  gespeicherten Stands liefern; einen zwischenzeitlichen Folgeschreibvorgang
  ausdrücklich berücksichtigen. Kein pauschaler Umbau aller API-Module.
- Das Rechtepanel zeigt derzeit immer „Offen“, bietet immer alle Schreibaktionen
  an und sein initialer Abruf besitzt noch keinen AbortController. Diese
  betroffenen Stellen auf Zustand, Fall-/Grabstellenwechsel, späte Antworten,
  Reload und Eingabeerhalt absichern. Bestehende behobene M1-/6c-Pfade erhalten.
- `NoticeDraftPanel` sucht einen Inhaber mit `validUntilExclusive === null`.
  Nur ein `Open`-Recht darf einen aktuellen Inhaber vorschlagen. Nach Beendigung
  ist der Vorschlag leer, nach Rücknahme beziehungsweise Neuvergabe wieder passend;
  `Voided` mit historisch offenem Intervall darf keinen Vorschlag liefern.
  Die freie, ausdrücklich bestätigte Zahlungspflichtigenauswahl bleibt bestehen.

## Verbindlicher technischer Umsetzungsschnitt

1. Den bestätigten Produktvertrag, Übergangsmatrix, Prüfbestätigung, getrennten
   Beendigungsnachweis und Inhaberzeitraum ohne zusätzliche Fachautomatiken umsetzen.
2. Stabile Rechte-ID, starke monotone Rechtversion, vollständige neue Fachrevision
   und sparsamer Audit atomar. Bei Folgekorrektur sämtliche betroffenen Rechte
   mit gemeinsamer Vorgangskennung und je eigener Version/Revision/Audit speichern.
   Quellenreferenz/Begründung nur geschützt fachlich
   speichern, nicht im technischen Audit oder ungefilterten Exceptionlog.
3. Neue Capability `Features:UsageRightLifecycleEnabled`, Default `false`, nur
   `Development`, mit erforderlicher vorhandener `PersonUsageRightsEditingEnabled`.
   Keine NoticeGeneration-Abhängigkeit. Program-Isolationsschlüsselliste,
   Testdefaults, Systeminfo, UI-Typen/Fixtures und Registrierung konsistent erweitern.
   Dedizierte Testfactory aktiviert ausdrücklich; ältere Factories bleiben aus.
4. Neue Mutationsrouten etwa `POST /api/usage-rights/{id}/terminations` und
   `POST /api/usage-rights/{id}/termination-reversals`,
   `POST /api/usage-rights/{id}/successors` und
   `POST /api/usage-rights/{id}/sequence-corrections`, vorhandene Policy
   `PersonUsageRights`, CSRF und starker aktueller If-Match. Deaktiviert keine
   neuen Mutationsrouten/Formulare. Lesen aller bereits gespeicherten Zustände und Schutz alter
   Schreibwege bleiben auch nach Abschalten korrekt.
5. Konvention dieses bestehenden Moduls: fehlender ETag 428, ungültiger/schwacher
   400, veralteter 412; nicht unbemerkt durch die abweichende M1-Konvention ersetzen.
   Ungültige Felder/Binder 400, fehlende Referenz 404, Zustand/Eindeutigkeit 409,
   anonym 401, abgewiesene Rolle/Identität 403. OpenAPI und inhaltsarme Fehler ergänzen.
6. Passende zustandsabhängige Formulare und aussagekräftige Historie, lokale
   Eingaben bei Konflikten erhalten, bewusstes Neuladen mit neuem ETag.
   Nach erfolgreicher Anlage/Operation verständliche Rückmeldung und Formularkorrektheit.
   Rechteverlauf mit stabiler Pagination/Sortierung und Auswahl anhand Rechte-ID;
   Historie erst auf Auswahl laden. Vor Folgekorrektur alle betroffenen Rechte
   anzeigen und ausdrücklich gemeinsam bestätigen lassen. Eine serverseitig
   neu ermittelte abweichende Folge erfordert erneutes Laden und Bestätigen.
7. Neue reguläre Migration und Snapshot mit kompatiblen Bestandswerten. Design-Time-Erzeugung ohne
   Secrets/normalen Hoststart; temporären Helfer entfernen und neu bauen.
   Vorhandene kanonische Rechte und JSON-Revisionen unverändert lesbar halten.
   Ungefilterten Grabstellen-Eindeutigkeitsindex kontrolliert durch einen
   eindeutigen gefilterten Index für `Open` ersetzen; Vorgängerbezug, Status und
   Beendigungsfelder ergänzen. Mindestens Schema-/Offline-SQL-Prüfung und auf
   neu angelegten Testdatenbanken die echte Migration prüfen. Niemals die
   Migration auf bestehende Datenbanken anwenden. Alte JSON-Revisionen erhalten.
8. Architekturergänzung als neues ADR (nächste freie Nummer vor Verwendung prüfen),
   ADR-0016 und ADR-0020 nicht rückwirkend umschreiben.
9. Folgekorrektur: Der Server ermittelt A und alle gültigen Nachfolger, prüft
   explizite Bestätigung, Pflichtbegründung, erwartete Version jedes Mitglieds
   sowie unveränderten Folgebestand. Fremde, ausgelassene oder zusätzliche IDs
   abweisen; keine vom Client frei zusammengestellte Korrekturmenge übernehmen.
   A wird wieder offen, B/C werden `Voided`; ihre erfassten Inhaberintervalle und
   Beendigungsfakten bleiben erhalten. Keine erfundenen rückwirkenden Daten.
   Bereits irrtümliche Zweige bleiben unverändert und weiterhin auswählbar.
10. Pro Grabstelle höchstens ein offenes Recht und pro Vorgänger höchstens ein
    gültiger Nachfolger. Neue Vergabe benötigt eigene Prüfbestätigung und aktuelle
    Vorgängerversion; Beginn frühestens am tatsächlichen Beendigungsdatum.
    Keine Zyklen, grabstellenübergreifenden Verknüpfungen oder stille Änderung
    verknüpfter Start-/Grabstellenfakten. Generische Anlage und Korrektur dürfen
    diese Regeln nicht umgehen. Eine bestehende Folge verhindert die einfache
    Rücknahme, muss aber über den gemeinsamen Korrekturvorgang bearbeitbar sein.
11. Transaktionen beziehungsweise Synthetic-Koordination müssen auch neue
    Nachfolger zwischen Vorschau und Speicherung sowie konkurrierende alte
    Schreibwege erfassen. Ein fehlgeschlagener Nachweis oder Versionskonflikt
    hinterlässt keinerlei Teiländerung. Antwortkörper und ETag müssen den gleichen
    Stand beschreiben; Konflikte dürfen nicht pauschal als Duplicate verschwinden.

## Prüfungen und SQL-Schutz

Domain-/Applicationtests für Pflichtfelder, Trim/Längen, Datum/Schaltjahr,
UTC-Tagesgrenze, Rückwirkung nach Transfer, leere Intervalle, Bestätigung,
alle Übergänge, Neuvergabe-Intervallgrenzen und gesperrte Altoperationen. Synthetic-/Vertragstests für
vollständige Revisionen, unveränderte andere Fachaggregate, zwei Fälle/Grabstellen,
gezielte Nachweisfehler und Eingabe-/Versionskonflikte.

Die Prüfmatrix im Produktvertrag ist verbindlich: A → B → C gemeinsam korrigieren,
auch bereits beendete Nachfolger kennzeichnen, veraltete Version jedes Mitglieds,
zwischenzeitlicher zusätzlicher Nachfolger, Fehler in späterer Revision/Audit,
vollständiger Rollback, erneute Beendigung von A und neue Vergabe D bei erhaltenem
irrtümlichem Zweig B/C. Echte SQL-Rennen mit getrennten DbContexts prüfen:
zwei Neuvergaben, Rücknahme gegen Neuvergabe und Folgekorrektur gegen Änderung
eines Nachfolgers. Historische JSON-Views ohne neue Felder und Auswahl sämtlicher
Rechte trotz Pagination prüfen. Keine Änderung fremder Aggregatversionen.

HTTP mit beiden Rollen, Cookie-Anmeldung, CSRF, ETags, ID-/Referenzmanipulation,
deaktivierter Capability, Startgrenze und OpenAPI. UI mit jeder gewählten Aktion,
Fehler-/Lade-/Leerzuständen, erhaltenen Konflikteingaben, erneutem Laden,
erwartetem Abbruch und verspäteten Antworten. Den Inhabervorschlag sowie
vorhandene M1-/6c-Tests gezielt als Regression mitprüfen.

Für den nächsten Implementierungsauftrag gezielte SQL-Tests auf **neu erzeugten,
entbehrlichen** Testdatenbanken verwenden, einschließlich Vorgängermigration,
historischem JSON, echtem Parallelrennen, Audit-/Revisionsrollback sowie
vollständig beendetem und neuem Anwendungshost. Bestehende M1-SQL-Regression
mitnehmen. Die vorhandene Windows-Anmeldung an `.\CEMARISDEV` funktionierte ohne Secrets;
Umgebung und Fixture vor erneutem Einsatz prüfen. Eine fehlende sichere Verbindung
ist kein Anlass, bestehende Datenbanken als Ersatz zu verwenden.

`Cemaris_Dev`, `Cemaris_Dev_RestoreCheck_20260902`, Sicherungen und ältere fremde
Testdatenbanken nicht öffnen, migrieren, seeden oder löschen. Bekannt war
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3`; nur eigenen vor/nach
erzeugten Namensbestand verwalten. Testverbindung ausschließlich prozesslokal
über `CEMARIS_SQL_TEST_CONNECTION_STRING`, anschließend entfernen. Keine Secrets,
EDWALT-Ausführung, Backup-/Restore-Wiederholung oder SQL-Dienstneustarts.

Nicht blind die gesamte SQL-Kategorie als bereits grün voraussetzen: M1 hat nur
seine eigene Klasse ausgeführt. Statische Auffälligkeit bei Vorbereitung:
`SqlServerReadModelTests` erwartet unter anderem sechs Vorgängermigrationen,
während die Fixture acht auflistet. Ein tatsächlicher Fehler dieser anderen
Klasse wurde hier nicht durch Ausführung nachgewiesen. Bei breiterem Testumfang
Erwartungen anhand echter Fixtures prüfen, keine pauschalen Zähleranpassungen.

## Isolierter Browsernachweis

Vorhandenes Edge und lokale Playwright-Bibliothek gemäß M1-Abschluss verwenden,
Existenz vorher prüfen; keine Browserinstallation oder neue Projektabhängigkeit.
API regulärer Content-Root, `Development`, Kestrel nur `IPAddress.Loopback`,
freie Ports vorher prüfen. Vite `--host 127.0.0.1 --strictPort` und prozesslokales
`VITE_API_PROXY_TARGET`. Fallprovider `Synthetic` **und** isolierter
`TestLocalAccountStore`; normale Cookie-Anmeldung im Formular, keine
Produkt-Authumgehung. Alle drei Maintenance-Schalter und NoticeGeneration aus.

Über vorhandene API-/UI-Verträge synthetische Fälle, Grabstellen, Beteiligte,
Startregel und Rechte aufbauen. Beide Rollen, manuelle Beendigung, Rücknahme,
Neuvergabe, bestätigte gemeinsame Korrektur A/B/C und danach neue Vergabe D,
erneutes Öffnen der Ansicht, gesperrte unzulässige alte Mutationen, Historie,
Konflikt in zweiter Sitzung, Eingabeerhalt, Desktop, schmale Ansicht und Tastatur
nachweisen. Nach Änderungen andere Fachaggregate vergleichen. Beide Sitzungen
abmelden und anonym 401 prüfen. Eigene Hosts beenden; frischer deaktivierter
Start mit Health 200, neuer Capability `false` und neuer Route 404; ebenfalls beenden.

Builds müssen **vollständig beendet** sein, bevor irgendein Test-/Browserhost
aus diesen Assemblies startet. `-p:UserSecretsId=` beim Testbuild verhindert
automatisches Laden lokaler User Secrets; vor Hoststart prüfen. Bei `--no-build`
muss der letzte Build diesen Parameter verwendet haben.

## Qualität, Abschluss und Bereinigung

Mit vorgeschriebenem SDK: Restore `--locked-mode`, Formatprüfung
`--verify-no-changes --no-restore`, Release-Build, Unit-Tests, Integrationstests
mit `Category!=SqlServer` und die ausdrücklich ausgewählten isolierten SQL-Tests.
Frontend: `npm ci`, `npm run test -- --run --maxWorkers=2`, `npm run lint`,
`npm run build`; NuGet mit transitiven Paketen und `npm audit`. Keine unnötigen
Paketupdates. SQL-/EF-Code allein ist kein persistenter Ausführungsnachweis.

Datierter Ausgangsnachweis: 95 Unit-, 79 nicht-SQL-Integrations- und 84 Frontendtests,
ein gezielter M1-SQL-Test einschließlich Anwendungshostwechsel. Die ersten beiden
Zahlen wurden nach den EF-Korrekturen erneut geprüft, Frontend/Browser davor.
Für M2a alle tatsächlich neu ausgeführten Ergebnisse und deren Grenzen berichten.

Erstelle `docs/implementation/cemaris-manual-usage-right-termination-completion.md`.
Produktvertrag, Übergabestatus, Roadmap, README und betroffene Indizes aktualisieren.
Dokumentiere konkrete Dateien, Mutationseffekte, SQL-/Browsernachweise, Befunde,
Bereinigung und nächsten fachlichen Schritt. Eigene Tempdateien/Screenshots
entfernen; temporäre Quellhelfer auch durch Neubau aus Assemblies entfernen.

Beide DOCX-Dateien nur anhand SHA-256 vor/nach vergleichen, Inhalte nicht öffnen:

- `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`:
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx`:
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Abschließend lokale Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace,
finale LF, Diffs und neue Dateien mit Secret-/Fremdpfadheuristik,
`git diff --check`, DOCX-Hashes, ausschließlich Wurzelmetadaten von
`tmp/pagination-build`, eigene Prozesse/Testdatenbanken/Tempwurzeln und
vollständigen Git-Endstand prüfen. Keine absolute Fehlerfreiheit behaupten.

## Nachweis dieser Übergabevorbereitung

Am 08.09.2026 wurden Dokumentation und tatsächlich betroffene Codeanschlüsse
geprüft und die fünf Produktantworten eingearbeitet. Geändert wurde in dieser
Vorbereitung ausschließlich Markdown, kein Laufzeitcode und keine Konfiguration.
Die 39 zu Beginn bereits geänderten/neuen Nicht-Markdown-Dateien wurden durch
SHA-256-Vergleich unverändert bestätigt. Der Gesamtstand umfasst 54 geänderte/neue
Dateien, davon 26 versionierte Änderungen und 28 unversionierte Dateien; der Index
ist leer, HEAD unverändert und `origin/main` weiterhin 0/0.

Die lokale Dokumentationsprüfung meldet für 129 Markdown-Dateien, 764 lokale
Links, 32 Anker, 231 Tabellen und 46 geschlossene Codezäune keine Befunde.
Whitespace/finale LF, `git diff --check` sowie eine begrenzte Secret-/Fremdpfad-
Heuristik sind ohne offenen Befund; eine synthetische Testpasswort-Variablenreferenz
wurde als solche geprüft. Dies ist kein vollständiger Sicherheitsscan.
Beide DOCX-Hashes und ausschließlich die Wurzelmetadaten von
`tmp/pagination-build` sind unverändert. Alle vorhandenen Feature-Capabilities
stehen in beiden eingecheckten API-Konfigurationen weiterhin auf `false`.

Für diese reine Vorbereitung wurden keine neuen .NET-/Frontendtests oder
Browserläufe ausgeführt, keine Datenbanken angesprochen und keine Hosts gestartet.
Die eigene temporäre Prüfwurzel wurde anschließend entfernt und ihre Abwesenheit geprüft.
Die oben genannten Laufzeitresultate gehören zum vorherigen M1-Nachweis und
sind kein Nachweis für die noch ausstehende M2a-Implementierung.
