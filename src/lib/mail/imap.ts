import 'server-only'

import { ImapFlow } from 'imapflow'

import { decrypt } from '@/lib/secretCrypto'
import { isAllMailboxes, isMailplusAccountsOnly, normalizeMailConnection } from './normalize'
import type {
  MailFolderUnread,
  MailImapConfig,
  MailUnreadPreviewMessage,
  MailUnreadPreviewResult,
} from './types'
import { formatMailFolderLabel } from './types'

export type MailUnreadResult = {
  total: number
  folders: MailFolderUnread[]
  mode: 'all-except-trash' | 'synology-accounts' | 'accounts' | 'single'
}

type ListedBox = { path: string; flags?: Set<string> }

/** Papierkorb / Trash — bei * alles andere zählen */
function isTrashMailbox(path: string, flags?: Set<string>): boolean {
  if (flags?.has('\\Trash')) return true
  const lower = path.toLowerCase()
  const leaf = (path.includes('/') ? path.split('/').pop() : path) ?? path
  const leafLower = leaf.toLowerCase()
  const trashNames = ['trash', 'papierkorb', 'deleted', 'gelöscht', 'geloescht']
  return trashNames.includes(lower) || trashNames.includes(leafLower)
}

const MAILPLUS_SKIP_SUFFIX = new Set([
  'sent', 'gesendet', 'drafts', 'entwürfe', 'entwurfe', 'trash', 'papierkorb',
  'junk', 'spam', 'archive', 'archiv',
])

function isMailplusExcluded(path: string, flags?: Set<string>): boolean {
  if (isTrashMailbox(path, flags)) return true
  if (flags) {
    if (flags.has('\\Sent') || flags.has('\\Junk') || flags.has('\\Drafts') || flags.has('\\Archive')) {
      return true
    }
  }
  const lower = path.toLowerCase()
  if (lower === 'sent' || lower === 'inbox') return true
  const dot = path.match(/^INBOX\.(.+)$/i)
  if (dot && MAILPLUS_SKIP_SUFFIX.has(dot[1].toLowerCase())) return true
  const leaf = (path.includes('/') ? path.split('/').pop() : path) ?? path
  return MAILPLUS_SKIP_SUFFIX.has(leaf.toLowerCase())
}

function createClient(config: MailImapConfig): ImapFlow {
  const { host, port } = normalizeMailConnection(config.host, config.port)
  if (!host || !config.username || !config.passwordEncrypted) {
    throw new Error('IMAP host, username and password required')
  }

  return new ImapFlow({
    host,
    port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: decrypt(config.passwordEncrypted),
    },
    logger: false,
    tls: { rejectUnauthorized: config.verifyTls },
  })
}

function isInboxRoot(path: string): boolean {
  const name = (path.includes('/') ? path.split('/').pop() : path) ?? path
  const n = name.toLowerCase()
  return n === 'inbox' || n === 'posteingang'
}

function synologyDotAccounts(boxes: ListedBox[]): string[] {
  return boxes
    .filter(b => /^INBOX\./i.test(b.path))
    .filter(b => !isMailplusExcluded(b.path, b.flags))
    .map(b => b.path)
}

function accountFoldersUnderInbox(paths: string[], inboxRoot: string): string[] {
  const prefix = inboxRoot.endsWith('/') ? inboxRoot : `${inboxRoot}/`
  return paths.filter(p => {
    if (!p.startsWith(prefix)) return false
    const rel = p.slice(prefix.length)
    return rel.length > 0 && !rel.includes('/')
  })
}

/** MailPlus: Unterordner per Punkt (INBOX.Konto.alias) oder Schrägstrich. */
function isDescendantMailboxPath(parent: string, child: string): boolean {
  if (parent === child) return false
  return child.startsWith(`${parent}.`) || child.startsWith(`${parent}/`)
}

function resolveScanPaths(boxes: ListedBox[], mailbox: string): { paths: string[]; mode: MailUnreadResult['mode'] } {
  if (isMailplusAccountsOnly(mailbox)) {
    const synology = synologyDotAccounts(boxes)
    if (synology.length > 0) {
      return { paths: synology, mode: 'synology-accounts' }
    }
    const paths = boxes.map(b => b.path)
    for (const root of paths.filter(isInboxRoot)) {
      const accounts = accountFoldersUnderInbox(paths, root).filter(
        p => !isMailplusExcluded(p, boxes.find(b => b.path === p)?.flags),
      )
      if (accounts.length > 0) {
        return { paths: accounts, mode: 'accounts' }
      }
    }
  }

  // Standard bei *: jeder IMAP-Ordner, nur Papierkorb ausnehmen
  const all = boxes.filter(b => !isTrashMailbox(b.path, b.flags)).map(b => b.path)
  return { paths: all, mode: 'all-except-trash' }
}

