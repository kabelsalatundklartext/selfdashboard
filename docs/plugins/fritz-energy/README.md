# Plugin: FRITZ! Steckdose Energie (`fritz-energy`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Energie der **FRITZ!Smart Energy**-Steckdose (oder kompatibles Homeauto-Gerät): **aktuelle Leistung (W)**, **heute**, **7 Tage**, **Monat** in kWh — per **TR-064 Homeauto**.

**Getrennt** vom Plugin **fritzbox** (WAN-Durchsatz-Kurve).

### Installation

Plugin installieren → **Strg+F5** → **⚙️** Box-Zugang + **AIN** der Steckdose eintragen.

### Einrichtung

| Feld | Hinweis |
|------|---------|
| **FRITZ!Box URL / Login** | Wie beim WAN-Plugin (TR-064-Benutzer) |
| **AIN** | Geräte-ID der Steckdose — in der FRITZ!Box unter **Smart Home** → Gerät → Eigenschaften |
| **Layout** | Raster (2×2 Kacheln) oder **Karussell** |
| **Intervall** | 15–300 Sekunden |

### Speicher

Verlauf und Tageswerte unter **`/app/data`** → `data/fritz-energy/` (über **Config Storage**-Mount).

### API

`POST /api/fritz-energy` — Abruf und Aggregation serverseitig.

### Tipps

- Mehrere Steckdosen = **mehrere Widget-Instanzen** mit unterschiedlicher AIN.  
- Wenn Werte 0 bleiben: Steckdose in der Box online? AIN exakt kopiert?

---

## English

Smart plug energy via TR-064 Homeauto. Needs outlet AIN from FRITZ!Box Smart Home. History stored under `data/fritz-energy/`.
