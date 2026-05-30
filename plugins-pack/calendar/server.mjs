// plugins-pack/_shared/auth-lite.ts
import { mkdirSync } from "fs";
import { join as join2 } from "path";
import Database from "better-sqlite3";

// plugins-pack/_shared/data-dir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// plugins-pack/_shared/auth-lite.ts
var db = null;
function authDbPath() {
  return join2(dataDir(), "auth", "auth.db");
}
function getAuthDb() {
  if (db) return db;
  const dir = join2(dataDir(), "auth");
  mkdirSync(dir, { recursive: true });
  db = new Database(authDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at
  };
}
function isAuthDisabled() {
  if (process.env.NODE_ENV === "production") return false;
  const v = process.env.SELFDASHBOARD_AUTH_DISABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
function listUsers() {
  const rows = getAuthDb().prepare("SELECT * FROM users ORDER BY username COLLATE NOCASE").all();
  return rows.map(rowToUser);
}
function getAllowedPluginIds(userId, role) {
  if (isAuthDisabled() || role === "admin") return null;
  const rows = getAuthDb().prepare("SELECT plugin_id FROM user_allowed_plugins WHERE user_id = ? ORDER BY plugin_id").all(userId);
  return rows.map((r) => r.plugin_id);
}
function isPluginAllowed(userId, role, pluginId) {
  if (isAuthDisabled() || role === "admin") return true;
  const allowed = getAllowedPluginIds(userId, role);
  if (!allowed) return true;
  return allowed.includes(pluginId);
}

// plugins-pack/calendar/lib/store.ts
import {
  existsSync,
  mkdirSync as mkdirSync2,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { join as join3 } from "node:path";

// plugins-pack/calendar/lib/types.ts
var STORE_VERSION = 1;
var EMPTY_STORE = {
  version: STORE_VERSION,
  accounts: [],
  calendars: [],
  events: [],
  syncLog: []
};

// plugins-pack/calendar/lib/store.ts
var LEGACY_OWNER_ID = "__legacy__";
function resolveAppDataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join3(process.cwd(), "data");
}
var DEFAULT_ROOT = process.env.CALENDAR_DATA_DIR || join3(resolveAppDataDir(), "calendar");
function usersDataDir() {
  return join3(resolveAppDataDir(), "users");
}
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync2(dir, { recursive: true });
}
function legacyStorePath() {
  ensureDir(DEFAULT_ROOT);
  return join3(DEFAULT_ROOT, "store.json");
}
function userStorePath(userId) {
  return join3(usersDataDir(), userId, "calendar", "store.json");
}
function legacyStoreExists() {
  return existsSync(legacyStorePath());
}
var chain = Promise.resolve();
function withLock(fn) {
  const next = chain.then(fn);
  chain = next.catch(() => void 0);
  return next;
}
function readSyncFromPath(path) {
  if (!existsSync(path)) return structuredClone(EMPTY_STORE);
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: parsed.accounts ?? [],
      calendars: parsed.calendars ?? [],
      events: parsed.events ?? [],
      syncLog: parsed.syncLog ?? []
    };
  } catch {
    try {
      renameSync(path, path + ".corrupt-" + Date.now());
    } catch {
    }
    return structuredClone(EMPTY_STORE);
  }
}
function writeSyncToPath(path, store) {
  ensureDir(join3(path, ".."));
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, path);
}
function listCalendarOwnerUserIds() {
  const root = usersDataDir();
  if (!existsSync(root)) return [];
  const ids = [];
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (existsSync(userStorePath(ent.name))) ids.push(ent.name);
  }
  return ids;
}
async function readLegacyStore() {
  return withLock(() => structuredClone(readSyncFromPath(legacyStorePath())));
}
async function readUserStore(userId) {
  return withLock(() => structuredClone(readSyncFromPath(userStorePath(userId))));
}
async function mutateUserStore(userId, fn) {
  return withLock(async () => {
    const path = userStorePath(userId);
    const store = readSyncFromPath(path);
    const result = await fn(store);
    writeSyncToPath(path, store);
    return result;
  });
}
async function mutateLegacyStore(fn) {
  return withLock(async () => {
    const path = legacyStorePath();
    const store = readSyncFromPath(path);
    const result = await fn(store);
    writeSyncToPath(path, store);
    return result;
  });
}
async function readOwnerStore(ownerUserId) {
  if (ownerUserId === LEGACY_OWNER_ID) return readLegacyStore();
  return readUserStore(ownerUserId);
}
async function mutateOwnerStore(ownerUserId, fn) {
  if (ownerUserId === LEGACY_OWNER_ID) return mutateLegacyStore(fn);
  return mutateUserStore(ownerUserId, fn);
}
async function migrateLegacyStoreToUser(adminUserId) {
  const legacyPath = legacyStorePath();
  if (!existsSync(legacyPath)) return false;
  const legacy = readSyncFromPath(legacyPath);
  if (legacy.accounts.length === 0 && legacy.calendars.length === 0 && legacy.events.length === 0) {
    try {
      renameSync(legacyPath, legacyPath + ".empty-" + Date.now());
    } catch {
    }
    return false;
  }
  await mutateUserStore(adminUserId, (target) => {
    for (const a of legacy.accounts) {
      a.ownerUserId = a.ownerUserId ?? adminUserId;
      a.sharing = a.sharing ?? "private";
      a.sharedWithUserIds = a.sharedWithUserIds ?? [];
    }
    target.accounts.push(...legacy.accounts);
    target.calendars.push(...legacy.calendars);
    target.events.push(...legacy.events);
    target.syncLog.unshift(...legacy.syncLog);
    target.syncLog = target.syncLog.slice(0, 50);
  });
  const backup = legacyPath + ".pre-user-migrated";
  try {
    renameSync(legacyPath, backup);
  } catch {
  }
  return true;
}
async function findAccountOwnerUserId(accountId) {
  if (legacyStoreExists()) {
    const legacy = await readLegacyStore();
    if (legacy.accounts.some((a) => a.id === accountId)) return LEGACY_OWNER_ID;
  }
  for (const userId of listCalendarOwnerUserIds()) {
    const store = await readUserStore(userId);
    if (store.accounts.some((a) => a.id === accountId)) return userId;
  }
  return null;
}
function newId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rand}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}

