# Plugin: Selfstream (`selfstream`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Listet **aktive IPTV-Streams** aus einer **[Selfstream](https://github.com/kabelsalatundklartext/selfstream)**-Admin-Instanz: Nutzer, Kanal/Programm, Laufzeit, optional Client-IP.

### Installation

1. Selfstream im LAN betreiben  
2. Plugin-Store → **Selfstream** installieren → **Strg+F5**  
3. Widget **⚙️** → Basis-URL und Admin-Passwort

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **Basis-URL** | Root der Instanz, z. B. `http://192.168.1.30:8080` — **ohne** `/admin` am Ende |
| **Admin-Passwort** | Selfstream-Admin-Zugang (wird serverseitig an die API weitergereicht, nicht im Fehlerprotokoll geloggt) |
| **Intervall** | Aktualisierung in Sekunden |

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **Netzwerk** | SelfDashboard-Container muss Selfstream im **LAN** erreichen |
| **API** | `POST /api/selfstream` — Proxy in der Kern-App |

### Anzeige

- Liste laufender Streams mit Refresh  
- Leer, wenn niemand streamt — kein Fehler

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Verbindung fehlgeschlagen | URL, Port, Firewall; vom Host `curl` zur Selfstream-URL |
| 401 | Admin-Passwort in Widget prüfen |

---

## English

Live streams from Selfstream admin API. Set base URL and admin password in widget settings.
