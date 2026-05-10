'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SelfDashboard v2 — Main App
═══════════════════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────────────────
const S = {
  snap:      null,
  apps:      [],
  settings:  { theme:'dark', language:'de', weatherProvider:'open-meteo', weatherLat:'53.55', weatherLon:'10.00', weatherCity:'Hamburg' },
  layout:    null,
  view:      'grid',
  editMode:  false,
  ctFilter:  'all',
  ctSearch:  '',
  selCt:     null,
  editApp:   null,
  selIcon:   'ti-cloud',
  selColor:  { bg:'#E1F5EE', ic:'#0F6E56' },
  netPrev:   null,
  grid:      null,
};

const ICONS  = ['ti-cloud','ti-player-play','ti-photo','ti-shield-check','ti-lock','ti-world','ti-broadcast','ti-camera','ti-folder','ti-database','ti-server','ti-brand-docker','ti-home','ti-settings','ti-chart-bar','ti-mail','ti-download','ti-music','ti-book','ti-star','ti-device-tv','ti-network','ti-refresh','ti-cpu','ti-message','ti-calendar','ti-clock','ti-user','ti-key','ti-code','ti-terminal','ti-bug','ti-vpn','ti-wifi','ti-rss','ti-layers-intersect','ti-video','ti-git-branch','ti-cloud-upload'];
const COLORS = [{bg:'#E1F5EE',ic:'#0F6E56'},{bg:'#E6F1FB',ic:'#185FA5'},{bg:'#EEEDFE',ic:'#534AB7'},{bg:'#FAEEDA',ic:'#854F0B'},{bg:'#FAECE7',ic:'#993C1D'},{bg:'#FBEAF0',ic:'#993556'},{bg:'#EAF3DE',ic:'#3B6D11'},{bg:'#F1EFE8',ic:'#5F5E5A'},{bg:'#E6F1FB',ic:'#0C447C'}];

const esc = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el  = id => document.getElementById(id);
const barColor  = p => p>=85?'var(--cr)':p>=65?'var(--wn)':'var(--ok)';
const tempColor = t => !t?'var(--mu)':t>=75?'var(--cr)':t>=60?'var(--wn)':'var(--ok)';

// expose switchView globally for widgets
window.switchView = v => switchView(v, document.querySelector(`[data-view="${v}"]`));

// ── WebSocket ──────────────────────────────────────────────────────────────
let ws, wsRetries = 0;
function connectWS() {
  const proto = location.protocol==='https:'?'wss':'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen    = () => { wsRetries=0; el('ws-dot').className='ws-dot'; };
  ws.onmessage = e => { try { const m=JSON.parse(e.data); if(m.type==='snapshot') ingest(m.data); } catch{} };
  ws.onerror   = () => el('ws-dot').className='ws-dot err';
  ws.onclose   = () => { wsRetries=Math.min(wsRetries+1,10); setTimeout(connectWS, Math.min(wsRetries*1500,20000)); };
}

async function fetchREST() {
  try { ingest(await (await fetch('/api/snapshot')).json()); } catch{}
}

function ingest(data) {
  S.snap = data;
  updateSidebar();
  renderCurrentView();
  el('last-updated').textContent = new Date().toLocaleTimeString();
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadSettings(), loadApps(), loadLayout()]);
  applyTheme();
  buildPickers();
  buildGrid();
  wireNav();
  wireSearch();
  wireEvents();
  connectWS();
  setTimeout(()=>{ if(!S.snap) fetchREST(); }, 800);
}

async function loadSettings() {
  try { S.settings = await (await fetch('/api/settings')).json(); } catch{}
}
async function loadApps() {
  try { S.apps = await (await fetch('/api/apps')).json(); renderPinned(); } catch{}
}
async function loadLayout() {
  try { S.layout = await (await fetch('/api/layout')).json(); } catch{}
}
async function saveLayout() {
  if (!S.grid) return;
  const items = S.grid.save(false);
  await fetch('/api/layout', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(items) });
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function updateSidebar() {
  const sys = S.snap?.system;
  if (!sys) return;
  const cpu = sys.cpu||{}, ram = sys.ram||{};
  el('ms-cpu').textContent     = (cpu.pct||0).toFixed(1)+'%';
  el('ms-cpu-bar').style.width = (cpu.pct||0)+'%';
  el('ms-cpu-bar').style.background = barColor(cpu.pct||0);
  el('ms-ram').textContent     = (ram.pct||0)+'%';
  el('ms-ram-bar').style.width = (ram.pct||0)+'%';
  el('ms-ram-bar').style.background = barColor(ram.pct||0);
  const temp = sys.temps?.cpu;
  el('ms-temp').textContent = temp ? temp+'°C' : '–';
  el('ms-temp').style.color = tempColor(temp);

  // Network delta
  const net = (sys.network||[])[0]||{};
  let rxMBs=0, txMBs=0;
  if (S.netPrev && net.rxBytes) {
    const dt = (Date.now()-S.netPrev.ts)/1000;
    rxMBs = Math.max(0,(net.rxBytes-S.netPrev.rx)/dt/1024/1024);
    txMBs = Math.max(0,(net.txBytes-S.netPrev.tx)/dt/1024/1024);
  }
  if (net.rxBytes) S.netPrev = { rx:net.rxBytes, tx:net.txBytes, ts:Date.now() };
  el('ms-rx').textContent = rxMBs.toFixed(1)+' MB/s';
  el('ms-tx').textContent = txMBs.toFixed(1)+' MB/s';

  // Update network widget cells if visible
  (sys.network||[]).forEach(n => {
    const rx = document.getElementById(`iface-rx-${n.iface}`);
    const tx = document.getElementById(`iface-tx-${n.iface}`);
    if (rx && S.netPrev) { rx.textContent = rxMBs.toFixed(1)+' MB/s'; }
    if (tx && S.netPrev) { tx.textContent = txMBs.toFixed(1)+' MB/s'; }
  });

  el('uptime-text').textContent = sys.uptimeFmt||'–';
  const name = S.snap?.unraidServers?.[0]?.config?.name;
  if (name) el('server-name').textContent = name;
}

