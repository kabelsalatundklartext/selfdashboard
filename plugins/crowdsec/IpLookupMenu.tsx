'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FeedItem } from '@/lib/crowdsecMetrics'
import { FLAG } from './constants'
import { IP_LOOKUP_LINKS } from './ipLookup'

type Props = {
  item: FeedItem
  de: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
}

export function IpLookupMenu({ item, de, anchorEl, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!anchorEl || !menuRef.current) return
    const rect = anchorEl.getBoundingClientRect()
    const mw = menuRef.current.offsetWidth || 165
    const mh = menuRef.current.offsetHeight || 260
    const vw = window.innerWidth
    const vh = window.innerHeight
    let x = rect.right + 8
    let y = rect.top - 8
    if (x + mw > vw - 10) x = rect.left - mw - 8
    if (x < 10) x = 10
    if (y + mh > vh - 10) y = vh - mh - 10
    if (y < 60) y = 60
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
  const cityStr = item.city?.trim() ? ` · ${item.city}` : ''

  const menu = (
    <div
      ref={menuRef}
      className="cs-ip-lookup-menu"
      role="menu"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cs-ip-lookup-title">
        {FLAG[cc] || '🌐'} {cc} · {item.ip}
        {cityStr}
      </div>
      {IP_LOOKUP_LINKS.map((link) => (
        <a
          key={link.id}
          className="cs-ip-lookup-item"
          href={link.href(item)}
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
        >
          <span className="cs-ip-lookup-icon" aria-hidden>
            {link.icon}
          </span>
          {link.label}
        </a>
      ))}
      <button type="button" className="cs-ip-lookup-close" onClick={onClose}>
        ✕ {de ? 'SCHLIESSEN' : 'CLOSE'}
      </button>
    </div>
  )

  if (typeof document === 'undefined') return menu
  return createPortal(menu, document.body)
}
