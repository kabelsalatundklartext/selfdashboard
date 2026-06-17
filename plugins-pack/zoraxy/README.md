# Plugin: Zoraxy (`zoraxy`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

Zeigt eine kompakte Übersicht der Proxy-Hosts aus [Zoraxy](https://zoraxy.aroz.org/). Server-Logik: `plugins-pack/zoraxy/server.ts`.

## Deutsch

### Kurzbeschreibung

Kompakte Übersicht der Proxy-Hosts aus Zoraxy als Kacheln: **Hosts gesamt**, **aktiv**, **inaktiv** und **aktive Upstreams**.

### Voraussetzungen

- Eine laufende **Zoraxy**-Instanz mit erreichbarer Admin-Oberfläche (Standard-Port `8000`).
- Die **Login-Zugangsdaten** der Zoraxy-Web-UI (Benutzer + Passwort).

### Einrichtung

1. Widget-Einstellungen öffnen → **Basis-URL** der Zoraxy-Admin-Oberfläche eintragen
   (z. B. `http://192.168.1.50:8000` — Standard-Port 8000, HTTP genügt im LAN).
2. **Benutzer** und **Passwort** eintragen — **dieselben Zugangsdaten wie der
   Login in der Zoraxy-Web-UI**.
3. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 60 s).

### Sicherheit

Login (`POST /api/auth/login`) und Abfrage (`POST /api/proxy/list` mit `type=host`)
laufen **serverseitig** (`/api/plugins/zoraxy`) mit SSRF-Schutz; das Passwort wird
verschlüsselt gespeichert und verlässt den Server nicht.

> **Beta-Hinweis:** Getestet gegen die Session-Login-API aktueller Zoraxy-Versionen
> (3.x). Bei abweichenden API-Antworten bitte Issue mit Zoraxy-Version + Antwort-JSON melden.

### Deploy

1. `npm run build:plugin-pack -- zoraxy` — erzeugt `widget.js` + `server.mjs`.
2. `npm run generate:plugins-index` — trägt das Plugin in `plugins-index.json` ein.
3. `plugins-pack/` pushen → Plugin-Store → **Aktualisieren** → **Strg+F5**.

---

## English

### Summary

Compact overview of proxy hosts from Zoraxy as tiles: **total hosts**, **active**,
**disabled** and **active upstreams**.

### Requirements

- A running **Zoraxy** instance with a reachable admin UI (default port `8000`).
- The **login credentials** of the Zoraxy web UI (username + password).

### Setup

1. Open the widget settings → enter the **base URL** of the Zoraxy admin UI
   (e.g. `http://192.168.1.50:8000` — default port 8000, plain HTTP is fine on the LAN).
2. Enter **username** and **password** — **the same credentials you use to log in to the
   Zoraxy web UI**.
3. Optional: widget title (empty = hidden), refresh interval (default 60 s).

### Security

Login (`POST /api/auth/login`) and the host request (`POST /api/proxy/list` with `type=host`)
run server-side (`/api/plugins/zoraxy`) with SSRF protection; the password is stored
encrypted and never leaves the server.

> **Beta:** tested against the session-login API of recent Zoraxy versions (3.x).
> If responses differ, please open an issue with your Zoraxy version + response JSON.

### Deploy

1. `npm run build:plugin-pack -- zoraxy` → `widget.js` + `server.mjs`
2. `npm run generate:plugins-index`
3. Push `plugins-pack/` → Plugin Store → **Update** → **Ctrl+F5**.
