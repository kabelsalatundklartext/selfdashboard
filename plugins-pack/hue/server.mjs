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

// plugins-pack/hue/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 1e4;
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function briToPct(bri) {
  const n = typeof bri === "number" ? bri : Number(bri);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n / 254 * 100)));
}
function pctToBri(pct) {
  return Math.max(1, Math.min(254, Math.round(pct / 100 * 254)));
}
function normalizeBridge(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
function hueError(json) {
  if (Array.isArray(json) && json.length > 0 && isObject(json[0]) && isObject(json[0].error)) {
    const e = json[0].error;
    const type = Number(e.type);
    if (type === 1) return "auth_failed";
    if (type === 101) return "link_button";
    return str(e.description) || "hue_error";
  }
  return null;
}
async function hueFetch(url, init, signal) {
  const res = await fetchWithSsrfGuard(url, {
    method: init.method ?? "GET",
    headers: init.body ? { "Content-Type": "application/json" } : void 0,
    body: init.body,
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
  return { ok: res.ok, status: res.status, json };
}
function mapLights(obj) {
  if (!isObject(obj)) return [];
  const out = [];
  for (const [id, raw] of Object.entries(obj)) {
    if (!isObject(raw)) continue;
    const state = isObject(raw.state) ? raw.state : {};
    out.push({
      id,
      name: str(raw.name) || `Lampe ${id}`,
      on: state.on === true,
      brightness: briToPct(state.bri),
      reachable: state.reachable !== false,
      kind: str(raw.type) || void 0
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
function mapGroups(obj) {
  if (!isObject(obj)) return [];
  const out = [];
  for (const [id, raw] of Object.entries(obj)) {
    if (!isObject(raw)) continue;
    const lights = Array.isArray(raw.lights) ? raw.lights : [];
    const type = str(raw.type);
    if (lights.length === 0 && type !== "Room" && type !== "Zone") continue;
    const state = isObject(raw.state) ? raw.state : {};
    const action = isObject(raw.action) ? raw.action : {};
    out.push({
      id,
      name: str(raw.name) || `Gruppe ${id}`,
      on: state.any_on === true,
      brightness: briToPct(action.bri),
      reachable: true,
      kind: type || void 0
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBridge(String(body.url ?? ""));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "invalid_url" }, { status: 400 });
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (body.action === "pair") {
      const r = await hueFetch(
        `${base}/api`,
        { method: "POST", body: JSON.stringify({ devicetype: "selfdashboard#hue" }) },
        ac.signal
      );
      const err2 = hueError(r.json);
      if (err2 === "link_button") {
        return Response.json(
          { error: "link_button", detail: "Bridge-Knopf dr\xFCcken und innerhalb 30 s erneut koppeln." },
          { status: 409 }
        );
      }
      if (Array.isArray(r.json) && isObject(r.json[0]) && isObject(r.json[0].success)) {
        const username = str(r.json[0].success.username);
        if (username) return Response.json({ ok: true, apiKey: username });
      }
      return Response.json({ error: err2 || "pair_failed", detail: "Unerwartete Bridge-Antwort." }, { status: 502 });
    }
    const key = openSealedSecret(String(body.apiKey ?? ""));
    if (!key) return Response.json({ error: "missing_api_key" }, { status: 400 });
    if (body.action === "set") {
      const target = body.target === "light" ? "light" : "group";
      const id = str(body.id);
      if (!/^[0-9]+$/.test(id)) return Response.json({ error: "invalid_id" }, { status: 400 });
      const payload = {};
      if (typeof body.on === "boolean") payload.on = body.on;
      if (typeof body.bri === "number" && Number.isFinite(body.bri)) {
        payload.on = body.on !== false;
        payload.bri = pctToBri(body.bri <= 100 ? body.bri : briToPct(body.bri) ?? 100);
      }
      if (Object.keys(payload).length === 0) {
        return Response.json({ error: "nothing_to_set" }, { status: 400 });
      }
      const path = target === "group" ? `${base}/api/${key}/groups/${id}/action` : `${base}/api/${key}/lights/${id}/state`;
      const r = await hueFetch(path, { method: "PUT", body: JSON.stringify(payload) }, ac.signal);
      const err2 = hueError(r.json);
      if (err2) {
        const st = err2 === "auth_failed" ? 401 : 502;
        void logPluginApiFailure("hue", "set", err2);
        return Response.json({ error: err2 }, { status: st });
      }
      return Response.json({ ok: true });
    }
    const [groupsRes, lightsRes] = await Promise.all([
      hueFetch(`${base}/api/${key}/groups`, {}, ac.signal),
      hueFetch(`${base}/api/${key}/lights`, {}, ac.signal)
    ]);
    const err = hueError(groupsRes.json) || hueError(lightsRes.json);
    if (err) {
      const st = err === "auth_failed" ? 401 : 502;
      void logPluginApiFailure("hue", "state", err);
      return Response.json(
        { error: err, detail: err === "auth_failed" ? "API-Key ung\xFCltig \u2014 Bridge neu koppeln." : "" },
        { status: st }
      );
    }
    return Response.json({
      groups: mapGroups(groupsRes.json),
      lights: mapLights(lightsRes.json)
    });
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("hue", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("hue", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("hue", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
async function handleHuePluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function hueServerHandler(ctx) {
  return handleHuePluginRequest(ctx.request, ctx.path);
}
export {
  hueServerHandler as default,
  dynamic
};
