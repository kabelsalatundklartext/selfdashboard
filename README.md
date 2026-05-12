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

SelfDashboard is a clean, self-hosted home dashboard with a plugin system — running as a single Docker container. Add widgets for your self-hosted services like Unraid, Emby, Nextcloud, WireGuard, Immich, CrowdSec and more. Plugins can be developed by anyone and installed later.

## Features

- **Plugin System** – Add, remove and configure widgets for any service
- **6 Color Themes** – Dark, Light, Nord, Catppuccin, Dracula, Solarized
- **Plugin Store** – Browse and add available plugins directly in the UI
- **Developer Friendly** – Build and share your own plugins with a simple API
- **Persistent Config** – Dashboard layout and settings survive container restarts
- **Single Container** – Next.js 15, no database, no Redis needed
- **Unraid Ready** – Community Apps template included

---

## Available Plugins

| Plugin | Category | Description | Status |
|---|---|---|---|
| 🔖 Bookmarks | Utility | Quick links to your self-hosted services | ✅ Included |
| 🕐 Clock & Date | Utility | Time and date with timezone support | ✅ Included |
| 🖥️ Unraid | System | CPU, RAM, GPU, Array & Pool stats | 🔜 Coming soon |
| 🎬 Emby | Media | Active sessions – who is watching what | 🔜 Coming soon |
| 🔒 WireGuard | Network | Active VPN connections | 🔜 Coming soon |
| 📸 Immich | Storage | Photo library stats & recent uploads | 🔜 Coming soon |
| ☁️ Nextcloud | Storage | Storage usage & activity | 🔜 Coming soon |
| 🌐 Zoraxy | Network | Reverse proxy route status | 🔜 Coming soon |
| 🛡️ CrowdSec | Security | Blocked IPs & active alerts | 🔜 Coming soon |

---

## Quick Start

### Option 1 – Unraid Community Apps (recommended)

1. Open Community Apps → search for **SelfDashboard**
2. Install
3. Open browser: `http://YOUR-IP:3000`
4. Click **Add Plugin** and start building your dashboard
5. Done ✓

### Option 2 – Docker run

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

Then open `http://YOUR-IP:3000`.

### Option 3 – docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

---

## Ports

| Port | Usage |
|---|---|
| `3000` | SelfDashboard Web UI |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TZ` | `Europe/Berlin` | Your local timezone |
| `NODE_ENV` | `production` | Node.js environment |

---

## Themes

| Theme | Style |
|---|---|
| Dark | Default dark theme |
| Light | Clean light theme |
| Nord | Arctic, north-bluish color palette |
| Catppuccin | Pastel colors, Mocha variant |
| Dracula | Classic dark purple theme |
| Solarized | Precision colors for machines and people |

Switch themes anytime via **Settings** in the top navigation bar.

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

## Troubleshooting

| Problem | Solution |
|---|---|
| Dashboard not loading | Check container logs: `docker logs selfdashboard` |
| Plugin not showing | Make sure the plugin is registered before the page loads |
| Config lost after restart | Check that `/app/data` volume is mounted correctly |
| Port already in use | Change host port, e.g. `-p 3001:3000` |
| Theme not applying | Hard refresh browser (Ctrl+Shift+R) |

---

## Technology

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand (persisted to localStorage)
- **Container:** Node.js 20 Alpine, ~200 MB image
- **Plugin System:** Custom registry, zero external dependencies

---

## License

**MIT License**

| | |
|---|---|
| ✅ Private & homelab use | ✅ Modify & adapt |
| ✅ Share & distribute | ✅ Use in commercial projects |
| ✅ Build plugins freely | ✅ No copyleft restrictions |

> *"SelfDashboard" by kabelsalatundklartext — [GitHub](https://github.com/kabelsalatundklartext/selfdashboard)*

---

---

# 🇩🇪 Deutsch

## Was ist SelfDashboard?

SelfDashboard ist ein sauberes, selbst gehostetes Home-Dashboard mit Plugin-System — als einzelner Docker-Container. Füge Widgets für deine selbst gehosteten Dienste hinzu: Unraid, Emby, Nextcloud, WireGuard, Immich, CrowdSec und mehr. Plugins können von jedem entwickelt und nachträglich installiert werden.

## Features

- **Plugin-System** – Widgets für beliebige Dienste hinzufügen, entfernen und konfigurieren
- **6 Farbthemen** – Dark, Light, Nord, Catppuccin, Dracula, Solarized
- **Plugin-Store** – Verfügbare Plugins direkt im UI durchsuchen und hinzufügen
- **Entwicklerfreundlich** – Eigene Plugins mit einer einfachen API bauen und teilen
- **Persistente Konfiguration** – Dashboard-Layout und Einstellungen überleben Container-Neustarts
- **Single Container** – Next.js 15, keine Datenbank, kein Redis nötig
- **Unraid-ready** – Community Apps Template inklusive

---

## Verfügbare Plugins

| Plugin | Kategorie | Beschreibung | Status |
|---|---|---|---|
| 🔖 Bookmarks | Utility | Schnelllinks zu deinen selbst gehosteten Diensten | ✅ Enthalten |
| 🕐 Uhr & Datum | Utility | Uhrzeit und Datum mit Zeitzonen-Unterstützung | ✅ Enthalten |
| 🖥️ Unraid | System | CPU, RAM, GPU, Array & Pool Statistiken | 🔜 Bald verfügbar |
| 🎬 Emby | Media | Aktive Sessions – wer schaut gerade was | 🔜 Bald verfügbar |
| 🔒 WireGuard | Network | Aktive VPN-Verbindungen | 🔜 Bald verfügbar |
| 📸 Immich | Storage | Foto-Bibliothek Statistiken & letzte Uploads | 🔜 Bald verfügbar |
| ☁️ Nextcloud | Storage | Speicherverbrauch & Aktivität | 🔜 Bald verfügbar |
| 🌐 Zoraxy | Network | Reverse Proxy Routen-Status | 🔜 Bald verfügbar |
| 🛡️ CrowdSec | Security | Geblockte IPs & aktive Alerts | 🔜 Bald verfügbar |

---

## Schnellstart

### Option 1 – Unraid Community Apps (empfohlen)

1. Community Apps öffnen → nach **SelfDashboard** suchen
2. Installieren
3. Browser öffnen: `http://DEINE-IP:3000`
4. Auf **Add Plugin** klicken und Dashboard aufbauen
5. Fertig ✓

