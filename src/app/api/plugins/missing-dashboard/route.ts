import { NextResponse } from 'next/server'
import { listMissingDashboardPlugins } from '@/lib/pluginInstallMissing'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await listMissingDashboardPlugins()
  return NextResponse.json(data)
}
