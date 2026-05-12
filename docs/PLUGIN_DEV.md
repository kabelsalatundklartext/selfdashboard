# 🧩 SelfDashboard – Plugin Development Guide

Welcome! This guide explains how to create your own plugin for SelfDashboard.

---

## How Plugins Work

Each plugin is a small React component that registers itself with the SelfDashboard **Plugin Registry**. Once registered, it appears in the Plugin Store and can be added to any dashboard.

---

## Plugin Structure

```
my-plugin/
├── index.tsx        # Main entry: exports meta + component
├── package.json
└── README.md
```

---

## Minimal Plugin Example

```tsx
// index.tsx
import { registerPlugin } from 'selfdashboard'
import type { PluginMeta, PluginComponent, PluginWidgetProps } from 'selfdashboard'

const meta: PluginMeta = {
  id: 'com.yourname.myplugin',   // Must be globally unique!
  name: 'My Plugin',
  description: 'Shows something awesome.',
  version: '1.0.0',
  author: 'Your Name',
  category: 'utility',           // See PluginCategory type
  icon: '✨',                    // Emoji or URL to image
}

function Widget({ config }: PluginWidgetProps) {
  return (
    <div className="widget-panel">
      <p style={{ color: 'var(--text)' }}>Hello from my plugin!</p>
    </div>
  )
}

const component: PluginComponent = { Widget }

// Register with SelfDashboard
registerPlugin(meta, component)
```

---

## PluginMeta Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✅ | Unique ID (use reverse-domain: `com.yourname.plugin`) |
| `name` | string | ✅ | Display name in Plugin Store |
| `description` | string | ✅ | Short description |
| `version` | string | ✅ | Semver (e.g. `1.0.0`) |
| `author` | string | ✅ | Your name / GitHub handle |
| `category` | PluginCategory | ✅ | `media`, `system`, `network`, `storage`, `security`, `productivity`, `utility` |
| `icon` | string | — | Emoji or image URL |
| `homepage` | string | — | GitHub repo link |
| `configSchema` | PluginConfigField[] | — | User-configurable settings |

---

## Config Schema

Define settings the user can configure per widget instance:

```tsx
configSchema: [
  { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
  { key: 'apiKey', label: 'API Key', type: 'password', required: true },
  { key: 'refreshInterval', label: 'Refresh (seconds)', type: 'number', defaultValue: 30 },
]
```

Access them in your widget via `config`:
```tsx
function Widget({ config }: PluginWidgetProps) {
  const url = config.apiUrl as string
  // ...
}
```

---

## CSS Variables (for theming)

Always use these CSS variables so your plugin respects the user's chosen theme:

| Variable | Usage |
|---|---|
| `var(--background)` | Page background |
| `var(--surface)` | Card/panel background |
| `var(--surface-2)` | Slightly lighter surface |
| `var(--border)` | Borders |
| `var(--text)` | Primary text |
| `var(--text-muted)` | Secondary/dim text |
| `var(--accent)` | Accent color (buttons, highlights) |

---

## Available CSS Classes

| Class | Description |
|---|---|
| `.widget-panel` | Standard widget container |
| `.btn-accent` | Primary button |
| `.btn-ghost` | Secondary/outline button |
| `.card` | Card with hover effect |
| `.skeleton` | Loading shimmer effect |

---

## Data Fetching

Fetch from your service's API using standard `fetch` or `axios`. For sensitive data (API keys), store them in the plugin config (they are saved to localStorage).

```tsx
'use client'
import { useEffect, useState } from 'react'

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`${config.apiUrl}/api/endpoint`, {
      headers: { 'X-Api-Key': config.apiKey as string }
    })
      .then(r => r.json())
      .then(setData)
  }, [config])

  if (!data) return <div className="skeleton h-20" />
  return <div>...</div>
}
```

---

## Publishing Your Plugin

1. Create a GitHub repo named `selfdashboard-plugin-yourname`
2. Add the topic `selfdashboard-plugin` to your repo
3. Users can install by cloning your repo into the `/plugins` folder

---

## Questions & Community

- GitHub Discussions: [github.com/yourusername/selfdashboard/discussions](https://github.com/yourusername/selfdashboard/discussions)
- Open an issue for plugin ideas or feedback!
