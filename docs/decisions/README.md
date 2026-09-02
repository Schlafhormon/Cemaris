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
| [0014](ADR-0014-canonical-cemetery-master-data.md) | Kanonische Friedhofsstammdaten und restriktives Löschen | Accepted |
| [0015](ADR-0015-atomic-burial-process.md) | Atomarer providerneutraler Beisetzungsprozess | Accepted |
| [0016](ADR-0016-canonical-parties-and-historicized-usage-rights.md) | Kanonische Beteiligte und historisierte Nutzungsrechte | Accepted |
| [0017](ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md) | Dauerhafte lokale SQL-Entwicklung und abgegrenzter EDWALT-Stammdatenimport | Accepted |
| [0018](ADR-0018-canonical-manual-notice-drafts.md) | Kanonische manuelle Bescheidentwürfe vor Bescheiderzeugung | Accepted |
| [0019](ADR-0019-ephemeral-secure-notice-document-generation.md) | Flüchtige sichere Bescheidentwurfs-Dokumenterzeugung | Accepted |

ADR-0018 ist durch den
[technischen 6b-Abschluss](../implementation/cemaris-increment-6b-completion.md)
ohne nachträgliche Änderung umgesetzt. Das ausschließlich dokumentarische
[Folgegate zur späteren Bescheiderzeugung](../implementation/cemaris-notice-generation-decision-gate-next-step-handoff.md)
ist gemäß
[6c-Abschluss](../implementation/cemaris-notice-generation-decision-gate-completion.md)
nach ergänzender Quellenklärung mit Variante B beendet. Es bestätigt genau
einen eng begrenzten Gebührenbescheidentwurf und bereitet die separate
[technische 6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md)
vor. Die technische Übergabe ist gemäß
[6c-Abschluss](../implementation/cemaris-increment-6c-completion.md)
vollständig umgesetzt. Die tatsächlich realisierte OpenXML-/LibreOffice-,
Temp-, Paket- und Audit-Architektur ist deshalb eigenständig in ADR-0019
dokumentiert. ADR-0018 bleibt unverändert. Das
[Betriebs- und Pilotfreigabegate](../implementation/cemaris-notice-generation-pilot-release-gate-completion.md)
ist mit Variante A „Stop“ abgeschlossen. Es trifft keine neue
Architekturentscheidung; ADR-0019 bleibt ebenfalls unverändert und ein neues
ADR wurde nicht erstellt.

Die nachinstallierte und am 01.09.2026 bestätigte LibreOffice-Version ändert
keine Architekturentscheidung. Der
[Readiness-Folgeauftrag](../implementation/cemaris-notice-generation-synthetic-pilot-readiness-next-step-handoff.md)
ist gemäß
[Readiness-Abschluss](../implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
mit Variante A ausgeführt. Ein verlorener PDF-Parallelitätsslot und die
fehlende sichtbare Entwurfskennzeichnung wurden innerhalb des vorhandenen
ADR-0019-Vertrags minimal korrigiert. Es entstand weder eine neue Architektur
noch ein neues ADR oder eine Aktivierung; ADR-0019 bleibt unverändert.
Der vorbereitete
[Betriebsremediations-Folgeauftrag](../implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-next-step-handoff.md)
prüft Backup/Restore und die verbliebenen installationsbezogenen Nachweise
erneut. Die Autorisierung des entbehrlichen Restore-Prüfziels ist eine
Betriebsprüfgrenze und keine neue Architekturentscheidung; ADR-0019 bleibt
maßgeblich.

Das
[5c-Abnahme- und Lebenszyklus-Entscheidungsgate](../implementation/cemaris-increment-5c-completion.md)
bestätigt ADR-0016 unverändert. Für den ausgewählten reinen 5d-Bedienumfang
war gemäß [5d-Abschluss](../implementation/cemaris-increment-5d-completion.md)
kein neues ADR erforderlich. Auch die rein technische
[5e-CSRF-Stabilisierung](../implementation/cemaris-increment-5e-completion.md)
ändert keine Architekturentscheidung. Das
[5f-Entscheidungsgate](../implementation/cemaris-increment-5f-completion.md)
hat mangels belastbarer Fach- und Freigabeentscheidungen Variante A „keine
Implementierung“ gewählt. ADR-0016 bleibt unverändert; ein neues ADR war nicht
erforderlich. Das
[5g-Kurzentscheidungs- und Freigabegate](../implementation/cemaris-increment-5g-next-step-handoff.md)
ist gemäß
[5g-Abschluss](../implementation/cemaris-increment-5g-completion.md) mangels
zuständiger Fach- und Freigabequellen ebenfalls mit Variante A beendet.
ADR-0016 bleibt unverändert; ein neues ADR wurde nicht erstellt. Das
[5h-Auswahlgate](../implementation/cemaris-increment-5h-completion.md) hat
eine additive paginierte Beteiligtenübersicht als technischen
[5i-Schnitt](../implementation/cemaris-increment-5i-completion.md) ausgewählt;
dieser Schnitt ist nun technisch umgesetzt. Auch die Umsetzung und die
nachfolgende interne
[5j-Suchprojektion](../implementation/cemaris-increment-5j-completion.md)
erweitern ADR-0016 nicht. Die Projektentscheidung vom 25.08.2026 ändert
dagegen die lokale Entwicklungs- und Migrationsarchitektur. ADR-0017 setzt
deshalb die EDWALT-Pause aus ADR-0009 ausschließlich für den nicht
personenbezogenen Friedhofsstammdatenpfad aus und macht `Cemaris_Dev` zur
dauerhaften lokalen Development-Datenbank. Der
[5k-Abschluss](../implementation/cemaris-increment-5k-completion.md)
weist die Ausführung nach. Ein späteres Frist-,
Status- oder Lebenszyklusmodell benötigt wegen der offenen 5C-Gates
gegebenenfalls eine neue Architekturentscheidung.

ADR-0007 verlangt vor Gebühren-, Bescheid- oder Dokumentimplementierung
belastbare Fachanforderungen; ADR-0009 hält die breite EDWALT-Migration bis zu
einem verstandenen Zielmodell pausiert. Das rein dokumentarische
[Entscheidungsgate 6a](../implementation/cemaris-increment-6a-completion.md)
ist mit Variante A „noch keine Implementierung“ abgeschlossen. Der vorhandene
Lesevertrag bleibt unverändert, ein technischer 6b-Auftrag wurde nicht
erstellt. Da keine neue Architekturentscheidung getroffen wurde, ist kein
weiteres ADR erforderlich. Die fachlichen Grenzen stehen in der
[6a-Entscheidungsakte](../requirements/fee-notice-document-decisions.md).
Auch die nachgelagerte Projektpriorisierung manueller kanonischer
Bescheid-/Finanzfakten war noch keine Architekturentscheidung. Das
[6a-F-Freigabegate](../implementation/cemaris-manual-notice-facts-approval-completion.md)
ist nach ergänzender funktionsbezogener Klärung mit Variante B abgeschlossen.
Die
[6F-Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md)
gibt genau einen rechtlich wirkungslosen manuellen Entwurfskern für
Development und synthetische Daten frei. ADR-0018 dokumentiert seine additive
Trennung von `ReadNotices`/`ReadFeeItems`, die bestätigungspflichtige
Zahlungspflichtigenauswahl, Nummernsequenz, Revision und Audit. Der
[6b-Abschluss](../implementation/cemaris-increment-6b-completion.md) setzt
diese Entscheidung um; Bescheiderzeugung und Produktivsetzung bleiben eigene
Gates.

Für neue ADRs kann [ADR-Template](ADR-template.md) kopiert werden.
