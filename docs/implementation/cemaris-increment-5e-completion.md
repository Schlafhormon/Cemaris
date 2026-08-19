# Abschluss Inkrement 5e: CSRF-Sitzungswechsel stabilisieren

Stand: 19.08.2026

## Ergebnis

Inkrement 5e ist als isoliertes technisches Authentifizierungsinkrement
abgeschlossen. Der Frontendadapter verwirft den für die anonyme Identität
abgerufenen Antiforgery-Nachweis jetzt unmittelbar nach einer erfolgreichen
Anmeldung. Die erste nachfolgende Mutation ruft dadurch ohne Seitenreload
einen zur authentifizierten Identität passenden Nachweis ab.

Die Änderung betrifft ausschließlich den flüchtigen clientseitigen
CSRF-Cache. Cookie-Sitzung, Security-Stamp, Rollenpolicies, Antiforgery-
Konfiguration, Endpunkte, OpenAPI, Domain, Application, Persistenz und
Migrationen blieben unverändert. 5e bestätigt keine neue Fachregel und ist
keine fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe,
Betriebsfreigabe oder Produktivfreigabe.

## Verbindlicher Ausgangsstand

Der in der 5e-Übergabe erwartete uncommittierte 5c-/5d-Bestand war vor Beginn
bereits vollständig in einem lokalen Commit enthalten:

- Branch `main`;
- HEAD `744bf9bb7eb686e0728d4746594a039dfe214b1d`;
- Upstream `origin/main`;
- Ahead/Behind `1/0`;
- leerer Index und sauberer Arbeitsbaum;
- keine unversionierten Dateien;
- keine Backend-, Domain-, Persistenz- oder Migrationsänderung.

Der zusätzliche Commit enthielt exakt die in der
[5e-Übergabe](cemaris-increment-5e-next-step-handoff.md) angekündigte
5c-/5d-Dateiliste. Er wurde als vorhandene Nutzerarbeit vollständig erhalten.
Es wurde weder zurückgesetzt, gestaged noch committed.

Der vorbestehende ignorierte Fremdbestand unter `tmp/pagination-build`
umfasste vor und nach 5e 890 Dateien.

## Technische Baseline

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 48 von 48 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| vollständige Frontendtests | 25 von 25 in 7 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |

Wegen der vorhandenen freigegebenen manuellen Testdatenbank wurde keine reale
SQL-Suite gestartet.

## Reproduktion und Ursache

Der Defekt wurde vor der Korrektur als deterministischer Frontendtest
festgehalten:

1. `login` leert den bisherigen Adaptercache;
2. `sendJson` ruft für die anonyme Sitzung `/api/auth/csrf` auf;
3. derselbe Nachweis wird für den erfolgreichen Login verwendet;
4. der Server stellt anschließend das authentifizierte Sitzungscookie aus;
5. eine unmittelbar folgende Mutation verwendet ohne erneuten CSRF-Abruf den
   noch gecachten anonymen Nachweis.

Vor dem Fix scheiterten zehn der zwölf neuen Frontendfälle. Für beide Rollen
und alle vier repräsentativen Mutationsfamilien wurde nur ein statt zwei
CSRF-Abrufen beobachtet.

`src/Cemaris.Web/src/api/cemarisApi.ts` hält den Requestnachweis ausschließlich
flüchtig in der Modulvariablen `antiforgeryToken`. Nach erfolgreichem Login
blieb der anonyme Nachweis gespeichert. Der bestehende ASP.NET-Core-Vertrag
bindet ihn jedoch an die aktuelle Identität. Das neue Cookie-Ticket ändert
diese Identität; der zuvor ausgegebene Nachweis ist deshalb absichtlich nicht
mehr gültig. Ein Seitenreload maskierte den Adapterfehler durch
Neuinitialisierung der Modulvariable.

## Kleinster Fix und Tokenlebenszyklus

`login` speichert zunächst die erfolgreiche Kontoantwort, leert danach den
flüchtigen `antiforgeryToken`-Cache und gibt erst dann das Konto zurück.

| Ablauf | Cachewirkung |
| --- | --- |
| Login beginnt | bisherigen Nachweis verwerfen und anonymen Nachweis beziehen |
| Login erfolgreich | anonymen Login-Nachweis verwerfen; nächste Mutation bezieht authentifizierten Nachweis |
| Login fehlgeschlagen | kein authentifizierter Zustand; generische 401-Behandlung bleibt erhalten |
| Logout erfolgreich | vorhandener Adapterpfad verwirft den authentifizierten Nachweis |
| eigener Passwortwechsel erfolgreich | vorhandener Adapterpfad verwirft den Nachweis; Server beendet Sitzung |
| 403 | separates `cemaris-forbidden`-Ereignis; kein vorgetäuschter Identitätswechsel |

Es werden keine Nachweise persistiert, protokolliert oder in Fehlermeldungen
übernommen.

## Rückverfolgbarkeit

Die Änderung setzt
[ADR-0013](../decisions/ADR-0013-local-cookie-session-and-security-stamp.md)
unverändert um:

- Sitzung und CSRF-Nachweis bleiben rein cookie- beziehungsweise
  arbeitsspeichergebunden;
- kein Token wird in Web Storage gespeichert;
- jede zustandsändernde Anfrage verwendet weiterhin Cookie und
  `X-Cemaris-CSRF`;
- Login, Logout und Passwortwechsel behalten ihre serverseitige
  Antiforgery-Prüfung;
