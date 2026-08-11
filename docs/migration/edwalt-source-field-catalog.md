# EDWALT-Quellfeldkatalog und Satzlayoutrekonstruktion

> **Stand:** 11.08.2026. Dieser Katalog beschreibt die Quelle, nicht das
> Cemaris-Zielmodell. Er ist weder Importspezifikation noch Freigabe zur
> Datenübernahme. Ungeklärte Feldgrenzen und Bedeutungen werden nicht ergänzt
> oder mit Standardwerten belegt.

## Methode, Schutz und Leseregeln

Die Aussagen verbinden die bekannten Micro-Focus-Indexoffsets mit aggregierten
Positionsprofilen der unkomprimierten festen Sätze, maskierten
Schlüsselüberschneidungen, statischen Feldnamen aus den lokalen Programmen und
der Feldreihenfolge aus Hilfe und Masken. Es wurden keine Quellwerte in diesen
Katalog übernommen und keine vollständigen Sätze als Text dekodiert. Text wird
nur dort als Windows-1252-Kandidat bezeichnet, wo Zeichenklassen und lokale
Hilfen dies tragen. `DISPLAY` bezeichnet eine plausible COBOL-Zeichen- oder
Zahlendarstellung, nicht bereits einen freigegebenen Dezimaltyp.

Alle Offsets sind **1-basiert und einschließlich** angegeben. `SP` bedeutet
überwiegend beziehungsweise vollständig mit `0x20` aufgefüllt. Für jedes
Layout decken die Zeilen die feste Satzlänge lückenlos ab. Ein Sammelbereich
steht bewusst für mehrere statisch bekannte Felder, wenn deren einzelne
Bytegrenzen noch nicht belegt sind.

Konfidenz:

- **hoch:** mindestens zwei unabhängige Evidenzarten oder mathematisch exakte
  Übereinstimmung von Schlüssel, Satzlänge und Programmliste;
- **mittel:** technische Struktur ist belegt, die fachliche Unterteilung aber
  nur durch Masken-/Programmnamen gestützt;
- **niedrig:** plausible Kandidaten sind bekannt, eine eindeutige Zuordnung ist
  technisch noch nicht möglich.

Datenschutzklassen: `S` fachlicher Stamm ohne erwartete Personenwerte, `P`
personen- oder fallbeziehbar, `P+` besonders schutzbedürftig beziehungsweise
Freitext, `T` technisch. Ein Status `migrieren` ist vorläufig und bedeutet nur,
dass die Quellinformation migrationsrelevant erscheint; er bestimmt noch kein
Zielfeld.

## Layoutübersicht und Vollständigkeitsnachweis

| Quelldatei | Satzlänge | lückenlos abgegrenzte Zonen | Strukturbeleg |
| --- | ---: | --- | --- |
| `W005` | 1.414 | 1–15 Schlüssel; 16–236 gemeinsamer Stamm; 237–266 Erweiterung; 267–284 gemeinsamer Folgebereich; 285–289 Erweiterung; 290–358 gemeinsamer Folgebereich; 359–1.414 Reserve | Index, Positionen, `W005dm`-Ausrichtung, `STAMM.GS` |
| `W005dm` | 323 | 1–15 Schlüssel; 16–236 Stamm; 237–254 Folgebereich; 255–323 Folgebereich | Index, Positionen, Variantenvergleich |
| `W006`, `W006dm` | 392 | 1–10 Schlüssel; 11–115 drei Bezeichnungsteile; 116–138 Mengeneinheit/Dezimalstellen; 139–194 Gebührenblock; 195–201 Erweiterung; 202–392 Reserve | Index, Positionen, `STAMM.GS` |
| `W020` | 2.693 | 1–26 PK; 27–90 vier Suchcodes; 91–306 Adress-/Suchblock; 307–620 Grab-/Nutzungsblock; 621–1.694 weitere Adressen und Grabzustands-/FUG-Daten; 1.695–2.429 Reserve; 2.430–2.693 Erweiterung | 20 Indexsegmente, Positionen, `EDW.GS`, Hilfe |
| `W021` | 6.265 | 1–28 PK; 29–292 Vorgangs-/Gebühren-/Personen-/Datumsindizes; 293–1.400 Vorgangsdetails; 1.401–5.464 32×127 Positionsblock; 5.465–5.770 Nachlauf; 5.771–6.265 Reserve | 8 Indexsegmente, Periodizität, `EDW.GS`, Hilfe |
| `W023` | 808 | 1–28 PK; 29–127 Zusatzkopf; 128–607 16×30 Hinweise; 608 Kennzeichen; 609–808 Reserve | Index, Periodizität, `MAN-EDW-102`, Positionsprofile |
| `buch` | 27.360 | 1–141 neun Indexbereiche; 142–710 Grundblock; 711–1.878 16×73 Historienstruktur; 1.879–2.348 Legacy-Nachlauf; 2.349–27.360 aktuelle Erweiterung mit 236-Byte-Periodizität | 9 Indexsegmente, `BUCHSCHN.GS`, `BUCHA`, Positionen |
| `BUCHA`, `Buchalt` | 2.348 | gemeinsames Legacy-Layout 1–2.348 wie Präfix von `buch` | identische Indexdefinitionen und Positionsstruktur |
| `W040`, `W040alt` | 13.179 | 1–563 Schlüssel-/Adresskopf; 564–2.645 Grundblock; 2.646–12.305 84×115 Positionsblock; 12.306–13.179 Nachlauf | 11 Indexsegmente, Periodizität, `P026.GS`, Variantenvergleich |

Die Zonensummen ergeben jeweils exakt die feste Satzlänge. Unbekannte Bereiche
sind damit sichtbar erfasst; es gibt keine stillschweigend ausgelassenen Bytes.

## Feldkatalog: Struktur- und Gebührenstämme

