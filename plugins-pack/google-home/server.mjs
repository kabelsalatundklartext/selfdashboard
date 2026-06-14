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

// plugins-pack/_shared/ssrf.ts
import net from "node:net";
import { lookup } from "node:dns/promises";
var BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "instance-data"
]);
function isAlwaysBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:")) return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    const embedded = embeddedIpv4(normalized);
    if (embedded) return isAlwaysBlockedIp(embedded);
  }
  return false;
}
function embeddedIpv4(normalizedV6) {
  if (!normalizedV6.startsWith("::ffff:")) return null;
  const rest = normalizedV6.slice("::ffff:".length);
  if (net.isIPv4(rest)) return rest;
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return `${hi >> 8 & 255}.${hi & 255}.${lo >> 8 & 255}.${lo & 255}`;
}
function isPrivateLanIp(ip) {
  if (!net.isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}
function blockPrivateLanUrls() {
  const v = process.env.SELFDASHBOARD_BLOCK_PRIVATE_CALENDAR_URLS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
var UnsafeOutboundUrlError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsafeOutboundUrlError";
  }
};
function assertSafeOutboundUrl(urlStr) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new UnsafeOutboundUrlError("invalid_url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new UnsafeOutboundUrlError("unsupported_protocol");
  }
  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host) throw new UnsafeOutboundUrlError("missing_host");
  if (BLOCKED_HOSTNAMES.has(host)) throw new UnsafeOutboundUrlError("blocked_host");
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeOutboundUrlError("blocked_host");
  }
  const ipVersion = net.isIP(host);
  if (ipVersion) {
    if (isAlwaysBlockedIp(host)) throw new UnsafeOutboundUrlError("blocked_ip");
    if (blockPrivateLanUrls() && isPrivateLanIp(host)) {
      throw new UnsafeOutboundUrlError("private_ip_blocked");
    }
    return;
  }
  if (host.endsWith(".localhost")) throw new UnsafeOutboundUrlError("blocked_host");
}
async function assertSafeOutboundUrlResolved(urlStr) {
  assertSafeOutboundUrl(urlStr);
  const u = new URL(urlStr);
  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (net.isIP(host)) return;
  let addrs;
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeOutboundUrlError("dns_lookup_failed");
  }
  if (addrs.length === 0) throw new UnsafeOutboundUrlError("dns_lookup_failed");
  for (const { address } of addrs) {
    if (isAlwaysBlockedIp(address)) throw new UnsafeOutboundUrlError("blocked_ip_resolved");
    if (blockPrivateLanUrls() && isPrivateLanIp(address)) {
      throw new UnsafeOutboundUrlError("private_ip_blocked");
    }
  }
}
async function fetchWithSsrfGuard(urlStr, init, maxRedirects = 5) {
  await assertSafeOutboundUrlResolved(urlStr);
  let current = urlStr;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const resp = await fetch(current, { ...init, redirect: "manual" });
    if (resp.status < 300 || resp.status >= 400) return resp;
    const location = resp.headers.get("location");
    if (!location) return resp;
    current = new URL(location, current).href;
    await assertSafeOutboundUrlResolved(current);
  }
  throw new UnsafeOutboundUrlError("too_many_redirects");
}

