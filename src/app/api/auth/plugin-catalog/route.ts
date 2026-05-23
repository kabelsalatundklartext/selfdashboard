import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getPluginGrantWarning, listKnownPluginIds } from '@/lib/auth/pluginPolicy'
import { getPluginStoreMeta } from '@/lib/pluginStoreMeta'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const plugins = listKnownPluginIds().map((id) => {
    const warning = getPluginGrantWarning(id)
    const meta = getPluginStoreMeta(id)
    return {
      id,
      name: meta?.name ?? id,
      warning,
      highRisk: warning != null,
    }
  })
  return NextResponse.json({ plugins })
}
