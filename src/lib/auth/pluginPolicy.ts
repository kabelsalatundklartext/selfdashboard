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

const LEGACY_API_PLUGIN: Array<{ prefix: string; pluginId: string }> = [
  { prefix: '/api/adguard', pluginId: 'adguard' },
  { prefix: '/api/docker-containers', pluginId: 'docker' },
  { prefix: '/api/crowdsec', pluginId: 'crowdsec' },
  { prefix: '/api/fritzbox', pluginId: 'fritzbox' },
  { prefix: '/api/fritz-energy', pluginId: 'fritz-energy' },
  { prefix: '/api/pihole', pluginId: 'pihole' },
  { prefix: '/api/selfstream', pluginId: 'selfstream' },
  { prefix: '/api/weather', pluginId: 'weather' },
  { prefix: '/api/calendar', pluginId: 'calendar' },
  { prefix: '/api/mail', pluginId: 'mail' },
]

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

export function resolvePluginIdFromApiPath(pathname: string): string | null {
  const m = pathname.match(/^\/api\/plugins\/([a-z0-9][a-z0-9-]*)(?:\/|$)/)
  if (m) return m[1]
  for (const { prefix, pluginId } of LEGACY_API_PLUGIN) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return pluginId
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
