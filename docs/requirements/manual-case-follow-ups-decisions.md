# Produktentscheidungen: manuelle fallbezogene Wiedervorlagen

Stand: 07.09.2026

Status: **Begrenzter Prototypumfang bestätigt; noch nicht implementiert.**
Die [Umsetzungsübergabe](../implementation/cemaris-manual-case-follow-ups-next-step-handoff.md)
beschreibt den ausführbaren nächsten Auftrag. Die
[Roadmap](../implementation/cemaris-first-operational-version-roadmap.md)
ordnet ihn in den Weg zur ersten alltagstauglichen Version ein.

## Quellen und Aussagegrenze

Die Projektverantwortung beauftragt nach dem Beisetzungsauswahl-Abschluss
die Vorbereitung des nächsten Implementierungsschritts für einen neuen Chat.
Sie beantwortet am 07.09.2026 zwei konkrete Rückfragen:

| Quelle | Bestätigte Antwort | Reichweite |
| --- | --- | --- |
| `USR-2026-09-07-FOLLOWUPS-01` | „Gemeinsamer Arbeitsvorrat ohne persönliche Zuweisung“ | Sachbearbeitung und Administration verwenden denselben Arbeitsvorrat und dürfen beide Aufgaben bearbeiten; keine Benutzerzuweisung |
| `USR-2026-09-07-FOLLOWUPS-02` | „Zusätzlich Abbrechen als eigenen Status vorsehen“ | Ergänzung des angebotenen Umfangs: genau eine Fallakte, Titel, optionale Beschreibung, manuelles Datum, Anlage, Änderung/Verschiebung, Erledigung und Wiederöffnung mit Historie; zusätzlich eigener Abbruchstatus |

