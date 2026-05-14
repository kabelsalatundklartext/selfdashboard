// Registers built-in plugins at app startup (compiled into the image — not bind-mounted on Unraid).
// To add a plugin: import + registerPlugin() below, then rebuild the Docker image. See README and docs/PLUGIN_DEV.md.

import { registerPlugin } from '@/lib/pluginRegistry'

import * as bookmarks from '../../plugins/bookmarks'
import * as calendar from '../../plugins/calendar'
import * as clock from '../../plugins/clock'
import * as iframe from '../../plugins/iframe'
import * as docker from '../../plugins/docker'
import * as emby from '../../plugins/emby'
import * as adguard from '../../plugins/adguard'
import * as scratchpad from '../../plugins/scratchpad'
import * as unraid from '../../plugins/unraid'
import * as unraidDocker from '../../plugins/unraid-docker'
import * as weather from '../../plugins/weather'

export function loadBuiltinPlugins() {
  registerPlugin(bookmarks.meta, bookmarks.component)
  registerPlugin(calendar.meta, calendar.component)
  registerPlugin(clock.meta, clock.component)
  registerPlugin(iframe.meta, iframe.component)
  registerPlugin(docker.meta, docker.component)
  registerPlugin(emby.meta, emby.component)
  registerPlugin(adguard.meta, adguard.component)
  registerPlugin(scratchpad.meta, scratchpad.component)
  registerPlugin(unraid.meta, unraid.component)
  registerPlugin(unraidDocker.meta, unraidDocker.component)
  registerPlugin(weather.meta, weather.component)
}
