# Technische Komponentenmatrix EDWALT

Stand: 10. August 2026

## Einordnung

Die Matrix beruht ausschließlich auf statischer Analyse: Dateisignaturen,
Windows-Versionsressourcen, lesbare Konfiguration, `DEPLOY.TXT`, Hilfen und
Releasehinweise. Keine EXE, DLL, GS, GNT, LBR, BAT oder Makrodatei wurde
ausgeführt. Vorhandensein bedeutet nicht Installation, Lizenzierung oder
aktuelle Nutzung.

## Laufzeit, Programmkern und Betrieb

| Komponenten-ID | Datei/Modul und Typ | Erkennbare Aufgabe; Version/Datum | Abhängigkeiten / Konfiguration | Hilfe/Funktion | Risiko / Migrationsrelevanz | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|---|---|
| TECH-001 | `EDWALT3.EXE`, `EDW3_32.EXE`, `EDW.GS`; PE/GS | Programmkern und 32-Bit-Startkomponenten; keine verwertbaren Produktversionsressourcen | Micro-Focus-Laufzeit, Dialog System, DAT/IDX, `EDWALT3.INI` | Hauptmenü in beiden Handbüchern | Proprietärer 32-Bit-Kern; nur als Quellbeleg, nicht als Migrationskomponente | SRC-APP-0162/0166/0170; ANNAHME; hoch | Welcher Startpfad und welche Programmversion sind im laufenden Betrieb maßgeblich? |
| TECH-002 | `CBLRTS*.DLL`, `CBLEXEC*.EXE` u. a.; PE | MERANT/Micro Focus 32-bit RTS; Versionsressource `3.714, 3.491` | COBOL-Module GNT/GS/LBR | keine Fachhilfe | Altes, proprietäres Laufzeitsystem; Reproduzierbarkeit und Support unklar | SRC-APP-0062/0063/0072/0073, SRC-APP-0092; ANNAHME; hoch | Welche Runtime-Lizenz und welche Betriebssystemversion werden tatsächlich verwendet? |
| TECH-003 | `DSGRUN.DLL`, `DSFWBW32.DLL`, `MFBPS.DLL`; PE | MERANT Dialog System Run-time; Versionsangaben `DSGR 06042000` bzw. `DSXT 31012000` | GS-Ressourcen, COBOL-RTS | sichtbare Windows-Masken der Hilfen | UI ist eng an eine historische Laufzeit gekoppelt; keine direkte Wiederverwendung vorgesehen | SRC-APP-0113 und Manifestgruppe Dialog System; ANNAHME; hoch | Sind außer den dokumentierten GS-Masken kundenspezifische Varianten aktiv? |
| TECH-004 | `MFFH.DLL`; PE | Micro Focus External File Handler, Version `060 000 104` | DAT/IDX-Dateien, File-Handler-Konfiguration | alle datenhaltenden Funktionen | Zentrale Abhängigkeit für spätere lesende Extraktion; Satzlayouts fehlen | SRC-APP-0333, SRC-APP-0092; ANNAHME; hoch | Existieren Copybooks oder ein herstellerseitig unterstützter Read-only-Export? |
| TECH-005 | `FS.DLL`, `FS.EXE`, `FSSERVICE.EXE`, `FSCLOSE.EXE`; PE | Micro Focus Fileshare, Versionsressource `V9234R` | CCI-Netzwerk, Dateihandler, möglicherweise Serverpfade | Pfadkonfiguration in den Handbüchern | Gleichzeitigkeit, Sperren und Sicherung möglicherweise dateibasiert; nicht für Migration aus laufendem Betrieb kopieren | SRC-APP-0271/0272/0275, SRC-APP-0092; ANNAHME; hoch | Wird Fileshare produktiv eingesetzt, und wie wird ein konsistenter Sicherungsstand erzeugt? |
| TECH-006 | `CCITC32.DLL`, `CCITCP2.EXE` sowie weitere CCI-Module; PE | MERANT CCI für TCP/IP, APPC, IPX und NetBIOS; CCITCP-Version `CCITC32WP11m_5` | Fileshare/Netzwerkbetrieb | keine Fachhilfe | Mehrere mitgelieferte Protokolle sind kein Nutzungsbeleg; Altprotokolle erhöhen Betriebsrisiko | SRC-APP-0084/0085, SRC-APP-0092; ANNAHME; hoch | Welches Protokoll ist konfiguriert, und ist der Zugriff auf ein isoliertes Netz begrenzt? |
| TECH-007 | `ODBCRW32.DLL`, `_SQLODBC.DLL`, `CSQLSUPP.DLL`; PE | MERANT Embedded SQL via ODBC, Version `ESQL-M4X-003`; COBSQL-Laufzeit vorhanden | ODBC-Treiber/Datenquelle; konkrete DSN-Werte nicht dokumentiert | Export-/Schnittstellenmodule | ODBC-Fähigkeit vorhanden, aber keine produktive SQL-Verbindung belegt | SRC-APP-0359, SRC-APP-0092, TECH-021; ANNAHME; hoch | Existiert eine produktive DSN, und welche Daten werden nur gelesen oder geschrieben? |
| TECH-008 | `MFOLE*.DLL`, `OLECL*.DLL`; PE | Micro-Focus-OLE- und Class-Library-Unterstützung | Microsoft Word/OLE, BAS-Makros, DOT-Vorlagen | Formular-/Listendruck | Versions- und Bitness-Kopplung an altes Office; Makros und externe Vorlagenbeziehungen | SRC-APP-0339/0340, SRC-APP-0092, DOC-001/DOC-002; ANNAHME; hoch | Welche Word-Version und Sicherheitsrichtlinie gelten im produktiven Ablauf? |
| TECH-009 | `EDWALT3.INI`; Textkonfiguration | Steuert Start, Auflösung, Währung/USt, Druck/Word, Bescheid/Gutschrift, Grab-/Terminprüfungen, Ruhe-/Nutzungszeit, FUG, Pfade, Krematorium, Personenkonto und Schnittstellen | Werte mit Pfad-, System- oder Schutzbezug wurden nicht dokumentiert | nahezu alle Bereiche | Schlüssel sind wichtige Migrations- und Interviewhinweise; Werte dürfen nicht ungeprüft übernommen werden | SRC-APP-0171; ANNAHME; hoch | Welche Schlüssel sind aktuell wirksam, welche nur Altlasten oder kundenbezogene Optionen? |
| TECH-010 | `AUSWAHL.INI`; Textkonfiguration | Wertelisten für Vorgänge, TE-Grab-/Beerdigungsarten, Anrede, PLZ/Ort, Suchcodes, Grabzustand, Word-Formulare und Auftragstexte | Programmmasken und Vorlagen; Werte nicht dokumentiert | Stammdaten/Auswahlfelder | Mischform aus Fachkatalog und UI-Konfiguration; fachliche Gültigkeit offen | SRC-DAT-0003; ANNAHME; hoch | Welche Listen sind verbindlich, lokal ergänzt oder nicht mehr genutzt? |
| TECH-011 | `DEPLOY.TXT`; Text | Hersteller-Deploymentliste für Net Express, Fileshare, CCI, ODBC, Btrieve, OLE, Java, CGI/ISAPI u. a. | beschreibt mitlieferbare Runtime-Komponenten | keine Fachhilfe | Belegt technische Fähigkeiten, nicht deren Aktivierung | SRC-APP-0092; ANNAHME; hoch | Welche Einträge gehören zur konkret installierten EDWALT-Konfiguration? |

