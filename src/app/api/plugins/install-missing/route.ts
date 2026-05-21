import { NextResponse } from 'next/server'
import { clearGitHubPluginIndexCache } from '@/lib/pluginGitHub'
import { installMissingDashboardPlugins } from '@/lib/pluginInstallMissing'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { pluginIds?: string[] } = {}
  try {
    body = (await req.json()) as { pluginIds?: string[] }
  } catch {
    /* empty body ok */
  }

  clearGitHubPluginIndexCache()
  const result = await installMissingDashboardPlugins(body.pluginIds)
  if (result.installed.length > 0) {
    await reloadCustomPluginServers()
    reloadPluginCatalog(getWidgetLoadedIdsForCatalog())
  }

  const status = result.failed.length > 0 && result.installed.length === 0 ? 502 : 200
  return NextResponse.json(result, { status })
}
