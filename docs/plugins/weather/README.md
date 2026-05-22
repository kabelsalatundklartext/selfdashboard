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

- Server-Logik: **`plugins/weather/server.ts`** → **`/api/plugins/weather/{resolve|geocode|forecast}`** (Proxy zu Open-Meteo)  
- Der **SelfDashboard-Container** braucht ausgehendes HTTPS-Internet  
- Legacy: **`/api/weather?action=…`** leitet auf dieselbe Handler-Logik um (Abwärtskompatibilität)  
- Stündliche Werte nur für die **Tagesabschnitte**; die 7-Tage-Leiste nutzt `daily` (8 Tage API, Tag 0 = heute wird ausgeblendet)  
- Config in **`dashboard.json`**

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Ort nicht gefunden | Schreibweise, Ländercode |
| **`invalid_action`** / alte API | **Neues App-Image** + Wetter-Plugin **≥ 1.4.0** |
| Keine Daten | Internet/DNS am **Container**; Test: `curl …/api/plugins/weather/resolve?name=Berlin&includeHourly=1` |

Test im Container:

```bash
curl -sS "http://127.0.0.1:3000/api/plugins/weather/resolve?name=Berlin&language=de&includeHourly=1&includeDaily=1" | head -c 300
```

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

- Server: **`plugins/weather/server.ts`** → **`/api/plugins/weather/{resolve|geocode|forecast}`** (Open-Meteo proxy)  
- **SelfDashboard container** needs outbound HTTPS  
- Legacy **`/api/weather?action=…`** forwards to the same handler  
- Hourly data powers **day blocks**; 7-day strip uses `daily` (8 API days; index 0 = today is hidden)  
- Config in **`dashboard.json`**

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Location not found | Spelling, country code |
| **`invalid_action`** / old API | **New app image** + weather plugin **≥ 1.4.0** |
| No data | Container internet/DNS; test `curl …/api/plugins/weather/resolve?name=Berlin&includeHourly=1` |
