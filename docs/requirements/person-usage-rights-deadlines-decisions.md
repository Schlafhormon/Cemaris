# Produktentscheidungen zu Personen, Nutzungsrechten, Fristen und Wiedervorlagen

Stand: 21.08.2026

## Zweck und Entscheidungsstatus

Dieses Dokument schließt das fachliche Gate von Inkrement 5a und grenzt den
ersten implementierbaren Durchstich 5b verbindlich ab. Es ist keine
Rechtsberatung und keine fachliche, datenschutzrechtliche, betriebliche oder
produktive Freigabe.

Das nachgelagerte
[5c-Abnahme- und Lebenszyklus-Entscheidungsgate](../implementation/cemaris-increment-5c-completion.md)
hat den 5b-Kern am 18.08.2026 manuell mit synthetischen Daten bestätigt und
die weiterhin offenen Lebenszyklusfragen quellengebunden eingeordnet. Die
5c-Ergänzung ändert keine 5b-Fachregel und erteilt keine der weiterhin
fehlenden Freigaben.

Das rein dokumentarische
[5f-Entscheidungs- und Freigabegate](../implementation/cemaris-increment-5f-completion.md)
hat am 21.08.2026 Variante A „keine Implementierung“ gewählt. Die
Open-Source-Nachnutzung für alle Kommunen und Doberlug-Kirchhain als erster
kommunaler Kontext wurden durch einen Administrator mit Entwicklungsauftrag
mitgeteilt. Diese technische Funktion hat keine neue Lebenszyklusregel und
keine Fach-, Rechts-, Datenschutz-, Sicherheits- oder Betriebsfreigabe
erteilt.

Für Aussagen gelten ausschließlich diese Kennzeichnungen:

- `BESTÄTIGTE Produktentscheidung`: ausdrücklich durch die
  Projektverantwortung am 14.08.2026 entschieden;
- `SATZUNGSEVIDENZ`: Aussage einer lokalen Doberlug-Kirchhainer Satzung, kein
  allgemeiner Cemaris-Standard;
- `ALTVERFAHRENS-EVIDENZ`: dokumentierte Beobachtung des bisherigen
  Verfahrens, keine Sollvorgabe;
- `ANNAHME`: für 5b nicht verbindliche Arbeitshypothese;
- `OFFEN`: vor einem späteren Inkrement noch zu entscheiden;
- `WIDERSPRUCH`: unterschiedliche Quellen oder Auslegungen sind ungeklärt;
- `VERWORFEN`: ausdrücklich nicht gewählte Lösung.

Die vorhandenen lesenden Typen und Tabellen `EntitledPerson`, `Address` und
`UsageRight` bleiben vorläufige MVP-Projektionen. Aus ihnen folgt keine
fachliche Freigabe für Identität, Kardinalität, Historisierung oder Prozess.

## Quellen und Geltungsbereich

Die Projektverantwortung hat am 14.08.2026 bestätigt, dass die beiden lokal
vorliegenden Lesefassungen von 2023 die aktuelle Fassung für den in § 1 der
Friedhofssatzung bezeichneten kommunalen Geltungsbereich darstellen. Diese
Bestätigung ersetzt weder eine Rechtsprüfung noch die spätere fachliche
Abnahme durch die Friedhofsverwaltung.

Geprüfte lokale Quellen:

- `2023_Lesefassung Friedhofsatzung der Stadt Doberlug-Kirchhain.pdf`,
  16 PDF-Seiten, Beschluss vom 07.06.2023 und Ausfertigung vom 08.06.2023;
- `2023_Lesefassung Friedhofsgebührensatzung.pdf`, 3 PDF-Seiten.

Beide PDF-Dateien wurden vollständig textlich und visuell geprüft. Die
kommunalen Werte werden nicht als Open-Source-Defaults verwendet.

## Evidenzmatrix

