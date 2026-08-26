# Abschluss Inkrement 6b: kanonische manuelle Bescheidentwürfe

Stand: 26.08.2026

## Ergebnis

Inkrement 6b ist Ende zu Ende als additiver, rechtlich wirkungsloser
Development-Entwurfskern umgesetzt. Ein Fall kann mehrere voneinander
unabhängige Entwürfe besitzen. Jeder Entwurf hat genau einen aktiv bestätigten
kanonischen Zahlungspflichtigen, einen manuellen EUR-Faktenkern, eine
unveränderliche serverseitig vergebene Nummer, monotone Versionen,
vollständige Fachrevisionen und einen getrennten sparsamen Audit.

6b erzeugt keinen Bescheid. Gebührenberechnung, Festsetzung, Freigabe,
Bekanntgabe, Versand, FINANZ+-Integration, Zahlung, Mahnung, echte
Verwaltungsdaten, EDWALT-Migration sowie jede Rückinterpretation von
`ReadNotices` und `ReadFeeItems` wurden nicht implementiert.

## Ausgangsstand und Arbeitsgrenzen

Vor der ersten Änderung wurden Repository, Branch, Upstream, Arbeitsbaum,
Index und unversionierte Inhalte vollständig geprüft:

- Repository
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- `HEAD` und `origin/main`
  `5e6933e6cfa882e883d23c7c746bab33a3e0966a`;
- Ahead/Behind `0/0`;
- sauberer Arbeitsbaum, leerer Index, keine unversionierten Dateien.

Die verbindliche 6b-Übergabe und alle dort genannten Quellen sowie die
betroffenen Produkt- und Testdateien wurden vor Änderungen geprüft. Es gab
keinen Reset, kein Staging und keinen Commit. `tmp/pagination-build` wurde
nicht verändert. Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- und
sonstige Arbeitswurzeln, User Secrets und `Cemaris_Dev` wurden nicht geöffnet.
EDWALT, API, Frontend-Dev-Server, Browser und SQL-Suite wurden nicht gestartet.

## Architektur und Fachvertrag

Der neue Bereich ist über `Cemaris.Domain.NoticeDrafts`,
`Cemaris.Application.NoticeDrafts` und den Port `INoticeDraftStore` vom
vorhandenen Lesemodell getrennt. Domainregeln erzwingen positive
`decimal(18,2)`-Beträge ohne Rundung, EUR, Textgrenzen, Nummernbreite und
Sequenzerschöpfung. Der Service trimmt und validiert Eingaben, verlangt die
aktive Zahlungspflichtigenbestätigung bei Anlage sowie bei einer geänderten
Auswahl und erzeugt serverseitige IDs, Akteur und UTC-Zeit über
`TimeProvider`.

Synthetic- und EF-Provider implementieren dieselben Referenz-, Versions-,
Status-, Snapshot-, Revisions- und Auditverträge. Die Sequenz läuft je
UTC-Vergabejahr installationweit über Konfigurationsversionen weiter. Im
Synthetic-Provider liegen Vergabe, Entwurf, erste Revision und Audit unter der
gemeinsamen kritischen Sektion. Der SQL-Provider verwendet eine serialisierbare
Transaktion und eine Zeilen-/Bereichssperre für die Jahressequenz. Verworfene
Entwürfe bleiben lesbar und unveränderlich; ihre Nummer wird nicht
freigegeben.

## Persistenz und Migration

Die regulär mit dem verbindlichen EF-Core-SDK erzeugte additive Migration
`20260826130629_AddCanonicalManualNoticeDrafts` ergänzt:

- `NoticeDrafts`, `NoticeDraftRevisions` und `NoticeDraftAudits`;
- `NoticeNumberConfigurations`, deren Revisionen und sparsamen Audits;
- `NoticeNumberSequences` mit genau einer manuell gesetzten Jahreszeile und
  `rowversion`.

Fremdschlüssel auf Fall, Beteiligten und Nummernkonfiguration verwenden keine
kaskadierende Löschung. Eindeutige Nummern, Singleton-Konfiguration,
Revision/Audit je resultierender Version, positive Beträge, EUR, bekannte
Zustände und technische Grenzen sind relational abgesichert. Migration,
Designer und ModelSnapshot enthalten ausschließlich neue Tabellen, Indizes,
Constraints und Beziehungen. Es gibt weder Seed noch Backfill noch Änderung
an bestehenden Read-, Personen-, Fall-, Konto- oder Stammdatentabellen.

