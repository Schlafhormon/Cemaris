# Abgeschlossene Übergabe: SQL-Verifikation und atomarer Fallakten-Änderungsnachweis

Stand: 13.08.2026

> **Status:** Dieser Auftrag ist gemäß der
> [Abschlussdokumentation](cemaris-case-change-attribution-completion.md)
> technisch abgeschlossen. Für die Fortsetzung gilt ausschließlich die
> [Übergabe zu lokalen Konten und serverseitiger Autorisierung](cemaris-production-identity-authorization-next-step-handoff.md).
> Die folgenden Aussagen beschreiben den damaligen Ausgangsstand.

## Ziel des nächsten Schritts

Implementiere den nächsten abgegrenzten Cemaris-Produktinkrement Ende zu
Ende: Verifiziere den vorhandenen schreibenden Fallaktenpfad gegen den lokalen
SQL Server `CEMARISDEV` und ergänze eine providerneutrale Akteurszuordnung,
einen atomaren persistenten Änderungsnachweis sowie die Anzeige „Zuletzt
geändert durch …“.

Der Inkrement bleibt ausschließlich für synthetische Development-Daten,
standardmäßig deaktiviert und außerhalb von `Development` sicher gesperrt.
Er implementiert noch keine produktive Anmeldung und keine produktive
Autorisierung. LDAP und lokale Konten bleiben zulässige, aber noch nicht
ausgewählte Anbieter. Für das Inkrement wird genau ein fest serverseitig
definierter synthetischer Development-Akteur verwendet.

## Entscheidungsgrundlage

Die Produktvorgaben vom 13.08.2026 sind in
[Produktvorgaben zu Identität, Rollen, Änderungsnachweis und Betrieb](../requirements/identity-authorization-audit-decisions.md)
dokumentiert:

- zulässige Identitätsvarianten: LDAP oder lokale Konten mit Benutzername und
  Passwort; konkrete Auswahl noch offen;
- genau zwei erste Systemrollen: `Sachbearbeitung` und `Administration`;
- erfolgreiche Änderungen müssen „wann, wer, was“ nachvollziehbar machen;
- in der Fallakte genügt zunächst die letzte Änderungszuordnung;
- Zielbetrieb On-Premises mit eigener SQL-Server-Datenbank;
- lokale Testinstanz `CEMARISDEV` vorhanden.

Die On-Premises-Vorgabe ist keine Datenschutz- oder Produktivfreigabe.

## Verifizierter Ausgangsstand

Zum Zeitpunkt dieser Übergabe:

- Repository: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch: `main`;
- HEAD: `c416ad5a33737ebb7544be6b3f5c7a889213009b`;
- Arbeitsbaum: sauber und mit `origin/main` synchron;
- lesende Suche und Detailansicht sind vorhanden;
- synthetische Development-Fallakten können angelegt und in Grabstellenbezug,
  verstorbenen Personen und Beisetzungen geändert werden;
- SQL und synthetischer Store implementieren denselben Schreibvertrag;
- Fallversion, starker ETag und `If-Match` verhindern veraltete Änderungen
  ohne Teilwirkung;
- `Features:CaseEditingEnabled=false` ist Standard, Aktivierung außerhalb von
  `Development` führt zum Startabbruch;
- produktive Authentifizierung, Autorisierung und Auditierung existieren
  noch nicht.

Branch, HEAD und Arbeitsbaum sind nur eine Momentaufnahme und müssen vor der
Arbeit erneut geprüft werden. Vorhandene Änderungen gehören dem Benutzer und
dürfen nicht überschrieben werden.

## Arbeitsverzeichnis und Werkzeuge

Beschreibbares Repository:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich verwenden:

- `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Node und npm sind über `PATH` verfügbar. Keine Commits durchführen.

Keine anderen Arbeitsverzeichnisse öffnen oder verändern. Insbesondere:

- keine EDWALT-Originale öffnen, kopieren, hashen, verändern oder ausführen;
- keine externen Phase-2-, Phase-3- oder Phase-4-Arbeitsbereiche betreten;
- keine Phase-5-Wurzel anlegen;
- keinen EDWALT-Importcode und kein EDWALT-zu-Cemaris-Mapping erzeugen.

## Zuerst vollständig lesen

1. diese Folgeübergabe;
2. `README.md`;
3. `docs/implementation/README.md`;
4. `docs/requirements/README.md`;
5. `docs/requirements/case-record-write-decisions.md`;
6. `docs/requirements/identity-authorization-audit-decisions.md`;
7. `docs/architecture/README.md`;
8. `docs/architecture/authentication-authorization-audit.md`;
9. ADR-0002, ADR-0004, ADR-0005, ADR-0007, ADR-0009 und ADR-0010;
10. `SECURITY.md` und gegebenenfalls vorhandene `AGENTS.md`;
11. alle anschließend betroffenen Produkt-, Test- und Dokumentationsdateien
    vollständig.

## Verbindlicher Arbeitsbeginn

Bevor Dateien geändert werden:

1. Branch, HEAD und Upstream erfassen;
2. `git status --short --branch` ausführen;
3. vollständigen Arbeitsbaum-Diff einschließlich `--stat` und
   `--name-status` lesen;
4. unversionierte Dateien mit `git ls-files --others --exclude-standard`
   erfassen und relevante Textdateien lesen;
5. fremde beziehungsweise bereits vorhandene Änderungen erhalten;
6. Baseline-Builds und -Tests ausführen.

PowerShell-Grundlage:

```powershell
$cemarisDotnet = 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe'
& $cemarisDotnet restore Cemaris.sln
& $cemarisDotnet tool restore
& $cemarisDotnet build Cemaris.sln --configuration Release --no-restore
& $cemarisDotnet test Cemaris.sln --configuration Release --no-build
& $cemarisDotnet format Cemaris.sln --verify-no-changes --no-restore

