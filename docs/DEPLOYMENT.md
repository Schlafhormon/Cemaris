# Cemaris auf Ubuntu bereitstellen

Stand: Schritt 16, 21.10.2026. Diese Anleitung ist das Deploymentpaket für den
anschließenden Praxistest durch den Projektverantwortlichen. In dieser Session
wurde kein Server eingerichtet und kein Deployment ausgeführt. Die unten
genannten verbleibenden Nachweise bleiben sichtbar.

**Aktualisierung aus der Deploymentsession:** Der tatsächliche Ubuntu-Stand,
erfolgreiche Linux-/SQL-/Browsernachweise und die Betreiberentscheidungen
(HTTP-Praxistest, ein SQL-Login, bestehendes externes SQL-Sicherungsverfahren
ohne zusätzliche Restoreprobe) stehen in [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md).
Diese allgemeine Anleitung dokumentiert weiterhin die vorgesehenen
Standardverfahren; für diesen Server gilt die konkrete Betriebsübergabe.

## Aufbau und Voraussetzungen

Ein Webcontainer mit Nginx liefert den React-Produktionsbuild und leitet die
API-/Druck-/CSV-Pfade an genau **einen** Python-API-Worker weiter. Ein separater
kurzlebiger `migrate`-Dienst führt Alembic vor dem API-Start aus. SQL Server
2019 oder neuer läuft extern. Die API enthält Microsoft ODBC Driver 18,
unixODBC und Chromium sowie die gesperrte Node/EJS-Drucklaufzeit. Die
Fachanwendung und der SQL-Zugriff bleiben Python/FastAPI.

