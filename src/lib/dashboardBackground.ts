export type DashboardBackgroundMode = 'off' | 'single' | 'dual'

export const DASHBOARD_BG_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

export function parseDashboardBackgroundMode(v: unknown): DashboardBackgroundMode {
  if (v === 'single' || v === 'dual') return v
  return 'off'
}

export function isAllowedDashboardBgFile(file: File): boolean {
  if (/^image\/(jpeg|png|webp)$/i.test(file.type)) return true
  return /\.(jpe?g|png|webp)$/i.test(file.name)
}

export function clampDashboardBackgroundOverlay(raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.round(raw) : 50
  return Math.min(80, Math.max(0, n))
}
