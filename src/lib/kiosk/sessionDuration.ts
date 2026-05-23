export const KIOSK_SESSION_PRESETS = [
  { hours: 2, de: '2 Stunden', en: '2 hours' },
  { hours: 8, de: '8 Stunden', en: '8 hours' },
  { hours: 24, de: '24 Stunden (1 Tag)', en: '24 hours (1 day)' },
  { hours: 72, de: '3 Tage', en: '3 days' },
  { hours: 0, de: 'Unbegrenzt', en: 'Unlimited' },
] as const

/** Browser-friendly upper bound for “unlimited” kiosk sessions (~400 days). */
const UNLIMITED_SESSION_MS = 400 * 24 * 60 * 60 * 1000

export function clampKioskSessionHours(v: unknown): number {
  const allowed = KIOSK_SESSION_PRESETS.map((p) => p.hours)
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 24
  return allowed.includes(n as (typeof allowed)[number]) ? n : 24
}

export function kioskSessionTtlMs(sessionHours: number): number {
  if (sessionHours <= 0) return UNLIMITED_SESSION_MS
  return sessionHours * 60 * 60 * 1000
}

export function kioskSessionMaxAgeSec(sessionHours: number): number {
  return Math.floor(kioskSessionTtlMs(sessionHours) / 1000)
}
