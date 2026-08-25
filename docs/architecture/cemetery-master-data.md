# Architektur der Friedhofs- und Grabstellenstammdaten

Stand: 25.08.2026

## Geltungsbereich

Diese Architektur beschreibt den technisch abgenommenen, weiterhin
synthetischen und Development-only betriebenen Stand von Inkrement 4a. Sie ist
keine fachliche, datenschutzrechtliche, betriebliche oder produktive Freigabe.

ADR-0017 ergänzt ein noch umzusetzendes lokales Ziel: `CEMARISDEV` soll den
dauerhaften Development-Zustand tragen und ausgewählte nicht personenbezogene
Friedhofsstammdaten aus der read-only EDWALT-Arbeitswurzel aufnehmen. Bis zum
Abschluss von Inkrement 5k bleiben die nachfolgend beschriebenen
SQL-Aktivierungs- und Importanteile Zielarchitektur, nicht behaupteter
Ist-Stand.

Die räumliche Struktur ist `Friedhof → Bereich → Feld → Reihe → Grabstelle`.
Friedhof und Grabstelle sind verpflichtend. Bereich, Feld und Reihe sind
eigenständige optionale Ebenen. Jede Entität besitzt eine unveränderliche GUID;
Anzeigenamen werden nicht in Fallakten kopiert, sobald ein kanonischer Bezug
besteht.

## Bausteine und Verantwortungen

| Schicht | Verantwortung |
| --- | --- |
| Domain | Beisetzungsformen, Grabstellenstatus, Textgrenzen, normalisierte Schlüssel und zulässige Statusübergänge |
| Application | Befehle, Projektionen, Store-Vertrag, Pfad-/Aktivitätsprüfung und Akteurszuordnung |
| synthetischer Provider | prozesslokale, zu Beginn leere Stammdaten; atomare Mutation und Änderungsliste |
| SQL-Provider | additive EF-Persistenz, Nebenläufigkeit, Constraints, Fremdschlüssel und atomarer datensparsamer Nachweis |
| API | Cookie-Authentifizierung, Policies, CSRF, starke ETags und Problem-Details |
| React | Pflege aller Ebenen mit vollständigen Kontextpfaden, kaskadierenden Auswahlen, Aktivstatus, Rollenbegrenzung beim Löschen und kanonische Grabstellenauswahl |

Gleichnamige Bereiche, Felder oder Reihen auf verschiedenen Friedhöfen werden
in Pflegeauswahlen und Listen immer mit ihrem vollständigen Pfad angezeigt.
Die Grabstellenmaske filtert Bereich, Feld und Reihe kaskadierend nach dem
gewählten Vorfahren sowie Grabarten nach der aktiven Friedhofszuordnung. Ein
Wechsel oder eine zwischenzeitliche Deaktivierung eines Vorfahren setzt alle
dadurch ungültigen Kind-Auswahlen zurück.

Der globale Grabartenkatalog bleibt produktseitig leer. Auch die in der
Friedhofssatzung Doberlug-Kirchhain 2023 genannten sieben Grabarten werden
nicht geseedet. Tests verwenden ausschließlich als synthetisch benannte Werte.

## Datenmodell

Persistiert werden `Cemeteries`, `CemeteryAreas`, `CemeteryFields`,
`CemeteryRows`, `GraveTypes`, `CemeteryGraveTypes`, `GraveSites` und
`CemeteryMasterDataChanges`. `ReadGraves.GraveSiteId` ist ein additiver,
nullable Fremdschlüssel. Bestehende flache Altzeilen werden weder geraten noch
automatisch verknüpft.

Die SQL-Eindeutigkeit verwendet normalisierte Namen, Codes und Grabnummern.
Für Grabstellen bestehen getrennte eindeutige Indizes für jeden zulässigen
optionalen Pfad. Ein Check-Constraint verhindert Feld ohne Bereich sowie Reihe
ohne Feld. Weitere Fremdschlüssel verhindern verwaiste Entitäten. Der
Application-Store validiert zusätzlich, dass jede gewählte Ebene tatsächlich
zum angegebenen übergeordneten Pfad gehört.

`GraveSiteStatus` kennt nur `Available`, `Reserved` und `Occupied`. Erlaubt
sind Frei → Reserviert/Belegt sowie Reserviert → Frei/Belegt. Belegt kann in 4a
nicht zurückgeführt werden. `IsBlocked` und `BlockNote` sind davon unabhängig.
`TargetCapacity` ist nullable und, falls gesetzt, positiv; sie löst keine
automatische Kapazitäts- oder Belegungsentscheidung aus.

## Referenzen und Umbenennungen

