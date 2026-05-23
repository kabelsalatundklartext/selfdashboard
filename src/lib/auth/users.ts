import 'server-only'
import { randomUUID } from 'crypto'
import { getAuthDb } from '@/lib/auth/db'
import { hashPassword } from '@/lib/auth/password'
import type { AuthUser, UserRole } from '@/lib/auth/types'

type UserRow = {
  id: string
  username: string
  password_hash: string
  role: UserRole
  created_at: string
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  }
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

export function getUserByUsername(username: string): (AuthUser & { passwordHash: string }) | null {
  const row = getAuthDb()
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as UserRow | undefined
  if (!row) return null
  return { ...rowToUser(row), passwordHash: row.password_hash }
}

export function createUser(input: {
  username: string
  password: string
  role: UserRole
}): AuthUser {
  const id = randomUUID()
  const now = new Date().toISOString()
  const passwordHash = hashPassword(input.password)
  getAuthDb()
    .prepare(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(id, input.username.trim(), passwordHash, input.role, now)
  return { id, username: input.username.trim(), role: input.role, createdAt: now }
}

export function listUsers(): AuthUser[] {
  const rows = getAuthDb()
    .prepare('SELECT * FROM users ORDER BY username COLLATE NOCASE')
    .all() as UserRow[]
  return rows.map(rowToUser)
}

export function countAdmins(): number {
  const row = getAuthDb()
    .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
    .get() as { c: number }
  return row.c
}

export function deleteUser(id: string): boolean {
  const user = getUserById(id)
  if (!user) return false
  if (user.role === 'admin' && countAdmins() <= 1) {
    throw new Error('last_admin')
  }
  getAuthDb().prepare('DELETE FROM users WHERE id = ?').run(id)
  return true
}

export function updateUserRole(id: string, role: UserRole): AuthUser | null {
  const user = getUserById(id)
  if (!user) return null
  if (user.role === 'admin' && role !== 'admin' && countAdmins() <= 1) {
    throw new Error('last_admin')
  }
  getAuthDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  return getUserById(id)
}
