/** Bundle-safe plugin server — routes under /api/plugins/tasks/ */
type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

import {
  applyAccountUpdate,
  badRequest,
  buildAccount,
  buildSummary,
  forbidden,
  html,
  notFound,
  ok,
  taskToView,
  toAccountView,
} from './lib/api-helpers'
import {
  applyGoogleTokens,
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  googleRedirectUri,
} from './lib/google'
import {
  applyMicrosoftTokens,
  buildMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  microsoftRedirectUri,
} from './lib/microsoft'
import { consumeOAuthState, createOAuthState } from './lib/oauth-pending'
import { buildVtodo, newUid } from './lib/vtodo'
import {
  findAccountOwnerUserId,
  mutateUserStore,
  newId,
  nowIso,
  readUserStore,
} from './lib/store'
import { runSync, syncAfterMutation, testAccount } from './lib/sync'
export { startScheduler, stopScheduler } from './lib/sync'
import type { AccountCreateBody, AccountUpdateBody, ListUpdateBody, TaskCreateBody, TaskUpdateBody } from './lib/types'
import { isOAuthProvider } from './lib/types'
import { resolveTasksViewer, type TasksViewer } from './lib/viewer'

async function loadStore(viewer: TasksViewer) {
  return readUserStore(viewer.userId)
}

async function handleSummaryGet(viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  return ok(buildSummary(store))
}

async function handleStatusGet(viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  const pending = store.tasks.filter(
    (t) =>
      t.syncState === 'local_new' || t.syncState === 'local_modified' || t.syncState === 'local_deleted',
  ).length
  return ok({
    accounts: store.accounts.map((a) => toAccountView(a, store.lists)),
    lists: store.lists.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      name: l.name,
      visible: l.visible,
      readOnly: l.readOnly,
    })),
    pendingChanges: pending,
    recentRuns: store.syncLog.slice(0, 10),
  })
}

async function handleAccountsGet(viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  return ok(store.accounts.map((a) => toAccountView(a, store.lists)))
}

async function handleAccountsPost(req: Request, viewer: TasksViewer): Promise<Response> {
  let body: AccountCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (!body?.name) return badRequest('name required')
  let accountId = ''
  try {
    const account = buildAccount(body, viewer.userId)
    accountId = account.id
    await mutateUserStore(viewer.userId, (s) => {
      s.accounts.push(account)
    })
  } catch (e: unknown) {
    return badRequest(e instanceof Error ? e.message : 'invalid body')
  }
  const createdAccount = (await readUserStore(viewer.userId)).accounts.find((a) => a.id === accountId)
  if (createdAccount && !isOAuthProvider(createdAccount.provider)) {
    runSync(accountId).catch(() => undefined)
  }
  const store = await readUserStore(viewer.userId)
  const created = store.accounts.find((a) => a.id === accountId)!
  return ok(toAccountView(created, store.lists))
}

async function handleAccountPut(req: Request, id: string, viewer: TasksViewer): Promise<Response> {
  const owner = await findAccountOwnerUserId(id)
  if (!owner || owner !== viewer.userId) return forbidden('not allowed')
  let body: AccountUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let found = false
  await mutateUserStore(viewer.userId, (s) => {
    const a = s.accounts.find((x) => x.id === id)
    if (!a) return
    found = true
    applyAccountUpdate(a, body)
  })
  if (!found) return notFound('account not found')
  runSync(id).catch(() => undefined)
  const store = await readUserStore(viewer.userId)
  const acc = store.accounts.find((a) => a.id === id)!
  return ok(toAccountView(acc, store.lists))
}

async function handleAccountDelete(id: string, viewer: TasksViewer): Promise<Response> {
  const owner = await findAccountOwnerUserId(id)
  if (!owner || owner !== viewer.userId) return forbidden('not allowed')
  await mutateUserStore(viewer.userId, (s) => {
    s.accounts = s.accounts.filter((a) => a.id !== id)
    const listIds = new Set(s.lists.filter((l) => l.accountId === id).map((l) => l.id))
    s.lists = s.lists.filter((l) => l.accountId !== id)
    s.tasks = s.tasks.filter((t) => !listIds.has(t.listId))
  })
  return ok({ ok: true })
}

