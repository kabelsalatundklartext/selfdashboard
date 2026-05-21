import { NextResponse } from 'next/server'
import { seedCustomPluginManifests } from '@/lib/pluginVolumeInfo'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'

export const dynamic = 'force-dynamic'

/** Copy built-in `plugin.json` stubs into the mounted custom folder (once per plugin id). */
export async function POST() {
  const { copied, skipped } = seedCustomPluginManifests()
  const catalog = reloadPluginCatalog(new Set(BUILTIN_PLUGIN_IDS))
  return NextResponse.json({
    ok: true,
    copied,
    skipped,
    customRoot: process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim() || '(default plugins/custom)',
    count: catalog.length,
    hint:
      'Add widget.js and/or server.js per plugin folder. Override built-in UI by placing widget.js on the volume. Reload in Plugin Store or restart container for server.js.',
  })
}
