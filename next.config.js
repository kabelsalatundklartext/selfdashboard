const fs = require('fs')
const path = require('path')

/** Plugin server sources for @plugins alias — plugins-pack wins when present. */
function resolvePluginsRootForBuild() {
  const pack = path.join(__dirname, 'plugins-pack')
  const packWeather = path.join(pack, 'weather', 'server.ts')
  const packTasks = path.join(pack, 'tasks', 'server.ts')
  if (fs.existsSync(packWeather) || fs.existsSync(packTasks)) return pack
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
        ],
      },
    ]
  },
}

module.exports = nextConfig
