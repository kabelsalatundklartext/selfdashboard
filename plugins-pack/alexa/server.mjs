// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/_shared/secret-crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join as join2 } from "node:path";

// plugins-pack/_shared/data-dir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// plugins-pack/_shared/secret-crypto.ts
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
var KEY_LEN = 32;
var cachedKey = null;
function deriveKey(material) {
  return scryptSync(material, "selfdashboard.calendar.v1", KEY_LEN);
}
function loadOrCreateKey() {
  if (cachedKey) return cachedKey;
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim();
  if (envKey) {
    cachedKey = deriveKey(envKey);
    return cachedKey;
  }
  const keyFile = join2(dataDir(), ".calendar-key");
  if (existsSync(keyFile)) {
    cachedKey = deriveKey(readFileSync(keyFile, "utf8").trim());
    return cachedKey;
  }
  const fresh = randomBytes(32).toString("base64");
  writeFileSync(keyFile, fresh, "utf8");
  try {
    chmodSync(keyFile, 384);
  } catch {
  }
  cachedKey = deriveKey(fresh);
  return cachedKey;
}
var TAG_LEN = 16;
var SEALED_SECRET_PREFIX = "sdsec1:";
function isSealedSecret(value) {
  return typeof value === "string" && value.startsWith(SEALED_SECRET_PREFIX);
}
function sealSecret(plaintext) {
  if (!plaintext) return "";
  const key = loadOrCreateKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}
function openSealedSecret(value) {
  if (!isSealedSecret(value)) return value;
  try {
    const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), "base64");
    if (buf.length < IV_LEN + TAG_LEN + 1) return "";
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, loadOrCreateKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

