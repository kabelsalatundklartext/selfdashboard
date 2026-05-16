# Changelog & recent features

This file summarizes **notable plugin and API behaviour** that may not fit in the short README tables. The full user guide remains **[README.md](../README.md)** (English and German in one file).

---

## 🇬🇧 English

### CrowdSec plugin **2.0.0**

| Topic | Description |
|--------|-------------|
| **Plugin ID** | `crowdsec` (legacy `crowdsec-threat-map` is migrated automatically in stored dashboards). |
| **Data** | Direct read of **`crowdsec.db`** via `GET /api/crowdsec` — no threat-map-docker / exporter proxy. |
| **Unraid** | Optional volume: host `…/appdata/crowdsec/data` → `/crowdsec-data` (read-only). |
| **UI** | World map, live feed, themes; map/sidebar toggles. All plugin code under `plugins/crowdsec/`. |

---

### Docker plugin **1.7.9** (core: `src/lib/dockerEngine.ts`)

| Topic | Change |
|--------|--------|
| **RAM** | Matches **`docker stats`** / Docker CLI: working set = `memory_stats.usage` minus page cache (`total_inactive_file` on cgroup v1, `inactive_file` on v2). Aligns better with Unraid’s Docker tab and other UIs that follow the same rule — not raw cgroup `usage`. |
| **CPU %** | Same delta formula as the Engine / CLI. Ignores samples where the `system_cpu_usage` delta is **&lt; 10 ms** (nanoseconds threshold) to avoid meaningless spikes from ultra-short windows. |
| **Stats HTTP call** | Prefers `GET /containers/{id}/stats?stream=false&one-shot=false` so the daemon can populate **`precpu_stats`** for a valid CPU delta. If the daemon returns **HTTP 400** (very old engines), falls back to `stream=false` only. |

**APIs (unchanged paths):** `GET /api/docker-containers?…&stats=1`, `POST /api/docker-container-stats` — response shape unchanged; numeric **RAM** values may differ from pre-1.7.9 builds because of the definition above.

---

### Calendar plugin **1.4.x**

| Topic | Description |
|--------|-------------|
| **ICS / Webcal** | Server-side fetch via **`POST /api/calendar-ics`** (no browser CORS; LAN URLs work). |
| **CalDAV** | **`POST /api/calendar-caldav`**: Basic auth; tries **GET** (ICS export) then **REPORT** `calendar-query` where needed (e.g. Nextcloud, Synology). |
| **Shared code** | URL/window handling shared between ICS and CalDAV routes where applicable. |
| **Widget** | Month/week views, local events, configurable refresh interval for remote feeds. |

---

### FRITZ!Box WAN throughput plugin **2.3.x**

| Topic | Description |
|--------|-------------|
| **Data** | TR-064 byte counters via **`POST /api/fritzbox`**; optional **`lite: true`** for counter-only updates. |
| **History** | Last chart points cached in **`localStorage`** (per base URL + username), up to **7 days**, so the chart is not empty after reload. |
| **Layout & UI** | Vertical vs horizontal layout; toggles for title, legend, live values, chart, time-axis hint, stat tiles. |
| **Plot height** | **`0`** = default **168 px**; **`1–220`** = exact height in pixels. |
| **Y-axis** | **`0` Mbit/s max** = auto scale from data; fixed max caps the scale. |
| **Sanity cap** | Optional max measured rate (Mbit/s) for both directions; **`0`** uses TR-064 Layer1 hints + small headroom where available. |
| **Polling** | Full TR-064 interval **0–300 s** (`0` = only on dashboard load); **live counter** interval **0** or **3–15 s** for smoother curves. |
| **Language** | Auto / German / English for UI strings. |

---

## 🇩🇪 Deutsch

### CrowdSec-Plugin **2.0.0**

| Thema | Beschreibung |
|--------|----------------|
| **Plugin-ID** | `crowdsec` (alte `crowdsec-threat-map` wird in gespeicherten Dashboards automatisch umgestellt). |
| **Daten** | Direkt **`crowdsec.db`** über `GET /api/crowdsec` — kein threat-map-docker / Exporter. |
| **Unraid** | Optionales Volume: Host `…/appdata/crowdsec/data` → `/crowdsec-data` (read-only). |
| **UI** | Weltkarte, Live-Feed, Themes; Karte/Seitenleiste ausblendbar. Gesamter Plugin-Code unter `plugins/crowdsec/`. |

