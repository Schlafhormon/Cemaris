# Arbeitsplan zur ersten alltagstauglichen Cemaris-Version

Stand: 09.09.2026

Status: **M1 und M2a umgesetzt und gezielt auf SQL geprüft; M3a implementiert und isoliert nachgewiesen;
keine Produktivfreigabe.** Die Projektverantwortung möchte Cemaris zu einer
vollwertigen Friedhofsverwaltung ausbauen und dabei vollständige, sauber
geprüfte Abläufe erhalten. Quelle ist der anschließende Implementierungsdialog
vom 07.09.2026 nach der
[Beisetzungsauswahl](cemaris-notice-generation-burial-selection-completion.md).

Dieser Plan ordnet vorhandene Arbeit und offene Lücken. Er ersetzt keine
fachlichen Einzelentscheidungen. Maßgeblich bleibt die
[Prototypentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp):
lokale synthetische Entwicklung darf ohne erneute allgemeine Freigaberunden
weitergehen; fehlende Fachregeln werden ausdrücklich geklärt.

## Ziel und Abgrenzung

Die erste alltagstaugliche Version soll die tatsächlich benötigten täglichen
Arbeitsabläufe zusammenhängend tragen: Fälle finden und bearbeiten,
Grabstellen und Beisetzungen verwalten, Beteiligte und Nutzungsrechte
nachvollziehen, offene Arbeit wiederfinden und die benötigten Gebühren- und
Dokumentabläufe bearbeiten. Für die reale Einführung kommen nachgewiesene
Persistenz, Mehrbenutzerbetrieb, Datenübernahme und Betrieb hinzu.

Eine Prozentangabe zum Fertigstellungsgrad wäre derzeit unbelegt. Ebenso ist
„alle Funktionen von EDWALT“ kein hinreichender Sollumfang. FINANZ+ bleibt für
Buchung, Zahlungen und Mahnungen führend; die optionale Winyard-Integration
darf die eigenständige Nutzbarkeit von Cemaris nicht voraussetzen.

## Stand, Lücken und Reihenfolge

| Arbeitsbereich | Belegter Ausgangspunkt | Noch zu schließen | Abnahmekriterium des jeweiligen Ausbaus |
| --- | --- | --- | --- |
| Fallarbeit und Suche | Suche, Pagination, Fallanlage, Personen- und Grabbezüge, Fehler- und Konfliktbehandlung technisch vorhanden | zusammenhängende Alltagsabnahme einschließlich Korrektur- und Mehrpersonenfällen | Fall nach erneutem Öffnen wiederfinden; richtige Beziehungen; keine still überschriebenen Fremdänderungen |
| Grabstellen und Beisetzungen | konfigurierbare Friedhofsstruktur und einfacher Beisetzungsprozess vorhanden | weitere tatsächlich benötigte Sonderfälle und fachliche Belegungsregeln einzeln klären | bestätigte Standard- und Korrekturabläufe wirken konsistent auf Fall, Beisetzung und Grabstelle |
| M1: offene Arbeit | [manueller Kern implementiert](cemaris-manual-case-follow-ups-completion.md); [gezielter SQL-Nachweis bestanden](cemaris-manual-case-follow-ups-sql-verification.md), einschließlich Migration, Parallelrennen, Rollback und Anwendungshostwechsel | gemeinsame Arbeitsabnahme und installationsbezogene Einführung bleiben Teil von M4 | manuelle Aktionen synthetisch bestanden; eigene SQL-Persistenz und Konfliktschutz geprüft; keine Wirkung auf fachliche Fristen oder Grabstatus |
| M2: Nutzungsrechte und Fristen | [M2a implementiert und geprüft](cemaris-manual-usage-right-termination-completion.md), einschließlich manueller Neuvergabe und atomarer Folgekorrektur | weitere M2-Fachabläufe konkretisieren; Ruhezeit, Fristautomatik und automatische Wiedervergabe bleiben eigenständig | Beendigung, Rücknahme, manuelle Neuvergabe und gemeinsame Folgekorrektur einschließlich Historie, Inhaberzeitraum, Konflikt- und SQL-Nachweis; keine automatische Grabwirkung |
| M3: Gebühren und Bescheide | manuelle Entwürfe und eine flüchtige DOCX-/PDF-Ausgabe vorhanden; [M3a implementiert und isoliert geprüft](cemaris-manual-notice-line-items-completion.md) | Katalog, Gültigkeitsstände und wirksame Bescheidabläufe separat klären | M3a: Positionen/Summe stimmen in aktuellem Stand, Historie, UI und DOCX/PDF; Altbestand, Konfliktschutz und isolierte SQL-Persistenz nachgewiesen |
| M4: Einführung und Betrieb | SQL-Provider, Identität, Sicherheitsgrundlagen und datierte technische Nachweise vorhanden | aktuelle isolierte SQL-Nachweise, gemeinsame Arbeitsabnahme, Installation, Zuständigkeiten und konkreter Einführungsumfang | vereinbarte Arbeitsabläufe auf einer benannten Installation mit mehreren Sitzungen, Neustart und Wiederherstellung nachgewiesen |
| M5: Datenübernahme und benötigte Schnittstellen | begrenzter Friedhofsstammdatenpfad und Integrationsgrenzen dokumentiert | weitere Mappings, Vollständigkeit, Fehlerbehandlung, Einführung und Rückfall separat vorbereiten | nachvollziehbarer Quell-/Zielvergleich und kontrollierte Übernahme ohne Verlust geschützter Bestände |

