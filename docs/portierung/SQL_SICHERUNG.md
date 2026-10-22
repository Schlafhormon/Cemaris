# SQL-Server-Sicherung und Wiederherstellung

Schritt 15 ersetzt Sunrises SQLite-Dateikopie durch native SQL-Server-Sicherungen.
Quelle sind `database/backupDatabase.ts`, `helpers/database.helpers.ts` und
`tasks/backupDatabase.task.ts` am festen Referenzcommit. Cemaris kopiert keine
laufenden MDF-/LDF-Dateien. Sicherungen und Wiederherstellungen verwenden den
SQL-Server-Dienst; auf dem API-Host wird keine Datenbankdatei geschrieben.

## Native Sicherung

`backend/cemaris/sql_backup.py` stellt bereit:

```python
from cemaris.db.engine import create_database_engine
from cemaris.sql_backup import backup_database, database_backup_info

engine = create_database_engine()
try:
    # Dieser absolute Pfad liegt auf dem SQL-Server-Host!
    path = backup_database(engine, r"D:\SQLBackups\Cemaris")
    if path is False:
        raise RuntimeError("Sicherung oder Prüfsummenprüfung fehlgeschlagen")
    print(database_backup_info(engine))
finally:
    engine.dispose()
```

Der Operator legt das Zielverzeichnis vorher auf dem SQL Server an und gibt
dem SQL-Server-Dienstkonto die nötigen Schreib-/Leserechte. Ein Verzeichnis
im API-Container ist bei einem externen SQL Server kein geeignetes Ziel.
Linux-SQL-Server verwenden beispielsweise `/var/opt/mssql/backup/cemaris`;
Windows-SQL-Server einen absoluten Laufwerks- oder UNC-Pfad. Relative Pfade,
NUL-Zeichen und `..` werden zurückgewiesen. `None` verwendet für einen
expliziten manuellen Aufruf `SERVERPROPERTY('InstanceDefaultBackupPath')`.
Auch der standardmäßig deaktivierte automatische Task darf nach ausdrücklicher
Aktivierung dieses Server-Standardverzeichnis verwenden; der Operator muss
dessen Speicherplatz, Dienstberechtigungen und Aufbewahrung sicherstellen.

Die Anwendung führt `BACKUP DATABASE ... TO DISK = ? WITH COPY_ONLY, CHECKSUM`
aus und anschließend `RESTORE VERIFYONLY FROM DISK = ? WITH CHECKSUM`.
Die Sicherung läuft mit AUTOCOMMIT und einem gemeinsamen monotonen
300-Sekunden-Budget für Sicherung und anschließende Prüfung. Vor jedem SQL-
Aufruf wird der Statementtimeout auf die verbleibenden ganzen Sekunden
gesetzt; VERIFYONLY erhält kein neues Zeitbudget. Bei verbrauchtem Budget
meldet der Vorgang einen Fehlschlag. Der vorherige Verbindungstimeout wird
danach wiederhergestellt.
Dateinamen enthalten einen sicheren Datenbanknamen, einen datenbankspezifischen
Hash, einen UTC-Zeitstempel und eine zufällige UUID. SQL-Pfade werden gebunden,
Datenbankkennungen als SQL-Kennungen maskiert. Vorhandene Sicherungsdateien
werden nicht absichtlich überschrieben. Systemdatenbanken werden zurückgewiesen.

`COPY_ONLY` erhält unabhängig betriebene Differenz-/Log-Sicherungsketten.
Dies ist eine zusätzliche vollständige Sicherung, kein Ersatz für eine zum
Recovery Model passende SQL-Server-Log-Sicherungsstrategie. `VERIFYONLY`
prüft Lesbarkeit und Prüfsummen des Backups; ein echter Restore mit Datenprüfung
bleibt erforderlich. Native Fehler ergeben `False` und eine allgemeine
Logmeldung; ODBC-Fehlertexte mit internen Pfaden/Zugangsdaten gelangen nicht
in die Betriebsantwort.

Der ausführende SQL-Login benötigt BACKUP-DATABASE-Berechtigung und für
`RESTORE VERIFYONLY`/`FILELISTONLY` die entsprechenden SQL-Server-Restore-
Metadatenrechte, regelmäßig CREATE DATABASE. Wenn der Anwendungslogin diese
Rechte nicht erhalten soll, kann ein eigener SQL-Server-Sicherungsjob die
Sicherung übernehmen. Der manuelle Anwendungsknopf meldet fehlende Rechte
dann als Fehlschlag. Es wird weder `xp_cmdshell` aktiviert noch eine zusätzliche
Serverberechtigung automatisch eingerichtet.

