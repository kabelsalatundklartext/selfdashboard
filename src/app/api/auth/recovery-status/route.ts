import { NextResponse } from 'next/server'
import { isRecoveryConfigured } from '@/lib/auth/recovery'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ available: isRecoveryConfigured() })
}
