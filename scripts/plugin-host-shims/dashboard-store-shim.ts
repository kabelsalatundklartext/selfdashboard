/**
 * Esbuild shim: volume widget.js must use the host Zustand store, not a bundled copy.
 */
type HostStore = typeof import('../../src/lib/store').useDashboardStore

function hostStore(): HostStore {
  const h = globalThis.SelfDashboard?.useDashboardStore
  if (!h) {
    throw new Error('SelfDashboard.useDashboardStore missing — reload the page (Ctrl+F5)')
  }
  return h
}

export const useDashboardStore = new Proxy(((...args: Parameters<HostStore>) => hostStore()(...args)) as HostStore, {
  get(_target, prop) {
    const h = hostStore() as HostStore & Record<string | symbol, unknown>
    const v = h[prop as keyof typeof h]
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(h) : v
  },
})
