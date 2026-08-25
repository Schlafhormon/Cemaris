# Ausführbare Folgeübergabe: Inkrement 6a – Gebühren-/Bescheid-Entscheidungsgate

Stand: 25.08.2026

## Auftrag und Stop-Gate

Inkrement 5k ist technisch abgeschlossen. Der nächste fachliche
Roadmapbereich umfasst Gebühren, Bescheide und Dokumente. Der unmittelbar
ausführbare nächste Schritt ist jedoch ausschließlich **Inkrement 6a**: ein
quellengebundenes fachliches und architektonisches Entscheidungsgate.

6a verändert noch keinen Produktcode, kein Datenbankschema, keine API, keine
Oberfläche und kein Laufzeitverhalten. Das Gate klärt, ob genau ein kleiner
6b-Ende-zu-Ende-Durchstich bereits belastbar spezifiziert werden kann. Offene
kommunale, rechtliche oder organisatorische Regeln werden nicht geraten.

Der vorhandene nullable Bescheid-/Gebührenanteil in `CaseOverview`,
`ReadNotices` und `ReadFeeItems` ist ausdrücklich nur eine konservative
Read-only-MVP-Projektion. Er ist kein freigegebenes kanonisches Schreibmodell
und bestätigt weder Gebührenkatalog, Berechnung, Festsetzung, Nummerierung,
Korrektur, Storno, Erstattung noch Dokumenterzeugung.

6a ist vollständig abgeschlossen, wenn alle vorhandenen Quellen ausgewertet,
die unten definierten Fragen nachvollziehbar klassifiziert, die Varianten
verglichen und genau eine sichere Folgeentscheidung getroffen wurde. Fehlen
weiterhin notwendige Fachentscheidungen, ist Variante A „noch keine
Implementierung“ ein gültiger und vollständiger Abschluss. In diesem Fall
werden die fehlenden Entscheidungen gebündelt dokumentiert, aber kein
scheinbar ausführbarer 6b-Codeauftrag erfunden.

## Arbeitsverzeichnisse und Werkzeuge

Repository und einziges Verzeichnis für versionierte Änderungen:

`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`

Für .NET ausschließlich verwenden:

`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`

Für 6a wird kein externes Arbeitsverzeichnis angelegt. Insbesondere bleiben
vollständig außerhalb des Arbeitsumfangs:

