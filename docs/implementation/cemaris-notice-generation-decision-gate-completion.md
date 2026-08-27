# Abschluss des 6c-Entscheidungs- und Freigabegates

Stand: 27.08.2026

Status: **Dokumentarisch nach Ergänzung abgeschlossen mit Variante B – genau
ein entscheidungsreifer Kandidat.** Der erste Zwischenabschluss mit Variante A
bleibt als historischer Befund erhalten; die späteren Quellen und die
endgültige Entscheidung sind unten nachgetragen. Es wurde in diesem Chat
nichts technisch implementiert.

## Ergebnis

Das verbindliche
[Folgegate](cemaris-notice-generation-decision-gate-next-step-handoff.md) wurde
für genau einen Kandidaten vollständig durchgeführt: die spätere Erzeugung
eines rechtlich wirkungslosen Gebührenbescheidentwurfs für
Beisetzungsgebühren.

Die Produktgrenzen zu Rechtswirkung, kommunaler Vorlagenverantwortung,
DOCX/PDF/Druck, externen Änderungen, Rollen, Audit, temporärer Verarbeitung,
Winyard/FINANZ+, Fehlern, Migration und Pilotabsicht sind interaktiv geklärt.
Die vollständige Bewertung steht in der
[6c-Entscheidungsakte](../requirements/notice-generation-decisions.md).

Variante B ist trotzdem unzulässig. Die vom Projektleiter repositorylokal
bereitgestellten örtlichen Beispiele sind nicht vollständig synthetisch oder
anonymisiert und besitzen keinen belegten technischen Platzhaltervertrag.
Das Gate durfte die gewünschte synthetische Testvorlage nicht selbst
erstellen. NG-04 bleibt deshalb zwingend offen. Die ebenfalls fehlenden
feldgenauen Pflichtregeln, Barrierefreiheits-/Qualitätskriterien,
ETag-/Revisionsbindung und Auditaufbewahrung halten NG-03, NG-05, NG-06 und
NG-08 teilweise offen.

## Ausgangsstand

Vor der ersten Änderung wurde der vollständige tatsächliche Repositoryzustand
geprüft:

- Repository:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- `HEAD` `457b696403402026eb24160f92af647b33f4ef8d`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- Arbeitsbaum und Index ohne Git-sichtbare Änderungen;
- ausschließlich ignorierter Bestand unter `tmp`, darunter die beiden vom
  Benutzer hinzugefügten Beispiele unter `tmp/examples`;
- `tmp/pagination-build`: 1.008 Einträge, davon 890 Dateien und 118
  Verzeichnisse, insgesamt 120.354.652 Dateibytes; Stammzeitstempel blieben
  als Vergleichswert erfasst.

Anschließend wurden die in der Übergabe verlangten Repositorydokumente und die
tatsächlichen 6b-Verträge in Domain, Application, Persistenz, API, OpenAPI,
Frontend und Tests vollständig beziehungsweise zielgerichtet bis zu ihren
verbindlichen Grenzen ausgewertet. Es wurde kein .NET-Lesebefehl benötigt.

## Interaktiver Dialog

Die Antworten erhielten stabile Quellen-IDs
`USR-2026-08-27-6C-DIALOG-01` bis `-11`. Der Auskunftgeber bezeichnete sich
als entscheidungsbefugten Cemaris-Projektleiter und übermittelte die
paketbezogenen Entscheidungen der Fach-, Rechts-/Satzungs-, Finanz-,
Datenschutz-, Informationssicherheits-, Betriebs- und
Produktivsetzungsfunktionen für den allgemeinen Produktvertrag.

In kleinen Fragegruppen wurden geklärt:

1. Gebührenbescheidentwurf für Beisetzungsgebühren als genau ein Kandidat;
2. keine eigenständige Rechtswirkung, Festsetzung oder Bekanntgabe durch
   Cemaris;
3. abstrakte Feldgruppen und Trennung von kommunalem Festtext und aktuellen
   Cemaris-Daten;
