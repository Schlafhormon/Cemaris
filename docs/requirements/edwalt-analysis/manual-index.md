# Handbuch-, Themen-, Masken- und Screenshotindex

> **Bewertung:** Die folgenden Einträge belegen, was die Handbücher beschreiben und die Hilfebilder zeigen. Die aktuelle Nutzung und die Übernahme nach Cemaris sind jeweils `OFFEN`. Sofern nicht anders angegeben: Status `ANNAHME`, Konfidenz hoch für die Beschreibung und offen für die Ist-Nutzung.

## Struktureller Befund

| Evidenz | Handbuch | technischer Aufbau | Absätze | benannte Anker | Bildvorkommen / eindeutige GIFs | fehlend | nicht referenziert | Quelle |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `MAN-EDW` | Grabverwaltung | Microsoft-Word-97-HTML, Windows-1252, Titelmetadatum „Sehr geehrter Anwender,“ | 2.796 | 127 | 94 / 82 | 0 | 0 | `edwalt3\EDWHELP\EDWHELP.htm` |
| `MAN-EDK` | Krematorium | Microsoft-Word-97-HTML, Windows-1252, Titelmetadatum „Sehr geehrter Anwender,“ | 1.587 | 76 | 44 / 41 | 0 | 0 | `edwalt3\EDKHELP\EDK3HLP.htm` |

Es gibt keine `href`-Links; die `_Toc...`-Anker markieren Themen, dienen aber nicht als klickbares Inhaltsverzeichnis. Einige Themen laufen über mehrere wiederholte Seitenüberschriften, andere Überschriften sind nicht verankert. Der Index konsolidiert daher Anker, Absatzfolge und visuelle Seitenüberschriften. Wiederholt eingebundene Logos und Masken werden nur einmal als Bilddatei gezählt.

## Grabverwaltungshandbuch `EDWHELP.htm`

### Teil I - Anmeldung, Grundmenü und Stammdaten

| Themen-ID | Thema / Maske | lokaler Quellenverweis | Bilder | beschriebene Eingaben und Ergebnisse | Abhängigkeit / Regelindiz | Offene Frage |
| --- | --- | --- | --- | --- | --- | --- |
| `MAN-EDW-001` | Anmeldung | `_Toc496520365`, Abs. 144-162 | `IMG-EDW-112` | Anwender-, Bediener-, Benutzer- und Passwortangaben; Ergebnis Anmeldung oder Fehlermeldung | Bedienerstammdaten | Welche Identitätsquelle wird aktuell tatsächlich verwendet? |
| `MAN-EDW-002` | Grundmenü und Schnellstart | `_Toc496520366`, Abs. 163-175 | `IMG-EDW-113` | Menübereiche Stammdaten, Grabverwaltung, Auswertungen, Sonderbereiche, Kasse/Buchen, Service und Hilfe; Symbole für Direktaufrufe | Lizenz und Bedienerzulassung | Welche Menüs/Symbole sind in der produktiven Installation sichtbar und genutzt? |
| `MAN-EDW-010` | Anwender-Stammdaten | `_Toc496520368`, Abs. 177-265 | `IMG-EDW-114`, `IMG-EDW-115` | Anwenderkennung/-bezeichnung, Lizenz, Anschrift, Haushaltsjahr, bis zu drei Bankverbindungen, laufende Nummern | `DAT-008` (`W001`), Nummernkreise, Kassenzeichen, Modulo-Prüfung | Welche Werte sind führend, historisiert und migrationspflichtig? |
| `MAN-EDW-011` | Pfadnamen-Verwaltung | `_Toc496520369`, Abs. 266-320 | `IMG-EDW-116` | Dateikürzel, Laufwerk/Pfad, Information; Pfad suchen/ändern | `DAT-023` (`W002`); je Arbeitsplatz; Programm- und Datenverzeichnis | Wie viele Arbeitsplatzkopien und abweichende Pfade existieren? |
| `MAN-EDW-012` | Parameter/INI-Daten | `_Toc496520370`, Abs. 321-497 | `IMG-EDW-117` | Programmstart, Währung, Druck, Word, Fristen, Suche, FUG, Krematorium, Nummern-/Schnittstellenparameter | `TECH-009` (`EDWALT3.INI`) | Welche Schlüssel sind lokal wirksam, veraltet oder nur optional? |
| `MAN-EDW-013` | Bediener-Stammdaten und Zulassungen | `_Toc496520372`, Abs. 499-542 | `IMG-EDW-118` | Nummer, Name, Kennwort, Kontakt; Änderungs-, Lösch-, Druck-, Kasse-, Storno-, Formular-, System- und Stammdatenerlaubnis; Sonderprogramme | `DAT-009` (`W004`) | Konten, Passwortschutz, Vertretung und tatsächliche Rechte fachlich/technisch erheben. |
| `MAN-EDW-014` | Friedhofs-/Grabarten-Stammdaten | `_Toc496520373`, Abs. 543-710 | `IMG-EDW-119` bis `IMG-EDW-122` | Friedhof, Gruppe/Verwaltungsgemeinschaft, Grabart, Nutzungs-/Ruhezeiten, Urnenruhezeit, Fläche, Kapazitäten, Gebühren-/Haushaltsbezüge, Terminraster, FUG | `DAT-010` (`W005`), `DAT-014` (`W010`); Regeln wirken in Vorgängen/Gebühren | Welche Werte sind Satzungsregel, lokale Konvention oder veraltete Konfiguration? |
| `MAN-EDW-015` | Gebühren-Stammdaten | `_Toc496520374`, Abs. 711-805 | `IMG-EDW-123`, `IMG-EDW-124` | Schlüssel, Kennzeichen, Bezeichnung/Kurztext, Mengeneinheit, Nachkommastellen, Betrag, Haushalts-/Kostenstelle, Mehrwertsteuerkennzeichen | `DAT-012` (`W006`), Auswahlboxen und Bescheide | Gültigkeit, Historie, Preisfindung und Finanzzuordnung klären. |
| `MAN-EDW-016` | Sonstige Adressen | `_Toc496520375`, Abs. 806-843 | `IMG-EDW-125` | Nummernkreis, Anschrift, Kontakt, Personenkonto, Bankdaten, Einzugskennzeichen; Auswahlbox | `DAT-013` (`W007`) | Welche Adressarten/Nummernkreise werden aktuell genutzt und wie werden Dubletten behandelt? |
| `MAN-EDW-017` | Auswahl-Stammdaten | `_Toc496520376`, Abs. 844-862 | `IMG-EDW-126` | Abschnitte für Vorgangsbezeichnungen, Terminarten, Anrede, Orte, Suchcodes, Grabzustände und Word-Formulare | `AUSWAHL.INI`; fehlende Datei wird laut Handbuch mit Defaults erzeugt | Welche Listen sind fachlich gültig, lokal erweitert oder historisch? |
| `MAN-EDW-018` | Formularverwaltung mit Editor | `_Toc496520377`, Abs. 863-879 und 892-1225 | `IMG-EDW-127`, `IMG-EDW-129` | Formularauswahl, Metadaten, freier Editor, nummerierte `$`-Platzhalter und Drucksteuerzeichen | `FORM.DAT`, Druckmodule; proprietäres Editorformat | Welche Editorformulare existieren neben Word-Vorlagen noch produktiv? |
| `MAN-EDW-019` | Formularverwaltung mit Word | `_Toc496520378`, Abs. 880-891; Platzhalterbeschreibung bis Abs. 1225 | `IMG-EDW-128` | Word-Seriendruckvorlagen und Steuerdateien; Handbuch enthält keine vollständige Word-Bedienung | DOT-Vorlagen, BAS-Makros, `EDW_SD*.TXT`, OLE/Word-Automatisierung | Welche Word-/Office-Version, Sicherheitsrichtlinie und Vorlagen sind führend? |

### Teil II - Grabverwaltung-Hauptprogramm

