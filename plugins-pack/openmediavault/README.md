# Plugin: OpenMediaVault (`openmediavault`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Status deines **OpenMediaVault (OMV)** NAS: System-Infos, Dienste und Dateisysteme/Belegung. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `http://192.168.1.6` |
| **Benutzer / Passwort** | OMV-Admin — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/openmediavault` — OMV-RPC (Login + Dienste/Dateisysteme).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login-Fehler | Benutzer/Passwort, Erreichbarkeit |
| HTTPS | Selbstsigniertes Zertifikat? im LAN oft HTTP |

---

## English

### Summary

Status of your **OpenMediaVault (OMV)** NAS: system info, services and filesystems/usage. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `http://192.168.1.6` |
| **User / password** | OMV admin — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/openmediavault` — OMV RPC (login + services/filesystems).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Login error | Check user/password and reachability |
| HTTPS | Self-signed cert? HTTP on LAN often works |
