# Technische Zielarchitektur

Aktualisierung 07.09.2026: Die
[Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
erlaubt lokale synthetische Tests ohne die früheren pauschalen Betriebs- und
Freigabehürden. Der nächste
[6c-Praxistest](../implementation/cemaris-notice-generation-prototype-trial-next-step-handoff.md)
nutzt die vorhandene Architektur; ADR-0019 und die technischen Schutzgrenzen
bleiben bestehen. Frühere Stop-Aussagen gelten für ihren historischen Auftrag.

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
25.08.2026 führt mit ADR-0017 einen neuen priorisierten Architekturschnitt ein.
Inkrement 5k hebt die frühere Synthetic-only-Grenze der vier
Development-Capabilities auf: Sämtliche vorhandenen Storeports besitzen nun
denselben SQL-Pfad. Der portable Repository-Default bleibt Synthetic;
maschinenlokal ist `Cemaris_Dev` der dauerhafte Development-Standard. Das
[5k-Quellmapping](../migration/edwalt-cemetery-master-data-mapping.md) begrenzt
den EDWALT-Pfad zusätzlich auf nicht personenbezogene Friedhofsstammdaten; der
[5k-Abschluss](../implementation/cemaris-increment-5k-completion.md) weist den
lokalen Ende-zu-Ende-Betrieb nach.
Das Gebühren-/Bescheid-/Dokument-
[Entscheidungsgate 6a](../implementation/cemaris-increment-6a-completion.md)
ist mit Variante A „noch keine Implementierung“ abgeschlossen. Es entstand
keine neue Architekturentscheidung und daher kein neues ADR. Die vorhandenen
nullable Bescheid-/Gebührenfelder und Suchpfade bleiben eine vorläufige
Leseprojektion; sie genehmigen weder ein kanonisches Schreibmodell noch
Katalog-, Berechnungs-, Historien-, Dokument- oder Migrationssemantik. Die
offenen Grenzen stehen in der
[6a-Entscheidungsakte](../requirements/fee-notice-document-decisions.md).
Das nachgelagerte
[Freigabegate für manuelle Bescheid-/Finanzfakten](../implementation/cemaris-manual-notice-facts-approval-completion.md)
ist nach ergänzender funktionsbezogener Klärung mit Variante B abgeschlossen.
Der [technische 6b-Auftrag](../implementation/cemaris-increment-6b-next-step-handoff.md)
ist gemäß [6b-Abschluss](../implementation/cemaris-increment-6b-completion.md)
als getrennter kanonischer Kern für rechtlich wirkungslose manuelle Entwürfe
umgesetzt. Zahlungspflichtige werden ausdrücklich bestätigt und nie aus dem
Nutzungsrecht abgeleitet. Aggregat, Nummernkonfiguration, Revision, ETag,
Atomarität, sparsamer Audit und additive Providerparität stehen in
[ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md).
`ReadNotices` und `ReadFeeItems` bleiben davon getrennte Altprojektion.
Der genau auf Beisetzungsgebühren begrenzte 6c-Dokumentpfad ist gemäß
[6c-Abschluss](../implementation/cemaris-increment-6c-completion.md) technisch
umgesetzt. Seine flüchtige sichere OpenXML-/LibreOffice-Architektur steht in
[ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md).

- `GET /health` liefert einen nicht sensitiven technischen Lebensstatus.
- `GET /api/system/info` liefert Produktname, Projektphase, Versionsinformation und die explizite Aussage, dass das System nicht produktionsreif ist.
- `GET /api/search` und `GET /api/cases/{id}` bilden den technisch
  abgeschlossenen lesenden ersten Produktinkrement. Die Suche paginiert
  providerneutral und stabil über `page` und `pageSize`; ohne Parameter bleibt
  die bisherige erste Seite mit konfigurierter Größe erhalten.
- Bei expliziten, voneinander unabhängigen Development-Capabilities bilden
  Schreibendpunkte die Fallaktenbearbeitung, kanonische Stammdatenpflege,
  den einfachen Beisetzungsprozess, Beteiligte und Nutzungsrechte sowie
  kanonische manuelle Bescheidentwürfe und deren begrenzte flüchtige
  DOCX-/PDF-Erzeugung ab.
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
den späteren Datenschutz-, Betriebs- und Fachfreigaben repositoryseitig
standardmäßig deaktiviert und ausschließlich in einer explizit aktivierten
Development-Umgebung zulässig. Synthetic und SQL implementieren dieselben
aktuellen Ports für Fälle, Stammdaten, Beisetzungsprozess, Beteiligte,
Nutzungsrechte, manuelle Bescheidentwürfe, Satzungsversionen und den
kanonischen Erzeugungsquellen-/Auditvertrag. Personen- und Falldaten bleiben in beiden Providern
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

Konfiguration wird über `appsettings.json`, umgebungsspezifische Dateien,
Environment Variables und Kommandozeilenargumente geladen. Secrets gehören in
einen sicheren betrieblichen Speicher und nie in das Repository. Normale
Starts mutieren weder Schema noch Daten. Einmalige Development-Wartungspfade
für EF-Migrationen, additive synthetische Fixtures und die beiden festen
lokalen Konten prüfen nach Verbindungsöffnung den exakt autorisierten
Datenbanknamen und beenden sich anschließend. Automatisierte SQL-Tests dürfen
nur isolierte Datenbanken mit dem Präfix `Cemaris_IntegrationTests_`
erstellen und entfernen.

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
  Friedhofsstammdaten in `Cemaris_Dev`, niemals allgemeine Testfixtures oder CI,
- Audit-Einträge machen Akteur, Zeitpunkt, Operation, Fall/Ziel und
  resultierende Version nachvollziehbar, ohne unkontrollierte Datenkopien zu
  erzeugen.

## Noch zu entscheiden

- fachliches Datenmodell und Modulgrenzen,
- technische Betriebsparameter lokaler Konten und späteres LDAP-Importmodell,
- Audit- und Aufbewahrungskonzept,
- Dokument- und PDF-Engine weiterer Dokumentarten sowie produktive
  LibreOffice-/Schrift-/Ressourcenparameter,
- Winyard-Schnittstelle und Adaptervertrag,
- Betriebsvarianten für IIS, Linux/Reverse Proxy und Container,
- Anforderungen an Hochverfügbarkeit, Backup, Monitoring und Wiederanlauf.

Die [6F-Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md)
grenzt die funktionsbezogene Development-Freigabe des Entwurfskerns von
weiterhin offenen Architektur-, Rechts-, Sicherheits-, Datenschutz- und
Betriebsfragen der späteren Bescheiderzeugung und Produktivsetzung ab.

## Kanonischer manueller Bescheidentwurf 6b

Der [6b-Abschluss](../implementation/cemaris-increment-6b-completion.md)
realisiert ADR-0018 als eigenes Modul neben `ReadNotices` und `ReadFeeItems`.
Eine installationweite versionierte Konfiguration und eine serialisierte
Jahressequenz liefern unveränderliche Nummernsnapshots. Entwurf, vollständige
Fachrevision und sparsamer Audit werden atomar geschrieben; Auditwerte sind
nicht öffentlich lesbar. Korrektur und Verwerfen verwenden starke ETags.
`Features:NoticeDraftEditingEnabled` bleibt standardmäßig aus und ist nur in
Development zulässig. Daraus folgt keine Dokument-, Rechts-, Finanz- oder
Produktivwirkung. Das nachgelagerte
[rein dokumentarische Folgegate](../implementation/cemaris-notice-generation-decision-gate-completion.md)
ist nach ergänzender Quellenklärung mit Variante B abgeschlossen.

## Technischer Bescheiderzeugungsschnitt 6c

Das
[6c-Gate](../implementation/cemaris-notice-generation-decision-gate-completion.md)
ist nach ergänzender Quellenklärung mit Variante B abgeschlossen. Die
[Entscheidungsakte](../requirements/notice-generation-decisions.md) bestätigt
als Produktziel einen rechtlich wirkungslosen Gebührenbescheidentwurf für
Beisetzungsgebühren, der aus einer kommunal verantworteten Servervorlage als
DOCX, PDF oder Ausdruck ausgegeben wird. Cemaris speichert das Dokument nicht,
nimmt keine externe Bearbeitung zurück und integriert weder Winyard/DMS noch
FINANZ+ oder Versand/Zustellung.

Eine repräsentative synthetische Testquelle, der feldgenaue Datenvertrag,
Benutzerkontakt- und Satzungsstammdaten sowie Qualitäts-, ETag-, Audit- und
Temp-Grenzen sind bestätigt. Die separate
[technische 6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md)
ist gemäß [Abschluss](../implementation/cemaris-increment-6c-completion.md)
umgesetzt. Die Capability bleibt standardmäßig aus und Development-only. Das
Ergebnis wird ausschließlich nach erfolgreichem inhaltsfreiem Audit gestreamt
und nie gespeichert. OpenXML-Paketprüfung und gekapselte
LibreOffice-Konvertierung sind in ADR-0019 festgehalten.

Die Umsetzung ändert den 6b-Vertrag und ADR-0018 nicht und erteilt keine
Produktiv- oder Betriebsfreigabe. Das
[Betriebs- und Pilotfreigabegate](../implementation/cemaris-notice-generation-pilot-release-gate-completion.md)
ist mit Variante A „Stop“ abgeschlossen. Die gewünschte Nutzung des
Development-Repositorys mit `Cemaris_Dev` ist als eigens geschaffene
kombinierte Development- und Testpilotumgebung klargestellt. Sie ist kein
Datenbankwiderspruch mehr. Die
[technische Pilot-Readiness und Neubewertung](../implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
hat das vollständige 6b-/6c-Schema read-only bestätigt und reale synthetische
LibreOffice-/Druck-zu-Datei-, Schrift-, Temp- und Prozessnachweise erbracht.
Die Architektur wurde nur innerhalb ihres bestehenden Vertrags korrigiert:
Ein Temp-Anlagefehler gibt den PDF-Parallelitätsslot nun sicher frei, und das
OpenXML-Ergebnis trägt genau eine sichtbare Kennzeichnung als rechtlich
wirkungsloser Entwurf. ADR-0019 bleibt unverändert; ein neues ADR war nicht
erforderlich. Die getrennte
[Betriebsremediation und erneute Pilotneubewertung](../implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
hat den ausdrücklich autorisierten Backup-/Restore-Nachweis technisch
geschlossen. Monitoring, gehärtete Installationsgrenzen, Auditbetriebsregeln
und zuständige Freigaben waren offen oder teilweise bestätigt. Deshalb blieb
es damals bei Variante A und ausgeschalteter Capability. Die Ausführung führte
keine neue Architektur, systemweite Härtungsänderung oder Aktivierung ein.
