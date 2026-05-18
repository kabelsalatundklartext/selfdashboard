'use client'

import { useSyncExternalStore } from 'react'

/** Tablet / schmale Desktop-Leiste (wie Navbar-Suche). */
export const NAVBAR_COMPACT_MQ = '(max-width: 1023px)'
/** Smartphone — noch weniger Platz in der Aktionsleiste. */
export const NAVBAR_PHONE_MQ = '(max-width: 639px)'

function subscribeMq(query: string, cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function snapshotMq(query: string) {
  return window.matchMedia(query).matches
}

export function useNavbarCompact() {
  const compact = useSyncExternalStore(
    (cb) => subscribeMq(NAVBAR_COMPACT_MQ, cb),
    () => snapshotMq(NAVBAR_COMPACT_MQ),
    () => false,
  )
  const phone = useSyncExternalStore(
    (cb) => subscribeMq(NAVBAR_PHONE_MQ, cb),
    () => snapshotMq(NAVBAR_PHONE_MQ),
    () => false,
  )
  return { compact, phone }
}
