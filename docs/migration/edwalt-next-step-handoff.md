# Übergabeauftrag: feldgenaue EDWALT-Gebühren- und Bescheidrekonstruktion

> **Stand:** 11.08.2026. Dieses Dokument ist der vollständige Arbeitsauftrag
> für einen neuen Chat ohne vorherigen Gesprächskontext. Es beschreibt den
> nächsten abgegrenzten Analyseschritt, nicht das Cemaris-Zielmodell und keine
> Importimplementierung.

## Ziel des nächsten Arbeitsschritts

Die im ersten Quellfeldkatalog noch zusammengefassten Gebühren-, Betrags-,
Bescheid- und wiederholten Positionsbereiche werden soweit lokal belegbar in
Einzelfelder zerlegt. Das Ergebnis ist eine feldgenaue, validierbare
EDWALT-Quellspezifikation für diese Bereiche. Nicht eindeutig rekonstruierbare
Teilbereiche bleiben ausdrücklich `unbekannt/reserviert` beziehungsweise
`OFFEN`.

Der Schritt umfasst in dieser Reihenfolge:

1. `W006` und `W006dm`, insbesondere Byte 139–201;
2. `W005` und `W005dm`, insbesondere die Sammelbereiche 16–358 und ihre
   Variantenverschiebungen;
3. den 32×127-Byte-Positionsblock in `W021`, Byte 1.401–5.464;
4. den 84×115-Byte-Positionsblock in `W040/W040alt`, Byte 2.646–12.305;
5. die migrationsrelevanten Bescheidfelder und wiederholten Strukturen in
   `buch/BUCHA/Buchalt`, insbesondere Byte 142–2.348 und die Erweiterung
   2.349–27.360;
6. die für diese Finanz-/Bescheidbeziehungen erforderlichen Kopf-, Datums- und
   Referenzfelder in `W020/W021/W040`.

Noch nicht zu bearbeiten sind ein endgültiges Cemaris-Fachmodell, SQL-Schema,
Importcode oder die Nachbildung von EDWALT-Strukturen als Domainmodell.

## Direkt kopierbarer Prompt

```text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

## Aufgabe

Setze die EDWALT-Migrationsanalyse mit dem nächsten abgegrenzten Arbeitsschritt
fort:

Feldgenaue Rekonstruktion der Gebühren-, Betrags-, Bescheid- und wiederholten
Positionsbereiche der priorisierten EDWALT-Dateien.

Entwirf noch kein endgültiges Cemaris-Fachmodell und implementiere noch keinen
Import. EDWALT soll weder funktional noch technisch 1:1 nachgebaut werden. Ziel
ist eine evidenzbasierte, parserfähige Quellspezifikation, die möglichst viele
betriebsnotwendige strukturierte Quelldaten sicher erschließt und jede
verbleibende Unsicherheit sichtbar lässt.

## Erster Schritt: aktuellen Arbeitsstand vollständig übernehmen

Prüfe zuerst:

- `git status --short --branch`
- die letzten Commits
- alle vorhandenen Änderungen einschließlich unversionierter Dateien
- `tools/README.md`
- die Dokumentation unter `docs/migration`
- die relevanten Unterlagen unter `docs/requirements/edwalt-analysis`

Im Arbeitsbaum befinden sich nicht committete Dokumentationsänderungen aus den
vorherigen Analysen. Sie gehören zum aktuellen Arbeitsstand. Nicht zurücksetzen,
überschreiben, verwerfen oder committen.

Lies insbesondere vollständig:

- `docs/migration/README.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-field-catalog.md`
- `docs/migration/edwalt-next-step-handoff.md`
- `docs/requirements/edwalt-analysis/README.md`
- `docs/requirements/edwalt-analysis/data-storage-inventory.md`
- `docs/requirements/edwalt-analysis/evidence-matrix.md`
- `docs/requirements/edwalt-analysis/manual-index.md`
- `docs/requirements/edwalt-analysis/function-catalog.md`
- `docs/requirements/edwalt-analysis/technical-components.md`
- `docs/requirements/edwalt-analysis/documents-reports-templates.md`
- `docs/requirements/edwalt-analysis/interview-record.md`
- `docs/requirements/edwalt-analysis/open-questions-and-interview-guide.md`

Behandle ältere Aussagen als zu präzisierende Evidenz, nicht als unveränderliche
Vorgabe. Neue technische Belege müssen Widersprüche ausdrücklich korrigieren.

## Originalquellen: strikt read-only

Diese Verzeichnisse niemals verändern:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3\EDWHELP`

