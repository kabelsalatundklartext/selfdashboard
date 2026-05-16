'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CrowdsecFeedItem } from '@/lib/crowdsecMetrics'
import { FLAG } from './constants'
import type { LookupService } from './ipLookup'

type Props = {
  item: CrowdsecFeedItem
  de: boolean
  anchorEl: HTMLElement | null
  services: LookupService[]
  onClose: () => void
}

export function IpLookupMenu({ item, de, anchorEl, services, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!anchorEl || !menuRef.current) return
    const rect = anchorEl.getBoundingClientRect()
    const mw = menuRef.current.offsetWidth || 165
    const mh = menuRef.current.offsetHeight || 260
    let x = rect.left - mw - 8
    let y = rect.top - 8
    if (x < 10) x = rect.right + 8
    if (x + mw > window.innerWidth - 10) x = window.innerWidth - mw - 10
    if (y + mh > window.innerHeight - 10) y = window.innerHeight - mh - 10
    if (y < 10) y = 10
    setPos({ left: x, top: y })
  }, [anchorEl, item.ip])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t)) return
      if (anchorEl?.contains(t)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick, true)
    }
  }, [anchorEl, onClose])

  const cc = item.country?.toUpperCase() || '??'

  const menu = (
    <div
      ref={menuRef}
      className="cs-wl-menu"
      role="menu"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cs-wl-menu-title">
        {FLAG[cc] || '🌐'} {cc} · {item.ip}
        {item.city ? ` · ${item.city}` : ''}
      </div>
      {services.map((s) => (
        <a
          key={s.id}
          className="cs-wl-menu-item"
          href={s.href(item)}
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
        >
          <span className="cs-wl-menu-icon" aria-hidden>
            {s.icon}
          </span>
          {s.label}
        </a>
      ))}
      <button type="button" className="cs-wl-menu-close" onClick={onClose}>
        ✕ {de ? 'SCHLIESSEN' : 'CLOSE'}
      </button>
    </div>
  )

  if (typeof document === 'undefined') return menu
  return createPortal(menu, document.body)
}
