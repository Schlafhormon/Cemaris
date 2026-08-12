# Read-only-Bestandsaufnahme EDWALT

> **Stand:** 11.08.2026. **Art:** lesende technische und dokumentarische
> Bestandsaufnahme der Originale sowie technischer Extraktionsprototyp auf einer
> lokalen Arbeitskopie. **Keine Sollkonzeption und keine aus einer
> EDWALT-Funktion abgeleitete Cemaris-Fachanforderung.**

## Auftrag und Abgrenzung

Untersucht wurden die lokal bereitgestellten Verzeichnisse
`C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT` und
`C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`. Die Originaldateien
wurden nur gelesen. In Phase 1 wurden keine Altprogramme, Makros,
Rebuild-/Reorg-Werkzeuge oder Datenbanktreiber gestartet. In Phase 2 wurden die
mitgelieferte Micro-Focus-Runtime und ein eigener Parser ausschließlich auf
einer hashgeprüften Arbeitskopie außerhalb des Repositories verwendet.

Die technische Analyse beschreibt, was Handbücher und Artefakte erkennen lassen.
Der EDWALT-Einsatz ist durch `INT-005` bestätigt. Die untersuchten Quellen
stammen nach neuerer ausdrücklicher Projektangabe nicht aus der produktiven
Umgebung, sind aber schema- und versionsgleich mit dem späteren
Migrationsbestand (`INT-036`). Sie sagen nicht, welche einzelnen Funktionen
heute genutzt werden, fachlich richtig sind oder in Cemaris übernommen werden
sollen.
Ohne Interview oder fachliche Freigabe bleibt eine weitergehende, aus EDWALT
abgeleitete Aussage grundsätzlich `OFFEN` oder `ANNAHME`.

## Bestätigte Projektentscheidungen

| Evidenz | Entscheidung | Evidenztyp | Status | Konfidenz | Auswirkung |
| --- | --- | --- | --- | --- | --- |
| `INT-001` | Die korrekte Produktbezeichnung ist **EDWALT**. **EDWALT3** bezeichnet dasselbe Produkt beziehungsweise die untersuchte Version. Die frühere Cemaris-Schreibweise ohne abschließendes `T` war falsch. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | EDWALT wird in Texten kanonisch verwendet; der historische Dateiname `edwald-inventory.md` bleibt nur zur Linkkompatibilität bestehen. |
| `INT-002` | Cemaris bildet EDWALT weder funktional noch technisch 1:1 nach. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | EDWALT-Funktionen dienen als Quellenbeleg und Interpretationshilfe, nicht als Produkt-Backlog. |
| `INT-003` | Die fachlich relevanten EDWALT-Daten sollen nach Cemaris migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Technische Datenerschließung, Migrationsumfang, Aufbewahrung und Abnahme werden eigene Arbeitsstränge. |
| `INT-004` | Cemaris wird als neue, eigenständige Open-Source-Friedhofsverwaltungssoftware entwickelt. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Das Zielmodell folgt heutigen Anforderungen und nicht der EDWALT-Datei- oder Maskenstruktur. |
| `INT-005/036` | EDWALT wird produktiv verwendet; die bereitgestellten Verzeichnisse stammen jedoch nicht aus der produktiven Umgebung und sind schema- und versionsgleich mit dem späteren Migrationsbestand. | INTERVIEW, Projektverantwortung, 10./11.08.2026 | `BESTÄTIGT`; INT-036 präzisiert die Quellenherkunft | hoch | Für Parser und Mapping verwenden; Mengen und Inhaltsqualität nicht als produktive Ist-Werte behandeln. |
| `INT-006` | Auch abgeschlossene und historische Fälle sollen vollständig migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Migrationsplanung darf sich nicht auf aktive Fälle beschränken; Datenkategorien und Ausschlüsse bleiben zu klären. |
| `INT-007` | Betriebsnotwendige Daten sollen so migriert werden, dass keine umfangreiche manuelle Nacherfassung erforderlich ist; Notizen sollen nicht migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Migrationsumfang an Betriebsnotwendigkeit ausrichten; Notizdaten ausschließen und weitere Ausschlüsse einzeln bestätigen. |
| `INT-008` | Regelmäßig genutzt werden Personen/Adressen, Beisetzungen, Nutzungsrechte/Verlängerungen, Gebühren/Bescheide/Buchungen sowie Suche/Listen/Statistiken; selten Gräber/Friedhofsstruktur, Termine/Wiedervorlagen und Dokumente/Word-Vorlagen; Krematorium gar nicht. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch für Bereichshäufigkeiten | Kernprozesse priorisieren; seltene Bereiche nicht automatisch verwerfen; Krematorium separat abgrenzen. |
| `INT-037` | Weitere Copybooks, FD-Dateien, Herstellerunterlagen und Ansprechpartner sind nicht verfügbar; der Hersteller besteht nicht mehr. | INTERVIEW, Projektverantwortung, 11.08.2026 | `BESTÄTIGT` | hoch | Feldsemantik aus lokalen Evidenzen rekonstruieren und Unsicherheit sichtbar lassen. |
| `INT-038` | Bedeutung von Alt-/DM-/Nebenvarianten und das Fehlen erwarteter Dateien sind der Projektverantwortung nicht bekannt. | INTERVIEW, Projektverantwortung, 11.08.2026 | Wissensgrenze `BESTÄTIGT`, Semantik `OFFEN` | hoch | Technisch untersuchen; keine Vorrang- oder Ausschlussregel erraten. |

