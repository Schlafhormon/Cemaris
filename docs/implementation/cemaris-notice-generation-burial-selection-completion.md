# Abschluss: verständliche Beisetzungsauswahl im 6c-Entwurf

Stand: 07.09.2026

Status: **Implementiert und im isolierten Browser bis DOCX und echtem
LibreOffice-PDF geprüft.** Grundlage sind die
[Umsetzungsübergabe](cemaris-notice-generation-burial-selection-next-step-handoff.md)
und die [Projektentscheidung](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp).
Der [vorherige Praxistestabschluss](cemaris-notice-generation-prototype-trial-completion.md)
bleibt als historischer Nachweis unverändert.

## Reproduktion und Anzeigevertrag

Vor der Produktänderung wurde das Downloadformular mit zwei synthetischen
Beisetzungen vom 20.08.2026 geöffnet. Der gezielte Regressionstest scheiterte
an der erwarteten Personen-/Grabbeschriftung: Beide Optionen zeigten nur Datum
und technische Beisetzungs-ID. Ergebnis dieses bewusst roten Laufs: ein
fehlgeschlagener, neun nicht ausgewählte Tests.

Jetzt zeigt die Auswahl Datum, getrimmte vorhandene Namensteile und den
kanonischen Grabbezug, beispielsweise:

`20.8.2026 · Ida Synthetik · Testfriedhof / Bereich B / Feld B / Reihe 2 / SYN-002`

- Personen kommen aus `CaseOverview.deceasedPersons` und werden ausschließlich
  über `burial.deceasedPersonId` zugeordnet.
- Der vorhandene Client `getBurialProcessMasterData(signal)` liest einmal je
  aufgebautem Erzeugungsformular den bestehenden Vertrag
  `GET /api/burial-process/master-data`. Kein Abruf je Option. Der erste
  zusätzliche Development-StrictMode-Abruf wird beim Cleanup abgebrochen.
- Grabstellen werden ausschließlich über `burial.graveSiteId` aufgelöst.
  Der Fallgrabbezug ist keine Ersatzquelle. Friedhof, optionale Bereiche,
  Felder und Reihen sowie Grabnummer werden in dieser Reihenfolge angezeigt;
  leere optionale Teile entfallen. Inaktive, belegte oder gesperrte Grabstellen
  werden für die Beschriftung nicht herausgefiltert.
- Ein aufgelöster Datensatz ohne Namen zeigt `Name nicht angegeben`.
  Unaufgelöste Beziehungen zeigen `Person nicht aufgelöst (ID)` beziehungsweise
  `Grabstelle nicht aufgelöst (ID)`. Fehlende Friedhofs-/Grabnummerntexte werden
  ebenfalls ausdrücklich benannt. Andere Fall- oder Nachbardaten werden nicht
  eingesetzt.
- Nur sonst identische Optionsbeschriftungen erhalten zusätzlich
  `Beisetzungs-ID: …`. Die Optionswerte bleiben immer die Beisetzungs-IDs.
- Ladehinweis und echter Stammdatenfehler sind sichtbar. Eine schon gewählte
  ID bleibt sowohl nach erfolgreichem Nachladen als auch bei HTTP 503 erhalten.
  Abgebrochene oder verspätete Antworten aktualisieren die beendete Ansicht
  nicht. Fall- und Entwurfswechsel trennen den Lebenszyklus des Formulars.
- Das Auswahlfeld nutzt die volle Formularbreite. Unterhalb steht die gewählte
  Beschriftung zusätzlich als umbrechender Text für schmale Fenster.

Der bestehende Filter auf Beisetzungsdatum, Personen- und Grabstellenreferenz,
die manuelle Auswahlpflicht, Satzungsauswahl, Formatwahl und der
Generation-Request bleiben erhalten. Fehlende Anzeigedaten führen zu keiner
neuen fachlichen Zulassungsregel. Bei ausgeschalteter Capability erscheinen
weder Erzeugungsformular noch zusätzlicher Stammdatenabruf. Serverseitige
Validierung, Anmeldung, Rollen, CSRF, starker ETag und Sicherheitsprüfungen
bleiben unverändert.

## Geänderte Dateien

Produktcode und Regressionstests:

