# Geplante Winyard-Integration

> **Status:** Die Winyard-Integration ist als Cemaris-Bedarfsbereich bestätigt
> (`INT-018`, Konfidenz hoch). Die fachlichen Fähigkeiten sind mit `INT-019`
> priorisiert. Die Integration bleibt zunächst optional und soll erst später
> produktiv aktiviert werden (`INT-020`). Schnittstellenvertrag, konkrete
> Version und produktiver Endpunkt sind noch nicht validiert oder festgelegt.

## Aktueller EDWALT-Ist-Befund

Für EDWALT ist keine Winyard-Schnittstelle vorhanden. Organisatorisch
vorgesehen sind das Speichern des erzeugten Bescheids und der anschließende
manuelle Upload nach Winyard ([`INT-017`](../requirements/edwalt-analysis/interview-record.md),
`BESTÄTIGT`, Konfidenz hoch für den vorgesehenen Ablauf). Ob die
Sachbearbeitung dies vollständig praktiziert oder Dokumente lokal
beziehungsweise nur in Papierakten ablegt, ist `OFFEN`. Dieser Befund bestätigt
weder einen produktiven Endpunkt noch die konkrete technische Ausgestaltung
einer späteren Cemaris-Integration.

Die heutige Ablage beruht auf einer internen Arbeitsregel; eine Dienstanweisung
ist geplant. Für das Cemaris-Zielbild ist dieser organisatorische Ist-Befund nur
als Migrations- und Umstellungshinweis relevant. Er ist keine nachzubauende
EDWALT-Funktion. Bestätigt ist dagegen das Ziel, Cemaris künftig über eine
Winyard-Schnittstelle anzubinden
([`INT-018`](../requirements/edwalt-analysis/interview-record.md)).

## Ziele

- Das DMS bleibt führendes System für elektronische Akten und archivierte Dokumente.
- Cemaris muss ohne Winyard produktiv betreibbar sein; die Integration ist ein
  später aktivierbarer, optionaler Adapter.
- Bei aktivierter Integration muss Cemaris im Ablageplan nach Vorgangsart und
  Jahr das passende Ablageziel suchen und eine fehlende Jahresablage unter der
  betreffenden Vorgangsart automatisch anlegen können.
- Vorgangsart und Ablagejahr müssen automatisch aus Fall- und Dokumentkontext
  bestimmt werden; eine routinemäßige manuelle Zielauswahl ist nicht vorgesehen.
- Bei aktivierter Integration muss Cemaris die erforderlichen Metadaten
  übertragen und Erfolg oder Fehler der Ablage anzeigen.
- Fertige Bescheide und Schreiben sollen automatisch archiviert und
  fehlgeschlagene Ablagen später wiederholt werden können.
- Eine dauerhafte Winyard-Dokument-ID und das Öffnen archivierter Dokumente aus
  Cemaris sind fachlich nicht erforderlich (`INT-019`).
- Die Übergabe muss dennoch über Vorgang, Akte, Metadaten und technisches
  Ergebnis nachvollziehbar sein, ohne eine fachliche Dokument-ID-Anforderung
  zu erfinden.
- Fachlogik darf nicht von Winyard-spezifischen Transporten, Payloads oder Identifikatoren abhängen.

## Bestätigter Fähigkeitsschnitt

| ID | Fähigkeit | Priorität | Status | Evidenz |
| --- | --- | --- | --- | --- |
| REQ-DMS-001 | vorhandene Akte beziehungsweise passendes Ablageziel suchen | Muss bei Aktivierung | `BESTÄTIGT` | INT-019/021/023 |
| REQ-DMS-002 | fehlende Jahresablage unter der Vorgangsart automatisch anlegen | Muss bei Aktivierung | `BESTÄTIGT` | INT-019/021/022 |
| REQ-DMS-003 | Metadaten übertragen | Muss bei Aktivierung | `BESTÄTIGT` | INT-019 |
| REQ-DMS-004 | Erfolg oder Fehler anzeigen | Muss bei Aktivierung | `BESTÄTIGT` | INT-019 |
| REQ-DMS-005 | fertige Dokumente automatisch ablegen | Soll bei Aktivierung | `BESTÄTIGT` | INT-019 |
| REQ-DMS-006 | fehlgeschlagene Ablagen später wiederholen | Soll bei Aktivierung | `BESTÄTIGT` | INT-019 |
| REQ-DMS-007 | Winyard-Dokument-ID dauerhaft in Cemaris speichern | nicht nötig | `VERWORFEN` | INT-019 |
| REQ-DMS-008 | abgelegte Dokumente aus Cemaris öffnen | nicht nötig | `VERWORFEN` | INT-019 |
| REQ-DMS-009 | Ablage nach Vorgangsart und Jahr konfigurierbar abbilden | Soll bei Aktivierung | `BESTÄTIGT` | INT-020/021, IMG-INT-001/002 |
| REQ-DMS-010 | Betrieb ohne Winyard und spätere Aktivierung | Muss | `BESTÄTIGT` | INT-020 |
| REQ-DMS-011 | Vorgangsart und Jahr automatisch aus dem Fall bestimmen | Muss bei Aktivierung | `BESTÄTIGT` | INT-023 |

## Technischer Erweiterungspunkt

