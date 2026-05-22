// node_modules/server-only/index.js
throw new Error(
  "This module cannot be imported from a Client Component module. It should only be used from a Server Component."
);

// src/lib/errorLog.ts
import { appendFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import { join as join2 } from "path";

// src/lib/dataDir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// src/lib/errorLogTypes.ts
var DEFAULT_LOG_SETTINGS = { retentionDays: 7 };
function isLogRetentionDays(n) {
  return n === 3 || n === 7 || n === 30;
}

// src/lib/errorLog.ts
var MAX_FILE_BYTES = 3e6;
var MAX_FIELD = 4e3;
var MAX_MESSAGE = 2e3;
var logFilePath = () => join2(dataDir(), "error-log.jsonl");
var settingsPath = () => join2(dataDir(), "log-settings.json");
function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function clampField(s, max) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\u2026`;
}
function sanitizeLogText(raw) {
  let s = raw;
  s = s.replace(/("password"\s*:\s*)"[^"]*"/gi, '$1"[redacted]"');
  s = s.replace(/(password=)[^&\s]+/gi, "$1[redacted]");
  s = s.replace(/(Authorization:\s*Basic\s+)[A-Za-z0-9+/=]+/gi, "$1[redacted]");
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]");
  return s;
}
async function readLogSettings() {
  try {
    const raw = await readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (isLogRetentionDays(parsed.retentionDays)) {
      return { retentionDays: parsed.retentionDays };
    }
  } catch {
  }
  return { ...DEFAULT_LOG_SETTINGS };
}
function retentionCutoff(days) {
  return Date.now() - days * 24 * 60 * 60 * 1e3;
}
function parseLine(line) {
  const t = line.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t);
    if (typeof o.id !== "string" || typeof o.ts !== "string" || typeof o.message !== "string") return null;
    return o;
  } catch {
    return null;
  }
}
async function readAllEntries() {
  try {
    const raw = await readFile(logFilePath(), "utf8");
    const lines = raw.split("\n");
    const out = [];
    for (const line of lines) {
      const e = parseLine(line);
      if (e) out.push(e);
    }
    return out;
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
    if (code === "ENOENT") return [];
    throw e;
  }
}
async function writeAllEntries(entries) {
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  const file = logFilePath();
  const body = entries.length ? `${entries.map((e) => JSON.stringify(e)).join("\n")}
` : "";
  const tmp = `${file}.tmp`;
  try {
    await writeFile(tmp, body, "utf8");
    await rename(tmp, file);
  } catch {
    await writeFile(file, body, "utf8");
  }
}
async function purgeExpiredLogs(retentionDays) {
  const days = retentionDays ?? (await readLogSettings()).retentionDays;
  const cutoff = retentionCutoff(days);
  const all = await readAllEntries();
  const kept = all.filter((e) => {
    const t = Date.parse(e.ts);
    return Number.isFinite(t) && t >= cutoff;
  });
  if (kept.length === all.length) return 0;
  await writeAllEntries(kept);
  return all.length - kept.length;
}
async function trimOversizedFile() {
  try {
    const raw = await readFile(logFilePath(), "utf8");
    if (Buffer.byteLength(raw, "utf8") <= MAX_FILE_BYTES) return;
    const entries = await readAllEntries();
    const drop = Math.max(1, Math.floor(entries.length * 0.25));
    await writeAllEntries(entries.slice(drop));
  } catch {
  }
}
async function appendErrorLog(input) {
  const settings = await readLogSettings();
  await purgeExpiredLogs(settings.retentionDays);
  const entry = {
    id: newId(),
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    level: input.level,
    source: input.source,
    category: input.category ? clampField(input.category, 120) : void 0,
    message: clampField(sanitizeLogText(input.message), MAX_MESSAGE),
    detail: input.detail ? clampField(sanitizeLogText(input.detail), MAX_FIELD) : void 0,
    pluginId: input.pluginId ? clampField(input.pluginId, 80) : void 0,
    instanceId: input.instanceId ? clampField(input.instanceId, 120) : void 0
  };
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  await appendFile(logFilePath(), `${JSON.stringify(entry)}
`, "utf8");
  await trimOversizedFile();
  return entry;
}

// src/lib/pluginLogServer.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  try {
    await appendErrorLog({
      level: "error",
      source: "api",
      pluginId,
      category: `${pluginId}/${operation}`,
      message,
      detail: detail ? JSON.stringify(detail).slice(0, 4e3) : void 0
    });
  } catch {
  }
}

// plugins/pihole/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
var sessionCache = /* @__PURE__ */ new Map();
function parseBase(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  return new URL(withProto);
}
function finalizeBaseUrl(u) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  u.username = "";
  u.password = "";
  u.hash = "";
  let path = u.pathname.replace(/\/+$/, "") || "";
  if (path.endsWith("/admin")) {
    path = path.slice(0, -"/admin".length) || "/";
    u.pathname = path;
  }
  let out = u.toString();
  if (out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
function normalizeBase(raw) {
  return finalizeBaseUrl(parseBase(raw));
}
function apiEndpoint(base, apiPath) {
  const path = apiPath.replace(/^\//, "");
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return new URL(path, prefix).toString();
}
function cacheKey(base, password, totp) {
  return `${base}\0${password}\0${totp}`;
}
function isObject(j) {
  return j != null && typeof j === "object" && !Array.isArray(j);
}
function piHoleErrorDetail(j, fallback) {
  if (isObject(j) && isObject(j.error) && typeof j.error.message === "string") {
    return j.error.message;
  }
  return fallback;
}
async function fetchJson(url, method, headers, body, signal) {
  const h = { ...headers, Accept: "application/json" };
  if (body != null) h["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : void 0,
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
  return { ok: res.ok, status: res.status, json, text };
}
function authHeaders(session) {
  if (!session) return {};
  return { "X-FTL-SID": session.sid, "X-FTL-CSRF": session.csrf };
}
async function login(base, password, totp, signal) {
  const payload = { password };
  if (totp !== "") {
    const n = Number(totp);
    if (Number.isFinite(n)) payload.totp = Math.trunc(n);
  }
  const url = apiEndpoint(base, "api/auth");
  const r = await fetchJson(url, "POST", {}, payload, signal);
  if (!r.ok) {
    const detail = piHoleErrorDetail(r.json, r.text.slice(0, 240));
    const err = new Error("auth_failed");
    err.status = r.status;
    err.detail = detail;
    throw err;
  }
  if (!isObject(r.json) || !isObject(r.json.session)) {
    const err = new Error("auth_invalid");
    err.status = 502;
    err.detail = "missing session in auth response";
    throw err;
  }
  const sess = r.json.session;
  const sid = typeof sess.sid === "string" ? sess.sid : "";
  const csrf = typeof sess.csrf === "string" ? sess.csrf : "";
  if (!sid) {
    const err = new Error("auth_invalid");
    err.status = 502;
    err.detail = "empty session id";
    throw err;
  }
  const validity = typeof sess.validity === "number" && sess.validity > 0 ? sess.validity : 300;
  return { sid, csrf, expiresAt: Date.now() + validity * 1e3 - 5e3 };
}
async function getSession(base, password, totp, signal, force = false) {
  if (!password) return null;
  const key = cacheKey(base, password, totp);
  if (!force) {
    const cached = sessionCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached;
  }
  const session = await login(base, password, totp, signal);
  sessionCache.set(key, session);
  return session;
}
async function apiRequest(base, password, totp, apiPath, method, body, signal) {
  const url = apiEndpoint(base, apiPath);
  let session = await getSession(base, password, totp, signal);
  let r = await fetchJson(url, method, authHeaders(session), body, signal);
  if (r.status === 401 && password) {
    session = await getSession(base, password, totp, signal, true);
    r = await fetchJson(url, method, authHeaders(session), body, signal);
  }
  return r;
}
async function handlePiholePluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePiholePost(req);
}
async function handlePiholePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBase(String(body.url ?? ""));
  } catch {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }
  const password = String(body.password ?? "");
  const totp = body.totp != null && body.totp !== "" ? String(body.totp).trim() : "";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (body.action === "blocking") {
      if (typeof body.blocking !== "boolean") {
        return Response.json({ error: "missing_blocking" }, { status: 400 });
      }
      const br = await apiRequest(
        base,
        password,
        totp,
        "api/dns/blocking",
        "POST",
        { blocking: body.blocking },
        ac.signal
      );
      if (!br.ok) {
        const detail = piHoleErrorDetail(br.json, br.text.slice(0, 240));
        return Response.json(
          { error: "blocking_failed", status: br.status, detail: detail || br.text.slice(0, 240) },
          { status: br.status === 401 || br.status === 403 ? br.status : 502 }
        );
      }
      const blocking2 = isObject(br.json) && typeof br.json.blocking === "boolean" ? br.json.blocking : body.blocking;
      return Response.json({ ok: true, blocking: blocking2 });
    }
    const summaryRes = await apiRequest(base, password, totp, "api/stats/summary", "GET", null, ac.signal);
    if (!summaryRes.ok) {
      const detail = piHoleErrorDetail(summaryRes.json, summaryRes.text.slice(0, 240));
      const st = summaryRes.status === 401 || summaryRes.status === 403 ? summaryRes.status : 502;
      void logPluginApiFailure("pihole", "summary", detail || "summary_failed", {
        status: summaryRes.status
      });
      return Response.json(
        { error: "summary_failed", status: summaryRes.status, detail: detail || summaryRes.text.slice(0, 240) },
        { status: st }
      );
    }
    const blockingRes = await apiRequest(base, password, totp, "api/dns/blocking", "GET", null, ac.signal);
    let blocking = null;
    if (blockingRes.ok && isObject(blockingRes.json) && typeof blockingRes.json.blocking === "boolean") {
      blocking = blockingRes.json.blocking;
    }
    return Response.json({
      summary: isObject(summaryRes.json) ? summaryRes.json : null,
      blocking,
      blockingHttp: blockingRes.status
    });
  } catch (e) {
    const err = e;
    if (err.message === "auth_failed" || err.message === "auth_invalid") {
      void logPluginApiFailure("pihole", "auth", err.message, {
        status: err.status,
        detail: err.detail
      });
      return Response.json(
        { error: err.message, status: err.status ?? 401, detail: err.detail ?? "" },
        { status: err.status === 401 || err.status === 403 ? err.status : 502 }
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("pihole", "request", aborted ? "timeout" : msg);
    return Response.json(
      { error: aborted ? "timeout" : "fetch_failed", detail: msg },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
function piholeServerHandler(ctx) {
  return handlePiholePluginRequest(ctx.request, ctx.path);
}
var server_default = piholeServerHandler;
export {
  server_default as default,
  dynamic,
  handlePiholePluginRequest,
  piholeServerHandler
};
