import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { isPluginAllowed } from '@/lib/auth/pluginPolicy'
import { getCustomPluginsRoot } from '@/lib/pluginPaths'
import {
  getCustomServerPluginIds,
  getCustomWidgetOverrideIds,
  hasVolumeFile,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'
export const dynamic = 'force-dynamic'

function filterIdsForUser(ids: string[], userId: string, role: 'admin' | 'user') {
  return ids.filter((id) => isPluginAllowed(userId, role, id))
}

export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js'))
  const customServerIds = getCustomServerPluginIds()
  const installedIds = listInstalledVolumePluginIds()
  const missingWidgetJs = installedIds.filter((id) => !hasVolumeFile(id, 'widget.js'))

  const installedFiltered = filterIdsForUser(installedIds, auth.userId, auth.role)
  const widgetsFiltered = filterIdsForUser(customWidgetIds, auth.userId, auth.role)
  const overridesFiltered = filterIdsForUser(widgetOverrideIds, auth.userId, auth.role)

  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    volumeOnly: true,
    installedIds: installedFiltered,
    missingWidgetJs: missingWidgetJs.filter((id) => installedFiltered.includes(id)),
    widgetOverrideIds: overridesFiltered,
    customWidgetIds: widgetsFiltered,
    customServerIds: filterIdsForUser(customServerIds, auth.userId, auth.role),
    hint:
      missingWidgetJs.length > 0
        ? 'plugin.json without widget.js — install from Store or upload a ZIP with widget.js.'
        : undefined,
  })
}
