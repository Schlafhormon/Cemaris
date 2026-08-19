# Ausführbare Folgeübergabe: Inkrement 5f – Nutzungsrechtslebenszyklus-Entscheidungsgate

Stand: 19.08.2026

## Auftrag

Führe als nächsten sicheren Cemaris-Schritt ein ausschließlich
dokumentarisches Entscheidungs- und Freigabegate für den kleinsten möglichen
Nutzungsrechtslebenszyklus-Zuschnitt durch.

5f implementiert keine Fachfunktion. Es muss quellengebunden klären, ob genau
eine kleine Lebenszyklusoperation fachlich, rechtlich und technisch
hinreichend bestimmt werden kann. Ist dies nicht möglich, endet 5f mit einem
begründeten weiteren Entscheidungsgate und ohne Codeänderung.

## Verbindliche Arbeitsgrenzen

Repository und einziges Arbeitsverzeichnis:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Keine EDWALT-Originale, externen Phase-2-/3-/4-Arbeitsbereiche oder
Phase-5-Wurzel öffnen oder anlegen. Repository-interne EDWALT-Dokumente sind
nur gekennzeichnete Altverfahrensevidenz. Keine echten Verwaltungsdaten
verwenden und keine Commits ausführen.

5f benötigt keine Datenbank, keine laufende API, kein Frontend und keine
manuelle Fachmutation. Keine SQL-Suite starten und keine Benutzer-, Produkt-
oder Testdatenbank lesen oder verändern. Vorhandene lokale Satzungsfundstellen
zunächst ausschließlich über die bereits repository-intern dokumentierte
Evidenz verwenden. Falls ein Original zwingend nachgelesen werden muss, vor
dem Zugriff den exakten Pfad und den ausschließlich lesenden Zweck vom
Benutzer bestätigen lassen; der Pfad wird dadurch nicht zum
Arbeitsverzeichnis.

## Erwarteter Repository-Ausgangsstand

Beim Erstellen dieser Übergabe war der erhaltene Stand:

- Branch `main`;
- HEAD `744bf9bb7eb686e0728d4746594a039dfe214b1d`;
- Upstream `origin/main`;
- Ahead/Behind `1/0`;
- leerer Index;
- uncommittierte 5e-Arbeit gemäß
  [5e-Abschluss](cemaris-increment-5e-completion.md);
- keine Domain-, Application-, Persistenz-, Migrations- oder
  Backendproduktänderung;
- vorbestehender ignorierter Fremdbestand `tmp/pagination-build` mit 890
  Dateien.

Die uncommittierte 5e-Arbeit bestand beim letzten Prüflauf exakt aus diesen
geänderten versionierten Dateien:

- `README.md`;
- `docs/architecture/README.md`;
- `docs/decisions/README.md`;
- `docs/implementation/README.md`;
- `docs/requirements/README.md`;
- `src/Cemaris.Web/src/api/cemarisApi.ts`;
- `tests/Cemaris.IntegrationTests/CookieIdentityEndpointTests.cs`.

Unversioniert und ebenfalls verbindlich zu erhalten waren:

- `docs/implementation/cemaris-increment-5e-completion.md`;
- diese 5f-Folgeübergabe;
- `src/Cemaris.Web/src/api/cemarisApi.test.ts`.

Der letzte vollständige 5e-Prüflauf ergab 0 Buildwarnungen und 0 Fehler,
32 bestandene Unit-Tests, 50 bestandene reguläre Integrationstests ohne
SQL-Kategorie sowie 37 bestandene Frontendtests in 8 Testdateien. Format,
Frontend-Lint, Produktionsbuild, Markdown-, Whitespace-, Secret- und
Git-Prüfung waren grün. Die Ports `5050` und `5173` waren frei.

Falls der Stand inzwischen committed, gepusht oder anderweitig verändert
wurde, die Abweichung vollständig untersuchen. Nicht zurücksetzen und
vorhandene Arbeit weder verwerfen noch überschreiben, stagen oder committen.

## Git-Sicherheit

Vor der ersten und vor jeder logisch getrennten Änderung vollständig prüfen:

- Branch und HEAD;
- Upstream und Ahead/Behind;
- Git-Status;
- vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts.

## Pflichtlektüre

Vor jeder Entscheidung vollständig lesen:

