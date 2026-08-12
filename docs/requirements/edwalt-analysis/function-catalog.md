# Konsolidierter EDWALT-Funktionskatalog

Stand: 10. August 2026

## Bewertungsregel

Der Katalog inventarisiert beobachtbare Altverfahrensfunktionen. Er ist weder
Sollkonzeption noch Cemaris-Backlog. `M/S/K offen` bedeutet, dass eine
Muss-/Soll-/Kann-Einstufung erst nach Interview, Prozessbeobachtung und
fachlicher Freigabe erfolgen darf. Ohne solche Freigabe ist keine
EDWALT-abgeleitete Anforderung `BESTÄTIGT`.

Bestätigt ist dagegen die strategische Abgrenzung: Cemaris wird als
eigenständige Open-Source-Lösung entwickelt und EDWALT nicht 1:1 nachgebaut
(`INT-002`, `INT-004`, Status `BESTÄTIGT`, Konfidenz hoch). Funktionen werden
hier weiterhin erfasst, soweit sie Datenbedeutung, Historie, Dokumente oder
Migrationsrisiken erklären können (`INT-003`).

Nutzergruppen sind aus Masken und Aufgaben abgeleitete Rollenbezeichnungen,
keine bestätigten Cemaris-Rollen. Für den EDWALT-Ist-Betrieb sind lediglich
gleichberechtigte Sachbearbeitung einschließlich Gebühren und eine
Administratorrolle bestätigt (`INT-011`); die genaue Rechteverteilung bleibt
offen. Die technische Administration liegt in der IT-Abteilung, während
Sachbearbeiter auch fachliche Stammdaten pflegen (`INT-012`). Welche der unter
FUN-014 bis FUN-017 dokumentierten Kataloge dies lokal betrifft, ist durch
`INT-013` konkretisiert: Friedhöfe/Felder, Grabarten, Gebührenarten/-sätze,
allgemeine Adressen und Auswahllisten. Vorlagen/Formularzuordnungen werden
administrativ verwaltet; die IT besitzt nicht die fachliche Kenntnis über die
lokalen Friedhofsinhalte. Als Nutzungsindiz gelten aktuelle Zeitstempel oder
Datenbestände; sie beweisen keine tatsächliche Nutzung.

## Bestätigte Nutzung auf Bereichsebene

`INT-008` bestätigt die Häufigkeit nur für die zusammengefassten Bereiche. Die
Zuordnung zu Funktions-IDs dient der Orientierung und bestätigt nicht, dass
jede aufgeführte Einzelfunktion genutzt oder künftig benötigt wird.

| Funktionsbereich | Heutige Häufigkeit | Zugeordnete Katalogbereiche | Status | Konfidenz | Folgefrage |
| --- | --- | --- | --- | --- | --- |
| Gräber und Friedhofsstruktur | selten | FUN-014, FUN-100, FUN-104, FUN-109 | `BESTÄTIGT` auf Bereichsebene | hoch | Welche seltenen Änderungen müssen trotzdem unterstützt und migriert werden? |
| Verstorbene und Adressen | regelmäßig | FUN-016, FUN-101/102, FUN-108, FUN-110, FUN-114 | `BESTÄTIGT` auf Bereichsebene | hoch | Rollen, führende Adresse und historische Wechsel klären. |
| Beisetzungen | regelmäßig | FUN-101, FUN-104, FUN-116 | `BESTÄTIGT` auf Bereichsebene | hoch | End-to-End-Ablauf und Fallarten beobachten. |
| Nutzungsrechte und Verlängerungen | regelmäßig | FUN-100/101, FUN-107, FUN-205, FUN-212 | `BESTÄTIGT` auf Bereichsebene | hoch | Beginn, Verlängerung, Übertragung und Ende fachlich erheben. |
| Gebühren, Bescheide und Buchungen | regelmäßig | FUN-015, FUN-103, FUN-105/106, FUN-115, FUN-300 bis FUN-302 | `BESTÄTIGT` auf Bereichsebene | hoch | Berechnungs-, Freigabe-, Buchungs- und Schnittstellenhoheit klären. |
| Termine und Wiedervorlagen | selten | FUN-211/212, FUN-303 | `BESTÄTIGT` auf Bereichsebene | hoch | Seltene Nutzung und mögliches führendes Fremdsystem unterscheiden. |
| Dokumente und Word-Vorlagen | selten | FUN-019, FUN-105/117, FUN-201 ff., FUN-504 | `BESTÄTIGT` auf Bereichsebene | hoch | Tatsächlich erzeugte Dokumentarten und Ablage klären. |
| Suche, Listen und Statistiken | regelmäßig | FUN-108, FUN-200 bis FUN-216 | `BESTÄTIGT` auf Bereichsebene | hoch | Konkretes Reportset, Empfänger und Filter erheben. |
| Krematorium | gar nicht | FUN-220 bis FUN-224, FUN-400 bis FUN-406 | heutige Nichtnutzung und Migration des strukturierten Altbestands `BESTÄTIGT` | hoch | Historische Daten gemäß INT-027 migrieren; daraus keine Cemaris-Funktionsanforderung ableiten. |
| Sonstige wichtige Arbeiten | derzeit nicht bekannt | noch nicht zuordenbar | `OFFEN` | niedrig | In Prozessbeobachtung auf Medienbrüche und ungenannte Tätigkeiten achten. |

