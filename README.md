# SelfDashboard

Self-hosted Home Server Dashboard für Unraid.

[![Build](https://github.com/kabelsalatundklartext/selfdashboard/actions/workflows/build.yml/badge.svg)](https://github.com/kabelsalatundklartext/selfdashboard/actions/workflows/build.yml)
[![Docker](https://img.shields.io/badge/ghcr.io-selfdashboard-blue)](https://github.com/kabelsalatundklartext/selfdashboard/pkgs/container/selfdashboard)

---

## Features

- **Docker** — Container-Stats (CPU, RAM, Netzwerk, Logs), Start/Stop/Restart
- **Unraid** — Array- & Pool-Datenträger mit Temperaturen, Shares, VMs — bis zu 3 Server
- **Wetter** — Open-Meteo (kostenlos) oder OpenWeatherMap
- **Kalender** — iCal URLs + CalDAV (Nextcloud, Google etc.)
- **CrowdSec** — Echtzeit-Bedrohungsfeed
- **AdGuard Home** — DNS-Statistiken
- **Apps** — Heimdall-artiger Schnellzugriff mit eigenem Icon & URL
- **Layout** — Drag & Drop, frei in der Größe änderbar, wird gespeichert
- **Kein Login** — für lokales Netz
- Dark / Light Mode · Deutsch / Englisch

---

## Unraid — Community Applications

Template direkt in Unraid eingeben:

**Docker → Add Container → Template URL:**
```
https://raw.githubusercontent.com/kabelsalatundklartext/selfdashboard/main/unraid/selfdashboard.xml
```

---

## Docker

```bash
# 1. Konfigurieren
cp .env.example .env
nano .env

# 2. Starten
docker compose up -d

# → http://localhost:3000
```

Oder direkt ohne Compose:
```bash
docker run -d \
  --name selfdashboard \
  --pid=host \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v $(pwd)/data:/data \
  -e TZ=Europe/Berlin \
  ghcr.io/kabelsalatundklartext/selfdashboard:latest
```

---

## Unraid API Key

1. Unraid WebGUI → **Settings → Management Access**
2. API Key kopieren → in `.env` als `UNRAID_1_API_KEY` eintragen

## CrowdSec API Key

```bash
docker exec crowdsec cscli bouncers add selfdashboard
```

---

## API

```
GET  /api/snapshot                       Alle Daten (System, Docker, Unraid, Wetter, Kalender)
GET  /api/docker/containers              Container-Liste
POST /api/docker/containers/:id/action  { action: start|stop|restart|pause }
GET  /api/docker/containers/:id/logs
GET  /api/unraid/servers                 Alle Unraid-Server
GET  /api/apps                           Gespeicherte Apps
PUT  /api/apps/:id
GET  /api/settings
PUT  /api/settings
GET  /api/layout
PUT  /api/layout
GET  /api/health
```

---

## Repo-Struktur

```
selfdashboard/
├── Dockerfile                  ← Ein Container: nginx + node + python
├── docker-compose.yml
├── .env.example
├── backend-node/               ← Express + Dockerode + WebSocket
├── backend-python/             ← FastAPI + psutil (System, Wetter, Kalender)
├── frontend/                   ← HTML/CSS/JS (Gridstack, kein Framework)
├── nginx/nginx.conf
├── docker/supervisord.conf     ← Startet alle 3 Prozesse im Container
└── unraid/
    ├── selfdashboard.xml       ← Unraid CA Template
    └── img/selfdashboard.png   ← App Icon
```
