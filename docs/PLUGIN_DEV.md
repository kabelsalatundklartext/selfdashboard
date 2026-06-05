# Plugin entwickeln — Anleitung

Diese Anleitung erklärt, **wie Plugins für SelfDashboard aufgebaut sind**, was du selbst schreiben musst und wie du sie **im Store** oder per **ZIP** verteilst.

Kurzüberblick Ordner: **[PLUGINS.md](./PLUGINS.md)**.  
**Plugin-Architektur:** **[PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md)**.  
**Lade-Performance:** **[PLUGIN_PERFORMANCE.md](./PLUGIN_PERFORMANCE.md)**.

---

## 1. Grundidee

| Rolle | Was passiert |
|--------|----------------|
| **SelfDashboard (Image)** | Dashboard, Store, Gateway `/api/plugins/<id>/…`, Builtin-Handler als Fallback |
| **Plugin auf dem Volume** | `plugin.json` + `widget.js` (+ `server.mjs` bei API) unter `/app/plugins/custom/<id>/` |
| **Plugin-API im Store** | `plugins-pack/<id>/server.ts` → `npm run build:plugin-pack` → `server.mjs` aufs Volume (überschreibt Image-API) |
| **Du als Entwickler** | Bearbeitest **`plugins-pack/<id>/`**; optional `index.tsx` + Build. Image-Kopie: `src/builtin-plugins/` (sync mit `npm run sync:plugin-servers`) |

Es gibt **keinen Hybrid-Modus** mehr im Code: Widgets kommen **nur** vom Volume (Store oder ZIP), nicht aus dem Docker-Image.

---

## 2. Ordner auf deinem PC

```text
selfdashboard/
├── plugins-pack/              ← Store (GitHub): plugin.json + widget.js — hier UI pflegen
│   ├── calendar/
│   │   ├── plugin.json
│   │   ├── widget.js
│   │   └── index.tsx          ← optional (nicht installiert)
│   └── plugins-index.json
├── src/builtin-plugins/       ← Server-API fürs Docker-Image (nach vendor-plugins)
└── plugins/                   ← optional legacy ( .gitignore ), kann lokal fehlen
```

**Quellordner UI:** `plugins-pack/<id>/` (direkt `widget.js` oder TS → Build). Legacy: `plugins/<id>/`.

Sync von altem Setup: `node scripts/sync-plugins-for-build.mjs`  
Optional extern: `SELFDASHBOARD_PLUGINS_SRC=C:\Pfad\zu\plugins`

Nach Änderungen an **`server.ts`** / **`lib/`** (Builtin im Image):  
`npm run vendor-plugins -- --force` → `src/builtin-plugins/` committen (siehe [PLUGINS_IN_REPO.md](./PLUGINS_IN_REPO.md)).

---

## 3. Dateien pro Plugin

### Pflicht für den Store

| Datei | Beschreibung |
|--------|----------------|
| `plugin.json` | Metadaten (ID, Name, Version, Kategorie, Layout-Defaults) |
| `index.tsx` | Quellcode — wird zu `widget.js` gebündelt |
| `widget.js` | **Ergebnis** des Builds — das lädt der Browser |

### Optional

| Datei | Beschreibung |
|--------|----------------|
| `server.ts` | Quelle für `server.mjs` (API auf dem Volume); siehe [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) |
| `server.mjs` | Gebündelter API-Handler — wird vom Store mitinstalliert (`hasServer: true`) |
| `lib/` | Plugin-Server-Logik; `@/lib/*` wird beim Build auf `plugins-pack/_shared/` gemappt (kein Next.js im Bundle) |

**API-Plugins mit `server.mjs` im Store:** u. a. AdGuard, Kalender, CrowdSec, Docker, Fritzbox, Fritz-Energy, Mail, Pi-hole, Selfstream, Uptime Kuma, Wetter — Updates per Plugin-Store, **ohne** Image-Rebuild.

### `plugin.json` — Beispiel

```json
{
  "id": "meinplugin",
  "name": "Mein Plugin",
  "description": "Kurzbeschreibung für den Store.",
  "version": "1.0.0",
  "author": "Dein Name",
  "category": "utility",
  "icon": "✨",
  "iconUrl": "/plugin-logos/meinplugin.png",
  "defaultLayout": { "w": 3, "h": 2, "minW": 2, "minH": 2 }
}
```

**Regeln für `id`:** nur Kleinbuchstaben, Ziffern, Bindestrich — z. B. `mein-plugin`.

**Kategorien (`category`):**  
`media` | `system` | `network` | `storage` | `security` | `productivity` | `utility`

`hasServer` in `plugin.json` ist optional/informativ — der Store installiert trotzdem nur `widget.js` + `plugin.json`.

---

