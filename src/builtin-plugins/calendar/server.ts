/** Inlined so volume `server.mjs` does not bundle Next.js via `@/lib/*`. */
type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}
import {
  applyAccountUpdate,
  badRequest,
  buildAccount,
  buildSummary,
  notFound,
  ok,
  toAccountView,
} from './lib/api-helpers'
import { buildVcalendar, expandRecurrences, newUid, normalizeEventTimes, parseVcalendar } from './lib/ical'
import { mutateStore, newId, nowIso, readStore } from './lib/store'
import { runSync, syncAfterMutation, testAccount } from './lib/sync'
import type {
  AccountCreateBody,
  AccountUpdateBody,
  CalendarEvent,
  ConflictResolveBody,
  EventCreateBody,
  EventUpdateBody,
} from './lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CreateEventResponse = CalendarEvent & { syncError?: string; syncPending?: boolean }
type UpdateEventResponse = CalendarEvent & { syncError?: string; syncPending?: boolean }

async function handleSummaryGet(): Promise<Response> {
  const store = await readStore()
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 86400_000)
  const visibleCalendarIds = new Set(store.calendars.filter(c => c.visible).map(c => c.id))
  const calendarLookup = (id: string) => {
    const c = store.calendars.find(x => x.id === id)
    return { name: c?.name, color: c?.color }
  }
  const candidates = store.events.filter(
    e => visibleCalendarIds.has(e.calendarId) && e.syncState !== 'local_deleted',
  )
  const expanded = expandRecurrences(candidates, now, end, calendarLookup)
  const pending = store.events.filter(
    e => e.syncState === 'local_new' || e.syncState === 'local_modified' || e.syncState === 'local_deleted',
  ).length
  const conflicts = store.events.filter(e => e.syncState === 'conflict').length
  return ok(buildSummary(expanded, pending, conflicts))
}

async function handleStatusGet(): Promise<Response> {
  const store = await readStore()
  const pending = store.events.filter(
    e => e.syncState === 'local_new' || e.syncState === 'local_modified' || e.syncState === 'local_deleted',
  ).length
  const conflicts = store.events.filter(e => e.syncState === 'conflict').length
  return ok({
    accounts: store.accounts.map(a => toAccountView(a, store.calendars)),
    recentRuns: store.syncLog.slice(0, 20),
    pendingChanges: pending,
    conflicts,
  })
}

async function handleAccountsGet(): Promise<Response> {
  const store = await readStore()
  return ok(store.accounts.map(a => toAccountView(a, store.calendars)))
}

