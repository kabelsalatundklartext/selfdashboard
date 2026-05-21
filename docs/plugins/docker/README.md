# Plugin: Docker (`docker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Listet **Docker-Container auf demselben Host** wie SelfDashboard — optional mit **CPU- und RAM-Anzeige** (Definition wie `docker stats`) und optional **Start / Stopp / Neustart** mit Bestätigungsdialog.

### Installation

1. Plugin installieren → **Strg+F5**  
2. **Docker Socket** mounten (Pflicht für dieses Plugin)  
3. Widget aufs Dashboard legen

### Voraussetzung: Docker Socket

| Host | Mount |
|------|--------|
| **Linux / Unraid** | `/var/run/docker.sock` → `/var/run/docker.sock` |
| **Unraid-Template** | Feld **Docker Socket** aktivieren |
| **Berechtigung** | Oft `--group-add=281` (Docker-GID auf Unraid) — im Template bereits gesetzt |

**Wichtig:** Es gibt **kein Remote-Docker** über den Socket — nur der Engine auf dem Host, auf dem SelfDashboard läuft.

### Funktionen

- Liste **laufender** (und je nach Filter auch gestoppter) Container  
- **CPU %** und **RAM** optional — Werte orientieren sich an der Docker-CLI (`docker stats`)  
- **Steuerung:** Start / Stopp / Restart mit **zweistufiger Bestätigung** — jeder mit Dashboard-Zugriff kann Container steuern!

### Einstellungen im Plugin (⚙️)

| Option | Wirkung |
|--------|---------|
| **Buttons** | Master-Schalter für Start/Stopp/Restart |
| **Docker-Stats** | Stats-Abruf ein/aus |
| **CPU / RAM** | Einzeln einblendbar |
| **Als Balken** | CPU/RAM zusätzlich als Balken |

### API (Kern-App)

| Aufruf | Zweck |
|--------|--------|
| `GET /api/docker-containers` | Liste; mit `?stats=1` inkl. Stats |
| `POST /api/docker-container-stats` | Stats für ausgewählte IDs |

Ab Plugin **1.7.9** / aktuellem Kern: RAM = Working Set minus Page-Cache (wie Unraid-Docker-Tab).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| **EACCES** auf Socket | GID prüfen: `stat -c '%g' /var/run/docker.sock` auf dem Host; Gruppe im Container |
| Leere Liste | Socket gemountet? Docker auf dem Host aktiv? |
| Stats 0 % / springen | Kurzes Intervall — Engine liefert manchmal ungültige CPU-Deltas (wird gefiltert) |

**Protokoll:** API-Fehler unter **Einstellungen → Protokoll**.

---

## English

Requires local Docker socket mount. Lists containers on the same host only. Optional start/stop/restart with confirmation. CPU/RAM stats optional. See Unraid template **Docker Socket** entry.
