# ADR-0016: Kanonische Beteiligte und historisierte Nutzungsrechte

Status: Accepted

Datum: 14.08.2026

## Kontext

Die lesende MVP-Projektion enthält fallgebundene `EntitledPerson`-, `Address`-
und `UsageRight`-Zeilen. Diese nullable Strukturen reichen für eine
synthetische Detailansicht, besitzen aber weder eine fallübergreifende
Personenidentität noch belastbare Rollen-, Versions- und Historiensemantik.

Für Inkrement 5b sind manuelle Anlage, Korrektur, Übertragung und Verlängerung
eines Nutzungsrechts vorgesehen. Lokale Satzungen liefern kommunale Evidenz,
dürfen jedoch keine allgemeinen Laufzeit- oder Startwerte des
Open-Source-Produkts werden.

## Entscheidung

Cemaris führt einen neuen kanonischen Fachkern neben den unverändert lesbaren
Altprojektionen ein:

- Beteiligte sind fallübergreifend stabile natürliche Personen oder
  Organisationen mit historisierten postalischen Anschriften.
- Ein Nutzungsrecht besitzt stabile Identität und genau eine kanonische
  Grabstelle. In 5b hat es genau einen aktuellen Inhaber; Übertragungen werden
  als zeitliche Inhaberfolge gespeichert.
- Jede Mutation erzeugt eine unveränderliche Fachrevision. Der sparsame Audit
  bleibt davon getrennt und enthält keine fachlichen Inhaltswerte.
- Start- und Enddatum werden in 5b manuell erfasst. Eine versionierte
  Startbezugs-Konfiguration je Friedhof bezeichnet den erforderlichen
  Nachweis, berechnet jedoch kein Datum.
- Das angelegte Recht fixiert Identität, Code und Anzeige der verwendeten
  Startbezugs-Konfiguration. Spätere Änderungen schreiben historische Rechte
  nicht um.
- Alte nullable Lesedaten werden nicht fachlich rückinterpretiert und nicht
  künstlich historisiert. Neue Tabellen und Verträge sind additiv.

## Gründe

Eine kanonische Beteiligtenidentität verhindert, dass dieselbe Person für
jeden Fall zwangsläufig neu entsteht. Zeitliche Anschriften und
Inhaberzeiträume erhalten fachlich relevante Vergangenheit, ohne vollständige
personenbezogene Inhalte in den technischen Audit zu kopieren.

Die separate Konfiguration verhindert kommunale Festverdrahtung. Der Snapshot
am Nutzungsrecht stellt gleichzeitig sicher, dass eine spätere
Konfigurationsänderung keine vergangene Fachentscheidung rückwirkend ändert.
Die Trennung vom alten Lesemodell vermeidet eine nicht belegbare Migration.

## Folgen

- Inkrement 5b benötigt neue kanonische Tabellen, starke Versionen,
  Fachrevisionen und providerneutrale Mutationsverträge.
- Die Datenbank erzwingt höchstens ein offenes kanonisches Nutzungsrecht je
  Grabstelle und höchstens einen offenen Inhaberzeitraum je Nutzungsrecht.
- Konfigurationsänderungen sind administrativ; fachliche Rechteoperationen
  stehen Sachbearbeitung und Administration zur Verfügung.
- Fristberechnung, Statusautomatik, endgültiges Ende und Wiedervorlagen bleiben
  ausdrücklich außerhalb 5b.
- Ein späteres Migrationsinkrement muss alte Projektionen anhand eigener,
  bestätigter Zuordnungsregeln übernehmen; 5b erfindet keine Identitäten oder
  Historie.

## Verworfene Alternativen

- Die vorhandenen fallgebundenen MVP-Zeilen direkt schreibbar machen.
- Namen und Anschriften bei jeder Rolle erneut kopieren.
- lokale 15-, 20- oder 30-Jahreswerte im Code oder in allgemeinen Seeds
  hinterlegen.
- Konfigurationsänderungen dynamisch auf bestehende Rechte anwenden.
- bereits in 5b automatische Fristen, Statuswechsel oder Wiedervorlagen
  erzeugen.