1. `docs/implementation/cemaris-increment-5e-completion.md`;
2. `docs/implementation/cemaris-increment-5e-next-step-handoff.md`;
3. `docs/implementation/cemaris-increment-5c-completion.md`;
4. `docs/implementation/cemaris-increment-5c-next-step-handoff.md`;
5. `docs/implementation/cemaris-increment-5b-completion.md`;
6. `docs/implementation/cemaris-increment-5a-completion.md`;
7. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
8. `docs/architecture/person-usage-rights-deadlines.md`;
9. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
10. `docs/requirements/identity-authorization-audit-decisions.md`;
11. `docs/architecture/authentication-authorization-audit.md`;
12. Root-README und alle vier Dokumentationsindizes.

Produktcode, API-Verträge, Migrationen und Tests dürfen in 5f nur als
Vertragsnachweis gelesen werden.

## Ausgangslage

Der manuelle 5b-Kern kann ein Nutzungsrecht an genau einer kanonischen
Grabstelle anlegen, übertragen, verlängern und Fakten historisiert
korrigieren. Das manuelle Enddatum besitzt allein keine Statuswirkung. Es
existiert keine Beendigungs-, Rückgabe-, Entziehungs-, Schließungs-,
Wiedervergabe- oder Wiedervorlagenoperation.

Das 5c-Gate hat nur `5C-02` und `5C-14` bestätigt. `5C-01` und `5C-03` bis
`5C-13` sind offen beziehungsweise in `5C-05` widersprüchlich. 5d und 5e
haben ausschließlich Bedienung und Technik geändert.

## Verbindliches Vorgehen im Entscheidungsgate

1. Für alle Fragen `5C-01` bis `5C-14` eine Evidenzmatrix mit Quelle,
   Geltungsbereich, aktuellem Status und noch benötigter Freigabefunktion
   erstellen.
2. Höchstens eine fachliche Lebenszyklusoperation als möglichen kleinsten
   Schnitt auswählen. Bezeichnungen wie Beendigung, Rückgabe, Entziehung
   oder Wiedervergabe sind bis zur Bestätigung ausschließlich Fragen, keine
   bereits bestehenden Produktregeln.
3. Bereits eindeutig dokumentierte Antworten nicht erneut erfragen. Alle für
   den ausgewählten Schnitt noch fehlenden Entscheidungen in einem
   konsolidierten Fragenblock an den Benutzer richten und die Arbeit bis zu
   seiner Antwort nicht als abgeschlossen darstellen.
4. Jede neue Antwort mit Datum sowie Rolle oder Funktion der auskunftgebenden
   Person dokumentieren. Produktverantwortung ersetzt keine notwendige
   Rechts-, Datenschutz-, Sicherheits- oder Betriebsfreigabe.
5. Sind Antworten unklar, widersprüchlich oder nicht durch die erforderliche
   Funktion freigegeben, Variante A wählen und exakt festhalten, welche
   Aussage beziehungsweise Freigabe von welcher Funktion fehlt.
6. Nur wenn sämtliche Mindestentscheidungen für genau einen Schnitt
   vollständig vorliegen, Variante B spezifizieren und eine spätere
   Implementierungsübergabe erstellen. 5f selbst bleibt in jedem Fall
   codefrei.

Der konsolidierte Fragenblock muss mindestens klären:

- genau eine reale Lebenszyklusoperation mit höchstem Bedarf und ihrem
  kommunalen Geltungsbereich;
- auslösendes Ereignis und notwendiger Nachweis;
- Wirksamkeitsdatum, Rückwirkung und fachliche Korrektur;
- Statuswirkung sowie ausdrücklich unveränderte Zustände;
- auslösende, bestätigende, korrigierende und rücknehmende Funktionen;
- Wechselwirkungen mit laufenden Beisetzungen, offenen Inhaberzeiträumen,
  Grabstatus, Sperre und Wiedervergabe;
- Pflichtbegründung, Quelle, Fachrevision und Audit;
- Altprojektion, Migration, Bestandsschutz und fehlende Altdaten;
- tatsächlich erteilte fachliche, rechtliche, Datenschutz-, Sicherheits- und
  Betriebsfreigaben.

## Zu treffende Mindestentscheidungen

Eine spätere Implementierung darf nur freigegeben werden, wenn für genau eine
kleine Operation mindestens folgende Punkte quellengebunden entschieden sind:

1. fachlicher Auslöser und ausdrücklich nicht umfasste Ereignisse;
2. Wirksamkeitszeitpunkt, Datumsgrenzen, Rückwirkung und Korrektur;
3. technische Zustandswirkung ohne implizite Ableitung aus dem Enddatum;
4. Rollen, Bestätigung, Korrektur, Rücknahme und Funktionstrennung;
5. Pflichtquelle, Begründung, Fachrevision und Auditminimalumfang;
6. ETag-Vertrag und atomare Speichergrenze;
7. keine, manuelle oder atomare Grabstellenwirkung;
8. Konflikte mit Beisetzungen und offenen Inhaberzeiträumen;
9. Altprojektion, Migration, Backfill und Bestandsschutz;
10. Datenschutz-, Aufbewahrungs- und Betriebsfreigaben.