// plugins-pack/calendar/lib/access.ts
function normalizeAccount(account, ownerUserId) {
  return {
    ...account,
    ownerUserId: account.ownerUserId ?? ownerUserId,
    sharing: account.sharing ?? "private",
    sharedWithUserIds: account.sharedWithUserIds ?? [],
    sharedCalendarGrants: account.sharedCalendarGrants ?? []
  };
}
function canViewAccount(account, viewerUserId) {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID;
  if (owner === viewerUserId) return true;
  if (owner === LEGACY_OWNER_ID) return true;
  if (account.sharing !== "shared") return false;
  if (!(account.sharedWithUserIds ?? []).includes(viewerUserId)) return false;
  const grants = account.sharedCalendarGrants ?? [];
  if (grants.length === 0) return true;
  return grants.some((g) => g.userId === viewerUserId);
}
function canManageAccount(account, viewerUserId, viewerRole) {
  const owner = account.ownerUserId ?? LEGACY_OWNER_ID;
  if (owner === viewerUserId) return true;
  if (owner === LEGACY_OWNER_ID && viewerRole === "admin") return true;
  return false;
}
function resolveShareeCalendarAccess(account, calendarId, viewerUserId) {
  if (account.sharing !== "shared") return "none";
  if (!(account.sharedWithUserIds ?? []).includes(viewerUserId)) return "none";
  const grants = account.sharedCalendarGrants ?? [];
  if (grants.length === 0) return "read";
  const grant = grants.find((g) => g.calendarId === calendarId && g.userId === viewerUserId);
  return grant?.access ?? "none";
}
function mergeInto(target, source, ownerUserId, viewerUserId, viewerRole, permissions, calendarPermissions) {
  const accountById = new Map(source.accounts.map((a) => [a.id, normalizeAccount(a, ownerUserId)]));
  const accountIds = new Set(target.accounts.map((a) => a.id));
  for (const raw of source.accounts) {
    const account = normalizeAccount(raw, ownerUserId);
    if (!canViewAccount(account, viewerUserId)) continue;
    if (accountIds.has(account.id)) continue;
    accountIds.add(account.id);
    target.accounts.push(account);
    const owned = account.ownerUserId === viewerUserId;
    const manage = canManageAccount(account, viewerUserId, viewerRole);
    permissions.set(account.id, {
      ownerUserId: account.ownerUserId ?? ownerUserId,
      ownedByViewer: owned,
      canManage: manage
    });
  }
  const calendarIds = new Set(target.calendars.map((c) => c.id));
  for (const cal of source.calendars) {
    const account = accountById.get(cal.accountId);
    if (!account || !permissions.has(cal.accountId)) continue;
    const owned = canManageAccount(account, viewerUserId, viewerRole);
    if (!owned) {
      const shareAccess = resolveShareeCalendarAccess(account, cal.id, viewerUserId);
      if (shareAccess === "none") continue;
      if (calendarIds.has(cal.id)) continue;
      calendarIds.add(cal.id);
      const canEditEvents = shareAccess === "write" && !cal.readOnly;
      calendarPermissions.set(cal.id, {
        accountId: cal.accountId,
        ownerUserId: account.ownerUserId ?? ownerUserId,
        canEditEvents
      });
      const readOnly = cal.readOnly || shareAccess === "read";
      target.calendars.push(readOnly === cal.readOnly ? cal : { ...cal, readOnly });
      continue;
    }
    if (calendarIds.has(cal.id)) continue;
    calendarIds.add(cal.id);
    calendarPermissions.set(cal.id, {
      accountId: cal.accountId,
      ownerUserId: account.ownerUserId ?? ownerUserId,
      canEditEvents: !cal.readOnly
    });
    target.calendars.push(cal);
  }
  const visibleCalendarIds = new Set(target.calendars.map((c) => c.id));
  for (const ev of source.events) {
    if (!visibleCalendarIds.has(ev.calendarId)) continue;
    if (target.events.some((e) => e.id === ev.id)) continue;
    target.events.push(ev);
  }
}
async function ensureLegacyMigrated(viewerUserId, viewerRole) {
  if (!legacyStoreExists()) return;
  if (viewerRole === "admin") {
    await migrateLegacyStoreToUser(viewerUserId);
  }
}
async function readViewerStore(viewerUserId, viewerRole) {
  await ensureLegacyMigrated(viewerUserId, viewerRole);
  const store = {
    version: 1,
    accounts: [],
    calendars: [],
    events: [],
    syncLog: []
  };
  const permissions = /* @__PURE__ */ new Map();
  const calendarPermissions = /* @__PURE__ */ new Map();
  const own = await readUserStore(viewerUserId);
  mergeInto(store, own, viewerUserId, viewerUserId, viewerRole, permissions, calendarPermissions);
  if (legacyStoreExists()) {
    const legacy = await readLegacyStore();
    mergeInto(store, legacy, LEGACY_OWNER_ID, viewerUserId, viewerRole, permissions, calendarPermissions);
  }
  for (const ownerId of listCalendarOwnerUserIds()) {
    if (ownerId === viewerUserId) continue;
    const other = await readUserStore(ownerId);
    mergeInto(store, other, ownerId, viewerUserId, viewerRole, permissions, calendarPermissions);
  }
  return { store, permissions, calendarPermissions };
}
function applyCalendarReadOnlyForViewer(calendars, calendarPermissions) {
  return calendars.map((c) => {
    const perm = calendarPermissions.get(c.id);
    if (perm?.canEditEvents) return c;
    if (c.readOnly) return c;
    if (perm) return { ...c, readOnly: true };
    return c;
  });
}
function sanitizeSharedWith(sharing, ids, ownerUserId) {
  const mode = sharing === "shared" ? "shared" : "private";
  const unique = Array.from(
    new Set((ids ?? []).map((id) => id.trim()).filter((id) => id && id !== ownerUserId))
  );
  return {
    sharing: mode,
    sharedWithUserIds: mode === "shared" ? unique : []
  };
}
function sanitizeSharedCalendarGrants(sharing, sharedWithUserIds, grants, validCalendarIds, ownerUserId) {
  if (sharing !== "shared") return [];
  const allowedUsers = new Set(sharedWithUserIds.filter((id) => id && id !== ownerUserId));
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const raw of grants ?? []) {
    const calendarId = String(raw.calendarId ?? "").trim();
    const userId = String(raw.userId ?? "").trim();
    const access = raw.access === "write" ? "write" : "read";
    if (!calendarId || !userId || !validCalendarIds.has(calendarId)) continue;
    if (!allowedUsers.has(userId)) continue;
    const key = `${calendarId}:${userId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ calendarId, userId, access });
  }
  return out;
}
function calendarCanEditEvents(calendarId, calendarPermissions) {
  return calendarPermissions.get(calendarId)?.canEditEvents === true;
}

// plugins-pack/calendar/lib/crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync as existsSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2, chmodSync } from "node:fs";
import { join as join4 } from "node:path";
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
var KEY_LEN = 32;
var TAG_LEN = 16;
var cachedKey = null;
function resolveAppDataDir2() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join4(process.cwd(), "data");
}
function deriveKey(material) {
  return scryptSync(material, "selfdashboard.calendar.v1", KEY_LEN);
}
function loadOrCreateKey() {
  if (cachedKey) return cachedKey;
  const envKey = process.env.SELFDASHBOARD_CALENDAR_KEY?.trim();
  if (envKey) {
    cachedKey = deriveKey(envKey);
    return cachedKey;
  }
  const keyFile = join4(resolveAppDataDir2(), ".calendar-key");
  if (existsSync2(keyFile)) {
    cachedKey = deriveKey(readFileSync2(keyFile, "utf8").trim());
    return cachedKey;
  }
  const fresh = randomBytes(32).toString("base64");
  writeFileSync2(keyFile, fresh, "utf8");
  try {
    chmodSync(keyFile, 384);
  } catch {
  }
  cachedKey = deriveKey(fresh);
  return cachedKey;
}
function encrypt(plaintext) {
  if (!plaintext) return "";
  const key = loadOrCreateKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}
function decrypt(payload) {
  if (!payload) return "";
  const key = loadOrCreateKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("encrypted payload too short");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const enc = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// plugins-pack/calendar/lib/api-helpers.ts
function toAccountView(a, calendars, opts) {
  const cfg = a.config;
  let endpoint = "";
  try {
    endpoint = new URL(cfg.url).host;
  } catch {
    endpoint = cfg.url;
  }
  const sharing = a.sharing ?? "private";
  return {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    calendarCount: calendars.filter((c) => c.accountId === a.id).length,
    endpoint,
    url: cfg.url,
    username: cfg.username,
    sharing,
    sharedWithUserIds: a.sharedWithUserIds ?? [],
    sharedWithUsernames: opts?.sharedWithUsernames,
    sharedCalendarGrants: a.sharedCalendarGrants ?? [],
    ownerUserId: a.ownerUserId,
    ownerUsername: opts?.ownerUsername,
    ownedByMe: opts?.ownedByMe ?? true,
    canManage: opts?.canManage ?? true
  };
}
function buildAccount(body, ownerUserId, validCalendarIds = /* @__PURE__ */ new Set()) {
  const { sharing, sharedWithUserIds } = sanitizeSharedWith(
    body.sharing,
    body.sharedWithUserIds,
    ownerUserId
  );
  const sharedCalendarGrants = sanitizeSharedCalendarGrants(
    sharing,
    sharedWithUserIds,
    body.sharedCalendarGrants,
    validCalendarIds,
    ownerUserId
  );
  if (body.provider === "caldav") {
    if (!body.caldav) throw new Error("caldav config required");
    return {
      id: newId("acc"),
      name: body.name,
      provider: "caldav",
      enabled: true,
      createdAt: nowIso(),
      ownerUserId,
      sharing,
      sharedWithUserIds,
      sharedCalendarGrants,
      config: {
        url: body.caldav.url,
        username: body.caldav.username,
        passwordEncrypted: encrypt(body.caldav.password),
        verifySsl: body.caldav.verifySsl
      }
    };
  }
  if (body.provider === "ics") {
    if (!body.ics) throw new Error("ics config required");
    return {
      id: newId("acc"),
      name: body.name,
      provider: "ics",
      enabled: true,
      createdAt: nowIso(),
      ownerUserId,
      sharing,
      sharedWithUserIds,
      sharedCalendarGrants,
      config: {
        url: body.ics.url,
        username: body.ics.username,
        passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : ""
      }
    };
  }
  throw new Error(`unknown provider: ${body.provider}`);
}
function applyAccountUpdate(a, body, ownerUserId, validCalendarIds) {
  if (body.name !== void 0) a.name = body.name;
  if (body.enabled !== void 0) a.enabled = body.enabled;
  if (body.sharing !== void 0 || body.sharedWithUserIds !== void 0 || body.sharedCalendarGrants !== void 0) {
    const next = sanitizeSharedWith(
      body.sharing ?? a.sharing,
      body.sharedWithUserIds ?? a.sharedWithUserIds,
      ownerUserId
    );
    a.sharing = next.sharing;
    a.sharedWithUserIds = next.sharedWithUserIds;
    if (next.sharing !== "shared") {
      a.sharedCalendarGrants = [];
    } else if (body.sharedCalendarGrants !== void 0) {
      a.sharedCalendarGrants = sanitizeSharedCalendarGrants(
        next.sharing,
        next.sharedWithUserIds,
        body.sharedCalendarGrants,
        validCalendarIds,
        ownerUserId
      );
    } else {
      a.sharedCalendarGrants = sanitizeSharedCalendarGrants(
        next.sharing,
        next.sharedWithUserIds,
        a.sharedCalendarGrants,
        validCalendarIds,
        ownerUserId
      );
    }
  }
  if (a.provider === "caldav" && body.caldav) {
    const cfg = a.config;
    a.config = {
      url: body.caldav.url ?? cfg.url,
      username: body.caldav.username ?? cfg.username,
      passwordEncrypted: body.caldav.password ? encrypt(body.caldav.password) : cfg.passwordEncrypted,
      verifySsl: body.caldav.verifySsl ?? cfg.verifySsl
    };
  }
  if (a.provider === "ics" && body.ics) {
    const cfg = a.config;
    a.config = {
      url: body.ics.url ?? cfg.url,
      username: body.ics.username ?? cfg.username,
      passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : cfg.passwordEncrypted ?? ""
    };
  }
}
function eventEndMs(e) {
  if (e.dtend) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtend)) return (/* @__PURE__ */ new Date(e.dtend + "T23:59:59")).getTime();
    return new Date(e.dtend).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtstart)) return (/* @__PURE__ */ new Date(e.dtstart + "T23:59:59")).getTime();
  return new Date(e.dtstart).getTime();
}
function localDateKey(iso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? /* @__PURE__ */ new Date(iso + "T12:00:00") : new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function syncPriority(e) {
  if (e.syncState === "local_new" || e.syncState === "local_modified") return 0;
  if (e.syncState === "conflict") return 1;
  return 2;
}
function buildSummary(expanded, pending, conflicts) {
  const now = /* @__PURE__ */ new Date();
  const nowMs = now.getTime();
  const todayKey = localDateKey(now.toISOString());
  const stillRelevant = expanded.filter((e) => eventEndMs(e) >= nowMs);
  const sorted = [...stillRelevant].sort((a, b) => {
    const pd = syncPriority(a) - syncPriority(b);
    if (pd !== 0) return pd;
    return a.dtstart.localeCompare(b.dtstart);
  });
  const seenMasters = /* @__PURE__ */ new Set();
  const upcomingDeduped = [];
  for (const e of sorted) {
    if (seenMasters.has(e.id)) continue;
    seenMasters.add(e.id);
    upcomingDeduped.push(e);
    if (upcomingDeduped.length >= 20) break;
  }
  const todayIds = /* @__PURE__ */ new Set();
  for (const e of expanded) {
    if (localDateKey(e.dtstart) === todayKey) todayIds.add(e.id);
  }
  return {
    now: now.toISOString(),
    todayCount: todayIds.size,
    upcoming: upcomingDeduped.slice(0, 15).map((e) => ({
      id: e.id,
      calendarId: e.calendarId,
      summary: e.summary || "(ohne Titel)",
      dtstart: e.dtstart,
      dtend: e.dtend,
      allDay: e.allDay,
      syncState: e.syncState,
      calendarColor: e.calendarColor,
      calendarName: e.calendarName,
      location: e.location,
      description: e.description,
      instanceStart: e.isRecurrenceInstance ? e.dtstart : void 0
    })),
    pendingChanges: pending,
    conflicts
  };
}
function notFound(message = "not found") {
  return Response.json({ error: message }, { status: 404 });
}
function badRequest(message) {
  return Response.json({ error: message }, { status: 400 });
}
function forbidden(message = "forbidden") {
  return Response.json({ error: message }, { status: 403 });
}
function ok(data) {
  return Response.json(data);
}

// plugins-pack/calendar/lib/ical.ts
import ICAL from "ical.js";
import { rrulestr } from "rrule";
import { randomUUID } from "node:crypto";
function newUid() {
  return `${randomUUID()}@selfdashboard`;
}
function normalizeEventTimes(body) {
  if (!body.allDay) return { dtstart: body.dtstart, dtend: body.dtend };
  const day = (s) => s.length >= 10 ? s.slice(0, 10) : s;
  return {
    dtstart: day(body.dtstart),
    dtend: body.dtend ? day(body.dtend) : void 0
  };
}
function isAllDayString(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function asDate(s) {
  if (isAllDayString(s)) return /* @__PURE__ */ new Date(s + "T00:00:00Z");
  return new Date(s);
}
function buildVcalendar(input) {
  const cal = new ICAL.Component(["vcalendar", [], []]);
  cal.updatePropertyWithValue("prodid", "-//SelfDashboard//Calendar Plugin//EN");
  cal.updatePropertyWithValue("version", "2.0");
  cal.updatePropertyWithValue("calscale", "GREGORIAN");
  const ev = new ICAL.Component("vevent");
  ev.updatePropertyWithValue("uid", input.uid);
  ev.updatePropertyWithValue("dtstamp", ICAL.Time.now());
  if (input.summary) ev.updatePropertyWithValue("summary", input.summary);
  if (input.description) ev.updatePropertyWithValue("description", input.description);
  if (input.location) ev.updatePropertyWithValue("location", input.location);
  if (input.allDay) {
    const d = asDate(input.dtstart);
    const startTime = ICAL.Time.fromDateString(d.toISOString().slice(0, 10));
    startTime.isDate = true;
    ev.updatePropertyWithValue("dtstart", startTime);
    const endStr = input.dtend ? asDate(input.dtend).toISOString().slice(0, 10) : new Date(d.getTime() + 864e5).toISOString().slice(0, 10);
    const endTime = ICAL.Time.fromDateString(endStr);
    endTime.isDate = true;
    ev.updatePropertyWithValue("dtend", endTime);
  } else {
    const startTime = ICAL.Time.fromJSDate(asDate(input.dtstart), true);
    ev.updatePropertyWithValue("dtstart", startTime);
    if (input.dtend) {
      const endTime = ICAL.Time.fromJSDate(asDate(input.dtend), true);
      ev.updatePropertyWithValue("dtend", endTime);
    }
  }
  if (input.rrule) {
    const recur = ICAL.Recur.fromString(input.rrule);
    ev.updatePropertyWithValue("rrule", recur);
  }
  if (input.lastModifiedIso) {
    ev.updatePropertyWithValue("last-modified", ICAL.Time.fromJSDate(new Date(input.lastModifiedIso), true));
  }
  cal.addSubcomponent(ev);
  return cal.toString();
}
function parseVcalendar(blob) {
  const out = [];
  let jcal;
  try {
    jcal = ICAL.parse(blob);
  } catch {
    return out;
  }
  const comp = new ICAL.Component(jcal);
  const events = comp.getAllSubcomponents("vevent");
  for (const ev of events) {
    if (ev.getFirstPropertyValue("recurrence-id")) continue;
    const dtstart = ev.getFirstProperty("dtstart");
    if (!dtstart) continue;
    const dtstartVal = dtstart.getFirstValue();
    const dtend = ev.getFirstProperty("dtend");
    const dtendVal = dtend?.getFirstValue();
    const allDay = dtstartVal.isDate;
    const rrule = ev.getFirstProperty("rrule");
    let rruleStr;
    if (rrule) {
      const v = rrule.getFirstValue();
      rruleStr = typeof v === "string" ? v : v.toString();
    }
    const lastMod = ev.getFirstPropertyValue("last-modified") ?? ev.getFirstPropertyValue("dtstamp");
    out.push({
      uid: String(ev.getFirstPropertyValue("uid") ?? newUid()),
      summary: ev.getFirstPropertyValue("summary")?.toString() ?? void 0,
      description: ev.getFirstPropertyValue("description")?.toString() ?? void 0,
      location: ev.getFirstPropertyValue("location")?.toString() ?? void 0,
      dtstart: allDay ? dtstartVal.toString().slice(0, 10) : dtstartVal.toJSDate().toISOString(),
      dtend: dtendVal ? allDay ? dtendVal.toString().slice(0, 10) : dtendVal.toJSDate().toISOString() : void 0,
      allDay,
      rrule: rruleStr,
      remoteModifiedIso: lastMod ? lastMod.toJSDate().toISOString() : void 0
    });
  }
  return out;
}
function expandRecurrences(events, rangeStart, rangeEnd, calendarLookup) {
  const out = [];
  for (const ev of events) {
    const meta = calendarLookup(ev.calendarId);
    const base = {
      ...ev,
      calendarName: meta.name,
      calendarColor: meta.color,
      isRecurrenceInstance: false
    };
    if (!ev.rrule) {
      const start = asDate(ev.dtstart);
      if (start >= rangeStart && start < rangeEnd) out.push(base);
      continue;
    }
    try {
      const dtstart = asDate(ev.dtstart);
      const rule = rrulestr(`DTSTART:${dtstart.toISOString().replace(/[-:]|\.\d{3}/g, "")}
RRULE:${ev.rrule}`);
      const instances = rule.between(rangeStart, rangeEnd, true);
      let durationMs = 0;
      if (ev.dtend) durationMs = asDate(ev.dtend).getTime() - dtstart.getTime();
      for (const inst of instances) {
        const instEnd = durationMs > 0 ? new Date(inst.getTime() + durationMs) : void 0;
        out.push({
          ...base,
          dtstart: ev.allDay ? inst.toISOString().slice(0, 10) : inst.toISOString(),
          dtend: instEnd ? ev.allDay ? instEnd.toISOString().slice(0, 10) : instEnd.toISOString() : void 0,
          isRecurrenceInstance: true,
          recurrenceId: inst.toISOString()
        });
      }
    } catch {
      const start = asDate(ev.dtstart);
      if (start >= rangeStart && start < rangeEnd) out.push(base);
    }
  }
  return out;
}

// plugins-pack/calendar/lib/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/calendar/lib/caldav.ts
import { createDAVClient } from "tsdav";
import { assertSafeOutboundUrl as assertSafeOutboundUrl2 } from "@/lib/security/ssrf";

// plugins-pack/calendar/lib/caldav-privileges.ts
function heuristicCalendarReadOnly(name, url) {
  const n = name.toLowerCase().trim();
  const u = url.toLowerCase();
  const blob = `${n} ${u}`;
  if (/feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) {
    return true;
  }
  if ((u.includes("web.de") || u.includes("begenda")) && (n === "web" || n === "web.de")) {
    return true;
  }
  if ((u.includes("web.de") || u.includes("begenda")) && /geburt|birth/.test(n)) {
    return true;
  }
  return false;
}
async function caldavHasWritePrivilege(client, calendarUrl) {
  try {
    const responses = await client.propfind({
      url: calendarUrl,
      props: {
        "current-user-privilege-set": {
          privilege: {}
        }
      },
      depth: "0"
    });
    const match = responses.find((r) => r.href && (r.href === calendarUrl || calendarUrl.startsWith(r.href))) ?? responses[0];
    const props = match?.props;
    if (!props) return true;
    const blob = JSON.stringify(props).toLowerCase();
    if (/write-content|write-properties|write|\bbind\b/.test(blob)) return true;
    if (/\bread\b/.test(blob) && !/write/.test(blob)) return false;
    return true;
  } catch {
    return true;
  }
}
async function resolveCalendarReadOnly(client, name, url) {
  if (heuristicCalendarReadOnly(name, url)) return true;
  return !await caldavHasWritePrivilege(client, url);
}
function formatCalDavPushError(calendarName, uid, msg) {
  if (msg.includes("403")) {
    return `Kalender \u201E${calendarName}\u201C: kein Schreibzugriff (HTTP 403). Bei WEB.DE \u201EMein Kalender\u201C w\xE4hlen, nicht \u201Eweb\u201C oder \u201EGeburtstage\u201C.`;
  }
  return `${calendarName}: ${msg}`;
}

// plugins-pack/calendar/lib/caldav-url.ts
import { assertSafeOutboundUrl } from "@/lib/security/ssrf";
function caldavObjectFilename(uid) {
  const stem = uid.includes("@") ? uid.split("@")[0] : uid;
  return `${stem.replace(/[^a-zA-Z0-9-]/g, "_")}.ics`;
}
function joinCollectionUrl(collectionUrl, filename) {
  const base = collectionUrl.endsWith("/") ? collectionUrl : `${collectionUrl}/`;
  return new URL(filename, base).href;
}
function normalizeCaldavServerUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (parts.length && /^calendars?$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    u.pathname = `${parts.length ? `/${parts.join("/")}` : ""}/`;
    assertSafeOutboundUrl(u.href);
    return u.href;
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}

// plugins-pack/calendar/lib/caldav.ts
var emptyResult = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function mergeResult(a, b) {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    deleted: a.deleted + b.deleted,
    conflicts: a.conflicts + b.conflicts,
    errors: [...a.errors, ...b.errors]
  };
}
function decryptAccountPassword(encrypted) {
  try {
    return decrypt(encrypted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unable to authenticate|unsupported state/i.test(msg)) {
      throw new Error(
        "Gespeichertes Passwort kann nicht entschl\xFCsselt werden \u2014 Konto bearbeiten und Passwort erneut speichern (nach Container-Neuaufbau oder ge\xE4ndertem SELFDASHBOARD_CALENDAR_KEY / fehlendem Volume f\xFCr /app/data)."
      );
    }
    throw e;
  }
}
async function buildClient(account) {
  const cfg = account.config;
  const password = decryptAccountPassword(cfg.passwordEncrypted);
  const serverUrl = normalizeCaldavServerUrl(cfg.url);
  try {
    assertSafeOutboundUrl2(serverUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`CalDAV URL blocked: ${msg}`);
  }
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg.username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav"
  });
}
function caldavDisplayName(cal) {
  const dn = cal.displayName;
  if (typeof dn === "string" && dn.trim()) return dn.trim();
  if (dn && typeof dn === "object" && "value" in dn && typeof dn.value === "string") {
    return String(dn.value).trim();
  }
  try {
    const seg = new URL(cal.url).pathname.split("/").filter(Boolean).pop();
    if (seg) return seg;
  } catch {
  }
  return cal.url;
}
async function discoverCaldavCalendars(account) {
  const client = await buildClient(account);
  const calendars = await client.fetchCalendars();
  const out = [];
  for (const c of calendars) {
    const name = caldavDisplayName(c);
    const readOnly = await resolveCalendarReadOnly(client, name, c.url);
    out.push({
      remoteId: c.url,
      name,
      color: c.calendarColor ?? void 0,
      readOnly
    });
  }
  return out;
}
async function getCaldavClientCache(account) {
  const client = await buildClient(account);
  const davCalendars = await client.fetchCalendars();
  return { client, davCalendars };
}
async function syncCaldavCalendar(account, calendar, store, cache) {
  const client = cache?.client ?? await buildClient(account);
  const davCalendars = cache?.davCalendars ?? await client.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === calendar.remoteId);
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar.remoteId}`] };
  }
  const pull = await pullCaldav(client, davCal, calendar, store);
  if (calendar.readOnly) return pull;
  const pendingDeletes = await pushPendingRemoteDeletes(client, calendar, store);
  const push = await pushCaldav(client, davCal, calendar, store);
  return mergeResult(mergeResult(pull, pendingDeletes), push);
}
async function syncCaldavCalendarPushOnly(account, calendar, store, cache) {
  if (calendar.readOnly) return emptyResult();
  const client = cache?.client ?? await buildClient(account);
  const davCalendars = cache?.davCalendars ?? await client.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === calendar.remoteId);
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar.remoteId}`] };
  }
  const pendingDeletes = await pushPendingRemoteDeletes(client, calendar, store);
  const push = await pushCaldav(client, davCal, calendar, store);
  return mergeResult(pendingDeletes, push);
}
async function pullCaldav(client, davCal, calendar, store) {
  const result = emptyResult();
  let objects;
  try {
    const fetched = await client.fetchCalendarObjects({ calendar: davCal });
    objects = fetched.map((o) => ({ url: o.url, etag: o.etag ?? "", data: o.data ?? "" }));
  } catch (e) {
    result.errors.push(`fetch objects: ${e?.message ?? e}`);
    return result;
  }
  const seenUids = /* @__PURE__ */ new Set();
  for (const obj of objects) {
    const parsed = parseVcalendar(obj.data);
    if (!parsed.length) continue;
    const remote = parsed[0];
    seenUids.add(remote.uid);
    const localIdx = store.events.findIndex(
      (e) => e.calendarId === calendar.id && e.uid === remote.uid
    );
    if (localIdx === -1) {
      store.events.push({
        id: `evt_${remote.uid}`,
        calendarId: calendar.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.events[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== obj.etag) {
        local.syncState = "conflict";
        local.conflictRemoteIcal = obj.data;
        local.remoteHref = obj.url;
        local.remoteEtag = obj.etag;
        local.remoteModifiedAt = remote.remoteModifiedIso;
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== obj.etag) {
      Object.assign(local, {
        icalData: obj.data,
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.updated++;
    }
  }
  return result;
}
async function pushPendingRemoteDeletes(client, calendar, store) {
  const result = emptyResult();
  for (const ev of store.events) {
    const pd = ev.pendingRemoteDelete;
    if (!pd || pd.calendarId !== calendar.id) continue;
    try {
      await client.deleteCalendarObject({
        calendarObject: { url: pd.remoteHref, etag: pd.remoteEtag, data: "" }
      });
      delete ev.pendingRemoteDelete;
      result.deleted++;
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes("404")) {
        delete ev.pendingRemoteDelete;
        result.deleted++;
      } else {
        result.errors.push(formatCalDavPushError(calendar.name, ev.uid, `move delete: ${msg}`));
      }
    }
  }
  return result;
}
async function pushCaldav(client, davCal, calendar, store) {
  const result = emptyResult();
  const pending = store.events.filter(
    (e) => e.calendarId === calendar.id && (e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted")
  );
  for (const ev of pending) {
    try {
      if (ev.syncState === "local_new") {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt
        });
        const filename = caldavObjectFilename(ev.uid);
        const objectUrl = joinCollectionUrl(davCal.url, filename);
        const res = await client.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename
        });
        const httpRes = res;
        if (httpRes && typeof httpRes.ok === "boolean" && !httpRes.ok) {
          const body = await httpRes.text().catch(() => "");
          throw new Error(`HTTP ${httpRes.status} ${httpRes.statusText}${body ? `: ${body.slice(0, 120)}` : ""}`);
        }
        const loc = httpRes?.headers?.get?.("location");
        ev.icalData = ical;
        ev.remoteHref = loc ? new URL(loc, davCal.url).href : objectUrl;
        ev.remoteEtag = httpRes?.headers?.get?.("etag")?.replace(/^"|"$/g, "") ?? "";
        ev.syncState = "synced";
        result.added++;
      } else if (ev.syncState === "local_modified") {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt
        });
        const res = await client.updateCalendarObject({
          calendarObject: { url: ev.remoteHref, etag: ev.remoteEtag, data: ical }
        });
        ev.icalData = ical;
        ev.remoteEtag = res.etag ?? ev.remoteEtag;
        ev.syncState = "synced";
        result.updated++;
      } else if (ev.syncState === "local_deleted") {
        if (!ev.remoteHref) {
          store.events.splice(store.events.indexOf(ev), 1);
          result.deleted++;
          continue;
        }
        try {
          await client.deleteCalendarObject({
            calendarObject: { url: ev.remoteHref, etag: ev.remoteEtag, data: "" }
          });
        } catch (e) {
          if (!String(e?.message ?? "").includes("404")) throw e;
        }
        store.events.splice(store.events.indexOf(ev), 1);
        result.deleted++;
      }
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes("412") || msg.includes("Precondition")) {
        ev.syncState = "conflict";
        result.conflicts++;
      } else {
        if (msg.includes("403")) {
          const calRow = store.calendars.find((c) => c.id === calendar.id);
          if (calRow) calRow.readOnly = true;
        }
        result.errors.push(formatCalDavPushError(calendar.name, ev.uid, msg));
      }
    }
  }
  return result;
}
async function testCaldav(account) {
  try {
    const cals = await discoverCaldavCalendars(account);
    return { ok: true, calendars: cals };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// plugins-pack/calendar/lib/ics.ts
import { assertSafeOutboundUrl as assertSafeOutboundUrl3, fetchWithSsrfGuard, UnsafeOutboundUrlError } from "@/lib/security/ssrf";
function normaliseUrl(url) {
  if (url.startsWith("webcal://")) return "https://" + url.slice("webcal://".length);
  if (url.startsWith("webcals://")) return "https://" + url.slice("webcals://".length);
  return url;
}
function guardIcsUrl(url) {
  const normalized = normaliseUrl(url);
  assertSafeOutboundUrl3(normalized);
  return normalized;
}
async function discoverIcsCalendars(account) {
  const cfg = account.config;
  const url = guardIcsUrl(cfg.url);
  return [{
    remoteId: url,
    name: account.name,
    readOnly: true
  }];
}
async function syncIcsCalendar(account, calendar, store) {
  const cfg = account.config;
  const url = guardIcsUrl(cfg.url);
  const headers = { "User-Agent": "SelfDashboard-Calendar/1.0" };
  if (calendar.etagGlobal) headers["If-None-Match"] = calendar.etagGlobal;
  if (cfg.username && cfg.passwordEncrypted) {
    const pw = decrypt(cfg.passwordEncrypted);
    headers["Authorization"] = "Basic " + Buffer.from(`${cfg.username}:${pw}`).toString("base64");
  }
  let resp;
  try {
    resp = await fetchWithSsrfGuard(url, { headers });
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`blocked_url: ${e.message}`] };
    }
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`fetch: ${e?.message ?? e}`] };
  }
  if (resp.status === 304) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] };
  }
  if (!resp.ok) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`HTTP ${resp.status}`] };
  }
  const body = await resp.text();
  const parsed = parseVcalendar(body);
  const existingByUid = new Map(
    store.events.filter((e) => e.calendarId === calendar.id).map((e) => [e.uid, e])
  );
  let added = 0;
  let updated = 0;
  const seenUids = /* @__PURE__ */ new Set();
  for (const pe of parsed) {
    seenUids.add(pe.uid);
    const sliced = buildSingleVeventBlob(body, pe.uid);
    const existing = existingByUid.get(pe.uid);
    if (!existing) {
      store.events.push({
        id: `evt_${pe.uid}`,
        calendarId: calendar.id,
        uid: pe.uid,
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: "synced"
      });
      added++;
    } else if (existing.icalData !== sliced) {
      Object.assign(existing, {
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: "synced"
      });
      updated++;
    }
  }
  let deleted = 0;
  for (let i = store.events.length - 1; i >= 0; i--) {
    const e = store.events[i];
    if (e.calendarId !== calendar.id) continue;
    if (!seenUids.has(e.uid)) {
      store.events.splice(i, 1);
      deleted++;
    }
  }
  const newEtag = resp.headers.get("etag") ?? resp.headers.get("ETag");
  if (newEtag) calendar.etagGlobal = newEtag;
  return { added, updated, deleted, conflicts: 0, errors: [] };
}
function buildSingleVeventBlob(feed, uid) {
  const lines = feed.split(/\r?\n/);
  const result = [];
  let inEvent = false;
  let buf = [];
  let matched = false;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      buf = [line];
      matched = false;
      continue;
    }
    if (inEvent) {
      buf.push(line);
      if (/^UID:/i.test(line) && line.slice(4).trim() === uid) matched = true;
      if (line === "END:VEVENT") {
        if (matched) result.push(buf.join("\r\n"));
        inEvent = false;
        buf = [];
      }
    }
  }
  return [
    "BEGIN:VCALENDAR",
    "PRODID:-//SelfDashboard//ICS Slice//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    ...result,
    "END:VCALENDAR"
  ].join("\r\n");
}
async function testIcs(account) {
  try {
    const cfg = account.config;
    const url = guardIcsUrl(cfg.url);
    const resp = await fetchWithSsrfGuard(url, { method: "HEAD" });
    if (!resp.ok && resp.status !== 405) {
      const get = await fetchWithSsrfGuard(url);
      if (!get.ok) return { ok: false, error: `HTTP ${get.status}` };
    }
    return { ok: true, calendars: await discoverIcsCalendars(account) };
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) return { ok: false, error: e.message };
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// plugins-pack/calendar/lib/sync.ts
var DEFAULT_INTERVAL_MS = parseInt(
  process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? "300",
  10
) * 1e3;
async function discoverAccountCalendars(account) {
  if (account.provider === "caldav") return discoverCaldavCalendars(account);
  if (account.provider === "ics") return discoverIcsCalendars(account);
  throw new Error(`unknown provider: ${account.provider}`);
}
async function testAccount(account) {
  if (account.provider === "caldav") return testCaldav(account);
  if (account.provider === "ics") return testIcs(account);
  return { ok: false, error: `unknown provider: ${account.provider}` };
}
async function syncAfterMutation(accountId, opts) {
  const log = await runSync(accountId, {
    calendarIds: opts?.calendarIds,
    skipDiscover: true,
    pushOnly: true
  });
  return log.error ?? void 0;
}
async function runSync(accountId, opts) {
  const ownerUserId = await findAccountOwnerUserId(accountId);
  if (!ownerUserId) {
    return makeLogEntry(accountId, "disabled or not found", {
      added: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0
    });
  }
  const store = await readOwnerStore(ownerUserId);
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account || !account.enabled) {
    return makeLogEntry(accountId, "disabled or not found", {
      added: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0
    });
  }
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalConflicts = 0;
  const errors = [];
  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountCalendars(account);
      const discoveredIds = new Set(discovered.map((d) => d.remoteId));
      await mutateOwnerStore(ownerUserId, (s) => {
        for (const d of discovered) {
          let cal = s.calendars.find((c) => c.accountId === account.id && c.remoteId === d.remoteId);
          if (!cal) {
            cal = {
              id: newId("cal"),
              accountId: account.id,
              remoteId: d.remoteId,
              name: d.name,
              color: d.color ?? randomColor(d.name),
              readOnly: d.readOnly,
              visible: true
            };
            s.calendars.push(cal);
          } else {
            cal.name = d.name;
            cal.readOnly = d.readOnly;
            if (d.color) cal.color = d.color;
          }
        }
        const stale = s.calendars.filter(
          (c) => c.accountId === account.id && !discoveredIds.has(c.remoteId)
        );
        if (stale.length) {
          const staleIds = new Set(stale.map((c) => c.id));
          s.calendars = s.calendars.filter((c) => !staleIds.has(c.id));
          s.events = s.events.filter((e) => !staleIds.has(e.calendarId));
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`discover: ${msg}`);
      const errText = errors.join("; ");
      void logPluginApiFailure("calendar", "discover", errText, {
        accountId,
        provider: account.provider
      });
      const log2 = makeLogEntry(accountId, errText, {
        added: 0,
        updated: 0,
        deleted: 0,
        conflicts: 0
      });
      await mutateOwnerStore(ownerUserId, (s) => {
        s.syncLog.unshift(log2);
        s.syncLog = s.syncLog.slice(0, 50);
        const acc = s.accounts.find((a) => a.id === accountId);
        if (acc) {
          acc.lastSyncAt = nowIso();
          acc.lastSyncStatus = "error";
          acc.lastSyncError = errors.join("; ");
        }
      });
      return log2;
    }
  }
  let calendars = (await readOwnerStore(ownerUserId)).calendars.filter((c) => c.accountId === account.id);
  if (opts?.calendarIds?.length) {
    const want = new Set(opts.calendarIds);
    calendars = calendars.filter((c) => want.has(c.id));
  }
  let caldavCache;
  if (account.provider === "caldav" && calendars.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`caldav client: ${msg}`);
    }
  }
  for (const calendar of calendars) {
    try {
      await mutateOwnerStore(ownerUserId, async (s) => {
        const live = s.calendars.find((c) => c.id === calendar.id);
        const acc = s.accounts.find((a) => a.id === accountId);
        const r = account.provider === "caldav" ? opts?.pushOnly ? await syncCaldavCalendarPushOnly(acc, live, s, caldavCache) : await syncCaldavCalendar(acc, live, s, caldavCache) : opts?.pushOnly ? { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] } : await syncIcsCalendar(acc, live, s);
        totalAdded += r.added;
        totalUpdated += r.updated;
        totalDeleted += r.deleted;
        totalConflicts += r.conflicts;
        errors.push(...r.errors);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`cal ${calendar.name}: ${msg}`);
    }
  }
  const status = errors.length ? "error" : totalConflicts ? "conflict" : "ok";
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join("; ") : void 0,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts }
  );
  await mutateOwnerStore(ownerUserId, (s) => {
    s.syncLog.unshift(log);
    s.syncLog = s.syncLog.slice(0, 50);
    const acc = s.accounts.find((a) => a.id === accountId);
    if (acc) {
      acc.lastSyncAt = nowIso();
      acc.lastSyncStatus = status;
      acc.lastSyncError = errors.length ? errors.join("; ") : void 0;
    }
  });
  if (errors.length) {
    void logPluginApiFailure("calendar", "sync", errors.join("; "), {
      accountId,
      provider: account.provider,
      added: totalAdded,
      updated: totalUpdated
    });
  }
  return log;
}
function makeLogEntry(accountId, error, counts) {
  return {
    id: newId("log"),
    accountId,
    startedAt: nowIso(),
    finishedAt: nowIso(),
    ...counts,
    error
  };
}
function randomColor(seed) {
  let h = 0;
  for (const ch of seed) h = h * 31 + ch.charCodeAt(0) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

// plugins-pack/calendar/lib/viewer.ts
import { getSessionFromRequest } from "@/lib/auth/guard";
function resolveCalendarViewer(req) {
  const session = getSessionFromRequest(req);
  if (session) {
    return { userId: session.userId, role: session.role };
  }
  const hdr = req.headers.get("x-sd-user-id")?.trim();
  if (hdr) {
    const role = req.headers.get("x-sd-role")?.trim() ?? "user";
    return { userId: hdr, role: role === "admin" ? "admin" : "user" };
  }
  return null;
}

// plugins-pack/calendar/server.ts
function usernameById() {
  return new Map(listUsers().map((u) => [u.id, u.username]));
}
function mapAccountsToViews(viewer, store, permissions) {
  const names = usernameById();
  return store.accounts.map((a) => {
    const perm = permissions.get(a.id);
    const sharedNames = (a.sharedWithUserIds ?? []).map((id) => names.get(id) ?? id);
    const ownerId = perm?.ownerUserId ?? a.ownerUserId;
    return toAccountView(a, store.calendars, {
      ownedByMe: perm?.ownedByViewer ?? false,
      canManage: perm?.canManage ?? false,
      ownerUsername: ownerId ? names.get(ownerId) : void 0,
      sharedWithUsernames: sharedNames
    });
  });
}
async function loadViewer(viewer) {
  const { store, permissions, calendarPermissions } = await readViewerStore(viewer.userId, viewer.role);
  const calendars = applyCalendarReadOnlyForViewer(store.calendars, calendarPermissions);
  return { store: { ...store, calendars }, permissions, calendarPermissions, calendars };
}
async function requireManageAccount(accountId, viewer) {
  const { permissions } = await loadViewer(viewer);
  const perm = permissions.get(accountId);
  if (!perm?.canManage) return null;
  const ownerUserId = await findAccountOwnerUserId(accountId);
  if (!ownerUserId) return null;
  return { ownerUserId, permissions };
}
async function calendarWritable(calendarId, viewer) {
  const { store, calendarPermissions, calendars } = await loadViewer(viewer);
  const cal = calendars.find((c) => c.id === calendarId);
  if (!cal || cal.readOnly) return null;
  if (!calendarCanEditEvents(calendarId, calendarPermissions)) return null;
  const ownerUserId = await findAccountOwnerUserId(cal.accountId);
  if (!ownerUserId) return null;
  return { store, cal, ownerUserId };
}
async function handleShareUsersGet(viewer) {
  if (isAuthDisabled()) return ok([]);
  const users = listUsers().filter((u) => u.id !== viewer.userId).filter((u) => isPluginAllowed(u.id, u.role, "calendar")).map((u) => ({ id: u.id, username: u.username }));
  return ok(users);
}
async function handleSummaryGet(viewer) {
  const { store, calendars } = await loadViewer(viewer);
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now.getTime() + 7 * 864e5);
  const visibleCalendarIds = new Set(calendars.filter((c) => c.visible).map((c) => c.id));
  const calendarLookup = (id) => {
    const c = calendars.find((x) => x.id === id);
    return { name: c?.name, color: c?.color };
  };
  const candidates = store.events.filter(
    (e) => visibleCalendarIds.has(e.calendarId) && e.syncState !== "local_deleted"
  );
  const expanded = expandRecurrences(candidates, now, end, calendarLookup);
  const pending = store.events.filter(
    (e) => e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted"
  ).length;
  const conflicts = store.events.filter((e) => e.syncState === "conflict").length;
  return ok(buildSummary(expanded, pending, conflicts));
}
async function handleStatusGet(viewer) {
  const { store, permissions } = await loadViewer(viewer);
  const pending = store.events.filter(
    (e) => e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted"
  ).length;
  const conflicts = store.events.filter((e) => e.syncState === "conflict").length;
  return ok({
    accounts: mapAccountsToViews(viewer, store, permissions),
    recentRuns: store.syncLog.slice(0, 20),
    pendingChanges: pending,
    conflicts
  });
}
async function handleAccountsGet(viewer) {
  const { store, permissions } = await loadViewer(viewer);
  return ok(mapAccountsToViews(viewer, store, permissions));
}
async function handleAccountsPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.name || !body?.provider) return badRequest("name and provider required");
  let newIdVal;
  try {
    const account = buildAccount(body, viewer.userId, /* @__PURE__ */ new Set());
    newIdVal = account.id;
    await mutateUserStore(viewer.userId, (s) => {
      s.accounts.push(account);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return badRequest(msg);
  }
  runSync(newIdVal).catch(() => void 0);
  const ownerStore = await readOwnerStore(viewer.userId);
  const created = ownerStore.accounts.find((a) => a.id === newIdVal);
  return ok(
    toAccountView(created, ownerStore.calendars, {
      ownedByMe: true,
      canManage: true
    })
  );
}
async function handleAccountPut(req, id, viewer) {
  const manage = await requireManageAccount(id, viewer);
  if (!manage) return forbidden("not allowed to manage this account");
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateOwnerStore(manage.ownerUserId, (s) => {
    const a = s.accounts.find((x) => x.id === id);
    if (!a) return;
    found = true;
    const validCalendarIds = new Set(
      s.calendars.filter((c) => c.accountId === id).map((c) => c.id)
    );
    applyAccountUpdate(a, body, manage.ownerUserId, validCalendarIds);
  });
  if (!found) return notFound("account not found");
  const { store, permissions } = await loadViewer(viewer);
  const updated = store.accounts.find((a) => a.id === id);
  const perm = permissions.get(id);
  const names = usernameById();
  return ok(
    toAccountView(updated, store.calendars, {
      ownedByMe: perm?.ownedByViewer ?? false,
      canManage: perm?.canManage ?? false,
      ownerUsername: names.get(perm?.ownerUserId ?? ""),
      sharedWithUsernames: (updated.sharedWithUserIds ?? []).map((uid) => names.get(uid) ?? uid)
    })
  );
}
async function handleAccountDelete(id, viewer) {
  const manage = await requireManageAccount(id, viewer);
  if (!manage) return forbidden("not allowed to manage this account");
  let found = false;
  await mutateOwnerStore(manage.ownerUserId, (s) => {
    const idx = s.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    found = true;
    s.accounts.splice(idx, 1);
    const calIds = new Set(s.calendars.filter((c) => c.accountId === id).map((c) => c.id));
    s.calendars = s.calendars.filter((c) => !calIds.has(c.id));
    s.events = s.events.filter((e) => !calIds.has(e.calendarId));
  });
  if (!found) return notFound("account not found");
  return ok({ ok: true });
}
async function handleAccountSyncPost(id, viewer) {
  const manage = await requireManageAccount(id, viewer);
  if (!manage) return forbidden("not allowed to sync this account");
  const ownerStore = await readOwnerStore(manage.ownerUserId);
  const account = ownerStore.accounts.find((a) => a.id === id);
  if (!account) return notFound("account not found");
  if (!account.enabled) return badRequest("account is disabled");
  const log = await runSync(id);
  return ok(log);
}
async function handleAccountTestPost(id, viewer) {
  const manage = await requireManageAccount(id, viewer);
  if (!manage) return forbidden("not allowed to test this account");
  const ownerStore = await readOwnerStore(manage.ownerUserId);
  const account = ownerStore.accounts.find((a) => a.id === id);
  if (!account) return notFound("account not found");
  const result = await testAccount(account);
  return ok(result);
}
async function handleCalendarsGet(viewer) {
  const { calendars } = await loadViewer(viewer);
  return ok(calendars);
}
async function handleCalendarPut(req, id, viewer) {
  const { permissions, calendars } = await loadViewer(viewer);
  const cal = calendars.find((c) => c.id === id);
  if (!cal) return notFound("calendar not found");
  const perm = permissions.get(cal.accountId);
  if (!perm?.canManage) return forbidden("not allowed to edit this calendar");
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  const ownerUserId = await findAccountOwnerUserId(cal.accountId);
  if (!ownerUserId) return notFound("calendar not found");
  let updated = null;
  await mutateOwnerStore(ownerUserId, (s) => {
    const c = s.calendars.find((x) => x.id === id);
    if (!c) return;
    if (body.color !== void 0) c.color = body.color;
    if (body.visible !== void 0) c.visible = body.visible;
    if (body.name !== void 0) c.name = body.name;
    updated = c;
  });
  if (!updated) return notFound("calendar not found");
  const refreshed = (await loadViewer(viewer)).calendars.find((c) => c.id === id) ?? updated;
  return ok(refreshed);
}
async function handleEventsGet(req, viewer) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const calendarId = url.searchParams.get("calendarId") ?? void 0;
  if (!start || !end) return badRequest("start and end query params required");
  let startDate;
  let endDate;
  try {
    startDate = new Date(start);
    endDate = new Date(end);
    if (isNaN(+startDate) || isNaN(+endDate)) throw new Error("bad date");
  } catch {
    return badRequest("start and end must be valid ISO datetimes");
  }
  const { store, calendars } = await loadViewer(viewer);
  const visibleCalendarIds = new Set(
    calendars.filter((c) => c.visible && (!calendarId || c.id === calendarId)).map((c) => c.id)
  );
  const calendarLookup = (calId) => {
    const c = calendars.find((x) => x.id === calId);
    return { name: c?.name, color: c?.color };
  };
  const candidates = store.events.filter(
    (e) => visibleCalendarIds.has(e.calendarId) && e.syncState !== "local_deleted"
  );
  const expanded = expandRecurrences(candidates, startDate, endDate, calendarLookup);
  return ok(expanded);
}
async function handleEventsPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.calendarId || !body?.dtstart) return badRequest("calendarId and dtstart required");
  const writable = await calendarWritable(body.calendarId, viewer);
  if (!writable) return badRequest("calendar not found or read-only");
  const times = normalizeEventTimes({
    dtstart: body.dtstart,
    dtend: body.dtend,
    allDay: body.allDay
  });
  const uid = newUid();
  const evId = newId("evt");
  const ical = buildVcalendar({
    uid,
    summary: body.summary ?? "",
    description: body.description,
    location: body.location,
    dtstart: times.dtstart,
    dtend: times.dtend,
    allDay: body.allDay ?? false,
    rrule: body.rrule,
    lastModifiedIso: nowIso()
  });
  await mutateOwnerStore(writable.ownerUserId, (s) => {
    s.events.push({
      id: evId,
      calendarId: body.calendarId,
      uid,
      icalData: ical,
      summary: body.summary ?? "",
      description: body.description ?? "",
      location: body.location ?? "",
      dtstart: times.dtstart,
      dtend: times.dtend,
      allDay: body.allDay ?? false,
      rrule: body.rrule,
      localModifiedAt: nowIso(),
      syncState: "local_new"
    });
  });
  const syncError = await syncAfterMutation(writable.cal.accountId, {
    calendarIds: [body.calendarId]
  });
  const after = await readOwnerStore(writable.ownerUserId);
  const ev = after.events.find((e) => e.id === evId);
  if (!ev) return badRequest("event not created");
  const payload = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== "synced" && !syncError
  };
  return ok(payload);
}
async function handleEventPut(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  const { store, calendarPermissions, calendars } = await loadViewer(viewer);
  const existing = store.events.find((e) => e.id === id);
  if (!existing) return notFound("event not found");
  const cal = calendars.find((c) => c.id === existing.calendarId);
  if (!cal || cal.readOnly) return notFound("event not found or its calendar is read-only");
  if (!calendarCanEditEvents(cal.id, calendarPermissions)) {
    return forbidden("not allowed to edit this event");
  }
  if (body.calendarId !== void 0 && body.calendarId !== cal.id && !calendarCanEditEvents(body.calendarId, calendarPermissions)) {
    return badRequest("target calendar not found or read-only");
  }
  const ownerUserId = await findAccountOwnerUserId(cal.accountId);
  if (!ownerUserId) return notFound("event not found");
  let calendarAccountId = null;
  let calendarIdsToSync = [];
  let failReason = null;
  await mutateOwnerStore(ownerUserId, (s) => {
    const ev2 = s.events.find((e) => e.id === id);
    if (!ev2) {
      failReason = "not_found";
      return;
    }
    const liveCal = s.calendars.find((c) => c.id === ev2.calendarId);
    if (!liveCal || liveCal.readOnly) {
      failReason = "read_only";
      return;
    }
    calendarAccountId = liveCal.accountId;
    const oldCalendarId = ev2.calendarId;
    if (body.calendarId !== void 0 && body.calendarId !== ev2.calendarId) {
      const newCal = s.calendars.find((c) => c.id === body.calendarId);
      if (!newCal) {
        failReason = "bad_calendar";
        return;
      }
      if (newCal.readOnly) {
        failReason = "bad_calendar";
        return;
      }
      if (ev2.remoteHref && ev2.syncState !== "local_new") {
        ev2.pendingRemoteDelete = {
          calendarId: oldCalendarId,
          remoteHref: ev2.remoteHref,
          remoteEtag: ev2.remoteEtag ?? ""
        };
      }
      ev2.calendarId = body.calendarId;
      ev2.remoteHref = void 0;
      ev2.remoteEtag = void 0;
      ev2.syncState = "local_new";
      calendarIdsToSync = [oldCalendarId, body.calendarId];
    } else {
      calendarIdsToSync = [ev2.calendarId];
    }
    if (body.summary !== void 0) ev2.summary = body.summary;
    if (body.description !== void 0) ev2.description = body.description;
    if (body.location !== void 0) ev2.location = body.location;
    const times = normalizeEventTimes({
      dtstart: body.dtstart ?? ev2.dtstart,
      dtend: body.dtend ?? ev2.dtend,
      allDay: body.allDay ?? ev2.allDay
    });
    if (body.dtstart !== void 0) ev2.dtstart = times.dtstart;
    if (body.dtend !== void 0) ev2.dtend = times.dtend;
    if (body.allDay !== void 0) ev2.allDay = body.allDay;
    if (body.rrule !== void 0) ev2.rrule = body.rrule;
    ev2.localModifiedAt = nowIso();
    ev2.icalData = buildVcalendar({
      uid: ev2.uid,
      summary: ev2.summary,
      description: ev2.description,
      location: ev2.location,
      dtstart: ev2.dtstart,
      dtend: ev2.dtend,
      allDay: ev2.allDay,
      rrule: ev2.rrule,
      lastModifiedIso: ev2.localModifiedAt
    });
    if (ev2.syncState === "synced") ev2.syncState = "local_modified";
  });
  if (failReason === "not_found") return notFound("event not found");
  if (failReason === "read_only") return notFound("event not found or its calendar is read-only");
  if (failReason === "bad_calendar") return badRequest("target calendar not found or read-only");
  const syncError = calendarAccountId ? await syncAfterMutation(calendarAccountId, { calendarIds: calendarIdsToSync }) : void 0;
  const after = await readOwnerStore(ownerUserId);
  const ev = after.events.find((e) => e.id === id);
  if (!ev) return notFound("event not found");
  const payload = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== "synced" && !syncError
  };
  return ok(payload);
}
async function handleEventDelete(id, viewer) {
  const { store, calendarPermissions, calendars } = await loadViewer(viewer);
  const existing = store.events.find((e) => e.id === id);
  if (!existing) return notFound("event not found");
  const cal = calendars.find((c) => c.id === existing.calendarId);
  if (!cal || cal.readOnly) return notFound("event not found or its calendar is read-only");
  if (!calendarCanEditEvents(cal.id, calendarPermissions)) {
    return forbidden("not allowed to delete this event");
  }
  const ownerUserId = await findAccountOwnerUserId(cal.accountId);
  if (!ownerUserId) return notFound("event not found");
  let triggerAccountId = null;
  let calendarIdToSync = null;
  let found = false;
  await mutateOwnerStore(ownerUserId, (s) => {
    const idx = s.events.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const ev = s.events[idx];
    const liveCal = s.calendars.find((c) => c.id === ev.calendarId);
    if (!liveCal || liveCal.readOnly) return;
    found = true;
    triggerAccountId = liveCal.accountId;
    calendarIdToSync = ev.calendarId;
    if (ev.syncState === "local_new") {
      s.events.splice(idx, 1);
    } else {
      ev.syncState = "local_deleted";
      ev.localModifiedAt = nowIso();
    }
  });
  if (!found) return notFound("event not found or its calendar is read-only");
  const syncError = triggerAccountId ? await syncAfterMutation(triggerAccountId, {
    calendarIds: calendarIdToSync ? [calendarIdToSync] : void 0
  }) : void 0;
  return ok({ ok: true, syncError });
}
async function handleConflictsGet(viewer) {
  const { store, calendars } = await loadViewer(viewer);
  const visibleIds = new Set(
    calendars.filter((c) => c.visible && !c.readOnly).map((c) => c.id)
  );
  const conflicts = store.events.filter((e) => e.syncState === "conflict" && visibleIds.has(e.calendarId)).map((e) => {
    const cal = calendars.find((c) => c.id === e.calendarId);
    return { ...e, calendarName: cal?.name, calendarColor: cal?.color };
  });
  return ok(conflicts);
}
async function handleConflictResolvePost(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (body.side !== "local" && body.side !== "remote") return badRequest("side must be 'local' or 'remote'");
  const { store, calendarPermissions, calendars } = await loadViewer(viewer);
  const existing = store.events.find((e) => e.id === id);
  if (!existing) return notFound("no conflict on this event");
  const cal = calendars.find((c) => c.id === existing.calendarId);
  if (!cal || cal.readOnly) return notFound("no conflict on this event");
  if (!calendarCanEditEvents(cal.id, calendarPermissions)) {
    return forbidden("not allowed to resolve this conflict");
  }
  const ownerUserId = await findAccountOwnerUserId(cal.accountId);
  if (!ownerUserId) return notFound("no conflict on this event");
  let found = false;
  let triggerAccountId = null;
  let resolution = null;
  await mutateOwnerStore(ownerUserId, (s) => {
    const idx = s.events.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const ev = s.events[idx];
    if (ev.syncState !== "conflict") return;
    found = true;
    const liveCal = s.calendars.find((c) => c.id === ev.calendarId);
    triggerAccountId = liveCal?.accountId ?? null;
    if (body.side === "remote") {
      if (!ev.conflictRemoteIcal) {
        s.events.splice(idx, 1);
        resolution = "deleted_locally";
        return;
      }
      const parsed = parseVcalendar(ev.conflictRemoteIcal)[0];
      if (!parsed) return;
      Object.assign(ev, {
        icalData: ev.conflictRemoteIcal,
        summary: parsed.summary,
        description: parsed.description,
        location: parsed.location,
        dtstart: parsed.dtstart,
        dtend: parsed.dtend,
        allDay: parsed.allDay,
        rrule: parsed.rrule,
        syncState: "synced",
        conflictRemoteIcal: void 0,
        localModifiedAt: nowIso()
      });
      resolution = "remote_kept";
    } else {
      ev.syncState = "local_modified";
      ev.conflictRemoteIcal = void 0;
      ev.localModifiedAt = nowIso();
      resolution = "local_will_overwrite";
    }
  });
  if (!found) return notFound("no conflict on this event");
  if (resolution === "local_will_overwrite" && triggerAccountId) {
    runSync(triggerAccountId).catch(() => void 0);
  }
  return ok({ ok: true, resolution });
}
async function calendarServerHandler(ctx) {
  const viewer = resolveCalendarViewer(ctx.request);
  if (!viewer) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const method = ctx.request.method.toUpperCase();
  const path = ctx.path;
  const [a, b, c] = path;
  if (a === "share-users" && method === "GET" && path.length === 1) {
    return handleShareUsersGet(viewer);
  }
  if (a === "summary" && method === "GET" && path.length === 1) return handleSummaryGet(viewer);
  if (a === "status" && method === "GET" && path.length === 1) return handleStatusGet(viewer);
  if (a === "accounts" && path.length === 1) {
    if (method === "GET") return handleAccountsGet(viewer);
    if (method === "POST") return handleAccountsPost(ctx.request, viewer);
  }
  if (a === "accounts" && b && path.length === 2) {
    if (method === "PUT") return handleAccountPut(ctx.request, b, viewer);
    if (method === "DELETE") return handleAccountDelete(b, viewer);
  }
  if (a === "accounts" && b && c === "sync" && path.length === 3 && method === "POST") {
    return handleAccountSyncPost(b, viewer);
  }
  if (a === "accounts" && b && c === "test" && path.length === 3 && method === "POST") {
    return handleAccountTestPost(b, viewer);
  }
  if (a === "calendars" && path.length === 1 && method === "GET") return handleCalendarsGet(viewer);
  if (a === "calendars" && b && path.length === 2 && method === "PUT") {
    return handleCalendarPut(ctx.request, b, viewer);
  }
  if (a === "events" && path.length === 1) {
    if (method === "GET") return handleEventsGet(ctx.request, viewer);
    if (method === "POST") return handleEventsPost(ctx.request, viewer);
  }
  if (a === "events" && b && path.length === 2) {
    if (method === "PUT") return handleEventPut(ctx.request, b, viewer);
    if (method === "DELETE") return handleEventDelete(b, viewer);
  }
  if (a === "conflicts" && path.length === 1 && method === "GET") return handleConflictsGet(viewer);
  if (a === "conflicts" && b && path.length === 2 && method === "POST") {
    return handleConflictResolvePost(ctx.request, b, viewer);
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: path.join("/") },
    { status: 404 }
  );
}
var server_default = calendarServerHandler;
export {
  calendarServerHandler,
  server_default as default
};
