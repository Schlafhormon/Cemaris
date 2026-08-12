# Übergabeauftrag: EDWALT-Personen-, Nutzungsrechts- und Statusrekonstruktion

> **Stand:** 12.08.2026. Dieses Dokument ist der vollständige Arbeitsauftrag
> für einen neuen Chat ohne vorherigen Gesprächskontext. Es setzt die
> abgeschlossene Gebühren-/Bescheidvertiefung fort. Gegenstand sind weiterhin
> ausschließlich EDWALT-Quellstruktur und Migrationssicherheit, nicht das
> Cemaris-Zielmodell und keine Importimplementierung.
>
> **Status:** Der Auftrag ist ausgeführt. Die im kopierbaren Prompt erhaltenen
> Ausgangszahlen 150/447 und 48 Unterfelder sind historisch: Aktuell wurden 148
> beziehungsweise 444 reguläre Dateien ohne Abweichung verglichen und der
> korrigierte Profiler enthält 47 Wiederholungsunterfelder. `W021` besitzt 40
> Blöcke ab Byte 385, davon acht belegt. Der aktuelle Folgeauftrag steht unter
> [weitere Adressrollen und Vorgangsnachlauf](edwalt-additional-addresses-next-step-handoff.md).

## Ziel des nächsten Arbeitsschritts

Die migrationsrelevanten Personen-, Adressrollen-, Grab-, Nutzungsrechts-,
Vorgangs-, Sterbe- und Beisetzungsbereiche werden soweit lokal belegbar in
parserfähige Einzelfelder zerlegt. Zusätzlich werden die technischen Merkmale
für Storno, Aufhebung, Umnummerierung und gültigen Nachfolger gesucht, weil nur
mit einer sicheren Regel die bestätigten Ausschlüsse `INT-028/029` umgesetzt
werden dürfen.

Der Schritt umfasst in dieser Reihenfolge:

1. statische Rekonstruktion der eingebetteten Feld-/Symbolinformationen in
   `EDW.GS` und unmittelbar relevanten lokalen Programmen;
2. `W020` Byte 91–620: erste Personen-/Adressrolle sowie Grab- und
   Nutzungsrechtskern;
3. `W021` Byte 29–1.400: Vorgang, Nutzungszeit, verstorbene Person,
   Trauerfeier, Geburt, Tod, Beisetzung, Ruhefrist, Lage und strukturierte
   Verwaltungsangaben;
4. gezielte Suche nach Status-, Altstand-, Umnummerierungs- und
   Nachfolgermerkmalen in `W020`, `W021`, `buch/BUCHA/Buchalt` und
   `W040/W040alt`, auch außerhalb der beiden Primärbereiche, aber ohne diese
   weiteren Dateien vollständig zu rekonstruieren;
5. Aktualisierung des Quellfeldkatalogs, der Beziehungs- und
   Datenqualitätsbefunde sowie ein neuer priorisierter Restarbeitsplan.

Nicht eindeutig rekonstruierbare Teilbereiche bleiben ausdrücklich
`unbekannt/reserviert` beziehungsweise `OFFEN`. Es darf keine Ausschluss- oder
Nachfolgerregel allein aus einem Dateinamen, einem einzelnen Kennzeichen, einer
physischen Löschsatzart oder einer zeitlichen Vermutung entstehen.

## Direkt kopierbarer Prompt

