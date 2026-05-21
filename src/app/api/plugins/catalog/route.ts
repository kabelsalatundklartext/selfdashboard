import { NextResponse } from 'next/server'
import { loadBuiltinPluginServers } from '@/lib/pluginServerLoader'
import { getPluginCatalogCached } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'

export const dynamic = 'force-dynamic'

loadBuiltinPluginServers()

export async function GET() {
  const widgetIds = new Set(BUILTIN_PLUGIN_IDS)
  const catalog = getPluginCatalogCached(widgetIds)
  return NextResponse.json({ plugins: catalog, scannedAt: new Date().toISOString() })
}
