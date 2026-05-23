import { NextResponse } from 'next/server'
import { requirePluginManagement } from '@/lib/auth/pluginManagement'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'
import { uninstallPluginFromVolume } from '@/lib/pluginUninstall'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requirePluginManagement(req)
  if (auth instanceof NextResponse) return auth
  let body: { pluginId?: string }
  try {
    body = (await req.json()) as { pluginId?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const pluginId = String(body.pluginId ?? '').trim()
  if (!pluginId) {
    return NextResponse.json({ error: 'missing_plugin_id' }, { status: 400 })
  }

  const result = uninstallPluginFromVolume(pluginId)
  if (!result.ok) {
    const status =
      result.error === 'plugin_not_installed'
        ? 404
        : result.error === 'invalid_plugin_id'
          ? 400
          : 500
    return NextResponse.json(result, { status })
  }

  await reloadCustomPluginServers()
  const catalog = reloadPluginCatalog(getWidgetLoadedIdsForCatalog())

  return NextResponse.json({
    ok: true,
    pluginId,
    hint: 'Plugin removed from disk. Hard-reload (Ctrl+F5). Remove widgets from the dashboard in edit mode if needed.',
    catalog,
    reloadPage: true,
  })
}