4. Verantwortung der Friedhofsverwaltung sowie Dateiaustausch durch
   Administration außerhalb von Cemaris;
5. DOCX, PDF und Druck, ohne Rückkanal;
6. vorhandene Fallaktenrechte und keine neue Rolle;
7. Ende des Cemaris-Vorgangs bei Ausgabe sowie externe Korrekturgrenze;
8. keine Dokumentaufbewahrung, Neuerzeugung mit aktuellem Stand, sofortige
   Temp-Bereinigung und sparsamer Audit;
9. keine DMS-/FINANZ+-Integration, verständlicher Fehler ohne Teilergebnis und
   Wiederholung nach Behebung;
10. keine Altübernahme oder Migration, synthetische Abnahme und spätere
    gesonderte Pilotaktivierung.

## Bestandsprüfung der bereitgestellten Beispiele

Die ursprünglich genannten externen Pfade wurden nicht geöffnet. Erst die vom
Benutzer innerhalb des Repositorys unter `tmp/examples` abgelegten Kopien
wurden read-only inventarisiert:

| Datei | Prüfart | Abstrakter Befund | Gate-Wirkung |
| --- | --- | --- | --- |
| `Beispielbescheid.doc` | einmalige geschützte Read-only-Inhaltsprüfung; Hash davor/danach unverändert | einseitiger örtlicher Altbescheid mit fachlich als korrekt bezeichnetem Inhalt und altem Briefkopf | geeignete örtliche Feldgruppenevidenz, aber keine synthetische Testquelle |
| `Vorlage Briefkopf_ungeschützt_allg.docx` | reine OOXML-Paketprüfung ohne Ausführung; Hash unverändert | normales DOCX mit Kopf-/Fußvarianten und konkreten örtlichen Inhalten; keine Makros, externen Beziehungen oder belegten technischen Platzhalter | Layout-Evidenz, aber weder leere synthetische Testquelle noch ausführbare technische Vorlage |

Konkrete Personen-, Kontakt-, Konto- oder Verwaltungswerte wurden weder in
die Dokumentation noch in Befehlsausgaben übernommen. Die Fremddateien bleiben
ignoriert und unverändert.

## Variantenentscheidung und offene Punkte

