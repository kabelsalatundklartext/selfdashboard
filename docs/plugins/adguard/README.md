# Plugin: AdGuard Home (`adguard`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **DNS-Statistik** und den **Schutzstatus** deiner AdGuard-Home-Instanz auf dem Dashboard: Anfragen, gesperrte Anfragen, Block-Anteil, optional durchschnittliche Antwortzeit. Der **DNS-Schutz** lässt sich per Klick im Widget ein- und ausschalten.

### Installation

1. **Plugin-Store → Von GitHub** → **AdGuard Home** installieren  
2. **Strg+F5** (Hard-Reload)  
3. Widget mit **+** aufs Dashboard legen → **⚙️** öffnen

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **AdGuard Home** | Läuft im LAN (Docker, VM oder Router) |
| **Erreichbarkeit** | SelfDashboard-Container muss die **Basis-URL** per HTTP(S) erreichen |
| **Statistiken** | In AdGuard: **Einstellungen → Allgemeine Einstellungen → Statistiken** aktivieren — sonst Hinweis „Statistiken aus“ im Widget |
| **Auth** | Falls Admin-Login gesetzt: Benutzername + Passwort im Plugin (HTTP Basic) |

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **Basis-URL** | Weboberfläche, z. B. `http://192.168.1.5:3000` — **ohne** `/control` am Ende (wird automatisch ergänzt) |
| **Benutzername / Passwort** | Optional — AdGuard-Admin-Zugang |
| **Aktualisieren** | 10–300 Sekunden (Standard ca. 20 s) |

### Anzeige im Widget

- **Kacheln:** DNS-Anfragen, Gesperrt, Block-%, optional Ø Antwortzeit (ms)  
- **Schutz:** Status „DNS aktiv“ / „DNS inaktiv“ — Klick schaltet Filtering um  
- **Hinweis:** Wenn AdGuard Statistiken deaktiviert hat, erscheint ein gelber Hinweis unter den Kacheln

### API & Technik

| Aufruf | Zweck |
|--------|--------|
| `POST /api/plugins/adguard/` | Proxy zur AdGuard-API (CORS-frei vom Browser) |
| Legacy | `POST /api/adguard` leitet weiter |

Anfragen laufen **serverseitig** über SelfDashboard — Zugangsdaten verlassen den Container nur Richtung AdGuard, nicht den Browser.

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Verbindung fehlgeschlagen | URL, Firewall, HTTPS-Zertifikat prüfen; im LAN oft `http://IP:Port` |
| Keine Zahlen / „Statistiken aus“ | In AdGuard Home Statistiken einschalten |
| Schutz lässt sich nicht umschalten | Admin-Rechte / Passwort im Plugin prüfen |
| 401 Unauthorized | Benutzername/Passwort in den Widget-Einstellungen |

**Protokoll:** **Einstellungen → Protokoll**, Filter Plugin `adguard`.

---

## English

AdGuard Home stats and protection toggle. Configure base URL and credentials in the widget. API via `/api/plugins/adguard/`.
