# Homematic (RaspberryMatic) — Beta

Steuert und zeigt Homematic-/RaspberryMatic-Geräte über die **eingebaute JSON-RPC-API** der CCU (`/api/homematic.cgi`). Anmeldung per CCU-Benutzer + Passwort — kein zusätzliches Addon nötig, und nicht jeder im Netz kann zugreifen.

## Was es kann

- **Geräte schalten/dimmen:** Schaltaktoren (an/aus) und Dimmer (Helligkeit) direkt im Widget.
- **Sensoren anzeigen:** Temperatur, Luftfeuchte, Helligkeit, Leistung usw.
- **Systemvariablen anzeigen:** ausgewählte Variablen mit Wert und Einheit.
- **Programme starten:** ausgewählte CCU-Programme per Knopfdruck.

## Einrichtung

1. **Eigenen Benutzer anlegen (empfohlen):** In RaspberryMatic unter *Einstellungen → Benutzerverwaltung* einen eigenen, eingeschränkten Benutzer nur fürs Dashboard erstellen.
2. Im Widget unter *Einstellungen* eintragen:
   - **CCU-Adresse** — IP oder Hostname der RaspberryMatic (z. B. `192.168.1.40`)
   - **Benutzer** und **Passwort**
3. Auf **Neu laden** klicken — das Widget lädt alle Geräte/Kanäle, Systemvariablen und Programme.
4. Per Häkchen auswählen, was angezeigt werden soll. Mit dem Filter schnell suchen.

Das Passwort wird **verschlüsselt** gespeichert (`SELFDASHBOARD_SECRET_KEY`). Der Zugriff erfolgt ausschließlich serverseitig.

## Hinweise (Beta)

- Geräte mit `LEVEL` werden als Dimmer (Slider), Geräte mit schaltbarem `STATE` als Schalter dargestellt.
- Fensterkontakte u. ä. melden ebenfalls `STATE` — sie erscheinen als Schalter, der den Zustand spiegelt.
- Die Werte werden je Abfrage über `Interface.getParamset` gelesen; bei sehr vielen ausgewählten Kanälen entsprechend mehr Anfragen.

API: `POST /api/plugins/homematic` (Aktionen `list`, `state`, `set`).
