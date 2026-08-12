# Übergabe: EDWALT-Gebührenstamm- und Variantenabgrenzung

Stand: 12.08.2026

> **Status:** vollständig vorbereitet, aber nach der Projektentscheidung vom
> 12.08.2026 zugunsten der Cemaris-Produktentwicklung pausiert. Nicht ausführen,
> solange die Mapping-/Importphase nicht ausdrücklich wieder aufgenommen wurde.
> Die Phase-5-Wurzel wurde noch nicht angelegt.

## Ziel des nächsten Schritts

Der nächste Migrationsschritt grenzt ausschließlich `W005/W005dm` und
`W006/W006dm` feldweise gegeneinander ab. Er soll klären, welche Bereiche
strukturell gemeinsam, erweitert, nur in einer Variante vorhanden,
nullinitialisiert oder wirklich fachlich abweichend sind. Eine Regel
„aktuell“, „historisch“, „DM“ oder „migrieren“ entsteht nur bei unabhängiger
statischer und datenstruktureller Evidenz.

Der Schritt erstellt noch kein Cemaris-Gebührenmodell, keine Betragsumrechnung,
kein Quell-zu-Ziel-Mapping und keinen Import. `BUCHA/Buchalt`, `W040alt`, W020,
W021, W022 und W023 liegen außerhalb dieses Auftrags.

## Verifizierter Ausgangsstand

- Phase 2 enthält 24 feste, unkomprimierte Satzextrakte; Bericht SHA-256
  `E1D3C0C06A725ECAF947BEB6438B024EE9062B234F8ADFB8A37636C8275A1CE6`.
- Phase 3 enthält 24 logische und 24 vollständige physische Profile, 0
  Parserfehler; Bericht SHA-256
  `43F8749A4E1C3AC4390FFD56EA33106056D99A1CA03D8E8F4CA517D892438A48`.
- Phase 4 enthält zusätzlich 38 W020- und 22 W021-Profile mit Coverage
  1.064/1.064, 306/306 und 1.074/1.074 Byte. Der Bericht ist
  `28.486.236` Byte groß; SHA-256
  `8B87C19053477072E1994D1EFC4038AEF293DD0AA583F71748C90887CD3D7AF4`.
- Die regulären sicheren Kopien stimmen mit den Originalen überein:
  `EDW3DAT` 148/148 und `Edwalt3` 444/444 Dateien; keine Pfad-, Längen- oder
  Hashabweichung. `Thumbs.db` und Office-Sperrdateien sind von der regulären
  Bestandszahl ausgenommen.
- Die Phase-4-Profilerbasis umfasst `Program.cs`, `FinancialProfiler.cs`,
  `PersonRightsStatusProfiler.cs`, `AdditionalAddressesProfiler.cs` und
  `Edwalt.Phase2Profiler.csproj`. Ihre Abschluss-Hashes stehen im externen
  Phase-4-README beziehungsweise sind vor dem Kopieren neu zu ermitteln.

### Bereits bekannte Variantenmengen

| Paar | Satzlängen | Sätze | gemeinsame PK | nur aktuell | nur DM |
| --- | --- | ---: | ---: | ---: | ---: |
| `W005/W005dm` | 1.414 / 323 | 18 / 38 | 14 | 4 | 24 |
| `W006/W006dm` | 392 / 392 | 26 / 335 | 20 | 6 | 315 |

Bei `W005` ist 1–236 der gemeinsame strukturelle Präfix. Die aktuelle Variante
besitzt 237–266/L30 und 285–289/L5 als im untersuchten Bestand vollständig
SP-gefüllte Einschübe. `W005` 267–284 entspricht strukturell `W005dm`
237–254, `W005` 290–358 entspricht `W005dm` 255–323. `W005` 359–1414/L1056
ist vollständig SP. Diese Ausrichtung ist technisch, nicht als Währungs- oder
Gültigkeitsregel bestätigt.

Bei `W006/W006dm` sind Satzlänge und Schlüssel 1–10 gleich. 11–115 enthält
drei 35-Byte-Bescheidtexte, 116–135 die Mengeneinheit, 136–138 einen statisch
benannten, aber semantisch widerlegten direkten „Nachkommastellen“-Kandidaten,
139–194 einen ungetrennten Gebührenblock, 195–201 eine aktuelle
Initialerweiterung gegenüber SP in `W006dm` und 202–392 eine in beiden
Varianten vollständig SP-gefüllte Reserve.

