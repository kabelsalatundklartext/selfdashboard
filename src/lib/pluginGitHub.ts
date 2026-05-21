import fs from 'fs'
import path from 'path'

import type { PluginManifest } from '@/types/pluginManifest'

import type { PluginCategory } from '@/types'

import { customPluginDir } from '@/lib/pluginVolumeInfo'

import { listInstalledVolumePluginIds, readInstalledPluginVersion } from '@/lib/pluginVolumeInfo'
import { isPluginUpdateAvailable } from '@/lib/pluginVersion'



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

/** Required for a successful install; others are copied only when present on GitHub. */
const REQUIRED_INSTALL_FILES = new Set(['plugin.json', 'widget.js'])



/** Install only from GitHub raw URLs (plugins-pack/<id>/ on branch beta). */

export async function installPluginFromGitHub(pluginId: string): Promise<{

  ok: boolean

  pluginId: string

  written: string[]

  error?: string

  hint?: string

  source?: 'github'

}> {

  const cfg = getGitHubPluginConfig()

  if (!cfg) return { ok: false, pluginId, written: [], error: 'github_not_configured' }



  const index = await fetchGitHubPluginIndex(true)

  const entry = index?.plugins.find((p) => p.id === pluginId)

  if (!entry) return { ok: false, pluginId, written: [], error: 'plugin_not_in_index' }



  const files = (entry.files ?? ['plugin.json', 'widget.js']).filter((f) => INSTALL_FILES.has(f))

  const destDir = customPluginDir(pluginId)

  fs.mkdirSync(destDir, { recursive: true })

  const written: string[] = []



  for (const file of files) {

    const rel = `${cfg.basePath}/${pluginId}/${file}`

    const url = githubRawUrl(rel)

    if (!url) {

      return { ok: false, pluginId, written, error: `github_url_missing:${file}` }

    }

    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {

      if (!REQUIRED_INSTALL_FILES.has(file)) {

        console.warn(`[SelfDashboard] Optional plugin file missing on GitHub (skipped): ${rel}`)

        continue

      }

      return {

        ok: false,

        pluginId,

        written,

        error: `fetch_failed:${file}:${res.status}`,

        hint: `Datei fehlt auf GitHub: ${cfg.owner}/${cfg.repo}/${cfg.ref}/${rel} — Maintainer muss plugins-pack pushen (npm run publish:plugin-pack).`,

      }

    }

    const buf = Buffer.from(await res.arrayBuffer())

    fs.writeFileSync(path.join(destDir, file), buf)

    written.push(file)

  }



  if (!written.includes('plugin.json')) {

    return { ok: false, pluginId, written, error: 'missing_plugin_json' }

  }

  if (!written.includes('widget.js')) {

    return { ok: false, pluginId, written, error: 'missing_widget_js' }

  }



  return { ok: true, pluginId, written, source: 'github' }

}



export type RemoteCatalogPlugin = GitHubPluginIndexEntry & {
  installed: boolean
  installedVersion: string | null
  updateAvailable: boolean
}

export async function listRemoteCatalogWithInstallState(): Promise<{

  configured: boolean

  indexUrl: string | null

  repository: string | null

  ref: string | null

  updatesCount: number

  available: RemoteCatalogPlugin[]

}> {

  const cfg = getGitHubPluginConfig()

  if (!cfg) {

    return { configured: false, indexUrl: null, repository: null, ref: null, updatesCount: 0, available: [] }

  }

  const index = await fetchGitHubPluginIndex()

  const installedIds = new Set(listInstalledVolumePluginIds())

  const available: RemoteCatalogPlugin[] = (index?.plugins ?? []).map((p) => {
    const installed = installedIds.has(p.id)
    const installedVersion = installed ? readInstalledPluginVersion(p.id) : null
    const remoteVersion = String(p.version ?? '0.0.0')
    const updateAvailable =
      installed && isPluginUpdateAvailable(installedVersion, remoteVersion)
    return {
      ...p,
      installed,
      installedVersion,
      updateAvailable,
    }
  })

  const updatesCount = available.filter((p) => p.updateAvailable).length

  return {

    configured: true,

    indexUrl: githubRawUrl(cfg.indexPath),

    repository: `${cfg.owner}/${cfg.repo}`,

    ref: cfg.ref,

    updatesCount,

    available,

  }

}

/** Re-install plugin files from GitHub (same as fresh install — overwrites volume files). */
export async function updatePluginFromGitHub(pluginId: string) {
  return installPluginFromGitHub(pluginId)
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


