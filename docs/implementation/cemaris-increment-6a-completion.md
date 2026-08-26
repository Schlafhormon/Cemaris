# Abschluss Inkrement 6a: Gebühren-/Bescheid-Entscheidungsgate

Stand: 26.08.2026

## Ergebnis

Inkrement 6a ist ausschließlich dokumentarisch mit **Variante A – noch keine
Implementierung** abgeschlossen. Die vorhandenen Repositoryquellen tragen
weder Variante B „manuelle kanonische Fakten“ noch Variante C
„konfigurierbarer Gebührenkatalog“ vollständig. Variante D „Berechnung,
Bescheid und Dokument“ ist wegen der breiten offenen Fach-, Rechts-, Rollen-,
Historien-, Vorlagen- und Migrationswirkung verworfen.

Der nullable Bescheid-/Gebührenanteil des vorhandenen MVP bleibt ein
technischer Read-only-Vertrag. Er ist kein kanonisches Schreibmodell. In 6a
wurden deshalb Produktcode, Datenbankschema, Domain, API/OpenAPI, UI,
Capabilities, Policies, Persistenz, Migrationen, Laufzeitverhalten und Tests
nicht geändert. Es gibt keine neue Gebühren-, Festsetzungs-, Fälligkeits-,
Korrektur-, Storno-, Freigabe-, Dokument- oder Migrationsregel.

Da keine neue Architekturentscheidung freigegeben wurde, wurde kein ADR
erstellt. Da weder B noch C vollständig durch zuständige Entscheidungen
getragen ist, wurde kein
`docs/implementation/cemaris-increment-6b-next-step-handoff.md` erstellt.

## Ausgangsstand

Vor der ersten Änderung wurde der vollständige Git-Stand einschließlich
unversionierter Inhalte geprüft:

- Repositorywurzel
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Branch `main`;
- HEAD `b38c17c5b379499a610b80912ddac1067254fa07`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- leerer Index, sauberer Arbeitsbaum und keine normalen unversionierten
  Dateien;
- Inkrement 5k und die vorbereitende 6a-Übergabe lagen bereits gemeinsam in
  diesem Commit und auf dem Upstream vor.

Der vorbestehende ignorierte Fremdbestand `tmp/pagination-build` wurde nur
über Dateisystemmetadaten inventarisiert: 890 Dateien, 118 Verzeichnisse und
120.354.652 Bytes; frühester Änderungszeitpunkt 25.08.2018 21:54:14, spätester
Änderungszeitpunkt 14.08.2026 12:28:10. Er war kein Arbeitsverzeichnis für 6a.

## Quellenarbeit und Geltungsgrenze

Vollständig gelesen wurden die verbindliche 6a-Übergabe und ihre
Pflichtquellen: Root- und Dokumentationsindizes, SECURITY, 5k-Abschluss,
Anforderungs-, Identitäts-/Autorisierungs-/Audit-, Personen-/Nutzungsrechts-,
Dokument-/DMS-, Architektur-, ADR- und Migrationsdokumente. Ergänzend wurden
die unmittelbar relevanten versionierten EDWALT-Analyseunterlagen sowie die
vollständigen technischen Lesewege in Application, Synthetic-/EF-Provider,
Persistenz, API, UI, Migrationen und den zugehörigen Tests geprüft.

Die
[Quellenmatrix und Entscheidungsmatrix](../requirements/fee-notice-document-decisions.md)
unterscheidet ausdrücklich:

- bestätigte Produktentscheidungen;
- örtliche Satzungsevidenz ohne allgemeine Open-Source-Wirkung;
- Altverfahrensevidenz ohne Sollmodellwirkung;
- den technischen Lesevertrag ohne Fachfreigabe;
- offene oder widersprüchliche Entscheidungen.

Es wurden ausschließlich versionierte Repositoryquellen ausgewertet. Externe
EDWALT-, Phase-, Satzungs-, Vorlagen- oder sonstige Arbeitswurzeln wurden
weder geöffnet noch verändert. EDWALT wurde nicht ausgeführt. Es wurde keine
Datenbankverbindung geöffnet und es wurden keine User Secrets gelesen.

