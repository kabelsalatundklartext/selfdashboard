import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { getAllowedPluginIds, getPluginGrantWarning, listKnownPluginIds } from '@/lib/auth/pluginPolicy'
import { getGitHubPluginConfig, installPluginFromGitHub } from '@/lib/pluginGitHub'
import { getPluginStoreMeta } from '@/lib/pluginStoreMeta'
import { hasVolumeFile } from '@/lib/pluginVolumeInfo'

export const dynamic = 'force-dynamic'

async function ensureWidgetFile(pluginId: string): Promise<{ ready: boolean; error?: string }> {
  if (hasVolumeFile(pluginId, 'widget.js')) return { ready: true }
  if (!getGitHubPluginConfig()) return { ready: false, error: 'github_not_configured' }
  const r = await installPluginFromGitHub(pluginId)
  return r.ok ? { ready: true } : { ready: false, error: r.error }
}

/** Plugin picker for non-admin users: metadata for widgets they may add. */
export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const allowed = getAllowedPluginIds(auth.userId, auth.role)
  const ids = allowed === null ? listKnownPluginIds() : allowed

  const plugins = []

  for (const id of ids) {
    const meta = getPluginStoreMeta(id)
    if (!meta) continue
    const widgetReady = (await ensureWidgetFile(id)).ready
    plugins.push({
      ...meta,
      warning: getPluginGrantWarning(id),
      widgetReady,
      installed: widgetReady,
    })
  }

  return NextResponse.json({ plugins })
}
