# Abschluss Inkrement 5g: kommunales Kurzentscheidungs- und Freigabegate

Stand: 24.08.2026

## Ergebnis

Inkrement 5g ist ausschließlich dokumentarisch mit Variante A „keine
Implementierung“ abgeschlossen. Untersucht wurde genau ein möglicher Schnitt:

> eine manuell ausgelöste und historisierte vorzeitige Rückgabe eines
> kanonischen Nutzungsrechts nach bereits abgelaufener Ruhezeit.

Die Bezeichnung bleibt eine Untersuchungsfrage aus der örtlichen
Satzungsevidenz E-17. Sie ist keine bestätigte Cemaris-Fachregel. Die
interaktive Auskunft vom 24.08.2026 enthält pragmatische Produktpräferenzen,
aber ausdrücklich keine Aussagen oder Freigaben einer in
Friedhofsangelegenheiten zuständigen Funktion. Damit fehlen weiterhin die
Mindestentscheidungen für eine belastbare Variante B.

Produktcode, Frontend, Backend, API/OpenAPI, Domain, Berechtigungen,
Persistenz, Migrationen und Tests wurden in 5g nicht geändert. Es wurden
keine Datenbank, keine laufende API, kein Frontend-Dev-Server und keine
manuelle Fachmutation verwendet.

## Repository-Ausgangsstand

Der in der 5g-Übergabe erwartete uncommittierte 5f-Stand war vor Beginn bereits
als genau ein Commit erstellt und zu `origin/main` übertragen worden:

- Branch `main`;
- HEAD `7e93eafb5a2af1ba95df98fe3bf1d5d462ba3a96`;
- Elterncommit `aee488c13fe1ec22cb98f2e35194423071d6d8ff`;
- Commitbetreff `docs: complete usage-right lifecycle gate and add 5g handoff`;
- Upstream `origin/main`, Ahead/Behind `0/0`;
- exakt die zehn in der Übergabe angekündigten 5f-Dateien;
- sauberer Arbeitsbaum, leerer Index und keine normalen unversionierten
  Dateien.

Der vorhandene Commit wurde vollständig untersucht und weder zurückgesetzt
noch verändert. In 5g wurde kein Commit erstellt.

## Quellen und Auskünfte

Vollständig gelesen wurden die verbindliche 5g-Übergabe, der 5f-Abschluss,
die 5f-Matrix, die Anforderungen und Architektur zu Beteiligten und
Nutzungsrechten, ADR-0016, die Identitäts-, Autorisierungs- und Auditvorgaben,
die zugehörige Architektur, die Root-README und alle vier
Dokumentationsindizes.

Die bereits dokumentierte Auskunft
`USR-2026-08-21-ADMIN-DEVELOPMENT` wurde nicht erneut erfragt. Sie bestätigt
nur Open-Source-Nachnutzung, Doberlug-Kirchhain als ersten Kontext und EDWALT
als Erhebungsorientierung.

Die neue Quelle `USR-2026-08-24-NONFACHLICHE-PRÄFERENZEN` ist die direkte
Auskunft im Cemaris-Implementierungsdialog vom 24.08.2026:

- auskunftgebende Einordnung: nach eigener Aussage nicht in
  Friedhofsangelegenheiten involviert und auf die Erstellung einer einfachen
  EDWALT-Ablösung gerichtet;
- Quelle: direkter Implementierungsdialog;
- kommunaler Geltungsbereich: nicht benannt;
- Fach- oder Freigabefunktion: nicht benannt.

Die Auskunft nennt folgende Produktpräferenzen:

- Rückwirkung und nachträgliche Änderungen sollen grundsätzlich möglich und
  dokumentiert sein;
- `Sachbearbeitung` und `Administration` sollen ohne Vier-Augen-Prinzip
  ausreichen;
- ein sparsamer Audit wird bevorzugt;
- EDWALT-Altdaten sollen später migriert werden, ohne neue Funktionen
  rückwirkend auf Altbestände anzuwenden;
- Fach- und Freigabefragen werden als Aufgabe der Verwaltung verstanden.

Diese Aussagen sind für die Produktdiskussion verwertbar. Ohne benannte
Friedhofsverwaltung, Rechtsprüfung, Datenschutz-, Sicherheits- und
Betriebsverantwortung sind sie jedoch keine freigabefähigen kommunalen
Fachentscheidungen. Die vollständige Auswertung steht in der
[5g-Quellen-, Entscheidungs- und Freigabematrix](cemaris-increment-5g-evidence-decision-approval-matrix.md).

## Erläuterung des Untersuchungskandidaten

Die untersuchte Rückgabe wäre fachlich von drei bereits vorhandenen
Operationen zu unterscheiden:

- Sie wäre keine Korrektur eines versehentlich falsch erfassten Datums.
- Sie wäre keine automatische Beendigung durch das manuelle Enddatum.
- Sie wäre keine spätere Wiedervergabe der Grabstelle.

