# Quellen-, Evidenz-, Entscheidungs- und Freigabematrix Inkrement 5f

Stand: 21.08.2026

## Zweck und Freigabegrenze

Diese Arbeitsmatrix ist die quellengebundene Ausgangsbasis des ausschließlich
dokumentarischen Inkrements 5f. Sie dokumentiert noch keine neue Fachregel und
keine fachliche, rechtliche, datenschutzrechtliche, sicherheitsseitige,
betriebliche oder produktive Freigabe.

Die Statuswerte bedeuten:

- `BESTÄTIGT`: nur die ausdrücklich belegte enge Produktgrenze ist bestätigt;
- `OFFEN`: mindestens eine entscheidungs- oder freigabeberechtigte Funktion
  hat noch keine belastbare Aussage geliefert;
- `WIDERSPRUCH`: Quellen stehen ungeklärt nebeneinander;
- `UNTERSUCHUNGSKANDIDAT`: genau eine mögliche Operation wird befragt, ohne
  sie bereits zur Cemaris-Fachregel zu erklären.

Repository-interne Verweise auf örtliche Satzungsfundstellen sind
`SATZUNGSEVIDENZ` für den dort beschriebenen kommunalen Geltungsbereich. In 5f
wurde kein außerhalb des Repositorys liegendes Original geöffnet. Die
Produktverantwortung ersetzt keine erforderliche Freigabe durch
Friedhofsverwaltung, Rechtsprüfung, Datenschutz, Informationssicherheit oder
Betrieb.

## Dokumentierte Auskunft vom 21.08.2026

Quelle `USR-2026-08-21-ADMIN-DEVELOPMENT` ist die direkte Auskunft im
Cemaris-Implementierungsdialog:

- auskunftgebende Funktion: `Administrator mit Entwicklungsauftrag für die
  Friedhofsverwaltungssoftware`;
- Produktziel: Cemaris soll als Open-Source-Software für alle Kommunen
  nachnutzbar sein;
- erster Einführungs- und Entwicklungskontext: Stadt Doberlug-Kirchhain;
- gewünschte Arbeitsrichtung: Entwicklung zunächst fortsetzen und EDWALT als
  Orientierung verwenden.

Die Auskunft bestätigt die allgemeine Nachnutzungsrichtung und den ersten
kommunalen Kontext. Sie bestätigt weder, dass die untersuchte Rückgabe die
fachlich wichtigste reale Operation ist, noch eine ihrer Fachregeln. Die
auskunftgebende Funktion wurde nicht als Friedhofsverwaltung,
Produktverantwortung, Rechtsprüfung, Datenschutz, Informationssicherheit oder
Betriebsfreigabe benannt. Repository-interne EDWALT-Unterlagen dürfen daher
weiterhin nur als ausdrücklich gekennzeichnete `ALTVERFAHRENS-EVIDENZ` für
Erhebung und Vergleich dienen, nicht als Sollprozess.

## Quellen-, Evidenz-, Entscheidungs- und Freigabematrix

