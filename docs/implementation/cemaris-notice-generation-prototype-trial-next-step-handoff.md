# Nächster Schritt: lokaler 6c-Prototyp-Praxistest

Stand: 07.09.2026

Status: **Am 07.09.2026 ausgeführt.** Der
[Abschlussnachweis](cemaris-notice-generation-prototype-trial-completion.md)
dokumentiert HTTP-Ablauf, echten LibreOffice-PDF-Nachweis, Bedienkorrekturen,
Tests, Bereinigung und den nachgeholten isolierten Playwright-Browsercheck.
Die Anmeldung mit einem persistenten lokalen Konto bleibt unbestätigt. Die folgende
Übergabe bleibt als Auftragsgrundlage erhalten; der Auftrag wird nicht erneut
als Vorbereitung geführt.

Der nächste ausführbare UI-Auftrag steht in der
[Übergabe zur verständlichen Beisetzungsauswahl](cemaris-notice-generation-burial-selection-next-step-handoff.md).
Die folgende Praxistest-Anweisung ist kein erneut offener Gesamtauftrag.

## Auftrag und maßgebliche Entscheidung

Den bereits implementierten Beisetzungsgebührenentwurf praktisch erproben:
den Weg von einem synthetischen Fall über den manuellen Entwurf bis zum
DOCX-/PDF-Download prüfen, konkrete Fehler reproduzieren und passend beheben.
Die Benutzeroberfläche soll einen verständlichen, nutzbaren Ablauf bieten.

