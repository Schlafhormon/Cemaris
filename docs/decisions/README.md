# Architecture Decision Records

Architecture Decision Records (ADRs) dokumentieren wesentliche technische und projektweite Entscheidungen samt Kontext und Folgen. Sie werden nicht nachträglich umgeschrieben, um eine andere Vergangenheit darzustellen; Änderungen erfolgen durch ein neues ADR, das die frühere Entscheidung ersetzt.

## Status

- `Proposed`: zur Entscheidung vorgeschlagen,
- `Accepted`: beschlossen und gültig,
- `Superseded`: durch ein benanntes ADR ersetzt,
- `Rejected`: geprüft und verworfen.

## Initiale Entscheidungen

| ADR | Titel | Status |
| --- | --- | --- |
| [0001](ADR-0001-web-application.md) | Webanwendung statt Desktop-Client | Accepted |
| [0002](ADR-0002-aspnet-core-backend.md) | ASP.NET Core Backend | Accepted |
| [0003](ADR-0003-react-typescript-frontend.md) | React und TypeScript Frontend | Accepted |
| [0004](ADR-0004-microsoft-sql-server.md) | Microsoft SQL Server | Accepted |
| [0005](ADR-0005-modular-monolith.md) | Modularer Monolith | Accepted |
| [0006](ADR-0006-dms-adapter.md) | DMS über Adapter abstrahieren | Accepted |
| [0007](ADR-0007-requirements-before-implementation.md) | Fachanforderungen vor Implementierung | Accepted |
| [0008](ADR-0008-open-source-license.md) | Open-Source-Lizenz | Proposed |
| [0009](ADR-0009-product-development-before-edwalt-import.md) | Produktentwicklung vor Fortsetzung des EDWALT-Imports | Accepted |
| [0010](ADR-0010-canonical-provisional-case-store.md) | Kanonischer vorläufiger Fall-/Lesestore | Accepted |
| [0011](ADR-0011-provider-neutral-actor-and-atomic-case-audit.md) | Providerneutraler Akteur und atomarer Fallakten-Änderungsnachweis | Accepted |
| [0012](ADR-0012-local-accounts-and-role-boundaries.md) | Lokale Konten als Standard und administrative Rollengrenze | Accepted |
| [0013](ADR-0013-local-cookie-session-and-security-stamp.md) | Lokale Cookie-Sitzung, CSRF und Security-Stamp | Accepted |

Für neue ADRs kann [ADR-Template](ADR-template.md) kopiert werden.
