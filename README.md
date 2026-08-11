# Cemaris

> Open-Source-Friedhofsverwaltung für Kommunen

## Status

> **Cemaris befindet sich derzeit in einer frühen Konzeptions- und Anforderungsanalyse. Es handelt sich noch nicht um produktionsreife Friedhofsverwaltungssoftware.**

Funktionen und Datenmodell sind noch nicht für den Produktivbetrieb freigegeben. Das Repository stellt derzeit ausschließlich eine technische und dokumentarische Grundlage für die bevorstehende Bestands- und Bedarfsanalyse bereit.

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
- ein bewusst schmales EF-Core-Leseschema mit synthetischem Standardprovider und optionaler SQL-Server-Anbindung,
- eine minimale herstellerneutrale DMS-Erweiterungsstelle,
- Unit- und Integrationstests,
- Docker- und CI-Konfiguration,
- ADRs sowie Arbeitsunterlagen für EDWALT-Inventur, Anforderungen und Migration.

Der nächste fachliche Schritt ist die Bestandsaufnahme des bestehenden Verfahrens und aller Nebenprozesse anhand von [`docs/requirements`](docs/requirements/README.md).

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
│   ├── migration/            # EDWALT-Migrationsstrategie
│   └── requirements/         # Bedarfsanalyse und EDWALT-Inventur
├── src/
│   ├── Cemaris.Api/          # ASP.NET-Core-Host und HTTP-Endpunkte
│   ├── Cemaris.Application/  # Anwendungsgrenzen und externe Ports
│   ├── Cemaris.Domain/       # bewusst noch leere fachliche Kernschicht
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
- optional ein SQL Server; die vorhandenen neutralen Endpunkte greifen noch nicht auf ein Fachschema zu.

### Backend starten

Im Repository-Stamm:

```powershell
dotnet restore Cemaris.sln
dotnet tool restore
dotnet run --project src/Cemaris.Api --launch-profile http
```

Danach sind verfügbar:

- Health Check: <http://localhost:5050/health>
- Systeminfo: <http://localhost:5050/api/system/info>
- Lesende Suche: <http://localhost:5050/api/search>
- Lesende Falldetails: `http://localhost:5050/api/cases/{id}`
- OpenAPI (nur Development): <http://localhost:5050/openapi/v1.json>

### Frontend starten

In einem zweiten Terminal:

```powershell
cd src/Cemaris.Web
npm ci
npm run dev
```

Das Frontend läuft unter <http://localhost:5173>. Vite leitet `/health` und `/api` in der Entwicklung standardmäßig an `http://localhost:5050` weiter. Die Statuskarte zeigt die erfolgreiche Verbindung.

### Lokales SQL-Server-Leseschema

Die normale Entwicklung und alle allgemeinen Tests verwenden weiterhin den
synthetischen Provider. Fuer einen lokalen SQL-Server-Test werden
maschinenbezogene Einstellungen in User Secrets und nicht im Repository
gespeichert:

```powershell
dotnet user-secrets set --project src/Cemaris.Api "ConnectionStrings:CemarisDatabase" "Server=localhost\CEMARISDEV;Database=Cemaris_Dev;Integrated Security=True;Encrypt=True;TrustServerCertificate=True"
dotnet user-secrets set --project src/Cemaris.Api "ReadModel:Provider" "SqlServer"

$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet tool restore
dotnet tool run dotnet-ef database update --project src/Cemaris.Infrastructure --startup-project src/Cemaris.Api --context CemarisDbContext
```

Anschliessend koennen die klar gekennzeichneten synthetischen Demonstrationsdaten
explizit in die lokale Datenbank geschrieben werden:

```powershell
dotnet run --project src/Cemaris.Api --launch-profile http -- --Maintenance:SeedSynthetic=true --Maintenance:ExpectedDatabase=Cemaris_Dev
```

Der Wartungsbefehl ist nur in der `Development`-Umgebung erlaubt, prueft den
erwarteten Datenbanknamen sowie ausstehende Migrationen und verweigert den Lauf,
sobald ein nicht synthetischer Fall vorhanden ist. Vorhandene synthetische
Faelle werden reproduzierbar ersetzt. Beim normalen API-Start werden keine
Daten angelegt oder veraendert.

Die Migrationen liegen unter
`src/Cemaris.Infrastructure/Persistence/Migrations`. Produktive
Schemadeployments erfolgen spaeter kontrolliert ueber ein geprueftes SQL-Skript
und nicht beim Anwendungsstart.

### Qualität prüfen

```powershell
dotnet build Cemaris.sln --configuration Release
dotnet test Cemaris.sln --configuration Release --no-build
dotnet format Cemaris.sln --verify-no-changes --no-restore

cd src/Cemaris.Web
npm run lint
npm run build
```

## Konfiguration

ASP.NET Core liest `appsettings.json`, `appsettings.{Environment}.json`, Environment Variables und Kommandozeilenargumente. Doppelte Unterstriche bilden verschachtelte Schlüssel ab.

| Einstellung | Zweck | Beispiel |
| --- | --- | --- |
| `ConnectionStrings__CemarisDatabase` | externer SQL-Server-Connection-String | `Server=localhost,1433;Database=Cemaris;User Id=cemaris;Password=CHANGE_ME;Encrypt=True;TrustServerCertificate=True` |
| `Cors__AllowedOrigins__0` | erlaubter Entwicklungs-Frontend-Origin | `http://localhost:5173` |
| `OpenApi__Enabled` | OpenAPI-Dokument aktivieren | `true` nur in kontrollierten Umgebungen |
| `ReadModel__Provider` | Quelle des Lesemodells (`Synthetic` oder `SqlServer`) | `Synthetic` fuer normale Entwicklung und Tests |
| `Search__MaxResults` | maximales Suchergebnis ohne Paginierung | `10` |
| `Maintenance__SeedSynthetic` | einmaliger expliziter SQL-Seed statt API-Start | `true` nur fuer kontrollierte lokale Entwicklung |
| `Maintenance__ExpectedDatabase` | Sicherheitspruefung fuer den SQL-Seed | `Cemaris_Dev` |
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
2. EDWALT-Bestandsanalyse und technische Migrationsvorbereitung
3. Fachliche Bedarfsanalyse
4. Fachliches Datenmodell
5. MVP-Definition
6. Implementierung der validierten Kernfunktionen
7. Winyard-Integration
8. Dokument- und Bescheidwesen
9. Datenmigration
10. Pilotbetrieb

Der Abschluss einer Phase und ihr konkreter Umfang werden anhand dokumentierter Ergebnisse entschieden.

## Mitwirkung

Open-Source-Beiträge sind willkommen. Bitte zuerst [`CONTRIBUTING.md`](CONTRIBUTING.md) lesen. Fachliche Änderungen benötigen eine nachvollziehbare Anforderung; echte personenbezogene Daten und Secrets sind in Beiträgen, Issues, Tests und Screenshots verboten.

Sicherheitsprobleme bitte gemäß [`SECURITY.md`](SECURITY.md) vertraulich melden.

## Lizenz

Die endgültige Open-Source-Lizenz ist noch offen. EUPL-1.2 und AGPL-3.0 werden in [ADR-0008](docs/decisions/ADR-0008-open-source-license.md) verglichen. Bis zur Entscheidung gilt der Hinweis in [`LICENSE.md`](LICENSE.md).
