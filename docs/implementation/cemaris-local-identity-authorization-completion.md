# Abschluss: Lokale Identität und Berechtigungsgrundlage

Stand: 13.08.2026

## Ergebnis

Inkrement 3b ist Ende zu Ende implementiert. Cemaris besitzt persistierte
lokale Konten, frameworkgehashte Passwörter, sichere Cookie-Sitzungen,
Antiforgery-Schutz, serverseitige Policies, authentifizierte
Änderungszuordnung und eine ausschließlich für `Administration` erreichbare
Benutzerverwaltung. LDAP-Code oder LDAP-Mapping wurde nicht ergänzt.

Dies ist eine technische Identitäts- und Berechtigungsgrundlage, keine
umfassende Produktiv-, Datenschutz-, Betriebs- oder Fachfreigabe. Der
Fallakten-Schreibpfad bleibt standardmäßig deaktiviert, Development-only und
auf synthetische Daten begrenzt.

## Sicherheitsvertrag

- Benutzername wird getrimmt, invariant normalisiert, auf 100 Zeichen begrenzt
  und per eindeutigem SQL-Index groß-/kleinschreibungsunabhängig geschützt.
- Passwörter umfassen 12 bis 128 Zeichen. ASP.NET Core
  `IPasswordHasher<TUser>` speichert ausschließlich nicht reversible Hashes;
  `SuccessRehashNeeded` aktualisiert den Hash frameworkkonform.
- Fünf Fehlversuche sperren 15 Minuten. Loginantworten unterscheiden nicht
  zwischen unbekanntem, gesperrtem, deaktiviertem Konto und falschem Passwort.
- Lokale Konten haben GUID, genau eine bestätigte Rolle, Aktivstatus,
  UTC-Sicherheitszeitpunkte, Security-Stamp und SQL-`rowversion`.
- Cookies sind `HttpOnly`, `SameSite=Lax`, außerhalb Development zwingend
  `Secure` und laufen nach standardmäßig 30 Minuten Inaktivität ab.
- Login, Logout, Passwortänderungen, Benutzerverwaltung und alle sechs
  Fallmutationen verlangen ASP.NET-Core-Antiforgery-Validierung.
- Beide Rollen dürfen vorhandene Fachfunktionen verwenden. Benutzerverwaltung,
  vorbereitete Programmkonfiguration und Formularvorlagen sind policieseitig
  ausschließlich Administration zugeordnet.
- Vollständige Auditdaten und Betreiberlogs besitzen weiterhin weder API noch
  Benutzeroberfläche.

## Persistenz und Migration

Die regulär erzeugte Migration
`20260813080626_AddLocalAccountsAndSecurityState` ergänzt ausschließlich
`LocalAccounts`, zwei Check-Constraints, den eindeutigen Index auf
`NormalizedUsername` und `rowversion`. Bestehende Fall- und Auditdaten bleiben
unverändert. Ein idempotentes Skript wurde außerhalb des Repositories erzeugt,
auf Migrationsreihenfolge, Tabelle, Constraints, Index und Rowversion geprüft
und anschließend entfernt.

## Verifikation

- Release-Build: 0 Warnungen, 0 Fehler;
- Unit-Tests: 18 bestanden;
- reguläre Integrationstests: 35 bestanden, 8 SQL-Tests ohne explizite
  Verbindung erwartungsgemäß übersprungen;
- reale SQL-Suite auf `CEMARISDEV`: 8 bestanden;
- Frontend: 9 Tests bestanden; Lint und Produktionsbuild erfolgreich;
- `.NET format --verify-no-changes`: erfolgreich;
- idempotentes Migrationsskript: 14.005 Byte, sechs erwartete Kernelemente,
  anschließend entfernt;
- `sys.databases`: keine verbliebene `Cemaris_IntegrationTests_*`-Datenbank.

Diese Abschlusszahlen wurden im finalen Arbeitsbaum erneut bestätigt.

## Verbleibende Gates

Offen bleiben insbesondere produktiver TLS-/Reverse-Proxy-Vertrag,
Data-Protection-Schlüsselring, externer Secret Store, Backup/Wiederherstellung,
Monitoring, Logziel/-rotation/-aufbewahrung, Auditaufbewahrung und
Integritätskontrolle sowie Datenschutz- und fachliche Freigabe. Lokale Konten
sind technisch umgesetzt; eine produktive Nutzung mit echten Verwaltungsdaten
wird nicht behauptet.
