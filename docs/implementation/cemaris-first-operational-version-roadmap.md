# Arbeitsplan zur ersten alltagstauglichen Cemaris-Version

Stand: 07.09.2026

Status: **Entwicklungsrichtung vorbereitet; keine Fertigstellungs- oder
Produktivfreigabe.** Die Projektverantwortung möchte Cemaris zu einer
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
| M1: offene Arbeit | noch kein kanonischer Wiedervorlagenvertrag | manueller Fallbezug, gemeinsamer Arbeitsvorrat, Termin und nachvollziehbare Bearbeitung als nächster begrenzter Kandidat | Wiedervorlage anlegen, wiederfinden, verschieben, erledigen, abbrechen und erneut öffnen; keine Wirkung auf fachliche Fristen oder Grabstatus |
| M2: Nutzungsrechte und Fristen | manueller historisierter Nutzungsrechtskern vorhanden | Ruhezeit und Nutzungszeit getrennt; Rückgabe, Beendigung, Wiedervergabe und Berechnungsregeln noch nicht vollständig entschieden | fachlich bestätigte Beispiele einschließlich Grenz- und Korrekturfällen stimmen; Historie bleibt rekonstruierbar |
| M3: Gebühren und Bescheide | manuelle Entwürfe und genau eine flüchtige DOCX-/PDF-Ausgabe vorhanden | benötigte Positionen, Gültigkeitsstände, Berechnung, wirksame Bescheid- und Korrekturabläufe | bestätigte Sollbeträge, Regelstände und Dokumente stimmen; keine unzulässige rückwirkende Änderung |
| M4: Einführung und Betrieb | SQL-Provider, Identität, Sicherheitsgrundlagen und datierte technische Nachweise vorhanden | aktuelle isolierte SQL-Nachweise, gemeinsame Arbeitsabnahme, Installation, Zuständigkeiten und konkreter Einführungsumfang | vereinbarte Arbeitsabläufe auf einer benannten Installation mit mehreren Sitzungen, Neustart und Wiederherstellung nachgewiesen |
| M5: Datenübernahme und benötigte Schnittstellen | begrenzter Friedhofsstammdatenpfad und Integrationsgrenzen dokumentiert | weitere Mappings, Vollständigkeit, Fehlerbehandlung, Einführung und Rückfall separat vorbereiten | nachvollziehbarer Quell-/Zielvergleich und kontrollierte Übernahme ohne Verlust geschützter Bestände |

M2 und M3 benötigen konkrete fachliche Beispiele und Antworten; ihre Reihenfolge
kann anhand des tatsächlichen täglichen Bedarfs angepasst werden. SQL- und
Integritätsarbeit begleitet die Inkremente von Anfang an. M4 bezeichnet die
zusammenhängende Einführungsabnahme, nicht einen erst am Schluss beginnenden
Persistenz- oder Sicherheitstest.

## Nächster ausführbarer Auftrag

Die [Übergabe für manuelle fallbezogene Wiedervorlagen](cemaris-manual-case-follow-ups-next-step-handoff.md)
begrenzt M1, enthält die bereits bestätigten Produktentscheidungen und beschreibt
Arbeitsdateien, technische Verträge, Browserprüfung und Abschluss. Der neue
Chat soll diese Übergabe zuerst vollständig lesen. Er soll weder die gesamte
Roadmap in einem Zug implementieren noch bereits erledigte 6c-Gates wiederholen.

Der kleine bekannte Einleitungstextbefund im Bescheidpanel kann als ausdrücklich
benannte Begleitkorrektur erledigt werden. Er ist kein Ersatz für den Ausbau
der täglichen Arbeitsabläufe.

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

## Stand dieser Vorbereitung

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
