# ADR-0005: Modularer Monolith

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Die Fachanforderungen und sinnvollen Modulgrenzen sind noch unbekannt. Eine Microservice-Landschaft würde bereits jetzt verteilte Datenhaltung, Kommunikation, Deployment, Monitoring und Fehlerfälle erzwingen, ohne dass ein entsprechender Nutzen belegt ist.

## Entscheidung

Cemaris startet als modularer Monolith mit einer API-Deployment-Einheit und klar getrennten Domain-, Application- und Infrastructure-Schichten. Fachmodule können innerhalb dieses Monolithen entstehen, sobald die Bedarfsanalyse belastbare Grenzen liefert.

## Folgen

- Transaktionen und lokale Entwicklung bleiben überschaubar.
- Modulgrenzen werden durch Projekt- und Namespace-Abhängigkeiten geschützt.
- Unkontrollierte Querverweise und globale „Shared“-Ablagen sind zu vermeiden.
- Eine spätere Auskopplung ist möglich, aber nur bei messbarem fachlichem oder betrieblichem Bedarf.
