# Ausführbare Folgeübergabe: Inkrement 5c – fachliches Abnahme- und Lebenszyklus-Entscheidungsgate

Stand: 14.08.2026

## Auftrag

Führe nach dem technisch abgeschlossenen Inkrement 5b ein dokumentarisches
und manuelles Gate durch. Stelle den vollständig synthetischen
Beteiligten-/Nutzungsrechtskern fachlich vor, protokolliere konkrete
Abweichungen und entscheide erst danach den kleinsten nächsten
Implementierungsumfang für Lebenszyklus, Fristen oder Wiedervorlagen.

5c ist kein Implementierungsinkrement. Es darf insbesondere keine Frist,
Statuswirkung, Beendigung oder Wiedervorlage auf Verdacht codieren. Ergebnis
muss eine belastbare Entscheidungsmatrix und eine ausführbare Folgeübergabe
für einen ausdrücklich bestätigten kleinen Durchstich oder die dokumentierte
Entscheidung sein, dass noch keine Implementierung sicher ist.

## Verbindlicher Ausgangsstand

Der letzte committed Ausgangsstand beim Aktualisieren dieser Übergabe war:

- Branch `main`;
- HEAD `85b5bbb6aa4fd813ca3c3625e22dcf9de899c826`;
- Upstream `origin/main`;
- Ahead/Behind `0/0`;
- sauberer Index und Arbeitsbaum.

Danach wurden ausschließlich folgende vorbereitete
Dokumentations-/Repository-Hygieneänderungen angelegt und sind als
verbindlicher Eingang zu erhalten:

- `tmp/` wird in `.gitignore` als lokales Laufzeitverzeichnis ignoriert;
- acht versehentlich mit 5b committed Laufzeitprotokolle unter `tmp/` sind
  zur Entfernung vorgemerkt; sie bleiben über Git wiederherstellbar;
- die 5b-Abschlussdokumentation, dieser 5c-Auftrag und der
  Implementierungsindex berücksichtigen die nachgelagerten UI-, Navigations-
  und Suchpaginationverbesserungen.

Falls der tatsächliche Git-Stand davon abweicht, untersuche die Abweichung
vollständig und setze nicht auf den genannten Hash zurück. Überschreibe,
verwerfe, stage oder committe keine fremde Arbeit.

Arbeite ausschließlich im Repository
`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`. Lies zuerst
vollständig:

1. `docs/implementation/cemaris-increment-5b-completion.md`;
2. `docs/implementation/cemaris-increment-5b-next-step-handoff.md`;
3. `docs/requirements/person-usage-rights-deadlines-decisions.md`;
4. `docs/architecture/person-usage-rights-deadlines.md`;
5. `docs/decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md`;
6. `docs/requirements/burial-process-decisions.md`;
7. `docs/architecture/burial-process.md`;
8. `docs/implementation/cemaris-increment-4b-completion.md`;
9. `README.md` sowie die Requirements-, Architecture-, Decisions- und
   Implementation-Indizes.

Prüfe vor jeder logisch getrennten Änderung Branch, HEAD, Upstream,
Ahead/Behind, Status, vollständigen Arbeits- und Index-Diff sowie Inhalt aller
unversionierten Dateien. Vorhandene Arbeit erhalten; nichts verwerfen,
stagen, committen oder auf einen früheren Hash zurücksetzen.

Für .NET darf ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
verwendet werden. Ein technischer Baseline-Lauf ist erlaubt, Änderungen an
Produktcode, Migration, API oder React sind in 5c nicht erlaubt.

Beim Abschluss der letzten manuellen Sitzung waren API und Frontend beendet;
die Ports `5050` und `5173` waren frei. Eine ausschließlich synthetische
manuelle 5b-Datenbank kann auf der freigegebenen lokalen SQL-Instanz noch
vorhanden sein. Vorhandene Datenbanken niemals auf Verdacht löschen oder
verändern. Für eine erneute Sitzung dürfen Verbindungswerte ausschließlich
prozesslokal gesetzt und weder ausgegeben noch in Logs, Quellcode oder
Dokumentation geschrieben werden.

