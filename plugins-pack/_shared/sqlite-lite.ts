import { createRequire } from 'node:module'
import path from 'node:path'

type SqliteDatabase = import('better-sqlite3').Database
type SqliteConstructor = new (filename: string) => SqliteDatabase

let DatabaseCtor: SqliteConstructor | null = null

/** Load better-sqlite3 from the app image (`process.cwd()/node_modules`), not from the plugin folder. */
export function openSqliteDatabase(filename: string): SqliteDatabase {
  if (!DatabaseCtor) {
    const req = createRequire(path.join(process.cwd(), 'package.json'))
    const mod = req('better-sqlite3') as SqliteConstructor & { default?: SqliteConstructor }
    DatabaseCtor = (mod.default ?? mod) as SqliteConstructor
  }
  return new DatabaseCtor(filename)
}