function renderPinned() {
  el('pinned-list').innerHTML = S.apps.filter(a=>a.pinned).map(a=>`
    <button class="pinned-item" onclick="window.open('${esc(a.url)}','_blank','noopener')" title="${esc(a.url)}">
      <div class="pinned-ico" style="background:${a.bg}"><i class="ti ${a.icon}" style="color:${a.ic}"></i></div>
      <div class="pinned-info">
        <div class="pinned-name">${esc(a.name)}</div>
        <div class="pinned-url">${esc(a.url)}</div>
      </div>
    </button>
  `).join('');
}

// ── Gridstack ──────────────────────────────────────────────────────────────
const DEFAULT_LAYOUT = [
  { id:'w-weather',    x:0,  y:0,  w:3, h:4  },
  { id:'w-system',     x:3,  y:0,  w:4, h:4  },
  { id:'w-quickstats', x:7,  y:0,  w:3, h:4  },
  { id:'w-adguard',    x:10, y:0,  w:2, h:4  },
  { id:'w-docker',     x:0,  y:4,  w:8, h:5  },
  { id:'w-storage',    x:8,  y:4,  w:4, h:5  },
  { id:'w-calendar',   x:0,  y:9,  w:3, h:5  },
  { id:'w-apps',       x:3,  y:9,  w:5, h:5  },
  { id:'w-crowdsec',   x:8,  y:9,  w:4, h:5  },
  { id:'w-unraid',     x:0,  y:14, w:12,h:4  },
];

function buildGrid() {
  const layout = S.layout || DEFAULT_LAYOUT;

  S.grid = GridStack.init({
    column:         12,
    cellHeight:     60,
    margin:         8,
    animate:        true,
    resizable:      { handles: 'se,sw,ne,nw,e,w,n,s' },
    draggable:      { handle: '.widget-hd' },
    staticGrid:     true,   // start locked; edit mode unlocks
    float:          false,
  }, '#main-grid');

  // Build items
  layout.forEach(item => {
    const widgetDef = window.WIDGETS[item.id];
    if (!widgetDef) return;
    const content = document.createElement('div');
    content.className = 'widget';
    content.id = `wc-${item.id}`;
    S.grid.addWidget({
      id:      item.id,
      x:       item.x,  y: item.y,
      w:       item.w,  h: item.h,
      minW:    widgetDef.minW||2,
      minH:    widgetDef.minH||2,
      content: content.outerHTML,
    });
  });

  // Save layout on change
  S.grid.on('change', () => { if (S.editMode) saveLayout(); });
  S.grid.on('resizestop dragstop', () => { if (S.editMode) { saveLayout(); setTimeout(()=>renderGrid(), 100); } });

  // Initial render after grid settles
  setTimeout(renderGrid, 200);
}

function renderGrid() {
  if (!S.snap) return;
  Object.values(window.WIDGETS).forEach(w => {
    const cel = document.getElementById(`wc-${w.id}`);
    if (!cel) return;
    try { w.render(S.snap, cel, S.apps); } catch(e) { console.error(`Widget ${w.id}:`, e); }
  });
}

function toggleEditMode() {
  S.editMode = !S.editMode;
  S.grid.setStatic(!S.editMode);
  el('main-grid').classList.toggle('edit-mode', S.editMode);
  el('edit-badge').style.display = S.editMode ? 'flex' : 'none';
  el('edit-layout-btn').querySelector('i').className = S.editMode ? 'ti ti-pencil-off' : 'ti ti-pencil-plus';
  if (!S.editMode) saveLayout();
}

// ── Navigation ─────────────────────────────────────────────────────────────
function wireNav() {
  document.querySelectorAll('.sb-nav-btn').forEach(btn =>
    btn.addEventListener('click', () => switchView(btn.dataset.view, btn))
  );
}

function switchView(view, btn) {
  S.view = view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.sb-nav-btn').forEach(b=>b.classList.remove('active'));
  el('view-'+view)?.classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  const titles = { grid:'Dashboard', docker:'Docker', unraid:'Unraid Server', apps:'Apps', settings:'Einstellungen' };
  el('page-title').textContent = titles[view]||view;
  el('sidebar').classList.remove('mob-open');
  renderCurrentView();
}