// plugins-pack/alexa/lib/store.ts
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { join as join3 } from "node:path";
function storeDir() {
  return join3(dataDir(), "alexa");
}
function storePath() {
  return join3(storeDir(), "connection.json");
}
async function readStore() {
  try {
    const raw = await readFile(storePath(), "utf8");
    const j = JSON.parse(raw);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}
async function writeStore(data) {
  await mkdir(storeDir(), { recursive: true });
  const path = storePath();
  const tmp = `${path}.tmp`;
  data.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await writeFile(tmp, `${JSON.stringify(data)}
`, "utf8");
  await rename(tmp, path);
}
async function deleteStore() {
  try {
    await unlink(storePath());
  } catch {
  }
}
async function saveConfig(cfg) {
  const prev = await readStore();
  const next = { ...prev, ...cfg, updatedAt: "" };
  await writeStore(next);
  return next;
}
async function saveSession(cookieData, customerName) {
  const prev = await readStore() ?? {
    host: "",
    port: 0,
    amazonPage: "amazon.de",
    serviceHost: "layla.amazon.de",
    updatedAt: ""
  };
  prev.cookieData = sealSecret(JSON.stringify(cookieData ?? null));
  if (customerName) prev.customerName = customerName;
  prev.connectedAt = (/* @__PURE__ */ new Date()).toISOString();
  await writeStore(prev);
}
async function readSession() {
  const record = await readStore();
  if (!record?.cookieData) return null;
  try {
    const json = openSealedSecret(record.cookieData);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

// plugins-pack/alexa/lib/connection.ts
import AlexaRemote from "alexa-remote2";
var live = null;
var liveInit = null;
var pending = null;
function call(fn) {
  return new Promise((resolve, reject) => {
    fn((err, body) => err ? reject(err) : resolve(body));
  });
}
function attachRefreshPersist(alexa) {
  alexa.on("cookie", () => {
    void saveSession(alexa.cookieData).catch(() => {
    });
  });
}
function buildBaseOptions(cfg) {
  return {
    amazonPage: cfg.amazonPage,
    alexaServiceHost: cfg.serviceHost,
    useWsMqtt: false,
    usePushConnection: false,
    // No background refresh timer inside a request process; alexa-remote2 still
    // refreshes the cookie on demand from the stored registration data.
    cookieRefreshInterval: 0
  };
}
function loginPending() {
  return Boolean(pending && Date.now() - pending.startedAt < 10 * 60 * 1e3);
}
async function beginLogin(cfg) {
  if (pending) {
    try {
      pending.alexa.stop();
    } catch {
    }
    pending = null;
  }
  const alexa = new AlexaRemote();
  const proxyUrl = `http://${cfg.host}:${cfg.port}/`;
  alexa.on("cookie", () => {
    void saveSession(alexa.cookieData).then(() => fetchCustomerName(alexa)).catch(() => {
    });
    try {
      alexa.stopProxyServer(() => {
      });
    } catch {
    }
    live = null;
    liveInit = null;
    pending = null;
  });
  const options = {
    ...buildBaseOptions(cfg),
    proxyOnly: true,
    proxyOwnIp: cfg.host,
    proxyPort: cfg.port,
    formerRegistrationData: await readSession() ?? void 0
  };
  await new Promise((resolve) => {
    try {
      alexa.init(options, (err) => {
        if (err) void logPluginApiFailure("alexa", "begin", err.message);
        resolve();
      });
    } catch (e) {
      void logPluginApiFailure("alexa", "begin", e instanceof Error ? e.message : String(e));
      resolve();
    }
  });
  pending = { alexa, proxyUrl, startedAt: Date.now() };
  return { proxyUrl };
}
async function fetchCustomerName(alexa) {
  try {
    const me = await call((cb) => alexa.getUsersMe(cb));
    if (me?.customerName) await saveSession(alexa.cookieData, me.customerName);
  } catch {
  }
}
async function initFromStore() {
  const record = await readStore();
  const session = await readSession();
  if (!record || !session) throw new Error("not_connected");
  const alexa = new AlexaRemote();
  attachRefreshPersist(alexa);
  const options = {
    ...buildBaseOptions(record),
    // Passing the cookieData object as `cookie` lets alexa-remote2 reuse the
    // registration data and refresh internally.
    cookie: session,
    formerRegistrationData: session
  };
  await new Promise((resolve, reject) => {
    alexa.init(options, (err) => err ? reject(err) : resolve());
  });
  return alexa;
}
async function ensureLive() {
  if (live) return live;
  if (!liveInit) {
    liveInit = initFromStore().then((a) => {
      live = a;
      return a;
    }).catch((e) => {
      liveInit = null;
      throw e;
    });
  }
  return liveInit;
}
function dropLive() {
  if (live) {
    try {
      live.stop();
    } catch {
    }
  }
  live = null;
  liveInit = null;
}
async function disconnect() {
  dropLive();
  if (pending) {
    try {
      pending.alexa.stop();
    } catch {
    }
    pending = null;
  }
  await deleteStore();
}
async function withLive(label, fn) {
  let alexa;
  try {
    alexa = await ensureLive();
  } catch (e) {
    if (e instanceof Error && e.message === "not_connected") throw e;
    throw new Error("reauth_required");
  }
  try {
    return await fn(alexa);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/auth|cookie|401|403|forbidden|login/i.test(msg)) {
      dropLive();
      void logPluginApiFailure("alexa", label, "reauth_required", { detail: msg });
      throw new Error("reauth_required");
    }
    throw e;
  }
}
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
async function listDevices() {
  return withLive("devices", async (alexa) => {
    const body = await call((cb) => alexa.getDevices(cb));
    const raw = Array.isArray(body?.devices) ? body.devices : [];
    return raw.filter(isObj).map((d) => {
      const caps = Array.isArray(d.capabilities) ? d.capabilities : [];
      const hasMusic = d.hasMusicPlayer === true || caps.some((c) => typeof c === "string" && c.includes("AUDIO_PLAYER"));
      return {
        serial: typeof d.serialNumber === "string" ? d.serialNumber : "",
        name: typeof d.accountName === "string" ? d.accountName : "Echo",
        type: typeof d.deviceType === "string" ? d.deviceType : "",
        online: d.online === true,
        hasMusic
      };
    }).filter((d) => d.serial);
  });
}
async function getPlayer(serial) {
  return withLive("player", async (alexa) => {
    const body = await call((cb) => alexa.getPlayerInfo(serial, cb));
    const p = isObj(body?.playerInfo) ? body.playerInfo : {};
    const info = isObj(p.infoText) ? p.infoText : {};
    const art = isObj(p.mainArt) ? p.mainArt : {};
    const provider = isObj(p.provider) ? p.provider : {};
    const volume = isObj(p.volume) ? p.volume : {};
    return {
      serial,
      state: typeof p.state === "string" ? p.state : "IDLE",
      title: typeof info.title === "string" ? info.title : void 0,
      artist: typeof info.subText1 === "string" ? info.subText1 : void 0,
      album: typeof info.subText2 === "string" ? info.subText2 : void 0,
      imageUrl: typeof art.url === "string" ? art.url : void 0,
      provider: typeof provider.providerName === "string" ? provider.providerName : void 0,
      volume: typeof volume.volume === "number" ? volume.volume : void 0,
      muted: volume.muted === true
    };
  });
}
var PLAYER_COMMANDS = /* @__PURE__ */ new Set(["play", "pause", "next", "previous", "forward", "rewind"]);
async function ownedDeviceSerials(alexa) {
  const body = await call((cb) => alexa.getDevices(cb));
  const raw = Array.isArray(body?.devices) ? body.devices : [];
  return new Set(
    raw.filter(isObj).map((d) => typeof d.serialNumber === "string" ? d.serialNumber : "").filter(Boolean)
  );
}
async function ownedSmarthomeIds(alexa) {
  const body = await call((cb) => alexa.getSmarthomeEntities(cb));
  const raw = Array.isArray(body) ? body : isObj(body) && Array.isArray(body.entities) ? body.entities : [];
  return new Set(
    raw.filter(isObj).map((e) => typeof e.id === "string" ? e.id : typeof e.applianceId === "string" ? e.applianceId : "").filter(Boolean)
  );
}
async function control(serial, command, value) {
  return withLive("control", async (alexa) => {
    if (!(await ownedDeviceSerials(alexa)).has(serial)) throw new Error("no_device");
    if (command === "volume") {
      const vol = Math.max(0, Math.min(100, Math.round(value ?? 0)));
      await call((cb) => alexa.sendCommand(serial, "volume", vol, cb));
      return;
    }
    if (!PLAYER_COMMANDS.has(command)) throw new Error("invalid_command");
    await call((cb) => alexa.sendCommand(serial, command, "", cb));
  });
}
async function listSmarthome() {
  return withLive("smarthome", async (alexa) => {
    const body = await call((cb) => alexa.getSmarthomeEntities(cb));
    const raw = Array.isArray(body) ? body : isObj(body) && Array.isArray(body.entities) ? body.entities : [];
    return raw.filter(isObj).map((e) => ({
      id: typeof e.id === "string" ? e.id : typeof e.applianceId === "string" ? e.applianceId : "",
      name: typeof e.name === "string" ? e.name : typeof e.friendlyName === "string" ? e.friendlyName : "Ger\xE4t"
    })).filter((e) => e.id);
  });
}
async function toggleSmarthome(id, on) {
  return withLive("smarthome-toggle", async (alexa) => {
    if (!(await ownedSmarthomeIds(alexa)).has(id)) throw new Error("no_device");
    await call((cb) => alexa.executeSmarthomeDeviceAction([id], [on ? "turnOn" : "turnOff"], "APPLIANCE", cb));
  });
}
function routineName(r) {
  if (typeof r.name === "string" && r.name.trim()) return r.name.trim();
  const triggers = Array.isArray(r.triggers) ? r.triggers : [];
  for (const t of triggers) {
    if (isObj(t) && isObj(t.payload) && typeof t.payload.utterance === "string" && t.payload.utterance.trim()) {
      return t.payload.utterance.trim();
    }
  }
  return typeof r.automationId === "string" ? r.automationId.slice(0, 18) : "Routine";
}
async function listRoutines() {
  return withLive("routines", async (alexa) => {
    const body = await call((cb) => alexa.getAutomationRoutines(200, cb));
    const raw = Array.isArray(body) ? body : [];
    return raw.filter(isObj).map((r) => ({
      id: typeof r.automationId === "string" ? r.automationId : "",
      name: routineName(r)
    })).filter((r) => r.id);
  });
}
async function runRoutine(automationId, serial) {
  return withLive("routine-run", async (alexa) => {
    const body = await call((cb) => alexa.getAutomationRoutines(200, cb));
    const raw = Array.isArray(body) ? body : [];
    const routine = raw.filter(isObj).find((r) => r.automationId === automationId);
    if (!routine) throw new Error("routine_not_found");
    let target = serial;
    if (!target) {
      const devices = await call((cb) => alexa.getDevices(cb));
      const first = (Array.isArray(devices?.devices) ? devices.devices : []).filter(isObj).find((d) => d.online === true);
      target = first && typeof first.serialNumber === "string" ? first.serialNumber : void 0;
    }
    if (!target) throw new Error("no_device");
    await call((cb) => alexa.executeAutomationRoutine(target, routine, cb));
  });
}

// plugins-pack/alexa/server.ts
var dynamic = "force-dynamic";
var REGIONS = {
  de: { amazonPage: "amazon.de", serviceHost: "layla.amazon.de" },
  com: { amazonPage: "amazon.com", serviceHost: "pitangui.amazon.com" },
  "co.uk": { amazonPage: "amazon.co.uk", serviceHost: "alexa.amazon.co.uk" },
  "co.jp": { amazonPage: "amazon.co.jp", serviceHost: "alexa.amazon.co.jp" }
};
var PORT_MIN = 1024;
var PORT_MAX = 65535;
function isAllowedProxyHost(h) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return true;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return false;
  if (o[0] === 10) return true;
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
  if (o[0] === 192 && o[1] === 168) return true;
  if (o[0] === 127) return true;
  return false;
}
function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}
function resolveConfig(body) {
  const region = REGIONS[String(body.region ?? "de")] ?? REGIONS.de;
  const host = String(body.host ?? "").trim();
  const port = Number(body.port);
  if (!host || !/^[a-zA-Z0-9.\-:]+$/.test(host) || !isAllowedProxyHost(host)) return null;
  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) return null;
  return { host, port, amazonPage: region.amazonPage, serviceHost: region.serviceHost };
}
async function handleBegin(body) {
  const cfg = resolveConfig(body);
  if (!cfg) return jsonResponse({ error: "invalid_config" }, 400);
  await saveConfig(cfg);
  const { proxyUrl } = await beginLogin(cfg);
  return jsonResponse({ proxyUrl });
}
async function handleStatus() {
  const record = await readStore();
  return jsonResponse({
    connected: Boolean(record?.cookieData),
    customerName: record?.customerName,
    host: record?.host,
    port: record?.port,
    amazonPage: record?.amazonPage,
    loginPending: loginPending()
  });
}
async function handleDevices() {
  return jsonResponse({ devices: await listDevices() });
}
async function handlePlayer(body) {
  const serial = String(body.serial ?? "").trim();
  if (!serial) return jsonResponse({ error: "missing_serial" }, 400);
  return jsonResponse(await getPlayer(serial));
}
async function handleControl(body) {
  const serial = String(body.serial ?? "").trim();
  const command = String(body.command ?? "").trim();
  if (!serial || !command) return jsonResponse({ error: "missing_params" }, 400);
  await control(serial, command, typeof body.value === "number" ? body.value : void 0);
  return jsonResponse({ ok: true });
}
async function handleSmarthome() {
  return jsonResponse({ devices: await listSmarthome() });
}
async function handleSmarthomeToggle(body) {
  const id = String(body.id ?? "").trim();
  if (!id) return jsonResponse({ error: "missing_id" }, 400);
  await toggleSmarthome(id, body.on === true);
  return jsonResponse({ ok: true });
}
async function handleRoutines() {
  return jsonResponse({ routines: await listRoutines() });
}
async function handleRoutineRun(body) {
  const id = String(body.id ?? "").trim();
  if (!id) return jsonResponse({ error: "missing_id" }, 400);
  const serial = String(body.serial ?? "").trim() || void 0;
  await runRoutine(id, serial);
  return jsonResponse({ ok: true });
}
async function handleDisconnect() {
  await disconnect();
  return jsonResponse({ ok: true });
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const action = String(body.action ?? "status");
  try {
    switch (action) {
      case "begin":
        return await handleBegin(body);
      case "status":
        return await handleStatus();
      case "devices":
        return await handleDevices();
      case "player":
        return await handlePlayer(body);
      case "control":
        return await handleControl(body);
      case "smarthome":
        return await handleSmarthome();
      case "smarthome-toggle":
        return await handleSmarthomeToggle(body);
      case "routines":
        return await handleRoutines();
      case "routine-run":
        return await handleRoutineRun(body);
      case "disconnect":
        return await handleDisconnect();
      default:
        return jsonResponse({ error: "invalid_action" }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "not_connected" || msg === "reauth_required") {
      return jsonResponse({ error: msg }, 401);
    }
    if (msg === "invalid_command" || msg === "no_device" || msg === "routine_not_found") {
      return jsonResponse({ error: msg }, 400);
    }
    void logPluginApiFailure("alexa", action, "fetch_failed", { detail: msg });
    return jsonResponse({ error: "fetch_failed", detail: msg }, 502);
  }
}
function alexaServerHandler(ctx) {
  if (ctx.request.method !== "POST") {
    return Promise.resolve(jsonResponse({ error: "method_not_allowed" }, 405));
  }
  return handlePost(ctx.request);
}
export {
  alexaServerHandler as default,
  dynamic
};
