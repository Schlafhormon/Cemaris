# Produktvorgaben zu Identität, Rollen, Änderungsnachweis und Betrieb

Stand: 13.08.2026

## Zweck und Quelle

Dieses Dokument trennt die im Implementierungsdialog vom 13.08.2026
mitgeteilten Produktvorgaben von weiterhin offenen Sicherheits-, Betriebs- und
Freigabeentscheidungen. Quelle ist `USR-2026-08-13`, die direkte Angabe des
Projektverantwortlichen im Cemaris-Implementierungsdialog. Benannte
Freigabeverantwortliche für kommunale IT, Informationssicherheit und
Datenschutz liegen noch nicht vor.

Die Vorgaben erlauben eine providerneutrale Änderungszuordnung für den
synthetischen Development-Schreibpfad. Sie erlauben noch keine produktive
Authentifizierung, Autorisierung oder Verarbeitung echter Verwaltungsdaten.

## Bestätigte Produktvorgaben

| ID | Status | Vorgabe | Geltungsbereich | Akzeptanzkern | Noch offen |
| --- | --- | --- | --- | --- | --- |
| REQ-ID-001 | BESTÄTIGT | Cemaris soll entweder eine kommunale LDAP-Identitätsquelle oder eine lokale Anmeldung mit Benutzername und Passwort unterstützen. | spätere produktive Anmeldung | Die technische Architektur koppelt Fach- und Auditcode nicht fest an genau einen Anbieter. | Auswahl je Zielumgebung, konkretes Protokoll und Betriebsmodell |
| REQ-AUTH-001 | BESTÄTIGT | Es gibt zunächst genau die beiden Systemrollen `Sachbearbeitung` und `Administration`. | erste produktive Berechtigungsstufe | Keine dritte Rolle wird ohne neue Produktentscheidung ergänzt. | Erlaubnis/Verweigerung je vorhandener Operation, Vertretung und gegebenenfalls Datenbezug |
| REQ-AUD-001 | BESTÄTIGT | Änderungen müssen nachvollziehbar protokollieren, wann wer was geändert hat. | schreibende Fallakten | Jede erfolgreiche Änderung besitzt Zeitpunkt, stabile Akteurskennung, darstellbaren Namen, Operation, Fallreferenz und resultierende Fallversion. | Einsichtsrecht, Suche/Export, Aufbewahrung und zulässige Löschung |
| REQ-AUD-002 | BESTÄTIGT | In der Fallaktenoberfläche genügt zunächst eine kompakte Angabe wie „Zuletzt geändert durch …“. | Fallansicht und Bearbeitung | Die letzte erfolgreiche Änderung wird mit Name und Zeitpunkt dargestellt. | spätere vollständige Auditansicht |
| REQ-OPS-001 | BESTÄTIGT | Cemaris ist als On-Premises-Anwendung mit einer eigenen Microsoft-SQL-Server-Datenbank vorgesehen. | Zielbetrieb | Identitäts- und Auditarchitektur bleibt für On-Premises-Betrieb geeignet. | Topologie, Backup, Wiederherstellung, Hochverfügbarkeit und Betriebsverantwortung |
| REQ-DEV-001 | BESTÄTIGT | Für lokale Integrationstests steht die SQL-Server-Instanz `CEMARISDEV` zur Verfügung. | ausschließlich lokale Entwicklung und Tests | Temporäre, eindeutig benannte Testdatenbanken dürfen über die vorhandenen SQL-Integrationstests verwendet werden. | lokale Authentifizierungs-/Verbindungsdetails, falls die dokumentierte integrierte Anmeldung nicht funktioniert |

## Verbindliche Auslegung für das nächste Inkrement

- LDAP und lokale Konten sind zwei zulässige Kandidaten. Die Formulierung
  „LDAP oder Benutzername und Passwort“ ist keine Entscheidung für einen der
  beiden Anbieter.
- `Sachbearbeitung` und `Administration` sind Systemrollen. Die Anzahl
  konkreter Benutzerkonten ist davon unabhängig.
- Der Änderungsnachweis wird getrennt vom technischen Anwendungslog
  gespeichert. Er enthält keine unkontrollierte Kopie vollständiger
  Personen-, Grab- oder Beisetzungsdatensätze.
- Eine fehlgeschlagene, abgelehnte oder wegen eines veralteten ETags
  verworfene Änderung erzeugt weder eine neue Fallversion noch einen
  erfolgreichen Auditdatensatz.
- Fachänderung, monotone Fallversion, letzte Änderungszuordnung und
  Auditdatensatz müssen atomar gespeichert werden. Scheitert der
  Auditdatensatz, wird die Fachänderung vollständig zurückgerollt.
- Für das Development-Inkrement wird genau ein fest im Server verdrahteter,
  eindeutig synthetisch benannter Testakteur verwendet. Identitätswerte aus
  frei setzbaren HTTP-Headern werden nicht vertraut.
- Der produktive Anbieter, Passwortregeln, LDAP-Details und die
  Berechtigungsmatrix werden in diesem Inkrement nicht implementiert.

Diese Auslegung ist eine technische Sicherheits- und Datenminimierungsgrenze,
keine zusätzliche Friedhofsfachregel.

## Weiterhin offene Freigabepunkte

| Gate | Status | Benötigte Entscheidung |
| --- | --- | --- |
| Identitätsanbieter je Zielumgebung | OFFEN | LDAP einschließlich konkretem sicheren Protokoll und stabiler Kennung oder lokale Konten einschließlich sicherem Konto- und Passwortlebenszyklus auswählen. |
| Rollen-/Berechtigungsmatrix | OFFEN | Für Suche, Falldetail und jede vorhandene Mutation festlegen, was `Sachbearbeitung` und `Administration` dürfen beziehungsweise ausdrücklich nicht dürfen. |
| Kontenlebenszyklus | OFFEN | Provisionierung, Sperrung, Ausscheiden, Notfallzugang, Dienstkonten und Sitzungsdauer festlegen. |
| Audit-Einsicht und -Lebenszyklus | OFFEN | Zugriff, Suche/Export, Aufbewahrung, Integritätskontrolle und zulässige Löschung festlegen. |
| Betriebsfreigabe | OFFEN | TLS/Reverse Proxy, Secret-Verwaltung, Datenbanksicherung, Wiederherstellung, Monitoring und Verantwortliche festlegen. |
| Datenschutzfreigabe | OFFEN | Zweck, Datenminimierung, Zugriffsbegrenzung, Aufbewahrung und gegebenenfalls weitere organisatorische Anforderungen prüfen und freigeben. |

## Einordnung der On-Premises-Vorgabe

Der Betrieb auf eigenen Servern und in einer eigenen SQL-Datenbank ist eine
bestätigte Architektur- und Betriebsanforderung. Er beseitigt nicht von selbst
die Notwendigkeit für Zugriffsschutz, Datenminimierung, Protokollbegrenzung,
Aufbewahrungsentscheidungen, Backups und eine Datenschutzprüfung. Cemaris
behauptet daher weiterhin keine Datenschutz- oder Produktivfreigabe.

