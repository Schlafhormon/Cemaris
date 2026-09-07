# Abschluss des lokalen 6c-Prototyp-Praxistests

Stand: 07.09.2026

Status: **Ausgeführt und technisch erfolgreich abgeschlossen.** Der lokale
HTTP-Ablauf und der am selben Tag nachgeholte isolierte Playwright-Browserlauf
erzeugen DOCX und echtes LibreOffice-PDF. Formularreset und falsche
Ladefehlermeldungen sind korrigiert. Die Anmeldung mit einem persistenten
lokalen Konto bleibt unbestätigt; der genaue Browsernachweis steht unten.

Grundlage sind die [Übergabe](cemaris-notice-generation-prototype-trial-next-step-handoff.md)
und die [Projektentscheidung vom 07.09.2026](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
Es entsteht kein neues allgemeines Freigabegate.

## Getesteter Ablauf und Ausgabe

Der temporäre Integrationstest verwendete die bestehende
`NoticeGenerationWebApplicationFactory`, den synthetischen Fall mit Endziffer
`003` und den isolierten `TestLocalAccountStore`. Das Authentifizierungsschema
wurde für diesen Test auf die reguläre Cookie-Anmeldung zurückgestellt:
anonym HTTP 401, Anmeldung mit vorhandener synthetischer Testidentität,
geschützte API-Arbeit, Abmeldung und danach wieder HTTP 401. Es gab keine
Authentifizierungsänderung im Produktcode.

Die Vorbereitung über die bestehenden HTTP-Verträge legte synthetische
Friedhofs-/Grabstammdaten, eine verstorbene Person, einen Beisetzungsentwurf
sowie einen Beteiligten mit aktueller Primäranschrift an. Die Beisetzung wurde
geplant, bestätigt und als tatsächlich durchgeführt erfasst. Nach manueller
Nummernkonfiguration entstand ein Entwurf über **125,50 EUR**, Bescheiddatum
28.08.2026 und Fälligkeit 28.09.2026, mit ausdrücklich bestätigtem
Zahlungspflichtigem. Eine synthetische Satzungsversion wurde angelegt und
aktiviert. Das synthetische Benutzerkontaktprofil war vollständig.

Der PDF-Dummy wurde ausschließlich im Prüfhost durch
`LibreOfficeNoticePdfConverter` mit `DirectNoticeProcessRunner` und
`C:\Program Files\LibreOffice\program\soffice.com` ersetzt. Zwei erfolgreiche
PDF-Konvertierungen verwendeten damit tatsächlich installiertes LibreOffice.
Der kurze neue Tempstamm lag unter `src/Cemaris.Api/t6ct`; die beiden
autorisierten DOCX-Quellen blieben unverändert.

| Nachweis | Ergebnis |
| --- | --- |
| DOCX-/PDF-Download | jeweils HTTP 200, Attachment, passender MIME-Typ und Dateiendung; Dateiname `SYN6C.2026000001.docx` beziehungsweise `.pdf` |
| Antwortschutz | `Cache-Control: no-store`, `Pragma: no-cache`, `X-Content-Type-Options: nosniff` für beide Formate |
| DOCX | 27.310 Byte, keine Resttokens, Wirkungslosigkeitskennzeichnung genau einmal |
| PDF | 285.190 Byte, eine DIN-A4-Seite, 1.646 selektierbare Zeichen und 178 Wörter, keine Resttokens |
| Inhalt | manueller Betrag, Bescheid-/Fälligkeits-/Beisetzungsdatum, Primäranschrift und eigener synthetischer Benutzerkontakt stimmen |
| Sichtprüfung | mit vorhandenem PyMuPDF gerendert und Seitenbild betrachtet; gut lesbar, keine Überlagerung oder abgeschnittene Inhalte; rote Kennzeichnung `RECHTLICH WIRKUNGSLOSER ENTWURF` deutlich sichtbar |
| Konverterfehler und Wiederholung | kontrolliert injizierter Nichtnull-Prozessstatus im Produktkonverter ergibt HTTP 503 und `notice_pdf_conversion_failed`, keinen Attachment-Inhalt und einen Fehleraudit; anschließende echte PDF-Erzeugung erfolgreich |
| Bereinigung im Konverter | nach DOCX, beiden echten PDF-Läufen und dem injizierten Fehler jeweils leerer Tempstamm; keine LibreOffice-Restprozesse |

Die Prozessfehlersimulation ist kein realer LibreOffice-Fehlabbruch. Die schon
belegten realen Timeout-, Cancellation- und Startbereinigungsversuche wurden
ohne neue Änderung am Konverter nicht erneut vollständig ausgeführt. Die
zugehörigen automatisierten Grenzfalltests liefen mit der Gesamtsuite.

## Bedienung und Grenzen des Nachweises

Die reguläre API lief in `Development` unter `127.0.0.1:5057`, das Vite-Frontend
unter `127.0.0.1:5177`. Alle sechs benötigten Development-Capabilities waren nur
im gestarteten API-Prozess aktiv, Maintenance blieb aus und der Fallprovider
war prozesslokal `Synthetic`. Health, Systeminfo, HTML-Auslieferung,
Vite-API-Proxy und anonymer Anmeldeschutz (HTTP 401) wurden geprüft.

Beim ersten Praxistest war keine Browsersteuerung verfügbar. Deshalb gab es damals keinen bestätigten
Klickdurchlauf, keinen Browser-Dateidialog und keine Anmeldung mit einem
persistenten lokalen Konto. Der vollständige angemeldete Ablauf ist durch
HTTP-Integration und UI-Komponententests belegt. Letztere prüfen unter anderem
Zahlungspflichtigenbestätigung, Download mit Blob-Bereinigung, Kontakt-,
Satzungs-, Konverter- und ETag-Fehler sowie den Erhalt von Korrektureingaben.
Die HTTP-Suite prüft außerdem fehlende, schwache und veraltete ETags,
ungültiges Format, fremde Beisetzung, inaktive Satzung, verworfenen Entwurf,
unvollständigen Kontakt, Rollen, CSRF und ausgeschaltete Capability.

Die folgende Klickfolge wurde anschließend im isolierten Browser ausgeführt.
Für eine spätere Sitzung mit einem persistenten lokalen Konto bleibt sie nutzbar:

1. Regulär anmelden; in der Benutzerverwaltung das eigene vollständige
   Kontaktprofil prüfen. Administrativ eine synthetische Satzungsversion
   anlegen und aktivieren sowie die Nummernkonfiguration prüfen.
2. Einen eindeutig synthetischen Fall öffnen, eine kanonische Grabstelle und
   verstorbene Person zuordnen, die Beisetzung planen, bestätigen und mit
   tatsächlichem Datum durchführen.
3. Unter „Kanonische Bescheidentwürfe“ den synthetischen Beteiligten mit
   aktueller Primäranschrift auswählen, manuelle Gebührenfakten ausfüllen,
   Zahlungspflichtigen bestätigen und den Entwurf anlegen. Erfolgsmeldung,
   leeres Anlageformular und genau einen neuen Entwurf prüfen.
4. Im Entwurf Beisetzung und aktive Satzung auswählen, zuerst DOCX und dann
   PDF herunterladen. Dateien lokal öffnen und sichtbare Kennzeichnung sowie
   Werte prüfen. Danach abmelden, eigene Ausgaben entfernen und Sitzung beenden.

Die Ausgabeprüfung ist keine Rechts- oder Papierdruckabnahme. Die unveränderte
synthetische Vorlage enthält weiterhin ihre vorhandenen Bescheidtexte;
maßgeblich bleibt die sichtbare Kennzeichnung der Wirkungslosigkeit.

## Reproduzierter Bedienfehler

Vor der Produktcodeänderung: Im Entwurfsformular einen Zahlungspflichtigen
wählen, Betrag, Datum, Fälligkeit, Kontierung und Grund erfassen, die Auswahl
bestätigen und den Entwurf anlegen. Die API-Anlage gelingt und der Entwurf
erscheint, gleichzeitig zeigt die Oberfläche
`Cannot read properties of null (reading 'reset')`. Das Formular bleibt
gefüllt. Der erweiterte bestehende Komponententest reproduziert genau diesen
Fehler (ein fehlgeschlagener, acht bestandene Tests).

Erwartet: Nach erfolgreicher Anlage nur die Erfolgsmeldung anzeigen und das
Anlageformular einschließlich Bestätigung leeren; bei API-Fehlern bleiben die
Eingaben erhalten. Ursache ist `event.currentTarget.reset()` nach `await`:
React hat `currentTarget` dann bereits zurückgesetzt. Die kleinste Korrektur
hält das Formular vor dem asynchronen Aufruf in einer lokalen Referenz fest.

Nach der Korrektur bestehen alle neun gezielten Paneltests. Der ergänzte
Regressionstest prüft fehlende Fehleranzeige, geleerten Betrag und aufgehobene
Zahlungspflichtigenbestätigung. Bestehende Tests bestätigen den Erhalt der
Eingaben bei API-Fehlern. Es änderten sich keine Berechnung, API-Verträge,
Migrationen, Vorlagen oder Konfigurationsdateien.

## Qualitätsprüfung

Sämtliche .NET-Befehle verwendeten ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.

| Tatsächlich ausgeführte Prüfung | Ergebnis |
| --- | --- |
| Solution-Restore mit `--locked-mode` | erfolgreich |
| Formatprüfung mit `--verify-no-changes --no-restore` | erfolgreich |
| abschließender Release-Solution-Build | erfolgreich, 0 Warnungen / 0 Fehler |
| Unit-Tests | 81/81 bestanden |
| Integrationstests mit `--filter "Category!=SqlServer"` | 70/70 bestanden |
| zusätzlicher temporärer realer PDF-/Cookie-/HTTP-Test | 1/1 bestanden; nach Prüfung entfernt und Tests anschließend neu gebaut |
| `npm ci` | erfolgreich, Lockfile unverändert |
| `npm run test -- --run` | 58/58 Tests in zwölf Dateien bestanden |
| `npm run lint` und `npm run build` | erfolgreich |
| NuGet einschließlich transitiver Pakete | keine bekannte Schwachstelle in sieben Projekten |
| `npm audit` | null bekannte Schwachstellen in 118 Paketen |

Ein vor Abschluss von `npm ci` gestarteter UI-Test fand `vitest` noch nicht;
nach abgeschlossener Installation wurde er korrekt wiederholt. Der getrennte
rote Regressionstest vor dem Fix ist oben dokumentiert. SQL-kategorisierte
Tests und EDWALT wurden nicht ausgeführt; EDWALT wurde lediglich kompiliert.
Die Ergebnisse sind Zeitpunktnachweise und keine Zusage absoluter Fehlerfreiheit.

## Daten, Bereinigung und Endzustand des ersten Praxistests

Alle fachlichen Testmutationen einschließlich Nummernvergabe, Entwurf,
Satzung, Revisionen und Audits betrafen ausschließlich isolierte synthetische
Speicherstores. Es gab keine Mutation und keinen Testfixture-Zugriff auf
`Cemaris_Dev`, keine Kontenanlage oder Secretänderung und keinen
Backup-/Restore-Auftrag. Die reguläre API wurde nur anonym abgefragt.

Die aktivierte Sitzung wurde beendet. Beim erneuten regulären Start ohne
6c-Aktivierungsvariablen waren Health erfolgreich,
`noticeGenerationEnabled=false` und die Erzeugungsroute HTTP 404. Beide
portablen Konfigurationen bleiben unverändert mit ausgeschalteter
Dokumenterzeugung. Eigene API-/Frontendprozesse, temporärer Prüfcode und
Download-/Render-/Konverterartefakte wurden entfernt.

Beide autorisierten DOCX-Dateien behalten ihre SHA-256-Werte:

- Pilotfixture: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`;
- Vergleichsquelle: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

`tmp/pagination-build` wurde ausschließlich über Wurzelmetadaten verglichen;
Erstellung und letzte Änderung bleiben am 14.08.2026 um 10:27:21 UTC.
Externe Arbeitswurzeln blieben unberührt. Markdown-Links/-Anker, Tabellen,
Codezäune, Whitespace, finale LF, Änderungsheuristik für Secrets und
Fremdbestände sowie `git diff --check` wurden abschließend ohne Befund geprüft:
119 Markdown-Dateien, 643 lokale Links, 23 Ankerverweise, 213 Tabellen und
45 geschlossene Codeblöcke; keine Secretkandidaten in den Änderungen.

Ausgangs- und End-HEAD: `0dd142887435cb67cf71fd79b6f16e70124598c6`, Branch `main`,
Upstream `origin/main`, Ahead/Behind 0/0. Der zuvor saubere Arbeitsbaum enthält
nur acht beabsichtigte Pfade (sechs Markdown-Dateien einschließlich dieses
neuen Abschlusses und zwei TSX-Dateien); der Index bleibt unverändert.
Kein Reset, Staging oder Commit.

## Nachgeholter Playwright-Browserdurchlauf am 07.09.2026

Der Playwright-MCP-Aufruf scheiterte am fehlenden Chrome unter seinem
konfigurierten Benutzerpfad. Die vorhandene lokale Playwright-Version
`1.63.0-alpha-2026-08-31` konnte dagegen den installierten Edge
`148.0.3967.96` über `channel: 'msedge'` steuern. Dafür wurden weder Chrome
installiert noch die MCP-Konfiguration, Browserinstallation oder
Projektabhängigkeiten geändert. Der funktionierende Nachweis verwendet die
lokale Playwright-Bibliothek; der MCP-Standardstart bleibt fehlkonfiguriert.

Die reguläre API auf `127.0.0.1:5057` und Vite auf `127.0.0.1:5177` liefen
mit prozesslokaler Aktivierung. Der sichtbare Edge zeigte die Anmeldeseite;
Health, sechs Capabilities und anonymer Schutz mit HTTP 401 waren bestätigt.
Die angeforderte Benutzeranmeldung erfolgte nicht. Deshalb gibt es weiterhin
keinen Nachweis einer Anmeldung mit einem persistenten lokalen Konto.
Dieses Browserfenster und die Sitzung wurden anschließend geschlossen.

Der vollständige automatisierte Klickdurchlauf lief in einem getrennten
Headless-Edge mit 1440 × 1000 CSS-Pixeln. Ein temporärer Prüfhost erweiterte die
vorhandene `NoticeGenerationWebApplicationFactory` um Kestrel ausschließlich
auf `127.0.0.1:5058`; Vite verwendete `127.0.0.1:5178`. Alle Fachstores waren
synthetisch und der Account-Store nachweislich `TestLocalAccountStore`.
Die Factory-Authentifizierung wurde ausschließlich im Prüfhost auf das
reguläre Cookie-Schema zurückgestellt. Playwright füllte das Anmeldeformular
mit der vorhandenen synthetischen Testidentität aus und klickte „Anmelden“.
Der PDF-Dummy wurde durch `LibreOfficeNoticePdfConverter` ersetzt; der
Produkt-Prozessadapter startete installiertes `soffice.com` und verwendete
den kurzen Tempstamm `src/Cemaris.Api/t6cbi`.

### Tatsächlich geklickter Ablauf

1. Synthetischen Friedhof, Grabart, Zuordnung und kanonische Grabstelle
   `SYN-6CB-001` in den Stammdaten anlegen.
2. Neue synthetische Fallakte über diese Grabstelle anlegen, eine verstorbene
   Person hinzufügen und eine Beisetzung als Entwurf erfassen; anschließend
   planen, bestätigen und mit tatsächlichem Datum 20.08.2026 durchführen.
3. Nummernkonfiguration `SYN6CB` mit sechs laufenden Stellen anlegen,
   synthetische Satzungsversion vom 01.01.2026 anlegen und aktivieren.
   Eigenes vollständiges synthetisches Kontaktprofil und Benutzerverwaltung
   im Browser prüfen; keine Konten- oder Kontaktmutation vornehmen.
4. Synthetischen Beteiligten mit aktueller Primäranschrift anlegen, im
   Fallpanel suchen und auswählen. 125,50 EUR, Bescheiddatum 28.08.2026,
   Fälligkeit 28.09.2026, Kontierung und Gebührenquelle manuell erfassen,
   Zahlungspflichtigen aktiv bestätigen und den Entwurf anlegen.
5. Tatsächliche Beisetzung und aktive Satzung auswählen; DOCX und echtes
   PDF durch den Downloadknopf herunterladen. Nach der Ladefehlerkorrektur
   die Anlage und beide Downloads wiederholen. Dabei entsteht genau ein
   zusätzlicher Entwurf, die Erfolgsmeldung bleibt sichtbar, das Anlageformular
   ist leer und die Bestätigung aufgehoben.
6. Abmelden; die Oberfläche zeigt wieder die Anmeldung und geschützter
   Fallzugriff liefert HTTP 401. Null unbehandelte JavaScript-Seitenfehler.

| Browsernachweis nach der Korrektur | Ergebnis |
| --- | --- |
| DOCX | `SYN6CB.2026000002.docx`, 27.339 Byte, erfolgreicher Browserdownload |
| Echtes LibreOffice-PDF | `SYN6CB.2026000002.pdf`, 284.328 Byte, erfolgreicher Browserdownload |
| Antworten | HTTP 200, passende MIME-Typen, Dateinamen und `Cache-Control: no-store`; zuvor auch `Pragma: no-cache`, Attachment und `nosniff` für beide Formate bestätigt |
| PDF-Inhalt und Sichtprüfung | eine A4-Seite, 1.641 selektierbare Zeichen, korrekte synthetische Personen-/Grabdaten, Betrag und Termine; keine Resttokens, Wirkungslosigkeitskennzeichnung genau einmal |
| Darstellung | endgültiges PDF mit PyMuPDF gerendert und betrachtet; Browserpanel ebenfalls als Screenshot geprüft; keine abgeschnittenen Inhalte oder Überlagerungen |
| Nachladen und Anlage | Fallanlage, Fallbearbeitung, Entwurfsliste und Satzungsauswahl ohne falsche Fehlermeldung; genau ein neuer Entwurf pro Anlage |

Der Browserdownload wurde als Playwright-Downloadereignis erfasst und lokal
gespeichert. Ein nativer „Speichern unter“-Dialog, das Öffnen in einem
Desktop-Officeprogramm und Papierdruck wurden nicht geprüft. Die DOCX-Datei
wurde strukturell, das PDF zusätzlich gerendert geprüft. Es entsteht keine
Rechts-, Papierdruck- oder Echtbetriebsabnahme.

### Zusätzlicher reproduzierter Bedienfehler und Korrektur

Vor der neuen Änderung zeigte das Öffnen der Fallanlage bereits „Die Fallakte
konnte nicht angelegt werden“, die Fallbearbeitung einen Änderungsfehler und
das Bescheidpanel `signal is aborted without reason`. Beim ersten Anlegen
eines Entwurfs ersetzte dieselbe Meldung den Erfolg, obwohl genau ein Entwurf
gespeichert und das Formular bereits korrekt geleert war.

Ursache: Der Development-StrictMode bricht den ersten Effektabruf beim
erneuten Aufbau ab. Mehrere Ladefehlerbehandlungen meldeten diese erwartete
Cancellation als fachlichen Fehler. Die Korrektur in `NewCasePage`,
`CaseEditPage` und `NoticeDraftPanel` prüft das jeweilige AbortSignal vor der
Fehleranzeige. Tatsächliche Speicher-, API-, Rollen- und ETag-Fehler werden
weiterhin angezeigt. Die vorhandene Formularreset-Korrektur bleibt erhalten.

Drei neue StrictMode-Regressionsfälle waren vor dem Fix rot. Zwei weitere
Fälle sichern echte Stammdatenfehler mit HTTP 503 ab. Abschließend bestehen
28 gezielte Tests in `App.test.tsx` und `NoticeDraftPanel.test.tsx`; der
Browsernachlauf bestätigt dieselbe Korrektur einschließlich Satzungsabruf
nach Entwurfsanlage. Die erste Zwischenkorrektur ließ einen Fall offen;
die abschließende Korrektur verwendet auch dort das konkrete AbortSignal.

### Qualitätsprüfung, Testdaten und Bereinigung des Browserauftrags

Restore mit gesperrten Abhängigkeiten, Formatprüfung und Release-Solution-Build
wurden erneut ausgeführt; der Build hat null Warnungen und Fehler. Unit-Tests
bestehen mit 81/81, Integrationstests mit `Category!=SqlServer` mit 70/70.
Der erfolgreiche temporäre Browser-Prüfhost besteht separat mit 1/1 und wurde
danach entfernt; der abschließende Build enthält ihn nicht mehr. `npm ci`,
63/63 Frontendtests in zwölf Dateien, Lint und Produktionsbuild sind erfolgreich.
NuGet einschließlich transitiver Pakete und `npm audit` melden keine bekannte
Schwachstelle. Alle .NET-Aufrufe verwendeten das oben festgelegte SDK.

Diagnoseanläufe waren keine Produktfehler: zunächst blockierte die laufende
eigene API eine Buildausgabe; der Prüfhost wurde anschließend ohne erneuten
Build seiner Projektreferenzen gebaut. Ein unpassender Playwright-Selektor
führte zum Neustart ausschließlich des isolierten Hosts. Ein verfrühter
Neustart traf noch auf dessen belegten Port. Die zunächst auf acht Sekunden
begrenzte Browserwartezeit war für PDF zu kurz; mit ausreichend langer
Beobachtung gelangen Download und Prüfung. Kein Konverterlimit wurde geändert.
Eine beim abschließenden Lint gefundene Effekt-Abhängigkeit wurde korrigiert.
Ein gleichzeitiger Gesamtlauf mit den .NET-Tests überschritt im unveränderten
Benutzerverwaltungstest dessen Fünfsekundenlimit. Der abschließende
Frontendlauf verwendete deshalb `--maxWorkers=2`; Test- und Produktzeitlimits
blieben unverändert.

Im erfolgreichen isolierten Lauf entstanden ein Friedhof, eine Grabart,
eine Zuordnung, eine Grabstelle, eine Fallakte, eine verstorbene Person,
eine tatsächliche Beisetzung, ein Beteiligter mit Primäranschrift, eine
Nummernkonfiguration, eine aktive Satzung und zwei manuelle Entwürfe samt
Revisionen und Audits. Die verworfene Diagnosesitzung enthielt nur begonnene
synthetische Stammdaten. Alles lag ausschließlich im Speicher der Testhosts
und endete mit ihnen. Es gab keine Mutation oder Fixture-Verwaltung von
`Cemaris_Dev`, keine SQL-Tests, Migrationen, Seeds, Kontenanlage, Secretänderung,
Backup-/Restore-Arbeit oder EDWALT-Ausführung.

Beide aktivierten API-Sitzungen, Frontends und eigenen Browserprozesse wurden
beendet. Beim regulären Wiederanlauf ohne Aktivierungsvariablen waren Health
HTTP 200, `noticeGenerationEnabled=false` und die Erzeugungsroute HTTP 404.
Auch dieser Prozess wurde beendet. Eigene Prüfskripte, Downloads, Screenshots,
Renderbilder und die leeren kurzen Konvertertempstämme wurden entfernt.
Portable Konfigurationen, Paketdateien und beide DOCX-Hashes sind unverändert;
`tmp/pagination-build` wurde ausschließlich an den unveränderten
Wurzelmetadaten verglichen. Externe Arbeitswurzeln blieben unberührt.

Der Browserauftrag begann bereits mit den acht oben beschriebenen geänderten
Pfaden. Diese Arbeit bleibt erhalten. Der Endstand umfasst elf Pfade: sechs
Markdown-Dateien und fünf TSX-Dateien. Branch, HEAD, Upstream und Ahead/Behind
bleiben wie oben; der Index ist leer, kein Reset, Staging oder Commit.
Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace, finale LF,
Änderungsheuristik für Secrets/Fremdbestände und `git diff --check` wurden
erneut geprüft: 119 Markdown-Dateien, 643 lokale Links/Anker, 214 Tabellen,
45 geschlossene Codeblöcke und null Secretkandidaten in den Änderungen.
Die Nachweise sind zeitpunktbezogen, keine Zusage absoluter
Fehlerfreiheit und kein neues allgemeines Freigabegate.

## Nächster konkreter Verbesserungsschritt

Der nächste Auftrag ist in der
[eigenständigen Übergabe zur Beisetzungsauswahl](cemaris-notice-generation-burial-selection-next-step-handoff.md)
für einen neuen Chat vorbereitet, aber noch nicht implementiert. Diese
nachträgliche Dokumentationsvorbereitung ändert die obigen datierten
Testnachweise und den Git-Endstand des Browserauftrags nicht.

Die Beisetzungsauswahl im Downloadformular soll neben dem Datum den Namen der
verstorbenen Person und den Grabbezug anzeigen. Aktuell steht dort nur Datum
plus technische Beisetzungs-GUID; bei mehreren Beisetzungen erschwert das die
sichere manuelle Zuordnung. Diesen kleinen UI-Schnitt mit zwei synthetischen
Beisetzungen testen und die bereits nachgeholte Browser-Klickfolge erneut prüfen.
