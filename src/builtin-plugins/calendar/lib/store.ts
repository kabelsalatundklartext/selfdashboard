/**
 * JSON file storage for the calendar plugin.
 *
 * Each user has their own store at `${data}/users/<userId>/calendar/store.json`.
 * Legacy installs may still have `${data}/calendar/store.json` (global) until an
 * admin opens the calendar — then it is migrated into that admin's user folder.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

import { CalendarStore, EMPTY_STORE, STORE_VERSION } from './types'

export const LEGACY_OWNER_ID = '__legacy__'

function resolveAppDataDir(): string {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim()
  if (raw) return raw
  return join(process.cwd(), 'data')
}

const DEFAULT_ROOT =
  process.env.CALENDAR_DATA_DIR ||
  join(resolveAppDataDir(), 'calendar')

export function getDataDir(): string {
  return DEFAULT_ROOT
}

export function usersDataDir(): string {
  return join(resolveAppDataDir(), 'users')
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function legacyStorePath(): string {
  ensureDir(DEFAULT_ROOT)
  return join(DEFAULT_ROOT, 'store.json')
}

export function userStorePath(userId: string): string {
  return join(usersDataDir(), userId, 'calendar', 'store.json')
}

export function legacyStoreExists(): boolean {
  return existsSync(legacyStorePath())
}

// ---------------------------------------------------------------------------
// async mutex — eine Queue PRO Owner-Store (Datei).
//
// Früher gab es eine einzige globale Queue für alle Kalender-Dateien. Da der
// Sync seine Netzwerk-Calls innerhalb des Locks ausführt (siehe sync.ts), hat
// ein langsamer/toter CalDAV-Server eines Nutzers die Schreibzugriffe ALLER
// Nutzer blockiert. Jeder Owner schreibt eine eigene Datei → pro-Owner-Lock
// reicht für die Datei-Sicherheit und entkoppelt die Nutzer voneinander.
// ---------------------------------------------------------------------------

const chains = new Map<string, Promise<unknown>>()

function withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve()
  const next = prev.then(fn)
  chains.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  )
  return next as Promise<T>
}

// ---------------------------------------------------------------------------
// read / write
// ---------------------------------------------------------------------------

function readSyncFromPath(path: string): CalendarStore {
  if (!existsSync(path)) return structuredClone(EMPTY_STORE)
  try {
    const raw = readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw) as Partial<CalendarStore>
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: parsed.accounts ?? [],
      calendars: parsed.calendars ?? [],
      events: parsed.events ?? [],
      syncLog: parsed.syncLog ?? [],
    }
  } catch {
    try {
      renameSync(path, path + '.corrupt-' + Date.now())
    } catch {
      /* ignore */
    }
    return structuredClone(EMPTY_STORE)
  }
}

function writeSyncToPath(path: string, store: CalendarStore): void {
  ensureDir(join(path, '..'))
  const tmp = path + '.tmp'
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  renameSync(tmp, path)
}

export function listCalendarOwnerUserIds(): string[] {
  const root = usersDataDir()
  if (!existsSync(root)) return []
  const ids: string[] = []
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue
    if (existsSync(userStorePath(ent.name))) ids.push(ent.name)
  }
  return ids
}

export async function readLegacyStore(): Promise<CalendarStore> {
  return withLock(LEGACY_OWNER_ID, () => structuredClone(readSyncFromPath(legacyStorePath())))
}

export async function readUserStore(userId: string): Promise<CalendarStore> {
  return withLock(userId, () => structuredClone(readSyncFromPath(userStorePath(userId))))
}

export async function mutateUserStore<T>(
  userId: string,
  fn: (s: CalendarStore) => T | Promise<T>,
): Promise<T> {
  return withLock(userId, async () => {
    const path = userStorePath(userId)
    const store = readSyncFromPath(path)
    const result = await fn(store)
    writeSyncToPath(path, store)
    return result
  })
}

export async function mutateLegacyStore<T>(
  fn: (s: CalendarStore) => T | Promise<T>,
): Promise<T> {
  return withLock(LEGACY_OWNER_ID, async () => {
    const path = legacyStorePath()
    const store = readSyncFromPath(path)
    const result = await fn(store)
    writeSyncToPath(path, store)
    return result
  })
}

export async function readOwnerStore(ownerUserId: string): Promise<CalendarStore> {
  if (ownerUserId === LEGACY_OWNER_ID) return readLegacyStore()
  return readUserStore(ownerUserId)
}

export async function mutateOwnerStore<T>(
  ownerUserId: string,
  fn: (s: CalendarStore) => T | Promise<T>,
): Promise<T> {
  if (ownerUserId === LEGACY_OWNER_ID) return mutateLegacyStore(fn)
  return mutateUserStore(ownerUserId, fn)
}

/** Move legacy global store into the first admin user's folder (once). */
export async function migrateLegacyStoreToUser(adminUserId: string): Promise<boolean> {
  const legacyPath = legacyStorePath()
  if (!existsSync(legacyPath)) return false
  const legacy = readSyncFromPath(legacyPath)
  if (
    legacy.accounts.length === 0 &&
    legacy.calendars.length === 0 &&
    legacy.events.length === 0
  ) {
    try {
      renameSync(legacyPath, legacyPath + '.empty-' + Date.now())
    } catch {
      /* ignore */
    }
    return false
  }
  await mutateUserStore(adminUserId, (target) => {
    for (const a of legacy.accounts) {
      a.ownerUserId = a.ownerUserId ?? adminUserId
      a.sharing = a.sharing ?? 'private'
      a.sharedWithUserIds = a.sharedWithUserIds ?? []
    }
    target.accounts.push(...legacy.accounts)
    target.calendars.push(...legacy.calendars)
    target.events.push(...legacy.events)
    target.syncLog.unshift(...legacy.syncLog)
    target.syncLog = target.syncLog.slice(0, 50)
  })
  const backup = legacyPath + '.pre-user-migrated'
  try {
    renameSync(legacyPath, backup)
  } catch {
    /* keep legacy if rename fails */
  }
  return true
}

export async function findAccountOwnerUserId(accountId: string): Promise<string | null> {
  if (legacyStoreExists()) {
    const legacy = await readLegacyStore()
    if (legacy.accounts.some((a) => a.id === accountId)) return LEGACY_OWNER_ID
  }
  for (const userId of listCalendarOwnerUserIds()) {
    const store = await readUserStore(userId)
    if (store.accounts.some((a) => a.id === accountId)) return userId
  }
  return null
}

/** @deprecated Use readViewerStore / readOwnerStore */
export async function readStore(): Promise<CalendarStore> {
  if (legacyStoreExists()) return readLegacyStore()
  const owners = listCalendarOwnerUserIds()
  if (owners.length === 1) return readUserStore(owners[0]!)
  return structuredClone(EMPTY_STORE)
}

/** @deprecated Use mutateOwnerStore / mutateUserStore */
export async function mutateStore<T>(fn: (s: CalendarStore) => T | Promise<T>): Promise<T> {
  if (legacyStoreExists()) return mutateLegacyStore(fn)
  const owners = listCalendarOwnerUserIds()
  if (owners.length === 1) return mutateUserStore(owners[0]!, fn)
  throw new Error('calendar store is multi-user; use mutateOwnerStore')
}

export function newId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${ts}${rand}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
