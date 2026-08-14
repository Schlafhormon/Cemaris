# Abschluss Inkrement 5b: manueller Beteiligten-/Nutzungsrechtskern

Stand: 14.08.2026

## Ergebnis

Inkrement 5b ist technisch als kleiner, Ende-zu-Ende geprüfter
Development-Durchstich umgesetzt. Es führt fallübergreifend kanonische
Beteiligte, historische Postanschriften und manuell historisierte
Nutzungsrechte ein. Beide Provider, API/OpenAPI, React und die additive
SQL-Server-Migration verwenden dieselben Anwendungs- und Fachverträge.

Diese technische Fertigstellung ist keine fachliche Verwaltungsabnahme,
Rechtsprüfung, Datenschutzfreigabe, Betriebsfreigabe oder Produktivfreigabe.
Die Capability bleibt standardmäßig deaktiviert und verarbeitet nur
synthetische Daten.

## Umgesetzter Fachumfang

- natürliche Personen und Organisationen mit stabiler `PartyId` und
  typabhängigen Namenspflichten;
- historische Postanschriften mit inklusivem Beginn, exklusivem optionalem
  Ende und optional genau einer aktuell gültigen Hauptanschrift;
- warnende Dublettenprüfung aus normalisiertem Namen und Anschrift sowie
  ausdrückliche, serverseitig erneut geprüfte
  `ConfirmPossibleDuplicate`-Wiederholung;
- stabile Nutzungsrechtsidentität, genau eine kanonische Grabstelle und genau
  ein offener aktueller Inhaber;
- manuell erfasster Beginn, manuell erfasstes Ende und Quellenreferenz;
- historisierte Übertragung, Verlängerung und Faktenkorrektur mit
  Begründung;
- versionierte Startbezugs-Konfiguration je Friedhof und unveränderlicher
  Snapshot der bei Anlage beziehungsweise Korrektur verwendeten Regel;
- starke ETags, verpflichtendes `If-Match`, atomare Fachrevision und
  datensparsamer technischer Audit.

Ein in 5b angelegtes Nutzungsrecht ist unabhängig von Enddatum und aktuellem
Datum offen. Es existiert keine fachliche Beendigungsoperation und keine
abgeleitete Statuswirkung.

## Architektur und Persistenz

Die persistenzunabhängigen Regeln liegen in `Cemaris.Domain`, die
Anwendungsfälle und der gemeinsame Store-Port in `Cemaris.Application`.
`SyntheticPersonUsageRightStore` und `EfPersonUsageRightStore` implementieren
denselben Vertrag. Der EF-Store kapselt jede Mutation in einer
serialisierbaren Transaktion und räumt seinen Change Tracker an jeder
Transaktionsgrenze auf. Neue Revisions- und Inhaberzeilen werden ausdrücklich
als Inserts geführt; ein Persistenzfehler rollt Fakten, Version, Revision und
Audit gemeinsam zurück.

Die additive Migration
`20260814084947_AddCanonicalPartiesAndUsageRights` ergänzt insbesondere:

- `Parties`, `PartyAddresses`, `PartyRevisions`;
- `CanonicalUsageRights`, `UsageRightHolderPeriods`,
  `UsageRightRevisions`;
- `UsageRightStartRules`, `UsageRightStartRuleRevisions`;
- `PersonUsageRightAudits`.

Ein ungefilterter eindeutiger Index auf `CanonicalUsageRights.GraveSiteId`
sichert genau ein 5b-Recht je Grabstelle. Ein gefilterter eindeutiger Index
auf `UsageRightHolderPeriods.UsageRightId` mit
`ValidUntilExclusive IS NULL` sichert den aktuellen Inhaber. Eine eindeutige
Beziehung über `UsageRightStartRules.CemeteryId` sichert genau eine
Startregel je Friedhof. Der zusammengesetzte Fremdschlüssel der optionalen
Hauptanschrift verhindert einen Verweis auf die Anschrift einer anderen
Partei.

Die Migration enthält kein Backfill und erfindet keine Althistorie. Die
vorhandenen nullable Tabellen und API-Projektionen für `EntitledPerson`,
`Address` und `UsageRight` bleiben unverändert lesbar und werden in der UI
ausdrücklich als vorläufige Altprojektion bezeichnet.

## API, Sicherheit und OpenAPI