## Daten- und Quellgrenzen

- Nur vollständig synthetische Demonstrationsdaten verwenden.
- Keine echten Personen-, Rechte-, Grab- oder Verwaltungsdaten eingeben.
- Die lokale Satzungsquelle unter
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`
  ausschließlich lesend und nur zur Belegprüfung verwenden.
- Lokale Satzungsaussagen als `SATZUNGSEVIDENZ`, nicht als allgemeinen
  Cemaris-Standard kennzeichnen.
- Keine EDWALT-Originale oder externen Phase-Arbeitsbereiche öffnen.
  Repository-interne EDWALT-Dokumente bleiben gekennzeichnete
  `ALTVERFAHRENS-EVIDENZ` und kein Sollprozess.
- Keine Phase-5-Wurzel oder anderen externen Arbeitsbereiche anlegen.

## Manuelle 5b-Vorführung

Aus der ersten manuellen Bedienrunde sind folgende technische Befunde bereits
behoben und nur noch auf Regression zu prüfen: Auffindbarkeit der
Falldetailansicht über die Suche, uneinheitliches Seitenstyling, eine zu volle
Menüleiste sowie fehlende Navigation über mehrere Suchergebnisseiten. Diese
Punkte sind keine bestätigten fachlichen Lebenszyklusentscheidungen.

Aktiviere die vier Development-Capabilities nur prozesslokal mit Synthetic.
Prüfe mit je einem synthetischen Konto für `Sachbearbeitung` und
`Administration` mindestens:

1. natürliche Person und Organisation mit typabhängigen Pflichtfeldern;
2. historische Anschrift und optionale aktuelle Hauptanschrift;
3. Dublettenwarnung, Abbruch und ausdrücklich bestätigte Wiederholung;
4. Beteiligten-Suche und Wiederverwendung derselben Identität;
5. Startregel je Friedhof: Lesen durch Sachbearbeitung, Ändern nur durch
   Administration;
6. Rechteanlage mit manuellem Beginn, Ende und Quellenreferenz;
7. unveränderter Startregel-Snapshot nach späterer Konfigurationsänderung;
8. Übertragung, Verlängerung und Faktenkorrektur mit Begründung;
9. Inhaberzeiträume und unveränderliche Fachrevisionen;
10. Konflikt zweier Browserstände mit Eingabeerhalt und Neuladen;
11. klare Trennung zwischen kanonischem 5b-Kern und nullable
    Altprojektionen;
12. Tastaturbedienung, Fokus, Beschriftungen, Fehlermeldungen und schmale
    Viewports.

Pro Beobachtung erfassen: Szenario, Rolle, Soll, Ist, Schweregrad,
Reproduktionsschritte, Entscheidung und gegebenenfalls Screenshotreferenz.
Screenshots dürfen ausschließlich synthetische Daten zeigen und gehören nur
in einen ausdrücklich freigegebenen repository-internen Ablageort.

## Verbindlich zu entscheidende Lebenszyklusfragen

Jede Antwort muss als `BESTÄTIGT`, `OFFEN`, `WIDERSPRUCH` oder `VERWORFEN`
gekennzeichnet und mit Quelle, Geltungsbereich und Freigabefunktion versehen
werden. Mindestens zu klären sind:

| ID | Entscheidungsfrage |
| --- | --- |
| 5C-01 | Welche fachlichen Rechtearten existieren allgemein, und welche davon gehören in den nächsten Durchstich? |
| 5C-02 | Was bedeutet das manuelle Enddatum; darf es geändert werden und hat es allein jemals Statuswirkung? |
| 5C-03 | Welche Ereignisse beginnen Ruhe- und Nutzungszeiten, und welche Regelversion gilt rückwirkungsfrei für einen Einzelfall? |
| 5C-04 | Wie werden Dauer, Einheit, Rundung, inklusive/exklusive Grenzen und Schaltjahre behandelt? |
| 5C-05 | Welche Wechselwirkungen bestehen zwischen Beisetzung, Ruhezeit, verbleibender Nutzungszeit und Verlängerung? |
| 5C-06 | Welche Zustände und Übergänge sind für Beendigung, Rückgabe, Entzug, Schließung und Wiedervergabe zulässig? |
| 5C-07 | Wer darf welchen Übergang auslösen, bestätigen, korrigieren oder zurücknehmen? |
| 5C-08 | Welche Quellenreferenz, Begründung und Fachrevision ist je Übergang erforderlich? |
| 5C-09 | Welche Wirkung haben Friedhofs- und Grabstellenstatus auf bestehende und neue Rechte? |
| 5C-10 | Welche Altfall- und Satzungsstandsregel gilt; ist ein manueller Bestandsschutz-Snapshot erforderlich? |
| 5C-11 | Welche Wiedervorlagen sind fachlich nötig, wodurch entstehen sie und wann gelten sie als erledigt, verschoben oder aufgehoben? |
| 5C-12 | Sind Erinnerungen nur manuell oder später automatisch; welche Rollen, Fristen, Eskalationen und Kanäle gelten? |
| 5C-13 | Welche Aufbewahrungs-, Lösch-, Sperr- und Anonymisierungsregeln gelten für Beteiligte und Revisionen? |
| 5C-14 | Welche der kommunalen Regeln sind lokale Konfiguration und welche allgemeines Produktverhalten? |

Die in der 5a-Evidenz dokumentierten Widersprüche, insbesondere Verlängerung
„nach Ablauf“ gegenüber Verlängerung vor weiterer Beisetzung, dürfen nicht
still aufgelöst werden.

Kann eine der Fragen nicht anhand der Pflichtlektüre und ausdrücklich
freigegebener Evidenz beantwortet werden, lege dem Benutzer einen kompakten,
nummerierten Entscheidungsblock vor. Ohne dessen Antwort bleibt die Frage
`OFFEN`; eine Fachregel darf weder geraten noch implementiert werden.

## Erwartete Ergebnisse

5c liefert ausschließlich Dokumentation:

- Protokoll und priorisierte Befunde der manuellen 5b-Vorführung;
- aktualisierte Entscheidungsmatrix mit Quellen und Geltungsbereich;
- bestätigte Korrekturen am 5b-Verständnis, ohne sie bereits zu
  implementieren;
- Architekturvarianten für den kleinsten nächsten Durchstich einschließlich
  Historisierung, Atomarität, ETag, Audit, Migration und Altkompatibilität;
- klare Nicht-Ziele und weiterhin offene Gates;
- eine kontextlose, ausführbare Folgeübergabe für das bestätigte nächste
  Implementierungsinkrement oder ein weiteres Entscheidungsgate;
- aktualisierte README- und Dokumentationsindizes.

Falls die manuelle Vorführung einen reproduzierbaren technischen 5b-Defekt
zeigt, dokumentiere ihn separat mit Schweregrad. Eine Codekorrektur benötigt
einen ausdrücklich erteilten Folgeauftrag und gehört nicht in 5c.

## Abschlussprüfung

Prüfe Markdown-Links, Tabellen, Whitespace, Secretfreiheit und
`git diff --check`. Führe die vollständige finale Git-Prüfung einschließlich
aller unversionierten Inhalte aus. Dokumentiere, dass kein Commit erstellt
und weder externe Daten noch externe Arbeitsbereiche verändert wurden.

5c behauptet keine fachliche Verwaltungsabnahme, Rechtsprüfung,
Datenschutzfreigabe, Betriebsfreigabe oder Produktivfreigabe. Eine einzelne
Vorführung ersetzt keine dieser Freigaben.
