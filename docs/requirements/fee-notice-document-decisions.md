# Entscheidungsgate zu Gebühren, Bescheiden und Dokumenten

Stand: 26.08.2026

Status: Inkrement 6a ist dokumentarisch abgeschlossen. Ausgewählt ist
**Variante A – noch keine Implementierung**. Es besteht keine Freigabe für
einen technischen 6b-Auftrag.

## Zweck, Geltungsbereich und Wirkung

Dieses Dokument trennt bestätigte Bedarfe und technische Lesefähigkeiten von
noch offenen Fach-, Rechts-, Rollen-, Historien-, Dokument- und
Migrationsentscheidungen. Es ist weder eine Gebührenordnung noch eine
Rechts-, Datenschutz-, Betriebs- oder Produktivfreigabe.

Der vorhandene Bescheid-/Gebührenanteil in `CaseOverview`, `ReadNotices` und
`ReadFeeItems` bleibt eine nullable, konservative Read-only-MVP-Projektion. Er
ist kein kanonisches Schreibmodell. Insbesondere werden daraus keine
Nummerierung, Katalogidentität, Gültigkeit, Berechnung, Fälligkeit, Korrektur,
Festsetzung, Freigabe, Dokumenterzeugung oder Migration abgeleitet.

Für die nachfolgenden Aussagen gelten diese Evidenzklassen:

- `PRODUKTENTSCHEIDUNG`: ausdrücklich bestätigte Cemaris-Anforderung;
- `SATZUNGSEVIDENZ`: örtliche kommunale Aussage ohne allgemeine
  Open-Source-Wirkung;
- `ALTVERFAHRENS-EVIDENZ`: beobachtete EDWALT-Struktur oder -Funktion ohne
  Sollmodellwirkung;
- `TECHNISCHER LESEVERTRAG`: implementierte Projektion ohne Fachfreigabe;
- `OFFEN` oder `WIDERSPRUCH`: vor einer Implementierung zuständig zu klären.

## Quellenmatrix

