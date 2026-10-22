# Cemaris auf SRV-UBUNTUAPP

Stand: 21.10.2026, nach Produktbereinigung **Version 0.2.0 / Alembic 0003**.
Cemaris läuft unter <http://srv-ubuntuapp.stadtdk.local/cemaris/> auf
SRV-UbuntuApp mit der unveränderten Datenbank `Cemaris` auf SRV-SQL02.

## Git-Stand nach Schritt 19

Stand 22.10.2026: Der vollständige aktuelle Produktstand ist als einzelner
Initial-Commit auf `main`/`origin/main` veröffentlicht. Die vorherige Historie
ist privat als geprüftes Git-Bundle gesichert. [Bericht19](portierung/berichte/19.md)
dokumentiert die Veröffentlichung und Prüfungen. Laufzeitdateien und
nachstehende Image-IDs wurden dabei nicht verändert; kein erneutes Deployment.
Alte Cemaris-Hashes im historischen Abschnitt beziehen sich auf die
archivierte Entwicklungshistorie. GitHub CLI ist für `erik` eingerichtet;
Zugangsdaten gehören nicht in das Repository oder in Protokolle.

## Aktueller Stand nach Schritt 18

Die geprüften Images sind tatsächlich bereitgestellt, API/Web healthy und
Migrationsdienst erfolgreich beendet. SQL-/HTTP-Readiness und reale
Browserabnahme durch Caddy bestanden. Vor-/Nachabgleich bestätigt unveränderte
fachliche Tabellenanzahlen und unveränderte Gebühren-/Zahlungswerte.

| Image | Aktuelle Docker-Image-ID |
| --- | --- |
| `cemaris-api:0.2.0` | `sha256:df75d272625396eedda75f505077e0e7f8e97de7d49d0a8727f8b01154b270f5` |
| `cemaris-web:0.2.0`, Präfix `/cemaris` | `sha256:54c8cd3b5cfe8c4e80a6be5adc52b62cf9e5bce6525489922f5cf047cade659e` |

Deutsch/Euro/deutsche Adressen und Standarddrucke auf A4 sind aktiv.
ConsignO, GP/Diamond, Sunrise-Portal, Find a Grave, ntfy und Sunrise-Hilfe
wurden entfernt. Migrationen 0002/0003 entfernen alte Einstellungen und
erweitern Adressfelder; unberührte Installationsstammdaten sind übersetzt.
Die bisherige Schema-Basis und ungenutzte Altspalten bleiben bestandsverträglich
erhalten. Details und vollständige Prüfergebnisse: [Bericht 18](portierung/berichte/18.md).

Server-.env: `CEMARIS_IMAGE_TAG=0.2.0`, `CEMARIS_ADDRESS_LABELS=de`;
ausgemusterte Integrationsschalter entfernt. Anmeldezugang, URL/Präfix,
Container-/Dateivolumes und Proxy wurden erhalten. Keine neuen fachlichen
Datensätze in der produktiven Datenbank, kein EDWALT-Import. Die bestehenden
synthetischen Datensätze aus Schritt17 bleiben erhalten.

Dateisicherung vor Update:
`backups/20261021T134805Z-9b97608329eb`, Status vollständig, Dateien und
SHA256-Prüfsummen vorhanden, Scope **files-only**. Das Manifest benennt die
vorherigen tatsächlich laufenden Image-IDs. Beide 0.1-Images sind weiterhin
vorhanden. Die SQL-Sicherung wurde nicht zusätzlich ausgelöst oder getestet.

Update-/Start-/Sicherungsbefehle unten bleiben gültig; aktuelle Standardtags
sind 0.2.0. Die Daily-Dateisicherung läuft unverändert um 03:15 Europe/Berlin.
Betriebsgrenzen bleiben: HTTP, nicht zertifikatsgeprüftes SQL-TLS, bestehende
externe SQL-Sicherungsabdeckung bestätigen und Dateiarchive betrieblich
aufbewahren/auslagern. Deshalb keine pauschale Freigabe echter Bestandsdaten.
Keine frühere Integrations-Liveprüfung ist mehr Produktvoraussetzung.

## Historische Erstbereitstellung aus Schritt 17

Die folgenden Angaben dokumentieren ausdrücklich den früheren 0.1-Stand.
Für Version, Produktumfang, Revision, Image-IDs und aktuelle Nachweise gilt
der vorstehende Abschnitt. Serveradressen, private Konfigurationsorte und
Betriebsentscheidungen bleiben gültig, soweit oben nicht aktualisiert.

