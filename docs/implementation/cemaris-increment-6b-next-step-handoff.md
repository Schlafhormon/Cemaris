# Ausführbare Folgeübergabe: Inkrement 6b – kanonische manuelle Bescheidentwürfe

> **Ausgeführt und abgeschlossen am 26.08.2026.** Der technische Nachweis
> steht in der
> [6b-Abschlussdokumentation](cemaris-increment-6b-completion.md). Der nächste
> zulässige Schritt war ausschließlich das
> [dokumentarische Entscheidungsgate zur späteren Bescheiderzeugung](cemaris-notice-generation-decision-gate-next-step-handoff.md).
> Es ist gemäß
> [6c-Abschluss](cemaris-notice-generation-decision-gate-completion.md) mit
> Variante A als erstem Stop-Zwischenstand und nach ergänzender
> Quellenklärung endgültig mit Variante B beendet. Die separate
> [technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md) ist
> vorbereitet, aber nicht ausgeführt.

Stand: 26.08.2026

## Auftrag

Implementiere Inkrement 6b vollständig Ende zu Ende: einen additiven,
providerneutralen und historisierten Kern für manuell befüllte, rechtlich
wirkungslose Bescheidentwürfe. Backend, Synthetic- und EF-/SQL-Provider,
reguläre EF-Core-Migration, API/OpenAPI, React-/TypeScript-Oberfläche, Rollen,
Capability, starke ETags, Fachrevision, sparsamer Audit, Unit-, Integrations-,
optionale isolierte SQL- und Frontendtests sowie Abschlussdokumentation gehören
zum selben Inkrement.

6b erzeugt keinen Bescheid und besitzt keine Rechts-, Festsetzungs-,
Bekanntgabe-, Versand-, Buchungs- oder Zahlungswirkung. Die tatsächliche
Bescheiderzeugung bleibt ausdrücklich das spätere Produktziel und erhält nach
6b ein eigenes Entscheidungsgate.

## Verbindliche Arbeitsumgebung