## 4. Widget schreiben (`index.tsx`)

Jedes Plugin ist eine **Client-Komponente** (`'use client'`).

### Mindeststruktur

```tsx
'use client'

import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
import { registerPlugin } from '@/lib/pluginRegistry'

export const meta: PluginMeta = {
  id: 'meinplugin',
  name: 'Mein Plugin',
  description: 'Was das Widget macht.',
  version: '1.0.0',
  author: 'Dein Name',
  category: 'utility',
  icon: '✨',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
}

function Widget({ config, theme, editMode, layoutMode }: PluginWidgetProps) {
  return (
    <div
      style={{
        height: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text)',
      }}
    >
      Hallo!
    </div>
  )
}

export const component: PluginComponent = { Widget }

registerPlugin(meta, component, { replace: true })
```

### Props (`PluginWidgetProps`)

| Prop | Bedeutung |
|------|-----------|
| `instanceId` | Eindeutige Kachel-ID auf dem Dashboard |
| `config` | Gespeicherte Einstellungen (Objekt) |
| `theme` | Aktives Theme (`dark`, `light`, …) |
| `editMode` | `true` im Bearbeitungsmodus |
| `layoutMode` | `'phone'` \| `'tablet'` \| `'desktop'` — optional für responsive UI |

### Styling

Nutze CSS-Variablen des Themes:

- `var(--background)`, `var(--surface)`, `var(--border)`
- `var(--text)`, `var(--text-muted)`, `var(--accent)`

Wichtig: `height: '100%'`, `minWidth: 0`, bei Scrollen `overflow: 'auto'`.

### Einstellungen pro Kachel (`Settings`)

```tsx
function Settings({ config, onChange }: PluginSettingsProps) {
  return (
    <input
      value={String(config.url ?? '')}
      onChange={(e) => onChange('url', e.target.value)}
    />
  )
}

export const component: PluginComponent = { Widget, Settings }
```

Nutzer öffnen **⚙️** am Widget im Bearbeitungsmodus.

---

## 5. API vom Widget aufrufen

### Gleiche Domain (empfohlen)

```tsx
import { pluginApiJson, reportPluginCatch } from '@/lib/pluginDev'

async function load() {
  try {
    const data = await pluginApiJson<{ ok: boolean }>('meinplugin', '/status')
    // → GET /api/plugins/meinplugin/status
  } catch (e) {
    reportPluginCatch('meinplugin', e, 'load')
  }
}
```

| Aufruf | URL |
|--------|-----|
| `pluginApiJson('adguard', '/')` | `POST/GET /api/plugins/adguard/…` |
| `pluginApiJson('mail', '/settings')` | `/api/plugins/mail/settings` |

Legacy-Routen (`/api/pihole`, `/api/calendar/…`, …) wurden entfernt — nur noch `/api/plugins/<id>/…`.

### Eigene Server-API

1. Logik in **`src/builtin-plugins/<id>/server.ts`** (+ optional `lib/`).
2. Re-Export in **`src/lib/pluginServers/<id>.ts`** und Registrierung in **`pluginServerLoader.ts`**.
3. Widget: **`pluginApiJson('<id>', '/pfad')`**.

Details und Deploy: **[PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md)**.

---

## 6. Erweitert: Navbar & App-Einstellungen

Manche Plugins (z. B. **Mail**) brauchen kein klassisches Widget, sondern:

- Icon in der **Navbar**
- eigener Tab unter **Einstellungen**

Dafür beim Laden des Plugins (in `index.tsx`, läuft auch in `widget.js`):

```tsx
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'

registerNavbarSlot('mail', NavbarMail)
registerAppSettingsPanel('mail', { de: 'E-Mail', en: 'Email' }, MailSettingsPanel)
```

Diese Funktionen sind über `window.SelfDashboard` in gebündelten `widget.js` verfügbar (Bridge wird vor dem Script geladen).

---

## 7. Veröffentlichen (GitHub Store)

### Schritte

```bash
cd selfdashboard
npm run publish:plugin-pack
```

Das Skript:

1. Liest alle Plugins aus `../plugins/` (oder `SELFDASHBOARD_PLUGINS_SRC`)
2. Baut pro Plugin `widget.js` (esbuild)
3. Kopiert nach `plugins-pack/<id>/`
4. Schreibt **`plugins-pack/plugins-index.json`** neu

### Git push

```bash
git add plugins-pack/
git commit -m "Plugins: Update Store-Paket"
git push origin beta
```

Nutzer mit Image `:beta` sehen neue Plugins im Store nach ein paar Minuten (Index-Cache ~5 Min).

### Neues Plugin in den Index

