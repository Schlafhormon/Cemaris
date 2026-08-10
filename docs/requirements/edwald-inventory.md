# EDWALT-Bestandsaufnahme

> **Arbeitscheckliste für Interviews, Beobachtungen und technische Analyse.** Keine Tabellenzeile gilt ohne Quelle und fachliche Bestätigung als Cemaris-Anforderung.

## Stand der technischen Quellenanalyse

Die ausschließlich lesende Bestandsaufnahme der lokal bereitgestellten
EDWALT/EDWALT3-Quellen liegt unter
[`edwalt-analysis/`](edwalt-analysis/README.md) vor. Sie umfasst ein Manifest
aller 597 Dateien, beide HTML-Hilfen und alle 123 Hilfebilder, Funktions- und
Komponentenkataloge, 24 DAT/IDX-Paare, Vorlagen/Makros/Reports, eine
Evidenzmatrix und einen priorisierten Interviewleitfaden.

Die Produktbezeichnung ist **EDWALT**; **EDWALT3** bezeichnet dasselbe Produkt
beziehungsweise die untersuchte Version. Die frühere Cemaris-Schreibweise ohne
abschließendes `T` war falsch (`INT-001`, Status `BESTÄTIGT`, Konfidenz hoch).
Der historische Dateiname `edwald-inventory.md` bleibt lediglich zur
Linkkompatibilität unverändert.

Die folgenden Checklisten bleiben für Interviews und Beobachtungen gültig.
Die technische Analyse bestätigt keine Ist-Nutzung und keine Cemaris-
Anforderung. Konkrete, evidenzbezogene Fragen stehen im
[Interviewleitfaden](edwalt-analysis/open-questions-and-interview-guide.md).

## Vorbereitung eines Termins

- Datum, Ort/Medium und Ziel des Termins festhalten.
- Beteiligte nach Funktion statt unnötig mit personenbezogenen Details dokumentieren.
- Verwendete EDWALT-Version und Umgebung notieren.
- Vorab klären, ob Screenshots erlaubt und wie sie anonymisiert gespeichert werden.
- Keine echten Daten in das Git-Repository übernehmen.
- Normalfälle und mindestens einen bekannten Sonder-/Fehlerfall zeigen lassen.
- Parallel verwendete Excel-, Word-, Papier-, E-Mail- und Laufwerkslösungen aktiv erfragen.

| Feld | Eintrag |
| --- | --- |
| Termin / Interview-ID | OFFEN |
| Datum | OFFEN |
| Beteiligte Funktionen | OFFEN |
| Beobachtete Umgebung / Version | OFFEN |
| Untersuchter Prozess | OFFEN |
| Quellen / Artefakte | OFFEN |
| Einschränkungen der Beobachtung | OFFEN |
| Freigabe der Notizen durch | OFFEN |

## Funktions- und Maskeninventar

Für jede Maske oder Funktion eine eigene Zeile beziehungsweise bei komplexen Funktionen ein Detailblatt anlegen.

| ID | Maske / Funktion | Zweck | Wird genutzt? | Nutzergruppe | Eingabedaten | Ausgabedaten | Erzeugte Dokumente | Abhängigkeiten | Probleme | Verbesserungsideen | Muss/Soll/Kann | Screenshots vorhanden? | Migrationsrelevante Daten? | Quelle / bestätigt durch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | OFFEN | OFFEN | unbekannt | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | offen | nein | unbekannt | OFFEN |

### Detailblatt je Funktion

| Frage | Ergebnis |
| --- | --- |
| Wie wird die Funktion geöffnet? | OFFEN |
| Welcher fachliche Auslöser besteht? | OFFEN |
| Welche Felder sind sichtbar, pflegbar oder automatisch? | OFFEN |
| Welche Validierungen und Fehlermeldungen treten auf? | OFFEN |
| Welche Vorbelegungen, Schlüssel oder Berechnungen erfolgen? | OFFEN |
| Welche Folgefunktionen oder Ausdrucke werden ausgelöst? | OFFEN |
| Wie werden Korrektur, Storno und Historie behandelt? | OFFEN |
| Welche Berechtigungen wirken? | OFFEN |
| Welche typischen und maximalen Fallzahlen bestehen? | OFFEN |
| Welche Schritte erfolgen außerhalb von EDWALT? | OFFEN |
| Welche Regel ist belegt, welche nur vermutet? | OFFEN |

