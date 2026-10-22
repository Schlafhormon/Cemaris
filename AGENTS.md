# Cemaris: Arbeitsanweisung für jede Session

## Einstieg

Vor Änderungen in dieser Reihenfolge lesen:

1. `../README.md`, sofern auf diesem Host vorhanden.
2. `README.md` – Produkt und technische Grundlage.
3. `docs/portierung/STATUS.md` – tatsächlicher Stand und nächster Auftrag.
4. `docs/portierung/PLAN.md` – aktiver Schritt und historische Portierung.
5. Den jüngsten Abschlussbericht; bei Betriebsänderungen zusätzlich
   `docs/SERVER_DEPLOYMENT.md` und `docs/DEPLOYMENT.md`.

Die 1:1-Portierung ist abgeschlossen. Cemaris wird seit Schritt 18 als
Friedhofsverwaltung für deutsche Kommunen weiterentwickelt. Der aktuelle
Nutzerauftrag hat Vorrang vor historischen Paritätsvorgaben. EDWALT ist ein
separater Migrationsauftrag und wird nicht stillschweigend begonnen.

## Umsetzung

- Python/FastAPI, SQLAlchemy, Alembic, pyodbc; React/TypeScript/Vite;
  externer Microsoft SQL Server. Tatsächlich verwendete Abhängigkeiten sperren.
- Deutsch ist die Standardsprache, Englisch bleibt unterstützt; Euro und
  deutsche Datums-/Adresskonventionen sowie A4 für Standarddrucke verwenden.
  Keine örtliche Satzung, Nutzungsdauer oder Gebühr ohne Auftrag erfinden.
- ConsignO, Dynamics GP/Diamond, Sunrise-Portal, Find a Grave und ntfy wurden
  auf ausdrücklichen Auftrag entfernt. Nicht aus der Referenz wiederherstellen.
- Historische Migrationen nicht verändern. Bestandsänderungen erhalten eine
  eigene Alembicrevision. Unbenutzte Altschemaspalten bleiben bis zu einem
  gesondert dokumentierten Konsolidierungsschritt bestandsverträglich erhalten.
- Anwendungsdaten und fremde Änderungen erhalten. Keine Produktiv- oder
  Verwaltungsdatenbank als Testfixture verwenden. Datenbanknachweise gegen
  eine eigene entbehrliche SQL-Server-Instanz; SQLite ist kein Ersatz.
- Nur synthetische Beispieldaten verwenden. Logo und Icon im Repository und
  in gebauten Artefakten mitführen. Sunrise-Lizenz-/Copyright-Hinweise erhalten.
- Die optionale Referenz `../Sunrise-Referenz` bleibt am Commit
  `451ce034863b16502484367044f3e9b65370111a` unverändert. Sie ist Herkunftsbeleg,
  keine erneute Vorgabe entfernter Funktionen.
- Subagents dürfen für klar abgegrenzte Aufgaben eingesetzt werden.
  Zuständigkeiten koordinieren und Ergebnisse integrieren.

## Prüfung, Betrieb und Übergabe

Pro Session den ausgewählten Auftrag umsetzen, passend bauen und prüfen.
Testausfälle von bewusst geänderten Produktregeln unterscheiden und beides
nachvollziehbar behandeln. Fehlende Live-Nachweise ausdrücklich benennen.
Fachliche Abläufe mit tatsächlichen Eingaben/Ausgaben prüfen; Platzhalter sind
keine fertigen Funktionen.

Vor einem beauftragten Deployment aktuelle Dienste, Konfiguration und
Sicherungsverfahren beachten. Für SRV-UbuntuApp bleiben bestehende externe
SQL-Sicherungen maßgeblich; zusätzliche SQL-Backup-/Restoreproben hat der
Betreiber abgewählt. Niemals `.env` ausgeben oder mit `source` ausführen.
Keine Volumes löschen, keine Geheimnisse in Git, Logs oder Befehlszeilen.

Zum Abschluss `docs/portierung/berichte/NN.md` mit Änderungen, Quellbelegen,
Prüfbefehlen, Ergebnissen und offenen Punkten schreiben. STATUS samt nächstem
konkreten Auftrag und den Produkt-/Quellnachweis aktualisieren. Ist der
Auftrag unvollständig, bleibt er aktiv; Umfang nachvollziehbar aufteilen.

Zusammengehörige eigene geprüfte Änderungen dürfen lokal mit kurzer englischer
Nachricht committet werden. Ein Push oder Deployment erfolgt nur als Teil des
erteilten Auftrags. Keine organisatorischen Freigabegates einführen.
Nach Abschluss knapp und eigenständig verständlich übergeben; den nächsten
Schritt erst in der nächsten Session beginnen.
