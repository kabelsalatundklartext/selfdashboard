/** Host darf keine :Port enthalten (5000 = DSM-Web, nicht IMAP). */
export function normalizeMailConnection(
  hostInput: string,
  portInput: number,
): { host: string; port: number } {
  let host = hostInput.trim()
  let port = portInput

  if (!host) return { host: '', port }

  // IPv6 in brackets [::1]:993
  const bracket = host.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (bracket) {
    host = bracket[1]
    if (bracket[2]) port = parseInt(bracket[2], 10) || port
    return { host, port: Math.max(1, Math.min(65535, port)) }
  }

  const colon = host.lastIndexOf(':')
  if (colon > 0 && /^\d+$/.test(host.slice(colon + 1))) {
    const parsed = parseInt(host.slice(colon + 1), 10)
    host = host.slice(0, colon)
    if (parsed >= 1 && parsed <= 65535) port = parsed
  }

  return { host: host.trim(), port: Math.max(1, Math.min(65535, port)) }
}

/** * / ALL / leer = alle Ordner außer Papierkorb */
export function isAllMailboxes(mailbox: string | undefined): boolean {
  const m = (mailbox ?? '').trim().toUpperCase()
  return !m || m === '*' || m === 'ALL' || m === 'ALLE' || m === 'ALL_FOLDERS'
}

/** Nur MailPlus-Konten (INBOX.Name) — optional statt * */
export function isMailplusAccountsOnly(mailbox: string | undefined): boolean {
  const m = (mailbox ?? '').trim().toLowerCase()
  return m === '@accounts' || m === 'accounts' || m === 'mailplus' || m === 'konten'
}

/** Gespeicherte Webmail-URL oder Synology-Standard (Port 5000) aus IMAP-Host. */
export function resolveWebmailUrl(
  account: { openUrl?: string; host?: string; port?: number },
): string | null {
  const direct = account.openUrl?.trim()
  if (direct) return direct
  const hostRaw = account.host?.trim()
  if (!hostRaw) return null
  const { host } = normalizeMailConnection(hostRaw, account.port ?? 993)
  if (!host) return null
  return `http://${host}:5000/mail/#inbox`
}
