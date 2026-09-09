# M3a-Abschluss: manuelle Gebührenpositionen und vollständige Ausgabe

Stand: 09.09.2026

Status: **Implementiert und isoliert nachgewiesen. Capabilities bleiben aus.**
Grundlagen sind die beiden bestätigten [Produktentscheidungen](../requirements/manual-notice-line-items-decisions.md)
und die ausgeführte [Übergabe](cemaris-manual-notice-line-items-next-step-handoff.md).
[ADR-0022](../decisions/ADR-0022-manual-notice-line-items.md) hält die Architektur fest.
Dies ist kein Abschluss der gesamten Roadmap und keine Produktivfreigabe.

## Ausgangsstand und Umfang

Vor Änderungen geprüft: `main`, HEAD
`ce2715d9124d95ec67640cd92cf6f42f400f51a3`, `origin/main` 0/0, Index und
Arbeitsbaum sauber, keine unversionierten Dateien. M1, M2a und die Vorbereitung
waren bereits committed. Kein Reset, Staging oder Commit in dieser Sitzung.
Gearbeitet wurde ausschließlich im Cemaris-Repository. Secrets, EDWALT,
Backups, externe Vorlagenwurzeln und bestehende Datenbanken wurden nicht geöffnet.

Der bestehende Entwurf unterstützt nun `LegacyTotal` und `LineItems`.
Im Positionsmodus werden 1 bis 100 positive EUR-Positionen mit stabilen
serverseitigen IDs und Bezeichnungen von 1 bis 500 Zeichen gespeichert.
Die Summe wird ausschließlich aus den Positionen gebildet; Null, Minus,
dritte Nachkommastellen und Summenüberlauf werden abgewiesen. Domain und
SQL verwenden Dezimalwerte, der Browser ganzzahlige Cents. Neue Mutationen
übertragen Beträge als Dezimalstrings; zusätzliche exakte Lesefelder erhalten
die bestehenden numerischen Verträge. Auch der alte Schreibweg akzeptiert
Dezimalstrings für verlustfreie Bestandskorrekturen.

Anlage, vollständige begründete Korrektur, Umordnen und Entfernen bilden
jeweils einen atomaren Stand mit genau einer neuen Version, vollständiger
Fachrevision und sparsamem Audit. Die ausdrücklich bestätigte begründete
Umstellung erhält Entwurfs-ID, Nummer und Nummernsnapshot. Alte Revisionen
werden nicht umgeschrieben. Eine Rückumstellung gibt es nicht. Der alte
Korrekturweg weist Positionsentwürfe kontrolliert ab; Verwerfen erhält alle
Positionen und Nachweise. Diese Schutzwirkung bleibt bei ausgeschalteter
Positionsbearbeitung bestehen.

Die Oberfläche zeigt Bestandsmodus, Umstellungsvorschlag, verbindliche Summe,
Positionsaktionen und vollständige aktuelle und historische Fakten.
Konflikte erhalten lokale Eingaben; bewusstes Neuladen ersetzt sie.
Anlage setzt Eingaben und Auswahlbestätigung zurück. Entwurfswechsel und
Unmount verhindern die Übernahme verspäteter Antworten; eine laufende
Dokumentanforderung erhält zusätzlich ein AbortSignal.

## API und Speicherung

| Route, jeweils POST | Vertrag |
| --- | --- |
| `/api/cases/{caseId}/notice-drafts/line-items` | vollständiger Kopf und Positionsarray; Anlage ohne Umstellungsgrund oder Bestätigung |
| `/api/notice-drafts/{id}/line-item-corrections` | vollständiger Kopf und Positionsarray, Grund und starker aktueller `If-Match` |
| `/api/notice-drafts/{id}/line-item-conversion` | gleicher vollständiger Vertrag, Grund und zusätzlich `conversionConfirmed=true`; nur aktiver Bestand |

Jede Position überträgt `id` (für neue Zeilen ausdrücklich `null`),
`description` und `amount` als positiven Dezimalstring mit Punkt und höchstens
zwei Nachkommastellen. Reihenfolge ist die Arrayreihenfolge. Eigene Summen,
Positionsnummern, Mengen, Konten oder unbekannte Felder sind nicht zulässig.
`amountExact` und `totalAmountExact` liefern zwei Nachkommastellen ohne
Gruppierung. Der Browser zeigt diese Werte deutsch formatiert an.

Bestehende Cookies, aktive Identität, beide Fachrollen und CSRF bleiben
verbindlich. Nummernkonfiguration bleibt administrativ. Fehlender ETag ergibt
428, schwacher/ungültiger ETag 400, veralteter Stand 412, unzulässiger Zustand
409, fehlender Entwurf 404 und ungültige Referenz 400. Binder- und Speicherfehler
liefern inhaltsarme Antworten. Fehlversuche erzeugen keinen neuen Fachstand.