1. Ordner `plugins/meinplugin/` mit `plugin.json` + `index.tsx`
2. `npm run publish:plugin-pack` — wenn der Build für `meinplugin` fehlschlägt, steht es **nicht** im Index
3. `plugins-pack/meinplugin/` pushen — **fertig**

> **Auto-Index:** Seit der `plugins-index.yml`-Action wird `plugins-index.json`
> bei jedem Push nach `plugins-pack/**` (main/beta) **automatisch** neu generiert
> und committet. Ein Plugin-Ordner mit `plugin.json` + `widget.js` reicht —
> der Index muss nicht mehr von Hand gepflegt werden.
> (`npm run generate:plugins-index` lokal geht weiterhin.)

---

## 8. ZIP verteilen (ohne GitHub)

ZIP-Struktur:

```text
meinplugin/
  plugin.json
  widget.js
```

Im Store **ZIP hochladen** → entpackt nach `/app/plugins/custom/meinplugin/`.

Kein Eintrag in `plugins-index.json` nötig.

---

## 9. Was SelfDashboard automatisch macht

| Automatisch | Du musst … |
|-------------|------------|
| Plugin im Store anzeigen (wenn in `plugins-index.json`) | `publish` + push |
| Kachel: verschieben, zoomen, ⚙️, entfernen | Widget + optional Settings liefern |
| `config` & Layout in `dashboard.json` speichern | `onChange` in Settings nutzen |
| Fehler unter **Einstellungen → Protokoll** | `reportPluginCatch` in `catch` |
| `layoutMode` übergeben | optional auswerten |

| Nicht automatisch | |
|------------------|---|
| TypeScript/`index.tsx` direkt auf dem Volume | nur `widget.js` |
| Plugin nur in `plugins/` legen ohne Publish | erscheint nicht im Store |
| CORS zu fremden URLs vom Browser | Server-Route oder Gateway bauen |

---

## 10. Checkliste: neues Plugin

- [ ] `plugins/<id>/` von `_template` kopieren
- [ ] `id` in `plugin.json` und `meta` identisch (Kleinbuchstaben, `-`)
- [ ] `category` gesetzt (eine der 7 Kategorien)
- [ ] Widget: `height: 100%`, Theme-Variablen
- [ ] Optional: Settings, `pluginApiJson`, Server-Route
- [ ] `npm run publish:plugin-pack` ohne Fehler
- [ ] `plugins-pack/<id>/widget.js` vorhanden
- [ ] `plugins-index.json` enthält Eintrag
- [ ] Git push (`beta` o. ä.)
- [ ] Im Container testen: Install → Strg+F5

---

## 11. Typische Fehler

| Problem | Lösung |
|---------|--------|
| Plugin im Store, Widget leer | `widget.js` fehlt auf GitHub oder nicht installiert → Publish + Install |
| `jsx is not a function` | Altes `widget.js` — neu `publish:plugin-pack` |
| `fetch_failed:plugin.json:404` | `plugins-pack/<id>/` nicht gepusht |
| Build: `Can't resolve plugins/...` | `plugins/` liegt nicht unter Repo oder `../plugins` |
| API 404 | Pfad `/api/plugins/<id>/…`, Handler registriert? |
| Navbar/Settings fehlt | Mail-Plugin installiert? `registerNavbarSlot` in `index.tsx`? |

---

## 12. Vorlage & Beispiele

| Pfad | Inhalt |
|------|--------|
| `plugins/_template/` | Minimales Starter-Plugin |
| `plugins/mail/` | Navbar + Einstellungen-Tab + Status-Widget |
| `plugins/adguard/` | Widget + Server-API |

---

## 13. Umgebungsvariablen (Entwicklung)

| Variable | Zweck |
|----------|--------|
| `SELFDASHBOARD_PLUGINS_SRC` | Absoluter Pfad zu `plugins/` |
| `SELFDASHBOARD_PLUGIN_PACK_DIR` | Absoluter Pfad zu `plugin-pack/` |
| `SELFDASHBOARD_PLUGINS_GITHUB_REPO` | für `generate-plugins-index` |
| `SELFDASHBOARD_PLUGINS_GITHUB_REF` | Branch im Index (default `beta`) |

---

## 14. English summary

- Plugins are **folders on the volume**: `plugin.json` + `widget.js` (+ optional `server.js`).
- **Develop** in `plugins/<id>/index.tsx` (outside or beside the app repo).
- **Publish** with `npm run publish:plugin-pack` → updates `plugins-pack/` and `plugins-index.json`.
- **Users install** via GitHub Store or ZIP upload; hard-reload after install.
- **No `pluginLoader.ts`** — widgets are not compiled into the Docker image anymore.
- Call APIs with `pluginApiJson(pluginId, path)` → `/api/plugins/<id>/…`.
- See **[LOGGING.md](./LOGGING.md)** for error reporting.
