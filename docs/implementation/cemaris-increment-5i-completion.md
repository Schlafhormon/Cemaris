# Abschluss Inkrement 5i – deterministische paginierte Beteiligtenübersicht

Stand: 24.08.2026

## Ergebnis

Inkrement 5i ist Ende zu Ende umgesetzt. Die fallunabhängige
Beteiligtenpflege lädt nun ohne vorherige Namenseingabe einen
deterministischen, serverseitig paginierten Bestand. Der neue additive
Lesevertrag reicht von Application und beiden Providern über API und OpenAPI
bis zur React-Oberfläche. Die bestehende Array-Schnellsuche für eingebettete
Inhaberauswahlen bleibt unverändert.

Damit wird ausschließlich die in
[5h](cemaris-increment-5h-completion.md) ausgewählte technische Bedien- und
Skalierbarkeitslücke geschlossen. Frist-, Status-, Beendigungs-,
Wiedervorlagen-, Rollen-, Audit- und Migrationsregeln bleiben unverändert und
der Nutzungsrechtslebenszyklus bleibt pausiert.

## Nachweis des Ausgangsstands

Vor der ersten Änderung wurden Branch, HEAD, Upstream, Ahead/Behind, Status,
vollständiger Arbeits- und Index-Diff, unversionierte Inhalte sowie der
geschützte Fremdbestand geprüft. Gegenüber der 5i-Übergabe war bereits der
dokumentationsreine, auf `origin/main` vorhandene Commit
`85593d71af3bc8b90b3a7c88392f2a1e29650b56` hinzugekommen. Er schließt 5g und
5h dokumentarisch und enthält die angekündigte 5i-Abgrenzung; Produkt- und
Testcode waren weiterhin unverändert. Dieser vorhandene Stand wurde erhalten.

## Verbindlicher Lesevertrag

`GET /api/parties/directory` verwendet die vorhandene
`PersonUsageRights`-Policy und Capability. Der Vertrag lautet:

- fehlender, leerer oder ausschließlich aus Whitespace bestehender `query`
  liest alle kanonischen Beteiligten;
- ein nicht leerer Filter wird getrimmt und mit der vorhandenen
  Namensnormalisierung verarbeitet; zulässig sind 2 bis 200 Zeichen;
- `page` hat Standard 1 und Minimum 1, `pageSize` Standard 10 und Bereich
  1 bis 50;
- ein Offsetüberlauf endet vor dem Store-Aufruf als strukturiertes
  `ValidationProblem`;
- die Antwort enthält `items`, `totalMatches`, `page`, `pageSize` und
  `totalPages`; bei null Treffern ist `totalPages` null, also numerisch `0`;
- außerhalb liegende Seiten bleiben leer und liefern trotzdem korrekte
  Gesamtmetadaten;
- sortiert wird vollständig nach normalisiertem Anzeigenamen und anschließend
  nach stabiler Beteiligten-ID;
- jedes Item enthält nur ID, Beteiligtenart, Anzeigename und die aktuelle
  primäre Anschrift.

Der vorhandene `GET /api/parties?query=...` liefert weiterhin das bisherige
JSON-Array. Requestform, Antwortform und Nutzung in der eingebetteten
Inhaberauswahl wurden nicht auf den Verzeichnisvertrag umgestellt.

## Umsetzung

### Application und Provider

Ein eigener Page-/Store-Result-Vertrag sowie eine eigene Servicemethode
halten Verzeichnis und Schnellsuche getrennt. Die Anwendungsschicht validiert
alle Eingaben, normalisiert den Filter, schützt die Offsetberechnung und
berechnet die Seitenmetadaten über überlaufsichere Zwischenwerte.

Der EF-Provider führt `Count`, optionalen Filter, stabile Sortierung,
`Skip`/`Take` und die sparsame Item-Projektion serverseitig und asynchron aus.
Revisionen und nicht aktuelle Anschriften werden nicht materialisiert; eine
N+1-Abfrage entsteht nicht. Der synthetische Provider zählt und paginiert mit
derselben Reihenfolge innerhalb der vorhandenen Koordinator-Sperre.

Es wurden keine Domainentität, Datenbanktabelle, EF-Konfiguration oder
Migration geändert.

### API, OpenAPI und Sicherheit

Der additive Endpunkt besitzt eine deutschsprachige OpenAPI-Beschreibung,
das Page-Schema sowie dokumentierte 400-, 401- und 403-Antworten. Er hängt an
derselben Routengruppe wie die bisherigen Beteiligtenoperationen. Damit gelten
weiterhin Cookie-Authentifizierung, die bestehende
`PersonUsageRights`-Policy und die standardmäßig deaktivierte
Development-Capability. Der Endpunkt schreibt keine Daten und erzeugt keinen
Auditdatensatz.

### Oberfläche