EDWALT niemals gegen den Originalbestand starten. Keine Rebuild-, Reorg-,
Index-, Reparatur- oder Validierungsoperation gegen Originaldateien ausführen.

Die bereitgestellten Quellen sind nichtproduktiv, aber laut Projektangabe
schema- und versionsgleich mit dem späteren Migrationsbestand. Es gibt keine
Copybooks, FD-Dateien, weiteren Herstellerunterlagen oder erreichbaren
EDWALT-Ansprechpartner. Semantik darf nur aus lokalen Evidenzen rekonstruiert,
niemals geraten werden.

## Vorhandener externer Arbeitsbereich

Alle vertraulichen Arbeitsdaten und der Prototyp liegen außerhalb des
Repositories:

- Arbeitswurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- sichere Quellkopien:
  `...\phase2-20260811\EDW3DAT`
  `...\phase2-20260811\Edwalt3`
- unkomprimierte feste Satzextrakte:
  `...\phase2-20260811\raw-uncompressed`
- externer .NET-Prototyp:
  `...\phase2-20260811\prototype`
- Prototypquelltext:
  `...\phase2-20260811\prototype\Program.cs`
- aggregierter Bericht:
  `...\phase2-20260811\prototype\report.json`
- temporäre Runtime-Dateien:
  `...\phase2-20260811\runtime-temp`
- verwendbares .NET SDK 10.0.302:
  `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

`C:\Users\Benke\.dotnet` enthält keine `dotnet.exe`.

Der externe Prototyp ist bereits erweitert und der Bericht neu erzeugt. Der
aktuelle Bericht enthält 24 logische Dateiprofile, 10 definierte Beziehungen,
116 automatische Beziehungen gleich langer Indexsegmente, 6
Variantenvergleiche und 24 physische Dateiprofile. Der korrigierte Aufruf ist:

& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' `
  run --project 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\prototype\Edwalt.Phase2Profiler.csproj' -- `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\raw-uncompressed' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\prototype\report.json'

Der externe Prototyp darf außerhalb des Repositories mit `apply_patch`
erweitert werden. Verwende strukturierte Parser und Bereichsspezifikationen,
keine fragilen Textoperationen auf Binärdateien. Schreibe weitere
maschinenlesbare Analyseberichte ausschließlich unter die externe
Arbeitswurzel, niemals ins Repository.

Eine erneute Extraktion ist nicht erforderlich. Den Micro-Focus-Schalter `/f`
nicht verwenden; er blieb in kontrollierten Versuchen hängen. Keine anderen
Altprogramme, Makros oder unbekannten EXE-Dateien ausführen. Statische Analyse
lokaler Programme ist erlaubt.

## Bereits technisch belegt

- Micro Focus COBOL indexed files mit `IDXFORMAT(4)` und festen logischen
  Satzlängen;
- 24 vollständige DAT/IDX-Paare, 53.991 aktive Datensätze und 458.899.337 Byte
  unkomprimierte Satzdaten;
- 4.119 physische Löschsätze, keine Primärschlüsseldubletten, je ein leerer PK
  in `W010` und `W020`;
- starke Windows-1252-Indizien in textuellen Bereichen;
- `W022` enthält exakt 26 Byte Grabschlüssel plus 2.000 Byte ausgeschlossenen
  Notizinhalt und keine weiteren strukturierten Felder;
