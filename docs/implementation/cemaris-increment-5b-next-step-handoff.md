# Ausführbare Folgeübergabe: Inkrement 5b – manueller Beteiligten-/Nutzungsrechtskern

Stand: 14.08.2026

> **Ausgeführt:** Inkrement 5b wurde am 14.08.2026 technisch abgeschlossen.
> Ergebnisse und Verifikation stehen in der
> [5b-Abschlussdokumentation](cemaris-increment-5b-completion.md). Der nächste
> sichere Auftrag ist das
> [5c-Abnahme- und Lebenszyklus-Entscheidungsgate](cemaris-increment-5c-next-step-handoff.md).

## Auftrag

Implementiere den in Inkrement 5a bestätigten kleinen Ende-zu-Ende-Durchstich
für kanonische Beteiligte, historische Postanschriften und manuelle,
historisierte Nutzungsrechte. Die lokale Bedeutung des Nutzungsrechtsbeginns
wird je Friedhof in der Programmkonfiguration gepflegt; 5b berechnet keine
Frist und keinen Status.

Diese Übergabe autorisiert ausschließlich diesen technischen
Development-Durchstich mit synthetischen Daten. Sie ist keine fachliche,
rechtliche, datenschutzrechtliche, betriebliche oder produktive Freigabe.

## Verbindliche Arbeitsgrenzen

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Lokale Satzungsquelle, falls ein Beleg nachgelesen werden muss,
ausschließlich lesend:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`

Der tatsächlich vorhandene Verzeichnisname ist vor Nutzung aufzulösen; es
darf kein Ersatzverzeichnis angelegt werden. Keine PDF-Datei verändern.

Für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Reale SQL-Verifikation ausschließlich gegen `localhost\CEMARISDEV`. Die
freigegebene Testverbindung darf nur prozesslokal gesetzt und niemals in
Ausgabe, Log, Quellcode, Testartefakt oder Dokumentation geschrieben werden.
SQL-Tests dürfen ausschließlich eindeutig
`Cemaris_IntegrationTests_*` benannte temporäre Datenbanken anlegen.

Keine EDWALT-Originale, keine externen Phase-2-/3-/4-Arbeitsbereiche und keine
Phase-5-Wurzel öffnen oder anlegen. Repository-Dokumente zu EDWALT sind nur
gekennzeichnete Altverfahrensevidenz, kein Sollprozess.

Keine echten Personen-, Grab-, Rechte- oder Verwaltungsdaten verwenden.
Keine Commits ausführen.

## Git-Sicherheit vor jeder Änderung

Vor der ersten und vor jeder weiteren logisch getrennten Änderung vollständig
prüfen:

- Branch und HEAD;
- Upstream und Ahead/Behind;
- `git status --short --branch`;
- vollständigen Arbeits- und Index-Diff;
- alle unversionierten Dateien einschließlich ihres Inhalts.

Vorhandene Änderungen gehören der auftraggebenden Person. Vollständig lesen
und erhalten; nichts verwerfen, überschreiben, stagen oder committen. Bei
inhaltlicher Überschneidung zuerst sicher integrieren, andernfalls stoppen
und nachfragen.

### Erwarteter Ausgangszustand dieser Übergabe

Beim Erstellen dieser Übergabe war der erwartete Stand:

- Branch `main`, HEAD
  `f7a6d094f241e68a58a15196ab632b96a342fafc`, Upstream `origin/main`,
  Ahead/Behind `0/0`;
- leerer Index;
- vorbereitete Änderungen in `README.md`, den vier Dokumentationsindizes und
  `docs/implementation/cemaris-increment-5-next-step-handoff.md`;
- fünf unversionierte 5a-Dokumente: Entscheidungsdokument, Architektur,
  ADR-0016, 5a-Abschluss und diese 5b-Übergabe.

Diese Änderungen sind der verbindliche 5a-Eingang für 5b und müssen erhalten
werden. Weicht der tatsächliche Stand ab, den vollständigen Inhalt prüfen und
nicht auf den hier genannten Hash zurücksetzen.

## Pflichtlektüre

Vor Codeänderungen vollständig lesen:

- `README.md`, `SECURITY.md`;
- `docs/implementation/README.md`;
- `docs/implementation/cemaris-increment-5a-completion.md`;
- `docs/requirements/person-usage-rights-deadlines-decisions.md`;
- `docs/architecture/person-usage-rights-deadlines.md`;
- `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
- `docs/requirements/identity-authorization-audit-decisions.md`;
- `docs/architecture/authentication-authorization-audit.md`;
- `docs/requirements/cemetery-master-data-decisions.md`;
- `docs/architecture/cemetery-master-data.md`;
- `docs/requirements/case-record-write-decisions.md`;
- `docs/architecture/burial-process.md`;
- ADR-0010 bis ADR-0015.

