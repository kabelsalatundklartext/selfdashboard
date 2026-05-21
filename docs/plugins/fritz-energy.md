# Plugin: FRITZ! Steckdose Energie (`fritz-energy`)

[← Katalog](README.md)

## Deutsch

Strom der **FRITZ!Smart Energy**-Steckdose: aktuell **W**, **heute**, **7 Tage**, **Monat** kWh.

| Thema | Details |
|-------|---------|
| **API** | `POST /api/fritz-energy` |
| **Setup** | Gleiche Box wie WAN-Plugin; **AIN** der Steckdose |
| **Speicher** | `data/fritz-energy/` unter `/app/data` |
| **Layout** | Raster (2×2) oder Karussell |
| **Intervall** | 15–300 s |

Getrennt vom Plugin **fritzbox** (WAN-Kurve).

## English

Smart plug energy via TR-064 Homeauto. Needs outlet AIN from FRITZ!Box Smart Home. History stored under `data/fritz-energy/`.
