import { ImapFlow } from 'imapflow'

import { decrypt } from '@/lib/calendar/crypto'
import type { MailConfig } from './types'

export async function fetchUnreadCount(config: MailConfig): Promise<number> {
  if (!config.host || !config.username || !config.passwordEncrypted) {
    throw new Error('IMAP host, username and password required')
  }

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: decrypt(config.passwordEncrypted),
    },
    logger: false,
    tls: { rejectUnauthorized: config.verifyTls },
  })

  await client.connect()
  try {
    const mailbox = config.mailbox || 'INBOX'
    const status = await client.status(mailbox, { unseen: true })
    return typeof status.unseen === 'number' ? status.unseen : 0
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
