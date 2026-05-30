import { NextResponse } from 'next/server'
import { requireAuth, requirePluginAccess } from '@/lib/auth/guard'
import { getGitHubPluginConfig, installPluginFromGitHub } from '@/lib/pluginGitHub'
import { hasVolumeFile } from '@/lib/pluginVolumeInfo'

export const dynamic = 'force-dynamic'

/** Ensure `widget.js` on volume for a plugin the user may add (avoids `/api/plugins/[pluginId]` catch-all). */
export async function POST(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  let body: { pluginId?: string }
  try {
    body = (await req.json()) as { pluginId?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const pluginId = String(body.pluginId ?? '').trim().toLowerCase()
  if (!pluginId || !/^[a-z0-9][a-z0-9-]*$/.test(pluginId)) {
    return NextResponse.json({ error: 'invalid_plugin_id' }, { status: 400 })
  }

  const denied = requirePluginAccess(req, pluginId)
  if (denied instanceof NextResponse) return denied

  if (hasVolumeFile(pluginId, 'widget.js')) {
    return NextResponse.json({ ok: true, pluginId, ready: true, source: 'volume' })
  }

  const cfg = getGitHubPluginConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error: 'github_not_configured',
        hint:
          'widget.js fehlt auf dem Server. Admin: Kalender einmal im Plugin-Store installieren (als Admin), oder SELFDASHBOARD_PLUGINS_GITHUB_REPO in Unraid setzen.',
      },
      { status: 503 },
    )
  }

  const result = await installPluginFromGitHub(pluginId)
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error ?? 'install_failed',
        hint: result.hint,
        pluginId,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    pluginId,
    ready: true,
    source: 'github',
    written: result.written,
  })
}
