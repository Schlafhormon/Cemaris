# ADR-0014: Kanonische Friedhofsstammdaten und restriktives Löschen

## Status

Accepted – 13.08.2026

## Kontext

Die vorläufige Fallakte speicherte Friedhof, Feld und Grabnummer zunächst als
freie Texte. Inkrement 4a benötigt stabile Referenzen, optionale räumliche
Zwischenebenen, sofort sichtbare Umbenennungen, sichere Nebenläufigkeit und
Löschregeln, ohne bestehende Altzeilen zu raten oder kommunale Kataloge als
allgemeine Produktdefaults einzubauen.

## Entscheidung

- Friedhof, Bereich, Feld, Reihe, Grabart, Friedhofs-Grabarten-Zuordnung und
  Grabstelle besitzen jeweils eine unveränderliche GUID und eine starke
  numerische Version.
- Friedhof und Grabstelle sind verpflichtend; Bereich, Feld und Reihe sind
  optionale eigenständige Ebenen.
- Namen, Codes und manuelle Grabnummern werden normalisiert und im jeweiligen
  Pfad in Application und SQL eindeutig gehalten.
- Der globale Grabartenkatalog startet leer. Kommunale Satzungswerte sind nur
  Evidenz und kein Seed.
- `ReadGraves.GraveSiteId` wird nullable und additiv ergänzt. Altzeilen bleiben
  unverknüpft; kanonische Zeilen projizieren aktuelle Namen über die Relation.
- Beide Fachrollen dürfen Stammdaten pflegen und deaktivieren. Ausschließlich
  Administration darf vollständig unbenutzte Datensätze physisch löschen.
- Jede Änderung nutzt Cookie, CSRF, serverseitige Policy und eine starke
  If-Match-Vorbedingung. Fachänderung, Version und sparsamer Akteursnachweis
  werden atomar gespeichert.
- Die Stammdaten-Capability bleibt unabhängig von der Fallakten-Capability,
  standardmäßig aus und ausschließlich in Development mit synthetischem
  Provider aktivierbar.

## Folgen

Umbenennungen werden unmittelbar in kanonisch referenzierenden Ansichten
sichtbar. Deaktivierung zerstört keine Referenz, verhindert aber neue Auswahl.
Physisches Löschen kann wegen Unterdatensätzen, Grabartenzuordnung oder
Fallbezug konfliktbehaftet abgewiesen werden. SQL erhält additive Tabellen,
Fremdschlüssel, Check-Constraints und pfadspezifische eindeutige Indizes.

Beisetzungsworkflow, Nummernautomatik, Kapazitätsentscheidung, Fristen,
Gebühren, Dokumente, Winyard, LDAP und EDWALT bleiben ausdrücklich außerhalb
dieser Entscheidung.