Maßgeblich ist die
[Projektentscheidung vom 07.09.2026](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
Sie ersetzt für diesen lokalen Prototypen die frühere allgemeine Stop-Regel.
Keine weitere allgemeine Freigaberunde, kein erneuter Backup-/Restore-Auftrag
und keine vorgeschaltete Remediation der zurückgestellten Betriebsmaßnahmen.
Der historische Abschluss wird nicht nachträglich in Variante B umgeschrieben.

## Arbeitsverzeichnisse und Programme

Alle Repositorypfade beziehen sich auf:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

| Zweck | Pfad relativ zur Repositorywurzel |
| --- | --- |
| Solution | `Cemaris.sln` |
| API und regulärer Content-Root | `src/Cemaris.Api` |
| Frontend | `src/Cemaris.Web` |
| Unit-Tests | `tests/Cemaris.UnitTests` |
| Integrationstests | `tests/Cemaris.IntegrationTests` |
| Gewählte Pilotvorlage, read-only | `src/Cemaris.Api/Templates/Cemaris-Beisetzungsgebuehren-Testvorlage.docx` |
| Autorisierte Vergleichsquelle, read-only | `tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` |
| Allgemeine auftragsspezifische Temp-Artefakte | neue kollisionsfreie kurze Wurzel unter `tmp` |

Für jeden .NET-Befehl ausschließlich:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

LibreOffice, zuletzt am 02.09.2026 als Version 26.8.0.3 geprüft:

`C:\Program Files\LibreOffice\program\soffice.exe`

`C:\Program Files\LibreOffice\program\soffice.com`

Die früheren Prüfhosts unter `tmp/notice-generation-operational-remediation-20260902`
und Ausgaben unter `tmp/6c-ops-20260902` wurden entfernt. Sie sind keine
Voraussetzung für diesen Auftrag.

## Zuerst lesen und Ausgangszustand prüfen

1. Diese Übergabe und den aktuellen Entscheidungsabschnitt der
   [Pilotakte](../requirements/notice-generation-pilot-release-decisions.md).
2. Den [Betriebsremediations-Abschluss](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
   und den [Readiness-Abschluss](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
   als vorhandene technische Nachweise, nicht als erneut auszuführende Aufträge.
3. [6c-Abschluss](cemaris-increment-6c-completion.md),
   [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md),
   Root-README und SECURITY.md sowie den tatsächlich betroffenen Code und Tests.

Vor Änderungen den tatsächlichen vollständigen Git-Stand einschließlich
Branch, HEAD, Upstream, Index, unversionierter Dateien und Diffs prüfen.
Vorhandene Arbeit erhalten; nichts zurücksetzen, stagen oder committen.
Der Projektleiter kann die aktuelle Dokumentation vor diesem Chat bereits
committed haben. Nicht auf eine frühere HEAD-ID festlegen.

Von `tmp/pagination-build` ausschließlich die Wurzelmetadaten vor und nach
der Arbeit vergleichen, niemals Inhalte öffnen oder auflisten. Externe
EDWALT-, Phase-, Satzungs-, Vorlagen- und DMS-Arbeitswurzeln bleiben unberührt.

## Lokale Testsitzung

- API ausschließlich in `Development` und API/Frontend nur an Loopback
  betreiben. Fremde laufende Prozesse nicht beenden.
- Keine systemweiten Konten-, ACL-, Verschlüsselungs-, Quota-, Dienst-,
  LibreOffice- oder Monitoringänderungen ausführen. Fehlende Härtung ist
  kein Auftrag, den Entwicklungsrechner umzukonfigurieren.
- Die NoticeGeneration-Capability und ihre in `Program.cs` geprüften
  abhängigen Capabilities nur prozesslokal für die Sitzung aktivieren.
  Portable Dateien, User-Secrets und maschinenweite Einstellungen bleiben
  unverändert. Maintenance-Schalter für Migrationen, Kontenanlagen und
  synthetisches SQL-Seeding müssen aus sein.
- Vorhandene synthetische Provider und isolierte Testinfrastruktur für
  automatisierte Prüfungen verwenden. Der reguläre Synthetic-Provider allein
  isoliert die Anmeldung nicht: `AddCemarisInfrastructure` bindet lokale
  Konten weiterhin an EF. Automatisierte Testhosts müssen daher auch den
  Account-Store mit der vorhandenen Testinfrastruktur isolieren.
- Die vorhandene `NoticeGenerationWebApplicationFactory` ersetzt den
  PDF-Konverter durch einen Dummy. Für den realen PDF-Nachweis ausdrücklich
  den Produktkonverter mit installiertem LibreOffice verwenden.
- Für den interaktiven Ablauf die reguläre Anmeldung nutzen. Keine
  Authentifizierungsumgehung in Produktcode einbauen. Falls eine Anmeldung
  durch den Benutzer erforderlich ist, nur diesen konkreten Bedienungsschritt
  anfordern und unabhängige Prüfungen fortsetzen.
- Im regulären lokalen Anwendungsbetrieb dürfen ausschließlich synthetische
  Testfälle über bestehende UI-/Anwendungswege bearbeitet werden. Keine
  pauschalen Seeds, Löschungen oder Datenbankbereinigungen. Testmutationen
  und ihre Persistenz knapp dokumentieren; bestehende Daten erhalten.
- Die Verbindung zu `Cemaris_Dev` nur über vorgesehene Anwendungs-/EF-Pfade
  verwenden. Keine Secretwerte, User-Secrets-Dateien, Verbindungszeichenfolgen,
  Anmeldenamen oder Passwörter lesen, ausgeben oder dokumentieren.
- `Cemaris_Dev` niemals überschreiben, wiederherstellen, leeren,
  zurücksetzen, löschen oder von Testfixtures verwalten lassen.
  SQL-kategorisierte Tests weder dort noch gegen
  `Cemaris_Dev_RestoreCheck_20260902` ausführen. Das frühere Restore-Ziel
  nicht neu erzeugen; die erhaltene Sicherung nicht verändern oder löschen.
- Die beiden autorisierten DOCX-Quellen unverändert lassen. Kurze Temp-Pfade
  verwenden. Der Produktkonverter verlangt seinen Tempstamm innerhalb des
  API-Content-Roots: dort ist ein neues auftragsspezifisches kurzes Verzeichnis
  erlaubt; keine Pfadprüfung für `..`-Ausbrüche abschalten. Allgemeine
  Diagnostik bleibt unter Repository-`tmp`. Nur eigene Artefakte bereinigen.

## Prüfen, beheben, erneut ausprobieren

1. Synthetischen Fall, Beteiligten-/Zahlungspflichtigenbezug, tatsächliche
   Beisetzung, vollständigen Benutzerkontakt, aktive synthetische Satzung
   und manuellen Gebührenentwurf über vorhandene Verträge zusammenstellen.
2. DOCX und echtes LibreOffice-PDF erzeugen. Download, Dateiname, MIME,
   No-Store, DIN A4, lesbaren Text, fehlende Resttokens und die sichtbare
   Kennzeichnung `RECHTLICH WIRKUNGSLOSER ENTWURF` prüfen. PDF rendern und
   visuell prüfen. Keine Rechts- oder Papierdruckabnahme daraus ableiten.
3. Den Browserablauf prüfen, soweit die vorhandenen Werkzeuge dies erlauben.
   Fehlt eine Browsersteuerung, HTTP-/Integrationsergebnis getrennt berichten
   und eine kurze manuelle Klickfolge liefern; keinen Browsererfolg behaupten.
4. Relevante Validierungs-/ETag-Fehler und Konverterfehler sowie
   Temp-/Prozessbereinigung gezielt prüfen. Bereits belegte Grenzfälle nur
   bei Änderungen oder konkretem Anlass erneut vollständig ausführen.
5. Vor Produktcodeänderungen den konkreten Fehler mit Repro und erwartetem
   Verhalten kurz festhalten, die kleinste sinnvolle Korrektur umsetzen und
   mit passendem Regressionstest prüfen. Verständlichkeits- und Bedienfehler
   zählen ebenfalls. Keine neue Berechnung, Rechtswirkung, Dokumentart,
   Integration oder Migration in diesen Praxistest aufnehmen.
6. Die Sitzung beenden, ausschließlich eigene Prozesse und Temp-/Download-/
   Renderartefakte entfernen und deaktivierten Start sowie unveränderte
   portable Defaults bestätigen.

## Angemessene Qualitätsprüfung und Abschluss

Bei Änderungen am ausführbaren Code Solution-Restore, Formatprüfung,
Release-Build, Unit- und nicht-SQL-Integrationstests sowie im Frontend
`npm ci`, `npm run test -- --run`, `npm run lint` und
`npm run build` ausführen. Die nicht-SQL-Integrationstests explizit mit
`--filter "Category!=SqlServer"` begrenzen. Sämtliche .NET-Befehle mit dem
oben angegebenen SDK ausführen. NuGet einschließlich transitiver Pakete und
`npm audit` auf bekannte Schwachstellen prüfen; ohne Anlass keine Paketupdates.
EDWALT darf vom Solution-Build kompiliert, aber nicht ausgeführt werden.
Fehlt ein aktueller nutzbarer Build, ihn auch für den reinen Praxistest erzeugen.
Bei reiner Dokumentationsarbeit genügen die Dokumentationsprüfungen.

In `docs/implementation/cemaris-notice-generation-prototype-trial-completion.md`
kurz festhalten: getesteter Ablauf, tatsächlich ausgeführte Prüfungen,
behobene Fehler, bekannte Einschränkungen, etwaige synthetische
Anwendungsmutationen, Bereinigung und nächster konkreter Verbesserungsschritt.
Kein neues allgemeines Freigabegate erzeugen.

Root-README und betroffene Indizes/Verträge aktualisieren, diese Übergabe
sichtbar als ausgeführt kennzeichnen. Abschließend Markdown-Links/-Anker,
Tabellen, Codezäune, Whitespace und finale LF sowie `git diff --check`,
Secret-/Fremdbestandsheuristik der Änderungen, DOCX-Hashes, eigene
Temp-/Prozessreste und den vollständigen Git-Endzustand prüfen.
Nicht ausgeführte Prüfungen und tatsächliche Blocker ehrlich benennen.
Bestandene Tests sind keine Zusage absoluter Fehlerfreiheit.