| ID | Quelle | Offset | L | Index | Typ / Format | Null-/Leer-/Füllverhalten | fachliche Bedeutung | konkrete Evidenz / Konfidenz | Schlüssel / Beziehung | DS | Datenqualitätsrisiko | vorläufiger Status / Begründung | Validierungsregel | offene Frage |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F005-01 | `W005`, `W005dm` | 1 | 2 | PK 1–10 | DISPLAY-Code | belegt, linksbündige Füllung nicht erforderlich | Anwendernummer | erste Programmlistenposition, Ziffernprofil; hoch | Teil des PK | S/T | Mandantenbedeutung offen | migrieren – zur Quellabgrenzung erforderlich | exakt 2 Byte; nur belegte Codezeichen | Ist die Nummer später fachlich oder nur Quellmandant? |
| F005-02 | beide | 3 | 4 | PK 1–10 | Windows-1252-Code, SP | im Bestand teilweise rechts mit SP gefüllt | Friedhof | Programmliste und Schlüsselgliederung; hoch | zu `W004`/anderen Friedhofscodes erst noch prüfen | S | Padding und Codebreite | migrieren – fachlicher Strukturbezug | getrimmt nicht leer; Originalbytes für Abgleich hashen | Welche Datei ist führend für Bezeichnung und Gültigkeit? |
| F005-03 | beide | 7 | 4 | PK 1–10 | DISPLAY-Zifferncode | belegt | Grabart | Programmliste, Maskenreihenfolge; hoch | zusammengesetzter PK mit F005-01/02 | S | führende Nullen | migrieren – zentraler Grabartenstamm | genau vier Ziffern oder als Fehler ausweisen | Fachliche Gültigkeit/Historisierung? |
| F005-04 | beide | 11 | 5 | Alternativindex 11–15 | Windows-1252-Code, SP | im Bestand vielfach leer | Friedhofsgruppe | Feldname und eigener Index; hoch | nicht eindeutig, Duplikate erlaubt | S | leere Gruppe ist fachlich mehrdeutig | migrieren – sofern befüllt | leer zulassen, ansonsten bytegenau referenzieren | Ist die Gruppe Klassifikation oder Sortierung? |
| F005-05 | beide | 16 | 131 | – | feste Text-/Codegruppe, Windows-1252/SP | stark SP-gefüllt, einzelne Textpositionen variabel | Verwaltungszuordnung, Friedhofsbezeichnung, Kommentar, Verlängerungskennzeichen, Grabbezeichnungen und Haushaltsstellen gemäß Programmliste; Einzelfeldgrenzen OFFEN | geordnete `SCS-W005-*`-Namen plus Zeichenklassen; mittel | mögliche Verweise zu Haushaltsstellen nicht geprüft | S, Kommentar ggf. P | mehrere Felder in Sammelbereich; Kommentar könnte zweckfremd genutzt sein | ungeklärt – wichtige Inhalte, aber noch nicht sicher trennbar | nur als Binärsegment erhalten; keine Gesamttestdekodierung | Exakte Längen der enthaltenen Text- und Codefelder? |
| F005-06 | beide | 147 | 28 | – | DISPLAY-Zahl-/Codegruppe mit Punktuation | befüllt; Variantenwerte weichen bei gemeinsamen Schlüsseln ab | Kapazitäts-, Nutzungs-, Ruhefrist- und/oder Preisparameter aus der folgenden Programmliste; Unterteilung OFFEN | Positionsklassen und DM-Abweichung; mittel für Zahlgruppe, niedrig für Einzelbedeutung | – | S | Dezimalpunkt, Vorzeichen und Währung offen | ungeklärt – nicht vor semantischer Trennung übernehmen | jede Unterspanne gegen zulässige DISPLAY-Maske und DM/aktuell vergleichen | Welche Parameter liegen auf welchen Bytes? |
| F005-07 | beide | 175 | 62 | – | Text-/Code-/Zahlgruppe | in `W005` vollständig SP; in gemeinsamen Präfixen strukturgleich | Folgefelder zu Preisen, Preiskennzeichen, Kostenstellen oder Kumulation; genaue Zuordnung OFFEN | Programmliste und Positionsprofil; niedrig | – | S | aktuell leer, historisch möglicherweise relevant | ungeklärt – späterer Bestand kann Werte enthalten | bei jedem späteren Bestand SP-Quote erneut prüfen; Non-SP stoppt Importfreigabe | Ist der Bereich fachlich obsolet oder nur in diesem Bestand leer? |
| F005-08 | `W005` | 237 | 30 | – | unbekannt/reserviert | vollständig SP | in der aktuellen Variante eingeschobener Bereich | exakte Byteausrichtung gegen `W005dm`; hoch technisch | fehlt in `W005dm` | T/S | Bedeutung der Versionserweiterung offen | nicht migrieren – nur für diesen Bestand nachweislich leer | alle 30 Byte müssen SP sein | Kann der spätere Migrationsbestand hier Werte enthalten? |
| F005-09 | `W005` | 267 | 17 | – | DISPLAY-Gruppe plus 1 Codebyte | befüllt; entspricht `W005dm` 237–254 | gemeinsamer später Stammblock, wahrscheinlich Preis-/Kumulations-/Währungsnähe; Einzelbedeutung OFFEN | 14 schlüsselgleiche Sätze positionsweise ausgerichtet; mittel | Variantenabbildung | S | numerische Interpretation offen | ungeklärt | vor Übernahme DM-/Aktuellformat und Feldgrenzen belegen | Welche Programmlistenfelder bilden 17+1 Byte? |
| F005-10 | `W005` | 285 | 5 | – | unbekannt/reserviert | vollständig SP | zweite eingeschobene aktuelle Erweiterung | Variantenalignment; hoch technisch | fehlt in `W005dm` | T | spätere Belegung möglich | nicht migrieren – aktueller Bestand leer | alle fünf Byte SP | Zweck der Erweiterung? |
| F005-11 | `W005` | 290 | 69 | – | überwiegend DISPLAY-Zifferngruppe | im Bestand mit Ziffern/Füllwerten belegt | später Stammblock; Kandidaten sind Kumulations-, Währungs-, Satzungs- und Steuerfelder, Grenzen OFFEN | Programmliste und Alignment zu `W005dm` 255–323; mittel | Variantenabbildung | S | Nullwerte können fachlich oder Initialfüllung sein | ungeklärt | feldweise Maske erst nach Grenzbeleg anwenden | Welche Teile sind fachlich und welche Initialwerte? |
| F005-12 | `W005` | 359 | 1.056 | – | unbekannt/reserviert | vollständig SP in allen 18 Sätzen | Satzreserve | lückenloses Positionsprofil; hoch | – | T | Versionsreserve | nicht migrieren – nachweislich leer | vollständige SP-Prüfung, sonst Analyseabbruch | Im späteren Bestand ebenfalls leer? |
| F005dm-08 | `W005dm` | 237 | 17 | – | DISPLAY-Gruppe plus 1 Codebyte | befüllt | Gegenstück zu `W005` 267–284 | positionsweises Alignment; hoch technisch | Variantenabbildung | S | DM-/Währungssemantik offen | ungeklärt | nur gemeinsam mit F005-09 interpretieren | Ist `dm` tatsächlich die DM-era Variante? |
| F005dm-09 | `W005dm` | 255 | 69 | – | überwiegend DISPLAY-Zifferngruppe | befüllt | Gegenstück zu `W005` 290–358 | positionsweises Alignment; hoch technisch | Variantenabbildung | S | Historien-/Währungsbedeutung offen | ungeklärt | nur gemeinsam mit F005-11 interpretieren | Vorrang oder Historiennutzen? |
| F006-01 | `W006`, `W006dm` | 1 | 2 | PK 1–10 | DISPLAY-Code | belegt | Anwendernummer | Programmliste und Ziffernprofil; hoch | Teil des PK | S/T | Mandantenbedeutung | migrieren – Quellabgrenzung | zwei Codebytes | fachlich oder technisch? |
| F006-02 | beide | 3 | 4 | PK 1–10 | Windows-1252-Code, SP | teilweise rechts SP | Friedhof | Programmliste; hoch | Teil des PK | S | Padding | migrieren | nicht leer, referenzielle Prüfung gegen Friedhofsstamm | führender Friedhofsstamm? |
| F006-03 | beide | 7 | 4 | PK 1–10 | DISPLAY-Zifferncode | belegt | Gebührennummer | Programmliste; hoch | zusammengesetzter PK | S | führende Nullen | migrieren – Gebührenpositionen benötigen die Referenz | exakt vier Ziffern, keine numerische Normalisierung ohne Freigabe | Gültigkeitszeitraum? |
| F006-04 | beide | 11 | 35 | – | Windows-1252-Text, SP | variabel, rechts gefüllt | Bescheidtext 1 | drei aufeinanderfolgende Programmlistenfelder und 105-Byte-Gesamtzone; mittel-hoch | – | S | Textkürzung/Zeichensatz | migrieren – Gebührenbezeichnung | CP1252 nur für diese Spanne; Trim-Regel separat festlegen | Sind die drei Zeilen gemeinsam oder getrennt fachlich? |
| F006-05 | beide | 46 | 35 | – | Windows-1252-Text, SP | variabel | Bescheidtext 2 | wie F006-04; mittel-hoch | – | S | wie oben | migrieren | wie oben | siehe F006-04 |
| F006-06 | beide | 81 | 35 | – | Windows-1252-Text, SP | variabel/teilweise ziffernartig | Bescheidtext 3 | wie F006-04; mittel-hoch | – | S | möglicher Code statt Freitext in Teilbestand | migrieren | Zeichenklasse je Satz prüfen, nicht als Zahl casten | Werden Steuer-/Rechtsangaben in Zeile 3 gespeichert? |
| F006-07 | beide | 116 | 20 | – | Windows-1252-Text, SP | variabel | Mengeneinheit | Programmliste und Textprofil; hoch | – | S | freie Schreibweisen | migrieren | definierte Länge, CP1252, kontrollierte spätere Normalisierung | Welche Einheiten sind fachlich gleich? |
| F006-08 | beide | 136 | 3 | – | DISPLAY-Ziffern | `W006`: 9 SP, 17 ziffernartig; `W006dm`: 10 SP, 325 ziffernartig | statisch „Nachkommastellen“, technische Kodierung aber OFFEN | Programmliste und Ziffernprofil; hoch für Feldname/Typ, niedrig für Wertebedeutung | soll Zahleninterpretation steuern | S | sämtliche 342 nichtleeren Werte liegen außerhalb eines direkten Skalenwerts 0–4 und sind auch kein getesteter Teiler 1/10/100 | migrieren nur zusammen mit bestätigter Zahlenkodierung | nicht als Anzahl Dezimalstellen casten; zulässige Kodierung fachlich/statisch belegen | Kodierter Faktor, Maske oder tatsächlich Nachkommastellen? Gilt es für Menge, Preis oder beide? |
| F006-09 | beide | 139 | 56 | – | gemischter DISPLAY-Gebührenblock | 139–146: 9/10 leere aktuelle/DM-Sätze; 147–165 bei 25/333 Sätzen leer; 166–193 durchgehend ziffernartig | Gebühr, Haushaltsstelle, Kostenstelle, Preis-/MwSt-/Netto-/Kumulationswerte und Kennzeichen in Programmlistenreihenfolge; Einzelgrenzen OFFEN | `SCS-W006-*`, Zeichenklassen und Variantenvergleich; mittel | 124 geprüfte Positions-/Gebührenreferenzhypothesen liefern keinen Treffer | S | Dezimalstellen, Vorzeichen, Brutto/Netto und Währung offen; Nullfüllung nicht mit fachlicher Null verwechseln | ungeklärt – Beträge erst nach exakter Trennung migrieren | Unterfelder gegen belegte Masken und nichtleere Rechenbeispiele prüfen; keine stillen Nullen | Exakte Breiten und Rundungsregel? |
| F006-10 | beide | 195 | 7 | – | aktuelle DISPLAY-Erweiterung / in `W006dm` SP | `W006` in allen 26 Sätzen ziffernartig und nullwertartig; `W006dm` vollständig SP | spätes Kennzeichen-/Währungs-/Versionsfeld; genaue Bedeutung OFFEN | Variantenprofil; hoch technisch/niedrig fachlich | – | S/T | DM-/Euro-Deutung nicht bewiesen; im aktuellen Bestand nur Initialwert erkennbar | ungeklärt | gemeinsame Schlüssel positionsweise und gegen statische Masken prüfen | Ist dies Währung, Gebührenkennzeichen oder eine Erweiterung? |
| F006-11 | beide | 202 | 191 | – | unbekannt/reserviert | vollständig SP in beiden Beständen | Satzreserve | Positionsprofil; hoch | – | T | spätere Version kann belegen | nicht migrieren – im untersuchten Bestand leer | alle Bytes SP, sonst Analyseabbruch | Im späteren Bestand ebenfalls leer? |

## Feldkatalog: Grab, Vorgang, Beisetzung und Zusatzdaten