- Security-Stamp und serverseitige Sitzungsvalidierung bleiben unverändert.

Der Integrationstest belegt den bestehenden Serververtrag, statt ihn zu
ändern: Ein vor dem Login ausgegebener Nachweis wird nach dem
Identitätswechsel mit HTTP 400 abgewiesen; ein danach neu ausgegebener
Nachweis wird für dieselbe erlaubte Mutation akzeptiert.

## Ergänzte Tests

### Frontend

`src/Cemaris.Web/src/api/cemarisApi.test.ts` enthält zwölf deterministische
Adaptertests:

- unmittelbarer Login-zu-Mutation-Ablauf für `Sachbearbeitung` und
  `Administration`;
- je Rolle Regression für Beteiligte (`/api/parties`), Fallbearbeitung,
  Friedhofsstammdaten und Nutzungsrechtsmutationen;
- zwei unterschiedliche `/api/auth/csrf`-Abrufe für Login und erste Mutation;
- fehlgeschlagener Login sowie bestehende 401- und 403-Behandlung;
- Nachweiswechsel bei erfolgreichem Logout und eigenem Passwortwechsel.

### Integration

`CookieIdentityEndpointTests` enthält den neuen Theorie-Test
`AntiforgeryTokenIssuedBeforeLoginIsRejectedAfterIdentityChangeAndFreshTokenIsAccepted`.
Er läuft mit beiden Rollen und prüft den abgewiesenen alten sowie den
akzeptierten frischen Nachweis. Er verwendet ausschließlich Synthetic-Provider
und synthetische Konten. Backendproduktcode wurde nicht geändert.

## Manuelle Vorführung

Die freigegebene manuelle Testdatenbank wurde vor dem Start ausschließlich
lesend über `sys.databases` unter ihrem erwarteten Namen aufgelöst. API und
Frontend liefen kontrolliert mit Synthetic-Provider, prozesslokaler
Identitätsdatenbankzuordnung und allen vier Development-Capabilities.
Health, Frontend-Proxy und Systeminformation antworteten erfolgreich;
`productionReady` blieb `false`.

Die Projektverantwortung prüfte Administration und Sachbearbeitung in
getrennten Sitzungen. Je Rolle wurde ohne Seitenreload unmittelbar nach der
Anmeldung und erneut nach Abmeldung und Wiederanmeldung eine synthetische
Fallakte mit vorhandener freier Grabstelle angelegt. Die Fachmutation lag nur
im Prozessspeicher; Party- und Stammdaten wurden nicht verändert.

Rückmeldung am 19.08.2026: `Funktioniert alles.`

Damit sind für beide Rollen die erste Mutation nach Anmeldung und die erste
Mutation nach Abmeldung/Wiederanmeldung ohne CSRF-/HTTP-400-Fehler bestätigt.
Ein manueller Passwortwechsel unterblieb bewusst, damit die persistierten
synthetischen Konten unverändert bleiben; sein Tokenlebenszyklus ist
automatisiert abgedeckt.

API und Frontend wurden kontrolliert beendet. Die Ports `5050` und `5173`
sind frei. Die vier eigenen Laufzeitlogs enthielten keine Zugangsdaten oder
Verbindungswerte und wurden nach vollständiger Prüfung entfernt.

## Nicht-Ziele und offene Freigabegates

5e implementiert oder bestätigt ausdrücklich nicht:

- neue Rollen, Fachregeln oder API-Mutationen;
- Frist-, Status-, Beendigungs- oder Wiedervorlagenlogik;
- Änderungen an Beteiligten, Nutzungsrechten, Fällen, Beisetzungen oder
  Stammdaten;
- Domain-, Application-, Persistenz-, EF- oder Migrationsänderungen;
- einen geänderten Cookie-, Security-Stamp-, API-/OpenAPI- oder
  Sicherheitsvertrag;
- fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutz-, Betriebs- oder
  Produktivfreigabe.

`5C-01` und `5C-03` bis `5C-13` bleiben offen beziehungsweise
widersprüchlich. Aus 5e entsteht keine neue Fachentscheidung.

## Nächster sicherer Schritt

Der nächste sichere Schritt ist das rein dokumentarische
[5f-Nutzungsrechtslebenszyklus-Entscheidungsgate](cemaris-increment-5f-next-step-handoff.md).
Es muss den kleinsten fachlich, rechtlich und technisch belastbaren
Lebenszykluszuschnitt bestimmen oder feststellen, dass noch keine
Implementierung freigegeben werden kann.

Bis dahin darf keine Beendigungs-, Status-, Frist- oder
Wiedervorlagenlogik implementiert werden.

## Abschlussprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 50 von 50 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| vollständige Frontendtests | 37 von 37 in 8 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| Markdown-Links, Anker und Tabellen | 0 Befunde |
| Whitespace und Secretprüfung ohne Wertausgabe | 0 Befunde |

Zusätzlich wurde nachgewiesen:

- Index leer, nichts gestaged und kein Commit erstellt;
- keine externe Arbeitsfläche geöffnet oder verändert;
- keine reale SQL-Suite und keine Migration ausgeführt;
- keine fremde Datenbank und keine persistenten Fach- oder Stammdaten
  verändert;
- `tmp/pagination-build` enthält weiterhin 890 Dateien;
- eigene Laufzeitdateien entfernt und Vorführungsports freigegeben.

Diese Prüfungen belegen ausschließlich den technischen 5e-Abschluss.

