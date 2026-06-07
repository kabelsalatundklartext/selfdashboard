# Plugin: Plex (`plex`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **aktive Wiedergaben (Now Playing)** deines **Plex**-Servers: Titel, Nutzer, Fortschritt. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Server-URL** | z. B. `http://192.168.1.10:32400` |
| **Plex-Token** | `X-Plex-Token` — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

Token finden: in Plex ein Medium → „…" → Info → XML anzeigen → `X-Plex-Token` aus der URL.

### API

`POST /api/plugins/plex` — Proxy zu `/status/sessions`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Leer | Läuft gerade etwas? Token gültig? |
| 401 | Token prüfen |

---

## English

### Summary

Shows **now playing** on your **Plex** server: title, user, progress. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Server URL** | e.g. `http://192.168.1.10:32400` |
| **Plex token** | `X-Plex-Token` — stored **encrypted** |
| **Refresh** | interval in seconds |

Find the token: open a media item → "…" → Get Info → View XML → `X-Plex-Token` in the URL.

### API

`POST /api/plugins/plex` — proxy to `/status/sessions`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty | Is anything playing? Token valid? |
| 401 | Check the token |
