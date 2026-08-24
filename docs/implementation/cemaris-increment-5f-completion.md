# Abschluss Inkrement 5f: Nutzungsrechtslebenszyklus-Entscheidungs- und Freigabegate

Stand: 21.08.2026

## Ergebnis

Inkrement 5f ist ausschließlich dokumentarisch mit Variante A „keine
Implementierung“ abgeschlossen. Für keine reale Nutzungsrechtslebenszyklus-
operation liegen sämtliche fachlichen, rechtlichen und technischen
Mindestentscheidungen sowie die erforderlichen Freigaben vor.

Als genau ein möglicher Schnitt wurde eine manuell ausgelöste, historisierte
vorzeitige Rückgabe nach bereits abgelaufener Ruhezeit untersucht. Die
Bezeichnung stammt ausschließlich aus der örtlichen Satzungsevidenz E-17. Sie
ist weder als wichtigste reale Operation bestätigt noch eine allgemeine
Cemaris-Fachregel.

Produktcode, Frontend, Backend, API/OpenAPI, Domain, Berechtigungen,
Persistenz, Migrationen und Tests wurden in 5f nicht geändert. Es wurde keine
Datenbank, laufende API oder manuelle Fachmutation verwendet.

## Ausgangsstand und Abweichung

Die im Auftrag als uncommittiert erwartete 5e-Arbeit war vor Beginn bereits
vollständig als lokaler Commit
`aee488c13fe1ec22cb98f2e35194423071d6d8ff` vorhanden. Der Commit enthält
exakt die angekündigten zehn 5e-Dateien. Deshalb galt vor 5f:

- Branch `main`;
- HEAD `aee488c13fe1ec22cb98f2e35194423071d6d8ff`;
- Upstream `origin/main`;
- Ahead/Behind `2/0`;
- leerer Index und sauberer Arbeitsbaum;
- keine normalen unversionierten Dateien.

Der vorhandene Commit wurde nicht zurückgesetzt oder verändert. In 5f wurde
kein Commit erstellt.

## Quellenarbeit

Vollständig gelesen wurden die verbindliche 5f-Übergabe und ihre gesamte
Pflichtlektüre, insbesondere die Abschlüsse und Übergaben von 5a bis 5e, die
Anforderungs- und Architekturdokumente für Nutzungsrechte sowie Identität,
Autorisierung und Audit, ADR-0016, die Root-README und alle vier
Dokumentationsindizes.

Die vollständige
[Quellen-, Evidenz-, Entscheidungs- und Freigabematrix](cemaris-increment-5f-evidence-decision-approval-matrix.md)
weist für jede Frage 5C-01 bis 5C-14 Quelle, Geltungsbereich, Status,
benötigte Funktion und Auswirkung auf einen möglichen kleinsten Schnitt aus.
Außerhalb des Repositorys liegende Satzungs- oder EDWALT-Originale wurden
nicht geöffnet. Repository-interne EDWALT-Unterlagen wurden nicht benötigt;
sie bleiben ausschließlich `ALTVERFAHRENS-EVIDENZ`.

## Dokumentierte Auskunft

Die direkte Auskunft `USR-2026-08-21-ADMIN-DEVELOPMENT` wurde am 21.08.2026
mit der Funktion `Administrator mit Entwicklungsauftrag für die
Friedhofsverwaltungssoftware` erteilt:

- Cemaris soll als Open-Source-Software für alle Kommunen nachnutzbar sein;
- die Software wird zunächst für die Stadt Doberlug-Kirchhain entwickelt;
- die Entwicklung soll möglichst fortgesetzt werden und darf sich bei der
  Erhebung an EDWALT orientieren.

Diese Aussage bestätigt die allgemeine Produkt- und Kommunalrichtung. Die
Funktion wurde nicht als Friedhofsverwaltung, Produktverantwortung,
Rechtsprüfung, Datenschutz, Informationssicherheit oder Betriebsfreigabe
benannt. Die Auskunft bestätigt deshalb weder Bedarf noch Semantik oder
Freigabe der untersuchten Rückgabe.

## Entscheidungsstand 5C-01 bis 5C-14

- `5C-02` bleibt bestätigt: Das manuelle 5b-Enddatum ist ein änderbarer,
  historisierter Fakt ohne eigene Status-, Ablauf- oder Beendigungswirkung.
- `5C-14` bleibt bestätigt: Kommunale Werte und Ereignisse sind lokale
  Konfiguration beziehungsweise lokale Entscheidungen; Historisierung,
  Atomarität, starke ETags, sparsamer Audit und rückwirkungsfreie Snapshots
  sind allgemeine technische Mechanismen.
