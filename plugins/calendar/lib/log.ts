/** Lightweight logging for volume-bundled server.mjs (no Next.js / server-only). */

export async function logPluginApiFailure(
  pluginId: string,
  operation: string,
  message: string,
): Promise<void> {
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}`)
}
