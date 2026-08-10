# Dokumente, Reports, Vorlagen und Makros

Stand: 10. August 2026

## Untersuchungsmethode und Schutz

Die 73 OLE-Vorlagen, eine OOXML-Datei und eine temporäre Word-Datei wurden
nur statisch untersucht. Geprüft wurden Containerstruktur, Metadaten,
erkennbare Feld-/Textmarkennamen und VBA-Indikatoren. Keine Vorlage wurde in
Word geöffnet, kein Makro ausgeführt und kein Dokumentinhalt in das Repository
kopiert. Die zwei Release-DOC-Dateien sind in der Komponentenmatrix als
Releaseunterlagen erfasst und nicht als produktive Vorlage gezählt.

Vorlagen und Formularzuordnungen werden administrativ und nicht durch die
Sachbearbeiter verwaltet (`INT-013`, `BESTÄTIGT`, Konfidenz hoch). Offen bleibt,
wer die fachlichen und rechtlichen Inhalte freigibt; die technische Verwaltung
durch die IT belegt keine fachliche Dokumentenhoheit.

| Befund | Evidenz | Status | Konfidenz | Offene Frage |
|---|---|---|---|---|
| `EDW3DAT` enthält 75 als Vorlagen-/Word-Artefakte klassifizierte Dateien: 73 OLE, 1 OOXML und 1 temporäre Word-Sperrdatei. | SRC-DAT-0001/0002, SRC-DAT-0022 bis SRC-DAT-0094, SRC-DAT-0108, SRC-DAT-0150 | ANNAHME | hoch | Welche Version jeder Formularnummer ist fachlich und rechtlich gültig? |
| In den OLE-Streams wurden keine eingebetteten VBA-Projektmarker gefunden; dies beweist keine Makrofreiheit. | statische Stream-/Markerprüfung der 73 OLE-Vorlagen | ANNAHME | mittel | Ist Automatisierung vollständig in externen BAS-Modulen bzw. `Normal.dot` abgelegt? |
| Die OOXML-Datei enthält kein `vbaProject`, aber externe Hyperlink- und Vorlagenbeziehungen; Zielwerte wurden nicht dokumentiert. | SRC-DAT-0034 | ANNAHME | hoch | Sind die Beziehungen im aktuellen Betrieb erlaubt, erreichbar und vertrauenswürdig? |
| EDWALT steuert Word-Drucke durch externe BAS-Makros, EDW_SD-Steuerdateien und EDWFRM-Vorlagen. | SRC-APP-0323/0324, SRC-DAT-0012 bis SRC-DAT-0021, SRC-APP-0171 | ANNAHME | hoch | Welche Kombination aus Makro, Steuerdatei, Vorlage und Druckmodul ist produktiv? |

## Aktuelle bzw. im Stammverzeichnis liegende EDWFRM-Vorlagen

Die Zweckangaben sind aus Formularnummer, statisch erkennbaren Feldnamen,
Handbuch und Druckmodulen abgeleitete Hypothesen. `Makro: extern` bedeutet:
kein eingebetteter VBA-Marker gefunden, aber die BAS-Steuerung kann die Vorlage
automatisieren. Personenbezogene Beispielwerte wurden nicht erfasst.

