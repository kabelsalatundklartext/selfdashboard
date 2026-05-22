import { NextResponse } from 'next/server'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import {
  getCustomServerPluginIds,
  getCustomWidgetOverrideIds,
  hasVolumeFile,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'
export const dynamic = 'force-dynamic'

export async function GET() {
  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js'))
  const customServerIds = getCustomServerPluginIds()
  const installedIds = listInstalledVolumePluginIds()
  const missingWidgetJs = installedIds.filter((id) => !hasVolumeFile(id, 'widget.js'))

  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    volumeOnly: true,
    installedIds,
    missingWidgetJs,
    widgetOverrideIds,
    customWidgetIds,
    customServerIds,
    hint:
      missingWidgetJs.length > 0
        ? 'plugin.json without widget.js — install from Store or upload a ZIP with widget.js.'
        : undefined,
  })
}
