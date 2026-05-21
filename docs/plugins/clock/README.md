# Plugin: Uhr (`clock`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **Uhrzeit**, **Datum**, **Wochentag** und optional einen **Ortsnamen** — mit frei wählbarer **Zeitzone** (z. B. `Europe/Berlin` oder `America/New_York`).

### Installation

Plugin-Store → **Uhr** installieren → **Strg+F5** → Widget hinzufügen.

### Einrichtung (Widget ⚙️)

| Einstellung | Hinweis |
|-------------|---------|
| **Zeitzone** | IANA-Name, z. B. `Europe/Berlin` — Liste: [tz database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) |
| **Ortsname** | Optionaler Text unter der Uhr (z. B. „Zuhause“, „Serverraum“) |
| **Format** | 12h/24h und Datumsdarstellung je nach Plugin-Version in den Einstellungen |

### Hinweise

- Keine externe API — die Zeit kommt vom **Browser** bzw. System des Clients.  
- Für Wand-Tablets: Geräte-Zeitzone und SelfDashboard-`TZ` im Container können abweichen — bei Bedarf explizite Zeitzone im Widget setzen.  
- Kleines Widget (1×1 oder 2×1) reicht für reine Zeitanzeige.

### Speicher

Konfiguration pro Widget-Instanz in **`dashboard.json`**.
