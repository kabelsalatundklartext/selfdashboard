import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import {
  registerPluginServerHandler,
  unregisterPluginServerHandler,
  type PluginServerContext,
  type PluginServerHandler,
} from '@/lib/pluginServerRegistry'
import { customPluginDir, getCustomServerPluginIds } from '@/lib/pluginVolumeInfo'

const loadedCustomServerIds = new Set<string>()

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

async function importVolumeServer(id: string): Promise<PluginServerHandler | null> {
  const modulePath = resolveServerModulePath(id)
  if (!modulePath) return null
  const url = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
  const mod = (await import(url)) as {
    default?: PluginServerHandler
    handler?: PluginServerHandler
    adguardServerHandler?: PluginServerHandler
  }
  const raw = mod.default ?? mod.handler ?? mod.adguardServerHandler
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

  const ids = getCustomServerPluginIds()
  for (const id of ids) {
    const handler = await importVolumeServer(id)
    if (!handler) continue
    registerPluginServerHandler(id, handler, { source: 'custom', replace: true })
    loadedCustomServerIds.add(id)
  }
  return ids
}
