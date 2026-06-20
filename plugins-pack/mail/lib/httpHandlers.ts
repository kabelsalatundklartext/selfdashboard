import 'server-only'

import { NextResponse } from 'next/server'

import { logMailEvent } from './log'
import { formatMailError } from './errors'
import { testImapConnection, fetchUnreadMessagePreviews, markAllUnreadAsRead } from './imap'
import { runMailSync } from './sync'
import {
  applyAccountUpdate,
  findAccount,
  mutateMailStore,
  persistAccountFromImapTest,
  pickOpenUrl,
  readMailStore,
  resolveAccountFromRequest,
  toPublicAccount,
  toPublicConfigLegacy,
  upsertAccountFromBody,
} from './store'
import { accountToImapConfig, clampPollIntervalSeconds, clampUnreadMaxAgeDays } from './types'

function shouldSyncAfterSettingsPut(body: Record<string, unknown>): boolean {
  if (body.account && typeof body.account === 'object') return true
  if (typeof body.deleteAccountId === 'string') return true
  if (typeof body.navbarEnabled === 'boolean') return true
  if (typeof body.enabled === 'boolean') return true
  if (typeof body.host === 'string' || typeof body.username === 'string') return true
  if (typeof body.pollIntervalSeconds === 'number') return true
  if (typeof body.unreadMaxAgeDays === 'number') return true
  if (typeof body.selfmailerBase === 'string') return true
  if (typeof body.selfmailerToken === 'string') return true
  if (body.clearSelfmailerToken === true) return true
  return false
}

export async function handleMailStatus(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const force = url.searchParams.get('refresh') === '1'
  try {
    if (force) await runMailSync({ wait: true })
    const store = await readMailStore()
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
      config: toPublicConfigLegacy(store),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function handleMailSettingsGet(): Promise<Response> {
  try {
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unreadMaxAgeDays: store.unreadMaxAgeDays,
      accounts: store.accounts.map(toPublicAccount),
      selfmailerBase: store.selfmailerBase ?? '',
      hasSelfmailerToken: Boolean(store.selfmailerToken),
      status: store.status,
      config: toPublicConfigLegacy(store),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function handleMailSettingsPut(req: Request): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  try {
    const store = await mutateMailStore(s => {
      if (typeof body.navbarEnabled === 'boolean') s.navbarEnabled = body.navbarEnabled
      if (typeof body.enabled === 'boolean') s.navbarEnabled = body.enabled
      if (typeof body.pollIntervalSeconds === 'number' && Number.isFinite(body.pollIntervalSeconds)) {
        s.pollIntervalSeconds = clampPollIntervalSeconds(body.pollIntervalSeconds)
      }
      if (typeof body.unreadMaxAgeDays === 'number' && Number.isFinite(body.unreadMaxAgeDays)) {
        s.unreadMaxAgeDays = clampUnreadMaxAgeDays(body.unreadMaxAgeDays)
      }
      if (typeof body.selfmailerBase === 'string') {
        s.selfmailerBase = body.selfmailerBase.trim()
        if (!s.selfmailerBase) s.selfmailerToken = ''  // Quelle geleert -> Token weg
      }
      if (typeof body.selfmailerToken === 'string' && body.selfmailerToken.length > 0) {
        s.selfmailerToken = body.selfmailerToken.trim()  // leer = unveraendert
      }
      if (body.clearSelfmailerToken === true) s.selfmailerToken = ''
      if (typeof body.deleteAccountId === 'string') {
        s.accounts = s.accounts.filter(a => a.id !== body.deleteAccountId)
        s.status.accounts = s.status.accounts.filter(a => a.id !== body.deleteAccountId)
      }
      if (body.account && typeof body.account === 'object') {
        upsertAccountFromBody(s, body.account as Record<string, unknown>)
      } else if (typeof body.host === 'string' || typeof body.username === 'string') {
        if (s.accounts.length === 0) {
          upsertAccountFromBody(s, { label: 'Postfach 1', ...body })
        } else {
          s.accounts[0] = applyAccountUpdate(s.accounts[0], body)
        }
      }
    })
    if (store.navbarEnabled && shouldSyncAfterSettingsPut(body)) {
      await runMailSync()
    } else if (!store.navbarEnabled) {
      await mutateMailStore(s => {
        s.status.unread = 0
        s.status.lastError = undefined
        s.status.accounts = []
      })
    }
    const updated = await readMailStore()
    return NextResponse.json({
      ok: true,
      navbarEnabled: updated.navbarEnabled,
      pollIntervalSeconds: updated.pollIntervalSeconds,
      unreadMaxAgeDays: updated.unreadMaxAgeDays,
      accounts: updated.accounts.map(toPublicAccount),
      selfmailerBase: updated.selfmailerBase ?? '',
      hasSelfmailerToken: Boolean(updated.selfmailerToken),
      status: updated.status,
      config: toPublicConfigLegacy(updated),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    void logMailEvent('settings', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}

export async function handleMailTest(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored */
  }
  try {
    const store = await readMailStore()
    const merged = resolveAccountFromRequest(store, body, 'Test')
    const result = await testImapConnection(accountToImapConfig(merged, store.unreadMaxAgeDays))
    if (!result.ok) {
      void logMailEvent('test', result.error, {
        detail: { accountId: merged.id, label: merged.label, host: merged.host },
      })
      return NextResponse.json({ ok: false, error: formatMailError(result.error) }, { status: 400 })
    }

    let status: Awaited<ReturnType<typeof readMailStore>>['status'] | undefined
    let openUrl: string | null = null
    const accountKey =
      (typeof body.accountId === 'string' && body.accountId) ||
      (typeof body.id === 'string' && body.id) ||
      undefined
    if (accountKey && findAccount(store, accountKey)) {
      await mutateMailStore(s => {
        persistAccountFromImapTest(s, { ...merged, id: accountKey }, result.unread)
      })
      const fresh = await readMailStore()
      status = fresh.status
      openUrl = pickOpenUrl(fresh)
    }

    return NextResponse.json({
      ok: true,
      unread: status?.unread ?? result.unread,
      folders: result.folders,
      mode: result.mode,
      status,
      openUrl,
      navbarUpdated: Boolean(status),
    })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('test', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function handleMailUnreadPreview(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored */
  }
  try {
    const store = await readMailStore()
    const merged = resolveAccountFromRequest(store, body, 'Preview')
    const result = await fetchUnreadMessagePreviews(
      accountToImapConfig(merged, store.unreadMaxAgeDays),
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('unread-preview', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function handleMailMarkAllRead(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored */
  }
  try {
    const store = await readMailStore()
    const merged = resolveAccountFromRequest(store, body, 'Mark read')
    if (!merged.passwordEncrypted?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Passwort fehlt — bitte speichern oder Testen mit Passwort.' },
        { status: 400 },
      )
    }
    const result = await markAllUnreadAsRead(accountToImapConfig(merged, store.unreadMaxAgeDays))
    await runMailSync({ wait: true })
    const fresh = await readMailStore()
    return NextResponse.json({ ok: true, ...result, status: fresh.status })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('mark-all-read', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function handleMailResetCache(): Promise<Response> {
  try {
    await runMailSync({ wait: true, resetStatus: true })
    const store = await readMailStore()
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
      config: toPublicConfigLegacy(store),
    })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('reset-cache', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
