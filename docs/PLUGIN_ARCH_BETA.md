# Plugin-Architektur (Beta)

Diese Seite beschreibt das **Zielbild auf dem Beta-Branch**: Alles, was zu einem Plugin gehört, liegt unter `plugins/<id>/`. Die SelfDashboard-App stellt nur noch das **Gateway**, gemeinsame Infrastruktur und **Legacy-Shims** bereit.

Ausführlich zum Entwickeln von Widgets: **[PLUGIN_DEV.md](./PLUGIN_DEV.md)**.

---

## 1. Ordner pro Plugin

```text
plugins/<id>/
├── index.tsx          # Widget + meta (+ optional Settings, Navbar)
├── plugin.json        # Store-Metadaten (optional, sonst aus meta in index.tsx)
├── server.ts          # Server-Handler (optional)
├── lib/               # Nur Server-/Shared-Logik des Plugins (optional)
│   └── …
├── api-client.ts      # z. B. Kalender: typisierte pluginApiJson-Helfer
├── *.css              # optional, wird als widget.css ins Pack übernommen
└── README.md          # optional unter docs/plugins/<id>/
```

| Datei | Läuft wo | Zweck |
|--------|----------|--------|
| `index.tsx` | Browser (→ `widget.js`) | UI, `export const meta`, `pluginApiJson(…)` |
| `server.ts` | Node (Image + optional `server.mjs` im Pack) | Proxy, Dateizugriff, TR-064, … |
| `lib/*` | Node (nur aus `server.ts` importieren) | Keine `@/lib/crowdsecDb` mehr im Core |

**Nicht** in `plugins/<id>/`: App-weite Module (`store`, `i18n`, `pluginLog`). Die bleiben unter `selfdashboard/src/lib/` und werden im Widget über `@/lib/…` bzw. Host-Shims im Pack-Build aufgelöst.

---

## 2. API-Routing

### Kanonisch (neu)

```text
GET|POST|PUT|PATCH|DELETE  /api/plugins/<pluginId>/<pfad…>
```

Dispatcher: `src/app/api/plugins/[pluginId]/[[...path]]/route.ts`  
Registry: `src/lib/pluginServerRegistry.ts`  
Builtin-Handler: `src/lib/pluginServerLoader.ts` (lädt Handler aus `src/builtin-plugins/<id>/server.ts` via `src/lib/pluginServers/<id>.ts`).

### Widget-Aufruf

```tsx
import { pluginApiJson } from '@/lib/pluginDev'

const data = await pluginApiJson<MyType>('crowdsec', `/?${params}`)
// → GET /api/plugins/crowdsec/?dbPath=…
```

### Legacy (Kompatibilität)

Alte URLs bleiben als **dünne Shims** in `src/app/api/<alt>/route.ts` und rufen denselben Handler auf, z. B.:

| Legacy | Plugin | Neu |
|--------|--------|-----|
| `/api/weather?action=…` | weather | `/api/plugins/weather/resolve` |
| `/api/crowdsec` | crowdsec | `/api/plugins/crowdsec/` |
| `/api/crowdsec/decision` | crowdsec | `/api/plugins/crowdsec/decision` |
| `/api/docker-containers` | docker | `/api/plugins/docker/containers` |
| `/api/pihole` | pihole | `/api/plugins/pihole/` |
| `/api/selfstream` | selfstream | `/api/plugins/selfstream/` |
| `/api/fritzbox` | fritzbox | `/api/plugins/fritzbox/` |
| `/api/fritz-energy` | fritz-energy | `/api/plugins/fritz-energy/` |
| `/api/calendar/*` | calendar | `/api/plugins/calendar/*` |
| `/api/mail/*` | mail | `/api/plugins/mail/*` |
| `/api/adguard` | adguard | `/api/plugins/adguard/` |

Neue Widgets sollen **nur** `/api/plugins/…` nutzen.

---

## 3. Builtin-Plugins mit Server (Image)

Diese Handler sind im App-Image registriert (`loadBuiltinPluginServers`):

| Plugin | `server.ts` | Lib-Ordner | Hinweis |
|--------|-------------|------------|---------|
| weather | ja | Logik in `server.ts` | Open-Meteo |
| adguard | ja | in `server.ts` | AdGuard Home API |
| mail | ja | `lib/` | IMAP, Navbar, Einstellungen |
| crowdsec | ja | `lib/` | SQLite + optional Docker/cscli |
| docker | ja | `lib/` | Docker-Socket |
| pihole | ja | in `server.ts` | Pi-hole v6 API |
| selfstream | ja | `lib/types.ts` | Selfstream Admin API |
| fritzbox | ja | `lib/` | TR-064 WAN |
| fritz-energy | ja | nutzt `../fritzbox/lib/` | TR-064 Smart Home |
| calendar | ja | `lib/` | CalDAV/ICS, `store.json` |