## Anmeldung, Grundsystem und Stammdaten

| Funktions-ID | Bereich / Maske und Zweck | Auslöser; erkennbare Nutzergruppe | Eingaben → Ergebnisse/Dokumente | Daten, Module und Regelindizien | Ist-Nutzung, Problem und Migrationsrelevanz | Evidenz; Status; Konfidenz; Priorität | Offene Interviewfrage |
|---|---|---|---|---|---|---|---|
| FUN-001 | Anmeldung und Programmsperre | Programmstart/Sperrsymbol; alle Bediener | Anwender, Bediener, Benutzer, Kennwort → Zugang/Fehler | W001/W004; Bedienerzulassungen | Passwort-/Identitätsmodell unbekannt; W001/W004 mit 2026-Zeitstempeln nur Nutzungsindiz; sicherheitskritisch | MAN-EDW-001, MAN-EDK-001, DAT-008/009; ANNAHME; hoch; M/S/K offen | Welche Identitätsquelle, Vertretung, Sperrung und Protokollierung gelten heute? |
| FUN-002 | Grundmenü, Direktaufrufe und Lizenz-/Rechtefilter | nach Anmeldung; alle Bediener | Menü-/Symbolwahl → Fach-, Auswertungs-, Kassen-, Service- oder Hilfemodul | EDWALT3-Kern, Lizenz und Bedienerrechte | Sichtbare Menüs können je Installation abweichen; produktiver Menüumfang unbekannt | MAN-EDW-002, MAN-EDK-001, TECH-001; ANNAHME; hoch; M/S/K offen | Welche Menüpunkte sind sichtbar, lizenziert, genutzt oder stillgelegt? |
| FUN-010 | Anwender-/Mandantenstamm | Stammdatenmenü; Administration | Bezeichnung, Anschrift, Haushaltsjahr, Bank-/Nummernparameter → Systemstamm | W001; Kassenzeichen-/Modulo-Parameter | Vermischt Organisation, Betrieb und Finanzparameter; aktuelle Datei nur Indiz | MAN-EDW-010, MAN-EDK-010, DAT-008; ANNAHME; hoch; M/S/K offen | Welche Werte sind fachlich führend, historisch oder nur technische Altlast? |
| FUN-011 | Arbeitsplatz-/Pfadverwaltung | Stammdaten/Pfad suchen-ändern; Administration | Dateikürzel, Pfad, Hinweis → lokale Zuordnung | W002, Server-/Druck-/Programmpfade | Netzpfade sensibel; Arbeitsplatzvarianten und Abhängigkeiten migrationsrelevant | MAN-EDW-011, MAN-EDK-011, DAT-023/024; ANNAHME; hoch; M/S/K offen | Wie viele abweichende Arbeitsplatzkonfigurationen existieren? |
| FUN-012 | Parameter-/INI-Verwaltung | Stammdaten/Parameter; Administration | zahlreiche Programm-, Frist-, Druck-, FUG-, Krematoriums- und Schnittstellenschalter → Laufzeitverhalten | EDWALT3.INI | Werte absichtlich maskiert; aktive versus historische Schlüssel unbekannt | MAN-EDW-012, MAN-EDK-012, TECH-009; ANNAHME; hoch; M/S/K offen | Welche Parameter sind produktiv wirksam und fachlich genehmigt? |
| FUN-013 | Bediener, Rechte und Sonderprogramme | Stammdaten/Bediener; Administration | Nummer, Kontakt, Kennwort, Einzelrechte → Zulassung | W004; Rechte für Ändern, Löschen, Druck, Kasse, Storno, Formulare, System | Feingranulare Alt-Rechte belegen Bedarf nicht; Passwortschutz unbekannt | MAN-EDW-013, MAN-EDK-013, DAT-009; ANNAHME; hoch; M/S/K offen | Welche Funktionen erfordern Vier-Augen-Prinzip, Trennung oder Revision? |
| FUN-014 | Friedhöfe, Felder und Grabarten | Stammdaten; Fachadministration | Struktur, Bezeichnung, Kapazitäten, Flächen, Ruhe-/Nutzungszeiten, Gebühren-/Terminbezug → Kataloge | W005/W010; Vorbelegungen wirken in Vorgängen | zentrale Migrationsquelle; fachliche Regelgültigkeit unbestätigt | MAN-EDW-014, MAN-EDK-014, DAT-010/011/014; ANNAHME; hoch; M/S/K offen | Welche Strukturen und Fristen gelten je Satzungsstand heute? |
| FUN-015 | Gebührenstamm | Stammdaten; Fach-/Finanzadministration | Schlüssel, Text, Einheit, Betrag, Haushalts-/Kostenstelle, USt → auswählbare Position | W006/W006dm; Bescheid/Buchung | historische Währungsvariante; Gültigkeit und Preisfindung unbekannt | MAN-EDW-015, MAN-EDK-015, DAT-012/022; ANNAHME; hoch; M/S/K offen | Wie werden Satzungsstände, Gültigkeit und Finanzkontierung historisiert? |
| FUN-016 | Sonstige Adressen | Stammdaten/Adressauswahl; Sachbearbeitung | Anschrift, Kontakt, PK-/Bank-/Einzugsangaben → auswählbare Adresse | W007 | Organisationen und Personen möglicherweise gemischt; Dubletten-/Datenschutzrisiko | MAN-EDW-016, MAN-EDK-016, DAT-013; ANNAHME; hoch; M/S/K offen | Welche Adressarten, Nummernkreise und Rechtsgrundlagen gelten? |
| FUN-017 | Auswahl-/Wertelisten | Stammdaten; Administration | Vorgangs-/Terminarten, Anrede, Orte, Suchcodes, Zustände, Formulare → UI-Auswahllisten | AUSWAHL.INI; Defaults bei fehlender Datei | Fachkatalog und UI-Konfiguration vermischt; 2026-Nutzung nicht belegt | MAN-EDW-017, MAN-EDK-017, TECH-010; ANNAHME; hoch; M/S/K offen | Welche Werte sind verbindlich, lokal erweitert, historisch oder frei erfassbar? |
| FUN-018 | Editorformulare | Formularpflege; berechtigte Administration | Formularmetadaten, nummerierte Platzhalter, Steuerzeichen → Editor-/Druckformular | FORM, form.dat, Druckmodule | proprietäres Format; vorhandene konkrete Editorformulare nicht sicher inventarisierbar | MAN-EDW-018, MAN-EDK-018, TECH-013; ANNAHME; hoch; M/S/K offen | Werden Editorformulare noch genutzt, und wo liegen ihre Inhalte? |
| FUN-019 | Word-Formulare/Seriendruck | Formularpflege und Fachdruck; Sachbearbeitung/Administration | Vorlage und Steuerfelder → Word-Dokument/Druck | DOT/DOCX, BAS, EDW_SD, OLE/Word | alte Makro-/Office-Kopplung, unklare Vorlagenführung und Ablage | MAN-EDW-019, MAN-EDK-019, DOC-001 bis DOC-004; ANNAHME; hoch; M/S/K offen | Welche Vorlagen, Office-Version, Freigabe und Ablage sind aktuell? |

