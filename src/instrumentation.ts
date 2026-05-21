/** Next.js instrumentation — runs once on server start (Node.js runtime only). */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmPluginScan } = await import('@/lib/pluginScan')
    const { loadAllPluginServers } = await import('@/lib/pluginServerLoader')
    const { ensureDefaultPluginsOnVolume } = await import('@/lib/pluginVolumeExtract')
    ensureDefaultPluginsOnVolume()
    warmPluginScan()
    await loadAllPluginServers()
    const { startScheduler } = await import('@/lib/calendar/sync')
    startScheduler()
    const { startMailScheduler } = await import('@/lib/mail/sync')
    startMailScheduler()
  }
}