## Fach- und Zusatzmodule

| Komponenten-ID | Datei/Modul und Typ | Erkennbare Aufgabe | Konfiguration / Daten | Hilfe/Funktion | Risiko / Migrationsrelevanz | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|---|---|
| TECH-012 | `STAMM.DLL/.GS` | Stammdatenpflege | W001, W004 bis W007; Auswahl/INI | EDW Teil I, EDK Stammdaten | Grundlage vieler Kataloge, aber Ist-Gültigkeit unbekannt | SRC-APP-0417/0418; ANNAHME; hoch | Welche Stammfunktionen sind administrativ freigegeben und noch in Benutzung? |
| TECH-013 | `FORM.DLL/.GS` | Formularzuordnung/-steuerung | `form.dat`, EDWFRM-Vorlagen, Word-Makros | EDW Formularpflege und Druck | Dokumentauslöser sind migrationskritisch | SRC-APP-0269/0270, SRC-DAT-0047/0048; ANNAHME; hoch | Welche Formularnummer löst welche aktuell gültige Vorlage aus? |
| TECH-014 | Kernmodule mit `EDW*`, darunter Grab-/Vorgangsbearbeitung | Grabstamm, Verstorbene, Beisetzungen, Gebühren, Suche und Bearbeitung | W020 bis W023, W006, EDWALT3.INI | EDW Teil II/III | Höchste fachliche und datenschutzrechtliche Migrationsrelevanz | SRC-APP-0162 sowie MAN-EDW-100 bis MAN-EDW-214; ANNAHME; hoch | Welche Teilabläufe werden heute tatsächlich durchgeführt? |
| TECH-015 | `AUSWERT*.DLL/.GS` | Auswertungsfamilie für Gräber, Vorgänge, Listen und Statistik | W020/W021/STATIST, Druckkonfiguration | EDW Teil IV, EDK Auswertungen | Reportlogik und Auswahlkriterien müssen fachlich neu bestätigt werden | SRC-APP-0018 bis SRC-APP-0030; ANNAHME; hoch | Welche der 22 dokumentierten Auswertungen werden regelmäßig gebraucht? |
| TECH-016 | `DRUCK1`, `DRUCK26`, `DRUCK80`, `DRUCKFUG`, `DRUCKFUW`, `DRUCKW80`, `DRUCKWW`; DLL | Druckmodule für allgemeine, Krematoriums-, FUG- und weitere Schreiben | DOT-Vorlagen, EDW_SD-Steuerdateien, Word-Makros | Druck in EDW/EDK; Release 3.20/3.30 | Alte Office-Automatisierung und unklare Formularvarianten | SRC-APP-0099 bis SRC-APP-0105; ANNAHME; hoch | Welche Module werden durch welche Menüpunkte/Formularnummern aufgerufen? |
| TECH-017 | `BUCHSCHK`, `BUCHSCHN`; DLL/GS | Buchungs-/Schnittstellenverarbeitung für Personenkonto und Finanzsysteme | `buch.dat`, INI-Schnittstellenschalter | EDW Teil III/VI; Releasehinweise | Finanzielle Abstimmung, Dubletten und Statusübergaben sind kritisch | SRC-APP-0049 bis SRC-APP-0052, REL-320; ANNAHME; hoch | Welche Variante (Standard, DATEV, INFOMA, UVN-FIN) ist aktiv? |
| TECH-018 | `KASSENZ.DLL/.GS` | Kassenzeichen-/Personenkonto-Hilfsfunktion | KASSENZ.DAT, INI-Schlüssel zu Kassenzeichen/Modulo | EDW Teil VI nur verkürzt | Externe Schlüsselvergabe und Eindeutigkeit ungeklärt | SRC-APP-0287/0288, SRC-DAT-0096/0097; ANNAHME; mittel | Wer ist führend für Kassenzeichen, EDWALT oder Finanzverfahren? |
| TECH-019 | `DTAUS.DLL/.GS` | DTAUS-/Zahlungsdateifunktion, anhand Modulname | Finanz-/Bankdaten, weitere Konfiguration nicht belegt | keine eindeutige Hilfebeschreibung | Mögliches historisches Zahlungsformat; Vorhandensein ist kein Nutzungsbeleg | SRC-APP-0115/0116; ANNAHME; mittel | Wurde DTAUS jemals bzw. wird eine Nachfolgeschnittstelle genutzt? |
| TECH-020 | `EDWDFUE.DLL/.GS`, `BUCHSCHN`, INI-Schalter | Datenfernübertragung und Finanzschnittstellen; Release nennt DATEV, UVN-FIN, Standard und INFOMA sowie kameral/Doppik | EDWALT3.INI, Personenkonto/Buchung | Release 3.20/3.30 | Mehrere Varianten; Endpunkte, Dateiformate und aktive Auswahl sind unbekannt | SRC-APP-0172/0173, SRC-APP-0403/0405, SRC-APP-0171; ANNAHME; hoch | Welches Zielsystem, Format, Intervall und Fehlerverfahren gelten heute? |
| TECH-021 | `EXPORT~1.DLL`, `EXPRTSQL.DLL` | Export bzw. SQL-Export, anhand Module und ODBC-Laufzeit | ODBC/Datei; keine Endpunkte dokumentiert | keine eindeutige Hilfebeschreibung | Datenabfluss und Zeichensatz/Mapping ungeklärt | SRC-APP-0265/0266, SRC-APP-0359; ANNAHME; mittel | Was wird exportiert, wohin und mit welcher Rechts-/Zweckgrundlage? |
| TECH-022 | `KREMA.EXE/.GS`, `P080`, `P081`, `DRUCK80` | Krematorium, Einäscherung, Versand und zugehörige Drucke | W080, Krematoriums-INI, Vorlagen 80 ff. | vollständiges EDK-Handbuch | Optionales/historisches Modul möglich; besonders sensible Daten | SRC-APP-0309/0310, SRC-APP-0386 bis SRC-APP-0389, MAN-EDK-001 ff.; ANNAHME; hoch | Wird ein kommunales Krematorium verwaltet oder ist das Modul stillgelegt? |
| TECH-023 | `TE.DLL/.GS`, `TEKOELN.DLL/.GS` | Terminverwaltung und lokale Variante | W010, Termin-INI, AUSWAHL `TE-*` | EDW Teil VII nur verkürzt | Unvollständige Dokumentation und mögliche kundenspezifische Variante | SRC-APP-0425 bis SRC-APP-0428, DAT-014; ANNAHME; hoch | Welche Variante läuft, und wo ist das separate Terminhandbuch? |
| TECH-024 | `P025`, `P026`, `P027`, `P050`; DLL/GS | FUG-/Umbettungs-/Personenkonto-nahe Sonderfunktionen; genaue Zuordnung nur teilweise aus Hilfe/Release ableitbar | EDWALT3.INI, W020/W021/W040, Vorlagen | EDW FUG; Release 3.20 | Modulnummern allein reichen nicht für sichere Semantik | SRC-APP-0370 bis SRC-APP-0382, SRC-APP-0403; ANNAHME; mittel | Welche Programmnummer gehört zu welchem produktiven Ablauf? |
| TECH-025 | `VIEW.DLL/.GS` | Daten-/Berichtsanzeige; Release 3.20 nennt Erweiterung der Viewer-Zeilen | Ausgabedateien/Listen | Auswertungen | Anzeige kann technische Zwischenformate offenbaren; Funktion nicht separat dokumentiert | SRC-APP-0439/0440, SRC-APP-0403; ANNAHME; mittel | Welche Datenquellen und Exportmöglichkeiten besitzt der Viewer? |
| TECH-026 | `KON302`, `KON310`, `KON321`, `KONHADES`, `KONHFREI`, `KONLOH`, `KONRAT`, `KTRANS1/2` | Konvertierungs-/kundenspezifische Hilfsmodule, abgeleitet aus Benennung | unbekannt | keine eindeutige Fachhilfe | Nicht ausführen; mögliche historische Datenumformungen, Semantik unklar | SRC-APP-0297 bis SRC-APP-0312; ANNAHME; niedrig | Welche Module waren einmalig, kundenspezifisch oder weiterhin erforderlich? |

