/**
 * Type definitions for the calendar plugin.
 *
 * The store is a single JSON file at `${CALENDAR_DATA_DIR}/store.json` that
 * mirrors the shape of `CalendarStore` below. We hand-roll the JSON I/O
 * rather than pulling in a DB to keep the dependency footprint small and to
 * match the style of `dashboard.json`.
 */

export type ProviderId = 'caldav' | 'ics'

export type SyncState =
  | 'synced'          // local == remote
  | 'local_new'       // created locally, not yet pushed
  | 'local_modified'  // edited locally, push pending
  | 'local_deleted'   // deleted locally, push pending
  | 'conflict'        // both sides changed; conflictRemoteIcal holds the other side

export type SyncStatus = 'idle' | 'ok' | 'error' | 'conflict'

export interface CalDAVConfig {
  url: string
  username: string
  /** Fernet-encrypted password (never plaintext on disk) */
  passwordEncrypted: string
  verifySsl: boolean
}

export interface ICSConfig {
  url: string
  username?: string
  /** Fernet-encrypted password (rare for ICS but supported) */
  passwordEncrypted?: string
}

export interface Account {
  id: string
  name: string
  provider: ProviderId
  config: CalDAVConfig | ICSConfig
  enabled: boolean
  createdAt: string
  lastSyncAt?: string
  lastSyncStatus?: SyncStatus
  lastSyncError?: string
}

export interface Calendar {
  id: string
  accountId: string
  /** Remote identifier — for CalDAV this is the collection URL; for ICS it's the feed URL */
  remoteId: string
  name: string
  color: string
  readOnly: boolean
  visible: boolean
  /** CalDAV sync-token (RFC 6578) or ICS ETag */
  syncToken?: string
  ctag?: string
  etagGlobal?: string
}

export interface CalendarEvent {
  id: string
  calendarId: string
  uid: string
  remoteHref?: string
  remoteEtag?: string
  /** Verbatim iCalendar blob from server, preserved so unknown X-* props survive round-trips */
  icalData: string
  summary?: string
  description?: string
  location?: string
  /** ISO8601 (UTC) for timed events, YYYY-MM-DD for all-day */
  dtstart: string
  dtend?: string
  allDay: boolean
  /** Raw RRULE string like "FREQ=WEEKLY;BYDAY=MO" */
  rrule?: string
  localModifiedAt: string
  remoteModifiedAt?: string
  syncState: SyncState
  /** When in conflict, holds the remote-side iCal blob for resolution UI */
  conflictRemoteIcal?: string
}

export interface SyncLogEntry {
  id: string
  accountId: string
  startedAt: string
  finishedAt?: string
  added: number
  updated: number
  deleted: number
  conflicts: number
  error?: string
}

export interface CalendarStore {
  version: number
  accounts: Account[]
  calendars: Calendar[]
  events: CalendarEvent[]
  syncLog: SyncLogEntry[]
}

export const STORE_VERSION = 1

export const EMPTY_STORE: CalendarStore = {
  version: STORE_VERSION,
  accounts: [],
  calendars: [],
  events: [],
  syncLog: [],
}

// -- API request/response shapes -------------------------------------------

export interface AccountCreateBody {
  name: string
  provider: ProviderId
  caldav?: {
    url: string
    username: string
    password: string
    verifySsl: boolean
  }
  ics?: {
    url: string
    username?: string
    password?: string
  }
}

export interface AccountUpdateBody {
  name?: string
  enabled?: boolean
  caldav?: AccountCreateBody['caldav']
  ics?: AccountCreateBody['ics']
}

export interface EventCreateBody {
  calendarId: string
  summary?: string
  description?: string
  location?: string
  dtstart: string
  dtend?: string
  allDay?: boolean
  rrule?: string
}

export interface EventUpdateBody {
  summary?: string
  description?: string
  location?: string
  dtstart?: string
  dtend?: string
  allDay?: boolean
  rrule?: string
}

export interface ExpandedEvent extends CalendarEvent {
  /** True if this row is a recurrence instance produced by expansion */
  isRecurrenceInstance: boolean
  /** Original UID-anchored dtstart for the recurrence master */
  recurrenceId?: string
  calendarName?: string
  calendarColor?: string
}

export interface SummaryResponse {
  now: string
  todayCount: number
  upcoming: Array<{
    id: string
    calendarId: string
    summary: string
    dtstart: string
    dtend?: string
    allDay: boolean
    syncState?: SyncState
    calendarColor?: string
    calendarName?: string
    location?: string
    description?: string
  }>
  pendingChanges: number
  conflicts: number
}

export interface ConflictResolveBody {
  side: 'local' | 'remote'
}
