# Technisches Inventar der EDWALT-Datenbestände

Stand: 11. August 2026

## Zweck und Untersuchungsgrenze

Dieses Inventar beschreibt die in `EDW3DAT` und `Edwalt3` vorhandenen
DAT/IDX-Paare. Es ist keine fachliche Datenmodellierung und kein
Migrationsmapping. Phase 1 untersuchte nur Metadaten, SHA-256 und kurze Header.
Phase 2 identifizierte und exportierte Datensätze ausschließlich aus einer
hashgeprüften Arbeitskopie außerhalb des Repositories; Originale und Indizes
wurden weder repariert noch neu aufgebaut.

Alle 24 DAT-Dateien besitzen einen gleichnamigen IDX-Partner; umgekehrt wurde
keine verwaiste IDX-Datei festgestellt. Mit den mitgelieferten
Micro-Focus-Komponenten `MFFH.DLL` und `REBUILD.EXE` ist die konkrete
Organisation inzwischen als Micro-Focus indexed file, `IDXFORMAT(4)`, mit
fester logischer Satzlänge bestätigt. Satzlängen und Indexdefinitionen stehen
im [technischen Phase-2-Profil](../../migration/edwalt-extraction-prototype.md).

| Aussage | Evidenz | Status | Konfidenz | Offene Frage |
|---|---|---|---|---|
| 24 vollständige DAT/IDX-Paare sind vorhanden. | `source-manifest.csv`, SRC-DAT-0004 bis SRC-DAT-0147 sowie SRC-APP-0364/0365 und SRC-APP-0443/0444 | ANNAHME | hoch | Sind alle Paare produktive Bestände oder teilweise nur Alt-/Beispieldaten? |
| Micro-Focus indexed file, `IDXFORMAT(4)`, feste Satzlänge | Herstellerwerkzeug `/n`, sequenzieller Export und unabhängiger physischer Parser auf der Arbeitskopie | BESTÄTIGT | hoch | Keine technische Formatfrage; Feldtypen und Semantik bleiben offen. |
| 53.991 aktive Sätze, 4.119 physische Löschsätze und 0 Primärschlüsseldubletten | aggregiertes Phase-2-Profil ohne Quellwerte | BESTÄTIGT technisch | hoch | Zwei leere Primärschlüssel und fachliche Beziehungsausnahmen klassifizieren. |
| Copybooks, FD-Dateien und weitere Herstellerunterlagen sind nicht verfügbar; der Hersteller existiert nicht mehr. | INT-037 | BESTÄTIGT | hoch | Satzfelder aus lokalen Evidenzen rekonstruieren und Unsicherheit dokumentieren. |

## Vollständige Paarliste

Zeitangaben sind UTC. Größen beziehen sich auf DAT und IDX. Ein aktueller
Zeitstempel ist nur ein Nutzungsindiz und beweist weder fachliche Verwendung
noch Datenqualität.

Aktive Satzmengen, Satzlängen, Indexanzahlen, Löschsätze und aggregierte
Schlüsselbeziehungen werden zentral im
[technischen Phase-2-Profil](../../migration/edwalt-extraction-prototype.md)
geführt und hier nicht dupliziert. Die folgende Paarliste beschreibt weiterhin
die vorläufige fachliche Quellenklassifikation.