## Wartung, Protokolle und Releaseunterlagen

| Komponenten-ID | Artefakt | Beobachtung | Risiko / Grenze | Evidenz; Status; Konfidenz | Offene Frage |
|---|---|---|---|---|---|
| TECH-027 | `REBUILD.EXE`, `RebuildW.exe`, `REORG.BAT`, `REORG_W.BAT` | Hersteller-/lokale Index- und Reorganisationswerkzeuge sind vorhanden. | Nie ausgeführt. Sie könnten Quelldaten und Indexe verändern. | SRC-APP-0399/0401/0406/0407 und SRC-DAT-0111; ANNAHME; hoch | Wie werden Konsistenzprüfung und Sicherung im Betrieb autorisiert durchgeführt? |
| TECH-028 | `SETUP.EXE/.INI/.INS/.ISS` | InstallShield-Setup-Artefakte sind vorhanden. | Nie ausgeführt; enthaltene Installationsannahmen können veraltet sein. | SRC-APP-0409 bis SRC-APP-0412; ANNAHME; hoch | Existiert eine dokumentierte, reproduzierbare Installation? |
| TECH-029 | `rebuild.err`, `REORG-W.LOG`, `mfdebug.log` | Fehler-/Wartungsprotokolle vorhanden; `rebuild.err` ist binärnah und potenziell inhaltsführend. | Keine Rohinhalte dokumentiert; mögliche Personen-, Pfad- oder Satzfragmente. | SRC-DAT-0110/0113, SRC-APP-0332; OFFEN; hoch | Dürfen diese Artefakte in einer geschützten Umgebung forensisch ausgewertet werden? |
| TECH-030 | `Release3.20` und `Release3.30`, DOC/PDF | Versionsänderungen zu FUG, Druck, Listen, Krematorium, Personenkonto, Finanzschnittstellen, Word und Konvertierungen | PDF vollständig lokal gerendert/geprüft; DOC nur passiv als OLE. Keine Texte kopiert. | SRC-APP-0402 bis SRC-APP-0405; ANNAHME; hoch | Welche Releaseversion entspricht dem laufenden Programm und den Daten? |
| TECH-031 | lokale HLP/CNT und zwei HTML-Hilfen | Produkt- und Laufzeithilfen vorhanden; HTML-Hilfen strukturell vollständig ausgewertet | HLP-Altformat nicht vollständig semantisch extrahiert; keine aktive Hilfe ausgeführt | SRC-APP-0001 ff., MAN-EDW/EDK; ANNAHME; hoch | Gibt es separate aktuelle Hilfen für Kasse/Personenkonto und Terminverwaltung? |

