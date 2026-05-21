import fs from 'fs'
import { customPluginDir } from '@/lib/pluginVolumeInfo'

const PLUGIN_ID_RE = /^[a-z0-9][a-z0-9-]*$/

export function isValidPluginId(pluginId: string): boolean {
  return PLUGIN_ID_RE.test(pluginId.trim())
}

/** Remove plugin folder from volume (`/app/plugins/custom/<id>/`). */
export function uninstallPluginFromVolume(pluginId: string): {
  ok: boolean
  pluginId: string
  error?: string
} {
  const id = pluginId.trim()
  if (!id) return { ok: false, pluginId: id, error: 'missing_plugin_id' }
  if (!isValidPluginId(id)) return { ok: false, pluginId: id, error: 'invalid_plugin_id' }

  const dir = customPluginDir(id)
  if (!fs.existsSync(dir)) {
    return { ok: false, pluginId: id, error: 'plugin_not_installed' }
  }

  try {
    fs.rmSync(dir, { recursive: true, force: true })
    return { ok: true, pluginId: id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'uninstall_failed'
    return { ok: false, pluginId: id, error: msg }
  }
}
