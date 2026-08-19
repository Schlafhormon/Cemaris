# Ausführbare Folgeübergabe: Inkrement 5d – Bedienkorrekturen am 5b-Kern

Stand: 18.08.2026

## Auftrag

Implementiere den im
[5c-Abnahme- und Entscheidungsgate](cemaris-increment-5c-completion.md)
bestätigten kleinsten Folgeumfang für die Bedienbarkeit des vorhandenen
manuellen Beteiligten-/Nutzungsrechtskerns:

1. fallunabhängiger Einstieg für Beteiligten-Suche, -Detail und die bereits
   vorhandenen Pflegeoperationen;
2. ausreichend breite, containergeeignet responsive Formulare für
   Übertragung, Verlängerung und Faktenkorrektur;
3. konkrete Feldfehlermeldungen aus den vorhandenen Problem-Details direkt an
   den betroffenen Feldern;
4. unmissverständliche Erklärung der Trennung zwischen kanonischem Recht und
   nullable Altprojektion.

5d ist ein technisches Bedieninkrement. Es autorisiert keine neue Fachregel,
keine neue Datenhaltung und keine Erweiterung des Lebenszyklus.

## Verbindliche Arbeitsgrenzen

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Lokale Satzungsquelle, falls eine Fundstelle nachgelesen werden muss,
ausschließlich lesend:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`

Keine EDWALT-Originale, externen Phase-2-/3-/4-Arbeitsbereiche oder
Phase-5-Wurzel öffnen oder anlegen. Repository-interne EDWALT-Dokumente sind
nur gekennzeichnete Altverfahrensevidenz. Keine echten Personen-, Grab-,
Rechte- oder Verwaltungsdaten verwenden. Keine Commits ausführen.

## Erwarteter Repository-Ausgangsstand

Beim Aktualisieren dieser Übergabe war der verbindliche Stand:

- Branch `main`;
- HEAD `9c728d7e0cd6a55faf4adb804831d28f36d3ac42`;
- Upstream `origin/main`;
- Ahead/Behind `0/0`;
- leerer Index;
- sieben geänderte versionierte Markdown-Dateien aus 5c:
  `README.md`, die vier Dokumentationsindizes,
  `docs/architecture/person-usage-rights-deadlines.md` und
  `docs/requirements/person-usage-rights-deadlines-decisions.md`;
- zwei unversionierte, verbindlich zu erhaltende 5c-Dokumente:
  `docs/implementation/cemaris-increment-5c-completion.md` und diese
  5d-Folgeübergabe.

Unter dem ignorierten Pfad `tmp/pagination-build` lag bereits vor 5c ein
fremder Bestand mit 890 Dateien. Diesen Bestand weder bereinigen noch als
5d-Arbeit ausgeben. Falls der Benutzer die 5c-Dokumentation vor Beginn bereits
committed hat oder der Git-Stand anderweitig abweicht, die Abweichung
vollständig untersuchen. Nicht auf den genannten Hash zurücksetzen und keine
vorhandene Arbeit verwerfen.

## Git-Sicherheit

Vor der ersten und vor jeder logisch getrennten Änderung vollständig prüfen:

- Branch und HEAD;
- Upstream und Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts.

Vorhandene Arbeit vollständig lesen und erhalten. Nichts verwerfen,
überschreiben, stagen, committen oder auf einen früheren Hash zurücksetzen.

## Pflichtlektüre

Vor Implementierung vollständig lesen:

1. `docs/implementation/cemaris-increment-5c-completion.md`;
2. `docs/implementation/cemaris-increment-5b-completion.md`;
3. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
4. `docs/architecture/person-usage-rights-deadlines.md`;
5. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
6. `docs/implementation/cemaris-increment-5b-next-step-handoff.md`;
7. Root-README und alle vier Dokumentationsindizes;
8. die vollständigen aktuellen React-Komponenten, API-Adapter,
   Problem-Details-Verträge sowie Frontend- und Integrationstests für
   Beteiligte und Nutzungsrechte.

## Technische Dateilandkarte

Vor einer Änderung mindestens diese konkreten Stellen vollständig lesen:

- `src/Cemaris.Web/src/App.tsx`: einfache pfadbasierte Routen und
  Capability-Grenzen;
- `src/Cemaris.Web/src/layouts/AppLayout.tsx`: gruppierte Navigation und
  aktive Zustände;
- `src/Cemaris.Web/src/components/PersonUsageRightsPanel.tsx`: derzeit
  gekoppelte Beteiligten-/Rechteoberfläche, Formzustände und ETag-Behandlung;
- `src/Cemaris.Web/src/api/cemarisApi.ts`: vorhandene Adapter
  `searchParties`, `getParty`, `createParty`, `correctParty`,
  `addPartyAddress` und `correctPartyAddress` sowie `ApiError.fieldErrors`;
- `src/Cemaris.Web/src/types/personUsageRights.ts`: bestehende
  Beteiligten-, Revisions- und ETag-Typen;
- `src/Cemaris.Web/src/pages/CaseDetailsPage.tsx`: Einbindung des kanonischen
  Panels und Wortlaut der nullable Altprojektionen;
- `src/Cemaris.Web/src/App.css`: insbesondere `usage-right-layout`,
  `right-actions`, `compact-form-grid` und bestehende Breakpoints;
- `src/Cemaris.Web/src/App.test.tsx` und
  `src/Cemaris.Web/src/components/PersonUsageRightsPanel.test.tsx`:
  bestehende Routing-, Capability- und Konflikttests;
- `src/Cemaris.Api/PersonUsageRightEndpoints.cs` und
  `tests/Cemaris.IntegrationTests/PersonUsageRightsEndpointTests.cs` nur als
  Vertragsnachweis. Änderungen dort sind für 5d nicht erwartet.

Neue Seiten und Komponenten gehören ausschließlich unter
`src/Cemaris.Web/src/pages` beziehungsweise
`src/Cemaris.Web/src/components`; Tests liegen direkt bei der jeweils
geprüften React-Datei. Vorhandene Party-Formulare und Fehlerlogik nach
Möglichkeit in wiederverwendbare Komponenten zerlegen. Keine zweite, fachlich
abweichende Implementierung derselben Mutation erzeugen.

## Unveränderliche 5b-Grenzen

- Beteiligte bleiben fallübergreifend stabile natürliche Personen oder
  Organisationen.
- Ein Recht bleibt an genau eine kanonische Grabstelle gebunden.
- Jedes 5b-Recht bleibt unabhängig vom Datum technisch offen.
- Je Grabstelle existiert weiterhin höchstens ein 5b-Recht.
- Übertragung, Verlängerung und Faktenkorrektur behalten Identität,
  Historisierung, Atomarität und starke ETags.
- Startregel-Snapshots bleiben rückwirkungsfrei.
- Nullable Altprojektionen werden nicht migriert, zusammengeführt oder
  fachlich rückinterpretiert.

## Konkreter Umsetzungsumfang

### Fallunabhängige Beteiligtenoberfläche

Ergänze die Route `/parties` und einen gut auffindbaren Navigationspunkt
`Beteiligte`. Navigation und Seite sind bei aktiver
`Features:PersonUsageRightsEditingEnabled`-Capability für `Sachbearbeitung`
und `Administration` verfügbar. Bei deaktivierter Capability fehlt der
Navigationspunkt; ein direkter Aufruf zeigt denselben klaren
Nicht-verfügbar-Zustand wie andere Capability-gebundene Seiten.

Die Seite nutzt ausschließlich die vorhandenen Party-Endpunkte und ermöglicht
mindestens:

- Suche nach vorhandenen Identitäten;
- Detailanzeige von Art, Name, Anschriften und Revisionen;
- Anlage natürlicher Personen und Organisationen einschließlich bestehender
  Dublettenbestätigung;
- die bereits freigegebenen Namens-, Anschriften- und
  Adresskorrekturoperationen.

Die Seite darf keinen Fallbezug erfinden. Auswahl eines Beteiligten für ein
konkretes Nutzungsrecht bleibt im Rechtebereich der Fall-/Grabstellendetailseite.
Die bestehende Beteiligtenfunktion im kanonischen Rechtebereich bleibt
erhalten und verwendet nach einem Refactoring dieselben Komponenten und
Mutationsadapter wie `/parties`.
Keine neue serverseitige Suche, Pagination oder Mutation ergänzen, sofern die
vorhandenen Verträge den bestätigten Ablauf tragen.

### Responsive Rechteaktionen

Die Formulare für Übertragung, Verlängerung und Faktenkorrektur müssen sich am
tatsächlich verfügbaren Container orientieren. Vermeide drei gleichzeitig
geöffnete innere Mehrspaltenraster. Anforderungen:

- keine abgeschnittenen Labels oder Eingabewerte;
- sinnvolle Mindestbreiten und frühzeitiger einspaltiger Umbruch;
- Bedienbarkeit bei schmalem Desktop-Inhaltsbereich und etwa 375 Pixel
  Viewportbreite;
- bestehende Tastatur- und Fokusreihenfolge erhalten.

### Feldfehler und Fokus

Verwende die vorhandenen `ApiError.fieldErrors`, ohne den API-Vertrag zu
ändern. Zeige insbesondere Fehler für `validFromInclusive`, `newEndDate`,
`reason`, `startDate`, `endDate`, `sourceReference` und `reference` am
zugehörigen Feld oder mit klarer Zuordnung. Der allgemeine Hinweis bleibt als
Zusammenfassung erhalten. Fokus muss nach einem Fehler nachvollziehbar zur
Meldung oder zum ersten fehlerhaften Feld wechseln. Eingaben bleiben erhalten.
Feldnamen werden zentral und deterministisch den sichtbaren Formularfeldern
zugeordnet; unbekannte Serverfelder bleiben in der Zusammenfassung sichtbar.
Bei einem Party-ETag-Konflikt lädt eine angebotene Aktualisierung die
ausgewählte Party, bei einem Rechtekonflikt das betroffene Recht. Keine
Neuladeaktion darf versehentlich das andere Aggregat aktualisieren.

### Altprojektionshinweis

Die bestehende Altprojektion bleibt vollständig kompatibel. Ihr Leerzustand
muss ausdrücklich sagen, dass nur in der vorläufigen Altprojektion kein
Eintrag vorhanden ist und ein kanonisches Recht separat darüber angezeigt
werden kann. Keine Daten zusammenführen und kein bestehendes JSON-Feld
umdeuten.

## Architektur- und Persistenzgrenze

5d verwendet die vorhandenen Aggregate, Stores und Endpunkte. Erwartet sind
keine Änderungen an Domainregeln, Application-Ports, Persistenzentitäten,
EF-Modell, Migrationen oder OpenAPI-Verträgen. Sollte für den bestätigten
Bedienablauf wider Erwarten eine solche Änderung nötig erscheinen, Arbeit
stoppen, den Bedarf reproduzierbar dokumentieren und vor Erweiterung des
Umfangs nachfragen.

Historisierung, Atomarität, ETag und Audit dürfen weder abgeschwächt noch
dupliziert werden. Eine reine Navigation oder Leseansicht erzeugt keinen
Auditdatensatz.

## Tests

Mindestens ergänzen beziehungsweise aktualisieren:

- Frontendtest für fallunabhängige Beteiligten-Suche, -Detail und -Anlage;
- Routing-, Navigations- und Direktaufruftest für `/parties` bei aktiver und
  deaktivierter Capability sowie für beide bestätigten Rollen;
- Dublettenabbruch und bestätigte Wiederholung auf der neuen Seite;
- Rollenverhalten für Sachbearbeitung und Administration;
- Namenskorrektur, Adressanlage und Adresskorrektur über die bereits
  vorhandenen Adapter mit fortgeschriebenem ETag;
- Feldfehlerzuordnung und Eingabeerhalt bei Validierungs- und ETag-Konflikt;
- Layoutprüfung über belastbare CSS-/Komponentenstruktur und manuelle
  Viewports; keine rein pixelgenauen Snapshotbehauptungen;
- Altprojektionswortlaut bei vorhandenem und fehlendem kanonischem Recht;
- Regression für Suche, Falldetail, Navigation und Pagination.

Bestehende Unit-, reguläre Integrations-, OpenAPI- und Frontendtests müssen
grün bleiben. Da 5d keine Persistenzänderung enthält, ist keine neue reale
SQL-Suite fachlich erforderlich; der vorhandene SQL-Nachweis darf nicht als
neu ausgeführt behauptet werden.

## Lokale Vorführungsgrenze

Zu Beginn waren die Ports `5050` und `5173` frei. Auf der ausschließlich
freigegebenen Instanz `localhost\CEMARISDEV` war unter dem Testpräfix nur
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3` vorhanden. Diese
Datenbank ausschließlich für die lokale synthetische Authentifizierung
verwenden und nicht löschen, migrieren oder inhaltlich auf Verdacht ändern.
Solange sie vorhanden ist, keine reale SQL-Suite starten. Verbindungswerte und
synthetische Zugangsdaten werden außerhalb des Repositorys bereitgestellt und
dürfen nur prozesslokal gesetzt sowie niemals ausgegeben oder in Dateien und
Logs geschrieben werden.

