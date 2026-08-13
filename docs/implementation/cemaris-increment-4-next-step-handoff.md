# Übergabe: Inkrement 4a – Friedhofsstruktur und Grabstättenstammdaten

Stand: 13.08.2026

## Arbeitsauftrag

Implementiere Inkrement 4a Ende zu Ende: eine allgemein konfigurierbare
Friedhofsstruktur, frei pflegbare Grabarten, Grabstellen mit manuellem Status
und die kanonische Zuordnung vorhandener Fallakten zu einer Grabstelle.
Domain, Application, synthetischer Store, SQL-Server-Persistenz, additive
EF-Migration, API, React-Oberfläche, Unit-, API-, reale SQL- und Frontendtests
sowie Abschluss- und Folgeübergabedokumentation gehören zu demselben
abgenommenen Inkrement.

Implementiere **keinen vollständigen Beisetzungsprozess**. Dieser wurde als
Inkrement 4b abgetrennt, weil sein tatsächlicher Ablauf erst bei einer späteren
Vorstellung und Fachabnahme durch die Friedhofsverwaltung bestätigt werden
kann.

## Verbindliche Arbeitsverzeichnisse und Werkzeuge

- Repository:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`
- ausschließlich erlaubtes .NET SDK:
  `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
- lokale SQL-Instanz: `localhost\CEMARISDEV`
- Development-Testverbindung ausschließlich prozesslokal und ohne Ausgabe
  eines Secrets:
  `Server=localhost\CEMARISDEV;Database=master;Integrated Security=True;Encrypt=True;TrustServerCertificate=True`
