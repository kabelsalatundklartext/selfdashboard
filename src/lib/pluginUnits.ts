'use client'

import { useDashboardStore } from '@/lib/store'
import { resolveUnitSystem, type ResolvedUnitSystem, type UnitSystem } from '@/lib/units'

/** Global unit setting plus the resolved metric/imperial value widgets should format with. */
export function usePluginUnitSystem(): { unitSystem: UnitSystem; resolved: ResolvedUnitSystem } {
  const unitSystem = useDashboardStore((s) => s.unitSystem) as UnitSystem
  return { unitSystem, resolved: resolveUnitSystem(unitSystem) }
}