| ID | Genaue Quelle | Geltungsbereich | Status am 21.08.2026 | Benötigte fachliche oder freigebende Funktion | Auswirkung auf den möglichen kleinsten Implementierungsschnitt |
| --- | --- | --- | --- | --- | --- |
| 5C-01 | Friedhofssatzung § 12 Abs. 2, PDF-Seite 8, dokumentiert als E-06 in `docs/requirements/person-usage-rights-deadlines-decisions.md`; 5c-Abschluss; USR-2026-08-21-ADMIN-DEVELOPMENT | sieben örtlich benannte Grab-/Rechtearten; Open-Source-Nachnutzung für alle Kommunen mit erstem Kontext Doberlug-Kirchhain | OFFEN; Produktgeltungsrichtung mitgeteilt, allgemeiner Rechteartenkatalog und Operationsumfang nicht bestätigt | Friedhofsverwaltung und Produktverantwortung; für örtliche Anwendung zusätzlich Rechtsprüfung | Ohne bestätigten sachlichen Anwendungsbereich darf selbst eine manuelle Operation nicht auf alle kanonischen Rechte verallgemeinert werden. |
| 5C-02 | REQ-UR-003, REQ-UR-004, REQ-UR-006 und REQ-UR-007; ADR-0016; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | ausschließlich manueller 5b-Kern | BESTÄTIGT | für diese bestehende Grenze Produktverantwortung; jede neue Statuswirkung benötigt ein neues Fach-/Rechtsgate | Das manuelle Enddatum bleibt ein historisierter Fakt und löst allein niemals Status, Ablauf oder Beendigung aus. Diese Frage wird nicht erneut gestellt. |
| 5C-03 | E-07 und E-09; REQ-CFG-001 bis REQ-CFG-005; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtlicher Startnachweis und noch unbestätigte Ruhe-/Nutzungszeitereignisse | OFFEN | Friedhofsverwaltung, Produktverantwortung und Rechtsprüfung | Auslösendes Ereignis, Nachweis, Wirksamkeit und Regelstand einer Operation müssen manuell und ausdrücklich festgelegt werden; keine Berechnung ist zulässig. |
| 5C-04 | E-04, E-06, E-10 und E-11; verworfene Vorgabe E-21; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtliche Jahreswerte, keine allgemeinen Defaults | OFFEN | Friedhofsverwaltung und Rechtsprüfung, danach Produktverantwortung | Ein kleinster Schnitt darf keine Dauer-, Rundungs-, Grenztags- oder Schaltjahrberechnung enthalten. |
| 5C-05 | Friedhofssatzung § 14 Abs. 2, PDF-Seiten 9–10, gegenüber Gebührensatzung Anlage A Nr. 3, PDF-Seite 2; E-18 | örtliche Wechselwirkung zwischen weiterer Beisetzung, verbleibender Ruhezeit und Verlängerung | WIDERSPRUCH | verbindliche fachlich-rechtliche Auslegung durch die zuständige kommunale Funktion | Operationen mit Verlängerungs-, Gebühren- oder Fristwirkung sind blockiert. Ein anderer manueller Schnitt muss seine Wechselwirkung mit laufenden Beisetzungen ausdrücklich klären. |
| 5C-06 | E-02, E-12, E-13 und E-17; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtliche Indizien für Schließung, Ablauf, Entzug und vorzeitige Rückgabe; kein freigegebenes Zustandsmodell | OFFEN; E-17 begründet den einzigen UNTERSUCHUNGSKANDIDATEN „manuelle vorzeitige Rückgabe nach abgelaufener Ruhezeit“ | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | Ohne Bestätigung von genau einer realen Operation, Zustand und ausdrücklich nicht umfassten Übergängen gilt Variante A „keine Implementierung“. |
| 5C-07 | REQ-SAFE-003; ADR-0016; Identitätsvorgaben REQ-AUTH-001 bis REQ-AUTH-004; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | bestehende 5b-Rollen; neue Lebenszyklusfunktionen nicht klassifiziert | OFFEN | Fachverantwortung und Berechtigungs-/Informationssicherheitsverantwortung; gegebenenfalls Funktionstrennung | Auslösen, Bestätigen, Korrigieren und Rücknehmen dürfen keiner vorhandenen Rolle ohne neue Klassifizierung zugewiesen werden. |
| 5C-08 | REQ-SAFE-001, REQ-SAFE-002 und REQ-SAFE-004; ADR-0016; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | allgemeine technische Mindestmechanismen des kanonischen Kerns; operationsspezifische Fachinhalte offen | OFFEN | Friedhofsverwaltung und Produktverantwortung für Quelle, Grund und Fachrevision; Datenschutz-/Auditprüfung | Starker ETag, Atomarität, unveränderliche Fachrevision und sparsamer Audit sind Mindestgrenzen. Pflichtquelle, Begründung, Revisionsinhalt und atomare Teilwirkungen der Operation fehlen. |
| 5C-09 | Friedhofssatzung § 3, PDF-Seite 4, dokumentiert als E-02; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtliche Schließungs-/Entwidmungsevidenz und vorhandene, davon unabhängige Grabstellenmerkmale | OFFEN | Friedhofsverwaltung, Rechtsprüfung und Produktverantwortung | Grabstatus, Sperre und Wiedervergabe dürfen nicht implizit aus einer Nutzungsrechtsoperation geändert werden; eine atomare oder ausdrücklich keine Wirkung ist zu entscheiden. |
| 5C-10 | Friedhofssatzung § 26, PDF-Seite 14, dokumentiert als E-14; REQ-UR-004; ADR-0016; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtliche Altfall-/Bestandsschutzindizien; kanonischer 5b-Kern und getrennte nullable Altprojektion | OFFEN | Friedhofsverwaltung, Rechtsprüfung, Migrationsverantwortung und Produktverantwortung | Kein Backfill, keine Rückinterpretation und keine erfundene Historie. Anwendbarkeit auf Bestand, fehlende Nachweise und Altprojektionen muss vor Variante B entschieden sein. |
| 5C-11 | E-07, E-12 und E-13; Requirements-Index Abschnitt 15; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | mögliche örtliche Hinweise und Folgeaufgaben, keine bestätigte Wiedervorlagenart | OFFEN | Friedhofsverwaltung und Produktverantwortung | Der kleinste Schnitt enthält keine Wiedervorlage, solange Entstehung, Erledigung, Verschiebung und Aufhebung unbestimmt sind. |
| 5C-12 | Friedhofssatzung § 12 Abs. 4 Buchst. b, PDF-Seite 8, dokumentiert als E-07; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | örtlicher Drei-Monats-Hinweis, keine allgemeine Erinnerungsregel | OFFEN | Friedhofsverwaltung, Rechtsprüfung, Datenschutz und Betrieb | Keine manuelle oder automatische Erinnerung, Eskalation, Benachrichtigung oder Kanalanbindung ist Bestandteil des möglichen Schnitts. |
| 5C-13 | REQ-SAFE-005; Requirements-Index Abschnitte 21 bis 23; Identitätsvorgaben zu Audit-/Loglebenszyklus | Beteiligte, Fachrevisionen, Audit, Aufbewahrung und Löschung | OFFEN | Datenschutzverantwortung, Fachverantwortung, Rechtsprüfung und Betrieb | Keine Lösch-, Sperr-, Anonymisierungs- oder Aufbewahrungsautomatik. Eine zusätzliche Revision/Auditwirkung benötigt eine belastbare Datenschutz- und Aufbewahrungsbewertung. |
| 5C-14 | E-20 bis E-22; REQ-CFG-001 bis REQ-CFG-005; REQ-SAFE-001 bis REQ-SAFE-004; ADR-0016; Projektverantwortung vom 18.08.2026 im 5c-Abschluss | Trennung kommunaler Werte von allgemeinen technischen Produktmechanismen | BESTÄTIGT | Produktverantwortung für die bestehende allgemeine Grenze; kommunale Fach-/Rechtsfreigabe für jeden örtlichen Wert | Kommunale Ereignisse und Werte bleiben lokale Konfiguration beziehungsweise lokale Entscheidung. Historisierung, Atomarität, starke ETags, sparsamer Audit und rückwirkungsfreie Snapshots bleiben allgemeine Mechanismen. Diese Frage wird nicht erneut gestellt. |

