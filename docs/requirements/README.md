# Arbeitsgrundlage für Bestands- und Bedarfsanalyse

> **Gesamtstatus: GEMISCHT.** Dieses Dokument enthält bestätigte
> Produktentscheidungen für klar begrenzte synthetische Inkremente sowie
> weiterhin offene Erhebungsfelder. Eine fachliche Abnahme durch die
> Friedhofsverwaltung und eine Produktivfreigabe liegen noch nicht vor.

## Arbeitsweise

Erkenntnisse werden auf eine nachvollziehbare Quelle zurückgeführt: Interview mit Datum und Funktion, beobachteter Prozess, anonymisierter Screenshot, Verfahrensbeschreibung, Satzung/Fundstelle oder technischer Export. Aussagen einzelner Personen werden nicht automatisch verallgemeinert.

Empfohlene Statuswerte:

| Status | Bedeutung |
| --- | --- |
| `OFFEN` | Frage ist noch unbeantwortet |
| `ANNAHME` | vorläufige Hypothese, nicht implementierbar |
| `BESTÄTIGT` | durch benannte Quelle und fachliche Freigabe belegt |
| `WIDERSPRUCH` | Quellen oder Beteiligte widersprechen sich |
| `VERWORFEN` | geprüft und nachweisbar nicht benötigt |

Jede spätere Anforderung sollte eine ID, Beschreibung, Quelle, Geltungsbereich, Priorität, Akzeptanzkriterien, Datenschutz-/Berechtigungsfolgen und offene Punkte erhalten.

Die ersten Umsetzungsentscheidungen fuer die lesende Suche und Detailansicht
stehen in [MVP-Entscheidungen: Lesende Suche und Detailansicht](mvp-read-search-decisions.md).
Der zweite technische Produktinkrement ist in
[Implementierungsentscheidungen: schreibende Fallakten-Grundlage](case-record-write-decisions.md)
begrenzt. Diese technische Schreibfreigabe für Development ersetzt keine
offene Fach-, Datenschutz-, Berechtigungs- oder Produktiventscheidung.
Die am 13.08.2026 bestätigten Teilvorgaben und weiterhin offenen Gates für
Identität, Rollen, Änderungsnachweis und On-Premises-Betrieb stehen in den
[Produktvorgaben zu Identität, Rollen, Änderungsnachweis und Betrieb](identity-authorization-audit-decisions.md).
Die für den nächsten synthetischen Produktinkrement bestätigte
Friedhofsstruktur und ihre Grenzen stehen in den
[Produktentscheidungen zu Friedhofsstruktur und Grabstättenstammdaten](cemetery-master-data-decisions.md).
Der einfache technische Beisetzungsprozess für Inkrement 4b ist in den
[Produktentscheidungen zum Beisetzungsprozess](burial-process-decisions.md)
verbindlich abgegrenzt.

