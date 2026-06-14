# Plugin: Uptime Kuma (`uptime-kuma`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt den Status deiner **Uptime-Kuma**-Monitore: hoch/runter, Anzahl und optional Antwortzeiten — über eine **Status-Seite**.

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Status-Seiten-URL** | z. B. `http://192.168.1.4:3001/status/<slug>` |
| **Aktualisieren** | Intervall in Sek. |

Tipp: In Uptime Kuma eine **Status-Seite** anlegen und deren Slug verwenden (liefert JSON unter `/api/status-page/<slug>`).

### API

`POST /api/plugins/uptime-kuma` — liest die Status-Seiten-JSON (Heartbeats/Monitore).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Leer | Status-Seite veröffentlicht? Slug korrekt? |
| Erreichbarkeit | URL im LAN, Firewall |

---

## English

### Summary

Shows the status of your **Uptime Kuma** monitors: up/down, counts and optionally response times — via a **status page**.

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Status page URL** | e.g. `http://192.168.1.4:3001/status/<slug>` |
| **Refresh** | interval in seconds |

Tip: create a **status page** in Uptime Kuma and use its slug (JSON under `/api/status-page/<slug>`).

### API

`POST /api/plugins/uptime-kuma` — reads the status-page JSON (heartbeats/monitors).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty | Status page published? Slug correct? |
| Reachability | URL on LAN, firewall |