## Genau ein möglicher Untersuchungsschnitt

Untersucht wird ausschließlich:

> eine manuell ausgelöste und historisierte vorzeitige Rückgabe eines
> kanonischen Nutzungsrechts, sofern die maßgebliche Ruhezeit bereits
> abgelaufen ist.

Die Bezeichnung ist nur ein Fragengegenstand aus E-17
(Gebührensatzung § 4, PDF-Seite 1). Weder der tatsächliche höchste kommunale
Bedarf noch Auslöser, Nachweis, Rechtswirkung oder Anwendungsbereich sind
bestätigt. Insbesondere folgt aus E-17 keine allgemeine Open-Source-Regel und
keine Freigabe, eine Rückgabe in Cemaris zu implementieren.

Andere Operationen wie Beendigung durch Zeitablauf, Entzug, Schließung,
Entwidmung oder Wiedervergabe sind keine Alternativkandidaten dieses Gates.
Automatisierte beziehungsweise berechnete Lebenszyklen bleiben ausgeschlossen.

## Konsolidierter Fragenblock

Die engen Antworten zu 5C-02 und 5C-14 stehen fest und werden nicht erneut
erfragt. Der Block wurde am 19.08.2026 gestellt. Die Antwort vom 21.08.2026
beantwortet die auskunftgebende Funktion sowie allgemeine Produkt- und
Kommunalrichtung, aber keine operationsspezifische Frage und keine Freigabe.
Die unbeantworteten Punkte bleiben als ausführbare Vorlage für ein späteres
Gate erhalten. Für jede spätere Antwort sind Antwortdatum sowie Rolle oder
Funktion der auskunftgebenden Person anzugeben.

1. **Auskunft und Bedarf:** In welcher Rolle oder Funktion antworten Sie? Ist
   die oben beschriebene manuelle vorzeitige Rückgabe tatsächlich die eine
   reale Nutzungsrechtslebenszyklusoperation mit dem höchsten aktuellen
   Bedarf? Für welche Kommune, Friedhöfe, Rechts-/Grabarten und Fallgruppen
   soll die Aussage gelten? Welche fachliche Quelle und welche zuständige
   Funktion belegen Bedarf und Geltungsbereich?