async function handleAccountSyncPost(id: string, viewer: TasksViewer): Promise<Response> {
  const owner = await findAccountOwnerUserId(id)
  if (!owner || owner !== viewer.userId) return forbidden('not allowed')
  const log = await runSync(id)
  return ok(log)
}

async function handleAccountTestPost(id: string, viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  const account = store.accounts.find((a) => a.id === id)
  if (!account) return notFound('account not found')
  const result = await testAccount(account)
  return ok(result)
}

async function handleListsGet(viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  return ok(store.lists)
}

async function handleListPut(req: Request, id: string, viewer: TasksViewer): Promise<Response> {
  let body: ListUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let found = false
  await mutateUserStore(viewer.userId, (s) => {
    const l = s.lists.find((x) => x.id === id)
    if (!l) return
    found = true
    if (typeof body.visible === 'boolean') l.visible = body.visible
  })
  if (!found) return notFound('list not found')
  const store = await loadStore(viewer)
  return ok(store.lists.find((l) => l.id === id))
}

async function handleTasksGet(req: Request, viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  const url = new URL(req.url)
  const listId = url.searchParams.get('listId')?.trim()
  const showCompleted = url.searchParams.get('showCompleted') === '1'
  let tasks = store.tasks.filter((t) => t.syncState !== 'local_deleted')
  if (listId) tasks = tasks.filter((t) => t.listId === listId)
  else {
    const visible = new Set(store.lists.filter((l) => l.visible).map((l) => l.id))
    tasks = tasks.filter((t) => visible.has(t.listId))
  }
  if (!showCompleted) tasks = tasks.filter((t) => !t.completed)
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.summary.localeCompare(b.summary, undefined, { sensitivity: 'base' })
  })
  return ok(
    tasks.map((t) => taskToView(t, store.lists.find((l) => l.id === t.listId))),
  )
}

async function handleTasksPost(req: Request, viewer: TasksViewer): Promise<Response> {
  let body: TaskCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (!body.listId || !body.summary?.trim()) return badRequest('listId and summary required')
  const store = await loadStore(viewer)
  const list = store.lists.find((l) => l.id === body.listId)
  if (!list) return notFound('list not found')
  if (list.readOnly) return forbidden('list is read-only')

  const account = store.accounts.find((a) => a.id === list.accountId)
  const useCalDav = account?.provider === 'caldav'

  const uid = newUid()
  const now = nowIso()
  const ical = useCalDav
    ? buildVtodo({ uid, summary: body.summary.trim(), completed: false, due: body.due, lastModifiedIso: now })
    : ''
  let createdId = ''
  await mutateUserStore(viewer.userId, (s) => {
    const liveList = s.lists.find((l) => l.id === body.listId)
    if (!liveList || liveList.readOnly) return
    createdId = newId('tsk')
    s.tasks.push({
      id: createdId,
      listId: body.listId,
      uid,
      icalData: ical,
      summary: body.summary.trim(),
      completed: false,
      due: body.due,
      localModifiedAt: now,
      syncState: 'local_new',
    })
  })
  if (!createdId) return forbidden('cannot create task')
  if (account) {
    const syncError = await syncAfterMutation(account.id, { listIds: [list.id] })
    const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId)!
    return ok({ ...taskToView(updated, list), syncError })
  }
  const task = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId)!
  return ok(taskToView(task, list))
}

