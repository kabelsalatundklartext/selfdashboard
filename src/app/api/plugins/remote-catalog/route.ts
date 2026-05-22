import { NextResponse } from 'next/server'
import { listRemoteCatalogWithInstallState } from '@/lib/pluginGitHub'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await listRemoteCatalogWithInstallState()
  return NextResponse.json(data)
}