| Themen-ID | Thema / Ablauf | lokaler Quellenverweis | Bilder | Eingaben / Ergebnisse / Dokumente | erkennbare Regel | Offene Frage |
| --- | --- | --- | --- | --- | --- | --- |
| `MAN-EDW-100` | Neue Grabstätte: Grundfenster | `_Toc496520380`, Abs. 1278-1392 | `IMG-EDW-130` | Friedhof und Grabnummer, Nutzungsberechtigtenadresse, Suchcodes, Grabname/-art, Sarg-/Urnenstellen, Fläche/Maße, Erstnutzung/Nutzungsende | Grabart vorbelegt Kapazitäten/Fristen; `W020` 91–620 ist technisch lückenlos profiliert, die konkrete erste Adressrolle bleibt `OFFEN` | Wie wird die räumliche Grabnummer aufgebaut und welche Rolle hat die erste Adresse? |
| `MAN-EDW-101` | Vorgang, Verstorbene und Beisetzung | `_Toc496520381`, Abs. 1393-1570 | `IMG-EDW-131` bis `IMG-EDW-133` | Vorgangsart, Nutzungszeitraum, Personendaten, Trauerfeier, Stelle/Tiefe, Beisetzungsart/-termin, Ruhefrist, Bestatter, Suchcode | `W021`: Trauerfeier-, Beisetz-, Geburts-, Ruhefrist- und Sterbedatum technisch bestätigt | Welche Vorgangsarten/Fristregeln gelten heute tatsächlich? |
| `MAN-EDW-102` | Sonstige Verstorbenendaten | `_Toc496520382`, Abs. 1571-1584 | `IMG-EDW-134` | Nummer, Pfarrer/Konfession, 16 freie Hinweise, Melde-/Änderungsangaben | `W023` wird im Pfadkapitel als Sonstiges-Fenster beschrieben | Welche Felder haben noch Zweck/Rechtsgrundlage? |
| `MAN-EDW-103` | Gebührenfenster | `_Toc496520383`/`384`, Abs. 1585-1683 | `IMG-EDW-135` bis `IMG-EDW-137` | Erwerb/Verlängerung, Beisetzungs- und freie Gebühren, Menge/Betrag, Haushaltsstelle, Bescheidkennzeichen, Kassenzeichen, Bescheid-/Fälligkeitsdatum | `W021` 385–5.464 = 40×127; Positionen 1–8 belegt; Gebührennummer relativ 73/L4 bestätigt; Ausdruck kann Sollstellung auslösen | Welche Berechnungen sind noch maßgeblich und welches Finanzsystem führt? |
| `MAN-EDW-104` | Vorhandene Grabstätte, Belegung und Vorgangsnavigation | `_Toc496520385`, Abs. 1684-1733 | `IMG-EDW-138`, `IMG-EDW-139` | Navigation, Suche, Belegungsübersicht, Vorgänge, Gebühren, Druck | Doppelbelegung wird als Warnfall gezeigt | Welche Prüfungen verhindern heute unzulässige Belegung? |
| `MAN-EDW-105` | Druckfenster und Formularvarianten | `_Toc496520386`/`387`, Abs. 1734-1864 | `IMG-EDW-140` | Drucker, Anzahl, Ausgabegerät, Laser/Schacht, Formular, Zeilen; Bescheid, Grabbrief, Annahmeanordnung, Überweisung, Mitteilung; Sollstellung/Gutschrift/Nachdruck/Probe | Editor- oder Word-Verfahren; Formulardruck kann Buchung erzeugen | Welche Ausgabearten, Freigaben und DMS-Ablagen gelten? |
| `MAN-EDW-106` | Storno und Gutschrift | `_Toc496520388`/`389`, Abs. 1865-1900 | `IMG-EDW-141` | Storno entfernt/markiert eine Buchung; Gutschrift erzeugt Gegenbuchung mit neuer Nummer | eigene Bedienerzulassung; Unterschied ist migrationskritisch | Welche Historie ist rechtlich/finanziell zu bewahren? |
| `MAN-EDW-107` | Eingeschränktes Nutzungsrecht | unbenannte Überschrift Abs. 1901-1932 | `IMG-EDW-142` bis `IMG-EDW-144` | besonderer Vorgang, Laufzeitverkürzung und Gutschriftposition | Release/Handbuch zeigen länderspezifische Varianten | Wird diese Funktion heute verwendet und in welchem Rechtskontext? |

### Teil III - Besonderheiten

| Themen-ID | Funktion | Quelle | Bilder | Ergebnis / Ablauf | Abhängigkeit / Risiko | Offene Frage |
| --- | --- | --- | --- | --- | --- | --- |
| `MAN-EDW-200` | Schaltflächen/Navigationslogik | `_Toc496520392`, Abs. 1981-2003 | `IMG-EDW-145`, `IMG-EDW-146` | Zurück/Vor, Suche, letzter Satz, Belegung, Vorgangsinfo, Vorgang | W020/W021; reine Navigation laut Hilfe | Welche Bedienpfade werden real genutzt? |
| `MAN-EDW-201` | Suchfenster | `_Toc496520393`, Abs. 2004-2038 | `IMG-EDW-147` | Suche nach Nutzungsberechtigten, Grabnummer, Verstorbenen, Datum, Grabart, Suchcodes, Bescheidnummer; Weitersuche/Übernahme | Sichtbarkeit/Berechtigung nicht beschrieben | Welche Suchfelder, Unschärfe und Datenschutzfilter werden benötigt? |
| `MAN-EDW-202` | Bearbeiten-Menü | `_Toc496520394`, Abs. 2039-2052 | `IMG-EDW-148` | Zugang zu Nummernänderung, Kopieren, Löschen, Zustand, Notiz, Zusatzadressen, PK, FUG, Überführung | Änderungs-/Löschrechte | Welche Funktionen sind administrativ beschränkt? |
| `MAN-EDW-203` | Friedhof/Feld/Grab-Nummer ändern | `_Toc496520395`, Abs. 2053-2064 | `IMG-EDW-149` | Umnummerierung mit Bestätigung | statischer Ablauf bestätigt; kein persistierter Alt-/Neuschlüssel oder sicherer Nachfolger gefunden | Wie werden Referenzen, Dokumente und Historie fortgeschrieben? Bis zum Beleg keine Filterung. |
| `MAN-EDW-204` | Adresse kopieren | `_Toc496520396`, Abs. 2065-2075 | `IMG-EDW-150`, `IMG-EDW-151` | erste Adresse in zweite/dritte Adresse oder Notiz kopieren | Datenredundanz | Welcher Adressstand ist führend und historisiert? |
| `MAN-EDW-205` | komplette Grabstätte löschen | `_Toc496520397`, Abs. 2076-2089 | `IMG-EDW-152` | löscht laut Dialog Grab-, Vorgangs- und Verstorbenendaten nach Sicherheitsfrage | hohes Verlust-/Nachweisrisiko | Ist physische Löschung aktiv, protokolliert und zulässig? |
| `MAN-EDW-206` | Grabzustand | `_Toc496520398`, Abs. 2090-2136 | `IMG-EDW-153` | Zustand, Mitteilung, Prüfung/Erledigung für Grabmal sowie Einfassung/Pflege; Probe-/Echtdruck | Release 3.20 nennt Sammellöschung | Welche Zustandsarten und Folgeprozesse gelten? |
| `MAN-EDW-207` | Grabnotiz | `_Toc496520399`, Abs. 2137-2145 | `IMG-EDW-154` | Freitext, Löschen, Abbrechen, Speichern/Beenden | `W022`; besonders schutzbedürftiger Freitext | Zweck, Rechtsgrundlage, Aufbewahrung und Datenqualität? |
| `MAN-EDW-208` | zweite/dritte Adresse | `_Toc496520400`, Abs. 2146-2157 | `IMG-EDW-155` | zusätzliche Empfänger, Kopieren/Löschen/Adressauswahl | Dokumentempfänger und PK-Bezug | Rollen der Adressen und Historie klären. |
| `MAN-EDW-209` | Personenkontonummern | `_Toc496520401`, Abs. 2158-2175 | `IMG-EDW-156` | je erster/zweiter/dritter Adresse | Schnittstellen-/Buchungsbezug | Führendes Personenkonto und Dublettenbehandlung? |
| `MAN-EDW-210` | FUG-Fenster | `_Toc496520403`, Abs. 2192-2203 | `IMG-EDW-157` | Gebühr, Zeitraum, Kennzeichen, Zahler, Einzug, Bescheiddaten; Einzel-/Sammeldruck | FUG-Stamm/Parameter/Buchung | Wird FUG heute eingesetzt; jährliche oder monatliche Variante? |
| `MAN-EDW-211` | Überführung | `_Toc496520404`, Abs. 2204-2239 | `IMG-EDW-158`, `IMG-EDW-159` | neuer Überführungsfall, Daten zu verstorbener Person, Ein-/Überführung, Gebühren/Druck | eigener Vorgang und Nummernkreis | Welche fachlichen Varianten und Dokumente existieren? |
| `MAN-EDW-212` | Buchen-Menü | `_Toc496520405`, Abs. 2240-2245 | `IMG-EDW-160` | Verzweigung zum Personenkonto; Zahlungen und weitere Buchungsfunktionen | gesondertes Handbuch fehlt | Vollständigen Kassenprozess und Funktionstrennung erheben. |
| `MAN-EDW-213` | Einzel-Kartei, Einzel-Mahnung, Einzel-Brief | `_Toc496520406` bis `410`, Abs. 2246-2253 | `IMG-EDW-161` | Einzelausgaben aus Grabkontext | Reports/Word | Nutzung, Vorlagen und Versand klären. |
| `MAN-EDW-214` | Hilfe-Menü | `_Toc496520410`, Abs. 2254-2263 | `IMG-EDW-162` | kontextsensitive lokale Hilfe | Hilfedatei/DLL | Welche Hilfe ist in produktiver Version erreichbar? |

### Teil IV - Auswertungen und Statistiken