| ID | Status | Anforderung | Quelle | Geltungsbereich | Muss/Soll/Kann | Offene Punkte |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-DMS-001 | BESTÄTIGT | Vorhandene Winyard-Akte beziehungsweise passendes Ablageziel suchen | INT-019/021/023 | optionale Winyard-Integration | Muss bei Aktivierung | automatische fachliche Zuordnung bestätigt; technische Suchregel offen |
| REQ-DMS-002 | BESTÄTIGT | Eine unter der passenden Vorgangsart fehlende Jahresablage automatisch in Winyard anlegen | INT-019/021/022 | optionale Winyard-Integration | Muss bei Aktivierung | technische Objektart, Benennung, Pflichtmetadaten und Konfliktverhalten offen |
| REQ-DMS-003 | BESTÄTIGT | Aktenzeichen, Dokumentart, Datum und weitere festzulegende Metadaten übertragen | INT-019 | optionale Winyard-Integration | Muss bei Aktivierung | vollständiger Metadatensatz offen |
| REQ-DMS-004 | BESTÄTIGT | Erfolg oder Fehler einer Ablage anzeigen | INT-019 | optionale Winyard-Integration | Muss bei Aktivierung | Fehlerklassen und Anzeigeform offen |
| REQ-DMS-005 | BESTÄTIGT | Fertige Bescheide und Schreiben automatisch ablegen | INT-019 | optionale Winyard-Integration | Soll bei Aktivierung | Auslöser und Freigabestatus offen |
| REQ-DMS-006 | BESTÄTIGT | Fehlgeschlagene Ablagen später wiederholen | INT-019 | optionale Winyard-Integration | Soll bei Aktivierung | Wiederholungs-, Dubletten- und Eskalationsregeln offen |
| REQ-DMS-007 | VERWORFEN | Winyard-Dokument-ID dauerhaft in Cemaris speichern | INT-019 | Winyard-Integration | nicht nötig | technische Korrelation ohne dauerhafte Fachanforderung klären |
| REQ-DMS-008 | VERWORFEN | Abgelegte Winyard-Dokumente aus Cemaris öffnen | INT-019 | Winyard-Integration | nicht nötig | kein aktueller Bedarf |
| REQ-DMS-009 | BESTÄTIGT | Winyard-Ablage nach Vorgangsart und Jahr konfigurierbar abbilden | INT-020/021, IMG-INT-001/002 | optionale Winyard-Integration | Soll bei Aktivierung | konkrete Vorgangsarten, Jahreswechsel, Zuständigkeit und Validierung offen |
| REQ-DMS-010 | BESTÄTIGT | Cemaris ohne Winyard produktiv betreiben und die Integration später aktivieren können | INT-020 | Gesamtsystem/Winyard | Muss | Einführungszeitpunkt und Aktivierungsverfahren offen |
| REQ-DMS-011 | BESTÄTIGT | Vorgangsart und Ablagejahr automatisch aus Fall- und Dokumentkontext bestimmen | INT-023 | optionale Winyard-Integration | Muss bei Aktivierung | vollständige Regel je Dokumentart und zulässige Korrekturen offen |
| REQ-MIG-001 | BESTÄTIGT | Nur strukturierte EDWALT-Daten migrieren; vorhandene Akten, Bescheide und Schreiben nicht nach Cemaris übernehmen oder verschieben | INT-024 | EDWALT-Datenmigration | Muss | fortdauernder Zugriff, Aufbewahrung und Verantwortlichkeit der Altbestände offen |
| REQ-MIG-002 | BESTÄTIGT | EDWALT während der Cemaris-Einführung vorübergehend als lesende Rückfallebene verfügbar halten | INT-025/026 | Migration und Cutover | Muss bis zur stabilen Abnahme | technische Nur-Lese-Garantie, Laufzeitumgebung und konkrete Cemaris-Abnahmekriterien offen; kein langfristiger Archivbetrieb |
| REQ-MIG-003 | BESTÄTIGT | Strukturierte historische Krematoriumsdaten trotz heutiger Nichtnutzung migrieren | INT-008/027 | EDWALT-Datenmigration | Muss | Satzlayout, Feldsemantik, Schlüssel, Beziehungen und Datenschutzprüfung offen; keine Funktionsanforderung an ein Cemaris-Krematoriumsmodul |
| REQ-MIG-004 | BESTÄTIGT | Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge nicht nach Cemaris migrieren | INT-028 | EDWALT-Datenmigration | Muss | sichere technische Erkennung, gültige Nachfolger, frühere Kennungen und Ausschlussnachweis offen; Quelldaten bleiben unverändert |
| REQ-MIG-005 | BESTÄTIGT | Bei Umnummerierungen nur den gültigen Datensatz mit aktueller Nummer migrieren; frühere Nummern nicht als Suchalias oder Historienkennung übernehmen | INT-028/029 | EDWALT-Datenmigration | Muss | technische Nachfolgerermittlung und Ausschlussvalidierung offen |
| REQ-MIG-006 | BESTÄTIGT | Aus EDWALT Bescheidnummer, Gebührenpositionen, festgesetzten Betrag, Fälligkeit und Fallbezug migrieren; Zahlungsstatus und Mahnungen nicht aus EDWALT migrieren | INT-014 bis INT-016/030 | EDWALT-Datenmigration und FINANZ+ | Muss | Quellfelder, Schlüssel zum Fall und technische Vollständigkeit offen; FINANZ+ bleibt für Zahlungsstatus und Mahnungen führend |
| REQ-MVP-001 | BESTÄTIGT | Als ersten nutzbaren Cemaris-Abschnitt eine lesende Suche und Anzeige von Friedhofs-, Grab-, Personen- und Falldaten bereitstellen | INT-031 | erster Entwicklungsabschnitt | Muss | technisch mit synthetischen Daten umgesetzt; fachliche Abnahme bleibt offen |
| REQ-MVP-002 | BESTÄTIGT | Eine gemeinsame Suche mit optionalen Filtern für Name/Vorname, Geburts-/Sterbedatum, Friedhof/Feld/Grabnummer, Beisetzungsdatum, Nutzungsberechtigte/Anschriften und Bescheidnummer bereitstellen | INT-032 | erster Entwicklungsabschnitt | Muss | MVP-Semantik und Sortierung in `mvp-read-search-decisions.md` dokumentiert; spätere Erweiterungen bleiben offen |
| REQ-MVP-003 | BESTÄTIGT | In der lesenden Detailansicht zusammengehörige Friedhofs-/Grabdaten, Verstorbene, Beisetzungen, Nutzungsrechte/Laufzeiten, Berechtigte/Adressen sowie Bescheid-/Gebühreninformationen anzeigen; keinen Zahlungsstatus und keine Mahnungen anzeigen | INT-016/030/033 | erster Entwicklungsabschnitt | Muss | konservative technische Feldliste dokumentiert; fachliche Feldprüfung bleibt offen |
| REQ-BER-001 | BESTÄTIGT | Der IT-Administrator darf sämtliche fachlichen Personen- und Falldaten sehen | INT-012/034 | Berechtigung | Muss | Protokollierung administrativer Zugriffe und spätere feinere Rollentrennung offen |
| REQ-MVP-004 | BESTÄTIGT | Den ersten Abschnitt anhand eines kontrolliert migrierten Testbestands fachlich abnehmen: bekannten Fall finden und alle zugehörigen Verknüpfungen lesend nachvollziehen; im Repository und in allgemeinen Entwicklungstests ausschließlich synthetische Daten verwenden | INT-035 | erster Entwicklungsabschnitt und Migrationstest | Muss | Auswahl, Schutz und Bereitstellung des lokalen Testbestands sowie messbare Vollständigkeitsprüfung noch festzulegen |
| REQ-CASE-001 | BESTÄTIGT | Eine synthetische Fallakte mit serverseitiger ID und Grabstellenbezug anlegen | Projektentscheidung 12.08.2026, ADR-0009 | zweiter Development-Inkrement | Muss | Friedhof ist nur technische Mindestangabe, keine endgültige fachliche Pflichtfeldregel |
| REQ-CASE-002 | BESTÄTIGT | Friedhof, Feld und Grabnummer als manuell erfasste Bezeichnungen ändern | ADR-0009, `case-record-write-decisions.md` | zweiter Development-Inkrement | Muss | keine Struktur-, Belegungs- oder Statusregel |
| REQ-CASE-003 | BESTÄTIGT | Verstorbene Personen mit den bereits lesbaren Namens- und Datumsfeldern hinzufügen und ändern | REQ-MVP-003, ADR-0009 | zweiter Development-Inkrement | Muss | keine weiteren Attribute oder Rollen erfinden |
| REQ-CASE-004 | BESTÄTIGT | Beisetzungen mit Datum und optionalem Verstorbenenbezug derselben Fallakte hinzufügen und ändern | REQ-MVP-003, ADR-0009 | zweiter Development-Inkrement | Muss | keine Art-, Planungs-, Status- oder Fristlogik |
| REQ-CASE-005 | BESTÄTIGT | Änderungen unmittelbar über vorhandene Suche und Detailansicht lesen | ADR-0009 | zweiter Development-Inkrement | Muss | kein separater manueller Projektionslauf |
| REQ-CASE-006 | BESTÄTIGT | Konkurrierende Änderungen über eine monotone Fallversion erkennen und veraltete Schreibversuche ohne Teilwirkung ablehnen | technische Integritätsentscheidung 12.08.2026 | zweiter Development-Inkrement | Muss | HTTP-Vertrag über ETag/If-Match |
| REQ-CASE-007 | BESTÄTIGT | Schreibpfad standardmäßig deaktivieren und nur explizit in Development für synthetische Daten zulassen | ADR-0009 | zweiter Development-Inkrement | Muss | kein Ersatz für produktive Authentifizierung, Autorisierung und Auditierung |
| REQ-CEM-001 bis 009 | BESTÄTIGT FÜR 4a | Allgemein konfigurierbare Hierarchie `Friedhof → Bereich → Feld → Reihe → Grabstelle`, stabile IDs, kontextbezogene Eindeutigkeit, Umbenennung, Aktivierung und geschütztes Löschen | USR-2026-08-13-INCREMENT-4A | synthetischer Stammdateninkrement 4a | Muss | fachliche Abnahme durch Friedhofsverwaltung folgt nach vorstellbarem Produktstand |
| REQ-GTYPE-001 bis 004 | BESTÄTIGT FÜR 4a | Leerer, durch beide Rollen pflegbarer Grabartenkatalog mit friedhofsbezogener Gültigkeit | USR-2026-08-13-INCREMENT-4A, Satzung-DK-2023 | synthetischer Stammdateninkrement 4a | Muss | keine kommunalen Werte oder Fristen fest einbauen |
| REQ-GRAVE-001 bis 005 | BESTÄTIGT FÜR 4a | Grabnummer, Grabart, manueller Status, getrennte Sperre, optionale Soll-Kapazität und kanonischer Fallbezug | USR-2026-08-13-INCREMENT-4A | synthetischer Stammdateninkrement 4a | Muss | keine automatische Nummerierung, Kapazitäts- oder Belegungsberechnung |
| REQ-BUR-001 bis 009 | BESTÄTIGT FÜR 4b | Einfacher Beisetzungsprozess von Entwurf bis Abschluss mit Person, kanonischer Grabstelle, Planungs-/Durchführungstag, kontrollierten Rückschritten und atomarer Grabstellenstatuskopplung | USR-2026-08-13-INCREMENT-4B | synthetischer Beisetzungsinkrement 4b | Muss | fachliche Abnahme durch Friedhofsverwaltung bleibt offen; keine Unterlagen, Ressourcen oder Kollisionen |
| REQ-DUP-002 | BESTÄTIGT FÜR 4b | Serverseitiger Hinweis auf mögliche Personendubletten mit ausdrücklich bestätigtem zweiten Schreibversuch | USR-2026-08-13-INCREMENT-4B | Personenanlage innerhalb der synthetischen Fallakte | Muss | Hinweis statt dauerhaftem Verbot; keine globale Dublettenfreigabe |

