/**

 * Registers core plugin server handlers compiled into the image (mail, adguard, weather, …).

 * Other plugins may ship server.js on the volume.

 */

import { registerPluginServerHandler } from '@/lib/pluginServerRegistry'

import { adguardServerHandler } from '@/lib/pluginServers/adguard'

import { calendarServerHandler } from '@/lib/pluginServers/calendar'

import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'

import { crowdsecV2ServerHandler } from '@/lib/pluginServers/crowdsec-v2'

import { dockerServerHandler } from '@/lib/pluginServers/docker'

import { fritzEnergyServerHandler } from '@/lib/pluginServers/fritz-energy'

import { fritzboxServerHandler } from '@/lib/pluginServers/fritzbox'

import { mailServerHandler } from '@/lib/pluginServers/mail'

import { piholeServerHandler } from '@/lib/pluginServers/pihole'

import { selfstreamServerHandler } from '@/lib/pluginServers/selfstream'

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

  registerPluginServerHandler('crowdsec-v2', crowdsecV2ServerHandler)

  registerPluginServerHandler('docker', dockerServerHandler)

  registerPluginServerHandler('fritz-energy', fritzEnergyServerHandler)

  registerPluginServerHandler('fritzbox', fritzboxServerHandler)

  registerPluginServerHandler('mail', mailServerHandler)

  registerPluginServerHandler('pihole', piholeServerHandler)

  registerPluginServerHandler('selfstream', selfstreamServerHandler)

  registerPluginServerHandler('weather', weatherServerHandler)

  startMailScheduler()

}



export async function loadAllPluginServers(): Promise<void> {

  loadBuiltinPluginServers()

  await reloadCustomPluginServers()

}
