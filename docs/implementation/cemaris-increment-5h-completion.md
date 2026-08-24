# Abschluss Inkrement 5h: fachregelarmes Produktauswahlgate

Stand: 24.08.2026

## Ergebnis

Inkrement 5h ist ausschließlich dokumentarisch mit Variante B abgeschlossen:
Als genau ein nächster technischer Schnitt wurde eine deterministische,
serverseitig paginierte Beteiligtenübersicht für die vorhandene Route
`/parties` ausgewählt.

Die Auswahl ergänzt keine fachliche Lebenszyklusregel. Insbesondere bleiben
Rückgabe, Verzicht, Entzug, Beendigung, Wiedervergabe, Fristberechnung,
Statusautomatik und EDWALT-Migration außerhalb des Schnitts. Die in 5g
gewählte Variante A für die mögliche Nutzungsrechtsrückgabe bleibt
unverändert.

In 5h wurden weder Produktcode noch Frontend, Backend, API/OpenAPI, Domain,
Berechtigungen, Persistenz, Migrationen oder Tests geändert. Die technische
Umsetzung ist ausschließlich Gegenstand der separaten
[5i-Implementierungsübergabe](cemaris-increment-5i-next-step-handoff.md).

## Repositorybefund

Der ausgewählte Bedarf folgt unmittelbar aus dem vorhandenen Produktstand:

- Die fallunabhängige Seite `/parties` bezeichnet sich als
  `Beteiligtenbestand`, zeigt aber ohne einen verpflichtenden Suchbegriff
  keinen Bestand.
- `PartySearchAndDetails` verlangt clientseitig mindestens zwei Zeichen und
  verwendet dieselbe ungepagete Schnellsuche wie die Inhaberauswahl im
  Nutzungsrechtsworkflow.
- `GET /api/parties?query=...` liefert ein bloßes Array ohne Gesamtzahl oder
  Seitenmetadaten. Dieser Vertrag wird vom eingebetteten Auswahlworkflow
  verwendet und darf nicht still gebrochen werden.
- `EfPersonUsageRightStore.SearchPartiesAsync` lädt derzeit alle passenden
  Beteiligten samt sämtlichen Adressen und besitzt keine explizite Sortierung
  oder Begrenzung.
- Der synthetische Store liefert seine Dictionary-Treffer ebenfalls ohne
  garantierte Reihenfolge und Begrenzung.
- Die vorhandene Fallsuche belegt bereits das Cemaris-Muster aus serverseitigem
  `Count`, stabiler Sortierung, `Skip`/`Take`, Seitenmetadaten,
  Eingabevalidierung und URL-gebundener Frontend-Pagination.
- Der 5d-Abschluss grenzt ausdrücklich ab, dass damals keine neue
  serverseitige Beteiligtenpagination umgesetzt wurde.

Damit ist der Schnitt kein vorweggenommener Verwaltungsprozess. Er macht nur
bereits vorhandene kanonische Beteiligte datensparsam und beherrschbar lesbar.

## Variantenvergleich

| Aspekt | A – keinen Folgeschnitt wählen | B – paginierte Beteiligtenübersicht | C – offene Fachregel implementieren |
| --- | --- | --- | --- |
| Repositorybedarf | der erkennbare Skalierungs- und Bedienbruch bliebe bestehen | konkreter Befund in Seite, API und beiden Stores | nicht erforderlich, um den Befund zu beheben |
| Fachwirkung | keine | ausschließlich lesende Darstellung vorhandener kanonischer Beteiligter | würde eine neue Lebenszyklus-, Frist- oder Migrationswirkung behaupten |
| Kompatibilität | unverändert | additiver Verzeichnisvertrag; bestehende Schnellsuche bleibt erhalten | neue Domain- und Freigabegrenzen nötig |
| Datenminimierung | aktueller EF-Pfad kann alle Treffer und Adressen laden | nur Gesamtzahl und angeforderte Seite mit aktueller Hauptanschrift | je nach Fachschnitt zusätzliche Daten und Nachweise |
| Abnahme | keine neue Abnahme | vollständig mit synthetischen Daten; EF-Übersetzung zusätzlich gegen freigegebene temporäre SQL-Testdatenbank | kommunale Fach- und Freigabequellen fehlen |
| Entscheidung | verworfen | **ausgewählt** | zwingend verworfen |

Variante B besitzt den klarsten Nutzerwert bei der kleinsten fachlichen
Angriffsfläche. Ein neues ADR ist nicht erforderlich: Die Auswahl setzt den
vorhandenen kanonischen Beteiligten-, Policy-, Provider- und
OpenAPI-Vertrag additiv fort und ändert ADR-0016 nicht.

## Verbindlicher Zuschnitt für 5i

