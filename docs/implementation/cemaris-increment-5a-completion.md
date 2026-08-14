# Abschlussdokumentation: Inkrement 5a – Entscheidungsgate

Stand: 14.08.2026

## Ergebnis

Das fachliche und architektonische Entscheidungsgate 5a ist geschlossen. Es
wurde kein Produktivcode, kein Test, keine Laufzeitkonfiguration, keine
Migration und kein Laufzeitverhalten verändert.

Der kleinste bestätigte technische Folgeauftrag ist Inkrement 5b: ein
manueller, historisierbarer Beteiligten-/Nutzungsrechtskern mit
konfigurierbarem Startbezug je Friedhof. Automatische Fristberechnung,
Statuswirkung und Wiedervorlagen bleiben ausdrücklich ausgeschlossen.

Die ausführbare Folgeübergabe steht in
[`cemaris-increment-5b-next-step-handoff.md`](cemaris-increment-5b-next-step-handoff.md).

## Durchgeführte Quellenarbeit

Vollständig gelesen wurden die in der 5a-Übergabe vorgeschriebenen
Repository-Dokumente, ADRs, lesenden Verträge für Berechtigte, Anschriften und
Nutzungsrechte, Persistenzmodell, Migrationen, React-Verträge und zugehörigen
Unit-, API-, Frontend- und realen SQL-Testverträge.

Die beiden lokalen PDF-Satzungen wurden vollständig textlich und visuell
geprüft. Maßgebliche Fundstellen sind in der Evidenzmatrix des
[Entscheidungsdokuments](../requirements/person-usage-rights-deadlines-decisions.md)
mit Dokument, Paragraph und PDF-Seite festgehalten. Die
Projektverantwortung bestätigte am 14.08.2026 die Lesefassungen von 2023 als
aktuelle lokale Fassung für den in § 1 der Friedhofssatzung beschriebenen
Geltungsbereich. Dies ist keine Rechtsprüfung.

EDWALT-Originale oder externe Phase-Arbeitsbereiche wurden nicht geöffnet.
Repository-interne EDWALT-Dokumente wurden ausschließlich als
`ALTVERFAHRENS-EVIDENZ` behandelt. Außerhalb des Repository wurden keine
Arbeitsverzeichnisse angelegt; temporäre PDF-Renderings wurden nach der
vollständigen Sichtprüfung entfernt.

## Geschlossene Entscheidungen

- fallübergreifend stabile Beteiligte der Arten natürliche Person und
  Organisation;
- ausschließlich typabhängige Namen und historische Postanschriften in 5b;
- warnende Dublettenprüfung mit ausdrücklicher Bestätigung, kein Merge;
- als einzige 5b-Rolle genau ein aktueller Nutzungsrechtsinhaber;
- stabile Nutzungsrechtsidentität und genau eine kanonische Grabstelle;
- manuelle Pflichtangaben für Beginn, Ende und Quelle/Referenz;
- manuelle, historisierte Übertragung, Verlängerung und Faktenkorrektur;
- starke Versionen sowie atomare Fachhistorie und sparsamer Audit;
- fachliche 5b-Operationen für Sachbearbeitung und Administration,
  Startkonfiguration ausschließlich für Administration;
- lokaler Startbezug `Übergabe der Nutzungsurkunde` als einstellbare
  Programmkonfiguration, nicht als Code- oder Seed-Default; die Architektur
  führt sie versioniert je Friedhof.

Die Anforderungen besitzen stabile REQ-IDs in
[`person-usage-rights-deadlines-decisions.md`](../requirements/person-usage-rights-deadlines-decisions.md).
Die technische Trennung des neuen kanonischen Kerns von den alten nullable
Lesetabellen ist in der
[Architektur](../architecture/person-usage-rights-deadlines.md) und
[ADR-0016](../decisions/ADR-0016-canonical-parties-and-historicized-usage-rights.md)
festgehalten.

## Bewusst offene Entscheidungen

Außerhalb von 5b bleiben insbesondere weitere Personenrollen,
Rechtsnachfolgeautomatik, endgültige Beendigung und Wiedervergabe,
Nutzungsrechtszustände, alle Ruhe-/Nutzungs-/Aufbewahrungsberechnungen,
Regelstands- und Altfallwirkung, Wiedervorlagen, Gebühren, Dokumente,
Löschung/Anonymisierung und besondere Aufbewahrungsregeln offen.