Die zweite Antwort bezieht sich auf die ausdrücklich mitgestellte Grenze:
keine automatische Fristberechnung, E-Mails oder Änderung von Grab- und
Nutzungsrechtsstatus. Die
[Prototypentscheidung](notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
erlaubt die lokale synthetische Umsetzung. Dies ist keine Rechts-, Satzungs-
oder Produktivfreigabe und keine Entscheidung automatischer Ruhe-/Nutzungszeiten.

Die folgenden technischen Einzelheiten konkretisieren den bestätigten kleinen
Umfang als Umsetzungsvorgabe. Zeichenlimits, Routen, Versionsfelder,
Listensortierung und genaue Übergangsantworten wurden nicht als eigene
Benutzeraussagen erhoben. Sie dürfen innerhalb dieses Vertrags fachregelarm
implementiert werden; Abweichungen mit Außenwirkung dokumentieren.

## Fachlicher Kern

- Jede Wiedervorlage gehört unveränderlich zu genau einer vorhandenen
  synthetischen Fallakte. Ein Fall darf mehrere Wiedervorlagen besitzen.
- Es gibt keinen globalen Aufgabenpool ohne Fallbezug und keine automatische
  Erzeugung aus Beisetzungen, Nutzungsrechten, Gebühren oder Satzungen.
- Sachbearbeitung und Administration dürfen gleichermaßen lesen, anlegen,
  ändern, erledigen, abbrechen und wieder öffnen. Keine persönliche Zuweisung,
  kein Vier-Augen-Verfahren und keine weitere Aufgabenrolle.
- Pflichtangaben sind Titel und manuell eingegebenes Wiedervorlagedatum.
  Eine Beschreibung ist optional. Freitexte sind einfacher Text, kein HTML,
  kein Markdowneditor und keine Dateiablage.
- Das Datum ist ein Kalendertag (`DateOnly`, API `YYYY-MM-DD`), keine Uhrzeit
  und keine rechtliche Frist. Vergangene Tage sind zulässig. Das Speichern
  berechnet weder einen Termin noch einen Rechtszustand.
- Keine physische Löschung. Ein irrtümlicher oder nicht mehr benötigter
  Arbeitsauftrag wird mit Begründung abgebrochen und bleibt nachvollziehbar.

## Zustände und Übergänge

| Ausgangszustand | Aktion | Ergebnis | Voraussetzung |
| --- | --- | --- | --- |
| noch nicht vorhanden | Anlegen | `Open` / Offen, Version 1 | vorhandener synthetischer Fall, Titel, Datum |
| `Open` / Offen | Angaben ändern oder Termin verschieben | `Open` / Offen | geänderte Angaben, Pflichtbegründung, aktueller starker ETag |
| `Open` / Offen | Erledigen | `Completed` / Erledigt | Pflichtbegründung, aktueller starker ETag |
| `Open` / Offen | Abbrechen | `Cancelled` / Abgebrochen | Pflichtbegründung, aktueller starker ETag |
| `Completed` / Erledigt | Wieder öffnen | `Open` / Offen | Pflichtbegründung, aktueller starker ETag |
| `Cancelled` / Abgebrochen | Wieder öffnen | `Open` / Offen | Pflichtbegründung, aktueller starker ETag |

Erledigte und abgebrochene Einträge sind bis zur Wiederöffnung für Änderungen
gesperrt. Zwischen `Completed` und `Cancelled` gibt es keinen direkten Übergang.
Eine Wiederöffnung erhält Titel, Beschreibung und Datum; eine Terminänderung
erfolgt danach ausdrücklich. Wiederholte oder sonst unzulässige Übergänge
ergeben einen kontrollierten Konflikt ohne Mutation oder zusätzliche Revision.
Eine Änderung ohne tatsächlich geänderte normalisierte Angaben wird als
Validierungsfehler behandelt, ebenfalls ohne Revision/Audit.

Diese Zustände beschreiben ausschließlich die Bearbeitung der Wiedervorlage.
Sie verändern weder Fallversion/Falländerungsnachweis noch Beisetzungs-,
Grabstellen-, Rechte- oder Bescheidstatus. Der eigene letzte Bearbeitungsstand
wird am Wiedervorlageneintrag angezeigt.

## Validierung und Änderungsnachweis

- Titel nach Trim: 1 bis 200 Zeichen; Beschreibung optional, höchstens
  2.000 Zeichen, leer/Whitespace als `null`; Begründung nach Trim:
  1 bis 1.000 Zeichen. Keine stillen Kürzungen.
- Datum muss ein gültiger, nicht leerer Kalendertag im unterstützten
  `DateOnly`-Bereich sein. Keine implizite Zeitzonenverschiebung im Browser.
- Server vergibt ID, Zeitstempel, Akteur und monotone eigene Version.
  Clients dürfen Akteur, Statushistorie und Versionsfortschreibung nicht setzen.
- Jede erfolgreiche Operation schreibt aktuellen Eintrag, unveränderliche
  vollständige Fachrevision und sparsamen technischen Audit atomar.
  Revision enthält den resultierenden Zustand, Titel/Beschreibung/Datum,
  Fallbezug, Version, Operation, Begründung sowie Akteur und UTC-Zeitpunkt.
- Technischer Audit enthält nur IDs, Operation, resultierende Version,
  Akteurs-ID und Zeitpunkt. Keine Titel, Beschreibungen, Begründungen,
  Personen-/Grabnamen oder Vollkopien. Keine öffentliche Audit-Lese-API.
- Historie und fachliche Daten sind durch dieselben Fallarbeitsrechte
  geschützt. Kein anonymer Zugriff; HTML-Inhalte werden als Text ausgegeben.

## Arbeitsübersicht und Fallansicht

Eine eigene Navigation „Wiedervorlagen“ führt zu einer fallübergreifenden
Arbeitsübersicht. Standard ist `Open`; ausdrücklich wählbar sind außerdem
`Completed`, `Cancelled` und alle Zustände. Ein optionaler Filter „Fällig bis“
bezieht genau den eingegebenen Kalendertag ein. Ohne diesen Filter wird kein
heutiges Datum still eingesetzt. Überfälligkeitsautomatik, Eskalationen,
Benachrichtigungen und ein allgemeines Dashboard gehören nicht zum Schnitt.

Die Übersicht ist serverseitig paginiert: Seite ab 1, Seitengrößen 10/25/50,
Default 10; ungültige explizite API-Parameter ergeben HTTP 400. Sortierung
aufsteigend nach Datum, dann Erstellzeit und stabiler ID. Keine
providerabhängige Sortierung bei Gleichständen; Synthetic und SQL müssen
dieselbe explizit geprüfte ID-Sortierkonvention verwenden. Filterung,
Gesamtzahl und Seitenausschnitt erfolgen im jeweiligen Provider; keine
Vollmaterialisierung aller SQL-Einträge.

Listen zeigen Titel, Datum, Status und einen lesbaren aktuellen Fallgrabbezug
mit Link zur Fallakte. Dieser Text kommt ausschließlich aus dem referenzierten
Fall, bleibt eine Anzeige und ist kein historischer Snapshot oder
Beisetzungsgrabbezug. Fehlende Bestandteile ehrlich benennen; Fall-ID als
eindeutige Rückfallanzeige erhalten. Beschreibung und vollständige Revisionen
erst bei gezieltem Öffnen eines Eintrags laden; keine Detailanfrage pro Zeile.

In der Fallakte werden die zugehörigen Wiedervorlagen angeboten; die Anlage
erfolgt dort mit festem Fallbezug. Auch diese Liste muss begrenzt/paginiert
sein. Filter, Navigation und Rücksprung sollen nach Neuöffnen nachvollziehbar
bleiben. Nach Anlage/Änderung werden betroffene Listen aktualisiert. Bei
Konflikten bleiben Eingaben erhalten; bewusstes Neuladen anbieten.

## Technische und historische Grenzen

Eigene standardmäßig deaktivierte Development-Capability
`Features:CaseFollowUpsEnabled`, separate API-Policy mit denselben beiden
Fallarbeitsrollen. Keine Abhängigkeit von NoticeGeneration, Nutzungsrechts-
oder Gebühren-Capabilities. Die neue Funktion ersetzt keine bestehende Route.

Der neue kanonische Kern erhält Synthetic- und EF-/SQL-Provider sowie eine
additive Schema-Migration als Repositoryartefakt. Bestehende Projektionen und
historische Migrationen bleiben unverändert. Eine Migrationserzeugung ist
keine Erlaubnis zur Anwendung auf bestehende Datenbanken.

Die bisherigen offenen Wiedervorlagenpunkte in
[5C-11 und 5C-12](person-usage-rights-deadlines-decisions.md#ergänzende-5c-entscheidungsmatrix)
werden nur für diesen neuen manuellen Arbeitsauftrag konkretisiert. Frühere
Gateabschlüsse bleiben historische Nachweise. Automatische Wiedervorlagen,
rechtliche Fristen, Satzungsauslegung, Kalender-/Mailintegration, Aufbewahrung
und echte Verwaltungsdaten sind weiterhin außerhalb dieses Inkrements.
