# Anhänge, Dokumente und Druck

Schritt 11 überträgt die Dateiverwaltung und Druckausgaben vom festen
Sunrise-Commit `451ce034863b16502484367044f3e9b65370111a`. Die
Fachanwendung, Datenabfragen und Zugriffsprüfung bleiben in Python/FastAPI;
React stellt die vorhandenen Dialoge und Druckauswahlen bereit.

## Anhänge

Die Vertragsbearbeitung bietet Upload, Änderung von Titel/Details und
Soft-Löschung. Auch lesende angemeldete Benutzer können vorhandene Anhänge
herunterladen. Schreibaktionen benötigen `canUpdateContracts` und CSRF.
Eine Administratorrolle allein ersetzt dieses unabhängige Fachrecht nicht.
Upload/Änderung/Löschung prüfen einen aktiven Vertrag. Wie in der Quelle
prüft der Download den aktiven Anhang, aber nicht zusätzlich dessen Vertrag.

`CEMARIS_ATTACHMENTS_PATH` bestimmt die Dateiablage, standardmäßig
`data/attachments`. Dateien liegen nach Server-Ortsdatum unter `YYYY-MM`;
die SQL-Tabelle `ContractAttachments` enthält Dateiname, Verzeichnis,
Titel, Details sowie Erstellungs-/Änderungs-/Löschmetadaten. Die bereits
vorhandene Schema-Revision 0001 bleibt unverändert. Dateiinhalte gehören
nicht in SQL Server. Eine Soft-Löschung lässt die Datei auf dem Datenträger.

`CEMARIS_MAX_ATTACHMENT_FILE_SIZE` ist die Größe in MiB, standardmäßig 20.
Die Oberfläche übernimmt die originale Dateiauswahlhilfe für PDF, Word,
Bilder, Text, CSV und Excel. Der Server hat wie die Quelle keinen MIME- oder
Dateitypfilter. Er begrenzt die tatsächliche Dateigröße und den eingehenden
Multipart-Datenstrom, auch ohne `Content-Length`. Das zusätzliche Limit
für Formularfelder und Multipart-Rahmen beträgt 1 MiB.
Der allgemeine Dateischreibhelfer hat wie die Quelle kein Upload-Größenlimit;
dies ist für spätere direkte Workflow-Dokumente relevant. Die Begrenzung
gilt am HTTP-Uploadweg.

Der Upload übernimmt zunächst die ursprüngliche Multer-Regel: Verzeichnisanteile
in Windows-/POSIX-Dateinamen werden entfernt und die Browser-Escapes `%0A`,
`%0D`, `%22` aufgelöst. Ein fehlender Titel wird beim HTTP-Upload durch diesen Originaldateinamen
ersetzt. Ein ausdrücklich leerer Titel bleibt leer; die Oberfläche zeigt
dann den gespeicherten Dateinamen. Diese Unterscheidung bewahrt die Quelle
trotz des dortigen Hinweises „Leave blank to use filename“. Die Bearbeitung
verlangt im Browser einen Titel. Grenzen: Titel 100, Details 500 Zeichen;
SQL Server erzwingt zusätzlich die im Schema deklarierten Feldlängen.

Dateinamen werden nach dem gesperrten `sanitize-filename` bereinigt;
bei leerem Ergebnis entsteht `attachment-YYYYMMDD`. Bei Kollisionen folgt
`name (1).ext`, `name (2).ext` usw. Die Quelle verwendet beim zweiten Versuch
wieder den unbereinigten Namen. Cemaris behält hier den bereinigten Namen,
prüft das Zielverzeichnis und legt Dateien exklusiv an. Fehlgeschlagene
SQL-Schreibvorgänge entfernen nur die gerade neu angelegte Datei.
Downloads bleiben auf das konfigurierte Ablageverzeichnis begrenzt.
Die ursprüngliche Multipart-Verarbeitung interpretiert UTF-8-Dateinamen ohne
explizite Zeichensatzangabe als Latin-1. Cemaris behält hier bewusst die
UTF-8-Decodierung von Starlette, sodass Umlaute und Emoji in SQL und auf dem
Datenträger erhalten bleiben. Die entsprechende Originalprobe weist den
Unterschied ausdrücklich aus.
Ein unerwartetes Dateifeld wird vom Original-Multipart-Parser abgewiesen;
Cemaris liefert dafür die ursprüngliche Handlerantwort „No file uploaded.“.
Mehrere Dateien und überschrittene Größen liefern kontrollierte HTTP-Fehler.

## Drucke und individuelle Vorlagen