```text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

## Aufgabe

Setze die EDWALT-Migrationsanalyse mit dem nächsten abgegrenzten Arbeitsschritt
fort:

Feldgenaue Rekonstruktion der Personen-, Adressrollen-, Grab-,
Nutzungsrechts-, Vorgangs-, Sterbe- und Beisetzungsbereiche in `W020` und
`W021` sowie evidenzbasierte Lokalisierung möglicher Storno-, Aufhebungs-,
Umnummerierungs- und Nachfolgermerkmale.

Entwirf noch kein endgültiges Cemaris-Fachmodell, kein Quell-zu-Ziel-Mapping
und keinen Import. EDWALT soll weder funktional noch technisch 1:1 nachgebaut
werden. Ziel ist eine datensparsame, parserfähige Quellspezifikation mit
sichtbaren Unsicherheiten und technisch belastbaren Regeln für spätere
Migrationsentscheidungen.

## Erster Schritt: Git- und Dokumentenstand vollständig übernehmen

Prüfe zuerst, bevor du Dateien änderst:

- `git status --short --branch`
- `git log -5 --oneline --decorate`
- `git diff --stat`, `git diff` und vorhandene unversionierte Dateien
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
- `docs/migration/edwalt-next-step-handoff.md`
- `docs/migration/edwalt-person-rights-status-next-step-handoff.md`
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
Gebühren-/Bescheidanalyse nicht, außer ein eng begrenzter Vergleich ist für die
Status-/Nachfolgerfrage zwingend erforderlich.

## Originalquellen: strikt read-only

Diese Verzeichnisse niemals verändern:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3\EDWHELP`

EDWALT niemals gegen den Originalbestand starten. Keine Rebuild-, Reorg-,
Index-, Reparatur- oder Validierungsoperation gegen Originaldateien ausführen.
Keine Originalprogramme, Makros, Batchdateien oder unbekannten EXE-Dateien
starten. Die statische, rein lesende Untersuchung lokaler Programmdateien ist
erlaubt.

Die bereitgestellten Quellen sind nichtproduktiv, aber laut Projektangabe
schema- und versionsgleich mit dem späteren Migrationsbestand (`INT-036`). Es
gibt keine Copybooks, FD-Dateien, weiteren Herstellerunterlagen oder
erreichbaren EDWALT-Ansprechpartner (`INT-037`). Frage nicht erneut danach.
Semantik darf nur aus lokalen Evidenzen rekonstruiert, niemals geraten werden.

## Vorhandene und neue externe Arbeitsverzeichnisse

Vertrauliche Arbeitsdaten und Analyseprogramme bleiben außerhalb des
Repositories.

Vorhandene verifizierte Phase-2-Basis, zunächst read-only behandeln:

- Basiswurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- sichere Quellkopien:
  `...\phase2-20260811\EDW3DAT`
  `...\phase2-20260811\Edwalt3`
- feste unkomprimierte Satzextrakte:
  `...\phase2-20260811\raw-uncompressed`
- bisheriger externer Profiler:
  `...\phase2-20260811\prototype`
- maßgeblicher aggregierter Phase-2-Bericht:
  `...\phase2-20260811\report.json`
- temporäre Runtime-Dateien:
  `...\phase2-20260811\runtime-temp`

Unter `...\phase2-20260811\prototype\report.json` liegt außerdem ein älterer,
nicht maßgeblicher Zwischenbericht. Verwende für den Ausgangsvergleich nur den
oben genannten Bericht direkt in der Phase-2-Wurzel.

Neuer beschreibbarer Arbeitsbereich für diesen Schritt:

- Arbeitswurzel:
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812`
- weiterzuentwickelnder Profiler:
  `...\phase3-person-rights-status-20260812\prototype`
- neue aggregierte Berichte:
  `...\phase3-person-rights-status-20260812\report.json`
- weitere maschinenlesbare statische Aggregate, falls nötig:
  `...\phase3-person-rights-status-20260812\static-analysis`

Prüfe zuerst, ob die Phase-3-Wurzel bereits existiert. Wenn ja, erhalte alle
dortigen Arbeiten und setze sie fort. Wenn nein, lege sie an und übernimm nur
den Profilerquelltext, die Projektdatei und die README aus dem
Phase-2-`prototype`; kopiere weder `bin`, `obj`, Berichte noch Quelldaten. Die
Phase-2-Eingaben bleiben unverändert und dürfen vom Phase-3-Profiler nur gelesen
werden.

Verwendbares .NET SDK 10.0.302:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

`C:\Users\Benke\.dotnet` enthält keine `dotnet.exe`.

Eine erneute Extraktion ist nicht erforderlich. Den Micro-Focus-Schalter `/f`
niemals verwenden; er blieb in kontrollierten Versuchen hängen. Falls der
SHA-256-Vergleich zwischen Originalen und Phase-2-Kopien Abweichungen zeigt,
nicht weitermachen, nicht synchronisieren und nichts überschreiben: Befund und
exakte Dateimengen ohne Inhaltswerte dokumentieren und nur dann nachfragen,
wenn keine unveränderte, bereits verifizierte Phase-2-Basis mehr nutzbar ist.

Der reproduzierbare neue Profilerlauf soll sinngemäß verwenden:

& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' `
  run --project 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812\prototype\Edwalt.Phase2Profiler.csproj' -- `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\raw-uncompressed' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812\report.json'