`/parties` lädt initial die erste ungefilterte Seite. Ein lokaler Filterentwurf
wird erst beim Absenden angewendet; Anwenden und Löschen beginnen wieder auf
Seite 1. Angewendeter Filter, Seite und Seitengröße 10, 25 oder 50 stehen in
den URL-Suchparametern.

Die Oberfläche zeigt Trefferrange, Gesamtzahl und Seite, barrierearm
beschriftete Vor-/Zurück-Aktionen sowie getrennte Lade-, Fehler-, leere
Gesamtbestands- und leere Filterzustände. Ein `AbortController` und eine
monotone Request-Kennung verhindern, dass veraltete Antworten den aktuellen
Bestand überschreiben. Wird eine Seite durch Anlage oder Korrektur ungültig,
wird sie auf die letzte vorhandene Seite normalisiert; das ausgewählte Detail
bleibt erhalten.

Anlage, Dublettenbestätigung, Auswahl, Detail, historisierte Namens- und
Adresskorrekturen sowie ETag-/412-Konfliktbehandlung verwenden weiterhin die
vorhandenen Komponenten und Mutationsverträge. Sichtbarkeitsrelevante
Mutationen laden das Verzeichnis anschließend neu.

## Automatisierte Abdeckung

Ergänzt wurden:

- Unit-Tests für Defaults, Whitespace, Normalisierung, Seitenmetadaten,
  Filtergrenzen, Pagination und Offsetüberlauf vor dem Store;
- synthetische Providertests für Gesamtzahl, Namensgleichstände, stabile
  Wiederholung, disjunkte Folgeseiten, Filter, aktuelle primäre Anschrift sowie
  leere und außerhalb liegende Seiten;
- API-Integrationstests für den vollständigen Vertrag, strukturierte Fehler,
  OpenAPI, Policy, Capability und die unveränderte Array-Schnellsuche;
- ein realer SQL-Test für EF-Filter, Zählung, deterministische Gleichstände,
  Folgeseiten, aktuelle primäre Anschrift und eine außerhalb liegende Seite;
- Frontendtests für Initialbestand, URL-Zustand, Filterentwurf, Paging,
  Seitengröße, Zustände, Request-Races, Seitennormalisierung, Auswahl,
  Anlage, Dublettenbestätigung, Korrekturen und ETag-Fortschreibung;
- einen Regressionstest, dass die eingebettete Inhaberauswahl weiterhin die
  alte Array-Schnellsuche verwendet.

## Pflichtprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests | 41 von 41 bestanden |
| Integrationstests `Category!=SqlServer` | 57 von 57 bestanden |
| reale SQL-Suite `Category=SqlServer` | nicht ausgeführt; keine autorisierte Verbindung bereitgestellt |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | bestanden; 117 Pakete installiert, 0 bekannte Schwachstellen |
| vollständige Frontendtests | 8 Dateien, 41 von 41 Tests bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| Markdown-Links und -Anker, Tabellen, Whitespace, Secrets | 90 Markdown-Dateien, 0 Befunde; geänderter Umfang ohne Befund |

Für die reale SQL-Suite war im Prozess keine ausdrücklich autorisierte
`CEMARIS_SQL_TEST_CONNECTION_STRING` gesetzt. Die Verbindung wurde genau
einmal angefragt und weder gesucht, abgeleitet noch erfunden. Deshalb wurde
keine Datenbank gelesen, angelegt, migriert oder verändert; sämtliche übrigen
Pflichtprüfungen wurden vollständig ausgeführt.

Die erste vollständige Frontend-Suite deckte zwei veraltete App-Routen-Mocks
auf, die dem neuen Endpunkt noch die bisherige Arrayform lieferten. Die Mocks
wurden ausschließlich für den additiven Verzeichnisrequest ergänzt; die
anschließende vollständige Suite, Lint und Produktionsbuild sind grün.

## Schutz- und Abschlussnachweis

Es wurden ausschließlich synthetische Testdaten verwendet und keine externen
EDWALT-Originale oder Phase-Arbeitsbereiche geöffnet. Der ignorierte
Fremdbestand `tmp/pagination-build` blieb bei 890 Dateien und 120.354.652
Bytes. Sein aus repository-relativem Pfad, Länge, UTC-Ticks und Datei-SHA-256
gebildeter Manifest-Hash blieb
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.

Es wurde keine Datei unter diesem Pfad verändert oder als eigene Arbeit
ausgegeben. Es wurde kein Commit erstellt und nichts gestagt.

## Kleinster sicherer Folgeschritt

Die [ausführbare 5j-Folgeübergabe](cemaris-increment-5j-next-step-handoff.md)
grenzt ausschließlich die datensparsame interne SQL-Projektion der weiterhin
kompatiblen Beteiligten-Schnellsuche ab. Sie führt weder Pagination noch einen
neuen Vertrag für die eingebettete Inhaberauswahl ein.
