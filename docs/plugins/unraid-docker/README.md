# Plugin: Unraid Docker (`unraid-docker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Docker-Container auf Unraid über **GraphQL API** — **ohne** Docker-Socket. Optional Live-Stats (WebSocket), Tabelle/Zeilen, Start/Stopp/Restart mit Bestätigung.

### Installation

Plugin-Store → **Unraid Docker** → **Strg+F5** → URL + API-Key wie beim **Unraid**-Plugin.

### Unraid Docker vs Docker (Socket)

| | **Unraid Docker** | **Docker** |
|---|-------------------|------------|
| Zugang | Unraid GraphQL | `docker.sock` |
| Host | Unraid NAS API | Host where SelfDashboard runs |

### Funktionen

- Containerliste, optional CPU/RAM  
- Start/Stopp/Restart mit Abfrage  
- Tabellen- oder Kompaktlayout

### Fehlerbehebung

Keine Container → API-Key, Version. Steuerung → **Protokoll**.

---

## English

### Summary

Docker containers on Unraid via **GraphQL API** — **no** Docker socket. Optional live stats (WebSocket), table/row layout, start/stop/restart with confirmation.

### Installation

Plugin Store → **Unraid Docker** → **Ctrl+F5** → URL + API key (same as **Unraid** system plugin).

### Unraid Docker vs Docker (socket)

| | **Unraid Docker** | **Docker** |
|---|-------------------|------------|
| Access | Unraid GraphQL | `docker.sock` |
| Host | Unraid NAS API | Host where SelfDashboard runs |

### Features

- Container list, optional CPU/RAM  
- Start/stop/restart with confirmation  
- Table or compact row layout

### Troubleshooting

No containers → API key, version. Control issues → **Logs**.