Die Migration `20260909093624_AddManualNoticeDraftLineItems` ergänzt Modusspalten,
`NoticeDraftLineItems` und `NoticeDraftRevisionLineItems`. Beide Tabellen
haben positive Betrags-/Positionsprüfungen und eindeutige Reihenfolgeindizes.
Alte Migrationen und ADRs bleiben unverändert. Die neue Migration wurde mit
einem temporären Design-Time-Helfer ohne Secrets oder regulären Hoststart
erzeugt; ihr SQL wurde offline gelesen und durch einen permanenten Schematest
auf additive Operationen und Modell-/Snapshot-Konsistenz geprüft.

SQL speichert Kopfversion und Ersetzen der aktuellen Liste innerhalb derselben
Serializable-Transaktion wie Revision/Audit. Bei Anlage gehört die Sequenz
dazu. Vertauschen stabiler IDs kollidiert dadurch nicht mit dem Reihenfolgeindex.
Synthetic kopiert Revisionslisten unabhängig und prüft Nachweise vor der
Veröffentlichung unter dem Coordinator. Mutationsantworten verwenden einen
gespeicherten Snapshot; ein nachträgliches erneutes Lesen kann Antwort und
ETag nicht mehr auseinanderziehen.

## Neu ausgeführte Prüfungen

Für alle .NET-Aufrufe wurde ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
verwendet. Restore mit Locked Mode, Testbuilds vor jedem Hoststart und
`-p:UserSecretsId=`; nach Entfernen der Quellhelfer erneuter Build.
Alle npm-Aufrufe liefen in `src/Cemaris.Web`.

| Prüfung | Ergebnis und Umfang |
| --- | --- |
| Release-Solutionbuild | erfolgreich, zuletzt ohne Warnungen oder Fehler |
| Unit-Tests | 121 bestanden; Geldgrenzen, Centaddition, Reihenfolge/IDs, Listen-/Textgrenzen sowie echte OpenXML-Expansion mit 1, 3 und 100 Positionen; bestehende Renderer-, Paket-, Pfad-, Konverter- und Ressourcenprüfungen |
| Integration ohne SQL | 96 bestanden; neue Modi, immutable Antwortstände, vollständige Revisionen, begründete Umstellung, alter Schreibweg, Cookie-Rollen, CSRF, ETags, strikte Binder, ausgeschaltete Capability, Development-/Abhängigkeitsgrenze, OpenAPI, Ausgabe bei ausgeschalteter Positionsbearbeitung und bestehende Regressionen |
| Gezielte SQL-Regressionen | neun Tests bestanden: neue M3a-Klasse sowie bestehende Bescheidentwurfs-, M1-, M2a- und Personen-/Nutzungsrechtsklassen; M3a nach Ergänzung des Ausgabe-/Korrekturrennens erneut erfolgreich |
| Frontend | 96 Tests in 15 Dateien bestanden; abschließender vollständiger Lauf mit zwei Workern nach allen Änderungen, zusätzlich gezielter Panel-/Editorlauf; vorhandene Personen-, Rechte-, Fall-, Wiedervorlagen- und Konfigurationstests erhalten |
| Frontendqualität | `npm ci`, Lint und Produktionsbuild erfolgreich |
| Paketprüfung | NuGet einschließlich transitiver Pakete ohne gemeldete anfällige Pakete; npm meldet zwei moderate Entwicklungsabhängigkeiten, siehe Grenzen |

Die Tabellenzahlen sind Nachweise dieser Sitzung, keine übernommenen M2a-Zahlen.
Gezielte Tests decken insbesondere `.10 + .20 = .30`, Höchstbetrag und
Summenüberlauf, fremde/doppelte IDs, Entfernen bei unveränderter alter Revision,
Umordnen und Verwerfen ab. Die SQL-Rennen verwenden getrennte DbContexts und
Barrieren vor konkurrierenden Schreibvorgängen: zwei Korrekturen, Korrektur
gegen Verwerfen, Umstellung gegen alte Korrektur und Ausgabeabruf gegen Korrektur.
Gezielte Fehler bei Position, Revision und Audit rollen den gesamten Vorgang
zurück; bei Anlage wird auch keine Nummer verbraucht. Ein echter doppelter
SQL-Auditnachweis prüft zusätzlich die kontrollierte Speicherfehlerklassifikation.
Ein vollständig beendeter und neuer Anwendungshost bestätigt die Persistenz
einschließlich Zeilen und Historie über reguläre Cookies beider Rollen.

## SQL-Isolation

