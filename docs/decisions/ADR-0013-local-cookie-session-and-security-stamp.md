# ADR-0013: Lokale Cookie-Sitzung, CSRF und Security-Stamp

## Status

Accepted – 13.08.2026

## Kontext

Lokale Cemaris-Konten benötigen eine Browseranmeldung, ohne Passwörter oder
bearerartige Sitzungstoken im Browser-Speicher abzulegen. Deaktivierung,
Rollen-, Namens- und Passwortänderungen müssen bereits ausgestellte Sitzungen
zeitnah entwerten. Alle zustandsändernden Browseraufrufe benötigen zusätzlich
einen Schutz gegen Cross-Site Request Forgery.

## Entscheidung

- ASP.NET Core Cookie Authentication verwendet ein `HttpOnly`-,
  `SameSite=Lax`-Cookie mit 30 Minuten konfigurierbarer Inaktivitätsdauer.
  Außerhalb von Development ist `Secure` zwingend.
- Das Ticket enthält stabile Konto-ID, Anzeigename, genau eine Systemrolle,
  Kennzeichen für erzwungenen Passwortwechsel und einen zufälligen
  Security-Stamp. Bei jeder Anfrage wird aktiver Kontostatus und Stamp gegen
  die Datenbank geprüft.
- Namens-, Rollen-, Aktivstatus- und Passwortänderungen erneuern den Stamp.
  Ein veraltetes Ticket wird bei der nächsten Serverprüfung verworfen.
- Der ASP.NET-Core-Antiforgery-Dienst liefert ein datensparsames Requesttoken.
  Jeder zustandsändernde Cookie-Endpunkt validiert Cookie und Header
  `X-Cemaris-CSRF`; Referer-Prüfungen ersetzen dies nicht.
- Fachzugriffe nutzen benannte Policies. Erzwungener Passwortwechsel sperrt
  die Fach- und Administrationspolicies, lässt aber eigenes Konto,
  Passwortwechsel und Abmeldung erreichbar.
- Login wird zusätzlich pro Clientadresse begrenzt. `401` und `403` sind
  Statuscodes ohne HTML-Weiterleitung.

## Folgen

Das Frontend sendet Cookies ausschließlich mit `credentials: include` und
speichert weder Sitzung noch CSRF-Token persistent. Datenbankverfügbarkeit ist
für Sitzungsgültigkeit und lokale Konten erforderlich. Produktiver TLS-/Proxy-
Betrieb, Schlüsselringpersistenz, Backup, Monitoring und Secret Store bleiben
vor einer Betriebsfreigabe festzulegen.
