# EDWALT-Quellenanalyse für die Datenmigration

Stand: 12. August 2026

## Zweck und Abgrenzung

Dieses Dokument bewertet die untersuchten EDWALT/EDWALT3-Quellen als
Migrationsquellen. Die Migration fachlich relevanter EDWALT-Daten und die
Entwicklung einer eigenständigen Open-Source-Lösung sind bestätigt
(`INT-003`, `INT-004`, Konfidenz hoch). Es definiert weder ein Cemaris-Zielschema noch
ein Feldmapping, eine Datenbereinigung oder eine produktive Migration.
Fachliche Regeln werden erst nach Bestands- und Bedarfsanalyse implementiert.

EDWALT wird im später abzulösenden Betrieb verwendet. Die hier untersuchten
Programm- und Datenverzeichnisse stammen ausdrücklich **nicht** aus der
produktiven Umgebung. Nach Projektangabe sind sie jedoch schema- und
versionsgleich mit dem späteren Migrationsbestand (`INT-036`, `BESTÄTIGT`,
Konfidenz hoch). Das macht sie für Format-, Parser- und Mappingentwicklung
geeignet, beweist aber weder die späteren produktiven Mengen noch deren
inhaltliche Qualität oder Stichtagskonsistenz. Die frühere Einordnung aus
`INT-005`, die bereitgestellten Verzeichnisse seien selbst der aktuelle
produktive Datenstand, ist damit für die Quellenherkunft überholt.

Der fachliche Migrationsumfang soll auch abgeschlossene und historische Fälle
umfassen (`INT-006`, `BESTÄTIGT`, Konfidenz hoch). Noch offen ist, welche
begleitenden Datenkategorien als Teil dieser Fälle zu migrieren, nur zu
archivieren oder als technische beziehungsweise regenerierbare Bestände nicht
zu übernehmen sind.

Die zeitliche Vollständigkeit der strukturierten Falldaten ist von der
Dokumentmigration zu unterscheiden: Vorhandene Akten, Bescheide und Schreiben
werden nicht nach Cemaris übernommen oder verschoben, sondern verbleiben in
ihren heutigen Ablagen (`INT-024`, `REQ-MIG-001`, `BESTÄTIGT`, Konfidenz hoch).
Der dauerhafte Zugriff auf diese Altbestände ist noch organisatorisch und
technisch abzusichern.

EDWALT soll während der Cemaris-Einführung vorübergehend als lesende
Rückfallebene verfügbar bleiben, bis Cemaris zuverlässig funktioniert
(`INT-025/026`, `REQ-MIG-002`, `BESTÄTIGT`, Konfidenz hoch). Ein langfristiger
Archivbetrieb ist `VERWORFEN`. Ob die Altanwendung ohne Schreibzugriffe auf
Daten, Indizes, Protokolle oder temporäre Dateien betrieben werden kann, wurde
nicht geprüft und darf ohne sicheren Test nicht angenommen werden. Konkrete
Cemaris-Abnahmekriterien für das Ende der Rückfallebene sind `OFFEN`.

Auswahlkriterium ist die Erforderlichkeit für den späteren Betrieb; eine
umfangreiche manuelle Nacherfassung soll vermieden werden. Notizen sollen nicht
migriert werden (`INT-007`, `BESTÄTIGT`, Konfidenz hoch). Weitere Ausschlüsse
werden nicht aus dem unscharfen Zusatz „usw.“ abgeleitet, sondern je
Datenkategorie nach Nutzung, Aufbewahrung und führendem System entschieden.

Für die Migrationspriorisierung sind regelmäßig genutzte Bereiche belegt:
Personen/Adressen, Beisetzungen, Nutzungsrechte/Verlängerungen,
Gebühren/Bescheide/Buchungen sowie Suche/Listen/Statistiken. Gräber und
Friedhofsstruktur, Termine/Wiedervorlagen sowie Dokumente/Word-Vorlagen werden
selten genutzt; das Krematorium gar nicht (`INT-008`, `BESTÄTIGT`, Konfidenz
hoch für die Bereichshäufigkeiten). Seltene Nutzung ist kein Ausschlussgrund.
Die strukturierten historischen Krematoriumsdaten sollen trotz heutiger
Nichtnutzung migriert werden (`INT-027`, `REQ-MIG-003`, `BESTÄTIGT`, Konfidenz
hoch). Das ist eine Migrationsentscheidung und noch keine Anforderung an ein
neues Cemaris-Krematoriumsmodul.

Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge sind vom
Migrationsumfang ausgeschlossen (`INT-028`, `REQ-MIG-004`, `BESTÄTIGT`,
Konfidenz hoch). Die EDWALT-Quelldaten bleiben unverändert. Vor Anwendung der
Ausschlussregel müssen Status, Altstand und gültiger Nachfolger technisch sicher
unterschieden werden.

