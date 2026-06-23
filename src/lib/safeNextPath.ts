/**
 * Nur interne, gleiche-Origin-Pfade als Redirect-Ziel zulassen. Wehrt
 * protokoll-relative (`//evil.com`) und Backslash-Varianten (`/\evil.com`,
 * die manche Browser wie `//` behandeln) ab — sonst Open Redirect auf einen
 * Fremd-Host.
 */
export function safeNextPath(raw: string | null | undefined): string {
  const fallback = '/dashboard/home'
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  return raw
}