Als mögliche, noch nicht bestätigte Bedeutung würde eine berechtigte Person
eine vorzeitige Beendigung erklären, nachdem die maßgebliche Ruhezeit bereits
abgelaufen ist. Cemaris müsste dann ein manuell angegebenes Wirksamkeitsdatum
und die Verwaltungsentscheidung historisieren. Ob die Erklärung allein
ausreicht, welche Nachweise nötig sind und welche Rechtswirkung eintritt,
kann nur die zuständige Verwaltung mit Rechtsprüfung entscheiden.

## Nicht bindende Produktempfehlungen

Die folgenden Empfehlungen minimieren Komplexität, sind aber ausdrücklich
keine Anforderungen und keine Implementierungsfreigabe:

1. Cemaris sollte die rechtliche Zulässigkeit eines Nachweises nicht
   berechnen. Für eine spätere manuelle Operation wären zunächst nur eine
   Quellenreferenz, eine kurze Begründung und die Bestätigung der manuellen
   Prüfung nötig; ein Dokumentenarchiv wäre kein Mindestbestandteil.
2. Eine spätere Operation sollte einen expliziten Lebenszykluszustand oder ein
   unveränderliches Rückgabeereignis ergänzen. Sie sollte Startdatum,
   manuelles Enddatum, Startregel-Snapshot und `UsageRightId` nicht
   überschreiben.
3. Rückwirkende Erfassung und Korrektur sollten ausschließlich durch neue
   Revisionen erfolgen. Eine fachliche Rücknahme wäre eine eigene neue
   Operation und dürfte die bestehende Historie nicht löschen.
4. Für einen einfachen Zuschnitt könnten die vorhandenen Rollen genügen. Das
   ist erst nach fachlicher Klassifizierung und Sicherheitsfreigabe belastbar;
   aus der allgemeinen 5b-Rollenmatrix folgt keine Freigabe für eine neue
   Beendigungsoperation.
5. Als sichere spätere Regel sollte eine Rückgabe bei einem noch laufenden
   Beisetzungsprozess nicht möglich sein. Der offene Inhaberzeitraum könnte
   atomar am Wirksamkeitstag enden. Beides benötigt vor Umsetzung eine
   fachlich-rechtliche Bestätigung.
6. Grabstellenstatus und getrennte Sperre sollten durch die Rückgabe nicht
   automatisch geändert werden. Eine Wiedervergabe sollte ein eigener,
   später freizugebender Vorgang mit neuem Nutzungsrecht gemäß REQ-UR-008
   bleiben.
7. Der bestehende sparsame Audit kann ausreichen. Fachquelle, Begründung,
   Vorher-/Nachher-Zustand und Inhaberzeitraum gehören dann ausschließlich in
   die geschützte Fachrevision.
8. EDWALT-Altdaten sollten ohne abgeleiteten Rückgabestatus, Backfill oder
   erfundene Historie als getrennte Altprojektion migriert werden. Eine
   Übernahme in den kanonischen Kern darf nur nach eigenen bestätigten
   Zuordnungs- und Nachweisregeln erfolgen.

## Fehlende Entscheidungen und Freigaben

| Fehlstelle | Benötigte Funktion | Warum Variante B gesperrt bleibt |
| --- | --- | --- |
| tatsächlicher Bedarf, Rechtearten und kommunaler Geltungsbereich | Friedhofsverwaltung und Produktverantwortung | der sachliche Schnitt ist nicht bestätigt |
| Antrag, Erklärung, Pflichtnachweis und Nachweis der abgelaufenen Ruhezeit | Friedhofsverwaltung und Rechtsprüfung | Auslöser und Zulässigkeit sind offen |
| Wirksamkeitsgrenzen, Rückwirkung, Korrektur und Rücknahme | Friedhofsverwaltung und Rechtsprüfung | die allgemeine Präferenz bestätigt keine kommunale Rechtswirkung |
| expliziter Zustand und unveränderte Fakten | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | der Domainübergang ist offen |
| Funktionen für Auslösen, Bestätigen, Korrigieren und Rücknehmen | Fachverantwortung und Berechtigungs-/Informationssicherheitsverantwortung | die Rollenpräferenz ist nicht freigegeben |
| Konflikte mit Beisetzungen und Ende des Inhaberzeitraums | Friedhofsverwaltung und Rechtsprüfung | die atomare Fachwirkung ist offen |
| Wirkung auf Grabstatus, Sperre und Wiedervergabe | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | eine Empfehlung ersetzt keine Fachregel |
| Pflichtquelle, Begründung und Fachrevisionsinhalt | Friedhofsverwaltung, Produktverantwortung und Datenschutz | der geschützte Fachnachweis ist nicht festgelegt |
| Altbestand, Bestandsschutz, Migration und fehlende Nachweise | Friedhofsverwaltung, Rechtsprüfung, Migration und Produktverantwortung | keine sichere kanonische Übernahme ist freigegeben |
| Datenschutz-, Sicherheits- und Betriebsfreigabe | Datenschutz, Informationssicherheit und Betrieb | zusätzliche Verarbeitung und Betriebsgrenze sind nicht abgenommen |