Der externe Profiler darf im neuen Phase-3-Arbeitsbereich erweitert werden.
Verwende strukturierte Parser und deklarative Bereichsspezifikationen, keine
fragilen Textoperationen auf Satzdaten. Schreibe Analyseberichte ausschließlich
unter die neue externe Arbeitswurzel, niemals ins Repository.

## Bereits technisch belegt und nicht erneut herzuleiten

- 24 vollständige Micro-Focus-DAT/IDX-Paare mit `IDXFORMAT(4)` und festen
  logischen Satzlängen;
- 53.991 aktive Datensätze und 458.899.337 Byte unkomprimierte Satzdaten;
- 4.119 physische Löschsätze, keine Primärschlüsseldubletten, je ein leerer PK
  in `W010` und `W020`;
- starke Windows-1252-Indizien in belegten Textbereichen;
- Originale und sichere Phase-2-Kopien wurden zuletzt über 150 Dateien in
  `EDW3DAT` und 447 Dateien in `Edwalt3` ohne fehlende/zusätzliche Dateien,
  Längen- oder SHA-256-Abweichungen verglichen;
- `W020` hat 2.693 Byte und 20 Indexsegmente; `W021` hat 6.265 Byte und acht
  Indexsegmente;
- der primäre W020-Bereich 91–620 umfasst exakt 530 Byte; der primäre
  W021-Bereich 29–1.400 exakt 1.372 Byte;
- `W020` 1/L26 ist der Grab-/Hauptschlüssel; `W021` 1/L28 besteht aus diesem
  Präfix plus Vorgangsnummer;
- 2.641 verschiedene `W020`-/`W021`-Schlüsselpräfixe überschneiden sich;
  77 W020-Schlüssel besitzen keinen Vorgang und ein W021-Präfix keinen W020-
  Hauptsatz;
- `W021` hat 201 Beziehungen zu `W023` und 12.257 zu `DRAUF`, jeweils über den
  vollständigen 28-Byte-Schlüssel; Verwaiste sind dokumentiert;
- `W020` 210/L8 hat 2.473 gültige `yyyyMMdd`-Kandidaten;
- `W021` 232/L8 hat 4.422 gültige `yyyyMMdd`-Kandidaten;
- `W021` 285/L8 hat 4.369 gültige `ddMMyyyy`-Kandidaten;
- gleiche Datumswerte oder Suchcodes sind kein Fremdschlüsselbeweis;
- physische Micro-Focus-Löschsätze sind keine automatisch fachlich stornierten
  oder überholten Vorgänge;
- der Gebühren-/Bescheidauftrag ist abgeschlossen. Die W021-/W040-
  Positionsblöcke sind nullinitialisiert, und die dazu bereits geprüften 124
  Gebührenreferenz- sowie 5.200 Dezimal-/Rechenhypothesen sind nicht zu
  wiederholen.

Der aktuelle Phase-2-Bericht umfasst 24 logische und 24 vollständige physische
Profile, 10 feste und 116 indexbasierte Beziehungen, sechs satzweite und elf
feldweise Variantenvergleiche, 52 Finanzfeldprofile, sieben
Wiederholungsblöcke mit 48 Unterfeldern sowie vier Periodenkandidaten.