| ID | Einstufung | Aussage | Fundstelle beziehungsweise Begründung | Wirkung |
| --- | --- | --- | --- | --- |
| E-01 | SATZUNGSEVIDENZ | Die Friedhofssatzung gilt für die in § 1 aufgezählten neun kommunalen Friedhöfe beziehungsweise Friedhofsteile. | Friedhofssatzung § 1, PDF-Seite 3 | lokaler Geltungsbereich, kein Mandantenmodell |
| E-02 | SATZUNGSEVIDENZ | Mit der Schließung sind neue oder erneut verliehene Nutzungsrechte ausgeschlossen; die Entwidmung setzt den Ablauf von Nutzungsrechten und Ruhezeiten voraus. | Friedhofssatzung § 3, PDF-Seite 4 | spätere Zustands- und Sperrlogik bleibt erforderlich |
| E-03 | SATZUNGSEVIDENZ | Für eine Beisetzung in einer bereits erworbenen Wahlgrabstätte ist das Nutzungsrecht nachzuweisen. | Friedhofssatzung § 7, PDF-Seite 6 | Quellen-/Referenznachweis ist fachlich relevant |
| E-04 | SATZUNGSEVIDENZ | Die lokale Ruhezeit beträgt 20 Jahre für Erdbestattungen und 15 Jahre für Aschen. | Friedhofssatzung § 10, PDF-Seite 7 | keine Umsetzung und kein allgemeiner Default in 5b |
| E-05 | SATZUNGSEVIDENZ | Eine Umbettung unterbricht oder hemmt Ruhe- und Nutzungszeit nicht. | Friedhofssatzung § 11 Abs. 6, PDF-Seite 7 | Umbettung und Fristwirkung bleiben außerhalb 5b |
| E-06 | SATZUNGSEVIDENZ | Gräber bleiben Eigentum des Friedhofsträgers; § 12 nennt sieben Grabarten mit lokalen Nutzungsdauern von 15, 20 oder 30 Jahren. | Friedhofssatzung § 12 Abs. 1 bis 3, PDF-Seite 8 | keine Eigentumsabbildung und keine fest verdrahteten Laufzeiten |
| E-07 | SATZUNGSEVIDENZ | Das lokale Nutzungsrecht entsteht mit der Übergabe der Nutzungsurkunde; drei Monate vor Ablauf ist auf das Ende hinzuweisen. | Friedhofssatzung § 12 Abs. 4 Buchst. a und b, PDF-Seite 8 | Startbezug lokal bestätigt; automatische Erinnerung bleibt offen |
| E-08 | SATZUNGSEVIDENZ | Tod, Rechtsnachfolge, Zustimmung, Übertragung und Umschreibung des Nutzungsrechts sind lokal geregelt. | Friedhofssatzung § 12 Abs. 4 Buchst. c bis e, PDF-Seiten 8–9 | 5b bildet nur eine manuelle Übertragung mit Historie ab |
| E-09 | SATZUNGSEVIDENZ | Reihengrabstätten werden im Todesfall für die Ruhezeit vergeben. | Friedhofssatzung § 13, PDF-Seite 9 | Fristberechnung und ereignisabhängige Rechtearten bleiben offen |
| E-10 | SATZUNGSEVIDENZ | Wahlgrabrechte werden auf Antrag grundsätzlich für 30 Jahre verliehen; eine weitere Beisetzung setzt eine Deckung der verbleibenden Ruhezeit voraus, weitere Erwerbszeiträume sind bis 30 Jahre möglich. | Friedhofssatzung § 14, PDF-Seiten 9–10 | Verlängerung wird in 5b nur manuell dokumentiert |
| E-11 | SATZUNGSEVIDENZ | Urnengrabarten besitzen lokal Nutzungszeiten von 15 oder 30 Jahren. | Friedhofssatzung § 15, PDF-Seite 10 | kein allgemeiner Produktwert |
| E-12 | SATZUNGSEVIDENZ | Nach Ablauf von Ruhe- oder Nutzungszeit bestehen Bekanntgabe- und Abräumungsregeln. | Friedhofssatzung § 21, PDF-Seite 12 | kein Statuswechsel oder Folgeprozess in 5b |
| E-13 | SATZUNGSEVIDENZ | Bei vernachlässigten Grabstätten gelten Benachrichtigungs-, Bekanntmachungs- und Entzugsregeln. | Friedhofssatzung § 23, PDF-Seite 13 | Entzug bleibt außerhalb 5b |
| E-14 | SATZUNGSEVIDENZ | Alte Rechte richten sich teilweise nach früheren Vorschriften; bestimmte unbefristete oder unbestimmte Rechte werden auf 30 Jahre nach Inkrafttreten begrenzt. | Friedhofssatzung § 26, PDF-Seite 14 | Altfallberechnung bleibt offen; nullable Altprojektionen bleiben lesbar |
| E-15 | SATZUNGSEVIDENZ | Gebührenschuldner kann die antragstellende oder eine andere interessierte beziehungsweise beauftragende Person sein. | Gebührensatzung § 2, PDF-Seite 1 | Rechnungsempfänger und Rechteinhaber sind nicht gleichzusetzen |
| E-16 | SATZUNGSEVIDENZ | Die Gebühr entsteht mit Inanspruchnahme der Leistung und wird einen Monat nach Bekanntgabe fällig. | Gebührensatzung § 3, PDF-Seite 1 | Gebühren und Fälligkeit sind kein Teil von 5b |
| E-17 | SATZUNGSEVIDENZ | Bei vorzeitiger Rückgabe nach abgelaufener Ruhezeit erfolgt keine anteilige Gebührenerstattung. | Gebührensatzung § 4, PDF-Seite 1 | Rückgabe und Erstattung bleiben außerhalb 5b |
| E-18 | WIDERSPRUCH | Die Gebührentabelle beschreibt eine Verlängerung „nach Ablauf der Nutzungszeit“, während § 14 der Friedhofssatzung eine Verlängerung vor einer weiteren Beisetzung verlangen kann. | Gebührensatzung Anlage A, PDF-Seite 2; Friedhofssatzung § 14, PDF-Seiten 9–10 | vor Gebühren- oder Fristautomatik fachlich auszulegen |
| E-19 | ALTVERFAHRENS-EVIDENZ | Repository-Dokumente nennen Personen-, Berechtigten-, Nutzungsrechts-, Frist- und Wiedervorlageinformationen des Altverfahrens. | `docs/requirements/edwalt-analysis/evidence-matrix.md` und `interview-record.md` | nur Hinweise für spätere Interviews, kein Sollmodell |
| E-20 | VERWORFEN | Die bestehenden nullable, fallgebundenen Lesetabellen werden zum schreibenden Fachmodell erklärt. | Entscheidung 5a | neuer kanonischer Kern neben der Altprojektion |
| E-21 | VERWORFEN | Lokale Jahreswerte werden als allgemeine Cemaris-Defaults fest verdrahtet. | Entscheidung 5a | Konfiguration statt kommunaler Defaults |
| E-22 | VERWORFEN | 5b berechnet Fristen oder erzeugt automatische Wiedervorlagen. | Entscheidung 5a | ausschließlich manueller Kern |

