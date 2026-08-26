# ADR-0018: Kanonische manuelle Bescheidentwürfe vor Bescheiderzeugung

Status: Accepted

Datum: 26.08.2026

## Kontext

Die lesende MVP-Projektion enthält nullable `ReadNotices` und `ReadFeeItems`.
Sie besitzt weder einen freigegebenen Schreibvertrag noch kanonische
Zahlungspflichtige, Nummernkonfiguration, Zustände, Versionen oder
Fachrevisionen. Eine Rückinterpretation würde technische Altprojektionen und
synthetische Fixtures fälschlich zum Fachmodell erklären.

Das Freigabegate 6a-F bestätigt nun genau einen kleinen technischen
Development-Schnitt: mehrere rechtlich wirkungslose, manuell befüllte
Bescheidentwürfe je Fall. Bescheiderzeugung, Bekanntgabe, Berechnung,
FINANZ+-Integration und Migration bleiben ausdrücklich offen.

## Entscheidung

Cemaris führt additiv einen kanonischen Bescheidentwurfskern neben der
unveränderten Leseprojektion ein:

- Jeder Entwurf besitzt eine stabile Identität, genau einen vorhandenen Fall,
  genau einen kanonischen Zahlungspflichtigen, eine unveränderliche
  automatisch vergebene Nummer und die freigegebenen manuellen
  Bescheid-/Finanzfakten.
- Ein Fall darf mehrere voneinander unabhängige Entwürfe besitzen. Es wird
  keine nicht belegte Beziehung zwischen ihnen konstruiert.
- Der aktuelle Nutzungsberechtigte darf nur als sichtbarer Vorschlag dienen.
  Die speichernde Person muss den Zahlungspflichtigen ausdrücklich bestätigen;
  Rechteinhaberschaft wird nie als Zahlungspflicht abgeleitet.
- Ein Entwurf besitzt nur `Draft` und `Discarded`. Korrekturen und Verwerfen
  sind begründet, versioniert und historisiert; es gibt kein physisches
  Löschen, Wiederherstellen oder Überschreiben eines verworfenen Entwurfs.
- Eine installationweite versionierte Nummernkonfiguration liefert
  Finanzprodukt und Stellenzahl. Die Nummer folgt dem festen Muster
  `Finanzprodukt.JahrLaufnummer`. Eine atomare, je Kalenderjahr fortlaufende
  Sequenz vergibt jede Zahl höchstens einmal und läuft über
  Konfigurationsversionen hinweg weiter.
- Der Entwurf speichert die verwendete Konfigurationsidentität und -version
  sowie Finanzprodukt und Stellenzahl als Snapshot. Änderungen gelten nur
  prospektiv; vorhandene Nummern ändern sich nicht.
- Jede erfolgreiche Mutation schreibt aktuellen Zustand, monotone Version,
  unveränderliche vollständige Fachrevision und sparsamen technischen Audit
  atomar. Fachrevision und technischer Audit bleiben getrennt.
- Eine eigene, standardmäßig deaktivierte und ausschließlich in
  `Development` zulässige Capability schützt den gesamten Entwurfskern.
  Fachoperationen stehen `Sachbearbeitung` und `Administration` offen;
  Nummernkonfiguration bleibt über die administrative
  Programmkonfigurationspolicy ausschließlich `Administration` vorbehalten.
- Synthetic- und SQL-Provider implementieren denselben Vertrag. Der
  SQL-Anteil entsteht durch eine reguläre additive EF-Core-Migration.

## Gründe

Der separate Kern macht den bestätigten manuellen Arbeitsbedarf
implementierbar, ohne die nullable Altprojektion fachlich aufzuwerten. Die
ausdrückliche Zahlungspflichtigenbestätigung erhält die fachliche Trennung zum
Nutzungsrecht und vermindert Fehlzuordnungen.

Eine unveränderliche Nummer bereits am Entwurf, atomare Jahressequenzen und
Konfigurationssnapshots verhindern Wiederverwendung, Parallelitätsdubletten
und rückwirkende Umnummerierung. Fachrevisionen rekonstruieren die
Entwurfsentwicklung, während der sparsame Audit keine Finanz- oder
Personenvollkopien erhält.

Die neue Capability bewahrt die bestehende sichere Default-Konfiguration und
macht deutlich, dass die funktionsbezogene Freigabe nur für den synthetischen
Development-Piloten gilt.

## Folgen

- Inkrement 6b benötigt ein neues Domain-/Application-Modul, providerneutrale
  Stores, EF-Entitäten, Constraints, Migration, API-/OpenAPI-Verträge und eine
  zugängliche Fallaktenoberfläche.
- Die vollständige Bescheidnummer ist global eindeutig. Eine verbrauchte Zahl
  wird auch nach Verwerfen nicht erneut vergeben; Lücken sind zulässig.
- Fehlt die Konfiguration oder reicht ihre Stellenzahl nicht aus, scheitert
  die Entwurfsanlage vollständig ohne Teilwirkung.
- `ReadNotices`, `ReadFeeItems`, bestehende Suche und nullable Falldetails
  bleiben unverändert. Es gibt kein Backfill und keine EDWALT-Auswertung.
- FINANZ+ bleibt führend für Buchung, Zahlung, Mahnung und Finanzstatus.
  Wiederholungsdaten und Buchungstext werden nicht in den Entwurfskern
  aufgenommen.
- Nach 6b ist ein separates Entscheidungsgate für die tatsächliche
  Bescheiderzeugung erforderlich.

## Nicht entschieden

- Gebührenkatalog, Satzpflege, Mengen, Einheiten, Steuern, Ermäßigungen,
  Rundung oder Berechnung;
- automatische Fälligkeit oder Summenbildung;
- Festsetzung, Freigabe, Vier-Augen-Prinzip oder andere Rechtszustände;
- Vorlage, Renderer, PDF/DOCX, Signatur, Versand, Bekanntgabe oder
  Dokumentaufbewahrung;
- Korrektur, Aufhebung oder Storno eines erzeugten Bescheids;
- FINANZ+-Schnittstelle oder Rückkanal;
- Verarbeitung echter Verwaltungsdaten oder produktiver Betrieb;
- EDWALT-Mapping, Backfill oder Migration.

## Verworfene Alternativen

- `ReadNotices` und `ReadFeeItems` direkt schreibbar machen;
- den Zahlungspflichtigen still aus dem Nutzungsberechtigten ableiten;
- Bescheidnummern manuell vergeben oder nach Verwerfen wiederverwenden;
- Konfigurationsänderungen rückwirkend auf bestehende Nummern anwenden;
- bereits in 6b Gebührenberechnung oder Bescheiddokumente implementieren.
