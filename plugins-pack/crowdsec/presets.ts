export const DAY_RANGE_PRESETS = [
  { days: 1, de: '1 Tag', en: '1 day' },
  { days: 7, de: '7 Tage', en: '7 days' },
  { days: 30, de: '30 Tage', en: '30 days' },
  { days: 90, de: '90 Tage', en: '90 days' },
  { days: 365, de: '1 Jahr', en: '1 year' },
  { days: 730, de: '2 Jahre', en: '2 years' },
  { days: 1825, de: '5 Jahre', en: '5 years' },
  { days: 3650, de: '10 Jahre', en: '10 years' },
  { days: 0, de: 'Alle', en: 'All' },
] as const

export const MAX_ALERT_PRESETS = [
  { value: 500, de: '500', en: '500' },
  { value: 1000, de: '1.000', en: '1,000' },
  { value: 2000, de: '2.000', en: '2,000' },
  { value: 5000, de: '5.000', en: '5,000' },
  { value: 10000, de: '10.000', en: '10,000' },
  { value: 0, de: 'Alle', en: 'All' },
] as const

const DAY_PRESET_VALUES = DAY_RANGE_PRESETS.map((p) => p.days)

export function nearestDayPreset(days: number): number {
  if (DAY_PRESET_VALUES.some((d) => d === days)) return days
  if (days <= 0) return 0
  const positive = DAY_PRESET_VALUES.filter((d) => d > 0)
  return positive.reduce((best, d) => (Math.abs(d - days) < Math.abs(best - days) ? d : best), 30)
}

export function nearestMaxAlerts(value: number): number {
  const presets = MAX_ALERT_PRESETS.map((p) => p.value)
  if (presets.some((v) => v === value)) return value
  if (value <= 0) return 0
  return presets.reduce((best, v) => (v > 0 && Math.abs(v - value) < Math.abs(best - value) ? v : best), 2000)
}

export function alertRangeLabel(days: number, de: boolean): string {
  const hit = DAY_RANGE_PRESETS.find((p) => p.days === days)
  if (hit) return de ? hit.de : hit.en
  if (days <= 0) return de ? 'Alle' : 'All'
  if (days === 1) return de ? '1 Tag' : '1 day'
  return de ? `${days} Tage` : `${days} days`
}
