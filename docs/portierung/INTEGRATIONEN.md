> Historischer Portierungsbeleg. Die hier beschriebenen Altanbindungen sind
> seit Schritt18 aus Cemaris entfernt. Aktueller Stand: [Bericht18](berichte/18.md).

# ConsignO Cloud und ntfy

Stand: Schritt 13, 21.10.2026. Quelle: Sunrise CMS am unveränderten Commit
`451ce034863b16502484367044f3e9b65370111a`. Beide Dienste sind optional und
standardmäßig deaktiviert. Cemaris benötigt für seine übrigen Funktionen weder
ein ConsignO-Konto noch ein ntfy-Abonnement. Es wurden keine echten Dokumente
an einen externen Dienst gesendet und keine kostenpflichtigen Dienste aktiviert.

## Quellzuordnung

| Quelle | Cemaris |
| --- | --- |
| `integrations/consignoCloud/helpers.ts`, `handlers/contractsGet/edit.ts` | `consigno_cloud.py`: Aktivierung, Vertragsänderungsrecht und zwei persönliche Zugangswerte bestimmen die Sichtbarkeit der Aktion |
| `handlers/contractsPost/doGetContractDetailsForConsignoCloud.ts` | Vertragsprüfung, Name/Telefon, Druckauswahl, aktive Metadaten, vorbelegte Ablaufdaten |
| `integrations/consignoCloud/startWorkflow.ts`, Start-Handler | PDF-Erzeugung, Base64, Signaturanker, Entwurf, Metadaten und Kommentar |
| `integrations/consignoCloud/pollWorkflow.ts` | Statusvergleich, Kommentar, Download von Dokumenten/Audit und Abschlussbereinigung |
| `integrations/consignoCloud/updateWorkflows.task.ts` | `ConsignoWorkflowTask`: sofortiger Startlauf, danach zur vollen Stunde; mindestens zehn Minuten seit Ende des letzten Laufs, kein Überlappen |
| `database/{get,update,delete}ConsignoCloud*Metadata.ts` | bestehende SQL-Server-Metadatentabelle, vier feste Schlüssel und Quellgruppierung |
| `database/updateConsignoCloudUserSettings.ts`, Dashboard-Handler/-Ansicht | bestehende persönliche Einstellungen; leeres Kennwort bewahrt den gespeicherten Wert und aktualisiert den Sitzungssnapshot |
| `public/javascripts/contract.consignoCloud.ts`, `public/html/contract-sendToConsignoCloud.html`, Vertragsansicht | `frontend/src/consigno-cloud.tsx`, Einbindung ausschließlich im vorhandenen Vertragseditor |
| `@cityssm/consigno-cloud-api` **1.2.0** | Python-HTTP-Adapter, tatsächliches gesperrtes Paket im Originalvergleich ausgeführt |
| `integrations/ntfy/`, `index.ts` | `notifications.py` und zentraler FastAPI-Lebenszyklus |
| `@cityssm/ntfy-publish` **1.1.1** | Python-Publisher mit Quellheadern, Text-/Dateivertrag und Originalvergleich |

Es gibt in dieser Referenz **keine ntfy-Meldungen für Vertrags-, Grabstätten-
oder Arbeitsauftragsänderungen**. Der einzige Topicname ist `startup`; auch
die Shutdown-Nachricht verwendet diesen Topic.

## Konfiguration und Benutzung

Die API liest die folgenden Variablen aus ihrer Umgebung bzw. `.env`. Compose
reicht sie weiter. Es gibt keine neue Laufzeitabhängigkeit oder Schemamigration.

