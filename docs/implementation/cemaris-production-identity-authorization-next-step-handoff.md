# Übergabe: Lokale Konten und serverseitige Autorisierungsgrundlage

Stand: 13.08.2026

## Ziel des nächsten Inkrements

Implementiere Inkrement 3b Ende zu Ende: persistierte lokale Cemaris-Konten,
sichere Anmeldung und Sitzung, serverseitige Autorisierung aller vorhandenen
Fachoperationen, authentifizierte Änderungszuordnung sowie eine ausschließlich
für `Administration` verfügbare Benutzerverwaltung. React-UI, API,
Application, Infrastructure, EF-Migration, Unit-, API- und echte SQL-Tests
gehören zum selben abgenommenen Inkrement.

Dies ist eine technische Identitäts- und Berechtigungsgrundlage, noch keine
umfassende Produktiv-, Datenschutz-, Betriebs- oder Fachfreigabe. Der
Fallakten-Schreibpfad bleibt bis zu diesen späteren Gates standardmäßig
deaktiviert, Development-only und auf synthetische Daten begrenzt.

## Verbindliche Arbeitsumgebung

- Repository: `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`
- ausschließliches .NET SDK:
  `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
- lokale SQL-Instanz: `localhost\CEMARISDEV`
- SQL-Tests ausschließlich über temporäre Datenbanken mit eindeutigem Präfix
  `Cemaris_IntegrationTests_`
- Development-Testverbindung ausschließlich prozesslokal und ohne Ausgabe von
  Secrets:
  `<prozesslokal bereitgestellte Testverbindung>`

Keine bestehende Benutzer- oder Produktdatenbank verändern oder löschen. Vor
dem Löschen einer Testdatenbank Präfix und tatsächlich aufgelösten
Datenbanknamen prüfen. Nach dem Test nachweisen, dass keine temporäre
Testdatenbank verblieben ist. Keine Commits durchführen.

## Vor jeder Änderung

Prüfe und dokumentiere jeweils:

- Branch, HEAD und Upstream;
- `git status --short --branch`;
- vollständigen Arbeits- und Index-Diff;
- alle unversionierten Dateien und deren Inhalt.

Der Arbeitsbaum enthält absichtlich noch nicht committete Implementierungs-
und Dokumentationsänderungen aus Inkrement 3a und dieser Übergabe. Lies und
erhalte sie vollständig. Überschreibe oder verwerfe keine fremde Arbeit.

## Zuerst vollständig lesen

1. `README.md`
2. `SECURITY.md`
3. `docs/implementation/cemaris-case-change-attribution-completion.md`
4. `docs/implementation/README.md`
5. `docs/requirements/identity-authorization-audit-decisions.md`
6. `docs/architecture/authentication-authorization-audit.md`
7. `docs/decisions/ADR-0011-provider-neutral-actor-and-atomic-case-audit.md`
8. `docs/decisions/ADR-0012-local-accounts-and-role-boundaries.md`
9. diesen Arbeitsauftrag vollständig

Lies anschließend alle betroffenen Quell-, Konfigurations-, Migrations- und
Testdateien vollständig. Ermittle vor der Implementierung den Baseline-Build,
die regulären Tests, die SQL-Kategorie, `.NET format`, Frontendtests, Lint und
Produktionsbuild.

## Bestätigte Produktentscheidungen

### Identität

- Lokale Cemaris-Konten mit Benutzername und Passwort sind der Standard.
- Im nächsten Inkrement wird ausschließlich die lokale Variante umgesetzt.
- Ein späterer separater Inkrement darf Konten aus LDAP importieren oder
  synchronisieren. Jetzt keinen LDAP-Bind, keine LDAP-Anmeldung, keinen
  LDAP-Importcode und kein Attribut- oder Gruppenmapping implementieren.
- Jedes Konto besitzt eine servererzeugte stabile GUID. Benutzername und
  Anzeigename dürfen sich ändern, ohne historische Auditzuordnung zu
  verfälschen.
- Es gibt weiterhin exakt `Sachbearbeitung` und `Administration`.

### Rollenmatrix

| Funktionsgruppe | Sachbearbeitung | Administration |
| --- | --- | --- |
| Anmeldung, Abmeldung, eigenes Passwort | erlaubt | erlaubt |
| Suche und Falldetail | erlaubt | erlaubt |
| Fallanlage und alle vorhandenen Falländerungen | erlaubt | erlaubt |
| künftige fachliche Stammdatenpflege | erlaubt | erlaubt |
| Benutzerverwaltung | verweigert | erlaubt |
| künftige administrative Programmkonfiguration | verweigert | erlaubt |
| künftige Formularvorlagenverwaltung | verweigert | erlaubt |
| vollständige Auditdaten in API/UI | verweigert | verweigert |

Die Matrix erlaubt keine bisher unbekannten Lösch-, Storno-, Gebühren-,
Fristen- oder sonstigen Fachoperationen. Nicht existierende Stammdaten-,
Konfigurations- oder Formularmodule werden in diesem Inkrement nicht erfunden.
Für ihre spätere Implementierung sind bereits aussagekräftige Policy-Namen
beziehungsweise die dokumentierte Zuordnung vorzusehen.

### Audit und Logs

- Der atomare `CaseChanges`-Nachweis aus Inkrement 3a bleibt erhalten.
- Erfolgreiche Fachänderungen verwenden den serverseitig authentifizierten
  lokalen Benutzer als `ICurrentActorProvider`-Akteur.
- Vollständige Auditdaten erhalten weder Endpunkt noch UI, auch nicht für
  `Administration`.
- Strukturierte Sicherheitslogs umfassen mindestens erfolgreiche und
  fehlgeschlagene Anmeldung, Abmeldung, Kontoanlage, Rollen-/Namensänderung,
  Sperrung/Aktivierung und Passwortzurücksetzung.
- Niemals Passwörter, Passwort-Hashes, Sitzungscookies, CSRF-Token,
  Request-Bodies oder vollständige Verwaltungsdaten loggen.
- Logzugriff ist ein externer Betriebszugriff. Die Cemaris-Rolle
  `Administration` eröffnet keinen API- oder UI-Logzugriff.

## Technischer Ausgangszustand

- `ICurrentActorProvider`, `ActorIdentity`, `SystemRole` und der feste
  `SyntheticDevelopmentActorProvider` sind vorhanden.
- `CaseWriteService` kennt weder `HttpContext` noch Claims oder EF Core.
- Fachänderung, Fallversion, letzte Zuordnung und `CaseChanges`-Datensatz sind
  im synthetischen und SQL-Store atomar.
- Die API besteht aus Minimal APIs in `src/Cemaris.Api/Program.cs`.
- `GET /api/search`, `GET /api/cases/{id}` und sechs optionale
  Fall-Schreibendpunkte sind vorhanden.
- `Features:CaseEditingEnabled` ist standardmäßig `false` und außerhalb von
  Development unzulässig.
- Das Frontend ist eine schlanke React-/TypeScript-Anwendung ohne Router- oder
  Authbibliothek.
- Das SQL-Schema liegt im bestehenden `CemarisDbContext`; Migrationen werden
  regulär mit EF Core erzeugt und nicht handgeschrieben.

## Verbindliche Implementierungsanforderungen

### 1. Kontomodell und Persistenz

- Ergänze ein minimales lokales Kontomodell mit GUID, Benutzername,
  normalisiertem eindeutigem Benutzernamen, Anzeigename, exakt einer
  `SystemRole`, Passwort-Hash, Aktivstatus, Sperr-/Fehlversuchsdaten,
  sicherheitsrelevanten UTC-Zeitpunkten und einer Nebenläufigkeitskontrolle.
- Verwende etablierte ASP.NET-Core-Identity-Komponenten wie
  `IPasswordHasher<TUser>` beziehungsweise die passenden frameworkeigenen
  Manager. Keine eigene Kryptografie, kein Klartextpasswort und kein
  reversibles Passwortformat.
- Verifiziere Hashes frameworkkonform und aktualisiere sie bei
  `SuccessRehashNeeded`.
- Benutzername wird leerraumgetrimmt, längenbegrenzt und
  groß-/kleinschreibungsunabhängig eindeutig behandelt. Anzeigename und Rolle
  werden serverseitig validiert. Unbekannte Rollen werden abgewiesen.
- Konten werden nicht physisch gelöscht. Deaktivierung beendet ihre
  Nutzbarkeit; historische Auditnamen und IDs bleiben unverändert.
- Erzeuge eine reguläre additive EF-Core-Migration samt ModelSnapshot. Die
  bisherigen Fall- und Auditdaten müssen unverändert migrierbar bleiben.

### 2. Passwort- und Kontenlebenszyklus

- Technischer Mindeststandard: 12 bis 128 Zeichen, keine willkürlichen
  Zeichenklassenregeln, keine Kürzung und keine Passwortausgabe in Logs oder
  Responses. Werte müssen konfigurierbar sein, sichere Defaults dürfen nicht
  durch fehlende Konfiguration abgeschwächt werden.
- Nach fünf fehlgeschlagenen Anmeldungen Konto für 15 Minuten sperren;
  erfolgreiche Anmeldung setzt den Zähler zurück. Antworten dürfen nicht
  verraten, ob Benutzername, Passwort, Sperrung oder Deaktivierung die Ursache
  war.
- Biete angemeldeten Benutzern einen Passwortwechsel mit Prüfung des alten
  Passworts.
- Administration darf Passwörter zurücksetzen, aber niemals bestehende
  Passwörter oder Hashes lesen. Ein zurückgesetztes temporäres Passwort muss
  beim nächsten Login geändert werden, bevor Fachfunktionen erreichbar sind.
- Verhindere atomar, dass der letzte aktive Administrator deaktiviert oder zu
  `Sachbearbeitung` herabgestuft wird. Verhindere ungewollte
  Selbstdeaktivierung in derselben Weise.
- Implementiere einen nicht HTTP-basierten, expliziten Bootstrap für den
  ersten Administrator. Er darf nur laufen, wenn noch kein Konto existiert,
  muss erwarteten Datenbanknamen und SQL-Provider prüfen und darf kein
  Defaultpasswort liefern oder ein Secret loggen. Für Development User Secrets
  und für Betrieb einen externen Secret Store dokumentieren.

### 3. Sitzung, Cookies und CSRF

- Verwende ASP.NET-Core-Cookie-Authentifizierung für die Browseranwendung;
  keine Tokens in `localStorage` oder `sessionStorage`.
- Cookie mindestens `HttpOnly`, `SameSite=Lax`, begrenzte Lebensdauer,
  serverseitige Validierung des weiterhin aktiven Kontos und außerhalb von
  Development immer `Secure`.
- Verwende eine konfigurierbare Inaktivitätsdauer mit sicherem Default von 30
  Minuten. Rollen-, Passwort- und Aktivstatusänderungen müssen bestehende
  Sitzungen spätestens bei der nächsten serverseitigen Validierung unwirksam
  machen; nutze dafür einen Security-/Session-Stamp oder gleichwertigen
  Mechanismus.
- Schütze jeden zustandsändernden Cookie-Endpunkt einschließlich Login,
  Logout, Passwortwechsel, Benutzerverwaltung und Fallmutationen gegen CSRF
  mit dem ASP.NET-Core-Antiforgery-Mechanismus. Keine Referer-only-Lösung.
- Passe den Development-CORS-/Fetch-Vertrag nur soweit nötig an: explizite
  Origins, Credentials statt Wildcard, keine unsichere Produktionsfreigabe.

### 4. API-Vertrag

Implementiere mindestens:

- Login;
- Logout;
- aktuelles Konto/„Wer bin ich“ mit ID, Benutzername, Anzeigename und Rolle;
- eigenes Passwort ändern;
- Administration: Konten auflisten, anlegen, Anzeigename/Rolle ändern,
  aktivieren/deaktivieren und Passwort zurücksetzen.

Nutze datensparsame DTOs. Passwort-Hashes, Lockout-Interna, Security-Stamps und
andere Secrets erscheinen nie in API oder OpenAPI. Loginfehler sind generisch.
Rate-Limiting für den Login ist zusätzlich zur Kontosperre zu verwenden, ohne
den Health Check zu beeinträchtigen.

`/health` bleibt anonym und nicht sensitiv. `/api/system/info` darf für die
Loginseite anonym bleiben. Alle Falllese- und Fall-Schreibendpunkte benötigen
eine benannte Fachpolicy. Benutzerverwaltungsendpunkte benötigen eine
Administration-only-Policy. `401` und `403` müssen als API-Statuscodes ohne
HTML-Redirect zurückgegeben und in OpenAPI dokumentiert werden.

### 5. Current Actor und atomarer Auditvertrag

- Implementiere einen HTTP-/Claims-Adapter hinter `ICurrentActorProvider`, der
  ausschließlich die serverseitig ausgestellte und validierte Sitzung liest.
- Validiere stabile GUID, Anzeigename und exakt eine bekannte Rolle. Fehlende
  oder ungültige Claims dürfen niemals auf den synthetischen Akteur
  zurückfallen.
- Der `CaseWriteService` bleibt providerneutral. Erfolgreiche Mutationen
  schreiben lokale Benutzer-ID und damaligen Anzeigenamen atomar in
  `CaseChanges` und `lastChange`.
- Identitätsheader eines Clients bleiben wirkungslos.
- Der synthetische Provider ist ausschließlich in expliziten
  Development-/Testkonfigurationen erlaubt und darf in keiner produktionsnahen
  Konfiguration eine Authentifizierung umgehen.

### 6. Frontend

- Ergänze eine zugängliche deutsche Loginseite, Authzustand, Lade-/Fehlerfälle
  und Logout.
- Nicht angemeldete Benutzer werden zu Login geführt; ein `401` während der
  Nutzung setzt den Authzustand zurück. `403` zeigt eine verständliche
  Berechtigungsablehnung ohne Datenverlust in Formularen.
- Zeige angemeldeten Anzeigenamen und Rolle in der Oberfläche.
- Ergänze eigenen Passwortwechsel.
- Ergänze für `Administration` eine Benutzerverwaltung für die genannten
  Operationen. `Sachbearbeitung` sieht keine Navigation dorthin; der
  serverseitige `403` bleibt der maßgebliche Schutz.
- Sende Cookies und Antiforgery-Token korrekt mit zustandsändernden Requests.
- Erhalte bestehende Suche, Detail-, Bearbeitungs-, ETag- und
  `lastChange`-Funktionen sowie Barrierearmut und responsive Darstellung.
- Keine UI für Auditdaten, Betreiberlogs, Programmkonfiguration oder
  Formularvorlagen anlegen.

### 7. Sicherheitslogging

- Verwende quellgenerierte strukturierte `LoggerMessage`-Definitionen mit
  stabilen Event-IDs.
- Logge erfolgreiche Anmeldung nur mit stabiler Konto-ID, nicht mit Passwort
  oder Cookie. Fehlgeschlagene Anmeldung darf keine Benutzerenumeration in
  Response oder über unnötig detaillierte Logfelder ermöglichen.
- Administrative Kontenänderungen loggen Akteur-ID, Zielkonto-ID, Operation
  und Erfolg/Fehlerklasse, aber keine sensitiven Inhaltswerte.
- Keine Audit- oder Log-Lese-API und keine entsprechende UI ergänzen.

## Tests und Verifikation

### Unit-Tests

- Normalisierung und Eindeutigkeit von Benutzernamen;
- exakt zwei Rollen und Policy-Matrix;
- Passwortregeln, Framework-Hashverifikation und Rehash;
- Fehlversuche, Sperrdauer, Reset und erneute Freigabe;
- deaktivierte Konten, erzwungener Passwortwechsel, Security-Stamp;
- Schutz des letzten aktiven Administrators;
- Claims-zu-`ActorIdentity` einschließlich ungültiger Claims.

### API-/Integrationstests ohne reale Benutzer- oder Verwaltungsdaten

- anonymer Zugriff auf Fachendpunkte ergibt `401`, nicht Redirect;
- beide Rollen dürfen Suche, Detail und jede der sechs Mutationen;
- `Sachbearbeitung` erhält für jede Benutzerverwaltungsoperation `403`;
- `Administration` kann Konto anlegen, ändern, sperren und Passwort
  zurücksetzen;
- Login, Logout, eigenes Passwort, generische Fehler und Lockout;
- CSRF fehlt/ist falsch/ist korrekt für alle relevanten Mutationen;
- Deaktivierung, Rollen- und Passwortänderung entwerten bestehende Sitzungen;
- letzter aktiver Administrator bleibt geschützt, auch bei Parallelität;
- Client-Identitätsheader ändern weder Sitzung noch Auditakteur;
- abgelehnte Requests verändern keine Fachwerte, Fallversionen oder
  Auditanzahl;
- erfolgreiche Mutation enthält lokale stabile Konto-ID und historischen
  Anzeigenamen in Audit und `lastChange`;
- OpenAPI enthält Auth-, `401`-, `403`- und CSRF-relevanten Vertrag, aber keine
  geheimen Felder;
- Securitylogs werden über einen Testlogger auf Event-ID und Datenminimierung
  geprüft.

### SQL-Tests auf `CEMARISDEV`

- reguläre additive Migration von der bisherigen letzten Migration;
- Kontoanlage, normalisierte Eindeutigkeit und Nebenläufigkeit;
- Sperrung, Administrationserhalt und Sitzungsentwertung;
- authentifizierter vollständiger Fall-Schreibablauf mit richtigem Auditakteur;
- Rollback-/Parallelitätstests aus Inkrement 3a bleiben grün;
- temporäre Datenbank wird sicher entfernt und anschließend über
  `sys.databases` als nicht mehr vorhanden nachgewiesen.

Erzeuge zusätzlich ein idempotentes EF-Migrationsskript außerhalb des
Repositories, plausibilisiere Tabellen, Constraints, Indizes und
Migrationsreihenfolge und entferne das Skript anschließend.

## Schutzgrenzen

- Keine echten Personen-, Grab-, Adress-, Benutzer- oder Verwaltungsdaten in
  Entwicklung, Tests, Logs, Screenshots oder Dokumentation.
- Keine Passwörter, Hashes, Verbindungsstrings, Cookies, Token oder sonstige
  Secrets ausgeben oder versionieren.
- Keine vorhandene Benutzer- oder Produktdatenbank verändern oder löschen.
- Keine LDAP-Implementierung, kein LDAP-Schema und kein Mapping in diesem
  Inkrement.
- Kein EDWALT-Importcode, kein EDWALT-Mapping und kein Zugriff auf
  EDWALT-Originale oder externe Phase-2-/3-/4-Arbeitsbereiche; keine
  Phase-5-Wurzel anlegen.
- Keine Stammdaten-, Konfigurations-, Formular-, Lösch-, Gebühren-, Fristen-
  oder sonstigen Fachfunktionen durch Vermutung ergänzen.
- Keine Auditansicht oder Logansicht im Programm implementieren.
- `Features:CaseEditingEnabled` nicht als produktiven Zugriffsschutz ausgeben
  und die Development-/Synthetikgrenze nicht ohne eigenes Freigabegate
  entfernen.
- Keine Commits durchführen.

## Dokumentationsergebnisse

- Architektur und README mit dem tatsächlich implementierten lokalen
  Konten-/Sitzungsmodell aktualisieren;
- Sicherheitsparameter, Bootstrap, lokale Einrichtung und Betreibergrenzen
  ohne Secrets dokumentieren;
- reguläre neue ADRs nur für tatsächlich getroffene technische Entscheidungen
  ergänzen;
- Abschlussdokument mit Migration, Tests, SQL-Nachweis, offenen Betriebs- und
  Datenschutzgates erstellen;
- Implementierungsplan aktualisieren und eine neue kontextlose Folgeübergabe
  für Inkrement 4 erstellen, ohne unbekannte Friedhofsfachregeln zu erfinden;
- interne Markdown-Links und Tabellen prüfen.

## Abnahmekriterien

Der Auftrag ist erst abgeschlossen, wenn:

- lokale Konten und sichere Sitzungen Ende zu Ende funktionieren;
- beide Rollen alle vorhandenen Fachfunktionen ausführen können;
- nur `Administration` Benutzer verwalten kann;
- Audit und Logs keine Anwendungs-Leseoberfläche besitzen;
- der authentifizierte lokale Benutzer atomar als Änderungsakteur gespeichert
  wird;
- Fehlversuche, CSRF, Sperrung, Deaktivierung, Rollenänderung und Parallelität
  sicher und teilwirkungsfrei getestet sind;
- Migration und vollständiger Ablauf auf einer temporären Datenbank in
  `CEMARISDEV` erfolgreich waren und keine Testdatenbank verblieben ist;
- Release-Build 0 Warnungen und 0 Fehler meldet;
- Unit-, reguläre Integrations- und separate SQL-Tests bestanden sind;
- `.NET format --verify-no-changes`, Frontendtests, Lint und Produktionsbuild
  erfolgreich sind;
- `git diff --check`, Dokumentationslinks, Tabellen, vollständiger Diff,
  Index-Diff und unversionierte Dateien abschließend geprüft wurden;
- keine umfassende Produktivfreigabe behauptet und kein Commit erstellt wurde.
