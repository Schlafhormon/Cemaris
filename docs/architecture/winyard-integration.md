# Geplante Winyard-Integration

> **Status:** Zielbild und Fragenkatalog. Es wurde noch keine Winyard-Schnittstelle validiert und kein produktiver Endpunkt angenommen.

## Ziele

- Das DMS bleibt führendes System für elektronische Akten und archivierte Dokumente.
- Cemaris speichert nur notwendige, stabile Referenzen auf externe DMS-Objekte.
- Später erzeugte Bescheide und Schreiben sollen kontrolliert archiviert werden können.
- Der Bezug zwischen Cemaris-Vorgang, DMS-Akte und archiviertem Dokument muss nachvollziehbar sein.
- Fachlogik darf nicht von Winyard-spezifischen Transporten, Payloads oder Identifikatoren abhängen.

## Technischer Erweiterungspunkt

`Cemaris.Application` enthält mit `IDocumentManagementService` eine minimale herstellerneutrale Schnittstelle. Eine spätere Implementierung liegt in `Cemaris.Infrastructure`, beispielsweise als Winyard- oder Entwicklungsadapter.

Die heutige Methode zur Dokumentarchivierung ist ausdrücklich ein vorläufiger Port. Signaturen, Metadaten und Fähigkeiten werden nach Sichtung der Herstellerdokumentation und der kommunalen Prozesse überprüft. Es gibt derzeit keine Winyard-Implementierung und keine simulierten produktiven Endpunkte.

## Abgrenzung

Cemaris soll kein zweites vollständiges DMS aufbauen. Lokale Daten sollen nur gespeichert werden, wenn sie für den Cemaris-Prozess, Suche, Berechtigung, Auditierung oder einen technisch belastbaren Verweis erforderlich sind. Welche Metadaten repliziert werden dürfen und müssen, ist offen.

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

- OFFEN: Darf oder muss Cemaris Akten anlegen?
- OFFEN: Welche Aktenstruktur und welche Aktenzeichen werden verwendet?
- OFFEN: Wie werden Dokumente angelegt, versioniert, abgerufen und gesucht?
- OFFEN: Welche Metadaten sind verpflichtend, optional oder kommunenspezifisch?
- OFFEN: Welche technischen IDs sind stabil und dürfen in Cemaris gespeichert werden?
- OFFEN: Welche Dateitypen und maximalen Dateigrößen werden unterstützt?

### Zuverlässigkeit und Nachvollziehbarkeit

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
