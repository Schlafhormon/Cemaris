# Abschlussdokumentation Cemaris Inkrement 4a

Stand: 13.08.2026

## Ergebnis

Inkrement 4a ist als synthetischer technischer Produktinkrement Ende zu Ende
umgesetzt. Die Anwendung besitzt eine allgemein konfigurierbare
Friedhofshierarchie, einen zunächst leeren Grabartenkatalog, Grabstellen mit
manuellem Status/Sperre/Soll-Kapazität sowie einen kanonischen
`GraveSiteId`-Bezug für Fallakten.

Eine fachliche Vorstellung und Abnahme durch die Friedhofsverwaltung sowie
Datenschutz-, Sicherheits-, Betriebs- und Produktivfreigaben bleiben offen.

## Umgesetzter Umfang

- Hierarchie Friedhof → Bereich → Feld → Reihe → Grabstelle mit optionalen Zwischenebenen;
- stabile serverseitige GUIDs und starke numerische Versionen;
- kontextbezogene normalisierte Eindeutigkeit in Application und SQL;
- globaler leerer Grabartenkatalog mit genau drei Beisetzungsformen;
- Zuordnung und Aktivstatus einer Grabart je Friedhof;
- Aktivierung/Deaktivierung durch beide Fachrollen ohne Referenzverlust;
- physisches Löschen nur durch Administration und nur bei vollständiger Unbenutztheit;
- Status Frei/Reserviert/Belegt, unabhängige Sperre und positive optionale Soll-Kapazität;
- ausschließlich manuelle Grabnummern;
- additive EF-Migration `20260813104713_AddCemeteryMasterData`;
- nullable kanonischer Fallbezug ohne automatische Zuordnung von Altzeilen;
- aktuelle Namen in Suche und Detail unmittelbar nach Umbenennung;
- synthetischer und SQL-Store, API/OpenAPI und React-Pflegeoberfläche;
- eindeutige vollständige Strukturpfade sowie kaskadierende, bei
  Vorfahrenwechsel sicher zurückgesetzte Grabstellen-Auswahlen;
- Cookie, CSRF, serverseitige Policies, Akteur, ETag/If-Match und atomarer sparsamer Nachweis.

## Lokale Satzungsevidenz

Die Friedhofssatzung Doberlug-Kirchhain 2023 wurde vollständig textlich gelesen
und auf allen 16 Seiten visuell geprüft. § 12 nennt sieben lokale Grabarten.
Diese und die lokal genannten Fristen sind weder Seed noch allgemeiner
Cemaris-Default. Gebühren und Fristen wurden nicht implementiert.

## Verifikation

Die Baseline war vor der Implementierung grün. Der finale Prüfstand umfasst:

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | 0 Warnungen, 0 Fehler |
| Unit-Tests | 24 erfolgreich |
| reguläre API-/Integrationstests | 39 erfolgreich; die 9 SQL-Tests werden separat ausgeführt |
| reale SQL-Suite auf `localhost\CEMARISDEV` | 9 erfolgreich, 0 übersprungen |
| Frontendtests | 11 erfolgreich |
| OpenAPI-Vertrag | als Integrationstest erfolgreich geprüft |
| temporäre SQL-Datenbanken | vor und nach der Suite keine `Cemaris_IntegrationTests_*` vorhanden |

Die Pflegeoberfläche wurde anschließend zusätzlich manuell im Browser mit
zwei Friedhöfen und gleichnamigen Strukturknoten geprüft. Daraus erkannte
Mehrdeutigkeiten wurden durch vollständige Kontextpfade, kaskadierende
Auswahlfilter und das Zurücksetzen ungültiger Kind-Auswahlen korrigiert. Der
erneute manuelle Browsertest wurde von der Projektverantwortung am 13.08.2026
als funktionierend bestätigt.

Zusätzlich gehören Formatprüfung, `npm ci`, Lint, Produktionsbuild,
OpenAPI-Erzeugung, idempotentes EF-Skript, Markdown-, Secret- und Git-Prüfungen
zum Abschlussgate. Die genauen Abschlussbefehle werden im unveränderten
finalen Arbeitsbaum ausgeführt.

## Sicherheitsbewertung

Der Schreibpfad ist standardmäßig deaktiviert. Aktivierung ist ausschließlich
in Development mit synthetischem Provider zulässig. Die bestehende
Fallakten-Capability bleibt davon unabhängig. Abgewiesene, konkurrierende oder
fachlich ungültige Mutationen schreiben weder Fachversion noch erfolgreichen
Änderungsnachweis. Der Nachweis enthält keine Fachpayloads und ist nicht über
API oder UI erreichbar.

## Nicht umgesetzt

Kein vollständiger Beisetzungsprozess, kein Planungstermin, keine automatische
Nummerierung, Kapazitäts- oder Belegungsentscheidung, keine Ruhe-, Nutzungs-
oder Aufbewahrungsfrist, keine Umbettung, kein Storno, keine Gebühr, kein
Bescheid, kein Formular, keine Dokumenterzeugung, kein Winyard, kein LDAP und
kein EDWALT-Code oder -Mapping.

## Freigabegrenze

Der Stand belegt technische Abnahmekriterien mit synthetischen Daten. Er
behauptet keine fachliche Vollständigkeit, keine Datenschutzkonformität für
einen konkreten Betreiber, keine Betriebseignung und keine Produktivreife.
