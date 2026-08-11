# MVP-Entscheidungen: Lesende Suche und Detailansicht

> Status: `BESTAETIGT`, soweit nicht ausdruecklich als offene Rueckfrage markiert.
> Quelle: Projektklaerung vom 2026-08-11.

Dieses Dokument konkretisiert `REQ-MVP-001` bis `REQ-MVP-004` fuer den ersten
Implementierungsabschnitt. Es ersetzt kein endgueltiges Fachmodell und fuehrt
keine schreibenden Fachprozesse ein.

## Ziel und Abgrenzung

- Der erste nutzbare Abschnitt besteht ausschliesslich aus lesender Suche und
  lesender Detailansicht.
- Erfassung, Bearbeitung, Loeschen, Gebuehrenberechnung, Bescheiderstellung,
  Dokumenterzeugung, Winyard-Ablage, Fristenberechnung und weitere
  Schreibfunktionen sind nicht Teil dieses Abschnitts.
- EDWALT-Datenmigration wird erst umgesetzt, nachdem der erste Abschnitt mit
  synthetischen Daten funktioniert.
- FINANZ+ kommt in diesem Abschnitt nur indirekt ueber spaeter migrierbare
  Bescheid- und Gebuehreninformationen vor. Zahlungsstatus und Mahnungen werden
  nicht angezeigt.

## Datenbasis und Datenbank

- Die Implementierung soll eine echte Datenbankstruktur vorbereiten, weil
  Cemaris spaeter auf Microsoft SQL Server betrieben werden soll.
- Fuer die erste Entwicklung werden ausschliesslich synthetische Daten im
  Repository verwendet.
- Synthetische Daten duerfen im Repository abgelegt werden und sollen klar als
  kuenstlich erkennbar sein.
- Echte EDWALT-Testdaten werden nicht im Repository abgelegt. Ein spaeterer
  kontrollierter Testbestand liegt lokal beziehungsweise in einer lokalen
  Datenbank ausserhalb von Git.
- Das erste Datenmodell darf ein bewusst schmales, neutrales Lesemodell sein.
  Es ist noch kein endgueltiges Domainmodell.
- Das Lesemodell soll mit neutralen Begriffen benannt werden, zum Beispiel
  `SearchRecord`, `CaseOverview` oder `GraveDetails`, statt fachliche Regeln
  vorwegzunehmen.

## Suche

- Die erste Suchseite erhaelt diese Filter:
  - Name,
  - Vorname,
  - Geburtsdatum,
  - Sterbedatum,
  - Friedhof,
  - Feld,
  - Grabnummer,
  - Beisetzungsdatum,
  - Nutzungsberechtigte,
  - Anschrift,
  - Bescheidnummer.
- Textsuche erfolgt in der ersten Version exakt beziehungsweise als Teiltreffer.
  Unscharfe Suche ist nicht Teil der ersten Version.
- Gesetzte Filter werden mit UND-Logik kombiniert.
- Suche ohne Filter ist erlaubt.
- Die Trefferzahl ist standardmaessig auf maximal 10 begrenzt und technisch
  konfigurierbar.
- Paginierung ist in der ersten Version nicht erforderlich.

## Trefferliste

- Die Trefferliste soll die relevanten zusammenhaengenden Informationen zeigen,
  sodass eine Suche nach einer verstorbenen Person nicht nur einen isolierten
  Personendatensatz, sondern den fachlichen Zusammenhang sichtbar macht.
- Vorgesehene Spalten:
  - verstorbene Person,
  - Geburtsdatum,
  - Sterbedatum,
  - Friedhof,
  - Feld,
  - Grabnummer,
  - Beisetzungsdatum,
  - Nutzungsberechtigte,
  - Bescheidnummer.
- Bei mehreren Verstorbenen, Nutzungsberechtigten oder Adressen sollen alle
  relevanten Werte angezeigt werden, insbesondere bei einer Suche nach
  Grabstelle.

## Detailansicht

- Die Detailansicht bekommt in der ersten Version diese Bereiche:
  - Grabstelle,
  - Verstorbene,
  - Beisetzungen,
  - Nutzungsrechte und Laufzeiten,
  - Berechtigte und Adressen,
  - Bescheide und Gebuehreninformationen.
- Fehlende Daten oder unvollstaendige Beziehungen sollen sichtbar gemacht
  werden.
- Zahlungsstatus und Mahnungen werden nicht angezeigt, auch nicht als
  Platzhalter.
- Dokumente und Winyard-Bezuege werden in der ersten Version ausgeblendet.
- Die konkrete Feldliste wird waehrend der Implementierung konservativ aus den
  genannten Bereichen abgeleitet und danach fachlich geprueft.

## Berechtigungen

- Version 1 laeuft ohne Login.
- API und UI sollen so vorbereitet werden, dass Authentifizierung und
  Autorisierung spaeter ergaenzt werden koennen.
