# EDWALT-Extraktionsprototyp und technisches Datenprofil

Stand: 12. August 2026

## Ergebnis

Das Speicherformat der 24 untersuchten DAT/IDX-Paare ist technisch belastbar
als **Micro Focus COBOL indexed file, IDXFORMAT(4), mit fester logischer
Satzlänge** identifiziert. Die mit EDWALT ausgelieferte Micro-Focus-Net-Express-
Runtime 3.1.11 kann die Dateimetadaten lesen und aktive Datensätze aus einer
Arbeitskopie als unkomprimierte, feste Binärsätze ausgeben.

Diese Feststellung identifiziert Dateiorganisation, Satzlängen, Indexschlüssel,
aktive Satzmengen und physische Löschsatztypen. Sie erklärt noch nicht die
fachliche Bedeutung aller Bytebereiche. EDWALT bleibt deshalb eine Quelle für
die Migration und wird weder als Cemaris-Fachmodell noch als Zielschema
übernommen.

## Schutz- und Arbeitsbereiche

Die Originalquellen bleiben strikt unverändert:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3\EDWHELP`

Alle ausführbaren Analyseschritte fanden ausschließlich in dieser lokalen
Arbeitskopie außerhalb des Repositories statt:

- Arbeitswurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- kopierte Quellen: Unterverzeichnisse `EDW3DAT` und `Edwalt3`
- unkomprimierte Satzextrakte: `raw-uncompressed` (24 Dateien)
- nicht eingecheckter .NET-Prototyp: `prototype`
- maßgeblicher maschinenlesbarer aggregierter Bericht: `report.json` direkt in
  der Arbeitswurzel; `prototype\report.json` ist ein älterer Zwischenstand
- isoliertes temporäres Laufzeitverzeichnis: `runtime-temp`
- vollständiges lokales .NET-SDK 10.0.302:
  `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete`

`C:\Users\Benke\.dotnet` ist nur ein Benutzer- und Cacheverzeichnis und
enthält keine `dotnet.exe`. Es wurde nicht verändert.

Die Arbeitskopie und insbesondere `raw-uncompressed` und `report.json` dürfen
nicht in Git aufgenommen oder an externe Dienste übermittelt werden. Obwohl
der Bericht nur technische Aggregate enthält, bleibt er zusammen mit dem
Prototyp bis zur abschließenden Datenschutzprüfung außerhalb des Repositories.

Die Personen-/Rechte-/Statusvertiefung liest diese Phase-2-Basis nur und
schreibt ausschließlich in den neuen externen Arbeitsbereich:

- Arbeitswurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812`
- erweiterter, nicht eingecheckter Profiler: Unterverzeichnis `prototype`
- maßgeblicher aggregierter Phase-3-Bericht: `report.json` direkt in dieser
  Arbeitswurzel

Es wurden keine Quelldaten, Reports, `bin`-/`obj`-Verzeichnisse oder
Binärdateien ins Repository übernommen.

## Nachweis des Speicherformats und Extraktionsweg

Belege:

1. Programm und Daten enthalten die Micro-Focus-Dateihandler- und
   `REBUILD`-Komponenten der ausgelieferten Net-Express-Runtime.
2. `REBUILD /n` meldet für jedes der 24 Paare `IDXFORMAT(4)`, feste Satzlänge
   und Indexdefinitionen. Dieser Informationsmodus wurde nur auf der
   Arbeitskopie verwendet.
3. `REBUILD /o:ind,seq /c:d0 /i` erzeugt aus der Arbeitskopie feste,
   unkomprimierte Binärsätze. Jede Ausgabedatei ist exakt durch die gemeldete
   Satzlänge teilbar.
4. Ein unabhängiger Parser läuft durch alle physischen DAT-Dateien bis zum
   Dateiende. Die Summe der Micro-Focus-Satztypen 4, 5, 7 und 8 entspricht in
   jeder Datei exakt der Zahl der logisch extrahierten aktiven Sätze.
