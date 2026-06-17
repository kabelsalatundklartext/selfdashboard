// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
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

// plugins-pack/_shared/plugin-server-cache.ts
function createPluginServerCache(options) {
  const maxEntries = Math.max(1, options.maxEntries ?? 32);
  const ttlMs = Math.max(0, options.ttlMs);
  const cache2 = /* @__PURE__ */ new Map();
  function evictIfNeeded() {
    while (cache2.size >= maxEntries) {
      const first = cache2.keys().next().value;
      if (!first) break;
      cache2.delete(first);
    }
  }
  return {
    get(key) {
      const entry = cache2.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        cache2.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key, data) {
      if (ttlMs <= 0) return;
      evictIfNeeded();
      cache2.set(key, { expires: Date.now() + ttlMs, data });
    },
    delete(key) {
      cache2.delete(key);
    },
    clear() {
      cache2.clear();
    }
  };
}

// plugins-pack/parcel/server.ts
var dynamic = "force-dynamic";
var DHL_URL = "https://www.dhl.de/int-verfolgen/data/search";
var HERMES_URL = "https://api.my-deliveries.de/tnt/parcelservice/parceldetails";
var FETCH_TIMEOUT_MS = 12e3;
var CACHE_TTL_MS = 10 * 60 * 1e3;
var NEG_CACHE_TTL_MS = 3 * 60 * 1e3;
var CACHE_MAX = 256;
var MIN_NUMBER_LEN = 6;
var MAX_NUMBER_LEN = 40;
var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "de-DE,de;q=0.9"
};
var cache = createPluginServerCache({ ttlMs: CACHE_TTL_MS, maxEntries: CACHE_MAX });
var negCache = createPluginServerCache({ ttlMs: NEG_CACHE_TTL_MS, maxEntries: CACHE_MAX });
var KNOWN_CARRIERS = ["dhl", "hermes", "dpd", "ups"];
var AUTO_ORDER = ["dhl", "hermes", "dpd", "ups"];
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function str(v) {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}
function sanitizeNumber(raw) {
  const stripped = raw.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9]+$/.test(stripped)) return null;
  if (stripped.length < MIN_NUMBER_LEN || stripped.length > MAX_NUMBER_LEN) return null;
  return stripped;
}
var DELIVERED_HINTS = [
  "zugestellt",
  "ausgeliefert",
  "abgeholt",
  "delivered",
  "picked up",
  "pick-up was successful"
];
var PROBLEM_HINTS = [
  "nicht zugestellt",
  "nicht angetroffen",
  "konnte nicht",
  "r\xFCcksendung",
  "retoure",
  "verz\xF6ger",
  "fehlgeschlagen",
  "problem",
  "filiale abgeholt werden",
  "abholung",
  "not delivered",
  "failed",
  "returned"
];
function matchesAny(text, hints) {
  const lower = text.toLowerCase();
  return hints.some((h) => lower.includes(h));
}
function deriveState(statusText, deliveredFlag) {
  if (deliveredFlag === true || matchesAny(statusText, DELIVERED_HINTS)) return "delivered";
  if (matchesAny(statusText, PROBLEM_HINTS)) return "problem";
  if (statusText) return "transit";
  return "unknown";
}
function lastOf(arr) {
  return arr.length > 0 ? arr[arr.length - 1] : void 0;
}
function emptyResult(carrier, number) {
  return { carrier, number, found: false, state: "unknown", status: "", events: [] };
}
async function fetchCarrier(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchWithSsrfGuard(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: ac.signal
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}
function parseDhl(number, json) {
  if (!isObj(json)) return emptyResult("dhl", number);
  const sendungen = asArray(json.sendungen).filter(isObj);
  if (sendungen.length === 0) return emptyResult("dhl", number);
  const active = sendungen.filter((s) => {
    const info = isObj(s.sendungsinfo) ? s.sendungsinfo : {};
    return str(info.sendungsliste).toUpperCase() !== "ARCHIVIERT";
  });
  const pool = active.length > 0 ? active : sendungen;
  const match = pool.find((s) => str(s.id) === number) ?? pool[0];
  const details = isObj(match.sendungsdetails) ? match.sendungsdetails : {};
  const verlauf = isObj(details.sendungsverlauf) ? details.sendungsverlauf : {};
  const events = asArray(verlauf.events).filter(isObj).map((e) => ({ date: str(e.datum), text: str(e.status), location: str(e.ort) || void 0 })).filter((e) => e.text || e.date);
  const kurz = str(verlauf.kurzStatus);
  const last = lastOf(events);
  const statusText = kurz || last?.text || "";
  const fortschritt = Number(verlauf.fortschritt);
  const maxRaw = Number(verlauf.maximalFortschritt);
  const maxFortschritt = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 5;
  const progress = Number.isFinite(fortschritt) && maxFortschritt > 0 ? Math.max(0, Math.min(1, fortschritt / maxFortschritt)) : void 0;
  const deliveredFlag = Number.isFinite(fortschritt) ? fortschritt >= maxFortschritt : void 0;
  const zustellung = isObj(details.zustellung) ? details.zustellung : {};
  const eta = str(zustellung.zustellzeitfenster) || str(zustellung.zustelldatum) || void 0;
  if (events.length === 0 && !kurz) return emptyResult("dhl", number);
  return {
    carrier: "dhl",
    number,
    found: true,
    state: deriveState(statusText, deliveredFlag),
    status: statusText,
    progress,
    eta,
    lastEvent: last,
    events
  };
}
async function trackDhl(number) {
  const url = `${DHL_URL}?${new URLSearchParams({
    piececode: number,
    noRedirect: "true",
    language: "de",
    cid: "app"
  }).toString()}`;
  const { status, json } = await fetchCarrier(url);
  if (status >= 500) throw new Error(`dhl_http_${status}`);
  return parseDhl(number, json);
}
function pickHistoryArray(root, statusObj) {
  const candidates = [
    statusObj.statusList,
    statusObj.history,
    statusObj.events,
    root.statusList,
    root.parcelHistory,
    root.history,
    root.events
  ];
  for (const c of candidates) {
    const arr = asArray(c);
    if (arr.length > 0) return arr;
  }
  return [];
}
function parseHermesEvent(raw) {
  if (!isObj(raw)) return null;
  const textObj = isObj(raw.text) ? raw.text : {};
  const text = str(raw.longText) || str(textObj.longText) || str(raw.statusText) || str(raw.description) || str(raw.status);
  const date = str(raw.dateTime) || str(raw.timestamp) || str(raw.date) || str(raw.eventDate);
  const location = str(raw.location) || str(raw.city) || str(raw.place) || void 0;
  if (!text && !date) return null;
  return { date, text, location };
}
function parseHermes(number, json) {
  if (!isObj(json)) return emptyResult("hermes", number);
  const statusObj = isObj(json.status) ? json.status : null;
  if (!statusObj) return emptyResult("hermes", number);
  const textObj = isObj(statusObj.text) ? statusObj.text : {};
  const statusText = str(textObj.longText) || str(textObj.shortText) || str(statusObj.parcelStatus);
  if (!statusText) return emptyResult("hermes", number);
  const forecast = isObj(json.forecast) ? json.forecast : {};
  const eta = str(forecast.deliveryDate) || void 0;
  const events = pickHistoryArray(json, statusObj).map(parseHermesEvent).filter((e) => e !== null);
  const last = lastOf(events);
  return {
    carrier: "hermes",
    number,
    found: true,
    state: deriveState(statusText),
    status: statusText,
    eta,
    lastEvent: last ?? { date: "", text: statusText },
    events: events.length > 0 ? events : [{ date: "", text: statusText }]
  };
}
async function trackHermes(number) {
  const url = `${HERMES_URL}/${encodeURIComponent(number)}`;
  const { status, json } = await fetchCarrier(url);
  if (status === 404) return emptyResult("hermes", number);
  if (status >= 500) throw new Error(`hermes_http_${status}`);
  return parseHermes(number, json);
}
var DPD_ENTRY_URL = "https://my.dpd.de/redirect.aspx?action=12&parcelno=";
var DPD_PAGE_HOST = "https://my.dpd.de/";
var DPD_MILESTONES = [
  "labStatusStart",
  "labStatusOnTheRoad",
  "labStatusDeliveryDepot",
  "labStatusCarLoad",
  "labStatusDelivered"
];
var DPD_HTML_HEADERS = {
  "User-Agent": BROWSER_HEADERS["User-Agent"],
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9"
};
function collectCookies(res, jar) {
  const h = res.headers;
  const lines = typeof h.getSetCookie === "function" ? h.getSetCookie() : [res.headers.get("set-cookie") ?? ""];
  for (const line of lines) {
    const m = line.match(/^\s*([^=;]+)=([^;]*)/);
    if (m) jar.set(m[1].trim(), m[2]);
  }
}
function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
async function fetchDpdPage(number, signal) {
  const jar = /* @__PURE__ */ new Map();
  let url = `${DPD_ENTRY_URL}${encodeURIComponent(number)}`;
  let referer = DPD_PAGE_HOST;
  for (let hop = 0; hop < 6; hop++) {
    await assertSafeOutboundUrlResolved(url);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...DPD_HTML_HEADERS,
        Referer: referer,
        ...jar.size ? { Cookie: cookieHeader(jar) } : {}
      },
      redirect: "manual",
      cache: "no-store",
      signal
    });
    collectCookies(res, jar);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return "";
      referer = url;
      url = new URL(loc, url).href;
      continue;
    }
    if (res.status !== 200) throw new Error(`dpd_http_${res.status}`);
    return res.text();
  }
  throw new Error("dpd_too_many_redirects");
}
function dpdSpanText(html, idTail) {
  const m = html.match(new RegExp(`id="[^"]*${idTail}"[^>]*>([\\s\\S]*?)</span>`, "i"));
  if (!m) return "";
  return m[1].replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}
