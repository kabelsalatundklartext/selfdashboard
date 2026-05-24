# Plugin-Architektur

SelfDashboard trennt **App-Kern** (Next.js, Auth, Dashboard), **Builtin-Server** (im Docker-Image) und **Volume-Plugins** (Store unter `/app/plugins/custom/`).

Ausführlich zum Entwickeln von Widgets: **[PLUGIN_DEV.md](./PLUGIN_DEV.md)**.  
Performance & Ladeoptimierung: **[PLUGIN_PERFORMANCE.md](./PLUGIN_PERFORMANCE.md)**.

---

## 1. Quellen & Ordner

| Ort | Zweck |
|-----|--------|
| **`plugins-pack/<id>/`** | Store-Paket: `widget.js`, `plugin.json`, optional `README.md` — wird per GitHub Store / ZIP installiert |
| **`src/builtin-plugins/<id>/`** | Server-Handler im Image (`server.ts`, `lib/…`) — committed für CI/Docker |
| **`/app/plugins/custom/<id>/`** | Installierte Plugins auf dem Volume (vom Store oder Upload) |

Widget-Quellen werden für den Store gebaut (`npm run publish:plugin-pack`). Server-Code wird nach Änderungen vendored:

```bash
npm run vendor-plugins -- --force
```

Details: **[PLUGINS_IN_REPO.md](./PLUGINS_IN_REPO.md)** · **[DOCKER_BUILD.md](./DOCKER_BUILD.md)**

---

## 2. API-Routing

### Kanonisch

```text
GET|POST|PUT|PATCH|DELETE  /api/plugins/<pluginId>/<pfad…>
```

- Dispatcher: `src/app/api/plugins/[pluginId]/[[...path]]/route.ts`
- Registry: `src/lib/pluginServerRegistry.ts`
- Builtin-Handler: `src/lib/pluginServerLoader.ts` → `src/builtin-plugins/<id>/server.ts`

### Widget-Aufruf

```tsx
import { pluginApiJson } from '@/lib/pluginDev'

const data = await pluginApiJson<MyType>('weather', '/resolve?name=Berlin')
// → GET /api/plugins/weather/resolve?name=Berlin
```

**Legacy-Pfade** (`/api/weather`, `/api/calendar/*`, …) wurden mit Beta-Ende entfernt. Nur noch `/api/plugins/…` verwenden.

---

## 3. Builtin-Plugins mit Server (Image)

| Plugin | Hinweis |
|--------|---------|
| weather | Open-Meteo |
| adguard | AdGuard Home API |
| mail | IMAP, Navbar |
| crowdsec | SQLite + optional Docker/cscli |
| docker | Docker-Socket (`/containers`, `?stats=1`) |
| pihole | Pi-hole v6 API |
| selfstream | Selfstream Admin API |
| fritzbox | TR-064 WAN |
| fritz-energy | TR-064 Smart Home |
| calendar | CalDAV/ICS, pro User |

`src/lib/pluginServers/<id>.ts` re-exportiert den Handler aus `@/builtin-plugins/<id>/server`.

---

## 4. Plugins ohne SelfDashboard-Server

Browser ruft Ziel-URL direkt auf (CORS beim Nutzer):

| Plugin | API-Ziel |
|--------|----------|
| emby | Emby/Jellyfin `{base}/Sessions` |
| unraid | Unraid `{url}/graphql` |
| unraid-docker | Unraid GraphQL + WebSocket |

Reine UI-Plugins: **bookmarks**, **clock**, **iframe**, **scratchpad**.

---

## 5. Plugin-Pack & Store

```bash
cd selfdashboard
npm run publish:plugin-pack
```

- Pro Plugin mit Server: optional `server.mjs` im Pack (Volume-Override mit `SELFDASHBOARD_VOLUME_PLUGIN_SERVER=1`)
- `plugins-index.json` listet verfügbare Versionen
- Nach Update: Store → **Update** → **Strg+F5**

Beim **ersten Start** ohne Plugins auf dem Volume: `ensureDefaultPluginsOnVolume()` entpackt optional `default-plugins.zip` (siehe `pluginVolumeExtract.ts`).

---

## 6. Deploy-Checkliste

1. SelfDashboard-Image bauen/pullen
2. `plugins-pack/` pushen (Store-Index)
3. Plugin-Updates im UI installieren oder Hard-Reload
4. Kurztest:

```bash
curl -s "http://HOST:3000/api/plugins/weather/resolve?name=Berlin&includeHourly=1" | head
curl -s "http://HOST:3000/api/plugins/calendar/status" | head
```
