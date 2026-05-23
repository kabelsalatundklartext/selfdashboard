import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { getAllowedPluginIds, getPluginGrantWarning, listKnownPluginIds } from '@/lib/auth/pluginPolicy'
import { getPluginStoreMeta } from '@/lib/pluginStoreMeta'

export const dynamic = 'force-dynamic'

/** Plugin picker for non-admin users: metadata for widgets they may add. */
export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const allowed = getAllowedPluginIds(auth.userId, auth.role)
  const ids = allowed === null ? listKnownPluginIds() : allowed

  const plugins = ids
    .map((id) => {
      const meta = getPluginStoreMeta(id)
      if (!meta) return null
      return {
        ...meta,
        warning: getPluginGrantWarning(id),
      }
    })
    .filter((p): p is NonNullable<typeof p> => p != null)

  return NextResponse.json({ plugins })
}
