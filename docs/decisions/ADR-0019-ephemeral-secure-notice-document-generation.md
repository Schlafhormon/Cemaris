# ADR-0019: Flüchtige sichere Bescheidentwurfs-Dokumenterzeugung

- Status: Accepted
- Datum: 28.08.2026

## Kontext

ADR-0018 trennt den kanonischen manuellen 6b-Entwurf von den vorläufigen
Altprojektionen, entscheidet aber bewusst keine Dokumenterzeugung. Das
dokumentarische 6c-Gate hat anschließend genau einen rechtlich wirkungslosen
Gebührenbescheidentwurf für Beisetzungsgebühren feldgenau freigegeben. Für
diesen Kandidaten werden ein offener DOCX-Vertrag, eine optionale PDF-Ausgabe,
strikte aktive-Inhalte-Grenzen und ein Betrieb ohne Dokumentpersistenz
benötigt.

## Entscheidung

Der erste und einzige 6c-Dokumentpfad verwendet eine fest konfigurierte,
read-only DOCX-Datei innerhalb des kanonischen API-Content-Roots.
`DocumentFormat.OpenXml` 3.5.1 ersetzt genau die 23 bestätigten technischen
Platzhalter in Hauptdokument, Tabellen, Kopf- und Fußteilen. Die Vorlage wird
vor und nach der Ersetzung als begrenztes ZIP-/OpenXML-Paket geprüft. Makros,
ActiveX, OLE, Einbettungen, `altChunk`, externe Beziehungen, unbekannte,
fehlende oder doppelte Tokens, Pfadtraversal und Größenüberschreitungen führen
zum Abbruch.

PDF wird ausschließlich aus dem bereits validierten DOCX erzeugt. Ein
separat installierter LibreOffice-Prozess wird direkt ohne Shell mit einer
Argumentliste, einem kryptografisch zufälligen Arbeitsverzeichnis und einem
isolierten Benutzerprofil gestartet. Laufzeit, Parallelität und Ausgaben sind
begrenzt; bei Timeout oder Abbruch wird der vollständige Prozessbaum beendet.
Das Ergebnis muss innerhalb der Größenbegrenzung liegen und mit `%PDF-`
beginnen.

DOCX, PDF, Prozessausgaben und Zwischenstände werden nicht persistiert. Ein
inhaltsfreier Audit wird vor jeder erfolgreichen HTTP-Ausgabe gespeichert.
Jede PDF-Verarbeitung räumt ihr eigenes Temp-Verzeichnis in `finally` auf;
eine konservative Startbereinigung erfasst ausschließlich alte, nicht
verlinkte `generation-*`-Verzeichnisse unter dem konfigurierten Tempstamm.

Der Pfad ist durch `Features:NoticeGenerationEnabled`, die Policy
`NoticeGeneration`, die vorhandene Fallaktenpolicy, Antiforgery, starken
Entwurfs-ETag und einen eigenen Nebenläufigkeitsbegrenzer geschützt. Die
Capability ist standardmäßig deaktiviert und außerhalb `Development`
unzulässig.

## Folgen

- Eine beschädigte oder aktive Vorlage erzeugt kein Ergebnis; die konkrete
  Fehlerklasse bleibt inhaltsfrei.
- Die Installation benötigt für PDF einen vorab administrierten absoluten
  LibreOffice-Pfad. Cemaris lädt oder installiert keine Binärdateien.
- Dokumente sind nach der Antwort nicht wiederabrufbar. Eine Neuerzeugung
  verwendet den dann aktuellen kanonischen Daten- und Vorlagenstand.
- Die synthetische Test-Fixture wird reproduzierbar aus der autorisierten
  Quelle abgeleitet, aber niemals publiziert.
- OpenXML-/LibreOffice-Updates, produktive Serverpfade, Schriftarten,
  Ressourcenlimits und visuelle Abnahme sind Gegenstand des separaten
  Betriebs- und Pilotfreigabegates.

## Nicht entschieden

ADR-0019 ändert ADR-0018 nicht und führt keine Rechtswirkung, Freigabe,
Signatur, Zustellung, Archivierung, Winyard-/FINANZ+-Integration,
Empfängeranrede, automatische Gebühren-/Rechtsberechnung,
Altbestandsmigration oder Produktivaktivierung ein. Weitere Dokumentarten und
eine allgemeine Dokumentengine benötigen ein neues vollständiges Gate.

