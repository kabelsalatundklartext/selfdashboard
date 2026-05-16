'use client'

import { useState } from 'react'

const BRAND_LOGO_SRC = '/plugin-logos/crowdsec_breit.png'
const ICON_LOGO_SRC = '/plugin-logos/crowdsec.png'

function LogoFallback({ height }: { height: number }) {
  return (
    <svg height={height} width={height} viewBox="0 0 64 64" aria-hidden className="cs-logo-svg">
      <defs>
        <linearGradient id="cs-logo-grad-fb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eb3ff" />
          <stop offset="100%" stopColor="#2b7fd4" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="currentColor" fillOpacity="0.12" stroke="url(#cs-logo-grad-fb)" strokeWidth="2" />
      <path
        fill="url(#cs-logo-grad-fb)"
        d="M32 12c-8 6-18 7-18 7v14c0 12 8 20 18 23 10-3 18-11 18-23V19s-10-1-18-7zm0 8c3 2 8 3 12 3v11c0 8-5 14-12 16-7-2-12-8-12-16V23c4 0 9-1 12-3z"
      />
    </svg>
  )
}

type Props = {
  /** Square icon (plugin store uses meta.iconUrl separately). */
  size?: number
  /** Full wordmark with llamas — sidebar header. */
  variant?: 'icon' | 'brand'
}

/** CrowdSec logos: wide wordmark in widget, square icon elsewhere. */
export function CrowdsecLogo({ size = 28, variant = 'icon' }: Props) {
  const [failed, setFailed] = useState(false)
  const src = variant === 'brand' ? BRAND_LOGO_SRC : ICON_LOGO_SRC

  if (failed) {
    return <LogoFallback height={variant === 'brand' ? 32 : size} />
  }

  if (variant === 'brand') {
    return (
      <img
        src={src}
        alt="CrowdSec"
        className="cs-logo-img cs-logo-img-brand"
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="cs-logo-img"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
