# Evidenzmatrix und Lückenanalyse

Stand: 10. August 2026

## Lesart

Die Matrix verbindet den [Funktionskatalog](function-catalog.md) mit
[Handbuchthemen und Bildern](manual-index.md),
[Komponenten](technical-components.md),
[Datenbeständen](data-storage-inventory.md) und
[Dokumenten](documents-reports-templates.md). `REL-320` bezeichnet
`Release3.20.doc/.pdf` (SRC-APP-0402/0403), `REL-330`
`Release3.30.doc/.pdf` (SRC-APP-0404/0405).

Die Spalte „Nutzungsindiz“ ist ausdrücklich keine Nutzungsbestätigung. Die
einzelnen Funktionszeilen beruhen weiterhin auf der technischen Bestandsaufnahme
und bestätigen keine Cemaris-Anforderung. `INT-008` bestätigt inzwischen die
Nutzungshäufigkeit zusammengefasster Funktionsbereiche; daraus folgt weder die
Nutzung jeder zugeordneten Einzelfunktion noch deren Übernahme nach Cemaris.
Die bestätigten Bereichshäufigkeiten und ihre vorläufige Zuordnung stehen im
[Funktionskatalog](function-catalog.md).

## Grundsystem und Stammdaten

| Funktions-ID | Handbuch / Screenshot | Programmkomponente | Datenbestand | Vorlage/Ausgabe/Release | Nutzungsindiz | fachliche Bestätigung; Status; Konfidenz | Wichtigste Lücke |
|---|---|---|---|---|---|---|---|
| FUN-001 | MAN-EDW-001 / IMG-EDW-112; MAN-EDK-001 / IMG-EDK-193 | TECH-001/012 | DAT-008/009 | keines | W001/W004 2026; kann technische Berührung sein | nein; ANNAHME; hoch | aktuelle Identitätsquelle und Passwort-/Sperrregeln |
| FUN-002 | MAN-EDW-002 / IMG-EDW-113; MAN-EDK-001 / IMG-EDK-194 | TECH-001 | W001/W004 indirekt | keines | Kern- und Moduldateien vorhanden | nein; ANNAHME; hoch | produktiv sichtbare/lizenzierte Menüs |
| FUN-010 | MAN-EDW-010 / IMG-EDW-114/115; MAN-EDK-010 / IMG-EDK-195/196 | TECH-012 | DAT-008 | Stammlisten indirekt | W001 2026 | nein; ANNAHME; hoch | führende Organisations-/Nummernparameter |
| FUN-011 | MAN-EDW-011 / IMG-EDW-116; MAN-EDK-011 / IMG-EDK-197 | TECH-005/006/009 | DAT-023/024 | keines | W002 2026, oliW002 2002 | nein; ANNAHME; hoch | Arbeitsplatzvarianten und aktive Pfade |
| FUN-012 | MAN-EDW-012 / IMG-EDW-117; MAN-EDK-012 / kein Bild | TECH-009 | keine eigene sichere Zuordnung | keines | INI vorhanden, Werte nicht als Nutzung belegt | nein; ANNAHME; hoch | aktive versus veraltete Schlüssel |
| FUN-013 | MAN-EDW-013 / IMG-EDW-118; MAN-EDK-013 / IMG-EDK-198 | TECH-012 | DAT-009 | keines | W004 2026 | nein; ANNAHME; hoch | reale Rollen, Trennung und Revision |
| FUN-014 | MAN-EDW-014 / IMG-EDW-119–122; MAN-EDK-014 / kein Bild | TECH-012 | DAT-010/011/014 | REP-EDW-013 | W005 2026; W005dm 2002 | nein; ANNAHME; hoch | aktuelle Struktur und Satzungsstände |
| FUN-015 | MAN-EDW-015 / IMG-EDW-123/124; MAN-EDK-015 / IMG-EDK-199/200 | TECH-012 | DAT-012/022 | REP-EDW-014 | W006 2026; W006dm 2002 | nein; ANNAHME; hoch | Gültigkeit, Historie, Berechnung |
| FUN-016 | MAN-EDW-016 / IMG-EDW-125; MAN-EDK-016 / IMG-EDK-201 | TECH-012 | DAT-013 | REP-EDW-015 | W007 zuletzt 2007 | nein; ANNAHME; hoch | Adressarten, Personen/Organisationen, Dubletten |
| FUN-017 | MAN-EDW-017 / IMG-EDW-126; MAN-EDK-017 / IMG-EDK-202 | TECH-010/012 | keine DAT-Zuordnung | keines | AUSWAHL.INI vorhanden | nein; ANNAHME; hoch | fachlich gültige Wertelisten |
| FUN-018 | MAN-EDW-018 / IMG-EDW-127/129; MAN-EDK-018 / IMG-EDK-203/205 | TECH-013/016 | DAT-005 | Editorformulare nicht als separate Dateien sicher erkannt | form.dat zuletzt 2007 | nein; ANNAHME; hoch | Ablage und produktive Editorformulare |
| FUN-019 | MAN-EDW-019 / IMG-EDW-128; MAN-EDK-019 / IMG-EDK-204 | TECH-008/013/016 | EDW_SD-Steuerdateien | TPL-001 ff.; DOC-001 bis DOC-004 | Vorlagen teils 2025, Steuerdateien teils 2026 | nein; ANNAHME; hoch | führende Vorlagen, Office-Version, Ablage |

