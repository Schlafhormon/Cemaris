# Abschluss Inkrement 5c: fachliches Abnahme- und Lebenszyklus-Entscheidungsgate

Stand: 18.08.2026

## Ergebnis

Inkrement 5c ist als ausschließlich dokumentarisches und manuelles Gate
abgeschlossen. Der technisch abgeschlossene 5b-Kern wurde mit vollständig
synthetischen Daten vorgeführt. Die Vorführung bestätigt seine wesentlichen
Verträge und liefert vier priorisierte Bedienbefunde. Sie ist keine fachliche
Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe, Betriebsfreigabe oder
Produktivfreigabe.

Es wurde keine offene Frist-, Status-, Beendigungs-, Rückgabe-, Entziehungs-,
Wiedervergabe- oder Wiedervorlagenregel implementiert. Produktcode,
Migrationen, API-Verträge und React blieben in 5c unverändert.

Als kleinster Folgeumfang ist ein gesondertes Inkrement 5d für
Bedienkorrekturen am vorhandenen 5b-Kern bestätigt. Sämtliche fachlichen
Lebenszyklusregeln bleiben außerhalb dieses Folgeumfangs.

## Verbindlicher Ausgangsstand

Der erwartete vorbereitete Stand war inzwischen vollständig als Commit
`9c728d7e0cd6a55faf4adb804831d28f36d3ac42` auf `main` und `origin/main`
übernommen. Der Commit enthält genau die angekündigte Repository-Hygiene:

- `tmp/` ist ignoriert;
- die acht versehentlich committed Laufzeitlogs sind entfernt;
- 5b-Abschluss, 5c-Übergabe und Implementierungsindex berücksichtigen die
  nachgelagerten Bedien-, Navigations- und Suchverbesserungen.

Vor Beginn waren Branch und Upstream synchron, Index und Arbeitsbaum sauber
und keine unversionierten Dateien vorhanden. Es wurde nicht auf den älteren
Erwartungshash zurückgesetzt und kein Commit erstellt.

## Technische Baseline

Die Baseline wurde am 18.08.2026 mit dem verbindlich vorgegebenen .NET-SDK
ausgeführt:

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests ohne SQL-Kategorie | 32 bestanden |
| reguläre Integrationstests ohne SQL-Kategorie | 48 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| Frontendtests | 14 bestanden in 4 Testdateien |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` vor der Vorführung | bestanden |

Die ausschließlich synthetische Datenbank
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3` war unter ihrem
exakt über `sys.databases` aufgelösten Namen vorhanden. Es gab keine weitere
Datenbank mit dem Präfix `Cemaris_IntegrationTests_`. Sie wurde nicht gelöscht
oder auf Verdacht verändert. Wegen ihrer Anwesenheit und des rein
dokumentarischen 5c-Umfangs wurde die reale SQL-Suite ausdrücklich nicht
erneut ausgeführt. Aus 5c folgt daher kein zusätzlicher SQL-Nachweis über die
bereits dokumentierte 5b-Verifikation hinaus.

## Manuelle Vorführung

API und Frontend liefen kontrolliert mit dem Synthetic-Provider und allen vier
Development-Capabilities. Health, Frontend-Proxy und Systeminfo antworteten
erfolgreich; die Systeminfo wies alle vier Capabilities als aktiv und
`productionReady=false` aus. Verwendet wurden ausschließlich die bereits
bereitgestellten synthetischen Konten für `Administration` und
`Sachbearbeitung`. Zugangsdaten wurden weder in Dateien noch in
Laufzeitprotokolle geschrieben.

Die fachlichen Demonstrationsdaten des Synthetic-Providers lagen nur im
Prozessspeicher. Die benannte manuelle Datenbank diente der lokalen
Authentifizierung; erfolgreiche Anmeldungen können dort ausschließlich den
vorgesehenen synthetischen Anmeldestatus aktualisiert haben. Nach der
Vorführung wurden beide Prozesse beendet; die Ports `5050` und `5173` waren
wieder frei.