## Verbindliche Produktanforderungen

### Kanonische Beteiligte

| ID | Status | Anforderung |
| --- | --- | --- |
| REQ-PER-001 | BESTÄTIGTE Produktentscheidung | Eine beteiligte Person oder Organisation besitzt eine fallübergreifend stabile, unveränderliche Identität. Ein Fallbezug ist eine Projektion und nicht die Identität. |
| REQ-PER-002 | BESTÄTIGTE Produktentscheidung | Die Arten `Natürliche Person` und `Organisation` sind zulässig. Beide Arten dürfen Nutzungsrechtsinhaber sein. |
| REQ-PER-003 | BESTÄTIGTE Produktentscheidung | Für natürliche Personen sind Vor- und Nachname Pflicht. Für Organisationen ist der Organisationsname Pflicht. Nicht zur Art passende Namensfelder bleiben leer. |
| REQ-PER-004 | BESTÄTIGTE Produktentscheidung | 5b erfasst ausschließlich Namen und postalische Anschriften. Telefon, E-Mail, Geburtsdaten, Bank- und weitere Kontaktdaten sind Nicht-Ziele. |
| REQ-PER-005 | BESTÄTIGTE Produktentscheidung | Eine beteiligte Identität kann mehrere Anschriften mit Gültig-ab und optionalem Gültig-bis besitzen. Höchstens eine gegenwärtig gültige Anschrift darf als aktuelle Hauptanschrift markiert sein; eine Hauptanschrift ist nicht zwingend. |
| REQ-PER-006 | BESTÄTIGTE Produktentscheidung | Anschriften werden historisiert und nicht überschrieben. Zeiträume derselben Identität dürfen sich überlappen, solange dadurch nicht mehr als eine aktuelle Hauptanschrift entsteht. |
| REQ-PER-007 | BESTÄTIGTE Produktentscheidung | Bei normalisiert übereinstimmendem Namen und übereinstimmender Anschrift warnt Cemaris vor einer möglichen Dublette. Anlage bleibt nach ausdrücklicher Bestätigung zulässig. Automatisches Zusammenführen und ein Merge-Prozess sind Nicht-Ziele von 5b. |
| REQ-PER-008 | BESTÄTIGTE Produktentscheidung | Namens- und Anschriftenkorrekturen benötigen eine Begründung, erzeugen eine unveränderliche Fachhistorie und überschreiben keine frühere Revision. Physisches Löschen ist nicht zulässig. |

