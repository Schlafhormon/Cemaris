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
| `Cemaris.Domain` | minimale persistenzunabhängige Fallakten-Entities, Faktenvalidierung und monotone Version | EF Core, HTTP, Winyard-Details |
| `Cemaris.Application` | Lese- und Schreibanwendungsfälle sowie Providerports | SQL-Server- oder Herstellerimplementierungen |
| `Cemaris.Infrastructure` | EF Core, SQL Server und spätere technische Adapter | UI und fachliche Entscheidungen |
| `Cemaris.Api` | Hosting, DI, HTTP-Endpunkte, Fehlerbehandlung, OpenAPI, Health Checks | Friedhofsfachlogik |
| `Cemaris.Web` | Responsive und barrierearme Browseroberfläche | Direkter Datenbank- oder DMS-Zugriff |

Das Domainprojekt enthält eine minimale Fallakten-Grundlage für gespeicherte
Tatsachen, ohne daraus
bereits Grabarten, Status, Fristen, Gebühren oder andere offene Fachregeln
abzuleiten. Umfang und Sicherheitsgrenze stehen in den
[Fallakten-Implementierungsentscheidungen](../requirements/case-record-write-decisions.md).

## Aktuelle technische Schnittstellen

Die technisch umgesetzte Friedhofs- und Grabstellenstruktur ist in
[Architektur der Friedhofs- und Grabstellenstammdaten](cemetery-master-data.md)
dokumentiert.
Der einfache atomare Beisetzungsprozess ist in der
[Architektur des Beisetzungsprozesses](burial-process.md) dokumentiert.
Der technisch umgesetzte manuelle Beteiligten-/Nutzungsrechtskern aus 5b ist
in der
[Personen- und Nutzungsrechtsarchitektur](person-usage-rights-deadlines.md)
beschrieben. Das
[5c-Entscheidungsgate](../implementation/cemaris-increment-5c-completion.md)
hat keine neue Facharchitektur freigegeben. Der
[5d-Abschluss](../implementation/cemaris-increment-5d-completion.md) verwendet
ausschließlich die vorhandenen Verträge für Bedienkorrekturen. Der
[5e-CSRF-Abschluss](../implementation/cemaris-increment-5e-completion.md)
stabilisiert rein clientseitig den Nachweiswechsel nach erfolgreicher
Anmeldung und ändert keinen Sicherheitsvertrag. Das
[5f-Gate](../implementation/cemaris-increment-5f-completion.md) hat Variante A
„keine Implementierung“ gewählt und keine Architekturänderung freigegeben.
Auch das
[5g-Gate](../implementation/cemaris-increment-5g-completion.md) endet mangels
zuständiger Fach- und Freigabequellen mit Variante A und ändert ADR-0016
nicht. Der Lebenszykluspfad bleibt pausiert. Das
[5h-Auswahlgate](../implementation/cemaris-increment-5h-completion.md) hat
außerhalb dieses Pfads eine additive, serverseitig paginierte
Beteiligtenübersicht ausgewählt. Das
[5i-Inkrement](../implementation/cemaris-increment-5i-completion.md) hat dafür
den vorhandenen Beteiligten-Lesevertrag ergänzt, ohne
Nutzungsrechts-, Rollen-, Persistenz- oder Auditsemantik zu ändern.
Das [5j-Inkrement](../implementation/cemaris-increment-5j-completion.md) hat
auch die kompatible Schnellsuche intern datensparsam projiziert, ohne API-,
UI-, Policy- oder Capability-Verträge zu ändern. Die Projektentscheidung vom
25.08.2026 führt mit ADR-0017 einen neuen priorisierten Architekturschnitt ein:
Die
[5k-Folgeübergabe](../implementation/cemaris-increment-5k-next-step-handoff.md)
macht `CEMARISDEV` zur dauerhaften lokalen Development-Datenbank, prüft alle
aktuellen Funktionen Ende zu Ende auf SQL und migriert ausschließlich
nicht personenbezogene EDWALT-Friedhofsstammdaten. Der kleinere
Abbruchparitätsbefund bleibt Teil der Providerprüfung.

- `GET /health` liefert einen nicht sensitiven technischen Lebensstatus.
- `GET /api/system/info` liefert Produktname, Projektphase, Versionsinformation und die explizite Aussage, dass das System nicht produktionsreif ist.
- `GET /api/search` und `GET /api/cases/{id}` bilden den technisch
  abgeschlossenen lesenden ersten Produktinkrement. Die Suche paginiert
  providerneutral und stabil über `page` und `pageSize`; ohne Parameter bleibt
  die bisherige erste Seite mit konfigurierter Größe erhalten.
