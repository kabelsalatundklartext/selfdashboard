'use strict';
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { WebSocketServer } = require('ws');
const fs      = require('fs');
const path    = require('path');

const docker  = require('./services/docker');
const unraid  = require('./services/unraid-multi');
const { startPoller, getSnapshot } = require('./services/poller');

const DATA = process.env.DATA_DIR || path.join(__dirname, '../data');
fs.mkdirSync(DATA, { recursive: true });

const APPS_FILE     = path.join(DATA, 'apps.json');
const SETTINGS_FILE = path.join(DATA, 'settings.json');
const LAYOUT_FILE   = path.join(DATA, 'layout.json');

function readJSON(f, fallback) {
  try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  return fallback;
}
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// ── WebSocket ─────────────────────────────────────────────────────────────────
const clients = new Set();
wss.on('connection', ws => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'snapshot', data: getSnapshot() }));
  ws.on('close', () => clients.delete(ws));
  ws.on('error', ()  => clients.delete(ws));
});
function broadcast(d) {
  const m = JSON.stringify(d);
  for (const ws of clients) if (ws.readyState === ws.OPEN) ws.send(m);
}
startPoller(snap => broadcast({ type: 'snapshot', data: snap }));

// ── Docker ────────────────────────────────────────────────────────────────────
app.get( '/api/docker/containers',              async (_, r) => r.json(await docker.listContainers()));
app.get( '/api/docker/containers/:id/logs',     async (q, r) => r.json(await docker.getLogs(q.params.id, +q.query.tail || 100)));
app.post('/api/docker/containers/:id/action',   async (q, r) => { try { r.json(await docker.containerAction(q.params.id, q.body.action)); } catch (e) { r.status(500).json({ error: e.message }); } });
app.get( '/api/docker/images',                  async (_, r) => r.json(await docker.getImages()));
app.get( '/api/docker/networks',                async (_, r) => r.json(await docker.getNetworks()));
app.get( '/api/docker/volumes',                 async (_, r) => r.json(await docker.getVolumes()));

// ── Unraid Multi-Server ───────────────────────────────────────────────────────
app.get('/api/unraid/servers',     async (_, r) => r.json(await unraid.getAllServers()));
app.get('/api/unraid/server-list', (_, r) => r.json(unraid.getServers()));

// ── Snapshot ──────────────────────────────────────────────────────────────────
app.get('/api/snapshot', (_, r) => r.json(getSnapshot()));
app.get('/api/health',   (_, r) => r.json({ ok: true, uptime: process.uptime(), ts: Date.now() }));

// ── Apps ──────────────────────────────────────────────────────────────────────
const DEFAULT_APPS = [
  { id:'1', name:'Portainer',   url:'http://tower:9000',  icon:'ti-brand-docker', bg:'#EEEDFE', ic:'#534AB7', category:'tools',   pinned:true  },
  { id:'2', name:'AdGuard',     url:'http://tower:3000',  icon:'ti-shield-check', bg:'#EAF3DE', ic:'#3B6D11', category:'network', pinned:true  },
  { id:'3', name:'Zoraxy',      url:'http://tower:8000',  icon:'ti-world',        bg:'#E6F1FB', ic:'#185FA5', category:'network', pinned:false },
  { id:'4', name:'Nextcloud',   url:'http://tower:8080',  icon:'ti-cloud',        bg:'#E1F5EE', ic:'#0F6E56', category:'storage', pinned:true  },
  { id:'5', name:'Jellyfin',    url:'http://tower:8096',  icon:'ti-player-play',  bg:'#FAEEDA', ic:'#854F0B', category:'media',   pinned:false },
  { id:'6', name:'Immich',      url:'http://tower:2283',  icon:'ti-camera',       bg:'#FBEAF0', ic:'#993556', category:'media',   pinned:false },
  { id:'7', name:'Vaultwarden', url:'http://tower:8222',  icon:'ti-lock',         bg:'#EEEDFE', ic:'#534AB7', category:'tools',   pinned:true  },
  { id:'8', name:'WG-Easy',     url:'http://tower:51821', icon:'ti-vpn',          bg:'#E6F1FB', ic:'#0C447C', category:'network', pinned:false },
  { id:'9', name:'Emby',        url:'http://tower:8097',  icon:'ti-device-tv',    bg:'#FAEEDA', ic:'#633806', category:'media',   pinned:false },
  { id:'10',name:'Selfstream',  url:'http://tower:7070',  icon:'ti-broadcast',    bg:'#FAECE7', ic:'#993C1D', category:'media',   pinned:false },
];

app.get(   '/api/apps',     (_, r) => r.json(readJSON(APPS_FILE, DEFAULT_APPS)));
app.post(  '/api/apps',     (q, r) => { const apps = readJSON(APPS_FILE, DEFAULT_APPS); const a = { ...q.body, id: Date.now().toString() }; apps.push(a); writeJSON(APPS_FILE, apps); r.json(a); });
app.put(   '/api/apps/:id', (q, r) => { const apps = readJSON(APPS_FILE, DEFAULT_APPS); const i = apps.findIndex(a => a.id === q.params.id); if (i<0) return r.status(404).json({}); apps[i] = { ...apps[i], ...q.body, id: q.params.id }; writeJSON(APPS_FILE, apps); r.json(apps[i]); });
app.delete('/api/apps/:id', (q, r) => { writeJSON(APPS_FILE, readJSON(APPS_FILE, DEFAULT_APPS).filter(a => a.id !== q.params.id)); r.json({ ok: true }); });

// ── Settings ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme: 'dark', language: 'de', refreshInterval: 5,
  weatherProvider: 'open-meteo',
  weatherLat: '53.55', weatherLon: '10.00',
  weatherCity: 'Hamburg',
  openweatherKey: '',
  adguardUrl: '', adguardUser: 'admin', adguardPassword: '',
  crowdsecUrl: '', crowdsecKey: '',
  icalUrls: [], caldavUrl: '', caldavUser: '', caldavPassword: '',
  unraidServers: [],
};
app.get('/api/settings', (_, r) => r.json(readJSON(SETTINGS_FILE, DEFAULT_SETTINGS)));
app.put('/api/settings', (q, r) => { const s = { ...readJSON(SETTINGS_FILE, DEFAULT_SETTINGS), ...q.body }; writeJSON(SETTINGS_FILE, s); r.json(s); });

// ── Layout (Gridstack) ────────────────────────────────────────────────────────
const DEFAULT_LAYOUT = [
  { id:'w-weather',   x:0, y:0, w:3, h:3 },
  { id:'w-system',    x:3, y:0, w:5, h:3 },
  { id:'w-docker',    x:0, y:3, w:8, h:5 },
  { id:'w-storage',   x:8, y:0, w:4, h:4 },
  { id:'w-security',  x:8, y:4, w:4, h:4 },
  { id:'w-calendar',  x:0, y:8, w:4, h:5 },
  { id:'w-apps',      x:4, y:8, w:8, h:5 },
  { id:'w-unraid',    x:0, y:13,w:12,h:5 },
];
app.get('/api/layout', (_, r) => r.json(readJSON(LAYOUT_FILE, DEFAULT_LAYOUT)));
app.put('/api/layout', (q, r) => { writeJSON(LAYOUT_FILE, q.body); r.json({ ok: true }); });

const PORT = parseInt(process.env.PORT || '4000');
server.listen(PORT, '0.0.0.0', () => console.log(`Node API :${PORT}`));
