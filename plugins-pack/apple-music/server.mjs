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
function sealSecret(plaintext) {
  if (!plaintext) return "";
  const key = primaryKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
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

// plugins-pack/apple-music/server.ts
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { join as join3 } from "node:path";
import { createHash, createPrivateKey, sign as signData } from "node:crypto";
var dynamic = "force-dynamic";
var TOKEN_TTL_SEC = 150 * 24 * 60 * 60;
var TOKEN_SKEW_SEC = 24 * 60 * 60;
function storeDir() {
  return join3(dataDir(), "apple-music");
}
function storeKey(teamId, keyId) {
  return createHash("sha256").update(`${teamId.trim()}:${keyId.trim()}`).digest("hex").slice(0, 24);
}
function storePath(key) {
  return join3(storeDir(), `${key}.json`);
}
async function readStore(key) {
  try {
    const raw = await readFile(storePath(key), "utf8");
    const j = JSON.parse(raw);
    return j && typeof j === "object" && typeof j.teamId === "string" ? j : null;
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
function b64url(input) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function buildDeveloperToken(privateKeyPem, teamId, keyId) {
  let key;
  try {
    key = createPrivateKey({ key: privateKeyPem });
  } catch {
    throw new Error("invalid_key");
  }
  const now = Math.floor(Date.now() / 1e3);
  const exp = now + TOKEN_TTL_SEC;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: teamId, iat: now, exp }));
  const signingInput = `${header}.${payload}`;
  const signature = signData("SHA256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
  return { token: `${signingInput}.${b64url(signature)}`, exp };
}
function ensureDeveloperToken(key, record) {
  const now = Math.floor(Date.now() / 1e3);
  if (record.developerToken && record.tokenExp && record.tokenExp - TOKEN_SKEW_SEC > now) {
    return { token: record.developerToken, exp: record.tokenExp };
  }
  const pem = openSealedSecret(record.privateKey);
  if (!pem) throw new Error("secret_unreadable");
  const minted = buildDeveloperToken(pem, record.teamId, record.keyId);
  record.developerToken = minted.token;
  record.tokenExp = minted.exp;
  void writeStore(key, record);
  return minted;
}
function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}
async function handleSave(body) {
  const teamId = String(body.teamId ?? "").trim();
  const keyId = String(body.keyId ?? "").trim();
  const privateKey = openSealedSecret(String(body.privateKey ?? "").trim()) || String(body.privateKey ?? "").trim();
  const appName = String(body.appName ?? "").trim() || void 0;
  if (!teamId || !keyId || !privateKey) return jsonResponse({ error: "missing_credentials" }, 400);
  let minted;
  try {
    minted = buildDeveloperToken(privateKey, teamId, keyId);
  } catch {
    return jsonResponse({ error: "invalid_key" }, 400);
  }
  const key = storeKey(teamId, keyId);
  await writeStore(key, {
    teamId,
    keyId,
    privateKey: sealSecret(privateKey),
    appName,
    developerToken: minted.token,
    tokenExp: minted.exp,
    updatedAt: ""
  });
  return jsonResponse({ ok: true, tokenExp: minted.exp });
}
async function handleStatus(body) {
  const teamId = String(body.teamId ?? "").trim();
  const keyId = String(body.keyId ?? "").trim();
  if (!teamId || !keyId) return jsonResponse({ configured: false });
  const record = await readStore(storeKey(teamId, keyId));
  return jsonResponse({ configured: Boolean(record?.privateKey), tokenExp: record?.tokenExp });
}
async function handleToken(body) {
  const teamId = String(body.teamId ?? "").trim();
  const keyId = String(body.keyId ?? "").trim();
  if (!teamId || !keyId) return jsonResponse({ error: "not_configured" }, 400);
  const key = storeKey(teamId, keyId);
  const record = await readStore(key);
  if (!record?.privateKey) return jsonResponse({ error: "not_configured" }, 400);
  const { token, exp } = ensureDeveloperToken(key, record);
  return jsonResponse({ developerToken: token, exp, appName: record.appName });
}
async function handleDisconnect(body) {
  const teamId = String(body.teamId ?? "").trim();
  const keyId = String(body.keyId ?? "").trim();
  if (teamId && keyId) await deleteStore(storeKey(teamId, keyId));
  return jsonResponse({ ok: true });
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const action = String(body.action ?? "token");
  try {
    switch (action) {
      case "save":
        return await handleSave(body);
      case "status":
        return await handleStatus(body);
      case "token":
      case "developer-token":
        return await handleToken(body);
      case "disconnect":
        return await handleDisconnect(body);
      default:
        return jsonResponse({ error: "invalid_action" }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "invalid_key" || msg === "secret_unreadable" || msg === "not_configured") {
      void logPluginApiFailure("apple-music", action, msg);
      return jsonResponse({ error: msg }, msg === "secret_unreadable" ? 401 : 400);
    }
    void logPluginApiFailure("apple-music", action, msg);
    return jsonResponse({ error: "server_error" }, 500);
  }
}
function appleMusicServerHandler(ctx) {
  if (ctx.request.method !== "POST") {
    return Promise.resolve(jsonResponse({ error: "method_not_allowed" }, 405));
  }
  return handlePost(ctx.request);
}
export {
  appleMusicServerHandler as default,
  dynamic
};
