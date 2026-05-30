import ICAL from 'ical.js'
import { randomUUID } from 'node:crypto'

export function newUid(): string {
  return `${randomUUID()}@selfdashboard`
}

export interface ParsedVtodo {
  uid: string
  summary: string
  completed: boolean
  due?: string
  remoteModifiedIso?: string
}

function parseStatus(comp: ICAL.Component): boolean {
  const status = comp.getFirstPropertyValue('status')
  if (typeof status === 'string' && status.toUpperCase() === 'COMPLETED') return true
  const completed = comp.getFirstPropertyValue('completed')
  return Boolean(completed)
}

function parseDue(comp: ICAL.Component): string | undefined {
  const due = comp.getFirstPropertyValue('due')
  if (!due) return undefined
  if (due instanceof ICAL.Time) {
    if (due.isDate) return due.toString().slice(0, 10)
    return due.toJSDate().toISOString()
  }
  return String(due)
}

function parseLastModified(comp: ICAL.Component): string | undefined {
  const lm = comp.getFirstPropertyValue('last-modified')
  if (lm instanceof ICAL.Time) return lm.toJSDate().toISOString()
  return undefined
}

export function parseVcalendarTodos(data: string): ParsedVtodo[] {
  if (!data?.trim()) return []
  try {
    const jcal = ICAL.parse(data)
    const comp = new ICAL.Component(jcal)
    const out: ParsedVtodo[] = []
    for (const sub of comp.getAllSubcomponents('vtodo')) {
      const uidProp = sub.getFirstPropertyValue('uid')
      const uid = typeof uidProp === 'string' ? uidProp : ''
      if (!uid) continue
      const summaryProp = sub.getFirstPropertyValue('summary')
      out.push({
        uid,
        summary: typeof summaryProp === 'string' ? summaryProp.trim() : '',
        completed: parseStatus(sub),
        due: parseDue(sub),
        remoteModifiedIso: parseLastModified(sub),
      })
    }
    return out
  } catch {
    return []
  }
}

export interface BuildVtodoInput {
  uid: string
  summary: string
  completed: boolean
  due?: string
  lastModifiedIso?: string
}

/** Synology-safe: no VALARM blocks. */
export function buildVtodo(input: BuildVtodoInput): string {
  const cal = new ICAL.Component(['vcalendar', [], []])
  cal.updatePropertyWithValue('prodid', '-//SelfDashboard//Tasks Plugin//EN')
  cal.updatePropertyWithValue('version', '2.0')

  const todo = new ICAL.Component('vtodo')
  todo.updatePropertyWithValue('uid', input.uid)
  todo.updatePropertyWithValue('dtstamp', ICAL.Time.now())
  todo.updatePropertyWithValue('summary', input.summary || '—')
  todo.updatePropertyWithValue('status', input.completed ? 'COMPLETED' : 'NEEDS-ACTION')
  if (input.completed) {
    todo.updatePropertyWithValue('completed', ICAL.Time.now())
  }
  if (input.due) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.due)) {
      const t = ICAL.Time.fromDateString(input.due)
      t.isDate = true
      todo.updatePropertyWithValue('due', t)
    } else {
      todo.updatePropertyWithValue('due', ICAL.Time.fromJSDate(new Date(input.due), true))
    }
  }
  if (input.lastModifiedIso) {
    todo.updatePropertyWithValue('last-modified', ICAL.Time.fromJSDate(new Date(input.lastModifiedIso), true))
  }

  cal.addSubcomponent(todo)
  return cal.toString()
}
