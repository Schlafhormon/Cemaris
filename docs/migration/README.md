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
> Die Quellartefakte sind technisch read-only inventarisiert. Das Micro-Focus-
> Speicherformat, feste Satzlängen, Indexdefinitionen, aktive Satzmengen,
> physische Löschsatztypen und mehrere Schlüsselbeziehungen sind inzwischen
> auf einer externen Arbeitskopie belegt. `W020` 91–1.694 und `W021` 29–1.400
> sowie 5.465–5.770 sind in den untersuchten Intervallen lückenlos profiliert;
> mehrere W021-Ereignisfelder sind bestätigt.
> `W021` enthält 40×127 Gebührenpositionen ab Byte 385, davon sind die ersten
> acht belegt. W021 5.556/L8 und 5.576/L8 sind technisch als `ddMMyyyy`,
> 5.706/L8 als `yyyyMMdd` belegt; die Ereignisrollen bleiben Kandidaten. Eine
> sichere Storno-/Umnummerierungs-/Nachfolgerregel wurde nicht gefunden;
> deshalb ist derzeit keine entsprechende Filterung erlaubt.
> Weitere Ausschlüsse und ein fachliches
> Cemaris-Zielmodell sind weiterhin nicht vollständig bekannt.

## Abgegrenzte Wiederaufnahme am 25.08.2026

ADR-0017 nimmt die breite EDWALT-Migration nicht wieder auf. Freigegeben ist
ausschließlich der nicht personenbezogene Friedhofsstammdatenpfad für die
dauerhafte lokale Development-Datenbank `Cemaris_Dev`:

- Friedhöfe und Grabarten aus feldgenau bestätigten `W005`-/`W005dm`-Spannen;
- bestätigte räumliche Hierarchie und Grabstellen ausschließlich aus
  positiv gelisteten Strukturfeldern;
- Friedhof-Grabart-Zuordnungen, soweit Quelle und Mapping eindeutig belegt
  sind.

Personen, Adressen, Suchcodes, Berechtigte, Nutzungsrechte, Beisetzungen,
Vorgänge, Gebühren, Bescheide, Buchungen, Notizen, Dokumente, EDWALT-Benutzer
und technische Konfiguration sind in diesem Schritt ausgeschlossen. Aus
`W020` darf anfangs nur der bestätigte 26-Byte-Strukturschlüssel gelesen
werden; weitere Spannen benötigen vor jeder Dekodierung einen feldgenauen
Positivlistenbeleg.

Die autorisierte read-only Arbeitswurzel ist:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`

Die vorhandenen Phase-2-, Phase-3- und Phase-4-Verzeichnisse bleiben
unverändert. Inkrement 5k hat für seine lokalen Laufartefakte ausschließlich
folgende neue Wurzel angelegt:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`

Parser, Importer, Positivliste und synthetische Tests werden im
Cemaris-Repository versioniert. Quellextrakte, Stammdatenwerte, Laufberichte
und Secrets bleiben außerhalb. Das ausgeführte technische Mapping steht im
[EDWALT-Friedhofsstammdatenmapping für Inkrement 5k](edwalt-cemetery-master-data-mapping.md),
der vollständige Nachweis im
[5k-Abschluss](../implementation/cemaris-increment-5k-completion.md).

Das am 26.08.2026 abgeschlossene
[Freigabegate für manuelle Bescheid-/Finanzfakten](../implementation/cemaris-manual-notice-facts-approval-completion.md)
ändert diese Migrationsgrenze nicht. `ReadNotices`, `ReadFeeItems` und
EDWALT-Bescheid-/Gebührenzeilen werden weder zurückinterpretiert noch in einen
neuen kanonischen Kern übernommen. Der gemäß
[6b-Abschluss](../implementation/cemaris-increment-6b-completion.md) umgesetzte
Entwurfskern ist rein additiv und ausschließlich für manuelle synthetische
Development-Daten. Es gibt kein Backfill, kein Gebührenmapping und keinen
Importauftrag. Der separate EDWALT-Gebührenauftrag bleibt pausiert.