Die einzelnen zu migrierenden Datenkategorien, fachlichen Regeln und
Cemaris-Funktionen bleiben bis zur weiteren Erhebung `OFFEN`.

**Schutzgrenzen:**

- Quelle 1: `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT` - strikt read-only;
- Quelle 2: `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3` - strikt read-only;
- lokale Arbeitskopie: `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`;
- Schreibziel: ausschließlich Dokumentation unter `docs/` im Cemaris-Repository;
- temporäre Parsergebnisse und Kontaktbögen: lokaler temporärer Analysebereich, nicht in Git;
- keine Personen-, Grab-, Akten-, Zahlungs-, Netzwerk- oder Freitextwerte in dieser Dokumentation.

## Terminologie

| Evidenz | beobachtete Bezeichnung | Bewertung | Status | Konfidenz | Offene Frage |
| --- | --- | --- | --- | --- | --- |
| `TERM-001` | Frühere Cemaris-Dokumente verwendeten eine Schreibweise ohne abschließendes `T`. | Diese Schreibweise war falsch; Korrektur durch `INT-001`. | `BESTÄTIGT` | hoch | Keine; Altdateiname `edwald-inventory.md` bleibt technisch bestehen. |
| `TERM-002` | Verzeichnis, Programmdatei, Handbücher und Releases verwenden **EDWALT3**. | EDWALT3 ist dasselbe Produkt wie EDWALT beziehungsweise dessen untersuchte Versionsbezeichnung (`INT-001`). | `BESTÄTIGT` | hoch | Keine. |
| `TERM-003` | Quellen verwenden außerdem **EDWALT** ohne Versionsziffer. | **EDWALT** ist die kanonische Projektbezeichnung (`INT-001`). | `BESTÄTIGT` | hoch | Keine. |

Der historische Dateiname `edwald-inventory.md` wurde zur Linkkompatibilität
nicht umbenannt. In Texten wird **EDWALT** kanonisch verwendet; **EDWALT3** nur
bei konkreten Quell-, Programm- oder Versionsbezeichnungen.

## Quellenübersicht

| Evidenz | Quellbereich | Dateien | Verzeichnisse unterhalb der Wurzel | Größe | Zeitspanne der Datei-Zeitstempel | Status | Konfidenz |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `OBS-SRC-001` | `EDW3DAT` | 150 | 7 | 78.286.460 Byte (ca. 74,7 MiB) | 1993-02-01 bis 2026-08-04 | `BESTÄTIGT` als aktueller Datenstand durch INT-005; Umfang beobachtet | hoch |
| `OBS-SRC-002` | `edwalt3` | 447 | 4 | 52.261.704 Byte (ca. 49,8 MiB) | 1993-01-31 bis 2026-08-10 | `BESTÄTIGT` als aktueller Programmstand durch INT-005; Umfang beobachtet | hoch |
| `MAN-EDW` | `EDWHELP\EDWHELP.htm` | 1 HTML, 82 GIF | - | HTML 255.303 Byte | Handbuchstand im Inhalt: 2004/3.10 | `ANNAHME` | hoch |
| `MAN-EDK` | `EDKHELP\EDK3HLP.htm` | 1 HTML, 41 GIF | - | HTML 128.854 Byte | Handbuchstand im Inhalt: 2004KR/01 | `ANNAHME` | hoch |
| `REL-320` | `Release3.20.doc` / `.pdf` | 2 Darstellungen desselben Releasekomplexes | - | PDF: 18 Seiten | 2006 | `ANNAHME` | hoch |
| `REL-330` | `Release3.30.doc` / `.pdf` | 2 Darstellungen desselben Releasekomplexes | - | PDF: 1 Seite | 2007 | `ANNAHME` | hoch |