| Variable | Standard / Bedeutung |
| --- | --- |
| `CEMARIS_CONSIGNO_CLOUD_ENABLED` | `false`; aktiviert Aktion und Hintergrundabfrage |
| `CEMARIS_CONSIGNO_CLOUD_BASE_URL` | leer; vom Betreiber bereitgestellte absolute HTTP(S)-API-Basis, z. B. `https://signing.example.invalid/api`, ohne Query, Fragment oder eingebettete Zugangsdaten |
| `CEMARIS_CONSIGNO_CLOUD_API_KEY` | leer; Plattform-Clientkennung |
| `CEMARIS_CONSIGNO_CLOUD_API_SECRET` | leer; Plattform-Clientsecret |
| `CEMARIS_CONSIGNO_CLOUD_TIMEOUT_SECONDS` | `30`; positiver, endlicher HTTP-Zeitgrenzwert |
| `CEMARIS_CONSIGNO_CLOUD_POLL_ENABLED` | `true`; separater Schalter für die automatische Abfrage bei aktivierter Integration |
| `CEMARIS_NTFY_ENABLED` | `false` |
| `CEMARIS_NTFY_SERVER` | leer; verwendet dann wie das Original `https://ntfy.sh` |
| `CEMARIS_NTFY_TOPICS` | `{}`; z. B. `{"startup":"my-topic"}`; leere/NULL-Topics senden nichts |
| `CEMARIS_NTFY_TIMEOUT_SECONDS` | `30`; positiver Socket-Timeout, höchstens 60 Sekunden |

Für ConsignO werden zusätzlich unter **Benutzereinstellungen** der persönliche
ConsignO-Benutzername und das dafür eingerichtete Drittanwendungskennwort
gespeichert. Die Kennwörter bleiben wie in Sunrise in SQL-`UserSettings` mit
Wertehistorie; es wurde keine neue Verschlüsselung behauptet. Die öffentliche
Sitzungs- und Einstellungsantwort enthält das Kennwort nicht. Das Formular gibt
es ebenfalls nicht wieder aus. Ein leer eingereichtes Kennwort bedeutet
„unverändert“; das Formular bietet keine Kennwortlöschung. Andere Sitzungen
behalten ihren bisherigen Einstellungssnapshot bis zur Neuanmeldung.

Die Versandaktion benötigt Aktivierung, `canUpdateContracts`, einen nichtleeren
persönlichen Benutzernamen und ein nichtleeres Drittanwendungskennwort.
Administrationsrechte allein ersetzen das Vertragsänderungsrecht nicht.
Ungespeicherte Vertragsänderungen blockieren den Dialog. Die Detailsprüfung
verlangt einen vorhandenen Vertrag, nichtleere Erwerber-E-Mail und Telefonnummer,
mindestens einen zugeordneten PDF-Druck mit `consignoCloud`-Konfiguration sowie
keine bestehenden aktiven `consignoCloud.`-Metadaten.

Der Dialog übernimmt Titel, Erwerbername, E-Mail und formatierte Telefonnummer,
wählt alle angebotenen Dokumente und setzt das Ablaufdatum auf heute plus sieben
Tage. Namen können getauscht werden. Die Quellkontrollen verlangen Vor-/Nachname,
E-Mail, Ablaufdatum und eine Telefonnummer im Format **`+1XXXXXXXXXX`**; Call oder
SMS werden zusätzlich zum E-Mail-Link verwendet. Dieser nordamerikanische
Quellvertrag wurde erhalten. Eine Eignungsentscheidung für deutsche kommunale
Abläufe und ein anderer Signaturdienst sind spätere fachliche Entscheidungen.

Individuelle Drucke werden wie seit Schritt 11 über `customizations/index.js`
bereitgestellt, in `prints.pdf` registriert und der Vertragsart zugeordnet:

```javascript
export default { prints: { pdf: { signingContract: {
  title: 'Contract for Signing', params: ['contractId'],
  consignoCloud: { anchors: [{
    tag: 'SIGNATURE', xOffset: 0, yOffset: 0,
    width: 150, height: 40, page: 1
  }] }
} } } }
```

