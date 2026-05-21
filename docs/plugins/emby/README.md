# Plugin: Emby (`emby`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Zeigt **aktive Wiedergaben** auf deinem **Emby-** oder **Jellyfin-kompatiblen** Server: Nutzer, Titel/Serie, Gerät, Client, Pause-Status — mit periodischem Refresh.

### Installation

Plugin-Store → **Emby** installieren → **Strg+F5** → Widget **⚙️** konfigurieren.

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **Server** | Emby oder Jellyfin mit API-Zugang |
| **API-Key** | In Emby: Dashboard → API-Keys; in Jellyfin: API-Schlüssel |
| **Netzwerk** | SelfDashboard-Container muss die **Basis-URL** erreichen (LAN-IP, nicht nur `localhost` vom Host) |

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **Basis-URL** | z. B. `http://192.168.1.20:8096` — ohne trailing slash |
| **API-Key** | Emby- oder Jellyfin-Token |
| **Aktualisieren** | Intervall in Sekunden |

### Technik

- Abfrage der **Sessions**-API (`/emby/Sessions` bzw. `/Sessions` bei Jellyfin)  
- Anfrage vom **Browser** aus dem Widget — Server muss CORS oder gleiche Origin erlauben; bei Problemen LAN-HTTP nutzen  
- Keine Speicherung des API-Keys im zentralen Fehlerprotokoll bei erfolgreichen Abrufen

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Keine Sessions | Gerade niemand am Streamen — normal |
| Verbindungsfehler | URL, Firewall, HTTPS; vom Container `curl` zur Emby-URL testen |
| Jellyfin | Gleicher API-Key-Mechanismus; Plugin probiert beide Pfade |

**Protokoll:** Plugin `emby` oder Netzwerkfehler filtern.
