import { NextResponse } from 'next/server'
import { loadBuiltinPluginServers } from '@/lib/pluginServerLoader'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'

export const dynamic = 'force-dynamic'

loadBuiltinPluginServers()

export async function POST() {
  const widgetIds = new Set(BUILTIN_PLUGIN_IDS)
  const catalog = reloadPluginCatalog(widgetIds)
  return NextResponse.json({
    ok: true,
    count: catalog.length,
    plugins: catalog,
    hint: 'Builtin widgets still require a page reload or image rebuild; custom manifests are refreshed immediately.',
  })
}
