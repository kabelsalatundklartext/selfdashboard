# Plugin: WireGuard (`wireguard`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

Zeigt die WireGuard-Peers aus [wg-easy](https://github.com/wg-easy/wg-easy): wer **gerade online** ist und einen **Verlauf** des letzten Handshakes je Peer. Server-Logik: `plugins-pack/wireguard/server.ts`.

## Deutsch

### Kurzbeschreibung

Zwei Reiter:

- **Online jetzt** — alle Peers mit einem Handshake jünger als die Online-Schwelle (Standard 2 Min.): Name, Endpoint/IP, „seit … Min." sowie das Transfervolumen (↓ empfangen / ↑ gesendet).
- **Verlauf** — alle Peers nach letztem Handshake absteigend: Name, **Datum + Uhrzeit** des letzten Handshakes, Transfervolumen und ein Status­punkt (online / zuletzt gesehen / inaktiv).

Kopfzeile: **X von Y online** plus Gesamt-Transfer über alle Peers.

### Voraussetzungen

- Eine laufende **wg-easy**-Instanz mit erreichbarer Web-UI (Standard-Port `51821`).
- Die **Login-Zugangsdaten** der wg-easy-Web-UI.
  - **v15** (Rewrite): **Benutzer + Passwort** (Basic-Auth). ⚠️ Für den API-Zugriff muss **2FA für diesen Benutzer aus** sein.
  - **v14** (älter): **nur Passwort** (Session-Login).
- Das Plugin erkennt die Version automatisch — bei eingetragenem Benutzer wird zuerst v15 (Basic-Auth) versucht, sonst der v14-Session-Login.

### Einrichtung

1. Widget-Einstellungen öffnen → **wg-easy URL** eintragen
   (z. B. `http://192.168.1.50:51821` — Standard-Port 51821, HTTP genügt im LAN).
2. **Benutzer** (nur v15) und **Passwort** eintragen — dieselben Zugangsdaten wie der Login in der wg-easy-Web-UI.
3. Optional: **Online-Schwelle** (Minuten, ab wann ein Peer als „online" gilt; Standard 2),
   **Aktualisieren** (Sek., Standard 30), Widget-Titel.
4. Läuft wg-easy hinter einem Reverse-Proxy mit **selbstsigniertem HTTPS-Zertifikat**,
   kann „Selbstsigniertes TLS akzeptieren" aktiviert werden.

### Sicherheit

Login und Peer-Abfrage laufen **serverseitig** (`/api/plugins/wireguard`) mit SSRF-Schutz;
das Passwort wird **verschlüsselt** gespeichert (`sealSecret`) und verlässt den Server nicht.
Das Plugin ist **rein lesend** — es legt keine Peers an, ändert oder löscht nichts.

> **Beta-Hinweis:** Verifiziert gegen die wg-easy-v15-API (`GET /api/client`, Basic-Auth)
> und den v14-Session-Login (`POST /api/session` → `GET /api/wireguard/client`).
> Bei abweichenden API-Antworten bitte Issue mit wg-easy-Version + Antwort-JSON melden.

### Deploy

1. `npm run build:plugin-pack -- wireguard` — erzeugt `widget.js` + `server.mjs`.
2. `npm run generate:plugins-index` — trägt das Plugin in `plugins-index.json` ein.
3. `plugins-pack/` pushen → Plugin-Store → **Aktualisieren** → **Strg+F5**.

---

## English

### Summary

Two tabs:

- **Online now** — every peer whose handshake is fresher than the online threshold (default 2 min): name, endpoint/IP, “… min ago”, and transfer volume (↓ received / ↑ sent).
- **History** — all peers sorted by last handshake (newest first): name, **date + time** of the last handshake, transfer volume, and a status dot (online / last seen / disabled).

Header: **X of Y online** plus the total transfer across all peers.

### Requirements

- A running **wg-easy** instance with a reachable web UI (default port `51821`).
- The **login credentials** of the wg-easy web UI.
  - **v15** (rewrite): **username + password** (basic auth). ⚠️ 2FA must be **off** for that user for API access to work.
  - **v14** (older): **password only** (session login).
- The plugin auto-detects the version — if a username is set it tries v15 (basic auth) first, otherwise the v14 session login.

### Setup

1. Open the widget settings → enter the **wg-easy URL**
   (e.g. `http://192.168.1.50:51821` — default port 51821, plain HTTP is fine on the LAN).
2. Enter **username** (v15 only) and **password** — the same credentials you use to log in to the wg-easy web UI.
3. Optional: **online threshold** (minutes before a peer counts as “online”; default 2),
   **refresh** (seconds, default 30), widget title.
4. If wg-easy sits behind a reverse proxy with a **self-signed HTTPS certificate**,
   enable “Accept self-signed TLS certificate”.

### Security

Login and the peer request run **server-side** (`/api/plugins/wireguard`) with SSRF protection;
the password is stored **encrypted** (`sealSecret`) and never leaves the server.
The plugin is **read-only** — it never creates, edits or deletes peers.

> **Beta:** verified against the wg-easy v15 API (`GET /api/client`, basic auth)
> and the v14 session login (`POST /api/session` → `GET /api/wireguard/client`).
> If responses differ, please open an issue with your wg-easy version + response JSON.

### Deploy

1. `npm run build:plugin-pack -- wireguard` → `widget.js` + `server.mjs`
2. `npm run generate:plugins-index`
3. Push `plugins-pack/` → Plugin Store → **Update** → **Ctrl+F5**.
