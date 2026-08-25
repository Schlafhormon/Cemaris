# Cemaris

> Open-Source-Friedhofsverwaltung für Kommunen

## Status

> **Cemaris befindet sich in aktiver, inkrementeller Produktentwicklung. Der
> erste lesende MVP und die synthetische Development-Fallaktenbearbeitung
> mit atomarem Änderungsnachweis sind technisch umgesetzt; die Software ist
> noch nicht für
> den Produktivbetrieb oder echte Verwaltungsdaten freigegeben.**

Die Produktentwicklung wird jetzt vor der weiteren EDWALT-Importanalyse
fortgesetzt. Fachliche Regeln, Identität, Berechtigungen, Audit, Datenschutz
und Betrieb werden nur in klar abgegrenzten, geprüften Inkrementen ergänzt.
Unbekannte Regeln werden weiterhin nicht geraten.

## Motivation

Viele kommunale Friedhofsverwaltungen arbeiten mit langjährig gewachsenen beziehungsweise technisch veralteten Fachverfahren und zusätzlichen Excel-, Word-, Papier- oder Laufwerkslösungen. Cemaris verfolgt das Ziel, eine moderne, offene, nachnutzbare und kommunal geeignete Alternative zu entwickeln.

Ausgangspunkt ist die Ablösung des bestehenden Verfahrens **EDWALT** durch
eine neue, eigenständige Open-Source-Friedhofsverwaltungssoftware. EDWALT wird
nicht 1:1 funktional oder technisch nachgebaut; seine Daten sollen jedoch
kontrolliert in Cemaris migriert werden. Welche heutigen Fachprozesse Cemaris
unterstützen muss, wird unabhängig von den EDWALT-Masken und -Modulen erhoben.

## Ziele

- Open Source und gemeinschaftliche Nachnutzung,
- On-Premises-fähiger Betrieb,
- browserbasierte, responsive und barrierearme Oberfläche,
- Microsoft-SQL-Server-Unterstützung,
- offene REST-/OpenAPI-Schnittstellen,
- austauschbare DMS-Integration mit Winyard als erster zu prüfender Zielintegration,
- konfigurierbares Dokument- und Bescheidwesen,
- nachvollziehbare Fachprozesse und Änderungen,
- gute Nachnutzbarkeit durch andere Kommunen,
- möglichst wenig Vendor-Lock-in.

## Geplante Produktbereiche

Die folgenden Punkte sind eine **zu validierende Produktvision**, keine verbindliche Anforderungsliste:

- mehrere Friedhöfe und deren räumliche Struktur,
- Personen, Verstorbene, Beisetzungen und Nutzungsrechte,
- Ruhefristen, Verlängerungen, Vorgänge und Wiedervorlagen,
- Gebühren, Bescheide, Schreiben und kommunale Vorlagen,
- DMS-Integration, insbesondere Winyard,
- Suche, Auswertungen, Rollen, Berechtigungen und Auditierung,
- EDWALT-Datenmigration,
- perspektivisch digitale Friedhofskarten und mobile/PWA-Nutzung.

Grabarten, Fristen, Gebühren, Rollen, Satzungslogik, Dokumenttexte und konkrete Verwaltungsabläufe sind noch unbekannt und werden nicht geraten.

## Aktueller Projektstand

Vorbereitet sind:

- eine .NET-10-Solution mit getrennter Domain-, Application-, Infrastructure- und API-Schicht,
- eine React-/TypeScript-/Vite-Oberfläche,
- REST-Grundlage mit OpenAPI, zentraler Fehlerbehandlung, Health Check und nicht sensitiver Systeminfo,
- ein erster ausschliesslich lesender MVP fuer Suche und Detailansicht mit klar synthetischen Daten,
- eine standardmäßig deaktivierte, ausschließlich synthetische Development-
  Bearbeitung für Grabstellenbezug, verstorbene Personen und Beisetzungen,
