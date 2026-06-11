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

const MAX_PACK_ENTRIES = 5000

/**
 * Reject zip-slip before extracting: any entry that is absolute or escapes the
 * destination via `..` would let `unzip -o` write outside destRoot. We validate
 * the full listing first and only then extract.
 */
function assertContainedEntries(absZip: string, absDest: string): void {
  const listOut = execFileSync('unzip', ['-Z1', absZip], { encoding: 'utf8' })
  const entries = listOut
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (entries.length > MAX_PACK_ENTRIES) {
    throw new Error('pack_too_many_entries')
  }
  const prefix = absDest.endsWith(path.sep) ? absDest : absDest + path.sep
  for (const entry of entries) {
    if (path.isAbsolute(entry) || /^[a-zA-Z]:/.test(entry)) {
      throw new Error(`zip_slip:${entry}`)
    }
    const resolved = path.resolve(absDest, entry)
    if (resolved !== absDest && !resolved.startsWith(prefix)) {
      throw new Error(`zip_slip:${entry}`)
    }
  }
}

function safeExtractZip(zipPath: string, destRoot: string): void {
  const absZip = path.resolve(zipPath)
  const absDest = path.resolve(destRoot)
  if (!fs.existsSync(absZip)) throw new Error(`zip_not_found:${absZip}`)
  fs.mkdirSync(absDest, { recursive: true })
  assertContainedEntries(absZip, absDest)
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