## Grab- und Vorgangsbearbeitung

| Funktions-ID | Handbuch / Screenshot | Programmkomponente | Datenbestand | Vorlage/Ausgabe/Release | Nutzungsindiz | fachliche Bestätigung; Status; Konfidenz | Wichtigste Lücke |
|---|---|---|---|---|---|---|---|
| FUN-100 | MAN-EDW-100 / IMG-EDW-130 | TECH-014 | DAT-015/010 | TPL-001/002 u. a. | W020 2026 | nein; ANNAHME; hoch | dauerhafter Grab-/Lageschlüssel |
| FUN-101 | MAN-EDW-101 / IMG-EDW-131–133 | TECH-014 | DAT-016/010/012 | TPL-001/003/006 u. a. | W021 2026 | nein; ANNAHME; hoch | Vorgangsarten, Pflichtdaten und Fristregeln |
| FUN-102 | MAN-EDW-102 / IMG-EDW-134 | TECH-014 | DAT-018 | keine sichere Zuordnung | W023 2026; 28-Byte-W021-Schlüssel und 16×30-Byte-Hinweisbereich technisch bestätigt | Struktur `BESTÄTIGT`, Zweck/Inhalt `OFFEN`; hoch | Zweck/Rechtsgrundlage freier Zusatzfelder und Bedeutung des Zusatzkopfs 29–127 |
| FUN-103 | MAN-EDW-103 / IMG-EDW-135–137 | TECH-014/017/018 | DAT-001/006/012/016 | Bescheid-/Finanzdokumente | Buch/W006/W021 2026; W021-Positionsblock vollständig initialisiert, 26 Gebührenhypothesen ohne Treffer | Migrationsgrenze `BESTÄTIGT`, konkrete Positionsfelder `OFFEN`; hoch | Feldoffset und Dezimaldarstellung von festgesetztem Betrag/Fälligkeit; nichtleerer Referenzbestand |
| FUN-104 | MAN-EDW-104/200 / IMG-EDW-138/139/145/146 | TECH-014 | DAT-015/016 | keines | W020/W021 2026 | nein; ANNAHME; hoch | harte versus weiche Belegungsprüfung |
| FUN-105 | MAN-EDW-105 / IMG-EDW-140 | TECH-013/016/017 | DAT-004/001 | TPL-001 ff.; DOC-001 ff. | DRAUF 2026, Vorlagen bis 2025 | nein; ANNAHME; hoch | Druck-, Buchungs-, Nummern- und Ablagewirkung |
| FUN-106 | MAN-EDW-106 / IMG-EDW-141 | TECH-017 | DAT-001/016 | Gutschrift/Storno; REL-320/330 indirekt | Buch 2026 | nein; ANNAHME; hoch | finanzrechtliche Historie |
| FUN-107 | MAN-EDW-107 / IMG-EDW-142–144 | TECH-014 | DAT-015/016/001 | Gutschrift möglich | nur Handbuch | nein; ANNAHME; mittel | heutige Nutzung und Rechtskontext |
| FUN-108 | MAN-EDW-201 / IMG-EDW-147 | TECH-014 | DAT-015/016 | REL-330 nennt reparierte Grabsuche | Daten aktuell, Suchnutzung offen | nein; ANNAHME; hoch | Suchpraxis, Rechte, Protokollierung |
| FUN-109 | MAN-EDW-203 / IMG-EDW-149 | TECH-014 | DAT-015/016 | keines | nur Handbuch + Daten | nein; ANNAHME; hoch | Referenz- und Historienfortschreibung |
| FUN-110 | MAN-EDW-204 / IMG-EDW-150/151 | TECH-014 | DAT-015/017 | keines | nur Handbuch + Daten | nein; ANNAHME; hoch | führende Adressrollen |
| FUN-111 | MAN-EDW-205 / IMG-EDW-152 | TECH-014 | DAT-015–018 | keines | nur Handbuch; keine Löschung beobachtet | nein; ANNAHME; hoch | Zulässigkeit, Protokoll, Wiederherstellung |
| FUN-112 | MAN-EDW-206/307 / IMG-EDW-153/170 | TECH-014/015 | DAT-015 | REP-EDW-007; REL-320/330 | Releaseänderungen, Nutzung offen | nein; ANNAHME; hoch | Status-/Frist-/Schreibsemantik |
| FUN-113 | MAN-EDW-207 / IMG-EDW-154 | TECH-014 | DAT-017 | REP-EDW-001/003 optional | W022 2026 | nein; ANNAHME; hoch | Datenminimierung, Aufbewahrung, Migration |
| FUN-114 | MAN-EDW-208/209 / IMG-EDW-155/156 | TECH-014/017 | DAT-015/001 | Bescheid/PK-Ausgaben | W020/buch 2026 | nein; ANNAHME; hoch | Rollen, PK-Führung, Dubletten |
| FUN-115 | MAN-EDW-210/401 / IMG-EDW-157/188/189 | TECH-017/024 | DAT-015/012/001 | TPL-030/031; REL-320 | Vorlagen 2025, Daten aktuell | nein; ANNAHME; hoch | Bedeutung, Berechnung und Nutzung von FUG |
| FUN-116 | MAN-EDW-211 / IMG-EDW-158/159 | TECH-014/024 | DAT-016 | TPL-028 als unsicheres Indiz | nur Handbuch/Artefakt | nein; ANNAHME; mittel | Abgrenzung, Genehmigung, Dokumente |
| FUN-117 | MAN-EDW-213 / IMG-EDW-161 | TECH-015/016/017 | DAT-001/015/016 | Einzel-Kartei/-Mahnung/-Brief | Module/Vorlagen vorhanden | nein; ANNAHME; mittel | aktive Varianten und Versand |
| FUN-118 | MAN-EDW-214 / IMG-EDW-162 | TECH-031 | keine | HLP/HTML | Hilfedateien vorhanden | nein; ANNAHME; hoch | produktiv aufgerufene Fassung |

