# Offene Fragen und Interviewleitfaden

Stand: 10. August 2026

## Anwendung

Alle Fragen in den offenen Themenabschnitten haben Status `OFFEN`. Bereits
beantwortete Grundsatzfragen stehen in einer eigenen Tabelle. Die angegebene
Konfidenz bewertet, wie deutlich Quelle beziehungsweise Antwort die Aussage
belegen.

- **P0:** blockiert belastbare Ist-Aufnahme, Datenschutz- oder
  Migrationsplanung.
- **P1:** wichtig für Prozess-, Regel- und Dokumentverständnis.
- **P2:** klärt vermutlich optionale, historische oder seltene Funktionen.

Interviews sollen durch datensparsame Prozessbeobachtung mit Testfall oder
maskierter Ansicht ergänzt werden. Keine Personenakten, Handbuchbilder oder
produktiven Bildschirmfotos in Git ablegen. Erwartete Nachweise sind Hinweise
für die Erhebung, keine Aufforderung, geschützte Unterlagen ungeprüft zu
kopieren.

Empfohlene Beteiligte: Friedhofsverwaltung/Sachbearbeitung, fachliche Leitung,
Kasse/Finanzen, kommunale IT, Datenschutz und Informationssicherheit,
Registratur/DMS, Aufbewahrungsverantwortliche sowie – nur falls relevant –
Krematorium und GIS.

## Vorgehen im geführten Dialog

1. Es wird jeweils eine zusammenhängende Frage gestellt.
2. Die Antwort wird im [Interviewprotokoll](interview-record.md) neutral
   zusammengefasst und mit einer `INT-*`-Evidenz-ID versehen.
3. Eindeutige Aussagen der Projektverantwortung erhalten `BESTÄTIGT`;
   Unsicherheiten bleiben `OFFEN` oder `ANNAHME`, widersprechende Aussagen
   werden als `WIDERSPRUCH` dokumentiert.
4. Die nächste Frage wird aus der Antwort und den verbleibenden P0-Lücken
   abgeleitet. EDWALT-Funktionsgleichheit wird nicht unterstellt.

## Bereits beantwortete Fragen und Grundsatzentscheidungen

