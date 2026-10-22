# Eigene Karten und Grabstättenbilder

Die API liest Friedhofskarten aus `public-internal/images/cemeteries/*.svg`
und Grabstättenbilder aus `public-internal/images/burialSites/` (`jpg`, `jpeg`,
`png`; Dateiendungen unabhängig von Groß-/Kleinschreibung).

Für lokalen Betrieb zeigt `CEMARIS_CUSTOMIZATIONS_PATH` auf diesen Ordner.
Docker Compose bindet diesen Ordner schreibgeschützt nach `/app/customizations`
ein. Ein anderer Hostordner kann mit `CEMARIS_CUSTOMIZATIONS_HOST_PATH` gewählt
werden. Dateinamen und Groß-/Kleinschreibung müssen mit den gespeicherten
Zuordnungen übereinstimmen, insbesondere beim späteren Ubuntu-Betrieb.

SVG-Dateien stammen wie in Sunrise aus der vertrauenswürdigen
Administrationskonfiguration. Sie werden als Karten in die angemeldete
Oberfläche eingebunden. SVG-IDs verbinden Grabstätten mit Kartenelementen;
fehlt eine genaue ID, werden nacheinander die letzten Bindestrichsegmente
entfernt, bis ein Element gefunden wird.

Es gibt keinen Karten-Upload in diesem Portierungsschritt. Dateien werden
vom Betreiber im konfigurierten Verzeichnis bereitgestellt. Synthetische
Browserfixtures liegen ausschließlich unter `.local/qa-step06/`.
