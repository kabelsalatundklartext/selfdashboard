import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

import { EMPTY_STORE, STORE_VERSION, TasksStore, normalizeAccount } from './types'

function resolveAppDataDir(): string {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim()
  if (raw) return raw
  return join(process.cwd(), 'data')
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function usersDataDir(): string {
  return join(resolveAppDataDir(), 'users')
}

export function userStorePath(userId: string): string {
  return join(usersDataDir(), userId, 'tasks', 'store.json')
}

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = chain.then(fn)
  chain = next.catch(() => undefined)
  return next as Promise<T>
}

function readSyncFromPath(path: string): TasksStore {
  if (!existsSync(path)) return structuredClone(EMPTY_STORE)
  try {
    const raw = readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw) as Partial<TasksStore>
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: (parsed.accounts ?? []).map((a) => normalizeAccount(a as import('./types').Account)),
      lists: parsed.lists ?? [],
      tasks: parsed.tasks ?? [],
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

function writeSyncToPath(path: string, store: TasksStore): void {
  ensureDir(join(path, '..'))
  const tmp = path + '.tmp'
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  renameSync(tmp, path)
}

export function listTasksOwnerUserIds(): string[] {
  const root = usersDataDir()
  if (!existsSync(root)) return []
  const ids: string[] = []
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue
    if (existsSync(userStorePath(ent.name))) ids.push(ent.name)
  }
  return ids
}

export async function readUserStore(userId: string): Promise<TasksStore> {
  return withLock(() => structuredClone(readSyncFromPath(userStorePath(userId))))
}

export async function mutateUserStore<T>(
  userId: string,
  fn: (s: TasksStore) => T | Promise<T>,
): Promise<T> {
  return withLock(async () => {
    const path = userStorePath(userId)
    const store = readSyncFromPath(path)
    const result = await fn(store)
    writeSyncToPath(path, store)
    return result
  })
}

export async function findAccountOwnerUserId(accountId: string): Promise<string | null> {
  for (const userId of listTasksOwnerUserIds()) {
    const store = await readUserStore(userId)
    if (store.accounts.some((a) => a.id === accountId)) return userId
  }
  return null
}

export function newId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${ts}${rand}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
