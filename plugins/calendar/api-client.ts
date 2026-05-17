/**
 * Minimal fetch wrapper for the plugin's calls to /api/calendar/*.
 * Kept as a separate file so the giant index.tsx can stay readable.
 */

export interface AccountView {
  id: string
  name: string
  provider: 'caldav' | 'ics'
  enabled: boolean
  createdAt: string
  lastSyncAt?: string
  lastSyncStatus?: 'idle' | 'ok' | 'error' | 'conflict'
  lastSyncError?: string
  calendarCount: number
  endpoint?: string
  username?: string
}

export interface CalendarView {
  id: string
  accountId: string
  name: string
  color: string
  readOnly: boolean
  visible: boolean
}

export interface EventView {
  id: string
  calendarId: string
  uid: string
  summary?: string
  description?: string
  location?: string
  dtstart: string
  dtend?: string
  allDay: boolean
  rrule?: string
  syncState: 'synced' | 'local_new' | 'local_modified' | 'local_deleted' | 'conflict'
  calendarName?: string
  calendarColor?: string
  isRecurrenceInstance?: boolean
  recurrenceId?: string
}

export interface SummaryView {
  now: string
  todayCount: number
  upcoming: Array<{
    id: string
    calendarId: string
    summary: string
    dtstart: string
    dtend?: string
    allDay: boolean
    syncState?: EventView['syncState']
    calendarColor?: string
    calendarName?: string
    location?: string
    description?: string
  }>
  pendingChanges: number
  conflicts: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch('/api/calendar' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).error ?? msg } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  summary: () => request<SummaryView>('/summary'),
  status: () => request<{ accounts: AccountView[]; recentRuns: any[]; pendingChanges: number; conflicts: number }>('/status'),

  listAccounts: () => request<AccountView[]>('/accounts'),
  createAccount: (body: unknown) => request<AccountView>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id: string, body: unknown) => request<AccountView>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (id: string) => request<{ ok: true }>(`/accounts/${id}`, { method: 'DELETE' }),
  syncAccount: (id: string) => request<unknown>(`/accounts/${id}/sync`, { method: 'POST' }),
  testAccount: (id: string) => request<{ ok: boolean; error?: string; calendars?: unknown[] }>(`/accounts/${id}/test`, { method: 'POST' }),

  listCalendars: () => request<CalendarView[]>('/calendars'),
  updateCalendar: (id: string, body: unknown) => request<CalendarView>(`/calendars/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  listEvents: (startIso: string, endIso: string, calendarId?: string) =>
    request<EventView[]>(`/events?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}${calendarId ? `&calendarId=${calendarId}` : ''}`),
  createEvent: (body: unknown) => request<EventView>('/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id: string, body: unknown) => request<EventView>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvent: (id: string) => request<{ ok: true }>(`/events/${id}`, { method: 'DELETE' }),

  listConflicts: () => request<EventView[]>('/conflicts'),
  resolveConflict: (id: string, side: 'local' | 'remote') =>
    request<{ ok: true; resolution: string }>(`/conflicts/${id}`, { method: 'POST', body: JSON.stringify({ side }) }),
}
