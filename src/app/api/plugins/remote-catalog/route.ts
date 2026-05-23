import { NextResponse } from 'next/server'
import { requirePluginManagement } from '@/lib/auth/pluginManagement'
import { listRemoteCatalogWithInstallState } from '@/lib/pluginGitHub'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requirePluginManagement(req)
  if (auth instanceof NextResponse) return auth
  const data = await listRemoteCatalogWithInstallState()
  return NextResponse.json(data)
}