Für die manuelle Vorführung API und Frontend kontrolliert mit Synthetic und
allen vier Development-Capabilities starten:

- `Features:CaseEditingEnabled`;
- `Features:CemeteryMasterDataEditingEnabled`;
- `Features:BurialProcessEditingEnabled`;
- `Features:PersonUsageRightsEditingEnabled`.

Gesundheit, Frontend-Proxy und Systeminformation prüfen. Dem Benutzer lokale
URLs, die extern bereitgestellten synthetischen Konten und einen gegliederten
Testablauf nennen. Interaktiv bis zu seiner Rückmeldung weiterarbeiten und
beide Prozesse danach kontrolliert beenden, sofern nichts anderes verlangt
wird.

## Ausdrückliche Nicht-Ziele

- keine Rechtearten oder weiteren Personenrollen;
- keine Frist-, Dauer-, Satzungsstands- oder Statusberechnung;
- keine Beendigung, Rückgabe, Entziehung, Schließung oder Wiedervergabe;
- keine Wiedervorlage, Erinnerung oder Benachrichtigung;
- kein Party-Merge, keine Löschung, Sperrung oder Anonymisierung;
- keine Migration oder Zusammenführung der Altprojektionen;
- keine Gebühren, Bescheide, Dokumente oder externen Integrationen;
- keine echten Verwaltungsdaten und keine Produktivfreigabe.