## Verbindliche Schutzregeln

1. Originale, Phase 2, Phase 3 und Phase 4 sind strikt read-only.
2. Analysen verwenden ausschließlich die sicheren Phase-2-Kopien und
   `raw-uncompressed`. Originale dienen nur dem abschließenden lesenden
   SHA-256-Vergleich.
3. EDWALT, Originalprogramme, GS-Module, Makros, Batchdateien, Rebuild-,
   Reorg-, Reparatur- und unbekannte EXE-Programme niemals ausführen.
4. Keine Quellwerte, Namen, Anschriften, Grabnummern, Gebührenbezeichnungen,
   Beträge, Kassenzeichen, Buchungstexte, Kommentare oder andere Einzelwerte
   ausgeben. Freitexte nicht inhaltlich dekodieren.
5. Schlüssel und Feldwerte zwischen Varianten ausschließlich SHA-256-gehasht
   vergleichen. Berichte enthalten nur Mengen, Profile, Hashanzahlen und
   Regeln, niemals einzelne Hashwerte als rückverfolgbare Wertlisten.
6. Hilfscode, Buildartefakte, statische Aggregate und JSON-Berichte bleiben
   vollständig außerhalb des Repositories im neuen Phase-5-Arbeitsbereich.
7. Keine Beträge oder Dezimalwerte raten, casten oder umrechnen. Insbesondere
   Währung, Vorzeichen, Skala, Rundung, Brutto/Netto und der Kandidat
   „Nachkommastellen“ bleiben `OFFEN`, bis mindestens zwei Evidenzarten tragen.
8. `dm` im Dateinamen und Zeitstempel aus 2002 sind Indizien, aber allein kein
   Beleg für fachliche Historie, Währung oder Vorrang.
9. Nur bei einer eindeutigen, reproduzierbaren Regel darf eine Variante als
   rein technisch, historisch ergänzend oder redundant gelten. Andernfalls
   beide getrennt erhalten.
10. Keine Commits durchführen.

## Arbeitsverzeichnisse

Originale, strikt read-only:

- `C:\Users\Benke\Documents\Friedhofsverwaltung\EDW3DAT`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3`
- `C:\Users\Benke\Documents\Friedhofsverwaltung\Edwalt3\EDWHELP`

Verifizierte Phase-2-Basis, read-only:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811`
- sichere Kopien: `EDW3DAT` und `Edwalt3`
- Satzextrakte: `raw-uncompressed`
- Bericht: `report.json`

Abgeschlossene Phase 3, read-only:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase3-person-rights-status-20260812`

Abgeschlossene Phase 4, read-only:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase4-additional-addresses-20260812`
- Profiler: `prototype`
- statische Aggregate: `static-analysis`
- Bericht: `report.json`

Neuer beschreibbarer Phase-5-Arbeitsbereich:

- `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-fee-master-variants-20260812`
- Profiler: `prototype`
- statische Aggregate: `static-analysis`
- Bericht: `report.json`

Lokales SDK:

