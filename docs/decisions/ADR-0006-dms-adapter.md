# ADR-0006: DMS über Adapter abstrahieren

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Winyard ist die initial vorgesehene Zielintegration für elektronische Akten und archivierte Dokumente. Version, Schnittstellen und konkrete Prozesse sind noch unbekannt. Eine direkte Kopplung der Fachlogik an Herstellerverträge würde spätere Anpassungen erschweren.

## Entscheidung

Die Application-Schicht definiert herstellerneutrale DMS-Ports. Winyard-spezifische Implementierungen, Transporte und Konfigurationen gehören in die Infrastructure-Schicht. Das DMS bleibt führend für Akten und Archivdokumente; Cemaris wird nicht zu einem zweiten vollständigen DMS ausgebaut.

## Folgen

- Der aktuelle `IDocumentManagementService` ist ein minimaler, vorläufiger Erweiterungspunkt.
- Winyard-Endpunkte, Payloads und Authentifizierung werden nicht erfunden.
- Adapter- und Vertragstests benötigen später Herstellerdokumentation und ein Testsystem.
- Andere DMS- oder Entwicklungsadapter bleiben möglich.
