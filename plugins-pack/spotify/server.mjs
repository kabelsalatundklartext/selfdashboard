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
function sealSecret(plaintext) {
  if (!plaintext) return "";
  const key = loadOrCreateKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
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

// plugins-pack/spotify/server.ts
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { join as join3 } from "node:path";
import { randomBytes as randomBytes2, createHash } from "node:crypto";
var dynamic = "force-dynamic";
var AUTH_URL = "https://accounts.spotify.com/authorize";
var TOKEN_URL = "https://accounts.spotify.com/api/token";
var API = "https://api.spotify.com/v1";
var SCOPES = "user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private playlist-read-collaborative";
var FETCH_TIMEOUT_MS = 12e3;
var TOKEN_SKEW_MS = 3e4;
function storeDir() {
  return join3(dataDir(), "spotify");
}
function storeKey(clientId) {
  return createHash("sha256").update(clientId.trim()).digest("hex").slice(0, 24);
}
function storePath(key) {
  return join3(storeDir(), `${key}.json`);
}
async function readStore(key) {
  try {
    const raw = await readFile(storePath(key), "utf8");
    const j = JSON.parse(raw);
    return j && typeof j === "object" && typeof j.clientId === "string" ? j : null;
  } catch {
    return null;
  }
}
async function writeStore(key, data) {
  await mkdir(storeDir(), { recursive: true });
  const path = storePath(key);
  const tmp = `${path}.tmp`;
  data.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await writeFile(tmp, `${JSON.stringify(data)}
`, "utf8");
  await rename(tmp, path);
}
async function deleteStore(key) {
  try {
    await unlink(storePath(key));
  } catch {
  }
}
function basicAuth(clientId, clientSecret) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}
async function tokenRequest(clientId, clientSecret, form, signal) {
  const res = await fetchWithSsrfGuard(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: new URLSearchParams(form).toString(),
    cache: "no-store",
    signal
  });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  return { ok: res.ok, status: res.status, body };
}
async function ensureAccessToken(key, record, signal) {
  const cached = record.accessToken ? openSealedSecret(record.accessToken) : "";
  if (cached && record.expiresAt && record.expiresAt - TOKEN_SKEW_MS > Date.now()) {
    return cached;
  }
  const refresh = record.refreshToken ? openSealedSecret(record.refreshToken) : "";
  if (!refresh) throw new Error("not_connected");
  const secret = openSealedSecret(record.clientSecret);
  if (!secret) throw new Error("secret_unreadable");
  const { ok, body } = await tokenRequest(
    record.clientId,
    secret,
    { grant_type: "refresh_token", refresh_token: refresh },
    signal
  );
  if (!ok || !body.access_token) {
    if (body.error === "invalid_grant") throw new Error("reauth_required");
    throw new Error("refresh_failed");
  }
  record.accessToken = sealSecret(body.access_token);
  record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1e3;
  if (body.refresh_token) record.refreshToken = sealSecret(body.refresh_token);
  if (body.scope) record.scope = body.scope;
  await writeStore(key, record);
  return body.access_token;
}
async function spotifyApi(token, path, method, signal, body) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  if (body !== void 0) headers["Content-Type"] = "application/json";
  const res = await fetchWithSsrfGuard(`${API}${path}`, {
    method,
    headers,
    body: body !== void 0 ? JSON.stringify(body) : void 0,
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
  return { status: res.status, json, text };
}
function isObj(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function spotifyErrorDetail(json, text) {
  if (isObj(json) && isObj(json.error)) {
    const e = json.error;
    const msg = typeof e.message === "string" ? e.message : "";
    const reason = typeof e.reason === "string" ? e.reason : "";
    return [reason, msg].filter(Boolean).join(" \u2014 ") || text.slice(0, 200);
  }
  return text.slice(0, 200);
}
function pickImage(images) {
  if (!Array.isArray(images)) return void 0;
  const urls = images.filter(isObj).map((i) => typeof i.url === "string" ? i.url : "").filter(Boolean);
  return urls[Math.min(1, urls.length - 1)] || urls[0];
}
function normalizePlayer(json, product) {
  const premium = product === "premium";
  const base = { connected: true, playing: false, hasTrack: false, product, premium };
  if (!isObj(json)) return base;
  const item = isObj(json.item) ? json.item : null;
  const device = isObj(json.device) ? json.device : null;
  base.playing = json.is_playing === true;
  base.progressMs = typeof json.progress_ms === "number" ? json.progress_ms : void 0;
  base.shuffle = json.shuffle_state === true;
  base.repeat = typeof json.repeat_state === "string" ? json.repeat_state : void 0;
  if (device && typeof device.name === "string") base.deviceName = device.name;
  if (item) {
    base.hasTrack = true;
    if (typeof item.name === "string") base.title = item.name;
    if (typeof item.duration_ms === "number") base.durationMs = item.duration_ms;
    const artists = Array.isArray(item.artists) ? item.artists : [];
    base.artist = artists.filter(isObj).map((a) => typeof a.name === "string" ? a.name : "").filter(Boolean).join(", ");
    const album = isObj(item.album) ? item.album : null;
    if (album) {
      if (typeof album.name === "string") base.album = album.name;
      base.imageUrl = pickImage(album.images);
    }
    const urls = isObj(item.external_urls) ? item.external_urls : null;
    if (urls && typeof urls.spotify === "string") base.trackUrl = urls.spotify;
  }
  return base;
}
var MAX_SEEK_MS = 24 * 60 * 60 * 1e3;
var MAX_QUERY_LEN = 120;
var SEARCH_LIMIT = 8;
function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}
async function handleBegin(body) {
  const clientId = String(body.clientId ?? "").trim();
  const secret = openSealedSecret(String(body.clientSecret ?? "").trim());
  const redirectUri = String(body.redirectUri ?? "").trim();
  if (!clientId || !secret) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!/^https?:\/\//i.test(redirectUri)) return jsonResponse({ error: "invalid_redirect" }, 400);
  const key = storeKey(clientId);
  const state = `${key}.${randomBytes2(16).toString("hex")}`;
  await writeStore(key, {
    clientId,
    clientSecret: sealSecret(secret),
    pendingState: state,
    redirectUri,
    updatedAt: ""
  });
  const authUrl = `${AUTH_URL}?${new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    show_dialog: "true"
  }).toString()}`;
  return jsonResponse({ authUrl });
}
async function handleStatus(body) {
  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) return jsonResponse({ connected: false });
  const record = await readStore(storeKey(clientId));
  return jsonResponse({
    connected: Boolean(record?.refreshToken),
    displayName: record?.displayName,
    product: record?.product,
    scope: record?.scope
  });
}
async function handleDisconnect(body) {
  const clientId = String(body.clientId ?? "").trim();
  if (clientId) await deleteStore(storeKey(clientId));
  return jsonResponse({ ok: true });
}
async function handleState(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) return jsonResponse({ connected: false });
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ connected: false });
  const token = await ensureAccessToken(key, record, signal);
  const player = await spotifyApi(token, "/me/player?additional_types=track,episode", "GET", signal);
  if (player.status === 401) throw new Error("reauth_required");
  if (player.status !== 204 && player.status >= 400) {
    const detail = spotifyErrorDetail(player.json, player.text);
    void logPluginApiFailure("spotify", "state", "api_error", { status: player.status, detail });
    return jsonResponse({ error: "api_error", status: player.status, detail }, 502);
  }
  if (player.status !== 204 && isObj(player.json) && player.json.item != null) {
    return jsonResponse(normalizePlayer(player.json, record.product));
  }
  const cur = await spotifyApi(token, "/me/player/currently-playing?additional_types=track,episode", "GET", signal);
  if (cur.status === 401) throw new Error("reauth_required");
  if (cur.status !== 204 && isObj(cur.json) && cur.json.item != null) {
    return jsonResponse(normalizePlayer(cur.json, record.product));
  }
  return jsonResponse({
    connected: true,
    playing: false,
    hasTrack: false,
    premium: record.product === "premium",
    product: record.product
  });
}
var CONTROL_ROUTES = {
  play: { method: "PUT", path: "/me/player/play" },
  pause: { method: "PUT", path: "/me/player/pause" },
  next: { method: "POST", path: "/me/player/next" },
  previous: { method: "POST", path: "/me/player/previous" }
};
async function handleControl(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  const command = String(body.command ?? "").trim();
  const route = CONTROL_ROUTES[command];
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!route) return jsonResponse({ error: "invalid_command" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 400);
  const token = await ensureAccessToken(key, record, signal);
  const res = await spotifyApi(token, route.path, route.method, signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status === 403) return jsonResponse({ error: "forbidden", detail: "premium_required" }, 403);
  if (res.status === 404) return jsonResponse({ error: "no_active_device" }, 404);
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "control", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ ok: true });
}
async function handleSeek(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  const positionMs = Number(body.positionMs);
  const deviceId = String(body.deviceId ?? "").trim();
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!Number.isFinite(positionMs) || positionMs < 0 || positionMs > MAX_SEEK_MS) {
    return jsonResponse({ error: "invalid_position" }, 400);
  }
  if (deviceId && !isDeviceId(deviceId)) return jsonResponse({ error: "invalid_device" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const pos = Math.floor(positionMs);
  const path = `/me/player/seek?position_ms=${pos}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ""}`;
  const res = await spotifyApi(token, path, "PUT", signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status === 403) return jsonResponse({ error: "forbidden", detail: "premium_required" }, 403);
  if (res.status === 404) return jsonResponse({ error: "no_active_device" }, 404);
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "seek", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ ok: true });
}
function normalizeTrack(item) {
  if (!isObj(item) || typeof item.uri !== "string" || typeof item.name !== "string") return null;
  const artists = Array.isArray(item.artists) ? item.artists : [];
  const subtitle = artists.filter(isObj).map((a) => typeof a.name === "string" ? a.name : "").filter(Boolean).join(", ");
  const album = isObj(item.album) ? item.album : null;
  return {
    kind: "track",
    uri: item.uri,
    title: item.name,
    subtitle,
    imageUrl: album ? pickImage(album.images) : void 0
  };
}
function normalizePlaylist(item) {
  if (!isObj(item) || typeof item.uri !== "string" || typeof item.name !== "string") return null;
  const owner = isObj(item.owner) ? item.owner : null;
  const ownerName = owner && typeof owner.display_name === "string" ? owner.display_name : "";
  const total = isObj(item.tracks) && typeof item.tracks.total === "number" ? item.tracks.total : void 0;
  const parts = [ownerName, total != null ? `${total} Tracks` : ""].filter(Boolean);
  return {
    kind: "playlist",
    uri: item.uri,
    title: item.name,
    subtitle: parts.join(" \xB7 ") || "Playlist",
    imageUrl: pickImage(item.images)
  };
}
function normalizeSearch(json) {
  if (!isObj(json)) return [];
  const out = [];
  const tracks = isObj(json.tracks) && Array.isArray(json.tracks.items) ? json.tracks.items : [];
  const playlists = isObj(json.playlists) && Array.isArray(json.playlists.items) ? json.playlists.items : [];
  for (const t of tracks) {
    const r = normalizeTrack(t);
    if (r) out.push(r);
  }
  for (const p of playlists) {
    const r = normalizePlaylist(p);
    if (r) out.push(r);
  }
  return out;
}
async function handleSearch(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  const query = String(body.query ?? "").trim().slice(0, MAX_QUERY_LEN);
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!query) return jsonResponse({ results: [] });
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const qs = new URLSearchParams({
    q: query,
    type: "track,playlist",
    limit: String(SEARCH_LIMIT)
  }).toString();
  const res = await spotifyApi(token, `/search?${qs}`, "GET", signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "search", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ results: normalizeSearch(res.json) });
}
var MY_PLAYLISTS_LIMIT = 30;
async function handleMyPlaylists(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const res = await spotifyApi(token, `/me/playlists?limit=${MY_PLAYLISTS_LIMIT}`, "GET", signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "my-playlists", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  const items = isObj(res.json) && Array.isArray(res.json.items) ? res.json.items : [];
  const results = [];
  for (const p of items) {
    const r = normalizePlaylist(p);
    if (r) results.push(r);
  }
  return jsonResponse({ results });
}
function isSpotifyUri(uri, kind) {
  if (kind === "track") return /^spotify:track:[A-Za-z0-9]+$/.test(uri);
  if (kind === "playlist") return /^spotify:playlist:[A-Za-z0-9]+$/.test(uri);
  return false;
}
function isDeviceId(id) {
  return /^[A-Za-z0-9]{1,128}$/.test(id);
}
async function handlePlayUri(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  const uri = String(body.uri ?? "").trim();
  const kind = String(body.kind ?? "").trim();
  const deviceId = String(body.deviceId ?? "").trim();
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!isSpotifyUri(uri, kind)) return jsonResponse({ error: "invalid_uri" }, 400);
  if (deviceId && !isDeviceId(deviceId)) return jsonResponse({ error: "invalid_device" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const payload = kind === "playlist" ? { context_uri: uri } : { uris: [uri] };
  const path = deviceId ? `/me/player/play?device_id=${encodeURIComponent(deviceId)}` : "/me/player/play";
  const res = await spotifyApi(token, path, "PUT", signal, payload);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status === 403) return jsonResponse({ error: "forbidden", detail: "premium_required" }, 403);
  if (res.status === 404) return jsonResponse({ error: "no_active_device" }, 404);
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "play-uri", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ ok: true });
}
function normalizeDevices(json) {
  if (!isObj(json) || !Array.isArray(json.devices)) return [];
  const out = [];
  for (const d of json.devices) {
    if (!isObj(d) || typeof d.id !== "string" || typeof d.name !== "string") continue;
    out.push({
      id: d.id,
      name: d.name,
      type: typeof d.type === "string" ? d.type : "",
      isActive: d.is_active === true,
      isRestricted: d.is_restricted === true,
      volumePercent: typeof d.volume_percent === "number" ? d.volume_percent : void 0
    });
  }
  return out;
}
async function handleDevices(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const res = await spotifyApi(token, "/me/player/devices", "GET", signal);
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "devices", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ devices: normalizeDevices(res.json) });
}
async function handleTransfer(body, signal) {
  const clientId = String(body.clientId ?? "").trim();
  const deviceId = String(body.deviceId ?? "").trim();
  if (!clientId) return jsonResponse({ error: "missing_credentials" }, 400);
  if (!isDeviceId(deviceId)) return jsonResponse({ error: "invalid_device" }, 400);
  const key = storeKey(clientId);
  const record = await readStore(key);
  if (!record?.refreshToken) return jsonResponse({ error: "not_connected" }, 401);
  const token = await ensureAccessToken(key, record, signal);
  const res = await spotifyApi(token, "/me/player", "PUT", signal, { device_ids: [deviceId] });
  if (res.status === 401) throw new Error("reauth_required");
  if (res.status === 403) return jsonResponse({ error: "forbidden", detail: "premium_required" }, 403);
  if (res.status === 404) return jsonResponse({ error: "no_active_device" }, 404);
  if (res.status >= 400) {
    const detail = spotifyErrorDetail(res.json, res.text);
    void logPluginApiFailure("spotify", "transfer", "api_error", { status: res.status, detail });
    return jsonResponse({ error: "api_error", status: res.status, detail }, 502);
  }
  return jsonResponse({ ok: true });
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  const action = String(body.action ?? "state");
  try {
    switch (action) {
      case "begin":
        return await handleBegin(body);
      case "status":
        return await handleStatus(body);
      case "disconnect":
        return await handleDisconnect(body);
      case "control":
        return await handleControl(body, ac.signal);
      case "seek":
        return await handleSeek(body, ac.signal);
      case "search":
        return await handleSearch(body, ac.signal);
      case "my-playlists":
        return await handleMyPlaylists(body, ac.signal);
      case "play-uri":
        return await handlePlayUri(body, ac.signal);
      case "devices":
        return await handleDevices(body, ac.signal);
      case "transfer":
        return await handleTransfer(body, ac.signal);
      case "state":
      case "now-playing":
        return await handleState(body, ac.signal);
      default:
        return jsonResponse({ error: "invalid_action" }, 400);
    }
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("spotify", action, `blocked_url:${e.message}`);
      return jsonResponse({ error: "blocked_url", detail: e.message }, 400);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "reauth_required" || msg === "refresh_failed" || msg === "not_connected" || msg === "secret_unreadable") {
      void logPluginApiFailure("spotify", action, msg);
      return jsonResponse({ error: msg }, 401);
    }
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("spotify", action, aborted ? "timeout" : msg);
    return jsonResponse({ error: aborted ? "timeout" : "fetch_failed", detail: msg }, aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function htmlPage(title, message, ok) {
  const color = ok ? "#1db954" : "#ef4444";
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;max-width:420px;padding:32px">
<div style="font-size:48px;margin-bottom:16px">${ok ? "\u2705" : "\u26A0\uFE0F"}</div>
<h1 style="font-size:20px;margin:0 0 8px;color:${color}">${esc(title)}</h1>
<p style="font-size:14px;line-height:1.5;color:#b3b3b3;margin:0">${esc(message)}</p>
</div>
<script>setTimeout(function(){try{window.close()}catch(e){}},${ok ? 1500 : 4e3})</script>
</body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
async function handleCallback(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return htmlPage("Verbindung abgebrochen", `Spotify meldete: ${oauthError}. Du kannst das Fenster schlie\xDFen.`, false);
  }
  if (!code || !state || !state.includes(".")) {
    return htmlPage("Ung\xFCltige Antwort", "Es fehlen Parameter (code/state). Bitte erneut verbinden.", false);
  }
  const key = state.split(".", 1)[0] ?? "";
  const record = await readStore(key);
  if (!record || record.pendingState !== state || !record.redirectUri) {
    void logPluginApiFailure("spotify", "callback", "state_mismatch");
    return htmlPage("Sicherheitspr\xFCfung fehlgeschlagen", "Der State stimmt nicht \xFCberein. Bitte starte die Verbindung neu.", false);
  }
  const secret = openSealedSecret(record.clientSecret);
  if (!secret) return htmlPage("Fehler", "Client Secret konnte nicht gelesen werden.", false);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const { ok, body } = await tokenRequest(
      record.clientId,
      secret,
      { grant_type: "authorization_code", code, redirect_uri: record.redirectUri },
      ac.signal
    );
    if (!ok || !body.access_token || !body.refresh_token) {
      void logPluginApiFailure("spotify", "callback", body.error || "token_exchange_failed", {
        detail: body.error_description
      });
      return htmlPage(
        "Token-Austausch fehlgeschlagen",
        `${body.error_description || body.error || "Unbekannter Fehler"}. Redirect-URI in der Spotify-App pr\xFCfen.`,
        false
      );
    }
    record.refreshToken = sealSecret(body.refresh_token);
    record.accessToken = sealSecret(body.access_token);
    record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1e3;
    record.scope = body.scope;
    record.pendingState = void 0;
    try {
      const me = await spotifyApi(body.access_token, "/me", "GET", ac.signal);
      if (isObj(me.json)) {
        if (typeof me.json.display_name === "string") record.displayName = me.json.display_name;
        if (typeof me.json.product === "string") record.product = me.json.product;
      }
    } catch {
    }
    await writeStore(key, record);
    const who = record.displayName ? ` als ${record.displayName}` : "";
    return htmlPage("Spotify verbunden", `Erfolgreich verbunden${who}. Dieses Fenster schlie\xDFt sich automatisch.`, true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    void logPluginApiFailure("spotify", "callback", msg);
    return htmlPage("Verbindung fehlgeschlagen", "Spotify war nicht erreichbar. Bitte erneut versuchen.", false);
  } finally {
    clearTimeout(timer);
  }
}
function spotifyServerHandler(ctx) {
  if (ctx.path[0] === "callback") return handleCallback(ctx.request);
  if (ctx.request.method !== "POST") {
    return Promise.resolve(jsonResponse({ error: "method_not_allowed" }, 405));
  }
  return handlePost(ctx.request);
}
export {
  spotifyServerHandler as default,
  dynamic
};
