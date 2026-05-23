#!/usr/bin/env node
/**
 * Generate a one-time recovery token file for password reset via /recover.
 *
 * Usage (host with appdata mounted):
 *   SELFDASHBOARD_DATA_DIR=/mnt/user/appdata/selfdashboard node scripts/auth-recovery-token.mjs
 *
 * Docker:
 *   docker exec selfdashboard node /app/scripts/auth-recovery-token.mjs
 */
import { randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim()
  if (raw) return raw
  return path.join(__dirname, '..', 'data')
}

function main() {
  const authDir = path.join(dataDir(), 'auth')
  fs.mkdirSync(authDir, { recursive: true })
  const token = randomBytes(32).toString('base64url')
  const filePath = path.join(authDir, 'recovery.token')
  fs.writeFileSync(filePath, `${token}\n`, { mode: 0o600 })
  console.log('Recovery token written to:')
  console.log(`  ${filePath}`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Open /recover in the browser')
  console.log('  2. Enter token, username, and new password')
  console.log('  3. Token file is deleted after successful reset')
}

main()
