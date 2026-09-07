# Nächster Schritt: verständliche Beisetzungsauswahl im 6c-Entwurf

Stand: 07.09.2026

Status: **Vorbereitet, noch nicht implementiert.** Diese Übergabe ist der
ausführbare Folgeauftrag für einen neuen Chat ohne Gesprächskontext. Die
Vorbereitung selbst ändert keinen Produktcode und startet keine Anwendung.

## Auftrag und Ausgangspunkt

Die manuelle Beisetzungsauswahl unter „Kanonische Bescheidentwürfe“ soll
Datum, Namen der verstorbenen Person und lesbaren Grabbezug anzeigen.
Derzeit zeigt `NoticeGenerationForm` nur Datum und Beisetzungs-GUID. Bei
mehreren Beisetzungen ist die Zuordnung unnötig schwer. Diesen begrenzten
UI-Schnitt implementieren, mit zwei synthetischen Beisetzungen prüfen und
bis zum DOCX-/PDF-Download im Browser nachweisen.

Der [6c-Praxistest](cemaris-notice-generation-prototype-trial-completion.md)
ist bereits ausgeführt: isolierter HTTP- und Playwright-Browserlauf mit
regulärer Cookie-Anmeldung, echtem LibreOffice-PDF und Abmeldung erfolgreich.
Formularreset nach erfolgreicher Entwurfsanlage und falsche Fehleranzeigen
bei abgebrochenen Development-Ladeanfragen sind korrigiert und getestet.
Diese Änderungen erhalten. Die dort genannten 81 Unit-, 70 nicht-SQL-
Integrations- und 63 Frontendtests sind Ausgangsnachweise, keine bereits
bestandenen Tests der neuen Änderung.

