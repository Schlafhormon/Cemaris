# Authentifizierung, Autorisierung und Auditierung

> **Status:** Lokale Konten, Cookie-Sitzung, CSRF und die erste Rollenmatrix
> sind implementiert. LDAP-Import, Betriebsparameter und Produktivfreigaben bleiben offen. Details
> und Quelle stehen in den
> [Produktvorgaben](../requirements/identity-authorization-audit-decisions.md).

## Authentifizierung

Lokale Benutzerkonten mit Benutzername und Passwort sind die verbindliche
Standardidentität. Sie werden zuerst und ohne LDAP-Abhängigkeit umgesetzt.
Später sollen Benutzerkonten aus einem kommunalen LDAP-Verzeichnis importiert
oder synchronisiert werden können. LDAP-Anmeldung, Bind-Verfahren,
Attributmapping und Synchronisationsregeln sind nicht Teil des nächsten
Inkrements. OpenID Connect ist weiterhin keine bestätigte Produktvorgabe.

Fach- und Auditcode verwenden ausschließlich eine stabile, providerneutrale
Akteursidentität. Lokale Konten erhalten eine servererzeugte stabile ID, die
nicht vom veränderlichen Benutzernamen oder Anzeigenamen abhängt. Frei gesetzte
Client-Header sind keine vertrauenswürdige Identitätsquelle.

Technisch definiert die Application-Schicht `ICurrentActorProvider` und den
Wert `ActorIdentity` aus stabiler Kennung, Anzeigename und `SystemRole`. Die
Fallaktenlogik kennt weder `HttpContext` noch Claims, LDAP, Passwortkonten oder
EF Core. Der aktuell registrierte `SyntheticDevelopmentActorProvider` ist
eine feste serverseitige Development-Implementierung und keine Anmeldung.

### Umgesetzte lokale Sitzung

`LocalAccounts` speichert stabile GUID, Benutzername und Normalform,
Anzeigename, genau eine Rolle, Framework-Passworthash, Aktiv-/Lockoutstatus,
UTC-Sicherheitszeitpunkte, Security-Stamp und SQL-`rowversion`. Benutzername
und Anzeigename dürfen geändert werden; historische Auditzeilen behalten ID
und damaligen Anzeigenamen.

ASP.NET Core Cookie Authentication stellt ein `HttpOnly`-, `SameSite=Lax`-
Cookie mit standardmäßig 30 Minuten Inaktivitätsdauer aus. Außerhalb von
Development ist `Secure` zwingend. Jede Anfrage gleicht Aktivstatus und
Security-Stamp mit der Datenbank ab. Passwort-, Rollen-, Namens- und
Aktivstatusänderungen erneuern den Stamp und entwerten ältere Sitzungen bei der
nächsten Prüfung. Das Frontend speichert keine Tokens in Web Storage.

Alle zustandsändernden Cookie-Endpunkte einschließlich Login validieren den
ASP.NET-Core-Antiforgery-Vertrag aus HttpOnly-Cookie und Requestheader
`X-Cemaris-CSRF`. Login wird zusätzlich pro Clientadresse begrenzt; fünf
Fehlversuche sperren ein Konto 15 Minuten. Antworten bleiben generisch.

## Autorisierung

Die erste Berechtigungsstufe umfasst genau die Systemrollen
`Sachbearbeitung` und `Administration`. Die serverseitige Grundmatrix lautet:

| Funktionsgruppe | Sachbearbeitung | Administration |
| --- | --- | --- |
| Anmeldung, Abmeldung, eigenes Konto/Passwort | erlaubt | erlaubt |
| Suche und Falldetail | erlaubt | erlaubt |
| Fallakte, Grabbezug, Verstorbene und Beisetzungen erfassen/bearbeiten | erlaubt | erlaubt |
| künftige fachliche Stammdatenpflege | erlaubt | erlaubt |
| Benutzerverwaltung | verweigert | erlaubt |
| künftige administrative Programmkonfiguration | verweigert | erlaubt |
| künftige Formularvorlagenverwaltung | verweigert | erlaubt |
| vollständige Auditdaten in API/UI | verweigert | verweigert |

