export type { CaldavFetchErrorCode, CaldavWriteAction } from '@/lib/caldavSync'
export {
  discoverCalDavCalendars,
  fetchCalDavOccurrencesTsdav as fetchCalDavOccurrences,
  writeCalDavAllDayEvent,
} from '@/lib/caldavSync'
export type {
  CaldavDiscoverCalendar,
  CaldavDiscoverResult,
  CaldavFetchResult,
  CaldavWriteResult,
} from '@/lib/caldavSync'
