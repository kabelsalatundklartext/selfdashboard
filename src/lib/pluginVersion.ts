/** Compare semver-like strings (1.2.3, 1.2.3-beta). Returns 1 if a>b, -1 if a<b, 0 if equal. */
export function comparePluginVersion(a: string, b: string): number {
  const pa = parseVersionParts(a)
  const pb = parseVersionParts(b)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}

function parseVersionParts(v: string): number[] {
  const core = v.trim().replace(/^v/i, '').split('+')[0]?.split('-')[0] ?? '0'
  return core.split('.').map((p) => {
    const n = parseInt(p.replace(/[^0-9].*$/, ''), 10)
    return Number.isFinite(n) ? n : 0
  })
}

export function isPluginUpdateAvailable(installed: string | null | undefined, remote: string): boolean {
  if (!installed?.trim()) return false
  return comparePluginVersion(remote, installed) > 0
}
