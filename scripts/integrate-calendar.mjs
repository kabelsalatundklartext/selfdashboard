import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, '_review-calendar-plugin')

function cp(from, to) {
  fs.cpSync(from, to, { recursive: true, force: true })
}

if (!fs.existsSync(src)) {
  console.error('Missing', src)
  process.exit(1)
}

cp(path.join(src, 'plugins/calendar'), path.join(root, 'plugins/calendar'))
cp(path.join(src, 'src/lib/calendar'), path.join(root, 'src/lib/calendar'))
cp(path.join(src, 'src/app/api/calendar'), path.join(root, 'src/app/api/calendar'))
fs.copyFileSync(path.join(src, 'src/instrumentation.ts'), path.join(root, 'src/instrumentation.ts'))

console.log('integrated calendar plugin')