function renderCurrentView() {
  if (!S.snap) return;
  switch(S.view) {
    case 'grid':     renderGrid();     break;
    case 'docker':   renderDocker();   break;
    case 'unraid':   renderUnraid();   break;
    case 'apps':     renderAppsView(); break;
    case 'settings': renderSettings(); break;
  }
}

// ── Docker ─────────────────────────────────────────────────────────────────
function renderDocker() {
  const cts = S.snap?.containers || [];
  const run  = cts.filter(c=>c.status==='running');
  const stop = cts.filter(c=>c.status!=='running');
  el('ct-run-pill').textContent  = run.length+' läuft';
  el('ct-stop-pill').textContent = stop.length+' gestoppt';

  let list = S.ctFilter==='all' ? cts : cts.filter(c=>S.ctFilter==='running'?c.status==='running':c.status!=='running');
  if (S.ctSearch) list = list.filter(c=>c.name.toLowerCase().includes(S.ctSearch)||c.image.toLowerCase().includes(S.ctSearch));

  el('ct-tbody').innerHTML = list.map(c => {
    const isRun = c.status==='running';
    const rp = c.memLimitMB>0 ? Math.round(c.memMB/c.memLimitMB*100) : 0;
    function mb(pct,lbl){ const w=Math.min(pct,100); const cl=barColor(pct); return `<div class="mbar-wrap"><div class="mbar"><div class="mbar-fill" style="width:${w}%;background:${cl}"></div></div><span class="mbar-val" style="color:${cl}">${lbl}</span></div>`; }
    return `<tr class="${S.selCt===c.id?'sel':''}" onclick="selCt('${c.id}')">
      <td><div class="ct-name-cell"><div class="sdot ${c.status}"></div>${esc(c.name)}</div></td>
      <td class="mono c-muted" style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(c.image)}">${esc(c.image)}</td>
      <td>${isRun?mb(c.cpu,c.cpu.toFixed(1)+'%'):'—'}</td>
      <td>${isRun?mb(rp,c.memMB+'MB'):'—'}</td>
      <td>${isRun?`<span class="c-green">↓${c.netRxMB}</span> <span class="c-blue">↑${c.netTxMB}</span>`:'—'}</td>
      <td class="c-muted" style="font-size:11px">${isRun?`${c.blockRdMB}/${c.blockWrMB}`:'—'}</td>
      <td class="c-muted" style="font-size:11px">${isRun?c.pids:'—'}</td>
      <td class="mono c-muted" style="font-size:11px">${(c.ports||[]).slice(0,2).join(', ')||'—'}</td>
      <td class="c-muted" style="font-size:11px">${c.statusText||'–'}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        ${isRun
          ?`<button class="act-btn" onclick="ctAct('${c.fullId||c.id}','restart')" title="Neustart"><i class="ti ti-refresh"></i></button>
            <button class="act-btn danger" onclick="ctAct('${c.fullId||c.id}','stop')" title="Stopp"><i class="ti ti-player-stop"></i></button>
            <button class="act-btn" onclick="ctAct('${c.fullId||c.id}','pause')" title="Pause"><i class="ti ti-player-pause"></i></button>`
          :`<button class="act-btn ok" onclick="ctAct('${c.fullId||c.id}','start')" title="Start"><i class="ti ti-player-play"></i></button>`}
        <button class="act-btn" onclick="showLogs('${c.name}')"><i class="ti ti-file-text"></i></button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--mu)">Keine Container</td></tr>`;
}

window.selCt = function(id) {
  if (S.selCt===id) { S.selCt=null; el('ct-detail').style.display='none'; renderDocker(); return; }
  S.selCt = id;
  renderDocker();
  const c = (S.snap?.containers||[]).find(x=>x.id===id);
  if (!c) return;
  const rp = c.memLimitMB>0 ? Math.round(c.memMB/c.memLimitMB*100) : 0;
  const dp = el('ct-detail');
  dp.style.display = 'block';
  dp.innerHTML = `
    <div class="dp-hd">
      <div class="dp-name"><div class="sdot ${c.status}"></div>${esc(c.name)} <span class="c-muted" style="font-size:11px;font-weight:400">${esc(c.image)}</span></div>
      <button class="icon-btn" onclick="selCt('${c.id}')"><i class="ti ti-x"></i></button>
    </div>
    <div class="dp-kpis">
      <div class="dp-kpi"><div class="dp-kpi-l">CPU</div><div class="dp-kpi-v" style="color:${barColor(c.cpu)}">${c.cpu.toFixed(1)}%</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">RAM</div><div class="dp-kpi-v" style="color:${barColor(rp)}">${c.memMB} MB</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">RAM-Limit</div><div class="dp-kpi-v">${c.memLimitMB} MB</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">Netz ↓</div><div class="dp-kpi-v c-green">${c.netRxMB} MB/s</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">Netz ↑</div><div class="dp-kpi-v c-blue">${c.netTxMB} MB/s</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">PIDs</div><div class="dp-kpi-v">${c.pids||'–'}</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">Block R/W</div><div class="dp-kpi-v" style="font-size:12px">${c.blockRdMB}/${c.blockWrMB} MB</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">Restart</div><div class="dp-kpi-v" style="font-size:12px">${c.restartPolicy||'–'}</div></div>
      <div class="dp-kpi"><div class="dp-kpi-l">Netzwerke</div><div class="dp-kpi-v" style="font-size:11px">${(c.networks||[]).join(', ')||'–'}</div></div>
    </div>
    ${c.mounts?.length ? `<div style="font-size:11px;color:var(--mu);margin-bottom:8px;padding:0 2px">Volumes: ${c.mounts.map(m=>`<code style="background:var(--s2);padding:1px 5px;border-radius:3px;font-size:10px">${esc(m.src)}→${esc(m.dst)}</code>`).join(' ')}</div>` : ''}
    <div class="log-box" id="log-${c.id}">Lade Logs…</div>
    <div class="dp-acts">
      ${c.status==='running'
        ?`<button class="act-btn" onclick="ctAct('${c.fullId||c.id}','restart')"><i class="ti ti-refresh"></i> Neustart</button>
          <button class="act-btn danger" onclick="ctAct('${c.fullId||c.id}','stop')"><i class="ti ti-player-stop"></i> Stopp</button>
          <button class="act-btn" onclick="ctAct('${c.fullId||c.id}','pause')"><i class="ti ti-player-pause"></i> Pause</button>`
        :`<button class="act-btn ok" onclick="ctAct('${c.fullId||c.id}','start')"><i class="ti ti-player-play"></i> Starten</button>`}
      <button class="act-btn" onclick="showLogs('${c.name}')"><i class="ti ti-external-link"></i> Alle Logs</button>
    </div>`;
  fetchLogs(c.id, c.name);
};

async function fetchLogs(id, name) {
  try {
    const data = await (await fetch(`/api/docker/containers/${name}/logs?tail=40`)).json();
    const logEl = document.getElementById('log-'+id);
    if (logEl) logEl.innerHTML = (Array.isArray(data)?data:data.logs||[]).slice(-25).map(l=>esc(l)).join('<br>')||'Keine Logs';
  } catch{}
}

async function showLogs(name) {
  const data = await (await fetch(`/api/docker/containers/${name}/logs?tail=300`)).json();
  const logs = Array.isArray(data)?data:data.logs||[];
  const w = window.open('','_blank','width=900,height=650');
  w.document.write(`<html><head><title>Logs: ${name}</title><style>body{background:#0b0d16;color:#dde1ef;font-family:monospace;font-size:12px;padding:16px;white-space:pre-wrap;line-height:1.6}</style></head><body>${logs.map(l=>esc(l)).join('\n')}</body></html>`);
}

window.ctAct = async function(id, action) {
  try {
    await fetch(`/api/docker/containers/${id}/action`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action}) });
    setTimeout(fetchREST, 1500);
  } catch(e) { console.error('ctAct', e); }
};
window.showLogs = showLogs;

