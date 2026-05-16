const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')
const re =
  /(\{de \? 'CalDAV \(Server-Kalender\)' : 'CalDAV \(server calendar\)'\})\s*<p style=\{\{ fontSize: '12px', fontWeight: 700, color: 'var\(--text\)', margin: '0 0 8px' \}\}>\s*<p/
if (!re.test(c)) {
  console.error('pattern not found')
  process.exit(1)
}
c = c.replace(
  re,
  `$1
        </p>
          <p`,
)
fs.writeFileSync(p, c)
console.log('fixed')