Die Fixtures wurden vor Ausführung gelesen. Die allgemeine Fixture erhielt
eine ausdrückliche Besitzmarkierung nach erfolgreichem `CREATE DATABASE`;
die Bereinigung eines kollidierenden, nicht selbst erzeugten Namens ist damit
ausgeschlossen. Die neue M3a-Fixture verwendet dasselbe Besitzprinzip.

Verbindung ausschließlich prozesslokal an `.\CEMARISDEV` mit integrierter
Windows-Anmeldung. `master` wurde nur für Namens-/Erstellmetadaten und
CREATE/DROP eigener neuer Datenbanken benutzt. Der erste Lauf erzeugte
37 eigene Datenbanken: vier bestehende Klassenfixtures mit je einer Haupt-
und acht Vorgängermigrationsdatenbanken sowie eine neue M3a-Datenbank.
Der ergänzte M3a-Lauf erzeugte eine weitere neue Datenbank. Alle wurden entfernt.
Inventare vor und nach den Läufen sind gleich; insbesondere bleiben
`Cemaris_Dev` und `Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3`
unverändert im Metadateninventar. Keine dieser bestehenden Datenbanken wurde
geöffnet, migriert, geseedet oder durch eine Fixture verwaltet.

Der M3a-Migrationstest prüft einen repräsentativen alten Entwurf einschließlich
vollständiger Revision vom unmittelbaren Vorgängerstand aus. Der serialisierte
Fachstand vor und nach Migration ist gleich. Alte Bescheidprojektionen bleiben
unverändert. Keine Backup-/Restore-Arbeit und keine EDWALT-Ausführung.

## Isolierter Browser und echte Dokumente

Vorhandenes Edge `148.0.3967.96` und vorhandene lokale Playwright-Bibliothek;
keine Browserinstallation und keine neue Projektabhängigkeit. API auf
`127.0.0.1:5061`, Vite auf `127.0.0.1:5181` mit `--strictPort` und prozesslokalem
Proxyziel. Die Ports waren vor Start frei. Der Prüfhost bestätigt Synthetic-
Fachprovider, `TestLocalAccountStore`, reguläres Cookie-Schema, fehlendes
UserSecrets-Assemblyattribut und drei ausgeschaltete Maintenance-Schalter.
NoticeGeneration war für diesen eigenen Nachweis ausdrücklich prozesslokal aktiv.

Administration und Sachbearbeitung meldeten sich in getrennten Browserkontexten
über das normale Formular an. Synthetische Stamm-, Beteiligten-, Beisetzungs-
und Satzungsbezüge wurden über geschützte API-Verträge vorbereitet.
Die Positionsanlage und Bearbeitung erfolgten im Browser: 100,10 plus 25,40
ergaben 125,50 EUR; Reset und Bestätigung wurden geprüft. Zwei Sitzungen
reproduzierten einen 412-Konflikt, bei dem Betrag und Grund erhalten blieben.
Bewusstes Neuladen, Umordnen und anschließendes Entfernen waren erfolgreich.
Die Bestandsumstellung zeigte `9999999999999999.99` exakt und speicherte eine
Centkorrektur auf `9999999999999999.98`, bei erhaltener Nummer und alter Revision.
Die administrative Konfigurationsmutation der Sachbearbeitung ergab 403,
eine veraltete Dokumentanforderung 412. Bei 390 Pixeln entstand kein horizontaler
Seitenüberlauf; eine schmale Kopfzeile wurde zusätzlich umbruchfähig gemacht.

| Echte Ausgabe | Inhalt und Sichtprüfung |
| --- | --- |
| Zwei Positionen, DOCX und PDF | Browserdownloads, PDF 285.283 Byte und eine A4-Seite; Leistung A 100,10 EUR, Leistung B 25,40 EUR, Gesamt 125,50 EUR; Beisetzung, Satzung und Kontaktprofil korrekt |
| 100 Positionen, DOCX | 29.511 Byte; genau 100 geordnete Gebührenzeilen, drei Bezeichnungen mit jeweils 500 Zeichen; literale Umlaute und XML-Sonderzeichen |
| 100 Positionen, echtes LibreOffice-PDF | 372.469 Byte, fünf Seiten, alle Positionen 001 bis 100 einschließlich Endmarkierungen in richtiger Reihenfolge; Gesamt 1,00 EUR |
| Visuelle Prüfung | alle fünf gerenderten PDF-Seiten sowie die Zweipositionsseite betrachtet; wiederholte Tabellenköpfe, vollständige lange Zeilen, keine abgeschnittenen Positionen oder zusätzlichen leeren Gebührenzeilen, Summe einmal am Ende |
| Kennzeichnung und Streamschutz | `RECHTLICH WIRKUNGSLOSER ENTWURF` genau einmal, keine Resttokens; Attachment, passender MIME-Typ, `no-store`, `no-cache`, `nosniff` |
| Bereinigung | nach echten Konvertierungen leerer eigener Tempstamm und keine LibreOffice-Restprozesse; eigene Browserkontexte abgemeldet und geschlossen |

