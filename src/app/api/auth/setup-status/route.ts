import { NextResponse } from 'next/server'
import { needsSetup } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ needsSetup: needsSetup() })
}
