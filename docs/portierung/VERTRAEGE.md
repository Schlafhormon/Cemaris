# Bestatter, Verträge und Beteiligte

Schritt 07 überträgt die Bestatterverwaltung und die Vertragsstammdaten aus
Sunrise `451ce034863b16502484367044f3e9b65370111a` nach FastAPI/React.
SQL-Server-Schema und Alembic-Revision bleiben unverändert bei `0001`.
Die ursprünglichen MIT-Hinweise stehen in den neuen Modulen und den
vorhandenen Lizenzdateien. Die Anwendung heißt Cemaris.

## Zuständigkeiten und API

`backend/cemaris/funeral_homes.py` enthält Bestatterstammdaten,
Listen mit Anzahl kommender Bestattungen, Navigation, Löschung,
Wiederherstellung und Vorschläge für Bestattungsleiter.
`backend/cemaris/contracts.py` enthält Vertragsanlage/-änderung, Suche,
Details, Nummern, Zusatzfeldwerte, Kommentare, Kopieren und Verknüpfungen.
`frontend/src/contracts.tsx` bildet die zugehörigen Seiten und Dialoge ab.
Die vorhandenen Grabstätten- und Richtungsfunktionen werden wiederverwendet.

| Aufruf | Inhalt / Recht |
| --- | --- |
| `GET /api/funeral-homes` | Aktive Bestatter, kommende Bestattungen; angemeldet |
| `GET /api/funeral-homes/options` | Defaults, Adressbeschriftung und optionale Anzeigen; angemeldet |
| `GET /api/funeral-homes/new` | Anlagevorbereitung; Vertragsänderungsrecht |
| `GET /api/funeral-homes/{id}` | Details und kommende Verträge; gelöschte Bestatter nur mit Vertragsänderungsrecht |
| `GET /api/funeral-homes/{id}/edit` | Aktiver Bestatter; Vertragsänderungsrecht |
| `POST /api/funeral-homes` | Anlage; Vertragsänderungsrecht |
| `POST /api/funeral-homes/{id}/update` bzw. `/delete` | Änderung/Löschung; Vertragsänderungsrecht |
| `POST /api/funeral-homes/{id}/restore` | Wiederherstellung ausschließlich als Administrator |
| `GET /api/contracts/meta` | Kataloge und Vertragskonfiguration; angemeldet |
| `GET /api/contracts/new?burialSiteId=...` | Defaults und optionale Grabstättenvorbelegung; Vertragsänderungsrecht |
| `GET /api/contracts` bzw. `POST /api/contracts/doSearchContracts` | Suche mit Quellefiltern und Pager; angemeldet |
| `GET /api/contracts/{id}` | Details samt vorhandener verknüpfter Fachdaten; angemeldet |
| `GET /api/contracts/{id}/next` bzw. `/previous` | Navigation nach Vertragsnummer; angemeldet |
| `POST /api/contracts/doCreateContract`, `doUpdateContract`, `doDeleteContract`, `doCopyContract` | Vertragsänderungsrecht |
| `POST /api/contracts/doAddContractComment`, `doUpdateContractComment`, `doDeleteContractComment` | Kommentare; Vertragsänderungsrecht |
| `POST /api/contracts/doGetPossibleRelatedContracts`, `doAddRelatedContract`, `doDeleteRelatedContract` | Suche und beidseitige Verknüpfung; Vertragsänderungsrecht |
| `POST /api/contracts/doGetFuneralDirectors` bzw. `doGetBurialSiteDirectionsOfArrival` | Bestattungsleiter und Zufahrten; Vertragsänderungsrecht |
| `POST /api/contracts/doGetRecordAuditLog` bzw. `/api/funeralHomes/doGetRecordAuditLog` | Datensatzbezogenes Audit bei aktivierter Konfiguration; Vertragsänderungsrecht |

Alle POSTs benötigen die vorhandene Sitzung und `X-CSRF-Token`. Die
Administratorrolle allein gewährt keine Vertragsänderung. Wiederherstellung
eines Bestatters ist ein eigenständiges Administratorrecht. Für Verträge
existiert in Sunrise kein Wiederherstellungsendpunkt. Gelöschte Verträge
bleiben aus den Fachansichten ausgeblendet.

## Erhaltene Regeln