- Fuer Version 1 wird nur eine volle Lesesicht angenommen. Eine feinere
  Rollentrennung folgt spaeter.

## API und UI

- Die API soll REST-Endpunkte fuer Suche und Detailansicht anbieten, zum
  Beispiel `/api/search` und `/api/cases/{id}`.
- OpenAPI soll fuer die neuen Endpunkte verfuegbar sein.
- Das Frontend erhaelt eine eigene Suchseite.
- Die bestehende Startseite mit Projektstatus bleibt erhalten.
- Die UI soll wie ein nuechternes Fachverfahren wirken: kompakt, scanbar,
  wenig visuelle Dekoration.

## Abnahme

- Der Abschnitt gilt als umsetzungsseitig fertig, wenn die Suche mit
  synthetischen Testdaten funktioniert und die Detailansicht die zugehoerigen
  Beziehungen lesend nachvollziehbar zeigt.
- Relevante Backend-Tests, Frontend-Linting, Frontend-Build und
  API-Integrationstests sollen automatisiert pruefbar sein.
- Die fachliche Abnahme beziehungsweise offene Abweichungen werden in
  `docs/requirements` dokumentiert.

## Konkretisierte Implementierungsentscheidungen

| ID | Thema | Entscheidung |
| --- | --- | --- |
| MVP-DEC-001 | Mindestlaenge | Textfilter verwenden eine Mindestlaenge von 2 Zeichen. Fuer Datums- und Nummernfelder gilt diese Mindestlaenge nicht. |
| MVP-DEC-002 | Sortierung | Relevanz bedeutet in Version 1: exakte Treffer vor Praefix-Treffern vor Teiltreffern, danach mehr passende Felder, danach stabile Sortierung nach Friedhof/Feld/Grabnummer. |
| MVP-DEC-003 | Datenbanktests | Die normale Testbasis darf ohne lokalen SQL Server laufen. SQL-Server-Integrationstests sind optional ueber Docker oder ein separates CI-/Entwicklungsprofil vorzusehen. |
| MVP-DEC-004 | Detailfelder | Die erste konkrete Detailfeldliste darf waehrend der Implementierung konservativ technisch vorgeschlagen werden. Sie wird anschliessend fachlich geprueft und bei Bedarf nachdokumentiert. |

## Technischer Umsetzungsstand des ersten Abschnitts

Stand 2026-08-11 ist der erste Abschnitt als ausschliesslich lesender MVP mit
synthetischen Daten umgesetzt. Die normale Konfiguration verwendet den
`Synthetic`-Read-Model-Provider und benoetigt weder einen lokalen SQL Server
noch Datenbankzugang. Der maximale Ergebnisumfang wird ueber
`Search:MaxResults` konfiguriert und betraegt standardmaessig 10.

Die API stellt ausschliesslich diese neuen fachlichen `GET`-Endpunkte bereit:

- `GET /api/search` fuer die Suche ohne Paginierung,
- `GET /api/cases/{id}` fuer die volle lesende MVP-Detailprojektion.

Health- und Systemendpunkte bleiben unveraendert bestehen. Es gibt keine
schreibenden Fall-, Grab-, Personen-, Gebuehren- oder Bescheidendpunkte.

### Suchauslegung

- Leere Werte gelten als nicht gesetzte Filter; eine vollstaendig ungefilterte
  Suche ist zulaessig.
- `Name`, `Vorname`, `Friedhof`, `Feld`, `Nutzungsberechtigte` und `Anschrift`
  sind Textfilter mit mindestens zwei Zeichen.
- `Grabnummer` und `Bescheidnummer` werden als technische Nummern- und
  Kennungsfelder ohne Mindestlaenge behandelt. Datumsfilter haben ebenfalls
  keine Mindestlaenge.
- Verglichen wird ohne Beachtung der Gross-/Kleinschreibung, aber ohne
  phonetische, fehlertolerante oder anderweitig unscharfe Suche.
- Jeder gesetzte Filter muss innerhalb seines zugeordneten Feldbereichs
  treffen (UND-Logik). Bei Mehrfachbeziehungen genuegt innerhalb dieses
  Bereichs ein passender Wert.
- Fuer die Relevanz wird je gesetztem Filter der beste Werttreffer als exakt,
  Praefix oder Teiltreffer klassifiziert. Zusammengesetzte Suchen werden nach
  ihrer schwachsten Trefferguete eingeordnet; danach folgen mehr passende
  konkrete Feldwerte und schliesslich Friedhof, Feld, Grabnummer und technische
  Fall-ID als stabile Reihenfolge.

Diese Auslegung ist eine technische MVP-Entscheidung und keine endgueltige
fachliche Suchregel.

## Vorgeschlagene Detailfeldliste

Die folgende Feldliste setzt `MVP-DEC-004` konservativ um. Technische IDs
dienen nur der eindeutigen Zuordnung im Lesemodell. Optionale Werte koennen
fehlen und werden in API und UI nicht durch erfundene Werte ersetzt.

