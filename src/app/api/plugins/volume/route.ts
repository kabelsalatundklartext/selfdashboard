import { NextResponse } from 'next/server'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import {
  getCustomServerPluginIds,
  getCustomWidgetOverrideIds,
  hasVolumeFile,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'
import { isVolumeOnlyPlugins } from '@/lib/pluginMode'

export const dynamic = 'force-dynamic'

export async function GET() {
  const volumeOnly = isVolumeOnlyPlugins()
  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = volumeOnly
    ? listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js'))
    : widgetOverrideIds
  const customServerIds = getCustomServerPluginIds()
  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    volumeOnly,
    installedIds: listInstalledVolumePluginIds(),
    widgetOverrideIds,
    customWidgetIds,
    customServerIds,
  })
}
