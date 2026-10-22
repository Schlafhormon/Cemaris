# Betriebsfunktionen und Administration

Schritt 15 überträgt die Betriebsfunktionen des festen Sunrise-Commits
`451ce034863b16502484367044f3e9b65370111a`. Die Anwendung bleibt Python/FastAPI,
React und SQL Server. Es gibt keine neue Migration oder Laufzeitabhängigkeit.

## Administration und Rechte

`/admin/database` zeigt Sicherungszeit, Zeitplan und Aufbewahrungsfrist und
führt manuelle Sicherung bzw. Bereinigung nach dem jeweiligen Quelldialog aus.
`/admin/auditLog` bietet Datumsgrenzen, Datensatzart, Benutzernamensuche,
50er-Seiten, Elternlinks, Typfarben und Vorher-/Nachherwerte. Lange Werte werden
nach 100 UTF-16-Zeichen gekürzt und bleiben im Titel vollständig lesbar;
SQL-NULL und der Text `null` erhalten die Quellanzeige. Texte werden escaped.
Die Anzeigezeit stammt wie in der Quelle aus `logMillis` in der Browserzeitzone.
Die fehlende Auswahl `workOrderStatus` im Quellfilter ist erhalten; solche
Einträge erscheinen weiterhin in der ungefilterten Liste.

Alle folgenden Endpunkte verlangen die unabhängige Administratorrolle; POST
zusätzlich eine gültige Sitzung und `X-CSRF-Token`. Fachänderungsrechte allein
genügen nicht. Bei deaktiviertem Audit sind seine drei Routen nicht verfügbar.

| Cemaris-API | Quellhandler / Verhalten |
| --- | --- |
| GET `/api/admin/database` | `adminGet/database.ts`: letzte Sicherung und Betriebseinstellungen |
| POST `/api/admin/doBackupDatabase` | gleichnamiger Adminhandler: `{success,fileName}` oder `{success:false,errorMessage}`; kein Dateidownload |
| POST `/api/admin/doCleanupDatabase` | gleichnamiger Adminhandler: `inactivatedRecordCount`, `purgedRecordCount` |
| GET `/api/admin/auditLog` | Auditgate für React-Seite und Menü |
| POST `/api/admin/doGetAuditLog` | `auditLogEntries`, `count`, `offset`; Datumsgrenzen inklusive, Typ exakt, Benutzername getrimmt mit SQLite-LIKE-Semantik |
| POST `/api/admin/doPurgeAuditLog` | gültige Alter `thirtyDays`, `ninetyDays`, `oneYear`, `all`; ungültige Auswahl HTTP 400 |

`mainRecordId` gehört zum internen Datensatzleser, wird aber wie im Original
vom Admin-HTTP-Handler nicht weitergegeben. Standardlimit ist 50, negative
Limits sind unbegrenzt, Limit 0 ergibt eine leere Seite mit korrekter Anzahl;
negative Offsets lesen ab Anfang. Stringzahlen werden abgeschnitten.
Nichtendliche, übergroße oder numerisch gebrochene Pagination führt zu HTTP 400
anstelle eines SQL-/SQLite-Fehlers. Benutzernamen erhalten aktive `%`/`_`, ein
literales `[` und ausschließlich ASCII-Groß-/Kleinschreibungsangleichung.

Ein echter gespeicherter Emoji-Name zeigte einen Fehler der bisherigen
NVARCHAR→VARCHAR-Konvertierung: `BIN2_UTF8` verlor dabei Supplementzeichen.
Die gemeinsame Suchhilfe konvertiert jetzt zuerst mit `CS_AS_SC_UTF8` und
wendet danach `BIN2_UTF8` an. Damit bleiben Unicode-Skalare und die binäre
Vergleichssemantik erhalten. Quell- und echte SQL-Fälle prüfen dies.

## Bereinigung