Die letzte Sicherung kommt aus `msdb.dbo.backupset`/`backupmediafamily`:
abgeschlossene vollständige COPY_ONLY-Sicherung mit Prüfsummen und eigenem
Cemaris-Dateinamensmuster für genau diese Datenbank. `lastBackupDate` ist
der lokale SQL-Server-Zeitstempel ohne erfundene UTC-Zeitzone;
`lastBackupPath` der Serverpfad. `elapsedLastBackupMillis` wird mit
`DATEDIFF_BIG(millisecond, backup_finish_date, SYSDATETIME())` direkt auf dem
SQL Server ermittelt. Der Task nutzt dieses Alter, damit verschiedene Zeitzonen
von API- und SQL-Host keinen falschen Nachholbedarf erzeugen.
`available=false` unterscheidet fehlende
Metadatenrechte von `available=true` mit leerer Sicherungshistorie. Historie
ist kein Nachweis, dass eine später extern gelöschte Datei noch vorhanden ist.

## Aufbewahrung und Dateibestand

Wie die Quelle ist automatische Bereinigung standardmäßig ausgeschaltet
(`deleteAgeDays=0`). Ein positiver Wert löscht nach erfolgreicher Sicherung
Dateien mit älterem Änderungszeitpunkt als der Tagesgrenze. Die Umsetzung
begrenzt dies auf vollständige eigene Dateinamen genau dieser Datenbank.
Andere Backups, Unterverzeichnisse und symbolische Links bleiben erhalten.

`cleanup_old_backups(local_directory, database_name, delete_age_days,
verified_backup_path=path)` benötigt ein ausdrücklich konfiguriertes lokales
Mount desselben Sicherungsverzeichnisses. Unmittelbar nach dem erfolgreichen
SQL-Backup muss dessen zufälliger Dateiname dort als reguläre, nichtleere
Datei mit frischem Änderungszeitpunkt sichtbar sein. Erst dann wird die
Aufbewahrungsregel angewandt. Bei getrennten Dateisystemen oder nicht
nachweisbarer Zuordnung löscht Python nichts; die Aufbewahrung muss auf
dem SQL-Server-Host oder dessen Backup-System eingerichtet werden.
Die API- und SQL-Hosts benötigen synchronisierte Uhren für diese Mountprüfung.

Für eine vollständige Wiederherstellung gehören zur SQL-Sicherung auch:

- das persistente Attachment-Verzeichnis samt Dokumenten und Signatur-/Audit-PDFs;
- individuelle Druckvorlagen und anpassbare Karten-/Mediendateien;
- die zugehörige Cemaris-Konfiguration, Versions-/Migrationsstand und nötigen
  Dienstzugangsdaten; Geheimnisse werden geschützt und getrennt versioniert;
- bei SQL-Server-TDE die zur Wiederherstellung nötigen Zertifikate/Schlüssel.

Für einen konsistenten Stand Schreibzugriffe und Hintergrundmutationen
anhalten, SQL-Sicherung und Dateibestände gemeinsam sichern, danach den Betrieb
fortsetzen. Ein SQL-Backup allein enthält keine Attachment-Nutzdaten.
Aufbewahrung, Offsite-Kopie und regelmäßiger Restore gehören zum Betrieb des
SQL Servers und der Dateivolumes.

## Restore zuerst in eine neue Datenbank

1. Mit einer passenden SQL-Server-Version und benötigten Schlüsseln arbeiten.
   SQL-Server-Backups lassen sich nicht auf beliebig ältere Server zurückspielen.
2. `RESTORE VERIFYONLY FROM DISK = N'<Serverpfad zur .bak>' WITH CHECKSUM`
   und `RESTORE FILELISTONLY FROM DISK = N'<Serverpfad zur .bak>'` ausführen.
3. Einen **neuen** Datenbanknamen und neue physische Daten-/Log-Dateien wählen.
   Vorher muss `DB_ID(N'<neuer Name>') IS NULL` gelten. Alle logischen Dateien
   der FILELISTONLY-Ausgabe mit `MOVE` zuordnen; niemals `WITH REPLACE` verwenden.
4. Restore mit `CHECKSUM, RECOVERY` ausführen. Anschließend `DBCC CHECKDB`,
   Migrationsstand, synthetische Kontrollwerte beziehungsweise erwartete
   Bestandsmengen und Beziehungen prüfen.
5. Passenden Attachment-/Vorlagenstand in eigene neue Verzeichnisse
   wiederherstellen. Cemaris mit der wiederhergestellten Datenbank und diesen
   Dateibeständen prüfen. Externe Integrationen dabei bewusst konfigurieren.
