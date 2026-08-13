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
technisch umgesetzt. Die sichere
[Folgeübergabe für Inkrement 5](docs/implementation/cemaris-increment-5-next-step-handoff.md)
beginnt wegen offener Rollen-, Rechte- und Fristregeln mit einem fachlichen
Klärungsgate.
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

Die Schreibfunktion ist standardmäßig aus. Für eine lokale, ausschließlich
synthetische Development-Sitzung muss sie ausdrücklich aktiviert werden:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Features__CaseEditingEnabled = "true"
$env:Features__CemeteryMasterDataEditingEnabled = "true"
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
  und vollständig unbenutzte Datensätze.

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

### Lokales SQL-Server-Fall-/Leseschema

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

### Ersten lokalen Administrator bereitstellen

Der Bootstrap ist ein expliziter Wartungsbefehl und kein HTTP-Endpunkt. Er
läuft nur gegen den SQL-Provider, nur bei vollständig migriertem Schema, nur
bei exakt übereinstimmendem erwarteten Datenbanknamen und nur solange noch kein
Konto existiert. Es existiert kein Defaultpasswort; Benutzername, Anzeigename
und Passwort werden nicht protokolliert.

Für Development werden die Werte in User Secrets abgelegt:

```powershell
dotnet user-secrets set --project src/Cemaris.Api "Bootstrap:Username" "lokaler-admin"
dotnet user-secrets set --project src/Cemaris.Api "Bootstrap:DisplayName" "Lokale Administration"
dotnet user-secrets set --project src/Cemaris.Api "Bootstrap:Password" "<extern erzeugtes starkes Passwort>"

$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project src/Cemaris.Api -- --ReadModel:Provider=SqlServer --Maintenance:BootstrapAdministrator=true --Maintenance:ExpectedDatabase=Cemaris_Dev
```

Im Betrieb müssen diese Werte aus einem externen Secret Store kommen und nach
dem einmaligen Lauf wieder entzogen werden. Die Kommandozeile darf kein Secret
enthalten. Vor produktiver Nutzung sind außerdem TLS/Reverse Proxy,
Data-Protection-Schlüsselring, Backup, Monitoring und Logaufbewahrung
verbindlich zu konfigurieren und abzunehmen.

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
$env:CEMARIS_SQL_TEST_CONNECTION_STRING = "Server=localhost\CEMARISDEV;Database=master;Integrated Security=True;Encrypt=True;TrustServerCertificate=True"
dotnet test tests/Cemaris.IntegrationTests --filter "Category=SqlServer"
Remove-Item Env:CEMARIS_SQL_TEST_CONNECTION_STRING
```

Der verwendete Login muss Datenbanken anlegen und loeschen duerfen. Die neun
SQL-Tests erzeugen ausschließlich eine eindeutig benannte temporäre Datenbank
`Cemaris_IntegrationTests_*`, prüfen additive Migration, Seed, Suche,
Detailansicht, Schreib-/Auditatomarität, Parallelität und Rollback und entfernen
die Datenbank anschließend wieder. Vor dem Löschen werden Präfix und
aufgelöster Datenbankname erneut geprüft. Ohne die Umgebungsvariable werden
diese Tests übersprungen.

## Konfiguration

ASP.NET Core liest `appsettings.json`, `appsettings.{Environment}.json`, Environment Variables und Kommandozeilenargumente. Doppelte Unterstriche bilden verschachtelte Schlüssel ab.

| Einstellung | Zweck | Beispiel |
| --- | --- | --- |
| `ConnectionStrings__CemarisDatabase` | externer SQL-Server-Connection-String | `Server=localhost,1433;Database=Cemaris;User Id=cemaris;Password=CHANGE_ME;Encrypt=True;TrustServerCertificate=True` |
| `Cors__AllowedOrigins__0` | erlaubter Entwicklungs-Frontend-Origin | `http://localhost:5173` |
| `OpenApi__Enabled` | OpenAPI-Dokument aktivieren | `true` nur in kontrollierten Umgebungen |
| `ReadModel__Provider` | kanonischer Fall-/Lesestore (`Synthetic` oder `SqlServer`) | `Synthetic` fuer normale Entwicklung und Tests |
| `Features__CaseEditingEnabled` | synthetische Fallaktenbearbeitung; nur in `Development` zulässig | `false` (Standard), lokal ausdrücklich `true` |
| `Features__CemeteryMasterDataEditingEnabled` | synthetische Friedhofsstammdatenpflege; nur in `Development` mit `Synthetic` zulässig | `false` (Standard), lokal ausdrücklich `true` |
| `Identity__Security__PasswordMinimumLength` | untere Passwortgrenze, nicht unter 12 konfigurierbar | `12` |
| `Identity__Security__PasswordMaximumLength` | obere Passwortgrenze, nicht über 128 konfigurierbar | `128` |
| `Identity__Security__MaximumFailedLoginAttempts` | Fehlversuche bis zur Sperre, höchstens 5 | `5` |
| `Identity__Security__LockoutDuration` | Sperrdauer, mindestens 15 Minuten | `00:15:00` |
| `Identity__Security__SessionIdleTimeout` | Inaktivitätsdauer der Cookie-Sitzung | `00:30:00` |
| `Search__MaxResults` | maximales Suchergebnis ohne Paginierung | `10` |
| `Maintenance__SeedSynthetic` | einmaliger expliziter SQL-Seed statt API-Start | `true` nur fuer kontrollierte lokale Entwicklung |
| `Maintenance__ExpectedDatabase` | Sicherheitspruefung fuer den SQL-Seed | `Cemaris_Dev` |
| `Maintenance__BootstrapAdministrator` | einmaliger nicht HTTP-basierter Erstadmin-Bootstrap | `false` |
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
5. fachliche Stammdaten, Fall-, Personen-, Beisetzungs- und Rechteprozesse
6. Gebühren-, Dokument- und Bescheidwesen
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