- lokale Satzungsquelle, ausschließlich lesend:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`

Erzeuge keine neuen EDWALT-, Phasen- oder externen Arbeitsverzeichnisse. Greife
nicht auf EDWALT-Originale oder externe Phase-2-/3-/4-Arbeitsbereiche zu. Die
bereits im Repository dokumentierte EDWALT-Analyse darf als historische
Hinweissammlung gelesen werden, ist aber weder Sollprozess noch Zieldatenmodell.

## Vor jeder Änderung

Prüfe und dokumentiere vollständig:

1. Branch, HEAD und Upstream einschließlich Ahead/Behind;
2. `git status --short --branch`;
3. vollständigen Arbeits- und Index-Diff;
4. sämtliche unversionierten Dateien einschließlich ihres Inhalts.

Der Arbeitsbaum kann absichtlich noch nicht committete Produktcode-, Test- und
Dokumentationsänderungen enthalten. Lies und erhalte sie vollständig.
Überschreibe, verwerfe, stage oder committe keine fremde Arbeit. Führe keine
Commits durch.

## Verpflichtend vollständig zu lesen

Vor der Implementierung:

- `README.md`;
- `SECURITY.md`;
- `docs/implementation/README.md`;
- diese Übergabe;
- `docs/requirements/README.md`;
- `docs/requirements/cemetery-master-data-decisions.md`;
- `docs/requirements/case-record-write-decisions.md`;
- `docs/requirements/identity-authorization-audit-decisions.md`;
- `docs/architecture/authentication-authorization-audit.md`;
- `docs/decisions/ADR-0007-requirements-before-implementation.md`;
- `docs/decisions/ADR-0009-product-development-before-edwalt-import.md`;
- `docs/decisions/ADR-0010-canonical-provisional-case-store.md`;
- `docs/decisions/ADR-0011-provider-neutral-actor-and-atomic-case-audit.md`;
- `docs/decisions/ADR-0012-local-accounts-and-role-boundaries.md`;
- `docs/decisions/ADR-0013-local-cookie-session-and-security-stamp.md`;
- `docs/implementation/cemaris-local-identity-authorization-completion.md`.

Lies danach sämtliche betroffenen Quell-, Konfigurations-, Migrations- und
Testdateien vollständig. Prüfe insbesondere bestehende Fallprojektion,
synthetischen und EF-Store, ETag-/If-Match-Vertrag, Audittransaktion,
Authentifizierungs-/Policykonfiguration, Antiforgery-Filter, OpenAPI und die
React-Daten-/Formularflüsse.

Die lokale Friedhofssatzung 2023 ist vollständig zu lesen und bei PDF-Aufgaben
zusätzlich visuell zu prüfen. Ihre sieben lokalen Grabarten und dort genannten
Fristen sind **keine** allgemein einzubauenden Defaults. Die Gebührensatzung
dient höchstens zur Abgrenzung; Gebühren bleiben außerhalb dieses Inkrements.

## Baseline vor Implementierung

Führe vor Änderungen mindestens aus:

- Release-Build der Solution;
- Unit-Tests;
- reguläre Integrationstests ohne SQL-Umgebungsvariable;
- `.NET format --verify-no-changes`;
- `npm ci`, Frontendtests, Lint und Produktionsbuild.

Dokumentiere bestehende Fehler, ändere aber keine fremden oder sachfremden
Bereiche, um sie zu kaschieren.

## Verbindliche Produktentscheidungen

Die vollständige Quelle ist
`docs/requirements/cemetery-master-data-decisions.md`. Insbesondere gelten:

### Hierarchie und Identität

- Hierarchie: `Friedhof → Bereich → Feld → Reihe → Grabstelle`.
- Friedhof und Grabstelle sind verpflichtend; Bereich, Feld und Reihe sind
  eigenständige optionale Ebenen.
- Jede Entität besitzt eine serverseitig erzeugte stabile GUID.
- Friedhofsname und optionaler Friedhofscode sind systemweit eindeutig.
- Untergeordnete Bezeichnungen/Codes und die Grabnummer sind normalisiert nur
  innerhalb ihres konkreten Elternpfads eindeutig. Gleiche Werte auf anderen
  Friedhöfen sind zulässig.
- Umbenennungen wirken unmittelbar auf alle referenzierenden Ansichten. Es
  entsteht keine fachliche Namenshistorie oder duplizierte Textkopie.

### Minimale Felder

- Friedhof: Name erforderlich; Code, strukturierte Anschrift und Bemerkung
  optional.
- Bereich, Feld und Reihe: Bezeichnung erforderlich; Code und Bemerkung
  optional.
- Grabstelle: Grabnummer und Grabart erforderlich; Belegungsstatus,
  Sperrstatus, optionale Sperrbemerkung, optionale positive Soll-Kapazität und
  optionale allgemeine Bemerkung.
- Texte werden getrimmt, Leerwerte normalisiert und mit begründeten
  serverseitigen Maximallängen geschützt. Bemerkungen dürfen laut UI-Hinweis
  keine unnötigen personenbezogenen oder sensitiven Daten enthalten.

### Grabarten

- Der globale Katalog startet leer. Keine Satzungswerte werden fest eingebaut
  oder als produktive Defaults geseedet.
- Grabarten sind fachliche Stammdaten und keine administrative
  Programmkonfiguration. `Sachbearbeitung` und `Administration` dürfen sie
  pflegen.
- Eine Grabart besitzt Name, optionalen eindeutigen Code, genau eine
  Beisetzungsform (`Erdbestattung`, `Urnenbeisetzung`, `Gemischt`), Aktivstatus
  und optionale Bemerkung.
- Grabarten werden Friedhöfen explizit zugeordnet und dort aktiviert oder
  deaktiviert. Eine Grabstelle darf nur eine für ihren Friedhof zugeordnete
  Grabart verwenden.
- Ruhe- und Nutzungszeiten, Gebühren und automatische Kapazitätsregeln werden
  nicht modelliert.

### Status, Sperrung und Kapazität

- Belegungsstatus: genau `Frei`, `Reserviert`, `Belegt`.
- Sperrung ist ein unabhängiges boolesches Merkmal und vernichtet den
  Belegungsstatus nicht.
- Erlaubte manuelle Übergänge in 4a:
  `Frei → Reserviert/Belegt`, `Reserviert → Frei/Belegt`.
- `Belegt` wird in 4a nicht wieder frei. Sperren/Entsperren ist unabhängig
  möglich.
- Die optionale Soll-Kapazität ist eine positive manuelle Angabe. Keine
  Belegung wird daraus berechnet, gezählt oder automatisch abgelehnt.
- Grabnummern werden ausschließlich manuell vergeben. Kein Nummernkreis, kein
  Vorschlag und keine Lückenlogik.

### Aktivierung und Löschen

- Beide Rollen dürfen alle fachlichen Stammdaten aktivieren/deaktivieren.
- Deaktivierte Werte und ihre Namen bleiben in bestehenden Fällen sichtbar,
  sind für neue Zuordnungen aber nicht auswählbar.
- Nur `Administration` darf physisch löschen.
- Löschen ist nur für vollständig unbenutzte Blätter beziehungsweise
  Strukturen ohne Fallreferenz, Grabstelle, Zuordnung oder untergeordnete
  Elemente erlaubt. Es gibt kein Kaskadenlöschen.
- Abhängige Löschversuche liefern einen verständlichen teilwirkungsfreien
  Konflikt. Bestehende Fallakten bleiben stets erhalten.

## Kanonischer Fallbezug und Kompatibilität

- Neue Fallakten und Änderungen des Grabstellenbezugs verwenden eine stabile
  `GraveSiteId`; der Browser übermittelt keine frei behaupteten
  Friedhofs-/Feld-/Grabtexte mehr als kanonische Identität.
- Suche, Detail, Bearbeitung und Antworten projizieren bei verknüpften Fällen
  den aktuellen Stammdatenpfad. Eine Umbenennung wird deshalb sofort sichtbar.
- Die bestehende Datenbank kann flache Grabtexte ohne `GraveSiteId` enthalten.
  Ergänze den Fremdschlüssel additiv und nullable. Ordne Altzeilen niemals
  automatisch anhand ähnlicher Texte zu. Bestehende unverknüpfte Zeilen müssen
  weiter lesbar bleiben und klar als noch nicht kanonisch zugeordnet behandelt
  werden.
- Der synthetische Standardprovider erhält ausschließlich generische
  synthetische Struktur- und Grabartwerte und verknüpft seine bestehenden
  synthetischen Fälle reproduzierbar.
- Neue kanonische Verknüpfungen akzeptieren nur aktive Strukturpfade und eine
  am Friedhof aktive Grabart. Status und Sperrung werden in 4a nicht
  automatisch aus der Fallverknüpfung verändert.

## Anwendungs- und Persistenzmodell

Implementiere klare Domain-/Application-Verträge und providerneutrale Stores.
Die konkrete Benennung darf sich begründet am bestehenden Stil orientieren,
muss aber mindestens abbilden:

- Friedhof;
- Bereich;
- Feld;
- Reihe;
- Grabart;
- friedhofsbezogene Grabartenzuordnung;
- Grabstelle;
- datensparsamer Stammdaten-Änderungsnachweis.

Jedes änderbare Stammdatum benötigt eine SQL-`rowversion` beziehungsweise im
synthetischen Provider einen gleichwertigen starken Nebenläufigkeitswert.
Normalisierte Eindeutigkeit muss in Application und über passende eindeutige
SQL-Indizes abgesichert sein. Eltern-/Pfadbeziehungen, Grabartenzuordnung,
Statuswerte, positive Kapazität und restriktives Löschen benötigen zusätzlich
relationale Constraints/Fremdschlüssel, soweit SQL Server dies zuverlässig
erzwingen kann.

Erzeuge die Migration regulär mit EF Core. Schreibe keine Designer- oder
Snapshotdatei von Hand. Die Migration ist additiv, verändert oder löscht keine
bestehenden Fall-, Konto- oder Auditdaten und enthält kein Seed mit lokalen
Satzungswerten.

## HTTP-, Sicherheits- und Auditvertrag

- Authentifizierte Leseendpunkte für Stammdaten verwenden die bestehende
  `MasterData`-Policy.
- Anlage, Änderung, Zuordnung, Aktivierung und Deaktivierung verwenden
  ebenfalls `MasterData` und sind für beide Rollen erlaubt.
- Ergänze eine aussagekräftige administrationsbeschränkte Policy für
  physisches Stammdatenlöschen; verwende dafür nicht missverständlich die
  Benutzerverwaltungspolicy.
- Jeder zustandsändernde Cookie-Endpunkt verlangt ASP.NET-Core-Antiforgery.
- Jede Änderung benötigt einen aktuellen starken ETag in `If-Match` und
  antwortet konsistent mit `428`, `400`, `404`, `409` beziehungsweise `412`,
  ohne interne Details preiszugeben.
- Mutation, neue Version und ein datensparsamer Änderungsnachweis mit stabiler
  Akteur-ID, historischem Anzeigenamen, UTC-Zeitpunkt, Entitätstyp/-ID und
  Operation werden atomar gespeichert. Keine vollständigen Vorher-/Nachher-
  Kopien, Bemerkungen oder Request-Bodies in Audit oder Logs.
- Physisches Löschen hinterlässt den datensparsamen Nachweis, aber keine
  verwaiste Pflicht-FK auf das gelöschte Stammdatum.
- Fehlgeschlagene und konkurrierende Änderungen erzeugen weder Erfolgsnachweis
  noch Versionssprung.
- Es gibt weiterhin keine Audit-/Log-Lese-, Such- oder Export-API und keine
  entsprechende UI, auch nicht für `Administration`.
- Sicherheitslogs verwenden quellgenerierte stabile Event-IDs und keine
  Inhaltswerte oder Secrets.

Der vorhandene Fallakten-Änderungsnachweis und ETag-/If-Match-Vertrag bleiben
vollständig erhalten. Eine Stammdatenumbenennung erzeugt keine künstlichen
Fallversionen; eine explizite Fallverknüpfung bleibt eine atomare
`GraveChanged`-Falländerung.

## Feature- und Betriebsgrenze

- Ergänze für schreibende Stammdaten eine explizite, standardmäßig `false`
  gesetzte Capability, beispielsweise `Features:MasterDataEditingEnabled`.
- Bei Aktivierung außerhalb von `Development` verweigert die Anwendung den
  Start. Leseendpunkte dürfen für die synthetischen Stammdaten verfügbar sein,
  schreibende Endpunkte und UI-Aktionen nur bei aktiver Capability.
- Die vorhandene `Features:CaseEditingEnabled`-Grenze bleibt unabhängig und
  unverändert sicher.
- Die Systeminformation darf die neue Capability datensparsam ausweisen; sie
  ist kein Zugriffsschutz.
- Keine echten Personen-, Grab-, Benutzer- oder Verwaltungsdaten in Code,
  Tests, Screenshots, Logs oder Dokumentation.
- Die mitgeteilte lokale Datenschutzfreigabe ist nicht im Repository belegt,
  nicht auf andere Betreiber übertragbar und hebt die Development-/Synthetik-
  Grenze nicht auf.

## API und OpenAPI

Stelle datensparsame Endpunkte für mindestens folgende Abläufe bereit:

- hierarchische beziehungsweise gezielt filterbare Stammdaten lesen;
- Friedhof, Bereich, Feld, Reihe, Grabart und Grabstelle anlegen/ändern;
- globale Grabart einem Friedhof zuordnen und dort aktivieren/deaktivieren;
- Stammdatum aktivieren/deaktivieren;
- unbenutztes Stammdatum administrationsgeschützt löschen;
- aktive auswählbare Grabstellen für die Fallbearbeitung lesen.

Vermeide unbeschränkte Vollabfragen: verwende sinnvolle Limits oder
hierarchische Filter. DTOs enthalten keine Auditdetails oder technischen
Interna. OpenAPI dokumentiert Authentifizierung, CSRF-Hinweis, ETag/If-Match,
Statuscodes, Rollen- und Capabilitygrenzen. Hashes, Stamps, Auditzeilen und
interne Normalformen bleiben unsichtbar.

## React-Oberfläche

Implementiere eine zugängliche deutsche Stammdatenoberfläche, die:

- für beide Rollen navigierbar ist;
- Friedhöfe und optionale Ebenen verständlich hierarchisch verwaltet;
- Grabarten global pflegt und je Friedhof zuordnet;
- Grabstellen samt Status, Sperrung und optionaler Kapazität pflegt;
- Aktiv-/Deaktivstatus klar zeigt und deaktivierte Werte nicht für neue
  Zuordnungen anbietet;
- Löschaktionen ausschließlich für `Administration` anzeigt, vor dem Löschen
  bestätigt und Serverkonflikte ohne Datenverlust erklärt;
- Fallanlage/-bearbeitung über eine kanonische Grabstellenauswahl führt;
- Lade-, Leer-, Validierungs-, `401`-, `403`-, `409`- und `412`-Zustände
  verständlich behandelt;
- lokale Formulareingaben bei Berechtigungs- und Nebenläufigkeitsfehlern nicht
  unbemerkt verwirft;
- Sitzung und CSRF-Token weiterhin nicht persistent in Web Storage speichert.

Die Oberfläche zeigt keine vollständigen Auditdaten oder Betreiberlogs.

## Tests

Ergänze mindestens folgende automatisierte Nachweise.

### Unit-Tests

- Normalisierung, Längen und kontextbezogene Eindeutigkeit;
- optionale Hierarchieebenen und Pfadkonsistenz;
- Grabart-Beisetzungsformen;
- erlaubte und abgelehnte Statusübergänge;
- positive optionale Kapazität;
- Aktiv-/Auswahlregeln;
- Löschentscheidung bei Abhängigkeiten;
- Claims/Akteur und Rollenmatrix einschließlich Admin-only-Löschen.

### API-/Integrationstests ohne reale Verwaltungsdaten

- anonyme Fachzugriffe `401` ohne Redirect;
- beide Rollen dürfen alle Lese-, Anlage-, Änderungs-, Zuordnungs-, Aktiv-
  und Deaktivierungsoperationen ausführen;
- `Sachbearbeitung` erhält für jede physische Löschoperation `403`;
- `Administration` kann ausschließlich unbenutzte Werte löschen;
- CSRF fehlt/ist falsch/ist korrekt für jede Mutation;
- ETag fehlt/ist ungültig/veraltet/aktuell und hat keine Teilwirkung;
- doppelte Friedhöfe beziehungsweise Geschwisterwerte werden abgelehnt;
- gleiche Feld-/Reihen-/Grabnummern auf verschiedenen Elternpfaden sind
  zulässig;
- optionale Ebenen funktionieren in mehreren Kombinationen;
- deaktivierte Werte bleiben in bestehenden Fällen sichtbar, sind aber nicht
  neu auswählbar;
- Umbenennung erscheint sofort in Suche, Fallansicht und Bearbeitung;
- verwendete Werte und Strukturen mit Kindern sind nicht löschbar;
- Fallakten bleiben bei abgelehnten Löschungen unverändert;
- Client-Identitätsheader beeinflussen weder Akteur noch Audit;
- OpenAPI enthält keine Audit-/Secretfelder und dokumentiert neue Verträge;
- Security-Logs enthalten keine Namen, Bemerkungen, Bodies, Cookies oder
  Token.

### Reale SQL-Tests auf `CEMARISDEV`

- komplette additive Migration von der bisherigen letzten Migration;
- alle Tabellen, Constraints, Fremdschlüssel, eindeutigen Indizes und
  `rowversion`-Spalten;
- normalisierte Eindeutigkeit im korrekten Elternpfad;
- parallele Mutationen mit derselben Version: genau ein Gewinner;
- atomarer Fachwert-/Versions-/Auditvertrag einschließlich erzwungenem
  Auditfehler-Rollback;
- restriktives Löschen und Erhalt bestehender Fallakten;
- Umbenennung und dynamische Projektion über den kanonischen Fremdschlüssel;
- bestehende Fall-/Audit-, Konto- und Sicherheitszustände bleiben erhalten;
- vollständiger authentifizierter synthetischer UI-/API-naher Ablauf über
  Stammdatenanlage, Fallverknüpfung, Suche und Detail.

SQL-Tests verwenden ausschließlich prozesslokal gesetzte Verbindung und
eindeutig mit `Cemaris_IntegrationTests_*` benannte temporäre Datenbanken. Vor
jeder Löschung müssen Präfix und aufgelöster Datenbankname geprüft werden.
Keine bestehende Benutzer- oder Produktdatenbank verändern oder löschen. Nach
der Suite über `sys.databases` nachweisen, dass keine temporäre Testdatenbank
verblieben ist. Keine Verbindung oder Secrets ausgeben.

### Frontendtests

- Navigation für beide Rollen;
- hierarchische Anlage mit optionalen Ebenen;
- Grabarten- und Friedhofszuordnung;
- Status/Sperrung/Aktivierung;
- admin-only Löschdarstellung und verständliche Konflikte;
- kanonische Grabstellenauswahl in Fallformularen;
- Erhalt lokaler Eingaben bei `403`, `409` und `412`;
- keine persistente Tokenablage.

## Abschlussprüfungen

Führe im finalen unveränderten Arbeitsbaum vollständig aus:

1. Release-Build mit 0 Warnungen und 0 Fehlern;
2. Unit-Tests;
3. reguläre Integrationstests;
4. separate reale SQL-Suite gegen `CEMARISDEV`;
5. `.NET format --verify-no-changes`;
6. `npm ci`, Frontendtests, Lint und Produktionsbuild;
7. OpenAPI-Prüfung;
8. regulär erzeugtes idempotentes EF-Migrationsskript außerhalb des
   Repositorys, Inhalts-/Reihenfolgeprüfung und sichere Entfernung;
9. Markdown-Link- und Tabellenprüfung;
10. Secretprüfung für versionierte und unversionierte Dateien;
11. `git diff --check`;
12. vollständige finale Git-Prüfung mit Branch, HEAD, Upstream, Status,
    vollständigem Arbeits-/Index-Diff und Inhalt aller unversionierten Dateien.

## Dokumentationsergebnisse

Aktualisiere mindestens:

- Root-README;
- `docs/requirements/README.md` nur bei tatsächlich umgesetzten
  Präzisierungen;
- `docs/implementation/README.md`;
- Architektur-/Datenmodelldokumentation;
- Entscheidungsindex und ein ADR für kanonische Stammdatenreferenzen,
  Nebenläufigkeit und restriktives Löschen;
- eine deutsche Abschlussdokumentation für Inkrement 4a;
- eine neue detaillierte Folgeübergabe für Inkrement 4b, die alle weiterhin
  offenen Prozessfragen ehrlich aufführt.

Die Abschlussdokumentation nennt exakte Testergebnisse, SQL-Bereinigung,
Migration und verbleibende Gates. Behaupte keine umfassende Produktiv-,
Datenschutz-, Betriebs- oder fachliche Freigabe.

## Schutzgrenzen

- Kein vollständiger Beisetzungsworkflow, keine Planungstermine und keine
  automatischen Prozessstatus.
- Keine automatische Grabnummerierung, Belegungs-/Kapazitätsentscheidung,
  Ruhe- oder Nutzungsfrist.
- Keine Schließung, Entwidmung, Umnummerierung, Zusammenlegung oder Teilung.
- Keine Umbettung und kein fachliches Storno.
- Keine Personenrollenerweiterung, Nutzungsrechte oder Wiedervorlagen.
- Keine Gebühren, Bescheide, Dokumente, Formulare oder Winyard-Integration.
- Kein LDAP-Bind, keine LDAP-Anmeldung, kein LDAP-Import und kein Mapping.
- Kein EDWALT-Code, kein EDWALT-Mapping, kein Import und kein Zugriff auf
  EDWALT-Originale.
- Keine Audit-/Log-Leseoberfläche.
- Keine echten Verwaltungsdaten und keine umfassende Produktivfreigabe.

## Abnahmekriterien

Inkrement 4a ist technisch abgeschlossen, wenn:

- beide Rollen die bestätigten fachlichen Stammdaten Ende zu Ende verwalten
  können;
- nur `Administration` unbenutzte Stammdaten physisch löschen kann;
- verwendete/deaktivierte Werte und bestehende Fälle sicher erhalten bleiben;
- die optionale Hierarchie und kontextbezogene Eindeutigkeit in Domain,
  SQL, API und UI konsistent sind;
- Grabarten frei konfigurierbar und je Friedhof zuordenbar sind;
- Grabstatus, Sperrung und optionale Soll-Kapazität ohne unbestätigte
  Automatik funktionieren;
- neue Fälle eine kanonische Grabstelle referenzieren und Umbenennungen sofort
  in Suche und Detail sichtbar sind;
- ETag, CSRF, Policies, Akteur und atomarer datensparsamer
  Änderungsnachweis erhalten beziehungsweise erweitert sind;
- Migration und vollständiger Ablauf auf einer temporären Datenbank in
  `CEMARISDEV` erfolgreich waren und keine Testdatenbank verblieben ist;
- alle Abschlussprüfungen erfolgreich sind;
- keine Arbeit außerhalb des Repositorys verändert und kein Commit erzeugt
  wurde.
