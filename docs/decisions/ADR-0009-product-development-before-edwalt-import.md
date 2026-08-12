# ADR-0009: Produktentwicklung vor Fortsetzung des EDWALT-Imports

- Status: Accepted
- Datum: 2026-08-12
- Entscheider: Projektverantwortung

## Kontext

Der erste ausschließlich lesende Cemaris-Abschnitt mit Suche und
Detailansicht ist technisch umgesetzt. Die technische EDWALT-Analyse hat nach
vier Phasen einen reproduzierbaren Stand erreicht; für den späteren Import
bleiben weitere Varianten-, Mapping- und Fachentscheidungen erforderlich.

Eine fortgesetzte Detailanalyse des Altverfahrens würde die Entwicklung einer
nutzbaren Fachsoftware nicht unmittelbar voranbringen. Zugleich dürfen offene
EDWALT-Semantik oder noch nicht erhobene kommunale Fachregeln nicht als
Cemaris-Zielmodell übernommen werden.

## Entscheidung

Die produktbezogene Cemaris-Implementierung erhält jetzt Vorrang. Die
EDWALT-Analyse wird nach Phase 4 kontrolliert pausiert. Ihr verifizierter Stand
und der bereits formulierte Phase-5-Auftrag bleiben erhalten, werden aber erst
vor der konkreten Import- und Mappingphase fortgesetzt.

Cemaris wird in kleinen, vollständig getesteten vertikalen Inkrementen
entwickelt. Jedes Inkrement muss:

- auf bestätigten Anforderungen oder ausdrücklich dokumentierten technischen
  Begrenzungen beruhen;
- einen Ende-zu-Ende-Nutzen in Domain/Application, Persistenz, API, UI und
  Tests liefern, soweit diese Schichten betroffen sind;
- unbekannte Fachregeln sichtbar offenlassen und darf sie weder aus EDWALT
  noch aus üblichen Branchenannahmen ableiten;
- standardmäßig sicher sein und unfertige schreibende Funktionen nicht
  ungeschützt für einen Produktivbetrieb freigeben;
- die spätere Migration über stabile Anwendungsgrenzen ermöglichen, ohne das
  Cemaris-Modell an EDWALT-Dateien zu koppeln.

Der nächste Produktinkrement ist eine schreibende Fallakten-Grundlage für
bereits in der Lesesicht bestätigte Grunddaten. Sie umfasst zunächst nur
manuell erfasste Tatsachen zu Grabstellenbezug, verstorbenen Personen und
Beisetzungen. Berechnungen, fachliche Status, Löschung, Gebührenfestsetzung,
Bescheiderzeugung, Fristlogik, Winyard und EDWALT-Import bleiben außerhalb.

Bis Identitätsquelle, produktive Berechtigungen und Auditvorgaben entschieden
und implementiert sind, bleibt dieser Schreibpfad standardmäßig deaktiviert
und auf eine ausdrücklich aktivierte Entwicklungsumgebung mit synthetischen
Daten begrenzt.

## Alternativen

- **EDWALT-Analyse bis zum vollständigen Mapping fortsetzen:** verworfen, weil
  sie die produktbezogene Entwicklung unnötig seriell blockiert.
- **Das gesamte Fachmodell in einem Schritt implementieren:** verworfen, weil
  zentrale Prozess-, Rechts-, Rollen-, Gebühren- und Aufbewahrungsregeln noch
  offen sind und dadurch Scheinsicherheit entstehen würde.
- **Nur technische Infrastruktur ohne vertikalen Anwendungsfall ergänzen:**
  verworfen, weil ein getesteter Ende-zu-Ende-Schnitt frühere Rückmeldung und
  bessere Architekturentscheidungen ermöglicht.

## Folgen

- Die Phase-4-Ergebnisse und alle Quellarbeitsbereiche bleiben unverändert und
  read-only; die Phase-5-Wurzel wird noch nicht angelegt.
- Der Produktfortschritt wird nicht mehr an die vollständige EDWALT-
  Rekonstruktion gekoppelt.
- Der erste Schreibpfad ist noch keine Produktivfreigabe. Authentifizierung,
  Autorisierung, Auditierung, Datenschutz und Betrieb bleiben ausdrückliche
  Freigabegates.
- Fachliche Regeln werden weiterhin gemäß ADR-0007 erst nach belastbarer
  Entscheidung implementiert.
- Spätere Importadapter müssen dieselben Anwendungs- und Validierungsgrenzen
  verwenden wie manuelle Erfassung; ein direkter Import in UI- oder
  Altverfahrensmodelle ist ausgeschlossen.

## Offene Punkte

- produktive Identitätsquelle sowie Rollen- und Berechtigungsmatrix;
- fachlich auditpflichtige Lese- und Schreibereignisse;
- vollständiger Standardbeisetzungsprozess und erforderliche Pflichtfelder;
- Personenrollen, Nutzungsrechts-, Ruhefrist-, Gebühren- und Korrekturregeln;
- Datenschutz-, Aufbewahrungs- und Betriebsfreigabe.
