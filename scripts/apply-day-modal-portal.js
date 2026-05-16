const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')

const start = c.indexOf('      {pickerYmd && (')
const end = c.indexOf('      {showEventList &&', start)
if (start < 0 || end < 0) {
  console.error('markers missing', start, end)
  process.exit(1)
}

const innerStart = c.indexOf('          {dayRemoteEvents.length > 0 && (', start)
if (innerStart < 0) {
  console.error('inner start missing')
  process.exit(1)
}
let inner = c.slice(innerStart, end).trimEnd()
inner = inner.replace(/\s*<\/div>\s*\)\}\s*$/, '')
inner = inner.replaceAll('setPickerYmd(null)', 'closeDayModal')
inner = inner.replace(/{de \? 'ICS \/ CalDAV' : 'ICS \/ CalDAV'}/g, "{de ? 'Extern (CalDAV)' : 'External (CalDAV)'}")
inner = inner.replace('<motion.div', '<motion.div').replace('</motion.div>', '</motion.div>')
inner = inner.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''))

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
            <div
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
${inner}
            </motion.div>
          </motion.div>,
          document.body,
        )}

`

let portalFixed = portal.replace(/<\/?motion\.motion.div/g, (m) => m.replace('motion.', ''))
portalFixed = portalFixed.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''))

c = c.slice(0, start) + portalFixed + c.slice(end)
fs.writeFileSync(p, c)
console.log('portal applied')