### Beobachtungsprotokoll

| Nr. | Szenario und Rolle | Soll | Ist | Schweregrad | Reproduktion | Entscheidung |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Suche, Falldetail, Design, Dropdownnavigation und Pagination; beide Rollen | Falldetail auffindbar, einheitliches Design, gruppierte Tastaturnavigation, mehrere Suchseiten | vollständig wie vorgesehen | keiner | Suche ohne Filter, Seitengröße 5, Seitenwechsel, Grabnummer öffnen, Navigation bedienen | Regression bestätigt |
| 2 | Startregeln; Sachbearbeitung und Administration | beide Rollen lesen; nur Administration ändert versioniert | vollständig wie vorgesehen | keiner | Startregel administrativ ändern und fachlich als Sachbearbeitung verwenden | Rollen- und Versionsgrenze bestätigt |
| 3 | natürliche Person und historische Anschrift; Sachbearbeitung | typabhängige Pflichtfelder, historischer Zeitraum und optionale aktuelle Hauptanschrift | fachlich korrekt; Beteiligtenpflege ist nur innerhalb einer geöffneten Fallakte erreichbar | mittel | Fall öffnen, kanonischen Rechtebereich verwenden, Beteiligtenanlage suchen | 5b-Fachvertrag bestätigt; eigenständiger Einstieg für 5d |
| 4 | Dublettenwarnung; Sachbearbeitung | erster Versuch ohne Teilwirkung, Abbruch, bewusste bestätigte Wiederholung | vollständig wie vorgesehen | keiner | identische synthetische Namens-/Adressdaten zweimal erfassen | bestätigt |
| 5 | Organisation; Sachbearbeitung | Organisationsname statt natürlicher Namensfelder | vollständig wie vorgesehen | keiner | Art `Organisation` auswählen und synthetische Organisation anlegen | bestätigt |
| 6 | Beteiligten-Suche und Identitätswiederverwendung; beide Rollen | vorhandene fallübergreifende Identität erneut auswählen | vollständig wie vorgesehen | keiner | angelegte Identität suchen und auswählen | bestätigt |
| 7 | Rechteanlage; Sachbearbeitung | Beginn, Ende, Quelle, Inhaber und Startregel-Snapshot | vollständig wie vorgesehen | keiner | Beteiligten wählen und Recht an einer noch unbelegten kanonischen Grabstelle anlegen | bestätigt |
| 8 | unveränderter Startregel-Snapshot; Administration | spätere Regeländerung schreibt bestehendes Recht nicht um | vollständig wie vorgesehen | keiner | Regel nach Rechteanlage ändern und Recht erneut lesen | bestätigt |
| 9 | Übertragung, Verlängerung und Faktenkorrektur; Sachbearbeitung | begründete historisierte Mutationen | fachlich erfolgreich; drei nebeneinander liegende Aktionskarten verengen innere Felder stark | mittel | Recht öffnen, Aktionskarten auf üblicher Desktopbreite ausklappen; Screenshot nur in der Sitzung, nicht ins Repository übernommen | Fachoperationen bestätigt; responsives Layout für 5d |
| 10 | Inhaberzeiträume und Fachrevisionen; beide Rollen | halb offene Inhaberzeiträume und unveränderliche Revisionen | vollständig wie vorgesehen | keiner | übertragen, verlängern, korrigieren und Historien öffnen | bestätigt |
| 11 | ETag-Konflikt zweier Browserstände; beide Rollen | genau eine Mutation gewinnt; alter Stand erhält Eingaben und zeigt Konflikt | erfolgreich geprüft | keiner | denselben Rechtstand in zwei Sitzungen öffnen, zuerst Sitzung B, dann Sitzung A speichern | Nebenläufigkeitsverhalten bestätigt |
| 12 | kanonischer Kern gegenüber nullable Altprojektion; beide Rollen | keine implizite Zusammenführung | technisch getrennt; die leere Altprojektion wurde trotz sichtbarem kanonischem Recht als Aussage über alle Rechte missverstanden | mittel | kanonisches Recht anlegen und später den Abschnitt `Vorläufige Altprojektion: Nutzungsrechte / Laufzeiten` lesen | Trennung bestätigt; Wortlaut und visuelle Erklärung für 5d |
| 13 | Tastatur, Fokus, Beschriftungen, Fehler und schmale Viewports; beide Rollen | grundlegende barrierearme Bedienbarkeit | funktioniert; konkrete Feldfehler in den kompakten Rechteaktionen werden nicht direkt am Feld dargestellt | niedrig | ungültigen Transferzeitpunkt erfassen; anschließend mit gewähltem neuem Inhaber und gültigem Datum erfolgreich übertragen | Bedienfehleranzeige für 5d |

