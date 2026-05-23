import 'server-only'
import { readKioskAccessFromRequest, type KioskAccess } from '@/lib/kiosk/session'

export function isKioskViewRequest(req: Request): boolean {
  if (req.headers.get('x-sd-kiosk-view') !== '1') return false
  return readKioskAccessFromRequest(req) !== null
}

export function getKioskViewAccess(req: Request): KioskAccess | null {
  if (req.headers.get('x-sd-kiosk-view') !== '1') return null
  return readKioskAccessFromRequest(req)
}