### Option 2 – Docker run

```bash
docker run -d \
  --name selfdashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Berlin \
  -v /mnt/user/appdata/selfdashboard:/app/data \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

Dann `http://DEINE-IP:3000` öffnen.

### Option 3 – docker-compose

```bash
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard
docker-compose up -d
```

---

## Ports

| Port | Verwendung |
|---|---|
| `3000` | SelfDashboard Web UI |

---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `TZ` | `Europe/Berlin` | Deine lokale Zeitzone |
| `NODE_ENV` | `production` | Node.js Umgebung |

---

## Themes

| Theme | Stil |
|---|---|
| Dark | Standard-Dunkelthema |
| Light | Sauberes Hellthema |
| Nord | Arktische, nordblau-Farbpalette |
| Catppuccin | Pastellfarben, Mocha-Variante |
| Dracula | Klassisches dunkles Lila-Theme |
| Solarized | Präzisionsfarben für Mensch und Maschine |

Themes jederzeit über **Settings** in der oberen Navigationsleiste wechseln.

---

## Eigenes Plugin entwickeln

Jeder kann Plugins für SelfDashboard erstellen. Die vollständige Anleitung:

📄 [docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md)

**Minimales Beispiel:**

```tsx
import { registerPlugin } from 'selfdashboard'

const meta = {
  id: 'com.deinname.meinplugin',
  name: 'Mein Plugin',
  description: 'Zeigt etwas Tolles.',
  version: '1.0.0',
  author: 'Dein Name',
  category: 'utility',
  icon: '✨',
}

function Widget({ config }) {
  return <div className="widget-panel">Hallo von meinem Plugin!</div>
}

registerPlugin(meta, { Widget })
```

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Dashboard lädt nicht | Container-Logs prüfen: `docker logs selfdashboard` |
| Plugin wird nicht angezeigt | Sicherstellen dass das Plugin vor dem Seitenaufruf registriert wird |
| Konfiguration nach Neustart weg | Prüfen ob `/app/data` Volume korrekt gemountet ist |
| Port bereits belegt | Host-Port ändern, z.B. `-p 3001:3000` |
| Theme wird nicht übernommen | Browser-Cache leeren (Strg+Shift+R) |

---

## Technologie

- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **State:** Zustand (im localStorage gespeichert)
- **Container:** Node.js 20 Alpine, ~200 MB Image
- **Plugin-System:** Eigene Registry, keine externen Abhängigkeiten

---

## Lizenz

**MIT-Lizenz** 

| | |
|---|---|
| ✅ Privat & Homelab nutzen | ✅ Verändern & anpassen |
| ✅ Weitergeben & teilen | ✅ In kommerziellen Projekten nutzen |
| ✅ Plugins frei entwickeln | ✅ Keine Copyleft-Einschränkungen |

> *"SelfDashboard" von kabelsalatundklartext — [GitHub](https://github.com/kabelsalatundklartext/selfdashboard)*