| Themen-ID | Auswertung | Quelle | Bild | Auswahl / Ergebnis | Abhängigkeit / Risiko | Offene Frage |
| --- | --- | --- | --- | --- | --- | --- |
| `MAN-EDW-300` | Auswertungsmenü | `_Toc496520412`, Abs. 2293-2299 | `IMG-EDW-163` | Zugriff auf 16 Auswertungen | AUSWERT*-Module; aktuelle Nutzung offen | Welche Reports werden wann und von wem genutzt? |
| `MAN-EDW-301` | Gräber-Kurzliste/FUG-Kurzliste | `_Toc496520413`, Abs. 2300-2315 | `IMG-EDW-164` | Bereiche, Grabart, FUG-Varianten, Sortierung, optional Notizen/Endstatistik | `REL-320` erweitert Notizdruck | Enthält Ausgabe personenbezogene Detaildaten? |
| `MAN-EDW-302` | Grab-Vorgangsliste | `_Toc496520414`, Abs. 2316-2327 | `IMG-EDW-165` | Bereich/Grabart; Vorgänge prüfen oder prüfen und löschen | Löschoption ist risikoreich | Zweck und Löschwirkung verifizieren. |
| `MAN-EDW-303` | Grabstätten-Karteiblatt | `_Toc496520415`, Abs. 2328-2339 | `IMG-EDW-166` | alle/letzte Vorgänge, Vorverstorbene, Notizen | Detailreport | Aufbewahrung und Empfänger? |
| `MAN-EDW-304` | belegt/unbelegt | `_Toc496520416`, Abs. 2340-2355 | `IMG-EDW-167` | Belegungsstatus, Aktualisierung, Ruhefristen, Statistik | kann Belegungszahlen aktualisieren | Ist die Auswertung schreibend und wie wird sie abgesichert? |
| `MAN-EDW-305` | Nutzungsende-Liste/-Briefe | `_Toc496520417`, Abs. 2356-2366 | `IMG-EDW-168` | Zeitraum, Sortierung, Listen-/Briefvariante, Angebotsjahre | Word-/Editorformular | Welcher Prozess folgt auf Nutzungsende? |
| `MAN-EDW-306` | Lage-Kurzliste | `_Toc496520418`, Abs. 2367-2380 | `IMG-EDW-169` | Lagebereich, Grabart, Vorverstorbene | Druckreport | Empfänger/Zweck? |
| `MAN-EDW-307` | Grabzustands-Liste/-Briefe | `_Toc496520419`, Abs. 2381-2393 | `IMG-EDW-170` | Grabmal/Einfassung/Pflegezustand, Zustand, Zähler, Erledigung, Briefe, Lösch-/Speicheroptionen | `REL-320`/`REL-330` | Welche Lösch-/Schreibfunktionen sind aktiv? |
| `MAN-EDW-308` | Suchcode-Liste/-Briefe | `_Toc496520420`, Abs. 2394-2408 | `IMG-EDW-171` | drei Suchcodes oder Suchwort; Liste/Word-Brief | Auswahlwerte | Bedeutung und Pflege der Suchcodes? |
| `MAN-EDW-309` | allgemeine Briefe | `_Toc496520421`, Abs. 2409-2418 | `IMG-EDW-172` | Auswahl nach Grab-/Adressnummern und Briefnummer | Word-Vorlage | Welche Briefarten und Rechtsgrundlagen? |
| `MAN-EDW-310` | Beerdigungsbuch | `_Toc496520422`, Abs. 2419-2432 | `IMG-EDW-173` | Bereich, Datum, Suchcode, Sarg/Urne, Sortierung, Endstatistik | `W021`/Statistik | Ist dies ein amtliches Register oder Arbeitsbericht? |
| `MAN-EDW-311` | Beerdigungs-Tagesliste/Trauerfeierliste | `_Toc496520423`, Abs. 2433-2447 | `IMG-EDW-174` | Friedhof, Datum, Sarg/Urne, Tageslistenvariante | Termin-/Vorgangsdaten | Werden Aushänge erzeugt; welche Datenschutzgrenzen gelten? |
| `MAN-EDW-312` | Ruhefrist-Ende-Liste | `_Toc496520424`, Abs. 2448-2459 | `IMG-EDW-175` | Bereich, Grabart, Ruhefristzeitraum, Vorverstorbene | Fristdaten | Wie werden Folgeaktionen ausgelöst? |
| `MAN-EDW-313` | Grabarten-Stammdatenliste | `_Toc496520425`, Abs. 2460-2461 | kein eigenes Bild | Stammdatenreport | `W005` | Nutzung/Empfänger? |
| `MAN-EDW-314` | Gebühren-Stammdatenliste | `_Toc496520426`, Abs. 2462-2463 | kein eigenes Bild | Stammdatenreport | `W006` | Nutzung/Empfänger? |
| `MAN-EDW-315` | Übersicht sonstiger Adressen | `_Toc496520427`, Abs. 2464-2474 | kein eigenes Bild | Adressstammdatenreport | `W007` | Datenschutz, Berechtigung und Exportzweck? |
| `MAN-EDW-316` | Statistik | `_Toc496520428`, Abs. 2475-2484 | kein eigenes Maskenbild | Grabneuerwerb, Verlängerung, Beisetzungsgebühren; Datei-/Listenausgabe erkennbar | `STATIST.*`, `STATIST.TXT`, `LISTE.LST` | Kennzahlendefinition, Stichtag und Weiterverarbeitung? |

### Teile V bis VII - Sonderprogramme

| Themen-ID | Funktion | Quelle | Bilder | Ablauf / Ergebnis | Abhängigkeit / Risiko | Offene Frage |
| --- | --- | --- | --- | --- | --- | --- |
| `MAN-EDW-400` | Sonstige Bescheide/Aufträge | `_Toc496520430`, Abs. 2515-2636 | `IMG-EDW-176` bis `IMG-EDW-187` | neue Adresse manuell/aus Adressstamm/Grabverwaltung; Auftragsart; Betreff; Text-/Leer-/Gebührenzeilen; Druck von Bescheid/Gutschrift, Annahmeanordnung, Überweisung, Mitteilung; Notiz/Zusatzadresse/PK | `W040`, Gebühren unter besonderem Kürzel, Word/Druck/Buchung | Welche Auftragsarten und lokalen Vorlagen werden genutzt? |
| `MAN-EDW-401` | FUG-Einzel- und Sammelabrechnung | `_Toc496520431`, Abs. 2637-2710 | `IMG-EDW-157`, `IMG-EDW-188`, `IMG-EDW-189` | Zeitraum, Kennzeichen, Zahler, Lastschrift, Einzel-/Sammelbescheid und Buchungen | Parameter steuern Jahr/Monat/Nutzungsende; `REL-320` | Berechnungsregel, Ausnahmefälle, Lastschriftformat und Nutzung bestätigen. |
| `MAN-EDW-402` | Personen-Konten/Kasse | `_Toc496520433`, Abs. 2740-2751 | `IMG-EDW-190` | Zahlungen, Sollausnahmen, Mahnwesen, OP-Übersicht, Ist-Liste, Kassenschnittstelle | gesonderte Beschreibung fehlt; `BUCH` | Führendes Kassen-/Finanzsystem und Buchungshoheit? |
| `MAN-EDW-403` | Terminverwaltung | `_Toc496520435`, Abs. 2764-2790 | `IMG-EDW-191` | Tages-/Wochenübersicht, Friedhofstermine, Übernahme in Grabverwaltung, Tagesliste/Aushang | `W010`, Modul `TE*`; gesonderte Beschreibung fehlt | Wird das Modul heute genutzt oder findet Planung außerhalb statt? |

## Krematoriumshandbuch `EDK3HLP.htm`

Die Stammdatenthemen `MAN-EDK-010` bis `019` wiederholen große Teile des Grabverwaltungshandbuchs, teils mit krematoriumsspezifischen Abweichungen. Das Handbuch bezeichnet das Krematorium als eigenständiges oder integriertes Modul.