6. Erst nach erfolgreicher Prüfung den gestoppten Anwendungsbetrieb auf diese
   wiederhergestellten Ziele umstellen. Bisherige Datenbank und Sicherung
   bis zur erfolgreichen Abnahme erhalten.

Für reproduzierbare **entbehrliche Restore-Proben** ist
`disposable_backup_restore(admin_engine, backup_path)` ein Contextmanager.
Er verlangt eine SQL-Server-Verbindung ausdrücklich nach `master`, erzeugt
selbst `cemaris_test_02_<uuid>`, prüft dessen Nichtexistenz und verschiebt
sämtliche normalen Daten-/Log-Dateien in frische Dateien der Server-
Standardverzeichnisse. Der Name ist nicht durch den Aufrufer wählbar.
Beim Verlassen wird ausschließlich diese neue Testdatenbank wieder entfernt.
Dieser Helfer ist kein Produktionsrestore und kein HTTP-Endpunkt; besondere
Dateitypen wie FILESTREAM erfordern ein eigenes angepasstes Restore-Verfahren.

## Konkreter Nachweis

```powershell
$env:CEMARIS_SQL_TEST_ADMIN_URL = 'mssql+pyodbc://@localhost\CEMARISDEV/master?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes'
.\.tools\Scripts\uv.exe run --locked --project backend pytest backend/tests/test_sql_backup.py -q --tb=short
Remove-Item Env:CEMARIS_SQL_TEST_ADMIN_URL
```

Der Test migriert eine frische Quelldatenbank und befüllt alle 41
Anwendungstabellen mit zusammenhängenden synthetischen Fixtures einschließlich
Unicode, NULL, Audit, Löschmarkierungen, Vertrags-/Grab-/Arbeitsauftrags-
Beziehungen und Anhangmetadaten. Er sichert sie nativ, prüft das Backup,
ändert anschließend einen Kommentar in der Quelle und stellt das Backup in
eine zweite neue Datenbank wieder her. Dort vergleicht er Zeilenzahl und SHA256
aller Spalten jeder Tabelle, die Migrationsrevision und alle 42 Fremdschlüssel,
führt `DBCC CHECKDB` aus und bestätigt den unveränderten ursprünglichen
Unicode-Wert sowie die unabhängig veränderte Quelle. Beide Testdatenbanken werden
danach entfernt. Die Backupdatei wird ausschließlich über ihren exakten eigenen
Dateinamen entfernt und die Abwesenheit mit `sys.dm_os_file_exists` auf dem
SQL Server nachgewiesen. `Path.exists()` auf dem API-Host reicht dafür nicht:
Dienstkonto-ACLs können eine vorhandene Datei vor Python verbergen.
Der dafür getrennte Testhelfer `remove_disposable_backup` verlangt `master`,
einen eigenen UUID-Testdatenbanknamen, die bereits entfernte Quelldatenbank,
das datenbankspezifische Dateinamensmuster und genau das vom SQL Server
bestätigte Standard-Backupverzeichnis. Nur dann darf die vorhandene Prozedur
`master.sys.xp_delete_files` mit **einem gebundenen exakten Dateipfad** laufen.
Wildcards und Verzeichnisziele sind ausgeschlossen. Es werden weder Shell
noch ACL-/Konfigurationsänderungen aktiviert. Fehlende Löschrechte oder eine
weiter vorhandene Datei lassen den Test fehlschlagen. Diese eng begrenzte
Testbereinigung ist kein Produktions-Retentionverfahren. Es wird keine
vorhandene Verwaltungsdatenbank zur Fixture.

Die weiteren Vertragstests prüfen Fehlerpfade, SQL-Parameter, Pfadplattformen,
Systemdatenbank-/Restoregrenzen, Aufbewahrung und Rücksetzen des Timeouts.
Die tatsächlich ausgeführten Ergebnisse stehen in [Bericht 15](berichte/15.md).
Docker-/Ubuntu- und Remote-Mount-Ausführung bleiben getrennte Betriebsnachweise.

SQL-Server-Grundlagen: [BACKUP](https://learn.microsoft.com/en-us/sql/t-sql/statements/backup-transact-sql?view=sql-server-ver17),
[COPY_ONLY](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/copy-only-backups-sql-server?view=sql-server-ver15),
[VERIFYONLY](https://learn.microsoft.com/en-us/sql/t-sql/statements/restore-statements-verifyonly-transact-sql?view=sql-server-ver17),
[Kopieren mit Backup und Restore](https://learn.microsoft.com/en-us/sql/relational-databases/databases/copy-databases-with-backup-and-restore?view=sql-server-ver17).
