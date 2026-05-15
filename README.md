<p align="center">
  <img src="https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/public/logo.svg" alt="SelfDashboard" height="80"/>
</p>

<p align="center">
  <a href="#english">🇬🇧 English</a> &nbsp;|&nbsp; <a href="#deutsch">🇩🇪 Deutsch</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-00ff88?style=flat-square" alt="license"/>
  <img src="https://img.shields.io/badge/docker-ghcr.io-2496ED?style=flat-square&logo=docker" alt="docker"/>
  <img src="https://img.shields.io/badge/next.js-15-black?style=flat-square&logo=next.js" alt="nextjs"/>
  <img src="https://img.shields.io/badge/platform-Unraid%20%7C%20Docker-orange?style=flat-square" alt="platform"/>
</p>

---

# 🇬🇧 English

## What is SelfDashboard?

SelfDashboard is a clean, modular, self-hosted home dashboard with a powerful plugin system — running as a single Docker container. Manage multiple dashboards, customize every detail, and add widgets for your self-hosted services. Plugins can be developed by anyone and installed later.

## Features

Recent plugin and API changes are summarized in **[docs/CHANGELOG.md](docs/CHANGELOG.md)**.

| Feature | Description |
|---|---|
| 🧩 **Plugin System** | Add, remove and configure widgets for any service |
| 📋 **Multiple Dashboards** | Create unlimited dashboards, each with its own URL (`/dashboard/home`, `/dashboard/server`) |
| 🎨 **6 Color Themes** | Dark, Light, Nord, Catppuccin, Dracula, Solarized |
| 🖌️ **Custom Colors** | Override any color individually per dashboard |
| 🖼️ **Custom Logo** | Upload your own logo per dashboard |
| 🌍 **Multilingual** | German & English interface |
| 🖱️ **Drag & Drop** | Move and resize widgets freely |
| 📐 **Widget Controls** | Per-widget zoom, padding and height adjustments |
| 🔍 **Dashboard Zoom** | Scale the entire dashboard (70%–150%) |
| 📏 **Grid Spacing** | Adjust widget gap and outer padding |
| 🔗 **Navbar Options** | Show icon only, text only, or both — toggle dashboard tabs |
| 🐳 **Single Container** | Next.js 15, no database, no Redis needed |
| 🖥️ **Unraid Ready** | Community Apps template included |

---

## Available Plugins

| Plugin | Category | Description | Status |
|---|---|---|---|
| 🔖 Bookmarks | Utility | Quick links with groups, custom icons, drag & drop, responsive grid or row | ✅ Included |
| 📅 Calendar | Productivity | Month/week view, local events, ICS feeds & CalDAV (server-side) | ✅ Included |
| 🕐 Clock & Date | Utility | Time, date, timezone and city name | ✅ Included |
| 🌤️ Weather | Utility | City or postal code — current conditions (Open-Meteo, no API key) | ✅ Included |
| 🖥️ Unraid | System | CPU, RAM, Array & Pool per GraphQL API | ✅ Included |
| 🎬 Emby | Media | Active sessions — who is watching what | ✅ Included |
| 🐳 Docker | System | Container list via Engine API (socket mount) | ✅ Included |
| 🧱 Unraid Docker | System | Container list via Unraid GraphQL API (no Docker socket on Unraid host) | ✅ Included |
| 🛡️ AdGuard Home | Network | DNS stats & protection (via `/api/adguard`, Basic auth) | ✅ Included |
| 📈 FRITZ!Box Internet | Network | WAN throughput chart from TR-064 byte counters (`POST /api/fritzbox`) | ✅ Included |
| 🖼️ Iframe | Utility | Embed any URL (iframe) or as a link — dashboards, internal tools, maps | ✅ Included |
| 📝 Scratchpad | Utility | Short notes widget, editable in place | ✅ Included |

## Quick Start

### Option 1 — Unraid Community Apps (recommended)

1. Open Community Apps → search for **SelfDashboard**
2. Install and set your port (default: `3000`)
3. Open `http://YOUR-IP:3000`
4. Click **+** to add plugins and start building
5. Done ✓

