# Plugin: FRITZ!Box Internet (`fritzbox`)

[← Katalog](README.md)

## Deutsch

WAN-Durchsatz-Kurve per **TR-064** (kein Extra-Dienst auf der Box).

| Thema | Details |
|-------|---------|
| **API** | `POST /api/fritzbox` |
| **Auth** | TR-064-Benutzer + Passwort, optional selbstsigniertes HTTPS |
| **Intervall** | 0–300 s voller Abruf; **Zähler-Takt** 3–15 s für flüssigere Kurve |
| **Cache** | Kurve im Browser-`localStorage` (bis 7 Tage) |
| **Layout** | Vertikal oder horizontal (breites Widget) |
| **Y-Achse** | Auto oder festes Mbit/s-Maximum |

## English

Live WAN throughput chart via TR-064. Configure URL, credentials, refresh interval, and display options in the widget settings.