| Vorlagen-ID | Datei; Typ; Änderung UTC | Vermuteter Zweck / Feldgruppen | Modul / Ausgabe | Makro; mögliche Personendaten; DMS | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|---|
| TPL-001 | `EDWFRM01.dot`; OLE-DOT; 2014-11-05 | kombinierter Erwerbs-/Beisetzungs-/Gebührenbezug; Adresse, Grab, verstorbene Person, Termine, Gebühren | FORM/DRUCK1; Word/Druck | extern; ja; kein DMS-Hinweis | SRC-DAT-0022; ANNAHME; mittel | Welcher Bescheid-/Urkundentyp wird mit Formular 01 erzeugt? |
| TPL-002 | `EDWFRM02.DOT`; OLE-DOT; 2014-11-05 | Erwerb/Verlängerung; Berechtigte, Grab, Nutzungszeitraum, Gebühren | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0023; ANNAHME; mittel | Für welche Grabarten und Vorgänge? |
| TPL-003 | `EDWFRM03.DOT`; OLE-DOT; 2025-02-28 | Beisetzungs-/Gebührenformular; Person, Termin, Grab, Positionen | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0024; ANNAHME; mittel | Ist die Änderung 2025 fachlich freigegeben und aktuell genutzt? |
| TPL-004 | `EDWFRM04.DOT`; OLE-DOT; 2014-11-05 | sonstiger Bescheid/Auftrag; Adressat, Betreff, Text-/Gebührenzeilen | FORM/DRUCKWW | extern; ja; kein DMS-Hinweis | SRC-DAT-0025, MAN-EDW-400; ANNAHME; hoch | Welche Auftrags- und Bescheidarten verwenden Formular 04? |
| TPL-005 | `EDWFRM05.DOT`; OLE-DOT; 2014-11-05 | umfangreiches kombiniertes Grab-/Vorgangsformular | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0026; ANNAHME; niedrig | Inhalt, Rechtswirkung und Auslöser? |
| TPL-006 | `EDWFRM06.DOT`; OLE-DOT; 2017-08-21 | Bescheinigung/Urkunde; Grab-, Personen- und Laufzeitfelder | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0027; ANNAHME; mittel | Handelt es sich um Grabbrief, Urkunde oder lokale Bescheinigung? |
| TPL-008 | `EDWFRM08.DOT`; OLE-DOT; 2010-08-18 | Zahlungs-/Überweisungsformular; Adressat, Referenz, Betrag | FORM/DRUCK1/BUCH | extern; ja, finanzbezogen; kein DMS-Hinweis | SRC-DAT-0028; ANNAHME; mittel | Wird das Dokument noch gedruckt oder durch das Finanzverfahren ersetzt? |
| TPL-011 | `EDWFRM11.DOT`; OLE-DOT; 2014-11-05 | lokale Formularvariante mit Grab-/Adress-/Vorgangsfeldern | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0029; ANNAHME; niedrig | Warum existiert Nummer 11, und welcher Menüpunkt löst sie aus? |
| TPL-020 | `EDWFRM20.DOT`; OLE-DOT; 2014-11-05 | allgemeines grab-/beisetzungsbezogenes Schreiben | FORM/DRUCK1 | extern; ja; kein DMS-Hinweis | SRC-DAT-0030; ANNAHME; niedrig | Empfänger, Zweck und Gültigkeit? |
| TPL-027 | `EDWFRM27.DOT`; OLE-DOT; 2010-08-18 | finanz-/vereinbarungsbezogenes Formular; Feldnamen deuten auf Adresse und Zahlung | FORM/BUCH/DRUCK | extern; ja; kein DMS-Hinweis | SRC-DAT-0031; ANNAHME; niedrig | Gehört das Formular zu Stundung, Lastschrift oder einem anderen Ablauf? |
| TPL-028 | `EDWFRM28.DOT`; OLE-DOT; 2010-08-18 | Umbettungs-/Übertragungsbezug plausibel; Person und Grab | FORM/DRUCK | extern; ja; kein DMS-Hinweis | SRC-DAT-0032; ANNAHME; niedrig | Welche Verfügung/Anordnung wird erzeugt? |
| TPL-030 | `EDWFRM30.DOT`; OLE-DOT; 2025-02-28 | FUG-/Bescheidbezug; Bescheidart/-nummer, Adresse, Friedhof/Grab, Zeilen und Gesamtbetrag | FORM/DRUCKFUG/BUCH | extern; ja, finanzbezogen; kein DMS-Hinweis | SRC-DAT-0033, MAN-EDW-401; ANNAHME; hoch | Ist diese DOT oder die DOCX-Variante führend? |
| TPL-031 | `EDWFRM31.DOT`; OLE-DOT; 2010-08-18 | FUG-/Mahn- oder Folgeschreiben | DRUCKFUG/DRUCKFUW | extern; ja, finanzbezogen; kein DMS-Hinweis | SRC-DAT-0036, SRC-APP-0403; ANNAHME; mittel | Erste Abrechnung, Erinnerung oder Mahnung? |
| TPL-080 | `EDWFRM80.DOT`; OLE-DOT; 2014-11-05 | Krematoriumsformular; Fall, verstorbene Person, Status/Datum | KREMA/P080/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0037, MAN-EDK-100/103; ANNAHME; mittel | Welches Versand-, Bescheid- oder Bescheinigungsdokument? |
| TPL-081 | `EDWFRM81.DOT`; OLE-DOT; 2014-11-05 | Krematoriumsformularvariante | KREMA/P081/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0038; ANNAHME; mittel | Auslöser und Empfänger? |
| TPL-082 | `EDWFRM82.DOT`; OLE-DOT; 2014-11-05 | Krematoriums-/Versandformularvariante | KREMA/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0039, MAN-EDK-101/103; ANNAHME; mittel | Welcher Versandstatus und welche Nachweise? |
| TPL-083 | `EDWFRM83.DOT`; OLE-DOT; 2010-08-18 | Krematoriumsformularvariante | KREMA/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0040; ANNAHME; niedrig | Zweck und aktuelle Nutzung? |
| TPL-085 | `EDWFRM85.DOT`; OLE-DOT; 2010-08-18 | Krematoriumsformularvariante | KREMA/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0041; ANNAHME; niedrig | Zweck und aktuelle Nutzung? |
| TPL-086 | `EDWFRM86.DOT`; OLE-DOT; 2010-08-18 | Krematoriumsformularvariante | KREMA/DRUCK80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0042; ANNAHME; niedrig | Zweck und aktuelle Nutzung? |
| TPL-088 | `EDWFRM88.DOT`; OLE-DOT; 2014-11-05 | Krematoriums-/allgemeines Schreiben | KREMA/DRUCKW80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0043; ANNAHME; niedrig | Welcher Brief-/Mitteilungstyp? |
| TPL-089 | `EDWFRM89.DOT`; OLE-DOT; 2014-11-05 | Krematoriums-/allgemeines Schreiben | KREMA/DRUCKW80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0044; ANNAHME; niedrig | Welcher Brief-/Mitteilungstyp? |
| TPL-090 | `EDWFRM90.DOT`; OLE-DOT; 2014-11-05 | Krematoriums-/allgemeines Schreiben | KREMA/DRUCKW80 | extern; ja, besonders sensibel; kein DMS-Hinweis | SRC-DAT-0045; ANNAHME; niedrig | Welcher Brief-/Mitteilungstyp? |
| TPL-090-SIK | `EDWFRM90.SIK.DOT`; OLE-DOT; 2010-08-18 | alternative/gesicherte Variante von Formular 90 | KREMA/DRUCKW80 | extern; ja; kein DMS-Hinweis | SRC-DAT-0046; ANNAHME; mittel | Bedeutung `SIK` und Verhältnis zu TPL-090? |