Bei einem gültigen Nachfolger genügt die aktuelle Nummer. Frühere Nummern werden
nicht als Suchalias oder zusätzliche Historienkennung nach Cemaris übernommen
(`INT-029`, `REQ-MIG-005`, `BESTÄTIGT`, Konfidenz hoch). Die technische
Nachfolgerermittlung und ihr Abgleich bleiben `OFFEN`.

Für Gebühren- und Bescheiddaten ist die fachliche Migrationsgrenze bestätigt:
Bescheidnummer, Gebührenpositionen, festgesetzter Betrag, Fälligkeit und
Fallbezug werden aus EDWALT übernommen. Zahlungsstatus und Mahnungen werden
nicht aus EDWALT migriert, weil FINANZ+ dafür führend ist (`INT-030`,
`REQ-MIG-006`, `BESTÄTIGT`, Konfidenz hoch). Quellfelder und Schlüsselbeziehungen
bleiben technisch zu ermitteln.

Der konkrete End-to-End-Ablauf eines regulären Beisetzungsfalls konnte durch
die bisher antwortende Projektverantwortung nicht beschrieben werden
(`INT-009`: Wissensgrenze `BESTÄTIGT`, Prozess `OFFEN`). Für Feldsemantik,
Pflichtbeziehungen und Migrationsabnahme ist deshalb ein Anwenderinterview mit
datensparsamer Prozessbeobachtung erforderlich.

Friedhöfe/Felder, Grabarten, Gebührenarten/-sätze, allgemeine Adressen und
Auswahllisten sind durch Sachbearbeiter gepflegte fachliche Stammdaten
(`INT-013`, `BESTÄTIGT`, Konfidenz hoch). Sie sind daher als betriebsrelevante
Migrationskandidaten zu behandeln. Die IT betreut die Software, besitzt aber
nicht automatisch die fachliche Datenhoheit oder Kenntnis der lokalen Inhalte.

EDWALT wird nicht 1:1 nachgebaut (`INT-002`, `BESTÄTIGT`, Konfidenz hoch).
Quellmodule, Masken, Reports und Vorlagen werden deshalb nur zur Erklärung der
Daten, Historie und externen Abhängigkeiten verwendet. Der genaue
Migrationsumfang – migrieren, nur archivieren oder nicht übernehmen – bleibt je
Quellfamilie zu entscheiden.

Grundlage sind die vollständige
[Read-only-Bestandsaufnahme](../requirements/edwalt-analysis/README.md), das
[Datenbestandsinventar](../requirements/edwalt-analysis/data-storage-inventory.md),
der [Funktionskatalog](../requirements/edwalt-analysis/function-catalog.md) und
die [Evidenzmatrix](../requirements/edwalt-analysis/evidence-matrix.md).

## Quellenklassen und vorläufige Relevanz