- `W023` enthält den 28-Byte-`W021`-Schlüssel und einen 16×30-Byte-Bereich für
  freie Zusatzfelder;
- `W021` enthält bei 1.401–5.464 exakt 32 Wiederholungen à 127 Byte;
- `W040/W040alt` enthalten bei 2.646–12.305 exakt 84 Wiederholungen à 115 Byte;
- `buch/BUCHA/Buchalt` besitzen dasselbe 2.348-Byte-Legacy-Layout; bei 598 von
  602 gemeinsamen `buch`/`BUCHA`-Schlüsseln ist dieses Präfix byteidentisch;
- `W005` enthält gegenüber `W005dm` eingeschobene Bereiche 237–266 und
  285–289; die Folgebereiche sind um insgesamt 35 Byte verschoben;
- `W006/W006dm` besitzen dasselbe 392-Byte-Grundlayout; 202–392 ist in beiden
  Beständen vollständig gefüllt;
- Original und sichere Arbeitskopie wurden zuletzt über 148 Dateien in
  `EDW3DAT` und 444 Dateien in `Edwalt3` ohne fehlende Dateien, Längen- oder
  SHA-256-Abweichungen verglichen.

## Fachlich verbindliche Abgrenzung

- Historische und abgeschlossene Fälle gehören grundsätzlich in den
  Migrationsumfang.
- Notizen werden nicht migriert.
- `W001`-Benutzer-/Berechtigungsdaten werden nicht migriert.
- Vorhandene Akten, Bescheide und Schreiben werden nicht nach Cemaris kopiert.
- Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge werden
  nicht migriert; die technische Erkennungsregel ist noch offen.
- Bei einem gültigen Nachfolger wird nur die aktuelle Nummer übernommen.
- Aus EDWALT zu migrieren sind Bescheidnummer, Gebührenpositionen,
  festgesetzter Betrag, Fälligkeit und Fallbezug.
- Zahlungsstatus und Mahnungen werden nicht aus EDWALT übernommen; FINANZ+ ist
  dafür führend.
- Historische Krematoriumsdaten bleiben grundsätzlich im Migrationsumfang,
  können am leeren `W080` dieses Bestands aber nicht inhaltlich validiert
  werden.
- Suchcodes sind keine sicheren globalen Personenschlüssel. Unsichere
  Personendubletten niemals automatisch zusammenführen.

## Konkrete Priorität und Untersuchungsbereiche

### 1. `W006` und `W006dm`

Rekonstruiere zuerst vollständig Byte 139–201. Ordne soweit belegbar die
statischen Felder Gebühr, Haushaltsstelle, Kostenstelle, Preis,
Preiskennzeichen, MwSt., MwSt-Kennzeichen, Nettopreis, Kumulationsmenge,
Kumulationswert, Gebührenkennzeichen und Währung zu.

Nutze:

- Feldreihenfolge aus `STAMM.GS`;
- die bereits belegten Bereiche 1–10 Schlüssel, 11–45/46–80/81–115
  Bescheidtexte, 116–135 Mengeneinheit und 136–138 Nachkommastellen;
- DISPLAY-Zeichenklassen, Leer-/Füllprofile und plausible COBOL-Masken;
- die 20 gemeinsamen Schlüssel sowie 6 nur aktuelle und 315 nur
  `W006dm`-Schlüssel;
- Unterschiede zwischen 139–194 und der nur aktuell belegten Erweiterung
  195–201;
- arithmetische Beziehungen nur aggregiert, ohne Betragswerte auszugeben.

### 2. `W005` und `W005dm`

Unterteile die Sammelbereiche F005-05, F005-06, F005-07, F005-09 und F005-11
weiter. Ordne soweit belegbar Kapazitäten, Nutzung, Ruhefristen,
Haushaltsstellen, Preise, Preiskennzeichen, Kostenstellen, Kumulationswerte,
Währung sowie Satzungsfelder zu.

Die Variantenverschiebung ist zwingend zu berücksichtigen:

- gemeinsamer Bereich bis 236;
- `W005` 237–266 ohne Gegenstück in `W005dm`;
- `W005` 267–284 entspricht `W005dm` 237–254;
- `W005` 285–289 ohne Gegenstück;
- `W005` 290–358 entspricht `W005dm` 255–323;
- `W005` 359–1.414 ist im untersuchten Bestand vollständig gefüllt.

### 3. `W021`-Positionsblock

Bestimme ein exaktes 127-Byte-Unterlayout und wende es auf alle 32 Blöcke an.
Die beobachtete aggregierte Teilstruktur ist 8/64/4/20/15/16 Byte. Korrelieren
mit den statischen Tabellenbegriffen:

- Gebühr,
- Bezeichnung,
- Menge,
- GKZ,
- Gebühren-/Gesamtbetrag,
- Haushaltsstelle,
- RKZ,
- Rechnungs-/Fälligkeitsdatum,
- Kassenzeichen,
- Füll-/Größenfelder.

Teste alle plausiblen Gebührennummernsegmente gehasht gegen den `W006`-PK oder
belegte Teilkomponenten. Bestimme pro Unterfeld ausschließlich aggregiert:
Belegungsquote, Leerwert, Zeichenklasse, Formatgültigkeit, Distinct-Anzahl,
Beziehungsabdeckung und gegebenenfalls Summen-/Rechenkonsistenz.

### 4. `W040/W040alt`-Positionsblock

Bestimme ein exaktes 115-Byte-Unterlayout für alle 84 Blöcke. Ausgangspunkt ist
die beobachtete Teilstruktur 8/30/24/16/8/29 Byte und die `P026.GS`-Reihenfolge
`SCS-TAB5-GEBUEHR`, `BEZEICH`, `MENGE`, `GKZ`, `E-BETRAG`, `G-BETRAG`,
`HHSTELLE`, `RKZ`, `R-DATUM`, `KASSENZ` und Füllfelder.

Vergleiche gleiche Unterfelder positionsweise zwischen `W040` und `W040alt`.
Unterscheide fachliche Positionsdaten von Druck-/Formularsteuerung. Alle 59
Alt-PK liegen in `W040`, aber kein vollständiger gemeinsamer Satz ist
byteidentisch.

### 5. `buch`, `BUCHA` und `Buchalt`

Lokalisiere innerhalb des 2.348-Byte-Legacy-Layouts und der aktuellen
`buch`-Erweiterung soweit belegbar:

- Bescheidnummer/Kassenzeichen,
- Fall-/Grabbezug,
- Bescheiddatum,
- Haushaltsjahr,
- Empfänger-/Suchverbund,
- festgesetzten Betrag,
- Fälligkeit,
- Gebührenpositionen und Fallzuordnung,
- getrennt davon Zahlungsdatum/-betrag, Rest, Zahlungsart, Mahnstufe und
  Mahndatum, die ausdrücklich nicht aus EDWALT migriert werden.

Nutze `BUCHSCHN.GS`, `BUCHSCHK.GS`, `P026.GS`, weitere statisch passende
Programme sowie Vorlagen-/Reportfelder. Der 16×73-Byte-Bereich 711–1.878 und
die langen 236-Byte-periodischen Bereiche ab 2.349 sind strukturell weiter zu
untersuchen. Eine Periodizität allein beweist noch keine fachliche Feldrolle.

### 6. Erforderliche Kopf- und Beziehungsfelder

Präzisiere nur soweit für die Finanz-/Bescheidzuordnung nötig:

- `W020` Datumskandidat 210/L8 und Fall-/Grabbezug;
- `W021` 76/L14 sowie Datumskandidaten 232/L8 und 285/L8;
- `W040` Schlüssel-/Suchbereiche 1–138 und bescheidrelevante Kopffelder;
- `buch` Indizes 1/L16, 17/L24, 41/L8, 49/L60, 109/L4, 113/L5,
  118/L8, 126/L8 und 134/L8.

