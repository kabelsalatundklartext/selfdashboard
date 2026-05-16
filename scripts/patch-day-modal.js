const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')

const start = c.indexOf('      {pickerYmd && (')
const end = c.indexOf('      {showEventList &&', start)
if (start < 0 || end < 0) {
  console.error('markers', start, end)
  process.exit(1)
}

const block = c.slice(start, end)
const headerEnd = block.indexOf('          {dayRemoteEvents.length > 0 && (')
if (headerEnd < 0) {
  console.error('header end not found')
  process.exit(1)
}
const content = block
  .slice(headerEnd)
  .replaceAll('setPickerYmd(null)', 'closeDayModal')
  .replace(/{de \? 'ICS \/ CalDAV' : 'ICS \/ CalDAV'}/g, "{de ? 'Extern (CalDAV)' : 'External (CalDAV)'}")

const portal = `      {dayModalMounted &&
        pickerYmd &&
        createPortal(
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
            onClick={closeDayModal}
          >
            <motion.div
              role="document"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(420px, 100%)',
                maxHeight: 'min(88vh, 640px)',
                overflow: 'auto',
                borderRadius: '12px',
                border: \`1px solid \${border}\`,
                background: 'var(--surface)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <p
                  id="cal-day-dialog-title"
                  style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: text, lineHeight: 1.35 }}
                >
                  {lab.dayTitle} {pickerLabel}
                </p>
                <button type="button" onClick={closeDayModal} style={chipBtnStyle} aria-label={lab.closeDay}>
                  {lab.closeDay}
                </button>
              </motion.div>
${content}
            </motion.div>
          </motion.div>,
          document.body,
        )}

`
const portalFixed = portal.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''))

c = c.slice(0, start) + portalFixed + c.slice(end)
fs.writeFileSync(p, c)
console.log('patched')