5i implementiert genau eine Beteiligtenübersicht:

1. Ein additiver Leseendpunkt `GET /api/parties/directory` nimmt den optionalen
   Filter `query`, `page` mit Standard `1` und `pageSize` mit Standard `10`
   entgegen.
2. Leerer oder fehlender `query` bedeutet „alle kanonischen Beteiligten“.
   Nicht leere Filter werden getrimmt, müssen mindestens zwei und höchstens
   200 Zeichen enthalten und verwenden die vorhandene Namensnormalisierung.
3. `page` muss mindestens `1`, `pageSize` zwischen `1` und `50` liegen. Ein
   rechnerischer Offsetüberlauf wird als Validierungsfehler abgewiesen.
4. Die Antwort enthält `items`, `totalMatches`, `page`, `pageSize` und
   `totalPages`. Ein leerer Bestand hat `totalPages = 0`.
5. Die Sortierung ist vollständig und stabil: normalisierter Anzeigename,
   anschließend die bestehende kanonische ID als eindeutiger Tie-Breaker.
   Beide Provider müssen die festgelegte Ordnung für wiederholte Aufrufe
   stabil einhalten; Gleichstandsszenarien sind ausdrücklich zu testen.
6. Der EF-Provider führt Filter, Gesamtzählung, Sortierung und
   `Skip`/`Take` datenbankseitig aus. Er projiziert nur die angeforderte Seite
   und die Felder der aktuellen Hauptanschrift; er lädt weder alle Adressen
   noch Revisionen oder den gesamten Trefferbestand.
7. Der synthetische Provider liefert unter dem vorhandenen gemeinsamen Gate
   denselben Vertrag und eine stabile Seitenbildung.
8. `/parties` verwendet den neuen Verzeichnisvertrag, lädt initial die erste
   Seite ohne Filter und hält angewendeten Filter, Seite und Seitengröße in
   der URL. Suche und Filterlöschen setzen auf Seite 1 zurück.
9. Die Oberfläche bietet Gesamtzahl, klare Lade-/Leer-/Fehlerzustände,
   barrierearm beschriftete Vor-/Zurück-Navigation und die Seitengrößen 10,
   25 und 50. Eine nach Datenänderung ungültig gewordene Seite wird auf die
   letzte vorhandene Seite normalisiert.
10. Auswahl, Detail, Anlage, Dublettenbestätigung, Korrekturen, starke ETags
    und Konflikt-Neuladen bleiben erhalten. Nach Anlage oder Korrektur wird
    das sichtbare Verzeichnis konsistent neu geladen.
11. Die bestehende Schnellsuche `GET /api/parties?query=...` und ihre Nutzung
    bei der Inhaberauswahl bleiben in Pfad, Request, Response und Verhalten
    kompatibel.

Der neue Endpunkt verwendet dieselbe `PersonUsageRights`-Policy und
Capability-Grenze wie die vorhandene Beteiligtenlesefunktion. Als reiner
Lesezugriff benötigt er weder CSRF noch ETag noch Audit. Es entstehen keine
neue Rolle, Persistenzspalte oder Migration.

## Nicht-Ziele

- keine Änderung der Nutzungsrechts-Schnellsuche oder ihrer Auswahlsemantik;
- keine neue Beteiligtenart, Dublettenentscheidung, Zusammenführung,
  Löschung oder Archivierung;
- keine Volltext-, Ähnlichkeits-, Adress- oder phonetische Suche;
- keine Lebenszyklus-, Grabstellen-, Beisetzungs- oder Gebührenwirkung;
- keine EDWALT-Auswertung, Migration, Rückinterpretation oder echte Daten;
- keine neue Policy, Capability, Audit- oder Fachrevisionswirkung;
- keine Schemaänderung und keine Migration.

## Abschlussprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen und 0 Fehler |
| vollständige Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 50 von 50 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | abgeschlossen; Dependency-Baum konsistent |
| vollständige Frontendtests | 37 von 37 in 8 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| Markdown-Links, Anker und Tabellen | bestanden |
| Whitespace und Secretprüfung ohne Wertausgabe | bestanden |

Die Prüfungen wurden nach den ausschließlich dokumentarischen 5h-Änderungen
erneut ausgeführt. Eine reale SQL-Suite war für das Auswahlgate nicht nötig
und wurde nicht gestartet. Es wurden keine Datenbank, API, kein
Frontend-Dev-Server und keine externe Arbeitsfläche verwendet.

Der ignorierte Fremdbestand `tmp/pagination-build` blieb bei 890 Dateien und
120.354.652 Bytes. Sein Manifest-Hash blieb
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.
HEAD blieb `7e93eafb5a2af1ba95df98fe3bf1d5d462ba3a96`, der Index leer und in 5h
wurde kein Commit erstellt.

