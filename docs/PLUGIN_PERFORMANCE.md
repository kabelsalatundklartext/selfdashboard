# Plugin-Performance — Leitfaden für Entwickler

SelfDashboard lädt Widgets vom **Volume** (`widget.js` / `widget.css`) und ruft APIs über `/api/plugins/<id>/…` auf. Viele Kacheln oder große Bundles verlangsamen den ersten Seitenaufbau spürbar.

Dieser Leitfaden fasst zusammen, **worauf du als Plugin-Autor achten solltest**, damit dein Plugin schnell lädt und sich gut in das Dashboard einfügt.

Verwandte Docs: **[PLUGIN_DEV.md](./PLUGIN_DEV.md)** · **[PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md)**

---

## Kurzüberblick: Drei Ebenen

| Ebene | Was du lieferst | Was SelfDashboard macht |
|-------|-----------------|-------------------------|
| **1. Assets** | Kleines `widget.js`, optionales `widget.css`, `version` in `plugin.json` | Priorisiertes Laden, Browser-Cache per Version |
| **2. Widget-Daten** | `pluginApiJsonWithStale`, sinnvolle Poll-Intervalle | Stale-Cache in `sessionStorage` |
| **3. Server-API** | Kurze Handler, optional TTL-Cache + Invalidierung | Builtin-Handler im Docker-Image |

---

## 1. Widget-Bundle klein halten

### Nicht selbst bundeln — Host-Bridge nutzen

Beim Build (`npm run build:plugin-pack`) werden schwere Abhängigkeiten **externalisiert**. Dein `widget.js` soll nur deine Plugin-Logik enthalten.

| Import in `index.tsx` | Im Bundle? | Stattdessen |
|----------------------|------------|-------------|
| `react` / `react-dom` | Nein | Automatisch über `globalThis.SelfDashboard` |
| `lucide-react` | Nein | Automatisch über `SelfDashboard.LucideReact` |
| `@/lib/store` (`useDashboardStore`) | Nein | Host-Zustand-Bridge |
| `@/lib/pluginDev` | Nein | Host-API-Bridge |
| `@/lib/pluginLocale`, `@/lib/i18n` | Nein | Host-Bridge |

**Richtig:**

```tsx
import { Copy, RefreshCw } from 'lucide-react'
import { pluginApiJson, pluginApiJsonWithStale, reportPluginCatch } from '@/lib/pluginDev'
import { useDashboardStore } from '@/lib/store'
```

**Falsch:**

```tsx
import * as React from 'react'          // eigene React-Kopie → groß + Fehler
import { Shield } from 'lucide-react/dist/esm/icons/shield'  // Deep-Import umgeht Shim
import { create } from 'zustand'         // eigener Store
import axios from 'axios'                // nur wenn wirklich nötig — Bundle wächst
```

### Lucide-Icons

Nur Icons verwenden, die der Host bereitstellt (`src/lib/pluginLucideBridge.ts`). Fehlt ein Icon:

- PR/Issue mit Icon-Name, **oder**
- kleines inline SVG / Emoji statt neues npm-Paket

### CSS auslagern

Styles in **`widget.css`** neben dem Plugin ablegen, nicht große CSS-Strings in JS. Der Loader lädt CSS und JS **parallel**.

### Größen als Richtwert

| Größe `widget.js` | Einschätzung |
|-------------------|--------------|
| &lt; 30 KB | Sehr gut |
| 30–60 KB | OK |
| 60–100 KB | Prüfen: unnötige Libs? |
| &gt; 100 KB | Dringend optimieren (Lucide/React/Store prüfen) |

Build lokal testen:

```bash
npm run build:plugin-pack -- meinplugin
# Größe prüfen: plugins-pack/meinplugin/widget.js
```

Der Build setzt **`minify: true`**. Quellen (`index.tsx`) im Repo behalten, `widget.js` committen.

---

## 2. Version & Browser-Cache

SelfDashboard lädt Assets so:

```text
/api/plugins/custom-assets/<id>/widget.js?v=<plugin.json version>
/api/plugins/custom-assets/<id>/widget.css?v=<plugin.json version>
```

### Pflicht bei jedem Release