| Bereich | Felder in Version 1 | Bewusste Auslegung |
| --- | --- | --- |
| Grabstelle | technische Fall-ID, Friedhof, Feld, Grabnummer | keine Grabart, kein fachlicher Status, keine Karten- oder Lageableitung |
| Verstorbene | technische Personen-ID, Vorname, Name, Geburtsdatum, Sterbedatum | mehrere Personen je Fall werden angezeigt; keine weiteren Personenattribute angenommen |
| Beisetzungen | technische Beisetzungs-ID, Beisetzungsdatum, optionaler Bezug zur verstorbenen Person | ein fehlender oder nicht aufloesbarer Bezug wird sichtbar markiert |
| Nutzungsrechte / Laufzeiten | technische ID, technische Referenz, gueltig ab, gueltig bis, Bezuege zu Berechtigten | Werte werden nur angezeigt; Cemaris berechnet, bewertet oder verlaengert keine Laufzeit |
| Berechtigte / Adressen | technische ID, Vorname, Name, Organisationsname; je Anschrift Strasse, Hausnummer, Postleitzahl, Ort, Zusatz | mehrere Berechtigte und mehrere Anschriften bleiben getrennt sichtbar |
| Bescheide / Gebuehreninformationen | technische ID, Bescheidnummer, Bescheiddatum, Faelligkeit, festgesetzter Betrag und Waehrung; je Position Bezeichnung, Betrag und Waehrung | keine Gebuehrenberechnung oder Bescheiderstellung; Zahlungsstatus und Mahnungen existieren nicht in der Projektion |
| Datenqualitaet | fallbezogene technische Hinweise | fehlende Werte erscheinen als `Nicht angegeben`; unvollstaendige Beziehungen werden ausdruecklich benannt |

## Datenbankvorbereitung und Grenzen

`CemarisDbContext` bildet das vorlaeufige Lesemodell bereits relational auf
separate `Read*`-Tabellen fuer Fall, Grabstelle, Verstorbene, Beisetzungen,
Nutzungsrechte, Berechtigte, Anschriften, Bescheide, Gebuehrenpositionen und
Datenqualitaetshinweise ab. Microsoft SQL Server bleibt der Zielprovider. Mit
`ReadModel:Provider=SqlServer` kann ein EF-Core-basierter Read Store aktiviert
werden; Verbindungszeichenfolge und ein kontrollierter Schemadeployment-Schritt
sind dann betrieblich bereitzustellen. Die Anwendung legt im normalen Start
keine Datenbank an und veraendert kein Schema.

Der SQL-Server-Read-Store filtert, zaehlt und sortiert Suchkandidaten in der
Datenbank. Erst fuer die hoechstens `Search:MaxResults` bestplatzierten Faelle
werden die vollstaendigen Beziehungen geladen. Eine fehlende Grabbeziehung
wird dabei als Datenqualitaetshinweis projiziert und fuehrt nicht zum Abbruch
der Detailansicht.

Die im Repository enthaltene Datenbasis ist durch Kennzeichnungen, ungueltige
Beispielpostleitzahlen sowie Test-/Synthese-Bezeichner klar kuenstlich. Sie ist
keine EDWALT-Migration und kein Mapping von EDWALT-Feldern. Ein produktiver
Import und automatisierte SQL-Server-Integrationstests bleiben eigene spaetere
Arbeitsschritte. Die initiale EF-Schemaversionierung fuer das Read Model ist
vorhanden; produktive Schemadeployments werden weiterhin separat geprueft und
ausgefuehrt.

Fuer lokale SQL-Server-Tests kann dieselbe synthetische Datenbasis ueber einen
expliziten Wartungsbefehl reproduzierbar geschrieben werden. Dieser Lauf ist auf
die Development-Umgebung begrenzt, verlangt den erwarteten Datenbanknamen,
setzt ein vollstaendig migriertes Schema voraus und bricht ab, sobald ein nicht
synthetischer Fall vorhanden ist. Es findet weiterhin kein automatisches
Seeding beim Anwendungsstart statt. Die absichtlich nicht aufloesbare
Berechtigtenreferenz des unvollstaendigen Demonstrationsfalls wird nicht als
ungueltiger Fremdschluessel persistiert; ihr Datenqualitaetshinweis bleibt in
der SQL-Projektion erhalten.

Weiterhin bewusst ausserhalb von Version 1 liegen:

- Login, Rollen und eingeschraenkte Sichten,
- alle schreibenden Fachfunktionen,
- Zahlungsstatus, Mahnungen, Dokumente und Winyard-Bezuege,
- EDWALT-Migration sowie produktive oder echte personenbezogene Testdaten,
- Paginierung, unscharfe Suche und fachlich noch ungeklaerte Regeln,
- ein endgueltiges Domainmodell oder eine fachlich freigegebene Feldsemantik.
