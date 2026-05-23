import 'server-only'
import { access, copyFile, mkdir, readFile, rename, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { legacyDashboardPath, userDashboardPath } from '@/lib/auth/paths'

/** Copy legacy `dashboard.json` into the first admin user folder (once). */
export async function migrateLegacyDashboard(adminUserId: string): Promise<'migrated' | 'skipped' | 'none'> {
  const target = userDashboardPath(adminUserId)
  try {
    await access(target)
    return 'skipped'
  } catch {
    /* target missing — continue */
  }

  const legacy = legacyDashboardPath()
  try {
    await access(legacy)
  } catch {
    return 'none'
  }

  const raw = await readFile(legacy, 'utf8')
  await mkdir(dirname(target), { recursive: true })
  const tmp = `${target}.tmp`
  await writeFile(tmp, raw, 'utf8')
  try {
    await rename(tmp, target)
  } catch {
    await copyFile(tmp, target)
  }
  const backup = `${legacy}.pre-auth-migrated`
  try {
    await rename(legacy, backup)
  } catch {
    /* keep legacy if rename fails */
  }
  return 'migrated'
}