## 1. Projektziel

**Status:** Grundrichtung `BESTÄTIGT`, konkreter Funktionsumfang weiterhin zu
erheben.

- BESTÄTIGT: Cemaris wird als neue, eigenständige Open-Source-
  Friedhofsverwaltungssoftware entwickelt (`INT-004`, Konfidenz hoch).
- BESTÄTIGT: EDWALT wird weder funktional noch technisch 1:1 nachgebaut
  (`INT-002`, Konfidenz hoch).
- BESTÄTIGT: Die fachlich relevanten EDWALT-Daten sollen nach Cemaris migriert
  werden (`INT-003`, Konfidenz hoch).
- BESTÄTIGT: Der Migrationsumfang soll auch abgeschlossene und historische
  Fälle umfassen (`INT-006`, Konfidenz hoch).
- BESTÄTIGT: Alle für den späteren Betrieb erforderlichen Daten sollen ohne
  umfangreiche manuelle Nacherfassung übernommen werden; Notizen sind
  ausgeschlossen (`INT-007`, Konfidenz hoch).
- BESTÄTIGT: Vorhandene Akten, Bescheide und Schreiben werden nicht nach
  Cemaris migriert oder aus ihren bisherigen Ablagen verschoben. Migriert
  werden nur die strukturierten EDWALT-Daten (`INT-024`, Konfidenz hoch).
- BESTÄTIGT: Zum strukturierten Migrationsumfang gehören auch die historischen
  Krematoriumsdaten, obwohl das Modul heute nicht genutzt wird (`INT-027`).
  Daraus folgt keine bestätigte Cemaris-Funktionsanforderung.
- BESTÄTIGT: Stornierte, aufgehobene und durch Umnummerierung überholte
  Vorgänge werden nicht migriert (`INT-028`). Gültige Nachfolger dürfen dadurch
  nicht verloren gehen; die Quelldaten werden nicht verändert.
- BESTÄTIGT: Bei Umnummerierungen wird der gültige Nachfolger ausschließlich
  mit seiner aktuellen Nummer migriert. Frühere Nummern werden nicht als Such-
  oder Historienkennung übernommen (`INT-029`).
- BESTÄTIGT: Aus EDWALT werden Bescheidnummer, Gebührenpositionen,
  festgesetzter Betrag, Fälligkeit und Fallbezug migriert. Zahlungsstatus und
  Mahnungen werden nicht aus EDWALT übernommen, weil FINANZ+ dafür führend ist
  (`INT-030`).
- BESTÄTIGT: Der erste nutzbare Cemaris-Abschnitt soll eine lesende Suche und
  Anzeige von Friedhofs-, Grab-, Personen- und Falldaten sein. Er wird vor den
  schreibenden Funktionen für Erfassung, Bearbeitung, Gebühren und Bescheide
  umgesetzt (`INT-031`, `REQ-MVP-001`).
- BESTÄTIGT: Nach der technischen Umsetzung des lesenden Abschnitts wird die
  Cemaris-Produktentwicklung vor der weiteren EDWALT-Importanalyse fortgesetzt
  (Projektentscheidung 12.08.2026, ADR-0009). Der zweite technische Inkrement
  bleibt auf synthetische Development-Fallakten und die in
  `case-record-write-decisions.md` festgelegten Grunddaten begrenzt.
- OFFEN: Welche weiteren begleitenden Datenkategorien aufbewahrungspflichtig,
  nur zu archivieren oder nicht zu übernehmen sind.

- OFFEN: Welche konkreten Probleme des heutigen Verfahrens sollen gelöst werden?
- OFFEN: Woran messen Verwaltung, IT und weitere Beteiligte den Projekterfolg?
- OFFEN: Welche Organisationen, Friedhöfe und Betriebsstellen liegen im initialen Geltungsbereich?
- OFFEN: Welche Funktionen bleiben bewusst in anderen Systemen?
- OFFEN: Welche gesetzlichen, organisatorischen und zeitlichen Randbedingungen bestehen?

## 2. Ist-System EDWALT

**Status:** Der produktive Einsatz durch ungefähr drei Personen sowie das
Vorliegen des aktuellen Programm- und Datenstands sind `BESTÄTIGT` (`INT-005`,
Konfidenz hoch). Nutzungshäufigkeiten sind auf Bereichsebene bestätigt
(`INT-008`); die Nutzung einzelner Funktionen und die fachliche Bedeutung der
einzelnen Bestände bleiben `OFFEN`.

Die kanonische Produktbezeichnung ist **EDWALT**. **EDWALT3** bezeichnet
dasselbe Produkt beziehungsweise die konkret untersuchte Version. Die frühere
Cemaris-Schreibweise ohne abschließendes `T` war falsch (`INT-001`, Status
`BESTÄTIGT`, Konfidenz hoch).

- Die [Read-only-Quellenanalyse](edwalt-analysis/README.md) inventarisiert 597
  Dateien, beide HTML-Hilfen, 123 Hilfebilder, technische Komponenten, 24
  DAT/IDX-Paare sowie Vorlagen, Makros, Reports und Releasehinweise.
