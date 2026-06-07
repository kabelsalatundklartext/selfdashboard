# Plugin: Bambu Lab Kamera (`bambu-cam`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Live-Kamerabild** von Bambu-Lab-Druckern im Dashboard — als Bild, das sich automatisch aktualisiert. Zwei Quellen: **P1/A1 lokal** (Port 6000) oder eine beliebige **MJPEG-/Snapshot-URL** (z. B. X1 via go2rtc).

### Voraussetzungen

| Punkt | Details |
|-------|---------|
| **LAN Mode Liveview** | Am Drucker aktivieren (Cloud-Betrieb möglich, LAN-Only/Entwicklermodus nicht zwingend) |
| **IP + Zugangscode** | Drucker → Einstellungen → Netzwerk/LAN |
| **Netz** | Nur LAN-Adressen (10.x, 172.16–31.x, 192.168.x) |

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Quelle** | `P1/A1 (lokal)` oder `Stream-URL` |
| **Drucker-IP / Zugangscode** | bei P1/A1 — Code wird **verschlüsselt** gespeichert |
| **Stream-URL** | bei X1 & Co.: MJPEG/Snapshot, optional „MJPEG-Dauerstream" |
| **Intervall / Bild-Modus** | Snapshot alle 1–30 s · `contain`/`cover` |

### Hinweis X1

Auf aktueller A1/X1-Firmware ist die Kamera teils **RTSP (Port 322)** — dann einen Re-Streamer (go2rtc/OctoEverywhere) nutzen und dessen MJPEG-/Snapshot-URL im **Stream-URL-Modus** eintragen.

### API

`GET /api/plugins/bambu-cam?action=snapshot|proxy` — liefert `image/jpeg` bzw. proxyt die Stream-URL.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Kein Bild | „LAN Mode Liveview" an? IP/Zugangscode korrekt? |
| X1 schwarz | RTSP — go2rtc + Stream-URL-Modus |

---

## English

### Summary

**Live camera image** from Bambu Lab printers, auto-refreshing. Two sources: **P1/A1 local** (port 6000) or any **MJPEG/snapshot URL** (e.g. X1 via go2rtc).

### Requirements

| Item | Details |
|------|---------|
| **LAN Mode Liveview** | Enable on the printer (cloud mode is fine; LAN-only/developer not required) |
| **IP + access code** | Printer → Settings → Network/LAN |
| **Network** | LAN addresses only (10.x, 172.16–31.x, 192.168.x) |

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Source** | `P1/A1 (local)` or `Stream URL` |
| **Printer IP / access code** | for P1/A1 — code stored **encrypted** |
| **Stream URL** | for X1 etc.: MJPEG/snapshot, optional "continuous MJPEG" |
| **Interval / fit** | snapshot every 1–30 s · `contain`/`cover` |

### X1 note

Current A1/X1 firmware often exposes the camera as **RTSP (port 322)** — use a re-streamer (go2rtc/OctoEverywhere) and paste its MJPEG/snapshot URL in **Stream URL mode**.

### API

`GET /api/plugins/bambu-cam?action=snapshot|proxy` — returns `image/jpeg` or proxies the stream URL.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| No image | "LAN Mode Liveview" on? IP/access code correct? |
| X1 black | RTSP — use go2rtc + Stream URL mode |
