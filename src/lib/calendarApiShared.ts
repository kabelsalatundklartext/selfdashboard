/** Bekannte SSRF-Ziele blocken; private RFC1918 bleibt erlaubt (Synology, LAN). */
export const CALENDAR_BLOCKED_HOSTNAMES = new Set(
  ['metadata.google.internal', 'metadata.goog', '169.254.169.254', 'localhost'].map((h) => h.toLowerCase()),
)

export const CALENDAR_FETCH_TIMEOUT_MS = 25_000
export const CALENDAR_MAX_ICS_BYTES = 4 * 1024 * 1024

/** CardDAV = Kontakte (z. B. carddav.web.de), CalDAV = Kalender (caldav.web.de). */
export function isCardDavContactsHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'carddav.web.de' || h === 'carddav.gmx.net' || h.startsWith('carddav.')
}

/**
 * Häufige Tippfehler (WEB.DE/GMX: CardDAV-Host für Kalender, fehlender Pfad).
 * Gibt korrigierte URL und Liste der Änderungen zurück.
 */
export function fixCommonCalDavUrlMistakes(raw: string): { url: string; fixes: string[] } {
  const fixes: string[] = []
  let s = raw.trim()
  if (!s) return { url: s, fixes }

  if (/^carddav\.web\.de/i.test(s)) s = `https://${s}`
  if (/^carddav\.gmx\.net/i.test(s)) s = `https://${s}`
  if (/^caldav\.web\.de/i.test(s) && !/^https?:\/\//i.test(s)) s = `https://${s}`
  if (/^caldav\.gmx\.net/i.test(s) && !/^https?:\/\//i.test(s)) s = `https://${s}`

  if (/^https?:\/\/carddav\.web\.de/i.test(s)) {
    s = s.replace(/^https?:\/\/carddav\.web\.de/i, 'https://caldav.web.de')
    fixes.push('carddav.web.de→caldav.web.de')
  }
  if (/^https?:\/\/carddav\.gmx\.net/i.test(s)) {
    s = s.replace(/^https?:\/\/carddav\.gmx\.net/i, 'https://caldav.gmx.net')
    fixes.push('carddav.gmx.net→caldav.gmx.net')
  }

  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
    const u = new URL(withProto)
    const host = u.hostname.toLowerCase()

    if ((host === 'caldav.web.de' || host === 'caldav.gmx.net') && !/\/begenda\/dav\//i.test(u.pathname)) {
      const email = u.username && u.username.includes('@') ? decodeURIComponent(u.username) : ''
      if (email) {
        u.username = ''
        u.password = ''
        const domain = host.includes('gmx') ? 'gmx.net' : 'web.de'
        const addr = email.includes('@') ? email : `${email}@${domain}`
        u.pathname = `/begenda/dav/${addr}/calendar`
        fixes.push('begenda_path_from_username')
        s = u.toString()
      } else if (u.pathname === '/' || u.pathname === '') {
        fixes.push('missing_begenda_calendar_path')
      }
    }
  } catch {
    /* keep s */
  }

  return { url: s, fixes }
}

export function normalizeCalendarHttpUrl(raw: string): URL {
  const { url: fixed, fixes } = fixCommonCalDavUrlMistakes(raw)
  const s = fixed.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  const host = u.hostname.toLowerCase()
  if (isCardDavContactsHost(host)) throw new Error('wrong_dav_service')
  if (CALENDAR_BLOCKED_HOSTNAMES.has(host)) throw new Error('blocked_host')
  if (host.endsWith('.localhost')) throw new Error('blocked_host')
  if (
    fixes.includes('missing_begenda_calendar_path') &&
    (host === 'caldav.web.de' || host === 'caldav.gmx.net')
  ) {
    throw new Error('missing_begenda_path')
  }
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

/** WEB.DE/GMX Standard-Kalender-Collection (wie Thunderbird). */
export function buildBegendaCalendarUrl(
  usernameOrEmail: string,
  host: 'caldav.web.de' | 'caldav.gmx.net' = 'caldav.web.de',
): string {
  const u = usernameOrEmail.trim()
  if (!u) return `https://${host}/`
  const domain = host.includes('gmx') ? 'gmx.net' : 'web.de'
  const addr = u.includes('@') ? u : `${u}@${domain}`
  return `https://${host}/begenda/dav/${addr}/calendar`
}

/** E-Mail aus WEB.DE/GMX-CalDAV-Pfad, z. B. …/dav/nutzer@web.de/calendar */
export function emailFromBegendaCalDavPath(href: string): string | null {
  try {
    const path = new URL(href).pathname
    const m = path.match(/\/dav\/([^/]+)\/calendar\/?$/i)
    if (!m?.[1]) return null
    const decoded = decodeURIComponent(m[1].trim())
    return decoded.includes('@') ? decoded : null
  } catch {
    return null
  }
}

/**
 * WEB.DE/GMX: volle E-Mail als Benutzername (aus Feld oder CalDAV-URL).
 * Leerer Benutzername + E-Mail im Pfad → E-Mail aus URL übernehmen.
 */
export function normalizeCaldavUsername(username: string, calendarHref: string): string {
  const u = username.trim()
  const fromPath = emailFromBegendaCalDavPath(calendarHref)
  if (u.includes('@')) return u
  if (fromPath) return fromPath
  try {
    const host = new URL(calendarHref).hostname.toLowerCase()
    if ((host === 'caldav.web.de' || host.endsWith('.web.de')) && u) return `${u}@web.de`
    if ((host === 'caldav.gmx.net' || host.endsWith('.gmx.net')) && u) return `${u}@gmx.net`
  } catch {
    /* ignore */
  }
  return u
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
