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

<a id="overview"></a>

## SelfDashboard at a glance

<p align="center">
  <a href="docs/screenshot-dashboard.png">
    <img src="docs/screenshot-dashboard.png" alt="SelfDashboard — example dashboard with calendar, weather, bookmarks, CrowdSec, dual Unraid monitoring, and navbar mail badge" width="920"/>
  </a>
</p>

<p align="center"><sub>A real homelab layout — every widget is a plugin, freely arrangeable and configurable.</sub></p>

**SelfDashboard** is your personal control center for homelab and self-hosting: **one Docker container**, **one browser tab** — instead of a dozen open admin UIs.

| Visible in the screenshot | What you get |
|---|---|
| 📅 **Calendar** | Events (CalDAV/ICS), month view right on the dashboard |
| 🕐 **Clock & weather** | Local time and weather without an extra tab |
| 🔖 **Bookmark grid** | Quick access to Unraid, DSM, Emby, Nextcloud, Vaultwarden, … |
| 🛡️ **CrowdSec** | Alerts and active bans at a glance |
| 🌐 **Network / AdGuard** | Protection status, DNS stats (tiles fill the widget) |
| ⚡ **FRITZ! energy** | Smart-outlet power: now, today, 7 days, month (TR-064) |
| 🖥️ **Unraid (2×)** | CPU, RAM, array/pool, and disks per server |
| 📺 **Kiosk / wall tablet** | Navbar auto-hides — show again only via the accent **Menu** button |
| 📺 **Emby / SelfStream** | Is anything streaming right now? |
| ✉️ **Navbar mail** | Unread IMAP badge (install **E-Mail** plugin from the store) — click opens webmail |

Everything supports **drag & drop**, **multiple dashboards** (e.g. `/dashboard/home`, `/dashboard/server`), **6 themes**, **EN/DE** — and every widget comes from the **plugin system** (install via **Plugin Store** or ZIP, then arrange on the dashboard).

---

# 🇬🇧 English

## What is SelfDashboard?

> **See the [overview](#overview) above** for a full screenshot walkthrough.

SelfDashboard is a clean, modular, self-hosted home dashboard with a powerful plugin system — running as a single Docker container. Manage multiple dashboards, customize every detail, and add widgets for your self-hosted services. **Plugins are installed from the GitHub store or via ZIP** into a mounted folder (`/app/plugins/custom`); see **[docs/PLUGINS.md](docs/PLUGINS.md)** and **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)**.

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
| 📱 **Responsive layout** | **Phone / tablet / desktop** grid based on dashboard width; optional per-widget overrides in **⚙️ → Layout: phone & tablet**; compact **navbar search** (full-width row) on narrow viewports |
| 🐳 **Single Container** | Next.js 15, no database, no Redis needed |
| 📋 **Central error log** | **Settings → Logs**: app, API, and plugin errors (filter, export, 3–30 day retention) — automatic for every registered plugin |
| ✉️ **Navbar mail (IMAP)** | Unread badge in the navbar — multiple accounts, Synology/MailPlus-friendly, encrypted passwords, webmail link on click |
| 📺 **Kiosk mode** | Wall tablet: navbar hides after idle; widgets use the full height (no gap under the bar); **Menu** button brings the bar back — not mouse movement over widgets |
| 🖥️ **Unraid Ready** | Community Apps template included |

---

## Plugins

Widgets are **not** bundled in the image — install them from the **Plugin Store** or upload a ZIP. Each plugin has its own **README (EN/DE)** under `docs/plugins/<id>/`.

Install & folders: **[docs/PLUGINS.md](docs/PLUGINS.md)** · Develop plugins: **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)** · Index: **[docs/plugins/README.md](docs/plugins/README.md)**

