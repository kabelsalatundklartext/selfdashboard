import 'server-only'
import { readFile } from 'fs/promises'
import { getAuthDb } from '@/lib/auth/db'
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/auth/password'
import { userDashboardPath } from '@/lib/auth/paths'
import { getUserById } from '@/lib/auth/users'
import {
  pickPersistedDashboardState,
  validateDashboardStatePersisted,
  type DashboardStatePersisted,
} from '@/lib/dashboardStatePayload'

export const KIOSK_COOKIE = 'sd_kiosk'
const SETTINGS_KEY = 'kiosk_config'

export type KioskConfig = {
  enabled: boolean
  dashboardId: string
  idleSeconds: number
  passwordHash: string | null
  ownerUserId: string
}

type StoredKioskConfig = {
  enabled?: boolean
  dashboardId?: string
  idleSeconds?: number
  passwordHash?: string | null
  ownerUserId?: string
}

function clampIdleSeconds(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 5
  return Math.min(60, Math.max(3, n))
}

function defaultConfig(): KioskConfig {
  return {
    enabled: false,
    dashboardId: 'kiosk',
    idleSeconds: 5,
    passwordHash: null,
    ownerUserId: '',
  }
}

export function getKioskConfig(): KioskConfig {
  const row = getAuthDb().prepare('SELECT value FROM settings WHERE key = ?').get(SETTINGS_KEY) as
    | { value: string }
    | undefined
  if (!row?.value) return defaultConfig()
  try {
    const parsed = JSON.parse(row.value) as StoredKioskConfig
    return {
      enabled: parsed.enabled === true,
      dashboardId:
        typeof parsed.dashboardId === 'string' && parsed.dashboardId.trim()
          ? parsed.dashboardId.trim()
          : 'kiosk',
      idleSeconds: clampIdleSeconds(parsed.idleSeconds),
      passwordHash:
        typeof parsed.passwordHash === 'string' && parsed.passwordHash ? parsed.passwordHash : null,
      ownerUserId: typeof parsed.ownerUserId === 'string' ? parsed.ownerUserId : '',
    }
  } catch {
    return defaultConfig()
  }
}

export function saveKioskConfig(input: Partial<KioskConfig> & { ownerUserId: string }): KioskConfig {
  const current = getKioskConfig()
  const next: KioskConfig = {
    enabled: input.enabled ?? current.enabled,
    dashboardId: (input.dashboardId ?? current.dashboardId).trim() || 'kiosk',
    idleSeconds: clampIdleSeconds(input.idleSeconds ?? current.idleSeconds),
    passwordHash:
      input.passwordHash === null
        ? null
        : typeof input.passwordHash === 'string' && input.passwordHash
          ? input.passwordHash
          : current.passwordHash,
    ownerUserId: input.ownerUserId,
  }
  getAuthDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function setKioskPassword(password: string | null, ownerUserId: string): KioskConfig {
  if (password === null || password.trim() === '') {
    return saveKioskConfig({ ownerUserId, passwordHash: null })
  }
  const err = validatePasswordStrength(password)
  if (err) throw new Error(err)
  return saveKioskConfig({ ownerUserId, passwordHash: hashPassword(password) })
}

export function verifyKioskPassword(password: string): boolean {
  const cfg = getKioskConfig()
  if (!cfg.passwordHash) return true
  return verifyPassword(password, cfg.passwordHash)
}

export async function loadKioskDashboardBundle(): Promise<{
  config: KioskConfig
  state: DashboardStatePersisted | null
  pluginIds: string[]
}> {
  const config = getKioskConfig()
  if (!config.enabled || !config.ownerUserId) {
    return { config, state: null, pluginIds: [] }
  }
  const owner = getUserById(config.ownerUserId)
  if (!owner || owner.role !== 'admin') {
    return { config, state: null, pluginIds: [] }
  }
  try {
    const raw = await readFile(userDashboardPath(config.ownerUserId), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!validateDashboardStatePersisted(parsed)) {
      return { config, state: null, pluginIds: [] }
    }
    const picked = pickPersistedDashboardState(parsed)
    const dashboard = picked.dashboards.find((d) => d.id === config.dashboardId)
    if (!dashboard) return { config, state: null, pluginIds: [] }
    const pluginIds = dashboard.plugins.map((p) => p.pluginId)
    const state: DashboardStatePersisted = {
      ...picked,
      dashboards: [dashboard],
      activeDashboardId: dashboard.id,
      editMode: false,
      showDashboardTabs: false,
      kioskModeEnabled: true,
      kioskModeIdleSeconds: config.idleSeconds,
    }
    return { config, state, pluginIds }
  } catch {
    return { config, state: null, pluginIds: [] }
  }
}

export function buildKioskAccess(config: KioskConfig, pluginIds: string[]): {
  ownerUserId: string
  dashboardId: string
  pluginIds: string[]
} | null {
  if (!config.enabled || !config.ownerUserId) return null
  return {
    ownerUserId: config.ownerUserId,
    dashboardId: config.dashboardId,
    pluginIds,
  }
}