// ── Unraid Multi-Server ────────────────────────────────────────────────────
function renderUnraid() {
  const servers = S.snap?.unraidServers || [];
  if (!servers.length) {
    el('unraid-servers-grid').innerHTML = `<div style="padding:40px;text-align:center;color:var(--mu)">Keine Server konfiguriert. <button class="link-btn" onclick="switchView('settings')">Einstellungen →</button></div>`;
    return;
  }
  el('unraid-servers-grid').innerHTML = `<div class="unraid-servers-grid" style="padding:4px 0">
    ${servers.map(s => {
      const mem = s.info?.memory||{};
      const totalGB = mem.total?Math.round(mem.total/1073741824):0;
      const freeGB  = mem.free ?Math.round(mem.free /1073741824):0;
      const usedPct = totalGB ? Math.round((totalGB-freeGB)/totalGB*100):0;
      const cap = s.array?.capacity||{};
      const arrPct = cap.total?Math.round(cap.used/cap.total*100):0;
      const disks  = s.array?.disks||[];
      const shares = s.shares||[];
      const vms    = s.vms||[];
      const arrayDisks = disks.filter(d=>d.type!=='Parity'&&d.type!=='Cache');
      const poolDisks  = disks.filter(d=>d.type==='Cache');
      return `<div class="unraid-server-card">
        <div class="usc-hd">
          <i class="ti ti-server"></i>${esc(s.name)}
          <span class="usc-online pill ${s.online?'pill-g':'pill-r'}">${s.online?'Online':'Offline/Demo'}</span>
          <span style="font-size:10px;color:var(--mu);margin-left:auto">${s.info?.os?.version||''} · Uptime: ${s.info?.uptime?Math.floor(s.info.uptime/86400)+'d':'–'}</span>
        </div>
        <div class="usc-kpis">
          <div class="usc-kpi"><div class="usc-kpi-v">${s.info?.cpu?.cores||'–'}c/${s.info?.cpu?.threads||'–'}t</div><div class="usc-kpi-l">${esc(s.info?.cpu?.brand||'CPU')}</div></div>
          <div class="usc-kpi"><div class="usc-kpi-v" style="color:${barColor(usedPct)}">${usedPct}%</div><div class="usc-kpi-l">RAM ${usedPct?totalGB-freeGB+'/'+totalGB:'–'} GB</div></div>
          <div class="usc-kpi"><div class="usc-kpi-v" style="color:${barColor(arrPct)}">${arrPct}%</div><div class="usc-kpi-l">Array ${cap.used||0}/${cap.total||0}G</div></div>
          <div class="usc-kpi"><div class="usc-kpi-v" style="color:${s.array?.state==='Started'?'var(--gn)':'var(--mu)'}">${s.array?.state||'–'}</div><div class="usc-kpi-l">Array Status</div></div>
        </div>
        <!-- Array Disks -->
        <div style="padding:8px 14px 2px;font-size:10px;font-weight:600;color:var(--mu);letter-spacing:.06em">ARRAY DATENTRÄGER</div>
        ${arrayDisks.map(d=>{
          const pct = d.fsSize>0?Math.round(d.fsUsed/d.fsSize*100):0;
          const pip = d.type==='Parity'?'#534AB7':'var(--ok)';
          const tc  = d.temp ? tempColor(d.temp) : 'var(--mu)';
          return `<div class="disk-row">
            <div class="disk-pip" style="background:${pip}"></div>
            <div class="disk-label">${esc(d.name)} <span class="c-muted" style="font-size:10px">${esc(d.device||'')}</span></div>
            <div class="disk-bar-wrap">
              <div class="disk-track"><div class="disk-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div>
              <div class="disk-sub"><span>${d.fsUsed||0}/${d.fsSize||0} GB</span></div>
            </div>
            <div class="disk-right">
              <span style="color:${barColor(pct)};font-size:11px;font-weight:500">${pct}%</span>
              ${d.temp?`<span class="disk-temp" style="color:${tc};font-size:11px">${d.temp}°C</span>`:''}
            </div>
          </div>`;
        }).join('') || `<div style="padding:8px 14px;color:var(--mu);font-size:11px">Keine Array-Daten</div>`}
        <!-- Pool Disks -->
        ${poolDisks.length ? `
        <div style="padding:8px 14px 2px;font-size:10px;font-weight:600;color:var(--mu);letter-spacing:.06em;border-top:1px solid var(--bd)">POOL-DATENTRÄGER</div>
        ${poolDisks.map(d=>{
          const pct = d.fsSize>0?Math.round(d.fsUsed/d.fsSize*100):0;
          return `<div class="disk-row">
            <div class="disk-pip" style="background:#185FA5"></div>
            <div class="disk-label">${esc(d.name)} <span class="c-muted" style="font-size:10px">${esc(d.device||'')}</span></div>
            <div class="disk-bar-wrap">
              <div class="disk-track"><div class="disk-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div>
              <div class="disk-sub"><span>${d.fsUsed||0}/${d.fsSize||0} GB</span></div>
            </div>
            <div class="disk-right">
              <span style="color:${barColor(pct)};font-size:11px;font-weight:500">${pct}%</span>
              ${d.temp?`<span class="disk-temp" style="color:${tempColor(d.temp)};font-size:11px">${d.temp}°C</span>`:''}
            </div>
          </div>`;
        }).join('')}` : ''}
        <!-- Shares -->
        ${shares.length ? `
        <div style="padding:8px 14px 2px;font-size:10px;font-weight:600;color:var(--mu);letter-spacing:.06em;border-top:1px solid var(--bd)">SHARES</div>
        <div class="shares-grid">
          ${shares.map(sh=>{
            const pct = sh.size>0?Math.round((sh.size-sh.free)/sh.size*100):0;
            return `<div class="share-cell">
              <div class="share-name">${esc(sh.name)}</div>
              <div class="share-bar"><div class="share-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div>
              <div class="share-info">${sh.size-sh.free}/${sh.size} GB · ${pct}%</div>
            </div>`;
          }).join('')}
        </div>` : ''}
        <!-- VMs -->
        ${vms.length ? `
        <div style="padding:8px 14px;border-top:1px solid var(--bd);font-size:11px">
          <span style="font-size:10px;font-weight:600;color:var(--mu);letter-spacing:.06em">VMs</span>
          ${vms.map(v=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd)">
            <span>${esc(v.name)}</span>
            <span class="pill ${v.state==='started'?'pill-g':'pill-r'}" style="font-size:10px">${v.state}</span>
          </div>`).join('')}
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

