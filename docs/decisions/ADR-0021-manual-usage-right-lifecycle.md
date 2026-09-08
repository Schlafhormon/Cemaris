# ADR-0021: Manueller Nutzungsrechtslebenszyklus und atomare Rechtefolgekorrektur

Status: Accepted

Datum: 08.09.2026

## Kontext

Die fünf [bestätigten M2a-Produktentscheidungen](../requirements/manual-usage-right-termination-decisions.md)
erweitern den manuellen Kern aus [ADR-0016](ADR-0016-canonical-parties-and-historicized-usage-rights.md).
Beendigung, Rücknahme, manuelle Neuvergabe und gemeinsame Korrektur bestehender
Rechtefolgen benötigen mehrere erhaltene Rechte je Grabstelle. Der bisherige
ungefilterte eindeutige Grabstellenindex und der Einzel-Lesepfad reichen dafür
nicht aus. ADR-0016 und ADR-0020 bleiben als historische Entscheidungen unverändert.

## Entscheidung

Der bestehende kanonische Speicher wird additiv erweitert. Ein Recht besitzt
`Open`, `Ended` oder `Voided`, einen optionalen Vorgänger und getrennte
Beendigungsfakten. Sein ursprüngliches Laufzeitende bleibt erhalten. Der
UTC-Kalendertag des vorhandenen `TimeProvider` begrenzt die Beendigung auf heute
oder früher; das Datum muss strikt nach Rechtsbeginn und letztem Inhaberbeginn
liegen. Es schließt das letzte Intervall exklusiv. Rücknahme öffnet dasselbe
Intervall; ältere Revisionen bewahren den zurückgenommenen Nachweis.

Neuvergabe benötigt einen beendeten Vorgänger ohne gültigen Nachfolger, eine
eigene manuelle Prüfbestätigung und eine neue Rechte-ID. Beginn ist frühestens
am tatsächlichen Beendigungsdatum. Vorgänger und neues Recht erhalten je einen
Nachweis mit gemeinsamer Vorgangskennung; auch die Vorgängerversion steigt.
Generische Anlage sowie Korrektur verknüpfter Beginn-/Grabstellenfakten dürfen
diesen Weg nicht umgehen. Transfer, Verlängerung und Faktenkorrektur setzen
einen offenen Rechtszustand voraus.

Bei Folgekorrektur ermittelt der Server die vollständige gültige Folge. Die
ausdrücklich bestätigte Menge muss in IDs und Versionen exakt übereinstimmen.
Der Vorgänger wird geöffnet, sämtliche gültigen Nachfolger werden `Voided`.
Ihre Inhaberintervalle und Beendigungsfakten bleiben erhalten. Schon irrtümliche
Zweige werden nicht erneut verändert. Jede betroffene Rechteversion steigt;
jeweils vollständige Fachrevision und sparsamer Audit tragen dieselbe
Vorgangskennung. Begründung und Quelle gehören zum geschützten Fachnachweis,
nicht in den technischen Audit oder ungefilterte Exceptionprotokolle.

Synthetic bereitet alle Folgestände und Nachweise vor und veröffentlicht sie
unter dem vorhandenen gemeinsamen Koordinationslock. SQL verwendet eine
serialisierbare Transaktion über die betroffene Grabstelle. Offene Nachfolger
werden zunächst innerhalb der Transaktion historisiert, bevor der Vorgänger
den offenen Indexplatz erhält. Versionsspeicherung und alle Nachweise bleiben
in derselben Transaktion. EF-Konflikte und auch verschachtelte SQL-Deadlocks
werden als Versionskonflikt zurückgegeben. Nachweisfehler werden nicht pauschal
als fachliche Dublette klassifiziert; sie rollen die gesamte Operation zurück.

Die reguläre Migration `20260908114035_AddManualUsageRightLifecycle` ersetzt
den ungefilterten Grabstellenindex durch einen eindeutigen Index für `Open`.
Ein weiterer eindeutiger gefilterter Vorgängerindex erlaubt höchstens einen
gültigen Nachfolger. Self-FK und Check-Constraints ergänzen die Anwendungsschutzregeln.
Bestehende Rechte erhalten `Open`, neue Fakten bleiben nullable. Historische
JSON-Revisionen werden nicht umgeschrieben; fehlende neue Felder werden kompatibel
gelesen. Eine spätere Schema-Rücknahme nach entstandenen Rechtefolgen ist kein
verlustfreier fachlicher Rücknahmeweg: der alte eindeutige Index kann dann nicht
wiederhergestellt werden. Fachliche Rücknahmen erfolgen über M2a.

Der bisherige Einzel-Lesepfad liefert das offene, sonst jüngste gültig beendete
Recht. Ein nach Beginn und ID stabil paginierter Verlauf enthält auch `Voided`;
vollständige Revisionen werden bei Auswahl einer ID geladen. Der Inhabervorschlag
für Bescheidentwürfe setzt `Open` voraus. Die freie bestätigte Auswahl bleibt bestehen.

Vier neue POST-Routen verwenden die bestehende Policy für Sachbearbeitung und
Administration, Cookie-Sitzung, CSRF und starken `If-Match`. Die Modulkonvention
bleibt 428/400/412 für fehlenden/ungültigen/veralteten ETag. Antwortkörper und
ETag neuer Mutationen stammen aus demselben unveränderlichen gespeicherten Stand.
Inhaltsarme Fehler sind auf die betroffenen Rechtsendpunkte begrenzt.

`Features:UsageRightLifecycleEnabled` ist standardmäßig `false`, nur in
Development mit aktiver `PersonUsageRightsEditingEnabled` zulässig. Lesen
gespeicherter Zustände und Schutz bestehender Mutationen hängen nicht vom neuen
Schalter ab. NoticeGeneration ist keine Abhängigkeit.

## Folgen und Nachweise

Rechtefolgen bleiben auch nach Korrekturen vollständig nachvollziehbar. Die
gemeinsame Transaktion verhindert Teilkorrekturen und zusätzliche Nachfolger
zwischen Bestätigung und Speicherung. Konflikte erfordern bewusstes Neuladen;
eine Folgekorrektur benötigt danach eine neue Vorschau und Bestätigung.

Die Implementierung wird durch Domain-/Vertragstests, HTTP/UI-Regressionen,
Offline-Schema, isolierte SQL-Migrationen, echte Rennen und Nachweisrollback
sowie einen isolierten Browserlauf geprüft. Tatsächliche Ergebnisse und Grenzen
stehen im [M2a-Abschluss](../implementation/cemaris-manual-usage-right-termination-completion.md).
Die serialisierbare Sperre über eine Grabstelle kann unter Last Konflikte
erzeugen; eine Last- oder Betriebsabnahme ist damit nicht ersetzt.

Fristautomatik, E-Mails, automatische Neuvergabe und Änderungen an Grabstatus,
Beisetzungen, Gebühren oder Wiedervorlagen gehören nicht zu dieser Entscheidung.
