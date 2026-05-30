import { mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { dataDir } from './data-dir'

import type { AuthUser, UserRole } from './auth-types'

export type { AuthUser, SessionInfo, UserRole } from './auth-types'

type UserRow = {
  id: string
  username: string
  password_hash: string
  role: UserRole
  created_at: string
}

let db: Database.Database | null = null

function authDbPath(): string {
  return join(dataDir(), 'auth', 'auth.db')
}

export function getAuthDb(): Database.Database {
  if (db) return db
  const dir = join(dataDir(), 'auth')
  mkdirSync(dir, { recursive: true })
  db = new Database(authDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export function countUsers(): number {
  const row = getAuthDb().prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }
  return row.c
}

export function needsSetup(): boolean {
  return countUsers() === 0
}

export function getUserById(id: string): AuthUser | null {
  const row = getAuthDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  return row ? rowToUser(row) : null
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  }
}

export function isAuthDisabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const v = process.env.SELFDASHBOARD_AUTH_DISABLED?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function listUsers(): AuthUser[] {
  const rows = getAuthDb()
    .prepare('SELECT * FROM users ORDER BY username COLLATE NOCASE')
    .all() as UserRow[]
  return rows.map(rowToUser)
}

function getAllowedPluginIds(userId: string, role: UserRole): string[] | null {
  if (isAuthDisabled() || role === 'admin') return null
  const rows = getAuthDb()
    .prepare('SELECT plugin_id FROM user_allowed_plugins WHERE user_id = ? ORDER BY plugin_id')
    .all(userId) as { plugin_id: string }[]
  return rows.map((r) => r.plugin_id)
}

export function isPluginAllowed(userId: string, role: UserRole, pluginId: string): boolean {
  if (isAuthDisabled() || role === 'admin') return true
  const allowed = getAllowedPluginIds(userId, role)
  if (!allowed) return true
  return allowed.includes(pluginId)
}