Gleich lange Datums- oder Suchwerte dürfen nicht allein wegen einer
Schnittmenge als Fremdschlüssel bezeichnet werden.

## Technische Umsetzung im externen Profiler

Erweitere den Prototyp bevorzugt um deklarative Bereichs- und
Wiederholungsdefinitionen, beispielsweise:

- Datei, Basisoffset, Blocklänge und Wiederholungszahl;
- Unterfeldname, relativer Offset, Länge und Kandidatentyp;
- Häufigkeit vollständig leerer, vollständig ziffernartiger, gültiger
  Datums-/Zahl- und gemischter Werte;
- Null-, SP-, Steuer-, High-Byte- und Zeichenklassenprofile;
- Distinct-Anzahl ohne Ausgabe der Werte;
- gehashte Schnittmengen zu bekannten Schlüssel- oder Gebührensegmenten;
- Variantenvergleich schlüsselgleicher Sätze;
- aggregierte arithmetische Prüfungen mit expliziter Dezimalhypothese.

Trenne Beobachtung und Interpretation im Bericht. Eine Kandidatenmaske gilt nur
als bestätigt, wenn sie über die relevanten nichtleeren Sätze trägt und durch
mindestens eine unabhängige Evidenz gestützt wird. Erfasse gescheiterte
Hypothesen ebenfalls aggregiert, damit sie nicht später erneut als Tatsache
auftauchen.

Keine vollständigen Sätze und keine Feldwerte in Konsole, JSON, Logs oder
Repository schreiben. Nichtpersonenbezogene Codewerte nur ausgeben, wenn ihre
Semantik zwingend davon abhängt und die Ausgabe datenschutzrechtlich sicher ist;
bevorzuge auch dann Mengen und Hashvergleiche.

## Evidenzregeln

Kombiniere je Einzelfeld:

- bekannte Indexoffsets und Schlüssellängen;
- aggregierte Byte-, Zeichen-, Leer-, Füll- und Variabilitätsprofile;
- plausible COBOL-Darstellungen wie Windows-1252-Text, DISPLAY-Zahl,
  DISPLAY-Datum, COMP/COMP-3, Flag oder Reserve;
- Wiederholungsstruktur und positionsgleiche Varianten;
- gehashte Beziehungen zu anderen Dateien;
- Hilfe-/Maskenreihenfolge;
- statische Programmnamen, Formatmasken, Berechnungen und Dateiverweise;
- Vorlagen- und Reportfelder als ergänzende Evidenz.

Semantik niemals allein aus einem Dateinamen, einer einzelnen Zeichenklasse,
einer zufälligen Datumskollision oder einer plausiblen Feldbreite ableiten.

## Dokumentationsergebnis

Aktualisiere insbesondere:

- `docs/migration/edwalt-source-field-catalog.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/README.md`
- bei neuen oder widerlegten Belegen außerdem die passenden Dokumente unter
  `docs/requirements/edwalt-analysis`

Ergänze für jedes aufgeteilte Einzelfeld beziehungsweise jeden verbleibenden
zusammenhängenden Bytebereich mindestens:

- Quelldatei;
- 1-basierten Offset und Länge;
- Blocknummer/relativen Offset bei Wiederholungen;
- bekannte Indexzugehörigkeit;
- vermuteten technischen Datentyp und Format/Encoding;
- Null-/Leer-/Füllverhalten;
- fachliche Bedeutung;
- konkrete Evidenz und Gegenbelege;
- Konfidenz;
- Schlüssel und Beziehungen;
- Datenschutzklasse;
- Datenqualitätsrisiko;
- Status `migrieren`, `nicht migrieren`, `manuell nachtragen` oder `ungeklärt`;
- Begründung, Validierungsregel und offene Frage.

Die vollständigen Satzlängen und die bereits dokumentierte lückenlose Abdeckung
dürfen durch die Verfeinerung nicht verloren gehen. Ersetze einen Sammelbereich
nur durch Teilbereiche, deren Längen zusammen exakt denselben Bereich ergeben.

Erstelle zusätzlich:

- eine explizite Unterfeldtabelle für 127- und 115-Byte-Blöcke;
- eine aktualisierte Bescheid-/Gebühren-Beziehungsmatrix;
- eine Matrix bestätigter, widerlegter und offener Datums-/Dezimalhypothesen;
- aggregierte Datenqualitäts- und Referenzfehlerzahlen;
- eine präzisierte Abgrenzung migrationspflichtiger Bescheiddaten gegenüber
  ausgeschlossenen Zahlungs-/Mahndaten;
- einen priorisierten Restarbeitsplan für die anschließend noch offenen
  Personen-, Nutzungsrechts-, Status- und Variantenfelder.

Keine echten Daten, vollständigen Extrakte, Feldwerte oder den großen JSON-
Bericht ins Repository aufnehmen.

## Abgrenzung

Noch nicht:

- Cemaris-Fachmodell oder vorhandenes `Read*`-Schema als Ziel übernehmen;
- SQL-Datenbank verändern;
- Importwerkzeug implementieren;
- EDWALT-Tabellen 1:1 als Domainmodell nachbauen;
- unsichere Personen-/Adressdubletten zusammenführen;
- Varianten pauschal vereinigen, überschreiben oder verwerfen;
- Werte erfinden, stille Defaults setzen oder unbekannte Bytes als Text
  dekodieren;
- Originalbestand oder Altprogramm ausführen oder verändern.

Stelle nur Fragen, wenn eine nicht technisch ermittelbare Entscheidung die
weitere Analyse wirklich blockiert. Ansonsten als `OFFEN` dokumentieren und mit
den übrigen Bereichen fortfahren.

## Abschlussprüfung

- externen Prototyp bauen und den aggregierten Bericht reproduzierbar erzeugen;
- Bericht auf 24 logische und 24 physische Dateiprofile sowie vollständige
  Parserläufe prüfen;
- Originale erneut per SHA-256 gegen die sicheren Arbeitskopien vergleichen;
- `git status --short --branch` und sämtliche Änderungen prüfen;
- `git diff --check` ausführen;
- lokale Markdown-Links prüfen;
- neue Tabellen auf konsistente Spalten und lückenlose Bereichssummen prüfen;
- nach personenbezogenen Beispieldaten, Feldwerten, Zugangsdaten und
  versehentlich eingecheckten DAT/IDX/RAW/JSON-Dateien suchen;
- bestätigen, dass keine Originaldatei verändert wurde;
- keine Commits durchführen.

Berichte abschließend nach Priorität:

1. welche Einzelfelder und Blockunterfelder belastbar identifiziert wurden;
2. welche Datentyp-, Datums-, Dezimal- und Rechenhypothesen bestätigt oder
   widerlegt wurden;
3. welche Bescheid-/Gebührenbeziehungen technisch bestätigt sind;
4. welche migrationspflichtigen Bescheiddaten sicher von ausgeschlossenen
   Zahlungs-/Mahndaten getrennt werden konnten;
5. welche Bytebereiche und Semantiken offen bleiben;
6. welcher danach folgende Arbeitsschritt konkret empfohlen wird.
```

## Erwarteter Abschlusszustand

Der Folgechat ist abgeschlossen, wenn die fünf priorisierten Finanz-/Bescheid-
Quellfamilien feldgenauer als im aktuellen Katalog beschrieben sind, die beiden
Positionsblockschemata lückenlos dokumentiert wurden und jede nicht tragfähige
Hypothese als widerlegt oder `OFFEN` sichtbar bleibt. Technisch nicht
entscheidbare Varianten- oder Fachfragen blockieren den Abschluss nicht.

Erst danach folgt die feldgenaue Rekonstruktion der übrigen Personen-,
Nutzungsrechts-, Status-, Nachfolger- und Variantenbereiche. Ein unabhängiges
Cemaris-Fachkonzept wird erst begonnen, wenn auch diese Quellsemantik für die
migrationspflichtigen Informationen ausreichend belastbar ist.