## Entscheidungsstand 6A-01 bis 6A-16

Die vollständige Matrix dokumentiert je Frage Status, Quellenbefund,
Geltungsbereich, benötigte Entscheidungsfunktion, Auswirkung auf 6b und die
offene Restfrage. Zusammengefasst:

| Status | Fragen | Gate-Wirkung |
| --- | --- | --- |
| `OFFEN` | 6A-01, 6A-02, 6A-04, 6A-07, 6A-08, 6A-11, 6A-14 | erster Nutzen, Rechtszustand, Nummer, Zahlenmodell, Summenbildung, Korrektur und Dokumentumfang sind nicht spezifiziert |
| `TEILWEISE BESTÄTIGT` | 6A-03, 6A-05, 6A-09, 6A-10, 6A-12, 6A-13, 6A-15 | Bedarf oder allgemeiner Mechanismus ist belegt, operationsfähige Semantik und Freigabe fehlen |
| `WIDERSPRUCH` | 6A-06 | örtliche Regelstand-/Stichtagsevidenz E-18/5C-05 ist nicht aufgelöst |
| `BESTÄTIGT` | 6A-16 | nur abstrakte spätere Migrationskategorien; keine Quellfeld-, Zielmodell-, Mapping- oder Importfreigabe |

Die bestätigte Finanzprozessgrenze bleibt unverändert: Das externe
Finanzverfahren ist für Forderungen, Zahlungen, Zahlungsstatus und Mahnungen
führend; ein aktiver Rückkanal ist nicht belegt. Die später benötigten
Migrationskategorien begründen weder eine aktuelle Finanzintegration noch
einen EDWALT-Import.

## Variantenentscheidung

| Variante | Ergebnis | Begründung |
| --- | --- | --- |
| A – noch keine Implementierung | **ausgewählt** | schützt vorhandene Kompatibilität und verhindert Fach-, Rechts-, Datenschutz- und Migrationsannahmen |
| B – manuelle kanonische Fakten | nicht freigegeben | Schuldnerrolle, Zustand, Nummer, Festsetzung, Fälligkeit, Korrektur, Rechte und Revision fehlen |
| C – konfigurierbarer Gebührenkatalog | nicht freigegeben | Identität, Version, Gültigkeit, Regelstand, Zahlenregeln, Freigabe und gegebenenfalls Kontierung fehlen |
| D – Berechnung, Bescheid und Dokument | verworfen | würde mehrere ungeklärte Aggregate, Rechtswirkungen, Rollen, Dokument- und Integrationsverträge koppeln |

Die Entscheidung bewahrt API-, UI-, Schema- und Providerkompatibilität. Die
nullable Tabellen, Felder, Suchbarkeit und synthetischen Fixtures werden nicht
rückwirkend als Fachmodell interpretiert. Der vorbereitete
EDWALT-Gebühren-/Variantenauftrag bleibt pausiert.

## Gebündelter nächster Klärungsbedarf

