'use client'

export type PluginVolumeLoadPhase = 'pending' | 'loading' | 'ready' | 'error'

let phase: PluginVolumeLoadPhase = 'pending'
let version = 0
const listeners = new Set<() => void>()

function notify() {
  version += 1
  listeners.forEach((fn) => fn())
}

export function getPluginVolumeLoadPhase(): PluginVolumeLoadPhase {
  return phase
}

export function getPluginVolumeLoadVersion(): number {
  return version
}

export function subscribePluginVolumeLoad(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function setPluginVolumeLoadPhase(next: PluginVolumeLoadPhase): void {
  if (phase === next) return
  phase = next
  notify()
}

/** SSR / hydration: treat as still loading so we never flash "not found" on first paint. */
export function getPluginVolumeLoadServerSnapshot(): PluginVolumeLoadPhase {
  return 'loading'
}