### Rolle und Nutzungsrecht

| ID | Status | Anforderung |
| --- | --- | --- |
| REQ-ROLE-001 | BESTÄTIGTE Produktentscheidung | Die einzige in 5b wirksame fachliche Personenrolle ist `Nutzungsrechtsinhaber`. Antragstellende, Rechnungsempfänger, Ansprechpartner, weitere Berechtigte und Rechtsnachfolger als eigene Rollen bleiben offen. |
| REQ-ROLE-002 | BESTÄTIGTE Produktentscheidung | Jedes in 5b angelegte Nutzungsrecht besitzt genau einen aktuellen Inhaber. Dieselbe beteiligte Identität darf Inhaber mehrerer Nutzungsrechte sein. |
| REQ-UR-001 | BESTÄTIGTE Produktentscheidung | Ein Nutzungsrecht besitzt eine stabile, unveränderliche Identität und genau einen kanonischen Grabstellenbezug. |
| REQ-UR-002 | BESTÄTIGTE Produktentscheidung | Je Grabstelle darf höchstens ein gegenwärtig offenes kanonisches Nutzungsrecht bestehen. Nullable Altdaten werden dadurch nicht nachträglich als offen interpretiert. |
| REQ-UR-003 | BESTÄTIGTE Produktentscheidung | Eine Neuanlage benötigt manuellen Beginn, manuelles Ende, Quellen-/Referenzangabe, die verwendete Startbezugs-Konfiguration und genau einen Inhaber. Das Ende muss nach dem Beginn liegen. |
| REQ-UR-004 | BESTÄTIGTE Produktentscheidung | 5b leitet weder Beginn noch Ende aus Satzungswerten, Grabart, Beisetzung oder Status ab und berechnet keinen fachlichen Zustand. |
| REQ-UR-005 | BESTÄTIGTE Produktentscheidung | Eine Übertragung behält die Nutzungsrechtsidentität, beendet den bisherigen Inhaberzeitraum und beginnt zum selben Wirksamkeitsdatum genau einen neuen Inhaberzeitraum. Wirksamkeitsdatum und Begründung sind Pflicht. |
| REQ-UR-006 | BESTÄTIGTE Produktentscheidung | Eine Verlängerung behält die Nutzungsrechtsidentität und benötigt ein manuell eingegebenes, späteres Enddatum sowie eine Begründung. Es gibt keine automatische Laufzeit oder Gebühr. |
| REQ-UR-007 | BESTÄTIGTE Produktentscheidung | Eine Faktenkorrektur behält die Nutzungsrechtsidentität, benötigt eine Begründung und erzeugt eine neue unveränderliche Revision. Ein Inhaberwechsel erfolgt ausschließlich über die Übertragungsoperation. |
| REQ-UR-008 | BESTÄTIGTE Produktentscheidung | Nach einem später fachlich festgestellten endgültigen Ende ist eine erneute Verleihung ein neues Nutzungsrecht mit neuer Identität. Die Operation zum endgültigen Ende selbst ist nicht Teil von 5b. |
| REQ-UR-009 | BESTÄTIGTE Produktentscheidung | Inhaberzeiträume verwenden widerspruchsfreie halb offene Intervalle: Beginn einschließlich, Ende ausschließlich. Beim Transfer ist das Wirksamkeitsdatum zugleich Ende-exklusiv des alten und Beginn des neuen Zeitraums. |

