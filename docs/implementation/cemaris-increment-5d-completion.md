# Abschluss Inkrement 5d: Bedienkorrekturen am manuellen 5b-Kern

Stand: 18.08.2026

## Ergebnis

Inkrement 5d ist als begrenztes technisches Bedieninkrement umgesetzt. Der
vorhandene manuelle Beteiligten-/Nutzungsrechtskern wurde weder fachlich noch
persistenzseitig erweitert. Umgesetzt sind:

1. ein fallunabhängiger Beteiligteneinstieg für beide bestätigten Rollen;
2. containergeeignet responsive Rechteaktionen;
3. direkte Feldfehler mit Eingabeerhalt und nachvollziehbarem Fokus;
4. eine eindeutige Erklärung der getrennten nullable Altprojektion.

Domainregeln, Application-Ports, Persistenzentitäten, EF-Modelle,
Migrationen, API-/OpenAPI-Verträge und Backenddateien blieben unverändert.
5d bestätigt keine neue Fachregel und ist keine fachliche
Verwaltungsabnahme, Rechtsprüfung, Datenschutzfreigabe, Betriebsfreigabe oder
Produktivfreigabe.

## Verbindlicher Ausgangsstand

Die Arbeit begann auf `main` bei
`9c728d7e0cd6a55faf4adb804831d28f36d3ac42`, synchron zu `origin/main` mit
Ahead/Behind `0/0` und leerem Index. Die sieben geänderten und zwei
unversionierten 5c-Dokumente wurden als verbindlicher Eingang vollständig
erhalten. Es wurde weder zurückgesetzt noch gestaged oder committed.

Der vorbestehende ignorierte Bestand unter `tmp/pagination-build` umfasste vor
und nach 5d 890 Dateien. Er wurde nicht verändert oder als 5d-Arbeit
ausgegeben.

## Technische Baseline

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests | 32 bestanden |
| reguläre Integrationstests mit `Category!=SqlServer` | 48 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| Frontendtests vor 5d | 14 bestanden in 4 Testdateien |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |

Die ausschließlich synthetische manuelle Datenbank
`Cemaris_IntegrationTests_Manual5b_20260814113755_bdd84cd3` wurde über
`sys.databases` unter genau diesem Namen aufgelöst. Solange sie vorhanden war,
wurde keine reale SQL-Suite gestartet und kein neuer realer SQL-Nachweis
behauptet.

## Geänderte React-Komponenten

### Route und fallunabhängige Beteiligtenpflege

- `App.tsx` kennt die Route `/parties` und zeigt bei deaktivierter Capability
  einen klaren Nicht-verfügbar-Zustand.
- `AppLayout.tsx` ergänzt `Beteiligte` in der Stammdatennavigation nur bei
  aktiver `PersonUsageRightsEditingEnabled`-Capability.
- `PartiesPage.tsx` stellt Suche, Detail und Pflege ohne erfundenen Fallbezug
  für Sachbearbeitung und Administration bereit.
- `PartyManagement.tsx` enthält die gemeinsam verwendete Suche,
  Detailanzeige, Anlage natürlicher Personen und Organisationen,
  Dublettenabbruch/-bestätigung, Namenskorrektur, Adressanlage und
  Adresskorrektur.
- `PersonUsageRightsPanel.tsx` verwendet dieselben Party-Komponenten weiter;
  die Auswahl für ein konkretes Recht bleibt in der Fall-/Grabstellendetailseite.
- `partyDisplayName.ts` vereinheitlicht die sichtbare Namensbildung.

Es werden ausschließlich `searchParties`, `getParty`, `createParty`,
`correctParty`, `addPartyAddress` und `correctPartyAddress` verwendet. Eine
neue serverseitige Suche, Pagination oder Mutation wurde nicht ergänzt.

### Fehler, Fokus und Konfliktziel

- `useFormFeedback.tsx` ordnet Serverfelder zentral und
  fallunabhängig den sichtbaren Formularfeldern zu.
- `FormErrorSummary.tsx` erhält den allgemeinen Problemtitel und zeigt
  unbekannte Serverfelder weiterhin nachvollziehbar an.
- Fehler für `validFromInclusive`, `newEndDate`, `reason`, `startDate`,
  `endDate`, `sourceReference` und `reference` werden einem konkreten Feld
  oder eindeutig der Formularzusammenfassung zugeordnet.