## Grab-, Personen-, Beisetzungs- und Gebührenbearbeitung

| Funktions-ID | Bereich / Maske und Zweck | Auslöser; Nutzergruppe | Eingaben → Ergebnisse/Dokumente | Daten, Abhängigkeiten und Regeln | Ist-Nutzung, Problem und Migration | Evidenz; Status; Konfidenz; Priorität | Offene Interviewfrage |
|---|---|---|---|---|---|---|---|
| FUN-100 | Grabstätte neu anlegen | Grabverwaltung/Neu; Sachbearbeitung | Friedhof/Grabnummer, Berechtigte, Suchcodes, Grabart, Maße, Kapazität, Nutzung → Grabstamm | W020, W005; W020 91–620 lückenlos technisch profiliert | Schlüssel-/Lagekonzept hoch migrationsrelevant; erste Adress-/Rechterolle noch nicht eindeutig | MAN-EDW-100, DAT-015, Phase-3-Profil; Struktur teilweise `BESTÄTIGT`, Semantik `OFFEN`; hoch; M/S/K offen | Wie wird die Grabnummer gebildet und welche Rolle hat die erste Adresse? |
| FUN-101 | Vorgang, verstorbene Person und Beisetzung | Grab/Vorgang; Sachbearbeitung | Vorgangsart, Nutzungszeit, Personen-/Sterbe-/Trauerfeier-/Beisetzungsdaten → Vorgang/Belegung | W021; Ereignisfelder 220, 232, 241, 269, 277 und 285 feldgenau belegt | besonders schützenswerte Ereignisdaten; Rollen/Datumsformate strukturell bestätigt | MAN-EDW-101, DAT-016, Phase-3-Profil; Ereignisse `BESTÄTIGT`, Fachregeln `OFFEN`; hoch; M/S/K offen | Welche Vorgangsarten, Pflichtnachweise, Fristregeln und Mehrfachbelegungen gelten? |
| FUN-102 | Sonstige Verstorbenendaten | Vorgang/Sonstiges; Sachbearbeitung | Konfession/Pfarrer, freie Hinweise, Melde-/Änderungsdaten → Zusatzdaten | W023; 16 freie Hinweise laut Hilfe | Zweckbindung und Datenminimierung unklar; hohe Datenschutzrelevanz | MAN-EDW-102, DAT-018; ANNAHME; hoch; M/S/K offen | Welche Felder werden befüllt, benötigt und wie lange aufbewahrt? |
| FUN-103 | Gebühren erfassen und Bescheiddaten bilden | Vorgang/Gebühren; Sachbearbeitung/Kasse | Erwerb/Verlängerung, Beisetzungs-/freie Gebühren, Menge, Betrag, Kontierung, Fälligkeit → Bescheid-/Buchungsgrundlage | W006, W021, buch; W021 40×127 ab Byte 385, Gebührennummer relativ 73/L4 bestätigt | Positionen 1–8 belegt, 9–40 initialisiert; Betrag/Fälligkeit offen | MAN-EDW-103, DAT-001/012/016, Phase-3-Profil; Block/Referenz `BESTÄTIGT`, Rest `OFFEN`; hoch; M/S/K offen | Was berechnet EDWALT, was das Finanzsystem, und wann gilt eine Sollstellung? |
| FUN-104 | vorhandene Grabstätte anzeigen/navigieren | Grabverwaltung; Sachbearbeitung | Navigation/Suche → Belegung, Vorgänge, Gebühren | W020/W021; Warnung bei Doppelbelegung | aktuelle Datenzeiten nur Indiz; Validierungsregel unbestätigt | MAN-EDW-104, MAN-EDW-200, DAT-015/016; ANNAHME; hoch; M/S/K offen | Welche Warnungen sind hart, welche nur Hinweise und wie werden Ausnahmen begründet? |
| FUN-105 | Drucken aus Grabvorgang | Druckfenster; Sachbearbeitung/Kasse | Drucker, Schacht, Formular, Ausgabeart → Bescheid, Grabbrief, Anordnung, Überweisung, Mitteilung, Buchung | FORM/DRUCK, DRAUF, Word/Editor, BUCH | Druck kann fachlichen/finanziellen Status ändern; hohe Ablage-/Revisionsrelevanz | MAN-EDW-105, DAT-004, TECH-016, DOC-001 bis DOC-004; ANNAHME; hoch; M/S/K offen | Welche Ausgabe bewirkt welche Buchung, Freigabe, Nummer und Ablage? |
| FUN-106 | Storno/Gutschrift | Druck-/Gebührenkontext; berechtigte Sachbearbeitung/Kasse | Auswahl/Bestätigung → Markierung/Entfernung oder Gegenbuchung mit neuer Nummer | BUCH, eigene Zulassung | finanzrechtliche Historie und Unveränderbarkeit kritisch | MAN-EDW-106, DAT-001, TECH-017; ANNAHME; hoch; M/S/K offen | Wie unterscheiden sich Storno, Korrektur und Gutschrift fachlich und in der Schnittstelle? |
| FUN-107 | eingeschränktes Nutzungsrecht | besonderer Vorgang; Sachbearbeitung | Laufzeitverkürzung/Position → Vorgang und ggf. Gutschrift | W020/W021/BUCH; länderspezifischer Hinweis | möglicherweise optional/historisch; Rechtskontext offen | MAN-EDW-107; ANNAHME; mittel; M/S/K offen | Wird diese Funktion verwendet und aufgrund welcher Satzung/Rechtslage? |
| FUN-108 | Grabsuche | Suche; Sachbearbeitung | Berechtigte, Grab, Verstorbene, Datum, Art, Codes, Bescheidnummer → Treffer/Übernahme | W020/W021; Suchzähler in INI | Datenschutzfilter/Berechtigung nicht beschrieben | MAN-EDW-201, DAT-015/016; ANNAHME; hoch; M/S/K offen | Welche Sucharten, Unschärfe, Berechtigungs- und Protokollregeln werden benötigt? |
| FUN-109 | Grabnummer/Friedhof/Feld ändern | Bearbeiten; berechtigte Sachbearbeitung | neue Identifikation + Bestätigung → Umnummerierung | statische `NUMMER-AENDERN`-Abläufe; W020/W021/W023/DRAUF abhängig | Ablauf belegt, persistierter Alt-/Neuschlüssel und Nachfolger nicht gefunden; keine Filterung zulässig | MAN-EDW-203, DAT-015/016, Phase-3-Negativbefund; Ablauf `BESTÄTIGT`, Datenregel `OFFEN`; hoch; M/S/K offen | Bleibt eine interne ID bestehen und wie werden alle Referenzen atomar fortgeschrieben? |
| FUN-110 | Adresse kopieren | Bearbeiten; Sachbearbeitung | Quell-/Zielrolle → zweite/dritte Adresse oder Notiz | W020/W022; Datenredundanz | kann Rollen/Historie verwischen | MAN-EDW-204, DAT-015/017; ANNAHME; hoch; M/S/K offen | Welche Adressrolle ist führend und darf kopiert statt referenziert werden? |
| FUN-111 | komplette Grabstätte löschen | Bearbeiten/Löschen; besonders berechtigte Bediener | Sicherheitsfrage → laut Hilfe Grab-, Vorgangs- und Verstorbenendaten gelöscht | W020-W023 | extrem hohes Verlust-/Aufbewahrungsrisiko; Nutzung unbekannt | MAN-EDW-205, DAT-015 bis DAT-018; ANNAHME; hoch; M/S/K offen | Ist physische Löschung erlaubt, protokolliert und je erfolgt? |
| FUN-112 | Grabzustand/Mitteilung/Erledigung | Bearbeiten/Zustand; Sachbearbeitung | Grabmal, Einfassung/Pflege, Zustand, Prüfung, Erledigung → Status/Brief | W020, Reports, Word; Sammellöschung in Release | Statussemantik und schreibende Auswertungen unklar | MAN-EDW-206/307, REL-320/330; ANNAHME; hoch; M/S/K offen | Welche Zustände, Fristen, Eskalationen und Löschregeln gelten? |
| FUN-113 | Grabnotiz | Bearbeiten/Notiz; Sachbearbeitung | Freitext → Notiz speichern/löschen | W022 | besonders hohes Datenschutz-/Datenqualitätsrisiko | MAN-EDW-207, DAT-017; ANNAHME; hoch; M/S/K offen | Zweck, zulässige Inhalte, Sichtbarkeit, Aufbewahrung und Migration? |
| FUN-114 | zweite/dritte Adresse und Personenkonto | Bearbeiten/Adresse/PK; Sachbearbeitung/Kasse | Zusatzempfänger, Kopie/Löschung, PK-Nummer → Dokument-/Buchungszuordnung | W020, buch, Schnittstellen | Rollen- und Dublettenrisiko; mehrere PK je Grab | MAN-EDW-208/209, DAT-001/015; ANNAHME; hoch; M/S/K offen | Welche Rollen haben Adressen und welches System führt Personenkonten? |
| FUN-115 | FUG am Grab | Bearbeiten/FUG; Sachbearbeitung/Kasse | Gebühr, Zeitraum, Kennzeichen, Zahler, Einzug → Bescheid-/Buchungsdaten | W020, W006, BUCH, INI | genaue Bedeutung/Berechnung und heutige Nutzung unbestätigt | MAN-EDW-210/401, REL-320, TPL-030/031; ANNAHME; hoch; M/S/K offen | Was bedeutet FUG lokal, wer ist zahlungspflichtig und wie wird berechnet? |
| FUN-116 | Überführung/Umbettungsnaher Vorgang | Bearbeiten/Überführung; Sachbearbeitung | Person, Ein-/Überführung, Gebühren → Vorgang/Druck | W021, Gebühr/Druck | Abgrenzung zur Umbettung und Pflichtnachweise offen | MAN-EDW-211, TPL-028; ANNAHME; hoch; M/S/K offen | Welche Varianten, Genehmigungen, Beteiligten und Dokumente existieren? |
| FUN-117 | Einzel-Kartei, -Mahnung, -Brief | Grabkontext; Sachbearbeitung/Kasse | aktuelles Grab/PK + Ausgabeart → Einzeldokument | Reports/Word/BUCH | Vorlagen-/Versand-/Ablagebezug unbekannt | MAN-EDW-213, DOC-001 bis DOC-004, TPL-001 ff.; ANNAHME; mittel; M/S/K offen | Welche Einzelausgaben werden genutzt und aus welchem Datenstand? |
| FUN-118 | kontextsensitive Hilfe | Hilfe-Menü/F1; alle Bediener | Kontext → lokale Hilfe | HLP/HTML/DLL | produktive Hilfefassung kann von analysierter HTML-Hilfe abweichen | MAN-EDW-214, TECH-031; ANNAHME; hoch; M/S/K offen | Welche Hilfeversion wird tatsächlich angezeigt? |