**`version` in `plugin.json` erhöhen** (z. B. `1.0.0` → `1.0.1`).

- Stimmt `?v=` mit der installierten Version überein → Browser darf **1 Jahr** cachen (`immutable`).
- Stimmt sie nicht → `no-store` (kein Cache).

Ohne Versions-Bump laden Nutzer nach Update oft noch altes JS, bis Hard-Reload.

### Nach Store-Update

Nutzer: **Aktualisieren** im Plugin-Store, dann **Strg+F5**.

---

## 3. Lade-Reihenfolge im Dashboard

SelfDashboard lädt Volume-Plugins **gestaffelt**:

1. **Priorität:** Plugins auf dem **aktiven Dashboard** (+ globale Plugins wie `mail` für Navbar)
2. **`ready`:** Dashboard wird nutzbar
3. **Deferred:** Plugins von anderen Dashboards im Hintergrund

### Was du daraus ableiten solltest

| Tipp | Warum |
|------|--------|
| Widget soll **sofort rendern** (Skeleton/„Lade…“), nicht auf deferred Scripts warten | Anderes Dashboard kann dein Plugin schon registriert haben |
| Keine schweren **Sync-Imports** oben in `index.tsx` | Blockiert Parse/Execute beim Script-Load |
| **Kein** globales `fetch` beim Modul-Start | Lieber in `useEffect` / nach erstem Paint |
| Navbar-Plugins sparsam halten | `mail` wird immer mitgeladen |

Du steuerst die Priorität **nicht** selbst — sie kommt aus der Dashboard-Konfiguration des Nutzers.

---

## 4. API-Daten im Widget (Client)

### `pluginApiJsonWithStale` für Dashboard-Daten

Für Daten, die sich sekündlich ändern müssen, aber beim Reload **sofort** sichtbar sein sollen:

```tsx
import { pluginApiJsonWithStale } from '@/lib/pluginDev'

const data = await pluginApiJsonWithStale<MyType>('meinplugin', '/status', {
  timeoutMs: 15_000,
  staleMaxAgeMs: 60_000, // Default: 60 s — letzte Antwort aus sessionStorage
})
```

**Ablauf:**

1. Gibt es frischen Cache (&lt; `staleMaxAgeMs`) → **sofort anzeigen**, Fetch im Hintergrund
2. Sonst → normal warten, Ergebnis cachen

**Eignet sich für:** Status-Übersichten, Listen, Metriken  
**Weniger für:** Formulare, einmalige Aktionen, Entsperren/Löschen → `pluginApiJson`

### Poll-Intervalle

```tsx
useEffect(() => {
  void load()
  const id = window.setInterval(() => void load(), refreshSeconds * 1000)
  return () => window.clearInterval(id)
}, [refreshSeconds])
```

| Intervall | Empfehlung |
|-------------|------------|
| &lt; 5 s | Nur bei Live-Daten (Container-Stats o. ä.) |
| 15–60 s | Typisch für Status-Widgets |
| &gt; 60 s | Statische/quasi-statische Quellen |

Intervall in **Settings konfigurierbar** machen (Default konservativ).

### Direkte Fremd-APIs (Emby, Unraid, …)

Kein SelfDashboard-Server → du implementierst Stale-Cache **selbst** (z. B. `sessionStorage` wie in `plugins-pack/unraid/widget.js`), sonst jeder Reload = voller Roundtrip.

---

## 5. Server-API (Builtin-Handler)

Server-Code liegt in **`src/builtin-plugins/<id>/`** und braucht ein **neues Docker-Image**. Widget-Only-Updates reichen dafür nicht.

### TTL-Cache für teure Abfragen

```ts
import { createPluginServerCache } from '@/lib/pluginServerCache'

const cache = createPluginServerCache({
  ttlMs: Math.max(0, Number(process.env.MEINPLUGIN_CACHE_MS) || 10_000),
  maxEntries: 16,
})

// GET: cache.get(key) → bei Miss berechnen → cache.set(key, data)
// POST/DELETE: cache.delete(key) oder cache.clear()
```

**Beispiele im Repo:** `crowdsec` (~20 s), `docker` (~8 s), `weather` (~8 min).

