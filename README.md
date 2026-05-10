# SelfDashboard

> Self-hosted Home Server Dashboard — Unraid · Docker · Wetter · Kalender · Security

[![Build & Publish](https://github.com/kabelsalatundklartext/selfdashboard/actions/workflows/build.yml/badge.svg)](https://github.com/kabelsalatundklartext/selfdashboard/actions/workflows/build.yml)
[![GitHub Container Registry](https://img.shields.io/badge/GHCR-ghcr.io-blue)](https://ghcr.io/kabelsalatundklartext/selfdashboard-node)

---

## Features

| Feature | Details |
|---|---|
| **Docker** | CPU · RAM · Netzwerk · Block I/O · PIDs · Logs · Start/Stop/Restart/Pause |
| **Multi-Unraid** | Bis zu 3 Unraid-Server parallel via Connect GraphQL API |
| **Array & Pools** | Parity · Data-Disks · NVMe Cache · weitere Pools · Temperaturen |
| **Shares & VMs** | Alle Freigaben + VMs je Server |
| **Gridstack Layout** | Drag & Drop + freie Größenänderung aller Panels · Layout wird gespeichert |
| **Wetter** | Open-Meteo (kostenlos) **oder** OpenWeatherMap (API Key) — wählbar in Settings |
| **Kalender** | iCal URLs (Nextcloud, Google, etc.) + CalDAV mit Login |
| **CrowdSec** | Echtzeit-Bedrohungsfeed · Angriffserkennung · Länder-Flags |
| **AdGuard Home** | DNS-Statistiken · geblockte Domains · Top-Clients |
| **Apps** | Heimdall-artiger Schnellzugriff: eigene URL + Icon + Farbe konfigurierbar |
| **WebSocket** | Echtzeit-Updates ohne Reload |
| **Responsive** | 1080p · 2K · 4K · Mobile |
| **Themes** | Dark / Light Mode |
| **Sprachen** | Deutsch / Englisch |
| **Kein Login** | Für lokales Netz — keine Authentifizierung |

---

## Quickstart

```bash
# 1. Klonen
git clone https://github.com/kabelsalatundklartext/selfdashboard.git
cd selfdashboard

# 2. Konfigurieren
cp .env.example .env
nano .env

# 3. Starten (verwendet pre-built Images von GHCR)
docker compose up -d

# → http://dein-server:3000
```

### Lokal bauen (statt pre-built Images)

```yaml
# docker-compose.yml — kommentiere die image: Zeilen aus und
# kommentiere die build: Zeilen ein
node-api:
  build: { context: ./backend-node }
python-api:
  build: { context: ./backend-python }
```

```bash
docker compose up -d --build
```

---

## Konfiguration

Alle Einstellungen sind über die Web-UI unter **Einstellungen** änderbar. Alternativ in `.env`:

```env
PORT=3000
TZ=Europe/Berlin

# Unraid Server (bis zu 3)
UNRAID_1_NAME=Tower
UNRAID_1_HOST=http://192.168.1.10
UNRAID_1_API_KEY=                    # Settings → API Key in Unraid

# Wetter (kein Key für Open-Meteo nötig)
OPENWEATHER_KEY=                     # optional für OpenWeatherMap

# AdGuard Home
ADGUARD_URL=http://192.168.1.10:3000
ADGUARD_USER=admin
ADGUARD_PASSWORD=

# CrowdSec
CROWDSEC_URL=http://192.168.1.10:8080
CROWDSEC_API_KEY=

# Kalender (kommagetrennte iCal URLs)
ICAL_URLS=https://nextcloud.example.com/remote.php/dav/public-calendars/xxx/
CALDAV_URL=https://nextcloud.example.com/remote.php/dav
CALDAV_USER=
CALDAV_PASSWORD=
```

---

## Layout bearbeiten

1. Klick auf **Bearbeitungsmodus** (Bleistift-Icon in der Sidebar)
2. Panels per **Drag & Drop** verschieben (am Header anfassen)
3. Panels an den **Rändern/Ecken** in der Größe ändern
4. Erneuter Klick speichert das Layout automatisch

---

## Unraid API Key

1. Unraid → **Settings → Management Access**
2. „API Key" → Kopieren → in `.env` als `UNRAID_1_API_KEY` eintragen

---

## CrowdSec API Key

```bash
docker exec crowdsec cscli bouncers add selfdashboard
# → gibt API Key aus → CROWDSEC_API_KEY setzen
```

---

## REST API

```
GET  /api/snapshot                  → Alle Daten (System + Docker + Unraid + Security + Wetter + Kalender)
GET  /api/docker/containers         → Container-Liste
GET  /api/docker/containers/:id/logs
POST /api/docker/containers/:id/action  { action: start|stop|restart|pause|unpause }
GET  /api/docker/images
GET  /api/docker/networks
GET  /api/docker/volumes
GET  /api/unraid/servers            → Alle konfigurierten Unraid-Server
GET  /api/apps                      → Apps/Favoriten
POST /api/apps                      → App hinzufügen
PUT  /api/apps/:id                  → App bearbeiten
DEL  /api/apps/:id                  → App löschen
GET  /api/settings                  → Einstellungen
PUT  /api/settings                  → Einstellungen speichern
GET  /api/layout                    → Gridstack-Layout
PUT  /api/layout                    → Layout speichern
GET  /api/health

GET  /papi/system                   → System-Stats (Python/psutil)
GET  /papi/storage                  → Partitionen + Disk I/O
GET  /papi/weather?lat=53.55&lon=10.00&provider=open-meteo
GET  /papi/calendar                 → Kalendereinträge (iCal + CalDAV)
GET  /papi/adguard                  → AdGuard Statistiken
GET  /papi/crowdsec                 → CrowdSec Alerts
```

---

## GitHub Actions / CI-CD

Das Repository enthält zwei Workflows:

| Workflow | Trigger | Aktion |
|---|---|---|
| `build.yml` | Push auf `main`/`develop`, Tags `v*.*.*` | Baut multi-arch Images (amd64+arm64), pushed zu GHCR + Docker Hub, erstellt GitHub Release |
| `deps.yml` | Jeden Montag | Prüft veraltete npm/pip Pakete |

### Secrets für Docker Hub (optional)

In den GitHub Repository Settings → Secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Ohne diese Secrets werden Images nur zu GHCR gepushed.

### Release erstellen

```bash
git tag v1.0.0
git push origin v1.0.0
# → GitHub Actions baut + released automatisch
```

---

## Reverse Proxy (Zoraxy/Nginx)

**WebSocket muss aktiviert sein!**

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## Datenpersistenz

```
./data/apps.json      → Apps & Favoriten
./data/settings.json  → Dashboard-Einstellungen
./data/layout.json    → Gridstack-Layout
```

---

## Stack

| Komponente | Technologie |
|---|---|
| Nginx | Reverse Proxy + Static Files |
| Node.js 20 | Express · Dockerode · WebSocket |
| Python 3.12 | FastAPI · psutil · httpx |
| Frontend | Vanilla JS + Gridstack.js (kein Framework) |
| CI/CD | GitHub Actions → GHCR + Docker Hub |
