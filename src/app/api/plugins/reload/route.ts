import { NextResponse } from 'next/server'
import { loadAllPluginServers } from '@/lib/pluginServerLoader'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'
import { clearGitHubPluginIndexCache } from '@/lib/pluginGitHub'

export const dynamic = 'force-dynamic'

export async function POST() {
  clearGitHubPluginIndexCache()
  await loadAllPluginServers()
  const customServers = await reloadCustomPluginServers()
  const catalog = reloadPluginCatalog(getWidgetLoadedIdsForCatalog())
  return NextResponse.json({
    ok: true,
    count: catalog.length,
    customServers,
    plugins: catalog,
    hint:
      'Manifeste und server.js neu geladen. Nach widget.js-Änderung: Seite hart neu laden (Strg+F5). Nur plugin.json: Store ↻ reicht.',
  })
}