Die 44 geordneten Quellstatements stehen nachvollziehbar in
`cleanup_rules.py`; `operations.py` bindet Benutzer/Zeit und führt sie aus.
Reihenfolge: Arbeitsaufträge, Verträge, Grabstätten, Friedhöfe. Es gibt keinen
automatischen Cleanupjob. Bereinigung und Auditpurge erzeugen selbst keine
neuen Auditzeilen. Auditpurge ist von der Fachbereinigung unabhängig.

Die Grenze der Fachbereinigung lautet `recordDelete_timeMillis <= jetzt −
Tage`. Kinder gelöschter Eltern werden zuerst mit dem aktuellen Benutzer und
**jetzt** inaktiviert. Bei der Standardfrist 60 Tage warten diese Kinder deshalb
weitere 60 Tage. Bei Frist 0 dürfen sie im selben Lauf entfernt werden. Die
Grabstättenkinder werden vor den Grabstätten verarbeitet: Wird eine Grabstätte
erst wegen ihres gelöschten Friedhofs inaktiviert, folgen ihre Kinder erst im
nächsten Lauf. Diese Quellreihenfolge ist erhalten.

| Bereich | Tatsächlich bereinigte Daten |
| --- | --- |
| Arbeitsaufträge | Kommentare, Vertrags-/Grabstättenbezüge, Meilensteine; danach unreferenzierte gelöschte Aufträge, Meilensteinarten und Auftragsarten |
| Verträge | Anhänge, Metadaten, Kommentare, Zusatzfelder; bereits gelöschte Gebühren-/Zahlungszeilen; Verknüpfungen zu alten gelöschten Verträgen; danach unreferenzierte Verträge, Gebühren/Kategorien, Vertragsartfelder/-drucke/-arten |
| Grabstätten | Kommentare/Feldwerte, wegen gelöschtem Friedhof inaktivierte Grabstätten, unreferenzierte alte Grabstätten/Status/Artfelder/Arten |
| Friedhöfe | Anfahrtsrichtungen alter gelöschter Friedhöfe, danach unreferenzierte alte Friedhöfe |

Aktive Vertragsgebühren und Zahlungen bleiben auch an gelöschten Verträgen
aktiv. Beisetzungen und Dienstleistungen werden überhaupt nicht bereinigt.
Ebenfalls unverändert bleiben Bestatter, Benutzer/Einstellungen, Formulare,
Arbeitsauftragsstatus, Beisetzungs-/Dienstleistungs-/Behältnis-/Tiefenkataloge
und AuditLog. `NOT IN` einschließlich der Quell-NULL-Sperren bleibt erhalten.
Vertragsverknüpfungen können bereits verschwinden, obwohl Finanzdaten den
Vertrag noch halten. Es wurde keine zusätzliche Datenlöschregel erfunden.

Bei Anhängen entfernt die Quelle die Zeile nur nach erfolgreichem Löschen der
Datei. Fehlende oder nicht löschbare Dateien halten daher die Zeile und ihren
Vertrag fest. Cemaris beschränkt die Dateipfade zusätzlich auf das konfigurierte
Attachment-Verzeichnis; Pfade außerhalb und aufgelöste Symlinkausbrüche bleiben
unangetastet. Die API gibt keine internen Dateipfade aus.

Die Originalbereinigung lässt drei Elternprüfungen aus: Vertragsdienstleistungen,
Gebühren mit Grabstättenart und Kinder eines Friedhofs. Die ausgeführte Quelle
mit tatsächlich standardmäßig aktiven SQLite-FKs kann deshalb nach Teiländerungen
abbrechen. Cemaris ergänzt für physische Löschungen die eingehenden Schema-FKs
und **behält referenzierte Eltern**. Schema und Fremdschlüssel bleiben aktiv.
Ein Fehler rollt die SQL-Transaktion zurück; im Original gibt es keine globale
Transaktion. Der Zielzeitpunkt ist konsistent für den ganzen Lauf statt eines
neuen Zeitpunkts pro Quellteilbereich. Gleichzeitige Cleanuprequests werden
serialisiert.