5. SHA-256-Vergleiche vor und nach den Läufen ergaben keine Abweichung zwischen
   den 592 Dateien der beiden aktuell verwendeten Quellwurzel-Kopien und ihren
   Originalen. Das ältere Phase-1-Manifest umfasst 597 Dateien. Gegenüber dem
   aktuellen Stand fehlen dort inzwischen fünf flüchtige technische Dateien:
   zwei Office-Sperrdateien und drei `Thumbs.db`. Keine DAT-/IDX- oder sonstige
   migrationsrelevante Datei ist betroffen. Die Ursache des zeitlichen
   Unterschieds ist nicht belegt; er wurde nicht durch den Prototyp erzeugt.

Der Micro-Focus-Schalter `/f` wurde nicht weiter verwendet: Zwei kontrollierte
Versuche auf Kopien beendeten sich nicht. Die Prozesse wurden beendet; die
Eingabedateien blieben hashidentisch. Für die weitere Analyse sind `/n` und der
bereits erzeugte sequenzielle Export ausreichend.

Herstellerreferenzen für die verwendeten Optionen und Satztypen:

- [Micro Focus REBUILD](https://www.microfocus.com/documentation/reuze/60d/fhrebu.htm)
- [Informationsmodus `/n`](https://www.microfocus.com/documentation/reuze/60sv/rhrebu0b.htm)
- [Komprimierungsoption `/c`](https://www.microfocus.com/documentation/reuze/60sv/rhrebu07.htm)

## Technisches Inventar der logischen Sätze

`Schlüssel` ist die Anzahl der von `REBUILD /n` gemeldeten Indizes.
`Gelöscht` zählt physische Sätze des Micro-Focus-Typs 2. Diese werden vom
logischen Export nicht ausgegeben und sind keine automatisch zu migrierende
Historie. Eine fachliche Storno- oder Nachfolgersemantik darf daraus nicht
abgeleitet werden.

| Datei | Satzlänge | Schlüssel | aktive Sätze | physisch gelöscht |
| --- | ---: | ---: | ---: | ---: |
| `buch` | 27.360 | 9 | 11.955 | 116 |
| `BUCHA` | 2.348 | 9 | 723 | 0 |
| `Buchalt` | 2.348 | 9 | 143 | 0 |
| `DRAUF` | 218 | 4 | 12.411 | 1 |
| `form` | 10.057 | 1 | 0 | 0 |
| `KASSENZ` | 171 | 6 | 0 | 0 |
| `oliW002` | 155 | 1 | 28 | 1 |
| `STATIST` | 2.698 | 6 | 8.243 | 0 |
| `W001` | 1.883 | 1 | 1 | 4 |
| `W002` | 155 | 1 | 29 | 1 |
| `W004` | 584 | 1 | 7 | 10 |
| `W005` | 1.414 | 2 | 18 | 54 |
| `W005dm` | 323 | 2 | 38 | 1 |
| `W006` | 392 | 1 | 26 | 343 |
| `W006dm` | 392 | 1 | 335 | 1 |
| `W007` | 803 | 2 | 0 | 0 |
| `W010` | 278 | 2 | 5 | 1 |
| `W020` | 2.693 | 20 | 2.718 | 918 |
| `W021` | 6.265 | 8 | 14.211 | 872 |
| `W022` | 2.026 | 1 | 2.694 | 841 |
| `W023` | 808 | 1 | 204 | 836 |
| `W040` | 13.179 | 11 | 143 | 118 |
| `W040alt` | 13.179 | 11 | 59 | 1 |
| `W080` | 6.130 | 13 | 0 | 0 |
| **Summe** |  |  | **53.991** | **4.119** |

Die unkomprimierten aktiven Sätze belegen zusammen 458.899.337 Byte. Alle
Primärschlüssel der aktiven Sätze sind eindeutig. Zwei aktive Sätze besitzen
einen vollständig leeren Primärschlüssel: je einer in `W010` und `W020`.
Diese Sätze sind als möglicher Leer-, Standard- oder technischer Satz zu
klassifizieren und dürfen nicht stillschweigend importiert werden.

`form`, `KASSENZ`, `W007` und `W080` enthalten im vorliegenden, ausdrücklich
nichtproduktiven Bestand keine aktiven Sätze. Bei `W080` ist auch kein
physischer Löschsatz vorhanden. Damit enthält gerade dieser bereitgestellte
Bestand keine Krematoriumsfälle, obwohl der Datenbereich laut Projektentscheidung
für einen späteren Bestand im Migrationsumfang bleibt.

## Belegte Schlüsselbeziehungen

Die Vergleiche verwenden ausschließlich SHA-256-Repräsentationen der
Schlüsselbytes; Quellwerte werden nicht ausgegeben.

| Vergleich | links | rechts | Schnittmenge | nur links | nur rechts |
| --- | ---: | ---: | ---: | ---: | ---: |
| `W020` PK ↔ `W022` PK | 2.718 | 2.694 | 2.693 | 25 | 1 |
| `W021` PK ↔ `W023` PK | 14.211 | 204 | 201 | 14.010 | 3 |
| `W021` PK ↔ `DRAUF` PK | 14.211 | 12.411 | 12.257 | 1.954 | 154 |
| `W020` PK ↔ erste 26 Byte des `W021`-PK | 2.718 | 2.642 | 2.641 | 77 | 1 |
| `buch` PK ↔ `BUCHA` PK | 11.955 | 723 | 602 | 11.353 | 121 |
| `buch` PK ↔ `Buchalt` PK | 11.955 | 143 | 0 | 11.955 | 143 |
| `W005` PK ↔ `W005dm` PK | 18 | 38 | 14 | 4 | 24 |
| `W006` PK ↔ `W006dm` PK | 26 | 335 | 20 | 6 | 315 |
| `W002` PK ↔ `oliW002` PK | 29 | 28 | 28 | 1 | 0 |
| `W040` PK ↔ `W040alt` PK | 143 | 59 | 59 | 84 | 0 |

Damit sind technische Eltern-/Kindkandidaten und verwaiste Schlüssel messbar,
ihre fachliche Bezeichnung bleibt aber evidenzpflichtig. Insbesondere sprechen
Hilfe und Schlüsselstruktur gemeinsam stark für `W020` als grabbezogenen
Hauptbestand und `W021` als darunter liegenden Vorgangsbestand. Das ist noch
kein freigegebenes Cemaris-Entity-Mapping.

## Historische und alternative Varianten

Die Varianten dürfen nicht pauschal vereinigt oder verworfen werden:

- `W005`/`W005dm`: 14 gemeinsame, 4 nur aktuelle und 24 nur DM-Schlüssel;
- `W006`/`W006dm`: 20 gemeinsame, 6 nur aktuelle und 315 nur DM-Schlüssel;
- `W002`/`oliW002`: 28 gemeinsame Schlüssel, aber kein gemeinsamer Satz ist
  byteidentisch;
- `W040`/`W040alt`: alle 59 Alt-Schlüssel kommen auch in `W040` vor, aber kein
  gemeinsamer Satz ist byteidentisch;
- `buch`/`BUCHA`: 602 gemeinsame Schlüssel und 121 nur in `BUCHA`; bei 598 der
  602 gemeinsamen Schlüssel sind die ersten 2.348 Byte vollständig identisch;
- `buch`/`Buchalt`: keine gemeinsamen Primärschlüssel.

`dm`, `alt`, `BUCHA` und `oli` sind daher nur Namensindizien. Die Bestände
bleiben im Raw-/Staging-Umfang, bis Feldsemantik, Zeitbezug und Vorrangregel
belegt sind. Die Projektverantwortung kennt ihre historische Bedeutung nicht;
weitere Herstellerunterlagen oder Copybooks existieren nicht.

## Aggregierte Positions- und Satzlayoutrekonstruktion

Der Prototyp wurde um ein Positionsprofil für jedes Byte, Vergleiche aller
gleich langen Indexsegmente und positionsweise Variantenvergleiche erweitert.
Die Finanzvertiefung sowie die Personen-/Rechte-/Statusphase ergänzen
deklarative Feld-/Bereichs- und
Wiederholungsdefinitionen, Blockordinalprofile, Nullwertklassifikation,
feldweise Variantenvergleiche sowie Gebührenreferenz-, Dezimal-, Rechen- und
Periodenhypothesen. Der Bericht enthält ausschließlich Häufigkeiten,
Zeichenklassen, Hash-Anzahlen und Schnittmengen; Quellwerte werden nicht
ausgegeben.

Damit sind zusätzlich technisch belegt:

- `W005`: gemeinsamer Variantenstamm bis Byte 236; in `W005` eingeschobene
  Bereiche 237–266 und 285–289; ausgerichtete Folgebereiche bis Byte 358;
  359–1.414 vollständig SP-gefüllt;
- `W006`: drei aufeinanderfolgende 35-Byte-Bezeichnungsbereiche, ein
  Gebühren-/Konfigurationsblock bis Byte 201 und eine vollständig SP-gefüllte
  Reserve 202–392;
- `W021`: 40 wiederkehrende Blöcke à 127 Byte in 385–5.464; die frühere
  Grenze 1.401 bezeichnet nur den Beginn von Block 9 und ist korrigiert;
- `W023`: ein exakt 480 Byte langer Bereich 128–607, der zusammen mit der
  Handbuchangabe 16 feste Zusatzfelder à 30 Byte belegt;
- `buch`, `BUCHA`, `Buchalt`: gemeinsames 2.348-Byte-Legacy-Layout; `buch`
  besitzt danach 105 vollständige 236-Byte-Perioden und einen vollständig
  SP-gefüllten 232-Byte-Rest;
- `W040`, `W040alt`: 84 wiederkehrende Blöcke à 115 Byte in 2.646–12.305;
- `W022`: exakt 26 Byte Schlüssel plus 2.000 Byte Notiz; keine weiteren
  strukturierten Felder.

Die erneute Grenzvalidierung präzisiert die Wiederholungsblöcke:

- `W021` beginnt bereits bei Byte 385. Positionen 1–8 enthalten Nutzwerte,
  Positionen 9–40 sind nullwertartig. Die ältere Unterteilung
  `8/64/4/20/15/16` trägt nicht. Innerhalb jedes 127-Byte-Blocks ist relativ
  73/L4 als Gebührennummer bestätigt: alle 42 verschiedenen Nichtnullkandidaten
  referenzieren `W006/W006dm`. Die übrigen Unterfelder bleiben `OFFEN`.
- `W040/W040alt` verwenden exakt `8/30/24/16/8/29` Byte. In `W040` sind nur
  die Ordinale 27 und 28 jeweils einmal nicht nullwertartig, ohne belegten
  Mengen-/Betragswert; `W040alt` ist vollständig initialisiert.
- Von den 26 W021-Gebührenreferenzhypothesen liefern sieben Treffer; der
  stärkste und semantisch passende Befund ist relativ 73/L4 mit 42/42
  verschiedenen Referenzen. Die W040/W040alt-Hypothesen bleiben ohne Treffer.
- Je W040-Variante wurden 2.600 plausible Grenzen und Skalen für
  `Menge × Einzelbetrag = Gesamtbetrag` geprüft. Keine Hypothese besaß auch nur
  ein nicht-nullwertiges prüfbares Tripel.
- Die 236-Byte-Periode ist gegenüber 73, 115 und 127 Byte klar abgegrenzt:
  mittlere Dominanz der positionsgleichen Byteklasse 97,5 % statt jeweils
  57,4 %; 108 von 236 Phasen erreichen mindestens 99 % Dominanz.
- Eine aus der statischen `BUCH-TAB-*`-Reihenfolge und UI-Masken gebildete,
  exakt 236 Byte große Unterfeldhypothese passt nicht zum Byteklassenprofil und
  wurde verworfen. Die statische Trennung von Bescheid- und Zahlungsdaten gilt,
  ihre Feldoffsets sind damit noch nicht bewiesen.

Die vollständige, lückenlose Abgrenzung und ihre vorsichtige fachliche
Einordnung stehen im
[EDWALT-Quellfeldkatalog](edwalt-source-field-catalog.md).

## Datums- und Zeichensatzindizien

Belegte Formatkandidaten innerhalb indexierter Bytebereiche:

- `buch`, `BUCHA`, `Buchalt`, Schlüssel ab Position 41, Länge 8: alle aktiven
  Sätze enthalten einen gültigen `yyyyMMdd`-Kandidaten;
- `W020`, Position 210, Länge 8: 2.473 gültige `yyyyMMdd`-Kandidaten;
- `W021`, Position 220, Länge 8: 156 gültige `yyyyMMdd`-Werte,
  Trauerfeierdatum;
- `W021`, Position 232, Länge 8: 4.422 gültige `yyyyMMdd`-Werte,
  Beisetzdatum;
- `W021`, Position 241, Länge 8: 4.341 gültige `ddMMyyyy`-Werte,
  Geburtsdatum;
- `W021`, Positionen 269 und 277, je Länge 8: 4.421 beziehungsweise 4.417
  gültige `ddMMyyyy`-Werte, Ruhefrist von/bis;
- `W021`, Position 285, Länge 8: 4.369 gültige `ddMMyyyy`-Werte,
  Sterbedatum.

Die Restmengen wurden ebenfalls geprüft: `W020` 210/L8 enthält neben 2.473
gültigen Werten 237 Nullwerte und 8 weitere ungültige Werte; `W021` 232/L8
enthält 9.786 Nullwerte und 3 weitere ungültige Werte, 285/L8 9.836 Nullwerte
und 6 weitere ungültige Werte. Die drei indexierten `buch`-Felder 118/126/134
sind in allen 11.955 Sätzen `00000000` und damit für diesen Bestand als
Datumshypothese widerlegt.

`W021` 29/L8 und 37/L8 wurden trotz der statischen Nähe zu `NUTZ-VON/-BIS`
separat geprüft: Beide üblichen 8-Byte-Datumsformate sind dort widerlegt. Diese
Bereiche dürfen nicht als Nutzungsdaten importiert werden. Die oben benannten
W021-Ereignisrollen sind durch Programmnamen/-kontrolle, angrenzende
Textgrenzen beziehungsweise Indizes und Formatprofile mehrfach gestützt. Die
Rolle von `W020` 210/L8 bleibt dagegen `OFFEN`.

Die Analyse wahrscheinlich textueller Byteumgebungen spricht bei den zentralen
Beständen deutlich für Windows-1252. Beispielsweise stehen in `W020` 3.412
Windows-1252-Indikatoren 4 CP850-Indikatoren gegenüber, in `W021` 15.942 zu 0.
Eine Gesamtauswertung über vollständige Sätze wäre wegen binärer Felder
irreführend. Dekodiert werden dürfen später nur belegte Textfelder; binäre und
numerische Bereiche bleiben typisiert.

## Reproduzierbarer Profiling-Lauf

Der aktuelle Phase-3-Prototyp wird mit dem separaten SDK so ausgeführt:

```powershell
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' `
  run --project 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812\prototype\Edwalt.Phase2Profiler.csproj' -- `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\raw-uncompressed' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812\report.json'
```

Der Lauf gibt JSON mit technischen Aggregaten aus. Er schreibt weder in die
Originalquellen noch in die Arbeitskopie. Eine erneute Extraktion ist für den
nächsten Analyseschritt nicht erforderlich.

Der zuletzt neu erzeugte Bericht enthält weiterhin 24 logische Dateiprofile, 10
definierte Beziehungen, 116 automatische Vergleiche gleich langer
Indexsegmente, 6 Variantenvergleiche und 24 vollständig gelesene physische
Dateiprofile. Hinzu kommen 52 Finanzfeldprofile, 7 Wiederholungsblöcke mit 47
Unterfeldern, 124 Gebührenreferenz-, 5.200 Dezimal-/Rechenhypothesen, 11
feldweise Variantenvergleiche und 4 Periodenkandidaten. Hinzu kommen 66
lückenlose W020-/W021-Bereichsprofile, fünf gezielte Statusfeldprofile, 157
positionsweise Grenzsignale, acht Status-/Nachfolgerhypothesen, ein über alle
2.692 möglichen 2-Byte-Offsets aggregierter Nachfolgerscan und fünf statische
Negativ-/Positivbefunde. Beobachtung und Interpretation stehen getrennt im
JSON; Textlängen erscheinen nur als Histogramme, Distinct-Werte nur als
SHA-256-Anzahlen. Alle physischen Parserläufe sind vollständig und ohne Fehler.
Der Build mit .NET SDK 10.0.302 endet ohne Warnungen und Fehler.
Der Bericht ist 28.332.345 Byte groß und hat den SHA-256-Wert
`43F8749A4E1C3AC4390FFD56EA33106056D99A1CA03D8E8F4CA517D892438A48`.
Ein zweiter Lauf mit demselben Aufruf erzeugte byteidentisch denselben Hash.

## Noch nicht bewiesen

- Einzelfeldgrenzen innerhalb der im Quellkatalog markierten Sammelbereiche
  sowie COBOL-Dezimal-/Vorzeichendarstellung; bei W040 verhindert der
  nullinitialisierte Bestand eine weitere datengestützte Aufteilung;
- fachliche Bezeichnung jedes Quellfelds und Bedeutung von Leer-/Null-/Codewerten;
- sichere Erkennung von Storno, Aufhebung, Umnummerierung und gültigem
  Nachfolger;
- fachlicher Zeitbezug und Vorrang der Alt-/DM-Varianten;
- genaue Rolle und Innengrenzen der ersten W020-Adresse sowie Rollen der
  weiteren Adressen, Personen- und Organisationsdubletten;
- Herkunft und Vollständigkeit von Gebührenpositionen und Bescheiddaten;
  insbesondere sind festgesetzter Betrag und Fälligkeit noch nicht feldgenau
  lokalisiert;
- Inhalt eines späteren Krematoriumsbestands, da `W080` hier leer ist;
- ein vollständiges Cemaris-Zielmodell oder Feldmapping.

## Verbleibender nächster Schritt

Die
[Personen-, Nutzungsrechts- und Statusrekonstruktion](edwalt-person-rights-status-next-step-handoff.md)
ist technisch durchgeführt. Die eingebetteten Feldnamen sind nutzbar, das
binäre Symbolformat liefert aber kein reproduzierbar validiertes DAT-Layout.
Storno, Aufhebung und ein gültiger Umnummerierungsnachfolger bleiben deshalb
nicht filterfähig. Der nächste mit dem vorhandenen Bestand ausführbare Schritt
ist die im
[Übergabeauftrag zu weiteren Adressrollen und Vorgangsnachlauf](edwalt-additional-addresses-next-step-handoff.md)
beschriebene Zerlegung von `W020` 621–1.684 und `W021` 5.465–5.770. Zusätzlich
werden der Statuskandidat 1685/L9 und das getrennte Kennzeichen 1694/L1
geprüft, sodass W020 621–1.694 ohne Lücke im Scope liegt. Unbekannte Bereiche
bleiben erhalten und `OFFEN`; es folgt weiterhin weder ein Import noch ein aus
EDWALT abgeleitetes 1:1-Zielmodell.