| Quellen-ID | Repositoryquellen | Evidenzklasse und bestätigter Kern | Geltungsbereich | Nicht daraus ableitbar | Betroffene Fragen |
| --- | --- | --- | --- | --- | --- |
| Q-6A-01 | [Root-README](../../README.md), [Implementierungsplan](../implementation/README.md), [6a-Übergabe](../implementation/cemaris-increment-6a-next-step-handoff.md), ADR-[0007](../decisions/ADR-0007-requirements-before-implementation.md), [0009](../decisions/ADR-0009-product-development-before-edwalt-import.md) und [0017](../decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md) | `PRODUKTENTSCHEIDUNG`: unbekannte Regeln werden nicht geraten; 6a ist dokumentarisch; die breite EDWALT-Migration bleibt pausiert. | allgemeine Produkt- und Migrationsgrenze | ein Gebühren-, Bescheid-, Dokument- oder Importmodell | alle |
| Q-6A-02 | [Anforderungsübersicht, Abschnitte 3, 5 und 12 bis 14](README.md), [Interviewprotokoll INT-008, INT-011 bis INT-016 und INT-030 bis INT-033](edwalt-analysis/interview-record.md) | `PRODUKTENTSCHEIDUNG`: Gebühren-/Bescheidarbeit wird genutzt; das externe Finanzverfahren führt Forderungen, Zahlungen, Zahlungsstatus und Mahnungen; die Übertragung ist derzeit manuell; ein kleiner Satz benötigter Finanzbuchungs- und späterer Migrationsdaten ist bestätigt. | heutiger Prozess, lesender MVP und abstrakte spätere Datenkategorien | erster Schreibanwendungsfall, vollständige Feldliste, Festsetzungs- oder Korrekturwirkung | 6A-01, 6A-02, 6A-10, 6A-15, 6A-16 |
| Q-6A-03 | [Identitäts-/Rollenentscheidungen](identity-authorization-audit-decisions.md), [Sicherheitsarchitektur](../architecture/authentication-authorization-audit.md), ADR-[0011](../decisions/ADR-0011-provider-neutral-actor-and-atomic-case-audit.md), [0012](../decisions/ADR-0012-local-accounts-and-role-boundaries.md) und [0013](../decisions/ADR-0013-local-cookie-session-and-security-stamp.md) | `PRODUKTENTSCHEIDUNG`: beide Systemrollen dürfen bestätigte Facharbeit ausführen; administrative Programmkonfiguration und Formularvorlagen bleiben Administration vorbehalten; ETag, Atomarität und sparsamer Audit sind vorhandene Sicherheitsmechanismen. | bereits bestätigte Operationen und allgemeine Rollengrenzen | operationsgenaue Rechte für Erfassen, Prüfen, Festsetzen, Korrigieren oder Aufheben; Funktionstrennung; fachlicher Revisionsinhalt | 6A-12, 6A-13, 6A-14 |
| Q-6A-04 | [Personen-/Nutzungsrechtsentscheidungen E-15 bis E-18 und 5C-05](person-usage-rights-deadlines-decisions.md) | `SATZUNGSEVIDENZ`: Zahlungspflicht und Rechteinhaberschaft dürfen nicht gleichgesetzt werden; örtliche Aussagen zu Entstehung und Fälligkeit existieren; E-18/5C-05 bleibt widersprüchlich. | bestätigter örtlicher Evidenzkontext, nicht allgemeiner Produktstandard | allgemeine Schuldnerrolle, Kardinalität, Fälligkeitsberechnung oder Auflösung des Widerspruchs | 6A-03, 6A-06, 6A-09 |
| Q-6A-05 | [Dokument-/Vorlagenbefunde](edwalt-analysis/documents-reports-templates.md), [Evidenzmatrix](edwalt-analysis/evidence-matrix.md), [Funktionskatalog](edwalt-analysis/function-catalog.md) und [Interviewleitfaden](edwalt-analysis/open-questions-and-interview-guide.md) | `ALTVERFAHRENS-EVIDENZ`: EDWALT kennt Gebührenstamm, Positionen, Druck-, Storno-/Gutschrift- und mehrere Dokumentpfade; tatsächliche Fachwirkung, Nutzung, Gültigkeit und Freigabe sind offen. | spätere Erhebung und Migrationsanalyse | Cemaris-Katalog, Berechnung, Dokumentart, Freigabe- oder Korrekturprozess | 6A-01, 6A-02, 6A-05 bis 6A-08, 6A-11, 6A-14 |
| Q-6A-06 | [Dokumentkonzept](../architecture/document-generation.md), [Winyard-Konzept](../architecture/winyard-integration.md) und [ADR-0006](../decisions/ADR-0006-dms-adapter.md) | `PRODUKTENTSCHEIDUNG`: Winyard bleibt optionaler Adapter; einige bedingte DMS-Fähigkeiten sind bestätigt; Cemaris wird kein zweites DMS. | spätere, aktivierbare DMS-Integration | Dokumentarten, Vorlagenhoheit, Rechtsinhalt, Ausgabeformat, Freigabe, Versand oder Renderer | 6A-14, 6A-15 |
| Q-6A-07 | [Migrationsstrategie](../migration/README.md), [Quellenanalyse](../migration/edwalt-source-analysis.md), [Extraktionsbefund](../migration/edwalt-extraction-prototype.md), [Quellfeldkatalog](../migration/edwalt-source-field-catalog.md) und [pausierter Gebührenauftrag](../migration/edwalt-fee-master-variants-next-step-handoff.md) | `PRODUKTENTSCHEIDUNG` nur für abstrakte Migrationskategorien; ansonsten `ALTVERFAHRENS-EVIDENZ`: einzelne technische Blöcke und Kandidaten sind belegt, Betrag, Gültigkeit, Varianten- und Zielregeln bleiben offen; der Auftrag ist pausiert. | spätere, gesondert freizugebende EDWALT-Migration | Quellfeldfreigabe, Mapping, Import, Währung, Skala, Vorrang oder Historienregel | 6A-04 bis 6A-11, 6A-16 |
| Q-6A-08 | [`CaseReadModels.cs`](../../src/Cemaris.Application/Cases/CaseReadModels.cs), [`CaseReadService.cs`](../../src/Cemaris.Application/Cases/CaseReadService.cs), [`InMemoryCaseSearch.cs`](../../src/Cemaris.Application/Cases/InMemoryCaseSearch.cs), [`SyntheticCaseReadStore.cs`](../../src/Cemaris.Infrastructure/ReadModel/SyntheticCaseReadStore.cs), [`EfCaseReadStore.cs`](../../src/Cemaris.Infrastructure/ReadModel/EfCaseReadStore.cs), [`SyntheticReadModelSeeder.cs`](../../src/Cemaris.Infrastructure/ReadModel/SyntheticReadModelSeeder.cs), [`ReadModelEntities.cs`](../../src/Cemaris.Infrastructure/Persistence/ReadModel/ReadModelEntities.cs), [`CemarisDbContext.cs`](../../src/Cemaris.Infrastructure/Persistence/CemarisDbContext.cs), [Initialmigration](../../src/Cemaris.Infrastructure/Persistence/Migrations/20260811110042_InitialReadModel.cs), Folgemigrationen und [Model-Snapshot](../../src/Cemaris.Infrastructure/Persistence/Migrations/CemarisDbContextModelSnapshot.cs) | `TECHNISCHER LESEVERTRAG`: nullable Bescheidnummer, Bescheiddatum, Fälligkeit, festgesetzter Betrag, Währung und nullable Gebührenzeilen; Suche nur nach Bescheidnummer; keine Folgemigration fügt Fachsemantik hinzu. | synthetischer und SQL-basierter MVP-Leseweg | Schreibaggregat, Katalogbezug, Schuldner, Zustand, Historie, Summenregel oder Nummernkreis | 6A-02 bis 6A-13 |
| Q-6A-09 | [`CaseContracts.cs`](../../src/Cemaris.Api/Contracts/CaseContracts.cs), [`SearchCasesRequest.cs`](../../src/Cemaris.Api/Contracts/SearchCasesRequest.cs), lesende Fallendpunkte in [`Program.cs`](../../src/Cemaris.Api/Program.cs), [`cases.ts`](../../src/Cemaris.Web/src/types/cases.ts), [`CaseDetailsPage.tsx`](../../src/Cemaris.Web/src/pages/CaseDetailsPage.tsx), [`SearchPage.tsx`](../../src/Cemaris.Web/src/pages/SearchPage.tsx) sowie zugehörige [Unit-](../../tests/Cemaris.UnitTests/CaseReadServiceTests.cs), [Integrations-](../../tests/Cemaris.IntegrationTests/ReadOnlyCaseEndpointTests.cs), [SQL-](../../tests/Cemaris.IntegrationTests/SqlServerReadModelTests.cs) und Frontendtests | `TECHNISCHER LESEVERTRAG`: API und UI geben vorhandene nullable Fakten aus und suchen Bescheidnummern; es gibt keinen Gebühren-/Bescheid-Schreibendpunkt und keine Capability. | bestehende API-/UI-Kompatibilität und synthetische Tests | fachliche Validierung, Berechnung, Freigabe oder Dokumenterzeugung | 6A-01 bis 6A-14 |

