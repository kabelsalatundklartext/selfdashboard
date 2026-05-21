# Plugin: Weather (`weather`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Open-Meteo** — Stadt oder PLZ, **kein API-Key**. Aktuelles Wetter + optional **stündlicher Tagesverlauf**.

### Installation

Plugin-Store → **Wetter** → **Strg+F5** → Ort in **⚙️**.

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **Stadt / PLZ** | z. B. `Berlin`, `10115` |
| **Land** | Optional `DE` für PLZ |
| **Intervall** | Minuten |
| **Tagesverlauf** | Stündlich ein/Aus, Kartenbreite % |
| **Ort anzeigen** | Ein/Aus |

### Technik

- Abruf über **`/api/weather`** (Server-Proxy zu Open-Meteo) — der **SelfDashboard-Container** braucht ausgehendes HTTPS-Internet, nicht zwingend der Browser  
- Config nur in **`dashboard.json`**

### Fehlerbehebung

Ort nicht gefunden → Schreibweise, Ländercode. Keine Daten → Internet/DNS am Client.

---

## English

### Summary

**Open-Meteo** — city or postal code, **no API key**. Current weather + optional **hourly timeline**.

### Installation

Plugin Store → **Weather** → **Ctrl+F5** → location in **⚙️**.

### Setup (widget ⚙️)

| Field | Notes |
|-------|-------|
| **City / ZIP** | e.g. `Berlin`, `10115` |
| **Country** | Optional `DE` for ZIP |
| **Interval** | Minutes |
| **Timeline** | Hourly on/off, card width % |
| **Show place** | On/off |

### Technical notes

- Fetched via **`/api/weather`** (server proxy to Open-Meteo) — **SelfDashboard container** needs outbound HTTPS, not necessarily the browser  
- Config only in **`dashboard.json`**

### Troubleshooting

Location not found → spelling, country code. No data → client internet/DNS.
