import { NextResponse } from 'next/server'
import { loadAllPluginServers } from '@/lib/pluginServerLoader'
import { getCustomWidgetOverrideIds } from '@/lib/pluginVolumeInfo'
import { getPluginCatalogCached } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'

export const dynamic = 'force-dynamic'

export async function GET() {
  await loadAllPluginServers()
  const widgetIds = new Set([
    ...BUILTIN_PLUGIN_IDS.filter((id) => !getCustomWidgetOverrideIds().includes(id)),
    ...getCustomWidgetOverrideIds(),
  ])
  const catalog = getPluginCatalogCached(widgetIds)
  return NextResponse.json({ plugins: catalog, scannedAt: new Date().toISOString() })
}
