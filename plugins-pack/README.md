# Plugin-Store (`plugins-pack/`)

**Einziger Ordner für Plugin-UI und ausgewählte APIs auf GitHub.** Der Store installiert `plugin.json`, `widget.js` und — wo vorhanden — **`server.mjs`** (siehe `plugins-index.json` → `files` / `hasServer`).

## Workflow (Widget-Updates)

1. **`plugins-pack/<id>/plugin.json`** — Version erhöhen  
2. **`plugins-pack/<id>/widget.js`** — Widget anpassen (oder aus TS bauen, siehe unten)  
3. **`npm run generate:plugins-index`** — Index neu erzeugen  
4. **`plugins-pack/` pushen** — Store zeigt Update  
5. Auf dem Server: **Aktualisieren** im Plugin-Store, dann **Strg+F5**

## Workflow (API mit `server.mjs`)

Für Plugins mit **`hasServer: true`** und **`server.mjs`** im Index (u. a. **AdGuard**, **Kalender**, **CrowdSec**, **Docker**, **Fritzbox**, **Fritz-Energy**, **Mail**, **Pi-hole**, **Selfstream**, **Uptime Kuma**, **Wetter**):

1. **`plugins-pack/<id>/server.ts`** bearbeiten (bundle-sicher, kein `@/lib/*`, kein Next.js)  
2. **`npm run build:plugin-pack -- <id>`** — erzeugt `server.mjs` neben `widget.js`  
3. Version in **`plugin.json`** erhöhen, Index neu generieren, pushen  
4. Auf dem Server: Plugin-Store → **Aktualisieren** (lädt `server.mjs` aufs Volume) — **kein Docker-Rebuild** für die API

Shared Logging: `plugins-pack/_shared/log.ts` (wird in `server.mjs` eingebündelt).

## Optional: TypeScript-Quellen im gleichen Ordner

Du kannst `index.tsx`, `server.ts` (+ Hilfsdateien) **neben** den Store-Dateien ablegen — der Store installiert nur Einträge aus `plugins-index.json` → `files` (typisch `plugin.json`, `widget.js`, optional `server.mjs`).

```text
plugins-pack/uptime-kuma/
├── plugin.json    ← Store
├── widget.js      ← Store
├── server.mjs     ← Store (aus server.ts gebaut)
├── index.tsx      ← optional, nur Repo / Build
├── server.ts      ← optional, nur Repo / Build
└── lib/types.ts
```

Build: `npm run build:plugin-pack -- uptime-kuma` (liest `plugins-pack/<id>/index.tsx` und `server.ts` zuerst).

## Nicht committen / lokal löschbar

| Ordner | Zweck |
|--------|--------|
| `plugins/` | Legacy-Dev-Ordner (`.gitignore`) — kann weg |
| `plugin-pack/` | Build-Zwischenspeicher + ZIP (`.gitignore`) — kann weg |

## Server-Quellen aus dem Image nachziehen

`npm run sync:plugin-servers` kopiert `server.ts` + `lib/` aus `src/builtin-plugins/` ins Pack (Pi-hole/Selfstream/Uptime Kuma bleiben unverändert, wenn schon pack-ready).

**Performance-Tipps für Autoren:** [docs/PLUGIN_PERFORMANCE.md](../docs/PLUGIN_PERFORMANCE.md)