| Quellenklasse | Umfang/Befund | Potenzielle Migrationsbedeutung | Evidenz | Status | Konfidenz | Offene Frage |
|---|---|---|---|---|---|---|
| Fachliche DAT/IDX-Paare | 24 vollständige Micro-Focus-Indexed-Paare, `IDXFORMAT(4)`, feste Sätze; 53.991 aktive Sätze | primäre strukturierte Altbestände und Neben-/Altvarianten; Satzlängen und Indexschlüssel technisch belegt, Feldsemantik offen | DAT-001 bis DAT-024, technisches Phase-2-Profil | Format `BESTÄTIGT`, Fachbedeutung `ANNAHME` | hoch | Welche Bestände und Felder sind führend, historisch, optional oder redundant? |
| Grab-/Vorgangsdaten | W020 bis W023 | Grabschlüssel und Vorgangsbeziehung, verstorbene Person sowie Trauerfeier-, Beisetz-, Geburts-, Ruhefrist- und Sterbeereignisse sind strukturell belegt; W020-Adress-/Rechterollen und W021-Nachlauf bleiben teilweise offen | DAT-015 bis DAT-018, MAN-EDW-100 ff., technisches Phase-3-Profil | Schlüssel/Ereignisrollen teilweise `BESTÄTIGT`, übrige Semantik `OFFEN` | hoch abgestuft | Exakte erste W020-Adressrolle, weitere Rollen und Nachlauf? |
| Finanz-/Gebührendaten | buch, KASSENZ, W006/W006dm, W040/W040alt | Bescheidnummer, Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug sind zu migrieren; W021 besitzt 40×127 Byte ab Byte 385, eine bestätigte Gebührennummer relativ 73/L4 und bei 5.556/L8 einen technisch bestätigten Fälligkeitsdatumskandidaten; Zahlungsstatus und Mahnungen verbleiben im führenden FINANZ+ | DAT-001/003/006/012/019/020/022, INT-014 bis INT-016/030, REQ-MIG-006, technische Phase-3-/Phase-4-Profile | Migrationsgrenze, W021-Gebührenreferenz und Datumstyp des Kandidaten `BESTÄTIGT`; fachliche Datumsrolle und übrige Unterfelder `OFFEN` | hoch abgestuft | Betrag, fachliche Bestätigung des Fälligkeitskandidaten und restliche Unterfelder? |
| Struktur-/Konfigurationsdaten | W001, W004, W005/W005dm, W007, W010, W002/oliW002, INI | Organisation, Bediener, Friedhof/Grabart, Adressen, Termine und Pfade; Fach- und Betriebskonfiguration vermischt | DAT-008 bis DAT-014, DAT-023/024, TECH-009/010 | ANNAHME | hoch | Welche Inhalte sind fachlich zu migrieren, welche neu zu konfigurieren oder zu verwerfen? |
| Krematorium | W080 und KREMA/P080/P081 | eigener sensibler Fall-/Statusbereich; im vorliegenden nichtproduktiven Bestand 0 aktive und 0 gelöschte Sätze, ein späterer strukturierter Bestand bleibt zu migrieren | DAT-021, FUN-400 ff., INT-008/027/036, REQ-MIG-003, technisches Phase-2-Profil | Leerstand technisch `BESTÄTIGT`, fachlicher späterer Inhalt `ANNAHME`, Migrationsumfang `BESTÄTIGT` | hoch | Feldsemantik und Beziehungen müssen anhand statischer Artefakte oder eines späteren Bestands geklärt werden. |
| Statistik/Druckaufträge | STATIST, DRAUF, STATIST.TXT, LISTE.LST | abgeleitete Daten, Zwischenprodukte oder Historie; nicht ungeprüft als Primärquelle behandeln | DAT-004/007, DOC-005 | ANNAHME | hoch | regenerierbar, revisionsrelevant oder nur technisch flüchtig? |
| Vorlagen/Makros/Steuerdateien | 75 Vorlagenartefakte, 4 BAS-Dateien, 10 EDW_SD-Dateien | kein automatisches Fachdatenschema; nur Evidenz für Dokumentinventar und Feldbezeichnungen, nicht Teil der bestätigten Datenmigration | TPL-001 ff., DOC-001 ff., INT-024 | Ausschluss aus Datenmigration `BESTÄTIGT`; technische Bedeutung `ANNAHME` | hoch | Welche neuen Cemaris-Vorlagen werden unabhängig vom Altbestand später fachlich benötigt? |
| Release/Hilfe/Komponenten | 2 HTML-Hilfen, 123 GIFs, Releases 3.20/3.30, Programm-/Runtime-Module | Evidenz für Semantik, Version und technische Extraktionsplanung; keine produktiven Cemaris-Komponenten | MAN-EDW/EDK, REL-320/330, TECH-* | ANNAHME | hoch | Welche dokumentierte Version entspricht Daten und Produktivprogramm? |

## Vorläufige Quellfamilien, keine Zielentitäten

Die folgenden Gruppen dienen nur zur Planung der weiteren Quellenanalyse. Sie
sind **keine** vorgeschlagenen Cemaris-Entities oder Tabellen.

