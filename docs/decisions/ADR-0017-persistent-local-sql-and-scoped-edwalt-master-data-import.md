# ADR-0017: Dauerhafte lokale SQL-Entwicklung und abgegrenzter EDWALT-Stammdatenimport

## Status

Accepted – 25.08.2026

## Kontext

Die kanonischen Cemaris-Modelle für lokale Konten, Friedhofsstruktur,
Grabarten, Grabstellen, Fälle, Beisetzungen, Beteiligte und Nutzungsrechte
besitzen bereits EF-Core-/SQL-Server-Persistenz. Der lokale Entwicklungsbetrieb
verwendet bisher trotzdem überwiegend den prozesslokalen synthetischen
Provider; mehrere schreibende Capabilities verweigern den Start mit dem
SQL-Provider ausdrücklich.

Für die weitere Entwicklung soll die bereits vorhandene lokale Datenbank
`Cemaris_Dev` den dauerhaften Cemaris-Zustand tragen. Friedhofsstruktur,
Grabarten und weitere dafür notwendige nicht personenbezogene Stammdaten
sollen kontrolliert aus der vorhandenen EDWALT-Arbeitskopie übernommen werden.
Personen-, Fall-, Beisetzungs- und Nutzungsrechtsdaten aus EDWALT sind nicht
Teil dieses Schritts; benötigte Personen- und Falldaten bleiben synthetisch,
werden aber für den lokalen Betrieb dauerhaft in SQL gespeichert.

Die freigegebene EDWALT-Arbeitswurzel lautet:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`

Sie enthält bestehende Analysephasen, Quellkopien, feste Satzextrakte und
Profiler. Die bisherigen Phasen und Quelldateien bleiben unverändert und
werden ausschließlich gelesen.

## Entscheidung

- `Cemaris_Dev` wird für den Projektverantwortlichen die dauerhafte lokale
  Development-Datenbank. Provider, Verbindung und Capabilities bleiben
  maschinenbezogene Konfiguration in User Secrets beziehungsweise
  Umgebungsvariablen; das portable Repository behält sichere Defaults und
  enthält keinen Connection String.
- Die vorhandenen EF-Stores werden für den vollständigen aktuellen
  Development-Funktionsumfang mit `ReadModel:Provider=SqlServer` Ende zu Ende
  freigegeben und auf Providerparität geprüft. Diese Entscheidung ist keine
  Produktivfreigabe und hebt die Development-Grenze nicht auf.
- Die lokalen Konten mit den festen Benutzernamen `admin` und `sach` werden
  einmalig in `Cemaris_Dev` angelegt und danach erhalten. `admin` erhält
  `Administration`, `sach` erhält `Sachbearbeitung`. Es gibt keine eingebauten
  oder dokumentierten Defaultpasswörter; beide Passwörter müssen die
  Sicherheitsrichtlinie erfüllen und aus einem lokalen Secret Store stammen.
  Normale Starts und wiederholte Migrationen setzen Konten oder Passwörter
  nicht zurück.
- Der EDWALT-Import wird zunächst ausschließlich für nicht personenbezogene
  Friedhofsstammdaten fortgesetzt. Zulässige Zielgruppen sind Friedhöfe,
  bestätigte räumliche Hierarchieebenen, Grabarten,
  Friedhof-Grabart-Zuordnungen und Grabstellen. Nicht belegte Hierarchie- oder
  Beisetzungsformregeln werden nicht geraten.
- `W005`/`W005dm` dürfen nur für bestätigte Friedhofs- und
  Grabartenstammdaten ausgewertet werden. Aus `W020` darf in diesem Schritt nur
  der bestätigte Struktur-/Grabstellenbezug gelesen werden. Personen-,
  Adress-, Rechte-, Notiz-, Vorgangs-, Gebühren- und Freitextbereiche werden
  weder dekodiert noch importiert oder protokolliert.
- Parser, Mapping, Dry-run, Load und Reconciliation werden versioniert und
  automatisiert. Quellkopien, Extrakte, Klartextwerte, Berichte mit lokalen
  Stammdaten und Secrets bleiben außerhalb von Git. Der Import ist
  wiederholbar, transaktional und durch den exakt aufgelösten Datenbanknamen
  `Cemaris_Dev` geschützt. Ein erneuter Lauf erzeugt keine Dubletten und löscht
  keine fachlich vorhandenen Daten.
- Automatisierte Tests verwenden weiterhin synthetische Daten und entweder
  den synthetischen Provider oder eindeutig benannte temporäre SQL-Datenbanken.
  `CEMARIS_SQL_TEST_CONNECTION_STRING` darf niemals auf `Cemaris_Dev` zeigen.
  Die dauerhafte lokale Datenbank wird nicht von Test-Fixtures erstellt,
  geleert oder gelöscht.

## Folgen

Die frühere Pause aus ADR-0009 endet nur für diesen eng abgegrenzten
Stammdatenpfad. Die Grundentscheidung, Cemaris nicht nach EDWALT zu modellieren
und unbekannte Regeln nicht aus dem Altverfahren abzuleiten, bleibt gültig.
Personen- und Fallmigration, Gebühren, Bescheide, Dokumente, Fristen,
Nutzungsrechte und produktiver Cutover bleiben außerhalb.

Für die Umsetzung ist ein neues Inkrement erforderlich: Es muss die
SQL-Providergrenzen prüfen und anpassen, ein datensparsames Importwerkzeug
bereitstellen, die lokale Konfiguration dokumentieren, `Cemaris_Dev` additiv
migrieren, die beiden dauerhaften Konten sicher einrichten und den
Stammdatenimport mit technischen Summen und referenzieller Integrität
nachweisen.

Die lokale Persistenz realer Friedhofsstammdaten ändert nicht die
Repositoryregel: Quellwerte werden weder in Tests noch in Snapshots,
Dokumentation, Logs oder Commits aufgenommen.

## Nicht entschieden

- produktive Betriebs-, Datenschutz- oder Fachfreigabe;
- EDWALT-Personen-, Fall-, Beisetzungs-, Rechte-, Gebühren- oder
  Dokumentmigration;
- automatische Ableitung bislang unbestätigter Hierarchieebenen,
  Beisetzungsformen, Fristen, Kapazitäten oder Status;
- automatisches Zurücksetzen oder Neuanlegen der lokalen Benutzer bei jedem
  Start;
- Änderung des sicheren, portablen Repository-Defaults für andere Entwickler
  oder CI.
