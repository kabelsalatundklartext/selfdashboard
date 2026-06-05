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

// plugins-pack/pihole/server.ts
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
  const res = await fetchWithSsrfGuard(url, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : null,
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
  const password = openSealedSecret(String(body.password ?? ""));
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
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("pihole", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
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
export {
  piholeServerHandler as default
};
