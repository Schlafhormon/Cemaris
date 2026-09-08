# Nächster Schritt M3a: manuelle Gebührenpositionen und vollständige Ausgabe

Stand: 08.09.2026

Status: **Vorbereitet, beide Produktantworten bestätigt; noch nicht implementiert.**
Diese Übergabe ist der Einstieg für einen neuen kontextlosen Chat. Maßgeblich
ist der [Produktvertrag M3a](../requirements/manual-notice-line-items-decisions.md).
Keine erneute Freigabe dieser beiden Antworten und kein allgemeines 6a-/6c-
oder Betriebsfreigabegate. Nur konkrete, aus Repository und Übergabe nicht
auflösbare Unklarheiten nachfragen. M2a ist einschließlich Bereinigung
[abgeschlossen](cemaris-manual-usage-right-termination-completion.md).

## Auftrag

Manuelle Gebührenpositionen mit positiven EUR-Beträgen, verbindlicher exakter
Summe und vollständiger DOCX-/PDF-Ausgabe Ende zu Ende implementieren:
Domain, Application, Synthetic-/SQL-Provider, additive Migration, API, UI,
vollständige Fachhistorie, Regressionen und isolierter Browsernachweis.
Bestehende Entwürfe und ihre Revisionen erhalten, ausdrückliche Umstellung
ermöglichen und alle betroffenen Schreib-/Erzeugungswege gegen Umgehung und
Konflikte absichern. Keine bloße Positionsmaske über einem frei änderbaren
Gesamtbetrag. Nicht die gesamte M3- oder übrige Roadmap implementieren.

Kein Katalog, keine Mengen/Tarife, automatische Fälligkeit, Rechtswirkung,
Festsetzung, Gutschrift, Versand, Archivierung oder FINANZ+-Integration.
Keine Änderung an M1-/M2a-Aggregaten, Grabstatus oder Beisetzungen durch M3a.
Absolute Fehlerfreiheit ist nicht zusagbar; tatsächliche Nachweise und
verbleibende Grenzen sind Teil des Abschlusses.

## Arbeitswurzel, Bestand und Werkzeuge