| Plugin | Category | Description | README |
|--------|----------|-------------|--------|
| [AdGuard Home](docs/plugins/adguard/README.md) | Network | DNS stats, protection toggle | EN/DE |
| [Bookmarks](docs/plugins/bookmarks/README.md) | Utility | Quick links with groups | EN/DE |
| [Calendar](docs/plugins/calendar/README.md) | Productivity | CalDAV + ICS | EN/DE |
| [Clock](docs/plugins/clock/README.md) | Utility | Time, date, timezone | EN/DE |
| [CrowdSec](docs/plugins/crowdsec/README.md) | Security | Alerts & bans (optional) | EN/DE |
| [Docker](docs/plugins/docker/README.md) | System | Containers via socket | EN/DE |
| [Emby](docs/plugins/emby/README.md) | Media | Active sessions | EN/DE |
| [FRITZ! WAN](docs/plugins/fritzbox/README.md) | Network | Throughput chart | EN/DE |
| [FRITZ! Energy](docs/plugins/fritz-energy/README.md) | Network | Smart plug kWh | EN/DE |
| [Iframe](docs/plugins/iframe/README.md) | Utility | Embed URLs | EN/DE |
| [Email](docs/plugins/mail/README.md) | Productivity | Navbar IMAP badge | EN/DE |
| [Pi-hole](docs/plugins/pihole/README.md) | Network | Pi-hole v6 stats | EN/DE |
| [Scratchpad](docs/plugins/scratchpad/README.md) | Utility | Short notes | EN/DE |
| [Selfstream](docs/plugins/selfstream/README.md) | Media | Live IPTV | EN/DE |
| [Unraid](docs/plugins/unraid/README.md) | System | System overview | EN/DE |
| [Unraid Docker](docs/plugins/unraid-docker/README.md) | System | Containers via Unraid API | EN/DE |
| [Weather](docs/plugins/weather/README.md) | Utility | Open-Meteo | EN/DE |

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
  -v /mnt/user/appdata/selfdashboard/plugins:/app/plugins/custom \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(**`/app/data`** → `dashboard.json`. **`/app/plugins/custom`** → installed plugins (`plugin.json` + `widget.js`). Install widgets in the UI via **Plugin Store → From GitHub** or ZIP upload, then hard-reload (Ctrl+F5). Optional Docker socket — Docker widget only.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker & Unraid template

- **`/app/data`** — `dashboard.json` and calendar data. **Back up** appdata.
- **`/app/plugins/custom`** — installed plugins. See **[docs/PLUGINS.md](docs/PLUGINS.md)**.
- Unraid: **`unraid/selfdashboard.xml`** — **Plugins Storage**, optional **Docker Socket**, optional **CrowdSec Data**.
- **Docker plugin:** local socket only — **[docs/plugins/docker/README.md](docs/plugins/docker/README.md)**.
- **CrowdSec plugin:** optional — **[docs/plugins/crowdsec/README.md](docs/plugins/crowdsec/README.md)**.

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

## Responsive layout (phone, tablet & desktop)

The dashboard uses **three layout bands** based on the **dashboard grid width** (the track that holds the widgets — not only the outer browser window):

| Band | Approx. width | Behaviour |
|---|---|---|
| **Phone** | **&lt; 768 px** | Single **stacked column**; each widget uses **`layoutPhone`** height overrides when set, otherwise the desktop **`layout`** height. |
| **Tablet** | **768 – 1023 px** | **12-column** grid like desktop; optional **`layoutTablet`** overrides (`w`, `h`, `x`, `y`, `minH`) merge with **`layout`**. |
| **Desktop** | **≥ 1024 px** | Full **desktop** layout — what you usually edit when resizing widgets on a large screen. |

**How to tune it:** enter **Edit mode** (✏️), open a widget’s **⚙️** settings. Below the plugin-specific options, **“Layout: phone & tablet”** lets you set optional **phone** row height / min height and **tablet** position & size. **Leave fields empty** to keep using the desktop layout values for that band.

On **narrow viewports (about ≤ 1024 px)** the **navbar web search** moves to a **second row** at **full width** so it is not squeezed into the corner next to zoom and actions.

Plugins can optionally read the **`layoutMode`** prop (`'phone' \| 'tablet' \| 'desktop'`) for their own responsive UI — see **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)**.

---

## Kiosk mode (wall tablet)

| Topic | Details |
|---|---|
| **Where** | **Settings → General → Kiosk mode (wall tablet)** — toggle **Auto-hide top bar** and idle time (**3–60 s**, default **5**). |
| **Behaviour** | When enabled (and **not** in edit mode), the navbar slides away after idle time. **Widgets move to the top** — no empty strip reserved for the hidden bar. |
| **Show bar again** | Only the accent **Menu** / **Leiste** button at the top — **not** mouse movement or clicks on widgets. |
| **While bar is visible** | Clicks inside the navbar reset the hide timer so you can open settings. |
| **Edit mode** | Navbar stays visible (normal sticky layout) so you can rearrange widgets. |