## Variantenvergleich und Entscheidung

| Aspekt | A – keine Implementierung | B – eine manuelle historisierte Rückgabe | C – Berechnung oder Automatik |
| --- | --- | --- | --- |
| Fachquelle | keine neue Regel behauptet | benötigt benannte Verwaltungs- und Rechtsentscheidung | würde zusätzliche Regelstände und Berechnungen benötigen |
| Domainwirkung | 5b-Kern und ADR-0016 unverändert | Zustand/Ereignis und Ende des Inhaberzeitraums müssten bestätigt werden | zusätzliche Frist-, Zustands- und Folgeprozessmodelle |
| Nachweis | keine neue Speicherung | empfohlene Quellenreferenz und Begründung erst nach Fachentscheidung | automatische Nachweis- und Regelstandslogik |
| Grabstelle | Status und Sperre unverändert | ausdrücklich keine oder bestätigte atomare Wirkung nötig | ausgeschlossene Grabstellenautomatik |
| Altbestand | keine Rückinterpretation | nur nach eigener Migrations- und Nachweisregel | unzulässige automatische Rückrechnung |
| Freigaben | fehlende Funktionen exakt dokumentiert | Fach, Recht, Datenschutz, Sicherheit und Betrieb fehlen | für 5g ausgeschlossen |
| Entscheidung | **ausgewählt** | nicht spezifiziert und nicht freigabefähig | ausgeschlossen |

Variante A ist nicht bloß ein Aufschub technischer Arbeit. Sie ist die sichere
Produktentscheidung, solange die für eine rechtlich wirksame
Verwaltungsoperation zuständigen Stellen noch keine Regel benötigen und
freigeben. Der übrige Ausbau einer einfachen Friedhofsverwaltungssoftware
kann mit fachregelarmen, bereits belegten Verträgen fortgesetzt werden.

ADR-0016 wird weder erweitert noch ersetzt. Es wurde kein neues ADR erstellt.

## Abschlussprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen und 0 Fehler |
| vollständige Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 50 von 50 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | abgeschlossen; Dependency-Baum konsistent, 0 bekannte Schwachstellen |
| vollständige Frontendtests | 37 von 37 in 8 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| relative Markdown-Links und Anker | 86 Markdown-Dateien geprüft; 0 Befunde |
| Markdown-Tabellen | konsistente Spaltenzahlen; 0 Befunde |
| Whitespace | 0 Befunde |
| Secretprüfung ohne Ausgabe von Werten | 0 Befunde |
| vollständige finale Git-Prüfung | bestanden; Index leer, ausschließlich sieben geänderte und drei neue Dokumentationsdateien |

Der erste Buildaufruf hinterließ kurzzeitig eine Dateisperre des
`VBCSCompiler`. Ausschließlich die .NET-Buildserver wurden mit dem
verbindlichen SDK beendet; der unmittelbar wiederholte Release-Build bestand
mit 0 Warnungen und 0 Fehlern. Dies war kein Produktcode- oder Testfehler.

Die reale SQL-Suite wurde nicht gestartet. Es wurde keine Datenbank gelesen,
angelegt, migriert oder verändert und kein Verbindungswert verwendet. API und
Frontend-Dev-Server wurden nicht gestartet. Alle eigenen Arbeitsdateien
liegen im Cemaris-Repository; eine externe Phase-Arbeitsfläche oder ein
EDWALT-Original wurde weder geöffnet noch verändert.

Der ignorierte Fremdbestand `tmp/pagination-build` umfasst weiterhin 890
Dateien und 120.354.652 Bytes. Der reproduzierte Manifest-Hash aus
repository-relativem Pfad, Dateilänge, UTC-Ticks und Datei-SHA-256 ist vor und
nach 5g unverändert
`367F771371F49741DCA3C0EEA46B38E15DE2AF8F48D1DCA4B8BCD573230AC6A7`.
Der Bestand wurde weder verändert noch entfernt oder als eigene Arbeit
ausgegeben.

HEAD bleibt `7e93eafb5a2af1ba95df98fe3bf1d5d462ba3a96`. Der Index ist leer;
in 5g wurde kein Commit erstellt. Geändert wurden ausschließlich Root-README,
alle vier Dokumentationsindizes sowie die Anforderungs- und
Architekturdokumente zu Nutzungsrechten. Neu und unversioniert sind
ausschließlich dieser Abschluss, die 5g-Matrix und die 5h-Folgeübergabe.

## Nächster sicherer Schritt

Der Lebenszykluspfad bleibt pausiert, bis die zuständigen kommunalen
Funktionen belastbare Entscheidungen liefern. Die
[kontextlose 5h-Folgeübergabe](cemaris-increment-5h-next-step-handoff.md)
grenzt stattdessen ein dokumentarisches Auswahlgate für genau ein
fachregelarmes Folgeinkrement auf bereits bestätigten Verträgen ab.
