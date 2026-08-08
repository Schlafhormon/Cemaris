# ADR-0008: Open-Source-Lizenz

- Status: Proposed
- Datum: 2026-08-08

## Kontext

Cemaris soll offen und durch andere Kommunen nachnutzbar sein. Im neu angelegten Repository besteht noch keine Lizenzvorgabe. Eine Lizenzentscheidung beeinflusst Beiträge, Weitergabe, kommunale Kooperation, kommerzielle Dienstleister und den Betrieb veränderter Webanwendungen.

## Vorschlag

Vor der ersten Veröffentlichung sollen insbesondere EUPL-1.2 und AGPL-3.0 fachkundig geprüft werden. Bis zur Entscheidung enthält das Repository nur einen Lizenzstatus-Hinweis und keinen vollständigen Lizenztext.

## Vorläufiger Vergleich

| Kriterium | EUPL-1.2 | AGPL-3.0 |
| --- | --- | --- |
| Copyleft | Copyleft-Lizenz mit Pflichten bei Weitergabe beziehungsweise öffentlicher Bereitstellung abgeleiteter Werke | Starkes Copyleft für abgeleitete Werke |
| Netzwerkbereitstellung | Der EUPL-Begriff der „Distribution or Communication“ bezieht Onlinezugriff auf wesentliche Funktionalitäten ein; genaue Pflichten für das Betriebsmodell rechtlich prüfen | Abschnitt 13 verlangt bei modifizierter, netzwerkinteraktiver Software ein Quellcodeangebot an remote interagierende Nutzer |
| Kompatibilität | Enthält einen ausdrücklichen Kompatibilitätsmechanismus und eine Liste kompatibler Lizenzen; Wirkung je Kombination prüfen | Kompatibilität richtet sich nach AGPL/GPL-Regeln und den Lizenzen aller Abhängigkeiten |
| Europäischer Verwaltungskontext | Von der Europäischen Kommission veröffentlicht, in 23 EU-Amtssprachen verfügbar und auf EU-Rechtskontext ausgerichtet | International sehr bekannt und speziell für Netzwerksoftware entwickelt |
| Nachnutzung | Kann kommunale und europäische Kooperation erleichtern; konkrete Beschaffungs- und Beitragsmodelle prüfen | Stellt die Veröffentlichung von Änderungen auch bei relevantem Netzwerkbetrieb besonders deutlich in den Mittelpunkt |

## Zu prüfende Fragen

- Soll die Verpflichtung zur Freigabe betrieblicher Änderungen bei Netzwerkzugriff ausdrücklich im Vordergrund stehen?
- Welche proprietären oder Open-Source-Abhängigkeiten sind geplant und kompatibel?
- Wie sollen Beiträge, Copyright und Contributor-Vereinbarungen verwaltet werden?
- Welche Anforderungen stellen beteiligte Kommunen, Fördergeber und Dienstleister?
- Wird eine Lizenz mit „or later“-Klausel gewünscht?
- Welche Hinweise müssen in UI, Distribution und Containerbildern erscheinen?

## Quellen

- [Offizieller EUPL-1.2-Text und Sprachfassungen](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
- [Offizieller GNU-AGPL-3.0-Text](https://www.gnu.org/licenses/agpl-3.0.html)

## Hinweis

Diese ADR ist eine technische und organisatorische Entscheidungsvorlage, keine Rechtsberatung. Die endgültige Auswahl und korrekte Anwendung müssen rechtlich geprüft werden.
