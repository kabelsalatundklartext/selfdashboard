import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth/service'
import { applyClearSessionCookie } from '@/lib/auth/sessionResponse'

export const dynamic = 'force-dynamic'

export async function POST() {
  await logout()
  const res = NextResponse.json({ ok: true })
  return applyClearSessionCookie(res)
}
