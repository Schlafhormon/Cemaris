# Authentifizierung, Autorisierung und Auditierung

> **Status:** Teilweise entschieden. Anbieterwahl, Operationsrechte und
> Produktivfreigaben bleiben offen. Details und Quelle stehen in den
> [Produktvorgaben](../requirements/identity-authorization-audit-decisions.md).

## Authentifizierung

Für den späteren Zielbetrieb sind zwei Identitätsquellen zugelassen:

- eine kommunale LDAP-Identitätsquelle;
- eine lokale Benutzerverwaltung mit Benutzername und Passwort.

Die Auswahl je Zielumgebung ist noch offen. OpenID Connect ist derzeit keine
bestätigte Produktvorgabe. Fach- und Auditcode sollen deshalb nur eine stabile,
providerneutrale Akteursidentität verwenden. Der vorhandene Development-
Schreibpfad darf bis zur Anbieterentscheidung ausschließlich einen
serverseitig festgelegten synthetischen Testakteur verwenden; frei gesetzte
Client-Header sind keine vertrauenswürdige Identitätsquelle.

## Autorisierung

Die erste Berechtigungsstufe umfasst genau die Systemrollen
`Sachbearbeitung` und `Administration`. Die Rollen-/Berechtigungsmatrix bis
auf Operationsebene ist noch offen; insbesondere wird aus dem Rollennamen
keine implizite Vollberechtigung abgeleitet. Produktive Endpunkte dürfen erst
nach dieser Entscheidung über ASP.NET-Core-Policies geschützt und freigegeben
werden.

## Auditierung

Für jede erfolgreiche Fallaktenänderung ist als Mindestnachweis bestätigt:

- serverseitiger Zeitpunkt in UTC;
- stabile Akteurskennung und darstellbarer Name;
- Operation, Fallreferenz, gegebenenfalls Zielobjektreferenz und resultierende
  Fallversion;
- atomare Speicherung mit der Fachänderung und der monotonen Fallversion;
- kompakte Darstellung von Name und Zeitpunkt der letzten Änderung in der
  Fallakte.

Abgelehnte und fehlgeschlagene Mutationen werden nicht als erfolgreiche
Änderungen protokolliert. Kann der Auditnachweis nicht gespeichert werden,
wird auch die Fachänderung nicht gespeichert. Der Nachweis bleibt vom
technischen Anwendungslog getrennt und enthält im ersten Inkrement keine
vollständigen Vorher-/Nachher-Kopien personenbezogener Datensätze.

Weiterhin offen sind Einsichtsrechte, Audit-Suche und -Export, Aufbewahrung,
zulässige Löschung, technische Integritätskontrolle und die verantwortliche
fachliche Kontrolle. Deshalb wird zunächst kein Audit-Leseendpunkt angeboten.

Auditdaten dürfen nicht als unkontrollierte Vollkopie personenbezogener Datensätze angelegt werden. Such-, Export- und Zugriffsrechte auf Auditdaten sind eigenständige Anforderungen.

## Betrieb und Datenschutzgrenze

Cemaris ist für On-Premises-Betrieb mit einer eigenen Microsoft-SQL-Server-
Datenbank vorgesehen. Diese Topologie reduziert keine Zugriffsschutz-,
Minimierungs-, Aufbewahrungs-, Sicherungs- oder Freigabeanforderung. Der
synthetische Development-Pfad bleibt daher standardmäßig deaktiviert und darf
weiterhin weder echte Verwaltungsdaten noch eine behauptete Produktivfreigabe
erhalten.