Benötigt werden ein Ubuntu-Server mit ausgehendem Zugriff auf die
Container-/Paketregistries, Docker Engine mit Compose-Plugin, eine dedizierte
Cemaris-Datenbank und SQL-Zugang sowie ein vorhandener HTTPS-Reverse-Proxy.
Docker nach der [offiziellen Ubuntu-Anleitung](https://docs.docker.com/engine/install/ubuntu/)
installieren; anschließend prüfen:

```bash
docker version
docker compose version
```

Die SQL-Serveradresse muss **aus dem Container** erreichbar sein. `localhost`
bezeichnet dort den Container. Windows-integrierte Anmeldung aus der lokalen
Entwicklung ist keine vorbereitete Linux-Anmeldung. Einen dafür bestimmten
SQL-Login mit zertifikatsgeprüftem TLS verwenden. Die Laufzeit benötigt
`CONNECT` zur eigenen Datenbank sowie `SELECT`, `INSERT`, `UPDATE`, `DELETE`
auf deren `dbo`-Tabellen. Migration benötigt zusätzlich `CREATE TABLE` in der
Datenbank und `ALTER`/`REFERENCES` auf `SCHEMA::dbo`, einschließlich Sichtbarkeit
des bestehenden Schemas. Diese DDL-Rechte auf die Migrationsphase bzw. einen
separaten Migrationslogin begrenzen. Die
[Microsoft-Dokumentation](https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-tables-database-engine)
beschreibt die Schema-/Tabellenrechte. Die zusätzlichen Rechte der optionalen
nativen Sicherung stehen in
[SQL_SICHERUNG.md](portierung/SQL_SICHERUNG.md). Cemaris erstellt weder SQL-
Logins noch eine Produktionsdatenbank. Systemdatenbanken werden vom
Deployment-Migrationsskript abgewiesen. Keine vorhandene Verwaltungsdatenbank
als Erstinstallationsziel verwenden.

## Dateien und Konfiguration vorbereiten

Den geprüften Commit auf den App-Server übernehmen und im Checkout arbeiten:

```bash
git clone https://github.com/Schlafhormon/Cemaris.git
cd Cemaris
git checkout <GEPRUEFTER-COMMIT>
umask 077
cp --no-clobber .env.example .env
mkdir -p customizations
chmod 755 customizations
chmod 600 .env
```

`<GEPRUEFTER-COMMIT>` ist durch den tatsächlich übertragenen Commit zu
ersetzen. Ein ausschließlich lokal erzeugter Commit muss zuerst vom Betreiber
auf den Server übertragen werden. Eine bereits vorhandene `.env` erhalten.
Für den API-Benutzer UID/GID 10001 benötigte Customizationsdateien und
Unterverzeichnisse lesbar machen; keine Passwörter in diese Dateien legen.
Das Bindmount ist schreibgeschützt. Ohne zusätzliche Vorlagen darf das
Verzeichnis leer bleiben. Eine optionale `index.js` bleibt administrativer
ausführbarer Code; vorhandene Quellen-/Lizenzhinweise erhalten.

Mindestens folgende Werte in `.env` bearbeiten:

```dotenv
CEMARIS_ENVIRONMENT=production
CEMARIS_DATABASE_URL='mssql+pyodbc://cemaris:URL_ENCODED_PASSWORD@sql.example.invalid:1433/Cemaris?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no'
CEMARIS_APP_URL=https://cemaris.example.invalid
CEMARIS_URL_PREFIX=
CEMARIS_AUTH_TYPE=plainText
CEMARIS_AUTH_CONFIG={"users":{"\\administrator":"EIGENES_LANGES_KENNWORT"}}
CEMARIS_AUTH_COOKIE_SECURE=true
CEMARIS_TIME_ZONE=Europe/Berlin
```

Hostnamen, Datenbankname und Kennwort sind Beispiele. Kennwörter in SQL-URLs
URL-kodieren. Alternativ einen der vorhandenen Authentifizierungsadapter
konfigurieren; [ANMELDUNG.md](portierung/ANMELDUNG.md) beschreibt dessen
Vertrag. Den JSON-Beispielwert ohne zusätzliche äußere Anführungszeichen
übernehmen: Python-dotenv und Compose verarbeiten Backslashes innerhalb
einfacher äußerer Anführungszeichen unterschiedlich. Bei leerer Domain enthält
der konfigurierte Benutzername wie in Sunrise einen führenden Backslash.
Dollar- und Rautezeichen im JSON-Kennwort als `\u0024` bzw. `\u0023` schreiben,
damit Dotenv-Interpolation oder Kommentare den Wert nicht ändern. Es gibt
kein eingebautes Kennwort. Die
Benutzerlisten für Anmeldung, Admin und fachliche Änderungsrechte explizit
pflegen; Benutzer- und Katalogverwaltung anschließend in der Oberfläche
prüfen. Eine Adminrolle schaltet nicht automatisch alle Änderungsrechte frei.

Für einen Unterpfad stattdessen beide Werte konsistent setzen:

```dotenv
CEMARIS_APP_URL=https://verwaltung.example.invalid/cemaris
CEMARIS_URL_PREFIX=/cemaris
```

Der Präfix ist leer für Rootbetrieb. Er besteht sonst aus ASCII-Pfadsegmenten
mit Buchstaben, Ziffern, Punkt, Unterstrich oder Bindestrich; keine `.`-/`..`-
Segmente, Query oder Fragment. Mehrere Segmente sind möglich. Der Präfix
darf keine interne Route oder Assetablage als erstes Segment
verwenden. Reserviert sind, unabhängig von Groß-/Kleinschreibung:
`admin`, `api`, `assets`, `branding`, `burialSites`, `cemeteries`, `contracts`,
`dashboard`, `funeralHomes`, `healthz`, `index.html`, `licenses`, `locales`,
`login`, `print`, `public-internal`, `reports`, `robots.txt`, `src`,
`THIRD-PARTY-NOTICES.txt`, `THIRD_PARTY_NOTICES.md` und `workOrders`.
Diese Namen würden nach dem Entfernen des Präfixes mit internen Pfaden
kollidieren; API, Vite und Nginx-Konfigurationsgenerator weisen sie ab.
`/cemaris` und `/department/cemaris` sind gültige Beispiele. Ein Wechsel
des Präfixes benötigt einen neuen **Webbuild**, weil Vite Asset- und
Anwendungspfade einbaut. Compose gibt denselben Wert an API und Webbuild.
Die öffentliche URL enthält den vollständigen Präfix und kein abschließendes
`/`. Keine zusätzliche Präfixentfernung am äußeren Proxy konfigurieren.

Optionale externe Dienste und geplanter SQL-Backupjob bleiben standardmäßig
aus. Alle Optionen stehen in `.env.example`,
[BETRIEB.md](portierung/BETRIEB.md) und den jeweiligen Integrationsdokumenten.
`CEMARIS_TIME_ZONE` legt die lokale Uhrzeit des API-Containers für Tagesjobs
fest; ohne Wert gilt UTC. Die Datenbank hat ihre eigene SQL-Hostzeit.
Sicherungsverzeichnisse bezeichnen Pfade auf dem SQL-Server, keine lokalen
Dockerpfade. Aufbewahrung bleibt ohne bewiesenes gemeinsames Mount aus.

## Images, Migration und Start

```bash
docker compose config --quiet
docker compose build --pull
docker compose run --rm --no-deps migrate
docker compose run --rm --no-deps --entrypoint /app/.venv/bin/python api manage.py seed-catalogs
docker compose up -d --wait --wait-timeout 180
docker compose ps --all
docker compose exec api /app/.venv/bin/python manage.py info
docker compose exec api /app/.venv/bin/python /app/deploy/readiness.py --http
curl --fail http://127.0.0.1:8080/healthz
curl --fail http://127.0.0.1:8080/api/health
```

Den letzten API-Pfad bei Unterpfadbetrieb ausdrücklich auf `/cemaris/api/health`
anpassen: Shells laden `.env` nicht automatisch als Shellvariablen. `.env`
nicht mit `source` ausführen. `config --quiet` prüft die Konfiguration ohne
Kennwörter auszugeben; `docker compose config` ohne `--quiet` kann sie anzeigen.
Migration und Start erzeugen keine synthetischen Fixtures. `seed-catalogs`
legt die dokumentierten Quellinitialwerte an und kann wiederholt werden;
betriebliche Stammdaten danach über Cemaris pflegen.

Für getrennte Migrationszugänge eine nur für den Betreiber lesbare,
gitignorierte `.env.migrate` mit `CEMARIS_DATABASE_URL` für **denselben**
SQL-Server/Datenbanknamen und einem DDL-berechtigten Login anlegen. Den
Migrationsbefehl dann mit
`docker compose --env-file .env --env-file .env.migrate run --rm --no-deps migrate`
ausführen. Reguläres `up` verwendet anschließend wieder den Laufzeitlogin;
ein bereits aktuelles Schema braucht keine neue DDL. Die Migration im
Abhängigkeitsgraphen bleibt eine zusätzliche Prüfung. `.env.migrate` nicht an
API/Web weitergeben und nicht in Versionsverwaltung oder öffentliche Logs
aufnehmen.

Compose wartet auf erfolgreich beendete Migration und anschließend auf die
API-Bereitschaft, bevor Web startet. Das API-Startskript prüft SQL und die
Migration lesend vor dem Start der Integrationsjobs. Es führt selbst keine
Migration aus. Der Container-Healthcheck verlangt erreichbare HTTP-Liveness
**und** SQL mit passender Alembic-Revision. `/api/health` bleibt ausdrücklich
Prozess-Liveness; `/healthz` prüft nur Nginx. Ein späterer SQL-Ausfall macht den
API-Container unhealthy; Compose startet dadurch allein keinen Container neu.
Die Anwendung soll keine Datenbankausfälle durch Neustartschleifen kaschieren.

Ein fehlerhafter Migrationsjob blockiert den regulären Erststart. Diagnose mit
`docker compose logs migrate api web`; Migration korrigieren und denselben
geprüften Stand erneut starten. Die Deploymentskripte geben keine ODBC-
Verbindungsdetails aus. Keine automatischen Downgrades/Restoreversuche.

## HTTPS-Proxy und ursprüngliche Clientadresse

Compose veröffentlicht ausschließlich `127.0.0.1:8080`. Die API hat keinen
veröffentlichten Hostport. TLS endet am vorhandenen Hostproxy. Der folgende
Ausschnitt gehört in dessen bereits eingerichteten HTTPS-`server`-Block:

```nginx
# Rootbetrieb: location / { ... }
# Unterpfadbetrieb: Slash-Weiterleitung und folgende location verwenden.
location = /cemaris { return 308 /cemaris/$is_args$args; }
location /cemaris/ {
    # Ohne URI-Suffix: den vollständigen /cemaris/-Pfad erhalten.
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_request_buffering off;
    client_max_body_size 0;
    proxy_read_timeout 370s;
}
# API-Schlüssel können in Kalender-/Anbieter-URLs stehen. Entweder für diese
# Anwendung access_log off oder ein Logformat ohne URI/Query konfigurieren.
```

Der Webcontainer akzeptiert `X-Real-IP` nur vom explizit eingestellten
`CEMARIS_TRUSTED_PROXY_CIDR`; Standard ist ausschließlich `127.0.0.1`.
Bei einem Docker-Bridge-Netz kommt der Hostproxy normalerweise über dessen
Gatewayadresse an. Nach dem ersten Start die tatsächliche Adresse bestimmen:

```bash
docker network inspect cemaris_default --format '{{range .IPAM.Config}}{{println .Gateway}}{{end}}'
```

Die tatsächlich verwendete Hostproxyadresse als einzelne IP in `.env` setzen,
beispielsweise `CEMARIS_TRUSTED_PROXY_CIDR=172.18.0.1`, danach
`docker compose up -d --force-recreate web`. Bei einem eigenen Netz/Proxycontainer
dessen genaue Quelladresse verwenden. Kein allgemeines `0.0.0.0/0` setzen.
Ohne korrekte Zuordnung bleibt der Zugriff möglich, aber die Anmeldedrosselung
sieht die Proxyadresse statt der einzelnen Clients. Nachweisen, dass ein vom
Client eingespeistes `X-Forwarded-For`/`X-Real-IP` am äußeren Proxy überschrieben
wird. Das interne Nginx übergibt die geprüfte Adresse als einziges X-Forwarded-For
an die API. Uvicorn selbst akzeptiert keine Proxyheader. Öffentliche absolute
Links stammen aus dem expliziten `CEMARIS_APP_URL`.

Das API-Startskript deaktiviert zusätzlich Uvicorns vollständige URL-
Zugriffslogs, weil Kalenderpfade persönliche API-Schlüssel enthalten. Die
Anwendungs-/Fehlerlogs bleiben aktiv. Gleiches am äußeren Hostproxy beachten.

Das Nginx-Template verwendet die
[offizielle Image-Templateschnittstelle](https://hub.docker.com/_/nginx) und
beschränkt `envsubst` auf die Trusted-Proxy-Variable. Weitere Nginxvariablen
bleiben erhalten. Die Client-IP-Regeln folgen dem
[Nginx-Real-IP-Modul](https://nginx.org/en/docs/http/ngx_http_realip_module.html).

## Persistenz, Sicherung und Updates

| Bestand | Ablage | Sicherung |
| --- | --- | --- |
| Fach-/Auditdaten, Benutzeroptionen, Dateimetadaten | externer SQL Server | native SQL-Sicherung, VERIFYONLY und Restoreprobe |
| Attachmentbytes einschließlich heruntergeladener Signaturdokumente | benanntes Volume `cemaris_attachments` | zusammen mit der SQL-Sicherung |
| serverseitige Sitzungen | benanntes Volume `cemaris_sessions` | bei Neuaufbau kann stattdessen erneute Anmeldung verlangt werden |
| Karten, SVGs, Druckvorlagen und optionale `index.js` | Host `customizations/`, read only in API | Dateien, Rechte und Quellhinweise sichern |
| Betriebszugänge und Konfiguration | Host `.env` | gesondert zugriffsgeschützt sichern |

`docker compose down` erhält die benannten Volumes; `down --volumes` entfernt
sie und gehört nicht zu einem regulären Update. Der feste Composeprojektname
`cemaris` sorgt für stabile Volumennamen; bei bewusst anderem Projektnamen
die tatsächlichen Namen mit `docker volume ls` bestimmen.

Für eine konsistente Sicherung API-Schreibzugriffe und Hintergrundjobs stoppen,
SQL gemäß [SQL_SICHERUNG.md](portierung/SQL_SICHERUNG.md) sichern, dann die
Attachmentbytes sichern. Beispiel für den Dateiteil mit dem bereits gebauten
API-Image und einer vom Betreiber gewählten neuen Archivdatei:

```bash
docker compose stop api
umask 077
mkdir -p backups
chmod 700 backups
docker run --rm --user 0:0 \
  -v cemaris_attachments:/source:ro -v "$PWD/backups:/backup" \
  --entrypoint /app/.venv/bin/python cemaris-api:0.2.0 -c \
  'import tarfile; a=tarfile.open("/backup/attachments.tar.gz", "x:gz"); a.add("/source", arcname="."); a.close()'
(set -o noclobber; tar -czf - .env customizations > backups/configuration.tar.gz)
docker compose start api
```

SQL-Backupdateien liegen auf dem SQL-Host. Das Beispiel legt keine SQL-Sicherung
an; beide Teile müssen zum selben angehaltenen Anwendungsstand gehören.
Vorhandene Archivnamen nicht überschreiben. Die vollständige Wiederherstellung
in eine neue SQL-Datenbank und ein eigenes leeres Attachmentvolume proben,
bevor ein Altbestand ersetzt wird. UID/GID 10001 braucht Schreibzugriff auf
wiederhergestellte Attachment- und Sessionverzeichnisse. Mit einem echten
gespeicherten Upload/Download kontrollieren, dass Metadaten und Bytes passen.

Vor Updates Sicherung erstellen und API stoppen. Dann gewünschten Commit
übernehmen, Images bauen, `migrate` einmal ausführen und erst danach
`docker compose up -d --wait --wait-timeout 180` ausführen. Datenbankmigrationen
gehören zum gleichen Release wie die Images. Rollback erfordert zusammen
passende SQL-/Dateisicherungen und den vorherigen Image-/Konfigurationsstand.
Die API erhält 370 Sekunden Stopfrist, damit laufende Sicherungs-/Integrationsjobs
geordnet enden können. Nicht mit zusätzlichen API-Replikaten skalieren.

## Abnahme auf dem Ubuntu-Server

Nach HTTPS-Start Anmeldung/Abmeldung, beide Sprachen, Rollen und
Client-IP-Drosselung prüfen. Einen synthetischen Friedhof mit Grabstätte,
Vertrag, Beisetzung, Gebühren/Transaktion und Arbeitsauftrag anlegen und nach
Containerneustart wieder öffnen. Attachment hoch-/herunterladen, PDF mit
Umlauten rendern, Karten/SVG und eigene Druckvorlagen prüfen, CSV und iCal
abrufen. Root- bzw. tatsächlich gewählten Unterpfad auch durch direkten
Detailseitenaufruf und Browserneuladen prüfen. Einen SQL-/Attachmentrestore in
einer neuen Probeinstanz sowie die konfigurierte lokale Jobzeit nachweisen.
Altanbindungen sind seit Version 0.2.0 entfernt; es gibt dafür keine Aktivierung mehr.

Linux-Imagebau, Linux-ODBC, Migrationen, Proxy und persistenter Containerbetrieb
wurden auf SRV-UbuntuApp tatsächlich geprüft. Den heutigen Stand und die
bewusst fortbestehenden Betriebseinstellungen beschreibt
[SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md); die Produktabnahme steht in
[Bericht 18](portierung/berichte/18.md). Frühere Portierungsberichte bleiben
historische Nachweise und beschreiben keine heutigen Altintegrationen.

Python/npm-Abhängigkeiten sind gesperrt, Python-/Node-/Nginx-Basisimages sind
mit Digest festgelegt und der ODBC-Treiber hat eine exakte Paketversion.
Chromium und Debian-Systempakete werden aus den jeweiligen Paketquellen
installiert. Der Build ist damit wiederholbar beschrieben, aber kein
bitidentischer eingefrorener APT-Snapshot. Images nach erfolgreichem
Ubuntu-Build zusammen mit Commit und Image-IDs dokumentieren/archivieren.


## Aktualisierung von 0.1 auf 0.2

Beide Images tragen standardmäßig `0.2.0` (`CEMARIS_IMAGE_TAG` überschreibt
beide gemeinsam). Vorherige Images für einen kontrollierten Rückweg behalten.
Migrationen 0002/0003 laufen wie üblich vor dem API-Start: alte ConsignO-
Zugangsdaten und der Portalsynchronisationsfehler werden entfernt, Ort und
Bundesland auf 100 Einheiten erweitert und unberührte Installationsstammdaten
übersetzt. Zahlenwerte von Gebühren und Zahlungen werden nicht verändert.

Die Schema-Basis 0001 bleibt unverändert. Unbenutzte Portal-/Memorialspalten
und `OrderForms` bleiben reserviert, ihre Oberfläche und externe Übertragung
sind entfernt. Ein Downgrade stellt gelöschte Zugangsdaten nicht wieder her;
0003 verweigert eine Adressverkürzung, wenn neue längere Werte vorhanden sind.
Produktiv keinen ungeprüften automatischen Downgrade ausführen.

Aktuelle Dateisicherung und die bestehende externe SQL-Sicherungsabdeckung
gehören zur Updatevorbereitung. Für SRV-UbuntuApp gelten die bereits
festgelegten Sicherungs- und HTTP-Regeln in SERVER_DEPLOYMENT.md.
