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
  const installedIds = listInstalledVolumePluginIds()
  const missingWidgetJs = installedIds.filter((id) => !hasVolumeFile(id, 'widget.js'))

  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    volumeOnly,
    installedIds,
    missingWidgetJs,
    widgetOverrideIds,
    customWidgetIds,
    customServerIds,
    hint:
      missingWidgetJs.length > 0
        ? 'plugin.json without widget.js — copy widget.js or use hybrid mode. index.tsx from the repo does not work on the volume.'
        : undefined,
  })
}