Dateisystem und SQL bilden weiterhin keine verteilte Transaktion: Ein bereits
erfolgreiches Unlink kann bei einem späteren SQL-Fehler nicht zurückgerollt
werden. Vor einer Bereinigung SQL und Attachmentbestand gemeinsam sichern;
bei solchem Teilfehler die betroffenen Bytes aus diesem Bestand wiederherstellen.
Ein harter Prozess-/Serverausfall garantiert keinen Abschluss.

Auditpurge verwendet dagegen **streng** `logMillis < Grenze`. 30/90/365 Tage
sind feste Millisekundenintervalle. `all` setzt die Grenze auf jetzt + 1;
Einträge mit zukünftiger Uhrzeit können deshalb erhalten bleiben.

## Konfiguration, Aufgaben und Beenden

| Umgebung | Standard / Wirkung |
| --- | --- |
| `CEMARIS_AUDIT_LOG_ENABLED` | false; Auditmenü, Leser und Writer einschalten |
| `CEMARIS_DISABLE_AUDIT_LOG` | false; nur Writer unterdrücken; alter Alias `DISABLE_AUDIT_LOG=true` unterstützt, exakter Quellwert `true` |
| `CEMARIS_RECORD_DELETE_AGE_DAYS` | 60; nichtnegative ganze Tage |
| `CEMARIS_BACKUP_TASK_ENABLED` | false; explizit eingeschalteter einzelner Sicherungsworker |
| `CEMARIS_BACKUP_HOUR` | 2; lokale API-Hoststunde 0–23 |
| `CEMARIS_BACKUP_DELETE_AGE_DAYS` | 0; Aufbewahrung deaktiviert; positiv nur nach erfolgreicher geplanter Sicherung |
| `CEMARIS_BACKUP_DIRECTORY` | leer; dann SQL-Server-Standardverzeichnis; sonst absoluter Pfad auf dem SQL-Host |
| `CEMARIS_BACKUP_LOCAL_DIRECTORY` | leer; optionales ausdrücklich bereitgestelltes Mount desselben Verzeichnisses für Dateiaufbewahrung |

Sicherung, Wiederherstellung, Rechte und Dateibestände erklärt
[SQL_SICHERUNG.md](SQL_SICHERUNG.md). Es gibt keinen Restoreknopf im Original
und keinen neu erfundenen HTTP-Restore. Die SQL-native Sicherung ersetzt die
SQLite-Dateikopie ausdrücklich. Manuell sichern funktioniert auch bei
abgeschaltetem Zeitplan. Gleichzeitige Sicherungen werden mit einem normalen
Fehlschlag beantwortet; es entsteht keine unbegrenzte Warteschlange.

Beim Start vergleicht der Worker die letzte eigene Sicherung mit 24 Stunden
und holt sie nur bei **mehr** als einem Tag nach. Danach täglicher Lauf zur
konfigurierten Stunde, Minute/Sekunde 0, mindestens sechs Stunden seit Ende des
letzten Versuchs. Auch fehlgeschlagene Versuche setzen diesen Zeitpunkt;
spätere Termine bleiben aktiv. Die SQL-seitig gemessene Zeit seit Backupende
vermeidet die Interpretation einer fremden Hostzeitzone als API-Zeitzone;
SQL-Host-Zeitumstellungen können diese Historienmessung noch um eine Stunde
verschieben. Die UI zeigt den lokalen SQL-Server-Zeitstempel. Historie ist
kein Beleg, dass eine extern entfernte Datei noch vorhanden ist.

Portal- und ConsignO-Jobs aus 13/14 laufen weiterhin mit ihren Quelltakten.
Puppeteer wird wie in 11 beim Image-/Installationsaufbau bereitgestellt, ohne
Browserdownload bei jedem API-Start. Uvicorn übernimmt SIGINT/SIGTERM und
den Requestabschluss; der FastAPI-Lebenszyklus stoppt alle drei Worker vor
Enginefreigabe und sendet ntfy-Shutdown. Die SQL-Sicherung hat zusammen mit
VERIFYONLY eine 300-Sekunden-Frist; ihr Stop wartet bis 305 Sekunden. Compose
hat dafür 370 Sekunden Stopfrist, der Backup-Webproxy ebenfalls 370 Sekunden.
Dieser Docker-/Nginx-Laufnachweis ist noch offen. Ein harter Kill beendet diese
Garantie. Keine öffentliche Shutdownaktion wurde ergänzt.

