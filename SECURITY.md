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
ist gemäß
[6c-Abschluss](docs/implementation/cemaris-increment-6c-completion.md)
vollständig umgesetzt. Sie verwendet eine eigene standardmäßig deaktivierte
Capability, bestehende Fallaktenrechte, einen starken Entwurfs-ETag, strikt
validierte makro- und externreferenzfreie DOCX-Vorlagen, direkte gekapselte
PDF-Konvertierung, isolierte Temp-Verzeichnisse und einen inhaltsfreien
Erzeugungsaudit.
Dokumentbytes, Inhalte, Pfade, Empfänger-, Kontakt-, Betrags- und Freitextwerte
dürfen weder gespeichert noch protokolliert werden. Produktivsetzung,
kommunale Vorlage und Betriebsaktivierung bleiben einem späteren Gate
vorbehalten.

OpenXML-Pakete werden vor und nach der Ersetzung auf Größen-, ZIP-,
Inhaltsart-, Token-, Beziehungs- und Validierungsgrenzen geprüft. LibreOffice
wird ohne Shell mit direkter Argumentliste, isoliertem Profil, begrenzter
Parallelität und Laufzeit sowie vollständigem Prozessbaumabbruch gestartet.
Temp-Bereinigung bleibt unter einem kanonischen Content-Root-Stamm, folgt
keinen Reparse Points und läuft nach Erfolg, Fehler und Abbruch. Ein
Auditfehler verhindert jede Dateiausgabe. Der realisierte Trust Boundary ist
in
[ADR-0019](docs/decisions/ADR-0019-ephemeral-secure-notice-document-generation.md)
dokumentiert.

Die Capability bleibt bis zum separat dokumentierten, noch nicht
ausgeführten
[Betriebs- und Pilotfreigabegate](docs/implementation/cemaris-notice-generation-pilot-release-gate-next-step-handoff.md)
aus. Dieses Gate muss insbesondere konkrete Serverrechte, LibreOffice-
Herkunft und -Version, Schriften, Temp-Schutz, Monitoring, synthetische
Ausgabeabnahme und Rückfall entscheiden.

## Offenlegung

Bitte ermögliche eine angemessene Analyse und Korrektur, bevor Details veröffentlicht werden. Ein verbindlicher Reaktionszeitraum kann vor der Etablierung eines Projekt-Sicherheitsteams noch nicht zugesagt werden.