Außerdem sämtliche derzeitigen Verträge und Tests vollständig lesen, die
durch den Durchstich berührt werden:

- Domain-Entitäten, Versions- und Validierungshilfen;
- Application-Ports, Case-Read-Modelle und Mutationsresultate;
- `SyntheticCaseReadStore`, `EfCaseReadStore`, gemeinsamer synthetischer
  Mutationskoordinator und serverseitige Akteur-/Zeitabstraktionen;
- Persistenzentitäten, `CemarisDbContext`, alle Migrationen und den vollständigen
  Model-Snapshot;
- API-Verträge, Endpunkte, Policy-/Capability-Registrierung, ProblemDetails,
  ETag-, CSRF- und OpenAPI-Hilfen;
- System-Info-Vertrag und Startvalidierung;
- React-Typen, API-Adapter, Routing, Fall-/Grabstellendetail und administrative
  Konfigurationsseiten;
- Unit-, reguläre Integrations-, OpenAPI-, Frontend- und reale SQL-Tests;
- SQL-Testfixture einschließlich Erstellung und abgesicherter Bereinigung der
  temporären Datenbank.

Die alten Typen `EntitledPersonDetails`, `AddressDetails` und
`UsageRightDetails` sowie ihre Tabellen sind dabei ausdrücklich nur als
Altkompatibilitätsvertrag zu behandeln.

## Vor Beginn zu reproduzierende Baseline

Mit dem exakt vorgegebenen .NET-Werkzeug:

```powershell
$cemarisDotnet = 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe'
& $cemarisDotnet build Cemaris.sln --configuration Release
& $cemarisDotnet test Cemaris.sln --configuration Release --no-build
& $cemarisDotnet format Cemaris.sln --verify-no-changes --no-restore
```

Frontend im vorhandenen Webprojekt:

```powershell
Set-Location 'C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web'
npm ci
npm test -- --run
npm run lint
npm run build
Set-Location 'C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris'
```

Vor der realen SQL-Suite muss `sys.databases` null Datenbanken mit dem Präfix
`Cemaris_IntegrationTests_` ausweisen. Die Verbindung wird aus einer bereits
prozesslokal bereitgestellten Umgebungsvariable gelesen und nie ausgegeben.
Sind fremde Präfixdatenbanken vorhanden, nichts löschen und den Lauf stoppen.

## Verbindlicher fachlicher Umfang

Sämtliche REQ-PER-, REQ-ROLE-, REQ-UR-, REQ-CFG- und REQ-SAFE-Anforderungen
des 5a-Entscheidungsdokuments gelten. Insbesondere:

1. fallübergreifend stabile natürliche Personen und Organisationen;
2. typabhängige Namen, ausschließlich postalische Anschriften;
3. historische Adresszeiträume und höchstens eine aktuelle Hauptanschrift;
4. warnende Dublettenprüfung mit ausdrücklicher Bestätigung, kein Merge;
5. genau ein aktueller Nutzungsrechtsinhaber;
6. stabile Rechteidentität und genau eine kanonische Grabstelle;
7. manuelle Pflichtangaben für Beginn, Ende und Quellenreferenz;
8. manuelle Übertragung, Verlängerung und Faktenkorrektur mit Begründung;
9. unveränderliche Fachrevisionen und starke Versionskontrolle;
10. administrative Startbezugs-Konfiguration je Friedhof mit Snapshot am
    Recht, ohne Datumsberechnung.

## Konkretes Domänen- und Persistenzziel

