# Homematic (RaspberryMatic) — Beta

Steuert und zeigt Homematic-/RaspberryMatic-Geräte über die **eingebaute JSON-RPC-API** der CCU (`/api/homematic.cgi`). Anmeldung per CCU-Benutzer + Passwort — kein zusätzliches Addon nötig, und nicht jeder im Netz kann zugreifen.

## Was es kann

- **Heizung steuern:** Thermostate mit Ist-Temperatur, Fensterstatus, Ventil-% und **Soll-Temperatur per − / +**, dazu **Auto / Manuell / Boost** (HmIP über `CONTROL_MODE` + `BOOST_MODE`).
- **Schalten & dimmen:** Schaltaktoren (an/aus), Dimmer (Helligkeits-Slider **+ An/Aus**) und **RGBW-Farbe** (Farbwähler, HUE+SATURATION zusammen via `putParamset`).
- **Fensterkontakte:** „Offen / Zu" mit Icon (offenes vs. geschlossenes Fenster), statt eines Schalters.
- **Sensoren anzeigen:** Temperatur, Luftfeuchte, Helligkeit, Leistung usw.
- **Systemvariablen** mit Wert/Einheit und **Programme** per Knopfdruck starten.

## Räume & Layout

- **Automatische Räume:** Geräte werden nach deinen **RaspberryMatic-Räumen** (`Room.getAll`) gruppiert — kein manuelles Sortieren.
- **„Alle Geräte übernehmen (nach Raum)"** in den Einstellungen: ein Klick, und alle Geräte sind pro Raum drin.
- **Räume per Drag-and-Drop sortieren** im Bearbeiten-Modus des Dashboards.
- **Spalten-Layout:** Räume 1 / 2 / 3 / Auto nebeneinander.
- **Geräte umbenennen:** eigene Namen pro Gerät (überleben „Alle Geräte übernehmen").

## Einrichtung

1. **Eigenen Benutzer anlegen (empfohlen):** In RaspberryMatic unter *Einstellungen → Benutzerverwaltung* einen eigenen, eingeschränkten Benutzer nur fürs Dashboard erstellen.
2. Im Widget unter *Einstellungen* eintragen:
   - **CCU-Adresse** — IP oder Hostname der RaspberryMatic (z. B. `192.168.1.40`)
   - **Benutzer** und **Passwort**
3. Auf **Neu laden** klicken — das Widget lädt alle Geräte/Kanäle (nach Raum gruppiert), Systemvariablen und Programme.
4. Per Häkchen auswählen oder **„Alle Geräte übernehmen"**. Mit dem Filter schnell suchen.

Das Passwort wird **verschlüsselt** gespeichert (`SELFDASHBOARD_SECRET_KEY`). Der Zugriff erfolgt ausschließlich serverseitig (SSRF-geschützt).

## Hinweise (Beta)

- Erkennung über die Datenpunkte: Soll-Temperatur → Thermostat; `LEVEL` → Dimmer; schaltbares `STATE` → Schalter; Kontakt-Gerätetypen (SWDM, SCI …) → Fensterstatus.
- Auto/Manuell ist für **HmIP** umgesetzt; klassische HM-CC-RT-DN nutzen `AUTO_MODE`/`MANU_MODE`.
- Werte werden je Abfrage über `Interface.getParamset` gelesen; bei sehr vielen Kanälen entsprechend mehr Anfragen — Aktualisierungsintervall ggf. erhöhen.

API: `POST /api/plugins/homematic` (Aktionen `list`, `state`, `set` mit `kind` = `device` / `multi` / `program`).