- `5C-05` bleibt widersprüchlich.
- `5C-01`, `5C-03`, `5C-04` und `5C-06` bis `5C-13` bleiben offen. Die
  Mitteilung zum ersten kommunalen Kontext schließt keine dieser
  operationsspezifischen Entscheidungen.

## Fehlende Entscheidungen und Freigaben

| Fehlender Nachweis | Benötigte Funktion | Wirkung auf Variante B |
| --- | --- | --- |
| reale Operation mit höchstem Bedarf, Rechtearten und kommunaler Fallumfang | Friedhofsverwaltung und Produktverantwortung | fachlicher Schnitt ist nicht bestimmt |
| Auslöser, Pflichtnachweis, Wirksamkeit, Rückwirkung, Korrektur und Rücknahme | Friedhofsverwaltung und Rechtsprüfung | Zustandsübergang kann nicht spezifiziert werden |
| Zustand nach Rückgabe und ausdrücklich unveränderte Fakten | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | Domainwirkung ist offen |
| auslösende, bestätigende, korrigierende und rücknehmende Funktionen | Fachverantwortung und Berechtigungs-/Informationssicherheitsverantwortung | Autorisierung und Funktionstrennung sind offen |
| Wirkung auf laufende Beisetzungen und offenen Inhaberzeitraum | Friedhofsverwaltung und Rechtsprüfung | atomare Aggregatgrenze ist offen |
| Wirkung auf Grabstatus, Sperre und Wiedervergabe | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | Grabstellenkopplung und Wiedervergabe sind offen |
| Pflichtquelle, Begründung und Inhalt der Fachrevision | Friedhofsverwaltung und Produktverantwortung | Revisionsvertrag ist offen |
| Altbestand, Migration, Bestandsschutz und fehlende Nachweise | Friedhofsverwaltung, Rechtsprüfung, Migration und Produktverantwortung | keine sichere Datenübernahme möglich |
| Datenschutz- und Aufbewahrungsbewertung | Datenschutz, Fachverantwortung und Rechtsprüfung | zusätzliche Fachrevision/Auditwirkung ist nicht freigegeben |
| Sicherheits- und Betriebsfreigabe | Informationssicherheit und Betrieb | neue Berechtigungs- und Betriebsgrenze ist nicht freigegeben |

Es wurde keine fachliche Verwaltungsabnahme, Rechtsprüfung,
Datenschutzfreigabe, Sicherheitsfreigabe, Betriebsfreigabe oder
Produktivfreigabe behauptet.

## Vergleich der Varianten

| Aspekt | Variante A – keine Implementierung | Variante B – eine manuelle historisierte Operation | Variante C – berechneter/automatisierter Lebenszyklus |
| --- | --- | --- | --- |
| Domainidentität | bestehende `UsageRightId` und 5b-Grenzen unverändert | müsste dieselbe Rechteidentität bei einem expliziten Ereignis erhalten; eine spätere Wiedervergabe bliebe gemäß REQ-UR-008 eine neue Identität | würde zusätzlich Regel-, Frist- und Zustandsidentitäten benötigen |
| Historisierung | keine neue Revision oder erfundene Vergangenheit | müsste eine unveränderliche, fachlich bestätigte Vorher-/Nachher-Revision ergänzen | würde Ereignis-, Regelstands- und Berechnungshistorie erfordern |
| Atomarität | vorhandene 5b-Transaktionsgrenzen unverändert | müsste alle bestätigten Zustands-, Inhaber-, Revisions- und Auditwirkungen gemeinsam schreiben oder zurückrollen | müsste zusätzlich Frist-, Grabstellen- und Folgeprozesswirkungen atomar koordinieren |
| ETag | vorhandene starke ETags unverändert | müsste das vorhandene starke ETag des Nutzungsrechts verwenden; genaue Aggregatgrenze ist offen | würde mehrere versionierte Aggregate und Konfliktregeln benötigen |
| Audit | vorhandener sparsamer Audit unverändert | müsste eine bestätigte Operation und Ergebnisversion sparsam nachweisen; Fachinhalte blieben in der geschützten Revision | würde auch automatische Akteurs-, Auslöser- und Betriebsnachweise benötigen |
| Migration | keine Migration und kein Backfill | additive Migration erst nach bestätigtem Zustandsmodell; keine erfundene Althistorie | umfangreiche Regelstands-, Frist- und Altfallmigration erforderlich |
| Altkompatibilität | nullable Altprojektionen bleiben getrennt und lesbar | müsste Altprojektionen weiterhin getrennt lassen und fehlende Nachweise ausdrücklich behandeln | automatische Rückinterpretation wäre ohne eigene Altfallregeln unzulässig |
| Entscheidung | **ausgewählt** | nicht freigabefähig und nicht spezifiziert | für 5f ausgeschlossen |

