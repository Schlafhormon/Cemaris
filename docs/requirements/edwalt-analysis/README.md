# Read-only-Bestandsaufnahme EDWALT

> **Stand:** 10.08.2026. **Art:** ausschließlich lesende technische und
> dokumentarische Bestandsaufnahme. **Keine Sollkonzeption und keine aus einer
> EDWALT-Funktion abgeleitete Cemaris-Fachanforderung.**

## Auftrag und Abgrenzung

Untersucht wurden die lokal bereitgestellten Verzeichnisse `D:\Friedhofsverwaltung\EDW3DAT` und `D:\Friedhofsverwaltung\edwalt3`. Die Quelldateien wurden nur gelesen. Es wurden insbesondere keine Altprogramme, Makros, Rebuild-/Reorg-Werkzeuge oder Datenbanktreiber gestartet und keine Indizes geöffnet, repariert oder neu aufgebaut.

Die technische Analyse beschreibt, was Handbücher und Artefakte erkennen lassen.
Der produktive Einsatz und die Aktualität der untersuchten Quellen sind durch
`INT-005` bestätigt; sie sagen jedoch nicht, welche einzelnen Funktionen heute
genutzt werden, fachlich richtig sind oder in Cemaris übernommen werden sollen.
Ohne Interview oder fachliche Freigabe bleibt eine weitergehende, aus EDWALT
abgeleitete Aussage grundsätzlich `OFFEN` oder `ANNAHME`.

## Bestätigte Projektentscheidungen

| Evidenz | Entscheidung | Evidenztyp | Status | Konfidenz | Auswirkung |
| --- | --- | --- | --- | --- | --- |
| `INT-001` | Die korrekte Produktbezeichnung ist **EDWALT**. **EDWALT3** bezeichnet dasselbe Produkt beziehungsweise die untersuchte Version. Die frühere Cemaris-Schreibweise ohne abschließendes `T` war falsch. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | EDWALT wird in Texten kanonisch verwendet; der historische Dateiname `edwald-inventory.md` bleibt nur zur Linkkompatibilität bestehen. |
| `INT-002` | Cemaris bildet EDWALT weder funktional noch technisch 1:1 nach. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | EDWALT-Funktionen dienen als Quellenbeleg und Interpretationshilfe, nicht als Produkt-Backlog. |
| `INT-003` | Die fachlich relevanten EDWALT-Daten sollen nach Cemaris migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Technische Datenerschließung, Migrationsumfang, Aufbewahrung und Abnahme werden eigene Arbeitsstränge. |
| `INT-004` | Cemaris wird als neue, eigenständige Open-Source-Friedhofsverwaltungssoftware entwickelt. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Das Zielmodell folgt heutigen Anforderungen und nicht der EDWALT-Datei- oder Maskenstruktur. |
| `INT-005` | EDWALT ist aktuell produktiv im Einsatz, wird von ungefähr drei Personen verwendet, und die untersuchten Verzeichnisse enthalten das aktuelle Programm sowie den aktuellen Datenstand. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Quellen als aktuellen Ist-Stand behandeln; konkrete Funktionsnutzung und konsistenter späterer Migrationsstichtag bleiben offen. |
| `INT-006` | Auch abgeschlossene und historische Fälle sollen vollständig migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Migrationsplanung darf sich nicht auf aktive Fälle beschränken; Datenkategorien und Ausschlüsse bleiben zu klären. |
| `INT-007` | Betriebsnotwendige Daten sollen so migriert werden, dass keine umfangreiche manuelle Nacherfassung erforderlich ist; Notizen sollen nicht migriert werden. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch | Migrationsumfang an Betriebsnotwendigkeit ausrichten; Notizdaten ausschließen und weitere Ausschlüsse einzeln bestätigen. |
| `INT-008` | Regelmäßig genutzt werden Personen/Adressen, Beisetzungen, Nutzungsrechte/Verlängerungen, Gebühren/Bescheide/Buchungen sowie Suche/Listen/Statistiken; selten Gräber/Friedhofsstruktur, Termine/Wiedervorlagen und Dokumente/Word-Vorlagen; Krematorium gar nicht. | INTERVIEW, Projektverantwortung, 10.08.2026 | `BESTÄTIGT` | hoch für Bereichshäufigkeiten | Kernprozesse priorisieren; seltene Bereiche nicht automatisch verwerfen; Krematorium separat abgrenzen. |

