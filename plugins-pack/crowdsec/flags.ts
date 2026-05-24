export function normalizeCountryCode(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (!s || s === '??' || s === 'XX' || s === 'UNKNOWN') return ''
  if (s.length === 2 && /^[A-Z]{2}$/.test(s)) return s
  return ''
}

export function countryCodeToEmoji(code: unknown): string {
  const cc = normalizeCountryCode(code)
  if (!cc || cc === '??') return '🌐'
  const A = 0x1f1e6
  return String.fromCodePoint(...[...cc].map((c) => A + c.toUpperCase().charCodeAt(0) - 65))
}

export function flagImageUrl(code: unknown, width = 40): string {
  const cc = normalizeCountryCode(code).toLowerCase()
  if (!cc) return ''
  return `https://flagcdn.com/w${width}/${cc}.png`
}
