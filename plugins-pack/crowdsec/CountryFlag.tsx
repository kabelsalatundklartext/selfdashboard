import { useState } from 'react'
import { countryCodeToEmoji, flagImageUrl, normalizeCountryCode } from './flags'

export function CountryFlag({
  code,
  size = 22,
  className = '',
  title,
}: {
  code: unknown
  size?: number
  className?: string
  title?: string
}) {
  const cc = normalizeCountryCode(code) || normalizeCountryCode(String(code).slice(0, 2))
  const emoji = countryCodeToEmoji(cc || code)
  const src = cc ? flagImageUrl(cc, size <= 20 ? 40 : 80) : ''
  const [imgOk, setImgOk] = useState(Boolean(src))

  if (!src || !imgOk) {
    return (
      <span
        className={`cs-flag cs-flag-emoji ${className}`.trim()}
        style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}
        title={title || cc || String(code)}
        aria-hidden
      >
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      className={`cs-flag ${className}`.trim()}
      title={title || cc}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImgOk(false)}
    />
  )
}
