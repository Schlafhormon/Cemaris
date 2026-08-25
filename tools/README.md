# Entwicklungswerkzeuge

Dieser Ordner ist für kleine, reproduzierbare Hilfswerkzeuge reserviert, etwa für spätere Datenanalysen oder Migrationsprüfungen.

Das versionierte Werkzeug `Cemaris.EdWaltMigration` setzt ausschließlich das
positiv gelistete, nicht personenbezogene
[5k-Friedhofsstammdatenmapping](../docs/migration/edwalt-cemetery-master-data-mapping.md)
um. Es akzeptiert produktiv nur die freigegebene Phase-2-Quelle, liest pro
Satz nur dokumentierte Bytebereiche und schreibt technische Berichte nur in
die freigegebene Phase-5-Wurzel. EDWALT wird nicht ausgeführt.

Der frühere datensparsame Profiling-Prototyp und sämtliche Raw-Extrakte
bleiben außerhalb des Repositories und read-only; siehe
`docs/migration/edwalt-extraction-prototype.md`. Das Repository enthält weder
echte Verwaltungsdaten noch vollständige Extrakte, Zugangsdaten oder lokale
Berichte.
