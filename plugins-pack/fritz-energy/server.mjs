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

// plugins-pack/fritzbox/lib/tr064NodeFetch.ts
import nodeFetch from "node-fetch";
import DigestClient from "digest-fetch";
function createTr064DigestClient(user, pass) {
  const client = new DigestClient(user || "", pass || "");
  client.getClient = async () => nodeFetch;
  return client;
}
async function runWithTr064NodeFetch(_conn, fn) {
  return fn();
}

// plugins-pack/fritzbox/lib/fritzboxTr064.ts
var BLOCKED_HOSTNAMES2 = new Set(
  ["metadata.google.internal", "metadata.goog", "169.254.169.254"].map((h) => h.toLowerCase())
);
function normalizeBaseUrl(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES2.has(host)) throw new Error("blocked_host");
  return u;
}
function fritzboxRootFromInput(raw) {
  const u = normalizeBaseUrl(raw);
  if (!u.port || u.port === "80" || u.port === "443") {
    if (u.protocol === "http:") u.port = "49000";
    if (u.protocol === "https:") u.port = "49443";
  }
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "";
  const origin = `${u.protocol}//${u.hostname}:${u.port}`;
  return path ? `${origin}${path}` : origin;
}
function xmlFirst(body, localName) {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, "i");
  const m = body.match(re);
  const v = m?.[1]?.trim();
  return v && v.length > 0 ? v : null;
}
function parseTr064Services(descXml) {
  const out = [];
  const serviceBlocks = descXml.split(/<service[\s>]/i);
  for (let i = 1; i < serviceBlocks.length; i++) {
    const block = serviceBlocks[i] ?? "";
    const t = xmlFirst(block, "serviceType");
    const c = xmlFirst(block, "controlURL");
    if (t && c) out.push({ type: t, controlUrl: c });
  }
  return out;
}

// plugins-pack/fritzbox/lib/fritzTr064Shared.ts
var TR064_DESCRIPTOR_PATHS = [
  "/tr64desc.xml",
  "/tr064desc.xml",
  "/tr064/tr064desc.xml",
  "/tr064/tr64desc.xml",
  "/tr064dev.xml",
  "/tr064/tr064dev.xml",
  "/igddesc.xml"
];
function looksLikeDeviceDescription(xml) {
  if (!xml || xml.length < 80) return false;
  if (/<html[\s>]/i.test(xml) && /<body/i.test(xml)) return false;
  return /<serviceType>/i.test(xml) && (/<deviceType>/i.test(xml) || /<root xmlns/i.test(xml) || /InternetGatewayDevice/i.test(xml));
}
function escapeXmlTr064(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function tr064OriginsForConnection(conn) {
  const root = fritzboxRootFromInput(conn.baseUrl);
  const u = new URL(root);
  const host = u.hostname;
  const out = [`${u.protocol}//${host}:${u.port}`];
  if (u.protocol === "http:") out.push(`https://${host}:49443`);
  else if (u.protocol === "https:") out.push(`http://${host}:49000`);
  return [...new Set(out)];
}
async function findTr064ServiceAcrossDescriptors(client, origin, signal, fetchOpts, match) {
  for (const p of TR064_DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, "")}${p}`;
    const descRes = await client.fetch(url, { method: "GET", signal, ...fetchOpts });
    const text = await descRes.text();
    if (descRes.status === 401 || descRes.status === 403) throw new Error("unauthorized");
    if (!descRes.ok) continue;
    if (!looksLikeDeviceDescription(text)) continue;
    const hit = parseTr064Services(text).find(match);
    if (hit) return { service: hit, descriptorPath: p };
  }
  return null;
}
function buildTr064SoapEnvelope(serviceUrn, action, args = {}) {
  const inner = Object.entries(args).map(([k, v]) => `<${k}>${escapeXmlTr064(v)}</${k}>`).join("\n");
  const bodyInner = inner ? `
${inner}
` : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}">${bodyInner}</u:${action}>
</s:Body>
</s:Envelope>`;
}

