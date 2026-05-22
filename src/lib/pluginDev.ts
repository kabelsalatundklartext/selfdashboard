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
 * @param path — e.g. `/` → `/api/plugins/<pluginId>/`, or full `/api/...`
 */
export async function pluginApiJson<T>(
  pluginId: string,
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const url = path.startsWith('/api/')
    ? path
    : `/api/plugins/${pluginId}${path.startsWith('/') ? path : `/${path}`}`
  const { timeoutMs, ...rest } = init ?? {}
  const ac = new AbortController()
  const timer =
    timeoutMs && timeoutMs > 0 ? setTimeout(() => ac.abort(), timeoutMs) : undefined
  try {
    const res = await fetch(url, {
      ...rest,
      signal: rest.signal ?? ac.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(rest.headers as Record<string, string> | undefined),
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
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('timeout')
    throw e
  } finally {
    if (timer) clearTimeout(timer)
  }
}
