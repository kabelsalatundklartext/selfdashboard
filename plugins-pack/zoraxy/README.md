# Zoraxy

Zeigt eine kompakte Übersicht der Proxy-Hosts aus [Zoraxy](https://zoraxy.aroz.org/):
**Hosts gesamt**, **aktiv**, **inaktiv** und **aktive Upstreams** als Kacheln.

## Setup

1. Widget-Einstellungen: **Basis-URL** der Zoraxy-Admin-Oberfläche eintragen
   (z. B. `http://192.168.1.50:8000` — Standard-Port 8000, HTTP genügt im LAN).
2. **Benutzer** und **Passwort** eintragen — **dieselben Zugangsdaten wie der
   Login in der Zoraxy-Web-UI**.
3. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 60 s).

Login (`POST /api/auth/login`) und Abfrage (`POST /api/proxy/list` mit `type=host`)
laufen **serverseitig** (`/api/plugins/zoraxy`) mit SSRF-Schutz; das Passwort wird
verschlüsselt gespeichert und verlässt den Server nicht.

> **Beta-Hinweis:** Getestet gegen die Session-Login-API aktueller Zoraxy-Versionen
> (3.x). Bei abweichenden API-Antworten bitte Issue mit Zoraxy-Version + Antwort-JSON melden.

---

# Zoraxy (English)

Shows a compact overview of proxy hosts from Zoraxy: **total hosts**, **active**,
**disabled** and **active upstreams** as tiles.

1. Widget settings: enter the **base URL** of the Zoraxy admin UI
   (e.g. `http://192.168.1.50:8000` — default port 8000, plain HTTP is fine on the LAN).
2. Enter **username** and **password** — **the same credentials you use to log in to the
   Zoraxy web UI**.
3. Optional: widget title (empty = hidden), refresh interval (default 60 s).

Login (`POST /api/auth/login`) and the host request (`POST /api/proxy/list` with `type=host`)
run server-side (`/api/plugins/zoraxy`) with SSRF protection; the password is stored
encrypted and never leaves the server.

> **Beta:** tested against the session-login API of recent Zoraxy versions (3.x).
> If responses differ, please open an issue with your Zoraxy version + response JSON.
