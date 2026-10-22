> Portierungsbeleg der Anmeldeadapter. Aktuelle Produktvorgaben, insbesondere
> Deutsch als Sprachfallback und die entfernten Benutzereinstellungen, stehen
> in [TECHNIK.md](../TECHNIK.md) und [Bericht18](berichte/18.md).

# Anmeldung, Benutzer, Einstellungen und Sprachen

Stand: Schritt 03, 19.10.2026. Quelle ist ausschließlich Sunrise CMS am Commit
`451ce034863b16502484367044f3e9b65370111a`. Die Datenbank bleibt SQL Server;
Benutzerkennwörter werden wie in Sunrise vom Authentifizierungsadapter geprüft,
nicht in der Tabelle `Users` verwaltet.

## Zuordnung und Bedienabläufe

| Quelle | Cemaris | Übertragenes Verhalten |
| --- | --- | --- |
| `helpers/authentication.helpers.ts`, `routes/login.ts` | `backend/cemaris/auth.py`, `auth_adapters.py`, `auth_config.py`; React `App.tsx` | Domainpräfix, leere/ungültige Anmeldungen, vier Adapter, sichere Weiterleitungen, Fehlversuche |
| `app/app.ts`, `public/javascripts/theme.ts` | `auth.py`, `App.tsx`, `ui.tsx` | Server-Sitzung, Ablauf/Verlängerung, CSRF, Abmeldung, Keepalive, Rechte und Sprachwahl |
| `helpers/user.helpers.ts`, `handlers/permissions.ts` | `accounts.py`, Auth-Abhängigkeiten, React-Routenschutz | lokale Benutzer vor Konfigurationsrollen, unabhängige Änderungsrechte, geschützte API und UI |
| `database/*User.ts`, Admin-Handler/-Ansicht, `users.admin.ts`, `adminUsers-add.html` | `accounts.py`, `pages.tsx` | Anlegen, Dubletten, Rechte umschalten/aktualisieren, Aktivität, Löschen/Wiederherstellen, Konfigurationshinweis, Audit |
| `types/setting.types.ts`, `database/*Setting*.ts`, `settings.cache.ts`, `settings.admin.ts` | `preferences.py`, `data/settings.json`, `pages.tsx` | alle 26 Deskriptoren, 24 konfigurierbare Werte, Filter, Änderungshinweis, Speichern, Defaults und vorheriger Wert |
| `dashboard/userSettings.ejs`, `userSettings.ts`, `doResetApiKey.ts` | `preferences.py`, `pages.tsx` | Sprachwahl, API-Schlüssel zurücksetzen, optionale ConsignO-Benutzerdaten und NTFY-Anzeige |
| `helpers/i18n.helpers.ts`, `locales/{en,de}/*.json` | `auth.py`, `frontend/src/i18n.ts`, `frontend/public/locales/` | alle acht Kataloge mit 668 Werten, Namensräume app/admin/login/errors, englischer Fallback |

Die React-Seiten folgen Login, Navigation, Verwaltungsmenü, Tabellen, Dialogen
und Einstellungspanels der Quelle. Fachlinks bleiben vorhanden; ihre noch
ausstehenden Fachseiten werden ausdrücklich als offen angezeigt. Das ist kein
Funktionsnachweis für die späteren Schritte. Dashboard-Zahlen folgen in 12,
Kartenhelfer aus `main.ts` in 06, Auditansicht/Datenbankverwaltung in 15.

## Konfiguration und erste Anmeldung

Ohne konfigurierten Adapter ist keine reguläre Anmeldung möglich. Es gibt kein
eingebautes Kennwort. Die bestehende `.env` wird nicht automatisch geändert.
Nach Migration/Seed gemäß [TECHNIK.md](../TECHNIK.md) kann für eine lokale
Entwicklungsanmeldung Folgendes in der Umgebung oder `.env` gesetzt werden:

```dotenv
CEMARIS_AUTH_TYPE=plainText
CEMARIS_AUTH_CONFIG={"users":{"\\administrator":"CHOOSE_A_LOCAL_DEVELOPMENT_PASSWORD"}}
CEMARIS_AUTH_CAN_LOGIN='["administrator"]'
CEMARIS_AUTH_IS_ADMIN='["administrator"]'
```