Die vollständige, nach relativem Pfad sortierte Dateiübersicht steht im [Quellenmanifest](source-manifest.csv). Hashes dienen nur der Wiedererkennbarkeit und enthalten keine Dateiinhalte.

Das Manifest bildet den Phase-1-Zeitpunkt mit 597 Dateien ab. Am 11.08.2026
enthalten die aktuellen Quellpfade und die Phase-2-Arbeitskopie jeweils 592
Dateien. Es fehlen gegenüber dem Manifest ausschließlich zwei flüchtige
Office-Sperrdateien und drei `Thumbs.db`; keine DAT-/IDX- oder fachliche Datei
ist betroffen. Die Ursache ist nicht belegt und wird nicht als Änderung durch
die Analyse gewertet.

## Evidenz- und Bewertungsmodell

Die Analyse verwendet die vorgegebenen Statuswerte `OFFEN`, `ANNAHME`,
`BESTÄTIGT`, `WIDERSPRUCH` und `VERWORFEN`. Maßgeblich für den jeweils aktuellen
Stand der `INT-*`-Evidenzen ist das
[Interviewprotokoll](interview-record.md). Eine Interviewevidenz kann auch nur
eine Wissensgrenze bestätigen; der betroffene Prozess bleibt dann `OFFEN`.
Keine einzelne EDWALT-Funktion oder Fachregel ist dadurch automatisch eine
bestätigte Cemaris-Anforderung.

| Präfix | Bedeutung |
| --- | --- |
| `SRC-DAT-*`, `SRC-APP-*` | einzelne Datei im Quellenmanifest (`PROGRAMMARTEFAKT`, `DATENINDIZ`, `VORLAGE` oder `RELEASEHINWEIS`) |
| `MAN-EDW-*`, `MAN-EDK-*` | konsolidiertes Handbuchthema (`HANDBUCH`) |
| `IMG-EDW-*`, `IMG-EDK-*` | lokal geprüftes GIF (`SCREENSHOT`); Nummer entspricht dem Dateinamen |
| `TECH-*` | technische Komponente oder Komponentenfamilie (`PROGRAMMARTEFAKT`) |
| `DAT-*` | Daten-/Indexpaar oder Sonderbestand (`DATENINDIZ`) |
| `TPL-*`, `DOC-*`, `REP-*` | Vorlage, Dokumentart oder Report (`VORLAGE`/`HANDBUCH`) |
| `REL-*` | Releasehinweis (`RELEASEHINWEIS`) |
| `OBS-*` | reproduzierbare lokale Beobachtung oder aggregierte Messung |
| `INT-*` | fachlich bestätigte Aussage aus der geführten Erhebung (`INTERVIEW`) |

Lokale Quellenverweise nennen Quellbereich, relativen Pfad und bei HTML-Hilfen zusätzlich Absatzbereich beziehungsweise Word-Anker. Die HTML-Dateien enthalten zwar benannte Anker, aber keine `href`-Navigation; deshalb ist die Absatznummer der strukturellen Extraktion der stabilere Zusatzverweis.

## Vorgehen

