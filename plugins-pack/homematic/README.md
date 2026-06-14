# Plugin: Homematic / RaspberryMatic (`homematic`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Steuert **Homematic / RaspberryMatic** per **JSON-RPC**: Heizungsthermostate (Soll-Temp + Auto/Manuell/Boost), Schalter, Dimmer (an/aus + Farbe), Fensterkontakte, Sensoren, Systemvariablen und Programme. Automatische Gruppierung **nach CCU-Raum** (per Drag-and-Drop sortierbar, mehrspaltig), Geräte umbenennbar. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **CCU-Adresse** | IP/Host der CCU/RaspberryMatic |
| **Benutzer / Passwort** | CCU-Login — **verschlüsselt** gespeichert |
| **Geräte / Variablen / Programme** | im Plugin auswählen |
| **Spalten / Bearbeiten** | mehrspaltig; im Bearbeitungsmodus Räume per Drag-and-Drop sortieren |

Werte kommen von der CCU als Strings und werden serverseitig korrekt typisiert (z. B. HUE = integer).

### API

`POST /api/plugins/homematic` — `action: list|state|set` (Session.login → Device/Interface/Room/SysVar/Program).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login-Fehler | CCU-Benutzer/Passwort, Erreichbarkeit |
| Keine Räume | Geräte in der CCU einem Raum zugewiesen? |

---

## English

### Summary

Controls **Homematic / RaspberryMatic** via **JSON-RPC**: heating thermostats (target temp + Auto/Manual/Boost), switches, dimmers (on/off + colour), window contacts, sensors, system variables and programs. Auto-grouped **by CCU room** (drag-and-drop sortable, multi-column), devices renamable. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **CCU address** | IP/host of the CCU/RaspberryMatic |
| **User / password** | CCU login — stored **encrypted** |
| **Devices / variables / programs** | pick inside the plugin |
| **Columns / edit** | multi-column; sort rooms via drag-and-drop in edit mode |

The CCU returns values as strings; the server coerces types correctly (e.g. HUE = integer).

### API

`POST /api/plugins/homematic` — `action: list|state|set` (Session.login → Device/Interface/Room/SysVar/Program).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Login error | Check CCU user/password and reachability |
| No rooms | Devices assigned to a room in the CCU? |