| Daten-ID | DAT / IDX (lokaler Quellenverweis) | Größe DAT / IDX | Änderung DAT / IDX | Mögliche Aufgabe und Beleg | Mögliche Datenkategorien / Risiko | Status; Konfidenz | Offene Frage |
|---|---|---:|---|---|---|---|---|
| DAT-001 | `EDW3DAT\buch.dat` / `buch.idx` (SRC-DAT-0004/0005) | 18.055.324 / 1.331.200 B | 2026-07-28 / 2026-07-28 | Buchungen bzw. Personenkonten; Handbuchteil III/VI und Modul `BUCHSCHN.GS` | Finanz-/Gebührenbezug, Personen- und Vorgangsreferenzen; hoch | ANNAHME; mittel | Ist dies das führende Personenkonto, und welche externen Buchungsnummern bilden den Schlüssel? |
| DAT-002 | `EDW3DAT\BUCHA.DAT` / `BUCHA.IDX` (SRC-DAT-0006/0007) | 1.726.652 / 231.424 B | 2004-10-19 / 2004-10-19 | Historische/alternative Buchungen; Namensnähe zu DAT-001 und Alter | Finanz-/Personenbezug möglich; hoch | ANNAHME; niedrig | Archiv, Altdaten oder aktive Nebenablage? |
| DAT-003 | `EDW3DAT\Buchalt.dat` / `Buchalt.idx` (SRC-DAT-0008/0009) | 341.612 / 60.416 B | 2002-01-14 / 2002-01-14 | Altbestand zu Buchungen; Suffix `alt` ist nur ein Indiz | Finanz-/Personenbezug möglich; hoch | ANNAHME; mittel | Welche Aufbewahrungs- und Abgrenzungsregel verbindet DAT-003 mit DAT-001? |
| DAT-004 | `EDW3DAT\DRAUF.DAT` / `DRAUF.IDX` (SRC-DAT-0010/0011) | 2.879.712 / 2.051.072 B | 2026-08-04 / 2026-08-04 | Druckaufträge; Handbuch und Release 3.20 beschreiben überarbeitete Druckaufträge | Personen-/Vorgangsreferenzen und Dokumentstatus möglich; hoch | ANNAHME; hoch | Ist der Bestand nur eine Warteschlange oder revisionsrelevante Druckhistorie? |
| DAT-005 | `EDW3DAT\form.dat` / `form.idx` (SRC-DAT-0047/0048) | 128 / 3.072 B | 2007-07-24 / 2007-07-24 | Formularsteuerung; Handbuch nennt Formularzuordnungen und Formularnummern | Konfigurationsdaten; gering bis mittel | ANNAHME; mittel | Wird die Zuordnung heute noch aus dieser Datei oder aus `EDWALT3.INI` gelesen? |
| DAT-006 | `EDW3DAT\KASSENZ.DAT` / `KASSENZ.IDX` (SRC-DAT-0096/0097) | 128 / 8.192 B | 2001-03-20 / 2001-03-20 | Kassenzeichen/-zähler; Dateiname, INI-Schlüssel und `KASSENZ.GS` | Finanzielle Identifikatoren; hoch | ANNAHME; mittel | Zähler, Schlüsselreservierung oder historischer Bestand? |
| DAT-007 | `EDW3DAT\STATIST.DAT` / `STATIST.idx` (SRC-DAT-0115/0116) | 22.454.060 / 816.128 B | 2026-07-28 / 2026-07-28 | Statistikbasis; Handbuch nennt abweichend `STAT.DAT`, während `STATIST.TXT` dieselbe fachliche Richtung zeigt | Aggregierte Friedhofs-/Gebührendaten, eventuell Vorgangsbezug; mittel | WIDERSPRUCH; mittel | Ist `STAT.DAT` ein alter Name, und enthält DAT-007 nur Aggregate oder Einzeldaten? |
| DAT-008 | `EDW3DAT\W001.dat` / `W001.idx` (SRC-DAT-0118/0119) | 2.956 / 3.072 B | 2026-07-28 / 2026-01-05 | Anwenderverwaltung; EDW-Handbuchabschnitt „Anwenderdaten“ | Benutzerkennung, Rechte, möglicherweise Authentisierungsmerkmale; hoch | ANNAHME; hoch | Welche Felder sind sicherheitskritisch, und werden sie noch produktiv ausgewertet? |
| DAT-009 | `EDW3DAT\W004.dat` / `W004.idx` (SRC-DAT-0120/0121) | 3.296 / 3.072 B | 2026-08-04 / 2026-07-28 | Bediener-/Sachbearbeiterstamm; EDW-/EDK-Handbuch | Beschäftigtendaten und Dokumentkürzel; mittel bis hoch | ANNAHME; hoch | Welche Bedienerdaten dürfen migriert werden; warum weichen DAT-/IDX-Zeitstempel ab? |
| DAT-010 | `EDW3DAT\W005.dat` / `W005.idx` (SRC-DAT-0122/0123) | 13.256 / 4.096 B | 2026-01-05 / 2026-01-05 | Friedhofs- und Grabartstamm; beide Handbücher | Struktur-, Bezeichnungs- und Fristparameter; hoch migrationsrelevant | ANNAHME; hoch | Welche Friedhöfe/Grabarten sind aktuell, zusammengelegt oder historisch? |
| DAT-011 | `EDW3DAT\W005dm.dat` / `W005dm.idx` (SRC-DAT-0124/0125) | 13.224 / 5.120 B | 2002-01-31 / 2002-01-31 | DM-Variante von DAT-010; Dateiname und Zeitlage | Historische Struktur-/Gebührenparameter; mittel | ANNAHME; mittel | Reiner Umstellungsstand oder weiterhin benötigte Historie? |
| DAT-012 | `EDW3DAT\W006.dat` / `W006.idx` (SRC-DAT-0126/0127) | 31.320 / 8.192 B | 2026-02-26 / 2026-02-26 | Gebührenstamm; EDW-/EDK-Handbuch | Gebührenarten, Beträge, Gültigkeit/Zuordnung; hoch migrationsrelevant | ANNAHME; hoch | Wie werden Satzungsstände und historische Beträge abgegrenzt? |
| DAT-013 | `EDW3DAT\W007.dat` / `W007.idx` (SRC-DAT-0130/0131) | 960 / 4.096 B | 2007-07-24 / 2007-07-24 | Sonstige Anschriften; EDW-/EDK-Handbuch | Organisations- oder Personenanschriften; hoch, falls personenbezogen | ANNAHME; hoch | Welche Einträge sind Organisationen, welche natürliche Personen? |
| DAT-014 | `EDW3DAT\W010.dat` / `W010.idx` (SRC-DAT-0132/0133) | 608 / 4.096 B | 2023-07-31 / 2023-07-31 | Termin-/Kalenderdaten; EDW-Handbuch und Termin-INI-Schlüssel | Termine, eventuell Bestattungs- und Personendaten; hoch | ANNAHME; hoch | Wird die interne Terminverwaltung heute genutzt oder extern ersetzt? |
| DAT-015 | `EDW3DAT\W020.dat` / `W020.idx` (SRC-DAT-0134/0135) | 2.191.632 / 1.850.368 B | 2026-08-04 / 2026-08-04 | Grab-/Nutzungsrechts-Hauptbestand; EDW-Handbuch „Grabstamm“ | Grabidentifikation, Lage, Berechtigte, Anschriften, Laufzeiten; sehr hoch | ANNAHME; hoch | Welcher Schlüssel identifiziert ein Grab dauerhaft, besonders nach Umnummerierung/Kopie? |
| DAT-016 | `EDW3DAT\W021.dat` / `W021.idx` (SRC-DAT-0136/0137) | 13.943.752 / 2.755.584 B | 2026-08-04 / 2026-08-04 | Vorgänge, Verstorbene, Beisetzungen und Gebührenpositionen; EDW-Handbuch | Stammdaten Verstorbener, Sterbe-/Beisetzungsdaten, Vorgänge, Gebühren; sehr hoch | ANNAHME; hoch | Satztypen, Kardinalitäten und Verbindung zu DAT-015/DAT-001? |
| DAT-017 | `EDW3DAT\W022.dat` / `W022.idx` (SRC-DAT-0138/0139) | 685.836 / 100.352 B | 2026-08-04 / 2026-08-04 | Bemerkungen/Notizen; 26-Byte-Grabschlüssel plus exakt 2.000 Byte Notiz | Freitext mit potenziell besonders sensiblen Angaben; laut INT-007 nicht zu migrieren; keine weiteren strukturierten Felder | Layout und Migrationsentscheidung `BESTÄTIGT`; hoch | Einen verwaisten Notizschlüssel im späteren Reconciliation-Bericht ausweisen; Inhalt nicht ausgeben. |
| DAT-018 | `EDW3DAT\W023.dat` / `W023.idx` (SRC-DAT-0140/0141) | 57.264 / 22.528 B | 2026-07-21 / 2026-07-21 | Vorgangsbezogene Zusatzdaten des Fensters „Sonstiges“; 28-Byte-W021-Schlüssel und 16×30-Byte-Hinweisbereich technisch belegt | Verstorbene-/Vorgangszusatzdaten, darunter freie Hinweise; hoch | Struktur `BESTÄTIGT`, Einzelfeldsemantik teilweise `OFFEN`; hoch | Zweck/Rechtsgrundlage der 16 Hinweise und Bedeutung des Zusatzkopfs 29–127 klären. |
| DAT-019 | `EDW3DAT\W040.dat` / `W040.idx` (SRC-DAT-0142/0143) | 347.760 / 65.536 B | 2025-02-26 / 2025-02-26 | Sonstige Bescheide/Aufträge; EDW-Handbuch Teil V | Adressaten, Vorgang, Gebühren und Dokumentstatus; sehr hoch | ANNAHME; hoch | Welche Bescheidarten sind noch zulässig und tatsächlich genutzt? |
| DAT-020 | `EDW3DAT\W040alt.dat` / `W040alt.idx` (SRC-DAT-0144/0145) | 793.764 / 50.176 B | 2002-01-14 / 2002-01-14 | Altbestand zu DAT-019; Suffix `alt` | Historische Bescheid-/Personendaten; sehr hoch | ANNAHME; mittel | Archivgrenze, Rechtsgrundlage und Aufbewahrungsfrist? |
| DAT-021 | `EDW3DAT\W080.dat` / `W080.idx` (SRC-DAT-0146/0147) | 6.456 / 15.360 B | 2007-07-24 / 2007-07-24 | Krematoriumsbestand; EDK-Handbuch | Verstorbene, Einäscherung, Versand, Arzt-/Bestatterbezug; heutige Nichtnutzung durch INT-008 bestätigt; strukturierter Bestand laut INT-027 zu migrieren; sehr hoch | Klassifikation `ANNAHME`, Nichtnutzung und Migrationsentscheidung `BESTÄTIGT`; hoch | Satzlayout, Feldsemantik, Schlüssel, Beziehungen und zulässige Datenkategorien? |
| DAT-022 | `EDW3DAT\W006dm.dat` / `W006dm.idx` (SRC-DAT-0128/0129) | 133.184 / 10.240 B | 2002-01-31 / 2002-01-31 | DM-Variante des Gebührenstamms; Dateiname und Zeitlage | Historische Gebühren-/Satzungsdaten; hoch | ANNAHME; mittel | Muss diese historische Währungsvariante aus Aufbewahrungsgründen übernommen werden? |
| DAT-023 | `edwalt3\W002.DAT` / `W002.IDX` (SRC-APP-0443/0444) | 4.928 / 4.096 B | 2026-01-05 / 2026-01-05 | Pfad-/Arbeitsplatzkonfiguration; EDW-/EDK-Handbuch „Pfadangaben“ | Netz-, Druck- und Arbeitsverzeichnisse; Betriebsgeheimnisse möglich | ANNAHME; hoch | Arbeitsplatzlokal oder geteilt; welche Pfade sind aktuell und dürfen nicht migriert werden? |
| DAT-024 | `edwalt3\oliW002.dat` / `oliW002.idx` (SRC-APP-0364/0365) | 4.768 / 4.096 B | 2002-04-25 / 2002-04-25 | Alternative/alte Pfadkonfiguration; Namenspräfix allein nicht auswertbar | Betriebs-/Pfaddaten; mittel | ANNAHME; niedrig | Was bedeutet `oli`, und wird der Bestand irgendwo geladen? |

