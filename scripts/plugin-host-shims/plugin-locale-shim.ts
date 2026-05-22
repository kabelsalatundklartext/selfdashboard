/** Esbuild shim: locale hook from the host app store. */
export function usePluginLocale(): ReturnType<
  NonNullable<typeof globalThis.SelfDashboard>['usePluginLocale']
> {
  const fn = globalThis.SelfDashboard?.usePluginLocale
  if (!fn) {
    throw new Error('SelfDashboard.usePluginLocale missing — reload the page (Ctrl+F5)')
  }
  return fn()
}
