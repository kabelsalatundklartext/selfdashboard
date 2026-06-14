# Plugin: TrueNAS (`truenas`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Status deines **TrueNAS** (CORE/SCALE): Pools, Kapazität/Belegung und Disk-Zustand. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `https://192.168.1.8` |
| **API-Key** | TrueNAS → Account → API Keys — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/truenas` — Proxy zur TrueNAS-API v2 (`/pool`, `/disk`).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | API-Key prüfen |
| TLS | Selbstsigniertes Zertifikat akzeptiert? |

---

## English

### Summary

Status of your **TrueNAS** (CORE/SCALE): pools, capacity/usage and disk health. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `https://192.168.1.8` |
| **API key** | TrueNAS → Account → API Keys — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/truenas` — proxy to the TrueNAS API v2 (`/pool`, `/disk`).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Check the API key |
| TLS | Self-signed cert accepted? |