Die passende EJS-Datei liegt unter `views/print/pdf/signingContract.ejs`.
Der Anker erhält `assignedTo: '1'` und `skipIfNotFound: true`. Ohne
`consignoCloud`-Eigenschaft erscheint ein Druck nicht in der vorgeschlagenen
Auswahl. Die bestehende PDF-Laufzeit samt installiertem Browser ist erforderlich.

## HTTP- und Ablaufvertrag

| Cemaris-Pfad | Methode / Inhalt |
| --- | --- |
| `/api/contracts/{id}/consigno-cloud` | GET, Sitzung; Aktivierung, Benutzerzugriff und aktive Metadaten; keine externe Statusabfrage |
| `/api/contracts/consigno-cloud/details` | POST, Vertragsänderungsrecht/CSRF, `{contractId}`; Quellfelder oder `success:false,errorMessage` |
| `/api/contracts/consigno-cloud/start` | POST, Vertragsänderungsrecht/CSRF; `contractId`, `workflowTitle`, `workflowExpiresOn`, `printNames` als String/Liste, `signerFirstName`, `signerLastName`, `signerEmail`, `signerPhone`, `signerAmr` |
| `/contracts/doGetContractDetailsForConsignoCloud`, `/contracts/doStartConsignoCloudWorkflow` | kompatible POST-Aliasse; Vite/Nginx leiten diese beiden benannten Pfade zur API |

Die bestehende Einstellungs-API lautet `/api/user-settings` und
`/api/user-settings/consigno-cloud`. API-Schlüssel des Kalenderexports erteilen
keine Integrationsänderungsrechte. Deaktivierte ConsignO-POSTs liefern 404;
fehlende Sitzung/Quellrechte/CSRF werden weiterhin mit 401/403 abgewiesen.

Das tatsächliche Paketprotokoll verwendet POST `/auth/login` mit JSON
`{username,password}` und `X-Client-Id`/`X-Client-Secret`. Das zurückgegebene
`X-Auth-Token` wird für JSON-POST `/workflows` und GET `/workflows/{id}` als
Header verwendet. Downloads sind POST `/workflows/{id}/documents` bzw. `/audit`
mit **URL-kodiertem `X-Auth-Token` im Body**, ohne Tokenheader. Workflow-IDs
müssen für Abruf/Download aus 24 kleinen Hexzeichen bestehen. Der Token wird
nach 25 Minuten Inaktivität neu beschafft; es gibt keinen automatischen
401-Refresh oder sofortigen Transport-Retry.

Ein neuer Ablauf hat `status:0` (Create), `pdfaPolicy:1`, Base64-PDFs und eine
Remote-ESignaturaktion mit Referenz `1`, `amr:['link','call'|'sms']`,
`placeHolder:false`; die Benachrichtigungsliste ist leer. **Der Entwurf läuft
noch nicht. Der Benutzer muss ihn anschließend in ConsignO Cloud starten.**
Die Antwort liefert `workflowId` und `workflowEditUrl`; die Oberfläche zeigt
den entsprechenden Hinweis und Link. Cemaris speichert die vier Schlüssel
`workflowId`, `workflowStatus`, `workflowEditUrl`, `workflowUser` unter
`consignoCloud.` und ergänzt den Quellkommentar mit dem Workflowlink.

## Statusabfrage, Downloads und Quellsonderfälle

Der Hintergrundtask arbeitet mit `task.updateConsignoWorkflows`. Er gruppiert
aktive Metadaten, lädt die **aktuellen gespeicherten Zugangswerte des ursprünglichen
Workflowbenutzers** und teilt den Clientcache während eines Durchlaufs zwischen
dessen Verträgen. Danach wird der Cache verworfen. Andere Benutzer übernehmen
keine fremden ConsignO-Zugangsdaten. Ein Worker verarbeitet die Workflows seriell.

