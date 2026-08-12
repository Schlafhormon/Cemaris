# Übergabe: Cemaris – schreibende Fallakten-Grundlage

Stand: 12.08.2026

## Ziel des nächsten Schritts

Der vorhandene Read-only-MVP wird um den zweiten, vollständig getesteten
Produktinkrement ergänzt. In einer ausdrücklich aktivierten
Development-Umgebung sollen ausschließlich synthetische Fallakten angelegt und
deren Grabstellenbezug, verstorbene Personen und Beisetzungen geändert werden
können. Jede Änderung muss unmittelbar über die bestehende Suche und
Detailansicht sichtbar sein.

Das Ergebnis ist produktionsnah strukturierter Anwendungscode, aber noch keine
Produktivfreigabe. Ohne aktivierte Development-Funktion darf kein Schreibpfad
erreichbar sein.

Verbindliche Grundlage ist
[Implementierungsentscheidungen: schreibende Fallakten-Grundlage](../requirements/case-record-write-decisions.md).

## Verifizierter Ausgangsstand

Zum Übergabezeitpunkt:

- Repository: `main`, HEAD
  `fc32314c1351e426d41d763862010b3e6e3ce09b`, gegenüber `origin/main` zwei
  Commits voraus;
- der Arbeitsbaum enthält absichtlich noch nicht committete Dokumentation der
  abgeschlossenen EDWALT-Phase 4 sowie diese Produktübergabe;
- .NET SDK `10.0.302`, Node `24.19.0`, npm `11.17.0`;
- Release-Build: 0 Warnungen, 0 Fehler;
- reguläre Tests: 6 Unit- und 7 API-Integrationstests bestanden;
- 3 SQL-Server-Integrationstests mangels expliziter Testverbindung planmäßig
  übersprungen;
- `dotnet format --verify-no-changes`: erfolgreich;
- Frontend-Lint und -Produktionsbuild: erfolgreich.

Dieser Stand ist vor jeder Änderung erneut zu prüfen. Zahlen und Git-Stand
sind keine Erlaubnis, zwischenzeitliche fremde Änderungen zu überschreiben.

## Arbeitsverzeichnisse und Werkzeuge

Beschreibbares Repository:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Maßgebliche Projektbereiche:

- Backend: `src\Cemaris.Domain`, `src\Cemaris.Application`,
  `src\Cemaris.Infrastructure`, `src\Cemaris.Api`;
- Frontend: `src\Cemaris.Web`;
- Tests: `tests\Cemaris.UnitTests`, `tests\Cemaris.IntegrationTests`;
- Dokumentation: `docs\implementation`, `docs\requirements`,
  `docs\architecture`, `docs\decisions`.

Lokales .NET SDK:

- `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Node und npm sind über `PATH` verfügbar. Nutze `npm ci`; ändere
`package-lock.json` nur reproduzierbar über npm, falls für Frontendtests neue
Pakete tatsächlich erforderlich sind.

Die folgenden EDWALT-Verzeichnisse und externen Analysebereiche sind für
diesen Auftrag vollständig **außerhalb des Scopes und read-only**. Nicht
öffnen, nicht kopieren, nicht hashen, nicht verändern und keine Programme
daraus ausführen:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812`
- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812`

Die Phase-5-Wurzel
`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-fee-master-variants-20260812`
darf in diesem Auftrag nicht angelegt werden.

## Zuerst vollständig lesen

1. dieses Übergabedokument;
2. `README.md`;
3. `docs/implementation/README.md`;
4. `docs/requirements/README.md`;
5. `docs/requirements/mvp-read-search-decisions.md`;
6. `docs/requirements/case-record-write-decisions.md`;
7. `docs/architecture/README.md`;
8. `docs/architecture/authentication-authorization-audit.md`;
9. ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0007 und ADR-0009;
10. alle aktuell betroffenen Quell- und Testdateien vollständig.

Falls `AGENTS.md` oder weitere lokale Arbeitsanweisungen inzwischen vorhanden
sind, gelten sie zusätzlich.

## Schutz- und Arbeitsregeln

1. Vor Beginn Git-Status, vollständigen Diff, unversionierte Dateien, Branch
   und HEAD prüfen. Bestehende Änderungen sind fremde beziehungsweise bereits
   bewusst erarbeitete Inhalte und müssen erhalten bleiben.
2. Keine echten Personen-, Grab-, Adress-, Gebühren-, Bescheid- oder sonstigen
   Verwaltungsdaten verwenden. Neue Beispiele sind unmissverständlich
   synthetisch und nutzen ungültige Beispielkennungen beziehungsweise
   -postleitzahlen.
3. Keine Secrets, Connection Strings, Tokens oder lokalen SQL-Zugangsdaten in
   Git schreiben. Optionale SQL-Tests verwenden ausschließlich die bestehende
   Umgebungsvariable `CEMARIS_SQL_TEST_CONNECTION_STRING`.
4. Keine EDWALT-Quellen oder Analyseberichte auswerten. Es entsteht weder
   Importcode noch Mapping.
5. Keine fachlichen Regeln aus EDWALT, Branchenüblichkeit oder Vermutung
   ableiten. Offene Pflichtfelder, Status, Fristen, Rechte, Gebühren und
   Historienregeln bleiben offen.
6. Keine Löschendpunkte, Soft-Delete-Semantik, Storno-, Umnummerierungs- oder
   Aliaslogik implementieren.
7. Bestehende API- und UI-Lesefunktionen kompatibel halten. Neue
   Fehlermeldungen sind datensparsam und als standardisierte Problem Details
   auszugeben.
8. Keine automatische Datenbankerstellung, Migration oder Befüllung beim
   normalen API-Start. Bestehende Development-Sicherungen des synthetischen
   Seeders erhalten.
9. EF-Migrationen nur additiv als neue Migration erzeugen; die bestehende
   Migration nicht umschreiben. Keine produktiven Daten voraussetzen oder
   stillschweigend löschen.
10. Keine Commits durchführen.

## Verbindlicher Implementierungsumfang

### 1. Domain und Application

- `Cemaris.Domain` erhält eine kleine persistenz- und HTTP-unabhängige
  Fallakten-Grundlage für stabile ID, monotone Version, Grabstellenbezug,
  verstorbene Person und Beisetzung.
- Die Begriffe bilden nur gespeicherte Tatsachen ab. Keine Grabart, kein
  Fallstatus, keine Belegungs-, Frist- oder Gebührenlogik ergänzen.
- Application-Use-Cases und Ports für diese Operationen implementieren:
  Fallakte anlegen, Grabstellenbezug ändern, verstorbene Person hinzufügen und
  ändern, Beisetzung hinzufügen und ändern.
- Serverseitig erzeugte GUIDs, Textnormalisierung und Längengrenzen gemäß
  `case-record-write-decisions.md` zentral und für alle Provider identisch
  anwenden.
- Jede Mutation prüft eine erwartete Fallversion. Eine veraltete Version darf
  keinen Teilzustand schreiben. Die neue Version wird atomar erhöht.
- Ein gesetzter Verstorbenenbezug einer Beisetzung muss zu derselben Fallakte
  gehören; ein fehlender Bezug bleibt zulässig.

### 2. Persistenz und Provider

- Die bestehende Lesesicht darf nicht mit einer zweiten, divergierenden
  Datenkopie gekoppelt werden. Wähle eine einfache, transaktionale Lösung, bei
  der Schreiben und anschließendes Lesen denselben kanonischen Zustand sehen.
- Das aktuelle relationale Schema ist weiterhin ein vorläufiges
  Fallakten-/Leseschema und kein endgültiges Fachmodell. Benenne diese Grenze
  in Code und Dokumentation ehrlich.
- Ergänze die notwendige Fallversion per neuer EF-Core-Migration. Änderungen
  an Kindobjekten müssen die Root-Version in derselben Transaktion erhöhen.
- Der SQL-Store verwendet optimistische Nebenläufigkeit und darf bei Konflikt
  keine Last-write-wins-Überschreibung ausführen.
- Der synthetische Standardprovider unterstützt denselben Ablauf
  threadsicher und pro Prozess. Änderungen verfallen beim Neustart und bleiben
  immer `IsSynthetic=true`.
- Ein mit Development-Schreibfunktion neu angelegter SQL-Datensatz ist
  ebenfalls zwingend synthetisch. Der vorhandene Seeder und seine
  Schutzprüfungen bleiben funktionsfähig.

### 3. Feature- und Sicherheitsgrenze

- Neue Konfiguration `Features:CaseEditingEnabled`, Standardwert `false`.
- Bei `true` außerhalb von `Development` muss der Start mit klarer,
  nicht-sensitiver Fehlermeldung abbrechen.
- Bei `false` werden keine schreibenden Fallaktenendpunkte angeboten; OpenAPI
  und UI dürfen die Fähigkeit dann ebenfalls nicht anzeigen.
- Erweitere die nicht-sensitive Systeminformation um eine eindeutige
  Capability-Angabe, damit das Frontend die Bearbeitung nur bei aktiver
  Development-Funktion anbietet.
- Diese Grenze ist kein Ersatz für spätere Authentifizierung, Autorisierung
  oder Auditierung und darf nicht als Produktivschutz beschrieben werden.

### 4. HTTP-Vertrag

Implementiere konsistente REST-Endpunkte unter `/api/cases`:

- `POST /api/cases` – Fallakte mit Grabstellenbezug anlegen;
- `PUT /api/cases/{caseId}/grave` – Grabstellenbezug ändern;
- `POST /api/cases/{caseId}/deceased-persons` – Person hinzufügen;
- `PUT /api/cases/{caseId}/deceased-persons/{personId}` – Person ändern;
- `POST /api/cases/{caseId}/burials` – Beisetzung hinzufügen;
- `PUT /api/cases/{caseId}/burials/{burialId}` – Beisetzung ändern.

Verwende für die Nebenläufigkeit einen dokumentierten HTTP-Vertrag mit ETag
und `If-Match`:

- Erzeugung liefert `201 Created`, `Location`, die aktuelle lesende
  Fallprojektion und einen ETag der Fallversion.
- Lesen von `/api/cases/{id}` liefert ebenfalls den aktuellen ETag.
- Jede Mutation verlangt `If-Match`; fehlender Header ergibt `428`, veraltete
  Version `412` und keinen Schreibeffekt.
- Erfolgreiche Mutationen liefern die aktualisierte Projektion und den neuen
  ETag.
- Nicht vorhandene Fall-/Kind-IDs ergeben `404`; ein fremder Personenbezug
  ergibt einen klaren Validierungsfehler ohne Offenlegung fremder Daten.
- DTOs bleiben in `Cemaris.Api`; Domain- oder EF-Typen werden nicht direkt als
  HTTP-Vertrag serialisiert.

Die genaue interne Aufteilung darf verbessert werden, der sichtbare Vertrag
und die Sicherheitssemantik sind verbindlich.

### 5. Frontend

- Systemfähigkeit laden und Bearbeitungsschaltflächen nur anzeigen, wenn
  `caseEditingEnabled` wahr ist.
- Route `/cases/new` mit kompaktem, zugänglichem Formular für Friedhof, Feld
  und Grabnummer.
- Route `/cases/{id}/edit` mit getrennten Abschnitten für Grabstellenbezug,
  verstorbene Personen und Beisetzungen.
- Anlegen und Ändern müssen ETags korrekt weiterreichen und nach Erfolg den
  neuesten Serverstand verwenden.
- Konflikte (`412`) erklären, den lokalen Stand nicht automatisch
  überschreiben und ein bewusstes Neuladen anbieten.
- Servervalidierung feldbezogen anzeigen; Fokus zum Fehler führen; Lade- und
  Speichervorgänge sowie unerwartete Fehler zugänglich kennzeichnen.
- Bestehende Suche, Rücksprungparameter und Detailansicht erhalten. Nach
  erfolgreicher Änderung ist der neue Stand ohne Vollseitenneustart oder
  manuellen Projektionslauf sichtbar.
- Keine UI für Löschen, Nutzungsrechte, Berechtigte/Adressen, Gebühren,
  Bescheide, Fristen, Status oder EDWALT anbieten.

### 6. Tests

Mindestens automatisiert abdecken:

- Domain-/Application-Validierung, Textnormalisierung, IDs und monotone
  Versionen;
- Providerparität der relevanten In-Memory- und SQL-Regeln soweit ohne SQL
  lokal möglich;
- Feature standardmäßig aus: keine Endpunkte und keine UI-Capability;
- Aktivierung außerhalb Development schlägt sicher fehl;
- vollständiger API-Ablauf Anlegen → Person → Beisetzung → Ändern → Suchen →
  Detail;
- fehlendes `If-Match`, veralteter ETag, keine Teiländerung bei Konflikt;
- fremde/nicht vorhandene Kindbezüge und Längen-/Namensvalidierung;
- bestehende Read-only-Suche, Ranking, Detail- und Seeder-Tests bleiben grün;
- Frontend: Capability-Grenze, erfolgreicher Formularablauf,
  Validierungsanzeige und Konfliktbehandlung.

Führe ein schlankes Frontend-Testkommando ein, falls noch keines existiert,
und binde es in CI ein. Tests dürfen keine echte Browser- oder
Personendatenabhängigkeit besitzen.

## Dokumentationsergebnisse

Nach der Implementierung mindestens aktualisieren:

- `README.md`: aktueller Stand, Konfiguration, Development-Aktivierung,
  Endpunkte und Bedienweg;
- `docs/implementation/README.md`: Inkrement 2 als technisch abgeschlossen,
  nächstes Freigabegate;
- `docs/requirements/case-record-write-decisions.md`: tatsächlicher Vertrag,
  Abweichungen und Abnahmebefund;
- `docs/architecture/README.md`: Domain/Application-/Persistenzgrenzen und
  Feature-Sicherheitsgrenze;
- bei einer neuen wesentlichen Architekturentscheidung ein neues ADR, kein
  nachträgliches Umschreiben der Entscheidungshistorie;
- API-Konfiguration in Beispielkonfigurationen, ohne Schreibfunktion
  standardmäßig zu aktivieren.

Erstelle am Ende eine neue eigenständige Folgeübergabe. Sie darf die
Produktivfreigabe des Schreibpfads erst vorsehen, wenn Identitätsquelle,
Rollen-/Berechtigungsmatrix und Audit-Mindestanforderungen technisch nicht
ermittelbar geklärt sind. Fehlen diese Entscheidungen weiterhin, dokumentiere
sie als echtes Freigabegate und wähle keinen Authentifizierungsanbieter durch
Vermutung.

## Abschlussprüfungen

Im Repository-Stamm mit dem lokalen SDK:

```powershell
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' build Cemaris.sln --configuration Release
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' test Cemaris.sln --configuration Release --no-build
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' format Cemaris.sln --verify-no-changes --no-restore
```

Im Frontend:

```powershell
Set-Location 'C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web'
npm ci
npm test -- --run
npm run lint
npm run build
```

Falls `CEMARIS_SQL_TEST_CONNECTION_STRING` ausdrücklich vorhanden ist, auch
die optionalen SQL-Server-Integrationstests ausführen. Niemals selbst einen
Connection String raten oder speichern.

Zusätzlich:

- `git diff --check`;
- vollständigen Diff und alle unversionierten Dateien prüfen;
- keine gestagten oder unerwarteten Binär-/Buildartefakte;
- lokale Markdown-Links und Tabellenspalten der geänderten Dokumente prüfen;
- Suche nach Secrets, echten Datenbeispielen und versehentlich eingecheckten
  Datenbank-/Logdateien;
- Standardstart ohne Schreibendpunkte sowie Development-Start mit aktivierter
  synthetischer Bearbeitung jeweils testen;
- keine Commits.

Stelle nur dann eine Frage, wenn eine nicht technisch ermittelbare Entscheidung
den abgegrenzten Inkrement tatsächlich blockiert. Fachlich nicht entscheidbare
Zusatzsemantik bleibt dokumentiert `OFFEN`; den übrigen Auftrag weiterführen.

## Direkt kopierbarer Prompt

````text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-case-record-write-next-step-handoff.md

Führe anschließend den dort beschriebenen Arbeitsauftrag vollständig aus.
Übernimm alle Schutzregeln, Arbeitsverzeichnisse, Abgrenzungen,
Implementierungsanforderungen, Dokumentationsergebnisse und
Abschlussprüfungen verbindlich.

Prüfe zu Beginn Git-Status, vollständigen Diff, unversionierte Dateien,
Branch, HEAD und die Baseline-Builds. Der Arbeitsbaum enthält voraussichtlich
bereits absichtlich noch nicht committete EDWALT-Phase-4- und
Produktübergabedokumentation. Erhalte sämtliche vorhandenen Änderungen und
überschreibe keine fremde Arbeit.

Verwende für .NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Der Auftrag betrifft ausschließlich den Cemaris-Produktcode, seine Tests und
Dokumentation im Repository. Greife nicht auf EDWALT-Originale oder externe
Phase-2-/3-/4-Arbeitsbereiche zu und lege keine Phase-5-Wurzel an. Erzeuge
weder EDWALT-Importcode noch Mapping.

Implementiere die schreibende Fallakten-Grundlage Ende zu Ende in
Domain/Application, Persistenz, API, React-UI und Tests. Sie umfasst nur
synthetische Development-Daten zu Grabstellenbezug, verstorbenen Personen und
Beisetzungen. Die Funktion ist standardmäßig deaktiviert und muss außerhalb
von Development bei Aktivierungsversuch sicher fehlschlagen. Verwende
serverseitige IDs, atomare monotone Fallversionen, ETag/If-Match und lehne
veraltete Änderungen ohne Teilwirkung ab.

Erfinde keine Grabarten, Status, Rollen, Fristen, Gebühren-, Bescheid-,
Lösch-, Storno-, Umnummerierungs-, Audit- oder Berechtigungsregeln. Vorhandene
lesende Funktionen müssen kompatibel bleiben. Verwende keine echten Daten oder
Secrets. Ergänze keine produktive Authentifizierung durch Vermutung.

Führe alle im Übergabedokument genannten Backend-, Frontend-, API-,
Nebenläufigkeits-, Format-, Link-, Datenschutz- und Git-Prüfungen aus.
Dokumentiere den tatsächlichen Endstand und erstelle eine eigenständige
Folgeübergabe. Führe keine Commits durch.
````