// ── Apps ───────────────────────────────────────────────────────────────────
function renderAppsView() {
  const cat = el('app-cat-filter').value;
  const list = cat==='all' ? S.apps : S.apps.filter(a=>a.category===cat);
  el('apps-grid').innerHTML = list.map(a=>`
    <div class="app-tile" ondblclick="window.open('${esc(a.url)}','_blank','noopener')">
      ${a.pinned?'<div class="at-pin"><i class="ti ti-star"></i></div>':''}
      <div class="at-acts">
        <button class="icon-btn" style="padding:3px 4px" onclick="editApp('${a.id}')"><i class="ti ti-edit" style="font-size:13px"></i></button>
        <button class="icon-btn" style="padding:3px 4px" onclick="deleteApp('${a.id}')"><i class="ti ti-trash" style="font-size:13px"></i></button>
      </div>
      <div class="at-icon" style="background:${a.bg}"><i class="ti ${a.icon}" style="color:${a.ic}"></i></div>
      <div class="at-name">${esc(a.name)}</div>
      <div class="at-cat">${a.category||''}</div>
      <div class="at-url" title="${esc(a.url)}">${esc(a.url)}</div>
      <div style="margin-top:8px"><button class="act-btn" onclick="window.open('${esc(a.url)}','_blank','noopener')"><i class="ti ti-external-link"></i> Öffnen</button></div>
    </div>
  `).join('') || `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--mu)">Noch keine Apps hinzugefügt.</div>`;
}