- `C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Die Phase-5-Wurzel darf nur nach erneuter Nichtexistenzprüfung angelegt werden.
Falls sie existiert, Inhalt untersuchen und erhalten; keine fremde Arbeit
überschreiben. Als Profilerbasis nur die fünf C#-/Projektdateien aus Phase 4
kopieren, nachdem deren Hashes geprüft wurden. Keine Berichte, RAW-Dateien,
`bin`, `obj` oder Logs übernehmen.

## Arbeitsprioritäten

### 1. `W005/W005dm`

- Beide Satzlayouts lückenlos und überschneidungsfrei abgrenzen: W005
  1–1.414, W005dm 1–323.
- PK 1–10 und Alternativindex 11–15 unverändert erhalten.
- 1–236 feldweise nur soweit trennen, wie statische Feldreihenfolge,
  Zeichenprofile und gemeinsame Schlüssel dieselben Grenzen bestätigen.
- Einschübe 237–266 und 285–289 der aktuellen Variante separat erneut auf
  vollständige SP-Belegung prüfen.
- Die ausgerichteten Paare 267–284 ↔ 237–254 und 290–358 ↔ 255–323 auf
  Gleichheit, Abweichung, Null-/SP-Verhalten und Zeichenklasse vergleichen.
- Für alle 14 gemeinsamen Schlüssel je Feld nur aggregierte SHA-256-
  Gleichheitszahlen ausgeben. Die 4 nur aktuellen und 24 nur DM-Schlüssel
  getrennt zählen, nicht als Dubletten oder Altbestand klassifizieren.
- Verwaltungs-, Bezeichnungs-, Kommentar-, Kapazitäts-, Nutzungs-,
  Ruhefrist-, Preis-, Haushaltsstellen-, Kostenstellen-, Kumulations-,
  Währungs- und Satzungskandidaten nur bei unabhängiger Evidenz benennen.

### 2. `W006/W006dm`

- Beide 392-Byte-Sätze lückenlos und überschneidungsfrei abgrenzen.
- Schlüssel 1–10, drei Textzeilen 11–115 und Mengeneinheit 116–135 als
  bereits technisch getrennte Basis erhalten.
- 136–138/L3 gegen statische Masken und alle Variantenprofile prüfen; wegen
  der widerlegten direkten Skalenwerte keine Parserregel „Anzahl
  Nachkommastellen“ zulassen.
- 139–194/L56 feldgenau nur soweit verfeinern, wie statische Namen/Masken,
  wiederholte Struktur, gemeinsame Schlüssel und arithmetische Konsistenz
  unabhängig zusammenpassen. Keine Quellbeträge ausgeben.
- 195–201/L7 als aktuelle Initialerweiterung gegenüber SP in W006dm prüfen;
  nicht automatisch als Euro-/Währungsfeld benennen.
- 202–392/L191 in beiden Varianten erneut vollständig auf SP prüfen.
- Für 20 gemeinsame Schlüssel feldweise gehashte Gleichheit und Abweichung
  ausgeben. 6 nur aktuelle und 315 nur DM-Schlüssel getrennt erhalten.
- Den bereits bestätigten W021-Gebührennummernbezug relativ 73/L4 nur als
  gehashte Mengenprüfung wiederholen; W021-Inhalte nicht erneut profilieren.

### 3. Sichere Variantenregel

Für jede Hypothese getrennt dokumentieren:

- Beobachtung und Interpretation;
- Evidenztyp und Fundstelle;
- Konfidenz und Status `BESTÄTIGT`, `OFFEN` oder `WIDERLEGT`;
- Null-/Leer-/Initialwertbehandlung;
- Datenschutz- und Migrationsrisiko;
- erlaubte Parserfolge und verbotene Folgerung;
- Behandlung gemeinsamer, nur aktueller und nur DM-Schlüssel.

Ohne belastbaren Gültigkeits-/Währungsbeleg lautet die sichere Regel:
Varianten getrennt erhalten, keine automatische Vereinigung, kein Vorrang,
keine Währungsumrechnung und kein Datensatzverlust.

## Profiler und Bericht

Die neue Logik soll vorzugsweise in
`prototype\FeeMasterVariantsProfiler.cs` liegen und als eigener Berichtsteil
in `Program.cs` eingebunden werden. Bestehende Phase-4-Ausgaben bleiben
unverändert. Der Profiler muss Coverage-Verletzungen beim Start abbrechen und
darf keine Feldwerte ausgeben.

Mindestausgaben:

- deklarative Felddefinitionen und Coverage für alle vier Sätze;
- feldweise Null-, SP-, Nullwert-, Zeichenklassen-, Hashanzahl- und
  Längenprofile;
- aggregierte SHA-256-Gleichheit für gemeinsame Schlüssel;
- getrennte Mengen für gemeinsame und exklusive Schlüssel;
- Alignmentbericht W005 aktuell ↔ DM;
- Kandidatenprüfungen für Datum, Skala, Währung und Dezimaldarstellung nur bei
  technisch plausibler Länge;
- Positiv- und Negativbefunde;
- explizite Variantenhypothesen und sichere Parserfolgen.

Zulässiger Aufruf:

```powershell
& 'C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe' `
  run --project 'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-fee-master-variants-20260812\prototype\Edwalt.Phase2Profiler.csproj' `
  --configuration Release --no-build -- `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811\raw-uncompressed' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase2-20260811' `
  'C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-fee-master-variants-20260812\report.json'
