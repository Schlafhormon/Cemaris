# Folgegate: Entscheidungen vor einer späteren Bescheiderzeugung

Stand: 26.08.2026

Status: **Vorbereitet, noch nicht ausgeführt.** Dies ist das ausschließlich
dokumentarische Inkrement `6c-Gate`, nicht die technische Bescheiderzeugung.

## Auftrag und Ergebnisgrenze

Dieses Dokument ist ein kontextlos ausführbarer Auftrag für ein späteres,
ausschließlich dokumentarisches Entscheidungs- und Freigabegate. Es folgt auf
den technisch abgeschlossenen
[manuellen 6b-Entwurfskern](cemaris-increment-6b-completion.md), erteilt aber
noch keinen Auftrag zur Bescheiderzeugung.

Das Gate darf nur belastbar feststellen, ob überhaupt ein kleinster sicherer
Erzeugungskandidat vollständig entschieden und funktionsbezogen freigegeben
ist. Es implementiert und entwirft keine Vorlage, keine Rechtswirkung, keine
Zustellung, keine Korrektur erzeugter Bescheide, keine Aufbewahrung und keine
Integration. Fehlt auch nur eine für einen Kandidaten zwingende Entscheidung,
ist „keine Implementierung“ der vollständige Abschluss.

## Verbindliche Arbeitsumgebung und Schutzgrenzen

Es wird ausschließlich im Repository
`C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris` gearbeitet. Die für
eine mögliche spätere technische Übergabe zu benennenden Verzeichnisse sind:

- Frontend:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web`;
- Unit-Tests:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests`;
- Integrationstests:
  `C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests`.

Falls im Gate ausnahmsweise ein .NET-Lesebefehl nötig ist, darf ausschließlich
`C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe`
verwendet werden. Das Gate selbst benötigt keinen Build, keine Migration und
keinen Laufzeitstart.

Vor jeder Änderung sind Branch, `HEAD`, Upstream, Ahead/Behind, vollständiger
Arbeitsbaum, Index und alle unversionierten Inhalte zu prüfen. Die 6b-Arbeit
kann im neuen Chat bereits committed und gepusht oder noch uncommittiert
vorliegen und ist vollständig zu erhalten. Es gibt keinen Reset, kein Staging
und keinen Commit. `tmp/pagination-build` wird nur vor und nach der Arbeit über
Metadaten verglichen; seine Inhalte werden nicht geöffnet und der Bestand wird
nicht verändert.

Nicht geöffnet, ausgeführt oder verändert werden externe EDWALT-, Phase-,
Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzeln, EDWALT selbst, User
Secrets und `Cemaris_Dev`. API, Frontend-Dev-Server, Browser und Datenbank
werden nicht gestartet. Echte Verwaltungsdaten, lokale Vorlagen oder
Secretwerte dürfen weder angefordert noch dokumentiert werden. Soweit eine
allgemeine Rechtsaussage zwingend überprüft werden muss, sind ausschließlich
aktuelle amtliche öffentliche Primärquellen zulässig; sie ersetzen niemals
die benötigte örtliche Rechts-/Satzungsfreigabe.

## Verbindlicher Ausgangspunkt

Vor jeder Arbeit sind der tatsächliche Git-Stand und anschließend vollständig
zu lesen:

1. Root-README, `SECURITY.md` und alle fünf Dokumentationsindizes;
2. [6b-Abschluss](cemaris-increment-6b-completion.md),
   [6F-Entscheidungsakte](../requirements/manual-notice-financial-facts-decisions.md)
   und [ADR-0018](../decisions/ADR-0018-canonical-manual-notice-drafts.md);
3. [Gebühren-/Bescheid-/Dokumententscheidungen](../requirements/fee-notice-document-decisions.md),
   [Dokumentarchitektur](../architecture/document-generation.md),
   [Sicherheits- und Rollenarchitektur](../architecture/authentication-authorization-audit.md)
   sowie [Winyard-Grenze](../architecture/winyard-integration.md);
4. die tatsächlichen 6b-Verträge in Domain, Application, Persistenz, API,
   OpenAPI und UI, ohne sie zu verändern.

