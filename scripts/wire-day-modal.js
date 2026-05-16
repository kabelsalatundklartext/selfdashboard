const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '../plugins/calendar/index.tsx')
let s = fs.readFileSync(indexPath, 'utf8')

if (!s.includes("from './DayEventModal'")) {
  s = s.replace(
    "import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'",
    "import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'\nimport { DayEventModal } from './DayEventModal'",
  )
  s = s.replace(/import \{ createPortal \} from 'react-dom'\n/, '')
}

const start = s.indexOf('      {pickerYmd && (')
const end = s.indexOf('      {showEventList &&', start)
if (start < 0 || end < 0) {
  console.error('markers not found', { start, end })
  process.exit(1)
}

const modal = `      {dayModalMounted ? (
        <DayEventModal
          open={Boolean(pickerYmd)}
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
      ) : null}

`

s = s.slice(0, start) + modal + s.slice(end)

const eventTimeFields = /function EventTimeFields\([\s\S]*?\n\}\n\nfunction Widget/
if (eventTimeFields.test(s)) {
  s = s.replace(eventTimeFields, 'function Widget')
  console.log('removed duplicate EventTimeFields')
}

fs.writeFileSync(indexPath, s)
console.log('DayEventModal wired; removed', end - start, 'chars inline panel')
