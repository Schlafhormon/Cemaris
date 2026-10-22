# Cemaris: aktueller Projektstand

Stand: 22.10.2026. **Schritt 19 abgeschlossen: vollständiger aktueller
Produktstand als einzelner Initial-Commit auf main veröffentlicht.**
Version 0.2.0 bleibt unverändert bereitgestellt.

Die 1:1-Portierung (01–16) und Erstbereitstellung auf SRV-UbuntuApp (17) sind
abgeschlossen. Seit dem ausdrücklichen Nutzerauftrag vom 21.10.2026 ist Cemaris
ein eigenständiges Produkt für deutsche kommunale Friedhofsverwaltungen.
Der anschließende Auftrag 19 erlaubt ausdrücklich die Zusammenfassung der
Cemaris-Historie und den Push des aktuellen Stands als Initial-Commit auf
`main`. Kein EDWALT-Import. Siehe [Bericht 19](berichte/19.md).

## Abgeschlossener Schritt 19 – Initialhistorie auf main

Lokales `main` und `origin/main` enthalten genau einen elternlosen Commit
`Initial Cemaris release` mit dem vollständigen Produktstand. Die vorherigen
21 Entwicklungscommits sind privat als verifiziertes Git-Bundle unter
`.local/git-history/` gesichert und wurden nicht mit der neuen Historie gepusht.
Alte Cemaris-Hashes in historischen Belegen beziehen sich auf diese Sicherung.

GitHub CLI ist für Benutzer `erik` als `Schlafhormon` eingerichtet. Die
Veröffentlichung erfolgte mit expliziter Lease gegen den vorher geprüften
Remote-Hash; anschließend wurden Remote, Upstream, Commitanzahl und Dateibaum
abgeglichen. Temporäre lokale Vorbereitungs-/Deploymentbranches sind entfernt.
Anwendung, Datenbank und laufende Container wurden nicht geändert.
Siehe [Bericht19](berichte/19.md).

## Abgeschlossener Produktschritt 18

ConsignO, Dynamics GP/Diamond, Sunrise-Portal, Find a Grave und ntfy werden
vollständig aus aktiver Laufzeit, Oberfläche und Konfiguration entfernt.
Deutsch/Euro/Adressen/A4-Drucke sowie README und technische Dokumentation
werden angepasst. Englisch bleibt vorhanden. SQL-Änderungen sind
bestandsverträglich und erhalten neue Revisionen 0002/0003; Migration 0001
bleibt unverändert. Fremde Daten und Konfiguration bleiben erhalten.

Version 0.2.0 mit Alembic 0003 läuft auf SRV-UbuntuApp. 2.045 Backendtests
bestanden, drei optionale Referenzprüfungen übersprungen; 53 Frontendtests,
Produktionsbuild, echte Browser-/PDF-Abnahme und Persistenzprüfung bestanden.
Bestandsanzahlen und Gebühren/Zahlungen sind unverändert. Dateisicherung vor
Update vorhanden, keine zusätzliche SQL-Backup-/Restoreprobe. Maßgeblich:
[Bericht 18](berichte/18.md) und [Serverübergabe](../SERVER_DEPLOYMENT.md).

**Nächster konkreter Auftrag: Schritt 20 – betriebliche und kommunale Produktionsabnahme
vor EDWALT.** HTTPS und zertifikatsgeprüftes SQL-TLS gemäß den bisher bewusst
zurückgestellten Betreiberentscheidungen einrichten, bestehende SQL-Sicherungs-
abdeckung und Datei-Offsite/Aufbewahrung bestätigen sowie örtliche Gebühren,
Nutzungszeiten, Rollen und zentrale Friedhofsabläufe fachlich abnehmen.
Der Folgeauftrag wurde noch nicht begonnen. EDWALT bleibt bis zu seinem
gesonderten Auftrag unberührt.

## Betrieb und bewahrte Grenzen

Installation: <http://srv-ubuntuapp.stadtdk.local/cemaris/>, externe Datenbank
`Cemaris` auf `SRV-SQL02.stadtdk.local`. Ein API-Worker, separater Migrationsjob,
React/Nginx und persistente Datei-/Sessionvolumes. Keine Verwaltungsdatenbank
ist Testfixture. Produktprüfungen verwenden ausschließlich eigens erzeugte
entbehrliche SQL-Server-Datenbanken auf einer gesonderten Testinstanz.

[SERVER_DEPLOYMENT.md](../SERVER_DEPLOYMENT.md) enthält Konfigurationsorte,
Betriebs-/Sicherungsbefehle und den tatsächlich bereitgestellten Stand.
`.env` ist privat und darf weder ausgegeben noch mit `source` geladen werden.

Bewusste bestehende Betreiberentscheidungen: zunächst HTTP; verschlüsseltes
SQL mit `TrustServerCertificate=yes`; vorhandenes externes SQL-Sicherungs-
verfahren verwenden; **keine zusätzliche SQL-Backup-/Restoreprobe**. Die
Aufnahme von Cemaris in diese Jobs muss betrieblich bestätigt sein. Tägliche
lokale Dateisicherung um 03:15 Europe/Berlin ist eingerichtet; Aufbewahrung und
Offsite-Regel bleiben betriebliche Punkte.

Eine technisch bereinigte Anwendung beweist keine vollständige Produktivabnahme
örtlicher Satzungen, Gebühren, Nutzungszeiten und Rollen. HTTPS und verifizierte
SQL-Zertifikate bleiben bisher zurückgestellt. Diese Punkte und der kommunale
Praxistest müssen vor der Nutzung echter EDWALT-Daten geklärt werden.

## Einstieg in die nächste Session

`AGENTS.md`, `README.md`, diesen Status, `PLAN.md`, [Bericht19](berichte/19.md), [Bericht18](berichte/18.md),
`SERVER_DEPLOYMENT.md` und `DEPLOYMENT.md` lesen. `../README.md` und der
Sunrise-Checkout fehlen auf diesem Host. Historische Quellen bleiben im
[Quellinventar](QUELLINVENTAR.json) und [UMFANG](UMFANG.md) erhalten. Die
Produktentscheidung entfernt Altanbindungen ausdrücklich; nicht aus der
Referenz wiederherstellen. Kein EDWALT-Import ohne separaten Auftrag.
