// This file is imported once at app startup to register all built-in plugins.
// External plugins do the same via registerPlugin() from their own package.

import { registerPlugin } from '@/lib/pluginRegistry'

import * as bookmarks from '../../plugins/bookmarks'
import * as clock from '../../plugins/clock'
import * as unraid from '../../plugins/unraid'

export function loadBuiltinPlugins() {
  registerPlugin(bookmarks.meta, bookmarks.component)
  registerPlugin(clock.meta, clock.component)
  registerPlugin(unraid.meta, unraid.component)
}
