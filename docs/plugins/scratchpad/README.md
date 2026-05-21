# Plugin: Notizzettel (`scratchpad`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

Ein **editierbarer Kurztext** direkt im Widget — für Notizen, IPs, To-dos oder Erinnerungen ohne externes Tool.

### Installation

Plugin-Store → **Notizzettel** installieren → **Strg+F5** → Widget platzieren und Text eingeben.

### Nutzung

- Text im Widget **anklicken und tippen** (im Bearbeitungsmodus oder je nach Fokus-Verhalten)  
- Inhalt wird **automatisch** in der Plugin-Konfiguration der **Dashboard-Instanz** gespeichert  
- Mehrere Notizzettel = mehrere Widgets mit getrenntem Inhalt

### Speicher

| Thema | Details |
|-------|---------|
| **Wo** | `dashboard.json` unter `/app/data` (pro `instanceId`) |
| **Backup** | Mit dem **Config Storage**-Mount sichern |
| **Kein Sync** | Kein separates Cloud-Konto — nur lokales Dashboard |

### Tipps

- Für längere Dokumentation besser eigene Datei/Nextcloud — Notizzettel ist für **Kurzinfos**.  
- Kleine Widget-Höhe reicht; bei viel Text Höhe im Bearbeitungsmodus erhöhen (↕).
