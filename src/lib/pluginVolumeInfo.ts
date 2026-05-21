import fs from 'fs'
import path from 'path'
import { getBuiltinPluginsRoot, getCustomPluginsRoot, PLUGIN_SCAN_SKIP_DIRS } from '@/lib/pluginPaths'
function listCustomPluginDirs(): string[] {
  const root = getCustomPluginsRoot()
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !PLUGIN_SCAN_SKIP_DIRS.has(d.name))
    .map((d) => d.name)
    .filter((id) => /^[a-z0-9][a-z0-9-]*$/.test(id))
}

export function customPluginDir(id: string): string {
  return path.join(getCustomPluginsRoot(), id)
}

export function hasVolumeFile(id: string, file: string): boolean {
  return fs.existsSync(path.join(customPluginDir(id), file))
}

/** Custom `widget.js` replaces the built-in widget for this id (no image rebuild). */
export function getCustomWidgetOverrideIds(): string[] {
  return listCustomPluginDirs().filter((id) => hasVolumeFile(id, 'widget.js'))
}

/** Custom `server.js` / `server.mjs` loaded at runtime for API gateway. */
export function getCustomServerPluginIds(): string[] {
  return listCustomPluginDirs().filter(
    (id) => hasVolumeFile(id, 'server.js') || hasVolumeFile(id, 'server.mjs'),
  )
}

export function seedCustomPluginManifests(): { copied: string[]; skipped: string[] } {
  const customRoot = getCustomPluginsRoot()
  fs.mkdirSync(customRoot, { recursive: true })
  const copied: string[] = []
  const skipped: string[] = []
  const builtinRoot = getBuiltinPluginsRoot()

  if (!fs.existsSync(builtinRoot)) return { copied, skipped }

  for (const name of fs.readdirSync(builtinRoot, { withFileTypes: true })) {
    if (!name.isDirectory() || PLUGIN_SCAN_SKIP_DIRS.has(name.name)) continue
    const src = path.join(builtinRoot, name.name, 'plugin.json')
    if (!fs.existsSync(src)) continue
    const destDir = path.join(customRoot, name.name)
    const dest = path.join(destDir, 'plugin.json')
    if (fs.existsSync(dest)) {
      skipped.push(name.name)
      continue
    }
    fs.mkdirSync(destDir, { recursive: true })
    fs.copyFileSync(src, dest)
    const templateRoot = path.join(builtinRoot, '_template')
    for (const [srcName, destName] of [
      ['widget.example.js', 'widget.js.example'],
      ['server.example.js', 'server.js.example'],
    ] as const) {
      const tSrc = path.join(templateRoot, srcName)
      const tDest = path.join(destDir, destName)
      if (fs.existsSync(tSrc) && !fs.existsSync(tDest)) fs.copyFileSync(tSrc, tDest)
    }
    copied.push(name.name)
  }

  return { copied, skipped }
}
