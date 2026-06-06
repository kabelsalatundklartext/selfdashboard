# Nginx Proxy Manager

Zeigt die Host-Statistik aus [Nginx Proxy Manager](https://nginxproxymanager.com/):
**Proxy Hosts**, **Redirections**, **Streams** und **404 Hosts** als kompakte Kacheln.

## Setup

1. Widget-Einstellungen: **Basis-URL** der NPM-Admin-Oberfläche eintragen
   (z. B. `http://192.168.1.50:81` — Standard-Port 81, HTTP genügt).
2. **E-Mail** und **Passwort** eintragen — **dieselben Zugangsdaten wie der
   Login in der NPM-Web-UI**. Ein eigener (eingeschränkter) NPM-Benutzer reicht.
3. Optional: Widget-Titel anpassen (leer = ausblenden), Aktualisierungsintervall (Standard 60 s).

Login (`POST /api/tokens`) und Abfrage (`GET /api/reports/hosts`) laufen **serverseitig**
(`/api/plugins/npm`) mit SSRF-Schutz; das Passwort wird verschlüsselt gespeichert und
verlässt den Server nicht.

> **Beta-Hinweis:** Getestet mit NPM v2.x. Bei abweichenden API-Antworten bitte Issue
> mit NPM-Version + Antwort-JSON melden.

---

# Nginx Proxy Manager (English)

Shows host statistics from Nginx Proxy Manager: **proxy hosts**, **redirections**,
**streams** and **404 hosts** as compact tiles.

1. Widget settings: enter the **base URL** of the NPM admin UI
   (e.g. `http://192.168.1.50:81` — default port 81, plain HTTP is fine).
2. Enter **email** and **password** — **the same credentials you use to log in to the
   NPM web UI**. A dedicated (restricted) NPM user works too.
3. Optional: widget title (empty = hidden), refresh interval (default 60 s).

Login (`POST /api/tokens`) and the report request (`GET /api/reports/hosts`) run
server-side (`/api/plugins/npm`) with SSRF protection; the password is stored encrypted
and never leaves the server.

> **Beta:** tested against NPM v2.x. If responses differ, please open an issue with
> your NPM version + response JSON.