### Priorisierte Befunde

| ID | Priorität | Befund | Abgrenzung | Entscheidung |
| --- | --- | --- | --- | --- |
| 5C-F-01 | P1 | Beteiligte sind fachlich fallübergreifend, besitzen in der UI aber keinen fallunabhängigen Suche-/Pflegeeinstieg. | kein Identitäts- oder Persistenzfehler | in 5d eigenständigen Einstieg auf vorhandenen Verträgen ergänzen |
| 5C-F-02 | P1 | Die drei Rechteaktionen enthalten weitere Zwei-/Dreispaltenraster und werden im verfügbaren Inhaltsbereich zu schmal. | reiner React-/CSS-Bedienbefund | in 5d containergeeignet responsiv anordnen |
| 5C-F-03 | P2 | Die Altprojektion meldet isoliert `Keine Nutzungsrechte vorhanden`, obwohl darüber ein kanonisches Recht sichtbar sein kann. | Datenbestände bleiben absichtlich getrennt | in 5d den Geltungsbereich der Leeranzeige unmissverständlich erklären |
| 5C-F-04 | P2 | Die API liefert konkrete Feldfehler, die kompakte Rechteaktionsoberfläche zeigt jedoch primär den allgemeinen Problemtitel. | kein serverseitiger Validierungs- oder Atomaritätsfehler | in 5d Feldfehler am betroffenen Eingabefeld anzeigen |

Keiner dieser Befunde rechtfertigt eine Codeänderung innerhalb 5c. Der
Folgeauftrag für 5d ist deshalb ausdrücklich getrennt.

## Bestätigte Korrekturen am 5b-Verständnis

1. Beteiligte sind fachlich und technisch fallübergreifende Identitäten. Nur
   der bisherige React-Einstieg ist an eine geöffnete Fallakte gebunden.
2. Das Anlageformular für ein kanonisches Nutzungsrecht erscheint nur, solange
   die kanonische Grabstelle noch kein 5b-Recht besitzt. Ein sichtbares
   `Offen · Version ...` ist bereits das angelegte Recht.
3. `Offen` ist weiterhin ausschließlich die technische 5b-Aussage, dass keine
   Beendigungsoperation existiert. Datum und Enddatum erzeugen keinen Status.
4. Eine leere nullable Altprojektion sagt nichts über das Vorhandensein eines
   kanonischen Rechts aus. Beide Datenbereiche werden nicht zusammengeführt.
5. Eine Übertragung benötigt einen ausgewählten neuen Beteiligten und ein
   Wirksamkeitsdatum strikt nach dem Beginn des aktuellen Inhaberzeitraums und
   vor dem manuellen Ende. Der erfolgreich wiederholte Test ergab keinen
   fachlichen Transferdefekt.

## Entscheidungsmatrix 5C-01 bis 5C-14

`Projektverantwortung 18.08.2026` bezeichnet die ausdrückliche Bestätigung im
5c-Gate. Lokale Satzungsaussagen bleiben `SATZUNGSEVIDENZ` und ersetzen weder
Rechtsprüfung noch fachliche Verwaltungsfreigabe.

