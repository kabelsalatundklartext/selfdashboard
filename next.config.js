/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS build config (loaded by Next.js, not bundled) */
const fs = require('fs')
const path = require('path')

/** Plugin server sources for @plugins alias — plugins-pack wins when present. */
function resolvePluginsRootForBuild() {
  const pack = path.join(__dirname, 'plugins-pack')
  const packWeather = path.join(pack, 'weather', 'server.ts')
  if (fs.existsSync(packWeather)) return pack
  const builtin = path.join(__dirname, 'src', 'builtin-plugins')
  if (fs.existsSync(path.join(builtin, 'weather', 'server.ts'))) return builtin
  const inRepo = path.join(__dirname, 'plugins')
  if (fs.existsSync(path.join(inRepo, 'weather', 'server.ts'))) return inRepo
  const sibling = path.join(__dirname, '..', 'plugins')
  if (fs.existsSync(path.join(sibling, 'weather', 'server.ts'))) return sibling
  return builtin
}

const pluginsRoot = resolvePluginsRootForBuild()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'maxmind', 'tsdav', 'ical.js', 'rrule', 'digest-fetch', 'imapflow'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/better-sqlite3/**/*'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@plugins'] = pluginsRoot
    return config
  },
  async headers() {
    // CSP bewusst permissiv bei script-/style-src: Next.js braucht Inline-
    // Bootstrap (Hydration) und Plugin-Widgets werden als same-origin-Skripte
    // (/api/plugins/custom-assets/<id>/widget.js) geladen. Die echten Gewinne
    // sind object-src 'none', base-uri/form-action/frame-ancestors 'self'.
    // img/connect/media erlauben http(s) für LAN-Plugins (Emby, Kameras …).
    // Eine Nonce-basierte Verschärfung von script-src ist ein Folge-Schritt.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: http: ws: wss:",
      "media-src 'self' blob: https: http:",
      "worker-src 'self' blob:",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ')
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'Content-Security-Policy', value: csp },
          // Von Browsern über HTTP ignoriert; greift nur, wenn das Dashboard
          // per HTTPS (z. B. Reverse-Proxy) ausgeliefert wird.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
