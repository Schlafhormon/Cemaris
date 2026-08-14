# Architektur für Beteiligte und manuelle Nutzungsrechte

Stand: 14.08.2026

> **Implementierungsstatus:** Der hier abgegrenzte 5b-Kern ist technisch
> umgesetzt und gemäß
> [5b-Abschlussdokumentation](../implementation/cemaris-increment-5b-completion.md)
> verifiziert. Die beschriebenen Nicht-Ziele bleiben unverändert offen.

## Geltungsbereich

Diese Architektur setzt die bestätigten Anforderungen aus
[`person-usage-rights-deadlines-decisions.md`](../requirements/person-usage-rights-deadlines-decisions.md)
für den kleinen Inkrement-5b-Durchstich um. Sie beschreibt einen manuellen,
historisierbaren Beteiligten-/Nutzungsrechtskern. Ruhefristen,
Regelberechnung, Statusautomatik und Wiedervorlagen bleiben außerhalb.

Maßgeblich ist außerdem
[ADR-0016](../decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md).

## Architekturgrenze

Der neue Fachkern ist additiv und wird nicht aus den bestehenden Tabellen
`EntitledPersons`, `Addresses`, `UsageRights` und ihrer n:m-Verknüpfung
abgeleitet. Diese Tabellen bleiben eine nullable, fallgebundene
Alt-Leseprojektion. Ein neuer kanonischer Datensatz entsteht nur durch eine
ausdrückliche 5b-Mutation.

```text
Programmkonfiguration je Friedhof
          |
          v
kanonische Beteiligte ---> Inhaberzeiträume ---> kanonisches Nutzungsrecht
       |                                              |
       v                                              v
Adresszeiträume                              genau eine Grabstelle
       |                                              |
       +-------------- Fachrevisionen <--------------+
                              |
                              v
                    sparsamer technischer Audit
```

## Domänenmodell

### Beteiligte

`Party` ist das kanonische Aggregat für natürliche Personen und
Organisationen:

- unveränderliche `PartyId`;
- `PartyType` mit `NaturalPerson` und `Organization`;
- natürliche Person: `FirstName` und `LastName`;
- Organisation: `OrganizationName`;
- optionale `CurrentPrimaryAddressId` als Verweis auf eine aktuell gültige
  eigene Anschrift;
- starke, monoton fortgeschriebene Version;
- unveränderliche Revisionen mit Mutationstyp, Begründung, Akteur und
  UTC-Zeitpunkt.

Postalische Anschriften sind zeitabhängige Kinder des Aggregats. Ein Zeitraum
verwendet `ValidFromInclusive` und optional `ValidUntilExclusive`. Dadurch
teilen sich aufeinanderfolgende Anschriften einen klaren Grenztag, ohne
Tagesarithmetik in mehreren Schichten. Die API benennt diese Semantik
ausdrücklich. Der optionale Aggregatverweis `CurrentPrimaryAddressId` macht
die Eindeutigkeit der aktuellen Hauptanschrift ohne zeitabhängigen SQL-Index
prüfbar. Er darf nur auf eine eigene, am serverseitigen Fachtag gültige
Anschrift zeigen; null aktuelle Hauptanschriften sind zulässig.

Eine Normalisierung dient nur der Dublettenwarnung. Sie verändert die
angezeigten Originalwerte nicht und ist keine Identitätsentscheidung. Die
Normalisierung umfasst für 5b ausschließlich Groß-/Kleinschreibung,
umgebende/mehrfache Leerzeichen und die gemeinsam vorhandenen
Postanschriftenfelder. Ein Treffer führt zu einem strukturierten
Bestätigungskonflikt. Die Oberfläche kann denselben Request anschließend mit
`ConfirmPossibleDuplicate=true` wiederholen. Der Server führt die Prüfung
erneut aus; die Bestätigung ist kein dauerhafter Dubletten-, Merge- oder
Umgehungsschlüssel. Dieses Muster entspricht der vorhandenen
Beisetzungsprozess-Bestätigung und ersetzt keine Autorisierung oder
CSRF-Prüfung.

