# Produktvorgaben zu Identität, Rollen, Änderungsnachweis und Betrieb

Stand: 13.08.2026

## Zweck und Quelle

Dieses Dokument trennt die in den Implementierungsdialogen vom 13.08.2026
mitgeteilten Produktvorgaben von weiterhin offenen Sicherheits-, Betriebs- und
Freigabeentscheidungen. Quellen sind `USR-2026-08-13` und
`USR-2026-08-13-IDENTITY`, die direkten Angaben des Projektverantwortlichen im
Cemaris-Implementierungsdialog. Benannte
Freigabeverantwortliche für kommunale IT, Informationssicherheit und
Datenschutz liegen noch nicht vor.

Die Vorgaben bestätigen lokale Cemaris-Konten als Standard und legen die
erste Rollenabgrenzung fest. Sie erlauben die Implementierung und technische
Verifikation dieser Identitäts- und Berechtigungsgrundlage, aber noch keine
Verarbeitung echter Verwaltungsdaten oder umfassende Produktivfreigabe.

## Bestätigte Produktvorgaben

| ID | Status | Vorgabe | Geltungsbereich | Akzeptanzkern | Noch offen |
| --- | --- | --- | --- | --- | --- |
| REQ-ID-001 | BESTÄTIGT | Lokale Cemaris-Benutzerkonten mit Benutzername und Passwort sind der Standard für die erste produktive Identitätsstufe. | Anmeldung und Benutzerverwaltung | Lokale Konten werden sicher in der eigenen SQL-Server-Datenbank verwaltet; Passwörter werden nur mit einem etablierten Framework-Hasher gespeichert. | finale Passwort-, Sitzungs- und Betriebsparameter |
| REQ-ID-002 | BESTÄTIGT | Konten sollen später aus einem kommunalen LDAP-Verzeichnis importiert oder synchronisiert werden können. | späterer Ausbau | Fach- und Auditcode bleiben providerneutral; stabile Cemaris-Benutzer-IDs dürfen nicht von veränderlichen LDAP-Namen abhängen. | Import-/Synchronisationsrichtung, Attribut- und Rollenmapping, Konflikte, Deaktivierung und Wiederholung |
| REQ-ID-003 | BESTÄTIGT | Im nächsten Inkrement werden ausschließlich lokale Konten implementiert. | Inkrement 3b | Es entstehen weder LDAP-Bind, LDAP-Anmeldung, LDAP-Importcode noch ein vorweggenommenes Mapping. | eigener späterer LDAP-Inkrement |
| REQ-AUTH-001 | BESTÄTIGT | Es gibt zunächst genau die beiden Systemrollen `Sachbearbeitung` und `Administration`. | erste produktive Berechtigungsstufe | Keine dritte Rolle wird ohne neue Produktentscheidung ergänzt. | Vertretung und gegebenenfalls späterer Datenbezug |
| REQ-AUTH-002 | BESTÄTIGT | Sachbearbeitung darf alle fachlichen Daten erfassen und bearbeiten, einschließlich späterer Stammdatenpflege. | Fachfunktionen | Suche, Falldetail und alle vorhandenen Fallmutationen sind für `Sachbearbeitung` erlaubt; künftige fachliche Stammdatenpflege verwendet dieselbe Fachpolicy. | Löschen, Storno und weitere noch nicht bestätigte Fachoperationen |
| REQ-AUTH-003 | BESTÄTIGT | Administrative Programmkonfiguration, Benutzerverwaltung und Formularvorlagen sind ausschließlich `Administration` vorbehalten. | administrative Funktionen | `Sachbearbeitung` erhält serverseitig `403`; die UI-Ausblendung ist nur ergänzend. | konkrete Konfigurations- und Formularfunktionen in späteren Inkrementen |
| REQ-AUTH-004 | BESTÄTIGT | `Administration` umfasst zusätzlich die vorhandenen fachlichen Lese- und Bearbeitungsrechte. | erste Rollenmatrix | Beide Rollen können die vorhandenen Fallfunktionen verwenden; nur administrative Funktionen sind exklusiv. | spätere organisatorische Trennung, falls ausdrücklich beschlossen |
| REQ-AUD-001 | BESTÄTIGT | Änderungen müssen nachvollziehbar protokollieren, wann wer was geändert hat. | schreibende Fallakten | Jede erfolgreiche Änderung besitzt Zeitpunkt, stabile Akteurskennung, darstellbaren Namen, Operation, Fallreferenz und resultierende Fallversion. | Aufbewahrung, Integritätskontrolle und zulässige Löschung |
| REQ-AUD-002 | BESTÄTIGT | In der Fallaktenoberfläche genügt eine kompakte Angabe wie „Zuletzt geändert durch …“. | Fallansicht und Bearbeitung | Die letzte erfolgreiche Änderung wird mit Name und Zeitpunkt dargestellt. | keine vollständige Auditansicht im Programm |
| REQ-AUD-003 | BESTÄTIGT | Vollständige Auditdaten sind im Cemaris-Programm nicht einsehbar. | API und Benutzeroberfläche | Es gibt keinen Audit-Lese-, Such- oder Exportendpunkt und keine Auditseite, auch nicht für `Administration`. | externe Aufbewahrung, Auswertung und Löschung im Betrieb |
| REQ-AUD-004 | BESTÄTIGT | Sicherheits- und Betriebsereignisse werden datensparsam in technischen Logs protokolliert; darauf hat nur die zuständige Betriebsadministration außerhalb der Cemaris-Oberfläche Zugriff. | Betrieb | Keine Passwörter, Sitzungstickets, Request-Bodies oder vollständigen Verwaltungsdaten in Logs; die Cemaris-Rolle allein eröffnet keinen Logzugriff. | konkretes Logziel, Rotation, Aufbewahrung und organisatorische Verantwortliche |
| REQ-OPS-001 | BESTÄTIGT | Cemaris ist als On-Premises-Anwendung mit einer eigenen Microsoft-SQL-Server-Datenbank vorgesehen. | Zielbetrieb | Identitäts- und Auditarchitektur bleibt für On-Premises-Betrieb geeignet. | Topologie, Backup, Wiederherstellung, Hochverfügbarkeit und Betriebsverantwortung |
| REQ-DEV-001 | BESTÄTIGT | Für lokale Integrationstests steht die SQL-Server-Instanz `CEMARISDEV` zur Verfügung. | ausschließlich lokale Entwicklung und Tests | Temporäre, eindeutig benannte Testdatenbanken dürfen über die vorhandenen SQL-Integrationstests verwendet werden. | lokale Authentifizierungs-/Verbindungsdetails, falls die dokumentierte integrierte Anmeldung nicht funktioniert |