| ID | Status | Antwort und Geltungsbereich | Quelle | Erforderliche Freigabefunktion |
| --- | --- | --- | --- | --- |
| 5C-01 | OFFEN | Es ist kein allgemeiner Cemaris-Nutzungsrechtsartenkatalog bestätigt. Die sieben örtlichen Grab-/Rechtearten werden nicht in 5d übernommen. | Friedhofssatzung § 12 Abs. 2, PDF-Seite 8; E-06; Projektverantwortung 18.08.2026 | Produktverantwortung mit Friedhofsverwaltung; lokale Einrichtung zusätzlich Rechtsprüfung |
| 5C-02 | BESTÄTIGT | Im manuellen 5b-Kern ist das Enddatum ein änderbarer historisierter Fakt. Verlängerung oder begründete Faktenkorrektur dürfen es ändern; allein bewirkt es niemals Status, Ablauf oder Beendigung. | REQ-UR-003/004/006/007; ADR-0016; Projektverantwortung 18.08.2026 | für diese 5b-Grenze Produktverantwortung; jede spätere Statuswirkung neues Fach-/Rechtsgate |
| 5C-03 | OFFEN | Auslöser von Ruhe- und Nutzungszeiten sowie die rückwirkungsfreie Zuordnung einer Regelversion sind nicht allgemein bestätigt. Der lokale Beginn durch Aushändigung der Nutzungsurkunde bleibt konfigurierter Nachweis, keine Berechnung. | E-07, E-09; REQ-CFG-001 bis 005; Projektverantwortung 18.08.2026 | Friedhofsverwaltung, Produktverantwortung und Rechtsprüfung |
| 5C-04 | OFFEN | Dauer, Einheit, Rundung, inklusive/exklusive Fristgrenzen und Schaltjahre sind nicht als Produktregel bestätigt. Lokale Jahreswerte sind keine Defaults. | E-04, E-06, E-10, E-11; E-21; Projektverantwortung 18.08.2026 | Friedhofsverwaltung und Rechtsprüfung, danach Produktverantwortung |
| 5C-05 | WIDERSPRUCH | Die notwendige Deckung der verbleibenden Ruhezeit vor weiterer Beisetzung steht weiterhin neben der Gebührenaussage zur Verlängerung `nach Ablauf`. Keine Seite wird technisch bevorzugt. | Friedhofssatzung § 14 Abs. 2, PDF-Seite 9; Gebührensatzung Anlage A Nr. 3, PDF-Seite 2; E-18 | verbindliche fachlich-rechtliche Auslegung durch zuständige kommunale Funktion |
| 5C-06 | OFFEN | Zustände und Übergänge für Beendigung, Verzicht/Rückgabe, Entzug, Schließung, Entwidmung und Wiedervergabe sind nicht festgelegt. | E-02, E-12, E-13, E-17; Projektverantwortung 18.08.2026 | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung |
| 5C-07 | OFFEN | Für 5b bleiben Sachbearbeitung und Administration fachlich berechtigt, Startregeln nur Administration. Wer künftige Lebenszyklusübergänge auslösen, bestätigen, korrigieren oder zurücknehmen darf, bleibt offen. | REQ-SAFE-003; ADR-0016; Projektverantwortung 18.08.2026 | Fachverantwortung und Berechtigungsverantwortung; gegebenenfalls Funktionstrennung |
| 5C-08 | OFFEN | ETag, Atomarität, Fachrevision und sparsamer Audit bleiben allgemeine technische Mindestmechanismen. Welche Quelle und Begründung ein konkreter Lebenszyklusübergang benötigt, ist noch nicht fachlich bestätigt. | REQ-SAFE-001/002/004; ADR-0016; Projektverantwortung 18.08.2026 | Fachverantwortung und Produktverantwortung; Audit-/Datenschutzprüfung |
| 5C-09 | OFFEN | Lokal verhindert Schließung neue oder erneut verliehene Rechte; Entwidmung setzt abgelaufene Rechte und Ruhezeiten voraus. Wirkungen der Cemaris-Friedhofs- und Grabstellenstatus auf einzelne Rechte bleiben unmodelliert. | Friedhofssatzung § 3, PDF-Seite 4; E-02; Projektverantwortung 18.08.2026 | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung |
| 5C-10 | OFFEN | Altfälle werden nicht automatisch rückinterpretiert oder migriert. Ob ein manueller Bestandsschutz-/Satzungsstand-Snapshot nötig ist, bleibt ein eigenes Gate. | Friedhofssatzung § 26, PDF-Seite 14; E-14; REQ-UR-004; Projektverantwortung 18.08.2026 | Friedhofsverwaltung, Rechtsprüfung, Migration und Produktverantwortung |
| 5C-11 | OFFEN | Es ist keine allgemeine Wiedervorlagenart mit Entstehung, Erledigung, Verschiebung oder Aufhebung bestätigt. | E-07, E-12, E-13; Requirements-Index Abschnitt 15; Projektverantwortung 18.08.2026 | Friedhofsverwaltung und Produktverantwortung |
| 5C-12 | OFFEN | Der lokale Drei-Monats-Hinweis ist nur Satzungsevidenz. Manuelle/automatische Erzeugung, Rollen, Fristen, Eskalationen und Kanäle bleiben offen. | Friedhofssatzung § 12 Abs. 4 Buchst. b, PDF-Seite 8; E-07; Projektverantwortung 18.08.2026 | Friedhofsverwaltung, Rechtsprüfung, Datenschutz und Betrieb |
| 5C-13 | OFFEN | Aufbewahrung, Löschung, Sperrung und Anonymisierung von Beteiligten, Fachrevisionen und Audit besitzen keine freigegebene Automatik. | REQ-SAFE-005; Requirements-Index Abschnitte 21 bis 23; Projektverantwortung 18.08.2026 | Datenschutzverantwortung, Fachverantwortung, Rechtsprüfung und Betrieb |
| 5C-14 | BESTÄTIGT | Kommunale Rechtearten, Dauern, Startbezüge, Erinnerungszeitpunkte und Satzungsstände sind lokale Konfiguration. Historisierung, Atomarität, ETag, Audit und rückwirkungsfreie Snapshots sind allgemeine technische Produktmechanismen. | E-20 bis E-22; REQ-CFG-001 bis 005; REQ-SAFE-001 bis 004; ADR-0016; Projektverantwortung 18.08.2026 | Produktverantwortung für allgemeine Mechanismen; kommunale Fach-/Rechtsfreigabe für lokale Werte |

