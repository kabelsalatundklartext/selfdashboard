# Plugin: Unraid Docker (`unraid-docker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Docker-Container auf **Unraid** über die **Unraid GraphQL API** — **ohne** Docker-Socket auf dem Unraid-Host. Optional **Live-Stats** (WebSocket), Tabellen- oder Zeilenansicht, **Start/Stopp/Neustart** mit Bestätigung.

### Installation

1. Plugin-Store → **Unraid Docker** installieren → **Strg+F5**  
2. Unraid **API-Key** wie beim **Unraid**-System-Plugin  
3. Widget **⚙️** → URL + Key + Darstellungsoptionen

### Unraid Docker vs Docker-Plugin

| | **Unraid Docker** | **Docker** (Socket) |
|---|-------------------|---------------------|
| **Zugang** | Unraid GraphQL API | `/var/run/docker.sock` |
| **Host** | Unraid-API des NAS | Host, auf dem SelfDashboard läuft |
| **Typisch** | SelfDashboard **auf demselben Unraid** | SelfDashboard in VM/Docker auf Unraid mit Socket-Mount |

Wenn SelfDashboard **nicht** auf Unraid läuft, aber Unraid remote verwalten willst: nur möglich, wenn die **Unraid-API** vom Container aus erreichbar ist — nicht der Socket des NAS von außen.

### Funktionen

- Containerliste mit Status  
- **Tabellen-** oder **Kompaktzeilen**-Layout  
- Optional **CPU/RAM** (Live-Updates per WebSocket, wenn API unterstützt)  
- **Start / Stopp / Restart** mit Sicherheitsabfrage

### Einrichtung

| Feld | Hinweis |
|------|---------|
| **URL + API-Key** | Wie Plugin **Unraid** |
| **Buttons** | Steuerung ein/aus |
| **Stats / Layout** | In den Widget-Einstellungen |

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Keine Container | API-Key, Unraid-Version, Berechtigung |
| Stats fehlen | WebSocket/Firewall; Stats-Option im Widget prüfen |
| Steuerung wirkt nicht | Container-Name/ID aus API — Logs prüfen |

**Protokoll:** **Einstellungen → Protokoll** bei API-Fehlern.
