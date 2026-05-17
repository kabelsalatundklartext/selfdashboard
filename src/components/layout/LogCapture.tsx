'use client'

import { useEffect } from 'react'
import { installGlobalFetchLogger } from '@/lib/clientFetchLog'
import { formatErrorDetail } from '@/lib/pluginLog'
import { reportClientLog } from '@/lib/reportLog'

/**
 * Captures uncaught browser errors, unhandled rejections, and failed /api/* fetches
 * into the central server log (Settings → Protokoll).
 */
export function LogCapture() {
  useEffect(() => {
    installGlobalFetchLogger()

    const onError = (ev: ErrorEvent) => {
      const msg = ev.message || 'Unknown error'
      const loc = ev.filename ? `${ev.filename}:${ev.lineno ?? 0}:${ev.colno ?? 0}` : undefined
      const stack = ev.error instanceof Error ? ev.error.stack : undefined
      reportClientLog({
        level: 'error',
        source: 'app',
        category: 'window.onerror',
        message: msg,
        detail: [loc, stack].filter(Boolean).join('\n').slice(0, 4000) || undefined,
      })
    }

    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Unhandled promise rejection'
      reportClientLog({
        level: 'error',
        source: 'app',
        category: 'unhandledrejection',
        message,
        detail: formatErrorDetail(reason),
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