async function deleteApp(id) {
  if (!confirm('App löschen?')) return;
  await fetch(`/api/apps/${id}`, { method:'DELETE' });
  await loadApps();
  renderAppsView();
  renderGrid();
}
window.deleteApp = deleteApp;

function editApp(id) {
  const a = S.apps.find(x=>x.id===id);
  if (!a) return;
  S.editApp = id; S.selIcon = a.icon; S.selColor = {bg:a.bg,ic:a.ic};
  el('modal-title').textContent = 'App bearbeiten';
  el('edit-app-id').value = id;
  el('app-name').value = a.name;
  el('app-url').value  = a.url;
  el('app-cat').value  = a.category||'other';
  el('app-pinned').checked = !!a.pinned;
  document.querySelectorAll('.ip-btn').forEach(b=>b.classList.toggle('sel',b.dataset.icon===S.selIcon));
  document.querySelectorAll('.cp-sw').forEach(s=>s.classList.toggle('sel',s.dataset.bg===S.selColor.bg));
  el('app-modal').style.display='flex';
}
window.editApp = editApp;

// ── Settings ───────────────────────────────────────────────────────────────
function renderSettings() {
  const s = S.settings;
  el('settings-grid').innerHTML = `
    <div class="settings-card card">
      <div class="card-hd"><span><i class="ti ti-palette"></i>Darstellung</span></div>
      <div class="settings-body">
        <div class="set-row"><label>Theme</label><select id="st-theme"><option value="dark" ${s.theme==='dark'?'selected':''}>Dunkel</option><option value="light" ${s.theme==='light'?'selected':''}>Hell</option></select></div>
        <div class="set-row"><label>Sprache</label><select id="st-lang"><option value="de" ${s.language==='de'?'selected':''}>Deutsch</option><option value="en" ${s.language==='en'?'selected':''}>English</option></select></div>
        <div class="set-row"><label>Poll-Intervall</label><select id="st-interval"><option value="3">3s</option><option value="5" ${s.refreshInterval==5?'selected':''}>5s</option><option value="10" ${s.refreshInterval==10?'selected':''}>10s</option><option value="30">30s</option></select></div>
      </div>
    </div>
    <div class="settings-card card">
      <div class="card-hd"><span><i class="ti ti-cloud"></i>Wetter</span></div>
      <div class="settings-body">
        <div class="set-row"><label>Anbieter</label><select id="st-weather-prov"><option value="open-meteo" ${s.weatherProvider==='open-meteo'?'selected':''}>Open-Meteo (kostenlos)</option><option value="openweathermap" ${s.weatherProvider==='openweathermap'?'selected':''}>OpenWeatherMap (API Key)</option></select></div>
        <div class="set-row"><label>Stadt / Ort</label><input id="st-weather-city" type="text" value="${esc(s.weatherCity||'Hamburg')}" placeholder="Hamburg"></div>
        <div class="set-row"><label>Breitengrad</label><input id="st-weather-lat" type="text" value="${esc(s.weatherLat||'53.55')}" placeholder="53.55"></div>
        <div class="set-row"><label>Längengrad</label><input id="st-weather-lon" type="text" value="${esc(s.weatherLon||'10.00')}" placeholder="10.00"></div>
        <div class="set-row"><label>OWM API Key</label><input id="st-owm-key" type="password" value="${esc(s.openweatherKey||'')}" placeholder="nur für OpenWeatherMap"></div>
        <a href="https://openweathermap.org/api" target="_blank" style="font-size:11px;color:var(--ac);padding:4px 0;display:block">→ Kostenloser OWM API Key</a>
      </div>
    </div>
    <div class="settings-card card">
      <div class="card-hd"><span><i class="ti ti-server"></i>Unraid Server</span></div>
      <div class="settings-body">
        ${[1,2,3].map(i=>`
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--bd)">
          <div style="font-size:11px;font-weight:600;color:var(--mu);margin-bottom:6px">Server ${i}</div>
          <div class="set-row"><label>Name</label><input id="st-u${i}-name" type="text" value="${esc(s[`unraid${i}Name`]||'')}" placeholder="Tower ${i}"></div>
          <div class="set-row"><label>Host URL</label><input id="st-u${i}-host" type="text" value="${esc(s[`unraid${i}Host`]||'')}" placeholder="http://192.168.1.${i*10}"></div>
          <div class="set-row"><label>API Key</label><input id="st-u${i}-key" type="password" value="${esc(s[`unraid${i}ApiKey`]||'')}" placeholder="Unraid API Key"></div>
        </div>`).join('')}
      </div>
    </div>
    <div class="settings-card card">
      <div class="card-hd"><span><i class="ti ti-calendar"></i>Kalender</span></div>
      <div class="settings-body">
        <div class="set-row"><label>iCal URLs</label><textarea id="st-ical" rows="4" placeholder="https://nextcloud.example.com/remote.php/dav/public-calendars/xxx/&#10;Eine URL pro Zeile">${esc((s.icalUrls||[]).join('\n'))}</textarea></div>
        <div style="font-size:10px;font-weight:600;color:var(--mu);padding:8px 0 4px">CalDAV (Nextcloud, Baikal etc.)</div>
        <div class="set-row"><label>CalDAV URL</label><input id="st-caldav-url" type="text" value="${esc(s.caldavUrl||'')}" placeholder="https://nextcloud.example.com/remote.php/dav"></div>
        <div class="set-row"><label>Benutzer</label><input id="st-caldav-user" type="text" value="${esc(s.caldavUser||'')}"></div>
        <div class="set-row"><label>Passwort</label><input id="st-caldav-pass" type="password" value="${esc(s.caldavPassword||'')}"></div>
      </div>
    </div>
    <div class="settings-card card">
      <div class="card-hd"><span><i class="ti ti-shield-check"></i>Dienst-APIs</span></div>
      <div class="settings-body">
        <div class="set-row"><label>AdGuard URL</label><input id="st-ag-url" type="text" value="${esc(s.adguardUrl||'')}" placeholder="http://tower:3000"></div>
        <div class="set-row"><label>AdGuard Benutzer</label><input id="st-ag-user" type="text" value="${esc(s.adguardUser||'admin')}"></div>
        <div class="set-row"><label>AdGuard Passwort</label><input id="st-ag-pass" type="password" value="${esc(s.adguardPassword||'')}"></div>
        <div class="set-row"><label>CrowdSec URL</label><input id="st-cs-url" type="text" value="${esc(s.crowdsecUrl||'')}" placeholder="http://tower:8080"></div>
        <div class="set-row"><label>CrowdSec API Key</label><input id="st-cs-key" type="password" value="${esc(s.crowdsecKey||'')}"></div>
      </div>
    </div>`;
}