Bei der vollständigen Kontrolle fiel die EF-Konvention auf, das fachliche
Jahr zunächst als Identity-Spalte zu behandeln. Das Modell wurde vor jeder
Anwendung mit `ValueGeneratedNever` korrigiert; Migration, Designer und
Snapshot bilden deshalb die fachlich gesetzte Jahres-ID identisch ab. Eine
Datenbankverbindung wurde dafür nicht verwendet.

## Sicherheit, API und OpenAPI

`Features:NoticeDraftEditingEnabled` ist repositoryseitig `false` und nur in
`Development` zulässig. Ein Starttest sperrt jede Aktivierung außerhalb davon.
Die neue Policy `NoticeDrafts` erlaubt fachliche Entwurfsoperationen exakt für
`Sachbearbeitung` und `Administration`. Anlage und Änderung der
Nummernkonfiguration verwenden weiterhin `ProgramConfiguration` und sind
damit administrativ. Alle Mutationen verlangen Antiforgery; Korrektur,
Verwerfen und Konfigurationsänderung zusätzlich einen starken aktuellen
`If-Match`-ETag.

Die acht freigegebenen Routen liefern die vorgesehenen `201`, `Location`,
starken ETags, `204`, `400`, `401`, `403`, `404`, `409`, `412` und `428`.
Stabile Problemcodes unterscheiden fehlende/duplizierte Konfiguration,
Sequenzerschöpfung und verworfene Entwürfe. Öffentliche DTOs enthalten
Fachrevisionen, aber weder Auditzeilen noch Adressen, Zahlungs-, Mahn-,
Buchungs- oder Wiederholungsdaten. Es existiert keine Audit-API.

## React-Oberfläche

Die capability-gesteuerte Fallansicht zeigt `Kanonische Bescheidentwürfe`
responsiv und deutlich als `Rechtlich wirkungslos`. Mehrere Entwürfe, Status,
Nummer, Zahlungspflichtiger, manueller Faktenkern, Version und vollständige
Fachrevisionen sind sichtbar. Beteiligte werden über die vorhandene
Schnellsuche ausgewählt. Der aktuelle kanonische Nutzungsberechtigte erscheint
nur als unverbindlicher Vorschlag und wird weder automatisch ausgewählt noch
bestätigt. Anlage und Wechsel des Zahlungspflichtigen verlangen eine
zugänglich beschriftete aktive Bestätigung. Korrektur und Verwerfen verwenden
starke ETags; Konflikte überschreiben keine lokalen Eingaben und bieten
bewusstes Neuladen an. Verworfene Entwürfe besitzen keine Aktionen.

Die administrative Seite `Bescheidnummern` pflegt die Singleton-Konfiguration
versioniert und erklärt ihre ausschließlich prospektive Wirkung. Die alte
Fallansicht heißt nun ausdrücklich `Vorläufige Altprojektion: Bescheide /
Gebühreninformationen` und erklärt, dass keine Zusammenführung oder
Rückinterpretation stattfindet. Druck, PDF, Vorschau, Versand, FINANZ+ und
Auditoberflächen wurden nicht ergänzt.

## Tests und SQL-Status

Unit-Tests decken Geldskala, EUR, Grenzen, Nummernformat, Zustände, Rollen,
Policy sowie teilwirkungslose Bestätigungs- und Grundvalidierung ab.
Synthetic-, API- und Frontendtests prüfen mehrere Entwürfe, Jahreswechsel,
Snapshots, Revision/Audit, ETags, Unveränderlichkeit, Rollen, Capability,
OpenAPI, Altprojektionsgrenze, den unverbindlichen Inhabervorschlag sowie
Eingabehalt bei Feldfehlern, `403`, fehlender Nummernkonfiguration und
Versionskonflikten.

Die EF-/SQL-Provider-Suite wurde für additive Migration, Constraints,
parallele Nummernvergabe, Atomarität, Snapshot und unveränderte Altprojektion
erweitert und durch den Release-Build kompiliert. Sie wurde nicht ausgeführt:
Der Auftrag enthielt keine ausdrücklich autorisierte separate temporäre
Testverbindung. Es wurde keine Verbindung angefordert oder geöffnet und
insbesondere niemals auf `Cemaris_Dev` zugegriffen.

