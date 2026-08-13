# ADR-0011: Providerneutraler Akteur und atomarer Fallakten-Änderungsnachweis

## Status

Accepted – 13.08.2026

## Kontext

Cemaris besitzt sechs Development-Mutationen für synthetische Fallakten und
eine monotone Fallversion. Für jede erfolgreiche Änderung muss nachvollziehbar
sein, wann, durch wen und mit welcher Operation welche Fallversion entstand.
Die Entscheidung zwischen kommunalem LDAP und lokalen Benutzerkonten sowie die
operationsgenaue Berechtigungsmatrix stehen noch aus. Der Fallaktenkern darf
deshalb weder an HTTP-Claims noch an einen vorweggenommenen Anbieter gekoppelt
werden.

## Entscheidung

- Die Application-Schicht verwendet `ICurrentActorProvider`. `ActorIdentity`
  besteht aus stabiler Kennung, historischem Anzeigenamen und `SystemRole`.
- `SystemRole` kennt exakt `Sachbearbeitung` und `Administration`; unbekannte
  Rollen werden abgewiesen. Daraus folgen noch keine Berechtigungen.
- Im vorhandenen Schreibpfad liefert ausschließlich der serverseitig
  registrierte `SyntheticDevelopmentActorProvider` einen festen synthetischen
  Akteur. Request-Header oder Request-Inhalte bestimmen keine Identität.
- `CaseWriteService` erzeugt serverseitig Änderungs-ID, UTC-Zeitpunkt,
  Operation, resultierende Fallversion und optionale Zielobjekt-ID.
- Fachänderung, Versionssprung, letzte Änderungszuordnung und genau ein
  Auditdatensatz werden atomar gespeichert. Der SQL-Store verwendet eine
  Datenbanktransaktion; der synthetische Store dieselbe Prozesssperre.
- `(CaseId, ResultingVersion)` ist im SQL-Schema eindeutig. Der Auditdatensatz
  enthält keine Feldwerte, Request-Bodies oder Vorher-/Nachher-Kopien.
- Die letzte Zuordnung bleibt im Leseschema nullable, damit vorhandene Zeilen
  ohne erfundene historische Identität migriert werden können.

## Verworfene Alternativen

- Clientseitige Identitätsheader wurden verworfen, weil sie ohne vorgelagerte,
  nachweislich vertrauenswürdige Authentisierung manipulierbar wären.
- Eine sofortige Festlegung auf LDAP oder lokale Konten wurde verworfen, weil
  die Produktentscheidung noch nicht getroffen ist.
- Auditpersistenz nach Abschluss der Fachtransaktion wurde verworfen, weil sie
  Änderungen ohne Nachweis ermöglichen würde.
- Vollständige Vorher-/Nachher-Snapshots wurden aus Datenminimierungsgründen
  nicht in den Mindestnachweis aufgenommen.

## Folgen

Ein späterer Identitätsanbieter wird als Adapter hinter
`ICurrentActorProvider` ergänzt; der Fallaktenservice bleibt unverändert. Der
synthetische und der SQL-Provider besitzen denselben atomaren Vertrag.
Migrierte Altzeilen dürfen neutral ohne Zuordnung erscheinen. Login,
Operationsrechte, Audit-Einsicht, Export, Aufbewahrung und Löschung bleiben
eigenständige Freigabegates. Der Schreibpfad bleibt standardmäßig deaktiviert,
nur in Development verfügbar und auf synthetische Daten begrenzt.
