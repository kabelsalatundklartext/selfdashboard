import { NextResponse } from 'next/server'
import { loadAllPluginServers } from '@/lib/pluginServerLoader'
import { getPluginCatalogCached } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'

export const dynamic = 'force-dynamic'

export async function GET() {
  await loadAllPluginServers()
  const catalog = getPluginCatalogCached(getWidgetLoadedIdsForCatalog())
  return NextResponse.json({ plugins: catalog, scannedAt: new Date().toISOString() })
}
