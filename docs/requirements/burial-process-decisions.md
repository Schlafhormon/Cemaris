# Produktentscheidungen zum Beisetzungsprozess in Inkrement 4b

Stand: 13.08.2026

## Zweck und Freigabegrenze

Dieses Dokument definiert den verbindlichen technischen Produktumfang von
Inkrement 4b. Quelle ist `USR-2026-08-13-INCREMENT-4B`, die Entscheidung der
Projektverantwortung vom 13.08.2026. Die Regeln ermöglichen einen
vorstellbaren, ausschließlich synthetischen Development-Inkrement. Sie
ersetzen keine spätere fachliche Abnahme durch die Friedhofsverwaltung und
keine Datenschutz-, Sicherheits-, Betriebs- oder Produktivfreigabe.

Unbestätigte EDWALT-Abläufe sind kein Sollprozess. In 4b werden weder
EDWALT-Prüflisten noch Unterlagen, Ressourcen oder Terminkollisionen
nachgebildet.

## Einfaches Prozessmodell

Eine Beisetzung durchläuft genau diese fünf Zustände:

1. `Entwurf`;
2. `Geplant`;
3. `Bestätigt`;
4. `Durchgeführt`;
5. `Abgeschlossen`.

Die Oberfläche führt primär mit einer eindeutigen Aktion zum nächsten
Zustand. Ein Rückschritt ist nur dort sichtbar, wo er fachlich zugelassen ist.
Es gibt keine freie Statusauswahl und keinen Sprung über Zustände hinweg.

| Ausgang | zulässiges Ziel | Zweck |
| --- | --- | --- |
| Entwurf | Geplant | Planungstag festlegen |
| Geplant | Entwurf | Planung kontrolliert zurücknehmen |
| Geplant | Bestätigt | Planung verbindlich bestätigen |
| Bestätigt | Geplant | Bestätigung kontrolliert zurücknehmen |
| Bestätigt | Durchgeführt | tatsächliche Durchführung erfassen |
| Durchgeführt | Abgeschlossen | Vorgang fachlich abschließen |
| Abgeschlossen | Durchgeführt | ausdrücklich zur Korrektur wieder öffnen |

Andere Übergänge werden serverseitig teilwirkungsfrei abgelehnt. Es gibt in
4b weder Storno, Löschung noch Umbettung. Ein Rückschritt löscht keine bereits
erfassten Datumswerte automatisch.

## Beziehungen und Pflichtangaben

| ID | Entscheidung | Akzeptanzkern |
| --- | --- | --- |
| `REQ-BUR-001` | Eine Fallakte darf mehrere Verstorbene und mehrere Beisetzungen enthalten. | Die bestehende Fallakten-ID bleibt der gemeinsame technische Rahmen. |
| `REQ-BUR-002` | Jede neue Beisetzung referenziert genau eine verstorbene Person derselben Fallakte und genau eine kanonische Grabstelle. | Freie Grabtexte oder fehlende Referenzen sind für neue 4b-Datensätze unzulässig. |
| `REQ-BUR-003` | Eine verstorbene Person besitzt in 4b höchstens eine Beisetzung. | Die Eindeutigkeit wird in Application und SQL durchgesetzt; Umbettungen sind ausgeschlossen. |
| `REQ-BUR-004` | `Sachbearbeitung` und `Administration` dürfen alle fachlichen Beisetzungsoperationen ausführen. | Jede Operation bleibt serverseitig durch eine eigene Fachpolicy geschützt. |
| `REQ-BUR-005` | Person und Grabstelle sind ab Anlage des Entwurfs Pflicht. | Neue Verknüpfungen erfordern aktive, nicht gesperrte auswählbare Stammdaten. Bestehende Referenzen bleiben später sichtbar. |
| `REQ-BUR-006` | Ein Planungstag ist ab `Geplant` Pflicht. | Es wird nur ein `DateOnly`-Wert ohne Uhrzeit oder Zeitzone gespeichert. |
| `REQ-BUR-007` | Der tatsächliche Beisetzungstag ist ab `Durchgeführt` Pflicht. | Es wird nur ein `DateOnly`-Wert gespeichert; der Tag liegt nicht in der Zukunft. |
| `REQ-BUR-008` | `Abgeschlossen` besitzt keine zusätzlichen Pflichtfelder. | Abschluss bestätigt den geprüften Stand; Unterlagen und Checklisten sind nicht Teil von 4b. |
| `REQ-BUR-009` | Sofern Werte vorliegen gilt Geburt ≤ Tod ≤ tatsächliche Beisetzung. | Ein Planungstag darf in der Zukunft liegen. Widersprüche werden serverseitig blockiert. |