- [NoticeDraftPanel.tsx](../../src/Cemaris.Web/src/components/NoticeDraftPanel.tsx):
  Personenprop, Referenzauflösung, Beschriftungen, Ladezustände und Darstellung.
- [CaseDetailsPage.tsx](../../src/Cemaris.Web/src/pages/CaseDetailsPage.tsx):
  vorhandene Personen weiterreichen und Panel an die Fall-ID binden.
- [NoticeDraftPanel.test.tsx](../../src/Cemaris.Web/src/components/NoticeDraftPanel.test.tsx):
  zwei Beisetzungen mit abweichend sortierten Quellen, zweite Auswahl im
  unveränderten Request einschließlich Satzung, Format, CSRF und starkem ETag;
  fehlende Namen/Referenzen, optionale Ebenen, identische Texte, bestehender
  Filter, Capability, Nachladen, HTTP 503, Abbruch und verspätete Antwort.
- [CaseDetailsPage.test.tsx](../../src/Cemaris.Web/src/pages/CaseDetailsPage.test.tsx):
  tatsächliche Datenübergabe, abweichender Fallgrabbezug und Fallwechsel während
  des Beschriftungsabrufs.

Root-README, fünf Dokumentationsindizes, aktueller Statusabschnitt der
Projektentscheidung und die Umsetzungsübergabe verweisen auf diesen Abschluss.
Typverträge, API-Client, Backend, Stylesheet, Paketdateien, portable
Konfigurationen und DOCX-Quellen wurden nicht geändert. Formularreset und
vorhandene AbortSignal-Korrekturen bleiben erhalten.

## Tatsächlicher Browser- und Dateinachweis

Die temporäre Erweiterung der `NoticeGenerationWebApplicationFactory`
verwendete Kestrel auf `127.0.0.1:5058`, Vite auf `127.0.0.1:5178`,
`Development`, synthetische Fachstores und nachweislich `TestLocalAccountStore`.
Die Anmeldung erfolgte im regulären Loginformular mit der vorhandenen
synthetischen Testidentität. Ausschließlich der Prüfhost stellte das
Authentifizierungsschema auf reguläre Cookies zurück. Alle sechs Capabilities
waren nur im Hostprozess aktiv; alle drei Maintenance-Schalter waren `false`.

Playwright steuerte installiertes Edge über die vorhandene lokale Bibliothek.
Nach der UI-Anmeldung wurden über die bestehenden authentifizierten
HTTP-Anwendungsverträge ein Friedhof, eine Grabart samt Zuordnung, zwei
Grabstellen, ein neuer Fall, Emil und Ida Synthetik sowie deren Beisetzungen
angelegt. Beide Beisetzungen wurden geplant, bestätigt und mit tatsächlichem
Datum 20.08.2026 durchgeführt. Der Fallgrabbezug wurde ausdrücklich auf die
erste Grabstelle gesetzt. Hinzu kamen ein Beteiligter mit Primäranschrift,
Nummernkonfiguration und eine aktive synthetische Satzungsversion.

Im Browser wurden der Zahlungspflichtige gesucht und ausgewählt, Gebührenfakten
manuell ausgefüllt, die Zahlungspflichtigenauswahl bestätigt und genau ein
Entwurf angelegt. Erfolgsmeldung, geleertes Anlageformular und aufgehobene
Bestätigung wurden geprüft. Die Beisetzungsauswahl war zunächst leer; danach
wurde ausdrücklich die zweite Option, Ida Synthetik mit `SYN-002`, gewählt.
DOCX und PDF wurden über den Downloadknopf erzeugt. Die beobachteten Requests
enthielten genau diese Beisetzungs-ID sowie Satzung, Format, CSRF und starken
Entwurfs-ETag.

