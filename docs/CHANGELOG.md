# Changelog & recent features

This file summarizes **notable plugin and API behaviour** that may not fit in the short README tables. The full user guide remains **[README.md](../README.md)** (English and German in one file).

---

## 🇬🇧 English

### Core app (2026-05) — post-beta

| Topic | Change |
|--------|--------|
| **Legacy API removed** | Old paths (`/api/weather`, `/api/calendar/*`, `/api/mail/*`, …) removed. Use **`/api/plugins/<id>/…`** only. Requires **new app image**. |

### Core app (2026-05)

| Topic | Change |
|--------|--------|
| **Public kiosk `/kiosk`** | View-only wall-tablet URL without admin login; optional password & session duration. Admin: **Settings → Users → Kiosk**. Edit widgets on `/dashboard/<id>`. |
| **TOTP 2FA** | Authenticator apps — **Settings → Users**; enforced at login when enabled. |
| **Multi-user UI** | Password change, 2FA, and kiosk moved to **Settings → Users**. |
| **Design backgrounds** | **Settings → Design**: navbar wallpaper; dashboard background **off / single / dual** (JPG/PNG/WebP, overlay %). Persisted in `dashboard.json`. |
| **`/api/plugins/weather/*`** | Server proxy for Open-Meteo geocode + forecast (hourly + daily). Required for current Weather plugin. |
| **Settings modal** | Fixed width `720px`; log list scrolls internally. |

### Weather plugin **1.3.x**

| Topic | Change |
|--------|--------|
| **Day blocks** | Under current summary: temps for **0–6**, **6–12**, **12–18**, **18–24** (today, from hourly API). |
| **7-day strip** | Shows **next 7 days starting tomorrow** (API `forecast_days=8`, skips index 0). |
| **Removed** | Full-width hourly timeline that replaced the 7-day view in 1.3.0. |

### Unraid plugin **1.5.x**

| Topic | Change |
|--------|--------|
| **Version** | Targets **Unraid 7.2+** GraphQL (not 7.3-only). |
| **Disks** | Pool/cache rows; optional suffix: role / `fsType` / comment. |
| **Browser** | Direct `fetch` to `https://NAS/graphql` — **CORS** must allow your dashboard origin per NAS. |

---

## 🇩🇪 Deutsch

### Kern-App (2026-05) — nach Beta

| Thema | Änderung |
|--------|----------|
| **Legacy-API entfernt** | Alte Pfade (`/api/weather`, `/api/calendar/*`, `/api/mail/*`, …) entfernt. Nur noch **`/api/plugins/<id>/…`**. **Neues App-Image** nötig. |

### Kern-App (2026-05)

| Thema | Änderung |
|--------|----------|
| **Öffentlicher Kiosk `/kiosk`** | Nur-Ansicht fürs Wand-Tablet ohne Admin-Login; optional Passwort & Sitzungsdauer. Admin: **Einstellungen → Benutzer → Kiosk**. Bearbeiten unter `/dashboard/<id>`. |
| **TOTP 2FA** | Authenticator-Apps — **Einstellungen → Benutzer**; beim Login wenn aktiv. |
| **Mehrbenutzer-UI** | Passwort, 2FA, Kiosk unter **Einstellungen → Benutzer**. |
| **Hintergrundbilder** | **Einstellungen → Design**: Navbar + Dashboard (**Aus / 1 / 2 Bilder**, Overlay). In `dashboard.json`. |
| **`/api/plugins/weather/*`** | Server-Proxy für Open-Meteo (Geocoding + Forecast). |
| **Einstellungs-Dialog** | Feste Breite; Protokoll-Liste scrollt intern. |

### Wetter-Plugin **1.3.x**

| Thema | Änderung |
|--------|----------|
| **Tagesabschnitte** | Unter aktuellem Wetter: **0–6**, **6–12**, **12–18**, **18–24**. |
| **7-Tage** | Ab **morgen** (8 API-Tage, heute ausgeblendet). |
| **Entfernt** | Stündliche Gesamt-Leiste aus 1.3.0. |

### Unraid-Plugin **1.5.x**

| Thema | Änderung |
|--------|----------|
| **Version** | **Unraid 7.2+** GraphQL (nicht nur 7.3). |
| **Disks** | Pool/Cache; Zusatz-Label: Rolle / `fsType` / Kommentar. |
| **Browser** | Direkt `https://NAS/graphql` — **CORS** pro NAS für Dashboard-Origin. |

---

## 🇬🇧 English (older entries)

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

## 🇩🇪 Deutsch (ältere Einträge)

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

### FRITZ! smart plug energy (`fritz-energy`) **1.1.x**

| Topic | Description |
|--------|-------------|
| **Data** | TR-064 Homeauto via **`POST /api/fritz-energy`**; current W, today / 7 days / month kWh; history under `data/fritz-energy/`. |
| **Widget** | Grid (2×2 fill) or carousel; optional compact UI; silent background refresh (no “Updating…” flash). |
| **Setup** | AIN + same TR-064 credentials as WAN plugin; Smart Home rights on the FRITZ!Box user. |

**DE:** Steckdose Energie im Image — README **FRITZ! Steckdose Energie**.

---

### Kiosk mode (core)

| Topic | Description |
|--------|-------------|
| **Settings** | **General → Kiosk mode** — auto-hide navbar after **3–60 s** idle (default **5**). |
| **UI** | Hidden bar uses `translateY` (no layout gap); widgets start at the top. |
| **Reveal** | Accent **Menu** / **Leiste** button only — not mouse over widgets. Edit mode keeps the bar visible. |

**DE:** README **Kiosk-Modus (Wand-Tablet)**.

---

### AdGuard Home **1.1.6**

2×2 stat tiles stretch to full widget height (no empty band at the bottom).

**DE:** Kacheln füllen die Widget-Höhe.

---

## Plugin versions (reference)

Builtin plugin `meta.version` values in the repo (see each `plugins/<id>/index.tsx`):

| Plugin | Version (approx.) |
|--------|-------------------|
| Docker | 1.7.9 |
| FRITZ!Box Internet | 2.4.3 |
| FRITZ! Steckdose Energie | 1.1.3 |
| Calendar | 1.4.2 |
| Bookmarks | 1.6.0 |
| Unraid Docker | 0.4.4 |
| Iframe | 2.1.4 |
| Weather | 1.2.3 |
| AdGuard Home | 1.1.6 |
| Clock | 1.2.1 |
| Unraid | 1.5.3 |
| Emby | 1.0.3 |
| Scratchpad | 1.1.1 |

*(Versions ship with the Docker image; bump dates are git history.)*