| Themen-ID | Thema / Funktion | lokaler Quellenverweis | Bilder | wesentliche Beschreibung | Status / Konfidenz / offene Frage |
| --- | --- | --- | --- | --- | --- |
| `MAN-EDK-001` | Anmeldung und Grundmenü | `_Toc449335474`/`_Toc447613053`, Abs. 96-129 | `IMG-EDK-193`, `IMG-EDK-194` | Anmeldung, Krematorium-Schnellstart, Sperrsymbol | `ANNAHME`, hoch; reale Anmeldung/Sperre prüfen. |
| `MAN-EDK-010` | Anwender-Stammdaten | `_Toc449335476`, Abs. 131-216 | `IMG-EDK-195`, `IMG-EDK-196` | Haushaltsjahr, Bankdaten, Nummern für Bescheid, Gutschrift, Einlieferung, Genehmigung und Personenkonto | `ANNAHME`, hoch; gültige Nummernkreise prüfen. |
| `MAN-EDK-011` | Pfade und Datenbestandsliste | `_Toc449335477`, Abs. 217-265 | `IMG-EDK-197` | `W001`, `W004`-`W007`, `W080`, `FORM`, `DRAUF`, `BUCH`, Statistik | `ANNAHME`, hoch; Arbeitsplatzpfade prüfen. |
| `MAN-EDK-012` | Parameter/INI | unbenannte Überschrift Abs. 266-425 | kein eigenes Bild | Krematoriums-, Druck-, Word-, Status-, Nummern- und Schnittstellenparameter | `ANNAHME`, hoch; tatsächliche Werte/Funktion prüfen. |
| `MAN-EDK-013` | Bediener und Sonderprogrammrechte | `_Toc449335478`, Abs. 426-469 | `IMG-EDK-198` | Krematoriumsrecht sowie allgemeine Bedienerzulassungen | `ANNAHME`, hoch; Rechtebestand prüfen. |
| `MAN-EDK-014` | Pseudo-Friedhof KREM | `_Toc449335479`, Abs. 470-497 | kein Bild | krematoriumsspezifischer Stammsatz und Grabart | `ANNAHME`, mittel; lokaler Bestand/Version prüfen. |
| `MAN-EDK-015` | Krematoriumsgebühren | `_Toc449335480`, Abs. 498-583 | `IMG-EDK-199`, `IMG-EDK-200` | Gebühren unter KREM, Auswahl und Haushalts-/Kostenstellen | `ANNAHME`, hoch; aktuelle Gebührenführung prüfen. |
| `MAN-EDK-016` | sonstige Adressen | `_Toc449335481`, Abs. 584-621 | `IMG-EDK-201` | Versandadressen, Bestatter, Personenkonto und Bankdaten | `ANNAHME`, hoch; Nummernkreise widersprechen teils der allgemeinen Hilfe und sind versionsabhängig. |
| `MAN-EDK-017` | Auswahl-Stammdaten | `_Toc449335482`, Abs. 622-638 | `IMG-EDK-202` | Orte und Versandarten als Infoboxdaten | `ANNAHME`, hoch; lokaler Inhalt prüfen. |
| `MAN-EDK-018` | Editorformulare | `_Toc449335483`, Abs. 639-653 und 665-993 | `IMG-EDK-203`, `IMG-EDK-205` | Formularauswahl/-editor, Krematoriumsplatzhalter, Drucksteuerung | `ANNAHME`, hoch; vorhandene Editorformulare prüfen. |
| `MAN-EDK-019` | Word-Formulare | `_Toc449335484`, Abs. 654-664 | `IMG-EDK-204` | Word-Seriendruck; Bedienung nicht vollständig beschrieben | `ANNAHME`, hoch; Office-/Makroabhängigkeit prüfen. |
| `MAN-EDK-100` | Krematorium-Grundfenster | `_Toc449335486`, Abs. 1024-1118 | `IMG-EDK-207` bis `IMG-EDK-210` | Einlieferung/Genehmigung/Einäscherung, verstorbene Person, Veranlasser/Zahler, Bestatter, Friedhof/Grab, Gruppen-/Suchcodes | `ANNAHME`, hoch; Prozess, Pflichtnachweise und Codes klären. |
| `MAN-EDK-101` | Urnenversand | `_Toc449335487`, Abs. 1119-1159 | `IMG-EDK-211` | Versandadresse/-art/-hinweis, Zustimmung, Erinnerungen, Rückmeldung/Beisetzung, Seebestattung | `ANNAHME`, hoch; Zuständigkeiten und Nachweise klären. |
| `MAN-EDK-102` | Gebühren und Bescheid | `_Toc449335488`, Abs. 1160-1216 | `IMG-EDK-212` | Gebührenpositionen, Kassenzeichen, Bescheid/Fälligkeit, Empfänger, Gesamtbetrag | `ANNAHME`, hoch; Sollstellung und Finanzschnittstelle klären. |
| `MAN-EDK-103` | Druckausgabe | `_Toc449335489`, Abs. 1217-1327 und 1361-1374 | `IMG-EDK-213`, `IMG-EDK-214`, `IMG-EDK-216`, `IMG-EDK-217` | Gebührenbescheid, Grabbrief, Annahmeanordnung, Überweisung, Mitteilung sowie Versand-/allgemeine Formulare | `ANNAHME`, hoch; aktive Vorlagen und Ablage klären. |
| `MAN-EDK-104` | Storno/Gutschrift | `_Toc449335490`, Abs. 1328-1360 | `IMG-EDK-215` | Storno versus Gegenbuchung mit neuer Nummer | `ANNAHME`, hoch; Historisierung/Finanzrecht prüfen. |
| `MAN-EDK-200` | Suche | `_Toc449335492`, Abs. 1405-1437 | `IMG-EDK-219` | Suche nach drei Nummern, Namen, Antragsteller, Daten, Suchcode, Bescheid, Bestatter | `ANNAHME`, hoch; Rechte und Suchpraxis prüfen. |
| `MAN-EDK-201` | Bearbeiten, Kopieren, Löschen, Zusatzadressen | `_Toc449335493` bis `497`, Abs. 1438-1485 | `IMG-EDK-220` bis `IMG-EDK-224` | Adresse kopieren, Datensatz löschen, zweite/dritte Adresse | `ANNAHME`, hoch; Löschwirkung/Adressrollen klären. |
| `MAN-EDK-202` | Personenkonto, Zeremonie/Notiz, Status | `_Toc449335497` bis `499`, Abs. 1486-1540 | `IMG-EDK-225` bis `IMG-EDK-228` | PK je Adresse; Freitexte; Dokument-/Prozessstatus mit Datum/Hinweis | `ANNAHME`, hoch; Statusbedeutung und Aufbewahrung klären. |
| `MAN-EDK-300` | Einäscherungsliste | `_Toc449335501`, Abs. 1547-1550 | Menü in `IMG-EDK-230` | Fall-/Statusliste | `ANNAHME`, mittel; Spalten, Empfänger und Amtsarztvariante prüfen. |
| `MAN-EDK-301` | Katasterliste | `_Toc449335502`, Abs. 1551-1554 | Menü in `IMG-EDK-230` | Katasterauswertung | `ANNAHME`, niedrig; Zweck unklar. |
| `MAN-EDK-302` | Statistik | `_Toc449335503`, Abs. 1555-1558 | Menü in `IMG-EDK-230` | Fallzahlen nach Zeitraum und vier im Handbuch genannten Gruppen | `ANNAHME`, hoch; Definition/Notwendigkeit der Gruppen prüfen. |
| `MAN-EDK-303` | Rückmeldeliste | `_Toc449335504`, Abs. 1559-1562 | Menü in `IMG-EDK-230` | offene/erfolgte Rückmeldungen | `ANNAHME`, mittel; Prozess und Fristen prüfen. |
| `MAN-EDK-304` | Bestatterliste | `_Toc449335505`, Abs. 1563-1567 | Menü in `IMG-EDK-230` | Auswertung nach Bestatter | `ANNAHME`, mittel; Zweck/Datenschutz prüfen. |
| `MAN-EDK-305` | Sammeldruck Versand/Gebühren | `_Toc449335506`, Abs. 1568-1582 | `IMG-EDK-231`, `IMG-EDK-232` | Selektion nach Datum/Nummer; Versandpapiere oder Bescheide/Anordnungen/Überweisungen | `ANNAHME`, hoch; optionale Installation und Nutzung prüfen. |

## Sichtbare Maskenfelder und Bedienelemente

Die folgende Zusammenfassung enthält ausschließlich generische UI-Bezeichnungen. Beispielwerte aus den Bildern wurden verworfen.

| Evidenz | Maske | sichtbare Feld-/Bereichsgruppen | sichtbare Aktionen | Status / Konfidenz |
| --- | --- | --- | --- | --- |
| `IMG-GRP-001` | Anmeldung | Anwender-Nr., Bediener-Nr., Benutzer, Passwort | Anmelden, Abbrechen, Information | `ANNAHME`, hoch |
| `IMG-GRP-002` | Anwender | Bezeichnung, Lizenz, Haushaltsjahr, Bankverbindungen, Nummernkreise | Löschen, Zurück/Vor, Speichern, laufende Nummern, Beenden | `ANNAHME`, hoch |
| `IMG-GRP-003` | Bediener | Benutzer-/Kontaktfelder, Passwort, Zulassungen, Sonderprogramme | Adresse, Speichern, Löschen, Navigation | `ANNAHME`, hoch |
| `IMG-GRP-004` | Friedhof/Grabart | Friedhof, Gruppe/Verwaltungsgemeinschaft, Grabart, Nutzung/Ruhe, Fläche, Kapazitäten, Gebühren/Haushalt | Terminraster, Gruppe, FUG, Kopieren, Neu, Speichern | `ANNAHME`, hoch |
| `IMG-GRP-005` | Gebührenstamm | Schlüssel/Kennzeichen, Texte, Menge/Nachkommastellen, Betrag, Haushalts-/Kostenstelle, Steuerkennzeichen | Kopieren, Auswahl, Neu, Speichern, Friedhof löschen | `ANNAHME`, hoch |
| `IMG-GRP-006` | Grabgrundfenster | Lage, Nutzungsberechtigter, Suchcodes, Grabname/-art, Stellen/Belegung, Fläche/Maße, Nutzungsdaten | Suche, Belegung, Vorgangsinfo, Vorgang, Navigation | `ANNAHME`, hoch |
| `IMG-GRP-007` | Vorgang/Verstorbene | Vorgang/Zeitraum, Personendaten, Trauerfeier, Lage/Tiefe, Beisetzung, Ruhefrist, Bestatter | Neuer Vorgang, Druck, Löschen, Sonstiges, Gebühren | `ANNAHME`, hoch |
| `IMG-GRP-008` | Gebühren/Bescheid | Gebührenzeilen, Menge/Preis, Bescheidkennzeichen, Kassenzeichen, Termine, Empfänger, Summe | Storno, Druck, Löschen, Text-/Zeilenbearbeitung | `ANNAHME`, hoch |
| `IMG-GRP-009` | Druck | Drucker, Anzahl, Ziel, Laser, Schacht, Formular, Zeilen, Ausgabevariante | Drucken, Standard, Speichern, Abbrechen | `ANNAHME`, hoch |
| `IMG-GRP-010` | Suche | auswählbares Suchkriterium, Suchwert, Ergebnisliste | Übernehmen, Weitersuchen, Abbrechen | `ANNAHME`, hoch |
| `IMG-GRP-011` | Zustand/Notiz/Zusatzadresse/PK | Zustand/Datum/Mitteilung/Erledigung; Freitext; weitere Anschrift; PK-Nummern | Probe-/Echtdruck, Kopieren, Löschen, Auswahl | `ANNAHME`, hoch |
| `IMG-GRP-012` | FUG | Gebühr/Kennzeichen, Berechnungszeitraum, Bescheidkennzeichen/Hinweis, Zahler, Einzug, Bescheiddaten | Einzel-/Sammeldruck, Storno, Löschen | `ANNAHME`, hoch |
| `IMG-GRP-013` | Sonstige Bescheide/Aufträge | Auftrag, Empfänger, Art/Text, Positionen, Termine, Summe | neue Adresse, Gebührenwahl, Positionen, Druck, Notiz | `ANNAHME`, hoch |
| `IMG-GRP-014` | Krematorium | Einlieferung/Genehmigung/Einäscherung, verstorbene Person, Antragsteller/Zahler, Bestatter, Versand, Status | Suche, Gebühren, Versand, allgemeine Drucke, Neu | `ANNAHME`, hoch |
| `IMG-GRP-015` | Terminverwaltung | Friedhof/Datum, Terminliste, Bestatter/Person, Bestattungsdetails, Grabnummer | Adresse, Speichern, Notiz, Navigation, Verwerfen | `ANNAHME`, hoch |