| ID | Quelle | Offset | L | Index | Typ / Format | Null-/Leer-/Füllverhalten | fachliche Bedeutung | konkrete Evidenz / Konfidenz | Schlüssel / Beziehung | DS | Datenqualitätsrisiko | vorläufiger Status / Begründung | Validierungsregel | offene Frage |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F020-01 | `W020` | 1 | 2 | PK 1–26 | fester Quellcode | belegt; ein vollständiger PK ist leer | Anwendernummer | `D-W020-ANWENDERNR`, gleiche Schlüsselgliederung wie `W021/W022`; hoch | PK-Teil | P/T | leerer PK-Sonderfall | migrieren – Quellidentität, leerer Satz separat sperren | zwei Bytes; leerer Gesamt-PK in Fehlerliste ohne Wert | Ursache des leeren PK? |
| F020-02 | `W020` | 3 | 4 | PK | Windows-1252-Code, SP | belegt | Friedhof | Programmliste; hoch | PK-Teil, Beziehung zu `W021/W022` | P | Padding | migrieren | Quellbytes referenziell vergleichen | führender Friedhofscode? |
| F020-03 | `W020` | 7 | 20 | PK | Windows-1252-Code, SP | variable Länge, rechts gefüllt | Feld-/Grabnummer | Programmliste, Hilfe, 26-Byte-Schlüsselgleichheit; hoch | Elternschlüssel zu `W021`, Schlüssel zu `W022` | P | Formatvarianten, Umnummerierung | migrieren – zentraler Fallbezug | nicht normalisiert verknüpfen; gültigen Nachfolger erst fachlich bestimmen | Wie sind aufgehobene/umbenannte Nummern markiert? |
| F020-04 | `W020` | 27 | 64 | vier Alternativindizes à 16 Byte; jeweils zusätzlich Teilindex ab +4/L12 | Windows-1252-Suchcodes | variabel, SP | Suchcode 1–4 | exakte wiederholte Indexstruktur und Programmnamen; hoch | Suche, keine bestätigten Fremdschlüssel | P | abgeleitete/alte Suchwerte, Dubletten | ungeklärt – nur übernehmen, wenn fachlicher Suchnutzen bestätigt | 4×16 Byte erhalten; keine Personenzusammenführung | Welche Suchcodes sind abgeleitet oder historisch? |
| F020-05 | `W020` | 91 | 216 | Indizes 91/L34, 95/L30, 125/L8, 129/L4, 206/L12, 210/L8 | Windows-1252-/DISPLAY-Adress- und Suchgruppe | variabel, SP | erste nutzungsberechtigte/empfangende Person: Namen, Anrede, Titel, Anschrift und Such-/Datumsanteile; Einzelfeldgrenzen OFFEN | geordnete `D-W020-*1`-Felder, überlappende Indizes, Hilfe; mittel | Personen-/Adresssuche; Offset 210 ist gültiger `yyyyMMdd`-Kandidat in 2.473 Sätzen | P | Rollenwechsel, Mehrfachadressen, Datum fachlich unbenannt | ungeklärt – migrationsrelevant, aber nicht als fertige Person importieren | Text nur feldweise; Offset 210/L8 separat als Datumskandidat validieren | Exakte Breiten, Rolle der Person und Bedeutung des Datums? |
| F020-06 | `W020` | 307 | 305 | Index 307/L50 | gemischte Text-/DISPLAY-Gruppe | variabel, SP | Grabname/-art/-texte, Stellen/Kapazitäten, Nutzungsbeginn und Nutzungsrecht, erste Rechte und Hinweise gemäß Programmliste | Programmreihenfolge, Hilfe, Index; mittel | Grab-/Nutzungsrechtskern | P | mehrere Datums-/Zahltypen, historische Rechte | ungeklärt – hoher Migrationswert, Grenzen noch offen | Unterfelder anhand Masken und Datums-/Zahlenprofilen isolieren | Wo beginnen/endigen Nutzungsrechts- und Grabartfelder? |
| F020-07 | `W020` | 612 | 9 | Index 612/L9 | DISPLAY-/Codekandidat | befüllt | indexiertes Grab-/Nutzungsmerkmal, fachlich noch nicht benannt | Index und Positionsprofil; niedrig fachlich | Suchindex | P | falsche Benennung würde Selektion verfälschen | ungeklärt | als 9-Byte-Hash vergleichen, nicht numerisch umformen | Welches Programmlistenfeld ist indexiert? |
| F020-08 | `W020` | 621 | 820 | – | gemischte Text-/DISPLAY-Gruppe | variabel, SP | Kennzeichen, Empfänger 2/3, weitere Adressen sowie Grabmal-, Einfassungs- und FUG-Verwaltungsdaten; Einzelfeldgrenzen OFFEN | geordnete Programmliste und Hilfe; mittel | interne Rollen/Unterobjekte, keine bestätigten FKs | P/P+ | Bank-/Einzugsangaben, historische Zustände und Freitext vermischt | ungeklärt – Feldgruppen einzeln bewerten | keine Pauschaldekodierung; Bank-/Freitextkandidaten besonders schützen | Welche FUG-/Grabmalfelder werden noch benötigt und aufbewahrt? |
| F020-09 | `W020` | 1.441 | 84 | überlappende Indizes 1441/L84 und 1445/L80 | Windows-1252-Such-/Adressverbund | variabel | weiterer Such-/Adressschlüssel | Indexpaar und Programmliste; mittel | vermutlich Empfänger-/Adresssuche | P | möglicherweise abgeleitet, nicht eindeutig | ungeklärt | Bytebeziehung zu Adressrollen nur gehasht prüfen | Welche Adressrolle? |
| F020-10 | `W020` | 1.525 | 160 | – | gemischte Fachgruppe | variabel/SP | später Grabzustands-/FUG-/Verwaltungsblock | Programmlistenrest und aktive Positionen; niedrig-mittel | – | P/P+ | sensible Bank-/Einzugs- oder Hinweisfelder möglich | ungeklärt | binär erhalten; Teilfelder vor Dekodierung belegen | Exakte Zuordnung? |
| F020-11 | `W020` | 1.685 | 9 | Index 1685/L9 | DISPLAY-Code/Datumskandidat | befüllt | spätes indexiertes Verwaltungsmerkmal | Index und Ziffernprofil; niedrig fachlich | Suchindex | P/T | kann Status, Nummer oder Datum sein | ungeklärt | nur definierte 9-Byte-Maske nach Feldbeleg | Welches Feld? |
| F020-12 | `W020` | 1.694 | 1 | – | DISPLAY-Kennzeichenkandidat | befüllt | spätes Kennzeichen | Positionsprofil; niedrig | – | P/T | Codebedeutung unbekannt | ungeklärt | zulässige Zeichen aggregiert ermitteln | fachliche Bedeutung? |
| F020-13 | `W020` | 1.695 | 735 | – | unbekannt/reserviert | vollständig SP | Satzreserve | Positionsprofil; hoch | – | T | Versionsreserve | nicht migrieren – im Bestand leer | vollständige SP-Prüfung | im späteren Bestand leer? |
| F020-14 | `W020` | 2.430 | 264 | – | gemischte späte Erweiterung | variabel; enthält auch 257 Nullbytes und einzelne Steuerbytes im Gesamtsatz | Kandidaten aus Programmlistenende: Erfassungs-/Änderungsdaten, Überführung und technische Felder; Grenzen OFFEN | aktive Positionsprofile und spätere `D-W020-*`-Namen; niedrig-mittel | – | P/T | Null-/Steuerbytes verbieten Pauschaltext; technischer und fachlicher Inhalt vermischt | ungeklärt | byteweise Typisierung; keine CP1252-Dekodierung des Gesamtbereichs | Exakte Erweiterungsdefinition? |
| F021-01 | `W021` | 1 | 2 | PK 1–28 | DISPLAY-Code | belegt | Anwendernummer | Programmliste; hoch | PK-Teil | P/T | – | migrieren | zwei Codebytes | fachlich oder technisch? |
| F021-02 | `W021` | 3 | 4 | PK | Windows-1252-Code, SP | belegt | Friedhof | Programmliste; hoch | PK-Präfix zu `W020` | P | Padding | migrieren | exakter Bytevergleich | führender Friedhof? |
| F021-03 | `W021` | 7 | 20 | PK | Windows-1252-Code, SP | variabel | Feld-/Grabnummer | Programmliste und Beziehung; hoch | PK-Präfix zu `W020` | P | Umnummerierung | migrieren | 26-Byte-Präfix muss gegen `W020` geprüft werden | gültiger Nachfolger? |
| F021-04 | `W021` | 27 | 2 | PK | DISPLAY-Zifferncode | belegt | Vorgangsnummer | Programmliste; hoch | vervollständigt PK; gleicher PK in `W023/DRAUF` | P | lokale Nummernkreise | migrieren | zwei Ziffern, Eindeutigkeit im Grab | fachliche Vorgangsart separat? |
| F021-05 | `W021` | 29 | 47 | – | gemischte DISPLAY-/Codegruppe | variabel/SP | Nutzungszeitraum, Jahre, Empfänger, Vorgangsbezeichnung/-kennzeichen und erste Gebührenangaben; Grenzen OFFEN | Programmlistenreihenfolge; mittel | – | P | Datum/Betrag/Code vermischt | ungeklärt | Teilfelder erst nach Maskenbeleg typisieren | Exakte Feldbreiten? |
| F021-06 | `W021` | 76 | 14 | Index 76/L14 | fester Code | befüllt | Kassenzeichen-Kandidat | Lage in Programmliste und Indexlänge; mittel-hoch | möglicher Bescheid-/Finanzbezug | P | Nummernformat und führendes System | migrieren – falls als Fall-/Bescheidbezug bestätigt | exakt 14 Byte, nur gehasht korrelieren | Ist es immer das Kassenzeichen? |
| F021-07 | `W021` | 90 | 54 | – | gemischte Gebühren-/Vorgangsgruppe | variabel/SP | Gebührenkennzeichen, Beträge, Rechnungskreis sowie Vorverstorben-/Vorgangskennzeichen | Programmlistenreihenfolge; mittel | – | P | Finanz- und Statussemantik offen | ungeklärt | Betragsfelder nicht vor Dezimalbeleg rechnen | Welche Felder gehören zum zu migrierenden Bescheidumfang? |
| F021-08 | `W021` | 144 | 64 | Indizes 144/L64 und 148/L60 | Windows-1252-Suchverbund | variabel, SP | Verstorbener: Namens-/Suchcodeverbund | Feldreihenfolge, Indexpaar, 520 Hashüberschneidungen mit `buch` 49/L60; mittel-hoch | Personensuche, kein FK-Beweis | P+ | Namensdubletten, abgeleiteter Suchcode | migrieren – Personendaten relevant, keine automatische Zusammenführung | 64 Byte strukturell erhalten; Teilfelder einzeln dekodieren | genaue Aufteilung von Name/Vorname/Suchcode? |
| F021-09 | `W021` | 208 | 12 | Index 208/L12 | Datums-/Suchcodeverbund | variabel | Trauerfeier-/Beisetzungsnahes Suchmerkmal, genaue Bedeutung OFFEN | Programmlistenposition und Index; mittel technisch | Suchindex | P+ | unvollständige Datumsangaben möglich | ungeklärt | Masken `yyyyMMdd`, `ddMMyyyy` und Teilkomponenten aggregiert testen | Welches Ereignis? |
| F021-10 | `W021` | 220 | 12 | Index 220/L12 | Datums-/Suchcodeverbund | variabel | weiteres Ereignis-/Personensuchmerkmal | Programmlistenposition und Index; mittel technisch | Suchindex | P+ | wie oben | ungeklärt | wie F021-09 | Welches Ereignis? |
| F021-11 | `W021` | 232 | 8 | Index 232/L8 | DISPLAY-Datumskandidat `yyyyMMdd` | 4.422 formatgültige Kandidaten | Ereignisdatum, genaue Rolle OFFEN | Formatprofil, Index, Programmliste; hoch technisch/mittel fachlich | 307 Hashüberschneidungen mit `buch`-Datum sind ergänzende, keine relationale Evidenz | P+ | Null-/Scheindaten und Ereignisverwechslung | ungeklärt | kalendergültig oder definierter Leerwert; keine automatische Benennung | Beisetzung, Trauerfeier oder anderes Datum? |
| F021-12 | `W021` | 240 | 45 | – | Text-/Codegruppe | variabel/SP | Ort-/Hinweis-/Ruhefrist- oder Sterbedaten aus der folgenden Feldreihenfolge | Programmliste und Positionsprofile; niedrig-mittel | – | P+ | besonders sensible Sterbe-/Religionsangaben | ungeklärt | Teilfelder separat schützen und validieren | Exakte Grenzen? |
| F021-13 | `W021` | 285 | 8 | Index 285/L8 | DISPLAY-Datumskandidat `ddMMyyyy` | 4.369 formatgültige Kandidaten | weiteres Ereignisdatum, Rolle OFFEN | Formatprofil und Index; hoch technisch/mittel fachlich | Suchindex | P+ | Format unterscheidet sich vom Kandidaten 232 | ungeklärt | kalendergültig nach `ddMMyyyy`, Leerwerte separat | Welches Ereignis und warum anderes Format? |
| F021-14 | `W021` | 293 | 1.108 | – | gemischte Text-/DISPLAY-Gruppe | variabel/SP | Verstorbene, Geburt/Sterben, Beisetzung, Lage, Hinweise, Bestatter/Pfarrer/Konfession, Fälligkeit und Überführungsdaten gemäß Programmliste; Einzelfeldgrenzen OFFEN | umfangreiche geordnete `D-W021-*`-Liste und Hilfe; mittel | – | P+ | hochsensible und freie Felder; technische Druckdaten können enthalten sein | ungeklärt – fachlich wichtig, aber zwingend feldweise | nur belegte Textspannen dekodieren; Freitext und Religion separat minimieren | Welche Felder sind erforderlich, aufbewahrungspflichtig oder auszuschließen? |
| F021-15 | `W021` | 1.401 | 4.064 | – | 32 Wiederholungen à 127 Byte; je Block 8/64/4/20/15/16 Byte | alle 454.752 Blockinstanzen sind als Ganzes nullwertartig; 8-, 4- und 15-Byte-Zonen enthalten nur Ziffernnullen/SP, die übrigen Zonen ausschließlich SP | statische Struktur für zusätzliche Gebühren-/Buchungspositionen; Einzelfeldsemantik mangels belegter Position im Bestand OFFEN | exakte 127-Byte-Periodizität und `SCS-TAB5-*`; hoch strukturell, fachlich nicht am Bestand validierbar | 26 geprüfte Gebührenreferenzhypothesen ohne Treffer; kein nicht-nullwertiger Gebührenkandidat | P | Initialnullen dürfen nicht als echte Positionen/Beträge importiert werden | ungeklärt – fachlich im Scope, aus diesem Bestand keine Position | Struktur für spätere Bestände berücksichtigen; keine Initialnullposition erzeugen | Ein nichtleerer Referenzbestand oder Copybook fehlt; welche statischen Begriffe liegen auf welchen Unterbytes? |
| F021-16 | `W021` | 5.465 | 306 | – | gemischter Nachlauf | teils befüllt, teils SP | Erwerb/Einlieferung/Überführung sowie Druck-, Formular- und Steuerfelder aus Programmlistenende; Grenzen OFFEN | Programmnamen und aktive Positionen; mittel | – | P/T | fachliche Überführungsdaten und technische Ausgabeparameter vermischt | ungeklärt | Druck-/Laser-/Formularfelder nach Lokalisierung ausschließen; Fachfelder separat prüfen | Exakte Grenze zwischen Fach- und Druckdaten? |
| F021-17 | `W021` | 5.771 | 495 | – | unbekannt/reserviert | vollständig SP | Satzreserve | Positionsprofil; hoch | – | T | Versionsreserve | nicht migrieren | vollständige SP-Prüfung | im späteren Bestand leer? |
| F023-01 | `W023` | 1 | 2 | PK 1–28 | DISPLAY-Code | belegt | Anwendernummer | gleiche Programmlogik wie `W021`; hoch | PK-Teil | P/T | – | migrieren | exakter Vergleich | – |
| F023-02 | `W023` | 3 | 4 | PK | Windows-1252-Code, SP | belegt | Friedhof | PK-Ausrichtung; hoch | PK-Teil | P | Padding | migrieren | exakter Vergleich | – |
| F023-03 | `W023` | 7 | 20 | PK | Windows-1252-Code, SP | variabel | Feld-/Grabnummer | PK-Ausrichtung; hoch | PK-Präfix zu `W021` | P | Umnummerierung | migrieren | exakter Vergleich | – |
| F023-04 | `W023` | 27 | 2 | PK | DISPLAY-Zifferncode | belegt | Vorgangsnummer | PK-Ausrichtung; hoch | vollständiger PK zu `W021` | P | drei verwaiste Zusatzsätze | migrieren | Referenz zu `W021`; Verwaiste separat ausweisen | Ursache der drei verwaisten Sätze? |
| F023-05 | `W023` | 29 | 29 | – | gemischter Text-/DISPLAY-Kopf | variabel | Nummer, Pfarrer-/Konfessions- oder Melde-/Änderungsangabe; Einzelfeldgrenze OFFEN | Hilfe nennt diese Kopfgruppen, Positionsprofil; niedrig-mittel | – | P+ | Religionsbezug und freie Nutzung möglich | ungeklärt | nicht pauschal als Text ausgeben | genaue Feldbedeutung? |
| F023-06 | `W023` | 58 | 4 | – | unbekannt/reserviert | vollständig SP | Füllbereich | Positionsprofil; hoch | – | T | Versionsfüllung | nicht migrieren | SP-Prüfung | – |
| F023-07 | `W023` | 62 | 24 | – | Windows-1252-/DISPLAY-Gruppe | variabel | weitere Kopfangabe zu Pfarrer, Konfession, Meldung oder Änderung; Zuordnung OFFEN | Hilfe und Positionsprofil; niedrig-mittel | – | P+ | sensible Semantik | ungeklärt | Zeichenklasse feldweise prüfen | genaue Bedeutung? |
| F023-08 | `W023` | 86 | 42 | – | unbekannt/reserviert | vollständig SP | Füllbereich | Positionsprofil; hoch | – | T | spätere Belegung möglich | nicht migrieren | SP-Prüfung | – |
| F023-09 | `W023` | 128 | 480 | – | 16 feste Windows-1252-Felder à 30 Byte | einzelne Felder vollständig leer, andere variabel; SP | 16 freie Hinweise aus „Sonstige Verstorbenendaten“ | exakte 16×30-Abdeckung, Hilfe `MAN-EDW-102`, Positionsperiodizität; hoch strukturell | zu `W021` über PK | P+ | Freitext, Zweckbindung und Datenminimierung unklar | ungeklärt – nicht automatisch migrieren | Inhalte nie protokollieren; Belegung nur zählen; jedes Feld getrennt freigeben | Welche der 16 Angaben haben Rechtsgrundlage und Migrationsnutzen? |
| F023-10 | `W023` | 608 | 1 | – | DISPLAY-Kennzeichen | ziffernartig | spätes Zusatzkennzeichen | Positionsprofil; niedrig | – | P/T | Codebedeutung unbekannt | ungeklärt | erlaubte Codeklassen aggregiert bestimmen | Bedeutung? |
| F023-11 | `W023` | 609 | 200 | – | unbekannt/reserviert | vollständig SP | Satzreserve | Positionsprofil; hoch | – | T | Versionsreserve | nicht migrieren | vollständige SP-Prüfung | im späteren Bestand leer? |