| Evidenz | Antwort | Status | Konfidenz | Auswirkung |
| --- | --- | --- | --- | --- |
| `INT-001` / Q-SYS-02 | Korrekte Bezeichnung EDWALT; EDWALT3 ist dasselbe Produkt beziehungsweise die untersuchte Version. | `BESTÄTIGT` | hoch | Kanonische Bezeichnung korrigiert. |
| `INT-002` | Keine funktionale oder technische 1:1-Nachbildung von EDWALT. | `BESTÄTIGT` | hoch | Funktionsinventar ist kein Cemaris-Backlog. |
| `INT-003` | Fachlich relevante EDWALT-Daten sollen migriert werden. | `BESTÄTIGT` | hoch | Datenerschließung und Migrationsabgrenzung sind verbindliche Arbeitsstränge. |
| `INT-004` | Cemaris wird eine neue, eigenständige Open-Source-Friedhofsverwaltungssoftware. | `BESTÄTIGT` | hoch | Anforderungen und Zielmodell werden unabhängig von EDWALT entwickelt. |
| `INT-005/036` / Q-SYS-01, Q-MIG-01 | EDWALT ist produktiv im Einsatz; die bereitgestellten Verzeichnisse stammen nicht aus der produktiven Umgebung, sind aber schema- und versionsgleich mit dem späteren Migrationsbestand. | `BESTÄTIGT`; INT-036 präzisiert die Quellenherkunft | hoch | Parser und Mapping dürfen daran entwickelt werden; Mengen und Inhaltsqualität sind keine produktiven Ist-Werte. |
| `INT-006` / Q-MIG-00 | Auch abgeschlossene und historische Fälle sollen der Vollständigkeit halber migriert werden. | `BESTÄTIGT` | hoch | Der Migrationsumfang ist zeitlich nicht auf aktive Fälle beschränkt; sachliche Datenkategorien und Ausschlüsse bleiben zu entscheiden. |
| `INT-007` / Q-MIG-00a | Alle für den späteren Betrieb erforderlichen Daten sollen so migriert werden, dass keine umfangreiche Nacherfassung nötig ist; Notizen sollen nicht migriert werden. | `BESTÄTIGT` | hoch | Betriebsnotwendigkeit und Vermeidung manueller Nacherfassung sind Auswahlkriterien; weitere mit „usw.“ gemeinte Ausschlüsse werden nicht pauschal angenommen. |
| `INT-008` / Q-SYS-04 | Personen/Adressen, Beisetzungen, Nutzungsrechte/Verlängerungen, Gebühren/Bescheide/Buchungen sowie Suche/Listen/Statistiken werden regelmäßig genutzt; Gräber/Friedhofsstruktur, Termine/Wiedervorlagen und Dokumente/Word-Vorlagen selten; Krematorium gar nicht. | `BESTÄTIGT` | hoch für Bereichshäufigkeiten; niedrig für Vollständigkeit sonstiger Arbeiten | Kernprozesse priorisieren; seltene Bereiche nicht ohne Bedarfsprüfung verwerfen; Krematorium separat abgrenzen. |
| `INT-009` / Q-BEI-00 | Der konkrete Ablauf eines regulären Beisetzungsfalls ist der antwortenden Projektverantwortung nicht bekannt. | Wissensgrenze `BESTÄTIGT`; Prozess `OFFEN` | hoch für die Wissensgrenze | Anwenderinterview und datensparsame Prozessbeobachtung erforderlich; keine Ableitung des Ist-Ablaufs allein aus dem Handbuch. |
| `INT-010` / Q-SYS-01a | Die Friedhofsverwaltung gehört in der kleinen Verwaltung zum Fachbereich 1 „Bürgerservice, Ordnung und Sicherheit“. | `BESTÄTIGT` | hoch | Organisatorischer Ist-Kontext ist geklärt; konkrete Rollen und Verantwortlichkeiten bleiben offen. |
| `INT-011` / Q-BER-00 | Die ungefähr drei Sachbearbeitungsnutzer haben dieselben Rechte und bearbeiten auch Gebühren; administrative Aufgaben übernimmt eine Administratorrolle. | `BESTÄTIGT` | hoch | Sachbearbeitung und Administration unterscheiden; genaue Administrationsaufgaben und Benutzerzuordnung bleiben offen. |
| `INT-012` / Q-BER-00a | Der Administrator sitzt in der IT-Abteilung, betreut die Fachsoftware allgemein und übernimmt Benutzer/Rechte, Einstellungen, Installation/Updates, Sicherung und technische Fehlerbehebung. Fachliche Stammdaten pflegen auch die Sachbearbeiter. | `BESTÄTIGT` | hoch | Technische Administration und fachliche Datenhoheit getrennt erheben; konkrete Stammdatenpflege bleibt offen. |
| `INT-013` / Q-STAMM-00 | Sachbearbeiter pflegen Friedhöfe/Felder, Grabarten, Gebührenarten/-sätze, allgemeine Adressen und Auswahllisten; Vorlagen/Formularzuordnungen werden administrativ verwaltet. Die IT kennt die fachlichen Friedhofsinhalte nicht. | Genannte Zuordnung `BESTÄTIGT`; sonstige Stammdaten `OFFEN` | hoch für die Zuordnung | Fachliche Datenhoheit und technische Administration trennen; Freigabe, Historisierung und weitere Stammdaten noch klären. |
| `INT-014` / Q-IF-01, Q-GEB-02 | Es gibt keine aktive Finanzdatenübergabe. EDWALT-Bescheide werden manuell im führenden Finanzverfahren eingebucht. Die zunächst abweichende Produktschreibweise wurde mit `INT-015` zu FINANZ+ präzisiert. | `BESTÄTIGT` | hoch | Medienbruch, manuelle Eingabefelder und Abstimmung erheben; vorhandene EDWALT-Schnittstellenmodule sind nicht produktiv. |
| `INT-015` / Q-IF-01a | Zahlungspflichtiger, Bescheidnummer, Betrag, Fälligkeit, Kostenstelle und weitere offene Felder werden manuell in FINANZ+ erfasst, kontrolliert und gebucht. Zahlungseingänge verbucht die Buchhaltung ohne Rückmeldung an die Friedhofsverwaltung. | `BESTÄTIGT`; vollständige Feldliste `OFFEN` | hoch | FINANZ+ ist führend für Finanzstatus; fehlender Rückkanal und Abstimmung sind für Migration und Bedarfserhebung relevant. |
| `INT-016` / Q-GEB-02b | Zahlungsstatus und Mahnungen werden in FINANZ+ geführt. | `BESTÄTIGT` | hoch | EDWALT ist keine führende Quelle für Zahlungs- oder Mahnstatus. |
| `INT-017` / Q-WIN-01 | Vorgesehen ist, EDWALT-Bescheide zu speichern und ohne Schnittstelle manuell in Winyard hochzuladen. Ob dies tatsächlich durchgängig geschieht oder lokale Datei-/Papierablagen verwendet werden, ist unbekannt. | Soll-Ablauf `BESTÄTIGT`; Ist-Praxis `OFFEN` | hoch für Soll, niedrig für Ist | DMS-Vollständigkeit nicht unterstellen; Anwenderinterview und Prozessbeobachtung erforderlich. |
| `INT-018` / Q-WIN-01b, Q-WIN-00 | Die heutige Ablage folgt einer internen Arbeitsregel; eine Dienstanweisung ist geplant. Cemaris soll künftig eine Winyard-Schnittstelle besitzen. | Ist-Regel und Integrationsziel `BESTÄTIGT`; Dienstanweisungsdetails `OFFEN` | hoch | Integration als Bedarf führen; heutige Ablagekontrolle nur als Migrations-/Umstellungshinweis, nicht als nachzubauende EDWALT-Funktion behandeln. |
| `INT-019` / Q-WIN-05 | Muss: Akte suchen/anlegen, Metadaten übertragen, Erfolg/Fehler anzeigen. Soll: fertige Dokumente automatisch ablegen, fehlgeschlagene Ablagen wiederholen. Nicht benötigt: Winyard-Dokument-ID in Cemaris speichern, Dokument aus Cemaris öffnen. | `BESTÄTIGT` | hoch | REQ-DMS-001 bis REQ-DMS-008; technische Validierung steht aus. |
| `INT-020/021`, `IMG-INT-001/002` / Q-WIN-06 bis Q-WIN-08 | Die heutige und die gewünschte künftige Ablage sind nach Vorgangsart und Jahr organisiert. Die zunächst angenommene Akte je Grabstätte ist kein Zielmodell. Die Struktur soll konfigurierbar sein; die Integration bleibt zunächst optional und wird erst später produktiv. | Zielstruktur `BESTÄTIGT`; Einführungszeitpunkt `OFFEN`; Akte je Grabstätte `VERWORFEN` | hoch | REQ-DMS-001 bis 006 gelten bei aktivierter Integration; REQ-DMS-009/010 ergänzen Konfiguration und entkoppelten Betrieb. Screenshots nicht in Git speichern. |
| `INT-022` / Q-WIN-06a | Eine unter der passenden Vorgangsart fehlende Jahresablage soll Cemaris automatisch anlegen. | `BESTÄTIGT`; technische Winyard-Objektart `OFFEN` | hoch | REQ-DMS-002 präzisiert; Benennung, Pflichtmetadaten und Konfliktverhalten technisch validieren. |
| `INT-023` / Q-WIN-06b | Vorgangsart und Jahr werden automatisch aus Fall- und Dokumentkontext bestimmt. Je nach Vorgang ist das Jahr der Bescheiderstellung oder der Beisetzung maßgeblich; eine routinemäßige manuelle Auswahl ist nicht vorgesehen. | `BESTÄTIGT`; vollständige Datumsregel je Dokumentart `OFFEN` | hoch | REQ-DMS-011; konkrete Zuordnung später fachlich validieren. |
| `INT-024` / Q-MIG-06 | Nur strukturierte EDWALT-Daten werden nach Cemaris migriert. Vorhandene Akten, Bescheide und Schreiben bleiben unverändert an ihren heutigen Ablageorten. | `BESTÄTIGT` | hoch | REQ-MIG-001; kein Dokumentimport, aber dauerhaften Altzugriff und Aufbewahrung vor Stilllegung absichern. |
| `INT-025/026` / Q-MIG-06a/06b | EDWALT bleibt während der Einführung vorübergehend lesend als Rückfallebene verfügbar, bis Cemaris zuverlässig funktioniert. Ein langfristiger Archivbetrieb oder eine kalendarische Dauer ist keine Anforderung. | Übergangsbetrieb `BESTÄTIGT`; Dauerarchivbetrieb `VERWORFEN`; konkrete Cemaris-Abnahmekriterien `OFFEN` | hoch | REQ-MIG-002; technische Nur-Lese-Absicherung erst für den Cutover validieren, ohne das Altprogramm während der Analyse auszuführen. |
| `INT-027` / Q-MIG-08 | Der strukturierte historische Krematoriumsbestand wird trotz heutiger Nichtnutzung migriert. | `BESTÄTIGT` | hoch | REQ-MIG-003; W080 erschließen, ohne daraus eine neue Krematoriumsfunktion für Cemaris abzuleiten. |
| `INT-028` / Q-MIG-05 | Stornierte, aufgehobene und durch Umnummerierung überholte Vorgänge werden nicht nach Cemaris migriert. | `BESTÄTIGT`; technische Erkennungsregel und Behandlung des gültigen Nachfolgers `OFFEN` | hoch | REQ-MIG-004; Quelle unverändert lassen und nur sicher klassifizierte Altstände ausschließen. |
| `INT-029` / Q-MIG-05a | Bei Umnummerierungen wird der gültige Nachfolger ausschließlich mit seiner aktuellen Nummer migriert; frühere Nummern werden nicht als Such- oder Historienkennung übernommen. | `BESTÄTIGT` | hoch | REQ-MIG-005; Nachfolger technisch sicher bestimmen und Ausschluss validieren. |
| `INT-030` / Q-MIG-09 | Bescheidnummer, Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug werden aus EDWALT migriert. Zahlungsstatus und Mahnungen werden nicht aus EDWALT übernommen, weil FINANZ+ dafür führend ist. | `BESTÄTIGT`; technische Quellfeldzuordnung `OFFEN` | hoch | REQ-MIG-006; Bescheid-/Gebührenhistorie vom extern führenden Zahlungs- und Mahnstatus trennen. |
| `INT-031` / Q-MVP-01 | Der erste nutzbare Cemaris-Abschnitt ist eine lesende Suche und Anzeige von Friedhofs-, Grab-, Personen- und Falldaten; schreibende Fall-, Gebühren- und Bescheidfunktionen folgen. | `BESTÄTIGT`; Detailumfang `OFFEN` | hoch | REQ-MVP-001; Suchfelder, Detailansicht, Testdatenbasis und Abnahme als nächste Startentscheidungen klären. |
| `INT-032` / Q-MVP-02 | Gemeinsame Suche mit optionalen Filtern für Name/Vorname, Geburts-/Sterbedatum, Friedhof/Feld/Grabnummer, Beisetzungsdatum, Nutzungsberechtigte/Anschriften und Bescheidnummer. | `BESTÄTIGT`; Suchsemantik `OFFEN` | hoch | REQ-MVP-002; Kombination, Unschärfe und Ergebnisreihenfolge umsetzungsnah festlegen. |
| `INT-033` / Q-MVP-03 | Die Detailansicht zeigt verbundene Grab-, Verstorbenen-, Beisetzungs-, Nutzungsrechts-, Berechtigten-/Adress- und Bescheid-/Gebührendaten; Zahlungsstatus und Mahnungen nicht. | `BESTÄTIGT`; genaue Feldliste `OFFEN` | hoch | REQ-MVP-003; Beziehungen und sensible Felder mit synthetischen Beispielen spezifizieren. |
| `INT-034` / Q-MVP-04 | Der IT-Administrator darf sämtliche fachlichen Personen- und Falldaten sehen. | `BESTÄTIGT` | hoch | REQ-BER-001; spätere Audit- und Detailrechte getrennt klären. |
| `INT-035` / Q-MVP-05 | Abnahme anhand eines kontrolliert migrierten Testbestands: bekannten Fall zuverlässig finden und alle Verknüpfungen lesend nachvollziehen. Repository und allgemeine Entwicklungstests enthalten nur synthetische Daten. | `BESTÄTIGT`; Testfallauswahl `OFFEN` | hoch | REQ-MVP-004; lokalen geschützten Migrationstest und aggregierte Abgleichswerte planen. |
| `INT-037` / Q-MIG-02 | Weitere Copybooks, FD-Dateien, Herstellerunterlagen und EDWALT-Ansprechpartner sind nicht verfügbar; der Hersteller besteht nicht mehr. | Nichtverfügbarkeit `BESTÄTIGT` | hoch | Feldsemantik aus lokalen Daten-, Programm- und Hilfeevidenzen rekonstruieren; nichts erraten. |
| `INT-038` / Q-MIG-03 | Die Bedeutung von `*alt`, `*dm`, `BUCHA`, `oliW002` und das Fehlen erwarteter Dateien wie `W008` oder `TERMIN` ist nicht bekannt. | Wissensgrenze `BESTÄTIGT`; Semantik `OFFEN` | hoch | Überlappungen, Zeitbezug und Programmzugriffe technisch analysieren; keine pauschale Regel annehmen. |