Die konkrete
[EDWALT-Quellenanalyse](edwalt-source-analysis.md) dokumentiert 24 vollständige
DAT/IDX-Paare, technische Extraktionsrisiken und historische Varianten. Der
[Extraktionsprototyp und das technische Datenprofil](edwalt-extraction-prototype.md)
dokumentiert den inzwischen validierten Zugriff. Der
[feldweise Quellkatalog mit Satzlayoutrekonstruktion](edwalt-source-field-catalog.md)
grenzt die priorisierten Sätze lückenlos ab und kennzeichnet die noch vor einem
fachlichen Mapping zu klärenden Punkte. Der
[ausgeführte Übergabeauftrag zur Gebühren-/Bescheidvertiefung](edwalt-next-step-handoff.md)
dokumentiert Arbeitsbereiche, Schutzregeln, Prioritäten und Abschlusskriterien.
Der
[ausgeführte Auftrag zur Personen-, Nutzungsrechts- und Statusrekonstruktion](edwalt-person-rights-status-next-step-handoff.md)
dokumentiert die Schutz- und Abnahmekriterien dieser Phase. Der
[ausgeführte Folgeauftrag zu weiteren Adressrollen und Vorgangsnachlauf](edwalt-additional-addresses-next-step-handoff.md)
dokumentiert Phase 4. Der
[Folgeauftrag zur Gebührenstamm- und Variantenabgrenzung](edwalt-fee-master-variants-next-step-handoff.md)
ist vorbereitet, bleibt aber für Gebühren und Varianten außerhalb des jetzt
freigegebenen Friedhofsstammdatenumfangs zurückgestellt. Das
[Cemaris-Entscheidungsgate 6a](../implementation/cemaris-increment-6a-completion.md)
ist ausschließlich anhand versionierter Repositoryquellen mit Variante A
„noch keine Implementierung“ abgeschlossen. Die bestätigten späteren
Datenkategorien sind keine Quellfeld-, Mapping- oder Importfreigabe. Das Gate
nimmt weder den EDWALT-Gebührenauftrag noch eine andere Migrationsanalyse
wieder auf; die Sperren stehen in der
[6a-Entscheidungsakte](../requirements/fee-notice-document-decisions.md).
Die anschließende Priorisierung manueller kanonischer Bescheid-/Finanzfakten
und ihr
[Freigabegate](../implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md)
enthalten ausdrücklich keinen Backfill, kein EDWALT-Mapping und keinen Import.
Der EDWALT-Gebühren-/Variantenauftrag bleibt pausiert.
Sämtliche vorhandenen EDWALT-Quellen und Phase-2-/3-/4-Arbeitsbereiche bleiben
unverändert read-only; die Phase-5-Wurzel wurde ausschließlich für die
abgeschlossene 5k-Ausführung angelegt.

**EDWALT** ist die kanonische
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

- semantische Feldgrenzen und Feldtypen innerhalb der technisch bestätigten
  festen Satzlängen; zusätzliche Copybooks oder Herstellerunterlagen existieren
  nach Projektangabe nicht,
- fachliche Einordnung und Vorrang der Neben-, Alt- und DM-Bestände,
- fachliches Cemaris-Zielmodell,
- Migrationspflicht und Aufbewahrung je Datenart,
- dauerhafte Auffindbarkeit, Lesbarkeit, Berechtigung und Aufbewahrung der nicht
  migrierten Akten, Bescheide und Schreiben,
- Qualitäts- und Abnahmeschwellen,
- Migrationsfenster, Delta und Rückfall,
- Verantwortliche für technische und fachliche Freigabe.

## Abschluss Phase 4 und abgegrenzter Migrationsfolgeschritt

Das Cemaris-Fachmodell wird noch nicht aufgrund der EDWALT-Struktur erweitert.
Phase 4 ist abgeschlossen. Zusätzlich zu den unveränderten Phase-3-Ergebnissen
sind `W020` 621–1.684 in 38 und `W021` 5.465–5.770 in 22 lückenlose Bereiche
zerlegt. Die Summen betragen 1.064 beziehungsweise 306 Byte; zusammen mit
`W020` 1.685/L9 und 1.694/L1 sind 621–1.694 exakt 1.074 Byte abgedeckt.

In W020 wiederholt sich zwischen Rolle 2 (630–868) und Rolle 3 (1.445–1.683)
eine 239-Byte-Struktur. Die 30-Byte-Namenssegmente sind durch statische
Feldnamen, die harte Rolle-3-Indexgrenze und SHA-256-Schnittmengen gestützt.
PLZ und Ort der dritten Rolle sind technisch als 1.648/L5 und 1.653/L30
abgegrenzt. Anrede, Titel, Postzusatz und mehrere Abschlusskennzeichen bleiben
semantisch `OFFEN`. Grabmal, Einfassung und FUG sind zwischen Byte 878 und
1.440 als Familien und technische Restgruppen getrennt; nicht unabhängig
belegte Innengrenzen wurden ausdrücklich nicht erfunden.