Der PDF-Dummy wurde im Prüfhost durch `LibreOfficeNoticePdfConverter` mit
`DirectNoticeProcessRunner` und `C:\Program Files\LibreOffice\program\soffice.com`
ersetzt. Der tatsächliche Konverter liegt in
`src/Cemaris.Infrastructure/NoticeGeneration/NoticeGenerationFiles.cs`; der in
der Übergabe genannte separate Dateipfad existiert nicht. Der kurze neue
Konvertertempstamm war `src/Cemaris.Api/t6cs`; Produktlimits blieben unverändert.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| DOCX | `SYN6CS.2026000001.docx`, 27.327 Byte, Browserdownload erfolgreich |
| Echtes LibreOffice-PDF | `SYN6CS.2026000001.pdf`, 282.648 Byte, Browserdownload erfolgreich |
| HTTP-Vertrag beider Downloads | HTTP 200, passender MIME-Typ und Attachment-Dateiname, `Cache-Control: no-store`, `Pragma: no-cache`, `X-Content-Type-Options: nosniff` |
| Referenzvergleich in beiden Dateien | Ida Synthetik, `SYN-002`, Testfriedhof Beisetzungsauswahl und 20.08.2026 vorhanden; Emil Synthetik und `SYN-001` fehlen |
| Weitere Inhalte | 125,50 EUR, Bescheiddatum 28.08.2026 und Fälligkeit 28.09.2026 stimmen |
| Kennzeichnung und Tokens | `RECHTLICH WIRKUNGSLOSER ENTWURF` genau einmal je Datei; keine Resttokens |
| PDF-Struktur und Sichtprüfung | eine DIN-A4-Seite, 1.604 selektierbare Zeichen, 175 Wörter; mit PyMuPDF gerendert und betrachtet, keine erkennbaren Überlagerungen oder abgeschnittenen Dokumentinhalte |
| Browserdarstellung | Screenshots bei 1440 und 390 Pixeln Fensterbreite betrachtet; bei 390 Pixeln vollständige gewählte Beschriftung im umbrechenden Zusatztext, kein horizontaler Formular- oder Seitenüberlauf |
| Sitzungsende | Abmeldung im Kontomenü, Loginformular wieder sichtbar, anonymer Fallzugriff HTTP 401, keine unbehandelten JavaScript-Seitenfehler |

Die ersten Diagnoseanläufe korrigierten ausschließlich Prüfselektoren:
Abmelden liegt im Kontomenü, Suchen kommt zweimal vor und die Auswahlfelder
benötigten passend gefasste zugängliche Namen. Zwei Diagnosehosts wurden vor
dem erfolgreichen frischen Aufbau beendet; deren begonnene synthetische Daten
endeten mit den Speicherstores. Ein separater Hintergrundstart von Vite wurde
automatisch blockiert; der direkt an die Werkzeugsitzung gebundene Start war
erfolgreich. Keine Browserinstallation oder Projektabhängigkeit wurde ergänzt.

## Qualitätsprüfungen

Jeder .NET-Aufruf verwendete ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.

| Tatsächlich ausgeführte Prüfung | Ergebnis |
| --- | --- |
| Solution-Restore `--locked-mode` | erfolgreich |
| Formatprüfung `--verify-no-changes --no-restore` | erfolgreich, auch nach Entfernung des Prüfhosts |
| Release-Solution-Build | erfolgreich, abschließend ohne temporären Prüfhost, 0 Warnungen / 0 Fehler |
| Unit-Tests | 81/81 bestanden |
| Integrationstests `--filter "Category!=SqlServer"` | 70/70 bestanden |
| Temporärer Browserhost | erfolgreicher Abschluss mit 1/1; anschließend entfernt und neu gebaut |
| `npm ci` | erfolgreich, Lockfile unverändert |
| Gezielte Panel-/Fallseitentests | 19/19 bestanden |
| `npm run test -- --run --maxWorkers=2` | 70/70 Tests in zwölf Dateien bestanden |
| `npm run lint`, `npm run build` | erfolgreich |
| NuGet einschließlich transitiver Pakete | keine bekannten Schwachstellen in sieben Projekten |
| `npm audit` | keine bekannten Schwachstellen |

Bestehende Download-, Blob-Bereinigungs-, Formularreset-, Kontakt-, Satzungs-,
Konverter- und ETag-Regressionsfälle sind weiterhin grün. SQL-kategorisierte
Tests und EDWALT wurden nicht ausgeführt; EDWALT wurde lediglich kompiliert.

## Grenzen, Bereinigung und Endzustand

Die Testmutationen einschließlich Revisionen, Nummernvergabe, Audit und
Testkontositzungen lagen ausschließlich in isolierten Speicherstores. Keine
bestehende Datenbank wurde geöffnet, verändert oder von Testfixtures verwaltet.
Es erfolgten keine Migration, EDWALT-Ausführung, Kontenanlage in bestehenden
Speichern, Secretänderung oder Backup-/Restore-Arbeit. Externe Arbeitswurzeln
blieben unberührt.

