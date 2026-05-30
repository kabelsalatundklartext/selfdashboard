// plugins-pack/tasks/lib/crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
var KEY_LEN = 32;
var TAG_LEN = 16;
var cachedKey = null;
function resolveAppDataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
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
  const keyFile = join(resolveAppDataDir(), ".calendar-key");
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

// plugins-pack/tasks/lib/store.ts
import {
  existsSync as existsSync2,
  mkdirSync,
  readdirSync,
  readFileSync as readFileSync2,
  renameSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { join as join2 } from "node:path";

// plugins-pack/tasks/lib/types.ts
var STORE_VERSION = 2;
var EMPTY_STORE = {
  version: STORE_VERSION,
  accounts: [],
  lists: [],
  tasks: [],
  syncLog: []
};
function isCalDavConfig(config) {
  return "url" in config && "passwordEncrypted" in config;
}
function isGoogleConfig(config) {
  return "clientSecretEncrypted" in config && !("url" in config) && !("tenantId" in config);
}
function isMicrosoftConfig(config) {
  return "clientSecretEncrypted" in config && !("url" in config) && "tenantId" in config;
}
function isOAuthProvider(provider) {
  return provider === "google" || provider === "microsoft";
}
function normalizeAccount(account) {
  if (account.provider && account.config) return account;
  const legacy = account;
  return {
    ...legacy,
    provider: "caldav",
    config: legacy.config
  };
}

// plugins-pack/tasks/lib/store.ts
function resolveAppDataDir2() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join2(process.cwd(), "data");
}
function ensureDir(dir) {
  if (!existsSync2(dir)) mkdirSync(dir, { recursive: true });
}
function usersDataDir() {
  return join2(resolveAppDataDir2(), "users");
}
function userStorePath(userId) {
  return join2(usersDataDir(), userId, "tasks", "store.json");
}
var chain = Promise.resolve();
function withLock(fn) {
  const next = chain.then(fn);
  chain = next.catch(() => void 0);
  return next;
}
function readSyncFromPath(path) {
  if (!existsSync2(path)) return structuredClone(EMPTY_STORE);
  try {
    const raw = readFileSync2(path, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: (parsed.accounts ?? []).map((a) => normalizeAccount(a)),
      lists: parsed.lists ?? [],
      tasks: parsed.tasks ?? [],
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
  ensureDir(join2(path, ".."));
  const tmp = path + ".tmp";
  writeFileSync2(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, path);
}
function listTasksOwnerUserIds() {
  const root = usersDataDir();
  if (!existsSync2(root)) return [];
  const ids = [];
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (existsSync2(userStorePath(ent.name))) ids.push(ent.name);
  }
  return ids;
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
async function findAccountOwnerUserId(accountId) {
  for (const userId of listTasksOwnerUserIds()) {
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

// plugins-pack/tasks/lib/api-helpers.ts
function toAccountView(a, lists) {
  const base = {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    listCount: lists.filter((l) => l.accountId === a.id).length
  };
  if (a.provider === "google" && isGoogleConfig(a.config)) {
    return {
      ...base,
      endpoint: "Google Tasks",
      googleConnected: Boolean(a.config.refreshTokenEncrypted),
      googleClientId: a.config.clientId
    };
  }
  if (a.provider === "microsoft" && isMicrosoftConfig(a.config)) {
    return {
      ...base,
      endpoint: "Microsoft To Do",
      microsoftConnected: Boolean(a.config.refreshTokenEncrypted),
      microsoftClientId: a.config.clientId,
      microsoftTenantId: a.config.tenantId
    };
  }
  if (isCalDavConfig(a.config)) {
    let endpoint = "";
    try {
      endpoint = new URL(a.config.url).host;
    } catch {
      endpoint = a.config.url;
    }
    return {
      ...base,
      endpoint,
      url: a.config.url,
      username: a.config.username
    };
  }
  return base;
}
function buildAccount(body, ownerUserId) {
  const provider = body.provider ?? (body.microsoft ? "microsoft" : body.google ? "google" : "caldav");
  if (provider === "google") {
    const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim();
    const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim();
    const clientId = body.google?.clientId?.trim() || envId || "";
    const clientSecret = body.google?.clientSecret || envSecret || "";
    if (!clientId || !clientSecret) {
      throw new Error("Google Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)");
    }
    const config = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret)
    };
    return {
      id: newId("acc"),
      name: body.name.trim() || "Google Tasks",
      provider: "google",
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId
    };
  }
  if (provider === "microsoft") {
    const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim();
    const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim();
    const clientId = body.microsoft?.clientId?.trim() || envId || "";
    const clientSecret = body.microsoft?.clientSecret || envSecret || "";
    if (!clientId || !clientSecret) {
      throw new Error("Microsoft Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)");
    }
    const config = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret),
      tenantId: body.microsoft?.tenantId?.trim() || "common"
    };
    return {
      id: newId("acc"),
      name: body.name.trim() || "Microsoft To Do",
      provider: "microsoft",
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId
    };
  }
  if (!body.caldav?.url || !body.caldav.username || !body.caldav.password) {
    throw new Error("CalDAV URL, Benutzername und Passwort erforderlich");
  }
  return {
    id: newId("acc"),
    name: body.name.trim() || "CalDAV",
    provider: "caldav",
    config: {
      url: body.caldav.url.trim(),
      username: body.caldav.username.trim(),
      passwordEncrypted: encrypt(body.caldav.password),
      verifySsl: body.caldav.verifySsl !== false
    },
    enabled: true,
    createdAt: nowIso(),
    ownerUserId
  };
}
function applyAccountUpdate(a, body) {
  if (body.name?.trim()) a.name = body.name.trim();
  if (typeof body.enabled === "boolean") a.enabled = body.enabled;
  if (a.provider === "caldav" && body.caldav && isCalDavConfig(a.config)) {
    if (body.caldav.url?.trim()) a.config.url = body.caldav.url.trim();
    if (body.caldav.username?.trim()) a.config.username = body.caldav.username.trim();
    if (body.caldav.password) a.config.passwordEncrypted = encrypt(body.caldav.password);
    if (typeof body.caldav.verifySsl === "boolean") a.config.verifySsl = body.caldav.verifySsl;
  }
  if (a.provider === "google" && body.google && isGoogleConfig(a.config)) {
    if (body.google.clientId?.trim()) a.config.clientId = body.google.clientId.trim();
    if (body.google.clientSecret) a.config.clientSecretEncrypted = encrypt(body.google.clientSecret);
  }
  if (a.provider === "microsoft" && body.microsoft && isMicrosoftConfig(a.config)) {
    if (body.microsoft.clientId?.trim()) a.config.clientId = body.microsoft.clientId.trim();
    if (body.microsoft.clientSecret) a.config.clientSecretEncrypted = encrypt(body.microsoft.clientSecret);
    if (body.microsoft.tenantId?.trim()) a.config.tenantId = body.microsoft.tenantId.trim();
  }
}
function buildSummary(store) {
  const visibleLists = store.lists.filter((l) => l.visible);
  const visibleIds = new Set(visibleLists.map((l) => l.id));
  const active = store.tasks.filter((t) => visibleIds.has(t.listId) && t.syncState !== "local_deleted");
  const open = active.filter((t) => !t.completed).length;
  const completed = active.filter((t) => t.completed).length;
  const pendingSync = active.filter(
    (t) => t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted"
  ).length;
  const lists = visibleLists.map((l) => ({
    id: l.id,
    name: l.name,
    open: active.filter((t) => t.listId === l.id && !t.completed).length
  }));
  return { open, completed, pendingSync, lists };
}
function taskToView(t, list) {
  return {
    id: t.id,
    listId: t.listId,
    listName: list?.name,
    uid: t.uid,
    summary: t.summary,
    completed: t.completed,
    due: t.due,
    syncState: t.syncState,
    readOnly: list?.readOnly ?? false
  };
}
function ok(data, status = 200) {
  return Response.json(data, { status });
}
function badRequest(msg) {
  return Response.json({ error: msg }, { status: 400 });
}
function forbidden(msg) {
  return Response.json({ error: msg }, { status: 403 });
}
function notFound(msg) {
  return Response.json({ error: msg }, { status: 404 });
}
function html(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// plugins-pack/tasks/lib/google.ts
var TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
var GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
var TASKS_API = "https://tasks.googleapis.com/tasks/v1";
var emptyResult = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function cfg(account) {
  if (account.provider !== "google" || !isGoogleConfig(account.config)) {
    throw new Error("not a google account");
  }
  return account.config;
}
function resolveGoogleClientCredentials(config) {
  const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim();
  const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim();
  const clientId = config.clientId?.trim() || envId || "";
  let clientSecret = "";
  if (config.clientSecretEncrypted) {
    try {
      clientSecret = decrypt(config.clientSecretEncrypted);
    } catch {
      clientSecret = "";
    }
  }
  if (!clientSecret && envSecret) clientSecret = envSecret;
  if (!clientId || !clientSecret) {
    throw new Error("Google Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_GOOGLE_TASKS_*)");
  }
  return { clientId, clientSecret };
}
function googleRedirectUri(req) {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim();
  if (env) return `${env.replace(/\/+$/, "")}/api/plugins/tasks/google/callback`;
  return `${new URL(req.url).origin}/api/plugins/tasks/google/callback`;
}
function buildGoogleAuthUrl(req, account, state) {
  const { clientId } = resolveGoogleClientCredentials(cfg(account));
  const redirectUri = googleRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: TASKS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}
async function tokenRequest(body) {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString()
  });
  return res.json();
}
async function exchangeGoogleCode(account, code, redirectUri) {
  const { clientId, clientSecret } = resolveGoogleClientCredentials(cfg(account));
  const json = await tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token exchange failed");
  }
  if (!json.refresh_token) {
    throw new Error("Kein Refresh-Token \u2014 Google-Konto erneut verbinden (prompt=consent).");
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString();
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
}
async function refreshGoogleAccessToken(account) {
  const c = cfg(account);
  const { clientId, clientSecret } = resolveGoogleClientCredentials(c);
  if (!c.refreshTokenEncrypted) throw new Error("Google nicht verbunden");
  const refreshToken = decrypt(c.refreshTokenEncrypted);
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString()
  };
}
async function ensureGoogleAccessToken(account) {
  const c = cfg(account);
  if (c.accessTokenEncrypted && c.accessTokenExpiresAt && new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 6e4) {
    return decrypt(c.accessTokenEncrypted);
  }
  const fresh = await refreshGoogleAccessToken(account);
  c.accessTokenEncrypted = encrypt(fresh.accessToken);
  c.accessTokenExpiresAt = fresh.expiresAt;
  return fresh.accessToken;
}
function applyGoogleTokens(account, tokens) {
  const c = cfg(account);
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken);
  c.accessTokenEncrypted = encrypt(tokens.accessToken);
  c.accessTokenExpiresAt = tokens.expiresAt;
}
async function googleFetch(account, path, init) {
  const token = await ensureGoogleAccessToken(account);
  const url = path.startsWith("http") ? path : `${TASKS_API}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers
    }
  });
}
async function testGoogleAccount(account) {
  try {
    if (!cfg(account).refreshTokenEncrypted) {
      return { ok: false, error: "Google noch nicht verbunden \u2014 \u201EMit Google verbinden\u201C klicken." };
    }
    const lists = await discoverGoogleTaskLists(account);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function discoverGoogleTaskLists(account) {
  const res = await googleFetch(account, "/users/@me/lists");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return (json.items ?? []).filter((l) => l.id).map((l) => ({ remoteId: l.id, name: l.title?.trim() || l.id, readOnly: false }));
}
function googleUid(taskId) {
  return `google-${taskId}`;
}
function parseGoogleDue(due) {
  if (!due) return void 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(due)) return due.slice(0, 10);
  return due;
}
async function syncGoogleTaskList(account, list, store, pushOnly = false) {
  const pull = pushOnly ? emptyResult() : await pullGoogleList(account, list, store);
  const push = await pushGoogleList(account, list, store);
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors]
  };
}
async function pullGoogleList(account, list, store) {
  const result = emptyResult();
  const res = await googleFetch(
    account,
    `/lists/${encodeURIComponent(list.remoteId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`
  );
  const json = await res.json();
  if (!res.ok) {
    result.errors.push(json.error?.message || `HTTP ${res.status}`);
    return result;
  }
  for (const remote of json.items ?? []) {
    if (!remote.id) continue;
    const uid = googleUid(remote.id);
    const completed = remote.status === "completed";
    const summary = remote.title?.trim() || "\u2014";
    const etag = remote.updated || "";
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${uid}`,
        listId: list.id,
        uid,
        remoteHref: remote.id,
        remoteEtag: etag,
        icalData: "",
        summary,
        completed,
        due: parseGoogleDue(remote.due),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.updated,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== etag) {
        local.syncState = "conflict";
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== etag) {
      local.summary = summary;
      local.completed = completed;
      local.due = parseGoogleDue(remote.due);
      local.remoteHref = remote.id;
      local.remoteEtag = etag;
      local.remoteModifiedAt = remote.updated;
      local.syncState = "synced";
      result.updated++;
    }
  }
  return result;
}
async function pushGoogleList(account, list, store) {
  const result = emptyResult();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          const res = await googleFetch(
            account,
            `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
            { method: "DELETE" }
          );
          if (!res.ok && res.status !== 404) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error?.message || `HTTP ${res.status}`);
          }
        }
        store.tasks = store.tasks.filter((t) => t.id !== task.id);
        result.deleted++;
        continue;
      }
      const body = {
        title: task.summary,
        status: task.completed ? "completed" : "needsAction"
      };
      if (task.due) {
        body.due = /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? `${task.due}T00:00:00.000Z` : task.due;
      }
      if (task.syncState === "local_new") {
        const res = await googleFetch(account, `/lists/${encodeURIComponent(list.remoteId)}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const json = await res.json();
        if (!res.ok || !json.id) throw new Error(json.error?.message || `HTTP ${res.status}`);
        task.uid = googleUid(json.id);
        task.remoteHref = json.id;
        task.remoteEtag = json.updated || nowIso();
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified" && task.remoteHref) {
        const res = await googleFetch(
          account,
          `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
        task.remoteEtag = json.updated || nowIso();
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return result;
}

// plugins-pack/tasks/lib/microsoft.ts
var SCOPES = "Tasks.ReadWrite offline_access";
var GRAPH = "https://graph.microsoft.com/v1.0";
var emptyResult2 = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function cfg2(account) {
  if (account.provider !== "microsoft" || !isMicrosoftConfig(account.config)) {
    throw new Error("not a microsoft account");
  }
  return account.config;
}
function tenantId(config) {
  return config.tenantId?.trim() || "common";
}
function authBase(config) {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId(config))}/oauth2/v2.0`;
}
function resolveMicrosoftClientCredentials(config) {
  const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim();
  const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim();
  const clientId = config.clientId?.trim() || envId || "";
  let clientSecret = "";
  if (config.clientSecretEncrypted) {
    try {
      clientSecret = decrypt(config.clientSecretEncrypted);
    } catch {
      clientSecret = "";
    }
  }
  if (!clientSecret && envSecret) clientSecret = envSecret;
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_MICROSOFT_TASKS_*)");
  }
  return { clientId, clientSecret };
}
function microsoftRedirectUri(req) {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim();
  if (env) return `${env.replace(/\/+$/, "")}/api/plugins/tasks/microsoft/callback`;
  return `${new URL(req.url).origin}/api/plugins/tasks/microsoft/callback`;
}
function buildMicrosoftAuthUrl(req, account, state) {
  const c = cfg2(account);
  const { clientId } = resolveMicrosoftClientCredentials(c);
  const redirectUri = microsoftRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    response_mode: "query",
    state,
    prompt: "consent"
  });
  return `${authBase(c)}/authorize?${params.toString()}`;
}
async function tokenRequest2(config, body) {
  const { clientId, clientSecret } = resolveMicrosoftClientCredentials(config);
  const res = await fetch(`${authBase(config)}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: clientId, client_secret: clientSecret }).toString()
  });
  return res.json();
}
async function exchangeMicrosoftCode(account, code, redirectUri) {
  const c = cfg2(account);
  const json = await tokenRequest2(c, {
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token exchange failed");
  }
  if (!json.refresh_token) {
    throw new Error("Kein Refresh-Token \u2014 Microsoft-Konto erneut verbinden (offline_access).");
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString();
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
}
async function refreshMicrosoftAccessToken(account) {
  const c = cfg2(account);
  if (!c.refreshTokenEncrypted) throw new Error("Microsoft nicht verbunden");
  const refreshToken = decrypt(c.refreshTokenEncrypted);
  const json = await tokenRequest2(c, {
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPES
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString()
  };
}
async function ensureMicrosoftAccessToken(account) {
  const c = cfg2(account);
  if (c.accessTokenEncrypted && c.accessTokenExpiresAt && new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 6e4) {
    return decrypt(c.accessTokenEncrypted);
  }
  const fresh = await refreshMicrosoftAccessToken(account);
  c.accessTokenEncrypted = encrypt(fresh.accessToken);
  c.accessTokenExpiresAt = fresh.expiresAt;
  return fresh.accessToken;
}
function applyMicrosoftTokens(account, tokens) {
  const c = cfg2(account);
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken);
  c.accessTokenEncrypted = encrypt(tokens.accessToken);
  c.accessTokenExpiresAt = tokens.expiresAt;
}
async function graphFetch(account, path, init) {
  const token = await ensureMicrosoftAccessToken(account);
  const url = path.startsWith("http") ? path : `${GRAPH}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers
    }
  });
}
async function graphJson(account, path, init) {
  const res = await graphFetch(account, path, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}
async function fetchAllPages(account, path) {
  const out = [];
  let next = path.startsWith("http") ? path : `${GRAPH}${path}`;
  while (next) {
    const json = await graphJson(account, next);
    out.push(...json.value ?? []);
    next = json["@odata.nextLink"];
  }
  return out;
}
async function testMicrosoftAccount(account) {
  try {
    if (!cfg2(account).refreshTokenEncrypted) {
      return { ok: false, error: "Microsoft noch nicht verbunden \u2014 \u201EMit Microsoft verbinden\u201C klicken." };
    }
    const lists = await discoverMicrosoftTaskLists(account);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function discoverMicrosoftTaskLists(account) {
  const lists = await fetchAllPages(account, "/me/todo/lists");
  return lists.filter((l) => l.id).map((l) => ({
    remoteId: l.id,
    name: l.displayName?.trim() || l.id,
    readOnly: l.isOwner === false
  }));
}
function msUid(taskId) {
  return `microsoft-${taskId}`;
}
function parseMsDue(due) {
  if (!due?.dateTime) return void 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(due.dateTime)) return due.dateTime.slice(0, 10);
  return due.dateTime;
}
function msDueBody(due) {
  if (!due) return {};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(due) ? `${due}T00:00:00.0000000` : due;
  return { dueDateTime: { dateTime: date, timeZone: "UTC" } };
}
async function syncMicrosoftTaskList(account, list, store, pushOnly = false) {
  const pull = pushOnly ? emptyResult2() : await pullMicrosoftList(account, list, store);
  const push = await pushMicrosoftList(account, list, store);
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors]
  };
}
async function pullMicrosoftList(account, list, store) {
  const result = emptyResult2();
  let remotes;
  try {
    remotes = await fetchAllPages(
      account,
      `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks?$top=100`
    );
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
    return result;
  }
  for (const remote of remotes) {
    if (!remote.id) continue;
    const uid = msUid(remote.id);
    const completed = remote.status === "completed";
    const summary = remote.title?.trim() || "\u2014";
    const etag = remote.lastModifiedDateTime || "";
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${uid}`,
        listId: list.id,
        uid,
        remoteHref: remote.id,
        remoteEtag: etag,
        icalData: "",
        summary,
        completed,
        due: parseMsDue(remote.dueDateTime),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.lastModifiedDateTime,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== etag) {
        local.syncState = "conflict";
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== etag) {
      local.summary = summary;
      local.completed = completed;
      local.due = parseMsDue(remote.dueDateTime);
      local.remoteHref = remote.id;
      local.remoteEtag = etag;
      local.remoteModifiedAt = remote.lastModifiedDateTime;
      local.syncState = "synced";
      result.updated++;
    }
  }
  return result;
}
async function pushMicrosoftList(account, list, store) {
  const result = emptyResult2();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  const listPath = `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks`;
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          const res = await graphFetch(
            account,
            `${listPath}/${encodeURIComponent(task.remoteHref)}`,
            { method: "DELETE" }
          );
          if (!res.ok && res.status !== 404) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error?.message || `HTTP ${res.status}`);
          }
        }
        store.tasks = store.tasks.filter((t) => t.id !== task.id);
        result.deleted++;
        continue;
      }
      const body = {
        title: task.summary,
        status: task.completed ? "completed" : "notStarted",
        ...msDueBody(task.due)
      };
      if (task.syncState === "local_new") {
        const json = await graphJson(account, listPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!json.id) throw new Error("create failed");
        task.uid = msUid(json.id);
        task.remoteHref = json.id;
        task.remoteEtag = json.lastModifiedDateTime || nowIso();
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified" && task.remoteHref) {
        const json = await graphJson(
          account,
          `${listPath}/${encodeURIComponent(task.remoteHref)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        task.remoteEtag = json.lastModifiedDateTime || nowIso();
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return result;
}

// plugins-pack/tasks/lib/oauth-pending.ts
import { randomBytes as randomBytes2 } from "node:crypto";
var pending = /* @__PURE__ */ new Map();
var TTL_MS = 15 * 60 * 1e3;
function createOAuthState(userId, accountId) {
  const state = randomBytes2(24).toString("hex");
  pending.set(state, { userId, accountId, expiresAt: Date.now() + TTL_MS });
  return state;
}
function consumeOAuthState(state) {
  const row = pending.get(state);
  if (!row) return null;
  pending.delete(state);
  if (row.expiresAt < Date.now()) return null;
  return row;
}

// plugins-pack/tasks/lib/vtodo.ts
import ICAL from "ical.js";
import { randomUUID } from "node:crypto";
function newUid() {
  return `${randomUUID()}@selfdashboard`;
}
function parseStatus(comp) {
  const status = comp.getFirstPropertyValue("status");
  if (typeof status === "string" && status.toUpperCase() === "COMPLETED") return true;
  const completed = comp.getFirstPropertyValue("completed");
  return Boolean(completed);
}
function parseDue(comp) {
  const due = comp.getFirstPropertyValue("due");
  if (!due) return void 0;
  if (due instanceof ICAL.Time) {
    if (due.isDate) return due.toString().slice(0, 10);
    return due.toJSDate().toISOString();
  }
  return String(due);
}
function parseLastModified(comp) {
  const lm = comp.getFirstPropertyValue("last-modified");
  if (lm instanceof ICAL.Time) return lm.toJSDate().toISOString();
  return void 0;
}
function parseVcalendarTodos(data) {
  if (!data?.trim()) return [];
  try {
    const jcal = ICAL.parse(data);
    const comp = new ICAL.Component(jcal);
    const out = [];
    for (const sub of comp.getAllSubcomponents("vtodo")) {
      const uidProp = sub.getFirstPropertyValue("uid");
      const uid = typeof uidProp === "string" ? uidProp : "";
      if (!uid) continue;
      const summaryProp = sub.getFirstPropertyValue("summary");
      out.push({
        uid,
        summary: typeof summaryProp === "string" ? summaryProp.trim() : "",
        completed: parseStatus(sub),
        due: parseDue(sub),
        remoteModifiedIso: parseLastModified(sub)
      });
    }
    return out;
  } catch {
    return [];
  }
}
function buildVtodo(input) {
  const cal = new ICAL.Component(["vcalendar", [], []]);
  cal.updatePropertyWithValue("prodid", "-//SelfDashboard//Tasks Plugin//EN");
  cal.updatePropertyWithValue("version", "2.0");
  const todo = new ICAL.Component("vtodo");
  todo.updatePropertyWithValue("uid", input.uid);
  todo.updatePropertyWithValue("dtstamp", ICAL.Time.now());
  todo.updatePropertyWithValue("summary", input.summary || "\u2014");
  todo.updatePropertyWithValue("status", input.completed ? "COMPLETED" : "NEEDS-ACTION");
  if (input.completed) {
    todo.updatePropertyWithValue("completed", ICAL.Time.now());
  }
  if (input.due) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.due)) {
      const t = ICAL.Time.fromDateString(input.due);
      t.isDate = true;
      todo.updatePropertyWithValue("due", t);
    } else {
      todo.updatePropertyWithValue("due", ICAL.Time.fromJSDate(new Date(input.due), true));
    }
  }
  if (input.lastModifiedIso) {
    todo.updatePropertyWithValue("last-modified", ICAL.Time.fromJSDate(new Date(input.lastModifiedIso), true));
  }
  cal.addSubcomponent(todo);
  return cal.toString();
}

