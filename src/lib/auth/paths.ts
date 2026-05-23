import { join } from 'path'
import { dataDir } from '@/lib/dataDir'

export const AUTH_COOKIE = 'sd_session'

export function authDir(): string {
  return join(dataDir(), 'auth')
}

export function authDbPath(): string {
  return join(authDir(), 'auth.db')
}

export function usersDataDir(): string {
  return join(dataDir(), 'users')
}

export function userDashboardPath(userId: string): string {
  return join(usersDataDir(), userId, 'dashboard.json')
}

export function legacyDashboardPath(): string {
  return join(dataDir(), 'dashboard.json')
}