Push-Location src/Cemaris.Web
npm ci
npm test -- --run
npm run lint
npm run build
Pop-Location
```

Schlägt eine Baseline fehl, Ursache und Abgrenzung dokumentieren. Keine
fremden Fehler durch stilles Umschreiben kaschieren.

## Verbindliche Schutzgrenzen

- Ausschließlich Cemaris-Produktcode, seine Tests und Dokumentation in diesem
  Repository bearbeiten.
- Nur eindeutig synthetische Development-Daten und synthetische
  Testidentitäten verwenden.
- Keine echten Namen, Kennungen, Benutzerkonten, LDAP-Daten, Grab-, Personen-,
  Adress-, Bescheid- oder Auditdaten verwenden.
- Keine Secrets, Passwörter, Tokens, Zertifikate oder lokale Zugangsdaten in
  Git, Logs, Screenshots oder Abschlussdokumentation übernehmen.
- Keine produktive Anmeldung, Kontenverwaltung, LDAP-Anbindung oder
  Berechtigungsmatrix erfinden.
- Keine Client-Header wie `X-User`, `X-Actor` oder vergleichbare frei
  setzbare Werte als vertrauenswürdige Identität akzeptieren.
- Keine Grabarten, Status, Rollen jenseits der zwei bestätigten Rollennamen,
  Fristen, Gebühren-, Bescheid-, Lösch-, Storno-, Umnummerierungs-,
  Aufbewahrungs- oder fachliche Auditregeln erfinden.
- Keine vollständigen Vorher-/Nachher-Kopien der Falldaten im Audit speichern.
- Bestehende lesende Verträge kompatibel halten; additive Felder dürfen alte
  persistierte Zeilen nicht unlesbar machen.
- `Features:CaseEditingEnabled` bleibt standardmäßig `false` und außerhalb
  von `Development` nicht aktivierbar.
- Keine Datenbankmigration beim normalen API-Start und keinen automatischen
  Seed beim normalen Start ergänzen.
- Keine Commits durchführen.

## Verbindlicher Implementierungsauftrag

### 1. Providerneutraler Akteursvertrag

Führe in der Application-Schicht einen kleinen, providerneutralen Vertrag für
den aktuell handelnden Akteur ein. Er enthält mindestens:

- eine stabile technische Akteurskennung;
- einen darstellbaren Namen;
- die bestätigte Systemrolle.

Die zulässigen Rollennamen sind ausschließlich `Sachbearbeitung` und
`Administration`. Sie bilden in diesem Inkrement noch keine
Berechtigungsentscheidung und dürfen keinen produktiven Vollzugriff
implizieren.

Registriere für den Development-Schreibpfad genau einen serverseitig
festgelegten, klar synthetisch benannten Akteur der Rolle `Sachbearbeitung`.
Der Wert darf kein Secret sein und nicht vom Request überschrieben werden.
Gestalte die Schnittstelle so, dass ein späterer Claims-/LDAP- oder
Lokalkonten-Adapter sie bedienen kann, ohne die Fallaktenlogik umzubauen.

Verwende eine serverseitige Zeitquelle (`TimeProvider` oder eine gleichwertig
testbare Abstraktion). Persistierte Zeitpunkte sind UTC und werden als
`DateTimeOffset` oder semantisch gleichwertig gespeichert.

### 2. Minimaler Änderungsnachweis

Definiere einen stabilen, datensparsamen Änderungsvertrag. Pro erfolgreicher
Fallaktenmutation werden mindestens gespeichert:

- serverseitig erzeugte Änderungs-ID;
- Fall-ID;
- resultierende monotone Fallversion;
- UTC-Zeitpunkt;
- stabile Akteurskennung;
- darstellbarer Akteursname als historischer Snapshot;
- stabile Operation;
- optional die serverseitige ID des betroffenen Kindobjekts, wenn vorhanden.

Die stabilen Operationen decken exakt die vorhandenen Schreibfälle ab:

- Fallakte angelegt;
- Grabstellenbezug geändert;
- verstorbene Person hinzugefügt;
- verstorbene Person geändert;
- Beisetzung hinzugefügt;
- Beisetzung geändert.

Keine frei formulierten Benutzertexte und keine vollständigen Feldwerte,
Vorher-/Nachher-Datensätze oder Request-Bodies im Audit speichern. Technische
Anwendungslogs bleiben vom fachlichen Änderungsnachweis getrennt.

### 3. Atomare Stores und Nebenläufigkeit

Erweitere `ICaseWriteStore`, synthetischen Store und EF-/SQL-Store so, dass
Fachänderung, resultierende Fallversion, letzte Änderungszuordnung und genau
ein Auditdatensatz gemeinsam erfolgreich werden oder gemeinsam ausbleiben.

Verbindliche Semantik:

- Anlage erzeugt Version 1 und genau einen Auditdatensatz für Version 1;
- jede erfolgreiche Mutation erhöht die Fallversion genau um 1 und erzeugt
  genau einen Auditdatensatz mit derselben resultierenden Version;
- `(CaseId, ResultingVersion)` ist eindeutig abgesichert;
- fehlendes oder veraltetes `If-Match`, unbekannter Fall, unbekanntes
  Kindobjekt, ungültiger Fremdbezug, Validierungsfehler oder technischer
  Speicherfehler hinterlassen keine Teilwirkung und keinen erfolgreichen
  Auditdatensatz;
- zwei parallele Mutationen mit derselben erwarteten Version führen zu genau
  einem Gewinner, einer Versionserhöhung und einem Auditdatensatz;
- kann der Auditdatensatz nicht gespeichert werden, wird die gesamte
  Fachmutation zurückgerollt.

Beim SQL-Store muss diese Semantik in derselben Datenbanktransaktion liegen.
Beim synthetischen Store muss sie innerhalb derselben bestehenden
Synchronisationsgrenze gelten. Keine globale oder prozessübergreifende
Fachregel ergänzen.

### 4. SQL-Schema und Migration

Erweitere das vorläufige EF-Schema additiv um:

- die letzte Änderungszuordnung am Fall mit UTC-Zeitpunkt, Akteurskennung und
  darstellbarem Namen;
- eine eigenständige Falländerungstabelle mit den oben festgelegten
  Minimalfeldern;
- eindeutigen Index auf Fall-ID und resultierender Version;
- sinnvolle Längenbegrenzungen und Fremdschlüssel ohne eine noch nicht
  beschlossene Lösch-/Aufbewahrungsregel zu erfinden.

Erzeuge eine reguläre EF-Core-Migration und aktualisiere den Model-Snapshot.
Bereits vorhandene Zeilen müssen nach der Migration weiterhin lesbar sein.
Unbekannte historische Akteure dürfen nicht erfunden werden; Felder können für
Altzeilen nullable bleiben und die UI verwendet dafür eine neutrale Anzeige.

Der bestehende synthetische Seeder muss reproduzierbar bleiben und seine neu
erzeugten Zeilen ausschließlich mit dem festgelegten synthetischen Akteur und
synthetischen Auditdaten versehen. Keine echte Identität in Seed oder Migration
einbetten.

### 5. Application, API und Verträge

`CaseWriteService` erzeugt serverseitige IDs, Operation und Zeitpunkt und
übergibt den aktuellen Akteur explizit an den Store. Vermeide versteckte
Abhängigkeiten der Domain an ASP.NET Core, `HttpContext`, LDAP oder EF Core.

Erweitere die Falldetailprojektion und den API-Vertrag additiv um eine
kompakte letzte Änderungsinformation mit:

- Akteursname;
- UTC-Zeitpunkt.

Optional darf die stabile Akteurskennung intern beziehungsweise im
Application-Modell geführt werden; gib sie nur in der öffentlichen Antwort
aus, wenn dies für die bestätigte Anzeige nötig ist. Die Rolle wird nicht als
Berechtigungsbehauptung in den Fallvertrag aufgenommen.

Bestehende Endpunkte, ETags, Statuscodes und Fehlermodelle bleiben kompatibel.
Es wird noch kein Audit-Listen-, Such- oder Exportendpunkt ergänzt, weil dessen
Berechtigungs- und Aufbewahrungsregeln offen sind. Es wird kein Login-Endpunkt
ergänzt.

### 6. React-Oberfläche

Zeige in Falldetail und Fallbearbeitung die letzte erfolgreiche Änderung in
verständlichem Deutsch an, beispielsweise:

`Zuletzt geändert durch Synthetische Development-Sachbearbeitung am …`

Nutze eine robuste lokale Datums-/Zeitformatierung. Für migrierte Altzeilen
ohne Zuordnung muss die UI eine neutrale, nicht irreführende Anzeige verwenden.
Die Anzeige darf keine Anmeldung vortäuschen und enthält keine Rollen- oder
Berechtigungssteuerung.

Bestehende Suche, Detailansicht, Bearbeitungsformulare, ETag-Konfliktbehandlung
und responsive Bedienung bleiben funktionsfähig.

### 7. Tests

Ergänze mindestens automatisierte Tests für:

- exakt zwei zulässige Rollennamen und Ablehnung/Unmöglichkeit unbekannter
  Rollen im internen Vertrag;
- serverseitig festgelegten synthetischen Development-Akteur;
- deterministische UTC-Zeit über eine testbare Zeitquelle;
- Anlage und jede der fünf vorhandenen Mutationstypen mit passender Operation,
  Akteur, Zeitpunkt, Zielobjekt und resultierender Version;
- letzte Änderungszuordnung in Application-, API- und React-Vertrag;
- genau einen Auditdatensatz je erfolgreicher Fallversion;
- keine neue Version, keine geänderte letzte Zuordnung und keinen
  Auditdatensatz bei Validierungs-, Referenz-, Not-found- und ETag-Fehlern;
- parallele Mutationen mit derselben Version: genau ein Gewinner und genau ein
  neuer Auditdatensatz;
- Rollback der Fachänderung, wenn der Auditanteil scheitert;
- Parität des synthetischen und des SQL-Stores;
- Migration bestehender Datenbankstände und Lesbarkeit nullable Altmetadaten;
- UI-Anzeige mit vorhandenem sowie fehlendem Änderungsmetadatensatz;
- unveränderten sicheren Startabbruch außerhalb von `Development` bei
  aktivierter Schreibfunktion;
- unveränderte Lesefunktionen und bisherigen Schreibablauf.

Tests verwenden nur erkennbar synthetische Werte. Keine Uhrzeitabhängigkeit
über reale Wartezeiten einführen.

## Lokale SQL-Server-Verifikation

Nutze für den lokalen Test ausschließlich die bereits dokumentierte
Development-Verbindung mit integrierter Windows-Anmeldung. Setze den
Connection String nur für den Prozess der SQL-Integrationstests und entferne
ihn anschließend sicher:

```powershell
$cemarisDotnet = 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe'
$env:CEMARIS_SQL_TEST_CONNECTION_STRING = '<prozesslokal bereitgestellte Testverbindung>'
try {
    & $cemarisDotnet test tests/Cemaris.IntegrationTests/Cemaris.IntegrationTests.csproj `
        --configuration Release `
        --filter 'Category=SqlServer'
}
finally {
    Remove-Item Env:CEMARIS_SQL_TEST_CONNECTION_STRING -ErrorAction SilentlyContinue
}
```

Die vorhandene Fixture darf nur eindeutig benannte temporäre Datenbanken
`Cemaris_IntegrationTests_*` anlegen, migrieren, testen und wieder entfernen.
Vor einem Löschvorgang muss der aufgelöste Datenbankname weiterhin dieses
Präfix erfüllen. Keine vorhandene Benutzer- oder Produktdatenbank leeren,
überschreiben oder löschen.

Funktioniert die dokumentierte integrierte Anmeldung lokal nicht, keine
Zugangsdaten raten und keine Secrets ausgeben. Allgemeine Tests und
Implementierung fortsetzen, den SQL-Test präzise als externen Blocker
dokumentieren und nur die fehlende lokale Verbindungsart erfragen.

## Dokumentationsergebnisse

Mindestens aktualisieren beziehungsweise neu erstellen:

- `README.md` mit aktuellem Funktions- und Sicherheitsstand;
- `docs/implementation/README.md` mit abgeschlossenem Teilinkrement 3a und
  weiterhin offenem produktiven Identitäts-/Berechtigungsschritt;
- `docs/requirements/case-record-write-decisions.md` mit dem tatsächlich
  implementierten Änderungsvertrag;
- `docs/architecture/authentication-authorization-audit.md` mit dem
  tatsächlich umgesetzten providerneutralen Akteurs- und Auditmodell;
- neues `ADR-0011` für Akteurszuordnung, atomaren Auditnachweis und bewusste
  Nichtentscheidung des produktiven Identitätsanbieters;
- `docs/decisions/README.md`;
- eine Abschlussdokumentation mit tatsächlichen Dateien, Migration,
  Testzahlen, SQL-Ergebnis und verbleibenden Grenzen;
- eine neue eigenständige Folgeübergabe für die Entscheidung und spätere
  Implementierung von produktiver Identität und operationsgenauer
  Berechtigung.

Keine Testergebnisse oder SQL-Verifikation behaupten, die nicht tatsächlich
ausgeführt und erfolgreich beobachtet wurden.

## Abschlussprüfungen

Nach der Implementierung vollständig ausführen:

```powershell
$cemarisDotnet = 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe'
& $cemarisDotnet restore Cemaris.sln
& $cemarisDotnet tool restore
& $cemarisDotnet build Cemaris.sln --configuration Release --no-restore
& $cemarisDotnet test Cemaris.sln --configuration Release --no-build
& $cemarisDotnet format Cemaris.sln --verify-no-changes --no-restore