- einen providerneutralen Akteursvertrag, einen atomaren minimalen
  Falländerungsnachweis und die Anzeige der letzten Änderung,
- persistierte lokale Konten, Cookie-Sitzung, CSRF, Rollenpolicies und eine
  administrative Benutzerverwaltung,
- eine standardmäßig deaktivierte synthetische Friedhofs- und
  Grabstellenstammdatenpflege mit kanonischem Fallaktenbezug,
- einen standardmäßig deaktivierten einfachen synthetischen
  Beisetzungsprozess mit atomarer Grabstellenstatuskopplung,
- einen standardmäßig deaktivierten synthetischen Beteiligten-/
  Nutzungsrechtskern mit kanonischen Identitäten und Fachhistorie,
- ein bewusst schmales EF-Core-Fall-/Leseschema mit synthetischem Standardprovider und optionaler SQL-Server-Anbindung,
- eine minimale herstellerneutrale DMS-Erweiterungsstelle,
- Unit- und Integrationstests,
- Docker- und CI-Konfiguration,
- ADRs sowie Arbeitsunterlagen für EDWALT-Inventur, Anforderungen und Migration.

Die technische EDWALT-Analyse ist nach Phase 4 kontrolliert pausiert. Die
Produktinkremente 1, 2, 3a, 3b, 4a und 4b sind technisch abgeschlossen, aber weder
fachlich noch produktiv freigegeben. Der SQL-Schreibpfad, seine atomare
Änderungszuordnung und die Migration wurden gegen `CEMARISDEV` verifiziert.
Lokale Konten, sichere Cookie-Sitzung, CSRF, serverseitige Policies und
administrative Benutzerverwaltung sind umgesetzt. Die frei konfigurierbare
Friedhofsstruktur, der leere Grabartenkatalog, Grabstellen und der kanonische
Fallbezug sind gemäß
[Abschlussdokumentation 4a](docs/implementation/cemaris-increment-4a-completion.md)
technisch umgesetzt. Der einfache synthetische Beisetzungsprozess ist gemäß
[Abschlussdokumentation 4b](docs/implementation/cemaris-increment-4b-completion.md)
technisch umgesetzt. Das fachliche
[Entscheidungsgate 5a](docs/implementation/cemaris-increment-5a-completion.md)
ist dokumentarisch abgeschlossen. Der
[manuelle 5b-Beteiligten-/Nutzungsrechtskern](docs/implementation/cemaris-increment-5b-completion.md)
ist technisch umgesetzt und gegen reales SQL verifiziert. Das nachgelagerte
[5c-Abnahme- und Lebenszyklus-Entscheidungsgate](docs/implementation/cemaris-increment-5c-completion.md)
und die daraus bestätigten
[5d-Bedienkorrekturen](docs/implementation/cemaris-increment-5d-completion.md)
sind abgeschlossen. Auch die isolierte
[5e-Stabilisierung des CSRF-Sitzungswechsels](docs/implementation/cemaris-increment-5e-completion.md)
ist technisch abgeschlossen. Das
[5f-Nutzungsrechtslebenszyklus-Entscheidungsgate](docs/implementation/cemaris-increment-5f-completion.md)
ist dokumentarisch mit Variante A „keine Implementierung“ abgeschlossen. Der
nachfolgende
[5g-Kurzentscheidungs- und Freigabegate](docs/implementation/cemaris-increment-5g-completion.md)
bestätigt mangels kommunaler Fach- und Freigabequellen erneut Variante A.
Fristberechnung, Statuswirkung und Wiedervorlagen bleiben offen. Das
[5h-Auswahlgate](docs/implementation/cemaris-increment-5h-completion.md) hat
als nächsten fachregelarmen Schnitt eine deterministische, serverseitig
paginierte Beteiligtenübersicht ausgewählt. Sie ist gemäß
[Inkrement 5i](docs/implementation/cemaris-increment-5i-completion.md) Ende zu
Ende umgesetzt; die bestehende Nutzungsrechts-Schnellsuche bleibt kompatibel.
Ihre rein interne datensparsame
[SQL-Projektion 5j](docs/implementation/cemaris-increment-5j-completion.md)
ist ebenfalls umgesetzt, ohne den Array-Vertrag oder die Inhaberauswahl zu
ändern. Die Projektentscheidung vom 25.08.2026 ist mit
[Inkrement 5k](docs/implementation/cemaris-increment-5k-completion.md)
technisch abgeschlossen. Die bewusste lokale Beibehaltung eines versionierten
Testkennworts ist nur für den vom Projektverantwortlichen bestätigten
isolierten Development-Testbetrieb akzeptiert. `Cemaris_Dev` ist die
dauerhafte lokale Development-Datenbank,
alle aktuellen Funktionen sind auf SQL nachgewiesen, `admin` und `sach`
dauerhaft eingerichtet und ausschließlich nicht personenbezogene EDWALT-
Friedhofsstammdaten migriert.
Der nächste sichere Schritt ist das ausschließlich dokumentarische
[Inkrement 6a](docs/implementation/cemaris-increment-6a-next-step-handoff.md):
ein Gebühren-/Bescheid-Entscheidungsgate. Es implementiert weder einen
Gebührenkatalog noch Berechnung, Bescheiderzeugung, Dokumentverarbeitung oder
einen weiteren EDWALT-Import.
Die weitere Inkrementfolge beschreibt der
[Cemaris-Implementierungsplan](docs/implementation/README.md).