1. Git-Status und sämtliche vorhandenen Analyse-, Architektur-, Migrations- und Entscheidungsdokumente wurden vor der EDWALT-Analyse gelesen.
2. Für beide Quellen wurde ein Ausgangsmanifest aus relativem Pfad, Größe, UTC-Zeitstempeln, Attributen und SHA-256 gebildet.
3. Dateisignaturen wurden anhand begrenzter Header gelesen; PE-Versionsressourcen wurden statisch ausgewertet.
4. Beide Word-97-HTML-Hilfen wurden als Windows-1252 geparst. Absätze, Anker, Bilder und Bildkontexte wurden vollständig erfasst.
5. Alle 123 unterschiedlichen GIF-Dateien wurden lokal visuell geprüft. Es gibt keine fehlenden und keine nicht referenzierten GIFs.
6. PDF-Releases wurden lokal extrahiert und seitenweise gerendert. DOC- und DOT-/OLE-Artefakte wurden ausschließlich statisch auf Container-, Feld- und Makroindizien geprüft.
7. In Phase 1 wurden DAT-/IDX-Dateien nur über Metadaten, Partnerbildung und
   begrenzte Magic Bytes klassifiziert.
8. Abschließend wurde der komplette Ausgangsstand erneut gegen Pfad, Größe,
   Änderungs- und Erstellungszeit, Attribute und SHA-256 verglichen.
9. In Phase 2 wurden die 24 DAT/IDX-Paare in einer externen Arbeitskopie mit
   `REBUILD /n` identifiziert und als feste unkomprimierte Sätze exportiert.
10. Ein eigener .NET-Prototyp profilierte ausschließlich technische Aggregate,
    gehashte Schlüsselbeziehungen, Datumskandidaten, Zeichensatzindizien und
    physische Satztypen. Er gab keine Quellwerte aus.
11. In Phase 3 wurden `W020` 91–620 und `W021` 29–1.400 deklarativ und
    lückenlos profiliert, statische Status-/Nummernänderungsabläufe geprüft und
    mögliche Nachfolger ausschließlich aggregiert beziehungsweise gehasht
    verglichen. Die Phase-2-Basis blieb read-only.

## Dokumente dieser Analyse

- [Handbuch- und Maskenindex](manual-index.md)
- [Konsolidierter Funktionskatalog](function-catalog.md)
- [Technische Komponenten](technical-components.md)
- [Datenbestandsinventar](data-storage-inventory.md)
- [Dokumente, Reports und Vorlagen](documents-reports-templates.md)
- [Evidenzmatrix und Lückenanalyse](evidence-matrix.md)
- [Offene Fragen und Interviewleitfaden](open-questions-and-interview-guide.md)
- [Fortlaufendes Interviewprotokoll](interview-record.md)
- [Migrationsbezogene Quellenanalyse](../../migration/edwalt-source-analysis.md)
- [Extraktionsprototyp und technisches Datenprofil](../../migration/edwalt-extraction-prototype.md)
- [Ausgeführter Übergabeauftrag: Personen-, Nutzungsrechts- und Statusrekonstruktion](../../migration/edwalt-person-rights-status-next-step-handoff.md)
- [Aktueller Übergabeauftrag: weitere Adressrollen und Vorgangsnachlauf](../../migration/edwalt-additional-addresses-next-step-handoff.md)

## Übergreifende Grenzen

| Evidenz | Grenze | Folge | Status | Konfidenz | Nächste Klärung |
| --- | --- | --- | --- | --- | --- |
| `OBS-LIM-001` | Das Micro-Focus-Indexed-Format, feste Satzlängen, Schlüssel und Mengen sind auf einer isolierten Kopie technisch belegt; Copybooks und vollständige Feldbeschreibungen fehlen. | Feldgrenzen, COBOL-Datentypen und fachliche Semantik bleiben offen. | technisch teilweise `BESTÄTIGT`, semantisch `OFFEN` | hoch | Evidenzbasierten Quellfeldkatalog aus Profil, Hilfe, Masken und statischen Programmhinweisen erstellen. |
| `OBS-LIM-002` | Die Handbücher beschreiben Kasse/Buchen und Terminverwaltung nur knapp und verweisen auf gesonderte Beschreibungen, die nicht vorliegen. | Funktionsumfang dieser Module ist unvollständig dokumentiert. | `OFFEN` | hoch | Fehlende Bände und reale Prozessbeobachtung anfordern. |
| `OBS-LIM-003` | Vorhandene Module und aktuelle Zeitstempel beweisen keine Nutzung. | Nutzungsstatus bleibt je Funktion offen. | `OFFEN` | hoch | Interviews, Nutzungsbeobachtung und freigegebene Betriebsprotokolle. |
| `OBS-LIM-004` | Alte OLE-Vorlagen konnten statisch auf Word-Streams und Feldnamen, nicht layoutgetreu oder semantisch vollständig geprüft werden. | Dokumentzweck und Makrofreiheit sind nicht abschließend bewiesen. | `OFFEN` | mittel | Isolierte, makrodeaktivierte Dokumentforensik an freigegebenen Kopien. |
| `OBS-LIM-005` | Es wurde kein Winyard-Verweis in den Quellen gefunden. | Das beweist nicht, dass Ablageprozesse außerhalb von EDWALT fehlen. | `OFFEN` | mittel | DMS-Prozess außerhalb des Altverfahrens beobachten. |
| `OBS-LIM-006` | Die ältere W021-Grenze war falsch: 40×127 Byte beginnen bei Byte 385. Positionen 1–8 sind belegt, 9–40 initialisiert; Gebührennummer relativ 73/L4 ist referenziell bestätigt. W040/W040alt bleiben nahezu/vollständig initialisiert. | Die W021-Gebührennummer ist nutzbar, übrige Unterfelder und W040-Dezimaltypen bleiben offen. | Korrektur und Gebührenreferenz `BESTÄTIGT`, übrige Feldsemantik `OFFEN` | hoch | Keine Nullpositionen erzeugen; Betrag/Fälligkeit und übrige Grenzen weiter belegen. |

