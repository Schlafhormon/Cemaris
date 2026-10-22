# Karten, Lagefunktionen und Grabstellenwerkzeuge

Schritt 06, 20.10.2026. Referenz: Sunrise CMS
`451ce034863b16502484367044f3e9b65370111a`, Version `1.0.0-beta.21`.
Quellen sind insbesondere `routes/burialSites.ts`, die Karten-/GPS-/Creator-
Handler und Browserdateien, `database/getBurialSitesForMap.ts`,
`database/getBurialSiteNamesByRange.ts`, `helpers/images.helpers.ts`,
`helpers/findagrave.helpers.ts` und der Kartenabschnitt in
`public/javascripts/main.ts`.

## Bedienabläufe und Rechte

- `/burialSites/map` zeigt nach Friedhofsauswahl Grabstätten mit vollständigen
  Koordinaten. Ein Namensfilter schränkt die Marker anhand der Verstorbenen
  in den Kartenverträgen ein. Informationsfenster verlinken Grabstätte und
  Verträge. Angemeldete Leser dürfen die Karte verwenden.
- `/burialSites/gpsCapture` benötigt das unabhängige Recht zur Änderung von
  Friedhöfen. Die Suche filtert Friedhof, Grabstättenname und Koordinatenstatus.
  Das Gerät meldet fortlaufend Position und Genauigkeit. Erfassen speichert
  die Position mit acht Nachkommastellen und aktualisiert die Anzeige.
- `/burialSites/creator` benötigt dasselbe Änderungsrecht. Aus bis zu fünf
  Namenssegmentbereichen entsteht eine Vorschau neuer und bereits vorhandener
  Namen. Nach Wahl von Art und Status legt der Benutzer einzelne neue
  Grabstätten über die vorhandene Anlagefunktion an. Es gibt keine zusätzliche
  Massenanlagefunktion in der Quelle.
- Friedhofs- und Grabstättenformulare besitzen den Leaflet-Koordinatenpicker.
  Der Benutzer setzt einen Marker und übernimmt seine Koordinaten in das
  Formular; erst das Speichern des Fachformulars persistiert sie.
- Friedhofsansichten zeigen ihre SVG-Karte und geografische Position.
  Grabstätten zeigen vorrangig ihr zugeordnetes Rasterbild, sonst die
  Friedhofs-SVG mit hervorgehobener SVG-ID, sowie ihre geografische Position.
  Find-a-Grave-Verknüpfungen werden aus gespeicherten IDs lokal gebildet.

Alle APIs verwenden die vorhandene Anmeldung. Mutierende und lesende
POST-Aufrufe verwenden wie die übrige Cemaris-API den CSRF-Token.
Adminrechte allein ersetzen das unabhängige Fachänderungsrecht nicht.

## Kartenregeln aus der Quelle

Die Übersichtskarte liest ausschließlich direkte Grabstätten des gewählten
Friedhofs. Die GPS-Suche verwendet dagegen die vorhandene Grabstättensuche
einschließlich direkter Kindfriedhöfe und höchstens 500 Ergebnissen. Diese
beiden unterschiedlichen Umfänge bleiben erhalten.

Die Karte zählt alle aktiven direkten Grabstätten und liefert nur solche mit
beiden Koordinaten. Verträge zählen hier, wenn sie nicht gelöscht sind und
ihr Ende fehlt oder mindestens heute ist; zukünftige Vertragsanfänge sind
enthalten. Ohne Vertrag ist der Marker grün. Ein bereits begonnener regulärer
Vertrag macht ihn rot. Vorsorgeverträge und ausschließlich zukünftige
Verträge ergeben Gelb; Rot hat Vorrang. Der Namensfilter arbeitet mit einem
getrimmten, kleingeschriebenen Teilstring und ändert die Gesamtzähler nicht.

Quellbesonderheiten bleiben sichtbar: Die Kartenabfrage filtert logisch
gelöschte Beisetzungen nicht aus. Sie verbindet Namen mit `, ` und trennt sie
danach wieder an diesem Text. Vertragsende gleich heute zählt in der Karte,
auch wenn andere Quellverbraucher einen anderen Vergleich verwenden.
Diese Regeln werden in diesem Schritt nicht fachlich vereinheitlicht.

Leaflet verwendet dieselbe feste Version `2.0.0-alpha.1` wie die Referenz,
OpenStreetMap-Kacheln, Quellenangabe und die Quell-Zoomwerte. Der
Koordinatenpicker übernimmt `Number('') === 0`: leere Felder beginnen damit
bei 0/0. Der konfigurierte Bereichsmittelpunkt ist der Fallback für ungültige
Zahlen. Die Eingabegrenzen bleiben HTML-Formularregeln; die GPS-Aktualisierung
führt keine zusätzliche geografische Fachvalidierung ein.

Die Detailansichten verwenden wie die EJS-Quelle Wahrheitsprüfungen für
Koordinaten: 0 zählt dort als fehlend, während die Übersichtskarte nur NULL
prüft und 0 damit akzeptiert. Der Friedhofs-Elternfallback greift nur, wenn
beide eigenen Werte fehlen beziehungsweise falsy sind; der Elternhinweis
erscheint entsprechend der Quelle auch bei vorhandenen eigenen Koordinaten.

## Bereichsnamen und Konflikte

Die gesperrten Originalpakete `@cityssm/fill-block-range` 0.3.0 und
`just-cartesian-product` liefern die Vergleichswerte für Zahlen, Buchstaben,
Nullauffüllung und gemischte Blöcke. Alle fünf Segmentbereiche nehmen am
kartesischen Produkt teil. Ein fehlender Von-/Bis-Schlüssel lässt das Segment
leer; ein vorhandenes leeres Bis-Feld übernimmt Von. Ungültige beziehungsweise
zu große Bereiche liefern eine leere Vorschau. Die Grenze beträgt 1.000
Namenskombinationen.