| Quellfamilie | Lokale Bestände | Belegbare/angedeutete Inhalte | Status; Konfidenz | Klärungsbedarf vor Mapping |
|---|---|---|---|---|
| System/Organisation | W001, W004, EDWALT3.INI | Anwenderorganisation, Bediener, Nummern-/Betriebsparameter | ANNAHME; hoch | Datenschutz, aktive Konten, fachlich vs. technisch |
| Friedhofsstruktur | W005/W005dm | Friedhöfe, Grabarten, Kapazität, Frist-/Gebührenbezug | ANNAHME; hoch | Strukturhierarchie, Gültigkeit, historische Varianten |
| Grab/Nutzungsbezug | W020 | Grabidentifikation, Lage, Berechtigte, Nutzung | ANNAHME; hoch | dauerhafter Schlüssel, Adressrollen, Historie |
| Vorgang/Beisetzung/Verstorbene | W021, W023 | Vorgänge, Personen-, Sterbe-, Beisetzungs- und Zusatzdaten | ANNAHME; hoch | Satztypen, Kardinalitäten, Pflichtfelder, Schutzbedarf |
| Notiz/Freitext | W022 | grabbezogene Notizen; von der Migration ausgeschlossen (`INT-007`) | Klassifikation ANNAHME; Migrationsentscheidung BESTÄTIGT; hoch | Vor Ausschluss technisch bestätigen, dass der Bestand ausschließlich Notizen und keine betriebsnotwendigen Schlüsseldaten enthält. |
| Gebühr/Buchung | W006/W006dm, buch/BUCHA/Buchalt, KASSENZ | Gebührenstamm, EDWALT-Bescheide und interne Buchungs-/Personenkontoindizien; externes Finanzverfahren führt Forderungen/Zahlungen | Inhalt ANNAHME, externe Systemhoheit BESTÄTIGT; hoch | Währung, Satzungsstand, manuell übertragene Felder, Schlüssel und Abstimmung |
| Sonstige Bescheide/Aufträge | W040/W040alt | adress-/gebühren-/dokumentbezogene Sondervorgänge | ANNAHME; hoch | Auftragsarten, Altgrenze, Dokument-/Buchungsbezug |
| Termin | W010 | interne Termine | ANNAHME; hoch | Nutzung, externe Kalender, Verbindung zu Beisetzung |
| Krematorium | W080 | Einäscherung/Versand/Gebühr/Status; strukturierter Altbestand zu migrieren | Inhalt ANNAHME; Migrationsentscheidung BESTÄTIGT; hoch | eigene Schlüssel, Beziehungen, Feldsemantik und Datenschutz |
| Abgeleitete/technische Bestände | STATIST, DRAUF, form, W002 | Statistik, Druckauftrag, Formular-/Pfadsteuerung | ANNAHME; mittel | Primärquelle, Zwischenprodukt oder Konfiguration? |

## Wesentliche Migrationsrisiken