## Fachlich verbindliche Abgrenzung

- Historische und abgeschlossene Fälle gehören grundsätzlich in den
  Migrationsumfang (`INT-006`).
- Betriebsnotwendige strukturierte Daten sollen umfangreiche manuelle
  Nacherfassung vermeiden (`INT-007`).
- Notizen werden nicht migriert; insbesondere `W022`-Inhalte nicht untersuchen
  oder dekodieren.
- `W001`-Benutzer-/Berechtigungsdaten werden nicht migriert.
- Vorhandene Akten, Bescheide und Schreiben werden nicht nach Cemaris kopiert.
- Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge werden
  nicht migriert. Nur sicher klassifizierte Sätze dürfen später ausgeschlossen
  werden (`INT-028`).
- Bei einem gültigen Nachfolger wird nur die aktuelle Nummer übernommen;
  frühere Nummern werden nicht als Alias migriert (`INT-029`).
- Finanzstorno/Gutschrift in `buch`, physische Micro-Focus-Löschsätze und ein
  überholter Grab-/Vorgangsstand sind drei verschiedene Sachverhalte. Nicht
  gleichsetzen.
- Personen-/Adress-, Beisetzungs- und Nutzungsrechtsdaten sind regelmäßig
  genutzte, priorisierte Kernbereiche (`INT-008`).
- Für die bestätigte lesende Suche werden insbesondere Name, Vorname,
  Geburts-/Sterbedatum, Friedhof/Feld/Grabnummer, Beisetzungsdatum,
  Nutzungsberechtigte und Anschrift benötigt (`INT-032/033`). Das bestätigt
  Datenkategorien, aber noch keine Quellfeld- oder Zielmodellzuordnung.
- Suchcodes sind keine sicheren globalen Personenschlüssel. Unsichere
  Personendubletten niemals automatisch zusammenführen.
- Freie Hinweise, Religion/Konfession, Pfarrer-, Bank-, Zahlungs- und andere
  besonders sensible Angaben nur strukturell und aggregiert untersuchen. Ihre
  Migrationsfreigabe bleibt ohne eindeutige Entscheidung `OFFEN`.

## Priorität 1: statische Feld- und Symbolrekonstruktion

Untersuche ausschließlich statisch die sicheren Programmkopien, insbesondere:

- `...\phase2-20260811\Edwalt3\EDW.GS`
- bei konkreter Referenz zusätzlich `P025.GS`, `P026.GS`, `P050.GS`,
  `AUSWERT*.GS`, `STATUS_1.GS`, `STATUS~1.GS`, `NEWSET.GS`, `NEWSET2.GS`
  und weitere unmittelbar belegte Module.

`EDW.GS` enthält eingebettete Feldnamen, Kommentare, Masken, Quellfragmente und
einen umfangreichen Symbolbereich. Ermittle, ob daraus Feldoffsets, Längen,
Datentypen, Wiederholungen oder Redefinitionen reproduzierbar gelesen werden
können. Ein vermutetes Binärformat der Symbolinformationen ist erst bestätigt,
wenn es an bekannten Feldern, Schlüsseln, Satzlängen und mindestens einer
zweiten Evidenzart trägt.

Sichere nur technische Aggregate und generische Feldnamen. Keine Quellzeilen
oder urheberrechtlich relevanten größeren Programmausschnitte ins Repository
kopieren. Kurze Feldnamen, Masken und für die Beweisführung nötige abstrakte
Kontrollflussbefunde dürfen dokumentiert werden.

Die statische Programmliste nennt für `W020` in der relevanten Reihenfolge unter
anderem:

- `FAMNAME1`, `VORNAME1`, `FAMNAME12`, `ANREDE1`, `TITEL1`, `STRASSE1`,
  `POSTFACH1`, `LKZ1`, `PLZ1`, `ORT1`;