## Screenshot-Vollständigkeit

| Evidenz | Ergebnis | Status | Konfidenz | Offene Frage |
| --- | --- | --- | --- | --- |
| `OBS-IMG-001` | Alle `Image110.gif` bis `Image191.gif` (82 Dateien) sind in `EDWHELP.htm` referenziert und visuell geprüft. Mehrfachreferenzen: `Image111`, `119`, `140`, `146`, `157`. | `ANNAHME` hinsichtlich fachlicher Bedeutung | hoch | Sind die Bilder versionsgleich zur produktiven Installation? |
| `OBS-IMG-002` | Alle `Image192.gif` bis `Image232.gif` (41 Dateien) sind in `EDK3HLP.htm` referenziert und visuell geprüft. Mehrfachreferenzen: `Image214`, `220`, `225`. | `ANNAHME` hinsichtlich fachlicher Bedeutung | hoch | Ist das Krematoriumsmodul produktiv lizenziert/genutzt? |
| `OBS-IMG-003` | Es existieren weder fehlende Referenzen noch unreferenzierte GIFs. Die zusätzlichen `Thumbs.db` sind Shell-Vorschaudatenbanken, keine Handbuchbilder. | `ANNAHME` | hoch | Keine; nur Veröffentlichungs-/Datenschutzfreigabe offen. |

Die Screenshotdateien selbst werden aus Urheberrechts- und Datenschutzgründen nicht in Git übernommen.

## Vollständiges Ankerregister

Das Register enthält jede Absatzposition mit mindestens einem benannten
HTML-Anker. Mehrere historische `_Toc...`-Anker derselben Überschrift stehen
in einer Zeile. Damit sind alle 127 EDW- und 76 EDK-Anker erfasst, ohne
Handbuchfließtext zu kopieren. Es wurden keine `href`-Links festgestellt.

Status: `ANNAHME`; Konfidenz: hoch; Evidenz: strukturelles Parsen von
`EDWHELP.htm` und `EDK3HLP.htm`. OFFEN: Welche Anker-/Handbuchfassung
entspricht exakt der produktiven Binärversion?

### Grabverwaltung: 72 Ankerpositionen

| Absatz | Anker | kurze Überschrift/Strukturfunktion | Bild im selben Absatz |
|---:|---|---|---|
| 144 | `_Toc357929873`, `_Toc496520365` | Teil I - Die Anmeldung | – |
| 163 | `_Toc357929874`, `_Toc496520366` | Teil I - Das Grundmenü | – |
| 176 | `_Toc357929875`, `_Toc496520367` | Teil I - Die Stammdaten-Programme | – |
| 177 | `_Toc357929876`, `_Toc496520368` | a) die Anwender-Stammdaten | – |
| 266 | `_Toc357929877`, `_Toc496520369` | b) die Pfadnamen-Verwaltung | – |
| 321 | `_Toc357929878`, `_Toc496520370` | c) die Parameter/INI-Daten | – |
| 498 | `_Toc496520371` | Teil I - Die Stammdaten-Programme | – |
| 499 | `_Toc357929879`, `_Toc496520372` | d) die Bediener-Stammdaten | – |
| 543 | `_Toc357929880`, `_Toc496520373` | e) die Friedhofs-Stammdaten | – |
| 711 | `_Toc357929881`, `_Toc496520374` | f) die Gebühren-Stammdaten | – |
| 806 | `_Toc357929882`, `_Toc496520375` | g) Sonstige Adressen | – |
| 844 | `_Toc357929883`, `_Toc496520376` | h) die Auswahl-Stammdaten | – |
| 863 | `_Toc357929884`, `_Toc496520377` | i) Formular-Verwaltung mit EDITOR | – |
| 880 | `_Toc357929885`, `_Toc496520378` | j) Formular-Verwaltung mit WINWORD | – |
| 1277 | `_Toc357929551`, `_Toc496520379` | Teil II - Grabverwaltung-Hauptprogramm | – |
| 1278 | `_Toc357929552`, `_Toc496520380` | a) Das Grundfenster (Neueingabe eines Grabes) | – |
| 1393 | `_Toc357929553`, `_Toc496520381` | b) Das Vorgangsfenster (Neueingabe eines Grabes) | – |
| 1571 | `_Toc357929554`, `_Toc496520382` | c) Sonstige Verstorbenendaten (Neueingabe eines Grabes) | – |
| 1585 | `_Toc357929555`, `_Toc496520383` | d) Das Gebühren-Fenster (Neueingabe eines Grabes) | – |
| 1628 | `_Toc496520384` | d) Das Gebühren-Fenster (Neueingabe eines Grabes) | – |
| 1684 | `_Toc357929556`, `_Toc496520385` | e) Das Grundfenster (Vorhandene Grabstätte) | – |
| 1734 | `_Toc357929557`, `_Toc496520386` | f) Das Druckfenster | – |
| 1810 | `_Toc357929558`, `_Toc496520387` | g) Das Druckfenster-Formularvariante | – |
| 1865 | `_Toc357929559`, `_Toc496520388` | h) Das Gebührenfenster (Storno) | – |
| 1880 | `_Toc357929560`, `_Toc496520389` | i) Das Druckfenster (Gutschrift) | – |
| 1959 | `_Toc496520390` | Teil III - Grabverwaltung-Besonderheiten | – |
| 1960 | `_Toc496520391` | Inhaltsübersicht | – |
| 1980 | `_Toc357929561` | Teil III - Grabverwaltung-Besonderheiten | – |
| 1981 | `_Toc357929562`, `_Toc496520392` | A) Die Schaltflächen | – |
| 2004 | `_Toc357929563`, `_Toc496520393` | B) Das Suchfenster | – |
| 2039 | `_Toc357929564`, `_Toc496520394` | C) Das "Bearbeiten-Menü" | – |
| 2053 | `_Toc357929565`, `_Toc496520395` | 1.) Friedhof/Feld/Grab-Nummer ändern | – |
| 2065 | `_Toc357929566`, `_Toc496520396` | 2.) Nutzungsberechtigten-Adresse kopieren | – |
| 2076 | `_Toc496520397` | 3.) Löschen einer kompletten Grabstätte | – |
| 2090 | `_Toc496520398` | 4.) Das Grab-Zustands-Fenster | – |
| 2137 | `_Toc496520399` | 5.) Das Grab-Notiz-Fenster | – |
| 2146 | `_Toc496520400` | 6.) Die 2. und 3. Adresse | – |
| 2158 | `_Toc496520401` | 7.) Die Personen-Konten-Nummern | – |
| 2176 | `_Toc496520402` | 8.) Das Druckausgabe-Fenster | – |
| 2192 | `_Toc496520403` | 9.) Das FUG -Fenster (Friedhofsunterhaltungsgebühren) | – |
| 2204 | `_Toc496520404` | 10.) Überführungen | – |
| 2240 | `_Toc496520405` | D) Das Buchen-Menü | – |
| 2246 | `_Toc496520406` | E) Das Auswertungs-Menü | – |
| 2247 | `_Toc496520407` | 1.) Druck einer Grab-Kartei | – |
| 2248 | `_Toc496520408` | 2.) Druck einer Einzel-Mahnung | – |
| 2249 | `_Toc496520409` | 3.) Druck eines Einzel-Briefes | – |
| 2254 | `_Toc496520410` | F) Das Hilfe-Menü | – |
| 2292 | `_Toc353688358`, `_Toc353772095`, `_Toc357929573`, `_Toc496520411` | Teil IV - Auswertungen | – |
| 2293 | `_Toc353688359`, `_Toc353772096`, `_Toc357929574`, `_Toc496520412` | Das AUSWERTEN-Menü | – |
| 2300 | `_Toc353688360`, `_Toc353772097`, `_Toc357929575`, `_Toc496520413` | 1.) Die Gräber Kurzliste | – |
| 2316 | `_Toc353688361`, `_Toc353772098`, `_Toc357929576`, `_Toc496520414` | 2.) Die Gräber Vorgangs-Liste | – |
| 2328 | `_Toc496520415` | 3.) Das Grabstätten-Karteiblatt | – |
| 2340 | `_Toc496520416` | 4.) Liste der belegten/unbelegten Gräber | – |
| 2356 | `_Toc353688364`, `_Toc353772101`, `_Toc357929579`, `_Toc496520417` | 5.) Nutzungsende-Liste/Nutzungsende-Briefe | – |
| 2367 | `_Toc496520418` | 6.) Lage-Kurz-Liste | – |
| 2381 | `_Toc353688365`, `_Toc353772102`, `_Toc357929580`, `_Toc496520419` | 7.) Grabzustands-Liste/Grabzustands-Briefe | – |
| 2394 | `_Toc496520420` | 8.) SUCH-CODE-Liste | – |
| 2409 | `_Toc496520421` | 9.) Sonstige, allgemeine Briefe | – |
| 2419 | `_Toc353688366`, `_Toc353772103`, `_Toc357929581`, `_Toc496520422` | 10.) Das Beerdigungs-Buch | – |
| 2433 | `_Toc496520423` | 11.) Beerdigungs-Tagesliste | – |
| 2448 | `_Toc353688367`, `_Toc353772104`, `_Toc357929582`, `_Toc496520424` | 12.) Die Ruhefrist-Ende-Liste | – |
| 2460 | `_Toc496520425` | 13.) Die Liste der Grabarten-Stammdaten | – |
| 2462 | `_Toc496520426` | 14.) Die Liste der Gebühren-Stammdaten | – |
| 2464 | `_Toc496520427` | 15.) Die Übersicht der sonstigen Adressen (Stammdaten) | – |
| 2475 | `_Toc496520428` | 16.) Statistik | – |
| 2514 | `_Toc354283677`, `_Toc496520429` | Teil V - EDWALT3-Sonderprogramme | – |
| 2515 | `_Toc354283678`, `_Toc496520430` | a) Sonstige Bescheide/Aufträge | – |
| 2637 | `_Toc354283679`, `_Toc496520431` | b) FUG (Friedhofs-Unterhaltungs-Gebühr) | – |
| 2739 | `_Toc496520432` | Teil VI - EDWALT3-Sonderprogramme | – |
| 2740 | `_Toc496520433` | Personen-Konten/Kasse | – |
| 2762 | `_Toc496520434` | Teil VII Sonder-Programm | – |
| 2764 | `_Toc496520435` | (Terminverwaltung) | – |

