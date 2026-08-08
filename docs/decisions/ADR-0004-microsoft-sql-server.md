# ADR-0004: Microsoft SQL Server

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Viele kommunale Rechenzentren betreiben bereits zentrale Microsoft- und SQL-Server-Infrastrukturen mit etablierten Betriebs-, Backup- und Berechtigungsprozessen. Cemaris soll sich dort On-Premises integrieren lassen.

## Entscheidung

Microsoft SQL Server ist die produktive Zieldatenbank. Der Zugriff wird mit Entity Framework Core technisch vorbereitet. Der Datenbankserver wird ausschließlich über einen Connection String konfiguriert und muss nicht im selben Containerverbund laufen.

## Alternativen

PostgreSQL und andere relationale Datenbanken sind technisch leistungsfähig, erhöhen in der initialen Zielumgebung jedoch voraussichtlich den Betriebsaufwand. Eine spätere Neubewertung bleibt durch die Trennung von Fach- und Persistenzmodell möglich, ist aber kein kurzfristiges Ziel.

## Folgen

- SQL-Server-Lizenzierung und unterstützte Serverversionen sind je Kommune zu prüfen.
- Lokales Docker-SQL dient nur der Entwicklung.
- Es wird noch kein fachliches Schema erstellt.
- Migrationsskripte entstehen erst nach validiertem Zielmodell.
