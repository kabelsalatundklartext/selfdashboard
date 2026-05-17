/**
 * JSON file storage for the calendar plugin.
 *
 * One file per install: `${CALENDAR_DATA_DIR}/store.json`.
 * Default data dir resolution mirrors `SELFDASHBOARD_DATA_DIR` /
 * `/app/data` from the host app. Writes are atomic (tmp + rename) and
 * serialised through an in-process async mutex to prevent torn states
 * when multiple route handlers mutate at once.
 *
 * Scale note: for a typical home install (10 accounts, 5000 events) this
 * file stays well under 10 MB. If you ever push past that and notice
 * write latency, switch to per-calendar files — the API on this module
 * doesn't have to change.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { dataDir } from '@/lib/dataDir'
import { CalendarStore, EMPTY_STORE, STORE_VERSION } from './types'

const DEFAULT_ROOT =
  process.env.CALENDAR_DATA_DIR ||
  join(dataDir(), 'calendar')

let dataDirCache: string | null = null

export function getDataDir(): string {
  if (dataDirCache) return dataDirCache
  if (!existsSync(DEFAULT_ROOT)) {
    mkdirSync(DEFAULT_ROOT, { recursive: true })
  }
  dataDirCache = DEFAULT_ROOT
  return dataDirCache
}

const storePath = () => join(getDataDir(), 'store.json')

// ---------------------------------------------------------------------------
// async mutex
// ---------------------------------------------------------------------------

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = chain.then(fn)
  // ignore errors on the chain itself so a single failed task doesn't poison the queue
  chain = next.catch(() => undefined)
  return next as Promise<T>
}

// ---------------------------------------------------------------------------
// read / write
// ---------------------------------------------------------------------------

function readSyncOrEmpty(): CalendarStore {
  const path = storePath()
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
  } catch (e) {
    // corrupt file — back it up and start fresh rather than crash the API
    try { renameSync(path, path + '.corrupt-' + Date.now()) } catch {}
    return structuredClone(EMPTY_STORE)
  }
}

function writeSync(store: CalendarStore): void {
  const path = storePath()
  const tmp = path + '.tmp'
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  renameSync(tmp, path)
}

/** Read the entire store. Returns a deep copy so callers can mutate freely. */
export function readStore(): Promise<CalendarStore> {
  return withLock(() => {
    return structuredClone(readSyncOrEmpty())
  })
}

/**
 * Mutate the store atomically. The callback receives the current store and
 * may mutate it in place; whatever it returns (or void) is fine — we persist
 * the (potentially mutated) snapshot.
 */
export function mutateStore<T>(fn: (s: CalendarStore) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const store = readSyncOrEmpty()
    const result = await fn(store)
    writeSync(store)
    return result
  })
}

// ---------------------------------------------------------------------------
// id generator — short, sortable, URL-safe
// ---------------------------------------------------------------------------

export function newId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${ts}${rand}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