Der reguläre Wiederanlauf ohne Aktivierungsvariablen verwendete prozesslokal
den Synthetic-Provider und ausgeschaltete Maintenance. Health war erfolgreich,
`noticeGenerationEnabled=false`, die Erzeugungsroute lieferte HTTP 404.
Auch dieser eigene Prozess wurde anschließend beendet. Eigene Browser-, API-
und Vite-Prozesse, temporärer Prüfhost, Downloads, Screenshots, Renderbilder,
Prüfskripte und Konverterartefakte wurden bereinigt. Portable Defaults bleiben
unverändert ausgeschaltet.

SHA-256 vor und nach der Sitzung unverändert:

- Pilotfixture: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- Vergleichsquelle: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

Von `tmp/pagination-build` wurden ausschließlich Wurzelmetadaten verglichen:
Verzeichnisattribut unverändert, Erstellung
`2026-08-14T10:27:21.4014388Z`, letzte Änderung
`2026-08-14T10:27:21.4062644Z`. Keine Inhalte wurden aufgelistet oder geöffnet.
Lokale Markdown-Links/-Anker, Tabellen, Codezäune, Whitespace, finale LF,
`git diff --check`, Änderungsheuristik für Secrets/Fremdbestände sowie eigene
Prozess-/Tempreste wurden abschließend geprüft. Die Dokumentationsprüfung
umfasste 121 Markdown-Dateien, 666 lokale Links, 26 Ankerverweise,
217 Tabellen und 46 geschlossene Codeblöcke; kein Befund und keine
Secretkandidaten in den Änderungen.

Ausgangs- und End-HEAD: `e79561b570d56ce18c7f250c59eac7dfb9096c8e`, Branch
`main`, Upstream `origin/main`, Ahead/Behind 1/0. Der anfangs saubere Arbeitsbaum
enthält nur die vier beabsichtigten TSX-Dateien und neun Dokumentationsdateien.
Der Index bleibt unverändert leer; kein Reset, Staging oder Commit.

Die Anmeldung mit einem persistenten lokalen Konto bleibt unbestätigt.
Playwright-Downloads belegen keinen nativen Speichern-Dialog, keine Öffnung in
einem Desktop-Officeprogramm, keinen Papierdruck und keine Rechts- oder
Echtbetriebsabnahme. Die Prüfungen sind Zeitpunktnachweise und keine Zusage
absoluter Fehlerfreiheit.

## Nächster konkreter Befund

Der bestehende Einleitungstext des Panels sagt weiterhin, es erfolge keine
„Bescheiderzeugung“, obwohl bei aktiver Capability direkt darunter die
Entwurfserzeugung angeboten wird. Die Formulierung sollte in einem folgenden
kleinen UI-Auftrag den manuellen Entwurfskern und die flüchtige Ausgabe
verständlich beschreiben. Dieser Textbefund wurde hier nicht zusätzlich
implementiert; neue Fachregeln oder weitere Dokumentarten folgen daraus nicht.

## Nachtrag: Vorbereitung des nächsten Implementierungschritts

Nach dem oben dokumentierten technischen Abschluss hat die Projektverantwortung
die Vorbereitung des weiteren Ausbaus beauftragt. Die
[Roadmap](cemaris-first-operational-version-roadmap.md), der
[Produktvertrag](../requirements/manual-case-follow-ups-decisions.md) und die
[Wiedervorlagenübergabe](cemaris-manual-case-follow-ups-next-step-handoff.md)
halten den nächsten Umfang einschließlich zusätzlich gewünschten Abbruchstatus
fest. Die Einleitungstextkorrektur ist dort als Begleitaufgabe enthalten.

Diese anschließende Vorbereitung ändert ausschließlich Dokumentation. Die
obigen Testzahlen, Prüfzählungen und der Git-Endstand beschreiben den
technischen Beisetzungsauswahl-Abschluss vor diesem Nachtrag; es wurden in
der Vorbereitung keine weiteren Produktänderungen oder Laufzeittests
ausgeführt. Die neue Wiedervorlagenfunktion ist noch nicht implementiert.
