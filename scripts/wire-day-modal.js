const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')

if (!c.includes("from './DayEventModal'")) {
  c = c.replace(
    "import { reportClientLog } from '@/lib/reportLog'",
    "import { reportClientLog } from '@/lib/reportLog'\nimport { DayEventModal, type EventEditDraft } from './DayEventModal'",
  )
}

c = c.replace(
  "import { createPortal } from 'react-dom'\n",
  '',
)

const eventFieldsStart = c.indexOf('function EventTimeFields(')
const widgetStart = c.indexOf('function Widget(', eventFieldsStart)
if (eventFieldsStart > 0 && widgetStart > eventFieldsStart) {
  c = c.slice(0, eventFieldsStart) + c.slice(widgetStart)
}

c = c.replace(
  /type EventEditDraft = \{[\s\S]*?\}\n\nfunction eventTimeLabel/,
  'function eventTimeLabel',
)

const pickerStart = c.indexOf('      {pickerYmd && (')
const showList = c.indexOf('      {showEventList &&', pickerStart)
if (pickerStart < 0 || showList < 0) {
  console.error('picker block not found', pickerStart, showList)
  process.exit(1)
}

const modal = `      <DayEventModal
        open={pickerYmd != null}
        de={de}
        pickerLabel={pickerLabel}
        dayTitleLabel={lab.dayTitle}
        closeLabel={lab.closeDay}
        emptyDayLabel={lab.emptyDay}
        titleLabel={lab.titleLabel}
        dateLabel={lab.dateLabel}
        saveLabel={lab.save}
        cancelLabel={lab.cancel}
        delLabel={lab.del}
        editLabel={lab.edit}
        addLabel={lab.add}
        newPh={lab.newPh}
        border={border}
        text={text}
        muted={muted}
        accent={accent}
        inpSmall={inpSmall}
        chipBtnStyle={chipBtnStyle}
        primarySmallBtnStyle={primarySmallBtnStyle}
        ghostSmallBtnStyle={ghostSmallBtnStyle}
        dangerSmallBtnStyle={dangerSmallBtnStyle}
        dayRemoteEvents={dayRemoteEvents}
        dayLocalEvents={dayLocalEvents}
        editing={editing}
        setEditing={setEditing}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newAllDay={newAllDay}
        setNewAllDay={setNewAllDay}
        newStartTime={newStartTime}
        setNewStartTime={setNewStartTime}
        newEndTime={newEndTime}
        setNewEndTime={setNewEndTime}
        syncBusy={syncBusy}
        calDavConfigured={calDavFeeds.length > 0}
        onClose={closeDayModal}
        onSaveEditing={saveEditing}
        onDelete={deleteEvent}
        onAdd={addNewEvent}
      />

`

c = c.slice(0, pickerStart) + modal + c.slice(showList)

c = c.replace(
  /const \[dayModalMounted, setDayModalMounted\] = useState\(false\)\n\n/g,
  '',
)
c = c.replace(
  /  useEffect\(\(\) => \{\n    setDayModalMounted\(true\)\n  \}, \[\]\)\n\n/g,
  '',
)
c = c.replace(
  /  useEffect\(\(\) => \{\n    if \(!pickerYmd\) return\n    const onKey = \(e: KeyboardEvent\) => \{\n      if \(e\.key === 'Escape'\) closeDayModal\(\)\n    \}\n    window\.addEventListener\('keydown', onKey\)\n    return \(\) => window\.removeEventListener\('keydown', onKey\)\n  \}, \[pickerYmd, closeDayModal\]\)\n\n/g,
  '',
)

fs.writeFileSync(p, c)
console.log('wired DayEventModal')
