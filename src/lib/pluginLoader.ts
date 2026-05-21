// Registers built-in plugin widgets at app startup (compiled into the image).
// Metadata: `plugins/<id>/plugin.json` (scanned on server — see docs/BETA_PLUGIN_ARCH.md).
// Server APIs: `plugins/<id>/server.ts` + `/api/plugins/<id>/…` gateway.
// To add a plugin: copy plugins/_template, import + registerPlugin() below, rebuild the image.

import { registerPlugin } from '@/lib/pluginRegistry'

import * as bookmarks from '../../plugins/bookmarks'
import * as calendarPlugin from '../../plugins/calendar'
import * as clock from '../../plugins/clock'
import * as iframe from '../../plugins/iframe'
import * as docker from '../../plugins/docker'
import * as emby from '../../plugins/emby'
import * as adguard from '../../plugins/adguard'
import * as pihole from '../../plugins/pihole'
import * as scratchpad from '../../plugins/scratchpad'
import * as unraid from '../../plugins/unraid'
import * as unraidDocker from '../../plugins/unraid-docker'
import * as fritzbox from '../../plugins/fritzbox'
import * as fritzEnergy from '../../plugins/fritz-energy'
import * as weather from '../../plugins/weather'
import * as crowdsec from '../../plugins/crowdsec'
import * as selfstream from '../../plugins/selfstream'

export function loadBuiltinPlugins(skipIds?: ReadonlySet<string>) {
  const reg = (meta: typeof bookmarks.meta, component: typeof bookmarks.component) => {
    if (skipIds?.has(meta.id)) return
    registerPlugin(meta, component)
  }
  reg(bookmarks.meta, bookmarks.component)
  reg(calendarPlugin.meta, calendarPlugin.component)
  reg(clock.meta, clock.component)
  reg(iframe.meta, iframe.component)
  reg(docker.meta, docker.component)
  reg(emby.meta, emby.component)
  reg(adguard.meta, adguard.component)
  reg(pihole.meta, pihole.component)
  reg(fritzbox.meta, fritzbox.component)
  reg(fritzEnergy.meta, fritzEnergy.component)
  reg(scratchpad.meta, scratchpad.component)
  reg(unraid.meta, unraid.component)
  reg(unraidDocker.meta, unraidDocker.component)
  reg(weather.meta, weather.component)
  reg(crowdsec.meta, crowdsec.component)
  reg(selfstream.meta, selfstream.component)
}
