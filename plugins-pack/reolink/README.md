# Plugin: Reolink Kamera (`reolink`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Live-Kamerabild** von Reolink-Kameras und -NVRs direkt im Dashboard — über die **lokale CGI-API** der Kamera (kein Reolink-Cloud-Konto nötig). Das Bild aktualisiert sich automatisch (Snapshot-Polling). Optional: **Online-Status**, **KI-/Bewegungs-Badges** (Person/Fahrzeug/Tier/Bewegung) und **PTZ-Steuerung** (schwenken/neigen/zoomen) für PTZ-Modelle.

### Voraussetzungen

| Punkt | Details |
|-------|---------|
| **Lokaler Zugriff** | Kamera/NVR im selben LAN, HTTP (Standard Port 80) oder HTTPS |
| **Benutzer** | Kamera-Benutzer mit Passwort — empfohlen ein **eigenes Konto** (nicht das Admin-Konto) |
| **Netz** | Nur LAN-Adressen (10.x, 172.16–31.x, 192.168.x) |
| **PTZ** | Nur bei PTZ-fähigen Kameras (z. B. RLC-823A, E1-Serie) |

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Kamera-IP / Port** | LAN-IP; Port leer = 80 (HTTP) bzw. 443 (HTTPS) |
| **Benutzer / Passwort** | Passwort wird **verschlüsselt** gespeichert |
| **HTTPS** | anhaken, wenn die Kamera nur HTTPS spricht — dann meist auch „Selbstsigniertes Zertifikat akzeptieren" |
| **Kanal** | bei NVRs: `0`, `1`, `2`, … — bei Einzelkameras `0` |
| **Intervall / Bild-Modus** | Snapshot alle 1–30 s · `cover`/`contain` |
| **PTZ anzeigen** | Steuerkreuz + Zoom einblenden (drücken-halten = bewegen, loslassen = Stop) |
| **Erkennungs-Badges** | Person/Fahrzeug/Tier/Bewegung als Overlay |

### Mehrere Kameras

Pro Kamera (oder NVR-Kanal) ein eigenes Widget anlegen und dort den passenden **Kanal** eintragen.

### API

`GET /api/plugins/reolink?action=snapshot&…` — liefert `image/jpeg` (loggt sich serverseitig per Token ein).
`POST /api/plugins/reolink` mit `action`: `status` (DevInfo/Kanäle/KI/Bewegung), `ptz` (PtzCtrl-Whitelist), `presets` (GetPtzPreset).

### Sicherheit

- Nur **private LAN-IPv4** erlaubt (SSRF-Schutz).
- Passwort versiegelt (`secretCrypto`), Token bleibt serverseitig (In-Memory-Cache, ~1 h Lease).
- Eigener Kamera-Benutzer empfohlen, damit das Admin-Passwort nicht im Dashboard liegt.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Kein Bild | IP/Benutzer/Passwort korrekt? Bei HTTPS „selbstsigniert akzeptieren" an. |
| `auth_failed` | Falsche Zugangsdaten oder Benutzer ohne Rechte. |
| PTZ ohne Wirkung | Kamera ist nicht PTZ-fähig oder Kanal falsch. |
| Badges leer | KI nur bei Kameras mit Personen-/Fahrzeugerkennung; sonst „Bewegung". |

---

## English

### Summary

**Live camera image** from Reolink cameras and NVRs in your dashboard — via the camera's **local CGI API** (no Reolink cloud account required). The image auto-refreshes (snapshot polling). Optional: **online status**, **AI/motion badges** (person/vehicle/animal/motion) and **PTZ control** (pan/tilt/zoom) for PTZ models.

### Requirements

| Item | Details |
|------|---------|
| **Local access** | Camera/NVR on the same LAN, HTTP (default port 80) or HTTPS |
| **User** | A camera user with password — a **dedicated account** is recommended (not admin) |
| **Network** | LAN addresses only (10.x, 172.16–31.x, 192.168.x) |
| **PTZ** | PTZ-capable cameras only (e.g. RLC-823A, E1 series) |

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Camera IP / port** | LAN IP; empty port = 80 (HTTP) or 443 (HTTPS) |
| **Username / password** | password stored **encrypted** |
| **HTTPS** | tick if the camera serves HTTPS only — then usually also "Accept self-signed certificate" |
| **Channel** | for NVRs: `0`, `1`, `2`, … — single cameras use `0` |
| **Interval / fit** | snapshot every 1–30 s · `cover`/`contain` |
| **Show PTZ** | overlay D-pad + zoom (press-and-hold to move, release to stop) |
| **Detection badges** | person/vehicle/animal/motion overlay |

### Multiple cameras

Add one widget per camera (or NVR channel) and set its **channel**.

### API

`GET /api/plugins/reolink?action=snapshot&…` — returns `image/jpeg` (logs in server-side via token).
`POST /api/plugins/reolink` with `action`: `status` (DevInfo/channels/AI/motion), `ptz` (PtzCtrl whitelist), `presets` (GetPtzPreset).

### Security

- Only **private LAN IPv4** allowed (SSRF protection).
- Password sealed (`secretCrypto`); token stays server-side (in-memory cache, ~1 h lease).
- A dedicated camera user is recommended so the admin password never lives in the dashboard.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| No image | IP/user/password correct? For HTTPS enable "accept self-signed". |
| `auth_failed` | Wrong credentials or a user without permissions. |
| PTZ does nothing | Camera is not PTZ-capable or wrong channel. |
| Empty badges | AI only on cameras with person/vehicle detection; otherwise "motion". |