- Eingaben bleiben bei Validierungs- und ETag-Fehlern erhalten. Der Fokus
  wechselt auf das erste fehlerhafte Feld oder ersatzweise die Zusammenfassung.
- Party- und Rechtekonflikte besitzen getrennte Ziele. `Aktuellen Stand neu
  laden` lädt entweder die ausgewählte Party über `getParty` oder das
  betroffene Recht über `getUsageRightByGraveSite`, niemals beide Aggregate.

### Responsive Rechteaktionen und Altprojektion

- Übertragung, Verlängerung und Faktenkorrektur sind einzelne Disclosure-
  Blöcke statt drei gleichzeitig geöffneter äußerer Spalten.
- `App.css` verwendet flexible Mindestbreiten, `min-width: 0`, umbruchfähige
  Beschriftungen und einen Container-Breakpoint bei 40 rem. Bei schmalem
  Container wird früh einspaltig umgebrochen.
- Die Tastatur- und DOM-Reihenfolge entspricht der sichtbaren Reihenfolge.
- `CaseDetailsPage.tsx` erklärt sowohl allgemein als auch im Leerzustand,
  dass ausschließlich die vorläufige nullable Altprojektion leer ist und ein
  kanonisches Recht separat darüber angezeigt werden kann.

Beide Datenbereiche bleiben technisch und fachlich getrennt. Es wurden weder
Daten zusammengeführt noch JSON-Felder umgedeutet.

## Rückverfolgbarkeit zu den 5c-Befunden

| Befund | Umsetzung | Nachweis | Ergebnis |
| --- | --- | --- | --- |
| `5C-F-01` – kein fallunabhängiger Einstieg | `/parties`, Capability-Route, Navigation und gemeinsame Party-Komponenten | `App.test.tsx`, `PartiesPage.test.tsx` | behoben |
| `5C-F-02` – zu enge Rechteaktionen | einspaltige Disclosure-Anordnung, flexible Raster und Container-Breakpoint | `PersonUsageRightsResponsive.test.tsx`, CSS-Strukturprüfung, Bedienvorführung | behoben |
| `5C-F-03` – missverständlicher Altprojektionsleerzustand | Geltungsbereich und getrennte kanonische Anzeige ausdrücklich benannt | `CaseDetailsPage.test.tsx` | behoben |
| `5C-F-04` – Serverfeldfehler nur allgemein sichtbar | zentrale Feldzuordnung, Zusammenfassung, Fokus und Eingabeerhalt | `PersonUsageRightsPanel.test.tsx`, `PartiesPage.test.tsx` | behoben |

## Ergänzte und geänderte Frontendtests

Nach der Implementierung bestehen 25 Frontendtests in 7 Testdateien. Neu
beziehungsweise erweitert geprüft werden:

- Route, Navigation und Direktaufruf von `/parties` bei aktiver und
  deaktivierter Capability;
- Zugriff für Sachbearbeitung und Administration;
- fallunabhängige Suche, Detailanzeige und Anlage;
- natürliche Person und Organisation;
- Dublettenabbruch mit Eingabeerhalt und bestätigte Wiederholung;
- Namenskorrektur, Adressanlage und Adresskorrektur mit fortgeschriebenen
  ETags `"1"`, `"2"` und `"3"`;
- direkte Feldfehler, unbekannte Serverfelder, Eingabeerhalt und Fokus;
- getrennte Neuladung bei Party- und Rechte-ETag-Konflikten;
- strukturell responsive einzelne Rechteaktionsformulare;
- eindeutiger Altprojektionswortlaut bei sichtbarem kanonischem Recht;
- bestehende Suche, Falldetail, Navigation und Suchpagination als Regression.

Es wurden keine pixelgenauen Snapshots als Responsivitätsnachweis verwendet.

## Manuelle Vorführung

API und Frontend liefen kontrolliert mit Synthetic-Provider und allen vier
Development-Capabilities. Health, Frontend-Proxy und Systeminformation waren
erreichbar. Beide synthetischen Rollen konnten über den Frontend-Proxy
erfolgreich authentifiziert werden. Zugangsdaten und Verbindungswert wurden
nicht in Repository-Dateien oder Testartefakte geschrieben.

Die Rückmeldung der Projektverantwortung lautete nach dem erläuterten
kanonischen Grabstellen-/Nutzungsrechtsweg: `Dann klappt erstmal alles.` Diese
Rückmeldung bestätigt den konkret geführten Bedienweg, ersetzt aber keine
einzeln protokollierte Ausführung aller zwölf vorgeschlagenen Szenarien und
keine der weiterhin offenen Freigaben.

