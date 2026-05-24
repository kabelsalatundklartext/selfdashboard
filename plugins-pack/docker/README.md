# Plugin: Docker (`docker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Container auf **demselben Host** wie SelfDashboard — optional **CPU/RAM** (wie `docker stats`) und **Start/Stopp/Restart** mit Bestätigung.

### Voraussetzung

**Docker Socket:** `/var/run/docker.sock` → Container (Unraid: Template **Docker Socket**, ggf. `--group-add=281`).

**Kein Remote-Docker** über den Socket.

### Einstellungen (⚙️)

Master **Buttons**, **Stats**, **CPU/RAM**, optional Balken.

### API

`GET /api/plugins/docker/containers?stats=1`, `POST /api/plugins/docker/containers` (actions)

RAM ab Kern/Plugin 1.7.9: Working Set minus Page-Cache (wie CLI).

### Fehlerbehebung

**EACCES** → Socket-GID prüfen. Leere Liste → Socket gemountet?

---

## English

### Summary

Containers on the **same host** as SelfDashboard — optional **CPU/RAM** (like `docker stats`) and **start/stop/restart** with confirmation.

### Requirement

**Docker socket:** `/var/run/docker.sock` → container (Unraid: **Docker Socket** template, often `--group-add=281`).

**No remote Docker** over the socket.

### Settings (⚙️)

Master **buttons**, **stats**, **CPU/RAM**, optional bars.

### API

`GET /api/plugins/docker/containers?stats=1`, `POST /api/plugins/docker/containers` (actions)

RAM (core/plugin 1.7.9+): working set minus page cache (CLI-aligned).

### Troubleshooting

**EACCES** → check socket GID. Empty list → socket mounted?