| Status | Bezeichnung im Quellkommentar |
| --- | --- |
| 0 | Created, Not Launched |
| 1 | Launched, In Progress |
| 2 | Completed |
| 3 | Expired |
| 4 | Created from Template, Not Launched |
| 5 | Declined |
| 6 | Deleted |

Nur eine Statusänderung schreibt Metadaten und einen Kommentar. Bei `Completed`
werden Dokumente und Audit-Trail in die bestehende Anhangsablage geschrieben,
mit Datenbankverweis und den Quelltiteln. Nur exakt `application/pdf` erzeugt
für das Dokumentpaket die Erweiterung `.pdf`; jeder andere Content-Type,
einschließlich `application/pdf; charset=…`, erzeugt `.zip`. Der Audit-Trail
heißt stets `.pdf`. Die realen Downloads sind bytegenau geprüft.

Bei `Deleted`, **numerisch exakt null** verbleibenden Aktionen oder dem
Dienstfehlercode **String `'5004'`** werden genau die vier bekannten Metadaten
soft-gelöscht. Andere Fehler bleiben für den nächsten Stundenlauf erhalten.
Es gibt keine erfundene automatische Workflow-Neuanlage oder Wiederholung
innerhalb desselben Aufrufs. Unbekannte Statuswerte erzeugen wie die Quelle
den Text `undefined` im Kommentar; fehlender/NULL-Status bleibt ohne Änderung.

Folgende auffällige Quellregeln sind ausdrücklich erhalten:

- Die Detailsprüfung ist keine erneute Prüfung innerhalb des Starthelfers.
  Direkte berechtigte Startaufrufe können eine leere Dokumentliste senden,
  andere vorhandene Druckkonfigurationen wählen und aktive Metadaten ersetzen.
  Der normale Browser bietet nur die gefilterte Auswahl und verlangt mindestens
  ein ausgewähltes Dokument. Es wurde keine zusätzliche Fachsperre erfunden.
- Ein abgeschlossener Ablauf mit verbleibenden Aktionen behält seine Metadaten
  und lädt in späteren Durchläufen erneut herunter. Scheitert der Auditdownload
  nach erfolgreichem Dokumentdownload, bleibt das bereits angelegte Dokument
  bestehen und kann beim nächsten Durchlauf erneut entstehen. Die etablierte
  kollisionssichere Dateibenennung aus 11 verhindert Überschreiben.
- Status, Kommentar, Dateisystem und die beiden Anhangsdatensätze bilden keine
  gemeinsame externe Transaktion. Ein Datei-/SQL-Fehler kann Teilresultate
  hinterlassen. Auch ein remote bereits erstellter Ablauf wird bei einem
  anschließenden lokalen SQL-Fehler nicht automatisch gelöscht.
- Fremde zusätzliche `consignoCloud.`-Schlüssel werden mitgruppiert und von der
  Vier-Schlüssel-Bereinigung nicht gelöscht. Sie können den Detailsdialog weiter
  sperren. Der Quellhelfer verwendet das zweite durch Punkt getrennte Segment.

Technische Anpassungen: Python/JSON-API, typisierte Pflichtfelder (fehlende
Startfelder 422), kontrolliertes 400 bei unbrauchbaren Kontaktdaten, generische
SQL-Fehlerantworten ohne Statements/Parameter, keine Weiterleitung von
ConsignO-Zugangsdaten über HTTP-Redirects, HTTP-Timeout und Deadline beim Lesen.
Die vier Metadatenschreibungen bzw. -löschungen sind jeweils eine kurze lokale
SQL-Transaktion; der entfernte Dienst bleibt außerhalb dieser Transaktion.
Der Browser und der zugehörige Nginx-Pfad warten höchstens 180 Sekunden auf
die Initialisierung. Ein Clienttimeout rollt einen bereits entfernten Ablauf
nicht zurück; besonders viele/langsame PDF-Vorlagen brauchen einen gesonderten
Betriebsnachweis. Jede einzelne PDF-Erzeugung behält ihre Grenze aus Schritt 11.