Löschen, Storno und weitere noch unbekannte Fachoperationen werden aus dieser
Matrix nicht abgeleitet. Autorisierung wird über benannte serverseitige
Policies durchgesetzt; ausgeblendete Navigation allein ist kein Schutz.
Die Policies heißen `CaseWork`, `MasterData`, `UserAdministration`,
`ProgramConfiguration` und `FormTemplates`. Die letzten beiden bereiten nur
die bestätigte Grenze vor und erzeugen keine neuen Module.

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

Vollständige Auditdaten bleiben im Cemaris-Programm grundsätzlich nicht
einsehbar. Es wird weder für `Sachbearbeitung` noch für `Administration` ein
Audit-Lese-, Such- oder Exportendpunkt angeboten. Aufbewahrung, zulässige
Löschung, technische Integritätskontrolle und verantwortliche betriebliche
Auswertung bleiben offen.

Auditdaten dürfen nicht als unkontrollierte Vollkopie personenbezogener
Datensätze angelegt werden. Technische Sicherheitslogs erfassen insbesondere
Anmeldung, Abmeldung, fehlgeschlagene Anmeldung und administrative
Kontenänderungen strukturiert und datensparsam. Passwörter, Hashes,
Sitzungstickets, Request-Bodies und vollständige Verwaltungsdaten sind
verboten. Der Logzugriff erfolgt außerhalb der Cemaris-Anwendung durch die
zuständige Betriebsadministration; die Cemaris-Rolle `Administration`
eröffnet selbst keinen Logzugriff.

### Umgesetztes Modell in Inkrement 3a

`CaseWriteService` erzeugt Änderungs-ID, UTC-Zeitpunkt, stabile Operation und
optionale Zielobjekt-ID. `ICaseWriteStore` erhält den vollständigen
Änderungsnachweis explizit. Der synthetische Store speichert Prüfung,
Fachänderung, Version, letzte Zuordnung und Nachweis unter einer gemeinsamen
Prozesssperre. Der EF-/SQL-Store speichert dieselben Bestandteile in einer
gemeinsamen Datenbanktransaktion.

`CaseChanges` enthält ausschließlich Fall-ID, resultierende Version,
Zeitpunkt, Akteurskennung, historischen Anzeigenamen, Operation und optionale
Ziel-ID; `(CaseId, ResultingVersion)` ist eindeutig. `ReadCases` führt nullable
Felder für die letzte Zuordnung, damit vorhandene Zeilen ohne erfundene
historische Identität lesbar bleiben. Der öffentliche Fallvertrag gibt nur
Anzeigename und UTC-Zeitpunkt aus. Ein Audit-Leseendpunkt wurde nicht ergänzt.

Die sechs stabilen Operationen entsprechen genau den vorhandenen
Schreibfällen. Die Rolle des synthetischen Akteurs wird weder im Fallvertrag
ausgegeben noch als Berechtigungsbehauptung ausgewertet. Die Entscheidung ist
in [ADR-0011](../decisions/ADR-0011-provider-neutral-actor-and-atomic-case-audit.md)
dokumentiert.

## Betrieb und Datenschutzgrenze

Cemaris ist für On-Premises-Betrieb mit einer eigenen Microsoft-SQL-Server-
Datenbank vorgesehen. Diese Topologie reduziert keine Zugriffsschutz-,
Minimierungs-, Aufbewahrungs-, Sicherungs- oder Freigabeanforderung. Der
synthetische Development-Pfad bleibt daher standardmäßig deaktiviert und darf
weiterhin weder echte Verwaltungsdaten noch eine behauptete Produktivfreigabe
erhalten.