Ideal for a wall-mounted tablet or kiosk browser in full-screen.

---

## Settings Overview

**General** — Language (DE/EN), Dashboard title, **kiosk mode (wall tablet)**, navbar web search, navbar mail badge, navbar display style, dashboard tab visibility

**Dashboards** — Create, edit, delete dashboards. Toggle tab visibility per dashboard. Set emoji or custom PNG icon.

**Design** — Grid spacing (widget gap + outer padding), Logo upload, Color theme, Custom color overrides per color

**Email** — IMAP accounts, navbar badge, poll interval, connection test

**Logs (Protokoll)** — Central error log for support and debugging: filter by level, source, plugin; download `.txt` / JSONL; retention 3 / 7 / 30 days. Every plugin registered via `registerPlugin` logs render failures and failed `/api/*` calls automatically. Mail uses the same log with plugin id **`mail`**. Details: **[docs/LOGGING.md](docs/LOGGING.md)**.

---

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TZ` | `Europe/Berlin` | Timezone |
| `NODE_ENV` | `production` | Node.js environment |
| `SELFDASHBOARD_DATA_DIR` | `/app/data` (in the official image) | Directory inside the container where **`dashboard.json`** is stored. Must match your **`/app/data`** bind-mount unless you intentionally use another path. |
| `SELFDASHBOARD_CALENDAR_KEY` | auto-generated file in data dir | **Stable secret** for encrypting calendar and **mail** passwords. Set explicitly in Docker so credentials survive container recreation. |
| `MAIL_DATA_DIR` | `<plugins/custom>/mail` | Directory for **`mail.json`** (optional override) |
| `SELFDASHBOARD_PLUGINS_CUSTOM` | `<app>/plugins/custom` | Installed plugins (Unraid: map host folder here) |
| `SELFDASHBOARD_PLUGINS_GITHUB_REPO` | — | GitHub repo for store, e.g. `owner/selfdashboard` |
| `SELFDASHBOARD_PLUGINS_GITHUB_REF` | `beta` | Branch for `plugins-pack/` |
| `SELFDASHBOARD_PLUGINS_GITHUB_PATH` | `plugins-pack` | Path in repo to plugin files |
| `CROWDSEC_DATA_DIR` | `/crowdsec-data` | Allowed root for DB paths (CrowdSec widget only; optional) |
| `CROWDSEC_GEOIP_PATH` | — | Full path to `GeoLite2-*.mmdb` if not in the data folder (optional) |
| `CROWDSEC_DB_PATH` | — | Default DB file if widget path is empty (optional) |
| `CROWDSEC_CONTAINER` | `crowdsec` | Docker container name for optional unban via `cscli` (optional) |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Dashboard not loading | Check logs: `docker logs selfdashboard` |
| Config lost after update | Image updates do not remove your appdata volume; **`dashboard.json`** and **`localStorage`** keep your layout. If a **new browser** shows an empty dashboard, check that **`/app/data`** is mounted and writable (see *Shared configuration* above). |
| Port already in use | Change host port: `-p 3001:3000` |
| Widgets invisible in edit mode | Try refreshing the page |
| Theme not applying | Hard refresh: Ctrl+Shift+R |
| CrowdSec widget: `crowdsec.db not found` | Set **CrowdSec Data (optional)** in the Unraid template (host folder with `crowdsec.db` → `/crowdsec-data:ro`), or remove the widget if you do not use CrowdSec |
| CrowdSec: no country flags / all `??` | Ensure **GeoLite2-City.mmdb** (or Country) is in the mounted CrowdSec data folder, or set `CROWDSEC_GEOIP_PATH` |
| CrowdSec: unban fails | Mount **Docker Socket**, check container name in plugin settings, enable unban there |
| Mail badge red/yellow, count 0 | **Settings → Email** → re-enter password → **Save**. Set fixed `SELFDASHBOARD_CALENDAR_KEY` in Docker. Check **Logs** filter `mail` |
| Mail: `ENOTFOUND host:5000` | IMAP host must be IP/hostname only (e.g. `192.168.1.15`), port **993** separate; webmail URL goes in **Webmail URL** field |
| Mail test OK, navbar empty | Enable **Navbar email** (General or Email tab); save account; badge needs unread &gt; 0 |
| Mail badge shows mail that is gone in MailPlus | IMAP may still list deleted/read messages until the server cleans up. Use **Show unread** in email settings to see subjects. After update, SelfDashboard ignores `\Deleted` and `\Seen` ghosts. In MailPlus: empty trash / expunge if needed, then **Refresh all accounts**. |
| MailPlus shows 1 unread, preview listed 2 (old FRITZ mail) | Synology IMAP can keep ancient `UNSEEN` UIDs. Use **Settings → Email → Unread age filter** (default 30 days; `0` = off). Preview shows how many were ignored as too old or duplicate `Message-ID`. |

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

<a id="overview-de"></a>

## SelfDashboard im Überblick

<p align="center">
  <a href="docs/screenshot-dashboard.png">
    <img src="docs/screenshot-dashboard.png" alt="SelfDashboard — Beispiel-Dashboard mit Kalender, Wetter, Dienst-Links, CrowdSec, Unraid-Monitoring und E-Mail-Badge in der Navbar" width="920"/>
  </a>
</p>

<p align="center"><sub>Ein reales Homelab-Layout — alle Widgets sind Plugins, frei anordbar und konfigurierbar.</sub></p>

**SelfDashboard** ist dein persönliches Kontrollzentrum für Homelab und Self-Hosting: **ein Docker-Container**, **ein Browser-Tab** — statt zwölf geöffneter Admin-Oberflächen.

| Im Screenshot sichtbar | Was es dir bringt |
|---|---|
| 📅 **Kalender** | Termine (CalDAV/ICS), Monatsansicht direkt auf dem Dashboard |
| 🕐 **Uhr & Wetter** | Lokale Zeit und Wetter ohne extra Tab |
| 🔖 **Lesezeichen-Grid** | Schnellzugriff auf Unraid, DSM, Emby, Nextcloud, Vaultwarden, … |
| 🛡️ **CrowdSec** | Alerts und aktive Bans auf einen Blick |
| 🌐 **Netzwerk / AdGuard** | Schutz-Status, DNS-Statistik (Kacheln füllen das Widget) |
| ⚡ **FRITZ! Energie** | Steckdose: aktuell, heute, 7 Tage, Monat (TR-064) |
| 🖥️ **Unraid (2×)** | CPU, RAM, Array/Pool und Festplatten pro Server |
| 📺 **Kiosk / Wand-Tablet** | Navbar blendet sich aus — nur Button **Leiste** holt sie zurück |
| 📺 **Emby / SelfStream** | Läuft gerade ein Stream? |
| ✉️ **Navbar E-Mail** | IMAP-Badge (Plugin **E-Mail** aus dem Store installieren) — Klick öffnet Webmail |

Alles ist **Drag & Drop**, **mehrere Dashboards** möglich (z. B. `/dashboard/home`, `/dashboard/server`), **6 Themes**, **DE/EN** — Widgets kommen aus dem **Plugin-System** (Installation über **Plugin-Store** oder ZIP).

## Was ist SelfDashboard?

SelfDashboard ist ein sauberes, modulares, selbst gehostetes Home-Dashboard mit einem leistungsstarken Plugin-System — als einzelner Docker-Container. Verwalte mehrere Dashboards, passe jedes Detail an und füge Widgets für deine selbst gehosteten Dienste hinzu. **Plugins installierst du über den GitHub-Store oder per ZIP** in den gemounteten Ordner `/app/plugins/custom` — siehe **[docs/PLUGINS.md](docs/PLUGINS.md)** und **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)**.

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
| 📱 **Responsives Layout** | **Handy / Tablet / Desktop**-Raster je nach Dashboard-Breite; optionale Widget-Overrides unter **⚙️ → Layout: Handy & Tablet**; **Navbar-Suche** auf schmalen Viewports in **eigener voller Zeile** |
| 🐳 **Single Container** | Next.js 15, keine Datenbank, kein Redis nötig |
| 📋 **Zentrales Protokoll** | **Einstellungen → Protokoll**: App-, API- und Plugin-Fehler (Filter, Export, 3–30 Tage) — automatisch für jedes registrierte Plugin |
| ✉️ **Navbar E-Mail (IMAP)** | Ungelesen-Badge in der Navbar — mehrere Konten, Synology/MailPlus, verschlüsselte Passwörter, Webmail per Klick |
| 📺 **Kiosk-Modus** | Wand-Tablet: Navbar nach Inaktivität aus; Widgets nutzen volle Höhe; **Leiste**-Button blendet sie ein (nicht Maus über Widgets) |
| 🖥️ **Unraid-ready** | Community Apps Template inklusive |

---

## Plugins

Widgets kommen **nicht** im Image mit — Installation über **Plugin-Store** oder ZIP. Pro Plugin eine eigene **README (DE/EN)** unter `docs/plugins/<id>/`.

Installation & Ordner: **[docs/PLUGINS.md](docs/PLUGINS.md)** · Entwicklung: **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)** · Index: **[docs/plugins/README.md](docs/plugins/README.md)**

| Plugin | Kategorie | Kurzbeschreibung | README |
|--------|-----------|------------------|--------|
| [AdGuard Home](docs/plugins/adguard/README.md) | Netzwerk | DNS-Statistik, Schutz umschalten | DE/EN |
| [Bookmarks](docs/plugins/bookmarks/README.md) | Utility | Schnelllinks mit Gruppen | DE/EN |
| [Kalender](docs/plugins/calendar/README.md) | Productivity | CalDAV + ICS | DE/EN |
| [Uhr](docs/plugins/clock/README.md) | Utility | Zeit, Datum, Zeitzone | DE/EN |
| [CrowdSec](docs/plugins/crowdsec/README.md) | Sicherheit | Alerts & Banns (optional) | DE/EN |
| [Docker](docs/plugins/docker/README.md) | System | Container per Socket | DE/EN |
| [Emby](docs/plugins/emby/README.md) | Media | Aktive Sessions | DE/EN |
| [FRITZ! Internet](docs/plugins/fritzbox/README.md) | Netzwerk | WAN-Durchsatz-Kurve | DE/EN |
| [FRITZ! Energie](docs/plugins/fritz-energy/README.md) | Netzwerk | Steckdose kWh/W | DE/EN |
| [Iframe](docs/plugins/iframe/README.md) | Utility | Webseite einbetten | DE/EN |
| [E-Mail](docs/plugins/mail/README.md) | Productivity | Navbar IMAP-Badge | DE/EN |
| [Pi-hole](docs/plugins/pihole/README.md) | Netzwerk | DNS-Statistik v6 | DE/EN |
| [Notizzettel](docs/plugins/scratchpad/README.md) | Utility | Kurznotizen | DE/EN |
| [Selfstream](docs/plugins/selfstream/README.md) | Media | IPTV-Streams live | DE/EN |
| [Unraid](docs/plugins/unraid/README.md) | System | CPU, RAM, Array | DE/EN |
| [Unraid Docker](docs/plugins/unraid-docker/README.md) | System | Container per Unraid-API | DE/EN |
| [Wetter](docs/plugins/weather/README.md) | Utility | Open-Meteo | DE/EN |

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
  -v /mnt/user/appdata/selfdashboard/plugins:/app/plugins/custom \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

*(**`/app/data`** → `dashboard.json`. **`/app/plugins/custom`** → installierte Plugins. Im UI: **Plugin-Store → Von GitHub** oder ZIP, danach **Strg+F5**. Docker-Socket optional — nur Docker-Widget.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker & Unraid-Template

- **`/app/data`** — `dashboard.json`, Kalender. **Backup** nicht vergessen.
- **`/app/plugins/custom`** — installierte Plugins. Siehe **[docs/PLUGINS.md](docs/PLUGINS.md)**.
- Unraid: **`unraid/selfdashboard.xml`** — **Plugins Storage**, optional **Docker Socket**, optional **CrowdSec Data**.
- **Docker-Plugin:** nur lokaler Socket — **[docs/plugins/docker/README.md](docs/plugins/docker/README.md)**.
- **CrowdSec-Plugin:** optional — **[docs/plugins/crowdsec/README.md](docs/plugins/crowdsec/README.md)**.

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

## Responsives Layout (Handy, Tablet & Desktop)

Das Dashboard schaltet anhand der **Raster-Breite** des Dashboards (der Bereich mit den Widgets — nicht nur die Browserfensterbreite) zwischen **drei Modi**:

| Modus | Ca. Breite | Verhalten |
|---|---|---|
| **Handy** | **&lt; 768 px** | **Eine Spalte**, Widgets untereinander; optional **`layoutPhone`** (`h`, `minH`) — sonst gilt das **Desktop-`layout`**. |
| **Tablet** | **768 – 1023 px** | **12-Spalten-Raster** wie Desktop; optional **`layoutTablet`** (`w`, `h`, `x`, `y`, `minH`) wird mit **`layout`** gemischt. |
| **Desktop** | **≥ 1024 px** | Normales **Desktop-Layout** — typischerweise das, was du am großen Bildschirm per Ziehen skalierst. |

**Anpassen:** **Bearbeiten** (✏️) aktivieren, beim Widget **⚙️** öffnen. Unten **„Layout: Handy & Tablet“**: optional **Höhe / Mindesthöhe** für die **gestapelte Handy-Ansicht** sowie **Tablet**-Position und -Größe. **Felder leer lassen** = für diesen Modus die Werte vom **Desktop-Layout** übernehmen.

Bei **schmalen Viewports (ca. ≤ 1024 px)** liegt die **Navbar-Websuche** in einer **zweiten Zeile in voller Breite**, damit sie nicht mit Zoom und Buttons um Platz kämpft.

Plugins können optional die Prop **`layoutMode`** (`'phone' \| 'tablet' \| 'desktop'`) nutzen — siehe **[docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)**.

---

## Kiosk-Modus (Wand-Tablet)

| Thema | Details |
|---|---|
| **Wo** | **Einstellungen → Allgemein → Kiosk-Modus (Wand-Tablet)** — Schalter **Navbar automatisch ausblenden** und Wartezeit (**3–60 s**, Standard **5**). |
| **Verhalten** | Wenn aktiv (und **nicht** im Bearbeitungsmodus), verschwindet die Navbar nach Inaktivität. **Widgets rutschen nach oben** — kein leerer Streifen für die ausgeblendete Leiste. |
| **Leiste wieder** | Nur der Akzent-Button **Leiste** oben — **nicht** Mausbewegung oder Klicks auf Widgets. |
| **Leiste sichtbar** | Klicks in der Navbar setzen den Ausblend-Timer zurück (Einstellungen bedienen). |
| **Bearbeitungsmodus** | Navbar bleibt sichtbar (normales Layout), damit du Widgets anordnen kannst. |

Für Wand-Tablet oder Vollbild-Kiosk-Browser.

---

## Einstellungen-Übersicht

**Allgemein** — Sprache (DE/EN), Dashboard-Titel, **Kiosk-Modus (Wand-Tablet)**, Navbar-Websuche, Navbar E-Mail, Navbar-Darstellung, Dashboard-Tab-Sichtbarkeit

**Dashboards** — Dashboards erstellen, bearbeiten, löschen. Tab-Sichtbarkeit pro Dashboard. Emoji oder PNG-Icon setzen.

**Design** — Grid-Abstände (Widget-Gap + Außenrand), Logo hochladen, Farbthema, Farben einzeln anpassen

**E-Mail** — IMAP-Konten, Navbar-Badge, Abfrage-Intervall, Verbindung testen

**Protokoll** — Zentrales Fehlerprotokoll für Support und Fehlersuche: Filter nach Stufe, Quelle, Plugin; Download `.txt` / JSONL; Aufbewahrung 3 / 7 / 30 Tage. Jedes per `registerPlugin` eingebundene Plugin loggt Render-Fehler und fehlgeschlagene `/api/*`-Aufrufe automatisch. E-Mail nutzt dasselbe Protokoll mit Plugin-ID **`mail`**. Details: **[docs/LOGGING.md](docs/LOGGING.md)**.

---


---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `TZ` | `Europe/Berlin` | Zeitzone |
| `NODE_ENV` | `production` | Node.js Umgebung |
| `SELFDASHBOARD_DATA_DIR` | `/app/data` (im offiziellen Image) | Verzeichnis **im** Container für **`dashboard.json`**. Muss zum **`/app/data`-Bind-Mount** passen, außer du nutzt bewusst einen anderen Pfad. |
| `SELFDASHBOARD_CALENDAR_KEY` | Datei im Data-Ordner | **Fester Schlüssel** für Kalender- und **E-Mail**-Passwörter. In Docker setzen, damit Zugangsdaten Container-Neustarts überleben. |
| `MAIL_DATA_DIR` | `<plugins/custom>/mail` | Verzeichnis für **`mail.json`** (optional) |
| `SELFDASHBOARD_PLUGINS_CUSTOM` | `<app>/plugins/custom` | Installierte Plugins (Unraid: Host-Ordner hierher mappen) |
| `SELFDASHBOARD_PLUGINS_GITHUB_REPO` | — | GitHub-Repo für Store, z. B. `owner/selfdashboard` |
| `SELFDASHBOARD_PLUGINS_GITHUB_REF` | `beta` | Branch für `plugins-pack/` |
| `SELFDASHBOARD_PLUGINS_GITHUB_PATH` | `plugins-pack` | Pfad im Repo zu den Plugin-Dateien |
| `CROWDSEC_DATA_DIR` | `/crowdsec-data` | Erlaubtes Wurzelverzeichnis für DB-Pfade (nur CrowdSec-Widget; optional) |
| `CROWDSEC_GEOIP_PATH` | — | Voller Pfad zu `GeoLite2-*.mmdb`, falls nicht im Data-Ordner (optional) |
| `CROWDSEC_DB_PATH` | — | Standard-DB-Datei, wenn im Widget kein Pfad gesetzt ist (optional) |
| `CROWDSEC_CONTAINER` | `crowdsec` | Docker-Container-Name für optionales Entsperren per `cscli` (optional) |

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Dashboard lädt nicht | Logs prüfen: `docker logs selfdashboard` |
| CrowdSec-Widget: `crowdsec.db nicht gefunden` | **CrowdSec Data (optional)** im Template setzen (Host-Ordner mit `crowdsec.db` → `/crowdsec-data:ro`) oder Mount weglassen und Widget entfernen, wenn du CrowdSec nicht nutzt |
| CrowdSec: keine Länder / nur `??` | **GeoLite2-City.mmdb** (oder Country) im gemounteten CrowdSec-Ordner ablegen oder `CROWDSEC_GEOIP_PATH` setzen |
| CrowdSec: Entsperren schlägt fehl | **Docker Socket** mounten, Container-Name in den Plugin-Einstellungen prüfen, Entsperren dort aktivieren |
| Konfiguration nach Update weg | Image-Updates löschen das Appdata-Volume nicht; **`dashboard.json`** und **`localStorage`** behalten dein Layout. Zeigt ein **neuer Browser** ein leeres Dashboard, prüfe ob **`/app/data`** gemappt und beschreibbar ist (Abschnitt *Gemeinsame Konfiguration* oben). |
| Port bereits belegt | Host-Port ändern: `-p 3001:3000` |
| Widgets im Bearbeitungsmodus unsichtbar | Seite neu laden |
| Theme wird nicht übernommen | Browser-Cache leeren: Strg+Shift+R |
| E-Mail: roter/gelber Punkt, 0 Mails | **Einstellungen → E-Mail** → Passwort neu → **Speichern**. Feste `SELFDASHBOARD_CALENDAR_KEY` im Container. **Protokoll** Filter `mail` |
| E-Mail: `ENOTFOUND host:5000` | IMAP-Host nur IP/Name (z. B. `192.168.1.15`), Port **993** extra; Webmail-URL ins Feld **Webmail-URL** |
| Test OK, Navbar leer | **Navbar E-Mail** einschalten; Konto speichern; Badge nur bei Ungelesen &gt; 0 |
| Badge zeigt Mail, die in MailPlus weg ist | IMAP kann gelöschte/gelesene Mails noch listen. **Ungelesen anzeigen** in den E-Mail-Einstellungen prüfen. Neuere Version ignoriert `\Deleted`/`\Seen`-Geister. In MailPlus Papierkorb leeren/leeren, dann **Alle Konten aktualisieren**. |
| MailPlus 1 ungelesen, Vorschau zeigte 2 (alte FRITZ-Mail) | Synology-IMAP behält oft alte `UNSEEN`-UIDs. **Einstellungen → E-Mail → Altersfilter ungelesen** (Standard 30 Tage, **0** = aus). Vorschau zeigt ignorierte Alt-/Duplikat-Mails. |

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