### Konfigurierbarer Startbezug

| ID | Status | Anforderung |
| --- | --- | --- |
| REQ-CFG-001 | BESTÄTIGTE Produktentscheidung | Für den bestätigten lokalen Satzungsstand lautet der Startbezug `Übergabe der Nutzungsurkunde`. Er ist kommunale Konfiguration und kein allgemeiner Cemaris-Default. |
| REQ-CFG-002 | BESTÄTIGTE Produktentscheidung | Der Startbezug wird administrativ in der Programmkonfiguration gepflegt. 5b darf ihn nicht im Produktivcode oder in allgemeinen Seeds fest verdrahten. Die technische Granularität je kanonischem Friedhof ist die in ADR-0016 gewählte Architektur. |
| REQ-CFG-003 | BESTÄTIGTE Produktentscheidung | Eine Startbezugs-Konfiguration besitzt stabile Identität, fachlichen Code und Anzeige, Versionsschutz sowie Änderungsverlauf. Pro Friedhof gibt es höchstens eine aktuell auswählbare Konfiguration. |
| REQ-CFG-004 | BESTÄTIGTE Produktentscheidung | Bei Anlage eines Nutzungsrechts werden Identität, Code und Anzeige der verwendeten Konfiguration in dessen Fachrevision fixiert. Eine spätere Konfigurationsänderung verändert bestehende Rechte nicht. |
| REQ-CFG-005 | BESTÄTIGTE Produktentscheidung | Die Konfiguration bezeichnet den manuellen Startnachweis. Sie berechnet kein Datum, keinen Status und keine Frist. Für Doberlug-Kirchhain ist die bestätigte Bezeichnung betrieblich einzurichten, nicht als allgemeines Repository-Seed. |

### Nebenläufigkeit, Audit und Zugriff

| ID | Status | Anforderung |
| --- | --- | --- |
| REQ-SAFE-001 | BESTÄTIGTE Produktentscheidung | Beteiligte, Nutzungsrechte und Startbezugs-Konfigurationen besitzen jeweils eine starke Version. Änderungen benötigen die zuletzt gelesene Version; konkurrierende Änderungen wirken nicht teilweise. |
| REQ-SAFE-002 | BESTÄTIGTE Produktentscheidung | Fachmutation, neue Version, Fachhistorie und sparsamer Auditdatensatz sind atomar. Ein Fehler rollt sämtliche Teilwirkungen zurück. |
| REQ-SAFE-003 | BESTÄTIGTE Produktentscheidung | `Sachbearbeitung` und `Administration` dürfen die fachlichen 5b-Operationen ausführen. Nur `Administration` darf Startbezugs-Konfigurationen ändern. Beide Rollen dürfen die für die Bearbeitung nötigen 5b-Daten lesen. |
| REQ-SAFE-004 | BESTÄTIGTE Produktentscheidung | Der sparsame Auditdatensatz enthält Akteur, UTC-Zeitpunkt, Operation, Entitätsart/-ID und Ergebnisversion, aber keine Namen, Anschriften, Referenztexte oder Begründungen. Fachlich notwendige Inhalte liegen ausschließlich in der geschützten Fachhistorie. |
| REQ-SAFE-005 | BESTÄTIGTE Produktentscheidung | 5b implementiert weder physisches Löschen noch Anonymisierung, Aufbewahrungsautomatik oder eine Auditoberfläche. |

## Abnahmeregeln für 5b

1. Eine natürliche Person oder Organisation kann mit historisierter
   Postanschrift angelegt und mit ETag korrigiert werden.
2. Eine mögliche Dublette ergibt eine strukturierte Warnung; erst eine zweite,
   ausdrückliche Bestätigung legt die Identität an.
