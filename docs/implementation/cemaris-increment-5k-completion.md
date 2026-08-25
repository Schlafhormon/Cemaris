# Abschluss: Inkrement 5k – dauerhafter SQL-Developmentbetrieb und abgegrenzte EDWALT-Friedhofsstammdaten

Stand: 25.08.2026

Status: technisch Ende zu Ende abgeschlossen. Weiterhin ausschließlich
Development, ohne fachliche, datenschutzrechtliche, betriebliche oder
produktive Freigabe. Die bewusste lokale Kennwortabweichung ist nachfolgend
als akzeptiertes Restrisiko dokumentiert.

## Ergebnis

Inkrement 5k stellt auf dem autorisierten lokalen Arbeitsplatz den gesamten
vorhandenen Cemaris-Funktionsumfang dauerhaft über den SQL-Provider bereit.
Die bereits vorhandene Datenbank `Cemaris_Dev` wurde additiv auf den aktuellen
EF-Stand gebracht, aber weder erstellt, gelöscht, geleert, ersetzt noch
umbenannt. Der tatsächlich von der geöffneten Verbindung aufgelöste Name wird
vor jedem Wartungs-, Seed- und Importpfad exakt geprüft.

Der Name `Cemaris_Dev` ersetzt für diese Ausführung die frühere Schreibweise
in der vorbereitenden Übergabe. Er wurde vom Projektverantwortlichen anhand
der vorhandenen Datenbank bestätigt und anschließend mit einer
verbindungsgestützten `DB_NAME()`-Prüfung verifiziert. Verbindungs-, Server-,
Datenbankanmelde- und Passwortwerte wurden weder ausgegeben noch versioniert.

Der Unterschied zwischen den Betriebsformen bleibt ausdrücklich erhalten:

| Bereich | Sicherer Repository-/Teststandard | Autorisierter lokaler 5k-Standard |
| --- | --- | --- |
| Provider | `Synthetic` | `SqlServer` |
| Capabilities | standardmäßig deaktiviert | alle vier vorhandenen Development-Capabilities aktiviert |
| Personen und Fälle | ausschließlich synthetische Fixtures | dieselben synthetischen Fixtures dauerhaft in SQL |
| Friedhofsstammdaten | leere beziehungsweise synthetische Testkataloge | ausschließlich kontrolliert migrierte nicht personenbezogene Stammdaten |
| SQL-Tests | nur isolierte temporäre Datenbanken | dauerhafte Anwendungsdatenbank wird niemals als Testfixture verwendet |

## SQL-Schema, Konten und synthetische Daten

- Alle ausstehenden EF-Migrationen wurden kontrolliert auf das bestehende
  Schema angewendet. Der Wartungspfad beendet sich danach selbst; normale
  Anwendungsstarts führen keine Migration und keinen Seed aus.
- `admin` ist dauerhaft der Rolle `Administration`, `sach` der Rolle
  `Sachbearbeitung` zugeordnet. Die Passwortwerte stammen ausschließlich aus
  User Secrets. Ein Wiederholungslauf fand beide Konten passend vor und führte
  keine Neuanlage und keinen Passwortwechsel aus. Die Abschlussprüfung erkannte
  jedoch beim lokalen `admin`-Wert eine exakte Übereinstimmung mit einem
  bereits versionierten synthetischen Testkennwort. Der Wert wird nicht
  ausgegeben. Der Projektverantwortliche hat am 25.08.2026 entschieden, ihn
  wegen des isolierten, nur ihm zugänglichen Development-Testbetriebs bewusst
  beizubehalten. Für `sach` besteht dieser Befund nicht.
- Die vorhandenen 20 synthetisch markierten Fallfixtures wurden dauerhaft in
  SQL bestätigt und unverändert erhalten. Ein in der synthetischen Quelle
  absichtlich nicht auflösbarer optionaler Altrechtebezug wurde weiterhin
  nicht als Fremdschlüssel geraten. Nichtsynthetische ID-Kollisionen würden
  den gesamten additiven Lauf vor einer Änderung abbrechen.
- Die vier Capabilities für Fallbearbeitung, Friedhofsstammdaten,
  Beisetzungsprozess und Beteiligte/Nutzungsrechte verwenden im lokalen
  Standard denselben SQL-Provider. Die vorhandenen Authentifizierungs-,
  Autorisierungs-, CSRF-, ETag-, Transaktions- und Auditverträge bleiben
  erhalten.
- Ein Negativstart mit aktivierter Wartungsfunktion außerhalb von
  `Development` wurde erwartungsgemäß vor jeder Mutation abgewiesen.

Die Passwortwerte wurden nicht über Kommandozeilenargumente übergeben. Für
VS Code ist der lokale Eintrag in der zum `UserSecretsId` des API-Projekts
gehörenden `secrets.json` im Root-README dokumentiert; vorhandene
Secret-Schlüssel müssen beim Bearbeiten erhalten bleiben.

## Abgegrenzte EDWALT-Migration

