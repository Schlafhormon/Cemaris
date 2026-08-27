# Abschluss des Freigabegates für manuelle Bescheid-/Finanzfakten

> **Ergebnis:** Das interaktive Gate 6a-F ist am 26.08.2026 nach einer
> ergänzenden funktionsbezogenen Klärung vollständig mit Variante B
> „manueller kanonischer Faktenkern“ abgeschlossen. Der separate
> [technische 6b-Auftrag](cemaris-increment-6b-next-step-handoff.md) ist
> erstellt und ausführbar.

## Ausgangsstand und Schutzgrenzen

Vor der Bearbeitung wurde der vollständige Git-Stand geprüft:

- Repository:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- `HEAD` und `origin/main`:
  `a767bb1f459d5fdd8834a7bcaacb9b14482776bd`;
- Ahead/Behind `0/0`;
- Arbeitsbaum und Index waren sauber;
- `docs/implementation/cemaris-increment-6b-next-step-handoff.md` war nicht
  vorhanden.

Es wurde kein Reset, Commit oder Staging ausgeführt. `tmp/pagination-build`
wurde nicht verändert. Keine externe EDWALT-, Phase-, Satzungs-, Vorlagen-,
DMS- oder sonstige Arbeitswurzel wurde geöffnet oder verändert. EDWALT, API,
Frontend-Dev-Server und Browser wurden nicht gestartet. Es wurde keine
Datenbankverbindung geöffnet und es wurden keine User Secrets gelesen. Der
EDWALT-Gebührenauftrag blieb pausiert.

## Vollständig geprüfte Quellen

Die verbindliche
[Folgeübergabe](cemaris-manual-notice-facts-approval-next-step-handoff.md) wurde
zuerst vollständig gelesen. Danach wurden die Root- und Bereichsindizes, die
6a-Übergabe und der 6a-Abschluss, Gebühren-/Bescheidentscheidungen,
Anforderungs-, Rollen-, Audit-, Dokument-, Nutzungsrechts- und
Migrationsgrenzen sowie die einschlägigen ADRs geprüft.

Die technische Bestandsprüfung umfasste insbesondere:

- `CaseReadModels`, Read-Stores, EF-Read-Entities, DbContext und Migrationen;
- `ReadNotices` und `ReadFeeItems` einschließlich nullable Feldern;
- API- und Frontendverträge für Suche, Falldetail und Beteiligte;
- den kanonischen Beteiligten-/Nutzungsrechtskern mit Revision, ETag,
  Atomarität und Audit;
- Capability-, Policy-, Systeminformations-, Routing- und
  Konfigurationsmuster;
- Unit-, API-, Provider- und Frontendtests der betroffenen Verträge.

Der technische Ausgangsbefund bleibt unverändert: Bescheid- und Gebührenwerte
existieren bisher nur in einer vorläufigen Leseprojektion. Weder diese
Projektion noch synthetische Fixtures definieren das neue Schreibmodell.

## Interaktiver Dialog und Zwischenentscheidung

Der Auskunftgeber erklärte seine Funktion als **Projektleiter von Cemaris**
und teilte mit, alle Angaben seien mit der Friedhofsverwaltung abgesprochen.
Die ursprünglichen Antworten beschrieben bereits:

- heutigen EDWALT-/FINANZ+-Ablauf und spätere Cemaris-Bescheiderzeugung;
- zunächst rechtlich wirkungslosen internen Entwurf;
- genau einen Zahlungspflichtigen;
- automatische konfigurierbare Nummer ab Entwurf im Format
  `Finanzprodukt.JahrLaufnummer`, jährlichen Neustart, zulässige Lücken,
  dauerhaft gesperrte Nummern und administrative Formaterweiterung;
- minimalen manuellen Pflichtfeldkern mit positivem EUR-Gesamtbetrag;
- historisierte Entwurfskorrektur und Verwerfen ohne Löschen;
- beide Rollen für Fachoperationen, keine personelle Funktionstrennung und
  Nummernkonfiguration nur durch `Administration`;
- starken ETag, atomare Mutation, vollständige Fachrevision und sparsamen
  Audit;
- FINANZ+ als führendes System ohne Rückkanal;
- Ausschluss von Wiederholungsdaten, Buchungstext, Backfill und
  Altprojektion-Rückinterpretation;