async function handleAccountsPost(req: Request): Promise<Response> {
  let body: AccountCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (!body?.name || !body?.provider) return badRequest('name and provider required')
  let newIdVal: string
  try {
    const account = buildAccount(body)
    newIdVal = account.id
    await mutateStore(s => {
      s.accounts.push(account)
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'invalid body'
    return badRequest(msg)
  }
  runSync(newIdVal).catch(() => undefined)
  const store = await readStore()
  const created = store.accounts.find(a => a.id === newIdVal)!
  return ok(toAccountView(created, store.calendars))
}

async function handleAccountPut(req: Request, id: string): Promise<Response> {
  let body: AccountUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let found = false
  await mutateStore(s => {
    const a = s.accounts.find(x => x.id === id)
    if (!a) return
    found = true
    applyAccountUpdate(a, body)
  })
  if (!found) return notFound('account not found')
  const store = await readStore()
  const updated = store.accounts.find(a => a.id === id)!
  return ok(toAccountView(updated, store.calendars))
}

async function handleAccountDelete(id: string): Promise<Response> {
  let found = false
  await mutateStore(s => {
    const idx = s.accounts.findIndex(a => a.id === id)
    if (idx === -1) return
    found = true
    s.accounts.splice(idx, 1)
    const calIds = new Set(s.calendars.filter(c => c.accountId === id).map(c => c.id))
    s.calendars = s.calendars.filter(c => !calIds.has(c.id))
    s.events = s.events.filter(e => !calIds.has(e.calendarId))
  })
  if (!found) return notFound('account not found')
  return ok({ ok: true })
}

async function handleAccountSyncPost(id: string): Promise<Response> {
  const store = await readStore()
  const account = store.accounts.find(a => a.id === id)
  if (!account) return notFound('account not found')
  if (!account.enabled) return badRequest('account is disabled')
  const log = await runSync(id)
  return ok(log)
}

async function handleAccountTestPost(id: string): Promise<Response> {
  const store = await readStore()
  const account = store.accounts.find(a => a.id === id)
  if (!account) return notFound('account not found')
  const result = await testAccount(account)
  return ok(result)
}

async function handleCalendarsGet(): Promise<Response> {
  const store = await readStore()
  return ok(store.calendars)
}

async function handleCalendarPut(req: Request, id: string): Promise<Response> {
  let body: { color?: string; visible?: boolean; name?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let updated = null
  await mutateStore(s => {
    const c = s.calendars.find(x => x.id === id)
    if (!c) return
    if (body.color !== undefined) c.color = body.color
    if (body.visible !== undefined) c.visible = body.visible
    if (body.name !== undefined) c.name = body.name
    updated = c
  })
  if (!updated) return notFound('calendar not found')
  return ok(updated)
}

async function handleEventsGet(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const calendarId = url.searchParams.get('calendarId') ?? undefined
  if (!start || !end) return badRequest('start and end query params required')
  let startDate: Date
  let endDate: Date
  try {
    startDate = new Date(start)
    endDate = new Date(end)
    if (isNaN(+startDate) || isNaN(+endDate)) throw new Error('bad date')
  } catch {
    return badRequest('start and end must be valid ISO datetimes')
  }
  const store = await readStore()
  const visibleCalendarIds = new Set(
    store.calendars.filter(c => c.visible && (!calendarId || c.id === calendarId)).map(c => c.id),
  )
  const calendarLookup = (calId: string) => {
    const c = store.calendars.find(x => x.id === calId)
    return { name: c?.name, color: c?.color }
  }
  const candidates = store.events.filter(
    e => visibleCalendarIds.has(e.calendarId) && e.syncState !== 'local_deleted',
  )
  const expanded = expandRecurrences(candidates, startDate, endDate, calendarLookup)
  return ok(expanded)
}

async function handleEventsPost(req: Request): Promise<Response> {
  let body: EventCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (!body?.calendarId || !body?.dtstart) return badRequest('calendarId and dtstart required')
  const store = await readStore()
  const cal = store.calendars.find(c => c.id === body.calendarId)
  if (!cal) return badRequest('calendar not found')
  if (cal.readOnly) return badRequest('calendar is read-only')
  const times = normalizeEventTimes({
    dtstart: body.dtstart,
    dtend: body.dtend,
    allDay: body.allDay,
  })
  const uid = newUid()
  const evId = newId('evt')
  const ical = buildVcalendar({
    uid,
    summary: body.summary ?? '',
    description: body.description,
    location: body.location,
    dtstart: times.dtstart,
    dtend: times.dtend,
    allDay: body.allDay ?? false,
    rrule: body.rrule,
    lastModifiedIso: nowIso(),
  })
  await mutateStore(s => {
    s.events.push({
      id: evId,
      calendarId: body.calendarId,
      uid,
      icalData: ical,
      summary: body.summary ?? '',
      description: body.description ?? '',
      location: body.location ?? '',
      dtstart: times.dtstart,
      dtend: times.dtend,
      allDay: body.allDay ?? false,
      rrule: body.rrule,
      localModifiedAt: nowIso(),
      syncState: 'local_new',
    })
  })
  const syncError = await syncAfterMutation(cal.accountId, { calendarIds: [body.calendarId] })
  const after = await readStore()
  const ev = after.events.find(e => e.id === evId)
  if (!ev) return badRequest('event not created')
  const payload: CreateEventResponse = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== 'synced' && !syncError,
  }
  return ok(payload)
}

async function handleEventPut(req: Request, id: string): Promise<Response> {
  let body: EventUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let calendarAccountId: string | null = null
  let calendarIdsToSync: string[] = []
  let failReason: 'not_found' | 'read_only' | 'bad_calendar' | null = null
  await mutateStore(s => {
    const ev = s.events.find(e => e.id === id)
    if (!ev) {
      failReason = 'not_found'
      return
    }
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) {
      failReason = 'read_only'
      return
    }
    calendarAccountId = cal.accountId
    const oldCalendarId = ev.calendarId
    if (body.calendarId !== undefined && body.calendarId !== ev.calendarId) {
      const newCal = s.calendars.find(c => c.id === body.calendarId)
      if (!newCal) {
        failReason = 'bad_calendar'
        return
      }
      if (newCal.readOnly) {
        failReason = 'bad_calendar'
        return
      }
      if (ev.remoteHref && ev.syncState !== 'local_new') {
        ev.pendingRemoteDelete = {
          calendarId: oldCalendarId,
          remoteHref: ev.remoteHref,
          remoteEtag: ev.remoteEtag ?? '',
        }
      }
      ev.calendarId = body.calendarId
      ev.remoteHref = undefined
      ev.remoteEtag = undefined
      ev.syncState = 'local_new'
      calendarIdsToSync = [oldCalendarId, body.calendarId]
    } else {
      calendarIdsToSync = [ev.calendarId]
    }
    if (body.summary !== undefined) ev.summary = body.summary
    if (body.description !== undefined) ev.description = body.description
    if (body.location !== undefined) ev.location = body.location
    const times = normalizeEventTimes({
      dtstart: body.dtstart ?? ev.dtstart,
      dtend: body.dtend ?? ev.dtend,
      allDay: body.allDay ?? ev.allDay,
    })
    if (body.dtstart !== undefined) ev.dtstart = times.dtstart
    if (body.dtend !== undefined) ev.dtend = times.dtend
    if (body.allDay !== undefined) ev.allDay = body.allDay
    if (body.rrule !== undefined) ev.rrule = body.rrule
    ev.localModifiedAt = nowIso()
    ev.icalData = buildVcalendar({
      uid: ev.uid,
      summary: ev.summary,
      description: ev.description,
      location: ev.location,
      dtstart: ev.dtstart,
      dtend: ev.dtend,
      allDay: ev.allDay,
      rrule: ev.rrule,
      lastModifiedIso: ev.localModifiedAt,
    })
    if (ev.syncState === 'synced') ev.syncState = 'local_modified'
  })
  if (failReason === 'not_found') return notFound('event not found')
  if (failReason === 'read_only') return notFound('event not found or its calendar is read-only')
  if (failReason === 'bad_calendar') return badRequest('target calendar not found or read-only')
  const syncError = calendarAccountId
    ? await syncAfterMutation(calendarAccountId, { calendarIds: calendarIdsToSync })
    : undefined
  const after = await readStore()
  const ev = after.events.find(e => e.id === id)
  if (!ev) return notFound('event not found')
  const payload: UpdateEventResponse = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== 'synced' && !syncError,
  }
  return ok(payload)
}