function parseDpdPage(number, html) {
  const reached = [];
  for (const id of DPD_MILESTONES) {
    const label = dpdSpanText(html, id);
    const date = dpdSpanText(html, `${id}Date`);
    if (label && date) reached.push({ date, text: label });
  }
  if (reached.length === 0) return emptyResult("dpd", number);
  const last = lastOf(reached);
  const delivered = Boolean(dpdSpanText(html, "labStatusDeliveredDate"));
  const statusText = last?.text || "";
  return {
    carrier: "dpd",
    number,
    found: true,
    state: deriveState(statusText, delivered),
    status: statusText,
    progress: Math.max(0, Math.min(1, reached.length / DPD_MILESTONES.length)),
    lastEvent: last,
    events: reached
  };
}
async function trackDpd(number) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const html = await fetchDpdPage(number, ac.signal);
    return parseDpdPage(number, html);
  } finally {
    clearTimeout(timer);
  }
}
var UPS_OAUTH_URL = "https://onlinetools.ups.com/security/v1/oauth/token";
var UPS_TRACK_URL = "https://onlinetools.ups.com/api/track/v1/details";
var UPS_TOKEN_SKEW_MS = 6e4;
var upsTokens = /* @__PURE__ */ new Map();
var upsTransSeq = 0;
async function getUpsToken(creds, signal) {
  const cached = upsTokens.get(creds.id);
  if (cached && cached.expiresAt - UPS_TOKEN_SKEW_MS > Date.now()) return cached.token;
  const basic = Buffer.from(`${creds.id}:${creds.secret}`, "utf8").toString("base64");
  const res = await fetchWithSsrfGuard(UPS_OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal
  });
  const text = await res.text();
  if (res.status === 400 || res.status === 401) throw new Error("ups_auth_failed");
  if (!res.ok) throw new Error(`ups_http_${res.status}`);
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  const token = isObj(json) ? str(json.access_token) : "";
  if (!token) throw new Error("ups_auth_failed");
  const expiresIn = isObj(json) ? Number(json.expires_in) : NaN;
  const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1e3 : 36e5;
  upsTokens.set(creds.id, { token, expiresAt: Date.now() + ttl });
  return token;
}
function upsDateTime(date, time) {
  const d = str(date);
  const t = str(time);
  if (!/^\d{8}$/.test(d)) return [d, t].filter(Boolean).join(" ");
  const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return /^\d{6}$/.test(t) ? `${iso}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}` : iso;
}
function upsLocation(loc) {
  if (!isObj(loc)) return void 0;
  const addr = isObj(loc.address) ? loc.address : {};
  const parts = [str(addr.city), str(addr.stateProvince) || str(addr.countryCode)].filter(Boolean);
  return parts.join(", ") || void 0;
}
function parseUps(number, json) {
  if (!isObj(json)) return emptyResult("ups", number);
  const tr = isObj(json.trackResponse) ? json.trackResponse : {};
  const shipment = asArray(tr.shipment).filter(isObj)[0];
  const pkg = shipment ? asArray(shipment.package).filter(isObj)[0] : void 0;
  if (!pkg) return emptyResult("ups", number);
  const events = asArray(pkg.activity).filter(isObj).map((a) => {
    const status = isObj(a.status) ? a.status : {};
    return { date: upsDateTime(a.date, a.time), text: str(status.description), location: upsLocation(a.location) };
  }).filter((e) => e.text || e.date);
  const current = isObj(pkg.currentStatus) ? pkg.currentStatus : {};
  const statusText = str(current.description) || events[0]?.text || "";
  if (!statusText && events.length === 0) return emptyResult("ups", number);
  const deliveredFlag = str(current.code) === "011" ? true : void 0;
  const eta = asArray(pkg.deliveryDate).filter(isObj).filter((d) => str(d.type) !== "DEL").map((d) => upsDateTime(d.date, "")).find(Boolean);
  return {
    carrier: "ups",
    number,
    found: true,
    state: deriveState(statusText, deliveredFlag),
    status: statusText,
    eta,
    lastEvent: events[0],
    events
  };
}
async function trackUps(number, creds) {
  if (!creds || !creds.id || !creds.secret) throw new Error("ups_no_credentials");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const token = await getUpsToken(creds, ac.signal);
    const url = `${UPS_TRACK_URL}/${encodeURIComponent(number)}?locale=de_DE&returnSignature=false`;
    const res = await fetchWithSsrfGuard(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        transId: `sd${Date.now()}${upsTransSeq++ % 1e3}`,
        transactionSrc: "selfdashboard"
      },
      cache: "no-store",
      signal: ac.signal
    });
    if (res.status === 401) {
      upsTokens.delete(creds.id);
      throw new Error("ups_auth_failed");
    }
    if (res.status === 404) return emptyResult("ups", number);
    const text = await res.text();
    if (!res.ok) throw new Error(`ups_http_${res.status}`);
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return parseUps(number, json);
  } finally {
    clearTimeout(timer);
  }
}
function trackOne(carrier, number, ups) {
  switch (carrier) {
    case "dhl":
      return trackDhl(number);
    case "hermes":
      return trackHermes(number);
    case "dpd":
      return trackDpd(number);
    case "ups":
      return trackUps(number, ups);
  }
}
async function trackAuto(number, ups) {
  let lastResult = null;
  let lastError = null;
  for (const carrier of AUTO_ORDER) {
    if (carrier === "ups" && !ups) continue;
    try {
      const result = await trackOne(carrier, number, ups);
      if (result.found) return result;
      lastResult = result;
    } catch (e) {
      lastError = e;
    }
  }
  if (!lastResult && lastError) {
    throw lastError instanceof Error ? lastError : new Error("all_carriers_failed");
  }
  return lastResult ?? emptyResult("dhl", number);
}
async function track(carrier, number, ups) {
  const key = `${carrier}:${number}`;
  const cached = cache.get(key) ?? negCache.get(key);
  if (cached) return cached;
  const result = carrier === "auto" ? await trackAuto(number, ups) : await trackOne(carrier, number, ups);
  if (result.found) cache.set(key, result);
  else negCache.set(key, result);
  return result;
}
function isSupportedCarrier(c) {
  return c === "auto" || KNOWN_CARRIERS.includes(c);
}
async function handleParcelRequest(req, path) {
  if (req.method !== "GET") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  const action = path[0]?.trim() || new URL(req.url).searchParams.get("action") || "track";
  if (action !== "track") {
    return Response.json({ error: "invalid_action" }, { status: 400 });
  }
  const sp = new URL(req.url).searchParams;
  const carrier = (sp.get("carrier") || "auto").trim().toLowerCase();
  const number = sanitizeNumber(sp.get("number") || "");
  const upsId = (req.headers.get("x-ups-client-id") || "").trim();
  const upsSecret = (req.headers.get("x-ups-client-secret") || "").trim();
  const ups = upsId && upsSecret ? { id: upsId, secret: upsSecret } : null;
  if (carrier === "gls") {
    return Response.json(
      {
        error: "gls_unsupported",
        hint: "GLS hat seine kostenlose Sendungsverfolgung 2024/25 abgeschaltet (Login/API-Key erforderlich)."
      },
      { status: 400 }
    );
  }
  if (!isSupportedCarrier(carrier)) {
    return Response.json({ error: "unsupported_carrier" }, { status: 400 });
  }
  if (!number) {
    return Response.json({ error: "invalid_number" }, { status: 400 });
  }
  try {
    const result = await track(carrier, number, ups);
    return Response.json(result);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("parcel", `track:${carrier}`, `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url" }, { status: 400 });
    }
    const aborted = e instanceof Error && e.name === "AbortError";
    const msg = e instanceof Error ? e.message : String(e);
    void logPluginApiFailure("parcel", `track:${carrier}`, aborted ? "timeout" : msg);
    if (!aborted && msg.startsWith("ups_")) {
      const code = msg === "ups_no_credentials" || msg === "ups_auth_failed" ? msg : "ups_error";
      return Response.json(
        { error: code, carrier, hint: "UPS: Client ID/Secret in den Einstellungen pr\xFCfen." },
        { status: code === "ups_auth_failed" ? 401 : 502 }
      );
    }
    if (carrier === "dpd" && !aborted) {
      return Response.json(
        {
          error: "dpd_blocked",
          carrier,
          hint: "DPD-Status gerade nicht abrufbar. Bitte direkt bei DPD verfolgen."
        },
        { status: 502 }
      );
    }
    return Response.json(
      {
        error: aborted ? "timeout" : "fetch_failed",
        carrier,
        hint: "Server braucht ausgehenden HTTPS-Zugriff auf die Carrier (dhl.de, my-deliveries.de, dpd.de)."
      },
      { status: aborted ? 504 : 502 }
    );
  }
}
function parcelServerHandler(ctx) {
  return handleParcelRequest(ctx.request, ctx.path);
}
export {
  parcelServerHandler as default,
  dynamic,
  handleParcelRequest
};
