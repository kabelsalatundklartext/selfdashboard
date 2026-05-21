import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { customPluginDir } from '@/lib/pluginVolumeInfo'
import type { PluginCategory } from '@/types'
import type { PluginManifest } from '@/types/pluginManifest'

export type BundledPackCatalogEntry = PluginManifest & { files: string[] }

const INSTALL_FILES = new Set([
  'plugin.json',
  'widget.js',
  'widget.mjs',
  'server.js',
  'server.mjs',
  'icon.png',
  'icon.svg',
  'icon.jpg',
  'icon.jpeg',
  'icon.webp',
])

export function getBundledPackZipPath(): string | null {
  const env = process.env.SELFDASHBOARD_PLUGIN_PACK_ZIP?.trim()
  if (env && fs.existsSync(env)) return env
  const candidates = [
    '/app/plugin-pack/default-plugins.zip',
    path.join(process.cwd(), 'plugin-pack', 'default-plugins.zip'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

export function listBundledPackPluginIds(): string[] {
  const zipPath = getBundledPackZipPath()
  if (!zipPath) return []
  try {
    const listOut = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
    const ids = new Set<string>()
    for (const line of listOut.split(/\r?\n/)) {
      const entry = line.trim()
      const m = entry.match(/^([a-z0-9][a-z0-9-]*)\/plugin\.json$/)
      if (m) ids.add(m[1]!)
    }
    return Array.from(ids).sort()
  } catch {
    return []
  }
}

/** Install one plugin from the image-bundled default-plugins.zip (Docker build artifact). */
export function installPluginFromBundledPack(
  pluginId: string,
  files: string[],
): { ok: boolean; written: string[]; error?: string } {
  const zipPath = getBundledPackZipPath()
  if (!zipPath) {
    return { ok: false, written: [], error: 'bundled_pack_missing' }
  }

  const wanted = files.filter((f) => INSTALL_FILES.has(f))
  const destDir = customPluginDir(pluginId)
  fs.mkdirSync(destDir, { recursive: true })
  const written: string[] = []

  for (const file of wanted) {
    const entry = `${pluginId}/${file}`
    try {
      const data = execFileSync('unzip', ['-p', zipPath, entry], {
        maxBuffer: 32 * 1024 * 1024,
      })
      fs.writeFileSync(path.join(destDir, file), data)
      written.push(file)
    } catch {
      return {
        ok: false,
        written,
        error: `bundled_missing:${file}`,
      }
    }
  }

  if (!written.includes('plugin.json')) {
    return { ok: false, written, error: 'bundled_missing_plugin_json' }
  }

  return { ok: true, written }
}

const VALID_CATEGORIES = new Set<PluginCategory>([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

export function readBundledPackCatalogEntries(): BundledPackCatalogEntry[] {
  const zipPath = getBundledPackZipPath()
  if (!zipPath) return []
  const out: BundledPackCatalogEntry[] = []
  for (const id of listBundledPackPluginIds()) {
    try {
      const raw = execFileSync('unzip', ['-p', zipPath, `${id}/plugin.json`], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      })
      const j = JSON.parse(raw) as Record<string, unknown>
      const category = j.category as PluginCategory
      if (!VALID_CATEGORIES.has(category)) continue
      const files = ['plugin.json']
      try {
        execFileSync('unzip', ['-p', zipPath, `${id}/widget.js`], { maxBuffer: 1 })
        files.push('widget.js')
      } catch {
        /* no widget */
      }
      out.push({
        id: String(j.id ?? id),
        name: String(j.name ?? id),
        description: String(j.description ?? ''),
        version: String(j.version ?? '0.0.0'),
        author: String(j.author ?? 'SelfDashboard'),
        category,
        icon: j.icon as string | undefined,
        iconUrl: j.iconUrl as string | undefined,
        configSchema: j.configSchema as BundledPackCatalogEntry['configSchema'],
        defaultLayout: j.defaultLayout as BundledPackCatalogEntry['defaultLayout'],
        stackedExtraH: j.stackedExtraH as number | undefined,
        source: 'custom',
        files,
      })
    } catch {
      /* skip */
    }
  }
  return out
}
