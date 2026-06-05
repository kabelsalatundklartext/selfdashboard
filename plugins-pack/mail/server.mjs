// sd-server-shim:next-server-stub
var NextResponse = class extends Response {
  static json(data, init) {
    const status = init && typeof init.status === "number" ? init.status : 200;
    const headers = init && init.headers ? init.headers : void 0;
    return Response.json(data, { status, headers });
  }
};

// plugins-pack/_shared/error-log-lite.ts
import { appendFile, mkdir } from "fs/promises";
import { join as join2 } from "path";

// plugins-pack/_shared/data-dir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// plugins-pack/_shared/error-log-lite.ts
var logFilePath = () => join2(dataDir(), "error-log.jsonl");
async function appendErrorLog(entry) {
  const line = JSON.stringify({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    source: entry.source,
    level: entry.level ?? "error",
    message: entry.message.slice(0, 2e3),
    detail: entry.detail
  });
  const file = logFilePath();
  await mkdir(dataDir(), { recursive: true });
  await appendFile(file, `${line}
`, "utf8");
}

// plugins-pack/mail/lib/log.ts
async function logMailEvent(operation, message, opts) {
  try {
    await appendErrorLog({
      level: opts?.level ?? "error",
      source: "api",
      pluginId: "mail",
      category: `mail/${operation}`,
      message,
      detail: opts?.detail ? JSON.stringify(opts.detail).slice(0, 4e3) : void 0
    });
  } catch {
  }
}

// plugins-pack/mail/lib/errors.ts
function formatMailError(message) {
  const m = message.toLowerCase();
  if (m.includes("unsupported state") || m.includes("unable to authenticate data") || m.includes("auth tag") || m.includes("encrypted payload")) {
    return "Passwort nicht lesbar \u2014 nach Docker-Neustart in Einstellungen \u2192 E-Mail Passwort neu eintragen und \u201ESpeichern\u201C.";
  }
  if (m.includes("enotfound") && m.includes(":5000")) {
    return "IMAP-Host darf keine Webmail-URL sein \u2014 nur IP/Hostname (z. B. 192.168.1.15), Port 993.";
  }
  if (m.includes("wrong version number")) {
    return "SSL/TLS passt nicht \u2014 Port 993 mit \u201ESSL/TLS\u201C an, oder Zertifikat-Pr\xFCfung aus.";
  }
  if (m.includes("unable to verify the first certificate")) {
    return "TLS-Zertifikat abgelehnt \u2014 \u201ETLS-Zertifikat pr\xFCfen\u201C ausschalten (lokale Synology).";
  }
  if (m.includes("greeting") && m.includes("tls")) {
    return "IMAP antwortet nicht mit TLS \u2014 \u201ESSL/TLS\u201C aktivieren (Port 993).";
  }
  return message;
}

// plugins-pack/mail/lib/imap.ts
import { ImapFlow } from "imapflow";