## Technische Zielarchitektur

Cemaris wird als modularer Monolith aufgebaut:

```text
Browser → Reverse Proxy → React/TypeScript → ASP.NET Core REST API → Microsoft SQL Server
                                      └────→ abstrahierte externe Adapter, z. B. DMS
```

- Backend: .NET 10 LTS, ASP.NET Core, C#, Minimal APIs, OpenAPI, EF Core
- Frontend: React 19, TypeScript, Vite
- Datenbank: Microsoft SQL Server über konfigurierbaren Connection String
- Betrieb: On-Premises, perspektivisch containerisiert, hinter einem Reverse Proxy
- Integration: Ports/Adapter für Winyard, Identität und weitere technische Systeme

Details stehen in der [Architekturübersicht](docs/architecture/README.md) und den [ADRs](docs/decisions/README.md).

## Repository-Struktur

```text
.
├── .github/                  # CI und Issue-/PR-Vorlagen
├── docs/
│   ├── architecture/         # technische Zielbilder und offene Integrationsfragen
│   ├── decisions/            # Architecture Decision Records
│   ├── implementation/       # Produktinkremente und ausführbare Übergaben
│   ├── migration/            # EDWALT-Migrationsstrategie
│   └── requirements/         # Bedarfsanalyse und EDWALT-Inventur
├── src/
│   ├── Cemaris.Api/          # ASP.NET-Core-Host und HTTP-Endpunkte
│   ├── Cemaris.Application/  # Anwendungsgrenzen und externe Ports
│   ├── Cemaris.Domain/       # minimale Fallakten-Grundlage ohne offene Fachregeln
│   ├── Cemaris.Infrastructure/ # EF Core, SQL Server, spätere Adapter
│   └── Cemaris.Web/          # React-/TypeScript-Frontend
├── tests/
│   ├── Cemaris.UnitTests/
│   └── Cemaris.IntegrationTests/
└── tools/                    # spätere reproduzierbare Analysewerkzeuge
```

## Lokale Entwicklung

### Voraussetzungen

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) – `global.json` verwendet SDK 10.0.302 mit Feature-Band-Rollforward,
- Node.js `^20.19.0 || >=22.12.0` und npm,
- optional Docker für die containerisierte Umgebung,
- optional ein SQL Server; die vorhandenen neutralen Endpunkte verwenden nur
  das vorläufige Fall-/Leseschema und kein freigegebenes Fachschema.