## Auswertungen, Listen und Briefe

Die 17 EDW- und 6 EDK-Ausgaben sind in
[`documents-reports-templates.md`](documents-reports-templates.md) mit
Dokumentzweck und Datenschutzfragen einzeln beschrieben. Hier werden sie als
Funktionen bewertet.

| Funktions-ID | Funktion / Ergebnis | Nutzer; Auslöser | Daten/Regel-/Risikohinweis | Nutzungsindiz / Migration | Evidenz; Status; Konfidenz; Priorität | Offene Frage |
|---|---|---|---|---|---|---|
| FUN-200 | Auswertungsmenü | Sachbearbeitung/Leitung; Menü Auswertungen | 16 Menüpunkte laut Hilfe | AUSWERT*-Module vorhanden; Nutzung offen | MAN-EDW-300, TECH-015; ANNAHME; hoch; M/S/K offen | Welche Reports werden wann, von wem und für wen erzeugt? |
| FUN-201 | Gräber-/FUG-Kurzliste | Sachbearbeitung; Auswahlbereich | optional Notizen/Statistik; Datenschutz | Release änderte Notizdruck; Bedarf offen | MAN-EDW-301, REP-EDW-001; ANNAHME; hoch; M/S/K offen | Welche Spalten/Varianten sind erforderlich? |
| FUN-202 | Grab-Vorgangsliste | Sachbearbeitung; Prüfung | Auswahl kann laut Hilfe löschen | schreibende Wirkung migrationskritisch | MAN-EDW-302, REP-EDW-002; ANNAHME; hoch; M/S/K offen | Was wird gelöscht und warum? |
| FUN-203 | Grabstätten-Karteiblatt | Sachbearbeitung/Archiv; Einzelauswahl | umfangreiche Personen-/Notizdaten | möglicher Nachweis/Arbeitsreport | MAN-EDW-303, REP-EDW-003; ANNAHME; hoch; M/S/K offen | Amtlicher Charakter und Aufbewahrung? |
| FUN-204 | belegt/unbelegt | Sachbearbeitung/Planung; Bereichsauswahl | Belegung/Ruhefrist; kann Zahlen aktualisieren | aktuelle Daten vorhanden, Ausführung unbestätigt | MAN-EDW-304, REP-EDW-004; ANNAHME; hoch; M/S/K offen | Welche Schreibwirkung und fachliche Definition von frei/belegt? |
| FUN-205 | Nutzungsende-Liste/-Briefe | Sachbearbeitung; Zeitraum | Frist-/Angebotslogik und Word | hoher Prozess-/Fristbezug | MAN-EDW-305, REP-EDW-005; ANNAHME; hoch; M/S/K offen | Was folgt fachlich nach Auswahl/Versand? |
| FUN-206 | Lage-Kurzliste | Sachbearbeitung/Planung | Lage, Grabart, Vorverstorbene | Bedarf/Empfänger offen | MAN-EDW-306, REP-EDW-006; ANNAHME; hoch; M/S/K offen | Welcher operative Zweck? |
| FUN-207 | Grabzustands-Liste/-Briefe | Sachbearbeitung/Außendienst; Zustand | Speicher-/Löschoptionen, Word | Releaseänderungen, Nutzung offen | MAN-EDW-307, REP-EDW-007; ANNAHME; hoch; M/S/K offen | Wie werden Prüfung, Frist, Erledigung und Brief gekoppelt? |
| FUN-208 | Suchcode-Liste/-Briefe | Sachbearbeitung; Codes/Wort | frei konfigurierte Codes; Word | Semantik nicht dokumentiert | MAN-EDW-308, REP-EDW-008; ANNAHME; hoch; M/S/K offen | Welche Suchcodes bilden welchen Prozess ab? |
| FUN-209 | allgemeine Briefe | Sachbearbeitung; Adress-/Briefnummer | Word-Vorlage, Rechtsgrundlage unklar | Vorlagen vorhanden, Auslösung offen | MAN-EDW-309, REP-EDW-009; ANNAHME; hoch; M/S/K offen | Welche Briefarten sind freigegeben? |
| FUN-210 | Beerdigungsbuch | Sachbearbeitung/Leitung; Zeitraum | personenbezogenes Register/Statistik | hoher Aufbewahrungsbezug | MAN-EDW-310, REP-EDW-010; ANNAHME; hoch; M/S/K offen | Amtliches Register oder Arbeitsliste? |
| FUN-211 | Beerdigungs-/Trauerfeier-Tagesliste | Sachbearbeitung/Publikumsbetrieb; Datum | Termine/Personen, möglicher Aushang | Datenschutz bei Veröffentlichung kritisch | MAN-EDW-311, REP-EDW-011; ANNAHME; hoch; M/S/K offen | Welche Daten erscheinen wo und mit welcher Einwilligung/Rechtsgrundlage? |
| FUN-212 | Ruhefrist-Ende-Liste | Sachbearbeitung; Zeitraum | Fristdaten, Folgeprozess offen | migrationsrelevant für offene Fälle | MAN-EDW-312, REP-EDW-012; ANNAHME; hoch; M/S/K offen | Welche Aktion/Wiedervorlage entsteht? |
| FUN-213 | Grabarten-Stammliste | Administration; Bericht | W005 | aktueller Katalog als Datenquelle, Reportbedarf offen | MAN-EDW-313, REP-EDW-013; ANNAHME; hoch; M/S/K offen | Wird sie operativ oder zur Prüfung genutzt? |
| FUN-214 | Gebühren-Stammliste | Administration/Finanzen | W006, Satzungsstand | Historie/Abstimmung relevant | MAN-EDW-314, REP-EDW-014; ANNAHME; hoch; M/S/K offen | Welcher Stichtag und Empfänger? |
| FUN-215 | Adressübersicht | Administration | W007, personenbezogen möglich | Export-/Datenschutzrisiko | MAN-EDW-315, REP-EDW-015; ANNAHME; hoch; M/S/K offen | Bedarf und Berechtigung? |
| FUN-216 | Statistik | Leitung/Finanzen; Zeitraum | Neuerwerb, Verlängerung, Beisetzungsgebühren; STAT/STATIST-Widerspruch | STATIST-Bestand 2026 nur Indiz | MAN-EDW-316, REP-EDW-016, DAT-007; WIDERSPRUCH; hoch; M/S/K offen | Kennzahlen, Quelldaten, Stichtag und Dateiname? |
| FUN-220 | Krematoriums-Einäscherungs-/Katasterlisten | Krematorium/Leitung | Fall-/Status- und unklare Katasterdaten | optionales Modul, Bedarf offen | MAN-EDK-300/301, REP-EDK-001/002; ANNAHME; mittel; M/S/K offen | Zweck, Empfänger und Amtsarztvariante? |
| FUN-221 | Krematoriumsstatistik | Krematorium/Leitung; Zeitraum | vier Handbuchgruppen; Definition offen | W080 alt, Nutzung unbestätigt | MAN-EDK-302, REP-EDK-003; ANNAHME; hoch; M/S/K offen | Wie sind Gruppen und Kennzahlen definiert? |
| FUN-222 | Rückmeldeliste | Krematorium; offene/erfolgte Meldung | Versand-/Beisetzungsrückmeldung | Fristen/Nachweis relevant | MAN-EDK-303, REP-EDK-004; ANNAHME; mittel; M/S/K offen | Wer meldet was bis wann zurück? |
| FUN-223 | Bestatterliste | Krematorium/Leitung | Auswertung nach Bestatter | Datenschutz/Zweck offen | MAN-EDK-304, REP-EDK-005; ANNAHME; mittel; M/S/K offen | Wofür wird die Liste verwendet? |
| FUN-224 | Sammeldruck Versand/Gebühren | Krematorium/Kasse; Auswahl | Versandpapiere/Bescheide/Finanzdokumente | optionale Installation; Druck-/Buchungswirkung | MAN-EDK-305, REP-EDK-006; ANNAHME; hoch; M/S/K offen | Installiert, genutzt, freigegeben und archiviert? |