Neue kanonische Fallaktenbezüge tragen `GraveSiteId`. Der Server akzeptiert
eine neue Zuordnung nur, wenn Grabstelle, Friedhof, optionale Ebenen, Grabart
und Friedhofs-Grabarten-Zuordnung aktiv sind und die Grabstelle nicht gesperrt
ist. Deaktivierte Werte bleiben in bestehenden Fällen sichtbar.

Der SQL-Leseprovider projiziert Friedhof, Feld und Grabnummer über die
kanonische Relation. Der synthetische Provider löst dieselbe Relation vor
Suche und Detailprojektion auf. Eine Umbenennung ist deshalb unmittelbar
sichtbar; es gibt keinen Namens-Synchronisationslauf und keine fachliche
Namenshistorie.

## Sicherheits- und Änderungskontrakt

- `MasterData` erlaubt Sachbearbeitung und Administration die fachliche Pflege.
- `MasterDataDeletion` erlaubt physisches Löschen ausschließlich der Administration.
- Physisches Löschen ist nur ohne Unterdatensätze, Zuordnungen oder Fallbezug möglich.
- Jede HTTP-Mutation benötigt eine authentifizierte Cookie-Sitzung und CSRF.
- Änderungen und Löschungen benötigen einen starken aktuellen `If-Match`-Wert.
- Fachänderung, Version und `CemeteryMasterDataChanges` werden mit einem
  authentifizierten Akteur atomar gespeichert.
- Der Nachweis speichert Entitätsart, ID, Operation, Zeit, Akteur und
  Ergebnisversion, aber keine vollständigen Vorher-/Nachher-Datensätze.
- Es gibt absichtlich keine Audit- oder Betreiberlog-API und keine Oberfläche dafür.

Die Capability `Features:CemeteryMasterDataEditingEnabled` ist standardmäßig
`false`. Der Prozess startet nicht, wenn sie außerhalb von Development oder
mit einem anderen Provider als `Synthetic` aktiviert wird. Sie ist unabhängig
von `Features:CaseEditingEnabled`.

Inkrement 5k soll die Providerbeschränkung für den `SqlServer`-Provider
kontrolliert aufheben, ohne die Development-Grenze oder die vorhandenen
Sicherheitsverträge zu ändern. Der portable Repository-Default bleibt
deaktiviert; die dauerhafte lokale Aktivierung für `CEMARISDEV` erfolgt
ausschließlich über User Secrets beziehungsweise lokale Umgebungswerte.

## Zielarchitektur des abgegrenzten EDWALT-Imports

```text
read-only EDWALT-Arbeitskopie
  W005/W005dm: bestätigte Friedhofs-/Grabartfelder
  W020: ausschließlich bestätigter Struktur-/Grabstellenschlüssel
                    |
                    v
versionierter Parser + explizites Mapping
                    |
             Dry-run/Reconciliation
                    |
                    v
Application-/Store-Validierung + eine SQL-Transaktion
                    |
                    v
             CEMARISDEV-Stammdaten
```

Der Parser arbeitet mit Positivlisten aus Quelle, Offset, Länge, Format und
Zielfeld. Er darf keine vollständigen W020-Sätze dekodieren. Personen-,
Adress-, Rechte-, Vorgangs-, Gebühren-, Notiz- und Freitextspannen bleiben
unberührt. Unbekannte Hierarchie- oder Variantenregeln werden nicht aus
Schreibweisen hergeleitet. Der Dry-run liefert ausschließlich technische
Anzahlen, anonyme Quellkennungen beziehungsweise Hashes und Fehlerklassen;
lokale Namen, Grabnummern und sonstige Quellwerte gehören weder in Logs noch
in Repository-Artefakte.

Der Ladevorgang prüft den tatsächlich aufgelösten Datenbanknamen exakt gegen
`CEMARISDEV`, ausstehende EF-Migrationen, Mappingvollständigkeit,
Eindeutigkeitsregeln und Referenzen. Er ist wiederholbar und transaktional,
erhält vorhandene Konten und synthetische Falldaten und erzeugt einen
datensparsamen Änderungsnachweis mit eindeutigem technischen Migrationsakteur.
Ein fehlendes oder mehrdeutiges Mapping beendet den Lauf vor jeder Mutation.

## Bewusste Grenzen

Nicht Bestandteil des Stammdatenimports sind EDWALT-Personen, -Adressen,
-Nutzungsrechte, -Vorgänge, -Gebühren, -Notizen oder -Dokumente. Ebenfalls
nicht Bestandteil sind Beisetzungsplanung, automatische Grabnummern,
Kapazitätsentscheidungen, Fristen, Umbettung, Storno, Gebühren, Bescheide,
Dokumente, Winyard und LDAP. Das aktuelle Migrationsziel ist ausschließlich
der in ADR-0017 und Inkrement 5k abgegrenzte Friedhofsstammdatenpfad.