### Nutzungsrecht

`UsageRight` ist ein eigenständiges Aggregat:

- unveränderliche `UsageRightId`;
- genau eine vorhandene kanonische `GraveSiteId`;
- manuelle `StartDate` und `EndDate`, wobei `EndDate > StartDate`;
- verpflichtende fachliche `SourceReference`;
- Snapshot der bei Anlage verwendeten Startbezugs-Konfiguration;
- starke Version;
- genau ein offener Inhaberzeitraum;
- unveränderliche Fachrevisionen.

„Offen“ bedeutet im 5b-Datenmodell ausschließlich: Es gibt noch keine
fachliche Beendigungsoperation. Es wird nicht aus dem heutigen Datum oder dem
manuellen Enddatum berechnet. Da eine Beendigungsoperation nicht zu 5b gehört,
ist jedes dort neu angelegte Recht offen. Für 5b sichert deshalb ein
ungefilterter eindeutiger Index auf `GraveSiteId` höchstens ein kanonisches
Recht je Grabstelle. Erst ein späteres, fachlich bestätigtes
Beendigungsinkrement darf den Index durch eine belegte Offen-/Endesemantik
ersetzen.

`UsageRightHolderPeriod` referenziert eine `PartyId` und verwendet ebenfalls
`ValidFromInclusive` sowie `ValidUntilExclusive`. Eine Übertragung setzt in
derselben Transaktion das Ende-exklusiv des alten Zeitraums und den Beginn des
neuen Zeitraums auf das angegebene Wirksamkeitsdatum. Ein gefilterter
eindeutiger Index erzwingt höchstens einen offenen Inhaberzeitraum.

### Startbezugs-Konfiguration

`UsageRightStartRule` gehört zur administrativen Programmkonfiguration und
referenziert genau einen kanonischen Friedhof:

- unveränderliche `UsageRightStartRuleId` und `CemeteryId`;
- fachlicher, vom Administrator gepflegter `Code`;
- verständliche `DisplayName`;
- starke Version und unveränderliche Änderungsrevisionen;
- genau eine Regel je Friedhof; Änderungen versionieren dasselbe Aggregat.

Der Name „Rule“ bezeichnet nur den Erfassungsbezug. Die Komponente enthält
keine Dauer, kein Rechenverfahren und keinen Statusübergang. Ein Recht
speichert bei Anlage `UsageRightStartRuleId`, `StartRuleCodeSnapshot` und
`StartRuleDisplayNameSnapshot`. Eine Konfigurationsänderung wirkt damit nur
auf spätere Anlagen. Referenzierte Regeln dürfen nicht physisch gelöscht
werden; 5b bietet ohnehin keine Löschoperation.

Für Doberlug-Kirchhain ist betrieblich je betroffenem Friedhof eine Regel mit
der Bedeutung `Übergabe der Nutzungsurkunde` anzulegen. Diese Daten stehen
nicht in allgemeinen Migrationen, Produktiv-Seeds oder Quellcode-Defaults.

## Fachoperationen

### Beteiligte

- `CreateParty`: validiert typabhängige Namen und optionale initiale
  Anschriften; mögliche Dublette benötigt explizite Bestätigung.
- `CorrectParty`: korrigiert Namensfakten mit Begründung und ETag.
- `AddPartyAddress`: ergänzt einen historischen Zeitraum mit Begründung und
  ETag.
- `CorrectPartyAddress`: korrigiert einen vorhandenen Zeitraum mit Begründung
  und ETag; es wird eine neue Aggregatrevision geschrieben.

Ein Adresseintrag wird nicht gelöscht. Ein fachlicher Umzug wird durch das
Beenden des alten und Anlegen des neuen Zeitraums in einer atomaren Operation
abgebildet; reine Erfassungsfehler werden ausdrücklich korrigiert.

### Nutzungsrechte

- `CreateUsageRight`: validiert Grabstelle, aktuelle Startregel und Inhaber;
  legt Recht, ersten Inhaberzeitraum, Revision und Audit atomar an.
- `TransferUsageRight`: beendet den offenen Inhaberzeitraum und beginnt einen
  neuen zum selben Datum; Grund und ETag sind Pflicht.
