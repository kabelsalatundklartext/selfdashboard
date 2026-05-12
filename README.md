# 🗂️ SelfDashboard

A clean, modular, self-hosted dashboard with a plugin system — designed for Unraid and Docker.

![SelfDashboard Screenshot](docs/screenshot.png)

---

## ✨ Features

- 🧩 **Plugin System** — add widgets for any self-hosted service
- 🎨 **6 Themes** — Dark, Light, Nord, Catppuccin, Dracula, Solarized
- 🐳 **Docker-ready** — single container, works great on Unraid
- 🔌 **Developer-friendly** — build and share your own plugins

---

## 🚀 Quick Start (Docker)

```yaml
version: '3.9'
services:
  selfdashboard:
    image: ghcr.io/yourusername/selfdashboard:latest
    container_name: selfdashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - TZ=Europe/Berlin
```

Then open `http://your-server:3000`

---

## 🖥️ Unraid Installation

1. Go to **Community Applications** and search for `SelfDashboard`  
   _or_ manually add the template via the GitHub URL.
2. Set your port (default: `3000`)
3. Start the container

---

## 🧩 Available Plugins

| Plugin | Description |
|---|---|
| 🔖 Bookmarks | Quick links to your services |
| 🕐 Clock | Time and date widget |
| 🖥️ Unraid | CPU, RAM, GPU, Array stats *(coming soon)* |
| 🎬 Emby | Active media sessions *(coming soon)* |
| 🔒 WireGuard | Active VPN connections *(coming soon)* |
| 📸 Immich | Photo library stats *(coming soon)* |
| ☁️ Nextcloud | Storage & activity *(coming soon)* |
| 🌐 Zoraxy | Reverse proxy status *(coming soon)* |
| 🛡️ CrowdSec | Security alerts *(coming soon)* |

---

## 🛠️ Build Your Own Plugin

See [docs/PLUGIN_DEV.md](docs/PLUGIN_DEV.md) for a full guide.

---

## 🏗️ Development

```bash
git clone https://github.com/yourusername/selfdashboard
cd selfdashboard
npm install
npm run dev
# → http://localhost:3000
```

---

## 📄 License

MIT
