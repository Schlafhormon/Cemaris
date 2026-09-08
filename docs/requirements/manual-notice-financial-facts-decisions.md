# Freigabeentscheidung zu manuellen Bescheid-/Finanzfakten

Aktualisierung 08.09.2026: Der historische 6b-/6c-Schnitt ist inzwischen
implementiert. Nächster bestätigter Ausbau ist [M3a – manuelle Gebührenpositionen](manual-notice-line-items-decisions.md)
mit exakter Summe und vollständiger DOCX-/PDF-Ausgabe. Die
[Umsetzungsübergabe](../implementation/cemaris-manual-notice-line-items-next-step-handoff.md)
ist vorbereitet, noch nicht ausgeführt. Die nachfolgenden Gateentscheidungen
bleiben datierte Historie. Für den neuen Umfang gelten die M3a-Ergänzung und
die [Prototypentscheidung](notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp);
keine erneute allgemeine Freigaberunde. Katalog, Tarifberechnung und Rechtswirkung
werden dadurch nicht freigegeben.

> **Status:** Das interaktive Gate 6a-F ist am 26.08.2026 nach einer
> ergänzenden funktionsbezogenen Klärung vollständig mit **Variante B – genau
> ein manueller kanonischer Faktenkern** abgeschlossen. Freigegeben ist
> ausschließlich ein rechtlich wirkungsloser Bescheidentwurf für den
> technischen Development-Piloten mit synthetischen Daten. Die separate
> [6b-Implementierungsübergabe](../implementation/cemaris-increment-6b-next-step-handoff.md)
> ist ausführbar.

## Zweck und Entscheidungsregel

Diese Akte führt das verbindliche
[Freigabegate](../implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md)
für genau einen Kandidaten aus: einen rechtlich wirkungslosen, manuell
befüllten und kanonisch historisierten Bescheidentwurf. Sie ist keine
Gebührenberechnungs-, Bescheiderzeugungs-, Bekanntgabe-, Versand-,
Finanzintegrations-, Migrations- oder Produktivfreigabe.

Die Statusbegriffe lauten `BESTÄTIGT`, `TEILWEISE BESTÄTIGT`, `OFFEN`,
`WIDERSPRUCH` und `VERWORFEN`. Variante B ist nur zulässig, wenn alle für den
abgegrenzten Schnitt benötigten Teile von 6F-01 bis 6F-10 durch die jeweils
zuständigen Funktionen `BESTÄTIGT` sind. Eine Projektpriorisierung allein
ersetzt keine Fach-, Rechts-, Finanz-, Datenschutz-, Sicherheits- oder
Betriebsfreigabe.

## Funktion, Übermittlung und Geltungsbereich

Der Auskunftgeber hat sich als **Projektleiter von Cemaris** bezeichnet und
erklärt, sämtliche Prozessangaben seien mit der Friedhofsverwaltung
abgesprochen. Die erste pauschale Antwort `Alles freigegeben!` genügte dem
funktionsbezogenen Gate noch nicht. Deshalb wurde Variante A zunächst
ordnungsgemäß als Stop-Entscheidung dokumentiert.

Mit `USR-2026-08-26-6F-SUPPLEMENT-01` hat der Projektleiter anschließend auf
eine ausdrücklich funktions- und geltungsbereichsbezogene Nachfrage
verbindlich bestätigt, die Freigaben der folgenden zuständigen Funktionen zu
übermitteln:

| Funktion | Freigegebener Geltungsbereich |
| --- | --- |
| Friedhofsfachverantwortung | fachlicher Umfang des rechtlich wirkungslosen manuellen Entwurfs |
| Rechts-/Satzungsprüfung | klare Wirkungslosigkeit des Entwurfs und Ausschluss von Festsetzung, Erzeugung, Bekanntgabe, Versand und Korrektur erzeugter Bescheide |
| Finanz-/Haushaltsverantwortung | ausschließlich manuell erfasster Übertragungskern für den späteren Medienbruch zu FINANZ+; keine Buchung oder Integration |
| Datenschutz | minimierter kanonischer Beteiligtenbezug, Fachrevision und synthetische Pilotdaten |
| Informationssicherheit | bestehende Rollen, starke ETags, Atomarität, serverseitiger Akteur und sparsamer Audit |
| Betrieb | ausschließlich Development, sichere Default-Deaktivierung und synthetische Abnahme; keine Produktivsetzung |

