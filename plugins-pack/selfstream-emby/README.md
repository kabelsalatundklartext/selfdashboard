# Plugin: Selfstream · Emby · Jellyfin (`selfstream-emby`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **aktive Wiedergaben** von **Emby**/**Jellyfin** (bzw. Selfstream-Server): Titel, Nutzer, Fortschritt.

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Server-URL** | z. B. `http://192.168.1.10:8096` |
| **API-Key** | Emby/Jellyfin → API-Schlüssel — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/selfstream-emby` — Proxy zu `/Sessions`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Leer | Läuft etwas? API-Key gültig? |
| 401 | API-Key prüfen |

---

## English

### Summary

Shows **now playing** from **Emby**/**Jellyfin** (or a Selfstream server): title, user, progress.

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Server URL** | e.g. `http://192.168.1.10:8096` |
| **API key** | Emby/Jellyfin → API keys — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/selfstream-emby` — proxy to `/Sessions`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty | Anything playing? API key valid? |
| 401 | Check the API key |
