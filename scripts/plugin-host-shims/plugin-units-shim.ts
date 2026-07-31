/** Esbuild shim: unit system hook from the host app store. */
export function usePluginUnitSystem(): ReturnType<
  NonNullable<typeof globalThis.SelfDashboard>['usePluginUnitSystem']
> {
  const fn = globalThis.SelfDashboard?.usePluginUnitSystem
  if (!fn) {
    throw new Error('SelfDashboard.usePluginUnitSystem missing — reload the page (Ctrl+F5)')
  }
  return fn()
}
