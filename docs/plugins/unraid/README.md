# Plugin: Unraid (`unraid`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**System-Übersicht** für **Unraid 7.2+** per **GraphQL API**: CPU (Modell, Auslastung, Temperatur), RAM, **Array** und **Cache/Pool**-Laufwerke mit Status, Temperatur und Belegung.

### Installation

1. Plugin-Store → **Unraid** installieren → **Strg+F5**  
2. In Unraid: **Einstellungen → Management Access → API** — API-Schlüssel erzeugen  
3. Widget **⚙️** → URL der Unraid-Weboberfläche + API-Key

### Einrichtung (Widget ⚙️)

| Feld | Empfehlung |
|------|------------|
| **URL** | `https://192.168.x.x` oder Hostname — gleiche Origin wie im Browser |
| **API-Key** | Unraid GraphQL API Key (nicht Root-Passwort) |
| **RAM-Anzeige** | Modus wählbar: **belegt**, **verfügbar** oder **API-Prozent** — je nachdem, was du mit Unraid-UI vergleichen willst |
| **Aktualisieren** | Intervall in Sekunden |

### Anzeige

- CPU-Auslastung und Paket-Temperatur (wenn von der API geliefert)  
- RAM-Balken / Zahlen je nach gewähltem Modus  
- **Array**- und **Cache**-Disks: Name, Status, Temp, Größe/Belegung  
- Darstellung nutzt **Theme-Textfarben** von SelfDashboard

### Voraussetzungen

| Punkt | Details |
|--------|---------|
| **Unraid-Version** | **7.2+** mit GraphQL-API |
| **Erreichbarkeit** | SelfDashboard muss Unraid im LAN erreichen (HTTPS-Zertifikat ggf. selbstsigniert) |
| **Kein Docker-Socket nötig** | Anders als das Plugin **Unraid Docker** — hier nur HTTP-API |

### Mehrere Server

Pro Unraid-Box **eine Widget-Instanz** mit eigener URL und eigenem API-Key (z. B. „Unraid NAS“ + „Unraid Backup“).

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| GraphQL-Fehler | API in Unraid aktiv? Key korrekt? |
| RAM „verfügbar“ fehlt | Ältere API-Antwort — anderen RAM-Modus wählen |
| HTTPS | Im LAN testweise `http://` oder Zertifikat akzeptieren |

**Protokoll:** Netzwerk- und API-Fehler unter **Einstellungen → Protokoll**.