Repository und einziges Verzeichnis für versionierte Änderungen:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Ausschließliches .NET-SDK für sämtliche .NET-Befehle:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Frontend-Arbeitsverzeichnis innerhalb des Repositorys:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`

Relevante Testprojekte:

- `tests\Cemaris.UnitTests`;
- `tests\Cemaris.IntegrationTests`;
- Frontendtests unter `src\Cemaris.Web\src`.

Lege kein externes Arbeitsverzeichnis an. Vollständig außerhalb des
Arbeitsumfangs bleiben insbesondere:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`;
- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`;
- alle externen EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstigen
  Arbeitswurzeln;
- User Secrets und die dauerhafte Development-Datenbank `Cemaris_Dev`.

Führe EDWALT nicht aus. Öffne oder verändere keine externe Arbeitswurzel.
Lies keine User Secrets. Starte weder API noch Frontend-Dev-Server noch
Browser. Verändere `tmp/pagination-build` nicht und verwende es nicht als
Arbeitsfläche. Stage keine Datei und erstelle keinen Commit.

Eine Datenbankverbindung ist nicht allgemein freigegeben. Führe SQL-Tests nur
aus, wenn im neuen Auftrag ausdrücklich eine separate Testverbindung
autorisiert und prozesslokal bereitgestellt wurde. Sie darf ausschließlich
temporäre Datenbanken mit dem Präfix `Cemaris_IntegrationTests_` verwenden und
niemals auf `Cemaris_Dev` zeigen. Fehlt diese Autorisierung, führe alle übrigen
Prüfungen aus und dokumentiere die ausgelassene SQL-Kategorie ehrlich.

## Vor jeder Änderung

Ermittle und dokumentiere den tatsächlichen Zustand:

- aufgelöste Repositorywurzel;
- Branch, HEAD, Upstream und Ahead/Behind;
- `git status --short --branch`;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts;
- den unveränderten Metadatenstand von `tmp/pagination-build`.

Bei Erstellung dieser Übergabe liegt HEAD auf
`a767bb1f459d5fdd8834a7bcaacb9b14482776bd` und `main` ist gegenüber
`origin/main` `0/0`. Die 6a-F-Dokumentation, ADR-0018 und diese Übergabe sind
noch uncommittiert. Im neuen Chat können sie committed, gepusht oder weiter
uncommittiert vorliegen. Vertraue nie blind dem erwarteten Hash. Erhalte
sämtliche vorhandene Arbeit, führe keinen Reset durch und überschreibe keine
fremden Änderungen.

## Zuerst vollständig lesen

1. diese Übergabe;
2. `README.md` und `SECURITY.md`;
3. `docs/implementation/README.md`;
4. `docs/implementation/cemaris-increment-6a-completion.md`;
5. `docs/implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md`;
6. `docs/implementation/cemaris-manual-notice-facts-approval-completion.md`;
7. `docs/requirements/fee-notice-document-decisions.md`;
8. `docs/requirements/manual-notice-financial-facts-decisions.md`;
9. `docs/requirements/identity-authorization-audit-decisions.md`;
10. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
11. `docs/architecture/authentication-authorization-audit.md`;
12. `docs/architecture/person-usage-rights-deadlines.md`;
13. `docs/architecture/document-generation.md`;
14. ADR-0010 bis ADR-0013 sowie ADR-0016 bis ADR-0018;
15. `docs/migration/README.md` und den nur als pausierte Grenze zu lesenden
    `docs/migration/edwalt-fee-master-variants-next-step-handoff.md`;
16. alle fünf Dokumentationsindizes unter `docs/requirements`,
    `docs/architecture`, `docs/implementation`, `docs/migration` und
    `docs/decisions`.

Lies danach sämtliche betroffenen Quell-, Konfigurations-, Migrations- und
Testdateien vollständig. Prüfe insbesondere:

- Domain- und Application-Muster des kanonischen Beteiligten-/
  Nutzungsrechtskerns;
- `PersonUsageRightService`, `IPersonUsageRightStore` sowie Synthetic- und
  EF-Store;
- `CemarisDbContext`, Entitäten, sämtliche Migrationen und ModelSnapshot;
- `CemarisSecurity.cs`, Capabilityprüfung, Antiforgery, ETag-Helfer und
  Fehlerabbildung;
- `Program.cs`, `PersonUsageRightEndpoints.cs` und vorhandene API-Verträge;
- `CaseDetailsPage.tsx`, `PartiesPage.tsx`, `UsageRightStartRulesPage.tsx`,
  `App.tsx`, `AppLayout.tsx`, API-Adapter und TypeScript-Typen;
- alle unmittelbar zugehörigen Unit-, API-, Feature-Safety-, Provider-, SQL-
  und Frontendtests.

Erhebe vor der Implementierung die Baseline für Release-Build, Unit-Tests,
Integrationstests ohne SQL-Kategorie, .NET-Format, `npm ci`, Frontendtests,
Lint, Produktionsbuild, `git diff --check` und Dokumentationsprüfungen.

## Verbindlicher Fachvertrag

### 1. Entwurf und Kardinalität

- Ein vorhandener Cemaris-Fall darf null bis viele voneinander unabhängige
  kanonische Bescheidentwürfe besitzen.
- Jeder Entwurf besitzt eine servererzeugte stabile GUID, genau einen Fall,
  genau einen kanonischen Zahlungspflichtigen und genau eine eigene
  unveränderliche automatisch vergebene Bescheidnummer.
- Zwischen mehreren Entwürfen desselben Falls wird keine Reihenfolge,
  Ersetzung, Korrekturbeziehung oder gemeinsame Summenwirkung erfunden.
- Es gibt ausschließlich `Draft` und `Discarded`. Diese technischen
  Bezeichner werden in der deutschen UI als `Entwurf` und `Verworfen`
  dargestellt.
- Ein verworfener Entwurf bleibt lesbar und historisch nachvollziehbar, ist
  aber unveränderlich. Es gibt kein Löschen, Wiederherstellen, Kopieren,
  Erzeugen, Festsetzen, Freigeben, Versenden, Stornieren oder Aufheben.

### 2. Pflichtfakten

Jeder aktive Entwurf enthält:

- `CaseId`;
- `PayerPartyId`;
- unveränderliche `NoticeNumber`;
- manuell erfassten positiven `TotalAmount` mit SQL-Präzision
  `decimal(18,2)` und höchstens zwei Nachkommastellen; mehr Stellen werden
  abgewiesen und niemals gerundet;
- unveränderliche Währung `EUR`;
- manuelles vorgesehenes `NoticeDate`;
- manuelles `DueDate`;
- `FinancialProductSnapshot` aus der Nummernkonfiguration;
- manuell erfasste `AccountAssignment`;
- kurzen manuellen `FeeReasonOrSource`;
- `Status`, monotone `Version` und technische Erstell-/Änderungszeitpunkte.

Datumswerte werden weder berechnet noch aus Zustellung, Satzung,
Nutzungszeitraum oder anderen Ereignissen abgeleitet. Erfinde keine
zusätzliche Datumsbeziehung. Defensiv-technische Textgrenzen sind:

- Finanzprodukt 1 bis 50 Zeichen;
- Kontierung 1 bis 100 Zeichen;
- Gebührenanlass/Quellenbezug 1 bis 500 Zeichen;
- Korrektur-/Verwerfungsgrund 1 bis 1.000 Zeichen;
- vollständige Bescheidnummer höchstens 100 Zeichen.

Trimme Eingaben serverseitig und lehne leere beziehungsweise reine
Whitespace-Werte ab. Diese Grenzen sind Eingabehygiene, keine kommunale
Kontierungs- oder Satzungsregel.

### 3. Zahlungspflichtigenbestätigung

- `PayerPartyId` verweist auf einen vorhandenen kanonischen Beteiligten.
- Der aktuelle Inhaber des zum Fall gehörenden Nutzungsrechts darf in der UI
  als deutlich gekennzeichneter Vorschlag vorausgewählt werden.
- Vor der Anlage muss die speichernde Person die konkrete Auswahl aktiv
  bestätigen. Ein Request ohne `PayerSelectionConfirmed = true` wird
  serverseitig abgewiesen.
- Bei einer Korrektur ist eine erneute Bestätigung erforderlich, wenn sich
  `PayerPartyId` ändert. Eine unveränderte Auswahl verlangt keine künstliche
  Neubestätigung.
- Die Bestätigung ist eine Requestbedingung und kein dauerhaftes
  Wahrheitskennzeichen. Revisionen speichern die tatsächlich ausgewählte
  Beteiligten-ID und den damaligen Anzeigenamen.
- Fehlt ein aktueller Nutzungsberechtigter, bleibt die Auswahl leer. Es gibt
  niemals einen serverseitigen Fallback, eine still gespeicherte Ableitung
  oder eine Gleichsetzung von Zahlungspflicht und Nutzungsrecht.

### 4. Nummernkonfiguration und Sequenz

- Es gibt installationweit höchstens eine aktuelle versionierte
  Nummernkonfiguration mit stabiler GUID, `FinancialProduct`,
  `RunningNumberWidth` und monotoner Version. Vor der erstmaligen
  administrativen Anlage existiert keine; Entwurfsanlagen sind dann
  teilwirkungslos gesperrt.
- Das feste Format ist `FinancialProduct.JahrLaufnummer`: ein Punkt nach dem
  Finanzprodukt, vier Ziffern für das Jahr und unmittelbar anschließend die
  links mit Nullen auf die konfigurierte Breite gepolsterte laufende Nummer.
- Das Jahr wird serverseitig aus dem über `TimeProvider` kontrollierbaren
  Vergabezeitpunkt des Entwurfs bestimmt, nicht aus einem Clientfeld und nicht
  aus dem veränderlichen vorgesehenen Bescheiddatum.
- Die Sequenz beginnt je Jahr bei eins und läuft installationweit über
  Konfigurationsversionen hinweg weiter. Lücken sind erlaubt. Keine einmal
  committed vergebene Zahl wird wiederverwendet.
- Die vollständige Bescheidnummer ist global eindeutig. Die laufende Zahl
  wird zusammen mit Entwurf, erster Revision und Audit in derselben
  Transaktion beziehungsweise synthetischen kritischen Sektion vergeben.
- Eine vor Validierung oder durch Rollback fehlgeschlagene Anlage darf keine
  Teilwirkung erzeugen. Ein später verworfener Entwurf behält dagegen Nummer
  und Sequenzverbrauch.
- Die Stellenzahl liegt technisch zwischen 1 und 9. Passt die nächste Zahl
  nicht hinein, wird die gesamte Anlage mit einem stabilen Problemcode
  abgewiesen. Die Administration muss die Breite prospektiv ändern.
- Konfigurationsänderungen gelten nur für künftige Entwürfe. Der Entwurf
  speichert Konfigurations-ID und -Version, Finanzprodukt und Breite als
  unveränderlichen Snapshot; existierende Nummern ändern sich nie.
- Eine Änderung des Finanzprodukts setzt die laufende Jahressequenz nicht
  zurück. Eine manuelle Nummer oder manuelle Sequenzkorrektur existiert nicht.
- Konfigurationsanlage und -änderung sind selbst versioniert, mit starkem
  ETag, Pflichtgrund bei Änderung, vollständiger Konfigurationsrevision und
  sparsamem Audit zu schützen.

### 5. Korrektur, Verwerfen, Revision und Audit

- `Draft` darf mit starkem ETag korrigiert werden. Fallreferenz,
  Bescheidnummer, Vergabejahr, laufende Zahl und Konfigurationssnapshot sind
  unveränderlich.
- Jede Korrektur und jedes Verwerfen verlangt einen nicht leeren Grund.
- Jede erfolgreiche Mutation schreibt atomar aktuellen Zustand, monotone
  Version, unveränderliche Fachrevision und sparsamen Audit. Scheitert ein
  Bestandteil, wird alles zurückgerollt.
- Die Fachrevision enthält das vollständige Entwurfsfaktensnapshot,
  Mutationstyp, Grund, UTC-Zeit, stabile Akteurs-ID und damaligen
  Akteursanzeigenamen. Vom Zahlungspflichtigen werden nur stabile
  Beteiligten-ID und damaliger Anzeigename aufgenommen, keine Anschrift,
  Adresshistorie oder Beteiligtenvollkopie.
- Der technische Audit enthält Entwurfs-ID, Fall-ID, resultierende Version,
  stabile Operation, UTC-Zeit und serverseitigen Akteur, aber keine Beträge,
  Kontierung, Freitexte, Gründe, Adressen oder vollständigen Snapshots.
- Fehlende, ungültige, nicht autorisierte, wegen Antiforgery abgewiesene oder
  mit veraltetem ETag konkurrierende Requests verändern weder Entwurf,
  Nummernsequenz, Version, Revision noch Audit.
- Es gibt keine Audit-Lese-, Such- oder Export-API und keine Audit-UI.
  Fachrevisionen dürfen in der geschützten Entwurfsansicht sichtbar sein.

### 6. FINANZ+- und Altvertragsgrenze

- FINANZ+ bleibt führend für Buchung, Zahlung, Mahnung und Finanzstatus. Es
  entsteht keine Schnittstelle und kein Rückkanal.
- Beginn und Ende wiederkehrender Buchungen bestimmt die buchende
  Sachbearbeitung in FINANZ+ anhand des vorhandenen Nutzungszeitraums. Diese
  Werte werden nicht in 6b gespeichert.
- Der Buchungstext entsteht ausschließlich in FINANZ+ und ist weder Feld,
  Default noch generierter Text in Cemaris.
- `ReadNotices`, `ReadFeeItems`, bestehende nullable DTOs, Fallprojektionen,
  Fixtures und die vorhandene Bescheidnummernsuche bleiben unverändert und
  getrennt.
- Der neue Kern erhält eigene Tabellen, Typen, Endpunkte und UI-Kennzeichnung.
  Es gibt kein Backfill, keine Rückinterpretation, keine Synchronisierung und
  keine EDWALT-Auswertung oder Migration.

## Rollen, Policy und Capability

- Ergänze die Policy `NoticeDrafts` für `Sachbearbeitung` und
  `Administration`.
- Lesen, Anlegen, Korrigieren und Verwerfen von Entwürfen verlangen diese
  Policy.
- Lesen der für die Entwurfsarbeit notwendigen aktuellen
  Nummernkonfiguration darf ebenfalls `NoticeDrafts` verwenden.
- Anlegen und Ändern der Nummernkonfiguration verlangt die vorhandene
  `ProgramConfiguration`-Policy und damit `Administration`.
- Ergänze keine Rolle und leite keine Freigabe-, Festsetzungs- oder
  Dokumentoperation aus den bestehenden Rollen ab.
- Ergänze `Features:NoticeDraftEditingEnabled`. Repositorydefault ist
  `false`; `true` ist ausschließlich in `Development` zulässig. Ein
  Nicht-Development-Negativtest muss den Start vor jeder Mutation abweisen.
- Nimm die Capability in isolierte Integrationstestkonfiguration,
  `SystemInformationResponse`, TypeScript-Systemtyp, `App` und Navigation auf.
  Sie ist kein produktiver Zugriffsschutz und keine Produktivfreigabe.

## Empfohlene Modul- und Dateigrenze

Verwende die vorhandene Schichtung und ergänze voraussichtlich:

- `src/Cemaris.Domain/NoticeDrafts/` für Regeln, Status und
  Validierungsausnahmen;
- `src/Cemaris.Application/NoticeDrafts/` für Commands, Views, Revisionen,
  Mutationsresultate, `INoticeDraftStore` und `NoticeDraftService`;
- `src/Cemaris.Infrastructure/NoticeDrafts/` für Synthetic- und EF-Store;
- `src/Cemaris.Infrastructure/Persistence/NoticeDrafts/` für Entitäten;
- `src/Cemaris.Api/NoticeDraftEndpoints.cs` und bei Bedarf schlanke Verträge
  unter `src/Cemaris.Api/Contracts/`;
- `src/Cemaris.Web/src/types/noticeDrafts.ts`;
- `src/Cemaris.Web/src/components/NoticeDraftPanel.tsx` und Tests;
- `src/Cemaris.Web/src/pages/NoticeNumberConfigurationPage.tsx` und Tests.

Passe mindestens `DependencyInjection.cs`, `CemarisDbContext.cs`,
`Program.cs`, `CemarisSecurity.cs`, Systeminformation, App-Routing,
`AppLayout.tsx`, `CaseDetailsPage.tsx`, API-Adapter, Konfiguration,
Integrationstest-Factories, Migrationen und ModelSnapshot an.

Dateinamen dürfen idiomatisch abweichen. Vermische das neue Modul aber weder
mit `ReadNotices` noch mit dem Nutzungsrechtsaggregat.

## Persistenzvertrag

Das SQL-Modell benötigt sinngemäß:

- `NoticeDrafts`;
- `NoticeDraftRevisions`;
- `NoticeDraftAudits`;
- `NoticeNumberConfigurations`;
- `NoticeNumberConfigurationRevisions`;
- `NoticeNumberConfigurationAudits` oder einen gleichwertig getrennten
  sparsamen Konfigurationsaudit;
- `NoticeNumberSequences`.

Erzwinge mindestens:

- Fremdschlüssel auf vorhandenen Fall und kanonischen Beteiligten ohne
  kaskadierendes Löschen;
- eindeutige vollständige Bescheidnummer;
- eindeutige Revision und Audit je Entwurf/resultierender Version;
- genau eine Sequenzzeile je Kalenderjahr;
- positive `decimal(18,2)`-Beträge und feste Währung `EUR`;
- bekannte Zustände;
- Nebenläufigkeitskontrolle für Entwurf, Konfiguration und Sequenz;
- keine kaskadierende physische Löschung fachlicher Historie.

Erzeuge die Migration regulär mit EF Core und dem verbindlichen SDK; schreibe
sie nicht von Hand. Prüfe Designer und ModelSnapshot vollständig. Die
Migration ist rein additiv und verändert oder befüllt `ReadNotices`,
`ReadFeeItems`, vorhandene Personen, Fälle, Konten oder Stammdaten nicht.
Lege keinen lokalen Finanzprodukt- oder Kontierungswert als Seed an.

Der Synthetic-Provider muss dieselben Referenz-, Versions-, Sequenz-,
Historien-, Status- und Atomaritätsregeln unter einer geeigneten gemeinsamen
kritischen Sektion einhalten. Verwende ausschließlich klar synthetische
Fixtures.

## API- und OpenAPI-Vertrag

Implementiere mindestens:

- `GET /api/cases/{caseId}/notice-drafts` – alle Entwürfe des Falls stabil
  nach Erstellzeit absteigend und GUID aufsteigend als Tie-Breaker sortiert;
- `POST /api/cases/{caseId}/notice-drafts` – Entwurf anlegen, `201`,
  `Location` und starker `ETag`;
- `GET /api/notice-drafts/{noticeDraftId}` – Detail samt Fachrevisionen und
  starkem `ETag`;
- `POST /api/notice-drafts/{noticeDraftId}/corrections` – begründete
  Korrektur mit `If-Match`;
- `POST /api/notice-drafts/{noticeDraftId}/discard` – begründetes Verwerfen
  mit `If-Match`;
- `GET /api/program-configuration/notice-number` – aktuelle Konfiguration mit
  starkem `ETag` beziehungsweise `204`;
- `POST /api/program-configuration/notice-number` – erstmalige administrative
  Anlage mit `201`, `Location` und starkem `ETag`;
- `PUT /api/program-configuration/notice-number/{id}` – administrative
  versionierte Änderung mit `If-Match` und neuem starkem `ETag`.

Verwende `401` ohne HTML-Redirect, `403`, `404`, `409`, `412` und `428`
entsprechend den vorhandenen Mustern. Alle Mutationen verlangen Antiforgery.
DTOs enthalten keine internen Auditwerte oder unbenötigten
Beteiligten-/Adressdaten. OpenAPI dokumentiert Authentifizierung,
Antiforgery, ETags, Fehler und Zustände vollständig.

## Frontend

- Ergänze in der Fallakte einen klar vom Abschnitt `Vorläufige
  Altprojektion` getrennten Bereich `Kanonische Bescheidentwürfe`.
- Zeige mehrere Entwürfe, Nummer, Status, Zahlungspflichtigenanzeige,
  manuellen Faktenkern, Version und Fachrevisionen zugänglich und responsiv.
- Biete beiden Rollen Anlage, Korrektur und Verwerfen aktiver Entwürfe.
- Verwende die vorhandene Beteiligten-Schnellsuche für die Auswahl.
- Zeige den aktuellen Nutzungsberechtigten nur als Vorschlag. Eine zugänglich
  beschriftete aktive Bestätigung ist vor Anlage und nach jeder Änderung der
  Zahlungspflichtigenauswahl zwingend.
- Erhalte Formulareingaben bei `403`, Validierungsfehlern und
  Versionskonflikten. Bei `412` aktuelle Fakten neu laden und eine bewusste
  erneute Eingabe ermöglichen; niemals automatisch überschreiben.
- Ein verworfener Entwurf bleibt lesbar, besitzt aber keine
  Änderungsaktionen.
- Ergänze für `Administration` eine Seite zur Nummernkonfiguration. Die
  serverseitige Policy bleibt maßgeblich; Sachbearbeitung sieht keine
  administrative Navigation.
- Wenn keine Konfiguration existiert oder die Stellenzahl erschöpft ist,
  erklärt die UI den blockierten Entwurf verständlich und verweist auf die
  Administration. Sie erfindet keinen Default.
- Ergänze keine PDF-, Druck-, Vorschau-, Versand-, Freigabe-, FINANZ+-,
  Zahlungs-, Mahn- oder Auditoberfläche.

## Pflichtnachweise

### Unit-Tests

- alle Feld-, Geld-, Zustands- und Textvalidierungen;
- `EUR` und exakte Skala ohne Rundung;
- Zahlungspflichtigenbestätigung und kein Ableitungsfallback;
- mehrere Entwürfe je Fall;
- Jahressequenz, Format, Polsterung, Jahreswechsel,
  Konfigurationssnapshot und Erschöpfung über kontrollierten `TimeProvider`;
- Korrektur/Verwerfen, unveränderliche Felder, Pflichtgrund und verworfene
  Unveränderlichkeit;
- exakt zwei Rollen sowie Policy- und Capabilitymatrix.

### API-/Provider-Integrationstests ohne reale Daten

- `401`/`403`, kein Redirect und keine Teilwirkung;
- beide Rollen dürfen Entwurfsfachoperationen;
- Sachbearbeitung erhält für jede Konfigurationsmutation `403`;
- Administration kann Konfiguration anlegen und versioniert ändern;
- fehlende Konfiguration blockiert Anlage ohne Sequenzverbrauch;
- fehlende/falsche Zahlungspflichtigenbestätigung und ungültige Referenzen
  bleiben teilwirkungslos;
- mehrere Entwürfe desselben Falls erhalten getrennte IDs und Nummern;
- Korrektur und Verwerfen mit richtigem, fehlendem und veraltetem ETag;
- verworfener Entwurf bleibt lesbar und unveränderlich;
- jede erfolgreiche Mutation erzeugt genau eine passende Revision und einen
  sparsamen Audit; abgelehnte Requests erzeugen nichts;
- Konfigurationsänderungen ändern alte Nummern und Snapshots nicht;
- parallele Anlagen erzeugen eindeutige lückenlos committed Zahlen ohne
  Dubletten; ein späteres Verwerfen gibt nichts frei;
- keine DTO-/OpenAPI-Felder für Adresse, Auditinhalt, Buchungstext,
  Wiederholungsdaten, Zahlung oder Mahnung;
- unveränderte `ReadNotices`-/`ReadFeeItems`- und Suchverträge;
- Synthetic- und EF-Providerparität.

### Frontendtests

- getrennte Darstellung von Altprojektion und kanonischen Entwürfen;
- mehrere Entwürfe und verworfener Read-only-Zustand;
- vorgeschlagener Inhaber wird ohne aktive Bestätigung nicht gespeichert;
- manuelle abweichende Auswahl und erneute Bestätigung;
- Konfigurationsfehler, Feldfehler, `403` und `412` ohne Eingabeverlust;
- Rollenabhängigkeit der Konfigurationsnavigation und serverseitige
  Ablehnung;
- keine Dokument-, Druck-, Versand- oder FINANZ+-Funktion.

### Optionale isolierte SQL-Suite

Nur bei ausdrücklich autorisierter separater Testverbindung:

- Migration vom aktuellen letzten Stand auf eine neue temporäre Datenbank;
- Constraints, Fremdschlüssel, Präzision, Eindeutigkeit und
  Konfigurationssnapshot;
- echte parallele Nummernvergabe und Rollbackteilwirkungsfreiheit;
- Entwurf/Revision/Audit atomar;
- Providerparität des vollständigen Ablaufs;
- sichere Entfernung der temporären Datenbank und Nachweis, dass keine
  `Cemaris_IntegrationTests_*`-Datenbank verbleibt.

## Nicht-Ziele und Stop-Gates

Nicht implementieren:

- Gebührenkatalog, Gebührenordnung, Gebührensätze oder Preiszuordnung je
  Friedhof/Grabart;
- Mengen, Einheiten, Steuer, Ermäßigung, Befreiung, Rundung, Summen- oder
  Fälligkeitsberechnung;
- Bescheiderzeugung, Vorlage, DOCX/PDF, Vorschau, Druck, Signatur, Versand,
  Bekanntgabe oder Rechtsbehelfsbelehrung;
- Freigabe, Vier-Augen-Prinzip, Festsetzung, Aufhebung, Storno oder
  Korrekturbescheid;
- Zahlung, Zahlungsstatus, Mahnung, Erstattung oder FINANZ+-Schnittstelle;
- Speicherung von Wiederholungsbeginn/-ende oder Buchungstext;
- neue Rolle, produktive Berechtigung oder echte Verwaltungsdaten;
- Änderung, Zusammenführung oder Rückinterpretation von `ReadNotices` und
  `ReadFeeItems`;
- EDWALT-Auswertung, Gebührenstamm, Mapping, Backfill oder Migration;
- externe Satzungs-, Vorlagen- oder DMS-Arbeit.

Wenn eine zwingend benötigte Entscheidung trotz der
[6F-Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md)
wirklich fehlt oder widersprüchlich ist, stoppe nur den betroffenen
unabtrennbaren Teil, dokumentiere den konkreten Befund und erfinde keinen
Default. Nutze diese Regel nicht, um den vollständig freigegebenen
Entwurfskern unnötig unvollständig zu lassen.

## Dokumentationsergebnisse

- Erstelle `docs/implementation/cemaris-increment-6b-completion.md` mit
  Ausgangsstand, Architektur, Migration, Verträgen, Tests, SQL-Status,
  Schutzgrenzen und finalem Git-Nachweis.
- Aktualisiere Root-README, alle fünf Dokumentationsindizes sowie betroffene
  Anforderungen, Architektur-, Sicherheits-, Dokument- und
  Migrationsgrenzen auf den tatsächlich implementierten Stand.
- Markiere diese Übergabe nach Ausführung sichtbar als abgeschlossen.
- Ändere ADR-0018 nicht rückwirkend; ergänze ein neues ADR nur bei einer
  tatsächlich neuen Architekturentscheidung.
- Erstelle als kleinsten sicheren Folgeschritt ein ausschließlich
  dokumentarisches, kontextlos ausführbares Entscheidungsgate für die spätere
  Bescheiderzeugung. Es darf keine Vorlage, Rechtswirkung, Zustellung,
  Korrektur, Aufbewahrung oder Integration vorwegnehmen und noch keinen
  technischen Dokumentauftrag erteilen.

## Abschlussprüfungen

Verwende für .NET ausschließlich das festgelegte SDK und führe mindestens aus:

1. `dotnet format Cemaris.sln --verify-no-changes --no-restore`;
2. Release-Build der vollständigen Solution mit 0 Warnungen und 0 Fehlern;
3. vollständige Unit-Tests;
4. Integrationstests mit `Category!=SqlServer`;
5. nur bei ausdrücklicher Autorisierung die getrennte SQL-Kategorie;
6. `npm ci`;
7. vollständige Frontendtests;
8. Frontend-Lint;
9. Frontend-Produktionsbuild;
10. `git diff --check`;
11. lokale Markdown-Links und -Anker, Tabellen und Whitespace;
12. repositorybasierte Secret- und Verwaltungsdatenprüfung ohne User Secrets
    und ohne Ausgabe gefundener Werte;
13. vollständige finale Git-Prüfung einschließlich aller unversionierten
    Inhalte;
14. Metadatenvergleich von `tmp/pagination-build`;
15. Bestätigung, dass externe Arbeitswurzeln, EDWALT, `Cemaris_Dev` und User
    Secrets unberührt blieben;
16. Bestätigung, dass nichts gestagt und kein Commit erstellt wurde.

Der Auftrag ist erst abgeschlossen, wenn alle in der autorisierten Umgebung
ausführbaren Prüfungen grün sind, keine bekannte Regression verbleibt und
Abweichungen wie eine nicht autorisierte SQL-Kategorie ausdrücklich statt
scheinbar erfolgreich dokumentiert sind.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-increment-6b-next-step-handoff.md

Diese Übergabe ist verbindlich. Implementiere den dort freigegebenen
kanonischen Kern für manuelle, rechtlich wirkungslose Bescheidentwürfe
vollständig Ende zu Ende. Bescheiderzeugung, Gebührenberechnung,
FINANZ+-Integration, echte Verwaltungsdaten und EDWALT-Migration bleiben
außerhalb.

Untersuche vor jeder Änderung den vollständigen tatsächlichen Git-Stand und
erhalte sämtliche vorhandene Arbeit. Die 6a-F-Dokumentation, ADR-0018 und die
6b-Übergabe können committed, gepusht oder noch uncommittiert vorliegen. Führe
keinen Reset durch, stage nichts, erstelle keinen Commit und verändere
tmp/pagination-build nicht.

Repository und einziges Verzeichnis für versionierte Änderungen:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Verwende für .NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus, lies keine User Secrets und greife nicht auf Cemaris_Dev zu.
Starte weder API noch Frontend-Dev-Server noch Browser. Eine SQL-Suite ist nur
mit einer ausdrücklich autorisierten separaten temporären Testverbindung
zulässig; andernfalls dokumentiere sie als nicht ausgeführt und schließe alle
übrigen Prüfungen ab.

Arbeite bis zum vollständigen nachgewiesenen Abschluss einschließlich
Domain/Application, Synthetic- und EF-/SQL-Provider, regulärer additiver
EF-Migration, Capability, Policies, API/OpenAPI, React-UI, Unit-,
Integrations- und Frontendtests, Dokumentation, Folgegate sowie sämtlicher in
der Übergabe geforderter Sicherheits- und Git-Prüfungen.
```
