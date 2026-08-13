# Cemaris-Implementierungsplan

Stand: 13.08.2026

## Aktueller Schwerpunkt

Cemaris wird jetzt als eigenständige Fachsoftware inkrementell weitergebaut.
Die EDWALT-Migrationsanalyse ist nach der reproduzierbar abgeschlossenen Phase
4 kontrolliert pausiert. Sie bleibt erforderlich, blockiert aber nicht mehr
die Produktentwicklung. Grundlage ist
[ADR-0009](../decisions/ADR-0009-product-development-before-edwalt-import.md).

Der vorhandene erste Inkrement ist ein technisch abgeschlossener, aber noch
nicht fachlich oder produktiv freigegebener Read-only-MVP mit:

- gemeinsamer Suche und Detailansicht;
- synthetischem Standardprovider;
- optionalem SQL-Server-Lesemodell und EF-Migration;
- ASP.NET-Core-API, React-Oberfläche sowie Unit- und Integrationstests.

Auch Inkrement 2 ist technisch abgeschlossen. Die standardmäßig deaktivierte
Development-Funktion kann synthetische Fallakten anlegen und Grabstellenbezug,
verstorbene Personen sowie Beisetzungen mit ETag/If-Match ändern. Domain,
Application, prozesslokaler synthetischer Store, SQL-Server-Persistenz, API, React-UI
und automatisierte Tests verwenden denselben Vertrag. Eine Produktivfreigabe
ist damit ausdrücklich nicht verbunden.

Inkrement 3a ist ebenfalls technisch abgeschlossen. Ein providerneutraler
Akteursvertrag liefert dem Fallaktenservice genau einen fest serverseitig
definierten synthetischen Development-Akteur. Falländerung, Version, letzte
Zuordnung und datensparsamer Auditdatensatz werden im synthetischen und im
SQL-Store atomar gespeichert. Detail und Bearbeitung zeigen die letzte
Änderung. Migration und SQL-Parallelität wurden gegen eine temporäre Datenbank
auf `CEMARISDEV` verifiziert. Dies ist weiterhin keine produktive Identität,
Berechtigung oder Freigabe.

Inkrement 3b ist technisch abgeschlossen. Lokale SQL-Konten,
frameworkgehashte Passwörter, sichere Cookie-Sitzungen, Antiforgery,
Security-Stamp-Prüfung und benannte Policies schützen die vorhandenen
Fachoperationen. Beide Rollen dürfen Facharbeit ausführen; ausschließlich
`Administration` verwaltet Benutzer. Der authentifizierte lokale Benutzer wird
atomar als Änderungsakteur gespeichert. Migration und Parallelitätsgrenzen
wurden auf `CEMARISDEV` verifiziert. Datenschutz- und Betriebsfreigabe bleiben
offen.

## Verbindliche Entwicklungsregel

„Fertig“ bezeichnet immer einen klar abgegrenzten, Ende-zu-Ende getesteten
Inkrement und niemals die unbelegte Behauptung, die gesamte Fachsoftware sei
fertig. Unbekannte kommunale oder rechtliche Regeln werden nicht geraten.
Technische Erweiterungspunkte dürfen vorbereitet werden; produktive Rechte,
Berechnungen oder Automatismen benötigen eine dokumentierte Fachentscheidung.

## Inkrementfolge

| Reihenfolge | Inkrement | Ergebnis | Freigabegate |
| ---: | --- | --- | --- |
| 1 | Lesende Suche und Detailansicht | technisch umgesetzt | fachliche Abnahme mit kontrolliertem Testbestand später |
| 2 | Schreibende Fallakten-Grundlage | technisch umgesetzt: Grabstellenbezug, Verstorbene und Beisetzungen als manuell erfasste Tatsachen anlegen und ändern; keine Löschung oder Ableitung | erfüllt nur für Development und synthetische Daten; keine Produktivfreigabe |
| 3a | Providerneutrale Änderungszuordnung und Auditgrundlage | technisch umgesetzt und gegen `CEMARISDEV` verifiziert: atomarer Änderungsnachweis und Anzeige der letzten Änderung für den synthetischen Development-Pfad | erfüllt nur für Development und synthetische Daten; keine Produktivfreigabe |
| 3b | Lokale Identität und Berechtigungsgrundlage | technisch umgesetzt und gegen `CEMARISDEV` verifiziert: lokale Konten, sichere Sitzungen, geschützte Fachfunktionen und administrative Benutzerverwaltung | technische Abnahme erfüllt; Datenschutz- und Betriebsfreigabe stehen aus |
| 4 | Fachliche Stammdaten und vollständiger Beisetzungsprozess | Friedhöfe/Felder, Grabarten, Prozessschritte und Prüfungen | Anwenderinterview, Satzungs- und Prozessfreigabe |
| 5 | Personenrollen, Nutzungsrechte, Ruhefristen und Wiedervorlagen | fachlich freigegebene Rechte- und Fristenlogik | Rollen-, Historien- und Fristregeln |
| 6 | Gebühren, Bescheide und Dokumente | Kataloge, Berechnung, Korrektur und Erzeugung | Gebühren-/Satzungsstände, Dokument- und Freigaberegeln |
| 7 | optionale Winyard-Integration und Auswertungen | entkoppelter DMS-Adapter und priorisierte Berichte | Herstellervertrag, Metadaten, Fehler- und Betriebsregeln |
| 8 | EDWALT-Mapping, Import, Probeläufe und Cutover | kontrollierte Bestandsübernahme und Abnahme | abgeschlossene Quellregeln, Datenschutz und Zielmapping |

Die Reihenfolge beschreibt den derzeit sichersten Pfad. Kleine vorbereitende
Arbeiten dürfen vorgezogen werden, wenn sie keine offenen Fachentscheidungen
vorwegnehmen. Eine produktive Freigabe erfolgt erst, wenn die jeweiligen
Sicherheits-, Datenschutz-, Betriebs- und Fachgates erfüllt sind.

## Nächstes Freigabegate

Lokale Konten sind am 13.08.2026 als Standard bestätigt worden. Ein späterer
LDAP-Ausbau soll Konten importieren oder synchronisieren, wird aber nicht im
nächsten Inkrement umgesetzt. `Sachbearbeitung` und `Administration` dürfen
fachliche Daten erfassen und bearbeiten, einschließlich künftiger
Stammdatenpflege. Benutzerverwaltung, administrative Programmkonfiguration
und Formularvorlagen bleiben `Administration` vorbehalten. Vollständige
Auditdaten erhalten keine Cemaris-Oberfläche.

Inkrement 3b ist gemäß
[Abschlussdokumentation](cemaris-local-identity-authorization-completion.md)
technisch abgenommen. Der nächste eigenständige Auftrag ist die
[fachlich freizugebende Stammdaten- und Beisetzungsgrundlage](cemaris-increment-4-next-step-handoff.md).
Solange die weiterhin offenen fachlichen, Datenschutz- und Betriebsgates
fehlen, bleibt der Schreibpfad Development-only, synthetisch und standardmäßig
deaktiviert.

## Bewusst nicht mit dem nächsten Inkrement behauptet

- keine Produktivreife oder Freigabe für echte personenbezogene Daten;
- kein abschließendes Cemaris-Fach- oder Datenmodell;
- keine fachliche Berechnung von Ruhe-, Nutzungs- oder Zahlungsfristen;
- keine Gebührenfestsetzung, Bescheiderzeugung oder Winyard-Ablage;
- keine Storno-, Lösch-, Umnummerierungs- oder Historienregel;
- kein EDWALT-Import oder Quell-zu-Ziel-Mapping.
