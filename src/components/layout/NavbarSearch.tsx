'use client'

import { useCallback, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import type { Locale } from '@/lib/i18n'
import { SEARCH_PROVIDER_LIST } from '@/lib/searchProviders'
import type { SearchProviderId } from '@/lib/searchProviders'

export function NavbarSearch({ locale }: { locale: Locale }) {
  const {
    navbarSearchProviders,
    navbarSearchLastProvider,
    setNavbarSearchLastProvider,
  } = useDashboardStore()

  const [q, setQ] = useState('')

  const enabledDefs = useMemo(
    () => SEARCH_PROVIDER_LIST.filter((p) => navbarSearchProviders[p.id]),
    [navbarSearchProviders],
  )

  const activeId: SearchProviderId = useMemo(() => {
    if (navbarSearchProviders[navbarSearchLastProvider]) return navbarSearchLastProvider
    return enabledDefs[0]?.id ?? 'duckduckgo'
  }, [navbarSearchLastProvider, navbarSearchProviders, enabledDefs])

  const runSearch = useCallback(() => {
    const term = q.trim()
    if (!term) return
    const def = SEARCH_PROVIDER_LIST.find((p) => p.id === activeId)
    if (!def || !navbarSearchProviders[def.id]) return
    window.open(def.buildUrl(term), '_blank', 'noopener,noreferrer')
  }, [q, activeId, navbarSearchProviders])

  if (enabledDefs.length === 0) return null

  const pill = (id: SearchProviderId) => {
    const def = SEARCH_PROVIDER_LIST.find((p) => p.id === id)
    if (!def) return null
    const on = activeId === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setNavbarSearchLastProvider(id)}
        style={{
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: on ? 600 : 500,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          background: on ? 'var(--accent)' : 'transparent',
          color: on ? '#fff' : 'var(--text-muted)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {def.label[locale]}
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: 0,
        maxWidth: 'min(420px, 100vw - 200px)',
        padding: '3px 6px 3px 8px',
        borderRadius: '10px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, overflowX: 'auto' }}>
        {enabledDefs.map((d) => pill(d.id))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            runSearch()
          }
        }}
        placeholder={locale === 'de' ? 'Suchen…' : 'Search…'}
        aria-label={locale === 'de' ? 'Websuche' : 'Web search'}
        style={{
          flex: 1,
          minWidth: '80px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text)',
          fontSize: '13px',
          outline: 'none',
          padding: '4px 4px',
        }}
      />
    </div>
  )
}
