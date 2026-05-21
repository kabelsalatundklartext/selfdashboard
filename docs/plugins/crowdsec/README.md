# Plugin: CrowdSec (`crowdsec`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Optional: zeigt **Alerts und aktive Entscheidungen (Bans)** aus der lokalen **`crowdsec.db`** — mit Zeitraumfilter, optional **Länder-Flags** (GeoIP) und optionalem **Entsperren** per `cscli` im CrowdSec-Container.

**SelfDashboard braucht CrowdSec nicht.** Ohne Mount und ohne Widget läuft das Dashboard normal.

### Installation

1. Plugin-Store → **CrowdSec** installieren → **Strg+F5**  
2. Unraid/Docker: optional **CrowdSec Data** mounten (siehe unten)  
3. Widget **⚙️** → DB-Pfad oder Standard unter `/crowdsec-data`  
4. Optional: **Docker Socket** + Container-Name für Entsperren

### Datenquelle

| Thema | Details |
|-------|---------|
| **Datenbank** | SQLite **`crowdsec.db`** — nur **read-only** mounten |
| **Mount** | Host-Ordner → **`/crowdsec-data`** im Container |
| **Unraid** | Template-Feld **CrowdSec Data (optional)** |
| **Zeitraum** | Im Widget: 1 / 7 / 30 / 90 / 365 Tage |

### GeoIP (Länder)

| Option | Details |
|--------|---------|
| **Im Mount** | `GeoLite2-City.mmdb` oder `GeoLite2-Country.mmdb` im CrowdSec-Datenordner |
| **Env** | `CROWDSEC_GEOIP_PATH` = voller Pfad zur `.mmdb`, falls nicht im Mount |

Ohne GeoIP: IPs werden angezeigt, Länder oft `??`.

### Entsperren (optional)

| Voraussetzung | Details |
|---------------|---------|
| **Docker Socket** | `/var/run/docker.sock` → Container (read-only reicht oft) |
| **Container-Name** | Standard `crowdsec` — Env `CROWDSEC_CONTAINER` oder Widget-Einstellung |
| **Plugin** | Entsperren in den Widget-Einstellungen aktivieren |

SelfDashboard führt **`docker exec … cscli decisions delete …`** auf dem **lokalen Host** aus — nur sinnvoll, wenn CrowdSec dort als Container läuft.

### Umgebungsvariablen (optional)

| Variable | Bedeutung |
|----------|-----------|
| `CROWDSEC_DATA_DIR` | Erlaubtes Wurzelverzeichnis für DB-Pfade (Standard `/crowdsec-data`) |
| `CROWDSEC_GEOIP_PATH` | Pfad zur GeoIP-Datenbank |
| `CROWDSEC_DB_PATH` | Standard-DB, wenn im Widget kein Pfad gesetzt |
| `CROWDSEC_CONTAINER` | Docker-Name für `cscli` (Standard `crowdsec`) |

### Beispiel-Mount

```bash
-v /mnt/user/appdata/crowdsec/data:/crowdsec-data:ro
```

### API

Kern-Routen in der App: **`/api/crowdsec`**, Entscheidungen z. B. **`POST /api/crowdsec/decision`**.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| `crowdsec.db not found` | Mount setzen oder Widget entfernen |
| Nur `??` bei Ländern | GeoLite2-Datei in den Data-Ordner legen |
| Entsperren schlägt fehl | Docker-Socket, Container-Name, Berechtigung `cscli` |

---

## English

Optional widget reading local `crowdsec.db` from `/crowdsec-data`. No CrowdSec required to run SelfDashboard. Optional unban via Docker socket + `cscli`.