## Allgemeine Systemnutzung

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-SYS-03 | P0 | TECH-001/030, REL-320/330; hoch | Welche EXE, welcher Startpfad und welche Release-/Programmversion laufen produktiv? | maskierte Versionsanzeige, Installations-/Betriebsdokumentation |
| Q-SYS-04a | P2 | INT-008; niedrig | Zeigt die Prozessbeobachtung weitere regelmäßig oder selten ausgeführte Arbeiten, die in der groben Bereichsliste noch fehlen? | ergänzte Prozess-/Nutzungsliste |
| Q-SYS-05 | P1 | FUN-018/019/302/303; hoch | Welche Arbeitsschritte erfolgen in EDWALT und welche in Word, Finanzsystem, Kalender, Papier oder weiteren Werkzeugen? | End-to-End-Beobachtung ausgewählter Standardfälle |

## Friedhofsstruktur

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-STR-01 | P0 | FUN-014/100, DAT-010/015; hoch | Wie sind Friedhof, Bereich/Feld, Reihe, Grabnummer, Grabart und einzelne Stelle heute aufgebaut und eindeutig identifiziert? | anonymisierte Strukturbeispiele und Nummernregel |
| Q-STR-02 | P0 | FUN-109, MAN-EDW-203; hoch | Was geschieht bei Umnummerierung, Zusammenlegung, Teilung oder Aufhebung mit Referenzen, Dokumenten und Historie? | beobachteter/synthetischer Umnummerierungsfall |
| Q-STR-03 | P1 | MAN-EDW-014; hoch | Welche Kapazitäten, Flächen, Sarg-/Urnenstellen und Terminraster sind fachlich relevant und nach Grabart verschieden? | aktueller Katalog mit Gültigkeit, ohne Personendaten |
| Q-STR-04 | P1 | REP-EDW-004/006; hoch | Wie werden „frei“, „belegt“, Lage und Reservierung definiert, und kann eine Auswertung den Bestand verändern? | Prozessregel und kontrollierte Demonstration ohne Ausführung schreibender Optionen |
| Q-STR-05 | P2 | MAN-EDK-014; mittel | Existiert der im Krematoriumshandbuch genannte Pseudo-Friedhof bzw. eine vergleichbare Sonderstruktur? | Stammdatenbestätigung |

