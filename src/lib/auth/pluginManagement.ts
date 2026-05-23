import 'server-only'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'

/** Pfade, die Plugins auf dem Server verändern (nur Rolle `admin`). */
export const PLUGIN_MANAGEMENT_API_PREFIXES = [
  '/api/plugins/install-remote',
  '/api/plugins/uninstall',
  '/api/plugins/upload-zip',
  '/api/plugins/seed-custom',
  '/api/plugins/reload',
  '/api/plugins/remote-catalog',
] as const

export function isPluginManagementApiPath(pathname: string): boolean {
  return PLUGIN_MANAGEMENT_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/** Middleware + Route: Install, ZIP, Deinstall, Store-Katalog usw. */
export function requirePluginManagement(req: Request) {
  return requireAdmin(req)
}

export type PluginManagementAuth = Exclude<
  ReturnType<typeof requirePluginManagement>,
  NextResponse
>