Einzige Arbeitswurzel: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`.
Antworten und Dokumentation auf Deutsch.

| Zweck | Arbeitsverzeichnis relativ zur Wurzel |
| --- | --- |
| Solution und .NET-Prüfungen | `.` mit `Cemaris.sln` |
| Domain | `src/Cemaris.Domain` |
| Application | `src/Cemaris.Application` |
| Infrastructure, EF und Migrationen | `src/Cemaris.Infrastructure` |
| API und regulärer Content-Root | `src/Cemaris.Api` |
| Frontend und sämtliche npm-Befehle | `src/Cemaris.Web` |
| Unit-Tests | `tests/Cemaris.UnitTests` |
| Integrationstests und isolierte Hostfixtures | `tests/Cemaris.IntegrationTests` |
| Verträge, Übergabe, ADRs | `docs/requirements`, `docs/implementation`, `docs/decisions` |

Für **sämtliche** .NET-Befehle ausschließlich:
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.
Das EF-Werkzeugmanifest liegt als `dotnet-tools.json` in der Wurzel.

Vor Änderungen Branch, HEAD, Upstream, Ahead/Behind, Index, Arbeitsbaum,
unversionierte Dateien und vollständige Diffs prüfen. Bei dieser Vorbereitung:
`main`, HEAD `b2cd44838507eb69e00e748d3f6edcb0d4efb558`, `origin/main` 0/0,
leerer Index; bereits 55 geänderte/neue Dateien aus M2a vor dieser Vorbereitung.
Der Benutzer will diesen Stand prüfen und committen. Der tatsächliche neue
HEAD ist maßgeblich; Änderungen können bereits committed sein. Kein Reset,
Staging oder Commit. Alle vorhandenen Änderungen erhalten.

Insbesondere erhalten: M1 einschließlich EF-`Add`, Versionsspeicherung und
Nachweisen in derselben Transaktion; M2a einschließlich Rechteverlauf,
atomarer Folgekorrektur, SQL-Konfliktklassifikation und Inhabervorschlag;
6c-Beisetzungsauswahl, GUID-Zuordnung, Einleitungstext, Formularreset,
AbortSignal- und Generation-Sicherheitsprüfungen. Alte ADRs und Migrationen
nicht rückwirkend ändern. `tmp/m2a-20260908` wurde durch den Benutzer entfernt;
es ist keine offene Bereinigungsaufgabe und darf nicht als Voraussetzung gelten.

## Zuerst vollständig lesen

1. Diese Übergabe und [M3a-Produktentscheidungen](../requirements/manual-notice-line-items-decisions.md).
2. [Manueller Faktenvertrag 6b](../requirements/manual-notice-financial-facts-decisions.md),
   [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md) und
   [6b-Abschluss](cemaris-increment-6b-completion.md).
3. [Ausgabevertrag 6c](../requirements/notice-generation-decisions.md),
   [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md),
   [6c-Abschluss](cemaris-increment-6c-completion.md) und
   [Dokumentarchitektur](../architecture/document-generation.md).
4. [Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp),
   [Praxistestabschluss](cemaris-notice-generation-prototype-trial-completion.md)
   und [Beisetzungsauswahl-Abschluss](cemaris-notice-generation-burial-selection-completion.md).
   Die früheren Gates und „noch nicht umgesetzt“-Aussagen sind zeitbezogene
   Historie; für diesen neuen Schnitt gilt M3a.
5. [M2a-Abschluss](cemaris-manual-usage-right-termination-completion.md),
   [ADR-0021](../decisions/ADR-0021-manual-usage-right-lifecycle.md),
   [M1-SQL-Folgenachweis](cemaris-manual-case-follow-ups-sql-verification.md),
   [Roadmap](cemaris-first-operational-version-roadmap.md), Root-README,
   `SECURITY.md` und aktuellen Implementierungsindex.

Danach alle tatsächlich betroffenen Code- und Testdateien vollständig lesen.
Historische Satzungs-/EDWALT-Evidenz ist kein Gebührenkatalog. Keine externen
Satzungs-, EDWALT-, DMS- oder Vorlagenwurzeln öffnen.

## Verifizierte Codeanschlüsse

Alle Pfade relativ zur Arbeitswurzel; Verzeichnisangaben bezeichnen die dort
genannten Dateien, nicht neue konkurrierende Module.

| Bereich | Bestehende Dateien |
| --- | --- |
| Betrags- und Nummernregeln | `src/Cemaris.Domain/NoticeDrafts/NoticeDraftRules.cs` |
| Entwurfsvertrag und Dienst | `src/Cemaris.Application/NoticeDrafts/NoticeDraftModels.cs`, `NoticeDraftService.cs`, `INoticeDraftStore.cs` |
| Fachprovider | `src/Cemaris.Infrastructure/NoticeDrafts/SyntheticNoticeDraftStore.cs`, `EfNoticeDraftStore.cs`; `src/Cemaris.Infrastructure/SyntheticStoreCoordinator.cs` |
| Schema | `src/Cemaris.Infrastructure/Persistence/NoticeDrafts/NoticeDraftEntities.cs`, `Persistence/CemarisDbContext.cs`, `Persistence/Migrations/CemarisDbContextModelSnapshot.cs` |
| Ausgabequelle und Rendererport | `src/Cemaris.Application/NoticeGeneration/NoticeGenerationModels.cs` |
| Ausgabeprovider und Dateisicherheit | `src/Cemaris.Infrastructure/NoticeGeneration/NoticeGenerationStores.cs`, `NoticeGenerationFiles.cs`, `LegalBasisStores.cs` |
| API, Capability und DI | `src/Cemaris.Api/NoticeDraftEndpoints.cs`, `NoticeGenerationEndpoints.cs`, `Security/CemarisSecurity.cs`, `Program.cs`, `Contracts/SystemInformationResponse.cs`, `appsettings.json`, `appsettings.Development.json`; `src/Cemaris.Infrastructure/DependencyInjection.cs` |
| UI und Client | `src/Cemaris.Web/src/components/NoticeDraftPanel.tsx`, `useFormFeedback.tsx`, `FormErrorSummary.tsx`, `pages/CaseDetailsPage.tsx`, `App.tsx`, `api/cemarisApi.ts`, `types/noticeDrafts.ts`, `types/system.ts` |
| Unit-Tests | `tests/Cemaris.UnitTests/NoticeDraftRulesTests.cs`, `NoticeGenerationTests.cs` |
| Integrationstests | `tests/Cemaris.IntegrationTests/SyntheticNoticeDraftStoreTests.cs`, `NoticeDraftEndpointTests.cs`, `NoticeDraftWebApplicationFactory.cs`, `SqlServerNoticeDraftTests.cs`, `NoticeGenerationEndpointTests.cs`, `NoticeGenerationWebApplicationFactory.cs` |
| Isolation und Regressionen | `tests/Cemaris.IntegrationTests/TestConfiguration.cs`, `TestIdentity.cs`, `TestLocalAccountStore.cs`, `SqlServerIntegrationFixture.cs`, `SqlServerFactAttribute.cs`, `SqlServerCaseFollowUpTests.cs`, `SqlServerUsageRightLifecycleTests.cs`, `SqlServerPersonUsageRightTests.cs` |
| Frontendtests | `src/Cemaris.Web/src/components/NoticeDraftPanel.test.tsx`, `pages/CaseDetailsPage.test.tsx` sowie vorhandene Personen-/Rechte-, Wiedervorlagen- und Konfigurationstests |

Neue Dateien konsistent zum Modul anlegen, etwa `NoticeDraftLineItemRules.cs`,
`NoticeDraftLineItemEndpoints.cs`, `SqlServerNoticeDraftLineItemTests.cs` und
dedizierte Capability-/Hostfixtures. Die Namen sind Vorschläge; die Dateien
sind bei Vorbereitung noch nicht vorhanden. Kein zweiter Bescheidspeicher.

Beobachtungen, die bei Umsetzung berücksichtigt werden müssen:

- `TotalAmount` ist bisher manuell; `decimal(18,2)` und Domainprüfung verbieten
  bereits Null/Minus und mehr als zwei Nachkommastellen. Positionen fehlen in
  Entity, View, ListItem, Revision, UI und Ausgabequelle.
- `NoticeDraftRevisionEntity` speichert vollständige **skalare Spalten**, kein
  `StateJson`. Nicht das M2a-JSON-Modell als vorhanden voraussetzen. Neue
  Positionssnapshots müssen zu genau einer Revision gehören und nach aktueller
  Änderung/Entfernung unverändert lesbar bleiben.
- Der EF-Store verwendet `Serializable`, eine mit `UPDLOCK, HOLDLOCK` gelesene
  Jahressequenz sowie Revision/Audit. Sein allgemeiner `DbUpdateException`-Catch
  klassifiziert pauschal als Referenz-/Konfigurationsfehler. Neue echte Rennen,
  verschachtelte SQL-1205-Fehler und Nachweisfehler gezielt klassifizieren;
  keinen Versionskonflikt als ungültigen Zahlungspflichtigen ausgeben.
- Der Synthetic-Store enthält Records mit veränderbaren Revisionslisten.
  Alle neuen Folgestände vorbereiten, Listen unabhängig kopieren und erst
  nach vollständiger Prüfung unter dem vorhandenen Coordinator veröffentlichen.
- API-Mutationen laden aktuell nach der Speicherung neu und setzen den ETag
  aus dem Mutationsergebnis. Ein zwischenzeitlicher weiterer Schreibvorgang
  kann Antwortkörper und ETag auseinanderführen. Den betroffenen Entwurfspfad
  mit einem konsistenten gespeicherten Antwortsnapshot absichern.
- Webtypen benutzen `number` für Geld. Diese Darstellung ist bei der vorhandenen
  hohen Dezimalgrenze nicht centgenau. Neue Positionsbeträge und exakte
  Summen verlustfrei übertragen, etwa als kanonische Dezimalstrings mit
  additiven exakten Lesefeldern; bestehende numerische Felder nicht unbemerkt
  umtypen. Auch Bestand, Umstellung, Historie und Listen korrekt anzeigen.
- `NoticeGenerationSource` enthält nur den Gesamtbetrag.
  `INoticeDocumentRenderer.RenderAsync` nimmt nur ein skalares Dictionary.
  `Map` verwendet für `GEBUEHR_BETRAG` und `GESAMTBETRAG` denselben Betrag;
  `GEBUEHR_BEZEICHNUNG` stammt aus der Kopfbegründung.
- Der Renderer verlangt jeden der 23 freigegebenen Tokens genau einmal.
  Wiederholbare Zeilen erfordern einen ausdrücklichen strukturellen Vertrag,
  keine pauschale Aufweichung der Tokenprüfung. Der echte PDF-Konverter
  `LibreOfficeNoticePdfConverter` liegt ebenfalls in `NoticeGenerationFiles.cs`.
- Beide Ausgabeprovider lesen bereits unter Coordinator beziehungsweise
  SQL-Transaktion. Positionsliste und Summe innerhalb desselben konsistenten
  Quellabrufs erfassen und danach unveränderlich an den Renderer übergeben.

## Verbindlicher Umsetzungsschnitt

1. Positionsmodus und Bestandsmodus im bestehenden Aggregat unterscheiden.
   1 bis 100 Positionen, stabile serverseitige IDs, eindeutige Reihenfolge,
   Pflichtbezeichnung, exakte positive Beträge und begrenzte Summe gemäß Vertrag.
   Reihenfolgeänderungen atomar speichern, auch bei eindeutigen SQL-Indizes.
2. Anlage, begründete Gesamtkorrektur einschließlich Kopf/Positionen und
   ausdrückliche Bestandsumstellung bereitstellen. Eine einzige Entwurfsversion
   schützt alle Positionen; keine teilweise gespeicherten Einzelzeilen.
   Alte Korrekturwege für Positionsentwürfe kontrolliert abweisen, wenn sie
   den neuen vollständigen Vertrag nicht erfüllen. Verwerfen bewahrt alle Positionen.
3. Neue Capability `Features:NoticeDraftLineItemsEnabled`, Default `false`,
   ausschließlich `Development`, abhängig von `NoticeDraftEditingEnabled`.
   Positionsbearbeitung benötigt keine Dokumenterzeugung. Ausgabe benötigt
   weiterhin `NoticeGenerationEnabled` mit ihren vorhandenen Abhängigkeiten.
   Isolation, Systeminfo, UI-Typen, DI und Testdefaults vollständig ergänzen.
4. Additive Mutationsrouten beziehungsweise ausdrückliche neue Commands verwenden;
   alte numerische Requestverträge kompatibel halten. Bestehende Policy
   `NoticeDrafts`, reguläre Cookies, aktive Identität und CSRF. Für Korrektur,
   Umstellung und Verwerfen starker aktueller `If-Match`. Bestehende Konvention:
   fehlend 428, ungültig/schwach 400, veraltet 412, Zustand 409, fehlender Entwurf
   404, ungültige Referenz 400; anonym 401, unberechtigt 403. Feld-/Binderfehler
   kontrolliert und inhaltsarm, keine internen IDs/Pfade aus Exceptions leaken.
5. Aktueller Stand, vollständige neue Revision und sparsamer Audit atomar;
   bei Anlage auch Sequenz. Alte Revisionen nicht umschreiben. Fehlversuche
   lassen alle Fakten/Versionen unverändert. Konflikte, ungültige Positions-IDs,
   fehlende/zusätzliche Felder und Versionsüberlauf dürfen nicht mit 500 enden.
6. Bedienbarer Positionseditor mit Summe, Hinzufügen/Entfernen/Umordnen,
   vollständiger aktueller und historischer Darstellung, Bestandskennzeichnung,
   begründeter Umstellung, Konflikteingabeerhalt und bewusstem Neuladen.
   Berechnung der Anzeige exakt; bei ungültiger Eingabe keine scheinbar gültige
   Gesamtsumme. Bestätigungen, Reset, Auswahl per ID, AbortSignal und Schutz
   vor verspäteten Antworten für Fall-/Entwurfswechsel prüfen.
7. Reguläre additive Migration, aktuelle und revisionsgebundene Positionen
   sowie kompatibler Bestandsmodus. Historische Spaltenwerte, Revisionen und
   Altprojektionen unverändert lassen. Migration als Artefakt erstellen und
   offline prüfen; nur in neu erzeugten isolierten Testdatenbanken anwenden.
   Design-Time ohne Secrets oder normalen Hoststart. Temporäre Quellhelfer
   entfernen und danach neu bauen. Neues ADR mit nächster freier Nummer
   (bei Vorbereitung wäre dies ADR-0022), historische ADR-0018/0019/0021 erhalten.
8. Strukturierten Rendererinput mit geordneten Positionen und exakt einer Summe
   ergänzen. Vorlage vor Ersetzung auf einen eindeutig identifizierten
   wiederholbaren Tabellenzeilen-Prototyp prüfen; die zwei Positionstokens
   müssen strukturell zusammengehören. Unbekannte, fehlende oder unerlaubt
   doppelte Tokens sowie mehrdeutige Zeilen abweisen. Benutzereingaben über
   OpenXML-Textknoten einsetzen; keine raw-XML- oder freie Tokenausführung.
9. Bestehende synthetische DOCX-Fixture bevorzugt unverändert als Zeilenprototyp
   nutzen. Falls ihre tatsächliche Struktur das nicht trägt, eine getrennte
   versionierte synthetische Testvorlage ableiten und ihren Vertrag samt Tests
   dokumentieren. Beide bisherigen DOCX-Dateien unverändert lassen. Keine
   kommunale Vorlage erfinden, kein Upload oder allgemeiner Vorlageneditor.
10. Vor und nach Expansion ZIP-/Paket-, Inhaltsarten-, Beziehungs-, Token-,
    OpenXML- und Größenprüfungen erhalten. Kopf-/Fußzeilen, geteilte Textruns,
    lange Zeilen und Seitenumbrüche berücksichtigen. Keine Makros, externen
    Beziehungen, AltChunks oder eingebetteten Objekte zulassen. Ressourcenlimits
    nicht pauschal erhöhen, um fehlerhafte Ausgabe durchzubekommen.
11. DOCX/PDF nur flüchtig streamen; Auditfehler verhindert Ausgabe.
    Kein Betrag/Freitext/Dokument im technischen Audit oder Log, keine
    Archivierung. Konverter ohne Shell, isoliertes Profil, begrenzte Parallelität,
    Laufzeit und Prozessbaumabbruch sowie Cleanup nach Erfolg/Fehler/Abbruch erhalten.

## Verbindliche Prüfungen und SQL-Isolation

Die Beispiele des Produktvertrags vollständig abdecken. Domain-/Applicationtests
für Pflichtfelder, Trim/Längen, leere/null/überlange Listen, doppelte/fremde IDs,
Reihenfolge, Betragsskala, Null/Minus, exakte Centaddition, große Werte und
Summenüberlauf. Vertrags-/Providertests für beide Modi, unveränderte alte
Revisionen, sämtliche neuen Snapshots, Umstellung, Verwerfen und Eingabeerhalt.
Keine kopierten alten Testzahlen als Nachweis des neuen Schnitts verwenden.

HTTP mit beiden Rollen, Cookies, CSRF, ETags, kontrollierten Binderfehlern,
inhaltsarmen Fehlern, deaktivierter Capability, Development-Grenze und OpenAPI.
SQL mit getrennten DbContexts: zwei Korrekturen, Korrektur gegen Verwerfen,
Umstellung gegen alte Korrektur und Erzeugungsabruf gegen Korrektur. Gezielter
Fehler in späterer Position/Revision/Audit muss den gesamten Vorgang einschließlich
Nummernvergabe zurückrollen. SQL-Persistenz über vollständig beendeten und neuen
Anwendungshost nachweisen. Synthetic-Neustart ist dafür kein Ersatz.

Für den nächsten Implementierungsauftrag sind gezielte SQL-Tests auf
**ausschließlich neu erzeugten entbehrlichen Datenbanken** vorgesehen und im
Startprompt ausdrücklich autorisiert: neue M3a-Klasse, vorhandene
`SqlServerNoticeDraftTests`, `SqlServerCaseFollowUpTests`,
`SqlServerUsageRightLifecycleTests` und `SqlServerPersonUsageRightTests`.
Fixtures vor Ausführung vollständig prüfen. Die alte allgemeine Fixture
verwendet mehrere Vorgängermigrationen und eigene Hilfsdatenbanken; deren
vollständigen eigenen Namensbestand vorher/nachher verfolgen. Migration von
einem Stand unmittelbar vor M3a mit repräsentativen alten Entwürfen und
Revisionen gezielt ergänzen. Globale Testzähler nicht blind anpassen;
Datensatz-/Fallbezüge oder einen tatsächlichen Ausgangsbestand verwenden.

Zuletzt funktionierte Windows-Anmeldung an `.\CEMARISDEV` ohne Secrets.
Eine selbst zusammengesetzte integrierte Testverbindung nur prozesslokal
über `CEMARIS_SQL_TEST_CONNECTION_STRING` setzen und danach entfernen.
Keine Secretdateien oder bestehende Verbindungswerte lesen. `master` nur
für Namens-/Metadateninventar und CREATE/DROP der eigenen neuen Datenbanken
verwenden; eine bloße Namensvorsilbe belegt nicht, dass eine Datenbank dieser
Sitzung gehört. Kollisionsfrei erzeugte Namen und Cleanup auch bei Fehlern prüfen.

`Cemaris_Dev`, `Cemaris_Dev_RestoreCheck_20260902`, Sicherungen und fremde
Testdatenbanken weder öffnen noch migrieren, seeden, verwalten oder löschen.
Bekannter Fremdbestand: `Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3`.
Keine EDWALT-Ausführung, Backup-/Restore-Wiederholung, SQL-Dienstneustarts oder
systemweiten Konten-/ACL-/Quota-/Verschlüsselungsänderungen.
Ein fehlender sicherer Testzugang ist ein konkreter offener Nachweis, kein
Anlass für Tests auf bestehenden Datenbanken.

## Isolierter Browser- und Dokumentnachweis

Installiertes Edge und vorhandene lokale Playwright-Bibliothek wie im
6c-/M2a-Abschluss verwenden; aktuelle Verfügbarkeit prüfen, keine
Browserinstallation oder neue Projektabhängigkeit allein für den Prüfhost.
Nur Loopback: Kestrel `IPAddress.Loopback`, freie Ports vorher prüfen;
Vite `--host 127.0.0.1 --strictPort`, prozesslokales `VITE_API_PROXY_TARGET`.
API-Content-Root ist `src/Cemaris.Api`.

Fachprovider `Synthetic` **und** isolierter `TestLocalAccountStore`; der normale
Synthetic-Provider isoliert den EF-Kontenspeicher nicht. Beide Rollen über die
reguläre Cookie-Anmeldung prüfen, keine Authumgehung in Produktcode. Alle drei
Maintenance-Schalter aus. Capabilities nur im eigenen Prozess aktivieren.
**Anders als im abgeschlossenen M2a-Browserlauf ist NoticeGeneration für den
neuen M3a-Ausgabenachweis prozesslokal einzuschalten.** Die Portable-Defaults
bleiben aus. Der alte M2a-Auftrag wird dadurch nicht nachträglich geändert.

Testbuilds mit `-p:UserSecretsId=` müssen vollständig beendet sein, bevor
irgendein Host aus diesen Assemblies startet. Auch bei `--no-build` muss
dieser Parameter im letzten Build wirksam gewesen sein. Keine gleichzeitigen
Builds auf gemeinsam genutzte Ausgabeverzeichnisse; Hoststart erst nach Erfolg.

Die vorhandene `NoticeGenerationWebApplicationFactory` verwendet einen
PDF-Dummy. Für den Browsernachweis den echten Produktkonverter und
`DirectNoticeProcessRunner` einsetzen. Installationspfad zuletzt:
`C:\Program Files\LibreOffice\program\soffice.com` (vor Einsatz prüfen).
Konvertertempstamm kurz, neu und unter dem regulären API-Content-Root, etwa
`src/Cemaris.Api/tm3a` nach Kollisionsprüfung. Allgemeine Prüfarbeitsdateien
unter einer neuen Repository-`tmp`-Wurzel; keinerlei fremde Bestände bereinigen.

Über vorhandene API-/UI-Verträge zwei synthetische Fälle, Beteiligte mit
aktueller Primäranschrift, tatsächliche Beisetzungen samt Grabbezug,
Nummernkonfiguration, vollständigen Benutzerkontakt und aktive synthetische
Satzung bereitstellen. Keine echten Gebühren oder Personen verwenden.

Im Browser mit beiden Rollen nachweisen: mindestens zwei Positionen anlegen,
exakte Summe, Bestätigungs-/Formularreset, ändern/entfernen/umordnen,
begründet umstellen, vollständige Historie, Reload, Konflikt in zweiter Sitzung
mit erhaltenen Eingaben und Verwerfen. Fall-/Entwurfswechsel, Tastaturbedienung
und schmale Ansicht (etwa 390 Pixel) prüfen. Die korrekte zweite Beisetzung
auswählen und DOCX sowie echtes PDF herunterladen. Einen Grenzfall mit 100
Positionen einschließlich langer Bezeichnungen zusätzlich wirklich ausgeben.

Für beide Dokumentformate Zeilenanzahl, Reihenfolge, Einzelwerte, Summe,
Person/Grab/Datum, keine Fremdfalldaten, keine Resttokens und sichtbare
Wirkungslosigkeit prüfen. MIME, Dateiname, No-Store und Nosniff belegen.
PDF-Seiten rendern und visuell prüfen: kein Abschneiden/Überlagern, lesbare
Seitenumbrüche, jede Position vorhanden, Gesamtsumme eindeutig. Ein
Dummy-PDF, HTTP-Test oder nur gelesener DOCX-Text ersetzt diesen Nachweis nicht.

Sitzungen abmelden und anonym 401 prüfen. Eigene Hosts beenden. Frischer
isolierter deaktivierter Start: Health 200, neue Capability und NoticeGeneration
`false`, neue Mutations-/Erzeugungsrouten 404. Ebenfalls beenden. Zusätzlich
gespeicherte Positionsentwürfe mit abgeschalteter neuer Bearbeitungscapability
auf korrekte Lese-/Altmutationsgrenzen testen.

## Qualität, Bereinigung und Abschluss

Mit vorgeschriebenem SDK: Restore `--locked-mode`, Formatprüfung
`--verify-no-changes --no-restore`, Release-Build, Unit-Tests,
Integrationstests `--filter "Category!=SqlServer"` und ausgewählte isolierte
SQL-Klassen. Im Frontend: `npm ci`, `npm run test -- --run --maxWorkers=2`,
`npm run lint`, `npm run build`. NuGet einschließlich transitiver Pakete
und `npm audit` prüfen, keine unnötigen Paketupdates.
Bestehende M1-/M2a- und 6c-Regressionen ausführen. Bekannte alte Testzahlen
aus M2a (104 Unit, 87 nicht-SQL-Integration, 6 ausgewählte SQL, 93 Frontend)
sind nur datierte Ausgangsevidenz, kein neues Prüfergebnis.

Erstelle `docs/implementation/cemaris-manual-notice-line-items-completion.md`.
Neues ADR, Produktvertrag, Übergabestatus, Roadmap, README, SECURITY und
betroffene Architektur-/Anforderungs-/Implementierungs-/Entscheidungsindizes
auf den tatsächlich erreichten Stand bringen. Befunde, konkrete Korrekturen,
Testumfang, SQL-/Browser-/Dokumentnachweise und Grenzen dokumentieren.

Nur die beiden bekannten synthetischen Vorlagendateien dürfen für die
Rendereranpassung innerhalb dieses neuen Auftrags lesend untersucht werden;
beide Originaldateien bleiben unverändert. Bei dieser Vorbereitung wurden
nur Hashes gelesen. Vor und nach Implementierung SHA-256 vergleichen:

- `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx`:
  `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx`:
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Von `tmp/pagination-build` ausschließlich Wurzelmetadaten vergleichen, niemals
Inhalte öffnen oder auflisten. Zuletzt: Attribute 16, Erstellung UTC
`2026-08-14T10:27:21.4014388Z`, letzte Änderung UTC
`2026-08-14T10:27:21.4062644Z`. Zeitwerte mit `ToString('O')` vergleichen;
lokalisierte PowerShell-Datumskonvertierung kann einen falschen Unterschied erzeugen.

Eigene Testdatenbanken, Downloads, Renderbilder, Screenshots, Prüfskripte,
Konverterprofile und temporäre Quellhelfer entfernen. Vor rekursiven Operationen
absolute Zielpfade und Besitz prüfen; native PowerShell-Literalpfade verwenden.
Automatische Ablehnungen nicht umgehen; konkrete verbleibende Bereinigung
ehrlich dokumentieren. Nach Entfernung von Quellhelfern neu bauen, damit sie
auch aus den Assemblies verschwinden. Keine eigenen Hosts oder Overrides hinterlassen.

Abschließend Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace/finale LF,
`git diff --check`, neue Dateien und Diffs mit Secret-/Fremdpfadheuristik,
Vorlagenhashes, geschützte Wurzelmetadaten, eigene DB-/Prozess-/Dateireste,
deaktivierte Capabilities und vollständigen Git-Endstand prüfen.

## Nachweis dieser Vorbereitung vom 08.09.2026

Beide Produktantworten wurden in diesem Gespräch ausdrücklich eingeholt.
Dokumentation, bestehende Entwurfs-/Revisionsmodelle, Provider, API, UI-Typen
und Rendereranschlüsse wurden geprüft. Der neue Vertrag grenzt Addition von
späteren Katalog-/Tarifregeln ab. Veraltete Einstiegsaussagen wurden durch
datierte Querverweise eingeordnet; historische ADRs und Testergebnisse bleiben
unverändert. Die beschriebenen Genauigkeits-, ETag- und SQL-Klassifikationsrisiken
sind bei dieser Vorbereitung statische Codebefunde, keine neu ausgeführten
Fehlerreproduktionen oder bereits behobenen M3a-Fehler.

Diese Vorbereitung änderte ausschließlich Markdown. Die 43 bereits
geänderten/neuen Nicht-Markdown-Dateien sind durch SHA-256-Vergleich unverändert
bestätigt. Gesamtstand zur Benutzerprüfung: 42 versioniert geänderte und
21 unversionierte Dateien, insgesamt 63, davon 20 Markdown-Dateien.
HEAD und Upstream 0/0 sind unverändert, Index leer. Kein Staging oder Commit.

Die Dokumentationsprüfung umfasst 133 Markdown-Dateien, 838 lokale Links,
37 Anker, 237 Tabellen und 46 geschlossene Codeblöcke ohne offenen Befund.
Explizite vollständige Quellpfade der neuen Übergabe, Tabellenstruktur,
Whitespace, finale LF und `git diff --check` wurden geprüft. Die begrenzte
Secret-/Fremdpfadheuristik der Änderungen meldet keinen Kandidaten; sie ist
kein umfassender Sicherheitsscan. Beide Vorlagenhashes und ausschließlich
die Wurzelmetadaten von `tmp/pagination-build` sind unverändert. Die alte
M2a-Prüfwurzel ist weiterhin abwesend. Alle acht Feature-Capabilities stehen
in beiden eingecheckten API-Konfigurationen auf `false`.

Für diese Vorbereitung wurden keine .NET-/Frontendtests oder Browserläufe
ausgeführt, keine Datenbanken angesprochen, keine Hosts gestartet und keine
temporären Prüfdateien erzeugt. Die vorherigen M2a-Ergebnisse sind kein
Ausführungsnachweis für die noch ausstehende M3a-Implementierung.
