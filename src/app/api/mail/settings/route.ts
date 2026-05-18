import { NextResponse } from 'next/server'

import { runMailSync } from '@/lib/mail/sync'
import {
  applyAccountUpdate,
  findAccount,
  mutateMailStore,
  readMailStore,
  toPublicAccount,
  toPublicConfigLegacy,
  upsertAccountFromBody,
} from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      accounts: store.accounts.map(toPublicAccount),
      status: store.status,
      config: toPublicConfigLegacy(store),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
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
        s.pollIntervalSeconds = Math.max(60, Math.min(3600, Math.round(body.pollIntervalSeconds)))
      }

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

    if (store.navbarEnabled) {
      await runMailSync()
    } else {
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
      accounts: updated.accounts.map(toPublicAccount),
      status: updated.status,
      config: toPublicConfigLegacy(updated),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
