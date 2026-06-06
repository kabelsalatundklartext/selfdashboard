# FRITZ! Smart Home — Beta

Steuert und zeigt **FRITZ! Smart-Home-Geräte** (FRITZ!DECT) über das **AHA-HTTP-Interface** der FRITZ!Box (`/webservices/homeautoswitch.lua`). Anmeldung per FRITZ!Box-Benutzer + Passwort (SID-Login, serverseitig).

## Was es kann

- **Heizthermostate** (z. B. FRITZ!DECT 301/302, Comet DECT): Ist-Temperatur, Fenster-offen, Akku-Warnung + **Soll-Temperatur per − / +** (8–28 °C).
- **Steckdosen** (FRITZ!DECT 200/210): **an/aus** + aktuelle **Leistung (W)**.
- **Fensterkontakte**: „Offen / Zu" mit Icon.
- **Sensoren**: Temperatur und Luftfeuchte.
- Einzelne Geräte aus-/einblendbar.

## Einrichtung

1. **FRITZ!Box-Benutzer mit Smart-Home-Recht** (empfohlen ein eigener nur fürs Dashboard): FRITZ!Box → *System → FRITZ!Box-Benutzer*.
2. Im Widget unter *Einstellungen* eintragen:
   - **FRITZ!Box-Adresse** — z. B. `fritz.box` oder die IP (`192.168.178.1`)
   - **Benutzer** (optional, je nach FRITZ!OS) und **Passwort**
3. Auf **Neu laden** klicken — die Smart-Home-Geräte erscheinen. Per Häkchen ein-/ausblenden.

Login per **PBKDF2-Challenge-Response** (Fallback MD5 für ältere FRITZ!OS). Das Passwort wird **verschlüsselt** gespeichert (`SELFDASHBOARD_SECRET_KEY`), Zugriff nur serverseitig (SSRF-geschützt).

## Hinweise (Beta)

- Soll-Temperatur in 0,5-°C-Schritten; FRITZ-intern als Halb-Grad-Wert (16–56), 253 = Aus, 254 = An.
- Erkennung über die `getdevicelistinfos`-Datenpunkte (`hkr`, `switch`, `alert`, `temperature`).

API: `POST /api/plugins/fritz-smarthome` (Aktionen `state`, `set`).