Bestatterfilter durchsuchen alle durch Leerzeichen getrennten Teile in Name
und beiden Adresszeilen, ohne Groß-/Kleinschreibung. Stadt, Telefon und
interner Schlüssel gehören nicht dazu. Die Anzeige kommender Bestattungen
zählt aktive Vertragsdatensätze mit Bestattungsdatum ab heute, unabhängig vom
Vertragsende. Die Bestatterlöschung ist dagegen nur gesperrt, wenn ein solcher
Vertrag zusätzlich kein Ende oder ein Ende ab heute hat. NULL-Bestattungsdaten
sperren nicht. Bestehende Vertragsreferenzen und historische Daten bleiben
bei Bestatterlöschung bestehen. Postleitzahlen werden großgeschrieben; der
Bestatterschlüssel wird bei einer normalen Änderung nicht geändert.
Navigation überspringt gleiche Namen und gelöschte Bestatter.

Vertragssuche erhält Nummern-/Personen-/Grabstättensuche, Typen, Friedhöfe
einschließlich direkter Kinder, Bestatter, Zeiträume, Start-/Wirksamkeitsdatum,
Dienstleistung, Arbeitsauftrags- und Vertragsverknüpfungsfilter. Die
Quellsortierung und die unterschiedliche Behandlung von numerischem `-1`
und Text `"-1"` als Limit werden nachgewiesen. Nummernsuche verwendet
SQLite-LIKE-kompatible ASCII-Faltung und die Quellwildcards `%`/`_`.
Andere Namenssuchen verwenden die bestehenden gemeinsamen Suchhelfer.

Die Vertragsnummer beginnt mit dem laufenden Jahr und wird innerhalb der
konfigurierten Länge fortgezählt; gelöschte Verträge belegen ihre Nummer
weiter. Auch die Binary64-Rundung bei sehr langen Nummern, Exponentialnotation
und die Sättigung von SQLite-Integer-Casts bei der Vorauswahl sind erhalten.
Vorhandene Nummern bleiben beim Bearbeiten erhalten. Neue Verträge
verwenden die Stadt-/Provinzdefaults der Anwendung. Ein im Anlageformular
erfasster neuer Bestatter wird gemeinsam mit dem Vertrag gespeichert.
Die initiale Personen-/Beisetzungszeile des Anlageformulars gehört zum
Vertragsanlageablauf; ihre spätere eigenständige Bearbeitung bleibt Schritt 08.

Zusatzfeldwerte werden angelegt, aktualisiert, bei Leerwert gelöscht und bei
erneutem Wert wieder aktiviert. Die Detailansicht erhält gespeicherte aktive
Werte auch von fremden Typen und gelöschten Felddefinitionen. Aktive gemeinsame
und aktuelle Typfelder ohne Wert werden als Leerfelder ergänzt. Feldsortierung,
Text-/Datums-/Auswahlregeln und Browservalidierung folgen dem vorhandenen
Katalogvertrag aus Schritt 04.

Die dynamischen Zusatzfelder im neuen Vertragsformular heißen in der Quelle
`contractFieldValue_ID`; `addContract.ts` erwartet jedoch `fieldValue_ID`.
Dadurch gehen ihre eingegebenen Werte beim Anlegen verloren. Diese konkrete
Quellanomalie bleibt im React-Anlageablauf sichtbar erhalten. Das anschließende
Bearbeitungsformular verwendet die korrekten Quellnamen und speichert Werte.
Direkte API-Anlage mit `fieldValue_ID` funktioniert ebenfalls wie der
Quell-Datenbankhelfer. Der Browsernachweis prüft beide Seiten ausdrücklich.

Kopieren ist ein festgelegter Quellablauf ohne zusätzliche Kopieroptionen:
neue Nummer, Beginn heute, offenes Ende; Käufer, Grabstätte, Typ und
Bestattungsdaten werden übernommen. Zufahrt und Beisetzungsart werden
zurückgesetzt. Angezeigte Zusatzfelder einschließlich ergänzter Leerwerte
und aktive Personen werden kopiert. Bei Personen bleiben die Quelllücken
erhalten: Tiefe und Find-a-Grave-ID werden nicht übernommen. Gebühren,
Dienstleistungen, Zahlungen, Anhänge und frühere Kommentare werden nicht
kopiert. Ein neuer Herkunftskommentar und eine beidseitige Vertragsverknüpfung
werden angelegt.