3. Ein Nutzungsrecht kann mit manuell eingegebenen Daten, genau einer
   Grabstelle, einem Inhaber und der aktuellen Startbezugs-Konfiguration
   atomar angelegt werden.
4. Ein zweites offenes Recht derselben Grabstelle scheitert auch bei
   Parallelzugriff ohne Teilwirkung.
5. Übertragung, Verlängerung und Faktenkorrektur erhalten Identität und
   Historie; veraltete Versionen ergeben einen Konflikt ohne Teilwirkung.
6. Eine geänderte Startbezugs-Konfiguration wirkt nur auf neue Anlagen;
   bestehende Revisionen behalten den verwendeten Snapshot.
7. Bestehende nullable Altprojektionen bleiben lesbar und werden weder
   zurückgerechnet noch mit erfundener Historie angereichert.

## Vollständig synthetische Beispiele

### Beispiel A: manueller Normalfall

Friedhof `SYN-FH-01` besitzt die administrative Startkonfiguration
`SYN-URKUNDE` mit der Anzeige `Synthetische Urkundenübergabe`. Eine natürliche
Person mit rein erfundener Anschrift wird angelegt. Für Grabstelle
`SYN-GRAB-101` erfasst die Sachbearbeitung manuell Beginn `01.09.2026`, Ende
`01.09.2056` und Referenz `SYN-REF-1001`. Cemaris speichert keine aus der
Differenz abgeleitete Laufzeitregel.

### Beispiel B: Übertragung und Adresshistorie

Das synthetische Recht `SYN-R-2001` läuft manuell vom `01.04.2020` bis
`01.04.2050`. Zum `15.11.2026` wird es mit Begründung von Organisation
`SYN-O-01` auf Person `SYN-P-02` übertragen. Der alte Inhaberzeitraum endet
exklusiv am `15.11.2026`, der neue beginnt an diesem Datum. Eine frühere
Anschrift von `SYN-P-02` bleibt mit beendetem Zeitraum erhalten. Das Recht
behält seine Identität.

### Beispiel C: Konfigurations- und Altfallgrenze

Ein vorhandener nullable Alt-Lesedatensatz enthält nur ein Enddatum und keine
verlässliche Quelle. Er bleibt unverändert lesbar und wird nicht automatisch
migriert. Die Administration ändert anschließend die synthetische
Startanzeige von `SYN-ALT` auf `SYN-NEU`. Ein danach manuell neu angelegtes
Recht fixiert `SYN-NEU`; ein zuvor angelegtes kanonisches Recht zeigt weiter
seinen historischen Snapshot `SYN-ALT`.

### Beispiel D: Nebenläufigkeit

Zwei synthetische Sitzungen lesen dieselbe Rechtversion. Sitzung A verlängert
das Ende erfolgreich. Sitzung B versucht mit der alten Version eine
Übertragung und erhält einen Konflikt. Weder Inhaberhistorie noch Audit werden
für den gescheiterten Versuch teilweise geschrieben.

## Außerhalb von 5b offen

- Rollen für Antragstellende, Rechnungsempfänger, Ansprechpartner, weitere
  Berechtigte und Rechtsnachfolger sowie ihre Kardinalitäten;
- endgültiges Ende, Verzicht, Entzug, Schließung, Entwidmung, Wiedervergabe
  und Statusautomatismen;
- Nutzungsrechtsarten und alle Ruhe-, Nutzungs-, Aufbewahrungs- und
  Regelstandsberechnungen einschließlich Altfall- und Umbettungswirkung;
- automatische oder manuelle Wiedervorlagen, Fälligkeit, Zuweisung,
  Erledigung, Wiederöffnung und Folgeaktionen;
- Auslegung des Widerspruchs E-18;
- Gebühren, Bescheide, Formulare, Dokumente, Versand und Kalender;
- Merge von Beteiligten, Telefonnummern, E-Mail-Adressen und weitere
  personenbezogene Daten;
- Löschung, Sperrung, Anonymisierung, Aufbewahrungsfristen und besondere
  Leseprotokollierung;
