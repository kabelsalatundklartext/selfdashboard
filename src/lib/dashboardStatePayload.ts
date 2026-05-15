import type { Dashboard, ThemeId } from '@/types'
import type { Locale } from '@/lib/i18n'
import type { SearchProviderId } from '@/lib/searchProviders'

const SEARCH_IDS: SearchProviderId[] = [
  'google',
  'duckduckgo',
  'bing',
  'brave',
  'ecosia',
  'wikipedia-de',
  'wikipedia-en',
]

/** Shape stored in `/app/data/dashboard.json` and in zustand `partialize` (browser localStorage cache). */
export type DashboardStatePersisted = {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: Locale
  editMode: boolean
  showDashboardTabs: boolean
  navbarStyle: 'icon-text' | 'icon-only' | 'text-only'
  dashboardZoom: number
  gridGap: number
  gridPadding: number
  navbarSearchEnabled: boolean
  navbarSearchPosition: 'left' | 'center' | 'right'
  navbarSearchProviders: Record<string, boolean>
  navbarSearchLastProvider: SearchProviderId
  navbarSearchWidthPx: number
}

const THEMES: ThemeId[] = ['dark', 'light', 'nord', 'catppuccin', 'dracula', 'solarized']

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isThemeId(x: unknown): x is ThemeId {
  return typeof x === 'string' && (THEMES as readonly string[]).includes(x)
}

function isLocale(x: unknown): x is Locale {
  return x === 'en' || x === 'de'
}

function validateWidgetLayout(x: unknown): boolean {
  if (!isRecord(x)) return false
  const nx = Number(x.x)
  const ny = Number(x.y)
  const nw = Number(x.w)
  const nh = Number(x.h)
  if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nw) || !Number.isFinite(nh)) return false
  if (nw <= 0 || nh <= 0) return false
  return true
}

const LAYOUT_NUM_KEYS = ['x', 'y', 'w', 'h', 'minW', 'minH', 'maxW', 'maxH'] as const

/** optionale Bruchstücke von WidgetLayout (API / Persistenz) */
function validatePartialWidgetLayout(x: unknown): boolean {
  if (x === undefined) return true
  if (!isRecord(x)) return false
  for (const k of LAYOUT_NUM_KEYS) {
    if (!(k in x)) continue
    const n = Number(x[k])
    if (!Number.isFinite(n)) return false
    if ((k === 'w' || k === 'h' || k === 'minW' || k === 'minH') && n <= 0) return false
  }
  for (const key of Object.keys(x)) {
    if (!LAYOUT_NUM_KEYS.includes(key as (typeof LAYOUT_NUM_KEYS)[number])) return false
  }
  return true
}

function validatePluginInstance(x: unknown): boolean {
  if (!isRecord(x)) return false
  if (typeof x.instanceId !== 'string' || x.instanceId.length > 120) return false
  if (typeof x.pluginId !== 'string' || x.pluginId.length > 80) return false
  if (typeof x.config !== 'object' || x.config === null || Array.isArray(x.config)) return false
  if (!validateWidgetLayout(x.layout)) return false
  if (x.layoutPhone !== undefined && !validatePartialWidgetLayout(x.layoutPhone)) return false
  if (x.layoutTablet !== undefined && !validatePartialWidgetLayout(x.layoutTablet)) return false
  return true
}

function validateDashboard(x: unknown): boolean {
  if (!isRecord(x)) return false
  if (typeof x.id !== 'string' || x.id.length < 1 || x.id.length > 120) return false
  if (typeof x.name !== 'string' || x.name.length > 200) return false
  if (typeof x.icon !== 'string' || x.icon.length > 32) return false
  if (!isThemeId(x.theme)) return false
  if (!Array.isArray(x.plugins)) return false
  if (x.plugins.length > 200) return false
  for (const p of x.plugins) {
    if (!validatePluginInstance(p)) return false
  }
  if (x.customColors !== undefined && !isRecord(x.customColors)) return false
  if (x.customLogo !== undefined && typeof x.customLogo !== 'string') return false
  if (x.customIcon !== undefined && typeof x.customIcon !== 'string') return false
  if (x.hideTab !== undefined && typeof x.hideTab !== 'boolean') return false
  return true
}

/** Server / API body validation (size limits for homelab safety). */
export function validateDashboardStatePersisted(data: unknown): data is DashboardStatePersisted {
  if (!isRecord(data)) return false
  if (!Array.isArray(data.dashboards) || data.dashboards.length === 0 || data.dashboards.length > 40) return false
  const dashIds: string[] = []
  for (const d of data.dashboards) {
    if (!validateDashboard(d)) return false
    dashIds.push(String((d as Record<string, unknown>).id))
  }
  if (typeof data.activeDashboardId !== 'string' || data.activeDashboardId.length > 120) return false
  if (!dashIds.includes(data.activeDashboardId)) return false
  if (!isLocale(data.locale)) return false
  if (typeof data.editMode !== 'boolean') return false
  if (typeof data.showDashboardTabs !== 'boolean') return false
  if (data.navbarStyle !== 'icon-text' && data.navbarStyle !== 'icon-only' && data.navbarStyle !== 'text-only') {
    return false
  }
  if (typeof data.dashboardZoom !== 'number' || !Number.isFinite(data.dashboardZoom)) return false
  if (typeof data.gridGap !== 'number' || !Number.isFinite(data.gridGap)) return false
  if (typeof data.gridPadding !== 'number' || !Number.isFinite(data.gridPadding)) return false
  if (typeof data.navbarSearchEnabled !== 'boolean') return false
  if (data.navbarSearchPosition !== 'left' && data.navbarSearchPosition !== 'center' && data.navbarSearchPosition !== 'right') {
    return false
  }
  if (!isRecord(data.navbarSearchProviders)) return false
  for (const [k, v] of Object.entries(data.navbarSearchProviders)) {
    if (k.length > 40 || typeof v !== 'boolean') return false
  }
  if (
    typeof data.navbarSearchLastProvider !== 'string' ||
    data.navbarSearchLastProvider.length > 40 ||
    !SEARCH_IDS.includes(data.navbarSearchLastProvider as SearchProviderId)
  ) {
    return false
  }
  if (typeof data.navbarSearchWidthPx !== 'number' || !Number.isFinite(data.navbarSearchWidthPx)) return false
  return true
}

export function pickPersistedDashboardState(s: DashboardStatePersisted): DashboardStatePersisted {
  return {
    dashboards: s.dashboards,
    activeDashboardId: s.activeDashboardId,
    locale: s.locale,
    editMode: s.editMode,
    showDashboardTabs: s.showDashboardTabs,
    navbarStyle: s.navbarStyle,
    dashboardZoom: s.dashboardZoom,
    gridGap: s.gridGap,
    gridPadding: s.gridPadding,
    navbarSearchEnabled: s.navbarSearchEnabled,
    navbarSearchPosition: s.navbarSearchPosition,
    navbarSearchProviders: s.navbarSearchProviders,
    navbarSearchLastProvider: s.navbarSearchLastProvider,
    navbarSearchWidthPx: s.navbarSearchWidthPx,
  }
}
