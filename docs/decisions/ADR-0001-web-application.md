# ADR-0001: Webanwendung statt Desktop-Client

- Status: Accepted
- Datum: 2026-08-08

## Kontext

Cemaris soll in kommunalen Umgebungen zentral betreibbar, für mehrere berechtigte Personen nutzbar und langfristig wartbar sein. Ein proprietärer Desktop-Client würde Rollout, Updates und Plattformunterstützung auf jedem Arbeitsplatz erfordern.

## Entscheidung

Cemaris wird grundsätzlich browserbasiert entwickelt. Frontend und API werden zentral bereitgestellt und über einen kontrollierten Reverse Proxy erreichbar gemacht.

## Gründe

- zentrale Bereitstellung und einfachere Updates,
- Mehrbenutzerbetrieb,
- plattformunabhängiger Client,
- zentrale Sicherheitskontrolle,
- spätere Tablet- und PWA-Nutzung bleibt möglich,
- vereinfachte Trennung von UI, API und Datenbank.

## Folgen

Browserkompatibilität, responsive Gestaltung und Accessibility werden von Beginn an berücksichtigt. Offlinefähigkeit ist nicht automatisch gegeben und wird nur bei einem validierten Bedarf ergänzt. Der Browser erhält keinen direkten Datenbank- oder DMS-Zugriff.
