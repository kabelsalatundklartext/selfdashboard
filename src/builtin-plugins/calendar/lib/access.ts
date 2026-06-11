import type { UserRole } from '@/lib/auth/types'

import {
  LEGACY_OWNER_ID,
  legacyStoreExists,
  listCalendarOwnerUserIds,
  migrateLegacyStoreToUser,
  readLegacyStore,
  readUserStore,
} from './store'
import type {
  Account,
  AccountSharing,
  Calendar,
  CalendarStore,
  SharedCalendarAccess,
  SharedCalendarGrant,
} from './types'

export type AccountPermission = {
  ownerUserId: string
  ownedByViewer: boolean
  canManage: boolean
}

export type CalendarPermission = {
  accountId: string
  ownerUserId: string
  canEditEvents: boolean
}

export type ViewerStore = {
  store: CalendarStore
  permissions: Map<string, AccountPermission>
  calendarPermissions: Map<string, CalendarPermission>
}

export function normalizeAccount(account: Account, ownerUserId: string): Account {
  return {
    ...account,
    ownerUserId: account.ownerUserId ?? ownerUserId,
    sharing: account.sharing ?? 'private',
    sharedWithUserIds: account.sharedWithUserIds ?? [],
    sharedCalendarGrants: account.sharedCalendarGrants ?? [],
  }
}

export function canViewAccount(account: Account, viewerUserId: string): boolean {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID
  if (owner === viewerUserId) return true
  if (owner === LEGACY_OWNER_ID) return true
  if (account.sharing !== 'shared') return false
  if (!(account.sharedWithUserIds ?? []).includes(viewerUserId)) return false
  const grants = account.sharedCalendarGrants ?? []
  if (grants.length === 0) return true
  return grants.some((g) => g.userId === viewerUserId)
}

export function canManageAccount(account: Account, viewerUserId: string, viewerRole: UserRole): boolean {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID
  if (owner === viewerUserId) return true
  if (owner === LEGACY_OWNER_ID && viewerRole === 'admin') return true
  return false
}

/** Sharee access to one sub-calendar; owner handled separately in mergeInto. */
export function resolveShareeCalendarAccess(
  account: Account,
  calendarId: string,
  viewerUserId: string,
): 'none' | SharedCalendarAccess {
  if (account.sharing !== 'shared') return 'none'
  if (!(account.sharedWithUserIds ?? []).includes(viewerUserId)) return 'none'

  const grants = account.sharedCalendarGrants ?? []
  if (grants.length === 0) return 'read'

  const grant = grants.find((g) => g.calendarId === calendarId && g.userId === viewerUserId)
  return grant?.access ?? 'none'
}

function mergeInto(
  target: CalendarStore,
  source: CalendarStore,
  ownerUserId: string,
  viewerUserId: string,
  viewerRole: UserRole,
  permissions: Map<string, AccountPermission>,
  calendarPermissions: Map<string, CalendarPermission>,
): void {
  const accountById = new Map(source.accounts.map((a) => [a.id, normalizeAccount(a, ownerUserId)]))
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
    })
  }

  const calendarIds = new Set(target.calendars.map((c) => c.id))
  for (const cal of source.calendars) {
    const account = accountById.get(cal.accountId)
    if (!account || !permissions.has(cal.accountId)) continue

    const owned = canManageAccount(account, viewerUserId, viewerRole)
    if (!owned) {
      const shareAccess = resolveShareeCalendarAccess(account, cal.id, viewerUserId)
      if (shareAccess === 'none') continue
      if (calendarIds.has(cal.id)) continue
      calendarIds.add(cal.id)
      const canEditEvents = shareAccess === 'write' && !cal.readOnly
      calendarPermissions.set(cal.id, {
        accountId: cal.accountId,
        ownerUserId: account.ownerUserId ?? ownerUserId,
        canEditEvents,
      })
      const readOnly = cal.readOnly || shareAccess === 'read'
      target.calendars.push(readOnly === cal.readOnly ? cal : { ...cal, readOnly })
      continue
    }

    if (calendarIds.has(cal.id)) continue
    calendarIds.add(cal.id)
    calendarPermissions.set(cal.id, {
      accountId: cal.accountId,
      ownerUserId: account.ownerUserId ?? ownerUserId,
      canEditEvents: !cal.readOnly,
    })
    target.calendars.push(cal)
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
  const calendarPermissions = new Map<string, CalendarPermission>()

  const own = await readUserStore(viewerUserId)
  mergeInto(store, own, viewerUserId, viewerUserId, viewerRole, permissions, calendarPermissions)

  if (legacyStoreExists()) {
    const legacy = await readLegacyStore()
    mergeInto(store, legacy, LEGACY_OWNER_ID, viewerUserId, viewerRole, permissions, calendarPermissions)
  }

  for (const ownerId of listCalendarOwnerUserIds()) {
    if (ownerId === viewerUserId) continue
    const other = await readUserStore(ownerId)
    mergeInto(store, other, ownerId, viewerUserId, viewerRole, permissions, calendarPermissions)
  }

  return { store, permissions, calendarPermissions }
}

export function applyCalendarReadOnlyForViewer(
  calendars: Calendar[],
  calendarPermissions: Map<string, CalendarPermission>,
): Calendar[] {
  return calendars.map((c) => {
    const perm = calendarPermissions.get(c.id)
    if (perm?.canEditEvents) return c
    if (c.readOnly) return c
    if (perm) return { ...c, readOnly: true }
    return c
  })
}

export function filterWritableCalendars(
  calendars: Calendar[],
  calendarPermissions: Map<string, CalendarPermission>,
): Calendar[] {
  return applyCalendarReadOnlyForViewer(calendars, calendarPermissions).filter((c) => !c.readOnly)
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

export function sanitizeSharedCalendarGrants(
  sharing: AccountSharing,
  sharedWithUserIds: string[],
  grants: SharedCalendarGrant[] | undefined,
  validCalendarIds: Set<string>,
  ownerUserId: string,
): SharedCalendarGrant[] {
  if (sharing !== 'shared') return []
  const allowedUsers = new Set(sharedWithUserIds.filter((id) => id && id !== ownerUserId))
  const seen = new Set<string>()
  const out: SharedCalendarGrant[] = []
  for (const raw of grants ?? []) {
    const calendarId = String(raw.calendarId ?? '').trim()
    const userId = String(raw.userId ?? '').trim()
    const access: SharedCalendarAccess = raw.access === 'write' ? 'write' : 'read'
    if (!calendarId || !userId || !validCalendarIds.has(calendarId)) continue
    if (!allowedUsers.has(userId)) continue
    const key = `${calendarId}:${userId}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ calendarId, userId, access })
  }
  return out
}

export function calendarCanEditEvents(
  calendarId: string,
  calendarPermissions: Map<string, CalendarPermission>,
): boolean {
  return calendarPermissions.get(calendarId)?.canEditEvents === true
}
