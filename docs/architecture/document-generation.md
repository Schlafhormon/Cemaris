# Konzept für Dokumente und Bescheide

> **Status:** Genau ein technischer Development-Kandidat ist gemäß
> [6c-Abschluss](../implementation/cemaris-increment-6c-completion.md) Ende zu
> Ende implementiert, standardmäßig deaktiviert und nicht produktiv
> freigegeben. Das
> [6c-Entscheidungsgate](../implementation/cemaris-notice-generation-decision-gate-completion.md)
> grenzt einen rechtlich wirkungslosen Gebührenbescheidentwurf für
> Beisetzungsgebühren ab und endet nach ergänzender Quellenklärung mit
> Variante B. Die separate
> [technische Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md)
> ist ausgeführt. Das
> [Betriebs- und Pilotfreigabegate](../implementation/cemaris-notice-generation-pilot-release-gate-completion.md)
> ist am 31.08.2026 vollständig mit Variante A „Stop“ abgeschlossen;
> die
> [technische Readiness-Neubewertung](../implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
> endet am 01.09.2026 erneut mit Variante A. Capability und
> Aktivierungsauftrag bleiben aus.

## Ergebnis des Entscheidungsgates 6a

Die [6a-Entscheidungsakte](../requirements/fee-notice-document-decisions.md)
bestätigt zwar administrative Vorlagenpflege und bedingte Fähigkeiten einer
später aktivierten DMS-Integration. Nicht bestätigt sind jedoch erste
Dokumentart, Rechtsinhalt, Vorlagenversion, Platzhalter, Ausgabeformat,
Freigabe, Versand, Aufbewahrung, temporäre Verarbeitung und Renderer. Das
nachfolgende Zielbild und die technischen Ansätze bleiben deshalb
unverbindliche Prüfoptionen. Sie bilden weder eine Implementierungsfreigabe
noch ein Daten-, Prozess- oder Dokumentmodell.

6a-F hat bewusst nur einen internen, rechtlich wirkungslosen Faktenentwurf
freigegeben. 6b hat diesen getrennten kanonischen Kern gemäß
[Abschlussnachweis](../implementation/cemaris-increment-6b-completion.md)
implementiert.
Bescheiderzeugung, Bekanntgabe, Versand, Vorlage, Rechtsbehelfsbelehrung und
Dokumentaufbewahrung bleiben außerhalb. Die konkreteren Entwurfsfakten sind
daher kein Dokumentvertrag.

Das nachgelagerte
[dokumentarische 6c-Gate](../requirements/notice-generation-decisions.md) hat
die Produktgrenze feldgenau konkretisiert und nach ergänzender Testquellen-,
Qualitäts-, ETag-, Audit- und Aufbewahrungsklärung genau einen technischen
Development-Kandidaten freigegeben. Eine Produktiv- oder Betriebsfreigabe ist
damit nicht verbunden.

## Entschiedener technischer Kandidat 6c

Die ausgeführte
[6c-Übergabe](../implementation/cemaris-increment-6c-next-step-handoff.md)
verbindet Open-XML-basierte DOCX-Platzhalterersetzung mit einer gekapselten
serverseitigen Headless-Konvertierung nach PDF. Produktivvorlagen liegen
read-only in einem konfigurierten Serverstamm; Cemaris verwaltet weder Upload
noch Version oder Freigabe. Eine versionierte synthetische Test-Fixture wird
aus der freigegebenen lokalen Testquelle abgeleitet.

Die Architektur ergänzt Benutzerkontaktfelder, kleine versionierte
Satzungsstammdaten, eine eigene Capability/Policy und einen inhaltsfreien
Erzeugungsaudit. Das Ergebnis wird nur gestreamt, nie serverseitig archiviert.
Jede Erzeugung besitzt ein isoliertes Temp-Verzeichnis; Vorlage, Tokens,
Pfade und Konverterprozess werden strikt validiert. Winyard, FINANZ+,
Serverdruck, Versand und Rückimport bleiben außerhalb.

## Bestätigter Kandidat und Ablauf

```text
aktuelle, kommunal verantwortete Serverdatei
  + aktuelle Fall-, Stamm- und manuelle Entwurfsdaten
  → rechtlich wirkungsloser Gebührenbescheidentwurf
  → DOCX- oder PDF-Export beziehungsweise Druck
  → Ende des Cemaris-Vorgangs
```

Die Friedhofsverwaltung verantwortet Inhalt, Freigabe, Aktualität und
Gültigkeit der kommunalen Vorlage. Sachbearbeitungen melden Änderungen an die
Administration; diese ersetzt die Datei außerhalb von Cemaris im
Serverdateisystem. Cemaris soll die Vorlage nur lesen und weder
Vorlagenversionen noch örtliche Inhaltsfreigaben verwalten.

Die Ausgabe ist ein Vorschlag ohne Festsetzung oder Rechtswirkung. Cemaris
kennt keinen Status „fachlich freigegeben“ oder „versandt“. Eine exportierte
DOCX-Datei kann außerhalb bearbeitet werden; sie kommt nicht zurück. Das
Dokument wird nicht in Cemaris gespeichert. Eine Neuerzeugung verwendet den
dann aktuellen Daten- und Vorlagenstand und muss einen früheren Export nicht
reproduzieren.

Für eine spätere, getrennt aktivierte Winyard-Integration ist die automatische Ablage fertiger
Dokumente als `Soll` bestätigt
([REQ-DMS-005](../requirements/README.md),
[INT-019](../requirements/edwalt-analysis/interview-record.md)). Cemaris muss
zunächst ohne Winyard produktiv betrieben und die Integration später aktiviert
werden können ([REQ-DMS-010](../requirements/README.md),
[INT-020](../requirements/edwalt-analysis/interview-record.md)). Eine dauerhafte
Winyard-Dokument-ID in Cemaris und das Öffnen des archivierten Dokuments aus
Cemaris sind nicht erforderlich (REQ-DMS-007/008, `VERWORFEN`). Bei aktivierter
Integration müssen Erfolg oder Fehler der Übergabe dagegen angezeigt werden
(REQ-DMS-004, bedingtes Muss). Diese Fähigkeiten gehören ausdrücklich nicht
zum abgegrenzten 6c-Kandidaten.

## Im 6c-Nachtrag erfüllte Anforderungen

- eine rechtmäßig bereitgestellte synthetische DOCX-Testquelle mit
  technischen Platzhaltern und freigegebener Fixture-Ableitung;
- Pflichtstatus, Quelle und Darstellung aller 23 unterstützten variablen
  Felder einschließlich Benutzerkontakt und Satzungsstammdaten;
- überprüfbare DOCX-/PDF-/Druckqualität; PDF/A, PDF/UA, Signatur und Siegel
  sind ausdrücklich nicht Teil des ersten Kandidaten;
- starker aktueller 6b-Entwurfs-ETag und konsistenter aktueller
  Quelldatenstand; keine Fachmutation oder zusätzliche Fachrevision;
- isolierte Temp-Dateigrenze und inhaltsfreier Audit nach kommunaler
  Fall-/Auditaufbewahrung.

## Mögliche technische Ansätze

| Ansatz | Vorteile | Nachteile / Risiken |
| --- | --- | --- |
| DOCX als ZIP/OOXML direkt bearbeiten | Offener Standard, hohe Kontrolle, kein Office-Server nötig | Komplex bei Bedingungen, Schleifen und Layout; sorgfältige Tests erforderlich |
| Spezialisierte DOCX-Template-Bibliothek | Komfortable Platzhalter und häufig gute Office-Kompatibilität | Lizenz, Wartung, Funktionsgrenzen und Vendor-Lock-in prüfen |
| Headless Office zur Konvertierung | Gute Wiederverwendung bestehender Office-Vorlagen, PDF-Ausgabe möglich | Betriebsaufwand, Ressourcenbedarf, Parallelität und Konvertierungstreue prüfen |
| Separater Dokumentdienst | Klare Isolation und skalierbare Konvertierung | Zusätzlicher Betrieb und verteilte Fehlerfälle; für den Start möglicherweise zu komplex |
| HTML/CSS zu PDF | Webtechnologien und gute Testbarkeit | DOCX-Nachbearbeitung und exakte kommunale Office-Vorlagen schwieriger |

Für den eng begrenzten 6c-Development-Kandidaten wählt die ausgeführte
technische Übergabe direkte OOXML-Bearbeitung mit dem Open XML SDK und eine
gekapselte Headless-LibreOffice-Konvertierung. Die übrigen Ansätze bleiben
Vergleichsoptionen für spätere Dokumentarten; daraus folgt keine allgemeine
Engine- oder Produktiventscheidung.

## Mit 6c umgesetzt

- validierte Platzhalterdefinitionen,
- Renderer beziehungsweise Konverter als austauschbarer Port,
- autorisierte Ausgabe ohne Dokumentarchivierung,
- sparsamer inhaltsfreier Erzeugungsaudit,
- technische Bereinigung temporärer Dateien.

Die tatsächliche Paket-, Prozess-, Temp-, Capability- und Auditentscheidung
ist in
[ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md)
dokumentiert. Die echte installierte LibreOffice-Version, kommunale
Pilotvorlage, Serverrechte, Schriftversorgung und visuelle
DOCX-/PDF-/Druckabnahme wurden im ersten Pilot-Folgegate nicht belegt. Die
Readiness hat inzwischen `Cemaris_Dev` und das vollständige 6b-/6c-Schema
read-only sowie LibreOffice `26.8.0.3`, Schriften, reale synthetische
Konvertierung, A4/Textselektion, visuellen Vergleich, Druck-zu-Datei und
Temp-/Prozessbereinigung bestätigt. Sie korrigiert innerhalb von ADR-0019
minimal einen verlorenen Parallelitätsslot und ergänzt genau eine sichtbare
Kennzeichnung als rechtlich wirkungsloser Entwurf. Vollbackup/Restore,
Installer-/Wartungsweg, gehärtete Rechte und Pfade, Monitoring,
Auditaufbewahrung/-löschung sowie zuständige Freigaben fehlen weiterhin und
tragen Variante A.

## Sicherheits- und Datenschutzleitplanken

- Dokumentinhalte nicht in Anwendungslogs schreiben.
- Temporäre Dateien verschlüsselt beziehungsweise in kontrollierten Verzeichnissen verarbeiten und zuverlässig löschen.
- Vorlagen als potenziell aktive Inhalte behandeln; Makros und externe Referenzen prüfen.
- Platzhalter strikt validieren und keine freie Codeausführung erlauben.
- Erzeugung, Download und Druck über die vorhandenen Fallaktenrechte
  autorisieren und inhaltsfrei auditieren.
- Freigabe, Archivierung und erneute Erzeugung eindeutig unterscheiden.

## Außerhalb des ersten 6c-Kandidaten offen

- Engine und Vorlagenvertrag weiterer Dokumentarten,
- PDF/A-, PDF/UA-, Signatur- und Siegelanforderungen künftiger Kandidaten,
- produktive Serverpfade, installierte Konverterversion, kommunale
  Produktivvorlage und Betriebsaktivierung,
- technisch notwendige Korrelation und Wiederholung ohne dauerhafte
  Winyard-Dokument-ID als Fachanforderung,
- Verhalten bei DMS-Ausfall,
- konkrete kommunale Kalendervorgaben zur allgemeinen Fall-/Auditaufbewahrung;
  erzeugte Dokumente und Zwischenstände bleiben nach der bestätigten
  Produktgrenze ungespeichert.
