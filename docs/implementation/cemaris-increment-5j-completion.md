# Abschluss Inkrement 5j – datensparsame kompatible Beteiligten-Schnellsuche

Stand: 24.08.2026

## Ergebnis

Inkrement 5j ist im abgegrenzten Umfang umgesetzt. Die bestehende
Beteiligten-Schnellsuche `GET /api/parties?query=...` verwendet im EF-/SQL-
Provider nun eine serverseitige schmale Projektion. Sie lädt keine
vollständigen Beteiligtenaggregate, Revisionen oder übrigen Anschriften mehr.

Request, normalisierte Filtersemantik, unpaginierte JSON-Array-Antwort,
Ergebnismenge und sichtbare `PartySearchItem`-Felder sind unverändert. Die
eingebetteten Inhaberauswahlen verwenden weiterhin ausschließlich diesen
alten Endpunkt und nicht das in 5i ergänzte Verzeichnis.

## Ausgangsstand und Schutz vorhandener Arbeit

Vor den Änderungen wurden Branch, HEAD, Upstream, Ahead/Behind, Status,
vollständiger Arbeits- und Index-Diff sowie sämtliche unversionierten Inhalte
geprüft. `main` stand sauber auf dem lokalen, noch nicht gepushten 5i-Commit
`797457f7f7868a3dc0a982fa7f823a141b6fd710`, genau einen Commit vor
`origin/main`. Der Commit wurde vollständig geprüft und als vorhandene Arbeit
erhalten. Es wurde kein Reset ausgeführt.

Der ignorierte Fremdbestand `tmp/pagination-build` wurde ausschließlich
lesend geprüft und nicht verändert. Er umfasst 890 Dateien und 120.354.652
Bytes; der vorgegebene Manifest-Hash
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`
wurde reproduziert.

## Umsetzung

`EfPersonUsageRightStore.SearchPartiesAsync` behält die vorhandene
Normalisierung und den `Contains`-Filter auf `NormalizedName` bei. Die Abfrage
bleibt ohne Pagination, Ergebnislimit und explizite Sortierung. Sie verwendet
weiterhin `AsNoTracking` und einen abbrechbaren asynchronen EF-Aufruf.

Der SQL-Provider projiziert in einer Abfrage:

- Beteiligten-ID und Beteiligtenart;
- Vorname, Nachname oder Organisationsname für den unveränderten Anzeigenamen;
- ausschließlich Straße, Hausnummer, Postleitzahl und Ort der über
  `CurrentPrimaryAddressId` referenzierten Anschrift.

Die Projektion enthält keine Revisionszeile und weder weitere Anschriften noch
Adresszusatz, normalisierte Anschrift oder Gültigkeitsfelder. Nach der
Abfrage werden nur Enum und Anzeigename aus den projizierten Werten gebildet;
eine weitere Datenbankabfrage entsteht nicht. Der synthetische Provider blieb
unverändert.

Es wurden keine Domain-, Persistenz-, Migrations-, API-, OpenAPI-, Rollen-,
Policy-, Capability-, ETag-, Revisions-, Audit- oder Frontendverträge
geändert.

## Automatisierte Nachweise

Der API-Integrationstest beweist weiterhin die Array-Antwort und prüft nun
zusätzlich für natürliche Person und Organisation exakt die vier sichtbaren
Felder `id`, `partyType`, `displayName` und `currentPrimaryAddress`. Ein
getrimmter, kleingeschriebener Filter liefert dieselbe Ergebnismenge.

Der neue reale SQL-Test verwendet einen EF-Command-Interceptor, ohne
Parameterwerte auszugeben. Er belegt robust:

- genau eine Leseabfrage und damit keine N+1-Abfrage;
- natürliche Person und Organisation mit korrektem Anzeigenamen;
- ausschließlich die aktuelle primäre Anschrift im Ergebnis;
- keine getrackte Entitätsmaterialisierung;
- keine Abfrage von `PartyRevisions`, Revisionszustand oder nicht benötigten
  Anschriftsspalten.

Der bereits in 5i ergänzte reale Verzeichnistest bleibt unverändert in
derselben SQL-Suite. Damit umfasst `Category=SqlServer` sowohl den 5i-
Verzeichnisfall als auch den neuen 5j-Schnellsuchefall.

## Pflichtprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen, 0 Fehler |
| vollständige Unit-Tests | 41 von 41 bestanden |
| Integrationstests `Category!=SqlServer` | 57 von 57 bestanden |
| reale SQL-Suite `Category=SqlServer` | nicht ausgeführt; keine autorisierte Verbindung bereitgestellt |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | bestanden; 117 Pakete installiert, 0 bekannte Schwachstellen |
| vollständige Frontendtests | 8 Dateien, 41 von 41 Tests bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| Markdown-Links/-Anker, Tabellen, Whitespace und Secrets | bestanden; keine Befunde |

Die autorisierte `CEMARIS_SQL_TEST_CONNECTION_STRING` wurde genau einmal
angefragt, aber nicht bereitgestellt. Ein Verbindungswert wurde weder gesucht
noch erfunden oder abgeleitet. Deshalb wurde keine Datenbank gelesen,
angelegt, migriert oder verändert; es entstand keine zu bereinigende
`Cemaris_IntegrationTests_*`-Datenbank. Die übrigen Prüfungen wurden
vollständig ausgeführt.

## Sicherheits-, Kompatibilitäts- und Abschlussnachweis

- Der alte Endpunkt, sein Array-Vertrag und alle sichtbaren Felder bleiben
  kompatibel.
- Die eingebettete Inhaberauswahl verwendet weiterhin nur die alte
  Schnellsuche; `/api/parties/directory` bleibt der separaten Übersicht
  vorbehalten.
- Es wurden keine Pagination, Sortierung, Begrenzung oder neue Fachsemantik
  ergänzt.
- Es wurden ausschließlich synthetische Testdaten verwendet und keine echten
  Verwaltungsdaten, externen EDWALT-Originale oder Phase-Arbeitsbereiche
  geöffnet.
- Vorhandene Arbeit und `tmp/pagination-build` wurden unverändert erhalten.
- Es wurde kein Commit erstellt und nichts gestagt.

## Nachfolgende Prioritätsentscheidung

Die [ausführbare 5k-Folgeübergabe](cemaris-increment-5k-next-step-handoff.md)
wurde nach diesem technischen Abschluss durch die Projektentscheidung vom
25.08.2026 erweitert. Sie setzt nun ADR-0017 mit dauerhaftem lokalen
SQL-Developmentbetrieb und ausschließlich nicht personenbezogenem EDWALT-
Friedhofsstammdatenimport um. Die zuvor identifizierte Abbruchparität bleibt
als kleiner technischer Providerparitätsnachweis enthalten und darf weiterhin
weder Abfrageergebnisse noch API-, UI- oder Fachverträge ändern.
