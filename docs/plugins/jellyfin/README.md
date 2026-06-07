# Plugin: Jellyfin (`jellyfin`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **aktive Wiedergaben (Now Playing)** und Sitzungen deines **Jellyfin**-Servers: Titel, Nutzer, Fortschritt.

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Server-URL** | z. B. `http://192.168.1.10:8096` |
| **API-Key** | Jellyfin → Dashboard → API-Schlüssel — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/jellyfin` — Proxy zu `/Sessions`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Leer | Läuft gerade etwas? API-Key gültig? |
| 401 | API-Key prüfen |

---

## English

### Summary

Shows **now playing** and sessions on your **Jellyfin** server: title, user, progress.

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Server URL** | e.g. `http://192.168.1.10:8096` |
| **API key** | Jellyfin → Dashboard → API keys — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/jellyfin` — proxy to `/Sessions`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty | Is anything playing? API key valid? |
| 401 | Check the API key |