## Prozessinventar

| Prozess-ID | Bezeichnung | Auslöser | Beteiligte Funktionen | Schritte / Entscheidungen | Verwendete Systeme und Medien | Ergebnis | Häufigkeit | Varianten / Sonderfälle | Rechts-/Satzungsgrundlage | Probleme | Quelle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN |

## Stammdaten

Zu erfassen sind auch lokale Schlüssel, Werte, die nur historisch vorkommen, und Listen außerhalb von EDWALT.

| ID | Bezeichnung | Zweck | Beispiel anonymisiert | Geltungsbereich | Pflege durch | Änderungshäufigkeit | Historisiert? | Quelle / führendes System | Migrationsrelevant? | Offene Fragen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-001 | OFFEN | OFFEN | SYNTHETISCH | OFFEN | OFFEN | OFFEN | unbekannt | OFFEN | unbekannt | OFFEN |

Checkliste:

- [ ] Kataloge und Lookup-Werte
- [ ] Friedhofs- und Organisationsstrukturen
- [ ] Nummernkreise und Identifikatoren
- [ ] Status- und Löschwerte
- [ ] Textbausteine
- [ ] Vorlagenzuordnungen
- [ ] zeitabhängige oder satzungsabhängige Werte
- [ ] Benutzer-/Organisationsbezüge

## Reports, Tabellen und Listen

| ID | Name | Zweck / Empfänger | Auslöser / Turnus | Filter / Sortierung | Spalten / Kennzahlen | Format | Datenquelle | Nachbearbeitung außerhalb EDWALT | Wird genutzt? | Aufbewahrung | Beispiel vorhanden? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | unbekannt | OFFEN | nein |

- [ ] Standardreports
- [ ] frei konfigurierbare Listen
- [ ] Stichtagsauswertungen
- [ ] Statistiken und Kennzahlen
- [ ] Exporte für andere Ämter/Systeme
- [ ] manuell in Excel weiterverarbeitete Listen
- [ ] nicht mehr genutzte historische Reports

## Ausdrucke, Bescheide und Schreiben

| ID | Dokumentart | Fachlicher Auslöser | Vorlage / Speicherort | Briefkopf | Platzhalter | Freigabe | Ausgabeformat | Versandweg | Ablage / DMS | Rechtsgrundlage | Versionierung | Anonymisiertes Muster vorhanden? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | unbekannt | nein |

- [ ] DOCX-/Word-Vorlagen
- [ ] PDF-Formulare
- [ ] Briefpapier und kommunale Layoutvorgaben
- [ ] Textbausteine und Rechtsbehelfsbelehrungen – nur inventarisieren, nicht neu formulieren
- [ ] Anlagen
- [ ] Entwurf, Freigabe, Versand und Storno
- [ ] Zuordnung zu Akte und Vorgang

## Schnittstellen

| ID | System | Fachlicher Zweck | Richtung | Protokoll / Format | Auslöser / Turnus | Authentifizierung | Führendes System | Fehlerbehandlung | Testsystem | Ansprechpartner | Dokumentation vorhanden? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I-001 | OFFEN | OFFEN | OFFEN | unbekannt | OFFEN | unbekannt | OFFEN | OFFEN | unbekannt | OFFEN | nein |

- [ ] Winyard / DMS
- [ ] Finanzverfahren
- [ ] Melderegister oder Personendatenquellen
- [ ] GIS / Karten
- [ ] E-Mail und Druck
- [ ] Authentifizierung / Verzeichnisdienst
- [ ] Statistik- oder Landesmeldungen
- [ ] Dateiablagen und Fachverfahren weiterer Stellen

## Exporte und Importe

| ID | Bezeichnung | Import / Export | Format / Kodierung | Inhalt | Empfänger / Quelle | Häufigkeit | Manuelle Schritte | Validierung | Fehler / Dubletten | Migrationsnutzen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X-001 | OFFEN | OFFEN | unbekannt | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | unbekannt |

- [ ] CSV, Excel, XML, Text und proprietäre Formate
- [ ] Dateinamen- und Ordnerkonventionen
- [ ] Zeichensätze, Datums- und Zahlenformate
- [ ] Voll- oder Deltaexporte
- [ ] Rückmeldungen und Fehlerdateien
- [ ] manuell korrigierte Importdateien

