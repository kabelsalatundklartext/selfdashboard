import { NextResponse } from 'next/server'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import { getCustomServerPluginIds, getCustomWidgetOverrideIds } from '@/lib/pluginVolumeInfo'

export const dynamic = 'force-dynamic'

export async function GET() {
  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = widgetOverrideIds
  const customServerIds = getCustomServerPluginIds()
  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    widgetOverrideIds,
    customWidgetIds,
    customServerIds,
  })
}