**Dev:** Quellen in `plugins/<id>/server.ts` (Monorepo-Geschwisterordner).  
**Image / CI / Git:** vendored nach `src/builtin-plugins/<id>/` (committed) — siehe **[PLUGINS_IN_REPO.md](./PLUGINS_IN_REPO.md)**.

`src/lib/pluginServers/<id>.ts` ist nur ein Re-Export:

```ts
export { weatherServerHandler } from '@/builtin-plugins/weather/server'
```

`src/lib/<plugin>*.ts` (z. B. `crowdsecDb.ts`) re-exportiert nach `@plugins/…` → aufgelöst auf `src/builtin-plugins/…` — damit ältere Core-Imports nicht brechen.

---

## 4. Plugins ohne SelfDashboard-Server

Diese rufen **direkt vom Browser** die Ziel-URL auf (CORS/Netzwerk beim Nutzer):

| Plugin | API-Ziel |
|--------|----------|
| emby | Emby/Jellyfin `{base}/Sessions` |
| unraid | Unraid `{url}/graphql` |
| unraid-docker | Unraid GraphQL + WebSocket |

Reine UI-Plugins (kein Backend): **bookmarks**, **clock**, **iframe**, **scratchpad**.

---

## 5. `server.ts` implementieren

Signatur:

```ts
import type { PluginServerContext } from '@/lib/pluginServerRegistry'

export async function mypluginServerHandler(ctx: PluginServerContext): Promise<Response> {
  const method = ctx.request.method.toUpperCase()
  const segments = ctx.path // z. B. ['containers'] bei /api/plugins/docker/containers

  if (method === 'GET' && segments[0] === 'status') {
    return Response.json({ ok: true })
  }
  return Response.json({ error: 'not_found', path: segments.join('/') }, { status: 404 })
}

```

Registrierung im Image:

1. Handler in `plugins/<id>/server.ts`
2. `src/lib/pluginServers/<id>.ts` → Re-Export
3. `registerPluginServerHandler('<id>', …)` in `pluginServerLoader.ts`

Server-Code darf `import … from '@/lib/pluginLogServer'` und andere **App-Infrastruktur** nutzen. Plugin-spezifische Logik gehört in `plugins/<id>/lib/`.

---

## 6. Plugin-Pack & `hasServer`

```bash
cd selfdashboard
npm run publish:plugin-pack
```

- Pro Plugin mit `server.ts` wird **`server.mjs`** gebündelt (esbuild, Node 18).
- `plugins-index.json` setzt `hasServer: true`, wenn `server.mjs`/`server.ts` existiert.
- Im Container können Volume-Plugins zusätzlich `server.mjs` aus `/app/plugins/custom/<id>/` laden (`pluginCustomServer.ts`).

Nach API-Umstellung: **`version` in `meta` / `plugin.json` erhöhen** und Pack pushen; Nutzer **Strg+F5** + ggf. Store-Update.

---

## 7. Docker / CI-Build

Details: **[DOCKER_BUILD.md](./DOCKER_BUILD.md)** · Vendoring: **[PLUGINS_IN_REPO.md](./PLUGINS_IN_REPO.md)**.

Kurz: Docker-Build im Repo-Root `selfdashboard/` (GitHub checkout). Builtin-Server liegen in **`src/builtin-plugins/`** (committed).

```bash
cd selfdashboard
docker build -t selfdashboard:beta .
```

Webpack-Alias `@plugins` → `src/builtin-plugins/` (Fallback: `./plugins` oder `../plugins` auf dem Dev-PC).

`npm run build` führt **`prebuild`** aus (`vendor-builtin-plugins.mjs` — no-op, wenn `src/builtin-plugins/` schon da ist). Nach Änderungen an `../plugins/<id>/server.ts`: `npm run vendor-plugins -- --force` und `src/builtin-plugins` committen.

---

## 8. Deploy-Checkliste

1. Neues **SelfDashboard-Image** (`:beta`) mit aktualisiertem `pluginServerLoader`.
2. **`npm run publish:plugin-pack`** und `plugins-pack/` pushen.
3. Im UI: Plugin-Updates installieren oder Hard-Reload.
4. Kurztest:

```bash
curl -s "http://HOST:3000/api/plugins/weather/resolve?name=Berlin&includeHourly=1" | head
curl -s "http://HOST:3000/api/plugins/crowdsec/?dbPath=/crowdsec-data/crowdsec.db&daysBack=7&maxAlerts=50" | head
```

---

## 8. Versionierung (Beta-Migration)

Bei Umstellung auf `/api/plugins/<id>/` wurde die **Minor-Version** der betroffenen Builtin-Plugins erhöht (siehe `version` in `plugins/<id>/index.tsx`). Legacy-Shims bleiben mindestens für eine Beta-Phase erhalten.
