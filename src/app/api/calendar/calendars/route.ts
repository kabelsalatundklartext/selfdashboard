/**
 * GET /api/calendar/calendars        — list all calendars (across all accounts)
 */

import { ok } from '@/lib/calendar/api-helpers'
import { readStore } from '@/lib/calendar/store'

export async function GET() {
  const store = await readStore()
  return ok(store.calendars)
}
