# ADR-0010: Kanonischer vorläufiger Fall-/Lesestore

- Status: Accepted
- Datum: 2026-08-12

## Kontext

Der erste MVP hat ein bewusst vorläufiges relationales Leseschema und einen
synthetischen In-Memory-Provider. Der zweite Inkrement muss Änderungen ohne
separaten Projektionslauf unmittelbar in Suche und Detailansicht zeigen. Eine
zusätzliche Schreibdatenbank oder zweite In-Memory-Kopie würde zwei
divergierende Wahrheiten schaffen. Gleichzeitig ist das vorhandene Schema
ausdrücklich kein endgültiges Friedhofsfachmodell.

Änderungen an Grabstellenbezug, Verstorbenen und Beisetzungen benötigen eine
atomare monotone Fallversion. Konkurrierende Requests mit derselben erwarteten
Version dürfen nicht nach dem Last-write-wins-Prinzip beide erfolgreich sein.

## Entscheidung

Das vorläufige relationale Fall-/Leseschema bleibt für diesen abgegrenzten
Inkrement der eine kanonische SQL-Zustand. `ReadCases.Version` wird additiv als
optimistische Nebenläufigkeitsversion ergänzt. Jede SQL-Mutation aktualisiert
die Root-Version bedingt auf die erwartete Version und schreibt Root oder Kind
in derselben Transaktion. Ein nicht betroffenes Root-Update wird als Konflikt
beziehungsweise nicht vorhandene Fallakte zurückgegeben; es findet keine
Teiländerung statt.

Der synthetische Standardprovider hält ebenfalls nur einen gemeinsamen
Read/Write-Zustand. Er serialisiert Prüfung, Mutation und Versionssprung unter
einem Prozess-Lock. Alle neu angelegten Datensätze sind synthetisch; Änderungen
verfallen beim Prozessneustart.

Domain und Application definieren Normalisierung, technische Faktenvalidierung,
serverseitige IDs, monotone Version und providerneutrale Ports. HTTP bildet die
Version als starken ETag ab und verlangt für Mutationen `If-Match`.

## Alternativen

- Getrennte Write-Entities mit nachgelagerter Projektion: für diesen schmalen
  Inkrement verworfen, weil Konsistenzmechanismus und Projektionsbetrieb ohne
  belegten Nutzen hinzukämen.
- Nur In-Memory schreiben und SQL weiter read-only lassen: verworfen, weil
  Providerparität und das spätere kontrollierte SQL-Gate nicht prüfbar wären.
- Last-write-wins: verworfen, weil veraltete Bearbeitung unbemerkt Daten
  überschreiben könnte.

## Folgen

- Vorhandene Suche und Detailansicht lesen Änderungen sofort.
- Die additive Migration setzt bestehende Zeilen auf Initialversion 1.
- Das vorläufige Schema bleibt ehrlich als technische Zwischenstufe benannt;
  seine Wiederverwendung ist keine Freigabe als endgültiges Fachmodell.
- Eine spätere fachliche Modelltrennung oder Projektion benötigt ein neues ADR
  und eine kontrollierte additive Migration.
- Die Development-Feature-Grenze ist weiterhin kein Ersatz für produktive
  Identität, Autorisierung oder Auditierung.