Die technischen Quellen wurden vollständig in den in der 6a-Übergabe
genannten Bereichen geprüft. Die zusätzlichen EDWALT-Dokumente wurden nur als
versionierte Repositoryevidenz ausgewertet; weder EDWALT noch externe
Quellen, Satzungsdateien, Vorlagen, Datenbanken oder User Secrets wurden
geöffnet.

## Grenze des vorhandenen Lesevertrags

Der aktuelle Zustand belegt ausschließlich:

- ein Fall kann null oder mehrere vorläufige Bescheidzeilen lesen;
- eine Bescheidzeile und ihre Gebührenzeilen dürfen unvollständig sein;
- Bescheidnummern sind lesbar und als Suchfilter verwendbar;
- API und UI transportieren nullable Datum-, Betrags- und Währungsfelder;
- synthetischer und EF-Provider projizieren denselben Lesevertrag.

Nicht vorhanden sind ein Domainaggregat, eine Schreiboperation, eine eigene
Policy oder Capability, ein Zahlungspflichtigenbezug, ein Katalog- oder
Regelstandsbezug, Fachrevisionen, Bescheidzustände, spezifische
Auditoperationen, Dokumentartefakte oder Importregeln. Tabellenname,
Spaltenpräzision und synthetische Fixtures sind keine fachliche Entscheidung.