Push-Location src/Cemaris.Web
npm ci
npm test -- --run
npm run lint
npm run build
Pop-Location
```

Zusätzlich:

- SQL-Integrationstests gegen `CEMARISDEV` wie oben ausführen;
- idempotentes EF-Migrationsskript erzeugen und ohne Secrets auf Plausibilität
  prüfen;
- API-/OpenAPI-Vertrag und ETag-/If-Match-Verhalten prüfen;
- mindestens einen echten Parallelitätstest gegen SQL ausführen;
- lokale Markdown-Links und Tabellenspalten prüfen;
- `git diff --check` ausführen;
- vollständigen finalen Diff, `git status --short --branch` und
  unversionierte Dateien prüfen;
- geänderte Dateien auf Secrets, echte personenbezogene Daten,
  Connection Strings, Zugangsdaten und versehentlich protokollierte
  Request-/Falldaten prüfen;
- bestätigen, dass keine EDWALT-Datei, kein externer Arbeitsbereich und keine
  Phase-5-Wurzel berührt wurde;
- bestätigen, dass kein Commit erstellt wurde.

Temporäre Prüfartefakte außerhalb des Repositories sicher entfernen. Keine
laufenden API-, Vite- oder Testprozesse zurücklassen.

## Abnahmekriterien

Der Auftrag ist erst abgeschlossen, wenn:

1. jede erfolgreiche synthetische Fallaktenänderung genau einem serverseitig
   bestimmten Akteur und UTC-Zeitpunkt zugeordnet ist;
2. SQL-Fachänderung, Version, letzte Zuordnung und Auditdatensatz atomar sind;
3. veraltete und fehlerhafte Mutationen ohne jede Teilwirkung bleiben;
4. Falldetail und Bearbeitung „Zuletzt geändert durch …“ anzeigen;
5. synthetischer und SQL-Provider denselben Vertrag erfüllen;
6. die Migration gegen eine temporäre Datenbank auf `CEMARISDEV` erfolgreich
   geprüft wurde oder ein nachweisbarer lokaler Verbindungsblocker offen
   ausgewiesen ist;
7. bestehende lesende und schreibende Development-Funktionen kompatibel sind;
8. die Capability weiterhin standardmäßig aus und außerhalb von Development
   sicher gesperrt ist;
9. keine produktive Authentifizierung oder Berechtigung vorgetäuscht wurde;
10. Dokumentation und eigenständige Folgeübergabe den tatsächlichen Endstand
    wiedergeben;
11. alle Abschlussprüfungen erfolgreich sind oder jeder verbleibende externe
    Blocker präzise dokumentiert ist;
12. keine Commits durchgeführt wurden.

## Bewusst nicht Bestandteil

- Auswahl oder Anbindung von LDAP;
- lokale Benutzer-, Passwort-, Reset-, Sperr- oder Sitzungsverwaltung;
- produktive Authentifizierung oder Autorisierung;
- frei wählbare Benutzeridentitäten im Development-Frontend;
- Audit-Leseoberfläche, Suche, Export, Aufbewahrung oder Löschung;
- Freigabe für echte Verwaltungsdaten oder Produktivbetrieb;
- neue Friedhofsfachregeln, Datenlöschung oder Historienrekonstruktion;
- EDWALT-Import, Mapping oder Phase 5.