## Erkannte Varianten, Beziehungen und Widersprüche

- DAT-002, DAT-003 und DAT-001 bilden technisch eine Buchungsfamilie mit
  identischem 2.348-Byte-Legacy-Layout und neun gleichen Indexsegmenten.
  `buch` erweitert dieses Layout auf 27.360 Byte; bei 598 gemeinsamen
  `buch`/`BUCHA`-Schlüsseln ist das vollständige Legacy-Präfix identisch.
  Die Erweiterung zerfällt technisch in 105 vollständige 236-Byte-Perioden
  und einen in allen 11.955 Sätzen SP-gefüllten 232-Byte-Rest. Nur die Perioden
  1–9 besitzen nicht-nullwertige Instanzen. Status: Layout `BESTÄTIGT`,
  Unterfeld- und fachliche Archivgrenzen `OFFEN`; Konfidenz: hoch; Evidenz:
  SRC-DAT-0004 bis SRC-DAT-0009 und technisches Feld-/Periodenprofil.
- DAT-011 und DAT-022 tragen den Zusatz `dm` und stammen aus 2002. Eine
  Verbindung zur DM-/Euro-Umstellung ist plausibel, aber unbestätigt. Status:
  ANNAHME; Konfidenz: mittel; Evidenz: SRC-DAT-0124/0125 und
  SRC-DAT-0128/0129. OFFEN: Aufbewahrungsbedarf.