// plugins-pack/google-home/server.ts
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { join as join3 } from "node:path";
import { randomBytes as randomBytes2, createHash } from "node:crypto";
var dynamic = "force-dynamic";
var AUTH_BASE = "https://nestservices.google.com/partnerconnections";
var TOKEN_URL = "https://oauth2.googleapis.com/token";
var SDM_API = "https://smartdevicemanagement.googleapis.com/v1";
var SCOPE = "https://www.googleapis.com/auth/sdm.service";
var FETCH_TIMEOUT_MS = 12e3;
var TOKEN_SKEW_MS = 3e4;
function storeDir() {
  return join3(dataDir(), "google-home");
}
function storeKey(projectId, clientId) {
  return createHash("sha256").update(`${projectId.trim()}:${clientId.trim()}`).digest("hex").slice(0, 24);
}
function storePath(key) {
  return join3(storeDir(), `${key}.json`);
}
async function readStore(key) {
  try {
    const raw = await readFile(storePath(key), "utf8");
    const j = JSON.parse(raw);
    return j && typeof j === "object" && typeof j.projectId === "string" ? j : null;
  } catch {
    return null;
  }
}
async function writeStore(key, data) {
  await mkdir(storeDir(), { recursive: true });
  const path = storePath(key);
  const tmp = `${path}.tmp`;
  data.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await writeFile(tmp, `${JSON.stringify(data)}
`, "utf8");
  await rename(tmp, path);
}
async function deleteStore(key) {
  try {
    await unlink(storePath(key));
  } catch {
  }
}
async function tokenRequest(form, signal) {
  const res = await fetchWithSsrfGuard(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(form).toString(),
    cache: "no-store",
    signal
  });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  return { ok: res.ok, status: res.status, body };
}
async function ensureAccessToken(key, record, signal) {
  const cached = record.accessToken ? openSealedSecret(record.accessToken) : "";
  if (cached && record.expiresAt && record.expiresAt - TOKEN_SKEW_MS > Date.now()) {
    return cached;
  }
  const refresh = record.refreshToken ? openSealedSecret(record.refreshToken) : "";
  if (!refresh) throw new Error("not_connected");
  const secret = openSealedSecret(record.clientSecret);
  if (!secret) throw new Error("secret_unreadable");
  const { body } = await tokenRequest(
    {
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: record.clientId,
      client_secret: secret
    },
    signal
  );
  if (!body.access_token) {
    if (body.error === "invalid_grant") throw new Error("reauth_required");
    throw new Error("refresh_failed");
  }
  record.accessToken = sealSecret(body.access_token);
  record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1e3;
  if (body.refresh_token) record.refreshToken = sealSecret(body.refresh_token);
  await writeStore(key, record);
  return body.access_token;
}
async function sdmApi(token, path, method, signal, jsonBody) {
  const res = await fetchWithSsrfGuard(`${SDM_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...jsonBody !== void 0 ? { "Content-Type": "application/json" } : {}
    },
    body: jsonBody !== void 0 ? JSON.stringify(jsonBody) : void 0,
    cache: "no-store",
    signal
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function num(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return void 0;
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function sdmErrorDetail(json, text) {
  if (isObj(json) && isObj(json.error) && typeof json.error.message === "string") {
    return json.error.message;
  }
  return text.slice(0, 200);
}
var TRAIT = {
  info: "sdm.devices.traits.Info",
  connectivity: "sdm.devices.traits.Connectivity",
  temperature: "sdm.devices.traits.Temperature",
  humidity: "sdm.devices.traits.Humidity",
  setpoint: "sdm.devices.traits.ThermostatTemperatureSetpoint",
  mode: "sdm.devices.traits.ThermostatMode",
  hvac: "sdm.devices.traits.ThermostatHvac"
};
function shortType(type) {
  const i = type.lastIndexOf(".");
  return i >= 0 ? type.slice(i + 1) : type;
}
function roomName(device) {
  const rel = device.parentRelations;
  if (!Array.isArray(rel)) return void 0;
  for (const r of rel) {
    if (isObj(r) && typeof r.displayName === "string" && r.displayName.trim()) return r.displayName.trim();
  }
  return void 0;
}
function normalizeDevice(device) {
  if (!isObj(device) || typeof device.name !== "string") return null;
  const traits = isObj(device.traits) ? device.traits : {};
  const type = shortType(str(device.type));
  const info = isObj(traits[TRAIT.info]) ? traits[TRAIT.info] : null;
  const customName = info && typeof info.customName === "string" ? info.customName.trim() : "";
  const conn = isObj(traits[TRAIT.connectivity]) ? traits[TRAIT.connectivity] : null;
  const online = conn ? str(conn.status).toUpperCase() === "ONLINE" : void 0;
  const tempTrait = isObj(traits[TRAIT.temperature]) ? traits[TRAIT.temperature] : null;
  const humTrait = isObj(traits[TRAIT.humidity]) ? traits[TRAIT.humidity] : null;
  const spTrait = isObj(traits[TRAIT.setpoint]) ? traits[TRAIT.setpoint] : null;
  const modeTrait = isObj(traits[TRAIT.mode]) ? traits[TRAIT.mode] : null;
  const hvacTrait = isObj(traits[TRAIT.hvac]) ? traits[TRAIT.hvac] : null;
  const isThermostat = Boolean(modeTrait || spTrait) || type === "THERMOSTAT";
  const room = roomName(device);
  const label = customName || room || (type ? type.charAt(0) + type.slice(1).toLowerCase() : "Ger\xE4t");
  const availableModes = modeTrait && Array.isArray(modeTrait.availableModes) ? modeTrait.availableModes.filter((m) => typeof m === "string") : void 0;
  return {
    name: device.name,
    type,
    label,
    room,
    online,
    isThermostat,
    ambientC: tempTrait ? num(tempTrait.ambientTemperatureCelsius) : void 0,
    humidity: humTrait ? num(humTrait.ambientHumidityPercent) : void 0,
    heatC: spTrait ? num(spTrait.heatCelsius) : void 0,
    coolC: spTrait ? num(spTrait.coolCelsius) : void 0,
    mode: modeTrait ? str(modeTrait.mode) || void 0 : void 0,
    availableModes,
    hvac: hvacTrait ? str(hvacTrait.status) || void 0 : void 0
  };
}
function normalizeDevices(json) {
  if (!isObj(json) || !Array.isArray(json.devices)) return [];
  return json.devices.map(normalizeDevice).filter((d) => d !== null);
}
function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}
async function handleBegin(body) {
  const projectId = str(body.projectId);
  const clientId = str(body.clientId);
  const secret = openSealedSecret(str(body.clientSecret)) || str(body.clientSecret);
  const redirectUri = str(body.redirectUri);
  if (!projectId || !clientId || !secret) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!/^[a-z0-9-]{6,}$/i.test(projectId)) return jsonResponse({ error: "invalid_project" }, 400);
  if (!/^https?:\/\//i.test(redirectUri)) return jsonResponse({ error: "invalid_redirect" }, 400);
  const key = storeKey(projectId, clientId);
  const state = `${key}.${randomBytes2(16).toString("hex")}`;
  await writeStore(key, {
    projectId,
    clientId,
    clientSecret: sealSecret(secret),
    pendingState: state,
    redirectUri,
    updatedAt: ""
  });
  const authUrl = `${AUTH_BASE}/${encodeURIComponent(projectId)}/auth?${new URLSearchParams({
    redirect_uri: redirectUri,
    access_type: "offline",
    prompt: "consent",
    client_id: clientId,
    response_type: "code",
    scope: SCOPE,
    state
  }).toString()}`;
  return jsonResponse({ authUrl });
}
async function handleStatus(body) {
  const projectId = str(body.projectId);
  const clientId = str(body.clientId);
  if (!projectId || !clientId) return jsonResponse({ connected: false });
  const record = await readStore(storeKey(projectId, clientId));
  return jsonResponse({ connected: Boolean(record?.refreshToken), deviceCount: record?.deviceCount });
}
async function handleDisconnect(body) {
  const projectId = str(body.projectId);
  const clientId = str(body.clientId);
  if (projectId && clientId) await deleteStore(storeKey(projectId, clientId));
  return jsonResponse({ ok: true });
}
async function handleDevices(body, signal) {
  const projectId = str(body.projectId);
  const clientId = str(body.clientId);
  if (!projectId || !clientId) return jsonResponse({ connected: false });
  const key = storeKey(projectId, clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ connected: false });
  const token = await ensureAccessToken(key, record, signal);
  const res = await sdmApi(token, `/enterprises/${encodeURIComponent(projectId)}/devices`, "GET", signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status >= 400) {
    const detail = sdmErrorDetail(res.json, res.text);
    void logPluginApiFailure("google-home", "devices", "api_error", { status: res.status, detail });
    return jsonResponse({ connected: true, error: "api_error", status: res.status, detail }, 502);
  }
  const devices = normalizeDevices(res.json);
  if (record.deviceCount !== devices.length) {
    record.deviceCount = devices.length;
    void writeStore(key, record);
  }
  return jsonResponse({ connected: true, devices });
}
var ALLOWED_COMMANDS = {
  "sdm.devices.commands.ThermostatMode.SetMode": (p) => {
    const mode = str(p.mode).toUpperCase();
    return ["HEAT", "COOL", "HEATCOOL", "OFF"].includes(mode) ? { mode } : null;
  },
  "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat": (p) => {
    const heatCelsius = num(p.heatCelsius);
    return heatCelsius !== void 0 && heatCelsius >= 5 && heatCelsius <= 35 ? { heatCelsius } : null;
  },
  "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool": (p) => {
    const coolCelsius = num(p.coolCelsius);
    return coolCelsius !== void 0 && coolCelsius >= 5 && coolCelsius <= 35 ? { coolCelsius } : null;
  }
};
async function handleCommand(body, signal) {
  const projectId = str(body.projectId);
  const clientId = str(body.clientId);
  const device = str(body.device);
  const command = str(body.command);
  if (!projectId || !clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  const validate = ALLOWED_COMMANDS[command];
  if (!validate) return jsonResponse({ error: "invalid_command" }, 400);
  const params = validate(isObj(body.params) ? body.params : {});
  if (!params) return jsonResponse({ error: "invalid_params" }, 400);
  const key = storeKey(projectId, clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 400);
  const prefix = `enterprises/${record.projectId}/devices/`;
  if (!device.startsWith(prefix)) return jsonResponse({ error: "invalid_device" }, 400);
  const deviceId = device.slice(prefix.length);
  if (!/^[A-Za-z0-9_-]+$/.test(deviceId)) return jsonResponse({ error: "invalid_device" }, 400);
  const token = await ensureAccessToken(key, record, signal);
  const apiPath = `/enterprises/${encodeURIComponent(record.projectId)}/devices/${encodeURIComponent(deviceId)}:executeCommand`;
  const res = await sdmApi(token, apiPath, "POST", signal, { command, params });
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status >= 400) {
    const detail = sdmErrorDetail(res.json, res.text);
    void logPluginApiFailure("google-home", "command", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ ok: true });
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  const action = str(body.action) || "devices";
  try {
    switch (action) {
      case "begin":
        return await handleBegin(body);
      case "status":
        return await handleStatus(body);
      case "disconnect":
        return await handleDisconnect(body);
      case "command":
        return await handleCommand(body, ac.signal);
      case "devices":
      case "state":
        return await handleDevices(body, ac.signal);
      default:
        return jsonResponse({ error: "invalid_action" }, 400);
    }
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("google-home", action, `blocked_url:${e.message}`);
      return jsonResponse({ error: "blocked_url", detail: e.message }, 400);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "reauth_required" || msg === "refresh_failed" || msg === "not_connected" || msg === "secret_unreadable") {
      void logPluginApiFailure("google-home", action, msg);
      return jsonResponse({ error: msg }, 401);
    }
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("google-home", action, aborted ? "timeout" : msg);
    return jsonResponse({ error: aborted ? "timeout" : "fetch_failed", detail: msg }, aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function htmlPage(title, message, ok) {
  const color = ok ? "#34a853" : "#ef4444";
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;max-width:420px;padding:32px">
<div style="font-size:48px;margin-bottom:16px">${ok ? "\u2705" : "\u26A0\uFE0F"}</div>
<h1 style="font-size:20px;margin:0 0 8px;color:${color}">${esc(title)}</h1>
<p style="font-size:14px;line-height:1.5;color:#b3b3b3;margin:0">${esc(message)}</p>
</div>
<script>setTimeout(function(){try{window.close()}catch(e){}},${ok ? 1500 : 4e3})</script>
</body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
async function handleCallback(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return htmlPage("Verbindung abgebrochen", `Google meldete: ${oauthError}. Du kannst das Fenster schlie\xDFen.`, false);
  }
  if (!code || !state || !state.includes(".")) {
    return htmlPage("Ung\xFCltige Antwort", "Es fehlen Parameter (code/state). Bitte erneut verbinden.", false);
  }
  const key = state.split(".", 1)[0] ?? "";
  const record = await readStore(key);
  if (!record || record.pendingState !== state || !record.redirectUri) {
    void logPluginApiFailure("google-home", "callback", "state_mismatch");
    return htmlPage("Sicherheitspr\xFCfung fehlgeschlagen", "Der State stimmt nicht \xFCberein. Bitte starte die Verbindung neu.", false);
  }
  const secret = openSealedSecret(record.clientSecret);
  if (!secret) return htmlPage("Fehler", "Client Secret konnte nicht gelesen werden.", false);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const { body } = await tokenRequest(
      {
        grant_type: "authorization_code",
        code,
        client_id: record.clientId,
        client_secret: secret,
        redirect_uri: record.redirectUri
      },
      ac.signal
    );
    if (!body.access_token || !body.refresh_token) {
      void logPluginApiFailure("google-home", "callback", body.error || "token_exchange_failed", {
        detail: body.error_description
      });
      return htmlPage(
        "Token-Austausch fehlgeschlagen",
        `${body.error_description || body.error || "Unbekannter Fehler"}. Redirect-URI / OAuth-Client in Google Cloud pr\xFCfen.`,
        false
      );
    }
    record.refreshToken = sealSecret(body.refresh_token);
    record.accessToken = sealSecret(body.access_token);
    record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1e3;
    record.pendingState = void 0;
    try {
      const list = await sdmApi(
        body.access_token,
        `/enterprises/${encodeURIComponent(record.projectId)}/devices`,
        "GET",
        ac.signal
      );
      if (isObj(list.json) && Array.isArray(list.json.devices)) record.deviceCount = list.json.devices.length;
    } catch {
    }
    await writeStore(key, record);
    const count = typeof record.deviceCount === "number" ? ` ${record.deviceCount} Ger\xE4t(e) gefunden.` : "";
    return htmlPage("Google Nest verbunden", `Erfolgreich verbunden.${count} Dieses Fenster schlie\xDFt sich automatisch.`, true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    void logPluginApiFailure("google-home", "callback", msg);
    return htmlPage("Verbindung fehlgeschlagen", "Google war nicht erreichbar. Bitte erneut versuchen.", false);
  } finally {
    clearTimeout(timer);
  }
}
function googleHomeServerHandler(ctx) {
  if (ctx.path[0] === "callback") return handleCallback(ctx.request);
  if (ctx.request.method !== "POST") {
    return Promise.resolve(jsonResponse({ error: "method_not_allowed" }, 405));
  }
  return handlePost(ctx.request);
}
export {
  googleHomeServerHandler as default,
  dynamic
};
