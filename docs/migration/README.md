# Strategie für die EDWALT-Datenmigration

> **Status:** Die Migration fachlich relevanter EDWALT-Daten nach Cemaris ist
> bestätigtes Projektziel. Auch historische Fälle sind einzubeziehen; maßgeblich
> sind die Betriebsnotwendigkeit und die Vermeidung umfangreicher manueller
> Nacherfassung. Notizen sind ausgeschlossen (`INT-003`, `INT-006`, `INT-007`).
> Vorhandene Akten, Bescheide und Schreiben werden nicht nach Cemaris migriert,
> sondern verbleiben an ihren heutigen Ablageorten (`INT-024`).
> EDWALT bleibt während der Cemaris-Einführung vorübergehend als lesende
> Rückfallebene verfügbar, bis Cemaris zuverlässig funktioniert
> (`INT-025/026`).
> Der strukturierte historische Krematoriumsbestand ist trotz heutiger
> Nichtnutzung Teil der Datenmigration (`INT-027`).
> Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge sind von
> der Migration ausgeschlossen (`INT-028`).
> Bei einem gültigen Nachfolger wird nur die aktuelle Nummer übernommen;
> frühere Nummern werden nicht als Such- oder Historienkennung migriert
> (`INT-029`).
> Aus EDWALT werden Bescheidnummer, Gebührenpositionen, festgesetzter Betrag,
> Fälligkeit und Fallbezug migriert. Zahlungsstatus und Mahnungen verbleiben im
> führenden FINANZ+ und werden nicht aus EDWALT übernommen (`INT-030`).
> Der erste kontrollierte Migrationstest dient der Abnahme der lesenden Suche
> und Detailansicht. Echte EDWALT-Daten bleiben dabei lokal und geschützt; im
> Repository und in allgemeinen Entwicklungstests werden ausschließlich
> synthetische Daten verwendet (`INT-035`).
> Die Quellartefakte sind technisch read-only inventarisiert; Satzlayout,
> fachliche Schlüssel, weitere Ausschlüsse und ein fachliches Cemaris-Zielmodell
> sind weiterhin nicht bekannt.

Die konkrete
[EDWALT-Quellenanalyse](edwalt-source-analysis.md) dokumentiert 24 vollständige
DAT/IDX-Paare, technische Extraktionsrisiken, historische Varianten und die
vor einer Profilierung zu klärenden P0-Fragen. **EDWALT** ist die kanonische
Bezeichnung; **EDWALT3** bezeichnet dasselbe Produkt beziehungsweise die
untersuchte Version (`INT-001`, `BESTÄTIGT`, Konfidenz hoch).

## Grundprinzip

> Eine Migration darf erst entwickelt werden, nachdem Quell- und Zieldatenmodell fachlich verstanden wurden.

Technischer Zugriff auf Tabellen allein erklärt weder deren Bedeutung noch historische Sonderfälle. Mappingentscheidungen benötigen deshalb fachliche Eigentümer, nachvollziehbare Quellen und Abnahmekriterien.

EDWALT-Masken, Module und Dateistrukturen sind Quellenbelege für Datenbedeutung
und Historie, aber keine Vorlage für den Cemaris-Funktionsumfang oder ein
1:1-Zieldatenmodell (`INT-002`, `BESTÄTIGT`, Konfidenz hoch).

Der Migrationsgegenstand sind strukturierte EDWALT-Daten. Der vorhandene
Altbestand an Akten, Bescheiden und Schreiben wird weder kopiert noch
verschoben (`INT-024`, `REQ-MIG-001`, `BESTÄTIGT`, Konfidenz hoch). Diese
Abgrenzung ersetzt nicht die notwendige Regelung für dauerhafte Auffindbarkeit,
Lesbarkeit, Berechtigung und Aufbewahrung der getrennt verbleibenden Bestände.

Die geplante lesende EDWALT-Rückfallebene (`INT-025/026`, `REQ-MIG-002`) muss
für den Cutover technisch erst validiert werden. Eine schreibgeschützte Nutzung darf nicht
allein aus eingeschränkten Benutzerrechten abgeleitet werden: Das Altprogramm
kann für Indizes, Protokolle oder temporäre Dateien Schreibzugriffe benötigen.
Während dieser Bestandsaufnahme wird EDWALT weiterhin nicht ausgeführt.

## Während der Bestandsanalyse zu erheben

### Technische Quelle

- Datenbanktyp, Produktversion, Instanzen und Schemas,
- Tabellen, Views, Beziehungen und gespeicherte Prozeduren,
- Primärschlüssel, Fremdschlüssel, eindeutige Schlüssel und Nummernkreise,
- Datentypen, Zeichensätze, Collations, Datums- und Zeitdarstellung,
- Löschkennzeichen, Gültigkeitszeiträume und technische Statusfelder,
- Freitextfelder, strukturierte und unstrukturierte Inhalte,
- Dokumentpfade, Dateifreigaben, Binärdaten und externe Referenzen,
- Historien-, Protokoll- und Benutzerdaten,
- Lookup-Werte, lokale Konfigurationen und Herstelleranpassungen,
- Exportmöglichkeiten, Herstellerwerkzeuge und Herstellerunterstützung,
- Datenvolumen, Änderungsrate und erwartetes Wachstum.