Die ältere W021-Blockgrenze ist korrigiert: 40×127 Byte beginnen bei Byte 385;
Positionen 1–8 sind belegt und die Gebührennummer relativ 73/L4 referenziert
42/42 verschiedene Gebührenstammkandidaten. Positionen 9–40 sind initialisiert.
Festgesetzter Betrag und die übrigen Positionsunterfelder bleiben `OFFEN`.
Der W021-Nachlauf beginnt nach Position 40 mit einem echten Strukturwechsel.
5.556/L8 und 5.576/L8 besitzen gültige `ddMMyyyy`-Profile, 5.706/L8 ein
vollständiges `yyyyMMdd`-Profil. Die statischen Rollen Fälligkeit,
Beerdigungsdatum und Überführungsdatum sind dadurch Kandidaten mit mittlerer
fachlicher Konfidenz, aber noch keine freigegebenen Importfelder. Sensible
Text-, Überführungs- und Druckrestgruppen bleiben erhalten und `OFFEN`.

Storno-, Erledigt- und Nummernänderungsabläufe sind statisch vorhanden. Ein
eindeutiger alter/neuer Schlüssel oder gültiger Nachfolger wurde jedoch nicht
gefunden. Physische Löschsätze, Finanzstorno, `W040alt` und die identischen
Module `STATUS_1.GS`/`STATUS~1.GS` sind als Nachfolgerregel widerlegt. Bis zu
einem eindeutigen Beleg wird aufgrund dieser Kandidaten nichts ausgeschlossen.
Phase 4 bestätigt diese Sperre: 1.685/L9 hat zwar eine sichere Grenze und einen
statischen Namen, aber keine eindeutige gehashte Schlüsselbeziehung und keine
Selbst-/Kettenregel. Byte 1.694/L1 ist in 2.718/2.718 Sätzen leer oder
nullwertartig und besitzt keine belegte Statusbedeutung.

Der externe Phase-4-Bericht liegt unter
`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812`.
Der vorbereitete Gebühren-/Variantenauftrag in
[edwalt-fee-master-variants-next-step-handoff.md](edwalt-fee-master-variants-next-step-handoff.md)
bleibt pausiert. 5k hat die `W005`-/`W005dm`-Abgrenzung und die strikt positiv
gelisteten W020-Strukturfelder umgesetzt. Der erfolgreiche Dry-run plant nur
belegbare Friedhöfe. Grabarten bleiben ohne ausdrückliche
Beisetzungsformentscheidung, W020-Gräber ohne belegte Grabartrelation und
Hierarchieaufteilung ausgeschlossen. Unklare Felder bleiben sichtbar `OFFEN`
und werden weder dekodiert noch geladen. Der kontrollierte Import verlangt
zusätzlich die exakte Zielprüfung, eine aktuelle Dry-run-Fassung und
vollständige Transaktions-/Idempotenzkontrollen.

## Abgrenzung des kanonischen 6b-Entwurfskerns

Die additive EF-Core-Migration
`20260826130629_AddCanonicalManualNoticeDrafts` gehört zur normalen
Cemaris-Schemaentwicklung und nicht zur EDWALT-Datenmigration. Sie ergänzt
ausschließlich leere Tabellen, Constraints, Indizes und Fremdschlüssel für
manuelle Bescheidentwürfe, Fachrevisionen, sparsame Audits,
Nummernkonfiguration und Jahressequenz. Sie liest, ändert oder befüllt weder
`ReadNotices`/`ReadFeeItems` noch vorhandene Fälle, Personen, Rechte, Konten
oder Stammdaten.

Für 6b gibt es kein EDWALT-Mapping, keinen Gebührenstammimport, kein Backfill
und keine Rückinterpretation von Altbescheiden. Der pausierte externe
Gebühren-/Variantenauftrag bleibt pausiert. Eine spätere Migration von
Bescheiden, Gebühren oder Dokumenten benötigt weiterhin ein separates
Quell-, Mapping-, Datenschutz- und Abnahmegate. Details stehen im
[6b-Abschluss](../implementation/cemaris-increment-6b-completion.md).

Das nachgelagerte
[6c-Bescheiderzeugungsgate](../implementation/cemaris-notice-generation-decision-gate-completion.md)
bestätigt diese Grenze erneut und ist nach ergänzender Quellenklärung mit
Variante B abgeschlossen. Auch der vorbereitete technische
Development-Kandidat übernimmt ausschließlich aktuelle kanonische
Cemaris-Daten; für ihn gibt es keine Übernahme und kein
Backfill, keine Rückinterpretation und keine Nacherzeugung alter EDWALT- oder
`ReadNotices`-/`ReadFeeItems`-Bestände. Eine spätere Erzeugung soll nur mit
aktuellen kanonischen Cemaris-Daten arbeiten; daraus folgt kein Mapping- oder
Migrationsauftrag. Benutzerkontakt-, Satzungs- und Erzeugungsaudittabellen
einer späteren normalen additiven 6c-Schemamigration sind ebenfalls kein
EDWALT-Migrationsumfang und werden nicht aus Altbeständen befüllt.
