# Konzept für Dokumente und Bescheide

> **Status:** Zu validierende Produktvision. Es ist weder eine Template-Engine noch ein fachlicher Bescheidtyp festgelegt.

## Zielbild

```text
kommuneneigene, versionierte Vorlage
  → validierte Platzhalter und Daten
  → Vorschau
  → fachliche Freigabe
  → finales DOCX und/oder PDF
  → nachvollziehbare Ablage im DMS
```

Das spätere Modul soll kommuneneigene Briefköpfe und Vorlagen unterstützen, ohne Rechts- oder Bescheidtexte im Produkt fest zu erfinden. Für jedes erzeugte Dokument muss nachvollziehbar bleiben, welche Vorlagenversion, Datenbasis und Freigabe verwendet wurden.

## Zu erhebende Anforderungen

- Welche Schreiben, Bescheide und Anlagen existieren tatsächlich?
- Wer pflegt und wer genehmigt Vorlagen?
- Welche Platzhalter, Wiederholbereiche, Tabellen und Bedingungen werden benötigt?
- Müssen bestehende DOCX-Vorlagen unverändert weiterverwendet werden?
- Welche Anforderungen gelten an Barrierefreiheit, PDF/A, Signaturen und Langzeitarchivierung?
- Wann gilt ein Dokument als Entwurf, freigegeben, versandt oder storniert?
- Welche Nachweise und Aufbewahrungsfristen gelten?
- Welche Daten dürfen in Vorschau, temporären Dateien und Logs vorkommen?
- Muss das finale Dokument unveränderbar gespeichert werden und welches System ist führend?

## Mögliche technische Ansätze

| Ansatz | Vorteile | Nachteile / Risiken |
| --- | --- | --- |
| DOCX als ZIP/OOXML direkt bearbeiten | Offener Standard, hohe Kontrolle, kein Office-Server nötig | Komplex bei Bedingungen, Schleifen und Layout; sorgfältige Tests erforderlich |
| Spezialisierte DOCX-Template-Bibliothek | Komfortable Platzhalter und häufig gute Office-Kompatibilität | Lizenz, Wartung, Funktionsgrenzen und Vendor-Lock-in prüfen |
| Headless Office zur Konvertierung | Gute Wiederverwendung bestehender Office-Vorlagen, PDF-Ausgabe möglich | Betriebsaufwand, Ressourcenbedarf, Parallelität und Konvertierungstreue prüfen |
| Separater Dokumentdienst | Klare Isolation und skalierbare Konvertierung | Zusätzlicher Betrieb und verteilte Fehlerfälle; für den Start möglicherweise zu komplex |
| HTML/CSS zu PDF | Webtechnologien und gute Testbarkeit | DOCX-Nachbearbeitung und exakte kommunale Office-Vorlagen schwieriger |

Keine Option ist vor der Vorlageninventur entschieden. Ein Proof of Concept soll später repräsentative reale, aber anonymisierte Vorlagen vergleichen.

## Vorläufige Komponenten

- Vorlagenkatalog mit Version und Gültigkeit,
- validierte Platzhalterdefinitionen,
- Renderer beziehungsweise Konverter als austauschbarer Port,
- Vorschau ohne endgültige Archivierung,
- expliziter Freigabeschritt,
- unveränderbare Referenz auf erzeugtes Ergebnis und Vorlagenversion,
- Übergabe über den DMS-Adapter,
- technische Bereinigung temporärer Dateien.

## Sicherheits- und Datenschutzleitplanken

- Dokumentinhalte nicht in Anwendungslogs schreiben.
- Temporäre Dateien verschlüsselt beziehungsweise in kontrollierten Verzeichnissen verarbeiten und zuverlässig löschen.
- Vorlagen als potenziell aktive Inhalte behandeln; Makros und externe Referenzen prüfen.
- Platzhalter strikt validieren und keine freie Codeausführung erlauben.
- Vorschau und Download autorisieren und auditierbar machen.
- Freigabe, Archivierung und erneute Erzeugung eindeutig unterscheiden.

## Offene Entscheidungen

- konkrete Template- und Konvertierungsengine,
- DOCX-, PDF- und PDF/A-Anforderungen,
- Vorlagenverwaltung und Freigabeworkflow,
- Signatur- und Siegelanforderungen,
- Verhältnis lokaler Dokumentreferenz zu Winyard,
- Verhalten bei DMS-Ausfall,
- benötigte Aufbewahrung von Entwürfen und Zwischenständen.
