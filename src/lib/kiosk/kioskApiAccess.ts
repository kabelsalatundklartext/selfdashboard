export { isPluginAllowedForKiosk, readKioskAccessFromRequest } from '@/lib/kiosk/session'
import { resolvePluginIdFromApiPath } from '@/lib/auth/pluginPolicy'
export { resolvePluginIdFromApiPath }

export function isKioskPluginApi(pathname: string): boolean {
  if (pathname === '/api/plugins/volume') return true
  const pluginId = resolvePluginIdFromApiPath(pathname)
  return pluginId !== null
}
