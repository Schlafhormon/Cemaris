# Cemaris-Implementierungsplan

Nächster Auftrag seit 08.09.2026: [M3a-Übergabe](cemaris-manual-notice-line-items-next-step-handoff.md)
für manuelle Gebührenpositionen, exakte Summen und vollständige DOCX-/PDF-Ausgabe.
Die [Produktantworten](../requirements/manual-notice-line-items-decisions.md) sind
bestätigt; Umsetzung und neue Nachweise stehen aus. M2a ist technisch
abgeschlossen und bereinigt. Frühere „nächste Schritte“ in den folgenden
historischen Inkrementbeschreibungen sind keine erneuten Arbeitsaufträge.

Stand: 08.09.2026

## Aktueller Schwerpunkt

Der [lokale 6c-Prototyp-Praxistest](cemaris-notice-generation-prototype-trial-completion.md)
ist ausgeführt: HTTP- und isolierter Playwright-Browserablauf bis zum echten
LibreOffice-PDF bestätigt; Formularreset und falsche Ladefehlermeldungen korrigiert.
Die [Projektentscheidung vom 07.09.2026](../requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
erlaubt lokale synthetische Entwicklung ohne erneute pauschale Freigabegates.
Die Anmeldung mit einem persistenten lokalen Konto bleibt unbestätigt.
Die [verständliche Beisetzungsauswahl mit Personenname und Grabbezug](cemaris-notice-generation-burial-selection-completion.md)
ist umgesetzt: Referenzzuordnung, fehlende Angaben und identische Beschriftungen
sind regressionsgesichert; der isolierte Browserlauf mit zwei Beisetzungen
prüft die manuelle Auswahl bis DOCX und echtem LibreOffice-PDF.
Die [Roadmap zur ersten alltagstauglichen Version](cemaris-first-operational-version-roadmap.md)
ordnet die verbleibenden Arbeitsabläufe. Der
[manuelle Wiedervorlagenkern](cemaris-manual-case-follow-ups-completion.md) ist umgesetzt:
gemeinsamer Arbeitsvorrat ohne Benutzerzuweisung, fallbezogene Einträge und
historisierte Bearbeitung einschließlich Erledigen, Abbrechen und Wiederöffnen.
95 Unit-, 79 nicht-SQL-Integrations- und 84 Frontendtests sowie der isolierte
Browserlauf mit zwei Cookie-Sitzungen sind bestanden. Der danach ausdrücklich
beauftragte [SQL-Nachweis](cemaris-manual-case-follow-ups-sql-verification.md)
ist ebenfalls bestanden: Migration auf entbehrlichen Testdatenbanken,
Parallelrennen, Rollback und Persistenz nach Anwendungshostwechsel.
Die [M2a-Übergabe](cemaris-manual-usage-right-termination-next-step-handoff.md)
ist gemäß [Abschluss](cemaris-manual-usage-right-termination-completion.md) umgesetzt:
Beendigung, Rücknahme, manuelle Neuvergabe und gemeinsame Korrektur bestehender
Rechtefolgen mit auswählbarer Historie. Der Abschluss enthält die für diesen
Stand neu ausgeführten Regressionen, isolierten SQL- und Browsernachweise.
Die neue Capability bleibt aus. Die fünf bestätigten
[Produktentscheidungen](../requirements/manual-usage-right-termination-decisions.md)
sind der umgesetzte Vertrag.
Frühere Variante-A-Abschlüsse bleiben als Historie
erhalten; sie blockieren diesen Umfang nicht.

Cemaris wird jetzt als eigenständige Fachsoftware inkrementell weitergebaut.
Die breite EDWALT-Migrationsanalyse bleibt nach der reproduzierbar
abgeschlossenen Phase 4 pausiert. Die Projektentscheidung vom 25.08.2026 nimmt
jedoch den strikt nicht personenbezogenen Friedhofsstammdatenpfad wieder auf
und macht `Cemaris_Dev` zur dauerhaften lokalen Development-Datenbank.
Grundlagen sind weiterhin
[ADR-0009](../decisions/ADR-0009-product-development-before-edwalt-import.md)
und ergänzend
[ADR-0017](../decisions/ADR-0017-persistent-local-sql-and-scoped-edwalt-master-data-import.md).

Der vorhandene erste Inkrement ist ein technisch abgeschlossener, aber noch
nicht fachlich oder produktiv freigegebener Read-only-MVP mit:

- gemeinsamer Suche und Detailansicht;
- synthetischem Standardprovider;
- optionalem SQL-Server-Lesemodell und EF-Migration;
- ASP.NET-Core-API, React-Oberfläche sowie Unit- und Integrationstests.

Auch Inkrement 2 ist technisch abgeschlossen. Die standardmäßig deaktivierte
Development-Funktion kann synthetische Fallakten anlegen und Grabstellenbezug,
verstorbene Personen sowie Beisetzungen mit ETag/If-Match ändern. Domain,
Application, prozesslokaler synthetischer Store, SQL-Server-Persistenz, API, React-UI
und automatisierte Tests verwenden denselben Vertrag. Eine Produktivfreigabe
ist damit ausdrücklich nicht verbunden.

Inkrement 3a ist ebenfalls technisch abgeschlossen. Ein providerneutraler
Akteursvertrag liefert dem Fallaktenservice genau einen fest serverseitig
definierten synthetischen Development-Akteur. Falländerung, Version, letzte
Zuordnung und datensparsamer Auditdatensatz werden im synthetischen und im
SQL-Store atomar gespeichert. Detail und Bearbeitung zeigen die letzte
Änderung. Migration und SQL-Parallelität wurden gegen eine temporäre Datenbank
auf `CEMARISDEV` verifiziert. Dies ist weiterhin keine produktive Identität,
Berechtigung oder Freigabe.

Inkrement 3b ist technisch abgeschlossen. Lokale SQL-Konten,
frameworkgehashte Passwörter, sichere Cookie-Sitzungen, Antiforgery,
Security-Stamp-Prüfung und benannte Policies schützen die vorhandenen
Fachoperationen. Beide Rollen dürfen Facharbeit ausführen; ausschließlich
`Administration` verwaltet Benutzer. Der authentifizierte lokale Benutzer wird
atomar als Änderungsakteur gespeichert. Migration und Parallelitätsgrenzen
wurden auf `CEMARISDEV` verifiziert. Datenschutz- und Betriebsfreigabe bleiben
offen.

Inkrement 4 wurde am 13.08.2026 produktseitig verbindlich in 4a und 4b
geteilt. 4a ist gemäß
[Abschlussdokumentation](cemaris-increment-4a-completion.md) technisch
umgesetzt und gegen `CEMARISDEV` verifiziert. Der bewusst einfache
synthetische Beisetzungsprozess ist in
[`burial-process-decisions.md`](../requirements/burial-process-decisions.md)
für 4b abgegrenzt und gemäß
[Abschlussdokumentation 4b](cemaris-increment-4b-completion.md) technisch
umgesetzt. Seine spätere fachliche Vorstellung und Abnahme durch die
Friedhofsverwaltung bleibt erforderlich. Lokale Satzungswerte dienen als
Evidenz, nicht als allgemein fest eingebaute Open-Source-Defaults.

Das Entscheidungsgate 5a ist geschlossen. Inkrement 5b ist gemäß
[Abschlussdokumentation](cemaris-increment-5b-completion.md) als manueller,
historisierbarer Beteiligten-/Nutzungsrechtskern technisch umgesetzt und
gegen `CEMARISDEV` verifiziert. Frist-, Status-, Beendigungs- und
Wiedervorlagenregeln wurden dabei bewusst nicht vorweggenommen. Die
anschließende manuelle Bedienrunde führte ausschließlich zu dokumentierten
Design-, Navigations- und Suchpaginationverbesserungen; sie änderte keine
5b-Fachregel.

Inkrement 5c ist gemäß
[Abschlussdokumentation](cemaris-increment-5c-completion.md) als manuelles und
dokumentarisches Gate abgeschlossen. Die Vorführung bestätigt den 5b-Kern und
liefert vier Bedienbefunde. Die Lebenszyklusfragen bleiben mit Ausnahme der
engen 5b-Enddatumsgrenze und der Trennung lokaler Konfiguration von allgemeinen
Produktmechanismen offen beziehungsweise widersprüchlich. Bestätigter nächster
Umfang ist ausschließlich
[5d](cemaris-increment-5d-next-step-handoff.md): ein fallunabhängiger
Beteiligteneinstieg, responsive Rechteaktionen, konkrete Feldfehler und eine
verständlichere Altprojektionsabgrenzung.

Inkrement 5d ist gemäß
[Abschlussdokumentation](cemaris-increment-5d-completion.md) technisch
umgesetzt. Route und Navigation `Beteiligte`, gemeinsame Party-Komponenten,
responsive Rechteaktionen, direkte Feldfehler sowie die erklärte
Altprojektionsgrenze verwenden ausschließlich vorhandene 5b-Verträge. Der
während der Vorführung reproduzierte erste Schreibfehler nach einem
Identitätswechsel ist als kleiner rein technischer
[5e-Folgeumfang](cemaris-increment-5e-next-step-handoff.md) abgegrenzt.

Inkrement 5e ist gemäß
[Abschlussdokumentation](cemaris-increment-5e-completion.md) technisch
abgeschlossen. Der Frontendadapter verwirft den anonymen Antiforgery-Nachweis
nach erfolgreicher Anmeldung; die unmittelbar folgende Mutation bezieht einen
authentifizierten Nachweis. Backend-, Cookie- und Sicherheitsvertrag blieben
unverändert. Das rein dokumentarische
[5f-Nutzungsrechtslebenszyklus-Entscheidungsgate](cemaris-increment-5f-completion.md)
ist mit Variante A „keine Implementierung“ abgeschlossen. Die technische
Administration hat Open-Source-Nachnutzung und Doberlug-Kirchhain als ersten
kommunalen Kontext mitgeteilt, aber keine Fach- oder Rechtsregel freigegeben.
Der Lebenszykluspfad führte deshalb nur über das dokumentarische
[5g-Kurzentscheidungs- und Freigabegate](cemaris-increment-5g-completion.md).
Dieses ist mangels kommunaler Fach- und Freigabequellen ebenfalls mit Variante
A abgeschlossen. Der Lebenszykluspfad bleibt pausiert. Das dokumentarische
[5h-Auswahlgate](cemaris-increment-5h-completion.md) hat eine deterministische,
serverseitig paginierte Beteiligtenübersicht als fachregelarmen technischen
Kandidaten gewählt. Sie ist gemäß
[5i-Abschluss](cemaris-increment-5i-completion.md) Ende zu Ende umgesetzt. Der
interne datensparsame
[5j-EF-Projektion](cemaris-increment-5j-completion.md) der unveränderten
Beteiligten-Schnellsuche ist ebenfalls abgeschlossen. Der priorisierte Schnitt
[Inkrement 5k](cemaris-increment-5k-completion.md) ist technisch abgeschlossen.
Die lokale `admin`-Kennwortabweichung ist ausschließlich für den bestätigten
isolierten Testbetrieb als Restrisiko akzeptiert: vollständiger
aktueller Development-Funktionsumfang auf dauerhaftem SQL, einmalige
persistente Einrichtung von `admin` und `sach` sowie die datensparsame
Migration ausschließlich der nicht personenbezogenen EDWALT-
Friedhofsstammdaten. Der kleinere Befund zur Abbruchparität bleibt als
technischer Paritätsnachweis enthalten.
Das rein dokumentarische
[Inkrement 6a](cemaris-increment-6a-completion.md) ist mit Variante A „noch
keine Implementierung“ abgeschlossen. Die
[Entscheidungsakte](../requirements/fee-notice-document-decisions.md) trennt
nachgewiesene Gebühren-/Bescheidbedarfe von weiterhin offenen Fach-, Rechts-,
Rollen-, Historien-, Dokument- und Migrationsentscheidungen. Kein zulässiger
6b-Schnitt ist vollständig getragen; der vorhandene Lesevertrag bleibt
unverändert und ein technischer 6b-Auftrag wurde nicht erstellt.
Mit `USR-2026-08-26-MANUAL-NOTICE-FACTS-PRIORITY` hat der
Projektauftraggeber anschließend manuelle kanonische Bescheid-/Finanzfakten
als nächsten Prüfungskandidaten bestätigt. Das rein dokumentarische
[Freigabegate](cemaris-manual-notice-facts-approval-completion.md) ist
nach ergänzender funktionsbezogener Klärung mit Variante B abgeschlossen.
Die bestätigungspflichtige Zahlungspflichtigenauswahl löst 6F-03 auf; die
benannten Fach-, Rechts-, Finanz-, Datenschutz-, Sicherheits- und
Betriebsfreigaben gelten ausschließlich für Development und synthetische
Daten. Der
[technische 6b-Auftrag](cemaris-increment-6b-next-step-handoff.md) ist gemäß
[Abschlussnachweis](cemaris-increment-6b-completion.md) Ende zu Ende
ausgeführt. Der additive manuelle Entwurfskern bleibt rechtlich wirkungslos,
Development-only und von der Altprojektion getrennt.
Das nachgelagerte 6c-Gate hat genau einen Gebührenbescheidentwurf für
Beisetzungsgebühren freigegeben. Der
[technische 6c-Auftrag](cemaris-increment-6c-next-step-handoff.md) ist gemäß
[Abschlussnachweis](cemaris-increment-6c-completion.md) Ende zu Ende
ausgeführt. Benutzerkontaktprofil, unveränderliche Satzungsversionen,
OpenXML-DOCX, gekapselte LibreOffice-PDF-Konvertierung, Temp-Bereinigung,
inhaltsfreier Audit, Capability/Policies, API/OpenAPI und React-UI bleiben
standardmäßig deaktiviert und ausschließlich Development. Das
[Betriebs- und Pilotfreigabegate](cemaris-notice-generation-pilot-release-gate-completion.md)
ist mit Variante A „Stop“ abgeschlossen. Die gewünschte Nutzung von
`Cemaris_Dev` ist als eigens geschaffene kombinierte Development- und
Testpilotumgebung klargestellt und kein Datenbankwiderspruch mehr. Die
[technische Pilot-Readiness](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
hat inzwischen den vollständigen 6b-/6c-Migrationsstand, LibreOffice,
Schriften, reale synthetische Ausgabe sowie Temp-, Prozess- und
Rückfallverhalten bestätigt und zwei reproduzierte 6c-Fehler minimal behoben.
Die danach getrennt ausgeführte
[6c-Betriebsremediation und erneute Pilotneubewertung](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
schließt den technischen Backup-/Restore-Nachweis. Monitoring,
Installationshärtung, Auditbetriebsregeln und zuständige Freigaben bleiben
offen oder teilweise bestätigt; Capability und Aktivierungsauftrag bleiben
aus.

## Verbindliche Entwicklungsregel

„Fertig“ bezeichnet immer einen klar abgegrenzten, Ende-zu-Ende getesteten
Inkrement und niemals die unbelegte Behauptung, die gesamte Fachsoftware sei
fertig. Unbekannte kommunale oder rechtliche Regeln werden nicht geraten.
Technische Erweiterungspunkte dürfen vorbereitet werden; produktive Rechte,
Berechnungen oder Automatismen benötigen eine dokumentierte Fachentscheidung.

## Inkrementfolge

| Reihenfolge | Inkrement | Ergebnis | Freigabegate |
| ---: | --- | --- | --- |
| 1 | Lesende Suche und Detailansicht | technisch umgesetzt | fachliche Abnahme mit kontrolliertem Testbestand später |
| 2 | Schreibende Fallakten-Grundlage | technisch umgesetzt: Grabstellenbezug, Verstorbene und Beisetzungen als manuell erfasste Tatsachen anlegen und ändern; keine Löschung oder Ableitung | erfüllt nur für Development und synthetische Daten; keine Produktivfreigabe |
| 3a | Providerneutrale Änderungszuordnung und Auditgrundlage | technisch umgesetzt und gegen `CEMARISDEV` verifiziert: atomarer Änderungsnachweis und Anzeige der letzten Änderung für den synthetischen Development-Pfad | erfüllt nur für Development und synthetische Daten; keine Produktivfreigabe |
| 3b | Lokale Identität und Berechtigungsgrundlage | technisch umgesetzt und gegen `CEMARISDEV` verifiziert: lokale Konten, sichere Sitzungen, geschützte Fachfunktionen und administrative Benutzerverwaltung | technische Abnahme erfüllt; Datenschutz- und Betriebsfreigabe stehen aus |
| 4a | Friedhofsstruktur und Grabstättenstammdaten | technisch umgesetzt: frei konfigurierbare Hierarchie, Grabarten, Grabstellen, Status und kanonischer Fallbezug | technische Abnahme erfüllt; fachliche Vorstellung/Abnahme folgt |
| 4b | Einfacher Beisetzungsprozess | technisch umgesetzt: Zustandslauf, kontrollierte Korrektur, Dublettenhinweis und atomare Grabstellenkopplung | technische Abnahme erfüllt; fachliche Verwaltungsabnahme bleibt offen |
| 5a | Entscheidungsgate für Personenrollen, Nutzungsrechte, Ruhefristen und Wiedervorlagen | abgeschlossen: Evidenz und bestätigte Produktentscheidungen trennen den manuellen 5b-Kern von offenen Automatiken | keine technische, fachliche oder produktive Freigabe |
| 5b | manueller Beteiligten-/Nutzungsrechtskern | technisch umgesetzt: kanonische Beteiligte, Adress-/Inhaberhistorie, manuelle Rechteänderungen, konfigurierbarer Startbezug sowie nachgelagerte UI-, Navigations- und Suchpaginationverbesserungen | technische Abnahme erfüllt; fachliche Vorstellung, Datenschutz und Betrieb offen |
| 5c | fachliches Abnahme- und Lebenszyklus-Entscheidungsgate | abgeschlossen: synthetische 5b-Vorstellung, priorisiertes Befundprotokoll, 5C-Matrix und bestätigter kleinster Folgeumfang | keine Implementierung offener Frist-, Status- oder Beendigungsregeln |
| 5d | Bedienkorrekturen am 5b-Kern | technisch umgesetzt: fallunabhängiger Beteiligteneinstieg, responsive Rechteaktionen, Feldfehler und verständlichere Altprojektionshinweise | ausschließlich vorhandene 5b-Verträge; keine neue Fachregel |
| 5e | CSRF-Sitzungswechsel stabilisieren | technisch umgesetzt: anonymer Nachweis wird nach erfolgreicher Anmeldung verworfen; erste Mutation bezieht einen frischen Nachweis | vorhandener Backend-/Sicherheitsvertrag unverändert |
| 5f | Nutzungsrechtslebenszyklus-Entscheidungsgate | abgeschlossen mit Variante A: ein manueller Rückgabekandidat untersucht, fehlende Entscheidungen und Freigaben dokumentiert | keine Implementierung; ADR-0016 unverändert |
| 5g | kommunales Kurzentscheidungs- und Freigabegate | abgeschlossen mit Variante A: Produktpräferenzen dokumentiert, aber keine zuständige kommunale Fach- oder Freigabequelle vorhanden | keine Implementierung; ADR-0016 unverändert |
| 5h | fachregelarmes Produktauswahlgate | abgeschlossen mit Variante B: deterministische serverseitig paginierte Beteiligtenübersicht ausgewählt | dokumentarisch; keine Implementierung und keine neue Fachregel |
| 5i | paginierte Beteiligtenübersicht | technisch umgesetzt: additiver Verzeichnisendpunkt, providerseitige stabile Pagination und URL-gebundene Übersicht bei kompatibler Schnellsuche | ausschließlich vorhandene Beteiligten-, Policy- und Providerverträge; keine neue Fachregel |
| 5j | datensparsame kompatible Beteiligten-Schnellsuche | technisch umgesetzt: interne EF-Projektion der vorhandenen Array-Suche ohne Pagination, Limit oder Sortierungsänderung | unveränderter API-, UI-, Policy- und Capability-Vertrag |
| 5k | dauerhafter SQL-Developmentbetrieb und EDWALT-Friedhofsstammdaten | technisch abgeschlossen: alle aktuellen Development-Funktionen auf `Cemaris_Dev`, persistente Konten `admin`/`sach`, synthetische Personen-/Falldaten in SQL und ausschließlich nicht personenbezogener EDWALT-Stammdatenimport; lokale `admin`-Kennwortabweichung im isolierten Testbetrieb akzeptiert | ADR-0017; Development-only; read-only EDWALT-Quelle; exakte Ziel- und Testdatenbanktrennung; keine geratenen Mappings |
| 6a | Gebühren-/Bescheid-Entscheidungsgate | dokumentarisch abgeschlossen: Quellenmatrix, Fragen 6A-01 bis 6A-16 und Variantenvergleich führen zu Variante A „noch keine Implementierung“ | kein technischer 6b-Auftrag; vorhandener nullable Lesevertrag unverändert |
| 6a-F | Freigabegate für manuelle Bescheid-/Finanzfakten | nach ergänzender funktionsbezogener Klärung mit Variante B abgeschlossen: bestätigungspflichtiger Zahlungspflichtiger, mehrere Entwürfe je Fall, Nummernkonfiguration und manueller EUR-Faktenkern | ausschließlich technischer Development-Pilot mit synthetischen Daten; [Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md) |
| 6b | Kanonische manuelle Bescheidentwürfe | [technisch Ende zu Ende umgesetzt](cemaris-increment-6b-completion.md): eigener additiver Entwurfskern, Nummernkonfiguration, Sequenz, Revision/Audit, API/OpenAPI und React-UI | Development-only und synthetisch; kein Dokument, keine Berechnung, keine Rechtswirkung, keine FINANZ+-Integration und keine Migration |
| 6c-Gate | spätere Bescheiderzeugung entscheiden | [nach ergänzender Quellenklärung mit Variante B abgeschlossen](cemaris-notice-generation-decision-gate-completion.md): genau ein Gebührenbescheidentwurf feldgenau bestätigt | [technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md) ausgeführt; weiterhin keine Produktivfreigabe |
| 6c | rechtlich wirkungslosen Gebührenbescheidentwurf erzeugen | [technisch Ende zu Ende umgesetzt](cemaris-increment-6c-completion.md): Benutzerkontakte, Satzungsversionen, sichere OpenXML-DOCX-/LibreOffice-PDF-Erzeugung, Temp-Bereinigung, inhaltsfreier Audit, API/OpenAPI und React-UI; Readiness korrigiert minimal einen verlorenen Parallelitätsslot und die fehlende sichtbare Entwurfskennzeichnung | Development-only, standardmäßig aus; keine Rechtswirkung, Zustellung, Archivierung, Integration oder Migration |
| 6c-Pilot-Readiness | Betriebs- und Pilotfreigabe technisch prüfen und neu bewerten | [vollständig ausgeführt](cemaris-notice-generation-synthetic-pilot-readiness-completion.md): `Cemaris_Dev` und 6b-/6c-Schema read-only bestätigt; reale synthetische LibreOffice-/Druck-zu-Datei-Ausgabe, Fehler-/Timeout-/Abbruchbereinigung und Qualitätsmatrix erfolgreich | erneut Variante A „Stop“: kein Vollbackup/Restore, Monitoring, gehärtete Installationsgrenzen oder zuständige Freigaben; keine Aktivierung, kein Aktivierungsauftrag |
| 6c-Betriebsremediation | Backup/Restore schließen und verbliebene Pilotnachweise neu bewerten | [vollständig ausgeführt](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md): datiertes `COPY_ONLY`-Vollbackup mit Checksum, Verify, Restore ausschließlich auf `Cemaris_Dev_RestoreCheck_20260902`, inhaltsfreie Prüfung und Entfernung nur dieses Ziels | endet mit Variante A und ausgeschalteter Capability; offene Betriebs-/Freigabepunkte, keine systemweite Härtungsänderung, SQL-Testdatenbank oder Aktivierung |
| M1 | Manuelle fallbezogene Wiedervorlagen | [technisch und synthetisch abgeschlossen](cemaris-manual-case-follow-ups-completion.md); [SQL-Folgenachweis bestanden](cemaris-manual-case-follow-ups-sql-verification.md), einschließlich zweier EF-Korrekturen | neue Capability aus; nur entbehrliche SQL-Testdatenbanken verwendet; keine Fristautomatik oder Rechtswirkung |
| M2a | Manueller Nutzungsrechtslebenszyklus | [implementiert und geprüft](cemaris-manual-usage-right-termination-completion.md); isolierter SQL- und Browsernachweis | Beendigung, Rücknahme, manuelle Neuvergabe, atomare Folgekorrektur und Rechteverlauf; Capability aus; keine Fristautomatik oder automatische Grabstellenwirkung |
| 6c+ | weiterer Gebührenausbau und Dokumente | nur nach getrennten vollständigen Entscheidungs- und Freigabegates | Gebühren-/Satzungsberechnung, weitere Dokumentarten, Rechtswirkung, Versand, Korrektur, Datenschutz, Betrieb und Migration |
| 7 | optionale Winyard-Integration und Auswertungen | entkoppelter DMS-Adapter und priorisierte Berichte | Herstellervertrag, Metadaten, Fehler- und Betriebsregeln |
| 8 | übriges EDWALT-Mapping, Import, Probeläufe und Cutover | kontrollierte Bestandsübernahme jenseits des vorgezogenen Friedhofsstammdatenpfads | abgeschlossene Quellregeln, Datenschutz und Zielmapping |

Die Reihenfolge beschreibt den derzeit sichersten Pfad. Kleine vorbereitende
Arbeiten dürfen vorgezogen werden, wenn sie keine offenen Fachentscheidungen
vorwegnehmen. Eine produktive Freigabe erfolgt erst, wenn die jeweiligen
Sicherheits-, Datenschutz-, Betriebs- und Fachgates erfüllt sind.

## Nächster Umsetzungsschritt

Beisetzungsauswahl und
[Wiedervorlagenübergabe](cemaris-manual-case-follow-ups-next-step-handoff.md)
sind abgeschlossen, einschließlich des korrigierten Bescheidpanel-Textes.
Der im [M1-Abschluss](cemaris-manual-case-follow-ups-completion.md) noch offene
[SQL-Nachweis](cemaris-manual-case-follow-ups-sql-verification.md) ist nach
ausdrücklicher Beauftragung bestanden. Auch der
[bestätigte M2a-Schnitt](cemaris-manual-usage-right-termination-completion.md)
einschließlich manueller Neuvergabe und gemeinsamer Folgekorrektur ist abgeschlossen.
Als nächster fachlicher Schritt ist anhand konkreter Alltagsbeispiele ein
begrenzter weiterer M2- oder M3-Ablauf festzulegen; Frist- oder Gebührenregeln
sind damit nicht vorweggenommen. Der
[Produktvertrag M2a](../requirements/manual-usage-right-termination-decisions.md)
enthält die umgesetzten Antworten. Die folgende
Entwicklungshistorie begründet den vorhandenen Funktionsumfang; bereits
ausgeführte 6a-/6b-/6c- und Backup-/Restore-Aufträge nicht wiederholen.

Lokale Konten sind am 13.08.2026 als Standard bestätigt worden. Ein späterer
LDAP-Ausbau soll Konten importieren oder synchronisieren, wird aber nicht im
nächsten Inkrement umgesetzt. `Sachbearbeitung` und `Administration` dürfen
fachliche Daten erfassen und bearbeiten, einschließlich künftiger
Stammdatenpflege. Benutzerverwaltung, administrative Programmkonfiguration
und Formularvorlagen bleiben `Administration` vorbehalten. Vollständige
Auditdaten erhalten keine Cemaris-Oberfläche.

Inkrement 4a ist nach einer Korrekturrunde zur hierarchischen Auswahl auch
manuell im Browser bestätigt. Inkrement 4b ist gemäß
[Abschlussdokumentation](cemaris-increment-4b-completion.md) technisch
abgenommen. Das Entscheidungsgate
[Inkrement 5a](cemaris-increment-5-next-step-handoff.md) ist gemäß
[Abschlussdokumentation](cemaris-increment-5a-completion.md) geschlossen.
Der [manuelle Beteiligten-/Nutzungsrechtskern 5b](cemaris-increment-5b-completion.md)
ist technisch abgeschlossen. Das rein dokumentarische und manuelle
[5c-Abnahme- und Lebenszyklus-Entscheidungsgate](cemaris-increment-5c-completion.md)
ist ebenfalls abgeschlossen. Die ausdrücklich bestätigten
[5d-Bedienkorrekturen](cemaris-increment-5d-completion.md) sind technisch
umgesetzt. Die technische
[5e-CSRF-Sitzungsstabilisierung](cemaris-increment-5e-completion.md) ist
ebenfalls abgeschlossen. Das dokumentarische
[5f-Nutzungsrechtslebenszyklus-Entscheidungsgate](cemaris-increment-5f-completion.md)
und das nachfolgende
[5g-Kurzentscheidungs- und Freigabegate](cemaris-increment-5g-completion.md)
sind mit Variante A abgeschlossen. Automatische Fristberechnung,
Statuswirkung, Beendigung und automatische Wiedervorlagen bleiben offen;
der manuelle M1-Kern ist inzwischen separat umgesetzt. Die im
[5h-Auswahlgate](cemaris-increment-5h-completion.md) gewählte paginierte
Beteiligtenübersicht ist mit
[5i](cemaris-increment-5i-completion.md) technisch umgesetzt. Als nächster
sicherer Schritt wurde die interne SQL-Projektion der kompatiblen
Schnellsuche mit [5j](cemaris-increment-5j-completion.md) umgesetzt. Die durch
ADR-0017 priorisierte
[5k-SQL-/Stammdatenmigration](cemaris-increment-5k-completion.md) ist ebenfalls
technisch abgeschlossen; die lokale Administrationskennwortabweichung ist für
den isolierten Testbetrieb ausdrücklich als Restrisiko akzeptiert.
Der Schreibpfad bleibt Development-only und repositoryseitig standardmäßig
deaktiviert. Auf dem freigegebenen lokalen Arbeitsplatz läuft er nach 5k
mit dem SQL-Provider gegen `Cemaris_Dev`; personenbezogene Testdaten
bleiben synthetisch.

Das
[6a-Entscheidungsgate](cemaris-increment-6a-completion.md) ist ausgeführt. Die
[Entscheidungs- und Freigabeliste](../requirements/fee-notice-document-decisions.md#gebündelte-entscheidungs--und-freigabeliste)
bleibt verbindlich. Die nachgelagerte Projektpriorisierung wählt manuelle
kanonische Bescheid-/Finanzfakten als einzigen Kandidaten. Das
[6a-F-Freigabegate](cemaris-manual-notice-facts-approval-completion.md) ist
vollständig bearbeitet. Nach der ersten Stop-Entscheidung wurden die
funktionsbezogenen Freigaben, die aktive Zahlungspflichtigenbestätigung und
mehrere unabhängige Entwürfe je Fall ergänzend bestätigt.

Inkrement 6b ist gemäß
[Abschluss](cemaris-increment-6b-completion.md) als additiver, rechtlich
wirkungsloser manueller Entwurfskern mit eigener Nummer, Fachrevision, ETag,
Audit und Synthetic-/EF-Providerparität umgesetzt. Die vorhandene nullable
Bescheid-/Gebühren-Leseprojektion blieb unverändert und wird nicht als
Schreibmodell interpretiert. Der nächste zulässige Schritt ist ausschließlich
das [dokumentarische Entscheidungsgate](cemaris-notice-generation-decision-gate-completion.md)
vor einer möglichen späteren Bescheiderzeugung. Es ist nach ergänzender
Quellenklärung mit Variante B abgeschlossen. Der feldgenaue Kandidat und seine
Produktgrenzen stehen in der
[Entscheidungsakte](../requirements/notice-generation-decisions.md). Der
[technische 6c-Auftrag](cemaris-increment-6c-next-step-handoff.md) ist gemäß
[6c-Abschluss](cemaris-increment-6c-completion.md) vollständig umgesetzt. Das
[Betriebs- und Pilotfreigabegate](cemaris-notice-generation-pilot-release-gate-completion.md)
ist inzwischen mit Variante A „Stop“ abgeschlossen. Für die gewünschte
und inzwischen als kombinierte Testpilotumgebung klargestellte
Development-Umgebung mit `Cemaris_Dev` hat die
[Readiness-Neubewertung](cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
das vollständige 6b-/6c-Schema und die reale synthetische Ausgabe technisch
bestätigt sowie zwei reproduzierte Bugs minimal behoben. Die anschließend
getrennt ausgeführte
[6c-Betriebsremediation und erneute Pilotneubewertung](cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
schließt den realen Vollbackup-/Restore-Nachweis auf dem exakten entbehrlichen
Prüfziel. Monitoring, Installationshärtung, Auditbetriebsregeln und zuständige
Freigaben bleiben offen oder teilweise bestätigt. Variante A bleibt deshalb
bestehen; ein Aktivierungsauftrag entstand nicht. Capability, Fach- und
Produktvertrag blieben unverändert.
Berechnung, Rechtswirkung, FINANZ+-Integration, echte Verwaltungsdaten,
Produktivsetzung und Migration bleiben gesondert freizugeben.

## Bewusst nicht mit dem nächsten Inkrement behauptet

- keine Produktivreife oder Freigabe für echte personenbezogene Daten;
- kein abschließendes Cemaris-Fach- oder Datenmodell;
- keine fachliche Berechnung von Ruhe-, Nutzungs- oder Zahlungsfristen;
- keine Gebührenfestsetzung, rechtlich wirksame Bescheiderzeugung oder
  Winyard-Ablage; nur der flüchtige rechtlich wirkungslose 6c-Entwurf ist
  technisch umgesetzt;
- keine Storno-, Lösch-, Umnummerierungs- oder Historienregel;
- kein EDWALT-Import außerhalb der ausdrücklich zugelassenen nicht
  personenbezogenen Friedhofsstammdaten und kein Mapping offener Personen-,
  Fall-, Rechte-, Gebühren- oder Dokumentbereiche.
