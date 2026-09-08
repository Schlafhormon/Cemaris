# ADR-0020: Manuelle fallbezogene Wiedervorlagen mit atomarem Nachweis

Datum: 08.09.2026

Status: Accepted

## Kontext

Die [bestätigten Produktentscheidungen](../requirements/manual-case-follow-ups-decisions.md)
verlangen einen gemeinsamen Arbeitsvorrat für Sachbearbeitung und Administration,
ohne persönliche Zuweisung. Jeder Eintrag gehört zu genau einer Fallakte.
Rechtliche Fristen und automatische Statuswirkungen sind nicht entschieden.
Die [Übergabe](../implementation/cemaris-manual-case-follow-ups-next-step-handoff.md)
autorisiert ausschließlich synthetische Umsetzung und Offline-Schemaartefakte.

## Entscheidung

`CaseFollowUps` bildet einen eigenständigen kanonischen Bereich über Domain,
Application und die beiden Provider. Die fallbezogene Anlage startet mit
`Open` und Version 1; Änderung, Erledigung, Abbruch und beide Wiederöffnungen
sind explizite Operationen mit Pflichtbegründung. Das manuelle Datum bleibt
`DateOnly` beziehungsweise SQL `date`. Keine Berechnung oder Personenbindung.

Eintrag, vollständige resultierende Fachrevision und inhaltsarmer Audit werden
atomar geschrieben: im Synthetic-Provider unter dem gemeinsamen Coordinator
durch Veröffentlichung vollständig vorbereiteter Speicherstände, im EF-Provider
in einer Transaktion mit eigenem Versions-Concurrency-Token. Revision und Audit
referenzieren Eintrag und Fall gemeinsam; eindeutige Versionsindizes und
restriktive Fremdschlüssel verhindern Fehlzuordnung und Kaskadenlöschung.
Fachaggregate und ihre Versionen werden nicht verändert.

Die eigene Policy `CaseFollowUps` verwendet beide bestehenden Fallarbeitsrollen.
Die unabhängige Capability `Features:CaseFollowUpsEnabled` ist portabel `false`
und verweigert außerhalb `Development` den Start. Deaktiviert werden die neuen
Routen nicht registriert; fehlende Systeminfo-Capability deaktiviert die UI.
Mutationen verlangen CSRF, bestehende Einträge zusätzlich einen aktuellen starken
numerischen ETag. Detail und Mutation verlangen auch `caseId`; falscher Fallbezug
ergibt 404. Fehlend/schwach ergibt 428, syntaktisch ungültig 400, veraltet 412.
Die 428-Behandlung gilt nur im neuen Bereich. Historie wird mit der geschützten
Detailantwort gelesen; eine Audit-Lese-API existiert nicht.

Listen werden im Provider gefiltert und paginiert. Die Reihenfolge ist Datum,
UTC-Erstellzeit und native SQL-GUID-Reihenfolge (`SqlGuid` im Speicher).
SQL projiziert nur den Seitenausschnitt einschließlich aktuellem Fallgrabbezug;
Titel, Datum und Status ersetzen keine historischen Fachsnapshots.
Beschreibungen und Revisionen werden erst beim gezielten Öffnen geladen.

Die additive Migration erstellt ausschließlich `CaseFollowUps`,
`CaseFollowUpRevisions` und `CaseFollowUpAudits` mit Constraints und Indizes.
Historische Migrationen und ADR-0016/0018/0019 bleiben unverändert.

## Folgen und Grenzen

Ein veralteter Schreibversuch überschreibt keinen neueren Stand. Die UI erhält
lokale Eingaben bei 412 und bietet bewusstes Neuladen vor erneutem Speichern.
Abbruch ist ein eigener rekonstruierbarer Zustand; physische Löschung fehlt.
Manuelle Wiedervorlagen lösen weder E-Mails noch Frist-, Grab- oder Rechteaktionen aus.

Die SQL-Tests sind ergänzt und kompiliert, aber nicht ausgeführt. Offline-Modell-
und Skriptprüfung belegen keinen SQL-Betrieb oder Persistenz nach Neustart.
Der [Implementierungsabschluss](../implementation/cemaris-manual-case-follow-ups-completion.md)
enthält die tatsächlich ausgeführten synthetischen Nachweise und Bereinigung.
