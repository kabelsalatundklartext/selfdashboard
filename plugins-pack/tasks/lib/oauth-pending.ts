import { randomBytes } from 'node:crypto'

type Pending = {
  userId: string
  accountId: string
  expiresAt: number
}

const pending = new Map<string, Pending>()
const TTL_MS = 15 * 60 * 1000

export function createOAuthState(userId: string, accountId: string): string {
  const state = randomBytes(24).toString('hex')
  pending.set(state, { userId, accountId, expiresAt: Date.now() + TTL_MS })
  return state
}

export function consumeOAuthState(state: string): Pending | null {
  const row = pending.get(state)
  if (!row) return null
  pending.delete(state)
  if (row.expiresAt < Date.now()) return null
  return row
}
