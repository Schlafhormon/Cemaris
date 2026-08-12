# Cemaris-Implementierungsplan

Stand: 12.08.2026

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
| 2 | Schreibende Fallakten-Grundlage | Grabstellenbezug, Verstorbene und Beisetzungen als manuell erfasste Tatsachen anlegen und ändern; keine Löschung oder Ableitung | zunächst nur Development und synthetische Daten |
| 3 | Identität, produktive Berechtigungen und Audit | abgesicherter Schreibbetrieb für Sachbearbeitung und Administration | Identitätsquelle, Rechte- und Auditmatrix |
| 4 | Fachliche Stammdaten und vollständiger Beisetzungsprozess | Friedhöfe/Felder, Grabarten, Prozessschritte und Prüfungen | Anwenderinterview, Satzungs- und Prozessfreigabe |
| 5 | Personenrollen, Nutzungsrechte, Ruhefristen und Wiedervorlagen | fachlich freigegebene Rechte- und Fristenlogik | Rollen-, Historien- und Fristregeln |
| 6 | Gebühren, Bescheide und Dokumente | Kataloge, Berechnung, Korrektur und Erzeugung | Gebühren-/Satzungsstände, Dokument- und Freigaberegeln |
| 7 | optionale Winyard-Integration und Auswertungen | entkoppelter DMS-Adapter und priorisierte Berichte | Herstellervertrag, Metadaten, Fehler- und Betriebsregeln |
| 8 | EDWALT-Mapping, Import, Probeläufe und Cutover | kontrollierte Bestandsübernahme und Abnahme | abgeschlossene Quellregeln, Datenschutz und Zielmapping |

Die Reihenfolge beschreibt den derzeit sichersten Pfad. Kleine vorbereitende
Arbeiten dürfen vorgezogen werden, wenn sie keine offenen Fachentscheidungen
vorwegnehmen. Eine produktive Freigabe erfolgt erst, wenn die jeweiligen
Sicherheits-, Datenschutz-, Betriebs- und Fachgates erfüllt sind.

## Nächster ausführbarer Auftrag

Der vollständige Arbeitsauftrag für Inkrement 2 steht in
[Übergabe: schreibende Fallakten-Grundlage](cemaris-case-record-write-next-step-handoff.md).
Er ist eigenständig formuliert und enthält Arbeitsverzeichnisse, Schutzregeln,
Scope, Abnahmekriterien und einen direkt kopierbaren Prompt für einen neuen
kontextlosen Chat.

## Bewusst nicht mit dem nächsten Inkrement behauptet

- keine Produktivreife oder Freigabe für echte personenbezogene Daten;
- kein abschließendes Cemaris-Fach- oder Datenmodell;
- keine fachliche Berechnung von Ruhe-, Nutzungs- oder Zahlungsfristen;
- keine Gebührenfestsetzung, Bescheiderzeugung oder Winyard-Ablage;
- keine Storno-, Lösch-, Umnummerierungs- oder Historienregel;
- kein EDWALT-Import oder Quell-zu-Ziel-Mapping.
