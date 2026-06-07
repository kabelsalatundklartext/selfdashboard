# Plugin: Speedtest Tracker (`speedtest-tracker`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt die letzten Ergebnisse von **Speedtest Tracker**: Download/Upload (Mbit/s), Ping und einen kleinen Verlauf.

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `http://192.168.1.7` |
| **API-Token** | Speedtest Tracker → Profil → API-Token — **verschlüsselt** gespeichert |
| **Aktualisieren** | Intervall in Sek. |

### API

`POST /api/plugins/speedtest-tracker` — Proxy zu `/api/v1/results`.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | Token gültig? |
| Leer | schon ein Test gelaufen? |

---

## English

### Summary

Shows the latest **Speedtest Tracker** results: download/upload (Mbit/s), ping and a small history.

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `http://192.168.1.7` |
| **API token** | Speedtest Tracker → Profile → API token — stored **encrypted** |
| **Refresh** | interval in seconds |

### API

`POST /api/plugins/speedtest-tracker` — proxy to `/api/v1/results`.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Token valid? |
| Empty | Has a test run yet? |
