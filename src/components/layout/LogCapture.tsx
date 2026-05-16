'use client'

import { useEffect } from 'react'
import { reportClientLog } from '@/lib/reportLog'

/**
 * Captures uncaught browser errors and unhandled promise rejections into the server log.
 */
export function LogCapture() {
  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      const msg = ev.message || 'Unknown error'
      const loc = ev.filename ? `${ev.filename}:${ev.lineno ?? 0}` : undefined
      reportClientLog({
        level: 'error',
        source: 'app',
        category: 'window.onerror',
        message: msg,
        detail: loc,
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
      const detail = reason instanceof Error ? reason.stack?.slice(0, 2000) : undefined
      reportClientLog({
        level: 'error',
        source: 'app',
        category: 'unhandledrejection',
        message,
        detail,
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
