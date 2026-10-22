# Beisetzungen und Dienstleistungen

Stand: Schritt 08, 20.10.2026. Grundlage ist Sunrise CMS am unveränderten
Commit `451ce034863b16502484367044f3e9b65370111a` (MIT). Implementierung:
`backend/cemaris/contract_items.py`, vorhandene Vertragslesehelfer in
`contracts.py` und React-Vertragsseiten in `frontend/src/contracts.tsx`.

## Bedienablauf und Quellzuordnung

Auf der Vertragsbearbeitungsseite lassen sich mehrere Personen/Beisetzungen
anlegen, ändern und entfernen. Die Dialoge übertragen Name, Anschrift,
Geburts-/Sterbedatum mit unbekannten Bestandteilen, Geburts-/Sterbeort,
Sterbealter und dessen Einheit, Behältnis, Tiefe und Find-a-Grave-ID.
Behältnisse sind nach Einäscherung gruppiert. Angaben werden als Text
ausgegeben; Postleitzahlen werden wie in der Quelle großgeschrieben.
Die Anzeige enthält vorhandene Memorial- bzw. Friedhofssuchlinks.

`database/{add,update,delete,get}ContractInterment.ts`, die sechs
Vertrags-POST-Handler, `contract.editInterments.ts` und die beiden
Interment-HTML-Dialoge sind die maßgeblichen Quellen. Die initiale Person
beim Anlegen/Kopieren eines Vertrags bleibt beim bisherigen Helfer aus 07;
die eigenständigen Dialoge haben ihre eigenen Quelldefaults und Grenzen.

Dienstleistungsarten werden aus dem Katalog gewählt und mit bis zu 500 Zeichen
Details verknüpft. Bereits zugeordnete Arten fehlen in der Auswahl. Nach dem
Hinzufügen bietet der Ablauf weitere verfügbare Arten an. Bearbeiten ändert
die Details, Entfernen löscht die Zuordnung weich, erneutes Hinzufügen
reaktiviert sie. Quellen: `database/*ContractServiceType.ts`, zugehörige
POST-Handler, `contract.editServiceTypes.ts`, Service-HTML-Dialoge und
`views/contracts/_edit-services.ejs`.

Die Quelle führt **keinen eigenen Termin pro Beisetzung oder Dienstleistungsart**.
Bestatter, Bestattungsleitung, Datum, Uhrzeit, Zufahrt und Zeremonie werden am
Vertrag gepflegt; die Uhrzeiteingabe verwendet 15-Minuten-Schritte und speichert
HHMM. Personen-/Dienstleistungsänderungen schreiben weder diese Stammdaten
noch Grabstättenstatus oder Kapazitäten um. Suche, Vertrags-/Grabstättenansicht
und Karten lesen die aktiven Personendaten erneut. Die Bestatteransicht zeigt
kommende Vertragstermine mit Personen und Dienstleistungen.

Die Quelldialoge bieten kein `intermentTypeId`-Feld. Die vorhandene Spalte
bleibt erhalten; es wird keine neue Auswahl oder fachliche Folgeregel erfunden.
Gebühren, Transaktionen, Arbeitsaufträge und Druck werden nicht mitbearbeitet.

## Daten, Datum und erhaltene Besonderheiten

- Beisetzungsnummern sind pro Vertrag `MAX(intermentNumber) + 1`, einschließlich
  gelöschter Zeilen. Löschen setzt Audit-/Löschfelder; die Nummer wird nicht
  wiederverwendet. Ein wiederholtes Löschen einer vorhandenen Beisetzung
  meldet wie die Quelle Erfolg. Änderung einer fehlenden/gelöschten Zeile
  liefert entsprechend dem Quellhandler Erfolg mit unveränderter aktiver Liste.
- Partielle Daten behalten YYYY0000/YYYYMM00 bzw. YYYYMMDD. Der gemeinsame Backendhelfer begrenzt Monat und
  Tag numerisch, prüft jedoch keinen Kalender. Die Oberfläche begrenzt
  Kalendertage, Schaltjahre, Sterbedatum bis heute und Sterbedatum ab Geburt.
  Im eigenständigen Dialog darf ein Geburtsjahr bis 9999 erfasst werden;
  die initiale Vertragsanlage behält ihre abweichende Quellgrenze.
- Altersberechnung mit unvollständigem Datum: Differenz der Jahre; mit allen
  Bestandteilen: volle lokale Tage und `floor(Tage / 365.25)`. Unter einem Jahr
  erscheinen Tage, bei null/negativen Tagen bzw. Jahren `0 Stillborn`. Das ist
  keine nachträgliche versicherungsmathematische Altersregel. Die Einheiten
  `Years`, `Months`, `Days`, `Stillborn` bleiben als Quellwerte erhalten.
  Konkrete Quellanomalien: 29.02.2000 bis 28.02.2001 ergibt `365 Days`,
  zwei Kalendertage über den Berliner Beginn der Sommerzeit können einen
  vollen Laufzeittag ergeben. Das Altersfeld behält die Quellobergrenze 150;
  ein berechneter Tageswert darüber muss vor dem Speichern angepasst werden.