async function handleEventDelete(id: string): Promise<Response> {
  let triggerAccountId: string | null = null
  let calendarIdToSync: string | null = null
  let found = false
  await mutateStore(s => {
    const idx = s.events.findIndex(e => e.id === id)
    if (idx === -1) return
    const ev = s.events[idx]
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) return
    found = true
    triggerAccountId = cal.accountId
    calendarIdToSync = ev.calendarId
    if (ev.syncState === 'local_new') {
      s.events.splice(idx, 1)
    } else {
      ev.syncState = 'local_deleted'
      ev.localModifiedAt = nowIso()
    }
  })
  if (!found) return notFound('event not found or its calendar is read-only')
  const syncError = triggerAccountId
    ? await syncAfterMutation(triggerAccountId, {
        calendarIds: calendarIdToSync ? [calendarIdToSync] : undefined,
      })
    : undefined
  return ok({ ok: true, syncError })
}

async function handleConflictsGet(): Promise<Response> {
  const store = await readStore()
  const conflicts = store.events
    .filter(e => e.syncState === 'conflict')
    .map(e => {
      const cal = store.calendars.find(c => c.id === e.calendarId)
      return { ...e, calendarName: cal?.name, calendarColor: cal?.color }
    })
  return ok(conflicts)
}

async function handleConflictResolvePost(req: Request, id: string): Promise<Response> {
  let body: ConflictResolveBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (body.side !== 'local' && body.side !== 'remote') return badRequest("side must be 'local' or 'remote'")
  let found = false
  let triggerAccountId: string | null = null
  let resolution: 'remote_kept' | 'local_will_overwrite' | 'deleted_locally' | null = null
  await mutateStore(s => {
    const idx = s.events.findIndex(e => e.id === id)
    if (idx === -1) return
    const ev = s.events[idx]
    if (ev.syncState !== 'conflict') return
    found = true
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    triggerAccountId = cal?.accountId ?? null
    if (body.side === 'remote') {
      if (!ev.conflictRemoteIcal) {
        s.events.splice(idx, 1)
        resolution = 'deleted_locally'
        return
      }
      const parsed = parseVcalendar(ev.conflictRemoteIcal)[0]
      if (!parsed) return
      Object.assign(ev, {
        icalData: ev.conflictRemoteIcal,
        summary: parsed.summary,
        description: parsed.description,
        location: parsed.location,
        dtstart: parsed.dtstart,
        dtend: parsed.dtend,
        allDay: parsed.allDay,
        rrule: parsed.rrule,
        syncState: 'synced' as const,
        conflictRemoteIcal: undefined,
        localModifiedAt: nowIso(),
      })
      resolution = 'remote_kept'
    } else {
      ev.syncState = 'local_modified'
      ev.conflictRemoteIcal = undefined
      ev.localModifiedAt = nowIso()
      resolution = 'local_will_overwrite'
    }
  })
  if (!found) return notFound('no conflict on this event')
  if (resolution === 'local_will_overwrite' && triggerAccountId) {
    runSync(triggerAccountId).catch(() => undefined)
  }
  return ok({ ok: true, resolution })
}

