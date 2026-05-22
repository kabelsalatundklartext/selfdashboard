/** Esbuild shim: `t()` from host i18n (avoids duplicating translation tables in widget.js). */
export type Locale = 'en' | 'de'

export function t(locale: Locale, key: string): string {
  const fn = globalThis.SelfDashboard?.t
  if (!fn) {
    throw new Error('SelfDashboard.t missing — reload the page (Ctrl+F5)')
  }
  return fn(locale, key as never)
}
