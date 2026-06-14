# Plugin: Apple Music (`apple-music`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

> **Beta / ungetestet.** Erstellt ohne Zugriff auf einen MusicKit-Key — die Logik folgt Apples MusicKit-JS-v3-Doku, ist aber noch nicht live verifiziert. Rückmeldungen willkommen.

## Deutsch

### Kurzbeschreibung

Ein **Apple-Music-Player direkt im Dashboard**: anmelden, eine **Playlist / Album / Station / Song** starten und **Now-Playing** mit Cover, Fortschritt und **Play/Pause/Skip** steuern. Die Wiedergabe läuft **im Browser über Apples MusicKit** (DRM) — das Widget *ist* der Player.

### Wie es sich von Spotify unterscheidet

| | Spotify | Apple Music |
|---|---------|-------------|
| Owner-Kosten | Premium-Abo | **Apple Developer Program, 99 $/Jahr** (MusicKit-Key) |
| Nutzer | OAuth, Premium für Web-Playback | Apple-ID-Login + **aktives Apple-Music-Abo** |
| Wiedergabe | server-gepollt, steuert externe Geräte | **läuft im Browser** über MusicKit JS |
| „Now Playing" | von jedem Gerät lesbar | nur **dieser** Player (Apple bietet kein geräteübergreifendes Now-Playing) |
| Token | OAuth-Refresh (server-seitig) | **ES256-JWT** (server-seitig signiert), alle ~6 Mon. erneuert |

### Voraussetzungen

- **Apple Developer Program** (99 $/Jahr) für einen **MusicKit-Key**.
- Pro Nutzer ein **aktives Apple-Music-Abo** und Anmeldung mit der Apple-ID.
- Auslieferung über **HTTPS** (MusicKit-Anmeldung erfordert i. d. R. einen sicheren Kontext).
- **CSP**: Apple-CDN und API müssen erlaubt sein (siehe unten).

### Einrichtung (⚙️)

1. **MusicKit-Key erstellen:** Apple Developer → *Certificates, Identifiers & Profiles* → *Keys* → neuen Key mit **MusicKit** aktivieren → **`.p8` herunterladen** (nur einmalig möglich!) und **Key ID** notieren.
2. **Team ID:** steht oben rechts im Apple-Developer-Account (Membership).
3. **Im Plugin eintragen:** **Team ID**, **Key ID** und den **Inhalt der `.p8`-Datei** einfügen → **Speichern**. Der private Schlüssel wird **verschlüsselt** auf dem Server gespeichert; das Plugin prüft ihn sofort durch Signieren eines Test-Tokens.
4. **Start-Inhalt:** Typ wählen (Playlist/Album/Station/Song) und die **Inhalts-ID** eintragen (letztes Segment der Apple-Music-URL, z. B. `pl.u-…`).
5. **Widget:** **Anmelden** klicken → Apple-Music-Login → danach **Play**.

| Feld | Details |
|------|---------|
| **Team ID** | Apple-Developer-Account — Lookup-Schlüssel, Klartext |
| **Key ID** | MusicKit-Key — Lookup-Schlüssel, Klartext |
| **Privater Schlüssel** | Inhalt der `.p8` — **verschlüsselt** gespeichert, nicht in der Dashboard-Config |
| **App-Name** | optionaler Anzeigename für MusicKit |
| **Start-Inhalt (Typ/ID)** | was bei *Play* in die Warteschlange geladen wird |

### Content Security Policy

Damit MusicKit lädt und spielt, muss die CSP u. a. erlauben:

```text
script-src  … https://js-cdn.music.apple.com
connect-src … https://*.music.apple.com https://*.mzstatic.com
img-src     … https://*.mzstatic.com
media-src   … https://*.music.apple.com blob:
frame-src   … https://*.apple.com
```

### Sicherheit

Der **private Schlüssel verlässt den Server nie** — das Widget bekommt nur den kurzlebigen **Developer-Token** (per Design öffentlich). Der **Music-User-Token** (die Apple-Anmeldung) wird von MusicKit JS **clientseitig** verwaltet; der Server sieht ihn nicht. Ablage server-seitig: `data/apple-music/<hash>.json` mit verschlüsseltem `privateKey` (`sdsec1:`).