### Regeln

| Do | Don't |
|----|-------|
| Cache-Key aus **Request-Parametern** bilden | Ein Key für alle Nutzer/Konfigurationen |
| Cache nach **Mutation** invalidieren | Alte Liste nach „Container stoppen“ |
| TTL per **Env** dokumentieren | Minutenlanger Cache ohne Hinweis |
| Fehler **nicht** cachen | 500er 20 s lang servieren |

---

## 6. UI-Verhalten

- **Loading-State:** Skeleton oder kompaktes „Lade…“, kein leeres Widget
- **Fehler:** `reportPluginCatch('meinplugin', e)` — nicht nur `console.error`
- **Keine Layout-Shifts:** feste Min-Höhen für Zahlen/Icons wo möglich
- **Listen virtualisieren** ab ~100+ Zeilen (selten nötig bei Kachelgröße)
- **Bilder:** klein halten, SVG bevorzugen; große PNGs nicht ins Bundle

---

## 7. Checkliste vor Release

- [ ] `plugin.json` **`version` erhöht**
- [ ] `widget.js` neu gebaut (`npm run build:plugin-pack -- <id>`)
- [ ] `widget.js` **&lt; ~60 KB** (Ziel) oder Begründung dokumentiert
- [ ] Kein eigenes React / Zustand / Lucide-Bundle
- [ ] Styles in `widget.css`, wenn &gt; wenige Zeilen
- [ ] Dashboard-Daten: `pluginApiJsonWithStale` oder bewusst `pluginApiJson`
- [ ] Poll-Intervall ≥ 15 s (Default), in Settings änderbar
- [ ] Server: TTL-Cache + Invalidierung bei Schreibaktionen
- [ ] Getestet: Store-Update → Strg+F5 → Widget sichtbar

---

## 8. Typische Anti-Patterns

| Problem | Symptom | Lösung |
|---------|---------|--------|
| Kein Version-Bump | Nutzer sehen altes Widget | `version` in `plugin.json` |
| Lucide/React im Bundle | `widget.js` &gt; 80 KB | Imports wie oben; neu bauen |
| `fetch` in Modul-Top-Level | Langsamer Start, Doppel-Requests | `useEffect` |
| Poll alle 1 s | Hohe Server-Last | Intervall + Server-Cache |
| Riesige JSON-Antworten | Träge API | Limit/Pagination im Handler |
| Alles in einer TS-Datei | Schwer wartbar | Split OK — Build bundelt; Größe zählt |

---

## 9. Referenz-Plugins im Repo

| Plugin | Gut für |
|--------|---------|
| **crowdsec** | TSX-Quellen, `pluginApiJsonWithStale`, Server-TTL-Cache, `widget.css` |
| **unraid** | Stale-Cache bei direkter GraphQL-API ohne Builtin-Server |
| **docker** | Server-Cache, Invalidierung nach Container-Aktion |
| **clock** / **iframe** | Kleine Bundles als Größen-Vorbild |

---

## 10. Umgebungsvariablen (Server-Cache)

| Variable | Default | Plugin |
|----------|---------|--------|
| `CROWDSEC_DASHBOARD_CACHE_MS` | 20000 | crowdsec |
| `DOCKER_LIST_CACHE_MS` | 8000 | docker |

Eigene Plugins: analog `MEINPLUGIN_*_CACHE_MS` in README dokumentieren.

---

## 11. Zusammenfassung

1. **Klein bundeln** — Host-Bridge nutzen, CSS separat, minifiziert bauen  
2. **Version bumpen** — Browser-Cache und Store-Updates funktionieren zuverlässig  
3. **Stale-Cache** — schnelle Anzeige nach Reload (`pluginApiJsonWithStale`)  
4. **Server entlasten** — TTL-Cache + sinnvolle Poll-Intervalle  
5. **Erst rendern, dann laden** — kein schwerer Code beim Script-Start  

Fragen oder fehlende Lucide-Icons: Issue/PR im [SelfDashboard-Repo](https://github.com/kabelsalatundklartext/selfdashboard) — am besten mit Plugin-ID und Icon-Namen.
