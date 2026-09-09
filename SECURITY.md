# Sicherheitsrichtlinie

## Lokaler Prototyp seit 07.09.2026

Die [Projektentscheidung](docs/requirements/notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
erlaubt lokale synthetische Entwicklung und Erprobung ohne erneute allgemeine
Freigaberunden. Dediziertes Dienstkonto, gehärtete Betriebs-ACLs,
Verschlüsselungsnachweis, Quota, externes Monitoring sowie formale
Aufbewahrungs- und Betriebsfreigaben sind für diesen Umfang zurückgestellt.
Diese Punkte bleiben vor einem späteren Echtbetrieb zu behandeln; ihre
Umsetzung wird hier nicht behauptet.

Anmeldung, Rollen, CSRF, ETag, Development-Grenze, Vorlagen-/Pfadprüfung,
Ressourcenlimits, inhaltsfreier Audit und Temp-Bereinigung bleiben erhalten.
Die Dokumenterzeugung darf im
[lokalen Praxistest](docs/implementation/cemaris-notice-generation-prototype-trial-next-step-handoff.md)
und dessen [abgegrenztem UI-Folgeauftrag](docs/implementation/cemaris-notice-generation-burial-selection-next-step-handoff.md)
prozesslokal für isolierte synthetische Tests aktiviert werden; portable
Defaults bleiben ausgeschaltet.
Der [M3a-Abschluss](docs/implementation/cemaris-manual-notice-line-items-completion.md)
weist diese isolierte Erzeugung mit Positionen und echtem mehrseitigem PDF nach.
Die gezielten SQL-Prüfungen verwendeten ausschließlich neu erzeugte entbehrliche
Testdatenbanken. Fixture-Bereinigung setzt eine erfolgreiche eigene Erzeugung
voraus; ein Namenspräfix allein ist keine Löschberechtigung.
`Features:NoticeDraftLineItemsEnabled` bleibt aus und benötigt Development und
`NoticeDraftEditingEnabled`. Neue Commands akzeptieren ausschließlich positive
Dezimalstrings, keine freie Summe. Alte Korrekturwege dürfen Positionsentwürfe
auch bei ausgeschalteter Capability nicht verändern. Vollständige Fachrevision,
Audit, Version und gegebenenfalls Nummernsequenz werden atomar gespeichert.
Strukturierte Rendererzeilen erweitern den Tokenvertrag ausschließlich um die
kontrollierte Wiederholung des geprüften Gebührenzeilen-Prototyps.
Secrets, bestehende Datenbanken und fremde Dateien bleiben geschützt.
Die unten beschriebenen früheren Pilotgates sind für diesen Prototypumfang
keine zusätzliche Freigabevoraussetzung.

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

Das separat dokumentierte
[Betriebs- und Pilotfreigabegate](docs/implementation/cemaris-notice-generation-pilot-release-gate-completion.md)
ist mit Variante A „Stop“ abgeschlossen. Die gewünschte Nutzung des
Development-Repositorys mit `Cemaris_Dev` ist inzwischen als eigens
geschaffene kombinierte Development- und Testpilotumgebung klargestellt und
kein Datenbankwiderspruch mehr. Auf dem Pilot-PC ist kein LibreOffice
installiert gewesen; dieser Befund ist seit dem 01.09.2026 überholt.
LibreOffice `26.8.0.3` ist jetzt gültig signiert und startfähig. Installer-
und Wartungsweg, Dienstkontogrenze und konkrete Serverrechte waren zunächst
weiter offen. Die
[technische Readiness-Neubewertung](docs/implementation/cemaris-notice-generation-synthetic-pilot-readiness-completion.md)
hat Schriften, reale ausschließlich synthetische Ausgabe, Temp-Bereinigung und
technischen Rückfall bestätigt. Sie behob einen reproduzierbaren Verlust des
PDF-Parallelitätsslots sowie die fehlende sichtbare Entwurfskennzeichnung
minimal und regressionsgesichert. Vollbackup/Restore, Monitoring,
Least-Privilege-ACLs, Verschlüsselung, Quota, belastbare kurze Betriebspfade,
Auditaufbewahrung/-löschung und zuständige Sicherheits-/Betriebsfreigaben
fehlen weiterhin. Die Capability bleibt aus; es entstand kein
Aktivierungsauftrag.

Der
[Betriebsremediations-Folgeauftrag](docs/implementation/cemaris-notice-generation-synthetic-pilot-operational-remediation-completion.md)
ist ausgeführt. Das neue `COPY_ONLY`-Vollbackup mit Checksum wurde verifiziert,
ausschließlich auf dem bestätigten entbehrlichen Prüfdatenbankziel
wiederhergestellt und inhaltsfrei mit `DBCC CHECKDB`, Migrationen und
Aggregaten geprüft; nur dieses Ziel wurde danach entfernt und die Sicherung
bleibt erhalten. Die Prüfung änderte keine systemweiten Konten, ACLs,
Verschlüsselung, Quotas, LibreOffice- oder Monitoringinstallation und keine
Capability. Dienstidentität, Least Privilege, Verschlüsselung, Quota,
externes Monitoring, Auditbetriebsregeln und zuständige Sicherheits-/
Betriebsfreigaben waren zum Abschluss offen oder teilweise bestätigt.
Die damalige Variante A wird für die lokale Prototypentwicklung durch die
oben dokumentierte Entscheidung vom 07.09.2026 abgelöst.

## Offenlegung

Bitte ermögliche eine angemessene Analyse und Korrektur, bevor Details veröffentlicht werden. Ein verbindlicher Reaktionszeitraum kann vor der Etablierung eines Projekt-Sicherheitsteams noch nicht zugesagt werden.
