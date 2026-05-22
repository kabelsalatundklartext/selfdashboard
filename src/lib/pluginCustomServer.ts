import 'server-only'

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import {
  getPluginServerHandler,
  getPluginServerHandlerSource,
  registerPluginServerHandler,
  unregisterPluginServerHandler,
  type PluginServerContext,
  type PluginServerHandler,
} from '@/lib/pluginServerRegistry'
import {
  customPluginDir,
  getCustomServerPluginIds,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'

const loadedCustomServerIds = new Set<string>()
const quarantinedLegacyServers = new Set<string>()

function volumeServerOverrideEnabled(): boolean {
  const v = process.env.SELFDASHBOARD_VOLUME_PLUGIN_SERVER?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/** Legacy plugin packs shipped broken server.mjs (Next.js bundled). Disable by default. */
function quarantineLegacyVolumeServers(): number {
  if (volumeServerOverrideEnabled()) return 0
  let n = 0
  for (const id of listInstalledVolumePluginIds()) {
    for (const file of ['server.mjs', 'server.js'] as const) {
      const p = path.join(customPluginDir(id), file)
      if (!fs.existsSync(p)) continue
      const bak = `${p}.bak`
      if (quarantinedLegacyServers.has(p)) continue
      try {
        if (fs.existsSync(bak)) fs.unlinkSync(bak)
        fs.renameSync(p, bak)
        quarantinedLegacyServers.add(p)
        n++
      } catch {
        /* read-only volume */
      }
    }
  }
  return n
}

function resolveServerModulePath(id: string): string | null {
  const dir = customPluginDir(id)
  const candidates = ['server.mjs', 'server.js']
  for (const file of candidates) {
    const p = path.join(dir, file)
    if (path.resolve(p).startsWith(path.resolve(dir)) && path.basename(p) === file && fs.existsSync(p)) {
      return p
    }
  }
  return null
}

function wrapVolumeHandler(id: string, fn: (ctx: PluginServerContext) => Promise<Response>): PluginServerHandler {
  return (ctx) => fn(ctx)
}

type ServerModule = {
  default?: PluginServerHandler
  handler?: PluginServerHandler
}

async function importVolumeServer(id: string): Promise<PluginServerHandler | null> {
  const modulePath = resolveServerModulePath(id)
  if (!modulePath) return null

  let mod: ServerModule
  try {
    if (modulePath.endsWith('.mjs')) {
      const url = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
      mod = (await import(/* webpackIgnore: true */ url)) as ServerModule
    } else {
      const req = createRequire(pathToFileURL(modulePath))
      delete req.cache[modulePath]
      mod = req(modulePath) as ServerModule
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(
      `[SelfDashboard] custom/${id}/server.* skipped (${msg}). ` +
        'Using builtin API from the image. To remove: delete server.mjs under plugins/custom/' +
        `${id}/ or set SELFDASHBOARD_VOLUME_PLUGIN_SERVER=1 after rebuilding plugin-pack.`,
    )
    return null
  }

  const raw = mod.default ?? mod.handler
  if (typeof raw !== 'function') {
    console.warn(`[SelfDashboard] custom/${id}/server.*: no default export handler`)
    return null
  }
  return wrapVolumeHandler(id, raw as PluginServerHandler)
}

export async function loadCustomPluginServers(): Promise<string[]> {
  return reloadCustomPluginServers()
}

export async function reloadCustomPluginServers(): Promise<string[]> {
  for (const id of loadedCustomServerIds) {
    unregisterPluginServerHandler(id)
  }
  loadedCustomServerIds.clear()

  if (!volumeServerOverrideEnabled()) {
    const moved = quarantineLegacyVolumeServers()
    if (moved > 0) {
      console.info(
        `[SelfDashboard] ${moved} legacy plugins/custom/*/server.mjs → *.bak (API uses builtin in image). ` +
          'Delete *.bak or set SELFDASHBOARD_VOLUME_PLUGIN_SERVER=1 only with a rebuilt plugin-pack.',
      )
    }
    return []
  }

  const ids = getCustomServerPluginIds()
  for (const id of ids) {
    if (getPluginServerHandler(id) && getPluginServerHandlerSource(id) === 'builtin') {
      continue
    }
    const handler = await importVolumeServer(id)
    if (!handler) continue
    registerPluginServerHandler(id, handler, { source: 'custom', replace: true })
    loadedCustomServerIds.add(id)
  }
  return ids
}
