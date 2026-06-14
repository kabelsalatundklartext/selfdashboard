# Plugin: FRITZ! Smart Home (`fritz-smarthome`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**FRITZ!DECT-Smart-Home** über das **AHA-HTTP-Interface**: Heizkörper-Thermostate (Soll-Temp, Aus/An), Steckdosen (an/aus + Watt), Fensterkontakte und Sensoren (Temperatur/Luftfeuchte). **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **FRITZ!Box-URL** | z. B. `http://fritz.box` oder IP |
| **Benutzer / Passwort** | eigener Box-Benutzer mit Recht **Smart-Home**; ab FRITZ!OS 7.24 ist der Benutzername Pflicht |
| **Aktualisieren** | Intervall in Sek. |

Passwort wird **verschlüsselt** gespeichert. Login per **PBKDF2-Challenge** (SID).

### Bedienung

- Thermostat: −/+ setzt Soll-Temp; unter Minimum = Aus (Frostschutz)
- Steckdose: an/aus, aktueller Verbrauch in Watt
- Kontakte/Sensoren: Status, Messwerte

### API

`POST /api/plugins/fritz-smarthome` — `action: state|set`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login abgelehnt | Benutzer/Passwort, Smart-Home-Recht prüfen |
| Keine Geräte | DECT-Geräte an der Box angemeldet? |

---

## English

### Summary

**FRITZ!DECT smart home** via the **AHA-HTTP interface**: radiator thermostats (target temp, off/on), smart plugs (on/off + watts), window contacts and sensors (temperature/humidity). **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **FRITZ!Box URL** | e.g. `http://fritz.box` or IP |
| **User / password** | dedicated box user with **Smart Home** permission; FRITZ!OS 7.24+ requires the username |
| **Refresh** | interval in seconds |

Password stored **encrypted**. Login via **PBKDF2 challenge** (SID).

### Controls

- Thermostat: −/+ sets target; below minimum = off (frost protection)
- Plug: on/off, current power in watts
- Contacts/sensors: state, readings

### API

`POST /api/plugins/fritz-smarthome` — `action: state|set`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Login rejected | Check user/password and Smart Home permission |
| No devices | DECT devices paired with the box? |