Variante A wahrt ADR-0016 unverändert. Da keine neue bestätigte
Architekturentscheidung vorliegt, wurde kein ADR erstellt und ADR-0016 nicht
rückwirkend geändert.

## Warum EDWALT die fehlenden Entscheidungen nicht ersetzt

EDWALT darf zur Auffindung von Begriffen, Masken, Datenfeldern und
Interviewfragen herangezogen werden. Ein beobachteter Altverfahrensablauf
belegt jedoch nicht automatisch:

- die aktuell geltende örtliche Rechtswirkung;
- den tatsächlichen heutigen Verwaltungsprozess;
- zulässige Rollen oder Funktionstrennung;
- Datenschutz-, Aufbewahrungs-, Sicherheits- oder Betriebsfreigaben;
- ein für alle Kommunen geeignetes Open-Source-Produktverhalten.

Die übrige Produktentwicklung kann mit bereits bestätigten Verträgen oder
fachregelarmen technischen Inkrementen fortgesetzt werden. Nur die offene
Lebenszyklusoperation bleibt gesperrt.

## Nächster sicherer Schritt

Der Lebenszykluspfad kann mit dem rein dokumentarischen
[5g-Kurzentscheidungs- und Freigabegate](cemaris-increment-5g-next-step-handoff.md)
fortgesetzt werden. Es legt denselben einzelnen Untersuchungskandidaten der
Friedhofsverwaltung und den tatsächlich zuständigen Freigabefunktionen vor.
Ohne diese Beteiligung endet auch 5g mit keiner Implementierung.

Ein davon unabhängiges technisches Produktinkrement darf separat beauftragt
werden, sofern es keine offene Frist-, Status-, Rückgabe-, Entziehungs-,
Schließungs-, Wiedervergabe- oder Wiedervorlagenregel vorwegnimmt.

## Abschlussprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` mit dem verbindlichen .NET-SDK | bestanden; 0 Warnungen, 0 Fehler |
| vollständige Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 50 von 50 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| vollständige Frontendtests | 37 von 37 in 8 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| relative Markdown-Links und Anker | 83 Markdown-Dateien geprüft; 0 Befunde |
| Markdown-Tabellen der geänderten und neuen Dateien | konsistente Spaltenzahlen; 0 Befunde |
| Whitespace der geänderten und neuen Dateien | 0 Befunde |
| Secretprüfung des Änderungsumfangs ohne Ausgabe von Werten | 0 Befunde |

Die reale SQL-Suite wurde nicht gestartet. Es wurde keine Datenbank gelesen,
angelegt, migriert oder verändert, keine Verbindung verwendet und weder API
noch Frontend-Dev-Server gestartet. Alle eigenen Dateioperationen lagen im
Cemaris-Repository. Es wurde keine externe Arbeitsfläche geöffnet oder
angelegt.

Der vorbestehende ignorierte Fremdbestand `tmp/pagination-build` umfasste bei
der ersten und der späteren Vollprüfung jeweils 890 Dateien und 120.354.652
Bytes. Sein aus relativem Pfad, Dateilänge, UTC-Änderungszeit und Datei-SHA-256
gebildeter Manifest-Hash blieb unverändert
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.
Er wurde weder verändert noch entfernt oder als eigene Arbeit ausgegeben.

Der finale Git-Nachweis prüft Branch, HEAD, Upstream, Ahead/Behind, Status,
vollständigen Arbeits- und Index-Diff sowie alle unversionierten Inhalte. Der
Index bleibt leer. HEAD bleibt
`aee488c13fe1ec22cb98f2e35194423071d6d8ff`; in 5f wurde kein Commit
erstellt.

## Dokumentationsumfang

Geändert wurden ausschließlich:

- `README.md`;
- `docs/architecture/README.md`;
- `docs/architecture/person-usage-rights-deadlines.md`;
- `docs/decisions/README.md`;
- `docs/implementation/README.md`;
- `docs/requirements/README.md`;
- `docs/requirements/person-usage-rights-deadlines-decisions.md`.

Neu und unversioniert sind ausschließlich:

- diese Abschlussdokumentation;
- die 5f-Quellen-, Evidenz-, Entscheidungs- und Freigabematrix;
- die ausführbare 5g-Folgeübergabe.

Damit ist 5f dokumentarisch abgeschlossen. Die technische Verifikation ist
keine fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe,
Sicherheitsfreigabe, Betriebsfreigabe oder Produktivfreigabe.