| Risiko-ID | Risiko | Auswirkung | Evidenz | Bewertung; Status; Konfidenz | Erforderliche Klärung/Maßnahme |
|---|---|---|---|---|---|
| MIG-R01 | Keine Copybooks und keine vollständige fachliche Satzbeschreibung; Hersteller nicht mehr verfügbar | technische Extraktion ist inzwischen belegt, aber Feldtypisierung und Semantik müssen aus mehreren lokalen Evidenzen rekonstruiert werden | alle DAT/IDX, TECH-004, INT-037, technisches Phase-2-Profil | sehr hoch; teilweise gelöst; hoch | Quellfeldkatalog aus Schlüsseloffsets, Profilen, Hilfe, Masken, Programmstrings und Vorlagen erstellen; Unsicherheiten explizit erhalten. |
| MIG-R02 | Live-/Fileshare-Konsistenz unbekannt | Datei-Kopie kann logisch inkonsistent sein, auch bei passenden Hashes | TECH-005/006, FUN-601 | sehr hoch; ANNAHME; hoch | konsistenten Stillstands-/Sicherungs-/Snapshotprozess mit Betreiber festlegen. |
| MIG-R03 | Alt-, DM- und alternative Varianten ohne fachliche Abgrenzung | Dubletten, Lücken oder falsche Historie; technische Schlüsselvergleiche beweisen sowohl Überlappungen als auch exklusive Sätze und geänderte Inhalte | DAT-002/003/011/020/022/024, INT-038, technisches Phase-2-Profil | hoch; ANNAHME; hoch | Zeitfelder, Satzinhalte und Programmzugriffe rekonstruieren; Varianten nicht pauschal vereinigen oder verwerfen. |
| MIG-R04 | Führende Schlüssel unbekannt; Umnummerierung/Löschung vorhanden; überholte Vorgänge und frühere Nummern sind gemäß INT-028/029 auszuschließen | Bei unsicherer Klassifikation kann statt des Altstands der gültige Nachfolger ausgeschlossen werden oder eine Beziehung verloren gehen | FUN-109/111, DAT-001/015–020, INT-028/029, REQ-MIG-004/005, statische Abläufe `NUMMER-AENDERN`, Phase-3-/Phase-4-Nachfolgerscans | sehr hoch; Ausschlussziel `BESTÄTIGT`, Erkennungsregel nach statischem und aggregiertem Negativbefund weiterhin `OFFEN`; hoch | Keine Filterung. `W020` 1685/L9 ist nur `LETZTER-VORGANG`-Kandidat; eindeutige Datenbeziehung sowie Selbst-/Kettenregel fehlen. Byte 1694/L1 ist im Bestand vollständig leer/nullwertartig. |
| MIG-R05 | EDWALT und FINANZ+ sind nur durch kontrollierte manuelle Einbuchung verbunden; Zahlungsstatus und Mahnungen verbleiben in FINANZ+ | Abweichungen, Dubletten oder fehlende Zuordnung bei Forderungen, Kassenzeichen, Stornos/Gutschriften; EDWALT ist keine vollständige Finanzhistorie | FUN-103/106/302/500, REL-320/330, INT-014 bis INT-016 | sehr hoch; `BESTÄTIGT`; hoch | weitere Übertragungsfelder, Korrekturweg, Schlüsselabgleich und Bedeutung der EDWALT-Buchungsbestände erheben; FINANZ+ als führend behandeln. |
| MIG-R06 | Fachregeln in Stamm/INI/Programm vermischt | unzulässige Übernahme veralteter Regeln | FUN-012/014/015/017 | hoch; ANNAHME; hoch | jede Regelquelle fachlich datieren und bestätigen; nicht aus Code/Datei allein übernehmen. |
| MIG-R07 | Freitexte, Bank-/Adress- und Krematoriumsdaten | Datenschutzverletzung und Datenübernahme ohne Zweck | DAT-013/017/018/021, DOC-004 | sehr hoch; ANNAHME; hoch | Zweck, Rechtsgrundlage, Berechtigung, Minimierung und Löschung vor Export entscheiden. |
| MIG-R08 | Dokument-/Vorlagenversionsdrift | alte Bescheide nicht reproduzierbar; falsche Rechts-/Textfassung | TPL-201–204, DOC-001–004 | hoch; ANNAHME; hoch | Gültigkeitszeiträume und Ablage vorhandener Dokumente klären. |
| MIG-R09 | Handbuch-/Release-/Datenversion nicht eindeutig gekoppelt | falsche Semantik oder Feldinterpretation | MAN-EDW/EDK, REL-320/330, TECH-001 | hoch; OFFEN; hoch | Produktivversion und lokale Anpassungen feststellen. |
| MIG-R10 | Textfelder sind sehr wahrscheinlich Windows-1252; genaue Datums-, Währungs-, Dezimal- und Rundungssemantik bleibt feldweise offen | Dekodierung vollständiger Binärsätze würde weiterhin Umlaut-, Datums- oder finanzielle Fehler erzeugen | technisches Phase-2-Profil, Windows-1252-Hilfen, DM-Bestände, Währungs-/USt-INI | hoch; Zeichensatzindiz stark, Feldtypen `OFFEN`; hoch | nur belegte Textfelder dekodieren; Datums-/Zahlenrepräsentation je Feld validieren. |
| MIG-R11 | Reports können schreibend/löschend sein | Bestand verändert sich während Analyse oder Export | FUN-202/204/207 | hoch; ANNAHME; hoch | nie für Extraktion starten; Schreibwirkung im Interview/Herstellerdokument klären. |
| MIG-R12 | Vorgesehener manueller Winyard-Upload ist nicht als tatsächliche vollständige Praxis bestätigt; lokale Dateien und Papierakten sind möglich. Bestätigt ist ein gegenwärtiger und künftig gewünschter Ablageplan nach Vorgangs-/Dokumentart und Jahr; eine Akte je Grabstätte ist kein Zielmodell. | Dokumenthistorie und Aktenbezug können über EDWALT-, Winyard-, lokale und Papierbestände verteilt sein. Cemaris soll eine fehlende Jahresablage automatisch anlegen; technische Objektart, Suchregel und Pflichtmetadaten sind noch offen. | FUN-504, INT-017/018/020/021/022, IMG-INT-001/002 | hoch; Ablageprinzip und automatische Jahresanlage `BESTÄTIGT`, Akte je Grabstätte `VERWORFEN`, Vollständigkeit der Ist-Praxis und technische Regel `OFFEN`; mittel | tatsächliche Ablage beobachten und heutige Ablageorte ausschließlich für die Altzugriffs- und Aufbewahrungsplanung erfassen, nicht als Dokumentmigrationsquellen. Die spätere optionale Schnittstelle getrennt von der EDWALT-Datenmigration spezifizieren. |
| MIG-R13 | Altakten, Altbescheide und Altschreiben werden bewusst nicht nach Cemaris migriert und verbleiben verteilt in ihren heutigen Ablagen. | Nach EDWALT-Ablösung können Altfallnachweise unauffindbar oder technisch unlesbar werden, wenn Zugriff, Zuständigkeit und Aufbewahrung nicht separat gesichert sind. | INT-017/024, REQ-MIG-001 | sehr hoch; Migrationsausschluss `BESTÄTIGT`, dauerhafter Altzugriff `OFFEN`; hoch | vor Cutover Ablageorte, Verantwortliche, Berechtigungen, lesbare Formate, Aufbewahrung und Auskunftsverfahren verbindlich dokumentieren und testen. |
| MIG-R14 | Die vorübergehende lesende EDWALT-Rückfallebene kann von veralteter Laufzeitumgebung oder internen Schreibzugriffen auf Daten, Indizes, Protokolle und temporäre Dateien abhängen. | Ein technisch erzwungener Schreibschutz kann die Anwendung unbenutzbar machen; Schreibfreigaben können dagegen den unveränderlichen Altbestand gefährden. | INT-025/026, REQ-MIG-002, TECH-004 bis TECH-006, TECH-027 | sehr hoch; Übergangsziel `BESTÄTIGT`, technische Machbarkeit `OFFEN`; hoch | Rückfallumgebung, unveränderliche Sicherungskopie, Schreibverhalten und Wiederherstellbarkeit vor Cutover planen und kontrolliert testen; nach stabiler Cemaris-Abnahme beenden. |