- `GRABNAME`, `GRABART`, `GRABTEXT1/2`;
- `STELLEN-SARG`, `STELLEN-SARG-BELEGT`, `STELLEN-URNE`,
  `STELLEN-URNE-BELEGT`, `QM`;
- `NUTZ-JJJJ`, `NUTZ-MM`, `NUTZ-TT`, `NUTZUNGSRECHT`,
  `ERSTES-NUTZRECHT`, `ERSTES-NUTZRECHT-KZ` und `GRABHINWEIS1–4`.

Die statische Programmliste nennt für `W021` in der relevanten Reihenfolge
unter anderem:

- `NUTZ-VON`, `NUTZ-BIS`, `JAHRE`, `EMPFAENGER`, `VORGANGBEZ`,
  `VORGANGKZ` und anschließend bereits bekannte Gebühren-/Kassenfelder;
- `VERST-FAMNAME`, `VERST-VORNAME`, `SUCHCODE1-VERSTORBENER`;
- `TRAUERFEIER-DATUM`, `TRAUERFEIER-UHRZEIT`, `TRAUERFEIER-KZ`,
  `TRAUERFEIER-TEXT`;
- `BEISETZDATUM`, `BEISETZ-DATUM-KZ`, `GEBURTSDATUM`, `GEBURTSORT`,
  `RUHEFRIST-VON/BIS`, `STERBEDATUM`, `STERBEORT`, `ALTER`, `VJAHRE`;
- `BEISETZNR`, `BEISETZZEIT`, `BEISETZKZ`, `BEISETZART`,
  `BEISETZ-HINWEIS`, `STELLE`, `LAGEKZ`, `HINWEIS`, `EING-NURECHT`,
  `URNENPLATZ`, `ERFASS-DATUM`, `UPDATE-DATUM`;
- `HINWEIS1–16`, `BESTATTER-NR`, `BESTATTER`, `PFARRER`, `KONFESSION`,
  `KZ1`, `KZ2`, `SONSTIGER-TEXT`, `FAELLIG-DATUM`.

Die Reihenfolge allein beweist weder Grenze noch fachliche Nutzung.

## Priorität 2: `W020` Byte 91–620

Zerlege die bisherigen Sammelbereiche F020-05 bis F020-07 lückenlos und soweit
belegbar in Einzelfelder. Beachte zwingend diese Indexgrenzen:

- 91/L34 und überlappend 95/L30;
- 125/L8 und überlappend 129/L4;
- 206/L12 und überlappend 210/L8;
- 307/L50;
- 612/L9.

Zu klären sind insbesondere:

- exakte Namen-, Anrede-, Titel- und Anschriftspannen der ersten Rolle;
- ob diese Rolle Nutzungsberechtigte, Empfänger, Zahler oder eine technisch
  mehrfach verwendete Adresse ist;
- Grabname, Grabart, Grabtexte, Sarg-/Urnenkapazität und Belegung;
- Nutzungsbeginn, Nutzungsende beziehungsweise Laufzeit, erstes
  Nutzungsrecht und zugehörige Kennzeichen;
- fachliche Rolle von 210/L8 und 612/L9;
- Null-, SP-, Füll-, Datums- und Codeverhalten je Einzelfeld.

Nutze Indexüberlappungen als harte Bereichsgrenzen, nicht automatisch als
Feldsemantik. Texte dürfen nur nach belegter Teilfeldgrenze als Windows-1252
klassifiziert werden. Vollständige Adressen oder Namen niemals ausgeben.

## Priorität 3: `W021` Byte 29–1.400

Zerlege F021-05 bis F021-14 lückenlos. Beachte die bestätigten Indexbereiche:

- 76/L14;
- 144/L64 und überlappend 148/L60;
- 208/L12;
- 220/L12;
- 232/L8;
- 285/L8.

Ordne soweit belastbar:

- Nutzungszeitraum, Jahre, Empfänger und Vorgangsart/-kennzeichen;
- Gebühren-/Finanzfelder nur dort, wo die frühere Finanzanalyse bereits einen
  Beleg liefert; keine neue Finanzhypothesenserie;