Maßgeblich bleibt die
[Projektentscheidung vom 07.09.2026](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
Keine neue allgemeine Freigaberunde, keine Wiederholung von Backup/Restore
und keine vorgeschaltete Betriebsremediation. Frühere Variante-A-Abschlüsse
bleiben historische Nachweise. Eine Anmeldung mit einem persistenten lokalen
Konto ist weiterhin unbestätigt und separat auszuweisen; sie ist keine
Voraussetzung für diesen isoliert prüfbaren UI-Auftrag.

## Arbeitsverzeichnisse, Dateien und Programme

Einzige Arbeitswurzel:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Alle folgenden Repositorypfade sind relativ dazu:

| Zweck | Pfad |
| --- | --- |
| Solution | `Cemaris.sln` |
| Frontend; Arbeitsverzeichnis für npm | `src/Cemaris.Web` |
| API; regulärer Content-Root | `src/Cemaris.Api` |
| Unit-Tests | `tests/Cemaris.UnitTests` |
| Integrationstests | `tests/Cemaris.IntegrationTests` |
| Auswahl und Downloadformular | `src/Cemaris.Web/src/components/NoticeDraftPanel.tsx` |
| Panel- und Downloadtests | `src/Cemaris.Web/src/components/NoticeDraftPanel.test.tsx` |
| Fallseite und Datenübergabe | `src/Cemaris.Web/src/pages/CaseDetailsPage.tsx` |
| Fallseiten-Regressionsnachweis | `src/Cemaris.Web/src/pages/CaseDetailsPage.test.tsx` |
| Bestehende Fall-/Beisetzungs-/Personentypen | `src/Cemaris.Web/src/types/cases.ts` |
| Bestehende Grabstammdatentypen | `src/Cemaris.Web/src/types/cemeteries.ts` |
| Bestehende API-Clientfunktionen | `src/Cemaris.Web/src/api/cemarisApi.ts` |
| Bei tatsächlichem Darstellungsbedarf | `src/Cemaris.Web/src/App.css` |
| Zu erhaltende Ladefehler- und Formularregressionen | `src/Cemaris.Web/src/App.test.tsx`, `src/Cemaris.Web/src/pages/CaseEditPage.tsx`, `src/Cemaris.Web/src/pages/NewCasePage.tsx` |
| Isolierte Browserhost-Grundlage | `tests/Cemaris.IntegrationTests/NoticeGenerationWebApplicationFactory.cs` |
| Isolierte Konten und Konfiguration | `tests/Cemaris.IntegrationTests/TestIdentity.cs`, `TestLocalAccountStore.cs`, `TestConfiguration.cs` im selben Verzeichnis |
| Bestehende fachliche HTTP-Testzusammenstellung | `tests/Cemaris.IntegrationTests/NoticeGenerationEndpointTests.cs` |
| Capability-/Routenprüfung, read-only für diesen Schnitt | `src/Cemaris.Api/Program.cs` |
| Produktkonverter | `src/Cemaris.Infrastructure/NoticeGeneration/LibreOfficeNoticePdfConverter.cs` |
| Gewählte synthetische Vorlage, read-only | `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx` |
| Autorisierte Vergleichsquelle, read-only | `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` |
| Neue Diagnostik/Prüfskripte/Downloads | eigene neue kollisionsfreie Wurzel unter `tmp` |

Jeden .NET-Aufruf ausschließlich mit:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Für echte PDF-Erzeugung den bereits bestätigten Konsolenstarter verwenden:

`C:\Program Files\LibreOffice\program\soffice.com`

Der letzte Browsernachweis verwendete Edge über
`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` und die lokale
Playwright-Bibliothek unter
`C:\Users\Benke\AppData\Local\npm-cache\_npx\9833c18b2d85bc59\node_modules\playwright`.
Diese Werkzeugpfade vor Verwendung auf Existenz prüfen, nicht als dauerhaft
garantierte Installation behandeln. Die früheren Hilfsdateien unter
`tmp/6cb-20260907` sowie die API-Tempstämme `t6cb`/`t6cbi` wurden entfernt;
keinen dort noch vorhandenen Prüfhost voraussetzen.

## Zuerst lesen und tatsächlichen Stand sichern

Diese Übergabe vollständig lesen, dazu den aktuellen Praxistestabschluss,
Root-README, SECURITY.md, die aktuelle Projektentscheidung und
[ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md).
Die [Praxistest-Übergabe](cemaris-notice-generation-prototype-trial-next-step-handoff.md)
enthält ergänzende Sitzungsgrenzen. Danach die konkret betroffenen Typen,
Komponenten, Clientfunktionen und Tests prüfen.

Vor Änderungen Branch, HEAD, Upstream, Ahead/Behind, Index, Arbeitsbaum,
unversionierte Dateien und vollständige Diffs prüfen. Bei Vorbereitung lag
`main` auf `0dd142887435cb67cf71fd79b6f16e70124598c6`, identisch zu
`origin/main`, mit vorhandenen ungestagten Änderungen. Der Projektleiter
wird diese möglicherweise vor dem neuen Chat committen. Den dann aktuellen
Stand verwenden; keine alte HEAD-ID erzwingen. Kein Reset, Staging oder Commit.

Von `tmp/pagination-build` ausschließlich Wurzelmetadaten vor/nach der Arbeit
vergleichen; keine Inhalte öffnen, auflisten oder ändern. Externe EDWALT-,
Phase-, Satzungs-, Vorlagen-, DMS- und sonstige Arbeitswurzeln nicht öffnen.

## Anzeigevertrag und kleinster Umsetzungsschnitt

1. `CaseOverview.deceasedPersons` enthält bereits Namen. Die Fallseite soll
   diese vorhandenen Daten über eine passende Prop an das Panel reichen.
   Personen ausschließlich über `burial.deceasedPersonId` zuordnen.
2. `BurialDetails` enthält `graveSiteId`, aber keine Grabbezeichnung.
   `getBurialProcessMasterData(signal)` liest bereits
   `GET /api/burial-process/master-data`; die bestehende Route liefert mit
   `ReadAsync(true, ...)` auch inaktive Stammdaten unter der BurialProcess-
   Policy. Diesen vorhandenen Vertrag für die benötigte Anzeige verwenden,
   nur bei aktiver Dokumenterzeugung und ohne Abruf pro Auswahloption.
   Kein neuer Endpoint, kein geändertes Backend-DTO und keine Migration nötig.
3. Grabdaten ausschließlich über die jeweilige `burial.graveSiteId` auflösen.
   Der aktuelle Fallgrabbezug ist kein Ersatz für einen anders verknüpften
   Beisetzungsgrabbezug. Vorhandene optionale Bereichs-/Feld-/Reihenangaben
   zusammen mit Friedhof und Grabnummer verständlich darstellen; leere Teile
   weglassen. Bestehende/inaktive oder belegte Grabstellen für die reine
   Beschriftung nicht nach Regeln einer Neuanlage herausfiltern.
4. Normale Beschriftung etwa:
   `20.8.2026 · Emil Synthetik · Testfriedhof / Feld A / SYN-001`.
   Vor-/Nachnamen trimmen und vorhandene Namensteile nutzen. Keine Titel,
   Anrede, Geschlechts- oder sonstige Fachinformation ableiten. Wenn sonst
   identische Beschriftungen verbleiben, nur diese Optionen zusätzlich durch
   ihre Beisetzungs-ID eindeutig unterscheidbar machen.
5. Fehlende Anzeigeinformationen ehrlich kennzeichnen, beispielsweise
   `Name nicht angegeben`, `Person nicht aufgelöst` oder `Grabstelle nicht
   aufgelöst`; bei nicht aufgelösten Beziehungen die jeweilige vorhandene ID
   zur eindeutigen Zuordnung beibehalten. Keine Nachbardaten verwenden und
   kein `undefined`, leeres Trennzeichengerüst oder Objekttext anzeigen.
6. Der bestehende Filter auswählbarer Beisetzungen, manuelle Auswahlpflicht,
   `option.value = burial.id` und Generation-Request bleiben unverändert.
   Keine Vorauswahl oder Auswahl anhand von Name, Index oder Grabnummer.
   Fehlende Beschriftungsdaten begründen keine neue fachliche Zulassungsregel;
   der Server bleibt für die Erzeugungsvalidierung maßgeblich.
7. Lade-/Fehlerzustände verständlich darstellen und die Auswahl bei einem
   fehlgeschlagenen zusätzlichen Leseabruf nachvollziehbar erhalten. Effekt-
   Cleanup/AbortSignal beachten; keine erneuten StrictMode-Fehlalarme und
   keine Aktualisierung einer inzwischen anderen Fallansicht. Bei deaktivierter
   Capability keinen neuen Stammdatenabruf und keine Erzeugungsoberfläche zeigen.

Keine Ausweitung auf neue Dokumentarten, Auswahl in anderen Modulen,
Gebühren-/Termin-/Rechtsberechnung, Statusregeln, Vorlagenänderung, Freigabe,
Signatur, Versand, Archivierung, DMS/FINANZ+, EDWALT oder Produktivaktivierung.
Für konkrete weitere Fehler zuerst Repro und erwartetes Verhalten festhalten;
nur unmittelbar erforderliche kleine Korrekturen aufnehmen. Andere Befunde
im Abschluss als Folgearbeit dokumentieren.

## Tests und Browserabnahme

Vor der Änderung mindestens den bisherigen unverständlichen Zwei-
Beisetzungen-Fall reproduzieren. Danach passende Regressionstests ergänzen:

- Zwei Beisetzungen am selben Tag mit unterschiedlichen Personen und
  Grabbezügen; Beschriftung und Zuordnung stimmen jeweils über die IDs.
  Reihenfolge der Personen und Stammdaten absichtlich abweichend anordnen.
- Die Auswahl der zweiten Beisetzung erzeugt genau deren `burialId` im
  unveränderten Request, mit gewählter Satzung, Format, CSRF und starkem ETag.
- Fehlende Namen/Referenzen und optionale Grabebenen sowie identische
  Beschriftungen bleiben ehrlich und eindeutig; keine falsche Fallgrabableitung.
- Deaktivierte Capability, erwarteter Ladeabbruch und echter Ladefehler;
  bestehende Download-, Blob-Bereinigungs-, Formularreset-, Kontakt-, Satzungs-
  und ETag-Regressionsfälle bleiben grün. Datenübergabe der Fallseite mitprüfen.

Den neuen Ablauf im isolierten Browser mit zwei synthetischen Beisetzungen
über vorhandene UI-/Anwendungsverträge aufbauen. Eine Beisetzung manuell wählen,
DOCX und echtes LibreOffice-PDF herunterladen und Person/Grab/Datum in der
Ausgabe mit dieser Auswahl vergleichen. Dateiname, MIME, No-Store,
Wirkungslosigkeitskennzeichnung und fehlende Resttokens prüfen; PDF rendern
und visuell prüfen. UI bei Desktopbreite und schmalem Fenster auf lesbare
Auswahl und Layout prüfen. Danach abmelden und anonymen Zugriff prüfen.
Keinen nativen Dateidialog, Papierdruck oder persistenten Kontonachweis behaupten,
wenn nur Playwright-Download und isolierte Testidentität geprüft wurden.

## Sichere Testsitzung und bekannte Werkzeugfallen

- API nur `Development`, API/Frontend nur Loopback. Freie Ports vorher prüfen;
  zuletzt waren 5058/5178 für den isolierten Host nutzbar. Vite mit
  `VITE_API_PROXY_TARGET=http://127.0.0.1:<API-Port>` und
  `--host 127.0.0.1 --port <Frontend-Port> --strictPort` starten.
- NoticeGeneration und die fünf Abhängigkeiten `CaseEditing`,
  `CemeteryMasterDataEditing`, `BurialProcessEditing`,
  `PersonUsageRightsEditing`, `NoticeDraftEditing` ausschließlich prozesslokal
  aktivieren. Alle drei Maintenance-Schalter (`ApplyMigrations`,
  `EnsureDevelopmentAccounts`, `EnsureSyntheticDevelopmentData`) auf `false`.
  Keine portable Konfiguration, User Secrets oder Systemeinstellungen ändern.
- `ReadModel:Provider=Synthetic` isoliert die Konten allein nicht. Der
  automatisierte Host muss zusätzlich `TestLocalAccountStore` verwenden.
  Die vorhandene Factory über `WithWebHostBuilder` erweitern, Kestrel an
  `IPAddress.Loopback` binden und nur im Prüfhost das Default-Authentifizierungs-
  schema auf reguläre Cookies zurückstellen. Über das Loginformular mit der
  vorhandenen synthetischen Testidentität anmelden. Keine Produkt-Authumgehung.
- Die Factory verwendet einen PDF-Dummy. Für diesen Browsernachweis gezielt
  `LibreOfficeNoticePdfConverter` mit `DirectNoticeProcessRunner` und
  `soffice.com` verwenden. Ein neuer kurzer Tempstamm muss unter dem API-
  Content-Root liegen; vor Anlage Kollisionsfreiheit/Metadaten prüfen.
  Die bestehende Pfadprüfung und Konverterlimits unverändert lassen.
- Playwright-MCP scheiterte zuletzt am nicht vorhandenen Chrome im
  Benutzerpfad. Vorhandene Werkzeuge prüfen; bewährter Ersatz ist die lokale
  Playwright-Bibliothek mit `chromium.launch({ channel: 'msedge' })`.
  Keine Chrome-Installation, MCP-Umkonfiguration oder neue Projektabhängigkeit
  allein für den Test erzwingen. Explizite Locator-Timeouts verwenden und
  für das echte PDF-Downloadereignis länger als acht Sekunden warten.
- .NET-Builds vor Start der eigenen API abschließen; sonst sperrt diese DLLs.
  `npm ci` vor Frontendstart/-tests abschließen. Bei hoher Last Frontendtests
  mit `--maxWorkers=2` ausführen, ohne Test- oder Produktlimits hochzusetzen.
- Für diesen Auftrag reicht der isolierte Browsernachweis. Falls zusätzlich
  der reguläre Kontoweg geprüft wird, muss der Benutzer seine Zugangsdaten
  selbst im Browser eingeben. Keine lokalen Anmeldenamen, Passwörter,
  Verbindungszeichenfolgen oder User-Secrets-Dateien lesen/protokollieren.
  Fehlende Benutzeranmeldung separat dokumentieren, unabhängige Arbeit beenden.
- `Cemaris_Dev` niemals überschreiben, wiederherstellen, leeren, zurücksetzen,
  löschen oder von Testfixtures verwalten lassen. Keine SQL-kategorisierten
  Tests dort oder gegen `Cemaris_Dev_RestoreCheck_20260902`; dieses entfernte
  Restore-Ziel nicht neu erzeugen, die erhaltene Sicherung nicht verändern.
  Kein Seeding, Backup/Restore und keine systemweiten Konten-, ACL-, Quota-,
  Verschlüsselungs-, Dienst-, LibreOffice- oder Monitoringänderungen.
- Nur eigene Prozesse/Dateien beenden bzw. bereinigen. Besitz und aufgelöste
  Zielpfade vorher prüfen; bei Windows-Dateioperationen PowerShell mit
  `-LiteralPath` verwenden. Falls eine Sammellöschung abgewiesen wird, die
  bekannten eigenen Dateien einzeln über explizite Pfade und danach nur die
  leeren eigenen Verzeichnisse entfernen. Fremde Prozesse nicht beenden.

## Qualitätsläufe und Abschluss

Nach Produktcodeänderungen mit dem festgelegten SDK aus der Repositorywurzel:
Solution-Restore `--locked-mode`, Formatprüfung `--verify-no-changes --no-restore`,
Release-Build, Unit-Tests und Integrationstests ausdrücklich mit
`--filter "Category!=SqlServer"`. EDWALT darf kompiliert, nicht ausgeführt werden.
Im Frontend `npm ci`, `npm run test -- --run --maxWorkers=2`, `npm run lint`
und `npm run build`. NuGet einschließlich transitiver Pakete sowie `npm audit`
prüfen; ohne Anlass keine Paketupdates. Testzahlen des neuen Standes berichten.

Nach dem Browserlauf eigene Hosts, Browser, Downloads und Konverterartefakte
bereinigen. Bei einem temporär aufgenommenen .NET-Prüfhost nach dessen
Entfernung neu bauen, damit er nicht in der Testassembly verbleibt.
Regulären Start ohne Aktivierungsvariablen prüfen: Health erfolgreich,
`noticeGenerationEnabled=false`, Erzeugungsroute HTTP 404; dann auch diesen
eigenen Prozess beenden. Portable Defaults müssen unverändert aus bleiben.

Beide DOCX-Dateien unverändert lassen und SHA-256 vor/nach der Sitzung prüfen:

- Pilotfixture: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`;
- Vergleichsquelle: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Neuen Abschluss unter
`docs/implementation/cemaris-notice-generation-burial-selection-completion.md`
anlegen: Repro, Anzeigevertrag, geänderte Dateien, tatsächliche Tests und
Browserergebnisse, Begrenzungen, synthetische Mutationen, Bereinigung und
nächster konkreter Befund. Diese Übergabe dann als ausgeführt kennzeichnen;
Root-README und alle betroffenen Indizes auf den aktuellen Stand bringen.
Den alten Praxistestabschluss als historischen Nachweis erhalten.

Abschließend lokale Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace,
finale LF, `git diff --check`, Secret-/Fremdbestandsheuristik der Änderungen,
DOCX-Hashes, Wurzelmetadaten von `tmp/pagination-build`, eigene Prozess-/
Temp-Reste sowie vollständigen Git-Endstand prüfen. Keine absolute
Fehlerfreiheit zusagen und keine nicht ausgeführte Prüfung als bestanden
darstellen. Nur bei einem konkreten nicht selbst lösbaren Widerspruch fragen;
keine zusätzliche allgemeine Freigabeschleife einführen.
