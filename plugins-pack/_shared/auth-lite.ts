import { mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { dataDir } from './data-dir'

export type UserRole = 'admin' | 'user'

export type AuthUser = {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

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

function getAuthDb(): Database.Database {
  if (db) return db
  const dir = join(dataDir(), 'auth')
  mkdirSync(dir, { recursive: true })
  db = new Database(authDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
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