`Cemaris.Application` enthält mit `IDocumentManagementService` eine minimale herstellerneutrale Schnittstelle. Eine spätere Implementierung liegt in `Cemaris.Infrastructure`, beispielsweise als Winyard- oder Entwicklungsadapter. Die Kernanwendung darf von dessen Verfügbarkeit nicht abhängen (`REQ-DMS-010`).

Die heutige Methode zur Dokumentarchivierung ist ausdrücklich ein vorläufiger Port. Signaturen, Metadaten und Fähigkeiten werden nach Sichtung der Herstellerdokumentation und der kommunalen Prozesse überprüft. Es gibt derzeit keine Winyard-Implementierung und keine simulierten produktiven Endpunkte.

## Abgrenzung

Cemaris soll kein zweites vollständiges DMS aufbauen. Eine dauerhafte
Winyard-Dokument-ID oder Dokumentanzeige in Cemaris ist nicht gefordert. Lokal
dürfen nur die für Prozesszustand, Aktenfindung, Berechtigung, Auditierung,
Fehleranzeige und sichere Wiederholung erforderlichen technischen Daten
gespeichert werden. Welche Daten dies konkret sind, wird erst mit dem
Schnittstellenvertrag festgelegt. Die bereitgestellten Screenshots enthalten
Personen- und Falldaten und wurden nicht in das Repository übernommen; nur die
abstrakte Ablagehierarchie wurde als `IMG-INT-001/002` dokumentiert.

## Noch zu klären

### System und Schnittstelle

- OFFEN: Welche konkrete Winyard-Version wird eingesetzt?
- OFFEN: Welche API-, Webservice- oder sonstigen Integrationsschnittstellen stehen zur Verfügung?
- OFFEN: Existieren Herstellerdokumentation, Beispielclients und ein Testsystem?
- OFFEN: Welche unterstützten Betriebs- und Versionskombinationen gelten?

### Authentifizierung und Berechtigung

- OFFEN: Wie authentifiziert sich Cemaris – Servicekonto, Zertifikat, Token oder anderer Mechanismus?
- OFFEN: Wie werden technische und fachliche Berechtigungen getrennt?
- OFFEN: Welche Rollen sind in Winyard erforderlich?
- OFFEN: Wie werden Secrets und Zertifikate im Betrieb verwaltet und erneuert?

### Akten und Dokumente

- BESTÄTIGT: Cemaris muss vorhandene Akten suchen und bei Bedarf anlegen
  (`REQ-DMS-001/002`).
- BESTÄTIGT: Die heutige und die gewünschte künftige Ablage erfolgen nach
  Vorgangsart und Jahr (`INT-021`).
- BESTÄTIGT: Diese mehrstufige Ablagestruktur soll konfigurierbar sein
  (`REQ-DMS-009`).
- VERWORFEN: Eine Akte je Grabstätte ist nach der Klarstellung `INT-021` nicht
  das Zielmodell.
- BESTÄTIGT: Fehlt die Jahresablage unter der passenden Vorgangsart, legt
  Cemaris sie automatisch an (`INT-022`).
- BESTÄTIGT: Cemaris bestimmt Vorgangsart und Ablagejahr aus dem Fall- und
  Dokumentkontext; abhängig vom Vorgang gilt das Jahr der Bescheiderstellung
  oder Beisetzung (`INT-023`).
- OFFEN: Welche technische Winyard-Objektart, Benennung und Pflichtmetadaten
  sind dafür erforderlich, und wie werden parallele Anlageversuche behandelt?
- OFFEN: Welche vollständige Datumsregel gilt je Dokumentart, und darf eine
  automatisch bestimmte Ablage in Ausnahmefällen manuell korrigiert werden?
- OFFEN: Wie werden Dokumente angelegt, versioniert, abgerufen und gesucht?
- OFFEN: Welche Metadaten sind verpflichtend, optional oder kommunenspezifisch?
- VERWORFEN: Eine Winyard-Dokument-ID als dauerhafte Cemaris-Fachreferenz ist
  nicht erforderlich (`REQ-DMS-007`).
- OFFEN: Welche Dateitypen und maximalen Dateigrößen werden unterstützt?

### Zuverlässigkeit und Nachvollziehbarkeit

- BESTÄTIGT: Erfolg oder Fehler müssen angezeigt werden; fehlgeschlagene
  Ablagen sollen wiederholbar sein (`REQ-DMS-004/006`).
- OFFEN: Welche Fehlerklassen, Timeouts und Wiederholungsregeln bestehen?
- OFFEN: Sind Vorgänge idempotent ausführbar und wie werden Dubletten verhindert?
- OFFEN: Welche Transaktionsgrenzen sind zwischen Cemaris und DMS möglich?
- OFFEN: Welche Auditinformationen liefern Winyard und Cemaris jeweils?
- OFFEN: Wie werden Teilausfälle, Wartungsfenster und nachträgliche Archivierung behandelt?
- OFFEN: Wie wird überwacht, ohne Dokumentinhalte oder Personendaten zu protokollieren?

## Voraussetzungen vor Implementierung

1. Herstellerunterlagen und reale Systemversion erfassen.
2. Relevante Ist-Prozesse und Verantwortlichkeiten aufnehmen.
3. Testsystem und technische Zugangsvoraussetzungen klären.
4. Daten-, Sicherheits- und Fehlerkonzept abstimmen.
5. Adaptervertrag anhand validierter Use Cases überarbeiten.
6. Erst danach einen Winyard-Adapter und Vertragstests implementieren.
