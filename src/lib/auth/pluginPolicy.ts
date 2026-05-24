import 'server-only'
import { getAuthDb } from '@/lib/auth/db'
import { getRegisteredPluginServerIds } from '@/lib/pluginServerRegistry'
import { listInstalledVolumePluginIds } from '@/lib/pluginVolumeInfo'
import type { SessionInfo, UserRole } from '@/lib/auth/types'
import { isAuthDisabled } from '@/lib/auth/service'
import type { DashboardStatePersisted } from '@/lib/dashboardStatePayload'

/** Host/system access (socket, router, bans, …) — extra caution when granting. */
export const HOST_SYSTEM_PLUGIN_IDS = new Set([
  'docker',
  'unraid-docker',
  'crowdsec',
  'unraid',
  'fritzbox',
  'fritz-energy',
  'pihole',
  'adguard',
  'selfstream',
])

/** Shared backend for the whole instance (mail). Calendar is per-user with optional sharing. */
export const SHARED_INSTANCE_PLUGIN_IDS = new Set(['mail'])

/** @deprecated use getPluginGrantWarning() */
export const HIGH_RISK_PLUGIN_IDS = new Set([
  ...HOST_SYSTEM_PLUGIN_IDS,
  ...SHARED_INSTANCE_PLUGIN_IDS,
])

export type PluginGrantWarning = 'host' | 'shared'

export function getPluginGrantWarning(pluginId: string): PluginGrantWarning | null {
  if (HOST_SYSTEM_PLUGIN_IDS.has(pluginId)) return 'host'
  if (SHARED_INSTANCE_PLUGIN_IDS.has(pluginId)) return 'shared'
  return null
}

/** Built-in widgets without a registered server handler (still restrictable). */
const CLIENT_ONLY_PLUGIN_IDS = [
  'bookmarks',
  'clock',
  'emby',
  'iframe',
  'scratchpad',
] as const

function migratePluginGrantsTable() {
  getAuthDb().exec(`
    CREATE TABLE IF NOT EXISTS user_allowed_plugins (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id TEXT NOT NULL,
      PRIMARY KEY (user_id, plugin_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_allowed_plugins_user ON user_allowed_plugins(user_id);
  `)
}

export function ensurePluginGrantsSchema() {
  migratePluginGrantsTable()
}

export function listKnownPluginIds(): string[] {
  ensurePluginGrantsSchema()
  const ids = new Set<string>()
  for (const id of getRegisteredPluginServerIds()) ids.add(id)
  for (const id of listInstalledVolumePluginIds()) ids.add(id)
  for (const id of CLIENT_ONLY_PLUGIN_IDS) ids.add(id)
  return Array.from(ids).sort((a, b) => a.localeCompare(b))
}

export function getAllowedPluginIds(userId: string, role: UserRole): string[] | null {
  if (isAuthDisabled() || role === 'admin') return null
  ensurePluginGrantsSchema()
  const rows = getAuthDb()
    .prepare('SELECT plugin_id FROM user_allowed_plugins WHERE user_id = ? ORDER BY plugin_id')
    .all(userId) as { plugin_id: string }[]
  return rows.map((r) => r.plugin_id)
}

export function isPluginAllowed(userId: string, role: UserRole, pluginId: string): boolean {
  if (isAuthDisabled() || role === 'admin') return true
  const allowed = getAllowedPluginIds(userId, role)
  if (!allowed) return true
  return allowed.includes(pluginId)
}

export function isPluginAllowedForSession(session: SessionInfo, pluginId: string): boolean {
  return isPluginAllowed(session.userId, session.role, pluginId)
}

export function setAllowedPluginIds(userId: string, pluginIds: string[]): string[] {
  ensurePluginGrantsSchema()
  const normalized = Array.from(
    new Set(
      pluginIds
        .map((id) => id.trim().toLowerCase())
        .filter((id) => /^[a-z0-9][a-z0-9-]*$/.test(id)),
    ),
  ).sort()
  const db = getAuthDb()
  const tx = db.transaction((ids: string[]) => {
    db.prepare('DELETE FROM user_allowed_plugins WHERE user_id = ?').run(userId)
    const ins = db.prepare(
      'INSERT INTO user_allowed_plugins (user_id, plugin_id) VALUES (?, ?)',
    )
    for (const pluginId of ids) ins.run(userId, pluginId)
  })
  tx(normalized)
  return normalized
}

/** First path segment under `/api/plugins/` that is not a plugin id (store, volume, …). */
export const RESERVED_PLUGINS_API_SEGMENTS = new Set([
  'volume',
  'remote-catalog',
  'install-remote',
  'install-missing',
  'missing-dashboard',
  'ensure-widget',
  'reload',
  'seed-custom',
  'upload-zip',
  'uninstall',
  'custom-assets',
])

export function isReservedPluginApiSegment(segment: string): boolean {
  return RESERVED_PLUGINS_API_SEGMENTS.has(segment)
}

export function resolvePluginIdFromApiPath(pathname: string): string | null {
  if (pathname.startsWith('/api/plugins/custom-assets/')) {
    const m = pathname.match(/^\/api\/plugins\/custom-assets\/([a-z0-9][a-z0-9-]*)/)
    return m ? m[1] : null
  }

  const m = pathname.match(/^\/api\/plugins\/([a-z0-9][a-z0-9-]*)(?:\/|$)/)
  if (m) {
    const segment = m[1]
    if (RESERVED_PLUGINS_API_SEGMENTS.has(segment)) return null
    return segment
  }

  return null
}

export function filterDashboardStatePlugins(
  state: DashboardStatePersisted,
  userId: string,
  role: UserRole,
): DashboardStatePersisted {
  if (role === 'admin' || isAuthDisabled()) return state
  const allowed = new Set(getAllowedPluginIds(userId, role) ?? [])
  return {
    ...state,
    dashboards: state.dashboards.map((d) => ({
      ...d,
      plugins: d.plugins.filter((p) => allowed.has(p.pluginId)),
    })),
  }
}
