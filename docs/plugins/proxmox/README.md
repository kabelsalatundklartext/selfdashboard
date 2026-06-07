# Plugin: Proxmox VE (`proxmox`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Status deines **Proxmox VE**: Knoten (CPU/RAM), VMs/Container und deren Lauf-Status. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `https://192.168.1.9:8006` |
| **API-Token** | Format `user@realm!tokenid=UUID` — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

API-Token: Datacenter → Permissions → API Tokens. Leserechte (`PVEAuditor`) genügen.

### API

`POST /api/plugins/proxmox` — Proxy zur Proxmox-API (`/nodes`, `/cluster/resources`).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | Token-Format/Rechte prüfen |
| TLS | Selbstsigniertes Zertifikat akzeptiert? |

---

## English

### Summary

Status of your **Proxmox VE**: nodes (CPU/RAM), VMs/containers and their run state. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `https://192.168.1.9:8006` |
| **API token** | format `user@realm!tokenid=UUID` — stored **encrypted** |
| **Refresh** | interval in seconds |

API token: Datacenter → Permissions → API Tokens. Read-only (`PVEAuditor`) is enough.

### API

`POST /api/plugins/proxmox` — proxy to the Proxmox API (`/nodes`, `/cluster/resources`).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Check token format/permissions |
| TLS | Self-signed cert accepted? |
