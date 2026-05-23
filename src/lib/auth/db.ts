import 'server-only'
import { mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { applyEnvPasswordReset } from '@/lib/auth/envReset'
import { authDbPath, authDir } from '@/lib/auth/paths'

let db: Database.Database | null = null

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      remember INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_allowed_plugins (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id TEXT NOT NULL,
      PRIMARY KEY (user_id, plugin_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_allowed_plugins_user ON user_allowed_plugins(user_id);
  `)
  ensureColumn(database, 'users', 'totp_secret', 'TEXT')
  ensureColumn(database, 'users', 'totp_enabled', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(database, 'sessions', 'mfa_verified', 'INTEGER NOT NULL DEFAULT 1')
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_backup_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user ON user_backup_codes(user_id);
  `)
}

function ensureColumn(database: Database.Database, table: string, column: string, def: string) {
  const cols = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (cols.some((c) => c.name === column)) return
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`)
}

export function getAuthDb(): Database.Database {
  if (db) return db
  mkdirSync(authDir(), { recursive: true })
  const path = authDbPath()
  db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  applyEnvPasswordReset()
  return db
}
