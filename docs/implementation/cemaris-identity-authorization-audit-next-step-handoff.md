# Folgeübergabe: Identitäts-, Berechtigungs- und Audit-Freigabegate

Stand: 12.08.2026

## Ziel des nächsten Schritts

Der technisch abgeschlossene zweite Produktinkrement bleibt standardmäßig
deaktiviert, Development-only und auf synthetische Daten begrenzt. Der nächste
Schritt erhebt und entscheidet die Voraussetzungen für einen späteren
produktiven Schreibpfad:

1. verbindliche Identitätsquelle je Zielumgebung;
2. fachlich freigegebene Rollen-/Berechtigungsmatrix bis auf Operationsebene;
3. datensparsame Audit-Mindestanforderungen einschließlich Ausfallverhalten.

Dieser Auftrag ist zunächst ein Entscheidungs- und Freigabegate. Er ermächtigt
nicht dazu, einen Authentifizierungsanbieter, Rollen, Rechte oder Auditfelder
zu erfinden, den Schreibpfad produktiv zu aktivieren oder echte Daten zu
verwenden. Erst wenn alle drei Ergebnisse durch benannte fachliche,
technische und datenschutzrechtliche Verantwortliche entschieden sind, darf
eine weitere eigenständige Implementierungsübergabe entstehen.

## Verifizierter Produktstand

- Inkrement 1: lesende Suche und Detailansicht technisch abgeschlossen;
- Inkrement 2: synthetische Development-Fallaktenbearbeitung technisch
  abgeschlossen;
- `Features:CaseEditingEnabled=false` ist Standard;
- Aktivierung außerhalb von `Development` führt sicher zum Startabbruch;
- Schreiben verwendet serverseitige GUIDs, monotone Fallversionen, starke
  ETags und verpflichtendes `If-Match`;
- synthetischer und SQL-Provider ändern denselben kanonischen Zustand, SQL
  atomar innerhalb einer Transaktion;
- keine produktive Authentifizierung, Autorisierung oder Auditierung vorhanden;
- keine Produktivfreigabe und keine Freigabe für echte Verwaltungsdaten.

Der genaue technische Vertrag steht in
[Implementierungsentscheidungen: schreibende Fallakten-Grundlage](../requirements/case-record-write-decisions.md),
die Store-Entscheidung in
[ADR-0010](../decisions/ADR-0010-canonical-provisional-case-store.md).

## Arbeitsverzeichnis und Werkzeug

Beschreibbares Repository:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich verwenden:

- `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Node und npm sind über `PATH` verfügbar. Keine Commits durchführen.

## Unveränderte Schutzgrenzen

- Bestehende lokale Änderungen vor Beginn über Branch, HEAD, Status,
  vollständigen Diff und unversionierte Dateien erfassen und erhalten.
- Keine echten Personen-, Grab-, Adress-, Bescheid-, Gebühren-, Identitäts-
  oder Auditdaten in Repository, Tests, Logs oder Screenshots verwenden.
- Keine Secrets, Tokens, produktiven Connection Strings, Zertifikate oder
  Benutzerkennungen speichern.
- EDWALT-Originale sowie externe Phase-2-/3-/4-Arbeitsbereiche nicht öffnen,
  kopieren, hashen, verändern oder ausführen. Keine Phase-5-Wurzel anlegen.
- Keinen EDWALT-Import und kein Mapping erzeugen.
- Keine Grabarten, Status, Fristen, Gebühren-, Bescheid-, Lösch-, Storno-,
  Umnummerierungs- oder fachliche Historienregeln ergänzen.
- Keine produktive Identitäts- oder Rechtekonfiguration durch Vermutung.
- `Features:CaseEditingEnabled` nicht außerhalb von Development lockern oder
  standardmäßig aktivieren.

## Zuerst vollständig lesen

1. diese Folgeübergabe;
2. `README.md`;
3. `docs/implementation/README.md`;
4. `docs/requirements/README.md`;
5. `docs/requirements/case-record-write-decisions.md`;
6. `docs/architecture/README.md`;
7. `docs/architecture/authentication-authorization-audit.md`;
8. ADR-0002, ADR-0005, ADR-0007, ADR-0009 und ADR-0010;
9. `SECURITY.md` und gegebenenfalls vorhandene `AGENTS.md`;
10. alle anschließend betroffenen Dateien vollständig.

## Verbindlicher Arbeitsauftrag

### 1. Entscheidungseigentümer und Zielumgebungen

Benannte Verantwortliche für Fachverfahren, kommunale IT/Betrieb,
Informationssicherheit und Datenschutz festhalten. Development, Test,
Schulung, Pilot und Produktion getrennt betrachten. Nicht aus technischem
Bestand ableitbare Angaben aktiv bei den zuständigen Personen erheben.

### 2. Identitätsquelle

Mindestens klären und mit Quelle/Entscheider dokumentieren:

- konkrete Identitätsquelle und Protokoll je Zielumgebung;
- technische Vertrauensgrenze, Aussteller, Mandant/Realm und stabile
  Benutzerkennung;
- Gruppen-/Claim-Herkunft, Provisionierung, Sperrung und Ausscheiden;
- Anforderungen an Mehrfaktor-Authentifizierung, Dienstkonten,
  Notfallzugang und Sitzungsdauer;
- Reverse-Proxy-/TLS-Verantwortung und Verhalten bei Ausfall der
  Identitätsquelle.

Lokale Konten, AD/LDAP und OpenID Connect bleiben gleichwertige offene
Kandidaten, bis eine autorisierte Entscheidung vorliegt.

### 3. Rollen- und Berechtigungsmatrix

Für jede bereits vorhandene Lese- und Schreiboperation mindestens Subjekt,
Operation, Daten-/Friedhofsbezug, erlaubte und verweigerte Fälle,
Vertretung/Funktionstrennung sowie verantwortliche Freigabe erfassen. Die
Matrix muss mindestens Suche, Falldetail, Fallanlage, Grabstellenänderung,
Personenanlage/-änderung und Beisetzungsanlage/-änderung abdecken.

Organisatorische Stellenbezeichnungen sind nicht automatisch Systemrollen.
Ungeklärte Zellen bleiben `OFFEN`; sie werden nicht permissiv ausgelegt.

### 4. Audit-Mindestanforderungen

Mit Fachseite, Informationssicherheit und Datenschutz entscheiden:

- auditpflichtige Lese- und Schreibereignisse;
- stabile handelnde Identität, Zeitpunkt, Operation, Fallreferenz und
  notwendiger Änderungsnachweis;
- ausdrücklich unzulässige Inhaltskopien und Protokolldaten;
- Integrität, Zugriff, Suche/Export, Aufbewahrung und zulässige Löschung;
- Zeitzone/Zeitquelle, Korrelation und Trennung vom technischen Log;
- zwingendes Verhalten bei nicht verfügbarer Audit-Speicherung;
- Verantwortlichkeit für Kontrolle und Auffälligkeiten.

Keine Vollkopien personenbezogener Datensätze als Auditmodell vorschlagen.

### 5. Ergebnisse

Mindestens liefern:

- aktualisierte
  `docs/architecture/authentication-authorization-audit.md` mit belegten
  Entscheidungen und sichtbaren offenen Punkten;
- eine versionierbare Rollen-/Berechtigungsmatrix unter `docs/requirements`;
- ein neues ADR für die tatsächlich beschlossene Identitäts- und technische
  Autorisierungsarchitektur; bestehende ADRs nicht rückwirkend umschreiben;
- dokumentierte Audit-Mindestanforderungen mit Freigabeverantwortlichen;
- eine Gate-Checkliste mit Status `ERFÜLLT` oder `OFFEN` je Voraussetzung;
- eine weitere eigenständige Implementierungsübergabe nur dann, wenn alle
  zwingenden Entscheidungen getroffen sind.

Fehlt mindestens eine zwingende Entscheidung, endet der Auftrag mit einem
ehrlichen Blockerbericht und einer präzisen Fragenliste. In diesem Fall werden
keine produktiven Authentifizierungs-, Autorisierungs- oder Auditkomponenten
implementiert.

## Abnahme und Prüfungen

- Jede Entscheidung nennt Quelle, Datum, Geltungsbereich und verantwortliche
  Freigabe; Vermutungen sind nicht als Entscheidung markiert.
- Die Matrix enthält keine implizite Vollberechtigung und keine erfundene
  Rollensemantik.
- Datenschutz- und Auditfelder sind minimiert und prüfbar begründet.
- Der bestehende Development-Schreibpfad bleibt unverändert sicher begrenzt.
- Lokale Markdown-Links und Tabellen sind korrekt.
- `git diff --check`, vollständiger Diff, unversionierte Dateien, Secret- und
  Datenschutzprüfung sind erfolgt.
- Falls Produktcode berührt wurde, zusätzlich alle Backend- und Frontend-
  Abschlussprüfungen aus `README.md` ausführen.
- Keine Commits.

## Produktivfreigabe

Eine Produktivfreigabe darf in diesem oder einem folgenden Auftrag erst
vorgesehen werden, wenn Identitätsquelle, Rollen-/Berechtigungsmatrix und
Audit-Mindestanforderungen autorisiert entschieden, technisch implementiert
und Ende zu Ende getestet sind. Zusätzlich bleiben Datenschutz-, Betriebs-
und fachliche Freigaben eigenständige Gates. Die Development-Capability allein
ist unter keinen Umständen ein Produktivschutz.