## Schnittstellen- und Abhängigkeitsbefund

| Hinweis | Befund | Evidenz | Status; Konfidenz | Offene Frage |
|---|---|---|---|---|
| Microsoft Word/OLE | Durch Makros, DOT-Vorlagen, Steuerdateien, OLE-Runtime und INI-Schlüssel mehrfach belegt. | TECH-008/009/013/016, DOC-001 bis DOC-004 | ANNAHME; hoch | Welche Word-Version, Vorlagenpfade und Druckprofile sind produktiv? |
| Finanz/Kasse | DATEV, UVN-FIN, Standard, INFOMA sowie kameral/Doppik werden in Releases/INI/Modulen genannt; aktuell ist keine EDWALT-Finanzdatenübergabe aktiv. Bescheide werden manuell im führenden Finanzverfahren eingebucht. | TECH-017 bis TECH-020, SRC-APP-0403/0405, INT-014 | Artefakte `ANNAHME`, heutige Nichtnutzung `BESTÄTIGT`; hoch | Welche Felder und Kontrollen umfasst die manuelle Einbuchung; ist künftig eine Schnittstelle gewünscht? |
| DTAUS | Module vorhanden, aber weder aktiver Endpunkt noch Ablauf in der HTML-Hilfe belegt. | TECH-019 | ANNAHME; mittel | Historisch/optional/produktiv? |
| ODBC/SQL | Laufzeit und Exportmodul vorhanden; DSN oder Zielsystem nicht belegt. | TECH-007/021 | ANNAHME; hoch | Nur mitgeliefert oder aktiv konfiguriert? |
| Btrieve | `DEPLOY.TXT` und Laufzeitmodule enthalten Btrieve-Unterstützung. | SRC-APP-0092 und Manifest | ANNAHME; mittel | Wird Btrieve von EDWALT selbst oder nur als optionale Runtime mitgeliefert? |
| Fileshare/Netzwerk | Runtime-Komponenten und Pfadkonfiguration vorhanden. | TECH-005/006/009, DAT-023 | ANNAHME; hoch | Wie werden Sperren, Backups und Mehrbenutzerzugriffe betrieben? |
| ArcView | Release 3.20 beschreibt Änderungen an einer ArcView-Anbindung. | SRC-APP-0403 | ANNAHME; hoch | Wurde GIS/ArcView produktiv genutzt und existieren externe Daten/Exporte? |
| E-Mail | Kein belastbarer fachlicher Versandablauf in HTML-Hilfen oder Konfiguration festgestellt; vereinzelte Texttreffer reichen nicht aus. | strukturierte Hilfe-/Konfigurationsanalyse | OFFEN; mittel | Erfolgt E-Mail außerhalb EDWALT oder gar nicht? |
| Winyard/DMS | In den untersuchten EDWALT-Quellen wurde kein Winyard-Verweis gefunden. Laut INT-017 existiert keine EDWALT-Schnittstelle; vorgesehen ist Speichern und manueller Upload nach Winyard. | Volltextsuche in lesbaren Artefakten; INT-017; Cemaris-Kontext in `docs/architecture/winyard-integration.md` | technischer Quellenbefund `ANNAHME`, Soll-Ablauf `BESTÄTIGT`, Ist-Praxis `OFFEN`; hoch/mittel | Wird die Ablage tatsächlich vollständig ausgeführt, und welche lokalen/Papier-Nebenablagen existieren? |

## Maskierte Konfigurationsgruppen

Aus `EDWALT3.INI` wurden ausschließlich Schlüsselgruppen, nie Werte,
dokumentiert: Start/Anzeige, Währung und Umsatzsteuer, Standardwerte,
Formular-/Listendruck, Word-Zeitsteuerung, Bescheid-/Gutschriftarten,
Grab-/Verstorbenenhinweise, Terminprüfung und -sicherung, Berechnung von
Ruhe- und Nutzungszeiten, FUG, lokale/Serverpfade, Krematoriumsstatus,
Personenkonto/Kassenzeichen und Schnittstellenschalter. Servernamen,
Benutzernamen, Netzpfade und mögliche geheime Werte wurden nicht übernommen
(SRC-APP-0171; Status: ANNAHME; Konfidenz: hoch; OFFEN: wirksame Auswahl).