Fehlt eine belastbare Antwort, darf sie nicht aus Altverfahrensmasken,
Satzungsindizien oder bestehendem Code geraten werden.

## Architekturvarianten

| Variante | Inhalt | Erwartete Grenze |
| --- | --- | --- |
| A – keine Implementierung | offene Fragen und benötigte Freigaben präzisieren | sicherer Ausgang, wenn kein kleiner bestätigter Schnitt existiert |
| B – eine manuelle historisierte Lebenszyklusoperation | genau ein Ereignis mit starkem ETag, Fachrevision und atomarem Audit | nur bei vollständig bestätigten Mindestentscheidungen |
| C – berechneter oder automatisierter Lebenszyklus | Fristen, Statusautomatik, Grabstellenwirkung oder Wiedervorlagen | für den ersten Schnitt ohne neue Fach-/Rechtsentscheidung ausgeschlossen |

Die Bewertung muss Domainidentität, Historisierung, Atomarität, ETag, Audit,
Migration und Altkompatibilität getrennt darstellen.

## Erforderliche Beteiligung

Benötigt werden mindestens:

- Friedhofsverwaltung beziehungsweise fachlich verantwortliche Funktion;
- Produktverantwortung;
- Rechtsprüfung für satzungs- oder fristabhängige Wirkung;
- Berechtigungs-/Informationssicherheitsverantwortung bei neuen Grenzen;
- Datenschutz und Betrieb, soweit Aufbewahrung oder Protokollierung betroffen
  sind.

Lokale Aussagen werden nicht als allgemeine Open-Source-Produktregel
verallgemeinert.

## Ausdrückliche Nicht-Ziele

- keine Code-, API-, OpenAPI-, Domain- oder Persistenzänderung;
- keine Migration und kein Backfill;
- keine neue Rolle oder Berechtigung;
- keine automatische Frist-, Status- oder Satzungsberechnung;
- keine Beendigung, Rückgabe, Entziehung oder Wiedervergabe ohne bestätigte
  Entscheidung;
- keine Wiedervorlage, Erinnerung, Eskalation oder Benachrichtigung;
- keine Gebühren-, Bescheid-, Dokument- oder DMS-Funktion;
- keine echte Verwaltungsdatenverarbeitung oder Produktivfreigabe.

## Erwartete Ergebnisse

Zum Abschluss gehören:

1. deutsche Abschlussdokumentation mit Quellen-, Entscheidungs- und
   Freigabematrix;
2. aktualisierte Antworten nur für tatsächlich bearbeitete `5C`-Fragen;
3. Architekturvergleich einschließlich Historisierung, Atomarität, ETag,
   Audit, Migration und Altkompatibilität;
4. klare Entscheidung für Variante A, B oder eine begründete andere
   dokumentarische Variante;
5. notwendige Aktualisierungen von Root-README und den vier Indizes;
6. nur bei vollständig freigegebenem Schnitt eine Implementierungsübergabe,
   andernfalls ein präzises weiteres Entscheidungsgate.

Ein neues ADR wird erst erforderlich, wenn eine bestätigte Entscheidung
ADR-0016 erweitert oder ersetzt. ADR-0016 wird nicht rückwirkend umgeschrieben.

## Qualitäts- und Abschlussprüfungen

1. Release-Build mit null Warnungen und null Fehlern.
2. Vollständige Unit- und reguläre Integrationstests ohne SQL-Kategorie.
3. `dotnet format --verify-no-changes --no-restore`.
4. `npm ci`, Frontendtests, Lint und Produktionsbuild.
5. `git diff --check`.
6. Markdown-Links, Anker, Tabellen und Whitespace.
7. Secretprüfung ohne Ausgabe gefundener Werte.
8. Vollständige finale Git-Prüfung einschließlich unversionierter Inhalte.
9. Nachweis, dass keine externe Arbeitsfläche, fremde Datenbank oder
   `tmp/pagination-build` verändert wurde.
10. Kein Commit.

## Freigabegrenze

5f ist erst abgeschlossen, wenn entweder ein fachlich, rechtlich und
technisch belastbarer kleinster Schnitt ausdrücklich freigegeben oder seine
derzeitige Nichtfreigabefähigkeit nachvollziehbar dokumentiert ist. Das Gate
selbst ist keine Implementierungs-, Datenschutz-, Betriebs- oder
Produktivfreigabe.
