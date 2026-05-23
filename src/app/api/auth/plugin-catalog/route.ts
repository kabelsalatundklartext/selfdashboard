import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getPluginGrantWarning, listKnownPluginIds } from '@/lib/auth/pluginPolicy'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const plugins = listKnownPluginIds().map((id) => ({
    id,
    warning: getPluginGrantWarning(id),
    highRisk: getPluginGrantWarning(id) != null,
  }))
  return NextResponse.json({ plugins })
}
