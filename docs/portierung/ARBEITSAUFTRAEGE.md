# Arbeitsaufträge, Meilensteine und Kalender

Schritt 10 überträgt `routes/workOrders.ts` sowie die zugehörigen Datenbank-,
Handler-, Seiten- und Browsermodule am festen Sunrise-Commit
`451ce034863b16502484367044f3e9b65370111a`. Der öffentliche Kalenderexport
liegt in der Quelle unter `handlers/apiGet/milestoneICS.ts` und gehört deshalb
bereits zu diesem Schritt. Allgemeine Berichte, Druckrenderer, Anhänge und
externe Benachrichtigungen behalten ihre späteren Aufträge.

## Quellregeln

Arbeitsaufträge besitzen eine Nummer, Art, Beschreibung, ein Eröffnungsdatum,
ein optionales Abschlussdatum und einen unabhängig davon gewählten Status.
Abschluss ändert den Statuskatalogwert nicht. Wiederöffnen entfernt das
Abschlussdatum. Die automatisch erzeugte Nummer verwendet das aktuelle Jahr
und die höchste passende numerische Jahresfolge einschließlich gelöschter
Aufträge; die Standardlänge der Folge ist sechs Stellen. Eine ausdrücklich
angegebene Nummer bleibt erhalten.

Der Browser verhindert das Schließen bei offenen Meilensteinen und bestätigt
Abschluss, Wiederöffnen und Löschung. Der ursprüngliche Schließ-HTTP-Handler
prüft offene Meilensteine dagegen nicht erneut. Ungespeicherte Stammdaten und
die unabhängig gespeicherten Kinddatensätze sind getrennte Zustände.

Verträge und Grabstätten sind eigene Zuordnungen. Die Grabstätte eines Vertrags
bleibt als Vertragsinformation sichtbar; die Vertragszuordnung erzeugt keine
zusätzliche Grabstättenzuordnung. Kommentare haben ein eigenes
Datum und eine Uhrzeit. Meilensteine besitzen Art oder freie Beschreibung,
Termin, optionale Uhrzeit und getrennte Abschlussangaben. Die Quellzeit wird
als HHMM gespeichert, beispielsweise 905 für 09:05.

Bei der Meilensteinanlage bedeutet ein leeres Datum heute; bei einer Änderung
wird ein leeres Datum 0. Eine leere Terminzeit ist NULL und unterscheidet sich
von Mitternacht. Die Abschluss-HTTP-Aktionen verwenden die aktuelle Serverzeit;
sie reichen zusätzliche Abschlussdatums-/Zeitfelder nicht an den Datenbankhelfer
weiter. Der ursprüngliche Datenbankhelfer selbst unterstützt solche Angaben.
Wiederöffnen entfernt die Abschlussangaben.

Die vorhandenen Einstellungen `aliases.workOrderOpenDate` und
`aliases.workOrderCloseDate` gelten in Suche, Auftragsformular und
Vertrags-Auftragsliste. Unveränderte leere Meilensteinfelder werden ausdrücklich
übertragen; beim Öffnen der Zeitdialoge entscheidet der numerische NULL-Wert,
nicht der gemeinsam formatierte Zeitstring `00:00`. Eine ungesetzte Uhrzeit
bleibt dadurch von Mitternacht unterscheidbar.

Die Tagesansicht findet Aufträge mit einem Meilenstein am gewählten Tag und
Aufträge ohne aktive Meilensteine, deren Eröffnungsdatum dem Tag entspricht.
Meilensteine anderer Tage bleiben im gefundenen Auftrag sichtbar. Der
Kalender unterstützt die Quellfilter für leere, gesetzte, aktuelle, kommende
oder verpasste Termine, Einzeltag und Jahr/Monat sowie Artenfilter.
Die ursprünglichen inklusiven Datumsgrenzen und Sortierungen bleiben Teil des
Vergleichs; ein Meilenstein ohne Datum kann als überfällig zählen.

Für den Grabstättenstatus aus einem Arbeitsauftrag gilt ausschließlich das
Arbeitsauftragsrecht. Die vorher in Schritt 06 vorgemerkte Dialogdatei
`public/html/burialSite-editBurialSiteStatus.html` wird genau hier verwendet.
Arbeitsauftragsrechte verleihen keine allgemeine Grabstätten- oder
Vertragsbearbeitung. Katalogpflege bleibt unter dem Administratorrecht aus 04.

