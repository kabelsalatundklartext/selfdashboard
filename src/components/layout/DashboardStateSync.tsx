'use client'

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'
import {
  pickPersistedDashboardState,
  validateDashboardStatePersisted,
  type DashboardStatePersisted,
} from '@/lib/dashboardStatePayload'
import { firstEnabledProviderId, normalizeSearchProviders } from '@/lib/searchProviders'
import type { SearchProviderId } from '@/lib/searchProviders'
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
  let navbarSearchLastProvider = parsed.navbarSearchLastProvider as SearchProviderId
  if (!navbarSearchProviders[navbarSearchLastProvider]) {
    navbarSearchLastProvider = firstEnabledProviderId(navbarSearchProviders)
  }
  return {
    ...parsed,
    dashboards: migrateLegacyPlugins(parsed.dashboards),
    navbarSearchProviders,
    navbarSearchLastProvider,
  }
}

/**
 * After localStorage rehydration: load shared config from server (`/api/dashboard-state` → `data/dashboard.json` or `/app/data`).
 * Then debounce-save any store changes back to the server so all browsers stay in sync.
 */
export function DashboardStateSync() {
  const cancelled = useRef(false)
  const saveUnsubRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    cancelled.current = false

    const startSaveSubscription = () => {
      if (saveUnsubRef.current) saveUnsubRef.current()
      let timer: ReturnType<typeof setTimeout> | undefined
      saveUnsubRef.current = useDashboardStore.subscribe((state) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (cancelled.current) return
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

    const loadFromServer = async () => {
      try {
        const r = await fetch('/api/dashboard-state', { cache: 'no-store' })
        if (cancelled.current) return
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
      if (!cancelled.current) startSaveSubscription()
    }

    let unsubHydration: (() => void) | undefined
    if (useDashboardStore.persist.hasHydrated()) {
      void loadFromServer()
    } else {
      unsubHydration = useDashboardStore.persist.onFinishHydration(() => {
        void loadFromServer()
      })
    }

    return () => {
      cancelled.current = true
      saveUnsubRef.current?.()
      saveUnsubRef.current = undefined
      unsubHydration?.()
    }
  }, [])

  return null
}
