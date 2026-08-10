# Mitwirken an Cemaris

Cemaris befindet sich in einer frühen Konzeptions- und Anforderungsphase. Beiträge sind willkommen, müssen aber den unfertigen fachlichen Stand sichtbar respektieren.

## Entwicklungsumgebung

Vorausgesetzt werden das .NET 10 SDK sowie Node.js `^20.19.0 || >=22.12.0`. Danach:

```powershell
dotnet restore Cemaris.sln
dotnet build Cemaris.sln --configuration Release
dotnet test Cemaris.sln --configuration Release --no-build

cd src/Cemaris.Web
npm ci
npm run lint
npm run build
```

Die vollständigen Startanweisungen stehen in der [README](README.md#lokale-entwicklung).

## Branches und Pull Requests

- Änderungen in einem thematisch klar abgegrenzten Branch entwickeln.
- Pull Requests klein und nachvollziehbar halten und mit Issue oder Anforderung verknüpfen.
- Technische Entscheidungen und bewusst verworfene Alternativen im Pull Request erklären.
- Keine generierten Build-Artefakte committen.
- Für wesentliche Architekturänderungen ein ADR unter `docs/decisions/` anlegen oder aktualisieren.

## Fachliche Änderungen

Friedhofsfachliche Regeln benötigen eine nachvollziehbare, validierte Anforderung. Eine Produktvision, Vermutung oder Beobachtung aus nur einem Einzelfall reicht nicht als allgemeine Regel.

Unbekannte Sachverhalte werden in `docs/requirements/` mit `OFFEN` oder `ZU PRÜFEN` dokumentiert. Insbesondere dürfen keine Grabarten, Fristen, Gebühren, Satzungsregeln, Rollen oder EDWALT-Strukturen geraten und hartcodiert werden. EDWALT-Artefakte dienen der Quellen- und Migrationsanalyse, nicht als automatische Produktanforderung.

## Codequalität und Tests

- Nullable Reference Types aktiviert lassen.
- Asynchrone APIs für I/O verwenden und Abbruchsignale weiterreichen.
- Fachlogik von Infrastruktur und UI trennen.
- Für Fehlerbehebungen möglichst einen reproduzierenden Test ergänzen.
- Integrationstests dürfen keine produktiven DMS-, Verzeichnis- oder SQL-Server-Systeme benötigen.
- Backend mit `dotnet format --verify-no-changes` und Frontend mit `npm run lint` prüfen.

## Datenschutz und Secrets

- Keine echten Personen-, Grab-, Akten-, Zahlungs- oder Verwaltungsdaten in Code, Tests, Screenshots, Issues oder Logs verwenden.
- Ausschließlich klar synthetische Testdaten einsetzen.
- Keine Kennwörter, Tokens, Connection Strings mit echten Zugangsdaten oder Zertifikate committen.
- Fehlermeldungen und strukturierte Logs auf Datenminimierung prüfen.

## Commit-Grundsätze

Commit-Nachrichten sollen kurz den Zweck der Änderung beschreiben. Vor dem Commit den vollständigen Diff prüfen und unbeabsichtigte lokale Dateien entfernen.