Der Stundenlauf beginnt im API-Hintergrundthread; die API muss nicht auf das
Ende des ersten Scans warten. Beim Herunterfahren werden neue Workflows und
Provideraufrufe unterbunden, der Thread wird höchstens fünf Sekunden abgewartet.
Läuft eine I/O-Operation noch, wird eine selbst erzeugte Engine erst nach
Threadende freigegeben. Die bestehenden SQL-Verbindungs-/Abfragegrenzen bleiben
maßgeblich. Zunächst **ein API-Worker**; Mehrprozessbetrieb ist kein hier
behaupteter Nachweis.

## ntfy-Lebenszyklus

POST an `<server>/<startup-topic>` enthält als Titel `Cemaris`, `Priority:3`,
Tags `arrow_up` bzw. `arrow_down` und die erhaltenen englischen Texte
`The application has started successfully.` bzw. `The application is shutting down.`
Leerer Server verwendet den Paketdefault. Deaktivierung oder ein fehlender/
leerer Topic erzeugt keinen Netzwerkaufruf. Die Oberfläche zeigt Server und
konfigurierte Topics wie bisher in den Benutzereinstellungen.

Der Publisher prüft ausschließlich HTTP 2xx; eine HTTP-Ablehnung liefert
`false` und verhindert den Anwendungsstart nicht. Ein Transportfehler wird
weitergereicht; beim Start wird dann keine laufende Anwendung und kein
Shutdown-Hook behauptet. Bei erfolgreichem Start erfolgt Shutdown nach dem
Stoppen des ConsignO-Tasks, vor Freigabe der eigenen Engine. Ein Fehler bei der
Shutdown-Nachricht verhindert deren Freigabe nicht, sofern der Task beendet ist.
Es gibt keinen Retry. Technische Grenzen sind 30 Sekunden Socket-Timeout und
60 Sekunden je Lifecycle-Aufruf. Ein harter Prozessabbruch kann keine
Shutdown-Nachricht garantieren.

Auch die optionalen Header-/Text-/Dateifunktionen des gesperrten Publishers
(Priorität, Tags, Click/Icon/Attach, lokale Datei, Cache und Redirects) sind
im Python-Adapter mit Original- und tatsächlichen HTTP-Fällen verglichen;
die Anwendung verwendet davon nur die beiden Lebenszyklusmeldungen.

## Nachweise und offene Live-Prüfungen

Reproduzierbare Befehle und konkrete Ergebnisse stehen in
[Bericht 13](berichte/13.md). Die Originalproben prüfen Quellhashes und
gesperrte Paketintegritäten und führen tatsächliche Helper-, Handler-,
Browser- und Schedulerkörper mit ausgewiesenen injizierten Grenzen aus.
Sie ersetzen keinen vollständigen Sunrise-Start. Die Zielpersistenz verwendet
ausschließlich eigene entbehrliche SQL-Server-Datenbanken.

Produktionsbrowser, echte API, frische SQL-Datenbank, tatsächlicher PDF-Renderer
und lokale HTTP-Gegenstellen prüfen den zusammenhängenden Versand. Der QA-Runner
beendet Uvicorn kontrolliert, damit auch unter Windows die reale
Shutdown-Nachricht ausgeführt wird. Der dafür eingesetzte Wrapper unter
`scripts/` und sein Loopback-Endpunkt werden nicht ins API-Image kopiert.

Ohne Betreiberzugänge bleiben Anmeldung am echten ConsignO-Mandanten,
Signaturzustellung/-durchführung, echte Provider-PDFs/Audit-Trails und externer
ntfy-Empfang live ungeprüft. Docker/Compose, Nginx-Ausführung, Linux-ODBC und
Ubuntu-Praxistest sind weiterhin offen. Dynamics GP und Portal gehören zu
Schritt 14; weitere Betriebsfunktionen und Gesamtvergleich zu 15/16.
