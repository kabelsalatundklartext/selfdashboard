/**
 * Helpers for plugin authors (browser / widget code only).
 * Import from here in `plugins/<id>/index.tsx` — do not import server-only modules.
 */

export { formatErrorDetail, reportPluginCatch, reportPluginError } from '@/lib/pluginLog'
export type { PluginLogOptions } from '@/lib/pluginLog'

/**
 * Call same-origin SelfDashboard API routes from a widget.
 * Failed responses are logged automatically (Settings → Protokoll) via the global fetch hook.
 *
 * @param pluginId — must match `meta.id`
 * @param path — e.g. `/status` → `/api/<pluginId>/status`, or full `/api/...`
 */
export async function pluginApiJson<T>(
  pluginId: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('/api/')
    ? path
    : `/api/${pluginId}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = (await res.json()) as { error?: string; message?: string }
      msg = j.error ?? j.message ?? msg
    } catch {
      /* body not json */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
