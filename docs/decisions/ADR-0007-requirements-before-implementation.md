# ADR-0007: Fachanforderungen vor Implementierung

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Die Bestandsaufnahme von EDWAL und die Bedarfsanalyse haben noch nicht stattgefunden. Friedhofsrechtliche und kommunale Prozesse können sich nach Kommune, Satzung und Fallkonstellation unterscheiden. Vermutete Regeln im Code würden spätere Analyse verzerren und riskante Scheinsicherheit erzeugen.

## Entscheidung

> Fachliche Regeln werden erst nach Bestands- und Bedarfsanalyse implementiert.

Unbekannte Punkte werden als offene Frage in `docs/requirements/` dokumentiert. Dies gilt insbesondere für Grabarten, Ruhe- und Nutzungsfristen, Gebühren, Satzungslogik, Rollen, Bescheide, Winyard-Aktenstrukturen und EDWAL-Datenmodelle.

## Folgen

- Das initiale Domainprojekt bleibt bewusst leer.
- Pull Requests mit Fachlogik benötigen eine nachvollziehbare Anforderung und fachliche Grundlage.
- Prototypen müssen als solche gekennzeichnet sein und dürfen nicht stillschweigend zu Produktregeln werden.
- Der nächste Projektschritt ist Analyse, nicht die Implementierung weiterer Fachfunktionen.