- fachliche, rechtliche, datenschutzrechtliche, betriebliche und produktive
  Freigabe.

## Ergänzende 5c-Entscheidungsmatrix

Die ausführliche Antwort mit Geltungsbereich und erforderlicher
Freigabefunktion steht in der
[5c-Abschlussdokumentation](../implementation/cemaris-increment-5c-completion.md#entscheidungsmatrix-5c-01-bis-5c-14).
Für dieses Anforderungsdokument gilt zusammenfassend:

| ID | Status | Quellengebundene Grenze nach 5c |
| --- | --- | --- |
| 5C-01 | OFFEN | Die sieben örtlich genannten Grab-/Rechtearten sind Satzungsevidenz, kein allgemeiner Cemaris-Katalog und kein 5d-Umfang. |
| 5C-02 | BESTÄTIGT | Das manuelle 5b-Enddatum darf historisiert geändert werden und besitzt allein keinerlei Status- oder Beendigungswirkung. |
| 5C-03 | OFFEN | Auslösende Ereignisse und rückwirkungsfreie Regelstandzuordnung für berechnete Ruhe-/Nutzungszeiten sind nicht bestätigt. |
| 5C-04 | OFFEN | Einheit, Rundung, Grenzen und Schaltjahre bleiben unentschieden; lokale Jahreswerte sind keine Defaults. |
| 5C-05 | WIDERSPRUCH | Verlängerung zur Deckung der Ruhezeit vor einer Beisetzung und Gebührenaussage `nach Ablauf` werden nicht still aufgelöst. |
| 5C-06 | OFFEN | Beendigung, Rückgabe/Verzicht, Entzug, Schließung, Entwidmung und Wiedervergabe besitzen kein freigegebenes Zustandsmodell. |
| 5C-07 | OFFEN | Die 5b-Rollen bleiben bestätigt; Auslösen, Bestätigen und Zurücknehmen künftiger Lebenszyklusübergänge ist offen. |
| 5C-08 | OFFEN | ETag, Atomarität, Revision und sparsamer Audit bleiben Mindestmechanismen; Quellen-/Begründungspflichten je neuem Übergang sind offen. |
| 5C-09 | OFFEN | Lokale Schließungs-/Entwidmungsaussagen sind Evidenz; konkrete Cemaris-Statuswirkungen bleiben unmodelliert. |
| 5C-10 | OFFEN | Keine automatische Altfallinterpretation; ein Bestandsschutz-/Satzungsstand-Snapshot benötigt ein eigenes Gate. |
| 5C-11 | OFFEN | Es sind keine Wiedervorlagenarten oder Regeln für Entstehung, Erledigung, Verschiebung und Aufhebung bestätigt. |
| 5C-12 | OFFEN | Der lokale Drei-Monats-Hinweis erzeugt noch keine manuelle oder automatische Erinnerung, Eskalation oder Nachricht. |
| 5C-13 | OFFEN | Aufbewahrung, Löschung, Sperrung und Anonymisierung besitzen keine freigegebene Automatik. |
| 5C-14 | BESTÄTIGT | Kommunale Werte sind lokale Konfiguration; Historisierung, Atomarität, ETag, Audit und rückwirkungsfreie Snapshots sind allgemeine Produktmechanismen. |

Quelle der Statusbestätigung ist die Projektverantwortung vom 18.08.2026 auf
Basis der bestehenden 5a-Entscheidungen, ADR-0016 und der erneut nur lesend
geprüften lokalen Satzungsevidenz. `BESTÄTIGT` bezieht sich ausschließlich auf
die genannte Produktgrenze, nicht auf eine Rechts- oder Verwaltungsabnahme.

## Ergänzende 5f-Entscheidung

Quelle `USR-2026-08-21-ADMIN-DEVELOPMENT` ist die Auskunft eines
`Administrators mit Entwicklungsauftrag für die Friedhofsverwaltungssoftware`
vom 21.08.2026. Sie bestätigt beziehungsweise teilt ausschließlich mit:

- Cemaris ist als Open-Source-Software für alle Kommunen nachnutzbar;
- erster Entwicklungskontext ist die Stadt Doberlug-Kirchhain;
- EDWALT darf als Orientierung für die weitere Erhebung dienen.

Die Aussage beantwortet keine operationsspezifische Frage aus 5C-01,
5C-03 bis 5C-13 und stammt aus keiner dafür benannten fachlichen oder
freigebenden Funktion. Für den einzigen Untersuchungskandidaten „manuelle
vorzeitige Rückgabe nach abgelaufener Ruhezeit“ bleiben insbesondere offen:

- realer Bedarf, betroffene Rechte- und Fallarten;
- Auslöser, Pflichtnachweis, Wirksamkeit, Rückwirkung und Korrektur;
- Rechtzustand und ausdrücklich unveränderte Fakten;
- Funktionstrennung und Rollenfreigabe;
- Wechselwirkung mit Beisetzungen, Inhaberzeitraum, Grabstatus, Sperre und
  Wiedervergabe;
- Pflichtbegründung, Quelle und Fachrevisionsinhalt;
- Altbestand, Bestandsschutz, Migration und fehlende Nachweise;
- Fach-, Rechts-, Datenschutz-, Sicherheits- und Betriebsfreigaben.

Damit bleibt `5C-05` widersprüchlich, `5C-02` und `5C-14` bleiben in ihrer
engen bisherigen Grenze bestätigt und alle anderen 5C-Fragen bleiben offen.
Ausgewählt ist Variante A „keine Implementierung“. EDWALT-Beobachtungen dürfen
nur als `ALTVERFAHRENS-EVIDENZ` zur Erhebung beitragen; aus ihnen wird weder
ein heutiger Sollprozess noch eine allgemeine Open-Source-Produktregel
abgeleitet. Die vollständige Begründung steht in der
[5f-Matrix](../implementation/cemaris-increment-5f-evidence-decision-approval-matrix.md).

## Bestätigter nächster Umfang

Die manuelle Vorführung hat keinen fachlichen Defekt des 5b-Kerns ergeben.
Bestätigt ist ausschließlich ein technisches Bedieninkrement 5d für:

- einen fallunabhängigen Beteiligteneinstieg auf vorhandenen Verträgen;
- containergeeignet responsive Rechteaktionsformulare;
- direkte Anzeige vorhandener Feldfehler;
- verständlichere Hinweise zur getrennten Altprojektion.

Die ausführbare Abgrenzung steht in der
[5d-Folgeübergabe](../implementation/cemaris-increment-5d-next-step-handoff.md).
Keine der offenen oder widersprüchlichen 5C-Fragen wird dadurch zur
Implementierungsanforderung.

Die Bedienkorrekturen sind gemäß
[5d-Abschluss](../implementation/cemaris-increment-5d-completion.md) technisch
umgesetzt. Die nachgelagerte
[5e-CSRF-Sitzungsstabilisierung](../implementation/cemaris-increment-5e-completion.md)
ist ebenfalls rein technisch und ändert keine Produktentscheidung dieses
Dokuments. Das 5f-Gate ergänzt ebenfalls keine Fachregel. Der nächste
Lebenszyklusschritt ist nur das dokumentarische
[5g-Kurzentscheidungs- und Freigabegate](../implementation/cemaris-increment-5g-next-step-handoff.md).

## Rückverfolgbarkeit der Entscheidungen

Die neun priorisierten Fragen des 5a-Gates wurden am 14.08.2026 beantwortet:
aktueller lokaler Satzungsstand, manueller 5b-Kern, kanonische Beteiligte,
historische Postanschriften, warnende Dublettenprüfung, ein aktueller Inhaber,
stabile Rechteidentität, manuelle historisierte Mutationen sowie vorhandene
Rollen- und Sicherheitsgrenzen. Die ergänzende Rückfrage zum lokalen Beginn
wurde mit `Urkundenübergabe, in der Programmkonfiguration einstellbar`
beantwortet. Diese Antwort ist in REQ-CFG-001 bis REQ-CFG-005 präzisiert;
die technische Granularität je Friedhof folgt aus dem bereits kanonischen
Friedhofsmodell und ist Architektur, kein kommunaler Default.
