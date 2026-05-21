import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import { listInstalledVolumePluginIds } from '@/lib/pluginVolumeInfo'

const PACK_CANDIDATES = [
  process.env.SELFDASHBOARD_PLUGIN_PACK_ZIP?.trim(),
  '/app/plugin-pack/default-plugins.zip',
  path.join(process.cwd(), 'plugin-pack', 'default-plugins.zip'),
].filter(Boolean) as string[]

function countVolumePlugins(): number {
  return listInstalledVolumePluginIds().length
}

function safeExtractZip(zipPath: string, destRoot: string): void {
  const absZip = path.resolve(zipPath)
  const absDest = path.resolve(destRoot)
  if (!fs.existsSync(absZip)) throw new Error(`zip_not_found:${absZip}`)
  fs.mkdirSync(absDest, { recursive: true })
  try {
    execFileSync('unzip', ['-o', absZip, '-d', absDest], { stdio: 'pipe' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`unzip_failed:${msg}`)
  }
}

/** Unzip default plugin pack into custom root when volume has no plugins yet. */
export function ensureDefaultPluginsOnVolume(): { extracted: boolean; zip?: string; pluginCount: number } {
  const root = getCustomPluginsRoot()
  fs.mkdirSync(root, { recursive: true })
  const before = countVolumePlugins()
  if (before > 0) {
    return { extracted: false, pluginCount: before }
  }

  for (const zip of PACK_CANDIDATES) {
    if (!zip || !fs.existsSync(zip)) continue
    safeExtractZip(zip, root)
    const after = countVolumePlugins()
    console.info(`[SelfDashboard] Extracted default plugin pack (${after} plugins) from ${zip}`)
    return { extracted: true, zip, pluginCount: after }
  }

  console.warn(
    '[SelfDashboard] No plugins on volume and no default-plugins.zip — use Plugin Store → fill folder, upload ZIP, or mount a plugin pack.',
  )
  return { extracted: false, pluginCount: 0 }
}
