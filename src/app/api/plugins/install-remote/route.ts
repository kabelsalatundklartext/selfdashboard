import { NextResponse } from 'next/server'
import { installPluginFromGitHub, clearGitHubPluginIndexCache } from '@/lib/pluginGitHub'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
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

  clearGitHubPluginIndexCache()
  const result = await installPluginFromGitHub(pluginId)
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 })
  }

  await reloadCustomPluginServers()
  const catalog = reloadPluginCatalog(getWidgetLoadedIdsForCatalog())

  const hint =
    'source' in result && result.source === 'bundled_pack'
      ? 'Aus Image-Pack installiert (GitHub plugins-pack noch ohne Dateien). Seite neu laden (Strg+F5).'
      : 'Seite neu laden (Strg+F5), damit das Widget im Store aktiv wird.'

  return NextResponse.json({
    ...result,
    ok: true,
    hint,
    catalog,
  })
}