- Bei expliziten, voneinander unabhängigen Development-Capabilities bilden
  Schreibendpunkte die Fallaktenbearbeitung, kanonische Stammdatenpflege und
  den einfachen Beisetzungsprozess sowie Beteiligte und Nutzungsrechte ab.
  Starke Fallversions- beziehungsweise
  Entitäts-ETags und `If-Match` verhindern Last-write-wins.
- Jede erfolgreiche Development-Mutation erhält serverseitig Akteur und
  UTC-Zeitpunkt; Fachänderung, Version, letzte Zuordnung und minimaler
  Auditdatensatz werden atomar gespeichert.
- `/openapi/v1.json` ist in der Entwicklungsumgebung aktiviert.
- `IDocumentManagementService` bildet eine minimale herstellerneutrale Erweiterungsstelle für die spätere Archivierung erzeugter Dokumente.
- `CemarisDbContext` enthält ein bewusst vorläufiges relationales Fall-/Leseschema
  für Fall, Grabstelle, Verstorbene, Beisetzungen, Nutzungsrechte,
  Berechtigte/Adressen und Bescheid-/Gebühreninformationen. Es ist kein
  freigegebenes endgültiges Fachmodell.

Der Schreibpfad bleibt trotz umgesetzter lokaler Identitätsgrundlage bis zu
den späteren Datenschutz-, Betriebs- und Fachfreigaben standardmäßig
deaktiviert und ausschließlich in einer explizit aktivierten
Development-Umgebung zulässig. Der 4a-Ist-Stand ist noch Synthetic-only;
ADR-0017 erlaubt 5k, diese technische Providergrenze für den dauerhaften
lokalen SQL-Betrieb kontrolliert aufzuheben. Personen- und Falldaten bleiben
synthetisch; ausschließlich die abgegrenzten Friedhofsstammdaten dürfen aus
EDWALT stammen.
Diese Feature-Grenze ist kein produktiver Zugriffsschutz.

Schreib- und Lesezugriff verwenden denselben kanonischen Zustand. Der
synthetische Provider hält ihn threadsicher pro Prozess; Neustarts verwerfen
Änderungen. Der SQL-Provider erhöht `ReadCases.Version` bedingt auf die
erwartete Version und ändert Root beziehungsweise Kind in derselben
Transaktion. Das vorläufige Schema wird dadurch nicht zum endgültigen
Fachmodell. Details dokumentiert
[ADR-0010](../decisions/ADR-0010-canonical-provisional-case-store.md).

## Konfiguration und Betrieb

Konfiguration wird über `appsettings.json`, umgebungsspezifische Dateien, Environment Variables und Kommandozeilenargumente geladen. Secrets gehören in einen sicheren betrieblichen Speicher und nie in das Repository.

TLS soll am kontrollierten Reverse Proxy terminiert werden. Lokale
Benutzerkonten sind als erste produktive Identitätsgrundlage bestätigt; ein
späterer LDAP-Kontoimport oder eine Synchronisation bleibt über Adapter
erweiterbar. Fachfunktionen einschließlich künftiger Stammdatenpflege sind für
`Sachbearbeitung` und `Administration` vorgesehen. Benutzerverwaltung,
administrative Programmkonfiguration und Formularvorlagen sind ausschließlich
`Administration` vorbehalten. OpenID Connect ist derzeit nicht bestätigt.

## Audit und Datenschutz

Für die vorhandenen Fachmutationen ist ein datensparsamer Mindestnachweis
umgesetzt. Audit-Einsicht, Export, Aufbewahrung, zulässige Löschung und
Integritätskontrolle bleiben offen. Weiterhin gelten diese Leitplanken:

- keine unnötigen Personen- oder Inhaltsdaten in Logs,
- strukturierte technische Logs mit Trace-ID,
- zentral behandelte, standardisierte Fehlerantworten ohne interne Details,
- minimale Berechtigungen für Datenbank- und Integrationskonten,
- keine echten personenbezogenen Verwaltungsdaten in Entwicklung und Tests;
  die lokale Ausnahme aus ADR-0017 umfasst nur abgegrenzte
  Friedhofsstammdaten in `CEMARISDEV`, niemals allgemeine Testfixtures oder CI,
- Audit-Einträge machen Akteur, Zeitpunkt, Operation, Fall/Ziel und
  resultierende Version nachvollziehbar, ohne unkontrollierte Datenkopien zu
  erzeugen.

## Noch zu entscheiden

- fachliches Datenmodell und Modulgrenzen,
- technische Betriebsparameter lokaler Konten und späteres LDAP-Importmodell,
- Audit- und Aufbewahrungskonzept,
- Dokument- und PDF-Engine,
- Winyard-Schnittstelle und Adaptervertrag,
- Betriebsvarianten für IIS, Linux/Reverse Proxy und Container,
- Anforderungen an Hochverfügbarkeit, Backup, Monitoring und Wiederanlauf.
