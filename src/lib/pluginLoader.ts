// This file is imported once at app startup to register all built-in plugins.
// External plugins do the same via registerPlugin() from their own package.

import { registerPlugin } from '@/lib/pluginRegistry'

import * as bookmarks from '../../plugins/bookmarks'
import * as clock from '../../plugins/clock'
import * as docker from '../../plugins/docker'
import * as emby from '../../plugins/emby'
import * as scratchpad from '../../plugins/scratchpad'
import * as unraid from '../../plugins/unraid'
import * as zoraxy from '../../plugins/zoraxy'

export function loadBuiltinPlugins() {
  registerPlugin(bookmarks.meta, bookmarks.component)
  registerPlugin(clock.meta, clock.component)
  registerPlugin(docker.meta, docker.component)
  registerPlugin(emby.meta, emby.component)
  registerPlugin(scratchpad.meta, scratchpad.component)
  registerPlugin(unraid.meta, unraid.component)
  registerPlugin(zoraxy.meta, zoraxy.component)
}
