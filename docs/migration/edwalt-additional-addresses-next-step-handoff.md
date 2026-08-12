# EDWALT-Migrationsanalyse: Folgeübergabe für weitere Adressrollen und Nachläufe

Stand: 12. August 2026

Diese Übergabe setzt die abgeschlossene Analyse der Personen-, Rechte- und
Statusbereiche fort. Sie ist eigenständig und kann als Arbeitsauftrag in einen
neuen Chat kopiert werden. Maßgeblich bleiben die Schutzregeln der bisherigen
EDWALT-Analyse: Originale sind strikt read-only, vertrauliche Arbeitsdaten und
Analyseprogramme bleiben außerhalb des Repositories, und nicht belegbare
Semantik wird als `OFFEN` geführt.

## Ausgangslage

Die vorherige Phase hat `W020` Byte 91–620 und `W021` Byte 29–1.400 lückenlos
profiliert. Belastbar sind insbesondere:

- `W020` Byte 91–620 enthält Rollen-/Adress-, Grab- und
  Nutzungsrechtskandidaten; eine feldgenaue technische Trennung liegt vor,
  während mehrere fachliche Einzelzuordnungen ausdrücklich `OFFEN` bleiben.
- `W021` Byte 144–207 bildet den indexierten Namensuchverbund der Rolle
  Verstorbener; die beiden Namenshälften sind technisch, aber nicht als Vor-
  beziehungsweise Nachname getrennt bestätigt.
- `W021` Byte 220–384 enthält statisch und technisch belegte Kandidaten für
  Trauerfeier, Beisetzung, Geburt, Ruhefrist, Tod und weitere
  Beisetzungsangaben. Die jeweiligen Formatbefunde stehen im Feldkatalog.
- `W021` Byte 385–5.464 besteht aus 40 Positionen zu je 127 Byte. Die ersten
  acht Positionen sind im untersuchten Bestand belegt; Byte 1.401 ist daher
  kein Tabellenanfang. Die Gebührennummer liegt je Block relativ bei Byte
  73/Länge 4. Diese Korrektur ersetzt die ältere 32-Block-Annahme.
- Ein eigener Programmablauf zum Ändern einer Grabnummer ist belegt. Ein
  persistierter Vorgänger-/Nachfolgerzeiger, ein belastbares fachliches
  Storno-/Aufhebungsfeld und eine sichere Nachfolgerregel wurden nicht gefunden.
  Deshalb ist derzeit keinerlei datensatzverwerfende Statusfilterung erlaubt.
- `STATUS_1.GS` und `STATUS~1.GS` sind identische Programmkopien und keine
  Statusdaten. Physisch gelöschte Micro-Focus-Sätze, Finanzstornos und
  `W040alt` sind ebenfalls keine belegten fachlichen Nachfolgermerkmale.

Die Finanz-/Bescheidanalyse ist abgeschlossen und wird nicht erneut geöffnet.
Die einzige zulässige Berührung ist ein eng begrenzter Vergleich, falls er für
eine neue Adressrollen- oder Statusaussage zwingend erforderlich ist.

## Direkt kopierbarer Prompt

````text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

## Aufgabe

Setze die EDWALT-Migrationsanalyse mit dem nächsten abgegrenzten Arbeitsschritt
fort:

1. Rekonstruiere die weiteren Adressrollen sowie die Grabzustands-, Grabmal-,
   Einfassungs- und FUG-Bereiche in `W020` Byte 621–1.684 feldgenau, soweit
   lokale Evidenz dies trägt.
2. Rekonstruiere den Nachlauf von `W021` Byte 5.465–5.770 feldgenau. Trenne
   Erwerb, Einlieferung, Überführung und sonstige fachliche Kandidaten von rein
   technischen Druck-, Steuer- und Füllbereichen.
3. Prüfe `W020` Byte 1.685/Länge 9 als eng begrenzten Kandidaten für
   `LETZTER-VORGANG` weiter. Eine Status- oder Nachfolgerregel darf nur bei
   unabhängigem statischem und datenstrukturellem Beleg entstehen.

