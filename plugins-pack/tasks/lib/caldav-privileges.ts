import { createDAVClient } from 'tsdav'

type CaldavClient = Awaited<ReturnType<typeof createDAVClient>>

export function heuristicCalendarReadOnly(name: string, url: string): boolean {
  const n = name.toLowerCase().trim()
  const u = url.toLowerCase()
  const blob = `${n} ${u}`
  if (/feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) return true
  return false
}

export async function caldavHasWritePrivilege(client: CaldavClient, calendarUrl: string): Promise<boolean> {
  try {
    const responses = await client.propfind({
      url: calendarUrl,
      props: { 'current-user-privilege-set': { privilege: {} } },
      depth: '0',
    })
    const match =
      responses.find((r) => r.href && (r.href === calendarUrl || calendarUrl.startsWith(r.href))) ??
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
  client: CaldavClient,
  name: string,
  url: string,
): Promise<boolean> {
  if (heuristicCalendarReadOnly(name, url)) return true
  return !(await caldavHasWritePrivilege(client, url))
}

export function formatCalDavPushError(listName: string, uid: string, msg: string): string {
  if (msg.includes('403')) {
    return `Liste „${listName}“: kein Schreibzugriff (HTTP 403).`
  }
  return `${listName}: ${msg}`
}
