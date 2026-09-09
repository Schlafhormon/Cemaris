# Produktentscheidungen M3a: manuelle Gebührenpositionen im Entwurf

Stand: 09.09.2026

Status: **Implementiert; isolierter SQL-, Browser- und echter DOCX-/PDF-Nachweis
im [M3a-Abschluss](../implementation/cemaris-manual-notice-line-items-completion.md).**
Die beiden bestätigten Produktantworten bleiben maßgeblich.
[ADR-0022](../decisions/ADR-0022-manual-notice-line-items.md) dokumentiert die
technische Umsetzung. Capabilities bleiben standardmäßig ausgeschaltet;
weitergehende Roadmapabläufe sind nicht Bestandteil dieses Abschlusses.

## Bestätigte Antworten

Die Projektverantwortung beantwortete am 08.09.2026 bei der Vorbereitung eines
neuen kontextlosen Implementierungsauftrags zwei konkrete Fragen:

| ID und Gesprächsquelle | Frage | Ausdrückliche Antwort |
| --- | --- | --- |
| M3A-01, `USR-2026-09-08-M3A-01` | Zunächst mehrere manuelle Gebührenpositionen mit Bezeichnung und EUR-Betrag, automatisch gebildeter Gesamtsumme und vollständiger DOCX-/PDF-Ausgabe; bisherige Entwurfs-, Rollen- und FINANZ+-Grenzen bleiben bestehen? | „Ja, manuelle Positionen mit Summe und DOCX/PDF“ |
| M3A-02, `USR-2026-09-08-M3A-02` | Jede Position positiv, höchstens zwei Nachkommastellen und Summe ausschließlich aus den Positionen; keine Nullbeträge, negativen Positionen oder manuellen Summenabweichungen? | „Ja, positive Beträge und verbindliche Summe“ |

