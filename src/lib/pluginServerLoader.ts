/**
 * Registers built-in plugin server handlers (compiled into the image).
 * Add one import + registerPluginServerHandler() per plugin with `server.ts`.
 */
import { registerPluginServerHandler } from '@/lib/pluginServerRegistry'
import { adguardServerHandler } from '../../plugins/adguard/server'
import { mailServerHandler } from '../../plugins/mail/server'
import { startMailScheduler } from '@/lib/mail/sync'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'

let loaded = false

export function loadBuiltinPluginServers(): void {
  if (loaded) return
  loaded = true

  registerPluginServerHandler('adguard', adguardServerHandler)
  registerPluginServerHandler('mail', mailServerHandler)
  startMailScheduler()
}

export async function loadAllPluginServers(): Promise<void> {
  loadBuiltinPluginServers()
  await reloadCustomPluginServers()
}
