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
| 🖥️ Unraid | System | CPU, RAM, GPU, Array & Pool stats | 🔜 Coming soon |
| 🎬 Emby | Media | Active sessions — who is watching what | 🔜 Coming soon |
| 🔒 WireGuard | Network | Active VPN connections | 🔜 Coming soon |
| 📸 Immich | Storage | Photo library stats & recent uploads | 🔜 Coming soon |
| ☁️ Nextcloud | Storage | Storage usage & activity | 🔜 Coming soon |
| 🌐 Zoraxy | Network | Reverse proxy route status | 🔜 Coming soon |
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
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

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

**Minimal example:**

```tsx
import { registerPlugin } from 'selfdashboard'

const meta = {
  id: 'com.yourname.myplugin',
  name: 'My Plugin',
  description: 'Shows something awesome.',
  version: '1.0.0',
  author: 'Your Name',
  category: 'utility',
  icon: '✨',
}

function Widget({ config }) {
  return <div className="widget-panel">Hello from my plugin!</div>
}

registerPlugin(meta, { Widget })
```

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
| 🖥️ Unraid | System | CPU, RAM, GPU, Array & Pool Statistiken | 🔜 Bald |
| 🎬 Emby | Media | Aktive Sessions — wer schaut gerade was | 🔜 Bald |
| 🔒 WireGuard | Network | Aktive VPN-Verbindungen | 🔜 Bald |
| 📸 Immich | Storage | Foto-Bibliothek Statistiken & letzte Uploads | 🔜 Bald |
| ☁️ Nextcloud | Storage | Speicherverbrauch & Aktivität | 🔜 Bald |
| 🌐 Zoraxy | Network | Reverse Proxy Routen-Status | 🔜 Bald |
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
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

### Option 3 — docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

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