## Sonderprogramme, Kasse und Terminverwaltung

| Funktions-ID | Funktion | Eingaben → Ergebnis | Daten/Module | Nutzung, Problem, Migration | Evidenz; Status; Konfidenz; Priorität | Offene Frage |
|---|---|---|---|---|---|---|
| FUN-300 | sonstige Bescheide/Aufträge | Adresse, Auftragsart, Betreff, Text-/Gebührenzeilen → Bescheid/Gutschrift/Anordnung/Überweisung/Mitteilung | W040/W040alt, FORM/DRUCK/BUCH | W040 Zeit 2025 nur Indiz; Auftragsarten, Vorlagen und Rechtswirkung offen | MAN-EDW-400, DAT-019/020, REP-EDW-017; ANNAHME; hoch; M/S/K offen | Welche Auftragsarten werden heute von welcher Stelle genutzt? |
| FUN-301 | FUG-Einzel-/Sammelabrechnung | Zeitraum, Kennzeichen, Zahler, Einzug → Einzel-/Sammelbescheid und Buchung | W020, W006, BUCH, INI, Vorlagen 30/31 | komplexe Gebühren-/Zahlungslogik; Bedarf unbestätigt | MAN-EDW-401, REL-320, TECH-024; ANNAHME; hoch; M/S/K offen | Regel, Ausnahmen, Lastschriftformat und tatsächliche Nutzung? |
| FUN-302 | Personenkonto/Kasse | Zahlungen, Sollausnahmen, Mahnung, OP/Ist → Konto-/Schnittstellenergebnis | buch, BUCHSCH*, KASSENZ, Finanzschnittstelle | FINANZ+ führt Forderungen, Zahlungen, Zahlungsstatus und Mahnungen; EDWALT-Bescheid wird manuell übertragen, Zahlungseingang nicht an Friedhofsverwaltung rückgemeldet | MAN-EDW-402, DAT-001/006, TECH-017/018, INT-014 bis INT-016; Systemhoheit `BESTÄTIGT`; hoch; M/S/K offen | Welche Bedeutung haben die EDWALT-Buchungsbestände noch für Bescheidhistorie und Migration? |
| FUN-303 | Terminverwaltung | Friedhof, Datum, Bestatter/Person, Bestattungsdetails → Tag/Woche, Übernahme, Tagesliste/Aushang | W010, TE/TEKOELN, INI/AUSWAHL | W010 Zeit 2023 nur Indiz; separate Hilfe fehlt, lokale Variante möglich | MAN-EDW-403, DAT-014, TECH-023; ANNAHME; hoch; M/S/K offen | Wird intern geplant oder in Kalender/anderem System? |

