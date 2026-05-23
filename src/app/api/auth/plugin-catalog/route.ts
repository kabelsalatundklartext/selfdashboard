import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { HIGH_RISK_PLUGIN_IDS, listKnownPluginIds } from '@/lib/auth/pluginPolicy'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const plugins = listKnownPluginIds().map((id) => ({
    id,
    highRisk: HIGH_RISK_PLUGIN_IDS.has(id),
  }))
  return NextResponse.json({ plugins })
}
