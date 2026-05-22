# Plugin: Emby (`emby`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Aktive Wiedergaben** auf Emby oder Jellyfin: Nutzer, Titel/Serie, Gerät, Client, Pause — mit Refresh-Intervall.

### Installation

Plugin-Store → **Emby** → **Strg+F5** → **⚙️** URL + API-Key.

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **Server** | Emby oder Jellyfin mit API-Key |
| **Netzwerk** | Container erreicht **Basis-URL** (LAN-IP, nicht `localhost` vom Host) |

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **Basis-URL** | z. B. `http://192.168.1.20:8096` |
| **API-Key** | Emby/Jellyfin API token |
| **Aktualisieren** | Sekunden |

### Technik

- Sessions-API (`/emby/Sessions` oder `/Sessions`)  
- Anfrage vom Browser im Widget

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Leer | Niemand streamt gerade |
| Verbindungsfehler | URL, Firewall; vom Container testen |

**Protokoll:** Filter `emby`.

---

## English

### Summary

**Active playback sessions** on Emby or Jellyfin: user, title/series, device, client, pause state — with refresh interval.

### Installation

Plugin Store → **Emby** → **Ctrl+F5** → **⚙️** URL + API key.

### Requirements

| Item | Details |
|------|---------|
| **Server** | Emby or Jellyfin with API key |
| **Network** | Container must reach **base URL** (LAN IP, not host-only `localhost`) |

### Setup (widget ⚙️)

| Field | Recommendation |
|-------|----------------|
| **Base URL** | e.g. `http://192.168.1.20:8096` |
| **API key** | Emby/Jellyfin token |
| **Refresh** | Seconds |

### Technical notes

- Sessions API (`/emby/Sessions` or `/Sessions`)  
- Request from the browser inside the widget

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty | No active streams — normal |
| Connection error | URL, firewall; test from container |

**Logs:** filter `emby`.