## Kalendervertrag

Der iCal-Abonnementpfad lautet wie in Sunrise
`/api/<benutzerbezogener API-Schlüssel>/milestoneICS`. Die Schlüsselprüfung
verwendet die seit Schritt 03 vorhandenen Benutzereinstellungen und die
konfigurierte Anmeldeberechtigung. Eine normale Sitzung ersetzt an diesem
öffentlichen Abonnementpfad keinen Schlüssel. Ein zurückgesetzter Schlüssel
verliert seine Gültigkeit. API-Schlüssel im Abonnementlink sind vertraulich.

Ohne Auftragsfilter gilt das konfigurierbare aktuelle Datumsfenster; mit
`workOrderId` werden alle gesetzten Termine dieses Auftrags exportiert.
`workOrderTypeIds` und `workOrderMilestoneTypeIds` verwenden die originale
kommagetrennte Zahlenliste. Die Kalenderantwort hat den Typ
`text/calendar; charset=utf-8` und den Dateinamen `calendar.ics`.

Die Ereignisüberschrift verwendet die Meilensteinart oder freie Beschreibung,
bei Abschluss ein Häkchen und bei Beisetzungen den ersten Namen mit der Zahl
weiterer Personen. Ereignisse ohne Uhrzeit sind ganztägig; mit Uhrzeit wird das
Ende um eine Stunde der Ortsuhr weitergesetzt. Beschreibung, HTML-Alternativtext, Auftragslink,
Grabstätten, Vertrags-/Beisetzungsangaben, Kategorien, Abschlussstatus,
Erstellungs-/Änderungszeit und Organisator/Teilnehmer gehören zum Export.
Die Produktkennung wird zu Cemaris geändert; Protokollpfad und Dateiformat
bleiben kompatibel. Drucklinks sind Verweise; ihre Renderer folgen in 11.

Die tatsächliche Ausgabe des gesperrten `ical-generator` 11.1.2 weist folgende
erhaltene Besonderheiten auf:

- Ein ganztägiger Termin wird zuerst als lokale Mitternacht konstruiert und
  anschließend als UTC-Datum ausgegeben. In Europe/Berlin wird beispielsweise
  20.10.2026 als `DTSTART;VALUE=DATE:20261019` exportiert. Es gibt dabei kein
  `DTEND`. Das ist ein konkret verglichener Quellfehler.
- Beim Zurückstellen der Uhr kann eine Stunde Ortsuhr zwei reale Stunden
  umfassen; Lücken beim Vorstellen werden wie bei JavaScript `Date` normalisiert.
  Es gilt die Zeitzone des Serverprozesses. Die Originalprobe verwendet
  ausdrücklich Europe/Berlin; Python-Tests verwenden dieselben festen
  Übergänge und funktionieren auch auf einem UTC-Testrechner.
- Ohne Auftragsfilter endet die Kalender-URL auf `/workOrders/undefined`.
  Ereignislinks verwenden weiterhin die korrekte Auftrags-ID.
- Die Quelle erzeugt für jeden Abruf neue Ereignis-UUIDs. Dieses Verhalten
  bleibt erhalten; der Vergleich normalisiert ausschließlich diese UUIDs und
  die gewollte Cemaris-Produktkennung. Zeilenfaltung wird zusätzlich nach
  UTF-8-Bytelänge geprüft.
- HTML verwendet numerische Entities einschließlich getrennter UTF-16-Einheiten
  für Emoji; Parameter verwenden die ursprünglichen Caret-Escapes. Vertrags-
  zuordnungen ohne Beisetzungen erzeugen keinen Organisator. Ohne Verträge ist
  der Erstellungsbenutzer Organisator.

## Umsetzung und Konfiguration

`backend/cemaris/work_orders.py` enthält die SQL-Leser, Schreibtransaktionen,
Auditzuordnung und FastAPI-Routen. `work_order_calendar.py` serialisiert den
Kalender ohne zusätzliche Laufzeitabhängigkeit. `frontend/src/work-orders.tsx`
enthält die React-Seiten und Dialoge; `contracts.tsx` bindet die vorhandenen
Arbeitsaufträge sowie die Auftragsanlage aus der Vertragsbearbeitung ein.
Revision 0001 und alle 41 Tabellen bleiben unverändert.

