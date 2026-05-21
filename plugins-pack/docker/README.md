# Plugin: Docker (`docker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Voraussetzung

Docker-Socket mounten: Host `/var/run/docker.sock` → Container `/var/run/docker.sock` (read-only reicht oft). Unraid-Template: **Docker Socket** + ggf. `--group-add=281`.

Nur Container auf **demselben Host** wie SelfDashboard — kein Remote-Docker über Socket.

### Funktionen

- Liste laufender Container
- Optional **Start / Stopp / Neustart** (zweistufige Bestätigung) — wer das Dashboard öffnet, kann steuern
- **CPU & RAM** optional (`docker stats`-ähnlich)

### Einstellungen im Plugin

Master **Buttons**, **Docker-Stats**, einzeln **CPU** / **RAM**, optional **CPU/RAM als Balken**.

### API

`GET/POST /api/docker-containers` — Stats mit `?stats=1`.

### Fehler

**EACCES** auf Socket: GID prüfen (`stat -c '%g' /var/run/docker.sock` auf dem Host).

---

## English

Requires local Docker socket mount. Lists containers on the same host only. Optional start/stop/restart with confirmation. CPU/RAM stats optional. See Unraid template **Docker Socket** entry.
