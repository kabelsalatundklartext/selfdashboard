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

### Bosch Smart Home über dieses Plugin

Für **Bosch Smart Home** gibt es bewusst **kein eigenes Plugin**: Der Bosch Smart Home Controller (SHC) spricht lokal nur über **mTLS mit Client-Zertifikat** (einmaliges Pairing per Knopfdruck am Controller). Das passt nicht in das Token-/Passwort-Modell der übrigen Plugins.

Der saubere Weg ist die **offizielle Bosch-SHC-Integration in Home Assistant**:

1. In Home Assistant → **Einstellungen → Geräte & Dienste → Integration hinzufügen → „Bosch Smart Home"**.
2. Controller-IP eintragen und **am SHC den Pairing-Knopf** drücken (HA übernimmt das Zertifikat-Handling).
3. Bosch-Geräte (Thermostate, Tür-/Fensterkontakte, Zwischenstecker, Bewegungsmelder …) erscheinen danach als normale HA-Entitäten.
4. Im SelfDashboard dieses **Home-Assistant-Plugin** hinzufügen und die Bosch-Entitäten (`climate.*`, `binary_sensor.*`, `switch.*`, `sensor.*`) auswählen.

→ Bosch läuft so vollständig, ohne neuen Code und ohne SSRF-/Zertifikats-Sonderfälle.

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

### Bosch Smart Home via this plugin

There is deliberately **no dedicated Bosch plugin**: the Bosch Smart Home Controller (SHC) only speaks locally over **mTLS with a client certificate** (one-time pairing by pressing the button on the controller). That does not fit the token/password model of the other plugins.

The clean path is the **official Bosch SHC integration in Home Assistant**:

1. In Home Assistant → **Settings → Devices & Services → Add Integration → "Bosch Smart Home"**.
2. Enter the controller IP and **press the pairing button on the SHC** (HA handles the certificate).
3. Bosch devices (thermostats, door/window contacts, plugs, motion sensors …) then appear as normal HA entities.
4. Add this **Home Assistant plugin** in SelfDashboard and pick the Bosch entities (`climate.*`, `binary_sensor.*`, `switch.*`, `sensor.*`).

→ Bosch works fully this way — no new code, no SSRF/certificate special cases.

### API

`POST /api/plugins/home-assistant` — proxy to the HA REST API (`/api/states`).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Token valid? |
| Empty | Entity IDs spelled correctly? |