## Architekturvarianten für den kleinsten Folgeumfang

| Variante | Historisierung und Atomarität | ETag und Audit | Migration und Altkompatibilität | Bewertung |
| --- | --- | --- | --- | --- |
| A – reine Bedienkorrektur auf vorhandenen 5b-Verträgen | vorhandene Party-/Rechteaggregate und Revisionen unverändert verwenden; keine neue Fachmutation | vorhandene starke ETags und sparsamer Audit unverändert | keine Migration; nullable Altprojektionen bleiben getrennt und lesbar | **ausgewählt für 5d**; kleinster risikoarmer Umfang |
| B – neues Beteiligtenmodul mit erweiterten Such-/Listenverträgen | bestehende Aggregate nutzbar, aber neue Pagination, Filter und gegebenenfalls weitere Mutationen müssten vollständig atomar und historisiert spezifiziert werden | neue Verträge und Konfliktpfade wären zu ergänzen | voraussichtlich keine Datenmigration, aber API-/OpenAPI-Erweiterung und umfassendere Altanzeige | für 5d zu groß; erst bei belegtem Bedarf |
| C – erster Lebenszyklus-/Fristdurchstich | benötigt eigenes versioniertes Regelaggregat, fallbezogene Snapshots und atomare Ereignis-/Statusrevisionen | ETag, Audit und Rollen je Übergang neu zu bestätigen | additive Migration und explizite Altfallstrategie zwingend; bestehender Unique-Index müsste fachlich begründet ersetzt werden | verworfen, solange 5C-01 und 5C-03 bis 5C-13 offen beziehungsweise widersprüchlich sind |

