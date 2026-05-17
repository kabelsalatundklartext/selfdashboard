# Changelog & recent features

This file summarizes **notable plugin and API behaviour** that may not fit in the short README tables. The full user guide remains **[README.md](../README.md)** (English and German in one file).

---

## 🇬🇧 English

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
| **API** | Unified under **`/api/calendar/*`**: `accounts`, `events`, `calendars`, `sync`, `status`, `summary`, `conflicts` (no separate `calendar-ics` / `calendar-caldav` routes). |
| **ICS / Webcal** | Read-only feeds via account type **ICS**; server-side fetch (no browser CORS; LAN URLs work). |
| **CalDAV** | Two-way accounts: Basic auth; sync via **`POST /api/calendar/accounts/[id]/sync`** (GET/REPORT as needed, e.g. Nextcloud, Synology). |
| **Storage** | `data/calendar/` on the server; credentials encrypted (AES-256-GCM). |
| **Widget** | Month/week views, day panel, local events; background sync (`CALENDAR_SYNC_INTERVAL_SECONDS`, default 5 min). |

---

### Selfstream plugin **1.0.x**

| Topic | Description |
|--------|-------------|
| **Data** | Active IPTV sessions from Selfstream admin via **`POST /api/selfstream`**. |
| **Widget** | Lists live streams (user, channel/program, duration); optional client IP; configurable refresh interval. |
| **Auth** | Admin password in plugin settings; proxied server-side (not stored in the central error log). |

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
| **API** | Einheitlich unter **`/api/calendar/*`**: `accounts`, `events`, `calendars`, `sync`, `status`, `summary`, `conflicts` (keine separaten Routen `calendar-ics` / `calendar-caldav`). |
| **ICS / Webcal** | Nur-Lese-Feeds über Kontotyp **ICS**; serverseitiger Abruf (kein CORS im Browser; LAN-URLs möglich). |
| **CalDAV** | Zwei-Wege-Konten: Basic-Auth; Sync über **`POST /api/calendar/accounts/[id]/sync`** (GET/REPORT je nach Server, z. B. Nextcloud, Synology). |
| **Speicher** | `data/calendar/` auf dem Server; Zugangsdaten verschlüsselt (AES-256-GCM). |
| **Widget** | Monat/Woche, Tagespanel, lokale Termine; Hintergrund-Sync (`CALENDAR_SYNC_INTERVAL_SECONDS`, Standard 5 min). |

---

### Selfstream-Plugin **1.0.x**

| Thema | Beschreibung |
|--------|----------------|
| **Daten** | Aktive IPTV-Sessions aus dem Selfstream-Admin über **`POST /api/selfstream`**. |
| **Widget** | Liste laufender Streams (Nutzer, Sender/Sendung, Laufzeit); optional Client-IP; Aktualisierungsintervall einstellbar. |
| **Auth** | Admin-Passwort in den Plugin-Einstellungen; serverseitiger Proxy (nicht im zentralen Protokoll gespeichert). |

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
