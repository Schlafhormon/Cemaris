# Strategie für die spätere EDWAL-Datenmigration

> **Status:** Planung der Analyse. Es ist weder ein EDWAL-Quellschema noch ein fachliches Cemaris-Zielmodell bekannt.

## Grundprinzip

> Eine Migration darf erst entwickelt werden, nachdem Quell- und Zieldatenmodell fachlich verstanden wurden.

Technischer Zugriff auf Tabellen allein erklärt weder deren Bedeutung noch historische Sonderfälle. Mappingentscheidungen benötigen deshalb fachliche Eigentümer, nachvollziehbare Quellen und Abnahmekriterien.

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

Mehrere Probeläufe mit repräsentativen, kontrolliert bereitgestellten Daten durchführen. Technische Summen, fachliche Stichproben, Dokumentreferenzen und definierte Sonderfälle prüfen. Abweichungen werden erklärt, nicht nur gezählt.

### 6. Cutover

Quellsperre oder Delta-Verfahren, Verantwortlichkeiten, Zeitplan, Kommunikation, Backup, Rückfall und Freigabepunkte verbindlich planen. Ein produktiver Cutover erfolgt nur nach dokumentierter Abnahme.

### 7. Nachkontrolle

Vollständigkeit, Datenqualität, DMS-Referenzen und zentrale Geschäftsabläufe nach dem Umstieg kontrollieren. Aufbewahrung beziehungsweise Stilllegung des Altsystems separat entscheiden.

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

- EDWAL-Datenbank und Herstellerzugriff,
- vollständiger Quellumfang einschließlich Nebenbeständen,
- fachliches Cemaris-Zielmodell,
- Migrationspflicht und Aufbewahrung je Datenart,
- DMS-/Dokumentmigration,
- Qualitäts- und Abnahmeschwellen,
- Migrationsfenster, Delta und Rückfall,
- Verantwortliche für technische und fachliche Freigabe.
