# Folgegate: Betriebs- und Pilotfreigabe der 6c-Dokumenterzeugung

Stand: 01.09.2026

## Status und Zweck

Dieses Gate ist am 31.08.2026 vollständig **mit Variante A – Stop
ausgeführt**. Die
[Entscheidungsakte](../requirements/notice-generation-pilot-release-decisions.md)
und der
[Abschlussnachweis](cemaris-notice-generation-pilot-release-gate-completion.md)
dokumentieren die beabsichtigte Nutzung des Development-Repositorys mit
`Cemaris_Dev`, die ergänzende Klarstellung als eigens geschaffene kombinierte
Development- und Testpilotumgebung und die weiterhin fehlenden Installations-
und Abnahmenachweise. Ein Datenbankwiderspruch besteht damit nicht mehr; die
übrigen offenen und nur teilweise bestätigten Pflichtnachweise tragen die
Variante A weiterhin. Der historische Nichtinstallationsbefund ist seit dem
01.09.2026 überholt: LibreOffice `26.8.0.3` ist gültig signiert und startfähig;
reale Ausgabe- und weitere Betriebsnachweise fehlen weiterhin. Der nächste
zulässige Auftrag ist die
[technische Pilot-Readiness und Neubewertung](cemaris-notice-generation-synthetic-pilot-readiness-next-step-handoff.md),
nicht die Aktivierung. Der technische
[6c-Abschluss](cemaris-increment-6c-completion.md) erlaubt weiterhin keinen
stillen Pilot- oder Produktivbetrieb. `Features:NoticeGenerationEnabled`
bleibt in jeder vorhandenen Installation `false`; es entstand kein
Aktivierungsauftrag.

Zweck des Gates ist ausschließlich zu entscheiden, ob der bereits
implementierte rechtlich wirkungslose Gebührenbescheidentwurf für
Beisetzungsgebühren in einer exakt benannten, begrenzten Pilotumgebung mit
synthetischen Daten aktiviert werden darf. Es implementiert keine neue
Fachfunktion.

Das Gate ist ein ausschließlich dokumentarischer und interaktiver Schritt.
Es aktiviert die Capability nicht, verändert keine installationsbezogene
Konfiguration und führt keine Pilotabnahme aus. Eine Variante B darf nur einen
separaten, erneut zu bestätigenden Aktivierungs- und Abnahmeauftrag
vorbereiten. Fehlt ein notwendiger Nachweis, ist Variante A ein vollständiger
und erfolgreicher Gateabschluss.

## Verbindliche Arbeitsumgebung und Erhaltungsregeln

Es wird ausschließlich in folgenden Verzeichnissen gearbeitet:

- Repository:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris`;
- Frontend, nur zur Bestandsprüfung und bei Dokumentverweisen:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`;
- Unit-Tests, nur zur Bestandsprüfung:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests`;
- Integrationstests, nur zur Bestandsprüfung:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests`;
- autorisierte synthetische Testquelle, ausschließlich read-only:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx`.

Für sämtliche .NET-Befehle ist ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
zulässig. Das dokumentarische Gate benötigt regulär keinen .NET-Lauf.

Vor jeder Änderung sind Repositorywurzel, Branch, `HEAD`, Upstream,
Ahead/Behind, vollständiger Arbeitsbaum, Index, alle unversionierten Inhalte
und der vollständige Diff zu prüfen. Die 6b-/6c-Arbeit und diese Übergabe
können bereits committed und gepusht oder noch uncommittiert vorliegen. Alle
vorhandenen Änderungen bleiben erhalten. Es gibt keinen Reset, kein Staging
und keinen Commit.

`tmp/pagination-build` wird weder geöffnet noch verändert oder als
Arbeitsfläche verwendet. Vor und nach dem Gate werden nur seine
Verzeichnismetadaten verglichen. Die freigegebene synthetische DOCX-Quelle
unter `tmp/examples` darf bei Bedarf gelesen, aber niemals überschrieben
werden.

Es wird kein externes Arbeitsverzeichnis angelegt. Externe EDWALT-, Phase-,
Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzeln, EDWALT selbst, User
Secrets und `Cemaris_Dev` werden nicht geöffnet, ausgeführt oder verändert.
API, Frontend-Dev-Server, Browser und Datenbank werden nicht gestartet. Eine
SQL-Prüfung oder reale LibreOffice-/Ausgabeprüfung ist nur in einem späteren,
ausdrücklich autorisierten Auftrag mit einer separaten Testverbindung und
exakt benannter Pilotumgebung zulässig; andernfalls wird sie als nicht
ausgeführt dokumentiert.

## Verbindlicher Ausgangspunkt

Lies zuerst diese Übergabe vollständig. Ermittle danach den tatsächlichen
Git-Stand und lies mindestens vollständig:

1. Root-`README.md`, `SECURITY.md` und die fünf Dokumentationsindizes
   `docs/requirements/README.md`, `docs/architecture/README.md`,
   `docs/implementation/README.md`, `docs/migration/README.md` und
   `docs/decisions/README.md`;
2. den [6c-Abschluss](cemaris-increment-6c-completion.md), die
   [technische 6c-Übergabe](cemaris-increment-6c-next-step-handoff.md), die
   [6c-Entscheidungsakte](../requirements/notice-generation-decisions.md) und
   den
   [Gate-Abschluss](cemaris-notice-generation-decision-gate-completion.md);
3. [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md),
   [ADR-0019](../decisions/ADR-0019-ephemeral-secure-notice-document-generation.md),
   die [Dokumentarchitektur](../architecture/document-generation.md) und die
   [Sicherheits-/Rollenarchitektur](../architecture/authentication-authorization-audit.md);
4. die tatsächlichen 6c-Verträge für Benutzerkontakt, Satzungsversion,
   Dokumenterzeugung, Temp-/Prozesskapselung, Audit, Capability, Policy,
   API/OpenAPI, UI, Synthetic-/EF-Provider und additive Migration sowie die
   unmittelbar zugehörigen Unit-, Integrations- und Frontendtests;
5. die portablen Konfigurationsdefaults in `src/Cemaris.Api/appsettings.json`
   und `src/Cemaris.Api/appsettings.Development.json`.

Repositoryevidenz und der Abschlussnachweis dürfen nicht als Nachweis einer
konkreten Installation, Betriebsfreigabe oder real ausgeführten
Ausgabeabnahme umgedeutet werden.

## Interaktives Vorgehen und Evidenzregel

Schöpfe zuerst alle zulässigen Repositoryquellen aus. Erfrage danach nur die
tatsächlich fehlenden Angaben aus der Nachweismatrix in kleinen,
verständlichen Paketen. Fordere keine Secrets, Verbindungszeichenfolgen,
Kennwörter, personenbezogenen Daten, vertraulichen Dokumentinhalte oder
externen Dateien an.

Dokumentiere jede Antwort mit Datum, stabiler Quellen-ID, übermittelnder
Funktion, entscheidungsbefugter Funktion, konkretem Geltungsbereich,
Entscheidung, Nachweisstatus und Restunsicherheit. Eine pauschale Projekt- oder
IT-Freigabe ersetzt keine Fach-, Rechts-/Satzungs-, Finanz-, Datenschutz-,
Sicherheits- oder Betriebsfreigabe. Übermittelt der Auftraggeber Aussagen
mehrerer zuständiger Funktionen, muss dies je Nachweis ausdrücklich
festgehalten werden.

Verwende folgende Statuswerte:

- `BESTÄTIGT`: Aussage, zuständige Funktion, Geltungsbereich und belastbarer
  Nachweis tragen den gesamten Punkt;
- `TEILWEISE BESTÄTIGT`: ein Teil ist belegt, mindestens eine benötigte
  Entscheidung, Freigabe oder Abnahme fehlt;
- `OFFEN`: keine belastbare Entscheidung oder kein belastbarer Nachweis;
- `WIDERSPRUCH`: Aussagen oder Quellen widersprechen sich;
- `VERWORFEN`: der Punkt ist durch die zuständige Funktion nachvollziehbar
  ausgeschlossen.

## Unveränderte Schutzgrenze

Auch ein Pilot darf keine Rechtswirkung, Freigabe, Signatur, Zustellung,
Archivierung, Winyard-/DMS- oder FINANZ+-Integration, Empfängeranrede,
automatische Gebühren-, Fälligkeits- oder Rechtsberechnung,
Altbestandsmigration oder allgemeine Produktivaktivierung einführen. DOCX und
PDF bleiben flüchtige Vorschläge; Prüfung und jede weitere Verwendung liegen
außerhalb von Cemaris.

## Vor dem Gate bereitzustellende Nachweise

| Bereich | Erforderlicher Nachweis | Verantwortliche Freigabe |
| --- | --- | --- |
| Pilotziel | exakt benannte isolierte Umgebung, Datenklasse, Nutzerkreis, Dauer, Abbruch- und Rückfallweg | Projekt- und Betriebsverantwortung |
| Daten | ausschließlich freigegebene synthetische Fall-, Personen-, Kontakt-, Satzungs- und Vorlagendaten | Datenschutz und Fachverantwortung |
| Datenbank | eigene autorisierte Pilot-/Testdatenbank, Backup-/Restore-Nachweis und additive Migration; keine stillschweigende Nutzung von `Cemaris_Dev` | Datenbankbetrieb |
| Serverpfade | kanonischer Content-Root, read-only Vorlagenstamm, konkrete DOCX-Datei und separater kontrollierter Tempstamm mit geringsten Rechten | Betrieb und Informationssicherheit |
| Vorlage | exakt 23 unterstützte Tokens je einmal, keine Anrede, Makros, externen Beziehungen oder Einbettungen; dokumentierte kommunale Inhalts-, Rechts- und Aktualitätsverantwortung außerhalb von Cemaris | Fach-, Rechts- und Vorlagenverantwortung |
| LibreOffice | installierte Quelle, Version, Patchstand, Lizenz-/Wartungsweg, absoluter Programmpfad, Dienstkonto, Schriften und Ressourcenlimits | Betrieb und Informationssicherheit |
| Ausgabequalität | DOCX öffnet ohne Reparatur; PDF ist DIN A4, unverschlüsselt, druckbar und textselektierbar; visueller Vergleich und lokaler Drucktest mit rein synthetischen Daten | Fachverantwortung und Betrieb |
| Temp-Schutz | ACLs, Datenträgerverschlüsselung, Quota, Bereinigung nach Erfolg/Fehler/Abbruch/Neustart und kontrollierter Test verwaister Verzeichnisse | Betrieb und Datenschutz |
| Überwachung | technische Verfügbarkeit, Timeout-/Konvertierungsfehler, Kapazität und Alarmierung ohne Dokumentinhalt, Pfade oder Prozessausgaben | Betrieb und Informationssicherheit |
| Audit | Zugriff, Integrität, Aufbewahrung und Löschung nach der kommunalen Fall-/Auditregel; weiterhin keine öffentliche Audit-API | Datenschutz, Fach- und Rechtsverantwortung |
| Sicherheit | aktuelle Abhängigkeits-, Vorlagen-, Prozess-, Rechte-, CSRF-, ETag-, Rate-Limit- und Logging-Prüfung | Informationssicherheit |
| Rückfall | getestete Deaktivierung ausschließlich über das Featureflag, Bereinigung offener Temp-Läufe und Kommunikation an Pilotnutzer | Betrieb und Projektverantwortung |

## Verbindliche Pilotabnahme

Die spätere Abnahme verwendet eine neue versionierte synthetische
Datenzusammenstellung und die konkret zur Pilotierung vorgesehene kommunale
Vorlage. In diesem Gate werden ausschließlich bereits autorisierte und
belastbar dokumentierte Abnahmen bewertet; die folgenden Schritte werden
nicht selbst ausgeführt. Mindestens nachzuweisen sind:

1. vollständiges eigenes synthetisches Kontaktprofil und manuelle Auswahl
   genau einer synthetischen, fachlich als tatsächlich markierten Beisetzung,
   einer aktiven Satzungsversion und eines Formats;
2. DOCX- und PDF-Erfolg einschließlich Attachmentname, MIME- und No-Store-
   Headern sowie sichtbarer Kennzeichnung der Rechtswirkungslosigkeit;
3. Word-/LibreOffice-Öffnung ohne Reparatur, PDF-DIN-A4, Textselektion und
   lokaler Ausdruck;
4. kontrollierte Fehler für veralteten ETag, fehlende kanonische Daten,
   fremde Beisetzung, inaktive Satzung, verworfenen Entwurf, unvollständigen
   Kontakt, ungültige Vorlage, Timeout und fehlgeschlagene Konvertierung;
5. keine Datei- oder Inhaltsablage, vollständige Temp-Bereinigung und nur die
   freigegebene inhaltsfreie Audit-Whitelist;
6. Deaktivierung und Wiederanlauf mit weiterhin ausgeschalteter Capability.

Screenshots und Prüfdateien dürfen nur synthetische Werte enthalten und
werden ausschließlich in einem vorab autorisierten Ablageort mit Löschfrist
geführt; sie gehören nicht automatisch in das Repository.

## Entscheidung

Das Gate endet mit einer namentlich verantworteten Entscheidung:

- **Variante A – Stop:** mindestens ein Pflichtnachweis fehlt; Capability
  bleibt deaktiviert. Fehlende Nachweise und zuständige Funktionen werden
  gebündelt dokumentiert; es entsteht kein Aktivierungsauftrag.
- **Variante B – begrenzter synthetischer Pilot entscheidungsreif:** alle
  Nachweise und Abnahmen sind erfüllt; Umgebung, Zeitraum, Nutzer,
  Konfiguration und Rückfallweg sind exakt protokolliert. Erst dann darf eine
  separate, kontextlos ausführbare Aktivierungs- und Abnahmeübergabe erstellt
  werden. Auch bei Variante B bleibt die Capability in diesem Gate
  deaktiviert.

Variante B ist keine Produktivfreigabe und keine Erlaubnis für echte
Verwaltungsdaten. Jede Erweiterung des Datenkreises, der Vorlage, der
Dokumentart, des Prozesses oder der Integration benötigt ein neues Gate.

## Verbindliche Dokumentationsergebnisse

Erstelle in jedem Fall:

1. `docs/requirements/notice-generation-pilot-release-decisions.md` mit
   Quellenmatrix, vollständiger Nachweismatrix, übermittelten Funktionen,
   Geltungsbereichen, Status, Restunsicherheiten und Variantenentscheidung;
2. `docs/implementation/cemaris-notice-generation-pilot-release-gate-completion.md`
   mit Ausgangsstand, Quellenarbeit, Dialogverlauf, Entscheidung,
   Schutzgrenzen, nicht ausgeführten Prüfungen und finalem Git-Nachweis;
3. einen sichtbaren Ausführungsstatus in dieser Übergabe;
4. konsistente Aktualisierungen von Root-README und allen fünf
   Dokumentationsindizes sowie nur der unmittelbar betroffenen Anforderungs-,
   Architektur-, Sicherheits-, Betriebs- und Migrationsgrenzen.

Nur bei vollständig belegter Variante B darf zusätzlich
`docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md`
als separater, kontextlos ausführbarer technischer Aktivierungs- und
Abnahmeauftrag entstehen. Er muss die exakt autorisierte Umgebung,
synthetische Datenklasse, Konfigurationsquelle ohne Secretwerte, Pfade,
LibreOffice-Version, Dienstkontogrenzen, Abnahmeschritte, Monitoring,
Bereinigung, Rückfall und Stop-Gates enthalten. Er wird in diesem Gate nicht
ausgeführt. Bei Variante A darf dieser Auftrag nicht erstellt oder erfunden
werden.

ADR-0019 wird nicht rückwirkend geändert. Ein neues ADR ist nur zulässig,
wenn das Gate eine tatsächlich neue, vollständig entschiedene und
repositoryweit relevante Architekturentscheidung trifft.

## Abschlussprüfungen des dokumentarischen Gates

Vor Abschluss sind mindestens auszuführen und ohne Ausgabe sensibler Werte zu
dokumentieren:

1. `git diff --check`;
2. lokale Markdown-Links und -Anker, Tabellen, Codeblöcke und Whitespace;
3. repositorybasierte Secret-, Verwaltungsdaten- und Fremdbestandsprüfung
   ohne Zugriff auf User Secrets und ohne Ausgabe gefundener Werte;
4. vollständige finale Git-Prüfung einschließlich Index und aller
   unversionierten Inhalte;
5. Metadatenvergleich von `tmp/pagination-build`;
6. Bestätigung, dass nur zulässige Repositorydokumente verändert wurden;
7. Bestätigung, dass die synthetische Testquelle nicht überschrieben wurde;
8. Bestätigung, dass externe Arbeitswurzeln, EDWALT, `Cemaris_Dev`, User
   Secrets, API, Frontend-Dev-Server, Browser und Datenbank unberührt blieben;
9. Bestätigung, dass nichts gestagt und kein Commit erstellt wurde.

Die im [6c-Abschluss](cemaris-increment-6c-completion.md) dokumentierten
Builds und Tests werden nicht als Pilotabnahme ausgegeben. Bleibt der
Arbeitsumfang rein dokumentarisch und ist der 6c-Code unverändert, müssen sie
nicht wiederholt werden. Ändert sich wider Erwarten Produktcode, ist das Gate
zu stoppen, weil dies seinen freigegebenen Umfang überschreitet.

## Stop-Bedingungen

Das Gate stoppt ohne Aktivierung bei fehlender Zuständigkeit, ungeklärter
Vorlagen- oder Rechtsfreigabe, fehlender separater Datenbankautorisation,
unbekannter LibreOffice-Herkunft oder -Version, fehlenden Schriften,
unzureichenden Dateirechten, nicht reproduzierbarer Ausgabequalität,
inhaltshaltigen Logs/Audits, verbleibenden Temp-Dateien oder einer Forderung
nach Rechtswirkung, Zustellung, Archivierung, Integration oder echten Daten.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-notice-generation-pilot-release-gate-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe ausschließlich das dort definierte
dokumentarische und interaktive Betriebs- und Pilotfreigabegate für den
bereits implementierten, rechtlich wirkungslosen 6c-Beisetzungsgebührenentwurf
vollständig aus. Aktiviere in diesem Chat keine Capability und ändere weder
Produktcode noch Schema, Migration, Konfiguration, Vorlage, API oder UI.

Untersuche vor jeder Änderung den vollständigen tatsächlichen Git-Stand und
erhalte sämtliche vorhandene Arbeit. Die 6b-/6c-Arbeit und diese Übergabe
können committed, gepusht oder noch uncommittiert vorliegen. Führe keinen
Reset durch, stage nichts, erstelle keinen Commit und verändere
tmp/pagination-build nicht. Öffne dort keine Inhalte; vergleiche nur die
Verzeichnismetadaten vor und nach der Arbeit.

Verbindliche Arbeitsverzeichnisse:

Repository:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Frontend, nur zur Bestandsprüfung:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web

Unit-Tests, nur zur Bestandsprüfung:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests

Integrationstests, nur zur Bestandsprüfung:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests

Autorisierte synthetische Testquelle, ausschließlich lesen und nicht
überschreiben:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tmp\examples\Cemaris-Testvorlage-Beisetzungsgebuehren.docx

Falls ein .NET-Befehl wirklich erforderlich ist, verwende ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus, lies keine User Secrets und greife nicht auf Cemaris_Dev zu.
Starte weder API noch Frontend-Dev-Server, Browser oder Datenbank. SQL- oder
reale LibreOffice-/Ausgabetests sind nur in einem späteren, ausdrücklich
autorisierten Auftrag mit separater Testverbindung und exakt benannter
Pilotumgebung zulässig; dokumentiere sie hier als nicht ausgeführt.

Schöpfe zuerst alle in der Übergabe benannten Repositoryquellen und die
tatsächlichen 6c-Verträge aus. Frage anschließend die tatsächlich fehlenden
Betriebs- und Freigabenachweise in kleinen verständlichen Paketen ab.
Dokumentiere jede Antwort mit Datum, stabiler Quellen-ID, übermittelnder und
entscheidungsbefugter Funktion, Geltungsbereich, Entscheidung,
Nachweisstatus und Restunsicherheit. Fordere keine Secrets,
Verbindungszeichenfolgen, personenbezogenen Daten, vertraulichen Inhalte oder
externen Dateien an. Pauschale Projekt- oder IT-Freigaben ersetzen keine
Fach-, Rechts-/Satzungs-, Finanz-, Datenschutz-, Sicherheits- oder
Betriebsfreigabe.

Wähle Variante A, sobald ein notwendiger Nachweis fehlt, teilweise bestätigt
oder widersprüchlich ist. Das ist ein vollständiger Gateabschluss; die
Capability bleibt aus und es entsteht kein Aktivierungsauftrag. Nur wenn
sämtliche Nachweise für genau eine benannte isolierte Umgebung vollständig
belegt sind, darfst du Variante B wählen und die separate Übergabe
docs/implementation/cemaris-notice-generation-synthetic-pilot-activation-next-step-handoff.md
vorbereiten. Führe sie in diesem Chat nicht aus und aktiviere nichts.

Arbeite bis zum vollständigen nachgewiesenen Abschluss einschließlich
Quellen- und Nachweismatrix, Variantenentscheidung, Abschlussdokumentation,
Aktualisierung von Root-README und allen fünf Dokumentationsindizes sowie
sämtlicher in der Übergabe verlangter Markdown-, Secret-, Fremdbestands-,
tmp- und Git-Prüfungen. Erfinde keine Fach-, Rechts-, Vorlagen-, Betriebs-,
Zustellungs-, Aufbewahrungs-, Integrations- oder Migrationsregel.
```