## Manuelle Abnahme

Mit ausschließlich synthetischen Daten und getrennten Sitzungen für
`Sachbearbeitung` und `Administration` prüfen:

1. Beteiligte ohne vorheriges Öffnen einer Fallakte finden und pflegen;
2. natürliche Person und Organisation korrekt anlegen;
3. Dublette abbrechen und bewusst bestätigt wiederholen;
4. dieselbe Identität anschließend in einem Nutzungsrecht auswählen;
5. alle drei Rechteaktionen bei normalem und schmalem Inhaltsbereich bedienen;
6. konkrete ungültige Transfer- und Verlängerungsdaten am Feld verstehen;
7. ETag-Konflikt mit Eingabeerhalt behandeln;
8. kanonisches Recht und leere Altprojektion ohne Missverständnis unterscheiden;
9. Navigation, Tastatur, Fokus und 375-Pixel-Viewport prüfen.

Technische Defekte außerhalb dieses Umfangs dokumentieren und vor einer
Korrektur ausdrücklich nach einem Folgeauftrag fragen.

## Erwartete Dokumentation

Zum technischen Abschluss gehören:

- eine deutsche 5d-Abschlussdokumentation mit Änderungsumfang,
  Rückverfolgbarkeit zu `5C-F-01` bis `5C-F-04`, Tests und manuellen
  Beobachtungen;