## Auswertungen

| Funktions-ID | Handbuch / Screenshot | Komponente | Daten | Vorlage/Ausgabe/Release | Nutzungsindiz | fachliche Bestätigung; Status; Konfidenz | Wichtigste Lücke |
|---|---|---|---|---|---|---|---|
| FUN-200 | MAN-EDW-300 / IMG-EDW-163 | TECH-015 | mehrere | REP-EDW-001–016 | AUSWERT*-Module | nein; ANNAHME; hoch | tatsächlich genutztes Reportset |
| FUN-201 | MAN-EDW-301 / IMG-EDW-164 | TECH-015/016 | DAT-015/017/007 | REP-EDW-001; REL-320 | Modul + Release | nein; ANNAHME; hoch | Spalten, Notizen, Empfänger |
| FUN-202 | MAN-EDW-302 / IMG-EDW-165 | TECH-015 | DAT-016 | REP-EDW-002 | Modul vorhanden | nein; ANNAHME; hoch | Löschwirkung |
| FUN-203 | MAN-EDW-303 / IMG-EDW-166 | TECH-015 | DAT-015–018 | REP-EDW-003 | Modul vorhanden | nein; ANNAHME; hoch | amtlicher/operativer Charakter |
| FUN-204 | MAN-EDW-304 / IMG-EDW-167 | TECH-015 | DAT-015/016/007 | REP-EDW-004 | Daten 2026 | nein; ANNAHME; hoch | Schreibwirkung und Definition |
| FUN-205 | MAN-EDW-305 / IMG-EDW-168 | TECH-015/016 | DAT-015 | REP-EDW-005 | Module/Vorlagen | nein; ANNAHME; hoch | Folgeprozess und Fristen |
| FUN-206 | MAN-EDW-306 / IMG-EDW-169 | TECH-015 | DAT-015/016 | REP-EDW-006 | Modul vorhanden | nein; ANNAHME; hoch | Zweck/Empfänger |
| FUN-207 | MAN-EDW-307 / IMG-EDW-170 | TECH-015/016 | DAT-015 | REP-EDW-007; REL-320/330 | Releaseänderung | nein; ANNAHME; hoch | Schreiben/Speichern/Löschen |
| FUN-208 | MAN-EDW-308 / IMG-EDW-171 | TECH-015/016 | DAT-015/016 | REP-EDW-008 | Modul vorhanden | nein; ANNAHME; hoch | Codebedeutung |
| FUN-209 | MAN-EDW-309 / IMG-EDW-172 | TECH-015/016 | DAT-015 | REP-EDW-009; TPL-001 ff. | Vorlagen vorhanden | nein; ANNAHME; hoch | Briefnummer↔Vorlage↔Rechtsgrundlage |
| FUN-210 | MAN-EDW-310 / IMG-EDW-173 | TECH-015 | DAT-016/007 | REP-EDW-010 | W021/STATIST 2026 | nein; ANNAHME; hoch | Register-/Aufbewahrungsstatus |
| FUN-211 | MAN-EDW-311 / IMG-EDW-174 | TECH-015/023 | DAT-014/016 | REP-EDW-011 | W010 2023, TE-Module | nein; ANNAHME; hoch | Aushang und Datenschutz |
| FUN-212 | MAN-EDW-312 / IMG-EDW-175 | TECH-015 | DAT-015/016 | REP-EDW-012 | Daten 2026 | nein; ANNAHME; hoch | Folgeaktion/Wiedervorlage |
| FUN-213 | MAN-EDW-313 / kein eigenes Bild | TECH-012/015 | DAT-010 | REP-EDW-013 | W005 2026 | nein; ANNAHME; hoch | Bedarf/Stichtag |
| FUN-214 | MAN-EDW-314 / kein eigenes Bild | TECH-012/015 | DAT-012 | REP-EDW-014 | W006 2026 | nein; ANNAHME; hoch | Satzungsstand |
| FUN-215 | MAN-EDW-315 / kein eigenes Bild | TECH-012/015 | DAT-013 | REP-EDW-015 | W007 2007 | nein; ANNAHME; hoch | Berechtigung/Exportzweck |
| FUN-216 | MAN-EDW-316 / kein eigenes Bild | TECH-015 | DAT-007 | REP-EDW-016; DOC-005 | STATIST 2026; STAT/STATIST-Namenskonflikt | nein; WIDERSPRUCH; hoch | Kennzahl/Datei-/Stichtagsdefinition |
| FUN-220 | MAN-EDK-300/301 / IMG-EDK-230 | TECH-015/022 | DAT-021 | REP-EDK-001/002; REL-320 | Module vorhanden, W080 2007 | nein; ANNAHME; mittel | Zweck/Amtsarzt/Kataster |
| FUN-221 | MAN-EDK-302 / IMG-EDK-230 | TECH-015/022 | DAT-021/007 möglich | REP-EDK-003 | nur Handbuch/Module | nein; ANNAHME; hoch | Gruppen-/Kennzahldefinition |
| FUN-222 | MAN-EDK-303 / IMG-EDK-230 | TECH-015/022 | DAT-021 | REP-EDK-004 | nur Handbuch/Module | nein; ANNAHME; mittel | Frist/Nachweis |
| FUN-223 | MAN-EDK-304 / IMG-EDK-230 | TECH-015/022 | DAT-021/013 | REP-EDK-005 | nur Handbuch/Module | nein; ANNAHME; mittel | Zweck/Datenschutz |
| FUN-224 | MAN-EDK-305 / IMG-EDK-231/232 | TECH-016/022 | DAT-004/021/001 | REP-EDK-006; TPL-080 ff. | Module/Vorlagen | nein; ANNAHME; hoch | optionale Installation und Buchungswirkung |

