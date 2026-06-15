'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Liefert ein Ref + ein `active`-Flag, das nur dann true ist, wenn das Element
 * sichtbar (Browser-Tab im Vordergrund) UND im Viewport ist.
 *
 * Polling-Widgets hängen ihre Intervalle an `active` und pausieren so im
 * Hintergrund-Tab sowie wenn sie aus dem Sichtbereich gescrollt wurden — das
 * spart unnötige Netzwerk-/Proxy-Last (z. B. Kamera-Snapshots, API-Polls).
 */
export function usePollingActive<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(true)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, active: visible && inView }
}