- Gelöschte Behältnis-/Tiefenkataloge bleiben in vorhandenen Personendaten
  sichtbar. Der Bearbeitungsdialog erhält ein gelöschtes Behältnis und eine
  unbekannte/fehlende Alterseinheit. Eine gelöschte Tiefe wird in der Quelle
  nicht als Sonderoption ergänzt und beim nächsten Speichern geleert; diese
  konkrete Formularanomalie bleibt erhalten.
- Dienstleistungslesen blendet gelöschte Katalogarten aus. Der Quellhelfer zum
  Hinzufügen prüft `recordDelete_timeMillis === undefined`, obwohl SQL NULL
  liefert. Deshalb überschreibt auch direktes erneutes Hinzufügen einer
  aktiven Art die Details und protokolliert `created`. Das ist erhalten;
  die normale Oberfläche bietet nur noch nicht zugeordnete Arten an.
- Dienstleistungsänderung/-löschung wirkt nur auf aktive Zuordnungen;
  ein zweites Löschen meldet keinen Erfolg. Reaktivierung bewahrt die
  ursprünglichen Erstellungsdaten. Audits gehören zum Vertrag und nennen
  `ContractInterments`/`ContractServiceTypes` samt Zeilenindex.

## API, Rechte und technische Unterschiede

Angemeldete Leser dürfen `GET /api/contracts/{id}/interments` und `/services`
abrufen. Änderungen benötigen unabhängig von Administrator- oder
Friedhofsrechten `canUpdateContracts` und einen `X-CSRF-Token`:

| Operation | POST-Pfad unter `/api/contracts/{id}` |
| --- | --- |
| Person hinzufügen | `/interments` |
| Person ändern / entfernen | `/interments/{number}` / `/interments/{number}/delete` |
| Dienstleistung hinzufügen | `/services` |
| Details ändern / Zuordnung entfernen | `/services/{serviceTypeId}` / `/services/{serviceTypeId}/delete` |

Die sechs `doAdd/Update/DeleteContractInterment/ServiceType`-Aliase unter
`/api/contracts` verwenden denselben Code. Rückgaben enthalten `success` und
die aktuelle `contractInterments`- bzw. `contractServiceTypes`-Liste; erfolglose
Quelloperationen liefern kontrollierte API-Fehler mit einer Fehlermeldung.
Die Quellaliase behalten bei fehlgeschlagener Dienstleistungsänderung/-löschung
HTTP 200 mit `success:false` bei, die REST-Pfade liefern dafür HTTP 400.
Fehlgeschlagene Beisetzungslöschung bleibt HTTP 400 mit `Interment not found`.
Unvollständige bzw. SQL-ungültige Eingaben liefern kontrolliert HTTP 400;
die Quelle wirft teilweise HTTP 500. Der aktive
Elternvertrag wird geprüft; über Pfad und Datensatzschlüssel wird kein fremder
Vertrag geändert. Schreibvorgang, Audit und Rücklesung sind atomar.

SQL Server erzwingt Typen, Längen und Fremdschlüssel. Ungültige Verweise,
zu lange Texte sowie nicht endliche/nicht ganzzahlige/zu große Zahlen liefern
kontrollierte Fehler ohne Teiländerung. Bei partiellen Daten wird das
**Ergebnis** geprüft: Bruchteile, die ein ganzzahliges YYYYMMDD ergeben,
bleiben speicherbar; ein verbleibender Bruchteil wird zurückgewiesen.
Die Browserformulare nehmen ganzzahlige Datumsbestandteile an.

Konkreter SQL-Unterschied: `updateContractInterment` speichert `deathAge=''`
als SQLite-TEXT, während Anlage NULL speichert. Das Cemaris-BIGINT-Feld kann
diesen Textzustand nicht halten. Anlage **und Änderung** speichern dafür NULL;
die sichtbare leere Altersangabe bleibt leer, niemals implizit 0.
SQL-Numerikgrenzen sind auch für andere heterogene SQLite-Werte sichtbar.
Schema und Migration bleiben unverändert bei Revision 0001.

Es gibt keine neuen Abhängigkeiten oder Konfigurationsschalter. Bestehende
Vertrags-/Adress-/Auditoptionen gelten weiter. Die Datumsrechnung verwendet
wie die Quelle die lokale Laufzeit-Zeitzone. Docker/Ubuntu und externe
Integrationen bleiben nach den bisherigen Berichten ungeprüft.

## Reproduzierbarer Nachweis

`node scripts/reference_contract_items.mjs --check-fixture` führt feste
Originalfunktionskörper auf dem ursprünglichen SQLite-Schema als Quellorakel
aus. Quellcommit/-hashes und Paketintegrität werden geprüft; diese SQLite-
Verwendung ist kein Zieldatenbanktest. Ergebnisse liegen synthetisch in
`backend/tests/fixtures/contract-items-reference.json` und werden auf echtem
SQL Server verglichen. Abweichende Speicherfälle werden ausdrücklich geprüft.

`test_contract_items.py` und `test_contract_items_reference.py` ergänzen
SQL-/HTTP-/Rollen-/CSRF-/Auditfälle. `scripts/qa_contract_items_browser.py`
prüft Produktionsbuild und echte API auf einer neuen entbehrlichen Datenbank;
Nachweise und genaue Ergebnisse stehen in [Bericht 08](berichte/08.md).
