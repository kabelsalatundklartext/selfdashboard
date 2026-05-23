export type UserRole = 'admin' | 'user'

export type AuthUser = {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

export type SessionInfo = {
  id: string
  userId: string
  username: string
  role: UserRole
  expiresAt: string
  mfaVerified: boolean
}

export type AuthSettings = {
  rememberDays: number
  sessionHours: number
}