- Der [Funktionskatalog](edwalt-analysis/function-catalog.md) beschreibt nur
  beobachtete Altverfahrensfunktionen; Muss/Soll/Kann und Ist-Nutzung sind offen.
- Die [Evidenzmatrix](edwalt-analysis/evidence-matrix.md) trennt Handbuch,
  Screenshot, Programmartefakt, Datenindiz, Vorlage und Releasehinweis.
- Der [Interviewleitfaden](edwalt-analysis/open-questions-and-interview-guide.md)
  priorisiert die noch erforderliche fachliche Bestätigung und
  Prozessbeobachtung.
- Das [fortlaufende Interviewprotokoll](edwalt-analysis/interview-record.md)
  hält bestätigte Antworten und ihre Evidenz-IDs fest.
- Die bestehende [EDWALT-Inventur](edwald-inventory.md) bleibt als Erhebungs-
  und Interviewcheckliste bestehen. Nur ihr historischer Dateiname
  `edwald-inventory.md` bleibt zur Linkkompatibilität unverändert.

## 3. Beteiligte Rollen

**Status:** Die organisatorische Zuordnung zum Fachbereich 1 „Bürgerservice,
Ordnung und Sicherheit“ ist `BESTÄTIGT` (`INT-010`, Konfidenz hoch). Konkrete
Rollen sind auf hoher Ebene als gleichberechtigte Sachbearbeitung einschließlich
Gebühren sowie Administration belegt (`INT-011`, Konfidenz hoch). Die genaue
Aufgabenverteilung ist teilweise bestätigt: Die technische Administration
liegt in der IT-Abteilung; fachliche Stammdaten pflegen auch Sachbearbeiter
(`INT-012`, Konfidenz hoch). Die konkreten Stammdaten- und Freigaberegeln bleiben
`OFFEN`.

- BESTÄTIGT: Die Friedhofsverwaltung ist im Fachbereich 1 „Bürgerservice,
  Ordnung und Sicherheit“ angesiedelt (`INT-010`).
- BESTÄTIGT: Die Sachbearbeitungsnutzer haben dieselben Rechte und bearbeiten
  auch Gebühren; administrative Aufgaben übernimmt eine Administratorrolle
  (`INT-011`).
- BESTÄTIGT: Der Administrator sitzt in der IT-Abteilung und übernimmt die
  allgemeine technische Fachsoftwarebetreuung einschließlich Benutzer/Rechte,
  Einstellungen, Installation/Updates, Sicherung und Fehlerbehebung
  (`INT-012`).
- OFFEN: Welche weiteren Organisationseinheiten wirken an den Prozessen mit?
- OFFEN: Wer erfasst, prüft, genehmigt, versendet, kassiert, archiviert und wertet aus?
- OFFEN: Welche Vertretungs-, Vier-Augen- und Funktionstrennungsregeln gelten?
- OFFEN: Welche externen Beteiligten oder Dienstleister existieren?
- OFFEN: Wer ist fachlich, technisch und datenschutzrechtlich verantwortlich?

## 4. Ist-Prozesse

**Status:** ZU ERHEBEN.

- Für jeden Prozess Auslöser, Eingang, Schritte, Entscheidungen, Beteiligte, Systeme, Medienbrüche, Ergebnis und Nacharbeit dokumentieren.
- Normalfall, Varianten, Korrektur, Storno, Widerspruch und Sonderfälle getrennt aufnehmen.
- Durchlaufzeiten, Fallzahlen, saisonale Last und wiederkehrende Probleme erfragen.
- Excel-, Word-, E-Mail-, Papier- und Laufwerkslösungen ausdrücklich einbeziehen.
- OFFEN: Welche Prozessschritte beruhen auf Recht, Satzung, Dienstanweisung oder Gewohnheit?

## 5. Stammdaten

**Status:** Friedhofsstruktur, Grabarten und Grabstellen sind für den
synthetischen Inkrement 4a `BESTÄTIGT`. Die fachliche Abnahme durch die
Friedhofsverwaltung und weitere Stammdaten bleiben `OFFEN`.

Im Erhebungskontext bezeichnet „Stammdaten“ relativ dauerhafte fachliche Grund-
und Katalogdaten, nicht einzelne Beisetzungsfälle. Das EDWALT-Handbuch nennt als
Kandidaten Friedhöfe, Felder, Grabarten, Gebühren, allgemeine Adressen und
Auswahllisten. Diese Handbuchzuordnung ist noch keine Bestätigung ihrer lokalen
Pflege oder einer späteren Cemaris-Ausgestaltung.

- BESTÄTIGT: Sachbearbeiter pflegen Friedhöfe/Felder, Grabarten,
  Gebührenarten/-sätze, allgemeine Adressen und Auswahllisten (`INT-013`).
- BESTÄTIGT: Dokument- und Formularzuordnungen werden nicht durch die
  Sachbearbeiter, sondern administrativ verwaltet (`INT-013`).
- BESTÄTIGT: Die IT besitzt nicht die fachliche Kenntnis über die lokalen
  Friedhofsinhalte; technische Betreuung ist keine fachliche Datenhoheit
  (`INT-013`).
- BESTÄTIGT FÜR 4a: Beide Rollen pflegen Friedhofsstruktur und Grabarten als
  fachliche Stammdaten. Nur `Administration` darf unbenutzte Stammdaten
  physisch löschen; verwendete Werte werden ausschließlich deaktiviert.
- BESTÄTIGT FÜR 4a: Umbenennungen gelten unmittelbar, ohne fachliche
  Namenshistorie. Stabile IDs und der datensparsame Änderungsnachweis bleiben
  erhalten.
- OFFEN: Welche weiteren Kataloge, Schlüssel, Nummernkreise und
  organisatorischen Daten werden benötigt?
- OFFEN: Wer genehmigt und historisiert Änderungen an fachlichen Stammdaten?
- OFFEN: Gelten Werte kommunenweit, je Friedhof oder zeitabhängig?
- OFFEN: Welche Werte stammen aus externen führenden Systemen?
- OFFEN: Welche Stammdaten sind migrationsrelevant?

## 6. Friedhofsstruktur

**Status:** Für Inkrement 4a `BESTÄTIGT`; spätere örtliche Fachabnahme bleibt
erforderlich.

- BESTÄTIGT: Hierarchie `Friedhof → Bereich → Feld → Reihe → Grabstelle`;
  Friedhof und Grabstelle verpflichtend, Zwischenebenen eigenständig optional.
- BESTÄTIGT: serverseitige stabile GUIDs; Friedhof systemweit eindeutig,
  untergeordnete Bezeichnungen und Grabnummer nur in ihrem Elternpfad.
- BESTÄTIGT: Belegungsstatus `Frei`, `Reserviert`, `Belegt`; Sperrung als
  unabhängiges Merkmal; Statusänderungen in 4a ausschließlich manuell.
