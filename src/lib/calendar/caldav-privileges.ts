/**
 * Detect whether a CalDAV collection accepts writes (WEB.DE often marks
 * Geburtstage / "web" as read-only but omits DAV privileges in discovery).
 */

export function heuristicCalendarReadOnly(name: string, url: string): boolean {
  const n = name.toLowerCase().trim()
  const u = url.toLowerCase()
  const blob = `${n} ${u}`
  if (/geburt|birth|feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) {
    return true
  }
  // WEB.DE begenda: collection named "web" is usually the portal mirror, not the writable inbox.
  if ((u.includes('web.de') || u.includes('begenda')) && (n === 'web' || n === 'web.de')) {
    return true
  }
  return false
}

type PropfindClient = {
  propfind: (params: {
    url: string
    props: Record<string, unknown>
    depth?: string
  }) => Promise<Array<{ href?: string; props?: Record<string, unknown> }>>
}

/** PROPFIND current-user-privilege-set — returns false when only read is granted. */
export async function caldavHasWritePrivilege(
  client: PropfindClient,
  calendarUrl: string,
): Promise<boolean> {
  try {
    const responses = await client.propfind({
      url: calendarUrl,
      props: {
        'current-user-privilege-set': {
          privilege: {},
        },
      },
      depth: '0',
    })
    const match =
      responses.find(r => r.href && (r.href === calendarUrl || calendarUrl.startsWith(r.href))) ??
      responses[0]
    const props = match?.props
    if (!props) return true

    const blob = JSON.stringify(props).toLowerCase()
    if (/write-content|write-properties|write|\bbind\b/.test(blob)) return true
    if (/\bread\b/.test(blob) && !/write/.test(blob)) return false
    return true
  } catch {
    return true
  }
}

export async function resolveCalendarReadOnly(
  client: PropfindClient,
  name: string,
  url: string,
): Promise<boolean> {
  if (heuristicCalendarReadOnly(name, url)) return true
  return !(await caldavHasWritePrivilege(client, url))
}

export function formatCalDavPushError(calendarName: string, uid: string, msg: string): string {
  if (msg.includes('403')) {
    return `Kalender „${calendarName}“: kein Schreibzugriff (HTTP 403). Bei WEB.DE „Mein Kalender“ wählen, nicht „web“ oder „Geburtstage“.`
  }
  return `${calendarName}: ${msg}`
}
