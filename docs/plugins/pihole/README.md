# Plugin: Pi-hole (`pihole`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Pi-hole v6**-Statistik im Stil des Web-Dashboards: DNS-Anfragen, blockierte Anfragen, Block-Anteil, Domains auf Blocklisten. **Blocking** lässt sich per Klick im Widget ein- und ausschalten.

### Installation

1. Plugin-Store → **Pi-hole** installieren → **Strg+F5**  
2. Widget **⚙️** → API-Zugang eintragen

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **Pi-hole v6** | API-Zugang über **App-Passwort** (nicht das alte Web-Passwort allein) |
| **Erreichbarkeit** | SelfDashboard muss die Pi-hole-URL im LAN erreichen |
| **HTTPS** | Bei selbstsigniertem Zertifikat ggf. HTTP im LAN nutzen |

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **API-URL** | Basis der Weboberfläche, z. B. `http://192.168.1.10` — `/admin` wird bei Bedarf entfernt |
| **App-Passwort** | Aus Pi-hole: **Einstellungen → API** (v6) |
| **Aktualisieren** | Intervall in Sekunden (wie bei AdGuard) |

### Anzeige

- Kacheln für Anfragen, blockiert, Prozent, Listen-Info  
- Schalter für **Blocking enabled/disabled**  
- Optik an SelfDashboard-Themes angepasst

### API

| Aufruf | Zweck |
|--------|--------|
| `POST /api/pihole` | Server-Proxy zur Pi-hole-API |

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 / Verbindung | App-Passwort neu erzeugen, in Widget speichern |
| Falsche Zahlen | Pi-hole-Statistik-Zeitraum in Pi-hole prüfen |
| HTTPS-Fehler | URL auf `http://` im LAN wechseln oder Zertifikat vertrauen |

**Protokoll:** Filter `pihole` oder API-Fehler in **Einstellungen → Protokoll**.

---

## English

Pi-hole v6 style dashboard stats. Toggle blocking from the widget. Configure API URL and password.
