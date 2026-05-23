import { NextResponse } from 'next/server'
import { requirePluginManagement } from '@/lib/auth/pluginManagement'
import { installPluginZipBuffer } from '@/lib/pluginZipInstall'
import { reloadCustomPluginServers } from '@/lib/pluginCustomServer'
import { reloadPluginCatalog } from '@/lib/pluginScan'
import { getWidgetLoadedIdsForCatalog } from '@/lib/pluginCatalogIds'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requirePluginManagement(req)
  if (auth instanceof NextResponse) return auth
  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  }
  const buf = Buffer.from(await (file as Blob).arrayBuffer())
  if (buf.length < 10 || buf.length > 80 * 1024 * 1024) {
    return NextResponse.json({ error: 'invalid_size' }, { status: 400 })
  }

  const { installed, errors } = installPluginZipBuffer(buf)
  await reloadCustomPluginServers()

  const catalog = reloadPluginCatalog(getWidgetLoadedIdsForCatalog())

  return NextResponse.json({
    ok: true,
    installed,
    errors,
    hint: 'Hard-refresh the browser (Ctrl+F5) after widget.js changes.',
    plugins: catalog,
  })
}
