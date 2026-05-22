# Plugin: Pi-hole (`pihole`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Pi-hole v6**-Statistik: Anfragen, blockiert, Anteil, Listen. **Blocking** per Klick umschaltbar.

### Installation

Plugin-Store → **Pi-hole** → **Strg+F5** → **⚙️** API-URL + **App-Passwort** (v6).

### Einrichtung

| Feld | Hinweis |
|------|---------|
| **API-URL** | z. B. `http://192.168.1.10` — `/admin` wird entfernt |
| **App-Passwort** | Pi-hole v6 API settings |
| **Intervall** | Sekunden |

### API

`POST /api/pihole`

### Fehlerbehebung

401 → neues App-Passwort. HTTPS → ggf. HTTP im LAN.

**Protokoll:** Filter `pihole`.

---

## English

### Summary

**Pi-hole v6** stats: queries, blocked, percentage, lists. Toggle **blocking** from the widget.

### Installation

Plugin Store → **Pi-hole** → **Ctrl+F5** → **⚙️** API URL + **app password** (v6).

### Setup

| Field | Notes |
|-------|-------|
| **API URL** | e.g. `http://192.168.1.10` — `/admin` stripped if present |
| **App password** | From Pi-hole v6 API settings |
| **Interval** | Seconds |

### API

`POST /api/pihole`

### Troubleshooting

401 → regenerate app password. HTTPS issues → try HTTP on LAN.

**Logs:** filter `pihole`.