## Entscheidungsmatrix 6A-01 bis 6A-16

| ID | Status | Quellengebundener Befund | Geltungsbereich | Entscheidungsbefugte Rolle/Funktion | Auswirkung auf möglichen 6b-Schnitt | Offene Restfrage |
| --- | --- | --- | --- | --- | --- | --- |
| 6A-01 | `OFFEN` | Nutzung, Stammdatenpflege, manueller Finanzmedienbruch und Lesebedarf sind belegt; keiner der vier Kandidaten ist als erster Produktschritt ausgewählt. | Produktpriorisierung | Projektverantwortung gemeinsam mit fachlich verantwortlicher Friedhofsverwaltung und Finanzprozessverantwortung | blockiert B und C | Soll zuerst Katalogpflege, manuelle Festsetzung, reine Faktenerfassung oder Dokumenterzeugung Nutzen liefern? |
| 6A-02 | `OFFEN` | Altverfahren und Dokumentkonzept nennen Entwurf, Bescheid und Dokument nur als Befund beziehungsweise Vision; eine Rechts- oder Festsetzungswirkung ist nicht bestätigt. | Fach- und Rechtswirkung | fachlich verantwortliche Friedhofsverwaltung und zuständige Rechts-/Satzungsfreigabe | blockiert B und D | Welche Zustände existieren, wodurch entstehen sie und welcher erste Zustand darf geschrieben werden? |
| 6A-03 | `TEILWEISE BESTÄTIGT` | Ein Zahlungspflichtiger wird für die manuelle Finanzbuchung benötigt. E-15 belegt örtlich, dass er nicht mit dem Rechteinhaber gleichgesetzt werden darf. Nur die Rolle Nutzungsrechtsinhaber ist kanonisch bestätigt. | Personen-/Organisationsbezug im örtlichen und allgemeinen Produktkontext | Fachverantwortung mit Rechts- und Datenschutzprüfung | blockiert B | Welche kanonische Rolle trägt die Zahlungspflicht, welche Nachweise gelten und sind mehrere Verpflichtete zulässig? |
| 6A-04 | `OFFEN` | Nummer ist für Suche, Finanzbuchung und spätere Migration bestätigt; Erzeuger, Format, Eindeutigkeit und manuelle Vergabe fehlen. | Nummernkreis und Organisationsprozess | Fachverantwortung mit Finanzprozess- und Organisationsverantwortung | blockiert B und D | Wer vergibt wann welche Nummer in welchem Eindeutigkeitsbereich und wie werden Konflikte behandelt? |
| 6A-05 | `TEILWEISE BESTÄTIGT` | Gebührenarten/-sätze werden fachlich gepflegt; EDWALT-Strukturen belegen nur Altverfahrenskandidaten. Eine Cemaris-Identität, Version, Gültigkeit oder Freigabe ist nicht entschieden. | Gebührenstammdaten | Fachverantwortung und zuständige Rechts-/Satzungsfreigabe; technische Administration nur für Systembetrieb | blockiert C sowie berechnende Teile von B/D | Welche stabile Identität, Bezeichnung, Version, Gültigkeit und Freigabe besitzt eine Position beziehungsweise Ordnung? |
| 6A-06 | `WIDERSPRUCH` | E-18/5C-05 enthält einen ungelösten örtlichen Widerspruch; EDWALT-Varianten besitzen keine bestätigte Gültigkeits- oder Vorrangregel. | örtliche Regelwirkung, Alt- und Korrekturfälle | zuständige Rechts-/Satzungsfreigabe gemeinsam mit Fachverantwortung | blockiert B, C und D | Welches Ereignis wählt welchen Regelstand und wie werden Alt-, Verlängerungs- und Korrekturfälle ohne Rückwirkung behandelt? |
| 6A-07 | `OFFEN` | Altverfahrensfelder und nullable Währungs-/Betragsfelder sind keine Produktregel; Einheiten, Skalen, Steuer und Rundung sind ausdrücklich unbelegt. | Positions- und Zahlenmodell | Fachverantwortung, Rechts-/Satzungsfreigabe und Finanzverantwortung | blockiert B, C und D | Welche Mengen, Einheiten, Preise, Währungen, Steuern, Ermäßigungen, Befreiungen und Rundungen sind zulässig? |
| 6A-08 | `OFFEN` | Die Leseprojektion enthält Gesamt- und Positionsbeträge, aber keine Konsistenz- oder Berechnungssemantik; die EDWALT-Analyse lokalisiert keinen freigegebenen Betragsvertrag. | Festsetzung und Summenbildung | Fach- und Finanzverantwortung mit Rechtsfreigabe | blockiert B und D | Wird berechnet, manuell festgesetzt oder kontrolliert überschrieben, und welche Summenbeziehung ist verbindlich? |
| 6A-09 | `TEILWEISE BESTÄTIGT` | Fälligkeit ist als Finanzbuchungs- und Migrationsdatum erforderlich; E-16 ist nur örtliche Satzungsevidenz, der EDWALT-Feldkandidat keine Importfreigabe. | örtliche Fälligkeit und allgemeines Produktmodell | Rechts-/Satzungsfreigabe, Fach- und Finanzverantwortung | blockiert B und D | Manuelle oder regelbasierte Erfassung; welches Bekanntgabeereignis, welche Kalenderregel und welche Korrekturwirkung gelten? |
| 6A-10 | `TEILWEISE BESTÄTIGT` | Kostenstelle ist Bestandteil der bestätigten manuellen Finanzbuchung; Katalog, Pflege, Gültigkeit und Geltungsbereich sind offen. | Finanzkontierung | Finanz-/Haushaltsverantwortung gemeinsam mit Fachverantwortung | blockiert B und C, soweit Kontierung Teil des Schnitts wäre | Welche Kontierungsinformation benötigt Cemaris, wer pflegt sie und für welchen Zeitraum beziehungsweise Bereich gilt sie? |
| 6A-11 | `OFFEN` | Altverfahrensbeobachtungen und Migrationsausschlüsse belegen, dass Korrektur-/Aufhebungsfälle existieren können; sie definieren keine Cemaris-Operation. | Korrektur- und Rechtsfolgen | Fach-, Rechts- und Finanzverantwortung | blockiert B und D | Wie unterscheiden sich Faktenkorrektur, Änderungsbescheid, Aufhebung, Storno, Erstattung und Neufestsetzung, und welche Revisionen bleiben erhalten? |
| 6A-12 | `TEILWEISE BESTÄTIGT` | Beide Systemrollen dürfen bestätigte Facharbeit ausführen; Formularvorlagen sind administrativ. Operationsrechte, Prüfung, Festsetzung und Funktionstrennung sind nicht entschieden. | Autorisierung und Organisation | Fachverantwortung, Organisations-/Sicherheitsverantwortung und gegebenenfalls Rechtsfreigabe | blockiert B, C und D | Wer darf je Operation erfassen, prüfen, festsetzen, korrigieren, aufheben und freigeben; ist Trennung erforderlich? |
| 6A-13 | `TEILWEISE BESTÄTIGT` | Starke ETags, Atomarität, unveränderliche Fachrevisionen und sparsamer Audit sind bestätigte Produktmechanismen in bestehenden Aggregaten; ihr Gebühren-/Bescheidinhalt und Aggregatschnitt fehlen. | technische Sicherheits- und Fachhistoriengrenze | Fachverantwortung für Revisionsinhalt; Architektur-, Sicherheits- und Datenschutzverantwortung für Mechanismus und Minimierung | blockiert B, C und D | Welche Operation versioniert welches Aggregat, welcher Snapshot ist fachlich nötig und welche Inhalte dürfen nicht in den technischen Audit? |
| 6A-14 | `OFFEN` | Administrative Vorlagenpflege und bedingte DMS-Ablagefähigkeiten sind bestätigt; Dokumentarten, Rechtsinhalte, Versionen, Platzhalter, Formate und Freigabe sind offen. | Dokumenterzeugung und Vorlagen | Fach- und Rechtsfreigabe; Administration für technische Vorlagenpflege; Datenschutz und Betrieb für Verarbeitung | blockiert D; Dokumenterzeugung ist kein zulässiger erster Schnitt | Welche erste Dokumentart ist freigegeben und welche Vorlage, Daten, Ausgabe, Freigabe, Versand- und Aufbewahrungsregel gelten? |
| 6A-15 | `TEILWEISE BESTÄTIGT` | Der aktuelle manuelle Finanzprozess, das führende Finanzverfahren, der fehlende Rückkanal sowie der Ausschluss von Zahlungsstatus und Mahnungen sind bestätigt. Ein späterer Übertragungsvertrag ist offen. | Systemhoheit und Integrationsgrenze | Fach- und Finanzprozessverantwortung; Architektur, Sicherheit und Datenschutz für eine spätere Schnittstelle | blockiert jede Finanzintegration; B dürfte höchstens vorbereitende Fakten tragen | Wo endet Cemaris fachlich, welche Daten dürfen später übertragen werden und wie wird ohne Zahlungsstatus-Rückspiegelung abgestimmt? |
| 6A-16 | `BESTÄTIGT` | Als abstrakte spätere Migrationskategorien sind Bescheidnummer, Gebührenpositionen, festgesetzter Betrag, Fälligkeit und Fallbezug bestätigt; Zahlungsstatus und Mahnungen sind ausgeschlossen. | ausschließlich Migrationsbedarf auf Kategorienebene | Projektverantwortung für den bestätigten Umfang; Fach-, Datenschutz- und Migrationsverantwortung für jedes spätere Mapping | erlaubt nur spätere Planung, keinen 6b-Import | Quellfelder, Zielidentitäten, Varianten, Historie, Qualität, Ausschluss- und Abnahmeregeln bleiben in einem eigenen Gate zu bestätigen. |