Das neue Werkzeug `Cemaris.EdWaltMigration` bietet die vier getrennten
Schritte `analyze`, `dry-run`, `apply` und `reconcile`. Es akzeptiert für den
produktiven lokalen Lauf nur die freigegebene Phase-2-Quelle und schreibt nur
unterhalb der neuen Phase-5-Wurzel. Der Parser springt satzweise ausschließlich
zu den in der Positivliste dokumentierten Bytebereichen; vollständige Sätze
werden nicht dekodiert.

Die lokale fachliche Entscheidung wurde nicht aus EDWALT geraten. Sie ordnet
die 18 aktuellen Quellsätze anonym neun aktiven Grabarten für zwei Friedhöfe
zu: zwei Erdbestattungs-, vier Urnenbestattungs- und drei gemischte Grabarten.
Die Zuordnung liegt nur außerhalb des Repositories in der Phase-5-Wurzel und
ist über anonyme Datensatz-Fingerprints exakt an den geprüften Datenstand
gebunden. Fehlende, zusätzliche, doppelte oder widersprüchliche Entscheidungen
blockieren den Lauf.

Der freigegebene Dry-run ergab:

| technische Kategorie | Anzahl |
| --- | ---: |
| aktuelle Stammdatensätze | 18 |
| historische Gegenbelege | 38 |
| geplante Friedhöfe | 2 |
| geplante Grabarten | 9 |
| geplante Friedhof-Grabart-Zuordnungen | 18 |
| fehlende Grabartenentscheidungen | 0 |
| blockierende Befunde | 0 |

Die 2.718 technisch gezählten `W020`-Sätze wurden vollständig vom Import
ausgeschlossen. Für sie ist weder eine belastbare räumliche Aufteilung noch
eine belegte Grabartrelation vorhanden; deshalb wurden keine Bereiche,
Felder, Reihen oder Grabstellen geraten. Die 290 nicht blockierenden
Diagnosebefunde des Dry-runs klassifizieren ausschließlich diese technischen
Ausschlüsse und enthalten keine lokalen Quellwerte.

Der erste serielle Import erzeugte 2 Friedhöfe, 9 Grabarten und 18
Zuordnungen in einer äußeren SQL-Transaktion. Der unmittelbar wiederholte Lauf
erzeugte nichts neu und bestätigte alle 29 Zielobjekte unverändert. Die
anschließende Reconciliation meldete für alle drei Kategorien vollständige
Übereinstimmung sowie jeweils null fehlende und null widersprüchliche Ziele.
Der Import löscht nichts und ändert weder Konten noch synthetische Personen-
oder Falldaten.

## Datenschutz- und Quellgrenzen

Gelesen wurden ausschließlich die dokumentierten Friedhofs-, Grabart- und
technischen Struktursegmente der drei bereits vorhandenen RAW-Extrakte. Nicht
gelesen, nicht dekodiert, nicht importiert und nicht protokolliert wurden
Personen-, Adress-, Suchcode-, Rechte-, Fall-, Beisetzungs-, Vorgangs-,
Gebühren-, Bescheid-, Buchungs-, Notiz-, Dokument-, Benutzer- und
Konfigurationsbereiche.

Die vorhandenen Phase-2-, Phase-3- und Phase-4-Verzeichnisse einschließlich
Quell-, DAT-, IDX-, RAW-, Report- und Prototypdateien blieben read-only.
EDWALT wurde nicht ausgeführt. Neue lokale Berichte, die anonyme
Entscheidungsdatei und der Browsernachweis liegen ausschließlich unter:

`C:\Users\Benke\AppData\Local\Cemaris\EdwaltMigration\phase5-cemetery-master-data-20260825`

Die JSON-Berichte enthalten nur technische Anzahlen, Status,
Fehlerklassifikationen und anonyme Bindungswerte, aber keine Quellnamen,
Quellcodes, Strukturwerte, Verbindungsdaten oder Passwörter.

## Ende-zu-Ende-Nachweis

| Prüfung | Ergebnis |
| --- | --- |
| Solution-Build, Release | erfolgreich, 0 Warnungen, 0 Fehler |
| .NET-Formatprüfung | erfolgreich, keine Abweichung |
| Unit-Tests | 48 erfolgreich, 0 fehlgeschlagen |
| Integrationstests ohne SQL-Kategorie | 58 erfolgreich, 0 fehlgeschlagen |
| Frontendtests | 8 Testdateien, 41 Tests erfolgreich |
| Frontend-Lint und Produktionsbuild | erfolgreich |
| `npm ci` | erfolgreich, keine gemeldete Schwachstelle |
| Datenbankname und Schema vor Mutationen | exakt bestätigt, keine ausstehende Migration nach dem Update |
| Konten-Wiederholung | passende Konten erhalten, keine Neuanlage |
| Kennwort-Unabhängigkeit | `sach` erfüllt; Abweichung für `admin` im isolierten lokalen Testbetrieb ausdrücklich als Restrisiko akzeptiert |
| Import-Wiederholung | 0 neu, 29 unverändert, 0 Konflikte |
| Reconciliation | 29 von 29 passend, 0 fehlend, 0 widersprüchlich |
| Nicht-Development-Negativstart | Wartung vor Mutation abgewiesen |