Die Vertragsdruckauswahl folgt den Zuordnungen der Vertragsart aus Schritt
04 einschließlich `*`; Suchergebnisse benutzen den ersten zugeordneten Druck.
Arbeitsaufträge verwenden die konfigurierten Drucke, sowohl in der Ansicht
als auch als erster Druck in der Suche und als Verweise im Kalender.
Alle Druckzugriffe benötigen eine angemeldete Sitzung. Ein Kalender-API-
Schlüssel erteilt keine Druck- oder Dateiberechtigung.

Enthalten sind `screen/contract`, `pdf/workOrder` und
`pdf/workOrder-commentLog`. Die eingebauten Vorlagen bewahren die englischen
Quelltexte unabhängig von der Oberflächensprache. Vertragsdruck enthält
Grabstätte/Friedhof, Daten, Zusatzfelder, Beisetzungen, Kommentare, Gebühren,
Steuer/Gesamtsummen und Transaktionen. Arbeitsauftragsfeldblatt und
Kommentarlog enthalten Stammdaten, Bezüge bzw. Kommentare, CODE128-Barcode
sowie Erstellungs-/Druckzeit. Die JavaScript-Zahlenformatierung der
Originalvorlagen bleibt erhalten.

Die Vertragsvorlage verwendet `contractFieldValue` statt des tatsächlichen
`fieldValue` sowie `contractComment*` statt `comment*`. Daher zeigt sie
Zusatzfeldwerte als „(No Value)“ und Kommentare ohne Datum/Text; der Autor
bleibt sichtbar. Dies ist eine ausdrücklich erhaltene Quellanomalie, keine
fehlende SQL-Persistenz. Die reguläre Vertragsoberfläche zeigt diese Inhalte.
Das originale Bildschirmdrucklayout erzeugt im geprüften Letter-Beispiel eine
zweite dunkle Leerseite. Der direkte Original-/Zielvergleich reproduziert
dies auf beiden Seiten; die Layoutregel bleibt erhalten.
Lange Listen werden vollständig über mehrere Seiten ausgegeben: geprüft sind
40 Meilensteine auf vier und 80 Kommentare auf sechs Seiten. Dabei überlagert
die absolut positionierte Fußzeile samt Barcode im langen Kommentarlog einen
Teil der ersten Seite. Auch diese Grenze ist im Original-/Zielpaar identisch
belegt und bleibt ausdrücklich erhalten.

Eine technische Ausgabekorrektur ist ausdrücklich: Der originale
`pdf-puppeteer`-Weg navigiert zu einer Data-URI ohne Zeichensatzangabe. Die
eingebauten PDF-Vorlagen enthalten ebenfalls kein Charset-Metaelement;
der echte Browser liest ihre UTF-8-Bytes als Windows-1252. Cemaris ergänzt
`charset=utf-8` an der Data-URI. Die EJS-Inhalte bleiben gleich, während
Umlaute in der PDF-Ausgabe korrekt erhalten bleiben. Die Originalklasse
wurde mit demselben Browser ausgeführt und der Unterschied nachgewiesen.

Die Python-API ruft einen begrenzten Node-Renderprozess unter
`backend/printing-runtime` auf. Dieser erhält die geprüften Druckdaten und
stellt EJS sowie die originalen Datums-, Vertrags-, Konfigurations- und
Barcode-Helfer bereit. Damit können individuelle `index.js`-/EJS-Vorlagen
weiterlaufen. Das ist eine notwendige technische Ergänzung zur Python-
Fachanwendung, keine zweite Fachimplementierung. Die npm-Abhängigkeiten
haben ein eigenes Lockfile. Vorlagen und Includes werden mit dem API-Image
ausgeliefert; das HTML-Drucklayout bindet seine Styles lokal ein.

`CEMARIS_CUSTOMIZATIONS_PATH` entspricht dem vorhandenen Medienverzeichnis.
Die Datei `index.js` exportiert die ursprüngliche Konfiguration mit
`prints.pdf`, beispielsweise:

```javascript
export default {
  prints: {
    pdf: {
      contractReceipt: {
        title: 'Contract Receipt',
        params: ['contractId']
      }
    }
  }
}
```

Dazu gehört `views/print/pdf/contractReceipt.ejs` unter demselben
Customizations-Verzeichnis. Bei ES-Modulen benötigt das eigene Verzeichnis
wie üblich eine `package.json` mit `"type": "module"`. Gemeinsame Includes
werden relativ zur EJS-Datei aufgelöst. Konfiguration und Vorlagen sind vom
Betreiber installiertes ausführbares JavaScript und werden wie die Quelle
beim Start entdeckt. Änderungen an der Liste benötigen einen Neustart.
Die Titel fließen in Katalogauswahl und Kalender ein.

