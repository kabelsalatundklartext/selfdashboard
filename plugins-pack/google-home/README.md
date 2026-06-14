# Plugin: Google Home / Nest (`google-home`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **Google-Nest-Geräte** im Dashboard über die **offizielle Smart Device Management (SDM) API**: **Thermostate** (Ist-/Soll-Temperatur, Modus, +/-), **Sensoren** (Temperatur, Luftfeuchte) und den **Online-Status** von Kameras, Türklingeln und Displays. Verbindung per **OAuth**. *(Beta)*

> **Was geht – und was nicht.** Google bietet *keine* öffentliche „Google Home"-API für beliebige Geräte. Offiziell steuerbar ist nur die **Nest-Familie** über SDM. **Routinen** und **Cast-/Media-Steuerung** stellt Google extern **nicht** bereit – wer das braucht, nutzt dafür das **[Home-Assistant-Plugin](../home-assistant/README.md)** als Brücke.

### Voraussetzungen

- Ein **Google-Konto** mit Nest-Geräten in der Google-Home-App.
- **Device Access Console** Projekt → **Project ID** (einmalige Registrierungsgebühr **5 $**): <https://console.nest.google.com/device-access>
- **Google-Cloud-Projekt** mit aktivierter **Smart Device Management API** und einem **OAuth-2.0-Client (Typ „Web")** → **Client ID** + **Client Secret**.
- Google verlangt **HTTPS** für die Redirect-URI. Bei LAN-Zugriff am besten über einen Reverse-Proxy mit HTTPS.

### Einrichtung (⚙️)

1. **Device Access:** In der Device-Access-Console ein Projekt anlegen (5 $) → **Project ID** notieren.
2. **Google Cloud:** Im selben/zugehörigen Cloud-Projekt die **Smart Device Management API** aktivieren und unter *APIs & Dienste → Anmeldedaten* einen **OAuth-Client „Web"** erstellen → **Client ID** + **Client Secret**.
3. **Redirect-URI eintragen:** Die im Plugin angezeigte **Redirect-URI** (`https://<dein-host>/api/plugins/google-home/callback`) **exakt** beim OAuth-Client (*Autorisierte Redirect-URIs*) **und** in der Device-Access-Console hinterlegen.
4. **Zugangsdaten:** **Project ID**, **Client ID** und **Client Secret** ins Plugin eintragen.
5. **Verbinden:** Auf **Verbinden** klicken → Google-Login + Geräte-Freigabe → das Fenster schließt sich automatisch, der Status wechselt auf *Verbunden*.

| Feld | Details |
|------|---------|
| **Project ID** | aus der Device Access Console — Lookup-Schlüssel, im Klartext gespeichert |
| **Client ID** | aus Google Cloud — Lookup-Schlüssel, im Klartext gespeichert |
| **Client Secret** | aus Google Cloud — **verschlüsselt** gespeichert (`sdsec1:`) |
| **Redirect-URI** | wird angezeigt; muss bei OAuth-Client **und** Device Access hinterlegt sein |
| **Einheit** | Anzeige in °C oder °F (API liefert intern Celsius) |
| **Aktualisieren** | Poll-Intervall in Sekunden (min. 10, Standard 30) |

### Bedienung

- **Thermostat:** Zeile zeigt Ist-Temperatur, Luftfeuchte und Modus. Bei aktivem Heiz-/Kühlmodus regeln **−/+** die Soll-Temperatur (Schritt 0,5 °C). Im Modus *Aus* schaltet ein Tipp auf den Mode-Chip den Modus weiter (Heizen → … → Aus).
- **Sensoren/Kameras/Displays:** Read-only mit grünem/rotem **Online-Punkt** und – falls vorhanden – Temperatur.

### Sicherheit

Das **Refresh-Token** verlässt den Server nie — das Widget sendet nur **Project ID + Client ID** als Lookup. Client Secret, Access- und Refresh-Token liegen **verschlüsselt** unter `data/google-home/<hash>.json`. Serverseitig sind nur **Thermostat-Befehle** (Modus, Heiz-/Kühl-Sollwert) freigegeben; Geräte außerhalb des eigenen Projekts können nicht adressiert werden.

### API

`POST /api/plugins/google-home` — Aktionen: `begin` (OAuth starten), `status`, `devices`/`state`, `command` (Thermostat: `ThermostatMode.SetMode`, `ThermostatTemperatureSetpoint.SetHeat`/`SetCool`), `disconnect`.
`GET /api/plugins/google-home/callback` — OAuth-Redirect von Google.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **Keine Geräte** | Geräte müssen in der Google-Home-App dem Konto zugeordnet und beim Verbinden freigegeben sein. SDM listet nur **Nest**-Geräte. |
| **Token-Austausch fehlgeschlagen** | Redirect-URI muss **exakt** (inkl. https) beim OAuth-Client **und** in der Device-Access-Console stehen. |
| **403 / API-Fehler** | Smart Device Management API im Cloud-Projekt aktiviert? Device-Access-Projekt mit demselben OAuth-Client verknüpft? |
| **Verbindung abgelaufen / reauth** | In den Einstellungen **Trennen → Verbinden**. |
| **Client Secret nicht lesbar** | Secret neu eintragen und erneut verbinden. |
| **Routinen / Lautsprecher fehlen** | Nicht Teil der SDM-API — dafür das Home-Assistant-Plugin nutzen. |

---

## English

### Summary

Shows **Google Nest devices** on the dashboard via the **official Smart Device Management (SDM) API**: **thermostats** (ambient/target temperature, mode, +/-), **sensors** (temperature, humidity) and the **online status** of cameras, doorbells and displays. Connects via **OAuth**. *(Beta)*

> **What works — and what doesn't.** Google offers *no* public "Google Home" API for arbitrary devices. Only the **Nest family** is officially controllable, through SDM. **Routines** and **Cast/media control** are **not** exposed externally — use the **[Home Assistant plugin](../home-assistant/README.md)** as a bridge for those.

### Requirements

- A **Google account** with Nest devices in the Google Home app.
- A **Device Access Console** project → **Project ID** (one-time **$5** registration fee): <https://console.nest.google.com/device-access>
- A **Google Cloud project** with the **Smart Device Management API** enabled and an **OAuth 2.0 client (type "Web")** → **Client ID** + **Client Secret**.
- Google requires **HTTPS** for the redirect URI. For LAN access, front it with an HTTPS reverse proxy.

### Setup (⚙️)

1. **Device Access:** Create a project in the Device Access Console ($5) → note the **Project ID**.
2. **Google Cloud:** Enable the **Smart Device Management API** and create an **OAuth "Web" client** under *APIs & Services → Credentials* → **Client ID** + **Client Secret**.
3. **Add the redirect URI:** Add the **redirect URI** shown in the plugin (`https://<your-host>/api/plugins/google-home/callback`) **exactly** to the OAuth client (*Authorized redirect URIs*) **and** in the Device Access Console.
4. **Credentials:** Enter the **Project ID**, **Client ID** and **Client Secret** into the plugin.
5. **Connect:** Click **Connect** → Google login + device consent → the window closes itself and the status flips to *Connected*.

| Field | Details |
|-------|---------|
| **Project ID** | from the Device Access Console — lookup key, stored in plain text |
| **Client ID** | from Google Cloud — lookup key, stored in plain text |
| **Client Secret** | from Google Cloud — stored **encrypted** (`sdsec1:`) |
| **Redirect URI** | shown by the plugin; must be registered on the OAuth client **and** in Device Access |
| **Unit** | display in °C or °F (the API works in Celsius internally) |
| **Refresh** | poll interval in seconds (min 10, default 30) |

### Usage

- **Thermostat:** the row shows ambient temperature, humidity and mode. While a heat/cool mode is active, **−/+** adjust the target temperature (0.5 °C step). When *Off*, tapping the mode chip cycles the mode (Heat → … → Off).
- **Sensors/cameras/displays:** read-only with a green/red **online dot** and, where available, temperature.

### Security

The **refresh token never leaves the server** — the widget only sends **Project ID + Client ID** as a lookup. Client secret, access and refresh tokens are stored **encrypted** under `data/google-home/<hash>.json`. Only **thermostat commands** (mode, heat/cool setpoint) are server-side whitelisted; devices outside your own project cannot be addressed.

### API

`POST /api/plugins/google-home` — actions: `begin` (start OAuth), `status`, `devices`/`state`, `command` (thermostat: `ThermostatMode.SetMode`, `ThermostatTemperatureSetpoint.SetHeat`/`SetCool`), `disconnect`.
`GET /api/plugins/google-home/callback` — OAuth redirect from Google.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| **No devices** | Devices must be assigned to the account in the Google Home app and granted during connect. SDM only lists **Nest** devices. |
| **Token exchange failed** | The redirect URI must match **exactly** (incl. https) on the OAuth client **and** in the Device Access Console. |
| **403 / API error** | Is the Smart Device Management API enabled in the Cloud project? Is the Device Access project linked to the same OAuth client? |
| **Connection expired / reauth** | In settings: **Disconnect → Connect**. |
| **Client secret unreadable** | Re-enter the secret and reconnect. |
| **Routines / speakers missing** | Not part of the SDM API — use the Home Assistant plugin for those. |
