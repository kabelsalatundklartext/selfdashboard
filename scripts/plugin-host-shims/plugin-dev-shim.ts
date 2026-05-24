type PluginDevBridge = Pick<
  NonNullable<typeof globalThis.SelfDashboard>,
  'pluginApiJson' | 'pluginApiJsonWithStale' | 'reportPluginCatch' | 'reportPluginError'
>

function bridge(): PluginDevBridge {
  const h = globalThis.SelfDashboard
  if (!h?.pluginApiJson) {
    throw new Error('SelfDashboard plugin API bridge missing — reload the page (Ctrl+F5)')
  }
  return h as PluginDevBridge
}

export const pluginApiJson = ((...args: Parameters<PluginDevBridge['pluginApiJson']>) =>
  bridge().pluginApiJson(...args)) as PluginDevBridge['pluginApiJson']

export const pluginApiJsonWithStale = ((...args: Parameters<PluginDevBridge['pluginApiJsonWithStale']>) =>
  bridge().pluginApiJsonWithStale(...args)) as PluginDevBridge['pluginApiJsonWithStale']

export const reportPluginCatch = ((...args: Parameters<PluginDevBridge['reportPluginCatch']>) =>
  bridge().reportPluginCatch(...args)) as PluginDevBridge['reportPluginCatch']

export const reportPluginError = ((...args: Parameters<PluginDevBridge['reportPluginError']>) =>
  bridge().reportPluginError(...args)) as PluginDevBridge['reportPluginError']

export type { PluginLogOptions } from '../../src/lib/pluginLog'

export function formatErrorDetail(detail: unknown): string {
  if (detail == null) return ''
  if (typeof detail === 'string') return detail.slice(0, 500)
  try {
    return JSON.stringify(detail).slice(0, 500)
  } catch {
    return String(detail).slice(0, 500)
  }
}
