# Gebühren und Transaktionen

Schritt 09 überträgt den festen Sunrise-Stand
`451ce034863b16502484367044f3e9b65370111a`. Katalogverwaltung stammt aus 04,
Vertragsstammdaten aus 07. Die eigenständigen Finanzoperationen stehen in
`backend/cemaris/contract_finance.py`, die Oberfläche in
`frontend/src/contract-finance.tsx`, eingebunden durch `contracts.tsx`.
Es gibt keine Schemamigration und keine neue Laufzeitabhängigkeit.

## Gebührenauswahl und Beträge

`doGetFees` ermittelt aktive Kategorien/Gebühren passend zur gespeicherten
Vertrags- und Grabstättenart. Nicht zugeordnete Arten sind Wildcards.
Die Suche verwendet alle durch Leerzeichen getrennten, kleingeschriebenen
Teilwörter in Kategorie, Gebührenname und Beschreibung. Bereits zugeordnete
Gebühren ohne Mengeneingabe erscheinen nicht erneut in der Einzelauswahl.
Gruppierte Kategorien werden als Ganzes hinzugefügt. Der Quellschreibweg für
Gruppen lädt deren aktive Gebühren ohne den Vertragsartfilter; diese Asymmetrie
bleibt erhalten. Die erstmalige Auswahl verlangt gespeicherte Stammdaten.

Die Gebührenposition speichert **Einzelbetrag, Einzelsteuer und Menge**.
`feeFunction` ist im Original ein Platzhalter: jede nicht leere Zeichenfolge
ergibt den Gebührenbetrag **0**. Weder ein Ausdrucksinterpreter noch ein
Neuberechnungsendpunkt existiert am festen Commit. Andere Funktionen oder ein
Recalc-Knopf wären eine fachliche Erweiterung und wurden nicht erfunden.
Ohne Funktion gilt `feeAmount ?? 0`. Eine von null verschiedene
`taxPercentage` berechnet `feeAmount * (taxPercentage / 100)`; ansonsten gilt
`taxAmount ?? 0`. Das bewahrt auch negative Prozente und feste Steuern bei
einem Funktionsbetrag von 0.

Bei leerem/fehlendem Formularbetrag berechnet der Server aus dem Katalog.
Bei ausdrücklich übergebenem Betrag verarbeitet das Original nur **Strings**
als Zahlen; ein JSON-Zahlenbetrag wird 0. Dasselbe gilt für die ausdrücklich
übergebene Steuer. Beim manuellen Browserbetrag wird keine Steuer
übergeben: sowohl eine Prozentsteuer als auch eine feste Katalogsteuer
werden in diesem Pfad 0. Diese ungewöhnlichen Quellregeln sind erhalten.

Erneutes Hinzufügen derselben Gebühr hat drei mögliche Ergebnisse:

- Gleiche Einzelbeträge und Steuern: Menge wird addiert.
- Unterschiedliche Einzelbeträge oder Steuern: bisherige und neue
  Mengenbeträge werden addiert, die resultierende Menge wird **1**.
- Gelöschte Position: alter Tombstone wird physisch entfernt und eine neue
  Position einschließlich neuer Erstellungsdaten angelegt.

Eine reine Mengenänderung schreibt wie im Original **keinen Auditlogeintrag**.
Sonstige Anlagen, Zusammenführungen und Löschungen verwenden bei aktiviertem
Audit die vollständigen Quell-Differenzen. Wiederholte Löschungen derselben
Position liefern erneut Erfolg. Bereits zugeordnete Gebühren bleiben auch
nach Kataloglöschung mit ihren Katalogbezeichnungen lesbar.
Eine neue automatische Anlage mit fehlender/gelöschter Einzelgebühr löst
im Original einen 500-Fehler aus; Cemaris liefert kontrolliert 400.

## Summen und Rundung

Speicherung und Rechenoperationen verwenden Binary64 gemäß Schritt 02:
keine Rundung auf DECIMAL-Skalen. Zwischensumme ist die Summe von
`feeAmount * quantity`, Steuer die Summe von `taxAmount * quantity`,
Gesamtsumme deren Addition. Der Transaktionsdialog berechnet seine offene
Summe wie der ursprüngliche Browser separat aus
`sum((feeAmount + taxAmount) * quantity) - sum(transactionAmount)`.
Diese Reihenfolgen können sich an der letzten Binärstelle unterscheiden.
Erst die Darstellung verwendet JavaScript `toFixed(2)` und die vorhandene
Dollar-Kennzeichnung; es wurde keine neue Währung oder Steuerregel eingeführt.

Die gemeinsamen Vertragshelfer übertragen zusätzlich Kategoriegleichheit/
Kategorie-Teilzeichenfolge ohne Groß-/Kleinschreibung, Feldwertsuche nach
Feldbezeichnung und geordnete Addition der Transaktionsbeträge.
Spätere Druck-/Integrationsverbraucher bleiben ihren Schritten zugeordnet.

## Transaktionen

