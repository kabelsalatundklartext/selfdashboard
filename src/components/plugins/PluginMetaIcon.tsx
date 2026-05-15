'use client'

import type { CSSProperties } from 'react'
import type { PluginMeta } from '@/types'

type PickIcon = Pick<PluginMeta, 'icon' | 'iconUrl'>

interface Props {
  meta: PickIcon
  /** Outer box (px). */
  size?: number
  className?: string
  style?: CSSProperties
}

export function PluginMetaIcon({ meta, size = 40, className, style }: Props) {
  const box: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.max(8, Math.round(size * 0.25)),
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    ...style,
  }

  if (meta.iconUrl) {
    return (
      <div className={className} style={box}>
        <img
          src={meta.iconUrl}
          alt=""
          draggable={false}
          className="object-contain"
          style={{ maxWidth: '82%', maxHeight: '82%', width: 'auto', height: 'auto' }}
        />
      </div>
    )
  }

  const fontPx = Math.round(size * 0.52)
  return (
    <div className={className} style={{ ...box, fontSize: `${fontPx}px`, lineHeight: 1 }}>
      {meta.icon ?? '🧩'}
    </div>
  )
}