async function saveSettings() {
  const G = id => el(id)?.value?.trim()||'';
  const s = {
    theme:           G('st-theme'),
    language:        G('st-lang'),
    refreshInterval: parseInt(G('st-interval')||'5'),
    weatherProvider: G('st-weather-prov'),
    weatherCity:     G('st-weather-city'),
    weatherLat:      G('st-weather-lat'),
    weatherLon:      G('st-weather-lon'),
    openweatherKey:  G('st-owm-key'),
    unraid1Name:     G('st-u1-name'), unraid1Host: G('st-u1-host'), unraid1ApiKey: G('st-u1-key'),
    unraid2Name:     G('st-u2-name'), unraid2Host: G('st-u2-host'), unraid2ApiKey: G('st-u2-key'),
    unraid3Name:     G('st-u3-name'), unraid3Host: G('st-u3-host'), unraid3ApiKey: G('st-u3-key'),
    icalUrls:        el('st-ical')?.value.split('\n').map(u=>u.trim()).filter(Boolean)||[],
    caldavUrl:       G('st-caldav-url'),
    caldavUser:      G('st-caldav-user'),
    caldavPassword:  G('st-caldav-pass'),
    adguardUrl:      G('st-ag-url'),
    adguardUser:     G('st-ag-user'),
    adguardPassword: G('st-ag-pass'),
    crowdsecUrl:     G('st-cs-url'),
    crowdsecKey:     G('st-cs-key'),
  };
  try {
    S.settings = await (await fetch('/api/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(s) })).json();
    applyTheme();
    el('save-msg').textContent = '✓ Gespeichert';
    setTimeout(()=>el('save-msg').textContent='', 3000);
  } catch(e) { alert('Fehler: '+e.message); }
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.settings.theme||'dark');
  const i = document.querySelector('#theme-btn i');
  if (i) i.className = S.settings.theme==='dark' ? 'ti ti-sun' : 'ti ti-moon';
}

// ── Modal ──────────────────────────────────────────────────────────────────
function buildPickers() {
  el('icon-picker').innerHTML = ICONS.map((ic,i)=>`<button class="ip-btn${i===0?' sel':''}" data-icon="${ic}" onclick="pickIcon(this,'${ic}')"><i class="ti ${ic}"></i></button>`).join('');
  el('color-picker').innerHTML = COLORS.map((c,i)=>`<div class="cp-sw${i===0?' sel':''}" style="background:${c.bg}" data-bg="${c.bg}" onclick="pickColor(this,'${c.bg}','${c.ic}')"></div>`).join('');
}

function openAddModal() {
  S.editApp=null;
  el('modal-title').textContent='App hinzufügen';
  el('edit-app-id').value=''; el('app-name').value=''; el('app-url').value='';
  el('app-cat').value='tools'; el('app-pinned').checked=false;
  el('app-modal').style.display='flex';
}

window.pickIcon = function(btn,icon) {
  S.selIcon=icon;
  document.querySelectorAll('.ip-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
};
window.pickColor = function(el2,bg,ic) {
  S.selColor={bg,ic};
  document.querySelectorAll('.cp-sw').forEach(s=>s.classList.remove('sel'));
  el2.classList.add('sel');
};

async function saveApp() {
  const name = el('app-name').value.trim(), url = el('app-url').value.trim();
  if (!name||!url) { alert('Name und URL erforderlich'); return; }
  const payload = { name, url, category:el('app-cat').value, icon:S.selIcon, bg:S.selColor.bg, ic:S.selColor.ic, pinned:el('app-pinned').checked };
  const id = S.editApp;
  await fetch(id?`/api/apps/${id}`:'/api/apps', { method:id?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  el('app-modal').style.display='none';
  await loadApps();
  renderAppsView();
  renderGrid();
}

// ── Search ─────────────────────────────────────────────────────────────────
function wireSearch() {
  const input = el('search-input'), drop = el('search-results');
  input.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    if (!q) { drop.classList.remove('open'); return; }
    const hits = [
      ...(S.snap?.containers||[]).filter(c=>c.name.includes(q)||c.image.toLowerCase().includes(q))
        .map(c=>({ label:c.name, sub:c.image, icon:'ti-brand-docker', tag:'Container', fn:()=>{ switchView('docker'); setTimeout(()=>selCt(c.id),100); } })),
      ...S.apps.filter(a=>a.name.toLowerCase().includes(q)||a.url.includes(q))
        .map(a=>({ label:a.name, sub:a.url, icon:a.icon, tag:'App', fn:()=>window.open(a.url,'_blank','noopener') })),
      ...(S.snap?.unraidServers||[]).filter(s=>s.name.toLowerCase().includes(q))
        .map(s=>({ label:s.name, sub:s.host||'', icon:'ti-server', tag:'Server', fn:()=>switchView('unraid') })),
      ...['grid','docker','unraid','apps','settings'].filter(v=>v.includes(q))
        .map(v=>({ label:v, sub:'Seite', icon:'ti-layout-dashboard', tag:'Seite', fn:()=>switchView(v) })),
    ].slice(0,8);
    if (!hits.length) { drop.classList.remove('open'); return; }
    drop.innerHTML = hits.map((h,i)=>`<div class="sr-item" onclick="_srH[${i}]()"><i class="ti ${h.icon}"></i><span>${esc(h.label)}</span><span class="sr-tag">${h.tag}</span></div>`).join('');
    window._srH = hits.map(h=>h.fn);
    drop.classList.add('open');
  });
  document.addEventListener('click', e=>{ if (!e.target.closest('.sb-search-wrap')) drop.classList.remove('open'); });
}

// ── Events ─────────────────────────────────────────────────────────────────
function wireEvents() {
  el('sb-collapse').addEventListener('click', ()=>el('sidebar').classList.toggle('col'));
  el('mobile-menu').addEventListener('click', ()=>el('sidebar').classList.toggle('mob-open'));
  el('theme-btn').addEventListener('click', ()=>{
    S.settings.theme = S.settings.theme==='dark'?'light':'dark';
    applyTheme();
    fetch('/api/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(S.settings) });
  });
  el('lang-btn').addEventListener('click', ()=>{
    S.settings.language = S.settings.language==='de'?'en':'de';
    renderCurrentView();
  });
  el('refresh-btn').addEventListener('click', ()=>{
    fetchREST();
    const i = el('refresh-btn').querySelector('i');
    i.style.transition='transform .6s'; i.style.transform='rotate(360deg)';
    setTimeout(()=>{ i.style.transition=''; i.style.transform=''; }, 650);
  });
  el('edit-layout-btn').addEventListener('click', toggleEditMode);
  el('open-add-app').addEventListener('click', openAddModal);
  el('add-app-btn').addEventListener('click', openAddModal);
  el('modal-close').addEventListener('click', ()=>el('app-modal').style.display='none');
  el('modal-cancel').addEventListener('click', ()=>el('app-modal').style.display='none');
  el('modal-save').addEventListener('click', saveApp);
  el('app-modal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.style.display='none'; });
  el('app-cat-filter').addEventListener('change', renderAppsView);
  el('save-settings-btn').addEventListener('click', saveSettings);
  // Container filters
  el('ct-filters').addEventListener('click', e=>{
    const btn = e.target.closest('.fbtn'); if (!btn) return;
    document.querySelectorAll('#ct-filters .fbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    S.ctFilter = btn.dataset.f; S.selCt=null; el('ct-detail').style.display='none'; renderDocker();
  });
  el('ct-search').addEventListener('input', function(){ S.ctSearch=this.value.toLowerCase(); renderDocker(); });
  document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click', ()=>switchView(b.dataset.nav)));
}

// ── Start ──────────────────────────────────────────────────────────────────
init();
