# Entscheidungen zur späteren Bescheiderzeugung

Aktualisierung 08.09.2026: Der historische 6b-/6c-Schnitt ist inzwischen
implementiert. Nächster bestätigter Ausbau ist [M3a – manuelle Gebührenpositionen](manual-notice-line-items-decisions.md)
mit exakter Summe und vollständiger DOCX-/PDF-Ausgabe. Die
[Umsetzungsübergabe](../implementation/cemaris-manual-notice-line-items-next-step-handoff.md)
ist vorbereitet, noch nicht ausgeführt. Die nachfolgenden Gateentscheidungen
bleiben datierte Historie. Für den neuen Umfang gelten die M3a-Ergänzung und
die [Prototypentscheidung](notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp);
keine erneute allgemeine Freigaberunde. Katalog, Tarifberechnung und Rechtswirkung
werden dadurch nicht freigegeben.

> **Aktueller Status:** Das ausschließlich dokumentarische 6c-Entscheidungs-
> und Freigabegate ist am 27.08.2026 nach ergänzender, quellenbezogener
> Klärung mit **Variante B – genau ein entscheidungsreifer Kandidat**
> abgeschlossen. Der zuerst dokumentierte Zwischenabschluss mit Variante A
> bleibt unten als historische Stop-Entscheidung erhalten. Der
> [verbindliche Nachtrag](#verbindlicher-nachtrag-zum-ersten-gateabschluss)
> hebt ihn für den eng begrenzten Kandidaten auf. Die technische
> [6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md)
> ist vorbereitet, aber in diesem Chat weder ausgeführt noch technisch
> freigegeben worden.

## Zweck und Entscheidungsregel

Diese Akte führt das verbindliche
[6c-Gate](../implementation/cemaris-notice-generation-decision-gate-next-step-handoff.md)
für genau einen Kandidaten aus: die spätere Erzeugung eines Entwurfs eines
Gebührenbescheids für Beisetzungsgebühren. Sie dokumentiert Produktgrenzen,
Quellen und Freigaben, implementiert aber weder Vorlage noch Renderer,
Produktcode, Schema, Migration, API, UI oder Integration.

Die Statusbegriffe lauten `BESTÄTIGT`, `TEILWEISE BESTÄTIGT`, `OFFEN`,
`WIDERSPRUCH` und `VERWORFEN`. Variante B wäre nur zulässig, wenn alle Pakete
NG-01 bis NG-10 für genau diesen Kandidaten quellenbelegt und durch die
zuständigen Funktionen vollständig bestätigt wären. Eine fehlende
repositorygeeignete Testquelle oder ein offenes unabtrennbares Kriterium führt
zwingend zu Variante A.

## Kandidat und Produktgrenze

Der bestätigte fachliche Kandidat lautet:

> Cemaris erzeugt aus aktuellen Fall-, Stamm- und bereits manuell bestätigten
> Entwurfsdaten sowie einer kommunal verantworteten Servervorlage wahlweise
> eine DOCX- oder PDF-Datei beziehungsweise einen Ausdruck eines
> Gebührenbescheidentwurfs für Beisetzungsgebühren.

Die Erzeugung ist keine Festsetzung, fachliche Freigabe, Bekanntgabe oder
Zustellung. Der Vorgang in Cemaris endet mit Export oder Druck. Die
Sachbearbeitung prüft das Ergebnis und darf eine exportierte DOCX-Datei
außerhalb von Cemaris bearbeiten. Es gibt keinen Rückkanal. Was nach der
Ausgabe mit der Datei oder dem Ausdruck geschieht, liegt außerhalb des
Cemaris-Produktvertrags.

Eine spätere Neuerzeugung verwendet die dann aktuellen Daten und die dann
aktuelle Servervorlage. Sie ist keine bitgenaue Reproduktion eines früheren
Exports. Cemaris archiviert weder das Ergebnis noch eine Kopie davon. Eine
spätere Winyard-Ablage ist nicht Bestandteil dieses Gates.

## Funktion, Übermittlung und Geltungsbereich

Der Auskunftgeber hat sich als entscheidungsbefugter **Projektleiter von
Cemaris** bezeichnet. Er baut den allgemeinen Cemaris-Produktvertrag auf; die
Stadt Doberlug-Kirchhain ist erste Pilotkommune und liefert örtliche Evidenz,
aber keine deutschlandweit fest einzubauende Produktregel.

Mit `USR-2026-08-27-6C-DIALOG-01` bis `-11` hat der Projektleiter die
Entscheidungen der fachlich verantwortlichen Friedhofsverwaltung sowie der
Rechts-/Satzungs-, Finanz-/Haushalts-, Datenschutz-, Informationssicherheits-,
Betriebs- und Produktivsetzungsfunktionen für die jeweils benannten
Produktgrenzen verbindlich übermittelt. Die letzte Erklärung „es ist alles
freigegeben“ wird nur zusammen mit den zuvor einzeln beantworteten Paketen
gewertet; sie erweitert den Geltungsbereich nicht.

Kommunale Prüfung, Freigabe, Aktualität und Gültigkeit des konkreten
Vorlageninhalts liegen ausdrücklich allein bei der jeweiligen
Friedhofsverwaltung. Cemaris soll weder die zuständige örtliche Stelle noch
ihren Freigabeprozess prüfen oder dokumentieren. Sachbearbeitungen melden
Änderungsbedarf; Administratoren ersetzen die Datei außerhalb von Cemaris im
Serverdateisystem. Diese klare Verantwortungsgrenze ersetzt jedoch nicht die
für Variante B verlangte repositorygeeignete Testquelle.

## Quellen- und Evidenzmatrix

| ID | Quelle | Quellenart und übermittelnde Funktion | Belegter Geltungsbereich | Nicht daraus ableitbar |
| --- | --- | --- | --- | --- |
| Q-NG-01 | [verbindliche 6c-Übergabe](../implementation/cemaris-notice-generation-decision-gate-next-step-handoff.md) | Projekt- und Gatevorgabe | NG-01 bis NG-10, Stop-Regel und Schutzgrenzen | Fachregel oder technische Freigabe |
| Q-NG-02 | [6b-Abschluss](../implementation/cemaris-increment-6b-completion.md), [6F-Akte](manual-notice-financial-facts-decisions.md) und [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md) | verbindlicher Repositoryvertrag | rechtlich wirkungsloser manueller Entwurf, ETag, Revision/Audit und Development-Grenze | Dokument, Renderer, Rechtswirkung oder Produktivbetrieb |
| Q-NG-03 | [6a-Entscheidungen](fee-notice-document-decisions.md) und [Dokumentarchitektur](../architecture/document-generation.md) | Repositoryentscheidung und Architekturvision | bisherige Sperren und zu klärende Dokumentfragen | stiller Erzeugungsvertrag |
| Q-NG-04 | `USR-2026-08-27-6C-DIALOG-01` bis `-03` | Projektleiter als verbindlich Übermittelnder der benannten Funktionen | Kandidat, Entwurfscharakter, Rechtsgrenze und allgemeiner Produktvertrag | örtlicher Vorlageninhalt oder technische Lösung |
| Q-NG-05 | `USR-2026-08-27-6C-DIALOG-04` bis `-07` | Projektleiter; örtliche Beispielfreigabe und Produktentscheidung | abstrahierte Feldgruppen, Aufteilung zwischen Vorlage und Cemaris sowie administrativer Austausch | repositorygeeignete Testvorlage oder technische Platzhalter |
| Q-NG-06 | `USR-2026-08-27-6C-DIALOG-08` bis `-10` | Projektleiter als verbindlich Übermittelnder der Fach-, Rechts-, Finanz-, Datenschutz-, Sicherheits- und Betriebsfunktionen | Ausgabegrenze, Rollen, Neuerzeugung, Korrekturgrenze, temporäre Löschung und sparsamer Audit | Rückkanal, Archivierung oder Zustellung |
| Q-NG-07 | `USR-2026-08-27-6C-DIALOG-11` | entscheidungsbefugter Projektleiter | Serverdateigrenze, Fehlerverhalten, Integrations-/Migrationsausschluss, synthetische Abnahme und Pilotabsicht | technische Umsetzung oder tatsächliche Produktivbereitschaft |
| Q-NG-08 | repositorylokaler Fremdbestand `tmp/examples/Beispielbescheid.doc` | vom Projektleiter rechtmäßig zur inhaltlichen Bestandsprüfung bereitgestellte örtliche Beispielevidenz | abstrakte Struktur eines inhaltlich als korrekt bezeichneten örtlichen Altbescheids | allgemeiner Produktstandard, synthetische Testdaten oder aktueller Briefkopf |
| Q-NG-09 | repositorylokaler Fremdbestand `tmp/examples/Vorlage Briefkopf_ungeschützt_allg.docx` | vom Projektleiter rechtmäßig zur Bestandsprüfung bereitgestellte örtliche Beispielevidenz | aktueller örtlicher Briefkopf mit Kopf-/Fußstruktur | synthetische Testvorlage, freigegebene Platzhalter oder technische Vorlagenart |
| Q-NG-10 | [Sicherheitsarchitektur](../architecture/authentication-authorization-audit.md), [Winyard-Grenze](../architecture/winyard-integration.md) und [Migrationsstrategie](../migration/README.md) | bestehende technische und organisatorische Grenzen | vorhandene Rollen, optionale spätere DMS-Integration und Nicht-Migration | neue Rolle, DMS-Verhalten oder EDWALT-Backfill |

Die beiden Dateien unter `tmp/examples` sind ignorierter, nicht versionierter
Fremdbestand. Sie werden nicht in Git übernommen. Bei ihrer dokumentarischen
Bestandsprüfung wurden keine konkreten Namen, Anschriften, Kontakt-, Konto-
oder sonstigen Verwaltungswerte in diese Akte übernommen.

## Abstrakter Daten- und Inhaltsbefund

Der alte Beispielbescheid belegt ausschließlich für die Pilotkommune folgende
abstrakte Feldgruppen:

- ausstellende Kommune und Organisationseinheit;
- Empfänger und Postanschrift;
- Kontakt, Aktenzeichen beziehungsweise Referenz und Bescheiddatum;
- Bescheidnummer und Bezeichnung;
- örtliche Rechts-/Satzungsgrundlage;
- Friedhof, Grabart und Grabreferenz;
- verstorbene Person und Beisetzungsdatum;
- Gebührenposition, gegebenenfalls Leistungszeitraum, Einzelbetrag und Summe;
- Zahlungsinformation beziehungsweise Fälligkeit;
- Rechtsbehelfsbelehrung und Hinweis zur maschinellen Erstellung.

Bestätigt ist nur die grundsätzliche Verwendung dieser Gruppen. In der
kommunal verantworteten Vorlage sollen ausstellende Kommune und
Organisationseinheit, Rechtsbehelfsbelehrung sowie der Hinweis zur
maschinellen Erstellung stehen. Die übrigen variablen Werte sollen aus
aktuellen Cemaris-Fall- und Stammdaten beziehungsweise dem manuellen
Entwurfskern kommen. Nicht vollständig entschieden sind die exakten
Pflicht-/Optionalregeln je Feld, die eindeutige Behandlung von Kontakt- und
Bankangaben und die feldgenaue Bindung an den 6b-Snapshot. Es wird keine
Ableitung aus `ReadNotices`, `ReadFeeItems` oder EDWALT vorgenommen.

## Bestätigte Produktentscheidungen

- genau eine erste Dokumentart: Gebührenbescheidentwurf für
  Beisetzungsgebühren;
- rechtlich wirkungsloser Vorschlag; keine eigenständige rechtswirksame
  Entscheidung durch Cemaris;
- keine fachliche Freigabe, Festsetzung, Signatur, Bekanntgabe, Zustellung oder
  Versandoperation in Cemaris;
- kommunale Inhalts- und Vorlagenverantwortung außerhalb von Cemaris;
- Vorlage als außerhalb von Cemaris administrierte Datei in einem je
  Installation konfigurierten Serververzeichnis; Cemaris liest nur;
- wahlweise DOCX- oder PDF-Export sowie Druck;
- keine Rückübernahme extern bearbeiteter Dateien;
- Ende des Cemaris-Vorgangs mit Export oder Druck;
- kein gespeichertes Dokument und keine Reproduktion eines früheren Exports;
- Neuerzeugung aus dem jeweils aktuellen Daten- und Vorlagenstand;
- vorhandene Fallaktenrechte, keine neue Bescheidrolle;
- Sachbearbeitung und Administration dürfen erzeugen und ausgeben;
- Administration ersetzt die Servervorlage außerhalb von Cemaris;
- minimaler Audit mit Fallbezug, Benutzer, Zeitpunkt, Ausgabeformat und
  Erfolg oder Fehler, aber ohne Dokument oder Dokumentinhalt;
- unmittelbare Bereinigung temporärer Verarbeitungsdateien nach Erfolg oder
  Fehler;
- bei Fehlern kein Teilergebnis, verständliche Meldung und Wiederholung nach
  Behebung;
- keine Winyard-, DMS-, FINANZ+-, Versand- oder Zustellintegration;
- keine Migration, kein Backfill und keine Nacherzeugung alter Bescheide;
- spätere Abnahme zuerst mit synthetischen Testfällen, danach gesonderte
  Aktivierung bei der Pilotkommune.

## Freigabematrix NG-01 bis NG-10

| Gate | Status | Entscheidung und Evidenz | Entscheidungsbefugte Funktion und Geltungsbereich | Restunsicherheit / Stop-Wirkung |
| --- | --- | --- | --- | --- |
| NG-01 Zweck und Dokumentart | `BESTÄTIGT` | genau ein Gebührenbescheidentwurf für Beisetzungsgebühren (`Q-NG-04`) | Friedhofsfachverantwortung und Projekt; allgemeiner Produktvertrag, Pilot zuerst | keine |
| NG-02 Rechtszustand | `BESTÄTIGT` | nur Vorschlag; Erzeugung/Export/Druck ohne Rechtswirkung; Entscheidung und etwaige Bekanntgabe außerhalb (`Q-NG-04`) | Fach und Rechts-/Satzungsprüfung; Produktgrenze | konkrete örtliche Rechtstexte bleiben Vorlagenverantwortung |
| NG-03 Datenvertrag | `TEILWEISE BESTÄTIGT` | Feldgruppen und Herkunftsklassen bestätigt (`Q-NG-05`, `Q-NG-08`) | Fach, Recht, Finanz und Datenschutz; Kandidat | exakte Pflicht-/Optionalregeln, Kontakt-/Bankdaten und feldgenauer 6b-Bezug fehlen; unabtrennbar |
| NG-04 Vorlage | `OFFEN` | kommunale Verantwortung und externer administrativer Austausch bestätigt; keine Cemaris-Versionierung (`Q-NG-05`, `Q-NG-09`) | Friedhofsverwaltung und Administration; je Installation | bereitgestellte DOCX ist weder synthetisch/anonymisiert noch eine technisch belegte Vorlage mit Platzhaltern; zwingende Stop-Bedingung |
| NG-05 Ausgabe | `TEILWEISE BESTÄTIGT` | DOCX, PDF und Druck sowie Sichtprüfung durch Sachbearbeitung bestätigt (`Q-NG-04`, `Q-NG-06`) | Fach, Datenschutz, Sicherheit und Betrieb; Kandidat | Barrierefreiheit und messbare Layout-/Konvertierungsabnahme fehlen; unabtrennbar |
| NG-06 Rollen und Nachweis | `TEILWEISE BESTÄTIGT` | vorhandene Fallaktenrechte, keine neue Rolle, administrativer Dateiaustausch und minimaler Audit (`Q-NG-06`) | Fach, Datenschutz und Sicherheit; Kandidat | ETag-, Quelldatenversions- und Fachrevisionsbezug der Erzeugungsoperation fehlt; unabtrennbar |
| NG-07 Zustellung und Korrekturgrenze | `BESTÄTIGT` | Ende bei Ausgabe; externe Bearbeitung ohne Rückkanal; keine Zustellung oder spätere Korrekturoperation (`Q-NG-06`) | Fach und Rechts-/Satzungsprüfung; Produktgrenze | keine innerhalb dieses Umfangs |
| NG-08 Datenschutz und Aufbewahrung | `TEILWEISE BESTÄTIGT` | kein Dokumentbestand, unmittelbare Temp-Bereinigung, vorhandene Fallrechte und inhaltsfreier Audit (`Q-NG-06`) | Datenschutz, Sicherheit und Betrieb; Kandidat | Aufbewahrungs-/Löschfrist des Auditereignisses und technische Temp-Grenze fehlen; unabtrennbar |
| NG-09 Integration und Betrieb | `BESTÄTIGT` | Cemaris-Ausgabe ohne DMS/FINANZ+; lesender Serverzugriff; Fehler ohne Teilergebnis, Audit und Wiederholung (`Q-NG-07`) | Betrieb, Sicherheit, Datenschutz und Projekt; Kandidat | Implementierungsdetails bleiben einem neuen Gate vorbehalten |
| NG-10 Produktiv- und Migrationsgrenze | `BESTÄTIGT` | synthetische Abnahme, Pilotabsicht, keine Altübernahme, Migration oder Nacherzeugung (`Q-NG-07`, `Q-NG-10`) | Projekt, Fach, Datenschutz, Sicherheit und Betrieb; allgemeines Produkt/Pilot | tatsächliche Produktivfreigabe erst nach einem späteren technischen Abschluss |

## Variantenvergleich und Entscheidung

| Kriterium | Variante A: keine Implementierung | Variante B: kleinster Erzeugungskandidat |
| --- | --- | --- |
| fachlicher Kandidat | bleibt dokumentiert | genau ein Kandidat wäre vorhanden |
| Datenvertrag | offene Pflicht-/Quellfeldgrenzen bleiben sicher gesperrt | dürfte nicht geraten werden |
| Testvorlage | keine ungeeignete örtliche Datei wird übernommen | verlangt eine noch fehlende synthetische/anonymisierte Testquelle |
| Ausgabe und Nachweis | offene Qualitäts-, ETag-, Revisions- und Aufbewahrungsfragen bleiben sichtbar | nicht vollständig entschieden |
| Technik | Produktcode und ADR-0018 bleiben unverändert | wäre unzulässige Vorwegnahme |
| Gate-Ergebnis | **AUSGEWÄHLT** | **VERWORFEN** |

**Variante A ist zwingend ausgewählt.** NG-04 erfüllt unmittelbar die
Stop-Bedingung; zusätzlich sind NG-03, NG-05, NG-06 und NG-08 nur teilweise
bestätigt. Die umfassend erklärte Freigabe kann die fehlende
repositorygeeignete Testquelle und die nicht entschiedenen Vertragsdetails
nicht ersetzen. Dies ist ein erfolgreicher Gateabschluss und keine Aussage
gegen das bestätigte Produktziel.

## Voraussetzungen für ein späteres neues Gate

Vor einer technischen Übergabe werden mindestens benötigt:

1. eine von der verantwortlichen Stelle bereitgestellte, vollständig
   synthetische oder vollständig anonymisierte, repositorygeeignete
   Testvorlage mit echten technischen Platzhaltern und geklärten
   Nutzungsrechten;
2. ein feldgenauer Vertrag mit Pflicht-/Optionalstatus, Quelle und
   Darstellung einschließlich Kontakt- und Zahlungsangaben;
3. entschiedene Barrierefreiheits- und überprüfbare Qualitätskriterien für
   DOCX, PDF und Druck;
4. der Bezug der Erzeugung auf 6b-ETag, Quelldatenstand und Fachnachweis;
5. die technische Temp-Dateigrenze und Aufbewahrungs-/Löschregel für den
   sparsamen Auditereignisbestand.

Ein späteres Gate darf die bewusste Produktentscheidung beibehalten, dass
Cemaris kommunale Vorlagenstände und lokale Inhaltsfreigaben nicht verwaltet.
Es muss dann technisch eindeutig festlegen, wie die oben genannten
Nachweis- und Abnahmeanforderungen ohne erfundene Versionierungsfunktion
erfüllt werden.

## Weiterhin nicht freigegeben

- jede Dokument-, Vorlagen-, Renderer-, API-, UI-, Schema- oder
  Integrationsimplementierung;
- Gebührenkatalog und automatische Gebühren-, Fälligkeits- oder
  Satzungsberechnung;
- Festsetzung, fachliche Freigabe, Signatur, Versand, Bekanntgabe und
  Zustellung;
- Rückimport, Archivierung, Winyard/DMS, FINANZ+ oder sonstiger Rückkanal;
- Speicherung oder Reproduktion erzeugter Dokumente;
- Korrektur, Aufhebung oder Storno bereits ausgegebener oder versandter
  Bescheide;
- echte Verwaltungsdaten, Produktivbetrieb, EDWALT-Mapping, Backfill und
  Migration.

## Verbindlicher Nachtrag zum ersten Gateabschluss

Nach der dokumentierten Variante-A-Entscheidung hat der Projektleiter die
fehlenden Entscheidungen paketbezogen ergänzt und eine rechtmäßig
bereitgestellte synthetische DOCX-Testquelle innerhalb des Repositorys
abgelegt. Dieser Nachtrag bewertet ausschließlich diese neue Evidenz. Er
ändert weder den historischen Befund zum damaligen Zeitpunkt noch ADR-0018
oder den bereits umgesetzten 6b-Vertrag.

### Ergänzende Quellen und Befugnis

| ID | Quelle und übermittelnde Funktion | Entscheidungsbefugte Funktionen | Geltungsbereich und Freigabe | Restunsicherheit |
| --- | --- | --- | --- | --- |
| `USR-2026-08-27-6C-SUPPLEMENT-01` | Projektleiter; Antworten zum feldgenauen Erzeugungsvertrag | Fach, Recht/Satzung, Finanz/Haushalt, Datenschutz, Informationssicherheit und Betrieb | genau ein aktiver 6b-Entwurf, genau eine ausgewählte Beisetzung, aktuelle kanonische Fall-/Stammdaten, Pflichtfeldabbruch, starke ETag-Bindung; bestätigt | keine innerhalb des Kandidaten |
| `USR-2026-08-27-6C-SUPPLEMENT-02` | Projektleiter; Qualitäts-, Nachweis-, Temp- und Aufbewahrungsentscheidung | Fach, Datenschutz, Informationssicherheit und Betrieb | DOCX-/PDF-/Druckabnahme, inhaltsfreier Erzeugungsaudit, isolierte Temp-Verarbeitung und Aufbewahrung nach kommunalen Fall-/Auditregeln; bestätigt | keine innerhalb des Kandidaten |
| `USR-2026-08-27-6C-SUPPLEMENT-03` | Projektleiter; Benutzerkontaktentscheidung | Fach, Datenschutz, Informationssicherheit und Administration | getrennte Kontaktfelder in der Benutzerverwaltung; Administration pflegt, Benutzer liest eigene Werte; alle Werte sind Erzeugungsvoraussetzung; bestätigt | keine innerhalb des Kandidaten |
| `USR-2026-08-27-6C-SUPPLEMENT-04` | Projektleiter; Satzungsstammdatenentscheidung | Fach, Recht/Satzung, Finanz/Haushalt und Administration | Satzung mit stabiler ID, Name, Fassungsstand, interner Version und Aktivstatus; genau eine aktive Version wird manuell gewählt; bestätigt | keine innerhalb des Kandidaten |
| `USR-2026-08-27-6C-SUPPLEMENT-05` | repositorylokale Datei `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx`, vom Projektleiter erstellt, bereitgestellt und zur Ableitung einer synthetischen Testvorlage freigegeben | Projekt, Fach, Recht/Satzung, Finanz, Datenschutz, Informationssicherheit und Betrieb | repräsentative synthetische DOCX-Quelle für den ersten Kandidaten; bestätigt | `EMPFAENGER_ANREDE` wird ausdrücklich nicht umgesetzt und muss aus der abgeleiteten technischen Testvorlage entfernt werden |

Der Projektleiter hat die Entscheidungen der genannten Funktionen verbindlich
übermittelt. Die Freigabe gilt nicht pauschal für weitere Dokumentarten,
Kommunen, Rechtsregeln, Integrationen oder Produktivsetzung. Die örtliche
Friedhofsverwaltung bleibt für Inhalt, Aktualität, Rechtmäßigkeit und
serverseitige Bereitstellung ihrer späteren konkreten Vorlage verantwortlich.

### Verifizierte synthetische Testquelle

Die Quelle `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` wurde
nur lesend geprüft:

- Größe 31.642 Byte;
- SHA-256
  `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`;
- 19 reguläre DOCX-Paketeinträge, keine Makros, ActiveX-Inhalte,
  Einbettungen, externen Beziehungen, Kommentare oder Änderungsverfolgung;
- ausschließlich synthetische Kommune, Anschrift, Kontakt-, Konto- und
  Rechtstexte; keine lokale Pilotkommunenbezeichnung und keine echten
  Verwaltungsdaten;
- 24 technisch geschlossene Platzhalter, davon 23 für den ersten Kandidaten
  zugeordnet und `EMPFAENGER_ANREDE` ausdrücklich zurückgestellt.

Die Datei bleibt ignorierter lokaler Testquellbestand und wird in diesem
dokumentarischen Chat weder verändert noch versioniert. Die spätere
technische Umsetzung darf daraus eine repositorygeeignete synthetische
Test-Fixture ableiten. Dabei muss sie `EMPFAENGER_ANREDE` samt leer werdender
Zeile entfernen, die übrigen synthetischen Festtexte beibehalten und die
Quelle anhand der genannten Prüfsumme identifizieren. Eine konkrete kommunale
Produktivvorlage darf nicht in Git übernommen werden.

### Feldgenauer Vertrag des ersten Kandidaten

Alle variablen Werte werden bei jeder Erzeugung neu aus dem aktuellen
kanonischen Cemaris-Stand gelesen. Ein fehlender, leerer, nicht eindeutig
zuordenbarer oder nicht mehr aktueller Pflichtwert bricht die Erzeugung mit
einer verständlichen feldbezogenen Meldung ab; es entsteht keine Teil- oder
Restdatei.

| Platzhalter | Verbindliche Quelle und Darstellung | Pflicht |
| --- | --- | --- |
| `AKTENZEICHEN` | Referenz der Fallakte des 6b-Entwurfs | ja |
| `BESCHEIDDATUM` | `NoticeDate` des aktiven 6b-Entwurfs, deutsches Datum | ja |
| `BESCHEIDNUMMER` | unveränderlicher `NoticeNumber`-Snapshot des 6b-Entwurfs | ja |
| `EMPFAENGER_NAME` | aktueller vollständiger Name beziehungsweise Organisationsname der bestätigten zahlungspflichtigen Partei | ja |
| `EMPFAENGER_STRASSE_HAUSNUMMER` | aktuelle primäre Postanschrift der bestätigten zahlungspflichtigen Partei | ja |
| `EMPFAENGER_PLZ`, `EMPFAENGER_ORT` | aktuelle primäre Postanschrift derselben Partei | ja |
| `FRIEDHOF` | Name des mit der ausgewählten Beisetzung verknüpften Friedhofs | ja |
| `GRABART` | Name der kanonischen Grabart der verknüpften Grabstelle | ja |
| `GRABBEZUG` | kanonische Grabstellenbezeichnung beziehungsweise -referenz | ja |
| `VERSTORBENE_PERSON` | Vor- und Nachname der mit der ausgewählten Beisetzung verknüpften verstorbenen Person | ja |
| `BEISETZUNGSDATUM` | tatsächliches Beisetzungsdatum der ausgewählten Beisetzung, deutsches Datum | ja |
| `GEBUEHR_BEZEICHNUNG` | bestätigter `FeeReasonOrSource` des 6b-Entwurfs, ohne Gebührenkatalogableitung | ja |
| `GEBUEHR_BETRAG`, `GESAMTBETRAG` | bestätigter `TotalAmount` des 6b-Entwurfs in EUR, deutsches Währungsformat; bei genau einer Position identisch | ja |
| `ZAHLUNGSFRIST` | `DueDate` des 6b-Entwurfs, deutsches Datum; keine Neuberechnung | ja |
| `KONTAKT_NAME` | `Vorname Nachname` des erzeugenden Benutzerkontos; niemals Benutzername oder vorhandener Anzeigename | ja |
| `KONTAKTSTELLE`, `KONTAKT_ZIMMER`, `KONTAKT_TELEFON`, `KONTAKT_EMAIL` | getrennte Kontaktfelder des erzeugenden Benutzerkontos | ja |
| `RECHTSGRUNDLAGE` | Name der manuell ausgewählten aktiven Satzungsversion | ja |
| `RECHTSGRUNDLAGE_FASSUNGSSTAND` | Fassungsstand derselben ausgewählten Satzungsversion | ja |
| `EMPFAENGER_ANREDE` | keine kanonische Quelle; keine Ableitung aus Name, Benutzername oder Geschlecht | nein, nicht Bestandteil des ersten Kandidaten |

`KONTAKT_NAME` erfordert neue getrennte Benutzerfelder `Vorname` und
`Nachname`. Die vorhandenen Felder `Username` und `DisplayName` bleiben für
Anmeldung beziehungsweise Audit unverändert. Vorname, Nachname,
Kontaktstelle, Zimmer, Telefon und E-Mail dürfen für die allgemeine
Kontonutzung leer sein; für eine Dokumenterzeugung müssen alle sechs Werte
vorliegen. Nur `Administration` ändert diese Werte in der Benutzerverwaltung;
der angemeldete Benutzer darf die eigenen Kontaktwerte lesen.

Die Satzungsstammdaten speichern keinen Satzungsvolltext und führen keine
automatische Rechtsprüfung aus. `Administration` legt eine benannte Version
mit Fassungsstand an, ändert sie nachvollziehbar über eine neue interne
Version und schaltet sie aktiv oder inaktiv. Sachbearbeitung wählt bei der
Erzeugung genau eine aktive Satzungsversion. Cemaris leitet die Auswahl weder
aus Datum, Friedhof noch Fall ab. Bereits im Audit referenzierte ältere
Versionen bleiben erhalten.

Nicht benötigt und ausdrücklich zurückgestellt sind
`GEBUEHR_LEISTUNGSZEITRAUM`, `DOKUMENTTITEL` und
`ZAHLUNGSINFORMATIONEN`: Die Beisetzungsgebühr ist kein Nutzungsrechtszeitraum;
Titel und Zahlungsinformationen sind Festtext der kommunalen Vorlage.

### Ergänzte Qualitäts-, Rollen- und Betriebsentscheidung

- Erzeugbar ist ausschließlich ein aktiver `NoticeDraft` im Status `Draft`
  mit genau einem starken aktuellen `If-Match`-ETag. Der Aufruf benennt genau
  eine zum selben Fall gehörende Beisetzung und genau eine aktive
  Satzungsversion. Die Erzeugung mutiert keine Fachfakten und benötigt keine
  zusätzliche Fachrevision.
- DOCX muss sich mit der aktuell unterstützten Desktop-Version von Microsoft
  Word ohne Reparaturdialog öffnen lassen. PDF muss DIN A4, unverschlüsselt,
  druckbar und mit auswählbarem Text ausgegeben werden und die synthetische
  Vorlage visuell abbilden. PDF/A, PDF/UA, Signatur und Siegel sind nicht Teil
  des Kandidaten.
- „Drucken“ bedeutet Download beziehungsweise Öffnen des PDF im Client und
  Nutzung des dortigen Druckdialogs. Cemaris steuert keinen Serverdrucker.
- Sachbearbeitung und Administration dürfen im Rahmen ihrer bestehenden
  Fallaktenrechte erzeugen. Es entsteht keine neue Rolle und kein
  Freigabe-/Vier-Augen-Status.
- Der inhaltsfreie Audit enthält Fall-ID, Entwurfs-ID und -version,
  Akteurs-ID, UTC-Zeitpunkt, Format sowie Erfolg oder stabile Fehlerklasse.
  Satzungs-ID und interne Satzungsversion dürfen zur Nachvollziehbarkeit
  ergänzt werden. Dokumentinhalt, Dateipfad, Datei, Empfänger-, Kontakt-,
  Betrags- und Freitextwerte werden nicht gespeichert.
- Auditereignisse folgen der für Fall- und allgemeine Audits kommunal
  festgelegten Aufbewahrung und Löschung. Das Gate erfindet keine eigene
  kalendarische Frist.
- Temporärdateien liegen ausschließlich in einem je Erzeugung isolierten
  Cemaris-Verzeichnis, werden nach Erfolg, Fehler oder Abbruch unmittelbar
  entfernt und bei einem verwaisten Rest beim nächsten Anwendungsstart erneut
  bereinigt. Das Ergebnisdokument wird nicht serverseitig gespeichert.
- Die kommunale DOCX-Vorlage liegt je Installation in einem festen
  Vorlagenunterverzeichnis des Cemaris-Programmverzeichnisses. Cemaris liest
  sie nur; Sachbearbeitung meldet Änderungen an die Serveradministration.
- Eine Neuerzeugung verwendet aktuelle Daten und die aktuelle
  Servervorlage. Sie ist keine Reproduktion und keine Korrektur eines früheren
  Exports.
- Keine Winyard-/DMS-/FINANZ+-Anbindung, kein Versand, keine Bekanntgabe,
  kein Rückimport, kein EDWALT-Zugriff, kein Backfill und keine Migration.
  Produktivaktivierung bleibt nach technischer und synthetischer Abnahme ein
  gesonderter Schritt.

### Endgültige Freigabematrix

| Gate | Endstatus | Quellenbelegte Entscheidung | Freigabefunktion und Restunsicherheit |
| --- | --- | --- | --- |
| NG-01 | `BESTÄTIGT` | genau ein Gebührenbescheidentwurf für Beisetzungsgebühren | Fach/Projekt; keine |
| NG-02 | `BESTÄTIGT` | rechtlich wirkungsloser Vorschlag; keine Cemaris-Festsetzung oder -Bekanntgabe | Fach und Recht/Satzung; keine |
| NG-03 | `BESTÄTIGT` | 23 Pflichtplatzhalter feldgenau auf aktuelle kanonische Daten gebunden; Pflichtfeldabbruch; Anrede zurückgestellt | Fach, Recht, Finanz und Datenschutz; keine im Kandidaten |
| NG-04 | `BESTÄTIGT` | kommunal verantwortete read-only Servervorlage und verifizierte synthetische Testquelle | Fach, Recht, Datenschutz, Sicherheit und Betrieb; keine im Kandidaten |
| NG-05 | `BESTÄTIGT` | DOCX, PDF und clientseitiger Druck mit überprüfbaren Mindestkriterien; keine PDF/A-/PDF/UA-/Signaturpflicht | Fach und Betrieb; keine |
| NG-06 | `BESTÄTIGT` | bestehende Rollen/Fallrechte, starker Entwurfs-ETag, keine Fachmutation, sparsamer Audit | Fach, Datenschutz und Sicherheit; keine |
| NG-07 | `BESTÄTIGT` | Ausgabe beendet Cemaris-Vorgang; keine Zustellung, Rücknahme oder Korrekturoperation | Fach und Recht/Satzung; keine |
| NG-08 | `BESTÄTIGT` | kein Dokumentbestand, isolierte sofortige Temp-Bereinigung, Audit nach kommunaler Fall-/Auditregel | Datenschutz, Sicherheit und Betrieb; keine |
| NG-09 | `BESTÄTIGT` | Cemaris und aktuelle kanonische Daten führen; kein Rückkanal; klarer Fehler, kein Teilergebnis, Wiederholung möglich | Betrieb und Sicherheit; keine |
| NG-10 | `BESTÄTIGT` | synthetische Abnahme, danach gesonderte Pilotaktivierung; keine Altbestände oder Migration | Produkt, Fach, Datenschutz, Sicherheit und Betrieb; keine im technischen Development-Schnitt |

### Endgültige Variantenentscheidung

Genau ein Kandidat ist nun in allen zehn Paketen quellenbelegt,
funktionsbezogen freigegeben und ohne Restunsicherheit innerhalb seines
Geltungsbereichs. **Variante B ist ausgewählt.** Zulässig ist ausschließlich
die Vorbereitung der separaten
[technischen 6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md).
Diese Übergabe ist kein Produktivauftrag und wird erst durch den ausdrücklich
in einem neuen Chat erteilten Implementierungsauftrag wirksam.

Weiter gesperrt bleiben alle weiteren Bescheid- und Dokumentarten,
automatische Gebühren- oder Rechtsberechnung, Empfängeranrede, serverseitiger
Druck, Freigabe/Festsetzung/Rechtswirkung, Signatur/Siegel, Versand,
Bekanntgabe, Rückimport, Dokumentarchivierung, Winyard/DMS, FINANZ+,
Produktivsetzung sowie jede EDWALT-/Altbestandsmigration.