Anlage, Änderung und Entfernung speichern Betrag, Zahlungs-/Rechnungsflag,
externe Belegnummer sowie Notiz. Bei Anlage gelten aktuelle lokale
Prozesszeit und aktuelles Datum, wenn kein Wert mitgegeben wird; die
Bearbeitung bietet Datum und Uhrzeit (HHMM-Speicherung) an. Die Nummerierung
beginnt pro Vertrag bei **0** und berücksichtigt auch gelöschte Zeilen.
Anzeige sortiert nach Datum, Uhrzeit und Index.
Eine ausdrücklich ungültige Uhrzeit bei Anlage wird durch den Quellfallback
zu **00:00**; bei Änderung fehlt dieser Fallback und die Aktion scheitert.
Der Quellhandler einer Änderung meldet auch bei fehlender Zeile Erfolg mit
unveränderter Liste; die eigentliche Datenfunktion liefert dabei false.

Der Anlagedialog schlägt den offenen Betrag vor. Seine HTML-Grenzen sind
`min = -bisherige Transaktionssumme` und `max = max(offener Betrag, 0)`;
auch Rechnungsbeträge zählen zur Transaktionssumme. Der Änderungsdialog
besitzt wie die Quelle keine solchen min/max-Grenzen. Der Server führt keine
zusätzliche Zahlungsobergrenze ein. Negative Beträge und Beträge mit mehr
Nachkommastellen bleiben per API darstellbar. Das Rechnungsflag ändert
keinen Vertragsabschluss und keine Grabstättenbelegung.

Die Belegnummer bleibt bei höchstens 100 UTF-16-Einheiten, Notizen sind
mehrzeiliger Literaltext. Mengen-/Finanzdialoge erhalten unabhängige
ungespeicherte Vertragsfelder. Nach dem Speichern werden die Finanzlisten
aktualisiert; Stammdaten werden durch Kindoperationen nicht mitgeschrieben.

## API, Rechte und technische Grenzen

Alle Finanzschreibwege und die Quell-Katalogauswahl verlangen unabhängig
von der Administratorrolle `canUpdateContracts` und CSRF. Angemeldete Leser
können Gebühren und Transaktionen abrufen. Quellaktionsnamen bleiben unter
`/api/contracts/` vorhanden:

| Aktion | Quellname |
| --- | --- |
| Gebührenkatalog laden | `doGetFees` |
| Gebühr / Gruppe hinzufügen | `doAddContractFee`, `doAddContractFeeCategory` |
| Menge ändern / Position löschen | `doUpdateContractFeeQuantity`, `doDeleteContractFee` |
| Transaktion anlegen / ändern / löschen | `doAddContractTransaction`, `doUpdateContractTransaction`, `doDeleteContractTransaction` |

Daneben stehen vertragsbezogene REST-Pfade für React zur Verfügung.
Pfad-IDs überschreiben mitgesendete Formular-IDs. Aktive Eltern werden
vor jeder Operation geprüft. SQL-Server-Fremdschlüssel, Längen- und
Ganzzahlgrenzen gelten weiterhin. Nicht endliche Beträge, unzulässige
JSON-Strukturen und nicht speicherbare Datums-/Zeitwerte erhalten kontrollierte
Fehler. SQLite kann leere/fehlerhafte numerische Werte als TEXT und weitere
Rechnungsflags speichern; SQL Server FLOAT/BIT verlangen Zahlen und 0/1.
Diese konkreten Eingaben werden mit 400 abgewiesen. Jede HTTP-Schreibaktion einschließlich einer kompletten
Gebührengruppe läuft in einer atomaren Transaktion.
Explizit leere Rechnungsflags werden ebenfalls abgewiesen; nur fehlend/NULL
erhält den Quellstandard 0. Die Zahlenerkennung verwendet ASCII-Dezimal-/
Exponentschreibweise und ASCII-Randwhitespace; Python-Sonderformen wie
Unterstriche oder Unicodeziffern werden nicht in andere Zahlen umgedeutet.
Boolesche JSON-Zahlwerte werden wie ungültige node:sqlite-Bindings abgewiesen.

Dynamics-GP-Belegsuche und -Abgleich sind seit Schritt 14 verbunden
([DYNAMICS_PORTAL.md](DYNAMICS_PORTAL.md)). Druck 11,
ConsignO/Benachrichtigungen 13 und Arbeitsaufträge 10 werden hier nicht
als implementiert ausgewiesen. Der Docker-/Ubuntu-Nachweis ist ausstehend.

## Nachweise

`scripts/reference_contract_finance.mjs` führt die tatsächlichen gefrorenen
Gebühren-/Transaktionsmodule, Berechnungshelfer und relevanten Lock-Pakete
isoliert aus. SQLite ist ausschließlich das Quellorakel.
Im Gebührenpfad werden `@cityssm/utils-datetime` 1.4.1 und
`@cityssm/object-difference` 0.1.0 ausgeführt. `sunrise-cms-shared` enthält an
diesem Stand keine aufgerufene Gebührenformel; seine OrderForm-/Portal-
Verbraucher sind seit Schritt 14 verbunden.
`backend/tests/test_contract_finance*.py` vergleichen Speicherung und
HTTP-Verhalten auf eigenen entbehrlichen SQL-Server-Datenbanken.
`scripts/qa_contract_finance_browser.py` startet Produktionsbuild und echte
API auf einer frischen Testdatenbank und prüft die React-Bedienabläufe.
Ausgeführte Befehle, Ergebnisse, Quellgrenzen und ausstehende Nachweise
stehen in [Bericht 09](berichte/09.md).
