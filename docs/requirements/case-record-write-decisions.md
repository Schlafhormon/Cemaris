# Implementierungsentscheidungen: schreibende Fallakten-Grundlage

> Status: für den zweiten technischen Produktinkrement verbindlich. Die
> Entscheidungen sind keine abschließenden kommunalen Fachregeln und keine
> Produktivfreigabe.
>
> Quelle: Projektpriorisierung vom 12.08.2026, ADR-0009 sowie die bestätigte
> Lesesicht REQ-MVP-001 bis REQ-MVP-003.

## Ziel

Der zweite Produktinkrement ergänzt zur vorhandenen Suche und Detailansicht
einen minimalen Schreibpfad. Er soll nachweisen, dass Cemaris grundlegende
Fallinformationen konsistent anlegen, ändern, speichern und unmittelbar über
die bestehende Lesesicht wiederfinden kann.

Gespeichert werden ausschließlich manuell eingegebene Tatsachen. Cemaris
berechnet oder bewertet in diesem Inkrement keine fachlichen Zustände,
Fristen, Gebühren oder Rechtsfolgen.

## Anwendungsfälle

| ID | Anwendungsfall | Verbindlicher Umfang |
| --- | --- | --- |
| `REQ-CASE-001` | Fallakte anlegen | serverseitige ID; Grabstellenbezug mit Friedhof sowie optional Feld und Grabnummer; danach direkt lesbar und suchbar |
| `REQ-CASE-002` | Grabstellenbezug ändern | Friedhof, Feld und Grabnummer als erfasste Bezeichnungen ändern; keine Struktur-, Belegungs- oder Statusprüfung |
| `REQ-CASE-003` | verstorbene Person hinzufügen und ändern | Vorname, Name, Geburts- und Sterbedatum als optionale Fakten; beim Speichern mindestens ein Namensbestandteil |
| `REQ-CASE-004` | Beisetzung hinzufügen und ändern | erforderliches Beisetzungsdatum sowie optionaler Bezug auf eine verstorbene Person derselben Fallakte |
| `REQ-CASE-005` | Änderungen sofort lesen | vorhandene Suche und Detailansicht zeigen den neuen Stand ohne getrennten manuellen Projektionslauf |
| `REQ-CASE-006` | konkurrierende Änderungen erkennen | jede Mutation benötigt die zuletzt gelesene Fallversion; veraltete Änderungen werden abgelehnt und niemals still überschrieben |
| `REQ-CASE-007` | Schreibfunktion sicher begrenzen | standardmäßig deaktiviert; nur nach expliziter Konfiguration in Development und ausschließlich für synthetische Daten verfügbar |

## Technische Validierung

Diese Regeln dienen nur Datenform und Konsistenz des Inkrements:

- IDs werden serverseitig erzeugt und sind nach außen und in der Persistenz
  stabil.
- Texte werden außen getrimmt; reine Leerwerte werden als fehlend behandelt.
- Maximallängen dürfen die bestehenden Leseschema-Grenzen nicht überschreiten:
  Friedhof 200, Feld 100, Grabnummer 100, Vorname und Name je 200 Zeichen.
- Beim Anlegen einer Fallakte ist der Friedhof als technische Mindestangabe
  erforderlich. Das ist keine endgültige fachliche Pflichtfeldregel.
- Beim Speichern einer verstorbenen Person muss mindestens Vorname oder Name
  angegeben sein. Weitere Personenattribute werden nicht erfunden.
- Eine Beisetzung benötigt in diesem Fakteninkrement ein Beisetzungsdatum.
  Planung oder Status einer noch nicht vollzogenen Beisetzung werden nicht
  modelliert.
- Ein Beisetzungsbezug darf nur auf eine vorhandene verstorbene Person
  derselben Fallakte zeigen. Ein fehlender Bezug bleibt zulässig und in der
  Lesesicht sichtbar.
- Es gibt eine monotone Fallversion für optimistische Nebenläufigkeit. Jede
  Änderung an Grabstellenbezug, Person oder Beisetzung erhöht sie.
- Validierungs-, Nichtgefunden-, fehlende Versions- und Konfliktfälle liefern
  standardisierte Problem-Details ohne interne oder unnötige Inhaltsdaten.

## Sicherheitsgrenze

`Features:CaseEditingEnabled` ist standardmäßig `false`. Solange produktive
Authentifizierung, Autorisierung und Auditierung offen sind, darf die API den
Schreibpfad nur in der `Development`-Umgebung aktivieren. Eine Aktivierung in
anderen Umgebungen muss bereits beim Start sicher fehlschlagen. UI und
Systeminformation zeigen die Bearbeitungsfunktion nur bei aktiver Fähigkeit.

Alle dadurch erfassten Datensätze sind zwingend synthetisch. Echte Personen-,
Grab-, Bescheid- oder Adressdaten sind in Repository, Standardtests,
Screenshots, Logs und Demonstrationsdaten weiterhin verboten.

## Bewusste Abgrenzung

Nicht Bestandteil dieses Inkrements sind:

- Löschen, Archivieren, Storno, Aufhebung, Umnummerierung oder Historisierung;
- Login, produktive Rollen, endgültiges Audit oder eine produktive
  Schreibfreigabe;