`BESTÄTIGT` bei 6A-16 gilt ausschließlich für die genannten abstrakten
Datenkategorien. Es ist weder eine Quellfeld-, Zielmodell-, Mapping- noch
Importfreigabe.

## Variantenvergleich

| Bewertung | Variante A – noch keine Implementierung | Variante B – manuelle kanonische Fakten | Variante C – konfigurierbarer Gebührenkatalog | Variante D – Berechnung, Bescheid und Dokument |
| --- | --- | --- | --- | --- |
| Nutzerwert | verhindert falsche Festsetzungen und bündelt die fachliche Freigabe | könnte den manuellen Finanzprozess später vorbereiten | könnte nicht personenbezogene Stammdaten bereitstellen | verspräche einen Gesamtprozess, dessen Wirkung nicht spezifiziert ist |
| Bestätigte Quellen | vollständige Sicherheits-, Quellen- und Stop-Gate-Grenze | Bedarf an wenigen Finanzbuchungs-/Migrationsdaten und bestehender Leseansicht | fachliche Pflege von Gebührenarten/-sätzen | nur allgemeiner Bedarf an Gebühren, Bescheiden und späterer Dokumentablage |
| Offene Fachwirkung | bleibt sichtbar offen | Schuldner, Zustand, Nummer, Festsetzung, Fälligkeit und Korrektur fehlen | Identität, Version, Gültigkeit, Regelstand und Freigabe fehlen | nahezu alle Regel-, Rechts-, Freigabe- und Vorlagenfragen fehlen |
| Datenschutz | keine neue Verarbeitung | neue personenbezogene Zahlungspflichtigen- und Fallbezüge | überwiegend nicht personenbezogen, aber rechtlich/finanziell wirksame Konfiguration | umfangreiche Personen-, Finanz- und Dokumentinhalte |
| Rollen | keine neue Policy oder Capability | operationsgenaue Rechte und Funktionstrennung offen | fachliche Pflege teilweise, Freigabe und Löschung offen | Erfassung, Prüfung, Festsetzung, Vorlagen- und Dokumentfreigabe offen |
| Persistenz | vorhandene nullable Leseprojektion unverändert | neues kanonisches Aggregat mit Historie nötig; `ReadNotices` ungeeignet | neue versionierte Stammdatenaggregate nötig | mehrere Aggregate, Dokumentartefakte und Prozesszustände nötig |
| Audit | keine neue Auditoperation | Fachrevision und sparsamer Audit je Operation ungeklärt | Änderungs-/Freigaberevision und Audit ungeklärt | durchgängige Nachweise über Festsetzung, Freigabe, Rendering und Ablage ungeklärt |
| Migration | EDWALT-Gebührenauftrag bleibt pausiert | kein Backfill oder Import ohne eigenes Mappinggate | EDWALT-Stammvarianten dürfen keinen Katalog definieren | Dokumente bleiben ausgeschlossen; strukturierte Daten besitzen kein freigegebenes Mapping |
| Providerparität | keine Änderung an Synthetic oder SQL | neue transaktionale Stores und Constraints in beiden Providern nötig | neue versionierte Stores in beiden Providern nötig | zusätzlich Renderer-/DMS-Fehler- und Wiederholungsverträge nötig |
| Testbarkeit | Dokumentmatrix, Links und unveränderter Repositoryzustand prüfbar | fachliche Orakel für Zustände, Nummern, Beträge und Korrektur fehlen | fachliche Orakel für Gültigkeit, Version und Freigabe fehlen | kein belastbares Orakel für Berechnung, Rechtswirkung, Dokument und Ablage |
| Spätere Kompatibilität | maximale Kompatibilität; API, UI und Schema bleiben unverändert | additiver Kern wäre später möglich, darf Altprojektion nicht rückdeuten | additiver Katalog wäre später möglich, darf keine kommunalen Defaults festschreiben | hohes Risiko falscher Kopplung und späterer Datenmigration |
| Gate-Ergebnis | **AUSGEWÄHLT** | **NICHT FREIGEGEBEN** | **NICHT FREIGEGEBEN** | **VERWORFEN** |