- DAT-019 und DAT-020 sowie DAT-023 und DAT-024 sind erkennbare aktuelle/alte
  oder alternative Paare. Status: ANNAHME; Konfidenz: mittel. OFFEN: welche
  Variante führend ist.
- Das Handbuch nennt im Statistikablauf `STAT.DAT`; vorhanden ist
  `STATIST.DAT`. Status: WIDERSPRUCH; Konfidenz: hoch; Evidenz: MAN-EDW-316,
  SRC-DAT-0115/0116. OFFEN: Produktversionswechsel oder fehlender Bestand.
- Bei W001 und W004 liegen DAT- und IDX-Änderungszeiten auseinander. Das kann
  durch Dateiorganisation, Sicherung oder Kopie entstehen und beweist keinen
  fehlerhaften Index. Status: ANNAHME; Konfidenz: hoch; Evidenz:
  SRC-DAT-0118 bis SRC-DAT-0121. OFFEN: vom Hersteller vorgesehene Semantik.

## Datenqualitäts- und Migrationsrisiken

| Risiko | Betroffene Evidenz | Bewertung | Sichere Folgemaßnahme |
|---|---|---|---|
| Technisches Format bekannt, mehrere Einzelfelder und COBOL-Dezimaltypen innerhalb rekonstruierter Layoutzonen noch undokumentiert | alle DAT/IDX; Micro-Focus-Laufzeit SRC-APP-0333; technisches Phase-2-Feldprofil und Quellfeldkatalog | hoch; Format, Blockunterzonen und priorisierte Layoutzonen `BESTÄTIGT`, Einzelfeldsemantik teilweise `OFFEN`; Konfidenz hoch | Für nullinitialisierte W021/W040-Blöcke einen freigegebenen nichtleeren Referenzbestand oder Feldbreitenbeleg beschaffen; unbekannte Bereiche erhalten. |
| Historische Varianten ohne Abgrenzungsregel | DAT-002/003/011/020/022/024 | hoch; technische Überlappungen `BESTÄTIGT`, fachliche Rolle `OFFEN`; Konfidenz hoch | Zeitfelder, Inhalt und Programmzugriff analysieren; Varianten nicht pauschal vereinigen. |
| Unterschiedliche Zeitstempel sind kein Konsistenznachweis | besonders DAT-008/009 | mittel; ANNAHME; Konfidenz hoch | Logische Satzmengen und Schlüssel sind profiliert; Zeitstempel nicht als fachliche Gültigkeit behandeln. |
| Freitext und besonders schützenswerte Ereignisdaten | DAT-016 bis DAT-021 | sehr hoch; ANNAHME; Konfidenz hoch | Datenschutz-, Zweckbindungs-, Berechtigungs- und Löschkonzept vor Migration bestätigen. |
| Historische Währung, Gebühren und externe Kontonummern | DAT-001 bis DAT-003, DAT-006, DAT-012, DAT-022 | hoch; ANNAHME; Konfidenz mittel | Satzungsstände und finanzielle Abstimmregeln mit Kasse/Fachamt erheben. |
| Technische Schlüsselbeziehungen weisen verwaiste Referenzen auf; ihre fachliche Bedeutung ist noch nicht vollständig belegt | DAT-001, DAT-015 bis DAT-020; technisches Phase-2-Profil | sehr hoch; technische Mengen `BESTÄTIGT`, Fachsemantik und Ausschlussregel `OFFEN`; Konfidenz hoch | Feldsemantik, führende Schlüssel, gültige Nachfolger und aktuelle Nummer belegen, bevor REQ-MIG-004/005 filtern. |
| Positionsblöcke können Initialnullen statt fachlicher Gebührenpositionen enthalten | DAT-016/019/020; 454.752 W021- und 16.968 W040/W040alt-Blockinstanzen | sehr hoch; Nullwertbelegung `BESTÄTIGT`, Feldrollen bei nichtleerem Bestand `OFFEN`; Konfidenz hoch | Keine Nullpositionen erzeugen; Belegung und Referenz vor jeder Übernahme nachweisen. |
| Die indexierten BUCH-Bereiche 118/126/134 sind keine nutzbaren Datumsquellen | DAT-001/002/003; je Feld ausschließlich `00000000` | hoch; für diesen Bestand `WIDERLEGT`; Konfidenz hoch | Fälligkeit nicht aus diesen Feldern ableiten; alternative Quellposition oder freigegebene führende Quelle belegen. |

