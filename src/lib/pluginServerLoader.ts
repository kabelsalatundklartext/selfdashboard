/**
 * Registers core plugin server handlers compiled into the image (mail, adguard).
 * Other plugins may ship server.js on the volume.
 */
import { registerPluginServerHandler } from '@/lib/pluginServerRegistry'
import { adguardServerHandler } from '@/lib/pluginServers/adguard'
import { mailServerHandler } from '@/lib/pluginServers/mail'
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
