# Plugin: Home Assistant (`home-assistant`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **ausgewählte Home-Assistant-Entitäten** (Sensoren, Schalter, Lichter …) mit Zustand/Wert. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Basis-URL** | z. B. `http://homeassistant.local:8123` |
| **Long-Lived Access Token** | HA → Profil → Sicherheit → Token erstellen |
| **Entitäten** | Entity-IDs auswählen/eintragen |

Token wird **verschlüsselt** gespeichert.

### API

`POST /api/plugins/home-assistant` — Proxy zur HA-REST-API (`/api/states`).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 | Token gültig? |
| Leer | Entity-IDs korrekt geschrieben? |

---

## English

### Summary

Shows **selected Home Assistant entities** (sensors, switches, lights …) with state/value. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Base URL** | e.g. `http://homeassistant.local:8123` |
| **Long-lived access token** | HA → Profile → Security → create token |
| **Entities** | pick/enter entity IDs |

Token stored **encrypted**.

### API

`POST /api/plugins/home-assistant` — proxy to the HA REST API (`/api/states`).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Token valid? |
| Empty | Entity IDs spelled correctly? |