### Beobachtungsprotokoll

| Nr. | Szenario und Rolle | Soll | Ist | Schweregrad | Reproduktionsschritte | Entscheidung |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Anmeldung; Administration und Sachbearbeitung | beide synthetischen Konten funktionieren | erster API-Start nutzte für Identity irrtümlich `Cemaris_Dev`; nach kontrolliertem Neustart gegen die freigegebene manuelle Datenbank antworteten beide Anmeldungen über den Proxy mit 200 | Vorführungsblocker, Umgebungsaufbau | anmelden; bei Fehlschlag API-Prozesskonfiguration und aufgelöste Datenbank prüfen | nur den eigenen API-Prozess mit prozesslokaler korrekter Zuordnung neu gestartet; keine Repository-Änderung |
| 2 | wiederverwendbare Friedhofsstammdaten; Administration | Tests beginnen ohne jedes Mal vollständige Stammdatenpflege | Bestand war leer; auf ausdrücklichen späteren Benutzerauftrag wurden zwei Friedhöfe, je Bereich/Feld/Reihe, zwei Grabarten, vier Zuordnungen und acht Grabstellen synthetisch angelegt | keiner | Stammdaten über vorhandene API anlegen und als beide Rollen lesen | synthetischer Bestand bleibt für spätere Tests erhalten; keine Migration und keine andere Datenbank verändert |
| 3 | erster Schreibzugriff direkt nach Anmeldung; beide Rollen | erste Mutation funktioniert ohne Seitenneuladen | anonymer CSRF-Nachweis bleibt im Frontendadapter nach erfolgreichem Login zwischengespeichert; der erste nachfolgende Schreibzugriff kann mit 400 scheitern, ein Seitenreload holt den authentifizierten Nachweis | mittel | CSRF anonym abrufen, anmelden, mit demselben Nachweis eine autorisierte Mutation senden | als technischer Defekt außerhalb der vier 5d-Befunde nicht geändert; reproduzierbar in 5e abgrenzen und korrigieren |
| 4 | kanonisches Nutzungsrecht aus einer Altfallakte; Sachbearbeitung | nachvollziehbarer Weg zum Rechteformular | in `Fallakte bearbeiten` war `Bestehender Altbezug` gewählt; ohne kanonische Grabstellen-ID wird das Rechtepanel auf der Detailseite nicht angezeigt | Hinweis zur Auffindbarkeit | kanonische freie Grabstelle wählen, Grabstellenbezug speichern, `Zur Fallakte`, Beteiligten wählen | entspricht der bestätigten Grenze, dass Rechteauswahl auf der Fall-/Grabstellendetailseite bleibt; nach Erläuterung vom Benutzer als funktionierend bestätigt |
| 5 | Navigation, Beteiligte und Rechteablauf; Sachbearbeitung | Bedienkorrekturen nutzbar | Benutzer meldete nach dem geführten Ablauf keine weitere Blockade | keiner im beobachteten Ablauf | Beteiligten-/Rechteweg wie beschrieben bedienen | geführte Bedienprobe abgeschlossen; nicht als vollständige Verwaltungsabnahme gewertet |
| 6 | 375-Pixel-Viewport, Tastatur, Fokus und alle Mutationsvarianten; beide Rollen | alle Einzelszenarien manuell protokolliert | strukturell und automatisiert geprüft; keine getrennte vollständige Benutzer-Rückmeldung je Einzelszenario | offenes manuelles Freigabegate | die zwölf Szenarien der 5d-Übergabe einzeln mit Rolle und Viewport protokollieren | keine weitergehende manuelle oder fachliche Freigabe behaupten |

Die Ports `5050` und `5173` wurden nach der Rückmeldung kontrolliert
freigegeben.

## Datenbank- und Arbeitsraumgrenze

Die ursprüngliche Übergabe untersagte eine Veränderung der vorhandenen
manuellen Datenbank. Während der Vorführung erteilte der Benutzer anschließend
ausdrücklich den engeren Auftrag, dort wiederverwendbare vollständig
synthetische Friedhofsstammdaten anzulegen. Ausschließlich aufgrund dieser
späteren Autorisierung wurden über die vorhandenen Cemaris-Endpunkte die im
Beobachtungsprotokoll genannten Datensätze angelegt.

