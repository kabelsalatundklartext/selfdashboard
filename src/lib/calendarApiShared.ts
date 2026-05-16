/** Bekannte SSRF-Ziele blocken; private RFC1918 bleibt erlaubt (Synology, LAN). */
export const CALENDAR_BLOCKED_HOSTNAMES = new Set(
  ['metadata.google.internal', 'metadata.goog', '169.254.169.254', 'localhost'].map((h) => h.toLowerCase()),
)

export const CALENDAR_FETCH_TIMEOUT_MS = 25_000
export const CALENDAR_MAX_ICS_BYTES = 4 * 1024 * 1024

export function normalizeCalendarHttpUrl(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  const host = u.hostname.toLowerCase()
  if (CALENDAR_BLOCKED_HOSTNAMES.has(host)) throw new Error('blocked_host')
  if (host.endsWith('.localhost')) throw new Error('blocked_host')
  return u
}

/** Entfernt Userinfo aus der URL und liefert sie separat (für Basic-Auth-Header). */
export function splitUrlBasicAuth(url: URL): { href: string; urlUser: string; urlPass: string } {
  const urlUser = url.username ? decodeURIComponent(url.username) : ''
  const urlPass = url.password ? decodeURIComponent(url.password) : ''
  const u = new URL(url.toString())
  u.username = ''
  u.password = ''
  return { href: normalizeCalDavHref(u.toString()), urlUser, urlPass }
}

/** Doppelte Schrägstriche im Pfad bereinigen (z. B. …/calendars//calendar). */
export function normalizeCalDavHref(href: string): string {
  const u = new URL(href)
  u.pathname = u.pathname.replace(/\/{2,}/g, '/')
  return u.toString()
}

export function parseCalendarWindow(body: Record<string, unknown>): { start: Date; end: Date } {
  const now = new Date()
  const defStart = new Date(now)
  defStart.setDate(defStart.getDate() - 14)
  defStart.setHours(0, 0, 0, 0)
  const defEnd = new Date(now)
  defEnd.setDate(defEnd.getDate() + 180)
  defEnd.setHours(23, 59, 59, 999)

  const ws = typeof body.windowStart === 'string' ? Date.parse(body.windowStart) : NaN
  const we = typeof body.windowEnd === 'string' ? Date.parse(body.windowEnd) : NaN
  const start = Number.isFinite(ws) ? new Date(ws) : defStart
  const end = Number.isFinite(we) ? new Date(we) : defEnd
  if (!(start < end)) throw new Error('invalid_window')
  const maxSpan = 400 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > maxSpan) throw new Error('window_too_large')
  return { start, end }
}