## Technisch belegtes Datenprofil

Der lokale Prototyp liest ausschließlich unkomprimierte Satzextrakte aus der
externen Arbeitskopie und gibt keine Quellwerte aus. Belegt sind:

- 24 feste Satzlayouts mit 53.991 aktiven Sätzen und 458.899.337 Byte
  unkomprimierter Nutzsatzdaten;
- 0 doppelte Primärschlüssel; je ein leerer Primärschlüssel in `W010` und
  `W020`;
- 4.119 physische Micro-Focus-Löschsätze, die nicht im aktiven Export liegen;
- technisch messbare Eltern-/Kindkandidaten, darunter `W020`↔`W021`,
  `W020`↔`W022`, `W021`↔`W023` und `W021`↔`DRAUF`;
- verwaiste Schlüssel in beiden Richtungen bei mehreren dieser Beziehungen;
- nichttriviale Überlappungen der aktuellen, Alt- und DM-Varianten;
- starke Windows-1252-Indizien in den wahrscheinlich textuellen Bereichen der
  Kernbestände sowie mehrere formatgültige Datumskandidaten;
- lückenlos abgegrenzte Satzbereiche der priorisierten Kernbestände,
  einschließlich 40 wiederkehrender 127-Byte-Positionen in `W021` ab Byte 385, 84
  wiederkehrender 115-Byte-Positionen in `W040` und 16 Zusatzfeldern à 30 Byte
  in `W023`;
- deklarative Finanzprofile für 52 Feldbereiche und 7 Wiederholungsstrukturen:
  W021-Positionen 1–8 sind belegt, 9–40 initialisiert; der W040-Block besitzt
  nur zwei einzelne nicht-nullwertige Bezeichnungsinstanzen ohne Finanzwerte;
- 26 W021-Gebührenreferenzhypothesen, davon sieben mit Treffern und relativ
  73/L4 mit 42/42 verschiedenen Referenzen bestätigt; die W040-Hypothesen
  bleiben ohne Treffer; außerdem 5.200
  Betrags-/Skalen-/Rechenhypothesen ohne ein einziges nicht-nullwertiges
  Menge-/Einzel-/Gesamtbetrag-Tripel; die Positionslayouts sind damit
  strukturell belegt, fachlich aber nicht am Bestand validierbar;
- eine stark bestätigte 236-Byte-Periodizität in `buch` 2.349–27.128, gefolgt
  von einem in allen 11.955 Sätzen vollständig SP-gefüllten 232-Byte-Rest;
- die Widerlegung der Datumshypothesen `buch` 118/126/134: alle drei Felder
  enthalten ausschließlich den Initialwert `00000000`, während 41/L8 in allen
  Sätzen ein gültiges `yyyyMMdd`-Datum ist;
