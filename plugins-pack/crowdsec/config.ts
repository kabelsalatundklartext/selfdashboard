import { DEFAULT_LOOKUP_ENABLED, type LookupServiceId } from './ipLookup'
import { nearestDayPreset, nearestMaxAlerts } from './presets'

export interface CrowdsecConfig {
  dbPath: string
  daysBack: number
  refreshSeconds: number
  maxAlerts: number
  dockerUnban: boolean
  crowdsecContainer: string
  confirmUnban: boolean
  showCountriesList: boolean
  lookupEnabled: Record<LookupServiceId, boolean>
}

function cfgBool(v: unknown, fallback: boolean): boolean {
  if (v === undefined || v === null || v === '') return fallback
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  return fallback
}

function cfgNum(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

function cfgStr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

export function parseCrowdsecConfig(raw: Record<string, unknown>): CrowdsecConfig {
  const lookupRaw = raw.lookupEnabled
  const lookupEnabled = { ...DEFAULT_LOOKUP_ENABLED }
  if (lookupRaw && typeof lookupRaw === 'object' && !Array.isArray(lookupRaw)) {
    for (const id of Object.keys(DEFAULT_LOOKUP_ENABLED) as LookupServiceId[]) {
      lookupEnabled[id] = cfgBool((lookupRaw as Record<string, unknown>)[id], DEFAULT_LOOKUP_ENABLED[id])
    }
  }
  return {
    dbPath: cfgStr(raw.dbPath, '/crowdsec-data/crowdsec.db'),
    daysBack: nearestDayPreset(cfgNum(raw.daysBack, 30)),
    refreshSeconds: Math.min(600, Math.max(5, cfgNum(raw.refreshSeconds, 30))),
    maxAlerts: nearestMaxAlerts(cfgNum(raw.maxAlerts, 500)),
    dockerUnban: cfgBool(raw.dockerUnban, false),
    crowdsecContainer: cfgStr(raw.crowdsecContainer, 'crowdsec'),
    confirmUnban: cfgBool(raw.confirmUnban, true),
    showCountriesList: cfgBool(raw.showCountriesList, true),
    lookupEnabled,
  }
}
