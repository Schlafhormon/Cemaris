# Ausführbare Folgeübergabe: Inkrement 5g – kommunales Kurzentscheidungs- und Freigabegate

Stand: 24.08.2026

## Auftrag

Führe als nächsten Schritt des Nutzungsrechtslebenszykluspfads ein kurzes,
ausschließlich dokumentarisches Fach- und Freigabegate für genau einen
Untersuchungskandidaten durch:

> manuell ausgelöste und historisierte vorzeitige Rückgabe eines kanonischen
> Nutzungsrechts nach bereits abgelaufener Ruhezeit.

Die Operation ist noch keine bestätigte Cemaris-Fachregel. 5g soll mit den
zuständigen Funktionen entweder die fehlenden Mindestentscheidungen schließen
oder erneut präzise Variante A „keine Implementierung“ feststellen. 5g
implementiert nichts.

## Verbindliche Arbeitsgrenzen

Arbeite ausschließlich im Repository
`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`. Verwende für .NET
ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.

Keine externe Phase-Arbeitsfläche oder EDWALT-Originale öffnen. Repository-
interne EDWALT-Dokumente dürfen nur als `ALTVERFAHRENS-EVIDENZ` gelesen
werden. Falls ein außerhalb des Repositorys liegendes Original unvermeidbar
erscheint, vor dem ausschließlich lesenden Zugriff exakten Pfad und Erlaubnis
erfragen. Keine Datenbank, echte Verwaltungsdaten, API, Frontendserver,
SQL-Suite oder manuelle Fachmutation verwenden. Keinen Commit erstellen.

## Erwarteter Repository-Ausgangsstand

Beim Aktualisieren dieser Übergabe am 24.08.2026 war der vollständig
erhaltene Stand:

- Branch `main`;
- HEAD `aee488c13fe1ec22cb98f2e35194423071d6d8ff`;
- Upstream `origin/main`;
- Ahead/Behind `2/0`;
- leerer Index;
- kein durch 5f erstellter Commit;
- keine Produktcode-, Test-, API-, Domain-, Persistenz- oder
  Migrationsänderung aus 5f.

Geändert und versioniert waren ausschließlich:

- `README.md`;
- `docs/architecture/README.md`;
- `docs/architecture/person-usage-rights-deadlines.md`;
- `docs/decisions/README.md`;
- `docs/implementation/README.md`;
- `docs/requirements/README.md`;
- `docs/requirements/person-usage-rights-deadlines-decisions.md`.

Neu, unversioniert und vollständig zu erhalten waren ausschließlich:

- `docs/implementation/cemaris-increment-5f-completion.md`;
- `docs/implementation/cemaris-increment-5f-evidence-decision-approval-matrix.md`;
- diese 5g-Folgeübergabe.

Falls diese Arbeit vor Beginn des neuen Chats committed oder gepusht wurde
oder der Git-Stand anderweitig abweicht, die Abweichung vollständig
untersuchen. Nicht auf den genannten Hash zurücksetzen. Vorhandene Arbeit
weder überschreiben noch verwerfen, stagen oder committen.

Der vorbestehende ignorierte Fremdbestand unter `tmp/pagination-build`
umfasste 890 Dateien und 120.354.652 Bytes. Sein aus relativem Pfad,
Dateilänge, UTC-Änderungszeit und Datei-SHA-256 gebildeter Manifest-Hash war
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.
Den Bestand weder verändern noch entfernen oder als eigene Arbeit ausgeben.

Der letzte vollständige 5f-Prüflauf ergab:

- Release-Build: 0 Warnungen und 0 Fehler;
- 32 bestandene Unit-Tests;
- 50 bestandene reguläre Integrationstests ohne SQL-Kategorie;
- 37 bestandene Frontendtests in 8 Testdateien;
- erfolgreiche Format-, Frontend-Lint- und Produktionsbuildprüfung;
- 83 geprüfte Markdown-Dateien ohne Link- oder Ankerbefund;
- konsistente Tabellen, kein Whitespace-, Secret- oder Git-Diff-Befund;
- Ports 5050 und 5173 frei.

## Ausgangsstand prüfen

Vor jeder logisch getrennten Änderung vollständig prüfen:

- Branch, HEAD, Upstream und Ahead/Behind;
- Git-Status sowie vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts;
- den vorbestehenden ignorierten Bestand `tmp/pagination-build`, ohne ihn zu
  verändern oder als eigene Arbeit auszugeben.

Vorhandene Arbeit niemals zurücksetzen, verwerfen, überschreiben, stagen oder
committen. Abweichungen vom in
[5f-Abschluss](cemaris-increment-5f-completion.md) dokumentierten Stand zuerst
vollständig untersuchen.