Stand: 21.10.2026. **Betriebsbereit für den Praxistest** unter
<http://srv-ubuntuapp.stadtdk.local/cemaris/>. Migration, Kataloginitialisierung,
gesunde Compose-Dienste und fachliche Browserabnahme wurden tatsächlich auf
diesem Server ausgeführt. Kein EDWALT-Import, keine fachliche Neugestaltung,
kein Push.

## Festlegungen und Server

- Betreiberentscheidung: zunächst **HTTP**, HTTPS zurückgestellt. Deshalb
  `APP_URL=http://srv-ubuntuapp.stadtdk.local/cemaris`, Präfix `/cemaris`,
  Secure-Cookie aus; HttpOnly und präziser Cookiepfad bleiben aktiv.
- Externer SQL Server **SRV-SQL02.stadtdk.local**, `10.51.192.10:1433`,
  tatsächliche Produktversion **17.0.1125.2**. Ein manuell vom Betreiber
  angelegter Login **CemarisSQL**, eigene neue Datenbank **Cemaris**.
- SQL liefert das automatische `SSL_Self_Signed_Fallback`-Zertifikat.
  Testkonfiguration: `Encrypt=yes;TrustServerCertificate=yes`.
  Der Transport ist verschlüsselt, die Serveridentität wird nicht per
  Zertifikat geprüft. Kein SQL-Dienst wurde umkonfiguriert oder neu gestartet.
- SQL-Sicherung separat auf dem SQL Server: laut Betreiber stündliche
  inkrementelle Sicherung und tägliche Vollsicherung, regelmäßig geprüft.
  **Zusätzliche SQL-Backup-/Restoretests ausdrücklich abgewählt.** Keine
  Backup-/Serverrechte für den Anwendungslogin eingerichtet.
- Ubuntu **26.04.1 LTS**, amd64, vier vCPUs, 15 GiB RAM, 4 GiB Swap,
  zu Beginn ungefähr 50 GiB freier Plattenplatz. `erik` hat Dockerzugang und
  passwortfreies sudo. Docker **29.8.1**, Compose **5.5.1**; Docker autostartet.
- Keine vorherige Cemaris-Arbeitskopie/Installation vorhanden. Keine
  übergeordnete AGENTS.md oder `../README.md` vorhanden. Projekt-AGENTS.md
  und alle beauftragten Übergabedokumente wurden vor Änderungen gelesen.
- Zeitzone der API **Europe/Berlin**, genau **ein Uvicorn-Worker**;
  Uvicorn übernimmt keine Proxyheader und schreibt keine vollständigen
  URL-Zugriffslogs. Optionale Integrationen und interner SQL-Backupjob aus.

Fahrtwerk bleibt auf `127.0.0.1:8080`. Seine vier Container sind gesund,
<http://fahrtwerk.srv-ubuntuapp.stadtdk.local> antwortet weiterhin mit 302.
Fahrtwerk-Dateien, PostgreSQL und dessen Daten wurden nicht verändert.
Cemaris veröffentlicht nur `127.0.0.1:8081`, keinen API- oder SQL-Hostport.

