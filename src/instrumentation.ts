/** Next.js instrumentation — runs once on server start (Node.js runtime only). */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/calendar/sync')
    startScheduler()
  }
}