## Fachliche Stammdatenpflege

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-STAMM-00a | P1 | INT-012/013, FUN-010 bis FUN-017; mittel | Welche weiteren Stammdaten existieren, und wie werden Änderungen an fachlichen Katalogen freigegeben, wirksam gesetzt und historisiert? | ergänzte Stammdatenliste und Änderungsprozess ohne Echtdaten |

## Personen und Verstorbene

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-PER-01 | P0 | FUN-100/101/114, DAT-015/016; hoch | Welche Personenrollen werden geführt: verstorbene Person, Nutzungsberechtigte, Antragsteller, Zahler, Bestatter, weitere Empfänger? | Rollenliste mit Kardinalitäten und Zweck |
| Q-PER-02 | P0 | FUN-110/114, MAN-EDW-204/208/209, P4-W020-02–11/28–37; hoch | Warum gibt es erste, zweite und dritte Adresse, welche ist führend, und wie werden Adresswechsel historisiert? | anonymisierter Rollenwechsel/Adressänderungsablauf; keine Echtdaten in der Dokumentation |
| Q-PER-03 | P0 | FUN-102/113/406, DAT-017/018; hoch | Welche freien Hinweise und Notizen werden tatsächlich erfasst, mit welchem Zweck, Zugriff und Löschzeitpunkt? | Feld-für-Feld-Zweckprüfung ohne echte Inhalte |
| Q-PER-04 | P1 | FUN-016, DAT-013; hoch | Enthält „sonstige Adressen“ Organisationen, natürliche Personen oder beides; wie werden Dubletten erkannt? | Katalog der Adressarten und Dublettenregel |
| Q-PER-05 | P1 | FUN-101/400; hoch | Welche Identifikatoren verbinden Verstorbene, Vorgänge, Gräber, Krematorium und Personenkonto? | technische/fachliche Schlüsseldokumentation |

