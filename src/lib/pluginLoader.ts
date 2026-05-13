// Registers built-in plugins at app startup (compiled into the image — not bind-mounted on Unraid).
// To add a plugin: import + registerPlugin() below, then rebuild the Docker image. See README and docs/PLUGIN_DEV.md.

import { registerPlugin } from '@/lib/pluginRegistry'

import * as bookmarks from '../../plugins/bookmarks'
import * as clock from '../../plugins/clock'
import * as docker from '../../plugins/docker'
import * as emby from '../../plugins/emby'
import * as scratchpad from '../../plugins/scratchpad'
import * as unraid from '../../plugins/unraid'
import * as weather from '../../plugins/weather'

export function loadBuiltinPlugins() {
  registerPlugin(bookmarks.meta, bookmarks.component)
  registerPlugin(clock.meta, clock.component)
  registerPlugin(docker.meta, docker.component)
  registerPlugin(emby.meta, emby.component)
  registerPlugin(scratchpad.meta, scratchpad.component)
  registerPlugin(unraid.meta, unraid.component)
  registerPlugin(weather.meta, weather.component)
}
