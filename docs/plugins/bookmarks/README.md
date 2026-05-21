# Plugin: Bookmarks (`bookmarks`)

[← Plugin index](README.md) · [Main catalog](../../README.md#plugins)

## Deutsch

### Kurzbeschreibung

**Lesezeichen-Grid** für dein Homelab: Schnelllinks zu Unraid, DSM, Emby, Nextcloud, Vaultwarden und beliebigen URLs — mit Gruppen, Icons und zwei Layout-Modi.

### Installation

Plugin-Store → **Bookmarks** installieren → **Strg+F5** → Widget hinzufügen → Links und Gruppen unter **⚙️** pflegen.

### Funktionen

| Feature | Beschreibung |
|---------|----------------|
| **Gruppen** | Mehrere Gruppen (z. B. „Server“, „Media“); einzelne Gruppen per **👁️** ausblendbar |
| **Icons** | Emoji oder Bild-URL (PNG/JPG) pro Link |
| **Drag & Drop** | Sortieren **innerhalb** einer Gruppe und **zwischen** Gruppen (Bearbeitungsmodus) |
| **Layout** | **Raster** (mehrspaltig) oder **waagerechte Zeile** mit Scroll |
| **Kachelbreite** | Min-/Max-Breite in px; optional feste Spaltenanzahl |
| **Neuer Tab** | Pro Link: im gleichen Tab oder neuem Tab öffnen |

### Einrichtung

1. **Bearbeitungsmodus** (✏️) aktivieren  
2. Widget **⚙️** → Gruppen anlegen, Links mit **URL**, **Titel** und optional **Icon** hinzufügen  
3. Layout und Abstände nach Geschmack einstellen  
4. Gruppen, die du selten brauchst, nur ausblenden statt löschen

### Tipps

- Breite Widgets eignen sich für die **horizontale Scroll-Zeile** (viele Dienste in einer Reihe).  
- Schmale Kacheln: **Raster** mit wenigen Spalten.  
- Interne Dienste: `http://192.168.x.x` — SelfDashboard öffnet die URL im **Browser des Nutzers**, nicht im Container.

### Speicher

Alle Daten liegen in der **Dashboard-Konfiguration** (`dashboard.json` über `/app/data`) — pro Widget-Instanz, nicht in einer separaten Plugin-Datei.

---

## English

Quick links with collapsible groups, custom icons, drag & drop, grid or horizontal row layout.
