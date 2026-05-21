/**
 * Registers built-in plugin server handlers (compiled into the image).
 * Add one import + registerPluginServerHandler() per plugin with `server.ts`.
 */
import { registerPluginServerHandler } from '@/lib/pluginServerRegistry'
import { adguardServerHandler } from '../../plugins/adguard/server'

let loaded = false

export function loadBuiltinPluginServers(): void {
  if (loaded) return
  loaded = true

  registerPluginServerHandler('adguard', adguardServerHandler)

  // TODO (Beta): fritzbox, fritz-energy, crowdsec, docker, calendar, …
}
