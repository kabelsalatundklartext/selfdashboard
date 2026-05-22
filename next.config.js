const fs = require('fs')
const path = require('path')

/** Builtin server handlers vendored into src/builtin-plugins (committed for CI/Docker). */
function resolvePluginsRootForBuild() {
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
}

module.exports = nextConfig
