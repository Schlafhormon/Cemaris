# Produktentscheidungen zu Friedhofsstruktur und Grabstättenstammdaten

Stand: 25.08.2026

## Zweck und Verbindlichkeit

Dieses Dokument begrenzt Inkrement 4a auf allgemein konfigurierbare
Friedhofs-, Struktur-, Grabarten- und Grabstellenstammdaten. Quelle der
Produktentscheidungen ist `USR-2026-08-13-INCREMENT-4A`, die direkte Antwort
der Projektverantwortung vom 13.08.2026.

Die Entscheidungen sind für einen vollständig synthetischen technischen
Produktinkrement verbindlich. Sie sind noch keine fachliche Abnahme durch die
Friedhofsverwaltung. Sobald Cemaris einen vorstellbaren Stand erreicht, wird
die tatsächliche Friedhofsverwaltung einbezogen; daraus entstehende fachliche
Nachbesserungen werden anschließend kontrolliert umgesetzt.

Cemaris bleibt eine allgemein einsetzbare Open-Source-Anwendung. Die lokale
Friedhofssatzung der Stadt Doberlug-Kirchhain ist eine wichtige
Anforderungsevidenz und ein Konfigurationsbeispiel, aber kein fest
einzubauender Produktkatalog für andere Betreiber.

## Quellen

- `USR-2026-08-13-INCREMENT-4A`: Produktentscheidungen der
  Projektverantwortung;
- `USR-2026-08-25-LOCAL-SQL-MASTER-DATA`: dauerhafte lokale SQL-Datenbank,
  feste Development-Konten und abgegrenzter nicht personenbezogener
  Friedhofsstammdatenimport;
