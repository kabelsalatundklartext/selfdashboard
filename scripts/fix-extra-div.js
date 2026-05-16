const fs = require('fs')
const p = 'C:/Users/svens/Desktop/SelfDashboard/selfdashboard/plugins/calendar/index.tsx'
let c = fs.readFileSync(p, 'utf8')
const before = c
const re = /\}\)\(\)\}\r?\n\s*<\/div>\r?\n(\s*<label)/
c = c.replace(re, '})()}\n\n$1')
if (c === before) {
  console.error('no replacement made')
  process.exit(1)
}
fs.writeFileSync(p, c)
console.log('removed extra closing div')