- Nachname, Vorname und Suchcode der verstorbenen Person;
- Trauerfeierdatum/-zeit/-kennzeichen und strukturierten Textbereich;
- Beisetzungsdatum und weitere Beisetzungsattribute;
- Geburts- und Sterbedatum/-ort sowie Ruhefrist von/bis;
- Stelle, Lage, Urnenplatz, eingeschränktes Nutzungsrecht sowie Erfassungs- und
  Änderungsdatum;
- strukturierte Rollen wie Bestatter; sensible/freie Angaben wie Pfarrer,
  Konfession, Hinweise und sonstiger Text nur abgrenzen, nicht inhaltlich
  auswerten.

Teste für jeden Datumskandidaten separat das statisch oder durch Masken
gestützte Format. Weise kalendergültige, leere/nullwertige und ungültige Werte
nur als Anzahlen aus. Ein gültiges Format bestätigt noch nicht die
Ereignisrolle. Prüfe die Rollenbezeichnung durch mindestens eine unabhängige
Evidenz wie Maskenposition, Indexfunktion, Programmkontrolle oder fachlich
passende Relation.

## Priorität 4: Status, Umnummerierung und Nachfolger

Suche in statischen Feldnamen, eingebetteten Programmfragmenten,
Masken-/Hilfetexten und aggregierten Datenprofilen gezielt nach:

- Vorgangskennzeichen und Abschluss-/Erledigtmerkmale;
- Grabnummer-ändern-/Umnummerierungsabläufen;
- alten und neuen Schlüsseln oder expliziten Vorgänger-/Nachfolgerreferenzen;
- Aufhebungs- und Löschkennzeichen;
- Storno-/Gutschriftfeldern und ihrer klaren Abgrenzung zu fachlichen
  Grab-/Vorgangsständen;
- Aktualisierungsreihenfolge abhängiger Bestände bei Nummernänderung.

Die gezielte Suche darf weitere Bereiche von `W020`, `W021`,
`buch/BUCHA/Buchalt`, `W040/W040alt`, `W022`, `W023` und `DRAUF` strukturell
einbeziehen. Dekodiere dabei keine Notiz-/Hinweis-/Freitextinhalte und beginne
keine vollständige Rekonstruktion der nachrangigen Bereiche.

Erstelle eine Status-/Nachfolgermatrix mit mindestens:

- Kandidatenfeld und 1-basiertem Offset/Länge, sofern bekannt;
- statischem Programmnamen und beobachteter Kontrollverwendung;
- aggregierter Belegung und Zeichenklasse;
- Beziehung zu Haupt-, Vorgangs- und abhängigen Schlüsseln;
- Gegenbelegen und Verwechslungsrisiken;
- Status `BESTÄTIGT`, `WIDERLEGT` oder `OFFEN` sowie Konfidenz;
- sicherer späterer Filterregel oder ausdrücklichem Verbot einer Filterung.

Eine Regel zum Ausschluss überholter Datensätze ist nur dann `BESTÄTIGT`, wenn
Altstand und gültiger Nachfolger eindeutig bestimmbar sind und die Regel an
abhängigen `W021/W023/DRAUF`- beziehungsweise Bescheidbezügen aggregiert
validiert wurde. Andernfalls bleibt die Regel `OFFEN`; es wird nichts
ausgeschlossen.

## Technische Umsetzung im externen Profiler

Erweitere den Phase-3-Prototyp bevorzugt deklarativ um:

- Feldkandidaten mit Datei, 1-basiertem Offset, Länge, Kandidatentyp und
  Evidenz;
- pro Feld Anzahlen für SP, Nullbyte, Nullwert, Ziffern, druckbares ASCII,
  Windows-1252-High-Bytes, Steuerbytes und gemischte Werte;