Vor einem neuen Gate sind die sechs Pakete aus der
[Entscheidungs- und Freigabeliste](../requirements/fee-notice-document-decisions.md#gebündelte-entscheidungs--und-freigabeliste)
zuständig und quellenbelegt zu schließen:

1. Produktnutzen und Rechtszustand;
2. Zahlungspflicht und Nummer;
3. Katalog, Regelstand und Zahlen;
4. Korrektur, Rollen und Nachweis;
5. Dokumentumfang;
6. System- und Migrationsgrenze.

Erst wenn genau ein kleiner Schnitt durch diese Pakete vollständig getragen
ist, darf ein neues Entscheidungsgate einen kontextlos ausführbaren 6b-Auftrag
erstellen. Diese fachliche Klärung ist kein technischer Folgeauftrag.

## Abschlussprüfungen

Alle .NET-Befehle liefen ausschließlich mit
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`.

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen und 0 Fehler |
| vollständige Unit-Tests | 48 von 48 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 58 von 58 bestanden |
| `dotnet format Cemaris.sln --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| vollständige Frontendtests | 41 von 41 in 8 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| lokale Markdown-Links und -Anker | 98 Markdown-Dateien und 345 lokale Ziele/Anker geprüft; 0 Befunde |
| Markdown-Tabellen und Whitespace | 183 Tabellen in 98 Markdown-Dateien konsistent; 13 geänderte/neue Dateien ohne Whitespacebefund |
| repositorybasierte Secret- und Verwaltungsdatenprüfung ohne Wertausgabe | 321 Git-sichtbare sowie alle 13 geänderten/neuen Dateien geprüft; 0 neue Befunde |

Die SQL-Kategorie wurde nicht ausgeführt und keine SQL-Testverbindung
angefordert. Der Solution-Build kompilierte das vorhandene Migrationsprojekt,
führte EDWALT aber nicht aus. API, Frontend-Dev-Server und Browser wurden nicht
gestartet.

Die Secret- und Verwaltungsdatenprüfung gab keine gefundenen Werte aus. Sie
fand weder privaten Schlüssel noch bekanntes Token, Zugangsdatenzuweisung,
Verbindungskennwort, E-Mail-, IBAN-, UNC- oder Währungsbetragswert im
6a-Ergänzungsumfang. Vorbestehende Template-/Development-/Testdateien mit
entsprechenden technischen Mustern sind gegenüber HEAD unverändert; es wurde
keine neue Datei mit Secret-, Datenbank-, EDWALT- oder Verwaltungsdatenendung
aufgenommen.

## Dokumentationsumfang und Schutzbestätigung

Geändert wurden ausschließlich die Root-README, die fünf
Dokumentationsindizes, die ausgeführte 6a-Übergabe sowie direkt betroffene
Lesevertrags-, Dokument- und Winyard-Dokumente. Neu sind ausschließlich diese
Abschlussdokumentation, die 6a-Entscheidungsakte und die nachgelagerte
Freigabeübergabe. Produktcode, Projektdateien, Konfiguration, Tests,
Migrationen und Laufzeitdaten blieben unverändert.

Der finale Nachweis bestätigt erneut Branch `main`, HEAD
`b38c17c5b379499a610b80912ddac1067254fa07`, Upstream `origin/main` mit
Ahead/Behind `0/0` und einen leeren Index. Der Arbeitsbaum enthält genau zehn
geänderte Markdown-Dateien und die drei vollständig geprüften
unversionierten Markdown-Dateien dieses Inkrements. Es wurde nichts gestagt,
kein Commit erstellt und kein Reset ausgeführt.

`tmp/pagination-build` besitzt final dieselben 890 Dateien, 118 Verzeichnisse,
120.354.652 Bytes sowie denselben frühesten und spätesten Änderungszeitpunkt
wie vor der Arbeit. `Cemaris_Dev`, sämtliche externen Verzeichnisse und
EDWALT-Bestände blieben unverändert, weil weder Verbindung noch Zugriff
erfolgte.

Damit ist Variante A ein vollständiger Gate-Abschluss, aber keine fachliche
Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe, Sicherheitsfreigabe,
Betriebsfreigabe oder Produktivfreigabe.

## Nachgelagerte Vorbereitung

Nach dem 6a-Abschluss hat der Projektauftraggeber am 26.08.2026 manuelle
kanonische Bescheid-/Finanzfakten als nächsten Prüfungskandidaten priorisiert.
Diese Entscheidung ändert Variante A nicht und erteilt keine technische oder
fachliche Freigabe. Für die zuständige Klärung wurde die rein dokumentarische
[Folgeübergabe](cemaris-manual-notice-facts-approval-next-step-handoff.md)
erstellt. Sie darf nur bei vollständig bestätigtem kleinem Faktenkern einen
technischen 6b-Auftrag erzeugen.