### Fachliche Bedeutung

- Zweck und fachliche Eigentümerschaft jedes relevanten Bestands,
- Bedeutung von Schlüsseln, Nullwerten, Defaults und Sondercodes,
- Beziehungen, die technisch nicht als Fremdschlüssel abgesichert sind,
- Pflichtfelder im Alt- und späteren Zielprozess,
- fachlich führende Quelle bei widersprüchlichen Daten,
- Historie und Stichtagsbezug,
- Aufbewahrungs- und Löschanforderungen,
- nicht mehr verwendete, aber nachweispflichtige Daten,
- Zuordnung zu Dokumenten, Akten und Nebenlösungen.

### Datenqualität

- fehlende Pflichtwerte,
- ungültige oder widersprüchliche Datumswerte,
- Dubletten und abweichende Schreibweisen,
- verwaiste Referenzen,
- unbekannte Lookup-Werte,
- abgeschnittene oder falsch kodierte Texte,
- Freitext mit versteckter fachlicher Struktur,
- Test-, Schulungs- oder Altdaten in produktiven Beständen,
- manuelle Korrekturen und bekannte Workarounds.

## Migrationsphasen

### 1. Discovery

Quellen, Zugriffswege, Verantwortliche, Datenvolumen und technische Abhängigkeiten inventarisieren. Nur read-only und in abgestimmten Analyseumgebungen arbeiten.

### 2. Profiling

Statistische Profile und Qualitätsregeln mit datensparsamen Werkzeugen erstellen. Ausgaben enthalten möglichst Häufigkeiten und technische Schlüssel, keine unnötigen Klartext-Personendaten.

### 3. Fachliches Mapping

Für jedes Zielfeld Quelle, Transformation, Gültigkeitsbedingung, Konfliktregel, Historienbehandlung und fachlichen Abnehmer dokumentieren. Nicht zuordenbare Daten bleiben sichtbar offen.

| Mapping-ID | Quellobjekt/Feld | Fachliche Bedeutung | Zielfeld | Transformation | Qualitätsregel | Historie | Freigabe | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MAP-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | nicht begonnen |

### 4. Reproduzierbare Umsetzung

Migration als versionierten, wiederholbaren Prozess entwickeln. Extraktion, Transformation, Laden und Validierung werden getrennt protokolliert. Secrets und Datenextrakte gehören nicht in Git.

### 5. Probeläufe und Abnahme

Mehrere Probeläufe mit repräsentativen, kontrolliert bereitgestellten Daten durchführen. Technische Summen, fachliche Stichproben, die Abgrenzung zu nicht migrierten Dokumenten und definierte Sonderfälle prüfen. Abweichungen werden erklärt, nicht nur gezählt.

### 6. Cutover

Quellsperre oder Delta-Verfahren, Verantwortlichkeiten, Zeitplan, Kommunikation,
Backup, Rückfall und Freigabepunkte verbindlich planen. Zusätzlich den Übergang
in eine technisch abgesicherte lesende EDWALT-Rückfallebene festlegen. Ein
produktiver Cutover erfolgt nur nach dokumentierter Abnahme.

### 7. Nachkontrolle

Vollständigkeit, Datenqualität, die vereinbarte Abgrenzung zu Altakten und
zentrale Geschäftsabläufe nach dem Umstieg kontrollieren. Aufbewahrung und
Zugriff auf getrennte Altbestände sowie die Stilllegung des Altsystems separat
entscheiden.

## Validierung und Reconciliation

Mögliche technische Kontrollen, deren konkrete Eignung zu bestätigen ist:

- Datensatzanzahlen je fachlich erklärter Gruppe,
- Summen und Min-/Max-Daten,
- referenzielle Integrität,
- eindeutige und fehlende Schlüssel,
- Hashes unverändert übernommener Binärdateien,
- Stichproben fachlich kritischer und historischer Fälle,
- explizite Listen verworfener, korrigierter und nicht migrierbarer Datensätze.

Eine erfolgreiche technische Zeilenzahl ersetzt keine fachliche Abnahme.

## Sicherheit und Datenschutz

- Datenzugriffe genehmigen, minimieren und protokollieren.
- Analyse- und Migrationskonten mit geringstmöglichen Rechten betreiben.
- Extrakte verschlüsseln, befristen und kontrolliert löschen.
- Produktivdaten nicht auf Entwicklerarbeitsplätze oder in öffentliche CI übertragen.
- Logs und Fehlerdateien auf Personen- und Freitextdaten begrenzen.
- Berechtigung und Zweckbindung von Altdaten während Parallelbetrieb klären.

## Noch offen

- dokumentiertes Satzlayout/Copybooks oder ein garantiert lesender
  Herstellerexport für die EDWALT-DAT/IDX-Dateien,
- vollständiger Quellumfang einschließlich Nebenbeständen,
- fachliches Cemaris-Zielmodell,
- Migrationspflicht und Aufbewahrung je Datenart,
- dauerhafte Auffindbarkeit, Lesbarkeit, Berechtigung und Aufbewahrung der nicht
  migrierten Akten, Bescheide und Schreiben,
- Qualitäts- und Abnahmeschwellen,
- Migrationsfenster, Delta und Rückfall,
- Verantwortliche für technische und fachliche Freigabe.