Verknüpfungen werden als geordnetes ID-Paar gespeichert und von beiden
Verträgen gelesen. Selbstverknüpfung und doppelte Paare scheitern wie in der
Quelle an den Datenbankbedingungen. Die Vertragslöschung ist bei aktiven
Arbeitsaufträgen mit offenem Ende oder Abschlussdatum ab heute gesperrt.
Erlaubte Löschung markiert Vertrag, Zusatzfeldwerte und Kommentare; andere
Kinddatensätze werden entsprechend der Quelle erhalten.

## Konfiguration

| Variable | Quelldefault / Bedeutung |
| --- | --- |
| `CEMARIS_CONTRACT_NUMBER_LENGTH` | `10`; Länge automatisch erzeugter Vertragsnummern |
| `CEMARIS_CONTRACT_BURIAL_SITE_ID_IS_REQUIRED` | `true`; Pflichtauswahl der Grabstätte im Formular |
| `CEMARIS_CONTRACT_END_DATE_IS_AVAILABLE` | `true`; Vertragsende verfügbar |
| `CEMARIS_CONTRACT_END_DATE_IS_REQUIRED` | `false`; Vertragsende im Formular erforderlich |
| `CEMARIS_ADDRESS_LABELS` | `ca`; alternativ `us` für State/ZIP-Beschriftung |

Die bereits vorhandenen Einstellungen `defaults.city`/`defaults.province`,
`CEMARIS_AUDIT_LOG_ENABLED` und `CEMARIS_PORTAL_ENABLED` werden weiterverwendet.
Die vorhandene lokale `.env` wird nicht überschrieben. Formularpflichten
werden wie in der Referenz im Browser geprüft; relationale Integrität und
SQL-Typ-/Längengrenzen gelten zusätzlich auf dem Server.

## Quellanomalien und technische Unterschiede

- Das Wirksamkeitsdatum schließt bei offenem Vertragsende auch einen zukünftig
  beginnenden Vertrag ein. Die Klammerung der Quelle bleibt erhalten.
- Ein Vertrag mit Ende genau heute gilt in der Detailanzeige als inaktiv;
  der Filter `current` umfasst denselben Tag. Diese bereits festgestellte
  Asymmetrie bleibt erhalten.
- Interne Antworten sind JSON mit dem vorhandenen einheitlichen Fehlerformat.
  Browserweiterleitungen und HTML-Fragmente werden durch React umgesetzt.
  Ungültige IDs, Typgrenzen und verletzte Beziehungen werden kontrolliert
  zurückgewiesen. Schreibabläufe verwenden eine SQL-Transaktion, damit ein
  abgewiesener Teilschritt keine halbe Vertragsanlage hinterlässt.
- Die SQL-Server-Zeichen-/Ganzzahlgrenzen, Binärkollation und technischen
  Suchunterschiede aus DATENSEMANTIK.md gelten weiter. Die Zielnachweise
  verwenden echten SQL Server. Die isolierte Originalprobe verwendet SQLite
  ausschließlich als Quellorakel.
- Bestatternamen und Bestattungsleitervorschläge werden für Reihenfolge und
  Gruppierung als unveränderte Zeichenfolgen behandelt. Dadurch bleiben
  nachgestellte Leerzeichen und die Reihenfolge von BMP-/Supplementärzeichen
  wie in SQLite erhalten. Vertragsnavigation verwendet denselben Vergleich;
  Vertragsfilter laufen auf SQL Server, die Quellsortierung erfolgt vor dem
  Paging in Python. Nur die ausgewählte Seite lädt ihre Kinddaten. Dafür
  müssen die passenden Vertragsstammsätze zunächst vollständig gelesen werden;
  dies ist eine bewusste technische Abweichung vom SQL-Paging der Quelle.
- Vorhandene Beisetzungen, Dienstleistungen, Gebühren, Zahlungen, Anhänge und
  Arbeitsaufträge sind in Vertragsdetails lesbar. Ihre Bearbeitung, Berechnung,
  Dateiauslieferung und Druckrenderer bleiben den Schritten 08–11 zugeordnet.
  Find-a-Grave-Links werden mit den vorhandenen Helfern aus 06 berechnet.
- Portalbestellungen/-synchronisation und ConsignO-Verbraucher bleiben 13/14.
  Ihre Existenz und Metadaten werden nicht durch Testaufrufe an externe Dienste
  ersetzt. Docker/Ubuntu und externe Authentifizierungsdienste bleiben live
  ungeprüft.

Konkrete Originalproben, SQL-/Browserprüfungen und ihre Grenzen stehen in
[Bericht 07](berichte/07.md) und im [Funktionsnachweis](UMFANG.md).
