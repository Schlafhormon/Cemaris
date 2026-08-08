# Authentifizierung, Autorisierung und Auditierung

> **Status:** Leitplanken. Konkrete Verfahren, Rollen und Audit-Ereignisse werden in der Bedarfsanalyse festgelegt.

## Authentifizierung

Die API soll später unterschiedliche Identitätsquellen über standardisierte ASP.NET-Core-Mechanismen anbinden können:

- lokale Benutzerverwaltung,
- Active Directory beziehungsweise LDAP,
- OpenID Connect.

Die Auswahl hängt von der kommunalen Infrastruktur, Netzsegmentierung, Betriebsverantwortung und Anforderungen an Mehrfaktor-Authentifizierung ab. Noch ist kein Verfahren implementiert oder bevorzugt.

## Autorisierung

Ziel ist rollen- und gegebenenfalls richtlinienbasierte Autorisierung am API-Rand. Konkrete Rollen dürfen nicht aus vermuteten Stellenbezeichnungen abgeleitet werden. Zu erheben sind Aufgaben, Vertretungen, Funktionstrennung, Mandanten-/Friedhofsbezug und besonders schützenswerte Operationen.

## Auditierung

Fachlich relevante Änderungen sollen später nachvollziehbar sein. Vor einer Implementierung sind mindestens zu bestimmen:

- welche Ereignisse auditpflichtig sind,
- wer Einsicht erhält,
- welche fachliche Identität und technische Sitzung erfasst werden,
- wie Vorher-/Nachher-Zustände datensparsam abgebildet werden,
- Aufbewahrung, Integrität, Export und Löschung,
- Umgang mit technischen Fehlern und ausgefallener Audit-Speicherung,
- Abgrenzung zwischen Audit Log, Anwendungslog und DMS-Historie.

Auditdaten dürfen nicht als unkontrollierte Vollkopie personenbezogener Datensätze angelegt werden. Such-, Export- und Zugriffsrechte auf Auditdaten sind eigenständige Anforderungen.
