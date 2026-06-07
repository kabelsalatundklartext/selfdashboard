# Plugin: Philips Hue (`hue`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Steuert **Philips-Hue**-Lampen und -Räume über die **lokale Bridge-API**: an/aus, Helligkeit, **echte Lichtfarbe** und **Szenen**. Ansichten Karten/Kompakt/Kacheln, Räume/Lampen umschaltbar. **(Beta)**

### Einrichtung (⚙️)

| Feld | Details |
|------|---------|
| **Bridge-IP** | lokale IP der Hue-Bridge |
| **Koppeln** | Knopf auf der Bridge drücken, dann im Plugin koppeln → API-Key (**verschlüsselt** gespeichert) |
| **Darstellung** | Karten / Kompakt / Kacheln; Farbe-als-Hintergrund, Versionsnummer, ausgeblendete Räume/Lampen |

### Farbe & Szenen

Pro Raum öffnet ein **Paletten-Button** ein Panel mit **Farb-Voreinstellungen + eigener Farbe + Szenen** (Raum-Szenen aus der Hue-App). Standardmäßig zugeklappt.

### API

`POST /api/plugins/hue` — `action: state|set|pair` (v1-Bridge-API: groups/lights/scenes).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Koppeln scheitert | Bridge-Knopf drücken, innerhalb 30 s erneut |
| Keine Szenen | in der Hue-App Raum-Szenen anlegen |

---

## English

### Summary

Controls **Philips Hue** lights and rooms via the **local bridge API**: on/off, brightness, **true light colour** and **scenes**. Cards/compact/tiles views, rooms/lights toggle. **(Beta)**

### Setup (⚙️)

| Field | Details |
|-------|---------|
| **Bridge IP** | local IP of the Hue bridge |
| **Pair** | press the bridge button, then pair in the plugin → API key (stored **encrypted**) |
| **Display** | cards / compact / tiles; colour-as-background, version, hidden rooms/lights |

### Colour & scenes

Per room a **palette button** opens a panel with **colour presets + custom colour + scenes** (room scenes from the Hue app). Collapsed by default.

### API

`POST /api/plugins/hue` — `action: state|set|pair` (v1 bridge API: groups/lights/scenes).

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Pairing fails | Press the bridge button, retry within 30 s |
| No scenes | Create room scenes in the Hue app |