`NoticeDraft` bleibt ein rechtlich wirkungsloser manueller Arbeitsstand.
`ReadNotices` und `ReadFeeItems` bleiben getrennte Altprojektionen. Aus keinem
dieser Verträge darf eine Erzeugungs-, Rechts-, Zustellungs- oder
Aufbewahrungsregel abgeleitet werden.

## Interaktives Vorgehen und Evidenzregel

Das Gate arbeitet die Pakete NG-01 bis NG-10 in kleinen, verständlichen
Fragegruppen mit dem Auftraggeber durch. Vorhandene Repositoryevidenz wird
zuerst ausgeschöpft. Danach werden nur tatsächlich fehlende Entscheidungen
erfragt. Eine pauschale Erklärung wie „alles freigegeben“ genügt nicht.

Für jede neue Antwort sind mindestens eine stabile Quellen-ID, die
übermittelnde Funktion, die entscheidungsbefugten Funktionen, konkreter
Geltungsbereich, Entscheidung, Freigabestatus und Restunsicherheit zu
dokumentieren. Wenn der Auftraggeber Entscheidungen mehrerer Funktionen
verbindlich übermittelt, muss dies ausdrücklich und paketbezogen festgehalten
werden. Projektpräferenz, technische Machbarkeit, Altverfahrensbefund und
amtliche allgemeine Rechtsquelle werden als unterschiedliche Evidenzarten
behandelt.

Es dürfen keine personenbezogenen Inhalte, Vorlagendateien oder vertraulichen
Verwaltungswerte in den Chat oder das Repository übernommen werden. Für eine
spätere Variante B genügt eine Vorlage nur, wenn eine repräsentative,
rechtmäßig bereitgestellte und repositorygeeignete synthetische beziehungsweise
vollständig anonymisierte Testquelle samt Verantwortung und Freigabe belegt
ist. Andernfalls bleibt NG-04 offen.

## Zu entscheidende Gate-Pakete

Für einen eng benannten Erzeugungskandidaten müssen zuständige Funktionen je
Paket Quelle, Geltungsbereich, Entscheidung, Freigabe und Restunsicherheit
bestätigen:

| Gate-ID | Paket | Mindestentscheidung | Stop-Bedingung |
| --- | --- | --- | --- |
| NG-01 | Zweck und Dokumentart | genau ein erster fachlicher Nutzen und genau eine Dokumentart | mehrere oder unklare Zwecke |
| NG-02 | Rechtszustand | Verhältnis von Arbeitsentwurf, erzeugtem Ergebnis und etwaiger Rechtswirkung | Wirkung oder zulässige Zustände unklar |
| NG-03 | Datenvertrag | freigegebene Felder, Pflichtangaben und Herkunft je Feld | Ableitung aus Altprojektion oder nicht freigegebenen Daten |
| NG-04 | Vorlage | Verantwortung, Versionierung, Freigabe und repräsentative rechtmäßige Testquelle | konkrete Vorlage oder Freigabe fehlt |
| NG-05 | Ausgabe | benötigte Formate, Barrierefreiheit und Qualitätsabnahme | Format oder Abnahmekriterium offen |
| NG-06 | Rollen und Nachweis | Erzeugungsoperation, Funktionstrennung, ETag, Fachrevision und sparsamer Audit | Rechte werden aus `NoticeDrafts` abgeleitet |
| NG-07 | Zustellung und Korrekturgrenze | ausdrückliche Abgrenzung zu Bekanntgabe, Versand, Neuerzeugung und Korrektur | eine dieser Wirkungen wird still vorausgesetzt |
| NG-08 | Datenschutz und Aufbewahrung | temporäre Verarbeitung, Löschung, Zugriff, Aufbewahrung und echte Testdaten | Verantwortlichkeit oder Frist fehlt |
| NG-09 | Integration und Betrieb | führendes System, DMS-/FINANZ+-Grenze, Fehler, Wiederholung, Monitoring und Recovery | stiller Rückkanal oder ungeklärter Betrieb |
| NG-10 | Produktiv- und Migrationsgrenze | Umgebungen, Abnahme, Altbestände und explizite Nicht-Migration | EDWALT-/Read-Backfill oder Produktivfreigabe unbelegt |

