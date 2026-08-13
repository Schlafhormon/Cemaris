# Abschlussdokumentation Cemaris Inkrement 4b

Stand: 13.08.2026

## Ergebnis

Inkrement 4b ist als ausschließlich synthetischer technischer
Development-Inkrement Ende zu Ende umgesetzt. Der Prozess führt von Entwurf
über Geplant, Bestätigt und Durchgeführt bis Abgeschlossen und erlaubt nur die
sieben bestätigten Übergänge. Eine fachliche Abnahme durch die
Friedhofsverwaltung sowie Datenschutz-, Betriebs- und Produktivfreigaben
bleiben ausdrücklich offen.

## Umgesetzter Umfang

- Person und kanonische Grabstelle als Pflichtbezüge jedes neuen Entwurfs;
- höchstens eine Prozessbeisetzung je Person, mehrere Personen und
  Beisetzungen je Fallakte;
- `DateOnly`-Planungstag ab Geplant und tatsächlicher Tag ab Durchgeführt;
- Geburt ≤ Tod ≤ tatsächlicher Tag und kein tatsächlicher Zukunftstag;
- kontrollierte Rückschritte ohne Datumsverlust und bestätigte Wiederöffnung;
- serverseitiger, teilwirkungsfreier Dublettenhinweis mit bewusstem zweiten
  Schreibversuch;
- monotone atomare Grabstellenkopplung und atomare Grabstellenkorrektur ohne
  Rückstufung des alten Bezugs;
- Domain, Application, Prozessstorevertrag, synthetischer und SQL-Provider,
  API/OpenAPI und React-Oberfläche;
- additive regulär erzeugte EF-Migration
  `20260813134826_AddBurialProcess` und unverändert lesbare Altzeilen;
- unabhängige, standardmäßig deaktivierte Capability
  `Features:BurialProcessEditingEnabled`;
- eigene Rollenpolicy, Cookie-Sitzung, CSRF, authentifizierter Akteur,
  ETag/If-Match und sparsamer atomarer Nachweis;
- Abschaltung der alten einfachen Beisetzungshandler im aktiven 4b-Modus;
- Erhalt der in 4a bestätigten vollständigen Kontextpfade und Auswahlfilter.

## Automatisierte Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | 0 Warnungen, 0 Fehler |
| Unit-Tests | 26 erfolgreich |
| reguläre API-/Integrationstests | 43 erfolgreich |
| reale SQL-Suite auf `localhost\CEMARISDEV` | 10 erfolgreich, 0 übersprungen |
| Frontendtests | 12 erfolgreich |
| Migrationen | aus allen fünf Vorgängerversionen mit repräsentativer nullable Altbeisetzung erfolgreich |
| SQL-Fehlersimulation | Beisetzung, Grabstellenstatus, Fallversion und Audit vollständig zurückgerollt |
| OpenAPI | Capability-, Prozess-, Übernahme- und Sicherheitsverträge explizit geprüft |

Zur Schlussabnahme gehören außerdem `.NET format`, `npm ci`, Lint,
Produktionsbuild, idempotentes EF-Skript, Markdown-Link-/Tabellenprüfung,
Secretprüfung ohne Wertausgabe, `git diff --check`, vollständige Git-Prüfung
und der Nachweis, dass keine temporäre SQL-Testdatenbank verbleibt.

## Sicherheitsbewertung

Die Capability kann nur in Development mit synthetischem Provider starten und
ist in allen versionierten Einstellungen aus. Abgewiesene Dubletten,
ungültige Übergänge, veraltete ETags und Persistenzfehler erzeugen keinen
erfolgreichen Änderungsnachweis. Der Nachweis enthält keine Fachpayload und
ist nicht über API oder UI abrufbar. Diese technischen Eigenschaften ersetzen
keine Datenschutz- oder Betriebsfreigabe.

## Nicht umgesetzt

Keine Uhrzeit/Zeitzone, Unterlagen, Checklisten, Ressourcen oder
Terminkollisionen, Umbettung, Storno, Löschung, Nummern- oder
Kapazitätsautomatik, Ruhe-/Nutzungs-/Aufbewahrungsfristen, Nutzungsrechte,
Wiedervorlagen, Gebühren, Bescheide, Formulare, Dokumente, Winyard, LDAP oder
EDWALT-Code und keine echten Verwaltungsdaten.

## Freigabegrenze

Der Stand belegt die technische Abnahme des abgegrenzten Inkrements mit
synthetischen Daten. Er behauptet weder fachliche Vollständigkeit noch
datenschutzrechtliche, betriebliche oder umfassende produktive Freigabe.
