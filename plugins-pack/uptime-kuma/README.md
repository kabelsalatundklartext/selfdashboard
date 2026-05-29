# Plugin: Uptime Kuma (`uptime-kuma`)

## Deutsch

### Kurzbeschreibung

**Uptime Kuma** Status-Page als kompakte Liste — Monitor-Name, Gruppe und Status (OK / Down / Pending / Wartung). Down-Monitore stehen oben.

### Installation

1. Plugin-Store → **Uptime Kuma** → **Strg+F5**
2. In Uptime Kuma eine **Status Page** anlegen und Monitore zuweisen
3. Widget **⚙️**: Basis-URL + Slug der Status Page

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **Basis-URL** | `http://IP:3001` (ohne `/dashboard`) |
| **Status-Page-Slug** | Slug aus der Status-Page-URL, z. B. `homelab` für `/status/homelab` |
| **Aktualisieren** | Standard 30 Sekunden |
| **Gruppenname** | Optional Gruppe neben dem Monitor-Namen |

### API

- Widget → `POST /api/plugins/uptime-kuma`
- Server → `GET {url}/api/status-page/{slug}/summary` (öffentliche Summary-API, kein API-Key nötig)

### Layout

Standard **4×3** — gleiche Größe wie **Selfstream-Emby**, damit beide Widgets nebeneinander passen.

### Voraussetzungen

- Uptime Kuma mit mindestens einer **öffentlichen Status Page**
- Kuma vom SelfDashboard-Container aus erreichbar (LAN/IP)
- **Neues Docker-Image** für die Server-API (`src/builtin-plugins/uptime-kuma/`)

---

## English

### Summary

**Uptime Kuma** status page as a compact list — monitor name, group, and status (up / down / pending / maintenance). Down monitors are listed first.

### Setup

| Field | Notes |
|-------|-------|
| **Base URL** | `http://IP:3001` (no `/dashboard`) |
| **Status page slug** | From the status page URL, e.g. `homelab` for `/status/homelab` |
| **Refresh** | Default 30 seconds |
| **Group name** | Optionally show the group beside each monitor |

### Requirements

- At least one **public status page** in Uptime Kuma
- Kuma reachable from the SelfDashboard container
- **New Docker image** for the server proxy API
