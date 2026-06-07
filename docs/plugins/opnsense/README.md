# Plugin: OPNsense (`opnsense`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Überblick deiner **OPNsense**-Firewall: Systemstatus, WAN/Gateway, Durchsatz. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `https://192.168.1.1` |
| **API-Key / API-Secret** | OPNsense → System → Zugriff → Benutzer → API — **Secret verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/opnsense` — Proxy zur OPNsense-API (Key/Secret).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | API-Key/Secret prüfen |
| TLS | Selbstsigniertes Zertifikat akzeptiert? |

---

## English

### Summary

Overview of your **OPNsense** firewall: system status, WAN/gateway, throughput. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `https://192.168.1.1` |
| **API key / secret** | OPNsense → System → Access → Users → API — **secret stored encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/opnsense` — proxy to the OPNsense API (key/secret).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Check API key/secret |
| TLS | Self-signed cert accepted? |
