# Ausführbare Folgeübergabe: Inkrement 5e – CSRF-Sitzungswechsel stabilisieren

Stand: 19.08.2026

## Auftrag

Reproduziere und korrigiere als kleinsten sicheren Cemaris-Folgeschritt den
technischen Sitzungsfehler, bei dem der vor der Anmeldung abgerufene
Antiforgery-Nachweis nach erfolgreicher Anmeldung im Frontendadapter
weiterverwendet wird und die erste autorisierte Mutation deshalb mit HTTP 400
scheitern kann.

5e ist ausschließlich ein technisches Authentifizierungs-/Bedieninkrement.
Es autorisiert keine Fachregel, keine neue Mutation und keine Änderung der
Beteiligten-, Nutzungsrechts-, Fall-, Beisetzungs- oder Stammdatenmodelle.

## Verbindliche Arbeitsgrenzen

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Keine EDWALT-Originale, externen Phase-Arbeitsbereiche oder Phase-5-Wurzel
öffnen oder anlegen. Keine echten Konten oder Verwaltungsdaten verwenden.
Keine Commits ausführen.

## Erwarteter Repository-Ausgangsstand

Beim Erstellen dieser Übergabe war der verbindliche Stand:

- Branch `main`;
- HEAD `9c728d7e0cd6a55faf4adb804831d28f36d3ac42`;
- Upstream `origin/main`;
- Ahead/Behind `0/0`;
- leerer Index;
- uncommittierte, vollständig zu erhaltende 5c- und 5d-Dokumentations- und
  Frontendarbeit gemäß
  [5d-Abschluss](cemaris-increment-5d-completion.md);
- keine Backend-, Domain-, Persistenz- oder Migrationsänderung;
- vorbestehender ignorierter Fremdbestand `tmp/pagination-build` mit 890
  Dateien.

Der uncommittierte Eingang bestand beim letzten Prüflauf konkret aus diesen
geänderten versionierten Dateien:

- `README.md`;
- `docs/architecture/README.md`;
- `docs/architecture/person-usage-rights-deadlines.md`;
- `docs/decisions/README.md`;
- `docs/implementation/README.md`;
- `docs/requirements/README.md`;
- `docs/requirements/person-usage-rights-deadlines-decisions.md`;
- `src/Cemaris.Web/src/App.css`;
- `src/Cemaris.Web/src/App.test.tsx`;
- `src/Cemaris.Web/src/App.tsx`;
- `src/Cemaris.Web/src/components/PersonUsageRightsPanel.test.tsx`;
- `src/Cemaris.Web/src/components/PersonUsageRightsPanel.tsx`;
- `src/Cemaris.Web/src/layouts/AppLayout.tsx`;
- `src/Cemaris.Web/src/pages/CaseDetailsPage.tsx`.

Unversioniert und ebenfalls verbindlich zu erhalten waren:

- `docs/implementation/cemaris-increment-5c-completion.md`;
- `docs/implementation/cemaris-increment-5d-completion.md`;
- `docs/implementation/cemaris-increment-5d-next-step-handoff.md`;
- diese 5e-Folgeübergabe;
- `src/Cemaris.Web/src/components/FormErrorSummary.tsx`;
- `src/Cemaris.Web/src/components/PartyManagement.tsx`;
- `src/Cemaris.Web/src/components/PersonUsageRightsResponsive.test.tsx`;
- `src/Cemaris.Web/src/components/partyDisplayName.ts`;
- `src/Cemaris.Web/src/components/useFormFeedback.tsx`;
- `src/Cemaris.Web/src/pages/CaseDetailsPage.test.tsx`;
- `src/Cemaris.Web/src/pages/PartiesPage.test.tsx`;
- `src/Cemaris.Web/src/pages/PartiesPage.tsx`.

Der letzte vollständige 5d-Prüflauf ergab 0 Buildwarnungen und 0 Fehler,
32 bestandene Unit-Tests, 48 bestandene reguläre Integrationstests ohne
SQL-Kategorie sowie 25 bestandene Frontendtests in 7 Testdateien. Format,
Frontend-Lint, Produktionsbuild, Markdown-, Whitespace-, Secret- und
Git-Prüfung waren grün. Die Ports `5050` und `5173` waren anschließend frei.

Falls der Benutzer 5c/5d bereits committed hat oder der Stand anderweitig
abweicht, die Abweichung vollständig untersuchen. Nicht auf den genannten
Hash zurücksetzen. Keine vorhandene Arbeit verwerfen, überschreiben, stagen
oder committen.

## Git-Sicherheit

Vor der ersten und vor jeder logisch getrennten Änderung vollständig prüfen:

- Branch und HEAD;
- Upstream und Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts.

