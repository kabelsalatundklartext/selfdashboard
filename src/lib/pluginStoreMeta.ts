import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PluginMeta } from '@/types'
import { listKnownPluginIds } from '@/lib/auth/pluginPolicy'

/** Built-in / common plugins (when manifest.json is not on disk in the image). */
const BUILTIN_STORE_META: Record<string, PluginMeta> = {
  calendar: {
    id: 'calendar',
    name: 'Kalender',
    description: 'CalDAV + ICS Kalender',
    version: '1.5.2',
    author: 'SelfDashboard',
    category: 'productivity',
    icon: '📅',
    defaultLayout: { w: 6, h: 8, minW: 3, minH: 6 },
  },
  weather: {
    id: 'weather',
    name: 'Wetter',
    description: 'Wettervorhersage',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'utility',
    icon: '🌤️',
    defaultLayout: { w: 4, h: 4, minW: 2, minH: 3 },
  },
  mail: {
    id: 'mail',
    name: 'Mail',
    description: 'E-Mail Postfach',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'productivity',
    icon: '✉️',
    defaultLayout: { w: 6, h: 8, minW: 4, minH: 6 },
  },
}

const CLIENT_ONLY_META: Record<string, PluginMeta> = {
  bookmarks: {
    id: 'bookmarks',
    name: 'Lesezeichen',
    description: 'Schnellzugriff auf Links',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'utility',
    icon: '🔖',
    defaultLayout: { w: 4, h: 4, minW: 2, minH: 2 },
  },
  clock: {
    id: 'clock',
    name: 'Uhr',
    description: 'Uhrzeit und Datum',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'utility',
    icon: '🕐',
    defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  },
  emby: {
    id: 'emby',
    name: 'Emby',
    description: 'Emby Medien',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'media',
    icon: '🎬',
    defaultLayout: { w: 4, h: 4, minW: 2, minH: 3 },
  },
  iframe: {
    id: 'iframe',
    name: 'iFrame',
    description: 'Beliebige Webseite einbetten',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'utility',
    icon: '🌐',
    defaultLayout: { w: 6, h: 6, minW: 3, minH: 3 },
  },
  scratchpad: {
    id: 'scratchpad',
    name: 'Notizen',
    description: 'Kurznotizen',
    version: '1.0.0',
    author: 'SelfDashboard',
    category: 'productivity',
    icon: '📝',
    defaultLayout: { w: 4, h: 4, minW: 2, minH: 2 },
  },
}

function pluginsRoots(): string[] {
  const roots: string[] = []
  const cwd = process.cwd()
  for (const rel of ['plugins', join('src', 'builtin-plugins')]) {
    const p = join(cwd, rel)
    if (existsSync(p)) roots.push(p)
  }
  return roots
}

function readJsonMeta(pluginId: string, filename: string): PluginMeta | null {
  for (const root of pluginsRoots()) {
    const path = join(root, pluginId, filename)
    if (!existsSync(path)) continue
    try {
      const raw = readFileSync(path, 'utf8')
      const j = JSON.parse(raw) as Partial<PluginMeta>
      if (!j.id) j.id = pluginId
      return j as PluginMeta
    } catch {
      /* try next */
    }
  }
  return null
}

function readManifestFromDisk(pluginId: string): PluginMeta | null {
  return readJsonMeta(pluginId, 'manifest.json')
}

function readPluginJsonFromDisk(pluginId: string): PluginMeta | null {
  return readJsonMeta(pluginId, 'plugin.json')
}

const metaCache = new Map<string, PluginMeta | null>()

/** Resolve store card metadata for a plugin id (built-in + volume manifests). */
export function getPluginStoreMeta(pluginId: string): PluginMeta | null {
  if (metaCache.has(pluginId)) return metaCache.get(pluginId) ?? null

  let meta: PluginMeta | null =
    BUILTIN_STORE_META[pluginId] ?? CLIENT_ONLY_META[pluginId] ?? null
  if (!meta) meta = readManifestFromDisk(pluginId)
  if (!meta) {
    const pluginJson = readPluginJsonFromDisk(pluginId)
    if (pluginJson) meta = pluginJson
  }
  if (!meta) {
    meta = {
      id: pluginId,
      name: pluginId,
      description: '',
      version: '1.0.0',
      author: 'SelfDashboard',
      category: 'utility',
      icon: '📦',
      defaultLayout: { w: 4, h: 4, minW: 2, minH: 2 },
    }
  }

  metaCache.set(pluginId, meta)
  return meta
}

export function warmPluginStoreMetaCache(): void {
  for (const id of listKnownPluginIds()) getPluginStoreMeta(id)
}
