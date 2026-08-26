# Konzept für Dokumente und Bescheide

> **Status:** Zu validierende Produktvision. Das dokumentarische
> [Gebühren-/Bescheid-Entscheidungsgate 6a](../implementation/cemaris-increment-6a-completion.md)
> ist mit Variante A „noch keine Implementierung“ abgeschlossen. Es ist weder
> eine Template-Engine noch ein fachlicher Bescheidtyp oder 6b-Schnitt
> freigegeben. Auch das nachgelagerte
> [6a-F-Gate](../implementation/cemaris-manual-notice-facts-approval-completion.md)
> gibt nach ergänzender funktionsbezogener Klärung ausschließlich den
> [technischen 6b-Schnitt](../implementation/cemaris-increment-6b-next-step-handoff.md)
> für rechtlich wirkungslose manuelle Entwürfe frei. Die spätere
> Cemaris-Bescheiderzeugung ist als Zielbild belegt, bleibt aber ein eigenes
> Freigabegate.

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
freigegeben. 6b darf diesen getrennten kanonischen Kern implementieren.
Bescheiderzeugung, Bekanntgabe, Versand, Vorlage, Rechtsbehelfsbelehrung und
Dokumentaufbewahrung bleiben außerhalb. Die konkreteren Entwurfsfakten sind
daher kein Dokumentvertrag.

## Zielbild

```text
kommuneneigene, versionierte Vorlage
  → validierte Platzhalter und Daten
  → Vorschau
  → fachliche Freigabe
  → finales DOCX und/oder PDF
  → kontrollierte Übergabe an das DMS
```

Das spätere Modul soll kommuneneigene Briefköpfe und Vorlagen unterstützen, ohne Rechts- oder Bescheidtexte im Produkt fest zu erfinden. Für jedes erzeugte Dokument muss nachvollziehbar bleiben, welche Vorlagenversion, Datenbasis und Freigabe verwendet wurden.

Für eine aktivierte Winyard-Integration ist die automatische Ablage fertiger
Dokumente als `Soll` bestätigt
([REQ-DMS-005](../requirements/README.md),
[INT-019](../requirements/edwalt-analysis/interview-record.md)). Cemaris muss
zunächst ohne Winyard produktiv betrieben und die Integration später aktiviert
werden können ([REQ-DMS-010](../requirements/README.md),
[INT-020](../requirements/edwalt-analysis/interview-record.md)). Eine dauerhafte
Winyard-Dokument-ID in Cemaris und das Öffnen des archivierten Dokuments aus
Cemaris sind nicht erforderlich (REQ-DMS-007/008, `VERWORFEN`). Bei aktivierter
Integration müssen Erfolg oder Fehler der Übergabe dagegen angezeigt werden
(REQ-DMS-004, bedingtes Muss).

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

Keine Option ist entschieden. Ein Proof of Concept darf erst nach einer
zuständigen Freigabe repräsentative, rechtmäßig bereitgestellte und für den
Zweck angemessen geschützte Vorlagen vergleichen.

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
- technisch notwendige Korrelation und Wiederholung ohne dauerhafte
  Winyard-Dokument-ID als Fachanforderung,
- Verhalten bei DMS-Ausfall,
- benötigte Aufbewahrung von Entwürfen und Zwischenständen.