Der Druck muss zusätzlich unter `CEMARIS_CONTRACT_PRINTS` bzw.
`CEMARIS_WORK_ORDER_CALENDAR_PRINTS` aktiviert sein. Die zweite Option hat
aus Schritt 10 Pfad-/Titelpaare; die tatsächliche Vorlagenentdeckung liefert
nun die Drucktitel. Eine einzelne Vertragsart kann die globalen Drucke weiter
einschränken; die direkte Druckroute verwendet wie die Quelle die globale
Freigabeliste. Authentifizierte individuelle Dateien liegen unter
`public-internal/` im Customizations-Verzeichnis.

`CEMARIS_PRINT_BROWSER` wählt `chrome` oder `firefox`.
`CEMARIS_PRINT_BROWSER_EXECUTABLE` setzt einen installierten Browserpfad;
ohne Angabe werden lokale Chrome-/Chromium-/Edge- bzw. Firefox-Installationen
gesucht. Das API-Image enthält Chromium. Browserinstallationen während einer
Druckanfrage werden durch explizite Bereitstellung ersetzt. Es gibt keinen
automatischen Netzwerkdownload bei einem PDF-Fehler.
`CEMARIS_PRINT_CONTENT_DISPOSITION` ist `attachment` oder `inline`,
standardmäßig `attachment`. Dateinamen folgen `camelcase(Titel)-ID.pdf`.
`CEMARIS_PRINT_CONFIGURATION` kann zusätzliche öffentliche Konfiguration
für eigene Vorlagen als JSON mit originalen punktgetrennten Schlüsseln
bereitstellen. Zugangsdaten sind nicht automatisch Teil des Reportdaten-/
Konfigurationsobjekts. Der Renderprozess ist keine Sandbox für fremde Vorlagen
und erbt die Serverumgebung. Eigene Vorlagen sind wie im Original ausschließlich
vom Betreiber installiertes, vertrauenswürdiges Programm.

## HTTP und Betrieb

| Weg | Zweck |
| --- | --- |
| `GET /api/attachments/options` | Größenlimit für Uploaddialog |
| `GET /api/contracts/attachment/{id}` | authentifizierter Dateidownload |
| `POST /api/contracts/doUploadContractAttachment` | Multipart: `file`, `contractId`, optional Titel/Details |
| `POST /api/contracts/doUpdateContractAttachment` | JSON: `contractAttachmentId`, Titel/Details |
| `POST /api/contracts/doDeleteContractAttachment` | JSON: `contractAttachmentId` |
| `GET /api/print/options` | verfügbare Drucke für Vertrag/Arbeitsauftrag |
| `GET /print/screen/{name}?contractId=…` | HTML-Druck |
| `GET /print/pdf/{name}?workOrderId=…` | PDF, Parameter gemäß Vorlage |
| `GET /public-internal/{path}` | authentifizierte individuelle Medien |

Compose verwendet ein eigenes `attachments`-Volume unter
`/app/data/attachments`, zusätzlich zum Sitzungsvolume und dem read-only
eingebundenen Customizations-Verzeichnis. SQL und Dateivolume müssen gemeinsam
gesichert werden; absolute gespeicherte Pfade erfordern bei Umzügen einen
gleichbleibenden Containerpfad oder eine gezielte Pfadkorrektur. Vorhandene
Dateien werden nicht stillschweigend migriert. Nginx und der lokale Vite-Proxy
leiten `/print/` und `/public-internal/` zur API weiter. Der Server erzwingt
das Dateilimit unabhängig vom vorgeschalteten Proxy.

Nicht freigegebene oder unbekannte Drucke behalten die ursprünglichen
Dashboard-Weiterleitungen. Fehlende Datensätze/Parameter und nicht verfügbare
Renderer liefern kontrollierte HTTP-Fehler (400/404/503); ohne Sitzung gilt
der bereits etablierte API-Fehler 401. Die globale Druckfreigabe ersetzt keine
Sitzung. Vollständiger URL-Präfix-/Ubuntu-Betrieb bleibt wie bei den übrigen
Fachseiten ein übergreifender Nachweis in 15/16.

Konkrete Original-, SQL-, Browser- und Rendernachweise sowie Grenzen stehen
in [Bericht 11](berichte/11.md). Die Gesamtportierung ist weiterhin offen.
