import { NextResponse } from 'next/server'
import { loadAllPluginServers } from '@/lib/pluginServerLoader'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'
import { getCustomWidgetOverrideIds } from '@/lib/pluginVolumeInfo'

export const dynamic = 'force-dynamic'

export async function POST() {
  await loadAllPluginServers()
  const customServers = await reloadCustomPluginServers()
  const widgetIds = new Set([
    ...BUILTIN_PLUGIN_IDS.filter((id) => !getCustomWidgetOverrideIds().includes(id)),
    ...getCustomWidgetOverrideIds(),
  ])
  const catalog = reloadPluginCatalog(widgetIds)
  return NextResponse.json({
    ok: true,
    count: catalog.length,
    customServers,
    plugins: catalog,
    hint:
      'Manifeste und server.js neu geladen. Nach widget.js-Änderung: Seite hart neu laden (Strg+F5). Nur plugin.json: Store ↻ reicht.',
  })
}