### Backend starten

Im Repository-Stamm:

```powershell
dotnet restore Cemaris.sln
dotnet tool restore
dotnet run --project src/Cemaris.Api --launch-profile http
```

Danach sind anonym verfügbar:

- Health Check: <http://localhost:5050/health>
- Systeminfo: <http://localhost:5050/api/system/info>
- OpenAPI (nur Development): <http://localhost:5050/openapi/v1.json>

Suche, Falldetails und optionale Fallmutationen erfordern eine lokale
Anmeldung. Das Frontend führt nicht angemeldete Benutzer auf die Loginseite.
Die Suche unterstützt eine stabile serverseitige Seitennavigation. Ohne
Parameter liefert `GET /api/search` altkompatibel die erste Seite mit zehn
Treffern; `page` und `pageSize` wählen Seite und Seitengröße. Die Oberfläche
hält Filter, Seite und Seitengröße in der URL und bietet derzeit fünf oder zehn
Treffer pro Seite an.

Die Schreibfunktion ist standardmäßig aus. Für eine lokale, ausschließlich
synthetische Development-Sitzung muss sie ausdrücklich aktiviert werden:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Features__CaseEditingEnabled = "true"
$env:Features__CemeteryMasterDataEditingEnabled = "true"
$env:Features__BurialProcessEditingEnabled = "true"
$env:Features__PersonUsageRightsEditingEnabled = "true"
dotnet run --project src/Cemaris.Api
```

Außerhalb von `Development` verweigert die API bei diesem Aktivierungsversuch
den Start. Diese Grenze ersetzt keine Authentifizierung oder Autorisierung.
Jede erfolgreiche Mutation wird dem serverseitig authentifizierten lokalen
Benutzer zugeordnet und atomar minimal nachgewiesen. Nach dem Start sind
zusätzlich verfügbar:

- `POST /api/cases`;
- `PUT /api/cases/{caseId}/grave`;
- `POST` und `PUT /api/cases/{caseId}/deceased-persons[/personId]`;
- `POST` und `PUT /api/cases/{caseId}/burials[/burialId]`.
- `GET /api/master-data/cemeteries` sowie `POST`/`PUT` für Friedhöfe,
  Bereiche, Felder, Reihen, Grabarten, Zuordnungen und Grabstellen;
- `DELETE /api/master-data/{kind}/{id}` ausschließlich für Administration
  und vollständig unbenutzte Datensätze;
- bei aktiver Beisetzungsprozess-Capability die Prozessanlage, kontrollierte
  Faktenkorrektur, festgelegte Übergänge und ausdrückliche Altzeilenübernahme;
- bei aktiver Beteiligten-/Nutzungsrechts-Capability kanonische Beteiligte,
  Anschriften, manuelle Rechteanlage, Übertragung, Verlängerung, Korrektur
  und Lesen der Startregeln;
- Startregeln schreiben ausschließlich über die administrative
  Programmkonfiguration.

Ist `Features__BurialProcessEditingEnabled` aktiv, ersetzt der 4b-Prozess die
alten einfachen Beisetzungsschreibendpunkte. Die vier fachlichen Capabilities
bleiben ansonsten unabhängig. Der 5b-Kern ersetzt die nullable
Berechtigten-/Adress-/Nutzungsrechts-Altprojektionen nicht.

Änderungen benötigen den zuletzt gelesenen starken ETag in `If-Match`. Ein
fehlender Header ergibt `428`, ein veralteter ETag `412` ohne Teilwirkung.
Die UI bietet bei aktiver Capability `/cases/new` und `/cases/{id}/edit` an
und zeigt in Detail und Bearbeitung „Zuletzt geändert durch …“. Migrierte
Altzeilen ohne Zuordnung erhalten einen neutralen Hinweis.

### Frontend starten

In einem zweiten Terminal:

```powershell
cd src/Cemaris.Web
npm ci
npm run dev
```

Das Frontend läuft unter <http://localhost:5173>. Vite leitet `/health` und `/api` in der Entwicklung standardmäßig an `http://localhost:5050` weiter. Die Statuskarte zeigt die erfolgreiche Verbindung.