## Pflichtlektüre

Vor Implementierung vollständig lesen:

1. `docs/implementation/cemaris-increment-5d-completion.md`;
2. `docs/implementation/cemaris-increment-5d-next-step-handoff.md`;
3. `docs/implementation/cemaris-increment-5c-completion.md`;
4. `docs/architecture/authentication-authorization-audit.md`;
5. `docs/requirements/identity-authorization-audit-decisions.md`;
6. `docs/decisions/ADR-0013-local-cookie-session-and-security-stamp.md`;
7. `src/Cemaris.Web/src/api/cemarisApi.ts`;
8. `src/Cemaris.Web/src/auth/AuthContext.tsx`;
9. `src/Cemaris.Web/src/pages/LoginPage.tsx`;
10. `src/Cemaris.Web/src/App.test.tsx` und alle weiteren Frontendtests mit
    CSRF- oder Authentifizierungsbezug;
11. `tests/Cemaris.IntegrationTests/CookieIdentityEndpointTests.cs` und die
    verwendeten Testhilfen für Login und CSRF;
12. die Authentifizierungs-, Antiforgery- und Cookie-Konfiguration in
    `src/Cemaris.Api/Program.cs` nur als Vertragsnachweis;
13. Root-README und alle vier Dokumentationsindizes.

## Reproduzierter Ausgangsdefekt

Der Defekt wurde ausschließlich mit synthetischem Konto und prozesslokaler
Konfiguration reproduziert:

1. anonyme Sitzung öffnen;
2. `GET /api/auth/csrf` ausführen;
3. mit diesem Nachweis erfolgreich `POST /api/auth/login` ausführen;
4. ohne Seitenreload und ohne neuen CSRF-Abruf eine autorisierte Mutation
   über denselben Frontendadapter ausführen;
5. die Mutation kann wegen des noch zwischengespeicherten anonymen
   Nachweises mit HTTP 400 und fehlgeschlagener CSRF-Prüfung enden;
6. nach einem Seitenreload wird ein authentifizierter Nachweis abgerufen und
   dieselbe Mutation funktioniert.

Zugangsdaten, Token und Verbindungswerte niemals ausgeben oder in Dateien,
Logs oder Testartefakte schreiben.

## Technische Baseline vor der Implementierung

Vor jeder 5e-Codeänderung vollständig ausführen:

1. Release-Build von `Cemaris.sln` mit dem verbindlichen SDK;
2. vollständige Unit-Tests;
3. reguläre Integrationstests mit Filter `Category!=SqlServer`;
4. `dotnet format --verify-no-changes --no-restore`;
5. im Verzeichnis `src/Cemaris.Web` ein frisches `npm ci`;
6. vollständige Frontendtests, Frontend-Lint und Produktionsbuild;
7. `git diff --check`.

Die Ergebnisse mit Warnungs-, Fehler- und Testzahlen dokumentieren. Keine
reale SQL-Suite starten, solange die unten genannte manuelle Datenbank
vorhanden ist.

## Konkreter Untersuchungs- und Umsetzungsumfang

1. Den Ablauf zuerst mit einem deterministischen Frontendtest nachstellen.
   Der Test muss nach dem Login unmittelbar eine vorhandene Mutation über
   `sendJson` oder `sendVersioned` ausführen und zwei verschiedene
   `/api/auth/csrf`-Abrufe nachweisen.
2. Prüfen, bei welchen Identitätswechseln ein gecachter Antiforgery-Nachweis
   ungültig wird: mindestens erfolgreiche Anmeldung, Abmeldung und
   Passwortwechsel.
3. Den kleinsten clientseitigen Fix im vorhandenen Adapter umsetzen, sodass
   nach einem erfolgreichen Identitätswechsel die nächste Mutation einen
   frischen Nachweis bezieht.
4. Fehlgeschlagene Anmeldungen dürfen keinen authentifizierten Zustand
   vortäuschen; bestehendes 401-/403-Verhalten bleibt erhalten.
5. Keine Tokenwerte persistieren, protokollieren oder in Fehlermeldungen
   übernehmen.
6. Die erste Mutation direkt nach Anmeldung für Sachbearbeitung und
   Administration ohne Seitenreload manuell prüfen.
7. Mit einem regulären Integrationstest den bestehenden Serververtrag
   festhalten: der vor dem Login ausgegebene Nachweis wird nach dem
   Identitätswechsel abgewiesen, ein danach neu abgerufener Nachweis wird
   akzeptiert. Dieser Test darf keine Backendänderung vorwegnehmen.