- `ExtendUsageRight`: setzt ein manuelles Enddatum, das strikt nach dem
  aktuellen Enddatum liegt; Grund und ETag sind Pflicht.
- `CorrectUsageRightFacts`: korrigiert Referenz, Beginn, Ende,
  Startregel-Snapshot oder einen fälschlich gewählten Grabstellenbezug mit
  Grund und ETag. Ein Inhaberwechsel ist hier verboten.

Die Grabstellenkorrektur ist ausschließlich die Berichtigung einer
Fehlerfassung. Sie muss dieselben Eindeutigkeits- und Existenzregeln wie eine
Neuanlage erfüllen. Eine fachliche Verlegung, Umbettung oder Wiedervergabe ist
keine Korrektur und bleibt außerhalb 5b.

## Fachhistorie und Audit

Die Fachhistorie speichert pro erfolgreicher Mutation eine unveränderliche
Revision des fachlich relevanten Zustands:

- Revisions-ID, Aggregat-ID und Ergebnisversion;
- Mutationstyp;
- serverseitiger Akteur und UTC-Zeitpunkt;
- verpflichtende Begründung, soweit die Operation sie verlangt;
- vollständiger Zustand des Aggregats nach der Mutation beziehungsweise die
  referenzierten IDs und zeitlichen Intervalle.

Die Fachhistorie ist Teil des geschützten Fachdatenmodells und keine
allgemeine Auditoberfläche. Der bestehende sparsame Auditmechanismus erhält
nur Operation, Entitätsart und -ID, Ergebnisversion, Akteur und UTC-Zeitpunkt.
Er enthält keine Namen, Anschriften, Quellenangaben oder Begründungen.

## Anwendungsschicht und Providerneutralität

Die Anwendungsschicht erhält getrennte Ports für:

- Suche und Detail von Beteiligten;
- Beteiligtenmutationen;
- Suche/Detail nach Nutzungsrecht und Grabstelle;
- Nutzungsrechtsmutationen;
- Lesen und administrative Änderung der Startregel.

Request-Modelle enthalten keinen Akteur und keinen vertrauenswürdigen
Zeitstempel. Beides liefert wie in früheren Inkrementen eine serverseitige
Abstraktion. Ergebnisverträge unterscheiden mindestens Erfolg,
Validierungsfehler, Dublettenbestätigung erforderlich, nicht gefunden,
Versionskonflikt, Eindeutigkeitskonflikt und Capability deaktiviert. Die
Dublettenbestätigung verwendet das vorhandene boolesche Wiederholungsmuster;
es wird kein neues Token- oder Cache-Subsystem eingeführt.

Der synthetische Provider verwendet einen gemeinsamen Koordinator für
Friedhofsstammdaten, Beteiligte und Nutzungsrechte. Der SQL-Provider nutzt
Transaktionen und datenbankseitige Constraints. Beide Provider müssen
dieselben sichtbaren Ergebnisse und dieselbe ETag-Semantik liefern.

## HTTP- und OpenAPI-Verträge

Die Verträge sind additiv. Empfohlene Ressourcen:

- `GET /api/parties?query=...` und `GET /api/parties/{id}`;
- `POST /api/parties`;
- `POST /api/parties/{id}/corrections`;
- `POST /api/parties/{id}/addresses`;
- `POST /api/parties/{id}/address-corrections`;
- `GET /api/grave-sites/{graveSiteId}/usage-rights`;
- `GET /api/usage-rights/{id}` und `POST /api/usage-rights`;
- `POST /api/usage-rights/{id}/transfers`;
- `POST /api/usage-rights/{id}/extensions`;
- `POST /api/usage-rights/{id}/corrections`;
- `GET /api/program-configuration/usage-right-start-rules`;
- `POST` und `PUT` für diese Startregeln nur für Administration.