Der Produktkonverter verwendete installiertes `soffice.com`, direkte
Prozessargumente und ein isoliertes Profil. DOCX-Dateien wurden zusätzlich
strukturell geöffnet; PDF-Text und sämtliche Endmarkierungen wurden maschinell
geprüft. Keine Mock-PDF-Datei wird als echter Ausgabenachweis gezählt.
Die synthetische Vorlage blieb unverändert; eine neue Vorlage war nicht nötig.

## Behobene Befunde und Grenzen

- Neue Positionsverträge schließen freie Summenabweichungen und alte
  Korrekturumgehungen. Vollständige Antwortsnapshots schließen das bisherige
  Zeitfenster zwischen Speicherung und erneuter API-Abfrage.
- Synthetic-Revisionslisten werden unabhängig kopiert. Doppelter Auditnachweis
  wird vor Veröffentlichung abgewiesen. SQL-Nachweisfehler werden nicht mehr
  pauschal als ungültiger Zahlungspflichtiger ausgegeben; Deadlocks sind Konflikte.
- Der Renderer wiederholt ausschließlich den geprüften Zeilenprototyp und
  validiert OpenXML zusätzlich bereits vor der Expansion. Keine pauschale
  Tokenfreigabe oder Erhöhung der Ressourcenlimits.
- Während der Umsetzung gefundene Zeichenkodierungsfehler, Compiler-/Analyzer-
  Befunde und eine veraltete Frontendtest-Erwartung an numerische Schreibbeträge
  wurden korrigiert. Ein bestehender Fünf-Sekunden-Frontendtimeout unter hoher
  paralleler Last bestand anschließend mit zwei Workern; Testtimeouts wurden
  nicht pauschal erhöht. Browser-Diagnoseanläufe betrafen einen verdeckten
  Abmeldeknopf, exakte Select-Beschriftungen und den Toolpfad zu Edge.
- `npm audit` meldet `vitest` und `@vitest/mocker` als moderate Entwicklungs-
  abhängigkeiten zu `GHSA-82fw-gwwq-j7x9`; kein Paketupdate in diesem Fachschnitt.
  Dieser Befund bleibt offen. NuGet meldet keine anfälligen Pakete.
- Synthetische technische Abnahme, kein Echtbetrieb, Papierdruck oder Prüfung
  in einer eigenständigen Desktop-Word-Sitzung. Die vorhandenen synthetischen
  Festtexte sind keine kommunale Rechts- oder Vorlagenfreigabe. Betriebs- und
  Aufbewahrungsfragen aus früheren Dokumenten bleiben außerhalb dieses Schnitts.
- Die Gesamtbetrag-/Zeileninvariante gilt für die Anwendungswege; beliebige
  externe SQL-Schreiber werden nicht durch einen zusätzlichen Summen-Trigger
  kontrolliert. Die Prüfungen begründen keine absolute Fehlerfreiheit.

## Schlusszustand

Alle neun Feature-Defaults sind in beiden eingecheckten API-Konfigurationen
`false`. Ein frischer isolierter Host bestätigt ausgeschaltete Capabilities,
Health 200 und fehlende Mutationsrouten. Alle Maintenance-Schalter bleiben aus.
Eigene Hosts, Browser und Testdatenbanken sind beendet beziehungsweise entfernt.
Temporäre Quellhelfer, SQL-/TRX-Prüfdateien, Downloads, Renderbilder, Screenshots
und der eigene Konvertertempstamm wurden entfernt; anschließend wurde neu gebaut.

Vorlagenhashes bleiben:

- API-Fixture: `BFD934FB4B8367BFAE5392A84A8A7960916307D27A447FDF1D051742456523D3`.
- Lokale synthetische Quelle: `71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.

`tmp/pagination-build` wurde ausschließlich an seinen Wurzelmetadaten verglichen:
Attribute Directory, Erstellung `2026-08-14T10:27:21.4014388Z`, letzte Änderung
`2026-08-14T10:27:21.4062644Z`. Inhalte wurden weder geöffnet noch aufgelistet.
Lokale Markdown-Links/Anker, Tabellen, Codezäune, finale LF, begrenzte Secret-/
Fremdpfadheuristik und `git diff --check` wurden geprüft. Historische ADRs,
Migrationen und Vorlagen sind unverändert; Index, Branch und HEAD bleiben erhalten.
Die Dokumentationsprüfung umfasste 135 Markdown-Dateien, 849 lokale Links,
37 Ankerverweise, 240 Tabellen und 47 Codeblöcke ohne gemeldeten Befund.
