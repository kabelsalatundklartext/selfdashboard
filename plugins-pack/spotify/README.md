# Plugin: Spotify (`spotify`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt den **aktuell laufenden Spotify-Titel** (Cover, Künstler, Album, Fortschritt) und **steuert die Wiedergabe** vollständig:

- **Play / Pause / Weiter / Zurück**
- **Vor-/Zurückspulen** über die klick- und ziehbare Fortschrittsleiste
- **Lautstärke & Stummschaltung** (Schieberegler + Mute-Knopf)
- **Suche** nach Liedern & Playlists — **deine eigenen Playlists** erscheinen sofort beim Öffnen
- **Gerätewahl** — Wiedergabe gezielt auf ein Soundsystem, einen Lautsprecher, Smart-TV o. Ä. übertragen

Verbindung per **OAuth**; Steuerung und Abspielen erfordern **Spotify Premium**.

### Voraussetzungen

- Ein **Spotify-Konto** sowie eine kostenlose **App** im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- Für **Steuerung/Abspielen** (Play/Pause/Skip, Seek, Lautstärke, Suchtreffer abspielen, Gerät übertragen): **Spotify Premium**. Die Anzeige des laufenden Titels funktioniert auch ohne Premium, sobald irgendwo (Handy, Desktop, Web) abgespielt wird.
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

### Bedienung

- **🔍 Suche** (Icon oben rechts): Lieder & Playlists suchen; bei leerem Suchfeld erscheinen **deine eigenen Playlists**. Antippen eines Treffers spielt ihn sofort ab — auf dem aktuell gewählten Gerät.
- **🖥️ Gerätewahl** (Icon oben rechts): listet alle verfügbaren Spotify-Connect-Geräte. Antippen überträgt die Wiedergabe dorthin (Soundsystem/Box/Smart-TV werden geweckt) und spielt weiter. Mit **🔄** neu laden, falls ein ruhendes Gerät noch nicht auftaucht.
- **Fortschrittsleiste:** klicken oder ziehen zum Spulen.
- **Lautstärke:** Schieberegler regelt lauter/leiser, der Lautsprecher-Knopf schaltet stumm/wieder an. Geräte ohne Lautstärke-Fernsteuerung werden ausgegraut.

> **Eigene Playlists & Suche** benötigen die Scopes `playlist-read-private` / `playlist-read-collaborative`. Wenn das Plugin **vor** diesem Update verbunden wurde, einmal **Trennen → Verbinden** und die zusätzliche Berechtigung bestätigen.

### Spotify Connect & Geräte

Ein Gerät erscheint in der Geräteliste, **wenn es Spotify Connect unterstützt** und eingeschaltet + mit demselben Konto verbunden ist:

| Gerätetyp | Als eigenes Gerät wählbar? |
|-----------|----------------------------|
| Soundsystem / Smart Speaker / AV-Receiver / Chromecast / Smart-TV mit Spotify Connect | ✅ ja (auch im Leerlauf) |
| Handy- / Desktop-App | nur wenn die App **geöffnet** ist |
| Reine Bluetooth-Box (ohne Connect) | ❌ nein — läuft über das zuspielende Gerät |

Test: In der offiziellen Spotify-App unter „**Mit Gerät verbinden**" — steht das Gerät dort, erscheint es auch hier.

### Sicherheit

Das **Refresh-Token** verlässt den Server nie — das Widget sendet nur die **Client ID** als Lookup. Client Secret, Access- und Refresh-Token liegen **verschlüsselt** unter `data/spotify/<hash>.json`.

### API

`POST /api/plugins/spotify` — Aktionen:

| Aktion | Beschreibung |
|--------|--------------|
| `begin` | OAuth starten |
| `status` | Verbindungsstatus |
| `state` / `now-playing` | aktueller Wiedergabezustand (inkl. Lautstärke/Gerät) |
| `control` | `play` / `pause` / `next` / `previous` |
| `seek` | Position setzen (`positionMs`) |
| `volume` | Lautstärke setzen (`volumePercent` 0–100) |
| `search` | Lieder & Playlists suchen (`query`) |
| `my-playlists` | eigene Playlists laden |
| `play-uri` | Track/Playlist abspielen (`uri`, `kind`, optional `deviceId`) |
| `devices` | verfügbare Geräte auflisten |
| `transfer` | Wiedergabe auf Gerät übertragen (`deviceId`) |
| `disconnect` | Verbindung trennen |