## Gate-Entscheidung

Variante A ist ausgewählt. 6A-16 ist nur auf Kategorienebene bestätigt;
sämtliche für B oder C notwendigen Fachentscheidungen sind nicht vollständig
durch zuständige Quellen geschlossen. Technische Bequemlichkeit, bestehende
Tabellen, nullable Felder, synthetische Fixtures, EDWALT-Feldnamen und lokale
Satzungsevidenz ersetzen diese Entscheidungen nicht.

Folgen:

- kein Produktcode, Datenbankschema, API-, UI- oder Laufzeitverhalten wird
  geändert;
- `ReadNotices` und `ReadFeeItems` bleiben vorläufige Read-only-Projektion;
- keine neue Capability, Policy, Fachoperation, Migration oder Dokumentengine;
- keine Rückinterpretation vorhandener oder später migrierter Altzeilen;
- der EDWALT-Gebühren-/Variantenauftrag bleibt pausiert;
- kein neues ADR, weil keine neue Architekturentscheidung freigegeben wurde;
- kein `cemaris-increment-6b-next-step-handoff.md`, weil kein ausführbarer
  6b-Umfang existiert.

## Gebündelte Entscheidungs- und Freigabeliste

Die folgenden Pakete sind gemeinsam und quellenbelegt zu beantworten. Die
genannten Funktionen sind benötigte Entscheidungsfunktionen, keine Behauptung
über bereits benannte Stellen.

