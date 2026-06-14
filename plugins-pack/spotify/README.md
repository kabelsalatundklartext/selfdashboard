# Plugin: Spotify (`spotify`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt den **aktuell laufenden Spotify-Titel** (Cover, Künstler, Album, Fortschritt) und **steuert die Wiedergabe** (Play/Pause/Weiter/Zurück). Verbindung per **OAuth**; die Steuerung erfordert **Spotify Premium**. *(Beta)*

### Voraussetzungen

- Ein **Spotify-Konto** sowie eine kostenlose **App** im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- Für die **Steuerung** (Play/Pause/Skip): **Spotify Premium**. Die Anzeige des laufenden Titels funktioniert auch ohne Premium, sobald irgendwo (Handy, Desktop, Web) abgespielt wird.
- Spotify verlangt **HTTPS** für die Redirect-URI (oder `http://127.0.0.1`). Bei LAN-Zugriff am besten über einen Reverse-Proxy mit HTTPS.

### Einrichtung (⚙️)

1. **App anlegen:** Developer Dashboard → *Create app*. Name/Beschreibung frei wählen.
2. **Redirect-URI eintragen:** Im Plugin die angezeigte **Redirect-URI** kopieren (`https://<dein-host>/api/plugins/spotify/callback`) und in der Spotify-App unter *Settings → Redirect URIs* **exakt** einfügen.
3. **Zugangsdaten:** **Client ID** und **Client Secret** aus der Spotify-App ins Plugin eintragen.
4. **Verbinden:** Auf **Verbinden** klicken → Spotify-Login-Fenster → Zugriff erlauben. Das Fenster schließt sich automatisch, der Status wechselt auf *Verbunden*.

| Feld | Details |
|------|---------|
| **Client ID** | aus der Spotify-App — Lookup-Schlüssel, im Klartext gespeichert |
| **Client Secret** | aus der Spotify-App — **verschlüsselt** gespeichert (`sdsec1:`) |
| **Redirect-URI** | wird angezeigt; muss in der Spotify-App hinterlegt sein |
| **Aktualisieren** | Poll-Intervall in Sekunden (min. 5, Standard 10) |

### Sicherheit

Das **Refresh-Token** verlässt den Server nie — das Widget sendet nur die **Client ID** als Lookup. Client Secret, Access- und Refresh-Token liegen **verschlüsselt** unter `data/spotify/<hash>.json`.

### API

`POST /api/plugins/spotify` — Aktionen: `begin` (OAuth starten), `status`, `state`/`now-playing`, `control` (`play`/`pause`/`next`/`previous`), `disconnect`.
`GET /api/plugins/spotify/callback` — OAuth-Redirect von Spotify.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **403 bei Steuerung** | Spotify **Premium** erforderlich. Nach Abo-Wechsel kann es einige Stunden dauern, bis die API es freigibt. |
| **„Kein aktives Gerät" (404)** | Wiedergabe zuerst in einer Spotify-App starten, dann steuern. |
| **Token-Austausch fehlgeschlagen** | Redirect-URI in der Spotify-App muss **exakt** mit der angezeigten URL übereinstimmen (inkl. https). |
| **Verbindung abgelaufen / reauth** | In den Einstellungen **Trennen → Verbinden**. |
| **Client Secret nicht lesbar** | Secret neu eintragen und erneut verbinden. |

---

## English

### Summary

Shows the **currently playing Spotify track** (cover, artist, album, progress) and **controls playback** (play/pause/next/previous). Connects via **OAuth**; control requires **Spotify Premium**. *(Beta)*

### Requirements

- A **Spotify account** and a free **app** in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- For **control** (play/pause/skip): **Spotify Premium**. Now-playing display works without Premium once something is playing on any device.
- Spotify requires **HTTPS** for the redirect URI (or `http://127.0.0.1`). For LAN access, front it with an HTTPS reverse proxy.

### Setup (⚙️)

1. **Create an app:** Developer Dashboard → *Create app*.
2. **Add the redirect URI:** Copy the **redirect URI** shown in the plugin (`https://<your-host>/api/plugins/spotify/callback`) and paste it **exactly** into the Spotify app under *Settings → Redirect URIs*.
3. **Credentials:** Enter the **Client ID** and **Client Secret** from the Spotify app.
4. **Connect:** Click **Connect** → Spotify login → allow access. The window closes itself and the status flips to *Connected*.

| Field | Details |
|-------|---------|
| **Client ID** | from the Spotify app — lookup key, stored in plain text |
| **Client Secret** | from the Spotify app — stored **encrypted** (`sdsec1:`) |
| **Redirect URI** | shown by the plugin; must be registered in the Spotify app |
| **Refresh** | poll interval in seconds (min 5, default 10) |

### Security

The **refresh token never leaves the server** — the widget only ever sends the **Client ID** as a lookup key. Client secret, access and refresh tokens are stored **encrypted** under `data/spotify/<hash>.json`.

### API

`POST /api/plugins/spotify` — actions: `begin` (start OAuth), `status`, `state`/`now-playing`, `control` (`play`/`pause`/`next`/`previous`), `disconnect`.
`GET /api/plugins/spotify/callback` — OAuth redirect from Spotify.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| **403 on control** | Spotify **Premium** required. After a subscription change it can take a few hours before the API allows requests. |
| **"No active device" (404)** | Start playback in a Spotify app first, then control it. |
| **Token exchange failed** | The redirect URI in the Spotify app must match the shown URL **exactly** (incl. https). |
| **Connection expired / reauth** | In settings: **Disconnect → Connect**. |
| **Client secret unreadable** | Re-enter the secret and reconnect. |
