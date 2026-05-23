import type { UserRole } from '@/lib/auth/types'

import {
  LEGACY_OWNER_ID,
  legacyStoreExists,
  listCalendarOwnerUserIds,
  migrateLegacyStoreToUser,
  readLegacyStore,
  readUserStore,
} from './store'
import type { Account, AccountSharing, Calendar, CalendarEvent, CalendarStore } from './types'

export type AccountPermission = {
  ownerUserId: string
  ownedByViewer: boolean
  canManage: boolean
  /** Non-owners viewing a shared account get read-only calendars. */
  forceCalendarReadOnly: boolean
}

export type ViewerStore = {
  store: CalendarStore
  permissions: Map<string, AccountPermission>
}

export function normalizeAccount(account: Account, ownerUserId: string): Account {
  return {
    ...account,
    ownerUserId: account.ownerUserId ?? ownerUserId,
    sharing: account.sharing ?? 'private',
    sharedWithUserIds: account.sharedWithUserIds ?? [],
  }
}

export function canViewAccount(account: Account, viewerUserId: string): boolean {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID
  if (owner === viewerUserId) return true
  if (owner === LEGACY_OWNER_ID) return true
  if (account.sharing === 'shared' && (account.sharedWithUserIds ?? []).includes(viewerUserId)) {
    return true
  }
  return false
}

export function canManageAccount(account: Account, viewerUserId: string, viewerRole: UserRole): boolean {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID
  if (owner === viewerUserId) return true
  if (owner === LEGACY_OWNER_ID && viewerRole === 'admin') return true
  return false
}

function mergeInto(
  target: CalendarStore,
  source: CalendarStore,
  ownerUserId: string,
  viewerUserId: string,
  viewerRole: UserRole,
  permissions: Map<string, AccountPermission>,
): void {
  const accountIds = new Set(target.accounts.map((a) => a.id))
  for (const raw of source.accounts) {
    const account = normalizeAccount(raw, ownerUserId)
    if (!canViewAccount(account, viewerUserId)) continue
    if (accountIds.has(account.id)) continue
    accountIds.add(account.id)
    target.accounts.push(account)
    const owned = account.ownerUserId === viewerUserId
    const manage = canManageAccount(account, viewerUserId, viewerRole)
    permissions.set(account.id, {
      ownerUserId: account.ownerUserId ?? ownerUserId,
      ownedByViewer: owned,
      canManage: manage,
      forceCalendarReadOnly: !manage,
    })
  }
  const calendarIds = new Set(target.calendars.map((c) => c.id))
  for (const cal of source.calendars) {
    if (!permissions.has(cal.accountId)) continue
    if (calendarIds.has(cal.id)) continue
    calendarIds.add(cal.id)
    const perm = permissions.get(cal.accountId)
    const readOnly = cal.readOnly || Boolean(perm?.forceCalendarReadOnly)
    target.calendars.push(readOnly === cal.readOnly ? cal : { ...cal, readOnly })
  }
  const visibleCalendarIds = new Set(target.calendars.map((c) => c.id))
  for (const ev of source.events) {
    if (!visibleCalendarIds.has(ev.calendarId)) continue
    if (target.events.some((e) => e.id === ev.id)) continue
    target.events.push(ev)
  }
}

export async function ensureLegacyMigrated(viewerUserId: string, viewerRole: UserRole): Promise<void> {
  if (!legacyStoreExists()) return
  if (viewerRole === 'admin') {
    await migrateLegacyStoreToUser(viewerUserId)
  }
}

export async function readViewerStore(
  viewerUserId: string,
  viewerRole: UserRole,
): Promise<ViewerStore> {
  await ensureLegacyMigrated(viewerUserId, viewerRole)

  const store: CalendarStore = {
    version: 1,
    accounts: [],
    calendars: [],
    events: [],
    syncLog: [],
  }
  const permissions = new Map<string, AccountPermission>()

  const own = await readUserStore(viewerUserId)
  mergeInto(store, own, viewerUserId, viewerUserId, viewerRole, permissions)

  if (legacyStoreExists()) {
    const legacy = await readLegacyStore()
    mergeInto(store, legacy, LEGACY_OWNER_ID, viewerUserId, viewerRole, permissions)
  }

  for (const ownerId of listCalendarOwnerUserIds()) {
    if (ownerId === viewerUserId) continue
    const other = await readUserStore(ownerId)
    mergeInto(store, other, ownerId, viewerUserId, viewerRole, permissions)
  }

  return { store, permissions }
}

export function applyCalendarReadOnlyForViewer(
  calendars: Calendar[],
  permissions: Map<string, AccountPermission>,
): Calendar[] {
  return calendars.map((c) => {
    const perm = permissions.get(c.accountId)
    if (!perm?.forceCalendarReadOnly) return c
    return c.readOnly ? c : { ...c, readOnly: true }
  })
}

export function filterWritableCalendars(
  calendars: Calendar[],
  permissions: Map<string, AccountPermission>,
): Calendar[] {
  return applyCalendarReadOnlyForViewer(calendars, permissions).filter((c) => !c.readOnly)
}

export function sanitizeSharedWith(
  sharing: AccountSharing | undefined,
  ids: string[] | undefined,
  ownerUserId: string,
): { sharing: AccountSharing; sharedWithUserIds: string[] } {
  const mode: AccountSharing = sharing === 'shared' ? 'shared' : 'private'
  const unique = Array.from(
    new Set((ids ?? []).map((id) => id.trim()).filter((id) => id && id !== ownerUserId)),
  )
  return {
    sharing: mode,
    sharedWithUserIds: mode === 'shared' ? unique : [],
  }
}