### Technische Bestätigung zu `W022`

`W022` hat exakt 2.026 Byte: Anwendernummer 1–2, Friedhof 3–6,
Feld-/Grabnummer 7–26 und Notiz 27–2.026. Die statische Programmliste enthält
neben diesen vier Namen kein weiteres Feld; die Längensumme 2+4+20+2.000 deckt
den Satz vollständig. 2.693 der 2.694 Schlüssel kommen in `W020` vor. Damit
geht durch den beschlossenen Ausschluss der Notizen **kein zusätzliches
strukturiertes migrationsnotwendiges Feld** aus `W022` verloren. Der
2.000-Byte-Inhalt wird nicht ausgegeben, nicht dekodiert und vorläufig `nicht
migrieren` gesetzt; der Schlüssel dient nur dem kontrollierten Ausschluss- und
Vollständigkeitsnachweis.

## Feldkatalog: Buchungs-/Bescheidfamilie

| ID | Quelle | Offset | L | Index | Typ / Format | Null-/Leer-/Füllverhalten | fachliche Bedeutung | konkrete Evidenz / Konfidenz | Schlüssel / Beziehung | DS | Datenqualitätsrisiko | vorläufiger Status / Begründung | Validierungsregel | offene Frage |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FBU-01 | `buch`, `BUCHA`, `Buchalt` | 1 | 16 | PK | DISPLAY-/Windows-1252-Code | befüllt | Bescheidnummer/Kassenzeichen | Primärindex und `BUCHSCHN.GS`-Exportreihenfolge; hoch | 602 Überschneidungen `buch`/`BUCHA`, keine mit `Buchalt` | P | Nummernvarianten, Archivdubletten | migrieren – beschlossener Bescheidumfang | 16 Byte als Quellkennung, keine numerische Umformung | Ist es fachlich Bescheidnummer, Kassenzeichen oder zusammengesetzt? |
| FBU-02 | alle | 17 | 24 | Index 2 | Windows-1252-Verbund, SP | variabel | Friedhofs- plus Feld-/Grabbezug | Exportreihenfolge, Index und 54 Überschneidungen zu `W040` 17/L24; mittel-hoch | Fallbezugskandidat | P | zusammengesetzte/verkürzte Nummer | migrieren | bytegenaue Korrelation; erst danach auf F020-02/03 aufteilen | genaue Teilgrenzen? |
| FBU-03 | alle | 41 | 8 | Index 3 | DISPLAY-Datum `yyyyMMdd` | in allen aktiven Sätzen formatgültig | Bescheiddatum | `BUCHSCHN.GS` und Formatprofil; hoch | Datumsindex | P | Scheindaten trotz Formatgültigkeit möglich | migrieren | kalendergültig und fachlich gegen Bescheid prüfen | – |
| FBU-04 | alle | 49 | 60 | Index 4 | Windows-1252-Suchverbund, SP | variabel | Empfänger-/Namens-/Adresssuchcode | Exportfelder, 520 Überschneidungen zu `W021` 148/L60 und 95 zu `W040` 79/L60; mittel-hoch | Suchkorrelation, kein stabiler Personen-FK | P | Namensdubletten und abgeleitete Codes | ungeklärt – für Zuordnung nutzbar, nicht als Personenschlüssel | nur gehasht vergleichen; keine automatische Fusion | genaue Zusammensetzung und Stabilität? |
| FBU-05 | alle | 109 | 4 | Index 5 | DISPLAY-Ziffern | befüllt | Haushaltsjahr-Kandidat | Exportreihenfolge und Indexbreite; mittel-hoch | Sortierindex | P | Kalender-/Haushaltsjahr können abweichen | migrieren, wenn fachlich bestätigt | vier Ziffern, plausibler Jahresbereich | Haushaltsjahr oder anderer Code? |
| FBU-06 | alle | 113 | 5 | Index 6 | DISPLAY-Ziffern | befüllt | weiterer Bescheid-/Buchungscode | Index; niedrig fachlich | Sortierindex | P | unbekannter Nummernkreis | ungeklärt | nur als 5-Byte-Code behandeln | Bedeutung? |
| FBU-07 | alle | 118 | 8 | Index 7 | DISPLAY-Ziffern, Datumshypothese widerlegt | in allen 11.955 `buch`-Sätzen `00000000`; Varianten besitzen ebenfalls nur einen Nullwert | mögliche Fälligkeit-/Zahlungs-/Mahndatumsposition, am Bestand nicht belegbar | Index und Nullwertprofil; hoch technisch, fachlich OFFEN | Sortierindex mit nur einem Nullwert | P | Scheindatum darf nicht als Datum übernommen werden | nicht migrieren – im Bestand keine Datumsinformation | Nullwert verwerfen; Fälligkeit in anderen Feldern/Quellen suchen | Welche Rolle war für einen befüllten Bestand vorgesehen? |
| FBU-08 | alle | 126 | 8 | Index 8 | DISPLAY-Ziffern, Datumshypothese widerlegt | wie FBU-07 vollständig `00000000` | weiteres technisch vorgesehenes Buchungsdatum | Index und Nullwertprofil; hoch technisch | Sortierindex ohne Nutzinformation | P | Rollenverwechslung | nicht als Datum migrieren | Nullwert explizit verwerfen, keine Datumskonvertierung | Welche Rolle war vorgesehen? |
| FBU-09 | alle | 134 | 8 | Index 9 | DISPLAY-Ziffern, Datumshypothese widerlegt | wie FBU-07 vollständig `00000000` | weiteres technisch vorgesehenes Buchungsdatum | Index und Nullwertprofil; hoch technisch | Sortierindex ohne Nutzinformation | P | Rollenverwechslung | nicht als Datum migrieren | Nullwert explizit verwerfen | Welche Rolle war vorgesehen? |
| FBU-10 | alle | 142 | 569 | – | gemischter Bescheid-/Empfänger-/Finanzblock | variabel/SP | Bescheidbetrag, Betreff, Empfängeranschrift, Fälligkeit und weitere Grunddaten; Einzelfeldgrenzen OFFEN | BUCH-/Exportsstrings und Positionsprofil; mittel | – | P | Zahlungs-/Bescheidfelder vermischt | ungeklärt – beschlossene Bescheidfelder müssen einzeln lokalisiert werden | Betragssummen, Datumsrollen und Adressspannen getrennt validieren | Exakte Offsets von Betrag, Fälligkeit, Betreff und Fallbezug? |
| FBU-11 | alle | 711 | 1.168 | – | 16 Wiederholungen à 73 Byte; je 8 Byte Ziffernkennung plus 65 Byte Nutzdaten | in `BUCHA/Buchalt` vollständig nullwertartig; in `buch` sind nur 43 erste Blöcke nicht nullwertartig, Blöcke 2–16 vollständig initialisiert | Legacy-Historien-/Folgeblock; genaue Semantik OFFEN | exakte 73-Byte-Periodizität und Blockprofil; hoch strukturell, niedrig fachlich | – | P | die ausführliche statische `BUCH-TAB-*`-Liste passt wahrscheinlicher zur 236-Byte-Erweiterung und darf nicht ungeprüft auf 73 Byte gelegt werden | ungeklärt | Block 1 aggregiert als Auffälligkeit führen; keine Zahlungs-/Mahnfelder daraus importieren | Welche fachlichen Ereignisse enthält ein Block? |
| FBU-12 | alle | 1.879 | 470 | – | gemischter Legacy-Nachlauf | variabel/SP | weitere Legacy-Bescheid-, Adress-, Sperr- oder Druckdaten | Positionsprofil und gemeinsames Layout; niedrig-mittel | – | P/T | fachlich/technisch vermischt | ungeklärt | feldweise Typisierung; keine Gesamttestdekodierung | genaue Feldliste und Relevanz? |
| FBU-13 | nur `buch` | 2.349 | 25.012 | – | 105 vollständige 236-Byte-Perioden plus 232 Byte Rest | Perioden 1–9 besitzen nicht-nullwertige Instanzen, 10–101 nur Initialnullen, 102–105 vollständig SP; der 232-Byte-Rest ist in allen 11.955 Sätzen SP | aktuelle erweiterte Buchungs-/Historienstruktur; genaue Feldsemantik OFFEN | bei 236 Byte 97,5 % mittlere Dominanz der positionsgleichen Byteklasse und 108/236 Phasen ≥99 %; Vergleichsperioden 73/115/127 nur 57,4 %; hoch technisch | – | P/T | statische 24-Feld-`BUCH-TAB-*`-Reihenfolge ist belegt, eine aus Maskenbreiten gebildete 236-Byte-Zuordnung widerspricht aber den beobachteten Byteklassen und ist verworfen | ungeklärt; Rest 27.129–27.360 in diesem Bestand nicht migrieren | 236-Byte-Blöcke erhalten; nur nach belegter Ausrichtung einzelne Bescheidfelder nutzen | Welcher interne Vorsatz oder welche Verschiebung verbindet `BUCH-TAB-*` mit der Periode? |