Ein eigenes Kennwort wählen. Den JSON-Beispielwert in `.env` ohne zusätzliche
äußere Anführungszeichen übernehmen; so erhalten Python-dotenv und Compose
dieselben JSON-Backslashes. Dollar- und Rautezeichen im JSON-Kennwort als
`\u0024` bzw. `\u0023` schreiben, damit keine Dotenv-Interpolation oder
Kommentarbehandlung den Wert verändert. Das JSON enthält bei leerer Domain den Schlüssel
`\administrator`; bei `CEMARIS_AUTH_DOMAIN=EXAMPLE` lautet er
`EXAMPLE\administrator` (im JSON jeweils `\\`). Im Loginfeld nur den Namen
eingeben. Ein neuer SQL-Benutzer besitzt kein eigenes Kennwort; auch für ihn
muss der konfigurierte Adapter die Zugangsdaten prüfen können.

`AuthSettings` liest `CEMARIS_AUTH_` plus folgende Namen. Listen/Objekte sind JSON,
boolesche Werte `true`/`false`. Leerwerte verwenden den Standard.

| Name | Standard / Bedeutung |
| --- | --- |
| `TYPE`, `CONFIG` | kein Adapter, `{}`; Typ und geheime Adapterkonfiguration |
| `DOMAIN` | leer; wird immer mit `\` vor den Namen gesetzt |
| `CAN_LOGIN`, `IS_ADMIN` | jeweils `["administrator"]` |
| `CAN_UPDATE` | `[]`; gewährt alle drei fachlichen Änderungsrechte |
| `CAN_UPDATE_CEMETERIES`, `CAN_UPDATE_CONTRACTS`, `CAN_UPDATE_WORK_ORDERS` | jeweils `[]`; getrennte Änderungsrechte |
| `COOKIE_NAME` | `cemaris-user-sid` |
| `COOKIE_SECURE` | lokal `false`; Compose `true` für HTTPS; lokales Compose über HTTP benötigt explizit `false` |
| `MAX_AGE_MILLIS` | `3600000`; gleitende Sitzungsdauer |
| `DO_KEEP_ALIVE` | `false`; Browserintervall bei Aktivierung halbe Sitzungsdauer |
| `SESSION_DIRECTORY` | `data/sessions`; Compose verwendet `/app/data/sessions` und Volume `sessions` |
| `TRAFFIC_IS_FORWARDED` | lokal `false`; Compose `true`; Web-Nginx übernimmt die geprüfte Client-IP nur vom konfigurierten vertrauenswürdigen Hostproxy, siehe DEPLOYMENT.md |
| `DISABLE_RATE_LIMIT` | `false`; sonst 2000 API-Anfragen/Minute/IP |
| `USE_TEST_DATABASES`, `TESTING` | `false`, `[]`; `*`-Testkonten nur bei aktivem Testmodus, exakter Listenzugehörigkeit und Kennwort gleich Name |
| `URL_PREFIX` | leer; Alias für den gemeinsamen Schlüssel `CEMARIS_URL_PREFIX`; Schritt 16 verbindet Build, Routing, Cookies, API, Dateien und Redirects unter demselben Präfix, siehe [DEPLOYMENT.md](../DEPLOYMENT.md) |

Der SQL-Server-Name wird immer explizit mit `CEMARIS_DATABASE_URL` gewählt.
Der Testmodus wechselt diese URL nicht automatisch; er ist ausschließlich mit
einer gesondert bestimmten Testdatenbank zu verwenden. Ohne ihn bleiben
`*`-Konten gesperrt. Testbefehle erzeugen eigene Datenbanken und setzen diesen
Authentifizierungsmodus nicht voraus.

Weitere Optionen: `CEMARIS_AUDIT_LOG_ENABLED=false` aktiviert bei `true` die
Quell-Auditereignisse für Benutzeränderungen. `CEMARIS_CONSIGNO_CLOUD_ENABLED`,
`CEMARIS_NTFY_ENABLED`, `CEMARIS_NTFY_SERVER` und `CEMARIS_NTFY_TOPICS` steuern
Benutzereinstellungen/-anzeige. Dienstaufrufe und vollständige Integrations-
Konfiguration folgen in 13. Die übrige Quell-Anwendungskonfiguration bleibt
ihren Fachschritten und Schritt 15 zugeordnet.

### Authentifizierungsadapter

- `plainText`: `{"users":{"EXAMPLE\\alice":"password"}}`. Exakte, sensible
  Schlüssel; optional `alternativeAuthenticator: {type, config}` für unbekannte
  Namen. Ein falsches Kennwort eines vorhandenen Namens nutzt keinen Fallback.
- `function`: `{"authenticate":"own_module:authenticate"}`. Die Pythonfunktion
  erhält Domainname und Klartextkennwort, synchron oder asynchron. Die
  Moduldatei muss in der Laufzeit verfügbar sein; nur Betriebskonfiguration
  bestimmt den Import.
- `activeDirectory`: `url` (ldap/ldaps), `baseDN`, `bindUserDN`,
  `bindUserPassword`, optional `cacheUserBindDNs` (Standard true), `timeout` und
  `connectTimeout` in Millisekunden. Ablauf: Dienstbindung, maskierte
  `sAMAccountName`-Teilbaumsuche nach `objectClass=user`, separate Benutzerbindung.
  DN-Cache 60 Sekunden, auch nach falschem Benutzerkennwort. Python `ldap3`
  2.9.1 ersetzt die gesperrten Node-LDAP-Pakete. `tlsOptions.caFile/certFile/keyFile`
  ersetzen Node-Buffer; Zertifikatsprüfung bleibt standardmäßig aktiv.
- `adWebAuth`: `url`, optional `method` (`post`, `get`, `headers`),
  `userNameField`, `passwordField`, `timeout` in Sekunden. Quelle ergänzt `/auth`
  und `/byPost`, `/byGet` oder `/byHeaders`; drei Versuche bei Transport-/JSON-
  Fehlern. Der normale Dienstvertrag ist ein JSON-Boolean.

Die Adapter wurden gegen die exakten gesperrten Pakete
`authentication-helper@1.0.0`, `ad-web-auth-connector@1.2.0` und
`activedirectory-authenticate@2.0.0` abgeglichen. Realistischer lokaler HTTP-
Server und echte `ldap3`-Mock-Verbindungen prüfen die Verträge. Ein Live-AD-/
AD-Web-Nachweis fehlt mangels Zugangsdaten.

## Quellregeln und bewusst sichtbare technische Unterschiede

- Authentifizierung und Berechtigung sind getrennt. Ein vorhandener aktiver
  SQL-Benutzer ersetzt alle Konfigurationsrechte; ein inaktiver verweigert den
  Login auch bei `CAN_LOGIN`. Ein soft-gelöschter Benutzer lässt den
  Konfigurationsfallback wieder zu. Administrator ist kein implizites
  fachliches Änderungsrecht. Rollen bleiben wie in der Quelle Sitzungssnapshots;
  Änderungen gelten beim nächsten Login, eigene Einstellungsaktionen erneuern
  den Einstellungssnapshot.
- Namen werden beim Anlegen unverändert gespeichert, beim Login für die lokale
  Suche kleingeschrieben. Gemischt geschriebene SQL-Benutzernamen können deshalb
  wie in der Quelle nicht über diese lokale Zeile aufgelöst werden. Die
  API-Schlüsselliste berücksichtigt nur exakte `CAN_LOGIN`-Namen; lokale
  Benutzer ohne Konfiguration erhalten zwar einen Schlüssel, er wird vom
  Quellvalidator nicht anerkannt. Beide Quellanomalien sind geprüft.
- Einstellungseingaben sind unveränderte Strings, auch bei numerischem Typ;
  leere Werte verwenden den Deskriptor-Default. Keine neue Zahlen-/Bereichsregel.
  Unbekannte/interne Schlüssel bleiben über den Admin-POST speicherbar und sind
  nicht in der konfigurierbaren Liste. Der Filter kleinschreibt nur Name und
  Beschreibung, nicht den camelCase-Schlüssel; Suche nach einer englischen
  Namensphrase funktioniert entsprechend der Quelle. Versteckte Zeilen behalten
  ungespeicherte Eingaben.
- Redirects behalten die Quell-Allowlist einschließlich Fallback
  `/dashboard/`; `/admin/users` ist darin nicht enthalten. Der gemischt
  geschriebene `funeralHomes`-Regex passt nach Quell-Kleinschreibung ebenfalls
  nicht. Englische/deutsche Sprachkataloge bleiben vollständig; nur der deutsche
  Produkttext in `dashboard.helpDescription` wurde auf Cemaris geändert.
- Spracherkennung: Query `lng`, dann Cookie `i18next`, dann Accept-Language,
  Fallback en. Innerhalb eines Detektors gewinnt ein exakter Code vor regionalem
  Fallback; die Quelle berücksichtigt auch q=0. 30 tatsächlich ausgeführte
  Originalfälle erhalten diese ungewöhnlichen Regeln.
- React/FastAPI transportieren Formaktionen als JSON. Direkte geschützte APIs
  antworten mit 401/403 statt EJS/HTTP-Redirect; die React-Navigation führt
  anonyme Nutzer zum Login und verweigerte UI-Aktionen zum Quell-Dashboard.
  API-Fehler verbergen interne SQL-/Adapterdetails und verwenden das vorhandene
  Cemaris-Fehlerformat.
- Sitzungen liegen serverseitig in atomar ersetzten JSON-Dateien. Der Cookie
  enthält eine zufällige 256-Bit-Kennung, keine Benutzer-/Kennwortdaten. Dadurch
  entfallen der signierte Quell-Cookie und `session.secret`. HttpOnly,
  SameSite=Strict und gleitende Dauer bleiben erhalten. Login/Logout rotieren
  Kennung und Token. Logout erzeugt eine anonyme CSRF-Sitzung.
- CSRF nutzt einen zufälligen, sitzungsgebundenen Synchronizer-Token im Header
  `X-CSRF-Token` statt des Node-Double-CSRF-Cookies. Auch Login und POST-Logout
  sind geschützt; die Quelle nimmt Login aus und verwendet GET-Logout. Der
  Quellhelper für `application.csrfSecret` ist vorhanden, wird für diese
  Tokenimplementierung nicht benötigt. Gleichheit des Schutzverfahrens wird
  nicht behauptet.
- AD-Web-Auth akzeptiert ausschließlich JSON `true`. Der Quellconnector kann
  ein Debug-Antwortobjekt mit `success:false` als truthy durchreichen; dies wird
  ausdrücklich nicht als erfolgreiche Authentifizierung übernommen.
  Providerfehler verweigern die Anmeldung und haben explizite Zeitgrenzen;
  LDAP-Referrals sind derzeit deaktiviert. Diese Adaptergrenzen und fehlende
  Live-Zugänge sind keine behauptete vollständige Verzeichnis-Kompatibilität.
- Fehlanmeldungen zählen einzeln fünf Minuten; ab fünf Punkten blockiert der
  nächste Login-POST mit 403, Erfolg/Logout löscht die Punkte. Die neue anonyme
  GET-Tokenabfrage bleibt erreichbar,
  während Sunrise bereits den GET seiner serverseitigen Loginseite sperrt.
  Die statische React-Loginseite bleibt deshalb sichtbar, ohne einen Zugang
  während der Sperre zu ermöglichen. Allgemeiner
  Rate-Limiter und Fehlversuchszähler sind pro API-Prozess. Zunächst genau einen
  API-Worker verwenden: Dateisnapshots können bei parallelen Schreibaktionen
  überschrieben werden, wie beim Quell-Dateispeicher. Mehrprozessbetrieb,
  vorgeschaltete Proxyketten und vollständiger Docker-Nachweis bleiben Schritt 16.

## HTTP-Verträge und Nachweise

| Route | Vertrag |
| --- | --- |
| GET `/api/session` | `user` oder null, `csrfToken`, `language`, öffentliche `auth`-Metadaten; kein Datenbankzugriff für anonyme Sitzung |
| POST `/api/login` | `{username,password,redirect?}` → `{success,user,redirect,csrfToken}`; ungültig 401, Fehlversuchssperre 403 |
| POST `/api/logout` | Sitzung invalidieren, anonymer Token |
| POST `/api/keep-alive` | `{activeSession}` bei aktivierter Option, sonst 404 |
| GET `/api/admin/users` | SQL-Benutzer, Konfigurationsrollen, Domain, Konfigurationshinweis |
| POST `/api/admin/users/{add,update,toggle,delete}` | Quellbenutzeraktionen, Toggle mit `permissionField`, nur Administrator |
| GET/POST `/api/admin/settings` | 24 konfigurierbare Deskriptoren / `{settingKey,settingValue}` |
| GET `/api/user-settings` | Einstellungssnapshot, optionale Integrationsanzeige; externes Kennwort maskiert |
| POST `/api/user-settings/reset-api-key` | neuer Quellschlüssel, Sitzungssnapshot aktualisiert |
| POST `/api/user-settings/consigno-cloud` | Benutzername/Kennwort; leeres Kennwort erhält den vorhandenen Wert |

Alle mutierenden Requests benötigen den zuvor geladenen CSRF-Token.
Reproduzierbare Originalproben: `node scripts/reference_auth.mjs --check-fixture`
und `node scripts/reference_languages.mjs --check-fixture`. Letztere lädt
fehlende Originalpakete mit verifizierter Lockfile-Integrität ausschließlich
nach `.local`. Sunrise selbst wird nicht installiert oder verändert.
SQL-/Browserbefehle und tatsächlich ausgeführte Prüfungen stehen in
[TECHNIK.md](../TECHNIK.md) und [Bericht 03](berichte/03.md).
