'use strict';
const axios  = require('axios');
const docker = require('./docker');
const unraid = require('./unraid-multi');

const PYTHON   = process.env.PYTHON_API_URL || 'http://python-api:4001';
const INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000');

let snapshot = { containers:[], system:null, storage:null, unraidServers:[], adguard:null, crowdsec:null, weather:null, calendar:[], ts:null };

async function py(path) {
  try { return (await axios.get(`${PYTHON}${path}`, { timeout: 9000 })).data; } catch { return null; }
}

async function fast() {
  const [cts, sys] = await Promise.allSettled([ docker.listContainers(), py('/system') ]);
  if (cts.status==='fulfilled') snapshot.containers = cts.value;
  if (sys.status==='fulfilled' && sys.value) snapshot.system = sys.value;
  snapshot.ts = Date.now();
}

async function slow() {
  const [storage, servers, ag, cs, weather, cal] = await Promise.allSettled([
    py('/storage'), unraid.getAllServers(), py('/adguard'), py('/crowdsec'), py('/weather'), py('/calendar'),
  ]);
  if (storage.status==='fulfilled' && storage.value)  snapshot.storage       = storage.value;
  if (servers.status==='fulfilled' && servers.value)  snapshot.unraidServers = servers.value;
  if (ag.status==='fulfilled'      && ag.value)       snapshot.adguard       = ag.value;
  if (cs.status==='fulfilled'      && cs.value)       snapshot.crowdsec      = cs.value;
  if (weather.status==='fulfilled' && weather.value)  snapshot.weather       = weather.value;
  if (cal.status==='fulfilled'     && cal.value)      snapshot.calendar      = cal.value;
}

let onUpdate = () => {};
function startPoller(cb) {
  onUpdate = cb || (() => {});
  fast(); slow();
  setInterval(async () => { await fast(); onUpdate(snapshot); }, INTERVAL);
  setInterval(slow, 60_000);
  console.log(`Poller: fast=${INTERVAL}ms  slow=60s`);
}
function getSnapshot() { return snapshot; }

module.exports = { startPoller, getSnapshot };
