# Cemaris – ausführbare Folgeübergabe für Inkrement 4b

Stand: 13.08.2026

## Auftrag

Implementiere ausschließlich Inkrement 4b als vollständigen vertikalen,
synthetischen Development-Inkrement: einen bewusst einfachen
Beisetzungsprozess von Entwurf bis Abschluss. Die Produktentscheidungen sind
in `docs/requirements/burial-process-decisions.md` verbindlich bestätigt.
Unbekannte weitergehende Verwaltungsregeln werden nicht ergänzt.

Inkrement 4a ist technische Grundlage und wurde nach einer Korrekturrunde der
hierarchischen Auswahllisten manuell im Browser bestätigt. Seine
Friedhofsstruktur, vollständigen Kontextpfade, kaskadierenden Auswahlen,
Rollen- und Sicherheitsgrenzen bleiben erhalten.

## Arbeitsumgebung

- Repository und einziges Arbeitsverzeichnis:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`
- lokale Satzungsquelle, ausschließlich lesend:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`
- einzig zulässiges .NET-SDK:
  `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
- einzige Instanz für reale SQL-Prüfungen: `localhost\CEMARISDEV`

Die SQL-Testverbindung wird ausschließlich prozesslokal gesetzt und niemals
in Logs oder Dokumentation ausgegeben. Reale SQL-Tests dürfen nur temporäre
Datenbanken mit Präfix `Cemaris_IntegrationTests_*` anlegen. Vor jeder
Löschung sind Präfix und tatsächlich aufgelöster Datenbankname zu prüfen.
Vorhandene Benutzer- oder Produktdatenbanken bleiben unangetastet. Nach dem
Lauf muss `sys.databases` 0 solche temporären Datenbanken ausweisen.

EDWALT-Originale und externe Phase-2-/3-/4-Arbeitsbereiche sind außerhalb des
Auftrags. Keine Phase-5-Wurzel und keine anderen externen Arbeitsverzeichnisse
anlegen.

## Verbindlicher Arbeitsbeginn

Vor jeder Änderung vollständig lesen:

1. `README.md` und `SECURITY.md`;
2. `docs/implementation/README.md`;
3. `docs/implementation/cemaris-increment-4a-completion.md`;
4. dieses Dokument;
5. `docs/requirements/README.md`;
6. `docs/requirements/burial-process-decisions.md`;
7. `docs/requirements/cemetery-master-data-decisions.md`;
8. `docs/requirements/case-record-write-decisions.md`;
9. `docs/requirements/identity-authorization-audit-decisions.md`;
10. `docs/architecture/cemetery-master-data.md`;
11. `docs/architecture/authentication-authorization-audit.md`;
12. ADR-0007, ADR-0009, ADR-0010, ADR-0011, ADR-0012, ADR-0013 und ADR-0014.

Danach sämtliche von 4b betroffenen Quell-, Konfigurations-, Migrations- und
Testdateien vollständig lesen. Dazu gehören insbesondere bestehende
Fallakten-, Verstorbenen-, Beisetzungs-, Grabstellen-, Akteurs-, ETag-, Store-,
API-, OpenAPI- und React-Verträge.

Vor jeder Änderung prüfen:

- Branch und HEAD;
- Upstream einschließlich Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich Inhalt.

Nach dem angekündigten 4a-Commit sollte der Arbeitsbaum sauber sein. Falls
dennoch Änderungen vorliegen, sind sie als fremde Arbeit vollständig zu lesen
und zu erhalten. Nichts verwerfen, überschreiben, stagen oder committen. Im
gesamten Auftrag keine Commits durchführen.

Vor der Implementierung alle Baseline-Prüfungen ausführen: Release-Build,
Unit-Tests, reguläre Integrationstests, reale SQL-Suite, Formatprüfung,
`npm ci`, Frontendtests, Lint und Produktionsbuild.

## Verbindliches Fachmodell

### Zustände und Übergänge

Neue Beisetzungen durchlaufen:

`Entwurf → Geplant → Bestätigt → Durchgeführt → Abgeschlossen`.

Zulässig sind genau:

- Entwurf → Geplant;
- Geplant → Entwurf;
- Geplant → Bestätigt;
- Bestätigt → Geplant;
- Bestätigt → Durchgeführt;
- Durchgeführt → Abgeschlossen;
- Abgeschlossen → Durchgeführt zur ausdrücklichen Korrektur.

Kein freies Statusfeld, keine Sprünge, keine Löschung, kein Storno, keine
Umbettung. Ein Rückschritt entfernt vorhandene Datumswerte nicht automatisch.

### Beziehungen und Daten

Eine neue 4b-Beisetzung besitzt:

- stabile serverseitige GUID;
- Fallakten-ID;
- genau eine `DeceasedPersonId` derselben Fallakte;
- genau eine kanonische `GraveSiteId`;
- Prozessstatus;
- optionalen Planungstag `DateOnly`;
- optionalen tatsächlichen Beisetzungstag `DateOnly`;
- starke Versionierung über die bestehende Fallversion.

Eine Fallakte darf mehrere Verstorbene und Beisetzungen enthalten. Eine
verstorbene Person darf in 4b höchstens eine Beisetzung besitzen. Person und
Grabstelle sind bereits im Entwurf Pflicht. Der Planungstag ist ab `Geplant`,
der tatsächliche Tag ab `Durchgeführt` Pflicht. `Abgeschlossen` führt keine
weiteren Pflichtfelder ein.

Sofern Werte vorhanden sind gilt Geburt ≤ Tod ≤ tatsächlicher Beisetzungstag.
Der tatsächliche Tag darf nicht in der Zukunft liegen. Der Planungstag darf in
der Zukunft liegen. Es gibt keine Uhrzeiten oder Zeitzonen.

### Bestehende Altzeilen

Die vorhandene `ReadBurials.BurialDate` bleibt kompatibel erhalten und wird im
4b-Code als tatsächlicher Beisetzungstag interpretiert. Additiv ergänzen:

- nullable Prozessstatus;
- nullable Planungstag;
- nullable `GraveSiteId` mit sicherem Fremdschlüssel;
- optional notwendige weitere technische Felder ohne fachliche Umdeutung.

Vorhandene Zeilen mit nullable Personenbezug, Datum oder Prozessstatus bleiben
lesbar. Keinen Status, keine Person und keine Grabstelle automatisch raten.
Bei ausdrücklicher Übernahme in den 4b-Prozess gelten alle Zielzustandsregeln.

### Grabstellenkopplung

Fallmutation, möglicher Grabstellenstatus, Fallversion und sparsamer
Änderungsnachweis sind eine atomare Transaktion beziehungsweise im
synthetischen Provider eine äquivalente atomare Operation:

- nach `Bestätigt`: `Frei` wird `Reserviert`; `Reserviert`/`Belegt` bleiben;
- nach `Durchgeführt`: `Frei`/`Reserviert` werden `Belegt`; `Belegt` bleibt;
- wird die Grabstelle einer bereits bestätigten beziehungsweise nach
  Wiederöffnung durchgeführten Beisetzung kontrolliert korrigiert, erhält die
  neue Grabstelle atomar mindestens `Reserviert` beziehungsweise `Belegt`;
  die alte Grabstelle wird nicht automatisch zurückgestuft;
- Rückschritte stufen den Grabstatus nie automatisch zurück;
- beim Bestätigen Aktivität, vollständige aktive Hierarchie,
  Friedhofs-Grabarten-Zuordnung und Sperre erneut prüfen;
- eine spätere Sperre oder Deaktivierung erhält den bestehenden Bezug und darf
  die Dokumentation einer tatsächlich durchgeführten Beisetzung nicht
  verhindern;
- keine Soll-Kapazität berechnen oder erzwingen.

Die Store-Grenze muss die gemeinsame Atomarität tatsächlich garantieren. Eine
lose Folge aus Fallstore- und Stammdatenstore-Aufrufen ohne gemeinsame
Transaktion ist unzulässig. Für SQL ist eine gemeinsame EF-/Transaktionsgrenze,
für Synthetic ein gemeinsamer Lock mit Rollbackverhalten zu verwenden.

### Korrektur

- Entwurf und Planung sind kontrolliert editierbar.
- Für Änderungen an bestätigten Planungsangaben zuerst nach `Geplant`
  zurückgehen.
- `Abgeschlossen → Durchgeführt` ist eine ausdrücklich beschriftete,
  bestätigungspflichtige Wiederöffnung.
- Nach Wiederöffnung dürfen tatsächlicher Tag, Person oder Grabstelle
  kontrolliert korrigiert und anschließend erneut abgeschlossen werden.
- Keine Korrektur umgeht ETag/If-Match, Akteurszuordnung oder atomaren
  Änderungsnachweis.

### Personendubletten

Beim Anlegen einer verstorbenen Person innerhalb derselben Fallakte mögliche
Dubletten serverseitig prüfen. Der Vergleich normalisiert Namen; fehlende
Datumswerte widerlegen einen Treffer nicht, widersprechende vorhandene
Geburts- oder Sterbedaten schon. Mindestens ein Namensbestandteil muss für
einen Treffer vorhanden sein.

Ohne Bestätigung antwortet der Server teilwirkungsfrei mit einem
maschinenlesbaren Konflikt und den minimal notwendigen Kandidaten-IDs/-
Anzeigedaten. Die UI erhält Eingaben, zeigt den Hinweis und bietet eine
ausdrücklich beschriftete Bestätigung. Ein zweiter Request mit
`confirmPossibleDuplicate=true` wird serverseitig erneut geprüft und darf die
zweite Person anlegen. Keine globale Freigabe und keine rein clientseitige
Prüfung.

## Application, Store und Migration

- Domainzustände und Übergänge zentral modellieren und unit-testen.
- Einen eindeutigen Application-Service für Anlage, Bearbeitung, Übergänge,
  Wiederöffnung und Dublettenbestätigung schaffen.
- Fachfehler typisiert in stabile HTTP-Antworten übersetzen.
- Genau einen atomaren providerneutralen Store-Vertrag für eine
  Beisetzungsprozessmutation verwenden; keine verteilte Teilwirkung.
- SQL-Constraints und eindeutiger gefilterter Index sichern höchstens eine
  Beisetzung pro `DeceasedPersonId`, ohne nullable Altzeilen zu beschädigen.
- Die neue Migration regulär mit EF erzeugen; keine handgeschriebene
  Designer-/Snapshot-Abkürzung.
- Migration von jeder vorhandenen Vorgängerversion testen, besonders direkt
  von `20260813104713_AddCemeteryMasterData` und mit einer repräsentativen
  legacy `ReadBurials`-Zeile.
- Synthetischer und SQL-Provider müssen dasselbe beobachtbare Verhalten haben.

## API, Sicherheit und Capability

Eine unabhängige Konfiguration
`Features:BurialProcessEditingEnabled` einführen:

- Standard `false` in allen versionierten Einstellungen;
- nur `Development`;
- nur synthetische Fachdaten;
- unabhängig von `CaseEditingEnabled` und
  `CemeteryMasterDataEditingEnabled`;
- Systeminfo/OpenAPI/UI weisen die Capability aus;
- unsichere Aktivierung verhindert den Prozessstart.

Beide Rollen verwenden eine explizite serverseitige Fachpolicy. Jede Mutation
verlangt Authentifizierung, sichere Cookie-Sitzung, CSRF und starkes
`If-Match`. Fehlend: 428; veraltet: 412; unzulässiger Übergang oder
Fachkonflikt: stabiler Problem-Details-Vertrag ohne Teilwirkung.

Der bestehende einfache `POST`-/`PUT`-Beisetzungspfad darf bei aktiver
4b-Capability kein Bypass sein. Entweder wird er dann ausdrücklich deaktiviert
oder vollständig auf denselben 4b-Service und dieselben Regeln geführt.
Bestehende 4a- und Fallakten-Capabilities bleiben ansonsten unabhängig.

Neue Fallakten-Änderungsoperationen differenzieren mindestens Anlage,
Faktenänderung, jeden Prozessübergang und Wiederöffnung. Der Nachweis speichert
keine vollständigen Fachpayloads. Keine Audit-/Betreiberlog-API und keine
entsprechende Oberfläche.

OpenAPI dokumentiert Zustände, Pflichtangaben, ETag/If-Match,
Dublettenbestätigung, Fehlerantworten und Sicherheitsanforderungen vollständig.

## React-Oberfläche

- Beisetzungen als klar getrennte Karten innerhalb der Fallakte darstellen.
- Status als verständliche Fortschrittsanzeige, nicht als frei editierbares
  Select.
- Primäre Schaltfläche für den nächsten Schritt; kontrollierte Rückschritte
  separat und eindeutig beschriften.
- Entwurf mit Person- und kanonischer Grabstellenauswahl anlegen.
- Nur aktive, nicht gesperrte und vollständig auswählbare Grabstellen für neue
  Zuordnungen anbieten; vollständige Strukturpfade aus 4a anzeigen.
- Planungstag und tatsächlichen Tag nur passend zum Prozess erklären und
  serverseitige Pflichtfehler zugänglich anzeigen.
- Wiederöffnung von `Abgeschlossen` verlangt eine explizite Bestätigung.
- Bei 412 alle lokalen Eingaben erhalten und kontrolliertes Neuladen anbieten.
- Dublettenhinweis zeigt minimale Kandidatenangaben, erhält alle Eingaben und
  erfordert einen bewusst beschrifteten zweiten Schritt.
- Deaktivierte oder gesperrte bestehende Referenzen sichtbar halten und
  verständlich kennzeichnen.
- Kernformulare tastaturbedienbar, beschriftet und mit sinnvollen Live-/
  Fehlerregionen versehen.

## Verbindliche Tests

Mindestens abdecken:

- alle zulässigen Übergänge und jeden unzulässigen Sprung/Rückschritt;
- Pflichtfelder je Zustand;
- Geburt/Tod/tatsächlicher Tag und Zukunftsgrenzen über injizierbare Zeit;
- genau eine Beisetzung je verstorbener Person;
- Personen- und kanonische Grabstellenreferenzen;
- Statuskopplung Frei → Reserviert → Belegt;
- keine automatische Rückstufung bei Prozessrückschritten;
- Verhalten bei deaktivierter/gesperrter Grabstelle vor Bestätigung und nach
  bestehender Verknüpfung;
- mögliche Personendublette, teilwirkungsfreie Warnung und bewusste
  Bestätigung;
- beide Rollen sowie 401/403;
- CSRF und deaktivierte/unsicher konfigurierte Capability;
- fehlendes, schwaches und veraltetes If-Match;
- Parallelität mit genau einem Gewinner;
- erzwungener Persistenzfehler mit Rollback von Beisetzung, Grabstellenstatus,
  Fallversion und Änderungsnachweis;
- Altzeilen und Migration von jeder vorhandenen Vorgängerversion;
- reale SQL-Tests auf der allein zugelassenen Instanz;
- OpenAPI-Vertrag und Abwesenheit einer Auditoberfläche;
- Frontendzustände, Pfadauswahl, Konflikterhalt, Dublettenbestätigung,
  Wiederöffnung und grundlegende Barrierefreiheit.

## Ausdrücklich außerhalb von 4b

- Uhrzeiten und Zeitzonen;
- Unterlagen, Checklisten oder EDWALT-Prozessnachbildung;
- Ressourcenverwaltung und Terminkollisionen;
- Umbettung, fachliches Storno und Löschen von Beisetzungen;
- automatische Grabnummerierung;
- automatische Kapazitätsprüfung;
- Ruhe-, Nutzungs- oder Aufbewahrungsfristen;
- Nutzungsrechte und Wiedervorlagen;
- Gebühren, Bescheide, Formulare oder Dokumenterzeugung;
- Winyard-Integration;
- LDAP-Bind, -Anmeldung, -Import oder -Mapping;
- EDWALT-Importcode oder EDWALT-Mapping;
- echte Verwaltungsdaten;
- fachliche oder produktive Freigabe.

## Abschluss und Dokumentation

Im finalen unveränderten Arbeitsbaum vollständig ausführen:

- Release-Build mit 0 Warnungen/0 Fehlern;
- Unit-Tests;
- reguläre API-/Integrationstests;
- reale SQL-Suite;
- `.NET format --verify-no-changes`;
- `npm ci`;
- Frontendtests;
- Lint;
- Produktionsbuild;
- explizite OpenAPI-Prüfung;
- regulär erzeugtes idempotentes EF-Migrationsskript;
- Markdown-Link- und Tabellenprüfung;
- Secretprüfung ohne Ausgabe von Trefferwerten;
- `git diff --check`;
- vollständige finale Git-Prüfung einschließlich Inhalt aller
  unversionierten Dateien;
- Nachweis über `sys.databases`, dass keine temporäre Testdatenbank verblieb.

Die deutsche Architektur-, Anforderungs- und Implementierungsdokumentation
aktualisieren. Eine genaue Abschlussdokumentation für 4b und eine detaillierte
Folgeübergabe für den fachlich nächsten sicheren Inkrement erstellen. Keine
fachliche, datenschutzrechtliche, betriebliche oder umfassende produktive
Freigabe behaupten. Keine Commits durchführen.