### Dauerhafter lokaler SQL-Developmentbetrieb

Der portable Repository- und CI-Default bleibt `Synthetic` mit deaktivierten
Capabilities. Auf dem autorisierten lokalen Arbeitsplatz ist dagegen die
bereits vorhandene Datenbank `Cemaris_Dev` der dauerhafte Development-Standard.
Verbindung, Provider, vier Capabilities und erwarteter Datenbankname liegen
maschinenlokal in User Secrets. Verbindungs- und Passwortwerte werden weder
im Repository noch in Befehlen oder Logs ausgegeben.

Nicht geheime Einstellungen können einmalig gesetzt werden:

```powershell
dotnet user-secrets set --project src/Cemaris.Api "ReadModel:Provider" "SqlServer"
dotnet user-secrets set --project src/Cemaris.Api "Features:CaseEditingEnabled" "true"
dotnet user-secrets set --project src/Cemaris.Api "Features:CemeteryMasterDataEditingEnabled" "true"
dotnet user-secrets set --project src/Cemaris.Api "Features:BurialProcessEditingEnabled" "true"
dotnet user-secrets set --project src/Cemaris.Api "Features:PersonUsageRightsEditingEnabled" "true"
dotnet user-secrets set --project src/Cemaris.Api "Maintenance:ExpectedDatabase" "Cemaris_Dev"
```

Die autorisierte Verbindung wird getrennt und geheim unter
`ConnectionStrings:CemarisDatabase` bereitgestellt. Die API verändert beim
normalen Start weder Schema noch Daten. Für das einmalige EF-Update wird der
nicht geheime Wartungsschalter lokal gesetzt und direkt danach entfernt:

```powershell
$env:DOTNET_ENVIRONMENT = "Development"
dotnet user-secrets set --project src/Cemaris.Api "Maintenance:ApplyMigrations" "true"
dotnet run --project src/Cemaris.Api --no-launch-profile
dotnet user-secrets remove --project src/Cemaris.Api "Maintenance:ApplyMigrations"
```

Der Wartungspfad öffnet zuerst ausschließlich die konfigurierte Verbindung,
prüft den tatsächlich aufgelösten Datenbanknamen exakt und führt nur dann die
vorhandenen EF-Migrationen aus. Er erstellt, löscht, leert, ersetzt oder
benennt keine Datenbank um.

Klar gekennzeichnete synthetische Personen- und Falldaten werden additiv und
idempotent dauerhaft gespeichert. Vorhandene synthetische und manuelle Daten
bleiben unverändert; Kollisionen mit nichtsynthetischen Fixture-IDs brechen
vollständig ab:

```powershell
dotnet user-secrets set --project src/Cemaris.Api "Maintenance:EnsureSyntheticDevelopmentData" "true"
dotnet run --project src/Cemaris.Api --no-launch-profile
dotnet user-secrets remove --project src/Cemaris.Api "Maintenance:EnsureSyntheticDevelopmentData"
```

### Dauerhafte lokale Development-Konten

Die beiden festen Konten heißen `admin` mit `Administration` und `sach` mit
`Sachbearbeitung`. Ihre sicheren Passwörter werden ausschließlich lokal unter
`Maintenance:DevelopmentAccounts:AdminPassword` und
`Maintenance:DevelopmentAccounts:CaseWorkerPassword` bereitgestellt, nicht
als Kommandozeilenargument. Ohne Visual Studio wird dazu in VS Code die Datei
`%APPDATA%\Microsoft\UserSecrets\5bd9d3ee-a624-45d4-9f18-71fb619427eb\secrets.json`
geöffnet und das vorhandene JSON um diese beiden Schlüssel ergänzt. Die Werte
werden lokal durch zwei eigene sichere Passwörter ersetzt und niemals in Git
übernommen:

```json
{
  "Maintenance:DevelopmentAccounts:AdminPassword": "<lokales sicheres Passwort>",
  "Maintenance:DevelopmentAccounts:CaseWorkerPassword": "<lokales sicheres Passwort>"
}
```

Andere vorhandene Secret-Schlüssel bleiben dabei erhalten. Danach erfolgt
genau ein kontrollierter Lauf:

```powershell
dotnet user-secrets set --project src/Cemaris.Api "Maintenance:EnsureDevelopmentAccounts" "true"
dotnet run --project src/Cemaris.Api --no-launch-profile
dotnet user-secrets remove --project src/Cemaris.Api "Maintenance:EnsureDevelopmentAccounts"
```

Der Lauf prüft SQL-Provider, aktuelles Schema und den exakt aufgelösten Namen
`Cemaris_Dev`. Bereits vollständig passende Konten einschließlich Passwort und
Security-Stamp bleiben unverändert. Fehlende Konten werden atomar ergänzt;
eine abweichende bestehende Zuordnung bricht vor jeder Änderung vollständig
ab. Ein normaler Start, der synthetische Datenlauf und der EDWALT-Import
ändern keine Konten oder Passwörter.

Die Migrationen liegen unter
`src/Cemaris.Infrastructure/Persistence/Migrations`. Produktive
Schemadeployments erfolgen später kontrolliert über ein geprüftes SQL-Skript
und nicht beim Anwendungsstart.

### Abgegrenzte EDWALT-Friedhofsstammdatenmigration

Das Werkzeug unter `tools/Cemaris.EdWaltMigration` liest ausschließlich die
im [5k-Mapping](docs/migration/edwalt-cemetery-master-data-mapping.md)
positiv gelisteten Bytebereiche. Analyse und Dry-run benötigen keine
Datenbankverbindung. `apply` und `reconcile` verwenden die bereits lokal
autorisierte Cemaris-Verbindung und geben sie nicht aus:

```powershell
$sdk = 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe'
$source = 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811'
$run = 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825'

& $sdk run --project tools/Cemaris.EdWaltMigration -- analyze $source $run
& $sdk run --project tools/Cemaris.EdWaltMigration -- dry-run $source $run
& $sdk run --project tools/Cemaris.EdWaltMigration -- apply $source $run Cemaris_Dev
& $sdk run --project tools/Cemaris.EdWaltMigration -- reconcile $source $run
```

Die vorhandenen Phase-2-/3-/4-Bestände bleiben read-only. Laufberichte werden
nur in der neuen Phase-5-Wurzel angelegt und enthalten keine Quellwerte. Die
breite Personen-, Fall-, Rechte-, Gebühren-, Bescheid-, Buchungs-, Notiz-,
Dokument-, Benutzer- und Konfigurationsmigration bleibt ausgeschlossen.

### Qualität prüfen

```powershell
dotnet build Cemaris.sln --configuration Release
dotnet test Cemaris.sln --configuration Release --no-build
dotnet format Cemaris.sln --verify-no-changes --no-restore

cd src/Cemaris.Web
npm ci
npm test -- --run
npm run lint
npm run build
```

### Optionale SQL-Server-Integrationstests

Die regulaere Testsuite benoetigt keinen SQL Server. Fuer einen zusaetzlichen
End-to-End-Test des EF-/SQL-Stores kann eine Verbindung zu einer lokalen
SQL-Server-Instanz explizit bereitgestellt werden:

```powershell
$env:CEMARIS_SQL_TEST_CONNECTION_STRING = "<prozesslokal bereitgestellte Testverbindung>"
dotnet test tests/Cemaris.IntegrationTests --filter "Category=SqlServer"
Remove-Item Env:CEMARIS_SQL_TEST_CONNECTION_STRING
```

