import fs from 'fs'
import path from 'path'
import { getCustomPluginsRoot, PLUGIN_SCAN_SKIP_DIRS } from '@/lib/pluginPaths'
import { parseManifestFromPath } from '@/lib/pluginScan'
export function listInstalledVolumePluginIds(): string[] {
  return listCustomPluginDirs().filter((id) => hasVolumeFile(id, 'plugin.json'))
}

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

/** Version from installed `plugin.json` on the volume. */
export function readInstalledPluginVersion(pluginId: string): string | null {
  const manifestPath = path.join(customPluginDir(pluginId), 'plugin.json')
  if (!fs.existsSync(manifestPath)) return null
  const m = parseManifestFromPath(manifestPath, 'custom')
  return m?.version ?? null
}

/** Custom `widget.js` replaces the built-in widget for this id (no image rebuild). */
export function getCustomWidgetOverrideIds(): string[] {
  return listCustomPluginDirs().filter((id) => hasVolumeFile(id, 'widget.js'))
}

/** Custom `server.js` / `server.mjs` — only loaded when `SELFDASHBOARD_VOLUME_PLUGIN_SERVER=1`. */
export function getCustomServerPluginIds(): string[] {
  return listCustomPluginDirs().filter(
    (id) => hasVolumeFile(id, 'server.js') || hasVolumeFile(id, 'server.mjs'),
  )
}