Alle Detailantworten liefern einen starken ETag im Header; mutierende
Operationen auf vorhandenen Aggregaten benötigen `If-Match`. Fehlender
`If-Match` ergibt `428`, eine veraltete Version `412`. Validierungs- und
Eindeutigkeitskonflikte verwenden strukturierte ProblemDetails. Cookies,
CSRF-Schutz, sichere Fehlerabbildung und No-Store-Verhalten folgen den
bestehenden Verträgen.

Die vorhandenen `CaseResponse`-Felder bleiben kompatibel. Neue kanonische
Rechte werden über die Grabstellenressource gelesen; die alten Arrays werden
in 5b weder neu gedeutet noch entfernt. Dadurch gibt es keine vorgetäuschte
Zusammenführung von Alt- und Neuhistorie.

## React-Zuschnitt

Die Fall-/Grabstellendetailseite erhält bei vorhandener kanonischer
`GraveSiteId` einen klar getrennten Bereich `Kanonische Nutzungsrechte`:

- aktuelles Recht, Zeitraum, Referenz, Startbezug und aktueller Inhaber;
- vollständige Inhaber- und Revisionshistorie;
- Formulare für Anlage, Übertragung, Verlängerung und Korrektur;
- Beteiligten-Suche und -Anlage mit Dublettenbestätigung;
- Adresshistorie mit klarer Zeitraumdarstellung;
- verständliche Konfliktmeldung mit Neuladen nach `412`.

Die administrative Programmkonfiguration erhält eine kleine Ansicht pro
Friedhof für Code und Anzeige des Startbezugs. Die Oberfläche berechnet keine
Laufzeiten und zeigt lokale Werte nicht als allgemeine Empfehlung an.

Alte `Berechtigte`- und `Nutzungsrechte`-Abschnitte bleiben als
`Vorläufige Altprojektion` lesbar gekennzeichnet, sofern solche Daten
vorhanden sind. Es findet keine automatische Zusammenführung statt.

## Capability und Policies

Die unabhängige Capability
`Features:PersonUsageRightsEditingEnabled` ist standardmäßig `false`. Sie ist
nur in `Development` mit `ReadModel:Provider=Synthetic` als realer
Schreibpfad zulässig. Eine ungültige Kombination beendet den Start sicher.
4a- und 4b-Capabilities bleiben unabhängig.

- Fachliche Lese- und Mutationsendpunkte verwenden die neue Policy
  `PersonUsageRights` für `Sachbearbeitung` und `Administration`.
- Änderung der Startbezugs-Konfiguration verwendet die vorhandene
  administrative Policy `ProgramConfiguration`.
- Lesen der aktiven Startregel ist innerhalb einer autorisierten fachlichen
  Rechteoperation zulässig.
- Capability-Zustand erscheint additiv und ohne sensible Werte in
  `/api/system/info`.

## Atomarität und Nebenläufigkeit

Folgende Wirkungen sind jeweils eine Transaktion beziehungsweise eine
unteilbare synthetische Operation:

- Beteiligtenzustand, Adressänderung, Aggregatversion, Fachrevision, Audit;
- Recht, erster Inhaberzeitraum, Startregel-Snapshot, Version, Revision,
  Audit;
- Ende des alten und Beginn des neuen Inhaberzeitraums, Version, Revision,
  Audit;
- neues manuelles Enddatum oder korrigierte Fakten, Version, Revision, Audit;
- Startregelzustand, Version, Konfigurationsrevision und Audit.

Unique Constraints sind nicht nur Vorabprüfungen: Sie entscheiden Rennen um
ein offenes Recht, einen offenen Inhaber oder eine aktuelle Startregel sicher.
Ein Constraint-Konflikt wird in einen fachlichen Konflikt übersetzt. Bei
Fehlern darf weder eine halbe Inhaberfolge noch ein verwaister Auditdatensatz
entstehen.

## Persistenz und additive Migration

Die konkrete Benennung darf dem bestehenden Stil folgen; erforderlich sind
mindestens neue Tabellen für:

- `Parties`, `PartyAddresses`, `PartyRevisions`;
- `UsageRights`, `UsageRightHolderPeriods`, `UsageRightRevisions`;
- `UsageRightStartRules`, `UsageRightStartRuleRevisions`.

