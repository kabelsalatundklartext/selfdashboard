// plugins-pack/reolink/server.ts
import http from "node:http";
import https from "node:https";
import { createHmac } from "node:crypto";

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
var LEGACY_SALT = "selfdashboard.calendar.v1";
var cachedPrimaryKey = null;
var cachedLegacyKey = null;
function keyMaterial() {
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim();
  if (envKey) return envKey;
  const keyFile = join2(dataDir(), ".calendar-key");
  if (existsSync(keyFile)) return readFileSync(keyFile, "utf8").trim();
  const fresh = randomBytes(32).toString("base64");
  try {
    writeFileSync(keyFile, fresh, { flag: "wx" });
    try {
      chmodSync(keyFile, 384);
    } catch {
    }
    return fresh;
  } catch {
    if (existsSync(keyFile)) return readFileSync(keyFile, "utf8").trim();
    return fresh;
  }
}
function installSalt() {
  const saltFile = join2(dataDir(), ".secret-salt");
  try {
    if (existsSync(saltFile)) {
      const v = readFileSync(saltFile, "utf8").trim();
      if (v) return v;
    }
    const fresh = randomBytes(16).toString("hex");
    try {
      writeFileSync(saltFile, fresh, { flag: "wx" });
      try {
        chmodSync(saltFile, 384);
      } catch {
      }
      return fresh;
    } catch {
      const v = existsSync(saltFile) ? readFileSync(saltFile, "utf8").trim() : "";
      return v || LEGACY_SALT;
    }
  } catch {
    return LEGACY_SALT;
  }
}
function primaryKey() {
  if (!cachedPrimaryKey) cachedPrimaryKey = scryptSync(keyMaterial(), installSalt(), KEY_LEN);
  return cachedPrimaryKey;
}
function legacyKey() {
  if (!cachedLegacyKey) cachedLegacyKey = scryptSync(keyMaterial(), LEGACY_SALT, KEY_LEN);
  return cachedLegacyKey;
}
function decryptGcm(key, iv, enc, tag) {
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
var TAG_LEN = 16;
var SEALED_SECRET_PREFIX = "sdsec1:";
function isSealedSecret(value) {
  return typeof value === "string" && value.startsWith(SEALED_SECRET_PREFIX);
}
function sealSecret(plaintext) {
  if (!plaintext) return "";
  const key = primaryKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}
function openSealedSecret(value) {
  if (!isSealedSecret(value)) return value;
  const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) return "";
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  try {
    return decryptGcm(primaryKey(), iv, enc, tag);
  } catch {
    try {
      return decryptGcm(legacyKey(), iv, enc, tag);
    } catch {
      return "";
    }
  }
}