## Weiterhin nicht sicher ermittelbar

Technische Satzmengen, feste Längen, Indexschlüssel, physische Löschsatztypen
und mehrere Referenzbeziehungen sind inzwischen ermittelt. Die Layoutzonen der
priorisierten Dateien und die technischen Unterzonen der wiederholten
Positionsblöcke sind abgegrenzt. 124 Gebührenreferenz- und 5.200
Dezimal-/Rechenhypothesen konnten wegen Initialnullen keinen fachlichen
Positionswert validieren. Weiterhin offen sind insbesondere einzelne
Feldgrenzen innerhalb der Sammelbereiche, COBOL-Dezimal- und Vorzeichentypen,
fachliche Nullsemantik, Codewerte, Status-/Nachfolgerregeln und die fachliche
Vorrangregel historischer Varianten. `RebuildW.exe`, REORG-Batchdateien und das
Altprogramm wurden nicht ausgeführt. `REBUILD.EXE` kam nur auf der externen
Arbeitskopie für den Informationsmodus und den sequenziellen Export zum Einsatz.
Das große `rebuild.err` wurde nach Erkennung binärnaher und möglicherweise
inhaltsbezogener Daten nicht weiter inhaltlich untersucht (SRC-DAT-0110;
Status: OFFEN; Konfidenz: hoch; Frage: enthält es schützenswerte Satzfragmente
und darf es in einer gesicherten Umgebung ausgewertet werden?).