- die technische Bestätigung, dass `W022` neben dem 26-Byte-Grabschlüssel nur
  den ausgeschlossenen 2.000-Byte-Notizinhalt und keine weiteren strukturierten
  Felder enthält;
- 66 deklarative, lückenlose Teilbereiche für `W020` 91–620 und `W021`
  29–1.400 sowie getrennte Datums-, Rollen-, Status- und Nachfolgerbefunde;
- `W021` 220/L8 als Trauerfeierdatum (`yyyyMMdd`), 232/L8 als Beisetzdatum
  (`yyyyMMdd`) sowie 241, 269, 277 und 285/L8 als Geburtsdatum, Ruhefrist
  von/bis und Sterbedatum (`ddMMyyyy`); die Datumsdeutung 29/37 ist widerlegt;
- statisch vorhandene Storno-, Erledigt- und Nummernänderungsabläufe, aber kein
  sicherer alter/neuer Schlüssel. Physische Löschsätze, Finanzstorno und
  `W040alt` sind als fachliche Nachfolgerregel widerlegt;
- zusätzlich 38 lückenlose W020-Bereiche für 621–1.684 und 22 lückenlose
  W021-Bereiche für 5.465–5.770. W020 Rolle 2 (630–868) und Rolle 3
  (1.445–1.683) besitzen eine wiederholte 239-Byte-Struktur; Namenssegmente,
  der Rolle-3-Index sowie PLZ-/Ortskandidaten sind technisch belegt, feinere
  Anrede-/Titel-/Post- und Empfängersemantik bleibt `OFFEN`;
- die lückenlose technische Gruppierung von W020 878–1.440 in Grabmal-,
  Einfassungs- und FUG-Familien. Die Familienfolge ist statisch und
  strukturell gestützt; nicht unabhängig belegte Einzelfeldgrenzen bleiben
  ausdrücklich untrennbare Restgruppen;
- W021 5.556/L8 und 5.576/L8 mit `ddMMyyyy`-Profilen sowie 5.706/L8 mit
  `yyyyMMdd`-Profil. Fälligkeit, Beerdigungsdatum und Überführungsdatum sind
  statisch passende Kandidaten, aber ohne fachliche Freigabe noch keine
  Importregel;
- die erneute Widerlegung einer sofort nutzbaren Nachfolgerregel: W020
  1.685/L9 hat keine eindeutige gehashte Schlüsselbeziehung, Selbst- oder
  Kettenregel. 1.694/L1 ist in 2.718/2.718 Sätzen leer/nullwertartig.

Das vollständige aggregierte Profil steht in
[Extraktionsprototyp und technisches Datenprofil](edwalt-extraction-prototype.md).
Die daraus rekonstruierte Feld- und Bereichssemantik steht im
[EDWALT-Quellfeldkatalog](edwalt-source-field-catalog.md). Fachliche
Status-/Codebedeutung, mehrere Einzelfeldgrenzen, Dezimaltypen und inhaltliche
Datenqualität bleiben weiterhin offen. Nullinitialisierte Felder werden dabei
nicht mehr als fachliche Null oder als vorhandene Position gewertet.

## Anforderungen an eine sichere spätere Quellenextraktion

Diese Punkte sind Schutzbedingungen, keine Entscheidung für ein Werkzeug:

1. fachlich und betrieblich freigegebener, konsistenter Quellstichtag;
2. unveränderliche Arbeitskopie außerhalb der Produktivverzeichnisse mit
   Hashnachweis;
3. ausschließlich der validierte Informationsmodus beziehungsweise der
   sequenzielle Export auf einer verifizierten Arbeitskopie; niemals
   Rebuild-/Reorg-/Validierungsfunktionen gegen Originalquellen;
4. isolierte lokale Umgebung ohne Upload zu externen Diensten;
5. Protokolle ohne Klartext-Personen-, Grab-, Akten-, Zahlungs- oder
   Freitextwerte;
6. Feld-/Satzlayout und Schlüssel zunächst technisch belegen, danach fachlich
   im Interview bestätigen;
7. separate Behandlung von Alt-/DM-/Archivvarianten und abgeleiteten
   Statistik-/Druckbeständen;
8. Abgleichsummen und Referenzprüfungen definieren, bevor ein Zielschema oder
   Mapping festgelegt wird;