| API | Verwendung |
| --- | --- |
| `GET /api/work-orders/options`, `/catalogs`, `/new` | Kataloge, Datumsalias, Wochenarbeitszeiten, Anfangswerte und Schreibrecht |
| `GET /api/work-orders`, `POST /api/work-orders/doSearchWorkOrders` | Suche, Filter, Pager und Zähler |
| `GET /api/work-orders/{id}`, `/byWorkOrderNumber/{number}` | Vollständiger Auftrag, Nummernsuche und verknüpfte Datensätze |
| `POST /api/work-orders/do*WorkOrder*` | Sämtliche Quellaktionen aus `routes/workOrders.ts`, einschließlich eigener Tagesansichtsaktionen |
| `POST /api/work-orders/doGetWorkOrderMilestones` | Termin-/Artenfilter und Kalenderdaten |
| `POST /api/work-orders/doGetWorkdayReport` | Tagesansicht mit vollständigen Meilensteinen |
| `POST /api/work-orders/doUpdateBurialSiteStatus` | Statusdialog unter Arbeitsauftragsrecht |
| `POST /api/work-orders/doGetRecordAuditLog` | Optionales Datensatzprotokoll unter Arbeitsauftragsrecht |
| `GET /api/milestoneICS`, `/api/work-orders/ical` | Kalenderdownload mit angemeldeter Sitzung |
| `GET /api/{api_key}/milestoneICS` | Schlüsselgeschütztes Abonnement ohne Browsersitzung |

Zusätzliche REST-Pfade sind in der lokalen OpenAPI-Beschreibung sichtbar.
Leseaktionen benötigen eine Sitzung, Schreibaktionen außerdem CSRF und
`canUpdateWorkOrders`; Administrator-, Vertrags- und Friedhofsrechte verleihen
dieses Recht nicht automatisch. Das gilt auch für Kinddialoge und Tagesaktionen.
Die bestehende Berechtigung `canUpdate` für alle Bereiche wirkt wie bisher.

| Variable | Vorgabe / Quellzuordnung |
| --- | --- |
| `CEMARIS_APP_URL` | Öffentliche absolute HTTP(S)-Adresse, Quelle `application.appUrl`; hinter Reverse-Proxy setzen, damit Ereignis-/Drucklinks keine interne API-Adresse verwenden. Ohne Angabe gilt die Request-Basisadresse. |
| `CEMARIS_WORK_ORDER_NUMBER_LENGTH` | `6`, Quelle `settings.workOrders.workOrderNumberLength` |
| `CEMARIS_WORK_ORDER_CALENDAR_EMAIL_ADDRESS` | `no-reply@127.0.0.1`, Quelle `settings.workOrders.calendarEmailAddress` |
| `CEMARIS_WORK_ORDER_CALENDAR_PRINTS` | JSON-Liste von `[Pfad,Titel]`-Paaren für erkannte Druckverweise; Vorgabe sind `pdf/workOrder` und `pdf/workOrder-commentLog` mit den ursprünglichen Titeln |

Die Druckreferenzpaare ersetzen vorläufig das Zusammenspiel der Quelloption
`settings.workOrders.prints` mit `getPrintConfig`; eine leere Liste unterdrückt
diese Verweise. Vollständige Vorlagenentdeckung und Druckausgabe folgen in 11.
Die beiden Recent-Werte sind bereits vorhandene Anwendungseinstellungen:
`workOrder.workOrderMilestone.recentBeforeDays` (5) und `recentAfterDays` (60).
Wochenarbeitszeiten warnen im Meilensteindialog; sie sind keine neue serverseitige
Sperrregel. `.env.example` und Compose reichen diese Optionen weiter;
die bestehende lokale `.env` wird nicht überschrieben.

## Ausdrückliche technische Unterschiede

- Interner Transport ist JSON statt EJS/Express. Fehler verwenden das gemeinsame
  JSON-Format; fehlende/entzogene API-Schlüssel liefern 401 statt Login-Redirect.
- HTTP-Schreibaktionen verlangen einen aktiven Auftrag und prüfen die Zuordnung
  von Kommentaren/Meilensteinen zum angegebenen Elternauftrag. Ein fremder oder
  gelöschter Elternauftrag kann nicht über eine Kind-ID geändert werden.
  Die isolierten Datenbankhelfer behalten die geprüften Quellsonderfälle für
  Abschluss/Wiederöffnen gelöschter Aufträge und Änderungen gelöschter
  Meilensteine bei. Fremdschlüssel und SQL-Typgrenzen gelten weiterhin.
  Neue Vertrags-/Grabstättenbezüge verlangen außerdem einen aktiven Zieldatensatz;
  die ursprünglichen Suchdialoge bieten ebenfalls aktive Datensätze an.
