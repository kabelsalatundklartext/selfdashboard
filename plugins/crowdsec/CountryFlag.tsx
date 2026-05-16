'use client'

import { flagImageUrl, normalizeCountryCode } from './flags'

type Props = {
  code: string
  size?: number
  className?: string
  title?: string
}

export function CountryFlag({ code, size = 22, className = '', title }: Props) {
  const cc = normalizeCountryCode(code)
  const src = flagImageUrl(cc, size <= 20 ? 20 : 40)
  if (!src) {
    return (
      <span
        className={`cs-flag cs-flag-fallback ${className}`.trim()}
        style={{ width: size, height: Math.round(size * 0.75) }}
        title={title || '?'}
        aria-hidden
      >
        🌐
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className={`cs-flag ${className}`.trim()}
      title={title || cc}
      loading="lazy"
      decoding="async"
    />
  )
}