Entwirf noch kein endgültiges Cemaris-Fachmodell, kein Quell-zu-Ziel-Mapping
und keinen Import. Baue EDWALT weder funktional noch technisch 1:1 nach. Ziel
ist eine datensparsame, parserfähige Quellspezifikation mit sichtbaren
Unsicherheiten und technisch belastbaren Regeln für spätere
Migrationsentscheidungen.

`W022` ist in diesem Schritt nicht inhaltlich auszuwerten. `W023` darf ohne
ausdrückliche Datenschutz- und Zweckfreigabe ebenfalls nicht semantisch
profiliert werden. Falls Strukturgrenzen aus bereits dokumentierten Aggregaten
für einen Vergleich nötig sind, beschränke dich auf Anzahlen, Längen und
Hash-Anzahlen und dokumentiere die Abgrenzung.

## Erster Schritt: Git-, Dokumenten- und Arbeitsstand übernehmen

Prüfe vor jeder Änderung:

- `git status --short --branch`
- `git log -5 --oneline --decorate`
- `git diff --stat`, den vollständigen `git diff` und vorhandene
  unversionierte Dateien
- vorhandene `AGENTS.md`
- `tools/README.md`
- alle Dokumente unter `docs/migration`
- die relevanten Unterlagen unter `docs/requirements/edwalt-analysis`

Nicht committete Änderungen gehören zum aktuellen Arbeitsstand. Nicht
zurücksetzen, überschreiben, verwerfen oder committen. Arbeite um fremde oder
unabhängige Änderungen herum und erhalte sie vollständig.

Lies insbesondere vollständig:

- `docs/migration/README.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-field-catalog.md`
- `docs/migration/edwalt-person-rights-status-next-step-handoff.md`
- `docs/migration/edwalt-additional-addresses-next-step-handoff.md`
- `docs/requirements/mvp-read-search-decisions.md`
- `docs/requirements/edwalt-analysis/README.md`
- `docs/requirements/edwalt-analysis/data-storage-inventory.md`
- `docs/requirements/edwalt-analysis/evidence-matrix.md`
- `docs/requirements/edwalt-analysis/manual-index.md`
- `docs/requirements/edwalt-analysis/function-catalog.md`
- `docs/requirements/edwalt-analysis/technical-components.md`
- `docs/requirements/edwalt-analysis/documents-reports-templates.md`
- `docs/requirements/edwalt-analysis/interview-record.md`
- `docs/requirements/edwalt-analysis/open-questions-and-interview-guide.md`

Behandle ältere Aussagen als zu präzisierende Evidenz. Neue technische Belege
müssen Widersprüche ausdrücklich korrigieren. Wiederhole die abgeschlossene
Gebühren-/Bescheidanalyse nicht.

## Originalquellen: strikt read-only

Diese Verzeichnisse niemals verändern:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3\EDWHELP`

EDWALT niemals gegen den Originalbestand starten. Keine Rebuild-, Reorg-,
Index-, Reparatur- oder Validierungsoperation gegen Originaldateien ausführen.
Keine Originalprogramme, Makros, Batchdateien oder unbekannten EXE-Dateien
starten. Rein lesende statische Untersuchung lokaler Programmdateien ist
zulässig.

Die Quellen sind nichtproduktiv, aber laut Projektangabe schema- und
versionsgleich mit dem späteren Migrationsbestand (`INT-036`). Copybooks,
FD-Dateien, weitere Herstellerunterlagen und erreichbare EDWALT-Ansprechpartner
stehen nicht zur Verfügung (`INT-037`). Frage nicht erneut danach. Rekonstruiere
Semantik ausschließlich aus lokalen Evidenzen; rate sie nicht.

## Externe Arbeitsverzeichnisse

Vertrauliche Arbeitsdaten und Analyseprogramme bleiben außerhalb des
Repositories.

Behandle diese verifizierte Phase-2-Basis read-only:

- Wurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- sichere Quellkopien: `...\phase2-20260811\EDW3DAT` und
  `...\phase2-20260811\Edwalt3`
- feste Satzextrakte: `...\phase2-20260811\raw-uncompressed`
- maßgeblicher Basisbericht: `...\phase2-20260811\report.json`

Behandle auch die abgeschlossene Phase 3 read-only:

- Wurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812`
- Profiler: `...\phase3-person-rights-status-20260812\prototype`
- maßgeblicher Bericht:
  `...\phase3-person-rights-status-20260812\report.json`