Die einzelnen zu migrierenden Datenkategorien, fachlichen Regeln und
Cemaris-Funktionen bleiben bis zur weiteren Erhebung `OFFEN`.

**Schutzgrenzen:**

- Quelle 1: `D:\Friedhofsverwaltung\EDW3DAT` - strikt read-only;
- Quelle 2: `D:\Friedhofsverwaltung\edwalt3` - strikt read-only;
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
7. DAT-/IDX-Dateien wurden nur über Metadaten, Partnerbildung und begrenzte Magic Bytes klassifiziert. Es wurden keine Datensätze gelesen und keine Datensatzanzahlen ermittelt.
8. Abschließend wurde der komplette Ausgangsstand erneut gegen Pfad, Größe,
   Änderungs- und Erstellungszeit, Attribute und SHA-256 verglichen.

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

## Übergreifende Grenzen

| Evidenz | Grenze | Folge | Status | Konfidenz | Nächste Klärung |
| --- | --- | --- | --- | --- | --- |
| `OBS-LIM-001` | Proprietäres DAT-/IDX-Format wurde nicht mit einem schreibenden oder unbekannten Treiber geöffnet. | Satzaufbau, Schlüssel, Zählwerte und Datenqualität bleiben offen. | `OFFEN` | hoch | Herstellerformat und garantiert read-only Parser in isolierter Kopie prüfen. |
| `OBS-LIM-002` | Die Handbücher beschreiben Kasse/Buchen und Terminverwaltung nur knapp und verweisen auf gesonderte Beschreibungen, die nicht vorliegen. | Funktionsumfang dieser Module ist unvollständig dokumentiert. | `OFFEN` | hoch | Fehlende Bände und reale Prozessbeobachtung anfordern. |
| `OBS-LIM-003` | Vorhandene Module und aktuelle Zeitstempel beweisen keine Nutzung. | Nutzungsstatus bleibt je Funktion offen. | `OFFEN` | hoch | Interviews, Nutzungsbeobachtung und freigegebene Betriebsprotokolle. |
| `OBS-LIM-004` | Alte OLE-Vorlagen konnten statisch auf Word-Streams und Feldnamen, nicht layoutgetreu oder semantisch vollständig geprüft werden. | Dokumentzweck und Makrofreiheit sind nicht abschließend bewiesen. | `OFFEN` | mittel | Isolierte, makrodeaktivierte Dokumentforensik an freigegebenen Kopien. |
| `OBS-LIM-005` | Es wurde kein Winyard-Verweis in den Quellen gefunden. | Das beweist nicht, dass Ablageprozesse außerhalb von EDWALT fehlen. | `OFFEN` | mittel | DMS-Prozess außerhalb des Altverfahrens beobachten. |

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
| `VAL-007` | lokale Markdown-Links der Analyse und aktualisierten Indexdokumente | 31 Links geprüft; 0 ungültig | `ANNAHME` | hoch | Keine. |
| `VAL-008` | Repository-Inhalt | keine unversionierte Binärdatei; nur Markdown und CSV neu; keine Handbücher, Bilder, Programme oder Vorlagen kopiert | `ANNAHME` | hoch | Redaktionelle/Datenschutz-Freigabe vor Veröffentlichung. |
| `VAL-009` | Klartextmuster für Passwortwert, Server/Benutzer/DSN, UNC-Pfad und E-Mail in neuen Analysedateien | 0 Treffer; Konfigurationswerte blieben maskiert/nicht dokumentiert | `ANNAHME` | hoch | Eine menschliche Datenschutz-Endprüfung bleibt vor Veröffentlichung sinnvoll. |
| `VAL-010` | Git-Whitespace-/Patchprüfung | `git diff --check` ohne Befund | `ANNAHME` | hoch | Unversionierte Dateien werden zusätzlich separat auf Whitespace geprüft. |
