# Plugin: FRITZ!Box Internet (`fritzbox`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Live-Kurve der WAN-Durchsatzrate** (Download/Upload in Mbit/s) per **TR-064** direkt an der FRITZ!Box — **ohne** extra Dienst auf der Box.

### Installation

Plugin installieren → **Strg+F5** → Widget **⚙️** mit Box-Zugangsdaten füllen.

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **URL** | `https://fritz.box` oder `http://192.168.178.1` |
| **Benutzer / Passwort** | TR-064-Benutzer (in FRITZ!Box anlegen) |
| **HTTPS** | Bei Zertifikatswarnung: selbstsigniert erlauben oder HTTP im LAN |
| **Volles Intervall** | 0–300 s — `0` = nur beim Laden des Dashboards |
| **Zähler-Takt** | 3–15 s für flüssigere Kurve zwischen vollen Abrufen |
| **Layout** | Vertikal (schmal) oder horizontal (breites Widget) |
| **Y-Achse** | Auto-Skalierung oder festes Mbit/s-Maximum |
| **Sprache** | Auto / Deutsch / Englisch für UI-Texte im Widget |

### Besonderheiten

| Thema | Details |
|-------|---------|
| **API** | `POST /api/fritzbox` — optional `lite: true` nur für Zähler-Update |
| **Verlauf** | Letzte Kurvenpunkte im **Browser-`localStorage`** (bis **7 Tage**) — Kurve nicht leer nach Reload |
| **Sanity-Cap** | Optionales Maximum Mbit/s pro Richtung gegen Ausreißer |
| **Plot-Höhe** | `0` = Standard **168 px**; `1–220` = exakte Höhe in Pixel |

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login fehlgeschlagen | TR-064-Benutzer aktiv? Zwei-Faktor blockiert oft TR-064 — separaten Benutzer nutzen |
| Kurve leer nach Neustart | Normal, bis neue Punkte gesammelt sind — Cache füllt sich wieder |
| Werte zu hoch | Sanity-Cap in den Einstellungen setzen |

---

## English

Live WAN throughput chart via TR-064. Configure URL, credentials, refresh interval, and display options in the widget settings.
