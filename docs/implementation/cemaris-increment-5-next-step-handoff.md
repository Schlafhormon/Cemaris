# Folgeübergabe: fachliche Klärung und sicherer Zuschnitt von Inkrement 5

Stand: 13.08.2026

## Ausgangslage

Inkrement 4b ist technisch abgeschlossen; maßgeblich sind die
[Abschlussdokumentation](cemaris-increment-4b-completion.md), die
[Prozessarchitektur](../architecture/burial-process.md) und
[ADR-0015](../decisions/ADR-0015-atomic-burial-process.md). Der nächste im
Implementierungsplan genannte Fachbereich umfasst Personenrollen,
Nutzungsrechte, Ruhefristen und Wiedervorlagen. Dafür fehlen noch ausreichend
präzise, allgemein gültige Produktentscheidungen. Der nächste sichere Schritt
ist deshalb ein entscheidungsorientiertes Inkrement 5a; Implementierung darf
erst nach geschlossenem Freigabegate beginnen.

## Verbindlich zuerst vollständig lesen

- `README.md`, `SECURITY.md` und `docs/implementation/README.md`;
- `docs/implementation/cemaris-increment-4b-completion.md`;
- `docs/requirements/burial-process-decisions.md`;
- `docs/requirements/cemetery-master-data-decisions.md`;
- `docs/requirements/case-record-write-decisions.md`;
- `docs/requirements/identity-authorization-audit-decisions.md`;
- `docs/architecture/cemetery-master-data.md`;
- `docs/architecture/burial-process.md`;
- `docs/architecture/authentication-authorization-audit.md`;
- ADR-0007, ADR-0009 bis ADR-0015.

Lokale Satzungen dürfen ausschließlich lesend als kommunale Evidenz genutzt
werden. EDWALT ist weder Sollprozess noch Quelle für unbestätigte Regeln.

## Ziel des Klärungsinkrements 5a

Mit Friedhofsverwaltung und Projektverantwortung einen implementierbaren,
kleinen End-to-End-Zuschnitt festlegen. Mindestens zu entscheiden sind:

1. Personenrollen, Mehrfachrollen je Fall und Pflichtfelder;
2. Inhaber, weitere Berechtigte, Ansprechpartner und Rechnungsempfänger sowie
   notwendige Historisierung;
3. Identität, Grabstellenbezug, Zustände und Korrekturen eines Nutzungsrechts;
4. kommunal konfigurierbare Ruhe-, Nutzungs- und Aufbewahrungsfristen samt
   Satzungsstand, Beginn, Ende, Verlängerung, Altfällen und Regeländerungen;
5. manuelle oder automatische Wiedervorlagen, Sichtbarkeit und Erledigung;
6. Rollenrechte, Mindest-Audit, Lösch-/Aufbewahrungsgrenzen, Datenschutz und
   fachliche Abnahmefälle.

## Erforderliche Ergebnisse vor Code

- deutsches Entscheidungsdokument mit stabilen REQ-IDs, Zuständen,
  Pflichtfeldern, Übergängen, Korrektur- und Nebenläufigkeitsregeln;
- mindestens drei vollständig synthetische Durchstichbeispiele einschließlich
  Alt- und Grenzfall;
- explizite Nicht-Ziele und Architekturvorschlag mit Altkompatibilität;
- Test- und SQL-Migrationsplan;
- ausführbare Implementierungsübergabe für den bestätigten kleinen Zuschnitt.

## Stop-Gates

Keine Fristberechnung, automatische Wiedervorlage, Rollenwirkung,
Nutzungsrechtsänderung oder Migration implementieren, solange Satzungsstand,
Start-/Endregel, Historienwirkung, Korrekturgrenze und fachliche Zuständigkeit
nicht bestätigt sind. Keine lokalen Doberlug-Kirchhainer Werte als allgemeine
Open-Source-Defaults fest einbauen. Keine Gebühren, Bescheide, Dokumente,
Winyard-, LDAP- oder EDWALT-Integration vorziehen.

## Technische Leitplanken für den späteren Durchstich

Unabhängige standardmäßig deaktivierte Development-Capability, ausschließlich
synthetische Daten, bestätigte Policy, Cookie und CSRF, authentifizierter
Akteur, starke ETags, atomare Fachänderung/Version/Audit, providerneutrales
Verhalten, additive EF-Migration, reale SQL-Suite und keine Auditoberfläche.
Die 4a- und 4b-Capabilities und ihre Auswahlkorrekturen bleiben unabhängig.

## Freigabegrenze

5a liefert zunächst belastbare Entscheidungen und einen sicheren Zuschnitt,
keine fachliche oder produktive Freigabe. Erst die ausdrücklich bestätigte
Folgeübergabe autorisiert einen implementierenden Arbeitslauf.
