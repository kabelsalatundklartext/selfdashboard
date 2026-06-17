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

// plugins-pack/wireguard/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function num(v) {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function parseTs(v) {
  if (v == null) return null;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || v <= 0) return null;
    return v < 1e12 ? v * 1e3 : v;
  }
  const s = String(v).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms;
}
function normalizeBase(raw) {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(t) ? t : `http://${t}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  u.username = "";
  u.password = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
function extractClients(json) {
  if (Array.isArray(json)) return json;
  if (isObject(json)) {
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.clients)) return json.clients;
  }
  return null;
}
function normalizePeer(raw) {
  const c = isObject(raw) ? raw : {};
  const address = str(c.address) || str(c.ipv4Address) || str(c.ipv6Address) || null;
  return {
    id: str(c.id) || str(c.publicKey) || "",
    name: str(c.name) || "\u2014",
    enabled: c.enabled !== false,
    handshakeAt: parseTs(c.latestHandshakeAt ?? c.lastHandshakeAt ?? c.latestHandshake),
    rx: num(c.transferRx ?? c.transferRX),
    tx: num(c.transferTx ?? c.transferTX),
    endpoint: str(c.endpoint) || null,
    address
  };
}
function cookieFromSetCookie(res) {
  const raw = (res.headers.raw()["set-cookie"] ?? []).slice(0, 20);
  const pairs = [];
  for (const c of raw) {
    const pair = c.split(";", 1)[0]?.trim();
    if (pair && pair.includes("=")) pairs.push(pair);
  }
  return pairs.join("; ");
}
async function tryV15(base, username, password, opts) {
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const res = await fetchChecked(
    `${base}/api/client`,
    {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Basic ${auth}` },
      signal: opts.signal
    },
    { insecureTls: opts.insecureTls }
  );
  if (!res.ok) return { error: res.status };
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return { error: 502 };
  }
  const list = extractClients(json);
  if (!list) return { error: 502 };
  return { peers: list.map(normalizePeer) };
}
async function tryV14(base, password, opts) {
  const sessRes = await fetchChecked(
    `${base}/api/session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ password }),
      signal: opts.signal
    },
    { insecureTls: opts.insecureTls }
  );
  if (!sessRes.ok) return { error: sessRes.status };
  const cookie = cookieFromSetCookie(sessRes);
  if (!cookie) return { error: 401 };
  const listRes = await fetchChecked(
    `${base}/api/wireguard/client`,
    { method: "GET", headers: { Accept: "application/json", Cookie: cookie }, signal: opts.signal },
    { insecureTls: opts.insecureTls }
  );
  if (!listRes.ok) return { error: listRes.status };
  const text = await listRes.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return { error: 502 };
  }
  const list = extractClients(json);
  if (!list) return { error: 502 };
  return { peers: list.map(normalizePeer) };
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
  const username = str(body.username);
  if (username.includes(":")) {
    return Response.json(
      { error: "invalid_username", detail: "Benutzername darf keinen Doppelpunkt enthalten." },
      { status: 400 }
    );
  }
  const password = openSealedSecret(String(body.password ?? "").trim());
  if (!password) {
    return Response.json(
      {
        error: "missing_credentials",
        detail: "Passwort (wg-easy-Login) in den Widget-Einstellungen eintragen."
      },
      { status: 400 }
    );
  }
  const insecureTls = body.insecureTls === true;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  const opts = { insecureTls, signal: ac.signal };
  try {
    let v15Err = null;
    if (username) {
      const v15 = await tryV15(base, username, password, opts);
      if ("peers" in v15) {
        return Response.json({ peers: v15.peers, now: Date.now(), api: "v15" });
      }
      v15Err = v15.error;
    }
    const v14 = await tryV14(base, password, opts);
    if ("peers" in v14) {
      return Response.json({ peers: v14.peers, now: Date.now(), api: "v14" });
    }
    const status = v15Err ?? v14.error;
    if (status === 401 || status === 403) {
      void logPluginApiFailure("wireguard", "auth", "auth_failed", { v15: v15Err, v14: v14.error });
      return Response.json(
        {
          error: "auth_failed",
          detail: username ? "Login abgelehnt \u2014 Benutzer/Passwort pr\xFCfen. Bei v15 muss 2FA f\xFCr den API-Zugriff aus sein." : "Login abgelehnt \u2014 Passwort pr\xFCfen. F\xFCr wg-easy v15 zus\xE4tzlich den Benutzernamen eintragen."
        },
        { status: 401 }
      );
    }
    void logPluginApiFailure("wireguard", "upstream", "bad_response", { v15: v15Err, v14: v14.error });
    const hint = username ? "" : " Falls wg-easy v15: zus\xE4tzlich den Benutzernamen eintragen.";
    return Response.json(
      {
        error: "upstream_error",
        detail: `wg-easy antwortet nicht wie erwartet (v15 HTTP ${v15Err ?? "\u2014"}, v14 HTTP ${v14.error}). URL/Port (Standard 51821) pr\xFCfen.${hint}`
      },
      { status: 502 }
    );
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("wireguard", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("wireguard", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("wireguard", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json(
      { error: "network_error", detail: "wg-easy nicht erreichbar \u2014 URL/Port pr\xFCfen (Standard 51821)." },
      { status: 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
async function handleWireguardPluginRequest(req) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function wireguardServerHandler(ctx) {
  return handleWireguardPluginRequest(ctx.request);
}
export {
  wireguardServerHandler as default,
  dynamic
};
