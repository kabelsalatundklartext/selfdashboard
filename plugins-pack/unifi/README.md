# Plugin: UniFi Controller (`unifi`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Überblick deines **UniFi**-Netzwerks: verbundene Clients, Geräte (APs/Switches) und Durchsatz. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Controller-URL** | z. B. `https://192.168.1.2:8443` (oder UDM) |
| **Benutzer / Passwort** | lokaler UniFi-Benutzer — **verschlüsselt** gespeichert |
| **Site** | meist `default` |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/unifi` — Login + `/api/s/<site>/stat/sta` & `/stat/device`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login-Fehler | lokaler Benutzer (kein Cloud-Login), 2FA aus |
| TLS | Selbstsigniertes Zertifikat akzeptiert? |

---

## English

### Summary

Overview of your **UniFi** network: connected clients, devices (APs/switches) and throughput. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Controller URL** | e.g. `https://192.168.1.2:8443` (or UDM) |
| **User / password** | local UniFi user — stored **encrypted** |
| **Site** | usually `default` |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/unifi` — login + `/api/s/<site>/stat/sta` & `/stat/device`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Login error | Use a local user (not cloud login), 2FA off |
| TLS | Self-signed cert accepted? |