- `Satzung-DK-2023`: `2023_Lesefassung Friedhofsatzung der Stadt
  Doberlug-Kirchhain.pdf`, außerhalb des Repositorys unter
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Satzungen Doberlug-Kirchhain`;
- `INT-008`, `INT-009`, `INT-013`: vorhandene EDWALT-Interviewevidenz zu
  Nutzung, weiterhin unbekanntem Beisetzungsablauf und fachlicher
  Stammdatenpflege.

Die EDWALT-Funktionsanalyse ist nur Orientierung über mögliche Themen. Sie ist
weder Sollprozess noch Zielmodell.

## Lokale SQL- und Migrationsentscheidung vom 25.08.2026

`USR-2026-08-25-LOCAL-SQL-MASTER-DATA` ergänzt den rein synthetischen
4a-Abnahmestand um ein lokales Entwicklungsziel. Die bereits vorhandene
SQL-Datenbank `CEMARISDEV` soll für den Projektverantwortlichen dauerhaft den
Cemaris-Zustand tragen. Diese maschinenbezogene Festlegung wird nicht zum
allgemeinen Open-Source-Default und ist keine Produktivfreigabe.

| ID | Entscheidung | Akzeptanzkern |
| --- | --- | --- |
| `REQ-DEVSQL-001` | Der lokale Cemaris-Standardzustand liegt dauerhaft in `CEMARISDEV`. | Normale Neustarts erhalten Stammdaten, synthetische Fälle und Konten; der prozesslokale synthetische Provider bleibt nur Repository-/Testoption. |
| `REQ-DEVSQL-002` | Alle aktuell umgesetzten Development-Capabilities müssen mit dem SQL-Provider Ende zu Ende funktionieren. | Providerwahl ändert keine Rollen-, ETag-, CSRF-, Atomaritäts- oder Fachverträge; die Development-Grenze bleibt bestehen. |
| `REQ-DEVSQL-003` | Die Konten `admin` und `sach` werden einmalig und dauerhaft angelegt. | `admin` besitzt `Administration`, `sach` besitzt `Sachbearbeitung`; sichere Passwörter kommen aus User Secrets beziehungsweise einem lokalen Secret Store und werden weder eingebaut noch protokolliert oder bei normalen Läufen zurückgesetzt. |
| `REQ-MIG-CEM-001` | Aus EDWALT werden in diesem Schritt ausschließlich nicht personenbezogene Friedhofsstammdaten migriert. | Zulässig sind bestätigte Friedhöfe, Hierarchieebenen, Grabarten, Zuordnungen und Grabstellen; Personen-, Adress-, Rechte-, Vorgangs-, Gebühren-, Notiz- und Dokumentdaten sind ausgeschlossen. |
| `REQ-MIG-CEM-002` | Die EDWALT-Arbeitswurzel wird ausschließlich read-only verwendet. | Quelle ist `C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration`; bestehende Phasen, Quelldateien, Extrakte und Berichte werden nicht verändert. |
| `REQ-MIG-CEM-003` | Unbelegte EDWALT-Semantik wird nicht geraten. | Unklare Feldgrenzen, Hierarchiezerlegung, Beisetzungsform, Aktivstatus, Kapazität, Frist oder Variantenregel verhindern die betreffende Transformation und erscheinen nur datensparsam im Klärungsbericht. |
| `REQ-MIG-CEM-004` | Der Import ist dry-run-fähig, transaktional, wiederholbar und zielgeschützt. | Der aufgelöste Datenbankname muss exakt `CEMARISDEV` sein; wiederholte Läufe erzeugen keine Dubletten, löschen nichts und verändern weder Benutzer noch synthetische Personen-/Falldaten. |
| `REQ-MIG-CEM-005` | Automatisierte Tests bleiben unabhängig von `CEMARISDEV`. | Tests verwenden synthetische Daten beziehungsweise isolierte temporäre SQL-Datenbanken; `CEMARIS_SQL_TEST_CONNECTION_STRING` zeigt niemals auf `CEMARISDEV`. |

`W005`/`W005dm` sind die bestätigte Ausgangsfamilie für Friedhofs- und
Grabartenstammdaten. `W020` darf für Grabstellen ausschließlich über die
bestätigten Strukturbytes des Schlüssels ausgewertet werden. Der Parser darf
die nachfolgenden personenbezogenen Satzbereiche nicht einmal vorsorglich als
Gesamttext dekodieren. Personen- und Falldaten für lokale Bedien- und
Regressionstests bleiben synthetisch, liegen im vorgesehenen Betrieb aber
ebenfalls dauerhaft in SQL.

## Aufteilung des fachlichen Inkrements

- **Inkrement 4a:** Friedhofsstruktur, Grabarten, Grabstellen,
  Aktiv-/Löschgrenzen und kanonische Zuordnung einer Fallakte zu einer
  Grabstelle.
- **Inkrement 4b:** einfacher Beisetzungsprozess mit Planung, Bestätigung,
  Durchführung, Abschluss, kontrollierter Korrektur und den bestätigten
  Beziehungs- und Datumsregeln gemäß `USR-2026-08-13-INCREMENT-4B`.

## Bestätigte Entscheidungen für Inkrement 4a

| ID | Entscheidung | Akzeptanzkern |
| --- | --- | --- |
| `REQ-CEM-001` | Die räumliche Struktur lautet `Friedhof → Bereich → Feld → Reihe → Grabstelle`. | Friedhof und Grabstelle sind verpflichtend; Bereich, Feld und Reihe sind eigenständige optionale Ebenen. |
| `REQ-CEM-002` | Jede Entität besitzt eine unveränderliche serverseitige GUID. | Umbenennungen verändern keine Identität oder Referenz. |
| `REQ-CEM-003` | Ein Friedhof benötigt mindestens einen Namen. | Code, Anschrift und Bemerkung sind optional. |
| `REQ-CEM-004` | Bereich, Feld und Reihe benötigen jeweils eine Bezeichnung. | Code und Bemerkung sind optional; jede Ebene kann ausgelassen werden. |
| `REQ-CEM-005` | Eine Grabstelle benötigt eine Grabnummer und eine Grabart. | Status und optionale Bemerkung gehören zur Grabstelle; eine positive Soll-Kapazität ist optional. |
| `REQ-CEM-006` | Friedhofsname und optionaler Friedhofscode sind systemweit eindeutig. | Bezeichnung beziehungsweise Code untergeordneter Ebenen und Grabnummer sind nur innerhalb ihres konkreten übergeordneten Pfads eindeutig. Gleiche Werte auf verschiedenen Friedhöfen sind zulässig und werden in Pflegeauswahlen durch den vollständigen Kontextpfad unterschieden. Abhängige Auswahlen zeigen nur Werte des gewählten aktiven Pfads. |
| `REQ-CEM-007` | Umbenennungen gelten unmittelbar für alle referenzierenden Ansichten. | Alte Bezeichnungen werden nicht als fachliche Namenshistorie gespeichert. Der vorhandene datensparsame Änderungsnachweis bleibt davon unberührt. |
| `REQ-CEM-008` | Beide Rollen dürfen fachliche Stammdaten aktivieren und deaktivieren. | Deaktivierte Werte bleiben in bestehenden Fällen sichtbar, sind für neue Zuordnungen aber nicht mehr auswählbar. |
| `REQ-CEM-009` | Nur `Administration` darf Stammdaten physisch löschen. | Verwendete oder über untergeordnete Datensätze abhängige Stammdaten dürfen nicht gelöscht, sondern nur deaktiviert werden. Löschkonflikte sind teilwirkungsfrei. |
| `REQ-GTYPE-001` | Der Grabartenkatalog startet ohne kommunal fest eingebaute Werte. | Automatisierte Tests und allgemeine Demonstration verwenden ausschließlich synthetische Grabarten; die maschinenlokale `CEMARISDEV`-Ausnahme darf nach ADR-0017 kontrolliert migrierte kommunale Stammdaten enthalten. |
| `REQ-GTYPE-002` | Grabarten sind fachliche Stammdaten. | `Sachbearbeitung` und `Administration` dürfen den Katalog pflegen; dies ist keine administrative Programmkonfiguration. |
| `REQ-GTYPE-003` | Grabarten können je Friedhof unterschiedlich gelten. | Eine globale Grabart kann einem Friedhof zugeordnet und dort aktiviert oder deaktiviert werden. |
| `REQ-GTYPE-004` | Eine Grabart besitzt Name, optionalen Code, Beisetzungsform, Aktivstatus und optionale Bemerkung. | Beisetzungsform ist genau `Erdbestattung`, `Urnenbeisetzung` oder `Gemischt`. Ruhe- und Nutzungszeiten gehören nicht zu 4a. |
| `REQ-GRAVE-001` | Belegungsstatus und Sperrung sind getrennte Merkmale. | Belegungsstatus ist genau `Frei`, `Reserviert` oder `Belegt`; zusätzlich bestehen `Gesperrt` und eine optionale Sperrbemerkung. |
| `REQ-GRAVE-002` | Statusübergänge erfolgen in 4a ausschließlich manuell. | `Frei → Reserviert/Belegt`, `Reserviert → Frei/Belegt`; `Belegt` wird in 4a nicht wieder frei. Sperren und Entsperren sind statusunabhängig. |
| `REQ-GRAVE-003` | Eine optionale positive Soll-Kapazität darf erfasst werden. | 4a berechnet oder erzwingt noch keine Belegungskapazität. |
| `REQ-GRAVE-004` | Grabnummern werden in 4a manuell eingegeben. | Automatische Nummerierung bleibt bis zu bestätigten Format-, Startwert-, Lücken- und Gültigkeitsregeln aus. |
| `REQ-GRAVE-005` | Neue oder neu verknüpfte Fallakten referenzieren eine kanonische Grabstelle. | Umbenannte Stammdaten erscheinen ohne Kopier- oder Synchronisationslauf unmittelbar in Suche und Detail. Bestehende flache Altzeilen werden nicht geraten oder automatisch zugeordnet. |
| `REQ-DUP-001` | Exakte Strukturdubletten werden verhindert. | Normalisierte Eindeutigkeit wird serverseitig und in SQL innerhalb des jeweiligen Gültigkeitsbereichs durchgesetzt. |

## Rollen- und Änderungsvertrag

- `Sachbearbeitung` und `Administration` verwenden für alle fachlichen
  Stammdatenoperationen die bestehende `MasterData`-Policy.
- Physisches Löschen benötigt eine eigene ausdrücklich
  administrationsbeschränkte Policy; UI-Ausblendung allein genügt nicht.
- Jede Mutation verlangt Cookie-Authentifizierung, Antiforgery und eine
  aktuelle starke Version über ETag/`If-Match` beziehungsweise einen
  gleichwertig konsistenten Vertrag.
- Erfolgreiche Stammdatenänderung, neue Version und datensparsamer
  Änderungsnachweis werden atomar gespeichert. Der Nachweis enthält keine
  vollständigen Vorher-/Nachher-Datensätze und erhält weder API noch UI.
- Fehlgeschlagene, abgelehnte oder konkurrierende Änderungen erzeugen weder
  eine neue Fachversion noch einen erfolgreichen Änderungsnachweis.

## Satzungsevidenz ohne feste Produktvorgabe

Die lokale Friedhofssatzung 2023 nennt in § 12 als Katalogwerte:

1. Reihengrabstätten;
2. Wahlgrabstätten;
3. Urnenreihengrabstätten;
4. Urnenwahlgrabstätten;
5. Urnengemeinschaftsanlagen „Grüne Wiese“;
6. Erdbestattungsgemeinschaftsanlagen „Grüne Wiese“;
7. Urnengemeinschaftsgrabstätten mit Schriftplatte.

Sie belegt außerdem, dass Grabarten und Kapazitätsregeln voneinander
abweichen können. Diese Werte werden nicht als allgemeiner Cemaris-Standard
geseedet. Auch die dort genannten Ruhe- und Nutzungszeiten werden in 4a weder
berechnet noch als allgemeingültige Produktregel hinterlegt.

## Für Inkrement 4b bestätigte Produktentscheidungen

Die folgenden Entscheidungen werden dokumentiert, in 4a aber noch nicht als
Beisetzungsworkflow implementiert:

| ID | Entscheidung | Grenze |
| --- | --- | --- |
| `REQ-BUR-001` | Eine Fallakte darf mehrere Verstorbene und mehrere Beisetzungen enthalten. | Der genaue fachliche Fallbegriff wird bei der Prozessabnahme nochmals geprüft. |
| `REQ-BUR-002` | Jede neue Beisetzung gehört genau zu einer verstorbenen Person und einer Grabstelle. | Bestehende technische Altzeilen mit fehlendem Bezug werden nicht automatisch geraten. |
| `REQ-BUR-003` | Eine verstorbene Person besitzt in diesem Ausbaustand höchstens eine Beisetzung. | Umbettungen bleiben außerhalb von 4b. |
| `REQ-BUR-004` | Beide Rollen dürfen alle fachlichen Beisetzungsschritte ausführen. | Administrative Programmkonfiguration bleibt Administration vorbehalten. |
| `REQ-BUR-005` | Abgeschlossene Angaben dürfen kontrolliert korrigiert werden. | ETag, Akteur und atomarer Änderungsnachweis bleiben verbindlich. |
| `REQ-BUR-006` | Ein fachliches Storno wird nicht implementiert. | Korrektur ersetzt kein später möglicherweise fachlich erforderliches Storno. |
| `REQ-BUR-007` | Datumswerte dürfen keine bestätigten Widersprüche erzeugen. | Sofern Werte vorliegen: Geburt ≤ Tod ≤ ausgeführte Beisetzung; eine ausgeführte Beisetzung liegt nicht in der Zukunft. Ein späterer Planungstermin darf zukünftig sein. |
| `REQ-DUP-002` | Mögliche Personendubletten werden als Hinweis angezeigt. | Exakt gleiche Menschen können existieren; nach ausdrücklicher Bestätigung darf eine zweite Person angelegt werden. Eine unbemerkte Doppelerfassung ist zu verhindern. |

Der am 13.08.2026 bestätigte vollständige technische 4b-Vertrag einschließlich
Statusübergängen, Pflichtangaben, Grabstellenkopplung, Korrektur und
Dublettenbestätigung steht in
[`burial-process-decisions.md`](burial-process-decisions.md).

## Weiterhin offene und nicht zu implementierende Regeln

- weitergehende Prozessvarianten jenseits des für 4b bestätigten einfachen
  Ablaufs;
- Pflichtunterlagen, Checklisten, Ausnahmeentscheidungen und Ressourcen;
- automatische Grabnummern und Nummernkreise;
- automatische Kapazitäts- und Belegungsberechnung;
- Schließung, Entwidmung, Zusammenlegung, Teilung oder Umnummerierung;
- Umbettung, Storno, Nutzungsrechte, Ruhefristen und Wiedervorlagen;
- Gebühren, Bescheide, Dokumenterzeugung, Winyard, LDAP und EDWALT-Import.

## Datenschutz-, Daten- und Freigabegrenze

Die Projektverantwortung teilt mit, dass für den lokalen Einsatz eine
Datenschutzfreigabe vorliegt. Art, Version, Geltungsbereich und verantwortliche
Stelle sind im Repository nicht belegt. Diese Angabe ist nicht auf andere
Open-Source-Betreiber übertragbar.

Der technisch abgeschlossene 4a-Ausgangsstand bleibt standardmäßig
deaktiviert. ADR-0017 erlaubt als nachgelagertes, noch umzusetzendes Inkrement
den lokalen Development-Betrieb mit SQL und ausschließlich den abgegrenzten
nicht personenbezogenen EDWALT-Stammdaten. Für andere Betreiber und vor jeder
produktiven Verarbeitung echter Verwaltungsdaten sind eine eigene
fachliche, datenschutzrechtliche, sicherheitstechnische und betriebliche
Freigabe erforderlich. Solange keine belastbare Aufbewahrungsregel vorliegt,
implementiert Cemaris keine automatische fachliche Löschung oder
Fristberechnung.
