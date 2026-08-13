# Architektur des einfachen Beisetzungsprozesses

Stand: 13.08.2026

## Geltungsbereich

Inkrement 4b ergänzt die vorläufige Fallakte um einen einfachen,
providerneutralen Beisetzungsprozess. Maßgeblich bleiben die
[Produktentscheidungen](../requirements/burial-process-decisions.md). Der
Pfad verarbeitet ausschließlich synthetische Development-Daten und ist keine
Produktivfreigabe.

## Schichten und Zuständigkeiten

| Schicht | Verantwortung |
| --- | --- |
| Domain | fünf Zustände, genau sieben Übergänge, Pflichtdaten und Datumsordnung |
| Application | Anwendungsfälle, Akteurszuordnung, Zeitgrenze, Dublettenhinweis und typisierte Ergebnisse |
| Prozessstore | eine atomare Mutation für Beisetzung/Person, Grabstellenpromotion, Fallversion und Änderungsnachweis |
| API | eigene Capability und Policy, Cookie/CSRF, starkes `If-Match`, Problem Details und OpenAPI |
| React | Karten, Fortschritt, nächste Aktion, kontrollierte Rückschritte, Dubletten-Zweitschritt und Konflikterhalt |

`BurialProcessService` ist der einzige 4b-Schreibanwendungsfall. Ist
`Features:BurialProcessEditingEnabled` aktiv, werden die alten einfachen
Beisetzungshandler nicht registriert. So kann kein nullable Altvertrag die
neuen Pflicht- und Übergangsregeln umgehen.

## Atomarität und Nebenläufigkeit

Der Vertrag `IBurialProcessStore` führt jede Mutation als unteilbare Operation
aus. Der synthetische Provider teilt mit dem Stammdatenstore eine
prozesslokale Sperre. Vor einer Grabstellenpromotion werden Fallversion,
Referenzen, Zustände und die Eindeutigkeit des Änderungsnachweises geprüft.

Der SQL-Provider verwendet eine serialisierbare EF-Transaktion. Innerhalb
dieser Grenze werden Referenzen und Prozessregeln validiert,
`ReadCases.Version` bedingt erhöht, die Beisetzung beziehungsweise Person
geändert, die neue Grabstelle nötigenfalls monoton angehoben und genau ein
sparsamer `CaseChanges`-Datensatz gespeichert. Ein Fehler beim letzten Schritt
rollt alle vorherigen Schritte zurück. Kein Provider führt automatische
Grabstellenrückstufungen aus.

## Relationaler Vertrag und Altkompatibilität

Migration `20260813134826_AddBurialProcess` ergänzt `ReadBurials` additiv:

| Spalte | Typ | Altzeilen |
| --- | --- | --- |
| `ProcessStatus` | `nvarchar(32)`, nullable | `NULL`, kein geratener Zustand |
| `PlanningDate` | `date`, nullable | `NULL` |
| `GraveSiteId` | `uniqueidentifier`, nullable | `NULL` |

`BurialDate` bleibt der tatsächliche Beisetzungstag. Ein Check-Constraint
begrenzt Statuswerte. Ein gefilterter eindeutiger Index auf
`DeceasedPersonId` gilt nur für Zeilen mit Prozessstatus; dadurch bleiben
Altzeilen lesbar, während 4b höchstens eine Prozessbeisetzung je Person
erzwingt. Der Grabstellen-Fremdschlüssel löscht nicht kaskadierend.

## HTTP-Vertrag

Bei aktiver Capability stehen ein vollständiger Auswahlkontext unter
`GET /api/burial-process/master-data` sowie Endpunkte für Entwurfsanlage,
Faktenkorrektur, genau einen Übergang und ausdrückliche Altzeilenübernahme
bereit. Personenanlage und -korrektur laufen in diesem Modus ebenfalls über
den 4b-Service.

Ein möglicher Dublettentreffer liefert `409` mit dem stabilen Code
`possible-deceased-duplicate` und minimalen Kandidaten. Erst ein erneuter
Request mit `confirmPossibleDuplicate: true` kann nach erneuter Prüfung
schreiben. Fehlendes `If-Match` ergibt `428`, ein ungültiger oder schwacher
ETag `400`, ein veralteter ETag `412` und ein Zustands- oder
Eindeutigkeitskonflikt `409`.

## Sicherheits- und Capability-Grenze

`Features:BurialProcessEditingEnabled` ist versioniert standardmäßig `false`.
Ein Start mit aktiver Capability außerhalb von Development oder mit einem
anderen als dem synthetischen Provider wird abgebrochen. Die Policy
`BurialProcess` erlaubt `Sachbearbeitung` und `Administration`; jede Mutation
verlangt authentifizierte Cookie-Sitzung, CSRF und einen serverseitig
abgeleiteten Akteur. Es gibt keine Audit-API und keine Auditoberfläche.

## Bewusste Grenzen

Keine Uhrzeiten, Terminkollisionen, Ressourcen, Unterlagen, Checklisten,
Umbettung, Storno, Löschung, automatische Nummerierung oder Kapazität,
Fristen, Nutzungsrechte, Gebühren, Dokumente, Winyard, LDAP oder EDWALT-
Integration sind Bestandteil dieser Architektur.
