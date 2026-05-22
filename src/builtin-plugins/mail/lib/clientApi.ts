'use client'

/** Mail plugin API base (GitHub/volume plugin id: `mail`). */
export const MAIL_PLUGIN_ID = 'mail'

export function mailApiUrl(path: string, query = ''): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `/api/plugins/${MAIL_PLUGIN_ID}${p}${query}`
}