Vorhandene technische Altzeilen mit nullable Personenbezug, nullable Datum
oder ohne Prozessstatus bleiben additiv lesbar. Ihr Zustand wird nicht
geraten. Sobald eine Altzeile in den 4b-Prozess übernommen wird, müssen Person,
kanonische Grabstelle und der gewählte Zielzustand vollständig validiert
werden.

## Grabstellenstatus

Prozess- und Grabstellenänderung erfolgen zusammen mit Fallversion und
Änderungsnachweis atomar:

- Übergang nach `Bestätigt`: eine `Frei`-Grabstelle wird `Reserviert`;
  `Reserviert` oder `Belegt` bleiben unverändert.
- Übergang nach `Durchgeführt`: `Frei` oder `Reserviert` werden `Belegt`;
  `Belegt` bleibt unverändert.
- Rückschritte und Wiederöffnung stufen eine Grabstelle niemals automatisch
  zurück. Dadurch werden mögliche weitere Beisetzungen derselben Grabstelle
  nicht fachlich umgedeutet.
- Soll-Kapazität wird weder berechnet noch automatisch geprüft.
- Aktivität und Sperre werden beim Übergang nach `Bestätigt` erneut geprüft.
  Eine spätere Deaktivierung oder Sperre vernichtet den bestehenden Bezug
  nicht und verhindert nicht, eine tatsächlich erfolgte Durchführung zu
  dokumentieren.

Das ist eine ausdrücklich bestätigte Statuskopplung, aber keine automatische
Kapazitäts- oder Belegungsentscheidung.

## Korrektur und Nebenläufigkeit

- Angaben in `Entwurf` und `Geplant` dürfen kontrolliert geändert werden.
- Eine bestätigte Planung wird für Planungsänderungen zuerst nach `Geplant`
  zurückgesetzt.
- Eine abgeschlossene Beisetzung wird über eine ausdrücklich beschriftete und
  bestätigte Aktion nach `Durchgeführt` wieder geöffnet; danach darf der
  tatsächliche Tag korrigiert und erneut abgeschlossen werden.
- Person oder Grabstelle einer bereits durchgeführten Beisetzung werden nicht
  still geändert. Dafür ist ebenfalls die ausdrückliche Wiederöffnung
  erforderlich.
- Jede Mutation verlangt eine aktuelle starke Fallversion über ETag und
  `If-Match`; bei Konkurrenz gewinnt genau eine Mutation.
- Fachänderung, gegebenenfalls Grabstellenstatus, neue Fallversion und
  sparsamer Änderungsnachweis sind atomar. Fehlversuche erzeugen keine
  Teilwirkung und keinen erfolgreichen Nachweis.

## Mögliche Personendubletten

Beim Anlegen einer verstorbenen Person prüft der Server innerhalb derselben
Fallakte normalisierte Namen und vorhandene Geburts-/Sterbedaten. Ein
möglicher Treffer ist ein Hinweis, kein dauerhaftes Verbot:

1. der erste Schreibversuch wird ohne Teilwirkung mit einem maschinenlesbaren
   Dublettenhinweis beantwortet;
2. die Oberfläche erhält alle Eingaben und zeigt die möglichen Treffer;
3. eine ausdrücklich beschriftete Bestätigung erlaubt denselben Datensatz;
4. der Server prüft beim bestätigten Schreibversuch erneut.

Ein bloßer clientseitiger Hinweis oder eine unbeschriftete Checkbox genügt
nicht. Die Bestätigung wird als Teil der konkreten Mutation behandelt; eine
allgemeine Dublettenfreigabe entsteht nicht.

## Bewusste Grenzen

- keine Uhrzeiten oder Zeitzonen;
- keine Unterlagen, Checklisten oder EDWALT-Prozessnachbildung;
- keine Ressourcenverwaltung oder Terminüberschneidungsprüfung;
- kein Storno, keine Umbettung und keine Löschung;
- keine automatische Kapazitätsprüfung;
- keine Ruhe-, Nutzungs- oder Aufbewahrungsfristen;
- keine Gebühren, Bescheide, Formulare oder Dokumenterzeugung;
- keine Winyard-, LDAP- oder EDWALT-Integration;
- keine echten Verwaltungsdaten und keine Produktivfreigabe.