## Krematorium

Die Funktionen dieses Bereichs werden heute nicht genutzt (`INT-008`). Der
strukturierte historische Bestand ist dennoch zu migrieren (`INT-027`,
`REQ-MIG-003`). Diese Migrationsentscheidung bestätigt keine der nachfolgend
inventarisierten Funktionen als Bedarf für Cemaris.

| Funktions-ID | Maske/Funktion | Eingaben → Ergebnis/Dokument | Daten/Regeln | Nutzung, Risiko, Migration | Evidenz; Status; Konfidenz; Priorität | Offene Frage |
|---|---|---|---|---|---|---|
| FUN-400 | Krematorium-Grundfall | Einlieferung, Genehmigung, Einäscherung, Person, Antragsteller/Zahler, Bestatter, Friedhof/Grab, Codes → Fall/Status | W080, KREMA/P080/P081 | heute nicht genutzt; strukturierter historischer Bestand zu migrieren; kein bestätigter Cemaris-Funktionsbedarf | MAN-EDK-100, DAT-021, TECH-022, INT-008/027; Funktionssemantik `ANNAHME`, Nichtnutzung/Migration `BESTÄTIGT`; hoch; M/S/K für Funktion offen | Welche Felder, Schlüssel, Beziehungen und Pflichtnachweise enthält der historische Bestand? |
| FUN-401 | Urnenversand/Rückmeldung | Adresse, Versandart/-hinweis, Zustimmung, Erinnerung, Rückmeldung/Beisetzung → Versandstatus/Dokument | W080, Adressen, Vorlagen 80 ff. | Nachweis-/Fristen- und Datenschutzrelevanz | MAN-EDK-101, TPL-080 bis TPL-090; ANNAHME; hoch; M/S/K offen | Zuständigkeit, Versandnachweis, Seebestattung und Abschluss? |
| FUN-402 | Krematoriumsgebühren/Bescheid | Position, Kassenzeichen, Datum, Empfänger → Betrag/Bescheid/Soll | W006, W080, BUCH | Finanzschnittstelle und KREM-Katalog offen | MAN-EDK-102, TECH-017/022; ANNAHME; hoch; M/S/K offen | Welche Gebühren und Kontierung gelten? |
| FUN-403 | Krematoriumsdruck | Ausgabeart → Bescheid, Grabbrief, Anordnung, Überweisung, Mitteilung, Versand-/allgemeines Formular | DRUCK80/DRUCKW80, Vorlagen | alte Word-Kopplung und Ablage offen | MAN-EDK-103, TECH-016/022, TPL-080 ff.; ANNAHME; hoch; M/S/K offen | Welche Vorlage wird je Status/Ereignis erzeugt und abgelegt? |
| FUN-404 | Krematorium Storno/Gutschrift | Auswahl → Storno oder Gegenbuchung | BUCH, Bedienerrechte | finanzrechtliche Historie kritisch | MAN-EDK-104, TECH-017; ANNAHME; hoch; M/S/K offen | Gelten dieselben Regeln wie in der Grabverwaltung? |
| FUN-405 | Krematorium Suche/Bearbeiten/Löschen | Nummer, Name, Antragsteller, Daten, Codes, Bescheid, Bestatter → Treffer/Änderung/Löschung/Zusatzadresse | W080, Adressen | Suchrechte und physische Löschung besonders sensibel | MAN-EDK-200/201, DAT-021; ANNAHME; hoch; M/S/K offen | Welche Such-/Löschrechte und Aufbewahrung gelten? |
| FUN-406 | Krematorium Personenkonto, Notiz/Zeremonie, Status | Adresse/Freitext/Statusdatum → PK-/Prozessstatus | W080, BUCH | freie Texte und Statussemantik unbekannt | MAN-EDK-202; ANNAHME; hoch; M/S/K offen | Welche Status sind fachlich verbindlich und welche Freitexte zulässig? |

