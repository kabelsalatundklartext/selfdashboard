# Jellyfin

Aktive Wiedergaben vom Jellyfin-Server — Nutzer, Titel, Fortschritt, Pause.

## Setup

1. Jellyfin → **Administration → API-Schlüssel** → neuen Key anlegen.
2. Widget-Einstellungen: **Basis-URL** (z. B. `http://192.168.1.21:8096`) + **API-Key** eintragen.
3. Optional: **Widget-Titel** anpassen (leer = Kopfzeile ausblenden).

Der Browser ruft Jellyfin direkt über die Sessions-API auf (`/Sessions`,
Emby-kompatibler `X-Emby-Token`-Header). Bei HTTPS-Dashboard ggf.
Mixed-Content/CORS beachten (Jellyfin hinter denselben Reverse-Proxy legen).

---

# Jellyfin (English)

Active playback sessions from your Jellyfin server — user, title, progress, pause.

1. Jellyfin → **Dashboard → API Keys** → create a key.
2. Widget settings: enter **base URL** (e.g. `http://192.168.1.21:8096`) + **API key**.
3. Optional: change the **widget title** (empty = hide the header line).

The browser calls the Jellyfin Sessions API directly. On HTTPS dashboards mind
mixed content/CORS (put Jellyfin behind the same reverse proxy).