export async function calendarServerHandler(ctx: PluginServerContext): Promise<Response> {
  const method = ctx.request.method.toUpperCase()
  const path = ctx.path
  const [a, b, c] = path

  if (a === 'summary' && method === 'GET' && path.length === 1) return handleSummaryGet()
  if (a === 'status' && method === 'GET' && path.length === 1) return handleStatusGet()

  if (a === 'accounts' && path.length === 1) {
    if (method === 'GET') return handleAccountsGet()
    if (method === 'POST') return handleAccountsPost(ctx.request)
  }
  if (a === 'accounts' && b && path.length === 2) {
    if (method === 'PUT') return handleAccountPut(ctx.request, b)
    if (method === 'DELETE') return handleAccountDelete(b)
  }
  if (a === 'accounts' && b && c === 'sync' && path.length === 3 && method === 'POST') {
    return handleAccountSyncPost(b)
  }
  if (a === 'accounts' && b && c === 'test' && path.length === 3 && method === 'POST') {
    return handleAccountTestPost(b)
  }

  if (a === 'calendars' && path.length === 1 && method === 'GET') return handleCalendarsGet()
  if (a === 'calendars' && b && path.length === 2 && method === 'PUT') return handleCalendarPut(ctx.request, b)

  if (a === 'events' && path.length === 1) {
    if (method === 'GET') return handleEventsGet(ctx.request)
    if (method === 'POST') return handleEventsPost(ctx.request)
  }
  if (a === 'events' && b && path.length === 2) {
    if (method === 'PUT') return handleEventPut(ctx.request, b)
    if (method === 'DELETE') return handleEventDelete(b)
  }

  if (a === 'conflicts' && path.length === 1 && method === 'GET') return handleConflictsGet()
  if (a === 'conflicts' && b && path.length === 2 && method === 'POST') {
    return handleConflictResolvePost(ctx.request, b)
  }

  return Response.json(
    { error: 'not_found', pluginId: ctx.pluginId, path: path.join('/') },
    { status: 404 },
  )
}

export default calendarServerHandler
