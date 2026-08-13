# ADR-0015: Atomarer providerneutraler Beisetzungsprozess

## Status

Accepted – 13.08.2026

## Kontext

Inkrement 4b verbindet einen statusbehafteten Beisetzungsvorgang mit einer
kanonischen Grabstelle. Ein Übergang kann gleichzeitig Beisetzungsfakten,
Grabstellenstatus, Fallversion und Änderungsnachweis verändern. Unabhängige
Store-Aufrufe könnten widersprüchliche Teilstände hinterlassen. Bestehende
nullable Beisetzungszeilen dürfen zugleich nicht fachlich gedeutet werden.

## Entscheidung

- Ein eigener Application-Service verwendet genau einen providerneutralen
  Prozessstore pro Mutation.
- Der synthetische Provider koordiniert Fall- und Stammdatenzustand unter
  einer gemeinsamen Sperre; SQL verwendet eine serialisierbare Transaktion.
- Grabstellenstatus wird nur monoton angehoben: bei Bestätigung mindestens
  reserviert, bei Durchführung belegt. Rückschritte ändern ihn nicht.
- Jede neue Prozessbeisetzung verlangt Person und kanonische Grabstelle. Ein
  gefilterter SQL-Index begrenzt sie auf eine je Person und lässt Altzeilen
  ohne Prozessstatus unverändert.
- Die unabhängige 4b-Capability ist standardmäßig aus und ausschließlich für
  Development mit synthetischen Daten zulässig. Bei Aktivierung ersetzt sie
  die alten einfachen Beisetzungsschreibhandler.
- Cookie, CSRF, eigene Rollenpolicy, authentifizierter Akteur, starke ETags
  und sparsamer atomarer Änderungsnachweis gelten für jede Mutation.

## Folgen

Provider zeigen dasselbe beobachtbare Verhalten und Fehlversuche hinterlassen
keine Teilwirkung. Die relationale Erweiterung bleibt additiv und Altzeilen
bleiben lesbar. Die gemeinsame Transaktionsgrenze koppelt den Prozessstore
bewusst an Fallversion und Grabstellenstatus. Kapazitätsentscheidungen,
Fristen und weitergehende Belegungslogik werden nicht vorweggenommen.
