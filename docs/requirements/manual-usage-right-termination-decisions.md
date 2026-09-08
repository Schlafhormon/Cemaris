# Produktentscheidungen M2a: manueller Nutzungsrechtslebenszyklus

Stand: 08.09.2026

Status: **Alle fünf Produktentscheidungen bestätigt und am 08.09.2026 umgesetzt.**
[Abschluss und Nachweise](../implementation/cemaris-manual-usage-right-termination-completion.md)
sowie [ADR-0021](../decisions/ADR-0021-manual-usage-right-lifecycle.md)
beschreiben den geprüften Implementierungsstand. Die Capability bleibt aus.
Die Projektverantwortung hat die Vorbereitung des nächsten kontextlosen
Implementierungsauftrags verlangt und alle fünf konkreten Fragen beantwortet.
Die [technische Übergabe](../implementation/cemaris-manual-usage-right-termination-next-step-handoff.md)
enthält den verbindlichen Umsetzungsschnitt einschließlich Folgekorrektur.

## Bereits maßgebliche Grenzen

Die [Prototypentscheidung](notice-generation-pilot-release-decisions.md#aktuelle-projektentscheidung-pragmatischer-prototyp)
erlaubt synthetische Entwicklung ohne erneute allgemeine Freigaberunden.
Sie ersetzt keine konkrete Entscheidung über die Wirkung einer neuen Operation.
Der [bestehende Nutzungsrechtsvertrag](person-usage-rights-deadlines-decisions.md)
bestätigt stabile Rechteidentität, manuelle Laufzeitfakten, Inhaberhistorie,
Version, atomare Revision/Audit und beide Fallarbeitsrollen. Das manuelle
Laufzeitende beendet bisher kein Recht. Die alten 5f-/5g-Antworten bleiben
historische Präferenzen und dürfen nicht als neue M2a-Bestätigung ausgegeben werden.

## Konkrete Produktantworten

Diese Fragen wurden am 08.09.2026 in der Vorbereitung gestellt und ausdrücklich
beantwortet. Die Quellenkennungen bezeichnen diese Gesprächsantworten.

Antwort zu M2A-01, Quelle `USR-2026-09-08-M2A-01`: „Ja, diesen begrenzten
Umfang festhalten“. Damit sind beide Beendigungsarten, manuelle Pflichtangaben,
Prüfbestätigung, beide Rollen und unveränderte sonstige Fachbereiche bestätigt.
Antwort zu M2A-02, Quelle `USR-2026-09-08-M2A-02`: „Ja, heute oder rückwirkend“.
Bestätigt sind damit keine Vormerkung zukünftiger Beendigungen, ein getrenntes
tatsächliches Beendigungsdatum und der Abschluss des letzten Inhaberzeitraums.
Antwort zu M2A-03, Quelle `USR-2026-09-08-M2A-03`: „Rücknahme und manuelle
Neuvergabe jetzt vorsehen“. Damit ist die ursprünglich vorgeschlagene Sperre
jeglicher Neuvergabe nicht gewählt. Mehrere aufeinanderfolgende Rechte je
Grabstelle und deren lesbare Historie gehören zum Implementierungsschnitt.

Antwort zu M2A-04, Quelle `USR-2026-09-08-M2A-04`: „Nein, auch bestehende
Rechtefolgen korrigieren“. Damit ist eine pauschale Sperre der Rücknahme nach
Neuvergabe ausdrücklich nicht gewählt. M2A-05 konkretisiert die gemeinsame
Korrektur anhand des Beispiels A/B.

Antwort zu M2A-05, Quelle `USR-2026-09-08-M2A-05`: „Ja, so gemeinsam und
nachvollziehbar korrigieren“. Bestätigt ist der ausdrücklich bestätigte gemeinsame
Korrekturvorgang: B und gegebenenfalls weitere Nachfolgerechte werden als
„Irrtümlich angelegt“ historisiert, A wird wieder geöffnet. Alle Datensätze und
bisherigen Revisionen bleiben erhalten; andere Fachaggregate bleiben unverändert.

| ID | Bestätigter Umfang | Offene Grenze |
| --- | --- | --- |
| M2A-01 | **BESTÄTIGT:** Rückgabe **oder sonstige Beendigung** manuell mit Datum, Begründung, Quellenreferenz und bestätigter manueller Prüfung dokumentieren; beide Rollen dürfen dies ausführen; keine Änderung an Grabstatus, Beisetzungen, Gebühren oder Wiedervorlagen und keine Fristautomatik | keine offene Alternative mehr |
| M2A-02 | **BESTÄTIGT:** Beendigung für heute oder rückwirkend; ursprüngliches Laufzeitende bleibt erhalten, tatsächliches Beendigungsdatum wird getrennt gespeichert und schließt den letzten Inhaberzeitraum | keine offene Alternative mehr; keine zukünftige Vormerkung |
| M2A-03 | **BESTÄTIGT:** begründete Rücknahme und manuelle Neuvergabe bereits in diesem Schnitt; neue Rechteidentität nach Beendigung | keine pauschale Verschiebung der Neuvergabe auf später |
| M2A-04 | **BESTÄTIGT:** auch bestehende Rechtefolgen korrigieren | keine pauschale Rücknahmesperre bei angelegten Nachfolgern |
| M2A-05 | **BESTÄTIGT:** ausdrücklich bestätigter gemeinsamer Korrekturvorgang markiert Nachfolgerechte als „Irrtümlich angelegt“ und öffnet den Vorgänger wieder; alle Datensätze/Revisionen und sonstigen Fachaggregate bleiben erhalten | keine offene Alternative mehr |

Die technischen Konkretisierungen berücksichtigen die ausdrücklich gewählte
manuelle Neuvergabe und Folgekorrektur. Es ist keine erneute Produktfreigabe nötig.

## Technische Konkretisierung des bestätigten Umfangs

Die folgenden Details sind fachregelarme technische Konkretisierungen des
Umfangs, keine wörtlich erhobenen zusätzlichen Benutzeraussagen:

- Das kanonische Recht besitzt einen ausdrücklichen Zustand `Open`/`Ended`/`Voided`
  mit den Anzeigen „Offen“, „Beendet“ und „Irrtümlich angelegt“.
  `Returned` und `Other` unterscheiden die manuell dokumentierte Art der
  Beendigung; sie sind kein modellierter Entzug, keine Schließung oder Entwidmung.
- `Open → Ended` ist eine ausdrückliche begründete Operation. `Ended → Open`
  bedeutet ausschließlich die dokumentierte Rücknahme einer irrtümlichen
  Beendigung. Beide behalten Rechte-ID und Grabstellenbezug.
- Beendigung verlangt einen gültigen Kalendertag, Art, getrimmte Begründung
  (1–1.000 Zeichen), Quellenreferenz (1–250 Zeichen) und eine ausdrückliche
  Prüfbestätigung. Die Bestätigung besagt, dass die Voraussetzungen manuell
  geprüft wurden; die Software berechnet keine Ruhezeit und bescheinigt keine
  rechtliche Zulässigkeit. Rücknahme verlangt mindestens eine Pflichtbegründung.
- Das Datum bedeutet „beendet ab“, also erster Tag ohne diesen Inhaberzeitraum.
  Es muss strikt nach dem Beginn des Rechts und des zuletzt offenen
  Inhaberzeitraums liegen. Ein leeres Intervall oder ein Zurückgreifen vor einen
  bereits historisierten Transfer wird abgewiesen. Das Laufzeitende bleibt
  separat erhalten und begrenzt das tatsächliche Beendigungsdatum nicht automatisch.
- Ein Datum nach heute wird für die Beendigung abgewiesen. Die vorhandene
  Application verwendet einen über `TimeProvider` bestimmten UTC-Kalendertag.
  Diese technische Konvention beibehalten und für die Prüfung erkennbar machen;
  keine neue kommunale Zeitzonen- oder Fristregel still einführen. Uhrzeit und
  rechtliche Frist sind keine neuen Eingaben.
- Beendigung schließt genau den letzten offenen Inhaberzeitraum an diesem Tag.
  Rücknahme öffnet genau diesen Zeitraum wieder und setzt den aktuellen
  Beendigungsnachweis zurück; ältere vollständige Revisionen bleiben erhalten.
  Es entsteht kein neuer Inhaber und kein Transfer. Wiederholte Beendigung oder
  Rücknahme im falschen Zustand ergibt 409 ohne weitere Revision/Audit.
- Transfer, Verlängerung und Faktenkorrektur beendeter oder irrtümlich angelegter
  Rechte sind gesperrt.
  Eine fehlerhafte Beendigung wird zuerst zurückgenommen, danach gegebenenfalls
  korrigiert und erneut dokumentiert. Keine Änderung historischer Revisionen.
- Eine Neuvergabe erzeugt nach manueller Prüfung eine neue Rechte-ID mit
  explizitem Vorgängerbezug, manuellem Beginn/Ende, Inhaber, Startregel-Snapshot,
  Quellenreferenz und Begründung. Sie schließt kein offenes Recht automatisch.
  Es darf weiterhin höchstens ein offenes kanonisches Recht je Grabstelle geben;
  mehrere beendete oder irrtümlich angelegte Rechte sind nun zulässig. Das bestehende ungefilterte
  Eindeutigkeitsmodell wird deshalb kontrolliert erweitert.
- Beginn des Nachfolgerechts frühestens am tatsächlichen Beendigungsdatum des
  unmittelbaren Vorgängers, nicht am separat erhaltenen ursprünglichen
  Laufzeitende. Beispiel: Ende des Vorgänger-Inhaberzeitraums exklusiv 10.09.;
  neuer Beginn einschließlich 10.09. zulässig, 09.09. unzulässig. Keine
  Überschneidung, kein nachträgliches Einfügen in eine bereits bestehende Folge.
  Kein geltendes oder neues lokales Laufzeit-/Ruhezeitlimit wird daraus abgeleitet.
- Neuvergabe verlangt eine eigene ausdrückliche manuelle Prüfbestätigung;
  die frühere Bestätigung der Beendigung ersetzt sie nicht. Aktuelle Vorgängerversion
  und unveränderte Grabstellenzuordnung werden beim Speichern geprüft. Gleichzeitige
  Neuvergaben und Rücknahme/Neuvergabe dürfen keine zwei offenen Rechte erzeugen.
  Auch generische Anlage, Transfer und Faktenkorrektur dürfen die Folgeinvarianten
  nicht umgehen. Beginn/Grabstellenbezug einer bereits verknüpften Folge dürfen
  nicht still in widersprüchliche Zuordnungen geändert werden.
- Ein ergänzender paginierter Grabstellen-Rechteverlauf macht alle Rechte
  einschließlich irrtümlicher Nachfolger zugänglich; vollständige Revisionen erst
  bei Auswahl eines Rechts laden. Auswahl anhand stabiler Rechte-ID erhalten.
  Der bestehende Einzel-Lesepfad liefert für kompatible Verbraucher das offene
  Recht, sonst das zuletzt beendete gültige Recht; irrtümlich angelegte Rechte
  werden hier übersprungen. Kein ungeprüftes `Single` über mehrere
  Rechte und keine Änderung des bestehenden Antworttyps zu einer Liste. Der
  Bescheidpanel-Vorschlag darf einen beendeten oder irrtümlichen Inhaber nicht als aktuell
  anbieten; manuelle Zahlungspflichtigenauswahl und bestehende Entwürfe bleiben erhalten.
- Bestehende kanonische Rechte ohne Beendigung behalten ihren bisherigen offenen
  manuellen Zustand. Aus `EndDate`, Beisetzung oder Altprojektion wird kein
  Lebenszyklus abgeleitet. Alte JSON-Fachrevisionen ohne neue Felder bleiben lesbar
  und werden nicht physisch umgeschrieben oder mit erfundenen Angaben ergänzt.

## Gemeinsame Korrektur einer Rechtefolge

Bei A → B → C darf eine Rücknahme der Beendigung von A auch die bestehende Folge
korrigieren. Vor dem Speichern zeigt die Oberfläche A und alle betroffenen
gültigen Nachfolger mit Identität und Zustand an. Die Benutzerin oder der Benutzer
bestätigt ausdrücklich deren Kennzeichnung als „Irrtümlich angelegt“ und gibt
eine Pflichtbegründung an. Eine gewöhnliche Rücknahme ohne diese Bestätigung
darf keine Nachfolger verändern.

Der Server ermittelt die vollständige Folge selbst, prüft Grabstellenbezug und
Zyklenfreiheit und vergleicht die erwarteten Versionen **aller** betroffenen
Rechte sowie den unveränderten Umfang der Folge. Ein inzwischen angelegter
Nachfolger muss ebenfalls zum Konflikt führen. Danach erfolgen das Wiederöffnen
von A und die Kennzeichnung von B/C gemeinsam atomar, mit je einer neuen Version,
vollständiger Revision und sparsamem Audit. Eine gemeinsame Vorgangskennung
verbindet diese Nachweise. Jeder Fehler rollt die gesamte Operation zurück.

Die Beendigungsdaten und erfassten Inhaberintervalle von B/C bleiben als
historisierte Tatsachen des irrtümlichen Datensatzes erhalten. Ein dort noch
offenes Intervall bezeichnet wegen `Voided` keinen aktuellen Inhaber; es wird
kein rückwirkendes Datum erfunden. Bereits irrtümliche Zweige werden nicht erneut
verändert. Nach erneuter manueller Beendigung von A kann ein neues Recht D
angelegt werden, während B/C weiterhin auffindbar bleiben. Höchstens ein offenes
Recht und höchstens ein gültiger unmittelbarer Nachfolger pro Vorgänger; keine
Zyklen, grabstellenübergreifenden Folgen oder physische Löschung. Ein separates
Wiederherstellen eines als irrtümlich gekennzeichneten Rechts gehört nicht zu
dieser bestätigten Korrekturoperation.

| Ausgangslage | Aktion | Ergebnis |
| --- | --- | --- |
| A offen | Beendigung | A beendet; letzter Inhaberzeitraum geschlossen |
| A beendet, keine gültigen Nachfolger | begründete Rücknahme | A offen; derselbe Inhaberzeitraum wieder offen |
| A beendet, keine gültigen Nachfolger | manuelle Neuvergabe B | A bleibt beendet; neue Identität B mit Vorgänger A |
| A beendet, Folge B/C vorhanden | ausdrücklich bestätigte Folgekorrektur | A offen; B/C irrtümlich angelegt; alle Nachweise gemeinsam gespeichert |
| A beendet, Folge B/C vorhanden | gewöhnliche Rücknahme ohne Folgekorrektur | 409; kein Datensatz verändert; Oberfläche bietet den bestätigten Korrekturweg an |
| B irrtümlich angelegt | Transfer, Verlängerung, Faktenkorrektur oder Einzelrücknahme | 409; historische Ansicht bleibt verfügbar |

| Verbindliches Prüfbeispiel | Erwartung |
| --- | --- |
| A endet 10.09.; B beginnt 10.09. | zulässige Intervallgrenze; ursprüngliches Laufzeitende von A bleibt erhalten |
| A endet 10.09.; B beginnt 09.09. | Überlappung abweisen |
| Vorschau A/B; inzwischen entsteht C | Konflikt, keine Teilkorrektur |
| A/B/C bestätigt; Version von B veraltet | 412; alle Versionen und Nachweise unverändert |
| Fehler beim zweiten Revisions-/Auditschritt | vollständiger Rollback einschließlich A und aller Nachfolger |
| B/C irrtümlich; A erneut beendet; D neu vergeben | D aktuelles Recht; B/C weiterhin in der Historie auswählbar |

## Unveränderte Fachbereiche

Die Operation beendet nur den kanonischen manuellen Rechts-/Inhaberstand des
synthetischen Prototypen. Fall-, Grabstellen- und Beisetzungsstatus, deren
Versionen, Personenstammdaten, Bescheid-/Gebührenfakten, manuelle Wiedervorlagen
und nullable Altprojektionen bleiben unberührt. Keine E-Mail, Dokumentausgabe,
automatische Wiedervergabe, Entschädigung, Gebührenrückzahlung oder Löschung.
Ob eine Grabstelle tatsächlich wieder belegbar ist, bleibt ausdrücklich eine
getrennte, in M2a nicht berechnete Frage.

## Umgesetzter technischer Vertrag vom 08.09.2026

Die vier ausdrücklich ausgelösten POST-Operationen liegen unter
`/api/usage-rights/{id}`: `terminations`, `termination-reversals`, `successors`
und `sequence-corrections`. Sachbearbeitung und Administration benötigen eine
gültige Cookie-Sitzung, CSRF und einen starken aktuellen `If-Match`.
Fehlender ETag ergibt 428, ungültiger oder schwacher 400, veralteter 412;
fehlende Referenzen ergeben 404, unzulässige Zustände 409.

`Features:UsageRightLifecycleEnabled` ist standardmäßig aus, nur in Development
zulässig und benötigt die vorhandene Beteiligten-/Rechte-Capability. Bereits
gespeicherte Zustände bleiben über deren Lesepfade sichtbar; die Zustandsgrenzen
der alten Schreibwege gelten unabhängig vom neuen Schalter.

Die Neuvergabe speichert ihre eigene Prüfbestätigung als
`ManualGrantReviewConfirmed` in aktuellem Stand und Revision. Bestandsrechte
bekommen keine erfundene Prüfbestätigung. Auch der Vorgänger erhält bei Neuvergabe
eine neue Version und einen Nachweis mit derselben Vorgangskennung. Dadurch
kann sein alter ETag weder eine konkurrierende Neuvergabe noch Rücknahme zulassen.

Der Verlauf unter `/api/grave-sites/{id}/usage-rights/history` sortiert nach
Beginn und Rechte-ID absteigend, SQL-kompatibel auch im Synthetic-Provider.
Seitengröße ist 1 bis 50, die Oberfläche nutzt 10. Nur die Auswahl lädt die
vollständige Detailhistorie. Die serverermittelte Vorschau unter
`/api/usage-rights/{id}/sequence` enthält Identitäten, Zustände und Versionen.
Bestätigte Mitglieder müssen exakt mit der beim Schreiben erneut ermittelten
Folge übereinstimmen. Nach einem Konflikt ist eine neue Vorschau mit erneuter
Bestätigung erforderlich; die eingegebene Begründung bleibt erhalten.