## Hintergrundjobs

| ID | Job / Dienst | Zweck | Zeitplan / Auslöser | Eingaben | Ergebnisse | Abhängigkeiten | Überwachung | Fehlerbehandlung | Verantwortlich |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| J-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN |

- [ ] automatische Frist- oder Wiedervorlagebildung
- [ ] Reportläufe
- [ ] Schnittstellenübertragungen
- [ ] Dateiimporte/-exporte
- [ ] Bereinigung oder Archivierung
- [ ] Datensicherung – fachlich von IT-Backup unterscheiden

## Benutzerverwaltung und Rechte

| ID | Konto / Rollenkonzept | Anlage / Änderung | Authentifizierung | Berechtigungsumfang | Vertretung | Prüfung / Rezertifizierung | Deaktivierung | Audit | Offene Risiken |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B-001 | OFFEN | OFFEN | unbekannt | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN |

- [ ] lokale Konten oder Verzeichnisdienst
- [ ] Rollen, Gruppen und Einzelrechte
- [ ] administrative Sonderrechte
- [ ] Funktionstrennung und Vier-Augen-Prinzip
- [ ] Zugriffsbegrenzung je Friedhof/Organisation/Fall
- [ ] Passwort-, Sperr- und Sitzungsregeln
- [ ] ausgeschiedene und ruhende Nutzer

## Suche

| ID | Suchanlass | Suchende Funktion | Suchfelder | Kombination / Unschärfe | Ergebnisdarstellung | Berechtigungsfilter | Häufigkeit | Probleme |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q-001 | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN | OFFEN |

- [ ] Schnellsuche
- [ ] erweiterte Suche
- [ ] Suche über historische Werte
- [ ] phonetische oder unscharfe Suche
- [ ] Suche in Dokumenten/DMS
- [ ] gespeicherte Suchabfragen
- [ ] Export von Trefferlisten

## Sonderfälle und Fehlerbilder

| ID | Situation | Häufigkeit | Heutiges Vorgehen | Ursache bekannt? | Datenfolgen | Workaround | Gewünschtes Verhalten | Fachliche Klärung nötig? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-001 | OFFEN | OFFEN | OFFEN | unbekannt | OFFEN | OFFEN | OFFEN | ja |

Gezielt erfragen:

- Korrekturen nach Abschluss,
- Storno und Rückabwicklung,
- widersprüchliche oder unvollständige Daten,
- historische Fälle mit anderen Regeln,
- Mehrfachzuordnungen und Dubletten,
- Ausfall von Schnittstellen oder Druck,
- Vertretung und organisatorische Wechsel,
- Fälle, die heute ausschließlich außerhalb EDWALT geführt werden.

## Migrationsrelevante Datenbestände

| ID | Bestand | Speicherort / Technik | Eigentümer | Datenvolumen | Zeitraum | Qualität | Beziehungen / Schlüssel | Dokumentbezug | Pflicht zur Übernahme | Exportmöglichkeit | Offene Risiken |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M-001 | OFFEN | unbekannt | OFFEN | unbekannt | OFFEN | unbekannt | OFFEN | OFFEN | ungeklärt | unbekannt | OFFEN |

- [ ] EDWALT-Datenbestände, Satztypen und Beziehungen
- [ ] Dokument- und Bildpfade
- [ ] Binärdaten
- [ ] Excel-/Access-/CSV-Nebenbestände
- [ ] Word-Vorlagen und Serienbriefe
- [ ] Papierarchive und nicht digitalisierte Informationen
- [ ] Benutzer, Rechte und Historien
- [ ] Lookup-Werte und lokale Anpassungen

## Tagesabschluss eines Interviews

- [ ] Beobachtungen von Interpretationen getrennt.
- [ ] Offene Fragen mit Verantwortlichkeit notiert.
- [ ] Widersprüche markiert, nicht still aufgelöst.
- [ ] Screenshots und Dateien anonymisiert und außerhalb des öffentlichen Repositorys abgelegt.
- [ ] Migrationsrelevanz bewertet oder als unbekannt markiert.
- [ ] Muss/Soll/Kann als Aussage der Beteiligten, nicht als endgültige Projektpriorität erfasst.
- [ ] Nächster Validierungstermin festgelegt.
