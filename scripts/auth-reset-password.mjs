#!/usr/bin/env node
/**
 * Reset a user password directly (host/container access = full trust).
 *
 * Usage:
 *   SELFDASHBOARD_DATA_DIR=/mnt/user/appdata/selfdashboard \
 *     node scripts/auth-reset-password.mjs --username admin --password 'NeuesPasswort'
 *
 * Docker:
 *   docker exec selfdashboard node /app/scripts/auth-reset-password.mjs --username admin --password 'NeuesPasswort'
 */
import { randomBytes, scryptSync } from 'crypto'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY_LEN = 64
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim()
  if (raw) return raw
  return path.join(__dirname, '..', 'data')
}

function hashPassword(password) {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

function parseArgs(argv) {
  let username = ''
  let password = ''
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--username' || a === '-u') username = String(argv[++i] ?? '')
    else if (a === '--password' || a === '-p') password = String(argv[++i] ?? '')
  }
  return { username: username.trim(), password }
}

function main() {
  const { username, password } = parseArgs(process.argv)
  if (!username || !password) {
    console.error('Usage: auth-reset-password.mjs --username NAME --password PASS')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const dbPath = path.join(dataDir(), 'auth', 'auth.db')
  if (!fs.existsSync(dbPath)) {
    console.error(`Auth database not found: ${dbPath}`)
    process.exit(1)
  }

  const db = new Database(dbPath)
  const row = db
    .prepare('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE')
    .get(username)
  if (!row) {
    console.error(`User not found: ${username}`)
    process.exit(1)
  }

  const passwordHash = hashPassword(password)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.id)
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.id)
  db.close()

  console.log(`Password reset for "${row.username}" (${row.id}). All sessions revoked.`)
}

main()
