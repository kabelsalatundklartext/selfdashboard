// plugins-pack/fritz-smarthome/server.ts
import crypto from "crypto";

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

// plugins-pack/fritz-smarthome/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 15e3;
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function normalizeBase(raw) {
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
function pick(xml, re) {
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}
function numOr(v, d = null) {
  if (v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function calcResponse(challenge, password) {
  if (challenge.startsWith("2$")) {
    const p = challenge.split("$");
    const iter1 = parseInt(p[1], 10);
    const salt1 = Buffer.from(p[2], "hex");
    const iter2 = parseInt(p[3], 10);
    const salt2Hex = p[4];
    const salt2 = Buffer.from(salt2Hex, "hex");
    const hash1 = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), salt1, iter1, 32, "sha256");
    const hash2 = crypto.pbkdf2Sync(hash1, salt2, iter2, 32, "sha256");
    return `${salt2Hex}$${hash2.toString("hex")}`;
  }
  const md5 = crypto.createHash("md5").update(Buffer.from(`${challenge}-${password}`, "utf16le")).digest("hex");
  return `${challenge}-${md5}`;
}
async function getText(url, signal) {
  const res = await fetchWithSsrfGuard(url, { method: "GET", cache: "no-store", signal });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}
async function login(base, username, password, signal) {
  const r1 = await getText(`${base}/login_sid.lua?version=2`, signal);
  const challenge = pick(r1.text, /<Challenge>(.*?)<\/Challenge>/);
  const sid0 = pick(r1.text, /<SID>(.*?)<\/SID>/);
  if (!challenge) return null;
  if (sid0 && sid0 !== "0000000000000000") return sid0;
  const response = calcResponse(challenge, password);
  const url2 = `${base}/login_sid.lua?version=2&username=${encodeURIComponent(username)}&response=${encodeURIComponent(response)}`;
  const r2 = await getText(url2, signal);
  const sid = pick(r2.text, /<SID>(.*?)<\/SID>/);
  if (!sid || sid === "0000000000000000") return null;
  return sid;
}
async function logout(base, sid, signal) {
  try {
    await getText(`${base}/login_sid.lua?version=2&logout=1&sid=${sid}`, signal);
  } catch {
  }
}
function aha(base, sid, cmd, extra = "") {
  return `${base}/webservices/homeautoswitch.lua?switchcmd=${cmd}&sid=${sid}${extra}`;
}
function parseDevices(xml) {
  const out = [];
  const re = /<device\s+([^>]*?)>([\s\S]*?)<\/device>/g;
  let m;
  while (m = re.exec(xml)) {
    const attrs = m[1];
    const body = m[2];
    const ain = pick(attrs, /identifier="([^"]*)"/);
    if (!ain) continue;
    const name = pick(body, /<name>([\s\S]*?)<\/name>/) || ain;
    const present = pick(body, /<present>(.*?)<\/present>/) === "1";
    const hasHkr = /<hkr>/.test(body);
    const hasSwitch = /<switch>/.test(body);
    const hasAlert = /<alert>/.test(body);
    const hasTemp = /<temperature>/.test(body);
    const hasHum = /<humidity>/.test(body);
    const dev = { ain, name, kind: "other", present };
    if (hasTemp) {
      const c = numOr(pick(body, /<temperature>[\s\S]*?<celsius>(.*?)<\/celsius>/));
      dev.temperature = c != null ? Math.round(c) / 10 : null;
    }
    if (hasHum) {
      dev.humidity = numOr(pick(body, /<humidity>[\s\S]*?<rel_humidity>(.*?)<\/rel_humidity>/));
    }
    if (hasHkr) {
      dev.kind = "thermostat";
      const tist = numOr(pick(body, /<hkr>[\s\S]*?<tist>(.*?)<\/tist>/));
      const tsoll = numOr(pick(body, /<hkr>[\s\S]*?<tsoll>(.*?)<\/tsoll>/));
      dev.tist = tist != null ? tist / 2 : dev.temperature ?? null;
      dev.tsoll = tsoll != null ? tsoll : null;
      dev.windowOpen = pick(body, /<windowopenactiv>(.*?)<\/windowopenactiv>/) === "1";
      dev.batteryLow = pick(body, /<batterylow>(.*?)<\/batterylow>/) === "1";
      dev.battery = numOr(pick(body, /<battery>(.*?)<\/battery>/));
    } else if (hasSwitch) {
      dev.kind = "switch";
      dev.on = pick(body, /<switch>[\s\S]*?<state>(.*?)<\/state>/) === "1";
      const p = numOr(pick(body, /<powermeter>[\s\S]*?<power>(.*?)<\/power>/));
      dev.power = p != null ? Math.round(p) / 1e3 : null;
      dev.energy = numOr(pick(body, /<powermeter>[\s\S]*?<energy>(.*?)<\/energy>/));
    } else if (hasAlert) {
      dev.kind = "contact";
      dev.open = pick(body, /<alert>[\s\S]*?<state>(.*?)<\/state>/) === "1";
    } else if (hasTemp || hasHum) {
      dev.kind = "sensor";
    }
    out.push(dev);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
function tempToParam(tempC) {
  return Math.max(16, Math.min(56, Math.round(tempC * 2)));
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
  const password = openSealedSecret(str(body.password));
  if (!password) {
    return Response.json({ error: "missing_credentials", detail: "FRITZ!Box-Passwort eintragen." }, { status: 400 });
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let sid = null;
  try {
    sid = await login(base, username, password, ac.signal);
    if (!sid) {
      void logPluginApiFailure("fritz-smarthome", "auth", "auth_failed");
      return Response.json(
        { error: "auth_failed", detail: "Login abgelehnt \u2014 Benutzer/Passwort pr\xFCfen (FRITZ!Box-Benutzer mit Smart-Home-Recht)." },
        { status: 401 }
      );
    }
    if (body.action === "set") {
      const ain = str(body.ain);
      if (!ain) return Response.json({ error: "invalid_target" }, { status: 400 });
      const a = encodeURIComponent(ain);
      let url;
      if (body.kind === "thermostat") {
        const param = tempToParam(Number(body.tempC));
        url = aha(base, sid, "sethkrtsoll", `&ain=${a}&param=${param}`);
      } else {
        url = aha(base, sid, body.on ? "setswitchon" : "setswitchoff", `&ain=${a}`);
      }
      const r2 = await getText(url, ac.signal);
      if (!r2.ok) {
        void logPluginApiFailure("fritz-smarthome", "set", `http_${r2.status}`);
        return Response.json({ error: "set_failed" }, { status: 502 });
      }
      return Response.json({ ok: true });
    }
    const r = await getText(aha(base, sid, "getdevicelistinfos"), ac.signal);
    if (!r.ok) {
      void logPluginApiFailure("fritz-smarthome", "state", `http_${r.status}`);
      return Response.json({ error: "upstream_error", detail: `FRITZ!Box antwortete mit HTTP ${r.status}.` }, { status: 502 });
    }
    return Response.json({ devices: parseDevices(r.text) });
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("fritz-smarthome", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("fritz-smarthome", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("fritz-smarthome", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    if (sid) await logout(base, sid, ac.signal);
    clearTimeout(t);
  }
}
async function handleFritzSmartHomeRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function fritzSmartHomeServerHandler(ctx) {
  return handleFritzSmartHomeRequest(ctx.request, ctx.path);
}
export {
  fritzSmartHomeServerHandler as default,
  dynamic
};
