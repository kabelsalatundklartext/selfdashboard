import 'server-only'

import { ImapFlow } from 'imapflow'

import { decrypt } from '@/lib/secretCrypto'
import { isAllMailboxes, normalizeMailConnection } from './normalize'
import type { MailConfig } from './types'

export type MailFolderUnread = { path: string; unread: number }

export type MailUnreadResult = {
  total: number
  folders: MailFolderUnread[]
  mode: 'accounts' | 'parents' | 'single'
}

function createClient(config: MailConfig): ImapFlow {
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

/** Wie MailPlus-Sidebar: direkte Kinder von Posteingang/INBOX (Svensen Google, …). */
function accountFoldersUnderInbox(paths: string[], inboxRoot: string): string[] {
  const prefix = inboxRoot.endsWith('/') ? inboxRoot : `${inboxRoot}/`
  return paths.filter(p => {
    if (!p.startsWith(prefix)) return false
    const rel = p.slice(prefix.length)
    return rel.length > 0 && !rel.includes('/')
  })
}

/** Ordner ohne Unterordner in der LISTE (keine tiefen Blätter summieren). */
function parentOnlyPaths(paths: string[]): string[] {
  return paths.filter(p => !paths.some(other => other !== p && other.startsWith(`${p}/`)))
}

function resolveScanPaths(paths: string[]): { paths: string[]; mode: MailUnreadResult['mode'] } {
  for (const root of paths.filter(isInboxRoot)) {
    const accounts = accountFoldersUnderInbox(paths, root)
    if (accounts.length > 0) {
      return { paths: accounts, mode: 'accounts' }
    }
  }

  const parents = parentOnlyPaths(paths)
  if (parents.length > 0) {
    return { paths: parents, mode: 'parents' }
  }

  return { paths, mode: 'parents' }
}

/** STATUS unseen — entspricht meist der Zahl in der Synology-Mail-Oberfläche. */
async function countUnreadInMailbox(client: ImapFlow, path: string): Promise<number> {
  try {
    const status = await client.status(path, { unseen: true })
    if (typeof status.unseen === 'number') return status.unseen
  } catch {
    /* SELECT + SEARCH */
  }

  const lock = await client.getMailboxLock(path)
  try {
    const uids = await client.search({ seen: false }, { uid: true })
    return Array.isArray(uids) ? uids.length : 0
  } catch {
    return 0
  } finally {
    lock.release()
  }
}

async function sumUnreadAllFolders(client: ImapFlow): Promise<MailUnreadResult> {
  const boxes = await client.list()
  const paths = boxes.filter(b => !b.flags?.has('\\Noselect')).map(b => b.path)
  const { paths: toScan, mode } = resolveScanPaths(paths)

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

export async function fetchUnreadBreakdown(config: MailConfig): Promise<MailUnreadResult> {
  const client = createClient(config)
  await client.connect()
  try {
    if (isAllMailboxes(config.mailbox)) {
      return await sumUnreadAllFolders(client)
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

export async function fetchUnreadCount(config: MailConfig): Promise<number> {
  const result = await fetchUnreadBreakdown(config)
  return result.total
}

export async function testImapConnection(
  config: MailConfig,
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