- Aktualisierungen von Root-README sowie Requirements-, Architecture-,
  Decisions- und Implementation-Index nur soweit der neue Stand sie
  tatsächlich erfordert;
- Korrekturen an 5c-/5d-Dokumenten, falls die Implementierung eine dortige
  Tatsachenannahme widerlegt, ohne offene Fachregeln umzudeuten;
- eine ausführbare, kontextlose Folgeübergabe für den danach belegbar
  kleinsten sicheren Schritt oder ein ausdrückliches weiteres
  Entscheidungsgate.

Keine neue fachliche Entscheidung als bestätigt dokumentieren. Bleibt nach
5d kein sicherer Implementierungsumfang, muss die Folgeübergabe stattdessen
die benötigten Freigaben und Entscheidungsfragen präzise benennen.

## Abschlussprüfungen

1. Release-Build mit null Warnungen und null Fehlern.
2. Vollständige Unit- und reguläre Integrationstests ohne SQL-Kategorie.
3. `dotnet format --verify-no-changes --no-restore`.
4. `npm ci`, Frontendtests, Lint und Produktionsbuild.
5. `git diff --check`.
6. Markdown-Links, Tabellen und Whitespace.
7. Secretprüfung ohne Ausgabe gefundener Werte.
8. Vollständige finale Git-Prüfung einschließlich aller unversionierten
   Inhalte.
9. Nachweis, dass keine externen Arbeitsbereiche oder fremden Datenbanken
   verändert und kein Commit erstellt wurden.

## Freigabegrenze

5d ist erst technisch abgeschlossen, wenn alle vier bestätigten Bedienbefunde
reproduzierbar behoben und die Regressionen grün sind. Auch dann werden keine
fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe,
Betriebsfreigabe oder Produktivfreigabe behauptet.