Benötigt werden mindestens fachlich verantwortliche Friedhofsverwaltung,
Rechts-/Satzungsprüfung, Datenschutz, Informationssicherheit und Betrieb;
Finanz-/Haushaltsverantwortung ist einzubeziehen, sobald Inhalt oder Wirkung
finanzielle Tatsachen berührt. Projektpräferenzen allein ersetzen keine dieser
funktionsbezogenen Freigaben.

## Zulässige Variantenentscheidung

- **Variante A – keine Implementierung:** mindestens ein unabtrennbares Paket
  ist offen, widersprüchlich oder nicht zuständig freigegeben. Offene Punkte
  und benötigte Funktionen werden dokumentiert; Produktcode bleibt
  unverändert.
- **Variante B – kleinster Erzeugungskandidat entscheidungsreif:** genau ein
  Kandidat ist in allen Paketen quellenbelegt entschieden. Das Gate darf dann
  ausschließlich eine weitere, separat prüfbare technische Übergabe
  vorbereiten. Diese darf erst nach erneuter Bestätigung ausgeführt werden.
- Ein breiter Dokument-, Versand-, Festsetzungs-, Korrektur-, DMS-, FINANZ+-
  oder Migrationsumfang ist keine zulässige Gate-Abkürzung.

## Verbotene Vorwegnahmen

Im Gate selbst sind insbesondere verboten:

- Produktcode, Schema, Migration, API, UI, Vorlage, Renderer oder PoC;
- Nutzung echter Verwaltungsdaten oder externer Vorlagenbestände;
- Wahl von DOCX/PDF/PDF-A, Bibliothek oder DMS-Verhalten ohne Entscheidung;
- Festsetzung, Freigabe, Signatur, Druck, Versand, Bekanntgabe oder
  Rechtsbehelfsbelehrung;
- Korrektur, Aufhebung, Storno oder Wiederholung erzeugter Bescheide;
- Aufbewahrungs-, Lösch-, Nummern- oder Integrationsdefaults;
- Rückinterpretation oder Migration von `ReadNotices`, `ReadFeeItems` oder
  EDWALT-Beständen.

## Dokumentarische Ergebnisse

Das Gate erstellt mindestens:

1. `docs/requirements/notice-generation-decisions.md` als eigene
   Entscheidungsakte mit Quellen-, Evidenz-, NG-01-bis-NG-10- und
   Freigabematrix;
2. `docs/implementation/cemaris-notice-generation-decision-gate-completion.md`
   mit Ausgangsstand, Dialogverlauf, ausgewählter Variante, offenen Punkten,
   Schutzgrenzen und finalem Git-Nachweis;
3. aktualisierte Root-README, alle fünf Dokumentationsindizes und nur die
   unmittelbar betroffenen Anforderungs-, Architektur-, Sicherheits-,
   Dokument- und Migrationsgrenzen;
4. eine sichtbare Ausführungsmarkierung in dieser Übergabe.

ADR-0018 wird nicht rückwirkend geändert. Ein neues ADR ist nur bei einer
tatsächlich neuen, vollständig entschiedenen Architekturentscheidung zulässig.
Ein technischer Folgeauftrag ist ausschließlich bei Variante B erlaubt. Er
heißt dann `docs/implementation/cemaris-increment-6c-next-step-handoff.md`,
grenzt genau einen kleinsten Erzeugungskandidaten ab, enthält vollständige
Arbeitsverzeichnisse, Verträge, Tests, Sicherheitsgrenzen und Abschlusschecks
und ist selbst noch keine Implementierungsfreigabe. Bei Variante A wird kein
technischer Folgeauftrag erstellt oder erfunden.

## Abschlussprüfungen des Gates

Vor Abschluss sind mindestens auszuführen und ohne Wertausgabe zu
dokumentieren:

1. `git diff --check`;
2. lokale Markdown-Links und -Anker, Tabellen, Codeblöcke und Whitespace;
3. repositorybasierte Secret- und Verwaltungsdatenprüfung ohne User Secrets;
4. vollständige finale Git-Prüfung einschließlich aller unversionierten
   Inhalte und leerem Index;
