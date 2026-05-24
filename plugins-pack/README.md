# Plugin-Store (`plugins-pack/`)

**Einziger Ordner für Plugin-UI auf GitHub.** Der Container installiert daraus nur `plugin.json` + `widget.js` (siehe `plugins-index.json`).

## Workflow (UI-Updates)

1. **`plugins-pack/<id>/plugin.json`** — Version erhöhen  
2. **`plugins-pack/<id>/widget.js`** — Widget anpassen (oder aus TS bauen, siehe unten)  
3. **`npm run generate:plugins-index`** — Index neu erzeugen  
4. **`plugins-pack/` pushen** — Store zeigt Update  
5. Auf dem Server: **Aktualisieren** im Plugin-Store, dann **Strg+F5**

## Optional: TypeScript-Quellen im gleichen Ordner

Du kannst `index.tsx` (+ Hilfsdateien) **neben** `widget.js` ablegen — der Store installiert sie **nicht** (nur Einträge in `plugins-index.json` → `files`).

```text
plugins-pack/calendar/
├── plugin.json    ← Store
├── widget.js      ← Store (gebündelt)
├── index.tsx      ← optional, nur Repo / Build
└── i18n.ts
```

Build: `npm run build:plugin-pack -- calendar` (liest `plugins-pack/<id>/index.tsx` zuerst, sonst legacy `plugins/<id>/`).

## Nicht committen / lokal löschbar

| Ordner | Zweck |
|--------|--------|
| `plugins/` | Legacy-Dev-Ordner (`.gitignore`) — kann weg |
| `plugin-pack/` | Build-Zwischenspeicher + ZIP (`.gitignore`) — kann weg |

## API-Änderungen

Server-Code: `src/builtin-plugins/<id>/` → neues **Docker-Image**, nicht nur Store-Update.

**Performance-Tipps für Autoren:** [docs/PLUGIN_PERFORMANCE.md](../docs/PLUGIN_PERFORMANCE.md)