- ausschließlich synthetische Pilotabnahme.

Die zunächst genannte Zwei-/Drei-Tage-Annahme zur postalischen Bekanntgabe
wurde anhand aktueller amtlicher Verfahrensgesetze auf vier Tage korrigiert
und vom Auskunftgeber als Irrtum bestätigt. Diese Gesetzesevidenz wurde nicht
als kommunale Rechtsfreigabe oder Fälligkeitsregel umgedeutet.

Die erste pauschale Antwort `Alles freigegeben!` konnte den benötigten
Funktionen noch nicht getrennt zugeordnet werden. Zusammen mit der zunächst
gewünschten stillen Zahlungspflichtigenableitung musste das Gate daher
vorläufig und gemäß seiner Stop-Regel mit Variante A dokumentiert werden.

## Ergänzende funktionsbezogene Klärung

Der Projektleiter bestätigte anschließend mit
`USR-2026-08-26-6F-SUPPLEMENT-01` ausdrücklich:

1. Er übermittelt verbindlich die Freigaben der
   Friedhofsfachverantwortung, Rechts-/Satzungsprüfung,
   Finanz-/Haushaltsverantwortung, des Datenschutzes, der
   Informationssicherheit und des Betriebs.
2. Geltungsbereich ist ausschließlich die technische Implementierung des
   abgegrenzten Development-Piloten mit synthetischen Daten; es ist keine
   Produktivfreigabe.
3. Der aktuelle Nutzungsberechtigte darf nur als Vorschlag vorausgewählt
   werden. Vor dem Speichern muss die Sachbearbeitung genau einen
   Zahlungspflichtigen aktiv bestätigen.
4. 6b beschränkt sich auf rechtlich wirkungslose Entwürfe: Anlegen,
   historisiert Korrigieren und Verwerfen. Bescheiderzeugung, Bekanntgabe,
   Versand sowie Korrektur oder Storno erzeugter Bescheide bleiben spätere
   Inkremente.

Mit `USR-2026-08-26-6F-SUPPLEMENT-02` wurde zusätzlich bestätigt, dass ein
Fall gleichzeitig und historisch mehrere eigenständige Entwürfe besitzen
darf. Jeder Entwurf hat eine eigene dauerhaft gesperrte Nummer und genau einen
Zahlungspflichtigen.

Die Funktionen, Geltungsbereiche und technischen Auswirkungen sind vollständig
in der
[6F-Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md)
dokumentiert. Die Ergänzungen verändern nicht rückwirkend die erste Aussage,
sondern lösen die dort sichtbar festgehaltenen Stop-Gründe gezielt auf.

## Endgültige Entscheidung

Für den abgegrenzten technischen Development-Schnitt sind 6F-01 bis 6F-10
nun `BESTÄTIGT`:

- 6F-03 enthält keine Ableitung mehr; ein Vorschlag erfordert aktive
  Bestätigung;
- Rechts- und Finanzwirkung enden eindeutig beim wirkungslosen Entwurf;
- Rollen, Nummernkonfiguration, Pflichtfakten, Revision, Audit, FINANZ+- und
  Migrationsgrenze sind für 6b festgelegt;
- Datenschutz, Sicherheit und Betrieb tragen den synthetischen
  Development-Piloten, aber keine echten Daten oder Produktivsetzung.

Damit ist Variante B ausgewählt. Variante C bleibt verworfen. Der neue
kanonische Kern wird additiv neben `ReadNotices` und `ReadFeeItems`
implementiert. Die nullable Altprojektion, bestehende Fixtures und EDWALT-
Strukturen werden weder als Schreibmodell verwendet noch migriert.

Die neue Architekturentscheidung steht in
[ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md). Der
[6b-Auftrag](cemaris-increment-6b-next-step-handoff.md) enthält den
vollständigen Domain-, Store-, Migrations-, API-, UI-, Rollen-, Test- und
Abnahmevertrag sowie den direkt kopierbaren Prompt für einen kontextlosen
Folgechat.

## Weiterhin gesperrter Umfang

Nicht freigegeben sind insbesondere:

- Gebührenkatalog, Gebührensätze und Berechnung;
- automatische Fälligkeit, Festsetzung oder Rechtswirkung;
- Bescheiderzeugung, Vorlage, PDF/DOCX, Versand oder Bekanntgabe;
- Korrektur, Aufhebung oder Storno erzeugter Bescheide;
- FINANZ+-Integration, Buchung, Zahlung, Mahnung oder Rückkanal;
- echte Verwaltungsdaten und Produktivbetrieb;
- EDWALT-Gebührenstamm, Mapping, Backfill oder Migration.

Die spätere Bescheiderzeugung ist weiterhin ausdrücklich vorgesehen. Sie wird
nach 6b in einem eigenen Entscheidungs- und Freigabegate konkretisiert. Dieses
[6c-Gate](cemaris-notice-generation-decision-gate-completion.md) ist
mit Variante A als erstem Stop-Zwischenstand und nach ergänzender
Quellenklärung endgültig mit Variante B abgeschlossen. Die separate
[technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md) ist
vorbereitet, aber nicht ausgeführt.

## Dokumentationswirkung

Aktualisiert beziehungsweise neu angelegt wurden ausschließlich
Repositorydokumente:

- die 6F-Entscheidungsakte;
- dieser Abschlussnachweis;
- der sichtbare Abschlussstatus in der ausgeführten Folgeübergabe;
- ADR-0018;
- die ausführbare technische 6b-Übergabe;
- Root-README und alle fünf Dokumentationsindizes;
- unmittelbar betroffene Anforderungs-, Rollen-/Audit-, Architektur-,
  Dokument- und Migrationsgrenzen;
- ein klarer Historienhinweis in der bereits erledigten
  Identitätsübergabe.

Produktcode, Projektdateien, Laufzeitkonfiguration, Migrationen und Tests
wurden in 6a-F nicht geändert.

## Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `dotnet format Cemaris.sln --verify-no-changes --no-restore` mit dem verbindlichen SDK | erfolgreich |
| Release-Build `Cemaris.sln` | erfolgreich, 0 Warnungen und 0 Fehler |
| Unit-Tests | 48 von 48 bestanden |
| Integrationstests `Category!=SqlServer` | 58 von 58 bestanden; SQL-Kategorie nicht ausgeführt |
| `npm ci` | erfolgreich; 117 Pakete installiert, 0 bekannte Schwachstellen gemeldet |
| Frontendtests | 8 Testdateien und 41 Tests bestanden |
| Frontend-Lint | `oxlint` erfolgreich |
| Frontend-Produktionsbuild | TypeScript- und Vite-Build erfolgreich |
| Whitespace | `git diff --check` ohne Befund |
| Markdown | 103 Dateien, 400 lokale Links, 0 fehlende Ziele/Anker, 0 unausgeglichene Codeblöcke, 0 inkonsistente Tabellenzeilen |
| bedingter 6b-Auftrag | vorhanden und vollständig verlinkt |

Es wurden keine SQL-Tests und keine Datenbankverbindung verwendet. API,
Frontend-Dev-Server, Browser und EDWALT wurden nicht gestartet. Die
repositorybasierte Secret- und Verwaltungsdatenprüfung erfolgte ohne Ausgabe
gefundener Werte und ohne Zugriff auf User Secrets. Sie prüfte 316
Git-sichtbare Textdateien. Private Schlüssel, bekannte Cloud-Token, deutsche
IBAN und der im Dialog genannte örtliche Finanzprodukt-/Nummernwert ergaben
jeweils 0 Dateien. Das bewusst breite Credential-Literal-Muster traf zwei
vorhandene, aber keine geänderte oder neue Datei.

## Abschlusszustand

Der Metadatenvergleich für `tmp/pagination-build` bestätigt gegenüber der vor
der Bearbeitung erhobenen Basis unverändert:

- Wurzel-Zeitstempel UTC `2026-08-14T10:27:21.4062644Z`;
- 1.008 Einträge, davon 890 Dateien und 118 Verzeichnisse;
- 120.354.652 Dateibytes.

`Cemaris_Dev`, User Secrets und externe Arbeitswurzeln blieben mangels jedes
Zugriffs unverändert. Der abschließende Git-Nachweis bestätigt Branch `main`,
unverändertes `HEAD`/`origin/main` mit Ahead/Behind `0/0`, leeren Index,
14 geänderte Dokumentationsdateien und vier neue unversionierte
Dokumentationsdateien. Es wurde kein Commit erstellt und nichts gestagt.