## Beisetzungen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-BEI-00 | P0 | INT-008/009, FUN-101/103/105; Wissenslücke bestätigt | Wie läuft ein regulärer neuer Beisetzungsfall vom Eingang bis zum fachlichen Abschluss ab, welche Schritte erfolgen in EDWALT und welche außerhalb? | Anwenderinterview und grober End-to-End-Ablauf ohne Echtdaten |
| Q-BEI-01 | P0 | FUN-101, MAN-EDW-101; hoch | Welche Vorgangs- und Beisetzungsarten werden heute verwendet und welche Pflichtfelder/Nachweise gelten jeweils? | Prozessmatrix pro Fallart |
| Q-BEI-02 | P0 | FUN-104, MAN-EDW-104; hoch | Welche Prüfungen verhindern Doppelbelegung, falsche Stelle/Tiefe oder unzulässige Grabart; wie werden Ausnahmen behandelt? | regelbasierte Demonstration mit Testfall |
| Q-BEI-03 | P1 | FUN-303/211, DAT-014; hoch | Wie werden Termin, Trauerfeier, Kapelle, Bestatter und Grabverwaltung miteinander abgestimmt? | Ablauf von Terminannahme bis Tagesliste |
| Q-BEI-04 | P1 | FUN-116, MAN-EDW-211, P4-W021-10–22; hoch | Wie unterscheiden sich Überführung, Umbettung, Einlieferung und sonstige Bewegungen; welche Rolle haben insbesondere die Datumskandidaten 5.576/L8 und 5.706/L8? | Fallarten-/Dokumentenmatrix ohne Echtdaten |
| Q-BEI-05 | abgeschlossen | INT-008/027, DAT-021, FUN-400/401; hoch | Historische strukturierte Krematoriumsdaten bleiben trotz heutiger Nichtnutzung im Migrationsumfang. | technische Erschließung; im vorliegenden nichtproduktiven Bestand enthält W080 keine aktiven Sätze |

## Nutzungsrechte

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-NR-01 | P0 | FUN-100/101, MAN-EDW-100/101; hoch | Wie entstehen Beginn und Ende eines Nutzungsrechts bei Erwerb, Verlängerung, Beisetzung und Übertragung? | fachliche Regel mit Beispieldaten synthetisch |
| Q-NR-02 | P0 | FUN-114, DAT-015; hoch | Wer darf Nutzungsberechtigte ändern, wie werden mehrere Berechtigte/Empfänger und Rechtsnachfolge dokumentiert? | Rollen-/Freigabe-/Historienprozess |
| Q-NR-03 | P1 | FUN-107, MAN-EDW-107; mittel | Wird „eingeschränktes Nutzungsrecht“ heute verwendet; in welchem Rechtskontext und mit welcher Gutschrift? | belegter aktueller oder verworfener Anwendungsfall |
| Q-NR-04 | P1 | FUN-205/212; hoch | Welche Schritte folgen bei Nutzungsende und wie werden Angebot, Verlängerung, Räumung oder Rückgabe dokumentiert? | Prozess vom Fristlauf bis Abschluss |
| Q-NR-05 | P1 | FUN-109; hoch | Bleibt bei Umnummerierung/Strukturwechsel eine unveränderliche Identität des Nutzungsrechts erhalten? | Schlüssel- und Historienregel |

## Ruhefristen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-RF-01 | P0 | FUN-014/101/212, TECH-009; hoch | Welche Ruhefristen gelten je Friedhof, Grabart, Sarg/Urne, Alter oder Fallart und ab welchem Ereignis laufen sie? | aktuelle Satzungs-/Fachregel mit Gültigkeitsdatum |
| Q-RF-02 | P0 | TECH-009 (INI-Schlüsselgruppe); hoch | Wird die Ruhefrist aus Sterbe-, Beisetzungs- oder anderem Datum berechnet, und gibt es lokale Ausnahmen? | konfigurierte Regel plus fachliche Bestätigung |
| Q-RF-03 | P1 | FUN-204/212, REP-EDW-004/012; hoch | Wie beeinflussen Vorverstorbene/Mehrfachbelegung das Ende von Ruhe- und Nutzungszeit? | anonymisiertes Mehrfachbelegungsbeispiel |
| Q-RF-04 | P1 | FUN-212; hoch | Erzeugt das Ruhefristende nur eine Liste oder auch Wiedervorlage, Brief oder Statusänderung? | beobachteter Folgeprozess |

## Gebühren

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-GEB-01 | P0 | FUN-015/103, DAT-012/022; hoch | Welche Gebührenkataloge und Satzungsstände sind aktuell, wie werden Gültigkeit, Menge, Rundung und Steuer behandelt? | freigegebene Regel-/Katalogübersicht |
| Q-GEB-03 | P0 | FUN-106/404; hoch | Was bedeuten Storno, Gutschrift, Gegenbuchung und Korrektur; welche Historie muss unveränderlich bleiben? | fachlich/finanziell abgestimmter Korrekturprozess |
| Q-GEB-04 | P1 | FUN-115/301, REL-320, P4-W020-19–26; hoch | Was bezeichnet FUG lokal, wer ist zahlungspflichtig, wie werden Zeitraum, Ausnahmen, Sammelabrechnung und Einzug berechnet? | aktuelle Regel und synthetische Fallvarianten; keine Deutung der technischen Betragsgruppen ohne Feldbeleg |
| Q-GEB-05 | P1 | FUN-015/103, MAN-EDW-015; hoch | Welche Haushaltsstellen, Kostenstellen, Kennzeichen und externen Konten sind fachlich erforderlich? | aktuelles Mapping mit Gültigkeit |
| Q-GEB-06 | P2 | DAT-011/022; mittel | Müssen DM-Altbestände aus Nachweis-/Aufbewahrungsgründen migriert oder nur archiviert werden? | Aufbewahrungsentscheidung |