```

## Dokumentation und Abschlussprüfung

Mindestens zu aktualisieren:

- `docs/migration/README.md`
- `docs/migration/edwalt-source-analysis.md`
- `docs/migration/edwalt-extraction-prototype.md`
- `docs/migration/edwalt-source-field-catalog.md`
- passende Dokumente unter `docs/requirements/edwalt-analysis`

Am Ende eine neue eigenständige Folgeübergabe erstellen und zentral verlinken.

Abschlussprüfungen:

- Git-Status, vollständigen Diff und unversionierte Dateien vor und nach der
  Arbeit prüfen; keine fremden Änderungen überschreiben;
- Build mit SDK 10.0.302, 0 Warnungen und 0 Fehler;
- Bericht zweimal mit identischen Argumenten erzeugen; Größe und SHA-256 müssen
  byteidentisch sein;
- weiterhin 24 logische und 24 vollständige physische Profile sowie 0
  Parserfehler;
- Coverage W005 1.414/1.414, W005dm 323/323, W006 392/392 und W006dm 392/392;
- Originale erneut gegen sichere Phase-2-Kopien hashen: regulär 148/148 und
  444/444, keine fehlenden/zusätzlichen/Längen-/Hashabweichungen;
- `git diff --check`, lokale Markdown-Links und Tabellenspalten prüfen;
- nach personenbezogenen Beispieldaten, Zugangsdaten und versehentlich in Git
  gelangten DAT-/IDX-/RAW-/JSON-/Binärdateien suchen;
- bestätigen, dass Originale sowie Phase 2, 3 und 4 unverändert blieben;
- keine Commits durchführen.

## Direkt kopierbarer Prompt

````text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/migration/edwalt-fee-master-variants-next-step-handoff.md

Führe anschließend den dort beschriebenen Arbeitsauftrag vollständig aus.
Übernimm alle Schutzregeln, Arbeitsprioritäten, Abgrenzungen,
Evidenzanforderungen, Dokumentationsergebnisse und Abschlussprüfungen
verbindlich.

Verwende ausschließlich die im Übergabedokument festgelegten Original-,
Phase-2-, Phase-3-, Phase-4- und Phase-5-Arbeitsverzeichnisse. Originale sowie
Phase 2, 3 und 4 sind read-only. Prüfe vor dem Anlegen der Phase-5-Wurzel, ob
sie inzwischen existiert; erhalte vorhandene fremde Arbeit.

Beginne mit Git-, Dokumenten-, Arbeitsverzeichnis-, Hash- und
Integritätsprüfungen. Analysiere nur sichere Phase-2-Kopien und -Extrakte;
Originale dienen nur dem abschließenden lesenden Hashvergleich. EDWALT,
Originalprogramme, GS-Module, Makros, Batchdateien, Rebuild-, Reorg-,
Reparatur- oder unbekannte EXE-Programme niemals ausführen.

Gib keine Quellwerte, Namen, Anschriften, Grabnummern,
Gebührenbezeichnungen, Beträge, Kassenzeichen, Buchungstexte, Kommentare oder
sonstigen Einzelwerte aus. Vergleiche Schlüssel und Variantenfelder nur
SHA-256-gehasht. Berichte und Hilfscode bleiben vollständig außerhalb des
Repositories im Phase-5-Arbeitsbereich.

Rekonstruiere W005/W005dm und W006/W006dm lückenlos. Belege gemeinsame,
eingeschobene, exklusive, leere und abweichende Bereiche. Erzeuge eine
Varianten-, Währungs-, Gültigkeits- oder Dezimalregel nur bei mindestens zwei
unabhängigen Evidenzarten. Andernfalls dokumentiere `OFFEN`, erhalte beide
Varianten und fahre mit den übrigen Arbeiten fort. Erstelle weder Import noch
Cemaris-Zielmodell oder Feldmapping.

Stelle nur dann eine Frage, wenn eine nicht technisch ermittelbare Entscheidung
die weitere Analyse tatsächlich blockiert. Führe keine Commits durch.
````
