# 🧩 SelfDashboard — Plugin-Entwicklung

[🇬🇧 English](#english) | [🇩🇪 Deutsch](#deutsch)

---

# 🇩🇪 Deutsch

## Was ist ein Plugin?

Ein Plugin ist eine React-Komponente die sich beim SelfDashboard Plugin-Registry registriert. Danach erscheint es automatisch im Plugin Store und kann auf jedem Dashboard hinzugefügt werden.

---

## Plugin erstellen — Schritt für Schritt

### 1. Ordner anlegen

```
plugins/
└── meinplugin/
    └── index.tsx
```

### 2. Minimales Plugin

```tsx
'use client'

import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'

// Metadaten — erscheinen im Plugin Store
export const meta: PluginMeta = {
  id: 'meinplugin',              // Eindeutige ID (nur a-z, 0-9, -)
  name: 'Mein Plugin',           // Anzeigename im Store
  description: 'Zeigt etwas.',   // Kurze Beschreibung
  version: '1.0.0',
  author: 'Dein Name',
  category: 'utility',           // Kategorie (siehe unten)
  icon: '✨',                    // Emoji oder Bild-URL
}

// Widget — wird auf dem Dashboard angezeigt
function Widget({ config }: PluginWidgetProps) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text)' }}>Hallo Welt!</p>
    </div>
  )
}

export const component: PluginComponent = { Widget }
```

### 3. Plugin registrieren

In `src/lib/pluginLoader.ts` **zwei Zeilen** hinzufügen:

```ts
import * as meinPlugin from '../../plugins/meinplugin'   // ← Zeile 1

export function loadBuiltinPlugins() {
  // ... andere Plugins ...
  registerPlugin(meinPlugin.meta, meinPlugin.component)  // ← Zeile 2
}
```

**Das war's!** Das Plugin erscheint jetzt im Plugin Store. 🎉

---

## Checkliste: Was du implementierst — was automatisch kommt

### Selbst umsetzen (Plugin-Code)

| Thema | Kurzbeschreibung |
|---|---|
| **Datei** | `plugins/<id>/index.tsx` — `'use client'`, `export const meta`, `export const component` |
| **Widget** | React-Komponente, die **`PluginWidgetProps`** nutzt; typisch **`height: '100%'`**, **`minWidth: 0`**, **`overflow`**, damit die Kachel sauber clippt |
| **Theming** | Farben über **`var(--background)`**, **`var(--text)`**, **`var(--accent)`**, … (siehe Abschnitt CSS-Variablen) |
| **Einstellungen** | Optional zweite Komponente **`Settings`** mit **`PluginSettingsProps`**; Felder schreiben per **`onChange('schlüssel', wert)`** in **`config`** |
| **Daten / APIs** | **`fetch`** im Browser nur **same-origin** ohne CORS-Probleme; für externe URLs meist eine **Route unter `src/app/api/…`** im Hauptprojekt bauen und vom Widget `/api/…` aufrufen (wie bestehende Plugins) |
| **Responsiv** | Optional Prop **`layoutMode`** (`'phone' \| 'tablet' \| 'desktop'`) für unterschiedliche Darstellung — rein optional |
| **Release** | **`src/lib/pluginLoader.ts`**: `import` + **`registerPlugin(meta, component)`**, dann **`npm run build`** bzw. Docker-Image neu bauen |

### Automatisch vom Host (ohne Extra-Code im Plugin)

| Thema | Kurzbeschreibung |
|---|---|
| **Store** | Nach erfolgreicher Registrierung erscheint das Plugin in der **Plugin-Auswahl** (`+` / Plugin-Store) |
| **Kachel-UI** | **Verschieben**, **Größe ziehen**, **Bearbeiten-Rahmen**; **Zoom**, **Innenabstand**, **Höhe** pro Instanz; **⚙️** öffnet dein Settings-Modal (falls vorhanden); **Entfernen** |
| **Props** | **`instanceId`**, **`config`**, **`theme`**, **`editMode`**, **`layoutMode`** werden an **`Widget`** übergeben |
| **Speichern** | Nutzer-**`config`** und Layout hängen am Dashboard und landen in **`dashboard.json`** (wenn `/app/data` gemountet) bzw. im lokalen Cache |
| **Start-Layout** | **`meta.defaultLayout`** / **`stackedExtraH`** werden beim Hinzufügen mit Defaults gemischt |
| **Fehlerprotokoll** | Nach **`registerPlugin`**: Render-Fehler in der Kachel + fehlgeschlagene **`fetch('/api/…')`** landen unter **Einstellungen → Protokoll** (Plugin-ID = **`meta.id`**) — siehe **[docs/LOGGING.md](LOGGING.md)** |

### Passiert nicht „von alleine“

| Thema | Erklärung |
|---|---|
| **Custom-Pfad Unraid** | Dateien nur unter **`/app/plugins/custom`** legen **registriert** im **offiziellen Image** **kein** neues TypeScript-Plugin — der Code muss beim **Build** in `pluginLoader.ts` stecken |
| **Eigene Server-API** | Es gibt keinen generischen Proxy; **serverseitige** Logik = **eigene** `src/app/api/...`-Route (oder bestehende wiederverwenden) |
| **`configSchema` in `meta`** | Feld ist im Typ vorgesehen; die UI generiert daraus aktuell **kein** Formular automatisch — Einstellungen bleiben bei **`Settings`-Komponente** |
| **Externe URLs direkt im Browser** | `fetch('https://fremd.example')` wird **nicht** automatisch ins Protokoll geschrieben — dafür eine **`/api/<dein-plugin>/`**-Route im Hauptprojekt |

---

## Fehlerprotokoll (für Nutzer & Entwickler)

Vollständige Referenz: **[docs/LOGGING.md](LOGGING.md)**.

### Was du als Autor tun musst

1. **`meta.id`** stabil und eindeutig wählen (wird als **`pluginId`** im Protokoll verwendet).
2. In **`pluginLoader.ts`** registrieren — danach ist das **Widget** automatisch abgesichert.
3. Server-Zugriff: Route unter **`src/app/api/<meta.id>/`** (oder Unterpfad wie `calendar`) und im Widget **`fetch('/api/…')`** oder **`pluginApiJson`** aus **`@/lib/pluginDev`**.
4. In **`catch`**: optional **`reportPluginCatch('deine-id', e, 'kategorie')`** für Kontext (z. B. Sync-Schritt).

### Starter-Vorlage

Ordner **`plugins/_template/`** kopieren nach **`plugins/<id>/`**, `meta.id` anpassen, in **`pluginLoader.ts`** eintragen.

### Server-API-Route (Beispiel)

```ts
import { NextResponse } from 'next/server'
import { withApiRouteLog } from '@/lib/apiRouteLog'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return withApiRouteLog(req, 'POST', async () => {
    try {
      // … deine Logik …
      return NextResponse.json({ ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await logPluginApiFailure('meinplugin', 'POST', msg)
      return NextResponse.json({ error: msg }, { status: 502 })
    }
  }, 'meinplugin')
}
```

**Niemals** `@/lib/pluginLogServer` oder `@/lib/errorLog` in **`plugins/**/index.tsx`** importieren (bricht den Webpack-Build).

---

## Builtin vs. Docker / Unraid (wichtig)

- **`pluginLoader.ts`** liegt im **Quellcode** und wird beim **`next build`** / Docker-Image in die App **eingebunden**. Auf dem Server (Unraid, Docker) hängt man diese Datei **nicht** per Volume ein, um neue Plugins „nachzuladen“.
- **Neues Plugin nutzen:** Ordner unter `plugins/<id>/` anlegen, in **`src/lib/pluginLoader.ts`** importieren und **`registerPlugin(...)`** aufrufen (siehe oben), dann **Image neu bauen** und ausrollen (oder PR ins Haupt-Repository).
- **Unraid „Custom Plugins Path“** → `/app/plugins/custom`: Im **Standard-Image** werden daraus **keine** beliebigen TypeScript-Plugins zur Laufzeit geladen. Das Volume ist **optional** (eigene Dateien, selbst gebautes Image, o. Ä.). Wer nur Dateien auf die Platte legt und das offizielle Image unverändert nutzt, sieht **keine** neuen Store-Einträge.

---

## Plugin mit Einstellungen

Plugins können eigene Einstellungen haben die der Nutzer über das ⚙️ Icon konfiguriert:

```tsx
'use client'

import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'meinplugin',
  name: 'Mein Plugin',
  description: 'Plugin mit Einstellungen.',
  version: '1.0.0',
  author: 'Dein Name',
  category: 'utility',
  icon: '⚙️',
}

// Widget liest Werte aus config
function Widget({ config }: PluginWidgetProps) {
  const titel = (config.titel as string) || 'Standard'
  const farbe = (config.farbe as string) || 'var(--accent)'

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: farbe, fontSize: '1.2em', fontWeight: 700 }}>{titel}</p>
    </div>
  )
}

// Settings — wird im Einstellungs-Modal angezeigt
function Settings({ config, onChange }: PluginSettingsProps) {
  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '6px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Titel
        </label>
        <input
          style={inp}
          value={(config.titel as string) || ''}
          onChange={(e) => onChange('titel', e.target.value)}
          placeholder="Mein Titel"
        />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Farbe
        </label>
        <input
          type="color"
          value={(config.farbe as string) || '#6366f1'}
          onChange={(e) => onChange('farbe', e.target.value)}
          style={{ width: '48px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

// Beide exportieren!
export const component: PluginComponent = { Widget, Settings }
```

---

## Daten von einer API laden

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'
import { reportPluginCatch } from '@/lib/pluginDev'

export const meta: PluginMeta = {
  id: 'mein-api-plugin',
  name: 'API Plugin',
  description: 'Lädt Daten von einer API.',
  version: '1.0.0',
  author: 'Dein Name',
  category: 'utility',
  icon: '🌐',
}

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = config.apiUrl as string
  const apiKey = config.apiKey as string
  const interval = ((config.refresh as number) ?? 30) * 1000

  useEffect(() => {
    if (!apiUrl) { setLoading(false); return }

    const load = async () => {
      try {
        const res = await fetch(apiUrl, {
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setData(await res.json())
        setError(null)
      } catch (e: unknown) {
        reportPluginCatch('mein-api-plugin', e, 'fetch')
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }

    load()
    const id = setInterval(load, interval)
    return () => clearInterval(id)
  }, [apiUrl, apiKey, interval])

  if (!apiUrl) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>API URL eintragen</p>
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '4px' }} />)}
    </div>
  )

  if (error) return (
    <p style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {error}</p>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <pre style={{ fontSize: '11px', color: 'var(--text)' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '6px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API URL</label>
        <input style={inp} value={(config.apiUrl as string) || ''} onChange={(e) => onChange('apiUrl', e.target.value)} placeholder="http://..." />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API Key (optional)</label>
        <input style={inp} type="password" value={(config.apiKey as string) || ''} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="••••••••" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Aktualisierung (Sekunden)</label>
        <input style={inp} type="number" value={(config.refresh as number) ?? 30} onChange={(e) => onChange('refresh', Number(e.target.value))} min={5} />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
```

---

## CSS Variablen (Themes)

Immer CSS-Variablen verwenden damit das Plugin alle Themes unterstützt:

| Variable | Verwendung |
|---|---|
| `var(--background)` | Seitenhintergrund |
| `var(--surface)` | Karten-/Panel-Hintergrund |
| `var(--surface-2)` | Leicht hellere Oberfläche |
| `var(--border)` | Rahmen |
| `var(--text)` | Haupttext |
| `var(--text-muted)` | Gedimmter/sekundärer Text |
| `var(--accent)` | Akzentfarbe (Buttons, Highlights) |

---

## CSS Klassen

| Klasse | Beschreibung |
|---|---|
| `.widget-panel` | Standard Widget-Container |
| `.btn-accent` | Primärer Button (lila) |
| `.btn-ghost` | Sekundärer/Outline Button |
| `.skeleton` | Lade-Shimmer-Effekt |

---

## Kategorien

| ID | Anzeige |
|---|---|
| `utility` | 🔧 Dienstprogramm |
| `system` | 🖥️ System |
| `media` | 🎬 Medien |
| `network` | 🌐 Netzwerk |
| `storage` | 💾 Speicher |
| `security` | 🔒 Sicherheit |
| `productivity` | 📋 Produktivität |

---

## Typ-Referenz (`@/types`)

### `PluginMeta` (wichtigste Felder)

| Feld | Pflicht | Hinweis |
|---|---|---|
| `id`, `name`, `description`, `version`, `author`, `category` | ja | `id` stabil halten (gespeichert im Dashboard) |
| `icon` | nein | Emoji oder Bild-URL |
| `defaultLayout`, `minW`, … | nein | Startgröße beim Einfügen |
| `stackedExtraH` | nein | Zusatzhöhe nur Anzeige im **gestapelten** Raster |
| `configSchema` | nein | Reserviert; **keine** automatisch generierte Einstellungs-UI |

### `PluginWidgetProps`

| Prop | Typ | Beschreibung |
|---|---|---|
| `instanceId` | `string` | Eindeutige Instanz-ID |
| `config` | `Record<string, unknown>` | Nutzer-Konfiguration |
| `theme` | `ThemeId` | Aktives Farbschema |
| `editMode` | `boolean?` | `true`, wenn Layout bearbeitet wird |
| `layoutMode` | `'phone' \| 'tablet' \| 'desktop'?` | Raster-Modus des Dashboards (optional) |

### `PluginSettingsProps`

| Prop | Beschreibung |
|---|---|
| `config` | Aktuelle Werte |
| `onChange` | `(key, value) => void` |

---

## Plugin veröffentlichen

1. GitHub Repo erstellen: `selfdashboard-plugin-meinname`
2. Topic `selfdashboard-plugin` hinzufügen
3. **Mit ins Haupt-Repo mergen:** Ordner nach `plugins/` kopieren und `pluginLoader.ts` wie oben ergänzen → PR. **Oder eigenes Docker-Image** bauen (Fork), mit gleicher Registrierung — Konsumenten brauchen dann **dein** Image, nicht nur einen Datei-Kopier-Schritt auf der Platte.

---

# 🇬🇧 English

## What is a Plugin?

A plugin is a React component that registers itself with the SelfDashboard Plugin Registry. It then automatically appears in the Plugin Store and can be added to any dashboard.

---

## Creating a Plugin — Step by Step

### 1. Create folder

```
plugins/
└── myplugin/
    └── index.tsx
```

### 2. Minimal plugin

```tsx
'use client'

import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'

export const meta: PluginMeta = {
  id: 'myplugin',
  name: 'My Plugin',
  description: 'Shows something.',
  version: '1.0.0',
  author: 'Your Name',
  category: 'utility',
  icon: '✨',
}

function Widget({ config }: PluginWidgetProps) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text)' }}>Hello World!</p>
    </div>
  )
}