### Krematorium: 45 Ankerpositionen

| Absatz | Anker | kurze Überschrift/Strukturfunktion | Bild im selben Absatz |
|---:|---|---|---|
| 95 | `_Toc357929873`, `_Toc402164075` | (leerer Strukturanker) | – |
| 96 | `_Toc449335474` | Anmeldung und Grundmenü | – |
| 115 | `_Toc357929874`, `_Toc447613053` | Das Grundmenü | – |
| 130 | `_Toc449335475`, `_Toc357929876`, `_Toc402164078` | Teil I - Die Stammdaten-Programme | – |
| 131 | `_Toc447613055`, `_Toc449335476` | a) die Anwender-Stammdaten | – |
| 217 | `_Toc447613056`, `_Toc449335477` | b) die Pfadnamen-Verwaltung | – |
| 426 | `_Toc447613058`, `_Toc449335478` | d) die Bediener-Stammdaten | – |
| 470 | `_Toc447613059`, `_Toc449335479` | e) die Friedhofs-Stammdaten | – |
| 498 | `_Toc447613060`, `_Toc449335480` | f) die Gebühren-Stammdaten | – |
| 584 | `_Toc447613061`, `_Toc449335481` | g) Sonstige Adressen | – |
| 622 | `_Toc447613062`, `_Toc449335482` | h) die Auswahl-Stammdaten | – |
| 639 | `_Toc447613063`, `_Toc449335483` | i) Formular-Verwaltung mit EDITOR | – |
| 654 | `_Toc447613064`, `_Toc449335484` | j) Formular-Verwaltung mit WINWORD | – |
| 1023 | `_Toc354283681`, `_Toc402164088`, `_Toc403376638`, `_Toc449335485` | Teil II - Krematoriums-Haupt-Programm | – |
| 1024 | `_Toc354283682`, `_Toc402164089`, `_Toc449335486` | a) Das Grundfenster | – |
| 1119 | `_Toc449335487` | b) Das Versandfenster | – |
| 1129 | `_Toc354283683`, `_Toc402164090`, `_Toc403376640` | b) Das Versandfenster | – |
| 1160 | `_Toc354283684`, `_Toc402164091`, `_Toc449335488` | c) Das Gebührenfenster | – |
| 1217 | `_Toc354283685`, `_Toc402164092`, `_Toc449335489` | d) Die Druckausgabe | – |
| 1235 | `_Toc402164094` | d) Die Druckausgabe | – |
| 1265 | `_Toc402164095` | d) Die Druckausgabe | – |
| 1327 | `_Toc402164096` | d) Die Druckausgabe | – |
| 1328 | `_Toc449335490` | Storno und Gutschrift | – |
| 1341 | `_Toc402164097` | d) Die Druckausgabe | – |
| 1361 | `_Toc402164098` | d) Die Druckausgabe | – |
| 1404 | `_Toc449335491` | Teil III - Krematorium-Besonderheiten | – |
| 1405 | `_Toc449335492` | e) Das Such-Fenster | – |
| 1438 | `_Toc354283688`, `_Toc402164100`, `_Toc449335493` | b) Das Bearbeiten-Menü | – |
| 1456 | `_Toc354283689`, `_Toc402164101` | Teil III - Krematorium-Besonderheiten | – |
| 1458 | `_Toc449335494` | Adresse kopieren | – |
| 1464 | `_Toc354283690`, `_Toc402164102`, `_Toc449335495` | Löschen eines kompletten Datensatzes | – |
| 1470 | `_Toc354283691`, `_Toc402164103` | Teil III - Krematorium-Besonderheiten | – |
| 1478 | `_Toc449335496` | Zweite und dritte Adresse | – |
| 1484 | `_Toc402164104` | Teil III - Krematorium-Besonderheiten | – |
| 1486 | `_Toc449335497` | Personenkonto-Nummer | – |
| 1494 | `_Toc402164105`, `_Toc449335498` | Zeremonie/Bemerkungen | – |
| 1497 | `_Toc402164106` | Teil III - Krematorium-Besonderheiten | – |
| 1499 | `_Toc449335499` | Status-Übersicht | – |
| 1541 | `_Toc449335500` | Teil IV - Krematorium-Auswertungen | – |
| 1547 | `_Toc449335501` | Einäscherungs-Liste | – |
| 1551 | `_Toc449335502` | Kataster-Liste | – |
| 1555 | `_Toc449335503` | Statistik | – |
| 1559 | `_Toc449335504` | Rückmeldeliste | – |
| 1563 | `_Toc449335505` | Bestatter-Liste | – |
| 1568 | `_Toc449335506` | Versandpapiere und Gebührenbescheide im Sammeldruck | – |

## Vollständiges Screenshot-zu-Thema-Register

Jede der 123 unterschiedlichen GIF-Dateien ist nachstehend einzeln aufgeführt.
Die Zuordnung folgt der Absatzposition im HTML und dem jeweils letzten
vorangehenden Themenanker; bei Mehrfachverwendung werden alle Kontexte genannt.
Alle Bilder wurden zusätzlich lokal visuell auf Maskenart, Feldgruppen und
Bedienelemente geprüft. Beispielwerte wurden weder transkribiert noch übernommen.

Status: `ANNAHME`; Konfidenz: hoch für Referenz und Kontextposition, offen
für Versionsgleichheit und aktuelle Nutzung.

### Grabverwaltung: 82 GIF-Dateien

