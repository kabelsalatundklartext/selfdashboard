import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { isPluginAllowed } from '@/lib/auth/pluginPolicy'
import { resolveKioskAccess } from '@/lib/kiosk/kioskViewRequest'
import { readKioskAccessFromRequest } from '@/lib/kiosk/session'
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

function buildVolumePayload(
  installedFiltered: string[],
  widgetsFiltered: string[],
  overridesFiltered: string[],
  serversFiltered: string[],
  missingWidgetJs: string[],
) {
  return {
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
  }
}

export async function GET(req: Request) {
  const widgetOverrideIds = getCustomWidgetOverrideIds()
  const customWidgetIds = listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js'))
  const customServerIds = getCustomServerPluginIds()
  const installedIds = listInstalledVolumePluginIds()
  const missingWidgetJs = installedIds.filter((id) => !hasVolumeFile(id, 'widget.js'))

  const kioskView = resolveKioskAccess(req)
  if (kioskView) {
    return NextResponse.json(
      buildVolumePayload(
        filterIdsForKiosk(installedIds, kioskView.pluginIds),
        filterIdsForKiosk(customWidgetIds, kioskView.pluginIds),
        filterIdsForKiosk(widgetOverrideIds, kioskView.pluginIds),
        filterIdsForKiosk(customServerIds, kioskView.pluginIds),
        missingWidgetJs,
      ),
    )
  }

  const kiosk = readKioskAccessFromRequest(req)
  const auth = requireAuth(req)

  if (auth instanceof NextResponse) {
    if (kiosk) {
      return NextResponse.json(
        buildVolumePayload(
          filterIdsForKiosk(installedIds, kiosk.pluginIds),
          filterIdsForKiosk(customWidgetIds, kiosk.pluginIds),
          filterIdsForKiosk(widgetOverrideIds, kiosk.pluginIds),
          filterIdsForKiosk(customServerIds, kiosk.pluginIds),
          missingWidgetJs,
        ),
      )
    }
    return auth
  }

  return NextResponse.json(
    buildVolumePayload(
      filterIdsForUser(installedIds, auth.userId, auth.role),
      filterIdsForUser(customWidgetIds, auth.userId, auth.role),
      filterIdsForUser(widgetOverrideIds, auth.userId, auth.role),
      filterIdsForUser(customServerIds, auth.userId, auth.role),
      missingWidgetJs,
    ),
  )
}