Gebührenkatalog und Mengenberechnung wurden nicht als nächster Schnitt gewählt.
Die Antworten benötigen keine erneute Freigabe. Die
[Prototypentscheidung](notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
gilt weiter; sie ersetzt keine fehlenden kommunalen Gebührenregeln.

## Verhältnis zu bestehenden Verträgen

M3a erweitert den [manuellen 6b-Faktenkern](manual-notice-financial-facts-decisions.md)
und die [flüchtige 6c-Dokumentausgabe](notice-generation-decisions.md).
Für positionsbasierte Entwürfe ersetzt eine exakt berechnete Summe den frei
eingegebenen Gesamtbetrag. Die Ausgabe enthält alle Positionen anstelle der
bisherigen einzelnen Gebührenzeile. Sonstige Nummern-, Zahlungs-, Rollen-,
Korrektur-, Sicherheits- und Wirkungsgrenzen bleiben bestehen.
Die frühere Beschränkung „keine Berechnung“ gilt für den historischen
6b-Schnitt; sie verbietet nicht die jetzt bestätigte Addition. Daraus folgt
keine Freigabe von Tarifen, Mengen- oder Fristberechnung. Historische ADRs
werden nicht rückwirkend umgeschrieben.

## Technische Konkretisierung

Die folgenden Grenzen sind nachvollziehbare technische Konkretisierungen,
keine zusätzlich behaupteten wörtlichen Produktantworten.

- Ein Entwurf enthält im Positionsmodus 1 bis 100 geordnete Positionen. Jede
  besitzt eine stabile Identität innerhalb dieses Entwurfs, eine getrimmte
  Bezeichnung mit 1 bis 500 Zeichen und einen positiven EUR-Betrag mit höchstens
  zwei Nachkommastellen. Es gibt keine Mengen, Einheiten oder Einzelpreise.
- Beträge werden exakt als Dezimalwerte verarbeitet. Die vorhandene technische
  Obergrenze `9_999_999_999_999_999.99` für `decimal(18,2)` gilt je Betrag und
  für die Gesamtsumme. Überlauf und zusätzliche Nachkommastellen werden
  abgewiesen, nicht gerundet. JavaScript-Fließkommazahlen dürfen die
  Centgenauigkeit nicht verändern. Der Server bestimmt die verbindliche Summe.
- Hinzufügen, Ändern, Entfernen und Umordnen sind Teil einer einzigen
  begründeten Entwurfskorrektur mit starkem aktuellem Entwurfs-ETag. Entfernen
  aus dem aktuellen Stand löscht keine frühere Fachrevision. Die letzte
  Position darf nicht entfernt werden. Fremde oder doppelte Positions-IDs
  sind ungültig. Neue IDs vergibt der Server.
- Entwurfs-ID, Bescheidnummer und deren Konfigurationssnapshot bleiben bei
  Korrektur und Umstellung unverändert. Nummernkonfiguration bleibt ausschließlich
  administrativ. Sachbearbeitung und Administration dürfen die Fachoperationen
  ausführen. Die vorhandene ausdrückliche Zahlungspflichtigenbestätigung gilt
  bei Anlage beziehungsweise Wechsel weiter; der aktuelle Rechtsinhaber bleibt
  nur ein Vorschlag. Beendete oder irrtümliche Rechte liefern keinen aktuellen Inhaber.
- Pflichtangaben des Entwurfskopfs bleiben erhalten: Zahlungspflichtiger,
  manuelles Bescheid- und Fälligkeitsdatum, gemeinsame Kontierung sowie
  Gebührenbegründung/Quellenangabe. Positionsbezeichnungen ergänzen diesen
  Nachweis. Es entstehen keine positionseigenen Konten oder Satzungsregeln.
- Eine erfolgreiche Mutation erzeugt genau eine neue Entwurfsversion, eine
  vollständige Fachrevision einschließlich aller geordneten Positionen und
  einen sparsamen technischen Audit. Aktueller Stand, Summe, Revision, Audit
  und bei Anlage Nummernvergabe sind atomar. Technischer Audit und Fehlerlogs
  enthalten keine Beträge, Bezeichnungen, Kontierung oder Begründungen.
- Verwerfen bleibt ein begründeter, historisierter Übergang `Draft → Discarded`.
  Verworfene Entwürfe bleiben lesbar, sind weder korrigierbar noch erzeugbar.
  Es entstehen keine zusätzlichen Freigabe-, Storno- oder Versandzustände.

## Bestand und ausgeschaltete Capability

Bestehende Entwürfe bleiben zunächst im bisherigen Gesamtbetragsmodus.
Migration und Lesen erzeugen keine erfundenen Positionen und ändern keine
alten Revisionen. Auch nullable alte Bescheidprojektionen bleiben unverändert.

Ein aktiver alter Entwurf kann ausdrücklich und begründet auf Positionen
umgestellt werden. Die Oberfläche schlägt eine Position mit bisheriger
Gebührenbegründung und exaktem bisherigen Betrag vor. Die Umstellung speichert
erst nach Bestätigung; der bisherige Stand bleibt als ursprüngliche Revision
erhalten. Der neue Stand darf dabei bewusst bearbeitet werden. Rückumstellung
auf einen freien Gesamtbetrag gehört nicht zu M3a.

Alte Entwürfe bleiben über den bisherigen Korrekturweg bearbeitbar.
Positionsentwürfe dürfen darüber weder Positionen verlieren noch eine
abweichende Summe bekommen. Nach Abschalten der neuen Capability bleiben
beide Modi einschließlich vollständiger Historie korrekt lesbar, soweit die
bisherige Entwurfs-Capability aktiv ist. Neue Positionsmutationen und ihre
Formulare fehlen dann; alte Schreibwege dürfen die Regeln weiterhin nicht
umgehen. Das bestehende Verwerfen bewahrt auch im Positionsmodus alle Nachweise.
Bei aktiver Dokumenterzeugung bleibt die Ausgabe gespeicherter Positionen
vollständig, auch wenn nur die neue Bearbeitungs-Capability ausgeschaltet ist.

## Ausgabe und Bedienung

DOCX und echtes LibreOffice-PDF enthalten sämtliche Bezeichnungen und Beträge
in gespeicherter Reihenfolge, eine eindeutige Gesamtsumme und weiterhin die
sichtbare Kennzeichnung `RECHTLICH WIRKUNGSLOSER ENTWURF`. Längere Listen und
Bezeichnungen müssen über mehrere Seiten lesbar bleiben. Keine abgeschnittenen
Zeilen, verlorenen Positionen, leeren zusätzlichen Gebührenzeilen oder Resttokens.
Alte Entwürfe behalten ihre bisherige Ausgabe mit einer Gebührenzeile.

Die Erzeugung verwendet einen konsistent gelesenen Entwurfsstand einschließlich
Positionen und Version. Sie archiviert keine Dokumentbytes und schreibt keine
Fachrevision. Spätere Änderungen erzeugen bei erneutem Export ein neues flüchtiges
Dokument; frühere Downloads werden weder zurückgerufen noch nachträglich verändert.
Die bisherige Beisetzungs-/Satzungsauswahl, Vorlagenprüfung, Ressourcenbegrenzung,
gekapselte Konvertierung und inhaltsfreie Erzeugungsprotokollierung bleiben wirksam.

Das Formular zeigt die berechnete Summe, verständliche positionsbezogene Fehler
und bietet per Tastatur nutzbare Reihenfolgeaktionen. Bei Konflikt bleiben
Eingaben erhalten; bewusstes Neuladen ersetzt den veralteten Stand. Erfolgreiche
Anlage setzt das Formular einschließlich Auswahlbestätigung zurück.
Fall-/Entwurfswechsel, Abbruch und späte Antworten dürfen keine falschen Daten
in eine andere Ansicht übernehmen.

## Verbindliche Prüfbeispiele

| Beispiel | Erwartung |
| --- | --- |
| „Synthetische Leistung A“ 100,10 EUR und „Synthetische Leistung B“ 25,40 EUR | exakt 125,50 EUR in gespeichertem Stand, Historie, UI, DOCX und PDF |
| 0,10 EUR und 0,20 EUR | exakt 0,30 EUR, ohne binäre Rundungsabweichung |
| Null, negativ, drei Nachkommastellen, leere Bezeichnung, leere Liste oder 101 Positionen | Feldfehler; keine Nummer, Teiländerung, Revision oder Audit |
| Obergrenze, Centänderung bei großen Beträgen und Überschreitung durch Addition | verlustfreie Übertragung oder kontrollierte Abweisung; kein stiller Genauigkeitsverlust |
| Ändern, Entfernen, Umordnen, danach erneutes Öffnen | neue Reihenfolge und Summe; frühere Revision zeigt vollständig ihren alten Stand |
| Zwei Korrekturen beziehungsweise Korrektur gegen Verwerfen | höchstens ein Erfolg mit demselben ETag, keine Teilzustände |
| Fehler bei späterer Position, Revision oder Audit | vollständiger Rollback; bei Anlage auch keine verbrauchte Nummer durch den fehlgeschlagenen Vorgang |
| Alter Entwurf vor/nach Migration und ausdrücklicher Umstellung | alte Fakten und Revisionen unverändert; identische Entwurfs-ID und Nummer |
| 100 Positionen einschließlich langer Bezeichnungen | vollständige geordnete DOCX-/PDF-Ausgabe mit lesbaren Seitenumbrüchen und korrekter Summe |
| Erzeugung während konkurrierender Korrektur | ein konsistenter bestätigter Entwurfsstand oder Versionskonflikt, keine gemischten Zeilen/Summe |

## Nicht Bestandteil von M3a

Kein Gebührenkatalog, keine örtlichen Tarife oder Gültigkeitsberechnung,
Mengen, Steuern, Rabatte, Gutschriften, Erstattungen, automatische Fälligkeit,
wirksame Festsetzung, Korrekturbescheide, Signatur, Versand, Serverdruck,
Dokumentarchivierung, FINANZ+-/DMS-Integration oder EDWALT-Ausführung.
Keine Änderung an Nutzungsrechten, Grabstatus, Beisetzungen oder Wiedervorlagen
durch eine Gebührenoperation. Keine bestehenden Datenbanken, echten
Verwaltungsdaten oder Produktivaktivierung. Die übrige Roadmap bleibt offen.