| Screenshot-ID / lokale Quelle | HTML-Absatz/Absätze | zugeordnetes Hilfethema | Ergebnis / offene Frage |
|---|---|---|---|
| `IMG-EDW-110` / `edwalt3\EDWHELP\Image110.gif` | 6 | Titel-/Produktgrafik vor dem ersten Themenanker | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-111` / `edwalt3\EDWHELP\Image111.gif` | 105, 1230, 1939, 2270, 2491, 2716, 2756 | Titel-/Produktgrafik vor dem ersten Themenanker; j) Formular-Verwaltung mit WINWORD (`_Toc357929885/_Toc496520378`); i) Das Druckfenster (Gutschrift) (`_Toc357929560/_Toc496520389`); F) Das Hilfe-Menü (`_Toc496520410`); 16.) Statistik (`_Toc496520428`); b) FUG (Friedhofs-Unterhaltungs-Gebühr) (`_Toc354283679/_Toc496520431`); Personen-Konten/Kasse (`_Toc496520433`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-112` / `edwalt3\EDWHELP\Image112.gif` | 146 | Teil I - Die Anmeldung (`_Toc357929873/_Toc496520365`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-113` / `edwalt3\EDWHELP\Image113.gif` | 170 | Teil I - Das Grundmenü (`_Toc357929874/_Toc496520366`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-114` / `edwalt3\EDWHELP\Image114.gif` | 178 | a) die Anwender-Stammdaten (`_Toc357929876/_Toc496520368`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-115` / `edwalt3\EDWHELP\Image115.gif` | 222 | a) die Anwender-Stammdaten (`_Toc357929876/_Toc496520368`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-116` / `edwalt3\EDWHELP\Image116.gif` | 267 | b) die Pfadnamen-Verwaltung (`_Toc357929877/_Toc496520369`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-117` / `edwalt3\EDWHELP\Image117.gif` | 327 | c) die Parameter/INI-Daten (`_Toc357929878/_Toc496520370`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-118` / `edwalt3\EDWHELP\Image118.gif` | 505 | d) die Bediener-Stammdaten (`_Toc357929879/_Toc496520372`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-119` / `edwalt3\EDWHELP\Image119.gif` | 549, 1906 | e) die Friedhofs-Stammdaten (`_Toc357929880/_Toc496520373`); i) Das Druckfenster (Gutschrift) (`_Toc357929560/_Toc496520389`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-120` / `edwalt3\EDWHELP\Image120.gif` | 658 | e) die Friedhofs-Stammdaten (`_Toc357929880/_Toc496520373`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-121` / `edwalt3\EDWHELP\Image121.gif` | 678 | e) die Friedhofs-Stammdaten (`_Toc357929880/_Toc496520373`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-122` / `edwalt3\EDWHELP\Image122.gif` | 702 | e) die Friedhofs-Stammdaten (`_Toc357929880/_Toc496520373`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-123` / `edwalt3\EDWHELP\Image123.gif` | 717 | f) die Gebühren-Stammdaten (`_Toc357929881/_Toc496520374`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-124` / `edwalt3\EDWHELP\Image124.gif` | 792 | f) die Gebühren-Stammdaten (`_Toc357929881/_Toc496520374`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-125` / `edwalt3\EDWHELP\Image125.gif` | 816 | g) Sonstige Adressen (`_Toc357929882/_Toc496520375`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-126` / `edwalt3\EDWHELP\Image126.gif` | 858 | h) die Auswahl-Stammdaten (`_Toc357929883/_Toc496520376`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-127` / `edwalt3\EDWHELP\Image127.gif` | 876 | i) Formular-Verwaltung mit EDITOR (`_Toc357929884/_Toc496520377`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-128` / `edwalt3\EDWHELP\Image128.gif` | 884 | j) Formular-Verwaltung mit WINWORD (`_Toc357929885/_Toc496520378`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-129` / `edwalt3\EDWHELP\Image129.gif` | 900 | j) Formular-Verwaltung mit WINWORD (`_Toc357929885/_Toc496520378`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-130` / `edwalt3\EDWHELP\Image130.gif` | 1279 | a) Das Grundfenster (Neueingabe eines Grabes) (`_Toc357929552/_Toc496520380`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-131` / `edwalt3\EDWHELP\Image131.gif` | 1394 | b) Das Vorgangsfenster (Neueingabe eines Grabes) (`_Toc357929553/_Toc496520381`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-132` / `edwalt3\EDWHELP\Image132.gif` | 1418 | b) Das Vorgangsfenster (Neueingabe eines Grabes) (`_Toc357929553/_Toc496520381`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-133` / `edwalt3\EDWHELP\Image133.gif` | 1543 | b) Das Vorgangsfenster (Neueingabe eines Grabes) (`_Toc357929553/_Toc496520381`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-134` / `edwalt3\EDWHELP\Image134.gif` | 1575 | c) Sonstige Verstorbenendaten (Neueingabe eines Grabes) (`_Toc357929554/_Toc496520382`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-135` / `edwalt3\EDWHELP\Image135.gif` | 1586 | d) Das Gebühren-Fenster (Neueingabe eines Grabes) (`_Toc357929555/_Toc496520383`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-136` / `edwalt3\EDWHELP\Image136.gif` | 1629 | d) Das Gebühren-Fenster (Neueingabe eines Grabes) (`_Toc496520384`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-137` / `edwalt3\EDWHELP\Image137.gif` | 1678 | d) Das Gebühren-Fenster (Neueingabe eines Grabes) (`_Toc496520384`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-138` / `edwalt3\EDWHELP\Image138.gif` | 1708 | e) Das Grundfenster (Vorhandene Grabstätte) (`_Toc357929556/_Toc496520385`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-139` / `edwalt3\EDWHELP\Image139.gif` | 1730 | e) Das Grundfenster (Vorhandene Grabstätte) (`_Toc357929556/_Toc496520385`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-140` / `edwalt3\EDWHELP\Image140.gif` | 1735, 1789, 1800, 2178 | f) Das Druckfenster (`_Toc357929557/_Toc496520386`); 8.) Das Druckausgabe-Fenster (`_Toc496520402`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-141` / `edwalt3\EDWHELP\Image141.gif` | 1869 | h) Das Gebührenfenster (Storno) (`_Toc357929559/_Toc496520388`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-142` / `edwalt3\EDWHELP\Image142.gif` | 1913 | i) Das Druckfenster (Gutschrift) (`_Toc357929560/_Toc496520389`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-143` / `edwalt3\EDWHELP\Image143.gif` | 1920 | i) Das Druckfenster (Gutschrift) (`_Toc357929560/_Toc496520389`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-144` / `edwalt3\EDWHELP\Image144.gif` | 1926 | i) Das Druckfenster (Gutschrift) (`_Toc357929560/_Toc496520389`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-145` / `edwalt3\EDWHELP\Image145.gif` | 1982 | A) Die Schaltflächen (`_Toc357929562/_Toc496520392`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-146` / `edwalt3\EDWHELP\Image146.gif` | 1994, 2050 | A) Die Schaltflächen (`_Toc357929562/_Toc496520392`); C) Das "Bearbeiten-Menü" (`_Toc357929564/_Toc496520394`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-147` / `edwalt3\EDWHELP\Image147.gif` | 2005 | B) Das Suchfenster (`_Toc357929563/_Toc496520393`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-148` / `edwalt3\EDWHELP\Image148.gif` | 2043 | C) Das "Bearbeiten-Menü" (`_Toc357929564/_Toc496520394`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-149` / `edwalt3\EDWHELP\Image149.gif` | 2059 | 1.) Friedhof/Feld/Grab-Nummer ändern (`_Toc357929565/_Toc496520395`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-150` / `edwalt3\EDWHELP\Image150.gif` | 2069 | 2.) Nutzungsberechtigten-Adresse kopieren (`_Toc357929566/_Toc496520396`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-151` / `edwalt3\EDWHELP\Image151.gif` | 2073 | 2.) Nutzungsberechtigten-Adresse kopieren (`_Toc357929566/_Toc496520396`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-152` / `edwalt3\EDWHELP\Image152.gif` | 2078 | 3.) Löschen einer kompletten Grabstätte (`_Toc496520397`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-153` / `edwalt3\EDWHELP\Image153.gif` | 2094 | 4.) Das Grab-Zustands-Fenster (`_Toc496520398`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-154` / `edwalt3\EDWHELP\Image154.gif` | 2139 | 5.) Das Grab-Notiz-Fenster (`_Toc496520399`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-155` / `edwalt3\EDWHELP\Image155.gif` | 2147 | 6.) Die 2. und 3. Adresse (`_Toc496520400`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-156` / `edwalt3\EDWHELP\Image156.gif` | 2165 | 7.) Die Personen-Konten-Nummern (`_Toc496520401`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-157` / `edwalt3\EDWHELP\Image157.gif` | 2193, 2638 | 9.) Das FUG -Fenster (Friedhofsunterhaltungsgebühren) (`_Toc496520403`); b) FUG (Friedhofs-Unterhaltungs-Gebühr) (`_Toc354283679/_Toc496520431`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-158` / `edwalt3\EDWHELP\Image158.gif` | 2205 | 10.) Überführungen (`_Toc496520404`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-159` / `edwalt3\EDWHELP\Image159.gif` | 2208 | 10.) Überführungen (`_Toc496520404`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-160` / `edwalt3\EDWHELP\Image160.gif` | 2241 | D) Das Buchen-Menü (`_Toc496520405`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-161` / `edwalt3\EDWHELP\Image161.gif` | 2250 | 3.) Druck eines Einzel-Briefes (`_Toc496520409`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-162` / `edwalt3\EDWHELP\Image162.gif` | 2255 | F) Das Hilfe-Menü (`_Toc496520410`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-163` / `edwalt3\EDWHELP\Image163.gif` | 2294 | Das AUSWERTEN-Menü (`_Toc353688359/_Toc353772096/_Toc357929574/_Toc496520412`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-164` / `edwalt3\EDWHELP\Image164.gif` | 2301 | 1.) Die Gräber Kurzliste (`_Toc353688360/_Toc353772097/_Toc357929575/_Toc496520413`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-165` / `edwalt3\EDWHELP\Image165.gif` | 2317 | 2.) Die Gräber Vorgangs-Liste (`_Toc353688361/_Toc353772098/_Toc357929576/_Toc496520414`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-166` / `edwalt3\EDWHELP\Image166.gif` | 2329 | 3.) Das Grabstätten-Karteiblatt (`_Toc496520415`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-167` / `edwalt3\EDWHELP\Image167.gif` | 2341 | 4.) Liste der belegten/unbelegten Gräber (`_Toc496520416`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-168` / `edwalt3\EDWHELP\Image168.gif` | 2357 | 5.) Nutzungsende-Liste/Nutzungsende-Briefe (`_Toc353688364/_Toc353772101/_Toc357929579/_Toc496520417`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-169` / `edwalt3\EDWHELP\Image169.gif` | 2368 | 6.) Lage-Kurz-Liste (`_Toc496520418`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-170` / `edwalt3\EDWHELP\Image170.gif` | 2382 | 7.) Grabzustands-Liste/Grabzustands-Briefe (`_Toc353688365/_Toc353772102/_Toc357929580/_Toc496520419`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-171` / `edwalt3\EDWHELP\Image171.gif` | 2395 | 8.) SUCH-CODE-Liste (`_Toc496520420`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-172` / `edwalt3\EDWHELP\Image172.gif` | 2410 | 9.) Sonstige, allgemeine Briefe (`_Toc496520421`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-173` / `edwalt3\EDWHELP\Image173.gif` | 2420 | 10.) Das Beerdigungs-Buch (`_Toc353688366/_Toc353772103/_Toc357929581/_Toc496520422`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-174` / `edwalt3\EDWHELP\Image174.gif` | 2434 | 11.) Beerdigungs-Tagesliste (`_Toc496520423`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-175` / `edwalt3\EDWHELP\Image175.gif` | 2449 | 12.) Die Ruhefrist-Ende-Liste (`_Toc353688367/_Toc353772104/_Toc357929582/_Toc496520424`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-176` / `edwalt3\EDWHELP\Image176.gif` | 2517 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-177` / `edwalt3\EDWHELP\Image177.gif` | 2521 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-178` / `edwalt3\EDWHELP\Image178.gif` | 2530 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-179` / `edwalt3\EDWHELP\Image179.gif` | 2538 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-180` / `edwalt3\EDWHELP\Image180.gif` | 2547 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-181` / `edwalt3\EDWHELP\Image181.gif` | 2552 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-182` / `edwalt3\EDWHELP\Image182.gif` | 2560 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-183` / `edwalt3\EDWHELP\Image183.gif` | 2563 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-184` / `edwalt3\EDWHELP\Image184.gif` | 2576 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-185` / `edwalt3\EDWHELP\Image185.gif` | 2586 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-186` / `edwalt3\EDWHELP\Image186.gif` | 2605 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-187` / `edwalt3\EDWHELP\Image187.gif` | 2633 | a) Sonstige Bescheide/Aufträge (`_Toc354283678/_Toc496520430`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-188` / `edwalt3\EDWHELP\Image188.gif` | 2701 | b) FUG (Friedhofs-Unterhaltungs-Gebühr) (`_Toc354283679/_Toc496520431`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-189` / `edwalt3\EDWHELP\Image189.gif` | 2704 | b) FUG (Friedhofs-Unterhaltungs-Gebühr) (`_Toc354283679/_Toc496520431`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-190` / `edwalt3\EDWHELP\Image190.gif` | 2741 | Personen-Konten/Kasse (`_Toc496520433`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDW-191` / `edwalt3\EDWHELP\Image191.gif` | 2779 | (Terminverwaltung) (`_Toc496520435`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |

### Krematorium: 41 GIF-Dateien

| Screenshot-ID / lokale Quelle | HTML-Absatz/Absätze | zugeordnetes Hilfethema | Ergebnis / offene Frage |
|---|---|---|---|
| `IMG-EDK-192` / `edwalt3\EDKHELP\Image192.gif` | 9 | Titel-/Produktgrafik vor dem ersten Themenanker | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-193` / `edwalt3\EDKHELP\Image193.gif` | 98 | Anmeldung und Grundmenü (`_Toc449335474`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-194` / `edwalt3\EDKHELP\Image194.gif` | 122 | Das Grundmenü (`_Toc357929874/_Toc447613053`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-195` / `edwalt3\EDKHELP\Image195.gif` | 132 | a) die Anwender-Stammdaten (`_Toc447613055/_Toc449335476`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-196` / `edwalt3\EDKHELP\Image196.gif` | 175 | a) die Anwender-Stammdaten (`_Toc447613055/_Toc449335476`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-197` / `edwalt3\EDKHELP\Image197.gif` | 218 | b) die Pfadnamen-Verwaltung (`_Toc447613056/_Toc449335477`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-198` / `edwalt3\EDKHELP\Image198.gif` | 432 | d) die Bediener-Stammdaten (`_Toc447613058/_Toc449335478`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-199` / `edwalt3\EDKHELP\Image199.gif` | 504 | f) die Gebühren-Stammdaten (`_Toc447613060/_Toc449335480`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-200` / `edwalt3\EDKHELP\Image200.gif` | 581 | f) die Gebühren-Stammdaten (`_Toc447613060/_Toc449335480`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-201` / `edwalt3\EDKHELP\Image201.gif` | 594 | g) Sonstige Adressen (`_Toc447613061/_Toc449335481`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-202` / `edwalt3\EDKHELP\Image202.gif` | 634 | h) die Auswahl-Stammdaten (`_Toc447613062/_Toc449335482`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-203` / `edwalt3\EDKHELP\Image203.gif` | 650 | i) Formular-Verwaltung mit EDITOR (`_Toc447613063/_Toc449335483`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-204` / `edwalt3\EDKHELP\Image204.gif` | 658 | j) Formular-Verwaltung mit WINWORD (`_Toc447613064/_Toc449335484`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-205` / `edwalt3\EDKHELP\Image205.gif` | 674 | j) Formular-Verwaltung mit WINWORD (`_Toc447613064/_Toc449335484`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-206` / `edwalt3\EDKHELP\Image206.gif` | 999 | j) Formular-Verwaltung mit WINWORD (`_Toc447613064/_Toc449335484`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-207` / `edwalt3\EDKHELP\Image207.gif` | 1025 | a) Das Grundfenster (`_Toc354283682/_Toc402164089/_Toc449335486`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-208` / `edwalt3\EDKHELP\Image208.gif` | 1054 | a) Das Grundfenster (`_Toc354283682/_Toc402164089/_Toc449335486`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-209` / `edwalt3\EDKHELP\Image209.gif` | 1106 | a) Das Grundfenster (`_Toc354283682/_Toc402164089/_Toc449335486`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-210` / `edwalt3\EDKHELP\Image210.gif` | 1115 | a) Das Grundfenster (`_Toc354283682/_Toc402164089/_Toc449335486`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-211` / `edwalt3\EDKHELP\Image211.gif` | 1120 | b) Das Versandfenster (`_Toc449335487`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-212` / `edwalt3\EDKHELP\Image212.gif` | 1161 | c) Das Gebührenfenster (`_Toc354283684/_Toc402164091/_Toc449335488`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-213` / `edwalt3\EDKHELP\Image213.gif` | 1224 | d) Die Druckausgabe (`_Toc354283685/_Toc402164092/_Toc449335489`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-214` / `edwalt3\EDKHELP\Image214.gif` | 1270, 1281 | d) Die Druckausgabe (`_Toc402164095`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-215` / `edwalt3\EDKHELP\Image215.gif` | 1333 | Storno und Gutschrift (`_Toc449335490`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-216` / `edwalt3\EDKHELP\Image216.gif` | 1362 | d) Die Druckausgabe (`_Toc402164098`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-217` / `edwalt3\EDKHELP\Image217.gif` | 1367 | d) Die Druckausgabe (`_Toc402164098`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-218` / `edwalt3\EDKHELP\Image218.gif` | 1380 | d) Die Druckausgabe (`_Toc402164098`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-219` / `edwalt3\EDKHELP\Image219.gif` | 1406 | e) Das Such-Fenster (`_Toc449335492`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-220` / `edwalt3\EDKHELP\Image220.gif` | 1442, 1452 | b) Das Bearbeiten-Menü (`_Toc354283688/_Toc402164100/_Toc449335493`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-221` / `edwalt3\EDKHELP\Image221.gif` | 1461 | Adresse kopieren (`_Toc449335494`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-222` / `edwalt3\EDKHELP\Image222.gif` | 1468 | Löschen eines kompletten Datensatzes (`_Toc354283690/_Toc402164102/_Toc449335495`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-223` / `edwalt3\EDKHELP\Image223.gif` | 1472 | Teil III - Krematorium-Besonderheiten (`_Toc354283691/_Toc402164103`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-224` / `edwalt3\EDKHELP\Image224.gif` | 1476 | Teil III - Krematorium-Besonderheiten (`_Toc354283691/_Toc402164103`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-225` / `edwalt3\EDKHELP\Image225.gif` | 1488, 1489 | Personenkonto-Nummer (`_Toc449335497`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-226` / `edwalt3\EDKHELP\Image226.gif` | 1495 | Zeremonie/Bemerkungen (`_Toc402164105/_Toc449335498`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-227` / `edwalt3\EDKHELP\Image227.gif` | 1500 | Status-Übersicht (`_Toc449335499`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-228` / `edwalt3\EDKHELP\Image228.gif` | 1506 | Status-Übersicht (`_Toc449335499`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-229` / `edwalt3\EDKHELP\Image229.gif` | 1517 | Status-Übersicht (`_Toc449335499`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-230` / `edwalt3\EDKHELP\Image230.gif` | 1543 | Teil IV - Krematorium-Auswertungen (`_Toc449335500`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-231` / `edwalt3\EDKHELP\Image231.gif` | 1571 | Versandpapiere und Gebührenbescheide im Sammeldruck (`_Toc449335506`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
| `IMG-EDK-232` / `edwalt3\EDKHELP\Image232.gif` | 1576 | Versandpapiere und Gebührenbescheide im Sammeldruck (`_Toc449335506`) | lokal visuell geprüft; OFFEN: produktive Versionsgleichheit/Nutzung |
