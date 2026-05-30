/**
 * Registers core plugin server handlers compiled into the image (mail, adguard, weather, …).
 * Store-only API plugins (pihole, selfstream, uptime-kuma) ship server.mjs on the volume only.
 */

import {
  getPluginServerHandler,
  registerPluginServerHandler,
} from '@/lib/pluginServerRegistry'

import { adguardServerHandler } from '@/lib/pluginServers/adguard'
import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'
import { dockerServerHandler } from '@/lib/pluginServers/docker'
import { fritzEnergyServerHandler } from '@/lib/pluginServers/fritz-energy'
import { fritzboxServerHandler } from '@/lib/pluginServers/fritzbox'
import { mailServerHandler } from '@/lib/pluginServers/mail'
import { weatherServerHandler } from '@/lib/pluginServers/weather'

import { startMailScheduler } from '@/lib/mail/sync'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'

let loaded = false

export function loadBuiltinPluginServers(): void {
  if (loaded) return
  loaded = true

  registerPluginServerHandler('adguard', adguardServerHandler)
  registerPluginServerHandler('calendar', calendarServerHandler)
  registerPluginServerHandler('crowdsec', crowdsecServerHandler)
  registerPluginServerHandler('docker', dockerServerHandler)
  registerPluginServerHandler('fritz-energy', fritzEnergyServerHandler)
  registerPluginServerHandler('fritzbox', fritzboxServerHandler)
  registerPluginServerHandler('mail', mailServerHandler)
  registerPluginServerHandler('weather', weatherServerHandler)
}

export async function loadAllPluginServers(): Promise<void> {
  loadBuiltinPluginServers()
  await reloadCustomPluginServers()
  if (getPluginServerHandler('mail')) {
    startMailScheduler()
  }
}