## Sonderprogramme, Krematorium und Schnittstellen

| Funktions-ID | Handbuch / Screenshot | Komponente | Daten | Vorlage/Ausgabe/Release | Nutzungsindiz | fachliche Bestätigung; Status; Konfidenz | Wichtigste Lücke |
|---|---|---|---|---|---|---|---|
| FUN-300 | MAN-EDW-400 / IMG-EDW-176–187 | TECH-013/016/017 | DAT-019/020/001 | REP-EDW-017; TPL-004 | W040 2025; 84×115-Block technisch belegt, nur zwei Bezeichnungsinstanzen ohne Finanzwerte | Struktur `BESTÄTIGT`, aktive Auftrags-/Bescheidarten und Unterfelder `OFFEN`; hoch | nichtleerer Referenzbestand, Feldbreiten und aktive Arten |
| FUN-301 | MAN-EDW-401 / IMG-EDW-157/188/189 | TECH-017/024 | DAT-015/012/001 | TPL-030/031; REL-320 | Vorlage 2025, Daten aktuell | nein; ANNAHME; hoch | Berechnung/Lastschrift/Nutzung |
| FUN-302 | MAN-EDW-402 / IMG-EDW-190 | TECH-017/018/020 | DAT-001/006 | Mahnung/OP/Ist; REL-320/330 | Buch 2026; statische Felder für Zahlungsdatum/-betrag, Rest, Zahlungsart und Mahnung belegt; FINANZ+ führt diese Daten | Systemhoheit und EDWALT-Ausschluss dieser Zahlungs-/Mahndaten `BESTÄTIGT`; hoch | Offsettrennung der zu migrierenden Bescheiddaten von den ausgeschlossenen Finanzfeldern |
| FUN-303 | MAN-EDW-403 / IMG-EDW-191 | TECH-023 | DAT-014 | REP-EDW-011 | W010 2023, TE/TEKOELN | nein; ANNAHME; hoch | separates Handbuch und tatsächliche Planung |
| FUN-400 | MAN-EDK-100 / IMG-EDK-207–210 | TECH-022 | DAT-021 | TPL-080 ff. | W080 2007, Module vorhanden; heutige Nichtnutzung INT-008; Migration INT-027 | Funktion nicht bestätigt; Migrationsumfang `BESTÄTIGT`; hoch | Satzlayout, Feldsemantik, Schlüssel und Beziehungen |
| FUN-401 | MAN-EDK-101 / IMG-EDK-211 | TECH-022 | DAT-021/013 | TPL-080 ff.; REP-EDK-004/006 | nur Handbuch/Module/Vorlagen | nein; ANNAHME; hoch | Versand-/Rückmeldenachweis |
| FUN-402 | MAN-EDK-102 / IMG-EDK-212 | TECH-017/022 | DAT-012/021/001 | Bescheid/Anordnung | Module, W006 aktuell | nein; ANNAHME; hoch | KREM-Gebühr/Führungssystem |
| FUN-403 | MAN-EDK-103 / IMG-EDK-213/214/216/217 | TECH-016/022 | DAT-004/021 | TPL-080 ff. | Vorlagen/Module | nein; ANNAHME; hoch | Vorlage/Auslöser/Ablage |
| FUN-404 | MAN-EDK-104 / IMG-EDK-215 | TECH-017/022 | DAT-001/021 | Gutschrift/Storno | nur Handbuch/Module | nein; ANNAHME; hoch | finanzrechtliche Regeln |
| FUN-405 | MAN-EDK-200/201 / IMG-EDK-219–224 | TECH-022 | DAT-021 | keines | W080 alt, Module | nein; ANNAHME; hoch | Suche/Löschung/Adressrollen |
| FUN-406 | MAN-EDK-202 / IMG-EDK-225–228 | TECH-017/022 | DAT-021/001 | Status-/Notizausgaben möglich | nur Handbuch/Module | nein; ANNAHME; hoch | Status und Freitext |
| FUN-500 | keine vollständige HTML-Ablaufhilfe | TECH-017/020 | DAT-001/006 | REL-320/330 | Module, INI-Schalter, Releases; laut INT-014 aktuell keine Übergabe | heutige Nichtnutzung `BESTÄTIGT`; hoch | manuelle Einbuchungsfelder, Kontrolle und Korrekturweg |
| FUN-501 | keine eindeutige Hilfe / kein Screenshot | TECH-019 | finanzbezogen, keine sichere DAT-Zuordnung | DTAUS-Modul | nur Programmartefakt | nein; ANNAHME; mittel | historisch, optional oder genutzt |
| FUN-502 | keine eindeutige Hilfe / kein Screenshot | TECH-007/021 | unbekannte Auswahl | SQL-/Exportmodul | nur Runtime/Programmartefakt | nein; ANNAHME; mittel | Ziel, Richtung, Umfang |
| FUN-503 | keine HTML-Maske | keine eindeutige Komponente | mögliche Lage-/Grabdaten | REL-320 (ArcView) | nur Releasehinweis | nein; ANNAHME; mittel | externe GIS-Bestände |
| FUN-504 | MAN-EDW-019/105; MAN-EDK-019/103 | TECH-008/013/016 | DAT-004 + EDW_SD | TPL/DOC-Inventar | Vorlagen/Steuerdateien teils aktuell | nein; ANNAHME; hoch | Dokument-ID, Freigabe, Ablage |
| FUN-600 | keine Fachhilfe; Wartungshilfe vorhanden | TECH-027 | alle DAT/IDX | `rebuild.err`, REORG-Log | Wartungsartefakte/Logs | nein; ANNAHME; hoch | autorisierter Wartungsprozess |
| FUN-601 | Parameterhilfe ohne Gesamtprozess | TECH-005/006/009 | alle Dateien/Netzpfade | keine | Fileshare/INI vorhanden | nein; ANNAHME; mittel | konsistente Sicherung/Restore |

