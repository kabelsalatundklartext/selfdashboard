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
      } catch (e: any) {
        setError(e.message)
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

---

## PluginWidgetProps

| Prop | Type | Description |
|---|---|---|
| `instanceId` | string | Unique instance ID |
| `config` | object | User-configured settings |
| `theme` | string | Current theme ID |

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