Die 69 Quell-Konfigurationsschlüssel sind wie folgt zugeordnet:

| Quellgruppe | Ziel / technische Zuordnung |
| --- | --- |
| Login, Domain, Rollen, Testmodus, Cookie, Keepalive, Sitzungsdauer, Forwarding, Rate-Limit | `AuthSettings`, Auth-/Benutzerfunktionen aus 03; explizite SQL-URL statt SQLite-Dateinamensumschaltung |
| App-URL | `Settings.app_url`, Kalender/Druck/ConsignO; explizite öffentliche URL statt gecachter Erstrequest-Ableitung mit internem HTTP-Port |
| Name, Logo, Hintergrund | bereitgestelltes Cemaris-Branding, React und Druck; Sunrise-Profilpfade sind keine neue Produktmarke |
| HTTP-Port, maximumProcesses, Workerersatz/IPC, Windows-Service | Uvicorn-Port/Compose, ein autoritativer API-Worker, gemeinsame Python-Zustände statt Node-Cluster/IPC; Compose-Neustart statt `node-windows`/Batchinstallation. Windows-Service-Installer gehört nicht zum festgelegten Ubuntu-Ziel |
| session.secret | entfällt technisch bei zufälligem opakem Sitzungscookie und serverseitigem Dateispeicher |
| Kompression/ETag | API sendet derzeit weder komprimierte Antworten noch ETags; Webproxy/Static-Cache sind Plattformkonfiguration. Quellschalter ersetzen keine geprüfte Proxykonfiguration |
| URL-Präfix | `CEMARIS_URL_PREFIX` gilt für Vite/Nginx/Python; Routing, Cookiepfade, APIs, Dateien, Druck und Redirects sind in 16 unter Root und `/cemaris` über echten HTTPS-/Nginx-Proxy geprüft; Container/Linux bleiben gesondert offen |
| Customizations, Geo, Bilder, Namenssegmente und includeCemeteryKey | `BurialSiteOptions`/`PrintOptions`, Schritte 06/11 |
| Adresse, Vertragspflichtfelder/-nummer/-ende, Steuern/Druckauswahl | `ContractOptions`/`CatalogOptions`, Schritte 04/07/09/11 |
| Auftragsnummer/Kalenderemail/Drucke | `WorkOrderOptions`, Schritte 10/11 |
| Attachmentpfad/Uploadgröße, PDF-Browser/Disposition | `AttachmentOptions`/`PrintOptions`, Schritt 11 |
| Cleanup, Audit, Backup | `OperationsOptions`/`PreferenceOptions`, dieser Schritt |
| ConsignO, ntfy, Portal, Dynamics GP | jeweilige Optionsklassen aus 13/14; separate SQLAlchemy-GP-URL ersetzt mssqlConfig |

Ontario-/SSM-/Testing-Teilkonfigurationen und `.env`-Debugprofile sind Beispiele
dieser Schlüssel, keine weiteren Fachfunktionen. Ihre kommunalen Koordinaten,
Steuerwerte, Namenssegmente und Drucke bleiben als konfigurierbare Werte möglich;
sie werden nicht ungefragt zur Cemaris-Standardkonfiguration. Der lokale Root-/Unterpfad-/HTTPS-Proxyvergleich und das Deploymentpaket stehen in [Bericht 16](berichte/16.md) und [DEPLOYMENT.md](../DEPLOYMENT.md). Genau ein API-Worker bleibt vorgeschrieben; Docker/Linux-ODBC und Ubuntu sind weiterhin gesonderte Nachweise.

Quellzuordnungen und konkrete Ergebnisse: [Bericht 15](berichte/15.md),
[Funktionsnachweis](UMFANG.md). Die Implementierungszuordnung ist seit 16 vollständig; verbleibende Betriebs-/Livenachweise bleiben dort ausgewiesen.