Implementiere getrennte kanonische Aggregate und additive Tabellen für:

- `Party` und `PartyAddress`;
- `PartyRevision`;
- `UsageRight` und `UsageRightHolderPeriod`;
- `UsageRightRevision`;
- `UsageRightStartRule` und `UsageRightStartRuleRevision`.

Benennungen dürfen dem Repository-Stil angepasst werden, die Semantik nicht.
Alle IDs sind unveränderlich. Aggregate besitzen monotone starke Versionen.
Zeitintervalle werden als `ValidFromInclusive` und optionales
`ValidUntilExclusive` gespeichert und in Verträgen eindeutig benannt.

Erforderliche Datenbankgarantien:

- genau eine Party-Art mit passenden Pflichtnamen;
- `EndDate > StartDate` für das Recht;
- höchstens ein offenes kanonisches Recht je `GraveSiteId`;
- höchstens ein offener Inhaberzeitraum je Recht;
- genau eine Startregel je Friedhof, sofern dort Rechte angelegt werden;
- nullable `CurrentPrimaryAddressId` auf höchstens eine eigene, gegenwärtig
  gültige Anschrift je Party;
- referenzielle Integrität zu Cemetery, GraveSite und Party;
- keine kaskadierende physische Löschung fachlicher Historie.

Eindeutigkeitsbedingungen müssen neben der Application-Prüfung in SQL gegen
Parallelrennen abgesichert sein. Das synthetische Modell muss dieselben
Konflikte unter einem gemeinsamen Koordinator liefern.

Da 5b keine fachliche Beendigungsoperation besitzt, gelten sämtliche dort
angelegten Rechte als offen. Verwende in 5b einen ungefilterten eindeutigen
Index auf `GraveSiteId`; erfinde keine Status- oder Endesemantik. Ein späteres
bestätigtes Inkrement darf diesen Index im Zuge seiner Enderegeln ersetzen.
Der aktuelle Inhaber bleibt dagegen durch einen gefilterten eindeutigen Index
auf `ValidUntilExclusive IS NULL` gesichert. Startregeländerungen ändern
dasselbe versionierte Aggregat; ein ungefilterter eindeutiger Index auf
`CemeteryId` verhindert parallele Regeln.

Die Migration ist additiv. Alte `EntitledPersons`, `Addresses`,
`UsageRights` und ihre Verknüpfungen bleiben unverändert. Es gibt keinen
Backfill, keine künstliche Identitätsbildung und keine erfundene Historie.
Migrationen und Seeds enthalten weder lokale Satzungswerte noch reale Daten.

## Startbezugs-Konfiguration

Implementiere eine administrative Programmkonfiguration je kanonischem
Friedhof mit stabilem Code und Anzeige. Für allgemeine Entwicklungstests darf
eine rein synthetische Regel wie `SYN-URKUNDE` verwendet werden. Der lokale
Text `Übergabe der Nutzungsurkunde` ist kein globaler Default und kein
produktiver Seed.

Bei Rechteanlage:

- muss für den Friedhof der Grabstelle eine aktuelle Startregel bestehen;
- wird das Startdatum manuell eingegeben;
- werden Regel-ID, Code-Snapshot und Anzeige-Snapshot atomar am Recht
  gespeichert;
- wird keine Dauer oder sonstige Frist berechnet.

Eine spätere Regeländerung verändert bestehende Snapshots nicht. Regelanlage
und -änderung benötigen die administrative `ProgramConfiguration`-Policy,
starke ETags, Revision und sparsamen Audit. Physisches Löschen ist kein 5b-
Endpunkt.

## Fachoperationen und Atomarität

Implementiere providerneutral:

- Party anlegen, einschließlich optionaler initialer Adressen;
- Party-Namensfakten mit Begründung korrigieren;
- Adresszeitraum hinzufügen;
- Adresszeitraum mit Begründung korrigieren beziehungsweise einen Umzug als
  atomare Beendigung/Neuanlage erfassen;
- Recht mit erstem Inhaber anlegen;
- Recht mit Wirksamkeitsdatum und Begründung übertragen;
- Recht auf ein manuell späteres Enddatum mit Begründung verlängern;
- Rechtefakten mit Begründung korrigieren, jedoch keinen Inhaber über diesen
  Pfad wechseln;
