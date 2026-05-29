# Plugin: Selfstream-Emby (`selfstream-emby`)

## Deutsch

### Kurzbeschreibung

Kombiniertes Widget: aktive **Selfstream**-IPTV-Sessions und **Emby/Jellyfin**-Wiedergaben in **einer Liste**. Pro Zeile ein Quellen-Icon (Selfstream oder Emby).

### Installation

1. Plugin-Store → **Selfstream-Emby** → **Strg+F5**
2. Widget **⚙️**: Selfstream-URL + Admin-Passwort, Emby-URL + API-Key (wie bei den Einzel-Plugins)

### Abhängigkeiten

- **Selfstream**-API: `POST /api/plugins/selfstream` (Selfstream-Plugin mit `server.mjs` auf dem Volume empfohlen)
- **Emby**: Browser ruft die Emby-Sessions-API direkt auf (CORS auf der Emby-Instanz beachten)

### Layout

Standard **4×3** — passt neben **Uptime Kuma**.

---

## English

### Summary

Combined widget: active **Selfstream** IPTV sessions and **Emby/Jellyfin** playback in **one list**, with a source icon per row.

### Setup

Install from the store, then configure Selfstream URL/password and Emby URL/API key in **⚙️** (same fields as the standalone plugins).

### Dependencies

- **Selfstream** API via `/api/plugins/selfstream` (install/update the Selfstream plugin for `server.mjs` on the volume)
- **Emby**: browser calls Emby sessions API directly (check CORS on your Emby server)
