# ADR-0012: Lokale Konten als Standard und administrative Rollengrenze

## Status

Accepted – 13.08.2026

## Kontext

Cemaris benötigt vor weiteren fachlichen Produktinkrementen eine belastbare
Identitäts- und Autorisierungsgrundlage. Zur Auswahl standen zunächst lokale
Konten und eine direkte kommunale LDAP-Anbindung. Gleichzeitig muss die
Sachbearbeitung fachliche Daten und spätere Stammdaten selbst pflegen können,
während technische Administration nicht Teil ihrer Aufgaben ist.

## Entscheidung

- Lokale Cemaris-Konten mit Benutzername und Passwort sind der Standard und
  werden als erste Identitätsvariante implementiert.
- Ein späterer LDAP-Ausbau dient dem Import oder der Synchronisation von
  Konten. LDAP-Anmeldung, Bind und Mapping sind nicht Teil des ersten lokalen
  Konteninkrements.
- Benutzer erhalten eine servererzeugte stabile Cemaris-ID. Fach- und
  Auditcode bleiben hinter `ICurrentActorProvider` vom Anmeldeanbieter
  entkoppelt.
- Es gibt genau `Sachbearbeitung` und `Administration`.
- Beide Rollen dürfen vorhandene fachliche Fälle lesen, erfassen und
  bearbeiten. Das gilt auch für künftige fachliche Stammdatenpflege.
- Benutzerverwaltung, administrative Programmkonfiguration und
  Formularvorlagen sind ausschließlich `Administration` vorbehalten.
- Vollständige Auditdaten werden über keine Cemaris-API oder -Oberfläche
  bereitgestellt. Technische Sicherheitslogs sind nur außerhalb der Anwendung
  für die zuständige Betriebsadministration zugänglich.

## Alternativen

- Direkte LDAP-Anmeldung als erster Anbieter wurde zurückgestellt, weil lokale
  Konten der bestätigte Standard sind und LDAP-Importregeln noch fehlen.
- Frei übertragene Identitätsheader wurden verworfen, weil sie ohne
  vertrauenswürdige vorgeschaltete Authentisierung manipulierbar sind.
- Ausschließliche fachliche Pflege durch `Administration` wurde verworfen,
  weil die Sachbearbeitung die Friedhöfe und fachlichen Stammdaten pflegt.
- Eine Auditansicht für Administratoren wurde verworfen; Betreiberlogs und
  persistente Änderungsnachweise bleiben außerhalb der Produktoberfläche.

## Folgen

Der nächste Inkrement implementiert ausschließlich lokale Konten, sichere
Sitzungen, serverseitige Policies und die Benutzerverwaltung. Neue Fachmodule
werden nicht vorgezogen. LDAP-Import/-Synchronisation bleibt ein eigener
späterer Auftrag mit noch festzulegendem Mapping und Lebenszyklus. Die
Cemaris-Rolle `Administration` ist nicht mit dem technischen Zugriff auf
Server-, Datenbank- oder Logsysteme gleichzusetzen. Eine umfassende
Produktivfreigabe benötigt weiterhin Datenschutz-, Betriebs- und fachliche
Abnahmen.
