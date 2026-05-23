import { NextResponse } from 'next/server'
import { requirePluginManagement } from '@/lib/auth/pluginManagement'

export const dynamic = 'force-dynamic'

/** Volume-only: use Plugin Store or ZIP upload instead of image stubs. */
export async function POST(req: Request) {
  const auth = requirePluginManagement(req)
  if (auth instanceof NextResponse) return auth
  return NextResponse.json(
    {
      ok: false,
      error: 'volume_mode',
      hint: 'Plugins über den Store installieren oder ZIP hochladen.',
    },
    { status: 400 },
  )
}