- BESTÄTIGT: Grabarten sind frei konfigurierbar und je Friedhof aktivierbar;
  der lokale Satzungskatalog wird nicht global fest eingebaut.
- OFFEN: automatische Nummerierung, Kapazitätsprüfung, Schließung,
  Entwidmung, Umnummerierung, Karten, Koordinaten, GIS und mobile Nutzung.

## 7. Personen

**Status:** UNBEKANNT.

- OFFEN: Welche Personenkategorien treten fachlich auf, ohne daraus schon Systemrollen abzuleiten?
- OFFEN: Welche Attribute sind für welchen Zweck erforderlich und rechtlich zulässig?
- OFFEN: Wie werden Anschriften, Namensänderungen, Kontakte, Organisationen und Vertreter behandelt?
- OFFEN: Wie werden Dubletten erkannt und zusammengeführt?
- OFFEN: Welche Daten stammen aus Melderegister- oder anderen Schnittstellen?

## 8. Verstorbene

**Status:** UNBEKANNT.

- OFFEN: Welche Daten werden aus welchem Rechts- und Prozesszweck benötigt?
- OFFEN: Welche Nachweise, Identifikatoren und Herkunftssysteme existieren?
- OFFEN: Wie werden Korrekturen und widersprüchliche Angaben behandelt?
- OFFEN: Welche besonderen Schutz-, Anzeige- oder Aufbewahrungsanforderungen gelten?
- OFFEN: Welche Beziehungen zu Personen, Grabstellen, Beisetzungen und Vorgängen sind fachlich zulässig?

## 9. Beisetzungen

**Status:** Der einfache synthetische Prozess für Inkrement 4b ist durch
`USR-2026-08-13-INCREMENT-4B` bestätigt. Die fachliche Abnahme durch die
Friedhofsverwaltung bleibt `OFFEN`.

- BESTÄTIGT FÜR 4b: einfacher Ablauf `Entwurf → Geplant → Bestätigt →
  Durchgeführt → Abgeschlossen` mit den dokumentierten kontrollierten
  Rückschritten; keine weiteren Prozessvarianten.
- BESTÄTIGT FÜR 4b: Planungstag und tatsächlicher Beisetzungstag werden als
  Kalendertage ohne Uhrzeit erfasst; keine Ressourcen- oder Kollisionsprüfung.
- BESTÄTIGT FÜR 4b: keine Unterlagen, Checklisten oder EDWALT-Prozessschritte.
- OFFEN: Welche Änderungen, Umbettungen oder Stornierungen sind möglich?
- OFFEN: Welche Dokumente, Gebühren und DMS-Vorgänge werden ausgelöst?
- BESTÄTIGT FÜR 4b: mehrere Verstorbene und Beisetzungen je Fall; jede neue
  Beisetzung gehört genau zu einer verstorbenen Person und einer Grabstelle;
  höchstens eine Beisetzung je verstorbener Person in diesem Ausbaustand.
- BESTÄTIGT FÜR 4b: beide Rollen dürfen Fachschritte ausführen; kontrollierte
  Korrekturen sind zulässig; Storno und Umbettung werden nicht implementiert.
- BESTÄTIGT FÜR 4b: sofern Werte vorliegen gilt Geburt ≤ Tod ≤ ausgeführte
  Beisetzung; nur ein Planungstermin darf in der Zukunft liegen.
- BESTÄTIGT FÜR 4b: Bestätigung reserviert eine freie Grabstelle;
  Durchführung setzt eine freie oder reservierte Grabstelle auf belegt.
  Rückschritte stufen den Grabstatus niemals automatisch zurück.

## 10. Nutzungsrechte

**Status:** UNBEKANNT. Nutzungszeiten und Berechnungsregeln werden nicht vorgegeben.

- OFFEN: Welche Rechte, Inhaber, Mitberechtigte und Übergänge existieren?
- OFFEN: Wann entstehen, beginnen, enden, ruhen oder ändern sich Rechte?
- OFFEN: Wie werden Übertragungen, Verzicht, Entzug und Rechtsnachfolge behandelt?
- OFFEN: Welche Nachweise und Benachrichtigungen sind erforderlich?
- OFFEN: Welche Historie muss unveränderbar nachvollziehbar bleiben?

## 11. Ruhefristen

**Status:** UNBEKANNT. Es sind keine Fristdauern oder Ableitungsregeln definiert.

- OFFEN: Welche Ereignisse lösen eine Ruhefrist aus?
- OFFEN: Wovon hängen Dauer, Beginn und Ende ab?
- OFFEN: Welche Satzungsversion und welcher Stichtag sind maßgeblich?
- OFFEN: Wie werden abweichende, unterbrochene oder nachträglich korrigierte Fristen behandelt?
- OFFEN: Welche Hinweise und Wiedervorlagen entstehen?

## 12. Gebühren

**Status:** EDWALT erzeugt die Bescheide; eine Finanzdatenübergabe findet nicht
statt. Die Bescheide werden manuell im Finanzverfahren eingebucht, das für
Forderungen und Zahlungen führend ist (`INT-014`, `BESTÄTIGT`, Konfidenz hoch).
Gebührenordnung und Berechnungslogik bleiben `OFFEN`.

- OFFEN: Welche Gebührenpositionen und Gebührenordnungen existieren und wann gelten sie?
- OFFEN: Welche Mengen, Zeiträume, Ermäßigungen, Befreiungen oder Rundungen sind zulässig?
- OFFEN: Wie werden Festsetzung, Fälligkeit, Korrektur, Storno und Erstattung behandelt?
- BESTÄTIGT: **FINANZ+** von MACH (ehemals DATA-PLAN) ist für Forderungen und
  Zahlungen führend (`INT-014`, präzisiert durch `INT-015`).
- BESTÄTIGT: Es besteht keine aktive Finanzdatenübergabe; EDWALT-Bescheide
  werden manuell eingebucht (`INT-014`).
- BESTÄTIGT: Mindestens Zahlungspflichtiger, Bescheidnummer, Betrag, Fälligkeit
  und Kostenstelle werden manuell erfasst, anschließend kontrolliert und
  gebucht (`INT-015`).
- BESTÄTIGT: Zahlungseingänge verbucht die Buchhaltung; die
  Friedhofsverwaltung erhält darüber keine Rückmeldung (`INT-015`).
- BESTÄTIGT: Zahlungsstatus und Mahnungen werden in FINANZ+ geführt
  (`INT-016`). EDWALT ist hierfür nicht führend.
- BESTÄTIGT: Für die Datenmigration werden aus EDWALT Bescheidnummer,
  Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug
  übernommen; Zahlungsstatus und Mahnungen sind ausdrücklich ausgeschlossen
  (`INT-030`, `REQ-MIG-006`).