1. **Produktnutzen und Rechtszustand (6A-01/02):** ersten Nutzerfall,
   rechtliche Wirkung, Zustände und ersten zulässigen Schreibzustand
   festlegen. Benötigt: Projektverantwortung, fachlich verantwortliche
   Friedhofsverwaltung und Rechts-/Satzungsfreigabe.
2. **Zahlungspflicht und Nummer (6A-03/04):** kanonische Rolle,
   Kardinalität, Nachweis, Nummernerzeuger, Format, Eindeutigkeit und manuelle
   Vergabe entscheiden. Benötigt: Fach-, Rechts-, Datenschutz-, Finanz- und
   Organisationsverantwortung.
3. **Katalog, Regelstand und Zahlen (6A-05 bis 6A-10):** Identität, Version,
   Gültigkeit, Stichtag, Auflösung von E-18/5C-05, Mengen-/Preis-/Steuer-/
   Rundungsregeln, Summenbildung, Fälligkeit und Kontierung bestätigen.
   Benötigt: Fach-, Rechts-/Satzungs- und Finanz-/Haushaltsverantwortung.
4. **Korrektur, Rollen und Nachweis (6A-11 bis 6A-13):** Operationen und
   Rechtsfolgen, Funktionstrennung, ETag-/Aggregatgrenze, Fachrevision,
   Snapshot, Atomarität und datensparsamen Audit festlegen. Benötigt: Fach-,
   Rechts-, Finanz-, Organisations-, Architektur-, Sicherheits- und
   Datenschutzverantwortung.