Die Freigabe gilt nur für die technische Implementierung und automatisierte
Abnahme mit synthetischen Daten. Sie erlaubt weder echte Verwaltungsdaten noch
Produktivbetrieb. Projekt-, Organisations- und Architekturverantwortung
werden durch den Projektleiter für diesen technischen Zuschnitt getragen.
Migration ist ausdrücklich ausgeschlossen und benötigt daher keine positive
Quell- oder Mappingfreigabe.

Mit derselben Quelle wurde bestätigt:

- Der aktuelle Nutzungsberechtigte darf in der Oberfläche nur als Vorschlag
  vorausgewählt werden. Vor dem Speichern muss die Sachbearbeitung genau einen
  Zahlungspflichtigen ausdrücklich bestätigen.
- 6b umfasst ausschließlich Anlegen, historisiertes Korrigieren und Verwerfen
  rechtlich wirkungsloser Entwürfe. Erzeugung, Bekanntgabe, Versand sowie
  Korrektur oder Storno eines erzeugten Bescheids folgen erst in gesonderten
  Inkrementen.

Mit `USR-2026-08-26-6F-SUPPLEMENT-02` wurde die letzte Kardinalität bestätigt:
Ein Fall darf gleichzeitig und historisch mehrere eigenständige Entwürfe
besitzen. Jeder Entwurf hat eine eigene dauerhaft gesperrte Nummer und genau
einen ausdrücklich bestätigten Zahlungspflichtigen.

Örtlicher Einführungs- und Pilotkontext bleiben die Stadt Doberlug-Kirchhain
und ihre Friedhöfe. Das Produktziel ist eine deutschlandweit nachnutzbare
Open-Source-Friedhofsverwaltung. Örtliche Werte werden nicht versioniert und
nicht als allgemeine Regeln fest eingebaut; die Nummernmechanik bleibt
konfigurierbar.

## Quellenmatrix