- OFFEN: Welche weiteren Bescheiddaten werden übertragen, wie werden Fehler
  korrigiert und welche Schlüssel verbinden EDWALT-Bescheid und
  FINANZ+-Forderung?
- OFFEN: Welche Prüfschritte und Funktionstrennungen gelten?

## 13. Bescheide und Schreiben

**Status:** UNBEKANNT. Es werden keine Texte oder Rechtsbehelfsbelehrungen erfunden.

- Bestehende Dokumentarten, anonymisierte Muster und Auslöser inventarisieren.
- OFFEN: Welche Inhalte sind fachlich, rechtlich oder kommunal vorgegeben?
- OFFEN: Welche Briefköpfe, Sprachen, Barrierefreiheits- und PDF/A-Anforderungen gelten?
- OFFEN: Wie erfolgen Entwurf, Prüfung, Freigabe, Versand, Korrektur und Aufhebung?
- OFFEN: Welche Vorlagenversion muss für welchen Stichtag verwendet werden?

## 14. Dokumente und Winyard

**Status:** Vorgesehen ist, EDWALT-Bescheide als Datei zu speichern und mangels
Schnittstelle manuell in Winyard hochzuladen (`INT-017`, `BESTÄTIGT`,
Konfidenz hoch für den vorgesehenen Ablauf). Ob dies tatsächlich vollständig
geschieht oder lokale Datei- beziehungsweise Papierablagen bestehen, ist
`OFFEN`. Die künftige Winyard-Schnittstelle für Cemaris ist als Bedarfsbereich
`BESTÄTIGT` (`INT-018`, Konfidenz hoch); ihre Fähigkeiten und technische
Ausgestaltung bleiben `OFFEN`.

- BESTÄTIGT: EDWALT besitzt keine Winyard-Schnittstelle; die vorgesehene Ablage
  erfolgt manuell (`INT-017`).
- BESTÄTIGT: Die heutige Ablage folgt einer internen Arbeitsregel; eine
  Dienstanweisung ist geplant (`INT-018`). Zeitpunkt und Inhalt sind offen.
- BESTÄTIGT: Cemaris soll eine Winyard-Schnittstelle erhalten (`INT-018`). Die
  Grundfähigkeiten stehen als REQ-DMS-001 bis REQ-DMS-008 fest (`INT-019`);
  Konfiguration, entkoppelter Betrieb und automatische Zielermittlung ergänzen
  REQ-DMS-009 bis REQ-DMS-011 (`INT-020` bis `INT-023`).
- BESTÄTIGT: Akte suchen/anlegen, Metadaten übertragen und Erfolg/Fehler
  anzeigen sind bei aktivierter Integration Muss; automatische Ablage und
  Wiederholung sind dann Soll (`INT-019`, präzisiert durch `INT-020`).
- VERWORFEN: Dauerhafte Speicherung der Winyard-Dokument-ID und Öffnen des
  abgelegten Dokuments aus Cemaris sind derzeit nicht erforderlich (`INT-019`).
- BESTÄTIGT: Die heutige und die gewünschte künftige Winyard-Ablage sind nach
  Vorgangsart und Jahr organisiert; die Struktur soll konfigurierbar sein
  (`INT-020/021`, `IMG-INT-001/002`).
- BESTÄTIGT: Eine unter der passenden Vorgangsart fehlende Jahresablage legt
  Cemaris bei aktivierter Integration automatisch an (`INT-022`).
- BESTÄTIGT: Vorgangsart und Ablagejahr bestimmt Cemaris automatisch aus dem
  Fall- und Dokumentkontext. Abhängig vom Vorgang ist das Jahr der
  Bescheiderstellung oder der Beisetzung maßgeblich (`INT-023`).
- VERWORFEN: Die zunächst aus `INT-020` abgeleitete Akte je Grabstätte ist nach
  der Klarstellung `INT-021` nicht das Zielmodell.
- BESTÄTIGT: Cemaris muss ohne Winyard produktiv betrieben werden können; die
  Integration ist zunächst optional und soll erst später produktiv aktiviert
  werden (`INT-020`).
- OFFEN: Welche Akten und Dokumentklassen existieren im DMS?
- OFFEN: Wann wird eine Akte angelegt, verknüpft oder abgeschlossen?
- OFFEN: Welche Metadaten, technischen IDs und Aktenzeichen werden ausgetauscht?
- OFFEN: Welche Dokumente bleiben ausschließlich im DMS und welche Referenzen benötigt Cemaris?
- OFFEN: Wie funktionieren Authentifizierung, Berechtigung, Suche, Fehlerbehandlung und Nacharchivierung?
- Siehe [Winyard-Integrationskonzept](../architecture/winyard-integration.md).

## 15. Wiedervorlagen und Fristen

**Status:** UNBEKANNT.

- OFFEN: Welche fachlichen oder organisatorischen Ereignisse erzeugen Wiedervorlagen?
- OFFEN: Wie werden Fristen berechnet, geändert, erledigt und eskaliert?
- OFFEN: Wer sieht, übernimmt und vertritt Aufgaben?
- OFFEN: Welche Benachrichtigungen und Kalenderbezüge sind nötig?
- OFFEN: Wie werden überfällige oder fehlerhaft berechnete Termine behandelt?

## 16. Suche

**Status:** Der erste Suchumfang ist `BESTÄTIGT`; weitergehende Suchsemantik
bleibt `OFFEN`.

- BESTÄTIGT: Der erste nutzbare Abschnitt besitzt eine gemeinsame Suche mit
  optionalen Filtern für Name/Vorname, Geburts-/Sterbedatum, Friedhof/Feld/
  Grabnummer, Beisetzungsdatum, Nutzungsberechtigte/Anschriften und
  Bescheidnummer (`INT-031/032`, `REQ-MVP-001/002`).
- BESTÄTIGT: Die lesende Detailansicht verbindet Friedhof/Grab, Verstorbene,
  Beisetzungen, Nutzungsrechte/Laufzeiten, Berechtigte/Adressen und Bescheid-/
  Gebühreninformationen. Zahlungsstatus und Mahnungen gehören nicht dazu
  (`INT-033`, `REQ-MVP-003`).
- UMGESETZT (technischer MVP): Mindestlaenge, UND-Logik, konfigurierbares
  Zehnerlimit, Relevanzsortierung, konkrete Detailfelder und bewusste Grenzen
  sind in
  [MVP-Entscheidungen: Lesende Suche und Detailansicht](mvp-read-search-decisions.md)
  nachvollziehbar festgehalten. Diese Umsetzung verwendet ausschliesslich
  synthetische Repository-Daten und ist noch keine fachliche Freigabe des
  Lesemodells.
