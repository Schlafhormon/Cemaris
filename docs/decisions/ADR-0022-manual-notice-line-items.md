# ADR-0022: Manuelle Gebührenpositionen mit exakter Summe und vollständiger Ausgabe

- Datum: 09.09.2026
- Status: Accepted
- Grundlage: [Produktvertrag M3a](../requirements/manual-notice-line-items-decisions.md)
- Nachweis: [M3a-Abschluss](../implementation/cemaris-manual-notice-line-items-completion.md)

## Kontext

ADR-0018 speichert einen manuell eingegebenen Gesamtbetrag, ADR-0019 erzeugt
eine einzelne Gebührenzeile. M3a bestätigt mehrere positive Positionen und
ihre verbindliche Addition. Eine Positionsmaske über einer frei änderbaren
Summe würde diesen Vertrag verletzen. Die bestehenden Nummern, Revisionen
und Gesamtbetragsentwürfe müssen unverändert erhalten bleiben.

## Entscheidung

Das bestehende Entwurfsaggregat erhält `LegacyTotal` und `LineItems`.
Bestand und alte Revisionen erhalten ausschließlich den Modusdefault; es
werden keine Positionen erfunden. Die additive Migration
`20260909093624_AddManualNoticeDraftLineItems` ergänzt zwei Tabellen:
aktuelle Positionen mit stabiler ID und revisionsgebundene Positionssnapshots.
Historische Positions-IDs referenzieren keine veränderbare aktuelle Zeile.
Eindeutige Indizes schützen die Reihenfolge innerhalb des jeweiligen Stands.

Im Positionsmodus gelten 1 bis 100 Positionen, getrimmte Bezeichnungen mit
1 bis 500 Zeichen ohne Steuerzeichen und positive EUR-Beträge mit höchstens
zwei Nachkommastellen. Die Obergrenze für Position und Summe ist
`9999999999999999.99`. Reihenfolge ist die Reihenfolge des vollständigen
Requestarrays; neue IDs erzeugt der Server. Fremde, leere und doppelte IDs
werden abgewiesen. Eine einzelne Entwurfsversion schützt Kopf und alle Zeilen.

Neue additive Commands verlangen Dezimalstrings mit Punkt, ohne Gruppierung
oder Exponent. Ein Requestbetrag als JSON-Zahl und zusätzliche Felder wie
eine frei eingegebene Summe werden abgewiesen. `amountExact` und
`totalAmountExact` ergänzen den Lesevertrag; vorhandene numerische Felder
bleiben bestehen. Der Browser rechnet in ganzzahligen Cents mit `BigInt`.
Der alte Betragrequest akzeptiert zusätzlich Strings, damit auch eine
Bestandskorrektur ohne Genauigkeitsverlust übertragen werden kann.

Anlage, vollständige begründete Korrektur und ausdrücklich bestätigte
Bestandsumstellung verwenden das bestehende Aggregat und seine Fachhistorie.
Die Umstellung erhält ID, Nummer und Nummernsnapshot. Es gibt keine
Rückumstellung. Der alte Korrekturweg weist Positionsentwürfe mit 409 ab,
auch bei ausgeschalteter Positionsbearbeitung. Verwerfen bewahrt die Zeilen.

SQL verwendet eine Serializable-Transaktion. Bei Korrektur werden zuerst
Kopfversion und Löschung der aktuellen Zeilen gespeichert; anschließend
werden die vollständige neue Reihenfolge, Revision und Audit eingefügt.
Beide Speicheraufrufe liegen in derselben Transaktion: Vertauschungen
kollidieren nicht mit dem Positionsindex und Nachweisfehler rollen alles
zurück. Bei Anlage gehört die Nummernsequenz zur Transaktion. Versionsrennen
und verschachtelte SQL-1205-Fehler werden als Konflikt klassifiziert.
Auch der Ausgabeabruf klassifiziert einen Deadlock als Versionskonflikt.
Synthetic bereitet unabhängige Revisionslisten und validierte Nachweise vor
der Veröffentlichung unter dem bestehenden Coordinator vor.

Mutationsergebnisse tragen einen innerhalb der Speicherung erzeugten
unveränderlichen Antwortsnapshot. Die API lädt den Entwurf nach dem Commit
nicht erneut; Antwortkörper und ETag gehören damit zur selben Version.
Technische Audits enthalten keine Beträge oder Fachtexte.

`Features:NoticeDraftLineItemsEnabled` ist standardmäßig aus, ausschließlich
in Development zulässig und benötigt `NoticeDraftEditingEnabled`.
`NoticeGenerationEnabled` bleibt unabhängig vom neuen Bearbeitungsschalter:
gespeicherte Positionen sind bei erlaubter Ausgabe immer vollständig.
Bestehende Cookie-, Rollen-, CSRF- und ETag-Prüfungen bleiben maßgeblich.

Der Renderer erhält geordnete strukturierte Zeilen. Die unveränderte
synthetische DOCX-Fixture enthält bereits einen passenden `w:tr`-Prototyp.
Vor Expansion muss jeder der 23 erlaubten Tokens genau einmal vorkommen;
beide Positionstokens müssen gemeinsam in genau dieser Tabellenzeile stehen.
Andere Tokens in dieser Zeile, mehrdeutige oder verschachtelte Zeilen und
unsicher wiederholbare Strukturen werden abgewiesen. Nur diese Zeile wird
kopiert, Texte werden über OpenXML-Textknoten eingesetzt. Feste Zeilenhöhen
werden entfernt und zusammengehörige Zeilen bleiben bei Seitenumbrüchen
zusammen. Paket-, Beziehungs-, Token-, OpenXML-, Pfad- und Ressourcenprüfungen
finden weiterhin vor beziehungsweise nach der Expansion statt.
LibreOffice bleibt gekapselt, zeitbegrenzt und flüchtig; Auditfehler verhindert
die Ausgabe. Es entstehen keine archivierten Dokumentbytes.

## Folgen und Grenzen

Die Positionen und jede neue Fachrevision sind vollständig lesbar. Historie
benötigt zusätzlichen Speicher. Die Summe über mehrere SQL-Zeilen ist eine
Anwendungsinvariante; es gibt keinen Trigger für beliebige externe SQL-Schreiber.
Migration und Betrieb müssen deshalb die vorhandene Zugriffstrennung beachten.

Dies implementiert Addition manueller Tatsachen. Katalog, Mengen, Tarife,
Fälligkeitsermittlung, Rechtswirkung, Versand, Archivierung und FINANZ+ bleiben
außerhalb. Nutzungsrechte, Grabstatus, Beisetzungen und Wiedervorlagen ändern
sich dadurch nicht. Historische ADRs bleiben unverändert.
