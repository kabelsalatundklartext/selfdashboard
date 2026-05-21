import { handleMailSettingsGet, handleMailSettingsPut } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/settings` */
export async function GET() {
  return handleMailSettingsGet()
}

export async function PUT(req: Request) {
  return handleMailSettingsPut(req)
}