Die unabhängige Capability
`Features:PersonUsageRightsEditingEnabled` ist in allen Standardkonfigurationen
`false`. Eine Aktivierung ist ausschließlich in `Development` mit dem
synthetischen Provider zulässig; jede andere Kombination stoppt den Host.

Die Policy `PersonUsageRights` erlaubt Fachoperationen für
`Sachbearbeitung` und `Administration`. Änderungen an Startregeln verwenden
zusätzlich ausschließlich die vorhandene Policy `ProgramConfiguration` und
sind damit der Administration vorbehalten. Sämtliche Mutationen verlangen
Cookie-Authentifizierung und CSRF-Schutz. Versionsbehaftete Änderungen
verlangen einen starken numerischen ETag; fehlendes `If-Match` ergibt `428`,
ein veralteter Wert `412` ohne Teilwirkung.

Additiv bereitgestellt sind Endpunkte für Beteiligten-Suche, -Anlage,
Namenskorrektur, Anschriftenanlage und -korrektur, Rechteanlage, Übertragung,
Verlängerung, Faktenkorrektur sowie Lesen und administrative Pflege der
Startregeln. OpenAPI enthält die neuen Request-/Responseverträge und die
relevanten Erfolgs- und Fehlerantworten.

Problemantworten und Audit enthalten keine Namen, Anschriften,
Quellenreferenzen oder Begründungen. Der Audit hält nur Entitätstyp und -ID,
Operation, resultierende Version, Akteur und UTC-Zeitpunkt.

## React-Durchstich

Die Falldetailseite bindet den kanonischen Rechtebereich nur bei aktiver
Capability und vorhandener kanonischer Grabstelle ein. Die Oberfläche bietet:

- Beteiligten-Suche und typabhängige Anlage einschließlich
  Dublettenbestätigung;
- Beteiligten- und Adresshistorie sowie Korrekturen;
- Anlage, Übertragung, Verlängerung und Korrektur eines Nutzungsrechts;
- Anzeige der Inhaber- und Fachrevisionen sowie des Startregel-Snapshots;
- Konfliktbehandlung bei `412` mit Neuladen des Serverstands und Erhalt der
  Eingaben;
- eine administrative Seite für Startregeln und deren Historie.

Beschriftungen, Statusmeldungen, Formularbeziehungen und Konflikthinweise
sind barrierearm aufgebaut. Die nullable Altprojektionen bleiben sichtbar,
aber klar vom kanonischen 5b-Kern getrennt.

## Technische Verifikation

Die vollständige Abschlussprüfung am 14.08.2026 ergab:

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | 0 Warnungen, 0 Fehler |
| Unit-Tests | 28 bestanden |
| reguläre Integrationstests | 46 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert, 0 bekannte Schwachstellen |
| Frontendtests | 13 bestanden in 3 Testdateien |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| reale SQL-Suite | 12 bestanden |
| temporäre SQL-Datenbanken vor/nach Suite | 0 / 0 |
| Markdown-Links, Tabellen und Whitespace | bestanden |
| Secretprüfung | bestanden; keine Werte ausgegeben |
| `git diff --check` | bestanden |

Die reale SQL-Suite lief ausschließlich gegen die freigegebene lokale
Instanz und verwendete genau eine temporäre, präfixgeprüfte
`Cemaris_IntegrationTests_*`-Datenbank. Sie verifiziert Migration aus den
Vorgängerstufen, fehlenden Backfill, Altkompatibilität, Startregel-Snapshot,
Inhaber- und Revisionshistorie, sparsamen Audit, erzwungenen atomaren
Rollback sowie ein gleichzeitig freigegebenes Unique-Index-Rennen zweier
Anlagen auf derselben Grabstelle. Die prozesslokale Verbindungsvariable wurde
im `finally`-Pfad entfernt; ihr Wert wurde nicht ausgegeben oder dokumentiert.

## Bewusste Grenzen

Nicht umgesetzt sind Frist- oder Satzungsstandsberechnung, Statusautomatik,
Wiedervorlagen, Beendigung, Rückgabe, Entzug, Schließung oder Wiedervergabe,
weitere Personenrollen, Merge, Löschen oder Anonymisierung, weitere
Kontaktdaten, Gebühren, Bescheide, Formulare, Dokumente, Versand sowie externe
Integrationen. Es wurden keine echten Verwaltungsdaten verarbeitet.

Der nächste sichere Schritt ist das
[Inkrement-5c-Entscheidungs- und Abnahmegate](cemaris-increment-5c-next-step-handoff.md).