## Feldkatalog: `W040` und `W040alt`

| ID | Quelle | Offset | L | Index | Typ / Format | Null-/Leer-/Füllverhalten | fachliche Bedeutung | konkrete Evidenz / Konfidenz | Schlüssel / Beziehung | DS | Datenqualitätsrisiko | vorläufiger Status / Begründung | Validierungsregel | offene Frage |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F040-01 | `W040`, `W040alt` | 1 | 16 | PK | DISPLAY-/Windows-1252-Code | befüllt | Anwendernummer plus Auftrags-/Bescheidnummer | `D-W040-ANWENDERNR/AUFTRAGSNUMMER`, Index; hoch | alle 59 Alt-PK in `W040` | P | aktuelle und Alt-Fassung können abweichen | migrieren – Quellidentität | Quellschlüssel unverändert halten; Variantenentscheidung separat | genaue Teilgrenze nach Anwendernummer? |
| F040-02 | beide | 17 | 24 | Index 2 | Windows-1252-Verbund, SP | variabel | Friedhofs-/Feld-/Grabbezug | Programmliste und 54 Überschneidungen zu `buch`; mittel-hoch | Fallbezugskandidat | P | zusammengesetzte Referenz | migrieren | bytegenaue Korrelation zu `buch/W020` | genaue Teilgrenzen? |
| F040-03 | beide | 41 | 18 | überlappende Indizes 41/L18 und 45/L14 | Such-/Codeverbund | variabel/SP | Suchcode/Empfänger- oder Kassenzeichenverbund | Indexpaar und Programmliste; mittel | Suchindex | P | abgeleitete Werte | ungeklärt | 18 Byte erhalten, Teilindex separat prüfen | fachliche Bedeutung? |
| F040-04 | beide | 59 | 16 | Indizes 59/L16 und 63/L12 | Suchcodeverbund | variabel/SP | weiterer Suchcode | wiederholtes Indexmuster; mittel | Suchindex | P | abgeleitet | ungeklärt | wie F040-03 | Bedeutung? |
| F040-05 | beide | 75 | 64 | Indizes 75/L64 und 79/L60 | Windows-1252-Suchverbund, SP | variabel | Empfänger-/Namens-/Adresssuchcode | Programmliste, 95 Überschneidungen `buch` 49/L60; mittel-hoch | Suchkorrelation, kein Personen-FK | P | Dubletten | ungeklärt | nur gehasht korrelieren | genaue Zusammensetzung? |
| F040-06 | beide | 139 | 158 | – | Windows-1252-Adress-/Auftragstextgruppe | variabel/SP | Auftragstexte und erste Empfängeranschrift | `P026.GS`-Feldreihenfolge und Profil; mittel | – | P | Freitext und Adresse vermischt | ungeklärt | Teilfelder einzeln dekodieren | genaue Breiten? |
| F040-07 | beide | 297 | 50 | Index 297/L50 | Windows-1252-Such-/Adressfeld | variabel/SP | indexierter Name-/Adressverbund | Index und Programmliste; mittel | Suchindex | P | abgeleitet/uneindeutig | ungeklärt | bytegenaue Suche, keine Fusion | welche Rolle? |
| F040-08 | beide | 347 | 2 | – | DISPLAY-Code | befüllt | kurzes Auftrags-/Adresskennzeichen | Profil; niedrig | – | P/T | Codebedeutung | ungeklärt | Codeklasse aggregiert prüfen | Bedeutung? |
| F040-09 | beide | 349 | 30 | Index 349/L30 | Windows-1252-Feld, SP | variabel | weiteres Namens-/Adressfeld | Index und Programmliste; mittel | Suchindex | P | Rollenbezug offen | ungeklärt | nicht als eindeutige Person behandeln | welches Feld? |
| F040-10 | beide | 379 | 180 | – | gemischte Adress-/Auftragsgruppe | variabel/SP | Friedhof/Grab, Bescheid, Postfach, Hinweise, Auftragsart/-text und Empfängerangaben; Einzelfeldgrenzen OFFEN | Programmliste; mittel | – | P/P+ | Hinweise/Freitext | ungeklärt | Teilfelder isolieren | genaue Grenzen und Relevanz? |
| F040-11 | beide | 559 | 5 | Index 559/L5 | DISPLAY-Code | befüllt | indexiertes Verwaltungsmerkmal | Index; niedrig fachlich | Suchindex | P/T | unbekannter Nummernkreis | ungeklärt | 5-Byte-Code | Bedeutung? |
| F040-12 | beide | 564 | 2.082 | – | gemischter Grundblock | variabel/SP | Erfassung, Debitor/Kennzeichen, Gebührenempfänger, Kassenzeichen, Bescheid-/Fälligkeitsdaten, Gesamtbetrag, RKZ, Text/Notiz, zweite Adresse sowie Drucksteuerung; Grenzen OFFEN | geordnete `D-W040-*`- und `SCS-*`-Strings; mittel | Bescheid-/Fallbezug | P/P+ | Fach-, Finanz-, Notiz- und Druckdaten vermischt | ungeklärt | Notiz-/Druckfelder nach Lokalisierung ausschließen; Betrag/Fälligkeit separat validieren | Exakte Feldgrenzen? |
| F040-13 | beide | 2.646 | 9.660 | – | 84 Wiederholungen à 115 Byte; Teilstruktur 8/30/24/16/8/29 | `W040`: nur Position 27 und 28 je einmal nicht nullwertartig, alle Zahlenzonen Nullfüllung; `W040alt` vollständig nullwertartig | statisch Gebühren-/Bescheidpositionszeilen; Einzelfeldreihenfolge belegt, innere Breiten mangels Nutzwerten OFFEN | exakte Periodizität und `SCS-TAB5-*`; hoch strukturell, fachlich am Bestand nicht validierbar | 98 geprüfte Gebührenreferenzhypothesen ohne Treffer | P | Initialnullen dürfen nicht als echte Positionen/Beträge importiert werden | ungeklärt – fachlich im Scope, aus diesem Bestand keine Finanzposition | statisches Layout für spätere Bestände erhalten; keine Initialnullposition erzeugen | Nichtleerer Referenzbestand oder Copybook fehlt; genaue Breiten von Menge/GKZ/Beträgen/HHSt/RKZ/Kassenzeichen? |
| F040-14 | beide | 12.306 | 874 | – | gemischter Nachlauf | lange SP-Zonen plus DISPLAY-Teilspannen | Ausgabe-/Formular-, Archiv-/Historien- und mögliche Restfelder; genaue Zuordnung OFFEN | Positionsprofil und Druck-/Formularstrings; niedrig-mittel | – | P/T | aktuelle und Altwerte unterscheiden sich | ungeklärt | technische Ausgabeparameter nach Lokalisierung nicht migrieren; Non-SP-Bereiche typisieren | Welche Fachfelder liegen noch im Nachlauf? |

