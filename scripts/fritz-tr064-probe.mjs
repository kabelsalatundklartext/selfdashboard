#!/usr/bin/env node
/**
 * Node TR-064 probe (same digest-fetch as SelfDashboard).
 * Usage: node scripts/fritz-tr064-probe.mjs 192.168.1.1 USER PASS [AIN]
 */
import DigestClient from 'digest-fetch'
import https from 'https'

const host = process.argv[2] || '192.168.1.1'
const user = process.argv[3]
const pass = process.argv[4]
const ainArg = process.argv[5] || '11630 0425503'

if (!user || !pass) {
  console.error('Usage: node scripts/fritz-tr064-probe.mjs HOST USER PASS [AIN]')
  process.exit(1)
}

const origins = [`https://${host}:49443`, `http://${host}:49000`]
const descPaths = ['/tr64desc.xml', '/tr064desc.xml', '/igddesc.xml']
const agent = new https.Agent({ rejectUnauthorized: false })
const client = new DigestClient(user, pass)

function xmlFirst(xml, tag) {
  const m = xml.match(new RegExp(`<(?:\\w+:)?${tag}>([^<]*)</(?:\\w+:)?${tag}>`, 'i'))
  return m?.[1]?.trim() || null
}

function parseServices(xml) {
  const out = []
  for (const block of xml.split(/<service[\s>]/i).slice(1)) {
    const type = xmlFirst(block, 'serviceType')
    const controlUrl = xmlFirst(block, 'controlURL')
    const scpdUrl = xmlFirst(block, 'SCPDURL') ?? xmlFirst(block, 'scpdURL')
    if (type && controlUrl) out.push({ type, controlUrl, scpdUrl })
  }
  return out
}

function buildSoap(urn, action, args, namespacedArgs = false) {
  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const inner = Object.entries(args)
    .map(([k, v]) =>
      namespacedArgs
        ? `<u:${k} xmlns:u="${urn}">${esc(v)}</u:${k}>`
        : `<${k}>${esc(v)}</${k}>`,
    )
    .join('\n')
  const bodyInner = inner ? `\n${inner}\n` : ''
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${urn}">${bodyInner}</u:${action}>
</s:Body>
</s:Envelope>`
}

async function get(url) {
  const isHttps = url.startsWith('https:')
  const res = await client.fetch(url, { agent: isHttps ? agent : undefined })
  return { status: res.status, text: await res.text() }
}

async function soap(controlUrl, urn, action, args = {}, namespacedArgs = false) {
  const isHttps = controlUrl.startsWith('https:')
  const body = buildSoap(urn, action, args, namespacedArgs)
  const res = await client.fetch(controlUrl, {
    method: 'POST',
    agent: isHttps ? agent : undefined,
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      SOAPAction: `"${urn}#${action}"`,
    },
    body,
  })
  const text = await res.text()
  return { status: res.status, text }
}

let homeauto = null
let homeOrigin = null

for (const origin of origins) {
  console.log(`\n=== ${origin} ===`)
  for (const p of descPaths) {
    const url = `${origin.replace(/\/$/, '')}${p}`
    const { status, text } = await get(url)
    const html = /<html/i.test(text) && /<body/i.test(text)
    if (html) {
      console.log(`GET ${p}: HTML (${status})`)
      continue
    }
    if (status !== 200) {
      console.log(`GET ${p}: HTTP ${status}`)
      continue
    }
    const services = parseServices(text)
    console.log(`GET ${p}: ${services.length} services`)
    const ha = services.find((s) => /Homeauto/i.test(s.type))
    if (ha && !homeauto) {
      homeauto = ha
      homeOrigin = origin
      console.log(`  -> Homeauto: ${ha.type}`)
      console.log(`     control: ${ha.controlUrl}`)
      console.log(`     scpd: ${ha.scpdUrl ?? '(default /x_homeautoSCPD.xml)'}`)
    }
  }
}

if (!homeauto || !homeOrigin) {
  console.error('\nNo Homeauto service found.')
  process.exit(2)
}

const ctl = homeauto.controlUrl.startsWith('http')
  ? homeauto.controlUrl
  : `${homeOrigin.replace(/\/$/, '')}${homeauto.controlUrl}`
const urn = homeauto.type

const scpdPath = homeauto.scpdUrl || '/x_homeautoSCPD.xml'
const scpdUrl = scpdPath.startsWith('http') ? scpdPath : `${homeOrigin.replace(/\/$/, '')}${scpdPath}`
const scpdRes = await get(scpdUrl)
if (scpdRes.status === 200 && /<actionList/i.test(scpdRes.text)) {
  const actions = []
  for (const b of scpdRes.text.split(/<action>/i).slice(1)) {
    const n = xmlFirst(b, 'name')
    if (n) actions.push(n)
  }
  console.log(`\nSCPD actions: ${actions.join(', ')}`)
}

console.log(`\n=== SOAP tests -> ${ctl} ===`)

for (const [label, action, args, ns] of [
  ['GetInfo plain', 'GetInfo', {}, false],
  ['GetGeneric idx=0 plain', 'GetGenericDeviceInfos', { NewIndex: '0' }, false],
  ['GetGeneric idx=0 ns-args', 'GetGenericDeviceInfos', { NewIndex: '0' }, true],
]) {
  const { status, text } = await soap(ctl, urn, action, args, ns)
  const err = xmlFirst(text, 'errorCode')
  const ok = !/<s:Fault/i.test(text)
  console.log(`\n${label} (HTTP ${status}) ${ok ? 'OK' : `FAULT ${err}`}`)
  if (!ok) console.log(text.slice(0, 400))
  else if (action === 'GetGenericDeviceInfos') {
    console.log(`  AIN=${xmlFirst(text, 'NewAIN')} name=${xmlFirst(text, 'NewDeviceName')} power=${xmlFirst(text, 'NewMultimeterPower')}`)
  }
}

const digits = ainArg.replace(/\D/g, '')
const ainSpaced = digits.length === 12 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : ainArg
for (const ain of [...new Set([ainSpaced, digits])]) {
  console.log(`\nGetSpecificDeviceInfos AIN="${ain}"`)
  const { text } = await soap(ctl, urn, 'GetSpecificDeviceInfos', { NewAIN: ain }, false)
  const err = xmlFirst(text, 'errorCode')
  if (/<s:Fault/i.test(text)) {
    console.log(`  FAULT ${err}`)
    console.log(text.slice(0, 400))
  } else {
    console.log(`  power=${xmlFirst(text, 'NewMultimeterPower')} Wh=${xmlFirst(text, 'NewMultimeterEnergy')}`)
  }
}

console.log('\nDone.')