async function handleTaskPut(req: Request, id: string, viewer: TasksViewer): Promise<Response> {
  let body: TaskUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  const store = await loadStore(viewer)
  const existing = store.tasks.find((t) => t.id === id)
  if (!existing) return notFound('task not found')
  const list = store.lists.find((l) => l.id === existing.listId)
  if (!list || list.readOnly) return forbidden('list is read-only')

  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id)
    if (!t) return
    if (body.summary !== undefined) t.summary = body.summary.trim() || t.summary
    if (typeof body.completed === 'boolean') t.completed = body.completed
    if (body.due === null) t.due = undefined
    else if (body.due !== undefined) t.due = body.due
    t.localModifiedAt = nowIso()
    if (t.syncState === 'synced') t.syncState = 'local_modified'
  })

  const account = store.accounts.find((a) => a.id === list.accountId)
  if (account) {
    const syncError = await syncAfterMutation(account.id, { listIds: [list.id] })
    const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id)!
    return ok({ ...taskToView(updated, list), syncError })
  }
  const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id)!
  return ok(taskToView(updated, list))
}

async function handleTaskDelete(id: string, viewer: TasksViewer): Promise<Response> {
  const store = await loadStore(viewer)
  const existing = store.tasks.find((t) => t.id === id)
  if (!existing) return notFound('task not found')
  const list = store.lists.find((l) => l.id === existing.listId)
  if (!list || list.readOnly) return forbidden('list is read-only')

  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id)
    if (!t) return
    if (t.syncState === 'local_new') {
      s.tasks = s.tasks.filter((x) => x.id !== id)
    } else {
      t.syncState = 'local_deleted'
      t.localModifiedAt = nowIso()
    }
  })

  const account = store.accounts.find((a) => a.id === list.accountId)
  if (account) await syncAfterMutation(account.id, { listIds: [list.id] })
  return ok({ ok: true })
}

async function handleGoogleAuthUrlPost(req: Request, id: string, viewer: TasksViewer): Promise<Response> {
  const owner = await findAccountOwnerUserId(id)
  if (!owner || owner !== viewer.userId) return forbidden('not allowed')
  const store = await loadStore(viewer)
  const account = store.accounts.find((a) => a.id === id)
  if (!account || account.provider !== 'google') return badRequest('not a google account')
  const state = createOAuthState(viewer.userId, id)
  const url = buildGoogleAuthUrl(req, account, state)
  return ok({ url })
}

async function handleGoogleCallbackGet(req: Request): Promise<Response> {
  const viewer = resolveTasksViewer(req)
  const url = new URL(req.url)
  const code = url.searchParams.get('code')?.trim()
  const state = url.searchParams.get('state')?.trim()
  const err = url.searchParams.get('error')?.trim()

  const failHtml = (msg: string) =>
    html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`,
    )

  if (err) return failHtml(`Google: ${err}`)
  if (!code || !state) return failHtml('OAuth fehlgeschlagen — code/state fehlt')
  if (!viewer) return failHtml('Nicht angemeldet — zuerst im Dashboard einloggen')

  const pending = consumeOAuthState(state)
  if (!pending || pending.userId !== viewer.userId) return failHtml('OAuth-State ungültig oder abgelaufen')

  const store = await readUserStore(viewer.userId)
  const account = store.accounts.find((a) => a.id === pending.accountId)
  if (!account || account.provider !== 'google') return failHtml('Konto nicht gefunden')

  try {
    const redirectUri = googleRedirectUri(req)
    const tokens = await exchangeGoogleCode(account, code, redirectUri)
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending.accountId)
      if (!acc || acc.provider !== 'google') return
      applyGoogleTokens(acc, tokens)
    })
    runSync(pending.accountId).catch(() => undefined)
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Google Tasks verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return failHtml(msg)
  }
}

async function handleMicrosoftAuthUrlPost(req: Request, id: string, viewer: TasksViewer): Promise<Response> {
  const owner = await findAccountOwnerUserId(id)
  if (!owner || owner !== viewer.userId) return forbidden('not allowed')
  const store = await loadStore(viewer)
  const account = store.accounts.find((a) => a.id === id)
  if (!account || account.provider !== 'microsoft') return badRequest('not a microsoft account')
  const state = createOAuthState(viewer.userId, id)
  const url = buildMicrosoftAuthUrl(req, account, state)
  return ok({ url })
}

async function handleMicrosoftCallbackGet(req: Request): Promise<Response> {
  const viewer = resolveTasksViewer(req)
  const url = new URL(req.url)
  const code = url.searchParams.get('code')?.trim()
  const state = url.searchParams.get('state')?.trim()
  const err = url.searchParams.get('error')?.trim()
  const errDesc = url.searchParams.get('error_description')?.trim()

  const failHtml = (msg: string) =>
    html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`,
    )

  if (err) return failHtml(`Microsoft: ${errDesc || err}`)
  if (!code || !state) return failHtml('OAuth fehlgeschlagen — code/state fehlt')
  if (!viewer) return failHtml('Nicht angemeldet — zuerst im Dashboard einloggen')

  const pending = consumeOAuthState(state)
  if (!pending || pending.userId !== viewer.userId) return failHtml('OAuth-State ungültig oder abgelaufen')

  const store = await readUserStore(viewer.userId)
  const account = store.accounts.find((a) => a.id === pending.accountId)
  if (!account || account.provider !== 'microsoft') return failHtml('Konto nicht gefunden')

  try {
    const redirectUri = microsoftRedirectUri(req)
    const tokens = await exchangeMicrosoftCode(account, code, redirectUri)
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending.accountId)
      if (!acc || acc.provider !== 'microsoft') return
      applyMicrosoftTokens(acc, tokens)
    })
    runSync(pending.accountId).catch(() => undefined)
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Microsoft To Do verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return failHtml(msg)
  }
}