/** \Noselect — kein SELECT möglich; MailPlus-Konto-Container oft nur per STATUS. */
async function countUnreadViaStatus(client: ImapFlow, path: string): Promise<number> {
  try {
    const status = await client.status(path, { unseen: true })
    if (typeof status.unseen === 'number') return status.unseen
  } catch {
    /* ignore */
  }
  return 0
}

/** Zählt ungelesene per SEARCH; bei Fehler STATUS als Fallback. */
async function countUnreadViaSearch(client: ImapFlow, path: string): Promise<number> {
  try {
    const lock = await client.getMailboxLock(path)
    try {
      const uids = await client.search({ seen: false }, { uid: true })
      return Array.isArray(uids) ? uids.length : 0
    } finally {
      lock.release()
    }
  } catch {
    return countUnreadViaStatus(client, path)
  }
}

async function sumUnreadAllFolders(client: ImapFlow, mailbox: string): Promise<MailUnreadResult> {
  const boxes: ListedBox[] = (await client.list()).map(b => ({ path: b.path, flags: b.flags }))

  const { paths: toScan, mode } = resolveScanPaths(boxes, mailbox)
  const boxByPath = new Map(boxes.map(b => [b.path, b]))

  const noselectRoots = toScan
    .filter(p => boxByPath.get(p)?.flags?.has('\\Noselect'))
    .filter(p => !toScan.some(other => other !== p && isDescendantMailboxPath(other, p)))

  const coveredByNoselect = new Set<string>()
  const folders: MailFolderUnread[] = []
  let total = 0

  for (const path of noselectRoots) {
    const hasOpenableChild = toScan.some(
      p => p !== path && isDescendantMailboxPath(path, p) && !boxByPath.get(p)?.flags?.has('\\Noselect'),
    )
    if (hasOpenableChild) continue

    const unread = await countUnreadViaStatus(client, path)
    folders.push({ path, unread })
    total += unread
    if (unread > 0) coveredByNoselect.add(path)
  }

  for (const path of toScan) {
    if (boxByPath.get(path)?.flags?.has('\\Noselect')) continue
    if ([...coveredByNoselect].some(parent => isDescendantMailboxPath(parent, path))) continue

    try {
      const unread = await countUnreadViaSearch(client, path)
      folders.push({ path, unread })
      total += unread
    } catch {
      folders.push({ path, unread: 0 })
    }
  }

  return { total, folders, mode }
}

const PREVIEW_MAX_TOTAL = 100
const PREVIEW_MAX_PER_FOLDER = 40

function formatFromAddress(from: { name?: string; address?: string } | undefined): string | undefined {
  if (!from?.address) return undefined
  return from.name?.trim() ? `${from.name.trim()} <${from.address}>` : from.address
}

async function listUnreadInMailbox(
  client: ImapFlow,
  path: string,
  max: number,
): Promise<MailUnreadPreviewMessage[]> {
  const out: MailUnreadPreviewMessage[] = []
  const lock = await client.getMailboxLock(path)
  try {
    const found = await client.search({ seen: false }, { uid: true })
    if (!Array.isArray(found) || found.length === 0) return out
    const uids = found.slice(0, max)
    for await (const msg of client.fetch(uids, { envelope: true, uid: true }, { uid: true })) {
      const env = msg.envelope
      out.push({
        folder: path,
        folderLabel: formatMailFolderLabel(path),
        uid: msg.uid,
        subject: (env?.subject && String(env.subject).trim()) || '(no subject)',
        from: formatFromAddress(env?.from?.[0]),
        date: env?.date ? new Date(env.date).toISOString() : undefined,
      })
    }
  } finally {
    lock.release()
  }
  return out
}

