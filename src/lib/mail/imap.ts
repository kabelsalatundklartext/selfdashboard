import 'server-only'

import { ImapFlow } from 'imapflow'

import { decrypt } from '@/lib/secretCrypto'
import { isAllMailboxes, normalizeMailConnection } from './normalize'
import type { MailConfig } from './types'

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

/** Zählt UNSEEN per SEARCH (zuverlässiger als STATUS bei Synology/MailPlus). */
async function countUnseenInMailbox(client: ImapFlow, path: string): Promise<number> {
  const lock = await client.getMailboxLock(path)
  try {
    const uids = await client.search({ seen: false }, { uid: true })
    return Array.isArray(uids) ? uids.length : 0
  } catch {
    try {
      const status = await client.status(path, { unseen: true })
      return typeof status.unseen === 'number' ? status.unseen : 0
    } catch {
      return 0
    }
  } finally {
    lock.release()
  }
}

async function sumUnreadAllFolders(client: ImapFlow): Promise<number> {
  let total = 0
  const boxes = await client.list()
  const paths: string[] = []

  for (const box of boxes) {
    if (box.flags?.has('\\Noselect')) continue
    paths.push(box.path)
  }

  // Keine Doppelzählung: nur „Blatt“-Ordner (kein anderer Pfad ist Unterordner)
  const leafPaths = paths.filter(
    (p) => !paths.some((other) => other !== p && other.startsWith(`${p}/`)),
  )

  const scan = async (toScan: string[]) => {
    let n = 0
    for (const path of toScan) {
      try {
        n += await countUnseenInMailbox(client, path)
      } catch {
        /* Ordner überspringen */
      }
    }
    return n
  }

  const primary = leafPaths.length > 0 ? leafPaths : paths
  total = await scan(primary)

  // Synology: manchmal liefert nur die flache Gesamtliste Treffer
  if (total === 0 && paths.length > primary.length) {
    total = await scan(paths)
  }

  return total
}

export async function fetchUnreadCount(config: MailConfig): Promise<number> {
  const client = createClient(config)
  await client.connect()
  try {
    if (isAllMailboxes(config.mailbox)) {
      return await sumUnreadAllFolders(client)
    }
    const mailbox = config.mailbox.trim() || 'INBOX'
    return await countUnseenInMailbox(client, mailbox)
  } finally {
    try {
      await client.logout()
    } catch {
      /* connection may already be closed */
    }
  }
}

export async function testImapConnection(config: MailConfig): Promise<{ ok: true; unread: number } | { ok: false; error: string }> {
  try {
    const unread = await fetchUnreadCount(config)
    return { ok: true, unread }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