- Startregel administrativ anlegen und ändern.

Bei jeder erfolgreichen Operation sind Fachzustand, Inhaber-/Adresszeiträume,
Ergebnisversion, vollständige Fachrevision und sparsamer Audit atomar. Der
Akteur und UTC-Zeitpunkt kommen serverseitig. Kein Request darf sie
vertrauenswürdig vorgeben.

Jeder Fehler, ETag-Konflikt oder Constraint-Konflikt rollt alle Teilwirkungen
zurück. Insbesondere darf ein Transfer niemals zwei offene oder keinen
offenen Inhaber hinterlassen.

## Dublettenwarnung

Normalisiere nur typabhängigen Namen und die gemeinsam vorhandenen
Anschriftenfelder. Normalisierung darf Originalwerte nicht ersetzen. Ein
möglicher Treffer antwortet strukturiert ohne Teilwirkung. Die Oberfläche
darf denselben Request nach bewusster Bestätigung mit
`ConfirmPossibleDuplicate=true` wiederholen. Der Server führt die
Dublettenprüfung erneut aus und protokolliert nur die erfolgreiche Anlage im
sparsamen Audit. Verwende damit das vorhandene Beisetzungsprozess-Muster;
führe kein neues Token-, Cache- oder Merge-Subsystem ein.

## Capability und Autorisierung

Neue unabhängige Option:

`Features:PersonUsageRightsEditingEnabled`

Anforderungen:

- Standardwert `false`;
- Schreibbetrieb nur in `Development` und mit `ReadModel:Provider=Synthetic`;
- ungültige Aktivierung beendet den Start mit sicherer Meldung ohne Secrets;
- keine Kopplung an Case-, Cemetery- oder Burial-Capability;
- additiver Capability-Status in `/api/system/info`.

Neue fachliche Policy `PersonUsageRights` erlaubt `Sachbearbeitung` und
`Administration`. Die vorhandene Policy `ProgramConfiguration` bleibt für
Startregelmutationen ausschließlich administrativ. Alle Endpunkte verwenden
Cookie-Authentifizierung, vorhandenen CSRF-Schutz und die bestehenden
No-Store-/Fehlergrenzen.

## HTTP- und OpenAPI-Verträge

Implementiere additive, typisierte Verträge mindestens für:

- `GET /api/parties?query=...`;
- `GET /api/parties/{partyId}` und `POST /api/parties`;
- `POST /api/parties/{partyId}/corrections`;
- `POST /api/parties/{partyId}/addresses`;
- `POST /api/parties/{partyId}/addresses/{addressId}/corrections`;
- `GET /api/grave-sites/{graveSiteId}/usage-rights`;
- `GET /api/usage-rights/{usageRightId}` und `POST /api/usage-rights`;
- `POST /api/usage-rights/{usageRightId}/transfers`;
- `POST /api/usage-rights/{usageRightId}/extensions`;
- `POST /api/usage-rights/{usageRightId}/corrections`;
- `GET /api/program-configuration/usage-right-start-rules`;
- `POST /api/program-configuration/usage-right-start-rules`;
- `PUT /api/program-configuration/usage-right-start-rules/{ruleId}`.

Detailantworten liefern starke quoted ETags. Bestehende Aggregate benötigen
`If-Match`; fehlend ergibt `428`, veraltet `412`, jeweils ohne Teilwirkung.
Validierungs-, Dubletten- und Eindeutigkeitsfehler werden als konsistente
ProblemDetails mit stabilen, nicht sensiblen Codes geliefert.

OpenAPI muss Authentifizierung, CSRF-relevante Mutationen, Header,
Statuscodes, Party-Discriminator beziehungsweise eindeutig getrennte
Namensfelder, Zeitraumsemantik und Historienmodelle vollständig beschreiben.
Alle vorhandenen OpenAPI-Verträge bleiben grün.

## Altkompatibilität