## Verbindliche Auslegung für das nächste Inkrement

- Lokale Konten sind der verbindliche Standard und der einzige
  Identitätsumfang des nächsten Inkrements. LDAP bleibt ausschließlich als
  späterer Kontoimport oder spätere Synchronisation vorgesehen.
- `Sachbearbeitung` und `Administration` sind Systemrollen. Die Anzahl
  konkreter Benutzerkonten ist davon unabhängig.
- Beide Rollen dürfen die vorhandenen fachlichen Fallfunktionen lesen und
  bearbeiten. Künftige Stammdatenpflege ist fachlich und damit ebenfalls für
  `Sachbearbeitung` zulässig. Benutzerverwaltung, administrative
  Programmkonfiguration und Formularvorlagen sind `Administration`
  vorbehalten.
- Der Änderungsnachweis wird getrennt vom technischen Anwendungslog
  gespeichert. Er enthält keine unkontrollierte Kopie vollständiger
  Personen-, Grab- oder Beisetzungsdatensätze.
- Eine fehlgeschlagene, abgelehnte oder wegen eines veralteten ETags
  verworfene Änderung erzeugt weder eine neue Fallversion noch einen
  erfolgreichen Auditdatensatz.
- Fachänderung, monotone Fallversion, letzte Änderungszuordnung und
  Auditdatensatz müssen atomar gespeichert werden. Scheitert der
  Auditdatensatz, wird die Fachänderung vollständig zurückgerollt.
- Der bisherige synthetische Akteur bleibt ausschließlich eine explizite
  Development-/Testhilfe. Im lokalen Identitätsmodus stammt der Akteur aus der
  serverseitig validierten Sitzung; frei setzbare HTTP-Header werden nicht
  vertraut.
- Auditdaten werden weiterhin atomar und getrennt vom technischen
  Anwendungslog gespeichert. Sie erhalten keine Anwendungsoberfläche. Login,
  Logout, fehlgeschlagene Anmeldung sowie administrative Kontenänderungen
  erzeugen datensparsame strukturierte Sicherheitslogs ohne Secrets.
- Nicht vorhandene Module für Stammdaten, Programmkonfiguration oder
  Formularvorlagen werden durch diese Rollenentscheidung nicht vorgezogen.

Diese Auslegung ist eine technische Sicherheits- und Datenminimierungsgrenze,
keine zusätzliche Friedhofsfachregel.

## Weiterhin offene Freigabepunkte

| Gate | Status | Benötigte Entscheidung |
| --- | --- | --- |
| Lokale Identitätsgrundlage | BESTÄTIGT | Lokale Konten zuerst umsetzen; LDAP-Import/-Synchronisation bleibt ein eigener späterer Auftrag. |
| Rollen-/Berechtigungsmatrix | TEILWEISE BESTÄTIGT | Fachfunktionen für beide Rollen; Benutzerverwaltung, Programmkonfiguration und Formularvorlagen nur Administration; neue Operationen jeweils ergänzend klassifizieren. |
| Kontenlebenszyklus | TECHNISCH ZU KONKRETISIEREN | Sichere Provisionierung des ersten Admins, Aktivierung/Sperrung, Passwortwechsel/-zurücksetzung, letzter aktiver Admin und Sitzungsdauer im Implementierungsentwurf festlegen und testen. |
| Audit-Einsicht | BESTÄTIGT | Keine Auditansicht, -suche oder -export im Programm; externer Logzugriff nur durch Betriebsadministration. |
| Audit- und Loglebenszyklus | OFFEN | Aufbewahrung, Integritätskontrolle, Rotation, externe Auswertung und zulässige Löschung betrieblich festlegen. |
| Betriebsfreigabe | OFFEN | TLS/Reverse Proxy, Secret-Verwaltung, Datenbanksicherung, Wiederherstellung, Monitoring und Verantwortliche festlegen. |
| Datenschutzfreigabe | OFFEN | Zweck, Datenminimierung, Zugriffsbegrenzung, Aufbewahrung und gegebenenfalls weitere organisatorische Anforderungen prüfen und freigeben. |

## Einordnung der On-Premises-Vorgabe

Der Betrieb auf eigenen Servern und in einer eigenen SQL-Datenbank ist eine
bestätigte Architektur- und Betriebsanforderung. Er beseitigt nicht von selbst
die Notwendigkeit für Zugriffsschutz, Datenminimierung, Protokollbegrenzung,
Aufbewahrungsentscheidungen, Backups und eine Datenschutzprüfung. Cemaris
behauptet daher weiterhin keine Datenschutz- oder Produktivfreigabe.