export const component: PluginComponent = { Widget }
```

### 3. Register the plugin

In `src/lib/pluginLoader.ts` add **two lines**:

```ts
import * as myPlugin from '../../plugins/myplugin'      // ← Line 1

export function loadBuiltinPlugins() {
  // ... other plugins ...
  registerPlugin(myPlugin.meta, myPlugin.component)     // ← Line 2
}
```

**That's it!** The plugin now appears in the Plugin Store. 🎉

---

## Checklist: what you build vs. what is automatic

### You implement (plugin code)

| Topic | Notes |
|---|---|
| **File** | `plugins/<id>/index.tsx` — `'use client'`, `export const meta`, `export const component` |
| **Widget** | React component using **`PluginWidgetProps`**; usually **`height: '100%'`**, **`minWidth: 0`**, sensible **`overflow`** so the tile clips cleanly |
| **Theming** | Prefer **`var(--background)`**, **`var(--text)`**, **`var(--accent)`**, … (see CSS variables below) |
| **Settings** | Optional **`Settings`** component with **`PluginSettingsProps`**; write user fields via **`onChange('key', value)`** into **`config`** |
| **Data / APIs** | Browser **`fetch`** is straightforward **same-origin**; for third-party URLs you typically add a **`src/app/api/...`** route in the main app and call **`/api/...`** from the widget (same pattern as built-in plugins) |
| **Responsive** | Optional **`layoutMode`** (`'phone' \| 'tablet' \| 'desktop'`) — use if the widget should adapt to dashboard breakpoints |
| **Shipping** | **`src/lib/pluginLoader.ts`**: `import` + **`registerPlugin(meta, component)`**, then **`npm run build`** / rebuild your Docker image |

### Provided by the host app (no extra plugin code)

| Topic | Notes |
|---|---|
| **Store** | After registration the plugin shows up in the **plugin picker** / store |
| **Tile chrome** | **Drag**, **resize**, edit outline; per-instance **zoom**, **padding**, **height**; **⚙️** opens your `Settings` when exported; **remove** |
| **Props** | **`instanceId`**, **`config`**, **`theme`**, **`editMode`**, **`layoutMode`** are passed to **`Widget`** |
| **Persistence** | User **`config`** and layout are tied to the dashboard and saved to **`dashboard.json`** (when `/app/data` is mounted) plus local cache |
| **Initial layout** | **`meta.defaultLayout`** / **`stackedExtraH`** are merged with defaults when the user adds a widget |
| **Error log** | After **`registerPlugin`**: render errors in the tile + failed **`fetch('/api/…')`** go to **Settings → Logs** (`pluginId` = **`meta.id`**) — see **[docs/LOGGING.md](LOGGING.md)** |

### Not automatic

| Topic | Explanation |
|---|---|
| **Unraid custom path** | Dropping TS sources into **`/app/plugins/custom`** **does not** register a new plugin in the **stock** image — code must be linked in **`pluginLoader.ts`** at **build** time |
| **Server API** | There is no generic proxy; **server-side** work means your own **`src/app/api/...`** route (or reuse an existing one) |
| **`configSchema` on `meta`** | The field exists on the type; the UI **does not** auto-generate a form from it today — use a **`Settings`** component |
| **Direct browser fetch to third-party URLs** | Not auto-logged — add a **`/api/your-plugin/`** route in the main app instead |

---

## Error log (for users & developers)

Full reference: **[docs/LOGGING.md](LOGGING.md)**.

### What you must do as an author

1. Choose a stable **`meta.id`** (used as **`pluginId`** in the log).
2. Register in **`pluginLoader.ts`** — the **Widget** is then wrapped automatically.
3. Server access: **`src/app/api/<meta.id>/`** and call **`fetch('/api/…')`** or **`pluginApiJson`** from **`@/lib/pluginDev`** in the widget.
4. In **`catch`**: optionally **`reportPluginCatch('your-id', e, 'category')`** for extra context.

### Starter template

Copy **`plugins/_template/`** to **`plugins/<id>/`**, set **`meta.id`**, register in **`pluginLoader.ts`**.

### Server API route (example)

Same pattern as the German section above — use **`withApiRouteLog`** and **`logPluginApiFailure`** from **`@/lib/pluginLogServer`** only in **`src/app/api/**`**.

**Never** import server log modules in **`plugins/**/index.tsx`**.

---

## Builtin vs. Docker / Unraid (important)

- **`pluginLoader.ts`** is **source code** bundled at **`next build`** / Docker image build time. You **do not** bind-mount it on Unraid or Docker to “inject” new plugins at runtime.
- **To ship a new plugin:** add `plugins/<id>/`, import and **`registerPlugin(...)`** in **`src/lib/pluginLoader.ts`**, then **rebuild and deploy** the image (or open a PR to the main repo).
- **Unraid “Custom Plugins Path”** → `/app/plugins/custom`: the **stock** image **does not** auto-load arbitrary TypeScript plugins from that folder at runtime. The volume is **optional** (your files, a custom-built image, etc.). Dropping files on disk alone into a mapped folder **will not** register new store entries on the official image.

---

## PluginMeta Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✅ | Unique ID (a-z, 0-9, - only) |
| `name` | string | ✅ | Display name in Plugin Store |
| `description` | string | ✅ | Short description |
| `version` | string | ✅ | Semver (e.g. `1.0.0`) |
| `author` | string | ✅ | Your name |
| `category` | string | ✅ | See categories table |
| `icon` | string | — | Emoji or image URL |
| `defaultLayout` | object | — | Merged with defaults when adding a widget (`w`, `h`, `minW`, …) |
| `stackedExtraH` | number | — | Extra display rows in stacked (phone) grid only |
| `configSchema` | array | — | Reserved; **no** auto-generated settings UI yet |

---

## PluginWidgetProps

| Prop | Type | Description |
|---|---|---|
| `instanceId` | string | Unique instance ID |
| `config` | object | User-configured settings |
| `theme` | `ThemeId` | Current theme id |
| `editMode` | `boolean?` | `true` while the dashboard layout is being edited |
| `layoutMode` | `'phone' \| 'tablet' \| 'desktop'?` | Dashboard grid mode (optional for responsive widgets) |

---

## PluginSettingsProps

| Prop | Type | Description |
|---|---|---|
| `config` | object | Current config values |
| `onChange` | function | `(key, value) => void` — call to update a value |

---

## Publishing Your Plugin

1. Create a GitHub repo: `selfdashboard-plugin-yourname`
2. Add topic `selfdashboard-plugin`
3. **Upstream:** copy your folder into `plugins/` and extend `pluginLoader.ts` as above → open a PR. **Or** publish a **forked Docker image** with the same registration — consumers need **your** image rebuild, not only copying files on disk.
