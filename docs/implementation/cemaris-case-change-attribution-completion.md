# Abschluss: Providerneutrale Änderungszuordnung und Auditgrundlage

Stand: 13.08.2026

## Ergebnis

Inkrement 3a ist Ende zu Ende umgesetzt und gegen die lokale SQL-Instanz
`CEMARISDEV` verifiziert. Jede erfolgreiche der sechs vorhandenen Mutationen
erhält serverseitig einen festen synthetischen Development-Akteur, einen
UTC-Zeitpunkt, eine stabile Operation und genau einen Auditdatensatz für die
resultierende Fallversion. Fachänderung, Versionssprung, letzte Zuordnung und
Auditdatensatz sind atomar. Eine produktive Anmeldung oder Autorisierung wurde
nicht implementiert.

## Umgesetzte Verträge

- `ActorIdentity`, `SystemRole` und `ICurrentActorProvider` halten den
  Application-Kern unabhängig von HTTP, Claims, LDAP und lokalen Konten.
- `SyntheticDevelopmentActorProvider` liefert ausschließlich
  `synthetic-development-case-worker`,
  `Synthetische Development-Sachbearbeitung` und `Sachbearbeitung`.
- `CaseChange` bildet Änderungs-ID, Fall-ID, resultierende Version,
  UTC-Zeitpunkt, Akteur, Operation und optionale Ziel-ID ab.
- Die Operationen sind exakt `CaseCreated`, `GraveChanged`,
  `DeceasedPersonAdded`, `DeceasedPersonChanged`, `BurialAdded` und
  `BurialChanged`.
- Der synthetische Store hält Mutation und Nachweis unter derselben Sperre. Der
  EF-/SQL-Store verwendet für alle Bestandteile dieselbe Transaktion.
- Detail- und Schreibantworten enthalten additiv `lastChange`; Detail- und
  Bearbeitungsseite zeigen Name und lokalen Zeitpunkt. Altzeilen ohne
  Zuordnung erhalten einen neutralen Hinweis.

## Migration und SQL-Verifikation

Die reguläre EF-Core-Migration
`20260813064742_AddCaseChangeAttribution` ergänzt nullable Felder für die
letzte Zuordnung sowie `CaseChanges`. Der eindeutige Index auf
`(CaseId, ResultingVersion)` verhindert mehrere erfolgreiche Nachweise für
dieselbe Fallversion; die Fremdschlüsselbeziehung löscht nicht kaskadierend.

Sechs SQL-Integrationstests liefen gegen eine eindeutig benannte temporäre
Datenbank `Cemaris_IntegrationTests_*` und prüften:

- Migration einer Altversion mit weiterhin nullable Zuordnung;
- reproduzierbaren Seed mit 15 Fällen und 15 Änderungsnachweisen;
- Suche, Detailprojektion und den vollständigen Sechs-Operationen-Schreibpfad;
- genau einen Gewinner und einen Nachweis bei echter paralleler Mutation;
- vollständigen Rollback von Fachwert, Version und letzter Zuordnung bei
  erzwungenem Auditfehler;
- Präfix- und aufgelöste Namensprüfung vor dem Löschen der Testdatenbank.

Die temporäre Datenbank wurde entfernt. Eine anschließende Abfrage von
`sys.databases` ergab keine verbliebene Datenbank mit dem Präfix
`Cemaris_IntegrationTests_`. Das außerhalb des Repositories erzeugte
idempotente Migrationsskript hatte 12.175 Byte, enthielt Migration, nullable
Zuordnungsfelder, Tabelle und eindeutigen Index und wurde anschließend
entfernt.

## Automatisierte Abnahme

- Release-Build: 0 Warnungen, 0 Fehler;
- Unit-Tests: 13 bestanden;
- reguläre Integrationstests: 16 bestanden, die 6 SQL-Tests ohne explizite
  Verbindung erwartungsgemäß übersprungen;
- separate SQL-Suite: 6 bestanden;
- Frontend: 7 Tests bestanden, Lint und Produktionsbuild erfolgreich;
- `.NET format --verify-no-changes`: erfolgreich.

Die Angaben werden im finalen Abschlusslauf noch einmal aus dem unveränderten
Arbeitsbaum bestätigt.

## Verbleibende Grenzen

Der Schreibpfad bleibt standardmäßig deaktiviert, Development-only und auf
synthetische Daten begrenzt. Es gibt weiterhin keine produktive Identität,
keine Berechtigungsentscheidung und keinen Audit-Lese-, Such- oder
Exportendpunkt. Aufbewahrung, Löschung und Integritätskontrolle sind offen.
Unbekannte fachliche Regeln wurden nicht ergänzt.

Der nächste abgegrenzte Auftrag steht in der
[Übergabe für produktive Identität und Autorisierung](cemaris-production-identity-authorization-next-step-handoff.md).
