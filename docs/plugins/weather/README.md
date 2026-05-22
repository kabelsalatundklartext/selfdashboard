# Plugin: Weather (`weather`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Open-Meteo** — Stadt oder PLZ, **kein API-Key**. Aktuelles Wetter mit **vier Tagesabschnitten** (0–6, 6–12, 12–18, 18–24 Uhr) und optional **7-Tage-Vorschau** (ab morgen, ohne heute doppelt).

### Installation

Plugin-Store → **Wetter** → **Strg+F5** → Ort in **⚙️**.

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **Stadt / PLZ** | z. B. `Berlin`, `10115` |
| **Land** | Optional `DE` für PLZ |
| **Intervall** | Minuten |
| **7-Tage-Vorschau** | Ein/Aus, Kartenbreite % |
| **Ort anzeigen** | Ein/Aus |

### Technik

- Abruf über **`/api/weather`** (Server-Proxy zu Open-Meteo) — der **SelfDashboard-Container** braucht ausgehendes HTTPS-Internet  
- Stündliche Werte nur für die **Tagesabschnitte**; die 7-Tage-Leiste nutzt `daily` (8 Tage API, Tag 0 = heute wird ausgeblendet)  
- Config in **`dashboard.json`**

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Ort nicht gefunden | Schreibweise, Ländercode |
| **HTTP 404** `/api/weather` | **Neues App-Docker-Image** (Kern-Route) |
| Keine Daten | Internet/DNS am **Container**; Test-URL im [Haupt-README](../../../README.md#troubleshooting) |

---

## English

### Summary

**Open-Meteo** — city or postal code, **no API key**. Current weather with **four day blocks** (0–6, 6–12, 12–18, 18–24) and optional **7-day** forecast (from tomorrow; today omitted).

### Installation

Plugin Store → **Weather** → **Ctrl+F5** → location in **⚙️**.

### Setup (widget ⚙️)

| Field | Notes |
|-------|-------|
| **City / ZIP** | e.g. `Berlin`, `10115` |
| **Country** | Optional `DE` for ZIP |
| **Interval** | Minutes |
| **7-day forecast** | On/off, card width % |
| **Show place** | On/off |

### Technical notes

- Fetched via **`/api/weather`** (server proxy to Open-Meteo) — **SelfDashboard container** needs outbound HTTPS  
- Hourly data powers **day blocks**; 7-day strip uses `daily` (8 API days; index 0 = today is hidden)  
- Config in **`dashboard.json`**

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Location not found | Spelling, country code |
| **HTTP 404** on `/api/weather` | **New app Docker image** (core route) |
| No data | Container internet/DNS; see main [README troubleshooting](../../../README.md#troubleshooting) |
