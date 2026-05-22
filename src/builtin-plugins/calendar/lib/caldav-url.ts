/**
 * CalDAV URL helpers — WEB.DE / GMX users often paste a full calendar
 * collection URL; tsdav needs a stable server root for discovery.
 */

export function caldavObjectFilename(uid: string): string {
  // UIDs contain '@' (e.g. uuid@selfdashboard). Using that as a relative URL
  // segment breaks `new URL(filename, calendarUrl)` (parsed as userinfo).
  const stem = uid.includes('@') ? uid.split('@')[0]! : uid
  return `${stem.replace(/[^a-zA-Z0-9-]/g, '_')}.ics`
}

export function joinCollectionUrl(collectionUrl: string, filename: string): string {
  const base = collectionUrl.endsWith('/') ? collectionUrl : `${collectionUrl}/`
  return new URL(filename, base).href
}

/** Strip a trailing `/calendar` collection path so fetchCalendars uses the account home. */
export function normalizeCaldavServerUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  try {
    const u = new URL(trimmed)
    const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    if (parts.length && /^calendars?$/i.test(parts[parts.length - 1]!)) {
      parts.pop()
    }
    u.pathname = `${parts.length ? `/${parts.join('/')}` : ''}/`
    return u.href
  } catch {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }
}