### Explizite Unterfeldtabelle des 127-Byte-Blocks

Für Blocknummer `n = 1..32` ist der absolute Beginn
`1.401 + (n - 1) × 127`. Die folgende Aufteilung ist technisch exakt und deckt
jeden Block lückenlos ab. Weil sämtliche Instanzen nullwertartig sind, ist die
Zuordnung der statisch bekannten Namen innerhalb der drei Finanzzonen nicht
belegt und bleibt bewusst gröber als die Programmliste.

| Relativ | L | absolut in Block 1 | technischer Typ / Belegung | statischer Bedeutungskandidat | Status |
| ---: | ---: | ---: | --- | --- | --- |
| 1 | 8 | 1.401 | DISPLAY-Ziffern; 386.058 zifferngefüllte und 68.694 SP-Instanzen, alle nullwertartig | Gebührreferenz | Struktur `BESTÄTIGT`, Feldrolle `OFFEN` |
| 9 | 64 | 1.409 | vollständig SP | Bezeichnung | Struktur `BESTÄTIGT`, im Bestand ohne Nutzwert |
| 73 | 4 | 1.473 | DISPLAY-Ziffern; 382.478 zifferngefüllte und 72.274 SP-Instanzen, alle nullwertartig | Menge | Struktur `BESTÄTIGT`, Zahlenbedeutung `OFFEN` |
| 77 | 20 | 1.477 | vollständig SP | GKZ, Gesamtbetrag, Haushaltsstelle und/oder RKZ | Untergrenzen `OFFEN` |
| 97 | 15 | 1.497 | DISPLAY-Ziffern/SP; alle nullwertartig | RKZ, Rechnungsdatum und/oder Kassenzeichen | Untergrenzen `OFFEN`; kein gültiges Datum |
| 112 | 16 | 1.512 | vollständig SP | Kassenzeichen/Füllfelder | fachliche Aufteilung `OFFEN` |

Die Summe ist `8 + 64 + 4 + 20 + 15 + 16 = 127`. Kein Blockordinal enthält
einen nicht-nullwertigen Nutzsatz. Die geordnete statische Liste lautet
Gebühr, Bezeichnung, Menge, GKZ, Gesamtbetrag, Haushaltsstelle, RKZ,
Rechnungsdatum, Kassenzeichen und Füllfelder; sie beweist ohne nichtleere Daten
oder Copybook keine zusätzliche Bytegrenze.

Für alle sechs Zeilen gilt ergänzend: kein eigener Index; Datenschutzklasse
`P`; Beziehungskandidat zu `W006` ohne Treffer; Evidenz aus aggregiertem
Null-/Byteklassenprofil plus `EDW.GS`; hohe Struktur-, aber niedrige
Fachkonfidenz. Status ist jeweils `ungeklärt` und im untersuchten Bestand
`nicht migrieren`, weil ausschließlich Initialwerte vorliegen. Validierungsregel
für einen späteren Bestand: Blockbelegung zuerst über einen nicht-nullwertigen
Gebühr-/Betragsteil feststellen, danach Referenz und Format je Unterfeld prüfen;
andernfalls die gesamte Position unterdrücken. Das gemeinsame
Datenqualitätsrisiko ist die Erzeugung scheinbarer Nullpositionen.

### Explizite Unterfeldtabelle des 115-Byte-Blocks

Für Blocknummer `n = 1..84` ist der absolute Beginn
`2.646 + (n - 1) × 115`. Auch diese Aufteilung ist lückenlos. In `W040` sind
nur die Ordinale 27 und 28 jeweils in einem Satz nicht nullwertartig; die
Zahlenzonen bleiben dabei Initialnullen. `W040alt` enthält keinen
nicht-nullwertigen Block.

| Relativ | L | absolut in Block 1 | technischer Typ / Belegung | statischer Bedeutungskandidat | Status |
| ---: | ---: | ---: | --- | --- | --- |
| 1 | 8 | 2.646 | DISPLAY-Ziffern, vollständig nullwertartig | Gebührreferenz | Struktur `BESTÄTIGT`, Referenz `WIDERLEGT` für diesen Bestand |
| 9 | 30 | 2.654 | 12.010 von 12.012 Instanzen SP | Bezeichnung | Rolle durch Reihenfolge plausibel; zwei Nutzwerte ohne passende Finanzwerte |
| 39 | 24 | 2.684 | DISPLAY-Ziffern, vollständig nullwertartig | Menge, GKZ, Einzel- und Gesamtbetrag | Reihenfolge belegt, innere Breiten `OFFEN` |
| 63 | 16 | 2.708 | vollständig SP | Haushaltsstelle und RKZ | innere Breiten `OFFEN` |
| 79 | 8 | 2.724 | DISPLAY-Ziffern, vollständig nullwertartig | Rechnungsdatum | Format am Bestand `WIDERLEGT` |
| 87 | 29 | 2.732 | vollständig SP | Kassenzeichen und Füllfelder | innere Breiten `OFFEN` |

Die Summe ist `8 + 30 + 24 + 16 + 8 + 29 = 115`. Für die 24-Byte-Zone wurden
je Variante 2.600 plausible Grenz-/Skalen-/Rechenhypothesen getestet. Keine
enthielt ein nicht-nullwertiges Tripel aus Menge, Einzel- und Gesamtbetrag;
eine Rechenkonsistenz kann daher weder bestätigt noch fachlich widerlegt werden.

Für alle sechs Zeilen gilt ergänzend: kein eigener Index; Datenschutzklasse
`P`; Gebührenbeziehung zu `W006/W006dm` ohne Treffer; Evidenz aus
positionsgleichem Varianten-, Null-/Byteklassenprofil und `P026.GS`; hohe
Struktur-, aber niedrige Fachkonfidenz. Status ist `ungeklärt`; die beiden
isolierten Bezeichnungen reichen ohne Gebühren- und Betragswert nicht für eine
migrierbare Position. Validierungsregel für einen späteren Bestand:
Belegungsprädikat, Gebührenreferenz, Datumsformat und
`Menge × Einzelbetrag = Gesamtbetrag` müssen gemeinsam tragen. Risiko sind
Initialnullen, Storno-/Druckzeilen und eine falsche Dezimalskala.

### Statische `BUCH-TAB`-Reihenfolge und verworfene 236-Byte-Zuordnung

`P050.GS`, `P026.GS` und `DTAUS.GS` nennen in stabiler Reihenfolge
Bescheidkennung, Bescheidnummer, Bescheiddatum, Bescheidbetrag, Zahlungsdatum,
Zahlungsbetrag, Rest, Zahlungsart, Mahnstufe, Mahndatum, vier Textfelder,
Löschkennzeichen/-benutzer/-datum, Betreff sowie spätere Felder für
Haushaltsstelleninformation, Personenkonto, `SST`, `SST2`, „Zahlung gebucht“
und Füllung. Masken belegen unter anderem 14-Byte-Nummern, 8-Byte-Daten,
Betragsdarstellungen und 20-Byte-Texte.

Eine daraus gebildete, exakt 236 Byte summierende Feldbreitenhypothese wurde im
Profiler positionsgleich auf alle 105 vollständigen Perioden angewendet. Sie
ist **nicht bestätigt**: vermeintliche Text2–Text4- und Löschbenutzerbereiche
sind überwiegend zifferninitialisiert, während vermeintliche erste
Bescheidfelder vollständig SP sind. Die Programmliste belegt damit die
fachliche Trennung von Bescheid- und Zahlungs-/Mahndaten, aber noch nicht deren
Offset in `buch`. Sie wird weder auf den 73-Byte-Legacyblock noch auf die
236-Byte-Periode als Importspezifikation übertragen.

### Datums-, Dezimal- und Rechenhypothesen

| Quelle / Feld | Stichprobe | bestätigt | widerlegt / Fehler | Ergebnis |
| --- | ---: | ---: | ---: | --- |
| `W020` 210/L8 | 2.718 | 2.473 `yyyyMMdd` | 237 nullwertartig, 8 weitere ungültig | Format für 2.473 Werte `BESTÄTIGT`, Ereignisrolle `OFFEN` |
| `W021` 232/L8 | 14.211 | 4.422 `yyyyMMdd` | 9.786 nullwertartig, 3 weitere ungültig | Format `BESTÄTIGT`, Ereignisrolle `OFFEN` |
| `W021` 285/L8 | 14.211 | 4.369 `ddMMyyyy` | 9.836 nullwertartig, 6 weitere ungültig | Format `BESTÄTIGT`, Ereignisrolle `OFFEN` |
| `buch` 41/L8 | 11.955 | 11.955 `yyyyMMdd` | 0 | Bescheiddatum `BESTÄTIGT` |
| `buch` 118/126/134, je L8 | je 11.955 | 0 | je 11.955 `00000000` | Datumshypothesen für diesen Bestand `WIDERLEGT` |
| W021-Block relativ 97/L15 | 454.752 | 0 gültige Daten | vollständig nullwertartig | Rechnungsdatum nicht lokalisierbar |
| W040-Block relativ 79/L8 | 12.012; alt 4.956 | 0 gültige Daten | vollständig nullwertartig | Rechnungsdatum nicht lokalisierbar |
| `W006` 136/L3 | 26; DM 335 | 342 nichtleere DISPLAY-Ganzzahlen | alle außerhalb direkter Skala 0–4 und getesteter Teiler 1/10/100 | statischer Feldname „Nachkommastellen“ bestätigt, Kodierung `OFFEN` |
| W040 24-Byte-Zahlzone | 2 × 2.600 Hypothesen | 0 prüfbare Rechenhypothesen | alle Kandidatentripel nullwertartig | Dezimalbreiten und Rundung `OFFEN` |

## Aktualisierte Quellbeziehungsmatrix

Alle Vergleiche erfolgten über Bytefolgen beziehungsweise deren Hashes; es
wurden keine Schlüsselwerte ausgegeben. Überschneidungen gleich langer
Datums- oder Suchfelder sind nur ergänzende Evidenz und werden nicht als
Fremdschlüssel bezeichnet.