## Abschlussprüfungen

Alle .NET-Befehle verwenden ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.
Die finalen Ergebnisse werden nach dem letzten vollständigen Prüflauf in
dieser Tabelle festgehalten:

| Prüfung | Ergebnis |
| --- | --- |
| `dotnet format Cemaris.sln --verify-no-changes --no-restore` | erfolgreich, keine Abweichung |
| Release-Build der Solution | erfolgreich, 0 Warnungen und 0 Fehler |
| Unit-Tests | 55 von 55 bestanden |
| Integrationstests `Category!=SqlServer` | 63 von 63 bestanden |
| SQL-Kategorie | nicht autorisiert, nicht ausgeführt |
| EF-Modellparität | keine ausstehenden Modelländerungen |
| Design-time-Migrationsskript | 7 neue Tabellen, 0 Änderungen an bestehenden Tabellen, 0 Datenmutationen |
| `npm ci` | 117 Pakete installiert, 118 geprüft, 0 Schwachstellen |
| Frontendtests | 54 von 54 in 10 Testdateien bestanden |
| Frontend-Lint und Produktionsbuild | erfolgreich |
| Git-Diff und Dokumentationsstruktur | erfolgreich; leerer Index, kein Commit, keine Link-, Fence- oder Tabellenfehler |
| Secret-, Fremdbestands- und `tmp`-Prüfungen | erfolgreich; keine neue Geheimnis- oder Verwaltungsdatenablage, geschützter Bestand unverändert |

Die Dokumentationsprüfung umfasste 105 Git-sichtbare Markdown-Dateien und 431
lokale Links beziehungsweise Anker. Es gab weder ein fehlendes Ziel noch
unausgeglichene Codeblöcke, inkonsistente Tabellen, nachgestellte Leerzeichen
oder fehlende abschließende Zeilenumbrüche. `git diff --check` blieb ohne
Fehler.

Die repositorybasierte Secret- und Verwaltungsdatenprüfung las keine User
Secrets und gab keine gefundenen Werte aus. Sie prüfte 347 Git-sichtbare Pfade,
darunter 340 Textdateien, sowie alle 58 geänderten oder neuen Dateien. In den
Ergänzungen gab es 0 Treffer für private Schlüssel, bekannte Cloud-Token,
Zugangsdatenzuweisungen, Verbindungskennwörter, E-Mail-Adressen, deutsche
IBAN, UNC-Pfade und Währungsbetragswerte. Es wurde keine neue oder geänderte
Datei mit Secret-, Datenbank-, Office-, Archiv- oder Verwaltungsdatenendung
aufgenommen.

Der finale Git-Stand liegt weiterhin auf `main` bei
`5e6933e6cfa882e883d23c7c746bab33a3e0966a`, identisch zu `origin/main` und
Ahead/Behind `0/0`. Der Arbeitsbaum enthält den nachvollziehbaren 6b-Umfang
aus 36 geänderten versionierten und 22 neuen unversionierten Dateien. Der
Index ist leer; es wurde weder gestagt noch ein Commit erstellt. ADR-0018,
`ReadNotices`, `ReadFeeItems` und `tmp/pagination-build` besitzen keinen
Status- oder Diff-Eintrag.

Der ausschließlich gelesene Metadatenvergleich von `tmp/pagination-build`
bestätigt vor und nach der Arbeit denselben Wurzel-Zeitstempel UTC
`2026-08-14T10:27:21.4062644Z`, 1.008 Kind-Einträge mit 890 Dateien und 118
Verzeichnissen sowie 120.354.652 Dateibytes. Externe Arbeitswurzeln,
`Cemaris_Dev` und User Secrets blieben unberührt. Der Solution-Build
kompilierte das bestehende EDWALT-Werkzeug als Projektbestandteil, führte es
aber nicht aus. API, Frontend-Dev-Server und Browser wurden nicht gestartet.

## Schutzgrenze und Folgegate

ADR-0018 bleibt unverändert. Der kleinste nächste sichere Schritt ist
ausschließlich das
[dokumentarische Entscheidungsgate zur späteren Bescheiderzeugung](cemaris-notice-generation-decision-gate-next-step-handoff.md).
Es erteilt keinen technischen Auftrag und nimmt weder Vorlage noch
Rechtswirkung, Zustellung, Korrektur, Aufbewahrung oder Integration vorweg.
