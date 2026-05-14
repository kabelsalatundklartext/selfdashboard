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
