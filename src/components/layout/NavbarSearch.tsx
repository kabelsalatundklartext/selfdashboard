'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical, Search } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import type { Locale } from '@/lib/i18n'
import { SEARCH_PROVIDER_LIST } from '@/lib/searchProviders'
import type { SearchProviderId } from '@/lib/searchProviders'

export function NavbarSearch({ locale, editMode }: { locale: Locale; editMode: boolean }) {
  const {
    navbarSearchProviders,
    navbarSearchLastProvider,
    setNavbarSearchLastProvider,
    navbarSearchWidthPx,
    setNavbarSearchWidthPx,
  } = useDashboardStore()

  const [q, setQ] = useState('')
  const resizing = useRef(false)

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

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return
      e.preventDefault()
      e.stopPropagation()
      resizing.current = true
      const startX = e.clientX
      const startW = navbarSearchWidthPx
      const prevUserSelect = document.body.style.userSelect
      document.body.style.userSelect = 'none'

      const onMove = (ev: MouseEvent) => {
        if (!resizing.current) return
        setNavbarSearchWidthPx(startW + (ev.clientX - startX))
      }
      const onUp = () => {
        resizing.current = false
        document.body.style.userSelect = prevUserSelect
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [editMode, navbarSearchWidthPx, setNavbarSearchWidthPx],
  )

  useEffect(() => {
    return () => {
      resizing.current = false
    }
  }, [])

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

  const bar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: 0,
        width: '100%',
        padding: '3px 6px 3px 8px',
        paddingRight: editMode ? '14px' : '6px',
        borderRadius: '10px',
        background: 'var(--surface-2)',
        border: editMode ? '1px dashed var(--accent)55' : '1px solid var(--border)',
        boxSizing: 'border-box',
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

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: `${navbarSearchWidthPx}px`,
        maxWidth: '100%',
        minWidth: 'min(100%, 200px)',
      }}
    >
      {bar}
      {editMode && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={locale === 'de' ? 'Suchleiste Breite' : 'Search bar width'}
          title={locale === 'de' ? 'Breite ziehen' : 'Drag to resize width'}
          onMouseDown={onResizeMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            borderRadius: '0 8px 8px 0',
            color: 'var(--accent)',
            background: 'linear-gradient(90deg, transparent, var(--accent)14)',
          }}
        >
          <GripVertical size={12} style={{ opacity: 0.85 }} />
        </div>
      )}
    </div>
  )
}