## Datenschutz und Urheberrecht

Die Dokumentation enthält keine Klartext-Datensätze, Personenbeispiele, Grabnummern, Aktenzeichen, Zahlungswerte, produktiven Pfade/Servernamen, Zugangsdaten oder Freitexte. Screenshotinhalte wurden nur auf Maskenstruktur, Feldbezeichnungen, Schaltflächen und Funktion hin ausgewertet. Handbuchtexte, Screenshots, Binärdateien, Vorlagen und Releaseunterlagen wurden nicht in das Repository kopiert.

**Offene Freigabe:** Vor einer Weitergabe dieser Dokumentation ist zu bestätigen, ob schon generische Dateinamen, Produktnamen und technische Hashes im vorgesehenen Veröffentlichungsrahmen zulässig sind. Status `OFFEN`, Konfidenz mittel.

## Abschlussvalidierung

| Validierungs-ID | Prüfung | Ergebnis | Status | Konfidenz | Offene Frage |
| --- | --- | --- | --- | --- | --- |
| `VAL-001` | Quelldateien vor/nach Analyse: relativer Pfad, Größe, Änderungs-/Erstellungszeit, Attribute, SHA-256 | 597 Dateien zu Beginn und am Ende; 0 Abweichungen | `ANNAHME` hinsichtlich formaler Unverändertheit | hoch | Keine; fachliche Nutzung bleibt davon unberührt. |
| `VAL-002` | Quellverzeichnisse vor/nach Analyse: Pfad, Zeiten, Attribute | 13 Verzeichnisse zu Beginn und am Ende; 0 Abweichungen | `ANNAHME` | hoch | Keine. |
| `VAL-003` | Manifest-Integrität | 597 eindeutige Evidenz-IDs; 150 Dateien aus `EDW3DAT`, 447 aus `edwalt3` | `ANNAHME` | hoch | Veröffentlichungsfreigabe für Hashes/Dateinamen bleibt offen. |
| `VAL-004` | DAT/IDX-Partner | 24 DAT- und 24 IDX-Zeilen; 0 verwaiste Partner | `ANNAHME` | hoch | Satz-/Indexkonsistenz ist damit nicht bewiesen. |
| `VAL-005` | Hilfestruktur | 127 EDW- und 76 EDK-Anker in 72 bzw. 45 Ankerpositionen vollständig registriert | `ANNAHME` | hoch | Versionsgleichheit zur produktiven Binärdatei. |
| `VAL-006` | Hilfebilder | 82 EDW- und 41 EDK-GIFs einzeln zugeordnet; 0 fehlende und 0 nicht referenzierte GIFs | `ANNAHME` | hoch | Produktive Nutzung der gezeigten Masken. |
| `VAL-007` | lokale Markdown-Links der Analyse und aktualisierten Indexdokumente | 72 Links in 32 Markdown-Dateien geprüft; 0 ungültig | `ANNAHME` | hoch | Keine. |
| `VAL-008` | Repository-Inhalt | keine unversionierte Binärdatei; nur Markdown und CSV neu; keine Handbücher, Bilder, Programme oder Vorlagen kopiert | `ANNAHME` | hoch | Redaktionelle/Datenschutz-Freigabe vor Veröffentlichung. |
| `VAL-009` | Klartextmuster für Passwortwert, Server/Benutzer/DSN, UNC-Pfad und E-Mail in neuen Analysedateien | 0 Treffer; Konfigurationswerte blieben maskiert/nicht dokumentiert | `ANNAHME` | hoch | Eine menschliche Datenschutz-Endprüfung bleibt vor Veröffentlichung sinnvoll. |
| `VAL-010` | externer Finanzprofiler: Build und reproduzierbarer Bericht | Build mit .NET SDK 10.0.302: 0 Warnungen/Fehler; Bericht: 24 logische und 24 vollständige physische Profile, 52 Finanzfeldprofile, 7 Wiederholungsblöcke, 124 Referenz- und 5.200 Rechenhypothesen | technisch `BESTÄTIGT` | hoch | Fachsemantik der nullinitialisierten Bereiche bleibt OFFEN. |
| `VAL-011` | erneuter SHA-256-Vergleich Originale gegen sichere Arbeitskopien | aktuell 148 reguläre `EDW3DAT`- und 444 reguläre `Edwalt3`-Dateien; 0 fehlende/zusätzliche Dateien, 0 Längen- und 0 Hashabweichungen. Die historischen 150/447 aus Phase 1 enthalten zwei Office-Sperrdateien und drei `Thumbs.db`. | formale Unverändertheit `BESTÄTIGT` | hoch | Keine; Bestandszählungen nicht mehr vermischen. |
| `VAL-012` | neue Tabellen, Bereichssummen und Repository-Datenschutzscan | konsistente Spalten; 10 Layout-/Blocksummen korrekt; 0 geänderte DAT/IDX/RAW/JSON-Dateien; 0 Treffer der definierten Zugangsdaten-/E-Mail-/UNC-Muster | `ANNAHME` | hoch | Menschliche fachliche und Datenschutz-Endprüfung bleibt erforderlich. |
| `VAL-013` | Git-Whitespace-/Patchprüfung | `git diff --check` ohne Befund | `ANNAHME` | hoch | Unversionierte Dateien werden zusätzlich separat auf Whitespace geprüft. |
| `VAL-014` | Phase-2-Arbeitskopie gegen aktuelle Originalquellen: relative Pfade, Größen und SHA-256 | 592 Dateien je Seite; 0 Abweichungen | `BESTÄTIGT` für den Prüfzeitpunkt 11.08.2026 | hoch | Keine; die fünf flüchtigen Phase-1-Dateien sind separat erläutert. |
| `VAL-015` | Physischer DAT-Parser gegen logischen sequenziellen Export | alle 24 DAT-Dateien vollständig gelesen; aktive physische Sätze je Datei entsprechen exakt 53.991 logischen Sätzen | `BESTÄTIGT` technisch | hoch | Fachliche Feldsemantik bleibt offen. |
| `VAL-016` | externer Phase-3-Profiler: Build, Bericht und Bereichsabdeckung | .NET 10.0.302: 0 Warnungen/Fehler; 24 logische/24 vollständige physische Profile; 66 Primärbereichs- und 5 Statusfeldprofile; W020 530/530 und W021 1.372/1.372 Byte; 8 Statushypothesen, 5 statische Befunde; zwei Läufe erzeugten byteidentisch 28.332.345 Byte mit SHA-256 `43F8749A4E1C3AC4390FFD56EA33106056D99A1CA03D8E8F4CA517D892438A48` | technisch `BESTÄTIGT` | hoch | Nicht bestätigte Semantik bleibt `OFFEN`; keine Statusfilterung. |
| `VAL-017` | Phase-3-Dokumentation: Links, Tabellen, Bereichssummen und Datenschutz | 77 lokale Links in 33 Markdown-Dateien, 0 ungültig; alle Tabellen spaltenkonsistent; F020 1–2.693 und F021 1–6.265 lückenlos/überschneidungsfrei; 0 neue DAT/IDX/RAW/JSON-/Binärdateien sowie 0 definierte Zugangsdaten-/E-Mail-/UNC-Treffer | technisch `BESTÄTIGT` | hoch | Menschliche fachliche und Datenschutz-Endprüfung vor Veröffentlichung. |
