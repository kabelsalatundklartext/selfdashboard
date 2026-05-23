import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/guard'
import { getAllowedPluginIds } from '@/lib/auth/pluginPolicy'
import { isAuthDisabled } from '@/lib/auth/service'
import { needsSetup } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (needsSetup()) {
    return NextResponse.json({ needsSetup: true }, { status: 503 })
  }
  if (isAuthDisabled()) {
    return NextResponse.json({
      user: { id: 'dev', username: 'dev', role: 'admin' },
      allowedPlugins: null,
      authDisabled: true,
    })
  }
  const session = getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const allowedPlugins = getAllowedPluginIds(session.userId, session.role)
  return NextResponse.json({
    user: {
      id: session.userId,
      username: session.username,
      role: session.role,
    },
    /** `null` = alle Plugins (Admin). Sonst Whitelist. */
    allowedPlugins,
  })
}