| ID | Quelle | Quellenart und Funktion | Bestätigte Aussage | Geltungsbereich | Nicht daraus ableitbar |
| --- | --- | --- | --- | --- | --- |
| Q-6F-01 | [verbindliche 6a-F-Übergabe](../implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md) | Projekt- und Gatevorgabe | Quellenmatrix, 6F-01 bis 6F-10, Variantenvergleich und Stop-Regel | dieses Gate | keine Fachregel |
| Q-6F-02 | [6a-Entscheidungsakte](fee-notice-document-decisions.md) und [6a-Abschluss](../implementation/cemaris-increment-6a-completion.md) | Repositoryentscheidung | `ReadNotices`, `ReadFeeItems`, nullable Felder und Fixtures sind kein freigegebenes Schreibmodell | allgemeine Produktgrenze | kanonischer Kern oder Migration |
| Q-6F-03 | [Interviewaufzeichnung](edwalt-analysis/interview-record.md) und [Anforderungsindex](README.md) | bestätigter Ist-Prozess | FINANZ+ führt Buchung, Zahlung, Finanzstatus und Mahnung; Übertragung erfolgt manuell; kein Rückkanal | heutiger Prozess | Schnittstelle oder Buchungsstatus in Cemaris |
| Q-6F-04 | [Personen-/Nutzungsrechtsentscheidungen](person-usage-rights-deadlines-decisions.md) | örtliche Satzungsevidenz | Zahlungspflicht und Rechteinhaberschaft sind nicht gleichzusetzen | örtliche Evidenz | automatische fachliche Ableitung |
| Q-6F-05 | `USR-2026-08-26-6F-DIALOG-01` bis `-07` | Projektleiter; mitgeteilte Fachabstimmung | heutiger Ablauf, Entwurfskern, Nummer, Felder, Rollen, Revision, FINANZ+-Grenze, kein Backfill und synthetische Abnahme | Pilot und konfigurierbares Produktziel | Dokument, Berechnung, Integration oder Produktivsetzung |
| Q-6F-06 | `USR-2026-08-26-6F-SUPPLEMENT-01` | Projektleiter als verbindlich Übermittelnder der benannten Fach-, Rechts-, Finanz-, Datenschutz-, Sicherheits- und Betriebsfreigaben | funktionsbezogene Freigabe des abgegrenzten technischen Piloten; bestätigungspflichtiger Zahlungspflichtigenvorschlag; ausschließlich wirkungslose Entwürfe | Development und synthetische Daten | echte Daten, Produktivbetrieb oder erzeugte Bescheide |
| Q-6F-07 | `USR-2026-08-26-6F-SUPPLEMENT-02` | Projektleiter mit Fachfreigabe | mehrere unabhängige Entwürfe pro Fall; je Entwurf eigene Nummer und genau ein Zahlungspflichtiger | 6b-Entwurfskern | fachliche Beziehung zwischen mehreren Entwürfen |
| Q-6F-08 | [Identitäts-/Rollenentscheidungen](identity-authorization-audit-decisions.md), [Sicherheitsarchitektur](../architecture/authentication-authorization-audit.md) und ADR-[0011](../decisions/ADR-0011-provider-neutral-actor-and-atomic-case-audit.md) bis [0013](../decisions/ADR-0013-local-cookie-session-and-security-stamp.md) | bestehender technischer Vertrag | beide Rollen für Facharbeit; Programmkonfiguration nur Administration; serverseitiger Akteur, ETag, Atomarität und sparsamer Audit | 6b verwendet vorhandene Muster | neue Rolle oder Produktivfreigabe |
| Q-6F-09 | [Bescheid-/Dokumentkonzept](../architecture/document-generation.md) | Architekturvision | Cemaris soll später Bescheide erzeugen | spätere Inkremente | Vorlage, Rechtsinhalt, Renderer, Versand oder Aufbewahrung in 6b |
| Q-6F-10 | technischer Lesevertrag in Application, Infrastructure, API und UI | technische Bestandsquelle | nur nullable Altprojektion ohne Schreiboperation, Revision oder Policy | bestehende Kompatibilität | Rückinterpretation oder Backfill |
| Q-6F-11 | [VwVfGBbg `` 1 und 7](https://bravors.brandenburg.de/gesetze/vwvfgbbg) sowie [VwVfG `` 41 und 43](https://www.gesetze-im-internet.de/vwvfg/BJNR012530976.html) | ergänzende amtliche Gesetzesevidenz | allgemeine Bekanntgabegrenze; die zunächst genannte Frist wurde korrigiert | Brandenburg, vorbehaltlich Spezialrecht | Fälligkeitsberechnung oder Bescheidwirkung in 6b |
| Q-6F-12 | [Migrationsstrategie](../migration/README.md) und [pausierter Gebührenauftrag](../migration/edwalt-fee-master-variants-next-step-handoff.md) | Migrationsgrenze | EDWALT-Gebührenauftrag bleibt pausiert | spätere gesonderte Migration | Mapping, Backfill oder Import |

Keine externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige
Arbeitswurzel wurde für das Gate geöffnet. Die amtlichen Gesetzesquellen
korrigieren nur die Bekanntgabefrist und ersetzen keine Freigabe für einen
wirksamen Bescheid.

## Freigegebener 6b-Vertrag

### Fachkern

- Ein vorhandener Cemaris-Fall darf mehrere unabhängige, rechtlich
  wirkungslose Bescheidentwürfe besitzen.
- Jeder Entwurf besitzt eine stabile GUID, eine unveränderliche automatisch
  vergebene Bescheidnummer und genau einen kanonischen Zahlungspflichtigen.
- Der aktuelle Nutzungsberechtigte darf nur als sichtbarer Vorschlag dienen.
  Eine ausdrückliche Bestätigung der tatsächlichen Auswahl ist zwingend; ohne
  Bestätigung wird nicht gespeichert.
- Pflichtfakten sind Fall, Zahlungspflichtiger, Bescheidnummer, positiver
  Gesamtbetrag mit genau zwei Nachkommastellen, feste Währung `EUR`,
  vorgesehenes Bescheiddatum, manuell bestimmte Fälligkeit, Finanzprodukt,
  Kontierung und ein kurzer Gebührenanlass oder Quellenbezug.
- Betrag und Daten werden manuell erfasst. Es gibt keine Gebühren-,
  Fälligkeits-, Satzungs-, Mengen-, Steuer-, Ermäßigungs-, Rundungs- oder
  Summenberechnung.
- Entwürfe besitzen nur `Draft` und `Discarded`. Ein aktiver Entwurf darf
  begründet und historisiert korrigiert oder begründet verworfen werden.
  Verwerfen löscht nichts; ein verworfener Entwurf ist unveränderlich.
- Fallreferenz und Bescheidnummer bleiben nach Anlage unveränderlich. Die
  Nummer bleibt auch nach Verwerfen dauerhaft verbraucht.

### Nummernkonfiguration

- Die Administration pflegt installationweit die aktuelle, versionierte
  Nummernkonfiguration; Sachbearbeitung darf sie nur soweit für die
  Entwurfsarbeit erforderlich lesen.
- Das feste Schema lautet `Finanzprodukt.JahrLaufnummer`. Finanzprodukt und
  Stellenzahl der links mit Null gepolsterten laufenden Nummer sind
  konfigurierbar. Das vierstellige Jahr stammt aus dem serverseitigen
  Vergabezeitpunkt des Entwurfs.
- Die laufende Nummer beginnt je Kalenderjahr bei eins. Sie ist über
  Konfigurationsversionen hinweg installationweit fortlaufend; Lücken sind
  zulässig, eine vergebene Zahl wird nie wiederverwendet. Die vollständige
  Bescheidnummer ist global eindeutig.
- Eine Konfigurationsänderung gilt nur für zukünftige Entwürfe. Jeder Entwurf
  speichert Konfigurations-ID und -Version sowie Finanzprodukt und Stellenzahl
  als Snapshot; vorhandene Nummern werden nie umgeschrieben.
- Reicht die Stellenzahl für die nächste Zahl nicht aus, scheitert die gesamte
  Anlage ohne Teilwirkung. Die Administration muss die Stellenzahl
  prospektiv erhöhen. Eine manuelle Nummernvergabe existiert nicht.

### Rollen, Historie und Technik

- `Sachbearbeitung` und `Administration` dürfen Entwürfe lesen, anlegen,
  korrigieren und verwerfen. Eine zweite Person oder fachliche Freigabe ist in
  6b nicht erforderlich.
- Nur `Administration` darf die Nummernkonfiguration anlegen oder ändern.
- Jede erfolgreiche Entwurfsmutation erzeugt atomar die neue monotone Version,
  eine unveränderliche Fachrevision mit vollständigem Fakten-Snapshot und
  einen getrennten sparsamen Auditdatensatz.
- Der Fachsnapshot enthält die gewählte Beteiligten-ID und den damaligen
  Anzeigenamen, aber keine Anschrift und keinen vollständigen
  Beteiligtenstand. Der technische Audit enthält keine Fachbeträge,
  Kontierungen, Gründe oder personenbezogenen Vollkopien.
- Korrektur und Verwerfen verlangen einen Grund und den letzten starken ETag.
  Abgelehnte, ungültige oder konkurrierende Requests verändern weder
  Nummernstand, Entwurf, Revision noch Audit.
- Die Funktion erhält eine eigene standardmäßig deaktivierte und außerhalb
  `Development` unzulässige Capability. Synthetic- und SQL-Provider müssen
  denselben Vertrag erfüllen.

### FINANZ+- und Kompatibilitätsgrenze

- FINANZ+ bleibt führend für Buchung, Zahlung, Mahnung und Finanzstatus. 6b
  implementiert keine Schnittstelle und keinen Rückkanal.
- Beginn und Ende einer wiederkehrenden Buchung bestimmt die buchende
  Sachbearbeitung in FINANZ+ anhand des bestehenden Nutzungszeitraums. Diese
  Daten werden nicht als Entwurfsfakten gespeichert.
- Der Buchungstext entsteht ausschließlich in FINANZ+ und wird nicht in
  Cemaris vorgegeben oder gespeichert.
- `ReadNotices`, `ReadFeeItems` und ihre nullable Felder bleiben unveränderte
  Altprojektion. Der neue Kern ist additiv; es gibt kein Backfill, keine
  Rückinterpretation und keine EDWALT-Migration.

## Entscheidungsmatrix 6F-01 bis 6F-10

| ID | Status | Bestätigter Befund | Funktion und Geltungsbereich | Technische Wirkung | Verbleibende Grenze |
| --- | --- | --- | --- | --- | --- |
| 6F-01 | `BESTÄTIGT` | manueller wirkungsloser Entwurf ist erster Nutzerfall | Projekt, Fach und Finanzprozess; technischer Pilot | 6b-Kern zulässig | Bescheiderzeugung später |
| 6F-02 | `BESTÄTIGT` | nur interner Entwurf ohne Festsetzung, Dokument, Versand oder Rechtswirkung | Fach und Rechts-/Satzungsprüfung; Development | Zustände `Draft`/`Discarded` | wirksame Zustände ausgeschlossen |
| 6F-03 | `BESTÄTIGT` | genau ein kanonischer Zahlungspflichtiger; Nutzungsberechtigter nur Vorschlag mit ausdrücklicher Bestätigung | Fach, Recht und Datenschutz; 6b | Beteiligten-FK und serverseitige Bestätigungsprüfung | keine automatische Ableitung |
| 6F-04 | `BESTÄTIGT` | automatische versionierte Nummer beim Entwurf, jährliche Sequenz, Lücken, Sperre und administrative Konfiguration | Fach, Finanz und Organisation; Installation/Development | atomarer Nummernkreis und Konfigurationssnapshot | keine manuelle Nummer |
| 6F-05 | `BESTÄTIGT` | exakt abgegrenzter manueller EUR-Pflichtkern ohne Berechnung | Fach, Recht und Finanz/Haushalt; Entwurf | validierte kanonische Felder | kein Katalog oder Rechenmodell |
| 6F-06 | `BESTÄTIGT` | nur begründete Entwurfskorrektur und Verwerfen ohne Löschen | Fach, Recht und Finanz; vor Erzeugung | Revisionen und unveränderliche Nummer | Korrektur erzeugter Bescheide später |
| 6F-07 | `BESTÄTIGT` | beide Rollen für Fachoperationen, eine Person genügt; Konfiguration nur Administration | Fach, Organisation und Sicherheit; 6b | neue Fachpolicy plus vorhandene Administrationspolicy | keine Erzeugungs-/Freigaberechte |
| 6F-08 | `BESTÄTIGT` | separates Aggregat, Vollsnapshot, starker ETag, Atomarität und sparsamer Audit | Fach, Architektur, Sicherheit und Datenschutz; synthetischer Pilot | providerneutraler versionierter Kern | Aufbewahrung echter Daten später |
| 6F-09 | `BESTÄTIGT` | klare FINANZ+-Hoheit und manuelle Übertragungsgrenze ohne Rückkanal | Fach, Finanzprozess, Architektur und Datenschutz | keine Integration; nur bestätigte Entwurfsfelder | Buchungsstatus und Buchungstext ausgeschlossen |
| 6F-10 | `BESTÄTIGT` | additive Trennung, kein Backfill/Import, synthetische Abnahme, Development-only | Projekt, Fach, Datenschutz, Sicherheit und Betrieb | neue additive Tabellen und sichere Capability | echte Daten und Produktivbetrieb gesperrt |

## Variantenvergleich und Entscheidung

| Kriterium | Variante A: keine Implementierung | Variante B: manueller kanonischer Faktenkern | Variante C: breiter Gebühren-/Bescheidumfang |
| --- | --- | --- | --- |
| Fachmodell | würde den nun freigegebenen kleinen Nutzen aufschieben | exakt abgegrenzter wirkungsloser Entwurf | würde Katalog, Berechnung oder Dokument vorziehen |
| Recht und Finanzen | sicher, aber nach Ergänzung nicht mehr erforderlich | durch zuständige Funktionen für den synthetischen Development-Piloten getragen | wirksame Rechts-/Finanzregeln fehlen |
| Zahlungspflichtiger | keine neue Rolle | explizit bestätigte Auswahl; keine Ableitung | würde den Personenbezug in weitere offene Prozesse tragen |
| Rollen und Audit | unverändert | vorhandene Rollen und Sicherheitsmuster reichen für den kleinen Schnitt | zusätzliche Freigabe- und Dokumentoperationen ungeklärt |
| Migration und Kompatibilität | unverändert | rein additiv, ohne Backfill oder Altdeutung | EDWALT-Varianten könnten fälschlich Zielmodell werden |
| Gate-Ergebnis | nach Ergänzung verworfen | **AUSGEWÄHLT** | **VERWORFEN** |

**Variante B ist ausgewählt.** Der zunächst dokumentierte 6F-03-Widerspruch
ist durch die ausdrücklich bestätigungspflichtige Auswahl aufgelöst. Die
funktionsbezogenen Freigaben gelten für genau diesen Development-Schnitt.

Technische Folgen:

- neuer kanonischer Entwurfskern neben der unveränderten Leseprojektion;
- neue versionierte Nummernkonfiguration und atomare Jahressequenz;
- eigene Development-Capability und fachliche Entwurfspolicy;
- additive EF-Migration, Synthetic-/SQL-Providerparität, API, UI und Tests;
- [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md) für die
  neue Architekturentscheidung;
- ausführbarer
  [6b-Auftrag](../implementation/cemaris-increment-6b-next-step-handoff.md).

## Weiterhin nicht freigegeben

- Gebührenkatalog, Gebührensätze und automatische Betragsbildung;
- automatische Fälligkeit, Zustellung oder Rechtswirkung;
- Bescheiderzeugung, Vorlagen, PDF/DOCX, Signatur, Versand und Bekanntgabe;
- Freigabe-, Vier-Augen-, Festsetzungs-, Aufhebungs-, Storno- oder
  Korrekturbescheidprozess;
- FINANZ+-Schnittstelle, Buchung, Zahlung, Mahnung, Erstattung oder Rückkanal;
- Aufbewahrungs- oder Löschregeln für echte Verwaltungsdaten;
- echte Personen-, Finanz- oder Verwaltungsdaten und Produktivbetrieb;
- EDWALT-Mapping, Backfill, Gebührenstamm- oder Bescheidmigration.

Die spätere Bescheiderzeugung bleibt ausdrücklich das Produktziel, benötigt
aber nach dem technischen 6b-Abschluss ein eigenes Fach-, Rechts-, Vorlagen-,
Dokument-, Versand-, Datenschutz-, Sicherheits- und Betriebsgate.

## Technische Umsetzung 6b

Der freigegebene kleine Schnitt ist gemäß
[6b-Abschluss](../implementation/cemaris-increment-6b-completion.md) additiv
Ende zu Ende umgesetzt. Die Umsetzung verändert keine Entscheidung 6F-01 bis
6F-10: rechtlich wirkungslose manuelle Entwürfe, aktive
Zahlungspflichtigenbestätigung, unveränderliche Nummernsnapshots,
Korrektur/Verwerfen, vollständige Fachrevision, sparsamer Audit und
FINANZ+-/Altprojektionsgrenze entsprechen dem bestätigten Vertrag.

Nicht autorisierte SQL-Tests wurden mangels separater Testverbindung nicht
ausgeführt. Dies ist keine Produktiv- oder Datenfreigabe. Das nachgelagerte
[dokumentarische Entscheidungsgate](../implementation/cemaris-notice-generation-decision-gate-completion.md)
vor einer möglichen späteren Bescheiderzeugung ist inzwischen mit Variante A
als erstem Stop-Zwischenstand dokumentiert und nach ergänzender
Quellenklärung endgültig mit Variante B abgeschlossen. Die separate
[6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md) ist
vorbereitet, aber nicht ausgeführt. Sie ändert den 6b-Vertrag nicht und
erteilt keine Produktiv-, Rechtswirkungs-, Integrations- oder
Migrationsfreigabe.
