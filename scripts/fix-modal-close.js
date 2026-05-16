const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')
const patterns = [
  /        <\/div>\r?\n      \)\}\r?\n\r?\n\r?\n            <\/div>/,
  /        <\/motion.div>\r?\n      \)\}\r?\n\r?\n\r?\n            <\/motion.div>/,
]
let n = 0
for (const re of patterns) {
  const next = c.replace(re, '            </div>')
  if (next !== c) {
    n++
    c = next
  }
}
if (!n) {
  console.error('pattern not found')
  process.exit(1)
}
fs.writeFileSync(p, c)
console.log('fixed', n)
