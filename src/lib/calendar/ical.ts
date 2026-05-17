/**
 * iCalendar (RFC 5545) helpers — building, parsing, expanding recurrences.
 *
 * Uses `ical.js` (Mozilla) for parsing and `rrule` for recurrence expansion
 * because `ical.js`'s recurrence iterator doesn't always handle EXDATE +
 * RDATE merges identically across servers. `rrule` is the de-facto standard.
 *
 * We always preserve the original VCALENDAR blob in `event.icalData`. When
 * the user edits an event we rebuild the blob from scratch — this loses
 * vendor-specific X-* properties on edited events but is a deliberate V1
 * simplification. Untouched events stay byte-identical.
 */

import ICAL from 'ical.js'
import { RRule, rrulestr } from 'rrule'
import { randomUUID } from 'node:crypto'

import { CalendarEvent, ExpandedEvent } from './types'

// ---------------------------------------------------------------------------
// date helpers
// ---------------------------------------------------------------------------

export function newUid(): string {
  return `${randomUUID()}@selfdashboard`
}

/** Normalize stored dtstart/dtend for all-day events (YYYY-MM-DD). */
export function normalizeEventTimes(body: {
  dtstart: string
  dtend?: string
  allDay?: boolean
}): { dtstart: string; dtend?: string } {
  if (!body.allDay) return { dtstart: body.dtstart, dtend: body.dtend }
  const day = (s: string) => (s.length >= 10 ? s.slice(0, 10) : s)
  return {
    dtstart: day(body.dtstart),
    dtend: body.dtend ? day(body.dtend) : undefined,
  }
}

/** Normalise any datetime input to UTC ISO; date-only stays YYYY-MM-DD. */
export function toIso(value: Date | string): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    return new Date(value).toISOString()
  }
  return value.toISOString()
}

function isAllDayString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function asDate(s: string): Date {
  if (isAllDayString(s)) return new Date(s + 'T00:00:00Z')
  return new Date(s)
}

// ---------------------------------------------------------------------------
// build VCALENDAR for push
// ---------------------------------------------------------------------------

export interface BuildInput {
  uid: string
  summary?: string
  description?: string
  location?: string
  dtstart: string
  dtend?: string
  allDay: boolean
  rrule?: string
  lastModifiedIso?: string
}

export function buildVcalendar(input: BuildInput): string {
  const cal = new ICAL.Component(['vcalendar', [], []])
  cal.updatePropertyWithValue('prodid', '-//SelfDashboard//Calendar Plugin//EN')
  cal.updatePropertyWithValue('version', '2.0')
  cal.updatePropertyWithValue('calscale', 'GREGORIAN')

  const ev = new ICAL.Component('vevent')
  ev.updatePropertyWithValue('uid', input.uid)
  ev.updatePropertyWithValue('dtstamp', ICAL.Time.now())

  if (input.summary) ev.updatePropertyWithValue('summary', input.summary)
  if (input.description) ev.updatePropertyWithValue('description', input.description)
  if (input.location) ev.updatePropertyWithValue('location', input.location)

  // dtstart / dtend
  if (input.allDay) {
    const d = asDate(input.dtstart)
    const startTime = ICAL.Time.fromDateString(d.toISOString().slice(0, 10))
    startTime.isDate = true
    ev.updatePropertyWithValue('dtstart', startTime)
    const endStr = input.dtend
      ? asDate(input.dtend).toISOString().slice(0, 10)
      : new Date(d.getTime() + 86400_000).toISOString().slice(0, 10)
    const endTime = ICAL.Time.fromDateString(endStr)
    endTime.isDate = true
    ev.updatePropertyWithValue('dtend', endTime)
  } else {
    const startTime = ICAL.Time.fromJSDate(asDate(input.dtstart), true)
    ev.updatePropertyWithValue('dtstart', startTime)
    if (input.dtend) {
      const endTime = ICAL.Time.fromJSDate(asDate(input.dtend), true)
      ev.updatePropertyWithValue('dtend', endTime)
    }
  }

  if (input.rrule) {
    // ical.js accepts a recur structure or a string via fromString
    const recur = ICAL.Recur.fromString(input.rrule)
    ev.updatePropertyWithValue('rrule', recur)
  }

  if (input.lastModifiedIso) {
    ev.updatePropertyWithValue('last-modified', ICAL.Time.fromJSDate(new Date(input.lastModifiedIso), true))
  }

  cal.addSubcomponent(ev)
  return cal.toString()
}

// ---------------------------------------------------------------------------
// parse VCALENDAR blob
// ---------------------------------------------------------------------------