- die EDWALT-Arbeitswurzel
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`;
- sämtliche EDWALT-Originale, Phase-2-, Phase-3-, Phase-4- und
  Phase-5-Verzeichnisse, Extrakte, Berichte und Prototypen;
- insbesondere die abgeschlossene 5k-Laufwurzel
  `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`;
- lokale Satzungs-, Vorlagen- oder andere externe Dokumentverzeichnisse;
- der ignorierte Fremdbestand `tmp/pagination-build`.

Keine dieser externen Quellen öffnen, hashen, kopieren, verändern oder neu
anlegen. Auch keine Phase-6- oder sonstige externe Laufwurzel anlegen. EDWALT
nicht ausführen. Ausschließlich bereits versionierte
Repository-Dokumente dürfen als gekennzeichnete `SATZUNGSEVIDENZ` oder
`ALTVERFAHRENS-EVIDENZ` verwendet werden. Der vorbereitete
`docs/migration/edwalt-fee-master-variants-next-step-handoff.md` bleibt
pausiert und darf in 6a nur als Repository-Dokument gelesen, nicht ausgeführt
werden.

Die vorhandene Datenbank `Cemaris_Dev` ist der dauerhafte lokale
Development-Zustand aus 5k. 6a öffnet keine Datenbankverbindung, liest keine
User Secrets, startet keine API und mutiert weder Schema noch Daten. Die
akzeptierte lokale `admin`-Kennwortabweichung ist im 5k-Abschluss dokumentiert
und wird in 6a weder erneut verhandelt noch ausgegeben.

## Git-Sicherheit

Vor jeder Änderung vollständig prüfen:

- Branch, HEAD, Upstream und Ahead/Behind;
- Git-Status sowie vollständigen Arbeits- und Index-Diff;
- sämtliche unversionierten Dateien einschließlich ihres Inhalts;
- ob Inkrement 5k und diese vorbereitende 6a-Übergabe bereits committed,
  gepusht oder noch uncommitted vorliegen;
- den Bestand `tmp/pagination-build`, ohne ihn zu verändern.

Vorhandene Arbeit vollständig erhalten. Keinen Reset durchführen, keine
Datei verwerfen oder überschreiben, nichts stagen und keinen Commit erstellen.
Nicht von einem bestimmten HEAD-Hash oder einem sauberen Arbeitsbaum ausgehen.

## Verbindliche Pflichtlektüre

Zuerst dieses Dokument vollständig lesen, danach mindestens:

1. `README.md` und `SECURITY.md`;
2. `docs/implementation/README.md`;
3. `docs/implementation/cemaris-increment-5k-completion.md`;
4. `docs/requirements/README.md`, insbesondere Abschnitte 12 bis 14 und 26;
5. `docs/requirements/mvp-read-search-decisions.md`;
6. `docs/requirements/case-record-write-decisions.md`;
7. `docs/requirements/identity-authorization-audit-decisions.md`;
8. `docs/requirements/person-usage-rights-deadlines-decisions.md`,
   insbesondere E-15 bis E-18 und 5C-05;
9. `docs/requirements/edwalt-analysis/interview-record.md`, nur die bereits
   versionierten Gebühren-, Bescheid-, Finanz- und Dokumentbefunde;
10. `docs/requirements/edwalt-analysis/documents-reports-templates.md`;
11. `docs/architecture/README.md`;
12. `docs/architecture/authentication-authorization-audit.md`;
13. `docs/architecture/person-usage-rights-deadlines.md`;
14. `docs/architecture/document-generation.md`;
15. `docs/architecture/winyard-integration.md`;
16. ADR-0005 bis ADR-0007, ADR-0009 bis ADR-0013 sowie ADR-0016 und ADR-0017;
17. `docs/migration/README.md` und den ausdrücklich pausierten
    `docs/migration/edwalt-fee-master-variants-next-step-handoff.md`.

Vor Modell- oder Variantenentscheidungen außerdem die vorhandene
Bescheid-/Gebührenprojektion und ihre Tests vollständig lesen:

- `src/Cemaris.Application/Cases/CaseReadModels.cs`;
- `src/Cemaris.Application/Cases/CaseReadService.cs`;
- `src/Cemaris.Application/Cases/InMemoryCaseSearch.cs`;
- `src/Cemaris.Infrastructure/ReadModel/SyntheticCaseReadStore.cs`;
- `src/Cemaris.Infrastructure/ReadModel/EfCaseReadStore.cs`;
- `src/Cemaris.Infrastructure/ReadModel/SyntheticReadModelSeeder.cs`;
- `src/Cemaris.Infrastructure/Persistence/ReadModel/ReadModelEntities.cs`;
- `src/Cemaris.Infrastructure/Persistence/CemarisDbContext.cs`;
- Initialmigration, Folgemigrationen und Model-Snapshot nur in den relevanten
  Bereichen;
- `src/Cemaris.Api/Contracts/CaseContracts.cs` und die lesenden Fallendpunkte;
- `src/Cemaris.Web/src/types/cases.ts`;
- `src/Cemaris.Web/src/pages/CaseDetailsPage.tsx`;
- `src/Cemaris.Web/src/pages/SearchPage.tsx`;
- alle unmittelbar zugehörigen Unit-, Integrations- und Frontendtests.

## Bereits bestätigter Ausgangsstand

Folgende Aussagen dürfen als bestätigt übernommen werden:

- Das externe Finanzverfahren ist für Forderungen, Zahlungen, Zahlungsstatus
  und Mahnungen führend.
- Es besteht derzeit keine aktive Finanzdatenschnittstelle; die heutige
  Übertragung erfolgt manuell.
- Zahlungsstatus und Mahnungen gehören nicht in den aktuellen Cemaris-Umfang.
- Für die manuelle Finanzbuchung werden mindestens zahlungspflichtige Person,
  Bescheidnummer, Gesamtbetrag, Fälligkeit und Kostenstelle benötigt.
- Für eine spätere EDWALT-Migration sind Bescheidnummer,
  Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug als
  Bedarf bestätigt; das ist noch keine Quellfeld-, Zielmodell- oder
  Importfreigabe.
- Vorhandene Akten, Bescheide und Schreiben werden nicht nach Cemaris
  verschoben.
- Fachliche Stammdatenpflege ist grundsätzlich für `Sachbearbeitung` und
  `Administration` vorgesehen; Formularvorlagen und administrative
  Programmkonfiguration bleiben `Administration` vorbehalten.
- Die bestehende Fallansicht kann nullable synthetische Bescheid- und
  Gebühreninformationen lesen und nach Bescheidnummer suchen. Es gibt keinen
  kanonischen Schreibservice, keine eigene Capability, keine Fachhistorie und
  keine freigegebene Festsetzungs- oder Korrektursemantik dafür.
- Dokumentarten, Vorlagenhoheit, Rechtsinhalte, Freigabe, Versand,
  Dateiformate und Rendering-Engine sind nicht bestätigt.
- Lokale Satzungsaussagen sind nur kommunale Evidenz und keine allgemeinen
  Open-Source-Defaults. Der dokumentierte Widerspruch 5C-05 darf nicht still
  aufgelöst werden.
- Die breite EDWALT-Migration bleibt nach ADR-0009 pausiert. ADR-0017 hat nur
  den in 5k abgeschlossenen nicht personenbezogenen
  Friedhofsstammdatenpfad freigegeben.

## Verbindliche Entscheidungsfragen

Erstelle eine quellengebundene Matrix mit mindestens den folgenden stabilen
IDs. Für jede Frage sind Status, Beleg, Geltungsbereich, entscheidungsbefugte
Rolle, Auswirkung auf einen möglichen 6b-Schnitt und offene Restfrage
anzugeben.

| ID | zu klärende Entscheidung |
| --- | --- |
| 6A-01 | Welcher konkrete Nutzerbedarf ist der erste Gebühren-/Bescheidschritt: Katalogpflege, manuelle Festsetzung, reine Faktenerfassung oder Dokumenterzeugung? |
| 6A-02 | Welche fachliche beziehungsweise rechtliche Wirkung besitzen Entwurf, Festsetzung und erzeugtes Dokument, und welcher Zustand ist der erste zulässige Umfang? |
| 6A-03 | Wie wird der Zahlungspflichtige mit einer kanonischen beteiligten Person oder Organisation verbunden; sind mehrere Zahlungspflichtige zulässig? |
| 6A-04 | Wer erzeugt die Bescheidnummer, welches Format und welcher Eindeutigkeitsbereich gelten, und sind manuelle Nummern zulässig? |
| 6A-05 | Welche Identität, Bezeichnung, Version und Gültigkeit besitzt eine Gebührenposition beziehungsweise Gebührenordnung? |
| 6A-06 | Welches Ereignis oder welcher Stichtag wählt den maßgeblichen Gebührenstand, insbesondere bei Alt-, Korrektur- und Verlängerungsfällen? |
| 6A-07 | Welche Mengen, Einheiten, Einzelpreise, Währungen, Steuern, Ermäßigungen, Befreiungen und Rundungsregeln sind zulässig? |
| 6A-08 | Wird der Gesamtbetrag berechnet, manuell festgesetzt oder kontrolliert überschrieben, und welche Summenkonsistenz ist verpflichtend? |
| 6A-09 | Wird die Fälligkeit manuell erfasst oder regelbasiert berechnet; wie wirken Bekanntgabe, Wochenenden und rückwirkende Korrekturen? |
| 6A-10 | Welche Kostenstellen- oder Haushaltsstelleninformation benötigt Cemaris, wer pflegt sie und welcher Gültigkeitsbereich gilt? |
| 6A-11 | Wie funktionieren Faktenkorrektur, Änderungsbescheid, Aufhebung, Storno, Erstattung und Neufestsetzung, ohne Historie zu überschreiben? |
| 6A-12 | Welche Rollen dürfen erfassen, prüfen, festsetzen, korrigieren, aufheben und Vorlagen pflegen; ist Funktionstrennung erforderlich? |
| 6A-13 | Welche Fachhistorie, Snapshots, ETags, Atomarität und datensparsamen Auditdaten sind je Operation erforderlich? |
| 6A-14 | Welche Bescheid-/Schreibenarten, Vorlagenversionen, Platzhalter, Ausgabeformate und Freigabeschritte sind für den ersten Dokumentumfang bestätigt? |
| 6A-15 | Wo endet der manuelle Finanzprozess, und welche Daten dürfen später an Finanzverfahren oder Winyard übertragen werden, ohne Zahlungsstatus zurückzuspiegeln? |
| 6A-16 | Welche Daten sind später migrationsrelevant, ohne daraus jetzt eine EDWALT-Quellregel, ein Mapping oder einen Import abzuleiten? |

Zulässige Status sind mindestens `BESTÄTIGT`, `TEILWEISE BESTÄTIGT`, `OFFEN`,
`WIDERSPRUCH` und `VERWORFEN`. Eine Altverfahrensbeobachtung, vorhandene
nullable Spalte oder lokale Satzungsaussage wird niemals allein zur
allgemeinen Produktentscheidung.

## Variantenvergleich und Auswahlregel

Vergleiche mindestens diese Varianten:

- **Variante A – noch keine Implementierung:** Gebühren-/Bescheidmodell bleibt
  read-only und vorläufig; fehlende Entscheidungen werden gebündelt.
- **Variante B – manuelle kanonische Bescheid-/Gebührenfakten:** ein kleiner
  historisierter Schreibdurchstich ohne automatische Gebührenberechnung,
  Dokumenterzeugung, Zahlungsstatus oder EDWALT-Migration.
- **Variante C – konfigurierbarer Gebührenkatalog als erster Schnitt:**
  nicht personenbezogene, versionierte Gebührenstammdaten ohne Festsetzung
  oder Dokumenterzeugung.
- **Variante D – Berechnung, Bescheid und Dokument in einem Inkrement:** wegen
  der offenen Regel-, Freigabe- und Vorlagenfragen zwingend verwerfen.

Für jede Variante mindestens Nutzerwert, bestätigte Quellen, offene
Fachwirkung, Datenschutz, Rollen, Persistenz, Audit, Migration,
Providerparität, Testbarkeit und spätere Kompatibilität bewerten.

Variante B oder C darf nur gewählt werden, wenn alle dafür notwendigen
Entscheidungen bereits durch ausdrückliche Produktentscheidung oder eine
zuständige Fach-/Freigabequelle geschlossen sind. Andernfalls Variante A
wählen. Keine Antwort durch technische Bequemlichkeit, EDWALT-Feldnamen,
vorhandene Tabellen oder lokale Einzelwerte ersetzen.

## Umgang mit fehlenden Informationen

Zuerst alle sicheren Repositoryquellen und den vorhandenen Code ausschöpfen.
Wenn danach Antworten fehlen, 6a nicht anhalten und keine Regeln erfinden:

1. Variante A als vollständigen Gate-Abschluss wählen;
2. alle fehlenden Entscheidungen in einer kurzen, gemeinsam beantwortbaren
   Fragenliste bündeln;
3. pro Frage die benötigte fachliche, rechtliche, organisatorische oder
   technische Entscheidungsrolle nennen;
4. keinen technischen 6b-Auftrag als ausführbar kennzeichnen.

Nur wenn eine kurze Rückfrage im laufenden Chat tatsächlich alle Blocker für
Variante B oder C schließen kann, darf genau einmal gemeinsam gefragt werden.
Unzuständige technische Einschätzungen sind als Produktpräferenz, nicht als
Fach- oder Rechtsfreigabe zu kennzeichnen.

## Abschlussartefakte

Mindestens erstellen beziehungsweise aktualisieren:

- neu: `docs/requirements/fee-notice-document-decisions.md`;
- neu: `docs/implementation/cemaris-increment-6a-completion.md`;
- Root-README und alle fünf Dokumentationsindizes;
- `docs/architecture/document-generation.md` und weitere unmittelbar
  betroffene Architektur-/Anforderungsdokumente;
- diese 6a-Übergabe mit einem sichtbaren Ausführungsstatus.

Nur wenn Variante B oder C vollständig freigegeben ist, zusätzlich eine
separate, kontextlos ausführbare
`docs/implementation/cemaris-increment-6b-next-step-handoff.md` erstellen.
Bei Variante A stattdessen die gebündelte Entscheidungs-/Freigabeliste im
6a-Abschluss dokumentieren. Kein neues ADR erstellen, sofern keine echte neue
Architekturentscheidung bestätigt wurde; bestehende ADRs nicht rückwirkend
umschreiben.

Keine Gebührenbezeichnungen, Beträge, Personen-, Adress-, Bescheid- oder
sonstigen Verwaltungswerte in Repository, Tests, Logs oder Screenshots
übernehmen. Alle Beispiele bleiben eindeutig synthetisch.

## Abschlussprüfungen

Obwohl 6a dokumentarisch ist, den vollständigen sicheren Repositoryzustand
prüfen:

- Release-Build der Solution mit dem vorgegebenen SDK, 0 Warnungen und
  0 Fehler;
- vollständige Unit-Tests;
- reguläre Integrationstests mit `Category!=SqlServer`;
- `dotnet format Cemaris.sln --verify-no-changes --no-restore`;
- `npm ci`, vollständige Frontendtests, Lint und Produktionsbuild;
- keine SQL-Testverbindung anfordern und keine SQL-Kategorie ausführen; 6a
  benötigt keine Datenbank;
- keinen API- oder Frontend-Dev-Server und keinen Browser-Smoke-Test starten;
- `git diff --check`, lokale Markdown-Links und -Anker, Tabellen und
  Whitespace prüfen;
- repositorybasierte Secret- und Verwaltungsdatenprüfung ohne Zugriff auf
  User Secrets und ohne Ausgabe gefundener Werte;
- vollständige finale Git-Prüfung einschließlich unversionierter Inhalte;
- bestätigen, dass `Cemaris_Dev`, sämtliche externen Verzeichnisse,
  EDWALT-Bestände und `tmp/pagination-build` unverändert blieben;
- bestätigen, dass nichts gestagt und kein Commit erstellt wurde.

## Direkt kopierbarer Prompt

```text
Du arbeitest im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-increment-6a-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe anschließend Inkrement 6a – das
Gebühren-/Bescheid-Entscheidungsgate – vollständig Ende zu Ende aus. Halte
sämtliche dort genannten Umfangs-, Quellen-, Datenschutz-, Sicherheits-,
Kompatibilitäts-, Prüf- und Dokumentationsgrenzen ein.