Der verwendete Login muss Datenbanken anlegen und löschen dürfen. Die
SQL-Tests erzeugen ausschließlich eindeutig benannte temporäre Datenbanken
`Cemaris_IntegrationTests_*`, prüfen additive Migration, Seed, Suche,
Detailansicht, Providerparität, Konteneinrichtung, Importidempotenz,
Schreib-/Auditatomarität, 5b-Historie, echte Parallelrennen und Rollback und
entfernen die Datenbanken anschließend wieder. Vor dem Löschen werden Präfix und
aufgelöster Datenbankname erneut geprüft. Ohne die Umgebungsvariable werden
diese Tests übersprungen.

## Konfiguration

ASP.NET Core liest `appsettings.json`, `appsettings.{Environment}.json`, Environment Variables und Kommandozeilenargumente. Doppelte Unterstriche bilden verschachtelte Schlüssel ab.

| Einstellung | Zweck | Beispiel |
| --- | --- | --- |
| `ConnectionStrings__CemarisDatabase` | externer SQL-Server-Connection-String | `<externer Secretwert>` |
| `Cors__AllowedOrigins__0` | erlaubter Entwicklungs-Frontend-Origin | `http://localhost:5173` |
| `OpenApi__Enabled` | OpenAPI-Dokument aktivieren | `true` nur in kontrollierten Umgebungen |
| `ReadModel__Provider` | kanonischer Fall-/Lesestore (`Synthetic` oder `SqlServer`) | portabler Default `Synthetic`; maschinenlokal nach 5k `SqlServer` für `Cemaris_Dev` |
| `Features__CaseEditingEnabled` | synthetische Fallaktenbearbeitung; nur in `Development` zulässig | `false` (Standard), lokal ausdrücklich `true` |
| `Features__CemeteryMasterDataEditingEnabled` | Friedhofsstammdatenpflege; nur in `Development` zulässig | `false` (portabler Standard), lokal ausdrücklich `true` |
| `Features__BurialProcessEditingEnabled` | einfacher synthetischer Beisetzungsprozess; nur in `Development` zulässig | `false` (portabler Standard), lokal ausdrücklich `true` |
| `Features__PersonUsageRightsEditingEnabled` | synthetischer kanonischer Beteiligten-/Nutzungsrechtskern; nur in `Development` zulässig | `false` (portabler Standard), lokal ausdrücklich `true` |
| `Identity__Security__PasswordMinimumLength` | untere Passwortgrenze, nicht unter 12 konfigurierbar | `12` |
| `Identity__Security__PasswordMaximumLength` | obere Passwortgrenze, nicht über 128 konfigurierbar | `128` |
| `Identity__Security__MaximumFailedLoginAttempts` | Fehlversuche bis zur Sperre, höchstens 5 | `5` |
| `Identity__Security__LockoutDuration` | Sperrdauer, mindestens 15 Minuten | `00:15:00` |
| `Identity__Security__SessionIdleTimeout` | Inaktivitätsdauer der Cookie-Sitzung | `00:30:00` |
| `Search__MaxResults` | maximale Seitengröße und Standardgröße der Suche | `10` |
| `Maintenance__ExpectedDatabase` | Sicherheitsprüfung für lokale SQL-Wartungs- und Importläufe | `Cemaris_Dev` |
| `Maintenance__ApplyMigrations` | einmaliger selbstbeendender EF-Schemalauf | `false` |
| `Maintenance__EnsureSyntheticDevelopmentData` | einmalige additive, idempotente SQL-Ablage der synthetischen Fallfixtures | `false` |
| `Maintenance__EnsureDevelopmentAccounts` | einmalige atomare Einrichtung beziehungsweise Prüfung von `admin` und `sach` | `false` |
| `VITE_API_BASE_URL` | API-Basis-URL im gebauten Browserclient | leer für denselben Origin |
| `VITE_API_PROXY_TARGET` | Vite-Dev-Proxy | `http://localhost:5050` |

