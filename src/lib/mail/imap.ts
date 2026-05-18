import 'server-only'

import { ImapFlow } from 'imapflow'

import { decrypt } from '@/lib/secretCrypto'
import { isAllMailboxes, isMailplusAccountsOnly, normalizeMailConnection } from './normalize'
import type { MailFolderUnread, MailImapConfig } from './types'

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

/** Übergeordnete MailPlus-Ordner weglassen, wenn Unterordner existieren (vermeidet veralteten STATUS-Zähler). */
function preferLeafMailboxPaths(paths: string[]): string[] {
  const leaves = paths.filter(
    p => !paths.some(other => other !== p && (other.startsWith(`${p}/`) || other.startsWith(`${p}.`))),
  )
  return leaves.length > 0 ? leaves : paths
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

/** Zählt echte ungelesene Nachrichten (SEARCH) — STATUS allein ist auf Synology oft veraltet. */
async function countUnreadInMailbox(client: ImapFlow, path: string): Promise<number> {
  try {
    const lock = await client.getMailboxLock(path)
    try {
      const uids = await client.search({ seen: false }, { uid: true })
      return Array.isArray(uids) ? uids.length : 0
    } finally {
      lock.release()
    }
  } catch {
    try {
      const status = await client.status(path, { unseen: true })
      if (typeof status.unseen === 'number') return status.unseen
    } catch {
      /* ignore */
    }
    return 0
  }
}

async function sumUnreadAllFolders(client: ImapFlow, mailbox: string): Promise<MailUnreadResult> {
  const boxes: ListedBox[] = (await client.list())
    .filter(b => !b.flags?.has('\\Noselect'))
    .map(b => ({ path: b.path, flags: b.flags }))

  const { paths: resolved, mode } = resolveScanPaths(boxes, mailbox)
  const toScan =
    mode === 'all-except-trash' || mode === 'synology-accounts' || mode === 'accounts'
      ? preferLeafMailboxPaths(resolved)
      : resolved

  const folders: MailFolderUnread[] = []
  let total = 0

  for (const path of toScan) {
    try {
      const unread = await countUnreadInMailbox(client, path)
      folders.push({ path, unread })
      total += unread
    } catch {
      folders.push({ path, unread: 0 })
    }
  }

  return { total, folders, mode }
}

export async function fetchUnreadBreakdown(config: MailImapConfig): Promise<MailUnreadResult> {
  const client = createClient(config)
  await client.connect()
  try {
    if (isAllMailboxes(config.mailbox)) {
      return await sumUnreadAllFolders(client, config.mailbox)
    }
    const mailbox = config.mailbox.trim() || 'INBOX'
    const unread = await countUnreadInMailbox(client, mailbox)
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