- bestehende Case-, Cemetery- und Burial-Endpunkte unverändert erhalten;
- bestehende JSON-Felder nicht entfernen oder umdeuten;
- alte nullable Beteiligten-/Adress-/Rechteprojektionen weiterhin lesen;
- kanonische 5b-Daten getrennt über neue Ressourcen ausliefern;
- alte Daten in der UI ausdrücklich als `Vorläufige Altprojektion` markieren;
- keine implizite Verknüpfung über Namen, Referenzen oder ähnliche Felder;
- keine Historie aus vorhandenen Timestamps oder Beispieldaten erfinden.

Eine spätere Übernahme alter Rechte benötigt ein eigenes bestätigtes
Migrationsinkrement.

## React-Durchstich

Erweitere die Fall-/Grabstellendetailansicht bei kanonischer Grabstelle um
einen klar getrennten 5b-Bereich:

- aktuelles kanonisches Recht und vollständige Revisionen;
- aktueller Inhaber und Inhaberzeiträume;
- Party-Suche, Detail, Anlage und Dublettenbestätigung;
- typabhängige Namens- und historische Adressformulare;
- Rechteanlage, Transfer, Verlängerung und Korrektur;
- ETag-Konflikt mit verständlichem Neuladen statt Überschreiben;
- klare Kennzeichnung der weiterhin gelesenen Altprojektionen.

Ergänze für Administration die Startregelpflege je Friedhof. Sachbearbeitung
kann den konfigurierten Bezug im Anlageformular lesen, aber nicht ändern.
Kein Formular bietet berechnete Dauer, Status, Wiedervorlage, Gebühr oder
Dokumenterzeugung an.

Tastaturbedienbarkeit, sichtbare Labels, Fokusführung, verständliche
Validierungsfehler und bestehendes responsives Verhalten sind zu erhalten.

## Tests und Abnahmefälle

### Domain und Application

- beide Party-Arten und ihre Pflicht-/Verbotsfelder;
- Zeitraumvalidierung und Hauptanschriften-Eindeutigkeit;
- Dublettennormalisierung, Warnung, erneut geprüfte boolesche Bestätigung und
  geänderte Eingaben;
- alle Fachoperationen mit korrekter Ergebnisversion und Revision;
- Startregel-Snapshot bleibt nach Regeländerung unverändert;
- zweites offenes Recht und zweiter offener Inhaber werden abgelehnt;
- Transfergrenzdatum, strikt spätere Verlängerung und korrigierbare Fakten;
- keine automatische Ableitung aus Datum, Grabart oder Beisetzung;
- Rollback und Providerparität.

### API, Security und OpenAPI

- Capability standardmäßig aus, explizit an und ungültige Kombination;
- `401`, `403`, CSRF-Ablehnung und erlaubte Rollen;
- ProgramConfiguration nur für Administration;
- quoted ETags, `If-Match`, `428`, `412` und parallele Requests;
- keine Personenwerte in Audit, Logs oder ProblemDetails;
- OpenAPI-Vollständigkeit und bestehende Vertragstests.

### Frontend

- Normalfall aus Beispiel A des Entscheidungsdokuments;
- Übertragung und Adresshistorie aus Beispiel B;
- Alt-/Konfigurationsgrenze aus Beispiel C;
- Nebenläufigkeitskonflikt aus Beispiel D;
- Rollenbegrenzung der Konfigurationsansicht;
- Altprojektionskennzeichnung;
- Vitest, Lint und Produktionsbuild.

### Reales SQL

Erweitere die reale SQL-Suite mindestens um:

- Migration aus leerer Datenbank und aus allen realistisch relevanten
  Vorgängermigrationen;
- Altzeilen bleiben nach Migration unverändert lesbar;
- keine automatisch erzeugten kanonischen Parties oder Rechte;
- ungefilterte Rechte-/Regel- und gefilterte Inhaber-Constraints unter echten
  Paralleltransaktionen;
- vollständige Create/Transfer/Extend/Correct-Atomarität;
- Fachrevision und sparsamer Audit in derselben Transaktion;
- Rollback bei bewusst ausgelöstem Fehler;
- Konfigurations-Snapshot nach Regeländerung.

