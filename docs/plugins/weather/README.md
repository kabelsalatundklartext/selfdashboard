# Weather-Plugin

Open-Meteo-Proxy ohne API-Key. Server-Logik: `plugins/weather/server.ts`.

## API

| Aufruf | Beschreibung |
|--------|----------------|
| `GET /api/plugins/weather/resolve?name=…&includeHourly=1&includeDaily=1` | Geocoding + Forecast in einem Request |
| `GET /api/plugins/weather/geocode?name=…` | Nur Geocoding |
| `GET /api/plugins/weather/forecast?latitude=…&longitude=…` | Nur Forecast |

Legacy: `GET /api/weather?action=geocode|forecast|resolve` (Shim).

## Deploy

1. App-Image mit aktuellem `pluginServerLoader` (Handler `weather`).
2. Plugin-Pack Version ≥ **1.5.0** (`npm run publish:plugin-pack`).
3. Hard-Reload im Browser.

Architektur: [PLUGIN_ARCH_BETA.md](../../PLUGIN_ARCH_BETA.md).