M3a ist als begrenzter manueller Schnitt abgeschlossen. Weitere M2- und M3-Schnitte benötigen
konkrete fachliche Beispiele und Antworten; ihre Reihenfolge
kann anhand des tatsächlichen täglichen Bedarfs angepasst werden. SQL- und
Integritätsarbeit begleitet die Inkremente von Anfang an. M4 bezeichnet die
zusammenhängende Einführungsabnahme, nicht einen erst am Schluss beginnenden
Persistenz- oder Sicherheitstest.

## M1-Abschluss und nächster Nachweis

Die [M1-Übergabe](cemaris-manual-case-follow-ups-next-step-handoff.md) ist
einschließlich der kleinen 6c-Einleitungstextkorrektur ausgeführt. Der
[Abschluss](cemaris-manual-case-follow-ups-completion.md) dokumentiert den
vollständigen synthetischen Ablauf, aktuelle Regressionstests und Offline-Schema.
Der ursprünglich offene gezielte SQL-Test wurde anschließend ausdrücklich
beauftragt und ist gemäß [SQL-Folgenachweis](cemaris-manual-case-follow-ups-sql-verification.md)
bestanden. Zwei EF-Fehler wurden dabei behoben; Migration, Konkurrenz, Rollback
und Persistenz über Anwendungshostwechsel wurden auf entbehrlichen Datenbanken
geprüft. Bestehende Datenbanken blieben geschützt. Auch M2a ist inzwischen
umgesetzt. Der unten beschriebene M3a-Positionsschnitt ist ebenfalls
abgeschlossen. M2 bis M5 sind weiterhin
eigenständige Ausbauvorhaben. Die gesamte
Roadmap und bereits erledigte 6c-Gates werden dadurch nicht erneut beauftragt.

## Abgeschlossener manueller Schnitt M2a

Die [neue Übergabe](cemaris-manual-usage-right-termination-next-step-handoff.md)
enthält Arbeitsverzeichnisse, verifizierte Dateien, konkrete Codeanschlüsse,
Test-/Browseranforderungen und Bestandsgrenzen. Die
[Produktentscheidung](../requirements/manual-usage-right-termination-decisions.md)
enthält alle fünf ausdrücklich bestätigten Antworten: Rückgabe oder sonstige
Beendigung heute oder rückwirkend, begründete Rücknahme, manuelle Neuvergabe
und gemeinsame Korrektur bestehender Rechtefolgen. Bei der Folgekorrektur wird
der Vorgänger wieder geöffnet; betroffene Nachfolger bleiben als „Irrtümlich
angelegt“ mit ihren bisherigen Revisionen erhalten. Die technischen Regeln und
Prüfbeispiele sind festgehalten. Keine erneute Produktfreigabe erforderlich.
Die Implementierung und neue SQL-/Browsernachweise sind im
[Abschluss](cemaris-manual-usage-right-termination-completion.md) dokumentiert.
Die Capability bleibt deaktiviert; weitergehende M2-Regeln sind nicht implementiert.

## Abgeschlossener manueller Schnitt M3a