Lege für diesen Schritt einen neuen beschreibbaren Arbeitsbereich an:

- Wurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812`
- Profiler: `...\phase4-additional-addresses-20260812\prototype`
- aggregierter Bericht:
  `...\phase4-additional-addresses-20260812\report.json`
- statische Aggregate, falls nötig:
  `...\phase4-additional-addresses-20260812\static-analysis`

Kopiere nur die für die Weiterentwicklung nötigen Quelltexte und Projektdateien
aus Phase 3 in Phase 4. Kopiere keine Rohdaten, Quellkopien, Berichte,
`bin`-/`obj`-Verzeichnisse oder temporären Dateien. Schreibe niemals in Phase 2
oder Phase 3. Prüfe vor dem Kopieren, dass Phase 4 nicht bereits fremde Arbeit
enthält.

Verwende ausschließlich dieses lokal bereitgestellte SDK:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

## Verbindliche Schutzregeln

- Quellinhalte, Personennamen, Anschriften, Grabnummern, Kassenzeichen,
  Buchungstexte oder sonstige personenbezogene beziehungsweise fachliche
  Einzelwerte niemals in Terminalausgaben, Berichte, Dokumentation oder Git
  übernehmen.
- Ausgaben nur als Anzahlen, Längen, Byteklassen, Hash-Anzahlen,
  Längenhistogramme, Datumsformatstatistiken, Beziehungsabdeckungen und andere
  nicht rückführbare Aggregate erzeugen.
- Schlüssel vor Vergleichen hashen. Keine Rohschlüssel protokollieren.
- Keine DAT-, IDX-, RAW-, JSON-, Binär-, Bild-, Office- oder PDF-Arbeitsdaten in
  das Repository kopieren.
- Hilfscode und maschinenlesbare Berichte nur im neuen externen
  Phase-4-Verzeichnis anlegen.
- Statische Programmnamen und Feldbezeichner dürfen dokumentiert werden;
  konkrete Quelldatensätze und Feldwerte nicht.
- Keine Commits erstellen.

## Verbindliche Evidenzmethode

Halte für jede Feldgrenze und jede fachliche Zuordnung getrennt fest:

1. reproduzierbare Beobachtung;
2. daraus abgeleitete Interpretation;
3. Evidenztyp und Fundstelle;
4. Konfidenz;
5. verbleibende Unsicherheit;
6. sichere spätere Parser- oder Filterfolge.

Nutze mindestens zwei voneinander unabhängige Evidenzarten für eine belastbare
Semantik, zum Beispiel:

- statische Feldnamen oder Kontrollabläufe in `EDW.GS` beziehungsweise anderen
  lokal vorliegenden Programmdateien;
- dokumentierte Masken, Formular- oder Handbuchstruktur;
- harte Indexgrenzen und Satzlängen;
- aggregierte Byteklassen-, Null-/SP-, Längen-, Datums- oder
  Wiederholungsprofile;
- aggregierte Beziehungen zu bereits bestätigten Schlüsseln oder Varianten.

Eine plausible Nachbarschaft oder eine ähnlich aussehende Belegung allein ist
kein Semantikbeleg. Widersprüchliche Evidenz senkt die Konfidenz oder führt zu
`OFFEN` beziehungsweise `WIDERLEGT`.

## Arbeitspriorität 1: `W020` Byte 621–1.684

Erzeuge eine lückenlose und überschneidungsfreie technische Zerlegung dieses
Bereichs. Nutze harte Indexgrenzen, statische Feldreihenfolgen, aggregierte
Byteprofile und unabhängige Strukturwiederholungen.

Trenne, soweit belegbar:

- zweite und dritte Personen-/Adressrolle;
- Name, Suchname, Anrede, Titel, Straße, Postleitzahl, Ort und weitere
  Anschriftsbestandteile, ohne Beispielwerte auszugeben;
- Grabmal-, Einfassungs- und sonstige Grabzustandsdaten;
- FUG-bezogene Kennzeichen, Datums-, Kontroll- und Verwaltungsfelder;
- Füll-, Reserve-, Druck- und rein technische Bereiche.

Vergleiche Rollenstrukturen nur aggregiert. Ähnliche Layouts dürfen als
Strukturwiederholung dokumentiert werden; konkrete Rollenbezeichnungen und
Einzelfeldsemantik erfordern zusätzliche statische oder dokumentarische
Evidenz.

Prüfe das Gesamtintervall rechnerisch auf unveränderte Satzlänge 2.693 Byte,
Lücken und Überlappungen. Dokumentiere untrennbare Restgruppen ausdrücklich als
solche, statt Scheingenauigkeit zu erzeugen.

## Arbeitspriorität 2: `W021` Byte 5.465–5.770

Profiliere den gesamten 306-Byte-Nachlauf lückenlos und
überschneidungsfrei. Prüfe die statisch genannten Kandidaten für Erwerb,
Einlieferung, Überführung, Ruhe-/Nutzungsrechtsfortschreibung und weitere
Vorgangsangaben. Trenne sie von Druckpuffern, Formularsteuerung, Füllern und
anderen technischen Bereichen.

Byte 5.465 folgt unmittelbar auf 40 Gebührenblöcke zu je 127 Byte. Prüfe daher
zuerst, ob dort ein echter Strukturwechsel vorliegt. Leite weder aus der
Position noch aus einem einzelnen Zeichenprofil eine fachliche Bedeutung ab.

Prüfe das Gesamtintervall rechnerisch auf unveränderte Satzlänge 6.265 Byte,
Lücken und Überlappungen. Der nicht untersuchte Rest ab Byte 5.771 bleibt
sichtbar außerhalb dieses Schritts.

## Arbeitspriorität 3: enger Status-Gegencheck

Profiliere `W020` Byte 1.685/Länge 9 separat und vergleiche es nur aggregiert
mit bereits bestätigten W020-/W021-Schlüsselbestandteilen und statischen
Verwendungen von `D-W020-LETZTER-VORGANG`.

Eine belastbare Nachfolgerregel verlangt:

- eine sichere Bytegrenze;
- eine statisch belegte Feldverwendung;
- eine reproduzierbare datenstrukturelle Beziehung;
- eine eindeutige Regel für aktive, ersetzte und ungültige Sätze;
- dokumentierte Behandlung von Null-, Leer-, Selbst- und Kettenfällen.

Fehlt einer dieser Belege, bleibt die Semantik `OFFEN`. Dann gilt weiterhin:
keine Datensätze aufgrund dieses Feldes ausschließen, keine Alias- oder
Nachfolgerkette erzeugen und keine alte/neue Grabnummer ableiten.

Öffne keine breite Statussuche in Finanzdateien, `W040alt`, `STATUS_1.GS`,
`STATUS~1.GS` oder physischen Löschsätzen; deren negative beziehungsweise
andersartige Befunde sind bereits dokumentiert.

## Externer Profiler und Bericht

Erweitere den Phase-4-Profiler so, dass er zusätzlich zu den unveränderten
Phase-3-Ergebnissen mindestens ausgibt:

- deklarative Felddefinitionen für alle verfeinerten W020-/W021-Bereiche;
- lückenlose Coverage-Prüfungen für W020 621–1.684 und W021 5.465–5.770;
- feldweise Null-/SP-/Nullwert-, Zeichenklassen-, Hash-Anzahl- und
  Längenprofile;
- passende Datumsformathypothesen nur für technisch plausible Feldlängen;
- aggregierte Strukturvergleiche zwischen den Adressrollen;
- einen separaten Bericht für W020 1.685/Länge 9;
- explizite Beobachtungen, Interpretationen, Konfidenzen, Status und sichere
  Folgen für jede neue Hypothese;
- Positiv- und Negativbefunde ohne Quellwerte.

Der Profiler muss beim Start interne Coverage-Verletzungen abbrechen und darf
keine Feldwerte ausgeben. Baue und starte ihn nur gegen die sicheren
Phase-2-Kopien und -Extrakte. Ein zulässiger Aufruf ist:

```powershell
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' `
  run --project 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812\prototype\Edwalt.Phase2Profiler.csproj' -- `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\raw-uncompressed' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812\report.json'