Erwartet ist eine kleine Frontendänderung. Sollte eine Backend-, Cookie-,
API-/OpenAPI- oder Sicherheitsvertragsänderung erforderlich erscheinen, den
Bedarf reproduzierbar dokumentieren und vor der Änderung ausdrücklich einen
Folgeauftrag einholen.

## Tests

Mindestens ergänzen:

- erfolgreicher Login verwirft den zuvor gecachten anonymen CSRF-Nachweis;
- erste Mutation nach Login ruft einen neuen CSRF-Nachweis ab;
- serverseitiger Vertragsnachweis für alten und frischen Nachweis nach dem
  Login;
- Rollen Sachbearbeitung und Administration;
- fehlgeschlagener Login und bestehende 401-/403-Behandlung;
- Logout und Passwortwechsel gemäß tatsächlich nachgewiesener
  Tokenlebensdauer;
- Regression für `/parties`, Fallbearbeitung, Friedhofsstammdaten und
  Nutzungsrechtsmutationen.

Keine echten Zugangsdaten in Tests verwenden. Testwerte müssen eindeutig
synthetisch sein.

## Manuelle Vorführung

Die vorhandene ausschließlich synthetische manuelle Datenbank darf für die
lokale Authentifizierung verwendet, aber weder gelöscht noch migriert werden.
Sie liegt ausschließlich auf `localhost\CEMARISDEV` und heißt
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3`. Existenz und
tatsächlich aufgelösten Namen vor dem Start nur lesend über `sys.databases`
prüfen.

Sie enthält auf ausdrücklichen Benutzerauftrag aus 5d zwei Friedhöfe,
insgesamt je zwei Bereiche, Felder und Reihen, zwei Grabarten, vier
Zuordnungen und acht Grabstellen. Diese Stammdaten dürfen gelesen, aber in 5e
nicht weiter verändert werden. Keine weitere Datenbank verändern und keine
reale SQL-Suite starten, solange die manuelle Datenbank vorhanden ist.

API und Frontend kontrolliert mit Synthetic-Provider und ausschließlich
prozesslokaler Datenbankverbindung starten. Für den Regressionstest dürfen
die vier vorhandenen Development-Capabilities aktiviert werden:

- `Features:CaseEditingEnabled`;
- `Features:CemeteryMasterDataEditingEnabled`;
- `Features:BurialProcessEditingEnabled`;
- `Features:PersonUsageRightsEditingEnabled`.

Health, Frontend-Proxy und Systeminformation vor der Bedienprobe prüfen. Die
synthetischen Konten und die Verbindung werden außerhalb des Repositorys im
ausführenden Auftrag bereitgestellt. Ihre Werte niemals in Konsolenprotokolle,
Repository-Dateien oder Testartefakte übernehmen.

Mit beiden synthetischen Rollen getrennt prüfen:

1. neue Browsersitzung öffnen;
2. anmelden;
3. ohne Reload unmittelbar eine erlaubte synthetische Fallmutation im
   Prozessspeicher ausführen, vorzugsweise eine neue Fallakte mit einer
   vorhandenen freien synthetischen Grabstelle; keine Party- oder
   Stammdatenmutation als Nachweis verwenden;
4. Erfolg, Fokus, Eingabeerhalt und Fehlermeldung prüfen;
5. abmelden, erneut anmelden und den Ablauf wiederholen;
6. API und Frontend anschließend kontrolliert beenden.

## Ausdrückliche Nicht-Ziele

- keine neue fachliche Regel oder Rolle;
- keine Änderung von Domain, Application-Port, Persistenz, EF oder Migration;
- keine neue API-Mutation und kein geänderter JSON-Vertrag;
- keine Frist-, Status-, Beendigungs- oder Wiedervorlagenlogik;
- keine Beteiligten-, Rechte-, Fall- oder Stammdatenfunktion;
- keine Speicherung oder Protokollierung von Token, Passwörtern oder
  Verbindungswerten;
- keine echte Verwaltungs-, Rechts-, Datenschutz-, Betriebs- oder
  Produktivfreigabe.

## Abschluss und Dokumentation

Zum Abschluss gehören:

- deutsche 5e-Abschlussdokumentation mit Reproduktion, Ursache, Änderung und
  Tests;
- Aktualisierung der Dokumentationsindizes nur soweit tatsächlich nötig;
- vollständige Release-, Unit-, reguläre Integrations-, Format-, Frontend-,
  Lint-, Build-, Markdown-, Whitespace-, Secret- und Git-Prüfung;
- Nachweis, dass keine fremde Datenbank, kein externer Arbeitsbereich und der
  vorbestehende `tmp/pagination-build`-Bestand verändert wurden;
- kein Commit.

5e schließt ausschließlich den technischen Sitzungsdefekt. Die offenen
5C-Fach- und Freigabegates bleiben unverändert.