| Quelle/Offset | Gegenquelle/Offset | links/rechts verschieden | Schnittmenge | Bewertung |
| --- | --- | ---: | ---: | --- |
| `W020` 1/L26 | `W021` 1/L26 | 2.718 / 2.642 | 2.641 | starker Eltern-/Kindbeleg Grab → Vorgang; 77 Hauptschlüssel ohne Vorgang, ein Vorgangspräfix ohne Hauptsatz |
| `W020` 1/L26 | `W022` 1/L26 | 2.718 / 2.694 | 2.693 | Notiz ist grabbezogen; 25 Hauptsätze ohne und ein Notizsatz ohne Hauptsatz |
| `W021` 1/L28 | `W023` 1/L28 | 14.211 / 204 | 201 | Zusatzdaten sind vorgangsbezogen; drei verwaiste Zusatzsätze |
| `W021` 1/L28 | `DRAUF` 1/L28 | 14.211 / 12.411 | 12.257 | `DRAUF` ist überwiegend vorgangsbezogen; 154 verwaiste und 1.954 Vorgänge ohne `DRAUF` |
| `buch` 1/L16 | `BUCHA` 1/L16 | 11.955 / 723 | 602 | gleicher Bescheidschlüsselraum, aber 121 nur in `BUCHA` |
| `buch` 1/L16 | `Buchalt` 1/L16 | 11.955 / 143 | 0 | historisch disjunkter Schlüsselraum trotz gleichem Legacy-Layout |
| `W040` 1/L16 | `W040alt` 1/L16 | 143 / 59 | 59 | alle Alt-Sätze haben einen aktuellen Schlüssel; Inhalte sind verändert |
| `W005` 1/L10 | `W005dm` 1/L10 | 18 / 38 | 14 | DM-Bestand enthält 24 zusätzliche Schlüssel |
| `W006` 1/L10 | `W006dm` 1/L10 | 26 / 335 | 20 | DM-Bestand enthält 315 zusätzliche Schlüssel |
| `buch` 49/L60 | `W021` 148/L60 | 2.296 / 4.297 | 520 | gleiche Suchcodefamilie wahrscheinlich; kein verlässlicher Personen-FK |
| `buch` 49/L60 | `W040` 79/L60 | 2.296 / 128 | 95 | gleicher Suchcode-/Empfängerverbund wahrscheinlich |
| `buch` 17/L24 | `W040` 17/L24 | 2.101 / 104 | 54 | gemeinsamer Fall-/Grabbezugskandidat |
| `buch` 41/L8 | `W021` 232/L8 | 1.452 / 3.955 | 307 | Datumskollision stützt nur Formatgleichheit, nicht Beziehung |
| `buch` 41/L8 | `W020` 210/L8 | 1.452 / 2.175 | 148 | Datumskollision; kein Fremdschlüsselbeleg |
| `W020` 210/L8 | `W021` 232/L8 | 2.175 / 3.955 | 175 | gleiches Datumsformat, Ereignisgleichheit nicht bewiesen |
| `W021` 76/L14 | `W040` 45/L14 | 11.950 / 136 | 1 | ein Zufalls-/Einzeltreffer reicht nicht für einen Bescheidbezug |
| W021-Positionsblock, 26 Gebührenhypothesen | `W006/W006dm` PK/Teilsegmente | 0 nicht-nullwertige direkte Gebührenwerte | 0 | Referenz am vorliegenden Bestand nicht prüfbar |
| W040/W040alt-Positionsblock, 98 Gebührenhypothesen | `W006/W006dm` PK/Teilsegmente | höchstens 3 zusammengesetzte Nichtnullkandidaten je Hypothese | 0 | Gebührenreferenzhypothesen für diesen Bestand ohne Treffer |

### Aggregierte Datenqualität und Referenzauffälligkeiten

| Prüfung | Ergebnis | Behandlung |
| --- | --- | --- |
| `W020` → `W021` über 26-Byte-Präfix | 2.641 Treffer; 77 Grabsätze ohne Vorgang, 1 Vorgangspräfix ohne Grabsatz | Mengen im Probelauf reproduzieren; den einen verwaisten Kindbezug sperren/klären |
| `W020` → `W022` | 2.693 Treffer; 25 Gräber ohne Notiz, 1 Notiz ohne Grabsatz | nur Ausschlussnachweis, da Notizinhalt nicht migriert wird |
| `W021` → `W023` | 201 Treffer; 14.010 Vorgänge ohne Zusatzsatz, 3 Zusatzsätze ohne Vorgang | drei verwaiste Zusätze separat melden; Freitext nicht protokollieren |
| `W021` → `DRAUF` | 12.257 Treffer; 1.954 Vorgänge ohne `DRAUF`, 154 `DRAUF` ohne Vorgang | Druck-/Aufsatzbestand nicht als Primärquelle behandeln |
| `buch` ↔ `BUCHA` | 602 gemeinsame, 11.353 nur `buch`, 121 nur `BUCHA`; 598/602 Legacypräfixe identisch | Varianten getrennt inventarisieren; 121 Archivschlüssel nicht still verwerfen |
| `buch` ↔ `Buchalt` | 0 gemeinsame Schlüssel | historischer Zusatzbestand, keine Dublettenannahme |
| `W040` ↔ `W040alt` | 59 gemeinsame Schlüssel; Positionsblock bei 54/59 identisch, 5 abweichend | Variantenentscheidung bleibt fachlich OFFEN |
| W021/W040-Positionsblöcke | keine belastbare Gebührenreferenz; alle Betragstripel nullwertartig | Initialwerte nicht als Positionen oder Betrag importieren |
| BUCH-Erweiterung | nur Perioden 1–9 mit Nichtnullinstanzen; 10–101 initialisiert, 102–105 und 232-Byte-Rest SP | nur Belegung zählen; Feldwerte erst nach Offsetbeleg verwenden |

## Variantenanalyse

### `dm`

`W005dm` und `W006dm` sind keine bloßen Kopien des aktuellen Bestands. Sie
enthalten deutlich mehr nur dort vorkommende Schlüssel. Gemeinsame `W005`-
Sätze richten sich bis Byte 236 aus; `W005` hat danach zwei eingeschobene
Bereiche von 30 und 5 Byte. Die späteren Bereiche verschieben sich exakt um
diese 35 Byte. Von 14 gemeinsamen Schlüsseln ist der ausgerichtete Bereich
16–236 einmal, 267–284 gegenüber 237–254 zweimal und 290–358 gegenüber
255–323 keinmal byteidentisch. Bei `W006` ist das Grundlayout bis 194 Byte
gleich strukturiert; von 20 gemeinsamen Schlüsseln sind 136–138 sechzehnmal,
139–146 zweimal, 147–165 neunzehnmal und 166–193 einmal identisch. 195–201 ist
keinmal identisch und in 17 DM-Sätzen vollständig SP, im aktuellen Bestand aber
zifferninitialisiert. Die Namensgebung,
monetären Abweichungen und Währungsfelder machen eine DM-/Euro-Historie sehr
plausibel, beweisen sie aber nicht. Beide Varianten bleiben getrennte Quellen,
bis Gültigkeit und Vorrang entschieden sind.

### `BUCHA` und `Buchalt`

`BUCHA` und `Buchalt` verwenden dasselbe 2.348-Byte-Legacy-Layout und dieselben
neun Indexdefinitionen wie das Präfix von `buch`. Von 602 gemeinsamen
`buch`/`BUCHA`-Schlüsseln sind **598 Präfixe über alle 2.348 Byte identisch**;
vier weichen nur punktuell ab. Die frühere pauschale Aussage, gemeinsame Sätze
seien nicht byteidentisch, war für vollständige Sätze wegen der abweichenden
Satzlänge formal richtig, semantisch aber irreführend und ist damit präzisiert:
`BUCHA` ist sehr wahrscheinlich ein Legacy-Snapshot oder -Teilarchiv. Seine 121
nur dort vorhandenen Schlüssel dürfen dennoch nicht verworfen werden.
`Buchalt` hat 143 vollständig disjunkte Primärschlüssel und ist damit ein
historischer Zusatzbestand, nicht bloß ein Duplikat.

### `W040alt`

Alle 59 Schlüssel von `W040alt` liegen auch in `W040`, aber kein vollständiger
Satz ist byteidentisch. Die identische Satzlänge, Indexstruktur und
84×115-Periodizität belegen dasselbe Layout. `W040alt` ist daher eine ältere
Fassung beziehungsweise ein Snapshot derselben Aufträge/Bescheide; ein
blindes Vereinigen würde Versionen duplizieren, ein blindes Verwerfen könnte
Historie verlieren. Der isolierte Positionsblock 2.646–12.305 ist allerdings
bei 54 der 59 gemeinsamen Schlüssel identisch; nur fünf weichen dort ab. Die
satzweiten Unterschiede liegen somit überwiegend außerhalb der Positionen.

### `oliW002`

28 von 28 `oliW002`-Schlüsseln liegen in `W002`; `W002` enthält einen weiteren.
Die Satzlänge und der Primärindex stimmen überein. Positionen 45–155 sind weit
überwiegend gleich, Unterschiede konzentrieren sich auf den Kopfbereich. Das
spricht für eine ältere oder lokal angepasste Variante, nicht für eine eigene
fachliche Entität. Die Bedeutung von `oli` bleibt `OFFEN`.

## Sicher technische beziehungsweise ausgeschlossene Informationen

| Quelle/Feldgruppe | Bewertung | Status und Regel |
| --- | --- | --- |
| `W022` 27–2.026 | ausschließlich Notizinhalt; keine weiteren strukturierten Felder | nicht migrieren; Inhalt nie protokollieren oder dekodieren |
| `W001` vollständig | Benutzer-/Berechtigungsbestand | nicht migrieren; nur technische Vollständigkeit zählen |
| nachweislich vollständig SP-gefüllte Reserven F005-12, F006-11, F020-13, F021-17, F023-11, `buch` 27.129–27.360 sowie die kleineren Füllspannen | in diesem Bestand keine Nutzinformation | nicht migrieren; im späteren Bestand zwingend erneut SP-prüfen |
| statische Felder `DRUCK*`, `LASER*`, `FORMULAR*`, `ANZ-ZEILEN*`, Ausgabeschacht | technische Ausgabeparameter | nach exakter Offsetlokalisierung nicht migrieren |
| statische BUCH-Felder Zahlungsdatum/-betrag, Rest, Zahlungsart, Mahnstufe/-datum | laut `INT-030` ist FINANZ+ führend | nicht aus EDWALT migrieren; Bescheidnummer, Positionen, festgesetzter Betrag, Fälligkeit und Fallbezug davon trennen |
| W021-Positionsblock und alle Zahlfelder des W040-Positionsblocks im untersuchten Bestand | ausschließlich SP-/Initialnullen; keine belastbare Gebührenreferenz oder Rechnung | keine künstlichen Positionen erzeugen; Struktur nur als Schemaevidenz erhalten |
| alte/supersedierte Nummern | laut `INT-028/029` ausgeschlossen | nicht migrieren; technisch sichere Erkennungsregel ist noch OFFEN |
| `W080` im vorliegenden Bestand | null aktive Sätze, null Löschsätze | nicht inhaltlich validierbar; historischer Krematoriumsbestand bleibt grundsätzlich im Scope |