Beispielwerte sind keine produktiven Zugangsdaten. Echte Secrets gehören in User Secrets oder einen betrieblichen Secret Store und niemals in Git. `TrustServerCertificate=True` ist nur für kontrollierte Entwicklung gedacht.

## Docker-Entwicklung

Die automatisch geladene `docker-compose.override.yml` ergänzt ausschließlich für die lokale Entwicklung einen SQL-Server-2022-Developer-Container.

```powershell
Copy-Item .env.example .env
# CEMARIS_SQL_PASSWORD in .env zwingend ändern
docker compose up --build
```

Frontend: <http://localhost:5173> · API: <http://localhost:5050>

```powershell
docker compose down
```

Die SQL-Daten bleiben im benannten Docker-Volume erhalten. Das Beispielpasswort muss vor dem ersten Start geändert werden.

Für einen späteren produktiven Betrieb wird `docker-compose.override.yml` nicht verwendet. Der SQL Server wird extern betrieben und über `CEMARIS_CONNECTION_STRING` beziehungsweise `ConnectionStrings__CemarisDatabase` konfiguriert. Cemaris setzt produktiv nicht voraus, dass die Datenbank im selben Compose-Projekt läuft.

## Roadmap

Es bestehen keine künstlichen Versions- oder Terminzusagen. Die geplanten Arbeitsphasen sind:

1. Repository- und Architekturgrundlage
2. lesender MVP mit synthetischen Daten
3. inkrementelle Implementierung der validierbaren Kernfunktionen
4. Identität, Berechtigungen, Audit, Datenschutz- und Betriebsfreigabe
5. fachliche Stammdaten, Fall-, Personen-, Beisetzungs- und Rechteprozesse;
   5a, der technische manuelle 5b-Durchstich, das dokumentarische 5c-Gate und
   die technischen Inkremente 5d und 5e sowie die dokumentarischen Gates 5f
   bis 5h sowie die technischen Schnitte 5i und 5j sind abgeschlossen; der
   Lebenszykluspfad bleibt pausiert und 5k stellt den dauerhaften lokalen
   SQL-Developmentbetrieb sowie den abgegrenzten nicht personenbezogenen
   EDWALT-Friedhofsstammdatenimport her
6. Gebühren-/Bescheid-Entscheidungsgate 6a; danach nur ein vollständig
   freigegebener kleiner Gebühren-, Dokument- oder Bescheidschnitt
7. optionale Winyard-Integration und priorisierte Auswertungen
8. Fortsetzung der EDWALT-Analyse, Zielmapping und Importprobeläufe
9. Pilotbetrieb, Cutover und Nachkontrolle

Die Schritte laufen dort parallel, wo keine ungeklärte Fachentscheidung
vorweggenommen wird. Der Abschluss eines Inkrements und sein konkreter Umfang
werden anhand dokumentierter Ergebnisse entschieden.

## Mitwirkung

Open-Source-Beiträge sind willkommen. Bitte zuerst [`CONTRIBUTING.md`](CONTRIBUTING.md) lesen. Fachliche Änderungen benötigen eine nachvollziehbare Anforderung; echte personenbezogene Daten und Secrets sind in Beiträgen, Issues, Tests und Screenshots verboten.

Sicherheitsprobleme bitte gemäß [`SECURITY.md`](SECURITY.md) vertraulich melden.

## Lizenz

Die endgültige Open-Source-Lizenz ist noch offen. EUPL-1.2 und AGPL-3.0 werden in [ADR-0008](docs/decisions/ADR-0008-open-source-license.md) verglichen. Bis zur Entscheidung gilt der Hinweis in [`LICENSE.md`](LICENSE.md).