- Adressen und Personenrollen außerhalb der bestehenden lesenden Darstellung;
- Anlage oder Änderung von Nutzungsrechten;
- Grabarten, Belegungsprüfung, Tiefe, Status, Karten oder GIS;
- Ruhefrist- oder Nutzungszeitberechnung;
- Gebührenkatalog, Beträge, Bescheide, Zahlung, Mahnung oder FINANZ+;
- Dokumenterzeugung und Winyard;
- EDWALT-Import, Mapping oder Zugriff auf EDWALT-Arbeitsbereiche.

Vorhandene lesende Informationen zu Nutzungsrechten, Berechtigten, Adressen,
Bescheiden und Gebühren bleiben unverändert sichtbar, sind über den neuen
Schreibpfad aber nicht änderbar.

## Tatsächlich umgesetzter Vertrag

Stand 12.08.2026 ist die technische Grundlage Ende zu Ende umgesetzt:

- Fall-, Personen- und Beisetzungs-IDs erzeugt ausschließlich der Server als
  GUID; die Initialversion einer Fallakte ist `1`.
- Alle sechs Schreibendpunkte liegen unter `/api/cases`. `POST /api/cases`
  antwortet mit `201 Created`, `Location`, Projektion und starkem ETag. Jede
  Mutation benötigt genau einen starken numerischen ETag in `If-Match` und
  liefert Projektion und neuen ETag.
- Fehlendes `If-Match` ergibt `428`, ein syntaktisch ungültiger Header `400`,
  eine veraltete Version `412`, unbekannte Root-/Kind-IDs `404` und ein
  fallfremder oder unbekannter Verstorbenenbezug einen datensparsamen
  feldbezogenen Validierungsfehler `400`.
- `GET /api/cases/{id}` enthält die additive Eigenschaft `version` und liefert
  denselben ETag. Bestehende Such- und Detailstrukturen bleiben ansonsten
  kompatibel.
- Der synthetische Store serialisiert Versionsprüfung und Änderung
  threadsicher im Prozess. Der SQL-Store verwendet ein bedingtes Root-Update
  und dieselbe Datenbanktransaktion für Versionssprung und Kindänderung.
- `Features:CaseEditingEnabled` ist in allen Beispielkonfigurationen `false`.
  Bei `true` außerhalb von `Development` verweigert die Anwendung den Start;
  bei `false` fehlen Endpunkte, OpenAPI-Operationen und UI-Capability.
- Die React-UI besitzt `/cases/new` und `/cases/{id}/edit`, übernimmt nach
  Erfolg den neuesten Serverstand, zeigt Servervalidierung feldbezogen und
  behält bei `412` lokale Eingaben bis zum bewusst ausgelösten Neuladen.

Es bestehen keine fachlichen Abweichungen vom vereinbarten Umfang. Das
vorläufige relationale Schema wird für diesen Inkrement als kanonischer
Fall-/Lesestore verwendet; diese wesentliche technische Grenze ist in
[ADR-0010](../decisions/ADR-0010-canonical-provisional-case-store.md)
dokumentiert.

## Abnahme

Der Inkrement ist umgesetzt, wenn bei explizit aktivierter Development-
Funktion eine synthetische Fallakte über die UI angelegt, um Person und
Beisetzung ergänzt, geändert, gesucht und in der Detailansicht geprüft werden
kann. Fehlende oder veraltete Versionen müssen reproduzierbar abgewiesen
werden. Bei Standardkonfiguration existiert kein erreichbarer Schreibpfad.

Backend-Build, Unit- und API-Integrationstests, Formatprüfung, Frontend-Tests,
Lint und Produktionsbuild müssen automatisiert erfolgreich sein. Ein
SQL-Server-Integrationstest bleibt optional über die bestehende geschützte
Umgebungsvariable, muss den Schreibpfad bei Verfügbarkeit aber ebenfalls
abdecken.

Der technische Abnahmebefund ist positiv. Die reguläre Suite deckt zusätzlich
gleichzeitige Mutationen mit derselben erwarteten Version, fehlende und
veraltete ETags, Teilwirkungsfreiheit, fremde Bezüge, Längengrenzen,
Capability-Grenze und den vollständigen Anlage-/Änderungs-/Such-/Detailablauf
ab. Der SQL-Server-Schreibtest bleibt wie zuvor ausschließlich über
`CEMARIS_SQL_TEST_CONNECTION_STRING` aktivierbar. Fachliche Abnahme,
Produktividentität, Berechtigung und Audit bleiben `OFFEN` und sind ein echtes
Freigabegate.

Abschlussprüfung am 12.08.2026: Release-Build mit 0 Warnungen und 0 Fehlern;
10 Unit- und 15 reguläre Integrationstests bestanden; 4 SQL-Server-Tests
mangels ausdrücklich gesetzter Testverbindung planmäßig übersprungen; 5
Frontendtests, Lint, Produktionsbuild und .NET-Formatprüfung erfolgreich.
Standardstart und aktivierter Development-Start wurden zusätzlich gegen
Capability, Endpunktangebot, OpenAPI und initialen ETag geprüft.