Caddy verwendet das bestehende Hostnetz auf `10.51.192.136:80` und den
Healthcheck `127.0.0.1:2080`. Die vorhandene Caddyfile wurde zuerst privat
unter `.local/deployment/` gesichert. Ergänzt ist der neue Host mit
`/cemaris`-Route, 308-Slashredirect, ersetzten Client-IP-Headern und einer
503-Wartungsantwort bei fehlendem Upstream. Validierung und SIGUSR1-Reload
erfolgten ohne Containerneustart. Die zuvor für den Rootprozess mit
`cap_drop: ALL` unlesbare Caddyfile gehört jetzt `erik:root`, Modus 0640;
so kann Caddy sie auch beim nächsten Start lesen. Die Proxy-Compose-Datei
blieb unverändert. SIGUSR1-Verfahren: [Caddy-Dokumentation](https://caddyserver.com/docs/command-line#signals).

## Versionen und Konfigurationsorte

Arbeitskopie: `/opt/apps/cemaris`. Unveränderter fachlicher Laufzeitstand:
**`4a3127f980bf0b9df86e31ac3b55952e93007458`**. Beide Produktionsimages sind
hier mit den gesperrten Abhängigkeiten gebaut; kein Austausch von Paketen.
Der lokale Folgecommit enthält Betriebsskripte und diese Übergabe.

| Image | Docker-Image-ID |
| --- | --- |
| `cemaris-api:0.1.0` | `sha256:c25cce622550c4b0f341c74b4f946d8461933fbda6b2a85547a312e67e21c875` |
| `cemaris-web:0.1.0`, Buildpräfix `/cemaris` | `sha256:e7a526dafd3a30062878756d3308046efefb2166ae3d8394da748c1a0f8cdd37` |

`cemaris-web-build:0.1.0` und `cemaris-browser-qa:20261021` sind zusätzliche
Build-/Prüfimages, keine laufenden Dienste. Das Browserimage enthält
Playwright; die Produktionsimages wurden dafür nicht verändert.

| Ort | Zweck |
| --- | --- |
| `.env` | Serverkonfiguration und Zugänge, Modus 0600, gitignoriert |
| `.local/deployment/initial-login.txt` | Erstzugang, Modus 0600; Benutzer `administrator`, Kennwort nur lokal nachsehen |
| `.local/deployment/sql-login.json` | Vom Betreiber ausgefüllte SQL-Eingabe, Modus 0600; Import durch `python3 deploy/configure-sql.py`, keine Geheimnisausgabe |
| `.local/deployment/grant-cemaris.sql` | Kennwortfreies DBA-Erstinstallationsskript; verweigert vorhandenes Ziel |
| `/opt/apps/reverse-proxy/Caddyfile` | Aktiver Proxy, Eigentümer `erik:root`, Modus 0640 |
| `customizations/` | Modus 0755, derzeit leer; read only im API-Container |
| Docker-Volume `cemaris_sessions` | Persistente serverseitige Sitzungen, UID/GID 10001 |
| Docker-Volume `cemaris_attachments` | Persistente Attachmentbytes, UID/GID 10001 |
| Docker-Netz `cemaris_default` | Eigenes Netz; exakt Gateway `172.19.0.1` als vertrauenswürdige Proxyquelle |
| `.local/deployment/` | Private Build-/Abnahmeprotokolle und synthetische Browserartefakte, Verzeichnis 0700, gitignoriert |
| `backups/` | Dateisnapshots samt Manifest/SHA256, Verzeichnis 0700, Dateien 0600, gitignoriert |
| `/etc/systemd/system/cemaris-files-backup.{service,timer}` | Installierte tägliche Dateisicherung, Ausführung als erik |

Nach Betreiberentscheidung verworfen: zunächst vorbereitete getrennte SQL-
Migrations-/Backupzugänge. Es gibt keine `.env.migrate`, `.env.backup` oder
Mehrbenutzer-Provisionierung mehr. Für Migration und Laufzeit wird ausschließlich
CemarisSQL verwendet. Er besitzt DML-, CREATE-TABLE- und passende dbo-Schemarechte;
keine sysadmin-/dbcreator-/Sicherungsrolle wurde eingerichtet.

## Start, Update und erste Anmeldung

Vor Erstinstallation wurde der Zugriff auf exakt `Cemaris` mit **null**
dbo-Anwendungstabellen bestätigt. Die anfängliche erzwungene Kennwortänderung
(18488) und fehlende Benutzerzuordnung (4060/HAS_DBACCESS=0) wurden vom Betreiber
korrigiert. Keine System-/Verwaltungsdatenbank war Installationsziel oder Fixture.
Migration ergab **Revision 0001**, **41 Anwendungstabellen** plus Alembictabelle;
Kataloginitialisierung fügte **46** Einträge ein.

Tatsächlich erfolgreich ausgeführte Startbefehle:

```bash
cd /opt/apps/cemaris
python3 deploy/configure-sql.py
docker compose config --quiet
docker compose run --rm --no-deps migrate
docker compose run --rm --no-deps --entrypoint /app/.venv/bin/python api manage.py seed-catalogs
docker compose up -d --wait --wait-timeout 180
docker compose ps --all
docker compose exec api /app/.venv/bin/python manage.py info
docker compose exec api /app/.venv/bin/python /app/deploy/readiness.py --http
curl --fail http://127.0.0.1:8081/healthz
curl --fail http://srv-ubuntuapp.stadtdk.local/cemaris/api/health
```

`migrate` endet mit Status 0. API und Web sind healthy; Web wartet auf die
Readiness der API. Restartpolicy beider Dienste: `unless-stopped`, Docker
automatisch beim Hoststart aktiviert. Kein zusätzlicher API-Worker.

Erste Anmeldung unter obiger Adresse als **administrator**. Kennwort nur
lokal in `.local/deployment/initial-login.txt` nachsehen. Admin- und sämtliche
fachlichen Änderungsrechte sind ausdrücklich gesetzt. Der lokale Plaintext-
Adapter hat keinen eigenen Passwortwechsel: Adapterkennwort in `.env` ändern
und API neu erstellen. Nur die Hinweisdatei zu ändern, ändert kein Kennwort.
`.env` niemals mit `source` ausführen oder mit ungeschütztem `compose config`
ausgeben; für Prüfungen `config --quiet` verwenden.

Updates: zuerst SQL-/Dateisicherung abstimmen, laufende API stoppen, gewünschten
geprüften Commit unter Erhalt der Serverkonfiguration übernehmen. Danach:

```bash
docker compose stop web api
docker compose build --pull
docker compose run --rm --no-deps migrate
docker compose up -d --wait --wait-timeout 180
```

Eine neue Fachmigration benötigt die vorhandenen Migrationsrechte. Kein
`docker compose down --volumes`. Rollback benötigt zum Release passende
SQL-/Dateisicherungen und vorherige Images; keine automatischen Downgrades.

## Sicherung

SQL-Sicherung und deren regelmäßige Prüfung bleiben beim SQL-Betrieb. Keine
zusätzliche SQL-Backup-/Restoreprobe in diesem Auftrag nach entsprechender
Betreiberkorrektur. Der Betreiber muss die Abdeckung der **neuen** Datenbank
Cemaris durch diese Jobs bestätigen. SQL-Ziel und genaue Job-/Aufbewahrungsdetails
wurden nicht geliefert; keine unabhängige SQL-Sicherungsbehauptung.

`python3 deploy/backup-files.py` sichert Attachments, Sessions, Customizations,
`.env`, Compose- und Proxykonfiguration mit Commit, Image-IDs und SHA256.
Ein laufender API-/Webdienst wird kurz angehalten und auch nach einem Fehler
wieder gestartet. Bereits angehaltene Dienste bleiben angehalten. Keine alten
Archive werden überschrieben oder automatisch gelöscht. Das Manifest bezeichnet
den Stand ausdrücklich als **files-only**, SQL-Verifikation bleibt false.

Aktiviert: tägliche Dateisicherung **03:15 Europe/Berlin**, erster regulärer
Lauf über systemd erfolgreich, `Result=success`, `ExecMainStatus=0`:
`backups/20261021T103147Z-94f7e9405789/`. Ein früherer Vorinstallations-
Dateisnapshot ohne SQL/Anwendungsbestand liegt getrennt unter
`backups/20261021T100905Z-f559e8c8700a/`. Der erste reguläre Dateisnapshot
entstand nach Abmeldung und Entfernung des temporären Leserzugangs.

```bash
sudo systemctl start cemaris-files-backup.service
systemctl status cemaris-files-backup.service
systemctl list-timers cemaris-files-backup.timer
sudo journalctl -u cemaris-files-backup.service
```

Wiederholbare Installation der im Repository enthaltenen Units:

```bash
sudo install -m 0644 deploy/cemaris-files-backup.service deploy/cemaris-files-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cemaris-files-backup.timer
```

Für ein vom DBA gemeinsam koordiniertes SQL-/Dateipaar:

```bash
docker compose stop web api
# Jetzt externe SQL-Sicherung auslösen lassen und deren Referenz erhalten.
python3 deploy/backup-files.py --sql-backup-reference '<SQL-Sicherungsreferenz>'
docker compose start api web
```

Eine Referenz allein ist kein Konsistenz- oder Restorebeweis. Die Dateiarchive
liegen lokal auf dem App-Server; keine Offsite-Kopie oder automatische Löschung.
SQL-/Dateistände bei Wiederherstellung anhand der Manifeste und des externen
SQL-Verfahrens zusammen auswählen. Keine bestehenden Ziele überschreiben.

## Tatsächliche Abnahme

| Prüfung | Ergebnis |
| --- | --- |
| Linux-Produktionsimages | Beide erfolgreich gebaut; Python 3.14.2, ODBC 18.7.1.1, Chromium 155.0.8059.79 |
| API-Benutzer/Customizations | UID/GID 10001, Auth-JSON korrekt gelesen, Customizations lesbar und read only gemountet |
| Frontend-Pfadtests im Buildimage | 35 bestanden, keine übersprungen |
| Druck-/Sessiondateitests im kurzlebigen Prüfcontainer | 46 bestanden, keine übersprungen; zusätzliche Testpakete nur im entfernten Prüfcontainer |
| Container-/Linux-ODBC und SQL | Erfolgreicher Anwendungslogin, Migration 0001, 41 Tabellen, 46 Seedzeilen, echte SQL-/HTTP-Readiness |
| Nginx/Envsubst/Unterpfad | Konfiguration und Healthcheck bestanden; Assets/Branding/Sprachdateien/Lizenzen und direkte Detailseiten unter /cemaris; fehlendes Asset 404 |
| Anmeldung/Rollen | Tatsächliches Browserlogin, HttpOnly-Cookiepfad, Adminaktionen, unabhängiger Leser ohne Schreibrecht, fehlendes CSRF abgewiesen, anonymer Druck abgewiesen, Abmeldung |
| Fachliche Datensätze | Neue synthetische Kataloge, Friedhof, Grab, Vertrag, Beisetzung, Gebühren/Zahlung, verknüpfter Auftrag und Meilenstein über echte APIs; SQL-Abgleich jeweils ein zusammenhängender Datensatz |
| Formular/Attachment/Druck/Export | Browser-Vertragsformular gespeichert und neu geladen; Multipartupload und bytegleicher Download; reales EJS-HTML und Chromium-Auftrags-PDF; CSV und schlüsselgeschütztes iCal mit öffentlichem Präfix |
| DE/EN/Browseransicht | Elf zentrale Seiten in beiden Sprachen ohne JavaScriptfehler; Desktop 1440 und Mobil 390 px visuell geprüft, kein horizontaler Dokumentüberlauf; breite Tabellen scrollen intern |
| Persistenz nach Force-Recreate von API und Web | Angemeldete Sitzung ohne erneutes Login, Formularwert, Beziehungen, Attachmentbytes, Druck und Exporte erhalten |
| Client-IP-Kette | Echter Caddy überschreibt Spoofheader, Nginx vertraut nur dem Gateway; untrusted Bridgepeer kann IP nicht vorgeben. Temporäre Diagnoselocation entfernt |
| Dateiarchiv/Volume | Vor späterer Abwahl weiterer Backupprüfungen synthetisches Attachmentarchiv in neues Probevolume zurückgespielt und bytegleich geprüft; Probevolume/Marker entfernt. Kein SQL-Restore |
| Dauerhafte Dateisicherung | Timer aktiviert, regulärer systemd-Lauf erfolgreich; private Archive/Manifest vorhanden, Dienste wieder gestartet |
| Bestandsschutz | Fahrtwerk gesund und HTTP-erreichbar; Caddy weiterhin ohne Containerneustart seit 16.09. |
| HTTPS/zusätzlicher SQL-Restore | Auf Betreiberwunsch zurückgestellt bzw. ausdrücklich nicht ausgeführt |
| Vollständiges Quellinventar erneut prüfen | Nicht erfolgreich erneut ausgeführt: feste Sunrise-Referenz fehlt auf dem App-Server; keine Referenz nachinstalliert |

Synthetische Daten bleiben zur Anschauung erhalten: Friedhof ID 1, Grab ID 1,
Vertrag ID 1/Nummer **2026000001**, Auftrag ID 1/Nummer **2026000001**, Anhang
ID 1. Namen tragen **SYNTHETIC**; Beleg **SYNTHETIC-001** ist keine echte Zahlung.
Der temporäre Leser `qa-reader-20261021` wurde aus dem Adapter entfernt und
seine Sitzung widerrufen. Private Resultate und Aufnahmen unter
`.local/deployment/`, insbesondere `{browser-result,persistence-result,logout-result,proxy-ip-result}.json`,
`contract-{1440,390}.png`, `work-order.pdf`, Migrations-/Seed-/Buildlogs.
Keine API-Antwortstubs oder SQLite-Ersatzdatenbank.

## Verbleibende Punkte

- HTTP und nicht zertifikatsgeprüftes SQL-TLS sind die dokumentierten
  Testbetriebseinstellungen. HTTPS und vertrauenswürdiges SQL-Zertifikat sind
  spätere Betriebsanpassungen.
- Aufnahme von Cemaris in die vorhandene SQL-Sicherung bestätigen;
  keine neue SQL-Backup-/Restoreprobe gemäß Betreiberentscheidung.
- Lokale Dateiarchive benötigen eine betriebliche Aufbewahrungs-/Offsite-Regel.
- Standardwährung, Adresskonventionen und teilweise englische Quelltexte bleiben
  fachlich unverändert. Der kommunale Praxistest ist der nächste Auftrag.
- Optionale Integrationen sind deaktiviert und live ungeprüft. Die bestehenden
  Grenzen zum vollständigen Sunrise-/Firefox-/GPS-Vergleich aus Bericht 16
  bleiben bestehen.
- Erreichbarkeit vom Server und tatsächlichem Browser-Prüfcontainer bestätigt;
  der anschließende Zugriff vom Arbeitsplatz gehört zum Betreiber-Praxistest.
