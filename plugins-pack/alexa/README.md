# Plugin: Amazon Alexa (`alexa`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

> ⚠️ **Beta / inoffiziell.** Amazon bietet **keine** offene Consumer-API für Alexa. Dieses Plugin nutzt [`alexa-remote2`](https://www.npmjs.com/package/alexa-remote2) — dieselbe private Cloud, die auch die Alexa-App verwendet. Es kann jederzeit brechen, wenn Amazon etwas ändert. Ungetestet ausgeliefert.

## Deutsch

### Kurzbeschreibung

Steuert **Echo-Geräte** (Wiedergabe, Lautstärke, inkl. **Amazon Music auf dem Echo**), schaltet **Alexa-Smart-Home-Geräte** und löst **Routinen** aus. Drei Tabs: **Geräte**, **Smart-Home**, **Routinen**. Login einmalig per Amazon-Konto über einen **lokalen Login-Proxy**.

> **„Amazon Music als Player?"** Es gibt keinen einbettbaren Amazon-Music-Webplayer (die offizielle Amazon-Music-Web-API ist in geschlossener Beta und kontrolliert die Queue selbst). Der praktikable Weg ist genau dieses Plugin: Amazon Music **auf dem Echo** abspielen und von hier steuern.

### Voraussetzungen

- Ein **Amazon-Konto** mit eingerichteten **Echo-Geräten** (Alexa-App).
- Aktuelles **2FA/OTP-Verfahren** (App-basiert). E-Mail/SMS-2FA funktioniert mit dem Login-Proxy oft **nicht**.
- Der **Login-Proxy** öffnet einen TCP-Port am Dashboard-Container — dieser muss vom Browser erreichbar sein.
- Login am besten von einem Gerät/PC **ohne installierte Alexa-App** (sonst fängt die App den Login ab).

### Einrichtung (⚙️)

1. **Region** wählen (z. B. `amazon.de`).
2. **Dashboard-Host / IP** eintragen — exakt die Adresse, über die dein Browser das Dashboard erreicht (z. B. `192.168.1.21`). **Kein** `localhost`, wenn du von einem anderen Gerät zugreifst.
3. **Proxy-Port** wählen (Standard `3456`) und am Container **freigeben** (Port-Mapping).
4. **Verbinden** klicken → es öffnet sich `http://<host>:<port>/` → dort bei **Amazon anmelden** (inkl. 2FA). Danach schließt sich der Proxy, der Status wechselt auf *Verbunden*.

| Feld | Details |
|------|---------|
| **Region** | bestimmt `amazonPage` + Service-Host (de/uk/com/jp) |
| **Host / IP** | Adresse des Login-Proxys — muss exakt zur Browser-Adresse passen |
| **Proxy-Port** | TCP-Port für den einmaligen Login (Standard 3456) |
| **Start-Tab** | Geräte / Smart-Home / Routinen |
| **Aktualisieren** | Player-Poll-Intervall in Sekunden (min. 5, Standard 15) |

### Funktionen

- **Geräte:** Echo auswählen → Cover/Titel/Interpret, **Play/Pause/Weiter/Zurück**, **Lautstärke**-Regler. Steuert, was gerade auf dem Echo läuft (Amazon Music, Radio, etc.).
- **Smart-Home:** Liste der von Alexa erkannten Geräte → **An/Aus** (Best-Effort über `executeSmarthomeDeviceAction`).
- **Routinen:** Liste deiner Alexa-Routinen → **Start** (läuft auf dem im Tab „Geräte" gewählten Echo, sonst dem ersten Online-Echo).

### Sicherheit

Die **Amazon-Session** (Login-Cookie, Refresh-Token, Geräte-Registrierung) verlässt den Server nie. Sie liegt **verschlüsselt** (`sdsec1:`) unter `data/alexa/connection.json`; das Widget sendet nie Session-Material, nur Region/Host-Konfiguration. `alexa-remote2` erneuert das Cookie selbst; jede Erneuerung wird neu versiegelt gespeichert.

> Hinweis: `alexa-remote2` macht eigene HTTPS-Anfragen an **feste Amazon-Hosts** und läuft daher **nicht** durch `fetchWithSsrfGuard` (anders als die fetch-basierten Plugins). Die Ziele sind nicht nutzergesteuert.

### API

`POST /api/plugins/alexa` — Aktionen: `begin` (Login-Proxy starten), `status`, `devices`, `player`, `control` (`play`/`pause`/`next`/`previous`/`volume`), `smarthome`, `smarthome-toggle`, `routines`, `routine-run`, `disconnect`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **Proxy-Seite „alexa.amazon.xx deprecated" / QR-Code** | Host/IP im Plugin muss **exakt** mit der Adresse übereinstimmen, über die du den Proxy aufrufst. |
| **Login schlägt fehl** | App-basiertes 2FA verwenden (nicht E-Mail/SMS). Login von einem Gerät ohne Alexa-App. |
| **Proxy öffnet nicht** | Port am Container freigegeben? Anderen Port probieren. |
| **Verbindung abgelaufen / reauth** | In den Einstellungen **Trennen → Verbinden**. |
| **Smart-Home/Routine ohne Wirkung** | Best-Effort über die inoffizielle API — Gerätename/Entität muss in Alexa existieren; ggf. in der Alexa-App prüfen. |

---

## English

> ⚠️ **Beta / unofficial.** Amazon has **no** open consumer API for Alexa. This plugin uses [`alexa-remote2`](https://www.npmjs.com/package/alexa-remote2) — the same private cloud the Alexa app uses. It can break whenever Amazon changes things. Shipped untested.

### Summary

Controls **Echo devices** (playback, volume, incl. **Amazon Music on the Echo**), toggles **Alexa smart home devices**, and runs **routines**. Three tabs: **Devices**, **Smart Home**, **Routines**. One-time login with your Amazon account through a **local login proxy**.

> **"Amazon Music as a player?"** There is no embeddable Amazon Music web player (the official Amazon Music Web API is in closed beta and controls the queue itself). The practical route is this plugin: play Amazon Music **on the Echo** and control it from here.

### Requirements

- An **Amazon account** with **Echo devices** set up (Alexa app).
- A current **2FA/OTP** method (app-based). E-mail/SMS 2FA often does **not** work with the login proxy.
- The **login proxy** opens a TCP port on the dashboard container — your browser must be able to reach it.
- Best to log in from a device/PC **without the Alexa app installed** (otherwise the app intercepts the login).

### Setup (⚙️)

1. Pick the **region** (e.g. `amazon.de`).
2. Enter the **dashboard host / IP** — exactly how your browser reaches the dashboard (e.g. `192.168.1.21`). **Not** `localhost` if you access from another device.
3. Choose the **proxy port** (default `3456`) and **expose** it on the container.
4. Click **Connect** → `http://<host>:<port>/` opens → **sign in to Amazon** (incl. 2FA). The proxy then closes and the status flips to *Connected*.

| Field | Details |
|-------|---------|
| **Region** | sets `amazonPage` + service host (de/uk/com/jp) |
| **Host / IP** | login-proxy address — must match the browser address exactly |
| **Proxy port** | TCP port for the one-time login (default 3456) |
| **Default tab** | Devices / Smart Home / Routines |
| **Refresh** | player poll interval in seconds (min 5, default 15) |

### Features

- **Devices:** select an Echo → cover/title/artist, **play/pause/next/previous**, **volume** slider. Controls whatever is playing on the Echo (Amazon Music, radio, etc.).
- **Smart Home:** list of Alexa-known devices → **On/Off** (best-effort via `executeSmarthomeDeviceAction`).
- **Routines:** list of your Alexa routines → **Run** (on the Echo chosen in the Devices tab, else the first online Echo).

### Security

The **Amazon session** (login cookie, refresh token, device registration) never leaves the server. It is stored **encrypted** (`sdsec1:`) under `data/alexa/connection.json`; the widget never sends session material, only region/host config. `alexa-remote2` refreshes the cookie itself; each refresh is re-sealed.

> Note: `alexa-remote2` makes its own HTTPS requests to **fixed Amazon hosts** and therefore does **not** pass through `fetchWithSsrfGuard` (unlike the fetch-based plugins). The destinations are not user-controlled.

### API

`POST /api/plugins/alexa` — actions: `begin` (start login proxy), `status`, `devices`, `player`, `control` (`play`/`pause`/`next`/`previous`/`volume`), `smarthome`, `smarthome-toggle`, `routines`, `routine-run`, `disconnect`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| **Proxy page "alexa.amazon.xx deprecated" / QR code** | The host/IP in the plugin must match **exactly** how you open the proxy. |
| **Login fails** | Use app-based 2FA (not e-mail/SMS). Log in from a device without the Alexa app. |
| **Proxy won't open** | Is the port exposed on the container? Try another port. |
| **Connection expired / reauth** | In settings: **Disconnect → Connect**. |
| **Smart home/routine has no effect** | Best-effort over the unofficial API — the device/entity must exist in Alexa; check the Alexa app. |
