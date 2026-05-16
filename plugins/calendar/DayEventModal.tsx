'use client'

import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export type DayEventModalLocalEvent = {
  id: string
  title: string
  date: string
  allDay?: boolean
  startTime?: string
  endTime?: string
  caldavUid?: string
}

export type DayEventModalRemoteEvent = {
  id: string
  title: string
  timeLabel?: string | null
  feedName?: string
  sourceKind: 'caldav' | 'ics'
}

export type EventEditDraft = {
  id: string
  title: string
  date: string
  allDay: boolean
  startTime: string
  endTime: string
}

function eventTimeLabel(ev: { allDay?: boolean; startTime?: string; endTime?: string }, de: boolean): string {
  if (ev.allDay === true || (!ev.startTime && ev.allDay !== false)) {
    return de ? 'ganztägig' : 'all day'
  }
  if (ev.startTime && ev.endTime) return `${ev.startTime}–${ev.endTime}`
  return ev.startTime ?? ''
}

function EventTimeFields({
  de,
  allDay,
  startTime,
  endTime,
  onAllDay,
  onStart,
  onEnd,
  inpStyle,
}: {
  de: boolean
  allDay: boolean
  startTime: string
  endTime: string
  onAllDay: (v: boolean) => void
  onStart: (v: string) => void
  onEnd: (v: string) => void
  inpStyle: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <input type="checkbox" checked={allDay} onChange={(e) => onAllDay(e.target.checked)} />
        {de ? 'Ganztägig' : 'All day'}
      </label>
      {!allDay ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {de ? 'Von' : 'From'}
            </span>
            <input style={inpStyle} type="time" value={startTime} onChange={(e) => onStart(e.target.value)} />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {de ? 'Bis' : 'To'}
            </span>
            <input style={inpStyle} type="time" value={endTime} onChange={(e) => onEnd(e.target.value)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function DayEventModal({
  open,
  de,
  pickerLabel,
  dayTitleLabel,
  closeLabel,
  emptyDayLabel,
  titleLabel,
  dateLabel,
  saveLabel,
  cancelLabel,
  delLabel,
  editLabel,
  addLabel,
  newPh,
  border,
  text,
  muted,
  accent,
  inpSmall,
  chipBtnStyle,
  primarySmallBtnStyle,
  ghostSmallBtnStyle,
  dangerSmallBtnStyle,
  dayRemoteEvents,
  dayLocalEvents,
  editing,
  setEditing,
  newTitle,
  setNewTitle,
  newAllDay,
  setNewAllDay,
  newStartTime,
  setNewStartTime,
  newEndTime,
  setNewEndTime,
  syncBusy,
  calDavConfigured,
  onClose,
  onSaveEditing,
  onDelete,
  onAdd,
}: {
  open: boolean
  de: boolean
  pickerLabel: string
  dayTitleLabel: string
  closeLabel: string
  emptyDayLabel: string
  titleLabel: string
  dateLabel: string
  saveLabel: string
  cancelLabel: string
  delLabel: string
  editLabel: string
  addLabel: string
  newPh: string
  border: string
  text: string
  muted: string
  accent: string
  inpSmall: CSSProperties
  chipBtnStyle: CSSProperties
  primarySmallBtnStyle: CSSProperties
  ghostSmallBtnStyle: CSSProperties
  dangerSmallBtnStyle: CSSProperties
  dayRemoteEvents: DayEventModalRemoteEvent[]
  dayLocalEvents: DayEventModalLocalEvent[]
  editing: EventEditDraft | null
  setEditing: (v: EventEditDraft | null) => void
  newTitle: string
  setNewTitle: (v: string) => void
  newAllDay: boolean
  setNewAllDay: (v: boolean) => void
  newStartTime: string
  setNewStartTime: (v: string) => void
  newEndTime: string
  setNewEndTime: (v: string) => void
  syncBusy: boolean
  calDavConfigured: boolean
  onClose: () => void
  onSaveEditing: () => void
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-labelledby="cal-day-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(12px, 2vh)',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          maxHeight: 'min(88vh, 680px)',
          overflow: 'auto',
          borderRadius: '12px',
          border: `1px solid ${border}`,
          background: 'var(--surface)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <p id="cal-day-dialog-title" style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: text, lineHeight: 1.35 }}>
            {dayTitleLabel} {pickerLabel}
          </p>
          <button type="button" onClick={onClose} style={chipBtnStyle} aria-label={closeLabel}>
            {closeLabel}
          </button>
        </div>

        {dayRemoteEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                fontWeight: 600,
                color: muted,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              {de ? 'Extern (CalDAV / WEB.DE)' : 'External (CalDAV)'}
            </p>
            {dayRemoteEvents.map((rev) => (
              <div
                key={rev.id}
                style={{
                  fontSize: '12px',
                  color: text,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'color-mix(in srgb, var(--accent) 7%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--border) 65%, transparent)',
                }}
              >
                <span style={{ color: muted, fontSize: '10px', display: 'block', lineHeight: 1.2 }}>
                  {rev.feedName}
                  {rev.sourceKind === 'caldav' ? (de ? ' · CalDAV' : ' · CalDAV') : ''}
                </span>
                <span>
                  {rev.timeLabel ? `${rev.timeLabel} · ` : ''}
                  {rev.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {dayLocalEvents.length > 0 && (
          <p
            style={{
              margin: dayRemoteEvents.length ? '4px 0 0' : 0,
              fontSize: '10px',
              fontWeight: 600,
              color: muted,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {de ? 'Dashboard' : 'Dashboard'}
          </p>
        )}

        {dayLocalEvents.length === 0 && dayRemoteEvents.length === 0 && (
          <p style={{ margin: 0, fontSize: '11px', color: muted }}>{emptyDayLabel}</p>
        )}

        {dayLocalEvents.map((ev) =>
          editing?.id === ev.id ? (
            <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: muted }}>{titleLabel}</label>
              <input
                style={inpSmall}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <label style={{ fontSize: '10px', color: muted }}>{dateLabel}</label>
              <input
                style={inpSmall}
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
              <EventTimeFields
                de={de}
                allDay={editing.allDay}
                startTime={editing.startTime}
                endTime={editing.endTime}
                inpStyle={inpSmall}
                onAllDay={(v) => setEditing({ ...editing, allDay: v })}
                onStart={(v) => setEditing({ ...editing, startTime: v })}
                onEnd={(v) => setEditing({ ...editing, endTime: v })}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" onClick={onSaveEditing} style={primarySmallBtnStyle}>
                  {saveLabel}
                </button>
                <button type="button" onClick={() => setEditing(null)} style={ghostSmallBtnStyle}>
                  {cancelLabel}
                </button>
                <button type="button" onClick={() => onDelete(ev.id)} style={dangerSmallBtnStyle}>
                  {delLabel}
                </button>
              </div>
            </div>
          ) : (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '12px',
                color: text,
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: muted, fontSize: '10px', marginRight: '6px' }}>{eventTimeLabel(ev, de)}</span>
                {ev.title}
                {ev.caldavUid && calDavConfigured ? (
                  <span style={{ color: muted, fontSize: '10px' }}> · CalDAV</span>
                ) : calDavConfigured ? (
                  <span style={{ color: muted, fontSize: '10px' }}> · {de ? 'nur Dashboard' : 'dashboard only'}</span>
                ) : null}
              </span>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      id: ev.id,
                      title: ev.title,
                      date: ev.date,
                      allDay: ev.allDay === true || (!ev.startTime && ev.allDay !== false),
                      startTime: ev.startTime ?? '09:00',
                      endTime: ev.endTime ?? '10:00',
                    })
                  }
                  style={chipBtnStyle}
                >
                  {editLabel}
                </button>
                <button type="button" onClick={() => onDelete(ev.id)} style={chipBtnStyle}>
                  {delLabel}
                </button>
              </div>
            </div>
          ),
        )}

        {!editing && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '4px',
              paddingTop: '12px',
              borderTop: `1px solid color-mix(in srgb, ${border} 55%, transparent)`,
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: text }}>
              {de ? 'Neuer Termin' : 'New event'}
            </p>
            <input
              style={{ ...inpSmall, fontSize: '14px', padding: '10px 12px' }}
              placeholder={newPh}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAdd()
                }
              }}
            />
            <EventTimeFields
              de={de}
              allDay={newAllDay}
              startTime={newStartTime}
              endTime={newEndTime}
              inpStyle={{ ...inpSmall, fontSize: '14px', padding: '8px 10px' }}
              onAllDay={setNewAllDay}
              onStart={setNewStartTime}
              onEnd={setNewEndTime}
            />
            <button
              type="button"
              onClick={onAdd}
              disabled={!newTitle.trim() || syncBusy}
              style={{
                ...primarySmallBtnStyle,
                opacity: !newTitle.trim() || syncBusy ? 0.45 : 1,
                cursor: !newTitle.trim() || syncBusy ? 'not-allowed' : 'pointer',
              }}
            >
              {addLabel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