- Längenverteilungen getrimmter Textkandidaten ausschließlich als Histogramm;
- Datumsformatprofile mit gültig/leer/ungültig, ohne Werte oder Min/Max-Datum;
- Distinct- und Häufigkeitsprofile nur über Hashes; keine beobachteten Codewerte
  ausgeben;
- positionsweise Grenzsignale wie Belegungs-, Zeichenklassen- und
  gemeinsame Änderungsübergänge;
- gehashte Beziehungen zwischen bekannten Schlüssel-/Teilfeldkandidaten;
- deklarative Status-/Nachfolgerhypothesen einschließlich Negativbefunden;
- getrennte Beobachtung und Interpretation im JSON.

Nichtpersonenbezogene Literale aus statischem Programmcode dürfen nur dann
abstrakt dokumentiert werden, wenn sie für eine Kontrollregel notwendig sind.
Beobachtete Quelldatenwerte, auch vermeintlich harmlose Namen, Nummern, Orte,
Codes oder Daten, niemals in Konsole, JSON, Logs oder Repository schreiben.

Eine Kandidatengrenze gilt nur als bestätigt, wenn sie über die relevanten
nichtleeren Sätze trägt und durch mindestens eine unabhängige Evidenz gestützt
wird. Gescheiterte Hypothesen aggregiert dokumentieren, damit sie nicht später
erneut als Tatsache erscheinen.

## Dokumentationsergebnis

Aktualisiere insbesondere:

- `docs/migration/edwalt-source-field-catalog.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/README.md`
- bei neuen oder widerlegten Belegen die passenden Dokumente unter
  `docs/requirements/edwalt-analysis`

Ergänze für jedes aufgeteilte Einzelfeld beziehungsweise jeden verbleibenden
zusammenhängenden Bytebereich mindestens:

- Quelldatei;
- 1-basierten Offset und Länge;
- bekannte Indexzugehörigkeit;
- technischen Datentyp und Format-/Encodinghypothese;
- Null-/Leer-/Füllverhalten;
- fachliche Rolle einschließlich klarer Trennung von Person und Adressrolle;
- konkrete Evidenz und Gegenbelege;
- Konfidenz;
- Schlüssel und Beziehungen;
- Datenschutzklasse;
- Datenqualitätsrisiko;
- Status `migrieren`, `nicht migrieren`, `manuell nachtragen` oder `ungeklärt`;
- Begründung, Validierungsregel und offene Frage.

Die Satzlängen und lückenlose Abdeckung dürfen durch die Verfeinerung nicht
verloren gehen. Ersetze einen Sammelbereich nur durch Teilbereiche, deren Längen
zusammen exakt denselben Bereich ergeben. Unbekannte Restbytes bleiben als
eigene lückenlose Zeilen erhalten.

Erstelle oder aktualisiere zusätzlich:

- eine Rollenmatrix für Nutzungsberechtigte, Empfänger, verstorbene Person,
  Bestatter und weitere nur statisch genannte Rollen;
- eine Ereignis-/Datumsmatrix mit Format, Rolle, Gegenbeleg und Leersemantik;
- die Status-/Umnummerierungs-/Nachfolgermatrix;
- aggregierte Datenqualitäts- und Referenzfehlerzahlen;
- die migrationsrelevante Quellbeziehungsmatrix;
- einen priorisierten Restarbeitsplan;
- einen neuen eigenständigen Übergabeprompt für den danach folgenden Schritt,
  falls der nächste Schritt technisch ausführbar ist.

Keine echten Daten, vollständigen Extrakte, Feldwerte, Binärdateien oder großen
JSON-Berichte ins Repository aufnehmen.

## Abgrenzung

Noch nicht:

- Cemaris-Fachmodell oder vorhandenes `Read*`-Schema als Ziel übernehmen;
- Quell-zu-Ziel-Mapping oder SQL-Schema verändern;
- Import-/Migrationswerkzeug implementieren;
- EDWALT-Dateien 1:1 als Domainmodell nachbauen;
- Personen oder Adressen zusammenführen oder Dubletten automatisch bereinigen;
- `W022`-Notizen oder freie W021/W023-Hinweise inhaltlich auswerten;
- die Finanz-/Positionshypothesen der abgeschlossenen Phase wiederholen;
- `W023`, `W080`, `DRAUF`, `STATIST`, `W004`, `W010` oder Variantenfamilien
  vollständig rekonstruieren;
