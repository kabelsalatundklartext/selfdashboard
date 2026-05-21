# Plugin: Wetter (`weather`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Aktuelles Wetter** und optional **7-Tage-Vorschau** für eine **Stadt oder PLZ** — Daten von **Open-Meteo**, **ohne API-Key**.

### Installation

Plugin-Store → **Wetter** installieren → **Strg+F5** → Ort in **⚙️** eintragen.

### Einrichtung (Widget ⚙️)

| Feld | Hinweis |
|------|---------|
| **Stadt oder PLZ** | z. B. `Berlin`, `Hamburg`, `10115` |
| **Land (ISO)** | Optional `DE` — hilft bei PLZ-Suche |
| **Aktualisieren** | Minuten (Standard z. B. 15) |
| **7-Tage-Vorschau** | Ein/Aus — Max/Min und Wetter-Symbol pro Tag |
| **Ort anzeigen** | Stadtnamen unter der Temperatur ein/aus |
| **Vorschau-Breite** | Kartenbreite der 7-Tage-Leiste in % |

### Anzeige

- Temperatur, gefühlt, Luftfeuchte, Wind  
- Wetter-Icon passend zum Zustand  
- Gestapelte Ansicht (schmales Widget): Plugin reserviert extra Zeilenhöhe, damit die Vorschau nicht abgeschnitten wird

### Technik

- Geocoding + Wetter **direkt vom Browser** zu Open-Meteo (kein SelfDashboard-API-Key)  
- Internetzugang des **Clients** nötig (nicht nur LAN)  
- Keine Speicherung auf dem Server — nur Widget-Config in `dashboard.json`

### Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Ort nicht gefunden | Schreibweise prüfen; `DE` als Ländercode setzen |
| Keine Daten | Client ohne Internet? DNS? |
| Vorschau abgeschnitten | Widget höher ziehen oder Vorschau-Breite reduzieren |