2. **Auslöser und Nachweis:** Welches konkrete Ereignis löst die Rückgabe aus?
   Wer erklärt oder beantragt sie, wann gilt sie als eingegangen, und welcher
   Nachweis ist zwingend? Welche Ereignisse, insbesondere bloßer Zeitablauf,
   Tod, Übertragung, Entzug, Schließung und Entwidmung, sind ausdrücklich
   nicht umfasst? Wie wird der Ablauf der maßgeblichen Ruhezeit belastbar
   nachgewiesen, ohne dass Cemaris ihn in diesem Schnitt berechnet?
3. **Wirksamkeit und Korrektur:** Welcher Kalendertag ist das
   Wirksamkeitsdatum, sind Rückwirkungen zulässig und welche Datumsgrenzen
   gelten? Wie wird eine fachlich falsche Erfassung korrigiert? Darf eine
   wirksame Rückgabe fachlich zurückgenommen werden, und falls ja, unter
   welchen Voraussetzungen, ohne die Historie umzuschreiben?
4. **Rechtszustand:** Welchen ausdrücklich benannten Zustand erhält das
   kanonische Nutzungsrecht nach wirksamer Rückgabe? Welche Zustände und Fakten
   bleiben ausdrücklich unverändert, insbesondere manuelles Start-/Enddatum,
   Startregel-Snapshot und Rechteidentität? Ist die Operation endgültig oder
   gibt es einen bestätigten Folgezustand?
5. **Funktionen und Funktionstrennung:** Welche Funktion darf die Operation
   auslösen, welche muss sie bestätigen, welche darf sie korrigieren und
   welche zurücknehmen? Reichen `Sachbearbeitung` und `Administration`, oder
   ist Vier-Augen-Prüfung beziehungsweise eine neue Berechtigungsgrenze
   erforderlich? Bitte die Freigabe der zuständigen Berechtigungs- oder
   Informationssicherheitsfunktion benennen.
6. **Beisetzungen und Inhaberzeiträume:** Was geschieht bei einer laufenden,
   geplanten, bestätigten, durchgeführten oder noch nicht abgeschlossenen
   Beisetzung? Darf in diesen Fällen zurückgegeben werden? Wie endet der
   aktuell offene Inhaberzeitraum, und dürfen nach Wirksamkeit noch offene
   Inhaberzeiträume existieren?
7. **Grabstelle und Wiedervergabe:** Ändert die Rückgabe atomar den manuellen
   Grabstellenstatus oder die davon getrennte Sperre, oder bleiben beide
   ausdrücklich unverändert? Erlaubt sie bereits eine Wiedervergabe? Falls
   nicht, welches separate, ausdrücklich nicht in diesem Schnitt enthaltene
   Gate wäre dafür erforderlich?
8. **Quelle, Begründung, Revision, ETag und Audit:** Welche Quellenreferenz und
   Begründung sind Pflicht? Welche Vorher-/Nachher-Fakten muss die
   unveränderliche Fachrevision enthalten? Bleibt der bestehende sparsame
   Auditumfang aus REQ-SAFE-004 ausreichend? Sollen Rechtzustand,
   Inhaberzeitraum, Ergebnisversion, Fachrevision und Audit unter einem
   starken ETag vollständig atomar geschrieben werden, und welche
   Teilwirkungen müssen bei Fehlern gemeinsam zurückrollen?
9. **Altbestand und fehlende Daten:** Gilt die Operation nur für nach 5b
   manuell angelegte kanonische Rechte oder auch für Bestand? Gibt es
   Migration, Backfill, Bestandsschutz oder einen Satzungsstand-Snapshot? Wie
   werden nullable Altprojektionen, fehlender Ruhezeitnachweis und fehlende
   historische Quellen behandelt, ohne Identität oder Historie zu erfinden?
10. **Tatsächliche Freigaben:** Welche fachliche Freigabe der
    Friedhofsverwaltung, Rechtsprüfung, Datenschutzfreigabe,
    Informationssicherheits-/Berechtigungsfreigabe und Betriebsfreigabe liegen
    für genau diesen Schnitt tatsächlich vor? Bitte je Freigabe Datum,
    freigebende Rolle/Funktion, Geltungsbereich und belastbare Quelle nennen.
    Eine Antwort der Produktverantwortung ist separat auszuweisen und ersetzt
    keine dieser Freigaben.

## Abschließende Gateentscheidung

Ausgewählt ist Variante A „keine Implementierung“. Die Auskunft der technischen
Administration trägt die Open-Source- und Kommunalrichtung, ersetzt aber keine
der fehlenden Fachentscheidungen oder funktionsgerechten Freigaben. Variante B
wird deshalb weder spezifiziert noch zur Implementierung übergeben. Variante C
bleibt in Inkrement 5f ausgeschlossen.
