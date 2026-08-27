# Sicherheitsrichtlinie

## Unterstützte Versionen

Es wurde noch keine produktive Version von Cemaris veröffentlicht. Sicherheitskorrekturen werden derzeit ausschließlich auf dem aktuellen Entwicklungsstand vorgenommen.

## Sicherheitsproblem melden

Bitte veröffentliche vermutete Schwachstellen, Exploit-Details, Zugangsdaten oder Beispiel-Verwaltungsdaten **nicht** in einem öffentlichen Issue.

Für dieses neu angelegte Projekt ist noch kein separater privater Sicherheitskontakt festgelegt. Nutze, sobald verfügbar, die private Funktion „Report a vulnerability“ beziehungsweise ein Security Advisory des Repositorys. Falls dort noch kein privater Kanal angeboten wird, bitte die Repository-Verantwortlichen ohne technische Details um einen vertraulichen Kontaktweg.

Eine Meldung sollte, soweit gefahrlos möglich, enthalten:

- betroffene Version oder Commit,
- reproduzierbare Schritte mit synthetischen Daten,
- mögliche Auswirkungen,
- bekannte Voraussetzungen,
- Vorschläge zur Risikominderung.

## Umgang mit Verwaltungsdaten

Keine echten Verwaltungs- oder Personendaten in Fehlermeldungen, Screenshots, Logs, Testdaten oder Proofs of Concept aufnehmen. Vor dem Teilen müssen Inhalte anonymisiert und Secrets entfernt werden.

## Development-Fachfunktionen

Schreibende Fachfunktionen sind repositoryseitig standardmäßig deaktiviert.
Der kanonische manuelle Bescheidentwurf verwendet die separate Capability
`Features:NoticeDraftEditingEnabled`; sie ist ausschließlich in
`Development` zulässig. Die serverseitige Policy `NoticeDrafts` schützt
Lesen, Anlage, Korrektur und Verwerfen für `Sachbearbeitung` und
`Administration`. Die Nummernkonfiguration bleibt über
`ProgramConfiguration` ausschließlich administrativ. Navigation oder
Capability ersetzen keine Autorisierung.

Alle Mutationen verlangen Antiforgery. Korrektur, Verwerfen und
Konfigurationsänderung verlangen zusätzlich einen starken aktuellen ETag.
Fachrevisionen enthalten den notwendigen Snapshot; der getrennte technische
Audit enthält keine Beträge, Kontierung, Gründe, Adressen oder Freitexte und
besitzt keine Lese-, Such- oder Export-API. Der 6b-Kern ist rechtlich
wirkungslos und keine Produktiv-, Dokument-, Finanz- oder Datenfreigabe.

Das nachgelagerte
[6c-Bescheiderzeugungsgate](docs/implementation/cemaris-notice-generation-decision-gate-completion.md)
hat nach ergänzender Quellenklärung genau einen technischen
Development-Kandidaten freigegeben. Die
[6c-Übergabe](docs/implementation/cemaris-increment-6c-next-step-handoff.md)
verlangt eine eigene standardmäßig deaktivierte Capability, bestehende
Fallaktenrechte, starken Entwurfs-ETag, strikt validierte makro- und
externreferenzfreie DOCX-Vorlagen, direkte gekapselte PDF-Konvertierung,
isolierte Temp-Verzeichnisse und einen inhaltsfreien Erzeugungsaudit.
Dokumentbytes, Inhalte, Pfade, Empfänger-, Kontakt-, Betrags- und Freitextwerte
dürfen weder gespeichert noch protokolliert werden. Produktivsetzung,
kommunale Vorlage und Betriebsaktivierung bleiben einem späteren Gate
vorbehalten.

## Offenlegung

Bitte ermögliche eine angemessene Analyse und Korrektur, bevor Details veröffentlicht werden. Ein verbindlicher Reaktionszeitraum kann vor der Etablierung eines Projekt-Sicherheitsteams noch nicht zugesagt werden.
