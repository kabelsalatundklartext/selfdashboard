import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { requirePluginAccess } from '@/lib/auth/guard'
import { customPluginDir, readInstalledPluginVersion } from '@/lib/pluginVolumeInfo'

export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

function safeFile(name: string): boolean {
  return name === path.basename(name) && !name.includes('..') && name.length > 0
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ pluginId: string; file: string }> },
) {
  const { pluginId, file } = await ctx.params
  const denied = requirePluginAccess(req, pluginId)
  if (denied instanceof NextResponse) return denied
  if (!/^[a-z0-9][a-z0-9-]*$/.test(pluginId) || !safeFile(file)) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400 })
  }

  const dir = customPluginDir(pluginId)
  const abs = path.join(dir, file)
  if (!path.resolve(abs).startsWith(path.resolve(dir)) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ext = path.extname(file).toLowerCase()
  const body = fs.readFileSync(abs)
  const isWidgetAsset = file === 'widget.js' || file === 'widget.css'
  const versionParam = new URL(req.url).searchParams.get('v')?.trim() ?? ''
  const installedVersion = readInstalledPluginVersion(pluginId) ?? ''
  const versionMatches = Boolean(versionParam && installedVersion && versionParam === installedVersion)
  const cacheControl =
    isWidgetAsset && versionMatches
      ? 'private, max-age=31536000, immutable'
      : 'no-store'

  return new NextResponse(body, {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': cacheControl,
    },
  })
}
