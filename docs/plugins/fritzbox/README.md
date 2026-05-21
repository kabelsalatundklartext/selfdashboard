# Plugin: FRITZ!Box WAN (`fritzbox`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**WAN-Durchsatz-Kurve** (Mbit/s) per **TR-064** — kein Extra-Dienst auf der Box.

### Einrichtung (⚙️)

| Thema | Details |
|-------|---------|
| **URL / Login** | TR-064-Benutzer |
| **Intervall** | 0–300 s; Zähler-Takt 3–15 s |
| **Cache** | `localStorage`, bis 7 Tage |
| **Layout** | Vertikal/horizontal, Y-Achse auto/fest |

### API

`POST /api/fritzbox` — optional `lite: true`

### Fehlerbehebung

Login → TR-064-Benutzer, 2FA oft problematisch.

---

## English

### Summary

**WAN throughput chart** (Mbit/s) via **TR-064** — no extra service on the box.

### Setup (⚙️)

| Topic | Details |
|-------|---------|
| **URL / login** | TR-064 user |
| **Interval** | 0–300 s; counter tick 3–15 s |
| **Cache** | `localStorage`, up to 7 days |
| **Layout** | Vertical/horizontal, Y-axis auto/fixed |

### API

`POST /api/fritzbox` — optional `lite: true`

### Troubleshooting

Login → TR-064 user; 2FA often blocks TR-064.
