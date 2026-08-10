# ADR-0007: Fachanforderungen vor Implementierung

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Die technische Bestandsaufnahme von EDWALT liegt inzwischen vor; die
fachliche Bedarfsanalyse ist noch nicht abgeschlossen. Friedhofsrechtliche und
kommunale Prozesse können sich nach Kommune, Satzung und Fallkonstellation
unterscheiden. Vermutete Regeln im Code würden die Analyse verzerren und
riskante Scheinsicherheit erzeugen.

## Entscheidung

> Fachliche Regeln werden erst nach Bestands- und Bedarfsanalyse implementiert.

Unbekannte Punkte werden als offene Frage in `docs/requirements/`
dokumentiert. Dies gilt insbesondere für Grabarten, Ruhe- und Nutzungsfristen,
Gebühren, Satzungslogik, Rollen, Bescheide, Winyard-Aktenstrukturen und die
fachliche Bedeutung der EDWALT-Daten. Die bestätigte EDWALT-Datenmigration
rechtfertigt kein 1:1-Zielmodell.

## Folgen

- Das initiale Domainprojekt bleibt bewusst leer.
- Pull Requests mit Fachlogik benötigen eine nachvollziehbare Anforderung und fachliche Grundlage.
- Prototypen müssen als solche gekennzeichnet sein und dürfen nicht stillschweigend zu Produktregeln werden.
- Der nächste Projektschritt ist die fachliche Bedarfs- und
  Migrationsanalyse, nicht die ungeprüfte Implementierung von EDWALT-Funktionen.