## Lücken- und Widerspruchsanalyse

### Nur im Handbuch oder nicht durch lokale Fachdaten gestützt

- Eingeschränktes Nutzungsrecht (FUN-107) ist detailliert beschrieben, aber
  nicht durch einen eindeutig benannten Einzelbestand oder ein eindeutig
  zugeordnetes Modul belegbar. Status: ANNAHME; Konfidenz: mittel. OFFEN:
  heutige Nutzung und Rechtskontext.
- Mehrere Reports besitzen kein eigenes Maskenbild (FUN-213 bis FUN-216), sind
  aber als Handbuchthemen vorhanden. Status: ANNAHME; Konfidenz: hoch. OFFEN:
  reale Ausgabeform und Nutzung.
- Kasse/Personenkonto und Terminverwaltung werden nur zusammengefasst; die im
  Handbuch genannten separaten Beschreibungen fehlen (FUN-302/303). Status:
  OFFEN; Konfidenz: hoch. OFFEN: vollständige Abläufe und Unterlagen.

### Programmartefakt vorhanden, aber nicht fachlich dokumentiert

- DTAUS (FUN-501), ODBC/SQL-Export (FUN-502) sowie zahlreiche
  Konvertierungsmodule (TECH-026) besitzen keine eindeutige HTML-Ablaufhilfe.
  Status: ANNAHME; Konfidenz: mittel bis niedrig. OFFEN: Zweck und Nutzung.