## Schnittstellen, Export und Wartung

| Funktions-ID | Funktion / Artefaktstatus | Ein-/Ausgabe und Abhängigkeit | Nutzung, Problem, Migration | Evidenz; Status; Konfidenz; Priorität | Offene Frage |
|---|---|---|---|---|---|
| FUN-500 | Finanz-/Kassendatenübergabe | Buchungen/Personenkonto → DATEV, UVN-FIN, Standard oder INFOMA (kameral/Doppik), laut Releases/INI | Komponenten vorhanden, aber aktuell keine Finanzdatenübergabe; Kernfelder des EDWALT-Bescheids werden manuell in FINANZ+ erfasst, kontrolliert und gebucht | TECH-017/020, REL-320/330, INT-014/015; heutige Nichtnutzung `BESTÄTIGT`; hoch; M/S/K offen | Vollständige Feldliste, Fehlerkorrektur und möglicher künftiger Datenfluss? |
| FUN-501 | DTAUS | mutmaßliche Zahlungsdatei → Datei | nur Module belegt, kein Ablauf/Endpunkt | TECH-019; ANNAHME; mittel; M/S/K offen | Historisch, optional oder produktiv; welches Nachfolgeformat? |
| FUN-502 | ODBC/SQL-Export | EDWALT-Daten → ODBC/SQL-Ziel | Runtime/Modul vorhanden; DSN, Payload und Richtung unbekannt | TECH-007/021; ANNAHME; mittel; M/S/K offen | Welche Daten, welches Ziel und welche Zugriffsrichtung? |
| FUN-503 | ArcView/GIS-Übergabe | nicht sicher ermittelte Lage-/Grabdaten → ArcView | nur Releasehinweis, keine aktuelle Konfiguration belegt | SRC-APP-0403; ANNAHME; mittel; M/S/K offen | Wurde die Schnittstelle genutzt und existieren externe GIS-Bestände? |
| FUN-504 | Word-/Datei-Druckschnittstelle | Steuerfelder + Vorlage → Dokument/Druck/Buchungsfolge | BAS/DOT/OLE, lokale/Netzpfade; keine EDWALT-DMS-Schnittstelle; vorgesehen sind Speichern und manueller Winyard-Upload, tatsächliche Praxis offen | FUN-019/105/403, DOC-001 ff., INT-017; Soll-Ablauf `BESTÄTIGT`, Ist `OFFEN`; hoch; M/S/K offen | Verbindlichkeit, Dateiformat, Metadaten, Vollständigkeit und Nebenablagen? |
| FUN-600 | Rebuild/Reorganisation | DAT/IDX → potenziell reparierte/reorganisierte Dateien | Wartungsartefakt vorhanden, nie ausgeführt; kein Cemaris-Fachbedarf | TECH-027; ANNAHME; hoch; M/S/K offen | Wer führt Wartung wann und auf welcher Sicherung autorisiert aus? |
| FUN-601 | Sicherung/Termin-Backup/Fileshare-Betrieb | Dateien/Netzpfade → Sicherungs- oder Mehrbenutzerbetrieb | INI-/Runtimehinweise; tatsächlicher Job und Konsistenzverfahren unbekannt | TECH-005/006/009; ANNAHME; mittel; M/S/K offen | Wie entstehen konsistente, getestete Sicherungen und Restore-Nachweise? |

## Nicht als Funktion bestätigt

- Die Existenz von Java-, CGI-/ISAPI-, Btrieve-, APPC-, IPX- oder
  NetBIOS-Komponenten in `DEPLOY.TXT` beweist keine EDWALT-Fachfunktion oder
  aktive Betriebsabhängigkeit (SRC-APP-0092; Status: ANNAHME; Konfidenz:
  hoch; OFFEN: tatsächlich installierter Umfang).
- Modulnamen wie `KONHADES`, `KONHFREI`, `KONLOH` oder `KONRAT` reichen nicht
  für eine fachliche Zuordnung (TECH-026; Status: ANNAHME; Konfidenz: niedrig;
  OFFEN: lokale Konvertierungshistorie).
- Aktuelle Zeitstempel der Daten- und Vorlagendateien sind Nutzungsindizien,
  keine fachliche Bestätigung. Eine Datei kann kopiert, automatisiert berührt
  oder nicht mehr fachlich relevant sein.