- Statuscodes, Vorgangsarten, Rollen oder Nachfolgersemantik erfinden;
- physische Löschsätze als fachliche Stornos behandeln;
- Originalbestand oder Altprogramm ausführen oder verändern.

Stelle nur Fragen, wenn eine nicht technisch ermittelbare Entscheidung die
weitere Analyse wirklich blockiert. Nicht entscheidbare Semantik als `OFFEN`
dokumentieren und mit den übrigen Bereichen fortfahren.

## Abschlussprüfung

- neuen externen Prototyp mit .NET SDK 10.0.302 bauen; keine Warnungen/Fehler;
- aggregierten Phase-3-Bericht reproduzierbar erzeugen;
- Bericht weiterhin auf 24 logische und 24 vollständige physische Profile und
  fehlerfreie Parserläufe prüfen;
- neue Feldbereiche, Hypothesen, Statuskandidaten und Negativbefunde auf
  erwartete Mengen und vollständige Ausgabe prüfen;
- Originale erneut per SHA-256 gegen die sicheren Phase-2-Kopien vergleichen:
  150 Dateien unter `EDW3DAT`, 447 unter `Edwalt3`, keine fehlenden,
  zusätzlichen, Längen- oder Hashabweichungen;
- `git status --short --branch` und sämtliche Änderungen prüfen;
- `git diff --check` ausführen;
- lokale Markdown-Links prüfen;
- neue Tabellen auf konsistente Spalten prüfen;
- alle verfeinerten Bereiche auf lückenlose, überschneidungsfreie Summen und
  unveränderte Satzlängen prüfen;
- nach personenbezogenen Beispieldaten, Feldwerten, Zugangsdaten und
  versehentlich in Git gelangten DAT/IDX/RAW/JSON/Binärdateien suchen;
- bestätigen, dass Originale und Phase-2-Basis unverändert blieben;
- keine Commits durchführen.

Berichte abschließend nach Priorität:

1. welche W020-/W021-Einzelfelder belastbar identifiziert wurden;
2. welche Personen- und Adressrollen getrennt werden konnten;
3. welche Ereignis-/Datumsformate und fachlichen Rollen bestätigt oder
   widerlegt wurden;
4. ob Storno, Aufhebung, Umnummerierung und gültiger Nachfolger technisch
   sicher erkannt werden können;
5. welche Filterregel dadurch erlaubt ist oder ausdrücklich offen bleibt;
6. welche Bytebereiche und Semantiken offen bleiben;
7. welcher danach folgende Arbeitsschritt konkret empfohlen wird.
```

## Erwarteter Abschlusszustand

Der Folgechat ist abgeschlossen, wenn `W020` 91–620 und `W021` 29–1.400
feldgenauer und weiterhin lückenlos dokumentiert sind, die Rollen- und
Ereignisgrenzen soweit lokal belegbar feststehen und jede Status-/Nachfolger-
hypothese sichtbar bestätigt, widerlegt oder `OFFEN` ist. Eine nicht sicher
entscheidbare Nachfolgerregel blockiert die übrige Quellrekonstruktion nicht,
darf aber auch zu keinem Ausschluss führen.

Erst danach folgen die weiteren Adressrollen und Grabzustands-/FUG-Bereiche in
`W020`, der W021-Nachlauf, die semantische Prüfung von `W023` mit ausdrücklicher
Datenschutz-/Zweckfreigabe sowie die Varianten- und nachrangigen Bestände. Ein
unabhängiges Cemaris-Fachkonzept beginnt erst, wenn die migrationspflichtige
Quellsemantik ausreichend belastbar ist.
