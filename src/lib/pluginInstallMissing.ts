import { readFile } from 'fs/promises'
import { join } from 'path'

import { dataDir } from '@/lib/dataDir'
import { validateDashboardStatePersisted } from '@/lib/dashboardStatePayload'
import { installPluginFromGitHub, getGitHubPluginConfig } from '@/lib/pluginGitHub'
import { hasVolumeFile, listInstalledVolumePluginIds } from '@/lib/pluginVolumeInfo'

export function collectPluginIdsFromDashboardState(dashboards: { plugins: { pluginId: string }[] }[]): string[] {
  const ids = new Set<string>()
  for (const d of dashboards) {
    for (const p of d.plugins) {
      const id = String(p.pluginId ?? '').trim()
      if (id) ids.add(id)
    }
  }
  return [...ids].sort()
}

export async function readDashboardPluginIds(): Promise<string[]> {
  try {
    const raw = await readFile(join(dataDir(), 'dashboard.json'), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!validateDashboardStatePersisted(parsed)) return []
    return collectPluginIdsFromDashboardState(parsed.dashboards)
  } catch {
    return []
  }
}

/** Plugin IDs used on dashboards but without `widget.js` on the volume. */
export async function listMissingDashboardPlugins(): Promise<{
  configured: boolean
  required: string[]
  missing: string[]
}> {
  const cfg = getGitHubPluginConfig()
  const required = await readDashboardPluginIds()
  if (!cfg) {
    return { configured: false, required, missing: required }
  }
  const missing = required.filter((id) => !hasVolumeFile(id, 'widget.js'))
  return { configured: true, required, missing }
}

export async function installMissingDashboardPlugins(pluginIds?: string[]): Promise<{
  ok: boolean
  installed: string[]
  failed: { id: string; error?: string }[]
  hint?: string
}> {
  const cfg = getGitHubPluginConfig()
  if (!cfg) {
    return { ok: false, installed: [], failed: [], hint: 'github_not_configured' }
  }

  const toInstall =
    pluginIds?.length && pluginIds.length > 0
      ? pluginIds
      : (await listMissingDashboardPlugins()).missing

  const installed: string[] = []
  const failed: { id: string; error?: string }[] = []

  for (const id of toInstall) {
    if (hasVolumeFile(id, 'widget.js')) {
      installed.push(id)
      continue
    }
    const r = await installPluginFromGitHub(id)
    if (r.ok) installed.push(id)
    else failed.push({ id, error: r.error })
  }

  return {
    ok: failed.length === 0,
    installed,
    failed,
    hint:
      installed.length > 0
        ? 'Strg+F5 (Hard-Reload), damit alle widget.js geladen werden.'
        : undefined,
  }
}

export function listVolumePluginIdsWithoutWidget(): string[] {
  return listInstalledVolumePluginIds().filter((id) => !hasVolumeFile(id, 'widget.js'))
}
