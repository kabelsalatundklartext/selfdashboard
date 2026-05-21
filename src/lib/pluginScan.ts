import fs from 'fs'
import path from 'path'
import type { PluginManifest, PluginCatalogEntry } from '@/types/pluginManifest'
import type { PluginCategory } from '@/types'
import { getBuiltinPluginsRoot, getCustomPluginsRoot, PLUGIN_SCAN_SKIP_DIRS } from '@/lib/pluginPaths'
import { getRegisteredPluginServerIds } from '@/lib/pluginServerRegistry'

const VALID_CATEGORIES = new Set<PluginCategory>([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

let catalogCache: PluginCatalogEntry[] | null = null

function isValidId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(id)
}

function parseManifestFile(filePath: string, source: 'builtin' | 'custom'): PluginManifest | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const j = JSON.parse(raw) as Partial<PluginManifest>
    const id = String(j.id ?? '').trim()
    if (!isValidId(id)) return null
    const category = j.category as PluginCategory
    if (!VALID_CATEGORIES.has(category)) return null
    return {
      id,
      name: String(j.name ?? id),
      description: String(j.description ?? ''),
      version: String(j.version ?? '0.0.0'),
      author: String(j.author ?? ''),
      category,
      icon: j.icon,
      iconUrl: j.iconUrl,
      minAppVersion: j.minAppVersion,
      homepage: j.homepage,
      configSchema: j.configSchema,
      defaultLayout: j.defaultLayout,
      stackedExtraH: j.stackedExtraH,
      hasServer: j.hasServer === true,
      source,
    }
  } catch (e) {
    console.warn(`[SelfDashboard] Invalid plugin manifest: ${filePath}`, e)
    return null
  }
}

function scanRoot(root: string, source: 'builtin' | 'custom'): PluginManifest[] {
  if (!fs.existsSync(root)) return []
  const out: PluginManifest[] = []
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue
    if (PLUGIN_SCAN_SKIP_DIRS.has(name.name)) continue
    const manifestPath = path.join(root, name.name, 'plugin.json')
    if (!fs.existsSync(manifestPath)) continue
    const m = parseManifestFile(manifestPath, source)
    if (m) out.push(m)
  }
  return out
}

/** Scan `plugin.json` from builtin + custom folders. */
export function scanPluginManifests(): PluginManifest[] {
  const builtin = scanRoot(getBuiltinPluginsRoot(), 'builtin')
  const custom = scanRoot(getCustomPluginsRoot(), 'custom')
  const byId = new Map<string, PluginManifest>()
  for (const m of builtin) byId.set(m.id, m)
  for (const m of custom) byId.set(m.id, { ...m, source: 'custom' })
  const serverIds = new Set(getRegisteredPluginServerIds())
  return Array.from(byId.values()).map((m) => ({
    ...m,
    hasServer: m.hasServer || serverIds.has(m.id),
  }))
}

export function buildPluginCatalog(widgetLoadedIds: Set<string>): PluginCatalogEntry[] {
  return scanPluginManifests().map((m) => ({
    ...m,
    widgetLoaded: widgetLoadedIds.has(m.id),
  }))
}

export function getPluginCatalogCached(widgetLoadedIds: Set<string>): PluginCatalogEntry[] {
  if (!catalogCache) {
    catalogCache = buildPluginCatalog(widgetLoadedIds)
  }
  return catalogCache
}

export function reloadPluginCatalog(widgetLoadedIds: Set<string>): PluginCatalogEntry[] {
  catalogCache = buildPluginCatalog(widgetLoadedIds)
  return catalogCache
}

export function warmPluginScan(): void {
  catalogCache = buildPluginCatalog(new Set())
  const n = catalogCache.length
  console.info(`[SelfDashboard] Plugin scan: ${n} manifest(s) from disk.`)
}
