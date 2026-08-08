# ADR-0003: React und TypeScript Frontend

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Die Browseroberfläche soll responsive, barrierearm und unabhängig vom Backend auslieferbar sein. Das Team benötigt einen verbreiteten, komponentenorientierten Ansatz mit statischer Typprüfung.

## Entscheidung

Das Frontend wird mit React, TypeScript und Vite erstellt. Komponenten bleiben klein, API-Typen explizit und Features nachvollziehbar strukturiert. Zusätzliche UI- oder State-Management-Frameworks werden erst bei einem konkreten Bedarf eingeführt.

## Folgen

- Node-/npm-Abhängigkeiten und deren Sicherheitsupdates gehören zum Wartungsumfang.
- Accessibility und Tastaturbedienung sind Teil der Definition of Done.
- Die API ist die einzige Verbindung zu Backendfunktionen.
- Eine PWA ist technisch möglich, aber nicht Teil des aktuellen Grundgerüsts.
