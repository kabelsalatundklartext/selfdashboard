'use client'

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'
import {
  pickPersistedDashboardState,
  validateDashboardStatePersisted,
  type DashboardStatePersisted,
} from '@/lib/dashboardStatePayload'
import {
  firstEnabledSearchTargetId,
  isSearchTargetEnabled,
  normalizeCustomSearchProviders,
  normalizeSearchProviders,
} from '@/lib/searchProviders'
import type { Dashboard } from '@/types'

function migrateLegacyPlugins(dashboards: Dashboard[]): Dashboard[] {
  const legacyIframe = 'crowdsec-threat-map'
  return dashboards.map((d) => ({
    ...d,
    plugins: d.plugins.map((p) => (p.pluginId === legacyIframe ? { ...p, pluginId: 'iframe' } : p)),
  }))
}

function normalizeServerPayload(parsed: DashboardStatePersisted): DashboardStatePersisted {
  const navbarSearchProviders = normalizeSearchProviders(parsed.navbarSearchProviders)
  const navbarSearchCustomProviders = normalizeCustomSearchProviders(parsed.navbarSearchCustomProviders)
  let navbarSearchLastProvider = String(parsed.navbarSearchLastProvider ?? '')
  if (!isSearchTargetEnabled(navbarSearchLastProvider, navbarSearchProviders, navbarSearchCustomProviders)) {
    navbarSearchLastProvider = firstEnabledSearchTargetId(navbarSearchProviders, navbarSearchCustomProviders)
  }
  return {
    ...parsed,
    dashboards: migrateLegacyPlugins(parsed.dashboards),
    navbarSearchProviders,
    navbarSearchCustomProviders,
    navbarSearchLastProvider,
  }
}

/**
 * After localStorage rehydration: load shared config from server (`/api/dashboard-state` → `dashboard.json` under `/app/data`).
 * Then debounce-save store changes to the server. Uses a per-effect `disposed` flag so React Strict Mode cleanups
 * do not permanently skip registering the save subscription (a bug that looked like “never saved”).
 */
export function DashboardStateSync() {
  const saveUnsubRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    let disposed = false

    const startSaveSubscription = () => {
      saveUnsubRef.current?.()
      let timer: ReturnType<typeof setTimeout> | undefined
      saveUnsubRef.current = useDashboardStore.subscribe(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (disposed) return
          const state = useDashboardStore.getState()
          const body = JSON.stringify(
            pickPersistedDashboardState(state as unknown as DashboardStatePersisted),
          )
          void fetch('/api/dashboard-state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body,
          }).catch(() => {})
        }, 800)
      })
    }

    const bootstrap = async () => {
      try {
        const r = await fetch('/api/dashboard-state', { cache: 'no-store' })
        if (disposed) return
        if (r.ok) {
          const raw: unknown = await r.json()
          if (validateDashboardStatePersisted(raw)) {
            const next = normalizeServerPayload(raw)
            useDashboardStore.setState(next)
          }
        }
      } catch {
        /* offline or first install */
      }
      if (!disposed) startSaveSubscription()
    }

    let unsubHydration: (() => void) | undefined
    if (useDashboardStore.persist.hasHydrated()) {
      void bootstrap()
    } else {
      unsubHydration = useDashboardStore.persist.onFinishHydration(() => {
        void bootstrap()
      })
    }

    return () => {
      disposed = true
      saveUnsubRef.current?.()
      saveUnsubRef.current = undefined
      unsubHydration?.()
    }
  }, [])

  return null
}