Die Fixture muss vor jedem Löschen den tatsächlich aufgelösten Namen und das
exakte Präfix `Cemaris_IntegrationTests_` prüfen. Niemals eine vorhandene
Benutzer- oder Produktdatenbank ändern oder löschen. Nach erfolgreicher oder
fehlgeschlagener Suite muss eine separate Abfrage gegen `sys.databases` null
temporäre Cemaris-Testdatenbanken nachweisen.

Die reale Suite wird mit dem vorgegebenen .NET-Werkzeug ausgeführt:

```powershell
& $cemarisDotnet test tests/Cemaris.IntegrationTests `
  --configuration Release --no-build --filter 'Category=SqlServer'
```

Die prozesslokale Variable `CEMARIS_SQL_TEST_CONNECTION_STRING` muss davor
aus der freigegebenen Eingabe gesetzt und in einem `finally`-Pfad wieder
entfernt werden. Ihren Wert nie ausgeben. Die reale SQL-Providerparität wird
über Store- und isolierte Testhost-Verträge geprüft; daraus darf keine
Freigabe der Development-Capability für einen realen SQL-Laufzeitbetrieb
abgeleitet werden.

## Dokumentation

Aktualisiere bei Implementierung mindestens:

- Root-README und relevante Requirements-/Architecture-/Implementation-
  Indizes;
- Capability-, Policy-, API-, Konfigurations- und Development-Startangaben;
- Migrations- und SQL-Testanzahl/-umfang;
- eine deutsche 5b-Abschlussdokumentation mit exakter Verifikation;
- die sichere nächste Folgeübergabe.

Kommunale Konfigurationswerte stets als lokale Einrichtung kennzeichnen.
Keine Secrets oder reale Daten dokumentieren.

## Ausdrückliche Nicht-Ziele

- keine Ruhe-, Nutzungs-, Aufbewahrungs- oder Satzungsstandsberechnung;
- keine automatische oder manuelle Wiedervorlage;
- kein automatisch abgeleiteter Status oder Ablaufprozess;
- keine finale Beendigung, Rückgabe, Entzug, Schließung, Wiedervergabe oder
  Rechtsnachfolgeautomatik;
- keine Rollen außer Nutzungsrechtsinhaber;
- kein Party-Merge, kein physisches Löschen, keine Anonymisierung;
- keine Telefonnummern, E-Mail-Adressen oder zusätzlichen Personendaten;
- keine Gebühren, Bescheide, Formulare, Dokumente oder Versandlogik;
- keine Winyard-, LDAP-, Kalender- oder Mailintegration;
- kein EDWALT-Import, EDWALT-Mapping oder Zugriff auf EDWALT-Originale;
- keine echten Verwaltungsdaten und keine produktive Aktivierung.

## Abschlussprüfungen

Nach Implementierung vollständig ausführen:

1. Release-Build mit null Warnungen und null Fehlern.
2. Gesamte Unit- und reguläre Integrationstestsuite.
3. `.NET format --verify-no-changes --no-restore`.
4. `npm ci`, Frontendtests, Lint und Produktionsbuild.
5. Reale SQL-Suite mit ausschließlich prozesslokalem Secret.
6. Vor und nach SQL `sys.databases` prüfen; null Restdatenbanken.
7. Markdown-Links und Tabellen prüfen.
8. Secretprüfung ohne Ausgabe gefundener Werte.
9. `git diff --check`.
10. Vollständigen finalen Branch-, HEAD-, Upstream-, Ahead/Behind-, Status-,
    Index-, Arbeitsbaum- und Untracked-Inhalt prüfen.
11. Sicherstellen, dass außerhalb Repository und SQL-Testdatenbanken nichts
    verändert wurde und kein Commit entstand.

## Abnahmekriterien

5b ist technisch erst abgeschlossen, wenn alle bestätigten Anforderungen des
5a-Dokuments für den gewählten Umfang umgesetzt, beide Provider sichtbar
gleich, Altverträge kompatibel, alle Migrationen additiv, reale SQL-Rennen und
Rollbacks geprüft sowie sämtliche Abschlussprüfungen grün sind.

Auch dann sind keine fachliche Verwaltungsabnahme, Rechtsprüfung,
Datenschutzfreigabe, Betriebsfreigabe oder Produktivfreigabe behauptet.