5. Metadatenvergleich von `tmp/pagination-build`;
6. Nachweis, dass ausschließlich zulässige Dokumentdateien geändert wurden;
7. Bestätigung, dass externe Arbeitswurzeln, EDWALT, `Cemaris_Dev`, User
   Secrets, API, Frontend-Dev-Server, Browser und Datenbank unberührt blieben;
8. Bestätigung, dass nichts gestagt und kein Commit erstellt wurde.

Eine nicht entscheidungsreife Variante A ist ein erfolgreicher Gateabschluss,
kein Fehler. Das Gate darf erst Variante B wählen, wenn alle zehn Pakete für
genau einen Kandidaten quellenbelegt und funktionsbezogen bestätigt sind.

## Direkt kopierbarer Prompt

```text
Du arbeitest ausschließlich im Repository:

C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Antworte und dokumentiere auf Deutsch.

Lies zuerst vollständig:

docs/implementation/cemaris-notice-generation-decision-gate-next-step-handoff.md

Diese Übergabe ist verbindlich. Führe das dort definierte ausschließlich
dokumentarische 6c-Entscheidungs- und Freigabegate vor einer möglichen
späteren Bescheiderzeugung vollständig aus. Implementiere in diesem Chat
keinen Produktcode, kein Schema, keine Migration, API, UI, Vorlage, Engine
oder Integration.

Verbindliche Arbeitsverzeichnisse:

Repository:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris

Frontend, nur zur Bestandsprüfung:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\src\Cemaris.Web

Testprojekte, nur zur Bestandsprüfung:
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.UnitTests
C:\Users\Benke\Documents\Friedhofsverwaltung\Cemaris\tests\Cemaris.IntegrationTests

Falls ein .NET-Lesebefehl wirklich nötig ist, verwende ausschließlich:

C:\Users\Benke\AppData\Local\Cemaris\dotnet-10.0.302-complete\dotnet.exe

Untersuche vor jeder Änderung den vollständigen tatsächlichen Git-Stand und
erhalte sämtliche vorhandene Arbeit. Die 6b-Änderungen und Dokumente können
committed, gepusht oder noch uncommittiert vorliegen. Führe keinen Reset
durch, stage nichts, erstelle keinen Commit und verändere
tmp/pagination-build nicht.

Lege kein externes Arbeitsverzeichnis an. Öffne oder verändere keine externe
EDWALT-, Phase-, Satzungs-, Vorlagen-, DMS- oder sonstige Arbeitswurzel. Führe
EDWALT nicht aus, lies keine User Secrets und greife nicht auf Cemaris_Dev zu.
Starte weder API noch Frontend-Dev-Server noch Browser oder Datenbank.

Schöpfe zuerst alle versionierten Repositoryquellen und die tatsächlichen
6b-Verträge aus. Arbeite danach NG-01 bis NG-10 interaktiv in kleinen
Fragegruppen ab. Verlange paketbezogene Entscheidungen mit Quelle,
übermittelnder und entscheidungsbefugter Funktion, Geltungsbereich,
Freigabestatus und Restunsicherheit. Pauschale Projektfreigaben ersetzen
keine Fach-, Rechts-/Satzungs-, Finanz-, Datenschutz-, Sicherheits- oder
Betriebsfreigabe. Erfrage und übernimm keine echten Verwaltungsdaten,
vertraulichen Vorlagen oder Secrets.

Wähle Variante A, sobald für den kleinsten Kandidaten ein unabtrennbares
Paket offen, widersprüchlich oder nicht zuständig freigegeben bleibt. Nur
wenn genau ein Kandidat in allen zehn Paketen quellenbelegt bestätigt ist,
darfst du Variante B wählen und eine separate technische 6c-Übergabe
vorbereiten. Auch bei Variante B wird in diesem Chat nichts technisch
implementiert.

Arbeite bis zum nachgewiesenen Abschluss einschließlich Entscheidungsakte,
Freigabematrix, Abschlussdokumentation, Aktualisierung aller fünf
Dokumentationsindizes und der unmittelbar betroffenen Dokumente sowie aller
in der Übergabe verlangten Markdown-, Secret-, Fremdbestands-, tmp- und
Git-Prüfungen. Erfinde keine Fach-, Rechts-, Vorlagen-, Zustellungs-,
Aufbewahrungs-, Korrektur-, Integrations- oder Migrationsregel.
```
