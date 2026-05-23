import { NextResponse } from 'next/server'
import { getKioskAccessFromRequest, requireAuth } from '@/lib/auth/guard'
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

function filterIdsForKiosk(ids: string[], kioskPluginIds: string[]) {
  const allowed = new Set(kioskPluginIds)
  return ids.filter((id) => allowed.has(id))
}

export async function GET(req: Request) {
  const kiosk = getKioskAccessFromRequest(req)
  const auth = requireAuth(req)
  if (auth instanceof NextResponse && !kiosk) return auth

  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js'))
  const customServerIds = getCustomServerPluginIds()
  const installedIds = listInstalledVolumePluginIds()
  const missingWidgetJs = installedIds.filter((id) => !hasVolumeFile(id, 'widget.js'))

  let installedFiltered: string[]
  let widgetsFiltered: string[]
  let overridesFiltered: string[]
  let serversFiltered: string[]

  if (kiosk && auth instanceof NextResponse) {
    installedFiltered = filterIdsForKiosk(installedIds, kiosk.pluginIds)
    widgetsFiltered = filterIdsForKiosk(customWidgetIds, kiosk.pluginIds)
    overridesFiltered = filterIdsForKiosk(widgetOverrideIds, kiosk.pluginIds)
    serversFiltered = filterIdsForKiosk(customServerIds, kiosk.pluginIds)
  } else if (!(auth instanceof NextResponse)) {
    installedFiltered = filterIdsForUser(installedIds, auth.userId, auth.role)
    widgetsFiltered = filterIdsForUser(customWidgetIds, auth.userId, auth.role)
    overridesFiltered = filterIdsForUser(widgetOverrideIds, auth.userId, auth.role)
    serversFiltered = filterIdsForUser(customServerIds, auth.userId, auth.role)
  } else {
    return auth
  }

  return NextResponse.json({
    customRoot: getCustomPluginsRoot(),
    volumeOnly: true,
    installedIds: installedFiltered,
    missingWidgetJs: missingWidgetJs.filter((id) => installedFiltered.includes(id)),
    widgetOverrideIds: overridesFiltered,
    customWidgetIds: widgetsFiltered,
    customServerIds: serversFiltered,
    hint:
      missingWidgetJs.length > 0
        ? 'plugin.json without widget.js — install from Store or upload a ZIP with widget.js.'
        : undefined,
  })
}
