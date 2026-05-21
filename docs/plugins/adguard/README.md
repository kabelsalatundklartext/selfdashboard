# Plugin: AdGuard Home (`adguard`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **DNS-Statistik** und den **Schutzstatus** deiner AdGuard-Home-Instanz: Anfragen, gesperrte Anfragen, Block-Anteil, optional durchschnittliche Antwortzeit. **DNS-Schutz** per Klick im Widget ein- und ausschaltbar.

### Installation

1. **Plugin-Store → Von GitHub** → **AdGuard Home** installieren  
2. **Strg+F5** (Hard-Reload)  
3. Widget mit **+** legen → **⚙️** konfigurieren

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **AdGuard Home** | Im LAN (Docker, VM, Router) |
| **Erreichbarkeit** | SelfDashboard-Container erreicht die **Basis-URL** per HTTP(S) |
| **Statistiken** | In AdGuard: **Einstellungen → Allgemeine Einstellungen → Statistiken** — sonst Hinweis im Widget |
| **Auth** | Optional Benutzername + Passwort (HTTP Basic) |

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **Basis-URL** | z. B. `http://192.168.1.5:3000` — **ohne** `/control` (wird ergänzt) |
| **Benutzer / Passwort** | AdGuard-Admin, falls gesetzt |
| **Aktualisieren** | 10–300 s (Standard ~20 s) |

### Anzeige

- Kacheln: DNS-Anfragen, Gesperrt, Block-%, optional Ø Antwortzeit  
- Schutz-Status: Klick schaltet Filtering  
- Gelber Hinweis, wenn Statistiken in AdGuard aus sind

### API

| Aufruf | Zweck |
|--------|--------|
| `POST /api/plugins/adguard/` | Server-Proxy (kein CORS im Browser) |
| Legacy | `POST /api/adguard` |

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Verbindung fehlgeschlagen | URL, Firewall, HTTPS; im LAN oft HTTP |
| Keine Zahlen | Statistiken in AdGuard aktivieren |
| 401 | Zugangsdaten im Widget prüfen |

**Protokoll:** Filter Plugin `adguard`.

---

## English

### Summary

Shows **DNS statistics** and **protection status** for your AdGuard Home instance: queries, blocked queries, block percentage, optional average response time. Toggle **DNS protection** with one click in the widget.

### Installation

1. **Plugin Store → From GitHub** → install **AdGuard Home**  
2. **Ctrl+F5** (hard reload)  
3. Add widget with **+** → open **⚙️**

### Requirements

| Item | Details |
|------|---------|
| **AdGuard Home** | On your LAN (Docker, VM, router) |
| **Reachability** | SelfDashboard container must reach the **base URL** over HTTP(S) |
| **Statistics** | In AdGuard: **Settings → General settings → Statistics** — otherwise the widget shows a notice |
| **Auth** | Optional username + password (HTTP Basic) |

### Setup (widget ⚙️)

| Field | Recommendation |
|-------|----------------|
| **Base URL** | e.g. `http://192.168.1.5:3000` — **without** `/control` (added automatically) |
| **Username / password** | AdGuard admin if enabled |
| **Refresh** | 10–300 s (default ~20 s) |

### Display

- Tiles: DNS queries, blocked, block %, optional avg. response time  
- Protection status: click toggles filtering  
- Yellow hint if statistics are disabled in AdGuard

### API

| Call | Purpose |
|------|---------|
| `POST /api/plugins/adguard/` | Server proxy (no browser CORS) |
| Legacy | `POST /api/adguard` |

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection failed | Check URL, firewall, HTTPS; HTTP on LAN often works |
| No numbers | Enable statistics in AdGuard Home |
| 401 | Check credentials in widget settings |

**Logs:** **Settings → Logs**, filter plugin `adguard`.