- Die Laufzeit enthält Fileshare-, CCI-, Btrieve-, Java-, CGI-/ISAPI- und
  OLE-Fähigkeiten. Diese sind als mitlieferbare Technik, nicht als aktive
  Fachfunktionen zu bewerten (SRC-APP-0092; Status: ANNAHME; Konfidenz: hoch).

### Datenbestand ohne sichere Funktion

- `BUCHA`, `Buchalt`, `W005dm`, `W006dm`, `W040alt` und `oliW002` sind
  historische/alternative Varianten, deren Abgrenzung nicht dokumentiert ist
  (DAT-002/003/011/020/022/024; Status: ANNAHME; Konfidenz: mittel).
- `KASSENZ` und `form` sind sehr kleine DAT-Dateien; Zähler-, Steuer- oder
  Leerbestandssemantik ist nicht sicher feststellbar (DAT-005/006; Status:
  ANNAHME; Konfidenz: mittel).

### Vorlage ohne bekannten Auslöser

- Für EDWFRM11, 20, 27, 28, 83, 85, 86, 88, 89 und 90 sowie `PLAN.DOT`
  fehlt eine sichere Menüpunkt-/Dokumentzuordnung (TPL-011/020/027/028,
  TPL-083/085/086/088/089/090/205; Status: ANNAHME; Konfidenz: niedrig).
- Für Formular 30 liegen DOT, DOCX und SIC-Varianten vor; führende Version
  und Freigabestatus widersprechen sich nicht zwingend, sind aber offen
  (TPL-030/203/204; Status: OFFEN; Konfidenz: hoch).

### Bilder, fehlende Bilder und Wiederholungen

- Alle 41 EDK- und 82 EDW-GIF-Dateien werden von der jeweiligen HTML-Hilfe
  referenziert. Es gibt weder fehlende Referenzen noch nicht referenzierte
  GIFs (MAN-EDK/MAN-EDW; Status: ANNAHME; Konfidenz: hoch).