// plugins-pack/reolink/server.ts
var dynamic = "force-dynamic";
var TIMEOUT_MS = 1e4;
var MAX_BODY = 8 * 1024 * 1024;
var TOKEN_MARGIN_MS = 6e4;
var DEFAULT_LEASE_S = 3600;
var SNAP_TOKEN_TTL_MS = 10 * 60 * 1e3;
var MAX_TOKEN_CACHE = 16;
var PTZ_OPS = /* @__PURE__ */ new Set([
  "Left",
  "Right",
  "Up",
  "Down",
  "LeftUp",
  "LeftDown",
  "RightUp",
  "RightDown",
  "ZoomInc",
  "ZoomDec",
  "FocusInc",
  "FocusDec",
  "Stop",
  "ToPos",
  "Auto"
]);
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function num(v) {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}
function isPrivateHost(h) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h.trim());
  if (!m) return false;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return false;
  if (o[0] === 10) return true;
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
  if (o[0] === 192 && o[1] === 168) return true;
  return false;
}
function parsePort(raw, secure) {
  const n = num(raw);
  if (n >= 1 && n <= 65535) return Math.floor(n);
  return secure ? 443 : 80;
}
function rawRequest(t, opts) {
  return new Promise((resolve, reject) => {
    const mod = t.secure ? https : http;
    const headers = { Accept: opts.accept };
    if (opts.body != null) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(opts.body));
    }
    const reqOpts = {
      host: t.host,
      port: t.port,
      path: opts.path,
      method: opts.method,
      headers,
      timeout: TIMEOUT_MS
    };
    if (t.secure) reqOpts.rejectUnauthorized = !t.insecure;
    const req = mod.request(reqOpts, (res) => {
      const chunks = [];
      let total = 0;
      res.on("data", (c) => {
        total += c.length;
        if (total > MAX_BODY + 1024) {
          req.destroy(new Error("response_too_large"));
          return;
        }
        chunks.push(c);
      });
      res.on(
        "end",
        () => resolve({
          status: res.statusCode || 0,
          body: Buffer.concat(chunks),
          contentType: String(res.headers["content-type"] || "")
        })
      );
    });
    req.on("error", (e) => reject(e instanceof Error ? e : new Error("request_error")));
    req.on("timeout", () => req.destroy(new Error("timeout")));
    if (opts.body != null) req.write(opts.body);
    req.end();
  });
}
var tokenCache = /* @__PURE__ */ new Map();
function cacheKey(t, user, pass) {
  const pw = createHmac("sha256", "reolink-token-cache").update(pass).digest("hex").slice(0, 16);
  return `${t.secure ? "s" : ""}${t.host}:${t.port}|${user}|${pw}`;
}
var ReolinkError = class extends Error {
  constructor(detail, rspCode, status = 502) {
    super(detail);
    this.detail = detail;
    this.rspCode = rspCode;
    this.status = status;
    this.name = "ReolinkError";
  }
};
function firstResult(buf) {
  let parsed;
  try {
    parsed = JSON.parse(buf.toString("utf8"));
  } catch {
    return null;
  }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return isObject(first) ? first : null;
}
function sanitizeDetail(s) {
  return s.replace(/token[=:\s"]+[^\s",}]+/gi, "token=[redacted]").slice(0, 256);
}
function errorDetail(result) {
  if (result && isObject(result.error)) {
    const d = result.error.detail;
    if (typeof d === "string") return sanitizeDetail(d);
  }
  return "";
}
function rspCodeOf(result) {
  if (result && isObject(result.error)) return num(result.error.rspCode);
  return 0;
}
async function login(t, user, pass) {
  const body = JSON.stringify([
    { cmd: "Login", action: 0, param: { User: { Version: "0", userName: user, password: pass } } }
  ]);
  const res = await rawRequest(t, {
    method: "POST",
    path: "/cgi-bin/api.cgi?cmd=Login",
    body,
    accept: "application/json"
  });
  const result = firstResult(res.body);
  const value = result && isObject(result.value) ? result.value : null;
  const tokenObj = value && isObject(value.Token) ? value.Token : null;
  const name = tokenObj && typeof tokenObj.name === "string" ? tokenObj.name : "";
  if (num(result?.code) !== 0 || !name) {
    const detail = errorDetail(result);
    const rsp = rspCodeOf(result);
    const auth = rsp === -6 || /password|user|login/i.test(detail);
    throw new ReolinkError(detail || `Login fehlgeschlagen (HTTP ${res.status}).`, rsp, auth ? 401 : 502);
  }
  const leaseS = num(tokenObj?.leaseTime) || DEFAULT_LEASE_S;
  return { token: name, expires: Date.now() + leaseS * 1e3 - TOKEN_MARGIN_MS };
}
async function getToken(t, user, pass, forceNew) {
  const key = cacheKey(t, user, pass);
  const cached = tokenCache.get(key);
  if (!forceNew && cached && cached.expires > Date.now()) return cached.token;
  const fresh = await login(t, user, pass);
  if (tokenCache.size >= MAX_TOKEN_CACHE) {
    const oldest = tokenCache.keys().next().value;
    if (oldest) tokenCache.delete(oldest);
  }
  tokenCache.set(key, fresh);
  return fresh.token;
}
function invalidateToken(t, user, pass) {
  tokenCache.delete(cacheKey(t, user, pass));
}
async function apiCommand(t, user, pass, cmd, param) {
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(t, user, pass, attempt === 1);
    const body = JSON.stringify([{ cmd, action: 0, param }]);
    const res = await rawRequest(t, {
      method: "POST",
      path: `/cgi-bin/api.cgi?cmd=${encodeURIComponent(cmd)}&token=${encodeURIComponent(token)}`,
      body,
      accept: "application/json"
    });
    const result = firstResult(res.body);
    if (num(result?.code) === 0) return result?.value;
    const detail = errorDetail(result);
    const rsp = rspCodeOf(result);
    lastErr = new ReolinkError(detail || `${cmd} fehlgeschlagen (HTTP ${res.status}).`, rsp);
    if (attempt === 0 && (rsp === -6 || /login|token/i.test(detail))) {
      invalidateToken(t, user, pass);
      continue;
    }
    break;
  }
  throw lastErr ?? new ReolinkError(`${cmd} fehlgeschlagen.`, 0);
}
async function snapshot(t, user, pass, channel) {
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(t, user, pass, attempt === 1);
    const rs = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    const path = `/cgi-bin/api.cgi?cmd=Snap&channel=${channel}&rs=${rs}&token=${encodeURIComponent(token)}`;
    const res = await rawRequest(t, { method: "GET", path, accept: "image/jpeg" });
    const b = res.body;
    const isJpeg = b.length > 3 && b[0] === 255 && b[1] === 216;
    if (res.contentType.includes("image") || isJpeg) return b;
    const result = firstResult(b);
    const detail = errorDetail(result);
    lastErr = new ReolinkError(detail || `Snapshot fehlgeschlagen (HTTP ${res.status}).`, rspCodeOf(result));
    if (attempt === 0) {
      invalidateToken(t, user, pass);
      continue;
    }
    break;
  }
  throw lastErr ?? new ReolinkError("Snapshot fehlgeschlagen.", 0);
}
function aiFlags(v) {
  const out = { people: false, vehicle: false, animal: false, supported: [] };
  if (!isObject(v)) return out;
  const map = [
    ["people", "people"],
    ["vehicle", "vehicle"],
    ["dog_cat", "animal"],
    ["animal", "animal"]
  ];
  for (const [key, slot] of map) {
    const o = v[key];
    if (!isObject(o)) continue;
    if (num(o.support) === 1 && !out.supported.includes(slot)) out.supported.push(slot);
    if (num(o.alarm_state) === 1) out[slot] = true;
  }
  return out;
}
function channelList(v) {
  if (!isObject(v) || !Array.isArray(v.status)) return [];
  return v.status.filter(isObject).map((s) => ({
    channel: num(s.channel),
    name: typeof s.name === "string" && s.name ? s.name : `CH${num(s.channel)}`,
    online: num(s.online) === 1
  }));
}
function buildTransport(host, port, secure, insecure) {
  return { host, port: parsePort(port, secure), secure, insecure };
}
function mapError(e, op) {
  if (e instanceof ReolinkError) {
    void logPluginApiFailure("reolink", op, "reolink_error", { rspCode: e.rspCode, detail: e.detail });
    return Response.json(
      { error: e.status === 401 ? "auth_failed" : "upstream_error", detail: e.detail },
      { status: e.status }
    );
  }
  const msg = e instanceof Error ? e.message : String(e);
  const timeout = msg === "timeout";
  void logPluginApiFailure("reolink", op, timeout ? "timeout" : "network_error", { message: msg });
  return Response.json(
    {
      error: timeout ? "timeout" : "network_error",
      detail: timeout ? "Kamera antwortet nicht \u2014 IP/Port erreichbar?" : "Kamera nicht erreichbar \u2014 IP/Port/HTTPS-Einstellung pr\xFCfen."
    },
    { status: timeout ? 504 : 502 }
  );
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const host = String(body.host ?? "").trim();
  if (!isPrivateHost(host)) {
    return Response.json({ error: "invalid_host", detail: "Nur private LAN-IPv4 erlaubt." }, { status: 400 });
  }
  const user = String(body.username ?? "").trim();
  const pass = openSealedSecret(String(body.password ?? "").trim());
  if (!user || !pass) {
    return Response.json(
      { error: "missing_credentials", detail: "Benutzer und Passwort in den Widget-Einstellungen eintragen." },
      { status: 400 }
    );
  }
  const t = buildTransport(host, body.port, body.secure === true, body.insecure !== false);
  const channel = Math.max(0, Math.min(63, num(body.channel)));
  const action = String(body.action ?? "status");
  try {
    if (action === "snap-token") {
      const payload = {
        h: host,
        u: user,
        p: pass,
        c: channel,
        s: t.secure,
        i: t.insecure,
        pt: t.port,
        exp: Date.now() + SNAP_TOKEN_TTL_MS
      };
      return Response.json({ token: sealSecret(JSON.stringify(payload)), ttlMs: SNAP_TOKEN_TTL_MS });
    }
    if (action === "status") {
      let model = "";
      let name = "";
      let channelNum = 1;
      try {
        const dev = await apiCommand(t, user, pass, "GetDevInfo", {});
        const info = isObject(dev) && isObject(dev.DevInfo) ? dev.DevInfo : isObject(dev) ? dev : null;
        if (info) {
          model = typeof info.model === "string" ? info.model : "";
          name = typeof info.name === "string" ? info.name : "";
          channelNum = Math.max(1, num(info.channelNum) || 1);
        }
      } catch {
      }
      let channels = [];
      if (channelNum > 1) {
        try {
          channels = channelList(await apiCommand(t, user, pass, "GetChannelstatus", {}));
        } catch {
        }
      }
      const ai = aiFlags(await apiCommand(t, user, pass, "GetAiState", { channel }).catch(() => null));
      let motion = false;
      try {
        const md = await apiCommand(t, user, pass, "GetMdState", { channel });
        motion = isObject(md) && num(md.state) === 1;
      } catch {
      }
      return Response.json({ ok: true, model, name, channelNum, channels, ai, motion });
    }
    if (action === "ptz") {
      const op = String(body.op ?? "");
      if (!PTZ_OPS.has(op)) return Response.json({ error: "invalid_op" }, { status: 400 });
      const speed = Math.max(1, Math.min(64, num(body.speed) || 32));
      const param = { channel, op, speed };
      if (op === "ToPos") param.id = Math.max(0, num(body.presetId));
      await apiCommand(t, user, pass, "PtzCtrl", param);
      return Response.json({ ok: true });
    }
    if (action === "presets") {
      const v = await apiCommand(t, user, pass, "GetPtzPreset", { channel });
      const raw = isObject(v) && Array.isArray(v.PtzPreset) ? v.PtzPreset : [];
      const presets = raw.filter(isObject).filter((p) => num(p.enable) === 1).map((p) => ({ id: num(p.id), name: typeof p.name === "string" && p.name ? p.name : `Preset ${num(p.id)}` }));
      return Response.json({ ok: true, presets });
    }
    return Response.json({ error: "invalid_action" }, { status: 400 });
  } catch (e) {
    return mapError(e, action);
  }
}
async function handleGet(req) {
  const sp = new URL(req.url).searchParams;
  if (sp.get("action") !== "snapshot") {
    return Response.json({ error: "invalid_action" }, { status: 400 });
  }
  const raw = openSealedSecret(sp.get("tok") || "");
  let tok = null;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (isObject(parsed)) tok = parsed;
  } catch {
    tok = null;
  }
  if (!tok || typeof tok.exp !== "number" || tok.exp < Date.now()) {
    return Response.json({ error: "token_expired" }, { status: 401 });
  }
  const host = String(tok.h || "").trim();
  if (!isPrivateHost(host)) return Response.json({ error: "invalid_host" }, { status: 400 });
  const user = String(tok.u || "").trim();
  const pass = String(tok.p || "");
  if (!user || !pass) return Response.json({ error: "missing_credentials" }, { status: 400 });
  const t = buildTransport(host, tok.pt, tok.s === true, tok.i !== false);
  const channel = Math.max(0, Math.min(63, num(tok.c)));
  try {
    const jpeg = await snapshot(t, user, pass, channel);
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, max-age=0",
        // Token steckt im Query → nie als Referer weitergeben.
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (e) {
    return mapError(e, "snapshot");
  }
}
async function handleReolinkRequest(req) {
  if (req.method === "GET") return handleGet(req);
  if (req.method === "POST") return handlePost(req);
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}
function reolinkServerHandler(ctx) {
  return handleReolinkRequest(ctx.request);
}
export {
  reolinkServerHandler as default,
  dynamic
};