Variante A erweitert ausschließlich Auffindbarkeit, Darstellung und
Fehlerrückmeldung. Sie ändert weder Rechteidentität noch fachliche Regeln. Die
ausführbare Abgrenzung steht in der
[5d-Folgeübergabe](cemaris-increment-5d-next-step-handoff.md).

## Nicht-Ziele und offene Freigabegates

- keine Frist-, Dauer-, Satzungsstands- oder Statusberechnung;
- keine Beendigung, Rückgabe, Entziehung, Schließung oder Wiedervergabe;
- keine Wiedervorlage, Erinnerung, Eskalation oder externe Benachrichtigung;
- keine Rechtearten-, Gebühren-, Dokument- oder DMS-Erweiterung;
- keine Altfallübernahme, kein Backfill und keine erfundene Historie;
- keine neue Personenrolle und kein Party-Merge;
- keine Löschung, Sperrung, Anonymisierung oder Aufbewahrungsautomatik;
- keine Verarbeitung echter Verwaltungsdaten;
- keine fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutz-, Betriebs-
  oder Produktivfreigabe.

## Arbeitsraum- und Datenbankgrenze

Es wurde ausschließlich im Cemaris-Repository gearbeitet. Die lokale
Satzungsquelle wurde nur gelesen; temporär gerenderte Seiten lagen unter dem
ignorierten Repositorypfad `tmp/pdfs` und wurden nach Sichtprüfung entfernt.
Keine EDWALT-Originale, externen Phase-Arbeitsbereiche oder Phase-5-Wurzel
wurden geöffnet, angelegt oder verändert.

Außer der ausdrücklich freigegebenen synthetischen manuellen Datenbank wurde
keine Benutzer- oder Produktdatenbank verwendet oder verändert. Es wurde
keine Datenbank gelöscht, angelegt oder migriert. Die fachlichen
Vorführungsdaten des Synthetic-Providers gingen mit dem beendeten API-Prozess
verloren.

## Abschlussprüfungen

Die Abschlussprüfung am 18.08.2026 ergab:

- alle neun in 5c geänderten oder neu angelegten Markdown-Dateien wurden auf
  auflösbare relative Links und Anker geprüft; es blieben null Befunde;
- sämtliche Markdown-Tabellen dieser Dateien besitzen konsistente
  Spaltenzahlen; es blieben null Befunde;
- die Whitespace-Prüfung der Dokumente sowie `git diff --check` waren
  erfolgreich;
- die Prüfung ausschließlich der 5c-Ergänzungen auf sensible Muster ergab
  null Befunde, ohne Prüfwerte auszugeben;
- außerhalb von Markdown wurden weder versionierte noch unversionierte
  Änderungen erzeugt; Produktcode, Migrationen, API-Verträge und React
  blieben unverändert;
- API und Frontend wurden kontrolliert beendet; die Ports `5050` und `5173`
  waren danach frei;
- unter dem erlaubten Präfix war weiterhin ausschließlich die aufgelöste
  manuelle Datenbank
  `Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3` vorhanden;
  weder die reale SQL-Suite noch eine Anlage, Löschung oder Migration wurde
  ausgeführt;
- die beiden gelesenen Satzungs-PDFs waren nach der Prüfung hinsichtlich
  Dateilänge und Änderungszeitpunkt unverändert; die temporären Renderings
  wurden entfernt;
- der bereits vor 5c vorhandene ignorierte Bestand unter
  `tmp/pagination-build` mit 890 Dateien wurde nicht verändert oder entfernt;
- es wurden keine externen Arbeitsbereiche und keine fremden Datenbanken
  verändert sowie weder Dateien gestaged noch ein Commit erzeugt.

Diese Prüfungen belegen den technischen und dokumentarischen Abschluss des
Entscheidungsgates. Sie sind ausdrücklich keine fachliche Verwaltungsabnahme,
Rechtsprüfung, Datenschutzfreigabe, Betriebsfreigabe oder Produktivfreigabe.