## Weitere und historische Vorlagen

| Vorlagen-ID | Bestand | Umfang und statischer Befund | Migrationsrelevanz | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|
| TPL-200 | `02\EDWFRM01.DOT`, `02\EDWFRM03.DOT` | 2 OLE-DOT-Varianten aus 2002/2003 | mögliche lokale oder historische Formularvariante | SRC-DAT-0001/0002; ANNAHME; mittel | Wofür steht Verzeichnis `02`? |
| TPL-201 | `gesicherte Vorlagen\20070508\` | 23 OLE-DOT-Dateien: Nummern 01, 02, 03, 04, 05, 06, 08, 11, 20, 27, 28, 30, 31, 80, 81, 82, 83, 85, 86, 88, 89, 90, 90.SIK | belegt Vorlagenhistorie, nicht automatisch Aufbewahrungspflicht | SRC-DAT-0049 bis SRC-DAT-0071; ANNAHME; hoch | Welche Änderungen sind fachlich/rechtlich relevant? |
| TPL-202 | `gesicherte Vorlagen\20100125\` | dieselben 23 Formularnummern als OLE-DOT | zweite historische Vergleichsstufe | SRC-DAT-0072 bis SRC-DAT-0094; ANNAHME; hoch | Welche Version war ab welchem Datum gültig? |
| TPL-203 | `EDWFRM30.DOT.sic` | OLE-Inhalt, Sicherungs-/Alternativdatei vom 2024-06-10 | mögliche kurzfristige Vorgängerversion von TPL-030 | SRC-DAT-0035; ANNAHME; mittel | Wurde sie automatisch oder manuell erzeugt? |
| TPL-204 | `EDWFRM30.DOT.docx` | OOXML, 25 Feldinstruktionen; u. a. Bescheid-, Adress-, Friedhofs-/Grab-, Zeilen- und Betragsgruppen; keine VBA-Datei; externe Beziehungen maskiert | moderne Zwischen-/Arbeitsvariante, Layout nicht gerendert | SRC-DAT-0034; ANNAHME; hoch | Ist dies eine freigegebene Vorlage, ein Test oder nur eine Konvertierung? |
| TPL-205 | `PLAN.DOT` | OLE-DOT mit `ObjectPool`; Inhalt und eingebettetes Objekt nicht aktiv geöffnet | möglicher Plan-/Lagebezug, proprietäres eingebettetes Objekt | SRC-DAT-0108; ANNAHME; niedrig | Welcher Prozess und welches Quellprogramm verwenden diese Vorlage? |
| TPL-206 | temporäre Word-Sperrdatei zu Formular 30 | 162 Byte; nicht als gültige Vorlage behandelt; mögliche Metadaten nicht dokumentiert | Nutzungsindiz aus 2021, kein Fachbeleg | SRC-DAT-0150; ANNAHME; mittel | Darf diese temporäre Altdatei nach gesonderter Freigabe bereinigt werden? |

## Makros und Steuerdateien

| Dokument-ID | Datei/Typ | Statischer Befund | Abhängigkeit / Risiko | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|
| DOC-001 | `Makros\EDWALT3.bas`; Word-Basic/VBA-Quelltext, 37.864 B | zentrale Word-Steuerung; liest Parameter, verwendet Serienbrief-/Druckfunktionen und referenziert `EDW_SD*.TXT` sowie `EDWFRM*.DOT` | Ausführung nie erfolgt; alte WordBasic-/MailMerge-API, Dateipfade und Dokumentdaten | SRC-APP-0324; ANNAHME; hoch | Wo ist das Modul installiert, signiert und freigegeben? |
| DOC-002 | `Makros\EDW_LST.bas`; Word-Basic/VBA-Quelltext, 15.986 B | Listendruck, Dateiprüfung und Word-Druck; referenziert `LISTE.LST` und ein Makro in der globalen Normal-Vorlage | externe Normal-Vorlage nicht im Bestand; Druckverhalten versionsabhängig | SRC-APP-0323; ANNAHME; hoch | Wo liegt die referenzierte Normal-Vorlage, und ist sie Bestandteil des Betriebs? |
| DOC-003 | `Makros\Sicherung\EDWALT3.bas`, `EDW_LST.bas` | ältere, nicht hashgleiche Sicherungsvarianten | Versionsdrift; kein automatischer Gleichheitsnachweis | SRC-APP-0325/0326; ANNAHME; hoch | Welche Änderung zwischen Sicherung und aktuellem Modul war beabsichtigt? |
| DOC-004 | `EDW_SD00/01/02/06/07/08/09/40/4A/4B.TXT` | Steuer-/Seriendruckdateien; Header deuten auf Adress-, Grab-, Personen-, Frist-, Bescheid- und Betragsfelder. Keine Werte übernommen. | können produktive Personendaten enthalten; mehrere Zeitstände | SRC-DAT-0012 bis SRC-DAT-0021; ANNAHME; hoch | Sind dies aktuelle Zwischenprodukte, Felddefinitionen oder letzte Druckdaten? |
| DOC-005 | `LISTE.LST`, `STATIST.TXT` | erzeugte Listen-/Statistikausgaben; `STATIST.TXT` besitzt einen neunteiligen fachlichen Header und 616 Zeilen, `LISTE.LST` 56 Zeilen. Inhalte nicht kopiert. | kann lokale Bezeichnungen und abgeleitete Betriebsdaten enthalten | SRC-DAT-0098, SRC-APP-0420; ANNAHME; hoch | Werden die Dateien regelmäßig überschrieben oder extern weiterverarbeitet? |
| DOC-006 | `Release3.20.doc/.pdf`, `Release3.30.doc/.pdf` | Releaseunterlagen; PDF mit 18 bzw. 1 Seite vollständig lokal gerendert, DOC nur passiv | proprietäre Texte nicht übernommen; für Versionsabgrenzung wichtig | SRC-APP-0402 bis SRC-APP-0405; ANNAHME; hoch | Welche Releaseänderungen wurden lokal konfiguriert oder nachträglich angepasst? |

## Im Handbuch beschriebene EDW-Ausgaben

| Report-ID | Ausgabe/Dokument | Auswahl und Ergebnis | Modul/Daten | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|
| REP-EDW-001 | Gräber-/FUG-Kurzliste | Bereich, Grabart, Sortierung, optional Notizen/Endstatistik | AUSWERT, W020/W022 | MAN-EDW-301, REL-320; ANNAHME; hoch | Nutzung, Empfänger, Datenschutz? |
| REP-EDW-002 | Grab-Vorgangsliste | Vorgänge prüfen oder laut Hilfe auch löschen | AUSWERT, W021 | MAN-EDW-302; ANNAHME; hoch | Ist die Ausgabe schreibend/löschend und noch erlaubt? |
| REP-EDW-003 | Grabstätten-Karteiblatt | Haupt-/Vorgangs-/Vorverstorbenen-/Notizdaten | AUSWERT, W020-W023 | MAN-EDW-303; ANNAHME; hoch | Amtliches Register, Arbeitskopie oder Auskunft? |
| REP-EDW-004 | belegt/unbelegt | Belegung, Ruhefrist, Statistik; Aktualisierungsoption | AUSWERT, W020/W021/STATIST | MAN-EDW-304; ANNAHME; hoch | Welche Daten werden durch die Auswertung verändert? |
| REP-EDW-005 | Nutzungsende-Liste/-Briefe | Zeitraum, Listen- oder Briefausgabe, Angebotsjahre | AUSWERT/Word, W020 | MAN-EDW-305; ANNAHME; hoch | Welche Frist-/Angebotsregel gilt? |
| REP-EDW-006 | Lage-Kurzliste | Lagebereich, Grabart, Vorverstorbene | AUSWERT, W020/W021 | MAN-EDW-306; ANNAHME; hoch | Zweck und Empfänger? |
| REP-EDW-007 | Grabzustands-Liste/-Briefe | Grabmal/Einfassung/Pflegezustand, Erledigung, Speicher-/Löschoptionen | AUSWERT/Word, W020 | MAN-EDW-307, REL-320/330; ANNAHME; hoch | Aktuelle Zustandswerte und Schreibwirkung? |
| REP-EDW-008 | Suchcode-Liste/-Briefe | drei Suchcodes oder Wort; Liste/Word | AUSWERT/Word, W020/W021 | MAN-EDW-308; ANNAHME; hoch | Definition der Suchcodes? |
| REP-EDW-009 | allgemeine Briefe | Grab-/Adressnummern und Briefnummer | AUSWERT/Word, Vorlagen | MAN-EDW-309; ANNAHME; hoch | Welche Briefnummern sind gültig? |
| REP-EDW-010 | Beerdigungsbuch | Zeitraum, Friedhof, Sarg/Urne, Sortierung, Endstatistik | AUSWERT, W021 | MAN-EDW-310; ANNAHME; hoch | Amtlicher Charakter und Aufbewahrung? |
| REP-EDW-011 | Beerdigungs-/Trauerfeier-Tagesliste | Friedhof und Datum; Tagesvarianten | AUSWERT/TE, W010/W021 | MAN-EDW-311; ANNAHME; hoch | Wird ein öffentlicher Aushang erzeugt? |
| REP-EDW-012 | Ruhefrist-Ende-Liste | Zeitraum, Grabart, Vorverstorbene | AUSWERT, W020/W021 | MAN-EDW-312; ANNAHME; hoch | Welcher Folgeprozess entsteht? |
| REP-EDW-013 | Grabarten-Stammdatenliste | Grabartenkatalog | STAMM/AUSWERT, W005 | MAN-EDW-313; ANNAHME; hoch | Wer benötigt die Ausgabe? |
| REP-EDW-014 | Gebühren-Stammdatenliste | Gebührenkatalog | STAMM/AUSWERT, W006 | MAN-EDW-314; ANNAHME; hoch | Stichtag und Satzungsstand? |
| REP-EDW-015 | Übersicht sonstiger Adressen | Adressstamm | STAMM/AUSWERT, W007 | MAN-EDW-315; ANNAHME; hoch | Rechtsgrundlage und Exportempfänger? |
| REP-EDW-016 | Statistik | Neuerwerb, Verlängerung und Beisetzungsgebühren; Datei-/Listenausgabe | AUSWERT, STATIST | MAN-EDW-316, DOC-005; ANNAHME; hoch | Kennzahlen, Stichtag und externe Weiterverarbeitung? |
| REP-EDW-017 | Bescheide/Auftragsdokumente | Bescheid/Gutschrift, Annahmeanordnung, Überweisung, Mitteilung | FORM/DRUCK/BUCH, W040 | MAN-EDW-400; ANNAHME; hoch | Welche Dokumentarten sind rechtsverbindlich und aktiv? |

## Im Krematoriumshandbuch beschriebene Ausgaben

| Report-ID | Ausgabe/Dokument | Ergebnis | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|
| REP-EDK-001 | Einäscherungsliste einschließlich genannter Amtsarztvariante | Fall-/Statusliste | MAN-EDK-300, KREMA/AUSWERTK; ANNAHME; mittel | Spalten, Empfänger und Rechtsgrundlage? |
| REP-EDK-002 | Katasterliste | nicht näher erläuterte Katasterauswertung | MAN-EDK-301; ANNAHME; niedrig | Was bezeichnet „Kataster“ in diesem Modul? |
| REP-EDK-003 | Krematoriumsstatistik | Fallzahlen nach Zeitraum und vier Handbuchgruppen | MAN-EDK-302; ANNAHME; hoch | Definition und heutige Notwendigkeit der Gruppen? |
| REP-EDK-004 | Rückmeldeliste | offene/erfolgte Rückmeldungen | MAN-EDK-303; ANNAHME; mittel | Welcher Nachweis- und Fristenprozess? |
| REP-EDK-005 | Bestatterliste | Auswertung nach Bestatter | MAN-EDK-304; ANNAHME; mittel | Zweck, Empfänger und Datenschutz? |
| REP-EDK-006 | Sammeldruck Versand/Gebühren | Versandpapiere oder Bescheide/Anordnungen/Überweisungen nach Auswahl | MAN-EDK-305, DRUCK80; ANNAHME; hoch | Ist die optionale Sammeldruckfunktion installiert und genutzt? |

## Ablage- und DMS-Befund

Die Quellen belegen Word-Automatisierung, Druck, listenförmige Zwischen- und
Steuerdateien sowie Finanzübergaben. Ein belastbarer technischer Hinweis auf
Winyard oder ein anderes DMS wurde in den untersuchten EDWALT-Artefakten nicht
gefunden. Der vorgesehene externe Ablauf erklärt diesen Befund: Der Bescheid
wird als Datei gespeichert und mangels EDWALT-Schnittstelle manuell in Winyard
hochgeladen (`INT-017`, Soll-Ablauf `BESTÄTIGT`, Konfidenz hoch). Ob dies in der
Praxis vollständig geschieht oder lokale Datei- beziehungsweise Papierablagen
bestehen, bleibt `OFFEN` und ist mit den Sachbearbeitern zu beobachten.

`INT-020/021` bestätigen die heutige und gewünschte künftige Ablage nach
Vorgangs-/Dokumentart und Jahr. Eine Akte je Grabstätte ist nach `INT-021` kein
Zielmodell. Zwei im Interview lokal betrachtete Screenshots (`IMG-INT-001`,
`IMG-INT-002`) zeigen den mehrstufigen Ablageplan zusätzlich (`BESTÄTIGT`,
Konfidenz hoch). Die Bilder sowie sichtbare Personen-, Fall- und
Dokumentbezeichnungen wurden aus Datenschutzgründen nicht gespeichert oder in
diese Dokumentation übernommen. Die Ablagestruktur soll in Cemaris
konfigurierbar sein (`REQ-DMS-009`). Cemaris muss zunächst ohne Winyard
produktiv nutzbar sein; die optionale Integration soll erst später aktiviert
werden (`REQ-DMS-010`).

Fehlt für ein Dokument die Jahresablage unter der passenden Vorgangsart, soll
Cemaris sie bei aktivierter Integration automatisch anlegen (`INT-022`,
`REQ-DMS-002`, `BESTÄTIGT`, Konfidenz hoch). Noch `OFFEN` sind die technische
Winyard-Objektart, deren Pflichtmetadaten und die vollständige Ausprägung der
Zuordnungsregel je Dokumentart. Die Zuordnung selbst soll ohne routinemäßige
Benutzerauswahl aus dem Fall- und Dokumentkontext erfolgen. Je nach Vorgang ist
das Jahr der Bescheiderstellung oder der Beisetzung maßgeblich (`INT-023`,
`REQ-DMS-011`, `BESTÄTIGT`, Konfidenz hoch).

Der vorhandene Altbestand an Akten, Bescheiden und Schreiben wird nicht nach
Cemaris migriert oder aus seinen heutigen Ablagen verschoben. Nur strukturierte
EDWALT-Daten sind Gegenstand der Migration (`INT-024`, `REQ-MIG-001`,
`BESTÄTIGT`, Konfidenz hoch). Das Inventar der Vorlagen und Dokumentfunktionen
dient damit der Nachvollziehbarkeit und späteren Bedarfserhebung, nicht als
Importauftrag. `OFFEN` bleibt die dauerhafte Verfügbarkeit der getrennten
Altbestände nach der EDWALT-Ablösung.