## Dokumente und Bescheide

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-DOK-01 | P0 | FUN-105/300/403, TPL-001 ff.; hoch | Welche Dokumentarten werden heute erzeugt, welche sind rechtsverbindlich und welcher Menüpunkt/Formularcode löst sie aus? | Formularnummer↔Auslöser↔Zweck↔Empfänger-Matrix |
| Q-DOK-02 | P0 | TPL-030/203/204; hoch | Welche Variante von Formular 30 (DOT, DOCX, SIC) ist führend, freigegeben und seit wann gültig? | Freigabe-/Versionsnachweis |
| Q-DOK-03 | P0 | DOC-001/002, TECH-008; hoch | Welche Word-Version, Makroinstallation, globale Vorlage, Drucker/Schächte und Sicherheitsrichtlinien sind produktiv? | Betriebs-/Office-Konfiguration ohne geheime Werte |
| Q-DOK-04 | P1 | TPL-011/020/027/028/083 ff.; niedrig | Welchen Zweck haben die nicht sicher zugeordneten Vorlagen, und sind sie aktiv, historisch oder lokal? | fachliche Vorlagensichtung im geschützten Rahmen |
| Q-DOK-05 | P1 | FUN-105, MAN-EDW-105; hoch | Wann vergibt der Druck Bescheid-/Gutschriftnummer, erzeugt eine Sollstellung und erlaubt Nach-/Probedruck? | beobachteter Testablauf und Kontrollpunkte |
| Q-DOK-06 | P1 | DOC-004/005; hoch | Sind EDW_SD, LISTE.LST und STATIST.TXT flüchtige Zwischenprodukte oder aufbewahrte/weitergegebene Dateien? | Datei-Lebenszyklus und Empfänger |

## Wiedervorlagen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-WV-01 | P0 | FUN-205/207/212/222; hoch | Welche Ereignisse erzeugen heute eine Wiedervorlage: Nutzungsende, Ruhefristende, Grabzustand, Versand-/Rückmeldung, offene Zahlung? | Ereignis→Frist→Aufgabe→Abschluss-Matrix |
| Q-WV-02 | P1 | FUN-303, MAN-EDW-403; hoch | Werden Wiedervorlagen in EDWALT, Terminmodul, Kalender, Papierliste oder außerhalb verwaltet? | Prozessbeobachtung und Systemzuordnung |
| Q-WV-03 | P1 | FUN-207, REL-320/330; hoch | Wie werden Prüfung, Mitteilung, Erledigung, Wiederholung und Löschung beim Grabzustand protokolliert? | anonymisierter Zustandsfall |
| Q-WV-04 | P1 | FUN-302, REL-320; mittel | Wie entstehen Zahlungserinnerung/Mahnung, Empfängerhistorie und Fälligkeit im Personenkonto? | Kassenprozess und separates Handbuch |

## Suche und Auswertungen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-AUS-01 | P0 | FUN-108/405; hoch | Welche Suchfelder und Kombinationen werden häufig genutzt; gibt es unscharfe Suche, Sichtbarkeitsgrenzen und Protokollierung? | beobachtete Suchszenarien mit Testdaten |
| Q-AUS-02 | P0 | FUN-200–224; hoch | Welche der 17 EDW- und 6 EDK-Ausgaben werden tatsächlich genutzt, von wem, wie oft und für welchen Empfänger? | priorisierte Reportnutzungsliste |
| Q-AUS-03 | P0 | FUN-202/204/207; hoch | Welche Auswertungen verändern oder löschen Daten, und sind diese Optionen produktiv erlaubt? | sichere Demonstration ohne Ausführung, Rechte-/Verfahrensnachweis |
| Q-AUS-04 | P1 | FUN-216, DAT-007, DOC-005; hoch | Wie sind Statistikkennzahlen, Zeitraum, Stichtag und Weiterverarbeitung definiert; gilt `STAT.DAT` oder `STATIST.DAT`? | Kennzahlendefinition und aktueller Exportweg |
| Q-AUS-05 | P1 | FUN-210/211; hoch | Sind Beerdigungsbuch/Tagesliste amtliche Register, interne Arbeitslisten oder öffentliche Aushänge? | Zweck-/Aufbewahrungs-/Veröffentlichungsregel |

## Benutzer und Berechtigungen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-BER-01 | P0 | FUN-001/013, DAT-008/009; hoch | Welche Konten sind aktiv; wie werden Anlage, Änderung, Sperre, Austritt, Vertretung und Kennwortwechsel behandelt? | Kontenprozess ohne Offenlegung von Kennwörtern |
| Q-BER-02 | P0 | MAN-EDW-013; hoch | Welche Alt-Rechte für Löschen, Storno, Kasse, Druck, Formulare, Stammdaten und Sonderprogramme sind tatsächlich vergeben und erforderlich? | Rollen-/Rechtematrix mit fachlicher Freigabe |
| Q-BER-03 | P0 | FUN-106/111/202; hoch | Welche besonders riskanten Aktionen brauchen Protokoll, Begründung oder Vier-Augen-Prinzip? | Kontroll- und Auditvorgaben |
| Q-BER-04 | P1 | MAN-EDK-013; hoch | Ist das Krematoriumsrecht separat vergeben und sind Krematoriumsdaten gegen allgemeine Nutzer abgegrenzt? | Berechtigungsbeobachtung |

