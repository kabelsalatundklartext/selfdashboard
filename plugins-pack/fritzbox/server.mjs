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

// plugins-pack/fritzbox/lib/fritzboxTr064.ts
import https from "node:https";

// plugins-pack/fritzbox/lib/tr064NodeFetch.ts
import nodeFetch from "node-fetch";
import DigestClient from "digest-fetch";
function createTr064DigestClient(user, pass) {
  const client = new DigestClient(user || "", pass || "");
  client.getClient = async () => nodeFetch;
  return client;
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
function tr064OriginFromRoot(root) {
  const u = new URL(root);
  return `${u.protocol}//${u.hostname}:${u.port}`;
}
var DESCRIPTOR_PATHS = [
  "/tr064desc.xml",
  "/tr064/tr064desc.xml",
  "/tr064dev.xml",
  "/tr064/tr064dev.xml",
  "/igddesc.xml"
];
function looksLikeDeviceDescription(xml) {
  if (!xml || xml.length < 80) return false;
  if (/<html[\s>]/i.test(xml) && /<body/i.test(xml)) return false;
  return /<serviceType>/i.test(xml) && (/<deviceType>/i.test(xml) || /<root xmlns/i.test(xml) || /InternetGatewayDevice/i.test(xml));
}
async function fetchDescriptorXml(client, origin, signal, fetchOpts) {
  const tried = [];
  for (const p of DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, "")}${p}`;
    tried.push(p);
    const descRes = await client.fetch(url, { method: "GET", signal, ...fetchOpts });
    const text = await descRes.text();
    if (descRes.status === 401 || descRes.status === 403) {
      throw new Error("unauthorized");
    }
    if (!descRes.ok) continue;
    if (!looksLikeDeviceDescription(text)) continue;
    return { xml: text, path: p };
  }
  throw new Error(`desc_not_found:${tried.join(",")}`);
}
function absUrl(origin, relativeOrAbsolute) {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const base = origin.replace(/\/+$/, "");
  const rel = relativeOrAbsolute.startsWith("/") ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${base}${rel}`;
}
function xmlFirst(body, localName) {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, "i");
  const m = body.match(re);
  const v = m?.[1]?.trim();
  return v && v.length > 0 ? v : null;
}
function parseIntSafe(v) {
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function parseDecimalUIntString(xml, ...localNames) {
  for (const name of localNames) {
    const v = xmlFirst(xml, name);
    if (v && /^\d+$/.test(v)) return v;
  }
  return null;
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
function parseUpnpRootDeviceBasics(descXml) {
  const m = descXml.match(/<device[\s>][\s\S]*?<\/device>/i);
  const block = m?.[0] ?? descXml;
  return {
    friendlyName: xmlFirst(block, "friendlyName"),
    modelName: xmlFirst(block, "modelName"),
    manufacturer: xmlFirst(block, "manufacturer")
  };
}
function soapEnvelope(serviceUrn, action) {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}"/>
</s:Body>
</s:Envelope>`;
}
async function soapAction(client, controlUrl, serviceUrn, action, signal, fetchOpts) {
  const body = soapEnvelope(serviceUrn, action);
  const soapAction2 = `"${serviceUrn}#${action}"`;
  const res = await client.fetch(controlUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: soapAction2
    },
    body,
    ...fetchOpts
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`soap_http_${res.status}`);
  }
  return text;
}
function digestClient(user, pass) {
  return createTr064DigestClient(user, pass);
}
async function fetchFritzBoxSummary(conn, signal) {
  const root = fritzboxRootFromInput(conn.baseUrl);
  const origin = tr064OriginFromRoot(root);
  const isHttps = new URL(origin).protocol === "https:";
  const agent = isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const fetchOpts = agent ? { agent } : {};
  const client = digestClient(conn.username, conn.password);
  const { xml: descXml } = await fetchDescriptorXml(client, origin, signal, fetchOpts);
  const services = parseTr064Services(descXml);
  const deviceSvc = services.find((s) => s.type.endsWith("DeviceInfo:1")) || services.find((s) => s.type.includes("DeviceInfo")) || null;
  const wanCommonSvc = services.find((s) => s.type.endsWith("WANCommonInterfaceConfig:1")) || services.find((s) => s.type.includes("WANCommonInterfaceConfig")) || null;
  const hostsSvc = services.find((s) => /:Hosts:1$/i.test(s.type)) || services.find((s) => /:Hosts:2$/i.test(s.type)) || services.find((s) => s.type.includes("Hosts:") && !s.type.includes("IPv6")) || null;
  let modelName = null;
  let softwareVersion = null;
  let manufacturer = null;
  if (deviceSvc) {
    const ctl = absUrl(origin, deviceSvc.controlUrl);
    const xml = await soapAction(client, ctl, deviceSvc.type, "GetInfo", signal, fetchOpts);
    modelName = xmlFirst(xml, "NewModelName");
    softwareVersion = xmlFirst(xml, "NewSoftwareVersion") || xmlFirst(xml, "NewDescriptionVersion");
    manufacturer = xmlFirst(xml, "NewManufacturerName");
  }
  if (!modelName || !manufacturer) {
    const igd = parseUpnpRootDeviceBasics(descXml);
    if (!manufacturer && igd.manufacturer) manufacturer = igd.manufacturer;
    if (!modelName) modelName = igd.modelName || igd.friendlyName;
  }
  let wanAccessType = null;
  let downstreamMaxBps = null;
  let upstreamMaxBps = null;
  let wanTotalBytesReceived = null;
  let wanTotalBytesSent = null;
  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl);
    const xml = await soapAction(client, ctl, wanCommonSvc.type, "GetCommonLinkProperties", signal, fetchOpts);
    wanAccessType = xmlFirst(xml, "NewWANAccessType");
    downstreamMaxBps = parseIntSafe(xmlFirst(xml, "NewLayer1DownstreamMaxBitRate"));
    upstreamMaxBps = parseIntSafe(xmlFirst(xml, "NewLayer1UpstreamMaxBitRate"));
    try {
      const addon = await soapAction(client, ctl, wanCommonSvc.type, "GetAddonInfos", signal, fetchOpts);
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesReceived64",
        "NewX_AVM_DE_TotalBytesReceived64",
        "NewTotalBytesReceived",
        "TotalBytesReceived"
      );
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesSent64",
        "NewX_AVM_DE_TotalBytesSent64",
        "NewTotalBytesSent",
        "TotalBytesSent"
      );
    } catch {
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, wanCommonSvc.type, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, wanCommonSvc.type, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  const wanIpServices = services.filter((s) => {
    const t = s.type;
    return t.includes("WANIPConnection") && !t.includes("WANIPv6");
  });
  let connectionStatus = null;
  let uptimeSec = null;
  let externalIpv4 = null;
  let lastError = null;
  let wanConnectionType = null;
  let wanConnectionName = null;
  let natEnabled = null;
  let wanDnsServers = null;
  let primaryWanIp = null;
  for (const svc of wanIpServices) {
    const ctl = absUrl(origin, svc.controlUrl);
    try {
      const stXml = await soapAction(client, ctl, svc.type, "GetStatusInfo", signal, fetchOpts);
      connectionStatus = xmlFirst(stXml, "NewConnectionStatus") ?? connectionStatus;
      uptimeSec = parseIntSafe(xmlFirst(stXml, "NewUptime")) ?? uptimeSec;
      lastError = xmlFirst(stXml, "NewLastConnectionError") ?? lastError;
      if (!primaryWanIp) primaryWanIp = svc;
      const ipXml = await soapAction(client, ctl, svc.type, "GetExternalIPAddress", signal, fetchOpts);
      const ip = xmlFirst(ipXml, "NewExternalIPAddress");
      if (ip && ip !== "0.0.0.0") {
        externalIpv4 = ip;
        primaryWanIp = svc;
        break;
      }
    } catch {
    }
  }
  if (primaryWanIp) {
    try {
      const ctl = absUrl(origin, primaryWanIp.controlUrl);
      const infoXml = await soapAction(client, ctl, primaryWanIp.type, "GetInfo", signal, fetchOpts);
      wanConnectionType = xmlFirst(infoXml, "NewConnectionType");
      wanConnectionName = xmlFirst(infoXml, "NewName");
      const nat = xmlFirst(infoXml, "NewNATEnabled");
      if (nat === "1" || /^true$/i.test(nat ?? "")) natEnabled = true;
      else if (nat === "0" || /^false$/i.test(nat ?? "")) natEnabled = false;
      wanDnsServers = xmlFirst(infoXml, "NewDNSServers");
    } catch {
    }
  }
  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl);
    const t = primaryWanIp.type;
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  let hostCount = null;
  if (hostsSvc) {
    try {
      const hCtl = absUrl(origin, hostsSvc.controlUrl);
      const hXml = await soapAction(client, hCtl, hostsSvc.type, "GetHostNumberOfEntries", signal, fetchOpts);
      hostCount = parseIntSafe(xmlFirst(hXml, "NewHostNumberOfEntries"));
    } catch {
    }
  }
  return {
    modelName,
    softwareVersion,
    manufacturer,
    wanAccessType,
    downstreamMaxBps,
    upstreamMaxBps,
    connectionStatus,
    uptimeSec,
    externalIpv4,
    lastError,
    wanConnectionType,
    wanConnectionName,
    natEnabled,
    wanDnsServers,
    hostCount,
    wanTotalBytesReceived,
    wanTotalBytesSent
  };
}
async function fetchFritzBoxByteCountersOnly(conn, signal) {
  const root = fritzboxRootFromInput(conn.baseUrl);
  const origin = tr064OriginFromRoot(root);
  const isHttps = new URL(origin).protocol === "https:";
  const agent = isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const fetchOpts = agent ? { agent } : {};
  const client = digestClient(conn.username, conn.password);
  const { xml: descXml } = await fetchDescriptorXml(client, origin, signal, fetchOpts);
  const services = parseTr064Services(descXml);
  const wanCommonSvc = services.find((s) => s.type.endsWith("WANCommonInterfaceConfig:1")) || services.find((s) => s.type.includes("WANCommonInterfaceConfig")) || null;
  let wanTotalBytesReceived = null;
  let wanTotalBytesSent = null;
  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl);
    const urn = wanCommonSvc.type;
    try {
      const addon = await soapAction(client, ctl, urn, "GetAddonInfos", signal, fetchOpts);
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesReceived64",
        "NewX_AVM_DE_TotalBytesReceived64",
        "NewTotalBytesReceived",
        "TotalBytesReceived"
      );
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesSent64",
        "NewX_AVM_DE_TotalBytesSent64",
        "NewTotalBytesSent",
        "TotalBytesSent"
      );
    } catch {
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, urn, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, urn, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  const wanIpServices = services.filter((s) => {
    const t = s.type;
    return t.includes("WANIPConnection") && !t.includes("WANIPv6");
  });
  const primaryWanIp = wanIpServices[0] ?? null;
  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl);
    const t = primaryWanIp.type;
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  return { wanTotalBytesReceived, wanTotalBytesSent };
}

// plugins-pack/fritzbox/server.ts
var FETCH_TIMEOUT_MS = 18e3;
var MAX_BODY_BYTES = 12e3;
function clampStr(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}
async function handleFritzboxPluginRequest(req, _path) {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }
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
  let baseUrl;
  try {
    baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ""));
    await assertSafeOutboundUrlResolved(baseUrl);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      return Response.json({ ok: false, error: "blocked_url", detail: e.message }, { status: 400 });
    }
    const code = e instanceof Error ? e.message : "bad_url";
    return Response.json({ ok: false, error: code }, { status: 400 });
  }
  const username = clampStr(body.username, 200);
  const password = openSealedSecret(
    typeof body.password === "string" ? body.password.slice(0, 2e3) : ""
  ).slice(0, 500);
  const insecureTls = body.insecureTls === true;
  const lite = body.lite === true;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (lite) {
      const counters = await fetchFritzBoxByteCountersOnly(
        { baseUrl, username, password, insecureTls },
        ac.signal
      );
      return Response.json({
        ok: true,
        lite: true,
        ...counters,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const summary = await fetchFritzBoxSummary(
      { baseUrl, username, password, insecureTls },
      ac.signal
    );
    return Response.json({
      ok: true,
      ...summary,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : String(e);
    if (name === "AbortError") {
      void logPluginApiFailure("fritzbox", "request", "timeout", { lite });
      return Response.json({ ok: false, error: "timeout" }, { status: 504 });
    }
    if (msg === "unauthorized") {
      void logPluginApiFailure("fritzbox", "auth", "unauthorized", { lite });
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    void logPluginApiFailure("fritzbox", "request", msg, { lite });
    return Response.json({ ok: false, error: "fetch_failed", message: msg }, { status: 502 });
  } finally {
    clearTimeout(to);
  }
}
function fritzboxServerHandler(ctx) {
  return handleFritzboxPluginRequest(ctx.request, ctx.path);
}
var server_default = fritzboxServerHandler;
export {
  server_default as default,
  fritzboxServerHandler,
  handleFritzboxPluginRequest
};
