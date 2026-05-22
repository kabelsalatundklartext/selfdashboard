import fs from 'fs'
import path from 'path'
import type { PluginManifest } from '@/types/pluginManifest'
import type { PluginCategory } from '@/types'
import { parseManifestFromPath } from '@/lib/pluginScan'

const VALID_CATEGORIES = new Set<PluginCategory>([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

function field(src: string, key: string): string | undefined {
  const re = new RegExp(`${key}:\\s*['"\`]([^'"\`]+)['"\`]`)
  const m = src.match(re)
  return m?.[1]?.trim()
}

/** Read plugin meta from plugin.json or fallback to `export const meta` in index.tsx. */
export function readPluginMetaFromDir(
  pluginDir: string,
  fallbackId: string,
  source: 'builtin' | 'custom',
): PluginManifest | null {
  const manifestPath = path.join(pluginDir, 'plugin.json')
  if (fs.existsSync(manifestPath)) {
    return parseManifestFromPath(manifestPath, source)
  }
  const tsxPath = path.join(pluginDir, 'index.tsx')
  if (!fs.existsSync(tsxPath)) return null
  const src = fs.readFileSync(tsxPath, 'utf8')
  const id = field(src, 'id') ?? fallbackId
  const category = field(src, 'category') as PluginCategory | undefined
  if (!category || !VALID_CATEGORIES.has(category)) return null
  return {
    id,
    name: field(src, 'name') ?? id,
    description: field(src, 'description') ?? '',
    version: field(src, 'version') ?? '0.0.0',
    author: field(src, 'author') ?? 'SelfDashboard',
    category,
    icon: field(src, 'icon'),
    iconUrl: field(src, 'iconUrl'),
    source,
  }
}