- Änderungen laufen atomar. Fehler in einer anfänglichen Vertrags-/Meilenstein-
  zuordnung rollen auch den neuen Auftrag zurück. Nicht speicherbare Zahlen,
  Datumsbruchteile und fehlende Pflichtparameter werden kontrolliert abgewiesen.
- Der originale Vertragsdialog übergibt **kein `workOrderStatusId`**; der
  Original-Datenbankhelfer bindet diesen fehlenden Wert unmittelbar und scheitert.
  Cemaris ergänzt im Dialog den ersten Status aus dem Katalog als verborgenes
  Feld. Das entspricht dem Anfangswert der normalen Quellseite `/workOrders/new`
  und ermöglicht den vorgesehenen Ablauf. Der Datenbankhelfer erfindet dagegen
  keinen allgemeinen Status-Default für beliebige unvollständige API-Formulare.
- ID-Antworten sind durchgehend SQL-Ganzzahlen; einige Originalhandler spiegeln
  die als String eingereichte ID. Die fachlichen Identitäten bleiben gleich.
- Kalenderpfade mit und ohne abschließenden Slash liefern unmittelbar die Datei.
  Dadurch bleibt der originale Abonnementlink auch durch den Webproxy nutzbar,
  ohne einen Redirect auf den internen API-Port. `CEMARIS_APP_URL` bildet eine
  öffentliche HTTPS-Adresse und einen vorhandenen Proxy-Pfad in den Exportlinks
  ab; vollständiger Betrieb unter einem URL-Präfix bleibt der Nachweis in 15/16.
- Unicode-/Sortierverhalten und exakte Nummernsuche berücksichtigen die bereits
  dokumentierte SQL-Server-Datensemantik. Die Sortierung erfolgt vor dem Pager
  nach den ursprünglichen binären Textregeln.
- Suchzähler werden wie in der Quelle gruppiert in SQL ermittelt. Leere
  Kindlisten verursachen keine Einzelabfragen; Kalender teilen die pro Auftrag
  gelesenen Bezüge innerhalb eines Abrufs. Das erhält die Ausgabe und vermeidet
  den im Browser beobachteten Timeout bei vielen Aufträgen ohne Unterdaten.
- Im tatsächlichen Windows-Browserlauf scheiterte das atomare Speichern einer
  Sitzung sporadisch mit `WinError 5`. Die bestehende
  gesperrte Schreiboperation wiederholt ausschließlich `PermissionError` bis zu
  sechsmal mit insgesamt höchstens 300 ms Wartezeit. Bei dauerhafter Sperre bleibt
  der alte vollständige Datensatz erhalten und der Fehler wird weitergegeben;
  temporäre Dateien werden entfernt. Die Sitzungssnapshot-Regeln ändern sich
  nicht. Transienter Erfolg und dauerhafter Fehler sind regressionsgeprüft.

## Prüfung

`scripts/reference_work_orders.mjs` führt unveränderte kompilierte Quellkörper
mit isolierter SQLite-Quelldatenbank, fixierter Zeit und kontrollierten
Abhängigkeiten aus. Die verwendeten `utils-datetime`, `object-difference` und
`ical-generator` stammen aus den gesperrten und per SHA-512 geprüften Archiven.
Quellhashes, Eingaben, Ergebnisse und Grenzen liegen in
`backend/tests/fixtures/work-orders-reference.json`. SQLite ist ausschließlich
Quellorakel. Zielprüfungen verwenden eigene entbehrliche SQL-Server-Datenbanken.

Die konkreten Befehle, Zähler und Browserergebnisse stehen im
[Abschlussbericht 10](berichte/10.md), die Einzelzuordnungen im
[Funktionsnachweis](UMFANG.md). Die vollständige Sunrise-Anwendung und deren
Cypress-/Axe-Läufe wurden nicht gestartet; die Cemaris-Browserläufe prüfen den
gebauten React-Code gegen echte API und SQL Server. Docker/Ubuntu bleiben
getrennte ausstehende Nachweise.