// plugins-pack/fritzbox/lib/fritzHomeautoTr064.ts
import https from "node:https";
function absUrl(origin, relativeOrAbsolute) {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const base = origin.replace(/\/+$/, "");
  const rel = relativeOrAbsolute.startsWith("/") ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${base}${rel}`;
}
function xmlFirst2(body, localName) {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, "i");
  const m = body.match(re);
  const v = m?.[1]?.trim();
  return v && v.length > 0 ? v : null;
}
function parseUi4(v) {
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function soapFaultCode(xml) {
  if (!/<s:Fault/i.test(xml) && !/<UPnPError/i.test(xml)) return null;
  return xmlFirst2(xml, "errorCode");
}
function isHomeautoService(s) {
  return /X_AVM-DE_Homeauto/i.test(s.type) || /\/x_homeauto/i.test(s.controlUrl);
}
var warnedInsecureFritzHosts = /* @__PURE__ */ new Set();
function warnInsecureFritzTlsOnce(host) {
  if (warnedInsecureFritzHosts.has(host)) return;
  warnedInsecureFritzHosts.add(host);
  console.warn(
    `[SelfDashboard] FRITZ!-TLS-Zertifikatspr\xFCfung ist AUS f\xFCr Host ${host} \u2014 Verbindung ungesichert.`
  );
}
function tr064FetchOpts(origin, conn) {
  const isHttps = origin.startsWith("https:");
  if (isHttps && conn.insecureTls) warnInsecureFritzTlsOnce(new URL(origin).host);
  const agent = isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  return agent ? { agent } : {};
}
async function resolveHomeautoService(conn, client, signal) {
  for (const origin of tr064OriginsForConnection(conn)) {
    const hit = await findTr064ServiceAcrossDescriptors(
      client,
      origin,
      signal,
      tr064FetchOpts(origin, conn),
      isHomeautoService
    );
    if (hit) return { service: hit.service, origin };
  }
  throw new Error("homeauto_not_found");
}
async function homeautoCtx(conn, signal) {
  const client = createTr064DigestClient(conn.username, conn.password);
  const { service: ha, origin } = await resolveHomeautoService(conn, client, signal);
  const controlUrl = absUrl(origin, ha.controlUrl);
  return { client, ha, controlUrl };
}
function normalizeAin(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 12) throw new Error("bad_ain");
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}
function ainMatches(a, b) {
  return a.replace(/\D/g, "") === b.replace(/\D/g, "");
}
function parseReadingFromHomeautoXml(xml) {
  const enabled = xmlFirst2(xml, "NewMultimeterIsEnabled");
  const multimeterSupported = enabled === "ENABLED" || enabled === "1" || /^true$/i.test(enabled ?? "");
  const powerCentiW = parseUi4(xmlFirst2(xml, "NewMultimeterPower"));
  const energyWh = parseUi4(xmlFirst2(xml, "NewMultimeterEnergy"));
  return {
    powerW: powerCentiW != null ? Math.max(0, powerCentiW / 100) : 0,
    energyWh: energyWh != null ? Math.max(0, energyWh) : 0,
    voltageV: null,
    multimeterSupported
  };
}
function deviceFromHomeautoXml(xml) {
  const ainRaw = xmlFirst2(xml, "NewAIN");
  if (!ainRaw) return null;
  try {
    return {
      ain: normalizeAin(ainRaw),
      name: xmlFirst2(xml, "NewDeviceName")?.trim() || ainRaw,
      productName: xmlFirst2(xml, "NewProductName")?.trim() || null
    };
  } catch {
    return null;
  }
}
async function callHomeautoAction(ctx, signal, action, args = {}) {
  const body = buildTr064SoapEnvelope(ctx.ha.type, action, args);
  const res = await ctx.client.fetch(ctx.controlUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": 'text/xml; charset="utf-8"',
      SOAPAction: `"${ctx.ha.type}#${action}"`
    },
    body
  });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`soap_http_${res.status}`);
  const fault = soapFaultCode(text);
  if (fault) throw new Error(`homeauto_fault_${fault}`);
  return text;
}
async function listFritzSmartDevices(conn, signal) {
  return runWithTr064NodeFetch(conn, async () => {
    const ctx = await homeautoCtx(conn, signal);
    const out = [];
    for (let index = 0; index < 128; index++) {
      let xml;
      try {
        xml = await callHomeautoAction(ctx, signal, "GetGenericDeviceInfos", {
          NewIndex: String(index)
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "homeauto_fault_713" || index > 0) break;
        if (msg === "homeauto_fault_606") throw new Error("homeauto_unauthorized");
        throw e;
      }
      const dev = deviceFromHomeautoXml(xml);
      if (!dev) break;
      out.push(dev);
    }
    return out;
  });
}
async function fetchFritzEnergyReading(conn, ainRaw, signal) {
  return runWithTr064NodeFetch(conn, async () => {
    const ain = normalizeAin(ainRaw);
    const ctx = await homeautoCtx(conn, signal);
    try {
      const xml = await callHomeautoAction(ctx, signal, "GetSpecificDeviceInfos", { NewAIN: ain });
      return parseReadingFromHomeautoXml(xml);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "homeauto_fault_606") throw new Error("homeauto_unauthorized");
      if (!msg.startsWith("homeauto_fault_")) throw e;
    }
    for (let index = 0; index < 128; index++) {
      let xml;
      try {
        xml = await callHomeautoAction(ctx, signal, "GetGenericDeviceInfos", {
          NewIndex: String(index)
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "homeauto_fault_713" || index > 0) break;
        if (msg === "homeauto_fault_606") throw new Error("homeauto_unauthorized");
        throw e;
      }
      const devAin = xmlFirst2(xml, "NewAIN");
      if (!devAin || !ainMatches(devAin, ain)) continue;
      return parseReadingFromHomeautoXml(xml);
    }
    throw new Error("device_not_found");
  });
}

// plugins-pack/fritzbox/lib/fritzEnergyImport.ts
import { createHash, pbkdf2Sync } from "node:crypto";
var PBKDF2_INDICATOR = "2$";
var LOGIN_PATH = "/login_sid.lua?version=2";
var AHA_PATH = "/webservices/homeautoswitch.lua";
var REST_DEVICES = "/api/v0/smarthome/overview/devices";
function xmlText(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
  const m = xml.match(re);
  const v = m?.[1]?.trim();
  return v && v.length > 0 ? v : null;
}
function md5ChallengeResponse(challenge, password) {
  const buf = Buffer.from(`${challenge}-${password}`, "utf16le");
  return `${challenge}-${createHash("md5").update(buf).digest("hex")}`;
}
function pbkdf2ChallengeResponse(challenge, password) {
  const parts = challenge.split("$");
  if (parts.length < 5) throw new Error("bad_challenge");
  const iterations1 = parseInt(parts[1], 10);
  const salt1 = parts[2];
  const iterations2 = parseInt(parts[3], 10);
  const salt2 = parts[4];
  const staticHash = pbkdf2Sync(password, Buffer.from(salt1, "hex"), iterations1, 32, "sha256");
  const dynamicHash = pbkdf2Sync(staticHash, Buffer.from(salt2, "hex"), iterations2, 32, "sha256");
  return `${salt2}$${dynamicHash.toString("hex")}`;
}
function challengeResponse(challenge, password) {
  return challenge.startsWith(PBKDF2_INDICATOR) ? pbkdf2ChallengeResponse(challenge, password) : md5ChallengeResponse(challenge, password);
}
function fritzWebOrigins(conn) {
  const u = new URL(conn.baseUrl);
  const host = u.hostname;
  const preferHttps = u.protocol === "https:" || conn.insecureTls;
  const out = [];
  if (preferHttps) out.push(`https://${host}`);
  out.push(`http://${host}`);
  if (!preferHttps) out.push(`https://${host}`);
  return [...new Set(out)];
}
async function webFetch(conn, origin, path, init) {
  const q = init?.query;
  const url = new URL(path, origin);
  if (q) {
    for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);
  }
  const { query: _q, ...rest } = init ?? {};
  return fetch(url.toString(), rest);
}
async function loginSid(conn, origin, signal) {
  const r1 = await webFetch(conn, origin, LOGIN_PATH, { signal });
  const t1 = await r1.text();
  if (!r1.ok) throw new Error(`login_http_${r1.status}`);
  const challenge = xmlText(t1, "Challenge");
  const sid0 = xmlText(t1, "SID");
  if (!challenge) throw new Error("login_no_challenge");
  if (sid0 && sid0 !== "0000000000000000") return sid0;
  const response = challengeResponse(challenge, conn.password);
  const user = conn.username || "";
  const body = new URLSearchParams({ username: user, response });
  const r2 = await webFetch(conn, origin, LOGIN_PATH, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  const t2 = await r2.text();
  if (!r2.ok) throw new Error(`login_http_${r2.status}`);
  const sid = xmlText(t2, "SID");
  if (!sid || sid === "0000000000000000") throw new Error("unauthorized");
  return sid;
}
function ainDigits(ain) {
  return ain.replace(/\D/g, "");
}
function sumWhToKwh(values) {
  let sum = 0;
  for (const v of values) {
    if (Number.isFinite(v) && v > 0) sum += v;
  }
  return sum / 1e3;
}
function berlinDateKey(ms) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(ms));
}
function berlinMonthKey(ms) {
  return berlinDateKey(ms).slice(0, 7);
}
function startOfBerlinDayMs(ms) {
  let lo = ms - 40 * 36e5;
  let hi = ms;
  for (let i = 0; i < 48; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(new Date(mid));
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const sec = Number(parts.find((p) => p.type === "second")?.value ?? 0);
    if (h > 0 || m > 0 || sec > 0) lo = mid + 1;
    else hi = mid;
  }
  return hi;
}
function normalizePeriodKey(period, gridSec) {
  const p = period.toLowerCase().trim();
  if (p === "day" || p === "today" || p === "86400") return "day";
  if (p === "week" || p === "7days" || p === "604800") return "week";
  if (p === "month" || p === "2592000") return "month";
  if (p === "year" || p === "2years" || p === "years" || p === "730") return "year";
  if (gridSec >= 2592e3) return "year";
  if (gridSec >= 86400) return "month";
  if (gridSec >= 21600) return "week";
  if (gridSec >= 900) return "day";
  return null;
}
function dailyFromBuckets(values, gridSec, endMs) {
  const daily = {};
  if (gridSec <= 0 || values.length === 0) return daily;
  const spanMs = gridSec * 1e3;
  for (let i = 0; i < values.length; i++) {
    const wh = values[i];
    if (!Number.isFinite(wh) || wh <= 0) continue;
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs;
    const key = berlinDateKey(bucketEnd);
    daily[key] = (daily[key] ?? 0) + wh / 1e3;
  }
  return daily;
}
function monthlyFromBuckets(values, gridSec, endMs) {
  const monthly = {};
  if (gridSec <= 0 || values.length === 0) return monthly;
  const spanMs = gridSec * 1e3;
  for (let i = 0; i < values.length; i++) {
    const wh = values[i];
    if (!Number.isFinite(wh) || wh <= 0) continue;
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs;
    const key = berlinMonthKey(bucketEnd);
    monthly[key] = (monthly[key] ?? 0) + wh / 1e3;
  }
  return monthly;
}
function mergeDailyMax(target, add) {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = Math.max(target[k] ?? 0, v);
  }
}
function mergeDailySum(target, add) {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = (target[k] ?? 0) + v;
  }
}
function dailyFromBucketsCalendarDay(values, gridSec, endMs) {
  const daily = {};
  if (gridSec <= 0 || values.length === 0) return daily;
  const sod = startOfBerlinDayMs(endMs);
  const spanMs = gridSec * 1e3;
  for (let i = 0; i < values.length; i++) {
    const wh = values[i];
    if (!Number.isFinite(wh) || wh <= 0) continue;
    const bucketEnd = sod + (i + 1) * spanMs;
    if (bucketEnd > endMs) continue;
    const key = berlinDateKey(bucketEnd);
    daily[key] = (daily[key] ?? 0) + wh / 1e3;
  }
  return daily;
}
function sumWhTodayCalendarDay(values, gridSec, endMs) {
  if (gridSec <= 0 || values.length === 0) return 0;
  const sod = startOfBerlinDayMs(endMs);
  const spanMs = gridSec * 1e3;
  let whSum = 0;
  let lastWh = 0;
  let slots = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || v <= 0) continue;
    const bucketEnd = sod + (i + 1) * spanMs;
    if (bucketEnd > endMs) break;
    whSum += v;
    lastWh = v;
    slots++;
  }
  if (slots === 0) return 0;
  if (lastWh > 0 && whSum > lastWh * 1.35) return lastWh;
  return whSum;
}
function sumWhBucketsRollingToday(values, gridSec, endMs) {
  if (gridSec <= 0 || values.length === 0) return 0;
  const todayKey = berlinDateKey(endMs);
  const spanMs = gridSec * 1e3;
  let wh = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || v <= 0) continue;
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs;
    if (berlinDateKey(bucketEnd) === todayKey) wh += v;
  }
  return wh;
}
function sumLast7CalendarDays(daily, todayKey) {
  const keys = Object.keys(daily).filter((k) => k <= todayKey).sort();
  if (keys.length === 0) return 0;
  return keys.slice(-7).reduce((a, k) => a + (daily[k] ?? 0), 0);
}
function sumCurrentMonthToDate(daily, todayKey) {
  const monthPrefix = todayKey.slice(0, 7);
  let sum = 0;
  for (const [k, v] of Object.entries(daily)) {
    if (k.startsWith(monthPrefix) && k <= todayKey) sum += v;
  }
  return sum;
}
function parseBasicDeviceStatsXml(xml) {
  const energies = [];
  const energyBlocks = xml.match(/<energy\b[^>]*>[\s\S]*?<\/energy>/gi) ?? [];
  for (const block of energyBlocks) {
    const statsM = block.match(/<stats\b([^>]*)>([\s\S]*?)<\/stats>/i);
    if (!statsM) continue;
    const attrs = statsM[1] ?? "";
    const period = attrs.match(/\bperiod="([^"]+)"/i)?.[1] ?? "unknown";
    const grid = parseInt(attrs.match(/\bgrid="(\d+)"/i)?.[1] ?? "0", 10);
    const csv = (statsM[2] ?? "").trim();
    const values = csv.split(",").map((s) => {
      const n = parseInt(s.trim(), 10);
      return Number.isFinite(n) ? n : 0;
    }).filter((_, i, arr) => i < arr.length);
    energies.push({ period, interval: grid, values });
  }
  return { energies };
}
function periodKwhFromSeries(energies) {
  const dailyKwh = {};
  const monthlyKwh = {};
  const now = Date.now();
  const todayKey = berlinDateKey(now);
  let todayKwh = 0;
  let weekSeriesKwh = 0;
  let monthSeriesKwh = 0;
  let hasWeekSeries = false;
  let hasMonthSeries = false;
  for (const s of energies) {
    const grid = s.interval || 900;
    const kind = normalizePeriodKey(s.period, grid);
    const bucketsRolling = dailyFromBuckets(s.values, grid, now);
    if (kind === "day") {
      const calWh = sumWhTodayCalendarDay(s.values, grid, now);
      const rollWh = sumWhBucketsRollingToday(s.values, grid, now);
      if (calWh > 0) todayKwh = calWh / 1e3;
      else if (rollWh > 0) todayKwh = rollWh / 1e3;
      mergeDailySum(dailyKwh, dailyFromBucketsCalendarDay(s.values, grid, now));
    } else if (kind === "week") {
      hasWeekSeries = true;
      if (grid >= 86400) {
        weekSeriesKwh = sumWhToKwh(s.values);
      }
      mergeDailySum(dailyKwh, bucketsRolling);
    } else if (kind === "month") {
      hasMonthSeries = true;
      if (grid >= 86400) {
        monthSeriesKwh = sumWhToKwh(s.values);
      }
      mergeDailySum(dailyKwh, bucketsRolling);
      mergeDailyMax(monthlyKwh, monthlyFromBuckets(s.values, grid, now));
    } else if (kind === "year") {
      mergeDailyMax(monthlyKwh, monthlyFromBuckets(s.values, grid, now));
    } else {
      mergeDailySum(dailyKwh, bucketsRolling);
    }
  }
  const last7FromDaily = sumLast7CalendarDays(dailyKwh, todayKey);
  let last7DaysKwh = last7FromDaily;
  if (last7DaysKwh <= 0 && hasWeekSeries && weekSeriesKwh > 0) last7DaysKwh = weekSeriesKwh;
  const monthFromDaily = sumCurrentMonthToDate(dailyKwh, todayKey);
  let monthKwh = monthFromDaily;
  if (monthKwh <= 0 && hasMonthSeries && monthSeriesKwh > 0) monthKwh = monthSeriesKwh;
  if (monthKwh <= 0) monthKwh = Math.max(0, monthlyKwh[berlinMonthKey(now)] ?? 0);
  return { todayKwh, last7DaysKwh, monthKwh, dailyKwh, monthlyKwh };
}
async function fetchRestPeriodKwh(conn, ain, signal) {
  for (const origin of fritzWebOrigins(conn)) {
    try {
      const sid = await loginSid(conn, origin, signal);
      const devRes = await webFetch(conn, origin, REST_DEVICES, {
        signal,
        headers: { Authorization: `AVM-SID ${sid}`, Accept: "application/json" }
      });
      if (devRes.status === 404 || devRes.status === 405) continue;
      if (!devRes.ok) continue;
      const devices = await devRes.json();
      if (!Array.isArray(devices)) continue;
      const target = ainDigits(ain);
      const dev = devices.find((d) => ainDigits(String(d.ain ?? "")) === target);
      if (!dev?.unitUids?.length) continue;
      const unitUid = encodeURIComponent(dev.unitUids[0]);
      const unitRes = await webFetch(conn, origin, `/api/v0/smarthome/overview/units/${unitUid}`, {
        signal,
        headers: { Authorization: `AVM-SID ${sid}`, Accept: "application/json" }
      });
      if (!unitRes.ok) continue;
      const unit = await unitRes.json();
      const energies = (unit.statistics?.energies ?? []).map((e) => ({
        period: String(e.period ?? ""),
        interval: e.interval || 900,
        values: (e.values ?? []).map((v) => typeof v === "number" ? v : 0)
      }));
      if (energies.length === 0) continue;
      return periodKwhFromSeries(energies);
    } catch {
      continue;
    }
  }
  return null;
}
async function fetchAhaBasicStats(conn, ain, signal) {
  const ainParam = ain.trim();
  for (const origin of fritzWebOrigins(conn)) {
    try {
      const sid = await loginSid(conn, origin, signal);
      const res = await webFetch(conn, origin, AHA_PATH, {
        signal,
        query: { sid, ain: ainParam, switchcmd: "getbasicdevicestats" }
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!/<energy/i.test(xml)) continue;
      return periodKwhFromSeries(parseBasicDeviceStatsXml(xml).energies);
    } catch {
      continue;
    }
  }
  return null;
}
async function fetchFritzEnergyHistoryFromBox(conn, ain, signal) {
  return runWithTr064NodeFetch(conn, async () => {
    const rest = await fetchRestPeriodKwh(conn, ain, signal);
    if (rest) return rest;
    return fetchAhaBasicStats(conn, ain, signal);
  });
}

// plugins-pack/fritzbox/lib/fritzEnergyStore.ts
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { join as join3 } from "path";
import { createHash as createHash2 } from "node:crypto";
var MAX_RECENT = 10080;
var MAX_DAILY_KEYS = 400;
function storeDir() {
  return join3(dataDir(), "fritz-energy");
}
function energyStoreKey(baseUrl, ain) {
  const norm = `${baseUrl.trim().toLowerCase()}|${ain.replace(/\s/g, "")}`;
  return createHash2("sha256").update(norm).digest("hex").slice(0, 24);
}
function storePath(key) {
  return join3(storeDir(), `${key}.json`);
}
function berlinDateKey2(ms) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return fmt.format(new Date(ms));
}
function berlinMonthPrefix(ms) {
  return berlinDateKey2(ms).slice(0, 7);
}
function pruneDaily(daily) {
  const keys = Object.keys(daily).sort();
  if (keys.length <= MAX_DAILY_KEYS) return daily;
  const keep = new Set(keys.slice(-MAX_DAILY_KEYS));
  const out = {};
  for (const k of keys) {
    if (keep.has(k)) out[k] = daily[k];
  }
  return out;
}
function pruneRecent(recent) {
  if (recent.length <= MAX_RECENT) return recent;
  return recent.slice(-MAX_RECENT);
}
async function readEnergyStore(key) {
  try {
    const raw = await readFile(storePath(key), "utf8");
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return null;
    if (!j.monthlyKwh || typeof j.monthlyKwh !== "object") j.monthlyKwh = {};
    return j;
  } catch {
    return null;
  }
}
async function writeEnergyStore(key, data) {
  const dir = storeDir();
  await mkdir(dir, { recursive: true });
  const path = storePath(key);
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data)}
`, "utf8");
  await rename(tmp, path);
}
function sumDailyRange(daily, fromKey, toKey) {
  let sum = 0;
  for (const [k, v] of Object.entries(daily)) {
    if (k >= fromKey && k <= toKey) sum += v;
  }
  return sum;
}
function sumLast7Days(daily, todayKey) {
  const keys = Object.keys(daily).filter((k) => k <= todayKey).sort();
  if (keys.length === 0) return 0;
  return keys.slice(-7).reduce((a, k) => a + (daily[k] ?? 0), 0);
}
function sumMonthFromDaily(daily, monthPrefix, todayKey) {
  return sumDailyRange(daily, `${monthPrefix}-01`, todayKey);
}
function monthKeysFromDaily(daily) {
  const out = {};
  for (const [day, kwh] of Object.entries(daily)) {
    if (kwh <= 0) continue;
    const m = day.slice(0, 7);
    out[m] = (out[m] ?? 0) + kwh;
  }
  return out;
}
function computeAggregates(store, sample) {
  const todayKey = berlinDateKey2(sample.t);
  const monthPrefix = berlinMonthPrefix(sample.t);
  const box = store.boxPeriodKwh;
  const last7Daily = sumLast7Days(store.dailyKwh, todayKey);
  const monthDaily = sumMonthFromDaily(store.dailyKwh, monthPrefix, todayKey);
  const todayKwh = Math.max(0, box?.today ?? 0);
  const last7DaysKwh = Math.max(0, box?.week ?? 0, last7Daily);
  const monthKwh = Math.max(0, box?.month ?? 0, monthDaily);
  return {
    currentPowerW: sample.powerW,
    todayKwh,
    last7DaysKwh,
    monthKwh,
    energyWhTotal: sample.energyWh
  };
}
function storeNeedsHistoryImport(store) {
  if (!store) return true;
  if (store.historyImportedAt) return false;
  if (store.boxPeriodKwh) return false;
  const dayKeys = Object.keys(store.dailyKwh);
  return dayKeys.length < 2;
}
function mergeMonthly(target, add) {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = Math.max(target[k] ?? 0, v);
  }
}
async function syncBoxEnergyPeriods(key, meta, box, sample) {
  const store = await readEnergyStore(key) ?? {
    ain: meta.ain,
    baseUrl: meta.baseUrl,
    dailyKwh: {},
    monthlyKwh: {},
    dayBaselineWh: {},
    recent: [],
    updatedAt: (/* @__PURE__ */ new Date(0)).toISOString()
  };
  if (!store.monthlyKwh) store.monthlyKwh = {};
  for (const [day, kwh] of Object.entries(box.dailyKwh)) {
    if (kwh > 0) store.dailyKwh[day] = Math.max(store.dailyKwh[day] ?? 0, kwh);
  }
  mergeMonthly(store.monthlyKwh, box.monthlyKwh);
  mergeMonthly(store.monthlyKwh, monthKeysFromDaily(store.dailyKwh));
  const todayKey = berlinDateKey2(sample.t);
  if (box.todayKwh > 0) store.dailyKwh[todayKey] = Math.max(store.dailyKwh[todayKey] ?? 0, box.todayKwh);
  const nextPeriods = {
    today: box.todayKwh,
    week: box.last7DaysKwh,
    month: box.monthKwh
  };
  if (nextPeriods.today > 0 || nextPeriods.week > 0 || nextPeriods.month > 0 || !store.boxPeriodKwh) {
    store.boxPeriodKwh = nextPeriods;
  }
  if (!store.historyImportedAt) store.historyImportedAt = (/* @__PURE__ */ new Date()).toISOString();
  store.ain = meta.ain;
  store.baseUrl = meta.baseUrl;
  store.dailyKwh = pruneDaily(store.dailyKwh);
  await writeEnergyStore(key, store);
  return store;
}
async function importBoxEnergyHistory(key, meta, box, sample) {
  const store = await syncBoxEnergyPeriods(key, meta, box, sample);
  store.historyImportedAt = (/* @__PURE__ */ new Date()).toISOString();
  const todayKey = berlinDateKey2(sample.t);
  if (store.dayBaselineWh[todayKey] == null) {
    store.dayBaselineWh[todayKey] = sample.energyWh;
  }
  await writeEnergyStore(key, store);
  return store;
}
async function appendEnergySample(key, meta, sample) {
  const store = await readEnergyStore(key) ?? {
    ain: meta.ain,
    baseUrl: meta.baseUrl,
    dailyKwh: {},
    monthlyKwh: {},
    dayBaselineWh: {},
    recent: [],
    updatedAt: (/* @__PURE__ */ new Date(0)).toISOString()
  };
  if (!store.monthlyKwh) store.monthlyKwh = {};
  mergeMonthly(store.monthlyKwh, monthKeysFromDaily(store.dailyKwh));
  store.recent = pruneRecent([...store.recent, sample]);
  store.dailyKwh = pruneDaily(store.dailyKwh);
  if (Object.keys(store.dayBaselineWh).length > MAX_DAILY_KEYS) {
    const keep = new Set(Object.keys(store.dailyKwh).sort().slice(-MAX_DAILY_KEYS));
    const bl = {};
    for (const k of keep) {
      if (store.dayBaselineWh[k] != null) bl[k] = store.dayBaselineWh[k];
    }
    store.dayBaselineWh = bl;
  }
  store.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  store.ain = meta.ain;
  store.baseUrl = meta.baseUrl;
  await writeEnergyStore(key, store);
  return { store, aggregates: computeAggregates(store, sample) };
}
function monthlyKwhFromStore(store) {
  const out = { ...store.monthlyKwh ?? {} };
  mergeMonthly(out, monthKeysFromDaily(store.dailyKwh));
  return out;
}
function aggregatesFromStore(store) {
  const last = store.recent[store.recent.length - 1];
  if (!last) return null;
  return computeAggregates(store, last);
}

// plugins-pack/fritz-energy/server.ts
var runtime = "nodejs";
var FETCH_TIMEOUT_MS = 2e4;
var MAX_BODY_BYTES = 12e3;
function clampStr(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}
async function connFromBody(body) {
  const baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ""));
  await assertSafeOutboundUrlResolved(baseUrl);
  return {
    baseUrl,
    username: clampStr(body.username, 200),
    password: openSealedSecret(
      typeof body.password === "string" ? body.password.slice(0, 2e3) : ""
    ).slice(0, 500),
    insecureTls: body.insecureTls === true
  };
}
async function handlePost(req) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "body_too_large" }, { status: 413 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (body.action === "listDevices") {
    let conn2;
    try {
      conn2 = await connFromBody(body);
    } catch (e) {
      if (e instanceof UnsafeOutboundUrlError) {
        return Response.json({ ok: false, error: "blocked_url", detail: e.message }, { status: 400 });
      }
      const code = e instanceof Error ? e.message : "bad_url";
      return Response.json({ ok: false, error: code }, { status: 400 });
    }
    const ac2 = new AbortController();
    const to2 = setTimeout(() => ac2.abort(), FETCH_TIMEOUT_MS);
    try {
      const devices = await listFritzSmartDevices(conn2, ac2.signal);
      return Response.json({ ok: true, devices });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Response.json({ ok: false, error: msg }, { status: 502 });
    } finally {
      clearTimeout(to2);
    }
  }
  let ain;
  try {
    ain = normalizeAin(String(body.ain ?? ""));
  } catch {
    return Response.json({ ok: false, error: "bad_ain" }, { status: 400 });
  }
  let conn;
  try {
    conn = await connFromBody(body);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      return Response.json({ ok: false, error: "blocked_url", detail: e.message }, { status: 400 });
    }
    const code = e instanceof Error ? e.message : "bad_url";
    return Response.json({ ok: false, error: code }, { status: 400 });
  }
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const reading = await fetchFritzEnergyReading(conn, ain, ac.signal);
    if (!reading.multimeterSupported) {
      return Response.json({ ok: false, error: "no_multimeter" }, { status: 422 });
    }
    const key = energyStoreKey(conn.baseUrl, ain);
    const sample = {
      t: Date.now(),
      powerW: reading.powerW,
      energyWh: reading.energyWh
    };
    const forceImport = body.action === "importHistory" || body.importHistory === true;
    const store = await readEnergyStore(key);
    let boxSynced = false;
    try {
      const box = await fetchFritzEnergyHistoryFromBox(conn, ain, ac.signal);
      if (box) {
        boxSynced = true;
        if (forceImport || storeNeedsHistoryImport(store)) {
          await importBoxEnergyHistory(key, { ain, baseUrl: conn.baseUrl }, box, sample);
        } else {
          await syncBoxEnergyPeriods(key, { ain, baseUrl: conn.baseUrl }, box, sample);
        }
      }
    } catch {
    }
    const { store: storeOut, aggregates } = await appendEnergySample(key, { ain, baseUrl: conn.baseUrl }, sample);
    const storeFinal = storeOut;
    return Response.json({
      ok: true,
      ain,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      voltageV: reading.voltageV,
      ...aggregates,
      monthlyKwh: monthlyKwhFromStore(storeFinal),
      recent: storeFinal.recent.slice(-288),
      historyImported: Boolean(storeFinal.historyImportedAt),
      boxPeriods: storeFinal.boxPeriodKwh ?? null,
      periodsFromBox: boxSynced && storeFinal.boxPeriodKwh != null
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : String(e);
    if (name === "AbortError") {
      void logPluginApiFailure("fritz-energy", "request", "timeout", { ain });
      return Response.json({ ok: false, error: "timeout" }, { status: 504 });
    }
    if (msg === "unauthorized") {
      void logPluginApiFailure("fritz-energy", "auth", "unauthorized", { ain });
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    void logPluginApiFailure("fritz-energy", "request", msg, { ain });
    return Response.json({ ok: false, error: msg || "fetch_failed" }, { status: 502 });
  } finally {
    clearTimeout(to);
  }
}
async function handleGet(req) {
  const url = new URL(req.url);
  const baseUrl = url.searchParams.get("baseUrl") ?? "";
  const ainRaw = url.searchParams.get("ain") ?? "";
  let ain;
  try {
    ain = normalizeAin(ainRaw);
  } catch {
    return Response.json({ ok: false, error: "bad_ain" }, { status: 400 });
  }
  let root;
  try {
    root = fritzboxRootFromInput(baseUrl);
  } catch {
    return Response.json({ ok: false, error: "bad_url" }, { status: 400 });
  }
  const key = energyStoreKey(root, ain);
  const store = await readEnergyStore(key);
  if (!store) {
    return Response.json({ ok: true, cached: false });
  }
  const aggregates = aggregatesFromStore(store);
  return Response.json({
    ok: true,
    cached: true,
    ain: store.ain,
    updatedAt: store.updatedAt,
    aggregates,
    monthlyKwh: monthlyKwhFromStore(store),
    recent: store.recent.slice(-288),
    dailyKwh: store.dailyKwh,
    boxPeriods: store.boxPeriodKwh ?? null
  });
}
async function handleFritzEnergyPluginRequest(req) {
  if (req.method === "GET") return handleGet(req);
  if (req.method === "POST") return handlePost(req);
  return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
function fritzEnergyServerHandler(ctx) {
  return handleFritzEnergyPluginRequest(ctx.request);
}
var server_default = fritzEnergyServerHandler;
export {
  server_default as default,
  fritzEnergyServerHandler,
  handleFritzEnergyPluginRequest,
  runtime
};