Die [Produktantworten vom 08.09.2026](../requirements/manual-notice-line-items-decisions.md)
bestätigen mehrere manuelle Gebührenpositionen mit Bezeichnung und positivem
EUR-Betrag, höchstens zwei Nachkommastellen, exakter verbindlicher Gesamtsumme
und vollständiger DOCX-/PDF-Ausgabe. Die [neue Übergabe](cemaris-manual-notice-line-items-next-step-handoff.md)
enthält Arbeitsdateien, Bestands-/Revisionsschutz, Konflikt- und
Ausgabevertrag sowie isolierte SQL-/Browsernachweise. **Implementiert;
Nachweise und Grenzen im [Abschluss](cemaris-manual-notice-line-items-completion.md).** Es fehlen keine erneut zu bestätigenden Produktalternativen
für diesen Umfang. Gebührenkatalog, Mengen, Tarife, Gültigkeitsberechnung,
wirksame Festsetzung/Korrekturbescheide und FINANZ+-Integration bleiben spätere
Schnitte. Keine stillschweigende Implementierung des gesamten M3-Bereichs.

## Gemeinsamer Abschlussmaßstab

Jedes Inkrement braucht einen tatsächlich benutzbaren Ablauf und einen datierten
Abschluss mit folgenden Nachweisen:

1. Abgegrenzte Eingaben, Zustände und Fehlerfälle; bestätigte Produktentscheidungen
   von technischen Umsetzungsvorschlägen unterscheiden.
2. Konsistente Domain-, Application-, Speicher-, API- und UI-Verträge. Kein
   stiller Datenverlust bei ungültiger Eingabe oder konkurrierenden Änderungen.
3. Passende Unit-, Integrations- und Frontendtests sowie ein isolierter
   Browserdurchlauf mit synthetischen Daten, einschließlich erneutem Laden.
4. Persistenzprüfung getrennt ausweisen: Speicherstore überlebt einen Hostneustart
   nicht. EF-Code, Migration und kompilierte SQL-Tests sind noch kein tatsächlich
   ausgeführter SQL- oder Wiederanlaufnachweis.
5. Schutzgrenzen, Regressionen, Bereinigung, Standard-Deaktivierung und
   tatsächlich verbleibende Einschränkungen dokumentieren.

Ein fehlender isolierter SQL-Zugang verhindert keine unabhängige
Implementierung und synthetische Prüfung. Er bleibt jedoch ein ausdrücklich
offener Nachweis vor einer Einführung mit SQL. Bestehende Datenbanken sind
kein Ersatz für eine separat autorisierte Testumgebung.

## Historischer Stand der Vorbereitung vom 07.09.2026

Diese Sitzung ergänzt ausschließlich Dokumentation. Sie implementiert noch
keinen Wiedervorlagenkern, startet keine Anwendung und verändert weder
Datenbankschema noch Konfiguration. Die 81 Unit-, 70 nicht-SQL-Integrations-
und 70 Frontendtests sowie der echte PDF-Browserlauf gehören zum vorausgehenden
Beisetzungsauswahl-Abschluss; sie belegen keine neue Wiedervorlagenfunktion.

Die Vorbereitungsprüfung umfasste 124 Markdown-Dateien, 701 lokale Links,
30 Ankerverweise, 222 Tabellen und 46 geschlossene Codeblöcke. Lokale
Quellpfade der Übergabe, Whitespace, finale LF und `git diff --check` wurden
ohne Befund geprüft; die Änderungsheuristik einschließlich neuer Dateien
enthielt keine Secretkandidaten. Beide DOCX-Hashes und die ausschließlich
verglichenen Wurzelmetadaten von `tmp/pagination-build` sind unverändert.
Es wurden keine Anwendungs-/Browserhosts oder temporären Prüfdateien angelegt.

Zum Ende der Vorbereitung steht `main` weiterhin auf
`e79561b570d56ce18c7f250c59eac7dfb9096c8e`, Upstream `origin/main`,
Ahead/Behind 1/0. Der gesamte zur Benutzerprüfung vorgesehene Arbeitsstand
umfasst 17 Dateien: vier bereits zuvor geänderte TSX-Dateien und 13
Dokumentationsdateien einschließlich der vier neuen Markdown-Dateien.
Index unverändert leer; kein Reset, Staging oder Commit. Ein anschließender
Benutzercommit ist im nächsten Chat als neuer tatsächlicher Ausgangsstand
zu behandeln.