Untersuche vor Änderungen den vollständigen Git-Stand und erhalte sämtliche
vorhandene Arbeit. Inkrement 5k und die vorbereitende 6a-Dokumentation können
committed, gepusht oder noch uncommitted vorliegen. Führe keinen Reset durch
und verändere tmp/pagination-build nicht.

Repository und einziges Verzeichnis für versionierte Änderungen:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Verwende für .NET ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Lege für 6a kein externes Arbeitsverzeichnis an. Vollständig außerhalb des
Arbeitsumfangs bleiben insbesondere:

C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration
C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825

Öffne oder verändere keine externe EDWALT-, Phase-, Satzungs-, Vorlagen- oder
sonstige Arbeitswurzel. Führe EDWALT nicht aus. Öffne keine Datenbankverbindung
und lies keine User Secrets; Inkrement 6a ist ausschließlich dokumentarisch.
Der EDWALT-Gebührenauftrag bleibt pausiert.

Bewerte den vorhandenen Bescheid-/Gebühren-Lesevertrag nicht als freigegebenes
Schreibmodell. Erfinde keine Gebührenordnung, Beträge, Gültigkeits-,
Berechnungs-, Fälligkeits-, Korrektur-, Storno-, Freigabe-, Dokument- oder
Migrationsregel. Verwende nur belegte Repositoryquellen und eindeutig
synthetische Beispiele.

Schließe das Gate auch bei fehlenden Fachentscheidungen vollständig ab. Wähle
dann begründet Variante A, dokumentiere die gebündelten Entscheidungsfragen
und implementiere keinen vorgetäuschten 6b-Umfang. Erstelle einen technischen
6b-Folgeauftrag nur, wenn Variante B oder C vollständig durch zuständige
Entscheidungen getragen ist.

Arbeite bis zum vollständigen nachgewiesenen Abschluss einschließlich
Quellenmatrix, Variantenvergleich, Entscheidung, Abschlussdokumentation,
Dokumentationsindizes und aller in der Übergabe geforderten Prüfungen.

Führe keinen Commit durch und stage keine Dateien.
```
