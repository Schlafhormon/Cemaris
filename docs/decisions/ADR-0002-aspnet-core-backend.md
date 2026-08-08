# ADR-0002: ASP.NET Core Backend

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Das Backend benötigt eine langfristig unterstützbare Plattform für REST APIs, Dependency Injection, strukturierte Konfiguration, SQL-Server-Zugriff, Health Checks und kommunalen On-Premises-Betrieb.

## Entscheidung

Das Backend wird in C# mit ASP.NET Core auf der aktiven .NET-10-LTS-Linie umgesetzt. Für die zunächst kleine HTTP-Oberfläche werden Minimal APIs verwendet. OpenAPI, zentrale Fehlerbehandlung, strukturierte Logs und Health Checks nutzen vorrangig Frameworkfunktionen.

## Alternativen

Andere etablierte Backendplattformen wären grundsätzlich möglich. Die Microsoft-/SQL-Server-Nähe, der gute Windows- und Linux-Betrieb sowie die integrierten Web- und Betriebsfunktionen sprechen in diesem Projekt für ASP.NET Core.

## Folgen

- Ziel-Framework ist `net10.0`; Patchstände müssen laufend aktualisiert werden.
- Framework-nahe Lösungen werden vor zusätzlichen Bibliotheken geprüft.
- API-Verträge bleiben von EF-Core-Entities getrennt.
- Ein Plattformwechsel wäre kostenintensiv und benötigt ein neues ADR.
