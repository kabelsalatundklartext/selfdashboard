import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import { customPluginDir } from '@/lib/pluginVolumeInfo'

const ALLOWED_FILES = new Set([
  'plugin.json',
  'widget.js',
  'widget.mjs',
  'widget.css',
  'server.js',
  'server.mjs',
  'server.cjs',
  'icon.png',
  'icon.svg',
  'icon.jpg',
  'icon.jpeg',
  'icon.webp',
  'readme.md',
  'README.md',
])

function isAllowedZipPluginFile(name: string): boolean {
  if (ALLOWED_FILES.has(name.toLowerCase())) return true
  return /^[a-z0-9][a-z0-9.-]*\.(svg|png|webp|jpe?g)$/i.test(name)
}

function isValidPluginId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(id)
}

function safeBasename(name: string): string | null {
  const base = path.basename(name)
  if (!base || base.includes('..') || base.startsWith('.')) return null
  return base
}

/** Extract uploaded zip; expects `<id>/plugin.json` or flat single-plugin zip. */
export function installPluginZipBuffer(buffer: Buffer): { installed: string[]; errors: string[] } {
  const tmp = path.join(getCustomPluginsRoot(), '.tmp-upload')
  const zipPath = path.join(tmp, 'upload.zip')
  fs.mkdirSync(tmp, { recursive: true })
  fs.writeFileSync(zipPath, buffer)

  const listOut = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
  const entries = listOut
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const installed = new Set<string>()
  const errors: string[] = []

  const pluginRoots = new Set<string>()
  for (const entry of entries) {
    const parts = entry.split('/').filter(Boolean)
    if (parts.length < 2) continue
    const id = parts[0]!
    if (!isValidPluginId(id)) continue
    if (parts[1] === 'plugin.json') pluginRoots.add(id)
  }

  if (pluginRoots.size === 0) {
    const hasRootManifest = entries.some((e) => e === 'plugin.json' || e.endsWith('/plugin.json'))
    if (!hasRootManifest) {
      errors.push('zip_must_contain_<pluginId>/plugin.json')
      fs.rmSync(tmp, { recursive: true, force: true })
      return { installed: [], errors }
    }
  }

  const destRoot = getCustomPluginsRoot()
  fs.mkdirSync(destRoot, { recursive: true })

  for (const entry of entries) {
    const parts = entry.split('/').filter(Boolean)
    if (parts.length === 0) continue
    let pluginId = parts[0]!
    let relParts = parts.slice(1)
    if (pluginRoots.size === 0 && parts[0] === 'plugin.json') {
      errors.push('single_plugin_zip_needs_folder_<id>/plugin.json')
      continue
    }
    if (!pluginRoots.has(pluginId)) continue
    const fileName = safeBasename(relParts.join('/') || '')
    if (!fileName || relParts.length !== 1) continue
    if (!isAllowedZipPluginFile(fileName)) {
      errors.push(`skipped:${entry}`)
      continue
    }
    const outDir = customPluginDir(pluginId)
    fs.mkdirSync(outDir, { recursive: true })
    const outFile = path.join(outDir, fileName)
    try {
      const data = execFileSync('unzip', ['-p', zipPath, entry], { maxBuffer: 32 * 1024 * 1024 })
      fs.writeFileSync(outFile, data)
      installed.add(pluginId)
    } catch (e) {
      errors.push(`extract_failed:${entry}`)
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true })
  return { installed: Array.from(installed), errors }
}
