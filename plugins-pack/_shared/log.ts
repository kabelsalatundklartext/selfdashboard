/** Plugin server logging — bundle-safe for plugins-pack/server.mjs (no Next.js imports). */

export async function logPluginApiFailure(
  pluginId: string,
  operation: string,
  message: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : ''
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`)
}
