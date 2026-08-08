# Technische Zielarchitektur

> **Status:** Technische Grundlage. Die genannten Produktbereiche sind eine zu validierende Produktvision und noch keine verbindlichen Fachanforderungen.

Cemaris wird zunächst als browserbasierter modularer Monolith für den On-Premises-Betrieb aufgebaut. Die Architektur hält Fachlogik, Anwendungsfälle, technische Adapter und HTTP/UI voneinander getrennt, ohne die Betriebs- und Entwicklungsaufwände einer Microservice-Landschaft vorwegzunehmen.

```text
Browser
  │
  ▼
Reverse Proxy / TLS
  ├──────────────► React-/TypeScript-Frontend
  │                         │
  │                         ▼ REST / OpenAPI
  └────────────────► ASP.NET-Core-API
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
      Microsoft SQL Server          Adapter externer Systeme
                                      DMS, Identität, Mail
```

## Projektgrenzen

| Projekt | Verantwortung | Darf nicht enthalten |
| --- | --- | --- |
| `Cemaris.Domain` | Spätere fachliche Entities, Value Objects und Regeln | EF Core, HTTP, Winyard-Details |
| `Cemaris.Application` | Spätere Anwendungsfälle und Ports zu externen Systemen | SQL-Server- oder Herstellerimplementierungen |
| `Cemaris.Infrastructure` | EF Core, SQL Server und spätere technische Adapter | UI und fachliche Entscheidungen |
| `Cemaris.Api` | Hosting, DI, HTTP-Endpunkte, Fehlerbehandlung, OpenAPI, Health Checks | Friedhofsfachlogik |
| `Cemaris.Web` | Responsive und barrierearme Browseroberfläche | Direkter Datenbank- oder DMS-Zugriff |

Das Domainprojekt ist absichtlich fast leer. Erst die Bestands- und Bedarfsanalyse darf belastbare Fachbegriffe und Regeln liefern.

## Aktuelle technische Schnittstellen

- `GET /health` liefert einen nicht sensitiven technischen Lebensstatus.
- `GET /api/system/info` liefert Produktname, Projektphase, Versionsinformation und die explizite Aussage, dass das System nicht produktionsreif ist.
- `/openapi/v1.json` ist in der Entwicklungsumgebung aktiviert.
- `IDocumentManagementService` bildet eine minimale herstellerneutrale Erweiterungsstelle für die spätere Archivierung erzeugter Dokumente.
- `CemarisDbContext` bereitet EF Core und SQL Server vor, enthält aber bewusst noch keine fachlichen Tabellen.

## Konfiguration und Betrieb

Konfiguration wird über `appsettings.json`, umgebungsspezifische Dateien, Environment Variables und Kommandozeilenargumente geladen. Secrets gehören in einen sicheren betrieblichen Speicher und nie in das Repository.

TLS soll am kontrollierten Reverse Proxy terminiert werden. Authentifizierung und Autorisierung werden später am API-Rand ergänzt. Die konkrete Auswahl zwischen lokalen Konten, AD/LDAP und OpenID Connect ist offen. Gleiches gilt für Rollen und Berechtigungen.

## Audit und Datenschutz

Ein fachliches Audit Log wird erst zusammen mit dem Fach- und Berechtigungsmodell entworfen. Bereits jetzt gelten diese Leitplanken:

- keine unnötigen Personen- oder Inhaltsdaten in Logs,
- strukturierte technische Logs mit Trace-ID,
- zentral behandelte, standardisierte Fehlerantworten ohne interne Details,
- minimale Berechtigungen für Datenbank- und Integrationskonten,
- keine echten Verwaltungsdaten in Entwicklung und Tests,
- spätere Audit-Einträge müssen handelnde Identität, Zeitpunkt, Vorgang und Änderung nachvollziehbar machen, ohne unkontrollierte Datenkopien zu erzeugen.

## Noch zu entscheiden

- fachliches Datenmodell und Modulgrenzen,
- Authentifizierungsverfahren und konkrete Rollen,
- Audit- und Aufbewahrungskonzept,
- Dokument- und PDF-Engine,
- Winyard-Schnittstelle und Adaptervertrag,
- Betriebsvarianten für IIS, Linux/Reverse Proxy und Container,
- Anforderungen an Hochverfügbarkeit, Backup, Monitoring und Wiederanlauf.