Es wurde keine Datenbank angelegt, gelöscht oder migriert. Keine andere
Benutzer-, Produkt- oder Testdatenbank wurde verändert. Die lokale
Satzungsquelle, EDWALT-Originale und externe Phase-Arbeitsbereiche wurden in
5d nicht benötigt und nicht geöffnet.

## Nicht-Ziele und offene Freigabegates

Unverändert nicht umgesetzt und nicht bestätigt sind:

- Rechtearten oder weitere Personenrollen;
- Frist-, Dauer-, Satzungsstands- oder Statusberechnung;
- Beendigung, Rückgabe, Entziehung, Schließung oder Wiedervergabe;
- Wiedervorlage, Erinnerung, Eskalation oder Benachrichtigung;
- Party-Merge, Löschung, Sperrung, Anonymisierung oder Aufbewahrungsautomatik;
- Migration oder fachliche Zusammenführung von Altprojektionen;
- Gebühren, Bescheide, Dokumente oder externe Integrationen;
- fachliche Verwaltungsabnahme, Rechtsprüfung, Datenschutz-, Betriebs- oder
  Produktivfreigabe.

Die Fragen `5C-01` und `5C-03` bis `5C-13` bleiben offen beziehungsweise
widersprüchlich. Aus 5d entsteht keine neue bestätigte Fachregel.

## Nächster sicherer Schritt

Der kleinste belegte technische Folgeschritt ist kein Lebenszyklusinkrement,
sondern die isolierte Korrektur des beim manuellen Aufbau reproduzierten
CSRF-Sitzungswechsels. Die ausführbare, kontextlose Abgrenzung steht in der
[5e-Folgeübergabe](cemaris-increment-5e-next-step-handoff.md).

Jede fachliche Erweiterung zu Fristen, Status, Beendigung oder Wiedervorlagen
benötigt weiterhin ein separates Entscheidungs- und Freigabegate.

## Abschlussprüfungen

Die vollständige Schlussprüfung am 18.08.2026 ergab:

| Prüfung | Ergebnis |
| --- | --- |
| Release-Build `Cemaris.sln` | bestanden; 0 Warnungen, 0 Fehler |
| Unit-Tests | 32 von 32 bestanden |
| reguläre Integrationstests `Category!=SqlServer` | 48 von 48 bestanden |
| `dotnet format --verify-no-changes --no-restore` | bestanden |
| `npm ci` | 117 Pakete installiert; 0 bekannte Schwachstellen |
| vollständige Frontendtests | 25 von 25 in 7 Testdateien bestanden |
| Frontend-Lint | bestanden |
| Frontend-Produktionsbuild | bestanden |
| `git diff --check` | bestanden |
| Links und Anker in 11 geänderten/neuen Markdown-Dateien | 0 Befunde |
| konsistente Markdown-Tabellen | 0 Befunde |
| Dokument-Whitespace | 0 Befunde |
| Secretprüfung ausschließlich der Ergänzungen, ohne Wertausgabe | 0 Befunde |

Zusätzlich wurde nachgewiesen:

- der Index ist leer; es wurde nichts gestaged und kein Commit erstellt;
- Branch, HEAD und Upstream blieben `main`,
  `9c728d7e0cd6a55faf4adb804831d28f36d3ac42` und `origin/main` bei
  Ahead/Behind `0/0`;
- es bestehen keine Änderungen unter Domain, Application, Infrastructure,
  API, Integrationstests oder Migrationen;
- unter dem Präfix `Cemaris_IntegrationTests_` existiert weiterhin genau die
  aufgelöste manuelle 5b-Datenbank; keine reale SQL-Suite wurde ausgeführt;
- nur die auf späteren ausdrücklichen Auftrag angelegten synthetischen
  Stammdaten änderten diese manuelle Datenbank; keine fremde Datenbank wurde
  verändert, angelegt, gelöscht oder migriert;
- API und Frontend wurden kontrolliert beendet; auf `5050` und `5173` blieb
  kein Listener;
- `tmp/pagination-build` enthält weiterhin 890 Dateien;
- keine externen Arbeitsbereiche oder Satzungsquellen wurden für 5d geöffnet
  oder verändert.

Diese Prüfungen belegen ausschließlich den technischen 5d-Abschluss. Sie
ersetzen keine der ausdrücklich offenen Fach-, Rechts-, Datenschutz-,
Betriebs- oder Produktivfreigaben.
