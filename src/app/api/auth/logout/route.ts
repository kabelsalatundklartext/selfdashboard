import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth/service'

export const dynamic = 'force-dynamic'

export async function POST() {
  await logout()
  return NextResponse.json({ ok: true })
}