export interface ParsedEvent {
  uid: string
  summary?: string
  description?: string
  location?: string
  dtstart: string
  dtend?: string
  allDay: boolean
  rrule?: string
  remoteModifiedIso?: string
}

export function parseVcalendar(blob: string): ParsedEvent[] {
  const out: ParsedEvent[] = []
  let jcal: any
  try {
    jcal = ICAL.parse(blob)
  } catch {
    return out
  }
  const comp = new ICAL.Component(jcal)
  const events = comp.getAllSubcomponents('vevent')
  for (const ev of events) {
    // skip recurrence overrides — we only want the master
    if (ev.getFirstPropertyValue('recurrence-id')) continue

    const dtstart = ev.getFirstProperty('dtstart')
    if (!dtstart) continue
    const dtstartVal = dtstart.getFirstValue() as ICAL.Time

    const dtend = ev.getFirstProperty('dtend')
    const dtendVal = dtend?.getFirstValue() as ICAL.Time | undefined

    const allDay = dtstartVal.isDate

    const rrule = ev.getFirstProperty('rrule')
    let rruleStr: string | undefined
    if (rrule) {
      const v = rrule.getFirstValue()
      // ICAL.Recur#toString returns "FREQ=...;..." without the "RRULE:" prefix
      rruleStr = typeof v === 'string' ? v : (v as ICAL.Recur).toString()
    }

    const lastMod = ev.getFirstPropertyValue('last-modified') as ICAL.Time | null
      ?? ev.getFirstPropertyValue('dtstamp') as ICAL.Time | null

    out.push({
      uid: String(ev.getFirstPropertyValue('uid') ?? newUid()),
      summary: ev.getFirstPropertyValue('summary')?.toString() ?? undefined,
      description: ev.getFirstPropertyValue('description')?.toString() ?? undefined,
      location: ev.getFirstPropertyValue('location')?.toString() ?? undefined,
      dtstart: allDay
        ? dtstartVal.toString().slice(0, 10)
        : dtstartVal.toJSDate().toISOString(),
      dtend: dtendVal
        ? (allDay ? dtendVal.toString().slice(0, 10) : dtendVal.toJSDate().toISOString())
        : undefined,
      allDay,
      rrule: rruleStr,
      remoteModifiedIso: lastMod ? lastMod.toJSDate().toISOString() : undefined,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// recurrence expansion
// ---------------------------------------------------------------------------

/**
 * Expand events with RRULE into individual instances within [rangeStart, rangeEnd).
 * Events without RRULE are passed through if they intersect the range.
 *
 * Recurrence overrides (RECURRENCE-ID instances) are NOT expanded here in V1;
 * we treat them as the master series. Most home users won't notice.
 */
export function expandRecurrences(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  calendarLookup: (id: string) => { name?: string; color?: string },
): ExpandedEvent[] {
  const out: ExpandedEvent[] = []
  for (const ev of events) {
    const meta = calendarLookup(ev.calendarId)
    const base: ExpandedEvent = {
      ...ev,
      calendarName: meta.name,
      calendarColor: meta.color,
      isRecurrenceInstance: false,
    }

    if (!ev.rrule) {
      const start = asDate(ev.dtstart)
      if (start >= rangeStart && start < rangeEnd) out.push(base)
      continue
    }

    try {
      const dtstart = asDate(ev.dtstart)
      // rrule library wants UTC dates; we encode all-day as midnight UTC
      const rule = rrulestr(`DTSTART:${dtstart.toISOString().replace(/[-:]|\.\d{3}/g, '')}\nRRULE:${ev.rrule}`)
      const instances = rule.between(rangeStart, rangeEnd, true)
      let durationMs = 0
      if (ev.dtend) durationMs = asDate(ev.dtend).getTime() - dtstart.getTime()
      for (const inst of instances) {
        const instEnd = durationMs > 0 ? new Date(inst.getTime() + durationMs) : undefined
        out.push({
          ...base,
          dtstart: ev.allDay ? inst.toISOString().slice(0, 10) : inst.toISOString(),
          dtend: instEnd
            ? (ev.allDay ? instEnd.toISOString().slice(0, 10) : instEnd.toISOString())
            : undefined,
          isRecurrenceInstance: true,
          recurrenceId: inst.toISOString(),
        })
      }
    } catch {
      // malformed rrule — fall back to the master instance alone
      const start = asDate(ev.dtstart)
      if (start >= rangeStart && start < rangeEnd) out.push(base)
    }
  }
  return out
}