- Einige Dateien erscheinen mehrfach im HTML; Wiederholungen wurden demselben
  Thema bzw. mehreren passenden Themen zugeordnet. Kein Bild blieb ohne
  Kontextzuordnung. Status: ANNAHME; Konfidenz: hoch. OFFEN: ob einzelne
  Abbildungen aus einer abweichenden Produktversion stammen.

### Widersprüche und Versionsdrift

- Das Handbuch nennt `STAT.DAT`, der Bestand heißt `STATIST.DAT`
  (FUN-216/DAT-007). Status: WIDERSPRUCH; Konfidenz: hoch. OFFEN:
  Versionswechsel oder fehlende Datei.
- EDK- und EDW-Handbuch nennen bei einzelnen Nummernkreisen/Adressbereichen
  abweichende Angaben. Diese wurden nicht zu einer Regel normalisiert
  (MAN-EDK-010/016 gegen MAN-EDW-010/016; Status: WIDERSPRUCH; Konfidenz:
  mittel). OFFEN: versions-/modulspezifische Gültigkeit.
- Releases 3.20/3.30 beschreiben geändertes Verhalten bei FUG, Reports,
  Grabzustand, Word und Finanzschnittstellen. Die HTML-Hilfe lässt sich keiner
  exakten Binärversion zuordnen (REL-320/330; Status: OFFEN; Konfidenz: hoch).

### Möglicherweise historisch oder optional

- W080/Krematorium zuletzt 2007 ist ein Historienindiz; die heutige Nichtnutzung
  ist durch `INT-008` und die Migration des strukturierten Altbestands durch
  `INT-027` bestätigt (`REQ-MIG-003`). Satzlayout, Feldsemantik und Beziehungen
  bleiben offen; die Migrationsentscheidung bestätigt kein neues
  Krematoriumsmodul. DM-/Altbestände 2002–2004, DTAUS,
  ArcView und kundenspezifisch benannte Konvertierungen sind starke
  Historisch-/Optionalitätsindizien, aber kein Stilllegungsbeweis. Status:
  ANNAHME; Konfidenz: mittel. OFFEN: produktiver Umfang.
- Aktuelle Zeitstempel bei W020/W021/W022/DRAUF/W004 und Vorlagen 2025 sind
  bloße Nutzungsindizien. Kopie, Backup, Wartung oder automatischer Zugriff
  können dieselben Zeitstempel erzeugen.

### Vermutlich außerhalb EDWALT

- EDWALT besitzt laut `INT-017` keine Winyard-Schnittstelle. Vorgesehen sind
  das Speichern des Bescheids und der manuelle Upload nach Winyard. Ob dies
  tatsächlich vollständig geschieht oder lokale Datei-/Papierablagen bestehen,
  bleibt `OFFEN`. Erforderlich ist eine Prozessbeobachtung vom Druck bis zur
  Akte.
- `INT-020/021` bestätigen die heutige und gewünschte künftige Ablage nach
  Vorgangs-/Dokumentart und Jahr. Die zunächst angenommene Akte je Grabstätte
  wurde mit `INT-021` als Zielmodell verworfen. Die nur lokal betrachteten
  Screenshots `IMG-INT-001` und `IMG-INT-002` belegen den mehrstufigen
  Ablageplan zusätzlich.
  Wegen sichtbarer Personen- und Falldaten wurden die Bilder und ihre konkreten
  Dokumentbezeichnungen nicht ins Repository übernommen. Die konkrete Such-
  und Anlageregel für Akten- oder Ablageobjekte bleibt `OFFEN`; Konfidenz der
  Strukturbeobachtung: hoch.
- Die Winyard-Integration ist gemäß `INT-020` zunächst optional und soll erst
  später produktiv aktiviert werden. Daher gelten die bestätigten Muss- und
  Soll-Fähigkeiten `REQ-DMS-001` bis `REQ-DMS-006` nur bei aktivierter
  Integration; `REQ-DMS-010` verlangt einen unabhängigen Cemaris-Kernbetrieb.
- `INT-022` bestätigt, dass Cemaris bei aktivierter Integration eine fehlende
  Jahresablage unter der passenden Vorgangsart automatisch anlegen soll
  (`REQ-DMS-002`). Technische Objektart, Pflichtmetadaten und Konfliktverhalten
  bleiben `OFFEN`; Konfidenz der fachlichen Anforderung: hoch.