### API

`POST /api/plugins/apple-music` — Aktionen: `save` (Key speichern/prüfen), `status`, `token`/`developer-token` (Developer-Token holen), `disconnect`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **„Privater Schlüssel ungültig"** | Vollständigen `.p8`-Inhalt inkl. `BEGIN/END PRIVATE KEY` einfügen. |
| **Anmeldung schlägt fehl** | HTTPS nötig; Pop-up-Blocker prüfen; gültiges Apple-Music-Abo? |
| **Lädt nicht / leer** | CSP erlaubt `js-cdn.music.apple.com`? Browser-Konsole prüfen. |
| **Spielt nicht ab** | `.p8`/Team ID/Key ID korrekt? Inhalts-ID gültig und im Storefront verfügbar? |

---

## English

### Summary

An **Apple Music player right in the dashboard**: sign in, start a **playlist / album / station / song**, and control **now-playing** with cover art, progress and **play/pause/skip**. Playback runs **in the browser via Apple MusicKit** (DRM) — the widget *is* the player.

### How it differs from Spotify

| | Spotify | Apple Music |
|---|---------|-------------|
| Owner cost | Premium subscription | **Apple Developer Program, $99/yr** (MusicKit key) |
| User | OAuth, Premium for web playback | Apple ID login + **active Apple Music subscription** |
| Playback | server-polled, controls external devices | **runs in the browser** via MusicKit JS |
| "Now playing" | readable from any device | this player only (Apple has no cross-device now-playing) |
| Token | OAuth refresh (server-side) | **ES256 JWT** (server-signed), rotated ~every 6 months |

### Requirements

- **Apple Developer Program** ($99/yr) for a **MusicKit key**.
- Each user needs an **active Apple Music subscription** and signs in with their Apple ID.
- Served over **HTTPS** (MusicKit auth generally needs a secure context).
- **CSP** must allow Apple's CDN and API (see below).

### Setup (⚙️)

1. **Create a MusicKit key:** Apple Developer → *Certificates, Identifiers & Profiles* → *Keys* → new key with **MusicKit** enabled → **download the `.p8`** (one-time only!) and note the **Key ID**.
2. **Team ID:** top-right in your Apple Developer account (Membership).
3. **Enter in the plugin:** **Team ID**, **Key ID** and the **contents of the `.p8` file** → **Save**. The private key is stored **encrypted** on the server and validated immediately by signing a test token.
4. **Start content:** pick the type (playlist/album/station/song) and enter the **content ID** (last segment of the Apple Music URL, e.g. `pl.u-…`).
5. **Widget:** click **Sign in** → Apple Music login → then **Play**.

| Field | Details |
|-------|---------|
| **Team ID** | Apple Developer account — lookup key, plain text |
| **Key ID** | MusicKit key — lookup key, plain text |
| **Private key** | `.p8` contents — stored **encrypted**, not kept in dashboard config |
| **App name** | optional display name for MusicKit |
| **Start content (type/ID)** | what gets queued on *Play* |

### Content Security Policy

For MusicKit to load and play, the CSP must allow (at least):

```text
script-src  … https://js-cdn.music.apple.com
connect-src … https://*.music.apple.com https://*.mzstatic.com
img-src     … https://*.mzstatic.com
media-src   … https://*.music.apple.com blob:
frame-src   … https://*.apple.com
```

### Security

The **private key never leaves the server** — the widget only receives the short-lived **developer token** (public by design). The **Music User Token** (the Apple sign-in) is managed **client-side** by MusicKit JS; the server never sees it. Server storage: `data/apple-music/<hash>.json` with the `privateKey` encrypted (`sdsec1:`).

### API

`POST /api/plugins/apple-music` — actions: `save` (store/validate key), `status`, `token`/`developer-token` (fetch developer token), `disconnect`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| **"Invalid private key"** | Paste the full `.p8` contents including `BEGIN/END PRIVATE KEY`. |
| **Sign-in fails** | HTTPS required; check pop-up blocker; valid Apple Music subscription? |
| **Won't load / empty** | Does CSP allow `js-cdn.music.apple.com`? Check the browser console. |
| **Won't play** | `.p8`/Team ID/Key ID correct? Content ID valid and available in the storefront? |