Der dokumentierte Widerspruch zwischen der Verlängerungsformulierung in der
lokalen Gebührensatzung Anlage A, PDF-Seite 2, und der möglichen Verlängerung
vor einer weiteren Beisetzung nach Friedhofssatzung § 14, PDF-Seiten 9–10,
wurde nicht geraten aufgelöst. Er blockiert den manuellen 5b-Kern nicht, wohl
aber spätere Gebühren- oder Fristautomatik.

## Baseline vor Dokumentationsänderungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build mit vorgegebenem .NET 10.0.302 | grün, 0 Warnungen, 0 Fehler |
| gesamte .NET-Tests ohne reale SQL-Suite | 26 Unit- und 43 reguläre Integrationstests bestanden; 10 SQL-Tests erwartungsgemäß übersprungen |
| `.NET format --verify-no-changes` | grün |
| `npm ci` | grün, 0 bekannte Schwachstellen gemeldet |
| React-Tests | 12 Tests bestanden |
| ESLint und Produktionsbuild | grün |
| reale SQL-Suite gegen `CEMARISDEV` | 10 Tests bestanden, 0 übersprungen |
| temporäre SQL-Datenbanken vor/nach Suite | jeweils 0 |
| Markdown-Links und Tabellen | 67 Dateien, 0 Fehler |
| Secretprüfung ohne Wertausgabe | 0 Trefferdateien |
| `git diff --check` | grün |

Die SQL-Verbindung wurde ausschließlich prozesslokal verwendet und aus der
Umgebung entfernt. Ihr Wert wurde weder ausgegeben noch dokumentiert.

## Abschlussprüfung

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build mit vorgegebenem .NET 10.0.302 | grün, 0 Warnungen, 0 Fehler |
| gesamte .NET-Tests ohne reale SQL-Aktivierung | 26 Unit- und 43 reguläre Integrationstests bestanden; 10 SQL-Tests erwartungsgemäß übersprungen |
| `.NET format --verify-no-changes` | grün |
| `npm ci` | grün, 0 bekannte Schwachstellen gemeldet |
| React-Tests | 12 Tests bestanden |
| ESLint und Produktionsbuild | grün |
| reale SQL-Suite gegen `CEMARISDEV` | 10 Tests bestanden, 0 übersprungen |
| prozesslokale SQL-Testvariable nach Suite | entfernt |
| `sys.databases` vor/nach SQL-Suite | jeweils 0 Datenbanken mit Präfix `Cemaris_IntegrationTests_` |
| Markdown-Links und Tabellen | 72 Dateien, 0 Fehler |
| Secretprüfung des Änderungsumfangs ohne Wertausgabe | 0 Trefferdateien |
| Änderungen unter Produktivcode, Tests, Laufzeitkonfiguration oder Migrationen | 0 |
| `git diff --check` | grün |
| finaler Index | leer |

Der abschließende Git-Vollcheck bestätigte weiterhin Branch `main`, HEAD
`f7a6d094f241e68a58a15196ab632b96a342fafc`, Upstream `origin/main` und
Ahead/Behind `0/0`. Neben den erhaltenen vorbereiteten Dokumentänderungen
enthält der Arbeitsbaum ausschließlich die hier beschriebenen neuen und
aktualisierten Markdown-Dokumente. Kein Artefakt wurde gestaged und kein
Commit ausgeführt.

## Geänderte Dokumentationsartefakte

Neu entstanden sind:

- fachliche Entscheidungen und Evidenzmatrix;
- Architektur des manuellen Beteiligten-/Nutzungsrechtskerns;
- ADR-0016;
- diese Abschlussdokumentation;
- die kontextlos ausführbare 5b-Folgeübergabe.

Die Root- und Dokumentationsindizes sowie die ursprüngliche 5a-Übergabe
wurden additiv aktualisiert. Vorbereitete Dokumentationsverbesserungen aus dem
vorherigen Arbeitslauf wurden vollständig erhalten.

## Freigabegrenze

Die für den kleinen 5b-Umfang erforderlichen Produktentscheidungen sind
geschlossen; damit ist der technische Development-Arbeitsauftrag der
5b-Übergabe ausführbar. Nicht erteilt sind eine fachliche Verwaltungsabnahme,
Rechtsprüfung, Datenschutzfreigabe, Betriebsfreigabe oder Produktivfreigabe.
Es wurde kein Commit ausgeführt.
