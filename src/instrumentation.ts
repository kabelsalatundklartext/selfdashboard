/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * SelfDashboard already uses this file for some other init work; if it
 * doesn't exist yet in your tree, create it. The calendar block guards
 * the import so that it doesn't run during edge runtime / build time.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/calendar/sync')
    startScheduler()
  }
}
