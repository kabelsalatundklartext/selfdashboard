# Plugins nur im gemounteten Ordner (ohne Image-Rebuild)

## Unraid-Pfad

| Container | Host (Beispiel) |
|-----------|------------------|
| `/app/plugins/custom` | `/mnt/user/Docker/selfdashboard/plugins` |

Der Ordner darf **leer** starten. Builtin-Plugins laufen aus dem Image — bis du etwas auf dem Volume ablegst.

## Ordner einmalig befüllen (alle `plugin.json` vom Image)

Im Browser (eingeloggt ins Dashboard) oder per curl:

```bash
curl -X POST http://192.168.1.21:3000/api/plugins/seed-custom
```

Danach liegt unter deinem Host-Ordner z. B.:

```text
plugins/
├── adguard/
│   └── plugin.json
├── clock/
│   └── plugin.json
└── …
```

Das sind **Vorlagen** — noch keine lauffähigen Widgets.

## Was ohne Image-Rebuild geht

| Datei im Ordner `plugins/<id>/` | Wirkung |
|----------------------------------|---------|
| `plugin.json` | Store / Katalog (↻ im Plugin-Store) |
| `server.js` oder `server.mjs` | API unter `/api/plugins/<id>/` — nach ↻ oder Container-Neustart |
| `widget.js` | Ersetzt das **Builtin-Widget** für diese ID — nach **Strg+F5** |

## Neues Plugin

```text
plugins/myplugin/
├── plugin.json
├── widget.js      ← siehe plugins/_template/widget.example.js
└── server.js      ← optional, siehe server.example.js
```

`widget.js` muss `registerPlugin` über `window.SelfDashboard` aufrufen (siehe Template).

## Builtin-Widget ändern (z. B. AdGuard)

1. `POST /api/plugins/seed-custom` (falls noch leer)
2. `plugins/adguard/widget.js` anlegen — kopiert aus `widget.example.js` und anpassen **oder** lokal mit esbuild aus `index.tsx` bauen
3. Optional: `plugins/adguard/server.js` überschreibt nur die API (Widget bleibt aus Image, wenn kein `widget.js`)

Ohne `widget.js` im Volume bleibt das **UI aus dem Image** — nur `server.js` + `plugin.json` sind vom Volume steuerbar.

## TSX direkt vom Volume?

Nein — Next.js bündelt TSX nur beim Image-Build. Für reine Volume-Workflows: **`widget.js`** (JavaScript) oder weiterhin Image `:beta` neu bauen für große TSX-Änderungen.

## Ablauf nach Änderung

| Geändert | Aktion |
|----------|--------|
| `plugin.json` | Plugin-Store **↻** |
| `server.js` | **↻** oder Container neu starten |
| `widget.js` | **Strg+F5** im Browser |
