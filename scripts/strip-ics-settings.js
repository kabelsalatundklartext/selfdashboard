const fs = require('fs')
const p = 'plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')
const icsTitle = "{de ? 'ICS / Webcal (nur lesen)' : 'ICS / Webcal (read-only)'}"
const caldavInner = "        <div style={{ marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>"
const caldavTitle = "{de ? 'CalDAV (Server-Kalender)' : 'CalDAV (server calendar)'}"
const i0 = c.indexOf(icsTitle)
const i1 = c.indexOf(caldavInner)
if (i0 < 0 || i1 < 0 || i1 <= i0) {
  console.error('markers not found', i0, i1)
  process.exit(1)
}
// Remove ICS block; keep outer feeds div, drop nested caldav wrapper opening
const before = c.slice(0, i0)
const after = c.slice(i1 + caldavInner.length)
c = before + caldavTitle + after
// Remove duplicate caldav title block (second occurrence right after our insert)
const dup = c.indexOf(caldavTitle, before.length + 5)
if (dup > before.length && dup < before.length + 800) {
  const lineEnd = c.indexOf('</p>', dup) + 4
  c = c.slice(0, dup) + c.slice(lineEnd)
}
fs.writeFileSync(p, c)
console.log('stripped ICS settings block')