export async function tasksServerHandler(ctx: PluginServerContext): Promise<Response> {
  const method = ctx.request.method.toUpperCase()
  const path = ctx.path
  const [a, b, c] = path

  if (a === 'google' && b === 'callback' && path.length === 2 && method === 'GET') {
    return handleGoogleCallbackGet(ctx.request)
  }
  if (a === 'microsoft' && b === 'callback' && path.length === 2 && method === 'GET') {
    return handleMicrosoftCallbackGet(ctx.request)
  }

  const viewer = resolveTasksViewer(ctx.request)
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 })

  if (a === 'summary' && method === 'GET' && path.length === 1) return handleSummaryGet(viewer)
  if (a === 'status' && method === 'GET' && path.length === 1) return handleStatusGet(viewer)

  if (a === 'accounts' && path.length === 1) {
    if (method === 'GET') return handleAccountsGet(viewer)
    if (method === 'POST') return handleAccountsPost(ctx.request, viewer)
  }
  if (a === 'accounts' && b && path.length === 2) {
    if (method === 'PUT') return handleAccountPut(ctx.request, b, viewer)
    if (method === 'DELETE') return handleAccountDelete(b, viewer)
  }
  if (a === 'accounts' && b && c === 'sync' && path.length === 3 && method === 'POST') {
    return handleAccountSyncPost(b, viewer)
  }
  if (a === 'accounts' && b && c === 'test' && path.length === 3 && method === 'POST') {
    return handleAccountTestPost(b, viewer)
  }
  if (a === 'accounts' && b && c === 'google' && path[3] === 'auth-url' && path.length === 4 && method === 'POST') {
    return handleGoogleAuthUrlPost(ctx.request, b, viewer)
  }
  if (a === 'accounts' && b && c === 'microsoft' && path[3] === 'auth-url' && path.length === 4 && method === 'POST') {
    return handleMicrosoftAuthUrlPost(ctx.request, b, viewer)
  }

  if (a === 'lists' && path.length === 1 && method === 'GET') return handleListsGet(viewer)
  if (a === 'lists' && b && path.length === 2 && method === 'PUT') return handleListPut(ctx.request, b, viewer)

  if (a === 'tasks' && path.length === 1) {
    if (method === 'GET') return handleTasksGet(ctx.request, viewer)
    if (method === 'POST') return handleTasksPost(ctx.request, viewer)
  }
  if (a === 'tasks' && b && path.length === 2) {
    if (method === 'PUT') return handleTaskPut(ctx.request, b, viewer)
    if (method === 'DELETE') return handleTaskDelete(b, viewer)
  }

  return Response.json({ error: 'not_found', pluginId: ctx.pluginId, path: path.join('/') }, { status: 404 })
}

export default tasksServerHandler
