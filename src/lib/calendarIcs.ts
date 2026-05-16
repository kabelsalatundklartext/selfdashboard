import ICAL from 'ical.js'

export type IcsOccurrence = {
  /** Stabil pro Feed-Vorkommen (UID + Datum/Uhrzeit-Schlüssel). */
  stableId: string
  uid: string
  title: string
  /** Lokales Kalenderdatum YYYY-MM-DD. */
  date: string
  allDay: boolean
  /** Nur bei zeitgebundenem Termin, lokale Uhrzeit HH:mm. */
  timeLabel?: string
  /** CalDAV-Ressource (für Update/Delete). */
  objectUrl?: string
  etag?: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function localHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function registerTimezonesFromCalendar(root: InstanceType<typeof ICAL.Component>): void {
  for (const tzComp of root.getAllSubcomponents('vtimezone')) {
    try {
      ICAL.TimezoneService.register(ICAL.Timezone.fromData(tzComp))
    } catch {
      /* ignore broken VTIMEZONE */
    }
  }
}

function parseRoots(icsText: string): InstanceType<typeof ICAL.Component>[] {
  const raw = ICAL.parse(icsText)
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.map((j) => new ICAL.Component(j))
}

function statusCancelled(vevent: InstanceType<typeof ICAL.Component>): boolean {
  const st = vevent.getFirstPropertyValue('status')
  if (st == null) return false
  const s = String(st).toUpperCase()
  return s === 'CANCELLED'
}

/**
 * Extrahiert Vorkommen aus ICS-Text innerhalb [rangeStart, rangeEnd] (inklusive Tage).
 * Wiederkehrende Termine werden über {@link ICAL.Event#iterator} expandiert (begrenzt).
 */
export function expandIcsString(
  icsText: string,
  rangeStart: Date,
  rangeEnd: Date,
  options?: { maxOccurrencesPerEvent?: number },
): IcsOccurrence[] {
  const maxOcc = options?.maxOccurrencesPerEvent ?? 400
  const out: IcsOccurrence[] = []

  let roots: InstanceType<typeof ICAL.Component>[]
  try {
    roots = parseRoots(icsText)
  } catch {
    return out
  }

  for (const root of roots) {
    if (root.name === 'vcalendar') {
      registerTimezonesFromCalendar(root)
    }

    const vevents = root.getAllSubcomponents('vevent')
    for (const vevent of vevents) {
      if (statusCancelled(vevent)) continue

      try {
        const ev = new ICAL.Event(vevent)
        if (ev.isRecurrenceException()) continue

        const uid = String(ev.uid || vevent.getFirstPropertyValue('uid') || 'unknown')
        const baseTitle = (ev.summary || '').trim() || '(no title)'

        if (!ev.isRecurring()) {
          const start = ev.startDate
          const jsStart = start.toJSDate()
          const jsEnd = ev.endDate ? ev.endDate.toJSDate() : jsStart
          if (jsEnd < rangeStart || jsStart > rangeEnd) continue
          const allDay = start.isDate
          const date = toLocalYmd(jsStart)
          out.push({
            stableId: `${uid}::${date}::${allDay ? 'd' : jsStart.getTime()}`,
            uid,
            title: baseTitle,
            date,
            allDay,
            timeLabel: allDay ? undefined : localHm(jsStart),
          })
        } else {
          const iter = ev.iterator()
          let n = 0
          let occ: InstanceType<typeof ICAL.Time> | null
          while (n++ < maxOcc) {
            occ = iter.next()
            if (!occ) break
            const js = occ.toJSDate()
            if (js > rangeEnd) break
            if (js < rangeStart) continue
            let title = baseTitle
            try {
              const details = ev.getOccurrenceDetails(occ)
              const s = details.item?.summary
              if (typeof s === 'string' && s.trim()) title = s.trim()
            } catch {
              /* use baseTitle */
            }
            const allDay = occ.isDate
            const date = toLocalYmd(js)
            out.push({
              stableId: `${uid}::${occ.toString()}`,
              uid,
              title,
              date,
              allDay,
              timeLabel: allDay ? undefined : localHm(js),
            })
          }
        }
      } catch {
        /* defektes VEVENT überspringen */
      }
    }
  }

  return out
}

/** Nächstes Kalendertag (YYYY-MM-DD) für DTEND bei ganztägigen Terminen. */
export function nextYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y!, (m ?? 1) - 1, (d ?? 1) + 1, 12, 0, 0, 0)
  return toLocalYmd(dt)
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function newCalDavUid(): string {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  return `${base}@selfdashboard`
}

/** Ganztägiges VEVENT als iCalendar-Text (CalDAV PUT). */
export function buildAllDayVeventIcs(params: { uid: string; title: string; date: string }): string {
  return buildVeventIcs({ ...params, allDay: true })
}

function parseHm(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, m: min }
}

function localDtStamp(y: number, mo: number, d: number, h: number, mi: number): string {
  return `${y}${pad2(mo)}${pad2(d)}T${pad2(h)}${pad2(mi)}00`
}

/** VEVENT mit optionalem Zeitfenster (lokale Zeit, ohne TZID — kompatibel mit WEB.DE). */
export function buildVeventIcs(params: {
  uid: string
  title: string
  date: string
  allDay?: boolean
  startTime?: string
  endTime?: string
}): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z?$/, 'Z')
  const summary = escapeIcsText(params.title.trim().slice(0, 240) || '(no title)')
  const [y, mo, d] = params.date.split('-').map(Number)
  if (!y || !mo || !d) {
    return buildAllDayVeventIcs({ uid: params.uid, title: params.title, date: params.date })
  }

  const timed = params.allDay !== true && params.startTime && params.endTime
  if (!timed) {
    const dtStart = params.date.replace(/-/g, '')
    const dtEnd = nextYmd(params.date).replace(/-/g, '')
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SelfDashboard//CalDAV//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${params.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
  }

  const st = parseHm(params.startTime!) ?? { h: 9, m: 0 }
  let en = parseHm(params.endTime!) ?? { h: 10, m: 0 }
  let endY = y
  let endMo = mo
  let endD = d
  if (st.h * 60 + st.m >= en.h * 60 + en.m) {
    const next = new Date(y, mo - 1, d + 1, 12, 0, 0, 0)
    endY = next.getFullYear()
    endMo = next.getMonth() + 1
    endD = next.getDate()
    if (en.h === st.h && en.m === st.m) {
      en = { h: st.h + 1 > 23 ? 23 : st.h + 1, m: st.m }
    }
  }
  const dtStart = localDtStamp(y, mo, d, st.h, st.m)
  const dtEnd = localDtStamp(endY, endMo, endD, en.h, en.m)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SelfDashboard//CalDAV//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