Die konfigurierte Namensbildung aus Schritt 05 bestimmt die sichtbaren Namen
einschließlich Friedhofsschlüssel, Trennzeichen und optionaler Segmente.
Konfliktsuche erfolgt wie in der Quelle global über aktive Namen; sie wird
nicht auf den gewählten Friedhof eingeschränkt. Gelöschte Namen erscheinen
zunächst als neu. Die tatsächliche Anlage behält alle bestehenden Quell- und
SQL-FK-Prüfungen aus GRABSTAETTEN.md. Vorschau und Anlage bleiben getrennte
Operationen, sodass zwischenzeitliche Konflikte bei der Anlage gemeldet werden.

## Bilder, SVG und Konfiguration

`CEMARIS_CUSTOMIZATIONS_PATH` bezeichnet beim lokalen Betrieb den Ordner mit:

```text
public-internal/images/cemeteries/*.svg
public-internal/images/burialSites/*.{jpg,jpeg,png}
```

Die Auswahl berücksichtigt Dateiendungen ohne Unterschied der Schreibweise.
Dateinamen werden unverändert gespeichert. Auf Linux müssen Schreibweise und
Dateiname übereinstimmen. Dateien werden nur angemeldet ausgeliefert; die
API begrenzt Zugriffe auf das konfigurierte Bildverzeichnis. Es gibt keinen
neuen Uploadablauf. Eigene SVG-Dateien gehören wie in Sunrise zur
vertrauenswürdigen Betreiberkonfiguration.

Standardmäßig bleibt die Dateiauswahl bis zum Neustart gecacht. Mit
`CEMARIS_BURIAL_SITE_REFRESH_IMAGE_CHANGES=true` beziehungsweise
`CEMARIS_CEMETERY_REFRESH_IMAGE_CHANGES=true` wird sie beim Abruf neu eingelesen.
Das ersetzt die Add-/Unlink-Invalidierung der Quell-Dateiwatcher durch direkte
Verzeichnisabfragen. Die Originalprobe ruft aufgezeichnete Watcher-Callbacks
auf; sie behauptet keinen vollständigen Chokidar-Lauf.

Technische Anpassungen: Die Auswahl enthält ausschließlich echte Dateien
innerhalb des erlaubten Ordners; die Quelle listet auch Verzeichnisse mit
passender Endung. Die direkte Auslieferung verwendet CSP `sandbox` und
`nosniff`. Inline-SVG entfernt Skripte, Ereignisattribute, aktive Elemente,
Animationen und externe Ressourcen. Statische Geometrie, IDs und lokale
Definitionen bleiben erhalten. SVGs mit ausführbaren oder externen Inhalten
benötigen entsprechend eine statische Betreiberfassung.

Die SVG-Hervorhebung sucht zuerst die ganze ID. Fehlt sie, wird wiederholt das
letzte mit Bindestrich getrennte Stück entfernt. Ein Treffer und seine
Kindpfade erhalten die Quellhervorhebung. Diese Zuordnung ist eine SVG-ID,
keine Pixelposition im Rasterbild.

Compose bindet `${CEMARIS_CUSTOMIZATIONS_HOST_PATH:-./customizations}`
schreibgeschützt nach `/app/customizations` ein und verwendet diesen
Containerpfad. [customizations/README.md](../../customizations/README.md)
beschreibt die Bereitstellung. Der Docker-Laufnachweis bleibt offen.

## Find-a-Grave und spätere Verbraucher

Die URL-Helfer erzeugen Friedhofs-, Memorial- und Memorialsuchlinks lokal.
Die Suchlinks verwenden den gesperrten Namensparser und Jahre aus partiellen
Datumsangaben. Sie kontaktieren Find-a-Grave nicht. Die aktuelle Friedhofs-
oberfläche verlinkt vorhandene Friedhofs-IDs. Memorial-/Suchlinks werden in
der Quelle in der Vertragsansicht angezeigt; dieser Verbraucher und die
vollständigen Beisetzungsformulare gehören weiter zu Schritt 07/08.

Die GPS-Oberfläche besitzt keinen Vertragsstatusfilter. Ein manipulierter
Quellaufruf mit `contractStatus=occupied` oder `unoccupied` scheitert an der
fehlenden SQL-Spalte `contractCount`. Cemaris meldet hierfür kontrolliert
HTTP 400, statt den Quell-SQL-Fehler ungefiltert auszugeben. Fehlende Auswahl
und fehlende beziehungsweise ungültige Koordinaten erhalten die dokumentierten
Quellantworten oder einen konkreten JSON-Validierungsfehler.

Der zuvor als „Kartenstatusmodal“ vorgemerkte Dialog
`public/html/burialSite-editBurialSiteStatus.html` hat keinen Kartenverbraucher.
Die tatsächliche Quelle ist `workOrder.editRelated.ts` mit
`workOrders/doUpdateBurialSiteStatus` und Arbeitsauftragsänderungsrecht.
Die Einbindung bleibt deshalb ausdrücklich Schritt 10; der vorhandene
Grabstättenstatussetter aus 05 ist bereits implementiert.

Konkrete Prüfergebnisse, technische Abweichungen und verbleibende Nachweise
stehen in [Bericht 06](berichte/06.md). Vertrags-/Beisetzungsbearbeitung,
Druck, Portal und Betriebsadministration bleiben den Schritten 07–15 zugeordnet.