- OFFEN: Welche Kombinationen, Unschärfen, phonetischen Suchen oder historischen Werte sind nötig?
- OFFEN: Welche Treffer dürfen aufgrund von Berechtigungen nicht sichtbar sein?
- OFFEN: Welche Antwortzeiten und Datenmengen werden erwartet?
- OFFEN: Müssen DMS-Inhalte, Karten oder Altdaten einbezogen werden?

## 17. Auswertungen und Statistiken

**Status:** UNBEKANNT.

- Bestehende Reports, Listen, Exporte und manuelle Auswertungen inventarisieren.
- OFFEN: Empfänger, Zweck, Stichtag, Kennzahlendefinition und Periodizität je Auswertung?
- OFFEN: Werden Detaildaten oder ausschließlich aggregierte Daten benötigt?
- OFFEN: Welche Formate, Filter, Sortierungen und Barrierefreiheitsanforderungen gelten?
- OFFEN: Welche Datenschutz- und Geheimhaltungsgrenzen bestehen?

## 18. Benutzer und Berechtigungen

**Status:** Grundrollen und Sichtbarkeit sind `BESTÄTIGT`; technische
Identitätsquelle und Detailrechte bleiben `OFFEN`.

- BESTÄTIGT: Die ungefähr drei Sachbearbeitungsnutzer haben dieselben Rechte;
  ein IT-Administrator übernimmt die technische Administration (`INT-011/012`).
- BESTÄTIGT: Der IT-Administrator darf sämtliche fachlichen Personen- und
  Falldaten sehen (`INT-034`, `REQ-BER-001`).

- OFFEN: Welche Identitätsquelle wird je Betriebsumgebung verwendet?
- OFFEN: Welche Aufgaben, Datenbereiche und Operationen müssen getrennt berechtigt werden?
- OFFEN: Gibt es Friedhofs-, Organisations-, Fall- oder Vertretungsbezug?
- OFFEN: Welche administrativen Rechte und Genehmigungen erfordern das Vier-Augen-Prinzip?
- OFFEN: Wie erfolgen Einrichtung, Änderung, Sperrung, Rezertifizierung und Audit von Zugängen?

## 19. Schnittstellen

**Status:** UNBEKANNT.

- Alle ein- und ausgehenden Systeme mit fachlichem Zweck, Eigentümer und führender Datenquelle erfassen.
- OFFEN: Protokolle, Formate, Authentifizierung, Netzwege und Betriebszeiten?
- OFFEN: Echtzeit, Batch, manueller Import oder Export?
- OFFEN: Fehler-, Wiederholungs-, Dubletten- und Abstimmungsverfahren?
- OFFEN: Versionsmanagement, Testsysteme, Ansprechpartner und Herstellerunterstützung?

## 20. Datenmigration

**Status:** Quellartefakte technisch inventarisiert; Satzlayout, fachliche
Schlüssel und Zieldatenmodell sind weiterhin nicht verstanden.

- EDWALT-Datenbankdateien, Dokumentpfade und Nebenlisten inventarisieren.
- OFFEN: Welche Daten müssen, dürfen oder dürfen nicht migriert werden?
- OFFEN: Welche Historie und Beweiskraft muss erhalten bleiben?
- OFFEN: Welche Datenqualitäts-, Dubletten- und Zuordnungsprobleme bestehen?
- OFFEN: Wie erfolgen Testmigration, fachliche Abnahme, Delta, Cutover und Rückfall?
- BESTÄTIGT: Der Altbestand an Akten, Bescheiden und Schreiben verbleibt an
  seinen heutigen Ablageorten und wird nicht nach Cemaris übernommen
  (`INT-024`, `REQ-MIG-001`).
- BESTÄTIGT: EDWALT bleibt während der Cemaris-Einführung vorübergehend als
  lesende Rückfallebene verfügbar, bis Cemaris zuverlässig funktioniert
  (`INT-025/026`, `REQ-MIG-002`). Dies ersetzt nicht die Migration der
  strukturierten Daten.
- BESTÄTIGT: Der strukturierte historische Krematoriumsbestand wird migriert
  (`INT-027`, `REQ-MIG-003`); die heutige Nichtnutzung ist durch `INT-008`
  bestätigt.
- BESTÄTIGT: Sicher als storniert, aufgehoben oder durch Umnummerierung
  überholt erkannte Vorgänge werden ausgeschlossen (`INT-028`,
  `REQ-MIG-004`).
- BESTÄTIGT: Für gültige Nachfolger genügt die aktuelle Nummer
  (`INT-029`, `REQ-MIG-005`).
- OFFEN: Wie bleiben diese getrennten Altbestände nach der EDWALT-Ablösung
  dauerhaft auffindbar, lesbar und berechtigt zugänglich?
- OFFEN: Wie werden tatsächliche Nur-Lese-Nutzung und Laufzeitumgebung der
  Rückfallebene technisch abgesichert, und welche Abnahmekriterien beenden sie?
- Siehe [Migrationsstrategie](../migration/README.md).
- Siehe auch die konkrete
  [EDWALT-Quellenanalyse](../migration/edwalt-source-analysis.md); sie ist kein
  Zielschema und kein Mapping.

## 21. Datenschutz

**Status:** ZU PRÜFEN mit Datenschutzverantwortlichen.

- MITGETEILT: Die Projektverantwortung gibt eine lokale Datenschutzfreigabe
  an. Dokument, Geltungsbereich und verantwortliche Stelle sind im Repository
  nicht belegt. Die Angabe ist nicht auf andere Open-Source-Betreiber
  übertragbar und hebt die Synthetik-/Development-Grenze nicht auf.

- Zwecke, Rechtsgrundlagen, Datenkategorien und betroffene Personen je Verarbeitung erfassen.
- OFFEN: Welche Daten sind zwingend, optional oder unzulässig?
- OFFEN: Welche Informations-, Auskunfts-, Berichtigungs- und Löschprozesse gelten?
- OFFEN: Ist eine Datenschutz-Folgenabschätzung erforderlich?
- OFFEN: Welche Auftragsverarbeiter, Zugriffe und Übermittlungen existieren?
- OFFEN: Wie werden Test-, Schulungs- und Supportdaten datenschutzgerecht bereitgestellt?

## 22. Aufbewahrung

**Status:** UNBEKANNT.

- OFFEN: Welche Fristen gelten je Daten- und Dokumentart und auf welcher Grundlage?
- OFFEN: Wann beginnt die Frist, wodurch wird sie gehemmt und wer gibt Löschung frei?
- OFFEN: Welche Daten müssen dauerhaft nachvollziehbar, gesperrt oder archiviert bleiben?
- OFFEN: Wie wirken DMS-Aufbewahrung und Cemaris-Löschung zusammen?
- OFFEN: Welche Anforderungen bestehen an Backupkopien und Wiederherstellung?
- VORLÄUFIGE GRENZE: Bis zu einer fachlich und rechtlich bestätigten Regel
  erfolgt keine automatische Löschung oder Fristberechnung.

