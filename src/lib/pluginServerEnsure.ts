import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { installPluginFromGitHub } from '@/lib/pluginGitHub'
import { parseManifestFromPath } from '@/lib/pluginScan'
import { customPluginDir, hasVolumeFile } from '@/lib/pluginVolumeInfo'
import { getPluginServerHandler } from '@/lib/pluginServerRegistry'

export type EnsurePluginServerResult = {
  ok: boolean
  error?: string
  hint?: string
}

function manifestHasServer(pluginId: string): boolean {
  const manifestPath = `${customPluginDir(pluginId)}/plugin.json`
  const m = parseManifestFromPath(manifestPath, 'custom')
  return m?.hasServer === true
}

function hasServerFile(pluginId: string): boolean {
  return hasVolumeFile(pluginId, 'server.mjs') || hasVolumeFile(pluginId, 'server.js')
}

/**
 * Ensure an API plugin's server.mjs is on the volume and registered.
 * Volume-only plugins (e.g. tasks) have no image fallback.
 */
export async function ensurePluginServerHandler(pluginId: string): Promise<EnsurePluginServerResult> {
  if (getPluginServerHandler(pluginId)) return { ok: true }

  if (!hasVolumeFile(pluginId, 'plugin.json')) {
    return {
      ok: false,
      error: 'plugin_not_installed',
      hint: 'Plugin zuerst im Store installieren.',
    }
  }

  if (!manifestHasServer(pluginId) && !hasServerFile(pluginId)) {
    return {
      ok: false,
      error: 'plugin_not_found',
      hint: 'Dieses Plugin hat keine Server-API.',
    }
  }

  if (!hasServerFile(pluginId)) {
    const r = await installPluginFromGitHub(pluginId)
    if (!r.ok) {
      return {
        ok: false,
        error: r.error ?? 'install_failed',
        hint:
          r.hint ??
          'Plugin im Store aktualisieren — server.mjs fehlt (Maintainer: plugins-pack pushen).',
      }
    }
    if (!r.written.includes('server.mjs') && !r.written.includes('server.js')) {
      return {
        ok: false,
        error: 'plugin_server_missing',
        hint: 'server.mjs fehlt im Store — Plugin aktualisieren oder Maintainer kontaktieren.',
      }
    }
  }

  await reloadCustomPluginServers()

  if (getPluginServerHandler(pluginId)) return { ok: true }

  return {
    ok: false,
    error: 'plugin_server_load_failed',
    hint: 'server.mjs vorhanden, lädt aber nicht — Container-Log prüfen oder Plugin neu installieren.',
  }
}