### Option 2 — Docker run

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(Optional `-v /var/run/docker.sock:…` — Docker widget only; same host as the container. The **`-v …:/app/data`** mount stores **`dashboard.json`** on disk so all browsers share the same configuration.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker widget & Unraid template

- **Shared configuration (`dashboard.json`):** when **`/app/data`** is mounted (Unraid: *Config Storage*), SelfDashboard saves **`dashboard.json`** on the server after changes (`PUT /api/dashboard-state`) and loads it on startup (`GET`). Every browser then sees the same dashboards and widgets; **`localStorage`** remains a fast local cache. **Back up** your host appdata folder. Optional **`SELFDASHBOARD_DATA_DIR`** changes the directory *inside* the container where the file is written (the official image sets **`/app/data`**).
- The **Unraid Community Apps** template (`unraid/selfdashboard.xml`) includes a **Docker Socket** mapping (host `/var/run/docker.sock` → container `/var/run/docker.sock`, read-only), equivalent to `-v /var/run/docker.sock:/var/run/docker.sock`. It is shown **by default** in the template (not hidden under “more settings”). Clear the path if you do not want the Docker widget.
- The **Custom plugins** path is a **bind-mount**: files on the Unraid disk only appear inside the container when that host folder is mapped to `/app/plugins/custom`. The **stock** image does **not** auto-register new TypeScript plugins from that folder — see **Building Your Own Plugin** and rebuild the image (or use a custom image that reads it).
- The Docker plugin uses **`/api/docker-containers`** on the **same machine** where SelfDashboard runs. It talks to the **local** Docker Engine via that socket only.
- **Permission denied (`EACCES`)** on the socket: the container user must be allowed to open the mounted socket (host `root:docker`). The Unraid template sets **`ExtraParams` `--group-add=281`** (common Unraid `docker` GID). If yours differs, run `stat -c '%g' /var/run/docker.sock` on the host and adjust. Newer SelfDashboard images run as **root** in the container so the socket usually works without tuning.
- **Start / stop / restart:** **`POST /api/docker-containers`** (two-step confirmation). Plugin settings: master **Buttons**, then **Start** / **Stop** / **Restart** individually. Anyone who can open the dashboard can trigger actions when the socket is mounted — turn the master off on shared setups.
- **CPU & RAM:** **`GET …&stats=1`** merges **`sdStats`** for running containers. Master **Docker-Stats**, then **CPU** and **RAM** separately; stats requests run only if at least one of CPU/RAM is enabled (while the stats master is on). In the widget, values can appear as **compact bars** (toggle **CPU/RAM als Balken**) or as one-line text; layout is **Name : runtime : stats : actions** on a single row, with the double-confirm panel on a second line when needed.
- **Stats alignment (Docker plugin ≥ 1.7.9):** RAM follows the same rule as **`docker stats`** / Docker Desktop (page cache subtracted: cgroup v1 `total_inactive_file`, v2 `inactive_file`), not raw `memory_stats.usage`. CPU % uses the standard Engine delta formula; very short `system_cpu_usage` sampling windows are ignored to reduce spikes. Stats requests prefer **`stream=false&one-shot=false`** so the daemon can prime **precpu_stats** (falls back to `stream=false` only if the daemon returns HTTP 400).

### Remote / “external” Docker

The current implementation **does not** list containers on **another** server. A Unix socket is **local to one host** and cannot reach Docker on a different machine over the network. Practical options: install SelfDashboard **on** that other host (and mount its socket), or use a separate **HTTP API** (e.g. Portainer) — that would be a different plugin/feature, not the socket-based widget.

---

## Dashboard Management

Each dashboard gets its own URL. Navigate between dashboards via the tab bar in the navbar or through **Settings → Dashboards**.

| Action | How |
|---|---|
| Create dashboard | Settings → Dashboards → New Dashboard |
| Switch dashboard | Click tab in navbar or Settings → Dashboards → Open |
| Hide tab from navbar | Settings → Dashboards → 👁️ toggle per dashboard |
| Delete dashboard | Settings → Dashboards → 🗑️ |
| Rename / change icon | Settings → Dashboards → ✏️ |

---

## Widget Controls

In **Edit Mode** (✏️ button), hover over any widget to see controls:

| Control | Function |
|---|---|
| ⠿ Drag handle | Move widget |
| 🔍 `− 100% +` | Zoom widget content |
| ↔ `− 8 +` | Inner padding |
| ↕ `− 4 +` | Widget height |
| ⚙️ | Plugin settings |
| ✕ | Remove widget |
| Resize grip (corner/edge) | Resize width and height freely |

---

## Bookmarks Plugin

| Feature | Description |
|---|---|
| Groups | Create multiple groups, each collapsible |
| Hide groups | Toggle visibility per group with 👁️ |
| Custom icons | Emoji or upload PNG/JPG image |
| Drag & drop | Reorder apps within and across groups |
| Layout | **Grid** (responsive columns) or **horizontal row** (scroll) |
| Tile width | Min/max width in px; optional **fixed** column width (no stretch-to-fill in grid) |
| New tab | Per-app setting to open in new tab or same tab |

---

## Calendar Plugin

| Feature | Description |
|---|---|
| Views | **Month** (six-week grid) or **week** (single row) |
| Local events | Tap a day to add or edit events (stored with the dashboard) |
| **ICS / Webcal** | Subscribe to secret calendar URLs; fetched **on the server** via `POST /api/calendar-ics` (no browser CORS; works with LAN URLs) |
| **CalDAV** | Nextcloud, Synology, etc.: collection URL + Basic auth; `POST /api/calendar-caldav` tries **GET** (ICS export) then **REPORT calendar-query** |
| Refresh | Shared interval for ICS + CalDAV (minutes, in widget settings) |
| Security note | CalDAV credentials live in **dashboard config** — stored in **`dashboard.json`** under the **`/app/data`** volume when mounted, and mirrored in **localStorage** in each browser. Prefer app passwords and restrict access to the appdata share. |

---

## FRITZ!Box WAN throughput plugin

| Topic | Details |
|---|---|
| **Purpose** | Live **download / upload** throughput chart for the WAN, using FRITZ!Box **TR-064** total byte counters (no extra daemon on the router). |
| **API** | Browser → `POST /api/fritzbox` (SelfDashboard server calls your box). Optional `lite: true` for counter-only refresh between full polls. |
| **Auth** | TR-064 username + password; optional **HTTPS with self-signed** allowed. |
| **Refresh** | **0–300 s** full TR-064 poll: **`0`** = no interval (only when the dashboard loads). Use **Live counters** for lighter, frequent counter updates. |
| **Live counters** | **0** = samples only on the full refresh interval; **3–15 s** = extra counter polls for a smoother curve. |
| **History cache** | Last curve points are stored in **browser `localStorage`** (per **base URL + username**), up to **7 days**, so the widget is not empty after a reload while new samples arrive. |
| **Layout** | **Vertical** (chart above stat tiles) or **horizontal** (chart beside tiles — works best in a **wide** tile). |
| **Visibility** | Toggle title, legend, live values, chart, time-axis hint (“older / newer”), and each stat tile (averages & peaks) independently in plugin settings. |
| **Plot height** | **`0`** = built-in default height (**168 px**). **`1–220`** = exact height in **1 px** steps. |
| **Y-axis** | **`0` Mbit/s max** = scale from data; fixed max clips values at the top. |
| **Samples** | **16–120** history points kept for the chart. |
| **Sanity cap** | Optional **max measured rate (Mbit/s)** in settings: **exact** ceiling for both directions when &gt; 0 (e.g. **1000** on a 1 Gbit/s line). **0** = only TR-064 **Layer1** max bit rates from the box (when present) + **3%** headroom. |
| **Language** | Display strings: **auto** (match dashboard), **German**, or **English**. |

---

## Settings Overview

**General** — Language (DE/EN), Dashboard title, Navbar display style, Dashboard tab visibility

**Dashboards** — Create, edit, delete dashboards. Toggle tab visibility per dashboard. Set emoji or custom PNG icon.

**Design** — Grid spacing (widget gap + outer padding), Logo upload, Color theme, Custom color overrides per color

---

## Building Your Own Plugin

Anyone can create plugins for SelfDashboard. See the full guide:

📄 [docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)

### Builtin plugins, `pluginLoader.ts`, and Unraid

- **Shipped plugins** (Bookmarks, Calendar, Clock, Docker, Emby, AdGuard Home, FRITZ!Box, Iframe, Scratchpad, Unraid, Unraid Docker, Weather, …) are **compiled into the Docker image**. They are registered in **`src/lib/pluginLoader.ts`** together with the folder **`plugins/<id>/`**. This file is **not** bind-mounted on Unraid — changing it means **editing the Git repo and rebuilding** the image (or opening a PR upstream).
- The Unraid template option **“Custom Plugins Path”** maps a host folder to **`/app/plugins/custom`**. The **stock** SelfDashboard image **does not** automatically load arbitrary TypeScript plugins from that path at runtime. Treat the mount as **optional** (e.g. for your own assets or for **custom images** you build yourself that read that directory). To add a new plugin today, follow **PLUGIN_DEV.md** and **rebuild** the container image.

**Minimal example** (full types and steps in [docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)):

`plugins/myplugin/index.tsx` — export `meta` and `component` as in PLUGIN_DEV.

`src/lib/pluginLoader.ts` — add import and one line inside `loadBuiltinPlugins()`:

```ts
import * as myPlugin from '../../plugins/myplugin'

// inside loadBuiltinPlugins():
registerPlugin(myPlugin.meta, myPlugin.component)
```

Then rebuild the Docker image (builtin plugins are compiled in, not loaded from a host folder at runtime).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TZ` | `Europe/Berlin` | Timezone |
| `NODE_ENV` | `production` | Node.js environment |
| `SELFDASHBOARD_DATA_DIR` | `/app/data` (in the official image) | Directory inside the container where **`dashboard.json`** is stored. Must match your **`/app/data`** bind-mount unless you intentionally use another path. |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Dashboard not loading | Check logs: `docker logs selfdashboard` |
| Config lost after update | Image updates do not remove your appdata volume; **`dashboard.json`** and **`localStorage`** keep your layout. If a **new browser** shows an empty dashboard, check that **`/app/data`** is mounted and writable (see *Shared configuration* above). |
| Port already in use | Change host port: `-p 3001:3000` |
| Widgets invisible in edit mode | Try refreshing the page |
| Theme not applying | Hard refresh: Ctrl+Shift+R |

---

## Technology

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand — persisted to **`localStorage`** (cache) and to **`dashboard.json`** on the server when **`/app/data`** (or **`SELFDASHBOARD_DATA_DIR`**) is available
- **Grid:** react-grid-layout
- **Container:** Node.js 20 Alpine
- **Plugin System:** Custom registry, zero external dependencies

---

## License

**MIT** — free to use, modify and share.

---

---

# 🇩🇪 Deutsch

## Was ist SelfDashboard?

SelfDashboard ist ein sauberes, modulares, selbst gehostetes Home-Dashboard mit einem leistungsstarken Plugin-System — als einzelner Docker-Container. Verwalte mehrere Dashboards, passe jedes Detail an und füge Widgets für deine selbst gehosteten Dienste hinzu. Plugins können von jedem entwickelt und nachträglich installiert werden.

## Features

Aktuelle Plugin- und API-Änderungen: **[docs/CHANGELOG.md](docs/CHANGELOG.md)**.

| Feature | Beschreibung |
|---|---|
| 🧩 **Plugin-System** | Widgets für beliebige Dienste hinzufügen, entfernen und konfigurieren |
| 📋 **Mehrere Dashboards** | Unbegrenzt viele Dashboards, jedes mit eigener URL (`/dashboard/home`, `/dashboard/server`) |
| 🎨 **6 Farbthemen** | Dark, Light, Nord, Catppuccin, Dracula, Solarized |
| 🖌️ **Eigene Farben** | Jede Farbe einzeln pro Dashboard anpassbar |
| 🖼️ **Eigenes Logo** | Logo pro Dashboard hochladen |
| 🌍 **Mehrsprachig** | Deutsch & Englisch |
| 🖱️ **Drag & Drop** | Widgets frei verschieben und skalieren |
| 📐 **Widget-Controls** | Zoom, Innenabstand und Höhe pro Widget einstellbar |
| 🔍 **Dashboard-Zoom** | Gesamtes Dashboard skalieren (70%–150%) |
| 📏 **Grid-Abstände** | Widget-Abstand und Außenrand einstellbar |
| 🔗 **Navbar-Optionen** | Nur Icon, nur Text oder beides — Dashboard-Tabs ein/ausblendbar |
| 🐳 **Single Container** | Next.js 15, keine Datenbank, kein Redis nötig |
| 🖥️ **Unraid-ready** | Community Apps Template inklusive |

---

## Verfügbare Plugins

| Plugin | Kategorie | Beschreibung | Status |
|---|---|---|---|
| 🔖 Bookmarks | Utility | Schnelllinks mit Gruppen, Icons, Drag & Drop, Raster oder waagerechte Zeile | ✅ Enthalten |
| 📅 Kalender | Productivity | Monat/Woche, lokale Termine, ICS-Feeds & CalDAV (serverseitig) | ✅ Enthalten |
| 🕐 Uhr & Datum | Utility | Uhrzeit, Datum, Zeitzone und Stadtname | ✅ Enthalten |
| 🌤️ Wetter | Utility | Stadt oder PLZ — aktuelle Werte (Open-Meteo, ohne API-Key) | ✅ Enthalten |
| 🖥️ Unraid | System | CPU, RAM, Array & Pool per GraphQL API | ✅ Enthalten |
| 🎬 Emby | Media | Aktive Sessions — wer schaut gerade was | ✅ Enthalten |
| 🐳 Docker | System | Container-Liste per Engine API (Socket-Mount) | ✅ Enthalten |
| 🧱 Unraid Docker | System | Container über Unraid GraphQL API (ohne Docker-Socket auf dem Unraid-Host) | ✅ Enthalten |
| 🛡️ AdGuard Home | Network | DNS-Statistik & Schutz (über `/api/adguard`, Basic-Auth) | ✅ Enthalten |
| 📈 Fritzbox Internet Verlauf | Netzwerk | WAN-Durchsatz-Kurve per TR-064, Byte-Zähler (`POST /api/fritzbox`) | ✅ Enthalten |
| 🖼️ Iframe | Utility | Beliebige URL einbetten (iframe) oder als Link | ✅ Enthalten |
| 📝 Notizzettel | Utility | Kurzer Merkzettel, direkt im Widget bearbeitbar | ✅ Enthalten |

---

## Schnellstart

### Option 1 — Unraid Community Apps (empfohlen)

1. Community Apps öffnen → nach **SelfDashboard** suchen
2. Installieren, Port einstellen (Standard: `3000`)
3. `http://DEINE-IP:3000` öffnen
4. **+** klicken, Plugins hinzufügen, Dashboard aufbauen
5. Fertig ✓

### Option 2 — Docker run

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(Optional `-v /var/run/docker.sock:…` — nur Docker-Widget; Socket vom **gleichen** Host wie der Container. Der **`-v …:/app/data`**-Mount speichert **`dashboard.json`** auf der Platte, damit alle Browser dieselbe Konfiguration nutzen.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker-Widget & Unraid-Template

- **Gemeinsame Konfiguration (`dashboard.json`):** Ist **`/app/data`** gemappt (Unraid: *Config Storage*), schreibt SelfDashboard nach Änderungen **`dashboard.json`** auf den Server (`PUT /api/dashboard-state`) und lädt sie beim Start (`GET`). Alle Browser sehen dieselben Dashboards und Widgets; **`localStorage`** bleibt ein schneller lokaler Cache. **Backup** des Appdata-Ordners nicht vergessen. Optional setzt **`SELFDASHBOARD_DATA_DIR`** das Verzeichnis *im* Container für die Datei (offizielles Image: **`/app/data`**).
- Das **Community-Apps-Template** (`unraid/selfdashboard.xml`) enthält einen Eintrag **Docker Socket** (Host `/var/run/docker.sock` → Container `/var/run/docker.sock`, **read-only**), entspricht **` -v /var/run/docker.sock:/var/run/docker.sock`**. Der Eintrag ist **standardmäßig sichtbar** (nicht nur unter „mehr Einstellungen“). Pfad leer lassen / Mapping entfernen, wenn du das Docker-Widget nicht brauchst.
- **Custom Plugins:** der konfigurierte Pfad ist ein **Bind-Mount** — Dateien auf der Unraid-Platte sind im Container nur sichtbar, wenn dieser Host-Ordner nach **`/app/plugins/custom`** gemappt ist. Das **Standard-Image** lädt daraus **keine** neuen TypeScript-Plugins automatisch in den Store — siehe **Eigenes Plugin entwickeln** und Image neu bauen (oder eigenes Image, das den Ordner auswertet).
- Das Docker-Plugin ruft **`/api/docker-containers`** nur auf dem **gleichen Rechner** auf, auf dem SelfDashboard läuft, und spricht so die **lokale** Docker Engine über den Socket an.
- **`EACCES` / Zugriff verweigert** auf dem Socket: Der Container-Prozess braucht Rechte auf den gemounteten Socket (Host `root:docker`). Das Unraid-Template setzt **`ExtraParams` `--group-add=281`** (typische Unraid-`docker`-GID). Abweichend: auf dem Host `stat -c '%g' /var/run/docker.sock` ausführen und anpassen. Neuere SelfDashboard-Images laufen im Container als **root**, dann klappt der Socket meist ohne Feintuning.
- **Start / Stopp / Neustart:** **`POST /api/docker-containers`** (zweistufige Bestätigung). Plugin: Master **Buttons**, darunter **Start** / **Stopp** / **Neustart** einzeln. Wer das Dashboard öffnen kann, kann bei gemountetem Socket Aktionen auslösen — Master bei geteiltem Zugriff aus.
- **CPU & RAM:** **`GET …&stats=1`** liefert **`sdStats`** für laufende Container. Master **Docker-Stats**, darunter **CPU** und **RAM** einzeln; die Stats-Abfrage läuft nur, wenn mindestens eine der beiden Anzeigen an ist (und der Stats-Master an ist). Im Widget optional **Balken** (Schalter **CPU/RAM als Balken**) oder Text in **einer Zeile**: **Name : Laufzeit : Auslastung : Aktionen**; die zweite Bestätigungszeile erscheint nur bei Bedarf darunter.
- **Stats wie Unraid / `docker stats` (Docker-Plugin ≥ 1.7.9):** RAM entspricht der **Docker-CLI-Logik** (Datei-Cache wird abgezogen: cgroup v1 `total_inactive_file`, v2 `inactive_file`), nicht dem rohen `memory_stats.usage`. CPU-% nutzt die übliche Engine-Delta-Formel; bei **zu kurzem** `system_cpu_usage`-Messfenster wird kein CPU-Wert angezeigt (weniger Ausreißer). Abfrage bevorzugt **`stream=false&one-shot=false`**, damit **`precpu_stats`** zuverlässig gefüllt ist; bei HTTP **400** nur **`stream=false`** (ältere Daemons).

### Anderes / „externes“ Docker

Mit dem **aktuellen** Socket-Ansatz werden **keine** Container eines **anderen** Servers angezeigt. Ein Unix-Socket ist **lokal** und geht nicht übers Netz zu fremdem Docker. Praktisch: SelfDashboard **auf jenem Host** installieren (und dort den Socket mounten), oder später eine **HTTP-API** (z. B. Portainer) anbinden — das wäre ein anderes Feature als das Socket-Widget.

---

## Dashboard-Verwaltung

Jedes Dashboard hat eine eigene URL. Zwischen Dashboards wechseln per Tab in der Navbar oder über **Einstellungen → Dashboards**.

| Aktion | So geht's |
|---|---|
| Dashboard erstellen | Einstellungen → Dashboards → Neues Dashboard |
| Dashboard wechseln | Tab in Navbar klicken oder Einstellungen → Öffnen |
| Tab ausblenden | Einstellungen → Dashboards → 👁️ Toggle pro Dashboard |
| Dashboard löschen | Einstellungen → Dashboards → 🗑️ |
| Umbenennen / Icon ändern | Einstellungen → Dashboards → ✏️ |

---

## Widget-Controls

Im **Bearbeitungsmodus** (✏️ Button), über ein Widget hovern um Controls zu sehen:

| Control | Funktion |
|---|---|
| ⠿ Griff | Widget verschieben |
| 🔍 `− 100% +` | Widget-Inhalt zoomen |
| ↔ `− 8 +` | Innenabstand |
| ↕ `− 4 +` | Widget-Höhe |
| ⚙️ | Plugin-Einstellungen |
| ✕ | Widget entfernen |
| Resize-Griff (Ecke/Rand) | Breite und Höhe frei skalieren |

---

## Bookmarks Plugin

| Feature | Beschreibung |
|---|---|
| Gruppen | Mehrere Gruppen erstellen, einzeln ausblendbar |
| Gruppen ausblenden | Sichtbarkeit pro Gruppe mit 👁️ togglen |
| Eigene Icons | Emoji oder PNG/JPG hochladen |
| Drag & Drop | Apps innerhalb und zwischen Gruppen verschieben |
| Darstellung | **Raster** (responsive Spalten) oder **waagerechte Zeile** (scrollbar) |
| Kachelbreite | Min./Max. in Pixel; optional **feste** Spaltenbreite (Raster streckt nicht mit) |
| Neuer Tab | Pro App einstellbar ob neuer oder gleicher Tab |

---

## Kalender-Plugin

| Feature | Beschreibung |
|---|---|
| Ansichten | **Monat** (6 Wochenzeilen) oder **Woche** (eine Zeile) |
| Lokale Termine | Tag antippen zum Anlegen/Bearbeiten (werden mit dem Dashboard gespeichert) |
| **ICS / Webcal** | Geheime Kalender-URL; Abruf **serverseitig** über `POST /api/calendar-ics` (kein CORS im Browser, auch LAN-URLs) |
| **CalDAV** | z. B. Nextcloud/Synology: Sammlungs-URL + Basic-Auth; `POST /api/calendar-caldav` nutzt zuerst **GET** (ICS-Export), sonst **REPORT calendar-query** |
| Aktualisierung | Gemeinsames Intervall für ICS + CalDAV (Minuten, in den Widget-Einstellungen) |
| Hinweis Sicherheit | CalDAV-Zugangsdaten stehen in der **Dashboard-Konfiguration** — in **`dashboard.json`** unter dem **`/app/data`-Volume**, sobald gemappt, und zusätzlich im **localStorage** jedes Browsers. Nach Möglichkeit **App-Passwörter** nutzen und Zugriff auf die Appdata-Freigabe einschränken. |

---

## Fritzbox-Plugin (Internet-Verlauf)

| Thema | Details |
|---|---|
| **Zweck** | **Download- und Upload-Durchsatz** am WAN als Kurve aus den FRITZ!Box-**TR-064**-Gesamtbyte-Zählern (ohne Extra-Dienst auf der Box). |
| **API** | Browser → `POST /api/fritzbox` (SelfDashboard-Server spricht die Box an). Optional `lite: true` für nur Zähler zwischen vollen Abrufen. |
| **Anmeldung** | TR-064-Benutzer + Passwort; optional **HTTPS mit selbstsigniertem Zertifikat** erlauben. |
| **Aktualisieren** | **0–300 s** voller TR-064-Abruf: **`0`** = kein Intervall (nur beim Laden des Dashboards). Für laufende Messpunkte **Zähler-Takt** nutzen. |
| **Zähler-Takt** | **0** = Messpunkte nur beim Intervall „Aktualisieren“; **3–15 s** = zusätzliche Zähler-Abfragen für flüssigere Kurve. |
| **Verlauf-Cache** | Letzte Kurvenpunkte im **Browser-`localStorage`** (pro **Basis-URL + Benutzername**), bis **7 Tage**, damit nach einem Reload nicht sofort „zu wenige Messpunkte“ erscheint. |
| **Layout** | **Vertikal** (Grafik über Karten) oder **waagerecht** (Grafik neben Karten — bei **breitem** Widget am schönsten). |
| **Sichtbarkeit** | In den Plugin-Einstellungen: Überschrift, Legende, Live-Werte, Kurve, Zeitachsen-Hinweis und jede Statistik-Karte einzeln ein/aus. |
| **Plot-Höhe** | **`0`** = interne Standardhöhe (**168 px**). **`1–220`** = exakte Höhe in **1-Pixel-Schritten**. |
| **Y-Achse** | **`0` Mbit/s Maximum** = Skala aus den Daten; fester Wert schneidet oben ab. |
| **Messpunkte** | **16–120** Werte für den Verlauf. |
| **Ausreißer** | Optional **Max. Messrate (Mbit/s)**: bei **&gt; 0** **exakte** Kappung für beide Richtungen (z. B. **1000**). **0** = nur TR-064 **Layer1**-Maximalwerte (falls vorhanden) + **3 %** Puffer. |
| **Sprache** | Anzeige: **auto** (wie Dashboard), **Deutsch** oder **Englisch**. |

---

## Einstellungen-Übersicht

**Allgemein** — Sprache (DE/EN), Dashboard-Titel, Navbar-Darstellung, Dashboard-Tab-Sichtbarkeit

**Dashboards** — Dashboards erstellen, bearbeiten, löschen. Tab-Sichtbarkeit pro Dashboard. Emoji oder PNG-Icon setzen.

**Design** — Grid-Abstände (Widget-Gap + Außenrand), Logo hochladen, Farbthema, Farben einzeln anpassen

---

## Eigenes Plugin entwickeln

Jeder kann Plugins für SelfDashboard erstellen:

📄 [docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)

### Builtin-Plugins, `pluginLoader.ts` und Unraid

- **Mitgelieferte Plugins** (Bookmarks, Kalender, Docker, Emby, AdGuard Home, Fritzbox Internet Verlauf, Iframe, Notizzettel, Unraid, Unraid Docker, Wetter, …) stecken **fest im Docker-Image**. Sie werden in **`src/lib/pluginLoader.ts`** registriert, der Code liegt unter **`plugins/<id>/`**. Diese Datei wird auf Unraid **nicht** per Volume „eingehängt“ — wer etwas hinzufügen will, braucht eine **eigene Image-Build** (oder einen PR ins Haupt-Repo).
- Im Unraid-Template gibt es **„Custom Plugins Path“** → **`/app/plugins/custom`**. Das **Standard-Image** lädt daraus **keine** beliebigen TypeScript-Plugins zur Laufzeit automatisch. Das Mapping ist **optional** (z. B. eigene Dateien oder ein **selbst gebautes** Image, das diesen Ordner auswertet). Neuen Plugin-Code so einbinden wie in **PLUGIN_DEV.md** beschrieben, dann **Image neu bauen**.

---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `TZ` | `Europe/Berlin` | Zeitzone |
| `NODE_ENV` | `production` | Node.js Umgebung |
| `SELFDASHBOARD_DATA_DIR` | `/app/data` (im offiziellen Image) | Verzeichnis **im** Container für **`dashboard.json`**. Muss zum **`/app/data`-Bind-Mount** passen, außer du nutzt bewusst einen anderen Pfad. |

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Dashboard lädt nicht | Logs prüfen: `docker logs selfdashboard` |
| Konfiguration nach Update weg | Image-Updates löschen das Appdata-Volume nicht; **`dashboard.json`** und **`localStorage`** behalten dein Layout. Zeigt ein **neuer Browser** ein leeres Dashboard, prüfe ob **`/app/data`** gemappt und beschreibbar ist (Abschnitt *Gemeinsame Konfiguration* oben). |
| Port bereits belegt | Host-Port ändern: `-p 3001:3000` |
| Widgets im Bearbeitungsmodus unsichtbar | Seite neu laden |
| Theme wird nicht übernommen | Browser-Cache leeren: Strg+Shift+R |

---

## Technologie

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand — im **`localStorage`** (Cache) und in **`dashboard.json`** auf dem Server, sobald **`/app/data`** bzw. **`SELFDASHBOARD_DATA_DIR`** verfügbar ist
- **Grid:** react-grid-layout
- **Container:** Node.js 20 Alpine
- **Plugin-System:** Eigene Registry, keine externen Abhängigkeiten

---

## Lizenz

**MIT** — kostenlos nutzbar, veränderbar und weiterzugeben.