### Präzisierte Bescheid-/Finanzabgrenzung

| Datenkategorie | belastbare Quelle | Migrationsstatus |
| --- | --- | --- |
| Bescheid-/Quellnummer | `buch/BUCHA/Buchalt` 1/L16; `W040` besitzt einen getrennten Auftragsschlüssel | `migrieren`; Varianten getrennt halten, keine frühere Nummer als Alias |
| Fall-/Grabbezug | `buch` 17/L24 und `W040` 17/L24 mit 54 Hashüberschneidungen | `migrieren`, aber Verbund noch nicht sicher in Friedhof und Grabnummer aufteilen |
| Bescheiddatum | `buch` 41/L8, 11.955/11.955 gültige `yyyyMMdd`-Werte | `migrieren`; fachliche Plausibilitätsgrenzen zusätzlich definieren |
| Gebührenstamm | `W006/W006dm` 1–138 sicher, 139–201 nur als Sammelbereich | Gebührennummer und Texte `migrieren`; Preise/Skalen erst nach Zahlenbeleg |
| Gebührenpositionen | statische W021-/W040-Tabellenreihenfolge, aber vorliegende Positionsblöcke ohne belastbare Werte | fachlich im Scope, aus diesem Bestand keine künstlichen Zeilen; bei späterem nichtleerem Bestand erneut feldweise belegen |
| festgesetzter Betrag | statisch in W021/W040/BUCH genannt, Offset im befüllten Bescheidgrundblock 142–710 oder in der Erweiterung nicht eindeutig lokalisiert | `OFFEN`; keine Übernahme und kein Default, bis Feld und Dezimaldarstellung belegt sind |
| Fälligkeit | statisch belegt; `buch` 118/126/134 sind nur Nullwerte und damit keine nutzbare Quelle | `OFFEN`; anderes EDWALT-Feld oder führende freigegebene Quelle bestimmen |
| Zahlungsdatum/-betrag, Rest, Zahlungsart, Zahlungsstatus/„gebucht“, Mahnstufe/-datum | statische `BUCH-TAB-*`-Felder; FINANZ+ ist fachlich führend | `nicht aus EDWALT migrieren` |
| Betreff und Bescheidtexte | `W006` 11–115 sicher; weitere BUCH-/W040-Texte nur statisch/als Sammelbereich | sichere Gebührenbezeichnungen `migrieren`; freie/technische Texte bis Zweckklärung `OFFEN` |
| Druck-, Formular- und Ausgabeparameter | statische `DRUCK*`-/`LASER*`-/`FORMULAR*`-Felder | `nicht migrieren` |

## Manuell nachzutragen oder nicht aus EDWALT extrahierbar

Soweit Cemaris eine der folgenden Angaben zur initialen Nutzung zwingend
benötigt und keine freigegebene strukturierte Quelle besteht, lautet der Status
`manuell nachtragen`. Ob stattdessen eine andere führende Quelle angebunden
werden kann, ist noch zu entscheiden; stille Defaults sind unzulässig.

- Fachliche Vorrang- und Gültigkeitsregeln für `dm`, `alt`, `BUCHA` und
  `oliW002`; sie sind weder aus Dateinamen noch aus Byteprofilen abschließend
  ableitbar.
- Zweckbindung und Migrationsfreigabe der 16 freien `W023`-Hinweisfelder sowie
  weiterer Hinweise/Freitexte. Ohne Freigabe bleiben sie ausgeschlossen.
- Identifikation von Storno, Aufhebung, Umnummerierung und gültigem Nachfolger,
  solange das entsprechende Quellkennzeichen nicht feldgenau rekonstruiert ist.
- Zahlungsstatus und Mahnverlauf aus dem führenden FINANZ+; diese Information
  darf nicht ersatzweise aus EDWALT geraten werden.
- Dokumentinhalte aus Akten, Bescheiden und Schreiben; sie sind bewusst nicht
  Gegenstand der EDWALT-Datenmigration und verbleiben in den Alt-Ablagen.
- Inhaltliche Regeln für einen späteren `W080`-Bestand; am leeren Testbestand
  sind weder Feldbelegung noch Datenqualität prüfbar.
- Fachlich korrekte Zusammenführung von Personen und Adressen. Suchcodes sind
  keine belastbaren globalen Personenschlüssel; unsichere Dubletten werden
  nicht automatisch zusammengeführt.

## Nachrangige und leere Bestände

| Quelle | Satzlänge / aktive Sätze | technisch gesicherte Struktur | vorläufige Bewertung |
| --- | ---: | --- | --- |
| `DRAUF` | 218 / 12.411 | PK 1/L28 ist der `W021`-PK; weitere Indizes 29/L1, 30/L8, 38/L14; 12.257 Schlüsselüberschneidungen mit `W021` | ungeklärt – vorgangsbezogener Zusatz-/Druckbestand; erst gegen `W021` auf eigenständige Fachinformation prüfen |
| `STATIST` | 2.698 / 8.243 | PK 1/L22 und fünf weitere Statistikindizes | ungeklärt – wahrscheinlich abgeleitet; nicht migrieren, wenn Kennzahlen aus Kernbeständen reproduzierbar sind |
| `W004` | 584 / 7 | PK 1/L4 | ungeklärt – Bediener-/Sachbearbeiterstamm; von dem ausgeschlossenen Berechtigungsbestand `W001` trennen und nur erforderliche Beschäftigtenreferenzen prüfen |
| `W010` | 278 / 5 | PK 1/L4, Alternativindex 5/L5; ein leerer PK | ungeklärt – Termin-/Kalenderbestand; aktuelle Nutzung und externe Terminführung vor einer Übernahme klären |
| `W002` / `oliW002` | 155 / 29 bzw. 28 | gleicher PK 1/L5; 28 gemeinsame Schlüssel, Kopfabweichungen, Positionen 45–155 weitgehend gleich | nicht migrieren – Pfad-/Arbeitsplatzkonfiguration; nur für technische Quellenkunde aufbewahren |
| `W001` | 1.883 / 1 | PK 1/L2 | nicht migrieren – Benutzer-/Berechtigungsdaten ausdrücklich ausgeschlossen |
| `form`, `KASSENZ`, `W007` | 10.057/171/803, jeweils 0 aktive Sätze | Satzlängen und Indexdefinitionen gesichert | am vorliegenden Bestand nicht inhaltlich validierbar; Leere nicht auf späteren Bestand verallgemeinern |
| `W080` | 6.130 / 0 | Satzlänge und 13 Indexsegmente gesichert | historischer Krematoriumsbestand bleibt im Scope; an diesem Bestand keine Semantik- oder Qualitätsvalidierung möglich |

## Ergebnis des Gebühren-/Bescheidauftrags und verbleibender Rest

Der im
[Übergabedokument zur Gebühren- und Bescheidrekonstruktion](edwalt-next-step-handoff.md)
beschriebene technische Auftrag wurde am 11.08.2026 auf der externen
Arbeitskopie ausgeführt. Der Profiler enthält nun deklarative Feld- und
Wiederholungsdefinitionen, 52 Feldprofile, 7 Wiederholungsblöcke mit 48
Unterfeldern, 124 Gebührenreferenz- und 5.200 Dezimal-/Rechenhypothesen, 11
feldweise Variantenvergleiche und vier Periodenkandidaten. Die Negativbefunde
zu initialisierten Positionsblöcken und unbrauchbaren BUCH-Datumsindizes sind
reproduzierbare Ergebnisse, keine fehlende Ausführung.

Verbleibend und ohne neue Quelle nicht sicher entscheidbar sind:

1. die Einzelgrenzen in `W005` 16–358 und `W006` 139–201; Programmlisten und
   Masken liefern Reihenfolge, der Bestand aber zu wenige voneinander
   unabhängige Nutzwerte für eine eindeutige Längenzuordnung;
2. die innere Zuordnung der W021-/W040-Positionsblöcke; hierfür ist ein
   nicht-nullwertiger, freigegebener Referenzbestand oder ein Copybook nötig;
3. die genaue Ausrichtung der statischen `BUCH-TAB-*`-Felder auf die
   236-Byte-Periode sowie die Einzelfelder in `buch` 142–710; die zunächst
   plausible Maskenbreitenhypothese wurde durch das Byteklassenprofil
   widerlegt;
4. der Quellort und die Dezimaldarstellung von festgesetztem Betrag und
   Fälligkeit; insbesondere sind `buch` 118/126/134 keine nutzbaren Daten;
5. fachliche Vorrang-, Gültigkeits- und Währungsregeln für `dm`, `alt` und
   `BUCHA`. Bis dahin wird keine Variante automatisch bevorzugt;
6. erst nach diesen Quell- und Fachbelegen ein EDWALT-unabhängiges Zielkonzept
   und Quell-zu-Konzept-Mapping. Es wurde weder ein Import noch ein
   EDWALT-1:1-Zielmodell erstellt.

Danach ist die weitere Quellrekonstruktion in dieser Reihenfolge sinnvoll:

1. `W020` 91–620 und `W021` 29–1.400: Personenrollen, Nutzungsrecht,
   Beisetzung/Sterbefall und die bereits formatbestätigten Ereignisdaten
   feldweise abgrenzen;
2. Storno-, Aufhebungs-, Umnummerierungs- und Nachfolgerkennzeichen in
   `W020/W021/buch/W040` lokalisieren, damit `INT-028/029` ohne Verlust der
   aktuellen Nummer umgesetzt werden kann;
3. `W023` 29–127 und die 16×30-Byte-Hinweise nur mit Datenschutz-/Zweckfreigabe
   semantisch untersuchen; ohne Freigabe bleiben die Inhalte ausgeschlossen;
4. Änderungs-/Gültigkeitsfelder für `W005dm/W006dm`, `BUCHA/Buchalt` und
   `W040alt` bestimmen und erst dann eine Vorrangregel vorschlagen;
5. anschließend `DRAUF`, `STATIST`, `W004`, `W010` und `W002/oliW002` auf
   eigenständige Fachinformation gegenüber den Kernquellen prüfen.

Nach den priorisierten Dateien folgen `DRAUF` (vorgangsbezogener Druck-/Aufsatz-
bestand), `STATIST` (abgeleitetes Statistiklayout), `W004`, `W010` sowie
`W002/oliW002`. Abgeleitete Bestände werden nur übernommen, wenn sie gegenüber
den Kernquellen eigenständige fachliche Information enthalten. Leere Bestände
werden als Schemahinweis, nicht als Beleg für historische Inhaltslosigkeit
behandelt.