Die [Freigabematrix](../requirements/notice-generation-decisions.md#freigabematrix-ng-01-bis-ng-10)
bewertet NG-01, NG-02, NG-07, NG-09 und NG-10 als `BESTÄTIGT`, NG-03, NG-05,
NG-06 und NG-08 als `TEILWEISE BESTÄTIGT` sowie NG-04 als `OFFEN`.

Damit greift die Stop-Regel der Übergabe. **Variante A – keine
Implementierung** ist der vollständige Abschluss. Es gibt:

- keinen Produktcode und keine Änderung an Domain, Application, Persistenz,
  API, OpenAPI, UI oder Tests;
- kein Schema, keine Migration und keinen Datenbankzugriff;
- keine Vorlage, Testvorlage, Engine, Konvertierung oder Integration;
- kein neues ADR und keine Änderung an ADR-0018;
- keinen technischen `cemaris-increment-6c-next-step-handoff.md`.

## Dokumentationsumfang

Geändert beziehungsweise ergänzt wurden ausschließlich die für das Gate
verlangten oder unmittelbar betroffenen Markdown-Dokumente:

- 6c-Entscheidungsakte und dieser Abschlussnachweis;
- sichtbare Ausführungsmarkierung der 6c-Übergabe;
- Root-README und alle fünf Dokumentationsindizes;
- Gebühren-/Bescheidentscheidungen, Dokument-, Rollen-/Audit- und
  Winyard-Architektur, Sicherheitsrichtlinie sowie Migrationsgrenze.

## Schutzgrenzen

Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- und sonstige
Arbeitswurzeln blieben unberührt. EDWALT wurde nicht ausgeführt. User Secrets
und `Cemaris_Dev` wurden nicht gelesen oder geöffnet. API,
Frontend-Dev-Server, Browser und Datenbank wurden nicht gestartet.
`tmp/pagination-build` wurde nicht geöffnet oder verändert. Es wurde nichts
gestagt, kein Commit erstellt und keine vorhandene Arbeit zurückgesetzt.

## Abschlussprüfungen

Die ausschließlich lokalen Abschlussprüfungen waren erfolgreich:

- `git diff --check` ohne Befund;
- 107 Git-sichtbare beziehungsweise neu angelegte Markdown-Dateien und 465
  lokale Links/Anker geprüft, kein fehlendes Ziel und kein fehlender Anker;
- 194 Markdown-Tabellen mit konsistenter Spaltenzahl, keine unausgeglichenen
  Codeblöcke, keine nachgestellten Leerzeichen und kein fehlender
  Abschlussumbruch;
- 18 geänderte oder neue Git-sichtbare Pfade, sämtlich Markdown; keine neue
  Datei mit Office-, PDF-, Archiv-, Secret-, Datenbank- oder
  Verwaltungsdatenendung;
- repositorybasierte Heuristik über 347 Git-sichtbare Textpfade sowie
  gesonderte Prüfung aller Ergänzungen ohne Ausgabe gefundener Werte: keine
  neue Secret-, IBAN-, Kontakt- oder Verwaltungsdatenfundstelle; die
  heuristischen Bestandsfundstellen liegen ausschließlich in sechs
  unveränderten Beispiel-, Test-, Konfigurations- oder Lockdateien;
- der einzige versionierte Pfad mit einer im Gate als sensibel behandelten
  Dateiendung ist das bereits vorhandene und unveränderte
  EDWALT-Quellmanifest; keine solche Datei wurde ergänzt;
- beide ignorierten Fremddateien unter `tmp/examples` mit unveränderter Länge,
  Zeitstempel und SHA-256-Prüfsumme;
- `tmp/pagination-build` unverändert mit Wurzelzeitstempeln
  `2026-08-14T10:27:21.4014388Z` und
  `2026-08-14T10:27:21.4062644Z`, 1.008 Einträgen, 890 Dateien, 118
  Verzeichnissen und 120.354.652 Dateibytes;
- Branch `main`, `HEAD`
  `457b696403402026eb24160f92af647b33f4ef8d`, Upstream `origin/main` und
  Ahead/Behind `0/0` unverändert; Index leer, kein Commit erstellt.

Die nach diesem Eintrag wiederholte Endprüfung bestätigt dieselben
Schutzgrenzen. Die zwei neuen Entscheidungs-/Abschlussdokumente bleiben
bewusst unversioniert im Arbeitsbaum; die übrigen Änderungen sind erhaltene,
nicht gestagte Markdown-Diffs.

## Ergänzende Wiederaufnahme und endgültiges Ergebnis

Nach dem ersten vollständigen Stop-Abschluss hat der Projektleiter die damals
fehlenden Punkte einzeln nachgeliefert. Die
[6c-Entscheidungsakte](../requirements/notice-generation-decisions.md#verbindlicher-nachtrag-zum-ersten-gateabschluss)
dokumentiert diese Quellen, Funktionen, Geltungsbereiche, Entscheidungen und
Restunsicherheiten, ohne die frühere Variante-A-Historie umzuschreiben.

Ergänzend bestätigt wurden:

1. die feldgenaue Bindung aller für den ersten Kandidaten benötigten Werte an
   aktiven 6b-Entwurf, ausgewählte Beisetzung, aktuelle kanonische Fall-,
   Beteiligten- und Friedhofsstammdaten;
2. ein starker aktueller Entwurfs-ETag, Pflichtfeldabbruch und ein
   inhaltsfreier Erzeugungsaudit ohne zusätzliche Fachmutation;
3. überprüfbare DOCX-/PDF-/Druckkriterien, isolierte unmittelbare
   Temp-Bereinigung und Auditaufbewahrung nach kommunalen Fall-/Auditregeln;
4. getrennte Benutzerkontaktfelder mit `KONTAKT_NAME` ausschließlich aus
   Vorname plus Nachname sowie administrativer Pflege;
5. kleine versionierte Satzungsstammdaten mit Name, Fassungsstand,
   Aktivstatus und manueller Auswahl ohne automatische Rechtsableitung;
6. eine vom Projektleiter erstellte, bereitgestellte und freigegebene
   synthetische DOCX-Quelle für den Testvertrag.

Die finale synthetische Quelle
`tmp/examples/Cemaris-Testvorlage-Beisetzungsgebuehren.docx` besitzt 31.642
Byte und SHA-256
`71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F`.
Sie enthält keine Makros, Einbettungen oder externen Beziehungen und bleibt
ignorierter, unveränderter Fremdbestand. Von 24 Platzhaltern sind 23 dem
ersten Kandidaten zugeordnet. `EMPFAENGER_ANREDE` besitzt keine kanonische
Quelle und ist aufgrund der ausdrücklichen Zurückstellungsregel nicht Teil des
ersten Kandidaten. Eine spätere technische Test-Fixture muss die gesamte
Anredezeile entfernen; Cemaris darf keine Anrede ableiten.

Damit sind NG-01 bis NG-10 für genau einen Kandidaten bestätigt. Die
endgültige Entscheidung lautet **Variante B**. Zulässiges Ergebnis dieses
dokumentarischen Chats ist ausschließlich die neue, noch nicht ausgeführte
[technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md). Sie
umfasst weiterhin keine Produktivsetzung, Rechtswirkung, Zustellung,
Archivierung, Integration oder Migration.

## Abschlussprüfungen nach dem Nachtrag

Nach dem Variante-B-Nachtrag wurden sämtliche verbindlichen Prüfungen erneut
lokal ausgeführt:

- 107 Git-sichtbare beziehungsweise neue Markdown-Dateien, 492 lokale
  Links/Anker und 198 Tabellen geprüft; keine fehlenden Ziele/Anker,
  inkonsistenten Tabellen, unausgeglichenen Codeblöcke, nachgestellten
  Leerzeichen oder fehlenden Abschlussumbrüche;
- `git diff --check` ohne Befund;
- 19 geänderte oder neue Git-sichtbare Pfade, ausschließlich Markdown; keine
  Produktcode-, Schema-, Migrations-, API-, UI-, Vorlagen-, Engine- oder
  Integrationsdatei verändert;
- repositorybasierte Secret- und Verwaltungsdatenheuristik über 350
  Git-sichtbare Pfade beziehungsweise 340 erkannte Textpfade ohne Ausgabe von
  Werten; keine Trefferdatei unter den Änderungen oder Ergänzungen;
- alle drei ignorierten Fremddateien unter `tmp/examples` nach Länge,
  Zeitstempel und SHA-256 unverändert; die synthetische Testquelle zusätzlich
  auf Platzhalterabschluss, Paketstruktur, Makros, Einbettungen und externe
  Beziehungen geprüft;
- `tmp/pagination-build` unverändert mit Wurzelzeitstempeln
  `2026-08-14T10:27:21.4014388Z` und
  `2026-08-14T10:27:21.4062644Z`, 1.008 Einträgen, 890 Dateien, 118
  Verzeichnissen und 120.354.652 Dateibytes;
- Branch `main`, `HEAD`
  `457b696403402026eb24160f92af647b33f4ef8d`, Upstream `origin/main`,
  Ahead/Behind `0/0` und leerer Index; kein Commit und kein Staging.

Externe EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- und sonstige
Arbeitswurzeln, EDWALT, User Secrets, `Cemaris_Dev`, API,
Frontend-Dev-Server, Browser und Datenbank blieben unberührt. Ein
.NET-Lesebefehl war nicht erforderlich.
