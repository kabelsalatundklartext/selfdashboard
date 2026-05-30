import 'server-only'

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
const customServerLoadErrors = new Map<string, string>()

export function getCustomServerLoadErrors(): Record<string, string> {
  return Object.fromEntries(customServerLoadErrors)
}

function resolveServerModulePath(id: string): string | null {
  const dir = customPluginDir(id)
  const candidates = ['server.cjs', 'server.mjs', 'server.js']
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
  default?: PluginServerHandler | ServerModule
  handler?: PluginServerHandler
  tasksServerHandler?: PluginServerHandler
}

function resolveServerHandlerExport(mod: ServerModule | null): PluginServerHandler | null {
  if (!mod) return null
  const nested =
    mod.default && typeof mod.default === 'object' ? (mod.default as ServerModule) : null
  const candidates: unknown[] = [
    mod.handler,
    mod.tasksServerHandler,
    mod.default,
    nested?.default,
    nested?.handler,
    nested?.tasksServerHandler,
  ]
  for (const c of candidates) {
    if (typeof c === 'function') return c as PluginServerHandler
  }
  return null
}

async function loadVolumeServerModule(id: string): Promise<ServerModule | null> {
  const modulePath = resolveServerModulePath(id)
  if (!modulePath) return null

  try {
    const url = `${pathToFileURL(modulePath).href}?t=${Date.now()}`
    return (await import(/* webpackIgnore: true */ url)) as ServerModule
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    customServerLoadErrors.set(id, msg)
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

  const raw = resolveServerHandlerExport(mod)
  if (!raw) {
    console.warn(`[SelfDashboard] custom/${id}/server.*: no default export handler`)
    return null
  }
  return wrapVolumeHandler(id, raw)
}

export async function loadCustomPluginServers(): Promise<string[]> {
  return reloadCustomPluginServers()
}

export async function reloadCustomPluginServers(): Promise<string[]> {
  for (const id of loadedCustomServerIds) {
    unregisterPluginServerHandler(id)
  }
  loadedCustomServerIds.clear()
  customServerLoadErrors.clear()

  const loaded: string[] = []
  for (const id of getCustomServerPluginIds()) {
    const handler = await importVolumeServer(id)
    if (!handler) {
      if (!customServerLoadErrors.has(id) && !resolveServerModulePath(id)) {
        customServerLoadErrors.set(id, 'server API missing on volume')
      } else if (!customServerLoadErrors.has(id)) {
        customServerLoadErrors.set(id, 'no default export handler')
      }
      continue
    }
    customServerLoadErrors.delete(id)
    registerPluginServerHandler(id, handler, { source: 'custom', replace: true })
    loadedCustomServerIds.add(id)
    loaded.push(id)
  }
  return loaded
}
