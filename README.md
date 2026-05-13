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
| 🔖 Bookmarks | Utility | Quick links with groups, custom icons, drag & drop | ✅ Included |
| 🕐 Clock & Date | Utility | Time, date, timezone and city name | ✅ Included |
| 🖥️ Unraid | System | CPU, RAM, Array & Pool per GraphQL API | ✅ Included |
| 🎬 Emby | Media | Active sessions — who is watching what | ✅ Included |
| 🐳 Docker | System | Container list via Engine API (socket mount) | ✅ Included |
| 🔒 WireGuard | Network | Active VPN connections | 🔜 Coming soon |
| 📸 Immich | Storage | Photo library stats & recent uploads | 🔜 Coming soon |
| ☁️ Nextcloud | Storage | Storage usage & activity | 🔜 Coming soon |
| 🌐 Zoraxy | Network | Reverse proxy hosts via Zoraxy API (`POST /api/zoraxy/proxy-list`, Plugin Bearer or `-noauth`) | ✅ Included |
| 🛡️ CrowdSec | Security | Blocked IPs & active alerts | 🔜 Coming soon |

---

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

*(Optional `-v /var/run/docker.sock:…` — Docker widget only; same host as the container.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker widget & Unraid template

- The **Unraid Community Apps** template (`unraid/selfdashboard.xml`) includes a **Docker Socket** mapping (host `/var/run/docker.sock` → container `/var/run/docker.sock`, read-only), equivalent to `-v /var/run/docker.sock:/var/run/docker.sock`. It is shown **by default** in the template (not hidden under “more settings”). Clear the path if you do not want the Docker widget.
- The **Custom plugins** path is a **bind-mount**: files on the Unraid disk only appear inside the container when that host folder is mapped to `/app/plugins/custom`. The **stock** image does **not** auto-register new TypeScript plugins from that folder — see **Building Your Own Plugin** and rebuild the image (or use a custom image that reads it).
- The Docker plugin uses **`/api/docker-containers`** on the **same machine** where SelfDashboard runs. It talks to the **local** Docker Engine via that socket only.
- **Permission denied (`EACCES`)** on the socket: the container user must be allowed to open the mounted socket (host `root:docker`). The Unraid template sets **`ExtraParams` `--group-add=281`** (common Unraid `docker` GID). If yours differs, run `stat -c '%g' /var/run/docker.sock` on the host and adjust. Newer SelfDashboard images run as **root** in the container so the socket usually works without tuning.
- **Start / stop / restart:** **`POST /api/docker-containers`** (two-step confirmation). Plugin settings: master **Buttons**, then **Start** / **Stop** / **Restart** individually. Anyone who can open the dashboard can trigger actions when the socket is mounted — turn the master off on shared setups.
- **CPU & RAM:** **`GET …&stats=1`** merges **`sdStats`** for running containers. Master **Docker-Stats**, then **CPU** and **RAM** separately; stats requests run only if at least one of CPU/RAM is enabled (while the stats master is on). In the widget, values can appear as **compact bars** (toggle **CPU/RAM als Balken**) or as one-line text; layout is **Name : runtime : stats : actions** on a single row, with the double-confirm panel on a second line when needed.

### Remote / “external” Docker

The current implementation **does not** list containers on **another** server. A Unix socket is **local to one host** and cannot reach Docker on a different machine over the network. Practical options: install SelfDashboard **on** that other host (and mount its socket), or use a separate **HTTP API** (e.g. Portainer) — that would be a different plugin/feature, not the socket-based widget.

### Zoraxy widget

- Configure **Zoraxy base URL** (management UI, e.g. `http://192.168.1.10:8000`).
- **Default:** SelfDashboard calls **`POST /api/zoraxy/proxy-list`** with your **Plugin REST API key**; the server then requests Zoraxy **`GET /plugin/api/proxy/list`** with `Authorization: Bearer …`. Create a key in Zoraxy that allows **GET** on that path (Zoraxy plugin / developer tooling).
- **`-noauth` labs only:** enable **“No login (-noauth)”** in the widget settings to call **`GET /api/proxy/list`** without a key (only when Zoraxy was started with `-noauth`).

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
| Responsive | Switches from 2-column to 1-column when widget is narrow |
| New tab | Per-app setting to open in new tab or same tab |

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

- **Shipped plugins** (Bookmarks, Docker, Zoraxy, …) are **compiled into the Docker image**. They are registered in **`src/lib/pluginLoader.ts`** together with the folder **`plugins/<id>/`**. This file is **not** bind-mounted on Unraid — changing it means **editing the Git repo and rebuilding** the image (or opening a PR upstream).
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

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Dashboard not loading | Check logs: `docker logs selfdashboard` |
| Config lost after update | Data is stored in localStorage — no action needed |
| Port already in use | Change host port: `-p 3001:3000` |
| Widgets invisible in edit mode | Try refreshing the page |
| Theme not applying | Hard refresh: Ctrl+Shift+R |

---

## Technology

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand (persisted to localStorage)
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
| 🔖 Bookmarks | Utility | Schnelllinks mit Gruppen, eigenen Icons, Drag & Drop | ✅ Enthalten |
| 🕐 Uhr & Datum | Utility | Uhrzeit, Datum, Zeitzone und Stadtname | ✅ Enthalten |
| 🖥️ Unraid | System | CPU, RAM, Array & Pool per GraphQL API | ✅ Enthalten |
| 🎬 Emby | Media | Aktive Sessions — wer schaut gerade was | ✅ Enthalten |
| 🐳 Docker | System | Container-Liste per Engine API (Socket-Mount) | ✅ Enthalten |
| 🔒 WireGuard | Network | Aktive VPN-Verbindungen | 🔜 Bald |
| 📸 Immich | Storage | Foto-Bibliothek Statistiken & letzte Uploads | 🔜 Bald |
| ☁️ Nextcloud | Storage | Speicherverbrauch & Aktivität | 🔜 Bald |
| 🌐 Zoraxy | Network | Reverse-Proxy-Hosts per Zoraxy-API (`POST /api/zoraxy/proxy-list`, Plugin-Bearer oder `-noauth`) | ✅ Enthalten |
| 🛡️ CrowdSec | Security | Geblockte IPs & aktive Alerts | 🔜 Bald |

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

*(Optional `-v /var/run/docker.sock:…` — nur Docker-Widget; Socket vom **gleichen** Host wie der Container.)*

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

## Docker-Widget & Unraid-Template

- Das **Community-Apps-Template** (`unraid/selfdashboard.xml`) enthält einen Eintrag **Docker Socket** (Host `/var/run/docker.sock` → Container `/var/run/docker.sock`, **read-only**), entspricht **` -v /var/run/docker.sock:/var/run/docker.sock`**. Der Eintrag ist **standardmäßig sichtbar** (nicht nur unter „mehr Einstellungen“). Pfad leer lassen / Mapping entfernen, wenn du das Docker-Widget nicht brauchst.
- **Custom Plugins:** der konfigurierte Pfad ist ein **Bind-Mount** — Dateien auf der Unraid-Platte sind im Container nur sichtbar, wenn dieser Host-Ordner nach **`/app/plugins/custom`** gemappt ist. Das **Standard-Image** lädt daraus **keine** neuen TypeScript-Plugins automatisch in den Store — siehe **Eigenes Plugin entwickeln** und Image neu bauen (oder eigenes Image, das den Ordner auswertet).
- Das Docker-Plugin ruft **`/api/docker-containers`** nur auf dem **gleichen Rechner** auf, auf dem SelfDashboard läuft, und spricht so die **lokale** Docker Engine über den Socket an.
- **`EACCES` / Zugriff verweigert** auf dem Socket: Der Container-Prozess braucht Rechte auf den gemounteten Socket (Host `root:docker`). Das Unraid-Template setzt **`ExtraParams` `--group-add=281`** (typische Unraid-`docker`-GID). Abweichend: auf dem Host `stat -c '%g' /var/run/docker.sock` ausführen und anpassen. Neuere SelfDashboard-Images laufen im Container als **root**, dann klappt der Socket meist ohne Feintuning.
- **Start / Stopp / Neustart:** **`POST /api/docker-containers`** (zweistufige Bestätigung). Plugin: Master **Buttons**, darunter **Start** / **Stopp** / **Neustart** einzeln. Wer das Dashboard öffnen kann, kann bei gemountetem Socket Aktionen auslösen — Master bei geteiltem Zugriff aus.
- **CPU & RAM:** **`GET …&stats=1`** liefert **`sdStats`** für laufende Container. Master **Docker-Stats**, darunter **CPU** und **RAM** einzeln; die Stats-Abfrage läuft nur, wenn mindestens eine der beiden Anzeigen an ist (und der Stats-Master an ist). Im Widget optional **Balken** (Schalter **CPU/RAM als Balken**) oder Text in **einer Zeile**: **Name : Laufzeit : Auslastung : Aktionen**; die zweite Bestätigungszeile erscheint nur bei Bedarf darunter.

### Anderes / „externes“ Docker

Mit dem **aktuellen** Socket-Ansatz werden **keine** Container eines **anderen** Servers angezeigt. Ein Unix-Socket ist **lokal** und geht nicht übers Netz zu fremdem Docker. Praktisch: SelfDashboard **auf jenem Host** installieren (und dort den Socket mounten), oder später eine **HTTP-API** (z. B. Portainer) anbinden — das wäre ein anderes Feature als das Socket-Widget.

### Zoraxy-Widget

- **Basis-URL** der Zoraxy-Web-Oberfläche eintragen (z. B. `http://192.168.1.10:8000`).
- **Standard:** SelfDashboard nutzt **`POST /api/zoraxy/proxy-list`** mit **Plugin-REST-API-Key**; der Server ruft dann **`GET /plugin/api/proxy/list`** mit `Authorization: Bearer …` auf. In Zoraxy einen Key anlegen, der **GET** auf genau diesen Pfad erlaubt.
- **Nur mit `-noauth`:** Option **„Ohne Login“** schaltet auf **`GET /api/proxy/list`** ohne Key (nur wenn Zoraxy mit `-noauth` gestartet wurde).

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
| Responsiv | Wechselt automatisch von 2-spaltig zu 1-spaltig |
| Neuer Tab | Pro App einstellbar ob neuer oder gleicher Tab |

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

- **Mitgelieferte Plugins** (Bookmarks, Docker, Zoraxy, …) stecken **fest im Docker-Image**. Sie werden in **`src/lib/pluginLoader.ts`** registriert, der Code liegt unter **`plugins/<id>/`**. Diese Datei wird auf Unraid **nicht** per Volume „eingehängt“ — wer etwas hinzufügen will, braucht eine **eigene Image-Build** (oder einen PR ins Haupt-Repo).
- Im Unraid-Template gibt es **„Custom Plugins Path“** → **`/app/plugins/custom`**. Das **Standard-Image** lädt daraus **keine** beliebigen TypeScript-Plugins zur Laufzeit automatisch. Das Mapping ist **optional** (z. B. eigene Dateien oder ein **selbst gebautes** Image, das diesen Ordner auswertet). Neuen Plugin-Code so einbinden wie in **PLUGIN_DEV.md** beschrieben, dann **Image neu bauen**.

---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `TZ` | `Europe/Berlin` | Zeitzone |
| `NODE_ENV` | `production` | Node.js Umgebung |

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Dashboard lädt nicht | Logs prüfen: `docker logs selfdashboard` |
| Konfiguration nach Update weg | Daten liegen im localStorage — kein Handlungsbedarf |
| Port bereits belegt | Host-Port ändern: `-p 3001:3000` |
| Widgets im Bearbeitungsmodus unsichtbar | Seite neu laden |
| Theme wird nicht übernommen | Browser-Cache leeren: Strg+Shift+R |

---

## Technologie

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand (im localStorage gespeichert)
- **Grid:** react-grid-layout
- **Container:** Node.js 20 Alpine
- **Plugin-System:** Eigene Registry, keine externen Abhängigkeiten

---

## Lizenz

**MIT** — kostenlos nutzbar, veränderbar und weiterzugeben.
