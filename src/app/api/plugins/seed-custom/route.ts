import { NextResponse } from 'next/server'
import { seedCustomPluginManifests } from '@/lib/pluginVolumeInfo'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'
import { isVolumeOnlyPlugins } from '@/lib/pluginMode'

export const dynamic = 'force-dynamic'

/** Copy built-in `plugin.json` stubs into the mounted custom folder (once per plugin id). */
export async function POST() {
  if (isVolumeOnlyPlugins()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'volume_mode',
        hint:
          'Plugin Mode=volume: keine Image-Stubs kopieren. Plugins über „Von GitHub“ installieren oder ZIP hochladen.',
      },
      { status: 400 },
    )
  }
  const { copied, skipped } = seedCustomPluginManifests()
  const catalog = reloadPluginCatalog(new Set(BUILTIN_PLUGIN_IDS))
  return NextResponse.json({
    ok: true,
    copied,
    skipped,
    customRoot: process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim() || '(default plugins/custom)',
    count: catalog.length,
    hint:
      'Nur plugin.json-Kopien aus dem Image (keine widget.js). Für echte Plugins: „Von GitHub“ → Installieren. Bei Plugin Mode=volume erscheinen Image-Plugins im Store nicht mehr.',
  })
}