`GET /api/plugins/spotify/callback` — OAuth-Redirect von Spotify.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **403 bei Steuerung/Lautstärke** | Spotify **Premium** erforderlich. Nach Abo-Wechsel kann es einige Stunden dauern, bis die API es freigibt. |
| **„Kein aktives Gerät" (404)** | Gerät über die **Gerätewahl** auswählen (überträgt + weckt) oder Wiedergabe zuerst in einer Spotify-App starten. |
| **Lautstärke nicht änderbar** | Das aktive Gerät erlaubt keine Fern-Lautstärke (`supports_volume: false`) — am Gerät selbst regeln. |
| **Keine eigenen Playlists / Suche leer** | Plugin **neu verbinden**, damit die Playlist-Berechtigung erteilt wird. |
| **Token-Austausch fehlgeschlagen** | Redirect-URI in der Spotify-App muss **exakt** mit der angezeigten URL übereinstimmen (inkl. https). |
| **Verbindung abgelaufen / reauth** | In den Einstellungen **Trennen → Verbinden**. |
| **Client Secret nicht lesbar** | Secret neu eintragen und erneut verbinden. |

---

## English

### Summary

Shows the **currently playing Spotify track** (cover, artist, album, progress) and offers full **playback control**:

- **Play / pause / next / previous**
- **Seek** via the click- and drag-able progress bar
- **Volume & mute** (slider + mute button)
- **Search** for songs & playlists — **your own playlists** show up the moment you open search
- **Device picker** — send playback to a sound system, speaker, smart TV, etc.

Connects via **OAuth**; control and playback require **Spotify Premium**.

### Requirements

- A **Spotify account** and a free **app** in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- For **control/playback** (play/pause/skip, seek, volume, playing search results, device transfer): **Spotify Premium**. Now-playing display works without Premium once something is playing on any device.
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

### Usage

- **🔍 Search** (top-right icon): find songs & playlists; with an empty field your **own playlists** are listed. Tapping a result plays it immediately on the currently selected device.
- **🖥️ Device picker** (top-right icon): lists all available Spotify Connect devices. Tapping one transfers playback there (waking a sound system / speaker / smart TV) and resumes. Use **🔄** to refresh if an idle device hasn't appeared yet.
- **Progress bar:** click or drag to seek.
- **Volume:** the slider sets louder/quieter; the speaker button toggles mute. Devices without remote volume control are greyed out.

> **Own playlists & search** need the `playlist-read-private` / `playlist-read-collaborative` scopes. If the plugin was connected **before** this update, **Disconnect → Connect** once and confirm the extra permission.

### Spotify Connect & devices

A device appears in the list **if it supports Spotify Connect** and is powered on + linked to the same account:

| Device type | Selectable as its own device? |
|-------------|-------------------------------|
| Sound system / smart speaker / AV receiver / Chromecast / smart TV with Spotify Connect | ✅ yes (even while idle) |
| Phone / desktop app | only when the app is **open** |
| Plain Bluetooth speaker (no Connect) | ❌ no — runs through the feeding device |

Test: in the official Spotify app under "**Connect to a device**" — if it's listed there, it shows up here too.

### Security

The **refresh token never leaves the server** — the widget only ever sends the **Client ID** as a lookup key. Client secret, access and refresh tokens are stored **encrypted** under `data/spotify/<hash>.json`.

### API

`POST /api/plugins/spotify` — actions:

| Action | Description |
|--------|-------------|
| `begin` | start OAuth |
| `status` | connection status |
| `state` / `now-playing` | current playback state (incl. volume/device) |
| `control` | `play` / `pause` / `next` / `previous` |
| `seek` | set position (`positionMs`) |
| `volume` | set volume (`volumePercent` 0–100) |
| `search` | search songs & playlists (`query`) |
| `my-playlists` | load your own playlists |
| `play-uri` | play a track/playlist (`uri`, `kind`, optional `deviceId`) |
| `devices` | list available devices |
| `transfer` | transfer playback to a device (`deviceId`) |
| `disconnect` | disconnect |

`GET /api/plugins/spotify/callback` — OAuth redirect from Spotify.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| **403 on control/volume** | Spotify **Premium** required. After a subscription change it can take a few hours before the API allows requests. |
| **"No active device" (404)** | Pick a device via the **device picker** (transfers + wakes it) or start playback in a Spotify app first. |
| **Volume not changeable** | The active device doesn't allow remote volume (`supports_volume: false`) — adjust it on the device itself. |
| **No own playlists / empty search** | **Reconnect** the plugin so the playlist permission is granted. |
| **Token exchange failed** | The redirect URI in the Spotify app must match the shown URL **exactly** (incl. https). |
| **Connection expired / reauth** | In settings: **Disconnect → Connect**. |
| **Client secret unreadable** | Re-enter the secret and reconnect. |
