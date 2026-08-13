# Übergabe: Fachliche Stammdaten und vollständiger Beisetzungsprozess

Stand: 13.08.2026

## Ziel des nächsten Inkrements

Bereite Inkrement 4 ausschließlich auf Grundlage bestätigter fachlicher
Entscheidungen vor und implementiere danach die freigegebenen Friedhofs-
Stammdaten und Prozessschritte Ende zu Ende. Vor einer Implementierung sind
Anwenderinterview, Satzungsgrundlagen, erlaubte Werte, Historien- und
Validierungsregeln ausdrücklich zu dokumentieren. Unbekannte
Friedhofsfachregeln dürfen nicht geraten werden.

## Verbindlicher technischer Ausgangszustand

- Lokale Konten, Cookie-Sitzung, CSRF, Security-Stamp und Policies sind
  implementiert. Beide Systemrollen dürfen Fachfunktionen nutzen;
  Benutzerverwaltung bleibt Administration vorbehalten.
- Fachänderungen verwenden den authentifizierten stabilen lokalen Benutzer als
  atomaren Auditakteur. ETag/If-Match, Fallversion, `lastChange` und
  `CaseChanges` bleiben erhalten.
- Der Schreibpfad bleibt bis zu späteren Gates standardmäßig deaktiviert,
  Development-only und synthetisch.
- Vollständige Auditdaten und Betreiberlogs erhalten keine Cemaris-API oder UI.

## Vor jeder Umsetzung zu klären

- Welche Friedhöfe, Felder und weiteren räumlichen Ebenen existieren und wie
  werden sie historisiert?
- Welche Grabarten und Statuswerte sind tatsächlich gültig?
- Welche Schritte bilden einen vollständigen Beisetzungsprozess, welche sind
  Pflicht und wer darf sie wann ändern?
- Welche Beziehungen, Nummernkreise, Plausibilitäten und Storno-/Löschgrenzen
  sind bestätigt?
- Welche Datenschutz-, Aufbewahrungs- und Betriebsfreigaben gelten für die
  hinzukommenden Daten?

## Schutzgrenzen

Keine Gebühren-, Fristen-, Nutzungsrechts-, Lösch-, Storno-, Dokument-, LDAP-
oder EDWALT-Regeln vorziehen. Keine echten Verwaltungsdaten verwenden. Keine
umfassende Produktivfreigabe behaupten. Vor Arbeiten erneut Repositorystatus,
Pflichtdokumente und alle betroffenen Dateien vollständig prüfen.