Der Browser-Smoke-Test lief mit dem tatsächlich gestarteten API-Host, dem
Vite-Proxy und Microsoft Edge. Beide lokalen Rollen konnten sich über die
gerenderte Loginoberfläche anmelden. Beide sahen die SQL-gestützten
Friedhofsstammdaten; nur Administration sah die administrative
Löschsteuerung. Zusätzlich wurde über Suche und Detailroute ein dauerhaft in
SQL gespeicherter synthetischer Fall mit Grabstelle, Verstorbenen und
Beisetzungen gerendert. Ein inhaltsfreier Screenshot der Loginoberfläche liegt
als lokales Phase-5-Artefakt vor.

Vor dem Browserlauf wurden mit beiden authentifizierten Rollen außerdem die
SQL-gestützten Lesewege für Suche, Friedhofsstammdaten,
Beisetzungsprozess-Stammdaten, Beteiligtenverzeichnis und administrative
Programmkonfiguration erfolgreich aufgerufen. Der administrative Kontenweg
antwortete für `admin` erfolgreich und wies `sach` mit `403` ab. Es wurden nur
Status- und Rollenresultate ausgewertet, keine Antwortinhalte protokolliert.

Die optionale SQL-Integrationstestsuite war nicht ausführbar, weil die separat
autorisierte temporäre Testverbindung nach der einmaligen gemeinsamen Abfrage
nicht bereitgestellt wurde. Der Filter entdeckte 18 SQL-Tests und übersprang
alle 18 kontrolliert. Die dauerhafte Anwendungsverbindung wurde ausdrücklich
nicht als Ersatz verwendet. SQL-Providerparität ist zusätzlich durch den
realen Start, die authentifizierten API-Lesewege beider Rollen, den
transaktionalen Import, die Reconciliation und den Browser-Smoke-Test gegen
die dauerhafte Development-Datenbank nachgewiesen.

## Erhaltung und Repositoryzustand

Vor Änderungen wurde der vollständige Git-Stand erhoben. Vorhandene Arbeit,
einschließlich Inkrement 5j und vorbereitender 5k-Dokumentation, wurde ohne
Reset weitergeführt. `tmp/pagination-build` blieb unverändert. Es wurde keine
Datei gestagt und kein Commit erstellt.

Die vorhandene Development-Datenbank, bestehende Daten außerhalb der
deterministischen Importziele, Konten, Passwörter und synthetische Fälle
blieben erhalten. Automatisierte SQL-Fixtures dürfen weiterhin ausschließlich
isolierte Datenbanken mit dem Präfix `Cemaris_IntegrationTests_` anlegen und
löschen; die dauerhafte Datenbank ist durch Konfiguration, Fixtureprüfung und
exakten Namensvergleich davon getrennt.

## Akzeptierte lokale Kennwortabweichung

Das lokale `admin`-Kennwort ist nicht repository-unabhängig und erfüllt damit
nicht die ursprünglich angestrebte Kennwortqualität. Der
Projektverantwortliche akzeptiert dieses Restrisiko ausdrücklich, weil die
Development-Testumgebung nach seiner Bestätigung isoliert ist und nur ihm
zugänglich bleibt. Das ist keine allgemeine Sicherheitsfreigabe. Vor jeder
Freigabe, Weitergabe der Umgebung, zusätzlichen Zugriffsberechtigung oder
produktiven Nutzung muss das Kennwort zwingend durch einen einzigartigen,
nicht versionierten Wert ersetzt werden.

## Verbindlicher nächster Schritt

Der nächste sichere Schnitt ist das ausschließlich dokumentarische
[Inkrement 6a – Gebühren-/Bescheid-Entscheidungsgate](cemaris-increment-6a-next-step-handoff.md).
Es liest keine externen EDWALT-, Satzungs- oder Vorlagenbestände, öffnet keine
Datenbankverbindung und implementiert keine Gebühren-, Bescheid-, Dokument-
oder Migrationsfunktion. Fehlen die notwendigen belastbaren Entscheidungen,
ist das Gate vollständig mit Variante A „keine Implementierung“ abzuschließen.

## Nicht behauptet

- keine Produktiv-, Datenschutz-, Betriebs- oder fachliche Freigabe;
- keine EDWALT-Personen-, Fall-, Beisetzungs-, Rechte-, Gebühren-, Bescheid-,
  Buchungs-, Notiz-, Dokument-, Benutzer- oder Konfigurationsmigration;
- keine abgeleitete räumliche Hierarchie, Grabstelle, Kapazität, Frist oder
  Statuswirkung;
- kein Cutover, kein EDWALT-Start und keine Änderung der breiten
  Migrationspause außerhalb des eng abgegrenzten Friedhofsstammdatenpfads.