---

### Docker-Plugin **1.7.9** (Kern: `src/lib/dockerEngine.ts`)

| Thema | Änderung |
|--------|----------|
| **RAM** | Entspricht **`docker stats`** / Docker-CLI: nutzbarer Speicher = `memory_stats.usage` minus Datei-Cache (`total_inactive_file` bei cgroup v1, `inactive_file` bei v2). Passt besser zur Unraid-Docker-Ansicht und ähnlichen Oberflächen — nicht der rohe cgroup-`usage`-Wert. |
| **CPU-%** | Gleiche Delta-Formel wie Engine/CLI. Messungen mit `system_cpu_usage`-Delta **&lt; 10 ms** werden verworfen, um sinnlose Spitzen zu vermeiden. |
| **Stats-HTTP-Aufruf** | Bevorzugt `GET …/stats?stream=false&one-shot=false`, damit **`precpu_stats`** zuverlässig gefüllt ist. Bei **HTTP 400** (sehr alte Daemons) Fallback nur `stream=false`. |

**APIs:** `GET /api/docker-containers?…&stats=1`, `POST /api/docker-container-stats` — gleiche Pfade und Felder; **RAM-Zahlen** können sich gegenüber älteren Builds ändern (siehe Definition oben).

---

### Kalender-Plugin **1.4.x**

| Thema | Beschreibung |
|--------|----------------|
| **ICS / Webcal** | Serverseitig über **`POST /api/calendar-ics`** (kein CORS im Browser; LAN-URLs möglich). |
| **CalDAV** | **`POST /api/calendar-caldav`**: Basic-Auth; zuerst **GET** (ICS-Export), sonst **REPORT** `calendar-query` (z. B. Nextcloud, Synology). |
| **Gemeinsame Logik** | URL/Zeitfenster u. a. zwischen ICS- und CalDAV-Route geteilt. |
| **Widget** | Monat/Woche, lokale Termine, Aktualisierungsintervall für externe Feeds. |

---

### Fritzbox-Plugin **2.3.x** (Internet-Verlauf)

| Thema | Beschreibung |
|--------|----------------|
| **Daten** | TR-064-Bytezähler über **`POST /api/fritzbox`**; optional **`lite: true`** nur für Zähler. |
| **Verlauf** | Kurvenpunkte im **`localStorage`** (pro Basis-URL + Benutzer), bis **7 Tage**. |
| **Layout & UI** | Vertikal/waagerecht; Schalter für Überschrift, Legende, Live-Werte, Kurve, Zeitachsen-Hinweis, Stat-Karten. |
| **Plot-Höhe** | **`0`** = Standard **168 px**; **`1–220`** = exakte Pixelhöhe. |
| **Y-Achse** | **`0` Mbit/s** = aus Daten; fester Wert = oben begrenzt. |
| **Ausreißer** | Optional **Max. Messrate (Mbit/s)**; **`0`** = Layer1-Hinweise von der Box + Puffer. |
| **Abfragen** | Voller TR-064-Takt **0–300 s**; **Zähler-Takt** **0** oder **3–15 s**. |
| **Sprache** | Auto / Deutsch / Englisch. |

---

## Plugin versions (reference)

Builtin plugin `meta.version` values in the repo (see each `plugins/<id>/index.tsx`):

| Plugin | Version (approx.) |
|--------|-------------------|
| Docker | 1.7.9 |
| FRITZ!Box | 2.3.7 |
| Calendar | 1.4.2 |
| Bookmarks | 1.6.0 |
| Unraid Docker | 0.4.4 |
| Iframe | 2.1.4 |
| Weather | 1.2.0 |
| AdGuard Home | 1.1.2 |
| Clock | 1.2.1 |
| Unraid | 1.5.3 |
| Emby | 1.0.3 |
| Scratchpad | 1.1.1 |

*(Versions ship with the Docker image; bump dates are git history.)*