## Schnittstellen

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-IF-01b | P1 | INT-014/015, FUN-103/302/500; mittel | Welche weiteren, mit „usw.“ noch nicht benannten Felder werden manuell übertragen, wer führt die Kontrolle aus und wie werden Erfassungsfehler korrigiert? | vollständige Feld- und Kontrollliste ohne Personen-, Konto- oder Echtdaten |
| Q-IF-02 | P0 | FUN-500/302; hoch | Welche Datenfelder, Dateiformate, Intervalle, Quittungen, Fehlerlisten, Wiederholungen und Abstimmungen gelten? | Datenfluss- und Fehlerprozess |
| Q-IF-03 | P1 | FUN-501; mittel | Wird/wurde DTAUS genutzt, und welches aktuelle Zahlungs-/Lastschriftverfahren hat es ersetzt? | Historie und aktueller Prozess |
| Q-IF-04 | P1 | FUN-502, TECH-007/021; mittel | Gibt es eine aktive ODBC-/SQL-Verbindung oder ist die Runtime nur mitgeliefert? | maskierte DSN-/Systembestätigung, Richtung und Zweck |
| Q-IF-05 | P1 | FUN-503, REL-320; mittel | Wurde ArcView/GIS genutzt und existieren außerhalb der Verzeichnisse Lage-/Exportbestände? | GIS-Prozess und Datenverantwortung |
| Q-IF-06 | P2 | TECH-011; hoch | Sind Btrieve, Java, CGI/ISAPI oder alte CCI-Protokolle aktiv oder nur Bestandteil des Hersteller-Deployments? | Installations-/Netzkonfiguration |

## Winyard

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-WIN-01a | P0 | INT-017, FUN-504, TECH-009/016; niedrig für Ist-Praxis | Werden EDWALT-Dokumente tatsächlich vollständig in Winyard abgelegt, oder existieren nur lokale Dateien beziehungsweise Papierakten? | beobachteter Weg von Dokumenterzeugung bis Akte, ohne Echtdokumente zu kopieren |
| Q-WIN-06c | P1 | INT-023; mittel | Soll eine Sachbearbeitung eine automatisch bestimmte Winyard-Ablage in Ausnahmefällen ändern dürfen, oder darf eine Abweichung nur durch Korrektur des Falls beziehungsweise der Konfiguration erfolgen? | bestätigte Ausnahme- und Berechtigungsregel |
| Q-WIN-02 | P0 | FUN-105/300/403/504; hoch | Welche Metadaten/Aktenzeichen werden bei der Ablage benötigt, und welches System vergibt die führende Dokument-/Akten-ID? | Metadaten- und Verantwortlichkeitsliste |
| Q-WIN-03 | P1 | Cemaris `docs/architecture/winyard-integration.md`; hoch | Welche Dokumente werden nicht abgelegt, welche ersetzt/storniert, und wie wird die erfolgreiche Ablage kontrolliert? | DMS-Fachprozess; keine Implementationsentscheidung |
| Q-WIN-04 | P1 | kein E-Mail-/DMS-Ablauf belegt; mittel | Erfolgen Versand, E-Mail, Scan und Postausgang innerhalb oder außerhalb von Winyard/EDWALT? | End-to-End-Dokumentprozess |

## Datenmigration

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-MIG-00b | P0 | INT-003/005/006/007; hoch | Welche weiteren fachlichen Datenkategorien außer Notizen sind für den späteren Betrieb entbehrlich oder sollen ausdrücklich nicht übernommen werden? | Ausschlussentscheidung erst nach Abgleich mit tatsächlicher Funktionsnutzung, Aufbewahrung und externen Führungssystemen |
| Q-MIG-01 | P0 | DAT-Inventar; hoch | Gibt es Copybooks, Dateibeschreibungen, Herstellerexporte oder einen garantiert lesenden Export für die 24 DAT/IDX-Paare? | autorisierte technische Dokumentation/Exportmethode |
| Q-MIG-02 | P0 | DAT-001/015–020; hoch | Welche Schlüssel verbinden Grab, Vorgang, Verstorbene, Adresse, Personenkonto, Buchung und Dokument? | Schlüssel-/Beziehungsbeschreibung |
| Q-MIG-03 | P0 | DAT-002/003/011/020/022/024; Phase-2-Variantenprofile; hoch | Welche Alt-/DM-/Alternativbestände gehören zum vollständigen Bestand, sind Dubletten oder nur Archiv? | fachliche Abgrenzungs-/Aufbewahrungsentscheidung; W005/W006-Variantenanalyse für die spätere Mapping-/Importphase vorbereitet, derzeit pausiert |
| Q-MIG-04 | P0 | TECH-005, DAT-Indexrisiken; hoch | Wie wird ein konsistenter, unveränderlicher Exportstand bei Mehrbenutzerbetrieb und Fileshare erzeugt? | abgestimmtes Sicherungs-/Stillstandsverfahren |
| Q-MIG-07 | P1 | Zeichensatz/Altformatbefund; Phase 4 mit W021 5.556/L8, 5.576/L8 und 5.706/L8; hoch | Welche Zeichensätze, Datums-/Währungsformate, ungültigen Werte und lokalen Kürzel sind bekannt? | Datenqualitätsprofil aus autorisiertem Export; fachliche Bestätigung der drei Datumskandidaten |

