/** Next.js instrumentation — runs once on server start (Node.js runtime only). */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warnInsecureProductionEnv } = await import('@/lib/auth/productionGuard')
    warnInsecureProductionEnv()
    const { ensureDefaultPluginsOnVolume } = await import('@/lib/pluginVolumeExtract')
    ensureDefaultPluginsOnVolume()
    const { warmPluginScan } = await import('@/lib/pluginScan')
    const { loadAllPluginServers } = await import('@/lib/pluginServerLoader')
    const { listInstalledVolumePluginIds } = await import('@/lib/pluginVolumeInfo')
    warmPluginScan()
    await loadAllPluginServers()
    if (listInstalledVolumePluginIds().includes('calendar')) {
      const { startScheduler } = await import('@/lib/calendar/sync')
      startScheduler()
    }
    if (listInstalledVolumePluginIds().includes('tasks')) {
      const { importVolumeServerModule } = await import('@/lib/pluginCustomServer')
      const mod = await importVolumeServerModule('tasks')
      if (typeof mod?.startScheduler === 'function') {
        ;(mod.startScheduler as () => void)()
      }
    }
  }
}
