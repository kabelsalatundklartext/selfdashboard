# Plugin: Unraid (`unraid`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Unraid 7.2+** per **GraphQL API**: CPU, RAM, Array, Cache/Pool-Disks mit Status, Temperatur, Belegung.

### Installation

1. Plugin-Store → **Unraid** → **Strg+F5**  
2. Unraid: **Management Access → API** — Key erzeugen  
3. Widget **⚙️**: URL + API-Key

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **URL** | `https://IP` oder Hostname |
| **API-Key** | GraphQL key (nicht Root-Passwort) |
| **RAM-Modus** | Belegt / verfügbar / API-% |
| **Intervall** | Sekunden |

### Voraussetzungen

- Unraid **7.2+**  
- API vom Container aus erreichbar  
- **Kein** Docker-Socket nötig (anders als **Unraid Docker**)

### Mehrere Server

Pro NAS eine Widget-Instanz mit eigener URL/Key.

### Fehlerbehebung

GraphQL-Fehler → Key, API aktiv? HTTPS im LAN testen.

**Protokoll:** API-Fehler filtern.

---

## English

### Summary

**Unraid 7.2+** via **GraphQL API**: CPU, RAM, array and cache/pool disks with status, temperature, and usage.

### Installation

1. Plugin Store → **Unraid** → **Ctrl+F5**  
2. On Unraid: **Management Access → API** — create key  
3. Widget **⚙️**: URL + API key

### Setup (widget ⚙️)

| Field | Notes |
|-------|-------|
| **URL** | `https://IP` or hostname |
| **API key** | GraphQL key (not root password) |
| **RAM mode** | Used / available / API % |
| **Interval** | Seconds |

### Requirements

- Unraid **7.2+**  
- API reachable from container  
- **No** Docker socket (unlike **Unraid Docker** plugin)

### Multiple servers

One widget instance per NAS with its own URL/key.

### Troubleshooting

GraphQL errors → check key, API enabled, HTTPS on LAN.

**Logs:** filter API errors.