Der neue Chat soll zuerst feststellen, ob der Benutzer jetzt belastbare
Auskünfte der erforderlichen Funktionen bereitstellen kann. Noch fehlende
Antworten werden in genau einem konsolidierten Block erfragt. Bereits
dokumentierte Aussagen der technischen Administration vom 21.08.2026 werden
nicht erneut erfragt.

## Pflichtlektüre

Vollständig lesen:

1. `docs/implementation/cemaris-increment-5f-completion.md`;
2. `docs/implementation/cemaris-increment-5f-evidence-decision-approval-matrix.md`;
3. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
4. `docs/architecture/person-usage-rights-deadlines.md`;
5. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
6. `docs/requirements/identity-authorization-audit-decisions.md`;
7. `docs/architecture/authentication-authorization-audit.md`;
8. Root-README und alle vier Dokumentationsindizes.

## Erforderliche Beteiligung

Mindestens erforderlich sind benannte Aussagen beziehungsweise Freigaben von:

- Friedhofsverwaltung oder fachlich verantwortlicher kommunaler Funktion;
- Produktverantwortung;
- zuständiger Rechtsprüfung;
- Berechtigungs- oder Informationssicherheitsverantwortung;
- Datenschutz und Betrieb, soweit Fachrevision, Audit und Aufbewahrung
  betroffen sind.

Die technische Administration darf den Termin koordinieren und technische
Folgen erklären, ersetzt aber keine dieser fachlichen Freigaben.

Wenn der Benutzer keine benannte Fach- oder Freigabequelle bereitstellen kann,
ist dies eine belastbare Antwort für das Gate: Die betreffende Aussage bleibt
offen, Variante A wird dokumentiert, und es wird keine Fachregel erfunden.

## Ein einziger Entscheidungsbogen

Die Antworten müssen jeweils Datum, auskunftgebende Rolle/Funktion, Quelle und
kommunalen Geltungsbereich enthalten. Zu klären sind ausschließlich:

1. tatsächlicher Bedarf und betroffene Rechte-/Fallarten;
2. Auslöser, Antrag/Erklärung und Pflichtnachweis;
3. Wirksamkeitsdatum, Rückwirkung, Korrektur und Rücknahme;
4. expliziter Rechtzustand und unveränderte Fakten;
5. auslösende, bestätigende, korrigierende und rücknehmende Funktionen;
6. Konflikte mit Beisetzungen und Ende des offenen Inhaberzeitraums;
7. ausdrücklich keine oder atomare Wirkung auf Grabstatus und Sperre sowie
   getrennte Wiedervergabe;
8. Pflichtquelle, Begründung, Fachrevision, starker ETag, Atomarität und
   sparsamer Audit;
9. Altbestand, Bestandsschutz, Migration und fehlende Nachweise;
10. tatsächlich erteilte Fach-, Rechts-, Datenschutz-, Sicherheits- und
    Betriebsfreigaben.

Bereits bestätigte Grenzen werden nicht neu verhandelt: Das manuelle Enddatum
hat allein keine Statuswirkung; kommunale Regeln werden nicht zu allgemeinen
Open-Source-Defaults; bestehende Historisierung, Atomarität, ETag und
Auditminimierung bleiben technische Mindestmechanismen.

## Entscheidung

- Variante A, sobald eine Antwort unklar, widersprüchlich oder nicht durch die
  zuständige Funktion freigegeben ist. Fehlstelle und Funktion exakt nennen.
- Variante B nur, wenn alle Mindestentscheidungen für genau diese eine
  manuelle Operation belastbar vorliegen. Dann ausschließlich eine separate
  spätere Implementierungsübergabe erstellen; in 5g nicht implementieren.
- Variante C mit Berechnung, Automatik, Wiedervorlage, Grabstellenautomatik
  oder Wiedervergabe bleibt ausgeschlossen.

Ein neues ADR nur erstellen, wenn eine bestätigte Entscheidung ADR-0016
erweitert oder ersetzt. ADR-0016 nicht rückwirkend umschreiben.

## Abschluss

Quellenmatrix, Antworten, Freigabestatus, Variantenvergleich und Entscheidung
deutsch dokumentieren. Root-README und vier Indizes nur soweit nötig
aktualisieren. Markdown, Links, Anker, Tabellen, Whitespace, Secrets und Git
vollständig prüfen. Build, Unit-Tests, reguläre Integrationstests, Format sowie
Frontendtests, Lint und Produktionsbuild ausführen. Keine SQL-Suite und keinen
Commit ausführen.
