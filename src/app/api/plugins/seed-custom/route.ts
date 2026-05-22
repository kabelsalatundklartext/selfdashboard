import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Volume-only: use Plugin Store or ZIP upload instead of image stubs. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'volume_mode',
      hint: 'Plugins über den Store installieren oder ZIP hochladen.',
    },
    { status: 400 },
  )
}