// plugins-pack/_shared/secret-crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join as join3 } from "node:path";
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
  const keyFile = join3(dataDir(), ".calendar-key");
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
  return Buffer.concat([iv, tag, enc]).toString("base64");
}
function decrypt(ciphertext) {
  if (!ciphertext) return "";
  const key = loadOrCreateKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// plugins-pack/mail/lib/normalize.ts
function normalizeMailConnection(hostInput, portInput) {
  let host = hostInput.trim();
  let port = portInput;
  if (!host) return { host: "", port };
  const bracket = host.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (bracket) {
    host = bracket[1];
    if (bracket[2]) port = parseInt(bracket[2], 10) || port;
    return { host, port: Math.max(1, Math.min(65535, port)) };
  }
  const colon = host.lastIndexOf(":");
  if (colon > 0 && /^\d+$/.test(host.slice(colon + 1))) {
    const parsed = parseInt(host.slice(colon + 1), 10);
    host = host.slice(0, colon);
    if (parsed >= 1 && parsed <= 65535) port = parsed;
  }
  return { host: host.trim(), port: Math.max(1, Math.min(65535, port)) };
}
function isAllMailboxes(mailbox) {
  const m = (mailbox ?? "").trim().toUpperCase();
  return !m || m === "*" || m === "ALL" || m === "ALLE" || m === "ALL_FOLDERS";
}
function isMailplusAccountsOnly(mailbox) {
  const m = (mailbox ?? "").trim().toLowerCase();
  return m === "@accounts" || m === "accounts" || m === "mailplus" || m === "konten";
}
function resolveWebmailUrl(account) {
  const direct = account.openUrl?.trim();
  if (direct) return direct;
  const hostRaw = account.host?.trim();
  if (!hostRaw) return null;
  const { host } = normalizeMailConnection(hostRaw, account.port ?? 993);
  if (!host) return null;
  return `http://${host}:5000/mail/#inbox`;
}

// plugins-pack/mail/lib/types.ts
var MAIL_STORE_VERSION = 2;
var MAIL_POLL_INTERVAL_MIN = 1;
var MAIL_POLL_INTERVAL_MAX = 900;
var MAIL_POLL_INTERVAL_DEFAULT = 120;
var MAIL_UNREAD_MAX_AGE_MIN = 0;
var MAIL_UNREAD_MAX_AGE_MAX_DAYS = 3650;
var MAIL_UNREAD_MAX_AGE_DEFAULT = 30;
var MAIL_STATUS_MAX_FOLDERS = 12;
function clampPollIntervalSeconds(seconds) {
  if (!Number.isFinite(seconds)) return MAIL_POLL_INTERVAL_DEFAULT;
  return Math.max(
    MAIL_POLL_INTERVAL_MIN,
    Math.min(MAIL_POLL_INTERVAL_MAX, Math.round(seconds))
  );
}
function resolveUnreadMaxAgeDays(value) {
  if (value !== void 0 && Number.isFinite(value)) {
    return clampUnreadMaxAgeDays(value);
  }
  const fromEnv = parseInt(process.env.MAIL_UNREAD_MAX_AGE_DAYS ?? "", 10);
  if (Number.isFinite(fromEnv)) return clampUnreadMaxAgeDays(fromEnv);
  return MAIL_UNREAD_MAX_AGE_DEFAULT;
}
function clampUnreadMaxAgeDays(days) {
  if (!Number.isFinite(days)) return MAIL_UNREAD_MAX_AGE_DEFAULT;
  const n = Math.round(days);
  if (n <= MAIL_UNREAD_MAX_AGE_MIN) return MAIL_UNREAD_MAX_AGE_MIN;
  return Math.min(MAIL_UNREAD_MAX_AGE_MAX_DAYS, n);
}
function formatMailFolderLabel(path2) {
  if (path2.includes(".")) {
    const parts2 = path2.split(".");
    return parts2[parts2.length - 1] || path2;
  }
  const parts = path2.split("/");
  return parts[parts.length - 1] || path2;
}
var DEFAULT_ACCOUNT_FIELDS = {
  enabled: true,
  host: "",
  port: 993,
  secure: true,
  username: "",
  passwordEncrypted: "",
  mailbox: "*",
  openUrl: "",
  verifyTls: true
};
var EMPTY_MAIL_STATUS = {
  unread: 0,
  accounts: []
};
function newAccountId() {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function parseAccountEnabled(value) {
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return true;
}
function isMailAccountFetchable(account) {
  return Boolean(
    parseAccountEnabled(account.enabled) && String(account.host ?? "").trim() && String(account.username ?? "").trim() && String(account.passwordEncrypted ?? "").trim()
  );
}
function accountToImapConfig(account, unreadMaxAgeDays) {
  return {
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    passwordEncrypted: account.passwordEncrypted,
    mailbox: account.mailbox,
    verifyTls: account.verifyTls,
    maxUnreadAgeDays: resolveUnreadMaxAgeDays(unreadMaxAgeDays)
  };
}

// plugins-pack/mail/lib/imap.ts
var PREVIEW_MAX_TOTAL = 100;
var PREVIEW_MAX_PER_FOLDER = 40;
function isTrashMailbox(path2, flags) {
  if (flags?.has("\\Trash")) return true;
  const lower = path2.toLowerCase();
  const leaf = (path2.includes("/") ? path2.split("/").pop() : path2) ?? path2;
  const trashNames = ["trash", "papierkorb", "deleted", "gel\xF6scht", "geloescht"];
  return trashNames.includes(lower) || trashNames.includes(leaf.toLowerCase());
}
var MAILPLUS_SKIP_SUFFIX = /* @__PURE__ */ new Set([
  "sent",
  "gesendet",
  "drafts",
  "entw\xFCrfe",
  "entwurfe",
  "trash",
  "papierkorb",
  "junk",
  "spam",
  "archive",
  "archiv"
]);
function isMailplusExcluded(path2, flags) {
  if (isTrashMailbox(path2, flags)) return true;
  if (flags) {
    if (flags.has("\\Sent") || flags.has("\\Junk") || flags.has("\\Drafts") || flags.has("\\Archive")) {
      return true;
    }
  }
  const lower = path2.toLowerCase();
  if (lower === "sent" || lower === "inbox") return true;
  const dot = path2.match(/^INBOX\.(.+)$/i);
  if (dot && MAILPLUS_SKIP_SUFFIX.has(dot[1].toLowerCase())) return true;
  const leaf = (path2.includes("/") ? path2.split("/").pop() : path2) ?? path2;
  return MAILPLUS_SKIP_SUFFIX.has(leaf.toLowerCase());
}
function createClient(config) {
  const { host, port } = normalizeMailConnection(config.host, config.port);
  if (!host || !config.username || !config.passwordEncrypted) {
    throw new Error("IMAP host, username and password required");
  }
  return new ImapFlow({
    host,
    port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: decrypt(config.passwordEncrypted)
    },
    logger: false,
    tls: { rejectUnauthorized: config.verifyTls }
  });
}
async function withImapClient(config, fn) {
  const client = createClient(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.logout();
    } catch {
    }
  }
}
function isInboxRoot(path2) {
  const name = (path2.includes("/") ? path2.split("/").pop() : path2) ?? path2;
  const n = name.toLowerCase();
  return n === "inbox" || n === "posteingang";
}
function synologyDotAccounts(boxes) {
  return boxes.filter((b) => /^INBOX\./i.test(b.path)).filter((b) => !isMailplusExcluded(b.path, b.flags)).map((b) => b.path);
}
function accountFoldersUnderInbox(paths, inboxRoot) {
  const prefix = inboxRoot.endsWith("/") ? inboxRoot : `${inboxRoot}/`;
  return paths.filter((p) => {
    if (!p.startsWith(prefix)) return false;
    const rel = p.slice(prefix.length);
    return rel.length > 0 && !rel.includes("/");
  });
}
function isDescendantMailboxPath(parent, child) {
  if (parent === child) return false;
  return child.startsWith(`${parent}.`) || child.startsWith(`${parent}/`);
}
function resolveScanPaths(boxes, mailbox) {
  if (isMailplusAccountsOnly(mailbox)) {
    const synology = synologyDotAccounts(boxes);
    if (synology.length > 0) {
      return { paths: synology, mode: "synology-accounts" };
    }
    const paths = boxes.map((b) => b.path);
    for (const root of paths.filter(isInboxRoot)) {
      const accounts = accountFoldersUnderInbox(paths, root).filter(
        (p) => !isMailplusExcluded(p, boxes.find((b) => b.path === p)?.flags)
      );
      if (accounts.length > 0) {
        return { paths: accounts, mode: "accounts" };
      }
    }
  }
  const all = boxes.filter((b) => !isTrashMailbox(b.path, b.flags)).map((b) => b.path);
  return { paths: all, mode: "all-except-trash" };
}
function planMailboxScan(boxes, mailbox) {
  const boxByPath = new Map(boxes.map((b) => [b.path, b]));
  if (!isAllMailboxes(mailbox) && !isMailplusAccountsOnly(mailbox)) {
    const root = mailbox.trim() || "INBOX";
    const inScope = boxes.filter((b) => b.path === root || isDescendantMailboxPath(root, b.path));
    return {
      mode: "single",
      statusPaths: inScope.filter((b) => b.flags?.has("\\Noselect")).map((b) => b.path),
      searchPaths: inScope.filter((b) => !b.flags?.has("\\Noselect")).filter((b) => !isTrashMailbox(b.path, b.flags)).map((b) => b.path)
    };
  }
  const { paths: toScan, mode } = resolveScanPaths(boxes, mailbox);
  const noselectRoots = toScan.filter((p) => boxByPath.get(p)?.flags?.has("\\Noselect")).filter((p) => !toScan.some((other) => other !== p && isDescendantMailboxPath(other, p)));
  const coveredByNoselect = /* @__PURE__ */ new Set();
  const statusPaths = [];
  for (const path2 of noselectRoots) {
    const hasOpenableChild = toScan.some(
      (p) => p !== path2 && isDescendantMailboxPath(path2, p) && !boxByPath.get(p)?.flags?.has("\\Noselect")
    );
    if (hasOpenableChild) continue;
    statusPaths.push(path2);
    coveredByNoselect.add(path2);
  }
  const searchPaths = toScan.filter((p) => {
    if (boxByPath.get(p)?.flags?.has("\\Noselect")) return false;
    if ([...coveredByNoselect].some((parent) => isDescendantMailboxPath(parent, p))) return false;
    return true;
  });
  return { mode, statusPaths, searchPaths };
}
async function countUnreadViaStatus(client, path2) {
  try {
    const status = await client.status(path2, { unseen: true });
    if (typeof status.unseen === "number") return status.unseen;
  } catch {
  }
  return 0;
}
function isRealUnreadMessage(flags) {
  if (!flags) return true;
  if (flags.has("\\Deleted") || flags.has("\\Seen")) return false;
  return true;
}
function messageDate(msg) {
  if (msg.envelope?.date) {
    const d = new Date(msg.envelope.date);
    if (!isNaN(+d)) return d;
  }
  if (msg.internalDate) {
    const d = new Date(msg.internalDate);
    if (!isNaN(+d)) return d;
  }
  return void 0;
}
function isRecentUnread(date, maxUnreadAgeDays) {
  if (maxUnreadAgeDays <= 0 || !date) return true;
  return Date.now() - date.getTime() <= maxUnreadAgeDays * 864e5;
}
async function fetchVerifiedUnreadEntries(client, path2, maxUnreadAgeDays) {
  const lock = await client.getMailboxLock(path2);
  try {
    const found = await client.search({ seen: false, deleted: false }, { uid: true });
    if (!Array.isArray(found) || found.length === 0) {
      return { entries: [], skippedStale: 0, skippedDuplicate: 0 };
    }
    const entries = [];
    const seenMessageIds = /* @__PURE__ */ new Set();
    let skippedStale = 0;
    let skippedDuplicate = 0;
    for await (const msg of client.fetch(
      found,
      { flags: true, uid: true, envelope: true, internalDate: true },
      { uid: true }
    )) {
      if (!isRealUnreadMessage(msg.flags)) continue;
      const when = messageDate(msg);
      if (!isRecentUnread(when, maxUnreadAgeDays)) {
        skippedStale++;
        continue;
      }
      const mid = msg.envelope?.messageId?.trim().toLowerCase();
      if (mid) {
        if (seenMessageIds.has(mid)) {
          skippedDuplicate++;
          continue;
        }
        seenMessageIds.add(mid);
      }
      entries.push({ uid: msg.uid });
    }
    return { entries, skippedStale, skippedDuplicate };
  } finally {
    lock.release();
  }
}
async function countUnreadViaSearch(client, path2, maxUnreadAgeDays) {
  try {
    const { entries } = await fetchVerifiedUnreadEntries(client, path2, maxUnreadAgeDays);
    return entries.length;
  } catch {
    return countUnreadViaStatus(client, path2);
  }
}
async function markUnreadAsSeenInPath(client, path2) {
  const lock = await client.getMailboxLock(path2);
  try {
    const found = await client.search({ seen: false, deleted: false }, { uid: true });
    if (!Array.isArray(found) || found.length === 0) return 0;
    await client.messageFlagsAdd(found, ["\\Seen"], { uid: true });
    return found.length;
  } finally {
    lock.release();
  }
}
function noselectPreviewStub(path2, unread) {
  return {
    folder: path2,
    folderLabel: formatMailFolderLabel(path2),
    uid: 0,
    subject: `(${unread} unread \u2014 Noselect, subjects not available via IMAP)`,
    note: "noselect"
  };
}
function formatFromAddress(from) {
  if (!from?.address) return void 0;
  return from.name?.trim() ? `${from.name.trim()} <${from.address}>` : from.address;
}
async function listUnreadFromEntries(client, path2, entries, max) {
  if (!entries.length) return [];
  const lock = await client.getMailboxLock(path2);
  try {
    const out = [];
    for await (const msg of client.fetch(
      entries.slice(0, max).map((e) => e.uid),
      { envelope: true, uid: true },
      { uid: true }
    )) {
      const env = msg.envelope;
      out.push({
        folder: path2,
        folderLabel: formatMailFolderLabel(path2),
        uid: msg.uid,
        subject: env?.subject && String(env.subject).trim() || "(no subject)",
        from: formatFromAddress(env?.from?.[0]),
        date: env?.date ? new Date(env.date).toISOString() : void 0
      });
    }
    return out;
  } finally {
    lock.release();
  }
}
async function sumUnreadAllFolders(client, mailbox, maxUnreadAgeDays) {
  const boxes = (await client.list()).map((b) => ({ path: b.path, flags: b.flags }));
  const { mode, statusPaths, searchPaths } = planMailboxScan(boxes, mailbox);
  const folders = [];
  let total = 0;
  for (const path2 of statusPaths) {
    const unread = await countUnreadViaStatus(client, path2);
    folders.push({ path: path2, unread });
    total += unread;
  }
  for (const path2 of searchPaths) {
    try {
      const unread = await countUnreadViaSearch(client, path2, maxUnreadAgeDays);
      folders.push({ path: path2, unread });
      total += unread;
    } catch {
      folders.push({ path: path2, unread: 0 });
    }
  }
  return { total, folders, mode };
}
async function collectUnreadPreviews(client, mailbox, maxUnreadAgeDays) {
  const boxes = (await client.list()).map((b) => ({ path: b.path, flags: b.flags }));
  const { mode, statusPaths, searchPaths } = planMailboxScan(boxes, mailbox);
  const folders = [];
  const messages = [];
  let total = 0;
  let truncated = false;
  let skippedStale = 0;
  let skippedDuplicate = 0;
  const pushMessages = (batch) => {
    for (const m of batch) {
      if (messages.length >= PREVIEW_MAX_TOTAL) {
        truncated = true;
        return;
      }
      messages.push(m);
    }
  };
  for (const path2 of statusPaths) {
    const unread = await countUnreadViaStatus(client, path2);
    folders.push({ path: path2, unread });
    total += unread;
    if (unread > 0) pushMessages([noselectPreviewStub(path2, unread)]);
  }
  for (const path2 of searchPaths) {
    try {
      const scan = await fetchVerifiedUnreadEntries(client, path2, maxUnreadAgeDays);
      skippedStale += scan.skippedStale;
      skippedDuplicate += scan.skippedDuplicate;
      const unread = scan.entries.length;
      folders.push({ path: path2, unread });
      total += unread;
      if (unread > 0) {
        const listed = await listUnreadFromEntries(client, path2, scan.entries, PREVIEW_MAX_PER_FOLDER);
        if (listed.length < unread) truncated = true;
        pushMessages(listed);
      }
    } catch {
      folders.push({ path: path2, unread: 0 });
    }
    if (truncated) break;
  }
  return {
    total,
    messages,
    folders,
    mode,
    truncated: truncated || void 0,
    skippedStale: skippedStale || void 0,
    skippedDuplicate: skippedDuplicate || void 0,
    maxUnreadAgeDays
  };
}
async function previewSingleMailbox(client, mailbox, maxUnreadAgeDays) {
  const listed = await client.list();
  const box = listed.find((b) => b.path === mailbox);
  if (box?.flags?.has("\\Noselect")) {
    const unread = await countUnreadViaStatus(client, mailbox);
    return {
      total: unread,
      messages: unread > 0 ? [noselectPreviewStub(mailbox, unread)] : [],
      folders: [{ path: mailbox, unread }],
      mode: "single",
      maxUnreadAgeDays
    };
  }
  const scan = await fetchVerifiedUnreadEntries(client, mailbox, maxUnreadAgeDays);
  const messages = scan.entries.length > 0 ? await listUnreadFromEntries(client, mailbox, scan.entries, PREVIEW_MAX_PER_FOLDER) : [];
  return {
    total: scan.entries.length,
    messages,
    folders: [{ path: mailbox, unread: scan.entries.length }],
    mode: "single",
    truncated: scan.entries.length > messages.length ? true : void 0,
    skippedStale: scan.skippedStale || void 0,
    skippedDuplicate: scan.skippedDuplicate || void 0,
    maxUnreadAgeDays
  };
}
async function fetchUnreadMessagePreviews(config) {
  const maxUnreadAgeDays = resolveUnreadMaxAgeDays(config.maxUnreadAgeDays);
  return withImapClient(config, async (client) => {
    if (isAllMailboxes(config.mailbox) || isMailplusAccountsOnly(config.mailbox)) {
      return collectUnreadPreviews(client, config.mailbox, maxUnreadAgeDays);
    }
    return previewSingleMailbox(client, config.mailbox.trim() || "INBOX", maxUnreadAgeDays);
  });
}
async function fetchUnreadBreakdown(config) {
  const maxUnreadAgeDays = resolveUnreadMaxAgeDays(config.maxUnreadAgeDays);
  return withImapClient(config, async (client) => {
    if (isAllMailboxes(config.mailbox) || isMailplusAccountsOnly(config.mailbox)) {
      return sumUnreadAllFolders(client, config.mailbox, maxUnreadAgeDays);
    }
    const mailbox = config.mailbox.trim() || "INBOX";
    const listed = await client.list();
    const box = listed.find((b) => b.path === mailbox);
    const unread = box?.flags?.has("\\Noselect") ? await countUnreadViaStatus(client, mailbox) : await countUnreadViaSearch(client, mailbox, maxUnreadAgeDays);
    return { total: unread, folders: [{ path: mailbox, unread }], mode: "single" };
  });
}
async function markAllUnreadAsRead(config) {
  return withImapClient(config, async (client) => {
    const boxes = (await client.list()).map((b) => ({ path: b.path, flags: b.flags }));
    const { mode, statusPaths, searchPaths } = planMailboxScan(boxes, config.mailbox);
    const folders = [];
    let marked = 0;
    for (const path2 of searchPaths) {
      try {
        const n = await markUnreadAsSeenInPath(client, path2);
        if (n > 0) folders.push({ path: path2, marked: n });
        marked += n;
      } catch {
      }
    }
    return {
      marked,
      folders,
      mode,
      noselectSkipped: statusPaths.length > 0 ? statusPaths : void 0
    };
  });
}
async function testImapConnection(config) {
  try {
    const result = await fetchUnreadBreakdown(config);
    return { ok: true, unread: result.total, folders: result.folders, mode: result.mode };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// plugins-pack/mail/lib/store.ts
import { copyFileSync, existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, renameSync, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join4 } from "node:path";

// plugins-pack/_shared/plugin-paths.ts
import path from "path";
var cwd = process.cwd();
function getCustomPluginsRoot() {
  const env = process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim();
  if (env) return env;
  return path.join(cwd, "plugins", "custom");
}

// plugins-pack/mail/lib/store.ts
function resolveMailDataRoot() {
  if (process.env.MAIL_DATA_DIR?.trim()) return process.env.MAIL_DATA_DIR.trim();
  return join4(getCustomPluginsRoot(), "mail");
}
var ROOT = resolveMailDataRoot();
var FILE = () => join4(ROOT, "mail.json");
var LEGACY_FILE = () => join4(dataDir(), "mail", "mail.json");
function migrateLegacyMailStoreIfNeeded() {
  const next = FILE();
  if (existsSync2(next)) return;
  const legacy = LEGACY_FILE();
  if (!existsSync2(legacy)) return;
  ensureDir();
  try {
    copyFileSync(legacy, next);
    console.info("[SelfDashboard] Migrated mail store to plugin folder:", next);
  } catch (e) {
    console.warn("[SelfDashboard] mail store migration failed", e);
  }
}
function ensureDir() {
  if (!existsSync2(ROOT)) mkdirSync(ROOT, { recursive: true });
}
var chain = Promise.resolve();
function withLock(fn) {
  const next = chain.then(fn);
  chain = next.catch(() => void 0);
  return next;
}
function defaultStore() {
  return {
    version: MAIL_STORE_VERSION,
    navbarEnabled: false,
    pollIntervalSeconds: 120,
    unreadMaxAgeDays: resolveUnreadMaxAgeDays(),
    accounts: [],
    status: structuredClone(EMPTY_MAIL_STATUS)
  };
}
function migrateFromV1(parsed) {
  const c = parsed.config;
  const st = parsed.status;
  if (!c) return defaultStore();
  const account = {
    id: "default",
    label: c.username?.trim() || "Postfach 1",
    enabled: true,
    host: c.host ?? "",
    port: c.port ?? 993,
    secure: c.secure ?? true,
    username: c.username ?? "",
    passwordEncrypted: c.passwordEncrypted ?? "",
    mailbox: c.mailbox || "*",
    openUrl: c.openUrl ?? "",
    verifyTls: c.verifyTls ?? true
  };
  return {
    version: MAIL_STORE_VERSION,
    navbarEnabled: Boolean(c.enabled),
    pollIntervalSeconds: clampPollIntervalSeconds(c.pollIntervalSeconds ?? MAIL_POLL_INTERVAL_DEFAULT),
    unreadMaxAgeDays: resolveUnreadMaxAgeDays(),
    accounts: [account],
    status: {
      unread: st?.unread ?? 0,
      lastSyncAt: st?.lastSyncAt,
      lastError: st?.lastError,
      accounts: [{ id: account.id, label: account.label, unread: st?.unread ?? 0, lastError: st?.lastError }]
    }
  };
}
function normalizeStore(parsed) {
  if (Array.isArray(parsed.accounts)) {
    const accounts = parsed.accounts.map((a, i) => ({
      id: typeof a.id === "string" ? a.id : `acc_${i}`,
      label: typeof a.label === "string" ? a.label : `Konto ${i + 1}`,
      ...DEFAULT_ACCOUNT_FIELDS,
      ...a,
      mailbox: a.mailbox?.trim() || "*",
      enabled: parseAccountEnabled(a.enabled)
    }));
    const status = parsed.status;
    return {
      version: MAIL_STORE_VERSION,
      navbarEnabled: Boolean(
        parsed.navbarEnabled ?? (parsed.config ? parsed.config.enabled : false)
      ),
      pollIntervalSeconds: typeof parsed.pollIntervalSeconds === "number" ? clampPollIntervalSeconds(parsed.pollIntervalSeconds) : MAIL_POLL_INTERVAL_DEFAULT,
      unreadMaxAgeDays: typeof parsed.unreadMaxAgeDays === "number" ? clampUnreadMaxAgeDays(parsed.unreadMaxAgeDays) : resolveUnreadMaxAgeDays(),
      accounts,
      status: {
        unread: status?.unread ?? 0,
        lastSyncAt: status?.lastSyncAt,
        lastError: status?.lastError,
        accounts: Array.isArray(status?.accounts) ? status.accounts : []
      }
    };
  }
  if (parsed.config) return migrateFromV1(parsed);
  return defaultStore();
}
function readSync() {
  migrateLegacyMailStoreIfNeeded();
  const path2 = FILE();
  if (!existsSync2(path2)) return defaultStore();
  try {
    const parsed = JSON.parse(readFileSync2(path2, "utf8"));
    const store = normalizeStore(parsed);
    if (parsed.version !== MAIL_STORE_VERSION) {
      writeSync(store);
    }
    return store;
  } catch {
    try {
      renameSync(path2, `${path2}.corrupt-${Date.now()}`);
    } catch {
    }
    return defaultStore();
  }
}
function writeSync(data) {
  ensureDir();
  const path2 = FILE();
  const tmp = `${path2}.tmp`;
  writeFileSync2(tmp, JSON.stringify({ ...data, version: MAIL_STORE_VERSION }, null, 2), "utf8");
  renameSync(tmp, path2);
}
async function readMailStore() {
  return withLock(() => readSync());
}
async function mutateMailStore(fn) {
  return withLock(() => {
    const s = readSync();
    fn(s);
    writeSync(s);
    return s;
  });
}
function toPublicAccount(account) {
  return {
    id: account.id,
    label: account.label,
    enabled: account.enabled,
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    hasPassword: Boolean(account.passwordEncrypted),
    mailbox: account.mailbox,
    openUrl: account.openUrl,
    verifyTls: account.verifyTls
  };
}
function applyAccountUpdate(current, body) {
  const next = { ...current };
  if (typeof body.label === "string") next.label = body.label.trim() || current.label;
  if (typeof body.enabled === "boolean") next.enabled = body.enabled;
  else if (body.enabled !== void 0) next.enabled = parseAccountEnabled(body.enabled);
  if (typeof body.port === "number" && Number.isFinite(body.port)) {
    next.port = Math.max(1, Math.min(65535, Math.round(body.port)));
  }
  if (typeof body.host === "string") {
    const normalized = normalizeMailConnection(body.host.trim(), next.port);
    next.host = normalized.host;
    next.port = normalized.port;
  }
  if (typeof body.secure === "boolean") next.secure = body.secure;
  if (typeof body.username === "string") next.username = body.username.trim();
  if (typeof body.password === "string" && body.password.length > 0) {
    next.passwordEncrypted = encrypt(body.password);
  }
  if (typeof body.mailbox === "string") next.mailbox = body.mailbox.trim() || "*";
  if (typeof body.openUrl === "string") next.openUrl = body.openUrl.trim();
  if (typeof body.verifyTls === "boolean") next.verifyTls = body.verifyTls;
  return next;
}
function upsertAccountFromBody(store, body) {
  const id = typeof body.id === "string" ? body.id : void 0;
  const idx = id ? store.accounts.findIndex((a) => a.id === id) : -1;
  if (idx >= 0) {
    store.accounts[idx] = applyAccountUpdate(store.accounts[idx], body);
    return store.accounts[idx];
  }
  const account = applyAccountUpdate(
    {
      id: newAccountId(),
      label: typeof body.label === "string" ? body.label.trim() || "Neues Konto" : `Konto ${store.accounts.length + 1}`,
      ...DEFAULT_ACCOUNT_FIELDS
    },
    body
  );
  store.accounts.push(account);
  return account;
}
function findAccount(store, id) {
  return store.accounts.find((a) => a.id === id);
}
function resolveAccountFromRequest(store, body, fallbackLabel) {
  const base = (typeof body.accountId === "string" ? findAccount(store, body.accountId) : void 0) ?? store.accounts[0] ?? {
    id: newAccountId(),
    label: fallbackLabel,
    ...DEFAULT_ACCOUNT_FIELDS
  };
  return applyAccountUpdate({ ...base }, body);
}
function pickOpenUrl(store) {
  const withLink = store.accounts.filter((a) => resolveWebmailUrl(a));
  for (const st of store.status.accounts) {
    if (st.unread > 0) {
      const acc = withLink.find((a) => a.id === st.id);
      const url = acc ? resolveWebmailUrl(acc) : null;
      if (url) return url;
    }
  }
  const preferred = withLink.find((a) => parseAccountEnabled(a.enabled)) ?? withLink[0];
  return preferred ? resolveWebmailUrl(preferred) : null;
}
function persistAccountFromImapTest(store, merged, unread) {
  const idx = store.accounts.findIndex((a) => a.id === merged.id);
  const saved = {
    ...merged,
    id: idx >= 0 ? store.accounts[idx].id : merged.id,
    enabled: true
  };
  if (idx >= 0) {
    store.accounts[idx] = saved;
  } else {
    store.accounts.push(saved);
  }
  const label = saved.label || saved.username || saved.id;
  const others = store.status.accounts.filter((a) => a.id !== saved.id);
  const nextAccounts = [...others, { id: saved.id, label, unread }];
  store.status.accounts = nextAccounts;
  store.status.unread = nextAccounts.reduce((sum, a) => sum + a.unread, 0);
  store.status.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
  store.status.lastError = void 0;
}
function describeMailSyncBlocker(store) {
  if (store.accounts.length === 0) {
    return "Kein Konto konfiguriert \u2014 IMAP-Daten anlegen und speichern.";
  }
  const enabled = store.accounts.filter((a) => parseAccountEnabled(a.enabled));
  if (enabled.length === 0) {
    const names = store.accounts.map((a) => a.label || a.username || a.id).join(", ");
    return names ? `Konto deaktiviert (${names}) \u2014 \u201EDieses Konto abfragen\u201C aktivieren und \u201ESpeichern\u201C.` : "Kein aktives Konto \u2014 \u201EDieses Konto abfragen\u201C aktivieren und speichern.";
  }
  const missingPassword = enabled.filter((a) => !String(a.passwordEncrypted ?? "").trim());
  if (missingPassword.length === enabled.length) {
    return "Passwort fehlt im Speicher \u2014 Passwort eintragen und \u201ESpeichern\u201C oder \u201ETesten\u201C klicken.";
  }
  const incomplete = enabled.filter(
    (a) => !String(a.host ?? "").trim() || !String(a.username ?? "").trim()
  );
  if (incomplete.length > 0) {
    return "Host oder Benutzername fehlt beim aktiven Konto.";
  }
  const fetchable = store.accounts.filter(isMailAccountFetchable);
  if (fetchable.length === 0) {
    return "Kein abrufbares Konto \u2014 Einstellungen pr\xFCfen und erneut speichern.";
  }
  return "Synchronisation nicht m\xF6glich.";
}
async function resetMailStatusCache() {
  return mutateMailStore((s) => {
    s.status = structuredClone(EMPTY_MAIL_STATUS);
  });
}
function toPublicConfigLegacy(store) {
  const first = store.accounts[0];
  if (!first) {
    return {
      enabled: store.navbarEnabled,
      host: "",
      port: 993,
      secure: true,
      username: "",
      hasPassword: false,
      mailbox: "*",
      openUrl: "",
      pollIntervalSeconds: store.pollIntervalSeconds,
      verifyTls: true
    };
  }
  return {
    ...toPublicAccount(first),
    enabled: store.navbarEnabled,
    pollIntervalSeconds: store.pollIntervalSeconds
  };
}

// plugins-pack/mail/lib/sync.ts
var syncInFlight = false;
async function runMailSync(opts) {
  if (syncInFlight) {
    if (!opts?.wait) return;
    for (let i = 0; i < 120 && syncInFlight; i++) {
      await new Promise((r) => setTimeout(r, 250));
    }
    if (syncInFlight) return;
  }
  syncInFlight = true;
  try {
    if (opts?.resetStatus) await resetMailStatusCache();
    const store = await readMailStore();
    if (!store.navbarEnabled) {
      await mutateMailStore((s) => {
        s.status.unread = 0;
        s.status.lastError = void 0;
        s.status.accounts = [];
      });
      return;
    }
    const active = store.accounts.filter(isMailAccountFetchable);
    if (active.length === 0) {
      const blocker = describeMailSyncBlocker(store);
      await mutateMailStore((s) => {
        if (store.accounts.length === 0) {
          s.status.unread = 0;
          s.status.accounts = [];
          s.status.lastError = void 0;
        } else {
          s.status.lastError = blocker;
        }
      });
      return;
    }
    let total = 0;
    const perAccount = [];
    const errors = [];
    for (const account of active) {
      try {
        const result = await fetchUnreadBreakdown(accountToImapConfig(account, store.unreadMaxAgeDays));
        total += result.total;
        perAccount.push({
          id: account.id,
          label: account.label,
          unread: result.total,
          unreadFolders: result.folders.filter((f) => f.unread > 0).slice(0, MAIL_STATUS_MAX_FOLDERS)
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        const msg = formatMailError(raw);
        errors.push(`${account.label}: ${msg}`);
        perAccount.push({ id: account.id, label: account.label, unread: 0, lastError: msg });
        void logMailEvent("sync", msg, { detail: { host: account.host, accountId: account.id, label: account.label, raw } });
      }
    }
    await mutateMailStore((s) => {
      s.status.unread = total;
      s.status.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
      s.status.accounts = perAccount;
      s.status.lastError = errors.length > 0 && total === 0 ? errors.join(" \xB7 ") : void 0;
    });
    if (errors.length > 0) {
      void logMailEvent(
        "sync/partial",
        `${errors.length} Konto/Konten mit Fehler`,
        { level: "warn", detail: { errors: errors.join(" \xB7 ").slice(0, 500), totalUnread: total } }
      );
    }
  } finally {
    syncInFlight = false;
  }
}

// plugins-pack/mail/lib/httpHandlers.ts
function shouldSyncAfterSettingsPut(body) {
  if (body.account && typeof body.account === "object") return true;
  if (typeof body.deleteAccountId === "string") return true;
  if (typeof body.navbarEnabled === "boolean") return true;
  if (typeof body.enabled === "boolean") return true;
  if (typeof body.host === "string" || typeof body.username === "string") return true;
  if (typeof body.pollIntervalSeconds === "number") return true;
  if (typeof body.unreadMaxAgeDays === "number") return true;
  return false;
}
async function handleMailStatus(req) {
  const url = new URL(req.url);
  const force = url.searchParams.get("refresh") === "1";
  try {
    if (force) await runMailSync({ wait: true });
    const store = await readMailStore();
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unread: store.status.unread,
      hasNew: store.navbarEnabled && store.status.unread > 0,
      lastSyncAt: store.status.lastSyncAt,
      lastError: store.status.lastError,
      openUrl: pickOpenUrl(store),
      accounts: store.status.accounts,
      config: toPublicConfigLegacy(store)
    });
  } catch {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 500 });
  }
}
async function handleMailSettingsGet() {
  try {
    const store = await readMailStore();
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unreadMaxAgeDays: store.unreadMaxAgeDays,
      accounts: store.accounts.map(toPublicAccount),
      status: store.status,
      config: toPublicConfigLegacy(store)
    });
  } catch {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 500 });
  }
}
async function handleMailSettingsPut(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  try {
    const store = await mutateMailStore((s) => {
      if (typeof body.navbarEnabled === "boolean") s.navbarEnabled = body.navbarEnabled;
      if (typeof body.enabled === "boolean") s.navbarEnabled = body.enabled;
      if (typeof body.pollIntervalSeconds === "number" && Number.isFinite(body.pollIntervalSeconds)) {
        s.pollIntervalSeconds = clampPollIntervalSeconds(body.pollIntervalSeconds);
      }
      if (typeof body.unreadMaxAgeDays === "number" && Number.isFinite(body.unreadMaxAgeDays)) {
        s.unreadMaxAgeDays = clampUnreadMaxAgeDays(body.unreadMaxAgeDays);
      }
      if (typeof body.deleteAccountId === "string") {
        s.accounts = s.accounts.filter((a) => a.id !== body.deleteAccountId);
        s.status.accounts = s.status.accounts.filter((a) => a.id !== body.deleteAccountId);
      }
      if (body.account && typeof body.account === "object") {
        upsertAccountFromBody(s, body.account);
      } else if (typeof body.host === "string" || typeof body.username === "string") {
        if (s.accounts.length === 0) {
          upsertAccountFromBody(s, { label: "Postfach 1", ...body });
        } else {
          s.accounts[0] = applyAccountUpdate(s.accounts[0], body);
        }
      }
    });
    if (store.navbarEnabled && shouldSyncAfterSettingsPut(body)) {
      await runMailSync();
    } else if (!store.navbarEnabled) {
      await mutateMailStore((s) => {
        s.status.unread = 0;
        s.status.lastError = void 0;
        s.status.accounts = [];
      });
    }
    const updated = await readMailStore();
    return NextResponse.json({
      ok: true,
      navbarEnabled: updated.navbarEnabled,
      pollIntervalSeconds: updated.pollIntervalSeconds,
      unreadMaxAgeDays: updated.unreadMaxAgeDays,
      accounts: updated.accounts.map(toPublicAccount),
      status: updated.status,
      config: toPublicConfigLegacy(updated)
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    void logMailEvent("settings", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
async function handleMailTest(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
  }
  try {
    const store = await readMailStore();
    const merged = resolveAccountFromRequest(store, body, "Test");
    const result = await testImapConnection(accountToImapConfig(merged, store.unreadMaxAgeDays));
    if (!result.ok) {
      void logMailEvent("test", result.error, {
        detail: { accountId: merged.id, label: merged.label, host: merged.host }
      });
      return NextResponse.json({ ok: false, error: formatMailError(result.error) }, { status: 400 });
    }
    let status;
    let openUrl = null;
    const accountKey = typeof body.accountId === "string" && body.accountId || typeof body.id === "string" && body.id || void 0;
    if (accountKey && findAccount(store, accountKey)) {
      await mutateMailStore((s) => {
        persistAccountFromImapTest(s, { ...merged, id: accountKey }, result.unread);
      });
      const fresh = await readMailStore();
      status = fresh.status;
      openUrl = pickOpenUrl(fresh);
    }
    return NextResponse.json({
      ok: true,
      unread: status?.unread ?? result.unread,
      folders: result.folders,
      mode: result.mode,
      status,
      openUrl,
      navbarUpdated: Boolean(status)
    });
  } catch (e) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e));
    void logMailEvent("test", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
async function handleMailUnreadPreview(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
  }
  try {
    const store = await readMailStore();
    const merged = resolveAccountFromRequest(store, body, "Preview");
    const result = await fetchUnreadMessagePreviews(
      accountToImapConfig(merged, store.unreadMaxAgeDays)
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e));
    void logMailEvent("unread-preview", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
async function handleMailMarkAllRead(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
  }
  try {
    const store = await readMailStore();
    const merged = resolveAccountFromRequest(store, body, "Mark read");
    if (!merged.passwordEncrypted?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Passwort fehlt \u2014 bitte speichern oder Testen mit Passwort." },
        { status: 400 }
      );
    }
    const result = await markAllUnreadAsRead(accountToImapConfig(merged, store.unreadMaxAgeDays));
    await runMailSync({ wait: true });
    const fresh = await readMailStore();
    return NextResponse.json({ ok: true, ...result, status: fresh.status });
  } catch (e) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e));
    void logMailEvent("mark-all-read", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
async function handleMailResetCache() {
  try {
    await runMailSync({ wait: true, resetStatus: true });
    const store = await readMailStore();
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unreadMaxAgeDays: store.unreadMaxAgeDays,
      unread: store.status.unread,
      lastSyncAt: store.status.lastSyncAt,
      lastError: store.status.lastError,
      accounts: store.status.accounts,
      openUrl: pickOpenUrl(store),
      config: toPublicConfigLegacy(store)
    });
  } catch (e) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e));
    void logMailEvent("reset-cache", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// plugins-pack/mail/server.ts
async function mailServerHandler(ctx) {
  const [segment] = ctx.path;
  const method = ctx.request.method.toUpperCase();
  if (segment === "status" || ctx.path.length === 0) {
    if (method === "GET") return handleMailStatus(ctx.request);
  }
  if (segment === "settings") {
    if (method === "GET") return handleMailSettingsGet();
    if (method === "PUT") return handleMailSettingsPut(ctx.request);
  }
  if (segment === "test" && method === "POST") {
    return handleMailTest(ctx.request);
  }
  if (segment === "unread-preview" && method === "POST") {
    return handleMailUnreadPreview(ctx.request);
  }
  if (segment === "mark-all-read" && method === "POST") {
    return handleMailMarkAllRead(ctx.request);
  }
  if (segment === "reset-cache" && method === "POST") {
    return handleMailResetCache();
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: ctx.path.join("/") },
    { status: 404 }
  );
}
var server_default = mailServerHandler;
export {
  server_default as default,
  mailServerHandler
};