- `INT-023` bestätigt die automatische Ermittlung von Vorgangsart und Jahr aus
  dem Fall- und Dokumentkontext (`REQ-DMS-011`). Abhängig vom Vorgang ist das
  Jahr der Bescheiderstellung oder der Beisetzung maßgeblich. Die vollständige
  Regel je Dokumentart bleibt `OFFEN`; Konfidenz: hoch.
- `INT-024` grenzt den Migrationsumfang ab: Vorhandene Akten, Bescheide und
  Schreiben verbleiben an ihren heutigen Ablageorten und werden nicht nach
  Cemaris migriert (`REQ-MIG-001`, `BESTÄTIGT`, Konfidenz hoch). Der dauerhafte
  Zugriff nach EDWALT-Ablösung bleibt `OFFEN` und ist als MIG-R13 erfasst.
- `INT-025/026` bestätigen EDWALT als vorübergehende lesende Rückfallebene
  während der Cemaris-Einführung (`REQ-MIG-002`, Konfidenz hoch). Sie endet,
  sobald Cemaris zuverlässig funktioniert; ein langfristiger Archivbetrieb ist
  `VERWORFEN`. Technische Nur-Lese-Garantie und konkrete Abnahmekriterien sind
  `OFFEN`; mögliche Schreib- und Laufzeitabhängigkeiten sind als MIG-R14 erfasst.
- `INT-028` schließt stornierte, aufgehobene und durch Umnummerierung überholte
  Vorgänge von der Migration aus (`REQ-MIG-004`, `BESTÄTIGT`, Konfidenz hoch).
  Die technische Erkennung von Altstand und gültigem Nachfolger bleibt `OFFEN`;
  die EDWALT-Quelle wird durch den Ausschluss nicht verändert.
- `INT-029` bestätigt, dass ein gültiger Nachfolger nur mit seiner aktuellen
  Nummer migriert wird. Frühere Nummern werden nicht als Suchalias oder
  Historienkennung übernommen (`REQ-MIG-005`, Konfidenz hoch). Die technische
  Nachfolgerermittlung bleibt `OFFEN`.
- Das führende Finanzverfahren und die manuelle Einbuchung sind durch
  `INT-014` bestätigt. `INT-030` grenzt die Datenmigration ab: Bescheidnummer,
  Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug werden aus
  EDWALT übernommen; Zahlungsstatus und Mahnungen nicht (`REQ-MIG-006`,
  `BESTÄTIGT`, Konfidenz hoch). Technisch bestätigt sind `buch` 1/L16 als
  Quellnummer, 17/L24 als Fallbezugskandidat, 41/L8 als Bescheiddatum sowie die
  statische Trennung der Zahlungs-/Mahnfelder. Die Positionsblöcke in
  `W021/W040` sind im vorliegenden Bestand initialisiert; 124
  Gebührenreferenz- und 5.200 Rechenhypothesen liefern daher keinen
  Betragsbeleg. `buch` 118/126/134 bestehen ausschließlich aus Nullwerten und
  dürfen nicht als Fälligkeit geraten werden. Festgesetzter Betrag,
  Fälligkeit, genaue Positionsfelder und weitere manuelle Eingabefelder bleiben
  technisch beziehungsweise fachlich `OFFEN`.
- `INT-031` bis `INT-035` bestätigen den ersten nutzbaren Abschnitt: gemeinsame
  lesende Suche und verbundene Detailansicht für Friedhofs-, Grab-, Personen-,
  Fall-, Nutzungsrechts-, Bescheid- und Gebührendaten (`REQ-MVP-001` bis
  `REQ-MVP-004`). Zahlungsstatus und Mahnungen sind ausgeschlossen. Die
  Sachbearbeitung und der IT-Administrator dürfen die Fachinformationen sehen
  (`REQ-BER-001`). Die fachliche Abnahme erfolgt lokal an einem kontrolliert
  migrierten Testbestand; Git und allgemeine Entwicklungstests enthalten nur
  synthetische Daten (`BESTÄTIGT`, Konfidenz hoch).
  GIS/ArcView, Word/Office und gegebenenfalls Druck-/Treiber- sowie
  Netzlaufwerksverwaltung sind weitere mögliche externe Beteiligte. Endpunkte
  und Verantwortlichkeiten wurden nicht aus Dateinamen erfunden.