9. Datenschutz-, Aufbewahrungs- und Löschentscheidung je Datenkategorie;
10. Dokument-/DMS-, Finanz-, GIS- und Terminquellen außerhalb EDWALT in den
    Scope aufnehmen, falls Interviews sie bestätigen.

Evidenz: MIG-R01 bis MIG-R14. Status und Konfidenz sind je Risiko in der Matrix
ausgewiesen. Offene Freigabe: Verantwortliche für
Betrieb, Fachbereich, Kasse, Datenschutz und Aufbewahrung benennen.

## Noch nicht ableitbar

Noch nicht belastbar ableitbar sind:

- ein endgültiges Cemaris-Datenmodell oder fachliche Entities;
- Feld-zu-Feld-Mappings oder transformierende Regeln;
- fachlich führende Schlüssel und Kardinalitäten jenseits der technisch
  belegten Bytebeziehungen;
- Muss-/Soll-/Kann-Prioritäten der Altverfahrensfunktionen;
- produktive DMS-, E-Mail-, GIS- oder ODBC-Endpunkte;
- Felder, Kontrollen und Korrekturweg der manuellen Einbuchung in das führende
  Finanzverfahren;
- Entscheidung über Übernahme, Archivierung oder Verwerfung historischer
  Daten und Vorlagen.

Status: `OFFEN`; Konfidenz hoch; Evidenz: Lücken in der Evidenzmatrix und
[Interviewleitfaden](../requirements/edwalt-analysis/open-questions-and-interview-guide.md).

## Vorbereiteter, derzeit pausierter Migrationsschritt

Der erste nutzbare Cemaris-Abschnitt ist durch `INT-031` bis `INT-035` fachlich
abgegrenzt: lesende gemeinsame Suche und verbundene Detailansicht. Seine
allgemeine Entwicklung kann ausschließlich mit synthetischen Daten erfolgen.
Ein echter EDWALT-Testbestand darf nur lokal und kontrolliert für die spätere
Migrations- und Fachabnahme eingesetzt werden (`REQ-MVP-001` bis
`REQ-MVP-004`).

Parallel bleiben für den echten Migrationstest insbesondere Q-MIG-01 bis
Q-MIG-04, Q-DS-01 und Q-AFB-01/02 mit Fachbereich, IT, Datenschutz und
Aufbewahrung zu klären. Die festen Satzlängen, Indexbeziehungen, lückenlosen
Layoutzonen und die priorisierten Gebühren-/Bescheidblöcke sind technisch
profiliert. Die frühere Aussage eines ausschließlich nullinitialisierten
W021-Positionsbestands ist korrigiert: Positionen 1–8 sind belegt, 9–40 nicht.
Festgesetzter Betrag bleibt bis zur feldgenauen Lokalisierung `OFFEN`.
W021 5.556/L8 ist technisch ein belastbarer Fälligkeitsdatumskandidat mit
11.607 gültigen, 2.603 leeren/nullwertartigen und einem ungültigen
`ddMMyyyy`-Wert; seine fachliche Rolle ist vor Import zu bestätigen. Zahlungs-
und Mahndaten bleiben unabhängig davon ausgeschlossen.

Die
[Analyse weiterer Adressrollen und des Vorgangsnachlaufs](edwalt-additional-addresses-next-step-handoff.md)
ist ausgeführt. `W020` 621–1.684, 1.685/L9 und 1.694/L1 sowie `W021`
5.465–5.770 sind ohne Layoutlücke geprüft. Ohne eindeutigen Nachfolgerbeleg
darf `INT-028/029` weiterhin keinen Satz ausschließen.

Der nächste lokale Migrationsanalyseschritt ist die
[Gebührenstamm- und Variantenabgrenzung](edwalt-fee-master-variants-next-step-handoff.md).
Sie soll `W005/W005dm` und `W006/W006dm` feldweise gegenüberstellen,
Gültigkeits-/Währungs-/Variantenregeln nur bei unabhängiger Evidenz zulassen und
noch kein Cemaris-Gebührenmapping erzeugen.

Nach der Projektentscheidung vom 12.08.2026 ist dieser Analyseschritt bis zur
konkreten Mapping-/Importphase pausiert. Die unabhängige
[Cemaris-Produktentwicklung](../implementation/README.md) wird mit
synthetischen, fachregelarmen Inkrementen fortgesetzt. Kontrollierte
Prozessbeobachtung mit tatsächlichen Sachbearbeitern bleibt vor produktiver
Freigabe und vor der Implementierung fachlicher Regeln erforderlich.