## Datenschutz

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-DS-01 | P0 | DAT-015–021, DOC-004/005; hoch | Welche Datenkategorien und Zwecke gelten je Bestand/Funktion, insbesondere für Verstorbene, Angehörige, Zahler, Bankdaten und Freitext? | Verarbeitungstätigkeit/Zweckmatrix |
| Q-DS-02 | P0 | FUN-108/405, Reports; hoch | Wer darf nach Personen suchen, Detailreports drucken/exportieren oder Krematoriumsdaten sehen; wird Zugriff protokolliert? | Berechtigungs-/Auditvorgaben |
| Q-DS-03 | P0 | FUN-211, REP-EDW-011; hoch | Welche Personendaten dürfen auf Tageslisten/Aushängen oder gegenüber Dritten erscheinen? | Veröffentlichungs-/Auskunftsregel |
| Q-DS-04 | P1 | FUN-113/406; hoch | Wie werden unzulässige oder besonders sensible Freitexte verhindert, berichtigt und gelöscht? | Freitext-/Qualitätsrichtlinie |
| Q-DS-05 | P1 | TECH-029; hoch | Enthalten Logs, `rebuild.err`, Steuerdateien oder temporäre Word-Dateien personenbezogene Satzfragmente, und wie werden sie geschützt? | geschützte Log-/Dateilebenszyklusprüfung |

## Aufbewahrung

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-AFB-01 | P0 | DAT-002/003/020/022; hoch | Welche gesetzlichen/satzungsbezogenen Aufbewahrungsfristen gelten für Grab-, Beisetzungs-, Nutzungsrechts-, Gebühren-, Buchungs- und Krematoriumsdaten? | abgestimmter Aufbewahrungsplan |
| Q-AFB-02 | P0 | FUN-106/111/202, REL-320; hoch | Was darf physisch gelöscht werden, was nur storniert/gesperrt, und welche Nachweise müssen erhalten bleiben? | Lösch-/Sperr-/Korrekturkonzept |
| Q-AFB-03 | P1 | TPL-201/202/203; hoch | Müssen historische Vorlagen wegen Nachvollziehbarkeit alter Bescheide aufbewahrt werden; welche Version galt wann? | Vorlagenaufbewahrungs-/Versionsregel |
| Q-AFB-04 | P1 | REP-EDW-010, FUN-210; hoch | Welche Register-/Buchausgaben sind dauerhaft, befristet oder nur Arbeitspapiere? | Register- und Aktenplan |
| Q-AFB-05 | P1 | DOC-004/005, DAT-004; hoch | Wie lange werden Druckaufträge, Steuer-/Zwischendateien, Listen und Logs aufbewahrt? | technischer Löschplan |

## Betrieb

| ID | Prio | Evidenz; Konfidenz | Frage | Erwarteter Nachweis |
|---|---|---|---|---|
| Q-OPS-01 | P0 | TECH-002–006; hoch | Auf welchen Betriebssystemen, Servern und Arbeitsplätzen laufen 32-Bit-Runtime, Fileshare und CCI; welche Komponenten sind tatsächlich aktiv? | aktuelle, maskierte Betriebsarchitektur |
| Q-OPS-02 | P0 | FUN-601, TECH-005/027; hoch | Wie werden Sicherung, Konsistenz, Restore-Test, Reorganisation und Störungsbehebung durchgeführt, wer autorisiert sie? | Betriebs-/Notfallverfahren und letzter Restore-Nachweis |
| Q-OPS-03 | P0 | TECH-027/029; hoch | Wann wurden Rebuild/Reorg zuletzt eingesetzt, warum, auf welcher Sicherung und mit welchem Ergebnis? | Betriebsprotokoll im geschützten Rahmen |
| Q-OPS-04 | P1 | TECH-008/016, DOC-001/002; hoch | Welche Drucker, Treiber, Schächte, Office-Komponenten und Netzlaufwerke sind Single Points of Failure? | Abhängigkeits-/Ausfallliste |
| Q-OPS-05 | P1 | TECH-009/010; hoch | Wo werden INI-/Auswahl-/Pfaddateien gepflegt, verteilt, gesichert und gegen unautorisierte Änderung geschützt? | Konfigurationsmanagementprozess |
| Q-OPS-06 | P1 | TECH-029; hoch | Wie werden Logs ausgewertet, vor Personen-/Pfaddaten geschützt und gelöscht? | Logging-/Zugriffskonzept |
| Q-OPS-07 | P2 | TECH-026/028; mittel | Welche Setup- und Konvertierungswerkzeuge sind historisch, kundenspezifisch oder für Wiederanlauf erforderlich? | freigegebene Komponentenklassifikation |

## Priorisierte Beobachtungsszenarien

1. **P0 – Menü und Rechte:** Anmeldung mit einem Test-/Schulungskonto,
   sichtbare Menüs und verbotene Aktionen dokumentieren; Evidenz FUN-001/002/013.
2. **P0 – Standardbeisetzung:** synthetischen oder vollständig maskierten Fall
   von Termin/Grab/Vorgang über Gebühr und Dokument bis Finanzübergabe/Ablage
   verfolgen; Evidenz FUN-100–106/303/500/504.
3. **P0 – Fristfall:** Nutzungs-/Ruhefristende bis Wiedervorlage, Brief und
   Abschluss beobachten; Evidenz FUN-205/212.
4. **P0 – Korrektur:** Storno/Gutschrift nur demonstrieren lassen, nicht in
   Produktivdaten auslösen; Historie und Finanzabgleich erklären; Evidenz
   FUN-106/302/500.
5. **P1 – Bericht:** je einen tatsächlich genutzten Detailreport, eine
   Fristenliste und eine Statistik mit Auswahl, Empfänger und Folgeprozess
   beobachten; Evidenz FUN-200–216.
6. **P1 – Dokumentweg:** Word-/Editorausgabe bis Druck, Versand und Winyard-
   oder Papierablage verfolgen; Evidenz FUN-019/105/504 und Q-WIN-01.
7. **P2 – optionale Module:** Krematorium, FUG, DTAUS, GIS und Terminvariante
   nur dann vertiefen, wenn die Systemnutzung sie bestätigt.
