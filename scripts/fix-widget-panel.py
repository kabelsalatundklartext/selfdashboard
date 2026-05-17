from pathlib import Path

path = Path(__file__).resolve().parents[1] / "plugins" / "calendar" / "index.tsx"
text = path.read_text(encoding="utf-8")

start = text.find("/** Compact day event list for the dashboard tile month view. */")
end = text.find("\nfunction DayEventsPanel(")
if start < 0 or end < 0:
    raise SystemExit("markers not found")

new = """/** Compact day event list for the dashboard tile month view. */
function WidgetDayEventsPanel({ locale, day, events, canAdd, onAdd, onClickEvent, onOpenDayPopup }: {
  locale: Locale
  day: Date
  events: EventView[]
  canAdd: boolean
  onAdd: () => void
  onClickEvent: (ev: EventView) => void
  onOpenDayPopup: () => void
}) {
  const t = (k: string) => tr(k, locale)
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.dtstart.localeCompare(b.dtstart)),
    [events],
  )
  const dayLabel = day.toLocaleDateString(localeToBcp47(locale), {
    weekday: 'short', day: '2-digit', month: 'short',
  })
  return (
    <motion panel />
    <div style={{
      flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        padding: '6px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dayLabel}
          {sorted.length > 0 && (
            <span style={{ marginLeft: '6px', fontWeight: 400, color: 'var(--text-muted)' }}>
              ({sorted.length})
            </span>
          )}
        </div>
        {canAdd && (
          <button type="button" onClick={onAdd} title={t('addEvent')} style={widgetMiniBtnStyle}>
            <Plus size={12} />
          </button>
        )}
      </div>
      <motion list />
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '4px 8px', minHeight: 0 }}>
        {!sorted.length ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic', padding: '4px 2px' }}>
            {t('noEventsThisDay')}
          </div>
        ) : (
          sorted.map(ev => (
            <button
              key={eventRowKey(ev)}
              onClick={() => onClickEvent(ev)}
              style={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '5px 6px', marginBottom: '4px',
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px',
                borderLeft: `3px solid ${ev.calendarColor ?? '#5a9bd4'}`,
                fontSize: '11px', minWidth: 0, boxSizing: 'border-box',
              }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--text-muted)', minWidth: '44px', flexShrink: 0 }}>
                {ev.allDay ? t('allDay') : fmtTime(ev.dtstart, false, locale)}
              </span>
              <span style={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {ev.summary || t('untitled')}
              </span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={onOpenDayPopup}
        style={{
          all: 'unset', cursor: 'pointer', flexShrink: 0,
          padding: '6px 10px', borderTop: '1px solid var(--border)',
          fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic',
          width: '100%', boxSizing: 'border-box',
        }}
      >
        {t('openDay')}
      </button>
    </div>
  )
}

"""
# Remove placeholder lines accidentally left in template
lines = [ln for ln in new.splitlines(keepends=True) if "<motion " not in ln]
new = "".join(lines)

path.write_text(text[:start] + new + text[end:], encoding="utf-8", newline="\n")
print("ok", len(new))
