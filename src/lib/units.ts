export type UnitSystem = 'auto' | 'metric' | 'imperial'
export type ResolvedUnitSystem = 'metric' | 'imperial'

/** Countries where Fahrenheit/mph are everyday units; everyone else defaults to metric. */
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM'])

/** `auto` derives from a BCP-47 locale's region (falls back to `navigator.language`, then metric). */
export function resolveUnitSystem(setting: UnitSystem, localeStr?: string): ResolvedUnitSystem {
  if (setting !== 'auto') return setting
  const loc = localeStr ?? (typeof navigator !== 'undefined' ? navigator.language : '')
  try {
    const region = new Intl.Locale(loc || 'en-US').maximize().region
    return region && IMPERIAL_REGIONS.has(region) ? 'imperial' : 'metric'
  } catch {
    return 'metric'
  }
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371
}