```

## Dokumentationsergebnisse

Aktualisiere mindestens:

- `docs/migration/README.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-field-catalog.md`
- die passenden Dokumente unter `docs/requirements/edwalt-analysis`

Dokumentiere:

- jede neue Feldgrenze mit 1-basiertem Offset und Länge;
- Beobachtung und Interpretation getrennt;
- Evidenztyp, Fundstelle, Konfidenz, Datenschutz-/Migrationsrisiko,
  Validierung, offene Semantik und sichere Parserfolge;
- lückenlose Summen und unveränderte Satzlängen;
- Rollen- und Strukturwiederholungen ohne unzulässige Personenbeispiele;
- bestätigte, widerlegte und offene Status-/Nachfolgerhypothesen;
- ausdrücklich, dass ohne belastbare Regel keine fachliche Filterung erfolgt;
- den externen Phase-4-Arbeitsbereich, den reproduzierbaren Aufruf und die
  Berichtszusammenfassung.

Erstelle am Ende eine neue, eigenständig direkt kopierbare Folgeübergabe für
den danach fachlich sinnvollsten, eng abgegrenzten Analyseschritt. Übernimm
alle Schutzregeln, Arbeitsverzeichnisse, Prioritäten, Abgrenzungen,
Dokumentationsergebnisse und Abschlussprüfungen. Verweise in den zentralen
Migrationsdokumenten auf diese neue Übergabe.

## Abschlussprüfung

- Phase-4-Prototyp mit .NET SDK 10.0.302 bauen; keine Warnungen oder Fehler;
- aggregierten Phase-4-Bericht reproduzierbar erzeugen;
- weiterhin 24 logische und 24 vollständige physische Profile sowie
  fehlerfreie Parserläufe prüfen;
- neue Feldbereiche, Hypothesen, Negativbefunde und Coverage-Mengen prüfen;
- Originale erneut per SHA-256 gegen die sicheren Phase-2-Kopien vergleichen;
  keine fehlenden, zusätzlichen, Längen- oder Hashabweichungen zulassen;
- dabei die aktuelle reguläre Bestandszahl aus dem Dateisystem berichten.
  Historische Manifeste können zusätzlich Office-Sperrdateien und `Thumbs.db`
  enthalten und sind nicht ohne Dateiklassenabgleich als aktuelle Sollzahl zu
  verwenden;
- `git status --short --branch`, den vollständigen Diff und sämtliche
  unversionierte Dateien prüfen;
- `git diff --check` ausführen;
- lokale Markdown-Links prüfen;
- neue Tabellen auf konsistente Spalten prüfen;
- alle verfeinerten Bereiche auf lückenlose, überschneidungsfreie Summen und
  unveränderte Satzlängen prüfen;
- nach personenbezogenen Beispieldaten, Zugangsdaten und versehentlich in Git
  gelangten DAT-/IDX-/RAW-/JSON-/Binärdateien suchen;
- bestätigen, dass Originale, Phase-2-Basis und Phase-3-Arbeitsstand
  unverändert blieben;
- keine Commits durchführen.

Berichte abschließend nach Priorität:

1. welche weiteren W020-Adressrollen und Einzelfelder belastbar getrennt
   wurden;
2. welche Grabzustands-, Grabmal-, Einfassungs- und FUG-Bereiche bestätigt
   wurden;
3. welche fachlichen W021-Nachlauffelder von technischen Bereichen getrennt
   wurden;
4. ob W020 1.685/Länge 9 als Status-/Nachfolgermerkmal belastbar ist;
5. welche Parser- oder Filterregel dadurch erlaubt ist oder ausdrücklich offen
   bleibt;
6. welche Bytebereiche und Semantiken offen bleiben;
7. welcher danach folgende Arbeitsschritt konkret empfohlen wird.
````

## Erwarteter Abschlusszustand

Der Folgechat ist abgeschlossen, wenn `W020` Byte 621–1.684 und `W021` Byte
5.465–5.770 lückenlos technisch dokumentiert sind, Rollen- und
Grabzustandssemantiken nur im Umfang unabhängiger Evidenz vergeben wurden und
der Gegencheck von `W020` Byte 1.685/Länge 9 entweder belastbar belegt oder
sichtbar `OFFEN` abgeschlossen ist. Eine offene Nachfolgerregel blockiert die
übrige Quellrekonstruktion nicht und erlaubt weiterhin keinen Ausschluss.
