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

// plugins-pack/_shared/insecure-fetch.ts
import https from "node:https";
import nodeFetch from "node-fetch";

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

// plugins-pack/_shared/insecure-fetch.ts
async function fetchChecked(url, init = {}, opts = {}) {
  await assertSafeOutboundUrlResolved(url);
  const isHttps = url.toLowerCase().startsWith("https:");
  const agent = isHttps && opts.insecureTls === true ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const res = await nodeFetch(url, {
    redirect: "manual",
    ...init,
    ...agent ? { agent } : {}
  });
  return res;
}
async function fetchCheckedJson(url, init = {}, opts = {}) {
  const res = await fetchChecked(url, init, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text, res };
}

// plugins-pack/opnsense/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
function str(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function normalizeBase(raw) {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  u.username = "";
  u.password = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
function parseFirmwareStatus(json) {
  if (!isObject(json)) return { version: null, productName: null, updatesAvailable: false };
  const product = isObject(json.product) ? json.product : null;
  const version = str(json.product_version) ?? (product ? str(product.product_version) : null);
  const productName = str(json.product_name) ?? (product ? str(product.product_name) : null) ?? "OPNsense";
  const newPackages = Array.isArray(json.new_packages) ? json.new_packages : null;
  const upgradePackages = Array.isArray(json.upgrade_packages) ? json.upgrade_packages : null;
  const updatesAvailable = str(json.status) === "update" || json.upgrade_needs_reboot === "1" || json.upgrade_needs_reboot === 1 || json.upgrade_needs_reboot === true || newPackages != null && newPackages.length > 0 || upgradePackages != null && upgradePackages.length > 0;
  return { version, productName, updatesAvailable };
}
function parseGateways(json) {
  if (!isObject(json) || !Array.isArray(json.items)) return [];
  const out = [];
  for (const item of json.items) {
    if (!isObject(item)) continue;
    const name = str(item.name);
    if (!name) continue;
    const status = (str(item.status) ?? "").toLowerCase();
    out.push({
      name,
      up: status !== "down",
      delay: str(item.delay)
    });
  }
  return out;
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
    base = normalizeBase(String(body.url ?? ""));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "invalid_url" }, { status: 400 });
  }
  const apiKey = String(body.apiKey ?? "").trim();
  const apiSecret = openSealedSecret(String(body.apiSecret ?? "").trim());
  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: "missing_credentials", detail: "API-Key und API-Secret in den Einstellungen eintragen." },
      { status: 400 }
    );
  }
  const insecureTls = body.insecureTls !== false;
  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`
  };
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const fw = await fetchCheckedJson(
      `${base}/api/core/firmware/status`,
      { method: "GET", headers, signal: ac.signal },
      { insecureTls }
    );
    if (fw.status === 401 || fw.status === 403) {
      void logPluginApiFailure("opnsense", "auth", "auth_failed", { status: fw.status });
      return Response.json(
        { error: "auth_failed", detail: "API-Key/-Secret pr\xFCfen (System \u2192 Zugang \u2192 Benutzer \u2192 API-Schl\xFCssel)." },
        { status: fw.status }
      );
    }
    if (!fw.ok || !isObject(fw.json)) {
      void logPluginApiFailure("opnsense", "upstream", "firmware_status_failed", { status: fw.status });
      return Response.json(
        {
          error: "api_not_found",
          detail: `Firmware-Status nicht abrufbar (HTTP ${fw.status}). Basis-URL pr\xFCfen.`
        },
        { status: 502 }
      );
    }
    const { version, productName, updatesAvailable } = parseFirmwareStatus(fw.json);
    let gateways = [];
    try {
      const gw = await fetchCheckedJson(
        `${base}/api/routes/gateway/status`,
        { method: "GET", headers, signal: ac.signal },
        { insecureTls }
      );
      if (gw.ok) gateways = parseGateways(gw.json);
    } catch {
      gateways = [];
    }
    const payload = { version, productName, updatesAvailable, gateways };
    return Response.json(payload);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("opnsense", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("opnsense", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure("opnsense", "request", "tls_error", { message: msg });
      return Response.json({ error: "tls_error", detail: msg }, { status: 502 });
    }
    void logPluginApiFailure("opnsense", "request", "network_error", { message: msg });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
async function handleOpnsensePluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function opnsenseServerHandler(ctx) {
  return handleOpnsensePluginRequest(ctx.request, ctx.path);
}
export {
  opnsenseServerHandler as default,
  dynamic
};
