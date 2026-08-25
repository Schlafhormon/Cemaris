# EDWALT-Friedhofsstammdatenmapping für Inkrement 5k

Stand: 25. August 2026

## Zweck und harte Grenze

Dieses Mapping beschreibt ausschließlich die nicht personenbezogene,
positiv gelistete Teilmenge für Inkrement 5k. Zulässige Eingaben sind genau
die drei bereits vorhandenen Phase-2-Extrakte `W005.raw`, `W005dm.raw` und
`W020.raw`. Alle bestehenden Phase-2-, Phase-3- und Phase-4-Verzeichnisse
bleiben read-only. EDWALT wird weder gestartet noch erneut extrahiert.

Das versionierte Werkzeug akzeptiert produktiv nur die freigegebene
Phase-2-Wurzel und schreibt Laufartefakte nur in die freigegebene neue
Phase-5-Wurzel. Tests verwenden getrennte, rein synthetische Binärfixtures.

## Positivliste

Offsets sind nullbasiert; die fachlichen Positionen in Klammern sind
einsbasiert. Der Parser springt für jedes Feld gezielt an die angegebene
Position und liest niemals einen vollständigen Satz.

| Quelle | Satzlänge | Offset | Länge | belegte Verwendung |
| --- | ---: | ---: | ---: | --- |
| `W005.raw` | 1.414 | 0 (1) | 2 | Mandantenschlüssel nur für Quellidentität und Gruppierung |
| `W005.raw` | 1.414 | 2 (3) | 4 | Friedhofscode |
| `W005.raw` | 1.414 | 6 (7) | 4 | Grabartcode; ohne Beisetzungsform noch kein Zielobjekt |
| `W005.raw` | 1.414 | 15 (16) | 35 | Friedhofsbezeichnung |
| `W005.raw` | 1.414 | 86 (87) | 30 | erster Teil der Grabartbezeichnung |
| `W005.raw` | 1.414 | 116 (117) | 30 | optionaler zweiter Teil der Grabartbezeichnung |
| `W005dm.raw` | 323 | dieselben sechs Bereiche | dieselben Längen | historischer Gegenbeleg; kein Importvorrang |
| `W020.raw` | 2.693 | 0 (1) | 2 | Mandantenschlüssel nur für Quellidentität und Gruppierung |
| `W020.raw` | 2.693 | 2 (3) | 4 | Friedhofscode |
| `W020.raw` | 2.693 | 6 (7) | 20 | ungeteilter technischer Struktur-/Grabstellenschlüssel |

Insbesondere `W005` Position 51–85 und sämtliche nicht aufgelisteten Bytes
werden nicht dekodiert. Aus `W020` werden nur die ersten 26 Bytes in den drei
genannten Segmenten gelesen. Personen-, Adress-, Suchcode-, Rechte-, Fall-,
Beisetzungs-, Vorgangs-, Gebühren-, Bescheid-, Buchungs-, Notiz-, Dokument-,
Benutzer- und Konfigurationsbereiche sind ausgeschlossen.

## Evidenz und Variantenregel

Die Feldgrenzen beruhen auf zwei voneinander unabhängigen Belegarten:

1. statische Datenblockdefinitionen des vorhandenen kompilierten
   Micro-Focus-Dialog-System-Screensets; laut Hersteller enthält eine
   Screenset-Datei den Data Block und dessen Datendefinitionen
   ([Dialog System overview](https://www.microfocus.com/documentation/reuze/60d/dsintr.htm),
   [Data Block](https://www.microfocus.com/documentation/reuze/60d/dsdatd.htm));
2. das vorhandene positionsweise Phase-2-Profil mit den exakten physischen
   Längen und Zeichenklassen der sechs freigegebenen Bereiche.

Das Screenset wurde nur statisch gelesen und nicht ausgeführt. Bei allen 14
gemeinsamen Schlüsseln stimmen die positiv gelisteten Nutzbereiche von
`W005` und `W005dm` überein. `W005` enthält zusätzlich vier, `W005dm`
zusätzlich 24 Schlüssel. Zusammen mit dem belegten Dateistand wird `W005`
deshalb als aktuelle Quelle verwendet; `W005dm` bleibt ausschließlich
historischer Gegenbeleg. Abweichungen gemeinsamer sicherer Nutzbereiche oder
doppelte Schlüssel blockieren den Lauf.

## Zielmapping und bewusste Ausschlüsse

Der aktuelle Dry-run plant zwei eindeutige Friedhöfe. Die Ziel-ID wird
deterministisch aus Quellart, Mandant und Friedhofscode gebildet. Name und Code
durchlaufen die vorhandenen Domainregeln; Zielkollisionen blockieren den
gesamten Import.

Die 18 aktuellen Grabartsätze bilden für die zwei eindeutigen Friedhöfe neun
fachlich bestätigte Grabarten und 18 Friedhof-Grabart-Zuordnungen. Die am
25.08.2026 außerhalb der EDWALT-Quelle bestätigte lokale Entscheidung ordnet
zwei Grabarten der Erdbestattung, vier der Urnenbestattung und drei der
gemischten Belegung zu; alle neun sind aktiv. Sie liegt ausschließlich als
anonyme Zuordnungsdatei in der Phase-5-Arbeitswurzel. Das versionierte
Repository enthält weder Quellcodes noch Quellbezeichnungen oder kommunale
Zielnamen.

Die Zuordnung wird über Datensatz-Fingerprints an genau den analysierten
Datenstand gebunden. Fehlende, zusätzliche, doppelte oder widersprüchliche
Entscheidungen blockieren Dry-run, Import und Reconciliation vollständig.
`analyze` bleibt ohne diese lokale Entscheidung möglich und gibt nur
technische Anzahlen aus.

Alle 2.718 W020-Rohsätze werden gezählt. Ein vollständig leerer technischer
Satz wird als nicht blockierender Ausschluss ausgewiesen. Kein W020-Satz wird
importiert, weil weder eine belastbare Aufteilung des 20-Byte-Schlüssels in
Bereich/Feld/Reihe/Grabnummer noch eine Grabartrelation belegt ist. Es werden
keine Hierarchie, Grabart, Kapazität oder Statuswirkung geraten.

## Lauf- und Berichtskonzept

`Cemaris.EdWaltMigration` stellt `analyze`, `dry-run`, `apply` und
`reconcile` bereit. Berichte enthalten ausschließlich technische Anzahlen,
Fehlerklassen und anonyme Quellkennungen. Namen, Codes, Strukturwerte,
Verbindungsdaten und lokale Quellpfade werden nicht geschrieben.

`apply` verlangt gleichzeitig:

- einen aktuellen erfolgreichen Dry-run derselben Daten- und Planfassung;
- `Development` und den SQL-Provider;
- die konfigurierte und ausdrückliche Bestätigung `Cemaris_Dev`;
- ein vollständig migriertes Schema;
- den nach Verbindungsöffnung exakt aufgelösten Datenbanknamen
  `Cemaris_Dev`.

Der Import verwendet den vorhandenen Application-Service und EF-Store unter
einer äußeren serialisierbaren Transaktion. Er legt nur fehlende,
deterministische Ziele mit einem technischen Migrationsakteur an. Identische
Ziele bleiben unverändert; abweichende IDs, Namen, Codes oder
Änderungsnachweise führen zum vollständigen Rollback. `reconcile` und ein
zweiter `apply` weisen Vollständigkeit und Idempotenz nach.
