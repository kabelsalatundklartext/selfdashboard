import fs from 'fs'
import path from 'path'
import type { PluginManifest } from '@/types/pluginManifest'
import type { PluginCategory } from '@/types'
import { customPluginDir } from '@/lib/pluginVolumeInfo'
import { listInstalledVolumePluginIds } from '@/lib/pluginVolumeInfo'
import { installPluginFromBundledPack, readBundledPackCatalogEntries } from '@/lib/pluginBundledPack'
import { getBuiltinPluginsRoot, PLUGIN_SCAN_SKIP_DIRS } from '@/lib/pluginPaths'
import { readPluginMetaFromDir } from '@/lib/pluginMetaExtract'

const VALID_CATEGORIES = new Set<PluginCategory>([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

export type GitHubPluginIndexEntry = PluginManifest & {
  files: string[]
}

export type GitHubPluginIndex = {
  version?: number
  repository?: string
  ref?: string
  basePath?: string
  plugins: GitHubPluginIndexEntry[]
}

export function getGitHubPluginConfig(): {
  owner: string
  repo: string
  ref: string
  basePath: string
  indexPath: string
} | null {
  const repoEnv = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REPO?.trim()
  if (!repoEnv || !repoEnv.includes('/')) return null
  const [owner, repo] = repoEnv.split('/').filter(Boolean)
  if (!owner || !repo) return null
  const ref = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REF?.trim() || 'main'
  const basePath = (process.env.SELFDASHBOARD_PLUGINS_GITHUB_PATH?.trim() || 'plugins-pack').replace(
    /^\/+|\/+$/g,
    '',
  )
  const indexPath =
    process.env.SELFDASHBOARD_PLUGINS_GITHUB_INDEX?.trim() || `${basePath}/plugins-index.json`
  return { owner, repo, ref, basePath, indexPath }
}

export function githubRawUrl(filePath: string): string | null {
  const cfg = getGitHubPluginConfig()
  if (!cfg) return null
  const p = filePath.replace(/^\/+/, '')
  return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.ref}/${p}`
}

let indexCache: { at: number; data: GitHubPluginIndex } | null = null
const INDEX_TTL_MS = 5 * 60 * 1000

export async function fetchGitHubPluginIndex(force = false): Promise<GitHubPluginIndex | null> {
  const cfg = getGitHubPluginConfig()
  if (!cfg) return null
  const now = Date.now()
  if (!force && indexCache && now - indexCache.at < INDEX_TTL_MS) {
    return indexCache.data
  }
  const url = githubRawUrl(cfg.indexPath)
  if (!url) return null
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.warn(`[SelfDashboard] GitHub plugin index failed: ${res.status} ${url}`)
    return null
  }
  const data = (await res.json()) as GitHubPluginIndex
  if (!Array.isArray(data.plugins)) return null
  indexCache = { at: now, data }
  return data
}

export function clearGitHubPluginIndexCache(): void {
  indexCache = null
}

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

export async function installPluginFromGitHub(pluginId: string): Promise<{
  ok: boolean
  pluginId: string
  written: string[]
  error?: string
  source?: 'github' | 'bundled_pack'
}> {
  const cfg = getGitHubPluginConfig()
  if (!cfg) return { ok: false, pluginId, written: [], error: 'github_not_configured' }

  const index = await fetchGitHubPluginIndex(true)
  let entry = index?.plugins.find((p) => p.id === pluginId)
  if (!entry) entry = readBundledPackCatalogEntries().find((p) => p.id === pluginId)
  if (!entry) entry = readImagePluginCatalogEntries().find((p) => p.id === pluginId)
  if (!entry) return { ok: false, pluginId, written: [], error: 'plugin_not_in_index' }

  const files = (entry.files ?? ['plugin.json', 'widget.js']).filter((f) => INSTALL_FILES.has(f))
  const destDir = customPluginDir(pluginId)
  fs.mkdirSync(destDir, { recursive: true })
  const written: string[] = []

  const missingFromGitHub: string[] = []

  for (const file of files) {
    const rel = `${cfg.basePath}/${pluginId}/${file}`
    const url = githubRawUrl(rel)
    if (!url) {
      missingFromGitHub.push(file)
      continue
    }
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      missingFromGitHub.push(file)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path.join(destDir, file), buf)
    written.push(file)
  }

  if (missingFromGitHub.length > 0) {
    const bundled = installPluginFromBundledPack(pluginId, missingFromGitHub)
    for (const f of bundled.written) {
      if (!written.includes(f)) written.push(f)
    }
    if (!bundled.ok) {
      const ghErr = missingFromGitHub.includes('plugin.json')
        ? 'fetch_failed:plugin.json:404'
        : `fetch_failed:${missingFromGitHub[0]}:404`
      return {
        ok: false,
        pluginId,
        written,
        error: bundled.error === 'bundled_pack_missing' ? `${ghErr} (GitHub-Pack leer — Image-ZIP fehlt)` : ghErr,
      }
    }
  }

  if (!written.includes('plugin.json')) {
    return { ok: false, pluginId, written, error: 'missing_plugin_json' }
  }

  const fromBundled = missingFromGitHub.length > 0
  return {
    ok: true,
    pluginId,
    written,
    ...(fromBundled ? { source: 'bundled_pack' as const } : {}),
  }
}

/** All built-in manifests still shipped in the image (for store list + bundled install). */
export function readImagePluginCatalogEntries(): GitHubPluginIndexEntry[] {
  const root = getBuiltinPluginsRoot()
  if (!fs.existsSync(root)) return []
  const out: GitHubPluginIndexEntry[] = []
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || PLUGIN_SCAN_SKIP_DIRS.has(name.name)) continue
    if (!fs.existsSync(path.join(root, name.name, 'index.tsx'))) continue
    const m = readPluginMetaFromDir(path.join(root, name.name), name.name, 'builtin')
    if (!m) continue
    const files = ['plugin.json', 'widget.js']
    if (fs.existsSync(path.join(root, name.name, 'server.ts'))) files.push('server.js')
    out.push({ ...m, files })
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

export async function listRemoteCatalogWithInstallState(): Promise<{
  configured: boolean
  indexUrl: string | null
  available: (GitHubPluginIndexEntry & { installed: boolean })[]
}> {
  const cfg = getGitHubPluginConfig()
  if (!cfg) {
    return { configured: false, indexUrl: null, available: [] }
  }
  const index = await fetchGitHubPluginIndex()
  const installed = new Set(listInstalledVolumePluginIds())
  const byId = new Map<string, GitHubPluginIndexEntry & { installed: boolean }>()
  for (const p of index?.plugins ?? []) {
    byId.set(p.id, { ...p, installed: installed.has(p.id) })
  }
  for (const p of readBundledPackCatalogEntries()) {
    if (!byId.has(p.id)) {
      byId.set(p.id, { ...p, installed: installed.has(p.id) })
    }
  }
  for (const p of readImagePluginCatalogEntries()) {
    if (!byId.has(p.id)) {
      byId.set(p.id, { ...p, installed: installed.has(p.id) })
    }
  }
  const available = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id))
  return {
    configured: true,
    indexUrl: githubRawUrl(cfg.indexPath),
    available,
  }
}

export function parseManifestFromGitHubEntry(entry: GitHubPluginIndexEntry): PluginManifest | null {
  const category = entry.category as PluginCategory
  if (!VALID_CATEGORIES.has(category)) return null
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    version: entry.version,
    author: entry.author,
    category,
    icon: entry.icon,
    iconUrl: entry.iconUrl,
    configSchema: entry.configSchema,
    defaultLayout: entry.defaultLayout,
    stackedExtraH: entry.stackedExtraH,
    source: 'custom',
  }
}
