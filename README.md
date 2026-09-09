# Cemaris

Stand 09.09.2026: **M3a ist implementiert und isoliert nachgewiesen** – manuelle
Gebührenpositionen, exakte verbindliche Gesamtsumme und vollständige DOCX-/PDF-Ausgabe.
[Produktvertrag](docs/requirements/manual-notice-line-items-decisions.md),
[ADR-0022](docs/decisions/ADR-0022-manual-notice-line-items.md) und
[Abschluss mit Prüfungen und Grenzen](docs/implementation/cemaris-manual-notice-line-items-completion.md)
beschreiben Bestand, Umstellung, Historie und Konfliktschutz. Die neue Capability
bleibt aus. Katalog, Tarife, Rechtswirkung und FINANZ+ sind nicht Bestandteil.

Aktuell (08.09.2026): Cemaris wird als lokaler Prototyp mit synthetischen
Daten entwickelt und erprobt. Die
[Projektentscheidung](docs/requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
hebt die pauschalen Freigabehürden für diesen Umfang auf. Der
[6c-Praxistest bis zum DOCX-/PDF-Download](docs/implementation/cemaris-notice-generation-prototype-trial-completion.md)
ist einschließlich isoliertem Playwright-Browserdurchlauf, echtem
LibreOffice-PDF und korrigierten Formular-/Ladefehlermeldungen abgeschlossen.
Die Anmeldung mit einem persistenten lokalen Konto bleibt unbestätigt.
Die [Beisetzungsauswahl mit Personenname und Grabbezug](docs/implementation/cemaris-notice-generation-burial-selection-completion.md)
ist ebenfalls umgesetzt und mit zwei synthetischen Beisetzungen bis DOCX und
echtem LibreOffice-PDF im isolierten Browser geprüft.
Der [Arbeitsplan zur ersten alltagstauglichen Version](docs/implementation/cemaris-first-operational-version-roadmap.md)
ordnet den weiteren Ausbau. Die
[manuellen fallbezogenen Wiedervorlagen](docs/implementation/cemaris-manual-case-follow-ups-completion.md)
sind mit gemeinsamem Arbeitsvorrat, Historie, Konfliktschutz und den Zuständen
offen, erledigt und abgebrochen implementiert. Der isolierte Browserlauf mit
zwei Cookie-Sitzungen ist bestanden. Der anschließend ausdrücklich beauftragte
[SQL-Nachweis](docs/implementation/cemaris-manual-case-follow-ups-sql-verification.md)
bestätigt Migration, Konfliktschutz, Rollback und Persistenz nach Anwendungshostwechsel
auf entbehrlichen Testdatenbanken; zwei dabei entdeckte EF-Fehler sind behoben. Die neue Capability
bleibt standardmäßig deaktiviert. Auch der 6c-Einleitungstext ist korrigiert.
Der [manuelle Nutzungsrechtslebenszyklus M2a](docs/implementation/cemaris-manual-usage-right-termination-completion.md)
ist durch alle Schichten umgesetzt: Beendigung heute oder rückwirkend,
Rücknahme, manuelle Neuvergabe und atomare Korrektur bestehender Rechtefolgen.
Irrtümliche Nachfolger und ihre Revisionen bleiben im paginierten Rechteverlauf
auswählbar. Der Abschluss dokumentiert die neuen SQL-, Browser- und
Regressionsnachweise. `Features:UsageRightLifecycleEnabled` bleibt deaktiviert;
Fristautomatik und automatische Grabstellenwirkung gehören nicht zu M2a.
Die folgenden Gateabschlüsse beschreiben frühere Bewertungen; deren
allgemeine Stop-Regel blockiert diesen Prototypauftrag nicht.

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
- eine standardmäßig deaktivierte flüchtige DOCX-/PDF-Erzeugung genau eines
  rechtlich wirkungslosen Gebührenbescheidentwurfs für Beisetzungsgebühren,
  einschließlich Benutzerkontakten, Satzungsversionen und inhaltsfreiem Audit,
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
Fristberechnung, Statuswirkung und automatische Wiedervorlagen bleiben offen;
der neue manuelle M1-Kern ist separat umgesetzt. Das
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
dauerhafte lokale Development-Datenbank. Alle bis 5k vorhandenen Funktionen
sind auf SQL nachgewiesen, `admin` und `sach` dauerhaft eingerichtet und
ausschließlich nicht personenbezogene EDWALT-Friedhofsstammdaten migriert.
Der 6b-EF-Provider und seine SQL-Suite sind implementiert; die SQL-Kategorie
wurde mangels separater autorisierter Testverbindung nicht ausgeführt.
Das ausschließlich dokumentarische
[Inkrement 6a](docs/implementation/cemaris-increment-6a-completion.md) ist mit
Variante A „noch keine Implementierung“ abgeschlossen. Die
[Gebühren-/Bescheid-/Dokumententscheidungen](docs/requirements/fee-notice-document-decisions.md)
weisen die vorhandene nullable Leseprojektion ausdrücklich nicht als
Schreibmodell aus und bündeln die fehlenden Fach-, Rechts-, Rollen-,
Historien-, Dokument- und Migrationsfreigaben. Deshalb hatte 6a selbst noch
keinen technischen 6b-Auftrag erstellt; Gebührenkatalog, Berechnung,
Bescheiderzeugung, Dokumentverarbeitung und weiterer EDWALT-Import bleiben
pausiert.
Das nachgelagerte interaktive
[Freigabegate für manuelle Bescheid-/Finanzfakten](docs/implementation/cemaris-manual-notice-facts-approval-completion.md)
ist nach ergänzender funktionsbezogener Klärung vollständig mit Variante B
abgeschlossen. Die
[6F-Entscheidungsakte](docs/requirements/manual-notice-financial-facts-decisions.md)
dokumentiert genau einen rechtlich wirkungslosen manuellen Entwurfskern:
mehrere Entwürfe je Fall, je eine eigene Nummer, genau ein ausdrücklich
bestätigter Zahlungspflichtiger und keine stille Ableitung aus dem
Nutzungsrecht. Der [technische 6b-Auftrag](docs/implementation/cemaris-increment-6b-next-step-handoff.md)
ist gemäß [Abschlussnachweis](docs/implementation/cemaris-increment-6b-completion.md)
Ende zu Ende umgesetzt: Domain/Application, Synthetic- und EF-Provider,
additive Migration, Capability, Policies, ETags, Revision/Audit, API/OpenAPI
und React-UI bleiben ausschließlich Development und synthetischen Daten
vorbehalten. `ReadNotices` und `ReadFeeItems` sind weiterhin getrennte
Altprojektionen. Das nachgelagerte
[6c-Bescheiderzeugungsgate](docs/implementation/cemaris-notice-generation-decision-gate-completion.md)
ist nach ergänzender Quellenklärung dokumentarisch mit Variante B
abgeschlossen. Genau ein Kandidat – ein rechtlich wirkungsloser
Gebührenbescheidentwurf für Beisetzungsgebühren – ist in der
[6c-Entscheidungsakte](docs/requirements/notice-generation-decisions.md)
feldgenau und funktionsbezogen bestätigt. Eine synthetische Testquelle,
Benutzerkontakt- und Satzungsstammdaten, Qualitäts-, ETag-, Audit- und
Temp-Grenzen sind entschieden. Die
[technische 6c-Übergabe](docs/implementation/cemaris-increment-6c-next-step-handoff.md)
ist gemäß [6c-Abschluss](docs/implementation/cemaris-increment-6c-completion.md)
Ende zu Ende umgesetzt: OpenXML-DOCX, gekapselte LibreOffice-PDF-Konvertierung,
Temp-Bereinigung, Capability, Policies, Synthetic-/EF-Provider, API/OpenAPI
und React-UI bleiben standardmäßig deaktiviert und Development-only. Das
[Betriebs- und Pilotfreigabegate](docs/implementation/cemaris-notice-generation-pilot-release-gate-completion.md)
ist am 31.08.2026 vollständig mit Variante A „Stop“ abgeschlossen. Die als
Testpilot gewünschte Nutzung des Development-Repositorys mit `Cemaris_Dev`
ist als eigens geschaffene kombinierte Development- und Testpilotumgebung
klargestellt. Die Datenbank ist damit nicht mehr als Widerspruch bewertet;
die [technische Pilot-Readiness und Neubewertung](docs/implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
hat den tatsächlichen vollständigen 6b-/6c-Migrationsstand read-only bestätigt.
LibreOffice `26.8.0.3`, reale synthetische DOCX-/PDF-/Druck-zu-Datei-Ausgabe,
Schriften sowie Temp-Bereinigung nach Erfolg, Fehler, Timeout, Abbruch und
Wiederanlauf sind ebenfalls technisch nachgewiesen. Zwei vorab reproduzierte
6c-Fehler wurden minimal und regressionsgesichert behoben. Weil insbesondere
Vollbackup/Restore, Monitoring, installationsbezogene Härtung und zuständige
Freigaben fehlen, endet auch die Neubewertung mit Variante A. Capability und
Aktivierungsauftrag bleiben aus.
Die getrennte
[6c-Betriebsremediation und erneute Pilotneubewertung](docs/implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
ist inzwischen vollständig ausgeführt. Ein neues `COPY_ONLY`-Vollbackup mit
Checksum wurde verifiziert, ausschließlich auf dem bestätigten entbehrlichen
Ziel wiederhergestellt, inhaltsfrei geprüft und das Ziel danach entfernt. Die
Sicherung bleibt erhalten. Monitoring, gehärtete Installationsgrenzen,
Auditbetriebsregeln und zuständige Freigaben waren damals offen oder teilweise
bestätigt; der Auftrag endete deshalb mit Variante A. Seit 07.09.2026 sind
diese allgemeinen Hürden für den oben verlinkten lokalen Prototyppfad
zurückgestellt.
Gebührenberechnung, Rechtswirkung, Zustellung, Archivierung,
FINANZ+-Integration, Migration und Produktivsetzung bleiben gesperrt.
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
$env:Features__NoticeDraftEditingEnabled = "true"
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
- bei aktiver Bescheidentwurfs-Capability mehrere rechtlich wirkungslose
  manuelle Entwürfe, Fachrevisionen und für Administration die versionierte
  Nummernkonfiguration;
- bei zusätzlich aktivierter Dokumenterzeugungs-Capability genau einen
  flüchtigen rechtlich wirkungslosen Beisetzungsgebühren-Entwurf als DOCX/PDF
  sowie administrative Satzungsversionen und Benutzerkontaktpflege;
- Startregeln schreiben ausschließlich über die administrative
  Programmkonfiguration.

Ist `Features__BurialProcessEditingEnabled` aktiv, ersetzt der 4b-Prozess die
alten einfachen Beisetzungsschreibendpunkte. Die sieben fachlichen Capabilities
werden getrennt konfiguriert. Für den vollständigen synthetischen
Bescheidentwurfspiloten müssen wegen Beteiligtenauswahl und Inhabervorschlag
`PersonUsageRightsEditingEnabled` und `NoticeDraftEditingEnabled` gemeinsam
aktiv sein. Die zusätzliche Dokumenterzeugung verlangt sämtliche fünf
abhängigen Capabilities sowie eine sichere lokale Vorlagen-, Temp- und
LibreOffice-Konfiguration. Sie bleibt bis zum separaten Betriebs- und
Pilotfreigabegate deaktiviert. Der 5b-Kern ersetzt die nullable Berechtigten-/Adress-/
Nutzungsrechts-Altprojektionen nicht.

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
Verbindung, Provider, die vier bereits vor 6b dauerhaft aktivierten
Capabilities und erwarteter Datenbankname liegen maschinenlokal in User
Secrets. `NoticeDraftEditingEnabled` bleibt dort bis zu einem gesondert
autorisierten SQL-Nachweis bewusst deaktiviert. Verbindungs- und Passwortwerte
werden weder im Repository noch in Befehlen oder Logs ausgegeben.

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
dotnet test tests/Cemaris.IntegrationTests --filter "Category=SqlServer" -p:UserSecretsId=
Remove-Item Env:CEMARIS_SQL_TEST_CONNECTION_STRING
```

Der verwendete Login muss Datenbanken anlegen und löschen dürfen. Die
SQL-Tests erzeugen ausschließlich eindeutig benannte temporäre Datenbanken
`Cemaris_IntegrationTests_*`, prüfen additive Migration, Seed, Suche,
Detailansicht, Providerparität, Konteneinrichtung, Importidempotenz,
Schreib-/Auditatomarität, 5b-Historie, echte Parallelrennen und Rollback und
entfernen die Datenbanken anschließend wieder. Vor dem Löschen werden erfolgreiche eigene Erzeugung, Präfix und
aufgelöster Datenbankname erneut geprüft. Ohne die Umgebungsvariable werden
diese Tests übersprungen.

Der Buildparameter `-p:UserSecretsId=` verhindert für den Testbuild das
automatische Laden lokaler User Secrets. Der Wiedervorlagen-Hosttest prüft
das fehlende Assemblyattribut ausdrücklich. Bei `--no-build` muss zuvor mit
diesem Parameter gebaut worden sein. Der gezielte
[M1-SQL-Nachweis](docs/implementation/cemaris-manual-case-follow-ups-sql-verification.md)
ist ausgeführt; er ist kein neuer Nachweis der gesamten SQL-Testkategorie.

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
| `Features__UsageRightLifecycleEnabled` | manueller M2a-Lebenszyklus; nur `Development`, benötigt `PersonUsageRightsEditingEnabled`; keine NoticeGeneration-Abhängigkeit | `false`, nur prozesslokal für isolierte Erprobung aktivieren |
| `Features__PersonUsageRightsEditingEnabled` | synthetischer kanonischer Beteiligten-/Nutzungsrechtskern; nur in `Development` zulässig | `false` (portabler Standard), lokal ausdrücklich `true` |
| `Features__NoticeDraftEditingEnabled` | rechtlich wirkungsloser manueller Bescheidentwurfskern; nur in `Development` zulässig | `false` (Standard), nur im ausdrücklich aktivierten synthetischen Development-Piloten `true` |
| `Features__NoticeDraftLineItemsEnabled` | manuelle M3a-Positionen mit verbindlicher Summe; nur Development, benötigt `NoticeDraftEditingEnabled` | `false`; nur prozesslokal für isolierte synthetische Erprobung aktivieren |
| `Features__NoticeGenerationEnabled` | flüchtige rechtlich wirkungslose DOCX-/PDF-Erzeugung; nur in `Development` und mit allen abhängigen Capabilities zulässig | `false`; lokale synthetische Testsitzung darf prozesslokal aktivieren |
| `Features__CaseFollowUpsEnabled` | gemeinsamer manueller Wiedervorlagenbereich für synthetische Fallakten; nur in `Development`, unabhängig von anderen Capabilities | `false`; ausschließlich prozesslokale Aktivierung im isolierten Test |
| `NoticeGeneration__TemplateRoot` / `TemplateFileName` | read-only Vorlagenstamm im Content-Root und feste DOCX-Datei | installationsspezifisch, keine Uploadfunktion |
| `NoticeGeneration__TempRoot` | kontrollierter Tempstamm im Content-Root | installationsspezifisch, keine Fremdpfade oder Reparse Points |
| `NoticeGeneration__LibreOfficeExecutablePath` | absoluter Pfad zur separat installierten PDF-Engine | portabel `null`; lokal bestätigten `soffice.com`-Pfad prozesslokal setzen |
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
6. abgeschlossene Gebühren-/Bescheid-Gates 6a, 6a-F und 6c sowie die technisch
   abgeschlossenen Development-Schnitte 6b für kanonische manuelle Entwürfe
   und 6c für genau einen flüchtigen rechtlich wirkungslosen
   Beisetzungsgebühren-Entwurf; Betriebs-/Pilotgate, technische Readiness und
   Backup-/Restore-Betriebsremediation sind historisch mit Variante A
   abgeschlossen; der lokale synthetische Prototyptest vom 07.09.2026 ist mit
   prozesslokaler Aktivierung, echtem PDF und isoliertem Browsercheck ausgeführt
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