5. **Dokumentumfang (6A-14):** erste Dokumentart, Vorlagenversion,
   Platzhalter, Ausgabeformat, fachliche/rechtliche Freigabe, Versand,
   Aufbewahrung und temporäre Verarbeitung bestätigen. Benötigt: Fach- und
   Rechtsfreigabe, Administration für technische Vorlagenpflege, Datenschutz
   und Betrieb.
6. **System- und Migrationsgrenze (6A-15/16):** Cemaris-/Finanzverfahrens-
   Hoheit, zulässige spätere Übertragungsdaten, Abstimmung ohne Rückkanal sowie
   getrennte Quell-, Mapping-, Qualitäts- und Abnahmeregeln entscheiden.
   Benötigt: Fach-, Finanz-, Migrations-, Architektur-, Sicherheits- und
   Datenschutzverantwortung.

Erst wenn genau ein kleiner Schnitt durch diese Pakete vollständig getragen
ist, darf ein neues Gate einen kontextlos ausführbaren technischen
6b-Folgeauftrag erstellen. Bis dahin ist Variante A der vollständige und
sichere Abschluss.

## Nachgelagerte Projektpriorisierung

Am 26.08.2026 hat der Projektauftraggeber mit
`USR-2026-08-26-MANUAL-NOTICE-FACTS-PRIORITY` die Empfehlung bestätigt,
manuelle kanonische Bescheid-/Finanzfakten als einzigen nächsten Kandidaten zu
prüfen. Dies beantwortet 6A-01 auf Ebene der Projektpriorisierung, aber noch
nicht gemeinsam mit fachlich verantwortlicher Friedhofsverwaltung und
Finanzprozessverantwortung. Die historische 6a-Matrix und ihre Auswahl von
Variante A bleiben deshalb unverändert.

Die Priorisierung bestätigt insbesondere keine Rechtswirkung, Schuldnerrolle,
Nummerierung, Betrags-/Währungs-/Fälligkeits-/Kontierungsregel, Korrektur,
Rolle, Funktionstrennung, Revision, Audit-, Finanzintegrations- oder
Migrationswirkung. Diese Punkte werden ausschließlich im
[nachgelagerten Freigabegate](../implementation/cemaris-manual-notice-facts-approval-next-step-handoff.md)
anhand 6F-01 bis 6F-10 zuständig entschieden. Vor dessen vollständigem
Abschluss bleibt ein technischer 6b-Auftrag unzulässig.

## Ergebnis des nachgelagerten Freigabegates 6a-F

Das interaktive 6a-F-Gate wurde am 26.08.2026 vollständig ausgeführt. Die
[6F-Entscheidungsakte](manual-notice-financial-facts-decisions.md) und der
[Abschlussnachweis](../implementation/cemaris-manual-notice-facts-approval-completion.md)
dokumentieren den konkretisierten Entwurfskandidaten und die FINANZ+-Grenze.

Die erste Stop-Entscheidung mit Variante A wurde nach zwei gezielten
Ergänzungen aufgelöst. Der Projektleiter übermittelt die benannten Fach-,
Rechts-, Finanz-, Datenschutz-, Sicherheits- und Betriebsfreigaben
ausdrücklich nur für den technischen Development-Piloten mit synthetischen
Daten. Der Nutzungsberechtigte darf lediglich vorgeschlagen werden; die
tatsächliche Zahlungspflichtigenauswahl verlangt eine aktive Bestätigung.
Mehrere eigenständige Entwürfe je Fall besitzen jeweils eine eigene dauerhaft
gesperrte Nummer.

Damit ist für 6a-F Variante B ausgewählt und der
[technische 6b-Auftrag](../implementation/cemaris-increment-6b-next-step-handoff.md)
erstellt. Die ursprüngliche 6a-Entscheidung gegen ein unbestimmtes
Schreibmodell bleibt richtig: 6b beruht ausschließlich auf der späteren
konkreten Freigabe und nicht auf `ReadNotices`, `ReadFeeItems` oder EDWALT.
Gebührenberechnung, Bescheiderzeugung, Rechtswirkung, FINANZ+-Integration,
echte Daten und Migration bleiben gesperrt.
