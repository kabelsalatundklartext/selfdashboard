import { NextResponse } from 'next/server'
import {
  buildKioskAccess,
  getKioskConfig,
  loadKioskDashboardBundle,
} from '@/lib/kiosk/config'
import { issueKioskToken, applyKioskCookie, kioskAccessGranted } from '@/lib/kiosk/session'
import { sealDashboardSecrets } from '@/lib/widgetSecrets'
import { isSealedSecret } from '@/lib/secretCrypto'

export const dynamic = 'force-dynamic'

// Browser-direct widgets (unraid, emby, …) keep their credentials in plaintext
// config so the browser can use them. The kiosk view may be public, so blank any
// secret-looking plaintext config value. Sealed values (sdsec1:, ciphertext) stay —
// they are encrypted and the server-side plugin proxy still needs them.
const SECRET_KEY_RE = /pass|pwd|token|secret|apikey|api[_-]?key|credential|(^|_)key$|(^|_)sid$/i

function redactPlaintextSecrets(state: unknown): unknown {
  if (!state || typeof state !== 'object') return state
  const s = state as { dashboards?: unknown[] }
  if (!Array.isArray(s.dashboards)) return state
  return {
    ...s,
    dashboards: s.dashboards.map((d) => {
      const dash = d as { plugins?: unknown[] }
      if (!dash || !Array.isArray(dash.plugins)) return d
      return {
        ...dash,
        plugins: dash.plugins.map((p) => {
          const plugin = p as { config?: Record<string, unknown> }
          if (!plugin || typeof plugin.config !== 'object' || !plugin.config) return p
          let changed = false
          const config: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(plugin.config)) {
            if (SECRET_KEY_RE.test(k) && typeof v === 'string' && v && !isSealedSecret(v)) {
              config[k] = ''
              changed = true
            } else {
              config[k] = v
            }
          }
          return changed ? { ...plugin, config } : p
        }),
      }
    }),
  }
}

export async function GET(req: Request) {
  const { config, state, pluginIds } = await loadKioskDashboardBundle()
  if (!config.enabled) {
    return NextResponse.json({ error: 'kiosk_disabled' }, { status: 503 })
  }
  if (!state) {
    return NextResponse.json({ error: 'dashboard_not_found' }, { status: 404 })
  }

  const access = buildKioskAccess(config, pluginIds)
  if (!access) return NextResponse.json({ error: 'kiosk_unavailable' }, { status: 503 })

  if (config.passwordHash) {
    const granted = kioskAccessGranted(req, config)
    if (!granted) {
      return NextResponse.json({ error: 'password_required' }, { status: 401 })
    }
  }

  // Never expose plaintext widget secrets to the (possibly public) kiosk view:
  // seal what can be sealed, then blank any remaining plaintext secret-looking fields.
  const res = NextResponse.json(redactPlaintextSecrets(sealDashboardSecrets(state).state))
  const granted = kioskAccessGranted(req, config)
  if (config.passwordHash) {
    if (granted) {
      applyKioskCookie(res, issueKioskToken(granted, true, config), config)
    }
  } else {
    applyKioskCookie(res, issueKioskToken(access, false, config), config)
  }
  return res
}