async function collectUnreadPreviews(
  client: ImapFlow,
  mailbox: string,
): Promise<MailUnreadPreviewResult> {
  const boxes: ListedBox[] = (await client.list()).map(b => ({ path: b.path, flags: b.flags }))
  const { paths: toScan, mode } = resolveScanPaths(boxes, mailbox)
  const boxByPath = new Map(boxes.map(b => [b.path, b]))

  const noselectRoots = toScan
    .filter(p => boxByPath.get(p)?.flags?.has('\\Noselect'))
    .filter(p => !toScan.some(other => other !== p && isDescendantMailboxPath(other, p)))

  const coveredByNoselect = new Set<string>()
  const folders: MailFolderUnread[] = []
  const messages: MailUnreadPreviewMessage[] = []
  let total = 0
  let truncated = false

  const pushMessages = (batch: MailUnreadPreviewMessage[]) => {
    for (const m of batch) {
      if (messages.length >= PREVIEW_MAX_TOTAL) {
        truncated = true
        return
      }
      messages.push(m)
    }
  }

  for (const path of noselectRoots) {
    const hasOpenableChild = toScan.some(
      p => p !== path && isDescendantMailboxPath(path, p) && !boxByPath.get(p)?.flags?.has('\\Noselect'),
    )
    if (hasOpenableChild) continue

    const unread = await countUnreadViaStatus(client, path)
    folders.push({ path, unread })
    total += unread
    if (unread > 0) {
      coveredByNoselect.add(path)
      pushMessages([{
        folder: path,
        folderLabel: formatMailFolderLabel(path),
        uid: 0,
        subject: `(${unread} unread — folder is Noselect, subjects not available via IMAP)`,
        note: 'noselect',
      }])
    }
  }

  for (const path of toScan) {
    if (boxByPath.get(path)?.flags?.has('\\Noselect')) continue
    if ([...coveredByNoselect].some(parent => isDescendantMailboxPath(parent, path))) continue

    try {
      const unread = await countUnreadViaSearch(client, path)
      folders.push({ path, unread })
      total += unread
      if (unread > 0) {
        const listed = await listUnreadInMailbox(client, path, PREVIEW_MAX_PER_FOLDER)
        if (listed.length < unread) truncated = true
        pushMessages(listed)
      }
    } catch {
      folders.push({ path, unread: 0 })
    }
    if (truncated) break
  }

  return { total, messages, folders, mode, truncated: truncated || undefined }
}

export async function fetchUnreadMessagePreviews(
  config: MailImapConfig,
): Promise<MailUnreadPreviewResult> {
  const client = createClient(config)
  await client.connect()
  try {
    if (isAllMailboxes(config.mailbox)) {
      return await collectUnreadPreviews(client, config.mailbox)
    }
    const mailbox = config.mailbox.trim() || 'INBOX'
    const listed = await client.list()
    const box = listed.find(b => b.path === mailbox)
    if (box?.flags?.has('\\Noselect')) {
      const unread = await countUnreadViaStatus(client, mailbox)
      const messages: MailUnreadPreviewMessage[] = unread > 0
        ? [{
            folder: mailbox,
            folderLabel: formatMailFolderLabel(mailbox),
            uid: 0,
            subject: `(${unread} unread — Noselect, subjects not available)`,
            note: 'noselect',
          }]
        : []
      return {
        total: unread,
        messages,
        folders: [{ path: mailbox, unread }],
        mode: 'single',
      }
    }
    const unread = await countUnreadViaSearch(client, mailbox)
    const messages = unread > 0 ? await listUnreadInMailbox(client, mailbox, PREVIEW_MAX_PER_FOLDER) : []
    return {
      total: unread,
      messages,
      folders: [{ path: mailbox, unread }],
      mode: 'single',
      truncated: unread > messages.length ? true : undefined,
    }
  } finally {
    try {
      await client.logout()
    } catch {
      /* ignore */
    }
  }
}

export async function fetchUnreadBreakdown(config: MailImapConfig): Promise<MailUnreadResult> {
  const client = createClient(config)
  await client.connect()
  try {
    if (isAllMailboxes(config.mailbox)) {
      return await sumUnreadAllFolders(client, config.mailbox)
    }
    const mailbox = config.mailbox.trim() || 'INBOX'
    const listed = await client.list()
    const box = listed.find(b => b.path === mailbox)
    const unread = box?.flags?.has('\\Noselect')
      ? await countUnreadViaStatus(client, mailbox)
      : await countUnreadViaSearch(client, mailbox)
    return { total: unread, folders: [{ path: mailbox, unread }], mode: 'single' }
  } finally {
    try {
      await client.logout()
    } catch {
      /* connection may already be closed */
    }
  }
}

export async function testImapConnection(
  config: MailImapConfig,
): Promise<
  | { ok: true; unread: number; folders: MailFolderUnread[]; mode: MailUnreadResult['mode'] }
  | { ok: false; error: string }
> {
  try {
    const result = await fetchUnreadBreakdown(config)
    return { ok: true, unread: result.total, folders: result.folders, mode: result.mode }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