Fremdschlüssel verweisen auf kanonische Friedhöfe, Grabstellen und Parteien.
Ungefilterte eindeutige Indizes sichern in 5b genau eine Startregel und genau
ein kanonisches Recht je Friedhof beziehungsweise Grabstelle. Ein gefilterter
Index sichert den Inhaberzeitraum mit `ValidUntilExclusive IS NULL`. Die
aktuelle Hauptanschrift wird über den nullable Aggregat-Fremdschlüssel
`CurrentPrimaryAddressId` eindeutig; Anwendung und SQL sichern dessen
Zugehörigkeit, während die zeitliche Gültigkeit providerneutral validiert
wird. Weitere Zeit- und Plausibilitätsbedingungen werden soweit portabel
zusätzlich in Anwendung und SQL-Constraints gesichert.

Die Migration ist ausschließlich additiv:

- keine Umbenennung oder Löschung bestehender Tabellen und Spalten;
- kein Backfill aus `EntitledPersons`, `Addresses` oder `UsageRights`;
- keine lokalen Satzungswerte oder realen Personen als Seed;
- vollständige Migration sowohl ab leerer Datenbank als auch aus jeder
  bestehenden Migrationsstufe;
- der Model-Snapshot wird konsistent aktualisiert.

## Teststrategie

### Unit- und Anwendungstests

- typabhängige Namenspflichten und Zeitraumgrenzen;
- Normalisierung, Warnung, erneut geprüfte ausdrückliche Bestätigung und
  unveränderte Originalwerte;
- höchstens eine aktuelle Hauptanschrift;
- Create/Transfer/Extend/Correct samt Revision und Audit;
- Konfigurations-Snapshot und fehlende Startregel;
- starke ETags und Rollback bei jeder Fehlerklasse;
- keinerlei Frist-, Status- oder Wiedervorlagenautomatik.

### API- und Autorisierungstests

- Capability aus/an sowie ungültige Laufzeitkombination;
- unauthentifiziert, falsche Policy, Sachbearbeitung und Administration;
- ProgramConfiguration ausschließlich Administration;
- CSRF, `If-Match`, `428`, `412`, ProblemDetails und No-Store;
- OpenAPI-Schema und additive Altverträglichkeit.

### Providerparität und reales SQL

Die gleichen Vertragsszenarien laufen gegen synthetischen und EF-Store. Die
reale SQL-Suite prüft zusätzlich alle Migrationspfade, Constraints,
Parallelrennen und Rollbacks in ausschließlich temporären
`Cemaris_IntegrationTests_*`-Datenbanken. Nach der Suite muss
`sys.databases` null solche Datenbanken ausweisen.

### Frontend

- Beteiligten-Suche, Anlage und bestätigte Dublette;
- Adresshistorie und typabhängige Formulare;
- Rechteanlage, Transfer, Verlängerung, Korrektur und Historie;
- administrative Startregel, Rollenbegrenzung und Konflikt-Neuladen;
- explizite Trennung von Altprojektion und kanonischem Kern;
- Vitest, ESLint und Produktionsbuild.

## Sicherheits- und Datenschutzgrenze

5b verarbeitet ausschließlich vollständig synthetische Daten. Namen,
Anschriften, Quellenreferenzen und Begründungen werden nicht in Logs,
ProblemDetails oder technische Audits kopiert. Schutz vor Injection erfolgt
durch parametrisierte Persistenz und sichere React-Ausgabe. Eingabelängen und
Zeichensätze werden begrenzt, ohne kommunale Namensformen unnötig
auszuschließen.

Aufbewahrung, Löschung, Anonymisierung, Datenschutzfreigabe,
Berechtigungsfeingranularität und produktiver Betrieb bleiben offene Gates.

## Nicht-Ziele

Keine automatische Frist- oder Statusberechnung, keine Wiedervorlagen, keine
finale Beendigung oder Wiedervergabe, keine weiteren Personenrollen, keine
Gebühren oder Dokumente, keine Winyard-/LDAP-/Kalenderintegration, kein
EDWALT-Mapping und keine Verarbeitung echter Verwaltungsdaten.
