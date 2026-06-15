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

### Netzwerk-Auslastung (optional)

Zeigt RX/TX-Durchsatz und Auslastung pro Interface. Im Widget **⚙️** unter „🌐 Netzwerk" aktivieren.

- Erfordert **Unraid API 4.35.0+** (PR [unraid/api#2003](https://github.com/unraid/api/pull/2003)).
- Standardmäßig **aus** — ältere API-Versionen bleiben unberührt (die Netzwerk-Felder werden nur abgefragt, wenn aktiviert).
- `lo` und `veth*`-Interfaces werden ausgeblendet.
- Version prüfen: `unraid-api version`.

### Voraussetzungen

- Unraid **7.2+** (Netzwerk-Auslastung: API **4.35.0+**)  
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

### Network utilization (optional)

Shows RX/TX throughput and utilization per interface. Enable in the widget **⚙️** under "🌐 Network".

- Requires **Unraid API 4.35.0+** (PR [unraid/api#2003](https://github.com/unraid/api/pull/2003)).
- **Off** by default — older API versions are unaffected (network fields are only queried when enabled).
- `lo` and `veth*` interfaces are hidden.
- Check version: `unraid-api version`.

### Requirements

- Unraid **7.2+** (network utilization: API **4.35.0+**)  
- API reachable from container  
- **No** Docker socket (unlike **Unraid Docker** plugin)

### Multiple servers

One widget instance per NAS with its own URL/key.

### Troubleshooting

GraphQL errors → check key, API enabled, HTTPS on LAN.

**Logs:** filter API errors.