## 23. Auditierung

**Status:** UNBEKANNT. Es ist noch keine Audit-Engine festgelegt.

- OFFEN: Welche Lese- und Schreibhandlungen sind fachlich oder sicherheitsseitig nachweispflichtig?
- OFFEN: Welche Identität, Rolle, Zeit, Anlass und Änderung müssen gespeichert werden?
- OFFEN: Wer darf Auditdaten suchen, exportieren und löschen?
- OFFEN: Wie werden Integrität und Ausfallsicherheit gewährleistet?
- OFFEN: Welche Abgrenzung besteht zu technischen Logs und Winyard-Historien?

## 24. Betrieb

**Status:** ZU ERHEBEN.

- Zielplattformen, Netzwerkzonen, Reverse Proxy, TLS und DNS dokumentieren.
- OFFEN: Verfügbarkeit, Wartungsfenster, Recovery Time und Recovery Point?
- OFFEN: Backup, Restore-Tests, Monitoring, Alarmierung und Kapazitätsplanung?
- OFFEN: Patch-, Release-, Rollback- und Konfigurationsprozesse?
- OFFEN: Verantwortlichkeiten zwischen Fachamt, IT, Rechenzentrum und Dienstleistern?
- OFFEN: Anforderungen an getrennte Entwicklungs-, Test-, Schulungs- und Produktionsumgebungen?

## 25. Nichtfunktionale Anforderungen

**Status:** UNBEKANNT; messbare Ziele festlegen.

- Accessibility-Zielstandard und unterstützte Hilfsmittel,
- unterstützte Browser, Endgeräte und Bildschirmgrößen,
- Antwortzeiten, Parallelität, Fallzahlen und Datenvolumen,
- Verfügbarkeit, Skalierung und Wiederanlauf,
- Informationssicherheit, Verschlüsselung und Schwachstellenmanagement,
- Wartbarkeit, Observability, Support- und Dokumentationsbedarf,
- Internationalisierung, Zeitzone und Datums-/Zahlenformate,
- Portabilität und Vermeidung von Vendor-Lock-in.

## 26. Offene Fragen

Zentrale, noch unbeantwortete Beispiele:

- GEKLÄRT FÜR 4a: Grabarten sind frei konfigurierbar; kommunale Katalogwerte
  werden nicht fest eingebaut.
- OFFEN: Wie wird die Ruhefrist bestimmt?
- OFFEN: Können mehrere Verstorbene einer Grabstelle zugeordnet sein und unter welchen fachlichen Regeln?
- OFFEN: Welche Gebührenpositionen existieren?
- OFFEN: Wie werden Verlängerungen berechnet?
- OFFEN: Welche Aktenstruktur wird in Winyard verwendet?
- OFFEN: Welche Rollen und Berechtigungen werden tatsächlich benötigt?
- OFFEN: Welche EDWALT-Daten und Nebenlösungen sind migrationsrelevant?

Weitere Fragen erhalten eine ID und werden bis zur Klärung nicht als Produktregel umgesetzt.

| Frage-ID | Themenbereich | Frage | Verantwortlich | Zieltermin | Status | Ergebnis / Quelle |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-001 | Friedhofsstruktur | Welche Grabarten werden benötigt? | Projektverantwortung | 13.08.2026 | GEKLÄRT FÜR 4a | frei konfigurierbarer leerer Katalog; Satzung-DK-2023 nur lokale Evidenz |

## 27. Produktinkremente

**Status:** Der erste lesende Inkrement ist technisch umgesetzt. Der zweite
Inkrement ist technisch begrenzt und priorisiert; fachlich offene Folgeprozesse
bleiben vor ihrer Implementierung zu bestätigen.

Bewertungskriterien:

- belegter Nutzen und Nutzungshäufigkeit,
- rechtliche oder betriebliche Notwendigkeit,
- Ende-zu-Ende-Fähigkeit statt isolierter Maske,
- Migrations- und Integrationsabhängigkeiten,
- Datenschutz- und Sicherheitsrisiko,
- Implementierungs- und Einführungsaufwand,
- Möglichkeit eines sicheren Parallel- oder Pilotbetriebs.

| Kandidat | Belegter Bedarf | Nutzen | Abhängigkeiten | Risiko | Aufwand | Entscheidung |
| --- | --- | --- | --- | --- | --- | --- |
| lesende Suche und Detailansicht | REQ-MVP-001 bis 004 | kontrollierter zusammenhängender Lesezugriff | synthetische Daten beziehungsweise späterer Testimport | sensible Vollsicht; noch keine Produktivfreigabe | umgesetzt | technisch abgeschlossen, fachliche Abnahme später |
| schreibende Fallakten-Grundlage | Projektentscheidung 12.08.2026; vorhandene bestätigte Lesefelder | erster durchgängiger Anlage-/Änderungsweg ohne Fachableitungen | Feature-Grenze, Nebenläufigkeit, Persistenz, API und UI | ohne Identität/Audit nicht produktiv zulässig | umgesetzt | technisch abgeschlossen gemäß `case-record-write-decisions.md`; Development-only, synthetisch, keine Produktivfreigabe |
| einfacher Beisetzungsprozess 4b | USR-2026-08-13-INCREMENT-4B | vorstellbarer Ablauf von Entwurf bis Abschluss mit kontrollierter Korrektur | kanonische Personen-/Grabstellenbezüge und 4a-Sicherheitsgrundlage | spätere fachliche Verwaltungsabnahme; keine Ressourcen-, Unterlagen- oder Fristlogik | FREIGEGEBEN ZUR TECHNISCHEN UMSETZUNG | verbindlicher Auftrag in `cemaris-increment-4b-next-step-handoff.md` |
| vollständiger Beisetzungs- und Rechteprozess | INT-008/009, offene P0-Fragen | zentraler Fachprozess | Anwenderinterview, Rollen-, Frist-, Satzungs- und Historienregeln | sehr hoch bei geratenen Regeln | OFFEN | noch nicht implementieren |
| Friedhofsstruktur und Grabstättenstammdaten 4a | USR-2026-08-13-INCREMENT-4A, Satzung-DK-2023 | kanonische frei konfigurierbare Struktur statt freier Falltexte | bestehende Identitäts-/Policy-/Auditgrundlage | fachliche Abnahme folgt; Löschung und Referenzen sicher begrenzt | umgesetzt | technisch Ende zu Ende mit synthetischen Daten umgesetzt; keine Produktivfreigabe |
