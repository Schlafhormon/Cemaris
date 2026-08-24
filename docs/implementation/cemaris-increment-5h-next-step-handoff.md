# Ausführbare Folgeübergabe: Inkrement 5h – fachregelarmes Produktauswahlgate

Stand: 24.08.2026

## Auftrag

Führe als nächsten sicheren Cemaris-Schritt ein ausschließlich
dokumentarisches Auswahlgate für genau ein fachregelarmes technisches
Folgeinkrement durch. Ziel ist, die einfache EDWALT-Ablösung auf bereits
bestätigten Cemaris-Verträgen weiterzuentwickeln, ohne die in 5g abgelehnte
Nutzungsrechtsrückgabe oder andere offene kommunale Regeln zu implementieren.

## Repository und Werkzeuggrenzen

Arbeite ausschließlich im Repository
`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`. Verwende für .NET
ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.

Keine externe Phase-Arbeitsfläche und keine EDWALT-Originale öffnen.
Repository-interne EDWALT-Dokumente sind ausschließlich ausdrücklich
gekennzeichnete `ALTVERFAHRENS-EVIDENZ`, kein Sollprozess. Keine Datenbank,
keine echten Verwaltungsdaten, keine API, keinen Frontend-Dev-Server und keine
manuelle Fachmutation verwenden. Keinen Commit erstellen.

## Ausgangsstand prüfen

Beim Abschluss von 5g war der erwartete erhaltene Stand:

- Branch `main`;
- HEAD `7e93eafb5a2af1ba95df98fe3bf1d5d462ba3a96`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- leerer Index und kein in 5g erstellter Commit;
- geändert ausschließlich Root-README, alle vier Dokumentationsindizes sowie
  die Anforderungs- und Architekturdokumente zu Nutzungsrechten;
- neu und unversioniert ausschließlich 5g-Abschluss, 5g-Matrix und diese
  5h-Folgeübergabe;
- keine Produktcode-, Test-, API-, Domain-, Persistenz- oder
  Migrationsänderung.

Falls dieser Stand committed oder gepusht wurde oder anderweitig abweicht,
die Abweichung vollständig untersuchen. Nicht auf den genannten Hash
zurücksetzen und keine vorhandene oder fremde Arbeit überschreiben.

Vor der ersten und jeder logisch getrennten Änderung vollständig prüfen:

- Branch, HEAD, Upstream und Ahead/Behind;
- Git-Status sowie vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts;
- den ignorierten Fremdbestand `tmp/pagination-build`, ohne ihn zu verändern.

Vorhandene Arbeit niemals zurücksetzen, verwerfen, überschreiben, stagen oder
committen. Der bei 5g unveränderte Fremdbestand umfasst 890 Dateien und
120.354.652 Bytes. Sein Manifest-Hash aus repository-relativem Pfad mit `/`,
Dateilänge, UTC-Ticks und Datei-SHA-256, je Feld mit `|` und je Zeile mit LF
getrennt, lautet
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.

## Pflichtlektüre

Vollständig lesen:

1. `docs/implementation/cemaris-increment-5g-completion.md`;
2. `docs/implementation/cemaris-increment-5g-evidence-decision-approval-matrix.md`;
3. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
4. `docs/architecture/person-usage-rights-deadlines.md`;
5. `docs/requirements/README.md`;
6. `docs/architecture/README.md`;
7. `docs/implementation/README.md`;
8. Root-README und ADR-Index.

## Verbindliche Auswahlgrenzen

Untersuche den vorhandenen Produktstand und schlage genau einen kleinen
technischen oder bedienbezogenen Schnitt vor, der ausschließlich bereits
bestätigte Verträge verwendet. Bevorzugt sind beispielsweise:

- Verständlichkeit, Navigation, Barrierearmut oder responsive Bedienung auf
  vorhandenen API-Verträgen;
- technische Robustheit, Fehlerdarstellung oder Nebenläufigkeitsbehandlung
  innerhalb bereits bestätigter Semantik;
- rein lesende, datensparsame Darstellung bereits vorhandener kanonischer
  Informationen;
- Test- oder Dokumentationsverbesserungen, die keine neue Fachwirkung
  behaupten.

Der konkrete Kandidat muss durch Repositorybefund und nachvollziehbaren
Nutzerwert belegt werden. Er darf in 5h nur ausgewählt und als separate
Implementierungsübergabe spezifiziert, noch nicht umgesetzt werden.

Ausgeschlossen sind:

- Rückgabe, Verzicht, Entzug, endgültige Beendigung oder Wiedervergabe von
  Nutzungsrechten;
- automatische oder berechnete Ruhe-, Nutzungs-, Gebühren- oder
  Aufbewahrungsfristen;
- Status-, Grabstellen- oder Wiedervorlagenautomatik;
- neue fachliche Rollen, Freigaben oder Vier-Augen-Regeln;
- Rückinterpretation oder automatische Anreicherung von EDWALT-Altdaten;
- Gebühren-, Bescheid-, DMS- oder Migrationssemantik ohne eigenes Fachgate.

## Variantenvergleich

Vergleiche mindestens:

- Variante A: kein technisches Folgeinkrement auswählen;
- Variante B: genau einen kleinen Schnitt auf vorhandenen Verträgen
  auswählen;
- Variante C: einen Schnitt mit neuer oder offener Fachregel; zwingend
  verwerfen.

Variante B ist nur zulässig, wenn der Repositorybefund den Bedarf trägt, der
Schnitt keine neue Fachregel benötigt und seine Abnahme vollständig mit
synthetischen Daten möglich ist. Andernfalls Variante A wählen.

## Abschlussartefakte

Erstelle mindestens:

- `docs/implementation/cemaris-increment-5h-completion.md`;
- einen quellengebundenen Variantenvergleich;
- bei Variante B eine separate, kontextlose Implementierungsübergabe;
- notwendige Aktualisierungen von Root-README und allen vier Indizes.

Kein neues ADR, sofern keine tatsächlich bestätigte Architekturentscheidung
entsteht. Bestehende ADRs nicht rückwirkend umschreiben.

## Abschlussprüfungen

- Release-Build mit 0 Warnungen und 0 Fehlern;
- vollständige Unit-Tests;
- reguläre Integrationstests mit `Category!=SqlServer`;
- `dotnet format --verify-no-changes --no-restore`;
- `npm ci`, vollständige Frontendtests, Lint und Produktionsbuild;
- `git diff --check`, Markdown-Links und -Anker, Tabellen, Whitespace und
  Secretprüfung ohne Ausgabe gefundener Werte;
- vollständige finale Git-Prüfung einschließlich unversionierter Inhalte;
- Nachweis, dass keine Datenbank, externe Arbeitsfläche oder der Bestand
  `tmp/pagination-build` verändert wurde;
- Nachweis, dass kein Commit erstellt wurde.
