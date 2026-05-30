import 'server-only'

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
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

type ServerModule = Record<string, unknown> & {
  default?: PluginServerHandler
  handler?: PluginServerHandler
}

async function loadVolumeServerModule(id: string): Promise<ServerModule | null> {
  const modulePath = resolveServerModulePath(id)
  if (!modulePath) return null

  try {
    if (modulePath.endsWith('.mjs')) {
      const url = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
      return (await import(/* webpackIgnore: true */ url)) as ServerModule
    }
    const req = createRequire(pathToFileURL(modulePath))
    delete req.cache[modulePath]
    return req(modulePath) as ServerModule
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[SelfDashboard] custom/${id}/server.* failed to load (${msg}). Reinstall plugin from store.`)
    return null
  }
}

/** Load exports from an installed plugin server.mjs (handler, startScheduler, …). */
export async function importVolumeServerModule(pluginId: string): Promise<ServerModule | null> {
  return loadVolumeServerModule(pluginId)
}

async function importVolumeServer(id: string): Promise<PluginServerHandler | null> {
  const mod = await loadVolumeServerModule(id)
  if (!mod) return null

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

  const loaded: string[] = []
  for (const id of getCustomServerPluginIds()) {
    const handler = await importVolumeServer(id)
    if (!handler) continue
    registerPluginServerHandler(id, handler, { source: 'custom', replace: true })
    loadedCustomServerIds.add(id)
    loaded.push(id)
  }
  return loaded
}