// plugins-pack/tasks/lib/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/tasks/lib/caldav.ts
import { createDAVClient } from "tsdav";

// plugins-pack/_shared/ssrf-lite.ts
import net from "net";
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
  }
  return false;
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

// plugins-pack/tasks/lib/caldav-privileges.ts
function heuristicCalendarReadOnly(name, url) {
  const n = name.toLowerCase().trim();
  const u = url.toLowerCase();
  const blob = `${n} ${u}`;
  if (/feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) return true;
  return false;
}
async function caldavHasWritePrivilege(client, calendarUrl) {
  try {
    const responses = await client.propfind({
      url: calendarUrl,
      props: { "current-user-privilege-set": { privilege: {} } },
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
function formatCalDavPushError(listName, uid, msg) {
  if (msg.includes("403")) {
    return `Liste \u201E${listName}\u201C: kein Schreibzugriff (HTTP 403).`;
  }
  return `${listName}: ${msg}`;
}

// plugins-pack/tasks/lib/caldav-url.ts
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

// plugins-pack/tasks/lib/caldav.ts
var emptyResult3 = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function mergeResult(a, b) {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    deleted: a.deleted + b.deleted,
    conflicts: a.conflicts + b.conflicts,
    errors: [...a.errors, ...b.errors]
  };
}
function decryptPassword(encrypted) {
  try {
    return decrypt(encrypted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Passwort kann nicht entschl\xFCsselt werden \u2014 Konto bearbeiten und Passwort erneut speichern. (${msg})`
    );
  }
}
async function buildClient(account) {
  if (!isCalDavConfig(account.config)) throw new Error("not a caldav account");
  const cfg3 = account.config;
  const password = decryptPassword(cfg3.passwordEncrypted);
  const serverUrl = normalizeCaldavServerUrl(cfg3.url);
  try {
    assertSafeOutboundUrl(serverUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`CalDAV URL blocked: ${msg}`);
  }
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg3.username, password },
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
function looksLikeTaskList(cal, name) {
  const blob = JSON.stringify(cal).toUpperCase();
  if (blob.includes("VTODO") && !blob.includes("VEVENT")) return true;
  const n = name.toLowerCase();
  if (/task|aufgabe|todo|inbox|erledigt|completed|liste/.test(n)) return true;
  return false;
}
async function discoverCaldavTaskLists(account) {
  const client = await buildClient(account);
  const calendars = await client.fetchCalendars();
  const out = [];
  for (const c of calendars) {
    const name = caldavDisplayName(c);
    if (!looksLikeTaskList(c, name)) continue;
    const readOnly = await resolveCalendarReadOnly(client, name, c.url);
    out.push({ remoteId: c.url, name, readOnly });
  }
  return out;
}
async function getCaldavClientCache(account) {
  const client = await buildClient(account);
  const davCalendars = await client.fetchCalendars();
  return { client, davCalendars };
}
async function testCaldav(account) {
  try {
    const lists = await discoverTaskLists(account);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function syncTaskList(account, list, store, cache, pushOnly = false) {
  const client = cache?.client ?? await buildClient(account);
  const davCalendars = cache?.davCalendars ?? await client.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === list.remoteId);
  if (!davCal) {
    return { ...emptyResult3(), errors: [`remote list not found: ${list.remoteId}`] };
  }
  const pull = pushOnly ? emptyResult3() : await pullList(client, davCal, list, store);
  if (list.readOnly) return pull;
  const push = await pushList(client, davCal, list, store);
  return mergeResult(pull, push);
}
async function pullList(client, davCal, list, store) {
  const result = emptyResult3();
  let objects;
  try {
    const fetched = await client.fetchCalendarObjects({ calendar: davCal });
    objects = fetched.map((o) => ({ url: o.url, etag: o.etag ?? "", data: o.data ?? "" }));
  } catch (e) {
    result.errors.push(`fetch: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }
  for (const obj of objects) {
    const parsed = parseVcalendarTodos(obj.data);
    if (!parsed.length) continue;
    const remote = parsed[0];
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === remote.uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${remote.uid}`,
        listId: list.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary || "\u2014",
        completed: remote.completed,
        due: remote.due,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
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
        summary: remote.summary || local.summary,
        completed: remote.completed,
        due: remote.due,
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
async function pushList(client, davCal, list, store) {
  const result = emptyResult3();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          await client.deleteCalendarObject({
            calendarObject: { url: task.remoteHref, etag: task.remoteEtag ?? "", data: "" }
          });
        }
        const idx = store.tasks.findIndex((t) => t.id === task.id);
        if (idx >= 0) store.tasks.splice(idx, 1);
        result.deleted++;
        continue;
      }
      const ical = buildVtodo({
        uid: task.uid,
        summary: task.summary,
        completed: task.completed,
        due: task.due,
        lastModifiedIso: task.localModifiedAt
      });
      if (task.syncState === "local_new") {
        const filename = caldavObjectFilename(task.uid);
        const res = await client.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename
        });
        task.icalData = ical;
        task.remoteHref = res?.url ?? joinCollectionUrl(davCal.url, filename);
        task.remoteEtag = res?.etag ?? "";
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified") {
        await client.updateCalendarObject({
          calendarObject: {
            url: task.remoteHref,
            etag: task.remoteEtag ?? "",
            data: ical
          }
        });
        task.icalData = ical;
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("412")) {
        task.syncState = "conflict";
        result.conflicts++;
      } else {
        result.errors.push(formatCalDavPushError(list.name, task.uid, msg));
      }
    }
  }
  return result;
}

// plugins-pack/tasks/lib/sync.ts
var DEFAULT_INTERVAL_MS = parseInt(process.env.TASKS_SYNC_INTERVAL_SECONDS ?? process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? "300", 10) * 1e3;
var schedulerStarted = false;
var schedulerTimer = null;
async function discoverAccountLists(account) {
  if (account.provider === "google") return discoverGoogleTaskLists(account);
  if (account.provider === "microsoft") return discoverMicrosoftTaskLists(account);
  return discoverCaldavTaskLists(account);
}
async function testAccount(account) {
  if (account.provider === "google") return testGoogleAccount(account);
  if (account.provider === "microsoft") return testMicrosoftAccount(account);
  return testCaldav(account);
}
async function syncAfterMutation(accountId, opts) {
  const log = await runSync(accountId, { listIds: opts?.listIds, skipDiscover: true, pushOnly: true });
  return log.error ?? void 0;
}
async function listEnabledAccounts() {
  const out = [];
  for (const ownerUserId of listTasksOwnerUserIds()) {
    const store = await readUserStore(ownerUserId);
    for (const account of store.accounts) {
      if (account.enabled) out.push({ ownerUserId, account });
    }
  }
  return out;
}
async function runSync(accountId, opts) {
  const ownerUserId = await findAccountOwnerUserId(accountId);
  if (!ownerUserId) {
    return makeLogEntry(accountId, "not found", { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  const store = await readUserStore(ownerUserId);
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account || !account.enabled) {
    return makeLogEntry(accountId, "disabled or not found", { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  if (isOAuthProvider(account.provider) && !("refreshTokenEncrypted" in account.config && account.config.refreshTokenEncrypted)) {
    const label = account.provider === "microsoft" ? "Microsoft" : "Google";
    return makeLogEntry(accountId, `${label} nicht verbunden`, { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalConflicts = 0;
  const errors = [];
  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountLists(account);
      const discoveredIds = new Set(discovered.map((d) => d.remoteId));
      await mutateUserStore(ownerUserId, (s) => {
        for (const d of discovered) {
          let list = s.lists.find((l) => l.accountId === account.id && l.remoteId === d.remoteId);
          if (!list) {
            list = {
              id: newId("lst"),
              accountId: account.id,
              remoteId: d.remoteId,
              name: d.name,
              readOnly: d.readOnly,
              visible: true
            };
            s.lists.push(list);
          } else {
            list.name = d.name;
            list.readOnly = d.readOnly;
          }
        }
        const staleIds = new Set(
          s.lists.filter((l) => l.accountId === account.id && !discoveredIds.has(l.remoteId)).map((l) => l.id)
        );
        if (staleIds.size) {
          s.lists = s.lists.filter((l) => !staleIds.has(l.id));
          s.tasks = s.tasks.filter((t) => !staleIds.has(t.listId));
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`discover: ${msg}`);
      void logPluginApiFailure("tasks", "discover", msg, { accountId });
      const log2 = makeLogEntry(accountId, msg, { added: 0, updated: 0, deleted: 0, conflicts: 0 });
      await mutateUserStore(ownerUserId, (s) => {
        s.syncLog.unshift(log2);
        s.syncLog = s.syncLog.slice(0, 50);
        const acc = s.accounts.find((a) => a.id === accountId);
        if (acc) {
          acc.lastSyncAt = nowIso();
          acc.lastSyncStatus = "error";
          acc.lastSyncError = msg;
        }
      });
      return log2;
    }
  }
  let lists = (await readUserStore(ownerUserId)).lists.filter((l) => l.accountId === account.id);
  if (opts?.listIds?.length) {
    const want = new Set(opts.listIds);
    lists = lists.filter((l) => want.has(l.id));
  }
  let caldavCache;
  if (account.provider === "caldav" && lists.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account);
    } catch (e) {
      errors.push(`client: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const list of lists) {
    try {
      await mutateUserStore(ownerUserId, async (s) => {
        const live = s.lists.find((l) => l.id === list.id);
        const r = account.provider === "google" ? await syncGoogleTaskList(account, live, s, opts?.pushOnly) : account.provider === "microsoft" ? await syncMicrosoftTaskList(account, live, s, opts?.pushOnly) : await syncTaskList(account, live, s, caldavCache, opts?.pushOnly);
        totalAdded += r.added;
        totalUpdated += r.updated;
        totalDeleted += r.deleted;
        totalConflicts += r.conflicts;
        errors.push(...r.errors);
      });
    } catch (e) {
      errors.push(`${list.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const status = errors.length ? "error" : totalConflicts ? "conflict" : "ok";
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join("; ") : void 0,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts }
  );
  await mutateUserStore(ownerUserId, (s) => {
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
    void logPluginApiFailure("tasks", "sync", errors.join("; "), { accountId });
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
function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const tick = async () => {
    try {
      for (const { account } of await listEnabledAccounts()) {
        if (account.lastSyncAt && Date.now() - new Date(account.lastSyncAt).getTime() < DEFAULT_INTERVAL_MS / 2) {
          continue;
        }
        try {
          await runSync(account.id);
        } catch {
        }
      }
    } catch {
    }
    schedulerTimer = setTimeout(tick, DEFAULT_INTERVAL_MS);
  };
  schedulerTimer = setTimeout(tick, 8e3);
}
function stopScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer);
  schedulerStarted = false;
  schedulerTimer = null;
}

// plugins-pack/_shared/auth-lite.ts
import { mkdirSync as mkdirSync2 } from "fs";
import { join as join4 } from "path";
import Database from "better-sqlite3";

// plugins-pack/_shared/data-dir.ts
import { join as join3 } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join3(process.cwd(), "data");
}

// plugins-pack/_shared/auth-lite.ts
var db = null;
function authDbPath() {
  return join4(dataDir(), "auth", "auth.db");
}
function getAuthDb() {
  if (db) return db;
  const dir = join4(dataDir(), "auth");
  mkdirSync2(dir, { recursive: true });
  db = new Database(authDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
function countUsers() {
  const row = getAuthDb().prepare("SELECT COUNT(*) AS c FROM users").get();
  return row.c;
}
function needsSetup() {
  return countUsers() === 0;
}
function getUserById(id) {
  const row = getAuthDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? rowToUser(row) : null;
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

// plugins-pack/_shared/auth-guard-lite.ts
var AUTH_COOKIE = "sd_session";
function readSessionIdFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey?.trim() === AUTH_COOKIE) {
      const val = rest.join("=").trim();
      if (/^[a-f0-9]{64}$/.test(val)) return val;
      return null;
    }
  }
  return null;
}
function purgeExpiredSessions() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  getAuthDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}
function getSession(sessionId) {
  purgeExpiredSessions();
  const row = getAuthDb().prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!row) return null;
  if (row.expires_at <= (/* @__PURE__ */ new Date()).toISOString()) {
    getAuthDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  const user = getUserById(row.user_id);
  if (!user) {
    getAuthDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return {
    id: row.id,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: row.expires_at,
    mfaVerified: row.mfa_verified !== 0
  };
}
function getSessionFromRequest(req) {
  if (isAuthDisabled()) {
    return {
      id: "dev",
      userId: "dev",
      username: "dev",
      role: "admin",
      expiresAt: new Date(Date.now() + 864e5).toISOString(),
      mfaVerified: true
    };
  }
  if (needsSetup()) return null;
  const sessionId = readSessionIdFromCookieHeader(req.headers.get("cookie"));
  if (!sessionId) return null;
  return getSession(sessionId);
}

// plugins-pack/tasks/lib/viewer.ts
function resolveTasksViewer(req) {
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

// plugins-pack/tasks/server.ts
async function loadStore(viewer) {
  return readUserStore(viewer.userId);
}
async function handleSummaryGet(viewer) {
  const store = await loadStore(viewer);
  return ok(buildSummary(store));
}
async function handleStatusGet(viewer) {
  const store = await loadStore(viewer);
  const pending2 = store.tasks.filter(
    (t) => t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted"
  ).length;
  return ok({
    accounts: store.accounts.map((a) => toAccountView(a, store.lists)),
    lists: store.lists.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      name: l.name,
      visible: l.visible,
      readOnly: l.readOnly
    })),
    pendingChanges: pending2,
    recentRuns: store.syncLog.slice(0, 10)
  });
}
async function handleAccountsGet(viewer) {
  const store = await loadStore(viewer);
  return ok(store.accounts.map((a) => toAccountView(a, store.lists)));
}
async function handleAccountsPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.name) return badRequest("name required");
  let accountId = "";
  try {
    const account = buildAccount(body, viewer.userId);
    accountId = account.id;
    await mutateUserStore(viewer.userId, (s) => {
      s.accounts.push(account);
    });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "invalid body");
  }
  const createdAccount = (await readUserStore(viewer.userId)).accounts.find((a) => a.id === accountId);
  if (createdAccount && !isOAuthProvider(createdAccount.provider)) {
    runSync(accountId).catch(() => void 0);
  }
  const store = await readUserStore(viewer.userId);
  const created = store.accounts.find((a) => a.id === accountId);
  return ok(toAccountView(created, store.lists));
}
async function handleAccountPut(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateUserStore(viewer.userId, (s) => {
    const a = s.accounts.find((x) => x.id === id);
    if (!a) return;
    found = true;
    applyAccountUpdate(a, body);
  });
  if (!found) return notFound("account not found");
  runSync(id).catch(() => void 0);
  const store = await readUserStore(viewer.userId);
  const acc = store.accounts.find((a) => a.id === id);
  return ok(toAccountView(acc, store.lists));
}
async function handleAccountDelete(id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  await mutateUserStore(viewer.userId, (s) => {
    s.accounts = s.accounts.filter((a) => a.id !== id);
    const listIds = new Set(s.lists.filter((l) => l.accountId === id).map((l) => l.id));
    s.lists = s.lists.filter((l) => l.accountId !== id);
    s.tasks = s.tasks.filter((t) => !listIds.has(t.listId));
  });
  return ok({ ok: true });
}
async function handleAccountSyncPost(id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const log = await runSync(id);
  return ok(log);
}
async function handleAccountTestPost(id, viewer) {
  const store = await loadStore(viewer);
  const account = store.accounts.find((a) => a.id === id);
  if (!account) return notFound("account not found");
  const result = await testAccount(account);
  return ok(result);
}
async function handleListsGet(viewer) {
  const store = await loadStore(viewer);
  return ok(store.lists);
}
async function handleListPut(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateUserStore(viewer.userId, (s) => {
    const l = s.lists.find((x) => x.id === id);
    if (!l) return;
    found = true;
    if (typeof body.visible === "boolean") l.visible = body.visible;
  });
  if (!found) return notFound("list not found");
  const store = await loadStore(viewer);
  return ok(store.lists.find((l) => l.id === id));
}
async function handleTasksGet(req, viewer) {
  const store = await loadStore(viewer);
  const url = new URL(req.url);
  const listId = url.searchParams.get("listId")?.trim();
  const showCompleted = url.searchParams.get("showCompleted") === "1";
  let tasks = store.tasks.filter((t) => t.syncState !== "local_deleted");
  if (listId) tasks = tasks.filter((t) => t.listId === listId);
  else {
    const visible = new Set(store.lists.filter((l) => l.visible).map((l) => l.id));
    tasks = tasks.filter((t) => visible.has(t.listId));
  }
  if (!showCompleted) tasks = tasks.filter((t) => !t.completed);
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.summary.localeCompare(b.summary, void 0, { sensitivity: "base" });
  });
  return ok(
    tasks.map((t) => taskToView(t, store.lists.find((l) => l.id === t.listId)))
  );
}
async function handleTasksPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body.listId || !body.summary?.trim()) return badRequest("listId and summary required");
  const store = await loadStore(viewer);
  const list = store.lists.find((l) => l.id === body.listId);
  if (!list) return notFound("list not found");
  if (list.readOnly) return forbidden("list is read-only");
  const account = store.accounts.find((a) => a.id === list.accountId);
  const useCalDav = account?.provider === "caldav";
  const uid = newUid();
  const now = nowIso();
  const ical = useCalDav ? buildVtodo({ uid, summary: body.summary.trim(), completed: false, due: body.due, lastModifiedIso: now }) : "";
  let createdId = "";
  await mutateUserStore(viewer.userId, (s) => {
    const liveList = s.lists.find((l) => l.id === body.listId);
    if (!liveList || liveList.readOnly) return;
    createdId = newId("tsk");
    s.tasks.push({
      id: createdId,
      listId: body.listId,
      uid,
      icalData: ical,
      summary: body.summary.trim(),
      completed: false,
      due: body.due,
      localModifiedAt: now,
      syncState: "local_new"
    });
  });
  if (!createdId) return forbidden("cannot create task");
  if (account) {
    const syncError = await syncAfterMutation(account.id, { listIds: [list.id] });
    const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId);
    return ok({ ...taskToView(updated, list), syncError });
  }
  const task = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId);
  return ok(taskToView(task, list));
}
async function handleTaskPut(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  const store = await loadStore(viewer);
  const existing = store.tasks.find((t) => t.id === id);
  if (!existing) return notFound("task not found");
  const list = store.lists.find((l) => l.id === existing.listId);
  if (!list || list.readOnly) return forbidden("list is read-only");
  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    if (body.summary !== void 0) t.summary = body.summary.trim() || t.summary;
    if (typeof body.completed === "boolean") t.completed = body.completed;
    if (body.due === null) t.due = void 0;
    else if (body.due !== void 0) t.due = body.due;
    t.localModifiedAt = nowIso();
    if (t.syncState === "synced") t.syncState = "local_modified";
  });
  const account = store.accounts.find((a) => a.id === list.accountId);
  if (account) {
    const syncError = await syncAfterMutation(account.id, { listIds: [list.id] });
    const updated2 = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id);
    return ok({ ...taskToView(updated2, list), syncError });
  }
  const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id);
  return ok(taskToView(updated, list));
}
async function handleTaskDelete(id, viewer) {
  const store = await loadStore(viewer);
  const existing = store.tasks.find((t) => t.id === id);
  if (!existing) return notFound("task not found");
  const list = store.lists.find((l) => l.id === existing.listId);
  if (!list || list.readOnly) return forbidden("list is read-only");
  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    if (t.syncState === "local_new") {
      s.tasks = s.tasks.filter((x) => x.id !== id);
    } else {
      t.syncState = "local_deleted";
      t.localModifiedAt = nowIso();
    }
  });
  const account = store.accounts.find((a) => a.id === list.accountId);
  if (account) await syncAfterMutation(account.id, { listIds: [list.id] });
  return ok({ ok: true });
}
async function handleGoogleAuthUrlPost(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const store = await loadStore(viewer);
  const account = store.accounts.find((a) => a.id === id);
  if (!account || account.provider !== "google") return badRequest("not a google account");
  const state = createOAuthState(viewer.userId, id);
  const url = buildGoogleAuthUrl(req, account, state);
  return ok({ url });
}
async function handleGoogleCallbackGet(req) {
  const viewer = resolveTasksViewer(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const err = url.searchParams.get("error")?.trim();
  const failHtml = (msg) => html(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`
  );
  if (err) return failHtml(`Google: ${err}`);
  if (!code || !state) return failHtml("OAuth fehlgeschlagen \u2014 code/state fehlt");
  if (!viewer) return failHtml("Nicht angemeldet \u2014 zuerst im Dashboard einloggen");
  const pending2 = consumeOAuthState(state);
  if (!pending2 || pending2.userId !== viewer.userId) return failHtml("OAuth-State ung\xFCltig oder abgelaufen");
  const store = await readUserStore(viewer.userId);
  const account = store.accounts.find((a) => a.id === pending2.accountId);
  if (!account || account.provider !== "google") return failHtml("Konto nicht gefunden");
  try {
    const redirectUri = googleRedirectUri(req);
    const tokens = await exchangeGoogleCode(account, code, redirectUri);
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending2.accountId);
      if (!acc || acc.provider !== "google") return;
      applyGoogleTokens(acc, tokens);
    });
    runSync(pending2.accountId).catch(() => void 0);
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Google Tasks verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return failHtml(msg);
  }
}
async function handleMicrosoftAuthUrlPost(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const store = await loadStore(viewer);
  const account = store.accounts.find((a) => a.id === id);
  if (!account || account.provider !== "microsoft") return badRequest("not a microsoft account");
  const state = createOAuthState(viewer.userId, id);
  const url = buildMicrosoftAuthUrl(req, account, state);
  return ok({ url });
}
async function handleMicrosoftCallbackGet(req) {
  const viewer = resolveTasksViewer(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const err = url.searchParams.get("error")?.trim();
  const errDesc = url.searchParams.get("error_description")?.trim();
  const failHtml = (msg) => html(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`
  );
  if (err) return failHtml(`Microsoft: ${errDesc || err}`);
  if (!code || !state) return failHtml("OAuth fehlgeschlagen \u2014 code/state fehlt");
  if (!viewer) return failHtml("Nicht angemeldet \u2014 zuerst im Dashboard einloggen");
  const pending2 = consumeOAuthState(state);
  if (!pending2 || pending2.userId !== viewer.userId) return failHtml("OAuth-State ung\xFCltig oder abgelaufen");
  const store = await readUserStore(viewer.userId);
  const account = store.accounts.find((a) => a.id === pending2.accountId);
  if (!account || account.provider !== "microsoft") return failHtml("Konto nicht gefunden");
  try {
    const redirectUri = microsoftRedirectUri(req);
    const tokens = await exchangeMicrosoftCode(account, code, redirectUri);
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending2.accountId);
      if (!acc || acc.provider !== "microsoft") return;
      applyMicrosoftTokens(acc, tokens);
    });
    runSync(pending2.accountId).catch(() => void 0);
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Microsoft To Do verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return failHtml(msg);
  }
}
async function tasksServerHandler(ctx) {
  const method = ctx.request.method.toUpperCase();
  const path = ctx.path;
  const [a, b, c] = path;
  if (a === "google" && b === "callback" && path.length === 2 && method === "GET") {
    return handleGoogleCallbackGet(ctx.request);
  }
  if (a === "microsoft" && b === "callback" && path.length === 2 && method === "GET") {
    return handleMicrosoftCallbackGet(ctx.request);
  }
  const viewer = resolveTasksViewer(ctx.request);
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });
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
  if (a === "accounts" && b && c === "google" && path[3] === "auth-url" && path.length === 4 && method === "POST") {
    return handleGoogleAuthUrlPost(ctx.request, b, viewer);
  }
  if (a === "accounts" && b && c === "microsoft" && path[3] === "auth-url" && path.length === 4 && method === "POST") {
    return handleMicrosoftAuthUrlPost(ctx.request, b, viewer);
  }
  if (a === "lists" && path.length === 1 && method === "GET") return handleListsGet(viewer);
  if (a === "lists" && b && path.length === 2 && method === "PUT") return handleListPut(ctx.request, b, viewer);
  if (a === "tasks" && path.length === 1) {
    if (method === "GET") return handleTasksGet(ctx.request, viewer);
    if (method === "POST") return handleTasksPost(ctx.request, viewer);
  }
  if (a === "tasks" && b && path.length === 2) {
    if (method === "PUT") return handleTaskPut(ctx.request, b, viewer);
    if (method === "DELETE") return handleTaskDelete(b, viewer);
  }
  return Response.json({ error: "not_found", pluginId: ctx.pluginId, path: path.join("/") }, { status: 404 });
}
var server_default = tasksServerHandler;
export {
  server_default as default,
  startScheduler,
  stopScheduler,
  tasksServerHandler
};
